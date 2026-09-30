/* Caldas Studio — the works shown in the Museum.
   wing: atrium | luxury | table | body | culture | nature — the room each sculpture stands in.
   piece: the sculpture that represents the work. A new work needs a sculpture and a slot in
   museum/blender/museum.py (EXHIBITS + museum_sculpt.py), then a re-bake. */
window.STUDIO_WINGS = {
  atrium: { title: 'The Atrium', line: 'Where every visit begins.' },
  luxury: { title: 'Light & Luxury', line: 'Jewellery, diamonds and skin, held in light.' },
  table: { title: 'Table & Cellar', line: 'Dining, wine and coffee, served slowly.' },
  body: { title: 'Body & Mind', line: 'Beauty, strength and the work of leading yourself.' },
  culture: { title: 'Culture & Code', line: 'Architecture, software, streetwear and a festival.' },
  nature: { title: 'Nature & Journeys', line: 'Film, travel, the coast and wild flowers.' },
};
window.STUDIO_ROOMS = [
  {slug:'sokai', wing:'atrium', piece:'A katana you can draw, dismantle and forge', n:'SŌKAI', room:'Interactive object · Infinite edition', tag:'Every life remembers the blade.', url:'sokai/', img:'gallery/sokai.jpg', accent:'#7fe8ff', note:'A katana modeled in Blender, lit in Cycles, alive in the browser.', extra:{label:'The making-of', url:'sokai/making/'}},
  {slug:'laurie-hedges', wing:'nature', piece:'A cinema camera on a wooden tripod', n:'Laurie Hedges',room:'Conservation filmmaker', tag:'Inspired by, and for, nature.', url:'../laurie/', img:'gallery/laurie.jpg', accent:'#7fb98a', note:'A film-maker’s eye, framed by the wild it protects.'},
  {slug:'inner-group', wing:'body', piece:'An orbit: many paths around one centre', n:'Inner Group', room:'Workshop companion', tag:'Unity in diversity.',       url:'innergroup/', img:'gallery/innergroup.jpg', accent:'#7fd4c1', note:'A calm companion for the work of leading yourself.'},
  {slug:'aurelia', wing:'luxury', piece:'A monumental gold ring set with an emerald', n:'Aurelia',     room:'Fine jewellery',     tag:'Light, made to keep.',       url:'jewelry/',    img:'gallery/jewelry.jpg', accent:'#e7c15c', note:'Light, cut by hand and made to keep.'},
  {slug:'eclat', wing:'luxury', piece:'A brilliant-cut diamond, floating in its own beam', n:'Éclat',       room:'Diamond maison',     tag:'One perfect light.',         url:'eclat/',      img:'gallery/eclat.jpg', accent:'#bfe0ff', note:'One perfect stone, held in a single beam.'},
  {slug:'maison-lumen', wing:'table', piece:'A silver candelabra, its candles lit', n:'Maison Lumen',room:'Fine dining',        tag:'Light. Atmosphere.',         url:'restaurant/', img:'gallery/restaurant.jpg', accent:'#d8a24e', note:'The last light of the day, served by candle.'},
  {slug:'pulse', wing:'body', piece:'A kettlebell ringed in lime light', n:'PULSE',       room:'Strength studio',    tag:'Energy in motion.',          url:'gym/',        img:'gallery/gym.jpg', accent:'#c6ff2e', note:'Show up. Get strong. Move through it.'},
  {slug:'vin-ra', wing:'table', piece:'An oversized glass of red beside its bottle', n:'Vinöra',      room:'Natural wine',       tag:'Savour the moment.',         url:'wine/',       img:'gallery/wine.jpg', accent:'#e8607a', note:'Living wines, poured by candlelight.'},
  {slug:'wild-stem', wing:'nature', piece:'A wild bouquet in a hand-thrown vase', n:'Wild Stem',   room:'Florist',            tag:'Rooted in nature.',          url:'florist/',    img:'gallery/florist.jpg', accent:'#e86aa0', note:'Flowers with a heartbeat.'},
  {slug:'den', wing:'body', piece:'An oval brass mirror on an easel', n:'Éden',        room:'Hair & beauty',      tag:'Wellness reimagined.',       url:'salon/',      img:'gallery/salon.jpg', accent:'#e6a58f', note:'Beauty, unhurried.'},
  {slug:'dunhaven', wing:'nature', piece:'A lighthouse on granite, its beacon turning', n:'Dunhaven',    room:'Coastal retreat',    tag:'Strength in serenity.',      url:'hotel/',      img:'gallery/hotel.jpg', accent:'#8fc0cf', note:'Where granite meets the sea.'},
  {slug:'ember-oak', wing:'table', piece:'A steaming cup on its saucer, beans scattered', n:'Ember & Oak', room:'Coffee roaster',     tag:'Warmth. Crafted.',           url:'cafe/',       img:'gallery/cafe.jpg', accent:'#e07a3c', note:'Roasted slow. Poured with care.'},
  {slug:'studio-nord', wing:'culture', piece:'A concrete maquette, lit from within', n:'Studio Nord', room:'Architecture',       tag:'Light & mass.',              url:'studionord/', img:'gallery/studionord.jpg', accent:'#a9bcc7', note:'Light and mass, held in balance.'},
  {slug:'volt', wing:'culture', piece:'A neon bolt over a stack of shoe boxes', n:'VOLT',        room:'Streetwear drop',    tag:'Don’t sleep.',          url:'volt/',       img:'gallery/volt.jpg', accent:'#e0ff4d', note:'Don’t sleep on the drop.'},
  {slug:'lume', wing:'luxury', piece:'Frosted serum bottles on river stones', n:'Lumé',        room:'Skincare',           tag:'Skin, at rest.',             url:'lume/',       img:'gallery/lume.jpg', accent:'#bcd8c6', note:'Skin, at rest.'},
  {slug:'flowstate', wing:'culture', piece:'A flowing glass ribbon', n:'Flowstate',   room:'SaaS product',       tag:'Ship calm.',                 url:'flowstate/',  img:'gallery/flowstate.jpg', accent:'#7aa8ff', note:'Ship calm.'},
  {slug:'wander', wing:'nature', piece:'A globe on a brass meridian', n:'Wander',      room:'Adventure travel',   tag:'Where the map ends.',        url:'wander/',     img:'gallery/wander.jpg', accent:'#e0975a', note:'Where the map ends, the story begins.'},
  {slug:'belong', wing:'culture', piece:'A mirror ball turning over the floor', n:'Belong',      room:'Flagship festival',  tag:'Be yourself. Together.',     url:'../belong/',  img:'gallery/belong.jpg', accent:'#ff76bf', note:'Imagine freely. Be yourself. Belong.'},
];
