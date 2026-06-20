# upload-media / 04-obsah — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem veškerý kód dotčený oblastí 04 (hero/page/galerie/news/timeline/game-event/group) + rozšíření na platformový obsah (ikaros-events / ikaros-news / ikaros-gallery / ikaros-articles) a settings (groupImages / pjChatPersona / pjPersonaAvatar / channel image).

Soubory přečteny:
- BE: `upload.service.ts`, `pages.service.ts`, `world-news.service.ts`, `game-events.service.ts`, `ikaros-news.service.ts`, `ikaros-events.service.ts`, `ikaros-gallery.service.ts`, `ikaros-articles.service.ts`, `timeline.service.ts`, `chat.service.ts` (updateGroup + updateChannel), `worlds.service.ts` (updateSettings + updateMyPjAvatar), `upload.controller.ts`
- FE: `useUploadImage.ts` (shared + ikaros legacy), `GalleryPanel.tsx`, `GalleryUploadPage.tsx`, `HeroUploadCard.tsx`, `IkarosEventModal.tsx`, `NewsFormModal.tsx`, `GroupColorEditor.tsx`, `PjChatPersonaEditor.tsx`, `MyPjAvatarEditor.tsx`, `ChannelDialog.tsx`, `NodeEditorForm.tsx`, `ArticleEditorPage.tsx`

## Dosažená L vs cílová L

Cílová: L3 (statická cross-layer verifikace). Dosaženo: **L3** (přečten FE upload trigger + BE service + upload.service handler; ověřen tok dat od upload hooku po event/cleanup).

## Nálezy

### Nové (🆕)

**UM-RUN-01** — `ikaros-events.service.ts` update, replace orphan 🟠
- Osa: DL/OR · L3
- Kde: `backend/src/modules/ikaros-events/ikaros-events.service.ts:95-127`
- Nález: `update()` přepíše `imageUrl` (řádek 106) bez předchozího `findById` a bez `media.orphaned` emitu. Delete handler (řádek 141-143) orphan řeší, update ne.
- Dopad: každá editace ikaros akce s výměnou/odebráním obrázku leakne starý Cloudinary blob navždy. Frekvence: Admin-only akce, ale každá změna obrázku = leak.
- Návrh: načíst existující před update (`this.repo.findById(id)`), porovnat `existing.imageUrl !== dto.imageUrl`, emit `media.orphaned`. Vzor viz `world-news.service.ts:172-179`.
- 🆕

**UM-RUN-02** — `ikaros-news.service.ts` update, replace orphan 🟠
- Osa: DL/OR · L3
- Kde: `backend/src/modules/ikaros-news/ikaros-news.service.ts:147-181`
- Nález: `update()` přepíše `imageUrl` (řádek 171) bez předchozího `findById` a bez `media.orphaned` emitu. Delete handler (řádek 259-261) orphan řeší, update ne.
- Dopad: každá editace ikaros novinky s výměnou/odebráním obrázku leakne blob. Frekvence: Admin-only content, ale každá změna obrázku = leak.
- Návrh: načíst existující před update, porovnat `existing.imageUrl !== dto.imageUrl`, emit `media.orphaned`. Vzor viz `world-news.service.ts:172-179`.
- 🆕

**UM-RUN-03** — `chat.service.ts updateChannel`, channel image orphan 🟡
- Osa: DL/OR · L3
- Kde: `backend/src/modules/chat/chat.service.ts:524-567`
- Nález: `updateChannel()` ukládá nové `imageUrl` (přes `channelRepo.update(channelId, dto)`, řádek 556) bez ověření starého `channel.imageUrl` a bez `media.orphaned` emitu. `deleteChannel()` (řádek 569-594) také nemaže channel image blob.
- Dopad: výměna nebo smazání ikonky konverzace leakne blob. Nízká frekvence (PJ mění ikony vzácně), ale leak je permanentní. Dopady jsou nižší než UM-RUN-01/02, protože channel image je volitelný feature.
- Návrh: v `updateChannel` zkontrolovat `channel.imageUrl !== dto.imageUrl` (channel je již načtený, řádek 529), emit `media.orphaned`; v `deleteChannel` emit orphan pro `channel.imageUrl`.
- 🆕

**UM-RUN-04** — `worlds.service.ts updateSettings`, groupImages + pjChatPersona orphan 🟡
- Osa: DL/OR · L3
- Kde: `backend/src/modules/worlds/worlds.service.ts:1000-1023`
- Nález: `updateSettings()` přepíše `groupImages` (znak skupiny) a `pjChatPersona.avatarUrl` jako součást settings upsert bez porovnání starých hodnot a bez `media.orphaned` emitu. Žádný handler ani `@OnEvent` pro tyto pole.
- Dopad: při přenastavení nebo odebrání znaku skupiny / persony avataru leakne starý Cloudinary blob. Frekvence nízká (PJ ladí skupiny), ale blob je permanentní orphan.
- Návrh: před upsert načíst existující settings (`settingsRepo.findByWorldId(worldId)`) a porovnat `groupImages[name]` + `pjChatPersona?.avatarUrl`; emit `media.orphaned` pro odlišné URL.
- 🆕

**UM-RUN-05** — `worlds.service.ts updateMyPjAvatar`, PJ persona avatar orphan 🟡
- Osa: DL/OR · L3
- Kde: `backend/src/modules/worlds/worlds.service.ts:1490-1519`
- Nález: `updateMyPjAvatar()` volá `membershipRepo.setPjPersonaAvatar(membership.id, avatarUrl)` bez porovnání starého `membership.pjPersonaAvatarUrl` a bez `media.orphaned` emitu.
- Dopad: PJ/PomocnyPJ nahradí svůj avatar → starý blob orphan. Self-service featura, frekvence střední.
- Návrh: načíst stávající `membership.pjPersonaAvatarUrl`, porovnat, emit `media.orphaned` pokud se lišilo.
- 🆕

### Opravené (re-verify ze zápisů 2026-06-14, stav HEAD)

Veškeré UM-03 nálezy pro `pages/worlds/chat-group/world-news/game-events` opraveny a ověřeny:
- `pages.service.ts:432-451` — orphaned emit pro hero replace + gallery item remove ✅
- `worlds.service.ts:495-513` — orphaned emit pro imageUrl + themeBackgroundUrl replace ✅
- `chat.service.ts:404-410` — orphaned emit pro group imageUrl replace ✅
- `world-news.service.ts:172-179` — orphaned emit pro news imageUrl replace ✅
- `game-events.service.ts:324-331` — orphaned emit pro game-event imageUrl replace ✅
- `timeline.service.ts:231-239` — orphaned emit pro timeline event imageUrl replace ✅
- `ikaros-gallery.service.ts` — image je immutable po nahrání (edit mění jen metadata), žádný orphan risk ✅
- `upload.service.ts:707-719` — `@OnEvent('media.orphaned')` handler přítomen, volá `deleteImageByUrl` ✅

### UM-13 (legacy hook) — stav potvrzen

`features/ikaros/api/useUploadImage.ts` volá `/upload/image` (Admin gate). Používají ho:
- `IkarosEventModal.tsx:39` → Ikaros platformová akce (Admin content) — gate odpovídá záměru ✅
- `NewsFormModal.tsx:56` → Ikaros platforma novinka (Admin content) — gate odpovídá záměru ✅

Záměr zachován: Admin-only content → Admin-gate endpoint. UM-13 stav 🐛 (FE drift) je platný dluh, ale netýká se bezpečnosti (BE gate to drží). Bez nového nálezu.

### Content-image endpoint (UM-10)

`/upload/content-image` má `@Throttle(20/min/IP)` ✅ (`upload.controller.ts:137`). Orphan risk: obrázky vložené do TipTap HTML (articles/pages rich-text/universe nodes) nemají žádnou vazbu na entitu — blob žije navždy i po smazání stránky/odstavce (by-design, není triviální fix). Toto bylo zaznamenáno jako reziduální dluh v UM-10.

### Galerie (ikaros-gallery) — bez nálezů

`ikaros-gallery.service.ts update()` nemění `imageUrl` (soubor po nahrání nelze vyměnit — FE `GalleryUploadPage` to explicitně zakazuje, řádek 152-154). Delete (řádek 278-280) volá `uploadService.deleteImage(item.publicId)` přímo — ✅ čistý cleanup.

## PROOF-REQUEST

Níže jmenované body nelze ověřit staticky (vyžadují živou infrastrukturu):

**PR-1 · L5 (M-ORPHAN):** Cloudinary Admin API sken `content/` folderu vs. DB reference z TipTap HTML. Ověřit, kolik blobů v `content/` nemá žádnou DB referenci (reziduál po smazaných/editovaných stránkách). Nutný Cloudinary API klíč + DB přístup.

**PR-2 · L5 (M-PROBE):** Ověřit, že `ikaros-events.service update` skutečně nevyvolá žádný cleanup starého blobu při změně `imageUrl` — mock upload → edit akce s jiným URL → Cloudinary Admin API check starého publicId.

**PR-3 · L4 (M-IDOR):** Ověřit, že FE `IkarosEventModal` / `NewsFormModal` (volají `/upload/image`) skutečně vrátí 403 pro non-Admin token — edge case: token s role=Hrac.
