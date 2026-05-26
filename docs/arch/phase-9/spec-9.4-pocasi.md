# Spec 9.4 — Počasí (`/svet/:worldSlug/pocasi`)

**Status:** DRAFT — čeká na souhlas
**Velikost:** L (FE-only, BE world-weather kompletní; ale velký dataset presetů + 3 sub-stránky + multi-generátor)
**Číslování:** 9.4 (původní) — kalendář-scalability 9.4 už hotov pod jiným souborem; tento spec doplňuje 9.4 Počasí z roadmap-fe.md:1533.

---

## 1 — Cíl

PJ světa potřebuje **simulovat počasí** v reálných i fantasy/sci-fi světech. BE world-weather (CRUD generátorů + generování + broadcast) je kompletní. Tento spec definuje **FE vrstvu**: stránka aktuálního počasí, správa generátorů, broadcast, **a knihovnu presetů** odvozenou ze staré databáze `C:/Matrix/Matrix`.

**Klíčový cíl, který odlišuje tuto featuru od BE-only přístupu:** nabídnout PJ **bohatou nabídku one-click presetů** (real-world země/města + odvozené archetypy), aby nemusel ladit ~25 parametrů ručně.

---

## 2 — Architektura presetů (dvouvrstvá A + B)

### 2.0 — Confidence & accuracy policy ⚠️ KRITICKÉ

**Princip:** PJ vidí v UI jen čistý český název + krátký popisek. **Žádné citace.** Ale **každý preset v kódu** má block comment s primary source a confidence level. To je audit trail pro maintainera, ne UX feature.

**5 úrovní confidence (`sourceLevel`):**

| Level | Význam | Příklady |
|---|---|---|
| **MEASURED** | Přímé in-situ měření | Mars REMS, Cassini Titan, ISS NASA-STD-3001, NOAA Vostok |
| **DOCUMENTED** | Explicit v primárním zdroji | Köppen-Peel 2007, Fonstad Atlas Middle-Earth, FRCS 3rd ed. |
| **ANALOGY** | Odvozeno z reálného analogu | Faerůn Underdark ≈ reálné hluboké jeskyně 13°C, Mordor ≈ Yellowstone caldera + sopečný popel |
| **INFERRED** | Odhad z popisu primárního zdroje | Rhûn step z Tolkien dopisů (popsáno, nezměřeno) |
| **FICTIONAL** | Čistá fikce bez reálného analogu | Magická bouřková zóna, fae plán |

**Pravidlo:** žádný preset nesmí být v repu bez `sourceLevel` v komentáři. Pokud při verifikaci nemám slušný zdroj, buď preset vyhodím, nebo ho označím FICTIONAL s odůvodněním parametrů.

**Příklad block commentu:**

```ts
/**
 * Mars — Gale Crater
 *
 * sourceLevel: MEASURED  (přímé měření in-situ)
 * source: NASA Curiosity REMS instrument (2012–present)
 *         Hassler et al. 2014, Science 343, Mars Climate Database
 *
 * Teploty: denní min/max -80°C / +20°C (Gale Crater, ekvator)
 *          sezonní: -127°C zima / +35°C léto
 * Tlak:    0.6 kPa (var. 0.4-0.8 kPa)
 * Atm.:    95% CO₂
 * Hazards: prachové bouře (8-měsíční cyklus)
 */
export const MARS_GALE_CRATER: WeatherPreset = { /* ... */ };
```

**V UI PJ vidí:** „Mars — Gale Crater" + popisek „Studené dny, mrazivé noci, prachové bouře" (1 věta).

### 2.1 — Zdroj dat

Stará databáze ze starého Matrix projektu:
- `C:/Matrix/Matrix/frontend/src/data/weatherData.ts` (1360 řádků) — 7 kontinentů, ~150 zemí, ~600 měst, každý s 12 měsíčními průměrnými teplotami
- `C:/Matrix/Matrix/frontend/src/services/weatherService.ts` (221 řádků) — generátorová logika (oktas, intensity, hazards)

⚠️ **Verifikace:** real-world katalog ze staré DB **musí být cross-checknut** proti Wikipedia climate boxes / Climate Atlas, ne slepě převzat. Pokud najdu chybnou teplotu, opravím.

### 2.2 — Vrstva A: Real-world katalog

**Cíl:** PJ s real-world světem klikne „Praha", má hotovo.

- Celá `weatherData.ts` zkopírovaná do FE jako `src/features/world/pages/WorldWeatherPage/data/realWorldPresets.ts`
- Strukturováno do **3 úrovní:** Kontinent → Země → Město
- Při výběru se `temps[]` (12 měsíců) namapuje na `tempMin/tempMax` generátoru (min = min × 0.85, max = max × 1.15 pro denní variabilitu)
- Country bez vybraného města = průměr země; s městem = městské upřesnění

### 2.3 — Vrstva B: Archetypy/biomy (17 kategorií, ~127 presetů)

**Cíl:** PJ s fantasy/sci-fi světem vybere archetyp, dostane plausibilní parametry. Plus 27 NPC zástupců reálných planetárních těles + stanic + lodí (sci-fi) odvozených z NASA/JPL/ESA dat.

| # | Kategorie | Počet | Iterace | Primary source |
|---|---|---|---|---|
| B-01 | Klimatické zóny (Köppen-Geiger) | 16 | 9.4-I | Peel et al. 2007, *Hydrol. Earth Syst. Sci.* |
| B-02 | Reálná planetární tělesa | 11 | 9.4-III | NASA/JPL/ESA missions (Curiosity, Cassini, Galileo, New Horizons, Juno, Venera) |
| B-03 | Teoretické exoplanetární | 5 | 9.4-III | Kepler/JWST data, exoplanet research papers |
| B-04 | Literární fantasy lokace | 28 | 9.4-II | Fonstad Atlas, FRCS, Martin world bible, Bethesda lore, Sapkowski |
| B-05 | Prehistorická prostředí | 4 | 9.4-II | Hay & Floegel 2012, Clark 2009, Berner 2003 |
| B-06 | Mořská prostředí | 6 | 9.4-I | WMO Sea State Code, NOAA buoys |
| B-07 | Mytologická / božská | 6 | 9.4-II | Hesiod, Eddas, Book of the Dead, keltské kroniky |
| B-08 | Cyberpunk / urbanní dystopie | 4 | 9.4-III | Air pollution data Beijing/Delhi/LA smog 1950s |
| B-09 | Steampunk / Viktoriánské | 3 | 9.4-II | Great Smog of London 1952, Victorian records |
| B-10 | Horror / Lovecraft | 4 | 9.4-II | Lovecraft 1936 + Byrd 1928-30 Antarktická expedice |
| B-11 | Vzdušné / Létající | 3 | 9.4-II | atmosférická data stratosféry + fictional |
| B-12 | Magické / Bioluminiscentní | 5 | 9.4-II | fiction + reálná bioluminiscence (firefly squid) |
| B-13 | Reálné extrémy | 7 | 9.4-I | Naica (García-Ruiz 2007), Vostok, Death Valley NOAA, Cherrapunji, dry valleys, Mariana, Yellowstone |
| B-14 | Vesmírné stanice | 5 | 9.4-III | NASA-STD-3001, RKK Energia, O'Neill 1974 *Physics Today* |
| B-15 | Lodní interiéry (per-room) | 10 | 9.4-III | NASA-STD-3001, Apollo Ops Handbook, ISS specs |
| B-16 | Typy lodí | 6 | 9.4-III | Project Orion (Dyson, Taylor 1958), Daedalus (BIS 1973-78), NASA NIAC |
| B-17 | EVA exteriéry | 4 | 9.4-III | Apollo/ISS/Mars DRA 5.0, NIAC asteroid retrieval |

**Detailní seznam presetů v jednotlivých kategoriích bude v `data/presets/<kategorie>/` souborech s block-comment `sourceLevel` u každého.**

#### B-01 Köppen klimatické zóny (16) — vždy `DOCUMENTED`
Cfb mírné oceánské, Csa středomořské, Cfa subtropické vlhké, Dfa kontinent. teplé, Dfb kontinent. mírné, Dfc subarktická tajga, ET tundra, EF polární, BWh poušť horká, BWk poušť studená, BSh polosuchá horká, BSk polosuchá studená, Aw savana, Am monzun, Af tropické vlhké, ETh vysokohorské.

#### B-02 Reálná planetární tělesa (11) — všechny `MEASURED`
Mars (celá planeta), Mars: Gale Crater, Mars: polární čepička, Měsíc (Luna), Venuš, Titan, Europa, Enceladus, Io, Pluto, Jupiter (atmosféra).

#### B-03 Teoretické exoplanetární (5) — mix `DOCUMENTED` + `INFERRED`
Tidally locked (Proxima b), Eyeball planet, Hycean ocean world (Kepler-138 c/d), Hot Jupiter, ISS-like kupole stanice.

#### B-04 Literární fantasy lokace (28) — mix `DOCUMENTED` + `ANALOGY` + `INFERRED`
- **Středozem (7):** Shire, Mordor, Forochel, Harad, Rohan, Rivendell, Mirkwood
- **Westeros + Essos (8):** Beyond the Wall, North, Riverlands, Dorne, Iron Islands, Volantis, Slaver's Bay, Asshai
- **Faerůn (5):** Heartlands, Frozenfar, Anauroch, Calimshan, Underdark
- **Witcher (3):** Velen, Skellige, Toussaint
- **Tamriel (5):** Skyrim, Hammerfell, Cyrodiil, Black Marsh, Morrowind

#### B-14 Vesmírné stanice (5) — všechny `MEASURED` nebo `DOCUMENTED`
ISS (NASA-STD-3001 Vol 2), Mir, Skylab, O'Neill cylinder (NASA Ames 1975), Stanford Torus.

#### B-15 Lodní interiéry (10) — všechny `DOCUMENTED`
Crew quarters, velitelský můstek, strojovna, cargo hold, airlock, EVA suit (vnitřek), hydroponics, med-bay, cryo-bay, mess hall.

#### B-16 Typy lodí (6) — mix `DOCUMENTED` + `ANALOGY`
Generation ship (Orion/Daedalus), mining vessel, military cruiser, civilian transport, exploration ship, cryo-haul refugee ark.

#### B-17 EVA exteriéry (4) — všechny `MEASURED`
Apollo lunar EVA, ISS orbital EVA, Mars surface EVA (DRA 5.0), Asteroid EVA.

*Plné detaily zbylých kategorií (B-05 až B-13) viz `data/presets/<kategorie>/` po implementaci, sourceLevel block comments.*

### 2.4 — Architektura souborů presetů

📚 **Co to znamená:** *FE preset architektura* zde znamená, že presety jsou TypeScript moduly přibalené do bundlu, ne v MongoDB. Stejný pattern jako 9.3-F-I kalendářové presety (memory `project_calendar_presets_architecture.md`). PJ klikne, formulář se předvyplní, pak může uložit/upravit → BE uloží jen výsledný `WeatherGeneratorConfig`.

```
src/features/world/pages/WorldWeatherPage/data/
├── realWorld/
│   ├── index.ts                    # export REAL_WORLD_CATALOG
│   ├── europe.ts                   # ~40 zemí + města
│   ├── asia.ts                     # ~45 zemí
│   ├── africa.ts                   # ~35 zemí
│   ├── americas.ts                 # severní + střední + jižní
│   ├── oceania.ts                  # ~8 zemí
│   └── countryToConfig.ts          # mapper: CountryData → WeatherGeneratorConfig
├── archetypes/
│   ├── index.ts                    # export ARCHETYPE_CATALOG
│   ├── climates.ts                 # 16 klimatických zón
│   ├── fantasy.ts                  # 7 fantasy archetypů
│   └── scifi.ts                    # 4 sci-fi archetypy
└── presets.spec.ts                 # každý preset musí valid-vat proti config schema
```

### 2.5 — Mapper real-world → BE config

```ts
function countryToConfig(country: CountryData, city?: CityData): WeatherGeneratorConfig {
  const temps = city?.temps ?? country.temps; // 12 měsíčních průměrů
  const climateZone = inferKoppenZone(temps); // odvodí Cfb / Csa / Dfb / atd.
  const stdDevDefaults = KOPPEN_STDDEV[climateZone];
  return {
    tempUnit: 'C',
    monthlyTemps: temps, // 12 průměrů
    monthlyStdDev: stdDevDefaults,  // 12 odchylek (z Köppen zóny)
    monthlyExtremes: deriveHistoricExtremes(temps, climateZone),
    climateZone, // Köppen kód (Cfb, Dfb, atd.) — hidden v UI, ovlivňuje Markov + variance
    weatherTypes: weatherTypesForZone(climateZone), // 7 typů s pravděpodobnostmi
    windMin: 0, windMax: 40, windGustMultiplier: 1.6,
    pressureMin: 990, pressureMax: 1030,
    humidityMin: 30, humidityMax: 95,
    customFields: hazardFieldsForZone(climateZone), // mlha/ledovka/atd dle zóny
  };
}
```

⚠️ **Pozor:** mapper musí být **deterministický** (stejný vstup → stejný config). Pokud bychom dělali Math.random() v mapperu, ztratíme schopnost reprodukovat. Variabilita patří do generování, ne do mapování.

### 2.6 — Variance & anomaly model ⚠️ KRITICKÉ

**Princip:** Reálné počasí má denní výkyvy, roční anomálie a persistenci. Generování není čistá random — je to **statistický model** kalibrovaný per Köppen zóna.

#### 2.6.1 — Denní teplotní variabilita

Místo single avg teploty má každý preset `monthlyStdDev[12]` (typická odchylka per měsíc). Generování:

```ts
function generateTemperature(monthIndex: number, day: number, config: WeatherGeneratorConfig): number {
  const monthlyAvg = interpolateMonthly(config.monthlyTemps, monthIndex, day);
  const stdDev = config.monthlyStdDev[monthIndex];

  // Gaussian distribution
  const z = gaussianRandom(); // ~N(0, 1)
  const variance = z * stdDev;

  // Extrémy: 5% dní má >2σ shift
  if (Math.random() < 0.05) {
    const sign = Math.random() > 0.5 ? 1 : -1;
    const extremeShift = sign * stdDev * (2 + Math.random()); // 2-3 σ
    return Math.round(monthlyAvg + variance + extremeShift);
  }

  return Math.round(monthlyAvg + variance);
}
```

#### 2.6.2 — Per-Köppen-zone std dev defaults

| Köppen | Klima | Std dev | Důvod |
|---|---|---|---|
| Af, Am | Tropy vlhké | ±1.5°C | Stabilní (mořský/lesní efekt) |
| Aw | Savana | ±2.5°C | Suchá/vlhká sezona variability |
| BWh | Poušť horká | ±5-6°C | Day-night swing |
| BWk | Poušť studená | ±6°C | Day-night + sezonní |
| BSh, BSk | Polopouštní | ±5°C | Středně variabilní |
| Csa, Csb | Středomořské | ±3°C | Mírné |
| Cfa | Subtropické vlhké | ±3.5°C | Středně |
| Cfb | Mírné oceánské | ±3°C | Mořský efekt = stabilní |
| Dfa | Kontinentální teplé | ±4.5°C | Větší swing |
| Dfb | Kontinentální mírné | ±5°C | (Praha-like) |
| Dfc | Subarktická tajga | ±6°C | Velké výkyvy |
| ET | Tundra | ±7°C | Polární variabilita |
| EF | Polární | ±8°C | Extrémní |

**Speciální (mimo Köppen):**
- Mars / Měsíc / vesmírná tělesa: ±15°C+ (dle NASA measurements)
- Magické / fantasy chaos: ±10°C
- Stanice / kupole: ±0.5°C (řízeno HVAC)

#### 2.6.3 — Markov persistence weather type

Počasí má paměť — slunečný den nepřechází na déšť instantly. 2D matrix per zóna:

```ts
// Příklad: mírné kontinentální (Cfb/Dfb)
const PERSISTENCE_CONTINENTAL = {
  clear:  { clear: 0.65, cloudy: 0.25, rain: 0.08, storm: 0.02 },
  cloudy: { clear: 0.30, cloudy: 0.40, rain: 0.25, storm: 0.05 },
  rain:   { clear: 0.20, cloudy: 0.35, rain: 0.40, storm: 0.05 },
  storm:  { clear: 0.30, cloudy: 0.35, rain: 0.30, storm: 0.05 },
  // řádky musí sčítat = 1
};
```

Implementace: BE `WorldWeatherService.generate()` si přečte `prevWeatherType` z `currentWeather` → použije matrix pro zóny → výsledek = nový type. Pokud `currentWeather === null` → fallback k weatherTypes probabilities (cold start).

#### 2.6.4 — Anomaly flagging

```ts
export interface WeatherResult {
  // ... existing
  isAnomaly: boolean;            // |temp - monthly_avg| > 2 * stdDev
  anomalyType?: 'heat_wave' | 'cold_snap' | 'severe_storm' | null;
}
```

**UI dopad:** anomálie zobrazena jako chip „🔥 Vlna veder" / „🥶 Mrazivá vlna" / „⛈ Silná bouře" v hazards row karty.

#### 2.6.5 — FE preview mock = mirror BE logiky

`usePreviewWeather(config, monthIndex)` musí používat **stejnou logiku** jako BE (gaussian variance, Markov persistence, extrémy), jinak preview neodpovídá realitě. Pro deterministic preview (audit trail) seed = `hash(configId + monthIndex)`.

Sdílený soubor:
```
src/features/world/lib/weatherSimulation/
├── gaussianRandom.ts       # Box-Muller transform
├── markovTransition.ts     # weather type transitions
├── varianceModel.ts        # temp variance + extremes
└── presetSimulator.ts      # preview entry point (=BE mirror)
```

⚠️ **Maintenance burden:** BE i FE musí mít **synchronizovaný kód** pro variance. Rozhodnutí 2026-05-26: **duplicita + parity test gate** (varianta E). Monorepo migrace (varianta A-3) je naplánována jako samostatná budoucí fáze ([plan-monorepo-migration.md](../plan-monorepo-migration.md)) — vyžaduje user akce (GitHub repo creation, CI/CD koordinace), které nemůže Claude udělat sám.

**Sync workflow:**
- BE je master pro variance logiku
- Po každé změně v BE: `npm run sync-simulation-to-fe` (skript zkopíruje do FE)
- Parity test gate v CI obou repos chytá drift

---

## 3 — UI scope

### 3.1 — Stránka `/svet/:worldSlug/pocasi` (9.4a + 9.4c)

**Layout:** grid karet generátorů (responsive — 1 sloupec mobil, 2 tablet, 3 desktop). Plus **„+" karta jako poslední tile** v gridu (visual affordance pro tvorbu) + tlačítko „+ Nový" v headeru.

**Drag-to-reorder generátorů (PJ+):**
- Karty jsou drag-handle-able (decorativní úchop top-left nebo celá karta v "edit mode")
- Pořadí uloženo v `localStorage`: klíč `weather-order:<worldId>:<userId>` → array of generator IDs
- Žádné BE změny — per-user, per-svět pořadí
- Hráč nemá drag, vidí default order (BE `createdAt` asc)
- ⚠️ Dluh: sdílené pořadí napříč PJ (vyžaduje BE `displayOrder` field)

**Karta generátoru:**
```
┌─────────────────────────────────────┐
│ ☀️ Hlavní město          [⋮ kebab] │
│ ─────────────────────────────────── │
│      22°C  Slunečno                 │
│      Vítr: 8 km/h, nárazy 15        │
│      Tlak: 1018 hPa (stoupá)        │
│      Vlhkost: 45%                   │
│      🟡 Mlha (extra)                │
│ ─────────────────────────────────── │
│ „Slunce zalévá ulice…" (narrative) │
│ ─────────────────────────────────── │
│ [Vygenerovat]  [Broadcast]          │
└─────────────────────────────────────┘
```

**Kebab menu (PJ+):** Upravit / Smazat / Ručně nastavit počasí

**Prázdný stav:** Pokud `currentWeather === undefined` → karta s textem „Zatím nevygenerováno" + tlačítko „Vygenerovat".

**Bez generátoru:** Pokud svět nemá žádný generátor → empty-state s velkým tlačítkem „+ Nový generátor" (PJ+) nebo informativní text „PJ ještě nenastavil počasí" (Hráč).

### 3.1.1 — Weather-responsive theming karty

Každá karta má **subtle atmospheric tint** podle `currentWeather.weatherType`. Skin-respectful — barvy modifikují jen background přes `mix-blend-mode: screen` / `multiply`, accent z skinu zůstává.

| Weather type | Card BG | Particles | Glow |
|---|---|---|---|
| `clear` (slunečno) | lighter — sun glow top-right (#ffd166 18%) | žádné | warm |
| `cloudy` (oblačno) | darker — šedý radial overlay | žádné | neutral |
| `rain` (déšť) | mírně tmavší + diagonal rain pattern | **animované rain particles** (8-12 spans) | cold blue |
| `storm` (bouře) | tmavý + purple thunder radial | **occasional lightning flash** (každých 6-10s, 80ms duration) | electric purple |
| `snow` (sníh) | lighter + white spots | **animované snow particles** (15-20 spans, slow drift) | crisp white |
| `fog` (mlha) | větší `backdrop-filter: blur(8px)` na bg overlay | mírné drifting wisps | dim |

**Implementace:**
- CSS data attribute `data-weather="<type>"` na `.card` root
- Particle animations CSS-only (keyframes), Motion lib není potřeba
- `prefers-reduced-motion: reduce` → particles + lightning vypnuto, jen statický tint zůstává

### 3.2 — Modal „Vytvořit / Upravit generátor" (9.4b)

**3 taby:**
1. **Preset** — wizard: vybrat zdroj
   - „Reálný svět" → Kontinent → Země → (volitelně Město) → tlačítko „Použít"
   - „Archetyp" → kategorie (Klimat. zóna / Fantasy / Sci-fi) → konkrétní archetyp → „Použít"
   - „Prázdný" → vyplň ručně
2. **Základ** — Name, Description, tempMin/Max + unit, windMin/Max + gustMultiplier
3. **Pokročilé** — pressureMin/Max, humidityMin/Max, weatherTypes (7 typů s probabilitou), customFields

**Po výběru presetu** se taby Základ + Pokročilé předvyplní; PJ může upravit, pak Uložit.

### 3.3 — Modal „Ručně nastavit počasí"

Pro PJ, který chce overrider — formulář s WeatherResult fields (temp, weatherType, cloudiness, precipitation, wind, pressure, humidity, narrativeText, extras).

### 3.4 — Broadcast modal (9.4c)

Po kliknutí „Broadcast" na kartě:
- Cíl: dropdown „Chat kanál" (seznam chat-channels světa) / „Mapa" (jen jeden flag)
- Volitelně vlastní zpráva nad weather block
- Tlačítko „Odeslat"

BE: `POST /worlds/:worldId/weather-generators/:id/broadcast` s `BroadcastWeatherDto`.

---

## 4 — Role gating

| Akce | Hráč | PomocnyPJ | PJ | Admin |
|---|---|---|---|---|
| Číst stránku počasí | ✅ | ✅ | ✅ | ✅ |
| Vytvořit generátor | ❌ | ✅ | ✅ | ✅ |
| Upravit generátor | ❌ | ✅ | ✅ | ✅ |
| Smazat generátor | ❌ | ❌ | ✅ | ✅ |
| Vygenerovat počasí | ❌ | ✅ | ✅ | ✅ |
| Ručně nastavit | ❌ | ✅ | ✅ | ✅ |
| Broadcast | ❌ | ✅ | ✅ | ✅ |

📚 **Co to znamená:** PomocnyPJ může všechno krom mazání — stejný pattern jako 9.1 (game events), 9.5 (news). Konzistence.

---

## 5 — BE integrace (existující endpointy + 2 nová rozšíření)

### 5.1 — Existující BE (žádné změny)

| Endpoint | Použití |
|---|---|
| `GET /worlds/:worldId/weather-generators` | Seznam karet |
| `GET /worlds/:worldId/weather-generators/:id` | Detail (modal edit) |
| `POST /worlds/:worldId/weather-generators` | Vytvořit |
| `PUT /worlds/:worldId/weather-generators/:id` | Upravit |
| `DELETE /worlds/:worldId/weather-generators/:id` | Smazat |
| `POST /worlds/:worldId/weather-generators/:id/generate` | Vygenerovat |
| `PUT /worlds/:worldId/weather-generators/:id/current` | Ručně nastavit |
| `POST /worlds/:worldId/weather-generators/:id/broadcast` | Broadcast |
| `WS event: weather.updated` | Live update (BE už emituje, FE subscribe) |

### 5.2 — BE rozšíření pro 9.4-I

**(1) `WeatherGenerator.displayOrder` field**

```ts
// schemas/weather-generator.schema.ts
@Prop({ default: 0, type: Number, index: true }) displayOrder: number;

// interfaces/weather-generator.interface.ts
export interface WeatherGenerator {
  // ... existing fields
  displayOrder: number; // 0-based, default = createdAt order
}
```

**Migrace:** existující dokumenty dostanou `displayOrder = índex_dle_createdAt` (jednorázový skript při deploy).

**`GET /weather-generators`** vrátí seřazené `.sort({ displayOrder: 1, createdAt: 1 })`.

**Nový endpoint `PUT /worlds/:worldId/weather-generators/reorder`** (PomocnyPJ+):
```ts
@Body() dto: { orderedIds: string[] }
// validace: orderedIds.length === počet generátorů světa, všechny existují, žádné duplicity
// efekt: updateMany s odpovídajícím displayOrder dle pozice v orderedIds
```

**(2) Generování si načte `worldSettings.calendarSlug` (z 9.2/9.3)**

V `WorldWeatherService.generate()`:
- Načti `worldSettings = await this.worldsService.getSettings(worldId)`
- Pokud `worldSettings.calendarSlug != null` → načti `CalendarConfig` (přes 9.3 service) → urči aktuální „měsíc" světa dle `worldSettings.currentInGameDate` (nebo default 1. měsíc)
- Použij `monthIndex` + `monthsTotal` pro sezónní variabilitu generování (lerp teploty mezi `tempMin/tempMax` dle pozice v ročním cyklu)
- Pokud `calendarSlug == null` → fallback Gregorian (current real-world month)

**WeatherResult rozšíření:**
```ts
export interface WeatherResult {
  // ... existing
  calendarMonth?: { name: string; index: number; total: number } | null;
  // null = Gregorian fallback, populated = custom calendar month info
}
```

⚠️ **Pozor:** tohle udělá BE generování dependent na 9.2/9.3 service. Musíme přidat `WorldsModule` (settings) a `WorldCalendarModule` (config) jako dependency `WorldWeatherModule`. BE testy musí pokrýt: bez calendar slug, s gregorian, s custom 13-month kalendářem.

### 5.3 — FE: WS subscribe na `weather.updated`

BE už emituje `weather.updated` event (`{ worldId, generatorId, currentWeather }`). FE potřebuje:
- V `useWeatherGenerators(worldId)` query: socket subscribe na room `world:<worldId>:weather`
- Při příchozím eventu: cache patch (`queryClient.setQueryData`) → karta se okamžitě překreslí
- Při unmount: socket unsubscribe

**UX dopad:** PJ broadcastuje → ostatní uživatelé v stejném světě (jiný tab/zařízení) okamžitě vidí novou kartu bez refreshe.

---

## 6 — Hooks (React Query)

```
src/features/world/api/useWeatherGenerators.ts
├── useWeatherGenerators(worldId)              # list query
├── useWeatherGenerator(worldId, id)           # detail
├── useCreateWeatherGenerator(worldId)         # mutation
├── useUpdateWeatherGenerator(worldId)         # mutation
├── useDeleteWeatherGenerator(worldId)         # mutation
├── useGenerateWeather(worldId)                # mutation (POST /generate)
├── useSetCurrentWeather(worldId)              # mutation (PUT /current)
└── useBroadcastWeather(worldId)               # mutation (POST /broadcast)
```

**Invalidace:** všechny mutace invalidují `['weather-generators', worldId]`.

---

## 7 — Routing + navigace

- Route: `/svet/:worldSlug/pocasi` v [router.tsx](src/app/router.tsx) — vedle existující `/svet/:worldSlug/akce`, `/svet/:worldSlug/novinky`
- Item v world nav (sidebar / topbar): „Počasí" s ikonou (lucide: `CloudSun` nebo `Cloud`)
- Page header: H1 „Počasí" + tlačítko „+ Nový generátor" (PJ+)

---

## 8 — Testy

**Unit:**
- `presets.spec.ts` — každý preset (real-world + archetyp) validuje proti BE `WeatherGeneratorConfig` shape (Zod schema mirror)
- `countryToConfig.spec.ts` — deterministický mapper (input → output stabilní)
- `useWeatherGenerators.spec.tsx` — CRUD mutace, invalidace

**Component:**
- `WeatherGeneratorCard.spec.tsx` — render karty s/bez currentWeather, kebab role-gating, prázdný stav
- `WeatherGeneratorModal.spec.tsx` — taby, předvyplnění presetem, validace
- `WorldWeatherPage.spec.tsx` — multi-generator grid, role gating

---

## 9 — Mimo rozsah / dluhy (přes skill `dluh`)

1. **Automatické generování po herním dnu** — vyžaduje BE scheduler napojený na 9.2 kalendář. Manuální generování stačí jako MVP.
2. **Historie počasí** — BE nepamatuje minulé `currentWeather` (přepisuje se). Pokud chceme „včerejší počasí", potřebuje BE persistovat snapshot.
3. **WS live update** — BE emituje `weather.updated`, ale FE 9.4 napojuje jen po refresh. Live socket update doplníme v 10.2 (mapa) nebo samostatným dluhem.
4. **Preset library v admin panelu** — pokud by user chtěl globální custom presety (sdílené napříč světy), to by byla samostatná featura.
5. **Map integration** — broadcast „na mapu" jako kosmetická feature; vyžaduje 10.2.

---

## 10 — Závislosti / návaznosti

- **Žádná BE změna** — opravdu jen FE.
- Reuse: `Button`, `Modal`, `ConfirmDialog`, `Spinner`, `useUploadImage` (×), `WorldContext`, `currentUserAtom`.
- Ikony: `lucide-react` (CloudSun, Wind, Droplets, Thermometer, Gauge, Cloud, …).

---

## 11 — Akceptační kritéria

- [ ] PJ vytvoří generátor přes preset „Praha" → 2 kliky → uloženo
- [ ] PJ vytvoří generátor přes archetyp „Mlžné prokleté lesy" → 3 kliky → uloženo
- [ ] PJ vygeneruje počasí → karta se updatne (toast „Počasí vygenerováno")
- [ ] PJ ručně override → toast „Počasí nastaveno"
- [ ] PJ broadcastuje do chat-kanálu → message v chatu obsahuje weather block
- [ ] Hráč vidí stránku, ale nevidí kebab menu / tlačítka manage
- [ ] Multi-generátor: svět se 3 generátory zobrazí 3 karty v gridu
- [ ] Prázdný stav (žádný generátor) — empty state s CTA (PJ+) / informací (Hráč)
- [ ] Mobil layout 1 sloupec, desktop 3 sloupce
- [ ] `napoveda` rozšířena o „Počasí" sekci v Herních nástrojích

---

## 12 — Rozhodnutí (potvrzeno uživatelem)

| # | Rozhodnutí | Volba |
|---|---|---|
| 1 | Pojmenování | České + sub-text reálného analogu („Mírné oceánské — *jako Dublin*") |
| 2 | Default generátor | Prázdné — PJ vytvoří první ručně |
| 3 | Broadcast „na mapu" | UI placeholder, BE flag, FE mapy číst v 10.2 |
| 4 | Počet archetypů v MVP | Rozděleno do 3 iterací (viz §13) |
| 5 | Citace zdrojů v UI | NE — schované, jen v kódu jako block-comment |
| 6 | sourceLevel taxonomy | MEASURED / DOCUMENTED / ANALOGY / INFERRED / FICTIONAL |
| 7 | Save-as-custom-preset | Dluh, ne MVP (BE komplikace) |
| 8 | Favorites generátorů | Dluh, ne MVP |
| 9 | Preview „trial run" | FE-side mock generátor (B varianta, žádné BE změny) |
| 10 | Automatické generování | Dluh — vyžaduje BE scheduler + 9.2 napojení |
| 11 | Multi-generátor | ANO — grid karet, PJ může mít sever+jih+město |
| 12 | BE změny povoleny | ANO — displayOrder field + reorder endpoint + calendar integration; ne all-in |
| 13 | Variance model | Gaussian variance per měsíc, Markov persistence weather type, 5% extrémy s anomaly flag |
| 14 | Drag-to-reorder | BE `displayOrder` field — sdílené pořadí napříč PJ (lepší než localStorage) |
| 15 | Calendar integration | BE generování si načte `worldSettings.calendarSlug` → custom kalendář ovlivňuje měsíce + sezónní variabilitu |
| 16 | WS live update | FE subscribe na BE `weather.updated` event (BE už emituje) |

---

## 13 — Sub-iterace (kompletní sub-kroky, memory `feedback_no_debt` splněno)

### 🌍 9.4-I — Reálný svět (MVP, ~3 dny)

**Scope:**
- Vrstva A: real-world katalog (~810 zemí + měst + verifikace proti Climate Atlas)
- Vrstva B: B-01 Köppen (16) + B-06 Mořská (6) + B-13 Reálné extrémy (7)
- **UI komplet:** route `/svet/:slug/pocasi`, grid karet, modal (3 taby), preset wizard (3 rozcestí + search), broadcast modal, ručně nastavit, role gating
- **Hooks:** 8 React Query hooks
- **Tests:** unit (presets validace, deterministic mapper, hooks) + component (Card, Modal, Page)
- **napoveda:** sekce „Počasí" v Herních nástrojích
- **roadmap:** [x] 9.4-I

**Definition of Done:**
- PJ s reálným světem otevře `/svet/:slug/pocasi`, klikne „+ Nový generátor" → vybere „Reálný svět" → „Evropa" → „Česko" → „Praha" → 2 trial preview rolly → Uložit → karta v gridu zobrazí current weather po prvním „Vygenerovat"
- Multi-generátor: PJ může mít „Sever Čech" + „Jih Čech" zároveň
- Hráč vidí stránku ale nevidí kebab/tlačítka manage
- Mobil 1 sloupec, desktop 3 sloupce

### 🐉 9.4-II — Fantasy & Mytologie (~2 dny)

**Scope (53 presetů, jen rozšíření katalogu — UI z -I):**
- B-04 Literární fantasy (28) + B-05 Prehistorická (4) + B-07 Mytologická (6) + B-09 Steampunk (3) + B-10 Horror/Lovecraft (4) + B-11 Vzdušné (3) + B-12 Magické/Bioluminiscentní (5)
- Každý preset block-comment s sourceLevel
- Tests: presets.spec.ts rozšířen
- napoveda update (zmínka o nových kategoriích)
- roadmap: [x] 9.4-II

**Definition of Done:**
- PJ s fantasy světem vybere „Středozem — Mordor" v 3 kliknutích, dostane plausibilní parametry s sopečným popelem a vyšší teplotou
- Search „mor" najde Mordor + mořská prostředí (oba relevantní)

### 🚀 9.4-III — Sci-fi & Vesmír (~2 dny)

**Scope (45 presetů, jen rozšíření katalogu):**
- B-02 Planetární (11) + B-03 Exoplanetární (5) + B-08 Cyberpunk (4) + B-14 Stanice (5) + B-15 Lodní interiéry (10) + B-16 Typy lodí (6) + B-17 EVA exteriéry (4)
- Každý preset s `MEASURED`/`DOCUMENTED` source levelem (čistá fikce minimální)
- Tests + napoveda + roadmap

**Definition of Done:**
- PJ s vesmírnou kampaní vybere „Mars: Gale Crater" → reálná Curiosity REMS data v parametrech
- PJ s lodním sezením vybere „Strojovna / engine room" → vyšší teplota, hluk extras

---

## 14 — UX pravidla pro wizard (KRITICKÉ pro orientaci PJ)

Wizard se 937 presetů nesmí PJ zahltit. Konkrétní pravidla:

### 14.1 — 3 rozcestí karty (vstup)

První obrazovka wizardu = 3 velké karty:
- **🌍 Reálný svět** — „Reálné země a města Země"
- **🐉 Fantasy & mytologie** — „Literární světy, mytologie, magická prostředí" *(deaktivováno do 9.4-II)*
- **🚀 Sci-fi & vesmír** — „Planety, stanice, vesmírné lodi" *(deaktivováno do 9.4-III)*

### 14.2 — Search bar nahoře

Fuzzy search napříč všemi presety: „praha" → Praha + Pražská poušť (analog), „mor" → Mordor + mořská prostředí.

### 14.3 — Druhá úroveň: kategorie jako dlaždice

Po výběru rozcestí — vizuální dlaždice s ikonou + popisem + počtem („Klimatické zóny — 16 typů — Mírné kontinentální, Středomořské, Pouštní…").

### 14.4 — Třetí úroveň: preset s preview kartou

Konkrétní presety s mini-display:
```
┌──────────────────────────────────┐
│ Mírné oceánské                   │
│ Jako Dublin nebo Londýn          │
│ ─────────────────────────────── │
│ 5–17°C  Vlhko 70-90%  Vítr      │
│ ─────────────────────────────── │
│ [Náhled] [Použít]                │
└──────────────────────────────────┘
```

### 14.5 — Trial preview před commit (s návazností na kalendář světa)

PJ klikne „Náhled" → FE-side mock generátor vrátí 3 sample rolly → PJ vidí, jestli mu preset sedí, než klikne „Použít". **Žádné BE volání** (memory FE-only).

**Návaznost na kalendář světa (9.2/9.3):**
- **Default** (svět bez custom kalendáře): Gregorian měsíce — *Leden / Červenec / Extrém*
- **Pokud svět má custom kalendář** (přes `useWorldCalendarConfig()`):
  - Použij **měsíce z konfigurace** — vyber 3 reprezentativní (např. první měsíc, prostřední, poslední) nebo 2 protiklady + extrém
  - Příklad fantasy kalendář (Forgotten Realms): „Hammer / Eleasis / Extrém" místo „Leden / Červenec / Extrém"
- **Opt-in toggle v generátor configu:** „Synchronizovat s kalendářem světa"
  - Zaškrtnuto → preview + budoucí generování používá kalendář světa pro sezónní variabilitu
  - Nezaškrtnuto → univerzální 12-měsíční cyklus (real-world Gregorian)
- Toggle default: **zapnuto** pokud svět má custom kalendář, jinak vypnuto

**Implementace:**
- Hook: `useTrialMonths(worldId)` vrací `[Month, Month, Month]` — 3 reprezentativní měsíce dle world calendar nebo Gregorian default
- Hook: `usePreviewWeather(config, month)` — FE-side mock, vrací `WeatherResult` pro daný měsíc
- Žádné BE volání, deterministický (seed = config hash + month index)

⚠️ **Dluh:** Plné napojení na herní čas (generování po každém herním dni dle kalendáře) je dluh — vyžaduje BE scheduler. MVP používá kalendář jen pro **trial preview** a **sezónní variabilitu** generování (jaký „měsíc" je teď určuje PJ ručně, nebo se odvodí ze světa aktuálního in-game date).

### 14.6 — Recently used

Top 3 naposledy použité presety v rychlém přístupu nad rozcestí. Persisted v `localStorage` (per-user, per-prohlížeč).

### 14.7 — Preset = startovací bod

Po „Použít" se VŠE předvyplní → tab Základ + Pokročilé jsou editovatelné. PJ může:
- Přejmenovat („Praha" → „Moje vlastní Praha")
- Upravit jakýkoli parametr
- Smíchat presety (vzít temperatury z A, hazardy z B)

### 14.8 — Jazyk

- **Žádný žargon v primárním UI** — „Köppen Cfb" ❌ → „Mírné oceánské" ✅
- **Sekundární info** ve sub-textu („— *jako Dublin*")
- **„Pokročilé" tab schovat za toggle** — PJ začátečník vidí jen Základ + Preset

---

## 15 — Schválení

Spec je hotový s rozhodnutími. Postup:

1. **Update roadmap-fe.md** — sub-iterace 9.4-I/II/III místo původních 9.4a/b/c
2. **`frontend-design` skill** — audit vizuálního layoutu pro 9.4-I (stránka + wizard)
3. **`plan-9.4-I-pocasi.md`** — impl. plán pro MVP iteraci
4. **Kód** — implementace 9.4-I dle plánu
