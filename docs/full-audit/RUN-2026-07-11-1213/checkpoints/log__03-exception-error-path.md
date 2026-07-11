# log-hygiene — 03 exception & error path (RUN-2026-07-11-1213)

**Osy EXC/OBJ/TOP/CTX. Verdikt: L1-L3 čisté; 1 NOVÁ osa egress → LH-13.**

## Ověřeno
- **HttpExceptionFilter** [http-exception.filter.ts] — jediné kontrolované místo se stackem:
  - neočekávané chyby [:159-164] → server-side `name: message` + `stack`, klientovi generická CS hláška bez stacku (error-contract F1). ✅
  - **Mongo duplicate key** (nese `keyValue` s e-mailem!) klasifikován jako **409 DUPLICATE_KEY** [:127-133], NE 5xx → NEjde do Sentry (viz níže). ✅ dobrá hranice.
- **`logger.error(msg, err)` vzor** — codemod LH-01 drží: moderation listenery (world-news/ikaros-messages/bestiae `moderation-enforcement.listener.ts`) používají `logError(...)` v catch → stack string, ne celý `Error`. Nové listenery = čisté. ✅
- **TOP-level** (LH-06) [main.ts:36-48] — unhandledRejection loguje `reason.stack`; uncaughtException loguje `err.stack` + `process.exit(1)`. Žádný raw dump. ✅
- **CTX** — catch bloky logují `worldId`/`userId`/entity ID + err.message/stack, ne celý dto/body/user. Scanner CTX:9 = concat false-positives + `payload.userId` (IDs). ✅

## 🆕 LH-13 (🟡) — NOVÉ: Sentry.captureException na 5xx bez scrubberu
[http-exception.filter.ts:62] `Sentry.captureException(exception)` na `status>=500`. Egress do GlitchTip/Sentry, **deploy-wired** přes `SENTRY_DSN` secret ([docker-compose.prod.yml:124], [.github/workflows/deploy.yml:80]).
- **Riziko nízké:** BE `Sentry.init` [main.ts:23-28] bez `sendDefaultPii` → SDK default **false** → request body/headers/cookies (heslo na /auth, JWT) se NEpřipojují. 5xx = neočekávaný `Error` (stack+message). Duplicate-key (email) je 409, ne 5xx → nezachycen.
- **Gap:** žádný `beforeSend` scrubber; `log-error.util.ts:7` slibuje „sem půjde případný scrubber" — k Sentry nezapojen. Ostřejší varianta je FE (log__07). Doporučení: explicitní `sendDefaultPii:false` + `beforeSend` (strip Authorization/password/token/cookie) před ostřejším využitím.

Alert `detail` na 5xx [:53-56] = `name: message`.slice(0,500), žádný celý objekt/body. ✅
