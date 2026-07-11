# log-hygiene — 05 request / WS / job (RUN-2026-07-11-1213)

**Osy REQ/WS/JOB/INJ. Verdikt: ✅ čisté, 0 nových nálezů.**

## Ověřeno (L2-L3)
- **REQ (K-LOG15)** [main.ts] — žádný morgan / log middleware / request interceptor loguje body/headers/query/cookies. Potvrzeno (jen helmet, ValidationPipe, body-parser). ✅
- **WS gateways** — scanner runtime taint na gateway logách = jen IDs (worldId/userId), žádný CTX/PII s payloadem zprávy. `emit('error', …)` na BE straně neloguje obsah chatu. ✅
- **JOB/cron + eventové listenery** — logují počty + entity/user IDs, ne jména/e-maily:
  - `trusted-devices.service.ts:92,105` — `userId=` (password.changed / hardDeleted). ✅
  - `world-elevations.service.ts:63` — `userId=` (hardDeleted). ✅
  - moderation listenery — `targetId`/`decisionId`. ✅
  - cleanup/account-cleanup joby — počty + IDs (scanner PII:0). ✅ PII nepřežívá smazání účtu v periodickém logu.
- **INJ (K-LOG11)** — BE preferuje IDs; user input (username/search/chat content) se v runtime log stringu neobjevuje s `\n`. Nízké riziko potvrzeno.

## 🆕 tento run: 0
Nové moduly (trusted-devices, world-elevations) logují jen `userId` — GDPR-bezpečné, konzistentní s cascade-delete auditem.
