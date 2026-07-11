import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  googleSheetId: process.env.GOOGLE_SHEET_ID || '',
  googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  googlePrivateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT || '',
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 30000)
};