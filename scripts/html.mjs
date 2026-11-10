// Build-time HTML for every page (called from vite.config.js). Fills in shared partials, head tags
// and config-driven sections. Keeping this at build time means the pages work with JavaScript off
// and nothing that isn't approved (dealer names, logos without permission) ever ships.
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { businessSchema, jsonLd } from './seo.mjs';
import { CITIES, cityPath, cityTitle, citySchema, renderCity } from './cities.mjs';
import { SERVICE_PAGES, servicePath, serviceSchema, renderService } from './services.mjs';
import { loadData, renderReviews, reviewSchema, renderPartners, renderTraining, renderGallery, renderTeaser, renderTowQr, renderOnline, buildQrs } from './sections.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const siteUrl = (config) => String(config.SITE_URL || '').replace(/\/?$/, '/');

// path: where the page lives (null: not a real page, so no canonical, no sitemap entry, noindex).
// schema: the business JSON-LD goes on the page; reviews only where the reviews are shown.
const PAGES = {
  'index.html': { path: '', home: '', schema: 'reviews' },
  'gallery/index.html': { path: 'gallery/', schema: 'plain' },
  '404.html': { path: null },
  // One "Towing in <city>" page per city in the home page's service area list (scripts/cities.mjs).
  ...Object.fromEntries(CITIES.map((c) => [`${cityPath(c)}index.html`, { path: cityPath(c), schema: 'plain', city: c.slug }])),
  // One page per service the home page lists (scripts/services.mjs).
  ...Object.fromEntries(SERVICE_PAGES.map((s) => [`${servicePath(s)}index.html`, { path: servicePath(s), schema: 'plain', service: s.slug }])),
};
export const PAGE_FILES = Object.keys(PAGES);

const attr = (html, re) => (html.match(re) || [])[1] || '';
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

function includes(html, root, depth = 0) {
  if (depth > 4) return html;
  return html.replace(/<!-- @include ([\w.-]+) -->/g, (_, name) => includes(fs.readFileSync(path.join(root, 'src/partials', name), 'utf8'), root, depth + 1));
}

// Head tags for one page. title and description come from the page's own <title> and meta description,
// so Open Graph and Twitter cards always match what search shows.
function head({ page, config }, { title, description, reviews }) {
  const url = siteUrl(config), info = PAGES[page] || {};
  const out = [];
  if (config.NOINDEX || info.path == null) out.push('<meta name="robots" content="noindex">');
  if (info.path != null) {
    out.push(`<link rel="canonical" href="${esc(url + info.path)}">`);
    out.push(`<meta property="og:url" content="${esc(url + info.path)}">`);
  }
  out.push('<meta property="og:type" content="website">', '<meta property="og:site_name" content="Ross Towing">', '<meta property="og:locale" content="en_US">');
  if (title) out.push(`<meta property="og:title" content="${esc(title)}">`, `<meta name="twitter:title" content="${esc(title)}">`);
  if (description) out.push(`<meta property="og:description" content="${esc(description)}">`, `<meta name="twitter:description" content="${esc(description)}">`);
  out.push(`<meta property="og:image" content="${esc(url)}img/rotator-night-1206.jpg">`);
  out.push('<meta property="og:image:width" content="1206">', '<meta property="og:image:height" content="701">');
  out.push('<meta property="og:image:alt" content="Ross Towing rotator lit up at night">');
  out.push('<meta name="twitter:card" content="summary_large_image">');
  if (info.schema) out.push(jsonLd(businessSchema(url, { reviews: info.schema === 'reviews' ? reviews : [], extra: info.city ? citySchema(url, info.city) : info.service ? serviceSchema(url, info.service) : [] })));
  if (config.JWC_TRACKING) {
    out.push('<meta name="jwc-endpoint" content="https://journeyman-contact.travisjterry.workers.dev">');
    out.push('<script src="https://journeymanwebco.com/track.js" defer></script>');
  }
  return out.join('\n');
}

const qrToSvg = (url) => QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#15171A', light: '#FFFFFF' } });

export async function renderPage(html, ctx) {
  const { page, base, config, root, dev } = ctx;
  const info = PAGES[page] || {};
  const data = loadData(root);
  const logoExists = (rel) => fs.existsSync(path.join(root, 'public', rel.replace(/^\/+/, '')));
  const qr = await buildQrs(config, qrToSvg);
  const sections = {
    reviews: (slot) => renderReviews(data.reviews, slot),
    partners: (group) => renderPartners(data.partners[group], { group, dev, logoExists }),
    training: () => renderTraining(data.gallery),
    gallery: () => renderGallery(data.gallery, base),
    teaser: () => renderTeaser(data.gallery, base),
    online: (where) => renderOnline(config, where, qr),
  };
  let out = includes(html, root);
  if (info.city) {
    const c = CITIES.find((x) => x.slug === info.city);
    out = out.replace('{{CITY_TITLE}}', esc(cityTitle(c))).replace('{{CITY_DESCRIPTION}}', esc(c.description))
      .replace('<!-- @city -->', renderCity(c.slug, { base, gallery: data.gallery }));
  }
  if (info.service) {
    const s = SERVICE_PAGES.find((x) => x.slug === info.service);
    out = out.replace('{{PAGE_TITLE}}', esc(s.title)).replace('{{PAGE_DESCRIPTION}}', esc(s.description))
      .replace('<!-- @service -->', renderService(s.slug, { base, gallery: data.gallery }));
  }
  const title = decode(attr(out, /<title>([^<]*)<\/title>/));
  const description = decode(attr(out, /<meta name="description" content="([^"]*)">/));
  out = out.replace('<!-- @head -->', head(ctx, { title, description, reviews: reviewSchema(data.reviews) }));
  out = out.replace(/<!-- @section ([\w-]+)(?: ([\w-]+))? -->/g, (_, name, arg) => (sections[name] ? sections[name](arg) : ''));
  if (out.includes('<!-- @towqr -->')) out = out.replace('<!-- @towqr -->', await renderTowQr(config, qrToSvg));
  return out
    .replaceAll('{{HOME}}', info.home ?? base)
    .replaceAll('{{BASE}}', base)
    .replaceAll('{{SITE_URL}}', siteUrl(config))
    .replace('<!-- @city-links -->', CITIES.map((c) => `<a href="${base}${cityPath(c)}">${esc(c.name)}</a>`).join(' · '))
    .replace('<!-- @service-links -->', SERVICE_PAGES.map((s) => `<a href="${base}${servicePath(s)}">${esc(s.name)}</a>`).join(' · '))
    .replaceAll('{{NAV_GALLERY}}', page === 'gallery/index.html' ? ' aria-current="page"' : '');
}

export function sitemap(config, root) {
  const url = siteUrl(config);
  const pages = Object.entries(PAGES).filter(([file, p]) => p.path != null && fs.existsSync(path.join(root, file))).map(([, p]) => p).map((p) => `  <url><loc>${esc(url + p.path)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.join('\n')}\n</urlset>\n`;
}
