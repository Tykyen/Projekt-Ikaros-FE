# Implementační plán 5.6 — Stránka hráčů světa

**Spec:** [spec-5.6.md](spec-5.6.md)
**Repo:** `Projekt-ikaros-FE` (bez BE změn) · větev `main`

Pořadí: StatBar klikací → stránka + karta → route/nav → testy → úklid.

---

## Task 1 — `StatBar` klikací dlaždice

**Soubory:** Modify `WorldDashboardPage/WorldDashboard/components/StatBar.tsx` (+ CSS), `WorldDashboard.tsx`

- [ ] **Step 1:** `StatItem` rozšířit o `to?: string`. Dlaždice s `to` → `<Link>` (hover stav), bez `to` → `<div>` jako dnes.
- [ ] **Step 2:** CSS — hover stav pro klikací variantu (lift / border-color), `text-decoration: none`.
- [ ] **Step 3:** `WorldDashboard.tsx` — dlaždici „Hráčů" předat `to={/svet/${world.slug}/hraci}`.

**Acceptance:** spec #2.

---

## Task 2 — `WorldMembersPage` + `MemberCard`

**Soubory:** Create `pages/WorldMembersPage/{WorldMembersPage.tsx,.module.css,MemberCard.tsx,MemberCard.module.css,index.ts}`

- [ ] **Step 1 — `MemberCard`:** props `{ member: WorldMembership }`. Avatar (`UserAvatar`), `user.username`, `WorldRoleChip`. Panel-styl jako `DashColumn`. Komentář označí slot pro postavu/deník (fáze 8).
- [ ] **Step 2 — `WorldMembersPage`:** `useWorldMembers(worldId)` + `useWorldSettings()`. Rozdělení: vedení (PJ → „Pán jeskyně", PomocnyPJ → „Pomocní PJ"), skupiny dle `customGroups` (člen ve `group`, ne ve vedení), „Bez skupiny" (zbytek mimo vedení), Zadatel skryt.
- [ ] **Step 3 — sekce:** nadpisová lišta (ikona + uppercase titulek); skupina nese barevnou tečku přes inline `--group-color` z `groupColors`. Grid karet `repeat(auto-fill, minmax(200px,1fr))`. Staggered `fadeUp`, `prefers-reduced-motion`.
- [ ] **Step 4:** loading (`Spinner`) + prázdný stav. `index.ts` re-export.

**Acceptance:** spec #3, #4, #5.

---

## Task 3 — Route + nav

**Soubory:** Modify `src/app/router.tsx`, `WorldLayout.tsx`

- [ ] **Step 1:** lazy import `WorldMembersPage`; route `{ path: 'hraci', element: memberOnly(p(WorldMembersPage)) }`.
- [ ] **Step 2:** nav — položka „Hráči" do skupiny „Společenství" v `buildNav()`.

**Acceptance:** spec #1.

---

## Task 4 — Testy

**Soubory:** Create `WorldMembersPage/WorldMembersPage.spec.tsx`; Modify dotčené `StatBar` testy

- [ ] `WorldMembersPage` — PJ/PomocnyPJ ve vedení (ne ve skupině); člen se skupinou v sekci skupiny; bez skupiny v „Bez skupiny"; Zadatel skryt; empty stav.
- [ ] `StatBar` — dlaždice s `to` = `<Link>`, bez `to` = `<div>`.
- [ ] `MemberCard` — avatar + jméno + role chip.
- [ ] `npm run lint && npm run lint:colors && npx tsc --noEmit && npm run build && npm run test:run` ✓.

**Acceptance:** spec #7, #8.

---

## Task 5 — Úklid

- [ ] `mobil-desktop` audit — grid karet 1/2/N sloupců.
- [ ] `napoveda` — položka „Hráči světa" do `WORLD_PAGES_OK`; datum.
- [ ] roadmapa — 5.6 + odškrtnout.
- [ ] commit.

**Acceptance:** spec #6.

---

## Pořadí commitů

1. `feat(svet): stranka hracu sveta - adresar clenu (krok 5.6)`
