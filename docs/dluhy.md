# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-01.

---

## Otevřené

### D-029 — Page.type diakritický drift „Ostatní" vs „Ostatni" (matrix svět)
**Soubor:** matrix svět, kolekce `pages` (data, ne kód) — odhaleno při F7 dry-run (`Page.type` distribuce)
**Problém:** `type:Lokace` ✓, ale `type` má dvě varianty bez/s diakritikou: `"Ostatní"` (1035) i `"Ostatni"` (45). Drift z migrace F4 (mapování starého `type` enumu).
**Dopad:** Nízký–Střední — stránky s `"Ostatni"` mohou být nekonzistentně filtrované/zobrazené proti kanonickému `"Ostatní"` (např. menu, search facety, type-based dotazy).
**Řešení:** Jednorázový mongosh update `db.pages.updateMany({type:"Ostatni"},{$set:{type:"Ostatní"}})` ve worldu matrix; ověřit, že FE/BE nikde nepíše „Ostatni" bez diakritiky.
**Kdy:** Při dalším migračním úklidu matrix světa (mimo F7 scope).

---

### D-NEW-shop-purchase-atomicity — Nákup v obchodě bez Mongo transakce
**Soubory:** BE `campaign/services/campaign-purchase.service.ts` (`purchase` / `refund`)
**Problém:** Nákup mění dva nezávislé subdokumenty — `CharacterInventory` (přidání položky)
a `CharacterAccount` (odečet přes `adjust`). Není to v Mongo session/transakci. Pořadí je
(1) inventář → (2) odečet z účtu; při selhání kroku 2 se inventář kompenzuje (odebrání
položky). Pokud ale selže i kompenzace (např. DB výpadek mezi tím), zůstane položka ve
vybavení bez zaplacení. Storno navíc odebírá položku z inventáře **tolerantně** — když ji
hráč mezitím ručně smazal, peníze se vrátí, ale nesoulad (vrácená věc, kterou hráč už
nemá) se nikam nezaznamená.
**Dopad:** Nízký — okno selhání je úzké (single-instance BE, rychlá kompenzace), částka i
položka dohledatelné v `CampaignPurchase` logu. Pro reálnou hru postačuje.
**Řešení:** Až bude replica set jistě dostupný, zabalit `purchase`/`refund` do
`session.withTransaction()` (vzor `character-accounts.service.transfer`). Případně doplnit
audit záznam při tolerantním refundu chybějící položky.
**Kdy:** Při přechodu na replica set / multi-instance BE, nebo když se objeví reálný
půlnákup v provozu.

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
