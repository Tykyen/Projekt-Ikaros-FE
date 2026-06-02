# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-01.

---

## Otevřené

### D-074 — EmbeddingSearchService padá při initu ONNX modelů
**Soubor:** BE `src/modules/search/model-runtime.ts:35` — `ModelRuntime.initialize`, voláno z `embedding-search.service.ts:90` (`onModuleInit`)
**Problém:** Při startu BE hází `TypeError: Ctor is not a constructor` pro každý model (granite-107, granite-278, …). Embedding/search se neinicializuje. Chyba je odchycená (BE doběhne a port 3000 naběhne), ale sémantické vyhledávání nefunguje. Pravděpodobně nekompatibilní verze / špatný import konstruktoru `onnxruntime-node` nebo `@xenova/transformers` (CJS/ESM default export).
**Dopad:** Střední — BE běží, ale search/embedding feature je mrtvá; log se plní chybami při každém startu.
**Řešení:** Ověřit verzi a způsob importu ONNX/transformers v `model-runtime.ts:35` (default vs named export, `new` na něčem co není třída). Porovnat s funkční verzí v package-lock.
**Kdy:** Před prací na vyhledávání / když je potřeba embedding search.

---

### D-075 — Redis ECONNREFUSED spamuje log při startu BE
**Soubor:** BE — `ioredis` klient (RedisModule / socket-io.adapter)
**Problém:** Při startu se `ioredis` opakovaně pokouší připojit na Redis a hází `AggregateError [ECONNREFUSED]` / `[Redis] connection error` ve smyčce. V dev dockeru běží jen `matrix-mongodb-dev`, Redis container ne. Nefatální (BE běží), ale zaplavuje log a vypíná funkce závislé na Redis.
**Dopad:** Nízký — dev setup; v single-instance režimu je Redis stejně opt-in (viz D-NEW-chat-presence-scale, `SOCKET_IO_REDIS`).
**Řešení:** Buď spustit Redis v docker-compose pro dev, nebo zajistit, aby se klient bez `SOCKET_IO_REDIS`/konfigurace vůbec nepřipojoval (lazy/guard) a netočil reconnect smyčku.
**Kdy:** Až bude vadit šum v logu, nebo při zavádění Redis-závislých funkcí.

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
