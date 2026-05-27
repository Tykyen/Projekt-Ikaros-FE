/**
 * 9.4-J — Merge logika pro repair existujícího generátoru bez klimatického modelu.
 *
 * Existující generátor (před 9.4-I nebo ručně bez presetu) nemá `monthlyTemps`,
 * BE pak generuje syntetický Gauss kolem středu rozsahu. Repair = uživatel
 * v Edit modalu vybere preset → tato funkce doplní jen klima-pole a zachová
 * ostatní user-set hodnoty (weatherTypes, customFields, wind/pressure/humidity, název).
 *
 * tempMin/tempMax přepočítáme jen pokud uživatel nikdy needitoval rozsah
 * (= je rovný default `0/25`). Pokud má ručně třeba `5/35`, neměníme.
 */
import type { WeatherGeneratorConfig } from '@/shared/types';

export function mergeRepairConfig(
  current: WeatherGeneratorConfig,
  next: WeatherGeneratorConfig,
): WeatherGeneratorConfig {
  const isDefaultRange = current.tempMin === 0 && current.tempMax === 25;
  return {
    ...current,
    monthlyTemps: next.monthlyTemps,
    monthlyStdDev: next.monthlyStdDev,
    climateZone: next.climateZone,
    ...(isDefaultRange
      ? { tempMin: next.tempMin, tempMax: next.tempMax }
      : {}),
  };
}
