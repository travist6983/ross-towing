// Runs after every build (npm run build). Fails the build if something that must never ship is in dist/:
// image metadata (EXIF, GPS, XMP), dealer placeholders, the Meade Lexus example, en or em dashes in page
// copy, a second phone number, or a page missing noindex while CONFIG.NOINDEX is on.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { CONFIG } from '../src/config.js';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(dist);
const problems = [];
const rel = (p) => path.relative(dist, p);

for (const f of files.filter((p) => /\.(jpe?g|png|webp|avif)$/i.test(p))) {
  const m = await sharp(f).metadata();
  if (m.exif || m.xmp || m.iptc) problems.push(`${rel(f)} carries ${['exif', 'xmp', 'iptc'].filter((k) => m[k]).join('/')} metadata`);
}
for (const f of files.filter((p) => /\.html$/.test(p))) {
  const html = fs.readFileSync(f, 'utf8');
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ');
  if (/\[DEALER NAME/i.test(html)) problems.push(`${rel(f)} has a dealer placeholder`);
  if (/meade/i.test(html)) problems.push(`${rel(f)} mentions Meade (the Towbook example dealer)`);
  if (/[–—]/.test(text)) problems.push(`${rel(f)} has an en or em dash`);
  for (const t of html.match(/tel:[^"']+/g) || []) if (t !== 'tel:+12483566011') problems.push(`${rel(f)} links ${t}`);
  for (const n of text.match(/\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/g) || []) if (n !== '248-356-6011') problems.push(`${rel(f)} shows phone ${n}`);
  if (CONFIG.NOINDEX && !/<meta name="robots" content="noindex">/.test(html)) problems.push(`${rel(f)} is missing noindex`);
}
if (problems.length) {
  console.error(`check-dist: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-dist: ${files.length} files OK (no image metadata, no placeholders, one phone number, no dashes${CONFIG.NOINDEX ? ', noindex on every page' : ''})`);
