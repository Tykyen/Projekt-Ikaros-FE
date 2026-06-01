# Spec D-066 — Per-token lock (zamčení jednotlivého tokenu)

**Status:** schváleno 2026-06-01, implementace probíhá.

## Cíl
PJ může zamknout **jednotlivý token** na taktické mapě (ne celou scénu). Zamčený
token hráč nemůže táhnout; PJ ano. Doplňuje `scene.isLocked` (celá scéna) a
`playerStates[].isLocked` (per-hráč scéna) — ty zůstávají beze změny.

## Designová rozhodnutí
- `MapToken.isLocked?: boolean` — **global per token** (platí všem hráčům), ne per-hráč.
- Vizuální **🔒 badge** na zamčeném tokenu (hráč jinak neví, proč nemůže táhnout).
- Toggle v `TokenInfoPanel` header actions, gate `deletable` (PomocnyPJ+).
- **PJ-only** — vynuceno BE authorizerem (`isLocked` mimo `allowedPlayerFields`
  whitelist → hráč dostane ForbiddenException). FE gate je jen UX hint.

## Dotyková místa
### BE
- `maps/interfaces/map-scene.interface.ts` — `MapToken += isLocked?: boolean`.
- `map-operations.service.ts` — beze změny (generic `token.update` patch loop).
- `operations-authorizer.service.ts` — beze změny (`isLocked` ∉ `allowedPlayerFields`
  → PJ-only by default). Přidat **test**: hráč `token.update {isLocked}` → 403.

### FE
- `tactical-map/types.ts` — `MapToken += isLocked?: boolean`.
- `hooks/useTokenPermissions.ts` — `+ if (token.isLocked && !isPj && !isGlobalAdmin) return false`.
- `TacticalMapView.tsx` — PJ-only toggle button v `TokenInfoPanel` header actions.
- TokenSprite (render) — 🔒 badge na zamčeném tokenu.

## Bezpečnost
- BE authorizer = security boundary (hráč nemůže nastavit/změnit `isLocked`).
- FE `canDrag` = client-side hint.
