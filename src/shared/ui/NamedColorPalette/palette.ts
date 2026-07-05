/**
 * 16.1g — kurátorská pojmenovaná paleta pro nápovědu u color pickerů.
 *
 * Barvy jsou **data** (perzistovaná uživatelská volba, ne designový token) →
 * legitimní výjimka z lint:colors (`lint-colors-ignore` na každém řádku).
 *
 * Výběr: střední jas + sytost, aby barva byla čitelná na tmavém i světlém
 * pozadí (chat má obojí dle skinu). Krajně tmavé (černá, navy) a krajně
 * světlé odstíny jsou vynechány schválně — na příslušném pozadí by mizely.
 */
export interface NamedColor {
  name: string;
  hex: string;
}

export interface NamedColorGroup {
  label: string;
  colors: NamedColor[];
}

export const NAMED_COLOR_GROUPS: readonly NamedColorGroup[] = [
  {
    label: 'Teplé',
    colors: [
      { name: 'Rubínová', hex: '#E5484D' }, // lint-colors-ignore
      { name: 'Korálová', hex: '#FF6B4A' }, // lint-colors-ignore
      { name: 'Jantarová', hex: '#F5A524' }, // lint-colors-ignore
      { name: 'Zlatá', hex: '#FBCA3E' }, // lint-colors-ignore
      { name: 'Malinová', hex: '#E93D82' }, // lint-colors-ignore
      { name: 'Růžová', hex: '#FF8DC7' }, // lint-colors-ignore
    ],
  },
  {
    label: 'Studené',
    colors: [
      { name: 'Limetková', hex: '#A5D63F' }, // lint-colors-ignore
      { name: 'Smaragdová', hex: '#30A46C' }, // lint-colors-ignore
      { name: 'Mátová', hex: '#4CC38A' }, // lint-colors-ignore
      { name: 'Tyrkysová', hex: '#12B5C9' }, // lint-colors-ignore
      { name: 'Blankytná', hex: '#4CA2E8' }, // lint-colors-ignore
      { name: 'Safírová', hex: '#4667E6' }, // lint-colors-ignore
      { name: 'Levandulová', hex: '#9B8AFB' }, // lint-colors-ignore
      { name: 'Ametystová', hex: '#A15FD9' }, // lint-colors-ignore
    ],
  },
  {
    label: 'Neutrální',
    colors: [
      { name: 'Sněhová', hex: '#FFFFFF' }, // lint-colors-ignore
      { name: 'Pergamen', hex: '#EAE0CC' }, // lint-colors-ignore
      { name: 'Stříbrná', hex: '#C0C6CE' }, // lint-colors-ignore
      { name: 'Břidlicová', hex: '#8A94A6' }, // lint-colors-ignore
    ],
  },
];

/** Ploché pole všech barev (pořadí teplé → studené → neutrální). */
export const NAMED_COLORS: readonly NamedColor[] = NAMED_COLOR_GROUPS.flatMap(
  (g) => g.colors,
);

/**
 * Čitelný text (bílý/tmavý) na dané barvě dlaždice — perceptuální jas.
 * Práh 0.6: světlé barvy (žlutá, pastely, bílá) → tmavý text, jinak bílý.
 */
export function readableTextOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#ffffff'; // lint-colors-ignore
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#14100a' : '#ffffff'; // lint-colors-ignore
}
