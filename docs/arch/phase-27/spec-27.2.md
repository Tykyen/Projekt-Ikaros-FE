# Spec 27.2 — Mobilní core cesty (zlaté cesty ①–③ na telefonu)

**Status:** Implementováno 2026-07-24 (rozšířeno na kompletní zátah bez dluhu — §3b); čeká živé ověření na telefonu (P0-③ dotyk + vzorek skinů)
**Rozsah:** oprava mobilní průchodnosti — CSS + 1 dotykový JS guard; **žádný nový mobilní layout**
**Repo:** `Projekt-ikaros-FE` (FE only)
**Velikost:** ~11 CSS/JS úprav napříč cestami ①–③
**Autor:** PJ + Claude
**Datum:** 2026-07-24
**Souvisí:** **27.1** (certifikace cest ①–⑤) · 17.4 (dotyk mapy — reuse) · 27.3 (scope registr)

---

## 1. Cíl

Zlaté cesty ①–③ musí projít **na telefonu** (360–414px), protože hráči u stolu drží mobil.
Ne nový layout — jen odstranit, co na mobilu **drhne nebo blokuje** průchod core cestami.

- **①** pozvánka → vstup do světa → adresář postav → wizard „Co chceš vytvořit?" → editor postavy
- **②** postava → deník → chat → hod kostkou
- **③** mapa → token → iniciativa → výsledek (HP)

Metoda dle `base.md`: statická CSS review (media queries, flex-wrap, overflow, min-width, touch targety) + **živý průchod uživatelem** (browser nespouštíme). Reuse 17.4 dotyk mapy.

---

## 2. Audit — nálezy (statická CSS review 3 cest)

Breakpointy projektu: mobil = 768px, malý telefon = 480px. Cílová šířka 360–414px.
Laťka dotykového cíle: **44px** (Apple HIG / WCAG 2.5.5), min. 40px u husté sekundární výbavy.

### P0 — blokuje průchodnost
| # | Soubor | Problém |
|---|--------|---------|
| P0-① | `PageEditor/components/NewPageWizardModal.module.css` | Wizard (PJ = 7 karet ≈ 670px) bez `max-height`/scrollu → ořez na krátkém telefonu, spodní karty i CTA nedosažitelné |
| P0-③ | `tactical-map/.../token-panel/TokenInfoPanel.module.css` + `hooks/useViewportPanZoom.ts` | `touch-action:none` z `.viewport` se propisuje na vnořené scroll kontejnery → tělo token karty se prstem neposune, místo scrollu jezdí mapa |

### P1 — drhne (dotykové terče < 44px + dotykové kolize)
- **②** `DiceButton` 🎲 32px · `ChannelComposer` razítka 32px + „Odeslat" ~31px
- **③** HP +/- `Drd16CombatPanel`/`DrdhCombatPanel` `.vsteps` ~22px · `InitiativeControls` „Zahájit boj/Další tah" ~26px · `InitiativeBarItem` „i" 18px · `InitiativeBar` `.strip` touch-scroll
- **①** `NewPageWizardModal` `.closeBtn` 32px · `EditorStickyBar` „Uložit" ~38px

### P2 — 1 reálný UX + kosmetika/dluh
- **Reálný (zahrnut):** `DicePickerPopover` inputy font 13px → iOS auto-zoom rozhodí sheet → `font-size:16px`.
- **Kosmetika/dluh (mimo Balík A):** mrtvý tabulkový CSS `PostavaPanel` · breakpoint 720 vs 768 · `MessageItem` hover padding na mobilu · PJ-only sub-terče (`jumpBtn`, kreslení).

---

## 3. Návrh řešení — Balík A (schváleno)

Konzistentní vlna: sjednotit dotykové cíle na 44px + dořešit `touch-action` na mapě. Žádné nové layouty.

| # | Soubor | Úprava |
|---|--------|--------|
| 1 | `NewPageWizardModal.module.css` | `.dialog{max-height:calc(100dvh - 2rem)}` + `.choices{overflow-y:auto}` (P0-①) + `.closeBtn` 40px |
| 2 | `EditorStickyBar.module.css` | `.btnPrimary{min-height:44px}` @≤640 |
| 3 | `TokenInfoPanel.module.css` | `.body{touch-action:pan-y; overscroll-behavior:contain}` (P0-③ CSS část) |
| 4 | `useViewportPanZoom.ts` | `onPointerDown` target-guard: přeskoč UI chrome (panely/dialog/toolbar/button/input) (P0-③ JS část) |
| 5 | `DiceButton.module.css` | 🎲 `44px` @≤768 |
| 6 | `ChannelComposer.module.css` | `.stamp` 40px + `.send{min-height:44px}` @≤768 |
| 7 | `DicePickerPopover.module.css` | `.input{font-size:16px}` @≤768 (iOS anti-zoom) |
| 8 | `Drd16CombatPanel.module.css` | `.vsteps button` 40px @≤768 |
| 9 | `DrdhCombatPanel.module.css` | `.vsteps button` 40px @≤768 |
| 10 | `InitiativeControls.module.css` | `.btn{min-height:40px}` @≤768 |
| 11 | `InitiativeBarItem.module.css` | `.infoBtn` hit-area 28px @≤768 |
| 12 | `InitiativeBar.module.css` | `.strip{touch-action:pan-x; overscroll-behavior-x:contain}` |

📚 **touch-action** = říká prohlížeči, která dotyková gesta si na prvku řídí sám JS; dědí se na potomky, takže vnořené scroll oblasti musí `pan-x`/`pan-y` znovu povolit, jinak přijdou o nativní scroll.

---

## 3b. Rozšíření rozsahu — ŽÁDNÝ DLUH (rozhodnutí autora 2026-07-24)

Autor: „dluh nechci". Balík A se proto rozšiřuje na **kompletní zátah** (fb_no_debt — celé, ne polovina):
- **Dotykové terče < 40px ve VŠECH systémových combat/bestie panelech** (Fate/DrdPlus/Matrix/Drd2/Jad/Dnd/Pi/Shadowrun/Gurps/Coc + Drd16/Drdh) → sjednotit na ≥40px @≤768 (inventura samostatným průchodem).
- **Veškerá P2 kosmetika** z auditu: mrtvý tabulkový CSS `PostavaPanel` (smazat) · breakpoint 720 vs 768 (sjednotit) · `MessageItem` hover padding na `@media(hover:none)` · PJ-only sub-terče (`jumpBtn`, `InitiativeInput`, kreslení swatche, token `closeBtn`/`modeBtn`, dice `headerGear`) · dice picker mobilní close X · `CampHeader .seal` ≥44px.

## 4. Out of scope
- **Nový mobilní layout** (companion mód = 17.11, Etapa IV).
- Cesty ④⑤ (nemají FE golden-path UI průchod; BE e2e je kryje).

---

## 5. Acceptance kritéria
1. ✅ P0-① wizard scrolluje na 360×640, všechny karty + CTA „Postava hráče" dosažitelné.
2. ✅ P0-③ tělo token karty + iniciativní lišta se na dotyku posunou, mapa pod nimi nejezdí; desktop pan/zoom beze změny.
3. ✅ Dotykové cíle cest ①–③ v dotčených komponentách ≥ 40px (kritické CTA 44px).
4. ✅ `mobil-desktop` statická review na dotčené komponenty.
5. ✅ `funkce` (mobilní průchodnost core cest) + `napoveda` (pokud se mění chování/topiky).
6. ✅ **Žádný dluh** — všechny combat/bestie skiny + veškerá P2 kosmetika opravena v tomto zátahu.
7. ✅ tsc + eslint + build zelené; **živý průchod uživatelem na telefonu** (hlavně P0-③).

---

## 6. Test plán
- Statická CSS review (hotová, 3 agenti per cesta).
- `mobil-desktop` na dotčené komponenty.
- Build: `npm run build` (tsc -b) zelený.
- **Manuální (uživatel na živém webu, telefon):** projít ①②③; ověřit P0-③ dotyk (token karta scroll vs. pan mapy) a P0-① wizard scroll.

---

## 7. Riziko & rollback
| Riziko | Mitigace |
|---|---|
| `touch-action` guard rozbije desktop pan/zoom | guard jen přeskočí UI chrome; plátno beze změny; ověřit živě |
| Zvětšení terčů rozhodí hustý layout iniciativy/composeru | jen @≤768; `flex-wrap` už existuje; statická review |
| Slepé nezahrnutí ostatních skinů = dluh | vědomé, zapsáno do `dluhy.md` |

**Rollback:** všechny změny aditivní CSS v @media ≤768 + 1 defenzivní JS guard; revert = odstranit dotčené bloky.
