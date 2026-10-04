const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const baseConnectionString = process.env.BASE_DATABASE_URL || 'postgres://postgres:3034@localhost:5432/postgres';
const targetConnectionString = process.env.DATABASE_URL || 'postgres://postgres:3034@localhost:5432/champion-club';

async function migrate() {
  // Step 1: Ensure database "champion-club" exists
  const rootClient = new Client({ connectionString: baseConnectionString });
  try {
    console.log('Connecting to PostgreSQL root database (postgres)...');
    await rootClient.connect();
    
    const dbRes = await rootClient.query("SELECT 1 FROM pg_database WHERE datname = 'champion-club'");
    if (dbRes.rows.length === 0) {
      console.log('Database "champion-club" does not exist. Creating database...');
      await rootClient.query('CREATE DATABASE "champion-club"');
      console.log('✅ Database "champion-club" created successfully.');
    } else {
      console.log('Database "champion-club" already exists.');
    }
  } catch (err) {
    console.error('Error connecting to root postgres db:', err.message);
  } finally {
    await rootClient.end().catch(() => {});
  }

  // Step 2: Connect to target database "champion-club" and execute migrations
  const client = new Client({ connectionString: targetConnectionString });

  try {
    console.log('\nConnecting to target database "champion-club"...');
    await client.connect();
    console.log('Connected successfully!');

    const files = [
      '01_schema.sql',
      '02_booking_and_pricing_engine.sql',
      '03_membership_referral_and_pos.sql',
      '04_seed_data.sql',
      '05_advanced_workflows.sql',
      '06_club_setup_expenses_settings.sql',
      '07_events_and_complaints.sql',
    ];

    for (const file of files) {
      const filePath = path.join(__dirname, file);
      console.log(`\nExecuting migration file: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`✅ Finished ${file} successfully.`);
    }

    console.log('\n==========================================');
    console.log('🎉 ALL DATABASE MIGRATIONS & SEED DATA APPLIED SUCCESSFULLY!');
    console.log('==========================================');
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
