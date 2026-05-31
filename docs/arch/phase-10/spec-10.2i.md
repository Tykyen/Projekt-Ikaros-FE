# Spec 10.2i — Real-time sync + počasí na mapě

## Účel
Dotáhnout **robustnost real-time synchronizace** taktické mapy a **napojit počasí
(9.4) na mapu**. Velká část sync vrstvy už stojí z **10.2-prep-1** (WS gateway,
generický `map:operation` + `seqNumber`, append-only log, catch-up endpoint) a
**10.2c** (`useMapScene` seq tracking + gap detection + patcher). Tento krok zaceluje
zbývající díry a doplňuje atmosféru počasí.

## Architektonický kontext (odchylka od roadmapy — záměr)
Původní 10.2i roadmapa počítala se sadou specifických eventů (`token-moved`,
`fog-updated`, `effect-added`, `scene-state-changed`, `sound-changed`, …) a
client-side throttlingem/coalescingem. **Architektura se v prep-1 odchýlila** na
**jeden generický `map:operation`** s `seqNumber` + append-only log. To eliminuje
většinu původního scope:
- Specifické eventy → nahrazeny `map:operation` (1 kanál, undo zdarma, gap detection).
- **Throttling/coalescing odchozích → OUT OF SCOPE.** Posíláme **diskrétní operace**
  (1 op / drop tokenu), ne kontinuální stream. Brush (fog/effect) má dedup
  (`lastFogHexRef` / `brushBarrierIdRef`). Coalescing řeší problém, který tahle
  architektura nemá. Zaznamenáno jako vědomé rozhodnutí (viz „Out of scope").

Legacy relay eventy v `maps.gateway.ts` (`map:token-moved` atd.) zůstávají jako
mrtvý BC kód — **mimo scope** tohoto kroku (nemazat, jen nedokumentovat jako živé).

---

## Část i-1 — Real-time robustnost

### Co už funguje (nezměněno)
- Socket.io singleton s JWT auth + auto-reconnect (`features/chat/api/socket.ts`).
- `useMapSocket`: `map:join`/`map:leave`, listener `map:operation`, `map:reassigned`,
  `map:spotlight`.
- `useMapScene`: `lastSeqRef`, happy-path patch (`seq == last+1`), **gap detection**
  (`seq > last+1` → fetch `GET /maps/:id/operations?since=N` → replay), stale skip
  (`seq < expected`), fallback `refetch()`.

### Gap 1 — Reconnect catch-up (jádro)
**Problém:** catch-up se spustí jen když _přijde_ event s vyšším `seqNumber`. Když
socket spadne a po reconnectu **nepřijde žádný nový event** (klid na scéně), zmeškané
operace se nikdy nedotáhnou → klient tiše drží zastaralý stav.

**Řešení:** v `useMapSocket` poslouchat socket `connect` event (socket.io ho emituje
i po reconnectu) a notifikovat `useMapScene` → vynucený catch-up:
- pokud `lastSeqRef` známé → `GET /maps/:id/operations?since=lastSeq` + replay
  (stejná cesta jako gap detection — sdílet helper),
- při chybě / příliš velkém gapu (`> limit`) → `query.refetch()` (full reload),
- po prvním `connect` (initial) **přeskočit** (scéna se načítá přes query).
- Re-join roomu: `connect` handler znovu emituje `map:join(sceneId)` (socket.io
  rooms se po reconnectu ztrácejí — jinak by klient přestal dostávat broadcasty).

💡 **Proč re-join:** socket.io po reconnectu vytvoří nové spojení s prázdnými rooms;
bez re-emit `map:join` by klient byl „připojený", ale mimo scene room → ticho.

### Gap 2 — Indikátor stavu spojení (jádro)
- Reuse existující `socketStatusAtom` (`connecting | connected | disconnected | error`).
- Nenápadný badge na mapě (roh, mimo PJ panel a weather panel) — 3 stavy:
  - `connected` → skrytý nebo decentní tečka „● online",
  - `connecting`/reconnect → „⟳ synchronizuji…",
  - `disconnected`/`error` → „⚠ odpojeno" (varovná barva).
- Při návratu do `connected` po výpadku ukázat krátce „synchronizováno" (catch-up
  proběhl), pak skrýt.
- Theme: nové `--map-status-*` proměnné v `_shared/map-tokens.css` (ok/warn/error).

### Gap 3 — Narovnání kontraktu `websocket-api.md`
`../Projekt-ikaros/docs/websocket-api.md` sekce **2. MapsGateway** je zastaralá
(popisuje legacy relay eventy, nezná operation model). Přepsat na realitu:
- Příchozí: `map:join`, `map:leave`, `map:join-world`, `map:spotlight`.
- Odchozí: `map:operation` (`{ seqNumber, op, byUserId, appliedAt }`, room `{sceneId}`),
  `world:operation` (room `world:{worldId}`), `map:member-joined`/`map:member-left`
  (room `{sceneId}`), `map:reassigned` (room `user:{userId}`), `map:spotlight`,
  `weather:updated` (room `world:{worldId}`).
- REST catch-up: `GET /maps/:id/operations?since=N`, `GET /worlds/:id/operations?since=N`.
- Legacy relay eventy označit jako **deprecated** (ne smazat — BC).

---

## Část i-2 — Počasí na mapě

### Tok (PJ vyšle → mapa zobrazí)
1. PJ na stránce `/pocasi` u generátoru klikne **„Vyslat na mapu"** → existující
   `POST /world-weather/:worldId/generators/:id/broadcast` (už persistuje
   `currentWeather` + emituje WS).
2. Broadcast navíc **zapíše `World.activeMapWeather`** (snapshot — viz BE níže).
3. WS `weather:updated` → mapa (joinutá ve `world:{worldId}`) zaktualizuje panel +
   atmosféru. Pozdější příchozí hráč načte z `World.activeMapWeather` (REST).
4. **PJ override z mapy:** v panelu rychlý select typu → tentýž set/broadcast tok.

💡 **Proč `World.activeMapWeather`:** `currentWeather` je per-generátor a svět má víc
generátorů (regiony) → mapa by nevěděla, „který". `activeMapWeather` je **explicitní
volba PJ, co je teď na mapě**, a drží stav pro pozdější příchozí (živý event nestačí).

### BE změny (modul `worlds` + `world-weather`)
- **`World.activeMapWeather?: { generatorId, generatorName, weather: WeatherResult, setAt }`**
  — nové pole (schema + entity + toEntity mapper — field-drift checklist!).
- `broadcast()` (i případný `setCurrentWeather` z mapy) zapíše `activeMapWeather` na
  svět. **Clear možnost** (PJ „vypnout počasí na mapě" → `activeMapWeather: null`).
- `GET /worlds/:id` vrací `activeMapWeather`.
- **Oprava socket bug:** sjednotit FE↔BE název eventu. BE emituje `weather:updated`
  (dvojtečka, `maps.gateway.ts:332`), FE `useWeatherWsSubscribe` poslouchá
  `weather.updated` (tečka) → live update fakticky nefunguje. **Sjednotit na
  `weather:updated`** (dvojtečka) na FE i kde poslouchá mapa. Dluh D-0xx na evidenci.

### FE — data
- Mapa joinne `world:{worldId}` room (vedle `{sceneId}` room) — jinak hráč event
  nedostane (`weather:updated` jde jen do world room).
- Zdroj: `World.activeMapWeather` z world query/contextu; WS `weather:updated`
  patchne (nebo invaliduje) → re-render.
- Per-user toggle atmosféry: localStorage `ikr-map-weather-fx` (default zap).

### FE — komponenty
- **`components/weather/MapWeatherPanel.tsx`** + css — pravý horní roh, **otvírací**.
  - Zavřený: ikona počasí (`WEATHER_ICON_MAP`) + teplota. Klik = rozbalit.
  - Rozbalený: reuse `<WeatherBarometer>` (tlak+trend), vítr, vlhkost, oblačnost,
    `narrativeText`, in-game datum/čas pokud je.
  - **PJ ovládání** (jen `>= PomocnyPJ`): rychlý select typu (`clear/cloudy/rain/
    storm/snow/fog`) → set na mapu; tlačítko „vypnout počasí" (`activeMapWeather:null`).
  - Hráč: read-only.
  - Toggle „vizuální efekty zap/vyp" (per-user, ovládá overlay).
  - Pozice nesmí kolidovat s zoom controls / iniciativní lištou (horní) — panel pod
    iniciativní lištou, vpravo.
- **`components/weather/MapWeatherAtmosphere.tsx`** — tenký wrapper nad existující
  `<WeatherAtmosphere>` (reuse, **ne** port do PixiJS). DOM overlay nad canvasem,
  `position:absolute; inset:0; pointer-events:none; z-index` nad canvas pod UI panely.
  - Renderuje jen pro `rain/snow/storm/fog/cloudy` (ne `clear`); skrytý při per-user
    vyp nebo `prefers-reduced-motion` (particles už respektuje, tint zůstává).
  - `seed` = `generatorId` (deterministické particles, beze změny pozice při re-mount).

🔀 **Render = DOM overlay, ne PixiJS:** počasí je celoplošná atmosféra fixovaná k
viewportu — nemá se zoomovat/panovat s world-space. Reuse hotové komponenty, žádná
duplikace do Pixi. (Mlha války 10.2h je naopak world-space → Pixi; počasí ne.)

### FE — hook
- **`hooks/useMapWeather.ts`** — vrací `activeMapWeather` (z world dat), `isFxEnabled`
  (+ toggle, LS persist), PJ akce `setWeather(type)` / `clearWeather()` (mutace na
  broadcast/set endpoint). Vzor `useFogTool` (LS persist).

---

## PJ vs hráč
| | Weather panel | PJ ovládání | Atmosféra FX | Status badge |
|---|---|---|---|---|
| **PJ** (`≥ PomocnyPJ`) | vidí | select typu + vypnout | vidí (může vyp per-user) | vidí |
| **Hráč** | vidí read-only | — | vidí (může vyp per-user) | vidí |

## Responsivita
`mobil-desktop` audit po implementaci:
- Weather panel: na mobilu kompaktnější, neblokuje hrací plochu (zavřený = malá pecka).
- Status badge: malý, nekoliduje s palet/dock na mobilu.
- Atmosféra overlay: jen vizuál, bez interakce — touch OK.

## Out of scope (defer)
- **Throttling/coalescing odchozích eventů** — architektura nepotřebuje (diskrétní ops,
  ne stream); brush má dedup. Vědomé rozhodnutí, ne dluh.
- **Idempotency keys** — server autoritativní, FE skipuje stale `seqNumber`, replay řeší
  `since`-query. Netřeba.
- **Per-scéna počasí** — MVP je per-svět (`activeMapWeather`). Různé počasí per scéna
  (jeskyně vs venku) = budoucí rozšíření.
- **Počasí ovlivňuje mlhu/světlo** (fog tint od `fog`-počasí) — defer.
- Legacy relay eventy v gateway — nemazat, jen deprecated v kontraktu.

## Akceptační kritéria
1. **Reconnect:** socket spadne a vrátí se za klidu na scéně → klient se sám re-joinne
   a dotáhne zmeškané operace (catch-up), bez ručního reloadu.
2. **Status badge:** během výpadku „odpojeno", při obnově „synchronizuji" → „online".
3. **Kontrakt:** `websocket-api.md` MapsGateway sekce odpovídá realitě (operation model).
4. **Počasí — vyslání:** PJ klikne „Vyslat na mapu" → panel + atmosféra se objeví všem
   ve světě (i v jiné aktivní scéně).
5. **Počasí — pozdější příchozí:** hráč, co otevře mapu až po broadcastu, vidí aktuální
   počasí (z `World.activeMapWeather`).
6. **Atmosféra:** `rain/snow/storm/fog` renderuje overlay; `clear` ne; per-user vyp
   funguje; `prefers-reduced-motion` skryje particles.
7. **PJ override:** PJ z mapy přepne typ počasí → projeví se všem; „vypnout" skryje.
8. **Hráč read-only:** hráč nevidí PJ ovládací prvky panelu.
9. **WS bug fix:** změna počasí se živě promítne (FE poslouchá správný event název).
10. **Vitest:** reconnect catch-up helper, `useMapWeather` (persist + akce),
    `MapWeatherPanel` (PJ vs hráč render), atmosféra gate (typ + per-user toggle).
```
