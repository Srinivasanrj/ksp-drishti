/**
 * KSP Sentinel AI — Backend Server Entry Point
 * Modular Express Application Foundation
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import chatRoutes from './routes/chat.js';
import calendarRoutes from './routes/calendar.js';
import llmService, { getCatalystToken } from './services/llmService.js';
import calendarService from './services/calendarService.js';

// Load environment configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// ── MIDDLEWARES ─────────────────────────────────────────────────────────────
// Enable CORS for frontend cross-origin requests
app.use(cors());

// Enable JSON request body parsing with generous payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── ROUTE MOUNTING ──────────────────────────────────────────────────────────
// Mount the chat API route at /api/chat
app.use('/api/chat', chatRoutes);

// Mount the Calendar & Event Intelligence route at /api/calendar
app.use('/api/calendar', calendarRoutes);

// Backward-compatible mount for /chat
app.use('/chat', chatRoutes);

// Health check endpoint: GET /api/health
app.get('/api/health', async (req, res) => {
  const token = await getCatalystToken();
  res.json({
    status: token ? 'ok' : 'token_error',
    service: 'KSP Sentinel AI Backend',
    version: '2.0.0',
    catalyst_auth: token ? 'Authenticated ✅' : 'Token Error ❌',
    model: 'crm-di-glm47b_30b_it',
    timestamp: new Date().toISOString()
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'KSP Sentinel AI Backend API',
    status: 'Running',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/health'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[GlobalErrorHandler]', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// ── START SERVER ────────────────────────────────────────────────────────────
const server = app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`🛡️  KSP SENTINEL AI — BACKEND SERVER RUNNING`);
  console.log(`➜  Port:        ${PORT}`);
  console.log(`➜  Chat API:    http://localhost:${PORT}/api/chat`);
  console.log(`➜  Health API:  http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);

  // Pre-warm LLM authentication token
  try {
    const prewarmed = await llmService.prewarm();
    if (prewarmed) {
      console.log('[Auth] Zoho OAuth token pre-warmed successfully.');
    } else {
      console.warn('[Auth] Token pre-warm failed. Check CATALYST_REFRESH_TOKEN in .env.');
    }
  } catch (err) {
    console.warn('[Auth] Token pre-warm warning:', err.message);
  }
});

export { app, server };
export default app;
