// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BUSINESS, SERVICES, address, businessSchema, jsonLd, robotsTxt, llmsTxt } from '../scripts/seo.mjs';

const URL_ = 'https://rosstow.com/';
const home = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const footer = fs.readFileSync(new URL('../src/partials/footer.html', import.meta.url), 'utf8');
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>|<!--[\s\S]*?-->/g, ' ');

test('seo: name, address and phone in the schema match the footer exactly', () => {
  const b = businessSchema(URL_)['@graph'][0];
  assert.equal(b.name, 'Ross Towing');
  assert.equal(b.telephone, '+1-248-356-6011');
  assert.deepEqual(b.address, { '@type': 'PostalAddress', streetAddress: '21360 Telegraph Rd', addressLocality: 'Southfield', addressRegion: 'MI', postalCode: '48033', addressCountry: 'US' });
  assert.ok(footer.includes(address()), 'footer shows the same address line');
  assert.ok(footer.includes(`${BUSINESS.legalName} dba ${BUSINESS.name}`));
  assert.ok(footer.includes(BUSINESS.phone));
});

test('seo: service area is exactly the cities the home page lists, plus Michigan', () => {
  const chips = [...visible(home).matchAll(/<use href="#i-pin"\/><\/svg>([^<]+)<\/li>/g)].map((m) => m[1]);
  assert.deepEqual(chips, BUSINESS.cities);
  const areas = businessSchema(URL_)['@graph'][0].areaServed.map((a) => a.name);
  assert.deepEqual(areas, [...BUSINESS.cities.map((c) => `${c}, MI`), 'Michigan']);
});

test('seo: every service group points at a section that exists on the home page', () => {
  for (const s of SERVICES) assert.match(home, new RegExp(`id="${s.anchor}"`), s.anchor);
});

test('seo: reviews only when asked for; the business has one id shared by its services', () => {
  const plain = businessSchema(URL_)['@graph'][0];
  assert.equal(plain.review, undefined);
  const withReviews = businessSchema(URL_, { reviews: [{ '@type': 'Review' }] })['@graph'][0];
  assert.equal(withReviews.review.length, 1);
  for (const o of plain.hasOfferCatalog.itemListElement) assert.equal(o.itemOffered.provider['@id'], plain['@id']);
});

test('seo: JSON-LD script cannot be closed early by its content', () => {
  assert.ok(!jsonLd({ a: '</script><b>' }).slice(0, -10).includes('</script>'));
});

test('seo: robots.txt allows everything and names the sitemap', () => {
  assert.equal(robotsTxt(URL_), '# rosstow.com\nUser-agent: *\nAllow: /\n\nSitemap: https://rosstow.com/sitemap.xml\n');
});

test('seo: llms.txt has the contact facts and no en or em dashes', () => {
  const t = llmsTxt(URL_);
  assert.match(t, /^# Ross Towing\n/);
  for (const s of [BUSINESS.phone, address(), BUSINESS.email, 'https://rosstow.com/gallery/']) assert.ok(t.includes(s), s);
  assert.ok(!/[–—]/.test(t));
});
