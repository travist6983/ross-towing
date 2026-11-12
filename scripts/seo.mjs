// Search and AI search data for rosstow.com, built at build time (called from scripts/html.mjs and
// vite.config.js). One source for the business's name, address and phone (NAP), services and service area,
// used by the JSON-LD on every page, robots.txt and llms.txt. Every fact here is already shown on the site;
// add a fact here only after it's on the page too, so search engines and visitors see the same thing.

export const BUSINESS = {
  name: 'Ross Towing',
  legalName: 'Larry Ross Garage, Inc.',
  phone: '248-356-6011',
  phoneE164: '+12483566011',
  email: 'rosstowing1@gmail.com',
  street: '21360 Telegraph Rd',
  city: 'Southfield',
  region: 'MI',
  postal: '48033',
  country: 'US',
  foundingYear: '1962',
  facebook: 'https://facebook.com/accidentrecovery',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=21360+Telegraph+Rd+Southfield+MI+48033',
  // The "Where we tow" chips on the home page, in the same order.
  cities: ['Southfield', 'Detroit', 'Farmington Hills', 'Dearborn', 'Oak Park', 'Lathrup Village', 'Royal Oak'],
  credentials: { USDOT: '1196761', MC: '621070', 'KY License': '673351', 'Spill response license': '98000-105807-24-122024' },
  officeHours: 'Monday to Friday 9am to 5pm, Saturday 9am to 1pm, closed Sunday',
};

export const serviceUrl = (url, s) => (s.page ? url + s.page : `${url}#${s.anchor}`);
export const address = (b = BUSINESS) => `${b.street}, ${b.city}, ${b.region} ${b.postal}`;

// Services as the home page lists them. area: where that service is offered when it isn't the tow area.
// page: the service's own page (scripts/services.mjs), else the home page section is its link.
export const SERVICES = [
  { group: 'Towing', anchor: 'towing', page: 'services/towing/', items: ['Light duty towing', 'Flatbed towing', 'Police towing and impounds', 'Dealership towing'] },
  { group: 'Roadside help', anchor: 'roadside', page: 'services/roadside/', items: ['Lockouts', 'Jump starts', 'Flat tires', 'Fuel delivery', 'Battery service'] },
  { group: 'Heavy duty, recovery and lifting', anchor: 'heavy', page: 'services/heavy-duty/', items: ['50 ton rotator recovery', 'Heavy duty and truck towing', 'Winch outs', 'Accident recovery', 'Crane and lifting service', 'Machinery hauling and rigging'] },
  { group: 'Environmental spill response', anchor: 'spill', page: 'services/spill-response/', area: ['Michigan'], items: ['Hazardous spill cleanup', 'Diesel fuel and oil containment and cleanup', 'Electric vehicle fire storage'] },
  { group: 'Freight hauling', anchor: 'freight', page: 'services/freight/', area: ['Michigan', 'Ohio', 'Indiana'], items: ['Machinery and equipment hauling', 'Flatbed, Conestoga, step deck, Landoll and lowboy trailers'] },
  { group: 'Impound and vehicle release', anchor: 'release', page: 'services/impound-release/', items: ['Vehicle storage', 'Impound vehicle release'] },
  { group: 'Public auctions', anchor: 'auctions', items: ['Public vehicle auctions about every two months'] },
  { group: 'Private property impounds', anchor: 'ppi', page: 'services/private-property-impounds/', items: ['Removal of unauthorized vehicles from private property, 24 hours a day'] },
];

const DESCRIPTION = 'Family owned towing, recovery and storage in Southfield, Michigan since 1962. Staffed 24 hours a day, 365 days a year. 50 ton rotator for semi trucks, fire trucks and buses, licensed hazardous spill cleanup anywhere in Michigan, impound release, public auctions, private property impounds, and a licensed for-hire freight carrier for Michigan, Ohio and Indiana.';

const state = (name) => ({ '@type': 'State', name });
const city = (name) => ({ '@type': 'City', name: `${name}, MI` });

// The business as JSON-LD. reviews: Review objects for the page that shows them (the home page), else none.
// extra: more nodes for this page's @graph (a city page adds its Service and BreadcrumbList).
export function businessSchema(url, { reviews = [], extra = [] } = {}) {
  const b = BUSINESS;
  const id = `${url}#business`;
  const business = {
    '@type': 'AutomotiveBusiness',
    '@id': id,
    name: b.name,
    legalName: b.legalName,
    description: DESCRIPTION,
    url,
    telephone: '+1-248-356-6011',
    email: b.email,
    image: `${url}img/rotator-night-1206.jpg`,
    logo: `${url}img/logo-360.png`,
    foundingDate: b.foundingYear,
    address: { '@type': 'PostalAddress', streetAddress: b.street, addressLocality: b.city, addressRegion: b.region, postalCode: b.postal, addressCountry: b.country },
    hasMap: b.mapUrl,
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59' }],
    contactPoint: [{ '@type': 'ContactPoint', telephone: '+1-248-356-6011', contactType: 'dispatch', hoursAvailable: 'Mo-Su 00:00-23:59', areaServed: 'US-MI' }],
    sameAs: [b.facebook],
    areaServed: [...b.cities.map(city), state('Michigan')],
    paymentAccepted: 'Cash, Credit Card',
    identifier: Object.entries(b.credentials).map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    knowsAbout: SERVICES.flatMap((s) => s.items),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Towing, recovery, spill response and freight services',
      itemListElement: SERVICES.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.group,
          serviceType: s.items.join(', '),
          url: serviceUrl(url, s),
          provider: { '@id': id },
          areaServed: s.area ? s.area.map(state) : b.cities.map(city),
        },
      })),
    },
  };
  if (reviews.length) business.review = reviews;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      business,
      { '@type': 'WebSite', '@id': `${url}#website`, url, name: b.name, publisher: { '@id': id } },
      ...extra,
    ],
  };
}

// JSON inside <script> can't close the tag early.
export const jsonLd = (obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}\n</script>`;

export function robotsTxt(url) {
  return `# rosstow.com\nUser-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`;
}

// llms.txt (https://llmstxt.org): a plain summary for AI assistants and AI search. Facts from the site only.
export function llmsTxt(url, cityPages = [], servicePages = [], faqs = [], auctionLine = '') {
  const b = BUSINESS;
  const lines = [
    `# ${b.name}`,
    '',
    `> ${b.name} (${b.legalName}) is a family owned towing, recovery and storage company at ${address()}, in business since ${b.foundingYear}. Dispatch is staffed 24 hours a day, 365 days a year at ${b.phone}. It is also a licensed for-hire freight carrier for Michigan, Ohio and Indiana.`,
    '',
    '## Contact',
    `- Phone (24/7 dispatch): ${b.phone}`,
    `- Address: ${address()}`,
    `- Email: ${b.email}`,
    `- Office and vehicle release hours: ${b.officeHours}. Vehicle release is cash only.`,
    '- Towing: 24 hours a day, 7 days a week, 365 days a year.',
    '- Payment: vehicle release is cash only. Cards are accepted for towing and roadside calls, with a 5% credit card fee.',
    ...(auctionLine ? [`- ${auctionLine}`] : []),
    `- Facebook: ${b.facebook}`,
    '',
    '## Services',
    ...SERVICES.map((s) => `- [${s.group}](${serviceUrl(url, s)}): ${s.items.join('; ')}${s.area ? ` (${s.area.join(', ')})` : ''}`),
    '',
    '## Service area',
    `- Towing: ${b.cities.join(', ')} and the rest of Metro Detroit.`,
    '- Environmental spill response: anywhere in Michigan. One of only two licensed towing companies permitted to respond anywhere in Michigan; MDOT certified.',
    '- Freight: Michigan, Ohio and Indiana.',
    '',
    '## Credentials',
    ...Object.entries(b.credentials).map(([k, v]) => `- ${k}: ${v}`),
    '- Police towing for the Michigan State Police and the Farmington Hills Police Department.',
    '- Seven acre facility in Southfield with indoor and secure outdoor vehicle storage.',
    '',
    '## Pages',
    `- [Home](${url}): all services, service area, vehicle release, auctions, private property impounds and contact`,
    `- [Gallery](${url}gallery/): photos of towing jobs and freight loads`,
    `- [Questions and answers](${url}faq/): vehicle release, paying, hours, insurance and what we tow`,
    ...servicePages.map((s) => `- [${s.name}](${url}${s.path}): ${s.summary}`),
    ...cityPages.map((c) => `- [Towing in ${c.name}, MI](${url}${c.path}): distance from the yard, services and contact for ${c.name}`),
    '',
    ...(faqs.length ? ['## Questions and answers', ...faqs.flatMap(([q, a]) => [`- Q: ${q}`, `  A: ${a}`]), ''] : []),
  ];
  return lines.join('\n');
}
