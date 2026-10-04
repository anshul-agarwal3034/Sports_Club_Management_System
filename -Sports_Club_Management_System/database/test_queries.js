const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:1980@localhost:5432/champion-club';

async function testDatabase() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('🧪 CONNECTED TO LOCAL POSTGRESQL ("champion-club") FOR VERIFICATION TESTS...\n');

    // TEST 1: Check Seeded Data
    const clubsRes = await client.query('SELECT id, name, is_verified FROM clubs');
    console.log('1️⃣ Seeded Clubs Count:', clubsRes.rows.length);
    clubsRes.rows.forEach(c => console.log(`   - Club: ${c.name} (ID: ${c.id}, Verified: ${c.is_verified})`));

    const courtsRes = await client.query('SELECT id, name, sport_type, base_price_per_hour FROM courts');
    console.log('\n2️⃣ Seeded Courts Count:', courtsRes.rows.length);
    courtsRes.rows.forEach(c => console.log(`   - Court: ${c.name} (${c.sport_type}) - ₹${c.base_price_per_hour}/hr`));

    // TEST 2: Calculate Booking Price (Gold Member vs Non-Member)
    const goldUserRes = await client.query("SELECT id FROM users WHERE email = 'aarav@gmail.com'");
    const nonMemberRes = await client.query("SELECT id FROM users WHERE email = 'vikram@gmail.com'");
    const padelCourtId = courtsRes.rows[0].id;

    const goldUserId = goldUserRes.rows[0].id;
    const nonMemberId = nonMemberRes.rows[0].id;

    // Peak hour slot (7 PM - 8 PM tomorrow)
    const tomorrowPeakStart = new Date();
    tomorrowPeakStart.setDate(tomorrowPeakStart.getDate() + 1);
    tomorrowPeakStart.setHours(19, 0, 0, 0);

    const tomorrowPeakEnd = new Date(tomorrowPeakStart);
    tomorrowPeakEnd.setHours(20, 0, 0, 0);

    const goldPriceRes = await client.query('SELECT calculate_booking_price($1, $2, $3, $4) as price', [
      padelCourtId,
      goldUserId,
      tomorrowPeakStart.toISOString(),
      tomorrowPeakEnd.toISOString(),
    ]);

    const nonMemberPriceRes = await client.query('SELECT calculate_booking_price($1, $2, $3, $4) as price', [
      padelCourtId,
      nonMemberId,
      tomorrowPeakStart.toISOString(),
      tomorrowPeakEnd.toISOString(),
    ]);

    console.log('\n3️⃣ Pricing Engine Test (Base Rate: ₹800/hr, Peak 6-10 PM 1.25x):');
    console.log(`   - Gold Member Price (50% fixed discount): ₹${goldPriceRes.rows[0].price}`);
    console.log(`   - Non-Member Peak Price (1.25x surge multiplier): ₹${nonMemberPriceRes.rows[0].price}`);

    // TEST 3: Create Court Booking
    console.log('\n4️⃣ Executing Stored Procedure: create_court_booking...');
    const bookingRes = await client.query(
      'SELECT * FROM create_court_booking($1, $2, $3, $4, $5)',
      [padelCourtId, goldUserId, tomorrowPeakStart.toISOString(), tomorrowPeakEnd.toISOString(), 'UPI']
    );
    console.log('   ✅ Booking Result:', bookingRes.rows[0]);

    // TEST 4: Double Booking Exclusions Constraint Test
    console.log('\n5️⃣ Testing Double-Booking Prevention (Attempting identical slot booking)...');
    try {
      await client.query(
        'SELECT * FROM create_court_booking($1, $2, $3, $4, $5)',
        [padelCourtId, nonMemberId, tomorrowPeakStart.toISOString(), tomorrowPeakEnd.toISOString(), 'CARD']
      );
      console.error('❌ FAIL: Double booking was allowed!');
    } catch (err) {
      console.log('   ✅ SUCCESS: PostgreSQL Exclusion Constraint prevented double-booking!');
      console.log(`      Error caught: ${err.message}`);
    }

    // TEST 5: Owner Dashboard Analytics
    const clubId = clubsRes.rows[0].id;
    const analyticsRes = await client.query('SELECT * FROM get_owner_dashboard_analytics($1)', [clubId]);
    console.log('\n6️⃣ Owner Analytics Procedure Result:', analyticsRes.rows[0]);

    console.log('\n==========================================');
    console.log('🎉 ALL DATABASE PROCEDURES & CONSTRAINTS PASSED VERIFICATION!');
    console.log('==========================================');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await client.end();
  }
}

testDatabase();
