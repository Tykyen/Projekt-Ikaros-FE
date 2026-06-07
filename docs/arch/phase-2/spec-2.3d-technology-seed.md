# Spec 2.3d — Technologická úroveň světa (create form → seed stránky Technologie)

**Rozšiřuje:** [spec-2.3c-system-rules-seed.md](spec-2.3c-system-rules-seed.md).
**Zdroj obsahu:** `univerzalni_skala_technologie_rpg.pdf` (zadání PJ).

---

## Cíl

PJ při **tvorbě světa** zvolí technologickou úroveň světa jako **rozsah „od–do"**
na škále TÚ 0–14. Volba se při založení **vypíše na referenční stránku
Technologie** (univerzální škála + zvýrazněný rozsah tohoto světa). Dál se
upravuje **na té stránce**, ne v Nastavení světa.

## Rozhodnutí (potvrzeno s PJ)

- **Rozsah od–do**, ne jedna hodnota (PDF: nerovnoměrný vývoj — svět má pásmo).
- Nastavuje se **jen v create formu**. ⚠️ Po založení **NENÍ** v Nastavení světa
  (analogie s adresou světa) — edituje se obsah stránky Technologie.
- Magie = samostatná osa, řeší se později (jiná část).

## Datový tok

1. Create form: sekce „Technologie" se dvěma selecty `od TÚ __` / `do TÚ __`
   (0–14 s názvy). Default `4–4` (Středověká / feudální). Clamp `min ≤ max`.
2. `CreateWorldDto` přijme `techLevelMin?`, `techLevelMax?` (int 0–14).
3. `worlds.service.create` je spreadne do `worldsRepo.save` (beze změny logiky).
4. **`World` je persistuje** (`techLevelMin/Max`) — nutné, aby je `world.created`
   listener přečetl. Pole projít celým řetězcem: schema → interface → **toEntity
   mapper** → DTO (jinak save vrátí entitu bez nich → listener nevidí).
5. `pages-world-seed.listener` pro slug `technologie` seedne obsah z
   `buildTechnologyPage(world.techLevelMin, world.techLevelMax)`.

## Obsah stránky (univerzální, ne per-systém)

- úvod (co je TÚ — herní pomůcka, ne hodnota civilizace),
- **„Tento svět"** — zvýrazněno: `Běžně TÚ X–Y (Název … až Název)` (jen když
  je rozsah zadán),
- **Jak škálu používat** (4 vrstvy + magie jako samostatná osa),
- **Rychlé pravidlo pro postavy** (±1–3 úrovně dle původu),
- **Přehled úrovní TÚ 0–14** — `<ul>` `TÚ N — Název: jádro`,
- **Nerovnoměrný vývoj** + **Příklad zápisu** (5 ukázek),
- disclaimer.

⚠️ Obsah jen `h2/p/ul/li/strong/blockquote` — **žádné `<table>`** (PageViewer
volá `RichTextEditor` bez `enableTable`, TipTap by tabulku zahodil).

## Drift / duplicita

📚 Škála TÚ (názvy) je na **2 místech**: BE `technology-template.ts` (názvy +
jádro pro obsah stránky) a FE `technologyLevels.ts` (názvy pro selecty). Cross-repo
import nelze → mírná duplicita 15 názvů. Jádro úrovní jen na BE.

## Soubory

**BE:** `world.schema.ts`, `world.interface.ts`, `worlds.repository.ts` (toEntity),
`create-world.dto.ts`, nový `technology-template.ts`, `pages-world-seed.listener.ts`
(+ spec).
**FE:** nový `constants/technologyLevels.ts`, `components/TechnologySection.tsx`,
`CreateWorldPage.tsx`, `api/useCreateWorld.ts`, `shared/types` (World).

## Definition of done

1. Create form má sekci Technologie (od–do, clamp), pošle `techLevelMin/Max`.
2. BE persistuje pole (schema→toEntity→DTO), `npm run build` / typecheck OK.
3. Stránka Technologie po založení obsahuje škálu + rozsah světa.
4. Jest test (listener: technologie s rozsahem i bez), FE build + mobil-desktop.
5. Pole NENÍ v Nastavení světa (BasicInfoTab beze změny).
