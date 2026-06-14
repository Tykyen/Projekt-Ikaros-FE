# 04 — Obsah (hero/page/galerie/news/timeline/game-event/group)

> **Otázka:** Replace obrázku neorphanuje, kdo smí nahrávat „content" obrázky, uklidí se bloby při smazání entity?

**Stav: 🐛 hotovo** (sweep 2026-06-14) — **největší orphan povrch potvrzen**. **UM-03** 🟠 replace orphan napříč 5 entitami (pages/worlds/chat-group/world-news/game-events update nemaže starý blob; group `imageUrl:''` taky) + **UM-10** 🟠 content-image open + **UM-13** 🟡 dva hooky. `page.deleted` kryje jen delete entity, ne edit. Viz [registr](../upload-media-audit.md).

## Dotčené

- BE: `uploadContentImage`→`content` [`upload.service.ts:373`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L373) · `uploadImage`→`platform` [:365](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L365) · `page.deleted` handler [:537](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L537) · pages.service emit · ikaros-gallery.service
- FE: [`useUploadImage.ts`](../../src/shared/api/useUploadImage.ts) (shared) + `features/ikaros/api/useUploadImage.ts` (legacy) · [`HeroUploadCard.tsx`](../../src/features/world/pages/PageEditor/components/HeroUploadCard.tsx) · `GalleryUploadPage.tsx` · `GroupDialog.tsx` · `WorldNewsEditorModal.tsx` · `GameEventModal.tsx` · `TimelineEventModal.tsx` · `BasicInfoTab.tsx` (world hero)

## Hypotézy

- **K-UM4** 🟠 DL/OR — **replace** hero/world/group/news → starý blob orphan (auto publicId, PATCH jen přepíše `imageUrl` string). Galerie je výjimka (drží `publicId`).
- **K-UM10** 🟠 AU — `POST /upload/content-image` jen `JwtAuthGuard`, žádná entity vazba ani rate-limit → každý přihlášený hostuje 10 MB cokoliv (i SVG) na našem CDN
- **K-UM6** 🟡 CT — dva `useUploadImage` (`/content-image` vs `/image`)
- **K-UM14** 🟠 DL — group image „remove" = `imageUrl:''` → BE maže blob, nebo orphan?

## Co ověřit

- [ ] **replace orphan** napříč: hero (page), world.imageUrl, group.imageUrl, news image — PATCH path maže starý blob? (čekám ❌ → 🔴/🟠 nález na každém)
- [ ] `page.deleted` payload — posílá `imageUrl` + `galleryUrls`? pokrývá replace? (jen delete entity, ne edit)
- [ ] galleryImages[] — odebrání jednoho obrázku z pole při editu → blob? (`page.deleted` bere celé pole jen při smazání stránky)
- [ ] dva `useUploadImage` — sjednotit; kdo volá legacy `/upload/image` (Admin gate!) z FE bez admin práv → 403?
- [ ] group `imageUrl:''` → BE PATCH: detekuje změnu URL a maže starý blob? (`K-UM14`)
- [ ] news/timeline/game-event image cleanup při delete entity — emituje event? (cross-ref [cascade-delete](../cascade-delete-audit.md))
- [ ] AU `content-image` — přidat rate-limit / vazbu? nebo by-design (autor=hráč)? zvážit `RL` (`K-UM15`)
