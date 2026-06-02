# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-01.

---

## Otevřené

### D-076 — „Načíst přípravu" nepropojuje scénář ↔ vytvořenou scénu (mapSceneIds)
**Soubor:** FE `src/features/world/tactical-map/components/pj-panel/LoadPreparationDialog.tsx`
**Problém:** Po vytvoření scény ze scénáře se nedoplní `scenario.meta.mapSceneIds` o id nové scény (spec 11.2-ext C počítala s provázáním tam i zpět). Bez toho neexistuje navigace scénář→vytvořená scéna.
**Dopad:** Nízký — hlavní funkce (vytvoř scénu + podklad + entity) funguje; chybí jen zpětný odkaz.
**Řešení:** Po `apply` zapsat `mergeMeta(scenario, { mapSceneIds: [...stávající, created.id] })` přes campaign update (PUT scénáře) — pozor na read-merge-write contentData.
**Kdy:** Až bude potřeba navigace scénář↔scéna, nebo při dalším doladění Storyboardu.

---

---

## Odložené (čeká na trigger)

### D-NEW-chat-presence-scale — In-memory presence světového chatu × více instancí BE
**Soubory:** BE `chat/chat-presence.service.ts`
**Stav:** `ChatPresenceService` drží presence konverzací v `Map` v paměti procesu. Pro
single-instance BE (aktuální stav — žádné repliky, `SOCKET_IO_REDIS` vypnuté) je to
**správné rozhodnutí** — nulová latence, žádná infra závislost. Stejný vzor jako
in-memory rate-limiter (D-028).
**Trigger:** nasazení víc instancí BE (load balancer / horizontální scaling) — presence
by se mezi instancemi neviděla (BE-1 vidí jen své sockety, BE-2 své).
**Infra ready:** Redis je v projektu (`ioredis`, `@socket.io/redis-adapter`, RedisModule,
docker-compose), Socket.IO Redis adapter je opt-in přes `SOCKET_IO_REDIS=1` v
`backend/src/socket-io.adapter.ts`. Chybí jen migrace samotné presence z `Map` na Redis
hash (~8-16 h: refactor join/leave/list na ioredis hash/set + TTL cleanup + failover
fallback na Map + testy).
**Kdy:** Při přechodu na multi-instance BE. **Dělat dřív = mrtvý kód** pro neexistující infru.
