# Spec 21.5 — „Společná tvorba" (fáze 1: hub + navigace + stuby)

> Roadmap: [docs/roadmap2.md](../../roadmap2.md) krok **21.5**. Tato spec pokrývá **jen fázi 1** = platformový rozcestník + úprava navigace + proklikatelné stuby. Plné knihovny (Bestiář 16.2b-2, Herbář, Lektvary, Kouzla, Hádanky) = samostatné pozdější spec-y.

**Stav:** ✅ Fáze 1 implementována 2026-07-03 (hub `/ikaros/tvorba` + nav sloučení + 5 stubů). Ověřeno: `npm run build` ✓, vitest 6/6 ✓, eslint ✓, mobil-desktop ✓ (375/768/1440, hub 0 overflow). Odchylky od draftu: prerender nemá statický whitelist (on-demand) → přidán jen do `STATIC_PATHS` (delší TTL); stub reuse `EmptyState` (bez vlastního CSS). Nález: pre-existující anon header overflow na <375 (ne z hubu) → dluh.

---

## Účel

Jeden vstupní bod pro veškerou komunitní tvorbu. Sjednotí dnes roztříštěné sekce (Diskuze/Články/Galerie) a připraví místa pro nové knihovny — vše proklikatelné hned, i když nová obsahová jádra ještě nestojí (stuby „Připravujeme").

## Route

- **`/ikaros/tvorba`** — hub (veřejný, bez `requireAuth`; komunitní obsah má být objevitelný).
- Stub routes (veřejné, sdílená komponenta): `/ikaros/bestiar`, `/ikaros/herbar`, `/ikaros/lektvary`, `/ikaros/kouzla`, `/ikaros/hadanky`.
- 💡 Rozhodnuto `/ikaros/tvorba` (kratší) místo `/ikaros/spolecna-tvorba` — uzavírá otevřenou otázku z roadmapy.
- ⚠️ `/ikaros/bestiar` ≠ světový `/svet/:slug/bestiar` — jiná cesta, žádná kolize. Platformový (komunitní) bestiář je vlastní katalog (16.2b-2).

## Navigace (`PRIMARY_NAV` v [IkarosLayout.tsx](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx))

- **Odebrat** položky `diskuze`, `clanky`, `galerie`.
- **Přidat** položku `tvorba`: label „Společná tvorba", `to: '/ikaros/tvorba'`, ikona `Palette` (lucide), **bez** `anonHidden` (veřejná).
- Pozice: kde byly ty tři (mezi „RPG systémy" a „Vytvořit svět").
- **RPG systémy zůstává samostatně** (veřejný SEO landing 15B.4a).
- Výsledek nav: Úvodník · Nápověda · RPG systémy · **Společná tvorba** · Vytvořit svět.

### Pending badge (moderace) — nesmí zmizet

Dnes Diskuze/Články/Galerie nesou `pendingType` badge (počet čekajících ke schválení; vidí jen kdo daný typ moderuje).

- Nav tlačítko „Společná tvorba" ukáže **agregovaný** badge = součet `DiscussionPendingReview + ArticlePendingReview + GalleryPendingReview` (z existující `usePendingActionsCount().byType`). Tooltip vyjmenuje rozpad.
- Jednotlivé **dlaždice v hubu** ukážou svůj vlastní badge (per typ), aby moderátor viděl, kam kliknout.
- 📚 `NavItem` dnes umí jen jeden `pendingType`; přidá se varianta se součtem více typů (drobné rozšíření, ne přepis).

## Hub — obsah a dlaždice

Layout = **reuse vzoru `SystemsHubPage`** (glass-grid, `CornerOrnament` v rozích, hover accent, responsive). Odchylka: emblém = **lucide ikona** (ne první písmeno) + krátký popis + volitelný stav/badge.

| Dlaždice | Ikona (lucide) | Cíl | Stav |
|---|---|---|---|
| Diskuze | `MessageSquare` | `/ikaros/diskuze` | ✅ aktivní |
| Články | `BookOpen` | `/ikaros/clanky` | ✅ aktivní |
| Galerie | `ImageIcon` | `/ikaros/galerie` | ✅ aktivní |
| Bestiář | `Skull` | `/ikaros/bestiar` | 🚧 Připravujeme |
| Herbář | `Leaf` | `/ikaros/herbar` | 🚧 Připravujeme |
| Lektvary | `FlaskConical` | `/ikaros/lektvary` | 🚧 Připravujeme |
| Kouzla | `Sparkles` | `/ikaros/kouzla` | 🚧 Připravujeme |
| Hádanky | `Puzzle` | `/ikaros/hadanky` | 🚧 Připravujeme |

- Pořadí: existující (Diskuze/Články/Galerie) první, nové knihovny za nimi.
- Stub dlaždice: rohový badge „Připravujeme"; **jsou proklikatelné** (vedou na stub stránku) — splňuje „vše na proklik".
- Každá dlaždice `data-tile-key` (test/analytics).
- Krátký popis per dlaždice (1 věta, např. Bestiář „Sdílený katalog nestvůr a jejich statů.").

## Stub stránka („Připravujeme")

Sdílená komponenta `ComingSoonPage` (props: `title`, `icon`, `description`):

- `Breadcrumbs` (Domů → Společná tvorba → {title}).
- Ikona + nadpil + text „Tuto sekci právě stavíme." + odkaz zpět na `/ikaros/tvorba`.
- `Seo` (noindex — stub se nemá indexovat; `robots: 'noindex'`).
- Reuse `StatePlaceholder` vzoru, pokud sedí; jinak lehká vlastní kostra.

## SEO

- Hub: `Seo` (title „Společná tvorba", description) + `ItemList` JSON-LD (jen aktivní dlaždice) + `BreadcrumbList` — jako `SystemsHubPage`.
- Stuby: `noindex` (prázdný obsah nepatří do indexu).
- Přidat `/ikaros/tvorba` do prerender whitelistu; stuby **ne**.

## Auth / viditelnost

- Hub i stuby veřejné (anon vidí).
- Dlaždice Diskuze → `/ikaros/diskuze` má vlastní `requireAuth` loader → anon klik = redirect na login (beze změny, konzistentní s dnešní nav).

## Responsive (base.md)

- Grid `repeat(auto-fill, minmax(240px, 1fr))`; mobil ≤768px = 1 sloupec (jako `SystemsHubPage`).
- Po implementaci povinný `mobil-desktop` audit (375 / 768 / 1440).

## Soubory

**Nové:**
- `src/features/ikaros/pages/SpolecnaTvorba/TvorbaHubPage.tsx` + `.module.css`
- `src/features/ikaros/pages/SpolecnaTvorba/tiles.ts` (data-driven definice dlaždic)
- `src/features/ikaros/pages/SpolecnaTvorba/ComingSoonPage.tsx` + `.module.css`
- `TvorbaHubPage.spec.tsx` (render dlaždic, stub proklik, badge agregace)

**Upravené:**
- [src/app/router.tsx](../../../src/app/router.tsx) — 1 hub route + 5 stub routes.
- [src/app/layout/IkarosLayout/IkarosLayout.tsx](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) — `PRIMARY_NAV` (odebrat 3, přidat 1) + `NavItem` multi-`pendingType` součet.
- `IkarosLayout.gating.spec.tsx` — aktualizovat očekávané nav položky.
- prerender whitelist (`/ikaros/tvorba`).

## Mimo scope (pozdější spec-y)

- Datové modely a plné UI Bestiář/Herbář/Lektvary/Kouzla/Hádanky (jen stuby teď).
- Sidebar „Oblíbené" sekce — beze změny.
- Přesun/agregace „Oblíbené diskuze/články/obrázky" v pravém panelu.

## Otevřené otázky (nízká priorita, neblokují fázi 1)

- Popisky dlaždic — finální copy (navrhnu, doladíš).
- Ikona nav „Společná tvorba": `Palette` vs `Sparkles` (zabraná Administrací) vs `Wand2`. Návrh `Palette`.
- Stub badge text: „Připravujeme" vs „Brzy" (nav používá „Brzy").
