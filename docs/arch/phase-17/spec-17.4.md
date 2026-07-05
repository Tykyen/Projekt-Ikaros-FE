# Spec 17.4 — Doladění mobilní hry na taktické mapě (touch)

**Stav:** návrh (autonomní režim — uživatel předschválil „jeď naplno", kontrola po dodání) · **Fáze:** 17 · **Roadmap:** [§17.4](../../roadmap2.md)
**Závislosti:** 10.2a pan/zoom hook (hotovo), 10.2d token drag (hotovo), 15.2 grid adaptéry (hotovo).
**Repozitáře:** **jen FE.** Žádná nová BE pole, žádná nová operace — čistě klientské ovládání.

---

## 0. Účel jednou větou

Na mobilu jde mapa plnohodnotně ovládat prstem: **posunout ji** (dnes vůbec nejde), přiblížit pinchem se současným posunem, tahat tokeny a otevřít akce tokenu podržením — s dotykovými terči, které trefí i palec.

## 1. Výchozí stav (co touch UMÍ vs. CHYBÍ)

Inventura kódu (`tactical-map/`, PixiJS v8 + `@pixi/react`):

**Funguje na dotyku dnes:** pinch-zoom (kotva = FIXNÍ počáteční midpoint), tažení tokenu 1 prstem (Pointer Events, snap na hex), tap = výběr, tap na „i" badge = detail, double-tap na plochu = ping, PJ nástroje (pravítko/kreslení/efekty/mlha) přes stejné pointer handlery, token panel se <768px přepne na centrovaný overlay.

**Chybí / bolí:**
| # | Mezera | Kde |
|---|---|---|
| A | **Jednoprstý pan mapy neexistuje** — mapu nelze prstem posunout | `useViewportPanZoom.ts:196–212` (touch 1-finger jen zaeviduje a `return`) |
| B | **Pinch neposouvá** — zoom kolem fixního midpointu, dvouprstý posun se ignoruje | `useViewportPanZoom.ts:236–259` |
| C | **Žádný long-press / akce tokenu prstem** — akce jen přes „i" badge (`tokenSize*0.25`, malý terč) | `TokenSprite.tsx:249`; long-press nikde |
| D | **Fixní px prahy** (5px drag/select, 10px tap) neuzpůsobené hrubému prstu | `TokenSprite.tsx:301`, `useTokenDrag.ts:80` |
| E | Panely/terče na 375px — dílčí `@media`, ale `useCoarsePointer` mapa nevyužívá | rozházené CSS; hook v `chat/lib/useCoarsePointer.ts` |

> 💡 Proč A/B chybí schválně: původní autor 1-finger pan vypnul, protože „koliduje s tap-to-select" (`useViewportPanZoom.ts:8`). Jádro 17.4 = tuhle kolizi vyřešit správně, ne obejít.

## 2. Klíčové rozhodnutí — disambiguace gesta (token vs. pan)

Problém: `pointerdown` na tokenu spustí PIXI federated handler (token drag) **i** DOM `pointerdown` na `div.viewport` (bublá z canvasu). Kdyby 1 prst na prázdnu panoval, 1 prst na tokenu by spustil obojí.

**Řešení — token si gesto „zabere", pan se gate-uje na dvou místech (idempotentní vůči pořadí eventů):**
- `useTokenDrag` už při startu synchronně nastaví `dragRef.current` (`useTokenDrag.ts:125`). Vystavíme z něj `isDraggingRef` (živý ref, ne async `dragState`).
- `useViewportPanZoom` dostane `isTokenDragActive: () => boolean`.
- **Pan-start** (touch, 1 prst): přeskoč, když `isTokenDragActive()` → gesto patří tokenu.
- **Pan-move**: přeskoč pan i uprostřed, když `isTokenDragActive()` → i kdyby pan „nastartoval" dřív, než se dragRef stihl nastavit, nikdy se neposune.

> 💡 Proč dvojitý gate: PIXI federated handler (na canvasu) v praxi běží před bublajícím DOM handlerem na `div.viewport`, ale nespoléhám na to — gate na move dělá výsledek deterministickým bez ohledu na pořadí. 📚 *„Gate" = podmínka, co brání akci; tady „neposouvej mapu, dokud táhnu token".*

> 🔀 Alternativa: hit-test na pointerdown, jestli je pod prstem token. Zamítnuto — DOM target je vždy canvas (ne konkrétní token), hit-test by duplikoval PIXI event systém.

## 3. Chování gest po 17.4

| Gesto | Výsledek |
|---|---|
| 1 prst tažení na **prázdnu** | **posun mapy** (nově) |
| 1 prst tažení na **tokenu** | tažení tokenu (beze změny) |
| 1 prst tap na prázdnu | ping-detekce / deselect (beze změny) |
| 1 prst tap na token | výběr (beze změny) |
| 1 prst **podržení** na tokenu (~500 ms) | **otevře akce/detail tokenu** (nově, jen `touch`) |
| 2 prsty | **zoom + posun zároveň** (nově; dnes jen zoom o fixní bod) |
| nástroj aktivní (pravítko/efekt/mlha/kresba) + 1 prst | kreslí nástrojem, neposouvá (jako left-drag na desktopu — gate `suppressLeftPan`) |

## 4. Dotčená místa (FE)

| # | Soubor | Změna |
|---|---|---|
| 1 | `hooks/useTokenDrag.ts` | vystavit `isDraggingRef` (živý ref) |
| 2 | `hooks/useViewportPanZoom.ts` | **1-finger pan** (touch, gate na token-drag + `suppressLeftPan`); **pinch+pan** (midpoint se aktualizuje — anchor v map-space); pan-move gate |
| 3 | `TacticalMapView.tsx` | předat `isTokenDragActive` do `useViewportPanZoom`; wheel bez modifikátoru (viz §6) |
| 4 | `components/tokens/TokenSprite.tsx` | **long-press** (touch, ~500 ms → `onOpenInfo`; zrušit na move>práh/up); coarse-pointer prahy |
| 5 | CSS (`MapZoomControls`, `MapToolDock`, panely) | dotykové terče ≥44×44 přes `@media (pointer: coarse)`; ověřit sbalení na 375px |

Žádná změna typů dat, žádný BE zásah, žádná nová operace.

## 5. Pinch + pan — matematika

Na start pinche ulož anchor v **map-space** (bod pod počátečním midpointem) místo fixního `cx/cy`:
```
mapAnchor = (startMid - rect.origin - startOffset) / startZoom
```
Na každý move (2 prsty): `newZoom = clamp(startZoom * dist/startDist)`, `currentMid` z aktuálních pozic →
```
offset = (currentMid - rect.origin) - mapAnchor * newZoom
```
Fingers se roztáhnou beze změny středu → čistý zoom; posunou se beze změny vzdálenosti → čistý pan; obojí naráz → kombinace. Nahrazuje `pinchStart.cx/cy` fixed-anchor logiku (`:249–257`).

## 6. Desktop bonus (mimo mobil, malý + odděleně označený)

- **Wheel zoom bez Ctrl/Cmd** (`useViewportPanZoom.ts:157`): dnes zoom jen s modifikátorem; mapa je full-bleed a uvnitř není co scrollovat → plné kolečko = zoom je u VTT očekávané. Ctrl/Cmd ponechat funkční. **Riziko nízké**, ale je to změna desktop chování → v reportu zvlášť zvýrazním.

> ⚠️ Kdyby wheel-bez-Ctrl vadil (očekávaný page-scroll), je to jednořádkový revert. Proto oddělené.

## 7. Jak ověřím (bez fyzického telefonu)

- **Logika:** unit test na pinch+pan anchor math a na gate (token-drag aktivní → pan-move no-op) v `useViewportPanZoom` čistých funkcích, kde to jde vytáhnout; jinak ruční rozbor.
- **Emulace touch:** Chrome DevTools touch emulation / Playwright `dispatchEvent` pointer `pointerType:'touch'` — ověří, že 1-finger pan mění offset, 2-finger mění zoom+offset, long-press vystřelí `onOpenInfo`, token-drag stále funguje a pan se u něj negate-uje.
- **Responsivita:** `mobil-desktop` na 375/768/1440 — terče ≥44px, panely sbalené, žádný horizontální scroll.
- **Tvrdý limit:** skutečný „pocit pod palcem" (setrvačnost, přesnost pinche) ověří uživatel ~2 min na reálném telefonu. Headless nemá pravý touchscreen.

## 8. Hranice scope

- **V scope:** 1-finger pan, pinch+pan, long-press akce tokenu, dotykové terče, coarse-pointer prahy, ověření panelů na mobilu.
- **Mimo (17.11 companion mód):** zvláštní mobilní layout mapy, bottom tab bar, „mobil = velký deník", radiální menu. 17.4 drží **paritu** s desktopem, jen adaptuje ovládání.
- **Mimo:** setrvačný (inertia) pan, haptika, rotace mapy, per-token gesture přizpůsobení.

## 9. Otevřené otázky (rozhodnuto autonomně)

- Zjednodušený layout vs. parita → **parita** (zjednodušení = 17.11).
- Long-press cíl → **otevřít detail/akce tokenu** (větší terč než „i" badge), jen `pointerType:'touch'` (na myši nepřekvapí).
- Long-press práh → **500 ms**, zrušení při posunu >10 px.
