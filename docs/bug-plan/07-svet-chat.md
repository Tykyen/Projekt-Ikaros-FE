# 07 — Svět: chat, kostky, zvuky, emoty

Pokrývá celý real-time komunikační stack světového chatu — strukturu kanálů/konverzací, zprávy, presence, mentions, dice (3D overlay, Fate, pool, d100), sound broadcast přes WS, per-svět emoty a jejich administraci.

**BE:** `chat` (controller, gateway, service, presence service, scheduled-messages, repositories ×4, schemas ×5), `sounds` (controller, world controller, service, repository), `emotes` (controller, gateway, service, repository)  
**FE:** `features/world/chat` (WorldChatRoom, ChannelSidebar, ChannelGroup, ChannelItem, ChannelView, ChannelComposer, MessageEditInline, MentionAutocomplete, GroupColorPicker/IconPicker, AppearancePopover, ChatSearchModal, SoundBroadcastButton, SoundNowPlayingBanner; dice/; emotes/; api/, lib/), `features/world/sounds`, stránky `/svet/:slug/chat`, `/svet/:slug/zvuky`, `/svet/:slug/admin/emotes`

> **Terminologie reminder:** v FE UI „kanál" = BE `ChatGroup` (sbalovací kontejner), „konverzace" = BE `ChatChannel` (chatovací místnost). Toto je úmyslná inverze oproti BE názvům.

---

## A. Kanály & konverzace (struktura, CRUD, reorder)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SC-01 | `GET /worlds/:id/chat/groups` vrátí skupiny + kanály filtrované dle přístupu (hráč nevidí `accessMode:'roles'` kanál bez role, PJ vidí vše) `[auto]` | M3 | ⬜ |
| SC-02 | Lazy seed (krok 6.1g): svět bez chat skupin dostane výchozí sadu při prvním `GET groups` — idempotentní při vícenásobném volání `[auto]` | M3 | ⬜ |
| SC-03 | Nová světová družina (`customGroups`) → `world.settings.updated` event → `syncWorldGroupChannels` → auto-kanál ve stejném světě `[auto]` | M3 | ⬜ |
| SC-04 | `ChatGroup.toEntity` v `MongoChatGroupRepository` vrátí všechna pole (`color`, `iconKey`, `linkedWorldGroup`, `imageUrl`) — field drift check `[auto]` | M2 | ⬜ |
| SC-05 | `ChatChannel.toEntity` v `MongoChatChannelRepository` vrátí všechna pole (`imageUrl`, `lastMessagePreview`, `type`) — field drift v 5 místech: schema / DTO / service / toEntity / FE typ `[auto]` | M2 | ⬜ |
| SC-06 | FE typ `ChatChannel` (`lib/types.ts`) je v sync s BE `ChatChannel` interface — žádné chybějící ani přebytečné optional pole `[human]` | M2 | ⬜ |
| SC-07 | FE typ `ChatGroup` (`lib/types.ts`) obsahuje `color`, `iconKey`, `linkedWorldGroup` (všechna nepovinná pole z BE schema) `[auto]` | M2 | ⬜ |
| SC-08 | Vytvoření kanálu (POST groups) — `403` pro Hráče, `201` pro PomocnyPJ+ `[auto]` | M3 | ⬜ |
| SC-09 | Smazání skupiny (DELETE groups/:id) kaskádně soft-deleteuje zprávy + emituje `chat.channel.deleted` pro každý kanál ve skupině `[auto]` | M3 | ⬜ |
| SC-10 | Reorder skupin (POST groups/reorder): odmítne cizí `groupId` s `INVALID_GROUP_ID` (400) `[auto]` | M3 | ⬜ |
| SC-11 | Reorder konverzací (POST channels/reorder): odmítne mix více skupin s `MIXED_GROUPS` (400) `[auto]` | M3 | ⬜ |
| SC-12 | WS event `chat:group:created` přijde do `world:{id}` roome — FE invaliduje skupiny cache `[auto]` | M5 | ⬜ |
| SC-13 | WS event `chat:groups:reordered` a `chat:channels:reordered` — FE invaliduje skupiny a ostatní klienti vidí nové pořadí bez refreshe `[auto]` | M5 | ⬜ |
| SC-14 | Přesun konverzace mezi skupinami (PATCH channels/:id `{groupId}`) odmítne přesun do skupiny jiného světa (`403 CHAT_FORBIDDEN`) `[auto]` | M3 | ⬜ |
| SC-15 | Membership sync — odebrání člena ze světa (`world.membership.removed`) odebere userId ze `allowedMemberIds` všech `linkedWorldGroup` kanálů `[auto]` | M3 | ⬜ |
| SC-16 | `GroupColorPicker` + `GroupIconPicker` na FE — změna barvy/ikony skupiny se uloží a zobrazí bez refreshe pro všechny klienty (přes WS `chat:group:updated`) `[human]` | M5 | ⬜ |

---

## B. Zprávy (odeslání, edit, smazání, mentions, whisper, reactions)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SC-17 | Odeslání zprávy ověří přístup (`hasChannelAccess`) — hráč bez přístupu k `accessMode:'roles'` konverzaci dostane `403` `[auto]` | M3 | ⬜ |
| SC-18 | Idempotentní retry (6.2h) — dvě odeslání se stejným `clientNonce` vrátí tutéž zprávu (sparse unique index `{channelId, clientNonce}`) `[auto]` | M3 | ⬜ |
| SC-19 | Optimistic send na FE (`useOptimisticSend`) — zpráva se zobrazí okamžitě se statusem `pending`; po WS echu se dedupuje dle `clientNonce` (nonce match swap) `[auto]` | M3 | ⬜ |
| SC-20 | Retry selhané zprávy (`_status: 'failed'`) znovu odešle stejný `clientNonce` → BE vrátí existující zprávu (idempotence), žádný duplikát `[auto]` | M3 | ⬜ |
| SC-21 | Mention `@username` — BE extrahuje tokeny z content, resolvuje userId přes `usersRepo.findByUsernames` + `membershipRepo.findByCharacterPathsAndWorld` (2-fázový resolve) `[auto]` | M3 | ⬜ |
| SC-22 | `@all` / `@here` — BE přidá do `mentions[]` všechny příjemce kanálu (resolveChannelRecipients); hráč bez přístupu není v listu `[auto]` | M3 | ⬜ |
| SC-23 | Mention sidebar dot — `mentionCount > 0` → červený dot v `ChannelItem`; `applyUnreadEvent` zachovává `prevMention` pro increment eventy (BE neposílá mentionCount u `-1`) `[auto]` | M3 | ⬜ |
| SC-24 | Whisper (visibleTo) — jiný hráč bez přístupu nevidí zprávu ani v historii, ani přes WS echo (gateway emituje jen do `user:{id}` roomů příjemců) `[auto]` | M5 | ⬜ |
| SC-25 | Edit zprávy — Hráč může editovat jen vlastní, PJ cokoliv; `isDiceRoll: true` blokuje edit (`CHAT_DICE_NOT_EDITABLE`) `[auto]` | M3 | ⬜ |
| SC-26 | Smazání zprávy — Hráč pouze vlastní (non-dice), PJ/Admin cokoliv; hod kostkou může mazat jen PomocnyPJ+ nebo Admin `[auto]` | M3 | ⬜ |
| SC-27 | Soft delete — smazaná zpráva dostane `isDeleted: true`, content `'*Zpráva byla smazána autorem*'`; WS `chat:message:deleted` dorazí všem v roome a FE aktualizuje lokální cache `[auto]` | M5 | ⬜ |
| SC-28 | NPC override mód (overrideName/overrideAvatarUrl) — jen PomocnyPJ+; hráč dostane `403 CHAT_NPC_FORBIDDEN` `[auto]` | M4 | ⬜ |
| SC-29 | `lastMessagePreview` se aktualizuje při každém novém odeslání — attachment-only zpráva dostane text `'📎 Příloha'`, ne prázdný řetězec `[auto]` | M3 | ⬜ |
| SC-30 | Emoji reakce (PUT reactions/:emoji) — toggleje; access check na kanál; WS `chat:message:updated` s aktualizovanou zprávou `[auto]` | M3 | ⬜ |
| SC-31 | Unread badge — `broadcastUnreadUpdate` odbroadcastne sentinel `-1` (increment) pouze členům s přístupem k danému `accessMode`; Žadatel je vyloučen `[auto]` | M3 | ⬜ |
| SC-32 | `markAsRead` aktualizuje `lastReadMessageId` na poslední zprávu kanálu, emituje `chat.unread.updated { count: 0 }` → `chat:unread` na FE; FE okamžitě vynuluje badge bez čekání `[auto]` | M5 | ⬜ |
| SC-33 | Cursor-based paginace zpráv (`before=<id>`, `limit`) — BE vrátí max 100, FE HISTORY_LIMIT=50; zprávy jsou řazeny chronologicky (reversal po `.sort({_id:-1})`) `[auto]` | M3 | ✅ FE tlačítko „Zobrazit starší" (2026-07-09, spec-6.1-followup) — BE už hotové, FE donačítá přes `useLoadOlderMessages` + prepend |
| SC-34 | MentionAutocomplete na FE — při `@` v composeru se zobrazí nabídka členů světa; klik vloží `@username` do textarey `[human]` | M1 | ⬜ |
| SC-35 | Hledání (`GET chat/search?q=`) — min. 2 znaky, max. 50 výsledků; PomocnyPJ+ vidí i whispery cizích; hráč jen veřejné + vlastní whispery `[auto]` | M3 | ⬜ |
| SC-36 | ChatSearchModal na FE — otevření, zadání dotazu, klik na výsledek přepne aktivní konverzaci a modal se zavře `[human]` | M1 | ⬜ |
| SC-37 | Přílohy (upload POST chat/upload) — member-only guard; max 10 MB; FE validuje MIME před uploadem (`classifyFile`); BE `MulterExceptionFilter` chytá překročení limitu `[auto]` | M4 | ⬜ |
| SC-38 | Tombstone info (`senderIsDeleted`) — batch enrich přes `UsersService.findManyTombstoneInfo` (60s cache); smazaný uživatel má overlay v MessageItem `[auto]` | M2 | ⬜ |

---

## C. Presence & typing

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SC-39 | Presence join — `chat:channel:join` emit na WS od FE při otevření konverzace; BE ověří roli přes `resolveChannelPresenceRole`, uložní do in-memory mapy `[auto]` | M5 | ⬜ |
| SC-40 | Presence leave — `handleDisconnect` odebere socket ze všech kanálů a broadcastne `chat:presence { action:'leave' }` jen pokud uživateli nezůstal jiný socket (multi-tab safe) `[auto]` | M5 | ⬜ |
| SC-41 | JWT z WS handshake → `handleConnection` joinne `user:{id}` room (11.2-ext fix); bez tokenu tiché projití (neautentizovaný socket nedostane per-user eventy) `[auto]` | M5 | ⬜ |
| SC-42 | ChatPresenceService (in-memory) — `list(channelId)` vrátí dedup unikátní uživatele (ne per-socket); `leaveAll` korektně čistí mapy kanálů s 0 sockety `[auto]` | M3 | ⬜ |
| SC-43 | Typing indicator — `typing:start` → BE broadcastne `chat:typing { isTyping: true }` ostatním v roome; auto-stop timeout 5s; `typing:stop` clearuje timeout a emituje `isTyping: false` `[auto]` | M5 | ⬜ |
| SC-44 | FE typing guard — vlastní username filtrováno (`if e.characterName === currentUser.username return`) takže vlastní psaní se v listu neobjeví `[auto]` | M1 | ⬜ |
| SC-45 | Přítomní panel — jen PJ+ (`canManage`); `ChannelMemberPanel` dostane live `presence` array; badge na Users ikoně zobrazuje počet i při zavřeném panelu `[human]` | M4 | ⬜ |

---

## D. Kostky (dice)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SC-46 | `rollFate` — 4 kostky z {−1, 0, +1}; `sum` je součet; `symbols` správné (`[+]`,`[-]`,`[ ]`); testováno deterministicky s crypto mock `[auto]` | M3 | ⬜ |
| SC-47 | `rollGenericDice('d100')` — `tens=0, ones=0` → `sum=100`; jinak `tens+ones` (např. 30+7=37); `rolls` jsou `[tens, ones]` `[auto]` | M3 | ⬜ |
| SC-48 | Fate plus/mínus mapping regrese (I4) — `facePlusImg` odkazuje na `_plus` asset, `faceMinusImg` na `_minus` (žádné prohození); `FATE_TARGETS['+']` ry=0, `FATE_TARGETS['-']` ry=180 (protilehlé tváře) `[auto]` | M3 | ⬜ |
| SC-49 | `buildFatePayload` — modifier se přičte k sum → total; `overpressure` se spočítá z total (ne sum); `total >= 7` → nenull `[auto]` | M3 | ⬜ |
| SC-50 | `parseDicePayload` defensive parse — nevalidní objekt (chybí `type`/`faces`/`sum`/`total`) vrátí `null` → `DiceMessage` renderuje `DiceMessageFallback` bez pádu UI `[auto]` | M3 | ⬜ |
| SC-51 | `isDiceRoll` flag — BE nastaví `true` pokud DTO obsahuje `dicePayload` NEBO content matchuje DICE_REGEX (fallback pro legacy zprávy bez payloadu) `[auto]` | M2 | ⬜ |
| SC-52 | `diceSkin` je uložen do zprávy a vrácen v `toEntity` — ostatní klienti vidí skin odesílatele (ne svůj vlastní) `[auto]` | M2 | ⬜ |
| SC-53 | `DiceRollOverlay` — live animace pouze pro čerstvé hody (`isFreshRoll` = createdAt < 10s); starší zprávy v historii zobrazí settled state bez animace `[auto]` | M1 | ⬜ |
| SC-54 | `secureRandomInt` rejection sampling — hodnoty nad limit (2^32 − 2^32%max) se zahodí a samplinguje se znovu; bez modulo bias pro RPG hody `[auto]` | M3 | ⬜ |
| SC-55 | Pool hod (`pool-dN`) a Mixed hod — `rollPool` vrátí `type: 'pool-d${sides}'`; `rollMixedDice` vrátí `faceTypes[]` stejné délky jako `rolls[]` `[auto]` | M3 | ⬜ |
| SC-56 | Retry selhané zprávy s dice payload — `useOptimisticSend.retry` NEpropaguje `dicePayload`/`diceSkin` (vynecháno z retry payload objektu) — potenciální silent bug při retry dice zprávy `[human]` | M2 | ⬜ |

---

## E. Zvuky (sound broadcast + databáze)

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SC-57 | WS `sound:play` → BE ověří roli přes `resolveChannelPresenceRole` (>= PomocnyPJ); neautorizovaný emit tiše ignorován (no error, no broadcast) `[auto]` | M5 | ⬜ |
| SC-58 | BE bezpečnostní poznámka: `userId` v `sound:play` payloadu bere se z klientského payloadu (jako u presence) — teoretický spoofing; ne JWT-ověřený (komentář v kódu); ověřit zda je to akceptovatelné riziko `[human]` | M4 | ⬜ |
| SC-59 | WS `chat:sound:playing` dorazí všem v `chat:{channelId}` roome (včetně PJ samotného); FE filtruje dle `channelId` v eventu `[auto]` | M5 | ⬜ |
| SC-60 | `SoundNowPlayingBanner` — přehraje YT po aktivaci uživatelem (autoplay gate); bez aktivace zobrazí „Aktivovat zvuk" místo EQ animace `[human]` | M1 | ⬜ |
| SC-61 | Přepnutí konverzace → cleanup `useEffect` zastaví přehrávač (`player.stop()`); nová konverzace bez `chat:sound:playing` nestartuje zvuk automaticky `[auto]` | M1 | ⬜ |
| SC-62 | `extractYoutubeId` — nevalidní URL vrátí null a tlačítko Play je disabled; validní YT URL (youtube.com/watch?v=, youtu.be/, embed/) extrahovává ID korektně `[auto]` | M1 | ⬜ |
| SC-63 | Zvuková databáze světa — `SoundBroadcastButton` načte `useWorldSounds` jen když je popover otevřen (`open ? worldId : null`) — no-op fetch při zavřeném popoveru `[auto]` | M1 | ⬜ |
| SC-64 | Nomináce zvuku do globální DB — duplicate check dle URL nebo jména (case-insensitive regex); zamítnutí `ConflictException` `[auto]` | M3 | ⬜ |
| SC-65 | Schválení/odmítnutí nominace — jen `status:'pending'` záznamy; `approveNomination` nastaví `status:'active'`, `rejectNomination` `status:'rejected'` s důvodem `[auto]` | M3 | ⬜ |

---

## F. Emoty

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SC-66 | `CustomEmotes.toEntity` mapper — vrátí `tags` (defaultuje na `[]` pokud není v doc), `worldId` jako string nebo null; žádné pole neschází `[auto]` | M2 | ⬜ |
| SC-67 | Vytvoření emotu — shortcode collision check v scope (world nebo global); limit 100/svět a 200/globálně → `EMOTE_LIMIT_REACHED` (409) `[auto]` | M3 | ⬜ |
| SC-68 | Update emotu — `imageId` a `imageUrl` musí být aktualizovány jako pár (oba nebo žádný) → `EMOTE_IMAGE_PAIR_REQUIRED` (400) `[auto]` | M3 | ⬜ |
| SC-69 | Kopírování emotu (`POST emotes/:id/copy`) — collision check v cílovém světě; limit check cílového světa; zdrojový emote musí patřit do `sourceWorldId` `[auto]` | M3 | ⬜ |
| SC-70 | WS emote events — `emote:created` jde do `world:{id}` roome; `emote:created-global` jde broadcast všem; FE `useWorldEmotes` a `useGlobalEmotes` jsou subscribed na správné eventy `[auto]` | M5 | ⬜ |
| SC-71 | `useWorldEmotes` — WS `emote:created` filtruje dle `emote.worldId === worldId` (zabrání cross-world leak do cache) `[auto]` | M5 | ⬜ |
| SC-72 | `ChatEmotePickerPopover` — search filtruje přes `shortcode` i `name`; prázdný query vrátí vše; klik vloží `:shortcode:` nebo unicode znak `[human]` | M1 | ⬜ |
| SC-73 | `EmoteAutocomplete` — při `:` v composeru se zobrazí nabídka; klik nahradí token `:shortcode:` v textarey `[human]` | M1 | ⬜ |
| SC-74 | Role gate — vytvoření/smazání/úprava emotu v světě: PomocnyPJ+; globální emoty: Admin+; hráč dostane 403 `[auto]` | M4 | ⬜ |
| SC-75 | `WorldEmotesAdminPage` — musí sama `room:join world:{id}` (není uvnitř WorldChatRoom), jinak WS emote eventy nepřijdou a cache se neaktualizuje `[human]` | M5 | ⬜ |

---

## G. Appearance & feed

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| SC-76 | `GET chat/appearance` — vrátí `chatColor`, `chatFont`, `chatFontSize`, `diceSkinMapping`, `jailedDiceSkins` z WorldMembership; non-member → `403 CHAT_NOT_MEMBER` `[auto]` | M3 | ⬜ |
| SC-77 | `PATCH chat/appearance` — partial update (jen poslaná pole), ostatní zůstanou beze změny `[auto]` | M3 | ⬜ |
| SC-78 | BE server-fill barvy/fontu — `sendMessage` doplní `color`/`customFont`/`customFontSize` z membershipu pokud DTO nesplní (FE může pola vynechat) `[auto]` | M2 | ⬜ |
| SC-79 | `chat:feed:bump` WS signál (13.2a) — leak-safe: BE emituje jen `{ worldId }` bez obsahu zprávy; FE refetchne `/chat/feed` (filtrovaný serverem) `[auto]` | M5 | ⬜ |
| SC-80 | Feed whisper guard — `getFeed` pro hráče používá `findFeed` s `visibleTo: userId` filtrem; hráč nevidí cizí whispery (manager ano) `[auto]` | M3 | ⬜ |

---

## Test coverage gaps

- `chat.service.spec.ts` a `chat.gateway.spec.ts` existují a pokrývají presence + getFeed; chybí testy pro: `toggleReaction` (žádný test), `reorderGroups`/`reorderChannels` (jen happy path scénáře), `syncLinkedChannelMembers` (pokryta nepřímo přes event listenery — chybí isolovaný unit test).
- `sounds.service.spec.ts` — existence ověřena ale obsah neprostudován do hloubky; chybí testy `nominateToGlobal`, `approveNomination`, `rejectNomination`.
- `emotes.service.spec.ts` pokrývá assertIsMember / assertWorldCanManage; chybí testy `copy`, `applyUpdate` s image pair validation.
- Na FE chybí testy pro: `useOptimisticSend` (retry s dice payload — SC-56), `SoundNowPlayingBanner` (WS event lifecycle), `ChatEmotePickerPopover` (filter logika), `applyUnreadEvent` s `mentionCount` chováním při increment event.
- Gateway `sound:play` / `sound:stop` handler nemá testy — bezpečnostní logika (role gate) netestována.

---

## Známá rizika

- **SC-56 (dice retry)**: `useOptimisticSend.retry` staví `payload` ručně a vynechává `dicePayload` a `diceSkin`. Retry selhané dice zprávy odešle zprávu bez payloadu — BE uloží bez `isDiceRoll` přes regex fallback (obsah má formát hodu), ale `dicePayload` bude `null` → `DiceMessage` zobrazí `DiceMessageFallback` místo 3D scény. Tichá regrese bez chybové hlášky.
- **SC-58 (sound userId spoofing)**: `sound:play` a `sound:stop` WS handlery berou `userId` z klientského payloadu a ověřují jen roli přes DB lookup. Hráč může spoofit PJ userId a spustit/zastavit zvuk pokud zná PJ ID. Blast radius nízký (jen ephemeral sound event), ale jde o bezpečnostní debtu výslovně zmíněný v kódu.
- **SC-75 (admin emotes room join)**: `WorldEmotesAdminPage` je mimo `WorldChatRoom`, který drží `room:join world:{id}`. Pokud admin stránka samu `room:join` nezajistí, WS emote eventy (created/updated/deleted) nepřijdou a UI zůstane stale bez reload. Riziko regrese při refaktoru layout/routing.
