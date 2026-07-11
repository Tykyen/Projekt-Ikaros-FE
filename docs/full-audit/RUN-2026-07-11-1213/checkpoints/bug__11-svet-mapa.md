# bug__11-svet-mapa — dosažená L2 (agregát ze 4 sub-agentů mapy)

Hlavní agent selhal na zápisu (sub-fanoval), nálezy agregovány ručně z: BE maps service+gateway, FE tactical-map hooks/utils, dungeon+schema+token-panel (2×).

## 🔴/⭐ nálezy
- **N-TM-01 / S-RUN-07** 🔴 (FE) — `hooks/useMapSocket.ts:72-175` + useActiveScenes/useReassignmentListener/useMapWeather: raw `getSocket().on()` bez `socketStatusAtom` v deps → po `reconnectSocket()` (toggle Neviditelný v Soukromí `PrivacySection:28`, login/logout `useAuth:58/85/112`) listenery osiří na mrtvé instanci; useMapSocket ztratí i `connect` re-join → mapa tiše OSLEPNE do F5. Fix: `useSocketEvent`/přidat socketStatusAtom (vzor usePresence S-RUN-04).
- **N-TM-03 / S-RUN-08** 🟡/🔴 (FE) — `useMapScene.onOperation:169` aplikuje op na closure `scene` ne čerstvou cache → 2+ ops/tick = op zahozena, seq souvislý → tichá trvalá divergence. Fix: `queryClient.getQueryData` (vzor diceMutation.onMutate tamtéž).
- **N-A1** ⭐ (BE) — `maps.gateway.ts:145`/`world-operations.service.ts:175` reassign/unassign/scene-deactivate NEvolá `socket.leave(oldScene)` → přesunutý hráč dál dostává `map:operation` staré scény (privacy leak; join-gate vs runtime asymetrie). Fix: `socketsLeave(oldSceneId)` v emitReassigned.
- **N-A6** ⭐ (BE) — `maps.service.ts:423` enrichTokens posílá HP/customData/diaryData všem bez ohledu na `config.showHpPc/Npc/Bestie` → skryté HP (bestie) čitelné z payloadu; showHp je jen FE gate. Fix: server-side filtr HP dle config+isNpc pro ne-PJ.
- **DUN-1** 🟠 (BE) — `map-operations.service.ts:1362,1397` čte `world.system` RAW; registry klíčuje canonical (`schema-registry:63`) → pro alias-systémy (drd-plus/draci-hlidka/call-of-cthulhu/vlastni + legacy dnd/pribehy) lookup null → soft-skip → token systemStats validace tiše VYPNUTÁ (4/14 systémů). PJ-scoped (hráč zápis systemStats nemá — authorizer:151), ne exploit; PJ může uložit malformed → PIXI render crash. Fix: BE mirror `resolveSystemId` (SYSTEM_ALIASES) před registry.get; sjednotit s system-presets (2 kopie).

## ⭐/🟡 další (BE, z N-A2..A7, DUN-2/3)
- N-A2 map:join-world práh PJ(5) vs REST world-log/ops PomocnyPJ(4) → REST/WS split.
- N-A3 GET /worlds/:id/operations vždy lastSeqNumber:0 (worlds.repository toEntity nemapuje) → FE cursor rozjezd.
- N-A4/A5 bulk RC-D6 rollback nuluje currentSceneId všem místo obnovy + cascade token.remove nerevertován (data-lossy).
- N-A7 maps.service.replace enrichTokens(updated!) → 500 při souběžném smazání scény (non-null assertion).
- N-TM-05 buildBestieToken armor/injury/initBase bez Number()/isFinite → string/NaN.
- N-TM-06 findFirstFreeHex vrací obsazený start při saturaci.
- DUN-2 bestiae stejný raw-systemId vzor. DUN-3 dungeon exportTemplate zahazuje tokens/fog/effects (export = no-op).
- token viewMode (tokenViewMode.ts) mrtvý → hráč vidí plný statblok cizích tokenů (TokenSystemSheet read-only, info leak).

## Fix status: HP clamp+viewability, socket-swap listener, DUN-1 alias resolver = kandidáti na fix. Ostatní → dluhy/report.
