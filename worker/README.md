# Ross Towing forms Worker

A Cloudflare Worker that takes the freight quote form on the Ross Towing site and emails it to the office.
It is not part of the Vite build or the Pages deploy.

`POST /freight` (JSON from `#freight-quote`):

1. Allows only the origins in `ALLOWED_ORIGINS` (the Pages preview, rosstow.com, www.rosstow.com, localhost:5173). Answers the `OPTIONS` preflight.
2. Hidden "website" field filled in: answers `{ ok: true }` and sends nothing.
3. Rate limit per IP: 3 a minute (`RATE_LIMITER` binding in `wrangler.toml`).
4. Validates every field (required fields, email shape, a phone with at least 10 digits, a length cap on each field, 20 KB body cap). Unknown fields are dropped.
5. Checks the Cloudflare Turnstile token with `TURNSTILE_SECRET`.
6. Sends one email through Resend: from `MAIL_FROM`, to every address in `MAIL_TO`, Reply-To the visitor, so the office can just hit Reply. HTML table plus a plain text copy, both built from `src/messages.js` (the same lines the page shows).

Answers `{ ok: true }` or `{ ok: false, error }` with 400, 403, 405, 413, 415, 429, 500 or 502. Errors never echo the API key or what the visitor typed.

## Settings

| Name | Kind | Where |
|---|---|---|
| `MAIL_FROM` | var | `wrangler.toml`: `Ross Towing Website <quotes@send.journeymanwebco.com>` |
| `MAIL_TO` | var | `wrangler.toml`, comma separated. Drop travisjterry@gmail.com at launch. |
| `ALLOWED_ORIGINS` | var | `wrangler.toml` |
| `RESEND_API_KEY` | secret | `npx wrangler secret put RESEND_API_KEY` (a Resend key with sending access to send.journeymanwebco.com) |
| `TURNSTILE_SECRET` | secret | `npx wrangler secret put TURNSTILE_SECRET` (from the Turnstile widget) |

Secrets never go in git, chat or `wrangler.toml`.

On the site, `src/config.js` holds `FORM_ENDPOINT_FREIGHT` (this Worker's URL plus `/freight`) and `TURNSTILE_SITE_KEY` (public). With the endpoint empty the form shows "please call 248-356-6011" and sends nothing.

## First deploy

```sh
cd worker
npm install
npx wrangler login
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET
npx wrangler deploy
```

`wrangler deploy` prints the URL, like `https://ross-towing-forms.<subdomain>.workers.dev`. Put that plus `/freight` in `FORM_ENDPOINT_FREIGHT`.

To send a test only to one inbox first: `npx wrangler deploy --var MAIL_TO:travisjterry@gmail.com`, submit the form, then run plain `npx wrangler deploy` to go back to both addresses.

Turnstile widget (Cloudflare dashboard, Turnstile, Add widget): hostnames `travist6983.github.io`, `rosstow.com`, `www.rosstow.com`; mode Managed. The site key goes in `src/config.js`, the secret key in `wrangler secret put TURNSTILE_SECRET`.

## Local run

```sh
cp .dev.vars.example .dev.vars   # Cloudflare's always-pass Turnstile test secret, MAIL_TO set to one inbox
npx wrangler dev                 # http://localhost:8787/freight
```

With a placeholder Resend key everything but the send works (the Worker answers `send_failed`). `RESEND_API_URL` and `TURNSTILE_VERIFY_URL` in `.dev.vars` can point at a mock on localhost; any other host is ignored.

Tests live in `tests/worker.test.js` at the repo root (`npm test`), with Turnstile and Resend stubbed.
