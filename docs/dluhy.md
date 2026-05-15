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

### D-057 — Friend-only privacy v profilu / poště
**Kontext:** Spec 1.8 §8 — privacy úroveň „jen přátelé vidí můj profil / mohou mi psát"
mimo rozsah 1.8. Závisí na 3.5 (pošta) a možná na rozšíření 1.4 privacy.
**Dopad:** Veřejný profil je dostupný každému přihlášenému, nezávisle na friendship statu.
Pošta (3.5) když přijde, bude default „kdokoliv mi může psát".
**Řešení:** Spec až s 3.5. Pole `User.profileVisibility: 'public' | 'friends'` + filtr
v `usePublicUserProfile` / `usePublicUsers` (pokud requester není friend → 403).
**Kdy:** Společně se spec 3.5.

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

### D-065 — Legacy `isActive` field na IkarosNews schemě (3.1 → fast-follow)
**Soubory:** `backend/src/modules/ikaros-news/schemas/ikaros-news.schema.ts`, `ikaros-news.repository.ts` (buildFilter), `ikaros-news.interface.ts`
**Stav:** Otevřený — 3.1 zavedlo nové pole `archived`, ale legacy `isActive` zůstává jako defensive filter.
**Kontext:** `isActive: true` se v `findByScope` filtru kombinuje s `archived` filtrem. `isActive: false` se nikde nenastavuje (žádný kód ho neumí toggle). Pole je dead code.
**Dopad:** Mírný — extra `{isActive: true}` v každém query, zbytečný cognitive load při čtení schemy.
**Řešení:** (1) Migrace dat: vyhodit `isActive: false` dokumenty (pokud nějaké jsou) — nebo set `isActive: true` všem. (2) Odstranit pole ze schemy + interface. (3) Odstranit z buildFilter. (4) Update testů.
**Kdy:** Vlastní mini-PR, low priority.

---

### D-066 — TipTap rich-text editor pro IkarosNews content (3.1 → 3.2)
**Soubory:** `src/features/ikaros/components/NewsFormModal.tsx` (textarea), `src/features/ikaros/pages/DashboardPage/components/NewsCard.tsx` (render)
**Stav:** Otevřený — 3.1 dodáno s plain `<textarea>` jako MVP.
**Kontext:** Novinka má strukturovaný obsah (paragrafy, odkazy, tučně) — plain text limituje formátování. Rozhodnuto v 3.1a, plán bylo dodělat s 3.2 (Články), kde TipTap stejně přijde.
**Dopad:** Autor nemůže formátovat obsah; čtenář vidí plain text bez vizuální hierarchie.
**Řešení:** (1) Přidat `@tiptap/react` + extensions (StarterKit, Link, Image). (2) Replace `<textarea>` v `NewsFormModal` za `<TipTapEditor>`. (3) Migrate stávající content z plaintextu na JSON / HTML (může zůstat plain — TipTap si poradí). (4) Render v `NewsCard` přes TipTap render nebo HTML output.
**Kdy:** Společně s 3.2 (články) — sdílený TipTap setup.

---

### D-067 — Audit log UI pro Ikaros novinky (archive/delete)
**Soubory:** `backend/src/modules/ikaros-news/schemas/ikaros-news.schema.ts` (data už jsou), FE: nová audit komponenta nebo rozšíření existujícího AuditLogTab.
**Stav:** Otevřený — data se ukládají (`archivedAtUtc`, `archivedByUserId`), ale UI je nezobrazuje.
**Kontext:** 3.1 archive endpoint nastavuje audit fields. Admin/Superadmin by mohl chtít vidět „kdo a kdy zarchivoval/smazal novinku" pro accountability. Pro hard delete (DELETE) ale chybí audit log — záznam zmizí z DB.
**Dopad:** Bez audit logu nelze dohledat, kdo provedl změnu. Pro malý team (Tyky + 1-2 admini) zatím nekritické.
**Řešení:** (1) Hard delete → log do AdminAuditLog před `findByIdAndDelete`. (2) Archive/unarchive také log do AuditLog (i když data jsou na entitě, AuditLog je centrální view). (3) FE: rozšířit AuditLogTab v `/ikaros/uzivatele` o filter na entity typu „IkarosNews".
**Kdy:** Až bude širší team admin nebo se objeví incident dohledávání. Low priority.

---

## Vyřešené (historie, zachovat pro audit trail)

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
