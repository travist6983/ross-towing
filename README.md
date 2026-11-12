# Ross Towing website

Website for Ross Towing, Southfield, Michigan. Static site built with Vite and deployed to GitHub Pages: no backend, no server functions, no database.

- Live (until launch): https://travist6983.github.io/ross-towing/
- Final domain: rosstow.com, not connected yet. See `LAUNCH.md`.
- Moved here from journeymanwebco.com/preview/ross-towing/, which now redirects here. See `MIGRATION.md`.

## Run and deploy

```bash
npm install
npm run dev        # http://localhost:5173/ross-towing/
npm test           # unit tests
npm run build      # dist/, the same build GitHub Actions deploys
npm run preview    # serve dist/ locally
```

Push to `main` and `.github/workflows/deploy.yml` tests, builds and deploys in about two minutes. Pages source is "GitHub Actions".

| File | What it is |
|---|---|
| `index.html`, `gallery/index.html`, `404.html` | The pages |
| `src/partials/` | Shared CSS, icons, header, footer and call bar, filled in at build time |
| `scripts/html.mjs` | Build-time HTML: partials, head tags, config-driven sections |
| `journey.js` | The scroll journey (road and truck drawings only) |
| `src/config.js` | Every switch: site URL, noindex, tracker, Towbook links, auction Sheet |
| `scripts/sections.mjs` | Reviews, partner logo rows, training strip, gallery, Towbook buttons and QR, written into the HTML at build time |
| `src/main.js` | Freight quote form, auction banner and the Towbook embed fallback |
| `src/forms.js`, `src/messages.js` | Freight form validation and sending; the quote's wording, shared with the Worker's email |
| `worker/` | Cloudflare Worker that emails freight quotes (own package, not in the Pages build) |
| `src/gallery.js` | Gallery filters and lightbox |
| `src/data/reviews.json`, `partners.json`, `gallery-captions.json`, `gallery.json` | Reviews, agency and dealer logos, photo captions, and the generated photo list |
| `scripts/build-gallery.mjs` | Photo pipeline (`npm run gallery`) |
| `scripts/check-dist.mjs` | Runs after every build; fails on image metadata, placeholders, a second phone number or dashes |
| `src/auction.js` | `getAuctionState()`, the CSV parser and the .ics builder |
| `src/data/auction.json` | Auction date fallback (Option A) |
| `public/` | Images, fonts, vendored GSAP/Lenis, processed gallery photos and the downloadable forms, copied as is |
| `public/forms/`, `scripts/forms/` | Property owner authorization form (PPI) and driver employment application PDFs, and the Python scripts that make them |
| `docs/auction-sheet-template.csv` | Starter file for the auction Sheet (Option B) |
| `tests/` | Unit tests |

Everything in this repo is public, so keep private notes about the client out of it.

The Journeyman preview tracker (`journeymanwebco.com/track.js`) loads while `JWC_TRACKING` is true in `src/config.js`. It records visits from `?r=` links in the CRM. It's switched off at launch.

## Towbook

Ross dispatches in Towbook, and its Web Request Form is the main integration: a link where a customer's request lands in Towbook as a call. The freight section also has its own quote form under the Towbook button, emailed to the office by the Cloudflare Worker in `worker/` (see worker/README.md). Ross sent three links on Nov 4, 2026, and they live in `src/config.js`:

| Config | Towbook form | Buttons on the site |
|---|---|---|
| `TOWBOOK_URL` | Towing | Hero "Request online: Tow", the towing section, "Not urgent? Request a tow online" in the contact section, and the QR code |
| `TOWBOOK_FREIGHT_URL` | Freight | Hero "Freight", the freight section's "Request a freight quote" (with a QR code on desktop), the mobile call bar's "Freight quote", and the gallery page |
| `TOWBOOK_MACHINERY_URL` | Machinery | Hero "Machinery" and "Request machinery hauling" in the machinery hauling block (with a QR code on desktop) |

Every button opens Towbook in a new tab (`rel="noopener"`). The call button always comes first and stays the largest action. An empty link hides its buttons. The freight section falls back to a call button.

`TOWBOOK_MODE` controls the tow request in the contact section:

| Mode | What visitors see |
|---|---|
| `"link"` (now) | A "Request a tow online" button. On desktop, a QR code beside it captioned "Scan to request a tow" (phones get the button instead) |
| `"embed"` | `TOWBOOK_URL` in a lazy loaded, titled iframe (fixed height, no layout shift), with "Having trouble? Call 248-356-6011" and an "open the form in a new tab" link |
| `"none"` | Call only, no online tow request (the freight and machinery buttons still show) |

About "embed":
- On Nov 4, Towbook sent no X-Frame-Options or frame-ancestors headers for Ross's links, so embedding works today. Check again before switching: `curl -sI "<link>" | grep -i -E 'x-frame-options|frame-ancestors'`.
- If Towbook can't be reached, or the frame doesn't load within 10 seconds, the page falls back to the link button.
- A browser can't tell the page when Towbook refuses to be framed. That's why the new tab link always sits under the frame.

The three QR codes (tow, freight, machinery) are generated at build time from the same config values as their buttons (the `qrcode` package, SVG). They always match the links and show at 1024px and wider only. To use an official QR image instead:
1. Put it under `public/`.
2. Set `TOWBOOK_QR_IMG` to that path.

Never use the Meade Lexus link from Jennifer's screenshots. It belongs to a dealer account and would file website requests under that dealer.

## Reviews

- `src/data/reviews.json` holds the seven Google reviews Jennifer sent, word for word.
- The featured three show as cards in "What customers say" (`#reviews`), in the file's order: Aubrey D., Kathy D., Jill S.
  - That section sits right after "Family owned since 1962", with the 4.7 rating and "What reviewers bring up most".
  - It's in the main nav as "Reviews".
- To swap a review in, set its `"featured": true` and set the one it replaces to `false`.
- Never edit, merge or shorten review text. The one exception: Aubrey's shows the first part, exactly as approved (`"show": "excerpt"`).
- Attribution is first name plus last initial. No stars, ratings or relative dates.
- The cards have no reveal animation, so they show with JavaScript off and with reduced motion.
- The three featured reviews also go into the JSON-LD as `Review` (no ratings).
- A "Read more reviews on Google" link waits for Ross's Google Business Profile URL (TODO).

## Agency and dealer logos

`src/data/partners.json` drives two logo rows: agencies (Farmington Hills PD, Michigan State Police) in the police section, and dealers in the dealer section.

- A logo renders only when its file exists under `public/` AND `"permission": true`.
- Without that, agencies show their name as plain text. Dealers show nothing at all, name or logo.
- `[DEALER NAME 1]` to `[DEALER NAME 6]` are placeholders. They show in `npm run dev` only, and the build check fails if one ever reaches `dist/`.
- **Permission rule.**
  - Police patches, seals and the Michigan State Police emblem are controlled by those agencies, and MSP restricts outside use of its emblem.
  - Dealership logos are their trademarks.
  - A logo goes live only after Ross confirms in writing that each agency or dealership approved its use. Until then: names only (agencies) or nothing (dealers).
  - Never draw, recreate or approximate a badge, seal or emblem.
- **Files.**
  - SVG preferred, else PNG at 2x (96 px tall). Under 30 KB, all about the same height. Put them in `public/logos/`.
  - Logos show grayscale until hovered on desktop. Nothing depends on hover.
- Logos received so far are prepared in `assets-incoming/logos/ready/` (gitignored, not published) until permission is confirmed.

## Adding gallery photos

The gallery page (`/gallery/`) shows towing and freight photos with All / Towing / Freight filters (`gallery/#towing` and `gallery/#freight` link straight to a tab) and a lightbox. The homepage "Recent work" row shows photos marked `"featured": true`.

1. Drop the original photos in `gallery-src/towing/` or `gallery-src/freight/`. FHPD training photos go in `gallery-src/training/`, which feeds the strip in the police section. Originals never go in git.
2. Optionally add an entry to `src/data/gallery-captions.json`, keyed `"towing/IMG_1234.jpeg"`:
   - `alt` describes only what's visible.
   - `caption`, `date` (`"2026-11"`) and `featured` are optional.
   - `crop` takes `{x, y, w, h}`.
   - `blurRegions` takes a list of `{x, y, w, h}` boxes, in the photo's own pixels, for plates, names and numbers.
3. Run `npm run gallery` and check the page with `npm run dev`.
4. Commit `public/gallery/` and `src/data/gallery.json`, then push.

What the pipeline does:
- It rotates each photo by EXIF.
- It applies the crop and blurs.
- It strips all metadata (EXIF, GPS).
- It writes AVIF and WebP at 480, 960 and 1600 px, plus a tiny blurred placeholder.
- It skips photos that haven't changed.
- Photos without an `alt` get "Ross Towing towing job" or "Ross Towing freight load". Fill those in.

Before adding any photo, check it:
- Blur readable plates on customer vehicles.
- Leave out people's faces at accident scenes, injured people, close ups of officers' faces, crash victims' belongings, and any scene before it's cleared.
- When in doubt, leave it out and ask.

## Auction date

Public auctions run about every two months. The auctions block shows the next date from 30 days before through the auction day ("Next public auction: Saturday, December 12", plus time and location), with an "Add to calendar" button and a close button. On the day it says "Public auction today". From the day after, and whenever nothing is scheduled, it shows "Public auctions about every two months. Call 248-356-6011 for the next date."

The date in `src/data/auction.json` is also written into the pages at build time (`scripts/auction.mjs`): the home page's auctions line, the vehicle release page, an Event in the JSON-LD on both, and a line in `llms.txt`. So search engines, AI search and visitors with JavaScript off see it too. From the day after the auction, `src/auction-swap.js` puts the "call for the next date" line back on the page, but the schema and `llms.txt` keep the old date until the next push, so set the next date (or `null`) soon after each auction. A date in the Google Sheet (Option B) only drives the banner.

All dates follow Detroit time, whatever time zone a visitor is in. Visitors who close the banner don't see it again for that auction date.

To preview any date on the live page without changing anything, add `?auction=2026-12-12` to the URL.

### Option A: care plan (Travis updates it)

1. Leave `AUCTION_SHEET_CSV_URL` empty in `src/config.js`.
2. Edit `src/data/auction.json`:
   ```json
   { "date": "2026-12-12", "time": "10:00 AM", "location": "21360 Telegraph Rd, Southfield, MI 48033", "showFromDaysBefore": 30, "note": null }
   ```
3. Commit and push. The workflow redeploys in about two minutes. Set `date` back to `null` after the auction if no next date is known (it hides itself either way).

### Option B: self serve (Jennifer edits a Google Sheet)

Set up once:

1. Create a Google Sheet. Row 1 is the header, exactly: `date`, `time`, `location`, `note`. Or import `docs/auction-sheet-template.csv` (File > Import). Its example row has a past date, so it never shows.
2. Type each auction on its own row. `date` as `2026-12-12` (`12/12/2026` also works). `time`, `location` and `note` are optional. A blank location uses the address from `src/data/auction.json`.
3. File > Share > Publish to web. Under Link, pick the sheet tab (not "Entire document") and "Comma-separated values (.csv)". Click Publish and copy the link. It looks like `https://docs.google.com/spreadsheets/d/e/<id>/pub?gid=0&single=true&output=csv`.
4. Paste it into `AUCTION_SHEET_CSV_URL` in `src/config.js`, commit and push once.

After that, edits in the Sheet show on the site on their own. Google refreshes published CSVs on its own schedule, usually within about 5 minutes, and the page keeps what it read for 10 minutes per visitor session. So allow up to about 15 minutes.

Rules the page follows:

- Several rows are fine. It uses the soonest date that hasn't passed. Old rows can stay.
- Blank rows are ignored. A row with a date it can't read is skipped with a console warning. The page never breaks.
- The Sheet is read after the page has loaded, with a 4 second timeout. If it's slow, unreachable, unpublished or empty, the page uses `src/data/auction.json` instead.
- `showFromDaysBefore` in `src/data/auction.json` applies to the Sheet too.

Screenshots for Jennifer's how-to (to capture):

1. `[SCREENSHOT: new Sheet with date, time, location, note in row 1 and one auction in row 2]`
2. `[SCREENSHOT: File menu > Share > Publish to web]`
3. `[SCREENSHOT: Publish to web dialog, sheet tab and "Comma-separated values (.csv)" selected]`
4. `[SCREENSHOT: the published link to copy]`
5. `[SCREENSHOT: the Sheet after adding the next auction date]`

## Search and AI search

`scripts/seo.mjs` is the one place for the business's name, address and phone, its services and the cities in "Where we tow". The build turns it into:

- JSON-LD (`AutomotiveBusiness` plus `WebSite`) in the head of the home page and the gallery. The home page adds the three featured reviews, because that's where they're shown.
- `robots.txt` (allow everything, points to the sitemap) and `llms.txt` (a plain summary for AI assistants) at the site root, next to `sitemap.xml`.

Each page's Open Graph and Twitter tags copy its own `<title>` and meta description, so give every new page both. The 404 page gets noindex and no JSON-LD. Add a fact to `seo.mjs` only after it's on the page too: search engines check that the two match. `tests/seo.test.js` checks that the address matches the footer and the cities match the home page.

## Tests

```bash
npm test
```

Covers `getAuctionState` (no rows, past only, 31 and 30 days out, today, yesterday, two upcoming rows, DST changes), the CSV parser, the .ics file, the three review quotes (word for word), the partner permission rules and the Towbook buttons.

`npm run build` also runs `scripts/check-dist.mjs`, which fails the build if any image in `dist/` carries EXIF, GPS or XMP data, if a dealer placeholder or the Meade Lexus example appears, if a page shows a second phone number or an en or em dash, or if a page is missing noindex while `NOINDEX` is on.

## Downloadable forms

Two PDFs live in `public/forms/` and are linked from the page and the footer:

| File | Linked from | Made by |
|---|---|---|
| `ross-towing-ppi-authorization-form.pdf` | Private Property Impounds (`#ppi`) | `scripts/forms/ppi_form.py`. Jennifer's "Unauthorized Vehicle Removal Form", word for word, as a printable PDF with boxes to type in (the signature is signed by hand) |
| `ross-towing-driver-employment-application.pdf` | Careers (`#careers`, in the "Family owned" section) | `scripts/forms/application.py`. The example driver application she sent, with Ross's name, address, phone and email filled into its company line and the note to carriers covered |

To change one, edit its script and run it (`pip install reportlab pypdf`, then `python3 scripts/forms/ppi_form.py` or `python3 scripts/forms/application.py`), then commit the new PDF. Don't change the authorization form's wording without Ross's OK.
