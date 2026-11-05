// Ross Towing forms Worker. POST /freight takes the website's freight quote form as JSON, checks it,
// checks the Cloudflare Turnstile token, rate limits per IP, and emails the office through Resend.
// Recipients and sender are Worker vars (wrangler.toml), the API key and Turnstile secret are Worker
// secrets. See worker/README.md.
import { freightRows, formatFreightQuote, freightSubject } from '../../src/messages.js';

const MAX_BODY = 20_000;
const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_URL = 'https://api.resend.com/emails';
const DEFAULT_ORIGINS = ['https://travist6983.github.io', 'https://rosstow.com', 'https://www.rosstow.com', 'http://localhost:5173'];

// Every field the form sends, with its cap. Anything else in the body is dropped.
export const FIELDS = {
  company: { max: 200 },
  contact: { max: 200, required: true },
  phone: { max: 40, required: true },
  email: { max: 254, required: true },
  pickup: { max: 200, required: true },
  delivery: { max: 200, required: true },
  ready_date: { max: 10, date: true },
  deliver_by: { max: 10, date: true },
  load: { max: 2000, required: true },
  pieces: { max: 12 },
  length: { max: 20 }, length_unit: { max: 4, oneOf: ['ft', 'in'] },
  width: { max: 20 }, width_unit: { max: 4, oneOf: ['ft', 'in'] },
  height: { max: 20 }, height_unit: { max: 4, oneOf: ['ft', 'in'] },
  weight: { max: 20 }, weight_unit: { max: 4, oneOf: ['lbs', 'tons'] },
  weight_estimate: { max: 5 },
  equipment: { max: 500 },
  equipment_other: { max: 120 },
  trailer: { max: 40 },
  notes: { max: 2000 },
};
const HONEYPOT = 'website';
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// -> { ok: true, data } or { ok: false, fields: [names] }. Field names only, never values.
export function validateQuote(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, fields: ['body'] };
  const data = {}, bad = [];
  for (const [name, rule] of Object.entries(FIELDS)) {
    let v = body[name];
    if (Array.isArray(v)) v = v.map((x) => String(x ?? '')).join(', ');
    v = v == null ? '' : typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v).trim() : null;
    if (v === null || v.length > rule.max) { bad.push(name); continue; }
    if (rule.required && !v) { bad.push(name); continue; }
    if (v && rule.oneOf && !rule.oneOf.includes(v)) { bad.push(name); continue; }
    if (v && rule.date && !DATE_RE.test(v)) { bad.push(name); continue; }
    data[name] = v;
  }
  if (data.email && !EMAIL_RE.test(data.email)) bad.push('email');
  if (data.phone && data.phone.replace(/\D/g, '').length < 10) bad.push('phone');
  return bad.length ? { ok: false, fields: [...new Set(bad)] } : { ok: true, data };
}

export const isSpam = (body) => !!(body && typeof body === 'object' && String(body[HONEYPOT] ?? '').trim());

const list = (v, fallback = []) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : fallback);
export const allowedOrigins = (env) => list(env.ALLOWED_ORIGINS, DEFAULT_ORIGINS);

export function corsHeaders(origin, env) {
  if (!origin || !allowedOrigins(env).includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// The office email: subject, a two column HTML table and the same lines as plain text.
export function buildEmail(d) {
  const digits = d.phone.replace(/[^\d+]/g, '');
  const cell = (label, value) => {
    if (label === 'Phone') return `<a href="tel:${esc(digits)}">${esc(value)}</a>`;
    if (label === 'Email') return `<a href="mailto:${esc(value)}">${esc(value)}</a>`;
    return esc(value).replace(/\n/g, '<br>');
  };
  const rows = freightRows(d).map(([k, v]) =>
    `<tr><th align="left" valign="top" style="padding:8px 14px 8px 0;border-bottom:1px solid #E3E6E8;font-weight:600;color:#4F575E;white-space:nowrap">${esc(k)}</th>`
    + `<td valign="top" style="padding:8px 0;border-bottom:1px solid #E3E6E8;color:#15171A">${cell(k, v)}</td></tr>`).join('');
  const html = '<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.45;color:#15171A">'
    + '<p style="margin:0 0 6px;font-size:18px;font-weight:700">New freight quote request</p>'
    + '<p style="margin:0 0 16px;color:#4F575E">Sent from the Ross Towing website. Reply to this email to answer the customer.</p>'
    + `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px">${rows}</table>`
    + '</body></html>';
  const text = `New freight quote request from the Ross Towing website. Reply to this email to answer the customer.\n\n${formatFreightQuote(d)}\n`;
  return { subject: freightSubject(d).replace(/[\r\n]+/g, ' '), html, text };
}

async function verifyTurnstile(token, ip, env, fetchImpl) {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const r = await fetchImpl(localOverride(env.TURNSTILE_VERIFY_URL, TURNSTILE_VERIFY), { method: 'POST', body: form });
    const j = await r.json();
    return j.success === true;
  } catch (e) {
    console.error('turnstile verify failed', e && e.message);
    return false;
  }
}

async function sendEmail(d, env, fetchImpl) {
  const { subject, html, text } = buildEmail(d);
  const r = await fetchImpl(localOverride(env.RESEND_API_URL, RESEND_URL), {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to: list(env.MAIL_TO), reply_to: d.email, subject, html, text }),
  });
  if (!r.ok) {
    let name = '';
    try { name = (await r.json()).name || ''; } catch { /* no body */ }
    throw new Error(`resend ${r.status} ${name}`.trim());
  }
  return r.json().catch(() => ({}));
}

// Local testing only: RESEND_API_URL and TURNSTILE_VERIFY_URL can point at a mock on this machine
// (worker/.dev.vars). Anything that isn't localhost is ignored, so a stray var can't redirect real mail.
export function localOverride(v, fallback) {
  try { const u = new URL(String(v || '')); return ['127.0.0.1', 'localhost'].includes(u.hostname) ? u.href : fallback; } catch { return fallback; }
}

const json = (status, obj, headers = {}) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...headers } });

export async function handle(request, env, fetchImpl = fetch) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const cors = corsHeaders(origin, env);

  if (url.pathname !== '/freight') return json(404, { ok: false, error: 'not_found' }, cors || {});
  if (request.method === 'OPTIONS') return cors ? new Response(null, { status: 204, headers: cors }) : json(403, { ok: false, error: 'origin' });
  if (request.method !== 'POST') return json(405, { ok: false, error: 'method' }, { Allow: 'POST, OPTIONS', ...(cors || {}) });
  if (!cors) return json(403, { ok: false, error: 'origin' });
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return json(415, { ok: false, error: 'content_type' }, cors);

  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET || !env.MAIL_FROM || !list(env.MAIL_TO).length) {
    console.error('worker misconfigured: missing', ['RESEND_API_KEY', 'TURNSTILE_SECRET', 'MAIL_FROM', 'MAIL_TO'].filter((k) => !env[k]).join(', '));
    return json(500, { ok: false, error: 'not_configured' }, cors);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: 'too_large' }, cors);
  let body;
  try { body = JSON.parse(raw); } catch { return json(400, { ok: false, error: 'bad_json' }, cors); }

  if (isSpam(body)) return json(200, { ok: true }, cors);   // a bot filled the hidden field: say yes, send nothing

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (env.RATE_LIMITER) {
    const { success } = await env.RATE_LIMITER.limit({ key: ip || 'unknown' });
    if (!success) return json(429, { ok: false, error: 'rate_limited' }, cors);
  }

  const v = validateQuote(body);
  if (!v.ok) return json(400, { ok: false, error: 'invalid', fields: v.fields }, cors);

  if (!(await verifyTurnstile(body['cf-turnstile-response'], ip, env, fetchImpl))) return json(403, { ok: false, error: 'turnstile' }, cors);

  try {
    const sent = await sendEmail(v.data, env, fetchImpl);
    return json(200, { ok: true, id: sent && sent.id ? String(sent.id) : undefined }, cors);
  } catch (e) {
    console.error('send failed', e && e.message);
    return json(502, { ok: false, error: 'send_failed' }, cors);
  }
}

export default { fetch: (request, env) => handle(request, env) };
