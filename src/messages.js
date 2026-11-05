// The freight quote as the office reads it. The Worker's email (worker/src/index.js) and the on-page
// confirmation both come from here, so they always say the same thing. No DOM in this file.

const NUM = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
const str = (v) => (v == null ? '' : String(v).trim());
const yes = (v) => v === true || ['yes', 'on', 'true', '1'].includes(str(v).toLowerCase());
const list = (v) => (Array.isArray(v) ? v : str(v) ? str(v).split(',') : []).map(str).filter(Boolean);

// "42,000" or "8.5" -> number; blank, negative or junk -> null
export function toNumber(v) {
  const t = str(v).replace(/,/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// "2026-12-07" -> "Mon, Dec 7, 2026" (a calendar date, so no time zone shift)
export function formatDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(iso));
  if (!m) return str(iso);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatLoad(d) {
  const load = str(d.load).replace(/\s+/g, ' ');
  const n = toNumber(d.pieces);
  if (n == null || !Number.isInteger(n) || n < 1) return load;
  return `${NUM.format(n)} ${n === 1 ? 'piece' : 'pieces'}${load ? ', ' + load : ''}`;
}

// 24 ft L x 8.5 ft W x 10 ft H. Missing sides are named, so the office knows what to ask for.
export function formatDimensions(d) {
  const parts = [], missing = [];
  for (const [key, tag] of [['length', 'L'], ['width', 'W'], ['height', 'H']]) {
    const n = toNumber(d[key]);
    if (n == null) { missing.push(key); continue; }
    parts.push(`${NUM.format(n)} ${d[key + '_unit'] === 'in' ? 'in' : 'ft'} ${tag}`);
  }
  if (!parts.length) return 'Not given';
  return parts.join(' x ') + (missing.length ? ` (${missing.join(' and ')} not given)` : '');
}

export function formatWeight(d) {
  const n = toNumber(d.weight);
  if (n == null) return 'Not given';
  const unit = d.weight_unit === 'tons' ? (n === 1 ? 'ton' : 'tons') : (n === 1 ? 'lb' : 'lbs');
  return `${NUM.format(n)} ${unit}${yes(d.weight_estimate) ? ' (estimate)' : ''}`;
}

export function formatEquipment(d) {
  const other = str(d.equipment_other).replace(/\s+/g, ' ');
  const items = list(d.equipment).map((e) => (e === 'Other' && other ? `Other: ${other}` : e));
  return items.length ? items.join(', ') : 'None selected';
}

// Every line of the quote as [label, value], blanks dropped. The email's table is built from this.
export function freightRows(d = {}) {
  return [
    ['Company', d.company],
    ['Contact', d.contact],
    ['Phone', d.phone],
    ['Email', d.email],
    ['Pickup', d.pickup],
    ['Delivery', d.delivery],
    ['Ready date', d.ready_date && formatDay(d.ready_date)],
    ['Delivery needed by', d.deliver_by && formatDay(d.deliver_by)],
    ['Load', formatLoad(d)],
    ['Dimensions', formatDimensions(d)],
    ['Weight', formatWeight(d)],
    ['Equipment', formatEquipment(d)],
    ['Trailer preference', str(d.trailer) || 'No preference'],
    ['Notes', d.notes],
  ].map(([k, v]) => [k, str(v).replace(/\r\n?/g, '\n')]).filter(([, v]) => v);
}

// For example:
//   Load: 2 pieces, excavator
//   Dimensions: 24 ft L x 8.5 ft W x 10 ft H
//   Weight: 42,000 lbs (estimate)
//   Equipment: Chains, Binders, Edge protectors
export const formatFreightQuote = (d = {}) => freightRows(d).map(([k, v]) => `${k}: ${v}`).join('\n');

// The details a shipper should double check, shown in the on-page confirmation.
export function freightSummary(d = {}) {
  return [
    ['Pickup', str(d.pickup)],
    ['Delivery', str(d.delivery)],
    ['Dimensions', formatDimensions(d)],
    ['Weight', formatWeight(d)],
    ['Equipment', formatEquipment(d)],
  ];
}

// "Freight quote: Southfield, MI to Toledo, OH (Acme Excavating)". One line, never longer than 200.
export function freightSubject(d = {}) {
  const one = (v) => str(v).replace(/\s+/g, ' ');
  const who = one(d.company) || one(d.contact);
  return `Freight quote: ${one(d.pickup) || 'pickup'} to ${one(d.delivery) || 'delivery'}${who ? ` (${who})` : ''}`.slice(0, 200);
}
