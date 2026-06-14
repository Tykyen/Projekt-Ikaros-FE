# 02 — Domain code contract (`CO`)

> **Otázka:** jsou doménové `code` (`EMAIL_TAKEN`, `WORLD_NOT_FOUND`, …) **konzistentní** a **FE↔BE se
> shodují**? Existuje kód, který BE produkuje a FE nezná (→ generic fallback), nebo který FE čeká a BE
> neposílá (→ mrtvá větev)?

## Povrch
- BE: `code:` literály v 818 throwech + guardy.
- FE: `parseApiErrorCode` ([client.ts:102]) konzumenti — `switch`/`if (code===)`/objektové mapy/union typy:
  - `RegisterModal.tsx` (`EMAIL_TAKEN`/`USERNAME_TAKEN`, `mapErrorToBanner`), `RegisterErrorCode` union ([types/index.ts:970]).
  - `ChangeEmailModal.tsx`, `MailPage.tsx` (`RECIPIENT_FRIENDS_ONLY`), Friendships (`REJECTED_RECENTLY`/`ALREADY_FRIENDS`/`REQUEST_EXISTS`), `ResetPasswordPage`.
- **Žádný sdílený enum/typ** kódů → kořen.

## Kontrolní body
- [ ] **Inventář BE kódů** — M-CONTRACT vytáhne všechny `code:` literály z BE.
- [ ] **Inventář FE kódů** — všechny stringy porovnávané proti `parseApiErrorCode`.
- [ ] **Drift A: BE→FE** — kódy, co BE posílá pro field-mapping, ale FE je nezná → uživatel dostane generic toast místo field chyby.
- [ ] **Drift B: FE→BE** — kódy ve FE switchích, co BE (po přejmenování) už neposílá → mrtvá větev, tichý fallback.
- [ ] **`HttpStatus[status]` kolize** — FE switch na `'NOT_FOUND'`? To je generický fallback, ne doménový → křehké.
- [ ] **Guard kódy** — `RolesGuard` vrací `false` (žádný kód) → FE dostane 403 bez `code`; je to OK pro UX? `CO`/`AL`.
- [ ] **Konzistence názvů** — `SCREAMING_SNAKE` všude? Duplicitní významy (`NOT_FOUND` vs `WORLD_NOT_FOUND`)?

## Metoda
M-CONTRACT (parity scan, CI guard) → L3/L5. Doporučený fix: **sdílený `ErrorCode` enum/union** importovaný BE i FE (L10).

## Seed
`K-EC3` (volný string, drift 🟠), `K-EC12` (string-only → generic code).
