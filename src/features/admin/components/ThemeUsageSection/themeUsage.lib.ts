/**
 * 20.6 — čistá analýza využití motivů/skinů (bez Reactu, snadno testovatelná).
 *
 * BE vrací syrové počty; tady je přes theme/skin registry proměníme na řádky
 * k vykreslení + spočítáme kandidáty na osekání. Klíčové rozlišení (spec §4):
 *  - `explicit` = vědomé volby (counts[id])
 *  - `noChoice` = dědí default → NENÍ „nevyužité"
 *  - kandidát na osekání = 0 vědomých voleb a motiv NENÍ default dimenze
 */
import { listThemes, getTheme, DEFAULT_THEME } from '@/themes/registry';
import { DIARY_SKINS } from '@/features/world/pages/CharacterDetailPage/diary-systems/skins/registry';
import { CHAT_SKIN_IDS } from '@/features/world/chat/skins/registry';
import type {
  ThemeUsageStats,
  ThemeUsageDimensionKey,
} from '../../api/themeUsage.types';

export interface UsageRow {
  id: string;
  label: string;
  /** Vědomé volby (`counts[id]`). */
  explicit: number;
  /** `explicit` + (default absorbuje `noChoice`). Pro řazení a šířku baru. */
  effective: number;
  /** Motiv, který „vlastní" děděné volby (jen platformový default). */
  isDefault: boolean;
  /** 0 vědomých voleb a není default → kandidát na osekání. */
  isCandidate: boolean;
  /** V DB, ale mimo aktuální nabídku registru (starý/smazaný). */
  isLegacy: boolean;
}

export interface DimensionView {
  key: ThemeUsageDimensionKey;
  title: string;
  /** „uživatelů" / „světů" / „členství". */
  unit: string;
  total: number;
  noChoice: number;
  noChoiceHint: string;
  rows: UsageRow[];
  candidateCount: number;
  /** Max `effective` pro šířku barů (min 1). */
  max: number;
}

export interface ThemeUsageView {
  generatedAt: string;
  dimensions: DimensionView[];
  /** Motivy/skiny, které NIKDO vědomě nepoužívá napříč místy, kde se nabízí. */
  fullyUnused: {
    themes: { id: string; label: string }[];
    skins: { id: string; label: string }[];
  };
}

interface DimConfig {
  key: ThemeUsageDimensionKey;
  title: string;
  unit: string;
  knownIds: readonly string[];
  label: (id: string) => string;
  /** ID, které absorbuje `noChoice` (jen kde je default jednoznačný). */
  absorbsNoChoiceId: string | null;
  noChoiceHint: string;
}

const diaryLabel = new Map<string, string>(
  DIARY_SKINS.map((sk) => [sk.id, `${sk.emoji} ${sk.label}`]),
);
const themeName = (id: string) => getTheme(id).name;

function buildConfig(): DimConfig[] {
  const worldThemeIds = listThemes('world').map((t) => t.id);
  const platformThemeIds = listThemes('platform').map((t) => t.id);
  const diarySkinIds = DIARY_SKINS.map((sk) => sk.id);
  return [
    {
      key: 'platformTheme',
      title: 'Motiv platformy (profil)',
      unit: 'uživatelů',
      knownIds: platformThemeIds,
      label: themeName,
      absorbsNoChoiceId: DEFAULT_THEME,
      noChoiceHint: `bez vlastní volby → výchozí „${themeName(DEFAULT_THEME)}"`,
    },
    {
      key: 'worldTheme',
      title: 'Motiv světa',
      unit: 'světů',
      knownIds: worldThemeIds,
      label: themeName,
      absorbsNoChoiceId: null,
      noChoiceHint: 'bez hodnoty (schéma světa zapisuje výchozí motiv)',
    },
    {
      key: 'memberTheme',
      title: 'Osobní motiv světa (per člen)',
      unit: 'členství',
      knownIds: worldThemeIds,
      label: themeName,
      absorbsNoChoiceId: null,
      noChoiceHint: 'bez volby → dědí motiv světa/PJ',
    },
    {
      key: 'diarySkin',
      title: 'Skin deníku',
      unit: 'členství',
      knownIds: diarySkinIds,
      label: (id) => diaryLabel.get(id) ?? id,
      absorbsNoChoiceId: null,
      noChoiceHint: 'bez volby → výchozí dle herního systému světa',
    },
    {
      key: 'chatSkin',
      title: 'Skin chatu',
      unit: 'členství',
      knownIds: CHAT_SKIN_IDS,
      label: themeName,
      absorbsNoChoiceId: null,
      noChoiceHint: 'bez volby → výchozí dle světa',
    },
  ];
}

/** Všechna registrovaná theme ID — pro rozpoznání legacy (mimo nabídku). */
const allThemeIds = new Set<string>(listThemes().map((t) => t.id));

function buildDimension(
  cfg: DimConfig,
  dim: ThemeUsageStats[ThemeUsageDimensionKey],
): DimensionView {
  const known = new Set(cfg.knownIds);

  const knownRows: UsageRow[] = cfg.knownIds.map((id) => {
    const explicit = dim.counts[id] ?? 0;
    const isDefault = id === cfg.absorbsNoChoiceId;
    return {
      id,
      label: cfg.label(id),
      explicit,
      effective: explicit + (isDefault ? dim.noChoice : 0),
      isDefault,
      isCandidate: explicit === 0 && !isDefault,
      isLegacy: false,
    };
  });

  // Hodnoty v DB mimo aktuální nabídku → legacy řádky (taky signál).
  const legacyRows: UsageRow[] = Object.keys(dim.counts)
    .filter((id) => !known.has(id))
    .map((id) => ({
      id,
      label: allThemeIds.has(id) ? `${themeName(id)} (mimo nabídku)` : id,
      explicit: dim.counts[id],
      effective: dim.counts[id],
      isDefault: false,
      isCandidate: false, // legacy neosekáváme jako „nevyužité", už není v nabídce
      isLegacy: true,
    }));

  const rows = [...knownRows, ...legacyRows].sort(
    (a, b) => b.effective - a.effective,
  );
  const max = Math.max(1, ...rows.map((r) => r.effective));
  const candidateCount = knownRows.filter((r) => r.isCandidate).length;

  return {
    key: cfg.key,
    title: cfg.title,
    unit: cfg.unit,
    total: dim.total,
    noChoice: dim.noChoice,
    noChoiceHint: cfg.noChoiceHint,
    rows,
    candidateCount,
    max,
  };
}

/**
 * „Plně nevyužité" = motiv/skin s 0 vědomými volbami napříč VŠEMI dimenzemi,
 * kde se nabízí (to je skutečný kandidát na osekání z registru):
 *  - platformové motivy: 0 v platformTheme (kromě defaultu)
 *  - světové motivy: 0 ve worldTheme + memberTheme + chatSkin dohromady
 *  - diary skiny: 0 v diarySkin
 */
function computeFullyUnused(data: ThemeUsageStats) {
  const worldThemeIds = listThemes('world').map((t) => t.id);
  const platformThemeIds = listThemes('platform').map((t) => t.id);

  const platformUnused = platformThemeIds.filter(
    (id) => id !== DEFAULT_THEME && (data.platformTheme.counts[id] ?? 0) === 0,
  );
  const worldUnused = worldThemeIds.filter(
    (id) =>
      (data.worldTheme.counts[id] ?? 0) +
        (data.memberTheme.counts[id] ?? 0) +
        (data.chatSkin.counts[id] ?? 0) ===
      0,
  );
  // Sjednocení (motiv „both" může být v obou seznamech) — bez duplicit.
  const themeIds = Array.from(new Set([...platformUnused, ...worldUnused]));
  const themes = themeIds.map((id) => ({ id, label: themeName(id) }));

  const skins = DIARY_SKINS.filter(
    (sk) => (data.diarySkin.counts[sk.id] ?? 0) === 0,
  ).map((sk) => ({ id: sk.id, label: `${sk.emoji} ${sk.label}` }));

  return { themes, skins };
}

/** Syrová BE statistika → hotová struktura k vykreslení. */
export function analyzeThemeUsage(data: ThemeUsageStats): ThemeUsageView {
  const config = buildConfig();
  return {
    generatedAt: data.generatedAt,
    dimensions: config.map((cfg) => buildDimension(cfg, data[cfg.key])),
    fullyUnused: computeFullyUnused(data),
  };
}
