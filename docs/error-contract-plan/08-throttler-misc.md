# 08 — Throttler / transport / misc (`TH` `IM`)

> **Otázka:** mají okrajové chybové/odpovědní cesty (429 rate-limit, success wrapper) konzistentní tvar?

## Povrch
- `ThrottlerModule.forRoot([{ ttl:60_000, limit:100 }])` ([app.module.ts:66]) + per-route override (auth: register 10/min, login 5/min, refresh 5/min).
- `response.interceptor` ([common/interceptors]) — success `{data}` **jen na části** controllerů.

## Kontrolní body
### `TH` throttler/429
- [ ] **429 tvar** — `ThrottlerException` extends `HttpException` → projde filtrem → `{error:{code:'TOO_MANY_REQUESTS',message,timestamp}}`. M-SHAPE potvrdí (vystřel >limit). **K-EC11.**
- [ ] **Message jazyk** — default ThrottlerException message EN (`"ThrottlerException: Too Many Requests"`)? Lokalizace? `LN`.
- [ ] **FE zobrazení** — ukazuje FE u 429 „příliš mnoho pokusů, zkus později"? RegisterModal `mapErrorToBanner` 429 větev ✅ (recon) — ověřit ostatní.
- [ ] **Retry-After** — posílá BE `Retry-After` header? FE ho čte?

### `IM` success parita (okrajově — success ≠ error)
- [ ] `response.interceptor` `{data}` jen někde → FE někde čte `r.data`, jinde `r.data.data`? Tvar success nejednotný → ale to je **success contract**, ne error. Zaznamenat jako cross-ref / dluh, neřešit do hloubky zde. **K-EC9.**

## Metoda
M-SHAPE (429 vystřel) → L4. Čtení interceptoru → L2.

## Seed
`K-EC11` (429 tvar 🟡), `K-EC9` (success parita 🟡, okrajové).
