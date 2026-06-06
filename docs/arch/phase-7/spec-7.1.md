# Spec 7.1 — Page viewer (`/svet/:worldSlug/:slug`)

> **Stav:** návrh k schválení • **Autor:** Claude + PJ • **Datum:** 2026-05-21
> Roadmap: [docs/roadmap-fe.md](../../roadmap-fe.md) řádek 1143+

---

## 1 — Účel

Nahradit stub `PageViewerPage` plnohodnotným read-only viewerem wiki stránek světa. Odemyká celou fázi 7 (editor 7.2, list 7.3, admin 7.4 staví na stejných API hooky/typech). Catch-all routa `/svet/:worldSlug/:slug` musí zůstat **posledním** dítětem v [src/app/router.tsx:283](../../../src/app/router.tsx#L283).

## 2 — Rozsah

### In-scope (7.1a–d z roadmapy + 7.1e–7.1m rozšíření)

**Z roadmap-fe.md (7.1a–d):**
- Render TipTap HTML read-only + AutoTOC
- **7 typových layoutů**: Lokace, Noviny, Seznam, Galerie, Rodokmen, **Obrazovka**, Ostatní *(Obrazovka přidána 2026-05-21 — žádný dluh)*
- Boční panel (hero + datová tabulka)
- AKJ banner + 403 screen + skrytí nedostupných linků
- Breadcrumbs, favorite hvězda, broken-link detekce
- API hooky: `usePage(worldId, slug)`, `usePageMeta`, `usePagesDirectory`, `useFavoritePage` (toggle)

**Rozšíření nad rámec roadmapy (schváleno v brainstormingu 2026-05-21):**
- **7.1e** — Sticky AutoTOC + scroll-spy (URL `?section=`)
- **7.1f** — Inline image lightbox (klik na jakýkoliv `<img>` v obsahu)
- **7.1g** — Read-time estimate („📖 ~N min čtení")
- **7.1h** — Quote-on-select copy popup
- **7.1i** — Floating quick-action dock (favorite/edit/top/share)
- **7.1j** — `Cmd+K` / `Ctrl+K` page jump palette
- **7.1k** — Keyboard shortcuts (`e`/`f`/`Esc`/`?`/`g s`)
- **7.1l** — Backlinks panel „Odkazuje sem" *(vyžaduje BE rozšíření)*
- **7.1m** — Print stylesheet

### Mimo rozsah (odloženo)

- **PC/NPC/Deník/Finance/Batoh** → fáze 8 (`characters` modul)
- Editor (vytváření/úprava) → 7.2
- **AKJ creation flow** (modal pro vytvoření AKJ + auto-create meta stránky) → **7.2 editor** (rozhodnuto 2026-05-21)
- **AKJ types CRUD BE endpoint** → spolu s 7.2
- Plný list/admin → 7.3, 7.4
- Reading progress bar → zamítnuto v brainstormingu
- Recent viewed dock → zamítnuto v brainstormingu
- Metadata footer (autor/datum) → zamítnuto v brainstormingu
- Komentáře / reactions → patří do diskuzí (3.4)
- `[[slug]]` autocomplete → editor (7.2)
- Verze historie → dluh, mimo MVP

## 3 — Architektura

### Komponenty (nové)

```
src/features/world/pages/PageViewer/
├── PageViewerPage.tsx              # routovaná entry — nahrazuje stub
├── PageViewerPage.module.css
├── PageViewer.tsx                  # presenter (typ-agnostic shell)
├── PageViewer.module.css
├── components/
│   ├── PageHeader.tsx              # breadcrumbs + title + favorite + edit + read-time
│   ├── PageHeader.module.css
│   ├── PageSidebar.tsx             # hero + table + StickyAutoTOC; mobil collapsible
│   ├── PageSidebar.module.css
│   ├── PageSections.tsx            # collapsible sekce (default sbalené)
│   ├── PageSections.module.css
│   ├── AkjBanner.tsx               # "Utajený archiv [AKJ: N]" — theme-aware
│   ├── AkjBanner.module.css
│   ├── ZoomableImage.tsx           # pan/zoom — pro Rodokmen + Lokace map
│   ├── ZoomableImage.module.css
│   ├── GalleryLightbox.tsx         # modal s prev/next (7.1f reuse)
│   ├── GalleryLightbox.module.css
│   ├── PageViewerSkeleton.tsx      # loading state
│   ├── PageViewerSkeleton.module.css
│   ├── QuoteSelectionPopup.tsx     # 7.1h — copy text + anchor link
│   ├── QuoteSelectionPopup.module.css
│   ├── QuickActionDock.tsx         # 7.1i — floating dock
│   ├── QuickActionDock.module.css
│   ├── PagePalette.tsx             # 7.1j — Cmd+K modal
│   ├── PagePalette.module.css
│   ├── KeyboardShortcutsHelp.tsx   # 7.1k — ? overlay
│   ├── KeyboardShortcutsHelp.module.css
│   ├── BacklinksPanel.tsx          # 7.1l
│   └── BacklinksPanel.module.css
├── layouts/
│   ├── LokaceLayout.tsx
│   ├── NovinyLayout.tsx
│   ├── SeznamLayout.tsx            # 3-sloupcový: nav | card | detail
│   ├── SeznamLayout.module.css
│   ├── GalerieLayout.tsx
│   ├── RodokmenLayout.tsx
│   ├── ObrazovkaLayout.tsx         # sidebar videí + iframe player + popis
│   ├── ObrazovkaLayout.module.css
│   └── OstatniLayout.tsx           # default (= Lokace bez specifik)
├── hooks/
│   ├── useBrokenLinks.ts           # DOM scan, slug index check
│   ├── useInlineImageLightbox.ts   # 7.1f — wrap <img> v containeru
│   ├── useReadTime.ts              # 7.1g — výpočet z plainText
│   ├── useQuoteSelection.ts        # 7.1h — Selection API
│   ├── useKeyboardShortcut.ts      # 7.1k — sdílený hook
│   └── usePagePalette.ts           # 7.1j — Cmd+K open state + fuzzy
├── lib/
│   ├── slugifyHeading.ts           # text → id pro anchor
│   ├── parsePageLinks.ts           # extract slugs z HTML
│   └── fuzzyMatch.ts               # palette ranking
└── index.ts

src/features/world/pages/api/
├── usePage.ts                      # GET /worlds/:worldId/pages/:slug
├── usePagesDirectory.ts            # GET /worlds/:worldId/pages/directory ({slug,title})
├── usePageMeta.ts                  # GET /worlds/:worldId/pages/meta/:slug
├── useFavoritePage.ts              # POST/DELETE /worlds/:worldId/pages/:slug/favorite
├── usePageBacklinks.ts             # 7.1l — GET /worlds/:worldId/pages/:slug/backlinks (NOVÝ BE endpoint)
└── pages.types.ts                  # Page, PageType, AccessRequirement, …
```

📚 *Důvod oddělené složky `PageViewer/` místo plochého souboru: presenter + 6 layoutů + 8 podkomponent = 15+ souborů. Plochý mix se 7.2 (editor) by se stal nepřehledným.*

### Datový tok

```
PageViewerPage
  ├─ useParams() → worldSlug, slug
  ├─ useResolveWorldId(worldSlug) → worldId
  ├─ usePage(worldId, slug) → { data, isLoading, error }
  ├─ usePagesDirectory(worldId) → string[] (slugy, pro broken-link)
  └─ render:
      ├─ isLoading → <PageViewerSkeleton />
      ├─ error 403 → <AccessDenied page={meta} />
      ├─ error 404 → <PageNotFound slug={slug} />
      └─ data → <PageViewer page={data} />
```

### Volba layoutu

```ts
const LAYOUTS: Record<PageType, ComponentType<{ page: Page }>> = {
  Lokace: LokaceLayout,
  Noviny: NovinyLayout,
  Seznam: SeznamLayout,
  Galerie: GalerieLayout,
  Rodokmen: RodokmenLayout,
  Obrazovka: ObrazovkaLayout,
  Ostatní: OstatniLayout,
};
```

## 4 — 7.1a Render obsahu

- **Reuse** `RichTextEditor` v `readOnly` módu — viz [src/shared/ui/RichTextEditor/RichTextEditor.tsx](../../../src/shared/ui/RichTextEditor/RichTextEditor.tsx). Žádný nový editor.
- **Reuse** `AutoTOC` z [src/features/ikaros/components/AutoTOC.tsx](../../../src/features/ikaros/components/AutoTOC.tsx). AutoTOC vlevo nad obsahem nebo v sidebaru (responsive: desktop = pravý sidebar nahoře, mobil = collapsible nahoře nad obsahem).
- TipTap content z `page.content` (HTML string). Pre-rendering řeší backend (`plainText`), FE jen ukazuje.

## 5 — 7.1b Typové layouty

### Lokace + Ostatní (default profile)

```
┌──────────────────────────────────────────┬─────────────┐
│ Breadcrumbs                              │             │
│ # Title                            ⭐ ✏️ │   SIDEBAR   │
│                                          │   ┌─────┐   │
│ AKJ banner (jen pokud existuje req)      │   │hero │   │
│                                          │   └─────┘   │
│ AutoTOC (jen >2 nadpisy)                 │   table     │
│                                          │             │
│ TipTap content                           │             │
│                                          │             │
│ Sekce (collapsible)                      │             │
└──────────────────────────────────────────┴─────────────┘
```

Mobile (<1024px): sidebar nad obsahem, collapsible toggle "Profil ⌃".

### Noviny

- **Hero**: full-width banner (`imageUrl`, `bigImage` se ignoruje, vždy full)
- **Metadata HUD**: `customData.Stát` • `customData.Vydavatel` • `customData.Datum` — inline flex-wrap, malý monospace font, oddělené `•`
- **Bez sidebaru** — single column, max-width 880px center
- TipTap content jako tělo článku

📚 *customData je `Record<string,string>` — editor 7.2 dá user-friendly form, viewer 7.1 jen zobrazí. Pokud klíče chybí, prostě se neukáže (graceful degradation).*

### Galerie

- Grid: `repeat(auto-fill, minmax(280px, 1fr))`, gap 16px
- Karta: aspect-ratio 3:2, hover scale 1.03, caption pod obrázkem
- **Klik → `GalleryLightbox`**: fullscreen overlay, prev/next, ESC = close, šipky = navigace, klik mimo = close, swipe na mobilu
- Sidebar = jen hero + table (jako Lokace)

### Seznam

3-sloupcový grid (jako starý Matrix, ale s našimi tokens):

```
┌─────────┬──────────────┬─────────┐
│ Items   │   Hero card  │ Detail  │
│ (menu)  │   (selected) │ (table) │
└─────────┴──────────────┴─────────┘
   2fr        5fr           2.5fr   (desktop)
```

- **Items** = `page.menu[]` (existující BE pole), klik na položku přepne aktivní
- **Hero card** = `imageUrl` selected item + jeho text
- **Detail** = `table` selected item

⚠️ **Otevřené:** schéma `menu` je `{label, href, order}[]` — nemá per-item imageUrl/text. Buď tohle pole rozšířit (BE-side migrace), nebo Seznam = jen `menu` jako levý nav a obsah/sidebar zůstává centrální. **Návrh:** druhá varianta — žádná BE migrace v 7.1, `menu` = klikatelné odkazy v levém sloupci, obsah celé stránky uprostřed, table v pravém sidebaru. Funkční přínos zachován bez BE změn.

### Rodokmen

- **Hero** = `imageUrl`, vykreslen přes `ZoomableImage` (nová komponenta)
  - Custom pan/zoom: 0.25× – 5× v 0.25 krocích (stejný step jako starý Matrix)
  - `transform: scale(s) translate(x, y)` + drag panning
  - Overlay controls top-left: `−` / `100%` badge / `+` / `Reset`
  - Container `height: min(70vh, 800px)`, overflow hidden, dark bg, custom scrollbar
- TipTap content + table pod obrázkem

💡 *ZoomableImage = reusable. Použijeme i pro Lokace, pokud bude `bigImage=true` (interpretujeme jako „velká mapa, dovol zoom").*

### Obrazovka

*Přidáno do 7.1 na žádost 2026-05-21 — žádný dluh. BE už má `videos: InstructionalVideo[]` ve schématu.*

```
┌──────────┬─────────────────────────────────────┐
│ Videa    │   ▶ Aktivní video (YouTube iframe)  │
│ ──────── │                                     │
│ ▶ Video1 │   ┌─────────────────────────────┐   │
│   Video2 │   │                             │   │
│   Video3 │   │      [iframe 16:9]          │   │
│          │   │                             │   │
│          │   └─────────────────────────────┘   │
│          │                                     │
│          │   Title aktivního videa             │
│          │                                     │
│          │   TipTap content (popis)            │
└──────────┴─────────────────────────────────────┘
   260px              flex 1
```

**Komponenty / data:**
- **Levý sidebar**: list `page.videos[]` (button per item, klik = setActive)
  - Aktivní item: zvýrazněný left-border `var(--world-accent)` + bold title
  - Neaktivní: hover background tint
  - Default = první video (`videos[0]`) auto-selected na mount
- **Centrální obsah**:
  - YouTube iframe: `src="https://www.youtube.com/embed/{youtubeVideoId}?rel=0"`
  - Aspect ratio 16:9 přes `aspect-ratio: 16/9` (no padding hack)
  - Pod iframe: `<h2>{activeVideo.title}</h2>` + TipTap content (`page.content`) jako popis
- **Empty state**: pokud `videos.length === 0` → ukázat placeholder „Žádná videa zatím nepřidána" + (pokud PomocnyPJ+) tlačítko „Přejít do editoru"

**Mobile (≤768px):**
- Video iframe nahoře (full width)
- Title pod ním
- List videí pod title jako horizontální scrollable strip (chip-like buttons)
- Popis úplně dole

**Sidebar (boční panel)** = **skrytý** v Obrazovka layoutu (videa konzumují prostor sidebaru). Hero/table viděn jen v jiných typech.

**A11y:**
- iframe `title={activeVideo.title}` (povinný atribut)
- Video buttons jsou skutečné `<button>`, šipky nahoru/dolů přepínají (klávesnice)

📚 *YouTube embed má rate limits + autoplay restrictions; `?rel=0` zabrání zobrazení doporučených videí jiných kanálů na konci. Nepřidáváme `autoplay=1` — UX horror.*

⚠️ **Pozor:** v 7.1 vieweru NENÍ správa videí (add/edit/remove). To je 7.2 editor. Tady jen render existujícího seznamu.

## 6 — 7.1c Přístup

### Zdroj pravdy

BE už hlídá — `GET /worlds/:worldId/pages/:slug` vrací **403** s kódem `PAGE_ACCESS_DENIED` pokud user nesplní `accessRequirements`. FE se na to nemusí spoléhat sám.

### Co FE dělá navíc

1. **403 screen** (= component `<AccessDenied>`): pokud API vrátí 403, ukázat:
   - Title: „Přístup zamítnut"
   - Hint: jaká role/AKJ chybí (parse z response message nebo z `usePageMeta` shadow fetch)
   - **isWoodWide indikátor** — pokud `meta.isWoodWide=true`, navíc badge „🌐 Wood-Wide" + tooltip „Tento záznam je součástí celosvětového lore"
   - Tlačítko Zpět + (pokud uživatel je PomocnyPJ+) odkaz na editor
2. **AKJ banner** (= component `<AkjBanner level={N} type="AKJ"|"AKJType" akjKey={key?} />`):
   - Zobrazuje se **na úspěšně načtené stránce**, pokud `accessRequirements` obsahuje typ `AKJ` nebo `AKJType`
   - Text: „🔒 Utajený archiv • AKJ ≥ N • Úspěšně dešifrováno"
   - **Stylizace dle světa**: pozadí + border z theme tokens (`var(--world-accent)`), monospace font, dashed border 1px
   - **Klikatelný** (rozhodnuto 2026-05-21):
     - Pokud `type=AKJType` → klik naviguje na `/svet/:worldSlug/akj-<key>` (meta stránka konkrétního AKJ)
     - Pokud meta stránka neexistuje (zjištěno přes `usePagesDirectory` lookup) → banner zůstává **vizuálně klikatelný, ale klik no-op** + tooltip „Meta stránka tohoto AKJ ještě neexistuje (vytvoří ji PJ v editoru)"
     - Pokud `type=AKJ` (jen číslo, bez `key`) → klik **disabled**, žádná navigace (číselný AKJ nemá meta stránku)
   - 📚 *Meta stránka AKJ se vytváří v 7.2 editoru (AKJ creation flow). V 7.1 jen konzumujeme — pokud existuje, klikni a uvidíš; pokud ne, banner je jen informativní.*
3. **Skrytí linků** (= rozšíření `useBrokenLinks`): pokud link míří na slug, jehož stránka má AKJ requirement vyšší než user (zjistitelné jen z full fetch — drahé), **necháváme klik fungovat → BE vrátí 403 → AccessDenied**. Plošné pre-fetch všech 403 by byl overkill. ⚠️ Z roadmapy „skrytí nedostupných" je tedy interpretováno měkčeji — fyzicky odkaz vidí, ale po kliknu narazí na AccessDenied místo NotFound.

📚 *Důvod: API vrátí jen seznam slugů přes `dataSlugs`, nikoliv per-slug AKJ-level. Pre-fetch všech `:slug` jen pro filtr linků = 50+ requests na page open. Lepší UX = vidět odkaz a získat informativní 403, než nevidět nic.*

## 7 — 7.1d Navigace

### Breadcrumbs

```
🌐 Ikaros / 🏰 [Svět Name] / 📄 Stránky / [Page Title]
```

- 1. úroveň: `/` (dashboard)
- 2. úroveň: `/svet/:worldSlug`
- 3. úroveň: `/svet/:worldSlug/stranky` (= 7.3, zatím stub — link zůstává, vede na PagesListPage)
- 4. úroveň: aktuální (bez linku)

### Favorite hvězda

- V `PageHeader` vedle title
- Stav z `useWorld` (či dedikovaného endpointu — viz §10) — `world.favoritePageSlugs[]`
- Toggle přes `useFavoritePage` (POST/DELETE)
- Empty: `☆` outline, šedá; filled: `★` zlatá, glow text-shadow
- Optimistic update (okamžitý visual flip, rollback při fail)

### Broken-link detekce (`useBrokenLinks`)

```ts
function useBrokenLinks(containerRef, worldSlug, worldId) {
  const { data: slugs = [] } = usePagesDirectory(worldId);
  useEffect(() => {
    if (!containerRef.current || slugs.length === 0) return;
    const slugSet = new Set(slugs);
    const links = containerRef.current.querySelectorAll('a[href]');
    links.forEach(a => {
      const href = a.getAttribute('href') ?? '';
      const match = href.match(new RegExp(`^/svet/${worldSlug}/([^/?#]+)`));
      if (match && !slugSet.has(match[1])) {
        a.classList.add('brokenLink');
        a.setAttribute('title', 'Stránka neexistuje');
      }
    });
  }, [slugs, worldSlug, ...rerenderTriggers]);
}
```

CSS `.brokenLink` (global v `PageViewer.module.css :global`):
```css
color: var(--color-danger);
text-decoration: line-through dotted;
cursor: not-allowed;
```

📚 *Spustí se znovu při změně obsahu (page.content), aby pokrylo i links uvnitř collapsed sekcí po expand.*

### Edit tlačítko

- Viditelné pouze pokud `WorldRole >= PomocnyPJ` (reuse `useWorldMembership` / podobný hook)
- V `PageHeader` vpravo od favorite
- Naviguje na `/svet/:worldSlug/edit/:slug` (= 7.2 stub — odkaz připraven, stránka zatím stub, OK)

## 8 — Kreativní extras (základní)

### Skeleton loader

`<PageViewerSkeleton>` zobrazuje:
- Šedý gradient řádek pro breadcrumbs
- Velký placeholder pro title
- 6 řádků placeholderu pro obsah (různé šířky)
- Sidebar placeholder (320×240 + 4 řádky table)

Pulse animace `@keyframes shimmer` (1.5s).

### isWoodWide indikátor

- Pokud `page.isWoodWide=true` → malý badge vedle title:
  - Ikona 🌐 (či custom — viz dluh §11)
  - Tooltip: „Wood-Wide • součást celosvětového lore"
  - Klik = bez akce (jen informační)

---

## 8.5 — Rozšíření 7.1e–m (schválené nad rámec roadmapy)

### 7.1e — Sticky AutoTOC + scroll-spy

**🎉 Existující komponenta `AutoTOC` umí vše out-of-box** (viz §10 TBD #3). Stačí:
1. PageViewer content container označit `data-article-content` atributem
2. Renderovat `<AutoTOC html={page.content} />` v pravém sidebaru (nebo nahoře na mobilu)
3. CSS wrapper kolem AutoTOC: `position: sticky; top: calc(var(--header-h, 64px) + 16px)`

**Deeplink:**
- AutoTOC dnes používá `#section-id` hash (z `history.pushState`)
- **Necháváme tak** — hash je standardnější než `?section=`, browser back/forward funguje
- Iniciální scroll: pokud `window.location.hash` existuje při mount → `document.getElementById(hash.slice(1))?.scrollIntoView()` (existující AutoTOC to nedělá; přidáme do PageViewer mount effectu)

📚 *AutoTOC = reuse beze změny. Jen container atribut + sticky wrapper.*

### 7.1f — Inline image lightbox

- Po renderu TipTap obsahu projít všechny `<img>` v content containeru
- Wrap do `<button>` (a11y) s `onClick → openLightbox(src, alt)`
- Lightbox = stejná komponenta `GalleryLightbox` (reuse z Galerie typu)
- Cursor pointer + hover overlay „🔍 Zvětšit"
- Klávesy: ESC zavřít, šipky prev/next (mezi všemi `<img>` na stránce)
- **Edge case:** pokud `<img>` je už uvnitř `<a>` (link), nedělat lightbox — uctíme původní behavior

### 7.1g — Read-time estimate

- Pod titulem v header strip: `📖 ~{N} min čtení`
- Výpočet: `Math.max(1, Math.ceil(plainText.split(/\s+/).length / 220))` (220 wpm = běžné čtení v češtině)
- `plainText` už BE dodává (TipTap extractor v `tiptap-extractor.service.ts`)
- Skryto pro typ Galerie (žádný relevantní text)

### 7.1h — Quote-on-select copy popup

- `mouseup` listener v content containeru
- Pokud `window.getSelection().toString().trim().length > 5` → zobrazí floating popup u kurzoru:
  - `📋 Kopírovat citát` → clipboard s `"<text>" — [Page Title] (<URL>)`
  - `🔗 Anchor link na sekci` → najít nejbližší předchozí heading a vytvořit URL `…?section=<slug>`
- Mizí na `mousedown` mimo popup, na `Esc`, nebo když selection.length === 0
- Mobile: zobrazí se pod selection toolbar (browser-native), náš popup skryt

📚 *Window selection API je nativní, žádná lib. Popup je floating UI = portal + position computed z `range.getBoundingClientRect()`.*

### 7.1i — Floating quick-action dock

- Sticky vpravo dole, `position: fixed; bottom: 24px; right: 24px`
- Vertikální stack ikon (44×44 touch target):
  - ⭐ Favorite toggle (mirror s header hvězdou, sync state)
  - ⬆️ Scroll to top (skryté dokud `scrollY < 400`)
  - ✏️ Edit (jen PomocnyPJ+; vede na 7.2)
  - 🔗 Copy URL → clipboard + toast „Link zkopírován"
- Theme-aware (`var(--world-accent)` pro hover)
- Mobile: zmenšit na 40×40, ponechat všechny ikony
- Auto-hide při scroll down, fade in při scroll up (UX z mobilních toolbar)

### 7.1j — `Cmd+K` / `Ctrl+K` page palette

- Global keyboard listener na page (mount/unmount lifecycle)
- Otevře modal `<PagePalette>`:
  - Input pole s autofocus
  - Fuzzy match přes `dataSlugs` + page titles (potřebujeme oba — viz §10 TBD)
  - Výsledky max 8 položek, šipky nahoru/dolů, Enter naviguje
- Reuse `usePagesDirectory` (cached)
- Pokud BE `dataSlugs` neobsahuje title, použijeme `findDirectory` endpoint který má `{slug, title}` (BE controller line 47)
- Skupiny: „Tato stránka" (anchor TOC položky), „Stránky světa" (z directory)

💡 *Stejný pattern jako VS Code, Linear, Notion. Najednou rychlejší než navigovat přes menu.*

### 7.1k — Keyboard shortcuts

| Klávesa | Akce |
|---|---|
| `e` | Edit (pokud PomocnyPJ+) |
| `f` | Favorite toggle |
| `Esc` | Zavřít lightbox / palette / popup |
| `?` | Otevřít help overlay s seznamem shortcuts |
| `g s` | Goto „Stránky" list (sekvence) |
| `Cmd/Ctrl+K` | Page palette (7.1j) |
| `/` | Focus na search v paletě (alias) |

- Implementace přes lehký hook `useKeyboardShortcut(combo, handler, options)` (nový, sdílený)
- Help overlay = jednoduchý modal se 2 sloupci (klávesa | popis)
- Šortkuty disabled když user typuje v inputu/textarea (target.tagName check)

### 7.1l — Backlinks panel „Odkazuje sem"

⚠️ **Vyžaduje BE rozšíření.**

**BE změny** (paralelně k FE 7.1, repo `C:/Matrix/ProjektIkaros/Projekt-ikaros/backend`):
1. `pages.repository.ts` — nová metoda `findBacklinksToSlug(worldId, slug): Promise<Page[]>`
   - Mongo query: `{ worldId, content: { $regex: \`/svet/[^/]+/${slug}["#?\\s]\` } }` (regex match HTML href)
   - Project jen `{ slug, title, type }` (lehká odpověď)
2. `pages.service.ts` — `findBacklinks(slug, worldId, userId)` s access filtrem (vyloučit stránky, ke kterým user nemá přístup — reuse `assertAccess` ale silent fail)
3. `pages.controller.ts` — `GET /worlds/:worldId/pages/:slug/backlinks` → vrátí `{slug, title, type}[]`

**FE změny:**
- Hook `usePageBacklinks(worldId, slug)` — React Query
- Komponenta `<BacklinksPanel>` zobrazena pod sekcemi (nebo collapsible v sidebaru)
- Render: `📎 Odkazuje sem (N)` + seznam karet [icon typu + title], klik = naviguje
- Pokud 0 backlinks → skrýt panel
- Loading skeleton 3 karty placeholder

💡 *Tohle je velmi praktická lore wiki feature. Roam/Logseq/Obsidian-pattern. Pro PJ-stylé budování světa zlato.*

📚 *Mongo `$regex` na large content stringu není levný — pro fáze 10+ uvažujeme search-coordinator integraci. Pro MVP s typicky <500 stránkami na svět to stačí.*

### 7.1m — Print stylesheet

- `@media print` v `PageViewer.module.css`:
  - Skryté: breadcrumbs, header utility buttons (kromě title), favorite, edit, sidebar (na samostatnou stránku), AutoTOC, quick-dock, palette, broken-link styling
  - Viditelné: title, AKJ banner (pro kontext), obsah, sekce **rozbalené**, table (přesunut pod obsah)
  - `color-adjust: exact` pro AKJ banner barvy
  - `page-break-inside: avoid` na sekce
- Žádný separate button — uživatel jen Ctrl/Cmd+P
- Print preview testujeme manuálně v rámci acceptance criteria

## 9 — Acceptance criteria

### Z roadmapy (7.1a–d)
- [ ] `/svet/:worldSlug/:slug` renderuje stránku všech 7 typů včetně Obrazovka
- [ ] Obrazovka: video sidebar + iframe player; auto-select prvního; klávesy nahoru/dolů; mobile = strip pod iframe
- [ ] AKJ banner klikatelný → navigace na `akj-<key>` meta stránku (pokud existuje); jinak no-op s tooltipem
- [ ] AutoTOC zobrazí >=2 nadpisy v obsahu; <2 nadpisů = skrytý
- [ ] Skeleton loader během fetch
- [ ] 403 → AccessDenied screen s isWoodWide hint
- [ ] 404 → PageNotFound screen
  - **Revize 2026-06-06:** „Vytvořit" na 404 už předávalo `?slug=` do editoru,
    ale `PageEditorPage` ten param zahazovalo (dead param). Doplněno: editor
    `?slug=` přečte a přes `slugToTitle` předvyplní pole NÁZEV (slug se z názvu
    auto-generuje zpět). Diakritiku slug nenese → název bez háčků, uživatel doladí.
- [ ] AKJ banner na stránkách s AKJ requirement, theme-aware
- [ ] Favorite hvězda toggle s optimistic update
- [ ] Breadcrumbs 4-level, klikatelné kromě posledního
- [ ] Broken-link detekce funguje na interní odkazy
- [ ] Lightbox modal pro Galerie (ESC, šipky, klik mimo)
- [ ] Rodokmen zoom 0.25–5× pan/zoom
- [ ] Edit tlačítko jen pro PomocnyPJ+
- [ ] Mobil: sidebar collapsible, lightbox swipe-able
- [ ] mobil-desktop audit po implementaci

### Rozšíření (7.1e–m)
- [ ] **7.1e** Sticky AutoTOC drží pozici při scrollu; aktivní heading se highlightuje; `?section=` deeplink funguje
- [ ] **7.1f** Klik na obrázek v obsahu otevře lightbox; prev/next mezi obrázky v page
- [ ] **7.1g** Read-time estimate zobrazen pod titulem (kromě Galerie)
- [ ] **7.1h** Výběr textu (>5 znaků) zobrazí popup s Kopírovat/Anchor; mizí mimo selekci
- [ ] **7.1i** Floating dock vpravo dole; auto-hide na scroll down; ⭐/⬆/✏️/🔗 fungují
- [ ] **7.1j** `Cmd/Ctrl+K` otevře paletu; fuzzy match stránek + section anchorů; Enter naviguje
- [ ] **7.1k** Klávesy `e`/`f`/`Esc`/`?`/`g s` fungují; `?` zobrazí help overlay; disabled v inputech
- [ ] **7.1l** BE endpoint `GET /worlds/:worldId/pages/:slug/backlinks` vrací filtered list; FE panel zobrazen jen pokud N>0
- [ ] **7.1m** `Ctrl/Cmd+P` zobrazí printable verzi (UI skryto, sekce rozbalené, table pod obsahem)

## 10 — Otevřené otázky / TBD — VYŘEŠENO 2026-05-21

1. ✅ ~~`useResolveWorldId(worldSlug)`~~ → **`useWorldContext()`** ([src/features/world/context/WorldContext.tsx](../../../src/features/world/context/WorldContext.tsx)) poskytuje `worldId`, `worldSlug`, `world`, `isPJ`, `userRole`, `character`. Žádný nový hook.
2. ✅ ~~`favoritePageSlugs` zdroj~~ → **`useWorldContext().world?.favoritePageSlugs`**. Refetch po toggle = invalidate `['worlds', 'slug', worldSlug]` v React Query.
3. ✅ ~~AutoTOC `id` na nadpisy~~ → **už existuje** v [src/features/ikaros/components/AutoTOC.tsx](../../../src/features/ikaros/components/AutoTOC.tsx) — query `[data-article-content]` injektuje id, IntersectionObserver dělá scroll-spy, mobile accordion = OK. Stačí PageViewer container označit `data-article-content`.
4. ✅ ~~Theme tokens~~ → **existující sada**: `var(--accent)`, `var(--accent-bright)`, `var(--accent-soft)`, `var(--theme-shadow)`, `var(--bg-overlay)`. Použijeme.
5. ⚠️ **Seznam — `menu` schema** — současné `{label, href, order}` stačí pro left-nav variantu. **Rozhodnuto:** používáme tak jak je. Pokud 7.2 editor bude chtít rich items, BE migrace tehdy.
6. ⚠️ **AutoTOC URL deeplink** — AutoTOC dnes používá `history.pushState(null, '', '#${id}')` (hash). Náš spec chce `?section=`. **Rozhodnuto:** ponechat hash (`#section-id`) — je standardnější, browser back/forward funguje out-of-box, nezáleží mezi hash a query. Spec § 7.1e updatován.
7. ⚠️ **AutoTOC selector kolize** — Articles používá stejný `[data-article-content]`. Na jedné page existuje vždy jen jeden article/wiki container, takže kolize nevzniká. OK reuse.

## 11 — Dluhy odložené

| Dluh | Důvod odložení | Cíl |
|---|---|---|
| **PedigreeTree** (pravý generovaný strom z dat) | Uživatel preferuje zoomable image | dluh, low priority |
| **`isWoodWide` ikonika** | 🌐 emoji jako placeholder | custom SVG v rámci napoveda/UX polish |
| **Per-slug AKJ pre-filter** linků | Drahé, 50+ requests | optimalizace pokud uživatelé požádají |
| **AKJ creation flow** (modal + auto-create meta page + BE endpoint) | Patří do 7.2 editoru | 7.2 |
| **Správa videí v Obrazovka** (add/edit/remove) | Patří do editoru | 7.2 |

## 12 — Závislosti a návaznosti

- **3.2 (Články)** — reuse `RichTextEditor`, `AutoTOC` → potvrzeno hotové
- **5.x (Svět)** — `useWorld`, theme tokens, WorldLayout → použito existující
- **7.2** — sdílí typy a API hooky, odkazuje na editor route
  - **AKJ creation flow** se implementuje zde (modal v access-panelu editoru, auto-create `akj-<key>` Page, BE endpoint `POST /worlds/:worldId/settings/akj-types`)
  - **Správa videí Obrazovka** (CRUD videí) také zde
  - 7.1 banner už umí kliknout na meta stránku — jakmile 7.2 ji vytvoří, automaticky funguje
- **7.3** — link z breadcrumbs „Stránky"
- **fáze 8** — odložené typy (PC/NPC/Deník/Finance/Batoh) tam migrují s vlastním modulem

---

**Stav workflow:** brainstorming hotový, **čekám na schválení této spec**. Poté: implementační plán → potvrzení → kód.
