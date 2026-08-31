// Built-in flash designs (bundled, client-side). Studios also upload their own,
// which live in the DB. Each `body` is inner SVG on a 0 0 200 200 viewBox using
// currentColor, so it re-tints by setting the wrapping svg's color.
export type FlashDesign = { id: string; name: string; body: string };

export const FLASH: FlashDesign[] = [
  { id: "rose", name: "Fine-line Rose", body: `<path d="M100 92 C90 82 74 86 78 100 C66 94 58 110 72 118 C63 130 76 144 90 135 C95 149 116 149 121 135 C137 144 150 128 140 116 C154 108 148 90 133 94 C138 78 118 74 111 86 C108 79 100 80 100 92 Z"/><path d="M100 100 C93 96 86 104 92 111 C86 117 93 126 102 121 C110 126 118 116 112 109 C118 101 110 93 103 99"/><path d="M100 135 C100 152 98 168 108 185"/><path d="M103 152 C120 148 132 154 138 166 C123 168 111 163 103 153"/><path d="M101 166 C86 162 74 168 70 180 C85 182 96 177 102 167"/>` },
  { id: "swallow", name: "Swallow", body: `<path d="M100 96 C112 92 128 86 150 70 C138 92 122 100 108 104 C126 108 140 118 150 134 C128 122 112 116 100 116 C88 116 72 122 50 134 C60 118 74 108 92 104 C78 100 62 92 50 70 C72 86 88 92 100 96 Z"/><path d="M100 116 L92 150 L100 142 L108 150 Z" fill="currentColor" stroke="none"/><circle cx="100" cy="98" r="3.2" fill="currentColor" stroke="none"/>` },
  { id: "moon", name: "Moon & Stars", body: `<path d="M132 60 A46 46 0 1 0 132 148 A36 36 0 1 1 132 60 Z"/><g stroke-width="4"><path d="M64 66 l0 16 M56 74 l16 0"/><path d="M150 116 l0 12 M144 122 l12 0"/><path d="M70 150 l0 12 M64 156 l12 0"/></g><circle cx="118" cy="150" r="2.5" fill="currentColor" stroke="none"/><circle cx="52" cy="112" r="2.5" fill="currentColor" stroke="none"/>` },
  { id: "mountains", name: "Mountain Line", body: `<circle cx="132" cy="70" r="20"/><path d="M34 150 L78 84 L104 122 L130 78 L166 150 Z"/><path d="M78 84 L66 102 L86 102 Z" fill="currentColor" stroke="none"/><path d="M130 78 L118 98 L142 98 Z" fill="currentColor" stroke="none"/><path d="M40 150 L166 150" stroke-width="5"/>` },
  { id: "wave", name: "Great Wave", body: `<path d="M30 132 C58 132 66 96 96 96 C126 96 118 138 150 138 C168 138 172 120 172 120"/><path d="M96 96 C104 80 120 74 136 80 C126 82 120 90 118 100"/><path d="M60 120 C68 110 80 108 90 112" stroke-width="4"/><path d="M120 124 C130 116 142 116 150 122" stroke-width="4"/><path d="M30 148 C60 148 66 144 96 144 C126 144 132 148 172 148" stroke-width="4"/>` },
  { id: "arrow", name: "Arrow", body: `<path d="M40 160 L160 40"/><path d="M160 40 L134 44 M160 40 L156 66"/><path d="M40 160 L54 146 M40 160 L60 154 M40 160 L46 140" stroke-width="4"/><path d="M96 104 l14 -6 -6 14 z" fill="currentColor" stroke="none"/>` },
  { id: "heart", name: "Sacred Heart", body: `<path d="M100 150 C60 120 52 92 68 76 C84 60 100 74 100 90 C100 74 116 60 132 76 C148 92 140 120 100 150 Z"/><path d="M100 46 C96 56 92 62 84 66 M100 46 C104 56 108 62 116 66" stroke-width="4"/><path d="M100 46 L100 62" stroke-width="4"/><path d="M70 128 C100 138 100 138 130 128" stroke-width="4"/>` },
  { id: "butterfly", name: "Butterfly", body: `<path d="M100 70 L100 140"/><path d="M100 78 C74 46 40 52 42 82 C44 108 76 106 100 96"/><path d="M100 96 C76 128 44 128 46 150 C48 168 82 160 100 132"/><path d="M100 78 C126 46 160 52 158 82 C156 108 124 106 100 96"/><path d="M100 96 C124 128 156 128 154 150 C152 168 118 160 100 132"/><path d="M100 70 C96 62 96 58 100 54 C104 58 104 62 100 70" stroke-width="4"/><path d="M100 62 L92 50 M100 62 L108 50" stroke-width="4"/>` },
  { id: "snake", name: "Serpent", body: `<path d="M104 174 C142 174 150 148 120 138 C82 126 78 96 108 88 C138 80 146 58 120 50" stroke-width="12"/><path d="M120 50 C108 46 96 52 96 64 C96 74 104 80 116 78" stroke-width="9"/><circle cx="110" cy="60" r="2.6" fill="currentColor" stroke="none"/><path d="M96 66 L82 62 M96 68 L82 74" stroke-width="3"/>` },
  { id: "dagger", name: "Dagger", body: `<path d="M100 34 L112 120 L100 134 L88 120 Z"/><path d="M100 46 L100 120" stroke-width="4"/><path d="M70 124 L130 124" stroke-width="7"/><path d="M78 124 C74 132 74 132 70 138 M122 124 C126 132 126 132 130 138" stroke-width="4"/><path d="M100 134 L100 176"/><circle cx="100" cy="176" r="8"/>` },
  { id: "eye", name: "All-Seeing Eye", body: `<path d="M40 100 C70 74 130 74 160 100 C130 126 70 126 40 100 Z"/><circle cx="100" cy="100" r="20"/><circle cx="100" cy="100" r="8" fill="currentColor" stroke="none"/><g stroke-width="4"><path d="M100 60 l0 -12 M100 152 l0 -12 M150 118 l10 6 M60 118 l-10 6 M50 82 l-10 -6 M150 82 l10 -6"/></g>` },
  { id: "sun", name: "Radiant Sun", body: `<circle cx="100" cy="100" r="34"/><g stroke-width="5"><path d="M100 30 l0 22 M100 148 l0 22 M30 100 l22 0 M148 100 l22 0"/><path d="M50 50 l16 16 M150 50 l-16 16 M50 150 l16 -16 M150 150 l-16 -16"/></g><path d="M86 96 a4 4 0 0 1 8 0 M106 96 a4 4 0 0 1 8 0" stroke-width="4"/><path d="M86 112 C92 122 108 122 114 112" stroke-width="4"/>` },
  { id: "anchor", name: "Anchor", body: `<circle cx="100" cy="46" r="12"/><path d="M100 58 L100 150"/><path d="M72 78 L128 78" stroke-width="7"/><path d="M100 150 C70 150 50 128 48 104 C56 112 62 116 70 116"/><path d="M100 150 C130 150 150 128 152 104 C144 112 138 116 130 116"/><path d="M48 104 l-10 -6 14 -2 M152 104 l10 -6 -14 -2" stroke-width="4"/>` },
  { id: "bolt", name: "Lightning", body: `<path d="M112 30 L64 110 L96 110 L84 170 L140 84 L106 84 Z" fill="currentColor" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>` },
];

export function flashSvg(body: string, ink: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" ' +
    'stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" ' +
    `style="color:${ink}">${body}</svg>`
  );
}

export function flashDataUrl(body: string, ink = "#161616"): string {
  return "data:image/svg+xml," + encodeURIComponent(flashSvg(body, ink));
}
