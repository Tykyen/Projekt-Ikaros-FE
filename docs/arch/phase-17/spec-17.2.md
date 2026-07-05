# Spec 17.2 — Import hotových map (UVTT / .dd2vtt)

**Stav:** návrh (čeká schválení) · **Fáze:** 17 · **Roadmap:** [§17.2](../../roadmap2.md)
**Závislosti:** 15.2 mřížka (hotovo — `GridAdapter`, `square` adaptér). Připravuje data pro **17.1 (LoS)**.
**Repozitáře:** FE (parser + import UI + vrstva zdí) **i** BE (nová pole scény `walls`/`lights` + operace).

---

## 0. Účel jednou větou

PJ nahraje soubor `.dd2vtt`/`.uvtt`/`.df2vtt` → vznikne **nová scéna** s hotovým pozadím, správně nastavenou mřížkou a uloženými **zdmi + světly** (zatím jako „spící data", která rozsvítí až 17.1).

## 1. Co je UVTT (vstupní formát)

Jeden JSON soubor. Souřadnice geometrie jsou v **jednotkách mřížky** (počet buněk, float), NE v pixelech. Klíčová pole (vše tolerantně, verze 0.2–1.0):

| pole | význam | použití |
|---|---|---|
| `format` | verze (0.2 / 0.3 / 1.0) | jen tolerance, neblokovat |
| `resolution.map_origin {x,y}` | posun počátku mřížky (v buňkách) | kalibrace originu |
| `resolution.map_size {x,y}` | rozměr mapy v buňkách | kontrola / rozměr scény |
| `resolution.pixels_per_grid` | px na jednu buňku (na originálním obrázku) | → `config.size` |
| `image` | PNG jako base64 string | → upload → `scene.imageUrl` |
| `line_of_sight` | pole polygonů (`[{x,y}, …]`) — obvodové zdi | → `scene.walls` (typ `wall`) |
| `objects_line_of_sight` | zdi objektů (od v1.0) | → `scene.walls` (typ `wall`) |
| `portals` | dveře: `{position, bounds:[{x,y},{x,y}], closed, rotation, freestanding}` | → `scene.walls` (typ `door`, `closed`) |
| `lights` | `{position{x,y}, range, intensity, color, shadows}` | → `scene.lights` |
| `environment.ambient_light` | barva okolního světla (hex) | → `scene.config` (volitelné) |

> ⚠️ Přesná pole ověřit na 2–3 reálných vzorcích (Dungeondraft, DungeonFog) při implementaci parseru — verze se drobně liší v názvech (`line_of_sight` vs `objects_line_of_sight`). Parser bere co je, chybějící ignoruje.

## 2. Datový model (NOVÉ)

### 2.1 `scene.walls` — nová top-level pole na `MapScene`
Zdi a dveře jako **úsečky v map-space px** (ne buňky — geometrie je spojitá, jako `MapDrawing.points`).

```ts
interface MapWall {
  id: string;
  points: number[];        // map-space px, páry [x0,y0,x1,y1,...] (lomená čára)
  type: 'wall' | 'door';   // door = průchozí když open
  door?: {
    open: boolean;         // otevřené dveře neblokují (LoS 17.1)
    locked?: boolean;
  };
  blocksSight: boolean;    // default true; 17.1 to čte
  blocksMovement?: boolean;// rezerva (dnes neřešíme pohyb)
}
```

### 2.2 `scene.lights` — nová top-level pole na `MapScene`
```ts
interface MapLight {
  id: string;
  x: number; y: number;    // map-space px
  range: number;           // px (z UVTT range × pixels_per_grid × scale)
  intensity: number;       // 0..1
  color: string;           // #rrggbb
  shadows?: boolean;
}
```

### 2.3 Přechodný stav (17.2 bez 17.1)
`walls`/`lights` se **uloží a vykreslí jako editovatelná vrstva** (PJ je vidí a může doladit), ale **opticky nic neblokují** — occlusion přidá až 17.1. Toto je záměr pořadí, ne dluh.

> 🔀 Alternativa: uložit zdi do volného `scene.config` (0 BE změn). Zamítnuto — zdí bývají stovky segmentů, `config` je na malá nastavení a posílá se celý při každé změně nastavení. Vlastní pole `walls` škáluje a dostane vlastní operace (vzor `effects`/`drawings`).

## 3. Kalibrace mřížky (jádro importu)

Cíl: buňky scény sedí přesně na mřížku obrázku a souřadnice zdí sedí na buňky.

Princip — **1 map-space px = 1 px originálního obrázku**:
- `config.gridType = 'square'` (UVTT mapy jsou vždy čtvercové)
- `config.size = pixels_per_grid`
- `backgroundScale = 1`, `backgroundX = 0`, `backgroundY = 0`
- `config.originX/Y` = `map_origin × pixels_per_grid` (+ případný půlbuňkový posun — buňka `(q,r)` má ve `squareAdapter` střed `(q·size, r·size)`; přesné sladění rohu vs. středu doladit v implementaci proti renderu)
- Přepočet geometrie: `px = grid_unit × pixels_per_grid` (platí pro zdi, portály i světla)
- `unitsPerCell` = 1 buňka; `unitLabel` default (většina UVTT = 5 ft / 1,5 m → volitelně nabídnout)

## 4. Import flow (FE)

1. PJ v PJ panelu / knihovně map: tlačítko **„Importovat mapu (UVTT)"** → file picker (`.dd2vtt,.uvtt,.df2vtt,.json`).
2. Parser: `JSON.parse` → validace minima (`image` + `resolution.pixels_per_grid`); chybí → přátelská hláška.
3. `image` base64 → `Blob`/`File` → `useUploadImage` (`POST /upload/content-image`) → CDN URL.
4. Sestav `config` (§3) + `walls` (§2.1) + `lights` (§2.2).
5. Vytvoř **novou scénu** s tímto obsahem (BE `maps.service.create` rozšířený o `walls`/`lights`, nebo create + import operace).
6. Otevři scénu, náhled zdí zapnutý → PJ může doladit.

> 💡 Import = nová scéna, ne přepis existující. UVTT nese kompletní prostředí; míchat ho do rozdělané scény = riziko konfliktu. Postavy/tokeny UVTT NEobsahuje (jen prostředí) — ty PJ přidá jako dnes.

## 5. Vrstva zdí v mapě (FE render)

- Nová `<pixiContainer label="layer-walls">` v `TacticalMapView` (nad tokeny, kolem ř. 1688 vedle fogu).
- Render: `<pixiGraphics>` — zdi jako čáry (výrazná barva), dveře odlišené (otevřené = tečkovaně/průhledně).
- Viditelná **jen PJ** (hráč zdi editační vrstvou nevidí; v 17.1 je „uvidí" nepřímo přes fog).
- Editace zdí (přidat/mazat/otevřít dveře) = **mimo scope 17.2** (jen import + zobrazení + doladění pozice pozadí). Ruční kreslení zdí → volitelně 17.1 nebo samostatný krok. Import ale musí umožnit smazat/reimportovat.

## 6. Operace (extension point — 7 míst)

Nové operace (vzor `effect.*` / `scene.effects.replace`):
- `scene.walls.replace { walls: MapWall[] }` — hlavní, používá import.
- `scene.lights.replace { lights: MapLight[] }`
- (rezerva pro 17.1/editaci) `wall.add`, `wall.remove`, `wall.update` — **mimo scope 17.2**, přidat až s editací.

Místa k úpravě:
1. FE union `MapOperation` (`types.ts:243`) + nová pole `MapScene` (`types.ts:192`).
2. FE reducer `applyOperationToScene.ts` — nové `case` (+ exhaustive `never`).
3. FE mutace v `TacticalMapView.tsx` (vzor `fogMutation`).
4. FE render — `layer-walls` (+ `layer-lighting` rezerva pro 17.1).
5. BE DTO `dto/operations/` + zápis do `MAP_OPERATION_DTOS` + `MapOperationPayload`.
6. BE apply/validate/authorize (`map-operations.service.ts` atd.) — autorizace **PJ+**.
7. BE interface mirror `map-scene.interface.ts` + schema pole `walls`/`lights` (`MixedArraySubSchema` vzor jako `effects`).

> ⚠️ Po BE změně nutný **restart** (jinak starý bundle tiše zahodí nová pole — `feedback_be_restart_required`). `type-sync` na `MapScene`.

## 7. Pořadí dodání (bránové kroky)

- **W1 — BE model:** pole `walls`/`lights` na schéma + interface + `scene.walls.replace`/`scene.lights.replace` DTO/apply/authorize. Restart. → nasazená prázdná pole, žádný FE dopad.
- **W2 — FE parser + upload:** čistá funkce `parseUvtt(file) → {config, walls, lights, imageBase64}` + base64→File + upload. Vitest na parseru (2–3 vzorky). Bez UI.
- **W3 — FE import akce:** tlačítko + file picker → parser → upload → create scéna. `mobil-desktop`.
- **W4 — FE vrstva zdí:** `layer-walls` render + reducer `case` + typy. `mobil-desktop`.
- Po každém: `tsc -b` (`npm run build`), dotčené vitest. Před commitem `funkce` + `napoveda`.

Lze zastavit po kterémkoli kroku — stav konzistentní (zdi jen leží, nic nerozbíjí).

## 8. Hranice scope

- **V scope:** parser UVTT → nová scéna (pozadí + mřížka + zdi + světla uložené a zobrazené PJ), doladění pozice pozadí.
- **Mimo:** ruční kreslení/editace zdí, occlusion/LoS (17.1), dynamické světlo (17.1), import tokenů/postav (UVTT je nemá), hromadný import, licenční katalog map.

## 9. Otevřené otázky (neblokují start)

- Půlbuňkový posun originu — doladit proti reálnému renderu (W2/W4).
- Nabídnout při importu volbu `unitLabel` (ft/m) dle světového systému, nebo default 1?
- Světla `range` v range-units vs. px — ověřit na vzorcích (pravděpodobně × `pixels_per_grid`).
- Reimport do stejné scény (nahradit) vs. vždy nová — zatím **vždy nová**.
