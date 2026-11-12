// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextAuction, auctionWhen, auctionSentence, auctionStart, auctionSchema, renderAuctionStatic, renderAuctionNote, loadAuctionJson } from '../scripts/auction.mjs';

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
