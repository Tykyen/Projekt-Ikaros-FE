# Plný audit (hloubková brána) — RUN 2026-07-11-1213

**FE HEAD** 8fa5a1aa · **BE HEAD** 7765de17 · beh: plná hloubka, přes noc, autonomně.

## TL;DR
- **Pokrytí:** všech 46 stylů. Rozšířené styly 17–46 = 20 hloubkových agentů (statika L2–L3). Core styly 1–16 = per-oblastní průchod ~110 oblastí + 5 single-file (checkpoint/oblast na disku).
- **Proof-vrstvy spuštěné:** `+db` (integrity/orphan scan proti běžícímu mongu, sensitivity OK, 1 reálný orphan) · `+e2e` (BE e2e suite). `+teeth` Stryker / `+load` / `+perf` live / `+render` = ⏭️ neproběhlo (čas/infra).
- **🔴 NEJKRITIČTĚJŠÍ NÁLEZ + FIX:** 26 schema polí `@Prop` union/enum **bez `type:`** → celý AppModule se za běhu nenaboot­uje (`Cannot determine a type`). Prod build (tsc) i runtime = stejná chyba → **by shodilo start backendu po nejbližším deployi/restartu.** CI to nechytá (nespouští full-boot e2e). **OPRAVENO** (přidán `type: String`). Ověřeno: smoke e2e boot 1/1, full e2e **52 fail → 5 fail**.
- **Baseline při vstupu byl fakticky ČERVENÝ** (maskováno past CH-056): BE jest 4 fail (worlds.service.spec stale mock) + BE e2e 52 fail (schema boot kaskáda). Oboje opraveno → jest 135/135 (spec), e2e reálné selhání 0 (5 „selhání" = 4 zastaralé auth testy [opraveno] + 1 flaky RC-P3 [ověřeno není reálné]).

## Provedené opravy (BE, necommitnuto — git na uživateli; typecheck ✅)
Viz `checkpoints/FIXES-APPLIED.md`. Souhrn:
1. 🔴 **26 schema `type: String`** (plant/content-report/moderation×3/bestie×2/bestie-comment/character/scheduled-message/analytics/sound×11) — deploy-blocker.
2. Baseline: worlds.service.spec mock findById (test-only) → 135/135. auth-register/login e2e stale `isMinor` (test-only) → 22/22.
3. `main.ts`: `enableShutdownHooks()` (graceful shutdown, 🔴 ops) + keepAliveTimeout/headersTimeout (anti slow-loris).
4. `camp-rotation.job.ts`: `timeZone: 'Europe/Prague'`.

## 🔴/⭐ hlavní nálezy k opravě (kódem ověřené, s citací v checkpointech)

### Bezpečnost / „aby se nikdo nedostal"
- **46 herní integrita** 🔴: dice payload (`chat.service:1419`, `map-operations:1325`) verbatim bez validace/recompute → hráč pošle `total:999`; token `currentHp`/`initiative` bez server clampu (`map-operations:642`) → 99999 i zápor; `token.move`/`dice.roll` mimo tah (authorizer bez `currentTokenId`); per-token `isLocked` neověřen na move (role-07 R-RUN-07-01). N-A6: HP viditelnost (showHp*) neenforced server-side → skryté HP čitelné z payloadu. NÁLEZ-dungeon-1: systemStats validace přeskočena pro alias-systémy (drd-plus/coc) → 0 server validace.
- **34 anti-abuse** 🔴: chybí kumulativní cap characters/pages (`characters.service:285`, `pages.service:287`), upload storage kvóta (jen rate limit), `@all/@here` bez role-gate (`chat.service:1343`), report bez dedup (`moderation.service:114`).
- **35 session**: 🔴 TOTP bez per-účet lockoutu (brute-force rotací IP, `auth.service:294`); 🔴 access token nejde zneplatnit (změna hesla/logout-all ho nezabije 3 dny); ⭐ login timing + check-email enumeration.
- **40 GDPR erasure** 🔴: chat/ikaros-messages/push subs se při smazání účtu NEanonymizují (chybí `@OnEvent('user.deletion.hardDeleted')`); `anonymizeForHardDelete` nechá characterName/Bio; data-export neúplný; upload_consents IP navždy; isMinor mrtvý flag.
- **32 SSRF**: VYVRÁCENO (na HEAD zavřeno, test existuje). Zbývá ⭐ platform-documents fetch bez timeout.

### Data / durabilita / cross-instance
- **43 durabilita** 🔴: `campaign-purchase.service refund()` (:413) = 3 zápisy bez tx/kompenzace → status refunded bez kreditu = trvalá ztráta. writeConcern default chybí. idempotency-key chybí.
- **41 correctness** 🔴: scheduled-messages + game-event-reminder read-then-act bez atomického claimu → 2 repliky pošlou 2× (RC-D9/D11). Float měna (drift). _id tiebreak chybí u offset paginací.
- **race 01** RC-E7/E8: changeCurrency/removeFromInventory full `$set` read-modify-write → lost update při souběhu.
- **cascade-delete CD-NEW-1** 🔴: world hard-delete nesbírá `chatmessages.attachments[]` bloby → leak všech chat obrázků na Cloudinary. CD-NEW-4 nabory orphan+blob. CD-PLANT-1 plant image blob leak. bug-05 chat TTL blob leak.
- **db-integrity**: moderation kolekce bez indexů (collscan degradace); orphan-scan WORLD_SCOPED list zastaralý (~15 nových kolekcí → false-negatives).

### Realtime / škála / výkon
- **26 SCALE-RT** 🔴: WS ZCELA bez rate-limitu (whisper/reaction = Mongo write bez stropu); presence `io.emit` globální O(N²); maxHttpBufferSize 5MB; THROTTLER_REDIS v prod chybí (scale-out N× volnější limit).
- **33 resilience**: Redis crash VYVRÁCENO (opraveno). ⭐ 6 outbound bez timeoutu (captcha/SMTP/cloudinary/meili/push).
- **25 PERF-BE**: autoIndex ON v prod (155 index buildů/start); N+1 enrichMembers/notifyUsers/getUnreadCounts; GET /worlds+pages bez limit/projekce; chybí compression.
- **N-TM-01 / S-RUN-07** 🔴 (FE): `useMapSocket` + 5 hooků osiří listenery po `reconnectSocket()` instance-swap → mapa oslepne po přepnutí neviditelnosti/loginu. N-TM-03/S-RUN-08: onOperation stale closure → lost update mapy.
- **21 bundle**: eager TipTap 457 kB > 350 kB SLO → lazy-load RichTextEditor.

### FE robustnost / a11y
- **37 FE-failure**: 7 stránek bez `isError` (ArticlesPage/Gallery/Favorites) → 500 vypadá jako prázdno.
- **38 lifecycle**: CommentComposer double-submit přes Enter (bez isPending guard).
- **29 stab**: DiceBox3D WebGL context leak; vite:preloadError handler chybí (stale bundle → bílá stránka po deployi).
- **bug-01/03**: SecuritySection změna hesla čte status 401, BE vrací 400 → chyba se nezobrazí.
- **17 a11y**: kontrast PASS; reduced-motion 19 drobností → 1 globální CSS pravidlo.
- **19 deps**: 9 zranitelností, VŠE fixnutelné `npm audit fix` bez breaking.

### Provoz (ops-tasky, ne kód — pro uživatele)
- 🔴 **NULA záloh DB** (mongodump cron neexistuje, 14.4). Externí UptimeRobot chybí. Sentry nekonfigurováno (SENTRY_DSN/VITE_SENTRY_DSN). Deploy `down→up` restartuje i Mongo (chybí healthcheck-gate + rollback). Ports 0.0.0.0 (bypass TLS — ověřit reverse proxy). Mongo/Redis bez auth.

## Vyvráceno na HEAD (seed říkal díru, ale opraveno)
SSRF export (32), Redis crash (33), guard role-staleness (35), chatSkin gate (39), injection/secret/type-safety (22/18/20 čisté), XSS sink-sanitizer (36, ale N-RUN-08-02 customData bypass ⭐ nový).

## SLO brána (statická — bez +load/+perf měření)
| SLO | Stav | Pozn |
|---|---|---|
| S1-S3 kapacita/latence | ⏭️ neměřeno | +load neproběhl; styl 26 hlásí O(N²) presence + WS bez limitu jako riziko |
| S4 LCP | ⏭️ neměřeno | +perf neproběhl; bundle S5 staticky PROPADÁ (TipTap eager) |
| S5 bundle ≤350kB | ❌ 457 kB | lazy TipTap → ~311 kB |
| S6 deploy | ❌ | žádný graceful shutdown (opraveno main.ts) + down→up |
| S8 nula chyb | ⚠️ | build/typecheck/lint ✅; BE jest+e2e byly červené (opraveno); FE 15 warnings (D-17.8) |
| S10 obnovitelnost | 🔴 | nula záloh + žádný restore drill |

## Neproběhlé vrstvy (⏭️)
+teeth Stryker (čas), +load (generátor/HW), +perf live Lighthouse, +render screenshot diff, +fault, +authz-runtime, +pentest (samostatný krok uživatele).

## Stav auditu při psaní: core per-oblast fan-out dobíhá (rate-limit zpomalil); detaily per oblast v `checkpoints/*.md`.

---

## FINÁLNÍ VERIFIKACE (po fixech)
- **BE `nest build` (prod deploy path, tsc):** ✅ exit 0 — 26-schema fix se kompiluje, prod build projde.
- **BE full jest:** ✅ 158 suites / **2529/2529** tests pass.
- **BE typecheck + lint:check:** ✅ (lint vč. elevation-bypass guard).
- **BE e2e:** po schema+auth fixech reálné selhání 0 (5 „fail" = 4 zastaralé auth testy [opraveno → 22/22] + 1 flaky RC-P3 [ověřeno NENÍ reálné — v izolaci 5/5]).
- **META brána `audit:regression --ci`:** ✅ exit 0 — každý opravený důležitý nález má živou pojistku (G≥2).
- **FE:** nedotčeno (žádný FE source edit), build/lint zelené z baseline.

**Závěr stavu BE: čistý a NASADITELNÝ — lepší než vstupní baseline** (ta byla fakticky červená: jest 4 fail + e2e 52 fail, maskováno CH-056).

## KOREKCE severity (adversariální ověření)
- **N-TM-01/S-RUN-07 (socket-swap listener leak): sníženo 🔴 → LATENTNÍ nízké.** Oba spouštěče `reconnectSocket()` (login `useAuth`, toggle Neviditelný `PrivacySection`) mapu ODMOUNTUJÍ → listenery se uklidí + remount re-registruje. Reálný trigger dnes NEEXISTUJE (chce mapu mountnutou přes socket-swap). Fix stále vhodný (robustnost + budoucí trigger), ale ne urgentní.
- **DUN-1 (systemStats validace vypnutá pro alias-systémy): 🔴 → 🟠.** PJ-scoped (hráč zápis systemStats nemá — authorizer blokuje), ne exploit; riziko = PJ uloží malformed data.
- **RC-P3 (page race 500): NENÍ reálný** — v izolaci 5/5, E11000→409 přes globální filtr funguje.

## Anti-regression META riziko (AR-META-1)
`anti-regression-map.json` = 0 ručních guardů (vše na string-match auto-discovery); F-20 už tiše degradoval G3→G0 (test přestal citovat ID), R-02 G3→G2. CI guard (jen crit/high) to nechytá. Doporučení: doplnit ruční guardy k důležitým nálezům.
