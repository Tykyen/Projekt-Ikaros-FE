# 05 — Request / WS / job logy

> **Otázka:** loguje se HTTP request body/headers, WS payload zpráv, nebo periodické joby jména/e-maily?
> Je user input v logu sanitizovaný? **Osy:** `REQ` `WS` `JOB` `INJ`. **Plocha:** [main.ts] middleware,
> gateways (base/global-chat/maps), cron joby (cleanup/scheduled/reminder).

## Povrch

| Vrstva | Místa (recon) | Co loguje | Riziko |
|---|---|---|---|
| HTTP middleware | [main.ts] **bez morgan/log middleware** | — | 🟢 `REQ` — K-LOG15 (potvrdit) |
| base.gateway.ts | 4 log | connection/error? | ověřit payload |
| global-chat.gateway.ts | 7 log | zprávy? IDs? | 🟡 `WS` ověřit |
| maps.gateway | error emit + log | souřadnice/scéna? | ověřit |
| cleanup-inactive-users.job | 3 | počty? jména/e-maily? | 🟡 `JOB` |
| clean-messages.job | 3 | počty | pravděp. ✅ |
| scheduled-messages.job | 2 | IDs | ověřit |
| game-event-reminder.job | 3 | event/user IDs? | ověřit |
| account-cleanup.cron | 4 | smazané účty — e-maily? | 🟡 `JOB`/`PII` |

## Co ověřit

1. **K-LOG15** `REQ` 🟢 — žádný morgan/`app.use(logger)` (recon) → žádné body/header/cookie logging.
   **Potvrdit** M-SCAN (žádný interceptor neloguje `req`). Pozitivní — žádná oprava.
2. **`WS`** — gateways: logují jen connection/IDs, nebo **obsah zprávy** (chat content = PII)? global-chat 7
   log = nejvíc → projít. Cross-ref [paměť `project_ws_security_patterns`].
3. **`JOB`/`PII`** — `account-cleanup.cron` / `cleanup-inactive-users` logují počty (✅) nebo **jména/e-maily**
   mazaných účtů? Periodický log s PII = trvalá stopa o uživatelích i po smazání (cross-ref cascade-delete).
4. **K-LOG11** `INJ` — user input v log stringu: username/world name/search dotaz/chat content s `\n` →
   forging. Recon: BE loguje hlavně IDs (nízké riziko). Cesty k ověření: search query logging, chat content
   logging, jakýkoli `${userInput}` v log textu. Sanitizace: strip/escape `\n\r` před logem (nebo logovat
   jen ID, ne text).

## Pasti
- WS log s payloadem = chat obsah do logu (PII + objem). Ověřit `emit('error', payload)` neloguje payload.
- Job loguje e-mail mazaného účtu = PII přežije smazání účtu v logu (rozpor s GDPR/cascade-delete).
- `INJ` low-risk tady, protože BE preferuje IDs — ale search/chat content cesty to mění; potvrdit, neodmítat
  od stolu.
