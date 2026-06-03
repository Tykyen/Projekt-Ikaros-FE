# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-01.

---

## Otevřené

### D-029 — PWA ikony jsou placeholder (favicon)
**Soubor:** `public/manifest.webmanifest` — 13.2c PWA push
**Problém:** Ikony pro `192x192` i `512x512` ukazují na `/favicon.webp`, který tu velikost reálně nemá. Instalace PWA funguje, ale ikona na ploše/launcheru bude rozmazaná a chybí dedikovaná `maskable` varianta.
**Dopad:** Nízký — kosmetika instalované appky, neblokuje push ani funkci.
**Řešení:** Vyrobit `icon-192.png` + `icon-512.png` (+ maskable s safe-zone paddingem) z brandového loga a zapsat je do manifestu.
**Kdy:** Před produkčním nasazením PWA (spolu s ostrým VAPID na serveru).

---

### D-030 — Správa push zařízení jen pro aktuální zařízení
**Soubor:** `src/features/notifications/api/usePush.ts`, `components/PushToggle.tsx` — 13.2c
**Problém:** `PushToggle` umí jen zapnout/vypnout push na **právě používaném** zařízení. Roadmapa 13.2d chtěla „uživatel vidí svá zařízení / subscriptions a může je odebrat" — to chybí, protože BE `push` modul nemá endpoint pro výpis subscriptions uživatele (jen subscribe/unsubscribe dle endpointu).
**Dopad:** Nízký — hlavní use-case (zapnout na svém zařízení) funguje; chybí jen přehled/úklid cizích zařízení.
**Řešení:** BE `GET /push/subscriptions` (vlastní, bez endpointů jiných uživatelů) + FE seznam s tlačítkem „Odhlásit zařízení". Volitelně metadata (user-agent, datum) pro rozlišení.
**Kdy:** Až bude push reálně nasazený a uživatelé budou mít víc zařízení.

---

<!--
  Vyřešeno 2026-06-03 (13.1 search):
  - D-NEW-global-search-access-leak → opraveno: search vyžaduje worldId +
    access check (worldsService.findByIdForRequester, 404 u cizího privátního
    světa); mutační search/stats endpointy dostaly AdminGuard.
  - D-NEW-search-index-monitoring → implementováno: admin tab „Search index"
    (/admin?tab=search-index) — stav indexace + rebuild.
-->

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
