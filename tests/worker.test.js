// The freight quote Worker (worker/src/index.js): validation, CORS, spam checks and the email it sends.
// Turnstile and Resend are stubbed, so nothing leaves the machine. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, validateQuote, buildEmail, corsHeaders } from '../worker/src/index.js';

const ORIGIN = 'https://travist6983.github.io';
const ENV = {
  RESEND_API_KEY: 're_test_key',
  TURNSTILE_SECRET: 'ts_test_secret',
  MAIL_FROM: 'Ross Towing Website <quotes@send.journeymanwebco.com>',
  MAIL_TO: 'travisjterry@gmail.com, rosstowing1@gmail.com',
};
const QUOTE = {
  company: 'Acme Excavating', contact: 'Pat Lee', phone: '(313) 555-0100', email: 'pat@acme.example',
  pickup: 'Southfield, MI', delivery: 'Toledo, OH', load: 'Excavator', pieces: '1',
  length: '24', length_unit: 'ft', width: '8.5', width_unit: 'ft', height: '', height_unit: 'ft',
  weight: '42000', weight_unit: 'lbs', weight_estimate: 'yes', equipment: 'Chains, Binders',
  equipment_other: '', trailer: 'Lowboy', notes: 'Gate code <b>1234</b>', website: '',
  'cf-turnstile-response': 'tok',
};

// A fake fetch for Turnstile and Resend that records every call.
function stub({ turnstile = true, resend = 200 } = {}) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('turnstile')) return Response.json({ success: turnstile });
    return resend === 200 ? Response.json({ id: 'email_123' }) : Response.json({ name: 'validation_error', message: 'nope' }, { status: resend });
  };
  fn.calls = calls;
  return fn;
}
const req = (body, { origin = ORIGIN, method = 'POST', path = '/freight', type = 'application/json', ip = '203.0.113.9' } = {}) =>
  new Request('https://ross-towing-forms.example.workers.dev' + path, {
    method,
    headers: { ...(origin ? { Origin: origin } : {}), ...(type ? { 'Content-Type': type } : {}), 'CF-Connecting-IP': ip },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

test('a good quote is sent once to both inboxes, Reply-To the visitor, from the send subdomain', async () => {
  const f = stub();
  const r = await handle(req(QUOTE), ENV, f);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, id: 'email_123' });
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const sends = f.calls.filter((c) => c.url === 'https://api.resend.com/emails');
  assert.equal(sends.length, 1);
  assert.equal(sends[0].init.headers.Authorization, 'Bearer re_test_key');
  const mail = JSON.parse(sends[0].init.body);
  assert.deepEqual(mail.to, ['travisjterry@gmail.com', 'rosstowing1@gmail.com']);
  assert.equal(mail.from, 'Ross Towing Website <quotes@send.journeymanwebco.com>');
  assert.equal(mail.reply_to, 'pat@acme.example');
  assert.equal(mail.subject, 'Freight quote: Southfield, MI to Toledo, OH (Acme Excavating)');
  assert.match(mail.text, /^Dimensions: 24 ft L x 8\.5 ft W \(height not given\)$/m);
  assert.match(mail.html, /<a href="tel:3135550100">\(313\) 555-0100<\/a>/);
  assert.match(mail.html, /<a href="mailto:pat@acme\.example">pat@acme\.example<\/a>/);
  assert.match(mail.html, /Gate code &lt;b&gt;1234&lt;\/b&gt;/);          // visitor text is escaped
  assert.doesNotMatch(mail.html + mail.text + mail.subject, /[\u2013\u2014]/);   // no en or em dashes
  const ts = f.calls.find((c) => c.url.includes('turnstile'));
  assert.equal(ts.init.body.get('secret'), 'ts_test_secret');
  assert.equal(ts.init.body.get('response'), 'tok');
  assert.equal(ts.init.body.get('remoteip'), '203.0.113.9');
});

test('MAIL_TO is a var: one address sends to one inbox', async () => {
  const f = stub();
  await handle(req(QUOTE), { ...ENV, MAIL_TO: 'travisjterry@gmail.com' }, f);
  assert.deepEqual(JSON.parse(f.calls.at(-1).init.body).to, ['travisjterry@gmail.com']);
});

test('missing required fields: 400 with field names only, nothing sent', async () => {
  const f = stub();
  const r = await handle(req({ ...QUOTE, contact: '', pickup: '  ', load: undefined }), ENV, f);
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.ok, false);
  assert.deepEqual(j.fields.sort(), ['contact', 'load', 'pickup']);
  assert.equal(f.calls.length, 0);
});

test('bad email and short phone are refused', () => {
  for (const email of ['pat', 'pat@', 'pat@acme', 'a b@c.example', 'pat@acme.example>, x@y.example']) {
    assert.deepEqual(validateQuote({ ...QUOTE, email }).fields, ['email'], email);
  }
  assert.deepEqual(validateQuote({ ...QUOTE, phone: '555-0100' }).fields, ['phone']);
  assert.equal(validateQuote(QUOTE).ok, true);
});

test('oversized fields, odd units, bad dates and objects are refused', async () => {
  assert.deepEqual(validateQuote({ ...QUOTE, notes: 'x'.repeat(2001) }).fields, ['notes']);
  assert.equal(validateQuote({ ...QUOTE, load: 'x'.repeat(2000) }).ok, true);
  assert.deepEqual(validateQuote({ ...QUOTE, company: 'x'.repeat(201) }).fields, ['company']);
  assert.deepEqual(validateQuote({ ...QUOTE, weight_unit: 'kg' }).fields, ['weight_unit']);
  assert.deepEqual(validateQuote({ ...QUOTE, ready_date: 'tomorrow' }).fields, ['ready_date']);
  assert.deepEqual(validateQuote({ ...QUOTE, contact: { a: 1 } }).fields, ['contact']);
  assert.equal(validateQuote([]).ok, false);
  // unknown fields are dropped, not sent
  assert.equal('cc' in validateQuote({ ...QUOTE, cc: 'x@y.example' }).data, false);
  // whole body over 20 KB
  const f = stub();
  const r = await handle(req({ ...QUOTE, junk: 'x'.repeat(21000) }), ENV, f);
  assert.equal(r.status, 413);
  assert.equal(f.calls.length, 0);
});

test('honeypot filled: says ok, checks nothing, sends nothing', async () => {
  const f = stub();
  const r = await handle(req({ ...QUOTE, website: 'http://spam.example' }), ENV, f);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(f.calls.length, 0);
});

test('wrong origin: 403, no CORS header, nothing sent; preflight only for allowed origins', async () => {
  const f = stub();
  for (const origin of ['https://evil.example', 'https://travist6983.github.io.evil.example', null]) {
    const r = await handle(req(QUOTE, { origin }), ENV, f);
    assert.equal(r.status, 403, String(origin));
    assert.equal(r.headers.get('Access-Control-Allow-Origin'), null);
  }
  assert.equal(f.calls.length, 0);
  const ok = await handle(req(null, { method: 'OPTIONS', type: null }), ENV, f);
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
  const no = await handle(req(null, { method: 'OPTIONS', type: null, origin: 'https://evil.example' }), ENV, f);
  assert.equal(no.status, 403);
  for (const o of ['https://rosstow.com', 'https://www.rosstow.com', 'http://localhost:5173']) assert.ok(corsHeaders(o, ENV), o);
  assert.equal(corsHeaders('https://rosstow.com', { ALLOWED_ORIGINS: 'https://travist6983.github.io' }), null);
});

test('Turnstile: missing or failed token is refused, nothing sent', async () => {
  const f = stub({ turnstile: false });
  assert.equal((await handle(req(QUOTE), ENV, f)).status, 403);
  const g = stub();
  const r = await handle(req({ ...QUOTE, 'cf-turnstile-response': '' }), ENV, g);
  assert.equal(r.status, 403);
  assert.equal((await r.json()).error, 'turnstile');
  assert.equal(g.calls.filter((c) => c.url.includes('resend')).length, 0);
});

test('rate limit: 429 when the limiter says no', async () => {
  const f = stub();
  const keys = [];
  const env = { ...ENV, RATE_LIMITER: { limit: async ({ key }) => { keys.push(key); return { success: false }; } } };
  const r = await handle(req(QUOTE), env, f);
  assert.equal(r.status, 429);
  assert.deepEqual(keys, ['203.0.113.9']);
  assert.equal(f.calls.length, 0);
});

test('Resend failure: 502, and the error never echoes the key or the visitor', async () => {
  const f = stub({ resend: 422 });
  const r = await handle(req(QUOTE), ENV, f);
  assert.equal(r.status, 502);
  const body = await r.text();
  assert.deepEqual(JSON.parse(body), { ok: false, error: 'send_failed' });
  assert.doesNotMatch(body, /re_test_key|pat@acme|Pat Lee/);
});

test('not configured, wrong method, wrong path, wrong content type, bad JSON', async () => {
  const f = stub();
  assert.equal((await handle(req(QUOTE), { ...ENV, RESEND_API_KEY: '' }, f)).status, 500);
  assert.equal((await handle(req(QUOTE), { ...ENV, TURNSTILE_SECRET: undefined }, f)).status, 500);
  assert.equal((await handle(req(null, { method: 'GET', type: null }), ENV, f)).status, 405);
  assert.equal((await handle(req(QUOTE, { path: '/' }), ENV, f)).status, 404);
  assert.equal((await handle(req('a=b', { type: 'application/x-www-form-urlencoded' }), ENV, f)).status, 415);
  assert.equal((await handle(req('{nope'), ENV, f)).status, 400);
  assert.equal(f.calls.length, 0);
});

test('buildEmail: plain text has every line, HTML has a row per line', () => {
  const v = validateQuote(QUOTE);
  const { html, text } = buildEmail(v.data);
  const lines = text.trim().split('\n').slice(2);
  assert.equal((html.match(/<tr>/g) || []).length, lines.length);
  assert.match(text, /^Equipment: Chains, Binders$/m);
  assert.match(text, /^Weight: 42,000 lbs \(estimate\)$/m);
});
