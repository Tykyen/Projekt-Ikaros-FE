# Spec 20C — 20.2 zbytek (GDPR app-side: věk, nezletilí, data-export FE)

> Fáze C ze série 20.1–20.3. Zásady OÚ (`/soukromi`) + registrační souhlas
> (D-010) jsou hotové (Fáze A + dřív). Tady app-side zbytek: deklarativní věk,
> bezpečný default nezletilého, FE konzument data-exportu.

## Rozhodnutí (locked, od uživatele)
| # | Rozhodnutí |
|---|---|
| R1 | Platforma cílí **i na <15** — NEblokovat registraci mladších. Skutečný **rodičovský souhlas řeší právník**; app-side jen podklad. |
| R2 | Věkový gate **deklarativní** („stačí tlačítko") — žádné ověřování e-mailem apod. |
| R3 | **Minimalizace:** nesbírat přesné datum narození. Jen volba **„je mi 15 a víc" / „je mi méně než 15"** → uloží se `minorStatus` flag, ne věk. (Rámec: přesný věk nezveřejňovat / nesbírat zbytečně.) |
| R4 | data-export = jen **FE konzument** existujícího `GET /data-export/me` (BE account-centric rozsah stačí, čl. 15). |
| R5 | Správce = spolek (identita = dluh D-063). |

## Sub-kroky (každý kompletní)

### C1 — data-export FE tlačítko
- **FE:** v `src/features/profile/components/AccountSection.tsx` (u smazání účtu) přidat „Stáhnout moje data (JSON)".
- Hook `useDataExport()` → `GET /data-export/me`, stáhnout jako soubor `ikaros-data-<datum>.json` (Blob download).
- Před smazáním účtu nabídnout export (rámec: „mazání = nejdřív nabídnout export") — v `DeleteAccountModal` odkaz na export.
- BE už existuje (`backend/src/modules/data-export/`) — NEMĚNIT rozsah.

### C2 — deklarativní věk při registraci
- **FE (`RegisterModal.tsx`):** povinná volba (radio/2 tlačítka): „Je mi 15 nebo více" / „Je mi méně než 15 let". Validace v `registerSchema.ts` (required).
- **BE:** `RegisterDto` + pole `isMinor: boolean` (odvozené z volby; NEukládat věk). `user.schema.ts` → `isMinor?: boolean`, `minorSelfDeclaredAt?: Date`. `auth.service.register` uloží.
- Text u volby: krátké vysvětlení, že u mladších platí přísnější režim a je potřeba souhlas zákonného zástupce (odkaz na `/soukromi` §8).

### C3 — bezpečný default nezletilého (app-side)
- Při registraci s `isMinor=true` nastavit bezpečné defaulty na `user`:
  - `profileVisibility='friends'` (ne veřejný profil),
  - `hiddenInDirectory=true` (skrytý v adresáři uživatelů),
  - (volitelně) omezené příchozí zprávy — pokud existuje pref; jinak jen profil/adresář.
- `parentalConsentStatus: 'pending' | 'granted' | 'not_required'` na `user` — u `isMinor` default `'pending'`. **Samotný tok udělení souhlasu = lawyer-pending stub** (jen flag + místo v UI profilu „čeká na souhlas zákonného zástupce"), NEblokuje užívání v betě.
- FE: badge/hláška v profilu nezletilého o omezeném režimu (informativní).

## BE dopady
- `RegisterDto` (+`isMinor`), `user.schema`, `auth.service` (uložit + aplikovat defaulty). Restart BE nutný (nové pole jinak dropne).
- Žádný nový modul; jen rozšíření users/auth.

## FE dopady
- `RegisterModal.tsx` + `registerSchema.ts` (věk), `AccountSection.tsx` + nový `useDataExport` hook, profil badge nezletilého.

## Otevřené (default, dokud neřekneš / neřekne právník)
1. **Rozsah minor-defaults** — default: neveřejný profil + skrytý v adresáři. Omezení zpráv/chatu jen pokud nízkonáklad; jinak později s právníkem.
2. **Rodičovský souhlas** — v betě jen flag `pending`, neblokuje. Reálný tok (e-mail rodiči / kód) = po právníkovi.

## Ověření
- FE tsc + ruční: registrace 15+ vs <15, export stáhne JSON.
- BE typecheck + restart.
- `funkce` + `napoveda` (jak stáhnout data, co znamená režim nezletilého) — závěrečný průchod.
- `mobil-desktop` na registraci + profil.
