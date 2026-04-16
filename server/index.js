import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();

// Allowed origins — add your Netlify domain here once deployed
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json({ limit: '10kb' }));

// Rate limiting: 30 chat requests per minute per IP
const chatLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });

// ── /api/contact ────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { name, email, business, industry, phone, message } = req.body || {};
  if (!name || !email || !business || !industry) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Log to console (replace with email provider / CRM webhook as needed)
  console.log('📬 Contact form submission:', {
    name, email, business, industry,
    phone: phone || '—',
    message: (message || '').slice(0, 300)
  });
  return res.json({ ok: true });
});

// ── /api/chat ───────────────────────────────────────────────────
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
      messages: [{ role: 'user', content: message.trim().slice(0, 500) }]
    });

    const reply = response.content?.[0]?.text || "Sorry, I couldn't generate a reply.";
    return res.json({ reply });
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    return res.status(500).json({ error: 'Chat service temporarily unavailable' });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`✅  NexusAI proxy listening on port ${PORT}`));
