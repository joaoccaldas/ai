export const ROOM_SPAN = 30;

const unsplash = (id, position = 'center') => ({
  src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=82`,
  position
});

export const rooms = [
  {
    slug: 'innergroup', name: 'Inner Group', type: 'Workshop companion', url: 'innergroup/',
    image: 'gallery/innergroup.jpg', fallbackImage: 'https://images.squarespace-cdn.com/content/v1/698d8fb87124477561fe636f/a4faf26a-68a6-435b-bfd7-91f1ec3836dd/Oct%2B01%2B2025%2B-_1452.jpg?format=1500w',
    line: 'Unity in diversity. Strength in connection.',
    description: 'A circular, biophilic forum shaped by the workshop idea: people gather around a living centre while the architecture opens upward to light.',
    palette: ['#071614','#1d4d45','#9bdfca','#e9eee7'], wall: '#263a35', floor: '#101a18', ceiling: '#172622', accent: '#9bdfca', fog: '#091310',
    centerpiece: 'forum', transition: 'canopy',
    studies: [
      {title:'Living Forum',note:'Circular seating, daylight and a shared centre.',...unsplash('photo-1521737711867-e3b97375f902','center')},
      {title:'Forest Assembly',note:'A softer, nature-led workshop world.',...unsplash('photo-1441974231531-c6227db76b6e','center')},
      {title:'Quiet Observatory',note:'Minimal stone, reflection and psychological space.',...unsplash('photo-1497366811353-6870744d04b2','center')}
    ]
  },
  {
    slug: 'aurelia', name: 'Aurelia', type: 'Fine jewellery atelier', url: 'jewelry/', image: 'gallery/jewelry.jpg',
    line: 'Light, cut by hand and made to keep.',
    description: 'A dark onyx vault where a faceted golden object catches narrow beams of light. The room behaves like a private viewing rather than a shop.',
    palette: ['#070605','#23170c','#e7c15c','#fff0c8'], wall: '#17130f', floor: '#080706', ceiling: '#0d0b09', accent: '#e7c15c', fog: '#080604',
    centerpiece: 'gem', transition: 'iris',
    studies: [
      {title:'The Vault',note:'Black stone, precision light and silence.',...unsplash('photo-1515562141207-7a88fb7ce338','center')},
      {title:'Champagne Light',note:'A luminous editorial atelier.',...unsplash('photo-1617038260897-41a1f14a8ca0','center')},
      {title:'Mineral Garden',note:'Jewellery displayed as geological discovery.',...unsplash('photo-1535632066927-ab7c9ab60908','center')}
    ]
  },
  {
    slug: 'maison-lumen', name: 'Maison Lumen', type: 'Nordic fine dining', url: 'restaurant/', image: 'gallery/restaurant.jpg',
    line: 'The last light of the day, served by candle.',
    description: 'Warm limestone, a long ceremonial table and a low horizon of candlelight turn the restaurant concept into a room with appetite and intimacy.',
    palette: ['#0c0906','#4a2b12','#d8a24e','#f5e4c8'], wall: '#342419', floor: '#150e09', ceiling: '#1d130d', accent: '#d8a24e', fog: '#100b07',
    centerpiece: 'table', transition: 'ember',
    studies: [
      {title:'The Hearth',note:'Fire, craft and the theatre of the open kitchen.',...unsplash('photo-1517248135467-4c7edcad34c5','center')},
      {title:'Midnight Supper',note:'A darker, fashion-editorial dining room.',...unsplash('photo-1552566626-52f8b828add9','center')},
      {title:'Nordic Daylight',note:'Pale timber and seasonal clarity.',...unsplash('photo-1555396273-367ea4eb4db5','center')}
    ]
  },
  {
    slug: 'pulse', name: 'PULSE', type: 'Strength studio', url: 'gym/', image: 'gallery/gym.jpg',
    line: 'Show up. Get strong. Move through it.',
    description: 'An industrial performance tunnel driven by lime light bars, compressed perspective and a kinetic central form that responds to movement.',
    palette: ['#050607','#111710','#c6ff2e','#f1f5ed'], wall: '#171a18', floor: '#080a0b', ceiling: '#0b0d0e', accent: '#c6ff2e', fog: '#050706',
    centerpiece: 'pulse', transition: 'shutter',
    studies: [
      {title:'Performance Tunnel',note:'Compressed, electric and directional.',...unsplash('photo-1534438327276-14e5300c3a48','center')},
      {title:'Raw Concrete',note:'Coaching credibility over fitness gloss.',...unsplash('photo-1581009146145-b5ef050c2e1e','center')},
      {title:'Athletic Laboratory',note:'Metrics, light and controlled intensity.',...unsplash('photo-1571019613454-1cb2f99b2d8b','center')}
    ]
  },
  {
    slug: 'vinora', name: 'Vinöra', type: 'Natural wine bar', url: 'wine/', image: 'gallery/wine.jpg',
    line: 'Living wines, poured by candlelight.',
    description: 'A burgundy cellar of translucent glass, liquid reflections and a suspended tasting flight. The room feels alive, imperfect and slightly untamed.',
    palette: ['#100207','#4c0714','#e8607a','#f6d9d4'], wall: '#2f1018', floor: '#120307', ceiling: '#1d070d', accent: '#e8607a', fog: '#100207',
    centerpiece: 'wine', transition: 'liquid',
    studies: [
      {title:'Living Cellar',note:'Wine-red light, glass and organic movement.',...unsplash('photo-1510812431401-41d2bd2722f3','center')},
      {title:'The Grower Table',note:'Earth, bottles and maker-led storytelling.',...unsplash('photo-1473973266408-ed4e27abdd47','center')},
      {title:'Neon Ferment',note:'A younger, nocturnal natural-wine identity.',...unsplash('photo-1569529465841-dfecdab7503b','center')}
    ]
  },
  {
    slug: 'wild-stem', name: 'Wild Stem', type: 'Botanical studio', url: 'florist/', image: 'gallery/florist.jpg',
    line: 'Flowers with a heartbeat.',
    description: 'A conservatory room where the walls recede behind foliage, petals drift through the light and a sculptural bloom grows from the floor.',
    palette: ['#080506','#251017','#e8496b','#f6d8df'], wall: '#263126', floor: '#0c100c', ceiling: '#152018', accent: '#e8496b', fog: '#09100b',
    centerpiece: 'bloom', transition: 'petals',
    studies: [
      {title:'Night Conservatory',note:'Botanical abundance in gallery darkness.',...unsplash('photo-1490750967868-88aa4486c946','center')},
      {title:'Wild Meadow',note:'Airy, seasonal and editorial.',...unsplash('photo-1497250681960-ef046c08a56e','center')},
      {title:'Single Stem',note:'Radical minimalism around one living object.',...unsplash('photo-1494336934272-fef0027251d8','center')}
    ]
  },
  {
    slug: 'eden', name: 'Éden', type: 'Hair & beauty atelier', url: 'salon/', image: 'gallery/salon.jpg',
    line: 'Beauty, unhurried.',
    description: 'A soft limestone salon composed of mirrors, blush light and curved thresholds. The spatial rhythm slows the visitor down before revealing the work.',
    palette: ['#120d0c','#5b3538','#e6a58f','#f8ebe5'], wall: '#d2b6aa', floor: '#4c3330', ceiling: '#9a7770', accent: '#e6a58f', fog: '#2a1918',
    centerpiece: 'mirror', transition: 'silk',
    studies: [
      {title:'Blush Monolith',note:'Sculptural calm and luminous skin tones.',...unsplash('photo-1560066984-138dadb4c035','center')},
      {title:'Mirror Garden',note:'Reflection, repetition and transformation.',...unsplash('photo-1521590832167-7bcbfaa6381f','center')},
      {title:'Quiet Ritual',note:'Warm minimalism with tactile care.',...unsplash('photo-1562322140-8baeececf3df','center')}
    ]
  },
  {
    slug: 'dunhaven', name: 'Dunhaven', type: 'Coastal retreat', url: 'hotel/', image: 'gallery/hotel.jpg',
    line: 'Where granite meets the sea.',
    description: 'A cool coastal hall cut from granite, crossed by a shallow reflective pool and framed by the pale horizon of the Bohuslän archipelago.',
    palette: ['#051216','#12363a','#c9a76a','#e5f0ef'], wall: '#34484a', floor: '#09191d', ceiling: '#17292c', accent: '#c9a76a', fog: '#071519',
    centerpiece: 'tide', transition: 'mist',
    studies: [
      {title:'Cliff House',note:'Granite, weather and a long horizon.',...unsplash('photo-1566073771259-6a8506099945','center')},
      {title:'Sea Bath',note:'Water becomes the primary interface.',...unsplash('photo-1507525428034-b723cf961d3e','center')},
      {title:'Winter Haven',note:'Shelter, fire and Nordic restraint.',...unsplash('photo-1542314831-068cd1dbfeeb','center')}
    ]
  },
  {
    slug: 'ember-oak', name: 'Ember & Oak', type: 'Coffee roastery', url: 'cafe/', image: 'gallery/cafe.jpg',
    line: 'Roasted slow. Poured with care.',
    description: 'A timber roasting chamber of copper, steam and warm haze. Circular forms echo the cup, the roaster drum and the ritual of a slow pour.',
    palette: ['#100905','#4b2510','#e07a3c','#f2ddc9'], wall: '#4b3425', floor: '#160d08', ceiling: '#2a190f', accent: '#e07a3c', fog: '#120b07',
    centerpiece: 'coffee', transition: 'steam',
    studies: [
      {title:'Roasting Chamber',note:'Copper, heat and visible craft.',...unsplash('photo-1495474472287-4d71bcdd2085','center')},
      {title:'Slow Bar',note:'A focused stage for the pour.',...unsplash('photo-1445116572660-236099ec97a0','center')},
      {title:'Morning Workshop',note:'Daylight, community and product ritual.',...unsplash('photo-1501339847302-ac426a4a7cbb','center')}
    ]
  },
  {
    slug: 'belong', name: 'Belong Festival', type: 'Flagship experience', url: '../belong/', image: 'gallery/belong.jpg',
    line: 'Imagine freely. Be yourself. Belong.',
    description: 'The finale dissolves the conventional gallery into a prismatic chamber: a floating sphere, spectral light and a horizon that feels larger than the building.',
    palette: ['#08070e','#322356','#ff5ab6','#70e1ff'], wall: '#1b1730', floor: '#090812', ceiling: '#100e20', accent: '#ff76bf', fog: '#090714',
    centerpiece: 'belong', transition: 'spectrum',
    studies: [
      {title:'Prismatic Assembly',note:'Colour, energy and shared imagination.',...unsplash('photo-1501386761578-eac5c94b800a','center')},
      {title:'Infinite Playground',note:'Curiosity expressed as open space.',...unsplash('photo-1470229722913-7c0e2dbbafd3','center')},
      {title:'Human Constellation',note:'Belonging visualised as connected light.',...unsplash('photo-1521337581100-8ca9a73a5f79','center')}
    ]
  }
];
