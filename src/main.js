// Ross Towing homepage: the freight quote form, the Towbook embed fallback and the next auction banner.
// journey.js only draws the road and truck; everything here works with or without it. Switches live in
// src/config.js. The Towbook request buttons themselves are plain links written into the HTML at build time.
import { CONFIG } from './config.js';
import { setupForm, readForm, check, phoneRule, callLink, summaryList } from './forms.js';
import { freightSummary } from './messages.js';
import { rowsFromCSV, rowsFromJSON, getAuctionState, formatAuctionDate, buildICS } from './auction.js';
import AUCTION_JSON from './data/auction.json';

const D = document;
const ADDRESS = '21360 Telegraph Rd, Southfield, MI 48033';
const PHONE = '248-356-6011';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const idle = (fn) => {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 1200));
  if (D.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
};

// ---------- freight quote form ----------
// Posts to the Worker (CONFIG.FORM_ENDPOINT_FREIGHT), which checks Turnstile and emails the office.
const again = '<button class="btn btn-line btn-again" type="button" data-again>Start a new request</button>';
(function freight() {
  const form = D.getElementById('freight-quote');
  if (!form) return;
  // Each number is read with its unit ("Length, feet") through a hidden description that follows the select.
  const WORDS = { ft: 'feet', in: 'inches', lbs: 'pounds', tons: 'tons' };
  const units = [...form.querySelectorAll('select[data-unit-for]')];
  const syncUnits = () => units.forEach((s) => { D.getElementById(s.dataset.unitFor).textContent = WORDS[s.value] || s.value; });
  units.forEach((s) => s.addEventListener('change', syncUnits));
  // "Other" reveals a short text field, which is then required
  const other = form.querySelector('input[name="equipment"][value="Other"]');
  const otherField = D.getElementById('fq-other-field'), otherInput = D.getElementById('fq-other');
  const syncOther = () => { otherField.hidden = !other.checked; otherInput.required = other.checked; if (!other.checked) check(otherInput); };
  other.addEventListener('change', syncOther);
  // Delivery date can't be before the ready date
  const ready = form.elements.ready_date, by = form.elements.deliver_by;
  const syncDates = () => { by.min = ready.value || ''; if (by.getAttribute('aria-invalid')) check(by); };
  ready.addEventListener('change', syncDates);
  phoneRule(form.elements.phone);
  form.addEventListener('reset-ui', () => { syncUnits(); syncOther(); syncDates(); });
  syncUnits(); syncOther();

  const endpoint = String(CONFIG.FORM_ENDPOINT_FREIGHT || '').trim();
  const ts = turnstile(form, endpoint ? String(CONFIG.TURNSTILE_SITE_KEY || '').trim() : '');
  setupForm(form, {
    endpoint,
    read: (f) => readForm(f, ['equipment']),
    payload: (d) => ({ ...d, weight_estimate: d.weight_estimate ? 'yes' : '' }),
    token: ts && ts.token,
    after: ts && ts.reset,
    fallback: () => `<p>Thanks. Online quotes aren't switched on yet. Please call ${callLink('freight form fallback')}, or use the freight request form above.</p>`,
    done: (d) => d
      ? `<p class="done-h" tabindex="-1"><strong>Thanks, your quote request was sent to the Ross Towing office.</strong> Please check these details:</p>${summaryList(freightSummary(d))}<p>Something wrong? Call ${callLink('freight form sent')}.</p>${again}`
      : '<p class="done-h" tabindex="-1"><strong>Thanks, your quote request was sent.</strong></p>',
  });
})();

// Cloudflare Turnstile, loaded only when the form comes near the screen, so it never touches first paint.
// "interaction-only": invisible unless Cloudflare wants a click. Tokens are single use, so it resets after
// every send. Returns null with no site key (the Worker then refuses quotes, which shows "please call").
function turnstile(form, sitekey) {
  if (!sitekey) return null;
  const box = D.getElementById('fq-turnstile');
  let id = null, ready = null;
  const load = () => ready || (ready = new Promise((resolve, reject) => {
    window.rossTurnstileReady = () => {
      try {
        id = window.turnstile.render(box, { sitekey, action: 'freight', appearance: 'interaction-only', 'refresh-expired': 'auto' });
        resolve();
      } catch (e) { reject(e); }
    };
    const s = D.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=rossTurnstileReady';
    s.async = true; s.defer = true;
    s.onerror = () => { ready = null; reject(new Error('turnstile script failed')); };
    D.head.appendChild(s);
  }));
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); load().catch((e) => console.warn('[ross] turnstile', e.message)); } }, { rootMargin: '800px' });
  io.observe(form);
  form.addEventListener('focusin', () => { load().catch(() => {}); }, { once: true });
  return {
    // Waits up to 8 seconds for a token (the widget may still be checking), then gives up.
    async token() {
      try { await load(); } catch { return null; }
      for (let i = 0; i < 40; i++) {
        const t = window.turnstile.getResponse(id);
        if (t) return t;
        await new Promise((r) => setTimeout(r, 200));
      }
      return null;
    },
    reset() { try { if (id != null) window.turnstile.reset(id); } catch { /* fresh token on the next load */ } },
  };
}

// ---------- Towbook embed (TOWBOOK_MODE "embed" only) ----------
// Falls back to the link button when Towbook can't be reached or the frame never loads. Browsers still
// report "load" for a frame Towbook refuses (X-Frame-Options or CSP), and the parent page can't see
// that, which is why the "open the form in a new tab" link is always under the frame.
(function towEmbed() {
  const box = D.querySelector('.tow-embed');
  if (!box) return;
  const url = box.dataset.url, frame = box.querySelector('iframe');
  let loaded = false;
  const fail = (force) => {
    if ((loaded && !force) || !frame.isConnected) return;
    console.warn('[ross] Towbook embed unavailable; showing the link instead');
    box.classList.remove('tow-embed');
    box.innerHTML = `<h3>Not urgent? Request a tow online</h3><p class="hint">For emergencies, call. We answer 24/7.</p>
      <a class="btn btn-line tow-link" href="${esc(url)}" target="_blank" rel="noopener" data-track="preview_book" data-track-detail="towbook link">Request a tow online<span class="sr"> (opens in a new tab)</span></a>`;
  };
  frame.addEventListener('load', () => { loaded = true; });
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return;
    io.disconnect();
    fetch(url, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' }).catch(() => fail(true));   // unreachable
    setTimeout(() => fail(false), 10000);                                                               // never loaded
  }, { rootMargin: '400px' });
  io.observe(frame);
})();

// ---------- next public auction ----------
// Source 1: the published Google Sheet (CONFIG.AUCTION_SHEET_CSV_URL). Source 2: src/data/auction.json,
// built into the page (Option A: edit it, push, the workflow redeploys).
// Fetched after the page is idle, so it never touches first paint. ?auction=YYYY-MM-DD previews a date.
const SHEET_KEY = 'ross-auction-sheet', SHEET_TTL = 10 * 60e3;

function sheetCacheGet(url) {
  try {
    const c = JSON.parse(sessionStorage.getItem(SHEET_KEY));
    if (c && c.url === url && Date.now() - c.t < SHEET_TTL && Array.isArray(c.rows)) return c.rows;
  } catch { /* storage blocked or junk: fetch again */ }
  return null;
}
function sheetCacheSet(url, rows) {
  try { sessionStorage.setItem(SHEET_KEY, JSON.stringify({ url, t: Date.now(), rows })); } catch { /* fine without it */ }
}

async function fetchText(url, ms) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, credentials: 'omit' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally { clearTimeout(timer); }
}

async function loadAuction() {
  const url = String(CONFIG.AUCTION_SHEET_CSV_URL || '').trim();
  let rows = null;
  if (url) {
    rows = sheetCacheGet(url);
    if (!rows) {
      try {
        rows = rowsFromCSV(await fetchText(url, 4000));
        if (rows.length) sheetCacheSet(url, rows);
        else console.warn('[ross] auction sheet has no dated rows; using src/data/auction.json');
      } catch (e) {
        console.warn('[ross] auction sheet unavailable; using src/data/auction.json', e);
        rows = null;
      }
    }
    if (rows && !rows.length) rows = null;
  }
  const json = AUCTION_JSON || {};
  return { rows: rows || rowsFromJSON(json), lead: json.showFromDaysBefore, location: json.location || ADDRESS };
}

(function auction() {
  const slot = D.getElementById('auction-slot');
  if (!slot) return;
  const q = new URLSearchParams(location.search).get('auction');
  if (q) return renderAuction(slot, getAuctionState([{ date: q }], new Date(), 3650), ADDRESS);
  idle(async () => {
    try {
      const { rows, lead, location: loc } = await loadAuction();
      renderAuction(slot, getAuctionState(rows, new Date(), lead), loc);
    } catch (e) { console.warn('[ross] auction banner skipped', e); }
  });
})();

function renderAuction(slot, res, defaultLocation) {
  if (res.state === 'none') return;                       // the static "call for the next date" line stays
  const a = res.auction, key = 'ross-auction-dismissed:' + a.date;
  try { if (localStorage.getItem(key)) return; } catch { /* storage blocked: show it */ }
  const stat = slot.querySelector('.auction-static'), ban = slot.querySelector('.auction-banner');
  const where = a.location || defaultLocation;
  const today = res.state === 'today';
  const head = today ? 'Public auction today' : `Next public auction: ${formatAuctionDate(a.date)}`;
  const meta = [today ? formatAuctionDate(a.date) : '', a.time, where].filter(Boolean).join(' · ');
  const ics = buildICS({ ...a, location: where }, { fallbackLocation: ADDRESS, phone: PHONE });
  const href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  ban.innerHTML = `<svg class="ico ab-ico" aria-hidden="true"><use href="#i-calendar"/></svg>
    <div class="ab-text"><p class="ab-h">${esc(head)}</p>${meta ? `<p class="ab-meta">${esc(meta)}</p>` : ''}${a.note ? `<p class="ab-note">${esc(a.note)}</p>` : ''}</div>
    <a class="btn ab-cal" href="${href}" download="ross-towing-auction-${a.date}.ics">Add to calendar</a>
    <button class="ab-x" type="button" aria-label="Hide the auction date"><svg class="ico" aria-hidden="true"><use href="#i-x"/></svg></button>`;
  stat.hidden = true;
  ban.hidden = false;
  slot.classList.add('is-set');
  ban.querySelector('.ab-x').addEventListener('click', () => {
    try { localStorage.setItem(key, '1'); } catch { /* hides for this visit only */ }
    ban.hidden = true; stat.hidden = false; slot.classList.remove('is-set');
    stat.focus();
  });
}
