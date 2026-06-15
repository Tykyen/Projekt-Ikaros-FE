# 06 — Ekonomika / race + teeth (vzor G4, rozšířit napříč)

> RC nálezy jsou **jediná doména s plnou G4 obranou** (race-barrier v CI + Stryker). Tahle oblast je
> ověří jako referenční vzor a rozhodne, kam jeho „zuby" rozšířit. Osa: `TEETH`.

## Stav RC (referenční)
- `test/race/race-barrier.ts` (Barrier/Gate) + `test/race/*.e2e-spec.ts` → běží v `npm test` → **v CI** ✅.
- `stryker.conf.json` → mutace, ale **scope jen 6 race-fix souborů** → teeth jen pro RC.
- RC-E1/E2/E3 (peníze) opraveny + race test zelený + Stryker = **G4**. Vzor, jak má vypadat dno pyramidy.
- RC-D3 (orphan-zpráva) **DEFER** → G0 s dluhem.
- TLA+ (zachování peněz) = L7 model-level, mimo běžné CI.

## Checklist
1. Potvrď, že race testy reálně běží v CI (`backend-test` job je spustí) → RC = G3 minimum bez extra práce.
2. **Stryker scope** — dnes 6 souborů. Rozhodnout (Fáze B), které další fixy důležitých nálezů přidat do
   `mutate` glob → povýší je na G4. Kandidáti: error-contract (`http-exception.filter`), auth/role
   (account-state gate, role strop), cache-key factory.
3. **M-MUT ruční** pro nálezy mimo Stryker scope — reverze hunku + cílený test (viz [00 §5]). Použít na:
   R-07 (mock podezření), F-01/F-27 (kontraktové testy), EC-01 (error code), LH-01 (log redakce helper).
4. RC-D3 → dluh „nejdřív fix".

## Seed kandidáti
- **K-AR12** 🟡 `TEETH` — Stryker scope jen RC; ostatní opravené nálezy bez potvrzených zubů.

## Výstup
- Seznam nálezů s potvrzenými zuby (G4) vs bez (G3 + ⚠️ TEETH-FAIL/netestováno).
- Návrh rozšíření Stryker scope (Fáze B, BE) ke schválení.
- Případně FE Stryker config (až po FE CI, oblast 01).

## Stav (B2)
- Zuby ověřeny **ručně reverzí** (M-MUT manuál) u C-09 (RSVP detail invalidace) a C-15 (character
  directory invalidace) — odebrání fixu → cílený test zčervená. To je G4-úroveň důkaz, ale M-TRACE značí
  G3, protože FE nemá Stryker config (strojový teeth guard). FE Stryker = otevřená B3 práce.
