# error-contract / 02-code-contract — checkpoint RUN-2026-06-20-1621

## Pokrytí

Osa `CO` (doménový code contract, FE↔BE parita). Prošel jsem:
- M-CONTRACT výstup z `errors.txt` (scanner snapshot RUN-2026-06-20-1621)
- aktuální `node scripts/error-contract-scan.mjs --contract --list --ci` (živý běh)
- `src/shared/types/errorCodes.generated.ts` (stav generovaného souboru, HEAD = 283 kódů)
- všechny FE soubory, kde se porovnávají error kódy: 10 souborů přes `parseApiErrorCode`, dalších 7 s přímým flat přístupem `data?.code`
- BE throws pro modules/auth (TOTP), modules/friendships, modules/character-subdocs, modules/world-currencies, modules/emotes, modules/shop

## Dosažená L vs cílová L

| Vrstva | Cíl | Dosaženo |
|---|---|---|
| Statické čtení FE+BE | L3 | ✅ L3 |
| M-CONTRACT CI guard | L5 | ✅ L5 — ale s blind spotem (níže) |
| E2e probe | L4 | ⏭️ PROOF-REQUEST (live infra) |

## Nálezy

### EC-RUN-01 `CO`/`FE` 🟠 — 7 souborů čte error code z FLAT tvaru (`data?.code`) místo wrapped (`data?.error?.code`) → všechny field-mapping větve mrtvé — L3 · 🆕

**Kde:**
- `src/features/auth/components/TotpVerifyStep.tsx:32-40` — `data?.code === 'TOTP_INVALID_CODE'` / `EXPIRED_TOKEN` / `INVALID_TOKEN` / `ALREADY_USED`
- `src/features/world/chat/emotes/components/CopyEmoteDialog.tsx:51-55` — `e?.response?.data?.code` pro `EMOTE_SHORTCODE_TAKEN`, `EMOTE_LIMIT_REACHED`
- `src/features/world/chat/emotes/components/EmoteUploadDialog.tsx:228-233` — stejný vzor
- `src/features/world/pages/CharacterDetailPage/components/accounts/AdjustBalanceModal.tsx:90-98` — `PLAYER_ADJUST_DISABLED`, `FORBIDDEN_ADJUST` + `data?.message` (taktéž mrtvé)
- `src/features/world/pages/CharacterDetailPage/components/accounts/ChangeCurrencyDialog.tsx:61-66` — `CURRENCY_RATE_MISSING`
- `src/features/world/shop/components/PurchaseDialog.tsx:118-127` — `INSUFFICIENT_FUNDS` + `data?.message`
- `src/features/world/shop/components/ShopGroupsManager.tsx:98-102` — `CAMPAIGN_SHOPGROUP_NOT_EMPTY`

**Mechanismus:** BE filtr (`http-exception.filter.ts:40`) obaluje vše do `{ error: { code, message, timestamp } }`. FE soubory typují payload jako `{ code?: string }` a čtou `data?.code` — což je vždy `undefined` (skutečný kód je na `data.error.code`). Celá větev nikdy nezafunguje → vždy generic fallback toast.

**Dopad:** 7 souborů, ~13 kódů, všechny field-specific hlášky mrtvé v produkci. Postižené flows: TOTP přihlášení (uživatel vždy vidí „Ověření se nezdařilo." místo „Neplatný kód."), nákup v obchodě, úprava zůstatku, změna měny, kopírování emote, mazání skupiny obchodu.

**Návrh:** Nahradit `parseApiErrorCode(err)` (centrální funkce) místo ručního flat přístupu; nebo opravit typ na `{ error?: { code?: string; message?: string } }` a číst `data?.error?.code`. Vzor: `ChangeEmailModal.tsx` a `ResetPasswordPage.tsx` (oprava EC-08/F6 z 2026-06-14 — ale netýkala se těchto 7 souborů).

**Blind spot M-CONTRACT:** Scanner hledá soubory s `/parseApiErrorCode|\.error\?\.code|RegisterErrorCode|error\.code/` — flat čtení `data?.code` tuto regex nesplní → tyto soubory nejsou v inventáři skeneru vůbec. CI guard (`npm run audit:errors --ci`) nevykáže drift, přitom field-mapping je fakticky mrtvý.

---

### EC-RUN-02 `CO` 🟡 — `errorCodes.generated.ts` zastaralý: 283 kódů vs. aktuálních 297 (+14 nových BE kódů) — L2 · 🆕

**Kde:** `src/shared/types/errorCodes.generated.ts` (HEAD), `backend/src/common/errors/error-codes.generated.ts`

**Mechanismus:** Generovaný soubor byl vytvořen z BE throwů ke dni auditu (2026-06-14). Od té doby přibylo do BE 14 nových kódů, které soubor neobsahuje:
`BESTIE_NOT_OWNER`, `CAMPAIGN_FORBIDDEN`, `CHANNEL_NOT_FOUND`, `CURRENCY_RATE_MISSING`, `EXPORT_FORBIDDEN`, `EXPORT_PJ_ONLY`, `INSUFFICIENT_WORLD_ROLE`, `SYSTEM_BESTIE_READ_ONLY`, `TOTP_ALREADY_ENABLED`, `TOTP_INVALID_CODE`, `TOTP_NOT_CONFIGURED`, `TOTP_NOT_ENABLED`, `TOTP_NO_PENDING_SETUP`, `WORLD_ACCESS_DENIED`.

Dvě z nových kódů (`CURRENCY_RATE_MISSING`, `TOTP_INVALID_CODE`) mají FE handler — ale ten je mrtvý kvůli nálezu EC-RUN-01 (flat read). Zbylé kódy nemají FE handler (stačí generický toast, ⚖️).

**Dopad:** `ErrorCode` typ (`as const`) lže — nové kódy nejsou v union typovém sdíleném kontraktu. TypeScript kontrola driftu funguje jen pro 283/297 kódů. Nízký runtime dopad (FE stejně jen text).

**Návrh:** `npm run audit:errors --emit` (bez vedlejších efektů při auditu) → regenerovat oba generované soubory, commitnout. Přidat `--emit` do CI/CD pipeline (vedle `--ci`).

---

### ✅ EC-03 (M-CONTRACT drift 0) potvrzeno — FE→BE drift: žádný — L5 · ♻️

Scanner verifikován živě: `🔴 FE→BE drift: (žádný)`. Všechny kódy, na které FE reaguje přes `parseApiErrorCode`, má BE skutečně v throwech. Opravy F3/F4 (2026-06-14) stojí: `ALREADY_FRIENDS` (friendships.service.ts:88), `FINANCE_NOT_APPLICABLE` (character-subdocs.service.ts:414), `INVENTORY_NOT_APPLICABLE` (character-subdocs.service.ts:493) jsou v BE; `SubdocErrorState.tsx` a `useFriendshipMutations.ts` je konzumují správně přes `parseApiErrorCode`.

---

### ✅ EC-07 (29/860 bez doménového kódu) potvrzeno — zlepšení oproti auditu (31/818) — L2 · ♻️

Scanner HEAD: 29/860 throwů bez doménového kódu (3 %), oproti 31/818 v auditu. Codebase přibylo o 42 throwů, poměr generických neklesl ani nevzrostl. `statusCode` mrtvé pole = 0 (oprava F6/codemod potvrzena). 28 string-only throwů analýzou vidím jsou interní/edge (upload chyby s CS textem, duplicitní zvuky s dynamickým textem, ikaros-gallery/discussions/articles admin-only flows) — žádný s dosažitelným field-mapping potřebou.

---

### ♻️ K-EC3 seed (volný string, drift) — uzavřeno jako ✅ + 🆕 EC-RUN-01/02 — L3

Původní hypotéza K-EC3 (drift kvůli volnému stringu) je částečně pokryta F4 (sdílený typ). Nový konkrétní způsob driftu je flat read (EC-RUN-01) + stale generated file (EC-RUN-02), oba mimo záběr původního K-EC3.

---

## PROOF-REQUEST

### PR-01 — E2e ověření, že flat reads vrací `undefined` (ne skutečný kód)

**Co:** Poslat `UnauthorizedException({ code: 'TOTP_INVALID_CODE' })` přes reálný HTTP request → ověřit, že `err.response.data.code` je `undefined` a `err.response.data.error.code` je `'TOTP_INVALID_CODE'`.

**Proč:** Staticky je mechanismus jasný (filtr obalí do `{ error: {} }`), ale e2e probe by to empiricky potvrdil (M-SHAPE vzor z auditu 2026-06-14, test 12/12).

**Blokováno:** Vyžaduje živý BE. Statická analýza L3 je dostatečná pro závěr — flat read `data?.code` je definitvně nesprávná vzhledem k `http-exception.filter.ts:40` (`response.status(status).json({ error })`).

---

## Shrnutí

| Nález | Závažnost | Typ | L |
|---|---|---|---|
| EC-RUN-01: 7 souborů flat read — 13 kódů mrtvých + M-CONTRACT blind spot | 🟠 | 🆕 | L3 |
| EC-RUN-02: generated file stale (+14 BE kódů) | 🟡 | 🆕 | L2 |
| Drift 0 (M-CONTRACT CI) potvrzeno | ✅ | ♻️ | L5 |
| 29/860 bez kódu (3 %) — zlepšení | ✅ | ♻️ | L2 |
