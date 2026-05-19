# Spec 5.9 — Uživatelské doladění vzhledu (přístupnost) — svět i platforma

**Status:** ✅ Implementováno (2026-05-19)
**Pozn. k implementaci:** posuvníky = **jas + kontrast**; `bgDim` (síla pozadí) odložen — kolidoval s `lint:colors` (hardcoded černý overlay) a jas/kontrast pokrývají a11y jádro. Lze doplnit. `ThemeCustomEditor` se importuje cross-feature (world → profil) — drobný dluh, kandidát na přesun do `shared/ui`.
**Rozsah:** FE + BE — uživatelské barevné doladění (jas, kontrast + plný editor barev) ve dvou rovinách: **(A) per-svět** nad sdíleným skinem světa, **(B) globálně** nad platformovým skinem Ikara. Skin a font se nemění; uživatel ladí jen barvy pro svou čitelnost.
**Větev:** `main`
**Velikost:** odhad ~18 souborů — BE (membership schema + endpoint), FE (editor UI, nový tab, atom, aplikace vrstvy), testy
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** navazuje na reformu vzhledů [spec-5.7.md](./spec-5.7.md), editor 5.3f, náhledový atom z 5.7b

---

## 1. Cíl

Uživatel si může **pro sebe** doladit barvy vzhledu — zesvětlit/ztmavit, kontrast, případně přebarvit jednotlivé tokeny — kvůli **přístupnosti** (různé vidění, kontrastní potřeby, komfort; zpětná vazba testerů). **Skin a font základ se nemění** — uživatel ladí jen barevnou vrstvu nad ním.

Dvě roviny:
- **(A) Per-svět** — člen světa (PJ i hráč) doladí vzhled konkrétního světa nad sdíleným skinem PJ.
- **(B) Globálně** — uživatel doladí vzhled platformy Ikaros nad svým platformovým skinem.

⚠️ **Není to návrat zrušeného `WorldThemeSwitcher`.** Ten přepínal celý preset (jiný skin). Tady uživatel skin nemění — jen ladí čitelnost.

---

## 2. Rozhodnutí autora (2026-05-19)

- **Rozsah úprav:** kombinace — rychlé posuvníky (jas / kontrast / síla pozadí) + možnost rozkliknout plný editor barev.
- **Uložení:** na účet (BE) — synchronizace napříč zařízeními.
- **Působnost:**
  - per-svět nastavení — zvlášť pro každý svět (úložiště `WorldMembership`),
  - globální nastavení — jedno pro platformu Ikaros (úložiště `User`).

---

## 3. Audit současného stavu

- **Sdílený skin** — `world.themeId` / `themeOverrides` / `themeBackgroundUrl` (PJ, krok 5.0a/5.3f).
- `applyTheme(id, { overrides })` — umí vrstvit `overrides` (mapa CSS token → hodnota) nad preset.
- `resolveWorldTheme(world)` — rezolvuje sdílený vzhled (krok 5.7a).
- `worldThemePreviewAtom` — efemérní náhled (krok 5.7b).
- `ThemeCustomEditor` — komponenta editoru barevných tokenů (PJ, 5.3f).
- `WorldMembership` (FE `shared/types`, BE modul members) — vazba uživatel ↔ svět; přirozené úložiště per-uživatel per-svět nastavení.
- `WorldSettingsPage` — tabová stránka; tab „Členství" je `Ctenar+` (každý člen).

---

## 4. Návrh řešení

### 4.1 Datový model (BE)

Stejný tvar nastavení ve dvou úložištích:

```
themeAdjust?:        { brightness?: number; contrast?: number; bgDim?: number }
themeUserOverrides?: Record<string,string>
```

**(A) Per-svět** — na **`WorldMembership`** (už nese `userId` + `worldId`).
Endpoint `PUT /worlds/:worldId/members/me/theme` — člen edituje jen své (autorizace = člen světa); vrací se v `GET /worlds/:worldId/status`.

**(B) Globální** — na **`User`** (rozšířit existující `themeSettings`).
Endpoint = stávající update profilu / `themeSettings` (`PUT /users/me` ap.); vrací se v profilu uživatele.

### 4.2 Vrstvení vzhledu (FE)

**(A) Svět** — `WorldLayout` skládá:
1. preset skin (`world.themeId`) — PJ
2. PJ overrides (`world.themeOverrides`) — PJ
3. uživatelské barevné override (`membership.themeUserOverrides`)
4. jas / kontrast / bgDim (`membership.themeAdjust`)

**(B) Platforma** — `IkarosLayout` / theme provider skládá:
1. platformový skin (`user.themeSettings.themeId`)
2. uživatelské barevné override (`user.themeSettings.themeUserOverrides`)
3. jas / kontrast / bgDim (`user.themeSettings.themeAdjust`)

### 4.3 Jas / kontrast — mechanismus

⚠️ **Otevřený technický bod.** `filter: brightness() contrast()` na `.shell` je nejjednodušší, ale `filter` vytváří stacking/containing block → **rozbil by `fixed` prvky** (MatrixRain canvas, decorations `::before/::after`). Varianty:
- **A** — filter aplikovat jen na obsahovou vrstvu (`.main`), ne na pozadí/efekt. Pozadí se neladí, obsah ano.
- **B** — jas/kontrast přepočítat do CSS tokenů (bez `filter`). Bezpečné, ale složitější.
- `bgDim` (síla pozadí) — řešitelné zvlášť přes overlay opacitu (`--theme-bg-overlay`).

Doporučení: **A** pro jas/kontrast obsahu + `bgDim` přes overlay. Finální volba v impl. plánu.

### 4.4 UI

Sdílená editor komponenta (posuvníky jas/kontrast/bgDim + sbalitelný plný editor barev — reuse `ThemeCustomEditor`), použitá na dvou místech:

**(A) Svět** — nový tab ve `WorldSettingsPage` **„Můj vzhled"**, `minRole: Ctenar` (vidí každý člen vč. hráčů). Odlišení od tabu „Vzhled" (PJ, `Korektor+`): „Vzhled" = sdílený pro všechny, „Můj vzhled" = jen pro mě.

**(B) Platforma** — sekce **„Vzhled platformy"** v nastavení účtu / profilu uživatele, vedle volby platformového skinu (`ThemeSwitcher`).

Obě: živý náhled (`worldThemePreviewAtom` rozšířený o `adjust`; platforma analogicky), „Zpět na výchozí" vymaže uživatelské nastavení.

### 4.5 Reset / fallback

- Člen bez `themeAdjust`/`themeUserOverrides` → vidí čistý sdílený skin PJ (žádná regrese).
- „Zpět na vzhled PJ" → smaže obě pole.

---

## 5. Out of scope

- Změna skinu / fontu uživatelem — skin a font určuje PJ (svět) / volí uživatel přes `ThemeSwitcher` (platforma); a11y vrstva je nemění.
- Sdílení uživatelského per-svět presetu mezi světy — per-svět nastavení je izolované (rozhodnutí §2).
- 3D vrstva na platformě — krok 5.8 zůstává jen pro svět.

## 6. Acceptance kritéria

1. `WorldMembership` i `User.themeSettings` (BE schema + FE typ) mají `themeAdjust` + `themeUserOverrides`.
2. Per-svět endpoint `PUT /worlds/:worldId/members/me/theme`; globální přes update `themeSettings`.
3. `WorldLayout` vrství skin → PJ overrides → user overrides → adjust; `IkarosLayout` vrství platformový skin → user overrides → adjust.
4. Tab „Můj vzhled" (`Ctenar+`) i sekce „Vzhled platformy" v profilu — posuvníky + plný editor + živý náhled + reset.
5. Skin a font uživatel nemění — jen barvy / jas / kontrast.
6. Uživatel bez nastavení vidí čistý skin (sdílený PJ / platformový) beze změny.
7. Nastavení se ukládá na účet, synchronizuje napříč zařízeními.
8. `fixed` prvky (MatrixRain, decorations) se jas/kontrastem nerozbijí.
9. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓; BE `tsc` ✓.
10. `mobil-desktop` audit obou editorů.

## 7. Test plán

- BE: endpoint ukládá/vrací `themeAdjust`/`themeUserOverrides`; člen nemůže editovat cizí membership.
- FE: vrstvení — user overrides nad PJ overrides; reset; člen bez nastavení = sdílený skin.
- Smoke: tab „Můj vzhled" — posuvníky živě mění svět, editor barev, uložení, reload (sync z účtu).
- `fixed` prvky: jas/kontrast nerozbije MatrixRain ani decorations overlay.

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| `filter` rozbije `fixed` prvky | Vysoká | Střední | §4.3 — filter jen na `.main`, ne na shell; nebo token přepočet. |
| Záměna s tabem „Vzhled" (PJ) | Střední | Nízký | Jasné názvy + popisky „sdílený" vs „jen pro mě". |
| BE — člen edituje cizí membership | Nízká | Vysoký | Endpoint `…/members/me/…` — vždy aktuální uživatel z JWT. |
| Vrstvení overrides koliduje s 5.7b náhledem | Střední | Nízký | `worldThemePreviewAtom` rozšířit jednotně o `adjust`. |

**Rollback:** Revert commitů; BE migrace není nutná (nová volitelná pole).

## 9. Otevřené body

1. **Jas/kontrast mechanismus** (§4.3) — varianta A (filter na `.main`) vs B (token přepočet). Doporučení A.
2. **Tab vs jiné umístění** — „Můj vzhled" jako tab v Nastavení světa, nebo vstup odjinud (ikona v headeru)? Návrh: tab.
3. **BE rozsah** — potvrdit zásah do `Projekt-ikaros` (membership schema + endpoint).
