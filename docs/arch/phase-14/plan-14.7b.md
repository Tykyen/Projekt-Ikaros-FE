# Plán 14.7b — Tisk zbývajících entit (pilíř A)

> Implementační plán k [spec-14.7.md](spec-14.7.md), sub-krok **14.7b**. Staví na frameworku z [plan-14.7a.md](plan-14.7a.md) (`printModeAtom`, `usePrint`, `PrintButton`, `print.css`, `data-print-scope`).
> Status: ✅ implementováno (2026-06-19) — všechny 4 vlny, build zelený; čeká vizuální tisk-náhled uživatele (zvlášť canvas: pavučina snapshot, hvězdná WebGL→DOM seznam)
> Rozsah: tisk/PDF entit — záložky postavy/NPC mimo kalendář (3,6), kalendář s rozsahem (4), bestiář (7,8), mapy atlas (9), hvězdná (10), pavučina (12), storyboard (13), obchod (14).

## Klíčová rozhodnutí (k odsouhlasení)

1. **„Určité bestie / určité mapy" (body 8, 9) = tiskneš, co je vyfiltrované — BEZ nového multi-selectu.**
   💡 Bestiář ani atlas dnes nemají výběr položek. Místo stavby checkbox-režimu využijeme princip „tiskneš co vidíš": zúžíš přes existující **scope/search/složku** a vytiskneš zobrazené. „Celý" = bez filtru, „určité" = vyfiltruj. Konzistentní s pavučinou/obchodem. 🔀 Multi-select lze přidat později, pokud bude chtěný.

2. **Canvas entity (pavučina 2D, hvězdná 3D) — snapshot přes `toDataURL()` vložený do tiskového kořene.**
   Rozšíříme `triggerPrint`: před tiskem najde `canvas` ve scope, vloží vedle něj `<img>` snapshot, canvas pro tisk skryje. Univerzální (DOM entity bez canvasu = no-op).
   ⚠️ **Riziko WebGL (hvězdná):** Three.js (`react-force-graph-3d`) maže drawing buffer → `toDataURL()` může vrátit prázdno bez `preserveDrawingBuffer:true`. Ověřit; fallback = vynutit re-render + okamžitý snapshot, nebo `preserveDrawingBuffer` prop. Pavučina (2D) je bezpečná.

3. **Kalendář (bod 4) = výběr rozsahu od–do měsíc + lineární render měsíců v print módu.**
   Dnes 1 měsíc (kurzor). Pro tisk: malý popover „Od měsíce / Do měsíce" → v print módu se vyrenderují všechny měsíce rozsahu pod sebe (`break-after: page`). Default = aktuální měsíc + 2.

## Rozšíření frameworku (společný základ)

**`triggerPrint` — canvas snapshot (printMode.ts):**
```
triggerPrint(target):
  1. target.querySelectorAll('canvas') → pro každý:
       img = <img src={canvas.toDataURL('image/png')} class="print-canvas-snapshot">
       vlož za canvas, canvas označ [data-print-hide-canvas]
  2. (stávající) data-print-root + html[data-printing] + printMode=true
  3. 2× rAF → window.print()
  4. cleanup: odeber vložené img + atributy
```
- `print.css`: `@media print { [data-print-hide-canvas]{display:none} .print-canvas-snapshot{display:block; max-width:100%} }`.
- Snapshot je synchronní DOM manipulace (robustní timing, ne React state).

**`PrintButton`** — zobecnit: dnes ho používá deník; přidáme ho do toolbarů entit (variant ghost je OK mimo PageHeader).

## Vlny (kompletní sub-kroky)

### 14.7b-1 — DOM entity (bestiář, obchod, mapy atlas, storyboard)
- **Bestiář** `BestiarPage.tsx`: `data-print-scope` na list+nadpis, `PrintButton` do headeru. Tiskne aktuální scope-tab + search výsledek (= „celý" / „určité"). `@media print`: skrýt akce karet (Upravit/Klonovat/Smazat), tab lištu, search.
- **Obchod** `ShopView.tsx`: `data-print-scope` na grid+titul, `PrintButton` do topbaru. Ceník (položky+skupiny+ceny). Skrýt filtry, „Koupit", edit ikony, wallet.
- **Mapy atlas** `WorldMapsPage.tsx`: `data-print-scope` na `<article>`, `PrintButton` do headActions. Tiskne aktuální složku/search (= „všechny" v kořeni / „určité" ve složce). Obrázky `<img>` přímo.
- **Storyboard** `ScenarioEditor.tsx`: `PrintButton` do `.editorHeadRow`. Tisk **vybraného** scénáře (`data-print-scope` na editor). „Vše" = 🔀 odložit/iterovat stromem (rozhodnout: V1 jen vybraný scénář + poznámka). Skrýt strom, gmNotes jen PJ.

### 14.7b-2 — Záložky postavy/NPC mimo kalendář (body 3, 6)
- `PostavaLayout.tsx`: v `printMode` místo `Tabs` (jen aktivní) vyrenderovat lineárně: Profil + Deník + Finance + Výbava + Poznámky + odemčené AKJ taby. **Kalendář vynechán** (opt-in — checkbox „přidat kalendář" v print toolbaru, default off).
- Subdoc taby (`FinanceTab`/`InventoryTab`/`NotesTab`) berou `mode='view'` → v print módu render-only.
- `data-print-scope` na layout, `PrintButton` + checkbox kalendáře do `print-hide` lišty.
- Respektovat `canSeePrivate` (subdoc jen PJ/PomocnyPJ/vlastník) — print nezíská víc než zobrazení.

### 14.7b-3 — Kalendář s rozsahem (bod 4)
- `CalendarPage.tsx` (svět/PJ agregát) + `CalendarTab.tsx` (postava/NPC/lokace): print toolbar s výběrem rozsahu od–do měsíc (reuse jump popover logiky).
- V print módu render všech měsíců rozsahu pod sebe (loop `generateMonthGrid`), `break-after: page` mezi měsíci.
- Viditelnost: groupOnly události a skryté postavy filtrovat jako v zobrazení (žádný nový fetch).

### 14.7b-4 — Canvas entity (pavučina, hvězdná)
- **Pavučina** `PavucinaGraph.tsx`: `data-print-scope` na graf wrapper, `PrintButton` do `.graphControls`. Snapshot 2D canvasu (bezpečné). Doplnit DOM legendu/seznam subjektů+vztahů (tisknutelný i bez canvasu jako záloha). Respektovat aktivní filtry + vrstvu (tiskneš co vidíš).
- **Hvězdná** `UniverseMapView.tsx`: `data-print-scope` na viewport, `PrintButton` do `UniversePanel headerExtra`. Snapshot 3D canvasu — **nejdřív ověřit `toDataURL` na WebGL**; pokud prázdný → `preserveDrawingBuffer` nebo re-render+snapshot. Doplnit DOM seznam uzlů jako fallback.

## Pořadí provádění
b-1 (nejjasnější, hned hodnota) → b-2 → b-3 → b-4 (nejrizikovější, canvas/WebGL nakonec). Každá vlna samostatně ověřitelná (build+test+tisk-náhled).

## Soubory (orientačně)
- Framework: `print/printMode.ts` (+canvas snapshot), `print/print.css` (+snapshot pravidla).
- b-1: `bestiar/BestiarPage.tsx`(+css), `shop/components/ShopView.tsx`(+css), `maps/WorldMapsPage.tsx`(+css), `campaign/components/ScenarioEditor.tsx`(+css).
- b-2: `PageViewer/layouts/PostavaLayout.tsx`.
- b-3: `pages/CalendarPage.tsx`, `CharacterDetailPage/components/CalendarTab.tsx` (+ sdílený month-grid render).
- b-4: `campaign/components/PavucinaGraph.tsx`, `universe/UniverseMapView.tsx`.

## Rizika
- ⚠️ **WebGL snapshot** (hvězdná) — viz rozhodnutí 2. Nejvyšší riziko; proto poslední.
- ⚠️ **Cross-origin obrázky** (Cloudinary) v canvasu → `toDataURL` může vyhodit „tainted canvas". Ověřit CORS na Cloudinary; jinak snapshot selže u map s externími obrázky.
- ⚠️ **PostavaLayout print render** — subdoc taby dělají vlastní fetch (hooky); render všech naráz = víc paralelních GETů (akceptovatelné, jen při tisku).
- ⚠️ **Kalendář rozsah** — velký rozsah (roky) = hodně měsíců = dlouhý tisk; omezit rozumný strop (např. 24 měsíců) s hláškou.
- ⚠️ Storyboard „vše" — V1 jen vybraný scénář (rozhodnout, jestli stačí, nebo iterovat strom hned).

## Ověření (po každé vlně)
- `npm run build` + cílené vitest; `lint:colors` bez nových hardcoded.
- Tisk-náhled (uživatel): entita rozbalená, bez chrome, černá na bílé; canvas → snapshot viditelný.
- Po dokončení 14.7b: `funkce` + `napoveda` aktualizace, roadmap.
