# Spec 17.1 — Dynamické světlo & linie pohledu (LoS)

**Stav:** návrh (čeká schválení) · **Fáze:** 17 · **Roadmap:** [§17.1](../../roadmap2.md)
**Závislosti:** 15.2 mřížka (hotovo), **17.2 zdi/světla** (hotovo — `scene.walls`/`scene.lights`).
**Repozitáře:** **jen FE** (výpočet klient-side; žádná nová BE pole — walls/lights z 17.2 stačí).

---

## 0. Účel jednou větou

Token automaticky „vidí" jen tam, kam dohlédne přes zdi (a v temné scéně jen kam dosvítí světlo) — mlha se počítá sama z pozic postav a zdí, PJ ji nemaluje ručně.

## 1. Klíčové rozhodnutí — reuse fog vrstvy

`FogLayer` už bere `revealedSet: Set<"q,r">` a umí vše: blur okraje, role-alpha (PJ vidí skrz), skrytí NPC za mlhou (`isTokenHiddenByFog`). **LoS nepřidává nový render — jen dodá `revealedSet` odvozený z LoS místo z ručního štětce.**

```
manual (dnes):   revealedSet = effectivelyRevealed(scene.revealedHexes, tokens)
dynamic (17.1):  revealedSet = computeVisionReveal(pcTokens, walls, lights, config)
```

> 💡 Proč takhle: pixel-perfect stínová maska (RenderTexture) by narazila na stejný paměťový strop, kvůli kterému fog používá buňkový přístup (viz spec-10.2h). Buňkové rozlišení je konzistentní s tím, jak mlha funguje dnes, a pro grid VTT plně dostačuje.

> 🔀 Alternativa: RenderTexture maska s polygonovými stíny (pixel-perfect). Zamítnuto pro MVP — imperativní PIXI lifecycle cizí téhle deklarativní codebase + paměť. Lze dodat později jako vizuální upgrade, datový model se nemění.

## 2. Výpočet (klient-side, čisté funkce)

### 2.1 `wallsToSegments(walls) → Segment[]`
Zeď `points` (lomená čára) → úsečky. **Otevřené dveře** (`door.open`) segment NEpřidají (neblokují). `blocksSight === false` přeskočit.
```ts
interface Segment { ax: number; ay: number; bx: number; by: number; }
```

### 2.2 `computeVisibilityPolygon(origin, segments, bounds) → Point[]`
Klasický angle-sweep visibility polygon (Red Blob Games):
1. K segmentům přidat 4 hrany `bounds` (mapa je ohraničená → polygon uzavřený).
2. Endpointy segmentů → úhly od `origin`.
3. Na každý úhel vrhnout 3 paprsky (`θ`, `θ±ε`) — obtečení rohů.
4. Nejbližší průsečík paprsku se všemi segmenty (ray-segment intersection).
5. Seřadit hity dle úhlu → polygon viditelnosti.

Složitost: `O(E²)` na token (E = endpointy). UVTT mapy = desítky–nižší stovky segmentů → jednotky ms na token; memoizováno (přepočet jen při pohybu tokenu / změně zdí).

### 2.3 `cellsInPolygon(polygon, adapter, config, bounds) → HexCoord[]`
Iterace buněk v bbox (jako `FogLayer`, culling) → střed buňky uvnitř polygonu (point-in-polygon, ray-cast even-odd) → buňka „viditelná".

### 2.4 `computeVisionReveal(pcTokens, walls, lights, config, bounds) → Set<"q,r">`
Sjednocení `cellsInPolygon` přes všechny PC tokeny. V **temném režimu** (`config.darkness`) buňku přidat jen když je v dosvitu:
- do `visionRange` buněk od tokenu (default „nekonečno" = jasná scéna), **nebo**
- uvnitř dosahu některého `light` (`range` px) — světlo osvětluje, token na něj potřebuje LoS.

## 3. Config (rozšíření `HexConfig`, vše optional + BC)

| pole | typ | default | význam |
|---|---|---|---|
| `visionMode` | `'manual' \| 'dynamic'` | `'manual'` | zdroj mlhy |
| `darkness` | boolean | `false` | temná scéna (vidím jen do dosvitu/světel) |
| `visionRange` | number | `undefined` (∞) | dosvit tokenu v buňkách (jen `darkness`) |

BE: `config` je volný objekt → **žádná BE změna** (proplují jako `backgroundScale` v 17.2). `dynamic` vyžaduje `fogEnabled = true`.

## 4. Dotčená místa (FE)

| # | Soubor | Změna |
|---|---|---|
| 1 | `vision/raycast.ts` (NOVÉ) | `wallsToSegments`, `computeVisibilityPolygon`, `cellsInPolygon`, `computeVisionReveal` + vitest |
| 2 | `types.ts` `HexConfig` | `visionMode`/`darkness`/`visionRange` |
| 3 | `TacticalMapView.tsx` (`revealedSet` memo ~:669) | větev dle `config.visionMode` |
| 4 | `EditSceneModal.tsx` | přepínač „Automatická viditelnost (LoS)" + temná scéna + dosvit |
| 5 | `LightsLayer.tsx` (NOVÉ, volitelné) | vizualizace osvětlených oblastí (radial glow z `lights`) v `darkness` |

Žádná nová operace (config jde přes stávající `scene.config`). Žádný BE zásah.

## 5. Dveře jako přepínač (interakce)

Otevřené dveře neblokují (`wallsToSegments` je vynechá). PJ přepíná dveře v `WallsLayer` (klik na dveře → `door.open` toggle → `scene.walls.replace`). Při dynamic vision se LoS ihned přepočítá (memo dep = walls). → „otevři dveře, postavy uvidí do vedlejší místnosti".

> ⚠️ Toggle dveří = nová interakce na `WallsLayer` (17.2 ji jen zobrazuje). Přidat v rámci 17.1.

## 6. Pořadí dodání (bránové kroky)

- **L1 — jádro:** `vision/raycast.ts` + vitest (visibility polygon, dveře, point-in-polygon). Bez UI. = prototyp/ověření korektnosti.
- **L2 — napojení:** větev `revealedSet` v `TacticalMapView` + config typy + přepínač v `EditSceneModal`. Jasná scéna (bez darkness).
- **L3 — temno + světla:** `darkness`/`visionRange` ořez + `LightsLayer` glow.
- **L4 — dveře:** toggle na `WallsLayer` → `scene.walls.replace` → LoS re-compute.
- Po každém: `tsc -b` (`npm run build`) + vitest. `mobil-desktop` (UI kroky).

Lze zastavit po L2 (funkční LoS v jasné scéně) — L3/L4 jsou nadstavba.

## 7. Výkon — jak ověříme

- **Korektnost:** vitest na `raycast.ts` (paprsek za zeď nedohlédne, otevřené dveře propustí, buňka za rohem skrytá).
- **Runtime FPS:** memoizace na `[pcTokenPositions, walls, config]` → přepočet jen na změnu, ne každý frame. Skutečný FPS na velké scéně ověří tester v živé appce (nemáme headless GPU benchmark). Fallback když by sekalo: cache polygonů, throttle přepočtu na drag-end.

## 8. Hranice scope

- **V scope:** LoS z PC tokenů přes zdi, otevírání dveří, temná scéna s dosvitem, osvětlené oblasti ze světel, přepínač manuál/auto.
- **Mimo:** pixel-perfect stínová maska, barevné světlo/míchání, per-token různé vidění (darkvision typy), animované přechody mlhy, LoS pro NPC „co vidí nepřítel".

## 9. Otevřené otázky

- Default `visionRange` v temnu (6 buněk? dle systému?).
- Vidí hráč historii prozkoumaného („explored" našedle) nebo jen aktuální LoS? MVP: jen aktuální (dynamické). „Explored paměť" = pozdější rozšíření (nové derived pole).
- Přepočítávat LoS během dragu tokenu (živě) nebo až na drop? MVP: na drop (výkon).
