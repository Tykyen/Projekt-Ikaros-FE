# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-01.

---

## Otevřené

> **2026-06-03 — bug audit:** Hloubková kontrola BE+FE (viz [`bug-audit.md`](bug-audit.md))
> našla **14 potvrzených nálezů** (N-1 až N-14). Hlavní: systémový FE↔BE contract drift
> (N-6: auth/account endpointy), chybějící WS gateways (N-4 friendship, N-5 presence),
> 3 bezpečnostní (N-7 members leak, N-8 room:join leak, N-9 sound spoof). Detaily, důkazy
> a návrhy řešení v `bug-audit.md`. Opraveno během auditu: N-1 (test mock), D-029 (PWA ikony).

### D-034 — Universe mapa GET filtruje i pro world PJ (jen globální role)
**Soubor:** `backend/src/modules/universe/universe.controller.ts` (`findByWorld`) + `universe.service.ts` (`findByWorld`)
**Problém:** GET `/api/universe` počítá `isPjOrAdmin` jen z **globální** role (`user.role <= UserRole.Admin`), nebere v potaz **world roli**. World PJ, který není globální Admin, tak dostane **filtrovanou** vesmírnou mapu (jen public uzly + ty, kde je v `visibleToPlayerIds`) místo všech. Pro editaci (FE edit mód potřebuje všechny uzly + spoje) by PJ neviděl/nemohl editovat skryté uzly.
**Dopad:** Střední — PJ editace universe mapy. Pravděpodobnost závisí na tom, zda FE edit mód nefetchuje jinak / zda PJ není vždy v `visibleToPlayerIds` — **ověřit reálné chování**.
**Řešení:** GET má přes `membershipRepo` zjistit i world PJ roli (vzor: `world-maps.service.canManage` ze spec 13.4 — global Admin+ NEBO world `>= PJ`), ne jen globální. Pak `findByWorld(..., isPjOrAdmin=true)` pro world PJ.
**Kdy:** Při příští práci na Mapě vesmíru / universe editaci. Nalezeno 2026-06-06 při implementaci spec 13.4 (Mapy atlas).

---

### D-033 — Vitest neběží: storybook addon-vitest projekt padá při načtení configu
**Soubor:** `vitest.config.ts` — druhý projekt `storybook` (`@storybook/addon-vitest` + `storybookTest({ configDir: .storybook })`)
**Problém:** `npx vitest run` skončí na `CriticalPresetLoadError` / `ERR_INTERNAL_ASSERTION: Unexpected module status 0. Cannot require() ES Module storybook/dist/core-server/index.js` (ESM/CJS race v `@chromatic-com/storybook` presetu). Chyba je při vyhodnocení configu, takže ji neobejde ani `--project` filtr → **nespustí se ani unit testy**. Pravděpodobně neúplně nainstalované storybook deps (souvisí s SSL npm install, viz `NODE_OPTIONS=--use-system-ca`) nebo verzový clash storybook × Node.
**Dopad:** Vysoký — standardní `vitest run` nejde spustit; ověření FE testů vyžaduje workaround (dočasný config bez storybook projektu). Riziko pro CI i ostatní vývojáře.
**Řešení:** Buď přeinstalovat/srovnat storybook deps (peer verze, `@chromatic-com/storybook`), nebo storybook test projekt z `vitest.config.ts` oddělit do samostatného configu (`vitest.storybook.config.ts`) a default `vitest run` nechat jen unit projekt.
**Kdy:** Před prvním ostrým CI během testů / při příští údržbě test infrastruktury.
**✅ Vyřešeno 2026-06-06:** Storybook projekt odebrán z `vitest.config.ts` → default `vitest run` = jen unit (storybook zůstává jako vizuální katalog přes `npm run storybook`). Odhalil se druhý, dosud maskovaný problém: při default discovery vitest auto-merguje root `vite.config.ts` a duplicitní `react()` plugin (v obou configech) rozbíjel test context (`Failed to find the current suite` → 0 testů). Fix: `vitest.config.ts` `react()` plugin NEuvádí (dědí z vite.config merge), `resolve.alias` ponechán. Ověřeno: `vitest run` = **327 souborů / 2499 testů zelené**. Pozn.: přes `-c <jméno>` problém nebyl (merge se chová jinak) — past při diagnostice.

---

### D-032 — Připnuté konverzace nejdou přehazovat drag&drop
**Soubor:** `src/features/world/chat/components/ChannelSidebar.tsx` — sekce „Připnuté" (`s.pinned`)
**Problém:** Připnuté konverzace se renderují plochým `.map` bez `DndContext`/`SortableContext`/handle, na rozdíl od kanálů a konverzací uvnitř kanálů (6.7b osobní reorder). Starý Matrix (`ChatSidebar.tsx`, `handlePinnedDrop`) reorder připnutých uměl (persist do `chatPreferences`).
**Dopad:** Nízký — UX nekonzistence: konverzace v kanálu jdou řadit, v sekci Připnuté ne.
**Řešení:** Obalit `pinnedChannels` do vlastního `DndContext`+`SortableContext`, přidat osobní pole `chatPinnedOrder` do `my-prefs` (nebo řadit dle pořadí připínání).
**Kdy:** Až bude prostor na doladění chat sidebaru; nízká priorita.

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
