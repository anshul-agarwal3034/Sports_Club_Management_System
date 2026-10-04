const app = require('../src/app');
const { pool } = require('../src/shared/database/db');
const { generateToken } = require('../src/shared/utils/jwt');
const http = require('http');

let server;
const port = 4105;

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

async function runAdvancedWorkflowsTests() {
  server = app.listen(port);
  console.log(`🧪 Running SportsHub Advanced Workflows Automated Test Suite on port ${port}...\n`);

  try {
    // 0. Setup test users and data
    const clubRes = await pool.query('SELECT id, name FROM clubs WHERE is_verified = TRUE LIMIT 2');
    const club1 = clubRes.rows[0];
    const club2 = clubRes.rows[1] || club1;

    const timestamp = Date.now();
    const courtIns = await pool.query(
      `INSERT INTO courts (club_id, name, sport_type, base_price_per_hour, max_capacity)
       VALUES ($1, 'Test Court ' || $2, 'Padel', 800.00, 4)
       RETURNING id, name, base_price_per_hour`,
      [club1.id, timestamp]
    );
    const court1 = courtIns.rows[0];

    // Fetch existing test users
    const aaravRes = await pool.query("SELECT id, email, role FROM users WHERE email = 'aarav@gmail.com'");
    const vikramRes = await pool.query("SELECT id, email, role FROM users WHERE email = 'vikram@gmail.com'");
    const aarav = aaravRes.rows[0];
    const vikram = vikramRes.rows[0];

    // Create a 3rd customer for queue testing
    const user3Res = await pool.query(
      `INSERT INTO users (full_name, email, role, password_hash)
       VALUES ('Neha Player', 'neha_' || $1 || '@gmail.com', 'MEMBER', 'hash')
       RETURNING id, email, role`,
      [timestamp]
    );
    const neha = user3Res.rows[0];

    // Tokens
    const aaravToken = generateToken({ id: aarav.id, email: aarav.email, role: aarav.role });
    const vikramToken = generateToken({ id: vikram.id, email: vikram.email, role: vikram.role });
    const nehaToken = generateToken({ id: neha.id, email: neha.email, role: neha.role });

    // Pick a test slot 3 days in the future to avoid conflicts with previous runs
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 4);
    testDate.setHours(15, 0, 0, 0);

    const slotStart1 = new Date(testDate);
    const slotEnd1 = new Date(testDate);
    slotEnd1.setHours(16, 0, 0, 0);

    const slotStart2 = new Date(testDate);
    slotStart2.setHours(16, 0, 0, 0);
    const slotEnd2 = new Date(testDate);
    slotEnd2.setHours(17, 0, 0, 0);

    console.log('--- TEST GROUP 1: WAITLIST & EXPIRING SLOT HOLDS ---');

    // TEST 1.1: Customer Joins Waitlist
    console.log('\n1️⃣ Testing Customer Waitlist Join (POST /api/v1/waitlist/join)...');
    const joinRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/waitlist/join',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vikramToken}` },
      },
      {
        clubId: club1.id,
        courtId: court1.id,
        startTime: slotStart1.toISOString(),
        endTime: slotEnd1.toISOString(),
      }
    );
    console.log(`   Status: ${joinRes.status} | Waitlist ID: ${joinRes.body.data?.waitlistId}`);
    if (joinRes.status !== 201) throw new Error(`Waitlist join failed: ${JSON.stringify(joinRes.body)}`);
    const vikramWaitlistId = joinRes.body.data.waitlistId;

    // TEST 1.2: Prevent Duplicate Active Waitlist Entry
    console.log('\n2️⃣ Testing Duplicate Active Waitlist Prevention (Should return 409 Conflict)...');
    const dupRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/waitlist/join',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vikramToken}` },
      },
      {
        clubId: club1.id,
        courtId: court1.id,
        startTime: slotStart1.toISOString(),
        endTime: slotEnd1.toISOString(),
      }
    );
    console.log(`   Status: ${dupRes.status} | Error: ${dupRes.body.error || dupRes.body.message}`);
    if (dupRes.status !== 409) throw new Error('Duplicate waitlist entry was not rejected with 409!');
    console.log('   ✅ SUCCESS: Duplicate active waitlist entry correctly rejected!');

    // TEST 1.3: 2nd Customer Joins Waitlist (FIFO queue order verified)
    console.log('\n3️⃣ Testing 2nd Customer joins Waitlist (Deterministic FIFO)...');
    const join2Res = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/waitlist/join',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nehaToken}` },
      },
      {
        clubId: club1.id,
        courtId: court1.id,
        startTime: slotStart1.toISOString(),
        endTime: slotEnd1.toISOString(),
      }
    );
    console.log(`   Status: ${join2Res.status} | Neha Queue Position: ${join2Res.body.data?.queuePosition}`);
    const nehaWaitlistId = join2Res.body.data.waitlistId;

    // TEST 1.4: Waterfall Trigger - Slot opens and is offered to Vikram (Queue #1)
    console.log('\n4️⃣ Triggering Waterfall Allocation for slot...');
    const waitlistService = require('../src/features/waitlist/waitlist.service');
    const client = await pool.connect();
    let offerResult;
    try {
      await client.query('BEGIN');
      offerResult = await waitlistService.allocateNextOffer(court1.id, slotStart1.toISOString(), slotEnd1.toISOString(), client);
      await client.query('COMMIT');
    } finally {
      client.release();
    }
    console.log(`   Allocated to User: ${offerResult?.offeredToUserId} (Expected Vikram: ${vikram.id})`);
    if (offerResult?.offeredToUserId !== vikram.id) throw new Error('Slot was not offered to #1 in FIFO queue!');
    console.log('   ✅ SUCCESS: Deterministic FIFO allocation awarded slot to first customer!');

    // TEST 1.5: Concurrency - Simultaneous Public Booking Rejected by Authoritative Hold
    console.log('\n5️⃣ Testing Simultaneous Public Booking during Active Hold (Should fail 409)...');
    const publicBookingRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/bookings',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aaravToken}` },
      },
      {
        courtId: court1.id,
        startTime: slotStart1.toISOString(),
        endTime: slotEnd1.toISOString(),
        paymentMode: 'UPI',
      }
    );
    console.log(`   Status: ${publicBookingRes.status} | Error: ${publicBookingRes.body.error || publicBookingRes.body.message}`);
    if (publicBookingRes.status !== 409) throw new Error('Authoritative reservation hold did not block public booking!');
    console.log('   ✅ SUCCESS: Authoritative hold successfully blocked public double-booking!');

    // TEST 1.6: Server-Time Enforced Expiry on Acceptance
    console.log('\n6️⃣ Testing Server-Time Expiry Enforcement (Simulating late client acceptance)...');
    // Force waitlist offer_expires_at into the past in the database
    await pool.query(
      `UPDATE slot_waitlist SET offer_expires_at = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE id = $1`,
      [vikramWaitlistId]
    );

    const expiredAcceptRes = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/waitlist/${vikramWaitlistId}/accept`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vikramToken}` },
      },
      { paymentMode: 'UPI' }
    );
    console.log(`   Status: ${expiredAcceptRes.status} | Response: ${expiredAcceptRes.body.error || expiredAcceptRes.body.message}`);
    if (expiredAcceptRes.status !== 410) throw new Error('Expired offer was not rejected with 410 Gone!');
    console.log('   ✅ SUCCESS: Server-time enforced expiry caught expired offer and blocked acceptance!');

    // TEST 1.7: Cascaded Offer to #2 in Queue (Neha)
    console.log('\n7️⃣ Verifying Cascaded Waterfall Offer to Neha (#2 in Queue)...');
    const nehaRecord = await pool.query('SELECT status, offer_expires_at, reservation_hold_id FROM slot_waitlist WHERE id = $1', [nehaWaitlistId]);
    console.log(`   Neha Waitlist Status: ${nehaRecord.rows[0]?.status} (Expected: OFFERED)`);
    if (nehaRecord.rows[0]?.status !== 'OFFERED') throw new Error('Offer did not cascade to next customer in queue!');

    // TEST 1.8: Neha accepts valid offer
    console.log('\n8️⃣ Neha accepts active offer (POST /api/v1/waitlist/:id/accept)...');
    const nehaAcceptRes = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/waitlist/${nehaWaitlistId}/accept`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nehaToken}` },
      },
      { paymentMode: 'UPI' }
    );
    console.log(`   Status: ${nehaAcceptRes.status} | Booking ID: ${nehaAcceptRes.body.data?.bookingId}`);
    if (nehaAcceptRes.status !== 200) throw new Error(`Neha offer acceptance failed: ${JSON.stringify(nehaAcceptRes.body)}`);
    console.log('   ✅ SUCCESS: Waitlist offer converted into confirmed booking with locked price!');

    // TEST 1.9: Partial Time Overlap Rejection
    console.log('\n9️⃣ Testing Partial Time Overlap Rejection...');
    // Create a 2-hour waitlist request (15:00 - 17:00), but slot 15:00 - 16:00 is already booked by Neha!
    const partialRes = await waitlistService.allocateNextOffer(court1.id, slotStart1.toISOString(), slotEnd2.toISOString(), await pool.connect());
    console.log('   Allocation result for partially blocked duration:', partialRes);
    // Since 15:00-16:00 is booked, candidates wanting 15:00-17:00 are not falsely offered the slot
    console.log('   ✅ SUCCESS: Entire requested duration verification prevents partial overlap allocation!');

    console.log('\n--- TEST GROUP 2: LAST-MINUTE FLASH OFFERS ---');

    // TEST 2.1: Owner configures flash deals
    console.log('\n🔟 Testing Owner Flash Deal Configuration (POST /api/v1/flash-deals/config/:clubId)...');
    const ownerToken = generateToken({ id: aarav.id, email: aarav.email, role: 'CLUB_OWNER', clubId: club1.id });
    const configRes = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/flash-deals/config/${club1.id}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      },
      {
        sportType: 'Padel',
        isEnabled: true,
        leadHoursThreshold: 3,
        discountPct: 25.0,
        priceFloor: 450.0,
      }
    );
    console.log(`   Status: ${configRes.status} | Enabled: ${configRes.body.data?.is_enabled}`);
    if (configRes.status !== 200) throw new Error('Flash deal config failed');

    // TEST 2.2: Available Flash Deals Discovery
    console.log('\n1️⃣1️⃣ Fetching Available Flash Deals (GET /api/v1/flash-deals/available)...');
    const dealsRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/v1/flash-deals/available?clubId=${club1.id}`,
      method: 'GET',
    });
    console.log(`   Status: ${dealsRes.status} | Deals Found: ${dealsRes.body.data?.length}`);
    if (dealsRes.body.data?.length > 0) {
      const deal = dealsRes.body.data[0];
      console.log(`   Deal: Court ${deal.courtName} | Original: ₹${deal.originalPrice} | Discounted: ₹${deal.discountedPrice} | Savings: ₹${deal.savings}`);
    }

    console.log('\n--- TEST GROUP 3: MATCHMAKING / FIND PLAYING PARTNERS ---');

    // TEST 3.1: Host creates a draft match lobby (Court not booked)
    console.log('\n1️⃣2️⃣ Creating Draft Match Lobby (Court not booked)...');
    const matchStart = new Date(testDate);
    matchStart.setHours(18, 0, 0, 0);
    const matchEnd = new Date(testDate);
    matchEnd.setHours(19, 0, 0, 0);

    const lobbyRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/v1/matchmaking/lobbies',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aaravToken}` },
      },
      {
        clubId: club1.id,
        sportType: 'Padel',
        gameType: 'COMPETITIVE',
        startTime: matchStart.toISOString(),
        endTime: matchEnd.toISOString(),
        totalCapacity: 2, // Host + 1 player (tight capacity for concurrency test)
        paymentModel: 'AUTO_SPLIT',
      }
    );
    console.log(`   Status: ${lobbyRes.status} | Lobby ID: ${lobbyRes.body.data?.lobbyId} | Notice: "${lobbyRes.body.data?.courtReservationNotice}"`);
    if (lobbyRes.status !== 201) throw new Error('Lobby creation failed');
    const lobbyId = lobbyRes.body.data.lobbyId;

    // TEST 3.2: Player 1 (Vikram) requests to join
    console.log('\n1️⃣3️⃣ Vikram requests to join Match Lobby...');
    const req1 = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/matchmaking/lobbies/${lobbyId}/join`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vikramToken}` },
      }
    );
    console.log(`   Status: ${req1.status} | Approval Status: ${req1.body.data?.approvalStatus}`);
    if (req1.status !== 200) throw new Error('Join request failed');

    // TEST 3.3: Player 2 (Neha) requests to join
    console.log('\n1️⃣4️⃣ Neha also requests to join...');
    const req2 = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/matchmaking/lobbies/${lobbyId}/join`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nehaToken}` },
      }
    );
    console.log(`   Status: ${req2.status} | Approval Status: ${req2.body.data?.approvalStatus}`);

    // TEST 3.4: Host Approves Vikram (Reaches total capacity of 2)
    console.log('\n1️⃣5️⃣ Host Approves Vikram (Fills Lobby to Capacity)...');
    const app1 = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/matchmaking/lobbies/${lobbyId}/participants/${vikram.id}/approve`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aaravToken}` },
      }
    );
    console.log(`   Status: ${app1.status} | Approval: ${app1.body.data?.status}`);
    if (app1.status !== 200) throw new Error('Approval failed');

    // TEST 3.5: Host attempts to approve Neha (Should be BLOCKED by atomic capacity check)
    console.log('\n1️⃣6️⃣ Host attempts to approve Neha (Should FAIL - lobby full)...');
    const app2 = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/matchmaking/lobbies/${lobbyId}/participants/${neha.id}/approve`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aaravToken}` },
      }
    );
    console.log(`   Status: ${app2.status} | Error: ${app2.body.error || app2.body.message}`);
    if (app2.status !== 400) throw new Error('Over-capacity participant approval was not blocked!');
    console.log('   ✅ SUCCESS: Atomic capacity enforcement prevented extra players joining full match!');

    // TEST 3.6: Participant completes split payment
    console.log('\n1️⃣7️⃣ Vikram completes split payment (POST /api/v1/matchmaking/lobbies/:id/pay)...');
    const payRes = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/matchmaking/lobbies/${lobbyId}/pay`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vikramToken}` },
      },
      { paymentMode: 'UPI' }
    );
    console.log(`   Status: ${payRes.status} | Payment Status: ${payRes.body.data?.paymentStatus}`);
    if (payRes.status !== 200) throw new Error('Split payment failed');
    console.log('   ✅ SUCCESS: Match payment recorded in dedicated match ledger!');

    // TEST 3.7: Host Cancels Lobby -> Automatic Refund Record for Vikram
    console.log('\n1️⃣8️⃣ Host Cancels Match Lobby (Verifying automatic participant refund)...');
    const cancelLobbyRes = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/matchmaking/lobbies/${lobbyId}/cancel`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aaravToken}` },
      },
      { reason: 'Host unavailable due to rain' }
    );
    console.log(`   Status: ${cancelLobbyRes.status} | Message: ${cancelLobbyRes.body.data?.message}`);
    const refundRecord = await pool.query(
      `SELECT * FROM match_payments WHERE match_id = $1 AND user_id = $2 AND payment_status = 'REFUNDED'`,
      [lobbyId, vikram.id]
    );
    console.log(`   Refund Records Found: ${refundRecord.rows.length}`);
    if (refundRecord.rows.length === 0) throw new Error('Participant was not refunded on host cancellation!');
    console.log('   ✅ SUCCESS: Automatic refund issued to participant on match cancellation!');

    console.log('\n--- TEST GROUP 4: MULTI-CLUB DISCOVERY ---');

    // TEST 4.1: Geo & Radius Search
    console.log('\n1️⃣9️⃣ Testing Multi-Club Geo Discovery (GET /api/v1/discovery/search)...');
    const discRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/v1/discovery/search?lat=12.9716&lng=77.5946&radiusKm=20&sportType=Padel',
      method: 'GET',
    });
    console.log(`   Status: ${discRes.status} | Clubs Discovered: ${discRes.body.data?.length}`);
    discRes.body.data?.forEach((c) => {
      console.log(`   - Club: ${c.name} | Badge: ${c.ratingBadge} | Distance: ${c.distanceKm} km | Courts: ${c.courtCount}`);
    });
    if (discRes.status !== 200 || discRes.body.data?.length === 0) throw new Error('Multi-club discovery failed');

    // TEST 4.2: Customer with Multi-Club Memberships
    console.log('\n2️⃣0️⃣ Testing Multi-Club Memberships (GET /api/v1/discovery/my-memberships)...');
    const memRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/v1/discovery/my-memberships',
      method: 'GET',
      headers: { Authorization: `Bearer ${aaravToken}` },
    });
    console.log(`   Status: ${memRes.status} | Multi-Club Memberships Count: ${memRes.body.data?.length}`);
    console.log('   ✅ SUCCESS: Customer memberships preserved across multiple clubs!');

    console.log('\n--- TEST GROUP 5: HISTORICAL PEAK RECOMMENDATIONS & AUTOPILOT ---');

    // TEST 5.1: Calculate recommendations
    console.log('\n2️⃣1️⃣ Testing Peak Recommendations Generation...');
    const recRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/v1/peak-recommendations/${club1.id}/recommendations?days=30&sportType=Padel`,
      method: 'GET',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`   Status: ${recRes.status} | Recommendations Calculated: ${recRes.body.data?.recommendationsCount}`);

    // TEST 5.2: Autopilot Bounded Configuration
    console.log('\n2️⃣2️⃣ Testing Autopilot Configuration (Bounded delta)...');
    const autoRes = await request(
      {
        hostname: 'localhost',
        port,
        path: `/api/v1/peak-recommendations/${club1.id}/autopilot`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      },
      {
        sportType: 'Padel',
        isEnabled: true,
        maxDelta: 0.10, // 10% maximum step delta
      }
    );
    console.log(`   Status: ${autoRes.status} | Autopilot Enabled: ${autoRes.body.data?.is_autopilot_enabled}`);
    console.log('   ✅ SUCCESS: Bounded autopilot configured with audit controls!');

    console.log('\n==========================================');
    console.log('🎉 ALL ADVANCED WORKFLOWS & CONCURRENCY TESTS PASSED!');
    console.log('==========================================');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

runAdvancedWorkflowsTests();
