# Findings — živý log (RUN 2026-07-05 23:03)

Formát: `PREFIX-RUN — [osa] popis · Kde · Dopad · Návrh · 🆕/♻️/🔓 · L · závažnost`.
Klasifikace: 🆕 nový · ♻️ regrese · 🔓 dříve otevřený.

---

## Scannery (Fáze A / rozšíření)

### A11Y-RUN-01 — [contrast] on-danger text pod WCAG 4.5:1 ve 3 motivech
- Kde: theme tokeny — `kyberpunk` (#fff5fa/#ff2050 = 3.53:1), `magie` (#fff5fa/#ff5577 = 2.89:1), `mesic` (#f4f8ff/#ff5577 = 2.89:1)
- Zdroj: `npm run audit:contrast`
- Dopad: bílý text na „danger" pozadí špatně čitelný pro slabozraké (WCAG AA fail)
- Návrh: ztmavit `--danger` background nebo změnit on-danger text per motiv (theme-scoped, [fb_theme_isolation])
- 🆕 · L2 · **střední** (a11y)

---

## Baseline (Fáze B start)
- BE jest **2353/2353 ✅** · FE vitest **3485/3486 — 1 FAIL**
- **BASE-01** [FE] `WorldCard.spec` „anon: CTA Detil světa" FAIL → baseline porušen (plán tvrdí 2473/2473 ✅). Souvisí s worlds findAll pivotem. · ~střední · prošetřit
- **PC-RUN-A** [BE env] `TOTP_ENC_KEY` chybí v test env → 2FA fail-closed (warn). Ověřit prod má klíč. · pozn. pro prod-config

## Fáze B — VLNA 1 (10 oblastí: bug00/01, role00/01, error-contract04, state00, race00, cascade00, db-integrity00, ws01)

Legenda: 🔴 kritické · ⭐ vysoké · ~ střední · · nízké · [BE]/[FE]/[doc]

### 🔴 KRITICKÉ (bezpečnost)
- **SEC-01** [BE] `room:join` nechrání `user:` prefix → i neautentizovaný socket vstoupí do cizí `user:{id}` room a odposlouchává whispery/friend/unread/admin-identitu/access-requesty. **Nezávisle potvrdily 2 agenti** (W-RUN-01 = EC-RUN-AL). Kde: `backend/src/gateways/app.gateway.ts:22-46`. Fix: gate `user:` jen na `client.data.userId` (jako `chat:`). · 🔴 · **commit+push**
- **SEC-02** [BE] Campaign cross-world IDOR — `findSubjectById/updateSubject/deleteSubject/findRelationshipById/findStorylineById/findScenarioById/findQuickNoteById/findShopItemById` autorizují proti query `worldId`, ne proti `entity.worldId` → PJ světa A čte/mění/maže entity světa B dle uhodnutého ID. Kde: `backend/src/modules/campaign/campaign.service.ts:116-120,163-904`. · 🔴
- **SEC-03** [BE] Maps cross-world IDOR (delete/activate/replace) — `assertCanManage(user, worldId)` z Query/Body, `deleteScene(id)` bez worldId, `setActive` ignoruje `_worldId`. Kde: `maps.controller.ts:135-163,265-272`, `maps.service.ts:341-348`, `maps.repository.ts:67-69`. Fix: autorizovat proti `scene.worldId` z DB. · 🔴
- **SEC-04** [BE] World hard-delete blob leak — `BLOB_COLLECTIONS` nepokrývá pages(imageUrl+galleryImages[])/chatchannels/campaignSubjects/game_events/timeline_events/worldnews → smazání světa = desítky-stovky trvale ztracených Cloudinary blobů. Kde: `world-hard-delete.service.ts:76-83` (CD-RUN-16). · 🔴

### ⭐ VYSOKÉ
- **SEC-05** [BE] Ban bypass — `reactivateDeletion()` a `refresh()` nekontrolují `bannedAt`/`isDeleted` (login je kontroluje) → zabanovaný self-delete uživatel získá tokeny. Kde: `auth.service.ts:314-357,367-423` (N-RUN-01). · ⭐ · **commit+push**
- **SEC-06** [BE] WS gateways neověří `bannedAt`/`isDeleted` z DB (jen podpis JWT, token žije 3 dny) → ban není okamžitý přes WS. Kde: `base.gateway.ts` + všechny `handleConnection` (N-RUN-02). Fix: DB gate nebo force-disconnect při banu. · ⭐
- **SEC-07** [BE] Characters `findByUser`/`findOne` chybí `assertCanViewDirectory` (list endpointy ji mají) → potvrzení existence+jméno+avatar postavy v privátním světě. Kde: `characters.controller.ts:94-117`, `characters.service.ts:118-140,199-218` (EC-RUN). · ⭐
- **SEC-08** [BE] Global-chat guest scope obcházitelný přes whisper/reaction (berou room z payloadu bez guest-gate a bez anonBan/flood). Kde: `global-chat.gateway.ts:609-677`. · ⭐
- **SEC-09** [BE] World-news `scope=active` čte anonymně obsah novinek privátního světa (`assertCanReadScope` u active hned returnuje). Kde: `world-news.service.ts:309-321` (R-RUN). · ⭐
- **N-45** [FE] `eslint .` má 1 error (`linkify.tsx:21` literální bidi/zero-width znaky → `no-irregular-whitespace`) → **CI merge gate na main padá** (baseline tvrdí čisté). Fix: Unicode escapy. · ⭐ · **opravit**
- **N-44** [FE] Souběžné 401 → paralelní `/auth/refresh` → BE `revokeFamily` = odhlášení všech zařízení. Kde: `client.ts:94-116`. Fix: single-flight refresh promise. · ⭐
- **N-43** [FE] Socket handshake JWT zamrzlý z 1. připojení, reconnect ho neobnoví → po expiraci (3d) tichá ztráta per-user WS. Kde: `socket.ts:24-35`. Fix: `auth` jako funkce / `reconnectSocket()` po refreshi. · ⭐
- **R-21** [FE] Elevation nedotažená do ~16 content-komponent (`userRole ?? -1 >= …`, nečtou `world.elevated`) → elevovaný admin má nav, ale ne moc (PageEditor ho i redirectne). Kde: seznam v checkpointu role00. · ⭐

### ~ STŘEDNÍ
- **N-RUN-03** [FE] `extractCode/mapError` čte `data.code` místo `data.error.code` (vždy undefined) v `EmailVerifyPage:18`/`EmailChangeConfirmPage:17`/`TotpVerifyStep:30` → uživatel nevidí specifickou chybu. ♻️ regrese vzoru EC-08. Fix: sdílený `parseApiErrorCode`. · ~
- **N-RUN-05** [BE] `changePassword` vrací 401 (INVALID_PASSWORD) místo 400 → interceptor spustí zbytečný refresh. Kde: `users.service.ts:360-364`. · ~
- **N-RUN-06** [FE] Interceptor auto-redirect i pro 401 na `/auth/login*` → nechtěná navigace z login modalu. `client.ts:76-92`. · ~/·
- **EC-RUN-b** [BE] `assertSubdocAccess` location→404 vs persona→403 (nekonzistentní); `world-maps assertCanViewAtlas` neexistující svět 200 [] vs private 403 (existence oracle); `pages` PAGE_WORLD_MISMATCH 403 oracle. `characters.service.ts:152-197`, `world-maps.service.ts:78-94`, `pages.service.ts:371-375,535-539`. · ~/·
- **EC-RUN-c** [BE] Mrtvý `_options.action` → Lokace subdoc read vyžaduje PomocnyPJ+ místo Hrac+ (spec 9.2). `character-subdocs.controller.ts:107`, `characters.service.ts:156,180`. · ~
- **EC-RUN-d** [FE] `TacticalMapView` maskuje 403/500 jako „no active scene" (`useMapScene` isError nedestrukturováno). `TacticalMapView.tsx:290,1579`. · ~
- **EC-RUN-e** [FE] `DiscussionDetailPage` nerozlišuje 403 vs 404. `:44-64`. · ·
- **S-RUN-04/05/06** [FE] Reconnect nedožene zmeškané eventy: `useMapWeather.ts:76-116`, `useWeatherWsSubscribe.ts:23-43` (0 testů), `useAdminChat.ts:204-206` (sourozenec dělá správně). Fix: invalidate v reconnect handleru. · ~/·
- **R-22** [FE] `SoundsPage.tsx:38`/`WorldNewsPage.tsx:37` used `isGlobalAdmin` místo `world.elevated` pro world-scope → admin bez elevace vidí tlačítka, klik = 403. · ·
- **N-RUN-04** [BE] `/users/me` nevrací `scheduledHardDeleteAt` (FE banner ho čeká) → dopočítat v `sanitize()`. · ·

### 🟠 DESIGN / NECHAT NA RÁNO
- **SEC-10** [BE] `GET /worlds` (findAll) vrací private/closed světy komukoli bez tokenu (jméno/popis/žánr/obrázek) — komentář „Katalog #3" naznačuje záměr, ale koliduje s AU-02/03 (private → 404). **Vyžaduje produktové rozhodnutí** (katalog veřejný vs filtrovat). Kde: `worlds.controller.ts:52-60`, `worlds.repository.ts:108-121`. · ⭐ · **ráno**

### 🔧 TEST/PROOF INFRA (blokuje Fázi C)
- **RC-CC1** [BE cfg] Stryker `jest.configFile:"package.json"` špatně (config je v `jest.config.ts`) → `stryker run` padá na BABEL_PARSE_ERROR = **+teeth 0 % funkční**. Fix: smazat/opravit `configFile` v `backend/stryker.conf.json:6-9`. · ⭐ (nutné před teeth)
- **RC-CC2** [BE cfg] Stryker `mutate` nepokrývá 4 race-fix soubory (character-subdocs/characters/chat/world-operations service). · ·
- **RC-CC3** [doc] `tla/money.tla` odkazuje na neexistující `money.cfg` → M-TLA nespustitelné. Fix: dopsat `money.cfg`. · ·
- **RC-CC4** [test] `economy.model.race.e2e-spec.ts` nemá `fc.scheduler()`, testuje jen I1 (ne I2-I4). · ·

### 📄 DOKUMENTACE (registr drift)
- **R-23** `role-audit.md` R-09/R-10 tvrdí 🐛, kód opraven → přepsat na ✅.
- **DI-RUN-09..13** FK graf B.1-B.5 + index inventura C.1-C.3 + D.1 řádky/jména metod drift → doplnit.
- **CD-RUN-14/15/17/18/19/20** [BE] další orphan/blob mezery: entity_schema_versions, world_elevations chybí v WORLD_SCOPED; chatchannels.imageUrl/campaignSubjects.avatarUrl/platform-documents PDF bez blob cleanup; campsavedgames bez user-hard-delete cleanup (GDPR chat historie). · ~/·
- **S-RUN** census (00-cross-cutting) stale o admin-chat/voice/combat listenery.

## Fáze B — VLNA 2 (12 oblastí + pod-agenti: bug02/05/07/09, error-contract00/03/06, ws02/04, role04, cache00, upload-media00)

### 🔴 KRITICKÉ (nové)
- **SEC-11** [BE] `emotes.controller.ts:19-21` `import type` na Create/Update/CopyEmoteDto → class-validator metadata prázdná → **KAŽDÝ POST/PATCH `/emotes/*` = 400 pro všechny** (emoty nejdou vytvořit/upravit/kopírovat). Ověřeno kompilací. Fix: `import` místo `import type`. · **commit+push**
- **SEC-12** [BE] `createShopItem` chybí role-gate (sesterský `createShopGroup`/`createScenario` ho mají) → člen světa i role Zadatel=0 založí shop item přímým API. `campaign.controller.ts:566-583`. · **commit+push**
- **SEC-13** [BE] `updateShopItem` nevolá `resolveIsShared(worldRole,…)` → hráč založí vlastní item (isShared:false) a PUT `{isShared:true}` self-publishne do veřejného obchodu celého světa (cena/měna dle sebe). `campaign.controller.ts:585-603`. · **commit+push**
- **SEC-14** [BE] `canJoinChannelRoom` vrací `true` pro `worldId:null` (globální kanály) PŘED kontrolou userId → i **neautentizovaný** socket `room:join chat:{campChannelId}` odposlouchává Camp roleplay + Voice presence. Rozšiřuje SEC-01. `chat.service.ts:171-179`. · **commit+push**
- **SEC-15** [BE] `convert()` CP→NPC posílá `userId:undefined` → Mongoose `$set` klíč smaže, stará `userId` v DB zůstane → bývalý hráč nakupuje/refunduje „za" NPC (`campaign-purchase.service.ts:104,431` porovnává userId bez isNpc). Fix: `userId:null`. `characters.service.ts:406-435`. · **commit+push**
- **SEC-07/14b** [BE] Characters `findByUser`/`findOne` bez `assertCanViewDirectory` (potvrzeno 2 agenty) — IDOR existence postavy v private světě. `characters.controller.ts:94-117`.

### ⭐ VYSOKÉ (nové)
- **SEC-16** [BE] `purchase()` nekontroluje `isShared`/scope položky (jen worldId) → koupě draft/skryté PJ položky dle uhodnutého ID. `campaign-purchase.service.ts:85-90`.
- **SEC-17** [BE] `transfer()` účtů volá `appendTransaction` (bez krytí) místo `appendTransactionIfSufficient` → neomezený debet (peníze z ničeho). `character-accounts.service.ts:~574,643`.
- **SEC-18** [BE] Push `subscribe`: `deleteByEndpointOnly`/`upsertByEndpoint` bez `userId` → útočník se známým endpointem hijackne/smaže cizí subscription. `push.service.ts:89-100`, `push-subscription.repository.ts:43-72`.
- **SEC-19** [BE] `updateFinance`/`updateInventory` bez `isNpc`/`kind` gate (GET ho má, EC-03) → PATCH přepíše subdoc entity, kterou GET hlásí jako „nedostupnou". `character-subdocs.service.ts:437-448,516-527`.
- **N-RUN-07** [BE] `DELETE /users/:id` (hard delete `findByIdAndDelete`) obchází self-delete flow (30d hold/audit/SOLE_PJ_BLOCK/cascade) → self i admin okamžité nevratné smazání bez auditu + osiřelé reference. `users.controller.ts:575-591`.
- **R-RUN-1** [BE] Search (MeiliSearch+embedding) globální napříč světy, dokument nemá `worldId`, `search()` nefiltruje, post-filtr srovnává jen holý `slug` → cross-world leak titulků/AKJ obsahu při kolizi slugů. `meili-search.service.ts`, `embedding-search.service.ts`, `search.controller.ts:72-85`.
- **BADGE-01** [FE] Záložka „Události" nikdy nemarkuje systémové zprávy jako přečtené (žádný bulk endpoint ani detail-fetch) → bell badge `systemUnread` se nikdy nevynuluje. `EventsTab.tsx`, `useEvents.ts`. Hlavní cesta notifikací funkčně rozbitá.

### ~ STŘEDNÍ (nové)
- **N-RUN-02** [BE] `toggleReaction` čte hasReacted ze zastaralého snímku → rychlý dvojklik skončí „přidáno". `chat.service.ts:1517`. + FE bez disable během isPending.
- **N-RUN-04/05** [BE] combat roster: `setCombat` $set celého objektu bez CAS (race); `updateCombatant`/`removeCombatant` s neexistujícím ID tiše „uspěje" místo 404. `chat-channel.repository.ts:104-158`.
- **N-RUN-03** [FE] Composer draft/NPC maska/RP datum v localStorage (klíč bez userId) přežije logout → leak na sdíleném zařízení. `useComposerSticky.ts:44`.
- **FE-ERRCODE** [FE] `data.code` místo `data.error.code` (vzor N-RUN-03/EC-08) i v `AdjustBalanceModal.tsx:92`, `ChangeCurrencyDialog.tsx:64` → chybové hlášky se nezobrazí.
- **R-RUN-2** [BE] `GET /worlds/:worldId/page-templates` bez `assertCanViewWorld` → nečlen private světa čte šablony. `world-page-templates.service.ts:36-39`.
- **R-RUN-3** [BE] Meili `deletePageFromIndex(slug)` maže špatným klíčem (primaryKey=id) → smazaná stránka zůstává vyhledatelná. `meili-search.service.ts:99-109`.
- **W-12** [BE] `chat:channel:join`/`sound:play` ověří jen world-membership, ne per-kanál `hasChannelAccess` → člen vyrobí ghost presence v restriktivním kanálu. `chat.gateway.ts:94-133`.
- **W-RUN-01(ws04)** [FE] `usePresenceInit` drží listenery na staré socket instanci (useEffect[]) → po `reconnectSocket()` zamrzne celá presence do reloadu. `usePresence.ts:26-94`.
- **C-RUN-01/02** [FE] `ChannelView`/`useAdminChatRealtime` reconnect re-joinne room, ale neinvaliduje messages → zprávy z výpadku chybí do F5. `ChannelView.tsx:288`, `useAdminChat.ts:203`.
- **MAIL-02** [FE] `useDeleteMessage` neinvaliduje `mailKeys.conversation` → smazaná zpráva zůstane „duch" ve vlákně. `useMail.ts:121`.
- **EC-VAL-1** [BE] `validationExceptionFactory` (`csMessage`) přepisuje i vlastní CS hlášky vývojářů generickou šablonou (regrese F2) — login „Zadej e-mail nebo přezdívku" → „Pole je příliš krátké". `validation-exception.factory.ts:16-56`. Ověřeno spuštěním dist.
- **EC-VAL-2** [BE/FE] `fields` field-mapping mrtvý end-to-end (BE emituje, FE `ApiError` ho nezná, 0 konzumace) — EC-02 slib nesplněn. + CS lokalizace pokrývá jen ~15 constraint typů.
- **EC-CODES** [BE/FE] `errorCodes.generated.ts` stale — 26 nových kódů nepublikováno (regrese EC-RUN-01, roste). Fix: `error-contract-scan --emit` + CI freshness.
- **EC-WS** [BE] app.gateway ack `{error:string}` vs maps `{code,message}` — 2 neslučitelné WS error tvary, FE ack callbacky nikde nečte; global-chat whisper/reaction early-return bez feedbacku → tichá ztráta whisperu.
- **N-RUN-08** [BE] zvuk dedup ignoruje status → rejected záznam blokuje název/URL navždy. `sounds.repository.ts:60`.
- **transfer/purchase** [BE] kompenzace kroku 2 tiše zahozena (chybí logger.error, asymetrie). `campaign-purchase.service.ts:348`, `character-accounts transferSequentialFallback`.
- **PUSH-2** [BE] admin/systémový odesílatel může poslat zprávu neexistujícímu recipientId (early-return před findById; DTO bez @IsMongoId). `ikaros-messages.service.ts:104`.

### · NÍZKÉ / DEAD / DOC (nové)
- Dead kód: `isFreshRoll`, emote `tags` end-to-end, finance/inventory `isHidden`, legacy finance subdoc, `resolvePref`/`NOTIFICATION_CATEGORIES` export, `BestiaeRepository.hardDelete` (nikdy volán).
- D-073 optimistic concurrency (`expectedUpdatedAt`) nevynucen u 5 subdoc update cest (jen root Character) → lost-update.
- YT player: bez onError (banner visí), mount v každém kanálu (síť/privacy).
- Dice: `faces` bez horního limitu (broadcast DoS), mixed Fate readout syrová čísla, DiceBox3D bez destroy (WebGL leak).
- UM-RUN doc drift (multer-exception.filter mrtvý odkaz), UM-RUN-7 chybová hláška „max 50 MB" na všech endpointech.
- Host chat: badge/heartbeat/anon-token smyčka gaty ignorují `anonSessionAtom` (5 nálezů), self-delete tlačítko 403.
- W-13/14 kontrakt drift + WS payload validace; GC-BOOT-RACE multi-instance duplicitní kanály; GC-SAVEDGAME-WINDOW.
- R-RUN-4 CharacterDirectory „Nová postava" gate PJ místo PomocnyPJ; FinanceTab default cizí sdílený účet; addMonthly bez idempotence.

## Fáze B — VLNA 3 (zbytek: role02-09, ws03-09, bug03/04/06/08/10/11/12/13, error-contract01-08, prod-config, log-hygiene) + rozšíření

### 🔴 KRITICKÉ (nové)
- **SEC-20** [BE] Soft-smazaný svět zůstává plně živý přes ID cestu — `base-mongo.repository.findById` nefiltruje `isActive`/`deletedAt` → po `DELETE /worlds/:id` kdokoli se znalostí worldId vidí detail, `join`/`access-request`+`approve` vytvoří novou membership, PJ dál edituje; po 30d cron smaže i data vzniklá po smazání. `worlds.service.ts` (findById/applyDetailScope/joinPublic/requestAccess/approve/update). Fix: `assertWorldActive` guard (404/410) na mutačních+join cestách. (bug06 N-1)
- **SEC-21** [BE] Self-service přiřazení postavy bez ownership → identity spoofing. `updateMemberCharacter` větev `membership.userId===requester.id` bez kontroly → i Zadatel/Čtenář si nastaví libovolný `characterPath`/avatar → vystupuje pod cizím jménem v chatu i adresáři. `worlds.service.ts:1468-1499`. (bug06 N-2)
- **SEC-22** [BE] Galerie+Diskuze `findMyFavorites`/`toggleFavorite` bez visibility filtru (článkový R-AUDIT fix se neportoval) → přihlášený uživatel „oblíbí" cizí Draft/Pending/Rejected obrázek/uzavřenou diskuzi a přes `/my-favorites` čte plný obsah vč. `rejectReason`. `ikaros-gallery.service.ts:492-531`, `ikaros-discussions.service.ts:249-256,418`. (role02 R-21/R-22 = KM-94/95, potvrzeno 3 agenty)
- **SEC-23** [BE] Reserved-slug: stránka se slugem shodným s route (`mapa`/`obchod`/`postavy`/…) se uloží, je v adresáři, ale URL vždy skončí na systémové stránce → tichá ztráta dosažitelnosti; slug není v UI vidět. `create-page.dto.ts`, `pages.service.ts:250`. (bug08 N-RUN-08b)
- **SEC-24** [FE build] `vite@8` defaultuje minify na `oxc`, ne `esbuild` → `esbuild.drop:['console']` je **no-op** → vlastní `console.*` (vč. `[socket]`, `[GlobalErrorBoundary]`) zůstávají v **produkčním** bundlu (empiricky 2× ověřeno na dist). Regrese PC-09/LH-12. Fix: `build.minify:'esbuild'` v `vite.config.ts`. (= PC-RUN [06], LH-RUN-01)
- **SEC-25** [BE] `dungeon-maps` všechna 4 DTO bez class-validator dekorátorů → `ValidationPipe(forbidNonWhitelisted)` → `POST/PUT /dungeon-maps`, `/export-*` = 400 pro každý request (funkce nefunkční). + `exportTemplate` bez `ownerId` → 500. (bug11 maps-gw N-RUN-SM-1/2)
- **FUNC-01** [FE] CalendarPage `shift()` nekonečná smyčka když `months.length===0` (editor dovolí smazat všechny měsíce) → klik na šipku zamrzne tab. `CalendarPage.tsx:370-384`. (bug10 engine)
- **FUNC-02** [BE] Timeline „Odstranit obrázek" nikdy nesmaže — `imageUrl:null` interpretováno jako „zachovej" (invertovaná sémantika vs game-events/world-news). `timeline.service.ts:223-225`. (bug10 D)
- **FUNC-03** [FE] `/admin/dungeon-builder` je čistý stub (`<div>[stub]</div>`), route+guard živé → admin vidí placeholder. (bug11 lib)

### ⭐ VYSOKÉ (nové)
- **SEC-26** [BE] Elevace nepokrývá jádro world-governance — `canAdminWorld`/`canManageMembers`/`canEditWorldData`/`assertCanModerateAccessRequests`/`updateSettings`/`updateAkjTypes`/`updateCalendarDefaults` nevolají `worldAdminBypass` (~20 jiných modulů ho má) → elevovaný Admin nemůže spravovat nastavení/členy/kalendář světa. `worlds.service.ts`. (role03 R-RUN-1)
- **SEC-27** [BE] Role-ceiling: elevovaný Admin s reálnou PomocnyPJ membership obejde R-03 a povýší sám sebe na PJ (`isGlobalAdmin` vynechá ceiling-check). `worlds.service.ts:1373-1388`. (bug06 N-3)
- **SEC-28** [BE] ReDoS: neescapovaný `$regex` v admin user-search (`findAllPaginated`/`findPublicPaginated`) + `campaign.service.ts:159` → Admin pošle patologický regex → full-scan CPU stall celé platformy. `escapeRegex()` helper existuje, jinde použit. `users.repository.ts:249,283`. (bug12 N-RUN-01)
- **SEC-29** [BE] `world-export` (scope pj-full) agreguje GM poznámky VŠECH PJ přes `gmNotesRepo.findByWorldId` bez userId filtru → jeden PJ stáhne soukromé poznámky ostatních PJ (WorldGmNotes jinak striktně per-PJ izolované). (role06 R-RUN-06-4)
- **SEC-30** [BE] room:join gate jen point-in-time → uživatel odebraný z `members`-kanálu za provozu dál dostává živé `chat:message` (žádný WS signál k invalidaci/kick). `chat.service.ts syncLinkedChannelMembers`, `ChannelView.tsx`. (role08)
- **WS-STATE-01** [FE] `useUniverseSocket`/`useMapWeather` na unmountu volají `room:leave world:{id}`, ale AppGateway room není ref-counted → odchod z Universe/mapy vykopne dashboard z world roomu (přestane dostávat updates do reconnectu). (ws06 W-RUN-06-02)
- **WS-STATE-02** [FE] Guest→member login neobnoví WS identitu (`accessTokenAtom` set před `anonSessionAtom=null`, socket drží starý guest handshake) → po přihlášení z Hospody nechodí per-user pushe do reloadu. `useAuth.ts`. (ws09 W-RUN-09-05)
- **FE-ELEV** [FE] Elevation drift napříč ~20 komponentami (userRole bez `world.elevated`): WorldChatRoom/WorldSettingsPage (prázdné taby!), WorldNewsPage, EventsColumn/EventsPage, TimelinePage, WeatherPage delete, MapPjPanel isPjStrict, GameEventCard → elevovaný admin má nav, ne moc. (role02/06/07/08, bug06 A-2/A-3)
- **WS-MISS** [BE] `world.settings.updated` se neemituje přes WS (chybí `@OnEvent` v `worlds.gateway`) → změna settings/skupin/AKJ se k ostatním nedostane do refetche. (bug06 C-1)
- **STALE-FORM** [FE] Settings taby (AccessMode/BasicInfo/Theme/GroupColor/AkjLevel/…) nesync lokální state po externí změně → 2 PJ současně = tichý přepis (lost update). (bug06 D-1)
- **MAP-TPL** [FE/BE] Šablona mapy zahazuje `walls`/`lights` (MapTemplate/DTO je nezná) → načtená šablona s dynamickou LoS „vidí skrz zdi". `MapLibraryModal.tsx`, `create-map-template.dto.ts`. (bug11 lib N-RUN-SM-2)
- **NPM-01** [FE dev] `@vitest/browser` critical RCE (browser mode) — dev-only, `npm audit fix`. + FE 2 moderate, BE 4 moderate (js-yaml/qs DoS transitivní).

### ~ STŘEDNÍ / NÍZKÉ (souhrn per audit)
- **error-contract**: EC-RUN-13/14/15 `data.code` místo `.error.code` v shop/emote dialozích + **12× BestiePanel** (`e.message` EN text) → hlášky se nezobrazí; `csMessage` přepisuje custom CS hlášky (regrese F2); `fields` mrtvé end-to-end; `errorCodes.generated` stale 26+fantom; 39 fake generic codes; RolesGuard EN „Forbidden resource"; 413→500; malformed JSON EN; Cloudinary leak admin; CURRENCY 400 vs 404; 429 EN text.
- **prod-config (PC-RUN)**: scanner není brána (drift se tiše vrací); FRONTEND_URL bez fail-fast → CORS/static na localhost; BACKEND_BASE_URL prázdný string obchází `??`; JWT_EXPIRES_IN/ANON_SESSION_TTL/DELETION_HOLD_DAYS drift/hardcoded; model_cache bez volume (re-download každý deploy); TOTP_ENC_KEY rotace=lockout bez recovery; appUrl bez https vynucení; SMTP bez requireTLS; /health nezná mailer; Dockerfile VITE_API_URL guard jen warning.
- **log-hygiene (LH-RUN)**: mailer `dispatch` loguje plný email; push endpoint v logu; **CI workflow `set-user-email.yml` má reálný email hráče natvrdo v gitu** + `export-ikaros-users.yml` dumpuje všechny emaily do Actions logu; 3× raw `Error` objekt do loggeru (campaign-purchase/character-accounts/pages); scanner `log-hygiene-scan.mjs`/`audit:logs` deklarovaný ale neexistuje; RegisterModal captcha console umlčen buildem; failed login/2FA bez audit stopy.
- **bug rollup**: N-RUN-08a backlinks regex (panel vždy prázdný); embedding deletePage cross-world; users favorite-pages bez world check; game-events timezone/confirmable default; calendar PATCH season bypass; BE calendar utils bez leapYearRule (9/14 presetů); weather empty-types→500, historie>200 mrtvé; combat reorder duplicity, scene assign invariant, isLocked remove, token.notes leak; admin stats tombstone count, audit gap create-user, heslo min6 vs 8; ikaros-events imageFit dead; archive/confirm 201 vs 200.
- **FE rollup**: AvatarUploader `''` broken img; UserAvatar errored nereset; profil sekce bez error handling; NumberField/ListField min/max nevynuceno; schema-form validace mrtvá; many reconnect-refetch gaps (bestiar/emotes/weather/adminchat); scene create bez rollback; deactivate/switch bez error+pending guard.
- **a11y (bug13)**: 3× contrast (kyberpunk/magie/mesic on-danger) = A11Y-RUN-01; reduced-motion gaps (severske-runy/vesmirna-bitva/modre-nebe); ARIA listbox option na button; blocking Google Fonts.
- **dead-code/dluh**: campaign dashboard+QuickNote FE mrtvé; system-presets/finance legacy subdoc; circular deps FE 5/BE 12; TODO 11.

---
## Fáze C — proof-vrstvy (stav)
- **+e2e**: BE e2e 73/134 fail = **infra** (lokální Mongo standalone, ne replSet → tx/race/seed padají); error-probe „boom" záměrný. ⏭️ plná e2e čeká replSet (`MongoMemoryReplSet` v harness nebo `docker mongo --replSet`).
- **+db**: ⏭️ lokální `ikaros` EMPTY, prod bez souhlasu. Orphan/blob scany (CD-RUN, DI-RUN) nezměřeny.
- **+teeth (Stryker)**: ⏭️ blokováno RC-CC1 (jest configFile špatně) — nepouštěno.
- **+formal (TLC)**: dostupné (Java+jar), nepouštěno (čas); existující MapReconnect.tla pokrývá S-RUN třídu.

