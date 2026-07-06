# Spec 17.10 — Panelový workspace + kontextové palety (taktická mapa)

**Stav:** směr schválen + **plný interaktivní náhled schválen jako závazná předloha** (2026-07-06) · **Priorita:** H4-07 (dopad střední) · **Náklad:** velký (FE; BE až zátah B) · **Rozsah tohoto spec: zátah A**

## Cíl
Sjednotit roztříštěné overlay panely taktické mapy pod **jednoho správce** tak, aby:
1. každý panel šel **zmenšit do spodní lišty a zase nahodit** (a „✧ Uklidit mapu" = schovat vše naráz),
2. panely se **nepřetlačovaly** (rezervace místa + jednotné z-index pořadí),
3. karta postavy/nestvůry šla otevřít jako **plovoucí okno přes mapu** (ne přes celou pravou třetinu),
4. **pravý klik** na figurku/mapu dal kontextové menu akcí u kurzoru.

Vše **beze změny grafiky** — motiv/skin panelů zůstává, sahá se jen na chování / pozicování / z-index.

## Rozsah — zátah A vs. trojka B
- **Zátah A (tento spec):** správce panelů + minimalizace do lišty + „Uklidit vše" + statblok jako plovoucí okno (staví na existujícím dock/drag/overlay shellu `TokenInfoPanel`) + pravý klik. Persistence rozložení = **localStorage** (per zařízení). Řeší i 2 kolizní bugy (kostky, počasí).
- **Trojka B (pozdější):** server-side per-uživatel rozložení (přenos mezi zařízeními), plná plovoucí okna pro víc typů obsahu, pokročilý docking (split). **Dosedne na shell z A bez přepisu.**
- **Deník jako plovoucí okno — VEN** (rozhodnuto): už řešeno klikem na postavu → panel; neduplikovat.

## Ověřené nálezy (kód, adversariálně ověřeno) — proč to teď
Kořen problémů je **architektonický**: overlaye žijí ve 3 nezávislých rohových systémech (`.weatherSlot` top-right z30, `.stack` right z100, `.bottomLeftStack` bottom-left z90) + samostatné panely (`TokenInfoPanel` z400, notebook z60, modaly z1000), **bez sdíleného správce**. Z-index jsou hardcoded literály; jediná koordinace je CSS proměnná `--map-dock-width` (píše `TokenInfoPanel`, čte `MapDockStack`).

| # | Nález | Verdikt | Kořen v kódu |
|---|---|---|---|
| 1 | **Kostky flyout se ořezává** (desktop) | PARTIAL | `DicePickerPopover` (320px) je `absolute` uvnitř `.stack`, který má `overflow-y:auto` → CSS povýší `overflow-x` na auto → `.stack` klipuje. Popover (`align="right"`, 320px) přeteče **levou** obsahovou hranu shrink-to-fit `.stack` (~228px) a je oříznut. Bez portálu, bez viewport-clampu. `DicePickerPopover.module.css:3-24`, `MapToolDock.module.css:7-34`. |
| 2 | **Počasí překrývá pravou lištu** | CONFIRMED | `.weatherSlot` (z30, right:12, nereaguje na `--map-dock-width`) a `.stack` (z100, right:calc(12+dock)) na stejném pravém okraji bez rezervace místa; lišta (100) překreslí počasí (30). `TacticalMapView.module.css:44-55`, `MapToolDock.module.css:7-30`. |
| 3 | **Portréty postav deformované** | CONFIRMED | `resolveTokenImageCrop` (`TacticalMapView.tsx:871`) vrací `undefined` pro `characterData.imageUrl` → no-crop větev `getSpriteTransform` (`TokenSprite.tsx:73-75`) roztáhne na čtverec (scale.x≠scale.y). Bestie mají cover+focal. `characterData` (`types.ts:162-171`) nemá focal/crop pole. **→ samostatný bug, viz níže.** |
| 4 | **Žádný správce panelů** | CONFIRMED | 0 shod na `PanelContext/WorkspaceContext/usePanelManager`; z-index literály roztroušené; `usePanelMode/usePanelLayout` jen pro `TokenInfoPanel`. |

## Architektura — správce panelů (jádro A)
Rozšířit vzor, který už funguje (`--map-dock-width` → pravá lišta se odsune), na obecný systém:

1. **Workspace registr** — `useMapWorkspace` (jotai atom, konzistentní s `uiStore`/`themeAtom`; **ne** nový Context). Drží pro každý panel: `id`, `state: 'open'|'collapsed'|'minimized'|'floating'`, pozice/velikost (u floating), a **pořadí fokusu** (naposledy aktivní = navrch). Persist `atomWithStorage` (jeden klíč `ikr-map-workspace-v1`, nahradí roztroušené `ikr-map-*` postupně).
2. **Sdílený `<MapPanel>` shell** — obal s hlavičkou (titul + akce *složit / zavřít / odtrhnout*), který čte/píše registr. Existující obsah panelů (`EffectsPalette`, `FogPalette`, `MapWeatherPanel`, `DiceLogPanel`, `MapPjPanel`, `TokenInfoPanel`, iniciativa) se **vkládá dovnitř** — obaluje se, nepřepisuje.
3. **Z-index škála** — nahradit literály tokeny (TS konstanty + CSS var): `base < panel < flyout < floating-active < overlay < modal`. Fokusnutý panel dostane `floating-active`.
4. **Rezervace okrajů** — sdílené proměnné obsazených okrajů (`--map-inset-right/-top/-bottom-left`, zobecnění `--map-dock-width`). Panely čtou → nepřekrývají se → **strukturálně řeší nález #2**.
5. **Spodní dock lišta `<MapDock>`** — čte registr, kreslí dlaždice minimalizovaných; klik = nahodí. **Objeví se, až je něco minimalizované** (rozhodnutí: nezabírat plochu prázdná). „✧ Uklidit vše" = minimalizovat všechny ovládací panely (toggle).
6. **Flyout positioning util** — sdílený `useAnchoredPosition` (existuje v `LinkPicker`) + **portál** mimo klipující kontejnery → **řeší nález #1** (kostky) i budoucí flyouty; viewport-clamp.

## Fáze zátahu A (každá samostatně funkční, nic se nerozbije naráz)
- **A1 — základ:** z-index škála + `<MapPanel>` shell + `useMapWorkspace` registr + rezervace okrajů. *(Vedlejší efekt: strukturálně mizí kolize počasí — nález #2.)*
- **A2 — minimalizace:** `<MapDock>` spodní lišta + složit/nahodit per panel + „Uklidit vše".
- **A3 — flyout fix:** portál + clamp pro `DicePickerPopover` (kostky) a ostatní flyouty. *(Nález #1.)*
- **A4 — statblok jako okno:** napojit `TokenInfoPanel` na nový shell + z-order; minimalizovatelný. **BEZ volného přetahování myší** (rozhodnutí 2026-07-06) — karta má jen 2 stavy: **plovoucí na pevné pozici** (u tokenu / vystředěná) ↔ **ukotvená v boku** (📌 dock), přepíná se 📌↔🪟. Drag za hlavičku z `usePanelLayout` se NEpoužije (ani nový nezavádět). **Dock mód** musí do rezervace pravého okraje započítat i **šířku scrollbaru** (jinak posuvník leze pod pravítko). **Kartu postavy otevírá i klik na portrét v horní iniciativní liště** (nejen token na mapě).
- **A5 — pravý klik:** `onContextMenu` na token/mapu → sdílené menu u kurzoru (varianta `KebabMenu` pozicovaná z `clientX/clientY`).

## Závazná UX rozhodnutí (plný náhled 2026-07-06)
Zdroj pravdy pro chování/layout: `c:\tmp\17.10-takticka-mapa-plna.html` (věrný realitě = motiv „ikaros"). Platí pro implementaci A1–A5:
1. **Žádný volný drag panelů.** Panely se myší nepřetahují. Karta: jen plovoucí (pevná pozice) ↔ ukotvená v boku (📌). Ostatní panely mají pevné rohové sloty.
2. **Vše primárně sbalené.** Při startu jsou ovládací panely `defaultCollapsed` (vidět jen hlavičky): nástroje (Efekty & kreslení / Mlha / Zobrazení / Ambient), Hody, Orchestrace, accordion Aktivní scény i palety (PC/NPC/Bestiář). Karta / Počasí / Deník jsou zavřené (otevře je akce/klik). Odpovídá dnešnímu `defaultCollapsed` v kódu.
3. **„Uklidit mapu" = zavřít úplně vše** (toggle Uklidit ↔ Vrátit panely). Do spodní lišty `<MapDock>` padají minimalizované panely; **nástroje jednotlivě** (4 čipy: Efekty & kreslení, Mlha, Zobrazení, Ambient), **NE** jeden souhrnný čip „Nástroje". Když nezůstane žádný otevřený nástroj, zmizí i hlavička lišty nástrojů.
4. **Kostky = výjimka, zůstávají vždy dostupné.** Ikona 🎲 nemizí s lištou nástrojů ani po „Uklidit"; drží se vpravo dole a neminimalizuje se.
5. **Pravá lišta nástrojů zaražená k DOLNÍ hraně** (`justify-content:flex-end` / `first-child margin-top:auto`), roste nahoru.
6. **Paleta = věrná realitě, beze změny grafiky.** Chrome i herní panely (Hody, Orchestrace, karta) jsou **fialové synthwave** (`--map-ui-*`, motiv „ikaros"). **Pergamen (hnědá + zlatá) jen deník a banner „Hra zastavena"** — nerozlévat na ostatní panely.
7. **Kontextové „?" nápovědy uvnitř panelů** (Orchestrace, Efekty & kreslení; dnes v kódu **chybí** → přidat), **NE** globální nápověda. Realizovat jako volitelná akce `help` ve `<MapPanel>` shellu (vedle složit/zavřít); otevře kontextový popis funkcí panelu.

## Token deformace — samostatný bug (nález #3, mimo 17.10)
Netýká se panelů; eviduje se do `docs/dluhy.md`. Oprava: PC/NPC tokeny dostanou stejný **cover-fit + volitelné ohnisko** jako bestie — rozšířit `characterData` o `focalX/focalY/zoom/fit` (nebo aspoň vynutit cover-fit bez deformace v no-crop větvi). Malá cílená změna; lze udělat samostatně a dřív než A.
Sekundárně (kosmetika, neblokuje): pointy-top vepsaná kružnice nechává svislou mezeru; stagger 2+ tokenů fixních 12 px (nereaguje na zoom); dokumentace tvrdí flat-top, matematika je pointy-top.

## Zachování motivu
`<MapPanel>` shell dědí `--map-ui-*` / `--theme-*`. **Oprava dřívějšího tvrzení (2026-07-06):** výchozí motiv světa je **„ikaros" (fialové synthwave)**, ne „matrix" (to je herní *systém*, ne motiv). Chrome i herní panely jsou defaultně **fialové**; hnědý pergamen je jen deník + lock banner. Žádné nové barvy; jen struktura obalu + chování. (Detaily viz „Závazná UX rozhodnutí".)

## Návrh (frontend-design)
- **Plný interaktivní náhled (ZÁVAZNÁ předloha, 2026-07-06):** `c:\tmp\17.10-takticka-mapa-plna.html` — kompletní replika UI (všechny panely s reálným obsahem + všechny pohyby), věrná realitě (motiv „ikaros" synthwave), s přepínačem palety synth↔pergamen a demo přepínači overlayů. **Zdroj pravdy pro chování/layout.**
- Starší náhled workspace chování: `c:\tmp\17.10-workspace-navrh.html` (překonaný hnědou paletou — pro barvy nepoužívat).

## Dokumentace po implementaci
`funkce` (chování panelů mapy), `napoveda` (PJ: jak uklidit/nahodit panely, pravý klik), `mobil-desktop` (dock lišta + flyouty na 375px), roadmap 17.10 → hotovo, `chybovy-denik` (kolize + token bug), glossary (`workspace`, `dock-lišta`).

## Nezahrnuto v1 (→ B nebo dluh)
Server-side per-uživatel rozložení, plovoucí okna pro víc typů obsahu, split-docking, plná WCAG certifikace focus-trapů in-app overlayů, token bug fixy nad rámec cover-fit.
