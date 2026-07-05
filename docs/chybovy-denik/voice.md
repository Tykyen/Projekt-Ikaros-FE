# Chybový deník — Voice / hlas & video (17.6)

Záznamy k Voice krčmě (hlasový hovor přes Jitsi).

## ✅ ŘEŠENÍ — 17.6 Voice krčma end-to-end (Jitsi adaptér, BE+FE) — 2026-07-05

**Co postaveno:** nová globální hlasová místnost „Voice krčma" (voice-first, jen registrovaní) mezi Putykou a Campy. Hlas/video přes Jitsi (`meet.jit.si`) za **provider adaptérem** (LiveKit později bez přepisu UI).
- **BE:** `RoomKey`+`ROOM_DEFS` `voice-krcma` (auto-seed, REST/WS zdarma) · `resolveSenderIdentity`=účet · `presenceLine` hlasový tón · WS voice presence (`voice:join/leave/state` → `chat:voice:presence/state`, anti-spoof z `client.data.userId`, multi-tab dedup, reconnect re-join) · 8 nových testů (jest 118/118).
- **FE:** `features/voice/` adaptér (`VoiceProvider` interface + `JitsiVoiceProvider` + `useVoice` + `loadJitsiApi` vzor YT) · `useVoicePresence` · `VoiceKrcmaRoom` voice-first (Řezbářská skin na **`--theme-*` tokenech** → přebarví se s platformovým skinem) · text pokec = reuse `ChatRoom` · pop-out přes `window.open` (`?popout`).
- **CSP:** +`meet.jit.si` do script-src/frame-src/connect-src + delegace kamery/mikrofonu (viz CH-054).

**Co zabralo / proč správně:**
- **Adaptér od začátku** = pozdější LiveKit swap bez přepisu UI (splnil uživatelův požadavek „vylepšíme, až bude rozjeté").
- **Jitsi nedělá signaling na našem BE** — audio/WebRTC běží uvnitř iframe pod CSP Jitsi. Náš BE jen textový pokec + lehká voice presence (metadata). Ušetřilo to celý WebRTC stack (průzkum varoval „BE nemá signaling" — vyřešeno volbou Jitsi, ne stavbou vlastního).
- **Skin identita ve tvaru, barvy z tokenů** — krčma drží „Řezbářskou" (dřevo/okování/vlys) a přebarví se s libovolným skinem; přesně model dohodnutý s uživatelem.
- **Reuse vzorů:** WS voice presence = mirror SoundBroadcast; Jitsi loader = mirror YouTube; text = celý `ChatRoom`.

**Jak ověřeno:** BE typecheck+eslint+jest 118/118; FE build+tsc+eslint+vitest 14/14. **Živý hlas/video (mikrofon+kamera) + mobil = na uživateli** (headless to nespustí).

**Zhodnocení:** dobře — reuse existujících vzorů držel rozsah malý; agentní průzkum dal přesné integrationPoints. Pozor: dvě pasti musel chytit až kód, ne průzkum (CH-054 + guestSock níže).

**Follow-up (mimo V1):** perzistentní voice-bar přes navigaci · Document PiP (plovoucí nad vším) · BroadcastChannel sync oken · self-host Jitsi + JWT (room-name salt NENÍ bezpečnost).

**Pre-existing odhaleno (opraveno):** `guestSock` mock v `global-chat.gateway.spec` neměl `emit` → na Node v24 (unhandled rejection = fatal) crashovaly guest testy hned, jak je `registerPresence`→`emitMyRooms` zavolal (`client.emit is not a function`). Doplněn `emit: jest.fn()`. Poučení: mock socketu musí nést všechny metody, které kód reálně volá — Node v24 už floating-promise chybu neschová.

## CH-054 — průzkum tvrdil „Permissions-Policy `camera=()` Jitsi iframe neblokuje", realita opak — 2026-07-05

**Oblast:** fe/csp. **Příznak cyklení:** projevilo by se jako „hlas/video v krčmě nejde, ač CSP `meet.jit.si` povoluje".

Průzkumný agent (Jitsi/CSP) uvedl, že `Permissions-Policy: camera=(), microphone=()` na našem originu **neblokuje** Jitsi, protože A/V běží v cross-origin iframe. To je **nepřesné**: prázdný allowlist `()` znamená, že rodičovský dokument feature **nedeleguje žádnému** originu — vnořený iframe pak kameru/mikrofon nedostane ani s `allow` atributem. Bez opravy by hlas/video tiše selhaly.

**Fix:** delegovat na Jitsi origin v `default.conf.template` — `camera=(self "https://meet.jit.si")`, `microphone=(...)`, `display-capture=(...)`.

**Poučení:** agentní závěr o CSP/Permissions-Policy je **hypotéza, ne fakt** — u browser security policy ověř mechaniku (delegace feature do iframe vyžaduje origin v allowlistu rodiče). Stejný typ pasti jako CH-META (agentní TL;DR = hypotéza k ověření).

## CH-055 — Voice krčma visela na „Připojuji…": prejoin v skrytém iframe — 2026-07-05

**Oblast:** fe/jitsi. **Příznak cyklení:** „hlas se dlouho připojuje / nejde", tlačítko „Připojuji…" navždy.

Uživatel nahlásil, že se krčma nepřipojí. Konzole: `[app:conference-web] Clear the initialGUM promise! (prejoinVisible=true)` — Jitsi zobrazil **prejoin obrazovku** (kde se klikne „Připojit" + povolí mikrofon), ALE náš iframe byl během `connecting` schovaný (`visibility:hidden`, kryl ho lobby overlay). Uživatel prejoin nevidel → neměl kam kliknout → GUM (getUserMedia) promise se nikdy nedokončil → `videoConferenceJoined` nepřišel → věčné „Připojuji…".

Dvě propojené příčiny, obě moje:
1. **`prejoinPageEnabled: false` nezabral** — `meet.jit.si` (novější Jitsi) používá `prejoinConfig: { enabled: false }`; starý klíč ignoruje.
2. **Iframe skrytý během `connecting`** — `aria-hidden`/visibility jen na `!joined`, ale prejoin i permission prompt jsou vidět až po interakci → schované pod lobby overlayem.

**Fix:** (1) přidat `prejoinConfig.enabled:false` (+ ponechat starý klíč pro BC); (2) iframe viditelný když `joined || connecting`, lobby jen když `!joined && !connecting`, + neblokující hláška „povol mikrofon".

**Poučení:** u Jitsi iframe adaptéru **nikdy neskrývej iframe během připojování** — prejoin/permission prompt tam žije. Ověř aktuální config klíče (`prejoinConfig`, ne `prejoinPageEnabled`). `ERR_BLOCKED_BY_ADBLOCKER` na `amplitude.com` = jen Jitsi telemetrie, ne příčina. **Vyžádat konzoli byl správný krok** — `prejoinVisible=true` dalo diagnózu okamžitě (necyklit na CSP hypotéze bez dat).

## ✅ ŘEŠENÍ — 17.6 rozšíření: video+hlas do světového chatu + taktické mapy — 2026-07-05

**Co postaveno:** hovor i ve SVĚTĚ (chat + mapa), na přání uživatele (původní záměr). **Bez BE změn** — Jitsi řeší vše, room per svět.
- **Jeden hovor na svět** `ikaros-world-{worldId}` — sdílený chatem i mapou (připojíš se v chatu, jsi slyšet i na mapě).
- **Persistence přes navigaci** (mapa↔chat): `WorldVoiceHost` mountnutý ve `WorldLayout` **MIMO `<Outlet/>`** (přežije navigaci), `worldVoiceSessionAtom` (jotai, vzor `soundActivation.ts`) drží session; tlačítka v chatu/mapě jen togglují atom. Jitsi iframe žije v hostu → odchod ze stránky ho neodmountuje.
- `WorldVoiceButton` (📞 Phone/PhoneOff) v hlavičce světového chatu (`ChannelView`) + na mapě (`weatherSlot`). Skin-aware `--theme-*`.

**Proč správně:** persistence = klíč — `useVoice` dělá `dispose()` při unmountu, takže hostitel MUSÍ být stabilní (WorldLayout, ne stránka). Roster („kdo je v hovoru") vynechán = **0 BE změn** (`useVoicePresence` bere fixní `RoomKey`, per-svět by vyžadoval BE; Jitsi účastníky ukazuje sám). Reuse `useVoice` adaptéru → rozšíření bez duplikace.

**Ověřeno:** tsc ✓, voice eslint 0 errors, build ✓. Živý test = uživatel.

**⚠️ Pre-existing dluh (NE moje):** `TacticalMapView.tsx:712` react-compiler error „Compilation Skipped: Existing memoization could not be preserved" na fog `useMemo` (17.1) — nedotčeno mým editem (import + tlačítko), neblokuje `npm run build` (ten je tsc+vite, ne eslint).

**Follow-up:** badge „kdo je v hovoru" u tlačítka (chce BE voice presence per svět) · přesun/resize plovoucího hostu.
