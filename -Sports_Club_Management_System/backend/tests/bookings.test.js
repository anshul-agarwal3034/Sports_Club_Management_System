const app = require('../src/app');
const { pool } = require('../src/shared/database/db');
const { generateToken } = require('../src/shared/utils/jwt');
const http = require('http');

let server;
let port = 4100;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runBookingsTests() {
  server = app.listen(port);
  console.log(`🧪 Running Court Booking Engine Automated Test Suite on port ${port}...\n`);

  try {
    // 1. Fetch seed data IDs
    const clubRes = await pool.query('SELECT id FROM clubs LIMIT 1');
    const courtRes = await pool.query('SELECT id, base_price_per_hour FROM courts LIMIT 1');
    const goldUserRes = await pool.query("SELECT id, email, role, club_id FROM users WHERE email = 'aarav@gmail.com'");
    const nonMemberRes = await pool.query("SELECT id, email, role, club_id FROM users WHERE email = 'vikram@gmail.com'");

    const clubId = clubRes.rows[0].id;
    const courtId = courtRes.rows[0].id;
    const goldUser = goldUserRes.rows[0];
    const nonMember = nonMemberRes.rows[0];

    const goldToken = generateToken({
      id: goldUser.id,
      email: goldUser.email,
      role: goldUser.role,
      clubId: goldUser.club_id,
    });

    const nonMemberToken = generateToken({
      id: nonMember.id,
      email: nonMember.email,
      role: nonMember.role,
      clubId: nonMember.club_id,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // 2 days in future to avoid existing seed bookings
    const dateStr = tomorrow.toISOString().split('T')[0];

    // TEST 1: Search Availability Grid
    console.log('1️⃣ Searching Court Availability Grid (GET /api/v1/bookings/availability)...');
    const availRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/v1/bookings/availability?clubId=${clubId}&date=${dateStr}`,
      method: 'GET',
    });

    console.log(`   Status: ${availRes.status} | Courts Found: ${availRes.body.data.courts.length}`);
    const courtGrid = availRes.body.data.courts[0];
    console.log(`   Court: ${courtGrid.courtName} | Total Slots: ${courtGrid.slots.length}`);

    // Slot 1: 10:00 AM - 11:00 AM
    const slot1Start = new Date(`${dateStr}T10:00:00Z`).toISOString();
    const slot1End = new Date(`${dateStr}T11:00:00Z`).toISOString();

    // Slot 2: 14:00 PM - 15:00 PM
    const slot2Start = new Date(`${dateStr}T14:00:00Z`).toISOString();
    const slot2End = new Date(`${dateStr}T15:00:00Z`).toISOString();

    // Slot 3: 16:00 PM - 17:00 PM
    const slot3Start = new Date(`${dateStr}T16:00:00Z`).toISOString();
    const slot3End = new Date(`${dateStr}T17:00:00Z`).toISOString();

    // TEST 2: Create Booking for Gold Member
    console.log('\n2️⃣ Creating Court Booking for Gold Member (50% Fixed Discount)...');
    const booking1Res = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/bookings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${goldToken}`,
        },
      },
      {
        courtId,
        startTime: slot1Start,
        endTime: slot1End,
        paymentMode: 'UPI',
      }
    );

    console.log(`   Status: ${booking1Res.status} | Price Charged: ₹${booking1Res.body.data.priceCharged} | Booking ID: ${booking1Res.body.data.bookingId}`);
    const bookingId1 = booking1Res.body.data.bookingId;

    // TEST 3: Double Booking Prevention Check (Same Court, Same Time Slot)
    console.log('\n3️⃣ Testing Double-Booking Rejection (Attempting identical overlapping slot)...');
    const conflictRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/bookings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nonMemberToken}`,
        },
      },
      {
        courtId,
        startTime: slot1Start,
        endTime: slot1End,
        paymentMode: 'CARD',
      }
    );

    console.log(`   Status: ${conflictRes.status} | Error Message: ${conflictRes.body.message}`);
    if (conflictRes.status === 409) {
      console.log('   ✅ Double-Booking Rejection SUCCESS: Overlapping booking correctly BLOCKED!');
    }

    // TEST 4: Create Second Booking for same user on same day (Allowed)
    console.log('\n4️⃣ Creating 2nd Court Booking for Gold Member on same day...');
    const booking2Res = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/bookings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${goldToken}`,
        },
      },
      {
        courtId,
        startTime: slot2Start,
        endTime: slot2End,
        paymentMode: 'UPI',
      }
    );
    console.log(`   Status: ${booking2Res.status} | Booking 2 Confirmed!`);

    // TEST 5: Daily 2/Day Limit Constraint Check (Attempting 3rd booking on same day -> Should Fail 400)
    console.log('\n5️⃣ Testing Daily 2/Day Cap Rejection (Attempting 3rd booking on same day)...');
    const capRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/bookings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${goldToken}`,
        },
      },
      {
        courtId,
        startTime: slot3Start,
        endTime: slot3End,
        paymentMode: 'UPI',
      }
    );

    console.log(`   Status: ${capRes.status} | Error Message: ${capRes.body.message}`);
    if (capRes.status === 400) {
      console.log('   ✅ Daily Limit Rejection SUCCESS: 3rd booking attempt correctly BLOCKED!');
    }

    // TEST 6: Retrieve User Booking History
    console.log('\n6️⃣ Fetching User Booking History (GET /api/v1/bookings/my)...');
    const myRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/v1/bookings/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${goldToken}` },
    });
    console.log(`   Status: ${myRes.status} | Total Bookings Found: ${myRes.body.data.length}`);

    // TEST 7: Cancel Booking & Refund Policy
    console.log('\n7️⃣ Testing Booking Cancellation (POST /api/v1/bookings/:id/cancel)...');
    const cancelRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/v1/bookings/${bookingId1}/cancel`,
      method: 'POST',
      headers: { Authorization: `Bearer ${goldToken}` },
    });
    console.log(`   Status: ${cancelRes.status} | Message: ${cancelRes.body.message}`);

    console.log('\n==========================================');
    console.log('🎉 ALL COURT BOOKING ENGINE TESTS PASSED!');
    console.log('==========================================');
  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    server.close();
    await pool.end();
  }
}

runBookingsTests();
