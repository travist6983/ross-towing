// Build-time HTML for every page (called from vite.config.js). Fills in shared partials, head tags
// and config-driven sections. Keeping this at build time means the pages work with JavaScript off
// and nothing that isn't approved (dealer names, logos without permission) ever ships.
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { loadData, renderReviews, reviewSchema, renderPartners, renderTraining, renderGallery, renderTeaser, renderTowQr, renderOnline } from './sections.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const siteUrl = (config) => String(config.SITE_URL || '').replace(/\/?$/, '/');

const PAGES = {
  'index.html': { path: '', home: '' },
  'gallery/index.html': { path: 'gallery/' },
  '404.html': { path: null },
};

function includes(html, root, depth = 0) {
  if (depth > 4) return html;
  return html.replace(/<!-- @include ([\w.-]+) -->/g, (_, name) => includes(fs.readFileSync(path.join(root, 'src/partials', name), 'utf8'), root, depth + 1));
}

function head({ page, config }) {
  const url = siteUrl(config), info = PAGES[page] || {};
  const out = [];
  if (config.NOINDEX) out.push('<meta name="robots" content="noindex">');
  if (info.path != null) {
    out.push(`<link rel="canonical" href="${esc(url + info.path)}">`);
    out.push(`<meta property="og:url" content="${esc(url + info.path)}">`);
  }
  out.push('<meta property="og:type" content="website">', '<meta property="og:site_name" content="Ross Towing">');
  out.push(`<meta property="og:image" content="${esc(url)}img/rotator-night-1206.jpg">`);
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
  const sections = {
    reviews: (slot) => renderReviews(data.reviews, slot),
    partners: (group) => renderPartners(data.partners[group], { group, dev, logoExists }),
    training: () => renderTraining(data.gallery),
    gallery: () => renderGallery(data.gallery, base),
    teaser: () => renderTeaser(data.gallery, base),
    online: (where) => renderOnline(config, where),
  };
  let out = includes(html, root);
  out = out.replace('<!-- @head -->', head(ctx));
  out = out.replace(/<!-- @section ([\w-]+)(?: ([\w-]+))? -->/g, (_, name, arg) => (sections[name] ? sections[name](arg) : ''));
  if (out.includes('<!-- @towqr -->')) out = out.replace('<!-- @towqr -->', await renderTowQr(config, qrToSvg));
  const schema = reviewSchema(data.reviews);
  return out
    .replace('"{{REVIEW_SCHEMA}}"', JSON.stringify(schema))
    .replaceAll('{{HOME}}', info.home ?? base)
    .replaceAll('{{BASE}}', base)
    .replaceAll('{{SITE_URL}}', siteUrl(config))
    .replaceAll('{{NAV_GALLERY}}', page === 'gallery/index.html' ? ' aria-current="page"' : '');
}

export function sitemap(config, root) {
  const url = siteUrl(config);
  const pages = Object.entries(PAGES).filter(([file, p]) => p.path != null && fs.existsSync(path.join(root, file))).map(([, p]) => p).map((p) => `  <url><loc>${esc(url + p.path)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.join('\n')}\n</urlset>\n`;
}
