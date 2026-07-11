# Vlna 2/3 — konsolidované nálezy (styly 17/19/21/23/24/25/26/28/29/31/37/38/42/44/45 + core-drift)

## BASELINE oprava (HOTOVO): worlds.service.spec 4 červené → 135/135 zelené
- `mockUsersService` chyběl `findById` (produkce :459/:348 ho volá pro supporter kvótu 19.4). Test-only fix. NEbyl produkční bug.

## Styl 25 PERF-BE:
- SAFE trio: `database.module.ts` autoIndex:false v prod (+syncIndexes deploy); `main.ts` compression() middleware; `main.ts` keepAliveTimeout 61s/headersTimeout 65s/requestTimeout 30s.
- N+1: enrichMembers (worlds.service:1146 publicProfile/člen→batch findByIds), notifyUsers (push per user→batch+p-limit), getUnreadCounts (2N→$facet), sendMessage 2× findByWorldId.
- GET /worlds bez limit/projekce; pages.findByWorld tahá plná TipTap těla; BaseMongoRepository.findAll bez limit.

## Styl 26 SCALE-RT:
- WS ZCELA bez rate-limitu (0 throttle na gateways). Nejhorší write eventy: `ikaros:whisper` (global-chat.gateway:612), `chat:reaction:toggle` (:666) = Mongo write bez stropu.
- presence.gateway `io.emit`/broadcast (:83,:106,:149,:153) = GLOBAL O(N²); global-chat broadcastRoomCounts (:141) taky.
- SAFE fixy: maxHttpBufferSize 5MB→1MB (socket-io.adapter:72); THROTTLER_REDIS:"1" do compose.prod; volatile.emit na ephemeral (typing/ping/ruler/presence).
- STRUKTURÁLNÍ (diskuze): presence room-scoping, per-socket throttle, Redis-backed presence (D-051), connection cap/IP.

## Styl 37/38 FE:
- ⭐ 7 stránek bez isError (500=„prázdno"): ArticlesPage:99,:201, GalleryPage:84,:198, FavoritesPage:167,203,239. Vzor OK = AkcePage:35.
- ⭐ CommentComposer submit bez isPending guard + Enter → 2 komentáře; ○ CommentItem, ChatInput.
- ○ EmailVerifyPage:44 / EmailChangeConfirmPage:42 .then(setState) bez cancelled guard.
- ZASTARALÉ (už OK): unhandledrejection handler existuje (monitoring.ts:25/28), GlobalErrorBoundary má captureError.

## Styl 45 DLV:
- ⭐ smtp „Sent"=relay-accept (smtp-mailer:61); forgot-password blokuje request inline (auth.service:529, auth.controller:237); push bez idempotency (push.service); reminder job non-atomic (game-event-reminder:74).
- SAFE: forgotPassword fire-and-forget; log „Queued"; app-level denní čítač mailů; MAIL_FROM validace.
- NÁVRHOVÉ: mail outbox+retry+bounce/suppression; idempotency-key na notify.

## Styl 44 route-drift: ŽÁDNÝ reálný drift — všech 21 kandidátů má BE handler (artefakty normalizace). Doporučení: zapnout ENABLE_CROSSREPO_AUDIT v CI po fixu falešných pozitiv scanneru.

## Styl 21/24 bundle: 🔴 SLO S5 propadá — eager graf ~457kB>350kB (TipTap/RichTextEditor eager z news feedu). FIX: React.lazy RichTextEditor → ~311kB (pod SLO). console v prod ČISTÉ (esbuild drop OK). Fonty: 70 rodin 1 blocking link + 78 @import v InventoryTab.css (1.5MB) → self-host/subset (větší).

## Styl 17 a11y: kontrast PASS (33 motivů). reduced-motion 19 drobných pulzů → 1 globální @media pravidlo v index.css. ARIA button+role=option v 11 komp (○ low, klávesnice funguje).

## Styl 19 deps: 9 zranitelností, VŠECHNY fixAvailable bez breaking → `npm audit fix` (FE+BE). ⭐ FE @vitest/browser critical(dev RCE), BE @nestjs/swagger→js-yaml moderate(runtime). 5 circular deps (○).

## Styl 23 dead-code: (viz dead-code/stab agent) — kandidáti low.
## Styl 29 stab: vite:preloadError handler? (stale-bundle bílá stránka) — fixnutelné. PIXI/three dispose ověřit.
## Styl 42 VR: 🔴 playwright jen chromium (chybí mobil = porušuje base.md); contrast scanner NENÍ v CI + přeskakuje rgba/var; screenshot skript bez assertu. FIX: mobil viewport + overflow assert + audit:contrast do CI. Proof screenshot diff ⏭️.

## Styl 31 OPS:
- CODE-fix: 🔴 main.ts enableShutdownHooks+SIGTERM→app.close(); compose.prod backend healthcheck + resource limits/ulimits/pids; 🔀 ports 127.0.0.1 bind (POZOR: reverse proxy externí — ověřit před změnou!); deploy up --no-deps backend místo down + health-gated verify + tag image rollback; Redis requirepass/Mongo auth (defense-in-depth).
- OPS-task (uživatel, mimo kód): 🔴 mongodump cron+offsite (14.4=NULA záloh); externí UptimeRobot; Sentry účet+SENTRY_DSN/VITE_SENTRY_DSN (+FE deploy build-arg chybí); ověřit DISCORD_ALERT_WEBHOOK.
## Styl 28 VOICE: externí meet.jit.si bez SLA; žádný participant cap; fallback=jen chyba. Kapacita 50 ⏭️ rešerše/self-host.

## core-drift (herbář 21.5a): drží standard. ⭐ CD-PLANT-1: plants.service.ts:86 update nechává osiřelý blob (chybí media.orphaned emit jako bestiae FIX-29); potřebuje EventEmitter2 do PlantsModule. ○ CD-PLANT-2 hard-delete blob (past: InsertToShopModal kopíruje imageUrl). ○ moderationHidden mrtvé. ○ DTO bounds (tags ArrayMaxSize, imageFit IsIn, suggestedPrice Max).
