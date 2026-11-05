# Ross Towing: Nov 4, 2026 update

Applies the Nov 4 call with Jennifer Gatt, her follow-up email, and Ross's Towbook links. The scroll journey, design system, photos and every existing fact are kept.

- Live: https://travist6983.github.io/ross-towing/
- Old link: https://journeymanwebco.com/preview/ross-towing/ forwards here.

## What changed

**Phase 0: own repo.**
- The site moved from the journeymanwebco.com repo to `travist6983/ross-towing`. See `MIGRATION.md`.
- **Build.** It was plain static files, so it's now a Vite multi-page build: home, `/gallery/` and a 404 page.
  - `VITE_BASE` sets the base path.
  - `SITE_URL` and `NOINDEX` in `src/config.js` drive the canonical, `og:url`, sitemap, JSON-LD and the noindex tag.
- **Deploy.** GitHub Actions: tests, build, deploy.
- **404 page.** Site styled, with a call button.
- **Old link.** The journeymanwebco.com preview is now a redirect page. It keeps the query string and hash, so a `?r=` tracking id reaches the new site and is recorded there.
- **Tracking.** The Journeyman tracker loads from journeymanwebco.com while `JWC_TRACKING` is true. The `journeyman-contact` Worker now accepts `https://travist6983.github.io`, so Jen's visits still show in the CRM.

**1. Indiana.**
- Freight lanes read "Michigan, Ohio and Indiana" in the hero, the freight lede and the lane label.
- The scroll story sign reads "MI / OH / IN".
- The JSON-LD freight `Service` has areaServed Michigan, Ohio and Indiana (`State`). Towing areaServed is unchanged.
- The "I-75 to Ohio" label on the towing map is a road direction, not a lane, so it stays.

**2 and 3. Towbook links instead of forms (Travis's call, after Ross sent the links).**
- Ross sent three Towbook Web Request Form links: Towing, Freight and Machinery. They replace both of our forms.
- **Hero.** The call button stays first and largest. Next to it (under it on phones), "Request online" has three buttons: Tow, Freight, Machinery.
- **Sections:**
  - Towing: "Request a tow online"
  - Machinery hauling block: "Request machinery hauling"
  - Freight: a "Request a freight quote" box, with "Or call 248-356-6011"
  - Contact: "Not urgent? Request a tow online. For emergencies, call. We answer 24/7."
  - Mobile call bar: "Freight quote"
  - Gallery page: "Request a freight quote"
- **QR code.** A QR code for the tow link, generated at build time, sits beside the contact tow button on desktop only, captioned "Scan to request a tow".
- **Modes.** All of this lives in `src/config.js`. `TOWBOOK_MODE` is `"link"`; `"embed"` (iframe with automatic fallback) and `"none"` (call only) are built and tested.
- **Not shipped from the brief.** The freight form (change 2) and the tow form were built, then retired once the Towbook links arrived. They live in commit `edaf1a5` if they're ever needed: `formatFreightQuote()`, its tests, and the spam checks.
- **Not used.** The "Prefer to send details by email?" disclosure only made sense with our own form behind it.
- **Towbook.** Ross's three links all load as "LARRY ROSS GARAGE INC DBA ROSS TOWING". The Meade Lexus example link isn't used anywhere.

**4. Auction date.**
- **Sources.** The published Google Sheet CSV is read first (`AUCTION_SHEET_CSV_URL`, empty for now), then `src/data/auction.json` (`date: null`).
- **Rules.** The banner shows from 30 days before through the auction day, in Detroit time, and says "Public auction today" on the day.
- **Banner.** It has an "Add to calendar" .ics link and a close button, which is remembered per auction date. It doesn't shift the layout.
- **How-tos.** Both options (care plan, self serve) are in `README.md`, "Auction date". The Sheet template is `docs/auction-sheet-template.csv`.

**5. Reviews.**
- Three Google reviews are quoted word for word, each attributed as first name plus last initial with "Google review". No stars and no dates.
  - Aubrey D.: under accident recovery, in the heavy duty section. It shows the first part, as approved.
  - Kathy D.: in the towing section, right after the hero.
  - Jill S.: in "Getting your vehicle back".
- The other four are in `src/data/reviews.json` with `featured: false`.
- The three featured ones are also in the JSON-LD as `Review` (no ratings).
- Kathy's "the next day- even" is kept exactly as she wrote it. Changing that hyphen to a comma needs Travis's OK.
- The placeholder review cards in the trust section are gone.

**6. Police section.**
- Three FHPD K-9 training photos, captioned "Farmington Hills Police Department training at the Ross Towing facility."
- The plain text line "Trusted by the Farmington Hills Police and the Michigan State Police." is unchanged.
- An agency row from `src/data/partners.json` shows both names as text (no permission yet, so no logos).

**7. Dealer section.** A dealer logo row from `partners.json`. It shows nothing until a dealer has `"permission": true`. The six `[DEALER NAME]` placeholders show only in `npm run dev`, and the build check fails if one ever ships.

**8. Gallery.**
- New `/gallery/` page:
  - All / Towing / Freight filters, linkable as `#towing` and `#freight`.
  - Accessible lightbox: Esc, arrow keys, swipe, focus kept inside while open and returned on close.
  - Works with JavaScript off.
- Linked from the nav, the footer, "See more recovery work", "See more freight loads", and the homepage "Recent work" row (4 featured photos).
- Pipeline: `npm run gallery`. Originals in `gallery-src/` stay out of git.
- 13 photos (7 towing, 6 freight) plus the 3 training photos.
- On phones the grid is two across, which keeps the page fast. Captions show in the lightbox there, and under the photos from tablet width up.

## Photo review

**Blurred:**
- IMG_5089: the SUV's plate.
- IMG_5382: a tag on a semi's grille, plus the bus company's two logos, its website and its USDOT number. The bus is the customer's vehicle.

**Cropped:** IMG_1695 is cropped to the dog, the handler's legs and the car. The top had a third party trailer with its phone number, and the handler's face.

**Excluded, for Travis to decide:**
1. IMG_6358: a Ross rollback with two police SUVs, lights on, on a road. It looks like an active scene.
2. `recovery-rollover-night` and `freeway-recovery` (from Nov 3) are recovery scenes before they were cleared, so they're kept out of the gallery. Both are still on the homepage as approved on Nov 3. Decide whether they stay there.
3. `salt-flats`: still waiting on "is the brown truck a Ross truck?" from Nov 3. Kept out of the gallery; still on the homepage.

**Also note:**
- IMG_1682 shows two plainclothes officers' faces at medium distance, not close up.
- None of Jennifer's 8 new photos is a freight load. The freight tab uses the 6 freight photos already approved on Nov 3.

**Needs alt text:** none. All 16 photos have written alt text.

## TODOs left

| Item | Where | Now |
|---|---|---|
| Auction Sheet (Option B only) | `AUCTION_SHEET_CSV_URL` in `src/config.js` | Empty; uses `src/data/auction.json` (`date: null`) |
| Agency logos (FHPD, MSP) | `src/data/partners.json` + `public/logos/` | Names only until Ross confirms each agency's written OK. Files received are prepared in `assets-incoming/logos/ready/` (gitignored) |
| Dealer names and logos | `src/data/partners.json` | Nothing shows (see below) |
| "Read more reviews on Google" link | Reviews | Needs Ross's Google Business Profile URL. None is in the codebase |
| Official Towbook QR image (optional) | `TOWBOOK_QR_IMG` | Empty; the built-in QR is generated from the tow link |
| Release hours | "Getting your vehicle back" | Card now says office hours (see "Pre-send fixes" below). Confirm release hours with Jennifer |
| Excluded photos | Photo review above | Travis to decide |
| Delete the old preview folder | lead-scout `preview/ross-towing/` | Kept until Travis confirms the move worked |

**Dealer logos received but not used:**
- Serra Automotive, Tamaroff / Jeffrey Automotive Group, Glassman Automotive Group, Meade Lexus of Southfield.
- They stay off the site until Ross sends the dealer list and confirms each dealer's permission.
- The Tamaroff and Glassman files also carry carmaker logos (Acura, Honda, Kia, Nissan, Hyundai, Subaru, Saab). Those need a dealer group only version, or the carmakers' OK.

**No longer needed:** form endpoints and a form recipient email. The site has no forms.

## Questions for Jennifer

1. Can you confirm the three Towbook links (Towing, Freight, Machinery) each land requests where you want them? Do you have an official QR code for the website tow link, or is the one we generate from the link fine?
2. Which dealerships should we list, and can you send logos with just the dealership name, without the carmaker logos?
3. Have the Farmington Hills PD, the Michigan State Police and each dealership said it's OK to show their logos on your site? Until then we show the agencies' names, and no dealers.
4. Any states or lanes beyond Michigan, Ohio and Indiana?
5. For auctions: do you want us to update the date (care plan), or a Google Sheet you edit yourself?

## QA (Nov 4)

**Unit tests:** `npm test` passes 21 of 21.
- `getAuctionState`: no rows, past only, 31 and 30 days out, today, yesterday, two upcoming rows, DST both ways.
- The CSV parser and the .ics file.
- The three review quotes against the approved text.
- The partner permission rules.
- The Towbook buttons and QR.

**Build guard:** `check-dist` passes on all 196 files in `dist/`:
- No EXIF, GPS or XMP data.
- No dealer placeholders and no Meade Lexus.
- The only phone number is 248-356-6011.
- No en or em dashes.
- Noindex on every page.

**Browser:** 50 of 50 checks pass at 390, 1024 and 1440 on a local gzip server with the same `/ross-towing/` base as GitHub Pages.
- **Towbook links:**
  - Every button points at the right link, in a new tab with noopener.
  - The call button is first and in the first viewport. There are no forms.
  - The QR shows on desktop only.
  - "none" and "embed" were checked with config overrides, including embed falling back when Towbook is unreachable.
- **Reviews:** the quotes on the page match the approved text exactly. Review schema has no ratings.
- **Partners:**
  - Names only, no dealers.
  - With a test logo and `permission: true`, both logo rows rendered it. That test build was then discarded.
- **Gallery:**
  - Hash links open the right tab, and the filters work.
  - The lightbox works by keyboard (Enter, arrows, focus trapped, Esc, focus returns) and by swipe.
  - Thumbnails lazy load.
  - With JavaScript off it's a plain grid of 13 linked photos.
- **Auction:** the date shows 10 days out and on the day, and stays hidden 45 days out and yesterday. These used test builds with `auction.json` changed, then put back to `date: null`.
  - With a mocked Sheet, the soonest row wins, and a 404 falls back to the JSON.
  - No public test Sheet was provided, so the Sheet path wasn't tried against Google itself.
- **CLS:** under 0.03 everywhere tested.
- **Reduced motion:** 6 still trucks on desktop, 4 on mobile.
- **Smoke test:** no broken images, horizontal scroll or console errors on home, gallery or 404 at all three widths.

**Lighthouse** (gzip):

| Page | Perf | A11y | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| Home, mobile | 100 | 100 | 100 | 0.8s | 0.003 | 0ms |
| Home, desktop | 100 | 100 | 100 | 0.2s | 0.002 | 0ms |
| Gallery, mobile | 100 | 100 | 100 | 0.8s | 0.003 | 0ms |
| Gallery, desktop | 100 | 100 | 100 | 0.4s | 0.002 | 0ms |

The home page is unchanged from Nov 3 (mobile LCP 0.8s). SEO is 66 on every page because of the noindex until launch.

**Fixed during QA:**
- The gallery's first mobile run had LCP 2.9s and CLS 0.049. Two thumbnails across on phones, one high-priority first photo, and filter tabs reserved before first paint brought it to 0.8s and 0.003.
- Lightbox links were missing the base path.

## Launch

The steps to connect rosstow.com are written in `LAUNCH.md` and haven't been run. They need GoDaddy access, saved DNS records, Jennifer's email records written down, and Travis saying "launch".

## Pre-send fixes (Nov 4, evening)

These are fixes from an audit of the live page before Travis sends it to Jennifer. Nothing else changed.

**Reviews section.**
- New "What customers say" section (`#reviews`), right after "Family owned since 1962".
- It holds the 4.7 rating, three review cards (Aubrey D., Kathy D., Jill S., each "Google review") and "What reviewers bring up most". The rating and themes moved in from the trust section.
- The text is unchanged and quoted exactly, including "the next day- even".
- The three inline reviews in Towing, Heavy duty and Vehicle release are removed, so no review appears twice. No gaps were left behind.
- The cards have no reveal animation. They show with JavaScript off and with reduced motion (both tested).
- "Reviews" is in the main nav between Auctions and Gallery, desktop and mobile. It fits on one line at 1024, so "Vehicle Release" kept its full name.
- Review schema is still the three reviews, with no ratings and no AggregateRating.

**Release hours.**
- The placeholder is gone. The card now reads "During office hours: Monday to Friday 9am to 5pm, Saturday 9am to 1pm. Call ahead to make sure your vehicle is ready."
- The release cards now align to the top, so "Cash only." sits right under "Payment".

**QR codes.**
- Two new QR codes, built at build time from the same config links as their buttons, desktop only (1024px and wider):
  - "Scan to request a freight quote", beside the freight button.
  - "Scan to request machinery hauling", beside the machinery button.
- The tow QR now uses the same 1024px rule.
- All three were decoded in the browser test, and each scans to the exact link of the button next to it.
- There was no `assets-incoming/qr/` folder and no QR PDFs anywhere in Downloads. So Ross's own QR codes weren't compared with ours: nothing to decode, and no match or mismatch to report. If Travis drops the PDFs in `assets-incoming/qr/`, decode them (`zbarimg`) and compare with `TOWBOOK_URL`, `TOWBOOK_FREIGHT_URL` and `TOWBOOK_MACHINERY_URL`.

**Map label.** "I-75 to Ohio ↓" now reads "I-75 to Ohio and Indiana ↓". It's set on two lines at the right edge, with a light outline so it reads over the road line. It fits at 390 with no overlap.

**Gallery captions.** The 9 photos without one got a short caption based only on what each shows, for example "Heavy wrecker 88." and "Two forklifts strapped down on a Landoll trailer." All 13 now have one.

### QA (pre-send)

**Browser:** 31 of 31 new checks pass at 390, 1024 and 1440.
- The reviews section is visible on scroll, with the exact text.
- The nav fits, and the mobile menu link reaches the section.
- No horizontal overflow, and the console is clean.
- The release card text and alignment are right.
- The QR codes show on desktop only, and each decodes to its button's link.
- The map label fits.
- With JavaScript off and with reduced motion, all three reviews show.
- Every gallery photo has a caption, and the lightbox shows it.

**Regression:** the earlier 50 checks still pass.

**Build:** `npm test` passes 21 of 21. `check-dist` is clean on 196 files.

**Greps on `dist/`:**
- No "[RELEASE HOURS]" and no en or em dashes.
- The only bracket text is "[IN BRACKETS]", 3 times. That's the concept-preview banner on the home, gallery and 404 pages, which explains placeholders. It isn't one itself.

**Lighthouse:** 100 / 100 / 100 on home and gallery, mobile and desktop.
- Mobile: LCP 0.8s, CLS 0.003.
- Desktop: LCP 0.2s (home) and 0.4s (gallery).

### Remaining TODOs

- Confirm release hours with Jennifer.
- Compare Ross's QR PDFs with the config links once they're in `assets-incoming/qr/`.
- Still open from above:
  - Agency and dealer logo permissions, and the dealer list.
  - The auction Sheet (Option B only).
  - Ross's Google reviews link.
  - Decisions on the excluded photos.
  - Deleting the old journeymanwebco preview folder once the move is confirmed.
