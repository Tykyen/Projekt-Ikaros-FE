/**
 * 9.4-I — Hlavní wizard pro výběr presetu počasí (spec §3.2 + §14).
 *
 * State machine — 3 stadia:
 *   - 'crossroads'      → výběr zdroje (Reálný svět / Fantasy / Sci-fi)
 *   - 'categories'      → výběr kategorie v rámci zdroje (jen real-world v 9.4-I)
 *   - 'preset-detail'   → scroll list presetů + preview detail
 *
 * Search bar je sticky napříč všemi stadii. Pokud query >= 2 znaků,
 * automaticky přepneme do 'preset-detail' s filtrovaným seznamem.
 *
 * Po stisku „Použít" v stage 3 → push do recently used (localStorage),
 * pak onApply parent (modal) zavolá s `PresetItem` (config + default name).
 */
import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/shared/ui';
import s from './WeatherPresetWizard.module.css';
import { PresetCrossroads } from './PresetCrossroads';
import { PresetCategories, type CategoryTile } from './PresetCategories';
import { PresetListAndDetail } from './PresetListAndDetail';
import { PresetSearchBar } from './PresetSearchBar';
import { RecentlyUsedRow } from './RecentlyUsedRow';
import {
  buildAllPresetItems,
  buildItemsForCategory,
} from './buildPresetItems';
import { fuzzyFilter } from './fuzzySearch';
import {
  getRecentPresetIds,
  pushRecentPresetId,
} from './recentlyUsed';
import { ARCHETYPE_CATALOG } from '../../data/archetypes';
import { REAL_WORLD_CATALOG, EXTREMES } from '../../data/realWorld';
import { GLOBAL_SETS } from '../../data/sets';
import { useCustomPresets, useUseCustomPreset } from '@/features/world/api/useCustomPresets';
import type { PresetItem, Realm, RealCategory, Stage } from './types';

interface Props {
  worldId: string;
  /** User ID pro localStorage recently used. */
  userId: string | null;
  /** Callback při kliknutí „Použít" / „Aplikovat klimat" — parent zavolá BE create/update s presetem. */
  onApplyPreset: (item: PresetItem) => void;
  /**
   * 9.4 — Klik na rozcestí kartu „📦 Sety" → parent zachytí, zavře generator
   * modal a otevře `WeatherSetsModal`. Pokud handler chybí, karta klikem nic
   * neprovede (defensive — parent musí přijít s integrací).
   */
  onSwitchToSets?: () => void;
  /**
   * 9.4-J — `'repair'` = edit existujícího generátoru bez klimatického modelu.
   * CTA tlačítko v detailu presetu se přepne na „Aplikovat klimat", parent
   * dělá merge místo full replace.
   */
  mode?: 'create' | 'repair';
}

export function WeatherPresetWizard({
  worldId,
  userId,
  onApplyPreset,
  onSwitchToSets,
  mode = 'create',
}: Props) {
  const [stage, setStage] = useState<Stage>('crossroads');
  const [realm, setRealm] = useState<Realm | null>(null);
  const [category, setCategory] = useState<RealCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 9.4-dluh — custom presety per svět (fetch lazy, async)
  const customPresetsQuery = useCustomPresets(worldId);
  const useCustomPresetMut = useUseCustomPreset(worldId);
  // Stable reference — bez tohohle by `data ?? []` vyrobilo nové prázdné array per render
  // → useMemo deps by se měnily na každý render. Memoize fixed.
  const customPresets = useMemo(
    () => customPresetsQuery.data ?? [],
    [customPresetsQuery.data],
  );

  // ALL items — pro fuzzy search napříč všemi (uvnitř memo). Custom presety
  // injectneme tak, aby je fuzzy search prošla také.
  const allItems = useMemo(
    () => buildAllPresetItems(customPresets),
    [customPresets],
  );

  // Items pro vybranou kategorii (efektivnější než filter all).
  const categoryItems = useMemo(() => {
    if (!category) return [];
    return buildItemsForCategory(category, customPresets);
  }, [category, customPresets]);

  // Search is in progress: skip rozcestí/kategorie a ukaž filter v stage 3.
  const isSearching = searchQuery.trim().length >= 2;

  // Items pro stage 3 — buď search výsledek nebo category items.
  const stage3Items = useMemo(() => {
    if (isSearching) return fuzzyFilter(allItems, searchQuery);
    return categoryItems;
  }, [isSearching, allItems, searchQuery, categoryItems]);

  // Recently used items (z localStorage).
  const recentItems = useMemo(() => {
    const ids = getRecentPresetIds(userId, worldId);
    return ids
      .map((id) => allItems.find((it) => it.id === id))
      .filter((x): x is PresetItem => x != null);
  }, [userId, worldId, allItems]);

  function handleApply(item: PresetItem) {
    pushRecentPresetId(userId, worldId, item.id);
    // 9.4-dluh — pokud je to custom preset, fire-and-forget BE incrementuje usageCount.
    if (item.id.startsWith('custom:')) {
      const presetId = item.id.slice('custom:'.length);
      useCustomPresetMut.mutate(presetId);
    }
    onApplyPreset(item);
  }

  function handlePickRealm(r: Realm) {
    // 9.4 — Sety realm — odbočka mimo wizard: parent zavře generator modal
    // a otevře `WeatherSetsModal`. Sety mají vlastní layout (batch-create),
    // nepatří do single-generator preset listu.
    if (r === 'set') {
      onSwitchToSets?.();
      return;
    }
    setRealm(r);
    // 9.4-dluh — Custom realm nemá podkategorie; rovnou stage 3 s plochým listem.
    if (r === 'custom') {
      setCategory('custom');
      setStage('preset-detail');
      return;
    }
    setStage('categories');
  }

  function handlePickCategory(c: RealCategory) {
    setCategory(c);
    setStage('preset-detail');
  }

  function handleBack() {
    if (isSearching) {
      setSearchQuery('');
      return;
    }
    if (stage === 'preset-detail') {
      // 9.4-dluh — Custom realm skipnul stage 2 → zpět rovnou na stage 1.
      if (realm === 'custom') {
        setStage('crossroads');
        setRealm(null);
        setCategory(null);
        return;
      }
      setStage('categories');
      return;
    }
    if (stage === 'categories') {
      setStage('crossroads');
      setRealm(null);
      return;
    }
  }

  // Stage label pro stepper.
  const stepperItems = useMemo(
    () => buildStepperItems(stage, realm, category, isSearching),
    [stage, realm, category, isSearching],
  );

  const effectiveStage: Stage = isSearching ? 'preset-detail' : stage;

  return (
    <div className={s.wizard}>
      {/* Stepper */}
      <ol className={s.stepper} aria-label="Postup wizardu">
        {stepperItems.map((item, idx) => (
          <li
            key={item.label}
            className={`${s.step} ${item.state ? s[item.state] : ''}`}
          >
            <span className={s.stepNum} aria-hidden>
              {item.state === 'done' ? '✓' : idx + 1}
            </span>
            <span className={s.stepLabel}>{item.label}</span>
            {idx < stepperItems.length - 1 && (
              <span className={s.stepSep} aria-hidden>
                ›
              </span>
            )}
          </li>
        ))}
      </ol>

      {/* Sticky search */}
      <PresetSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={searchPlaceholder(realm, category)}
      />

      <div className={s.body}>
        {/* Stage 1: Rozcestí */}
        {effectiveStage === 'crossroads' && (
          <>
            <RecentlyUsedRow items={recentItems} onPick={handleApply} />
            <PresetCrossroads
              onPickRealm={handlePickRealm}
              customPresetsCount={customPresets.length}
              setsCount={GLOBAL_SETS.length}
            />
          </>
        )}

        {/* Stage 2: Kategorie */}
        {effectiveStage === 'categories' && realm === 'real' && (
          <PresetCategories
            tiles={REAL_WORLD_CATEGORY_TILES}
            onPick={handlePickCategory}
          />
        )}
        {effectiveStage === 'categories' && realm === 'fantasy' && (
          <PresetCategories
            tiles={FANTASY_CATEGORY_TILES}
            onPick={handlePickCategory}
          />
        )}
        {effectiveStage === 'categories' && realm === 'scifi' && (
          <PresetCategories
            tiles={SCIFI_CATEGORY_TILES}
            onPick={handlePickCategory}
          />
        )}

        {/* Stage 3: Preset list + detail */}
        {effectiveStage === 'preset-detail' && (
          <PresetListAndDetail
            items={stage3Items}
            worldId={worldId}
            onApply={handleApply}
            searchQuery={isSearching ? searchQuery : undefined}
            onClearSearch={isSearching ? () => setSearchQuery('') : undefined}
            isCustomEmpty={category === 'custom'}
            mode={mode}
          />
        )}
      </div>

      {/* Footer — back button (jen pokud není stage 1 a není search). */}
      {(stage !== 'crossroads' || isSearching) && (
        <div className={s.footer}>
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft size={14} aria-hidden /> Zpět
          </Button>
          {!isSearching && stage === 'crossroads' && (
            <span className={s.footTip}>
              Tip: napiš do hledání místo procházení
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

interface StepperItem {
  label: string;
  state?: 'done' | 'active';
}

function buildStepperItems(
  stage: Stage,
  realm: Realm | null,
  category: RealCategory | null,
  isSearching: boolean,
): StepperItem[] {
  if (isSearching) {
    return [
      { label: 'Hledání', state: 'active' },
      { label: 'Preset' },
      { label: 'Dolad' },
    ];
  }
  const realmLabel =
    realm === 'real'
      ? 'Reálný svět'
      : realm === 'fantasy'
        ? 'Fantasy & mytologie'
        : realm === 'scifi'
          ? 'Sci-fi & vesmír'
          : realm === 'custom'
            ? 'Mé presety'
            : realm === 'set'
              ? 'Sety'
              : 'Zdroj';
  const allTiles = [
    ...REAL_WORLD_CATEGORY_TILES,
    ...FANTASY_CATEGORY_TILES,
    ...SCIFI_CATEGORY_TILES,
  ];
  const categoryLabel = category
    ? allTiles.find((t) => t.id === category)?.name ?? 'Kategorie'
    : 'Kategorie';

  if (stage === 'crossroads') {
    return [
      { label: 'Zdroj', state: 'active' },
      { label: 'Kategorie' },
      { label: 'Preset' },
      { label: 'Dolad' },
    ];
  }
  if (stage === 'categories') {
    return [
      { label: realmLabel, state: 'done' },
      { label: 'Kategorie', state: 'active' },
      { label: 'Preset' },
      { label: 'Dolad' },
    ];
  }
  // stage === 'preset-detail'
  // 9.4-dluh — Custom realm skipuje Kategorie stage → kratší stepper (3 kroky).
  if (realm === 'custom') {
    return [
      { label: realmLabel, state: 'done' },
      { label: 'Preset', state: 'active' },
      { label: 'Dolad' },
    ];
  }
  return [
    { label: realmLabel, state: 'done' },
    { label: categoryLabel, state: 'done' },
    { label: 'Preset', state: 'active' },
    { label: 'Dolad' },
  ];
}

function searchPlaceholder(
  realm: Realm | null,
  category: RealCategory | null,
): string {
  if (category === 'countries')
    return 'Hledej zemi nebo město… (např. „praha")';
  if (category === 'koppen')
    return 'Hledej klimatickou zónu… (např. „pouštní")';
  if (category === 'sea') return 'Hledej mořské prostředí…';
  if (category === 'extremes') return 'Hledej extrém… (např. „vostok")';
  if (realm === 'real') return 'Hledej v reálném světě…';
  return 'Hledej napříč všemi presety… (např. „praha", „les")';
}

// ── Static data: kategorie pro Reálný svět ─────────────────────────────

const COUNTRY_COUNT = (() => {
  let n = 0;
  for (const countries of Object.values(REAL_WORLD_CATALOG)) {
    for (const country of countries) {
      n += 1 + (country.cities?.length ?? 0);
    }
  }
  return n;
})();

const REAL_WORLD_CATEGORY_TILES: CategoryTile[] = [
  {
    id: 'countries',
    glyph: '🗺',
    name: 'Země & města',
    count: COUNTRY_COUNT,
    description:
      'Reálné průměrné teploty pro 7 kontinentů a stovky zemí i metropolí.',
    examples: 'Praha · Tokyo · Káhira · New York · São Paulo',
  },
  {
    id: 'koppen',
    glyph: '🌡',
    name: 'Klimatické zóny',
    count: ARCHETYPE_CATALOG.koppen.length,
    description:
      'Köppen-Geiger klasifikace — mírné kontinentální, středomořské, polární, pouštní atd.',
    examples: 'Mírné oceánské · Středomořské · Tundra · Tropy',
  },
  {
    id: 'sea',
    glyph: '🌊',
    name: 'Mořská prostředí',
    count: ARCHETYPE_CATALOG.sea.length,
    description:
      'Otevřený oceán, korálové atoly, severní moře, karibské vody, hluboké moře.',
    examples: 'Otevřený oceán · Atol · Severní moře',
  },
  {
    id: 'extremes',
    glyph: '⚡',
    name: 'Reálné extrémy',
    count: EXTREMES.length,
    description:
      'Skutečné rekordy — Vostok (-89 °C), Death Valley (+57 °C), Naica, Mariana Trench.',
    examples: 'Vostok · Death Valley · Naica · Cherrapunji',
  },
];

// ── Static data: kategorie pro Fantasy & Mytologie (9.4-II) ────────────

function countFantasyByCategory(
  cat:
    | 'literary'
    | 'mythological'
    | 'prehistoric'
    | 'steampunk'
    | 'horror'
    | 'aerial'
    | 'magical',
): number {
  // Naive count — fantasy presets mají id-prefix který odhaluje kategorii.
  // Plně testováno v presets.spec.ts.
  const prefixMap = {
    literary: [
      'middle-earth-',
      'westeros-',
      'essos-',
      'faerun-',
      'witcher-',
      'tamriel-',
    ],
    mythological: ['myth-'],
    prehistoric: ['prehistoric-'],
    steampunk: ['steampunk-'],
    horror: ['horror-'],
    aerial: ['aerial-'],
    magical: ['magical-'],
  };
  const prefixes = prefixMap[cat];
  return ARCHETYPE_CATALOG.fantasy.filter((p) =>
    prefixes.some((pref) => p.id.startsWith(pref)),
  ).length;
}

const FANTASY_CATEGORY_TILES: CategoryTile[] = [
  {
    id: 'fantasy-literary',
    glyph: '📚',
    name: 'Literární světy',
    count: countFantasyByCategory('literary'),
    description:
      'Středozem (Tolkien), Westeros (Martin), Faerůn (D&D), Witcher (Sapkowski), Tamriel (Bethesda).',
    examples: 'Mordor · Skyrim · Velen · Praha-like Heartlands',
  },
  {
    id: 'fantasy-mythological',
    glyph: '⚡',
    name: 'Mytologická / božská',
    count: countFantasyByCategory('mythological'),
    description:
      'Mytologické říše a domény bohů — Olymp, Asgard, Helheim, Hádes, Duat, Avalon.',
    examples: 'Olymp · Asgard · Helheim · Hádes · Duat · Avalon',
  },
  {
    id: 'fantasy-prehistoric',
    glyph: '🦴',
    name: 'Prehistorická',
    count: countFantasyByCategory('prehistoric'),
    description:
      'Vědecky podložené paleo-klima — křídové tropy, doba ledová, karbonský prales.',
    examples: 'Křídové tropy · Doba ledová · Karbon · Perm',
  },
  {
    id: 'fantasy-steampunk',
    glyph: '⚙',
    name: 'Steampunk / Viktoriánské',
    count: countFantasyByCategory('steampunk'),
    description:
      'Industriální mlhy, kyselé deště — Smog Londýn 1880, plynové ulice.',
    examples: 'Smog Londýn 1880 · Industriální fields',
  },
  {
    id: 'fantasy-horror',
    glyph: '🌑',
    name: 'Horror / Lovecraft',
    count: countFantasyByCategory('horror'),
    description:
      'Lovecraftian mlhy, kosmický horor — Innsmouth, Mountains of Madness, R’lyeh.',
    examples: 'Innsmouth · Antarktida MoM · R’lyeh · Arkham',
  },
  {
    id: 'fantasy-aerial',
    glyph: '☁',
    name: 'Vzdušné / Létající',
    count: countFantasyByCategory('aerial'),
    description:
      'Plovoucí ostrovy, stratosféra, vzdušná města — nízký tlak, jet stream.',
    examples: 'Floating ostrovy · Stratosféra · Columbia-like',
  },
  {
    id: 'fantasy-magical',
    glyph: '✨',
    name: 'Magická / Bioluminiscentní',
    count: countFantasyByCategory('magical'),
    description:
      'Magická prostředí — bouřkové zóny, bioluminiscentní džungle, krystalové pole.',
    examples: 'Bouřková zóna · Bio džungle · Fae plán · Krystaly',
  },
];

// ── Static data: kategorie pro Sci-fi & Vesmír (9.4-III) ───────────────

function countScifiByCategory(
  cat:
    | 'planetary'
    | 'exoplanetary'
    | 'cyberpunk'
    | 'stations'
    | 'ship-interiors'
    | 'ship-types'
    | 'eva',
): number {
  const prefixMap = {
    planetary: ['planet-'],
    exoplanetary: ['exo-'],
    cyberpunk: ['cyberpunk-'],
    stations: ['station-'],
    'ship-interiors': ['ship-crew-', 'ship-bridge', 'ship-engine-', 'ship-cargo-', 'ship-airlock', 'ship-eva-suit-', 'ship-hydroponics', 'ship-med-', 'ship-cryo-', 'ship-mess-'],
    'ship-types': ['ship-generation-', 'ship-mining-', 'ship-military-', 'ship-civilian-', 'ship-exploration', 'ship-cryo-haul'],
    eva: ['eva-'],
  };
  const prefixes = prefixMap[cat];
  return ARCHETYPE_CATALOG.scifi.filter((p) =>
    prefixes.some((pref) => p.id.startsWith(pref)),
  ).length;
}

const SCIFI_CATEGORY_TILES: CategoryTile[] = [
  {
    id: 'scifi-planetary',
    glyph: '🪐',
    name: 'Planetární tělesa',
    count: countScifiByCategory('planetary'),
    description:
      'Reálná NASA/ESA měření — Mars, Měsíc, Venuš, Titan, Europa, Enceladus, Io, Pluto, Jupiter.',
    examples: 'Mars · Měsíc · Titan · Europa · Pluto',
  },
  {
    id: 'scifi-exoplanetary',
    glyph: '🌠',
    name: 'Exoplanetární archetypy',
    count: countScifiByCategory('exoplanetary'),
    description:
      'Teoretické archetypy — tidally locked, eyeball planet, Hycean ocean, hot Jupiter.',
    examples: 'Proxima b · Hycean · Hot Jupiter · ISS dome',
  },
  {
    id: 'scifi-cyberpunk',
    glyph: '🌃',
    name: 'Cyberpunk / Urbanní',
    count: countScifiByCategory('cyberpunk'),
    description:
      'Acid rain, neonové smogy, korporátní HVAC — Neon City, Megacity smog, Korpo věže.',
    examples: 'Neon City · Megacity smog · Korpo věže',
  },
  {
    id: 'scifi-stations',
    glyph: '🛰',
    name: 'Vesmírné stanice',
    count: countScifiByCategory('stations'),
    description:
      'ISS, Mir, Skylab — reálná data + O’Neill cylinder, Stanford Torus (rotace gravity).',
    examples: 'ISS · Mir · Skylab · O’Neill · Stanford',
  },
  {
    id: 'scifi-ship-interiors',
    glyph: '🚪',
    name: 'Lodní interiéry',
    count: countScifiByCategory('ship-interiors'),
    description:
      'Per-room prostředí — kajuty, můstek, strojovna, hydroponics, med-bay, cryo-bay.',
    examples: 'Kajuty · Můstek · Strojovna · Cryo-bay',
  },
  {
    id: 'scifi-ship-types',
    glyph: '🛸',
    name: 'Typy lodí',
    count: countScifiByCategory('ship-types'),
    description:
      'Archetypy lodí — generation ship, mining vessel, military, civilian, exploration.',
    examples: 'Generation · Mining · Military · Civilian',
  },
  {
    id: 'scifi-eva',
    glyph: '👨‍🚀',
    name: 'EVA exteriéry',
    count: countScifiByCategory('eva'),
    description:
      'Reálné EVA mise — Apollo lunar, ISS orbital, Mars surface (DRA 5.0), asteroid.',
    examples: 'Apollo lunar · ISS orbital · Mars · Asteroid',
  },
];
