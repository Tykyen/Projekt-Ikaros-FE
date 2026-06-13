# Spec 13.4b — Mapy 2.0 (složky, škála 500+, viditelnost map i složek)

Rozšíření sekce Mapy (13.4) na škálu stovek map se složkami a viditelností na
úrovni map i složek. Navazuje na [[spec-13.4]] (atlas, leak-safe viditelnost map).

## Cíle / motivace

- Až ~500 map per svět → plochý seznam a „vše v jednom dokumentu" nestačí.
- PJ potřebuje mapy **roztřídit do složek** (vnořený strom).
- Viditelnost **per mapa i per složka** (omezit na vybrané hráče / veřejné).

## Datový model (BE refaktor)

Současný stav: všechny mapy embedded v jednom dokumentu `worldMaps`
(`maps: []` per svět) → nelze lazy-load, GET vrací vše. Refaktor na kolekce:

- **`worldMaps`** (1 dok = 1 mapa): `worldId`, `folderId` (null = kořen),
  `title`, `description`, `imageUrl`, `order`, `isPublic`,
  `visibleToPlayerIds`, `createdAt`, `updatedAt`. Index `{worldId, folderId, order}`.
- **`worldMapFolders`** (1 dok = 1 složka): `worldId`, `parentId`
  (null = kořen → vnořený strom), `name`, `order`, `isPublic`,
  `visibleToPlayerIds`, `createdAt`, `updatedAt`. Index `{worldId, parentId, order}`.
- **Migrace:** stávající embedded `maps[]` → dokumenty v `worldMaps`
  (folderId = null), zachovat `order` i viditelnost. Jednorázová, idempotentní.

## Viditelnost — kaskádová (leak-safe)

Mapa i složka mají `isPublic` + `visibleToPlayerIds`. Efektivní viditelnost:

- Hráč vidí složku, pokud `isPublic || userId ∈ visibleToPlayerIds` **a zároveň**
  vidí všechny rodičovské složky (cesta ke kořeni).
- Hráč vidí mapu, pokud vidí ji samotnou **a** vidí její složku (cestu).
- **Složka skrytá pro hráče skryje celý svůj obsah** — i veřejnou mapu uvnitř
  (rozhodnutí: složka má přednost, předvídatelné jako zamčená složka v PC).
- PJ+ (`WorldRole.PJ`, global Admin+) vidí vše.
- Leak-safe: hráči se nevrací `visibleToPlayerIds` ani skryté větve stromu.

## FE — průzkumník

- Strom složek (sbalovací) + obsah vybrané složky (mřížka map = stávající `MapCard`).
- **Lazy load** — obsah složky se načte při jejím otevření, ne všech 500 najednou.
- **Hledání** map napříč složkami.
- Režim Upravit (PJ): CRUD složek (vytvořit/přejmenovat/smazat/přesunout),
  přesun map mezi složkami, nastavení viditelnosti složky i mapy. Smazání složky
  → potvrzení; obsah spadne do rodiče (nebo kořene), nemaže se kaskádně.

## Fázování

1. **BE refaktor** embedded → kolekce `worldMaps` + migrace. Beze změny chování
   (stejné endpointy/DTO, FE netknuté). Ověřit izolovaně.
2. **Složky** — kolekce `worldMapFolders` + CRUD + kaskádová viditelnost (BE)
   + FE strom průzkumníka + `folderId` u mapy + viditelnost složky UI.
3. **Lazy load** (GET per složka) + **hledání** + dotažení UI.

## Mimo scope

- Sdílení map mezi světy (knihovna je u taktických map, ne atlasu).
- Drag&drop reorder stromu (zatím tlačítka/výběr); lze přidat později.
