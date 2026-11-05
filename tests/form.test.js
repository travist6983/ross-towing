// The freight quote form markup in index.html: where it sits, its required fields, labels and honeypot.
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FIELDS } from '../worker/src/index.js';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const section = html.slice(html.indexOf('id="freight"'), html.indexOf('</section>', html.indexOf('id="freight"')));
const form = section.slice(section.indexOf('<form'), section.indexOf('</form>') + 7);
const tags = (name) => [...form.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => m[0]);
const attr = (tag, a) => { const m = new RegExp(`\\s${a}="([^"]*)"`).exec(tag); return m ? m[1] : null; };
const controls = [...tags('input'), ...tags('select'), ...tags('textarea')];

test('the form sits in the freight section, after the Towbook buttons', () => {
  assert.ok(form.startsWith('<form class="form fq" id="freight-quote"'));
  assert.ok(section.indexOf('<!-- @section online freight -->') < section.indexOf('<form'));
  assert.equal((html.match(/id="freight-quote"/g) || []).length, 1);
  assert.match(form, /<button class="btn btn-call" type="submit">/);
  assert.match(form, /<div class="form-status" role="status" aria-live="polite" hidden><\/div>/);
  assert.match(form, /novalidate/);
});

test('every required field is there and marked required', () => {
  const required = Object.entries(FIELDS).filter(([, r]) => r.required).map(([k]) => k).sort();
  const marked = controls.filter((t) => / required(\s|>|$)/.test(t)).map((t) => attr(t, 'name')).sort();
  assert.deepEqual(marked, required);
  assert.deepEqual(required, ['contact', 'delivery', 'email', 'load', 'phone', 'pickup']);
  assert.equal(attr(controls.find((t) => attr(t, 'name') === 'email'), 'type'), 'email');
  assert.equal(attr(controls.find((t) => attr(t, 'name') === 'phone'), 'type'), 'tel');
});

test('every field the form sends is one the Worker accepts, and caps match', () => {
  const names = new Set(controls.map((t) => attr(t, 'name')).filter(Boolean));
  names.delete('website');
  for (const n of names) assert.ok(FIELDS[n], `Worker drops "${n}"`);
  for (const t of controls) {
    const n = attr(t, 'name'), max = attr(t, 'maxlength');
    if (max) assert.ok(Number(max) <= FIELDS[n].max, `${n} maxlength ${max} > Worker cap ${FIELDS[n].max}`);
  }
});

test('labels are tied to their inputs; unit selects and checkboxes are labeled', () => {
  const labelFor = new Set([...form.matchAll(/<label for="([^"]+)"/g)].map((m) => m[1]));
  for (const t of controls) {
    const id = attr(t, 'id'), type = attr(t, 'type');
    if (type === 'checkbox') continue;                          // wrapped in their <label class="check">
    if (t.startsWith('<select') && attr(t, 'aria-label')) continue;  // unit pickers
    assert.ok(id && labelFor.has(id), `no label for ${attr(t, 'name')}`);
  }
  assert.equal((form.match(/<label class="check(?: check-solo)?"><input type="checkbox"/g) || []).length, tags('input').filter((t) => attr(t, 'type') === 'checkbox').length);
  for (const id of labelFor) assert.ok(controls.some((t) => attr(t, 'id') === id), `label for missing #${id}`);
});

test('the honeypot is hidden from people and screen readers, and out of the tab order', () => {
  assert.match(form, /<div class="hp" aria-hidden="true"><label for="fq-website">Leave this empty<\/label><input id="fq-website" name="website" tabindex="-1" autocomplete="off"><\/div>/);
  const css = fs.readFileSync(new URL('../src/partials/site.css', import.meta.url), 'utf8');
  assert.match(css, /\.hp \{ position: absolute; left: -9999px;/);
});

test('no en or em dashes in the form', () => {
  assert.doesNotMatch(form, /[\u2013\u2014]/);
});
