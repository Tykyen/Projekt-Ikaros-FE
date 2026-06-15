# 05 — Realtime / cache / state (kořen třídy + otevřené dluhy)

> Nálezy z WS, cache invalidace a state-consistency. Dvě věci: (a) **otevřené** nálezy (W-7, W-10) = G0
> bez fixu, (b) **cache nemá scanner vůbec** = největší G0 plocha. Osy: `EX` `CLASS` `LIVE`.

## Cílové nálezy
| ID | Audit | Co | Pojistka dle registru | Podezření |
|---|---|---|---|---|
| W-7 | ws | world chat po reconnectu mrtvá | **OTEVŘENO** | 🔴 G0 — nejdřív fix |
| W-10 | ws | global-chat user:{id} leak | **OTEVŘENO** | 🔴 G0 (i bezpečnost, viz oblast 03) |
| W-1..11 | ws | ostatní WS nálezy | `audit:ws` string-match + gateway spec | G1 + DUR-risk |
| C-09 | cache | RSVP cache mismatch | opraveno, **bez scanneru** | 🟠 G0 |
| C-15 | cache | page/character cache disjunkce | opraveno, **bez scanneru** | 🟠 G0 |
| C-04/31/34/47 | cache | real-time invalidace | + 4 testy | ověřit AIM/živost |
| S-01..06 | state-consistency | WS event → FE stav; reconnect; role cache | TLA+ (L8) + socket-reconnect spec | FE spec G1 |
| S-03 | state-consistency | account transfer reconnect | opraveno + test | FE → G1 |

## Kořeny tříd (CLASS — chránit kořen, ne instanci)
- **Cache-key mismatch** — C-09/C-15 + K-C1..10. Paměť: centrální key-factory „dotaženo ~50%".
  Ověř, jestli existuje **scanner/test na key konzistenci**; pokud ne → `AR-xx` (celá třída C bez pojistky).
- **WS room lifecycle / reconnect** — W-7, S-03/04/05 sdílí `useSocketReconnect` vzor
  ([project_map_world_room_join], [project_state_consistency_audit]). Ověř, že existuje **test/lint na
  „ruční room:join bez useSocketReconnect"** → jinak se třída vrací jinde.

## Checklist
1. W-7, W-10 → G0, dluh „nejdřív fix" (zaznamenat, neopravovat v tomto auditu bez souhlasu).
2. **Cache (třída C, ~50 nálezů) nemá scanner** — největší mezera. Zvážit `audit:cache-keys` (Fáze B):
   lint na disjunktní namespace / WS-only-bez-reconnect (vzory z [project_cache_invalidation_audit]).
3. WS `audit:ws` je jen string-match (DUR) → ověřit zuby + zvážit povýšení na socket-contract test.
4. S-xx FE spec (socket-reconnect, lock-key) jsou G1 (FE bez CI) → po FE CI (oblast 01) přehodnotit.

## Seed kandidáti
- **K-AR3** 🔴 `EX` — cache (C) bez scanneru.
- **K-AR6** 🔴 `EX` — W-7/W-10 otevřené.
- **K-AR8** 🟠 `CLASS` — cache-key + WS reconnect kořeny.

## Výstup
- Cache třída: rozhodnutí scanner ano/ne (Fáze B). WS/state na G2/G3 po FE CI.
- Otevřené (W-7/W-10) → dluh se prioritou.
