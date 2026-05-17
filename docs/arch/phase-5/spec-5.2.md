# Spec 5.2 — World dashboard (`/svet/:worldSlug`)

**Status:** ✅ Schváleno (2026-05-17) — věrná replika starého Matrixu
**Rozsah:** FE — přestavba member větve `WorldDashboardPage` na 3sloupcový dashboard + API hooky (novinky, world-eventy). Bez BE změn.
**Větev:** `feat/krok-5.2-world-dashboard`
**Velikost:** odhad ~22 souborů / ~1400 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-17
**Souvisí:** [spec-2.4.md](../phase-2/spec-2.4.md), roadmapa ř. 877–886
**Reference:** starý Matrix `frontend/src/pages/World/WorldInfo.tsx` — 3sloupcový dashboard (autor 2026-05-17: „věrná replika").

---

## 1. Cíl

Nahradit `MemberDashboardStub` 3sloupcovým dashboardem úvodní stránky světa — **věrná replika starého Matrixu** (`WorldInfo.tsx`):

- **Vlevo — Akce:** nadcházející herní akce (game-events) světa.
- **Uprostřed — Novinky:** oznámení světa (`world-news`) + tvorba pro PJ+.
- **Vpravo — Oblíbené stránky:** oblíbené wiki stránky.
- **Spodní lišta:** 3 statistiky — počet hráčů / nadcházejících akcí / novinek.

Non-member / pending-access větve `WorldDashboardPage` zůstávají beze změny.

---

## 2. Kontext / motivace

- `WorldDashboardPage` (index `/svet/:worldSlug`) z 2.4 větví dle `useWorldStatus`; member → `MemberDashboardStub` (6 statických dlaždic).
- Starý Matrix měl plnohodnotný 3sloupcový dashboard (`WorldInfo.tsx`) — autor chce **věrnou repliku** layoutu i obsahu.
- BE připravený: `world-news` modul kompletní, `game-events` má `GET /events/world/:worldId`.

> ⚠️ **Revize specu:** první verze chápala levý sloupec „Akce" jako rychlé odkazy na sekce. Podle starého Matrixu (`WorldInfo.tsx` ř. 158–171) je **levý sloupec = herní akce/eventy** (`EventsSidebar`), ne navigace. Spec opraven.

---

## 3. Audit současného stavu

### 3.1 Starý Matrix — `WorldInfo.tsx` (předloha)

- Hlavička: panel s názvem světa.
- Grid `1fr 1.4fr 1fr`, gap 20px:
  - **Akce** (ikona kalendář) → `EventsSidebar` — `getWorldGameEvents(worldId, 10, fromDate)`, karty akcí seřazené dle data, „Zobrazit další", empty stav.
  - **Novinky** (ikona noviny) → `NewsSidebar` — novinky světa.
  - **Oblíbené stránky** (ikona hvězda) → seznam s reorder ↑↓, „Zobrazit další (N)", empty stav.
- Spodní lišta: grid `repeat(3,1fr)` — 3 stat panely (Hráčů / Nadcházejících akcí / Novinek).

### 3.2 Nový Ikaros FE

- [`WorldDashboardPage.tsx`](../../src/features/world/pages/WorldDashboardPage/WorldDashboardPage.tsx) — větvení; member → `MemberDashboardStub` (po 5.2 nepoužité). Hero (`WorldDetailHero`) + info (`WorldDetailInfo`) zůstávají — nahrazují starý panel „Databáze Světa".
- `useGameEvents.ts` — `useUpcomingEventsMine(limit)` = **globální** eventy uživatele. **Chybí** world-scoped hook.
- `useWorldMembers(worldId)` (z 5.3) — počet členů.
- **Chybí** FE hook pro `world-news`.
- Platformní `DashboardPage` — vzor `SectionHeader`, `IkarosCard`, `EventCard`, sekce.
- `WorldContext` — `worldId`, `worldSlug`, `world`, `userRole`, `isPJ`.

### 3.3 BE (hotové, beze změn)

- `GET /world-news?worldId=&limit=` → `WorldNewsItem[]` (svět + globální). `POST/PUT/DELETE /world-news/:id` — Admin/Superadmin/PJ/PomocnyPJ.
- `WorldNewsItem`: `{ id, worldId: string|null, title, content, date (ISO), type: 'info'|'alert'|'system', link?, createdBy? }`.
- `GET /game-events?worldId=&limit=&fromDate=` — herní akce světa (`game-events` modul; `worldId` povinný). Vrací `GameEvent[]`: `{ id, worldId, title, date (ISO), description, imageUrl, targetGroup, groupOnly, confirmable, confirmedBy: {userId,userName}[], comments, reminderSent, createdAt, updatedAt }`. Počet potvrzených = `confirmedBy.length`.
- `World.favoritePageSlugs: string[]`.

---

## 4. Návrh řešení

### 4.0 Struktura souborů

```
src/features/world/pages/WorldDashboardPage/
├── WorldDashboardPage.tsx            ← member větev → <WorldDashboard>
├── WorldDashboard/
│   ├── WorldDashboard.tsx            ← 3 sloupce + spodní lišta statistik
│   ├── WorldDashboard.module.css
│   ├── columns/
│   │   ├── EventsColumn.tsx          ← vlevo — herní akce
│   │   ├── NewsColumn.tsx            ← uprostřed — novinky + tvorba
│   │   ├── FavoritePagesColumn.tsx   ← vpravo — oblíbené stránky
│   │   └── *.module.css
│   ├── components/
│   │   ├── DashColumn.tsx            ← obal sloupce (ikona + titulek + tělo)
│   │   ├── WorldEventCard.tsx        ← karta herní akce
│   │   ├── WorldNewsCard.tsx         ← karta novinky
│   │   ├── WorldNewsEditorModal.tsx  ← tvorba/editace novinky (PJ+)
│   │   ├── StatBar.tsx               ← spodní lišta 3 statistik
│   │   └── *.module.css
│   └── index.ts
└── __tests__/

src/features/world/api/
├── useWorldNews.ts                   ← GET / POST / PUT / DELETE world-news
└── useWorldGameEvents.ts             ← GET /events/world/:worldId
```

### 4.1 API hooky + typy

- **`WorldNewsItem`** + **`WorldGameEvent`** — FE typy v `shared/types` (zrcadlí BE).
- **`useWorldNews(worldId)`** — `GET /world-news?worldId=`; `useCreateWorldNews` / `useUpdateWorldNews` / `useDeleteWorldNews` — mutace, invalidace `['world-news', worldId]`.
- **`useWorldGameEvents(worldId, limit)`** — `GET /game-events?worldId=&limit=&fromDate=<dnes>`; jen čtení (tvorba akcí = fáze 9). Přidá se do existujícího `useGameEvents.ts`.

### 4.2 Layout — `WorldDashboard`

Pod hero + info:
- **Desktop (> 1024):** grid `1fr 1.4fr 1fr` — prostřední (novinky) širší, dle Matrixu.
- **Tablet (769–1024):** 2 sloupce — Akce + Novinky, Oblíbené plná šířka pod.
- **Mobil (≤ 768):** 1 sloupec, pořadí Novinky → Akce → Oblíbené.
- Pod sloupci **`StatBar`** — 3 stat panely.
- `DashColumn` = obal: ikona + titulek sekce + tělo; vizuál v jazyce `SettingsPanel` (skin tokeny).

### 4.3 Levý sloupec — Akce (herní akce)

- `useWorldGameEvents(worldId, 10)` → seznam `WorldEventCard` seřazený dle data (nadcházející).
- `WorldEventCard` — datum (relativní, reuse `relativeEventDate`), název akce, počet potvrzených; `isWithin24h` → zvýraznění.
- „Zobrazit další" (postupné odkrývání), empty stav („Žádné nadcházející akce."), loading skeleton.
- RSVP / tvorba akcí — **mimo rozsah** (game-events admin = fáze 9); 5.2 jen zobrazuje.

### 4.4 Prostřední sloupec — Novinky

- `useWorldNews(worldId)` → `WorldNewsCard` (type badge: info neutrální, alert `--warning`, system `--accent`; titulek, relativní datum, zkrácený `content`, `link` proklik).
- **Tvorba (PJ+ / PomocnyPJ+ / globální admin):** tlačítko „Nové oznámení" → `WorldNewsEditorModal` (formulář title / content / type / link / date) → `useCreateWorldNews`. Editace + mazání existující novinky přes kebab/akce na kartě (stejný modal). Gating: `userRole ≥ PomocnyPJ` nebo globální admin (odpovídá BE oprávnění).
- Prázdný + loading stav.
- ⚠️ `content` render jako zkrácený plain text, ne raw HTML.

### 4.5 Pravý sloupec — Oblíbené stránky

- Wiki/stránky modul (krok 7) neexistuje → **placeholder** nad `World.favoritePageSlugs`.
- Zobrazí slugy jako seznam (pokud jsou) + sdělení „Stránky světa budou dostupné s krokem 7"; kultivovaný empty stav („Zatím žádné oblíbené stránky").
- Reorder ↑↓ a proklik na stránku — **mimo rozsah** (až krok 7 přinese stránky).

### 4.6 Spodní lišta — `StatBar`

3 stat panely (grid `repeat(3,1fr)`): **Hráčů** (`useWorldMembers().length`), **Nadcházejících akcí** (`useWorldGameEvents().length`), **Novinek** (`useWorldNews().length`). Číslo + ikona + popisek (dle Matrixu).

### 4.7 Vizuální vrstva — směr „Nástěnka světa"

Design audit (`frontend-design`, 2026-05-17). Dashboard žije uvnitř světového motivu — barevnost dědí z aktivního theme, audit řeší **strukturu a charakter**. Navazuje na jazyk panelů z 5.3 (`SettingsPanel`) a starého Matrixu.

**Koncept:** úvodní stránka světa = nástěnka — tři vývěsky vedle sebe, dole měřidla.

- **`DashColumn`** — sloupec = nadpisová lišta (ikona `lucide-react` + titulek `letter-spacing: 0.08em`, uppercase) **nad** panelem, ne uvnitř (dle Matrixu `sectionLabelStyle`). Panel: `border: 1px solid var(--frame-border)`, `border-radius: 12px`, `background: var(--surface-2)`, `box-shadow: var(--shadow-md)`. Ikona obarvená akcentem (`--accent`).
- **Layout** — desktop grid `1fr 1.4fr 1fr` (novinky těžiště), `align-items: start` (sloupce nezávislé výšky). `StatBar` celou šířkou pod. Staggered `fadeUp` reveal sloupců (`animation-delay` 0/80/160 ms), `prefers-reduced-motion` respekt.
- **`WorldEventCard`** — vlevo **datum-chip** (den číslo velký + měsíc zkratka, rámeček `--accent`), vpravo název akce + řádek „✓ N potvrzeno". `isWithin24h` → chip vyplněný `--accent` (urgentní). Hover: jemný lift + `--theme-nav-hover-bg`.
- **`WorldNewsCard`** — vlevo 3px barevný proužek dle `type` (info → `--text-muted`, alert → `--warning`, system → `--accent`); titulek, relativní datum drobně, 2řádkový úryvek `content`. PJ akce (edit/smazat) v `KebabMenu` vpravo nahoře — viditelné jen oprávněným.
- **`StatBar`** — 3 panely grid `repeat(3,1fr)`, gap 16px: velké číslo (`--font-display`, ~26px), ikona nad, uppercase popisek `--text-muted` pod. Stejný panel-styl jako sloupce.
- **Empty stavy** — centrovaná ikona (ztlumená) + věta; tonálně sladěné s `WorldStubPage`.
- **Tokeny only** — žádný hardcoded literál (`lint:colors` ✓).

> 🔀 **Alternativa (zamítnuta):** karty akcí/novinek v jednom sloučeném feedu. Autor chce věrnou repliku Matrixu — tři oddělené sloupce; feed by smazal rozlišení akce vs. oznámení.

### 4.8 mobil-desktop + nápověda

`mobil-desktop` audit (3/2/1 sloupec); `napoveda` — ověřit popis úvodní stránky světa.

---

## 5. Out of scope

- **Tvorba/editace herních akcí** (game-events admin) — fáze 9; 5.2 akce jen zobrazuje.
- **RSVP na akce** z dashboardu — fáze 9.
- **Reorder / proklik oblíbených stránek** — krok 7 (wiki modul).
- **Non-member / pending větve** + hero/info — beze změny z 2.4.

---

## 6. Acceptance kritéria

1. Member větev `WorldDashboardPage` renderuje `WorldDashboard` (3 sloupce + StatBar); `MemberDashboardStub` nepoužit.
2. Non-member a pending větve beze změny.
3. Levý sloupec — `useWorldGameEvents`; karty akcí dle data; „Zobrazit další"; empty + loading.
4. Prostřední sloupec — `useWorldNews` (svět + globální); `WorldNewsCard` s type badge; PJ+/PomocnyPJ+ vidí „Nové oznámení" → editor modal; tvorba/editace/mazání funguje; empty + loading.
5. Pravý sloupec — `favoritePageSlugs` placeholder + sdělení o kroku 7; empty stav.
6. `StatBar` — 3 statistiky (hráčů / akcí / novinek).
7. Layout 3 / 2 / 1 sloupec dle šířky.
8. API hooky `useWorldNews` (+ mutace), `useWorldGameEvents`; FE typy `WorldNewsItem`, `WorldGameEvent`.
9. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓; žádný hardcoded barevný literál.
10. FE +~12 testů. `mobil-desktop` audit ✓.

---

## 7. Test plán

- `useWorldNews` / `useWorldGameEvents` — volají správné URL.
- `WorldDashboard` — render 3 sloupců + StatBar.
- `NewsColumn` — gating „Nové oznámení" dle role; loading / prázdný / seznam.
- `WorldNewsEditorModal` — validace, submit volá `useCreateWorldNews`.
- `WorldNewsCard` / `WorldEventCard` — render, type badge, datum.
- `FavoritePagesColumn` — placeholder při prázdném poli.
- Smoke: member → 3sloupcový dashboard; PJ vytvoří novinku; mobil → 1 sloupec.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Tvar `GameEvent` z BE | Nízká | Nízký | Ověřeno — `GET /game-events?worldId=`, tvar v §3.3. |
| Pravý sloupec (placeholder) působí prázdně | Střední | Nízký | Kultivovaný empty stav; reálný obsah krok 7. |
| `world-news content` HTML | Střední | Nízký | Render zkrácený plain text. |
| 3 sloupce na tabletu těsné | Střední | Nízký | Breakpoint 1024 → 2 sloupce; `mobil-desktop` audit. |

**Rollback:** Revert commitu — návrat k `MemberDashboardStub`. Aditivní změna.

---

## 9. Otázky k autorovi

Žádné — layout i obsah dle starého Matrixu (`WorldInfo.tsx`), tvorba novinek součástí 5.2 (rozhodnuto autorem). Tvorba herních akcí zůstává na fázi 9.

> Po schválení → `frontend-design` audit → implementační plán → kód.
