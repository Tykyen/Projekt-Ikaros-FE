# Spec 3.3 — Ikaros galerie (`/ikaros/galerie`)

**Status:** ✅ Schváleno (2026-05-15, PJ)
**Rozsah:** FE (3 stránky + lightbox + masonry + Zpracovat renderer) + BE (modul `ikaros-galleries`, provider, kategorie collection, upload endpoint) + samostatná sub-fáze 3.3x (TipTap Image extension)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (backend)
**Velikost:** velká — rozdělena do **5 sub-fází** (3.3a–e) + **3.3x**, každá vlastní plán + PR
**Autor:** PJ + Claude
**Datum:** 2026-05-15
**Souvisí:**
- [spec-3.2.md](spec-3.2.md) — články: vzor workflow, provider, renderer, kategorie collection, rating
- [spec-1.4.md](../phase-1/spec-1.4.md) — Zpracovat tab infra (`IPendingActionProvider`)
- Legacy ref: `C:\Matrix\Matrix` — `IkarosGalleryController.cs`, `IkarosGallery*.tsx` (funkční, ale primitivní — inspirace doplňková)

---

## 1. Cíl

Postavit **obrazovou galerii** na Ikaros platformě:

- **Přehled** (`/ikaros/galerie`) — masonry mřížka publikovaných obrázků, filtr kategorie, hledání, řazení, taby Přehled / Moje.
- **Detail** (`/ikaros/galerie/:id`) — samostatná URL obrázku (sdílení), hodnocení, popis, admin/autor akce.
- **Lightbox** — fullscreen prohlížeč nad mřížkou: klávesy ←/→/Esc, swipe na mobilu, cedulka + hvězdy v overlayi.
- **Upload** (`/ikaros/galerie/nahrat`, `/ikaros/galerie/:id/upravit`) — výběr souboru, náhled, název, popis, kategorie.
- **Schvalování** přes Zpracovat tab (1.4 architektura) — `GalleryReviewProvider` + FE renderer s thumbnailem.
- **Workflow:** Draft → Pending → Published / Rejected, rating 1–5★, autor nemůže hodnotit vlastní obrázek.
- **Dynamické kategorie** spravované adminem (DB collection, ne hardcoded enum) — shodný pattern jako články.

Vše funguje na 21 vizuálních skinech (skin-agnostic CSS tokens). Vizuální směr „Salon" je default; skiny smí tokeny override.

---

## 2. Kontext / motivace

- Roadmap 3.3 mluví o „Mřížka obrázků, `/nahrat` upload (Cloudinary), schvalovací workflow, pending typ `gallery_pending_review`". Roadmap píše „po vybudování Cloudinary infra" — **Cloudinary infra už existuje** (z 3.1b), blocker neplatí.
- Galerie = vizuální dvojče modulu Článků (3.2). Stejný workflow, stejný provider pattern, stejné kategorie. **Implementace přebírá architekturu článků 1:1**, mění se jen obsah (obraz místo HTML textu) a vizuální vrstva.
- Cíl: 3.3 bez nedodělků, ne MVP s dluhy.

---

## 3. Audit současného stavu

> **POZOR — brownfield.** BE modul `ikaros-gallery` **už existuje, je registrovaný v `app.module.ts` a funkční** (vč. testů `*.service.spec.ts`, `*.repository.spec.ts`). Vznikl dřívějším krokem feature-parity. 3.3a proto **rozšiřuje existující modul**, nevytváří nový.

### 3.1 BE — co modul `ikaros-gallery` UMÍ

- Endpoint prefix `/ikaros-gallery` (jednotné č.), collection `ikaros_gallery`.
- Workflow Draft→Pending→Published→Rejected, rating 1–5★, role gating, notifikace adminům interními zprávami.
- **Inline multipart upload** — soubor jde přímo v `POST /ikaros-gallery`, service volá `uploadService.uploadGalleryImage()` (folder `gallery`). Žádný dvoufázový upload, žádný dead code.
- Repository má `countByAuthorAndStatus()` — připravené pro stats, ale nevystavené.
- `PendingActionType.GalleryPendingReview` enum hodnota existuje (stub); `IPendingActionProvider` infra hotová.

### 3.2 BE — co modulu CHYBÍ (rozsah 3.3a–b)

| # | Chybí | Řešení |
|---|---|---|
| C1 | `category` pole + collection kategorií | 3.3a — schema pole `category`, `gallery_categories` collection + seed + endpointy |
| C2 | `width` / `height` pole | 3.3a — schema; `uploadGalleryImage()` rozšířit return o rozměry (Cloudinary je vrací, dnes zahazuje) |
| C3 | `publicId` pole | 3.3a — schema; `delete()` smaže i Cloudinary asset |
| C4 | `stats` endpoint | 3.3a — `GET /ikaros-gallery/stats` nad existující repo metodou |
| C5 | anon read | 3.3a — `findAll`/`findById` přes `OptionalJwtAuthGuard` |
| C6 | `GalleryReviewProvider` | 3.3b — pending-actions integrace |
| C7 | `reject` reason povinný min 10 znaků | 3.3a — DTO validace (dnes nepovinný) |
| C8 | `ADMIN_ROLES` obsahuje `PJ` | 3.3a — odebrat (galerie = platformový obsah, PJ je world-scoped) |

### 3.3 FE — co existuje

- Modul článků `src/features/ikaros/` — pages, `api/useArticles.ts`, `lib/articles.ts`, `components/ArticleReviewRenderer.tsx`.
- `PENDING_ACTION_RENDERERS` registry v `src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx`.
- `useUploadImage.ts` — hook na `POST /upload/image` (existuje, pro galerii nevyhovuje kvůli N2).
- Theme tokeny `_shared/tokens.css`, `_shared/prose-tokens.css`. Role-token `--role-spravce-galerie-bg: #a855f7` už existuje.

---

## 4. Datový model

### 4.1 Collection `ikaros_gallery` (rozšíření existující)

Existující pole zůstávají. 3.3a **přidává** 4 pole (`category`, `width`, `height`, `publicId`):

```
IkarosGalleryItem
  id            string
  title         string                       povinný, max 300 (stávající)
  description?  string                       max 2000, plain text (stávající)
  imageUrl      string                       Cloudinary secure_url (stávající)
  publicId      string        + NOVÉ          Cloudinary public_id (pro mazání)
  width         number        + NOVÉ          px — pro masonry aspect-ratio
  height        number        + NOVÉ          px
  category      string        + NOVÉ          slug, FK → gallery_categories.key, default 'ostatni'
  authorId / authorName / status / rejectReason?      (stávající)
  ratings / averageRating                             (stávající)
  createdAtUtc / updatedAtUtc / publishedAtUtc?        (stávající)
```

Stávající indexy `authorId` a `(status, createdAtUtc DESC)` zůstávají; 3.3a přidá index `category`.
Migrace starých dokumentů: `category` default `'ostatni'`, `width`/`height` 0 (FE fallback poměr 1:1).

### 4.2 Collection `gallery_categories`

Shodný tvar jako `article_categories`: `{ key, label, color, order }`. Admin CRUD. Seed 5 kategorií:

| key | label | návrh barvy |
|---|---|---|
| `fanart` | Fanart | #f06292 |
| `mapy` | Mapy a plány | #4db6ac |
| `postavy` | Postavy | #ff8a65 |
| `svety` | Světy a lokace | #64b5f6 |
| `ostatni` | Ostatní | #8b98a5 |

> Barvy jsou návrh — finální paleta v 3.3a, slug `ostatni` je fallback.

---

## 5. API — modul `ikaros-gallery` (existující prefix, jednotné č.)

Stávající endpointy (změny 3.3a vyznačeny):

```
GET    /ikaros-gallery              přehled Published (+Pending pro admina)   + anon (C5)
GET    /ikaros-gallery/my           vlastní obrázky (všechny statusy)
GET    /ikaros-gallery/pending      Pending — admin only
GET    /ikaros-gallery/stats        + NOVÝ — statistiky autora (C4)
GET    /ikaros-gallery/:id          detail                                   + anon (C5)
POST   /ikaros-gallery              create — INLINE multipart: file + title + description + category + submit?
PUT    /ikaros-gallery/:id          update metadat (title/description/category) — jen Draft/Rejected, autor
DELETE /ikaros-gallery/:id          autor + admin — + maže Cloudinary asset přes publicId (C3)
POST   /ikaros-gallery/:id/submit   Draft/Rejected → Pending
POST   /ikaros-gallery/:id/approve  admin only
POST   /ikaros-gallery/:id/reject   admin only, { reason } — + povinný min 10 znaků (C7)
POST   /ikaros-gallery/:id/rate     { stars: 1–5 }, autor nemůže

GET    /gallery-categories          + NOVÝ — seznam kategorií (anon)
       + admin CRUD na kategoriích (POST/PUT/DELETE, zrcadlí article-categories)
```

> 💡 **Upload je jednofázový (inline multipart).** `POST /ikaros-gallery` přijímá soubor i metadata v jednom requestu; service nahraje na Cloudinary a uloží záznam. Ponecháno beze změny (rozhodnutí 2026-05-15) — odlišné od dvoufázového uploadu novinek, ale funkční a jednodušší. `uploadGalleryImage()` se rozšíří o návrat `width`/`height` (C2).

Notifikace (submit/approve/reject) přes interní zprávy — zůstává. 3.3b navíc napojí pending-actions provider.

---

## 6. Role a oprávnění

Galerie je **platformový obsah** → jen globální role, **bez world-scoped PJ** (memory pravidlo).

- **Upload + vlastní obrázky:** každý přihlášený uživatel.
- **Schvalování / approve / reject / pending list:** `Superadmin`, `Admin`, `SpravceGalerie`.
- **Mazání:** autor (vlastní) + schvalovací role (jakýkoli).
- `GalleryReviewProvider.canHandle()` → `true` pro `[Superadmin, Admin, SpravceGalerie]`.

---

## 7. Pending actions integrace

- **BE:** `GalleryReviewProvider implements IPendingActionProvider<GalleryReviewListItem>`, `type = GalleryPendingReview`, registrace v `IkarosGalleryModule.onModuleInit()`.
- `GalleryReviewListItem`: `{ imageId, title, thumbnailUrl, category, authorId, authorName, submittedAt }`.
- **FE:** `GalleryReviewRenderer` (sloty Left/Mid/Actions) → registr `PENDING_ACTION_RENDERERS[GalleryPendingReview]`.
  - Left: thumbnail 48×48 (Cloudinary `w_96,h_96,c_fill`) + kategorie badge.
  - Mid: název (link na detail) + autor + čas.
  - Actions: „Schválit" + „Vrátit s poznámkou" (`RejectReasonModal`, reuse z 3.2).
- `GROUP_TITLES[GalleryPendingReview] = 'Obrázky ke schválení'`.

---

## 8. Vizuální směr „Salon"

Odkaz na salónní zavěšení obrazů — obraz dominuje, UI je tichý rám. Plný design audit viz frontend-design výstup; shrnutí:

- **Masonry** přes CSS `columns` — 2 (mobil ≤768) / 3 (tablet) / 4–5 (desktop). Žádná JS knihovna.
- **Wall label** — popisek pod obrázkem bez boxu: název / autor / kategorie. Drobné písmo, `letter-spacing`.
- **Hover** — `translateY(-4px)` + `--gal-lift-shadow` + `scale(1.02)` obrázku v `overflow:hidden` rámu.
- **Lightbox** — tmavé plátno `--gal-lightbox-bg`, obraz centrovaný s paspartou, šipky ←/→, cedulka + hvězdy dole.
- **Kategorie** — tiché obrysové štítky v barvě kategorie (ne vyplněné chips).

### 8.1 Nové tokeny (`_shared/`, theme-independent base)

```
--gal-frame-border    hairline okraj rámu        fallback var(--border)
--gal-label-fg        barva cedulky              fallback var(--text-muted)
--gal-lift-shadow     stín při hoveru
--gal-lightbox-bg     plátno lightboxu (~0.94 alfa)
--gal-cat-fanart / -mapy / -postavy / -svety / -ostatni
```

Reuse beze změn: `--sp-*`, `--radius-sm`, `--status-*`, `--star-gold`, `--role-spravce-galerie-bg`.

---

## 9. FE struktura

```
src/features/ikaros/
  pages/
    GalleryPage.tsx           přehled — masonry, taby, filtr, hledání, statistiky
    GalleryDetailPage.tsx     detail :id
    GalleryUploadPage.tsx     /nahrat + /:id/upravit
  components/
    GalleryGrid.tsx           masonry mřížka + karty
    GalleryCard.tsx           rám obrazu + wall label
    Lightbox.tsx              fullscreen overlay, klávesy, swipe
    GalleryReviewRenderer.tsx Zpracovat sloty
  api/
    useGallery.ts             React Query — CRUD (multipart create) + workflow + rate + stats
    useGalleryCategories.ts
  lib/
    gallery.ts                cloudinaryThumb(), filterImages(), statusLabel/Color, categoryStyle, timeAgo
```

`cloudinaryThumb(url, w, h?, mode)` — vkládá transformace (`w_400,c_fill,q_auto,f_auto`) do Cloudinary URL; thumbnaily v mřížce nestahují full-res.

Routing v `src/app/router.tsx` (IkarosLayout children):

```
ikaros/galerie               GalleryPage          veřejné
ikaros/galerie/nahrat        GalleryUploadPage    requireAuth
ikaros/galerie/:id/upravit   GalleryUploadPage    requireAuth
ikaros/galerie/:id           GalleryDetailPage    veřejné
```

> ⚠️ Pořadí rout: `/nahrat` musí být **před** `/:id`, jinak router matchne `nahrat` jako `:id`.

---

## 10. Sub-fáze

| Sub | Rozsah | PR |
|---|---|---|
| **3.3a** | BE — rozšířit modul `ikaros-gallery`: schema pole (C1–C3), `category` v DTO, `stats` endpoint (C4), anon read (C5), povinný reject reason (C7), odebrat PJ (C8); `gallery_categories` collection + seed + endpointy | BE |
| **3.3b** | BE — `GalleryReviewProvider` + registrace (C6); FE — `GalleryReviewRenderer` do registry, `RejectReasonModal` reuse | BE+FE |
| **3.3c** | FE — `GalleryPage` (masonry, taby, filtr, hledání, statistiky), `GalleryUploadPage`, routing, tokeny „Salon" | FE |
| **3.3d** | FE — `GalleryDetailPage` + `Lightbox` (klávesy, swipe, rating v overlayi) | FE |
| **3.3e** | Dluhový úklid, `napoveda` skill (nová stránka + role SpravceGalerie), `mobil-desktop` audit | FE |
| **3.3x** | TipTap `Image` extension pro `<RichTextEditor>` — potřebuje upload endpoint dostupný hráčům; využije článkový i galerijní editor | FE |

---

## 11. Testy

- **BE:** CRUD, workflow přechody, role gating, rating (autor nemůže), provider `canHandle`/`count`/`list`, upload endpoint MIME/velikost, kategorie CRUD. Cíl ~+40.
- **FE:** masonry render, filtr/hledání/řazení, lightbox klávesy + swipe, upload flow, renderer sloty, `cloudinaryThumb` helper. Cíl ~+30.

---

## 12. Mimo rozsah

- Komentáře k obrázkům → budoucí fáze (galerie zatím jen rating, jako články).
- Featured/Trending sekce → dluh, ne nedodělek 3.3.
- Hromadné schvalování → dluh (sdílet s `D-NEW-bulk-pending-articles`).
- Video v galerii → mimo 3.3 (jen `image/*`).

---

## 13. Rozhodnuto při schválení (2026-05-15)

1. ✅ Paleta barev kategorií §4.2 schválena beze změn.
2. ✅ Limit uploadu 10 MB (shodně s `/upload/image`).
3. ✅ Anonymní návštěvník vidí galerii read-only (shodně s články).
