# log-hygiene / 07-fe-browser-console — checkpoint RUN-2026-06-20-1621

> Auditor: read-only sweep. HEAD k 2026-06-20. Záběr: FE browser console — osy `FE` + `LVL`.
> Scanner vstup: `scanners/logs.txt` (FE runtime 15, OBJ:9). Statická hloubka L1–L3.

---

## Pokrytí

| Soubor | Stav |
|---|---|
| `vite.config.ts` | ✅ přečteno |
| `src/shared/ui/GlobalErrorBoundary.tsx:19` | ✅ přečteno |
| `src/features/chat/api/socket.ts:41` | ✅ přečteno |
| `src/features/auth/components/RegisterModal.tsx:61` | ✅ přečteno |
| `src/features/world/pages/WorldDiarySchemaEditorPage/WorldDiarySchemaEditorPage.tsx:289` | ✅ přečteno |
| `src/features/world/pages/CharacterDetailPage/diary-systems/DiarySystemProvider.tsx:40` | ✅ přečteno |
| `src/features/world/tactical-map/TacticalMapView.tsx:768` | ✅ přečteno |
| `src/features/world/tactical-map/hooks/useMapScene.ts:178,203` | ✅ přečteno |
| `src/features/world/tactical-map/hooks/useTokenTexture.ts:35` | ✅ přečteno |
| `src/features/world/tactical-map/components/MapBackground.tsx:68` | ✅ přečteno |
| `src/features/world/tactical-map/utils/applyOperationToScene.ts:402` | ✅ přečteno |
| `src/features/world/tactical-map/components/schema-form/formula.ts:207` | ✅ přečteno |
| `src/themes/useThemeSync.ts:46,81` | ✅ přečteno |
| BE `src/modules/maps/maps.gateway.ts` (socket `error` payload tvar) | ✅ cross-ref |
| `log-hygiene-audit.md` (LH-12 stav + registr) | ✅ přečteno |
| `log-hygiene-plan/07-fe-browser-console.md` (plán + pasti) | ✅ přečteno |
| Esbuild chování `drop: ['console']` | ✅ ověřeno node transform |

Všech 15 runtime FE console.* volání prošlo čtením (scanner match). 2 testové volání (`parity.spec.ts`) potvrzen test-only gate — mimo záběr.

---

## Dosažená L vs cílová L

| Osa | Cíl | Dosaženo | Poznámka |
|---|---|---|---|
| `FE` — obsah console volání | L3 | **L3** | všechna volání přečtena + taint ověřen + dosažitelnost v prod |
| `LVL` — console stripping v prod buildu | L3 | **L3** | esbuild `drop:['console']` ověřen strojově (node transform) — dopad potvrzen L3 |

---

## Nálezy

### LH-RUN-01 — [LVL/FE] `drop:['console']` paušálně smaže i `console.error`/`console.warn` v prod — neutered GEB + captcha diagnostic 🟡 🆕

**Kde:** `vite.config.ts:18`
```
esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {}
```
**Strojový důkaz:** `esbuild.transform(code, { drop: ['console'] })` → výstup `""` (prázdný string) pro všechna `console.log/error/warn/debug`. Žádná výjimka.

**Dopad:**
1. `GlobalErrorBoundary.tsx:19` `console.error('[GEB]', error, info.componentStack)` je v prod **tiše odstraněna**. Plán oblasti explicitně varoval: *"Nesmazat `console.error` z `GlobalErrorBoundary` — je to legitimní diagnostika; `drop: ['console']` paušálně by ji odstranil."* Oprava LH-12/PC-09 tuto past přesně spustila — implementace šla against vlastní „Pasti" sekce.
2. `RegisterModal.tsx:61` `console.error('[captcha] VITE_TURNSTILE_SITE_KEY chybí...')` — kód je okomentován jako **„Viditelné v prod logu"**, ale v prod je tiše odstraněn. Diagnostický signál o miskonfiguraci captchy je v prod konzoli zcela neviditelný.
3. Všech 8 `console.error` (useMapScene catch-up, TacticalMapView spawn, DiarySystemProvider styles, socket error event) jsou v prod tiše odstraněny — žádné prohlížečové chyby uživatele nebo PJ viditelné.

**Závažnost:** 🟡 střední — FE leak je vždy jen do uživatelovy konzole (žádný egress), ale diagnostika reálných selhání je v prod zcela slepá. GEB konkrétně: React crash v prod = prázdná stránka bez jakékoli stopy v konzoli.

**Návrh** (dle původního plánu 07-fe-browser-console.md → návrh LVL):
```ts
// vite.config.ts — alternativa respektující pasti sekci plánu:
esbuild: mode === 'production'
  ? {
      drop: ['debugger'],
      pure: ['console.log', 'console.debug', 'console.info'],
    }
  : {}
```
→ `console.log`/`debug`/`info` odstraněny (debug šum), `console.error`/`console.warn` zachovány (GEB + captcha diagnostic + taktická mapa).

**L3** (strojové ověření esbuild drop + čtení kódu + dosažitelnost v prod).

---

### LH-RUN-02 — [FE/OBJ] socket.ts:41 payload — `{code,message}` bez PII, ale v prod odstraněn (cross-check) ✅ 🔓

**Kde:** `src/features/chat/api/socket.ts:41`
```ts
console.error('[socket] server error event', payload);
```
**Ověření BE tvar payloadu:** `maps.gateway.ts:66,77,90,110,123,158,226,305` — všechna `client.emit('error', ...)` předávají `{ code: 'WS_XXX', message: 'statický string' }`. Žádné PII, žádný token, žádný stack. Původní podezření K-LOG9 (co je v payloadu?) uzavřeno jako ✅ čisté.

**Stav:** v prod buildu odstraněno `drop:['console']` → `payload` do browser konzole neteče v prod. V dev ano, ale obsah je bezpečný.

**Nový stav:** ♻️ potvrzeno čisté — žádný nový nález.

---

### LH-RUN-03 — [FE/OBJ] OBJ:9 taint — všechna catch-error volání čistá ✅ 🔓

**Kde:** 8 ze 9 OBJ volání jsou `catch(err)` bloky předávající `err` do `console.error/warn`:
- `useThemeSync.ts:46,81` — `AxiosError` (HTTP chyba PATCH /users/me, žádný secret)
- `DiarySystemProvider.tsx:40` — dynamický import error (WebpackChunkError / NetworkError)
- `useMapScene.ts:178,203` — WS catch-up HTTP error
- `MapBackground.tsx:68` — PIXI `Assets.load` NetworkError (URL v logu = texture URL, ne PII)
- `WorldDiarySchemaEditorPage.tsx:289` — `JSON.parse` SyntaxError z lokálně nahraného souboru uživatele; žádný server data

9. `GlobalErrorBoundary.tsx:19` — `Error` objekt + `componentStack` (React interní stack, žádný PII/secret)

**Závěr:** žádný OBJ taint v nálezové třídě `SEC`/`PII`. Všechny jsou lokální chyby (network/parse/asset). Zbývá pouze pattern `err` (celý Error objekt) vs `err.message` — ale FE chyby jsou výhradně browser-side, žádný Mongoose KeyValueError s e-mailem jako na BE.

**Nový stav:** ♻️ čisté, žádný nový nález.

---

### LH-RUN-04 — [FE] `useTokenTexture.ts:35` loguje `imageUrl` — potenciální URL token leak 🟢

**Kde:** `src/features/world/tactical-map/hooks/useTokenTexture.ts:35`
```ts
console.warn('[useTokenTexture] load failed:', imageUrl);
```
`imageUrl` je URL obrázku tokenu (mapová textura). Ověřeno: tokeny jsou nahrávané přes Cloudinary bez signed URL / auth tokenů v URL (veřejné CDN URL). Neteče žádný auth token.

**Stav:** čisté. V prod stejně odstraněno `drop:['console']`. ✅

---

## Shrnutí OBJ:9

| # | Soubor:ř | OBJ arg | Citlivost | Verdikt |
|---|---|---|---|---|
| 1 | `useThemeSync.ts:46` | `err` (AxiosError) | ❌ | ✅ čisté |
| 2 | `useThemeSync.ts:81` | `err` (AxiosError) | ❌ | ✅ čisté |
| 3 | `GlobalErrorBoundary.tsx:19` | `error` + `componentStack` | ❌ | ✅ čisté (ale odstraněno drop) |
| 4 | `DiarySystemProvider.tsx:40` | `err` (import error) | ❌ | ✅ čisté |
| 5 | `useMapScene.ts:178` | `err` (HTTP/WS error) | ❌ | ✅ čisté |
| 6 | `useMapScene.ts:203` | `err` (HTTP/WS error) | ❌ | ✅ čisté |
| 7 | `MapBackground.tsx:68` | `err` (PIXI NetworkError) | ❌ | ✅ čisté |
| 8 | `WorldDiarySchemaEditorPage.tsx:289` | `err` (SyntaxError local file) | ❌ | ✅ čisté |
| 9 | `socket.ts:41` | `payload` ({code,message}) | ❌ | ✅ čisté |

---

## PROOF-REQUEST

**PR-07-01** — Ověřit v reálném prod buildu (`npm run build` + `dist/` inspect), zda `console.error` z `GlobalErrorBoundary` je skutečně odstraněna (např. `grep -r 'GlobalErrorBoundary' dist/`). Esbuild chování ověřeno strojově, ale prod bundle output nebyl čten. Vyžaduje spuštění buildu.

**PR-07-02** — Ověřit, zda v prod prohlížeči (po buildu) React crash zobrazí prázdnou stránku bez jakékoli stopy v DevTools Console → potvrdí rozsah ztráty diagnostiky (GEB).
