# Technické dluhy

> Soubor obsahuje **pouze otevřené a částečně řešené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-05-16.

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

## Částečně řešené (zbývající práce)

### D-016 — BE auth audit (rolling)
**Soubor:** `Projekt-ikaros/backend/src/modules/{worlds,npc-templates,maps,universe}/*.controller.ts`
**Stav:** **4 read-modules** dostaly `OptionalJwtAuthGuard` na findAll/findBySlug/findOne (worlds), findAll/findOne (npc-templates), findByWorld/findActive/findById (maps), findByWorld (universe). Write endpointy v timeline / world-weather / world-calendar-config už guards měly před auditem.
**Zbývá ověřit:** `world-news` (PUBLIC catalog — záměr), `users.profile/:id` a `users.exists/:username` (PUBLIC pro registrační UX — záměr), `map-templates` (PUBLIC katalog — záměr), `IkarosNews` (PUBLIC — záměr), `system-presets` (PUBLIC — záměr). Tyto endpointy ZŮSTÁVÁJÍ veřejné — ne security holes.
**Zbývá zvážit:** Variantu B (`APP_GUARD` + `@Public()` decorator) pro vynucený opt-in security model — samostatný spec po 1.3c.
