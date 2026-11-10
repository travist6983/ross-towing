// The FAQ page (faq/). Answers come only from Jenn's email of Nov 10, 2026 (answers to Travis's FAQ
// questions, and her hours) plus facts already on the site. She asked that tow prices and storage fees
// not be listed, so they aren't. Change an answer only on the office's word.
import { BUSINESS, address } from './seo.mjs';
import { esc } from './sections.mjs';

const HOURS = 'Monday to Friday 9am to 5pm and Saturday 9am to 1pm. The office is closed on Sunday';

// [question, answer as HTML]. {{BASE}} is filled in at build time. The schema uses the answer as plain text.
export const FAQS = [
  ['Are you open 24 hours?', `Towing is 24 hours a day, 7 days a week, 365 days a year. Call <a href="tel:${BUSINESS.phoneE164}">${BUSINESS.phone}</a>. Our office is open ${HOURS}.`],
  ['Can I pick up my vehicle on a Sunday or after hours?', `No. We release vehicles only during office hours: ${HOURS}.`],
  ['What do I need to pick up my vehicle?', 'The registered owner must bring ID plus proof of ownership: registration, insurance, or title. Payment at release is cash only. Call ahead to make sure your vehicle is ready.'],
  ['Can someone else pick up my vehicle for me?', `Only with written authorization from the registered owner. The owner emails us at <a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a>, says who is allowed to pick up the vehicle, and includes their own driver's license and proof of ownership (registration, title or insurance). The person picking up the vehicle brings their driver's license, and the name on it must match the name in the email.`],
  ['Can I get my belongings out of an impounded vehicle?', 'Yes, during regular office hours, as long as the vehicle is not on a police hold. If it is on a police hold, no one can touch or go into the vehicle for any reason.'],
  ['How long before an impounded vehicle goes to auction?', 'It varies. What happens to an impounded vehicle is at the police department\'s discretion.'],
  ['Do you take credit cards?', 'Yes, for towing and roadside calls. There is a 5% fee for credit cards. Vehicle release at our yard is cash only.'],
  ['Do you work with insurance companies or AAA?', 'We work with insurance companies. We don\'t contact them for you or handle claims, but we often talk with insurers, give them information on vehicles in our yard, such as pricing, and coordinate with them to get vehicles picked up. We do not work with AAA.'],
  ['What kinds of vehicles do you tow?', 'Any type of vehicle: cars, motorcycles, RVs, trucks, EVs and more. For semi trucks, fire trucks and buses we have a <a href="{{BASE}}services/heavy-duty/">50 ton rotator</a>.'],
  ['Does it cost property owners anything to have unauthorized vehicles removed?', 'No. There is no cost to property owners. We come out and post Ross Towing signs, and we replace them if they are damaged or removed. See <a href="{{BASE}}services/private-property-impounds/">how property owners sign up</a>.'],
];

export const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');

export const FAQ_PATH = 'faq/';

// JSON-LD nodes for the FAQ page: the FAQPage and its breadcrumb.
export function faqSchema(url) {
  const page = url + FAQ_PATH;
  return [
    {
      '@type': 'FAQPage', '@id': `${page}#faq`, url: page, about: { '@id': `${url}#business` },
      mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(a) } })),
    },
    {
      '@type': 'BreadcrumbList', '@id': `${page}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: url },
        { '@type': 'ListItem', position: 2, name: 'Questions and answers', item: page },
      ],
    },
  ];
}

export function renderFaq({ base = '/' } = {}) {
  const tel = (detail, inner, cls) => `<a class="${cls}" href="tel:${BUSINESS.phoneE164}" data-track="preview_call" data-track-detail="${detail}">${inner}</a>`;
  return `
  <section class="page-sec tone-night city-head" aria-labelledby="faq-h">
    <div class="page-wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${base}">Home</a></li><li><span aria-current="page">Questions and answers</span></li></ol></nav>
      <p class="eyebrow">FAQ</p>
      <h1 id="faq-h">Questions and answers</h1>
      <p class="lede">Getting your vehicle back, paying, hours and what we tow. Don't see your question? Call us, we're staffed 24/7.</p>
      <div class="inline-call">${tel('faq', `<svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Call <span class="num" data-phone>${BUSINESS.phone}</span>`, 'btn btn-call')}</div>
    </div>
  </section>
  <section class="page-sec tone-day2 city-body" aria-label="Questions">
    <div class="page-wrap faq-list">
      ${FAQS.map(([q, a]) => `<div class="faq-item"><h2>${esc(q)}</h2><p>${a.replaceAll('{{BASE}}', base)}</p></div>`).join('\n      ')}
      <p class="city-note svc-links"><a href="${base}services/impound-release/">Getting your vehicle back</a> · <a href="${base}services/towing/">Towing</a> · <a href="${base}services/roadside/">Roadside help</a> · <a href="${base}services/private-property-impounds/">Private property impounds</a></p>
    </div>
  </section>
  <section class="page-sec tone-night city-visit" aria-labelledby="faq-visit-h">
    <div class="page-wrap">
      <h2 id="faq-visit-h">Call or visit</h2>
      ${tel('faq bottom', `<small>Call dispatch 24/7</small><strong data-phone>${BUSINESS.phone}</strong>`, 'big-call')}
      <p class="visit">${esc(address())} · <a href="${esc(BUSINESS.mapUrl)}" target="_blank" rel="noopener" data-track="preview_directions" data-track-detail="faq">Directions</a></p>
    </div>
  </section>`;
}
