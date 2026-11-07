// Run: npm test
// Jennifer's Nov 5, 2026 additions: the PPI section, its authorization form, the job application,
// the Kentucky license and the machinery rigging card.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const page = read('index.html');
const footer = read('src/partials/footer.html');
const header = read('src/partials/header.html');

test('forms: every linked PDF exists in public/forms and is a real PDF', () => {
  const links = [...(page + footer).matchAll(/href="\{\{BASE\}\}(forms\/[^"]+\.pdf)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(links)].sort(), ['forms/ross-towing-driver-employment-application.pdf', 'forms/ross-towing-ppi-authorization-form.pdf']);
  for (const f of new Set(links)) {
    const buf = fs.readFileSync(new URL(`../public/${f}`, import.meta.url));
    assert.equal(buf.subarray(0, 5).toString(), '%PDF-', f);
  }
});

test('PPI: section, her sentence word for word, the statute link and the email to send the form to', () => {
  assert.match(page, /<section id="ppi"/);
  assert.ok(page.includes('an abandoned vehicle is any motor vehicle left on public or private property without the consent of the owner.'));
  assert.ok(page.includes('href="https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-257-252a"'));
  assert.ok(page.includes('href="mailto:rosstowing1@gmail.com"'));
  assert.ok(header.includes('href="{{HOME}}#ppi"'));
});

test('freight credentials include the Kentucky license; heavy duty lists rigging; 79 is no longer the first photo', () => {
  assert.match(page, /<dt>KY License<\/dt><dd>673351<\/dd>/);
  assert.ok(footer.includes('KY License #673351'));
  assert.ok(page.includes('Machine hauling, off loading, staging and rigging.'));
  assert.ok(!page.includes('/img/wrecker-79'));
  const firstImg = page.match(/<img src="([^"]+)"/)[1];
  assert.equal(firstImg, '/img/flatbeds-two-cars-1024.jpg');
});

test('header shows the company name beside the logo (Jenn, Nov 6)', () => {
  assert.match(header, /<span class="brand-name"[^>]*><span class="bn-1">Ross<\/span> <span class="bn-2">Towing<\/span><\/span><\/a>/);
  assert.ok(header.includes('aria-label="Ross Towing, back to top"'));
});

test('photos from Jenn, Nov 6: new freight main photo, fire truck haul in heavy duty, every image file exists', () => {
  const freight = page.slice(page.indexOf('id="freight"'));
  assert.equal(freight.match(/<img src="([^"]+)"/)[1], '/img/freight-main-1024.jpg');
  const heavy = page.slice(page.indexOf('id="heavy"'), page.indexOf('id="spill"'));
  const heavyImgs = [...heavy.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(heavyImgs.at(-1), '/img/fire-truck-haul-1024.jpg');
  for (const m of page.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(' ')[0];
      if (url.startsWith('/img/')) assert.ok(fs.existsSync(new URL(`../public${url}`, import.meta.url)), url);
    }
  }
});

test('gallery: every photo has its own alt text and its files exist', () => {
  const gallery = JSON.parse(read('src/data/gallery.json'));
  for (const p of gallery) {
    assert.equal(p.altIsDefault, false, p.key);
    for (const f of p.files) assert.ok(fs.existsSync(new URL(`../public/${f}`, import.meta.url)), f);
  }
  assert.ok(gallery.some((p) => p.key === 'towing/fire-truck-tow.jpg'));
});

test('no concept preview banner or wording left (Travis, Nov 6)', () => {
  for (const [name, text] of [['header', header], ['footer', footer], ['index', page]]) {
    assert.ok(!/concept preview|Not the official site|IN BRACKETS/i.test(text), name);
  }
});
