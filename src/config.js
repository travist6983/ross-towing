// Ross Towing site: every switch in one place. Change a value, commit, push; the GitHub Actions
// workflow rebuilds and redeploys in about two minutes. Nothing here is secret: it all ships publicly.
// Read at build time by vite.config.js (head tags, sitemap, QR code) and at run time by src/main.js.
export const CONFIG = {
  // ---- Site ----
  // The public address. Canonical, og:url, sitemap and JSON-LD come from it.
  // Until launch: the GitHub Pages address. At launch: "https://rosstow.com/" (see LAUNCH.md).
  SITE_URL: "https://travist6983.github.io/ross-towing/",

  // true until launch: every page gets <meta name="robots" content="noindex"> so the preview copies
  // don't compete with rosstow.com in search. Set to false at launch.
  NOINDEX: true,

  // true until launch: loads the Journeyman preview tracker (journeymanwebco.com/track.js), which
  // records visits from ?r=<tracking id> links in the CRM. Set to false at launch.
  JWC_TRACKING: true,

  // ---- Towbook online requests (see README.md, "Towbook") ----
  // Ross's Towbook Web Request Form links, sent by the office on Nov 4, 2026. Each request lands in
  // Towbook as a call. The site has no forms of its own: these buttons are the online path, and the
  // phone call stays the main action. An empty link hides its buttons.
  // Never use the Meade Lexus example link from the screenshots: it belongs to a dealer account.
  TOWBOOK_MODE: "link",     // "link" (buttons) | "embed" (tow form in an iframe) | "none" (call only)
  TOWBOOK_URL: "https://public.towbook.com/06f43477310d49bea1319677408aba23c2d13143cb074d88aa04b5d3b6c60113",           // towing
  TOWBOOK_FREIGHT_URL: "https://public.towbook.com/943b85eb7d7649d4addaadafbc7e48613ea9fa291ed24256813e30d2729c054c",   // freight
  TOWBOOK_MACHINERY_URL: "https://public.towbook.com/6a63e21cbfd9409d98557ad58b1b75fc3570fd448d21491b8df3667f5883a410", // machinery
  // Optional QR image for the tow link (a path under public/). Empty uses the QR code generated from
  // TOWBOOK_URL at build time, which always matches the link. Shown beside the tow button on desktop.
  TOWBOOK_QR_IMG: "",

  // ---- Auction date (see README.md, "Auction date") ----
  // Option B only: a Google Sheet published to the web as CSV. Empty uses src/data/auction.json.
  // TODO: https://docs.google.com/spreadsheets/d/e/<id>/pub?gid=0&single=true&output=csv
  AUCTION_SHEET_CSV_URL: "",
};
