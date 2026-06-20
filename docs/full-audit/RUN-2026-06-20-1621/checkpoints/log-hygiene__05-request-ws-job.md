# log-hygiene / 05-request-ws-job — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: agent (read-only sweep).

## Pokrytí

| Vrstva | Soubory přečteny | Stav |
|---|---|---|
| HTTP middleware / interceptory | main.ts, response.interceptor.ts, app.module.ts | ✅ celé |
| WS gateways (všechny) | base.gateway.ts, app.gateway.ts, chat.gateway.ts, global-chat.gateway.ts, maps.gateway.ts + 11 dalších | ✅ celé |
| Cron joby | cleanup-inactive-users.job.ts, clean-messages.job.ts, scheduled-messages.job.ts, game-event-reminder.job.ts, account-cleanup.cron.ts, world-cleanup.cron.ts | ✅ celé |
| Přilehlé služby | push.service.ts (volána z jobů), presence-messages.ts, log-error.util.ts | ✅ celé |
| Scanner výstup | logs.txt (M-SCAN 2026-06-20) | ✅ přečten |
| Registr | log-hygiene-audit.md (stav LH-01..12) | ✅ přečten |

## Dosažená L vs cílová L

| Osa | Cíl | Dosaženo | Poznámka |
|---|---|---|---|
| REQ | L2–L3 | **L3** | main.ts bez morgan/middleware; response.interceptor.ts jen wrap data (no log); žádný request-logging interceptor → K-LOG15 potvrzeno |
| WS | L2–L3 | **L2–L3** | 16 gateways zkontrolováno; 13 bez jediného logger volání; chat.gateway.ts 0 logů; maps.gateway.ts 0 logů; base.gateway.ts 3 log volání (IDs, bezpečné) |
| JOB | L2–L3 | **L2–L3** | všechny joby/crony projity; počty ✅; 2 crony s přímým logger.error (viz nálezy) |
| INJ | L2–L3 | **L3** | žádný user-input (search query / chat content / event.title / username) v žádném log stringu; presenceLine s username jde do chat zprávy, NE do logu |

Živá infra (M-RUNTIME) pro tuto oblast: nálezy jsou konzistentní s M-RUNTIME (6/6 zelené) a M-SCAN výstupem. PROOF-REQUEST viz níže.

## Nálezy

### LH-RUN-05-01 — [JOB] Přímý `logger.error` (ne `logError`) v account-cleanup.cron + world-cleanup.cron · 🆕

**Kde:**
- `backend/src/modules/users/services/account-cleanup.cron.ts:70–72`
  ```ts
  this.logger.error(
    `Hard-cleanup selhal pro ${u.id}: ${(err as Error).message}`,
  );
  ```
- `backend/src/modules/worlds/services/world-cleanup.cron.ts:48–50`
  ```ts
  this.logger.error(
    `Hard-delete světa ${w.id} selhal: ${(err as Error).message}`,
  );
  ```

**Osa:** `JOB`/`EXC`  
**Sev:** 🟢 (fakticky bezpečné — loguje jen ID + `err.message` jako string, ne Error objekt) / ⚖️ konzistentnost

**Dopad:**
- Data do logu: `u.id` (MongoDB ObjectId = not PII) a `(err as Error).message` (string). Žádný celý Error objekt, žádný stack, žádné PII.
- FAKTICKÝ LEAK: žádný. Pattern je bezpečný.
- KONZISTENTNOST: OBA soubory obcházejí `logError` util zavedený LH-01. Kdyby pattern v budoucnu přešel na `logger.error(msg, err)` (celý objekt), util by to zachytil — takhle ne. Scanner CI guard (M-SCAN `--ci`) to taky nepřímačí, protože string-only volání nevypadá jako `err`-objekt leak.

**Návrh:** Unifikovat na `logError(this.logger, message, err)` — konzistentní s ostatními 43 místy, guardnuté scrubbingem. Nízká priorita (bezpečné), vhodné opravit v příštím průchodu.

**L2** · 🆕

---

### LH-RUN-05-02 — [JOB] `push.service.ts:156` loguje `sub.endpoint` (device-specific push URL) + `String(err)` · 🆕

**Kde:** `backend/src/modules/push/push.service.ts:156`
```ts
this.logger.warn(`Push failed for ${sub.endpoint}: ${String(err)}`);
```

**Osa:** `JOB`/`PII`  
**Sev:** 🟡 střední

**Dopad:**
- `sub.endpoint` = URL web push endpointu (FCM/APNS URL s device-specific tokenem v path, např. `https://fcm.googleapis.com/fcm/send/<deviceToken>`). Jde o device identifikátor — ne jméno/email, ale citlivé ID vázané na konkrétní zařízení/uživatele.
- `String(err)` = plná stringifikace chybového objektu (u web-push může obsahovat push-provider chybový body, statusCode, endpoint URL znovu).
- V prod logu (Docker `json-file`, čteno operátorem) zůstane záznam „Push failed for https://fcm.../token123456" — provazuje device token s logem.
- Používá přímý `this.logger.warn()`, ne `logWarn` helper (konzistentnost jako LH-RUN-05-01).

**Návrh:**
1. Zkrátit endpoint na posledních N znaků nebo hash: `sub.endpoint.slice(-20)` / anonymizovat.
2. `String(err)` → `err instanceof Error ? err.message : String(err)` (nepropustit celý objekt).
3. Přejít na `logWarn(this.logger, ..., err)` helper.

**L2** · 🆕

---

### LH-RUN-05-03 — [REQ] K-LOG15 potvrzeno — žádný morgan / request interceptor · ♻️

**Kde:** `backend/src/main.ts`, `backend/src/common/interceptors/response.interceptor.ts`

**Osa:** `REQ` 🟢  
**Sev:** pozitivní

**Verdikt:** `main.ts` bez `morgan`/`app.use(logger)`. `response.interceptor.ts` jen wrappuje `data:{...}` — žádný log. Žádný interceptor neloguje request body/headers/query/cookies. K-LOG15 ✅ potvrzen, **bez opravy**.

**L3** · ♻️ (potvrzuje existující ✅ v registru)

---

### LH-RUN-05-04 — [WS] base.gateway.ts loguje room string (user-controlled?) · ♻️

**Kde:** `backend/src/gateways/base.gateway.ts:36`
```ts
this.logger.log(`Client ${client.id} joined room: ${room}`);
```

**Osa:** `WS`/`INJ`  
**Sev:** 🟢 pozitivní (nejedná se o nález)

**Verdikt:** `joinRoom()` je voláno POUZE z `AppGateway.handleJoinRoom()` (ověřeno grepem), kde `room` projde `ROOM_PATTERN = /^[a-z]+:[a-zA-Z0-9]+$/` PŘED voláním — žádný `\n`/speciální znak nemůže projít. INJ vyloučen. Ostatní gateways volají `client.join()` přímo (neprojdou přes joinRoom/logger).

**L3** · ♻️

---

### LH-RUN-05-05 — [JOB] `account-cleanup.cron.ts:47` + `world-cleanup.cron.ts:34` — `logger.debug` v cron · ♻️

**Kde:**
- `account-cleanup.cron.ts:47`: `this.logger.debug('AccountCleanupCron.sweep — nic k hard-cleanup')`
- `world-cleanup.cron.ts:34`: `this.logger.debug('WorldCleanupCron.sweep — nic k hard-cleanup')`

**Osa:** `JOB`/`DBG`  
**Sev:** 🟢 pozitivní

**Verdikt:** Oba `logger.debug` volají jen literál (žádná data). V prod jsou gated LH-02 (`isProd => ['log','warn','error']`). Žádné PII/secret do debug. ✅

**L3** · ♻️

---

### LH-RUN-05-06 — [INJ] Žádný user-input v log strings oblasti 05 · ♻️

**Verdikt:** Projita všechna log volání: joby logují jen count/ID/err.message; WS gateways logují jen socket IDs nebo volají logWarn s userId. `event.title` v game-event-reminder jde do push notifikace (ne do logu). `presenceLine(username)` jde do chat systémové zprávy (ne do logu). INJ riziko = **nulové** v oblasti 05. ✅

**L3** · ♻️

---

## PROOF-REQUEST

> Oblast 05 je statická (L1–L3) a nevyžaduje živou infrastrukturu pro ověření. M-RUNTIME (L5) byl postaven pro oblasti 01–04 (SEC/PII/EXC) a je zelený. Oblast 05 nemá runtime-závislé nálezy — proof requestů není třeba.

Nicméně pro nález LH-RUN-05-02 (`sub.endpoint` v logu) je ideální ověření:

- **PROOF-REQUEST #1 (volitelné, L5):** Triggerovat push k neplatnému endpointu → zachytit stdout → ověřit, zda endpoint URL prosvítá do logu. Lze přidat jako test case do `log-hygiene.spec.ts`.

## Souhrn

| ID | Osa | Sev | Stav |
|---|---|---|---|
| LH-RUN-05-01 | JOB/EXC | 🟢 konzistentnost | 🆕 nový (nízká priorita) |
| LH-RUN-05-02 | JOB/PII | 🟡 střední | 🆕 nový |
| LH-RUN-05-03 | REQ | 🟢 pozitivní | ♻️ K-LOG15 potvrzeno |
| LH-RUN-05-04 | WS/INJ | 🟢 pozitivní | ♻️ potvrzeno |
| LH-RUN-05-05 | JOB/DBG | 🟢 pozitivní | ♻️ gated |
| LH-RUN-05-06 | INJ | 🟢 pozitivní | ♻️ nulové riziko |
