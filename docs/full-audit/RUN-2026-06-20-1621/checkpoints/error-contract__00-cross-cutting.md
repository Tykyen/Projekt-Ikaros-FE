# error-contract / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

> Auditor: hloubkový sweep oblasti 00 (architektura chybové cesty, 4 tvary, master matice, tooling).
> Datum: 2026-06-20. Záběr: pouze tato oblast.

---

## Pokrytí

Prošel jsem:

- **BE filtr** `common/filters/http-exception.filter.ts` — HEAD stav po F1 (catch-all `@Catch()`)
- **ValidationPipe** `main.ts` + `common/pipes/validation-exception.factory.ts` — F2 stav
- **Guardy** `jwt-auth.guard.ts`, `admin.guard.ts`, `roles.guard.ts` — čtení
- **FE klient** `src/shared/api/client.ts` — interceptor, `parseApiError`, `parseApiErrorCode`
- **FE socket** `src/features/chat/api/socket.ts` — `error` event (F5)
- **Tooling** `scripts/error-contract-scan.mjs` — spuštěno: `--ci`, `--contract`, `--list`, `--emit`
- **Generované soubory** `src/shared/types/errorCodes.generated.ts`, `backend/src/common/errors/error-codes.generated.ts`
- **FE parser testy** `src/shared/api/__tests__/parseApiError.spec.ts` — structure check
- **Nové BE moduly** od audit-fix commitu (`world-export`, `world-gm-notes`, `push`, `bestiae`, 2FA/TOTP, `trusted-devices`) — throw klasifikace a vzory
- **Git diff** `0e6ac8b..HEAD` — co se změnilo v chybové vrstvě od původní opravy

### Co nebylo pokryto (L4+ infra)

- M-SHAPE e2e supertest spuštěn dříve → 12/12 ✅ (neopakoval jsem — live infra)
- M-FUZZ / M-CRAWL (L8) — dříve proběhly, neopakoval jsem
- M-FAULT / M-MUT — dříve proběhly, neopakoval jsem

---

## Dosažená L vs cílová L

| Osa | Cílová L | Dosažená L (tento sweep) | Poznámka |
|---|---|---|---|
| `EX` exception shape | L4 | **L2** (statické čtení + M-GREP scan) | L4 = e2e probe (12/12 z prior run, beze změn filtr/pipe) |
| `CO` code contract | L5 | **L3** (M-CONTRACT + dosažitelnost) | CI guard exit 0, 14 nových kódů neopublikováno |
| `VA` validation | L4 | **L2** | factory kód ověřen, e2e z prior run |
| `AL` auth-leak | L3 | **L2** | guardy čteny, parita world ✅, nové moduly bez `statusCode` |
| `UE` uncaught/500 | L4 | **L2** | filtr ověřen HEAD; L9 fault z prior run |
| `WS` websocket | L2 | **L2** | ✅ — 8×emit + 3×return beze změn, F5 ✅ |
| `FE` consumption | L5 | **L2** | client.ts ověřen HEAD, dup typy odstraněny ✅ |
| M-GREP | L2 | **L2** | scan spuštěn, 860 throwů klasifikováno |
| M-CONTRACT | L5 | **L5** | CI exit 0, drift 0 FE→BE |

Průměrná dosažená: **L2–L3**. Kritická infra (L4+: e2e, fuzz, fault) beze změn od F1-F6 → beze
změn ve filtr/pipe kódu = prior run výsledky platné.

---

## Nálezy

### EC-RUN-01 `CO` — stale `errorCodes.generated.ts` v BE i FE — 14 nových kódů neopublikováno · 🆕

**Kde:** `src/shared/types/errorCodes.generated.ts` (FE) a `backend/src/common/errors/error-codes.generated.ts` (BE) — obě mají uncommitted `git diff`

**Detail:** Od posledního `--emit` bylo do BE přidáno 14 nových doménových kódů (2FA/TOTP modul, world-export, bestiae opravy, campaign, atd.). Generované soubory (sdílený kontrakt EC audit F4) tyto kódy neobsahují a nebyly commitnuty po přidání nových modulů.

```
Přidané kódy (git diff HEAD):
  TOTP_ALREADY_ENABLED, TOTP_INVALID_CODE, TOTP_NOT_CONFIGURED,
  TOTP_NOT_ENABLED, TOTP_NO_PENDING_SETUP,
  EXPORT_FORBIDDEN, EXPORT_PJ_ONLY,
  BESTIE_NOT_OWNER, SYSTEM_BESTIE_READ_ONLY,
  CAMPAIGN_FORBIDDEN, CHANNEL_NOT_FOUND,
  CURRENCY_RATE_MISSING, INSUFFICIENT_WORLD_ROLE, WORLD_ACCESS_DENIED
```

**Dopad:** Generované soubory jsou zdokumentované jako „single source of truth" pro sdílený kontrakt, ale jsou zastaralé. Praktický dopad nulový — `ErrorCode` typ z `errorCodes.generated.ts` **není nikde importován** v reálném kódu (ani FE, ani BE), takže nesedí na compile-time enforcement. CI guard (`--ci`) to neodhalí, protože testuje jen FE→BE drift (FE switch na kódy, které BE neposílá), ne freshness generated file. Nový kód `TOTP_INVALID_CODE` je v FE použit přes string literal (`TotpVerifyStep.tsx:34`), nikoli přes typ.

**Klasifikace:** 🟡 maintenance — dokumentační debt, žádný runtime dopad.

**Návrh:** Spustit `node scripts/error-contract-scan.mjs --emit` a commitnout oba generované soubory. Zvážit přidat `--emit --ci` check do pre-commit hooku nebo CI pipeline (momentálně CI guard `--ci` freshness nekontroluje).

**L2** (tool klasifikace — git diff + scan výstup). 🆕

---

### EC-RUN-02 `CO` — 3 bestiae string-only throws (uživatelsky dosažitelné) — ♻️

**Kde:**
- `backend/src/modules/bestiae/bestiae.service.ts:85` — `NotFoundException('Bestie nenalezena')` — GET `/bestiae/:id`
- `backend/src/modules/bestiae/bestiae.service.ts:94` — `BadRequestException('worldId required for scope=world')` — POST `/bestiae`
- `backend/src/modules/bestiae/bestiae.service.ts:199` — `BadRequestException('worldId required for clone target world')` — POST `/bestiae/:id/clone`

**Detail:** Tři throow bez doménového `code` objektu — filtr jim přiřadí generický `HttpStatus[status]` kód (`NOT_FOUND`, `BAD_REQUEST`). Zůstaly po refactoru bestiáře (commit `d78a19c` opravil jiné ForbiddenException, ale tyto tři přeskočil). Jsou to ♻️ pre-existující seed kandidáti z EC-07 (31 throwů bez kódu, nyní 29/860 = 3 %).

**Dopad:** FE nemůže field-mapovat ani reagovat specificky na chybu Bestie. Uživatel dostane generický toast s CS textem (text je ale česky ✅ — jen code je generické). Praktický dopad nízký — tyto cesty nejsou v kritickém UX toku.

**Klasifikace:** 🟡 (♻️ — podmnožina stávajícího EC-07, ne nový nález). Beze změny závažnosti.

**Návrh:** Doplnit `{ code: 'BESTIE_NOT_FOUND' }` / `{ code: 'BESTIE_WORLD_ID_REQUIRED' }` do těl. Součást doporučení EC-07 F3.

**L2**. ♻️

---

### EC-RUN-03 `WS` — EC-06 stav nezměněn (2 WS tvary, open) — ♻️

**Kde:** `backend/src/gateways/app.gateway.ts:28,41,54` (`return {error:'string'}`) a `backend/src/modules/maps/maps.gateway.ts:66,77,90,110,123,158,226,305` (`client.emit('error',{code,message})`)

**Detail:** Stav WS chybového tvaru identický s původním EC-06 nálezem. Scan potvrdil: `emit('error') ×8 · return{error} ×3` v 2 souborech. F5 (globální `socket.on('error')` listener v FE) byl aplikován ✅. Ale 2 tvary na BE straně (ack `return {error:string}` vs `emit('{code,message}')`) zůstávají.

**Klasifikace:** Přetrvávající 🟠 EC-06 — žádná změna. ♻️

---

## PROOF-REQUEST

| # | Osa | Co ověřit | Proč nestačí statika |
|---|---|---|---|
| **PR-01** | `UE`/`LK` | M-SHAPE e2e + M-FAULT: catch-all filtr drží tvar #3 po nových modulech (world-export, TOTP, trusted-devices) | Prior run (2026-06-14) — nové moduly přidány, filtr nezměněn → pravděpodobně OK, ale neopakoval jsem |
| **PR-02** | `VA` | Ověřit, že `validationExceptionFactory` generuje `fields` pro nové DTO (trusted-devices, TOTP DTOs) | Staticky ověřeno — factory čte `err.constraints` genericky, nevyžaduje per-DTO změny |
| **PR-03** | `CO` | Spustit `--emit` a commitnout oba generované soubory → ověřit FE build (tsc -b) | Generované soubory stale (EC-RUN-01) |

---

## Shrnutí stavu prior nálezů EC-01..EC-12

| ID | Status | Verifikace HEAD |
|---|---|---|
| EC-01 `UE` ne-HTTP mine filtr | ✅ OPRAVENO (F1 catch-all `@Catch()`) | ověřeno čtením — filtr ✅ |
| EC-02 `VA` EN validace string[] | ✅ OPRAVENO (F2 `validationExceptionFactory`) | ověřeno čtením — factory ✅ |
| EC-03 `CO` FINANCE/INVENTORY_NOT_APPLICABLE | ✅ OPRAVENO (F3 BE kódy + FE větev) | grep potvrzen |
| EC-04 `CO` ALREADY_FRIENDS mrtvá větev | ✅ OPRAVENO (F3 BE rozlišení) | grep potvrzen |
| EC-05 `EX` 161× mrtvé statusCode | ✅ OPRAVENO (F6 codemod) | scan: 0 statusCode v těle ✅ |
| EC-06 `WS` 2 WS tvary | 🟠 PŘETRVÁVÁ (F5 FE listener ✅, BE 2 tvary zůstávají) | scan potvrdil |
| EC-07 `CO` 29 throwů bez kódu (bylo 31) | 🟡 PŘETRVÁVÁ (de-eskalace) | scan: 29/860 = 3 % |
| EC-08 `FE` dup ApiError typy | ✅ OPRAVENO (F6 import z central) | grep: 1 místo ✅ |
| EC-09 `RT` refresh-fail tichý | ✅ OPRAVENO (F6 toast.info) | čtením client.ts:81 ✅ |
| EC-10 `EX` MulterExceptionFilter | ✅ OPRAVENO (F1 sloučen do hlavního filtru) | filters/ dir prázdný ✅ |
| EC-11 `UE` E11000→500 | ✅ OPRAVENO (F1 catch-all isDuplicateKey→409) | čtením filtr:103 ✅ |
| EC-12 `FE` parser bez String() guard | ✅ OPRAVENO (F6 String() guard) | čtením client.ts:98-99 ✅ |

---

## Závěr

Architektura chybové cesty je v dobrém stavu. Všechny kritické F1-F6 opravy z původního auditu jsou v HEAD kódu ověřeny. CI guard exits 0. Nové nálezy jsou 🟡 maintenance (stale generated types, 3 bestiae string-only throws). Jediný přetrvávající 🟠 je EC-06 (2 WS tvary — BE nezměněno).
