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

```
src/features/ikaros/pages/HelpPage/
├── HelpPage.tsx                       # datum „Aktualizováno k YYYY-MM-DD" (lead)
├── helpers.ts                         # HELP_TABS + TAB_LABELS (přidání tabu = velký redesign)
└── sections/
    ├── StartSection.tsx               # onboarding intro — mění se málo
    ├── PagesSection.tsx               # ⬅ NEJČASTĚJI editovaná
    ├── AccountSection.tsx             # ⬅ 7 podsekcí profilu + tombstone
    ├── RolesSection.tsx               # ⬅ globální + světové tabulky + akční matice
    └── FaqSection.tsx                 # ⬅ Q&A array
```

### Mapování změna → sekce

| Typ změny | Cíl |
|-----------|-----|
| Nová route / stránka (i stub) | `PagesSection.tsx` → `SOON_IKAROS` nebo `SOON_WORLD` |
| Stub stránka se naplnila | Přesuň položku z `SOON_*` → `IKAROS_PAGES`, změň `status: 'ok'`, doplň `what` reálným popisem |
| Změna funkčnosti funkční stránky | `IKAROS_PAGES[].what` / `.who` |
| Nová globální role | `RolesSection.tsx` → tabulka „Globální role" + případně akční matice |
| Změna admin permission / hierarchie | `RolesSection.tsx` → sekce „Hierarchie a omezení adminů" |
| Nová světová role | `RolesSection.tsx` → tabulka „Světové role" |
| Nová sekce profilu | `AccountSection.tsx` → přidej `<h2>` blok s číslem |
| Změna profilového flow (heslo, username, smazání) | `AccountSection.tsx` → relevantní podsekce |
| Nový queue typ (Zpracovat tab) | `FaqSection.tsx` → odpověď „Co je Zpracovat" |
| Nový koncept / terminologie | `FaqSection.tsx` → přidej Q&A |
| Reset hesla začal fungovat | `StartSection.tsx` (warning blok) + `FaqSection.tsx` |
| Nová fáze ve struktuře layoutu | `StartSection.tsx` → „Orientace v rozhraní" |

## Postup

1. **Identifikuj změnu** z kontextu konverzace nebo z git diff. Pokud měla fázi v roadmapu (1.5, 2.3, ...), zjisti přesný stav z `docs/roadmap-fe.md`.

2. **Klasifikuj** dle tabulky výše. Pokud změn je víc, projdi je jednu po druhé.

3. **Otevři příslušnou sekci** v `src/features/ikaros/pages/HelpPage/sections/` a najdi relevantní místo:
   - **`PagesSection`** — pole `IKAROS_PAGES` / `SOON_IKAROS` / `SOON_WORLD` (typovaný `PageDoc`).
   - **`RolesSection`** — tabulky `<table>` v `tableWrap`; akční matice.
   - **`AccountSection`** — `<h2>` bloky 1–7.
   - **`FaqSection`** — pole `FAQ` (objekty `{ q, a }`).

4. **Aplikuj edit** přesně dle stylu okolního obsahu:
   - Píš česky, jednoduchými větami.
   - Reuse stávající strukturu (žádné nové komponenty ad-hoc).
   - U 🚧 položek vždy uveď fázi (např. `fáze: 'Fáze 2.3'`).
   - U ✅ položek nech `path` jako reálnou URL (s `:param` pokud má).
   - Externí dokumentaci (specs, plans) neodkazuj — nápověda je pro hráče, ne pro AI agenta.

5. **Aktualizuj datum** v `HelpPage.tsx` v lead odstavci („Aktualizováno k YYYY-MM-DD") — vždy dnešní datum.

6. **Verifikace:**
   ```bash
   npx vitest run src/features/ikaros/pages/HelpPage
   npm run lint:colors
   ```
   Pokud test krytí spadlo (např. změna struktury sekce), uprav `__tests__/HelpPage.spec.tsx`.

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
