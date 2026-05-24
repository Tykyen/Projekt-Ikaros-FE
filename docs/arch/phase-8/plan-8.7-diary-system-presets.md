# Plán 8.7 — Diary System Presets

**Spec:** [spec-8.7-diary-system-presets.md](spec-8.7-diary-system-presets.md)
**Status:** ✅ kompletně implementováno (2026-05-24)

## Pořadí sub-kroků a commit hash

| # | Sub | Commit | Soubory | Testy |
|---|---|---|---|---|
| 1 | **8.7a** Infrastruktura | `0ed55a8` (společný s b+c) | DiarySystemProvider + Context + types + registry + generic preset + integrace v DiaryTab + legacy class names v DiaryBlockView + _shared/cdAccess.ts | — |
| 2 | **8.7b** JaD (pilot) | `0ed55a8` | presets/jad.ts, styles/jad.css (264ř SCSS), sheets/jad/{JadSheet, constants, formulas} | 11 |
| 3 | **8.7c** CoC | `0ed55a8` | presets/coc.ts, styles/coc.css (475ř), sheets/coc/{CocSheet, constants} — 44 dovedností, 6 status flagů | 10 |
| 4 | **8.7d** DnD 5e | `7462c87` | presets/dnd5e.ts, styles/dnd5e.css (979ř), sheets/dnd5e/{DndSheet, constants, formulas} — spell sloty, death pips | 18 |
| 5 | **8.7e** DrdH | `fbb8863` | presets/drdh.ts, styles/drdh.css (352ř), sheets/drdh/{DrdhSheet, constants} — 6 povolání s vlastními zdroji | 10 |
| 6 | **8.7f** DrdPlus | `5e800e1` | presets/drdplus.ts, styles/drdplus.css (328ř), sheets/drdplus/{DrdPlusSheet, constants} — 4 taby, 6 profession rendererů | 10 |
| 7 | **8.7g** GURPS | `d3d78e6` | presets/gurps.ts, styles/gurps.css (407ř), sheets/gurps/{GurpsSheet, constants} — encumbrance tabulka | 9 |
| 8 | **8.7h** Drd2 | `9663ea5` | presets/drd2.ts, styles/drd2.css (1005ř), sheets/drd2/{Drd2Sheet, drd2Abilities (380ř, 264 schopností)} | 8 |
| 9 | **8.7i** Fate | `d1907ea` | _shared/{SkillPips, ConflictTrack, FateLikeSheet} + presets/fate.ts + styles/fate.css + sheets/fate/FateSheet | 6 |
| 10 | **8.7j** PI | `9d0324c` | presets/pi.ts + styles/pi.css (z 295ř SCSS) + sheets/pi/PiSheet (wrapper s pi_ prefixem nad FateLikeSheet) | 5 |
| 11 | **8.7k** Shadowrun | `387b222` | presets/shadowrun.ts, styles/shadowrun.css (219ř), sheets/shadowrun/{ShadowrunSheet, constants} — Condition Track + Matrix panel | 7 |
| 12 | **8.7l** Drd16 base | `794b1b4` | presets/drd16.ts, styles/drd16.css (399ř), sheets/drd16/{Drd16Sheet, constants} — bez class-specific modulů | 11 |
| 13 | **8.7m** Dokumentace | (tento commit) | docs/arch/phase-8/spec + plan, roadmap-fe.md řádek 8.7, Help page sekce | — |

**Celkem:** 11 commits + 1 docs commit = 12 commits; ~14000+ řádků kódu (TS + CSS); 117 testů zelených.

## Dependency graph

- **8.7a** je blokující pro vše ostatní (registry, provider, types)
- **8.7i (Fate)** zavádí `_shared/SkillPips`, `_shared/ConflictTrack`, `_shared/FateLikeSheet` — používá je `8.7j (PI)`
- Ostatní sub-kroky (`8.7b–8.7h`, `8.7k`, `8.7l`) jsou nezávislé

## Klíčová architektonická rozhodnutí

Viz [spec § 2](spec-8.7-diary-system-presets.md#2-architektonická-rozhodnutí). Stručně:
- System ≠ Skin (oddělené data atributy)
- `world.system` je zdroj pravdy, fallback `generic` preset
- Lazy CSS load (dynamic import per preset)
- 1:1 prefix v customData (kompatibilita s Matrix/Matrix daty)
- Editor 8.5 skryt pro dedikované systémy (`!isDedicated` v DiaryTab)

## Co nepatří do 8.7

- **Map diary overlays** (CocMapDiaryOverlay, DndMapDiaryOverlay, …) → iterace **10.2l** (mapa)
- **Drd16 class-specific moduly** (Warrior/Ranger/Thief/Wizard/Alchemy/Theurg + 4 data files ~100KB) → budoucí iterace **8.7n+** (každý power-class samostatný sub-spec)
- **NPC widget komponenty** z Matrix/Matrix (NpcDiary, FateNpcStatBlock, …) → iterace s NPC v mapě
- **Fate Dice picker + 3D model** → patří k DiceOverlay (chat/map dice roller), mimo character sheet

## Manuální audit (po implementaci)

Pro každý preset ověřit:
1. Vytvořit testovací world s `system: '<id>'`
2. Otevřít deník postavy → vizuální kontrola (sheet se renderuje, scoped CSS funguje)
3. Vyplnit alespoň 3 pole → uložit → refresh → ověřit persistenci
4. Test v ≥1 jiném skinu (např. `modre-nebe`) — žádný visual leak ze sheet do shared UI
5. Test mobil + desktop (responsive @media queries fungují)

Reprezentativní matice: **CoC × `modre-nebe`** (parchment + světlý skin), **Shadowrun × `ikaros`** (cyberpunk + fialová), **Drd2 × `western`** (emerald + hnědá).
