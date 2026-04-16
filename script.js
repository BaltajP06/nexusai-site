/* script.js — NexusAI frontend logic */

/* ── NAV ──────────────────────────────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
menuBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  mobileMenu.setAttribute('aria-hidden', !open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
document.querySelectorAll('.mobile-link').forEach(l => {
  l.addEventListener('click', () => { mobileMenu.classList.remove('open'); });
});

/* ── SCROLL REVEAL ───────────────────────────────────────────── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); revealObs.unobserve(e.target); } });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── ANIMATED COUNTERS ──────────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && e.target.dataset.count) {
      animateCounter(e.target);
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

/* ── ROI CALCULATOR ─────────────────────────────────────────── */
function fmt(n) { return '$' + Math.round(n).toLocaleString(); }
function calcROI() {
  const leads  = parseInt(document.getElementById('leadsSlider').value);
  const deal   = parseInt(document.getElementById('dealSlider').value);
  const close  = parseInt(document.getElementById('closeSlider').value) / 100;
  const admin  = parseInt(document.getElementById('adminSlider').value);
  const hourly = parseInt(document.getElementById('hourlySlider').value);

  document.getElementById('leadsVal').textContent  = leads;
  document.getElementById('dealVal').textContent   = '$' + deal.toLocaleString();
  document.getElementById('closeVal').textContent  = (close * 100) + '%';
  document.getElementById('adminVal').textContent  = admin + ' hrs';
  document.getElementById('hourlyVal').textContent = '$' + hourly + '/hr';

  const extraConversionRate = 0.35;
  const lostLeads = leads * extraConversionRate;
  const lostRev   = lostLeads * close * deal;
  const adminMthly = admin * 4.33 * hourly;
  const total      = lostRev + adminMthly;
  const growthPlan = 397;
  const payback    = total > 0 ? (growthPlan / total * 30).toFixed(0) : '—';

  document.getElementById('lostRevenue').textContent      = fmt(lostRev);
  document.getElementById('adminValue').textContent       = fmt(adminMthly);
  document.getElementById('totalOpportunity').textContent = fmt(total);
  document.getElementById('paybackDays').textContent      = total > 0 ? `in ~${payback} days` : '—';
}
['leadsSlider','dealSlider','closeSlider','adminSlider','hourlySlider'].forEach(id => {
  document.getElementById(id).addEventListener('input', calcROI);
});
calcROI();

/* ── PRICING TOGGLE ──────────────────────────────────────────── */
const prices = { starter: 147, growth: 397, scale: 797 };
const setups  = { starter: 297, growth: 797, scale: 1497 };
document.getElementById('annualToggle').addEventListener('change', function() {
  const annual = this.checked;
  document.getElementById('monthlyLabel').classList.toggle('active', !annual);
  document.getElementById('annualLabel').classList.toggle('active', annual);
  ['starter','growth','scale'].forEach(plan => {
    const monthly    = prices[plan];
    const discounted = Math.round(monthly * 0.8);
    const priceEl    = document.getElementById(plan + 'Price');
    const origEl     = document.getElementById(plan + 'Orig');
    const setupEl    = document.getElementById(plan + 'Setup');
    if (annual) {
      priceEl.textContent = '$' + discounted;
      origEl.textContent  = '$' + monthly;
      origEl.style.display = 'inline';
      setupEl.textContent = 'Setup fee waived with annual plan';
    } else {
      priceEl.textContent  = '$' + monthly;
      origEl.style.display = 'none';
      setupEl.textContent  = '+ $' + setups[plan].toLocaleString() + ' one-time setup';
    }
  });
});

/* ── CHATBOT DATA ────────────────────────────────────────────── */
const chatData = {
  greetings:    ['hi','hello','hey','sup','yo','good morning','good evening'],
  pricing:      ['price','cost','how much','pricing','pay','fee','expensive','cheap','afford','plan','package','monthly','retainer','$'],
  howItWorks:   ['how does it work','how does this work','how do you','how it work','explain','what is','what do you','what exactly','tell me more','more info'],
  setup:        ['how long','setup','install','implement','set up','time','how fast','how quickly','days','week'],
  industries:   ['industry','industries','business type','work with','what kind','what type','dental','real estate','fitness','restaurant','contractor','mortgage','coach'],
  cancel:       ['cancel','contract','lock in','commitment','stuck','quit','stop'],
  demo:         ['demo','try','test','see it','show me','example','preview','sample'],
  contact:      ['call','book','talk','schedule','speak','contact','reach','email','phone','get started','sign up'],
  results:      ['results','proof','case study','example','work','clients','success','roi','return'],
  guarantee:    ['guarantee','money back','refund','risk','safe'],
  tools:        ['tools','software','platform','make.com','zapier','openai','voiceflow','gohighlevel','technology'],
  technical:    ['technical','tech','integrate','integration','crm','api','connect'],
};

function matchIntent(msg) {
  const m = msg.toLowerCase();
  if (chatData.greetings.some(w => m.includes(w) || m === w))  return 'greeting';
  if (chatData.guarantee.some(w => m.includes(w)))             return 'guarantee';
  if (chatData.pricing.some(w => m.includes(w)))               return 'pricing';
  if (chatData.cancel.some(w => m.includes(w)))                return 'cancel';
  if (chatData.setup.some(w => m.includes(w)))                 return 'setup';
  if (chatData.industries.some(w => m.includes(w)))            return 'industries';
  if (chatData.results.some(w => m.includes(w)))               return 'results';
  if (chatData.tools.some(w => m.includes(w)))                 return 'tools';
  if (chatData.technical.some(w => m.includes(w)))             return 'technical';
  if (chatData.contact.some(w => m.includes(w)))               return 'contact';
  if (chatData.demo.some(w => m.includes(w)))                  return 'demo';
  if (chatData.howItWorks.some(w => m.includes(w)))            return 'howItWorks';
  return 'fallback';
}

const responses = {
  greeting:    ["Hey! Great to have you here 👋 I can tell you about pricing, how we set things up, which industries we work with, or what results clients typically see. What would you like to know?"],
  pricing:     ["We have three plans:\n\n• Starter — $147/mo + $297 setup (1 automation)\n• Growth — $397/mo + $797 setup (Chatbot + Follow-Up, most popular)\n• Scale — $797/mo + $1,497 setup (all 5 automations)\n\nAnnual plans include 20% off and we waive the setup fee. Most clients see full ROI in the first 2–4 weeks. Want me to calculate your numbers?"],
  howItWorks:  ["Here's the process:\n\n1. Free 30-min audit call — we map where you're losing time and money\n2. We build your automation in 3–5 business days, customised to your business\n3. We launch together with a 30-min walkthrough\n4. We monitor and maintain everything monthly\n\nYou never touch the technical side — that's on us."],
  setup:       ["Most automations go live in 3–5 business days after our kickoff call. The process is:\n\n• Day 1: Discovery call and requirements\n• Day 2–4: We build and test everything\n• Day 5: Launch + your 30-minute walkthrough\n\nYou don't need to do anything technical. We handle it all."],
  industries:  ["We've built for: real estate agents, dental clinics, fitness studios, restaurants, contractors, mortgage brokers, coaches, med spas, e-commerce brands, and more.\n\nIf you're in a different industry, book a free call — if we haven't done it before, we'll tell you honestly rather than guess."],
  results:     ["Some recent results from our clients:\n\n• Vancouver dental clinic: 47 new bookings in month 1 via chatbot\n• Real estate team: lead response time cut from 3 min to 45 sec, 2× deals closed\n• Contractor: 12 hours of admin saved weekly via invoice automation\n• Mortgage broker: 80% of client onboarding automated\n\nAll plans include a 30-day money-back guarantee."],
  cancel:      ["No lock-in contracts at all. Monthly plans cancel with 30 days notice, no cancellation fees.\n\nAll plans also come with a 30-day money-back guarantee — if you're not seeing results in the first 30 days, we refund your first month's retainer. No questions asked."],
  guarantee:   ["Yes — every plan includes a 30-day money-back guarantee. If you're not seeing results in the first 30 days, we'll refund your first month's retainer. No questions asked, no lock-in contracts."],
  tools:       ["We use industry-leading tools: Make.com for automation workflows, OpenAI for AI responses, Voiceflow for the chatbot, and GoHighLevel as the CRM backbone.\n\nYou own all the accounts — we set them up, configure them, and hand them to you ready to run."],
  technical:   ["You don't need any technical knowledge — we handle everything. For integrations, we connect to your existing tools (CRM, calendar, email, etc.). Most common stacks are already supported.\n\nIf you have a specific tool you're wondering about, just ask."],
  contact:     ["The easiest way is to book a free 30-minute audit call using the form at the bottom of this page. We'll look at your specific business and show you exactly what we'd automate and what results you can expect.\n\nNo pressure, no sales pitch — just a clear picture of what's possible."],
  demo:        ["The best demo is seeing it work on your actual business — which is exactly what the free audit call is for. We'll map out your workflow, show you a live example of a similar system, and you'll see it in action.\n\nBook a free call using the form below. Takes 2 minutes."],
  fallback:    ["That's a great question — it might be better answered on a call where we can get specific to your business. Book a free 30-min audit using the form below, or ask me about pricing, setup time, or which industries we work with."],
};

function getBotReply(msg) {
  const intent = matchIntent(msg);
  const pool = responses[intent] || responses.fallback;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ── CHAT UI ─────────────────────────────────────────────────── */
function appendMessage(text, who = 'bot') {
  const wrap = document.createElement('div');
  wrap.className = 'chat-msg ' + (who === 'user' ? 'user' : 'bot');
  wrap.textContent = text;
  document.getElementById('chatMessages').appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function showTyping() {
  const t = document.createElement('div');
  t.className = 'chat-typing';
  t.id = 'typingIndicator';
  t.innerHTML = '<span></span><span></span><span></span>';
  document.getElementById('chatMessages').appendChild(t);
  t.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeTyping() {
  const t = document.getElementById('typingIndicator');
  if (t) t.remove();
}

function sendQuick(text) {
  const input = document.getElementById('chatInput');
  if (input) { input.value = text; sendChat(); }
}

let chatPending = false;
async function sendChat() {
  if (chatPending) return;
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim()) return;
  const msg = input.value.trim();
  appendMessage(msg, 'user');
  input.value = '';
  chatPending = true;
  showTyping();

  /* Try server-side proxy first; fall back to local simulation */
  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
      signal: AbortSignal.timeout(5000)
    });
    if (resp.ok) {
      const data = await resp.json();
      removeTyping();
      appendMessage(data.reply || 'Sorry, no reply from server.', 'bot');
      chatPending = false;
      return;
    }
  } catch (_) { /* server not available — use local fallback */ }

  /* Local fallback: keyword-intent simulation */
  const delay = 700 + Math.random() * 600;
  await new Promise(r => setTimeout(r, delay));
  removeTyping();
  appendMessage(getBotReply(msg), 'bot');
  chatPending = false;
}

document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    document.getElementById('chatSendBtn').addEventListener('click', sendChat);
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
    });
  }
  document.querySelectorAll('.qr-btn').forEach(btn => {
    btn.addEventListener('click', () => sendQuick(btn.textContent.trim()));
  });
});

/* ── CONTACT FORM (Netlify) ──────────────────────────────────── */
/* CONTACT FORM — Netlify */
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  ['nameErr', 'businessErr', 'emailErr', 'industryErr', 'formError'].forEach(id => setError(id, ''));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const form = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const submitBtn = document.getElementById('submitBtn');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById('name')?.value.trim() || '';
    const business = document.getElementById('business')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim().toLowerCase() || '';
    const industry = document.getElementById('industry')?.value || '';

    let valid = true;

    if (!name) {
      setError('nameErr', 'Please enter your name.');
      valid = false;
    }

    if (!business) {
      setError('businessErr', 'Please enter your business name.');
      valid = false;
    }

    if (!email || !validateEmail(email)) {
      setError('emailErr', 'Please enter a valid email address.');
      valid = false;
    }

    if (!industry) {
      setError('industryErr', 'Please select your industry.');
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Confirming...';

    const payload = {
      name,
      business,
      email,
      phone: document.getElementById('phone')?.value.trim() || '',
      industry,
      message: document.getElementById('message')?.value.trim() || ''
    };

    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (data?.error === 'duplicate_email') {
          setError('emailErr', 'This email has already been used to request a call.');
        } else {
          setError('formError', 'Something went wrong. Please try again.');
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'Book My Free Audit Call';
        return;
      }

      form.style.display = 'none';
      formSuccess.style.display = 'flex';
    } catch (err) {
      setError('formError', 'Network error. Please try again later.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Book My Free Audit Call';
      console.error(err);
    }
  });
}

/* ── TOAST ───────────────────────────────────────────────────── */
function showToast(title, body) {
  const toast = document.getElementById('toast');
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastBody').textContent  = body;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4500);
}

const socialProof = [
  ['Just booked',  'A fitness studio in Coquitlam just booked a free audit call.'],
  ['New client',   'A dental clinic in Vancouver started the Growth plan today.'],
  ['New booking',  'A real estate agent in Burnaby just signed up.'],
];
setTimeout(() => {
  let i = 0;
  function next() {
    const [t, b] = socialProof[i % socialProof.length];
    showToast(t, b);
    i++;
    setTimeout(next, 18000 + Math.random() * 10000);
  }
  next();
}, 8000);
