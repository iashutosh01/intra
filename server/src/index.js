import app from './app.js';
import { env } from './config/env.js';

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Loan ledger API running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is busy. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Ensure the port is treated as a number
startServer(Number(env.port));