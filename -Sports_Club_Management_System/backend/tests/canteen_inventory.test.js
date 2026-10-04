const { pool } = require('../src/shared/database/db');
const inventoryService = require('../src/features/inventory/inventory.service');
const canteenService = require('../src/features/canteen/canteen.service');
const authRepository = require('../src/features/auth/auth.repository');

async function runTests() {
  console.log('🧪 Starting Canteen POS, KDS & Inventory Integration Tests...\n');

  let testClubId;
  let testUserId;
  let testProductId;
  let testOrderId;

  try {
    // 1. Setup Test Club and User
    console.log('🔹 1. Setting up Test Club and Gold Member User...');
    const clubRes = await pool.query(`
      INSERT INTO clubs (name, address, city, is_verified, inspection_status)
      VALUES ('Canteen Test Arena', '100 Food Court Way', 'Mumbai', true, 'VERIFIED')
      RETURNING id;
    `);
    testClubId = clubRes.rows[0].id;

    const userRes = await pool.query(`
      INSERT INTO users (club_id, role, full_name, email, password_hash, credit_limit, current_pay_later_balance)
      VALUES ($1, 'MEMBER', 'Canteen Tester', $2, 'hash123', 2000.00, 0.00)
      RETURNING id;
    `, [testClubId, `canteen_test_${Date.now()}@gmail.com`]);
    testUserId = userRes.rows[0].id;

    console.log(`✅ Test Club created ID: ${testClubId}`);
    console.log(`✅ Test User created ID: ${testUserId} with Credit Limit ₹2,000.00\n`);

    // 2. Test Product Creation
    console.log('🔹 2. Testing Product Creation...');
    const product = await inventoryService.createProduct(testClubId, {
      name: 'Power Protein Shake',
      category: 'CANTEEN',
      price: 150.00,
      stockQuantity: 20,
      isRental: false,
      lowStockThreshold: 5,
    });
    testProductId = product.id;

    console.log(`✅ Product Created: ${product.name}, Stock: ${product.stock}, Price: ₹${product.price}`);
    console.assert(product.stock === 20, 'Initial stock should be 20');
    console.assert(product.price === 150.00, 'Price should be 150');

    // 3. Test Restock
    console.log('\n🔹 3. Testing Restock...');
    const restocked = await inventoryService.restock(testProductId, 10);
    console.log(`✅ Restocked +10 units. New Stock: ${restocked.stock}`);
    console.assert(restocked.stock === 30, 'Restocked stock should be 30');

    // 4. Test Place Order with MEMBER_TAB
    console.log('\n🔹 4. Testing Canteen Order Placement via MEMBER_TAB (Credit Check)...');
    const order = await canteenService.createOrder({
      clubId: testClubId,
      tableNumber: 'Table 5',
      userId: testUserId,
      items: [{ productId: testProductId, quantity: 2 }], // 2 * 150 = 300
      paymentMode: 'MEMBER_TAB',
    }, { id: testUserId, clubId: testClubId });

    testOrderId = order.id;
    console.log(`✅ Order Placed successfully! Order ID: ${order.id}`);
    console.log(`   Table: ${order.table_number}, Total Amount: ₹${order.net_amount}, Status: ${order.status}`);
    console.assert(order.net_amount === 300.00, 'Net amount should be 300');
    console.assert(order.status === 'NEW', 'Initial status should be NEW');

    // Verify Stock Deduction
    const updatedProd = await inventoryService.getProductById(testProductId);
    console.log(`✅ Stock after order: ${updatedProd.stock} (Deducted 2 from 30)`);
    console.assert(updatedProd.stock === 28, 'Stock should be 28');

    // Verify Pay Later Balance Update
    const userAfter = await authRepository.findById(testUserId);
    console.log(`✅ User Pay-Later Balance: ₹${userAfter.current_pay_later_balance} (Limit: ₹${userAfter.credit_limit})`);
    console.assert(parseFloat(userAfter.current_pay_later_balance) === 300.00, 'Pay-Later balance should be 300');

    // 5. Test Exceeding Credit Limit Guardrail
    console.log('\n🔹 5. Testing Exceeding Credit Limit Guardrail (Should Reject)...');
    try {
      await canteenService.createOrder({
        clubId: testClubId,
        tableNumber: 'Table 5',
        userId: testUserId,
        items: [{ productId: testProductId, quantity: 15 }], // 15 * 150 = 2250 -> 300 + 2250 = 2550 > 2000
        paymentMode: 'MEMBER_TAB',
      }, { id: testUserId, clubId: testClubId });
      console.error('❌ FAIL: Expected credit limit error was not thrown');
    } catch (err) {
      console.log(`✅ PASS: Correctly rejected with error: "${err.message}"`);
    }

    // 6. Test Kitchen KDS Queue & Status Transitions
    console.log('\n🔹 6. Testing Kitchen Display System (KDS) Status Pipeline...');
    let activeQueue = await canteenService.getActiveKitchenQueue(testClubId);
    console.log(`✅ Active Kitchen Queue count: ${activeQueue.length}`);
    console.assert(activeQueue.length === 1, 'Active queue should have 1 order');

    // Transition to PREPARING
    let updatedOrder = await canteenService.updateOrderStatus(testOrderId, 'PREPARING');
    console.log(`✅ Order status updated to: ${updatedOrder.status}`);
    console.assert(updatedOrder.status === 'PREPARING', 'Status should be PREPARING');

    // Transition to READY
    updatedOrder = await canteenService.updateOrderStatus(testOrderId, 'READY');
    console.log(`✅ Order status updated to: ${updatedOrder.status}`);
    console.assert(updatedOrder.status === 'READY', 'Status should be READY');

    // Transition to SERVED
    updatedOrder = await canteenService.updateOrderStatus(testOrderId, 'SERVED');
    console.log(`✅ Order status updated to: ${updatedOrder.status}`);
    console.assert(updatedOrder.status === 'SERVED', 'Status should be SERVED');

    // Verify Active Queue now excludes SERVED orders
    activeQueue = await canteenService.getActiveKitchenQueue(testClubId);
    console.log(`✅ Active Kitchen Queue count after SERVED: ${activeQueue.length}`);
    console.assert(activeQueue.length === 0, 'Active queue should be 0 after SERVED');

    console.log('\n🎉 ALL CANTEEN POS & INVENTORY TESTS PASSED CLEANLY!\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    // Clean up test data
    if (testClubId) {
      await pool.query(`DELETE FROM orders WHERE club_id = $1;`, [testClubId]);
      await pool.query(`DELETE FROM clubs WHERE id = $1;`, [testClubId]);
    }
    await pool.end();
  }
}

runTests();
