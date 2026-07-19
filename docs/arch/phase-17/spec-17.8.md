# Spec 17.8 — Přístupnost, první konzistentní vrstva (a11y v1)

**Stav:** návrh (autonomní režim — uživatel předschválil „jeď naplno") · **Fáze:** 17 · **Roadmap:** [§17.8](../../roadmap2.md) 🔁
**Závislosti:** žádné tvrdé; synergie s **17.4** (dotykové terče `IconButton`).
**Repozitáře:** **jen FE.**

---

## 0. Účel jednou větou

První hmatatelná vrstva přístupnosti: **viditelný fokus všude**, **popisky pro čtečky** u ikonových tlačítek v největších dírách a **klávesová obsluha** menu/draveru, co dnes nejde zavřít Escapem.

## 1. Výchozí stav (audit kódu)

a11y je zralá tam, kde se používá **sdílený UI kit** (chat, `Modal` s focus trapem/Escape, `MapZoomControls`, RTE toolbar — `aria-label`+`role` systematicky). Díry jsou koncentrované:

| # | Díra | Kde |
|---|---|---|
| A | **Žádný globální/sdílený focus ring** — jen per-komponenta a per-téma; base spoléhá na browser default | `themes/_shared/reset.css`+`tokens.css` bez `:focus-visible`; 7 skinů má vlastní ring |
| B | **Ikonová tlačítka bez `aria-label`** — desítky `✕`/glyph tlačítek v ručně psaných listech | `diary-systems/sheets/drdplus/DrdPlusCards.tsx` (~19), `DrdPlusProfessions.tsx`, `DrdPlusShared.tsx`, `GurpsCombatPanel.tsx`, `Drd2CombatPanel.tsx:519` |
| C | **Menu/drawer bez klávesnice** — nejde zavřít Escapem, chybí ARIA stav | `WorldLayout.tsx:161–194` NavDropdown (bez `aria-expanded`/`aria-haspopup`/Escape); `IkarosLayout.tsx:930–943` mobilní drawer (bez Escape/focus mgmt); `NotificationCenter.tsx:89–100` taby bez `role="tab"` |
| D | **Žádný `eslint-plugin-jsx-a11y`**, Storybook axe jen v `todo` režimu | `eslint.config.js`, `.storybook/preview.tsx` |

Sdílená `Button` existuje (tenký wrapper, bez a11y logiky). **`IconButton` NEexistuje** — icon-only tlačítka jsou ad hoc `<button>`.

## 2. Rozsah v1 (co uděláme teď)

Roadmapa říká „průběžné zlepšování" (🔁), ne WCAG AA certifikace. První vrstva = **největší páka za nejmenší riziko**:

1. **Globální focus ring** — `--focus-ring` token v `themes/_shared/tokens.css` + jedno pravidlo v `reset.css`:
   ```css
   :where(a, button, [role="button"], input, select, textarea, [tabindex]):focus-visible {
     outline: var(--focus-ring, 2px solid currentColor);
     outline-offset: 2px;
   }
   ```
   > 💡 `:where()` = **0 specificita** → 7 skinů s vlastním `*:focus-visible` box-shadow ringem stále vyhrají; tohle je jen fallback pro base + skiny bez ringu. 📚 *„Specificita" = síla CSS selektoru; `:where()` ji nuluje, takže cokoli konkrétnějšího přebije.*
   > ⚠️ Jediná „globální" změna — hlídá pravidlo `theme isolation`; proto přes `_shared` (base, ne per-téma) + token, který téma může přebarvit. Zvýrazním v reportu.

2. **`shared/ui/IconButton`** — obálka nad `<button>` s **povinným `aria-label`** (TS: `aria-label: string`), forward ref, `@media (pointer: coarse)` min **44×44** (synergie s 17.4). Foundation pro budoucí migraci.

3. **Popisky do hotspotů (B)** — icon-only tlačítka v jmenovaných souborech dostanou `aria-label` (u triviálních převod na `IconButton`, jinak jen atribut — bezpečná změna bez chování). Ostatní systémy = dluh (viz §5).

4. **Klávesnice menu/drawer (C):**
   - `NavDropdown` (WorldLayout): `aria-expanded`, `aria-haspopup="menu"`, **Escape** zavře, container `role="menu"`.
   - Mobilní drawer (IkarosLayout): **Escape** zavře, backdrop `role="button"`+`aria-label`, focus dovnitř při otevření.
   - NotificationCenter taby: `role="tablist"`/`role="tab"`+`aria-selected` (vzor `shared/ui/Tabs`).

## 3. Dotčená místa (FE)

| # | Soubor | Změna |
|---|---|---|
| 1 | `themes/_shared/tokens.css` | `--focus-ring` token |
| 2 | `themes/_shared/reset.css` | globální `:where(...):focus-visible` |
| 3 | `shared/ui/IconButton/` (NOVÉ) | primitiv + `.module.css` (coarse ≥44px) + index export |
| 4 | `diary-systems/sheets/drdplus/DrdPlusCards.tsx`, `DrdPlusProfessions.tsx`, `DrdPlusShared.tsx` | `aria-label` na `✕`/glyph tlačítka |
| 5 | `token-panel/system-panels/GurpsCombatPanel.tsx`, `Drd2CombatPanel.tsx` | `aria-label` na glyph tlačítka |
| 6 | `app/layout/WorldLayout/WorldLayout.tsx` | NavDropdown ARIA + Escape |
| 7 | `app/layout/IkarosLayout/IkarosLayout.tsx` | drawer Escape + focus + backdrop role |
| 8 | `features/notifications/components/NotificationCenter.tsx` | taby `role="tab"` |

## 4. Jak ověřím

- **Fokus:** klávesou Tab projít layout/chat/menu — každý interaktivní prvek má viditelný prsten; per-téma ringy se nerozbily (kontrola 2–3 skinů).
- **Čtečka:** ověřit `aria-label` na opravených tlačítkách (accessibility tree v DevTools / Playwright `getByRole('button', { name })`).
- **Klávesnice:** NavDropdown a drawer zavřít Escapem; fokus se chová správně; NotificationCenter taby jako `tab`.
- **Regrese:** `npm run build` (tsc -b) + `npm run audit:contrast` beze změny; `mobil-desktop` na dotčených místech.

## 5. Hranice scope + dluh (další inkrementy 🔁)

- **V scope v1:** globální focus ring, `IconButton` primitiv, popisky v jmenovaných hotspotech, klávesnice NavDropdown/drawer/NotifCenter taby.
- **Dluh (log přes `dluh`):**
  - `eslint-plugin-jsx-a11y` (zaplavil by stovkami nálezů — vlastní pass).
  - Migrace **všech** deníkových systémů na `IconButton` (jen jmenované hotspoty teď).
  - `KebabMenu` roving-tabindex / šipková navigace.
  - ~~Extrakce `useFocusTrap`/`Drawer` z `Modal` a napojení na NotifCenter + drawery~~ — ✅ **2026-07-18:** `useFocusTrap` extrahován + napojen (Modal/NotifCenter/drawery), doplněn i do modálních overlayů `MapNotebookOverlay` a mobilních chat drawerů (`WorldChatRoom`, gated `useMediaQuery('(max-width: 1024px)')`); selektor rozšířen o `[contenteditable]` (TipTap). 25 testů. ⚠️ `TokenInfoPanel`/`ChatContextRail` **záměrně BEZ trapu** (nemodální). Viz [[../../dluhy.md]] D-17.8-A11Y (guard-rails) + chybový deník.
  - Storybook axe `todo`→`error` — blokováno na D-033 (jediná zbylá položka D-17.8-A11Y).
- **Mimo:** plná WCAG 2.2 AA certifikace, kontrast (běží `audit:contrast`), ARIA pro komplexní widgety (grid, tree), screen-reader QA na reálné čtečce.
