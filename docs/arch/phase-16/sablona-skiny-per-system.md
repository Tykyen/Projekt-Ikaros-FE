# Šablona / Playbook — Skiny deníku pro nový systém

> **Účel:** kompletní, kopírovatelný postup, jak osadit herní systém 8 deníkovými
> skiny v profesionální kvalitě. Deníky jednotlivých systémů se liší (jiné třídy,
> jiná pole), ale **skiny musí napříč systémy držet stejnou rodinu** (Horor = stejný
> svět v matrix i drd16 i drdplus). Tenhle dokument je „základ pro příště".
>
> **Doprovod:** spec `spec-16.2c-skiny-deniku.md` (architektura, schváleno) ·
> `sablona-denik-per-system.md` (9 kroků celého systému; skiny = krok 8) ·
> referenční implementace: `styles/diary-skins.css` (matrix), `styles/drd16-skins/`,
> `styles/drdplus-skins/`. Pořadí systémů: matrix✅ drd16✅ drdplus✅ → drd2 / jad /
> drdh / dnd5e / shadowrun / gurps / fate / coc / vlastni.
>
> **Železná pravidla** (`.claude/rules/base.md`): kvalita > čas; každý skin vlastní
> tvarový jazyk + 1 signature ornament (ne „přebarvený sdílený vzhled"); ornament
> originální (nesdílet MEZI skiny, ale STEJNÝ skin napříč systémy ano); workflow
> design→souhlas→impl; po grafice `mobil-desktop`; nesahej tiše do tester-schválených skinů.

---

## 1. Jak skiny fungují (architektura)

- **Aplikace:** `DiarySystemProvider` (deník) a `DiarySkinScope` (embedy: chat rail,
  mapa, dice) dávají na společný předek `data-diary-system="<sys>"` + `data-diary-skin="<id>"`.
- **Skin = 1 CSS soubor** scoped na compound selektor
  `[data-diary-system='<sys>'][data-diary-skin='<id>']` → vyšší specificita než
  systémový default → přebije ho. **KAŽDÉ pravidlo nese ten compound prefix.**
- **Registr** (sdílený, ne per-systém): `diary-systems/skins/registry.ts` — 8 ID +
  `DEFAULT_SKIN_BY_SYSTEM` (default skin daného systému). BE whitelist
  `update-member.dto.ts` (`@IsIn`, String). Volba per uživatel×svět (`WorldMembership.diarySkin`).
- **Dva token namespacy:**
  - **`--mx-*`** = systémy s tmavým HUD listem (matrix). List třídy `.mx-*` / `.matrix-sheet`.
  - **`--dd-*`** = systémy s „pergamenovým" listem (drd16, drdplus, → drd2/jad/drdh).
    List třídy per systém (`.drd16-*`, `.dp-*` …).
  - **`--dd-embed-*` / `--mx-log-*`** = sdílené EMBED plochy (obal v TM, dice readout,
    dicelog, orchestrace) — konzumují je MODULY napříč systémy.
- **Klíčové omezení:** moduly (combat/bestie panel, dicelog, readout) mají **hashované
  CSS-modules třídy** → z globálního skin souboru je NELZE cílit. Proto:
  - **Palette/fonty** panelů jdou přes **tokeny** (modul je čte z předka přes `var()`).
  - **Signature ornamenty** panelů/dicelogu/readoutu musí být **uvnitř toho module
    CSS souboru**, scoped `[data-diary-system='<sys>'][data-diary-skin='<id>'] .panel`
    (atributové selektory v module CSS zůstávají globální, hash má jen `.panel`).
  - **List** (`.dp-*`/`.drd16-*`/`.mx-*`) jsou GLOBÁLNÍ třídy → ornamenty jdou ze skin souboru.

---

## 2. Kanonická rodina 8 skinů (DRŽ NAPŘÍČ SYSTÉMY)

Tohle je ta „základová shoda". U nového systému **nevymýšlej nové koncepty** —
přepracuj tyhle identity do listu daného systému. Reference palet/fontů/ornamentů =
sesterský soubor (`drd16-skins/<id>.css` / `drdplus-skins/<id>.css` / matrix bloky).

| id | label | koncept | paleta (akcent) | signature ornament | fonty |
|---|---|---|---|---|---|
| `scifi` | Sci-fi 🛸 | Holografický velitelský HUD / datapad | void modročerná, cyan `#38e0ff` + violet | chamfer (zkosené) hrany + rohové tech-brackets ⌐¬ + jemný scanline | Orbitron · Chakra Petch · Share Tech Mono |
| `fantasy` | Fantasy ⚔️ | Iluminovaný grimoár (kovaná kožená vazba) | antické zlato `#e3b94a`, krémový ink `#ecdab0` | filigránové zlaté rohové kování + pečetní medailon + iluminovaná iniciála + drahokamové pipy | Cinzel · Cinzel Decorative · EB Garamond |
| `horror` | Horor 🦇 | Půlnoční salon (viktoriánská upířina, BEZ gore) | tmavá; zašlé stříbro `#c8c4cf` + oxblood `#7a2030` + studená fialová | kovaná gotická STŘÍBRNÁ tracerie v rozích + erbovní pečeť (růže+netopýří křídla) + blackletter iniciála | Cormorant Garamond · Cormorant SC · UnifrakturCook |
| `steampunk` | Steampunk 🕰️ | Mosazný mechanický deník | mosaz/měď/bronz; život=výbojová červeň, magie=patina/verdigris | manometr ozubeného kola (cog-gauge) + rohové nýty + zkosené plechy + nýtová kolejnice | IM Fell English SC · IBM Plex Mono (čísla mono) · Cinzel |
| `nature` | Příroda 🌿 | Druidský herbář / živý letopis | lýko/kůra; lesní zeleň `#5e8832` + medová míza/jantar; bobule životy | rašící úponek ze suku + letokruhový terč + semínkové pipy + organické rohy | Cormorant Garamond · Marcellus SC · Spectral |
| `minimal` | Minimal 📜 | Archivní karta / rýsovací list | čistý světlý papír `#f4f1ea`, JEDINÝ akcent antické zlato `#9a7b2e` | dvojitý ledger rám + registrační kříže v rozích + letterpress tick-rule + ražené razítko | Fraunces · Spline Sans Mono · Newsreader |
| `retro` | Retro 🎮 | CRT terminál / synthwave 80s | rozsvícená fosforová obrazovka, neon (HP růžová/MP cyan/OČ jantar) | scanline + sun-grid horizont + ASCII rohy ┌┐└┘ + 7-seg LED + USR:// prompt + pixel pipy | Orbitron · Share Tech Mono · VT323 |
| `anime` | MLP 🦄 | Duhový cel-shade key visual (id zůstává `anime`!) | plná duha `#ff5d6c→#ff6ad5`, ink obrys `#16162e` | holografický star-burst/conic medailon + ✦ sparkles + swoosh + tvrdý spodní cel-stín + gloss | Bricolage Grotesque · Outfit |

**Výchozí skiny systémů:** matrix→scifi · drd*/jad/drdh→fantasy · coc→horror (`DEFAULT_SKIN_BY_SYSTEM`).
**Disciplína:** minimal = preciznost ne zdobení (potlač per-povolání barvu na jediné zlato); horror = elegance ne gore; embed plocha VŽDY neprůhledná; sémantické barvy (kladný/záporný hod, životy=červená) drží význam nezávisle na skinu.

---

## 3. Povrchy, které skin pokrývá

| # | povrch | kde | jak skin doteče |
|---|---|---|---|
| A | **Deník list** (vlajková loď) | list komponenta, GLOBÁLNÍ třídy `.<sys>-*` | token override + ornamenty přímo na třídy |
| B | **Combat panel** (PC/NPC) na mapě | `*CombatPanel.module.css` (hash) | tokeny z předka; ornament uvnitř module |
| C | **Bestie panel** (jiná šablona) | `*BestiePanel.module.css` (hash) | tokeny z předka; ornament uvnitř module |
| D | **Obal v TM** (chrome) | `TokenInfoPanel.module.css` | čte `--dd-embed-*` / `--mx-*` (už hotové `:is([drd16],[drdplus])`) |
| E | **Hody** (dice readout) | `DiceRollOverlay.module.css` | tokeny + per-skin signature blok uvnitř |
| F | **Dicelog** | `DiceLogPanel.module.css` | tokeny + per-skin signature blok uvnitř |
| G | **Chat** | tytéž panely B/C/E/F užší (bestie = TÝŽ plný panel jako mapa) | dědí automaticky |
| H | **Orchestrace** (PJ panel) | `MapPjPanel.module.css` | čte `--dd-embed-*` (per-SYSTÉM blok `:is(...) .panel`) |
| I | **HP bar na TOKENU** na mapě | `resolveCharacterHp.ts` + `TokenSprite`/`TokenHpBar` | NE CSS — JS resolver mapuje `systemId → HP klíče` |

> **Bestie v chatu = TÝŽ panel jako na mapě (povrch C), jen v užším railu** — plný statblok,
> NE zúžená karta (jen Výdrž+útoky). Skin ho řeší identicky (stejné tokeny i ornament).
> V mockupu i v implementaci ukazuj chat-bestie jako kopii mapového statbloku, ne osekanou
> variantu. (Platí i pro PC/NPC combat panel: chat = týž panel jen užší rail.)

> ### ⚠️ ORNAMENT POLICY (rozhodnutí uživatele 2026-06-29) — kde signature TVAR ano/ne
> - **ANO ornament** (rohy/scanline/nýt/tracerie/…): deník list (A), combat/bestie panel (B/C),
>   **obal v TM** (D = `TokenInfoPanel`), **dice readout** (E = `DiceRollOverlay`).
> - **NE ornament — jen barva/font/rám:** **dicelog** (F = `DiceLogPanel`), **orchestrace**
>   (H = `MapPjPanel`), **chat obal** (railShell chrome). V těch malých funkčních panelech
>   boční/rohové ornamenty „dělají zle" → drž je čisté, skin nese jen `--dd-embed-*` paletu+font.
>   (Per-skin `::before`/`::after` v `DiceLogPanel`/`MapPjPanel` byly odstraněny — NEvracej je.)

> ### HP bar na mapě (povrch I) — `resolveCharacterHp.ts`
> PC/NPC token má `currentHp/maxHp = 0`; HP žije v deníku (`token.characterData.customData`),
> per-systém pod klíčem **`<prefix>_hpCur` / `<prefix>_hpMax`** (prefix = `makeCdAccess(cd,'<sys>_')`,
> NE vymyšlený `<sys>_currentHP`!). Nový systém s klasickým HP = přidej `case '<sys>'` čtoucí
> reálné klíče (+ legacy fallback bez prefixu).
> **⛳ PRAVIDLO (uživatel, závazné): HP bar (zelenost) MUSÍ být vidět u POSTAV i BESTIÍ ve VŠECH
> systémech. Jediná výjimka = `drd2`** (3 zdroje Tělo/Duše/Vliv, ne jedno HP → jediný v
> `HP_BAR_DISABLED_SYSTEMS`). I „trackerové" systémy (fate/fae stres, drdplus zranění) mají mít
> bar mapovaný na svůj vyčerpatelný zdroj; `null` jen když systém opravdu žádnou takovou veličinu nemá.
> ⚠️ **Auto-default max se NEUKLÁDÁ (past):** když deník max jen DOPOČÍTÁ a neuloží (GURPS
> `hpMax = ST`, `hp = max`) a hráč HP pole needituje, `<sys>_hpMax` v customData CHYBÍ → resolver
> vrátí `null` → **čerstvá postava BEZ baru**. Fix = fallback na zdrojový atribut
> (`gurps: gurps_hp_max ?? gurps_st`). Ověř na postavě, která NEsáhla na HP pole (ne jen na testu s max).
> **Bestie:** bar jede přes token schéma s `combatBehavior:'damageable'` (`resolveHp`/`hpTier`) —
> každé nové bestie `token.json` MUSÍ mít damageable HP pole, jinak bestie bar nejede.
> **Test MUSÍ používat klíče, co se REÁLNĚ ukládají** (grep `save({...})` + `set('hp…')`),
> ne vymyšlené — jinak zelený test maskuje, že HP bar nejede (CH-2026-06-29).

---

## 4. Token kontrakt (co skin nastavuje)

### 4a. Pergamenové systémy (`--dd-*`)
```
/* base paleta */  --dd-parch-1 --dd-ink --dd-ink-2 --dd-ink-deep --dd-ink-head
                  --dd-ink-soft --dd-gold --dd-gold-hi --dd-gold-deep
                  --dd-crimson --dd-crimson-deep --dd-sapphire --dd-steel --dd-line --dd-forge-1
/* fonty */        --dd-font-body --dd-font-head --dd-font-display
/* kompozity */    --dd-sheet-radius --dd-panel-bg --dd-panel-frame
                  --dd-row-bg --dd-card-bg --dd-input-bg
                  --dd-accent-grad (tlačítko) --dd-accent-grad-strong (init/edit) --dd-zz-grad (zranění)
/* pásma zranění */ --dd-band-ok --dd-band-ok-ink --dd-band-warn --dd-band-warn-ink --dd-band-crit
/* per-povolání */  --dd-acc-<profese>… (dle systému)
/* embed plochy */  --dd-embed-surface(OPAQUE!) -border -line -text -muted -title -chip-bg
                  -accent -num-font -title-font -pos -neg -neutral
/* HP bar fill */   --dd-hpfill-grad  ← combat+bestie panel HP lišta (NE hardcoded JS barva!)
/* list inline */   --<sys>-hp --<sys>-spell --<sys>-insp  ← #..._hpCur pole / pip Inspirace / rám Kouzel
```
Default (pergamen) = blok `[data-diary-system='<sys>'] { … }` v `diary-skins.css`.

**List sémantické tokeny (`--<sys>-hp/spell/insp`)** — list TSX čte inline `var(--<sys>-hp, var(--<sys>-accent))`
na poli „Aktuální Životy" (`#<sys>_hpCur`), pip Inspirace, rámu Použitých kouzel. Když je NEdefinuješ,
spadnou na accent (zlatá/cyan místo červené!). Definuj JEDNOU v base `<sys>.css` `.<sys>-diary` přes
fallback řetěz na sémantické `--dd-*`:
```
--<sys>-hp:    var(--dd-crimson, var(--dd-hp, var(--<sys>-accent)));
--<sys>-spell: var(--dd-sapphire, var(--dd-spell, var(--dd-mag, var(--<sys>-accent))));
--<sys>-insp:  var(--dd-gold, var(--<sys>-gold));
```
Skin, který nemá crimson/sapphire (scifi=jade, horror=violet), přepíše `--<sys>-hp/spell` na svém scope.
**HP bar fill** (`.hpBarFill`/`.hpFill` v combat/bestie module) = `var(--dd-hpfill-grad, <crimson grad>)` —
NIKDY hardcoded `style={{background: hpColor}}` v TSX (inline styl přebíjí skin a build to NEodhalí).

### 4b. HUD systémy (`--mx-*`)
```
/* base */     --mx-bg --mx-panel --mx-panel-bg --mx-text --mx-muted --mx-accent --mx-violet
              --mx-gold --mx-danger --mx-line + struktura --mx-clip --mx-overlay* --mx-*-glow
/* fonty */    --mx-font-display --mx-font-body --mx-font-num
/* vitály */   --mx-seg-off --mx-hp-on --mx-rune-on --mx-arm-on --mx-charged --mx-depleted
/* heat/přetlaky (tokenizováno v auditu) */ --mx-warn-seg(/-b) --mx-crit-seg(/-b)
              --mx-pr-1..5 (+ -1b..5b border, -5-glow)  ← gradace „víc=horší", skin přebarvuje
/* embed/log */ --mx-log-surface(OPAQUE!) -border -title -chip -num -num-font
              -total-pos -total-neg -total -skillmod -eq -eq-font
```

---

## 5. Workflow (ověřený, regrese-safe)

> Pořadí: nejdřív **TOKENIZACE základu** (jednou, bez vizuální změny), pak **skiny**.

**Krok 0 — příprava.** Přečti base.md + tenhle playbook + sesterské skiny (matrix/drd16/drdplus). Spec 16.2c platí, novou nepiš.

**Krok 1 — tokenizace panelů (regrese-safe).** V `*CombatPanel.module.css` + `*BestiePanel.module.css`:
- z `.root` ODEBER lokální token definice (`.root { --dd-x: … }`) — jinak stíní skin z předka;
- každý literál (gradient/barva/font) → `var(--dd-token, <PŮVODNÍ literál>)` (fallback = original = nulová regrese);
- do `diary-skins.css` `[data-diary-system='<sys>']` přidej PLNOU default token sadu (pergamen baseline) — to drží `var(--dd-x)` bez fallbacku;
- per-povolání `--acc` přes `var(--dd-acc-<prof>, default)`.
- Sémantické barvy (HP heat, přetlaky, +/− hod) tokenizuj na `--xx-warn/crit/pr-*` ať je skin ZTLUMÍ (neon řve na světlých/tlumených!), ale gradace drží.

**Krok 2 — build + render default = beze změny** (`npm run build`, harness `_none_`/default skin = identický).

**Krok 3 — skin soubory.** `styles/<sys>-skins/<id>.css` (8×), scoped compound. Obsah:
`@import` fontů (NA ZAČÁTKU) → `--dd-*`/`--dp-*` override listu + plocha/rám → `--dd-*` panely (paleta+fonty+kompozity+per-prof) → `--dd-embed-*` (opaque!) → signature ornamenty na GLOBÁLNÍ `.<sys>-*` třídy. Registruj 8× `@import './<sys>-skins/<id>.css'` v `diary-skins.css`. (Pozn.: list `.<sys>-sheet` přebij přímo `[…] .<sys>-sheet` — vyšší specificita než systémový default, NEMUSÍŠ měnit systémový list CSS.)

**Krok 4 — dicelog + readout signature.** V `DiceLogPanel.module.css` + `DiceRollOverlay.module.css` přidej per-skin bloky `[data-diary-system='<sys>'][data-diary-skin='<id>'] .panel` / `.readout` — PORTUJ matrix vzory (rám/scanline/nýt/cel/tracerie/úponek). Barvy z `--dd-embed-*`; přidáváš jen TVARY. `.readout` je `position:fixed` → NEPŘEPISUJ position.

**Krok 5 — verifikace** (viz §6): harness render každého skinu + default + mobil.

**Krok 6 — audit** (viz §7) → oprav nálezy.

**Krok 7 — uzávěr:** `mobil-desktop`, `funkce`+`napoveda` (skin = změna funkčnosti), `npm run build`, commit (uživatel ručně).

### Fan-out agentů (osvědčené)
1 opus agent = 1 skin, disjunktní soubory (žádné konflikty). Sdílené module soubory
(DiceLog/Readout) řeš JEDNÍM agentem nebo sekvenčně po systémech. Vždy jim dej:
brief (§ kontrakt), jejich mockup/identitu, sesterský referenční soubor, a **povinný
self-build + render**. Kopírovatelné briefy = §8.

---

## 6. Verifikační harness (Chrome headless, ověřený recept)

Reálné moduly mají hash třídy — staticky je renderuješ tak, že `<link>`-uješ ZDROJOVÉ
CSS (v něm jsou třídy nehashované) + obalíš data atributy + použiješ literální class names.

**Past:** Chrome headless NENAČTE vnořené `@import` (drd16-skins/drdplus-skins v
diary-skins.css) včas → **direct-linkuj konkrétní skin soubor**, ne diary-skins.css.
Matrix skiny žijí přímo v diary-skins.css → ten linkuj přímo (jen jeho vnořené @importy se nenačtou).

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1240,1700 --user-data-dir="C:/tmp/chrome-x" \
  --screenshot="C:/tmp/out.png" "file:///C:/tmp/harness.html"
# panely ~440px, deník 1240px, obrázky ≤2000px na výšku (jinak Read odmítne)
```
Harness `<head>`: `<link>` na file:/// systémový list CSS + `<link>` na konkrétní
`<sys>-skins/<id>.css` (NEBO module .module.css) + Google Fonts. `<body>`: obal
`<div data-diary-system="<sys>" data-diary-skin="<id>">` kolem reprezentativního markupu
(vytáhni z `<Sys>Sheet.tsx` / module .tsx). Renderuj: 8 skinů + `_none_` (regrese) + mobil.
**Vždy ověř `npm run build` SÁM** — agentův browser-render odpustí chyby, postcss ne.

---

## 7. Audit checklist (per skin × povrch)

Po implementaci projeď renderem a hledej:
- **Čitelnost/kontrast:** žádný void-na-voidu (scifi readout!), tmavý text na tmavém, akcent na akcentu. OČ/jméno/total čitelné.
- **Embed plochy:** každý skin MÁ přebít `--dd-embed-*`/`--mx-log-*` (jinak padá na fantasy default → cizí barva). Surface NEPRŮHLEDNÁ.
- **Signature přítomen:** dicelog/readout/panely nesmí být jen „přebarvené" — musí mít skin-specifický tvar (rám/scanline/nýt/…). Jinak porušení base.md.
- **Žádné hardcoded leaky:** bonus badge, přetlaky, vitals heat, `.skillMod`, erb fill, marker `◆` — vše tokenizuj, ať sleduje skin (audit drd16/matrix našel přesně tyhle).
- **Tlumené/světlé skiny:** neon (přetlaky/heat) tam ŘVE → ztlum do palety skinu (gradace drž).
- **List ↔ panel konzistence:** panel nesmí být o stupeň pod deníkem (matrix měl generický ◆ místo skin signature).
- **Erb/štít:** per-skin přebarvit (drd16 reziduum: červeno-zlatý SVG i ve scifi/minimal).
- **⚠️ OBALENÍ (chrome) — POVINNĚ render čtveřice PC×bestie × mapa×chat:** vyrenderuj **obal v TM** (D = `TokenInfoPanel`) i **chat rail obal** (G = railShell) kolem **PC combat panelu I bestie panelu**, v OBOU kontextech (mapa + chat) — potvrď, že CHROME (hlavička avatar+jméno + pozadí obalu) nese skin, ne jen vnitřní obsah panelu. **Chrome ≠ obsah:** obsah (`.section`) může být naskinovaný a obal přitom baseline/tmavý (token na něj nedosáhne — past §9.18). Tahle čtveřice (PC×mapa, PC×chat, bestie×mapa, bestie×chat) se NEJSNÁZ zapomene — v praxi ji chytil uživatel, ne audit.
- **⚠️ HODY (E = `DiceRollOverlay`) + ORCHESTRACE (H = `MapPjPanel`) — POVINNĚ render:** potvrď, že nesou skin — readout = barva + signature TVAR; orchestrace = barva/font (BEZ ornamentu, policy §3). Ne „naimplementoval jsem" — render je důkaz.

---

## 8. Kopírovatelné agent-briefy

**Design (mockup) fáze** — vzor `c:/tmp/drdplus-skins/_BRIEF.md`: mise+laťka, výstup
(standalone HTML galerie všech povrchů + notes.md), §pravidla (originalita, signature,
pure CSS, fonty, rodinná konzistence), §struktura listu daného systému (sekce/pole/třídy),
§bestie šablona, §povrchy. 1 opus agent = 1 skin, reference = sesterský `<sys2>-skins/<id>.css`.

**Implementační fáze** — vzor `c:/tmp/drdplus-skins/_IMPL_BRIEF.md`: scope selektor,
token seznamy (§4), `.<sys>-*` třídy (z list CSS), pravidla (compound prefix na KAŽDÉM
pravidle, jen CSS/SVG, regrese-safe), výstup `styles/<sys>-skins/<id>.css`. 1 agent = 1 skin.

**Audit fáze** — vzor (tenhle session): 1 agent = 1 systém, postaví harnessy, vyrenderuje
8×5 povrchů, posoudí proti laťce (sesterský systém), vrátí tabulku nálezů + severita + PNG cesty.

---

## 9. PASTI (poučení z matrix/drd16/drdplus)

1. **`*/` v CSS komentáři** — text `--sf-*/--st-*` obsahuje `*/` → **předčasně uzavře
   komentář** → build error („Unknown word"/„Unexpected '/'"). Piš `--sf- --st-` nebo `--sf-/--st-`.
2. **`@import` musí být první** (po komentáři/`@charset`) — i fontový. Vnořené `@import`
   v module CSS = build error. Fonty raději jen v diary-skins.css (globální), v modulech NE.
3. **Hash module třídy** nejdou cílit globálně → ornament panelu MUSÍ být v jeho .module.css.
4. **Lokální `--xx-*` na `.root`/`.panel` stíní skin** z předka → odeber, nahraď `var(--token, fallback)`.
5. **Embed surface musí být OPAQUE** (`--dd-embed-surface`/`--mx-log-surface`) — průhledná „prosvítá" na mapu.
6. **`var(name, a), var(name, b)`** (3 argumenty / čárka) v `background` shorthandu = padne na `transparent`. Pozor.
7. **Default skin systému** (registry) → po skinu se VÝCHOZÍ vzhled změní (drdplus: pergamen→grimoár). Řekni uživateli.
8. **Browser render ≠ build** — postcss je striktní, browser odpustí. Vždy `npm run build` sám.
9. **Per uživatel×svět**, ne globální/per-postava. Sémantické barvy drží význam.

### Pasti z 2026-06-29 (ornament parita embedů + HP na mapě)
10. **`var(--x)` BEZ fallbacku na neexistující/nedosažitelný token = TICHÉ NIC.** `background-image:
    var(--corner-tl)` kde `--corner-tl` neexistuje → invalid value → property ignored → ornament
    se NEVYKRESLÍ, ale **build projde** (validní syntax). VŽDY `var(--x, <konkrétní hodnota>)` nebo
    inline. Agenti `--*-corner-*` HALUCINUJÍ (tokeny jsou jen v HTML návrhu, NE v repo) — dej inline SVG.
11. **Tvarové tokeny (`--sf-*`, `--h-*`, `--corner-*`) jsou na `.<sys>-diary` scope** (deníkový
    kořen) → z EMBEDU (`.panel`/`.readout`, jiná větev DOM) jsou NEDOSAŽITELNÉ. Na embed dej
    ornament jako **inline** hodnotu, NEBO token definuj na embed-dosažitelný scope
    (`[data-diary-system][data-diary-skin] .panel { --x: … }`).
12. **Build = nutná, NE dostatečná podmínka pro grafiku.** `var()` bez fallbacku, inline `style={{}}`
    hardcode, špatný scope — nic z toho build nezachytí. **Render-verify je POVINNÝ** (i izolovaný
    harness §6). „Implementoval jsem ornament + build OK" ≠ „uživatel ho vidí".
13. **Render harness scope MUSÍ kopírovat reálnou DOM hierarchii.** `TokenInfoPanel` = atributy
    PŘÍMO na `.panel` (compound `.panel[data-diary-system='jad']`). `DiceRollOverlay`/chat rail =
    atributy na PŘEDKOVI (`DiarySkinScope`), selektor je descendant `[ds][dsk] .readout`. Když dáš
    atributy na špatný element, ornament se nezobrazí → FALEŠNÝ závěr „nefunguje". Obal markup správně.
14. **HP na mapě (povrch I):** resolver čte VYMYŠLENÉ klíče = HP bar tiše nejede a **zelený test to
    maskuje** (test psaný proti stejné fikci). Ověř reálně ukládané klíče (`save({...})` + `makeCdAccess`
    prefix). Test = reálná data, ne hodnoty z hlavy.
15. **Inline `style={{}}` v TSX přebíjí skin a je MIMO dosah CSS/token grepu.** HP bar fill byl
    hardcoded teploměr v JS (`hpColor = pct>50?'#5a7d3a'…`) → token-audit ho nenašel. Při auditu
    „propisuje se skin?" grepuj i `style={{` / hex literály v TSX, ne jen CSS tokeny.
16. **Token drift v pojmenování:** stejný koncept pod víc názvy (`--dd-hpbar-fill` mrtvý vs
    `--dd-hpfill-grad` živý; `--dd-spell` vs `--dd-mag` vs `--dd-sapphire`). Před přidáním tokenu
    grepni, jestli už neexistuje pod jiným jménem; fallback řetěz `var(--a, var(--b, …))` sjednotí bez přejmenování.
17. **Fan-out agenti pracují IZOLOVANĚ bez ověřeného kontextu o scope/existenci tokenů** → musí
    dostat: „tokeny `--corner-*` NEEXISTUJÍ, použij inline" + „embed nedosáhne na `.<sys>-diary` tokeny"
    + „povinný render-verify s OBALENÝM markupem". Jinak vyrobí tiše-rozbitý kód, co projde buildem.

### Pasti z 2026-06-29 (obalení v mapě/chatu + mockup placeholdery — pi skiny)
18. **Obal/chrome NEDOSÁHNE na per-skin tokeny (chat rail i obal v TM).** `--<sys>-log-*` (skin override)
    žijí na `DiarySkinScope` (POTOMEK), ale obal `.panel` chrome je jeho PŘEDEK → CSS proměnné tečou jen
    DOLŮ → chrome spadne na baseline (tmavá) pro VŠECHNY skiny, i když obsah panelu (`.section`) JE
    naskinovaný. **To je nejčastější „skin se neprojevil" — obsah OK, obal tmavý.** Fix: per-skin
    `.panel:has([data-diary-system='<sys>'][data-diary-skin='X'])` s LITERÁLNÍMI barvami skinu (vzor dd
    rodin v `railShell.module.css`). Chat obal = JEN barva (ornament policy §3). U obalu v TM
    (`TokenInfoPanel`) bývají atributy PŘÍMO na `.panel` (compound) — ověř scope renderem (past §9.13).
19. **Mockup-odvozené skiny míří na PLACEHOLDER třídy, co v reálném DOM neexistují.** Mockup používá
    náhradní názvy za hashované modulové třídy (`.cp-section`/`.cp-title`/`.ro-readout`); agent je zkopíruje
    do skin souboru → ornament panelu/readoutu je TICHO MRTVÝ (build OK, barva OK, TVAR chybí). Reálné
    třídy jsou `.section`/`.title`/`.readout` v `*.module.css`. **Ornament panelu/readoutu PATŘÍ do jeho
    `.module.css`** na reálné třídy (scoped `[data-diary-system][data-diary-skin] .section`), NE do skin
    souboru na `.cp-*`. Render-verify VŽDY proti reálnému zdrojovému CSS, ne proti mockupu (rodina §9.12).

---

## 10. Checklist nového systému (zaškrtávací)

- [ ] Krok 0: přečteno base + playbook + sesterské skiny
- [ ] Krok 1: combat+bestie panel tokenizovány (regrese-safe), default blok v diary-skins.css
- [ ] Krok 1b: **HP bar fill** = `--dd-hpfill-grad` (NE hardcoded JS `hpColor`); **list tokeny** `--<sys>-hp/spell/insp` v base `<sys>.css`
- [ ] Krok 2: build ✓ + default render beze změny
- [ ] Krok 3: 8× `<sys>-skins/<id>.css` (token+font+ornament listu) + 8× @import
- [ ] Krok 4: **readout (E) + obal v TM (D)** per-skin signature TVAR; **chat rail obal (G) per-skin BARVA** přes `:has()` (chrome nedosáhne na tokeny, past §9.18); **dicelog (F) + orchestrace (H) BEZ ornamentu** — jen barva/font (ornament policy §3)
- [ ] Krok 4b: **HP bar na mapě** (I) — `case '<sys>'` v `resolveCharacterHp` s REÁLNÝMI klíči + test proti reálným datům
- [ ] Krok 5: harness render 8 skinů + default + mobil ✓ — **markup OBALEN správně** (compound vs descendant scope, past §9.13); ověř, že ornament je VIDĚT (ne `var()` bez fallbacku, past §9.10)
- [ ] Krok 6: audit checklist projet (vč. grep `style={{`/hex v TSX, past §9.15), nálezy opraveny
- [ ] Krok 6b: **OBALENÍ render-ověřeno** — PC combat panel **i** bestie panel **obalené** v MAPĚ (D=`TokenInfoPanel`) **i** CHATU (G=railShell); chrome (hlavička+pozadí obalu) nese skin, ne jen obsah (past §9.18). **+ HODY (E) + ORCHESTRACE (H)** renderem potvrzené (§7). Tahle čtveřice se NEJSNÁZ zapomene.
- [ ] Krok 7: mobil-desktop · funkce · napoveda · build ✓ · commit
- [ ] Reziduum/dluhy zapsány
</content>
