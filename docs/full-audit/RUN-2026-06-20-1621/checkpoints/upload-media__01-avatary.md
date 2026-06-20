# upload-media / 01-avatary — checkpoint RUN-2026-06-20-1621

## Pokrytí

Přečteno HEAD (všechny soubory ručně, ne Explore shrnutí):

- BE: `upload.service.ts` (celý, 700+ řádků) — `uploadUserImage` L489-541, `deleteUserImage` L547-549, `assertMagicBytes` L85-93, `MAGIC_SIGNATURES` L60-79, `LIMIT_DIMENSION_TRANSFORM` L105-109, `handleAccountHardDeleted` L663-668, `extractCloudinaryPublicId` L557-565
- BE: `users.controller.ts` (celý) — avatar endpointy L84-146, throttle dekorátory přítomné/chybějící
- BE: `worlds.service.ts` L1353-1415 (`updateMemberCharacter`), L1976-2064 (character event listenery, UM-15 fix)
- BE: `characters.service.ts` L240-332 (create/update, event payloady bez imageUrl)
- FE: `AvatarUploader.tsx` (celý) — klientská validace, drag&drop, preview lifecycle
- FE: `useProfile.ts` (celý) — `useUploadAvatar`, `useDeleteAvatar`, `useUploadCharacterAvatar`, `useDeleteCharacterAvatar`
- FE: `UserAvatar.tsx` (celý) — fallback, tombstone deleted overlay
- Multer storage ověřen: `node -e` → MemoryStorage je default → `file.buffer` existuje

### Ověřené osy (DL, TV, AU, RL, CT)

| Osa | Co ověřeno | Výsledek |
|-----|-----------|---------|
| TV (MIME) | Whitelist bez SVG, magic-byte `assertMagicBytes` | ✅ čistý |
| TV (formát) | webp+crop transform, EXIF strip implicitní (webp conversion strips EXIF) | ✅ čistý |
| AU (IDOR) | `/users/me/*` — userId z JWT, ne z parametru | ✅ čistý |
| AU (self only) | `@CurrentUser() user` → `ikaros/users/${user.id}/avatar` | ✅ čistý |
| DL (orphan/overwrite) | `public_id:'main' overwrite:true` → nový upload přepíše bez orphanu | ✅ čistý |
| DL (delete) | `deleteUserImage` → `deleteImage('${folderPath}/main')` | ✅ čistý |
| DL (GDPR hard-delete) | `@OnEvent('user.deletion.hardDeleted')` maže avatar+character folder | ✅ čistý |
| DL (membership.avatarUrl) | UM-15 fix: `if (payload.imageUrl !== undefined) updates.avatarUrl` | viz nález níže |
| CT (FE↔BE limit) | FE 5 MB (`MAX_BYTES = 5 * 1024 * 1024`) = BE `fileSize: 5 * 1024 * 1024` | ✅ shodné |
| CT (storage) | multer bez storage = MemoryStorage → `file.buffer` přítomen | ✅ OK |
| RL (rate-limit) | Avatar endpointy NEMAJÍ `@Throttle` → globální 100/min/IP | viz nález níže |
| TR (fallback render) | `UserAvatar` onerror → `/defaults/avatars/<type>.webp` | ✅ čistý |
| TR (tombstone) | `deleted` prop → grayscale + páska + alt="Smazaný účet" | ✅ čistý |

## Dosažená L vs cílová L

- **Dosaženo: L3** (plná statická analýza + cross-layer ověření FE↔BE limitů, storage, MIME, guard)
- Cílová L pro statiku: L3 ✅
- L4 (IDOR live test) a L5 (Cloudinary probe, overwrite skutečně neprodukuje orphan) → **PROOF-REQUEST**

## Nálezy

### UM-RUN-01 — [RL] Avatar upload bez vlastního rate-limitu · 🆕

**Kde:** `backend/src/modules/users/users.controller.ts:84-146`

Endpointy `POST /users/me/avatar`, `DELETE /users/me/avatar`, `POST /users/me/character/avatar`, `DELETE /users/me/character/avatar` nemají `@Throttle` dekorátor. Padají pod globální default 100 req/min/IP.

Srovnání: `/upload`, `/upload/image`, `/upload/content-image` mají vlastní `@Throttle({ default: { ttl: 60_000, limit: 20 } })`.

**Dopad:** 🟡 mírný. Avatar `overwrite:main` = každý upload přepíše ten předchozí (ne orphan spam). Ale 100 multipartových requestů/min/IP přes Cloudinary = DoS vector na Cloudinary rate-limity (10 req/s volný tier). Méně kritické než content-image, protože avatar upload zahrnuje Cloudinary round-trip (přirozené zpomalení), ale mezera proti ostatním upload endpointům je systematická.

**Návrh:** přidat `@Throttle({ default: { ttl: 60_000, limit: 10 } })` na všechny 4 avatar endpointy.

**L2 · 🆕**

---

### UM-RUN-02 — [DL/CT] membership.avatarUrl se NIKDY neaktualizuje po změně User.characterAvatarUrl · ♻️ (upřesnění UM-15)

**Kde:** `backend/src/modules/users/users.controller.ts:130-135` + `backend/src/modules/worlds/worlds.service.ts:1323-1331` + `backend/src/modules/characters/characters.service.ts:323-330`

Tok:
1. Uživatel nahraje nový avatar postavy přes `POST /users/me/character/avatar` → `User.characterAvatarUrl` se aktualizuje.
2. `character.updated` event se NEemituje (avatar je na User, ne na Character).
3. `membership.avatarUrl` (snapshot v každém světě) se NEaktualizuje → chat persona zobrazuje starý obrázek.

UM-15 fix (worlds.service.ts:1991-1996) řeší jen případ, kdy `character.updated`/`character.created`/`character.converted` event NEOBSAHUJE `imageUrl` → nevynuluje snapshot. Ale samotná **propagace nové hodnoty z `User.characterAvatarUrl` do `membership.avatarUrl`** chybí.

`membership.avatarUrl` se nastavuje výhradně při:
- PJ přiřadí postavu přes `PATCH /:worldId/members/:membershipId/character` s explicitním `dto.avatarUrl`
- `character.deleted` → `clearCharacter` (unset)

Scénář: Uživatel si změní avatar postavy (Rozcestí) → starý avatar zůstane ve všech světech jako `membership.avatarUrl` → broken/zastaralý obrázek v chat personě, dokud PJ ručně znovu nepřiřadí postavu.

**Dopad:** 🟡 UX bug (stale avatar v chatu), ne bezpečnostní.

**Návrh:** při `POST /users/me/character/avatar` emitovat event (nebo přímo volat) `membershipRepo.updateAvatarUrlForUser(userId, url)` přes všechny aktivní membership záznamy kde `characterPath != null`.

**L2 · ♻️** (hypotéza UM-15 potvrzena jako aktivní bug, upřesnění scopu)

---

## PROOF-REQUEST

### PR-01 — L4: IDOR live test avatar za cizí userId

**Proč:** Controller předává `user.id` z JWT do folder path. Staticky vidíme, že parametr nepřijímá userId z URL. Ale ověřit živě: zkusit `POST /users/me/avatar` s JWT jiného uživatele → ověřit, že folder `ikaros/users/<útočník>/avatar`, ne `ikaros/users/<cíl>/avatar`.

**Jak:** Vytvořit 2 test JWT, nahrát přes user A, ověřit na Cloudinary, že URL odpovídá A, ne B. Nebo unit test mockující `user.id`.

**Blokuje:** L4 (anti-nález K-UM13 z 2026-06-14 platí, ale není pro avatary explicitní test).

---

### PR-02 — L5: Cloudinary overwrite skutečně neprodukuje orphan při změně formátu

**Proč:** `overwrite:true, public_id:'main', format:'webp'` — Cloudinary by měl zachovat stejné public_id. Ale pokud Cloudinary interně změní verzi assetu nebo přidá suffix, starý asset by mohl zůstat. Staticky nelze ověřit.

**Jak:** Nahrát 2× různé soubory na stejné public_id, zkontrolovat Cloudinary Admin API — kolik assetů existuje pod `ikaros/users/<id>/avatar/main`.

**Blokuje:** L5 (nutný přístup k Cloudinary admin API / sandbox účet).
