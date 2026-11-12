// One page for each service the home page lists (Nov 10, 2026), at services/<slug>/. Each page is built from
// this file at build time; the HTML files under services/<slug>/ are identical shells. Every fact here is
// already on the site (index.html, the gallery captions or scripts/seo.mjs). Add nothing here that isn't on
// the site too: no response times, no prices, no testimonials. Questions and answers live in scripts/faq.mjs.
import { BUSINESS, SERVICES, address } from './seo.mjs';
import { CITIES, cityPath } from './cities.mjs';
import { esc, picture } from './sections.mjs';

const TEL = (detail, inner, cls = 'btn btn-call') => `<a class="${cls}" href="tel:${BUSINESS.phoneE164}" data-track="preview_call" data-track-detail="${detail}">${inner}</a>`;
const CALL = (detail) => TEL(detail, `<svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Call <span class="num" data-phone>${BUSINESS.phone}</span>`);
const card = ([ico, h, p]) => `<article class="card"><svg class="ico" aria-hidden="true"><use href="#${ico}"/></svg><h3>${esc(h)}</h3><p>${p}</p></article>`;

// anchor: the matching SERVICES entry in scripts/seo.mjs (its page field is this page's path).
// cards: [icon, heading, text as HTML]. blocks: extra HTML sections. cta: which Towbook button sits by the call
// button ('tow', or null for call only). area: where it's offered when it isn't the towing cities.
export const SERVICE_PAGES = [
  {
    slug: 'towing', anchor: 'towing', name: 'Light duty and flatbed towing',
    title: 'Light Duty and Flatbed Towing in Southfield, MI | Ross Towing',
    description: 'Light duty and flatbed towing for cars, SUVs and pickups from Ross Towing in Southfield, staffed 24/7. Police and dealer towing too. Call 248-356-6011.',
    h1: 'Light duty and flatbed towing',
    lede: 'Cars, SUVs and pickups, towed by wrecker or carried on a flatbed. We\'re staffed 24 hours a day, 365 days a year. One call and a Ross truck comes to you.',
    summary: 'light duty, flatbed, police and dealership towing',
    cards: [
      ['i-hook', 'Light duty towing', 'Cars, SUVs and pickups.'],
      ['i-flatbed', 'Flatbed towing', 'Your whole vehicle rides on the bed.'],
      ['i-shield', 'Police towing and impounds', 'Contracted with the Michigan State Police and the Farmington Hills Police Department.'],
      ['i-car', 'Dealership towing', 'We tow for car dealerships in the area, and we\'re looking to partner with more. Call to set up an account.'],
    ],
    notes: [
      'Our tow fleet runs flatbeds, wreckers and a 50 ton rotator, so a bigger vehicle is a call to the same number.',
      'We\'ve been towing out of the same Southfield yard on Telegraph Rd since 1962.',
    ],
    links: [['impound-release', 'Towed to our yard? Getting your vehicle back'], ['roadside', 'Just need a jump or a lockout? Roadside help'], ['faq', 'Paying by card, insurance and other questions']],
    photo: 'towing/IMG_5089.jpeg', cta: 'tow', hours24: true,
  },
  {
    slug: 'roadside', anchor: 'roadside', name: 'Roadside help',
    title: 'Roadside Help: Lockouts, Jump Starts, Flat Tires | Ross Towing',
    description: 'Roadside help from Ross Towing in Southfield: lockouts, jump starts, flat tires, fuel delivery and battery service. Dispatch staffed 24/7. Call 248-356-6011.',
    h1: 'Roadside help',
    lede: 'Not every call needs a tow. We can send a truck for a lockout, a jump start, a flat tire, fuel delivery or battery service. Dispatch is staffed 24 hours a day, 365 days a year.',
    summary: 'lockouts, jump starts, flat tires, fuel delivery and battery service',
    cards: [
      ['i-key', 'Lockouts', 'Keys locked inside the vehicle.'],
      ['i-bolt', 'Jump starts', 'A battery too weak to start the engine.'],
      ['i-tire', 'Flat tires', 'A flat that leaves you stuck.'],
      ['i-fuel', 'Fuel delivery', 'Out of fuel and short of a station.'],
      ['i-battery', 'Battery service', 'Battery trouble that needs a hand.'],
    ],
    notes: ['If the vehicle needs a tow after all, we do light duty and flatbed towing too.'],
    links: [['towing', 'Light duty and flatbed towing'], ['heavy-duty', 'Stuck in a ditch? Winch outs'], ['faq', 'Paying by card and other questions']],
    photo: 'towing/wrecker-79.jpg', cta: 'tow', hours24: true,
  },
  {
    slug: 'heavy-duty', anchor: 'heavy', name: 'Heavy duty towing and recovery',
    title: 'Heavy Duty Towing and 50 Ton Rotator Recovery | Ross Towing',
    description: 'Heavy duty towing and recovery from Ross Towing in Southfield: a 50 ton rotator for semi trucks, fire trucks and buses, winch outs and crane work. 248-356-6011.',
    h1: 'Heavy duty towing, recovery and lifting',
    lede: 'Semi trucks, fire trucks, buses and other big vehicles, vehicles off the road, jobs that need a crane, and machinery that needs moving and rigging.',
    summary: 'the 50 ton rotator, heavy duty and truck towing, winch outs, accident recovery, crane work and rigging',
    cards: [
      ['i-truck', '50 ton rotator', 'Our rotator handles semi trucks, fire trucks, buses and similar heavy vehicles.'],
      ['i-truck', 'Heavy duty and truck towing', 'Trucks and other large vehicles.'],
      ['i-winch', 'Winch outs', 'Pulling vehicles out of ditches, mud and snow.'],
      ['i-crash', 'Accident recovery', 'Getting vehicles off the road after a crash.'],
      ['i-crane', 'Crane and lifting service', 'Crane work for lifting jobs.'],
      ['i-gear', 'Machinery hauling and rigging', 'Machine hauling, off loading, staging and rigging.'],
    ],
    blocks: [
      `<h3>Some of the heavy jobs in our gallery</h3>
        <ul class="svc-list">
          <li>Towing a Southfield ladder truck with our heavy wrecker</li>
          <li>Towing a Farmington Hills Fire Rescue engine with the rotator, and hauling one on our Landoll trailer</li>
          <li>Recovering a semi on the freeway</li>
          <li>Wrecker 79 with a shuttle bus in tow, and towing a burned out box truck</li>
          <li>Lifting a storage container and a tank with the rotator</li>
        </ul>`,
    ],
    notes: ['Back at the yard, our heated 2,800 sq ft shop has two vehicle hoists, 15 ft ceilings and two 13 ft overhead doors, big enough for semi trucks.'],
    links: [['spill-response', 'Fuel or oil on the road? Spill response'], ['freight', 'Moving machinery? Freight hauling'], ['gallery', 'See more recovery work in the gallery']],
    photo: 'towing/rotator-boom-up.jpg', cta: null, hours24: true,
  },
  {
    slug: 'spill-response', anchor: 'spill', name: 'Environmental spill response',
    title: 'Hazardous Spill Cleanup Anywhere in Michigan | Ross Towing',
    description: 'Licensed hazardous spill cleanup from Ross Towing, permitted anywhere in Michigan. Diesel fuel and oil containment, HAZWOPER 40 staff, MDOT certified. 248-356-6011.',
    h1: 'Environmental spill response anywhere in Michigan',
    lede: 'Ross Towing is a licensed and permitted hazardous spill and material cleanup company, and one of only two licensed towing companies permitted to respond anywhere in Michigan. We specialize in diesel fuel and petroleum based oil containment and cleanup.',
    summary: 'licensed hazardous spill cleanup anywhere in Michigan, the spill equipment and EV fire storage',
    cards: [
      ['i-trailer', 'Three spill trailers', 'Equipped with diesel pump off stations, pump sprayers, absorbents, booms and pools.'],
      ['i-spray', 'Roadway degreaser', 'A biohazard friendly degreaser that removes hydrocarbons from petroleum and oil spills through a chemical reaction, leaving only H2O and CO2, which is safe for storm water runoff.'],
      ['i-sweep', 'Sweepers', 'Two skid steers with power sweeper attachments, plus a self contained 10 yard street sweeper.'],
      ['i-dump', 'Debris hauling', 'A tri-axle dump trailer for hauling debris from scenes.'],
      ['i-flame', 'Electric vehicle fires', 'Two EV fire blankets to help fire departments and protect our drivers and staff if a vehicle reignites during transport or storage.'],
      ['i-wall', 'EV storage area', 'An enclosed space with a three sided brick wall that protects other vehicles in the yard if an EV reignites.'],
    ],
    blocks: [
      `<p class="license"><small>License</small><strong># ${esc(BUSINESS.credentials['Spill response license'])}</strong></p>
        <ul class="facts">
          <li><svg class="ico" aria-hidden="true"><use href="#i-hardhat"/></svg>HAZWOPER 40 certified technicians on staff</li>
          <li><svg class="ico" aria-hidden="true"><use href="#i-radio"/></svg>An incident commander available for 24 hour response</li>
          <li><svg class="ico" aria-hidden="true"><use href="#i-shield"/></svg>MDOT certified</li>
        </ul>`,
    ],
    links: [['heavy-duty', 'Vehicle off the road too? Accident recovery']],
    photo: 'towing/street-sweeper.jpg', cta: null, area: ['Michigan'], hours24: true,
  },
  {
    slug: 'freight', anchor: 'freight', name: 'Freight hauling',
    title: 'Flatbed and Machinery Freight Hauling, MI, OH, IN | Ross Towing',
    description: 'Ross Towing is a licensed for-hire freight carrier hauling machinery, equipment and materials across Michigan, Ohio and Indiana. USDOT 1196761. Call 248-356-6011.',
    h1: 'Freight hauling in Michigan, Ohio and Indiana',
    lede: 'Ross is a for-hire trucking company too, hauling machinery, equipment and materials across Michigan, Ohio and Indiana, on flatbed, Conestoga, step deck, Landoll and lowboy trailers.',
    summary: 'licensed for-hire freight in Michigan, Ohio and Indiana, trailers, credentials and quotes',
    cards: [
      ['i-gear', 'Large machinery and equipment', 'We work with companies like MacAllister CAT.'],
      ['i-layers', 'Metal sheet', 'Sheet, coil and other metal loads.'],
      ['i-bricks', 'Building materials', 'Lumber and other building materials.'],
      ['i-car', 'Motor vehicles', 'Cars, trucks and other vehicles.'],
      ['i-box', 'General freight', 'Crated and tarped loads.'],
    ],
    blocks: [
      `<div class="equip">
        <h3>Trailers</h3>
        <table>
          <thead><tr><th scope="col">Trailer</th><th scope="col">Length</th><th scope="col" class="num-col">Scale</th></tr></thead>
          <tbody>
            <tr><th scope="row">Flatbed</th><td>48 ft</td><td class="num-col">48,000 lbs</td></tr>
            <tr><th scope="row">Flatbed</th><td>53 ft</td><td class="num-col">48,000 lbs</td></tr>
            <tr><th scope="row">Conestoga</th><td>48 ft</td><td class="num-col">46,500 lbs</td></tr>
            <tr><th scope="row">Conestoga</th><td>53 ft</td><td class="num-col">46,500 lbs</td></tr>
            <tr><th scope="row">Step deck</th><td>53 ft</td><td class="num-col">48,000 lbs</td></tr>
            <tr><th scope="row">Landoll</th><td>53 ft</td><td class="num-col">40,000 lbs</td></tr>
            <tr><th scope="row">Quad axle lowboy</th><td>53 ft</td><td class="num-col">100,000 lbs</td></tr>
          </tbody>
        </table>
        </div>
        <p class="city-note">Authorized for hire, interstate, active: USDOT ${esc(BUSINESS.credentials.USDOT)} · MC ${esc(BUSINESS.credentials.MC)} · KY License #${esc(BUSINESS.credentials['KY License'])}.</p>`,
      '<!-- @section online freight -->',
    ],
    links: [['quote', 'Send the load details on our freight quote form'], ['gallery-freight', 'See more freight loads in the gallery'], ['heavy-duty', 'Need it lifted or rigged? Crane and rigging']],
    photo: 'freight/freight-rig-sunset.jpg', cta: null, area: ['Michigan', 'Ohio', 'Indiana'],
  },
  {
    slug: 'impound-release', anchor: 'release', name: 'Impound and vehicle release',
    title: 'Impound Vehicle Release and Storage in Southfield | Ross Towing',
    description: 'Getting your vehicle back from Ross Towing at 21360 Telegraph Rd, Southfield: what to bring, release hours and cash only payment. Call ahead at 248-356-6011.',
    h1: 'Getting your vehicle back',
    lede: 'If your vehicle was towed to our yard in Southfield, here\'s what you need. Call ahead to make sure your vehicle is ready.',
    summary: 'what to bring, release hours, cash only payment, storage and public auctions',
    cards: [
      ['i-doc', 'What to bring', 'The registered owner must present ID plus proof of ownership: registration, insurance, or title.'],
      ['i-pin', 'Where', `${esc(address())} · <a href="${esc(BUSINESS.mapUrl)}" target="_blank" rel="noopener" data-track="preview_directions" data-track-detail="service release">Directions</a>`],
      ['i-clock', 'Release hours', `During office hours: ${esc(BUSINESS.officeHours)}.`],
      ['i-cash', 'Payment', 'Cash only. Payment at release must be in cash.'],
    ],
    blocks: [
      `<h3>Where your vehicle is kept</h3>
        <ul class="svc-list">
          <li>Over six acres of storage, graded with crushed asphalt and lit by stadium style LED lights on 30 ft poles</li>
          <li>36 motion activated color cameras with infrared night vision, inside and out, on two digital surveillance systems</li>
          <li>A 7 ft decorative block wall and an electronic security gate at the main entrance</li>
          <li>Indoor storage for up to 8 impounded or evidence vehicles in the shop, plus a 40 ft locking container for long term storage and preservation of evidence</li>
        </ul>
        <h3>Public auctions about every two months</h3>
        <p class="city-note">Open to the public. Parking for over 100 customers across from our lobby, with ADA spots right by the front door. <!-- @auction-note --></p>`,
    ],
    notes: ['We tow and impound for the Michigan State Police and the Farmington Hills Police Department, and the yard is staffed 24 hours a day, 365 days a year for towing and impound services.'],
    links: [['faq', 'Someone else picking up, belongings and other questions'], ['private-property-impounds', 'Property owners: private property impounds']],
    photo: 'towing/IMG_6288.jpeg', cta: null,
  },
  {
    slug: 'private-property-impounds', anchor: 'ppi', name: 'Private property impounds',
    title: 'Private Property Impound Towing in Southfield, MI | Ross Towing',
    description: 'Private property impounds from Ross Towing: we post a sign and remove unauthorized vehicles 24 hours a day, at the vehicle owner\'s expense. Call 248-356-6011.',
    h1: 'Private property impounds (PPI)',
    lede: 'Unauthorized or abandoned vehicles on your property? We post a Ross Towing sign and remove unauthorized vehicles at the vehicle owner\'s expense, 24 hours a day.',
    summary: 'how property owners get a Ross Towing sign and have unauthorized vehicles removed',
    blocks: [
      `<p class="law">Under Michigan Law (<a href="https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-257-252a" target="_blank" rel="noopener">MCL 257.252a<span class="sr"> (Michigan Legislature, opens in a new tab)</span></a>), an abandoned vehicle is any motor vehicle left on public or private property without the consent of the owner.</p>
        <h3>Want a Ross Towing sign on your property?</h3>
        <ol class="steps">
          <li>Download and print the property owner authorization form.</li>
          <li>Fill it out and sign it.</li>
          <li>Email it to <a href="mailto:${esc(BUSINESS.email)}">${esc(BUSINESS.email)}</a>.</li>
        </ol>
        <p class="dl-row"><a class="btn btn-line" href="{{BASE}}forms/ross-towing-ppi-authorization-form.pdf" download><svg class="ico" aria-hidden="true"><use href="#i-download"/></svg>Download the authorization form <span class="ftype">(PDF)</span></a></p>`,
    ],
    links: [['impound-release', 'Looking for a vehicle we towed? Getting your vehicle back'], ['faq', 'Questions and answers']],
    photo: null, cta: null, hours24: true,
  },
];

export const servicePath = (s) => `services/${s.slug}/`;
const pageOf = (slug) => SERVICE_PAGES.find((s) => s.slug === slug);

// Where a "links" key goes: another service page, or a fixed place on the site.
function linkHref(key, base) {
  const p = pageOf(key);
  if (p) return base + servicePath(p);
  return { faq: `${base}faq/`, gallery: `${base}gallery/#towing`, 'gallery-freight': `${base}gallery/#freight`, quote: `${base}#freight-quote` }[key];
}

const state = (name) => ({ '@type': 'State', name });

// JSON-LD nodes added to the business @graph on a service page: the service and the breadcrumb.
// schema.org has no TowingService type, so each is a Service with its own serviceType.
export function serviceSchema(url, slug) {
  const s = pageOf(slug), page = url + servicePath(s), group = SERVICES.find((g) => g.anchor === s.anchor);
  const node = {
    '@type': 'Service', '@id': `${page}#service`, name: s.name, serviceType: s.name, description: s.description,
    url: page, provider: { '@id': `${url}#business` },
    areaServed: s.area ? s.area.map(state) : BUSINESS.cities.map((c) => ({ '@type': 'City', name: `${c}, MI` })),
  };
  if (group) node.hasOfferCatalog = { '@type': 'OfferCatalog', name: s.name, itemListElement: group.items.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })) };
  if (s.hours24) node.hoursAvailable = 'Mo-Su 00:00-23:59';
  return [
    node,
    {
      '@type': 'BreadcrumbList', '@id': `${page}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: url },
        { '@type': 'ListItem', position: 2, name: s.name, item: page },
      ],
    },
  ];
}

// The page body (inside <main>). base is the site's base path, gallery the photo data.
export function renderService(slug, { base = '/', gallery = [] } = {}) {
  const s = pageOf(slug);
  if (!s) return '';
  const photo = s.photo && gallery.find((p) => p.key === s.photo);
  const others = SERVICE_PAGES.filter((o) => o.slug !== s.slug);
  const area = s.area
    ? `<p class="city-note">${esc(s.name)} covers ${esc(s.area.length > 1 ? `${s.area.slice(0, -1).join(', ')} and ${s.area.at(-1)}` : `anywhere in ${s.area[0]}`)}, from our yard in Southfield. Our towing pages by city:</p>`
    : `<p class="city-note">We're based in Southfield and tow across Metro Detroit, including:</p>`;
  return `
  <section class="page-sec tone-night city-head" aria-labelledby="svc-h">
    <div class="page-wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${base}">Home</a></li><li><span aria-current="page">${esc(s.name)}</span></li></ol></nav>
      <p class="eyebrow">Services</p>
      <h1 id="svc-h">${esc(s.h1)}</h1>
      <p class="lede">${esc(s.lede)}</p>
      <div class="inline-call">
        ${CALL(`service ${s.slug}`)}
        ${s.cta === 'tow' ? '<!-- @section online tow -->' : ''}
      </div>
    </div>
  </section>
  <section class="page-sec tone-day2 city-body" aria-labelledby="svc-what-h">
    <div class="page-wrap city-grid">
      <div>
        <h2 id="svc-what-h">What's included</h2>
        ${s.cards ? `<div class="cards">
          ${s.cards.map(card).join('\n          ')}
        </div>` : ''}
        ${(s.blocks || []).join('\n        ')}
        ${(s.notes || []).map((n) => `<p class="city-note">${esc(n)}</p>`).join('\n        ')}
        <p class="city-note svc-links">${s.links.map(([k, label]) => `<a href="${linkHref(k, base)}">${esc(label)}</a>`).join(' · ')}</p>
      </div>
      ${photo ? `<figure class="shot city-shot">${picture(photo, { sizes: '(min-width: 900px) 520px, calc(100vw - 32px)' })}<figcaption>${esc(photo.caption || '')}</figcaption></figure>` : ''}
    </div>
  </section>
  <section class="page-sec tone-night city-visit" aria-labelledby="svc-visit-h">
    <div class="page-wrap">
      <h2 id="svc-visit-h">Call or visit</h2>
      ${TEL(`service ${s.slug} bottom`, `<small>Call dispatch 24/7</small><strong data-phone>${BUSINESS.phone}</strong>`, 'big-call')}
      <p class="visit">${esc(address())} · <a href="${esc(BUSINESS.mapUrl)}" target="_blank" rel="noopener" data-track="preview_directions" data-track-detail="service ${s.slug}">Directions</a></p>
      <p class="muted">Office and vehicle release: ${esc(BUSINESS.officeHours)}. Vehicle release is cash only.</p>
      <h3 class="city-others-h">Where we tow</h3>
      ${area}
      <ul class="chips city-others">${CITIES.map((c) => `<li><a href="${base}${cityPath(c)}"><svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg>${esc(c.name)}</a></li>`).join('')}</ul>
      <h3 class="city-others-h">Other services</h3>
      <ul class="chips city-others">${others.map((o) => `<li><a href="${base}${servicePath(o)}">${esc(o.name)}</a></li>`).join('')}</ul>
    </div>
  </section>`;
}
