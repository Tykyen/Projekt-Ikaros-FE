# Spec 9.3-followup — Historické kalendáře (databáze 20 presetů) + konverze

**Status:** APPROVED (Q1–Q5 uzavřeny 2026-05-25) — návazné na 9.3 Timeline.
**Velikost:** XXL (3 iterace + Iter V přesný čínský bonus, FE-heavy + BE engine rozšíření + 22 preset dat)
**Motivace (PJ):** „Bylo by docela i fajn, kdyby existovala databáze existujících kalendářů z minulosti a ty jsme dali jako možnost se jich držet a případně upravit." + „Hodilo by se, aby se to dokázalo přepočítat, kdyby bylo potřeba." Dataset 20 kalendářů + referenční datum 25. 5. 2026 poskytnut.

---

## 1 — Cíl

PJ při vytváření kalendáře v `CalendarConfigsPage` může zvolit z **20 preset šablon** historických/moderních kalendářů místo „Prázdný" startu. Preset vyplní `months[]`, `daysOfWeek[]`, `celestialBodies[]`, `seasons[]`, `epochOffset` a `hoursPerDay` reálnými historickými hodnotami; PJ může upravit.

**Druhý cíl (volitelný):** Inline **konvertor** v UI — na timeline kartě a v dashboardech zobrazit primární datum + tlačítko „Převést do…", které popupne datum ve všech ostatních aktivních kalendářích světa.

---

## 2 — Rozdělení do iterací

| Iterace | Obsah | Velikost | Engine závislost |
|---|---|---|---|
| **9.3-F-I** | 10 stable kalendářů (solar + lunar fixní 12-měsíc) + wizard v `CalendarConfigsPage` + calendar selector v `CreateWorldPage` (Q1) + inline konvertor na timeline kartě (Q3) | XL | Žádná — engine existuje |
| **9.3-F-II** | 4 lunisolární — Hebrew (Metonic), Chinese-Simple (Metonic aproximace), Babylonian (Metonic), Greek Attic (Metonic) — vyžaduje engine rozšíření o **intercalary month** | XL | BE engine + FE picker logic |
| **9.3-F-III** | 6 speciálních — Mayan (GMT), Aztec, Roman republican (zpětné dny), French Revolutionary (10h dekáda), Cotsworth (13×28), World Calendar — vyžadují **vlastní engine variant** přes `CalendarKind` enum | XL | Per-preset specifika |
| **9.3-F-V (bonus po F-III)** | `chinese-precise` — přesný čínský kalendář s true sun/moon ephemerides (Q2 — alternativa k zjednodušenému z F-II) | L | Astro engine lib (`astronomy-engine` npm nebo vlastní VSOP87 implementace) |

---

## 3 — Iterace 9.3-F-I — 10 stable kalendářů

### 3.1 — Seznam (vše solární nebo lunární s fixní strukturou 12 měsíců)

| # | Slug | Název | Typ | Měsíců | Dní v týdnu | Rok | Letopočet |
|---|---|---|---|---|---|---|---|
| 1 | `gregorian` | Gregoriánský | solar | 12 | 7 | 365.2425 | CE / AD |
| 2 | `julian` | Juliánský | solar | 12 | 7 | 365.25 | CE / AD (jul.) |
| 3 | `solar-hijri` | Perský / Solar Hidžra | solar | 12 | 7 | 365.2422 | SH (622 CE = 1 SH) |
| 4 | `saka` | Indický národní (Saka) | solar | 12 | 7 | 365.25 | Saka (78 CE = 1 Saka) |
| 5 | `ethiopian` | Etiopský | solar | 13 (12×30 + 5/6) | 7 | 365.25 | AM (7–8 let za Gregorian) |
| 6 | `coptic` | Koptský | solar | 13 (12×30 + 5/6) | 7 | 365.25 | AM (284 CE = 1 AM) |
| 7 | `buddhist-thai` | Buddhistický (thajský) | solar | 12 | 7 | = Gregorian | BE (Gregorian + 543) |
| 8 | `egyptian-civil` | Staroegyptský civilní | solar | 13 (12×30 + 5) | 10 (dekáda) | 365 fix | regnal years |
| 9 | `holocene` | Holocénní | solar | 12 | 7 | = Gregorian | HE (Gregorian + 10000) |
| 10 | `islamic-hijri` | Islámský / Hidžra | lunar | 12 | 7 | ~354.367 | AH (622 CE = 1 AH) |

📚 **Co je „lunar":** rok ≈ 354 dní (12 × ~29.53), proto měsíce „cestují" oproti ročním obdobím ~10–11 dní/rok. Žádné solární korekce.

### 3.2 — Preset data shape

Soubor: `src/shared/lib/calendarEngine/presets.ts`

```ts
import type { CalendarConfig } from './types';

export interface CalendarPreset {
  /** Stejný jako CalendarConfig.slug — unique v rámci světa. */
  slug: string;
  /** Display name v wizardu. */
  name: string;
  /** Krátký popis pro picker UI. */
  description: string;
  /** Kategorie pro grouping v UI. */
  category:
    | 'soucasne-civilni'
    | 'soucasne-nabozenske'
    | 'historicky'
    | 'alternativni';
  /** Shape pro CalendarConfig (bez `id` — vytvoří se při insertu). */
  template: Omit<CalendarConfig, 'id'>;
  /** Optional `note` — varování pro PJ (např. „lunisolar, posouvá se"). */
  note?: string;
}

export const CALENDAR_PRESETS: readonly CalendarPreset[] = [
  // Iterace I — 10 stable
  GREGORIAN_PRESET,
  JULIAN_PRESET,
  SOLAR_HIJRI_PRESET,
  SAKA_PRESET,
  ETHIOPIAN_PRESET,
  COPTIC_PRESET,
  BUDDHIST_THAI_PRESET,
  EGYPTIAN_CIVIL_PRESET,
  HOLOCENE_PRESET,
  ISLAMIC_HIJRI_PRESET,
  // Iterace II — 4 lunisolární
  // HEBREW_PRESET, CHINESE_PRESET, BABYLONIAN_PRESET, GREEK_ATTIC_PRESET
  // Iterace III — 6 speciálních
  // MAYAN_PRESET, AZTEC_PRESET, ROMAN_REPUBLICAN_PRESET,
  // FRENCH_REVOLUTIONARY_PRESET, COTSWORTH_PRESET (alias INTERNATIONAL_FIXED)
];
```

### 3.3 — Příklad preset definice (Solar Hijri)

```ts
const SOLAR_HIJRI_PRESET: CalendarPreset = {
  slug: 'solar-hijri',
  name: 'Perský / Solar Hidžra',
  description:
    'Vysoce přesný solární kalendář v Íránu a Afghánistánu. Rok začíná na Nourúz (jarní rovnodennost).',
  category: 'soucasne-civilni',
  template: {
    slug: 'solar-hijri',
    name: 'Perský / Solar Hidžra',
    hoursPerDay: 24,
    daysOfWeek: [
      'došanbe',     // pondělí
      'sešanbe',     // úterý
      'čaháršanbe',
      'pandžšanbe',
      'džome',       // pátek (svátek)
      'šanbe',       // sobota
      'yekšanbe',    // neděle
    ],
    months: [
      { name: 'farvardín',   daysCount: 31 },
      { name: 'ordíbehešt',  daysCount: 31 },
      { name: 'chordád',     daysCount: 31 },
      { name: 'tír',         daysCount: 31 },
      { name: 'mordád',      daysCount: 31 },
      { name: 'šahrívar',    daysCount: 31 },
      { name: 'mehr',        daysCount: 30 },
      { name: 'ábán',        daysCount: 30 },
      { name: 'ázar',        daysCount: 30 },
      { name: 'dej',         daysCount: 30 },
      { name: 'bahman',      daysCount: 30 },
      { name: 'esfand',      daysCount: 29 }, // 30 v přestup
    ],
    celestialBodies: [
      // Reálný Měsíc (jen jeden, jako default — PJ může přidat fantasy).
      {
        id: 'moon',
        name: 'Měsíc',
        orbitalPeriodDays: 29.5306,
        color: '#c0c8d0',
        epochOffset: 0,
      },
    ],
    seasons: [
      { id: 'jaro',  name: 'Jaro',  startMonthIndex: 0, startDay: 1, color: '#7bd389' },
      { id: 'leto',  name: 'Léto',  startMonthIndex: 3, startDay: 1, color: '#e8c44d' },
      { id: 'pdz',   name: 'Podzim', startMonthIndex: 6, startDay: 1, color: '#c47a3b' },
      { id: 'zima',  name: 'Zima', startMonthIndex: 9, startDay: 1, color: '#7aa6c4' },
    ],
    // 25. 5. 2026 = 4. chordád 1405 SH → epochOffset spočítáme tak,
    // aby `fromAbsDay(absDay(25.5.2026 gregorian), config) = {1405, 2, 4}`.
    // Konkrétní číslo doplnit při implementaci (závisí na World.timelineEpoch).
    epochOffset: 0, // TODO calibrate during impl
  },
  note:
    'Esfand má 30 dní v perském přestupném roce (cyklus 33 let — výjimky vůči Gregorianu).',
};
```

⚠️ **`epochOffset` calibrace:** každý preset musí mít `epochOffset` spočítaný tak, aby konverze `25. 5. 2026 gregorian → preset` vyšla na dataset hodnoty od PJ. Calibrace = jednorázový skript při psaní presetu, ne za runtime.

### 3.4 — Wizard v `CalendarConfigsPage`

**Dnešní stav:** klik „+ Přidat kalendář" → modal s prázdným formulářem (slug, name).

**Nový stav:** klik „+ Přidat kalendář" → modal s **2 kroky**:

```
KROK 1 — Výběr šablony
  ┌─────────────────────────────────────────────┐
  │ ○ Prázdný kalendář                          │
  │   Začni od nuly, sám definuj měsíce/dny.   │
  ├─────────────────────────────────────────────┤
  │ Současné civilní                            │
  │ ○ Gregoriánský        (12 měs., 7 dní)      │
  │ ○ Juliánský           (12 měs., 7 dní)      │
  │ ○ Perský/Solar Hidžra (12 měs., 7 dní)      │
  │ ○ Indický Saka        (12 měs., 7 dní)      │
  │ ○ Etiopský            (13 měs., 7 dní)      │
  │ ○ Koptský             (13 měs., 7 dní)      │
  │ ○ Buddhistický (thaj.) (12 měs., 7 dní)     │
  │ ─────                                       │
  │ Současné náboženské                         │
  │ ○ Islámský/Hidžra     (lunární, 12 měs.)    │
  │ ─────                                       │
  │ Historické                                  │
  │ ○ Staroegyptský civilní (13 měs., 10 dní)   │
  │ ─────                                       │
  │ Alternativní                                │
  │ ○ Holocénní (HE)      (= Gregorian + 10000) │
  └─────────────────────────────────────────────┘
  [Dalším krokem dostane PJ pre-fillnutý formulář]

KROK 2 — Identita (pre-filled)
  Slug:     [gregorian-cz   ] (PJ může změnit)
  Název:    [Gregoriánský   ]
  Popis:    (z preset.description)
  [Vytvořit] [Zpět]
```

Po vytvoření → klasický `CalendarConfigEditor` s pre-naplněnými všemi sekcemi (Identita / Hodiny / Týden / Měsíce / Nebeská tělesa / Sezóny / EpochOffset). PJ upraví dle libosti.

### 3.5 — Konflikt slugu

Pokud preset slug už existuje ve světě (např. `gregorian` je seedován), wizard prefixuje custom slug (`gregorian-2` nebo `gregorian-cz`). PJ může upravit v kroku 2.

### 3.6 — Acceptance criteria 9.3-F-I

1. Soubor `src/shared/lib/calendarEngine/presets.ts` s 10 preset objekty.
2. Každý preset má spočítaný `epochOffset` tak, aby pro `World.timelineEpoch = 0` (= 1. 1. 2000 Gregorian) konverze odpovídala datasetu od PJ.
3. `CalendarConfigEditor` „+ Přidat kalendář" → dvoukrokový modal.
4. Krok 1 grupuje presety podle kategorií (3 grupy + „Prázdný").
5. Preset description tooltip / inline help text.
6. Krok 2 pre-fillne slug + name; PJ může změnit.
7. Po vytvoření se editor otevře s plnými daty preset.
8. Slug konflikt → auto-suffix `-2`, `-3`, …
9. BE žádná změna (přijímá CreateCalendarConfigDto stejně jak dnes).
10. Unit testy: každý preset musí mít validní shape (slug non-empty, months > 0, daysOfWeek > 0, seasons platí proti months).
11. Calibration testy: pro každý preset `formatFantasyDate(absDayOf(25.5.2026 gregorian), preset)` matchne dataset od PJ (±0 dní, ±1 den pro lunární kde závisí na pozorování).

---

## 4 — Iterace 9.3-F-II — 4 lunisolární

📚 **Co je lunisolární:** Měsíce sledují Měsíc (~29.5 dní), ale rok je udržován v souladu se sluncem **vkládáním přestupných měsíců** (intercalary month) v určitých letech. Příklad: Židovský `adar I` + `adar II` v přestupném roce.

### 4.1 — Engine rozšíření

Současný `MonthDef` má jen `{ name, daysCount }`. Pro lunisolární je potřeba:

```ts
// Návrh — rozšíření CalendarConfig (BE + FE shared)
interface MonthDef {
  name: string;
  daysCount: number;
  /** 9.3-F-II — pokud true, měsíc se vkládá jen v přestupných letech (intercalary). */
  isIntercalary?: boolean;
}

interface LunisolarRule {
  /** 9.3-F-II — pravidlo pro určení přestupného roku. */
  type: 'metonic-19' | 'chinese-soulgo' | 'fixed-pattern';
  /** Pro `metonic-19`: list pozic 1–19, např. [3,6,8,11,14,17,19]. */
  leapYearsInCycle?: number[];
  /** Index `isIntercalary: true` měsíce, který se vkládá. */
  intercalaryMonthIndex?: number;
}

interface CalendarConfig {
  // … existující fields
  lunisolar?: LunisolarRule;
}
```

### 4.2 — 4 lunisolární presety

| # | Slug | Název | Pravidlo |
|---|---|---|---|
| 11 | `hebrew` | Židovský | Metonic 19-letý cyklus, `adar I` přestupný |
| 12 | `chinese` | Čínský | Vlastní algoritmus (24 solárních termínů + lunace) — komplikované, **zjednodušíme na Metonic aproximaci** |
| 13 | `babylonian` | Babylonský | Metonic 19-letý cyklus (pozdější forma) |
| 14 | `greek-attic` | Řecký / Attický | Metonic 19-letý cyklus |

⚠️ **Čínský zjednodušení:** přesný čínský kalendář vyžaduje astronomické výpočty (true sun, true moon). Pro fantasy svět je Metonic aproximace OK; PJ může upravit po importu.

### 4.3 — Acceptance criteria 9.3-F-II

1. Engine rozšíření o `MonthDef.isIntercalary` + `CalendarConfig.lunisolar`.
2. `toAbsDay`/`fromAbsDay` respektují `lunisolar.leapYearsInCycle` (přidají intercalary month v daných letech).
3. 4 nové presety v `presets.ts`.
4. Wizard krok 1 grupa „Současné náboženské" + „Historické" rozšířena.
5. Calibration testy.
6. Migration BE: stávající `WorldCalendarConfig` v DB nemá field `lunisolar` → null. Žádná migrace.

---

## 5 — Iterace 9.3-F-III — 6 speciálních

| # | Slug | Název | Specifika | Postup |
|---|---|---|---|---|
| 15 | `mayan` | Mayský | 3 paralelní cykly (Tzolk'in 260, Haab 365, Long Count) — žádný „year/month/day" shape | **Engine variant** — `CalendarKind.MAYAN` + speciální shape |
| 16 | `aztec` | Aztécký | 2 cykly (Tonalpohualli 260, Xiuhpohualli 365) + 52letý svazek | **Engine variant** — `CalendarKind.AZTEC` |
| 17 | `roman-republican` | Římský republikánský | Zpětný počet (Kalendae, Nonae, Idus), 8-denní tržní nundinae | **Engine variant** — `CalendarKind.ROMAN_INVERSE_DAYS` |
| 18 | `french-revolutionary` | Francouzský revoluční | 12×30 + 5/6 epagomenálních, **10-denní dekáda** místo týdne, 10h v dni (decimal time) | Solar + `hoursPerDay: 10` + `daysOfWeek: 10 items` |
| 19 | `cotsworth` | Mezinárodní pevný / Cotsworth | 13×28 + 1/2 mimo-týdenních dnů | **Engine variant** — mimo-týdenní dny (`extraDays: number[]`) |
| 20 | `world-calendar` | Světový kalendář | 12 měsíců, 4 čtvrtletí (31/30/30), World Day mimo týden | **Engine variant** — mimo-týdenní dny |

📚 **„Engine variant":** některé kalendáře nemají standardní shape `year/month/day` (Mayský = Tzolk'in + Haab + Long Count souběžně). Vyžadují vlastní třídu render/parse, ne pouhý `MonthDef[]`.

### 5.1 — Architektonické rozhodnutí pro speciální

**Možnost A — Univerzální shape:** všech 20 kalendářů strkat do current `CalendarConfig` přes dodatečné fields (`extraDays`, `cycles[]`, `inverseDayCount`, …). Drahý refactor, riziko regrese.

**Možnost B — `CalendarKind` enum:** `kind: 'standard' | 'mayan' | 'aztec' | 'roman-inverse'`. Engine routes na příslušný engine variant. Standard zůstane netknutý; speciální jsou opt-in.

**Doporučuji B** — izolace, žádné regrese, snadno rozšiřitelné.

### 5.2 — Acceptance criteria 9.3-F-III

1. Engine rozšíření o `CalendarConfig.kind` (default `'standard'`).
2. `Engine.MayanEngine` — render `13.0.13.11.3; 6 Ak'bal; 16 Sip` z absDay.
3. `Engine.AztecEngine` — render `6 Calli; trecena 1 Tecpatl; rok 1 Tochtli; 14 Ochpaniztli`.
4. `Engine.RomanInverseEngine` — render `a.d. VIII Kal. Iun.` z `(month, day)`.
5. `Engine.ExtraDaysEngine` (Cotsworth / World Calendar) — render mimo-týdenních dnů.
6. FE `FantasyDatePicker` umí input pro každý kind (Mayan = 5 inputů pro Long Count, Aztec = trecena+xiuhpohualli, Roman = předkalendářní zápis, atd.).
7. 6 nových presetů.
8. Wizard grupa „Historické" + „Alternativní" plně osazena.

---

## 6 — Inline konvertor (součást F-I, Q3 ✅)

### 6.1 — Use case

PJ na timeline kartě vidí datum primárního kalendáře. Kliknutím na chip „📅 Převést" se otevře popup s datumem ve všech ostatních kalendářích světa:

```
Hlavní datum:   Rok 1453, 14. Vědurnu, 14:00  (Elfí kalendář)

Převody:
  ▸ Gregoriánský:        25. 5. 2026
  ▸ Juliánský:           12. 5. 2026
  ▸ Solar Hidžra:        4. chordád 1405 SH
  ▸ Hebrew:              9. sivan 5786
  ▸ Islámský:            8. dhu al-hidždža 1447 AH
  [zavřít]
```

### 6.2 — Implementace

- Reuse `toAbsDay` (z `Elfí`) → `fromAbsDay` (do každého aktivního kalendáře světa).
- Popup komponenta `<DateConversionPopup config={primaryConfig} configs={allConfigs} date={fantasyDate} />`.
- Klient-side výpočet (žádné BE volání).
- Performance: O(n) per render, n = počet kalendářů světa (max ~5–10, OK).

### 6.3 — Acceptance criteria konvertoru (součást F-I)

1. Nový button „📅 Převést" na `TimelineEventCard` (pokud má svět >1 calendar config).
2. Popup zobrazí datum v každém configu světa (kromě primárního).
3. Klik mimo / Esc zavře.
4. Test: pro 25.5.2026 Gregorian zobrazí přesně dataset hodnoty od PJ pro 10 stable.

---

## 7 — Rozhodnutá Q1–Q5 (potvrzeno 2026-05-25)

### Q1 ✅ Calendar selector v CreateWorldPage
Dnes nový svět dostane Gregorian seed automaticky. Nově **CreateWorldPage** dostane volitelný advanced krok „Kalendáře":
- **Default:** Gregorian zaškrtnutý (= dnešní chování, žádná regrese).
- **PJ může:**
  - Odškrtnout Gregorian + zaškrtnout jiný (např. Hebrew + Islamic pro real-world setting).
  - Zaškrtnout víc presetů (multi-select).
  - Změnit, který je „default" (⭐ Hvězda — `world.defaultCalendarConfigSlug`).
  - Nezaškrtnout nic → vznikne svět **bez kalendáře** (PJ pak vytvoří ručně přes wizard v `CalendarConfigsPage`).
- **„Neplatí" Gregorian:** PJ odškrtne Gregorian → svět ho nedostane. Nesmí se silně mu vnucovat (PJ vize: „základní by měl být Gregoriánský, případně ho změnit a dát, že neplatí").
- ⚠️ **Implication:** stávající `worlds.service.create()` volá `seedGregorianDefault(worldId)` automaticky. Refactor: přesunout seed logiku do controller layer + akceptovat `dto.calendarPresets?: string[]` v `CreateWorldDto`. Default `['gregorian']` zachová dnešní chování pro existující clients.

### Q2 ✅ Dvě varianty Čínského + jeden Mayský
Pro Čínský: vytvořit **oba** presety, hráč si vybere v wizardu.
- `chinese-simple` — Metonic 19-letý cyklus aproximace (Iter F-II, snadné).
- `chinese-precise` — true sun/moon ephemerides (Iter **F-V** = bonus po dokončení F-III, vyžaduje engine astro lib).

Pro Mayský: jen jedna varianta s **GMT korelací** (deterministický, žádný „přesný vs. zjednodušený" rozdíl).

Description v wizardu pro hráče: „Zjednodušený (Metonic aproximace, ±1 den)" vs. „Přesný (astronomický výpočet, vyžaduje internet)" → hráč si vybere podle potřeby.

### Q3 ✅ Konvertor součást F-I
Inline „Převést" popup na timeline kartě se implementuje hned v Iter F-I po dokončení 10 presetů. Bez něj má 10 presetů menší smysl (PJ je vytvoří, ale nebude vidět converse hodnoty side-by-side).

### Q4 ✅ Calibration = PJ dataset SSOT
PRESETS-DATASET.md je single source of truth pro `epochOffset` calibraci. Pro lunární/lunisolární se akceptuje ±1 den tolerance (pozorování srpku Měsíce regionálně liší).

### Q5 ✅ „Prázdný kalendář" nahoře v wizardu
První volba v krok 1 — viditelná, ale ne agresivně předvyplněná. Zbytek presetů seskupený dle kategorií.

---

## 8 — Mimo rozsah

- **Real-time astronomical accuracy** (přesné fáze měsíce dle JPL).
- **Historické varianty per region** (různé varianty Hebrew Karaim vs. Rabbinic).
- **Conversion bookmarks** (uložit „toto datum chci pak rychle převést").
- **Calendar arithmetic** (sečíst „1 měsíc + 15 dní" napříč kalendáři).
- **Export/import preset jako JSON** — pokud PJ chce sdílet upravený preset s jiným světem.

---

## 9 — Návaznosti

- **9.3 Timeline** — primární consumer (datum eventů v aktivním kalendáři).
- **9.2c per-entita kalendář** — postavy/lokace také používají kalendář (pokud PJ vyrobí novou postavu s preset → seed).
- **9.2d aggregate kalendář** — dropdown „Zobrazený kalendář" už existuje, presets ho rozšíří o víc voleb.
- **9.5 World news** — fantasy datum oznámení (9.2e).
- **9.4 Weather** — generátor počasí podle aktivního kalendáře.

---

## 10 — Reference

- Dataset 20 kalendářů poskytnutý PJ 2026-05-25 (`docs/arch/phase-9/PRESETS-DATASET.md` — vytvořit z PJ zprávy).
- 9.3 Timeline spec: [spec-9.3-timeline.md](spec-9.3-timeline.md)
- 9.2a Fantasy engine spec: [spec-9.2a-fantasy-engine.md](spec-9.2a-fantasy-engine.md)
- 9.2b Multi-config editor: [spec-9.2b-multi-config-editor.md](spec-9.2b-multi-config-editor.md)
- Calendar engine types: [src/shared/lib/calendarEngine/types.ts](src/shared/lib/calendarEngine/types.ts)
- Gregorian default template (BE): [gregorian-default.ts](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-calendar-config/gregorian-default.ts)
