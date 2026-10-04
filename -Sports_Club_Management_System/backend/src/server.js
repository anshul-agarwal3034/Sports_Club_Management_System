const app = require('./app');
const config = require('./config/env');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Champions Club Backend Server running on http://localhost:${PORT}`);
  console.log(`📌 Environment: ${config.nodeEnv}`);
});
