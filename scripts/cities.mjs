// The "Towing in <city>" pages, one for each city in the home page's "Where we tow" list (Travis picked
// these seven, Nov 10, 2026). Each page is built from this file at build time; the HTML files under
// towing/<slug>/ are identical shells. Every fact here is either already on the site or was read on
// Google Maps on Nov 10, 2026 (driving distance and the usual roads from 21360 Telegraph Rd to that
// city's city hall). Add nothing here that isn't true and checkable: no response times, no testimonials.
import { BUSINESS, address } from './seo.mjs';
import { esc, picture } from './sections.mjs';

export const CITIES = [
  {
    slug: 'southfield', name: 'Southfield',
    description: 'Ross Towing is based in Southfield, on a seven acre yard at 21360 Telegraph Rd. 24/7 towing, roadside help, heavy recovery and impound release. Call 248-356-6011.',
    where: 'Our yard is in Southfield, at 21360 Telegraph Rd, and has been for over 60 years. Southfield City Hall is about 5 miles away by Telegraph Rd and 10 Mile Rd.',
    notes: [
      'Vehicles we impound are stored right here in Southfield, on six acres of lit, fenced and camera covered storage, with indoor storage in our shop for evidence vehicles.',
      'Heavy jobs start here too. One of them: towing a Southfield fire department ladder truck with our heavy wrecker.',
    ],
    photo: 'towing/fire-truck-tow.jpg',
  },
  {
    slug: 'lathrup-village', name: 'Lathrup Village',
    description: 'Towing in Lathrup Village, MI from Ross Towing, about 6 miles away in Southfield. Staffed 24/7 for tows, lockouts, jump starts and flat tires. Call 248-356-6011.',
    where: 'Lathrup Village is about 6 miles from our Southfield yard, by 9 Mile Rd and Southfield Rd or by Telegraph Rd and 11 Mile Rd.',
    notes: [
      'Not every call needs a tow. We can send a truck for a lockout, a jump start, a flat tire, fuel delivery or battery service.',
      'Property owners can have unauthorized vehicles removed 24 hours a day under our private property impound program.',
    ],
    photo: 'towing/IMG_5089.jpeg',
  },
  {
    slug: 'oak-park', name: 'Oak Park',
    description: 'Towing in Oak Park, MI from Ross Towing in Southfield, about 6 miles away. Light duty and flatbed tows, roadside help and accident recovery, 24/7. Call 248-356-6011.',
    where: 'Oak Park is about 6 miles east of our yard, by 9 Mile Rd, or by 8 Mile Rd.',
    notes: [
      'We tow with flatbeds as well as wreckers, so your whole vehicle can ride on the bed.',
      'If your vehicle was towed to our yard, you can pick it up Monday to Friday 9am to 5pm or Saturday 9am to 1pm. Release is cash only.',
    ],
    photo: 'towing/IMG_6288.jpeg',
  },
  {
    slug: 'farmington-hills', name: 'Farmington Hills',
    description: 'Towing in Farmington Hills, MI from Ross Towing, police towing contractor for the Farmington Hills Police Department. 24/7 tows and recovery. Call 248-356-6011.',
    where: 'Farmington Hills is about 6.5 miles west of our yard, by Telegraph Rd and 11 Mile Rd, or by I-696.',
    notes: [
      'We\'re contracted for police towing with the Farmington Hills Police Department, and Farmington Hills police have trained at our yard, K-9 units included.',
      'Our rotator has towed a Farmington Hills Fire Rescue engine, and our Landoll trailer has hauled one.',
    ],
    photo: 'towing/fire-truck-tow-night.jpg',
  },
  {
    slug: 'royal-oak', name: 'Royal Oak',
    description: 'Towing in Royal Oak, MI from Ross Towing in Southfield, about 10 miles away. Staffed 24/7 for tows, roadside help and private property impounds. Call 248-356-6011.',
    where: 'Royal Oak is about 10 miles east of our yard, by 9 Mile, 10 Mile or 11 Mile Rd.',
    notes: [
      'A late night breakdown gets the same answer as a weekday one: one call and a Ross truck comes to you.',
      'Businesses and property owners can have unauthorized vehicles removed from their lots 24 hours a day under our private property impound program.',
    ],
    photo: 'towing/rotator-night.jpg',
  },
  {
    slug: 'detroit', name: 'Detroit',
    description: 'Towing and heavy recovery in Detroit, MI from Ross Towing. 50 ton rotator for semi trucks and buses, 24/7 dispatch, family owned since 1962. Call 248-356-6011.',
    where: 'Downtown Detroit is about 17 miles from our yard, by 8 Mile Rd and the Lodge Freeway (M-10).',
    notes: [
      'For the big jobs on Detroit\'s freeways, our 50 ton rotator handles semi trucks, fire trucks, buses and similar heavy vehicles.',
      'We\'re also a licensed freight carrier, hauling machinery and equipment across Michigan, Ohio and Indiana.',
    ],
    photo: 'towing/freeway-semi-recovery.jpg',
  },
  {
    slug: 'dearborn', name: 'Dearborn',
    description: 'Towing in Dearborn, MI from Ross Towing, about 14 miles away by the Southfield Freeway. Heavy duty and truck towing, accident recovery, 24/7. Call 248-356-6011.',
    where: 'Dearborn is about 14 miles south of our yard, most directly by the Southfield Freeway (M-39).',
    notes: [
      'We tow trucks and other large vehicles as well as cars, SUVs and pickups, and we get vehicles off the road after a crash.',
      'Fuel, oil or diesel on the road after a crash? We\'re licensed for environmental spill response anywhere in Michigan.',
    ],
    photo: 'towing/semi-tow.jpg',
  },
];

export const cityPath = (c) => `towing/${c.slug}/`;
export const cityTitle = (c) => `Towing in ${c.name}, MI | Ross Towing, 24/7`;
const cityOf = (slug) => CITIES.find((c) => c.slug === slug);

// JSON-LD nodes added to the business @graph on a city page: the towing service for that city and the breadcrumb.
// schema.org has no TowingService type, so this is a Service with serviceType Towing.
export function citySchema(url, slug) {
  const c = cityOf(slug), page = url + cityPath(c);
  return [
    {
      '@type': 'Service', '@id': `${page}#service`, name: `Towing in ${c.name}, MI`, serviceType: 'Towing',
      url: page, provider: { '@id': `${url}#business` },
      areaServed: { '@type': 'City', name: `${c.name}, MI` },
      hoursAvailable: 'Mo-Su 00:00-23:59',
    },
    {
      '@type': 'BreadcrumbList', '@id': `${page}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: url },
        { '@type': 'ListItem', position: 2, name: 'Where we tow', item: `${url}#service-area` },
        { '@type': 'ListItem', position: 3, name: c.name, item: page },
      ],
    },
  ];
}

// [icon, heading, text, the service page it links to (services/<slug>/, scripts/services.mjs)]
const SERVICES_HTML = [
  ['i-hook', 'Light duty towing', 'Cars, SUVs and pickups.', 'towing'],
  ['i-flatbed', 'Flatbed towing', 'Your whole vehicle rides on the bed.', 'towing'],
  ['i-key', 'Roadside help', 'Lockouts, jump starts, flat tires, fuel delivery and battery service.', 'roadside'],
  ['i-truck', 'Heavy duty and truck towing', 'Semi trucks, buses and other big vehicles, with a 50 ton rotator.', 'heavy-duty'],
  ['i-crash', 'Accident recovery', 'Getting vehicles off the road after a crash.', 'heavy-duty'],
  ['i-winch', 'Winch outs', 'Pulling vehicles out of ditches, mud and snow.', 'heavy-duty'],
];

// The page body (inside <main>). base is the site's base path, gallery the photo data.
export function renderCity(slug, { base = '/', gallery = [] } = {}) {
  const c = cityOf(slug);
  if (!c) return '';
  const photo = gallery.find((p) => p.key === c.photo);
  const others = CITIES.filter((o) => o.slug !== c.slug);
  const tel = (detail, inner, cls = 'btn btn-call') => `<a class="${cls}" href="tel:${BUSINESS.phoneE164}" data-track="preview_call" data-track-detail="${detail}">${inner}</a>`;
  return `
  <section class="page-sec tone-night city-head" aria-labelledby="city-h">
    <div class="page-wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${base}">Home</a></li><li><a href="${base}#service-area">Where we tow</a></li><li><span aria-current="page">${esc(c.name)}</span></li></ol></nav>
      <p class="eyebrow">Where we tow</p>
      <h1 id="city-h">Towing in ${esc(c.name)}, MI</h1>
      <p class="lede">${esc(c.where)} Dispatch is staffed 24 hours a day, 365 days a year.</p>
      <div class="inline-call">
        ${tel(`city ${c.slug}`, `<svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Call <span class="num" data-phone>${BUSINESS.phone}</span>`)}
        <!-- @section online tow -->
      </div>
    </div>
  </section>
  <section class="page-sec tone-day2 city-body" aria-labelledby="city-what-h">
    <div class="page-wrap city-grid">
      <div>
        <h2 id="city-what-h">What we do in ${esc(c.name)}</h2>
        <div class="cards">
          ${SERVICES_HTML.map(([ico, h, p, svc]) => `<article class="card"><svg class="ico" aria-hidden="true"><use href="#${ico}"/></svg><h3><a href="${base}services/${svc}/">${h}</a></h3><p>${p}</p></article>`).join('\n          ')}
        </div>
        ${c.notes.map((n) => `<p class="city-note">${esc(n)}</p>`).join('\n        ')}
        <p class="city-note">Spill response is licensed anywhere in Michigan, and freight hauling covers Michigan, Ohio and Indiana. <a href="${base}services/spill-response/">Spill response</a> · <a href="${base}services/freight/">Freight</a> · <a href="${base}services/impound-release/">Getting your vehicle back</a> · <a href="${base}services/private-property-impounds/">Private property impounds</a></p>
      </div>
      ${photo ? `<figure class="shot city-shot">${picture(photo, { sizes: '(min-width: 900px) 520px, calc(100vw - 32px)' })}<figcaption>${esc(photo.caption || '')}</figcaption></figure>` : ''}
    </div>
  </section>
  <section class="page-sec tone-night city-visit" aria-labelledby="city-visit-h">
    <div class="page-wrap">
      <h2 id="city-visit-h">Call or visit</h2>
      ${tel(`city ${c.slug} bottom`, `<small>Call dispatch 24/7</small><strong data-phone>${BUSINESS.phone}</strong>`, 'big-call')}
      <p class="visit">${esc(address())} · <a href="${esc(BUSINESS.mapUrl)}" target="_blank" rel="noopener" data-track="preview_directions" data-track-detail="city ${c.slug}">Directions</a></p>
      <p class="muted">Office and vehicle release: ${esc(BUSINESS.officeHours)}. Vehicle release is cash only.</p>
      <h3 class="city-others-h">Other places we tow</h3>
      <ul class="chips city-others">${others.map((o) => `<li><a href="${base}${cityPath(o)}"><svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg>${esc(o.name)}</a></li>`).join('')}</ul>
    </div>
  </section>`;
}
