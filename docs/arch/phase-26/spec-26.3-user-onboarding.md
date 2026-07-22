# Spec 26.3 — BE modul `user-onboarding` (persistence Vypravěče, D6)

Stav: schváleno k implementaci (vlastník „dotáhneme vše", 2026-07-21) · Zdroj: [docs/vypravec/04-architektura.md](../../vypravec/04-architektura.md) §5 · Navazuje: spec-26.0 (route registr), spec-26.1 (VypravecRoot), spec-26.2 (kontextový engine)

## Cíl

Jediná BE kolekce + 2 endpointy, které drží stav Vypravěče per uživatel (persona, cesty, seenRoutes, dismissed, milníky, režim) s **merge sémantikou bezpečnou pro více zařízení** (lekce race 23.5). FE strana (store, localStorage, sendBeacon flush, anon delta merge) = samostatná dávka po BE (fb_no_mixed_batch).

## Datový model (Mongo, kolekce `user_onboarding`)

```ts
UserOnboardingState {
  userId: string (unique index),
  persona: 'pj' | 'hrac' | 'worldbuilder' | null,
  journeys: { [journeyId]: { startedAt: Date, contextWorldId?: string,
              steps: { [stepId]: Date }, pausedAt?: Date, dismissedAt?: Date } },
  seenRoutes: string[], dismissed: string[],
  milestones: { [id]: Date },
  mode: 'active' | 'onCall',
  lastSeenChangelog?: string,
  backfilled?: boolean,
  createdAt/updatedAt (timestamps)
}
```

**Escapování klíčů:** step/journey/milestone ID smí obsahovat tečky (`pj.create-world`), Mongo dot-path ne → service na zápisu `.` → `:`, na čtení zpět; DTO zakazuje `:` v ID. Klíče validovány regexem `^[a-z0-9_.-]+$/i` (blokuje `$` — Mongo operator injection).

## API

| Endpoint | Guard | Chování |
|---|---|---|
| `GET /users/me/onboarding` | JwtAuthGuard | `{ state: Entity \| null, legacy: boolean }`. `legacy=true` když state neexistuje a `user.createdAt <` datum nasazení Vypravěče (`VYPRAVEC_RELEASE_DATE` env, fallback konstanta). **Seed backfillu dělá FE** (má route registr; BE jen flag) — odchylka od 04 §5.4 krok 1, důvod: BE nezná FE routy. |
| `PATCH /users/me/onboarding` | JwtAuthGuard | Delta merge, upsert. Vrací výslednou entitu. |

**PATCH delta kontrakt** (vše volitelné): `persona · mode · lastSeenChangelog · backfilled` ($set, LWW) · `seenRoutesAdd[] · dismissedAdd[]` ($addToSet — set-union, jen rostou) · `milestones{id:ISO}` ($min per id) · `journeys{id:{ startedAt($min) · contextWorldId(first-write-wins — druhý update s pipeline $ifNull) · steps{stepId:ISO}($min) · pausedAt/dismissedAt($set, i null)}}`.

Merge výhradně Mongo operátory (žádný read-modify-write) → souběh zařízení bezpečný, re-POST idempotentní. Limity DTO: ArrayMaxSize 200, string ≤ 200 znaků, ≤ 20 journeys/50 steps/50 milestones per patch.

## Cleanup

`@OnEvent('user.deletion.requested')` → `deleteOne({userId})` (vzor project_self_deletion_architecture; telemetrie přibude v D11 a zapojí se sem).

## Testy (jest + mongodb-memory-server, `test/helpers/db.ts`)

1. Merge A→B→A přes 2 „zařízení": dismissed set-union (zavřené se nevrací), steps min(doneAt), contextWorldId first-write-wins (povinný test 04 §10).
2. Idempotence re-POST téže delty.
3. GET legacy flag: starý účet bez state → true; nový → false; existující state → false.
4. Escapování ID s tečkami (zápis/čtení round-trip).
5. user.deletion.requested → state pryč.

## Mimo rozsah D6

Telemetrie endpoint (D11) · FE onboardingStore (další dávka) · funnel skript (D11).
