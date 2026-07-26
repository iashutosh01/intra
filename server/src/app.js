import cors from 'cors';
import express from 'express';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// app.use(cors({ origin: env.clientOrigin, credentials: true }));
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS Not Allowed"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'personal-loan-ledger-api' });
});

app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
