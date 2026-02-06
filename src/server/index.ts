import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import challengeRouter from './routes/challenge';
import verifyRouter from './routes/verify';
import validateTokenRouter from './routes/validateToken';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// API routes
app.use('/api/challenge', challengeRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/validate-token', validateTokenRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Minecraft CAPTCHA server running on port ${PORT}`);
});

export default app;
