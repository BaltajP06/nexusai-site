# NexusAI

AI-powered lead generation website for local businesses. Captures leads, answers questions automatically via chatbot, and books audit calls — 24/7.

**Live site:** https://nexus-ai-bp.netlify.app/

---

## What it does

- AI chatbot that answers visitor questions in real time
- Contact form that captures leads straight to email
- ROI calculator showing businesses the cost of not automating
- Pricing section with monthly/annual toggle
- Stripe payment link integration for instant checkout

---

## Architecture

```
Visitor
  │
  ▼
Netlify (Frontend)
  NexusAI_v2.html + script.js
  Netlify Forms → lead capture → email
  │
  │  /api/chat
  ▼
Render (Backend)
  Node.js + Express proxy
  Rate limiting + CORS
  │
  │  Server-side API call
  ▼
Anthropic Claude API
  Returns AI reply → back to visitor
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| AI | Anthropic Claude API |
| Forms | Netlify Forms |
| Hosting | Netlify (frontend), Render (backend) |
| Payments | Stripe Payment Links |

---

## Project structure

```
nexusai-site/
├── NexusAI_v2.html     — landing page
├── script.js           — all frontend logic
├── _headers            — browser security headers
├── netlify.toml        — Netlify config + API redirect
├── .gitignore
├── README.md
└── server/
    ├── index.js        — chat proxy + contact endpoint
    ├── package.json
    └── .env.example    — environment variable template
```

---

## Security

- API keys stored as environment variables on Render — never in the browser
- Rate limiting on all chat endpoints
- Honeypot spam protection on contact form
- Security headers on every page response

---

## Local setup

1. Clone the repo
2. Open `NexusAI_v2.html` in a browser to preview the frontend
3. Copy `server/.env.example` to `server/.env` and add your `ANTHROPIC_API_KEY`
4. Inside the `server/` folder run `npm install` then `node index.js`

---

## Deployment

**Frontend** — connect this repo to Netlify, set publish directory to `.`, deploy.

**Backend** — connect this repo to Render, set root directory to `server/`, build command `npm install`, start command `node index.js`, add `ANTHROPIC_API_KEY` as environment variable.

**Connect them** — paste your Render URL into `netlify.toml` where it says `YOUR_SERVER_URL`, then push the change.

---

Built by Baltaj Parmar · Vancouver, BC
