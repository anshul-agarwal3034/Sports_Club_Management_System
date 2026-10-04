const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function seedAdmin() {
  const hash = await bcrypt.hash('AdminPass123!', 10);
  const client = new Client({ connectionString: 'postgres://postgres:1980@localhost:5432/champion-club' });

  try {
    await client.connect();
    await client.query(
      `INSERT INTO users (id, role, full_name, email, password_hash)
       VALUES ('00000000-0000-0000-0000-000000000001', 'PLATFORM_ADMIN', 'Platform Administrator', 'admin@championclub.com', $1)
       ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'PLATFORM_ADMIN'`,
      [hash]
    );
    console.log('✅ Default Platform Admin user created/updated successfully!');
  } catch (err) {
    console.error('Error seeding admin:', err);
  } finally {
    await client.end();
  }
}

seedAdmin();
