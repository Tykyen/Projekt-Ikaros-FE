# a11y warnings cleanup — podklady pro novou konverzaci

> Vlož tenhle soubor (nebo jeho obsah) na začátek nové konverzace. Popisuje, co se
> má udělat, v jakém je to stavu a kde jsou pasti, aby se dalo navázat bez historie.

## Cíl
Snížit / vyčistit **1284 ESLint warningů** ve FE (`Projekt-ikaros-FE`). Většina je
**přístupnost (jsx-a11y)**. Cíl = testeři a hendikepovaní uživatelé mají použitelné
UI + čistá CI. **0 errorů**, takže nic teď nehoří — je to kvalitativní dluh.

## Stav
- ✅✅✅ **HOTOVO (2026-07-10)** — `npx eslint .` → **15 warningů, 0 errorů** (z 1284, **−98,8 %**).
  **Žádný a11y ani react-hooks warning nezbývá.** Zbývajících 15 = jen `react-refresh/only-export-components`
  = **NENÍ bug** (HMR dev-experience: soubor exportuje komponentu + helper). jsonLd.tsx 11 (case-collision historie
  CH-019 → split rizikový) + FateLikeSheet/CocBestieCombatActions/GurpsBestieCombatActions/RoleStar po 1. Ponecháno
  jako acknowledged tech-debt (per config „postupně refaktorujeme").
- Postup: config fix (1284→345) → dávka 1 label-association (76, →269) → dávka 2 klikací cluster (139, →130)
  → dávka 3 aria+treeitem (11, →119) + autofocus block-disable (36, →83) → dávka B react-hooks (68, →15).
  Vše build + dávkové specy ověřeno. Detail: [fe.md ✅ ŘEŠENÍ + CH-068/069].
- **Dávka B highlight:** `react-hooks/refs` 51 → root fix = destrukturovat `useVoice()` výsledek (member-access
  `voice.X` na hook-výsledku s refem plošně false-flaguje); `exhaustive-deps` 3 memoizace; zbytek confirmed-safe
  justified-disable / dead-disable removal.
- Sdílený helper: [`src/shared/lib/a11y.ts`](../../src/shared/lib/a11y.ts) `activateOnKey` (Enter/mezerník pro role=button spany).
- Config: `eslint.config.js` — severity fix + `aria-role: {ignoreNonDOM:true}`.
- ~~1284 warningů~~ (výchozí stav). CI `warn` (neblokuje), krok 17.8.
- Kompletní rozpis po souborech: **[docs/a11y-cleanup/warnings-by-file.md](./warnings-by-file.md)** (worklist, seřazeno dle počtu).
- Předchozí a11y v1 (17.8): sdílený `useFocusTrap`, KebabMenu roving-tabindex. Tehdy
  vědomě rozhodnuto **nemigrovat na IconButton** (nebyl to a11y problém) — pozor, ať
  se to nevzkřísí zbytečně.

## Rozpad podle pravidel

| # | pravidlo | počet | povaha |
|--|--|--|--|
| 1 | `jsx-a11y/control-has-associated-label` | 474 | **v recommended `off`** — vynuceno config bugem (viz Kořen). Reálně: icon-only tlačítka bez jména. |
| 2 | `jsx-a11y/label-has-for` | 468 | **v recommended `off`** (deprecated) — vynuceno config bugem. |
| 3 | `jsx-a11y/label-has-associated-control` | 76 | `<label>` nespojený s inputem → `htmlFor`+`id` nebo obalit input (REÁLNÉ) |
| 4 | `jsx-a11y/click-events-have-key-events` | 56 | `onClick` na ne-buttonu bez klávesové obsluhy |
| 5 | `react-hooks/refs` | 51 | **NE a11y** — přístup k ref v renderu; může být reálný bug, řešit zvlášť |
| 6 | `jsx-a11y/no-autofocus` | 36 | `autoFocus` (často záměr v modalech) → rozhodnout politiku |
| 7 | `jsx-a11y/no-static-element-interactions` | 29 | klikací `<div>`/`<span>` → `<button>` nebo `role`+`tabIndex`+`onKeyDown` |
| 8 | `jsx-a11y/no-noninteractive-element-interactions` | 24 | onClick na `<li>`/`<img>`… |
| 9 | `react-refresh/only-export-components` | 15 | **NE a11y** — soubor exportuje i ne-komponentu → přesunout do vlastního souboru |
| 10 | `jsx-a11y/interactive-supports-focus` | 14 | interaktivní prvek bez `tabIndex` |
| 11 | `jsx-a11y/no-noninteractive-element-to-interactive-role` | 12 | `role="button"` na `<li>`/`<div>`… |
| 12 | `jsx-a11y/aria-role` (9) · `no-noninteractive-tabindex` (4) · `role-has-required-aria-props` (2) | ~15 | drobné ARIA opravy |
| — | `react-hooks/set-state-in-effect` (7) · `exhaustive-deps` (3) · `static-components` (2) | ~12 | **NE a11y** — react-hooks, řešit individuálně (můžou to být bugy) |

Body 4+7+8+10+11 (**135**) spolu souvisí: jeden klikací `<div>` typicky spustí víc
z nich naráz → oprava elementu (na `<button>`) shodí několik warningů zaráz.

## 🔴 KOŘEN — config bug (napravit PRVNÍ, shodí 942/1284 = 73 %)
V [`eslint.config.js`](../../eslint.config.js) (kolem ř. 45–47, přidáno v 17.8):
```js
rules: Object.fromEntries(
  Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, 'warn']),
),
```
Bere **klíče** recommended pravidel a **všechna** natvrdo přepíná na `warn` — tím
**ignoruje severity**. jsx-a11y má ale 3 pravidla schválně `off` (ověřeno):
`control-has-associated-label` (474×), `label-has-for` (468×, deprecated),
`anchor-ambiguous-text` (0×). Config je nutí do `warn` → **942 „warningů", které
autoři jsx-a11y vypínají jako šum/deprecated.**

**Fix (zachovat off severity):**
```js
rules: Object.fromEntries(
  Object.entries(jsxA11y.flatConfigs.recommended.rules).map(
    ([rule, sev]) => [rule, sev === 'off' ? 'off' : 'warn'],
  ),
),
```
Po tomhle `npx eslint .` → **~342 warningů** — a to jsou teprve REÁLNÉ a11y věci.
(Rozhodnout s uživatelem: chceme-li `control-has-associated-label` přece jen řešit,
nechat ho zapnutý — ale je to volitelné nad rámec recommended.)

## Doporučený postup (na ~342 zbývajících)
1. **Config fix ↑** — zachovat `off` severity. Ověřit `npx eslint .` → ~342.
2. **`label-has-associated-control` (76)** — reálné: `<label htmlFor>` + `id` na inputu, nebo obalit. Top soubory: `diary-systems/sheets/*`, editor modaly.
3. **Klikací elementy (135)** — `click-events-have-key-events` + `no-static/noninteractive-element-interactions` + `interactive-supports-focus` spolu souvisí → převod na `<button>` (pozor na CSS reset) nebo `role`+`tabIndex={0}`+`onKeyDown`. Jeden fix shodí víc warningů. Po dávce vizuálně zkontrolovat (`mobil-desktop`).
4. **`no-autofocus` (36)** — politika: ponechat + per-line `// eslint-disable-next-line` s odůvodněním (modaly), nebo focus přes `ref` v `useEffect`. Dohodnout.
5. **Ne-a11y zbytek** (`react-hooks/refs` 51, `react-refresh/only-export-components` 15, `set-state-in-effect` 7, `exhaustive-deps` 3…) — samostatný průchod; **`react-hooks/refs` a `set-state-in-effect` můžou být reálné bugy**, číst pozorně, netlumit naslepo.

Dávky 2–3 lze pustit **paralelními agenty per feature adresář** (disjunktně).

## Pravidla projektu (DODRŽ)
- **FE NIKDY neformátuj prettierem** (obří diff) → jen `eslint --fix` na konkrétní soubory. [feedback_fe_no_prettier]
- **Commituj přímo na `main`**, žádné feature větve. [feedback_work_on_main]
- FE **nemá precommit hook** → ověřuj ručně: `npm run build` (tsc -b + vite) + `npm run test:run` (nebo cílené vitest soubory). [fe_test_precommit]
- Po **grafické změně UI** → skill `mobil-desktop`. Převod div→button může hnout layoutem.
- Uživatel testuje FE **jen na živém webu** → „nezabralo" nejdřív ověř deploy. [feedback_tests_only_on_live]
- a11y warningy **nesnižovat vypínáním pravidel plošně** (kromě doloženě deprecated `label-has-for`). `eslint-disable` jen per-line s odůvodněním.

## Jak měřit postup
```bash
cd Projekt-ikaros-FE
npx eslint . --format json | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const a=JSON.parse(d);const r={};let w=0;for(const f of a)for(const m of f.messages)if(m.severity===1){w++;r[m.ruleId]=(r[m.ruleId]||0)+1}console.log('warningů:',w);console.log(Object.entries(r).sort((x,y)=>y[1]-x[1]))})"
```
Cíl každé dávky: číslo klesá, `npm run build` zelený, testy zelené.

## Odhad rozsahu
- **1284** dnes → po config fixu (zachovat recommended `off`) **~342**.
- Z těch 342: ~76 label-association, ~135 klikací elementy (překrývají se), ~36 autofocus (politika), ~70 ne-a11y (react-hooks/refs, react-refresh), zbytek drobné ARIA.
- Realisticky: config fix (minuty) + několik dávek oprav přes paralelní agenty. Není to jeden zátah, ale po config fixu je to zvládnutelné.
