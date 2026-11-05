// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { partnerItems, renderPartners, renderReviews, featuredReviews, reviewSchema, renderOnline, renderTowQr, towbookLinks } from '../scripts/sections.mjs';
import { CONFIG } from '../src/config.js';

const reviews = JSON.parse(fs.readFileSync(new URL('../src/data/reviews.json', import.meta.url)));
const partners = JSON.parse(fs.readFileSync(new URL('../src/data/partners.json', import.meta.url)));

// The three quotes exactly as they were approved (the brief, from Jennifer's email)
const APPROVED = {
  'Aubrey D.': "After my first accident I had no clue what to do. Cort towed my car promptly and let me ride with him back to the shop. He offered a great explanation of the next steps and assured he's seen cars with worse damage be repaired. His kindness, generosity, and patience really helped me get through a stressful situation.",
  'Kathy D.': 'Very helpful, friendly, and polite when we had to have our car towed after it was in an accident. Jake was especially helpful when we stopped by to get our stuff out of the car the next day- even the insurance agent handling the claim noted how friendly he was on the phone to her.',
  'Jill S.': 'I spoke with someone on the phone and they explained everything I needed to know very clearly and they were quick when I went in to pick my car up. Made a stressful situation a little more bearable.',
};

test('reviews: one section with the three featured quotes, word for word, in order', () => {
  const f = featuredReviews(reviews);
  assert.deepEqual(f.map((r) => r.author), ['Aubrey D.', 'Kathy D.', 'Jill S.']);
  const html = renderReviews(reviews);
  const texts = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/&#39;/g, "'"));
  assert.deepEqual(texts, f.map((r) => APPROVED[r.author]));
  for (const r of f) assert.ok(html.includes(`${r.author}, Google review`));
  assert.ok(html.includes('the next day- even'));
  assert.doesNotMatch(html, /reveal|star|ago|rating/i);   // no reveal animation: visible with JS off or reduced motion
  assert.equal(reviewSchema(reviews).length, 3);
  assert.equal(reviews.reviews.filter((r) => !r.featured).length, 4);
});

test('partners: names only without permission, logos only with permission AND a file', () => {
  const agencies = [{ name: 'Farmington Hills Police Department', logo: 'logos/fhpd.svg', permission: false }, { name: 'Michigan State Police', logo: 'logos/msp.svg', permission: true }];
  assert.deepEqual(partnerItems(agencies, { group: 'agencies', logoExists: () => false }).map((i) => i.kind), ['name', 'name']);
  assert.deepEqual(partnerItems(agencies, { group: 'agencies', logoExists: () => true }).map((i) => i.kind), ['name', 'logo']);
  const html = renderPartners(agencies, { group: 'agencies', logoExists: (f) => f === 'logos/msp.svg' });
  assert.match(html, /<img src="\/logos\/msp\.svg" alt="Michigan State Police"/);
  assert.match(html, /<span>Farmington Hills Police Department<\/span>/);
});

test('partners: dealers show nothing without permission; placeholders only in dev', () => {
  assert.equal(renderPartners(partners.dealers, { group: 'dealers', dev: false }), '');
  assert.match(renderPartners(partners.dealers, { group: 'dealers', dev: true }), /\[DEALER NAME 1\]/);
  const d = [{ name: 'Some Dealer', logo: 'logos/d.png', permission: false }, { name: 'OK Dealer', logo: '', permission: true, url: 'https://ok.example' }];
  assert.deepEqual(partnerItems(d, { group: 'dealers' }).map((i) => [i.kind, i.name]), [['name', 'OK Dealer']]);
  // the shipped partners.json: agencies as names, no logos, no dealers
  assert.equal((renderPartners(partners.agencies, { group: 'agencies', logoExists: () => true }).match(/<img/g) || []).length, 0);
  assert.ok(partners.agencies.every((a) => a.permission === false));
});

test('Towbook: three request links, call stays first, empty links hide their buttons', () => {
  const L = towbookLinks(CONFIG);
  for (const k of ['tow', 'freight', 'machinery']) assert.match(L[k], /^https:\/\/public\.towbook\.com\/[0-9a-f]{64}$/);
  const hero = renderOnline(CONFIG, 'hero');
  assert.equal((hero.match(/target="_blank" rel="noopener"/g) || []).length, 3);
  assert.match(renderOnline(CONFIG, 'freight'), /Request a freight quote/);
  const qr = { freight: '<svg data-x="f"></svg>', machinery: '<svg data-x="m"></svg>' };
  assert.match(renderOnline(CONFIG, 'freight', qr), /has-qr[\s\S]*<svg data-x="f"><\/svg><figcaption>Scan to request a freight quote<\/figcaption>/);
  assert.match(renderOnline(CONFIG, 'machinery', qr), /<svg data-x="m"><\/svg><figcaption>Scan to request machinery hauling<\/figcaption>/);
  assert.doesNotMatch(renderOnline(CONFIG, 'freight'), /qr-fig/);
  assert.match(renderOnline(CONFIG, 'machinery'), /Request machinery hauling/);
  assert.match(renderOnline(CONFIG, 'contact'), /Not urgent\? Request a tow online/);
  const none = { ...CONFIG, TOWBOOK_URL: '', TOWBOOK_FREIGHT_URL: '', TOWBOOK_MACHINERY_URL: '' };
  assert.equal(renderOnline(none, 'hero'), '');
  assert.equal(renderOnline(none, 'machinery'), '');
  assert.match(renderOnline(none, 'freight'), /tel:\+12483566011/);   // falls back to a call button
  assert.match(renderOnline({ ...CONFIG, TOWBOOK_URL: 'http://not-https.example' }, 'tow'), /^$/);
  assert.match(renderOnline({ ...CONFIG, TOWBOOK_MODE: 'embed' }, 'contact'), /<iframe src="https:\/\/public\.towbook\.com\/[0-9a-f]+" title="Online tow request form, hosted by Towbook" loading="lazy"/);
});

test('Towbook QR: only in link or embed mode with a tow link', async () => {
  const svg = async () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  assert.match(await renderTowQr(CONFIG, svg), /Scan to request a tow/);
  assert.equal(await renderTowQr({ ...CONFIG, TOWBOOK_MODE: 'none' }, svg), '');
  assert.equal(await renderTowQr({ ...CONFIG, TOWBOOK_URL: '' }, svg), '');
  assert.match(await renderTowQr({ ...CONFIG, TOWBOOK_QR_IMG: 'img/towbook-qr.png' }, svg), /<img src="\/img\/towbook-qr\.png"/);
});
