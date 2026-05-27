# Spec 9.4-J — Repair klimatu pro starší weather generátory

**Status:** DRAFT — čeká souhlas.
**Velikost:** M (BE fallback + FE warning + repair flow + create guard, vše jeden zátah)
**Motivace (PJ):** Pro Ghanu 15. února v poledne padá náhodně 3°C i 20°C → z pohledu hráče nelogické. Příčina: starší generátor nemá `monthlyTemps`, BE spadne do uniform `randomBetween(tempMin, tempMax)`, který ignoruje sezónu i klima.

---

## 1 — Cíl

Zajistit, aby každý weather generátor produkoval **klimaticky věrohodné** teploty:

1. **Existující rozbité generátory** (bez `monthlyTemps`) musí jít opravit z UI.
2. **Žádný generátor nesmí dál degradovat na uniform random** — i bez `monthlyTemps` musí fallback respektovat alespoň `defaultStdDev` kolem konstantního průměru.
3. **Nové generátory** se nemůžou vyrobit bez klimatického modelu.

Out of scope:
- Migrace dat v DB (riziko tichého přepsání user-intentu).
- Změny seed dat pro nově vytvořené světy (oddělená iterace 9.4-K).
- UI redesign generátor karty.

---

## 2 — Pozadí (kořen problému)

### 2.1 Aktuální flow

[`world-weather.service.ts:442-468`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-weather/world-weather.service.ts#L442-L468):

```ts
if (config.monthlyTemps && config.monthlyTemps.length > 0) {
  // 9.4-I variance model: Gauss(expectedAvg, monthlyStdDev[monthIndex])
} else {
  // BC fallback — ignoruje datum, klima, vše
  temperature = this.randomBetween(config.tempMin, config.tempMax, 1);
}
```

Default config v [`WeatherGeneratorModal.tsx:58-60`](src/features/world/pages/WorldWeatherPage/modals/WeatherGeneratorModal.tsx#L58-L60) a BE seed [`world-weather.service.ts:1208-1209`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-weather/world-weather.service.ts#L1208-L1209) = `tempMin: 0, tempMax: 25` bez `monthlyTemps`.

### 2.2 Důsledek

- Akkra, únor, poledne → uniform na `[0, 25]` → P(3°C) = P(20°C) = stejná.
- Týká se všech generátorů vyrobených před 9.4-I nebo ručně přes modal bez výběru presetu.

---

## 3 — Akceptační kritéria

### AK-1 — BE fallback eliminuje uniform random

- **Když** se volá `generate()` na config bez `monthlyTemps` (nebo `length === 0`),
- **Pak** BE syntetizuje `monthlyTemps = Array(12).fill((tempMin + tempMax) / 2)` a `monthlyStdDev = undefined` (→ použije se `defaultStdDev: 4.0`),
- **A** výstup obsahuje pole `climateModelMissing: true` na vrcholu response (mimo `currentWeather`), aby FE mohl varovat.
- **Důsledek**: I starý Ghana generátor s `tempMin:0, tempMax:25` teď generuje teploty kolem **12,5°C ± ~4** (cca 5..20°C) místo úplně náhodných 0..25. Realistické pro Ghanu to není, ale rozptyl už nebude 17°C — bude ~8°C jako normální Gauss. **Plné řešení = user otevře repair v UI.**

### AK-2 — FE warning banner v Edit modalu

- **Když** otevře Edit existujícího generátoru, který nemá `monthlyTemps` (resp. `climateModelMissing` flag z BE),
- **Pak** se v hlavičce modalu zobrazí žlutý banner: „Tento generátor nemá klimatický model — generování je zhruba náhodné. Aplikuj reálný klimat nebo archetyp."
- **A** banner obsahuje primární CTA tlačítko **„Opravit klimat"** → otevře wizard (stejný jako Preset tab) v repair módu.

### AK-3 — Repair wizard

- **Když** user vybere z wizardu country/city/archetyp v repair módu,
- **Pak** se do aktuálního configu doplní pouze `monthlyTemps`, `monthlyStdDev`, `climateZone` (a případně `tempMin/tempMax` přepočtené z monthlyTemps ± 2σ, **pokud user neměl ručně editované hodnoty** — viz Q1 níže).
- **A** ostatní pole configu (název, weatherTypes, customFields, hazardy, wind/pressure/humidity range) zůstanou nedotčená — repair nesmí přepisovat user-intent v jiných oblastech.
- **A** po Apply zmizí warning banner, save funguje normálně.

### AK-4 — Nový generátor — Preset tab default

- **Když** otevře „Nový generátor" modal,
- **Pak** aktivní záložka je **Preset** (ne Základ).
- **A** save tlačítko je **disabled** dokud config nemá `monthlyTemps.length > 0` (nebo user vědomě klikne na „Vytvořit bez klimatu" v drobném sekundárním linku — escape hatch pro neznámé žánry).

### AK-5 — Žádná tichá ztráta dat

- **Existující generátory zůstávají v DB beze změny** dokud user ručně neklikne repair.
- BE fallback (AK-1) je jen runtime opatření, neukládá synth monthlyTemps do DB.

### AK-6 — Testy

- BE: `world-weather.service.spec.ts` rozšířit o test, že generator bez `monthlyTemps` & s `tempMin:0, tempMax:25` produkuje teplotu v rozsahu `12.5 ± 3σ` (cca `0.5..24.5`) **a** response má `climateModelMissing: true`.
- FE: `WeatherGeneratorModal.spec.tsx` rozšířit o:
  - render warning banneru když `climateModelMissing`/missing monthlyTemps.
  - repair flow: vyber preset → config.monthlyTemps doplněn, ostatní pole zachována.
  - nový generátor s prázdným configem → save disabled.

### AK-7 — Mobil/desktop + nápověda

- Banner i repair flow funkční na 360px i 1440px (skill `mobil-desktop`).
- Stránka `/ikaros/napoveda` doplněná o sekci „Co dělat když generátor produkuje nelogické teploty" (skill `napoveda`).

---

## 4 — Otevřené otázky

**Q1** — Při repair: má se `tempMin/tempMax` přepočítat z nových `monthlyTemps ± 2σ`, nebo zachovat user-hodnoty?
- *Návrh*: Zobrazit checkbox „Přepočítat tempMin/tempMax podle nového klimatu" defaultně zapnutý, pokud current `tempMin/tempMax` jsou rovny default (`0/25`); jinak defaultně vypnutý. *(Detekce „je to default" = strict equality na 0/25.)*

**Q2** — Co s `climateModelMissing` flagem — vrátit ho z `generate()` jako součást `WeatherGenerator` response, nebo přes separátní endpoint?
- *Návrh*: Součást `WeatherGenerator` response na **každém** `GET/generate` calls. Žádný extra endpoint. FE detekuje `!config.monthlyTemps?.length` lokálně i bez flagu — flag je jen pro debug/log v BE.

**Q3** — Repair pro generátory v "Setu" (multi-generator world default)?
- *Návrh*: Out of scope. Sety se opraví per-generator přes Edit, hromadný repair tool je 9.4-K.

---

## 5 — Hotovo když

- [ ] Všechny AK-1 až AK-7 splněny a manuálně ověřeny na Ghana generátoru ve worldu Matrix.
- [ ] Lint + typecheck + testy FE+BE zelené.
- [ ] Spec 9.4-J přepnut na APPROVED, plan-9.4-J vytvořen a implementován.
- [ ] Změny commit-nuté na `main` (žádné feature větve dle [[feedback_work_on_main]]).
