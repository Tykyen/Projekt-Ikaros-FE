# Plán 3.3c — FE přehled galerie + upload

**Spec:** [spec-3.3.md](spec-3.3.md) §8–9 · **Repo:** `Projekt-ikaros-FE`

## Kroky

1. **Tokeny „Salon"** — `_shared/prose-tokens.css`: `--gal-frame-border`, `--gal-label-fg`, `--gal-lift-shadow`, `--gal-lightbox-bg`, `--gal-cat-*` (5 kategorií + `--gal-cat-current`).
2. **`GalleryCard.tsx`** + css — rám obrazu (`overflow:hidden`, hover lift), wall label (název/autor/kategorie), status badge u `isMine`. Klik → lightbox callback (3.3c: zatím link na detail; lightbox 3.3d).
3. **`GalleryGrid.tsx`** + css — masonry přes CSS `columns` (2/3/4–5 responsivně), `break-inside: avoid`.
4. **`GalleryPage.tsx`** + css — nahradí stub. Taby Přehled/Moje, toolbar (hledání debounce + sort), kategorie chips, `MyStatsWidget`. Vzor `ArticlesPage`.
5. **`GalleryUploadPage.tsx`** + css — `/nahrat` i `/:id/upravit`. File picker s náhledem, title/description/category, „Uložit koncept" / „Odeslat ke schválení". Multipart přes `useCreateGalleryImage`; edit přes `useUpdateGalleryImage`.
6. **Routing** — `router.tsx`: lazy `GalleryUploadPage`, routy `galerie/nahrat` + `galerie/:id/upravit` (`requireAuth`) **před** `galerie/:id`. Routa `:id` (detail) → 3.3d.
7. **Testy** — `gallery.spec.ts` (lib helpers), `GalleryPage` smoke.

## Mimo 3.3c
Lightbox + `GalleryDetailPage` → 3.3d.
