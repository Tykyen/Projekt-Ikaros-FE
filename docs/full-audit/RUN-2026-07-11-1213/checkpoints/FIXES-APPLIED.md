# Provedené opravy (RUN 2026-07-11) — průběžné

Vše BE (žádná FE zatím), necommitnuto (git na uživateli). Typecheck ✅ po každé dávce.

## 🔴 KRITICKÉ (deploy-blocker) — 26 schema polí `@Prop` bez explicitního `type`
Union/enum `@Prop` bez `type:` → za běhu „Cannot determine a type" → **celý AppModule se nenaboot­uje**. tsc/nest build i prod runtime emitují stejnou metadata → reálný deploy-blocker (CI nechytá, e2e full-boot nespouští). Nejspíš regrese verze @nestjs/mongoose (dřív stačil `enum:`).
Opraveno (přidán `type: String`):
- plants/schemas/plant.schema.ts (rarity, status)
- moderation/schemas/content-report.schema.ts (targetType, category, status)
- moderation/schemas/moderation-decision.schema.ts (targetType, action, category)
- moderation/schemas/moderation-appeal.schema.ts (status)
- bestiae/schemas/bestie.schema.ts (scope, status)
- bestiae/schemas/bestie-comment.schema.ts (targetType)
- characters/schemas/character.schema.ts (kind)
- chat/schemas/scheduled-message.schema.ts (status +enum doplněn)
- analytics/schemas/analytics-event.schema.ts (referrerCategory)
- sounds/schemas/sound.schema.ts (11 polí: mediaType/primaryFunction/environment/emotionalTone/onsetProfile/outroProfile/factionStyle/techLevel/magicLevel/combatEnergy/status)
OVĚŘENO: smoke e2e boot 1/1 pass; full e2e 52 fail → 5 fail. Scanner na hledání: viz níže.

## Baseline (test-only, 0 prod riziko)
- worlds.service.spec.ts — mockUsersService chyběl findById (produkce :459/:348 volá supporter kvótu 19.4). → 135/135 pass. Nebyl prod bug.
- auth-register-check.e2e-spec.ts (3 těla) + auth-login-identifier.e2e-spec.ts (2 těla) — chyběl povinný `isMinor: false` (DTO ho vyžaduje od 20C). → 22/22 pass. Registrace v prod OK (FE isMinor posílá).

## Safe BE hardening
- main.ts — `app.enableShutdownHooks()` (🔴 styl 31 graceful shutdown SIGTERM) + `server.keepAliveTimeout=61s`/`headersTimeout=65s` (anti slow-loris, styl 25/26). requestTimeout VYNECHÁN (dlouhé exporty).
- global-chat/camp-rotation.job.ts — `@Cron(..., { timeZone: 'Europe/Prague' })` (styl 41).

## VYNECHÁNO (riziko / potřeba review)
- socket-io.adapter maxHttpBufferSize 5MB→1MB — nutno ověřit, že whisper/chat přílohy nejedou WS framem (jinak rozbije obrázky). Necháno.

## Zbývá k opravě (po dokončení auditu, dle report):
- RC-P3: page create souběh stejného slugu → 500 místo 409 (duplicate-key není chycen). BE.
- Bezpečnost: game-integrity HP/dice/turn clamp (46), anti-abuse kvóty (34), TOTP lockout (35), approveAccessRequest kvóta (39), GDPR erasure handlery (40), refund tx (43).
- Resilience timeouty (33), perf N+1/compression/autoIndex (25), presence room-scope (26).
- FE: isError stránky (37), CommentComposer isPending (38), vite:preloadError (29), SecuritySection 401→400 (bug-01/03), reduced-motion global, npm audit fix, lazy TipTap (21).

## Scanner union-@Prop (reprodukce boot-blockeru):
`node` sken v `backend/`: pro každý `*.schema.ts` najdi `@Prop(` bez `type:`/`ref:` kde typ pole je union (`|`) nebo Capitalized alias → kandidát. Viz report.

## Dávka 2 — resilience timeouty (styl 33, aditivní, typecheck ✅)
- `auth/captcha.service.ts:61` — fetch `signal: AbortSignal.timeout(5000)` (fail-closed cesta registrace/login)
- `mailer/providers/smtp-mailer.provider.ts:45` — `connectionTimeout/greetingTimeout:10s`, `socketTimeout:20s` + `requireTLS: port===587` (řeší i prod-config-05 plaintext downgrade)
- `search/meili-search.service.ts:30` — MeiliSearch `timeout: 5000`
- `upload/upload.service.ts:146` — cloudinary.config `timeout: 60000`
- search.controller.ts:153 rebuildIndex .catch VYNECHÁN — globální unhandledRejection handler (main.ts:36) ho už loguje.

## Dávka 3 — bezpečnostní fixy (test-first, full jest 2531/2531 ✅)
- **HP clamp (GI 46)** — `map-operations.service.ts` token.update: currentHp∈[0,maxHp], injury≥0 (server-authoritativní, 99999/záporné exploit). +regresní test.
- **@all/@here gate (ABU 34)** — `chat.service.ts:1343` broadcastMentions jen pro PomocnyPJ+ (canManageChat) → hráč nenotifikuje celou jeskyni.
- **characters count cap (ABU 34)** — `characters.service.ts` create: MAX_CHARACTERS_PER_WORLD=5000 (countByWorld) proti DB floodu. +interface/repo metoda +regresní test.
- **blob leak (CD-NEW-1)** — `world-hard-delete.service.ts`: collectGalleryBlobs('chatmessages',{worldId},'attachments') → chat přílohy se uklidí z Cloudinary při hard-delete světa.

## Zbývá (multi-file, pokračuji): GDPR erasure handlery (chat/ikaros-msg/push), refund tx, report dedup, scheduled-msg atomický claim, TOTP lockout, FE dávka.
## Rozhodnuto uživatelem: věková brána 15+ = per-svět (jen jeskyně s příznakem), ne globální blok → featura, ne fix.

## Dávka 3b — report dedup (ABU 34)
- `moderation.service.ts createReport` + `content-reports.repository.existsPendingByReporterAndTarget` + interface — 1 oznamovatel na týž cíl s pending reportem → Conflict REPORT_DUPLICATE (proti spamu fronty/notifikací). Ověřeno typecheck+jest (moderation.service.spec neexistuje → doporučen pin).

## STAV: full jest 2531/2531 ✅ · typecheck ✅ · nest build ✅. BE nasaditelný, lepší než vstupní baseline.

## Dávka 4 — paměť / RSS alert (reakce na monitoring 2273 MB > 1536 MB)
DIAGNÓZA: RSS baseline dominován 2 ONNX embedding modely (granite 107M+278M) načtenými EAGER in-process (~1,5–2 GB). In-memory mapy (presence/chat/voice) MAJÍ cleanup na disconnect → není klasický leak, je to baseline těžké AI featury; práh 1536 MB je pod baseline.
FIX: `embedding-search.service.onModuleInit` — gate `EMBEDDING_ENABLED` (default zapnuto). `EMBEDDING_ENABLED=0` v prod .env + restart → modely se nenačtou, RSS -~2 GB, sémantické hledání degraduje na MeiliSearch (search() vrací prázdno, nespadne).
DOPORUČENÍ uživateli: v prod .env nastavit `EMBEDDING_ENABLED=0` (pokud sémantické hledání není klíčové) NEBO zvednout `RSS_ALERT_MB` na ~2560 (aby alert reflektoval realitu s ONNX). Pokud po vypnutí embeddingu RSS dál roste → skutečný leak (nutný heap snapshot běžícího procesu).

## Dávka 5 — GDPR erasure (styl 40, koherentní celek, typecheck+jest ✅)
- `users.repository anonymizeForHardDelete` — +characterName/characterBio do $unset (profilová PII postavy).
- `chat` — @OnEvent('user.deletion.hardDeleted') v chat.service → messageRepo.anonymizeBySender (senderName→'Smazaný uživatel', avatar/override null). Content NEnulován (konverzace ostatních; plná content-erasure=právní rozhodnutí).
- `ikaros-messages` (DM) — @OnEvent handler → anonymizeByUser (sender+recipientName).
- `push` — @OnEvent handler → deleteByUserId (smaže všechny subs = endpoint/p256dh/auth/UA PII).
- +3 typované mocky doplněny (push/ikaros/global-chat spec) — jinak nest build FAIL. Poučení: po interface změně VŽDY typecheck.

## Dávka 6 — durabilita (styl 43, typecheck ✅, campaign spec 13/13)
- refund kompenzace: kredit v try/catch; při selhání `purchaseRepo.markActiveIfRefunded` (nová repo metoda+interface) vrátí status refunded→active → storno retryovatelné (ne trvalá ztráta). Reziduum: crash-přesně-mezi chce plnou tx (session-threading přes adjust) = dluh.
- `database.module.ts` writeConcern {w:'majority', j:true} — durabilita zápisů.

## Dávka 7 — paměť: EMBEDDING_ENABLED gate (viz Dávka 4). Doporučení: EMBEDDING_ENABLED=0 v prod (-2 GB RSS).

## Dávka 8 — FE (oddělený blok, FE build ✅ + lint 0 errorů)
- `SecuritySection.tsx` — změna hesla čte doménový kód `INVALID_PASSWORD` (parseApiErrorCode) místo status 401 → field-hláška „heslo špatně" teď naskočí (BE vrací 400).
- `main.tsx` — `vite:preloadError` handler → jednorázový reload při stale chunku po deployi (bílá stránka fix), guard 10 s proti loopu.
- `app/index.css` — globální `@media (prefers-reduced-motion)` → 19 pulzů/spinnerů respektuje reduced-motion jedním pravidlem.
- `EventComments/CommentComposer.tsx` — `if (add.isPending) return` guard → Enter během in-flight nepošle 2 komentáře.

## NEDOKONČENO — přesný návod (buď blast-radius, nebo rebuild, nebo produktové rozhodnutí):
- **npm audit fix** (FE+BE) — deps agent: VŠE non-breaking. Spusť `npm audit fix` v obou repo (FE potřebuje `NODE_OPTIONS=--use-system-ca`), pak rebuild. Řeší @vitest/browser (dev RCE) + @nestjs/swagger→js-yaml (runtime).
- **TOTP lockout + token invalidace** (styl 35, auth-critical, blast-radius=nikdo se nepřihlásí) — per-účet čítač `totpFailedAttempts`/`totpLockedUntil` na User + lockout v loginTotp; tokenVersion na User+JWT payload+guard porovnání `(payload.tokenVer ?? 0) === (user.tokenVersion ?? 0)` (backward-compat!). Test-first, jest+e2e MUSÍ projít.
- **Cross-instance atomický claim** (styl 41, latentní na 1 replice) — scheduled-messages.job + game-event-reminder.job: findOneAndUpdate({status:'pending'|[field]:{$ne:true}}) PŘED akcí + status enum +'sending' + reaper. Distributed lock (Redis SETNX) na sweep crony.
- **RC-E7/E8** — changeCurrency/removeFromInventory read-modify-write full $set → atomický $push/$addToSet (vzor appendTransactionIfSufficient).
- **isError stránky** (styl 37) — ArticlesPage×2/Gallery×2/Favorites×3 přidat isError stav (vzor AkcePage:35).
- **pages cap + upload throttle na chat:428** (styl 34, vzor char cap).
- **Dice recompute / turn-gate / initiative bounds** (styl 46) — server RNG NEBO bounds validace dicePayload; turn gate token.move/dice.roll vs combat.currentTokenId. Produktové rozhodnutí (server RNG = architektura).
- **Blob leaky další** (nabory/plant/theme-bg/TTL-chat) + media.orphaned ref-counting.
- **věková brána 15+ = per-svět** (rozhodnutí uživatele) — featura: per-svět age flag + gate, ne globální blok.

## FINÁLNÍ STAV: BE nest build ✅ + jest 2531/2531 ✅ + typecheck ✅ · FE build ✅ + lint 0 err · regression --ci ✅. Deploy-clean.
