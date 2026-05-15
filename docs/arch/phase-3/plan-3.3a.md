# Plán 3.3a — BE rozšíření modulu `ikaros-gallery`

**Spec:** [spec-3.3.md](spec-3.3.md) · **Status:** schváleno · **Repo:** `Projekt-ikaros/backend`

Brownfield — modul `ikaros-gallery` existuje a je funkční. 3.3a ho **rozšiřuje** o kategorie, masonry-rozměry, stats, anon read a opravuje role + reject validaci.

## Kroky

### 1. Schema / interface / repository (C1–C3)
- `schemas/ikaros-gallery.schema.ts` — přidat `category` (default `'ostatni'`), `width` (0), `height` (0), `publicId` (`''`); index `category`.
- `interfaces/ikaros-gallery.interface.ts` — 4 nová pole do `IkarosGalleryItem`.
- `repositories/ikaros-gallery.repository.ts` — `toEntity` mapuje nová pole; nová metoda `countByCategory(key)`.
- `interfaces/ikaros-gallery-repository.interface.ts` — `countByCategory`.

### 2. UploadService (C2)
- `upload.service.ts` — `uploadImageToFolder` rozšířit návrat o `width`/`height` z Cloudinary `UploadApiResponse`. Dopad: `uploadGalleryImage` i `uploadImage` (typ návratu).

### 3. gallery-categories (C1) — uvnitř modulu `ikaros-gallery`
Zrcadlí `ikaros-categories` (article-categories):
- `schemas/gallery-category.schema.ts` — collection `gallery_categories`, pole `key/label/color/order/createdAtUtc`.
- `interfaces/gallery-category.interface.ts` + `gallery-categories-repository.interface.ts`.
- `repositories/gallery-categories.repository.ts` — Mongo CRUD.
- `dto/create-gallery-category.dto.ts`, `update-gallery-category.dto.ts`.
- `gallery-categories.service.ts` — `findAll/findByKey/existsByKey/create/update/delete` (delete blokuje, pokud kategorii používají obrázky → `repo.countByCategory`).
- `gallery-categories.controller.ts` — `GET /gallery-categories` (public) + admin CRUD.
- `gallery-categories.seed.ts` — `OnApplicationBootstrap`, 5 kategorií dle spec §4.2.

### 4. Gallery DTO
- `create-gallery-item.dto.ts` — přidat `category?` (slug regex, optional).
- `update-gallery-item.dto.ts` — přidat `category?`.
- `reject-gallery-item.dto.ts` — `reason` **povinný**, `@MinLength(10)` (C7).

### 5. Gallery service (C2,C3,C7,C8)
- `ADMIN_ROLES` — odebrat `PJ` → `[Superadmin, Admin, SpravceGalerie]` (C8).
- `create` — uložit `category` (validovat přes `GalleryCategoriesService.existsByKey`, fallback `'ostatni'`), `width/height/publicId` z uploadu.
- `update` — povolit změnu `category`.
- `delete` — po smazání záznamu zavolat Cloudinary destroy přes `publicId` (best-effort, chyba jen log).
- `reject` — `reason` nově povinný (signatura `string`).
- `findStats(authorId)` — nad `repo.countByAuthorAndStatus` + agregace ratings.

### 6. Gallery controller (C4,C5)
- `findAll`, `findById` → `OptionalJwtAuthGuard` + `RequestUser | undefined` (C5, anon read).
- `@Get('stats')` → `findStats` (JwtAuthGuard).
- write endpointy → `@UseGuards(JwtAuthGuard)` per-route + `@ApiBearerAuth()`.
- `FileInterceptor` limit 50 MB → **10 MB** (spec §13).
- ApiBody create — doplnit `category`.

### 7. Modul
- `ikaros-gallery.module.ts` — registrovat `gallery_categories` schema, `GalleryCategoriesService`, `GalleryCategoriesController`, repo provider, seed.

### 8. Testy
- Rozšířit `ikaros-gallery.service.spec.ts` + `ikaros-gallery.repository.spec.ts`.
- Nové: `gallery-categories.service.spec.ts`.
- Pokrýt: category validace, stats, anon read, reject povinný reason, PJ už nemá práva, Cloudinary destroy při delete, kategorie delete-in-use.

## Mimo 3.3a
`GalleryReviewProvider` → 3.3b. Cloudinary destroy: chybí dnes i u chatu po `chat.message.deleted` přes `OnEvent` — galerie volá `cloudinary.uploader.destroy` napřímo v UploadService (nová metoda `deleteImage(publicId)`).
