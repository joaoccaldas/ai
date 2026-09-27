export const PARTS = {
  saya: { label: 'Saya', jp: '鞘 · scabbard', sub: 'LACQUERED SCABBARD', dist: .62, text: 'A hollow, curved shell following the blade’s sori. Black urushi, a cobalt tide of light, raden flecks like stars on water and engraved waves at the kojiri. Every finish is yours to change in the Forge.' },
  blade: { label: 'Blade', jp: '刀身 · tōshin', sub: 'ONE CONTINUOUS STEEL OBJECT', dist: .55, text: 'Modeled from real cross-sections: ha, hira-ji, a crisp shinogi ridge, shinogi-ji and a peaked iori-mune, tapering along an 18 mm sori into a kissaki with fukura and yokote. The hamon is drawn as a frosted, hardened zone with a soft nioi boundary.' },
  tsuba: { label: 'Tsuba', jp: '鍔 · guard', sub: 'OPENWORK GUARD', dist: .17, side: [1, .25, .55], text: 'Hammered iron with a proud rim. Its sukashi openings form an infinity — two teardrop voids framed by an inlaid ∞ band — flanked by crescent moons. Real holes, cut with Boolean geometry in Blender.' },
  habaki: { label: 'Habaki', jp: 'はばき · collar', sub: 'BLADE COLLAR', dist: .11, side: [-.5, .3, 1], text: 'The collar that locks the blade into the saya mouth. A raised line and a subtle flare toward the guard catch a single highlight.' },
  seppa_front: { label: 'Seppa', jp: '切羽 · front spacer', sub: 'FRONT SPACER', dist: .1, side: [-.7, .3, 1], text: 'The blade-side spacer, modeled independently of the guard.' },
  seppa_back: { label: 'Seppa', jp: '切羽 · rear spacer', sub: 'REAR SPACER', dist: .1, side: [.7, .3, 1], text: 'The handle-side spacer, pressed between guard and fuchi.' },
  fuchi: { label: 'Fuchi', jp: '縁 · handle collar', sub: 'HANDLE COLLAR', dist: .11, side: [.4, .3, 1], text: 'The metal collar at the guard end of the grip, finished with engraved karakusa scrollwork.' },
  tsuka: { label: 'Tsuka', jp: '柄 · handle core', sub: 'WOODEN CORE', dist: .3, text: 'A slightly waisted wooden core that receives the tang. Visible in the exploded view.' },
  samegawa: { label: 'Samegawa', jp: '鮫皮 · ray skin', sub: 'TEXTURED GRIP', dist: .2, text: 'The pearly nodular skin you see inside every diamond of the wrap. Here it is synthesized, not scanned.' },
  ito: { label: 'Tsuka-ito', jp: '柄糸 · handle wrap', sub: 'CROSSED SILK WRAP', dist: .22, text: 'Four helical silk ribbons crossing on both faces, alternating over and under, leaving real diamond openings (hishigata). Braided silk sheen and normal detail are generated live.' },
  menuki_front: { label: 'Menuki', jp: '目貫 · front ornament', sub: 'GILT ORNAMENT', dist: .085, side: [0, .15, 1], text: 'A gilt infinity knot, half hidden beneath the wrap as menuki traditionally are — a quiet signature of the Infinite edition.' },
  menuki_back: { label: 'Menuki', jp: '目貫 · rear ornament', sub: 'GILT ORNAMENT', dist: .085, side: [0, .15, -1], text: 'The reverse ornament, offset along the grip.' },
  mekugi: { label: 'Mekugi', jp: '目釘 · peg', sub: 'BAMBOO PEG', dist: .07, side: [0, .3, 1], text: 'The small bamboo peg that passes through handle and tang.' },
  kashira: { label: 'Kashira', jp: '頭 · pommel', sub: 'POMMEL CAP', dist: .11, side: [1, .3, .6], text: 'A domed end cap closing the grip, with the same engraved scrollwork as the fuchi.' },
  koiguchi: { label: 'Koiguchi', jp: '鯉口 · mouth', sub: 'SCABBARD MOUTH', dist: .12, side: [1, .3, .6], text: 'The reinforced mouth of the saya, with a real opening that receives the habaki.' },
  kojiri: { label: 'Kojiri', jp: '鐺 · end cap', sub: 'SCABBARD END', dist: .14, side: [-1, .3, .6], text: 'The protective end fitting of the saya.' },
  kurigata: { label: 'Kurigata', jp: '栗形 · cord knob', sub: 'CORD KNOB', dist: .08, side: [.2, .2, 1], text: 'A horn knob with a through-hole that anchors the sageo.' },
  sageo: { label: 'Sageo', jp: '下緒 · cord', sub: 'BRAIDED CORD', dist: .24, side: [.3, .1, 1], text: 'A flat braided cord wound four times around the saya, its tails finished with metal tips.' },
};

export const COLORS = {
  cobalt: { name: 'Cobalt', hex: '#1c3fae', sheen: '#6f8fff' },
  midnight: { name: 'Midnight', hex: '#0d1634', sheen: '#46609f' },
  black: { name: 'Sumi black', hex: '#0b0b0d', sheen: '#3a3d46' },
  crimson: { name: 'Crimson', hex: '#7c0c18', sheen: '#e0485a' },
  teal: { name: 'Teal', hex: '#0b5a63', sheen: '#39d0de' },
  violet: { name: 'Violet', hex: '#3a1f78', sheen: '#9b7dff' },
  gold: { name: 'Kin gold', hex: '#9c7424', sheen: '#ffd27a' },
  ivory: { name: 'Ivory', hex: '#d8d0bc', sheen: '#ffffff' },
};

export const METALS = {
  silver: { name: 'Silver', color: '#f1efea', rough: .2, swatch: 'linear-gradient(135deg,#fff,#9aa0a6)' },
  gold: { name: 'Gold', color: '#ffc46b', rough: .22, swatch: 'linear-gradient(135deg,#ffe3a0,#a8741f)' },
  shakudo: { name: 'Shakudō', color: '#1a1f2c', rough: .28, swatch: 'linear-gradient(135deg,#4b5a78,#0b0e16)' },
  copper: { name: 'Copper', color: '#f0a07a', rough: .26, swatch: 'linear-gradient(135deg,#ffc2a0,#8a3e20)' },
  iron: { name: 'Blackened iron', color: '#2a2b2e', rough: .42, metal: .8, swatch: 'linear-gradient(135deg,#55575c,#101113)' },
};

const base = { tsubaDesign: 'infinity', hamon: 'notare', engraving: 'none', polish: .8, lacquer: 'aonami', pattern: 'waves', luminous: .45, raden: .6, ito: 'cobalt', same: 'ivory', fittings: 'silver', tsuba: 'iron', menuki: 'gold', sageo: 'midnight' };
export const PRESETS = {
  aonami: { name: 'Aonami', line: 'The reference. Cobalt tide, silver, indigo.', cfg: { ...base } },
  mugen: { name: 'Mugen ∞', line: 'The infinite edition. Luminous cyan, lemniscate hamon.', cfg: { ...base, hamon: 'infinite', engraving: 'sigil', lacquer: 'mugen', pattern: 'infinite', luminous: .9, raden: .85, ito: 'black', same: 'black', tsuba: 'shakudo', menuki: 'silver', sageo: 'teal' } },
  kurogane: { name: 'Kurogane', line: 'Black iron. Nothing to prove.', cfg: { ...base, tsubaDesign: 'nami', hamon: 'suguha', lacquer: 'kuro', pattern: 'plain', luminous: 0, raden: .12, ito: 'black', same: 'black', fittings: 'iron', tsuba: 'iron', menuki: 'gold', sageo: 'black', polish: .9 } },
  shu: { name: 'Shu no Yume', line: 'Vermilion dream, clove hamon, sakura.', cfg: { ...base, tsubaDesign: 'sakura', hamon: 'choji', lacquer: 'shu', pattern: 'sakura', luminous: .15, raden: .3, ito: 'black', same: 'ivory', fittings: 'gold', tsuba: 'shakudo', menuki: 'gold', sageo: 'crimson' } },
  yuki: { name: 'Yuki', line: 'Pearl and silver for the first snow.', cfg: { ...base, tsubaDesign: 'nami', hamon: 'gunome', lacquer: 'yuki', pattern: 'waves', luminous: .08, raden: .95, ito: 'ivory', same: 'ivory', fittings: 'silver', tsuba: 'silver', menuki: 'silver', sageo: 'ivory' } },
  murasaki: { name: 'Yoru', line: 'Violet night and copper warmth.', cfg: { ...base, hamon: 'notare', lacquer: 'murasaki', pattern: 'infinite', luminous: .55, raden: .7, ito: 'violet', same: 'indigo', fittings: 'copper', tsuba: 'shakudo', menuki: 'copper', sageo: 'violet' } },
};

export const SEASONS = {
  spring: { name: 'Haru', foliage: '#f4b8c9', tint: [1, .98, 1.0], line: 'Haru — sakura on the night wind.' },
  summer: { name: 'Natsu', foliage: '#2e6a2b', tint: [.96, 1.0, .96], line: 'Natsu — fireflies over the pond.' },
  autumn: { name: 'Aki', foliage: '#c4481a', tint: [1.07, .98, .9], line: 'Aki — maple leaves and a warmer forge.' },
  winter: { name: 'Fuyu', foliage: '#eef2f7', tint: [.9, .97, 1.1], line: 'Fuyu — the garden holds its breath.' },
};

export const WEATHERS = {
  clear: { name: 'Clear moon', fog: '#060b14', density: .007, wet: .8, rain: 0, wind: .1, tint: [1, 1, 1], grade: [1, 1, 1], line: 'A clear moon over the garden.' },
  mist: { name: 'Mist', fog: '#141d2b', density: .04, wet: .9, rain: 0, wind: .05, tint: [.96, .98, 1.03], grade: [.98, 1, 1.03], line: 'Mist settles into the garden.' },
  rain: { name: 'Rain', fog: '#101824', density: .032, wet: 1.5, rain: 1, wind: .35, tint: [.9, .95, 1.03], grade: [.95, .99, 1.05], line: 'Rain on the engawa. The timber shines.' },
  storm: { name: 'Storm', fog: '#0c121c', density: .04, wet: 1.6, rain: 1.4, wind: 1, tint: [.82, .88, 1.0], grade: [.92, .97, 1.06], line: 'A storm. Count the seconds after the flash.' },
  snow: { name: 'Snow', fog: '#1d2533', density: .03, wet: .55, rain: 0, wind: .2, tint: [.94, .98, 1.08], grade: [.97, 1, 1.06], line: 'Snow falls without a sound.' },
};
