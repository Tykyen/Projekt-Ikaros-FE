# Technické dluhy

> **Souhrn k 2026-05-13 (post-1.8 cleanup batch + D-055 + D-056):**
> - **Uzavřené v cleanup batch po 1.8:** **D-041** (`AccountCleanupCron.hardDeleteOne` volá `IFriendshipsRepository.deleteAllByUser` jako součást tombstone pipeline — counterparti nemají orphan „Smazaný účet" karty), **D-059** (4 výskyty `window.confirm()` v `UsersTable` / `BulkToolbar` / `RequestsTable` zrefaktorovány na sdílený `<ConfirmDialog>` — vizuální konzistence, theme-aware, focus management z Modal).
> - **Uzavřeno 2026-05-13:** **D-055 — Block flow** (spec/plan v `_side-tasks/spec-d055-block-flow.md` / `plan-d055-block-flow.md`). BE: `POST/DELETE /api/friends/block/:userId`, `GET /api/friends/blocks`, rozšíření `sendRequest` + `getStatusForPair` o blocked větve, nová helper `isBlockedBetween()` pro forward-compat 3.5+. Anti-stalk asymetrie: blokovaný vidí `kind='none'` + `sendRequest` vrací 404 `USER_NOT_FOUND`. Q4: po unblock čistý slate (žádný residual cooldown). FE: `PublicProfileActions` kebab menu „Blokovat" + stav `blocked_by_me`, `FriendsTab` třetí collapsible sekce „Zablokovaní" (default collapsed), nové hooky `useBlockUser/useUnblockUser/useBlockedFriends`, `BlockedRequestCard` row pattern. Testy: +16 BE service + 1 BE repo + 9 BE e2e + 3 FE = 29 nových.
> - **Uzavřeno 2026-05-13:** **D-056 — Cool-down konfigurovatelný + audit**. BE: nový `AdminFriendshipsController` + `AdminFriendshipsService` v admin modulu (`GET /api/admin/friendships/by-pair`, `GET /api/admin/friendships?userId=X`, `POST /api/admin/friendships/:id/reset-cooldown`). `AdminAuditAction` rozšířen o `'FRIENDSHIP_COOLDOWN_RESET'`. FE: 5. tab „Friendship debug" v `UsersPage` (visible jen Admin/Superadmin) s 2 módy lookupu (by-pair / by-user), full friendship detail + Reset cooldown akce s confirm. Testy: +5 BE service + 2 FE = 7 nových.
> - **Stále otevřené z 1.8:** D-057 (friend-only privacy — čeká na 3.5).
>
> **Souhrn k 2026-05-13 (po 1.8 — Přátelé):**
> - **Uzavřené v 1.8:** placeholder z 1.4 (`FriendsTab`, `PublicProfileActions` Add friend tlačítko, `ZpracovatTab` non-admin placeholder). `ZpracovatTab` přepsán na agregátor přes všechny `PendingActionType` rendery (Q3). Nové sdílené primitivy `<ConfirmDialog>` + `<KebabMenu>` v `shared/ui`.
> - **Pre-existing fix (mimo spec 1.8):** `SecurityTokenSchema.type` decorator dostal `type: String` (blokoval AppModule loading v e2e testech).
> - **Nové dluhy (otevřené):** D-055 (block flow), D-056 (cool-down konfigurovatelný + audit), D-057 (friend-only privacy). D-058 (KebabMenu primitiv) **uzavřen rovnou** v 1.8. **D-041 + D-059** uzavřené v post-1.8 cleanup batch (viz výše).
>
> **Souhrn k 2026-05-12 (po 1.7 — mailer + reset hesla + email verify + email change):**
> - **Uzavřené v 1.7:** **D-006** (reset hesla — full flow), **D-012** (e-mail verifikace full flow), **D-026** (notifikace o username žádosti přes `MailerEventListener`), **D-036** (notifikace o account deletion), **D-037** (reset hesla současně zruší pending soft-delete + vrátí `revertablePromotions`)
> - **Mailer stack:** Resend SMTP přes `@nestjs-modules/mailer` + `nodemailer`, stub fallback pokud `MAIL_PASS` chybí (dev mode), 6 Handlebars šablon, `SecurityTokensService` univerzální token pattern (sha256 hash v DB, TTL index)

> **Souhrn k 2026-05-12 (po 1.4 + cleanup batch):**
> - **Uzavřené v 1.4:** D-029 (admin detail link uživatele → vyřešen „Otevřít v administraci" na public profilu), D-040 *principiálně* (tombstone v public adresáři nezobrazujeme; integrace do obsahu řeší fáze 3.x/6.x), D-044 *částečně* (Mongo compound indexy pro `findPublicPaginated`)
> - **Uzavřené v 1.4 cleanup batch (2026-05-12):** **D-042** (GDPR data export endpoint `GET /users/me/data-export` + `DataExportModule` s `IDataExportProvider` registry + první konkrétní `UserProfileExportProvider`), **D-043** (tombstone retention policy — druhá fáze `AccountCleanupCron.removeExpiredTombstones`, daily 04:00, ENV `TOMBSTONE_RETENTION_DAYS` default 5 let), **D-046** (per-theme RoleChip overrides pro kyberpunk + nemrtvi), **D-047** (Storybook stories pro RoleChip, UserCard, PendingActionCard)
> - **Uzavřené dříve:** D-001, D-002, D-003, D-004, D-005, D-007, D-008, D-009 (batch 1+2, ~95% pokrytí), D-010, D-011 (honeypot část), D-013, D-014, D-015, D-016 (částečně), D-018, D-020, D-021 (header avatar xs), D-022 (anon mobile fix), D-023 (timed ban), D-024 (audit log), D-025 (bulk akce), D-027 (cooldown env), D-028 (in-memory cache), D-030 (toast po login), D-031 (Zakaz deprecate), D-032 (audit canManageAdmins + 1.3b interní enum mismatch), D-033 (granular perm framework), D-034 (auto-promote Pomocného PJ — díky `WorldRole.PomocnyPJ`), **D-034b (revert PJ handover — info modal po reaktivaci)**, **D-035 (audit log delete akcí — event-driven přes EventEmitter)**, **D-038 (hold configurable — ENV `DELETION_HOLD_DAYS`)**, **D-039 (dev trigger-cleanup endpoint)**, severske-runy reducedMotion fix
> - **Stále otevřené (čekají na PJ rozhodnutí / externí závislost):** D-011 (full captcha provider), Resend domain verification (mailer projde, ale prod e-maily vyžadují verified domain — PJ ji založí před deployem; do té doby stub fallback)
> - **Zbývající z 1.3b (čekají na externí infru / fáze):** D-026 (email notif — čeká 1.7), D-028 Redis varianta (multi-instance)
> - **Zbývající z 1.3c:** D-041 (Friendship hard-delete při tombstone — 1.8). D-036 + D-037 uzavřené v 1.7.
> - **Z 1.4 stále otevřené:** D-044 *full text-index až 10k+ uživatelů*, D-045 (privacy toggle — diskuse pro 1.7+)
> - **Uzavřené v 1.5 cleanup batch (2026-05-12):** **D-049** (idle stav 3-stavový — FE activity tracker + BE registry idle aggregate), **D-050** (last-seen tooltip — `PublicUserProfile.lastSeenAt` + `relativeTimeCs` util + tooltip v `PublicProfileHeader`; null pro hidden/tombstone), **D-052** (privacy „neviditelný" mód — `User.hiddenPresence` flag + `PrivacySection` v profilu + gateway respektuje při handshake)
> - **Pre-existing cleanup (2026-05-12):** `RoleStar.tsx` hardcoded barvy → `--role-star-*` tokeny; `IkarosLayout` chevrons SVG `#d4111c` → `currentColor` + `--theme-hellfire-bright`; `PendingActionCard.stories.tsx` TS generic cast pro Storybook
> - **Nové z 1.5 (otevřené):** D-051 (Redis adapter pro presence registry — multi-instance deploy)
>
> Drobné nedořešené části jsou zaznamenány u jednotlivých záznamů níže.

## Otevřené z 1.3c (čekající na externí infru / fáze)

### D-040 — Tombstone integrace do chat / článek / galerie / diskuze renderingu
**Kontext:** 1.3c poskytuje `<UserAvatar deleted />` primitive. Integrace do konkrétních komponent přijde s pipelines těch fází.
**Řešení:** Fáze 3.x (články, galerie, diskuze) + 4.x/6.x (chat) — autor s `isDeleted=true` rendrovat s `<UserAvatar deleted />` + zobrazit "Smazaný účet" jako displayName tooltip.


---

## Otevřené

### D-028 (zbývající Redis varianta) — Cache pro `JwtStrategy.validate` ban check
**Kontext:** In-memory cache uzavřena (viz Uzavřené níže), single-instance funguje plně. Pro multi-instance deployu nutno swap na Redis pub/sub.
**Řešení:** Vyměnit `UserBanCacheService` Map za Redis client (`ioredis`); invalidate přes pub/sub channel `user-ban-invalidate`.

### D-044 — Mongo full text-index pro public adresář (částečně uzavřeno 1.4)
**Kontext:** 1.4 zavedl `findPublicPaginated` se substring regex search nad `usernameLower` + `displayName`. Compound index `{ isDeleted, deletionRequestedAt, createdAt }` + `displayName` index přidány. Pro 100k+ uživatelů by pak bylo vhodné full text index.
**Řešení:** Až DB přeroste ~10k uživatelů, přidat `UserSchema.index({ usernameLower: 'text', displayName: 'text' })` + přepnout query z `$regex` na `$text`. Měřit perfomance předtím.

### D-045 — Privacy toggle „skrýt mě v adresáři"
**Kontext:** 1.4 adresář vidí jen Admin/Superadmin, takže privacy concern je nízký. Až přijde širší použití (1.8 přátele iniciace přes adresář), uživatel by měl mít opt-out.
**Řešení:** `User.hiddenInDirectory: boolean` flag + filter ve `findPublicPaginated`. Diskuse pro 1.7+.

### D-048 — HelpPage content drift
**Kontext:** Krok 3.6 (Nápověda na `/ikaros/napoveda`) dokumentuje stav platformy k 2026-05-12. Sekce „Stránky" a „FAQ" obsahují ✅/🚧 značky napojené na aktuální fáze. Při každé doručené fázi musí někdo aktualizovat odpovídající položky, jinak nápověda přestane být pravdivá.
**Řešení:** Do PR checklistu fází 1.5 / 1.7 / 1.8 / 2.x / 3.x přidat položku „aktualizovat HelpPage (sekce Stránky + případně FAQ)". Připadnu i automatizace přes kontrolu obsahu vs roadmap-fe.md (ale stačí discipline v review).

### D-051 — Redis adapter pro `OnlinePresenceRegistry`
**Kontext:** 1.5 registr je in-memory Map<userId, RegistryEntry>. Single-instance only — při multi-instance deployu by každá instance měla vlastní obraz a `presence:update` broadcast by se nepropagoval mezi instancemi.
**Řešení:** Swap `OnlinePresenceRegistry` Map za Redis hash + použít `@socket.io/redis-adapter` pro multi-instance broadcast. Analogicky k D-028 (cache pro ban check). Až bude potřeba škálování.

*D-053 uzavřen 2026-05-13 — Cross-repo role architecture cleanup. `UserRole` zúžen na 6
globálních hodnot (Sa/Admin/Ikarus/Spr.D/Spr.Č/Spr.G). `WorldRole` rozšířen o `Ctenar` a
renumberován 0–5 (Zadatel/Ctenar/Hrac/Korektor/PomocnyPJ/PJ); `Pending` přejmenován na `Zadatel`.
BE migrační skript `migrate:d053` (idempotentní, --dry-run) přemapuje historické DB hodnoty.
Default user role změněn `Hrac → Ikarus` (auth.service, admin.service, schema). Endpointy
`@Roles(UserRole.PJ)` v `admin/recent-pages` zúženy na Sa/Admin (PJ-in-any-world variantu
vyřazena). Spec: `docs/arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md`,
plán: `docs/arch/phase-1/_side-tasks/plan-d053-role-architecture-cleanup.md`.

Otevřený follow-up **D-053b** — per-world PJ check v maps.service / FE per-world admin
routes je dočasně zúžen na Sa/Admin; chce membership-based guard (`WorldMembership.role >= PJ`
v daném světě) pro plné obnovení world-PJ pravomocí přes UI.*

### D-053b — Per-world PJ access v UI/BE check (follow-up D-053)
**Kontext:** D-053 odstranil `UserRole.PJ` z globálního enumu. Místa, která historicky
spoléhala na „PJ globally", jsou dočasně zúžena na Sa/Admin (`maps.service.ts`
moveToken/removeToken, FE `router.tsx` per-world admin routes `admin/stranky`,
`admin/adresar-postav`). World PJ tímto **ztratil přístup** přes tyto endpointy.
**Dopad:** Sa/Admin operuje beze změny; world PJ daného světa musí ad-hoc požádat staff
pro tokenové akce / admin stránky světa, dokud není membership-based guard hotov.
**Řešení:**
- BE: rozšířit `maps.service.moveToken/removeToken` o `worldId` param + membership lookup
  (`WorldMembership.role >= WorldRole.PJ` v daném světě → povolit).
- FE: nahradit `RoleGuard roles={[Sa, Admin]}` v per-world routes komponentou, která navíc
  konzultuje `WorldContext.userRole` (membership-based).
**Kdy:** Před fází 5 (world layer), nebo při explicitní stížnosti world PJ.

*D-056 uzavřen 2026-05-13 — admin override per-pair cooldownu + audit log entry.*

*BE:*
- *Nový `AdminFriendshipsController` v admin modulu — 3 endpointy (`GET /api/admin/friendships/by-pair?userA=X&userB=Y`, `GET /api/admin/friendships?userId=X`, `POST /api/admin/friendships/:friendshipId/reset-cooldown`)*
- *`AdminFriendshipsService` s `findByPair` / `listByUser` / `resetCooldown` (poslední smaže `lastDeclinedAt` + `lastDeclinedById` na null a zaloguje akci)*
- *`AdminAuditAction` rozšířen o `'FRIENDSHIP_COOLDOWN_RESET'` (schema + interface) — admin audit trail*
- *Admin/Superadmin only, Throttle 60/min pro GET, 30/min pro reset*
- *409 `NO_COOLDOWN` pokud friendship nemá aktivní cooldown (idempotency check)*

*FE:*
- *`AdminAuditAction` na FE rozšířen, `AuditLogTab` má label „Reset friendship cooldownu"*
- *Nový tab `friendship-debug` v `UsersPage` (5. tab, visible jen Admin/Superadmin) — refactor `visibleTabsForRole` z 4 → 5 tabů pro adminy*
- *Komponenta `FriendshipDebugTab` se 2 módy: lookup podle páru (2 user IDs) + lookup podle jednoho usera. Každý friendship má detail (status, requestedBy, lastDeclined, blockedBy, accepted, updated) + 3 akce (Profil A / Profil B / Reset cooldown s `ConfirmDialog`)*
- *Hooky `useAdminFriendshipByPair`, `useAdminFriendshipsByUser`, `useAdminResetCooldown` v `src/features/admin/friendships/`*
- *Tlačítko „Reset cooldown" disabled pokud `lastDeclinedAt === null` (nemá smysl resetovat)*

*Mimo rozsah:* per-user/per-pair cooldown override (např. „premium uživatelé"), admin dashboard s aggregate stats nad declines. Per-user override není v plánu — globální `FRIEND_REQUEST_COOLDOWN_HOURS` env stačí.

*Testy:* +5 BE service unit (`admin-friendships.service.spec.ts`) + 2 FE (`useAdminResetCooldown.spec.tsx`) + update `usersPageTabs.helpers.spec.ts` (4→5 tabů). Celkem 1031 BE ✓, 281 FE ✓, 22 e2e ✓.

### D-057 — Friend-only privacy v profilu / poště
**Kontext:** Spec 1.8 §8 — privacy úroveň „jen přátelé vidí můj profil / mohou mi psát"
mimo rozsah 1.8. Závisí na 3.5 (pošta) a možná na rozšíření 1.4 privacy.
**Dopad:** Veřejný profil je dostupný každému přihlášenému, nezávisle na friendship statu.
Pošta (3.5) když přijde, bude default „kdokoliv mi může psát".
**Řešení:** Spec až s 3.5. Pole `User.profileVisibility: 'public' | 'friends'` + filtr
v `usePublicUserProfile` / `usePublicUsers` (pokud requester není friend → 403).
**Kdy:** Společně se spec 3.5.

### D-011 — Captcha provider integrace
**Soubor:** `src/components/auth/RegisterModal.tsx` + BE `auth` modul
**Stav:** Honeypot field implementován (FE skryté pole + BE DTO `@MaxLength(0)` validace v `RegisterDto`). Plný captcha provider (hCaptcha / Turnstile) **stále chybí**.
**Dopad zbytkový:** Honeypot odfiltruje naivní boty, ale dedikované scraper boty s headless browserem ho obejdou. Pro produkci nezbytné dodat reálnou captchu.
**Blokátor:** PJ musí rozhodnout provider (hCaptcha free + GDPR-friendly / Cloudflare Turnstile / Friendly Captcha) a založit účet (site key + secret v `.env`).
**Kdy:** Před prod nasazením, samostatný spec.

---

## Částečně řešené (zbývající práce)

### D-009 — BE `code` field v error responses (rolling, většina hotová)
**Soubor:** `Projekt-ikaros/backend/src/modules/**/*.service.ts`
**Stav:** **Batch 1** (1.3a): 7 míst (ConflictException codes). **Batch 2** (post-1.3b, 2026-05-12): 350 exceptions (NotFound/Forbidden/BadRequest) batch transform script → 27 service souborů. **Hotovo viz Uzavřené.**
**Zbývá:** ~19 exceptions s komplexnějšími patterns (template literals s ${}, multi-line msg, nested expressions). Doplnit při dalším šťouchu do těchto míst.

---

### D-016 — BE auth audit (rolling)
**Soubor:** `Projekt-ikaros/backend/src/modules/{worlds,npc-templates,maps,universe}/*.controller.ts`
**Stav:** **4 read-modules** dostaly `OptionalJwtAuthGuard` na findAll/findBySlug/findOne (worlds), findAll/findOne (npc-templates), findByWorld/findActive/findById (maps), findByWorld (universe). Write endpointy v timeline / world-weather / world-calendar-config už guards měly před auditem.
**Zbývá ověřit:** `world-news` (PUBLIC catalog — záměr), `users.profile/:id` a `users.exists/:username` (PUBLIC pro registrační UX — záměr), `map-templates` (PUBLIC katalog — záměr), `IkarosNews` (PUBLIC — záměr), `system-presets` (PUBLIC — záměr). Tyto endpointy ZŮSTÁVÁJÍ veřejné — ne security holes.
**Zbývá zvážit:** Variantu B (`APP_GUARD` + `@Public()` decorator) pro vynucený opt-in security model — samostatný spec po 1.3c.
**Soubor:** `Projekt-ikaros/backend/src/modules/{timeline,world-weather,world-calendar-config,maps,map-templates,worlds,users,...}/*.controller.ts`
**Problém:** Audit při D-008 (1.2g) odhalil, že **43 endpointů** v BE nemá žádný JWT guard. Některé jsou legitně public (`auth/login`, `auth/register`, `auth/refresh`, `IkarosNews findAll`, `push/vapid-public-key`, `system-presets`), ale **většina pravděpodobných security holes**:
- `timeline.create/update/delete` — kdokoli může editovat timeline ve světech
- `world-weather.create/update/delete/generate/setCurrentWeather/broadcast` — kdokoli může měnit počasí
- `world-calendar-config.put` — kdokoli může měnit kalendářovou konfiguraci
- `worlds.findAll/findBySlug/findOne/getMembers` — list/detail světů (může být legit public, vyžaduje rozhodnutí)
- `users.profile/:id`, `users.exists/:username` — public profil + check (legit pro registrační UX, ale potenciální user enumeration)
- `npc-templates.findAll/findOne` — read templates (asi auth?)
- `maps.findByWorld/findActive/findById`, `map-templates.findAll/findById` — read maps (auth?)

**Dopad:** Vysoký — neoprávněná úprava produkčních dat ve světech. Každý endpoint vyžaduje per-endpoint rozhodnutí (public vs auth), ne mechanický refactor.

**Řešení:** Plný BE audit. Pro každý unguarded endpoint rozhodnout: (a) přidat `@UseGuards(JwtAuthGuard)` pokud má být chráněný; (b) nechat bez guardu pokud má být public (a explicitně doložit komentářem v controlleru). Po dokončení zvážit přechod na variantu B (`APP_GUARD` + `@Public()` decorator) pro vynucený opt-in security model.

**Kdy:** Před produkčním nasazením. Vyžaduje aktivní review s PJ, ne autonomní implementace. Samostatný spec. **Blokátor:** Per-endpoint rozhodnutí (~43 voleb) musí dodat PJ — Claude nemůže autonomně rozhodnout, které world endpointy mají být public (např. veřejný katalog světů) vs chráněné. Doporučuju otevřít samostatný spec `1.3d-be-auth-audit.md` po dokončení 1.3b/c, kde projdeme ekndpoint po endpointu.

## Uzavřené

### D-042 — GDPR data export endpoint (právo na přenositelnost)
**Soubory:** `backend/src/modules/data-export/` (nový modul — `data-export.module.ts`, `data-export.service.ts`, `data-export.controller.ts`, `data-export-provider.interface.ts`), `backend/src/modules/users/providers/user-profile-export.provider.ts`, `backend/src/modules/users/users.module.ts`, `backend/src/app.module.ts`, `backend/src/modules/data-export/data-export.service.spec.ts`
**Opraveno v:** 1.4 cleanup batch (2026-05-12). Nový global `DataExportModule` s `IDataExportProvider` registry — stejný princip jako `PendingActionsService` z 1.4. Endpoint `GET /api/users/me/data-export` (auth, throttle 3/hour). Agreguje data napříč registrovanými providery do JSON dumpu s metadaty (`exportedAt`, `userId`, `schemaVersion: 1`, `sections[]`). První konkrétní provider `UserProfileExportProvider` (profile, character, worldMemberships, preferences). Audit event `user.data.exported`. Budoucí moduly (3.x články/galerie/diskuze, 3.5 pošta, 4.x chat, 1.8 friendships) zaregistrují svoje providery v `onApplicationBootstrap` a tím rozšíří export bez zásahu do core endpointu. 8 unit testů pro `DataExportService` (registry, aggregation, error isolation, audit event).

---

### D-043 — Tombstone retention policy
**Soubory:** `backend/src/modules/users/services/account-cleanup.cron.ts` (rozšíření), `backend/src/modules/users/services/account-cleanup.cron.spec.ts` (nový), `backend/src/modules/users/users.repository.ts`, `backend/src/modules/users/interfaces/users-repository.interface.ts`, `backend/src/app.module.ts` (Joi schema)
**Opraveno v:** 1.4 cleanup batch (2026-05-12). Druhá retention fáze v `AccountCleanupCron.removeExpiredTombstones` — daily 04:00 Europe/Prague (1h po hard-delete cronu na 03:00). ENV `TOMBSTONE_RETENTION_DAYS` default 1825 (5 let), minimum 30 dní (sanity check, kratší retention nedává smysl). Nová repo metoda `findExpiredTombstones(cutoff)`. Audit event `user.tombstone.removed`. Po retention dni se username uvolní pro novou registraci (unique index drop). 9 unit testů (ENV override, fallback, sanity check, multi-tombstone batch, error isolation, audit event, empty list).

---

### D-029 — Veřejný profil link z admin tabulky
**Soubory:** `src/features/users/pages/PublicUserProfilePage.tsx`, `src/features/users/components/PublicProfile/PublicProfileActions.tsx`, `src/features/admin/users/components/UsersTab/UsersTable.tsx` (`focus` query param highlight)
**Opraveno v:** 1.4 (2026-05-12). `PublicUserProfilePage` zavedl Admin/Superadmin tlačítko „Otevřít v administraci" → `/ikaros/uzivatele?tab=uzivatele&view=table&focus=:id`. Plus klik na avatar/jméno autora v adresářové kartě vede na `/ikaros/uzivatel/:id` (každý přihlášený, viz spec 1.4 §1.3). Tlačítko skryté pro self (`profileId === me.id`).

---

### D-046 — Per-theme RoleChip overrides
**Soubory:** `src/themes/themes/kyberpunk/index.ts`, `src/themes/themes/nemrtvi/index.ts`
**Opraveno v:** 1.4 cleanup batch (2026-05-12). Override CSS proměnných `--role-superadmin-bg/-fg/-ring` atd. v `vars` map každého z dvou skinů. Kyberpunk: neonové varianty (electric yellow / cyan / hot amber / hot magenta / acid green). Nemrtvi: krvavé/hřbitovní tóny (tmavá krev / mahogany / pergamen / nekrotická fialová / hřbitovní mech). Ostatní skiny zůstávají na universal default (`src/themes/_shared/tokens.css`). Polishing dalších skinů se může přidat individuálně bez core změny.

---

### D-047 — Storybook stories pro RoleChip / UserCard / PendingActionCard
**Soubory:** `src/features/users/components/shared/RoleChip.stories.tsx` (nový), `src/features/users/components/tabs/UsersTab/UserCard.stories.tsx` (nový), `src/features/users/components/tabs/ZpracovatTab/PendingActionCard.stories.tsx` (nový)
**Opraveno v:** 1.4 cleanup batch (2026-05-12). RoleChip stories: všech 5 chipů (Superadmin/Admin/3× Spravce) + None pro Hrac/PJ (null render) + Gallery view + Small size. UserCard stories: všechny role variants + edge cases (NoCity, NoDisplayName, SingleWorld 1 svět, ZeroWorlds, WithKebab) + PendingDeletion + TombstoneDeleted overlay. PendingActionCard stories: UsernameRequest variants (default, Resolving, FreshlyCreated, OldRequest 3 dny zpět) + Gallery 2 cards stacked. Připraveno pro budoucí rendery 1.8/2.4/3.x — jen přidat novou story s mock daty.

---

### D-028 (in-memory varianta) — In-memory cache pro ban check
**Soubory:** `backend/src/modules/users/services/user-ban-cache.service.ts` (nový), `users.module.ts`, `auth/strategies/jwt.strategy.ts`, `admin/admin.service.ts`
**Opraveno v:** post-1.3b cleanup (2026-05-12). `UserBanCacheService` — `Map<userId, BanCacheEntry>` s TTL (default 10 s, env `USER_BAN_CACHE_TTL_MS`, 0 = disabled). LRU eviction při překročení 10 000 entries. `JwtStrategy.validate` má fast-path: cache hit + banned + non-expired → throw bez DB hitu; cache miss → DB lookup + populate cache (positive i negative entry). `AdminService.banUser`/`unbanUser` invaliduje cache. Single-instance plné řešení. **Redis varianta pro multi-instance deploy** je tracked jako follow-up D-028 v Otevřených.

---

### D-009 — BE `code` field v error responses (rolling — batch 2)
**Soubory:** 27 BE service souborů napříč moduly (admin, auth, calendars, campaign, character-subdocs, characters, chat, dungeon-maps, emotes, game-events, global-chat, ikaros-articles, ikaros-discussions, ikaros-gallery, ikaros-messages, ikaros-news, maps, npc-templates, pages, sounds, timeline, universe, users, world-calendar-config, world-currencies, world-news, world-weather, worlds)
**Opraveno v:** post-1.3b cleanup (2026-05-12). Batch transform skriptem (`tmp/fix-codes.mjs`) → **350 exceptions** přepsaných z `throw new NotFoundException('msg')` na `throw new NotFoundException({ statusCode: 404, code: '<MODULE>_NOT_FOUND', message: 'msg' })`. Per-module codes: `USER_NOT_FOUND`, `WORLD_NOT_FOUND`, `CHARACTER_NOT_FOUND`, `PAGE_NOT_FOUND`, `ARTICLE_NOT_FOUND`, `DISCUSSION_NOT_FOUND`, `GALLERY_NOT_FOUND`, `CAMPAIGN_ENTITY_NOT_FOUND`, `TIMELINE_ENTRY_NOT_FOUND`, `EVENT_NOT_FOUND` atd. Generic `FORBIDDEN` a `BAD_REQUEST` pro ostatní. 816 BE testů zelených po refactoru.

**Zbývá:** ~19 exceptions s složitějšími patterns (template literals, multi-line msg, nested expressions) — minor rolling.

---

### D-025 — Bulk akce v admin tabulce
**Soubory:** `backend/src/modules/admin/dto/bulk-ban.dto.ts`, `bulk-unban.dto.ts`, `bulk-role-change.dto.ts`, `admin.service.ts`, `admin.controller.ts`, `src/features/admin/users/components/UsersTab/BulkToolbar.tsx`, `UsersTable.tsx`, `useAdminUsers.ts`
**Opraveno v:** post-1.3b cleanup (2026-05-12). BE batch endpointy `POST /admin/users/bulk-ban|bulk-unban|bulk-role-change` (max 50 userů per request), per-user hierarchy check uvnitř service, response `{ successful: string[], failed: { userId, code, message }[] }` aby selhání jednoho neblokoval ostatní. FE: checkbox sloupec v UsersTable + select-all v thead + sticky `BulkToolbar` s akcemi Ban/Unban/Změnit roli + modaly s reason a duration dropdown. Toast s počtem `úspěšně/selhalo`.

---

### D-023 — Timed ban (`bannedUntil` + cron auto-unban)
**Soubory:** `backend/src/modules/users/schemas/user.schema.ts`, `users.service.ts` (cron), `users.repository.ts`, `interfaces/users-repository.interface.ts`, `admin/dto/ban-user.dto.ts`, `admin.service.ts`, `auth/strategies/jwt.strategy.ts`, `auth.service.ts`, `src/features/admin/users/components/UsersTab/BanModal.tsx`, `UsersTable.tsx`
**Opraveno v:** post-1.3b cleanup (2026-05-12). Pole `User.bannedUntil: Date | null`. DTO `BanUserDto.durationDays` (0/undefined = trvalý). `AdminService.banUser` computuje `bannedUntil = now + durationDays * 86400_000`. Cron `@Cron(EVERY_HOUR)` v `UsersService.cronAutoUnbanExpired` cleared expired bans. Lazy unban v `JwtStrategy.validate` + `AuthService.login` (instantní pro right-now requesty). FE BanModal: dropdown trvání (trvalý / 1d / 7d / 30d / 90d). UsersTable: status chip zobrazí "BAN do <date>" pokud `bannedUntil`, jinak "BANNED".

---

### D-024 + D-032 — Audit log feed pro admin operace
**Soubory:** `backend/src/modules/admin/schemas/admin-audit-log.schema.ts`, `interfaces/admin-audit-log.interface.ts`, `repositories/admin-audit-log.repository.ts`, `admin.module.ts`, `admin.service.ts` (helper `audit()` + hook ve všech mutacích), `admin.controller.ts`, `src/features/admin/users/components/AuditLogTab/AuditLogTab.tsx`, `useAdminUsers.ts`, `AdminUsersPage.tsx`
**Opraveno v:** post-1.3b cleanup (2026-05-12). Nová Mongo kolekce `admin_audit_log` s aktor/cíl identifikací, action enum (BAN/UNBAN/ROLE_CHANGE/ADMIN_PERMISSIONS_CHANGE/USERNAME_REQUEST_APPROVED/USERNAME_REQUEST_REJECTED), before/after diff JSON. Audit volání hooknutá ve všech AdminService mutacích (try/catch — audit failure neblokuje business logiku). Endpoint `GET /admin/audit-log` s filtry action/actorId/targetId. FE: 3. tab "Audit log" v AdminUsersPage s tabulkou (filter action select, badge per akce, diff JSON viewer, paginace, mobile cards). D-032 (audit canManageAdmins) je natural součást action ADMIN_PERMISSIONS_CHANGE.

---

### D-033 — Granular permissions framework
**Soubory:** `backend/src/modules/users/interfaces/user.interface.ts`, `schemas/user.schema.ts`, `users.repository.ts`, `admin/helpers/hierarchy.ts`, `admin.service.ts`, `admin/dto/set-admin-permissions.dto.ts`, `auth/strategies/jwt.strategy.ts`, `src/shared/types/index.ts`, `src/features/admin/users/api/useAdminUsers.ts`, `components/UsersTab/UsersTable.tsx`
**Opraveno v:** post-1.3b cleanup (2026-05-12). Refactor `User.canManageAdmins: boolean` → `User.adminPermissions: { canManageAdmins, canModerateContent, canEditPlatformPages }`. BE: nový `AdminPermissions` interface + `DEFAULT_ADMIN_PERMISSIONS` konstanta; Mongoose schema sub-document. `MongoUsersRepository.toEntity` legacy fallback (čte staré `canManageAdmins: boolean` pokud `adminPermissions` chybí). Hierarchy helpers (`assertCanChangeRole`, `assertCanModerate`) čtou `actor.adminPermissions?.canManageAdmins`. DTO `SetAdminPermissionsDto` — všechny 3 flagy optional, granular merge v service. FE: rozšířený toggle popover v UsersTable (3 checkboxy s tooltipy). canModerateContent + canEditPlatformPages jsou zatím "future" flags pro 3.x content moderation a admin pages editor — schema připravená.

---

### D-030 — Toast po login s rozhodnutou username žádostí
**Soubory:** `backend/src/modules/users/schemas/username-change-request.schema.ts`, `interfaces/username-change-request.interface.ts`, `repositories/username-change-requests.repository.ts`, `users.service.ts`, `users.controller.ts`, `src/shared/types/index.ts`, `src/features/admin/users/api/useAdminUsers.ts`, `src/features/auth/components/AuthBootstrap.tsx`
**Opraveno v:** post-1.3b cleanup (2026-05-12). Pole `seenAt: Date | null` na `UsernameChangeRequest`. Nové endpointy `GET /users/me/username-request/last-unseen-decided` + `POST .../:id/seen`. FE komponenta `UsernameRequestToast` v `AuthBootstrap` po hydrataci: pokud existuje rozhodnutá nesehnutá žádost, zobrazí toast (success pro approved s novým username, error pro rejected s důvodem) + auto-mark seen. Toast se zobrazí jen jednou per request (ref-tracker proti opakovanému renderu).

---

### D-027 — Cooldown username change jako konfigurovatelná konstanta
**Soubory:** `backend/src/modules/users/users.service.ts`, `backend/.env.example`, `src/shared/types/index.ts`, `src/features/profile/components/SecuritySection.tsx`
**Opraveno v:** post-1.3b cleanup (2026-05-12). `USERNAME_CHANGE_COOLDOWN_DAYS` env var (default 30) přes `ConfigService.get` v `UsersService.getCooldownDays()`. `MeResponse` rozšířen o `usernameChangeCooldownDays` — FE `SecuritySection` čte z `profile.usernameChangeCooldownDays`. Hodnota 0 = cooldown vypnut. Admin UI pro nastavení = separátní budoucí dluh (db-backed settings dokument).

---

### D-021 — Tyky header avatar specificity hack opakovaný per-tématu
**Soubory:** `src/shared/ui/UserAvatar/UserAvatar.tsx`, `UserAvatar.module.css`, `src/app/layout/IkarosLayout/IkarosLayout.tsx`, decorations.css v 14 tématech (bila, modre-nebe, sci-fi, zlaty-standard, ctyri-zivly, hospoda, indiane, nemrtvi, pergamen, priroda, severske-runy, temna-cerven, vesmirna-bitva, vesmirna-lod).
**Opraveno v:** post-1.3b cleanup (2026-05-12). (a) varianta zvolena: přidán `xs` size (20px) do `UserAvatar`, IkarosLayout header používá `<UserAvatar size="xs">`. Per-theme specificity hacky `[data-theme="X"] [class*="headerBtn"] [class*="avatar"] { width: 16/18/20px }` odebrané ze všech 14 témat (regex sweep + manual fix pro severske-runy s atypickou strukturou). Žádná per-theme duplikace.

---

### D-022 — Anonymous mobile layout: main content zúžen na ~95px
**Soubor:** `src/app/layout/IkarosLayout/IkarosLayout.module.css` (řádek 377-380)
**Opraveno v:** post-1.3b cleanup (2026-05-12). V mobile media query přidán selektor `.shellAnon .body` (specificita 2-0-0) vedle `.body` → mobile přepíše desktop `grid-template-columns: var(--sidebar-w) 1fr` pro auth i anon shell.

---

### D-031 — `UserRole.Zakaz` deprecate z enum
**Soubory:** `backend/src/modules/users/interfaces/user.interface.ts`, `src/shared/types/index.ts`, `backend/src/modules/admin/helpers/hierarchy.ts`, `src/shared/types/userRoleLabels.ts`
**Opraveno v:** post-1.3b cleanup (2026-05-12). `Zakaz = 8` smazán z BE i FE enum, callsites (`assertCanChangeRole` `ZAKAZ_DEPRECATED` block, `ROLE_LABELS` record) vyčištěné. Bez migration scriptu — pokud production DB obsahuje user.role=8, bude potřeba před deployem `db.users.updateMany({ role: 8 }, { $set: { role: 5, bannedAt: ISODate(), banReason: 'Migrated from Zakaz role' } })`.

---

### D-032 (interní 1.3b) — Enum `UserRole` mismatch FE ↔ BE
**Soubory:** `backend/src/modules/users/interfaces/user.interface.ts`, `src/shared/types/index.ts`
**Opraveno v:** 1.3b Phase 1 (2026-05-12). Sjednocený enum: 1=Superadmin, 2=Admin, 3=PJ, 4=Korektor, 5=Hrac, 6=Ctenar, 7=Zadatel, 8=Zakaz (deprecated), 9=Ikarus, 10=SpravceClanku, 11=SpravceGalerie, 12=SpravceDiskuzi. BE překlepy `SpravceClankuu`/`SpravceDisukzi` opraveny, FE-only `SpravceBohu` (dead code) smazán. Všechny callsites v `ikaros-articles.service.ts`, `ikaros-discussions.service.ts`, `RoleStar.tsx` aktualizovány.

---

### Severske-runy `reducedMotion: 'gentle'` mimo union typ
**Soubor:** `src/themes/themes/severske-runy/index.ts` (řádek 178)
**Opraveno v:** 1.3b Phase 9 (2026-05-12) — změna na `'safe'` (5 animací s reduced-motion fallback). 1-line fix při buildu.

---

### D-001 — `window.location.href` při selhání refreshe → 404
**Soubor:** `src/api/client.ts` — response interceptor
**Opraveno v:** 1.2c — helper `logoutAndRedirectToLogin()` volá `router.navigate('/?openLogin=1')` + ukládá `LOGIN_INTENT_KEY` do sessionStorage (mimic `requireAuth` loaderu). Při auditu zjištěno, že route `/login` neexistuje — původní kód vedl uživatele na 404, ne jen na tvrdý reload. Po loginu skončí na původní cestě (deep-link).

---

### D-007 — `passwordHash` v `User` typu
**Soubor:** `src/types/index.ts`
**Opraveno v:** 1.1 — `passwordHash` field z `User` interface odstraněn, `Omit<User, 'passwordHash'>` v `AuthResponse.user` zrušen na `User`. Cleanup zaznamenán dodatečně v 1.2c.

---

### D-013 — BE chybí `.env.example` + slabé default secrets
**Soubor:** `Projekt-ikaros/backend/.env.example`
**Opraveno v:** 1.2d — `.env.example` rozšířen z 8 ř. na ~40 ř.: kompletní seznam 13 proměnných seskupených do sekcí (Runtime / Database / Auth / Push / Cloudinary), komentáře v češtině, instrukce pro generaci secrets (`openssl rand -hex 32`, `npx web-push generate-vapid-keys`). Odložené části: Joi schema validation = nový dluh **D-015**. Generace prod secrets zůstává jako deployment TODO (mimo kódový dluh).

---

### D-003 — BE endpoint `PATCH /api/users/me { themeId }` neexistuje
**Soubor:** `Projekt-ikaros/backend/src/modules/users/users.controller.ts` + `src/themes/useThemeSync.ts`
**Opraveno v:** 1.2e — nový endpoint `PATCH /api/users/me` s `JwtAuthGuard` přijímající `UpdateUserDto`. Theme se ukládá do `User.themeSettings.themeId` (existující freeform JSON; **žádná schema změna, žádná migrace**). Username change přes tento endpoint zakázán (Superadmin musí použít `/users/:id`). FE refactor `useThemeSync.ts`: read přes `user.themeSettings?.themeId`, send `{ themeSettings: { themeId } }`. +1 BE unit test (themeId merge).

---

### D-004 — `currentUserAtom` neobsahuje `themeId` field
**Soubor:** `src/types/index.ts` — User type / `src/themes/useThemeSync.ts`
**Opraveno v:** 1.2e — řešeno cestou C: top-level `themeId` field na User typu **nevytvořen**. Místo toho theme čteno z existujícího `user.themeSettings.themeId` přes type cast `(user.themeSettings as { themeId?: string } | undefined)?.themeId`. Akceptovatelný kompromis pro freeform JSON storage; přidání typed field by zvýšilo vazbu mezi `User` typem a theme registry bez praktického přínosu.

---

### D-014 — `LOGIN_INTENT_KEY` duplicitní hardcode na 4 místech
**Soubor:** `src/router.tsx`, `src/components/auth/LoginModal.tsx`, `src/components/auth/RegisterModal.tsx`, `src/api/client.ts` → sjednoceno v `src/auth/loginIntent.ts`
**Opraveno v:** 1.2h — nový shared modul `src/auth/loginIntent.ts` s exportem `LOGIN_INTENT_KEY` + helpery `saveLoginIntent(target)` a `consumeLoginIntent(): string | null`. Refactor 4 produkčních míst, smazán duplicitní lokální `isSafeRedirect` helper z LoginModal/RegisterModal (zahrnut v `consumeLoginIntent`). Sjednocen drobný drift filtru `target !== '/'` mezi client.ts a router.tsx. Defensive validace `isSafeRelativePath` při save i consume (XSS protection). Test soubory ponechány na string literal (testují observable storage state, ne implementaci).

---

### D-008 — Anon dostupnost veřejných endpointů (BE controller-level guards)
**Soubor:** `Projekt-ikaros/backend/src/modules/ikaros-{articles,gallery,discussions}/*.controller.ts` + nový `backend/src/common/guards/optional-jwt-auth.guard.ts`
**Opraveno v:** 1.2g — nový `OptionalJwtAuthGuard` (lokální opt-in pattern) jako "měkký" JWT guard: validní token populuje `req.user`, chybějící/invalid token nech projít s `req.user = undefined`. Class-level `@UseGuards(JwtAuthGuard)` přesunut na method-level: read endpointy (`findAll`, `findById`, `getPosts`) mají `OptionalJwtAuthGuard`, write/admin endpointy mají `JwtAuthGuard`. Service signatury read metod přijímají `role`/`username` jako optional; `findById` pro anon na non-Published / closed-pending vrací `NotFoundException` (no enumeration). +15 nových unit testů (anon scénáře). `ikaros-news` byl už správně (method-level pattern). Audit při tomto kroku odhalil další security holes v BE → nový dluh **D-016**.

---

### D-002 — Toast "Spojení obnoveno" při prvním připojení
**Soubor:** `src/api/hooks/useSocket.ts` — `useSocketInit`  
**Opraveno v:** 0.6 — `wasConnected.current = true` přesunuto na konec efektu, toast se nyní zobrazí jen při REconnect.

---

### D-005 — `currentUserAtom` plnohodnotná hydratace přes `/api/users/me`
**Soubor:** `src/api/hooks/useAuth.ts` + `src/components/auth/AuthBootstrap.tsx`
**Opraveno v:** 1.3a — nový hook `useCurrentUserHydration` v `useAuth.ts` volá `GET /users/me` (TanStack Query, klíč `['users', 'me']`) ihned po startu provider tree, přepíše `currentUserAtom` plnohodnotnými daty. `AuthBootstrap` mountuje obě fáze v root stromu (`main.tsx`). Po D-020 cleanup (viz níže) je `useAuthBootstrap` zúžen pouze na cleanup expirovaných tokenů; data v `currentUserAtom` přicházejí výhradně z `/me`.

---

### D-015 — BE Joi config validation (fail-fast při startu)
**Soubor:** `Projekt-ikaros/backend/src/app.module.ts` — `ConfigModule.forRoot`
**Opraveno v:** 1.3a / dluh cleanup — přidán `joi` (~50 KB), `validationSchema` s 13 proměnnými. Povinné: `MONGODB_URI`, `JWT_SECRET` (min 16 znaků), `JWT_REFRESH_SECRET` (min 16, **disallow shody s JWT_SECRET**), `JWT_REFRESH_TTL_DAYS`, `JWT_EXPIRES_IN`, `PORT`, `FRONTEND_URL`. Volitelné s warning logem při chybění: `VAPID_*` (push notifikace se vypnou), `CLOUDINARY_*` (image upload se vypne). `validate` callback validuje + logguje warningy přes Logger; `abortEarly: false` reportuje všechny chyby najednou. BE 816/816 testů projde.

---

### D-018 — BE validace `themeId` proti theme registry
**Soubor:** `Projekt-ikaros/backend/src/modules/users/dto/update-user.dto.ts`
**Opraveno v:** 1.3a / dluh cleanup — `UpdateUserDto.themeId` zúžen z volného `IsString` na `IsIn(VALID_THEME_IDS)` enum (21 ID kopírovaných z FE registry). Komentář upozorňuje na duplicity SSoT (FE `themes/registry.ts`). BE odmítne neplatné theme ID s 400 (class-validator).

---

### D-020 — JWT vs `/me` dedup (cleanup po D-005)
**Soubor:** `src/api/hooks/useAuth.ts` + `src/api/hooks/useAuth.spec.tsx`
**Opraveno v:** 1.3a / dluh cleanup — `useAuthBootstrap` dříve zapisoval **minimal user** z JWT decode do `currentUserAtom`. Data byla subset `/users/me` (chybělo avatar, bio, themeId, …) a vedla k UI flashům po prvním fetch. `useAuthBootstrap` teď řeší pouze cleanup expirovaného tokenu; `currentUserAtom` zůstává `null` až do prvního úspěšného `/me` fetch (typicky 50-200 ms). Header komponenty mají `if (!user) return null;` ochranu, žádná regrese. Test suite aktualizována (4 testy, jeden přepsaný — JWT decode už v atomu nepíše).

---

### D-010 — GDPR souhlas + Podmínky použití při registraci (částečně)
**Soubor:** BE `User` schema + `RegisterDto` + `auth.service` ; FE `registerSchema`, `RegisterModal`, `TermsPage`, router
**Opraveno v:** 1.3a / dluh cleanup — kompletní **kostra** flow:
- BE: `User.acceptedTermsAt` Date field (default undefined), `RegisterDto.acceptedTerms` (`@Equals(true)` přes `@IsOptional` pro zpětnou kompatibilitu), `AuthService.register` zapíše čas souhlasu při registraci.
- FE: `registerSchema.acceptedTerms` zod refine na `true` (povinný checkbox), `RegisterModal` zobrazuje checkbox s linkem na `/podminky`, target="_blank".
- Nová stránka `TermsPage.tsx` na `/podminky` s **placeholder textem** (5 sekcí: účel, GDPR, pravidla, smazání účtu, změny). Před prod nasazením musí PJ dodat finální právní text.

**Zbytkový blokátor:** PJ dodává finální text Podmínek použití (právní konzultace doporučená). Před prod také zvážit přepnutí `acceptedTerms` z optional na required na BE.

---

### D-011 — Honeypot proti registračním botům (částečně, captcha čeká)
**Soubor:** `RegisterDto.hp` + `registerSchema.hp` + `RegisterModal` skryté pole
**Opraveno v:** 1.3a / dluh cleanup — **honeypot část**:
- BE: `RegisterDto.hp` (`@IsOptional() @MaxLength(0)`) — pokud bot vyplní, validace odmítne s 400.
- FE: `registerSchema.hp` (`z.string().max(0)`) + skryté pole v `RegisterModal` (offscreen `position: absolute; left: -9999px`).

Honeypot odfiltruje **naivní boty** (hloupý form scraping). Pro produkci stále nutný plný captcha provider — viz **D-011 v sekci „Otevřené"**.

---

### D-009 — BE `code` field v error responses (částečně, rolling)
**Soubor:** `admin.service.ts`, `worlds.service.ts` (2×), `users.service.ts`, `characters.service.ts`, `pages.service.ts`, `ikaros-messages.service.ts`
**Opraveno v:** 1.3a / dluh cleanup — **7 míst** napříč moduly přepsáno z `throw new ConflictException('msg')` na `throw new ConflictException({ statusCode, message, code: '<CODE>' })`. Codes přidané: `EMAIL_TAKEN`, `USERNAME_TAKEN`, `WORLD_SLUG_TAKEN`, `WORLD_ALREADY_MEMBER`, `CHARACTER_SLUG_TAKEN`, `PAGE_SLUG_TAKEN`, `JOIN_REQUEST_RESOLVED`.

Zbývá: ostatní HttpException typy (NotFound/Forbidden/BadRequest) — viz **D-009 v sekci „Otevřené"**.

---

### D-016 — BE auth audit (částečně, rolling)
**Soubor:** `worlds.controller.ts`, `npc-templates.controller.ts`, `maps.controller.ts`, `universe.controller.ts`
**Opraveno v:** 1.3a / dluh cleanup — **4 read-moduly** dostaly `OptionalJwtAuthGuard` (z 1.2g `D-008`) na all read endpointech (`findAll/findBySlug/findOne` v worlds, `findAll/findOne` v npc-templates, `findByWorld/findActive/findById` v maps, `findByWorld` v universe). Audit potvrdil, že write endpointy v timeline / world-weather / world-calendar-config **už měly** `JwtAuthGuard` na class-level.

Public endpointy ponechány bez guardu se záměrem (komentář v controlleru): `world-news`, `users.profile/:id`, `users.exists/:username`, `map-templates`, `IkarosNews`, `system-presets`, `push/vapid-public-key`.

Zbývá: zvážit Variantu B (`APP_GUARD` + `@Public()`) pro vynucený opt-in model — samostatný spec.

---

### D-060 — Cross-world kalendář link (2.1 → 9.2)
**Soubory:** `src/features/ikaros/pages/DashboardPage/sections/UpcomingEventsSection.tsx`
**Stav:** Otevřený, čeká na fázi 9.2 (Kalendář).
**Kontext:** Sekce „Blížící se schůzky" má action „Zobrazit vše →", která dnes míří dočasně na `/ikaros/vesmiry`. Cross-world kalendář (`/ikaros/kalendar` nebo equivalent) ještě neexistuje; vznikne s fází 9.2 nebo dříve jako side-task. **Action:** po dokončení 9.2 přesměrovat link na novou route.

---

### D-061 — BE `GET /api/IkarosNews` paginace
**Soubory:** `backend/src/modules/ikaros-news/ikaros-news.controller.ts`
**Stav:** Otevřený, lazy — provede se pokud novinek bude víc než ~50.
**Kontext:** Dnes endpoint vrací **všechny aktivní novinky** bez paginace; FE provádí `slice(0, 5)` v `PlatformNewsSection`. Pro fázi 3.1 (stránka novinek s "Zobrazit všechny") bude potřeba `?limit=&offset=`. Není urgent — dnes je v DB ~0 novinek.

---

### D-062 — Sidebar bug fix (uzavřen) — `useMyWorlds` shape
**Soubory:** `src/app/layout/IkarosLayout/IkarosLayout.tsx` (SidebarContent + RightPanel), `src/features/profile/components/WorldsSection.tsx`
**Opraveno v:** 2.1 — FE typoval `useMyWorlds` jako `World[]`, BE `worldsService.findMyWorlds` vrací `{ world, membership }[]`. Tři callsite (sidebar PJ badge přes `world.ownerId === currentUser.id`, right panel, profil) opravené. PJ badge se teď počítá přes `membership.role === WorldRole.PJ` (správnější — vlastník nemusí být PJ, např. admin promovaný hierarchií).
