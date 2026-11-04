// Gallery page: filter tabs (All / Towing / Freight, linkable as #towing and #freight) and an accessible
// lightbox. With JavaScript off, the page is a plain grid where each photo links to its large version.
import './menu.js';

const D = document;
const grid = D.getElementById('g-grid');
const tabs = D.querySelector('.g-tabs');
const empty = D.querySelector('.g-empty');
const items = [...grid.querySelectorAll('.g-item')];
const CATS = ['all', 'towing', 'freight'];

// ---------- filters ----------
function applyFilter(cat, push) {
  if (!CATS.includes(cat)) cat = 'all';
  tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
  let shown = 0;
  items.forEach((li) => { const on = cat === 'all' || li.dataset.cat === cat; li.hidden = !on; shown += on; });
  empty.hidden = shown > 0;
  if (cat === 'all') delete D.documentElement.dataset.gf; else D.documentElement.dataset.gf = cat;
  if (push) history.replaceState(null, '', cat === 'all' ? location.pathname + location.search : '#' + cat);
}
tabs.addEventListener('click', (e) => { const b = e.target.closest('button[data-filter]'); if (b) applyFilter(b.dataset.filter, true); });
addEventListener('hashchange', () => applyFilter(location.hash.slice(1)));
applyFilter(location.hash.slice(1));

// ---------- lightbox ----------
const lb = D.getElementById('lb');
const img = lb.querySelector('img'), avif = lb.querySelector('source'), text = lb.querySelector('.lb-text'), count = lb.querySelector('.lb-count');
let list = [], at = 0, opener = null;

function show(i) {
  at = (i + list.length) % list.length;
  const a = list[at], thumb = a.querySelector('img');
  avif.srcset = a.dataset.fullAvif;
  img.srcset = a.dataset.full;
  img.sizes = '100vw';
  img.src = a.href;
  img.width = +a.dataset.w; img.height = +a.dataset.h;
  img.alt = thumb.alt;
  text.textContent = a.dataset.caption || thumb.alt;
  count.textContent = `${at + 1} of ${list.length}`;
}
function open(a) {
  list = items.filter((li) => !li.hidden).map((li) => li.querySelector('a'));
  opener = a;
  show(list.indexOf(a));
  lb.showModal();                      // modal: the rest of the page is inert, Esc closes
  lb.querySelector('.lb-close').focus();
}
lb.addEventListener('close', () => { if (opener) opener.focus(); });
grid.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-full]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;   // let people open the big image in a new tab
  e.preventDefault();
  open(a);
});
lb.querySelector('.lb-prev').addEventListener('click', () => show(at - 1));
lb.querySelector('.lb-next').addEventListener('click', () => show(at + 1));
lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });   // backdrop
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
});
// swipe on touch screens
let x0 = null, y0 = null;
lb.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
lb.addEventListener('pointerup', (e) => {
  if (x0 == null) return;
  const dx = e.clientX - x0, dy = e.clientY - y0;
  x0 = y0 = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(at + (dx < 0 ? 1 : -1));
});
