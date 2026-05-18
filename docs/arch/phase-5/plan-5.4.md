# Implementační plán 5.4 — Restrukturalizace stránky světa

**Spec:** [spec-5.4.md](spec-5.4.md)
**Repo:** `Projekt-ikaros-FE` (bez BE změn)
**Větev:** `feat/krok-5.4-svet-restruktura`

Pořadí: hero → about panel → napojení + rytmus → testy → úklid.

---

## Task 1 — Hero: nízký banner, název nahoře

**Soubory:**
- Modify: `src/features/world/components/WorldDetailHero/WorldDetailHero.tsx`
- Modify: `src/features/world/components/WorldDetailHero/WorldDetailHero.module.css`

- [ ] **Step 1 — CSS výška:** `.heroWithImage,.heroPlaceholder` — `aspect-ratio: 16/7` → `height: clamp(180px, 24vh, 240px)`. Mobil (≤768): `aspect-ratio: 16/9` → `height: clamp(150px, 32vw, 200px)`.
- [ ] **Step 2 — CSS overlay obrátit:** `.overlay` gradient `to bottom` — ztmavit **horní** část: `color-mix(--surface-1 88%, transparent) 0%` → `transparent ~60%` → `transparent 100%`.
- [ ] **Step 3 — CSS content nahoru:** `.content` — `bottom: 0` → `top: 0`; `padding` beze změny (20/24, mobil 14/16).
- [ ] **Step 4 — CSS titulek:** `.title` — `font-size: clamp(24px, 3.5vw, 36px)` (mobil `clamp(20px, 6vw, 28px)`); `font-family: var(--font-display)`.
- [ ] **Step 5 — TSX pořadí:** `WorldDetailHero.tsx` — `.content` má badges **nad** `h1` (už tak je); jen ověřit, že vizuálně sedí s `top: 0`. Aktualizovat doc-komentář (Spec 2.4 → „2.4 + 5.4").

**Acceptance:** spec #1.

---

## Task 2 — `WorldAboutPanel` (nová komponenta)

**Soubory:** Create `src/features/world/components/WorldAboutPanel/{WorldAboutPanel.tsx,.module.css,index.ts}`

- [ ] **Step 1 — TSX:** props `{ world: World }`. Spočítat `hasDescription`, `hasTones`, `hasDice` (stejně jako `WorldDetailInfo`). Pokud nic → `return null`.
- [ ] **Step 2 — struktura:** `<details>` (default sbalený, bez `open`) → `<summary>` ikona (`lucide-react` `Info`) + „O světě" (uppercase, `letter-spacing: 0.08em`) → obsah: popis (`<p>`), „Tón a styl" chips, „Kostky a mechaniky" chips.
- [ ] **Step 3 — CSS:** panel-styl jako `DashColumn.module.css .panel` (`--surface-2`, `1px --frame-border`, `radius 12px`, `--shadow-md`). `summary` — `cursor: pointer`, `list-style: none` (+ `::-webkit-details-marker { display:none }`), vlastní chevron rotující na `[open]`. Chips reuse vizuálu z `WorldDetailInfo.module.css` (`.chip` — `radius 999px`, `--surface-1`, `--frame-border`).
- [ ] **Step 4 — a11y/motion:** chevron `transition` respektuje `prefers-reduced-motion`. `summary` má focus-visible outline.
- [ ] **Step 5:** `index.ts` re-export. `lint:colors` — tokeny only.

**Acceptance:** spec #4.

---

## Task 3 — `WorldDashboardPage`: větvení + vertikální rytmus

**Soubory:**
- Modify: `src/features/world/pages/WorldDashboardPage/WorldDashboardPage.tsx`
- Modify: `src/features/world/pages/WorldDashboardPage/WorldDashboardPage.module.css`
- Modify: `src/features/world/components/WorldDetailInfo/WorldDetailInfo.module.css`
- Modify: `src/features/world/pages/WorldDashboardPage/WorldDashboard/WorldDashboard.module.css`

- [ ] **Step 1 — member větev:** odebrat `<WorldDetailInfo>`; pořadí `<WorldDetailHero>` → `<WorldDashboard>` → `<WorldAboutPanel world={world} />`. Import `WorldAboutPanel`.
- [ ] **Step 2 — rytmus:** `.page` — `gap: 0` → `gap: var(--sp-6)` (mobil ≤768: `var(--sp-4)`).
- [ ] **Step 3 — odstranit roztroušené margin:** `WorldDetailInfo .grid` `margin-top: 24px` → `0`; `WorldDashboard .wrap` `margin-top: 24px` → `0`; `.body` (non-member grid) `margin-top: 24px` → `0` (mezeru řídí `.page gap`).
- [ ] **Step 4:** doc-komentář `WorldDashboardPage.tsx` — aktualizovat větvení (member bez info, + about panel).

**Acceptance:** spec #2, #3, #5.

---

## Task 4 — Testy

**Soubory:** Create `WorldAboutPanel/__tests__/WorldAboutPanel.spec.tsx`; Modify případné existující testy `WorldDashboardPage`.

- [ ] **Step 1:** `WorldAboutPanel` — render popis/tóny/kostky; prázdný world → `null`; `<details>` přítomen, default sbalený.
- [ ] **Step 2:** `WorldDashboardPage` — member: renderuje `WorldDashboard` + `WorldAboutPanel`, **ne** `WorldDetailInfo`; non-member: `WorldDetailInfo` + `JoinCTA`.
- [ ] **Step 3:** projít existující 2.4/5.2 testy dotčené layoutem, upravit.
- [ ] **Step 4:** `npm run lint && npm run lint:colors && npx tsc --noEmit && npm run build && npm run test:run` ✓.

**Acceptance:** spec #7, #8.

---

## Task 5 — Úklid

- [ ] `mobil-desktop` audit — hero výška + `WorldAboutPanel` na 3 šířkách.
- [ ] `napoveda` — ověřit popis úvodní stránky světa.
- [ ] roadmapa `roadmap-fe.md` — přidat + odškrtnout 5.4.
- [ ] commit.

**Acceptance:** spec #6.

---

## Pořadí commitů

1. `feat(svet): nizky hero banner + nazev nahore (krok 5.4)`
2. `feat(svet): WorldAboutPanel + member vetev bez WorldDetailInfo (krok 5.4)`
3. `test(svet): krok 5.4 — testy + napoveda + mobil-desktop`
