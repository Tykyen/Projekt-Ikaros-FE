# Spec 2.2 — Přehled vesmírů (`/ikaros/vesmiry`)

**Status:** ✅ Implementováno
**Rozsah:** FE (WorldsPage + 1 nová sekce + sort/filter) + BE (1 nový field `maxPlayers` + 1 endpoint úprava)
**Větev:** `feat/krok-2.1-dashboard` (pokračování — 2.1 a 2.2 spolu)
**Velikost:** ~10 FE souborů (~500 ř.) + ~3 BE soubory (~50 ř.)
**Autor:** PJ + Claude
**Datum:** 2026-05-13
**Souvisí:** [spec-2.1.md](./spec-2.1.md) (WorldCard reuse), 2.3 wizard navazuje na nový `maxPlayers` field

---

## 1. Cíl

Stránka `/ikaros/vesmiry` přestane být stub a stane se rozcestníkem přes všechny aktivní světy platformy. Anon vidí jen public/open, logged-in navíc i své private světy. Mřížka karet + search + access filter + sort (nejnovější default / abecedně / volná místa).

---

## 2. Kontext / motivace

- Krok 2.1 odkazuje na `/ikaros/vesmiry` ze sidebaru "Zobrazit vše →" + z dashboard empty state. Bez funkční stránky je to dead-end.
- Tlačítko "Prozkoumat světy" v dashboardu bylo z empty state odstraněno — primary entrypoint je sidebar.
- BE má `GET /api/worlds` (`OptionalJwtAuthGuard` — anon dostane public/open, logged-in navíc moje). Funkční, není třeba měnit.
- Nový field `maxPlayers` je požadavek na sort "volná místa". Připraví zem pro 2.3 wizard.

---

## 3. Audit současného stavu

- [`src/features/ikaros/pages/WorldsPage.tsx`](../../../src/features/ikaros/pages/WorldsPage.tsx) — 3 řádky stub.
- [`src/features/world/api/useWorlds.ts`](../../../src/features/world/api/useWorlds.ts) — `usePublicWorlds()` existuje, vrací `World[]` z `GET /api/worlds`.
- [`backend/src/modules/worlds/schemas/world.schema.ts`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/schemas/world.schema.ts) — momentálně bez `maxPlayers`.
- [`backend/src/modules/worlds/interfaces/world.interface.ts`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/interfaces/world.interface.ts) — interface bez `maxPlayers`.
- Sidebar [`IkarosLayout.tsx:147`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) — link "Zobrazit vše →" na `/ikaros/vesmiry` zachováme.
- [`src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx`](../../../src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx) — reuse, ale potřebuje volitelný membership (anon nezná).

---

## 4. Návrh řešení

### 4.1 BE — `maxPlayers?: number` field

- `world.interface.ts`: přidat `maxPlayers?: number | null;`
- `world.schema.ts`: `@Prop({ type: Number, required: false, default: null, min: 1, max: 999 }) maxPlayers?: number;`
- `dto/create-world.dto.ts` + `dto/update-world.dto.ts`: `@IsOptional() @IsInt() @Min(1) @Max(999) maxPlayers?: number;`
- `worlds.service.ts` (`create` + `update`): forward field.
- Žádná migrace nutná (Mongoose default null pro existující dokumenty).

### 4.2 FE — `WorldCard` rozšíření

- Přejmenovat na general-purpose komponentu (viz 4.3 — restruct), s volitelným `membership?: WorldMembership`.
- Když `membership` definovaný → `WorldRoleChip` + CTA "Vstoupit do světa →".
- Když `membership` undefined (anon listing) → bez chipu + CTA "Detail světa →" (link na `/svet/:id`).
- Player count: pokud `world.maxPlayers != null` zobrazit `{playerCount} / {maxPlayers} hráčů`, jinak `{playerCount} hráčů` (singular/plural rules zachovat).

**Komponenta zůstává v `src/features/ikaros/pages/DashboardPage/components/`** — sdílí ji 2.1 dashboard + 2.2 listing. Není refactor do `src/features/world/components/` (sdílení mezi feature folders by potřebovalo strukturní změnu — out of scope, dluh).

### 4.3 FE — `WorldsPage` funkční

Restrukturalizace `WorldsPage.tsx` → `WorldsPage/` složka:
```
src/features/ikaros/pages/WorldsPage/
├── WorldsPage.tsx               ← orchestrator
├── WorldsPage.module.css
├── index.ts
├── components/
│   ├── WorldsToolbar.tsx        ← search + filter + sort
│   ├── WorldsToolbar.module.css
│   └── WorldsGrid.tsx           ← grid renderer reuse WorldCard
└── __tests__/
    ├── WorldsPage.spec.tsx
    └── WorldsToolbar.spec.tsx
```

**Funkčnost:**
- Hook `usePublicWorlds()` (existuje) + `useMyWorlds()` pokud logged-in → merge `MyWorldEntry[]` membership data se světy z public list (`Map<worldId, membership>`).
- Search input (debounced, 200 ms) — substring match `world.name` (case-insensitive).
- Filter chip group (`<button>` toggle): All / Veřejné (`public`+`open`) / Mé světy (logged-in only, filtruje na ty co mají membership).
- Sort dropdown: Nejnovější (createdAt DESC) — default / Abecedně (name ASC) / Volná místa (`(maxPlayers ?? 0) - playerCount` DESC, světy bez maxPlayers ke konci).
- URL state: `?q=<search>&filter=<all|public|mine>&sort=<new|abc|seats>` — back/forward funkční.
- Empty state: "Žádné světy odpovídající filtru."
- Loading skeleton: 3 placeholder cards.
- Grid: 2 col desktop, 1 col mobil (analog WorldsSection 2.1).

### 4.4 Sidebar Vesmíry — link úprava

Stávající "Zobrazit vše →" link už vede na `/ikaros/vesmiry` — žádná změna potřebná. Pokud uživatel nemá vlastní svět, label se nezobrazuje. Pro anon link nikdy nebyl. Pro 2.2 chceme tlačítko **vždy** — i pro anon a pro 0-světového logged-in.

Změna v `SidebarContent`:
```diff
- {(worlds?.length ?? 0) > 0 && (
+ {(worlds?.length ?? 0) > 0 ? (
    <Link to="/ikaros/vesmiry" className={s.showAllLink} onClick={onNav}>
      Zobrazit vše →
    </Link>
- )}
- {(worlds?.length ?? 0) === 0 && !isAuthenticated && (
-   <p className={s.emptyHint}>Žádné dostupné světy</p>
- )}
+ ) : (
+   <Link to="/ikaros/vesmiry" className={s.showAllLink} onClick={onNav}>
+     Prozkoumat světy →
+   </Link>
+ )}
```

---

## 5. Out of scope

- **Create world wizard** (2.3) — `maxPlayers` field je dnes nastavovatelný jen přes raw `PATCH /api/worlds/:id` admin/owner endpoint, žádné UI v 2.2.
- **Pagination** (limit/offset) — pro <100 světů stačí client-side. Server pagination přijde pokud DB poroste.
- **Join flow** (2.4) — klik na anon kartu vede na `/svet/:id` (zatím stub WorldDashboardPage), join flow přijde s 2.4.
- **Tag filtering / genre filter** — žádné tones/genre filtry v 2.2.
- **Sort by hráčů** zvlášť (nejvíce/nejméně) — pokrytím "Volná místa" sortem.

---

## 6. Acceptance kritéria

### BE
1. ✅ `World.maxPlayers?: number` field v interface + schema (min 1, max 999, default null).
2. ✅ `CreateWorldDto` + `UpdateWorldDto` mají `@IsOptional() @IsInt()`.
3. ✅ BE testy: existující testy nesmí spadnout, 1 nový test pro update s maxPlayers.

### FE
4. ✅ `/ikaros/vesmiry` rendrá `WorldsPage` (žádný stub).
5. ✅ Anon vidí jen public/open světy (BE filtr).
6. ✅ Logged-in vidí navíc své membership světy (merge).
7. ✅ Search filtruje per název case-insensitive.
8. ✅ Filter chip All/Veřejné/Mé světy funguje (Mé jen pro logged-in).
9. ✅ Sort default = Nejnovější, dropdown přepíná Abecedně + Volná místa.
10. ✅ URL state `?q&filter&sort` zachycen, back/forward funguje.
11. ✅ WorldCard zobrazuje "X / Y hráčů" pokud maxPlayers, jinak "X hráčů".
12. ✅ Klik na kartu (anon/logged-in) vede na `/svet/:id`.
13. ✅ Empty state pro 0 výsledků.
14. ✅ Loading skeleton 3 placeholder.
15. ✅ Sidebar "Prozkoumat světy →" pro 0-světového i anon.

### Build / lint
16. ✅ `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
17. ✅ Responsivita 768 px (1col grid).

---

## 7. Test plán

### BE
- Unit: `worlds.service.update` s `maxPlayers` field (1 test).

### FE
- `WorldsPage` integrace (3 testy): anon list, logged-in s membership merge, empty state.
- `WorldsToolbar` (3 testy): search debounce, filter chip toggle, sort dropdown.
- `WorldCard` update (2 testy): "X / Y" formát při maxPlayers, "Detail světa" CTA pro anon (bez membership).
- Smoke: `/ikaros/vesmiry` z dashboard linku → vidím světy → klik karta → `/svet/:id`.

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Existující testy WorldCard po refactoru selžou | Střední | Nízká | Sync update WorldCard.spec.tsx + WorldsSection.spec.tsx pro nový optional membership. |
| BE migrace pro maxPlayers | Nízká | Nízká | Optional field, default null, žádná migrace. |
| Anon vidí citlivá data | Nízká | Střední | BE `GET /api/worlds` už filtruje OptionalJwtAuthGuard. |

**Rollback:** Revert commitů. BE `maxPlayers` field bez data v DB (null) je idempotentně reversibilní.

---

## 9. Otázky k autorovi

Žádné, autor delegoval. Volby:
- Anon: public/open, logged-in: + moje.
- Sort default: nejnovější + možnosti abecedně + volná místa.
- "Volná místa" = `(maxPlayers ?? 0) - playerCount` DESC.
- maxPlayers = volitelný field 1–999, null default.
- 2col grid desktop, 1col mobil.
