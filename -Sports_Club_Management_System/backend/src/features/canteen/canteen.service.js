const canteenRepository = require('./canteen.repository');
const inventoryRepository = require('../inventory/inventory.repository');
const authRepository = require('../auth/auth.repository');
const clubsRepository = require('../clubs/clubs.repository');

class CanteenService {
  /**
   * Create a new canteen/POS order
   */
  async createOrder(createOrderDto, requestingUser) {
    const { items, paymentMode = 'UPI', tableNumber, userId } = createOrderDto;

    const clubId = createOrderDto.clubId || requestingUser?.clubId;
    if (!clubId) {
      const err = new Error('Club ID is required to place a canteen order.');
      err.statusCode = 400;
      throw err;
    }

    const club = await clubsRepository.findClubById(clubId);
    if (club && club.has_canteen === false) {
      const err = new Error('Canteen service is not offered or currently disabled for this club.');
      err.statusCode = 400;
      throw err;
    }

    const targetUserId = userId || requestingUser?.id;

    // Connect DB client for transactional integrity
    const client = await canteenRepository.getClient();

    try {
      await client.query('BEGIN');

      let totalAmount = 0;
      const verifiedItems = [];

      // 1. Lock and verify products & stock
      for (const item of items) {
        const product = await inventoryRepository.findByIdForUpdate(client, item.productId);
        if (!product) {
          const err = new Error(`Product with ID '${item.productId}' not found.`);
          err.statusCode = 404;
          throw err;
        }

        if (product.stock < item.quantity) {
          const err = new Error(
            `Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}.`
          );
          err.statusCode = 400;
          throw err;
        }

        const unitPrice = product.price;
        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;

        verifiedItems.push({
          product,
          quantity: item.quantity,
          unitPrice,
          itemTotal,
        });
      }

      // 2. Pay Later / Member Tab Credit Balance Validation
      if (paymentMode === 'PAY_LATER' || paymentMode === 'MEMBER_TAB') {
        if (!targetUserId) {
          const err = new Error('User ID is required for Member Tab / Pay-Later orders.');
          err.statusCode = 400;
          throw err;
        }

        const user = await authRepository.findById(targetUserId);
        if (!user) {
          const err = new Error('User account not found for Member Tab checkout.');
          err.statusCode = 404;
          throw err;
        }

        const creditLimit = parseFloat(user.credit_limit || 0);
        const currentBalance = parseFloat(user.current_pay_later_balance || 0);
        const newBalance = currentBalance + totalAmount;

        if (creditLimit <= 0) {
          const err = new Error('Pay-Later / Member Tab is not enabled for your account tier.');
          err.statusCode = 403;
          throw err;
        }

        if (newBalance > creditLimit) {
          const err = new Error(
            `Credit limit exceeded. Current Pay-Later Balance: ₹${currentBalance}, Order Amount: ₹${totalAmount}, Limit: ₹${creditLimit}.`
          );
          err.statusCode = 400;
          throw err;
        }

        // Increment user's pay-later balance
        await canteenRepository.updateUserPayLaterBalance(client, targetUserId, totalAmount);
      }

      // 3. Deduct Stock for each item
      for (const item of verifiedItems) {
        const updated = await canteenRepository.deductStock(client, item.product.id, item.quantity);
        if (!updated) {
          const err = new Error(`Failed to deduct stock for '${item.product.name}'.`);
          err.statusCode = 400;
          throw err;
        }
      }

      // 4. Create Order Header
      const orderHeader = await canteenRepository.createOrderHeader(client, {
        clubId,
        userId: targetUserId,
        tableNumber: tableNumber || 'Takeaway',
        status: 'NEW',
        totalAmount,
        discountApplied: 0.00,
        finalAmount: totalAmount,
        paymentMode,
      });

      // 5. Insert Order Items
      for (const item of verifiedItems) {
        await canteenRepository.createOrderItem(client, {
          orderId: orderHeader.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.itemTotal,
        });
      }

      // 6. Record Ledger Transaction
      await canteenRepository.createTransaction(client, {
        clubId,
        userId: targetUserId,
        incomeSource: 'CANTEEN',
        paymentMode,
        grossAmount: totalAmount,
        referenceId: orderHeader.id,
      });

      await client.query('COMMIT');

      // 7. Return complete order DTO
      return await canteenRepository.findOrderWithItems(orderHeader.id);

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get Active Kitchen KDS tickets
   */
  async getActiveKitchenQueue(clubId) {
    return await canteenRepository.getActiveKitchenOrders(clubId);
  }

  /**
   * Get all club orders
   */
  async getClubOrders(clubId) {
    return await canteenRepository.getClubOrders(clubId);
  }

  /**
   * Update order status in KDS pipeline
   */
  async updateOrderStatus(orderId, nextStatus) {
    const existingOrder = await canteenRepository.findOrderWithItems(orderId);
    if (!existingOrder) {
      const err = new Error(`Order with ID '${orderId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // If changing to CANCELLED, restore stock
    if (nextStatus === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
      const client = await canteenRepository.getClient();
      try {
        await client.query('BEGIN');
        for (const item of existingOrder.items) {
          await canteenRepository.restoreStock(client, item.product_id, item.quantity);
        }
        await canteenRepository.updateOrderStatus(orderId, 'CANCELLED');
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      await canteenRepository.updateOrderStatus(orderId, nextStatus);
    }

    return await canteenRepository.findOrderWithItems(orderId);
  }
}

module.exports = new CanteenService();
