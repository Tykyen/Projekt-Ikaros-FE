# Pravidlová kniha — design směr + plán F1

> Navazuje na `spec-2.3f-ikaros-rulebook.md` a učesaný obsah `rulebook-content.md`.
> Design ověřen klikacím prototypem: `C:\tmp\rulebook-prototype.html` (reálné ikaros
> tokeny + fonty). Tento doc = závazný design jazyk + implementační plán fáze F1.

## Design jazyk — „arkánní terminál / kodex"

Matrix svět = magie + kyberpunk → rulebook spojuje **editoriální čitelnost** s
**terminálovou/neon patinou** skinu ikaros. Vše scoped na `[data-theme="ikaros"]`
+ rulebook-specifické třídy (žádné globální edity — viz `feedback_theme_isolation`).

**Tokeny:** výhradně existující ikaros (`--accent #a96cff`, `--text #ece4ff`,
`--bg #0c0820`, `--glow`, surfaces, borders). Matrix rain běží automaticky z motivu.

**Typografie (3 role):**
- **Orbitron** — číslice kapitol, hub titul, HUD/štítky (cyber identita).
- **Rajdhani** — nadpisy sekcí, UI, navigace.
- **Crimson Pro** — dlouhá čtecí próza (19 px / 1.72, max ~66 ch).

**Signature prvky (to, co si zapamatuješ):**
1. **Stupňová páteř** (`LevelSpine`) — svítící timeline stupňů 1–6/1–7 se zářícími
   uzly. Sjednocený vizuální jazyk pro magii i Úroveň sil.
2. **„Rychlý přehled" jako HUD panel** (`QuickRef`) — neonově orámovaný sticky aside
   s `//` štítkem; taháková rekapitulace čísel u stolu.
3. **Kodex index** (hub) — karty kapitol s velkými Orbitron číslicemi, hover lift+glow,
   Matrix rain prosvítá.

**Komponenty (FE):**
- `RulebookHub` — kodex index (nahrazuje generický `SeznamLayout` pro `pravidla`).
- `RulebookChapter` — čtecí view: prose + `QuickRef` HUD + sbalovací sekce.
- `RulebookMagic` — sub-nav 21 typů + `LevelSpine` + rámovaná ilustrace.
- `LevelSpine`, `QuickRef` — sdílené, reusable.
- Sbalovací sekce = restylovaný vzor `PageSections`.

➡️ Z tohoto jazyka odvodím skill **`rulebook-design`** (typografie, spine, HUD,
rámování) až při F1 implementaci — aby všechny kapitoly držely konzistenci.

## Datový model (klíčové rozhodnutí)

Kapitola = `Page`. Hub `pravidla` = type `Seznam` + `menu` (13 položek). Magie =
sub-hub `magicka-pravidla` (`Seznam` + 21 položek). Obsah = TipTap HTML v `content`.

⚠️ **Quick-ref data:** HUD potřebuje *strukturovaná* čísla, ne jen prózu. Návrh: nové
volitelné pole `Page.quickRef` (pole řádků `{label, value}`) — čistší než parsovat
HTML. (Field-drift checklist: schema/DTO/service/toEntity — viz `project_be_field_checklist`.)

⚠️ **Stupně data:** `LevelSpine` chce pole `{ level, text }`. Návrh: pole
`Page.levels` (nebo reuse `sections`). Rozhodne se v plánu kódu.

## Plán F1 (k odsouhlasení — teprve pak kód)

**Rozsah F1:** master kniha v DB + klon do matrix světa + hub Pravidla + kapitoly
1–9 (jádro) ve vizuálu dle prototypu. Magie (F2), Programování (F3), Jazyky (F4)
následují stejným jazykem.

**BE:**
1. **Master úložiště** — kolekce/template `rulebook_master` (vzor `dungeon-maps
   exportTemplate`). Bootstrap: strukturovaná data v repu (`rulebook/` TS, odvozená
   z `rulebook-content.md`) → **idempotentní import** do masteru. Repo = záloha,
   DB master = živý kanón. Superadmin editace = F6.
2. **Konverze obsahu** → ~9 stránek kapitol + hub jako TipTap `content` (+ `quickRef`,
   `levels`). ⚠️ Největší sub-úkol: markdown → TipTap HTML.
3. **Seed listener** (`pages-world-seed.listener.ts`): gate `world.system==='matrix'`
   → **vypnout** generický `magicky-system` i `technologie` seed; **klon masteru**
   → world Pages.
4. Field-drift: `quickRef`/`levels` přidat do schema + DTO + service + `toEntity`.

**FE:**
5. Komponenty `RulebookHub`, `RulebookChapter`, `QuickRef`, sbalovací sekce; styly
   scoped, ikaros tokeny.
6. Route `/svet/:slug/pravidla` → `RulebookHub` (když je rulebook); kapitoly přes
   page viewer s rulebook layoutem. `buildWorldNav` má „Pravidla" už zařazené.
7. `mobil-desktop` ověření; build (`npm run build`) před commitem.

**Mimo F1 (drží se fázování):** F2 magie + `LevelSpine`, F3 programování, F4 jazyky,
F5 přenosná knihovna, F6 Superadmin editace masteru, F7 katalog 68 programů.

## Otevřené k potvrzení před kódem
- Master jako **samostatná template kolekce** vs. skrytý „template world"? (lean:
  template kolekce, vzor dungeon-maps.)
- `quickRef` + `levels` jako **nová pole Page** (lean: ano) vs. zakódovat do `sections`.
