// Six WYLD custom liveries. Colours come from the WYLD kit range and the Upcoming print.
// stops: dye → five ramp colours · checker → [cell A, cell B, outline] · spots → [base, spot, ring, core, base 2]
export const LIVERIES = [
  { id: 'raspberry-riot', set: 'stage', persona: 'The Rockstar', place: 'Main stage · sold out', name: 'Raspberry Riot', sub: 'Raspberry to grape, hand-dyed in waves',
    pattern: 'dye', stops: ['#a3134a', '#ff2f92', '#ff8cc0', '#c9b6f4', '#6f4cd9'], angle: 28, scale: 2.3, flow: 1.3,
    irid: .25, finish: 'gloss', decal: '#fff6d8', cockpit: 'carbon', rimText: '#ff8cc0', tyreText: '#ff5fa2', glow: '#ff2f92' },
  { id: 'tiffany-tide', set: 'beach', persona: 'The Surfer', place: 'Golden hour · offshore wind', name: 'Tiffany Tide', sub: 'Tiffany, sky and cobalt, like a wave breaking',
    pattern: 'dye', stops: ['#2f4fd6', '#6ec6ff', '#f4fbfb', '#8fe7dc', '#55d8d3'], angle: -24, scale: 1.3, flow: 1.4,
    irid: .15, finish: 'gloss', decal: '#1e1826', cockpit: 'carbon', rimText: '#8fe7dc', tyreText: '#8fe7dc', glow: '#55d8d3' },
  { id: 'grape-nebula', set: 'moon', persona: 'The Astronaut', place: 'Moon base · zero drag', name: 'Grape Nebula', sub: 'Deep grape with a pink flare and a pearl shift',
    pattern: 'dye', stops: ['#1a1033', '#6f4cd9', '#a98bff', '#ff5fa2', '#241a33'], angle: 60, scale: 1.1, flow: 1.6, darkness: .15,
    irid: 1, finish: 'gloss', decal: '#ff5fa2', cockpit: 'frame', rimText: '#a98bff', tyreText: '#a98bff', glow: '#a98bff' },
  { id: 'olive-acid', set: 'jungle', persona: 'The Raver', place: 'Jungle rave · 3 a.m.', name: 'Olive Acid', sub: 'Olive camo gone wild with acid-lime spots',
    pattern: 'spots', stops: ['#4f5a1f', '#d9ff3f', '#1e1826', '#f8ecb0', '#7f8b2f'], angle: 20, scale: 1.2, cells: 7,
    irid: 0, finish: 'satin', decal: '#d9ff3f', cockpit: 'carbon', rimText: '#d9ff3f', tyreText: '#d9ff3f', glow: '#d9ff3f' },
  { id: 'stay-weird', set: 'stickers', persona: 'The Weirdo', place: 'Sticker dream', name: 'Stay Weird', sub: 'Lilac and butter checkers from the Upcoming drop',
    pattern: 'checker', stops: ['#a98bef', '#f6df86', '#1e1826', '#a98bef', '#f6df86'], cells: 22, flow: 1,
    irid: 0, finish: 'gloss', decal: '#ff5fa2', cockpit: '#ff5fa2', rimText: '#ff5fa2', tyreText: '#ff8cc0', glow: '#ff8cc0' },
  { id: 'wyld-dye', set: 'clouds', persona: 'The Dreamer', place: 'Cotton candy sky', name: 'WYLD Dye', sub: 'The signature pink and aqua jersey dye',
    pattern: 'dye', stops: ['#ff3d8e', '#ff8fbf', '#e9cde8', '#8fe7dc', '#5fd8d3'], angle: 32, scale: 1.5, flow: 1,
    irid: 0, finish: 'gloss', decal: '#141416', cockpit: 'carbon', rimText: '#e9cde8', tyreText: '#ff8fbf', glow: '#5fd8d3' },
];

// CSS preview for the livery cards.
export function swatch(l) {
  const s = l.stops;
  if (l.pattern === 'checker') return `repeating-conic-gradient(${s[0]} 0 25%, ${s[1]} 0 50%) 0 0/22px 22px`;
  if (l.pattern === 'spots') return `radial-gradient(circle at 30% 35%, ${s[3]} 0 7%, ${s[1]} 7% 14%, ${s[2]} 14% 17%, transparent 17%) 0 0/34px 34px, radial-gradient(circle at 75% 70%, ${s[1]} 0 10%, ${s[2]} 10% 13%, transparent 13%) 0 0/34px 34px, linear-gradient(120deg, ${s[0]}, ${s[4]})`;
  return `linear-gradient(${90 + (l.angle || 0)}deg, ${s[0]}, ${s[1]} 22%, ${s[2]} 44%, ${s[3]} 66%, ${s[4]})`;
}
