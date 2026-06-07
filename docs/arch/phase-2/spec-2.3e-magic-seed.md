# Spec 2.3e — Magie světa (create form → seed stránky Magický systém)

**Rozšiřuje:** [spec-2.3d-technology-seed.md](spec-2.3d-technology-seed.md).
**Zdroj obsahu:** `univerzalni_skala_magie_rpg.pdf` (zadání PJ).

---

## Cíl

PJ při **tvorbě světa** zatrhá **typy (tradice) magie** přítomné ve světě. Volba
se při založení **vypíše na referenční stránku Magický systém** (univerzální
škála MÚ 0–14 + zvolené tradice). Dál se upravuje na té stránce, ne v Nastavení.

## Rozhodnutí (potvrzeno s PJ)

- ⚠️ **NE rozsah od–do** (jako technologie), ale **multi-select tradic** —
  „dotyčný si zatrhá typy magie". Reuse FE komponenty `PillChips` (jako kostky).
- Nastavuje se **jen v create formu**; po založení NENÍ v Nastavení světa.
- MÚ je hlavní osa, typ je doplňková informace — proto ve formu vybíráme typy a
  škálu MÚ 0–14 seedneme na stránku jako referenci.

## Datový tok

1. Create form: sekce „Magie" s `PillChips` (13 tradic).
2. `CreateWorldDto` přijme `magicTraditions?: string[]`.
3. `worlds.service.create` je spreadne do save (beze změny logiky).
4. `World` je persistuje (`magicTraditions`) — projít celý řetězec:
   schema → interface → **toEntity** → DTO (jinak listener pole nevidí).
5. `pages-world-seed.listener` pro slug `magicky-system` seedne obsah z
   `buildMagicPage(world.magicTraditions)`.

## Obsah stránky (univerzální)

- úvod (MÚ = jak hluboko je magie v realitě; samostatná osa vedle technologie),
- **„Magie tohoto světa"** — zvolené tradice (jen když nějaké jsou),
- **Jak škálu používat** (4 vrstvy; MÚ hlavní osa, typ druhá info),
- **Rychlé pravidlo pro postavy**,
- **Přehled úrovní MÚ 0–14** (`<ul>`),
- **Jak kombinovat MÚ a TÚ** (`<ul>` ukázek — provázání s technologií),
- **Doplňkové štítky** (tradice / cena / kontrola / dostupnost) jako reference,
- disclaimer.

⚠️ Jen `h2/p/ul/li/strong/blockquote` — žádné `<table>` (TipTap viewer bez
table extension).

## Tradice (multi-select)

Vílí, Božská, Šamanská, Runová, Akademická, Krevní, Démonická, Nekromantická,
Psionická, Přírodní, Kosmická, Snová, Alchymická. Prázdný výběr = bez
vyznačených tradic (sekce „Magie tohoto světa" se vynechá).

## Drift / duplicita

📚 Názvy tradic na 2 místech: BE `magic-template.ts` (pro výpis) + FE
`magicTraditions.ts` (pro chipy). Cross-repo import nelze. Škála MÚ (názvy+jádro)
jen na BE.

## Soubory

**BE:** `world.schema.ts`, `world.interface.ts`, `worlds.repository.ts` (toEntity),
`create-world.dto.ts`, nový `magic-template.ts`, `pages-world-seed.listener.ts`.
**FE:** nový `constants/magicTraditions.ts`, `components/MagicSection.tsx`,
`CreateWorldPage.tsx`, `api/useCreateWorld.ts`, `shared/types` (World).

## Definition of done

1. Create form má sekci Magie (PillChips tradic), pošle `magicTraditions`.
2. BE persistuje pole (schema→toEntity→DTO).
3. Stránka Magický systém po založení = škála MÚ + zvolené tradice.
4. Jest test (listener: s tradicemi i bez), FE build + mobil-desktop.
5. Pole NENÍ v Nastavení světa.
