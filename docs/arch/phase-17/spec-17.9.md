# Spec 17.9 — Streamer overlay (OBS režim)

**Stav:** návrh · **Fáze:** 17 · **Roadmap:** [§17.9](../../roadmap2.md)
**Závislosti:** žádné tvrdé; staví na taktické mapě (10.2*) a jejím fullscreenu (15.x). Vzor stavu = `printMode` (14.7a).
**Repozitáře:** **jen FE.** BE se nedotýká (čistě klientský view-stav, žádná data, žádná oprávnění).

---

## 0. Účel jednou větou

Přepínatelný **stream režim** taktické mapy: skryje veškeré UI chrome (panely/lišty/badge) a nechá jen čistou mapu s **volitelným pozadím** (chroma zelená / modrá / průhledné) — připravené pro OBS.

## 1. Výchozí stav (audit kódu)

Taktická mapa = jeden `viewportRef` div s PIXI `<Application>` uvnitř `.canvasWrapper` a kolem něj **rozptýlené DOM chrome sloty** (absolutně pozicované), vše v [TacticalMapView.tsx](../../../src/features/world/tactical-map/TacticalMapView.tsx):

| Chrome slot | Řádek | Obsah |
|---|---|---|
| `InitiativeBar` | ~2232 | lišta iniciativy (horní střed) |
| `MapDockStack` | 2265 | Uklidit + kostky + docky Efekty/Mlha/Zobrazení + ambient |
| `connectionBadgeSlot` | 2353 | stav WS spojení (LH roh) |
| `weatherSlot` → `slotLeft`/`slotRight` | 2358 | počasí, deník/poznámky, sound player, voice, story pill |
| `bottomLeftStack` | 2441 | log hodů + PJ panel |
| `MapDock` | 2477 | spodní lišta minimalizovaných čipů |
| `KebabMenu` | 2493 | kontextové menu pravého kliku |

Co **NENÍ** chrome (zůstává): PIXI canvas (mapa, tokeny, HP bary, mlha, grid) a `MapWeatherAtmosphere` (2347) — vizuální efekt počasí je součást scény, streamer ho chce.

**Dva plány pozadí** (obojí musí řešit chroma režim):
- **PIXI canvas:** `<Application background={theme.canvasBg} ...>` na [TacticalMapView.tsx:1794-1800](../../../src/features/world/tactical-map/TacticalMapView.tsx#L1794-L1800). `@pixi/react` v8 předává `background`/`backgroundAlpha` do `Application.init()`.
- **DOM pod canvasem:** `.viewport { background: var(--map-canvas-bg) }` — [TacticalMapView.module.css:17](../../../src/features/world/tactical-map/TacticalMapView.module.css#L17). Prosvítá i skrz průhledný canvas → musí se přepsat taky.

**Fullscreen** už existuje: `requestFullscreen` na `viewportRef` (přes `MapZoomControls` `fullscreenTargetRef`) + `fullscreenchange` listener na [TacticalMapView.tsx:449](../../../src/features/world/tactical-map/TacticalMapView.tsx#L449). Stream režim ho jen využije.

**`printMode` vzor** ([printMode.ts](../../../src/features/world/export/print/printMode.ts)): globální jotai atom + hook + komponenty reagují. Stream mode = jeho zrcadlo (skrýt viditelné místo rozbalit skryté).

## 2. Rozdíl chroma vs. průhlednost (klíčové rozhodnutí)

Roadmapa píše „průhledné pozadí pro chroma key" — to míchá dvě techniky. Podporujeme **obojí** volbou pozadí:

- **Chroma barva (default, zelená/modrá):** pro OBS **Window/Display Capture** — prohlížeč nikdy neposílá alfa, okno je vždy neprůhledné, proto plná barva + Chroma Key filtr v OBS. Pokrývá 99 % streamerů.
- **Průhledné (`backgroundAlpha=0` + DOM `transparent`):** funguje jen v OBS **Browser Source** (CEF umí alfa). Nabídneme jako volbu pro pokročilé; bez čisté read-only URL nemá smysl ji vynucovat.

> 📚 **Chroma key** = OBS filtr, který „vystřihne" jednu barvu (typicky zelenou) a udělá ji průhlednou. Proto stačí mapě dát sytou zelenou plochu tam, kde chceme průhlednost.

## 3. Rozsah (co uděláme teď)

1. **Stavová vrstva** `tactical-map/stream/streamMode.ts` (NOVÉ):
   - `streamActiveAtom` (bool, runtime — neukládá se; spouští se ad hoc).
   - `streamBgAtom` (`'green' | 'blue' | 'transparent'`, **persistováno** `atomWithStorage` — streamer nastaví jednou).
   - `streamKeepAtom` (`{ initiative: boolean; diceLog: boolean }`, persistováno — odpověď na otevřenou otázku „skrýt vše, nebo nechat iniciativu/deník").
   - `useStreamMode()` hook (čtení + settery).
   - Chroma konstanty: zelená `0x00b140`, modrá `0x0047bb` (standardní OBS chroma odstíny).

2. **Skrytí chrome** — každý chrome slot z §1 dostane `data-map-chrome` marker (explicitní, nezávislý na CSS jménech). CSS: `.viewport[data-stream-mode] [data-map-chrome] { display: none }`. Výjimky řízené togglem: `InitiativeBar` a `DiceLogPanel` se skryjí jen když `streamKeep.*` je false (podmínka v JSX, ne CSS).

3. **Pozadí** — ve stream režimu:
   - PIXI: `background={chromaHex}` + `backgroundAlpha={bg === 'transparent' ? 0 : 1}`.
   - DOM: `.viewport[data-stream-mode][data-stream-bg="green|blue"]` → chroma barva; `[data-stream-bg="transparent"]` → `background: transparent`.

4. **Vstup/výstup:**
   - **Spustit:** panel „🎥 Stream režim" uvnitř existujícího docku „🖥️ Zobrazení" ([TacticalMapView.tsx:2322](../../../src/features/world/tactical-map/TacticalMapView.tsx#L2322)) přes novou `StreamModeControls` (NOVÉ) — tlačítko Spustit + segmenty pozadí + 2 přepínače „nechat viditelné".
   - Spuštění zapne stream mode **a** vstoupí do fullscreenu (reuse `viewportRef.requestFullscreen`).
   - **Ukončit:** malé plovoucí tlačítko „✕ Ukončit stream" v rohu, `opacity: 0.15` klidově → `1` na hover (aby nebylo v záběru). Zůstává viditelné i ve stream mode (výjimka z §3.2). Navíc **Escape** ukončí (a `fullscreenchange` na exit fullscreenu taky vypne stream mode — konzistence).

5. **Dostupnost:** bez role gate — dostupné PJ i hráči (skrývá jen vlastní chrome, nemění data/oprávnění). Streamovat může i hráč svůj pohled.

## 4. Dotčená místa (FE)

| # | Soubor | Změna |
|---|---|---|
| 1 | `tactical-map/stream/streamMode.ts` (NOVÉ) | atomy + `useStreamMode` + chroma konstanty |
| 2 | `tactical-map/components/StreamModeControls.tsx` (NOVÉ) | panel do docku Zobrazení (spustit + pozadí + toggly) |
| 3 | `TacticalMapView.tsx` | `data-stream-mode`/`data-stream-bg` na viewport; přepnout `<Application>` background/alpha; `data-map-chrome` na 7 slotů; podmínit InitiativeBar/DiceLog dle `streamKeep`; exit tlačítko; Escape+fullscreenchange → vypnout |
| 4 | `TacticalMapView.module.css` | `[data-stream-mode] [data-map-chrome]{display:none}`; `data-stream-bg` pozadí; styl exit tlačítka (roh, hover opacity) |

## 5. Jak ověřím

- **Skrytí:** zapnout stream mode → zmizí všechny panely/lišty/badge; canvas + tokeny + počasí zůstanou. Toggly „nechat iniciativu/deník" je vrátí.
- **Pozadí:** zelená/modrá → viewport i canvas mají sytou plochu bez UI; průhledné → prosvítá pozadí stránky (ověření pro Browser Source). Vizuálně přes screenshot (Playwright/DevTools), ne naslepo.
- **Výstup:** Escape i rohové tlačítko ukončí; exit z fullscreenu (F11/Esc) taky vypne stream mode; žádný „uvíznutý" stav bez UI.
- **Regrese:** `npm run build` (tsc -b) zelené; `mobil-desktop` na docku Zobrazení (přibyl panel) + na exit tlačítku (dotykový terč ≥44px).
- **Perzistence:** volba pozadí + toggly přežijí reload (localStorage).

## 6. Hranice scope + dluh (další inkrementy 🔁)

- **V scope:** stream toggle, skrytí chrome, 3 volby pozadí (chroma green/blue + transparent), fullscreen vstup, Escape/roh exit, 2 toggly (iniciativa/deník), persistence preferencí.
- **Mimo (dluh přes `dluh`, pokud vyžádáno):**
  - **Čistá read-only URL pro OBS Browser Source** (skutečná alfa bez appky okolo) — vyžaduje samostatný route + token; teď jen `transparent` v rámci appky.
  - Skrývání/toggle **gridu** ve stream mode (grid je v canvasu; teď zůstává jak je).
  - Konfigurovatelný **overlay** (jen logo, jen iniciativa jako samostatná scéna) — teď binární skrýt/nechat.
  - Uložení více **presetů** stream layoutu.
- **Otevřené otázky vyřešené touto spec:** „jen mapa, nebo i overlay deníku/iniciativy?" → volitelné toggly. „Konfigurovatelné, co se skryje?" → ano, iniciativa + deník; zbytek se skryje vždy.
