import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG as FILE_CONFIG } from './src/config.js';
import { renderPage, sitemap } from './scripts/html.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

// Pages project URL until launch ("/ross-towing/"); "/" once rosstow.com is connected (see LAUNCH.md).
const BASE = process.env.VITE_BASE || '/ross-towing/';

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
        [['main', 'index.html'], ['gallery', 'gallery/index.html'], ['notFound', '404.html']]
          .filter(([, f]) => fs.existsSync(path.join(root, f)))
          .map(([k, f]) => [k, path.join(root, f)]),
      ),
    },
  },
});
