# Plán 10.2i — Real-time sync + počasí na mapě

Spec: [spec-10.2i.md](./spec-10.2i.md). Dvě části: **i-1 real-time robustnost** (čistě
FE), **i-2 počasí na mapě** (malé BE + FE). Weather WS bug (tečka→dvojtečka) **už
opraven** mimo plán (`useWeatherWsSubscribe.ts` + testy, 19/19 zelené).

## Klíčové nálezy z rešerše
- `socketStatusAtom` (`features/chat/store/socketStore.ts`): `'disconnected'|'connecting'|'connected'|'error'`, čte `useAtomValue`.
- Socket listenery se registrují přes `getSocket()` (`features/chat/api/socket.ts`), `socket.on('connect'|'disconnect'|'connect_error')` už nastavuje status atom.
- `useMapSocket(opts)` registruje `map:operation/reassigned/spotlight` v `useEffect` + emit `map:join`. `useMapScene(worldId, opts)` drží `lastSeqRef`, gap-detection + catch-up blok (ř. 93–129).
- `TacticalMapView`: `useWorldContext()` → `{ worldId, world, userRole }`, `isPJ = userRole >= WorldRole.PomocnyPJ`. `MapPjPanel` vpravo nahoře, `MapDockStack` vpravo dole.
- `BroadcastWeatherDto`: `{ target: 'chat'|'map', channelId?, mapId? }` — **`target:'map'` už existuje**, branch jen nepersistuje. Endpoint `POST /worlds/:worldId/weather-generators/:id/broadcast`.
- `World` (FE `shared/types/index.ts:333`, BE `world.schema.ts`): přidat `activeMapWeather`.

---

## ČÁST i-2 BE — `World.activeMapWeather`

### Krok B1 — schema + typ + mapper (field-drift checklist [[project_be_field_checklist]])
1. **FE typ** `shared/types/index.ts` (~ř. 371): 
   ```ts
   activeMapWeather?: {
     generatorId: string; generatorName: string;
     weather: WeatherResult; setAt: string;
   } | null;
   ```
2. **BE schema** `worlds/schemas/world.schema.ts`: `@Prop({ type: Object, default: null }) activeMapWeather?: Record<string, unknown> | null;`
3. **BE entity interface** + **toEntity mapper** (`worlds.repository.ts` / interface) — **začni od mapperu**, jinak GET zahodí pole (memory [[project_be_field_checklist]]).
4. Ověř, že `GET /worlds/:id` (`findByIdForRequester`) pole vrací (přes mapper automaticky).

### Krok B2 — zápis při broadcast `target:'map'`
- `world-weather.service.ts` `broadcast()` map-branch (ř. 1121–1127): vedle
  `eventEmitter.emit('weather.updated', …)` zapsat na World:
  `worldsRepository.setActiveMapWeather(worldId, { generatorId, generatorName, weather, setAt: new Date() })`.
- Nová repo metoda `setActiveMapWeather` (atomic `$set`).
- **Clear:** rozšířit DTO o `target:'map-clear'` **nebo** nový lehký endpoint
  `DELETE /worlds/:worldId/active-map-weather` (PJ-only). 🔀 Volím **DELETE endpoint**
  — čistší než přetěžovat broadcast DTO; PJ „vypnout počasí" volá DELETE → `activeMapWeather:null` + emit `weather:updated` s `weather:null` signálem.
- ⚠️ Po BE změně **restart/`nest --watch`** (memory [[feedback_be_restart_required]]) + `prettier --write` před commitem (memory [[feedback_be_precommit_prettier]]).

### Krok B3 — emit i clear přes WS
- `clear` musí taky emitnout do `world:{worldId}` (reuse `weather.updated` interní event s `weather:null`, nebo nový `weather:map-cleared`). 🔀 Volím **`weather:updated` s `activeMapWeather:null`** v payloadu — jeden kanál, FE rozliší.

---

## ČÁST i-1 FE — Real-time robustnost

### Nové soubory (i-1)
| Soubor | Obsah |
|---|---|
| `tactical-map/hooks/useReconnectCatchup.ts` | listener `socket.on('connect')` → re-join + forced catch-up |
| `tactical-map/components/MapConnectionBadge.tsx` + `.module.css` | status badge (dle frontend-design auditu) |

### Krok 1 — extrahovat catch-up helper z `useMapScene`
- Gap-detection blok (ř. 107–128) refaktorovat na sdílenou funkci
  `catchUpFromSeq(sceneId, fromSeq): Promise<{ ops, lastSeq } | 'too-big'>`
  (uvnitř `useMapScene` nebo util), aby ji volal i forced catch-up. **Beze změny chování** happy-path/gap.

### Krok 2 — reconnect catch-up
- V `useMapSocket` (nebo nový `useReconnectCatchup`) přidat `useEffect` s
  `socket.on('connect', handler)` **bez** dep na sceneId (listener žije po celou dobu):
  - **přeskoč initial connect** (`hasConnectedRef`) — scénu řeší query,
  - jinak: `socket.emit('map:join', sceneId)` (re-join room!) + zavolat
    `onReconnect()` callback → `useMapScene` spustí `catchUpFromSeq(scene.id, lastSeqRef.current)`,
  - výsledek `'too-big'` / chyba → `query.refetch()` (full reload).
- 💡 Re-join je nutný: socket.io po reconnectu má prázdné rooms.
- `useMapScene` vystaví `onReconnect` (interně volá catch-up) a předá do `useMapSocket`.

### Krok 3 — `MapConnectionBadge`
- `useAtomValue(socketStatusAtom)`:
  - `connected` (a po čerstvém catch-up) → krátce „✓ synchronizováno", pak skrýt,
  - `connecting` → „⟳ synchronizuji…",
  - `disconnected`/`error` → „⚠ odpojeno".
- Pozice: roh mimo Pj panel / weather panel / docky (návrh: levý horní, malý).
- Nové theme proměnné `--map-status-ok/warn/error` v `_shared/map-tokens.css`.
- **frontend-design audit** před implementací (badge je nový vizuál).

### Krok 4 — narovnat `websocket-api.md`
- `../Projekt-ikaros/docs/websocket-api.md` sekce **2. MapsGateway** přepsat na
  operation model (dle spec i-1 Gap 3); legacy relay eventy označit `deprecated`.

---

## ČÁST i-2 FE — Počasí na mapě

### Nové soubory (i-2)
| Soubor | Obsah |
|---|---|
| `tactical-map/hooks/useMapWeather.ts` | `activeMapWeather` z world ctx, FX toggle (LS `ikr-map-weather-fx`), PJ `setWeather`/`clearWeather` mutace |
| `tactical-map/hooks/useMapWeather.test.ts` | persist FX toggle + akce (TDD) |
| `tactical-map/components/weather/MapWeatherPanel.tsx` + `.module.css` | otvírací panel pravý horní roh (dle auditu) |
| `tactical-map/components/weather/MapWeatherAtmosphere.tsx` | wrapper nad `<WeatherAtmosphere>` (DOM overlay) |

### Krok 5 — `useMapWeather` (TDD)
- Zdroj: `useWorldContext().world?.activeMapWeather`.
- `isFxEnabled` (LS `ikr-map-weather-fx`, default `true`) + `toggleFx()`.
- PJ akce (gate `isPJ`):
  - `setWeather(generatorId)` → `POST …/weather-generators/:id/broadcast { target:'map' }`,
  - `clearWeather()` → `DELETE /worlds/:worldId/active-map-weather`.
- Po mutaci invaliduje `GET /worlds/:id` (nebo čeká na WS `weather:updated`).
- Test první (FX persist, akce volají správný endpoint).

### Krok 6 — world-room join + WS listener
- `useMapWeather` (nebo `useMapSocket`) `socket.emit('world:join'?, …)` — **ověřit
  room mechanismus**: mapa musí být v `world:{worldId}`. Pokud join-room helper
  neexistuje pro world, reuse stávající `map:join-world` (PJ-only!) **nejde pro hráče**
  → ⚠️ potřeba **neutrální world join** pro hráče. Možnosti:
  - (a) emit existující `room:join` `world:{worldId}` (AppGateway, viz kontrakt rooms tabulka),
  - (b) BE doplnit `map:join` aby auto-joinl i `world:{worldId}`.
  🔀 Volím **(a) `room:join`** pokud existuje AppGateway handler; jinak (b). Ověřit při implementaci, doplnit do spec.
- Listener `socket.on('weather:updated')` → patch world query cache `activeMapWeather`
  (z payloadu); `weather:null` → clear.

### Krok 7 — `MapWeatherPanel` + CSS (po frontend-design auditu)
- Zavřený: `WEATHER_ICON_MAP[type]` ikona + teplota, klik rozbalí.
- Rozbalený: `<WeatherBarometer>` (reuse), vítr/vlhkost/oblačnost/srážky, `narrativeText`, in-game datum.
- PJ blok (`isPJ`): segmented select typu (`clear/cloudy/rain/storm/snow/fog`) → `setWeather` (vyber generátor — MVP: pokud víc generátorů, dropdown; pokud 1, přímo) + „vypnout počasí" → `clearWeather`.
- Per-user toggle „vizuální efekty".
- Pozice: pravý horní roh, **pod** iniciativní lištou (`top` offset), nekolidovat s `MapPjPanel`.

### Krok 8 — `MapWeatherAtmosphere`
- Wrapper: `position:absolute; inset:0; pointer-events:none`, z-index nad canvas pod UI panely.
- Render jen když `activeMapWeather && isFxEnabled && type ∈ {rain,snow,storm,fog,cloudy}`.
- Předá `weatherType` + `seed=generatorId` do `<WeatherAtmosphere>` (reuse, žádný Pixi port).
- `prefers-reduced-motion` řeší už `WeatherAtmosphere` (particles off, tint zůstává).

### Krok 9 — integrace `TacticalMapView`
- `const weather = useMapWeather();`
- `<MapWeatherAtmosphere … />` jako DOM overlay nad `<Application>` (mimo Pixi strom).
- `<MapWeatherPanel … isPJ={isPJ} />` pravý horní roh.
- `<MapConnectionBadge />` (i-1).

---

## Frontend-design audit (mezi plánem a kódem)
Před implementací vizuálních komponent (`MapWeatherPanel`, `MapConnectionBadge`)
spustit **frontend-design** skill jako design audit (memory [[feedback_frontend_design_audit]]):
panel otvírací mechanika + glassmorphism/skin-aware vzhled, badge nenápadnost, weather
ikonografie. Atmosféra = reuse, bez auditu.

## Závěr (Krok 10)
1. `mobil-desktop` audit (panel kompaktní na mobilu, badge malý, overlay touch-safe).
2. Vitest celé zelené (`useMapWeather`, `MapWeatherPanel` PJ/hráč, atmosféra gate, catch-up helper).
3. BE: `prettier --write` + restart, BE testy (broadcast map-target persist, clear endpoint).
4. Roadmapa 10.2i → `[x]` + changelog (vč. weather WS bug fix).
5. `napoveda` skill (nová funkčnost: počasí na mapě, PJ ovládání).
6. Dluhy → `dluhy.md` pokud nějaké zbydou (např. per-scéna počasí = defer, ne dluh).

## Pořadí
**i-2 BE** (B1→B2→B3) → **i-1** (1→2→3→4) → **i-2 FE** (5→6→7→8→9) → audit vizuálů (před 3 a 7) → závěr.
TDD: B1-mapper, krok 1 helper, krok 5 hook. Vizuální (3,7,8,9): manuální + smoke.
