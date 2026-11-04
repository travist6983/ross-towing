# Moving Ross Towing out of journeymanwebco.com

The site started as `preview/ross-towing/` inside the journeymanwebco.com repo (local: `~/repos/personal/lead-scout`, served at https://journeymanwebco.com/preview/ross-towing/). It now lives here, in `travist6983/ross-towing`, deployed by GitHub Actions to https://travist6983.github.io/ross-towing/.

## Inventory (what the preview depended on)

**Inside `preview/ross-towing/`** (copied, nothing shared with other previews):

| What | Old path | New path |
|---|---|---|
| Page (copy, markup, inline CSS) | `index.html` | `index.html`, with shared parts split into `src/partials/` (CSS, icons, header, footer, call bar) |
| Scroll journey | `journey.js` | `journey.js` (menu moved to `src/menu.js`) |
| Forms, Towbook, auction | `src/*.js` | `src/*.js` |
| Auction date | `data/auction.json` | `src/data/auction.json`, built into the page |
| Photos, logo (AVIF, WebP, JPEG/PNG; EXIF stripped, 3 plates blurred) | `img/` | `public/img/` |
| Fonts (Barlow, Barlow Condensed, self hosted) | `fonts/` | `public/fonts/` |
| GSAP, ScrollTrigger, MotionPathPlugin, Lenis | `vendor/` | `public/vendor/` |
| Copy source of truth, design tokens | `content.json`, `design-tokens.json` | same |
| Unit tests, sheet template | `tests/`, `docs/` | same |

**Outside the folder** (shared with every preview, so referenced, never moved):

| What | Where | On the new site |
|---|---|---|
| Lead tracker (`?r=<tracking id>`, the CRM's "preview opened" signal) | `/track.js` at the journeymanwebco.com root, posting to the `journeyman-contact` Worker | Loaded from `https://journeymanwebco.com/track.js` while `JWC_TRACKING` is true. The Worker now also accepts `https://travist6983.github.io` |
| Tracker endpoint | `<meta name="jwc-endpoint">` in the page head | Same tag, added at build time while `JWC_TRACKING` is true |
| Site config and Cloudflare Web Analytics | `/config.js` at the root | Not used. Its analytics only run on journeymanwebco.com |
| Private notes, QA, screenshots, Jennifer's original files | `lead-scout/private/ross-towing/` (gitignored) | Stay private. Not copied |

**Base path.** The old page had no build step and used relative paths everywhere, so nothing assumed `/preview/ross-towing/` except the JSON-LD logo URL (an absolute journeymanwebco.com address). Now:

- `VITE_BASE` sets the base (default `/ross-towing/`, `/` at launch).
- `SITE_URL` in `src/config.js` sets the canonical URL, `og:url`, `sitemap.xml` and the JSON-LD URLs.
- `NOINDEX` in `src/config.js` adds `<meta name="robots" content="noindex">` to every page. There's no robots.txt disallow, so search engines can read the noindex.

## What changed in the move

- **Build:** Vite multi-page build (`index.html`, `gallery/index.html`, `404.html`). `scripts/html.mjs` fills in partials, head tags and config-driven sections at build time.
- **Deploy:** `.github/workflows/deploy.yml` runs `npm ci`, `npm test` and `npm run build` with `VITE_BASE=/ross-towing/`, then deploys `dist/` with `actions/deploy-pages`. Pages source is "GitHub Actions".
- **404:** a site-styled `404.html` with the call button.
- **Old URL:** journeymanwebco.com/preview/ross-towing/ is now a small redirect page.
  - It forwards to this site and keeps the query string and hash, so `?r=` links still count.
  - It's `noindex` and has a canonical link to the new address.
  - The old source stays in the lead-scout git history. Delete the old folder there only after Travis confirms the move worked.
