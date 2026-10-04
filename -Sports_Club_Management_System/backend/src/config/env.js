const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:1980@localhost:5432/champion-club',
  jwtSecret: process.env.JWT_SECRET || 'champion_club_secret_key_hackathon_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
};
