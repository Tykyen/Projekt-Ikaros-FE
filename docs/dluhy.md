# Technické dluhy

> Soubor obsahuje **pouze otevřené a částečně řešené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-05-14.

---

## Otevřené z 1.3c (čekající na externí infru / fáze)

### D-040 — Tombstone integrace do chat / článek / galerie / diskuze renderingu
**Kontext:** 1.3c poskytuje `<UserAvatar deleted />` primitive. Integrace do konkrétních komponent přijde s pipelines těch fází.
**Řešení:** Fáze 3.x (články, galerie, diskuze) + 4.x/6.x (chat) — autor s `isDeleted=true` rendrovat s `<UserAvatar deleted />` + zobrazit "Smazaný účet" jako displayName tooltip.

---

## Otevřené

### D-028 (zbývající Redis varianta) — Cache pro `JwtStrategy.validate` ban check
**Kontext:** In-memory cache uzavřena, single-instance funguje plně. Pro multi-instance deployu nutno swap na Redis pub/sub.
**Řešení:** Vyměnit `UserBanCacheService` Map za Redis client (`ioredis`); invalidate přes pub/sub channel `user-ban-invalidate`.

---

### D-044 — Mongo full text-index pro public adresář (částečně uzavřeno 1.4)
**Kontext:** 1.4 zavedl `findPublicPaginated` se substring regex search nad `usernameLower` + `displayName`. Compound index `{ isDeleted, deletionRequestedAt, createdAt }` + `displayName` index přidány. Pro 100k+ uživatelů by pak bylo vhodné full text index.
**Řešení:** Až DB přeroste ~10k uživatelů, přidat `UserSchema.index({ usernameLower: 'text', displayName: 'text' })` + přepnout query z `$regex` na `$text`. Měřit perfomance předtím.

---

### D-045 — Privacy toggle „skrýt mě v adresáři"
**Kontext:** 1.4 adresář vidí jen Admin/Superadmin, takže privacy concern je nízký. Až přijde širší použití (1.8 přátele iniciace přes adresář), uživatel by měl mít opt-out.
**Řešení:** `User.hiddenInDirectory: boolean` flag + filter ve `findPublicPaginated`. Diskuse pro 1.7+.

---

### D-051 — Redis adapter pro `OnlinePresenceRegistry`
**Kontext:** 1.5 registr je in-memory Map<userId, RegistryEntry>. Single-instance only — při multi-instance deployu by každá instance měla vlastní obraz a `presence:update` broadcast by se nepropagoval mezi instancemi.
**Řešení:** Swap `OnlinePresenceRegistry` Map za Redis hash + použít `@socket.io/redis-adapter` pro multi-instance broadcast. Analogicky k D-028 (cache pro ban check). Až bude potřeba škálování.

---

### D-011 — Captcha provider integrace
**Soubor:** `src/components/auth/RegisterModal.tsx` + BE `auth` modul
**Stav:** Honeypot field implementován (FE skryté pole + BE DTO `@MaxLength(0)` validace v `RegisterDto`). Plný captcha provider (hCaptcha / Turnstile) **stále chybí**.
**Dopad zbytkový:** Honeypot odfiltruje naivní boty, ale dedikované scraper boty s headless browserem ho obejdou. Pro produkci nezbytné dodat reálnou captchu.
**Blokátor:** PJ musí rozhodnout provider (hCaptcha free + GDPR-friendly / Cloudflare Turnstile / Friendly Captcha) a založit účet (site key + secret v `.env`).
**Kdy:** Před prod nasazením, samostatný spec.

---

### D-061 — Mongo replica set pro atomické transakce v approveAccessRequest (2.4)
**Soubory:** `backend/src/modules/worlds/worlds.service.ts` (metoda `approveAccessRequest`), `backend/src/database/database.module.ts`
**Stav:** Otevřený — dev Mongo bez replica setu, transakce nepoužité.
**Kontext:** Spec 2.4 §4.1 požaduje atomickou operaci (smaž `WorldAccessRequest` + vytvoř `WorldMembership`). Bez replica setu Mongo transakce selžou. Implementace dnes používá **pragmatický fallback**: nejdřív create membership (s unique key check), pak best-effort delete AR. Pokud druhá operace failne, orphan AR v DB — další pokus o approve / cancel ho čistí, výsledek je idempotentní.
**Dopad:** Velmi nízký v dev. V prod by stačil 1-node replica set (`rs.initiate()` na single instance). Cleanup orphan AR by mohl být cron job.
**Řešení:** (1) Konfigurovat MongoDB replica set v `database.module.ts` (`replicaSet: 'rs0'`). (2) Upravit `approveAccessRequest` na `connection.startSession().withTransaction(async () => { … })`. (3) Doplnit test pro transaction abort scenario.
**Kdy:** Před prod nasazením 2.4 (nebo později, pokud orphan AR míra zůstane nízká).

---

### D-062 — Charakter request flow (Čtenář → Žadatel role upgrade, 2.4 → 5+)
**Soubory:** `src/features/world/*` (in-world UI), `backend/src/modules/worlds/*` (service+controller)
**Stav:** Otevřený — Žadatel role (0) existuje, ale chybí in-world akce, která promote přivede.
**Kontext:** Spec 2.4 v2 přesně odděluje pre-membership (`WorldAccessRequest`) od role Žadatel. Po schválení AR se uživatel stane Čtenář; chce-li hrát, musí klika na „Chci postavu" → upgrade Čtenář → Žadatel (čeká na přidělení postavy PJ). Tato akce v 2.4 chybí.
**Dopad:** Hráčem se dnes uživatel nestává plně — zůstane Čtenář navždy. PJ musí ručně upravit roli (přes settings, 2.5). Out of scope 2.4.
**Řešení:** Spec fáze 5+ (character flow) — endpoint `POST /worlds/:id/request-character`, který memberovi s rolí Čtenář povýší na Žadatel + vznikne pending action `character_request` ve Zpracovat tabu PJ.
**Kdy:** Fáze 5+ (character flow).

---

### D-063 — Anon viewing public/open světů (2.4 → samostatná fáze)
**Soubory:** `src/app/router.tsx` (loader `requireAuth` na `/svet/:worldId`), `backend/src/modules/worlds/worlds.controller.ts` (`OptionalJwtAuthGuard`)
**Stav:** Otevřený — anon nevidí žádný detail.
**Kontext:** Spec 2.3 §4.4 říká „public = kdokoliv vidí, kdokoliv se přidá". V 2.4 ale `/svet/:worldId` celá za `requireAuth` (loader) → anon redirectne na `/?openLogin=1`. BE už podporuje anon GET `/worlds/:id` (přes `OptionalJwtAuthGuard`), problém je čistě FE routing.
**Dopad:** Anon přijde z venku přes přímý link → musí se přihlásit, i když by kvůli public světu nemusel. Mírný onboarding friction.
**Řešení:** (1) Odebrat `loader: requireAuth` z route `/svet/:worldId` v `router.tsx`. (2) Sub-routes nech za `requireAuth` (membership stejně vyžaduje login). (3) Light header zobrazit i pro anon. (4) JoinCTA pro anon → tlačítko „Přihlásit se a vstoupit" (otevře LoginModal).
**Kdy:** Samostatná malá iterace 2.4b nebo v rámci 2.5.

---

### D-064 — Leave world flow (self-leave pro Ctenar+, 2.4 → 2.5)
**Soubory:** `backend/src/modules/worlds/worlds.controller.ts` (`DELETE /:worldId/members/me`), `src/features/world/components/MemberDashboardStub`
**Stav:** Otevřený — existuje stará `leave(membershipId)` endpoint pro PJ removal, ale chybí self-leave UI.
**Kontext:** Po join do public světa nemá uživatel jak ze světa zase odejít. Operace musí být:
- Pro Čtenář/Hráč: smazat vlastní membership, redirect na `/`.
- Pro PJ: zákaz (musí předat svět nebo smazat).
**Dopad:** Trapped state — user vstoupí, pak se chce odhlásit, ale není možno.
**Řešení:** (1) BE endpoint `DELETE /worlds/:id/members/me` (self-leave). (2) FE tlačítko „Odejít ze světa" v MemberDashboardStub / settings (2.5). (3) Confirm dialog. (4) Po success redirect na `/`.
**Kdy:** 2.5 (world settings).

---

### D-060 — Cross-world kalendář link (2.1 → 9.2)
**Soubory:** `src/features/ikaros/pages/DashboardPage/sections/UpcomingEventsSection.tsx`
**Stav:** Otevřený, čeká na fázi 9.2 (Kalendář).
**Kontext:** Sekce „Blížící se schůzky" má action „Zobrazit vše →", která dnes míří dočasně na `/ikaros/vesmiry`. Cross-world kalendář (`/ikaros/kalendar` nebo equivalent) ještě neexistuje; vznikne s fází 9.2 nebo dříve jako side-task. **Action:** po dokončení 9.2 přesměrovat link na novou route.

---

### D-067 — Audit log UI pro Ikaros novinky (archive/delete)
**Soubory:** `backend/src/modules/ikaros-news/schemas/ikaros-news.schema.ts` (data už jsou), FE: nová audit komponenta nebo rozšíření existujícího AuditLogTab.
**Stav:** Otevřený — data se ukládají (`archivedAtUtc`, `archivedByUserId`), ale UI je nezobrazuje.
**Kontext:** 3.1 archive endpoint nastavuje audit fields. Admin/Superadmin by mohl chtít vidět „kdo a kdy zarchivoval/smazal novinku" pro accountability. Pro hard delete (DELETE) ale chybí audit log — záznam zmizí z DB.
**Dopad:** Bez audit logu nelze dohledat, kdo provedl změnu. Pro malý team (Tyky + 1-2 admini) zatím nekritické.
**Řešení:** (1) Hard delete → log do AdminAuditLog před `findByIdAndDelete`. (2) Archive/unarchive také log do AuditLog (i když data jsou na entitě, AuditLog je centrální view). (3) FE: rozšířit AuditLogTab v `/ikaros/uzivatele` o filter na entity typu „IkarosNews".
**Kdy:** Až bude širší team admin nebo se objeví incident dohledávání. Low priority.

---

### D-NEW-pending-actions-wired — PendingActionsModule nebyl v AppModule (uzavřeno 3.2a)
**Stav:** ✅ Uzavřeno 2026-05-15, commit `8b9e386e`.
**Co bylo:** `PendingActionsModule` (1.4 Zpracovat infra) existoval, ale nebyl importovaný v `AppModule`. `FriendshipsModule` (1.8) + `WorldsModule` (2.4) injectovaly `PendingActionsService` — DI by selhalo při startu. Objeveno při 3.2a auditu.
**Fix:** Přidán `PendingActionsModule` do `AppModule.imports`.

---

### D-NEW-search-be — Server-side full-text search článků (z 3.2)
**Stav:** Otevřený.
**Kontext:** 3.2 Přehled článků filtruje client-side (`filterArticles` nad `useArticles()` array). OK do ~500 článků; pak je přenos celého listu neefektivní.
**Řešení:** Mongo `$text` index na `ikaros_articles` (`title` + stripped `content`). BE `GET /ikaros-articles?search=` query. FE přepnout `filterArticles` na server query při velkém datasetu.
**Kdy:** Až článků naroste přes ~500.

---

### D-NEW-bulk-pending-articles — Bulk approve/reject článků ve Zpracovat tabu (z 3.2)
**Stav:** Otevřený. Souvisí s D-NEW-bulk-pending z 2.4.
**Kontext:** SpravceClanku schvaluje pending články jeden po druhém. Při mnoha pending najednou je to zdlouhavé.
**Řešení:** Multi-select ve Zpracovat tabu + bulk endpoint. Společné řešení s 2.4 bulk pending.

---

### D-NEW-article-versions — Historie editů článku (z 3.2)
**Stav:** Otevřený, nice-to-have.
**Kontext:** Pro literární komunitu by se hodila historie verzí článku (kdo co kdy změnil, rollback).
**Řešení:** Collection `article_versions` se snapshoty při každém update. Diff UI na detailu.
**Kdy:** Low priority, až bude poptávka.

---

### D-NEW-html-sanitization — Chybí server-side sanitizace HTML (z 3.2, potvrzeno 3.4)
**Stav:** Otevřený, bezpečnostní — **blokované prostředím**.
**Soubory:** `backend` — `ikaros-articles` (`content`), `ikaros-discussions` (post `content`).
**Problém:** BE neukládá-sanitizuje HTML z RichTextEditoru — spoléhá na to, že TipTap produkuje bezpečné HTML a že render jde vždy přes `<RichTextEditor readOnly>` (TipTap při re-parse zahodí cokoli mimo schema). Kdo obejde FE a POSTne `<script>` přímo na API, uloží ho do DB.
**Dopad:** Střední — stored XSS je při dnešním renderu (TipTap re-parse) neutralizovaný, ale uložená data jsou „špinavá" a jakýkoli budoucí `dangerouslySetInnerHTML` render by je zneužil.
**Řešení:** Server-side sanitizér (`sanitize-html`) v `addPost` / article create+update — allowlist tagů shodný s TipTap schématem. Wiring je ~15 řádků (sdílený `sanitizeRichText()` util).
**Blocker (2026-05-15):** `npm install sanitize-html` v tomto prostředí selhává — `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (TLS/CA na npm registry). Hand-rollovaný regex sanitizér by dával falešný pocit bezpečí (mutation XSS) — záměrně nezvolen. Dořeší se po opravě npm CA / dostupnosti registry.
**Kdy:** Bezpečnostní úklid, ideálně před produkčním nasazením — jakmile lze nainstalovat dependency.

---

## Čeká na trigger (přesun z „Otevřené")

### D-NEW-discussion-pagination — Stránkování seznamu diskuzí a vlákna — TRIGGER: ~stovky diskuzí / dlouhá vlákna
**Soubory:** FE `useDiscussions()` / `useDiscussionPosts()`, BE `ikaros-discussions` `findAll`.
**Co dělá aktuální stav:** `GET /ikaros-discussions` vrací všechny dostupné diskuze; `useDiscussionPosts` natáhne 50 příspěvků; filtrování/řazení je client-side. Pro desítky diskuzí **správné rozhodnutí** — žádný server-side paging overhead, okamžitý fulltext.
**Trigger:** počet diskuzí přeroste ~stovky, nebo vlákno přesáhne ~50 příspěvků, nebo výkonnostní audit.
**Co bude potřeba:** Server-side paging listu (skip/limit + total) — pozor, rozbije client-side search/sort, nutné přesunout i ně na server. „Načíst starší" ve vlákně (BE `getPosts` skip/limit už existuje). **Řešit společně s `D-NEW-search-be`** — stejný pattern, stejný trigger; články dnes mají identický client-side přístup, sjednotit.
**Pozn.:** Překlasifikováno 2026-05-15 z „Otevřené" — pro aktuální objem dat je client-side správně, předčasná optimalizace by zbytečně zkomplikovala UX (paged search).

---

## Vyřešené (historie, zachovat pro audit trail)

### D-072 — `chatColor` na backendu vůbec neexistoval
**Stav:** ✅ Uzavřeno 2026-05-16.
**Co bylo:** `/ikaros/profil` padala všem (`Cannot read properties of undefined (reading 'toUpperCase')`). Původní diagnóza („starý účet bez `chatColor`, chybí migrace") byla **chybná** — backend pole `chatColor` neměl vůbec: ani ve `user.schema.ts`, ani v `User` interface, ani v `UpdateUserDto`, ani v repository mapperu. FE typ `User.chatColor: string` deklaroval pole jako povinné, FE ukládal barvu přes `PATCH /users/me { chatColor }` — ale DTO whitelist hodnotu tiše zahazoval. Featura „Barva chatu" (`AppearanceSection` + `ChatColorPicker`, od kroku 1.6a) byla end-to-end mrtvá; `user.chatColor` byl `undefined` u **každého** uživatele.
**Fix (FE):** Defenzivní fallback `#FFFFFF` v `ProfileHeader.tsx` a `AppearanceSection.tsx` (zabránit crashi).
**Fix (BE):** `chatColor: string` doplněn do `user.schema.ts` (`@Prop default '#FFFFFF'`), `User` interface, `UpdateUserDto` (`@Matches /^#[0-9a-fA-F]{6}$/`), `users.repository.toEntity` (`?? '#FFFFFF'` fallback pro dokumenty bez pole), `users.service.update` (propaguje `dto.chatColor`). Migrace netřeba — mapper sklápí existující dokumenty. +2 service testy. BE tsc čistý, 72/72 users testů zelených.

---

### D-073 — BE polovina kroku 1.3a (profil) nikdy nevznikla
**Stav:** ✅ Uzavřeno 2026-05-16.
**Co bylo:** Objeveno při auditu navazujícím na D-072. [plan-1.3a.md §2](arch/phase-1/plan-1.3a.md) specifikoval BE práci (pořadí „BE → FE"); FE část vznikla, BE část ne. Chybělo:
- **6 profilových polí** — `city`, `bio`, `characterName`, `characterBio`, `characterAvatarUrl`, `themeId` (+`lastLoginAt`) — ani ve schématu, ani v `User` interface / `UpdateUserDto` / mapperu. Editace profilu (město, bio, postava) se tiše zahazovala přes DTO whitelist.
- **`PATCH /users/me`** — controller měl jen `@Patch(':id')`; `me` spadlo do parametrické routy → 403 / 404. Editace profilu nefungovala nikomu.
- **4 avatar endpointy** — `POST/DELETE /users/me/avatar` a `…/character/avatar` — FE je volal, BE je neměl → 404.
- **`lastLoginAt`** — FE zobrazoval „Poslední přihlášení", BE pole neexistovalo.
**Fix (BE):** (1) 7 polí do `user.schema.ts` + `User` interface + `toEntity` mapper + `UpdateUserDto` (`city ≤100`, `bio ≤1000`, `characterName ≤64`, `characterBio ≤1000`, `themeId ≤64`, `defaultAvatarType male|female|being`); `users.service.update` je propaguje. (2) Nový `@Patch('me')` deklarovaný **před** `@Patch(':id')` (routing priorita), blokuje změnu username (jde přes request-flow). (3) `UploadService.uploadUserImage` (deterministický `public_id: 'main'`, overwrite → žádné orphany) + `deleteUserImage`; 4 endpointy v `UsersController`, `UsersModule` importuje `UploadModule`. (4) `UsersRepository.updateLastLogin` volaný z `auth.service` `login()` (+ `register()` ho ukládá rovnou do `save`). +5 testů (service 2, auth 2 + 1 assertion). BE tsc čistý, 136/136 users+auth unit testů, e2e bootuje (modul graf OK).
**Navíc:** `defaultAvatarType` dostal `@Prop({ enum, default: 'male' })` + `toEntity` fallback `?? 'male'` (FE typ ho čeká povinný; dřív `@Prop()` bez defaultu).
**Zbytek:** Avatar endpointy nemají controller/e2e test (thin delegace; `UploadService` obaluje Cloudinary SDK — pokrytí až s users e2e harness).

---

### D-070 — Hardcoded barvy v module CSS (`lint:colors` červený)
**Stav:** ✅ Uzavřeno 2026-05-16.
**Co bylo:** `lint:colors` hlásil 10 hardcoded hex barev. Záznam D-070 byl zastaralý — uváděl `IkarosEventCard/Modal` (ty už byly čisté); reálná porušení byla v Discussion/Reviews CSS (fáze 3.4): `var(--star-gold, #e0a82e)` ×3 a `var(--bg-base, #fff)` ×7 — hex jako fallback uvnitř `var()`.
**Fix:** `--star-gold` je definovaný (`prose-tokens.css`) → drop hex fallback. `--bg-base` je nedefinovaný (phantom token) → hex fallback `#fff` nahrazen definovaným theme-independent bílým tokenem `var(--status-band-fg)`. Zero behavior change, žádný shared/theme edit. `lint:colors` nyní zelený.

### D-057 — Friend-only privacy v profilu / poště
**Stav:** ✅ Uzavřeno 2026-05-15 (fáze 3.5).
**Co bylo:** Veřejný profil dostupný každému přihlášenému; pošta bez omezení odesílatele.
**Fix:** Pole `User.profileVisibility: 'public' | 'friends'` (default `public`). BE enforce — `publicProfileV14` (403 `PROFILE_FRIENDS_ONLY` pro nepřítele/ne-admina/ne-self), `IkarosMessagesService.create` (403 `RECIPIENT_FRIENDS_ONLY`; odpověď ve vlákně + Admin výjimka). FE — přepínač „Jen pro přátele" v profilu (`PrivacySection`), 403 handling v poště i na veřejném profilu. Friend-check přes `FriendshipsService.areFriends`.

### D-NEW-mail-useUnreadCount-modul — `useUnreadCount` ve špatném feature modulu (dluh A z 3.5)
**Stav:** ✅ Uzavřeno 2026-05-15 (fáze 3.5).
**Co bylo:** `useUnreadCount` (pošta) žil v `src/features/chat/api/useMessages.ts`, ač s chatem nesouvisí.
**Fix:** Přesunut do `src/features/ikaros/api/useMail.ts` (kde vznikly i ostatní pošta-hooky). `chat/api/useMessages.ts` smazán, barrel `chat/index.ts` i header import přesměrovány. Při tom opraven latentní bug — `getUnreadCount` BE vracel `{ messages, pendingRequests }`, FE typ čekal `{ unreadCount, pendingRequestCount }` → header badge byl trvale 0; sjednoceno na `{ unreadCount }`.

### D-NEW-mail-legacy-world-join — Legacy `world_join_request` v `IkarosMessage` (dluh B z 3.5)
**Stav:** ✅ Uzavřeno 2026-05-15 (fáze 3.5).
**Co bylo:** `IkarosMessage` nesl `actionType`/`actionWorldId`/`actionUserId`/`actionResolved` + endpoint `/resolve` + handler `handleJoinRequest` — parity-relikt starého systému, nahrazený modulem `pending-actions` + `WorldAccessRequestProvider`.
**Fix:** Ověřeno, že `world.join.requested` nemá emittera (mrtvý kód) → odstraněna všechna action pole, `/resolve`, `ResolveIkarosMessageDto`, `handleJoinRequest`, `countPendingRequests`, `resolveIfPending`. `getUnreadCount` → `{ unreadCount }`. World-join flow přes `pending-actions` nedotčen.

### D-NEW-mailer-module-not-imported — `MailerModule` (@Global) nikdo neimportoval
**Stav:** ✅ Uzavřeno 2026-05-15 (objeveno při 3.5 e2e).
**Co bylo:** `MailerModule` je `@Global`, ale žádný modul ho explicitně neimportoval — `MailerService` se do DI dostával jen náhodným tranzitivním načtením přes jiný modul. Úklid module grafu v 3.5 (dluh B — `IkarosMessagesModule` přestal importovat `WorldsModule`) ten řetězec přerušil → e2e s částečným module grafem padaly na „MailerService not available in UsersModule".
**Fix:** `UsersModule` importuje explicitně `MailerModule` + `SecurityTokensModule` (oba @Global, `UsersService` je konzumuje). `FriendshipsModule` analogicky importuje `PendingActionsModule`. Moduly jsou nyní soběstačné i v částečných grafech.
**Pozn.:** Stejný anti-pattern byl i jinde — viz `D-NEW-e2e-chat-push-wiring`.

### D-NEW-e2e-chat-push-wiring — `@Global` moduly bez explicitního importu (ChatModule/WorldsModule/FriendshipsModule)
**Stav:** ✅ Uzavřeno 2026-05-16.
**Co bylo:** Tři BE e2e suity (`auth-refresh`, `worlds-join`, `auth-register-check`) nebootovaly — `Nest can't resolve … PushService in ChatModule` → po opravě → `PendingActionsService in WorldsModule`. Řetěz `@Global`-not-imported bugů: `ChatService` konzumuje `PushService`, `WorldAccessRequestProvider` konzumuje `PendingActionsService`, `FriendshipsModule` konzumuje `PendingActionsService` — žádný host modul cílový `@Global` modul explicitně neimportoval, spoléhalo se na náhodné tranzitivní načtení. Pre-existující (ověřeno `git stash`).
**Fix:** `ChatModule` importuje `PushModule`, `WorldsModule` importuje `PendingActionsModule`, `FriendshipsModule` importuje `PendingActionsModule`. Po opravě bootovaly všechny suity; zbylé assertion-faily → `D-NEW-e2e-stale-assertions`.

### D-NEW-e2e-stale-assertions — `worlds-join` + `game-events` e2e zastaralé assertions
**Stav:** ✅ Uzavřeno 2026-05-16.
**Co bylo:** Po opravě wiringu suity bootovaly, ale 6 testů padalo na assertions zastaralých vůči refaktorům:
- **D-053 renumber `WorldRole`** — testy používaly stará čísla (PomocnyPJ 2→4, PJ 3→5, Hrac 0→2). `game-events-role-gating` nastavoval PomocnyPJ na číslo 2 (= dnes Hrac) → 403 místo 201.
- **2.4 JOIN refaktor** — `worlds-join` cílil na zrušený unified-join (open/private svět dnes vyžaduje `POST /access-request`, ne `/join`) + `world_join_request` IkarosMessage (zrušeno dluhem B).
**Fix:** `game-events-role-gating.e2e` — opravena 4 čísla rolí na post-D-053 hodnoty. `worlds-join.e2e` — kompletně přepsán proti 2.4 kontraktu (public→join→Čtenář; open/private→access-request→`WorldAccessRequest`; approve flow; closed→403), 10 testů. Ověřeno proti aktuálnímu service kódu, ne slepě. **Celá e2e suite zelená — 10/10 suit, 73/73 testů.**

### D-NEW-users-toEntity-fields — `users.repository.toEntity` zahazoval 16 polí
**Stav:** ✅ Uzavřeno 2026-05-15 (objeveno při 3.5 D-057).
**Co bylo:** `MongoUsersRepository.toEntity` mapoval jen 21 základních polí — chybělo 16 rozšíření (`isDeleted`, `deletionRequestedAt`, `bannedAt/Until`, `adminPermissions`, `hiddenPresence`, `profileImageUrl`…). `repo.findById` jede přes tento mapper → pole byla `undefined`. `publicProfileV14` tak měl `isTombstone` vždy `false` (tombstone/pending uživatelé se v profilu tiše neskrývali). Unit testy to nechytly — mockují repository.
**Fix:** `toEntity` doplněn o všech 16 polí. Behavior change — tombstone hiding ap. nyní reálně funguje.

### D-NEW-postcount-race — `postCount` diskuze se počítal read-then-write (z 3.4)
**Stav:** ✅ Uzavřeno 2026-05-15.
**Soubory:** `backend/src/modules/ikaros-discussions/` — `repositories/ikaros-discussions.repository.ts`, `ikaros-discussions.service.ts`.
**Co bylo:** `postCount` se aktualizoval načti-pak-zapiš (`update(id, { postCount: discussion.postCount ± 1 })`) v `addPost`/`deletePost`/`resolveReport` → při souběhu hrozila ztracená inkrementace.
**Fix:** Nová repo metoda `adjustPostCount(id, delta, touchActivity?)` — atomický `$inc` (zrcadlí `adjustLikeCount`), volitelně posune `lastActivityUtc`, sklápí záporný `postCount` na 0. Service všechny tři cesty přepnuty na ni; `addPost` ani `resolveReport` už kvůli čítači nečtou diskuzi. Test `addPost` ověřuje `adjustPostCount('disc1', 1, true)`.

### D-071 — GET /ikaros-gallery/:id s nevalidním ObjectId vrací 500 místo 404
**Stav:** ✅ Uzavřeno 2026-05-15.
**Soubory:** `backend/src/modules/ikaros-gallery/repositories/ikaros-gallery.repository.ts` (`findById`), `ikaros-gallery.repository.spec.ts`.
**Co bylo:** Nevalidní `:id` (ne-ObjectId) → `model.findById(id)` vyhodil Mongoose `CastError`, neošetřený → 500 místo 404.
**Fix:** `findById` na začátku validuje `isValidObjectId(id)`; při neplatném vrací `null`. Všechny service metody (`findById`/`update`/`delete`/`submit`/`approve`/`reject`/`rate`) volají `repo.findById` jako první existence-check → jedna oprava pokrývá všechny cesty, výsledek je standardní 404 (`GALLERY_ITEM_NOT_FOUND`). +2 regresní testy.

---

### D-066 — TipTap rich-text editor pro IkarosNews content
**Stav:** ✅ Uzavřeno 2026-05-15 (3.2b dodala `<RichTextEditor>`, retrofit novinek dotažen v navazujícím commitu).
**Co bylo:** Novinky (`NewsFormModal`) měly plain `<textarea>` jako MVP z 3.1; rich-text se měl dodělat s 3.2.
**Fix:** `NewsFormModal` — `<textarea>` nahrazena `<RichTextEditor>` přes `react-hook-form` `Controller`. `NewsCard` — náhled stripuje HTML na plain text (`toExcerpt`), backward-kompatibilní se staršími plain-text novinkami. RichTextEditor dostal `ariaLabel` prop (accessibility + testovatelnost). `NewsFormModal.spec.tsx` mockuje RichTextEditor na textarea.
**Pozn.:** Při retrofitu objeven a opraven latentní bug — `editorProps: undefined` shazoval TipTap `createView` (`Cannot read dispatchTransaction`); nyní vždy `{}`.

---

### D-NEW-role-name-mismatch — BE `SpravceClankuu` vs FE `SpravceClanku`
**Stav:** ✅ Uzavřeno 2026-05-15.
**Co bylo:** BE enum měl překlepy v názvech (`SpravceClankuu` dvojité „u", `SpravceDisukzi` přehozené „su"); FE enum měl opravené názvy. Numerické hodnoty se shodovaly (runtime OK), ale názvy se lišily.
**Fix:** BE enum `UserRole` přejmenován na `SpravceClanku` / `SpravceDiskuzi` (7 souborů, hodnoty 10/12 zachovány). DB data + JWT beze změny. BE 1017 testů zelených.

---

### D-NEW-touch-targets — Malé touch targety na mobilu
**Stav:** ✅ Uzavřeno 2026-05-15.
**Co bylo:** 3.2 filtr-chipy a rating hvězdy byly na mobilu pod 44×44 px.
**Fix:** `@media (max-width: 768px)` — `.chip`/`.chipActive` (ArticlesPage + ArticleEditorPage) `min-height: 44px`; `.rateBtn` (ArticleDetailPage) `min-width/height: 44px`.

---

### D-065 — Legacy `isActive` field na IkarosNews schemě
**Stav:** ✅ Uzavřeno 2026-05-15.
**Soubory:** `backend/src/modules/ikaros-news/schemas/ikaros-news.schema.ts`, `interfaces/ikaros-news.interface.ts`, `repositories/ikaros-news.repository.ts`, `ikaros-news.service.ts`, `repositories/ikaros-news.repository.spec.ts`, `ikaros-news.service.spec.ts`, FE: `src/shared/types/index.ts`, 5 testů.
**Co bylo:** Legacy boolean `isActive` (default `true`) zůstával na schemě po zavedení nového `archived` flagu v 3.1. Pole se nikde nenastavovalo na `false`, ale v `buildFilter` se defensivně přidávalo `isActive: true` do každého MongoDB query. Dead code + cognitive load.
**Fix:** (1) Schema: odstraněno `@Prop isActive`. (2) Interface (entity + response): odstraněno pole. (3) Repository toEntity: nečte `isActive`. (4) Repository buildFilter: zjednodušeno — `active` → `{archived: {$ne: true}}`, `archived` → `{archived: true}`, `all` → `{}`. (5) Service create: neukládá `isActive`. (6) Service joinAuthorNames: nevrací v response. (7) FE `IkarosNews` type: odstraněno pole.
**Data migrace:** Žádná — orphan `isActive` v existujících Mongo dokumentech není problém (MongoDB schema-less, pole ignorováno).
**Tests:** BE 46/46 + FE 427/427 (žádné regrese, jen mock data zbavena `isActive: true`).

---

### D-068 — IkarosNews paginace `?limit=&offset=` + `/count` endpoint
**Stav:** ✅ Uzavřeno 2026-05-15, commit `584946d0`.
**Soubory:** `backend/src/modules/ikaros-news/ikaros-news.controller.ts`, `ikaros-news.service.ts`, `repositories/ikaros-news.repository.ts`, `interfaces/ikaros-news-repository.interface.ts`.
**Co bylo:** Dashboard 2.1 sekce Novinky načítala plný list bez paginace (`data.slice(0,5)` na FE). Tento dluh byl původně sledován v `roadmap-fe.md` jako **D-NEW2 z 2.1**. PJ ho rozdělal jako součást nějaké session, kód byl uncommitted v ikaros-news/. Při 3.1 spec auditu byl objeven a commitnut samostatně před fází A.
**Fix:** `parsePositiveInt` helper s `max=100`. `GET ?limit=&offset=` + samostatný `GET /count` endpoint (Nest-friendly místo X-Total-Count headeru). Repository `findActive(opts?)` + `countActive()`. BC zachována — bez query params se chová jako dříve.
**Pozn.:** Číslo **D-068** zvoleno k vyhnutí kolizi — původní komment v kódu (PJ rozdělaná práce) odkazoval na `D-061`, ale to číslo už bylo zabráno otevřeným dluhem „Mongo replica set pro atomické transakce v approveAccessRequest" (sekce „Otevřené" výše). Při rebrandu 3.1 byl label v kódu sjednocen na **D-068**.

---

### D-069 — IkarosNews authz: zúžení z `WorldRole.PJ` na Admin/Superadmin
**Stav:** ✅ Uzavřeno 2026-05-15, commit `584946d0`.
**Soubory:** `backend/src/modules/ikaros-news/ikaros-news.service.ts` (`assertCanWrite`), `ikaros-news.controller.ts` (ApiOperation summary), `ikaros-news.service.spec.ts` (test cases).
**Co bylo:** BE `assertCanWrite(role)` měl podmínku `role > UserRole.PJ`, což pouštělo `WorldRole.PJ` (world-scoped role) k vytváření/mazání platformového obsahu. Sémantická chyba — Ikaros novinky jsou globální platforma, PJ je world role. Sledováno jako **D-NEW3 z 3.1a**.
**Fix:** Zúžení na `role !== Admin && role !== Superadmin → 403`. Strukturované error code `FORBIDDEN_PLATFORM_ROLE` a `IKAROS_NEWS_NOT_FOUND` (D-009 konvence). Spec testy přejmenovány „PJ NESMÍ vytvořit/smazat" (D-069 label).
**Pozn.:** Číslo **D-069** zvoleno k vyhnutí kolizi — původní komment v kódu (PJ rozdělaná práce) odkazoval na `D-063`, ale to bylo zabráno otevřeným dluhem „Anon viewing public/open světů" (sekce „Otevřené" výše). Při rebrandu 3.1 byl label v kódu sjednocen na **D-069**.
**Navazující:** 3.1 přidalo `PATCH`, `POST /:id/archive`, `POST /:id/unarchive` endpointy — všechny dědí stejný `assertCanWrite`.

---

## Částečně řešené (zbývající práce)

### D-009 — BE `code` field v error responses (DOKONČENO 2026-05-14)
**Stav:** **0 zbývajících** plain string exceptions v `backend/src` — ověřeno greepem.
**Historie:**
- **Batch 1** (1.3a): 7 míst (ConflictException codes).
- **Batch 2** (post-1.3b, 2026-05-12): 350 exceptions batch transform script → 27 service souborů.
- **Batch 3** (2026-05-14, várka A): 5 menších modulů — `universe`, `calendars`, `npc-templates`, `dungeon-maps`, `emotes` (vč. template-literal). +3 z D-063 šťouchu: `world-currencies` ×2 + `ikaros-news`.
- **Batch 4** (2026-05-14, várka B): `world-calendar-config` (5), `sounds` (15), `world-news` (10 vč. 2 multi-line).
- **Batch 5** (2026-05-14, finální sweep): `chat` (36), `pages` (12), `maps` (12), `character-subdocs` (12), `timeline` (11), `characters` (10), `ikaros-articles` (16), `ikaros-discussions` (16), `ikaros-gallery` (16), `world-weather` (16), `users.service` (14), `ikaros-messages` (8), `auth.service` (7), `campaign.service` (24), `users.controller` (8), `world-currencies` (5 zbylých), `map-templates.controller` (5), `worlds.controller` (2), `legacy-calenders.controller` (2), `upload.controller` (2), `campaign.controller` (1), `game-events.controller` (1), `global-chat.service` (1), `system-presets.controller` (1), `admin.guard` (1). Celkem **~240 míst** přes 25 souborů, **BE 942/942 testů zelených**, tsc čistý.
**Codes konvence (etablovaná):** `{MODULE}_{ENTITY}_NOT_FOUND` (např. `CAMPAIGN_SUBJECT_NOT_FOUND`, `MAP_SCENE_NOT_FOUND`), `{MODULE}_FORBIDDEN` / `{MODULE}_ACCESS_DENIED` pro auth, sdílené `WORLD_NOT_FOUND`, `USER_NOT_FOUND`, `NOT_WORLD_MEMBER`, `PENDING_MEMBERSHIP`, `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN` napříč moduly.
**Drobné nesrovnalosti k diskuzi:** `map-templates.controller.ts:68/85/97` házelo `NotFoundException` pro forbidden — *sémanticky špatně*, nesahal jsem (mimo D-009 scope). Při dalším šťouchu do `maps` přepsat na `ForbiddenException` (+ `CAMPAIGN_FORBIDDEN` pattern).

---

### D-016 — BE auth audit (rolling)
**Soubor:** `Projekt-ikaros/backend/src/modules/{worlds,npc-templates,maps,universe}/*.controller.ts`
**Stav:** **4 read-modules** dostaly `OptionalJwtAuthGuard` na findAll/findBySlug/findOne (worlds), findAll/findOne (npc-templates), findByWorld/findActive/findById (maps), findByWorld (universe). Write endpointy v timeline / world-weather / world-calendar-config už guards měly před auditem.
**Zbývá ověřit:** `world-news` (PUBLIC catalog — záměr), `users.profile/:id` a `users.exists/:username` (PUBLIC pro registrační UX — záměr), `map-templates` (PUBLIC katalog — záměr), `IkarosNews` (PUBLIC — záměr), `system-presets` (PUBLIC — záměr). Tyto endpointy ZŮSTÁVÁJÍ veřejné — ne security holes.
**Zbývá zvážit:** Variantu B (`APP_GUARD` + `@Public()` decorator) pro vynucený opt-in security model — samostatný spec po 1.3c.
