// Eight WYLD bike movies. Each film pairs a custom livery with a persona rider and a movie set.
// stops: dye → five ramp colours · checker → [cell A, cell B, outline] · spots → [base, spot, ring, core, base 2]
//        mosaic → five glass colours (lead lines use `lead`)
// Optional extras: disc (rear disc wheel), neon (glowing rings around both wheels).
export const LIVERIES = [
  { id: 'aero-glam', film: 'Aero Glam', tagline: 'They came for the watts. They stayed for the looks.', persona: 'The Alien', place: 'Crop circle · 3 a.m.', set: 'ufo', font: 'fun', avatar: 'alien',
    name: 'Alien Glam', sub: 'Toxic lime into black with a violet pearl, neon wheels and a full disc',
    pattern: 'dye', stops: ['#050805', '#1fbf3f', '#8be04e', '#d9ff3f', '#7b4fd6'], angle: 40, scale: 1.8, flow: 1.4,
    irid: .7, finish: 'gloss', decal: '#d9ff3f', cockpit: 'carbon', rimText: '#39ff88', tyreText: '#39ff88', glow: '#39ff88', neon: '#39ff88', disc: true },
  { id: 'couture', film: 'Couture', tagline: 'Blonde. Bored. Twelve seconds faster than you.', persona: 'The Supermodel', place: 'Runway · front row', set: 'runway', font: 'serif', avatar: 'model',
    name: 'Blush Couture', sub: 'Blush, pearl and champagne gold, like a gown in motion',
    pattern: 'dye', stops: ['#f2a7c3', '#fff1f6', '#e3b76a', '#ff8fbf', '#f6dcae'], angle: 70, scale: 1.2, flow: 1.1,
    irid: 1, finish: 'gloss', decal: '#9a6b1f', cockpit: 'frame', rimText: '#e3b76a', tyreText: '#e3b76a', glow: '#ffd1e6' },
  { id: 'tiffany-tide', film: 'Offshore', tagline: 'One wave. One bike. No brakes.', persona: 'The Surfer', place: 'Golden hour · offshore wind', set: 'beach', font: 'fun', avatar: 'surfer',
    name: 'Tiffany Tide', sub: 'Tiffany, sky and cobalt, like a wave breaking',
    pattern: 'dye', stops: ['#2f4fd6', '#6ec6ff', '#f4fbfb', '#8fe7dc', '#55d8d3'], angle: -24, scale: 1.3, flow: 1.4,
    irid: .15, finish: 'gloss', decal: '#1e1826', cockpit: 'carbon', rimText: '#8fe7dc', tyreText: '#8fe7dc', glow: '#55d8d3' },
  { id: 'hex', film: 'Hex', tagline: 'Double, double, carbon trouble.', persona: 'The Witch', place: 'Moonlit woods · full moon', set: 'forest', font: 'fun', avatar: 'witch',
    name: 'Witching Hour', sub: 'Midnight grape and potion green with a spell-bound pearl',
    pattern: 'dye', stops: ['#0c0714', '#3a1f6b', '#7b4fd6', '#b6ff5a', '#1a0f2a'], angle: 55, scale: 1.5, flow: 1.8,
    irid: .8, finish: 'gloss', decal: '#b6ff5a', cockpit: 'carbon', rimText: '#b6ff5a', tyreText: '#a98bff', glow: '#b6ff5a' },
  { id: 'stay-weird', film: 'Stay Weird', tagline: 'Rules are for other bikes.', persona: 'The Weirdo', place: 'Sticker dream', set: 'stickers', font: 'fun', avatar: 'weirdo',
    name: 'Stay Weird', sub: 'Lilac and butter checkers from the Upcoming drop',
    pattern: 'checker', stops: ['#a98bef', '#f6df86', '#1e1826', '#a98bef', '#f6df86'], cells: 22, flow: 1,
    irid: 0, finish: 'gloss', decal: '#ff5fa2', cockpit: '#ff5fa2', rimText: '#ff5fa2', tyreText: '#ff8cc0', glow: '#ff8cc0' },
  { id: 'sunny-side', film: 'Sunny Side', tagline: 'She’s lovely. She’s Swedish. She’s already inside.', persona: 'The Babysitter', place: 'Midsummer meadow · too bright', set: 'meadow', font: 'serif', avatar: 'sitter',
    name: 'WYLD Dye', sub: 'The signature pink and aqua jersey dye, sweet as a lullaby',
    pattern: 'dye', stops: ['#ff3d8e', '#ff8fbf', '#e9cde8', '#8fe7dc', '#5fd8d3'], angle: 32, scale: 1.5, flow: 1,
    irid: 0, finish: 'gloss', decal: '#141416', cockpit: 'carbon', rimText: '#e9cde8', tyreText: '#ff8fbf', glow: '#ff8fbf' },
  { id: 'lake-house', film: 'The Lake House', tagline: 'Whatever you do, don’t ride down to the dock.', persona: 'The Final Girl', place: 'Haunted cabin · by the lake', set: 'lake', font: 'serif', avatar: 'final',
    name: 'Lake Fog', sub: 'Black water, cold teal and a drifting mist',
    pattern: 'dye', stops: ['#03090c', '#0f3a44', '#5b8c8f', '#dfeae6', '#14242a'], angle: -15, scale: 1.4, flow: 2,
    irid: .2, finish: 'satin', decal: '#dfeae6', cockpit: 'carbon', rimText: '#dfeae6', tyreText: '#8fb3b3', glow: '#ffb36b' },
  { id: 'sanctuary', film: 'Sanctuary', tagline: 'She has been waiting in the front pew.', persona: 'The Doll', place: 'Old chapel · midnight mass', set: 'church', font: 'serif', avatar: 'doll',
    name: 'Stained Glass', sub: 'A cathedral window in carbon: ruby, cobalt, gold and leaded black',
    pattern: 'mosaic', stops: ['#b3122e', '#1d4fd6', '#f2c14e', '#2f9e5a', '#6f4cd9'], lead: '#120e10', cells: 14, flow: 1,
    irid: .3, finish: 'gloss', decal: '#f2c14e', cockpit: 'carbon', rimText: '#f2c14e', tyreText: '#f2c14e', glow: '#f2c14e' },
];

// CSS preview for the livery cards.
export function swatch(l) {
  const s = l.stops;
  if (l.pattern === 'checker') return `repeating-conic-gradient(${s[0]} 0 25%, ${s[1]} 0 50%) 0 0/22px 22px`;
  if (l.pattern === 'spots') return `radial-gradient(circle at 30% 35%, ${s[3]} 0 7%, ${s[1]} 7% 14%, ${s[2]} 14% 17%, transparent 17%) 0 0/34px 34px, linear-gradient(120deg, ${s[0]}, ${s[4]})`;
  if (l.pattern === 'mosaic') return `conic-gradient(from 20deg at 30% 40%, ${s[0]} 0 18%, ${l.lead} 0 19%, ${s[1]} 0 42%, ${l.lead} 0 43%, ${s[2]} 0 61%, ${l.lead} 0 62%, ${s[3]} 0 80%, ${l.lead} 0 81%, ${s[4]} 0)`;
  return `linear-gradient(${90 + (l.angle || 0)}deg, ${s[0]}, ${s[1]} 22%, ${s[2]} 44%, ${s[3]} 66%, ${s[4]})`;
}
