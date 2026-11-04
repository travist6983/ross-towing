// Ross Towing homepage: the Towbook embed fallback and the next auction banner. journey.js only draws
// the road and truck; everything here works with or without it. Switches live in src/config.js.
// The Towbook request buttons themselves are plain links written into the HTML at build time.
import { CONFIG } from './config.js';
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
