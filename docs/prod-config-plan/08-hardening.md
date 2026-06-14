# 08 — Hardening (NODE_ENV, pipe, Swagger, /health, headers, throttle, TLS, TTL)

> **Osy:** `HD` (hardening), `RL` (rate-limit/DoS), `TL` (TLS/transport), `KR` (key/TTL).
> **Cílová otázka:** nemá produkční běh **otevřené dveře navíc** — odkrytý Swagger, info-leak `/health`,
> vypnutý throttle, plaintext transport, tiše propustný ValidationPipe, příliš dlouhé token TTL?

---

## Povrch

| Oblast | Kde | Recon stav |
|---|---|---|
| `NODE_ENV` větvení | database/redis/embedding | různá sémantika (`production`/`test`) |
| ValidationPipe | main.ts:20 | `{ whitelist:true, transform:true }` — **bez `forbidNonWhitelisted`** |
| Swagger | main.ts:54-55 | zapnutý (read-only docs) |
| `/health` | app.controller.ts:46 | vrací env stav (cloudinary/vapid/...) **bez auth** |
| Body limit | main.ts:18-19 | `5mb` (json + urlencoded) |
| Throttler | (recon) | globální 100/min/IP + upload `@Throttle` 20/min |
| Security headers | nginx.conf:33-35 | `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection` |
| JWT/refresh TTL | auth.module.ts:30 | 7d / 30d |
| Token transport | FE socket.ts / client | JWT z localStorage (Bearer) |

---

## Kontrolní kroky (sweep)

1. **ValidationPipe** (K-PC7) — bez `forbidNonWhitelisted` → neznámá pole se tiše zahodí (forward-compat, ale maskuje FE↔BE drift). `HD`: zvážit zapnutí + dopad (cross-ref [form-schema] naming-drop nálezy). Pozn. [feedback_be_restart_required] — whitelist tiše dropuje pole bez restartu.
2. **`/health` leak** (K-PC8) — vrací stav konfigurace (které služby degraded). Bez auth = info o infrastruktuře. `HD`/`TL`: omezit detail pro neautentizovaný přístup, nebo gate.
3. **Swagger v prod** — read-only, ale exponuje celé API schema. Ověř, zda gate na `NODE_ENV !== 'production'` (nebo akceptovat jako by-design).
4. **Throttler globálně** (K-PC17) — je `ThrottlerGuard` registrován **globálně** (APP_GUARD) a aktivní v prod, ne jen na upload? Body 5mb limit konzistentní s WS 5MB buffer (oblast 03)?
5. **TLS/transport** (K-PC18) — všechna prod URL `https://` (oblast 07 kruh); Cloudinary `secure:true` (oblast 04); SMTP `secure`/STARTTLS (oblast 05). JWT v **localStorage** → XSS expozice; je refresh token v httpOnly cookie (`secure`+`sameSite`) nebo taky localStorage? Ověřit transport refresh tokenu.
6. **JWT/refresh TTL** (K-PC12) — 7d access + 30d refresh. Dlouhé okno; žádná rotace refresh tokenu? Cross-ref refresh-token.schema (`revoked`, `jti`). `KR`: zvážit kratší access + rotaci.
7. **NODE_ENV konzistence** — sémantika `=== 'production'` vs `=== 'test'` napříč; žádná dev-only větev aktivní v prod.

---

## Seed mapping

- **K-PC7** 🟡 `HD` — ValidationPipe bez forbidNonWhitelisted.
- **K-PC8** 🟡 `HD`/`TL` — /health info leak.
- **K-PC12** 🟡 `KR` — JWT/refresh TTL dlouhé.
- **K-PC17** 🟡 `RL` — Throttler registrace v prod.
- **K-PC18** 🟡 `TL`/`SC` — JWT localStorage / refresh cookie flags.

## Pasti

- ⚠️ `forbidNonWhitelisted` zapnutí může rozbít FE volání s extra poli — ověřit dopad před změnou (cross-ref [form-schema audit]).
- ⚠️ nginx headers řeší jen FE statiku; BE API odpovědi nemají stejné headers (ověřit helmet/CSP na BE).
- ⚠️ Throttler dev-disable: některé projekty vypnou throttle v test/dev — ověř, že prod ho má.

## Pozitiva k ověření

- ✅ ValidationPipe `whitelist:true` (drop neznámých polí — bezpečnější default).
- ✅ nginx security headers + immutable caching + no-cache HTML/SW.
- ✅ Refresh tokeny v DB s `revoked`/`jti` (revokovatelné).
- ✅ Body limit 5mb (ne neomezený).
