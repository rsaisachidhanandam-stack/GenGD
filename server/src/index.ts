import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { getDatabase } from './db/database';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Initialize database
getDatabase();

const app = createApp();

app.listen(PORT, () => {
  console.log(`[SyncSafe Backend] Server listening on http://localhost:${PORT}`);
  console.log(`[SyncSafe Backend] Health check: http://localhost:${PORT}/health`);
});
