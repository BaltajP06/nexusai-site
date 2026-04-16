/* ==========================================================================
   NexusAI Frontend Script
   --------------------------------------------------------------------------
   This file handles:
   1. Navbar state
   2. Mobile menu
   3. Scroll reveal animations
   4. Animated counters
   5. ROI calculator
   6. Pricing toggle
   7. Contact form submission
   ========================================================================== */

/* ==========================================================================
   Navbar
   ========================================================================== */

const nav = document.getElementById('nav');

if (nav) {
  window.addEventListener(
    'scroll',
    () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    },
    { passive: true }
  );
}

/* ==========================================================================
   Mobile menu
   ========================================================================== */

const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    mobileMenu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  document.querySelectorAll('.mobile-link').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
    });
  });
}

/* ==========================================================================
   Scroll reveal
   ========================================================================== */

const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));

/* ==========================================================================
   Animated counters
   ========================================================================== */

function animateCounter(el) {
  const target = parseInt(el.dataset.count || '0', 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target) + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

const counterObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target.dataset.count) {
        animateCounter(entry.target);
        counterObs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('[data-count]').forEach((el) => counterObs.observe(el));

/* ==========================================================================
   ROI calculator
   ========================================================================== */

function formatCurrency(n) {
  return '$' + Math.round(n).toLocaleString();
}

function calcROI() {
  const leadsEl = document.getElementById('leadsSlider');
  const dealEl = document.getElementById('dealSlider');
  const closeEl = document.getElementById('closeSlider');
  const adminEl = document.getElementById('adminSlider');
  const hourlyEl = document.getElementById('hourlySlider');

  if (!leadsEl || !dealEl || !closeEl || !adminEl || !hourlyEl) return;

  const leads = parseInt(leadsEl.value, 10);
  const deal = parseInt(dealEl.value, 10);
  const close = parseInt(closeEl.value, 10) / 100;
  const admin = parseInt(adminEl.value, 10);
  const hourly = parseInt(hourlyEl.value, 10);

  document.getElementById('leadsVal').textContent = leads;
  document.getElementById('dealVal').textContent = '$' + deal.toLocaleString();
  document.getElementById('closeVal').textContent = `${close * 100}%`;
  document.getElementById('adminVal').textContent = `${admin} hrs`;
  document.getElementById('hourlyVal').textContent = `$${hourly}/hr`;

  const extraConversionRate = 0.35;
  const lostLeads = leads * extraConversionRate;
  const lostRevenue = lostLeads * close * deal;
  const adminMonthly = admin * 4.33 * hourly;
  const totalOpportunity = lostRevenue + adminMonthly;
  const growthPlan = 397;
  const payback = totalOpportunity > 0 ? (growthPlan / totalOpportunity * 30).toFixed(0) : '—';

  document.getElementById('lostRevenue').textContent = formatCurrency(lostRevenue);
  document.getElementById('adminValue').textContent = formatCurrency(adminMonthly);
  document.getElementById('totalOpportunity').textContent = formatCurrency(totalOpportunity);
  document.getElementById('paybackDays').textContent =
    totalOpportunity > 0 ? `in ~${payback} days` : '—';
}

['leadsSlider', 'dealSlider', 'closeSlider', 'adminSlider', 'hourlySlider'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', calcROI);
  }
});

calcROI();

/* ==========================================================================
   Pricing toggle
   ========================================================================== */

const prices = { starter: 147, growth: 397, scale: 797 };
const setups = { starter: 297, growth: 797, scale: 1497 };
const annualToggle = document.getElementById('annualToggle');

if (annualToggle) {
  annualToggle.addEventListener('change', function () {
    const annual = this.checked;

    document.getElementById('monthlyLabel')?.classList.toggle('active', !annual);
    document.getElementById('annualLabel')?.classList.toggle('active', annual);

    ['starter', 'growth', 'scale'].forEach((plan) => {
      const monthly = prices[plan];
      const discounted = Math.round(monthly * 0.8);

      const priceEl = document.getElementById(`${plan}Price`);
      const origEl = document.getElementById(`${plan}Orig`);
      const setupEl = document.getElementById(`${plan}Setup`);

      if (!priceEl || !origEl || !setupEl) return;

      if (annual) {
        priceEl.textContent = `$${discounted}`;
        origEl.textContent = `$${monthly}`;
        origEl.style.display = 'inline';
        setupEl.textContent = 'Setup fee waived with annual plan';
      } else {
        priceEl.textContent = `$${monthly}`;
        origEl.style.display = 'none';
        setupEl.textContent = `+ $${setups[plan].toLocaleString()} one-time setup`;
      }
    });
  });
}

/* ==========================================================================
   Contact form helpers
   ========================================================================== */

function setError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function clearErrors() {
  ['nameErr', 'businessErr', 'emailErr', 'industryErr', 'formError'].forEach((id) => {
    setError(id, '');
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ==========================================================================
   Contact form submission
   --------------------------------------------------------------------------
   This sends the form to /api/contact.
   The backend checks for duplicate emails and returns JSON.
   On success, the form is hidden and the success message is shown.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById('name')?.value.trim() || '';
    const business = document.getElementById('business')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim().toLowerCase() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const industry = document.getElementById('industry')?.value || '';
    const message = document.getElementById('message')?.value.trim() || '';

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

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Confirming...';
    }

    const payload = {
      name,
      business,
      email,
      phone,
      industry,
      message
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
        } else if (data?.error === 'missing_fields') {
          setError('formError', 'Please fill in all required fields.');
        } else {
          setError('formError', 'Something went wrong. Please try again.');
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Book My Free Audit Call →';
        }

        return;
      }

      form.style.display = 'none';

      if (formSuccess) {
        formSuccess.style.display = 'flex';
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setError('formError', 'Network error. Please try again later.');

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book My Free Audit Call →';
      }
    }
  });
});
