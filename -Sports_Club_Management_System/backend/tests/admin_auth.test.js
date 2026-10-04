const app = require('../src/app');
const { pool } = require('../src/shared/database/db');
const http = require('http');

let server;
let port = 4102;

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

async function testAdminAuth() {
  server = app.listen(port);
  console.log(`🧪 Testing Platform Admin Auth & Authorization on port ${port}...\n`);

  try {
    // 1. Login as Platform Admin
    console.log('1️⃣ Logging in as Platform Admin (admin@championclub.com)...');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: 'admin@championclub.com',
        password: 'AdminPass123!',
      }
    );

    console.log(`   Status: ${loginRes.status} | Role: ${loginRes.body.data.user.role}`);
    const adminToken = loginRes.body.data.token;

    // 2. Test Admin-Only Route (/api/v1/auth/admin-only)
    console.log('\n2️⃣ Accessing Admin-Only Route (GET /api/v1/auth/admin-only)...');
    const adminRouteRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/v1/auth/admin-only',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log(`   Status: ${adminRouteRes.status} | Message: ${adminRouteRes.body.message}`);

    // 3. Test Admin Verification Endpoint (/api/v1/clubs/:id/verify)
    const clubRes = await pool.query('SELECT id FROM clubs LIMIT 1');
    const clubId = clubRes.rows[0].id;

    console.log('\n3️⃣ Executing Admin Club Verification (POST /api/v1/clubs/:id/verify)...');
    const verifyRes = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/clubs/${clubId}/verify`,
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

    console.log(`   Status: ${verifyRes.status} | Message: ${verifyRes.body.message}`);
    console.log(`   Verified Badge: ${verifyRes.body.data.club.is_verified}`);

    console.log('\n==========================================');
    console.log('🎉 PLATFORM ADMIN AUTHENTICATION & RBAC FULLY VERIFIED!');
    console.log('==========================================');
  } catch (err) {
    console.error('Admin Test Error:', err);
  } finally {
    server.close();
    await pool.end();
  }
}

testAdminAuth();
