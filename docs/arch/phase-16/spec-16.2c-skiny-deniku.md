# Spec 16.2c — Skiny deníku (7 vizuálních stylů, per uživatel × svět)

**Status:** 🔨 **F1 (BE) HOTOVO 2026-06-24** — `WorldMembership.diarySkin` (per uživatel×svět, reuse endpoint `members/me/theme`, whitelist 7 stylů); typecheck+135 jest+prettier+eslint zelené. **Po BE změně RESTART; BE commit zvlášť.** Zbývá **F2 (FE engine+list)** + **F3 (combat/bestie)**. Prototyp 7 stylů: `c:\tmp\matrix-skiny-audit.html`.
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
