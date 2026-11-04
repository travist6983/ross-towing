// Gallery photos: gallery-src/<category>/*.jpg (originals, gitignored) -> public/gallery/<category>/
// (AVIF + WebP at 480, 960 and 1600 px wide, never upscaled, all metadata stripped) and
// src/data/gallery.json (what the pages render). Run: npm run gallery
//
// Per-file options live in src/data/gallery-captions.json, keyed by "<category>/<filename>":
//   { "alt": "...", "caption": "...", "date": "2026-11", "featured": true,
//     "crop": { "x": 0, "y": 190, "w": 640, "h": 420 },          // original pixels, after EXIF rotation
//     "blurRegions": [{ "x": 2150, "y": 1320, "w": 130, "h": 160 }] // plates, names, numbers
//   }
// Files already processed with the same original and options are skipped (hash check).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'gallery-src');
const OUT = path.join(root, 'public/gallery');
const DATA = path.join(root, 'src/data/gallery.json');
const CAPTIONS = path.join(root, 'src/data/gallery-captions.json');
const CATEGORIES = ['towing', 'freight', 'training'];
const WIDTHS = [480, 960, 1600];
const DEFAULT_ALT = { towing: 'Ross Towing towing job', freight: 'Ross Towing freight load', training: 'Training at the Ross Towing facility' };
const VERSION = 2; // bump to reprocess everything after changing encoder settings
const quiet = process.argv.includes('--quiet-if-missing');

if (!fs.existsSync(SRC)) {
  if (!quiet) console.log('No gallery-src/ folder: nothing to process. The committed public/gallery/ output is used as is.');
  process.exit(0);
}

const captions = fs.existsSync(CAPTIONS) ? JSON.parse(fs.readFileSync(CAPTIONS, 'utf8')) : {};
const previous = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf8')) : [];
const prevByKey = new Map(previous.map((p) => [p.key, p]));
const slug = (s) => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function exifDate(buf) {
  // DateTimeOriginal as "YYYY:MM:DD": good enough for sorting newest first
  const m = /(\d{4}):(\d{2}):(\d{2}) \d{2}:\d{2}:\d{2}/.exec(buf.toString('latin1'));
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

async function processOne(category, file) {
  const key = `${category}/${file}`;
  const full = path.join(SRC, category, file);
  const opts = captions[key] || {};
  const input = fs.readFileSync(full);
  const hash = crypto.createHash('sha1').update(input).update(JSON.stringify({ crop: opts.crop, blur: opts.blurRegions, VERSION })).digest('hex').slice(0, 12);
  const name = slug(file);
  const dir = path.join(OUT, category);
  const prev = prevByKey.get(key);
  const meta = await sharp(input).metadata();
  const date = opts.date || exifDate(input.subarray(0, 65536)) || fs.statSync(full).mtime.toISOString().slice(0, 10);
  const entry = {
    key, category, name,
    alt: opts.alt || DEFAULT_ALT[category],
    altIsDefault: !opts.alt,
    caption: opts.caption || '',
    date, featured: !!opts.featured,
  };
  if (prev && prev.hash === hash && prev.files.every((f) => fs.existsSync(path.join(root, 'public', f.replace(/^gallery\//, 'gallery/'))))) {
    return { ...prev, ...entry, hash, width: prev.width, height: prev.height, files: prev.files, srcset: prev.srcset, placeholder: prev.placeholder, skipped: true };
  }

  // rotate by EXIF, then crop and blur in the rotated frame
  let base = sharp(input).rotate();
  let { data, info } = await base.toBuffer({ resolveWithObject: true });
  let img = sharp(data);
  if (opts.crop) {
    const c = opts.crop;
    img = sharp(await img.extract({ left: c.x, top: c.y, width: c.w, height: c.h }).toBuffer());
    info = { ...info, width: c.w, height: c.h };
  }
  if (opts.blurRegions && opts.blurRegions.length) {
    const flat = await img.toBuffer();
    const patches = [];
    for (const r of opts.blurRegions) {
      const left = Math.max(0, r.x), top = Math.max(0, r.y);
      const width = Math.min(r.w, info.width - left), height = Math.min(r.h, info.height - top);
      const patch = await sharp(flat).extract({ left, top, width, height }).blur(Math.max(12, Math.round(Math.min(width, height) / 3))).toBuffer();
      patches.push({ input: patch, left, top });
    }
    img = sharp(await sharp(flat).composite(patches).toBuffer());
  }
  const master = await img.toBuffer();
  const { width, height } = await sharp(master).metadata();
  fs.mkdirSync(dir, { recursive: true });
  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, width)))];
  const files = [], srcset = { avif: [], webp: [] };
  for (const w of widths) {
    for (const [fmt, enc] of [['avif', { quality: 52, effort: 6 }], ['webp', { quality: 78 }]]) {
      const rel = `gallery/${category}/${name}-${w}.${fmt}`;
      // .toFormat() writes a fresh file: no EXIF, GPS, XMP or ICC carried over (sharp drops metadata unless asked)
      await sharp(master).resize({ width: w, withoutEnlargement: true })[fmt](enc).toFile(path.join(root, 'public', rel));
      files.push(rel);
      srcset[fmt].push([rel, w]);
    }
  }
  const tiny = await sharp(master).resize({ width: 24 }).blur(1.2).webp({ quality: 40 }).toBuffer();
  return {
    ...entry, hash, width, height, files, srcset,
    placeholder: `data:image/webp;base64,${tiny.toString('base64')}`,
    source: { width: meta.width, height: meta.height },
  };
}

const out = [];
for (const category of CATEGORIES) {
  const dir = path.join(SRC, category);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|heic|tiff?)$/i.test(f)).sort()) {
    try {
      const e = await processOne(category, file);
      out.push(e);
      console.log(`${e.skipped ? 'skip ' : 'built'} ${e.key} -> ${e.width}x${e.height}${e.altIsDefault ? '  (no alt yet)' : ''}`);
    } catch (err) {
      console.error(`FAILED ${category}/${file}: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

// remove outputs for originals that are gone
const keep = new Set(out.flatMap((e) => e.files));
for (const category of CATEGORIES) {
  const dir = path.join(OUT, category);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) if (!keep.has(`gallery/${category}/${f}`)) { fs.unlinkSync(path.join(dir, f)); console.log(`removed gallery/${category}/${f}`); }
}

out.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.key.localeCompare(b.key));
fs.writeFileSync(DATA, JSON.stringify(out.map(({ skipped, ...e }) => e), null, 2) + '\n');
const noAlt = out.filter((e) => e.altIsDefault).map((e) => e.key);
console.log(`\n${out.length} photos in src/data/gallery.json${noAlt.length ? `. Default alt text on: ${noAlt.join(', ')}` : ''}`);
