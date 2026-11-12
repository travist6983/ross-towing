// The auction date is written into the page at build time (scripts/auction.mjs). From the day after the
// auction (Detroit time), put back the "call for the next date" line, so a stale date never shows.
import { getAuctionState } from './auction.js';

export function swapPastAuction(root = document, now = new Date()) {
  for (const el of root.querySelectorAll('[data-auction-date]')) {
    if (getAuctionState([{ date: el.dataset.auctionDate }], now, 3650).state !== 'none') continue;
    el.hidden = true;
    const none = el.parentElement && el.parentElement.querySelector('[data-auction-none]');
    if (none) none.hidden = false;
  }
}

swapPastAuction();
