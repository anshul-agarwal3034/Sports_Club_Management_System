const { pool } = require('../../shared/database/db');

class CanteenRepository {
  /**
   * Get client from pool for transaction management
   */
  async getClient() {
    return await pool.connect();
  }

  /**
   * Create an order header row
   */
  async createOrderHeader(client, { clubId, userId, tableNumber, status, totalAmount, discountApplied, finalAmount, paymentMode }) {
    const query = `
      INSERT INTO orders (
        club_id, user_id, table_number, status, total_amount, discount_applied, final_amount, payment_mode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      clubId,
      userId || null,
      tableNumber || 'Takeaway',
      status || 'NEW',
      totalAmount,
      discountApplied || 0.00,
      finalAmount,
      paymentMode === 'MEMBER_TAB' ? 'PAY_LATER' : paymentMode,
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  /**
   * Create order items
   */
  async createOrderItem(client, { orderId, productId, quantity, unitPrice, totalPrice }) {
    const query = `
      INSERT INTO order_items (
        order_id, product_id, quantity, unit_price, total_price
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [orderId, productId, quantity, unitPrice, totalPrice];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  /**
   * Deduct stock for product atomically
   */
  async deductStock(client, productId, quantity) {
    const query = `
      UPDATE products
      SET stock_quantity = stock_quantity - $2
      WHERE id = $1 AND stock_quantity >= $2
      RETURNING *;
    `;
    const { rows } = await client.query(query, [productId, quantity]);
    return rows[0] || null;
  }

  /**
   * Restore stock for product (e.g. order cancelled)
   */
  async restoreStock(client, productId, quantity) {
    const query = `
      UPDATE products
      SET stock_quantity = stock_quantity + $2
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await client.query(query, [productId, quantity]);
    return rows[0] || null;
  }

  /**
   * Update user pay-later credit balance
   */
  async updateUserPayLaterBalance(client, userId, amountToAdd) {
    const query = `
      UPDATE users
      SET current_pay_later_balance = current_pay_later_balance + $2
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await client.query(query, [userId, amountToAdd]);
    return rows[0];
  }

  /**
   * Insert unified financial ledger transaction
   */
  async createTransaction(client, { clubId, userId, incomeSource, paymentMode, grossAmount, referenceId }) {
    const query = `
      INSERT INTO transactions (
        club_id, user_id, income_source, payment_mode, gross_amount, platform_commission, net_club_amount, reference_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const platformCommission = 0.00; // Canteen revenue goes 100% to club
    const netClubAmount = grossAmount - platformCommission;
    const values = [
      clubId,
      userId || null,
      incomeSource || 'CANTEEN',
      paymentMode === 'MEMBER_TAB' ? 'PAY_LATER' : paymentMode,
      grossAmount,
      platformCommission,
      netClubAmount,
      referenceId,
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status) {
    const query = `
      UPDATE orders
      SET status = $2
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [orderId, status]);
    return rows[0] || null;
  }

  /**
   * Find order with its order items
   */
  async findOrderWithItems(orderId) {
    const orderQuery = `
      SELECT o.*, u.full_name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1;
    `;
    const { rows: orderRows } = await pool.query(orderQuery, [orderId]);
    if (orderRows.length === 0) return null;

    const order = orderRows[0];

    const itemsQuery = `
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1;
    `;
    const { rows: itemRows } = await pool.query(itemsQuery, [orderId]);

    return this.mapOrderToDto(order, itemRows);
  }

  /**
   * Fetch active kitchen queue orders (KDS screen)
   */
  async getActiveKitchenOrders(clubId) {
    const query = `
      SELECT o.*, u.full_name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.club_id = $1 AND o.status != 'SERVED' AND o.status != 'CANCELLED'
      ORDER BY o.created_at ASC;
    `;
    const { rows: orderRows } = await pool.query(query, [clubId]);

    const result = [];
    for (const order of orderRows) {
      const itemsQuery = `
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1;
      `;
      const { rows: itemRows } = await pool.query(itemsQuery, [order.id]);
      result.push(this.mapOrderToDto(order, itemRows));
    }

    return result;
  }

  /**
   * Fetch all club orders
   */
  async getClubOrders(clubId) {
    const query = `
      SELECT o.*, u.full_name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.club_id = $1
      ORDER BY o.created_at DESC;
    `;
    const { rows: orderRows } = await pool.query(query, [clubId]);

    const result = [];
    for (const order of orderRows) {
      const itemsQuery = `
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1;
      `;
      const { rows: itemRows } = await pool.query(itemsQuery, [order.id]);
      result.push(this.mapOrderToDto(order, itemRows));
    }

    return result;
  }

  /**
   * Map order DB rows to standard DTO matching frontend interface
   */
  mapOrderToDto(orderRow, itemRows) {
    return {
      id: orderRow.id,
      club_id: orderRow.club_id,
      table_number: orderRow.table_number || 'Takeaway',
      user_id: orderRow.user_id,
      user_name: orderRow.user_name || 'Guest Player',
      items: itemRows.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
      })),
      total_amount: parseFloat(orderRow.total_amount),
      discount_amount: parseFloat(orderRow.discount_applied || 0),
      net_amount: parseFloat(orderRow.final_amount),
      payment_mode: orderRow.payment_mode === 'PAY_LATER' ? 'MEMBER_TAB' : orderRow.payment_mode,
      status: orderRow.status,
      created_at: orderRow.created_at,
    };
  }
}

module.exports = new CanteenRepository();
