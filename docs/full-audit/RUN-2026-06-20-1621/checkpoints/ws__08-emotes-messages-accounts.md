# ws / 08-emotes-messages-accounts — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem veškerý kód v záběru oblasti 08:

**BE:**
- `emotes.gateway.ts` — plný čtení
- `emotes.service.ts` — event emity (created/deleted/updated), CreatedBy/WorldId routing
- `custom-emote.interface.ts` — payload shape
- `ikaros-messages.gateway.ts` — plný čtení vč. handleConnection
- `character-accounts.gateway.ts` — plný čtení
- `character-accounts.service.ts` — transfer flow, event payload, fallback path

**FE:**
- `useWorldEmotes.ts` — listenery, filtr `emote.worldId === worldId`, WS events
- `useGlobalEmotes.ts` — listenery `-global` varianty
- `useMail.ts` → `useUnreadCount` — `ikaros:new-message` bez system filtru
- `useEvents.ts` — `ikaros:new-message` s `system` filtrem
- `useAccountTransferNotifications.ts` — payload parita, cache invalidace, reconnect
- `WorldEmotesAdminPage.tsx` + `IkarosEmotesAdminPage.tsx` — room join kontext
- `WorldSettingsPage.tsx`, `router.tsx`, `WorldLayout.tsx` — routing kontext
- `useWorldSocket.ts` — vlastník `world:{id}` room join + reconnect

**Navíc (mimo plán, nalezeny):**
- `ikaros-events.gateway.ts`, `ikaros-news.gateway.ts`, `bestiae.gateway.ts`, `users-identity.gateway.ts` — 4 nové gateways nezmíněné v plánu oblasti

## Dosažená L vs cílová L

| Bod | Cílová L | Dosažená L | Poznámka |
|-----|----------|------------|----------|
| EMA-01 (world vs global routing) | L2 | L2 ✅ | ověřeno staticky |
| EMA-02 (worldId filtr FE) | L2 | L2 ✅ | filtr sedí, payload nese worldId |
| EMA-03 (deleted/updated payload) | L2 | L2 ✅ | `{emoteId}` / celý emote |
| EMA-04 (global -global events) | L2 | L2 ✅ | routing čistý |
| EMA-05 (admin stránka room join) | L2 | L2 ✅ **STAV STALE** | opraveno W-9 fix, plan stále ⚠️ |
| EMA-06 (test gap) | L4 | L1 | gap trvá, testy chybí |
| EMA-07 (ikaros:new-message payload+system) | L2 | L2 ✅ | `system` propagován |
| EMA-08 (dvě větve mail vs events) | L2 | L2 ✅ | separace funguje |
| EMA-09 (dvojí handler) | L2 | L2 ✅ | ověřeno oblast 09 |
| EMA-10 (user room JWT tolerantní) | L1 | L1 ✅ | bez JWT tiše bez roomu |
| EMA-11 (actionType enum) | — | ✅ | actionType se neemituje, bezpředmětné |
| EMA-12 (account payload parita) | L1 | L2 ✅ | klíče sedí přesně |
| EMA-13 (co-owner fan-out) | L3 | L2 | bez testu |
| EMA-14 (amount/currency formát) | L2 | L2 ✅ | kód měny, FE zobrazuje správně |
| EMA-15 (odesílatel bez notifikace) | L1 | L2 ✅ | `to.ownerCharacterIds` = jen příjemci |

**Nové nálezy mimo plan:** L2 statika.

## Nálezy

### W-RUN-01 — [LK] `emote:created/updated` posílá plný `CustomEmote` (createdBy, imageId) do `world:{id}` bez membership check · 🆕

- **Kde:** `emotes.gateway.ts:19,47` — `emit('emote:created', payload.emote)` = celý `CustomEmote`
- **Kontext:** Room `world:{id}` nemá membership gate (AppGateway:35–43, komentář „N-8 accepted risk").  
  Kdokoli může joinout `world:{worldId}` a vidět WS frame s `createdBy` (userId tvůrce, platformová identita) a `imageId` (Cloudinary publicId).  
  REST endpoint `/emotes/:worldId` je chráněn `assertIsMember` → WS bypass N-8.
- **Dopad:** Nízký. `createdBy` = userId (ne jméno, ne email), `imageId` = interní Cloudinary asset ID. Nelze přímo zneužít bez dalšího přístupu k Cloudinary. Konzistentní s N-8 přijatým rizikem, ale formálně porušuje leak-safe vzor W-4 (potvrzený pro `chat:channel:created`).
- **Návrh:** a) Přijmout jako rozšíření N-8 (emoty = kosmetika, `createdBy`/`imageId` nejsou autentizační data). b) Nebo zredukovat payload na `{ emoteId, worldId }` signál + FE refetch, sjednocení se vzorem W-4. Rozhodnutí potřebuje souhlas.
- **L1** · 🆕

---

### W-RUN-02 — [LC] `useWorldEmotes` a `useGlobalEmotes` chybí `useSocketReconnect` → stale cache po výpadku WS · 🆕

- **Kde:** `useWorldEmotes.ts` (celý soubor bez reconnect), `useGlobalEmotes.ts` (celý soubor bez reconnect). `staleTime: 5 * 60 * 1000` (5 min).
- **Dopad:** Po WS reconnectu (výpadek sítě, uspaná záložka) se emote cache neinvaliduje. Emoty přidané/smazané během výpadku nebudou viditelné až 5 minut. Uživatel v chatu vidí neexistující emoty nebo mu chybí nové. Srovnání: `useIkarosNews.ts:29` a `useChatFeed.ts:52` mají reconnect refetch, emoty ne.
- **Návrh:** Přidat `useSocketReconnect(() => { void qc.invalidateQueries({ queryKey: emoteKeys.world(worldId) }); })` do `useWorldEmotes` a analogicky pro global.
- **L1** · 🆕

---

### W-RUN-03 — [RM] Plan EMA-05 stav stale: `⚠️` po opravě W-9 by mělo být `✅L2` · 🆕

- **Kde:** `docs/ws-contract-plan/08-emotes-messages-accounts.md:18` — EMA-05 stále označeno `⚠️`
- **Realita:** `WorldEmotesAdminPage` je tab v `WorldSettingsPage` (route `/svet/:worldSlug/nastaveni`), obaleno `WorldLayout` → `useWorldSocket(worldId)` joinne `world:{id}` + reconnect re-join (W-9 fix). Admin stránka eventy dostane správně.
- **Dopad:** Zavádějící stav v plánu → zbytečný dluh/todo v repair fázi.
- **Návrh:** Aktualizovat EMA-05 v plánu na `✅L2` s odkazem na W-9.
- **L2** · ♻️

---

### W-RUN-04 — [EX] 4 nové gateways zcela mimo WS contract plán (oblast 09 inventura zastaralá) · 🆕

- **Kde:**
  - `ikaros-events.gateway.ts` → emit `ikaros:events:changed` broadcast → FE `useIkarosEvents.ts:14`
  - `ikaros-news.gateway.ts` → emit `ikaros:news:changed` broadcast → FE `useIkarosNews.ts:24`
  - `bestiae.gateway.ts` → emit `bestiar:changed` (3-scope: broadcast/world/user) → FE `useBestiar.ts:20`
  - `users-identity.gateway.ts` → emit `user:identity:changed` do `user:{id}` → FE `useFriendshipsSocket.ts:81`
- **Dopad:** Žádný aktivní bug nalezen (statika L1 prohlídkou FE listenerů — vše má párový listener), ale tyto gateways neprošly systematickým auditem (payload parita, room targeting, leak-safe, reconnect). Celkový inventář plánu je neúplný.
- **Návrh:** Přidat oblast 10 (nebo rozšíření 08) pro `IkarosEvents + IkarosNews + Bestiae + UsersIdentity` gateway. Alternativně: zahrnout do dalšího průchodu.
- **L1** · 🆕

---

### W-RUN-05 — [EX] Test gap: žádný ze tří gatewayů (Emotes, IkarosMessages, CharacterAccounts) nemá test · ♻️

- **Kde:** BE: žádný `*.gateway.spec.ts` pro dané moduly; FE: žádný test pro `useWorldEmotes`/`useGlobalEmotes`/`useAccountTransferNotifications`
- **Dopad:** Tichý drift payloadu (např. změna `createdBy` klíče v rozhraní) se nechytí. Transfer-received fan-out logika (N co-owners) netestována round-tripem.
- **Návrh:** Gap-fill M7/M8 podle plánu oblasti (EMA-06, EMA-13). Priorita: `ikaros-messages.gateway.ts` (system flag oddělení) a `character-accounts.gateway.ts` (co-owner fan-out).
- **L1** · ♻️ (totožné s EMA-06 plánem, trvá)

## PROOF-REQUEST

| # | Co ověřit | Proč nelze staticky |
|---|-----------|---------------------|
| PR-1 | Spustit `npm run audit:ws` a ověřit, že `ikaros:events:changed`, `ikaros:news:changed`, `bestiar:changed`, `user:identity:changed` jsou v paritě (všechny emitované eventy mají FE listener) | Nová gateways, statika L1 prohlídkou, ale bez nástroje |
| PR-2 | Ověřit, že po WS reconnectu (`socket.disconnect()` + opětovné připojení) se emote cache invaliduje — i bez W-RUN-02 opravy je `staleTime` 5min, ale refetch po reconnectu by byl žádoucí | Vyžaduje live socket + síťový výpadek |
| PR-3 | Ověřit, že transfer `account:transfer:received` dorazí správně při N>1 co-owners (fan-out) — gateway dělá async loop přes `recipientCharacterIds` s `findById`, riziko race nebo chybějícího userId pro NPC | Vyžaduje live BE + MongoDB |
