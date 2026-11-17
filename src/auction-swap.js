// The auction date is written into the page at build time (scripts/auction.mjs). From the day after the
// auction (Detroit time), hide it and, where it is marked data-auction-fallback, write in the
// "call for the next date" line, so a stale date never shows. The line is not in the built page, so a
// visitor or a crawler never reads it beside a live date.
import { getAuctionState } from './auction.js';

const PHONE = '248-356-6011', TEL = '+12483566011';

export function swapPastAuction(root = document, now = new Date()) {
  for (const el of root.querySelectorAll('[data-auction-date]')) {
    if (el.hidden || getAuctionState([{ date: el.dataset.auctionDate }], now, 3650).state !== 'none') continue;
    el.hidden = true;
    if (!el.hasAttribute('data-auction-fallback')) continue;
    const doc = el.ownerDocument, span = doc.createElement('span'), a = doc.createElement('a'), num = doc.createElement('span');
    span.setAttribute('data-auction-none', '');
    a.href = `tel:${TEL}`;
    num.setAttribute('data-phone', '');
    num.textContent = PHONE;
    a.append(num);
    span.append('Call ', a, ' for the next date.');
    el.after(span);
  }
}

if (typeof document !== 'undefined') swapPastAuction();
