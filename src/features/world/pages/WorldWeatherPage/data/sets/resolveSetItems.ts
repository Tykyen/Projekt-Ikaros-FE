/**
 * 9.4 — resolver pro set items: presetId → WeatherGeneratorConfig.
 *
 * Vrací rozresolvované items připravené pro POST /weather-sets/:id/apply
 * (BE batch-vytvoří N generátorů). Unresolved presetIds (např. smazaný custom
 * preset) vrací separátně — UI ukáže warning.
 */
import { buildAllPresetItems } from '../../modals/wizard/buildPresetItems';
import type {
  CustomWeatherPreset,
  ResolvedSetItem,
  WeatherGeneratorSetItem,
} from '@/shared/types';

export interface ResolveResult {
  resolved: ResolvedSetItem[];
  /** PresetIds, které se nepodařilo namatchovat (např. smazaný custom preset). */
  unresolved: string[];
}

export function resolveSetItems(
  items: ReadonlyArray<WeatherGeneratorSetItem>,
  customPresets: ReadonlyArray<CustomWeatherPreset> = [],
): ResolveResult {
  const allPresets = buildAllPresetItems(customPresets);
  const byId = new Map(allPresets.map((p) => [p.id, p]));

  const resolved: ResolvedSetItem[] = [];
  const unresolved: string[] = [];

  for (const item of items) {
    const preset = byId.get(item.presetId);
    if (!preset) {
      unresolved.push(item.presetId);
      continue;
    }
    resolved.push({
      name: item.generatorName,
      description: item.description,
      config: preset.toConfig(),
    });
  }

  return { resolved, unresolved };
}
