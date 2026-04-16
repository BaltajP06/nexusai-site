/* ==========================================================================
   NexusAI Backend Proxy
   --------------------------------------------------------------------------
   This server handles:
   1. Contact form submissions
   2. Duplicate-email protection
   3. AI chat proxying through Anthropic
   4. CORS + basic rate limiting
   ========================================================================== */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();

/* ==========================================================================
   Environment config
   ========================================================================== */

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const PORT = process.env.PORT || 8888;
const DATA_FILE = path.join(process.cwd(), 'submissions.json');

/* ==========================================================================
   Middleware
   ========================================================================== */

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'));
      }
    }
  })
);

app.use(express.json({ limit: '10kb' }));

const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

/* ==========================================================================
   Submission storage helpers
   --------------------------------------------------------------------------
   This project uses a simple JSON file for demo/public-project purposes.
   For production scale, move this to a database.
   ========================================================================== */

function loadSubmissions() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveSubmissions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* ==========================================================================
   Contact form endpoint
   --------------------------------------------------------------------------
   Expects JSON:
   {
     name,
     business,
     email,
     phone,
     industry,
     message
   }
   ========================================================================== */

app.post('/api/contact', async (req, res) => {
  const { name, business, email, phone, industry, message } = req.body || {};

  if (!name || !business || !email || !industry) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const submissions = loadSubmissions();

  const alreadyUsed = submissions.some((entry) => entry.email === normalizedEmail);

  if (alreadyUsed) {
    return res.status(409).json({ error: 'duplicate_email' });
  }

  submissions.push({
    name,
    business,
    email: normalizedEmail,
    phone: phone || '',
    industry,
    message: message || '',
    createdAt: new Date().toISOString()
  });

  saveSubmissions(submissions);

  return res.json({
    ok: true,
    status: 'confirmed'
  });
});

/* ==========================================================================
   AI chat endpoint
   --------------------------------------------------------------------------
   This keeps the Anthropic API key on the server.
   The frontend should call /api/chat, not Anthropic directly.
   ========================================================================== */

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'No message provided' });
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'Server misconfigured — API key missing' });
  }

  try {
    const client = new Anthropic({ apiKey: API_KEY });

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      system: `You are a helpful, concise AI assistant for NexusAI, a Vancouver-based business automation agency.
Answer questions about pricing, services, setup time, industries served, and the free audit call.
Keep replies under 120 words. Be friendly and direct. Never reveal internal pricing beyond what is on the site.
If asked something outside your knowledge, direct the visitor to book a free call.`,
      messages: [
        {
          role: 'user',
          content: message.trim().slice(0, 500)
        }
      ]
    });

    const reply =
      response.content?.[0]?.text || "Sorry, I couldn't generate a reply.";

    return res.json({ reply });
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    return res.status(500).json({ error: 'Chat service temporarily unavailable' });
  }
});

/* ==========================================================================
   Start server
   ========================================================================== */

app.listen(PORT, () => {
  console.log(`NexusAI proxy listening on port ${PORT}`);
});