# Handoff — 17.10 Panelový workspace (taktická mapa)

> Předání do nové konverzace. Cíl: navázat bez ztráty kontextu a **rovnou jít k implementaci**, ne dál ladit HTML náhled.
> Datum: 2026-07-06.

## TL;DR
17.10 = sjednotit roztříštěné overlay panely taktické mapy pod **jednoho správce**: každý panel jde *zmenšit do spodní lišty a nahodit*, panely se *nepřetlačují*, karta postavy/nestvůry jde otevřít jako *plovoucí/ukotvené okno*, a je *pravý klik* menu. **Beze změny grafiky** (motiv/skin zůstává). Náklad velký → dělá se po fázích **A1–A5** (zátah A); server-side layout = pozdější zátah B.

**Stav:** hotová analýza + adversariálně ověřená diagnóza + schválený směr + odladěný vizuální náhled. **Nezačala implementace.** Další krok = impl plán A1 → kód.

## Kde co je (artefakty)
- **Spec:** [`docs/arch/phase-17/spec-17.10.md`](spec-17.10.md) — zdroj pravdy, obsahuje architekturu + fáze + ověřené nálezy.
- **Vizuální náhled (ZÁVAZNÁ předloha, 2026-07-06):** `c:\tmp\17.10-takticka-mapa-plna.html` — plná interaktivní replika UI (všechny panely + reálný obsah + pohyby), věrná realitě (motiv „ikaros" synthwave), přepínač palety synth↔pergamen. Starší `c:\tmp\17.10-workspace-navrh.html` je překonaný (hnědá paleta — pro barvy nepoužívat). **Realizovat v kódu dle plné předlohy.**
- **Dluh token deformace:** [`docs/dluhy.md`](../../dluhy.md) → **D-062** (samostatný bug, ne součást 17.10).
- **Roadmapa:** [`docs/roadmap2.md`](../../roadmap2.md) → řádek 607 (17.10).

## Ověřené nálezy (adversariálně, 3× CONFIRMED, 1× PARTIAL)
Kořen = **neexistuje sdílený správce panelů**; 3 nezávislé rohové systémy (`.weatherSlot` z30, `.stack` z100, `.bottomLeftStack` z90) + samostatné panely; z-index = natvrdo psané literály; jediná koordinace je CSS var `--map-dock-width`.
1. **Kostky flyout se ořezává (desktop)** — `DicePickerPopover` (320px) je `absolute` uvnitř `.stack` s `overflow-y:auto` (→ klipuje) a bez viewport-clampu. Ořez je na LEVÉ straně stacku (popover širší než shrink-to-fit stack ~228px). Fix: portál mimo `.stack` + `getBoundingClientRect` clamp. `DicePickerPopover.module.css:3-24`, `MapToolDock.module.css:7-34`.
2. **Počasí × pravá lišta kolize** — `.weatherSlot` (z30, nereaguje na `--map-dock-width`) vs `.stack` (z100) na stejném pravém okraji bez rezervace místa. `TacticalMapView.module.css:44-55`.
3. **Token portréty postav deformované** — `resolveTokenImageCrop` (`TacticalMapView.tsx:871`) vrací postavám `undefined` → no-crop stretch v `TokenSprite.tsx:73-75`. Bestie mají cover+focal. → **D-062**, řeší se samostatně.
4. **Žádný správce panelů** — potvrzeno (0 shod na PanelContext/WorkspaceContext; usePanelMode/Layout jen pro TokenInfoPanel).

## Architektura (jádro A) — rozšířit vzor `--map-dock-width` na obecný systém
1. **`useMapWorkspace`** (jotai atom, jako `uiStore`) — registr stavu každého panelu (`open/collapsed/minimized/floating`) + pořadí fokusu; persist `atomWithStorage` (`ikr-map-workspace-v1`).
2. **`<MapPanel>` shell** — obal s hlavičkou (titul + *složit/zavřít/odtrhnout*); **obaluje** existující panely, nepřepisuje.
3. **Z-index škála** místo literálů (`base < panel < flyout < floating < overlay < modal`; fokusnutý navrch).
4. **Rezervace okrajů** — `--map-inset-right/-top/-bottom-left` (zobecnění `--map-dock-width`; do pravého okraje počítat i šířku scrollbaru) → strukturálně řeší kolizi počasí.
5. **`<MapDock>`** spodní lišta — čte registr, kreslí dlaždice; klik nahodí. Objeví se až něco schováš; **wrap na víc řádků**.
6. **Flyout util** — sdílený `useAnchoredPosition` (z `LinkPicker`) + portál + clamp → řeší kostky.

## Fáze zátahu A
- **A1** základ: z-index škála + `<MapPanel>` shell + `useMapWorkspace` + rezervace okrajů (řeší i kolizi počasí).
- **A2** minimalizace do `<MapDock>` + „Uklidit vše".
- **A3** flyout fix (kostky — portál+clamp).
- **A4** statblok jako okno (napojit `TokenInfoPanel`, dock/drag/overlay už existuje) + minimalizace.
- **A5** pravý klik menu (token/mapa).

## Závazný UX layout (odladěno s uživatelem v náhledu — DODRŽET)
- **Horní bojová lišta** (iniciativa: „Zahájit boj" + portréty) = **sbalitelná nahoru** (roleta) + úchyt „Zobrazit bojovou lištu". **Klik na portrét → otevře kartu postavy** (jako klik na token).
- **Řádek pod bojovou lištou** (posouvá se nahoru/dolů podle sbalení lišty): **Uklidit mapu** · **Mapa** (jen „Mapa", vždy) · **Telefon** (vedle Mapy, vždy — nutný pro volání) · **Počasí** (—) · **Deník** (—).
- **Globální nápověda VYŘAZENA.** Kontextová „?" zůstává uvnitř panelů (Orchestrace má vlastní „?").
- **Uklidit mapu** = toggle (Uklidit ↔ Vrátit panely). Schová **vše dolů** — nástroje **jednotlivě** (4 čipy: Efekty & kreslení, Mlha, Zobrazení, Ambient), Hody, Orchestraci, Počasí, Deník, otevřenou kartu. **Kostky (🎲) zůstávají vždy vpravo dole**, nemizí. Zůstávají i Mapa/Telefon/Uklidit.
- **Pravá lišta nástrojů (zaražená k DOLNÍ hraně, roste nahoru):** ikona **Kostky** (🎲, vždy) + docky **Efekty & kreslení / Mlha / Zobrazení (Zoom + Pravítko) / Ambient**, každý sbalitelný s vlastním „—". Hlavička „Nástroje / — zmenšit vše" zmizí, když není otevřený žádný nástroj. **„— zmenšit vše" i „Uklidit" = nástroje JEDNOTLIVĚ** (4 čipy, NE jeden „Nástroje"). Kostky se neminimalizují.
- **Levá dolní:** Hody (—) · Orchestrace (— + „?").
- **Spodní lišta „Zmenšené":** kam padají minimalizované; **flex-wrap na víc řádků**; klik na čip nahodí; „✕" na čipu zahodí.
- **Karta postavy/nestvůry:** plovoucí okno na **pevné pozici** (BEZ dragu — rozhodnutí 2026-07-06) NEBO **dock mód** (📌 ukotvit v boku, plná výška, **vlastní posuvník**); přepíná se jen 📌↔🪟. Dock mód **odsune nástroje/pravítko** (rezervace pravého okraje vč. scrollbaru). Minimalizovatelná do lišty.
- **Pravý klik** na token → menu (Otevřít kartu / Upravit životy / Přidat do iniciativy / Skrýt hráčům / Odebrat). Na mapu → (Umístit token / Změřit / Odkrýt mlhu).
- **Motiv (ZNOVU OPRAVENO 2026-07-06 dle screenshotu):** **chrome** (bojová lišta, nástroje, počasí) = **fialové synthwave** (`--map-ui-*`). **Herní panely** (Hody, Orchestrace, karta) = **deníkový skin světa** — v Matrix světě **hnědý pergamen** (screenshot potvrdil). Původní rozlišení „chrome fialový + herní panely hnědý skin" bylo **správné**; mezi-korekce na „vše synthwave" chybná (analýza kódu místo screenshotu).

## Doporučený první krok v nové konverzaci
1. Otevři náhled `c:\tmp\17.10-takticka-mapa-plna.html` jako předlohu.
2. Nech si napsat **impl plán A1** (konkrétní soubory: nový `useMapWorkspace`, `<MapPanel>`, z-index tokeny, rezervace okrajů; jak napojit `MapToolDock`/`MapWeatherPanel`/`DiceLogPanel`/`MapPjPanel`/`TokenInfoPanel` bez přepisu) → odsouhlas → **kód**.
3. Vizuální detaily lados až v reálné appce přes `mobil-desktop`, ne v HTML náhledu.

## Poučení (proč tahle konverzace uvázla)
Iterovali jsme desítky mikro-úprav pozic tlačítek v HTML náhledu — to není posun k cíli (funkční kód). **Náhled je teď dost hotový.** Nová konverzace má jít rovnou na impl plán A1 a psát reálný kód; drobné vizuální doladění řešit až v appce.
