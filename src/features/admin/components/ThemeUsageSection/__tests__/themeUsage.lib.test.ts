import { describe, it, expect } from 'vitest';
import { analyzeThemeUsage, type DimensionView } from '../themeUsage.lib';
import type { ThemeUsageStats } from '../../../api/themeUsage.types';

/** Prázdná dimenze — přepíšeme jen co test potřebuje. */
const empty = () => ({ total: 0, noChoice: 0, counts: {} as Record<string, number> });

function sample(): ThemeUsageStats {
  return {
    generatedAt: '2026-07-15T10:00:00.000Z',
    platformTheme: {
      total: 20,
      noChoice: 10, // dědí default 'modre-nebe'
      counts: { 'modre-nebe': 5, mesic: 3, staryskin: 2 }, // staryskin = legacy
    },
    worldTheme: {
      total: 7,
      noChoice: 0,
      counts: { ikaros: 4, fantasy: 2, 'modre-nebe': 1 }, // modre-nebe u světa = mimo nabídku
    },
    memberTheme: { total: 21, noChoice: 20, counts: { fantasy: 1 } },
    diarySkin: { total: 21, noChoice: 13, counts: { scifi: 8 } },
    chatSkin: { total: 21, noChoice: 20, counts: { western: 1 } },
  };
}

const dim = (v: ReturnType<typeof analyzeThemeUsage>, key: string): DimensionView =>
  v.dimensions.find((d) => d.key === key)!;
const row = (d: DimensionView, id: string) => d.rows.find((r) => r.id === id);

describe('analyzeThemeUsage (20.6)', () => {
  it('default motiv absorbuje noChoice do effective, ne do explicit', () => {
    const v = analyzeThemeUsage(sample());
    const modre = row(dim(v, 'platformTheme'), 'modre-nebe')!;
    expect(modre.isDefault).toBe(true);
    expect(modre.explicit).toBe(5);
    expect(modre.effective).toBe(15); // 5 vědomých + 10 děděných
    expect(modre.isCandidate).toBe(false); // default nikdy není kandidát
  });

  it('vědomě vybraný ne-default motiv není kandidát', () => {
    const v = analyzeThemeUsage(sample());
    const mesic = row(dim(v, 'platformTheme'), 'mesic')!;
    expect(mesic.explicit).toBe(3);
    expect(mesic.isCandidate).toBe(false);
    expect(mesic.effective).toBe(3); // ne-default noChoice nepohltí
  });

  it('motiv s 0 vědomými volbami (a není default) = kandidát', () => {
    const v = analyzeThemeUsage(sample());
    const slunce = row(dim(v, 'platformTheme'), 'slunce')!;
    expect(slunce.explicit).toBe(0);
    expect(slunce.isCandidate).toBe(true);
  });

  it('past: hodnota v DB mimo nabídku (scope) = legacy, ne kandidát', () => {
    const v = analyzeThemeUsage(sample());
    // 'staryskin' není v žádném registru
    const legacy = row(dim(v, 'platformTheme'), 'staryskin')!;
    expect(legacy.isLegacy).toBe(true);
    expect(legacy.isCandidate).toBe(false);
    expect(legacy.label).toBe('staryskin');
    // 'modre-nebe' u světa = existující motiv, ale mimo světovou nabídku
    const worldLegacy = row(dim(v, 'worldTheme'), 'modre-nebe')!;
    expect(worldLegacy.isLegacy).toBe(true);
    expect(worldLegacy.label).toContain('mimo nabídku');
  });

  it('řádky jsou seřazené sestupně dle effective', () => {
    const v = analyzeThemeUsage(sample());
    const rows = dim(v, 'platformTheme').rows;
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].effective).toBeGreaterThanOrEqual(rows[i].effective);
    }
    expect(rows[0].id).toBe('modre-nebe'); // effective 15 = nejvyšší
  });

  it('fullyUnused: světový motiv nevyužitý napříč world+member+chat', () => {
    const v = analyzeThemeUsage(sample());
    const ids = v.fullyUnused.themes.map((t) => t.id);
    // 'horor' nikdo nepoužil v žádné světové dimenzi → kandidát
    expect(ids).toContain('horor');
    // 'ikaros' je použit jako motiv světa → NENÍ plně nevyužitý
    expect(ids).not.toContain('ikaros');
    // 'western' je použit jako chat skin → NENÍ plně nevyužitý
    expect(ids).not.toContain('western');
    // 'fantasy' je v memberTheme → NENÍ plně nevyužitý
    expect(ids).not.toContain('fantasy');
  });

  it('fullyUnused: diary skin s 0 volbami je kandidát, scifi ne', () => {
    const v = analyzeThemeUsage(sample());
    const skinIds = v.fullyUnused.skins.map((sk) => sk.id);
    expect(skinIds).toContain('fantasy'); // diary fantasy nevyužit
    expect(skinIds).not.toContain('scifi'); // scifi má 8 voleb
  });

  it('robustnost: prázdná statistika → žádný pád, vše 0', () => {
    const v = analyzeThemeUsage({
      generatedAt: '2026-07-15T10:00:00.000Z',
      platformTheme: empty(),
      worldTheme: empty(),
      memberTheme: empty(),
      diarySkin: empty(),
      chatSkin: empty(),
    });
    expect(v.dimensions).toHaveLength(5);
    // default motiv není nikdy kandidát, i při 0
    expect(row(dim(v, 'platformTheme'), 'modre-nebe')!.isCandidate).toBe(false);
    // všechny diary skiny bez voleb → kandidáti
    expect(v.fullyUnused.skins.length).toBeGreaterThan(0);
  });
});
