# Checkpoint — upload-media / 03-emotes

**Oblast:** `docs/upload-media-plan/03-emotes.md` (world + global emote, 512 KB, TOCTOU shortcode→orphan)
**Styl:** upload-media (registr `docs/upload-media-audit.md`, prefix `UM-`; RUN `UM-RUN`)
**Datum:** 2026-07-11
**Dosažená L:** L3 (celá emotes.service + controller + upload cesta ověřeny).
**Cílová L:** L3.

Přečteno: `emotes.service.ts` (318 ř., celý), `emotes.controller.ts` (grep endpointů + copy). Emote upload jde přes `/upload/content-image` (folder `content`, 10 MB, image bez svg, magic bytes, `c_limit`+`strip_profile`).

---

## Stav dřívějších oprav (regrese-check — DRŽÍ)

- **UM-04** ✅ (3 orphan cesty opraveny):
  - `deleteFromWorld:169-171` + `deleteGlobal:184-186` → emit `media.orphaned` s `emote.imageUrl`.
  - `applyUpdate:248-255` → při výměně obrázku (imageUrl změněn) emit `media.orphaned` se **starým** blobem.
- **UM-11** ✅ (TOCTOU orphan): `cleanupOrphanedImage:86-90` volán při limitu (`:99/:132`) i kolizi shortcode (`:107/:140`) v create/createGlobal → nahraný blob před 409 se uklidí.
- **Limity počtu:** `EMOTE_LIMIT_PER_WORLD=100`, `EMOTE_LIMIT_GLOBAL=200` (anti-spam/storage). Global create gated `assertGlobalCanManage` (Admin+); world create `assertWorldCanManage` (PomocnyPJ+).
- **BE validace typu:** enforcována na `/upload/content-image` (image bez svg + magic bytes). 512 KB / 128×128 je jen FE UX (`validateEmoteFile`), BE brána = 10 MB generic — vědomé (UM registr), ne díra.

---

## Nové nálezy (🆕)

### UM-RUN-03-01 — Emote `copy` sdílí `imageUrl` blob → delete/replace zdroje zabije obrázek kopie (osa OR/DL, ref-count gap)
- **Kde:** `emotes.service.ts:303-311` `copy` → `repo.create({ ..., imageId: emote.imageId, imageUrl: emote.imageUrl })` — kopie **nereferencuje vlastní blob**, sdílí Cloudinary asset se zdrojem. Endpoint `POST /emotes/:worldId/:id/copy` (controller:147, `targetWorldId`).
- **Řetěz:** copy emote A→svět B (sdílený blob) → `deleteFromWorld(A)` nebo `applyUpdate(A, nový obrázek)` → emit `media.orphaned` s tou URL → `upload.service.handleMediaOrphaned:844` `deleteImageByUrl` → `cloudinary.destroy` → blob pryč → **emote v světě B má broken image**.
- **Dopad:** 🟡 (OR/DL) — broken image u zkopírovaného emotu; vyžaduje copy→delete/replace sekvenci; ne security leak. Kořen: `media.orphaned` je bez ref-countingu (viz UM-RUN-00-03).
- **Návrh:** `copy` by měl re-uploadnout blob (vlastní `imageId`/`publicId`, jako avatar/gallery drží vlastní), nebo `handleMediaOrphaned` ověřit reference před destroy. Nízká priorita (feature `copy` je PJ nástroj, kolize okrajová).
- **L:** L3 (copy + delete + handler přečteny end-to-end). Klasifikace: 🆕.

---

## Prošlé / ověřené OK

- **Smazání světa → emote bloby:** `custom_emotes` je v `BLOB_COLLECTIONS` (`world-hard-delete.service` `custom_emotes:['imageUrl']`, viz cascade-delete checkpoint) → world hard-delete uklidí emote bloby. ✅
- **Shortcode kolize při update:** `applyUpdate:226-239` kontroluje kolizi ve stejném scope před zápisem. imageId/imageUrl párový invariant `:217-223`.
- **TYPE mina** `custom_emotes.worldId` (ObjectId vs string) — cascade match řešen v cascade-delete/db-integrity auditu, ne upload-media povrch.
