import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG as FILE_CONFIG } from './src/config.js';
import { renderPage, sitemap, siteUrl, PAGE_FILES } from './scripts/html.mjs';
import { CITIES, cityPath } from './scripts/cities.mjs';
import { SERVICE_PAGES, servicePath } from './scripts/services.mjs';
import { robotsTxt, llmsTxt } from './scripts/seo.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

// The site is live at the root of rosstow.com (Nov 10, 2026, see LAUNCH.md). Set VITE_BASE=/ross-towing/ only to build for the old github.io project path.
const BASE = process.env.VITE_BASE || '/';

// One-off builds (QA, previews of a mode) can override config without editing the file:
//   ROSS_CONFIG='{"TOWBOOK_MODE":"link","TOWBOOK_URL":"https://example.com"}' npm run build
const OVERRIDES = process.env.ROSS_CONFIG ? JSON.parse(process.env.ROSS_CONFIG) : {};
const CONFIG = { ...FILE_CONFIG, ...OVERRIDES };

function rossSite() {
  let dev = false;
  return {
    name: 'ross-site',
    configResolved(c) { dev = c.command === 'serve'; },
    // Runtime code sees the same overrides as the build.
    transform(code, id) {
      if (Object.keys(OVERRIDES).length && id.replace(/\\/g, '/').endsWith('/src/config.js')) {
        return `${code}\nObject.assign(CONFIG, ${JSON.stringify(OVERRIDES)});\n`;
      }
    },
    // Partials, head tags, reviews, partner rows, gallery markup: all written into the HTML at build
    // time, so the pages work with JavaScript off and nothing unapproved ships in the bundle.
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => renderPage(html, { page: path.relative(root, ctx.filename).replace(/\\/g, '/'), base: BASE, config: CONFIG, dev, root }),
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(CONFIG, root) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteUrl(CONFIG)) });
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt(siteUrl(CONFIG), CITIES.map((c) => ({ name: c.name, path: cityPath(c) })), SERVICE_PAGES.map((s) => ({ name: s.name, path: servicePath(s), summary: s.summary }))) });
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [rossSite()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Every page is its own HTML entry.
      input: Object.fromEntries(
        PAGE_FILES
          .filter((f) => fs.existsSync(path.join(root, f)))
          .map((f) => [f.replace(/\/index\.html$|\.html$/, '').replace(/\W+/g, '_') || 'main', path.join(root, f)]),
      ),
    },
  },
});
