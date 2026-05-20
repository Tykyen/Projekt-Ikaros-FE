---
name: skin
aliases: [vzhled, theme variant]
category: tema-a-skin
related: [[tema]], [[ornament]]
status: draft
---

# Skin

**TL;DR:** Konkrétní vzhledová varianta platformy — barvy, ornamenty, asety, atmosféra (např. „ikaros", „africké", „kyberpunk").

## Detail

Skin = konkrétní instance [[tema]]. Vybírá se v Administraci a aplikuje přes `data-theme="<id>"` na rootu.

Speciální skin **„ikaros"** je brand identita platformy (fialové synthwave + JS Matrix rain).

Každý skin má **vlastní originální [[ornament]]y** — ornamenty se mezi skiny nesdílí ani nerecyklují.

## Kde se objevuje

- v kódu (FE):
  - [src/themes/types.ts](../../src/themes/types.ts) — `ThemeId` (35 témat: 21 platforma + 14 svět)
  - [src/themes/_skinBase.ts](../../src/themes/_skinBase.ts) — CSS token base sada
  - [src/themes/applyTheme.ts](../../src/themes/applyTheme.ts) — aplikace CSS proměnných
  - [src/features/world/chat/chatSkin.css](../../src/features/world/chat/chatSkin.css)
- v kódu (BE):
  - žádný přímý protějšek — BE drží jen `themeId` na [[svet|světě]] (viz [[tema]]). Per-uživatel je vzhled v `themeSettings` (volný objekt) nebo [[theme-adjust]] na [[world-membership]].
- v dokumentaci:
  - [docs/themes/](../themes/) — popis konkrétních skinů
  - [docs/arch/phase-1/spec-1.0b-theme-visuals.md](../arch/phase-1/spec-1.0b-theme-visuals.md)
  - [docs/superpowers/specs/2026-05-07-theme-system-design.md](../superpowers/specs/2026-05-07-theme-system-design.md)
- v UI:
  - Profil → Vzhled (skin selector, preview miniatury)
  - World Settings → Theme tab

💡 **Theme system je FE-only.** BE drží jen `themeId` (preset name) na světě a [[theme-overrides]] / [[theme-adjust]] na členství. Definice skinů, CSS i isolation jsou na FE.

## Nepleť s

- **[[tema]]** — vzhled jako **systém** (mechanika `data-theme`, CSS proměnné, isolation). Skin je jeho **konkrétní instance**.
- **[[ornament]]** — dekorativní vrstva uvnitř skinu, ne skin sám.
