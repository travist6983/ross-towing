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

  // ---- Forms ----
  // A form service endpoint (Formspree, Basin, Web3Forms or similar). Empty means nothing is sent:
  // the form shows "please call 248-356-6011 or email us" and keeps what the visitor typed.
  // TODO: set once Jennifer confirms who receives freight quotes.
  FORM_ENDPOINT_FREIGHT: "",

  // Tow request form, used in TOWBOOK_MODE "none". Same pattern as freight.
  // TODO: set once Jennifer confirms who receives tow requests.
  FORM_ENDPOINT_TOW: "",

  // How the forms post: "json" (Formspree, Basin and Web3Forms all take it) or "form" (urlencoded).
  FORM_ENCODING: "json",

  // Fields some services want in every post. Web3Forms example: { access_key: "your-public-key" }.
  FORM_EXTRA_FIELDS: {},

  // TODO: the office email address for quotes and tow requests. Used for the "email us" link in the
  // fallback message. Empty shows an [OFFICE EMAIL] placeholder. The address that actually receives
  // form posts is set in the form service's dashboard, not here.
  CONTACT_EMAIL: "",

  // ---- Towbook (see README.md, "Towbook") ----
  // Never use the Meade Lexus example link from Jennifer's screenshots: it belongs to a dealer
  // account and would file website requests under that dealer.
  TOWBOOK_MODE: "none",     // "none" | "link" | "embed"
  TOWBOOK_URL: "",          // TODO: Ross's website tow request link, once Towbook sets it up
  TOWBOOK_FREIGHT_URL: "",  // TODO: Towbook is building Ross a custom freight link; paste it here.
  // Optional QR image for the tow link (a path under public/, e.g. "img/towbook-qr.png"). Leave
  // empty to use the QR code generated from TOWBOOK_URL at build time, which always matches the link.
  TOWBOOK_QR_IMG: "",

  // ---- Auction date (see README.md, "Auction date") ----
  // Option B only: a Google Sheet published to the web as CSV. Empty uses src/data/auction.json.
  // TODO: https://docs.google.com/spreadsheets/d/e/<id>/pub?gid=0&single=true&output=csv
  AUCTION_SHEET_CSV_URL: "",
};
