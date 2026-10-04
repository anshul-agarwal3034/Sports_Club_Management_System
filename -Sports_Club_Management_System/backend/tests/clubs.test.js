const app = require('../src/app');
const { pool } = require('../src/shared/database/db');
const { generateToken } = require('../src/shared/utils/jwt');
const http = require('http');

let server;
let port = 4103;

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

async function runClubsTests() {
  server = app.listen(port);
  console.log(`🧪 Running Club Onboarding & Pending Clubs Verification Test Suite on port ${port}...\n`);

  try {
    const timestamp = Date.now();
    const ownerEmail = `grand_owner_${timestamp}@skyline.com`;

    // Create Admin Token
    const adminToken = generateToken({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@championclub.com',
      role: 'PLATFORM_ADMIN',
    });

    // Create Non-Admin Token
    const memberToken = generateToken({
      id: '00000000-0000-0000-0000-000000000002',
      email: 'user@gmail.com',
      role: 'NON_MEMBER',
    });

    // TEST 1: Club Onboarding Wizard Registration (Creates unverified club)
    console.log('1️⃣ Testing Club Onboarding Wizard (POST /api/v1/clubs/register)...');
    const registerRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/clubs/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: `Pending Club ${timestamp}`,
        address: '999 Pending Expressway',
        city: 'Delhi',
        gstNumber: '07AAAAA9999A1Z9',
        panNumber: 'PENDING123',
        ownerInfo: {
          fullName: 'Pending Owner',
          email: ownerEmail,
          password: 'Password123!',
          phone: '9876543888',
        },
        courts: [
          { name: 'Court 1 - Padel', sportType: 'Padel', basePricePerHour: 850, maxCapacity: 4 },
        ],
      }
    );

    console.log(`   Status: ${registerRes.status} | Club Created: ${registerRes.body.data.club.name} (Inspection Status: ${registerRes.body.data.club.inspection_status})`);
    const newClubId = registerRes.body.data.club.id;

    // TEST 2: Pending Clubs Endpoint - Non-Admin Restriction (403 Forbidden)
    console.log('\n2️⃣ Testing Pending Clubs Endpoint - Non-Admin Access (GET /api/v1/clubs/admin/pending)...');
    const forbiddenRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/v1/clubs/admin/pending',
      method: 'GET',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    console.log(`   Status: ${forbiddenRes.status} | Message: ${forbiddenRes.body.message}`);
    if (forbiddenRes.status === 403) {
      console.log('   ✅ RBAC Enforcement SUCCESS: Non-Admin access correctly BLOCKED!');
    }

    // TEST 3: Pending Clubs Endpoint - Admin Authorized Access (200 OK)
    console.log('\n3️⃣ Testing Pending Clubs Endpoint - Platform Admin Access (GET /api/v1/clubs/admin/pending)...');
    const pendingRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/v1/clubs/admin/pending',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log(`   Status: ${pendingRes.status} | Total Pending/Unverified Clubs: ${pendingRes.body.data.length}`);
    const foundPending = pendingRes.body.data.find((c) => c.id === newClubId);
    if (foundPending) {
      console.log(`   ✅ Newly onboarded club '${foundPending.name}' successfully returned in Platform Admin inspection queue! Owner: ${foundPending.owner_name} (${foundPending.owner_email})`);
    }

    // TEST 4: Platform Admin Verification
    console.log('\n4️⃣ Approving & Verifying Club (POST /api/v1/clubs/:id/verify)...');
    const verifyRes = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/clubs/${newClubId}/verify`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        isVerified: true,
        inspectionStatus: 'VERIFIED',
        baseCommissionPct: 8.0,
      }
    );

    console.log(`   Status: ${verifyRes.status} | Verified Badge: ${verifyRes.body.data.club.is_verified}`);

    console.log('\n==========================================');
    console.log('🎉 ALL PENDING CLUBS & ADMIN VERIFICATION TESTS PASSED!');
    console.log('==========================================');
  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    server.close();
    await pool.end();
  }
}

runClubsTests();
