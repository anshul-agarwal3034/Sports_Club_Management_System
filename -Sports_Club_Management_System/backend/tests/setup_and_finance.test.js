const http = require('http');
const app = require('../src/app');
const { query } = require('../src/shared/database/db');
const { generateToken } = require('../src/shared/utils/jwt');

function makeRequest(server, method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  console.log(`🧪 Running Setup & Finance Test Suite on port ${port}...\n`);

  try {
    const ownerRes = await query(`SELECT id, club_id FROM users WHERE role = 'CLUB_OWNER' LIMIT 1`);
    const owner = ownerRes.rows[0];
    const clubId = owner.club_id;

    const ownerToken = generateToken({
      id: owner.id,
      email: 'owner@test.com',
      role: 'CLUB_OWNER',
      clubId,
    });

    console.log('--- TEST GROUP 1: SETUP DRAFT & VALIDATION ---');

    // 1. Save Setup Draft
    console.log('1️⃣ Testing Setup Draft Save (PUT /api/v1/clubs/:id/setup/draft)...');
    const draftRes = await makeRequest(
      server,
      'PUT',
      `/api/v1/clubs/${clubId}/setup/draft`,
      {
        step: 2,
        draftData: {
          clubName: 'Draft Arena',
          city: 'Indore',
          sports: [{ sportName: 'Badminton', courts: [{ courtName: 'Court 1', hourlyRate: 400 }] }],
        },
      },
      ownerToken
    );
    console.log(`   Status: ${draftRes.status} | Step: ${draftRes.body?.data?.setup_step}`);
    if (draftRes.status !== 200) throw new Error('Failed to save setup draft');

    // 2. Reject Submission with < 3 photos per sport
    console.log('2️⃣ Testing Photo Requirement Validation (Must fail if < 3 photos per sport)...');
    const invalidSubmitRes = await makeRequest(
      server,
      'POST',
      `/api/v1/clubs/${clubId}/setup/submit`,
      {
        clubName: 'Draft Arena',
        address: '123 Main St',
        city: 'Indore',
        legalBusinessName: 'Draft Arena LLC',
        businessType: 'Private Limited Company',
        sports: [
          {
            sportName: 'Badminton',
            images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'], // ONLY 2 PHOTOS!
            courts: [{ courtName: 'Court 1', hourlyRate: 400 }],
          },
        ],
      },
      ownerToken
    );
    console.log(`   Status: ${invalidSubmitRes.status} | Error: ${invalidSubmitRes.body?.error || invalidSubmitRes.body?.message}`);
    if (invalidSubmitRes.status !== 400 || !JSON.stringify(invalidSubmitRes.body).includes('THREE (3) uploaded photos')) {
      throw new Error('Expected 400 error requiring at least 3 photos per sport');
    }
    console.log('   ✅ SUCCESS: Server strictly rejected sport section with fewer than 3 photos!');

    // 3. Successful Submission with 3 photos per sport
    console.log('3️⃣ Testing Successful Submission with >= 3 photos...');
    const validSubmitRes = await makeRequest(
      server,
      'POST',
      `/api/v1/clubs/${clubId}/setup/submit`,
      {
        clubName: 'Skyline Sports Arena',
        address: '100 Ring Road',
        city: 'Indore',
        legalBusinessName: 'Skyline Sports LLP',
        businessType: 'Partnership / LLP',
        gstRegistered: false,
        sports: [
          {
            sportName: 'Badminton',
            images: [
              'https://example.com/court1.jpg',
              'https://example.com/court2.jpg',
              'https://example.com/court3.jpg',
            ],
            courts: [{ courtName: 'Court B1', hourlyRate: 500, surfaceType: 'SYNTHETIC_MAT' }],
          },
        ],
      },
      ownerToken
    );
    console.log(`   Status: ${validSubmitRes.status} | Message: ${validSubmitRes.body?.message}`);
    if (validSubmitRes.status !== 200 || validSubmitRes.body?.data?.club?.setup_status !== 'PENDING_REVIEW') {
      throw new Error('Expected setup status to transition to PENDING_REVIEW');
    }
    console.log('   ✅ SUCCESS: Application submitted as PENDING_REVIEW!');

    console.log('\n--- TEST GROUP 2: SETTINGS & PLATFORM COMMISSION IMMUTABILITY ---');

    // 4. Update Settings (Attempting to modify platform commission rate)
    console.log('4️⃣ Testing Settings Update (Commission rate must remain immutable by owner)...');
    const settingsBefore = await makeRequest(server, 'GET', `/api/v1/clubs/${clubId}/settings`, null, ownerToken);
    const origCommPct = parseFloat(settingsBefore.body?.data?.club?.base_commission_pct);

    const settingsUpdateRes = await makeRequest(
      server,
      'PUT',
      `/api/v1/clubs/${clubId}/settings`,
      {
        description: 'Premier sports hub with 6 indoor courts',
        baseCommissionPct: 2.0, // Client tries to override commission to 2%
        hasCanteen: true,
        hasKitchen: true,
      },
      ownerToken
    );
    console.log(`   Status: ${settingsUpdateRes.status}`);
    const settingsFetch = await makeRequest(server, 'GET', `/api/v1/clubs/${clubId}/settings`, null, ownerToken);
    const commPct = parseFloat(settingsFetch.body?.data?.club?.base_commission_pct);
    console.log(`   Platform Commission in DB: ${commPct}% (Original: ${origCommPct}%, Client Attempted: 2.0%)`);
    if (commPct === 2.0 || commPct !== origCommPct) {
      throw new Error(`Security Breach: Platform commission was altered by client! (found: ${commPct})`);
    }
    console.log('   ✅ SUCCESS: Platform commission rate remains immutable and client override was silently discarded!');

    console.log('\n--- TEST GROUP 3: EXPENSES & FINANCIAL OVERVIEW ---');

    // 5. Create Operating Expense
    console.log('5️⃣ Testing Expense Creation (POST /api/v1/expenses)...');
    const expCreateRes = await makeRequest(
      server,
      'POST',
      `/api/v1/expenses`,
      {
        category: 'UTILITIES',
        description: 'Electricity Bill - October',
        amount: 8500,
        expenseDate: '2026-10-01',
        status: 'PAID',
        paymentMethod: 'NET_BANKING',
        payeeVendor: 'State Electricity Board',
      },
      ownerToken
    );
    console.log(`   Status: ${expCreateRes.status} | ID: ${expCreateRes.body?.data?.id}`);
    if (expCreateRes.status !== 201) throw new Error('Failed to create expense');

    // 6. Test Salary Duplicate Prevention
    console.log('6️⃣ Testing Salary Payout Duplicate Prevention...');
    await makeRequest(
      server,
      'POST',
      `/api/v1/expenses`,
      {
        category: 'COACHING_SALARY',
        description: 'Head Badminton Coach Payout',
        amount: 25000,
        expenseDate: '2026-10-02',
        servicePeriod: '2026-10',
        status: 'PAID',
        payeeVendor: 'Coach Rajesh Kumar',
      },
      ownerToken
    );

    // Attempt second payment for the same coach and month
    const duplicateRes = await makeRequest(
      server,
      'POST',
      `/api/v1/expenses`,
      {
        category: 'COACHING_SALARY',
        description: 'Accidental Duplicate Payout',
        amount: 25000,
        expenseDate: '2026-10-03',
        servicePeriod: '2026-10',
        status: 'PAID',
        payeeVendor: 'Coach Rajesh Kumar',
      },
      ownerToken
    );
    console.log(`   Status: ${duplicateRes.status} | Error: ${duplicateRes.body?.error || duplicateRes.body?.message}`);
    if (duplicateRes.status !== 400 || !JSON.stringify(duplicateRes.body).includes('Duplicate salary expense')) {
      throw new Error('Expected duplicate salary expense to be blocked');
    }
    console.log('   ✅ SUCCESS: Duplicate salary expense was blocked!');

    // 7. Test Financial Overview (Net Income Formula)
    console.log('7️⃣ Testing Financial Overview Aggregation (GET /api/v1/expenses/overview)...');
    const overviewRes = await makeRequest(server, 'GET', `/api/v1/expenses/overview`, null, ownerToken);
    console.log(`   Status: ${overviewRes.status}`);
    const data = overviewRes.body?.data;
    console.log(`   Total Revenue: ₹${data.totalRevenue}`);
    console.log(`   Operating Expenses: ₹${data.operatingExpenses}`);
    console.log(`   Platform Commission: ₹${data.platformCommission}`);
    console.log(`   Net Income: ₹${data.netIncome}`);

    // Verify formula: Net Income = Total Revenue - Operating Expenses - Platform Commission
    const calculatedNet = data.totalRevenue - data.operatingExpenses - data.platformCommission;
    if (Math.abs(data.netIncome - calculatedNet) > 0.01) {
      throw new Error(`Net Income mismatch! Calculated: ${calculatedNet}, API returned: ${data.netIncome}`);
    }
    console.log('   ✅ SUCCESS: Net Income correctly calculated: Earned Revenue - Operating Expenses - Commission!');

    console.log('\n==========================================');
    console.log('🎉 ALL SETUP & FINANCE TESTS PASSED!');
    console.log('==========================================\n');

  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
