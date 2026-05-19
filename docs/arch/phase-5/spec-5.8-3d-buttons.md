# Spec 5.8 — Jednotná 3D vrstva UI světa

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — přepracovat UI prvky **uvnitř světů** z plochého „glass" stylu na **3D matný** systém: tlačítka, panely, karty/dlaždice, hlavička/navigace, vstupní pole. Tokenizováno přes skin proměnné, scoped na world shell. Globální platforma Ikaros beze změny.
**Větev:** `main`
**Velikost:** velká — odhad ~25–35 souborů; implementace **nutně iterativní** (systém → skupiny prvků).
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** navazuje na reformu vzhledů [spec-5.7.md](./spec-5.7.md) — 3D vrstva se obarvuje tokeny skinů.

---

## 1. Cíl

UI světa je dnes **placaté** — „glass" panely a karty leží naplocho, tlačítka bez hloubky. Autor chce, aby prvky světa měly **fyzickou 3D hmotu** — vystupovaly z pozadí (stín, hrana, hloubka) — povrch **matný**, ne lesklá plastová guma.

**3D platí jen uvnitř světů.** Globální platforma Ikaros zůstává plochá — oddělené vizuální vrstvy (svět ≠ globální), shodně se separací skinů z 5.7.

---

## 2. Audit současného stavu

- `src/shared/ui/Button/Button.module.css` — plochý (svět i platforma).
- `src/themes/_shared/btn3d.module.css` — 3D systém, který přes CSS `composes` používá **`IkarosLayout` (platforma)**. ⚠️ **Nesahat** — je to globální vrstva, kterou autor nechce měnit. Světové 3D je samostatný systém (`Button` scoped).
- Panely — atribut `[data-frame-panel]` (skiny ho už stylují přes `decorations.css`); plochý glass povrch.
- Karty / dlaždice — dashboard dlaždice (HRÁČI / CHAT / OBLÍBENÉ), karty akcí / novinek, `MemberCard` — vlastní ploché CSS moduly.
- Hlavička — `WorldLayout` ploché `.navLink` / `.actionBtn` / `.newPageBtn` / nav dropdowny.
- Vstupní pole — `searchBar`, formulářová pole (`shared/ui` Input) — plochá.

> Přesný seznam souborů per skupina dopřesní implementační plán.

---

## 3. Design — „3D matná hmota" (design audit `frontend-design`, 2026-05-19)

### 3.1 Princip: hloubka stínem, ne leskem

📐 **Plastické** = lesk, gloss, celoplošný odlesk. **3D matné** = fyzická hloubka přes **stín, hranu a vrstvení**; povrch matný (kámen/kov).

Dvě třídy prvků:

**A. Vystouplé** (tlačítka, panely, karty) — vystupují z pozadí:
- jemný 1px **horní světelný okraj** (`inset` highlight, nízká alfa)
- **spodní vnitřní stín** (tloušťka tělesa)
- **vnější vržený stín** (objekt vrhá stín = vyvýšení)
- povrch = jemný matný gradient (2 blízké odstíny)

**B. Zapuštěné** (vstupní pole) — vrytá do plochy:
- **vnitřní horní stín** (pole je „dolík")
- jemná spodní světelná hrana
- žádný vnější vržený stín

### 3.2 Hloubková hierarchie

Prvky mají různou „výšku" — vrstvení dělá čitelnost:
- **pozadí světa** — úroveň 0
- **panely / sekce** — mírně vyvýšené (úroveň 1)
- **karty / dlaždice uvnitř panelů** — výš (úroveň 2), hover je zvedne
- **tlačítka** — nejvýš, výrazná hloubka; pressed se zamáčkne
- **vstupní pole** — zapuštěná (negativní)

### 3.3 Stavy

| Prvek | Klid | Hover | Aktivní / press |
|---|---|---|---|
| Tlačítko | raised | výš (`translateY -2px`) | zamáčknuté (`+1px`, inset stín) |
| Karta/dlaždice | raised (úroveň 2) | zvedne se + zvýrazní okraj | — |
| Panel | raised (úroveň 1) | — | — |
| Vstupní pole | inset | accent okraj | inset + accent (focus) |

### 3.4 Tokenizace

Systém **nepřidává nové skin tokeny** — staví na existujících (`--theme-surface-*`, `--theme-border*`, `--theme-text`, `--theme-accent*`, `--theme-glow-*`). Hranové highlighty/stíny jsou konstantní `rgba` (bílá/černá s alfou) — fungují na jakékoli barvě skinu. Každý skin (`ikaros`, `fantasy`, …) obarví 3D vrstvu automaticky.

---

## 4. Architektura — scoped na svět

3D vrstva se aktivuje **jen uvnitř `WorldLayout`**. Globální platforma vykresluje tytéž komponenty plochá.

- **Scope hook** — `WorldLayout` `.shell` dostane stabilní atribut `data-world-shell`. Veškeré 3D CSS scoped pod `[data-world-shell] …`.
- **Button** — `Button.module.css` zůstává plochý (default = platforma); uvnitř world shellu přebírá 3D přes scoped pravidla. Bez změny `Button.tsx`.
- **3D hloubkové stíny** — konstanty `--depth-raised` / `-hover` / `-pressed` / `-disabled` v `_shared/tokens.css` (znovupoužité i pro panely/karty).
- **`btn3d.module.css`** — beze změny (platformový systém `IkarosLayout`).
- **Panely** — 3D přes `[data-world-shell] [data-frame-panel]`.
- **Karty / dlaždice / hlavička / inputy** — 3D scoped; konkrétní selektory dle auditu v impl. plánu.
- **`IkarosLayout` + platforma** — beze změny.
- **Migrace iterativní** — pořadí: (1) scope hook + button systém → (2) panely → (3) karty/dlaždice → (4) hlavička/nav → (5) inputy. Po každé skupině `tsc` + vizuál + commit.

---

## 5. Out of scope

- **Globální platforma Ikaros** — UI zůstává ploché.
- Změna rozměrů / rozložení prvků — jen vizuální hloubka.
- Nové skin tokeny.
- Změna chování komponent (jen CSS / scoping).

## 6. Acceptance kritéria

1. `[data-world-shell]` hook na `WorldLayout`; veškeré 3D CSS scoped pod ním.
2. Tlačítka, panely, karty, hlavička, vstupní pole uvnitř světa mají 3D hloubku dle §3.
3. Vystouplé prvky mají hranu + stín; vstupní pole jsou zapuštěná.
4. Hloubková hierarchie — panel < karta < tlačítko (§3.2).
5. Povrch matný — žádný gloss; hloubka jen stínem a hranou.
6. 3D se obarvuje tokeny skinu — `ikaros` i `fantasy` konzistentní bez per-skin CSS.
7. Globální platforma — UI beze změny, plochá.
8. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
9. `mobil-desktop` audit — touch stavy, hloubka na mobilu, žádné rozbití layoutu.

## 7. Test plán

- Smoke: svět v obou skinech (ikaros, fantasy) — panely/karty/tlačítka/inputy mají hloubku, hover/press funguje.
- Smoke: platforma Ikaros — UI nezměněné, ploché.
- `mobil-desktop` — 3D na mobilu (stíny nepřetékají), touch press.
- Vizuální QA — matné, ne plastové.

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Velmi velký zásah napříč UI světa | Jistá | Vysoký | Iterativní po skupinách (§4), commit po každé; spec je řídicí dokument. |
| 3D unikne mimo svět (regrese platformy) | Střední | Vysoký | Vše scoped `[data-world-shell]`; smoke test platformy po každé skupině. |
| Vícevrstvé stíny zatíží render (mobil) | Nízká | Nízký | Stíny jsou CSS `box-shadow`, levné; `mobil-desktop` audit ověří. |
| `lint:colors` hlásí rgba ve sdíleném CSS | Jistá | Žádný | `src/themes/_shared/` v ALLOW listu; nové soubory přidat. |

**Rollback:** Revert commitů — čistě CSS / scoping, žádná data.

## 9. Otevřené body

1. **Hloubka panelů** — mírná (úroveň 1, decentní), nebo výrazná? Návrh: mírná — ať karty/tlačítka uvnitř mají kam „vystoupit".
2. **Krok 5.8** — samostatný krok navazující na 5.7. Velký — souhlas se zařazením a iterativním postupem?
3. Po schválení: implementace začne **scope hookem + button systémem** (skupina 1), pak postupně.
