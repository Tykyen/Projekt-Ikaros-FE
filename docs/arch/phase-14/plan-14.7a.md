# Plán 14.7a — Tiskový framework + stránka + deník PC/NPC

> Implementační plán k [spec-14.7.md](spec-14.7.md), sub-krok **14.7a** (pilíř A, FE only).
> Status: ✅ implementováno (2026-06-19) — testy 6/6 + build zelené; čeká vizuální tisk-náhled uživatele
> Rozsah: framework `window.print()` + tisk **stránky** (bod 11) a **deníku PC/NPC** (body 2, 5).
> ⚠️ **Pavučina (12) přesunuta do 14.7b** — viz „Změna scope" níže.

## Změna scope vůči specu

Spec 14.7 řadil pavučinu (12) do 14.7a a ztotožnil ji s `isWoodWide`. Průzkum kódu:
- `isWoodWide` = jen badge na `Page` (`PageHeader.tsx:66`), ne síť.
- **„Pavučina"** = campaign force-graph (`PavucinaGraph`, `CampaignSubject`/`CampaignRelationship`) — render na **canvasu**.

→ Tisk canvas-grafu = snapshot (image/SVG), jiná technika než text-tisk + patří ke campaign (storyboard je taky 14.7b). **14.7a = jen text-tisk** (stránka, deník). Spec se po schválení opraví (pavučina → 14.7b). *Čeká na potvrzení uživatele, co bod 12 znamená.*

## Klíčové architektonické rozhodnutí

**Print přes „print mód" (toggle) + `window.print()` + globální `print.css` (isolation pattern).**

💡 `@media print` se aplikuje automaticky při tisku — netřeba route ani layout bez chrome. Framework řeší 3 věci, které samo CSS neumí:
1. **Izolace obsahu** — `@media print` schová celý `body` a zobrazí jen `[data-print-root]` (robustní; nahrazuje křehké `[class*='PagePalette']` matchování v `PageViewer.module.css:33`).
2. **Rozbalení** — collapsed sekce (`isCollapsed`) a **všechny odemčené AKJ taby** musí být vyrenderované, ne schované za tab-lištou. To vyžaduje JS (print mód), ne jen CSS.
3. **Theme-neutralita** — černá-na-bílé přes `rgb(var(--black-rgb)/1)` na bílém (tokeny `--black-rgb`/`--white-rgb` jsou theme-independent, `tokens.css:109`).

🔀 *Zamítnuto:* dedikovaná `/tisk/:slug` route + `PrintLayout` — duplikovalo by render a obešlo existující data-hooky. Print mód reusuje stejný strom komponent.

📚 *print mód* = boolean v React contextu; komponenty ho čtou a v něm rozbalí vše + skryjí edit-akce. Po vytištění se vrátí (`afterprint` event).

## Mechanismus print módu

```
usePrint() → triggerPrint():
  1. setPrintMode(true)               // context
  2. requestAnimationFrame(×2)        // počkat na re-render rozbaleného obsahu
  3. window.print()
  4. window.addEventListener('afterprint', () => setPrintMode(false), { once:true })
```

- `PrintModeContext` (nebo jotai atom `printModeAtom`) — globální boolean.
- `usePrintMode()` — čte boolean; komponenty podle něj rozbalí.
- Fallback: pokud `afterprint` nepřijde (starší prohlížeč) → timeout reset 1s.

## Soubory

**Nové — `src/features/world/export/print/`:**
- `printMode.ts` — jotai `printModeAtom` + `usePrintMode()` (getter) + `usePrint()` (trigger).
- `PrintButton.tsx` — tlačítko „🖨 Tisk / PDF" (reuse `shared/ui/Button`), volá `usePrint().triggerPrint()`. Props: `targetLabel?` (a11y).
- `PrintRoot.tsx` — wrapper, který na svůj kořen dá `data-print-root` když je print mód aktivní (jinak nic).
- `print.css` — **globální** `@media print`: isolation (`body *` hidden → `[data-print-root]` visible), černá-na-bílé, `print-color-adjust: exact`, `box-shadow:none`, page-break pravidla, bare links. Import v app root (vedle `reset.css`).

**Úpravy — stránka (bod 11):**
- `PageViewer.tsx` — obalit obsah `<PrintRoot>`; v print módu předat layoutům „rozbal vše".
- `PageHeader.tsx:101` — přidat `<PrintButton>` do `.actions` (vedle ★/🔗/✏️).
- `PageSections.tsx:32` — v print módu `collapsed = usePrintMode() ? false : section.isCollapsed`.
- `WithAkjTabs.tsx` + `PostavaLayout`/`LokaceLayout` (vlastní AKJ lišta) — v print módu místo tab-lišty vyrenderovat **obsah Obsah + všechny `!tab.locked` taby** lineárně pod sebe (locked vynechat — viewer je nevidí).
- `PageViewer.module.css:26–71` — **odstranit** starý křehký `@media print` blok (nahrazen globálním `print.css`).

**Úpravy — deník PC/NPC (body 2, 5):**
- `DiaryTab.tsx` — `<PrintButton>` v hlavičce záložky (vedle edit akcí); obsah deníku obalit `<PrintRoot>`. V print módu rozbalit zápisky (`DiarySectionView`) + vyrenderovat všechny custom bloky.
- `PostavaLayout.tsx` — zajistit, že tlačítko tisku deníku je dostupné jen na záložce Deník a tiskne jen její obsah (ostatní taby render podmíněně → nejsou v DOM → automaticky vynechány).

## Past & rizika

- ⚠️ **AKJ taby v tisku** — viewer tiskne jen `!locked` taby; `locked` (zamčené) vynechat úplně (jinak prázdné rámečky). Bere se `t.locked` z BE (už filtrované).
- ⚠️ **Izolace** — `[data-print-root]` musí být jen jeden aktivní zároveň (deník vs stránka nikdy současně, OK). Při více kořenech by se tisklo vše.
- ⚠️ **Theme isolation** — `print.css` je záměrně globální (tisk není skin). Není to porušení `feedback_theme_isolation` (to se týká skin tokenů), ale zmínit v PR.
- ⚠️ **Obrázky** — `bigImage`/avatary mohou roztáhnout stránku; `print.css` dá `img { max-width:100%; break-inside:avoid }`.
- ⚠️ **Refactor existujícího print CSS** — odstranění bloku v `PageViewer.module.css` nesmí zhoršit dnešní chování (Ctrl+P stránky funguje už teď). Po změně ověřit tisk-náhled.

## Ověření (před push)

- `npm run build` (tsc -b + vite) + `npm run test:run` zelené (FE bez precommit hooku → ručně, `project_fe_test_precommit`).
- **Vitest** (explicit importy, `fireEvent` ne user-event):
  - `PrintButton` klik → `window.print` zavolán (mock).
  - `usePrint` → po triggeru `printModeAtom=true`, po `afterprint` → `false`.
  - `PageSections` v print módu → collapsed sekce vyrenderovaná (assert obsah viditelný).
  - `WithAkjTabs` v print módu → odemčené taby v DOM, locked ne.
- **Tisk-náhled ručně:** stránka (s sekcemi + AKJ) a deník — Ctrl+P → vše rozbalené, černá-na-bílé, bez chrome.
- **`mobil-desktop` skill** — tlačítko „Tisk / PDF" na mobilu i desktopu (na mobilu Chrome „Uložit jako PDF").
- Po dokončení: `funkce` + `napoveda` skill (nová schopnost tisku).

## Mimo scope 14.7a (→ 14.7b/c)

Záložky mimo kalendář (3,6), kalendář s rozsahem (4), bestiář (7,8), mapy (9), hvězdná (10), **pavučina (12)**, storyboard (13), obchod (14) → 14.7b. BE záloha+import → 14.7c.
