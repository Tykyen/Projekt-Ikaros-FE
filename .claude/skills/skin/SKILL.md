---
name: skin
description: Use when creating the 8 visual skins (fantasy/scifi/horror/steampunk/nature/minimal/retro/anime-MLP) for an EXISTING game system across ALL surfaces — deník list, TM obal PC+bestie, dicelog, orchestrace, readout, chat+obal. Phased gated workflow + MANDATORY final verification pass that every skin×surface actually renders and matches the design. Trigger on "skiny pro <systém>", "naskinuj <systém>", "dolaď skin <X>". Runs AFTER the `system` skill.
---

# skin — 8 vizuálních variant systému přes všechny povrchy + závěrečná kontrola

Naskinuje **existující** systém (po skillu `system`) do **8 skinů** přes VŠECHNY povrchy a
na konci **tvrdě ověří, že každý skin × každý povrch se reálně vykresluje a sedí s návrhem.**
Vytvoření + kontrola. **Raději dvakrát než vůbec.**

> **Zdroj pravdy** (NEduplikuj, čti a VYNUCUJ): [`docs/arch/phase-16/sablona-skiny-per-system.md`](../../../docs/arch/phase-16/sablona-skiny-per-system.md) — §2 rodina 8 skinů · §3 povrchy + **ornament policy** · §4 token kontrakt · §5 workflow · §6 render harness · §7 audit · **§9 pasti** · §10 checklist.

## Předpoklad
Systém je hotový s jedním vzhledem (skill `system`). Pokud ne → nejdřív `system`.

## Povrchy, které KAŽDÝ skin pokrývá (§3)
deník list · combat panel (PC/NPC) · bestie panel · **obal v TM** (TokenInfoPanel) · **dice readout** ·
dicelog · orchestrace (MapPjPanel) · chat + obal.
⚠️ **Ornament policy:** TVAR (rohy/scanline/nýt/…) jen na list/panel/**obal TM**/**readout**.
**dicelog + orchestrace + chat obal = JEN barva/font** (žádný `::before/::after` ornament — §3).

## Železné principy
1. **Tvrdá brána.** Identita/mockup skinu → **schválení** → impl → render-ověření → doladění → další skin. Žádný auto-postup mezi 8 skiny.
2. **Každý skin originál** — vlastní tvarový jazyk + 1 signature ornament; NEsdílet ornament mezi skiny; STEJNÝ skin napříč systémy ano (rodina §2).
3. **Build ≠ vidět.** `var()` bez fallbacku / token na `.<sys>-diary` scope nedosáhne na embed / inline `style={{}}` → tiše se nevykreslí, build projde (pasti §9.10–9.15). **Render-verify povinný.**
4. **Tokeny, ne hardcode.** Embed barvy přes `--dd-embed-*`/`--mx-log-*` (OPAQUE!); ornament na embed = **inline** (corner SVG NEEXISTUJE jako token — §9.10).
5. Flexibilní vstup: `skin: dolaď orchestraci drd2` = jdi rovnou na ten skin/povrch.

## Fáze

### 1. Identita 8 skinů (design)
- Pro KAŽDÝ skin vymysli identitu dle rodiny (§2: koncept, paleta, signature, fonty) přepracovanou do listu daného systému (ne přebarvený sdílený vzhled).
- **HTML mockup galerie** všech povrchů (vzor `_BRIEF.md`) → **schválení zadavatelem** → doladění. (Workflow `frontend-design` jako návrh, ne až review.)

### 2. Implementace (per skin, §5)
- `styles/<sys>-skins/<id>.css` (8×): `@import` fontů → list token override + ornament na GLOBÁLNÍ `.<sys>-*` třídy → `--dd-embed-*` (opaque) → list tokeny `--<sys>-hp/spell/insp`.
- Embed signature TVAR jen kde policy dovolí (obal TM `TokenInfoPanel.module.css`, readout `DiceRollOverlay.module.css`) — per-skin `::before/::after`, inline ornament, `var(--x, <fallback>)`.
- **NEpřidávej** ornament do dicelogu/orchestrace/chat-obalu (jen barva).
- Fan-out agentů (§8): 1 agent = 1 skin (disjunktní soubory) NEBO 1 povrchový soubor; **každému dej: „corner tokeny NEEXISTUJÍ → inline", „embed nedosáhne na `.<sys>-diary` tokeny", „povinný self render-verify s OBALENÝM markupem"** (jinak vyrobí tiše-rozbitý kód — §9.17).

### 3. Render-verify per skin (§6)
- Chrome headless harness: `<link>` zdrojové CSS (nehashované třídy) + markup OBALENÝ správně (compound `.panel[ds][dsk]` vs descendant `[ds][dsk] .readout` — past §9.13). Renderuj 8 skinů + `_none_` (regrese) + mobil.
- `npm run build` SÁM (postcss striktní). Doladění → **brána** na další skin.

### 4. ⚠️ ZÁVĚREČNÁ KONTROLA — povinná, dvojitá ("raději dvakrát než vůbec")
**Po dokončení všech 8 skinů NESkonči — proveď úplný re-audit.** Cíl: doložit, že KAŽDÝ skin × KAŽDÝ povrch se reálně vykresluje A sedí s návrhem. Nestačí „implementoval jsem".

1. **Statická past-kontrola** (grep, §9): žádný `var(--tvarový/corner-token)` BEZ fallbacku · žádný osiřelý odkaz na token z `.<sys>-diary` scope na embedu · žádný inline `style={{ background:hpColor }}` hardcode v TSX panelů · ornament policy drží (0 `::before/::after` v dicelog/orchestrace).
2. **Render-audit** (§7 checklist) — vyrenderuj **8 skinů × všechny povrchy** (fan-out: 1 agent = 1 systém/skin, postaví harnessy, screenshoty), posuď proti NÁVRHU (mockup) i proti laťce sesterského systému. Hledej: čitelnost (void-na-voidu), embed surface OPAQUE, signature PŘÍTOMEN (ne jen přebarveno), žádný hardcoded leak, tlumené/světlé skiny neon-ztlumen, list↔panel konzistence, erb per-skin.
3. **Tabulka nálezů** per skin × povrch (✅ sedí / ⚠️ odchylka / ❌ nevykresluje-nebo-nesedí) s PNG cestami. Každé ⚠️/❌ je VADA, ne „mez".
4. **Oprav nálezy → znovu render-ověř** dotčené (druhé kolo). Opakuj, dokud není tabulka čistá.
5. **Až je tabulka čistá:** `mobil-desktop` · `funkce` + `napoveda` · `chybovy-denik` ✅ ŘEŠENÍ (pasti) · build ✓.

> **Brzda proti false „hotovo":** závěrečnou kontrolu NESMÍŠ přeskočit ani odbýt token-grepem. Render je důkaz. Pokud nemůžeš renderovat povrch s reálnými daty, řekni to a vyžádej si vizuální potvrzení zadavatele — netvrď „sedí".

## Co tenhle skill NEDĚLÁ
- Strukturu/funkci systému (deník/panel/schéma) → skill `system`.
- Ornament do dicelogu/orchestrace/chat-obalu (policy: jen barva).
