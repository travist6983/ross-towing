// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BUSINESS, SERVICES, address, businessSchema, jsonLd, robotsTxt, llmsTxt } from '../scripts/seo.mjs';
import { CITIES, cityPath, citySchema, renderCity } from '../scripts/cities.mjs';

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
  const chips = [...visible(home).matchAll(/<use href="#i-pin"\/><\/svg>([^<]+)<\/a><\/li>/g)].map((m) => m[1]);
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

test('cities: one page for each city on the home page, linked from the home page chips', () => {
  assert.deepEqual(CITIES.map((c) => c.name).sort(), [...BUSINESS.cities].sort());
  for (const c of CITIES) {
    assert.ok(fs.existsSync(new URL(`../${cityPath(c)}index.html`, import.meta.url)), c.slug);
    assert.ok(home.includes(`<a href="{{BASE}}${cityPath(c)}">`), `home links ${c.slug}`);
  }
});

test('cities: titles, descriptions and intros are each unique, with no dashes and the one phone number', () => {
  for (const key of ['description', 'where']) assert.equal(new Set(CITIES.map((c) => c[key])).size, CITIES.length, key);
  for (const c of CITIES) {
    const html = renderCity(c.slug);
    assert.ok(!/[\u2013\u2014]/.test(html + c.description), c.slug);
    assert.ok(c.description.length <= 170, `${c.slug} description is ${c.description.length} chars`);
    assert.ok(c.description.includes(c.name) && c.description.includes(BUSINESS.phone));
    assert.ok(!/\b\d{3}[-. ]\d{3}[-. ]\d{4}\b/.test(html.replaceAll(BUSINESS.phone, '')), `${c.slug} shows another phone number`);
    assert.ok(html.includes(address()), `${c.slug} shows the address`);
    assert.ok(html.includes(`Towing in ${c.name}, MI`));
  }
});

test('cities: schema adds the city service and a breadcrumb to the one business graph', () => {
  const g = businessSchema(URL_, { extra: citySchema(URL_, 'royal-oak') })['@graph'];
  const svc = g.find((n) => n['@type'] === 'Service');
  assert.equal(svc.provider['@id'], g[0]['@id']);
  assert.deepEqual(svc.areaServed, { '@type': 'City', name: 'Royal Oak, MI' });
  const crumbs = g.find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
  assert.equal(crumbs.at(-1).item, 'https://rosstow.com/towing/royal-oak/');
});

test('cities: llms.txt lists the city pages it is given', () => {
  const t = llmsTxt(URL_, CITIES.map((c) => ({ name: c.name, path: cityPath(c) })));
  for (const c of CITIES) assert.ok(t.includes(`https://rosstow.com/towing/${c.slug}/`), c.slug);
});
