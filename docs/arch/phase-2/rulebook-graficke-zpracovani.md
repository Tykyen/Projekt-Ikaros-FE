# Rulebook — grafické dokončení (kapitoly 10–13, kódex styl)

> Spec. Stav: **📝 čeká schválení.** Dokončení pravidlové knihy Ikaros/matrix ve stejné grafické i textové kvalitě jako kapitoly 1–9. Zdroj obsahu: `rulebook-content.md`. Cíl: matrix svět (newmatrix) + seed source pro budoucí matrix světy.

## Proč
Kapitoly 1–9 jsou hotové **graficky i slovně** (hub dlaždice + detail s hero obrázkem, učesaným textem a QuickRef). Kapitoly 10–13 chyběly. **Placeholder text byl chyba** — dokončujeme je ve stejné kvalitě.

## Cílová struktura (13 kapitol)
| # | Kapitola | Forma | Grafika |
|---|---|---|---|
| 1–9 | (hotové) | stránka `Ostatní` | hero + text + QuickRef ✅ |
| **10** | **Magická pravidla** | **SUB-HUB** (`Seznam`) | 21 dlaždic typů **s obrázky** → 21 detailních stránek |
| **11** | **Programování** | stránka `Ostatní` | hero `programovani-hub.webp` + text (8 mechanik jako sekce) + QuickRef |
| **12** | **Jazyková politika** | stránka `Ostatní` | text + QuickRef (úrovně A1–C2) |
| **13** | **Jazykové rodiny** | stránka `Ostatní` | hero `jazykove-rodiny.webp` + seznam rodin |

🔀 **Programování** dělám jako bohatou stránku (souvislá kapitola), ne sub-hub — 8 mechanik je provázaný výklad, ne paralelní „typy" jako magie. *(Když budeš chtít sub-hub i pro něj, řekni.)*

## Magie = sub-hub (jádro)
**`magicka-pravidla`** (`Seznam`): úvodní text + **21 dlaždic** (Alchymie, Antimagie, … Zvířecí magie) **s obrázky** `/rulebook/<typ>.webp`.
**21 typů** = samostatné stránky `Ostatní`, každá:
- **hero obrázek** (`alchymie.webp` …),
- **učesaný text** z `rulebook-content.md` (popis typu),
- **QuickRef** = stupně 1–6 jako rychlý přehled v sidebaru (vytaženo ze sekce „Stupně").

## Grafika (replikace stávajícího kódex stylu, žádný nový design)
- **Dlaždice s obrázkem** — rozšířím `RulebookHub` o volitelný obrázek na kartě (když `menu` položka má `imageUrl`). Hlavní hub 1–13 zůstává beze změny (bez obrázků), magický sub-hub dostane obrázky. Styl 1:1: `--accent #a96cff`, radial-glow hover, `translateY(-4px)`, číslo `--font-display`.
  - Layout karty s obrázkem: obrázek jako horní pruh karty (poměr ~16:9, `object-fit:cover`, border-radius nahoře) + pod ním číslo/název/šipka. Tmavý gradient overlay přes obrázek pro čitelnost (`rgb(var(--black-rgb)/.45)`).
- **Detail typu magie** — `OstatniLayout` (existující): hero obrázek + RichText + QuickRef sidebar. Identické s kapitolami 1–9.

## FE změny (minimální, konzistentní)
1. **`pages.types` MenuItem** — přidat `imageUrl?: string` (volitelné).
2. **`RulebookHub.tsx` + `.module.css`** — když položka má `imageUrl`, vykreslit obrázek v kartě (`.cardMedia`). Bez obrázku = stávající vzhled.
3. **`PageViewer.tsx` dispatch** — `isRulebookHub` rozšířit: `system==='matrix'` && `type==='Seznam'` && `slug ∈ {'pravidla','magicka-pravidla'}`. (Sub-hub magie pak jede přes RulebookHub.)

## Obsah / data
- Parser `rulebook-content.md` (už hotový, rozšířit): pro magii rozdělí sekci 10 na **21 typů** (každý `### Název` → stránka), vytáhne **QuickRef** ze „Stupně" (1–2 věty). Hub magie dostane `menu` 21 položek s `imageUrl`.
- Slug↔obrázek mapa (diakritika-fold + výjimky: `ovladani-energie`→`ovladani-magie.webp`).
- Programování/jazyky: 1 stránka každá (parser sekce 11/12/13 → HTML).

## Mechanika nasazení
- **Seed source** (`backend/.../rulebook-seed-data.ts`) — přidat kapitoly 10–13 + magické typy (pro budoucí matrix světy, bootstrap).
- **Migration workflow** (`import-matrix-rulebook.yml`, rozšířit) — vloží do **newmatrix** (existující) sub-hub + 21 typů + programování + jazyky, merge hub menu. Idempotent, `_mig`.
- FE změny (RulebookHub/PageViewer/MenuItem) — běžný FE commit + build.

## Fáze implementace
- **A. FE infra** — MenuItem.imageUrl, RulebookHub obrázky, PageViewer dispatch. (ověřit lokálně build)
- **B. Magie** — parser 21 typů + QuickRef, sub-hub data, seed+workflow → newmatrix.
- **C. Programování + jazyky** — parser, seed+workflow.
- **D. Sjednocení** — hub menu 13 kapitol, kontrola na mobilu (skill mobil-desktop).

## Mimo rozsah (zatím)
- Animovaná „LevelSpine" komponenta pro stupně (QuickRef textový zatím stačí; lze přidat ve fázi 2).
- Sjednocení textu kapitol 1–9 na nejnovější `rulebook-content.md` (volitelné, drobný rozdíl).

## Otevřené body
1. Programování: bohatá stránka (navrhuji) vs sub-hub.
2. QuickRef magie: stupně 1–6 plné, nebo jen 1–2 věty shrnutí?
