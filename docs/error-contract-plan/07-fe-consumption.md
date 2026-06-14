# 07 — FE consumption & display (`FE` `BD` `RT`)

> **Otázka:** přečte FE **každý** reálný tvar chyby a ukáže uživateli užitečnou českou hlášku — bez
> `undefined`, `[object Object]`, anglické věty nebo bílé obrazovky?

## Povrch
- `parseApiError`/`parseApiErrorCode` ([client.ts:88-108]) — centrální parser.
- 401 interceptor + refresh ([client.ts:37-85]).
- `toast.error` (~29 souborů), inline `useState` chyby, `setError` field-mapping.
- React Query — **žádný globální `onError`** ([main.tsx:18-25]); per-mutation handlery; `retry:1`.
- `GlobalErrorBoundary` ([shared/ui]) — `console.error` only.
- Error pages: `ForbiddenPage`/`NotFoundPage`/`ErrorPage`.

## Kontrolní body
### `FE` parser robustnost (M-FE vitest)
- [ ] tvar #1 → správná CS hláška ✅
- [ ] tvar #2 (`string[]`) → vrací `msg[0]` (ztráta ostatních) ⚠️
- [ ] tvar #3 (neobalený 500) → fallback `err.message` (EN technické) ❌ **K-EC1**
- [ ] tvar #4 (WS) → parseApiError to nezná (není axios error)
- [ ] `null`/`undefined`/non-axios → `'Neznámá chyba'` (žádný throw v parseru)
- [ ] nikdy `[object Object]` (message je objekt?) / `undefined`

### `FE` typy
- [ ] **Duplikovaný `interface ApiError`** lokálně (ChangeEmailModal aj.) místo importu `@/shared/types` → drift. **K-EC7.**
- [ ] `catch (err)` typování — `unknown` + `axios.isAxiosError` (safe) vs `any` cast.

### `RT` retry/refresh
- [ ] `retry:1` na queries — neretryuje 4xx zbytečně? (1 retry i na 404 = mírný anti-pattern, ale OK)
- [ ] refresh-fail `catch {}` ([client.ts:78]) → logout **bez** „session vypršela" hlášky → tichý redirect. **K-EC8.**
- [ ] `_retry` flag — žádná nekonečná smyčka refresh→401→refresh?

### `BD` boundary & pages
- [ ] `GlobalErrorBoundary` — jen `console.error`, žádný report (dluh, ne contract). **K-EC10.**
- [ ] 403/404 stránky hardcoded — neukazují BE `message`/`code` (OK pro UX, ale ztráta kontextu).
- [ ] chybí error boundary na world stránkách → 403 jako prázdno? Cross-ref skill `auth-policy`.

## Metoda
M-FE (vitest na parser — všechny 4 tvary) → L5. Čtení FE handlerů → L2.

## Seed
`K-EC7` (dup typ 🟡), `K-EC8` (silent refresh-fail 🟡), `K-EC10` (boundary bez reportu 🟡), `K-EC1` (FE fallback na #3).
