import type { KoppenZone } from '@/features/world/lib/weatherSimulation';

/**
 * 9.4-I — Automaticky detekuje Köppen zónu z 12-měsíčních průměrných teplot.
 *
 * Heuristika podle zjednodušených pravidel Köppen-Geiger:
 * - průměr nejteplejšího měsíce > 22°C → potenciálně tropical/subtropical
 * - průměr nejchladnějšího měsíce < -3°C → potenciálně kontinentální nebo polární
 * - amplituda (max - min) → variability
 *
 * Bez údaje o srážkách je to **approximace** — fallback Cfb pro mírné případy.
 * Pro produkční přesnost (kontinentální vs. oceánské vs. monsoon) je potřeba
 * srážková data, která tu chybí.
 *
 * Source: Peel et al. 2007 + zjednodušené teplotní heuristiky.
 *
 * @param monthlyTemps 12-měsíční pole průměrných teplot (°C), Jan..Dec.
 *                    Pole jiné délky se použije tak jak je (min/max/avg/amplitude).
 * @returns Köppen kód.
 */
export function inferKoppenZone(monthlyTemps: readonly number[]): KoppenZone {
  if (monthlyTemps.length === 0) {
    return 'Cfb';
  }

  const max = Math.max(...monthlyTemps);
  const min = Math.min(...monthlyTemps);
  const avg = monthlyTemps.reduce((a, b) => a + b, 0) / monthlyTemps.length;
  const amplitude = max - min;

  // Polární — i nejteplejší měsíc pod 10°C
  if (max < 10) {
    return min < -30 ? 'EF' : 'ET';
  }

  // Tropy — i nejchladnější měsíc nad 18°C
  if (min >= 18) {
    if (amplitude < 3) return 'Af';
    if (amplitude < 6) return 'Am';
    return 'Aw';
  }

  // Subarktická tajga — extrémně studená zima, krátké léto.
  // Kontrola PŘED BWk/BSk aby Krasnoyarsk (min=-19) skončil v Dfc, ne v BWk.
  if (min < -15 && max < 22) {
    return 'Dfc';
  }

  // Horká poušť — extrémní letní maximum, vysoká roční průměrná
  if (max > 35 && avg > 18) {
    return 'BWh';
  }

  // Studená poušť — velký swing, nízká průměrná, mírnější zima než tajga
  if (avg < 10 && amplitude > 30 && min >= -15) {
    if (max < 25) return 'BWk';
    return 'BSk';
  }

  // Kontinentální horké léto — chlad. zima + horké léto.
  // Chicago typu: min ≈ -3, max ≈ 25. Použijeme min <= -3 (inclusive) místo strict.
  if (max >= 22 && min <= -3) {
    if (max >= 24) return 'Dfa';
    return 'Dfb';
  }

  // Subtropické vlhké — teplé léto, mírná zima
  if (max > 25 && min > -3 && avg > 14) {
    return 'Cfa';
  }

  // Středomořské (horké léto) — Csa: horké suché léto, mírná zima
  if (max > 25 && min > 0 && amplitude > 14 && avg > 15) {
    return 'Csa';
  }

  // Středomořské (teplé léto) — Csb: mírnější verze
  if (max > 17 && max <= 25 && min > 5 && avg > 12) {
    return 'Csb';
  }

  // Horká step / savana — vysoká průměrná teplota, středně variabilní
  if (avg > 15 && max > 25 && max <= 35) {
    return 'BSh';
  }

  // Default — mírné oceánské
  return 'Cfb';
}
