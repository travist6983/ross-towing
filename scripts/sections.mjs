// Build-time sections: reviews, partner logo rows, training strip, gallery grid, homepage teaser and
// the Towbook QR code. Pure functions of the data files and config, so they're unit tested.
import fs from 'node:fs';
import path from 'node:path';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const readJSON = (root, rel, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); } catch { return fallback; } };
const httpsUrl = (v) => { try { const u = new URL(String(v || '').trim()); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };

// ---------- reviews ----------
export const reviewText = (r) => (r.show === 'excerpt' && r.excerpt ? r.excerpt : r.text);
export function featuredReviews(data, slot) {
  return (data.reviews || []).filter((r) => r.featured && (!slot || r.slot === slot) && reviewText(r));
}
export function renderReviews(data, slot) {
  return featuredReviews(data, slot).map((r) =>
    `<figure class="quote reveal"><blockquote><p>${esc(reviewText(r))}</p></blockquote><figcaption>${esc(r.author)}, Google review</figcaption></figure>`).join('\n');
}
export function reviewSchema(data) {
  return featuredReviews(data).map((r) => ({ '@type': 'Review', author: { '@type': 'Person', name: r.author }, reviewBody: reviewText(r), publisher: { '@type': 'Organization', name: 'Google' } }));
}

// ---------- partners (agencies, dealers) ----------
// A logo renders only when the file exists AND permission is true. Without that, agencies show their
// name as text; dealers show nothing. "[...]" placeholders render only in dev.
const isPlaceholder = (p) => /^\[.*\]$/.test(String(p.name || '').trim());
export function partnerItems(list, { group, dev = false, logoExists = () => false }) {
  return (list || []).flatMap((p) => {
    if (isPlaceholder(p)) return dev ? [{ kind: 'placeholder', name: p.name }] : [];
    if (p.permission === true && p.logo && logoExists(p.logo)) return [{ kind: 'logo', name: p.name, logo: p.logo, url: httpsUrl(p.url) }];
    if (group === 'dealers' && p.permission !== true) return [];
    return [{ kind: 'name', name: p.name, url: group === 'dealers' ? httpsUrl(p.url) : '' }];
  });
}
export function renderPartners(list, opts) {
  const items = partnerItems(list, opts);
  if (!items.length) return '';
  const li = items.map((it) => {
    const inner = it.kind === 'logo'
      ? `<img src="/${esc(it.logo.replace(/^\/+/, ''))}" alt="${esc(it.name)}" height="48" loading="lazy" decoding="async">`
      : it.kind === 'placeholder' ? `<span class="ph">${esc(it.name)}</span>` : `<span>${esc(it.name)}</span>`;
    const body = it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${inner}</a>` : inner;
    return `<li class="pt-${it.kind}">${body}</li>`;
  }).join('');
  const label = opts.group === 'dealers' ? 'Dealerships we tow for' : 'Agencies we work with';
  return `<ul class="partners partners-${opts.group}" aria-label="${label}">${li}</ul>`;
}

// ---------- photos ----------
function picture(p, { sizes, eager = false, cls = '', high = false } = {}) {
  const set = (fmt) => p.srcset[fmt].map(([f, w]) => `/${f} ${w}w`).join(', ');
  const mid = p.srcset.webp.find(([, w]) => w >= 900) || p.srcset.webp.at(-1);
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">`
    + `<img${cls ? ` class="${cls}"` : ''} src="/${mid[0]}" width="${p.width}" height="${p.height}" alt="${esc(p.alt)}" loading="${eager ? 'eager' : 'lazy'}"${high ? ' fetchpriority="high"' : ''} decoding="${high ? 'sync' : 'async'}" style="background-image:url(${p.placeholder})"></picture>`;
}
const largest = (p, base = '/') => base + p.srcset.webp.at(-1)[0];

export function renderTraining(gallery) {
  const pics = gallery.filter((p) => p.category === 'training');
  if (!pics.length) return '';
  return `<figure class="training-strip"><div class="ts-grid">${pics.map((p) => picture(p, { sizes: '(min-width: 900px) 200px, calc(33vw - 24px)' })).join('')}</div>`
    + '<figcaption>Farmington Hills Police Department training at the Ross Towing facility.</figcaption></figure>';
}

// Links and data-* attributes aren't rewritten by Vite, so they carry the base path themselves.
export function renderGallery(gallery, base = '/') {
  const pics = gallery.filter((p) => p.category === 'towing' || p.category === 'freight');
  return pics.map((p, i) => `<li class="g-item" data-cat="${p.category}"><a href="${largest(p, base)}" data-i="${i}" data-full="${p.srcset.webp.map(([f, w]) => `${base}${f} ${w}w`).join(', ')}" data-full-avif="${p.srcset.avif.map(([f, w]) => `${base}${f} ${w}w`).join(', ')}" data-w="${p.width}" data-h="${p.height}" data-caption="${esc(p.caption)}">`
    + picture(p, { sizes: '(min-width: 1100px) 380px, (min-width: 640px) 45vw, calc(50vw - 23px)', eager: i === 0, high: i === 0 })
    + `</a>${p.caption ? `<p class="g-cap">${esc(p.caption)}</p>` : ''}</li>`).join('\n');
}

export function renderTeaser(gallery, base) {
  const pics = gallery.filter((p) => p.featured && p.category !== 'training').slice(0, 6);
  if (!pics.length) return '';
  return `<ul class="teaser">${pics.map((p) => `<li><a href="${base}gallery/#${p.category}">${picture(p, { sizes: '(min-width: 900px) 150px, calc(50vw - 40px)' })}<span class="sr">${esc(p.caption || p.alt)}, in the gallery</span></a></li>`).join('')}</ul>`;
}

// ---------- Towbook request buttons ----------
// The three Towbook Web Request Form links. Built into the HTML, so they work with JavaScript off and
// nothing shifts on load. An empty link renders nothing; the call button always stays first.
export function towbookLinks(config) {
  return { tow: httpsUrl(config.TOWBOOK_URL), freight: httpsUrl(config.TOWBOOK_FREIGHT_URL), machinery: httpsUrl(config.TOWBOOK_MACHINERY_URL) };
}
const NEW_TAB = '<span class="sr"> (opens in a new tab)</span>';
const ext = (url, cls, label, detail) => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener" data-track="preview_book" data-track-detail="${esc(detail)}">${label}${NEW_TAB}</a>`;
const TEL = (detail) => `<a href="tel:+12483566011" data-track="preview_call" data-track-detail="${esc(detail)}"><span data-phone>248-356-6011</span></a>`;

export function renderOnline(config, where) {
  const L = towbookLinks(config), mode = String(config.TOWBOOK_MODE || 'link').toLowerCase();
  if (where === 'hero') {
    const btns = [[L.tow, 'Tow', 'tow'], [L.freight, 'Freight', 'freight'], [L.machinery, 'Machinery', 'machinery']].filter(([u]) => u);
    if (!btns.length || mode === 'none') return '';
    return `<div class="path path-online"><small id="ro-h">Request online</small><div class="ro-btns" role="group" aria-labelledby="ro-h">${btns.map(([u, label, k]) => ext(u, 'ro-btn', label, `hero ${k} request`)).join('')}</div></div>`;
  }
  if (where === 'tow') return L.tow && mode !== 'none' ? ext(L.tow, 'btn btn-line', 'Request a tow online', 'towing section tow request') : '';
  if (where === 'machinery') return L.machinery ? `<p class="more-link">${ext(L.machinery, 'btn btn-line', 'Request machinery hauling', 'machinery request')}</p>` : '';
  if (where === 'freight') {
    return `<div class="freight-towbook" id="freight-request"><h3>Request a freight quote</h3>`
      + (L.freight
        ? `<p class="hint">Tell us what's moving, where, and how big it is on our freight request form. It opens in a new tab.</p>${ext(L.freight, 'btn btn-call', 'Request a freight quote', 'freight request')}<p class="or-call">Or call ${TEL('freight request')}.</p>`
        : `<p class="hint">Call and tell us what's moving and where.</p><a class="btn btn-call" href="tel:+12483566011" data-track="preview_call" data-track-detail="freight"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Call <span class="num" data-phone>248-356-6011</span></a>`)
      + '</div>';
  }
  if (where === 'freight-inline') return L.freight ? ext(L.freight, 'btn btn-line', 'Request a freight quote', 'gallery freight request') : '';
  if (where === 'callbar') return L.freight ? ext(L.freight, 'cb-quote', 'Freight quote', 'call bar freight request') : '<a class="cb-quote" href="{{HOME}}#freight-request" data-track="preview_book" data-track-detail="call bar freight quote">Freight quote</a>';
  if (where === 'contact') {
    if (!L.tow || mode === 'none') return '';
    const intro = '<h3>Not urgent? Request a tow online</h3><p class="hint">For emergencies, call. We answer 24/7.</p>';
    if (mode === 'embed') {
      return `<div class="tow-alt tow-embed" data-url="${esc(L.tow)}">${intro}<div class="tb-box"><iframe src="${esc(L.tow)}" title="Online tow request form, hosted by Towbook" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
        + `<p class="tb-help">Having trouble? Call ${TEL('towbook embed')}. Or <a href="${esc(L.tow)}" target="_blank" rel="noopener">open the form in a new tab</a>.</p></div>`;
    }
    return `<div class="tow-alt">${intro}${ext(L.tow, 'btn btn-line tow-link', 'Request a tow online', 'contact tow request')}</div>`;
  }
  return '';
}

// ---------- Towbook QR ----------
export async function renderTowQr(config, qrToSvg) {
  const mode = String(config.TOWBOOK_MODE || '').toLowerCase();
  const url = httpsUrl(config.TOWBOOK_URL);
  if (!url || (mode !== 'link' && mode !== 'embed')) return '';
  const img = String(config.TOWBOOK_QR_IMG || '').trim();
  const art = img
    ? `<img src="/${esc(img.replace(/^\/+/, ''))}" width="148" height="148" alt="QR code for the online tow request">`
    : (await qrToSvg(url)).replace('<svg ', '<svg role="img" aria-label="QR code for the online tow request" ');
  return `<figure class="tb-qr">${art}<figcaption>Scan to request a tow</figcaption></figure>`;
}

export function loadData(root) {
  return {
    reviews: readJSON(root, 'src/data/reviews.json', { reviews: [] }),
    partners: readJSON(root, 'src/data/partners.json', { agencies: [], dealers: [] }),
    gallery: readJSON(root, 'src/data/gallery.json', []),
  };
}
