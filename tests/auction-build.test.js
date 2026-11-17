// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextAuction, auctionWhen, auctionSentence, auctionStart, auctionSchema, renderAuctionStatic, renderAuctionNote, renderAuctionVehicles, auctionVehicles, loadAuctionJson } from '../scripts/auction.mjs';

const URL_ = 'https://rosstow.com/';
const JSON_ = { date: '2026-12-04', time: '10:00 AM', location: '21360 Telegraph Rd, Southfield, MI 48033', showFromDaysBefore: 30, note: "Open to the public. Bring your driver's license." };
const NOV12 = new Date('2026-11-12T17:00:00Z');

test('auction build: the data file holds the Dec 4, 2026 auction at 10 AM', () => {
  const j = loadAuctionJson(new URL('..', import.meta.url).pathname);
  assert.equal(j.date, '2026-12-04');
  assert.equal(j.time, '10:00 AM');
});

test('auction build: upcoming, today and passed', () => {
  assert.equal(nextAuction(JSON_, NOV12).date, '2026-12-04');
  assert.equal(nextAuction(JSON_, new Date('2026-12-04T20:00:00Z')).date, '2026-12-04');
  assert.equal(nextAuction(JSON_, new Date('2026-12-05T12:00:00Z')), null);
  assert.equal(nextAuction({ ...JSON_, date: null }, NOV12), null);
});

test('auction build: copy and start time in Detroit time', () => {
  const a = nextAuction(JSON_, NOV12);
  assert.equal(auctionWhen(a), 'Friday, December 4, 2026 at 10:00 AM');
  assert.equal(auctionSentence(a), "Next public auction: Friday, December 4, 2026 at 10:00 AM, at 21360 Telegraph Rd, Southfield, MI 48033. Open to the public. Bring your driver's license.");
  assert.equal(auctionStart(a), '2026-12-04T10:00:00-05:00');
  assert.equal(auctionStart({ date: '2027-06-04', time: '10:00 AM' }), '2027-06-04T10:00:00-04:00');
  assert.equal(auctionStart({ date: '2027-06-04', time: '' }), '2027-06-04');
});

test('auction build: Event schema at the yard, and none without a date', () => {
  const [e] = auctionSchema(URL_, nextAuction(JSON_, NOV12));
  assert.equal(e['@type'], 'Event');
  assert.equal(e.startDate, '2026-12-04T10:00:00-05:00');
  assert.equal(e.location.address.streetAddress, '21360 Telegraph Rd');
  assert.deepEqual(e.organizer, { '@id': `${URL_}#business` });
  assert.deepEqual(auctionSchema(URL_, null), []);
});

test('auction build: page lines keep the generic line hidden for after the auction', () => {
  const a = nextAuction(JSON_, NOV12);
  const s = renderAuctionStatic(a);
  assert.match(s, /data-auction-date="2026-12-04"/);
  assert.match(s, /<span data-auction-none hidden>Public auctions about every two months/);
  assert.match(renderAuctionNote(a), /Next public auction: Friday, December 4, 2026 at 10:00 AM\./);
  assert.doesNotMatch(renderAuctionStatic(null), /hidden|data-auction-date/);
  assert.equal(renderAuctionNote(null), '<span data-auction-none>Call for the next date.</span>');
  for (const html of [s, renderAuctionNote(a)]) assert.doesNotMatch(html, /[–—]/);
});

test('auction build: the data file lists the office\'s 52 vehicles, each with a valid VIN', () => {
  const j = loadAuctionJson(new URL('..', import.meta.url).pathname);
  const list = auctionVehicles(j);
  assert.equal(j.vehicles.length, 52);
  assert.equal(list.length, 52);
  const W = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const val = (c) => (/\d/.test(c) ? +c : 'ABCDEFGH'.includes(c) ? 'ABCDEFGH'.indexOf(c) + 1 : 'JKLMN'.includes(c) ? 'JKLMN'.indexOf(c) + 1 : c === 'P' ? 7 : c === 'R' ? 9 : 'STUVWXYZ'.indexOf(c) + 2);
  for (const v of list) {
    const r = [...v.vin].reduce((t, c, i) => t + val(c) * W[i], 0) % 11;
    assert.equal(v.vin[8], r === 10 ? 'X' : String(r), v.vin);
  }
  assert.equal(new Set(list.map((v) => v.vin)).size, 52);
});

test('auction build: vehicle list sorts, drops bad rows and hides with the date', () => {
  const j = { ...JSON_, vehicles: [
    { year: 2014, make: 'Ford', model: 'Focus', color: 'Silver', vin: '1FADP3F27FL374318' },
    { year: 2001, make: 'Buick', model: 'Century', color: '', vin: '2g4ws52j511118330' },
    { year: 2010, make: 'Saab', model: '9-3', color: 'Black', vin: 'TOO-SHORT' },
  ] };
  const a = nextAuction(j, NOV12);
  assert.deepEqual(a.vehicles.map((v) => v.make), ['Buick', 'Ford']);
  assert.equal(a.vehicles[0].vin, '2G4WS52J511118330');
  const html = renderAuctionVehicles(a);
  assert.match(html, /data-auction-date="2026-12-04"/);
  assert.match(html, /Vehicles in the December 4 auction/);
  assert.match(html, /2 vehicles\./);
  assert.match(html, /<th scope="row">2001 Buick Century<\/th><td><\/td><td class="vin">2G4WS52J511118330<\/td>/);
  assert.doesNotMatch(html, /[–—]/);
  assert.equal(renderAuctionVehicles(nextAuction(JSON_, NOV12)), '');
  assert.equal(renderAuctionVehicles(null), '');
});
