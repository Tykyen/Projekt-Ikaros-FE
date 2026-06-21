---
name: elevation
aliases: [elevation, nahození práv, nahození pravomocí, admin elevation, sudo, world elevation]
category: role-a-prava
related: [[governance], [superadmin], [globalni-role], [pan-jeskyne], [world-role]]
status: draft
---

# Elevation („nahození práv")

**TL;DR:** Mechanismus, kdy platform [[globalni-role|Admin/Superadmin]] má ve [[svet|světě]] pravomoci **uspané** (chová se jako hráč) a vědomě si je per-svět zapne tlačítkem v hlavičce světa, aby vyřešil problém — a pak je zase složí.

## Detail

Nahradilo [[governance|R-20]] „admin natvrdo bez moci" (2026-06-21). Default: admin je ve světě jako jeho [[world-role|world role]] (nebo nečlen). Po **nahození** (toggle „Aktivovat admina") získá plnou moc [[pan-jeskyne|PJ]] v tom světě; **složením** („Admin režim") ji vrátí.

- **Per-svět** — platí jen pro svět, kde se admin nahodil; jinde zůstává hráčem.
- **BE-enforced** — kolekce `world_elevations` + helper `worldAdminBypass(user, worldId)` nahradil ~45 přímých `role <= Admin` ve world-scoped branách. Bez nahození žádný bypass.
- **Auditované** — každé nahození i složení jde do admin audit logu.
- **Skládá se odhlášením** — bez časové expirace, ale logout elevaci zruší (příští přihlášení = zase uspané).
- **De-elevated vidí jako hráč** — metadata světa (název) vidí kvůli toggle, ale obsah uzavřeného světa zůstává skrytý.

## Kde se objevuje

- v dokumentaci: [09-svet-vstup-clenstvi.md](docs/funkce/09-svet-vstup-clenstvi.md)
- v kódu: `modules/world-elevations/`, `common/utils/world-elevation.ts`, FE `features/world/components/AdminElevationToggle.tsx`

## Nepleť s

- **[[governance]]** — starší pravidlo R-20 (admin bez moci natvrdo); elevation ho nahradilo modelem „uspané, nahoditelné".
- **[[granular-permissions]]** — jemné platformové permission flagy; elevation je naopak hrubý per-svět přepínač celé PJ moci.
