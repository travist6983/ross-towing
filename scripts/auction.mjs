// The next public auction, written into the pages at build time from src/data/auction.json, so search
// engines, AI search and visitors with JavaScript off see the date. On the page, src/auction-swap.js puts
// back the "call for the next date" line once the date has passed, and src/main.js still shows the banner.
// Dates come only from the office. Dec 4, 2026: Jenn's emails of Nov 12, 2026 (10am, Southfield yard,
// open to the public, bring a driver's license). No vehicle list yet: she'll decide what to list.
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
  return { date: a.date, time: a.time, location: a.location || json.location || address(), note: a.note };
}

// "Friday, December 4, 2026 at 10:00 AM"
export const auctionWhen = (a) => `${formatAuctionDate(a.date)}, ${a.date.slice(0, 4)}${a.time ? ` at ${a.time}` : ''}`;

// One plain sentence for llms.txt and the page copy.
export const auctionSentence = (a) => [`Next public auction: ${auctionWhen(a)}, at ${a.location}.`, a.note].filter(Boolean).join(' ');

const generic = (tel) => `Public auctions about every two months. Call ${tel} for the next date.`;

// The home page's static auction line (inside .auction-static). With a date, both lines are written and
// the generic one waits hidden for the day after the auction.
export function renderAuctionStatic(a) {
  const tel = `<a href="tel:${BUSINESS.phoneE164}" data-track="preview_call" data-track-detail="auction"><span data-phone>${BUSINESS.phone}</span></a>`;
  const none = (hidden) => `<span data-auction-none${hidden ? ' hidden' : ''}>${generic(tel)}</span>`;
  if (!a) return none(false);
  return `<span data-auction-date="${esc(a.date)}">${esc(auctionSentence(a))}</span>${none(true)}`;
}

// The line under "Public auctions about every two months" on the vehicle release page.
export function renderAuctionNote(a) {
  const none = (hidden) => `<span data-auction-none${hidden ? ' hidden' : ''}>Call for the next date.</span>`;
  if (!a) return none(false);
  return `<span data-auction-date="${esc(a.date)}"><strong>${esc(`Next public auction: ${auctionWhen(a)}.`)}</strong>${a.note ? ` ${esc(a.note)}` : ''}</span>${none(true)}`;
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
