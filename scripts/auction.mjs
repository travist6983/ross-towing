// The next public auction, written into the pages at build time from src/data/auction.json, so search
// engines, AI search and visitors with JavaScript off see the date. On the page, src/auction-swap.js puts
// in the "call for the next date" line once the date has passed, and src/main.js still shows the banner.
// Dates come only from the office. Dec 4, 2026: Jenn's emails of Nov 12, 2026 (10am, Southfield yard,
// open to the public, bring a driver's license). Vehicle list: the office's email of Nov 17, 2026 (52 vehicles,
// sent by Jake Rider, towing and dispatch manager). Only spelling was tidied (Chevy Avero to Chevrolet Aveo,
// ELANTRA to Elantra, Saab 93 to 9-3); every VIN passes its check digit.
import fs from 'node:fs';
import path from 'node:path';
import { rowsFromJSON, getAuctionState, formatAuctionDate, parseDay, parseTime, detroitToUTC } from '../src/auction.js';
import { BUSINESS, address } from './seo.mjs';
import { esc } from './sections.mjs';

const DAY = 864e5;

export const loadAuctionJson = (root) => JSON.parse(fs.readFileSync(path.join(root, 'src/data/auction.json'), 'utf8'));

// The auction that has not passed yet at build time (today counts), or null.
export function nextAuction(json, now = new Date()) {
  const res = getAuctionState(rowsFromJSON(json, () => {}), now, 3650);
  if (res.state === 'none') return null;
  const a = res.auction;
  return { date: a.date, time: a.time, location: a.location || json.location || address(), note: a.note, vehicles: auctionVehicles(json) };
}

const VIN = /^[A-HJ-NPR-Z0-9]{17}$/;

// The vehicles listed for the auction, sorted by make, model and year. Rows without a year, make and
// valid VIN are dropped. Color is optional (the office leaves it off for some).
export function auctionVehicles(json) {
  const s = (v) => (v == null ? '' : String(v).trim());
  return (Array.isArray(json && json.vehicles) ? json.vehicles : [])
    .map((v) => ({ year: Number(v && v.year), make: s(v && v.make), model: s(v && v.model), color: s(v && v.color), vin: s(v && v.vin).toUpperCase() }))
    .filter((v) => Number.isInteger(v.year) && v.make && VIN.test(v.vin))
    .sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || a.year - b.year);
}

// "Friday, December 4, 2026 at 10:00 AM"
export const auctionWhen = (a) => `${formatAuctionDate(a.date)}, ${a.date.slice(0, 4)}${a.time ? ` at ${a.time}` : ''}`;

// One plain sentence for llms.txt and the page copy.
export const auctionSentence = (a) => [`Next public auction: ${auctionWhen(a)}, at ${a.location}.`, a.note].filter(Boolean).join(' ');

const tel = (detail) => `<a href="tel:${BUSINESS.phoneE164}" data-track="preview_call" data-track-detail="${detail}"><span data-phone>${BUSINESS.phone}</span></a>`;

// The "call for the next date" line. With a date it is not written into the page at all, so a visitor
// or a crawler never reads it beside the date; src/auction-swap.js writes it in once the date passes,
// next to any element marked data-auction-fallback.
export const auctionFallback = (detail) => `Call ${tel(detail)} for the next date.`;

// The home page's static auction line (inside .auction-static). src/main.js swaps it for the banner.
export function renderAuctionStatic(a) {
  if (!a) return `<span data-auction-none>${auctionFallback('auction')}</span>`;
  return `<span data-auction-date="${esc(a.date)}" data-auction-fallback>${esc(auctionSentence(a))}</span>`;
}

// The line under "Public auctions about every two months" on the vehicle release page.
export function renderAuctionNote(a) {
  if (!a) return `<span data-auction-none>${auctionFallback('auction note')}</span>`;
  return `<span data-auction-date="${esc(a.date)}" data-auction-fallback><strong>${esc(`Next public auction: ${auctionWhen(a)}.`)}</strong>${a.note ? ` ${esc(a.note)}` : ''}</span>`;
}

// On the home page, under the auction line: a link to the vehicle list, while there is one.
export function renderAuctionListLink(a, base = '/') {
  const n = ((a && a.vehicles) || []).length;
  if (!n) return '';
  return `<p class="muted auction-list-link" data-auction-date="${esc(a.date)}"><a href="${esc(base)}services/impound-release/#auction-vehicles">See the ${n} vehicles in the ${esc(formatAuctionDate(a.date).replace(/^\w+, /, ''))} auction</a></p>`;
}

// The vehicle list on the vehicle release page, or nothing. It carries data-auction-date, so
// src/auction-swap.js hides it the day after the auction, along with the date line.
export function renderAuctionVehicles(a) {
  const list = (a && a.vehicles) || [];
  if (!list.length) return '';
  // On phones the color moves under the vehicle name (.vc) and the Color column hides, so the VIN fits.
  const rows = list.map((v) => `<tr><th scope="row">${esc(`${v.year} ${v.make} ${v.model}`.trim())}${v.color ? `<span class="vc">${esc(v.color)}</span>` : ''}</th><td class="col-color">${esc(v.color)}</td><td class="vin">${esc(v.vin)}</td></tr>`).join('');
  return `<div class="equip auction-vehicles" id="auction-vehicles" data-auction-date="${esc(a.date)}">
          <h3>Vehicles in the ${esc(formatAuctionDate(a.date).replace(/^\w+, /, ''))} auction</h3>
          <p class="city-note">${list.length} vehicles. Call <a href="tel:${BUSINESS.phoneE164}" data-track="preview_call" data-track-detail="auction list"><span data-phone>${BUSINESS.phone}</span></a> with questions about a vehicle.</p>
          <div class="tbl-scroll"><table>
            <thead><tr><th scope="col">Vehicle</th><th scope="col" class="col-color">Color</th><th scope="col">VIN</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
        </div>`;
}

// "2026-12-04T10:00:00-05:00" in Detroit time, or the bare date when there's no time.
export function auctionStart(a) {
  const day = parseDay(a.date), t = parseTime(a.time);
  if (!t) return a.date;
  const wall = day * DAY + (t.h * 60 + t.m) * 6e4, off = Math.round((wall - detroitToUTC(day, t.h, t.m)) / 6e4);
  const pad = (n) => String(n).padStart(2, '0'), sign = off < 0 ? '-' : '+', abs = Math.abs(off);
  return `${a.date}T${pad(t.h)}:${pad(t.m)}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

// JSON-LD Event for the next auction, or no nodes.
export function auctionSchema(url, a) {
  if (!a) return [];
  const b = BUSINESS;
  const atYard = a.location === address();
  return [{
    '@type': 'Event',
    '@id': `${url}#auction-${a.date}`,
    name: 'Ross Towing public vehicle auction',
    description: ['Public vehicle auction at the Ross Towing yard in Southfield, Michigan.', a.note].filter(Boolean).join(' '),
    startDate: auctionStart(a),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: atYard
      ? { '@type': 'Place', name: b.name, address: { '@type': 'PostalAddress', streetAddress: b.street, addressLocality: b.city, addressRegion: b.region, postalCode: b.postal, addressCountry: b.country } }
      : { '@type': 'Place', name: a.location, address: a.location },
    organizer: { '@id': `${url}#business` },
    url: `${url}services/impound-release/`,
  }];
}
