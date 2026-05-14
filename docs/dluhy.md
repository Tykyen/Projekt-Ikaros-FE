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

### D-063 — BE: `POST /IkarosNews` autorizace zúžit jen na globální role
**Soubor:** `Projekt-ikaros/backend/src/modules/ikaros-news/ikaros-news.controller.ts` + service
**Problém:** Endpoint dnes povoluje i `WorldRole.PJ` (world-scoped role) pro vytvoření platformové novinky. Sémanticky špatně — Ikaros novinky jsou platformový obsah, PJ je role uvnitř konkrétního světa.
**Dopad:** Nízký — FE už nyní řídí přístup správně (krok 3.1a, jen Admin/Superadmin), takže UI tuto cestu pro PJ neukazuje. Riziko jen pokud někdo zavolá BE přímo s JWT PJ uživatele.
**Řešení:** Zúžit autorizaci v `IkarosNewsService.create` jen na `UserRole.Admin` + `UserRole.Superadmin`. Případně rozšířit na další globální „obsahové" role po definici matice ve fázi 3.1.
**Kdy:** Při plné implementaci fáze 3.1 (admin správa novinek).

---

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

### D-048 — HelpPage content drift
**Kontext:** Krok 3.6 (Nápověda na `/ikaros/napoveda`) dokumentuje stav platformy k 2026-05-12. Sekce „Stránky" a „FAQ" obsahují ✅/🚧 značky napojené na aktuální fáze. Při každé doručené fázi musí někdo aktualizovat odpovídající položky, jinak nápověda přestane být pravdivá.
**Řešení:** Do PR checklistu fází 1.5 / 1.7 / 1.8 / 2.x / 3.x přidat položku „aktualizovat HelpPage (sekce Stránky + případně FAQ)". Připadnu i automatizace přes kontrolu obsahu vs roadmap-fe.md (ale stačí discipline v review).

---

### D-051 — Redis adapter pro `OnlinePresenceRegistry`
**Kontext:** 1.5 registr je in-memory Map<userId, RegistryEntry>. Single-instance only — při multi-instance deployu by každá instance měla vlastní obraz a `presence:update` broadcast by se nepropagoval mezi instancemi.
**Řešení:** Swap `OnlinePresenceRegistry` Map za Redis hash + použít `@socket.io/redis-adapter` pro multi-instance broadcast. Analogicky k D-028 (cache pro ban check). Až bude potřeba škálování.

---

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

## Částečně řešené (zbývající práce)

### D-009 — BE `code` field v error responses (rolling, většina hotová)
**Soubor:** `Projekt-ikaros/backend/src/modules/**/*.service.ts`
**Stav:** **Batch 1** (1.3a): 7 míst (ConflictException codes). **Batch 2** (post-1.3b, 2026-05-12): 350 exceptions (NotFound/Forbidden/BadRequest) batch transform script → 27 service souborů.
**Zbývá:** ~19 exceptions s komplexnějšími patterns (template literals s ${}, multi-line msg, nested expressions). Doplnit při dalším šťouchu do těchto míst.

---

### D-016 — BE auth audit (rolling)
**Soubor:** `Projekt-ikaros/backend/src/modules/{worlds,npc-templates,maps,universe}/*.controller.ts`
**Stav:** **4 read-modules** dostaly `OptionalJwtAuthGuard` na findAll/findBySlug/findOne (worlds), findAll/findOne (npc-templates), findByWorld/findActive/findById (maps), findByWorld (universe). Write endpointy v timeline / world-weather / world-calendar-config už guards měly před auditem.
**Zbývá ověřit:** `world-news` (PUBLIC catalog — záměr), `users.profile/:id` a `users.exists/:username` (PUBLIC pro registrační UX — záměr), `map-templates` (PUBLIC katalog — záměr), `IkarosNews` (PUBLIC — záměr), `system-presets` (PUBLIC — záměr). Tyto endpointy ZŮSTÁVÁJÍ veřejné — ne security holes.
**Zbývá zvážit:** Variantu B (`APP_GUARD` + `@Public()` decorator) pro vynucený opt-in security model — samostatný spec po 1.3c.
