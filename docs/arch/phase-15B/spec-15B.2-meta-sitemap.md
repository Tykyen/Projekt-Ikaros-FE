# Spec 15B.2 — Meta tagy, title, sitemap, robots, canonical, breadcrumbs

**Stav:** ✅ IMPLEMENTOVÁNO 2026-06-22 (FE+BE kód hotový, testy zelené; **čeká deploy + BE restart**) · **Fáze:** 15B (H2 Objevitelnost / SEO) · **Roadmap:** [15B.2](../../roadmap2.md) [H2-02] · **Navazuje:** [15B.1 prerender](spec-15B.1-prerender.md) (sidecar sebere hotový DOM vč. meta), veřejné routy, `GET /worlds|/articles|/galleries` · **Připravuje:** 15B.3 (JSON-LD — breadcrumbs data), 15B.6 (sociální sdílení — OG karty) · **Souvis.:** [auth-leak-policy], prod nginx 14.3, FRONTEND_URL (env)

**Cíl:** Každá veřejná stránka má **vlastní** `<title>`, popis, kanonickou adresu a sociální náhledovou kartu; vyhledávač dostane `robots.txt` (kam smí) a `sitemap.xml` (co existuje). Bez tohohle 15B.1 prerenderuje obsah, ale všechny stránky vypadají pro Google i pro sdílení jako jedno boilerplate „Projekt Ikaros".

---

## 0. Rozhodnutí z brainstormingu (2026-06-22)

| # | rozhodnutí | volba | proč |
|---|---|---|---|
| R1 | **Injektor meta** | **nativní React 19.2** (`<title>`/`<meta>`/`<link>` hoisting), NE `react-helmet-async` | React 19 hoistuje a dedupuje meta z komponent do `<head>` sám; helmet = závislost navíc s peer-deps třením na React 19. Sdílená komponenta `<Seo>` jako tenký wrapper. |
| R2 | **robots.txt** | **statický `public/robots.txt`** | neměnný obsah; whitelist konzistentní s 15B.1 prerender. |
| R3 | **sitemap.xml** | **BE endpoint `GET /sitemap.xml`** (nový modul `seo`), NE statický soubor | dynamický obsah (světy/články/galerie) se mění bez redeploye; BE je jediný leak-safe zdroj „co je veřejné" → žádná duplikace public-logiky na FE. |
| R4 | **breadcrumbs** | **vizuální drobečky teď**, JSON-LD `BreadcrumbList` až 15B.3 | UI hodnota hned; strukturovaná data patří do 15B.3 (drží kroky oddělené). |
| R5 | **OG/Twitter** | **základ teď** (`og:*` + `twitter:card`), default brand `og:image`, per-entita obrázek kde existuje | per-svět generovaná OG karta = otevřená otázka 15B.6, ne teď. |
| R6 | **canonical** | **`window.location.origin` + pathname bez query** | jedna kanonická adresa na stránku; filtry (`?filter=public`) se neindexují jako duplikáty. Origin z runtime → bez FE env. |
| R7 | **noindex** | per-page přes `<Seo noindex>` na neveřejných/duplicitních stránkách | belt-and-suspenders k robots.txt + tomu, že member routy nejsou v sitemap ani prerenderované. |

**Trade-off (R3):** sitemap jako BE endpoint = část kroku je BE práce (nový modul `seo`). Vědomě přijato kvůli leak-safe a dynamice; statický FE sitemap by pokryl jen ~8 statických rout a duplikoval public-filtr.

📚 **canonical** = `<link rel="canonical">` říká vyhledávači „tohle je oficiální adresa téhle stránky" — sloučí varianty (s filtrem, s/bez lomítka) do jedné, aby se netříštil ranking.

---

## 1. Architektura — tři vrstvy

```
veřejná stránka (SPA)                 statické                 BE
┌─────────────────────────┐    ┌──────────────────┐   ┌────────────────────┐
│ <Seo title desc og .../>│    │ public/robots.txt│   │ GET /sitemap.xml   │
│ React 19 hoist → <head> │    │ (vrátný pro boty)│   │ (modul seo)        │
│ prerender (15B.1) sebere│    │ + odkaz Sitemap  │   │ public světy/      │
│ hotový DOM s meta       │    └──────────────────┘   │ články/galerie     │
└─────────────────────────┘                           └────────────────────┘
        ▲ člověk i bot vidí správný title/popis/OG          ▲ nginx: /sitemap.xml → BE
```

- **Vrstva A (meta v SPA):** komponenta `<Seo>` v každé veřejné stránce nastaví title/description/canonical/OG/robots. React 19 je vyzvedne do `<head>`. Prerender (15B.1) počká na `__PRERENDER_READY__` → bot dostane HTML už s meta.
- **Vrstva B (robots.txt):** statický soubor v `public/`, servíruje nginx přímo. Odkazuje na sitemap.
- **Vrstva C (sitemap.xml):** BE endpoint, nginx přidá `location = /sitemap.xml` → proxy na BE. BE složí XML jen z veřejných entit.

---

## 2. Vrstva A — komponenta `<Seo>` + per-page meta

### 2.1 Komponenta `src/shared/seo/Seo.tsx`

Props (vše volitelné kromě `title`):

```
title: string            // → <title>{title} | Ikaros</title>  (homepage výjimka, viz 2.3)
description?: string      // → <meta name="description"> + og:description + twitter:description
canonicalPath?: string   // default = location.pathname; → <link rel="canonical" origin+path>
image?: string           // absolutní URL; default = brand /icons/icon-512.png; → og:image + twitter:image
type?: 'website'|'article'|'profile'  // og:type, default 'website'
noindex?: boolean        // true → <meta name="robots" content="noindex,follow">
```

Vždy emituje: `og:title`, `og:description`, `og:url` (=canonical), `og:type`, `og:image`, `og:site_name=Ikaros`, `og:locale=cs_CZ`, `twitter:card=summary_large_image`. Description se ořízne na ~160 znaků (plain text, HTML strip pro článek/galerii).

⚠️ **Description z TipTap HTML** (článek `content`, svět `description`) → strip tagů + collapse whitespace + truncate. Sdílený helper `metaDescription(html, max)`.

### 2.2 Title template

`{stránka} | Ikaros`. Homepage výjimka: `Ikaros — online platforma pro RPG světy a vyprávění` (brand, bez sufixu).

### 2.3 Per-page mapa (veřejné routy)

| routa | title | description | type | image | index? |
|---|---|---|---|---|---|
| `/` | *(brand, viz 2.2)* | claim platformy | website | brand | ✅ |
| `/ikaros/vesmiry` | `Veřejné světy` | „Procházej veřejné RPG světy…" | website | brand | ✅ |
| `/ikaros/clanky` | `Články` | statický popis sekce | website | brand | ✅ |
| `/ikaros/clanky/:id` | `{article.title}` | perex z `content` | **article** | `article.coverUrl` \|\| brand | ✅ jen `Published` |
| `/ikaros/galerie` | `Galerie` | statický | website | brand | ✅ |
| `/ikaros/galerie/:id` | `{gallery.title}` | `gallery.description`/strip | article | cover obrázek \|\| brand | ✅ jen `Published` |
| `/ikaros/napoveda` | `Nápověda` | statický | website | brand | ✅ |
| `/ikaros/novinky` | `Novinky` | statický | website | brand | ✅ |
| `/podminky` | `Podmínky užití` | statický | website | brand | ✅ |
| `/svet/:slug` | `{world.name}` | `world.description`/strip | website | `world.imageUrl` \|\| brand | ✅ public/open · ❌ jinak `noindex` |

**Neveřejné routy (auth/member):** žádný `<Seo>` měnící title NEBO `<Seo noindex>`. Nejsou v sitemap, nejsou prerenderované (15B.1) → fakticky neindexovatelné. `<title>` jim zůstane globální „Projekt Ikaros" (v `index.html`).

⚠️ **Leak-safe (R7):** `/svet/:slug` privátního světa → BE vrátí 404 (anonym), prerender nic nezíská. I kdyby přihlášený člen stránku otevřel, `<Seo>` u private světa nastaví `noindex`.

---

## 3. Vrstva B — `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /chat
Disallow: /admin
Disallow: /reset-password
Disallow: /email-verify
Disallow: /email-change
Disallow: /ikaros/profil
Disallow: /ikaros/posta
Disallow: /ikaros/diskuze
Disallow: /ikaros/oblibene
Disallow: /ikaros/akce
Disallow: /ikaros/uzivatele
Disallow: /ikaros/uzivatel

Sitemap: https://www.projekt-ikaros.com/sitemap.xml
```

- Member podstránky světa (`/svet/:slug/...`) NEblokujeme přes robots (rozbilo by to `Disallow: /svet/` i veřejný shell). Chrání je: mimo sitemap + neprerenderované + `noindex` z `<Seo>`.
- `Sitemap:` absolutní URL produkce.

---

## 4. Vrstva C — BE modul `seo` + `GET /sitemap.xml`

### 4.1 Endpoint

`GET /sitemap.xml` (public, bez auth) → `Content-Type: application/xml`. Obsah:

1. **Statické veřejné routy** (hardcoded): `/`, `/ikaros/vesmiry`, `/ikaros/clanky`, `/ikaros/galerie`, `/ikaros/napoveda`, `/ikaros/novinky`, `/podminky`.
2. **Veřejné světy** — `accessMode ∈ {public, open}` → `/svet/{slug}`, `lastmod = updatedAt`.
3. **Published články** → `/ikaros/clanky/{id}`, `lastmod = updatedAt`.
4. **Published galerie** → `/ikaros/galerie/{id}`, `lastmod = updatedAt`.

Base URL z `FRONTEND_URL` (env, už existuje). Každý `<url>`: `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>` (statické vyšší).

### 4.2 Leak-safe + výkon

- **Jediný zdroj „co je veřejné"** = stejné filtry jako veřejné list endpointy (public/open světy, Published obsah). Žádná privátní entita se do XML nedostane.
- **Cache** — endpoint cachovat (in-memory TTL ~1 h nebo `Cache-Control`), aby každý crawl netloukl DB.
- **Limit 50 000 URL / 50 MB** (norma sitemap). Při překročení → **sitemap index** (`/sitemap.xml` odkazuje na `/sitemap-worlds.xml` atd.). Zatím počty malé → jeden soubor; index = otevřená otázka §8.

### 4.3 nginx

`location = /sitemap.xml { proxy_pass http://backend; }` před SPA `try_files`. (robots.txt servíruje FE staticky.)

---

## 5. Vrstva D — breadcrumbs (vizuální)

Komponenta `src/shared/ui/Breadcrumbs/` na detailových veřejných stránkách:

| stránka | drobečky |
|---|---|
| `/ikaros/clanky/:id` | Domů › Články › *{title}* |
| `/ikaros/galerie/:id` | Domů › Galerie › *{title}* |
| `/svet/:slug` | Domů › Světy › *{name}* |

- Sémantické `<nav aria-label>`+`<ol>`, poslední položka `aria-current="page"` (bez odkazu).
- Data (pole `{label, href}`) vystavit tak, aby je 15B.3 přímo přemapovala na `BreadcrumbList` JSON-LD.
- Responsive: na mobilu zkrátit prostřední (např. `…`) nebo zalomit — ověřit `mobil-desktop`.

---

## 6. Bezpečnost / leak-safe (shrnutí)

1. Sitemap i meta čerpají **jen z veřejných** zdrojů (public/open světy, Published obsah). Privátní entita se nikam nepropíše.
2. Privátní `/svet/:slug` → BE 404 anonymovi → prerender prázdný; member view → `noindex`.
3. robots.txt drží boty mimo auth/admin/chat/citlivé tokenové routy.
4. canonical bez query → necachuje se token/filtr jako varianta URL.

---

## 7. Dotčené soubory (předběžně)

**FE — nové:**
- `src/shared/seo/Seo.tsx` + `metaDescription.ts` (strip+truncate helper) + test
- `src/shared/ui/Breadcrumbs/Breadcrumbs.tsx` + `.module.css` + test
- `public/robots.txt`

**FE — změna:** `<Seo>` do veřejných stránek (`HomePage`, `WorldsPage`, `ArticlesPage`, `ArticleDetailPage`, `GalleryPage`, `GalleryDetailPage`, `HelpPage`, `NovinkyPage`, `TermsPage`, public shell `/svet/:slug`); breadcrumbs do 3 detailů; `default.conf.template` (`location = /sitemap.xml`).

**BE — nové:** modul `seo` (`seo.controller.ts` `GET /sitemap.xml`, `seo.service.ts` skládá XML z worlds/articles/gallery query, cache).

**Beze změny:** SPA router, build, CSP hash, prerender sidecar (sebere meta z DOM automaticky).

---

## 8. Ověření

- `view-source` veřejné stránky → vlastní `<title>` + `<meta name=description>` + `<link rel=canonical>` + `og:*` (ne globální boilerplate).
- Sdílení odkazu světa do FB Sharing Debugger / Discordu → karta s obrázkem + titulkem + popisem.
- `curl https://.../robots.txt` → 200, obsahuje `Sitemap:`.
- `curl https://.../sitemap.xml` → validní XML, obsahuje veřejné světy/články, **NEobsahuje** privátní svět.
- `curl -A Googlebot https://.../svet/<private>` → žádný obsah, žádné meta privátního světa.
- Google Rich Results / Lighthouse SEO skóre.
- `mobil-desktop` na breadcrumbs.

---

## 9. Otevřené otázky / rizika

1. **Sitemap index** — kdy překlopit na rozdělené soubory? Zatím jeden; práh §4.2. Doladit, až počty porostou.
2. **changefreq/priority** — konkrétní hodnoty per typ (kosmetika, Google to bere jako nápovědu).
3. **Galerie cover** — které pole drží náhledový obrázek galerie (ověřit BE `IkarosGalleryItem` při impl.).
4. **Article `:id` vs slug** — články jdou přes `:id` (ne slug); URL v sitemap = `/ikaros/clanky/{id}`. SEO-friendly slug = případně později.
5. **Default OG image** — finální brand obrázek (logo 512 vs dedikovaná 1200×630 karta). Zatím `/icons/icon-512.png`, dedikovanou kartu lze přidat.

---

## 10. ❌ Mimo záběr 15B.2

- **Strukturovaná data (JSON-LD)** → 15B.3 (breadcrumbs jen připravíme datově).
- **Sociální sdílecí tlačítka** → 15B.6.
- **Analytics / měření návštěvnosti** (admin dashboard) → samostatný krok (viz poznámka v roadmapě), ne SEO.
- **Per-svět generovaný OG obrázek** → otevřená otázka 15B.6.
