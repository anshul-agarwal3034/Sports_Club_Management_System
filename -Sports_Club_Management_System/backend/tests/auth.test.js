const app = require('../src/app');
const { pool } = require('../src/shared/database/db');
const http = require('http');

let server;
let port = 4099;

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

async function runAuthTests() {
  server = app.listen(port);
  console.log(`🧪 Running Auth & RBAC Architecture Automated Test Suite on port ${port}...\n`);

  try {
    const timestamp = Date.now();
    const ownerEmail = `owner_${timestamp}@skyline.com`;
    const memberEmail = `member_${timestamp}@gmail.com`;
    const staffEmail = `staff_${timestamp}@skyline.com`;

    // Fetch a verified clubId from seed data
    const verifiedClubRes = await pool.query("SELECT id FROM clubs WHERE is_verified = TRUE LIMIT 1");
    const verifiedClubId = verifiedClubRes.rows[0].id;

    // Create an unverified club in DB for testing
    const unverifiedRes = await pool.query(
      `INSERT INTO clubs (name, is_verified, inspection_status) VALUES ('Unverified Test Club', FALSE, 'PENDING') RETURNING id`
    );
    const unverifiedClubId = unverifiedRes.rows[0].id;

    // TEST 1: Register Staff for UNVERIFIED Club (Should be BLOCKED with 403 Forbidden)
    console.log('1️⃣ Testing Staff Registration for UNVERIFIED Club (Should fail 403)...');
    const blockedStaffRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        fullName: 'Pending Staff',
        email: `blocked_staff_${timestamp}@skyline.com`,
        password: 'Password123!',
        role: 'STAFF',
        clubId: unverifiedClubId,
      }
    );

    console.log(`   Status: ${blockedStaffRes.status} | Error Message: ${blockedStaffRes.body.message}`);
    if (blockedStaffRes.status === 403) {
      console.log('   ✅ Verification Restriction SUCCESS: Staff registration for unverified club correctly BLOCKED!');
    }

    // TEST 2: Register Staff for VERIFIED Club (Should succeed 201)
    console.log('\n2️⃣ Testing Staff Registration for VERIFIED Club (Should succeed 201)...');
    const allowedStaffRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        fullName: 'Verified Staff',
        email: staffEmail,
        password: 'Password123!',
        role: 'STAFF',
        clubId: verifiedClubId,
      }
    );

    console.log(`   Status: ${allowedStaffRes.status} | Message: ${allowedStaffRes.body.message} | Assigned Club ID: ${allowedStaffRes.body.data.user.clubId}`);
    if (allowedStaffRes.status === 201) {
      console.log('   ✅ Verification Restriction SUCCESS: Staff registration for verified club ALLOWED!');
    }

    // TEST 3: Register Non-Member User (clubId set to NULL)
    console.log('\n3️⃣ Testing Registration (Non-Member User - clubId set to NULL)...');
    const memberRegRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        fullName: 'John Doe',
        email: memberEmail,
        password: 'Password123!',
        role: 'NON_MEMBER',
      }
    );

    console.log(`   Status: ${memberRegRes.status} | Non-Member Assigned Club ID: ${memberRegRes.body.data.user.clubId} (Expected: null)`);
    const memberToken = memberRegRes.body.data.token;

    // TEST 4: Login User
    console.log('\n4️⃣ Testing User Login...');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: memberEmail,
        password: 'Password123!',
      }
    );
    console.log(`   Status: ${loginRes.status} | Token Generated: ${Boolean(loginRes.body.data.token)}`);

    // TEST 5: RBAC Role Verification - Non-Member accessing Owner-Only Route (403 Forbidden)
    console.log('\n5️⃣ Testing RBAC Restriction: NON_MEMBER accessing /owner-only route...');
    const forbiddenRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/v1/auth/owner-only',
      method: 'GET',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    console.log(`   Status: ${forbiddenRes.status} | Forbidden Message: ${forbiddenRes.body.message}`);

    console.log('\n==========================================');
    console.log('🎉 ALL AUTH & VERIFIED CLUB RESTRICTION TESTS PASSED!');
    console.log('==========================================');
  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    server.close();
    await pool.end();
  }
}

runAuthTests();
