import type { ArchetypePreset } from '../types';

/**
 * Mytologická místa — 6 presetů z řecké, severské, egyptské a keltské mytologie.
 *
 * sourceLevel: ANALOGY (mapping na reálný klima-analog dle popisů v textech)
 * nebo INFERRED (kvalitativní popisy bez kvantitativních údajů).
 */

const MYTH_OLYMP: ArchetypePreset = {
  id: 'myth-olymp',
  category: 'fantasy',
  name: 'Olymp — řecká mytologie',
  subtitle: 'Sídlo bohů, věčné jaro',
  description:
    'Mírné vrcholy nad oblaky, věčné jaro, občasné božské hromy.',
  emoji: '⚡',
  climateZone: 'Csb',
  monthlyTemps: [18, 18, 19, 20, 21, 22, 22, 22, 21, 20, 19, 18],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Slunečno', icon: 'sun', probability: 55, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 25, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Jemný déšť', icon: 'cloud-rain', probability: 10, cloudRange: [5, 8], precipRange: [1, 10] },
    { type: 'storm', label: 'Božské hromy', icon: 'cloud-lightning', probability: 7, cloudRange: [6, 8], precipRange: [5, 20] },
    { type: 'fog', label: 'Mlha nad vrcholy', icon: 'cloud-fog', probability: 3, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 25],
  defaultWindGustMultiplier: 1.4,
  defaultPressureRange: [1005, 1025],
  defaultHumidityRange: [40, 75],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Božské hromy', 'Zlatý mrak'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Hesiod, Theogonia (cca 700 př. n. l.); Homer, Ilias (cca 800 př. n. l.)',
};

const MYTH_ASGARD: ArchetypePreset = {
  id: 'myth-asgard',
  category: 'fantasy',
  name: 'Asgard — severská mytologie',
  subtitle: 'Sídlo Ásů, severní záře',
  description:
    'Chladné severní království, sníh, zlaté světlo Bifröstu.',
  emoji: '🌈',
  climateZone: 'Dfc',
  monthlyTemps: [-5, -3, 0, 5, 10, 14, 16, 15, 11, 5, 0, -3],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Zlaté jasno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Déšť', icon: 'cloud-rain', probability: 8, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'snow', label: 'Sníh', icon: 'cloud-snow', probability: 22, cloudRange: [5, 8], precipRange: [1, 15] },
    { type: 'storm', label: 'Thorovy hromy', icon: 'cloud-lightning', probability: 6, cloudRange: [6, 8], precipRange: [5, 25] },
    { type: 'fog', label: 'Bifröstová mlha', icon: 'cloud-fog', probability: 4, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 40],
  defaultWindGustMultiplier: 1.6,
  defaultPressureRange: [985, 1025],
  defaultHumidityRange: [50, 85],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Sníh', 'Zlaté světlo'], probability: 25 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Snorri Sturluson, Prose Edda (1220); Poetic Edda (Codex Regius, cca 1270)',
};

const MYTH_HELHEIM: ArchetypePreset = {
  id: 'myth-helheim',
  category: 'fantasy',
  name: 'Helheim — severská říše mrtvých',
  subtitle: 'Říše Hel, věčný chlad',
  description:
    'Mrazivá podsvětní pustina, mrazivá mlha, věčné šero.',
  emoji: '💀',
  climateZone: 'EF',
  monthlyTemps: [-40, -40, -38, -35, -32, -30, -28, -28, -30, -35, -38, -40],
  defaultWeatherTypes: [
    { type: 'cloudy', label: 'Trvalé šero', icon: 'cloud', probability: 35, cloudRange: [5, 8], precipRange: [0, 0] },
    { type: 'snow', label: 'Mrazivý sníh', icon: 'cloud-snow', probability: 30, cloudRange: [5, 8], precipRange: [0, 8] },
    { type: 'storm', label: 'Mrazivá vichřice', icon: 'cloud-lightning', probability: 10, cloudRange: [7, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Mrazivá mlha', icon: 'cloud-fog', probability: 25, cloudRange: [6, 8], precipRange: [0, 1] },
  ],
  defaultWindRange: [5, 60],
  defaultWindGustMultiplier: 1.9,
  defaultPressureRange: [970, 1020],
  defaultHumidityRange: [50, 90],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Mrazivá mlha', 'Šero', 'Duše mrtvých'], probability: 60 },
  ],
  sourceLevel: 'INFERRED',
  sourceCitation: 'Snorri Sturluson, Gylfaginning; Eddic poems (Baldrs draumar)',
};

const MYTH_HADES: ArchetypePreset = {
  id: 'myth-hades',
  category: 'fantasy',
  name: 'Hádes — řecké podsvětí',
  subtitle: 'Říše stínů, věčný soumrak',
  description:
    'Konstantní šero, stínová mlha nad řekou Styx.',
  emoji: '🪦',
  climateZone: 'CONTROLLED',
  monthlyTemps: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  defaultWeatherTypes: [
    { type: 'cloudy', label: 'Věčný soumrak', icon: 'cloud', probability: 60, cloudRange: [6, 8], precipRange: [0, 0] },
    { type: 'fog', label: 'Stínová mlha', icon: 'cloud-fog', probability: 30, cloudRange: [7, 8], precipRange: [0, 1] },
    { type: 'rain', label: 'Slzy Acherónu', icon: 'cloud-rain', probability: 10, cloudRange: [7, 8], precipRange: [0, 5] },
  ],
  defaultWindRange: [0, 10],
  defaultWindGustMultiplier: 1.1,
  defaultPressureRange: [1005, 1015],
  defaultHumidityRange: [70, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Stínová mlha', 'Duše mrtvých'], probability: 70 },
  ],
  sourceLevel: 'INFERRED',
  sourceCitation: 'Homer, Odyssea kniha XI (Nekyia, cca 800 př. n. l.); Vergilius, Aeneis VI',
};

const MYTH_DUAT: ArchetypePreset = {
  id: 'myth-duat',
  category: 'fantasy',
  name: 'Duat — egyptské podsvětí',
  subtitle: 'Říše Osirise, pouštní noc',
  description:
    'Žhavá pouštní noc, monstra střežící brány, Reovo putování.',
  emoji: '☥',
  climateZone: 'BWh',
  monthlyTemps: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Pouštní noc', icon: 'sun', probability: 50, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 20, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'storm', label: 'Písečná bouře', icon: 'cloud-lightning', probability: 15, cloudRange: [5, 8], precipRange: [0, 5] },
    { type: 'fog', label: 'Pouštní opar', icon: 'cloud-fog', probability: 15, cloudRange: [3, 6], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 50],
  defaultWindGustMultiplier: 1.8,
  defaultPressureRange: [1000, 1020],
  defaultHumidityRange: [10, 35],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Žhavá pustina', 'Monstra', 'Brány'], probability: 50 },
  ],
  sourceLevel: 'INFERRED',
  sourceCitation: 'Book of the Dead (Egyptská kniha mrtvých, Nová říše cca 1550-1070 př. n. l.)',
};

const MYTH_AVALON: ArchetypePreset = {
  id: 'myth-avalon',
  category: 'fantasy',
  name: 'Avalon — keltská mytologie',
  subtitle: 'Ostrov jablek, mírné jaro',
  description:
    'Magický ostrov v mlze, mírné jaro, jabloňové sady.',
  emoji: '🍎',
  climateZone: 'Cfb',
  monthlyTemps: [10, 11, 12, 14, 16, 18, 19, 19, 17, 14, 12, 11],
  defaultWeatherTypes: [
    { type: 'clear', label: 'Jasno', icon: 'sun', probability: 30, cloudRange: [0, 2], precipRange: [0, 0] },
    { type: 'cloudy', label: 'Oblačno', icon: 'cloud', probability: 30, cloudRange: [3, 6], precipRange: [0, 0] },
    { type: 'rain', label: 'Jemný déšť', icon: 'cloud-rain', probability: 18, cloudRange: [5, 8], precipRange: [1, 12] },
    { type: 'storm', label: 'Bouřka', icon: 'cloud-lightning', probability: 2, cloudRange: [6, 8], precipRange: [5, 20] },
    { type: 'fog', label: 'Magická mlha', icon: 'cloud-fog', probability: 20, cloudRange: [4, 7], precipRange: [0, 1] },
  ],
  defaultWindRange: [0, 25],
  defaultWindGustMultiplier: 1.4,
  defaultPressureRange: [1000, 1025],
  defaultHumidityRange: [65, 95],
  defaultCustomFields: [
    { label: 'Hazard', possibleValues: ['Magická mlha'], probability: 30 },
  ],
  sourceLevel: 'ANALOGY',
  sourceCitation: 'Geoffrey of Monmouth, Historia Regum Britanniae (cca 1136); Vita Merlini',
};

export const MYTHOLOGICAL_PRESETS: readonly ArchetypePreset[] = [
  MYTH_OLYMP,
  MYTH_ASGARD,
  MYTH_HELHEIM,
  MYTH_HADES,
  MYTH_DUAT,
  MYTH_AVALON,
] as const;
