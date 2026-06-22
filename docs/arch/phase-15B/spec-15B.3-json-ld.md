# Spec 15B.3 — Strukturovaná data (JSON-LD)

**Stav:** ✅ IMPLEMENTOVÁNO 2026-06-22 (FE kód hotový, testy 15/15 zelené, build prošel; **čeká deploy** — BE beze změny, restart netřeba) · **Fáze:** 15B (H2 Objevitelnost / SEO) · **Roadmap:** [15B.3](../../roadmap2.md) [H2-03] · **Navazuje:** [15B.2 meta/sitemap](spec-15B.2-meta-sitemap.md) (breadcrumbs data připravená `{label,href}`, `<Seo>`, `metaDescription`), [15B.1 prerender](spec-15B.1-prerender.md) (sebere `<script>` z DOM) · **Připravuje:** 15B.6 (sociální sdílení)

**Cíl:** Veřejné detailové stránky vystaví Googlu **strojově čitelná data** (`<script type="application/ld+json">`) o tom, co stránka je — článek, obrázek, svět, drobečková cesta. Díky tomu Google v SERPu zobrazí náhledový obrázek, datum a strukturovaný snippet → vyšší prokliky. Meta tagy z 15B.2 řeknou *jak* stránka vypadá při sdílení; JSON-LD řekne *čím* obsah je.

📚 **JSON-LD** = JSON podle slovníku [schema.org](https://schema.org), vložený do stránky jako `<script>`. Vyhledávač z něj čte typ obsahu explicitně, místo aby ho hádal z HTML.

---

## 0. Rozhodnutí z brainstormingu (2026-06-22)

| # | rozhodnutí | volba | proč |
|---|---|---|---|
| R1 | **Kam JSON-LD** | samostatná komponenta `<JsonLd data={…}>` (render `<script type="application/ld+json" dangerouslySetInnerHTML>`), NE rozšíření `<Seo>` | `<Seo>` zůstává o meta; buildery jsou čisté funkce → testovatelné bez DOM. JSON-LD nemusí být v `<head>` (Google parsuje celý DOM), takže není závislé na React 19 head-hoistingu. |
| R2 | **Schéma článku** | `Article` (ne `NewsArticle`/`BlogPosting`) | obecnější, méně striktní povinná pole; lore i blog spadnou pod jedno. |
| R3 | **Schéma galerie** | `ImageObject` | galerie = jeden obrázek s autorem + rozměry (`width`/`height` máme) → nejpřesnější typ, Google dá náhled díla. |
| R4 | **Schéma světa** | `CreativeWork` | svět nemá vlastní schema.org typ; `CreativeWork` je nejbližší (autorské dílo s názvem/popisem/obrázkem). |
| R5 | **Obrázek článku** | **1. `<img>` z TipTap `content`**, fallback brand logo | `IkarosArticle` nemá `coverUrl` (nesrovnalost 15B.2, viz §6); reálná ilustrace článku > generické logo. |
| R6 | **Homepage** | `WebSite` + `Organization` (brand, logo, název) | standardní brand uzel; pomáhá Google rozpoznat značku. **Bez** `SearchAction` (sitelinks searchbox) — nemáme veřejný search-URL endpoint, který Google vyžaduje (→ §8). |
| R7 | **Profily autorů** | **VYNECHÁNO** (žádný `Person`/`ProfilePage`) | `/ikaros/uzivatel/:id` je v robots `Disallow` + mimo sitemap → neindexuje se, JSON-LD by byl k ničemu; navíc by vystavil město/bio uživatele. Otevření = samostatné privacy rozhodnutí (→ §8). |
| R8 | **Diskuze** | **VYNECHÁNO** (žádný `DiscussionForumPosting`) | ověřeno: `/ikaros/diskuze` za `requireAuth` + BE `JwtAuthGuard` + robots `Disallow` + mimo sitemap → anonym nevidí, neindexovatelné. Roadmapa to předjímá. |
| R9 | **noindex stránky** | `<JsonLd>` se **nevykreslí** když `<Seo noindex>` (nepublikováno/private svět) | strukturovaná data jen pro stránky, co reálně chceme v indexu. Stejná podmínka jako noindex z 15B.2. |
| R10 | **URL v datech** | absolutní (`window.location.origin` + path), shodně s canonical z 15B.2 | schema.org `url`/`@id`/`item` musí být absolutní; origin z runtime → funguje i v prerenderu (Chromium je na produkční doméně). |

**Záběr proti roadmapě:** roadmapa jmenuje `Article`, `ProfilePage`, `BreadcrumbList`, `DiscussionForumPosting`. Reálný indexovatelný povrch = **Article + ImageObject (galerie) + CreativeWork (svět) + BreadcrumbList + WebSite/Organization**. `ProfilePage` (R7) a `DiscussionForumPosting` (R8) padají — cílový obsah není veřejně indexovatelný.

---

## 1. Architektura

```
veřejná detail stránka (SPA)
┌────────────────────────────────────────────┐
│ <Seo ... noindex={!indexable} />            │  ← meta (15B.2)
│ {indexable && <JsonLd data={articleJsonLd(article, origin)} />}
│   └─ <script type="application/ld+json">{…}</script>
│ {indexable && <JsonLd data={breadcrumbJsonLd(crumbs, origin)} />}
└────────────────────────────────────────────┘
        ▲ prerender (15B.1) sebere skript z hotového DOM → bot ho přečte
```

- **`<JsonLd>`** — tenká komponenta, jen serializuje `data` do `<script>`. Lze vykreslit víckrát na stránce (např. `Article` + `BreadcrumbList` jako dva uzly).
- **Buildery** — čisté funkce `(entita, origin) → object`. Žádný DOM, snadno testovatelné.
- **Gate `indexable`** — stejná podmínka jako `noindex` v `<Seo>` (R9): publikováno / veřejný svět. Když `false`, `<JsonLd>` se nevykreslí.

---

## 2. Komponenta `<JsonLd>`

`src/shared/seo/JsonLd.tsx`

```tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // dangerouslySetInnerHTML: React jinak může inline obsah <script> escapovat;
      // < / > v datech ošetříme proti </script> breakoutu.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
```

⚠️ **`</script>` breakout** — `serializeJsonLd` = `JSON.stringify(data).replace(/</g, '\\u003c')`. Bez toho by řetězec obsahující `</script>` v datech (název světa, popis) předčasně ukončil skript = XSS/rozbití. Povinné.

---

## 3. Buildery `src/shared/seo/jsonLd.ts`

Sdílené konstanty:

```
SITE_NAME = 'Ikaros'
BRAND_LOGO = '/icons/icon-512.png'   // absolutizuje se origin+path
absoluteUrl(origin, path)            // origin + path (bez query)
organizationNode(origin)             // { @type:'Organization', name, url:origin, logo: absoluteUrl(BRAND_LOGO) }
```

### 3.1 `articleJsonLd(article, origin)` → `Article`

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{title}",
  "description": "{metaDescription(content)}",
  "image": ["{firstImageSrc(content) || absoluteUrl(BRAND_LOGO)}"],
  "datePublished": "{publishedAtUtc || createdAtUtc}",
  "dateModified": "{updatedAtUtc}",
  "author": { "@type": "Person", "name": "{authorIsDeleted ? 'Smazaný účet' : authorName}" },
  "publisher": { organizationNode },
  "mainEntityOfPage": "{absoluteUrl(/ikaros/clanky/{id})}",
  "inLanguage": "cs"
}
```

- `firstImageSrc(html)` — nový helper: regex/parse 1. `<img src>` z TipTap HTML; absolutizuje relativní.
- `authorIsDeleted` → `'Smazaný účet'` (parita s render D-040).

### 3.2 `galleryJsonLd(item, origin)` → `ImageObject`

```json
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "name": "{title}",
  "description": "{description}",
  "contentUrl": "{imageUrl}",
  "width": {width}, "height": {height},
  "datePublished": "{publishedAtUtc || createdAtUtc}",
  "uploadDate": "{createdAtUtc}",
  "author": { "@type": "Person", "name": "{authorName}" },
  "inLanguage": "cs"
}
```

### 3.3 `worldJsonLd(world, origin)` → `CreativeWork`

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "{name}",
  "description": "{description}",
  "image": "{imageUrl}",                    // vynech klíč když chybí
  "url": "{absoluteUrl(/svet/{slug})}",
  "datePublished": "{createdAt}",
  "dateModified": "{updatedAt}",
  "creator": { "@type": "Person", "name": "{owner.username}" },   // jen když owner dostupný
  "genre": "{genre}",                       // vynech když chybí
  "inLanguage": "cs"
}
```

⚠️ Při impl. ověřit, že `useWorld(slug)` (GET `/worlds/slug/:slug`) vrací `owner`. Když ne → `creator` se vynechá (volitelné pole).

### 3.4 `breadcrumbJsonLd(items, origin)` → `BreadcrumbList`

Vstup = **stejné `Crumb[]`** (`{label, href?}`), které už `<Breadcrumbs>` dostává.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Domů", "item": "{absoluteUrl(/)}" },
    { "@type": "ListItem", "position": 2, "name": "Články", "item": "{absoluteUrl(/ikaros/clanky)}" },
    { "@type": "ListItem", "position": 3, "name": "{title}" }
  ]
}
```

- Položka bez `href` (poslední) → bez `item` (jen `name`).
- 💡 Aby se data nereplikovala, breadcrumb `items` definovat **jednou** v komponentě a předat současně do `<Breadcrumbs items>` i `breadcrumbJsonLd(items)`.

### 3.5 `siteJsonLd(origin)` → `WebSite` + `Organization`

Homepage vykreslí pole/graf dvou uzlů:

```json
[
  { "@context":"https://schema.org", "@type":"WebSite", "name":"Ikaros", "url":"{origin}", "inLanguage":"cs" },
  { "@context":"https://schema.org", "@type":"Organization", "name":"Ikaros", "url":"{origin}", "logo":"{absoluteUrl(BRAND_LOGO)}" }
]
```

(Vykreslíme jako dva `<JsonLd>`, nebo jeden s `@graph`. Volba při impl.)

---

## 4. Per-page integrace

| stránka | komponenta | uzly | gate |
|---|---|---|---|
| `/` | `HomePage` | `WebSite` + `Organization` | vždy |
| `/ikaros/clanky/:id` | `ArticleDetailPage` | `Article` + `BreadcrumbList` | `status === 'Published'` |
| `/ikaros/galerie/:id` | `GalleryDetailPage` | `ImageObject` + `BreadcrumbList` | `status === 'Published'` |
| `/svet/:slug` | `WorldDashboardPage` | `CreativeWork` + `BreadcrumbList` | `indexable` (public/open, shodně s `<Seo noindex>`) |

Vzor (ArticleDetailPage):

```tsx
const crumbs = [
  { label: 'Domů', href: '/' },
  { label: 'Články', href: '/ikaros/clanky' },
  { label: article.title },
];
const indexable = article.status === 'Published';
// ...
<Seo title={article.title} description={metaDescription(article.content)} type="article" noindex={!indexable} />
{indexable && <JsonLd data={articleJsonLd(article, window.location.origin)} />}
{indexable && <JsonLd data={breadcrumbJsonLd(crumbs, window.location.origin)} />}
<Breadcrumbs items={crumbs} />
```

---

## 5. Bezpečnost / leak-safe

1. JSON-LD jen na stránkách, co projdou `indexable` gate (R9) — žádná data nepublikovaného/privátního obsahu se nevypíšou.
2. `serializeJsonLd` escapuje `<` → žádný `</script>` breakout / HTML injection z uživatelského názvu/popisu.
3. Data čerpají z **týchž** entit, co už stránka veřejně renderuje — žádný nový datový kanál, žádné pole navíc nad rámec toho, co anonym vidí.
4. Profily a diskuze (osobní/neveřejný obsah) vynechány (R7/R8).

---

## 6. Nesrovnalost zděděná z 15B.2

`IkarosArticle` ([src/shared/types/index.ts:718](../../../src/shared/types/index.ts#L718)) **nemá `coverUrl`** — spec 15B.2 §2.3 přitom u OG image píše `article.coverUrl || brand`, takže OG image článku dříve **vždy** padal na brand. 15B.3 zavedl `firstImageSrc(content)` (R5) pro JSON-LD `Article.image`. ✅ **Vyřešeno hned (2026-06-22):** stejný helper napojen i na `<Seo image>` v `ArticleDetailPage` → OG/Twitter náhled článku i JSON-LD sdílí 1. obrázek z obsahu, fallback brand. (Dluh D-NEW-SEO-OG-IMG založen a týmž zátahem uzavřen.)

---

## 7. Dotčené soubory

**FE — nové (skutečnost):**
- `src/shared/seo/jsonLd.tsx` — buildery (`articleJsonLd`/`galleryJsonLd`/`worldJsonLd`/`breadcrumbJsonLd`/`siteJsonLd` + `absoluteUrl`/`organizationNode`/`firstImageSrc`) **i** komponenta `JsonLd` + `serializeJsonLd` v **jednom** souboru.
  ⚠️ Původní plán (oddělené `jsonLd.ts` + `JsonLd.tsx`) padl na **case-insensitive FS (Windows)**: basename se lišil jen casem, Vite resolvuje `.ts` před `.tsx` → `import './JsonLd'` spadl na špatný modul (`serializeJsonLd is not a function`). Sloučeno do `jsonLd.tsx`.
- `src/shared/seo/jsonLd.spec.ts` (15 testů: tvar, escaping, vynechaná volitelná pole, deleted author, fallback image, breadcrumb bez `item`)

**FE — změna:** `ArticleDetailPage`, `GalleryDetailPage`, `WorldDashboardPage`, `HomePage` (vložit `<JsonLd>` + sdílet `crumbs`).

**Beze změny:** `<Seo>`, `metaDescription`, `<Breadcrumbs>`, router, BE (sitemap se nemění), prerender (sebere `<script>` automaticky).

---

## 8. Ověření

- [Rich Results Test](https://search.google.com/test/rich-results) na článku/galerii/světu/homepage → validní, bez chyb/varování.
- `view-source` veřejné detail stránky → `<script type="application/ld+json">` s odpovídajícím typem; nepublikovaný/private → **žádný** skript.
- Název světa obsahující `</script>` nebo `<` → skript se nerozbije (escaping).
- Article s obrázkem v contentu → `image` ukazuje na ten obrázek; bez obrázku → brand logo.
- FE `npm run build` + `npm test` (buildery zelené).

---

## 9. Otevřené otázky / mimo záběr

1. **Sitelinks searchbox** (`WebSite` > `SearchAction`) — vyžaduje veřejný search-URL (`/search?q={q}`). Nemáme veřejné anon hledání → vynecháno; zvážit, až bude veřejný search.
2. **AggregateRating** — články/galerie mají `averageRating`+`ratings`. Google `Article` rating neukazuje (jen u Product/Recipe…), a hvězdičkový rich snippet má přísná pravidla → **vynecháno teď** (riziko manual action za „self-serving" rating). Případně později u jiného typu.
3. **Veřejné profily autorů** (`Person`/`ProfilePage`) — vyžaduje napřed otevřít profily indexaci (robots + sitemap) = privacy rozhodnutí. Mimo 15B.3 (R7).
4. **Diskuze** (`DiscussionForumPosting`) — neindexovatelné (R8). Padá definitivně.
5. ✅ **OG image sjednocení** — `firstImageSrc` napojen i na OG v `<Seo>` (ArticleDetailPage); nesrovnalost §6 vyřešena týmž zátahem.
