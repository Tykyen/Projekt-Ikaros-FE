# Spec 8.7 — Diary System Presets

**Status:** ✅ implementováno (2026-05-24, commits `0ed55a8` → 8.7n)
**Předchůdce:** 8.5 (Dynamické šablony deníku) — extensibility schema editor
**Návaznost:** 10.2l (Map diary overlays), 8.7o+ (Drd16 power-class moduly)

## 1. Cíl a rozsah

Migrace **12 deníkových systémů** z legacy projektu `c:/Matrix/Matrix` do Ikarosu jako **per-systémové presety**. Cílový stav = každý herní systém má vlastní:

- **Datový tvar** (atributy, dovednosti, zbraně, mechanika)
- **Vizuální obal** (CSS scoped na `[data-diary-system="<id>"]`)
- **Český překlad** termínů (Síla / Obratnost / Žitově …)

**Mimo rozsah:**
- Map overlay komponenty (`*MapDiaryOverlay.tsx`) → patří k iteraci 10.2l
- Drd16 class-specific moduly (~17k řádků v Matrix/Matrix) → budoucí iterace 8.7o+

## 2. Architektonická rozhodnutí

### 2.1 System ≠ Skin (oddělené taxonomie)

| Koncept | Scope | Atribut | Příklad |
|---|---|---|---|
| **Skin** (existující) | Celá aplikace | `<html data-theme="ikaros">` | modre-nebe, sci-fi, … (32 skinů) |
| **Diary system** (nový) | Pouze deník postavy | `<div data-diary-system="coc">` | coc, dnd5e, drd2, … (11 systémů) |

💡 **Proč dva atributy:** skin = vizuál celé platformy (volí uživatel); system = vizuál konkrétního deníku (vychází z `world.system`). Jeden uživatel může mít skin „modre-nebe" a brát do ruky deníky z CoC i Shadowrun světů — každý vypadá podle svého systému, zbytek UI zůstává v jeho oblíbeném skinu.

### 2.2 Zdroj pravdy = `world.system`

- `World.system: string` (existující pole na entitě světa)
- Pokud hodnota není v registry → fallback `generic` preset (DiaryBlockView z PJ-definovaného schématu 8.5)
- Žádný UI selector v deníku — změna systému = change na úrovni světa (admin/PJ)

### 2.3 Architektura modulů

```
src/features/world/pages/CharacterDetailPage/diary-systems/
├── types.ts                 — DiarySystemPreset, SystemId, SystemSheetProps
├── registry.ts              — Record<SystemId, DiarySystemPreset>
├── DiarySystemProvider.tsx  — lazy CSS load + data-attr wrapper
├── DiarySystemContext.ts    — Context + useDiarySystem hook
├── README.md                — návod pro přidání nového systému
├── _shared/                 — cdAccess + SkillPips + ConflictTrack + FateLikeSheet
├── presets/<id>.ts          — metadata per systém (12 souborů: generic + 11 systémů)
├── styles/<id>.css          — scoped CSS per systém
└── sheets/<id>/             — dedikované React sheets + constants + formulas + tests
```

### 2.4 CSS strategie

- Plain CSS soubor per systém (žádné CSS modules — class names z legacy SCSS přeneseny 1:1)
- Každé pravidlo prefixované `[data-diary-system="<id>"]` → izolovaný scope
- Dynamic import (`import('../styles/<id>.css')`) → bundle nezatížen dokud deník není otevřen
- `data-diary-system` wrapper přidává `DiarySystemProvider`

### 2.5 Editor 8.5 vs dedikovaný sheet

- Pro `generic` preset (neznámý `world.system`) → editor schématu 8.5 plně funkční (PJ definuje vlastní bloky)
- Pro dedikované systémy (CoC, DnD5e, …) → editor 8.5 skrytý + info badge „Šablonu deníku určuje herní systém. Vlastní editor schématu se pro tento systém nepoužívá."

## 3. Inventář systémů (12)

| ID | Název | Téma | Custom prvky |
|---|---|---|---|
| `matrix` | Matrix RPG (vlastní pro projekt Matrix/Ikaros) | Cyberpunk navy + #6b8cff + Rajdhani | Vitals (Životy/Runa/Vesta/Únava) s 2 penalty stripy, 4 přetlaky × 5 segmentů, jazyky/schopnosti/aspekty TagValue lists, 21 magických schopností auto-detection, Nabitý/Vybitý chip |
| `coc` | Call of Cthulhu 7e | Lovecraft parchment | Sanity tracker, 8 vlastností × 3 stupně, 44 dovedností |
| `dnd5e` | Dungeons & Dragons 5e | Arcane Parchment | Skill prof cycle 0/1/2, spell sloty pips, death save pips |
| `drd2` | Dračí doupě 2 | Dark Forest Emerald | 3 pilíře (Tělo/Duše/Vliv), 264 schopností katalog |
| `drd16` | Dračí doupě 1.6 | Klasická Jeskyně amber | 7+5 vlastností s DrdBonus formulí, HP/Mana ±tlačítka |
| `drdh` | Dračí Hlídka | Heroic Golden | 6 povolání s vlastním zdrojem + tabulkou |
| `drdplus` | Dračí doupě Plus | Mystical Arcane purple | 4 taby, 6 inline profession rendererů |
| `fate` | Fate Core | Neural Sleek modré | Skill pips (6), conflict track (5-stavů) |
| `gurps` | GURPS | Cold-Steel Blue | Encumbrance tabulka 5 úrovní, `gurps_player` field |
| `jad` | Jeskyně a draci | Světlý pergamen | 6 atributů + 18 dovedností |
| `pi` | Příběhy Impéria | Victorian Brass serif | Reuse Fate (sdílí _shared/) |
| `shadowrun` | Shadowrun | Cyberpunk Neon | Condition Track s -1/3 penalty, Matrix panel |

### 3.1 Aliasy systému

Některé legacy hodnoty `world.system` z Matrix/Matrix se mapují na canonical ID:

| Alias | Canonical |
|---|---|
| `dnd` | `dnd5e` |
| `pribehy_imperia`, `pribehy`, `pribehy-imperia` | `pi` |

ID jsou case-insensitive (lowercased před lookup). Neznámé ID → `generic` fallback.

## 4. CustomData prefix per systém (1:1 z legacy)

| Systém | Prefix | Příklady klíčů |
|---|---|---|
| matrix | `matrix_*` | `matrix_name`, `matrix_health`, `matrix_pressure_physical`, `matrix_languages` |
| coc | `coc_*` | `coc_str_reg`, `coc_hp_max`, `coc_sk_dodge_reg` |
| dnd5e | `dnd_*` | `dnd_ability_str`, `dnd_skill_prof_Akrobacie`, `dnd_spellLevel_1` |
| drd2 | `drd2_*` | `drd2_body`, `drd2_basic_professions`, `drd2_special_abilities` |
| drd16 | (žádný, plain klíče) | `str_val`, `hp_current`, `meleeWeapons` |
| drdh | `drdh_*` | `drdh_attr_str`, `drdh_w_triky`, `drdh_res_adr` |
| drdplus | `drdp_*` | `drdp_stat_Síla`, `drdp_boj_b`, `drdp_wiz_kapacita` |
| fate | `fate_*` | `fate_aspects`, `fate_conflict`, `fate_skills` |
| gurps | `gurps_*` | `gurps_st`, `gurps_hp`, `gurps_player`, `gurps_points_total` |
| jad | `jad_*` | `jad_abi_str`, `jad_ac`, `jad_skill_Akrobacie` |
| pi | `pi_*` | `pi_aspects`, `pi_conflict`, `pi_goals_long` |
| shadowrun | `sr_*` | `sr_attr_bod`, `sr_cond_phys`, `sr_mat_atk` |

Důvod: 1:1 přenos znamená, že kdo měl postavu v Matrix/Matrix, může její customData přenést (BE akceptuje `Record<string, unknown>`).

## 5. Akceptační kritéria (DoD)

Pro každý preset (`8.7b` – `8.7l`):

1. ✅ World s `system: '<id>'` aktivuje preset (data-attr + CSS load + sheet rendering)
2. ✅ Sheet renderuje, edituje a ukládá customData 1:1 vůči Matrix/Matrix
3. ✅ View mode disabluje všechny inputy + skrývá add/del tlačítka
4. ✅ Žádný regres na 8.5 schema editoru (generic preset funguje beze změny)
5. ✅ Bundle: CSS lazy load funguje (dynamic import)
6. ✅ Pro `world.system` neznámý → fallback `generic`, žádný crash

## 6. Pravidla per systém (formuly + validace)

- **DnD5e / JaD:** ability modifier = `floor((score - 10) / 2)`, skill mod = `abilityMod + (profLevel × profBonus)`, save mod, passive perception = `10 + skillMod`
- **Drd16:** DrdBonus formule (val ≤ 0 → -5, < 10 → floor((val-10)/2), 10-12 → 0, ≥ 13 → floor((val-11)/2))
- **CoC:** 8 vlastností × 3 stupně (Základní / Polovina / Pětina) — manuální input (1:1 z Matrix/Matrix)
- **Shadowrun:** Condition Track penalty = `-1 per 3 vyplněné boxy` (vizuálně značeno `c-penalty` markerem)

## 7. „Bez dluhů" princip

Per uživatelské pravidlo „žádné dluhy, jeden zátah nebo po kompletních kouscích":
- Žádné stuby (žádný TODO `přijde později` v sheetu)
- Každý sub-krok 8.7b–8.7l = kompletní preset s testy
- Co je v Matrix/Matrix přeneseno, je přeneseno; co je explicitně mimo scope (map overlays, Drd16 power moduly) je zaznamenáno jako **budoucí iterace**, ne dluh

## 8. Test coverage

117 testů celkem napříč 13 spec soubory:
- `jad/formulas.spec.ts` + `jad/JadSheet.spec.tsx` (11)
- `coc/CocSheet.spec.tsx` (10)
- `dnd5e/formulas.spec.ts` + `dnd5e/DndSheet.spec.tsx` (18)
- `drdh/DrdhSheet.spec.tsx` (10)
- `drdplus/DrdPlusSheet.spec.tsx` (10)
- `gurps/GurpsSheet.spec.tsx` (9)
- `drd2/Drd2Sheet.spec.tsx` (8)
- `fate/FateSheet.spec.tsx` (6)
- `pi/PiSheet.spec.tsx` (5)
- `shadowrun/ShadowrunSheet.spec.tsx` (7)
- `drd16/Drd16Sheet.spec.tsx` + `drd16` formulas (11)

Žádný regres na 52 existujících testů `CharacterDetailPage`.
