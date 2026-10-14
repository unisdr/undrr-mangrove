// Story fixtures for undrr/web-backlog#2728. Titles, summaries, types, terms,
// dates and node ids are real PreventionWeb collections; the body copy is
// lightly edited to the editorial manual.

const PW = 'https://www.preventionweb.net';
const term = tid => `${PW}/taxonomy/term/${tid}`;

export const COLLECTIONS_URL = `${PW}/collections`;

export const collections = {
  // A typical collection: description at about the average length.
  wildfire: {
    nid: 101264,
    type: 'Topic guide',
    title: 'Wildfire risk assessment',
    summary:
      'Discover research, assessments and technical resources on future wildfire trends, the science behind wildfire-related compound events, and attribution studies examining the influence of climate change on wildfire occurrence and severity.',
    updated: { iso: '2026-07-10', label: '10 July 2026' },
    image: {
      src: `${PW}/sites/default/files/2026-03/Shutterstock_1974441557.jpg`,
      alt: 'Aerial view of smoke rising from a fire line in a pine forest',
    },
    hazards: [{ tid: 357, name: 'Wildfire and Bushfire' }],
    themes: [
      { tid: 311, name: 'Climate change' },
      { tid: 1176, name: 'Disaster losses' },
      { tid: 333, name: 'Risk identification and assessment' },
    ],
    countries: [],
    body: [
      'Understanding wildfire risk begins with understanding how and why wildfire hazards are changing.',
      'This collection brings together research, assessments and technical resources on future wildfire trends, the science behind wildfire-related compound events, and attribution studies examining the influence of climate change on wildfire occurrence and severity. Whether you are a policymaker, researcher or practitioner, these resources offer the latest insights to help anticipate emerging risks and strengthen resilience to a changing wildfire landscape.',
      'Wildfire risk can have several cascading impacts, from smoke that harms health far from the fire front to damage to power, water and transport systems.',
      {
        before: 'Read more about the ',
        link: {
          href: 'https://www.undrr.org/news/invisible-costs-wildfire-disasters-2025',
          text: 'invisible costs of wildfires',
        },
        after: '.',
      },
    ],
  },

  // A short description: ShowMore stays out of the way.
  jasper: {
    nid: 101346,
    type: 'Disaster learnings',
    title: 'Canada: Jasper fires 2024',
    summary:
      'This collection brings together key articles examining the 2024 wildfire season in Canada, a year marked by widespread fires, significant environmental impacts and growing concern over the country’s evolving fire regime.',
    updated: { iso: '2026-04-24', label: '24 April 2026' },
    image: {
      src: `${PW}/sites/default/files/2025-11/Wild-fire-compund-event-with-heatwaves.jpg`,
      alt: 'A helicopter carries a water bucket over a forest under an orange, smoke-filled sky',
    },
    hazards: [{ tid: 357, name: 'Wildfire and Bushfire' }],
    themes: [
      { tid: 315, name: 'Preparedness' },
      { tid: 333, name: 'Risk identification and assessment' },
    ],
    countries: [{ tid: 110, name: 'Canada' }],
    body: [
      'Across these articles, a consistent picture emerges: wildfires are no longer isolated seasonal events but part of a longer-term shift driven by climate change, drought and changing land conditions. The season saw large-scale evacuations, major incidents such as the Jasper wildfire, and smoke that reached across North America and into Europe.',
    ],
  },

  // A long description, near the longest on PreventionWeb.
  japan: {
    nid: 68594,
    type: 'Disaster learnings',
    title: 'Recovery collection: Great East Japan Earthquake and Tsunami 2011',
    summary:
      'The Great East Japan Earthquake and Tsunami caused extensive damage, including the nuclear meltdown at the Fukushima Daiichi Nuclear Power Plant.',
    updated: { iso: '2025-02-12', label: '12 February 2025' },
    image: {
      src: `${PW}/sites/default/files/Japan-earthquake-2011-min.jpg`,
      alt: 'A fishing boat stranded on a street among debris after the 2011 tsunami',
    },
    hazards: [
      { tid: 345, name: 'Earthquake' },
      { tid: 355, name: 'Tsunami' },
      { tid: 351, name: 'NBC - Nuclear, Biological, Chemical' },
    ],
    themes: [
      { tid: 332, name: 'Recovery' },
      { tid: 891, name: 'Shelter and housing' },
    ],
    countries: [{ tid: 172, name: 'Japan' }],
    body: [
      'At 2.46 p.m. on Friday 11 March 2011, a magnitude 9.0 earthquake struck off the north-east coast of Japan. It is the largest earthquake ever recorded in Japan and the fourth largest recorded in the world. The earthquake caused a massive tsunami that devastated communities along the Tohoku coastline, across many municipalities and several prefectures. The nuclear meltdown at the Fukushima Daiichi Nuclear Power Plant was rated level 7, the highest on the International Atomic Energy Agency’s International Nuclear and Radiological Event Scale, making the earthquake, tsunami and nuclear disaster a complex mega-disaster with equally large and complicated challenges for recovery.',
      'The damage was widespread and devastating. As of June 2021, the official death toll included 19,747 people who lost their lives, and 2,556 people whose remains were never found are listed as missing. This includes 3,774 people whose later deaths have been officially recognized as indirect deaths, caused by complications and other impacts of what they experienced during and after the disaster. In the first few days, more than 470,000 people evacuated from their homes, and in the following weeks more than 350,000 continued living in long-term evacuation.',
      'The tsunami-affected areas of Tohoku include the jagged rias coastline of Sanriku to the north, dotted with fishing communities where steep mountains meet the sea. Sanriku’s coastal communities experienced large tsunamis every 30–40 years in the last century, including the 1896 Meiji Sanriku tsunami, the 1933 Showa Sanriku tsunami and the tsunami that followed the 1960 Chile earthquake. Recovery after these tsunamis included rebuilding with partial or complete relocation away from the ocean, but over generations people moved back into many of these areas. Large tsunamis have been less frequent in the flat Sendai Plain further south, but there are records there of the 1611 Keicho tsunami, and experts consider the 2011 tsunami similar to the Jogan tsunami of 869.',
      'Facing devastation that exceeded expert predictions, recovery policy was shaped by the idea of reconstruction to reduce future tsunami risk, especially by relocating residential areas to higher ground or further inland. The Government created a national Reconstruction Agency and a menu of fully funded projects that municipalities could include in reconstruction plans. Recovery also brought new support for the private sector, such as temporary shopping arcades and subsidies for projects supporting groups of local businesses. In an area with many older residents, there were efforts to learn from previous disasters and provide support for older people, children and women, and psychosocial support in general. Even so, with the scale of the disaster, the affected area and the number of survivors, problems already known from previous disasters, such as the loss of community and isolation, were experienced again.',
      'Recovery after the nuclear disaster brings new challenges with no easy answers, including long-term displacement, uncertain futures and the loss of hometowns.',
      'Japanese policies for post-disaster housing support have three clearly defined phases, each with its own systems and responsibilities for funding and management. In the initial emergency phase, people stay in evacuation centres, often set up in school gymnasiums or other large government facilities. Emergency temporary housing is provided by the prefectural government. Since the 1995 Great Hanshin-Awaji Earthquake in Kobe, all 47 of Japan’s prefectures have held contracts with the prefabricated builders’ association so that member companies can quickly supply prefabricated temporary housing after a large disaster. After 2011, more than 50,000 prefabricated temporary housing units were built for evacuees. Many wooden temporary homes were also built, especially by local contractors in Fukushima, which promoted local timber and gave evacuees more pleasant places to live. In addition, designated temporary housing, in which the Government pays the rent of a private apartment, was used at scale for the first time in Japan, for more than 70,000 households.',
      'Policies supporting permanent housing recovery were similar to earlier housing recovery projects in Japan, including disaster recovery public housing (government-subsidized rental housing) for survivors and new residential lots provided for recovery.',
    ],
  },

  // A collection with nothing tagged to it yet.
  empty: {
    nid: 0,
    type: 'Community collection',
    title: 'Anticipatory action for heatwaves',
    summary:
      'Resources on acting ahead of forecast heatwaves, from early warning triggers to pre-arranged financing and cooling centres.',
    updated: { iso: '2026-10-08', label: '8 October 2026' },
    image: {
      src: `${PW}/sites/default/files/2025-11/Wild-fire-compund-event-with-heatwaves.jpg`,
      alt: 'A helicopter carries a water bucket over a forest under an orange, smoke-filled sky',
    },
    hazards: [{ tid: 348, name: 'Heatwave and Extreme Heat' }],
    themes: [{ tid: 315, name: 'Preparedness' }],
    countries: [],
    body: [
      'This collection will gather guidance, case studies and research on anticipatory action for heatwaves: the forecasts and thresholds that trigger it, the financing arranged in advance, and the actions that protect people most at risk before temperatures peak.',
    ],
  },
};

/** Tags for the header, in the order PreventionWeb lists them. */
export const tagsFor = collection =>
  [...collection.hazards, ...collection.countries, ...collection.themes].map(
    t => ({ label: t.name, href: term(t.tid) })
  );

/**
 * The query_string filters that scope each search. The same strings drive
 * the widget and the header count, so the two numbers always agree.
 */
export const itemFilters = (collection, langcode = 'en') => [
  `field_collections:${collection.nid}`,
  `_language:${langcode}`,
];

export const relatedFilters = (collection, langcode = 'en') => {
  const ids = list => list.map(t => t.tid).join(' OR ');
  const shared = [
    collection.hazards.length && `field_hazard:(${ids(collection.hazards)})`,
    collection.themes.length && `field_theme:(${ids(collection.themes)})`,
  ].filter(Boolean);
  return [
    'type:collections',
    shared.join(' OR '),
    `NOT nid:${collection.nid}`,
    `_language:${langcode}`,
  ].filter(Boolean);
};
