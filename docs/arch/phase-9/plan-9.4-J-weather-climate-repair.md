# Plan 9.4-J — Repair klimatu pro starší weather generátory

**Spec:** [spec-9.4-J-weather-climate-repair.md](spec-9.4-J-weather-climate-repair.md)
**Status:** DRAFT — čeká souhlas.
**Velikost:** M (cca 8 souborů editováno, 0 vytvořeno, 3 nové testy).

---

## 1 — Pořadí změn (mergable per commit)

| Commit | Co | Files | Důvod oddělit |
|---|---|---|---|
| **C1** | BE: synth fallback + `climateModelMissing` flag | `interfaces/weather-generator.interface.ts`, `world-weather.service.ts` + spec | Defenzivní BE změna, ostrá oprava ihned účinná pro každý starý generátor. |
| **C2** | FE typy + warning banner v Edit modalu | `shared/types/index.ts` *(nebo lokální types)*, `WeatherGeneratorModal.tsx`, `.module.css` | UI safety: user **vidí**, že je generátor zkažený. |
| **C3** | FE repair flow (wizard merge mode) | `WeatherGeneratorModal.tsx`, `WeatherPresetWizard.tsx` (mode prop), CSS | Mergable po C2 — banner CTA potřebuje cíl. |
| **C4** | FE create guard + Preset tab default | `WeatherGeneratorModal.tsx` | Prevence nových rozbitých generátorů. |
| **C5** | Testy BE + FE | `*.spec.ts`/`*.spec.tsx` | Regression net. |
| **C6** | `mobil-desktop` audit + `napoveda` patch | `pages/HelpPage/sections/PagesSection.tsx` + screenshots | Závěr workflow. |

Vše půjde přímo na `main` (žádné feature větve dle [[feedback_work_on_main]]).

---

## 2 — Detail změn

### C1 — BE: synth fallback + flag

**`backend/src/modules/world-weather/interfaces/weather-generator.interface.ts`**
- Do `WeatherResult` přidat:
  ```ts
  /** 9.4-J — true když config nemá monthlyTemps; BE použil synth (tempMin+tempMax)/2 × 12 + defaultStdDev. */
  climateModelMissing?: boolean;
  ```

**`backend/src/modules/world-weather/world-weather.service.ts`**
- Opravit typo komentáře `\ 9.4-I` → `// 9.4-I` na ř. 442.
- Refactor větve [`L448-468`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-weather/world-weather.service.ts#L448-L468):
  ```ts
  const hasClimate = config.monthlyTemps && config.monthlyTemps.length > 0;
  const monthlyTemps = hasClimate
    ? config.monthlyTemps!
    : Array(12).fill((config.tempMin + config.tempMax) / 2);
  const monthsTotal = monthlyTemps.length;
  const monthIndex = calendarContext.monthIndex % monthsTotal;
  const result = generateTemperature({
    monthIndex,
    day: calendarContext.day,
    monthsTotal,
    monthlyTemps,
    monthlyStdDev: hasClimate ? config.monthlyStdDev : undefined,
    defaultStdDev: 4.0,
    seed: options.seed,
  });
  temperature = result.temperature;
  isAnomaly = result.isAnomaly;
  anomalyType = result.anomalyType;
  expectedAvg = result.expectedAvg;
  climateModelMissing = !hasClimate;   // ← nový lokální flag
  ```
- Dál v sestavení `WeatherResult` (kolem [`L545`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-weather/world-weather.service.ts#L545)) připojit `climateModelMissing` do return objektu.
- **Net effect**: starý Ghana generátor (tempMin:0, tempMax:25) bude generovat `temperature ≈ N(12.5, 4²)` = ~95 % v rozsahu 4.5..20.5°C. Pořád ne realistické pro Akkru, ale rozptyl klesne z [0..25] uniform na úzký Gauss kolem středu. **Plné řešení = user otevře repair.**

⚠️ **Pozn.**: synth NEPÍŠE do DB. Jen runtime sample. Tím garantujeme AK-5 (žádná tichá ztráta).

### C2 — FE warning banner

**`src/shared/types/index.ts`** *(nebo kde žije FE shadow `WeatherResult`)*
- Přidat `climateModelMissing?: boolean` do `WeatherResult` interface (parita s BE).

**`src/features/world/pages/WorldWeatherPage/modals/WeatherGeneratorModal.tsx`**
- Helper:
  ```ts
  const climateModelMissing = !config.monthlyTemps?.length;
  ```
- Nad `<Tabs>` přidat conditional `<Banner>`:
  ```tsx
  {isEdit && climateModelMissing && (
    <div className={s.climateWarning} role="status">
      <AlertTriangle size={16} aria-hidden />
      <div className={s.climateWarningBody}>
        <strong>Generátor nemá klimatický model.</strong>
        <span>Teplota se generuje jen jako šum kolem středu rozsahu —
          nezohledňuje sezónu ani místní klima.</span>
      </div>
      <Button size="sm" onClick={() => setActiveTab('preset')}>
        Opravit klimat
      </Button>
    </div>
  )}
  ```
- Klik na CTA jen přepne na Preset tab; samotná aplikace presetu = C3.

**`WeatherGeneratorModal.module.css`**
- `.climateWarning` — žluté pozadí (`var(--color-warning-bg, #fff7ed)`), border-left accent, flex row → na mobilu wrap (skill `mobil-desktop` ověří).

### C3 — Repair flow (wizard merge mode)

**`src/features/world/pages/WorldWeatherPage/modals/wizard/WeatherPresetWizard.tsx`**
- Přidat optional prop:
  ```ts
  /** 9.4-J — v repair módu wizard CTA label „Aplikovat klimat" + onApply nese merge intent. */
  mode?: 'create' | 'repair';
  ```
- Default `'create'`. Předat do `PresetListAndDetail` jako prop pro tlačítko label.

**`PresetListAndDetail.tsx`** *(soubor existuje, dohledat — řádek s "Použít" buttonem)*
- Pokud `mode === 'repair'` → label „Aplikovat klimat".

**`WeatherGeneratorModal.tsx`**
- Změnit `handleApplyPreset`:
  ```ts
  function handleApplyPreset(item: PresetItem) {
    const newConfig = item.toConfig();
    if (isEdit && climateModelMissing) {
      // Repair mode: merge jen climate-related fields, zachovej user-intent zbytek
      const shouldRecomputeRange =
        config.tempMin === 0 && config.tempMax === 25; // detekce „je to default"
      setConfig({
        ...config,
        monthlyTemps: newConfig.monthlyTemps,
        monthlyStdDev: newConfig.monthlyStdDev,
        climateZone: newConfig.climateZone,
        ...(shouldRecomputeRange
          ? { tempMin: newConfig.tempMin, tempMax: newConfig.tempMax }
          : {}),
      });
      toast.success(`Klimat „${item.displayName}" aplikován`);
    } else {
      // Create / explicit full replace
      setConfig(newConfig);
      if (!name.trim()) setName(item.defaultGeneratorName);
      toast.success(`Preset „${item.displayName}" načten`);
    }
    setActiveTab('basic');
  }
  ```
- `<WeatherPresetWizard … mode={isEdit && climateModelMissing ? 'repair' : 'create'} />`.

**Q1 řešení** (přepočet `tempMin/tempMax`): zatím implementuju automatickou heuristiku `=== 0/25`. **Žádný checkbox**, žádné UI klikání navíc — pokud user měl ručně 0/25, je to neodlišitelné od defaultu a repair to přepíše. Riziko nízké, alternativa = bloat UI. *(Pokud nesouhlasíš, řekni a přidám checkbox.)*

### C4 — Create guard + Preset tab default

**`WeatherGeneratorModal.tsx`**
- Default tab už **je** `'preset'` pro create (`useState(isEdit ? 'basic' : 'preset')`) — viz [L114](src/features/world/pages/WorldWeatherPage/modals/WeatherGeneratorModal.tsx#L114). Není třeba měnit. ✓
- Save guard v `handleSubmit`:
  ```ts
  if (!isEdit && !config.monthlyTemps?.length) {
    toast.error('Vyber preset nebo klikni „Prázdný formulář" pokud chceš generátor bez klimatu.');
    setActiveTab('preset');
    return;
  }
  ```
- „Prázdný formulář" tlačítko ([L218-222](src/features/world/pages/WorldWeatherPage/modals/WeatherGeneratorModal.tsx#L218-L222)) zůstává jako vědomá escape hatch — uživatel ho **musí** kliknout, aby získal config bez klimatu. `handleSkipWizard` označí config nějakým flagem? **Návrh: nový lokální state `acknowledgedEmptyConfig: boolean`**, který se nastaví v `handleSkipWizard` a save guard ho respektuje.
  ```ts
  const [acknowledgedEmptyConfig, setAcknowledgedEmpty] = useState(false);
  function handleSkipWizard() { setConfig(EMPTY_CONFIG); setActiveTab('basic'); setAcknowledgedEmpty(true); }
  // v guardu:
  if (!isEdit && !config.monthlyTemps?.length && !acknowledgedEmptyConfig) { … }
  ```

### C5 — Testy

**BE — `world-weather.service.spec.ts`**
- Nový test `describe('generate without monthlyTemps (9.4-J fallback)')`:
  - Setup: generator s `tempMin:0, tempMax:25, monthlyTemps: undefined`.
  - Run `generate()` se seedovaným RNG (`options.seed: 42`).
  - Assert: `temperature` v rozsahu `[0.5, 24.5]` (3σ od středu 12.5), result obsahuje `climateModelMissing: true`.

**FE — `WeatherGeneratorModal.spec.tsx`**
- Test 1: edit generator bez `monthlyTemps` → banner viditelný, CTA „Opravit klimat" přepne tab na Preset.
- Test 2: repair flow → vyber preset (mock `PresetItem`) → `onConfigChange` volán s merged configem (ostatní user-set hodnoty zachované, monthlyTemps doplněn).
- Test 3: create empty → save bez Preset/Prázdný formulář → toast error, nezavolá createMut.

**FE — `WeatherPresetWizard.spec.tsx`** *(pokud existuje, jinak přeskočit)*
- Mode 'repair' → tlačítko label „Aplikovat klimat".

### C6 — Mobil/desktop + nápověda

- Skill `mobil-desktop` na úpravu modalu (banner wrapping na 360px).
- Skill `napoveda` — do [HelpPage/sections/PagesSection.tsx](src/features/ikaros/pages/HelpPage/sections/PagesSection.tsx) doplnit kapitolu „Co když generátor počasí vrací nelogické teploty" + odkaz na repair.

---

## 3 — Riziková místa

| Riziko | Mitigace |
|---|---|
| Synth `(min+max)/2` může být pořád nereálný (Ghana 0..25 → 12.5°C průměr). | Banner v UI → user motivován k repair. Synth = bezpečnostní síť, ne řešení. |
| Repair přepíše tempMin/tempMax při shouldRecomputeRange. | Heuristika `=== 0/25` zachytí jen defaultní hodnoty. Uživatel s ručními hodnotami `5/35` nebude přepsán. |
| Acknowledgement flag `acknowledgedEmptyConfig` se ztratí při reload. | Modal je vždy fresh-mount (viz komentář [L160-162](src/features/world/pages/WorldWeatherPage/modals/WeatherGeneratorModal.tsx#L160-L162)) — flag stačí lokální. |
| BE `climateModelMissing` v response break-uje FE typy. | Optional pole `?: boolean` → zpětně kompatibilní. |

---

## 4 — Co nedělám

- ❌ DB migrace / fuzzy-match.
- ❌ Změna seed funkce pro nové světy ([service.ts L1208](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-weather/world-weather.service.ts#L1208) — seed dál vyrobí default 0..25 generátor; pokryje banner v UI). Pokud chceš seed opravit (= novým světům vyrobit hned správný klimat), je to samostatná iterace **9.4-K**.
- ❌ Hromadný repair pro Sety.
- ❌ Změna varianceModel `extremeRoll` (5% chance 2-3σ). Funguje správně, jen byl maskovaný uniform fallbackem.

---

## 5 — Hotovo když

- [ ] C1..C6 commitnuté na `main`.
- [ ] Manuální test na Ghana generátoru v Matrix worldu: před repair = banner viditelný, po repair = teploty 25-32°C v únoru.
- [ ] Lint/typecheck/testy zelené (FE + BE).
- [ ] Spec přepnutý na DONE, plan na DONE.
