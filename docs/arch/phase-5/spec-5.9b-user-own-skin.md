# Spec 5.9b — Vlastní motiv + pozadí člena („Můj vzhled", jen pro mě)

**Status:** ✅ Implementováno (2026-06-23)
**Rozsah:** FE + BE — rozšíření world roviny [5.9](./spec-5.9-user-theme-a11y.md) o **vlastní výběr motivu (skinu) a vlastního pozadí** per člen světa. Ukládá se na `WorldMembership`, platí JEN danému členovi v daném světě, nikdy se nepropisuje do `World` ani jiným členům.
**Větev:** `main`
**Autor:** PJ + Claude
**Souvisí:** [spec-5.9](./spec-5.9-user-theme-a11y.md) (jas/kontrast/barvy), [spec-5.7](./spec-5.7.md) (reforma vzhledů), hotfix sdíleného motivu (role/oprávnění — viz chybový deník `role.md`)

---

## 0. Kontext — proč (bug → featura)

Vyšlo z bugu: nečlenský/Korektor zásah do **sdíleného** „Motivu světa" se propsal všem včetně PJ (oprava = sdílený motiv jen vedení, PomocnyPJ+). Z toho vzešlo zadání PJ: **každý člen si má jít upravit vzhled podle sebe — včetně motivu a pozadí — a nesmí to ovlivnit ostatní.**

## 1. Reverze rozhodnutí 5.9

5.9 §5 (Out of scope) + §1 explicitně říkaly: *„Změna skinu / fontu uživatelem — skin a font určuje PJ; a11y vrstva je nemění."*

**5.9b toto VĚDOMĚ otáčí** pro world rovinu: člen si **smí** zvolit vlastní motiv (skin) i vlastní pozadí, jen pro sebe. Font zůstává mimo rozsah. Platformová rovina (5.9 B — `User.themeSettings`) se nemění.

## 2. Datový model (BE)

`WorldMembership` — dvě nová volitelná pole (k existujícím `themeAdjust`, `themeUserOverrides`):

```
themeId?:            string | null   // vlastní motiv (override world.themeId)
themeBackgroundUrl?: string | null   // vlastní pozadí (override world.themeBackgroundUrl)
```

- Absent/`null` = dědí sdílený motiv/pozadí PJ.
- Endpoint = **stávající** `PUT /worlds/:worldId/members/me/theme` (per-self z JWT) — rozšířené `UpdateMemberThemeDto`.
- Validace `themeId` volná (`@IsString @MaxLength(40)`, ne `@IsIn(THEME_IDS)`) — **shodně s `update-world.dto`**, vyhne se dual-source 400 pasti (FE `getTheme` má fallback na neznámé id).
- `''`/`null` z FE service normalizuje na `null` (= clear). `$set: null` uloží clear; `undefined` Mongoose stripne (backward-compat se staršími klienty posílajícími jen adjust).
- **Past:** `world-membership.repository.ts` `toEntity` je explicitní whitelist mapper — nová pole nutno přidat i tam, jinak GET tiše zahodí.

## 3. Vrstvení vzhledu (FE — `WorldLayout`)

Člen přebíjí svět pole po poli; náhled v `MyThemeTab` zrcadlí stejný resolver:

1. **Motiv:** `preview?.themeId ?? membership.themeId ?? world.themeId`
2. **Pozadí:**
   - vlastní pozadí člena (`membership.themeBackgroundUrl`) přebíjí vždy;
   - jinak když má člen **vlastní motiv** (≠ svět) → default jeho skinu (`backgroundUrl` undefined → `theme.background`);
   - jinak pozadí světa.
3. **Barvy (overrides):**
   - vlastní motiv → jen `membership.themeUserOverrides` (PJ overrides laděné pro skin světa se na cizí skin nevztáhnou);
   - jinak `{ ...world.themeOverrides, ...membership.themeUserOverrides }`.
4. **Jas/kontrast:** `membership.themeAdjust` (a11y, beze změny vůči 5.9).

**Rozhodnutí (bod 2/3, potvrzeno PJ):** vlastní motiv člena = **samostatná vrstva**, ne mix s PJ laděním cizího skinu.

## 4. „Follow PJ" sémantika

`MyThemeTab` ukládá `themeId` **jen když se liší** od `world.themeId` (jinak `null`). Tak člen nezůstane zaseknutý na starém motivu, když PJ později změní sdílený motiv světa. Pozadí funguje nezávisle (vlastní pozadí lze i nad sdíleným motivem).

## 5. UI (`MyThemeTab`, `minRole: Ctenar`)

Reuse z PJ tabu „Vzhled": `ThemePresetGrid` (výběr motivu) + blok nahrání pozadí (`ThemeTab.module.css`) + slidery jas/kontrast + `ThemeCustomEditor`. „Zpět na vzhled PJ" smaže vše (motiv→svět, pozadí, barvy, jas/kontrast). Živý náhled přes `worldThemePreviewAtom`.

## 6. Out of scope

- Vlastní **font** člena (zůstává mimo).
- Platformová rovina (`User.themeSettings`) — beze změny.
- Sdílení vlastního presetu mezi světy (per-svět izolace zachována).

## 7. Acceptance

1. `WorldMembership` (BE schema + interface + **toEntity** + FE typ) má `themeId` + `themeBackgroundUrl`.
2. `PUT /members/me/theme` ukládá/vrací motiv + pozadí; `World` se nedotkne.
3. Člen si zvolí vlastní motiv + pozadí → platí jen jemu; ostatní členové i PJ beze změny.
4. „Zpět na vzhled PJ" = clear (themeId/pozadí/barvy/jas).
5. Vlastní motiv = samostatná vrstva (bez PJ overrides cizího skinu).
6. „Follow PJ": `themeId == world.themeId` se uloží jako `null`.
7. Sdílený „Vzhled" (Motiv světa) editovatelný jen vedení (PomocnyPJ+) — viz hotfix.
8. `tsc -b` build ✓, FE vitest ✓, BE `tsc`+jest ✓, `mobil-desktop` ✓.

## 8. Ověřeno

- BE jest `worlds.service.spec` 134/134 (+4: motiv/pozadí na membership, ne World; `''`→null clear; backward-compat) · BE `tsc` ✓.
- FE vitest `MyThemeTab.spec` (follow-PJ null / vlastní themeId / předvyplnění z membershipu) + `WorldSettingsPage` ✓ · FE `npm run build` (tsc -b) ✓.
- **Pozn.:** po BE změně nutný restart (jinak whitelist ValidationPipe dropne nová pole).

## 9. Rollback

Revert commitů; BE migrace není nutná (nová volitelná pole, absent = dědí PJ).
