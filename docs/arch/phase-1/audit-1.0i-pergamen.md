# Audit 1.0i — Pergamen skin design audit

**Datum:** 2026-05-10
**Fáze:** mezi spec v2 a impl. plán (memory rule: skin → frontend-design audit)
**Vstupy:** spec-1.0i v2, prompts-1.0i, 3 dodané assety (logo/medailon/big-book), priroda předloha, existující BG `pergamen.webp`.

---

## TL;DR

Spec je **z 65 % ready**. **3 BLOCKERY, 6 HIGH, 7 MEDIUM, 4 LOW.** Hlavní problém: **welcome card s big-book overlayem rozbíjí WCAG kontrast textu** (krémový text na poloprůhledné pergamenové ploše = fail). Druhý problém: **knižní záložka koliduje s corner ornamentem v TR rohu**. Třetí: **7 pečetí budou v 22×22px nerozlišitelné** (všechny burgundy puntíky).

Po vyřešení blockerů a high-priority bodů můžeme jít do impl. plánu.

---

## 1) Vizuální konzistence dodaných assetů (rodina)

| Asset | Dominantní plocha | Lighting | Paleta | Verdict |
|---|---|---|---|---|
| logo | tmavé dřevo + zlatá kaligrafie | TL warm gold | wood + gold + burgundy medailon | ✅ family |
| medailon | sytě burgundy pergamen + zlatý rámeček | TL warm | burgundy + gold + cream anděl | ✅ family |
| big-book | **světlý pergamen + tmavé dřevěné desky** | TL warm | wood + cream + drobně burgundy ozdobník | ⚠️ rozporný |

**Rozbor odchylky big-book:**
- Logo a medailon dominantně **TMAVÉ** plochy (dřevo, burgundy)
- Big-book má **OBROVSKOU SVĚTLOU PERGAMENOVOU PLOCHU** uvnitř
- Důsledek: pokud big-book položíme do welcome card *za text*, vytvoří *světlou zónu* uprostřed *tmavého* layoutu → **vizuální nekonzistence + WCAG kontrast pro text** (viz BLOCKER B1)
- Pergamen-krém v palette je správně, ale **proportion/distribution** je v big-booku nečekaný

→ **BLOCKER B1, viz sekce 9**.

**Skrytá implikace pro 12 nových assetů:** musí mít stejné proporce tmavých vs. světlých ploch jako logo/medailon — t.j. **dominantně tmavé** s drobnými cream akcenty, ne obráceně. Spec to říká explicitně pro pečetě (burgundy dominanta), ale nestanovuje pro corner-tl ani iluminované V.

---

## 2) Asset prompty — výrobní rizika

| # | Riziko | Dopad | Tip |
|---|---|---|---|
| A1 | **Pečetě v 22×22px ztrácí symbolickou diferenciaci** — 7× kruhový burgundy puntík se zlatou tečkou uprostřed | uživatel nerozliší „kniha" vs „kniha s otazníkem" vs „svitek" | symboly v promptu **silnější / jednodušší** (single-shape, ne multi-element); přidat 1 unikátní hue accent na ikonu (hospoda = amber, ostatní = pure gold) |
| A2 | **icon-uvodnik a icon-clanky symboly velmi blízké** (oba „částečně rozvinutý svitek") | dva nav-itemy vypadají identicky | uvodnik = **otevřená kniha plochá** (book), clanky = **stojící svitek se stuhou** (scroll) — výraznější tvarový kontrast |
| A3 | **icon-napoveda má 2 prvky uvnitř pečetě** (kniha + otazník) | overcrowded v 22×22, otazník zanikne | drop kniha, jen velký kaligrafický „?" na vosku |
| A4 | **icon-galerie symbol „rám s ilustrací uvnitř" = 2 vnořené prvky** | overcrowded v 22×22 | jen rám (bez ilustrace), nebo jen abstract triangle/mountain |
| A5 | **iluminované „V"** — Midjourney má tendenci generovat full word „Victorian" nebo „Veni vidi vici" místo single letter | wasted gen tokens | explicit: `single isolated capital letter V only, no word, no other letters, exactly one V character` v promptu |
| A6 | **bookmark vertical 96×320 ratio 3:10** je pro MJ unusual ratio (`--ar 3:10`) | MJ může vrátit cropped square nebo 1:3 | použít `--ar 1:3` (~96×288, blízké) a v post-processingu padding na 96×320 |
| A7 | Všechny assety mají transparent alpha — `cwebp -q 90 -alpha_q 100` OK | žádné | ✅ |
| A8 | **Wax seal symbol „+" v 24×24px = pixel mush** | symbol nečitelný | wax seal **bez symbolu** (jen burgundy circle s gold hairline), nebo zvětšit na 32×32 |

---

## 3) Token model — diff vs. spec sekce 3

### Chybí ve specu (přidat do `index.ts`)

```ts
// Welcome card big-book — NESMÍ být přes background-image, viz B1
'--asset-bigbook-opacity':   '0.30',           // ne 0.55, viz B1
'--asset-bigbook-blend':     'multiply',       // smíchá s tmavým pozadím

// Iluminované V — slot rozměr a align
'--asset-iluminated-v-w':       '64px',        // ne 80px, viz H4
'--asset-iluminated-v-w-mobile':'48px',
'--asset-iluminated-v-offset':  '-12px',       // negative left offset aby V splývalo s textem

// Knižní záložka — pozice mimo corner zone (viz B2)
'--asset-bookmark-w':           '48px',        // ne 96px na canvas, ale display šířka
'--asset-bookmark-h':           '160px',
'--asset-bookmark-right':       '88px',        // mimo corner zone (corner = right: -8px do 112px)
'--asset-bookmark-top':         '0px',

// Wax seal CTA — mini variant
'--asset-wax-seal-size':         '24px',
'--asset-wax-seal-size-mobile':  '20px',

// Section title decoration — drobná pečeť uprostřed
'--asset-divider-seal-size':    '8px',         // ne 4-6px, viz H5
                                                // ALT: pure CSS implementation, žádný asset

// Welcome heading text barva — TMAVÁ pokud big-book = SVĚTLÁ zóna
'--theme-welcome-heading-color':  'var(--theme-accent-gold)',
'--theme-welcome-body-color':     'var(--theme-text)',  // krémová OK, big-book opacity 0.30 to dovolí
```

### Redundance / pojmenování

| Token | Stav | Doporučení |
|---|---|---|
| `--theme-accent-burgundy` + `--theme-accent-burgundy-bright` | OK, dual-strength pattern | ponechat |
| `--theme-text-muted: #b8a070` | WCAG AA pass na surface (~5.0:1) | ✅ ponechat |
| `--theme-text-on-burgundy: #f0e0b8` | proti `#8a1a10` ratio ~7.5:1 ✅ | ponechat |
| `--theme-text-on-gold: #3d2914` | proti `#d4a946` ratio ~5.6:1 ✅ | ponechat |
| `--text-muted: #806040` (legacy) | působí jako placeholder | doc nebo drop |

### Chybí explicit prefer-color-scheme handling

Spec implicitně **dark-only** (podobně jako priroda). Měla by být explicit pozn. v atmosphere: *„dark mode only — light mode varianta neuvažována".*

---

## 4) Layout problémy

### 4.1 Welcome card big-book — největší problém celého spec

Spec říká:
> Big-book jako decorative layer (`opacity: 0.55`, `position: absolute`, vycentrované za textem)
> Body text: Lora regular, krémová

**Realita s těmito hodnotami:**
- Big-book má uvnitř **velkou světlou pergamenovou plochu** (~70% jeho rozměru = ~420×240px)
- Při opacity 0.55 → pergamen plocha = blend dark wood × cream pergamen = vznikne **béžová/khaki zóna ~#90805a uprostřed welcome cardu**
- Krémový text (`#e8d8a0`) na béžovém pozadí (`#90805a`) = **kontrast ~2.1:1 = WCAG AA FAIL** (potřebuje 4.5:1)

**3 možná řešení:**

| Varianta | Popis | Pros | Cons |
|---|---|---|---|
| **A. Snížit opacity na 0.25-0.30 + blend-mode multiply** | Big-book skoro neviditelný, plocha tmavá | Krémový text čitelný | Big-book asset je tak slabý že „proč ho tam mít?" |
| **B. Big-book ano, ale text TMAVÝ** | Welcome heading tmavé burgundy/inkoust | Vizuálně silně, big-book viditelný | Rozporuje s rest of skin (vše krémové) |
| **C. Big-book NE za textem, ale pod textem (dole)** | Big-book v dolní třetině welcome cardu, text v horní třetině na čistém tmavém pozadí | Best of both | Asymetrický layout vs aktuální obrázek 2 |
| **D. Big-book vlevo místo medailonu, medailon přesun** | Velký asset jako anchor vlevo, text vpravo na tmavém | Velký dopad assetu | Mění layout welcome — možná lepší než decor layer |

**Doporučení:** **A** s `opacity: 0.30` + `mix-blend-mode: multiply` + zachovaný krémový text (multiply zachová tmavou zónu pod textem). Pokud A nefunguje vizuálně (test v audit), fallback **C**.

→ **BLOCKER B1**.

### 4.2 Knižní záložka × corner ornament kolize

Spec:
> Knižní záložka: `position: absolute; top: -8px; right: 32px;`
> Corner ornament: TR `top: -8px; right: -8px; width: 120px;` (z priroda předlohy)

**Kolize:** corner ornament zabírá zónu `right: -8px` až `right: 112px` (= width 120 − inset 8). Záložka v `right: 32px` je **uvnitř corner zóny**. Záložka by visela přes zlatý ornament rohu = vizuální nepořádek.

**Řešení:**
- Posunout záložku na `right: 88px` (těsně za corner) NEBO
- Posunout záložku na **levý** horní roh (kniha v rukopisech častěji měla záložku na levé straně) NEBO
- Záložka NA welcome cardu, ale visící z `top: 24px; right: -16px;` ven z welcome cardu (jako closet hanger)

**Doporučení:** **třetí varianta** — záložka visící zvenku welcome cardu vpravo nahoře, jako by někdo zavěsil pravoruční hodinky. Nejvíc autentické a žádná kolize.

→ **BLOCKER B2**.

### 4.3 Iluminované V × text „Vítej"

Spec:
> Iluminované „V" — první písmeno „Vítej" je velké iluminované kapitálum (asset 80×80px, position: absolute před textem).

**Problém 1:** první písmeno textu je už „V". Iluminované V + textové V = **dvě V vedle sebe** („Vítej v..." + obrázek V před tím).
**Problém 2:** layout — pokud V je `position: absolute` před nadpisem, co když nadpis přechází na 2. řádek (úzké viewporty)? V se rozjede.
**Problém 3:** velikost 80×80 vs nadpis (typicky `font-size: 28-32px` = `line-height: ~40px`) — V je 2× výška nadpisu → trčí nahoru i dolů.

**Řešení:**
- **Skrýt textové V** přes `::first-letter { visibility: hidden }` (ale `::first-letter` nepodporuje `visibility`, použít `font-size: 0` nebo split textu na span)
- **Velikost V = 64×64px** (ne 80) — drop cap proporce
- **Inline-block, ne absolute** — V se zaintegruje do text-flow, line-break nerozbije layout
- Mobile (≤768px): V hidden (nikoli ≤480px jak spec říká)

→ **HIGH H1, viz sekce 9**.

### 4.4 Existující BG × atmosférický overlay = double-warm

Existující `pergamen.webp` je **už teplý/oranžový** (knihovna se svíčkami). Spec přidává:
- radial gold 50/0% (gold = warm)
- radial burgundy 50/100% (burgundy = warm)
- linear darken 42-66%

→ Výsledek = **tripple warm + dark** = monotónně tmavě-oranžová atmosféra, scéna ztratí kontrast.

**Doporučení:** redukovat color tints na minimum, soustředit se na DARKEN:
```css
'--theme-bg-overlay':
  'linear-gradient(180deg, rgba(20, 14, 4, 0.55) 0%, rgba(20, 14, 4, 0.72) 100%)'
```
Bez color tints → BG je naturálně teplý, overlay jen ztmaví pro čitelnost UI.

→ **HIGH H2**.

---

## 5) Pečetě v 22×22px — symbolická diferenciace

V rendrovaných nav-itemech budou pečetě jen 22×22px (mobile 18×18). 7 různých symbolů uvnitř kruhu o průměru ~14px:

| Symbol | Čitelnost v 22px | Risk |
|---|---|---|
| `uvodnik` — open book 3/4 | ⚠️ nízká | 2 stránky knihy = 2 trojúhelníky, hard to read |
| `vytvorit-svet` — quill pen + drop | ✅ dobrá | jasný diagonální tvar |
| `diskuze` — rolled letter side view | ⚠️ nízká | kruhový tvar v kruhové pečeti = circle in circle, splývá |
| `clanky` — partly rolled scroll + ribbon | ❌ špatná | 3 elementy v 14px = mush |
| `galerie` — frame + miniature | ❌ špatná | 2 vnořené elementy |
| `napoveda` — book + question mark | ⚠️ nízká | 2 elementy |
| `hospoda` — pewter tankard 3/4 | ✅ dobrá | jasná silueta |

**Doporučení — zjednodušit symboly:**

| Nav-key | Aktuální (komplex) | Nový (single-shape, čitelný v 22px) |
|---|---|---|
| `uvodnik` | open book 3/4 + squiggles | **front-on book closed s zlatou hvězdou na desce** (silueta jako tarot karta) |
| `vytvorit-svet` | quill + drop | ✅ ponechat (čitelné) |
| `diskuze` | rolled letter side | **2 horizontal speech-line wavy** (jako ZNAK = ≈) |
| `clanky` | scroll + ribbon | **vertikální brk svisle nahoru + horizontální liška dole** (kříž) — nebo jen otevřený svitek bez stuhy |
| `galerie` | frame + miniature | **jen rectangle frame s 4-pointed star ve středu** |
| `napoveda` | book + question | **jen velký kaligrafický „?"** (drop book) |
| `hospoda` | tankard 3/4 | ✅ ponechat |

→ **HIGH H3**.

---

## 6) Mobile/breakpoint mezery

| # | Issue | Aktuální spec | Doporučení |
|---|---|---|---|
| M1 | iluminované V hidden už od ≤768px (ne ≤480px) | ≤480px hidden | změnit na ≤768px |
| M2 | knižní záložka — co s ní 320-768px? | scaled 60% | hidden ≤768px (na mobile vertical stack se nehodí) |
| M3 | medailon 120×145px na mobile = stále velký | 120×145 | snížit na 96×116 nebo skrýt na ≤480px |
| M4 | Pravý sidebar pod 1024px = drawer? Spec mlčí | implicit jako priroda | doplnit explicit + corner v drawer hidden |
| M5 | Touch target nav-item ≥48px | implicit | explicit `min-height: 48px` na mobile |

---

## 7) WCAG kontrast risks

| Element | Foreground | Background | Ratio | Status |
|---|---|---|---|---|
| Welcome heading „Vítej v Projektu Ikaros" | `#d4a946` (gold) | tmavé dřevo `~#28190a` | **5.6:1** | ✅ AA |
| Welcome body | `#e8d8a0` (cream) | tmavé dřevo `~#28190a` | **9.8:1** | ✅ AAA |
| **Welcome body PŘES big-book overlay 0.55** | `#e8d8a0` | béžová `~#90805a` (blend) | **2.1:1** | ❌ **AA FAIL** (B1) |
| NavItem text klid | `#e8d8a0` | dřevo `#28190a` | **9.8:1** | ✅ AAA |
| NavItem text active | `#fff8e0` | burgundy `#8a1a10` | **6.8:1** | ✅ AA |
| Header button text | `#d4a946` | dřevo `#28190a` | **5.6:1** | ✅ AA |
| Section title | `#d4a946` | dřevo `#28190a` | **5.6:1** | ✅ AA |
| Pečeť gold relief | `#d4a946` | burgundy `#8a1a10` | **3.4:1** | ⚠️ visual contrast (ne text), OK |

→ Jediný WCAG fail je **welcome body přes big-book** — řeší B1.

---

## 8) Bonus prvky — risk recap

| Prvek | Hodnota | Risk | Verdict |
|---|---|---|---|
| Iluminované V | vysoká, autentická | layout ↑ při line-break, „dvě V" issue | ✅ udržet, opravit přes H1 |
| Wax seal CTA | střední | nevejde se symbol v 24px, ZOBRAZIT VŠE link nemá „+" | ⚠️ úprava: jen na PŘIDAT NOVINKU, bez symbolu |
| Knižní záložka | střední | kolize s corner | ✅ udržet, opravit přes B2 |

---

## 9) BLOCKER + HIGH + MEDIUM + LOW

### 🔴 BLOCKERY (musí se vyřešit před impl. plánem)

**B1. Welcome body text WCAG fail přes big-book overlay**
- Aktuální spec: opacity 0.55, krémový text
- Realita: text na béžové ploše = 2.1:1 fail
- **Fix:** opacity 0.30 + `mix-blend-mode: multiply`. Pokud po implementaci visual test stále špatný, switch na variantu C (big-book v dolní třetině).
- **Acceptance:** krémový text na centrum welcome card má kontrast ≥4.5:1 měřený přes Chrome DevTools color picker

**B2. Knižní záložka × corner ornament kolize v TR rohu**
- Aktuální spec: záložka `right: 32px` = uvnitř corner zóny
- **Fix:** záložka visící z `top: 24px; right: -16px;` ven z welcome cardu (closet hanger styl)
- **Acceptance:** záložka neoverlapuje žádný ornament v žádném viewport size

**B3. 7 pečetí — symbolová mush v 22×22px**
- Aktuální spec: komplexní symboly (book + squiggles, scroll + ribbon, frame + miniature, book + question)
- **Fix:** přepsat 4 prompts na single-shape silnější tvary (viz sekce 5)
- **Acceptance:** všech 7 ikon je rozlišitelných na 22×22 zoom-100% v Chrome DevTools

### 🟠 HIGH (řešit před impl. plánem)

**H1. Iluminované V — layout, velikost, „dvě V"**
- **Fix:** velikost 64px (ne 80), `display: inline-block`, hide first-letter textového V přes split-span techniku, hidden ≤768px
- **Acceptance:** jen jedno V vidět, layout nepraská při line-break

**H2. Atmosférický overlay — double-warm na warm BG**
- **Fix:** redukovat color tints, jen darken
  ```css
  'linear-gradient(180deg, rgba(20, 14, 4, 0.55) 0%, rgba(20, 14, 4, 0.72) 100%)'
  ```
- **Acceptance:** scéna nemá monotónně oranžový look

**H3. Pečetě prompts — zjednodušit symboly**
- **Fix:** přepsat 4 prompts (uvodnik, diskuze, clanky, galerie, napoveda) podle tabulky v sekci 5
- **Acceptance:** vizuální QA 7 ikon vedle sebe v 22×22 → každá rozlišitelná

**H4. Wax seal CTA — symbol nečitelný v 24px**
- **Fix:** wax seal **bez symbolu uvnitř** (jen burgundy circle s gold hairline)
- **Acceptance:** wax seal v 24×24px vypadá jako pečeť, ne jako tečka

**H5. Wax seal CTA — jen na PŘIDAT NOVINKU, ne na ZOBRAZIT VŠE**
- **Fix:** spec sekce 1.5 + 1.6, restrict CTA seal na přidat-novinky a + tlačítka, ZOBRAZIT VŠE zůstane link-style
- **Acceptance:** „ZOBRAZIT VŠE →" nemá wax seal

**H6. Folder rename `pergament` → `pergamen` v assets-source**
- **Fix:** plan-1.0i checkpoint #1 = git mv `pergament/` → `pergamen/`, přepsat references v finalize skriptu
- **Acceptance:** žádný broken path po rename

### 🟡 MEDIUM (nice to have před impl. plánem)

**M1. Existující BG × všechna 3 dodaná tmavá assety = málo cream akcentů**
- BG je teplý, logo/medailon tmavé. Welcome card bude vyžadovat něco světlého (big-book?). Pokud B1 fix snižuje big-book opacity → ztratí se cream akcent. **Návrh:** drobné cream highlights v corner-tl prompt (hairline accents, ne dominantní).

**M2. Sekční divider seal — 4-6px je málo, vypadá jako tečka**
- **Fix:** zvětšit na 8px, NEBO CSS-only (border-radius circle, žádný asset). Doporučuju CSS-only.

**M3. Iluminované V — barevný bod uvnitř V**
- Spec: „burgundy + tiny gold star/quatrefoil"
- Risk: malé akcentové barvy (zelený dot) prompt explicitly zakazuje (`green` je v negative)
- **Fix:** explicit „NO green dots, only burgundy and gold accents" v promptu

**M4. Mobile medailon 120×145 stále velký**
- **Fix:** snížit na 96×116px nebo skrýt na ≤480px

**M5. Pravý sidebar drawer ≤1024px**
- Spec mlčí — explicit zmínka že drawer behavior follows priroda pattern

**M6. Touch target mobile**
- Explicit `min-height: 48px` na nav-itemy mobile

**M7. Bookmark MJ ratio 3:10 unusual**
- Použít `--ar 1:3` v MJ promptu, post-processing padding

### 🟢 LOW (po implementaci, polish)

**L1. Reduced motion explicit `transition: none`** — spec OK, jen verify v decorations

**L2. Scrollbar styling cross-browser fallback** — spec OK, Chromium-only `::-webkit-scrollbar`

**L3. Print stylesheet** — neuvažováno, ne v scope

**L4. Localization fallback fonts** — Cinzel/Lora/IM Fell English mají Latin Extended, OK pro češtinu

---

## 10) Doporučení pro impl. plán (`plan-1.0i.md`)

### Pořadí prací

1. **Pre-flight** — `git status` clean, grep „pergament" sweep, verify `pergamen.webp` BG existuje
2. **Folder rename** — `assets-source/themes/pergament/` → `pergamen/` (single commit, no other changes)
3. **Spec update** — aplikovat B1, B2, B3, H1-H6 do specu (single commit)
4. **Prompts update** — přepsat 4 pečetě + wax seal + V (single commit)
5. **User generuje 12 AI assetů** — pause, čekat na ✅ od user
6. **Asset finalize script** — `scripts/finalize-pergamen-assets.mjs` (PNG→WebP s sharpening)
7. **Tokens** — přepsat `pergamen/index.ts` plnou luxury sadou
8. **Decorations** — přepsat `pergamen/decorations.css` (~650 řádků)
9. **Test** — manuální QA na 6 viewportech (320/375/768/1024/1280/1440)
10. **Mobil-desktop sweep** — skill `mobil-desktop`
11. **Regression check** — přepnout na 5 random skinů (priroda, vesmirna-lod, sci-fi, kyberpunk, magie) — 0 regrese

### Edit list

| File | Action | Důvod |
|---|---|---|
| `assets-source/themes/pergament/` → `pergamen/` | rename | folder/ID sjednocení |
| `docs/arch/phase-1/spec-1.0i-pergamen-upgrade.md` | edit | aplikovat B1-B3, H1-H6 |
| `docs/arch/phase-1/prompts-1.0i-pergamen-assets.md` | edit | aplikovat H3, H4 |
| `scripts/finalize-pergamen-assets.mjs` | new | PNG→WebP pipeline |
| `src/themes/themes/pergamen/index.ts` | rewrite | plná luxury token sada |
| `src/themes/themes/pergamen/decorations.css` | rewrite | ~650 řádků scoped |
| `public/themes/pergamen/decor/*.webp` | new (12 souborů) | finalizováno z PNG |

### Test plan

- **Desktop 1440×900** Chrome → screenshot vs. obrázek 2 mockup
- **Tablet 1024×768** → corner 96px, big-book scale 80%
- **Mobile 375×667** → big-book hidden, V hidden, bookmark hidden, header icon-only
- **Mobile 320×568** → drawer behavior, hamburger menu
- **Reduced motion** prefer → verify žádné transitions
- **WCAG audit** Chrome DevTools Lighthouse → score ≥95 accessibility
- **Regression** přepnout 5 random skinů → 0 vizuálních změn

---

## 11) Verdikt

Spec **nelze pustit** přímo do impl. plánu. Tři blockery (B1-B3) musí být vyřešené v aktualizovaném specu/promptech. Po fixu blockerů + high-priority bodů → impl. plán může vzniknout.

**Odhad času na fixy (Claude):**
- B1+B2+B3 + H1-H6 spec/prompts edits: ~30 min
- Po user souhlasu s úpravami: impl. plán cca 45 min
- User asset generation: ~2 hod (jeho práce, ne moje)
- Implementace (po dodání assetů): ~3 hod (finalize + tokens + decorations + test)

**Next step:** user prochází audit, schvaluje (nebo upravuje) navrhované fixy → Claude aplikuje fixy do spec + prompts → user souhlas → impl. plán.
