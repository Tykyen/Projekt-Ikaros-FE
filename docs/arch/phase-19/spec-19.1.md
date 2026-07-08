# Spec 19.1 — Onboarding funnel & metriky retence

**Stav:** návrh (2026-07-08, čeká schválení) · **Fáze:** 19 (Růst, metriky & udržitelnost) · **Roadmap:** [§19.1](../../roadmap2.md) [Příloha A]
**Závislosti:** staví na admin dashboardu **12.1** ([OverviewTab](../../../src/features/admin/components/OverviewTab/OverviewTab.tsx)) a vzoru analytiky **15B.7** ([spec-15B.7](../phase-15B/spec-15B.7-analytics.md)). Sdílí BE modul `admin` (admin-stats.service) a FE `OverviewTab`.
**Repozitáře:** BE (nové agregace v modulu `admin`) + FE (nová sekce v Přehledu). Žádný nový tracking, žádná nová kolekce.
**Zobrazuje se v:** Administrace → Přehled (rozšíření `OverviewTab`, ne nový tab). Guard `AdminGuard` (Admin+) už na route je.

📚 **Funnel (trychtýř)** = kolik lidí projde každým krokem cesty (registrace → … → hraje). Klesající čísla ukazují, kde lidé odpadají. **Retence** = kolik uživatelů se po registraci vrací. **Kohorta** = skupina uživatelů podle období registrace (např. „kdo se registroval v červnu").

---

## 0. Účel jednou větou

Admin/Superadmin vidí v Přehledu **odvozený onboarding trychtýř** (kolik uživatelů dosáhlo milníků registrace → svět → postava → akce → hra) a **retenční ukazatele** (kolik se vrací) — vše dopočítané z timestampů, které už v DB jsou, **bez nového trackingu**.

## 1. Zásadní zjištění z auditu kódu (2026-07-08) — mění design

Tři audity BE (users/presence, aktivita/funnel, náklady) odhalily limity, které tato spec respektuje:

| # | zjištění | důsledek pro spec |
|---|---|---|
| **Z1** | **Funnel kroky 1–4 JDOU odvodit** z immutable timestampů (`users.createdAt`, `characters.createdAt`, `worldmemberships.joinedAt`, world `chatmessages.createdAt`). | Funnel implementujeme plně (§3). |
| **Z2** | **„První hra / session" jako entita NEEXISTUJE** (žádná session kolekce). | Proxy = **první hod kostkou** (`chatmessages.isDiceRoll:true`) nebo první world-chat zpráva. Označit v UI jako „hraje (odhad)". |
| **Z3** | **Pravá week-over-week kohortní retence NEJDE odvodit.** V DB je per-user **jediný přepisovaný** `lastSeenAt` — žádná historie aktivity. Analytics je bez `userId`, presence in-memory. | Retenci nahrazujeme tím, co JDE: **survival snapshot** (kohorta × aktivní k dnešku) + **aktivace/návrat rate** + **stickiness**. Pravá W-o-W křivka = **dluh** (§8). |

⚠️ **Pasti z auditu (nesmí se použít jako zdroj):**
- **Globální chat / Hospoda / Camp** (`worldId: null`) má TTL 1 h → jako zdroj funnelu **nepoužitelné**; jen **world chat** (`worldId != null`) je durable.
- `game_events` top-level nemá autora (jen `comments[].authorId`); RSVP `confirmedBy` nemá per-osoba timestamp.
- `worldmemberships` má `timestamps: false` → použít `joinedAt`, ne `createdAt`.
- Mapové hody (`map-scene.diceRolls`) jsou capnuté na 50/scéna → nespolehlivá historie; durable kopie hodu je v `chatmessages`.

## 2. Rozsah proti roadmapě (co měníme a proč)

Roadmapa [§19.1](../../roadmap2.md) chce trychtýř *příchod → registrace → první akce → první hra → návrat* a metriku „kolik se příští týden vrátí". Otevřené otázky roadmapy („vlastní lehké metriky, nebo žádné"; „co sledovat") řeší tato spec:

- **Cesta A (odvozené z DB), zvoleno** — žádný externí analytics, žádné invazivní trackování, žádná nová kolekce. Sedí na „i ručně/odhadem stačí — jde o směr, ne přesnost" (roadmapa).
- **Krok „příchod" (anonymní návštěva → registrace)** se do per-user funnelu **nenapojuje** (bez sledování identity to nejde — Z3 příbuzné). Poměr návštěva→registrace se **odhadne** z existující anonymní analytiky (15B.7: `visitors`) vůči novým registracím. UI to podá jako samostatný „akviziční" ukazatel, ne jako první článek per-user trychtýře.
- **„Kolik se příští týden vrátí"** → náhradník **aktivace rate** + **survival kohorty** (Z3). Skutečnou W-o-W hodnotu doplní budoucí weekly snapshot (§8).

## 3. Onboarding funnel (BE agregace)

Trychtýř = počet **distinct uživatelů**, kteří aspoň jednou dosáhli milníku. Milníky se počítají nezávisle (ne striktní sekvence u jednoho usera) — trychtýř je „kolik lidí se dostalo aspoň k X".

| # | Milník | Kolekce | Dotaz (jádro) | UI label |
|---|---|---|---|---|
| M0 | Registrace | `users` | `countDocuments({ isDeleted: {$ne:true} })` | Registrovaní |
| M1 | Vstoupil do světa | `worldmemberships` | distinct `userId` | Vstoupil do světa |
| M2 | Vytvořil postavu | `characters` | distinct `userId` kde `isNpc:false, userId!=null` | Má postavu |
| M3 | První herní akce | `chatmessages` | distinct `senderId` kde `worldId!=null, senderId!='system'` | Zahrál si (chat/hod) |
| M4 | Hraje (odhad) | `chatmessages` | distinct `senderId` kde `worldId!=null, isDiceRoll:true` | Hází kostkou |

- **Konverze:** mezi sousedními milníky `%` (M1/M0, M2/M1, …). Trychtýř klesá; kde spadne nejvíc = úzké hrdlo.
- **Časové okno:** dvě čísla per milník — **celkem** (all-time) a **za posledních N dní** (kohorta nováčků). Default N = 30. Nováčkovská větev filtruje `M0` na `createdAt >= now-Nd` a ostatní milníky na dosažené uživatele registrované v okně (join přes `userId`). *(Pozn.: pokud by cross-collection join byl drahý, MVP verze počítá jen all-time trychtýř a nováčky přidá inkrement — viz §7.)*
- **Perf:** každý milník = jeden `distinct`/`$group` na indexovaném poli. `chatmessages` může být velká → agregace `{ $group: { _id: '$senderId' } }` s `$match` na indexu `{worldId, createdAt}`. Cache (§5) to drží mimo hot path.

## 4. Retenční ukazatele (BE agregace) — co JDE odvodit (Z3)

Pravá W-o-W retence nejde (Z3). Odvozené náhradníky:

1. **Aktivace / návrat rate** — podíl uživatelů, kteří se vrátili aspoň jednou po registraci:
   `lastSeenAt - createdAt > PRAH` (návrh PRAH = 24 h). Aproximace (guard přepíše `lastSeenAt` i na registračním requestu → práh 24 h odfiltruje „jen se zaregistroval a zmizel"). UI: „Vrátilo se po registraci: X %".
2. **Stickiness (WAU/MAU)** — `aktivní za 7 dní / aktivní za 30 dní` (aktivní = `lastSeenAt >= now-Nd`). Ukazuje, jak „lepkavá" platforma je. UI: „Lepkavost".
3. **Survival kohorty** — tabulka: řádek = měsíc registrace (posl. ~6 měsíců), sloupce = *registrováno* / *aktivních k dnešku (lastSeenAt ≤ 30 d)* / *% drží*. Ukazuje, která kohorta přežívá. Immutable `createdAt` kohortu, aktuální `lastSeenAt` survival.

⚠️ Všechny tři jsou **snapshoty k aktuálnímu okamžiku**, ne časové řady. UI to musí čestně označit (tooltip: „stav k dnešku; historii návratů zatím neměříme").

## 5. BE — endpointy a cache (modul `admin`)

Rozšíření `admin-stats.service.ts` + `admin.controller` (vzor stávajícího `GET /admin/stats/overview`):

| metoda | routa | guard | odpověď |
|---|---|---|---|
| `GET` | `/admin/stats/growth?days=30` | `AdminGuard` (Admin+) | `GrowthStats` (§6) |

- **Jeden endpoint** `growth` vrací funnel + retenci + akviziční odhad (jedna obrazovka = jeden fetch).
- **Cache:** in-memory `{ data, at }` TTL **15 min** per `days` (agregace přes `chatmessages`/`users` je dražší než overview; 15 min stačí — čísla růstu se nemění po minutách). Vzor `AnalyticsService.summaryCache`.
- **Validace:** `days` enum `7|30|90` (default 30), `class-validator` query DTO, ValidationPipe whitelist.
- Bez WS, bez realtime — snapshot dashboard.

## 6. GrowthStats (BE DTO = FE typ)

```ts
interface GrowthStats {
  range: { days: number; generatedAt: string };
  funnel: {
    steps: { key: 'registered'|'joinedWorld'|'character'|'action'|'dice'; total: number; recent: number }[];
    // recent = uživatelé registrovaní v okně `days`, kteří milníku dosáhli
  };
  retention: {
    activationRate: number;   // 0..1 — vrátili se po registraci (>24 h)
    stickiness: number;       // 0..1 — WAU/MAU
    wau: number; mau: number; // absolutní (aktivní 7 d / 30 d)
    cohorts: { month: string; registered: number; active: number }[]; // posl. ~6 měsíců
  };
  acquisition: {
    visitors: number;         // z 15B.7 analytics summary (days) — anonymní návštěvníci
    signups: number;          // registrace v okně
    signupRate: number | null;// signups/visitors, null když visitors=0
  };
}
```

- `acquisition` čte existující `AnalyticsService.getSummary(days).totals.visitors` (žádná duplicitní agregace) → propojení 15B.7 ↔ 19.1. AdminModule už má/dostane přístup k `AnalyticsService` (import modulu).

## 7. FE — sekce v OverviewTab

Nová sekce **„Růst & retence"** v [OverviewTab](../../../src/features/admin/components/OverviewTab/OverviewTab.tsx), za `AnalyticsSection` (Návštěvnost), před Frontou. Nová komponenta `src/features/admin/components/GrowthSection/`:

- **Přepínač období** 7/30/90 (segmented, default 30) — vzor `AnalyticsSection`.
- **Trychtýř** — vertikální/horizontální bary klesající šířky (M0→M4), každý s absolutním počtem + konverzí % k předchozímu. Vlastní CSS (žádný recharts, vzor `MiniBarChart`). Popisky milníků + tooltip s definicí („odhad" u M4).
- **Retenční karty** (reuse `StatCard`): Aktivace (%) · Lepkavost WAU/MAU (%) · WAU · MAU.
- **Kohorty** — malá tabulka měsíc × registrováno / aktivních / % drží (horizontální bar u %).
- **Akvizice** — mini blok: návštěvníci → registrace → % (propojení na Návštěvnost).
- Hook `useGrowthStats(days)` (vzor `useAnalyticsSummary`, `staleTime` 60 s, key `adminKeys.growth(days)`).
- Loading skeleton + error hláška ve stylu `OverviewTab`. Empty stavy (0 uživatelů) čestně („zatím málo dat").
- **Mobil:** trychtýř plná šířka, kohortní tabulka horizontální scroll v `overflow-x:auto`, karty 2 sloupce → 1. `mobil-desktop` audit po implementaci.

## 8. Mimo záběr / budoucí (dluh)

- **Pravá week-over-week kohortní retence (D-19.1-RETENCE):** vyžaduje historii aktivity, kterou dnes nemáme (Z3). Návrh: lehký **týdenní append-only snapshot** (`{ userId, isoWeek }` unique, nebo denní rollup `lastSeenAt`) — zapne pravou retenci **od nasazení dál** (ne zpětně). Malý tracking → samostatné rozhodnutí, zapsat přes `dluh`.
- **Napojení „příchod → registrace" na konkrétní návštěvu** — bez sledování identity nejde; zůstává jen agregátní odhad (§2).
- **Funnel v čase (trend konverzí)** — teď snapshot; časová řada čeká na snapshot infrastrukturu.
- **Per-svět funnel pro PJ** — jiný feature (governance/PJ dashboard), ne admin agregát.

## 9. Testy

- **BE** `admin-stats.service.spec` (rozšíření): funnel counts (seed users/characters/memberships/chatmessages → očekávané `steps`), retence (activation/stickiness/cohorts z `createdAt`/`lastSeenAt`), akvizice čte analytics summary (mock), cache TTL 15 min, `worldId:null` chat se do funnelu nepočítá (past).
- **FE** `GrowthSection.test`: data → trychtýř bary + retenční karty + kohorty; loading; error; empty (0 userů). Vitest bez globals, fireEvent (`project_fe_test_precommit`).
- Build `npm run build` (tsc -b) zelený (`project_fe_build_preexisting_errors`).

## 10. Ops & dotčené soubory

**BE (změna):** `modules/admin/admin-stats.service.ts` (metody `getGrowth`), `admin.controller.ts` (route), `admin.module.ts` (import `AnalyticsModule` pro `AnalyticsService`), nové `dto/growth-stats.dto.ts`, `dto/growth-query.dto.ts`. **Restart BE nutný** (`feedback_be_restart_required`).
**FE (nové):** `src/features/admin/components/GrowthSection/{GrowthSection.tsx,FunnelChart.tsx,*.module.css,__tests__/}`, `src/features/admin/api/{useGrowthStats.ts,growth.types.ts}`. **FE (změna):** `OverviewTab.tsx` (sekce), `adminKeys.ts` (`growth` key).
**Docs po implementaci:** `roadmap2.md` (zaškrtnout 19.1 + oprava dvojího 19.2), `docs/funkce/` (inventura), `napoveda` (admin nástroj — spíš ne pro hráče), `dluhy.md` (D-19.1-RETENCE).
