---
name: theme-overrides
aliases: [themeOverrides, custom theme tokens]
category: tema-a-skin
related: [[tema]], [[skin]], [[theme-adjust]]
status: draft
---

# Theme overrides

**TL;DR:** Mapa CSS tokenů, kterými si [[svet]] nebo uživatel **přepisuje** dílčí hodnoty zvoleného [[skin]]u (např. změna primární barvy bez výměny celého presetu).

## Detail

Drží `Record<string, string>` — klíč = název CSS proměnné (`--color-primary`), hodnota = nová hodnota. Sloučí se nad base presetem při `applyTheme()`.

Dvě úrovně:
- **per-svět** (`World.themeOverrides`) — viditelné pro všechny členy světa.
- **per-uživatel × per-svět** (`WorldMembership.themeUserOverrides`) — jen pro daného uživatele v daném světě.

## Kde se objevuje

- v kódu (FE):
  - [src/themes/applyTheme.ts](../../src/themes/applyTheme.ts) — merge logika
  - [src/themes/ThemeProvider.tsx](../../src/themes/ThemeProvider.tsx)
- v kódu (BE):
  - backend/src/modules/worlds/interfaces/world.interface.ts — `themeOverrides`
  - backend/src/modules/worlds/interfaces/world-membership.interface.ts — `themeUserOverrides`
- v UI:
  - World Settings → Theme tab (Custom Editor)
  - Profil → Vzhled (per-svět overrides u členství)

## Nepleť s

- **[[theme-adjust]]** — strukturovaná a11y úprava (brightness/contrast/bgDim), ne libovolný token.
- **[[skin]]** — celý preset; overrides je jen dílčí přepsání.
