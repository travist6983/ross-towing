// Form behavior for the freight quote: inline errors, spam checks, and one submit path that posts JSON
// to the Cloudflare Worker (CONFIG.FORM_ENDPOINT_FREIGHT, see worker/README.md). With no endpoint set,
// or when sending fails, it shows "please call" instead. A form is never cleared on an error.

export const PHONE = '248-356-6011';
export const TEL = 'tel:+12483566011';
const MIN_MS = 3000;          // submits faster than this after page load are treated as bots
const HONEYPOT = 'website';   // hidden field people never see; bots fill it in

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const callLink = (detail) => `<a href="${TEL}" data-track="preview_call" data-track-detail="${esc(detail)}">${PHONE}</a>`;

export function summaryList(pairs) {
  return `<dl class="done-list">${pairs.filter(([, v]) => v).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

// FormData -> plain object. Names listed in `arrays` collect every checked value. The honeypot and the
// Turnstile token are left out: the token is added to the post separately.
export function readForm(form, arrays = []) {
  const out = {};
  for (const k of arrays) out[k] = [];
  for (const [k, v] of new FormData(form)) {
    if (k === HONEYPOT || k === 'cf-turnstile-response' || typeof v !== 'string') continue;
    if (arrays.includes(k)) out[k].push(v.trim());
    else out[k] = v.trim();
  }
  return out;
}

// ---- validation ----
const controls = (form) => [...form.elements].filter((el) => el.matches('input, select, textarea') && el.name && el.name !== HONEYPOT && el.type !== 'hidden');

function message(el) {
  const v = el.validity;
  if (v.valid) return '';
  if (v.customError) return el.validationMessage;
  if (v.valueMissing) return el.dataset.msg || 'This field is required.';
  if (v.typeMismatch && el.type === 'email') return 'Enter an email address, like name@company.com.';
  if (v.tooLong) return 'That is too long. Please shorten it.';
  if (v.badInput || v.rangeUnderflow || v.rangeOverflow || v.stepMismatch) return el.dataset.msgNumber || 'Enter a number, 0 or more.';
  return 'Please check this field.';
}

function errorEl(el) {
  const id = el.id + '-err';
  let p = document.getElementById(id);
  if (!p) {
    p = document.createElement('p');
    p.className = 'err'; p.id = id; p.hidden = true;
    (el.closest('.field, .check') || el.parentElement).appendChild(p);
    el.setAttribute('aria-describedby', [el.getAttribute('aria-describedby'), id].filter(Boolean).join(' '));
  }
  return p;
}

// Shows or clears the inline error under one control. Returns true when the control is valid.
export function check(el) {
  if (el.disabled || el.closest('[hidden]')) { el.removeAttribute('aria-invalid'); const p = document.getElementById(el.id + '-err'); if (p) p.hidden = true; return true; }
  const msg = message(el);
  const p = errorEl(el);
  p.textContent = msg; p.hidden = !msg;
  if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  return !msg;
}

// Phone: at least 10 digits once something is typed.
export function phoneRule(el) {
  const run = () => { const n = el.value.replace(/\D/g, '').length; el.setCustomValidity(el.value.trim() && n < 10 ? 'Enter a phone number with the area code.' : ''); };
  el.addEventListener('input', run); run();
}

function show(status, html, tone = 'info') {
  status.className = 'form-status ' + tone;
  status.innerHTML = html;
  status.hidden = false;
}

// POST JSON to the Worker. Arrays go as "a, b". Throws on anything but { ok: true }.
export async function post(endpoint, payload, fetchImpl = fetch) {
  const flat = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v == null ? '' : v]));
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(flat),
      credentials: 'omit',
      signal: ctl.signal,
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.ok !== true) {
      const e = new Error((j && j.error) || 'HTTP ' + r.status);
      e.status = r.status;
      throw e;
    }
    return j;
  } finally { clearTimeout(timer); }
}

// Wires one form. opts:
//   endpoint     Worker URL, or '' for the call-us fallback
//   read(form)   -> data object
//   payload(d)   -> what gets posted
//   token()      -> Promise of the Turnstile token, or null when it isn't ready (optional)
//   after()      -> called after every send attempt, sent or not (optional; resets Turnstile)
//   fallback(d)  -> HTML shown when there's no endpoint
//   done(d)      -> HTML confirmation after a successful send (d is null for a caught bot)
export function setupForm(form, { endpoint, read, payload, token, after, fallback, done }) {
  const status = form.querySelector('.form-status');
  const btn = form.querySelector('button[type="submit"]');
  const label = btn.textContent;
  let tried = false;

  // Check a field when you leave it. If you left it by pressing on something (like the submit button),
  // wait until the press ends: an error line appearing mid click would push the button out from under it.
  let pressing = false;
  const queued = new Set();
  addEventListener('pointerdown', () => { pressing = true; }, true);
  addEventListener('pointerup', () => { pressing = false; setTimeout(() => { queued.forEach(check); queued.clear(); }, 0); }, true);
  addEventListener('pointercancel', () => { pressing = false; }, true);
  form.addEventListener('focusout', (e) => {
    if (!e.target.matches('input, select, textarea') || !(tried || e.target.value)) return;
    if (pressing) queued.add(e.target); else check(e.target);
  });
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') check(e.target); });
  form.addEventListener('change', (e) => { if (tried && e.target.matches('input, select')) check(e.target); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    tried = true;
    const bad = controls(form).filter((el) => !check(el));
    if (bad.length) {
      show(status, `<p>Please check ${bad.length === 1 ? 'the field' : `the ${bad.length} fields`} marked in red.</p>`, 'bad');
      bad[0].focus();
      return;
    }
    const sent = (d) => {
      show(status, done(d), 'ok');
      form.querySelectorAll('fieldset').forEach((f) => { f.disabled = true; });   // keeps the details on screen, stops a double send
      btn.disabled = true; btn.textContent = 'Sent';
      const again = status.querySelector('[data-again]');
      if (again) again.addEventListener('click', () => {
        form.reset();
        form.querySelectorAll('fieldset').forEach((f) => { f.disabled = false; });
        form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
        form.querySelectorAll('.err').forEach((p) => { p.hidden = true; });
        form.dispatchEvent(new Event('reset-ui'));
        btn.disabled = false; btn.textContent = label; status.hidden = true; tried = false;
        const first = controls(form)[0]; if (first) first.focus();
      });
      const h = status.querySelector('[tabindex="-1"]'); if (h) h.focus({ preventScroll: false });
    };
    const trap = form.elements[HONEYPOT];
    if (trap && trap.value) { sent(null); return; }                 // bot: pretend it worked, send nothing
    if (performance.now() < MIN_MS) { show(status, '<p>That was quick. Please wait a moment, then send again.</p>', 'bad'); return; }
    const data = read(form);
    if (!endpoint) { show(status, fallback(data), 'info'); return; }
    btn.disabled = true; btn.textContent = 'Sending...';
    try {
      const extra = {};
      if (token) {
        const t = await token();
        if (!t) {
          btn.disabled = false; btn.textContent = label;
          show(status, `<p>One moment, we're checking the form is from a person. Please send again in a few seconds, or call ${callLink('form check')}.</p>`, 'bad');
          return;
        }
        extra['cf-turnstile-response'] = t;
      }
      await post(endpoint, { ...payload(data), ...extra });
      sent(data);
    } catch (err) {
      console.warn('[ross] form send failed', err && err.message);
      btn.disabled = false; btn.textContent = label;
      const busy = err && err.status === 429;
      show(status, `<p>Sorry, that didn't go through${busy ? ' (too many requests from this connection)' : ''}. Nothing you typed was lost. Please try again, or call ${callLink('form error')}.</p>`, 'bad');
    } finally {
      if (after) after();
    }
  });
}
