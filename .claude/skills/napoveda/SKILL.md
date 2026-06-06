---
name: napoveda
description: Aktualizuj stránku Nápověda (`/ikaros/napoveda`) když se v projektu změní funkčnost — nová stránka, přechod ze 🚧 na ✅, změna role/oprávnění, nová profilová sekce, nový workflow, který hráč musí znát. Spusť po dokončení implementace každé fáze/feature, před commitem.
---

# Skill: napoveda

Drží stránku Nápověda v souladu s aktuálním stavem platformy. Bez ní obsah rychle zastará a uživatel dostává nepravdivé informace.

## Kdy spustit

- **Po implementaci nové stránky / route** (i když je zatím stub — patří do 🚧).
- **Když stránka přechází ze stubu na funkční** (přesun z 🚧 na ✅).
- **Při změně funkčnosti existující funkční stránky** (přidání sekce, nového flow, změny chování).
- **Při změně rolí / oprávnění** (nová role, změna co kdo smí, nová granular permission).
- **Při změně profilových sekcí** (nové pole, nová sekce, změna workflow).
- **Při zavedení nového konceptu**, který hráč musí znát (tombstone, queue typu, theme, ...).

Nespouštěj při:
- Refaktoringu bez funkční změny.
- Typo / drobné CSS / theme úpravě.
- Změně, která je interní (BE-only, dev-only, lint config, ...).

## Struktura HelpPage — kam co patří

> Redesign 13.5 (2026-06-06): nápověda má **6 tabů** a staví na **sadě
> znovupoužitelných bloků** (`components/`). Stará `PagesSection.tsx` (ploché
> `PageDoc` pole) **už neexistuje** — rozdělena na `PlatformSection` + `WorldSection`.

```
src/features/ikaros/pages/HelpPage/
├── HelpPage.tsx                       # 6 tabů + datum „Aktualizováno k YYYY-MM-DD" (lead)
├── helpers.ts                         # HELP_TABS (start/platforma/svet/role/ucet/faq) + TAB_LABELS
├── media.ts                           # registr obrázků/screenshotů: klíč → {src?,alt,caption}
├── components/                        # sada bloků (REUSE, nepiš nové ad-hoc):
│   │                                  #   HelpAccordion (+Sub), InfoCard (+InfoGrid), TagChip,
│   │                                  #   TermGrid, CalloutBox, StepList, PermissionTable,
│   │                                  #   ScreenshotSlot, IllustrationSlot; accenty v accents.ts
│   └── ...
└── sections/
    ├── StartSection.tsx               # onboarding: hero, první kroky, orientace, slovníček (TermGrid)
    ├── PlatformSection.tsx            # ⬅ nástroje platformy (Ikaros-level), <Tool> ve skupinách
    ├── WorldSection.tsx               # ⬅ nástroje světa, vč. taktické mapy (<MapFeature> pod-pod-sekce)
    ├── RolesSection.tsx               # ⬅ collapsible globální + světové role + PermissionTable
    ├── AccountSection.tsx             # ⬅ harmonika profilu (HelpAccordion bloky) + tombstone
    └── FaqSection.tsx                 # ⬅ FAQ pole s `cat`, seskupené do kategorií (HelpAccordion)
```

Stránky se v Platform/World sekcích reprezentují lokálním helperem `<Tool>`
(= `HelpSubAccordion` s audience `TagChip` v hlavičce). Audience štítek nahrazuje
staré `who`; bohatý popis jde do těla (odstavce + `CalloutBox`/`StepList`/`TermGrid`).
Status stránky (✅/🚧) piš slovy v textu — ploché `PageDoc.status` pole už není.

### Mapování změna → sekce

| Typ změny | Cíl |
|-----------|-----|
| Nová/změněná platformní stránka | `PlatformSection.tsx` → přidej/uprav `<Tool>` ve vhodné `HelpAccordion` skupině |
| Nová/změněná světová stránka | `WorldSection.tsx` → `<Tool>` ve skupině |
| Nová funkce taktické mapy | `WorldSection.tsx` → `<MapFeature>` uvnitř „Taktická mapa" |
| Stub → funkční | uprav text `<Tool>` na reálný popis (štítky stavu jen ✅/🚧) |
| Nová globální role | `RolesSection.tsx` → `GLOBAL_CARDS` + `GLOBAL_COLUMNS`/`GLOBAL_ROWS` |
| Nová světová role | `RolesSection.tsx` → `WORLD_CARDS` + `WORLD_COLUMNS`/`WORLD_ROWS` |
| Změna admin hierarchie | `RolesSection.tsx` → skupina „Globální role" → „Hierarchie a omezení adminů" |
| Nová sekce profilu | `AccountSection.tsx` → přidej `HelpAccordion` blok |
| Změna profilového flow (heslo, username, smazání) | `AccountSection.tsx` → relevantní blok (často `StepList`) |
| Nový queue typ / koncept / pojem | `FaqSection.tsx` → přidej do `FAQ` s `cat`; pojem i do `StartSection` slovníčku (`TermGrid`) |
| Nový screenshot k doplnění | `media.ts` (nový klíč) + `<ScreenshotSlot media="…">` v sekci + řádek v `docs/arch/phase-13/napoveda-screenshoty.md` |

## Postup

1. **Identifikuj změnu** z kontextu konverzace nebo z git diff. Pokud měla fázi v roadmapu (1.5, 2.3, ...), zjisti přesný stav z `docs/roadmap-fe.md`.

2. **Klasifikuj** dle tabulky výše. Pokud změn je víc, projdi je jednu po druhé.

3. **Otevři příslušnou sekci** v `src/features/ikaros/pages/HelpPage/sections/` a najdi relevantní místo:
   - **`PlatformSection` / `WorldSection`** — `<Tool>` (= `HelpSubAccordion` + audience `TagChip`) uvnitř `HelpAccordion` skupiny; taktická mapa má `<MapFeature>`.
   - **`RolesSection`** — data pole `GLOBAL_CARDS`/`WORLD_CARDS` + `*_COLUMNS`/`*_ROWS` pro `PermissionTable`; akční tabulka „Co kdo smí" je `<table>` v `tableWrap`.
   - **`AccountSection`** — `HelpAccordion` bloky (akce přes `StepList`).
   - **`FaqSection`** — pole `FAQ` (objekty `{ cat, q, a }`), `cat` ∈ ucet/komunita/svet/obecne.
   - **`StartSection`** — slovníček je `TermGrid`.

4. **Aplikuj edit** přesně dle stylu okolního obsahu:
   - Píš česky, jednoduchými větami.
   - **Reuse bloky z `components/`** — žádné nové ad-hoc komponenty.
   - Status stránky vyjádři slovy / `TagChip` — štítky stavu jen ✅/🚧.
   - Externí dokumentaci (specs, plans) neodkazuj — nápověda je pro hráče, ne pro AI agenta.

5. **Aktualizuj datum** v `HelpPage.tsx` v lead odstavci („Aktualizováno k YYYY-MM-DD") — vždy dnešní datum.

6. **Verifikace:**
   ```bash
   npm run test:run -- src/features/ikaros/pages/HelpPage
   npm run lint:colors
   ```
   (NE `npx vitest run` — flaky „failed to find current suite".) Pokud test krytí spadlo
   (např. změna struktury sekce), uprav `__tests__/HelpPage.spec.tsx`.

7. **Krátký report uživateli** — 1–2 věty: co jsi v nápovědě upravil a kde.

## Pravidla

- **Štítky pouze ✅ Funguje a 🚧 Připravujeme** — žádné jiné varianty (žádné „beta", „částečně", „experimental"...).
- **Nepiš nedokončené featury jako funkční.** Stub stránka = 🚧 dokud nemá reálnou funkčnost (i kdyby existoval route).
- **Anonymní pohled.** Stránka je dostupná i nepřihlášenému; nepiš věty „v tvém profilu...", piš „v profilu (po přihlášení)".
- **Žádné interní termíny** (D-NNN dluhy, „spec 1.4 §4.2", BE error kódy). Ty patří do `docs/`, ne do nápovědy.
- **Tabulky rolí** se mění opatrně — `RoleSection` mají 3 propojené tabulky (globální / akční matice / světové). Změna v jedné může vyžadovat sync v druhých.
- **Nepřidávej tab** (přes `helpers.ts`) bez explicitního souhlasu uživatele — to je strukturální redesign.
- **Nedokumentuj role, které nemají reálné chování** (Korektor / Čtenář / Žadatel / Ikarus). Zůstávají v poznámce „v přípravě".
- **Když HelpPage potřebuje větší restruct** (nová tab, sjednocení sekcí, ...), zastav se a navrhni to uživateli — nedělej silent redesign.

## Vazba na ostatní workflow

- Tento skill **navazuje** na `spec-driven-development` — spusť `napoveda` v Fázi 3 (aktualizace specifikace) společně se zaškrtnutím roadmapu.
- Souvisí s dluhem **D-048 (HelpPage content drift)** v `docs/dluhy.md` — tento skill je nástroj jak D-048 řešit kontinuálně.
- Pokud změna byla čistě grafická (skin / theme), **NE**spouštěj `napoveda` — to řeší [[mobil-desktop]] a `frontend-design`.
