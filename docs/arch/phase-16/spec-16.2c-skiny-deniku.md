# Spec 16.2c — Skiny deníku (7 vizuálních stylů, per uživatel × svět)

**Status:** 🔨 **F1 (BE) + F2 (FE list) HOTOVO 2026-06-24.**
- **F1 (BE):** `WorldMembership.diarySkin` + endpoint + whitelist. Commit `04f9826` na main. **Po BE změně RESTART.**
- **F2 (FE):** skin registr + `diary-skins.css` (7 sad) + `matrix.css` tokenizace (`:where()` regrese-safe) + `useDiarySkin` hook + `data-diary-skin` na provider + `DiarySkinSelector` v DiaryTab. tsc+168 testů+build+eslint zelené (ověřeno mimo agenta). Háčky: fonty CDN, selector jen matrix.
- **F3 (FE) HOTOVO 2026-06-25** — combat/bestie moduly tokenizované (`var(--mx-*, <sci-fi>)` fallback) + `DiarySkinScope` obal embedů (chat rail, map token panel vč. chrome, dice readout, roll log). Viz „STAV 2026-06-25" níž.
- **PRO REDESIGN + 8. skin (2026-06-25)** — všech 7 původních skinů přepracováno na profesionální úroveň (vlastní tvarový jazyk + signature ornament per skin), Horor přepracován (gore→aristokratická elegance), přidán **8. skin Anime** (cel-shade). Viz níž.
- **Čeká:** deploy FE + **BE restart** (whitelist 7→8) → vizuální smoke 8 skinů × 3 místa (list/mapa/chat) na živu.

Prototyp 7 stylů: `c:\tmp\matrix-skiny-audit.html`.
**Rozsah:** **cross-stack** — BE (1 pole + endpoint) + FE (engine, tokenizace 3 míst, 7 skin sad, selector).
**Repo:** FE `Projekt-ikaros-FE` · BE `Projekt-ikaros`, commit na `main`.
**Autor:** PJ + Claude · **Datum:** 2026-06-24
**Souvisí:** roadmap2.md 16.2c · `project_matrix_denik_redesign` · `project_theme_root_ownership` (per-svět motiv) · spec-16.2a (deník HUD = sci-fi skin).

---

## 1. Cíl
Hráč si zvolí **vizuální styl deníku** ze 7 stylů; volba platí **per uživatel × svět** (v každém světě vlastní), **cross-device** (BE). Stejný layout/mechanika, jen „kabát".

## 2. Rozhodnuto (2026-06-24)
- **Volba per uživatel × svět** (ne globální) — `WorldMembership.diarySkin`.
- **Cross-device** → BE (ne localStorage); někteří hráči mění zařízení.
- **Úplný rozsah** — list (`MatrixSheet`) + combat panel + bestie (všechna 3 místa).
- **Selector přímo v deníku** (případně zrcadlit do Nastavení později).
- **Default dle systému** (matrix→sci-fi, DrD/JaD→fantasy, CoC→horor; ostatní→sci-fi) — když člen volbu nemá.

## 3. Sedm stylů (z roadmap 16.2c)
🛸 sci-fi/neon (= dnešní HUD, default matrix) · ⚔️ fantasy (pergamen/zlato, Cinzel+EB Garamond) · 🦇 horor (krvavá/gotika, Pirata One) · 🕰️ steampunk (mosaz, Cinzel Decorative+Special Elite) · 🌿 příroda (dřevo/zeleň) · 📜 minimal (světlý papír, Lora) · 🎮 retro (oprýskané skeuomorfní, VT323, beveled+patina).

## 4. Architektura

### 4.1 BE (vzor: `WorldMembership.themeId`)
- **Pole** `WorldMembership.diarySkin?: string` (default `undefined` → dědí systémový default). Whitelist 7 hodnot (validace).
- **Endpoint** — rozšířit existující self-service member-theme update (`worlds.service.updateMyTheme` vzor) nebo `PATCH /worlds/:id/membership/diary-skin`. Vrací updated membership.
- ⚠️ **Po BE změně restart** (`feedback_be_restart_required`); BE+FE nemíchat v jedné dávce (`feedback_no_mixed_be_fe_batch`).

### 4.2 FE — skin engine
- **Hook/atom** `useDiarySkin(worldId)` → čte `membership.diarySkin` (z world membership query), fallback **default dle `world.system`**. Setter → endpoint + optimistic.
- **Aplikace** — `data-diary-skin="<skin>"` na **společný předek deníku** (`DiarySystemProvider` wrapper — už drží `data-diary-system`). Skin CSS přepíše tokeny.
- **Selector** — „🎨 Vzhled" v deníku (menu 7 stylů, ikona + náhled barvy); klik → setter.

### 4.3 Tokenizace (klíčový refactor)
- **List** (`matrix.css`, scoped global) — refactor na obecné tokeny: barvy + **fonty** (`--mx-font-display/body/num`) + **strukturální přepínače** (`--mx-clip`, `--mx-overlay`, `--mx-*-glow`, `--mx-panel-border/shadow/radius`). Sci-fi = výchozí sada.
- **Combat/bestie** (CSS module) — ⚠️ tokeny dnes definované lokálně v `.panel`. Refactor: tokeny **brát z předka** (`[data-diary-skin]`), module jen *používá* (`var(--…)`), nedefinuje. → skin override funguje napříč.
- **7 skin sad** — `[data-diary-skin='X'] { --… }` (z prototypu), sdílené pro list+combat+bestie (společné token názvy).

### 4.4 Fonty
Google Fonts sada (Chakra Petch, IBM Plex Mono, Cinzel, EB Garamond, Pirata One, Crimson Text, Cinzel Decorative, Special Elite, Lora, VT323). **⚠️ k vyřešení:** self-host vs CDN (PWA) — viz spec-16.2a H4; pravděpodobně self-host podmnožinu.

## 5. Fáze
- **F1 — BE:** pole `diarySkin` + endpoint + validace whitelist. Restart. (samostatná dávka)
- **F2 — FE engine + list:** hook/atom (+default dle systému), `data-diary-skin` aplikace, refactor `matrix.css` na tokeny, 7 skin sad, selector v deníku. **Deník postav/NPC se 7 skiny hotový.**
- **F3 — combat + bestie:** module tokenizace (tokeny z předka), skin pokryje i mapu. Pak je „úplný rozsah" hotový.

## 6. Co NEděláme
- Žádné per-postava skiny (jen per uživatel×svět).
- PJ override per svět (vynutí styl všem) = otevřená otázka, ne teď.
- Tisk respektuje skin = zvážit ve F2 (zatím neutrální/sci-fi).

## 7. Otevřené otázky
- Endpoint: rozšířit member-theme update, nebo samostatný? (rozhodnout při F1 dle BE kódu)
- Selector: ikona+barva náhled stačí, nebo mini-preview? (F2)
- Fonty self-host rozsah (F2).

---

## STAV 2026-06-25 — PRO redesign 8 skinů + F3 cross-surface

### Skiny (8) — profesionální úroveň
Každý skin = vlastní **tvarový jazyk + 1 signature ornament** (ne přebarvená šablona), čisté CSS, žádný JS. Token blok `[data-diary-skin='X']` (0,1,0) + strukturní ornamenty `[data-diary-system='matrix'][data-diary-skin='X']` (compound 0,2,0 > layout, nezávislé na pořadí CSS):
1. **🛸 Sci-fi** — neon HUD (původní, zůstává jako fallback v `:where`).
2. **⚔️ Fantasy** „iluminovaný grimoár" — zlaté filigránové rohové kování, pečetní medailon, iluminovaná iniciála, drahokamové pipy.
3. **🦇 Horor** „půlnoční salon" — PŘEPRACOVÁNO z gore (tester: „od třeťáka") na aristokratickou viktoriánskou upířinu: kovaná stříbrná tracerie v rozích, erbovní pečeť (růže+netopýří křídla), granáty, blackletter iniciála.
4. **🕰️ Steampunk** „mosazný stroj" — rohové mosazné nýty, tlakoměr osudu, ozubené kolo, cvočky.
5. **🌿 Příroda** „živý letopis" — vyrůstající úponek, letokruhový terč, semínkové pipy, medová míza.
6. **📜 Minimal** „archivní karta" — světlý papír, ledger rám + registrační kříže + letterpress, **antické zlato** (Pentagon dossier).
7. **🎮 Retro** „CRT terminál" — scanline+fosfor overlay, ASCII rohy, 7-seg LED osud, pixel pipy.
8. **🌸 Anime** „key visual" (NOVÝ, 8.) — cel-shade bílé karty + ink obrysy na sky/coral/magenta, akční swoosh + ✦ sparkles, star-burst osud.

**8. skin cross-stack:** FE `DiarySkinId`+`DIARY_SKINS`+test (7→8), BE `update-member.dto.ts` `@IsIn` whitelist 7→8 (**BE RESTART nutný**; schema je String, žádný enum).

### F3 — skin v embedech (chat/mapa/dice/roll log)
Embedy obaleny **`DiarySkinScope`** (`diary-systems/DiarySkinScope.tsx`) = `data-diary-system`+`data-diary-skin` viewera + statický import `diary-skins.css` (token sady i mimo deníkovou stránku). `display:contents` varianta pro layout-citlivé obaly (dice).
- **Kombat/bestie moduly** (`MatrixCombatPanel`/`MatrixBestiePanel`.module.css): lokální `--mx-*` odebrány → dědí ze skinu; hardcoded barvy/fonty → `var(--mx-x, <sci-fi>)`. Embed dostane **paletu+fonty** (ne rohové ornamenty — ty cílí na `.mx-panel` třídy listu).
- **Map chrome** (`TokenInfoPanel`): aside má skin atributy; override `.panel[data-diary-system='matrix']` přemapuje panel/header/BODY OSUDU badge/📌 toggle/close/identity na `--mx-*`. Ostatní systémy = mapový motiv `--map-ui-*` beze změny.
- **Dice readout + roll log** (`DiceRollOverlay`/`DiceLogPanel`.module.css): RÁM nese skin; **sémantické +/−/total (cyan/červená/jantar) zůstávají** (nesou výsledek hodu, ne skin).
- **Regrese-safe:** vše `var(--mx-*, <orig>)` + scoped `[data-diary-system='matrix']` → bez skinu / jiný systém = beze změny. Build (tsc+vite) + 753 testů zelené; combat panel vizuálně ověřen (fantasy/anime/fallback).
- **Záměrně NEtknuto:** 3D kostky samotné (mají vlastní per-hod skin `getDice3dTheme`).
