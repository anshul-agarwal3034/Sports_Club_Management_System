const { Client } = require('pg');

const passwords = ["password1980", "Password1980", "123456", "postgres", "admin", "root", "password", ""];
const users = ["postgres", "as770", "Akshay"];
const ports = [5432, 5433];
const dbs = ["champion-club", "postgres"];

async function probe() {
  for (const port of ports) {
    for (const user of users) {
      for (const password of passwords) {
        for (const dbname of dbs) {
          const client = new Client({
            host: 'localhost',
            port,
            user,
            password,
            database: dbname,
            connectionTimeoutMillis: 1500,
          });
          try {
            await client.connect();
            console.log(`🎉 SUCCESS! Connected with user="${user}", port=${port}, db="${dbname}", password="${password}"`);
            await client.end();
            process.exit(0);
          } catch (err) {
            await client.end().catch(() => {});
            if (err.message && err.message.includes('database') && err.message.includes('does not exist')) {
              console.log(`User/Pass match! User="${user}", port=${port}, password="${password}", but db "${dbname}" does not exist.`);
            }
          }
        }
      }
    }
  }
  console.log('No matching local Postgres credentials found automatically.');
}

probe();
