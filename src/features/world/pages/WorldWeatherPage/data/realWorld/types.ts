/**
 * Real-world weather catalog — typové definice.
 *
 * Struktura mirror staré DB c:/Matrix/Matrix/frontend/src/data/weatherData.ts,
 * ale s `readonly` markery (presety = immutable konstanty).
 *
 * `temps[]` = 12 měsíčních průměrných teplot (°C, Jan..Dec).
 * Std dev se NEukládá zde — doplňuje se v mapperu `countryToConfig.ts`
 * z Köppen zóny (modul `weatherSimulation/koppenStdDev`).
 */

export interface CityData {
  name: string;
  /** 12 měsíčních průměrů (°C). Optional — když chybí, použije se průměr země. */
  temps?: readonly number[];
}

export interface CountryData {
  name: string;
  /** 12 měsíčních průměrů (°C) — vždy povinné. */
  temps: readonly number[];
  /**
   * Města jako string (= jen název, fallback na country temps) nebo CityData
   * (město s vlastními teplotami).
   */
  cities?: ReadonlyArray<string | CityData>;
}

export interface RealWorldCatalog {
  [continent: string]: ReadonlyArray<CountryData>;
}
