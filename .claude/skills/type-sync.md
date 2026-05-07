---
name: type-sync
description: Ověř, že FE typy v src/types/ jsou synchronizované s BE DTO. Spusť při práci s typem, který odráží BE entitu, nebo při podezření na drift.
---

# Skill: type-sync

Porovná FE typ s odpovídajícím BE DTO a nahlásí nesrovnalosti.

## Postup

1. **Identifikuj FE typ** — z kontextu úkolu urči, který typ v `src/types/index.ts` je relevantní.
2. **Najdi BE DTO** — hledej v `../Projekt-ikaros/backend/src/**/*.dto.ts` nebo `**/*.schema.ts`. Pomocí `grep` nebo `Glob`.
3. **Porovnej pole po poli:**
   - Chybějící pole (v BE je, ve FE není)
   - Přebývající pole (ve FE je, v BE není)
   - Odlišné typy (`string` vs `number`, optional vs required)
   - Odlišné názvy (camelCase drift, překlepy)
4. **Nahlásit výsledek** — tabulka rozdílů, nebo "✓ synchronizováno".
5. **Pokud jsou rozdíly** — použij skill `dluh` pro každý nesouhlasící typ, nebo oprav hned pokud je to triviální (čekej na souhlas).

## Rozsah

Typy v `src/types/index.ts` které mají BE protějšek:
- `User` ↔ BE `users` modul
- `PublicUser` ↔ BE public user projekce
- `World` ↔ BE `worlds` modul
- `WorldMembership` ↔ BE `world-memberships`
- `LoginRequest`, `RegisterRequest`, `AuthResponse` ↔ BE `auth` DTO
- `PaginatedResponse<T>` ↔ BE common paginated wrapper

## Pravidla

- Neupravuj FE typ bez souhlasu — jen nahlásit.
- Pokud BE DTO neexistuje (nová feature), zapiš `TBD` do dluhů.
- `Record<string, unknown>` na FE je akceptovatelný zástupce za BE `object` — nehlásit jako diff.
