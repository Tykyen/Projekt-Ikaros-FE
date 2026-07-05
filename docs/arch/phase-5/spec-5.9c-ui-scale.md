# Spec 5.9c — Velikost rozhraní (uiScale) — globální zoom pro čitelnost

**Status:** ✅ Implementováno 2026-07-05 (čeká vizuální ověření na zařízení) — build/eslint/lint:colors ✓; BE beze změny (themeSettings volný objekt + shallow-merge)
**Rozsah:** FE + BE — jeden per-uživatel ovladač „Velikost rozhraní", který zvětší **celé rozhraní** (text, tlačítka, ikony, rozestupy) přes CSS `zoom`. Ukládá se na účet → platí napříč zařízeními.
**Větev:** `main`
**Velikost:** odhad ~6–8 souborů — FE (typ, atom preview, aplikační effect, UI v AppearanceSection, mapa reset), BE (whitelist pole v themeSettings update, pokud existuje)
**Autor:** PJ + Claude
**Datum:** 2026-07-05
**Souvisí:** rozšiřuje [spec-5.9](./spec-5.9-user-theme-a11y.md) (Doladění vzhledu). Motiv: testeři s dioptriemi — písmo/UI je pro ně malé.

---

## 1. Cíl

Uživatel si zvětší **celé rozhraní** pro svou čitelnost. Ne jen písmo — člověk se slabším zrakem potřebuje větší i tlačítka, ikony a odstupy. Ovladač je jeden, uložený na účet, platí všude (platforma, svět, Putyka, Camp, světový chat).

## 2. Proč zoom a ne „font scale"

- Platforma míchá `font-size` v **px (~1700×)** i **rem (~700×)**. Zvětšení root `font-size` by zvětšilo jen rem text → nekonzistentní, půlka UI beze změny.
- `zoom` škáluje px i rem stejně a **přepočítá layout** (text se zalomí, nic se neořízne) — na rozdíl od `transform: scale`, který jen opticky nafoukne a udělá scrollbary/ořez.
- Podpora: Chrome, Edge, Safari, Firefox (od v126, 2024) → napříč prohlížeči OK.

🔀 Zavržené alternativy: (a) migrace px→rem — obří přepis s rizikem regresí; (b) spoléhat na browser/OS zoom — nepersistuje per-účet napříč zařízeními (což je právě požadavek).

## 3. Datový model (BE)

Rozšíření existujícího `User.themeSettings` (5.9) o jedno pole:

```
themeSettings.uiScale?: number   // 1.0–1.5, default 1
```

`User.themeSettings` je na BE volný objekt (`Record<string,unknown>`), čte se přes cast.
⚠️ **Ověřit v impl:** zda update-profile DTO themeSettings **whitelistuje** klíče (pak `uiScale` přidat do BE) nebo bere objekt volně (pak beze změny BE). Bez BE restartu se nové pole tiše nedropne jen pokud je objekt volný — [feedback_be_restart].

FE typ `UserThemeSettings` (`shared/types`): přidat `uiScale?: number`.

## 4. Aplikace zoomu (FE)

- Jeden effect (v `ThemeProvider`, obaluje celou app — platformu i `WorldLayout`) nastaví `document.documentElement.style.zoom` a CSS var `--ui-scale` z:
  - živého náhledu (`platformThemePreviewAtom.uiScale`), jinak
  - uloženého `user.themeSettings.uiScale`, jinak `1`.
- `zoom` na `<html>` pokryje i portály (modaly, toasty, popovery jdou do `document.body`) → konzistentní.

⚠️ **Taktická mapa (PIXI plátno):** zoom canvasu = rozmazání + rozhozené souřadnice kliků. Root kontejner mapy dostane reset `zoom: calc(1 / var(--ui-scale, 1))` → mapa zůstane 1:1 (má vlastní pan/zoom). Toto je hlavní věc k ověření.

## 5. UI

Sekce **„Doladění vzhledu"** v profilu ([AppearanceSection](../../../src/features/profile/components/AppearanceSection.tsx)) — nový posuvník **„Velikost rozhraní — {%}"** nad/vedle Jas/Kontrast.

- Rozsah 100–150 %, krok 10 % (1.0/1.1/1.2/1.3/1.4/1.5) — sladěno s chatovými velikostmi.
- Živý náhled (přes preview atom) — táhnutím se appka mění hned.
- Uloží se tlačítkem **„Uložit doladění"** stejným PATCH jako jas/kontrast.
- Součást „Výchozí" resetu (→ 1.0).

⚠️ **Persistence past** [feedback_persist_variants]: `saveAdjust` posílá celý `themeSettings` objekt. `uiScale` MUSÍ být v témže payloadu jako `adjust`+`overrides`, jinak se uložením doladění smaže (a naopak). Povinný test A→B→A.

## 6. Out of scope

- Per-svět velikost rozhraní (jen globální, jedna hodnota na účet).
- Zvláštní ovladač velikosti pro chat — zoom ho pokryje automaticky, žádná změna `ChatRoom`/`MessageItem`.
- Změna, jak funguje per-svět čtenářská velikost světového chatu (zůstává, skládá se se zoomem).

## 7. Acceptance kritéria

1. `UserThemeSettings` (FE) + `User.themeSettings` (BE) nesou `uiScale`.
2. Posuvník „Velikost rozhraní" v Doladění vzhledu; živý náhled; uložení; reset na 1.0.
3. Zoom platí napříč: platforma, svět, Putyka, Camp, světový chat, modaly/toasty.
4. Taktická mapa zůstává 1:1 (bez rozmazání, kliky sedí) při libovolném uiScale.
5. Uloží se na účet → po reloadu i na jiném zařízení stejná hodnota.
6. Persistence: uložení uiScale nezahodí adjust/overrides a naopak (test A→B→A).
7. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓; BE `tsc` ✓ (pokud BE zásah).
8. `mobil-desktop` audit — zoom nerozbije layout na mobilu ani desktopu.

## 8. Test plán

- FE: effect nastaví zoom z uloženého i z preview; reset → 1.0.
- Smoke: posuvník živě zvětší UI; reload = sync z účtu; jiný prohlížeč = stejná hodnota.
- Mapa: uiScale 1.5 → mapa 1:1, klik na token sedí.
- Persistence: nastav jas → ulož → nastav uiScale → ulož → reload → obojí drží.
- Mobil: uiScale 1.5 nezpůsobí horizontální scroll mimo scrollovatelné kontejnery.

## 9. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Zoom rozmaže / rozhodí PIXI mapu | Vysoká | Střední | §4 — mapový root `zoom: calc(1/var(--ui-scale))`. |
| `saveAdjust` přepíše/zahodí uiScale | Střední | Střední | §5 — jeden payload, test A→B→A. |
| BE dropne `uiScale` (whitelist/strict DTO) | Střední | Vysoký | §3 — ověřit DTO; případně přidat pole + BE restart. |
| Horizontální scroll na mobilu při 150 % | Nízká | Nízký | `mobil-desktop` audit; kontejnery mají `overflow-x`. |

**Rollback:** revert commitů; BE bez migrace (volitelné pole).

## 10. Otevřené body

1. **Zoom na `<html>` vs `.shell` + portál root** — návrh `<html>` (pokryje portály zdarma). Finální v impl.
2. **Krok posuvníku** — 10 % (návrh) vs jemnější 5 %.
