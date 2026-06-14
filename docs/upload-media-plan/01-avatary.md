# 01 — Avatary (user + character)

> **Otázka:** Nahraje se jen obrázek, přepíše se starý bez orphanu, smí to jen vlastník, uklidí se při smazání účtu/postavy?

**Stav: ✅ čistý** (sweep 2026-06-14) — avatar pipeline bezpečná (webp+EXIF strip, `overwrite:main` bez orphanu, bez svg, IDOR self z JWT). Zbývá **UM-15** 🟡 hypotéza (dangling `membership.avatarUrl` po změně/delete `User.characterAvatarUrl` — doověřit `worlds.service.updateMemberCharacter`).

## Dotčené

- BE: `uploadUserImage` [`upload.service.ts:383-434`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L383) · `deleteUserImage` [:440](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L440) · users.controller `POST/DELETE /users/me/avatar` + `/character/avatar`
- FE: [`AvatarUploader.tsx`](../../src/features/profile/components/AvatarUploader/AvatarUploader.tsx) · `ProfileHeader.tsx` · `useProfile.ts` (`useUploadAvatar`/`useDeleteAvatar`) · [`UserAvatar.tsx`](../../src/shared/ui/UserAvatar/UserAvatar.tsx)

## Hypotézy

- žádná zdejší (avatar je z reconu **čistý** — viz pozitiva). Cílem oblasti je **potvrdit** anti-nálezy a najít okrajové případy.

## Co ověřit

- [ ] `overwrite:main` opravdu = 0 orphanů i při změně formátu (webp→webp vždy? jiná přípona = jiný publicId?)
- [ ] **character avatar shared publicId** — `ikaros/users/<id>/character/main` je JEDEN per user. Když má user postavu ve 2 světech, sdílí avatar? Kde žije per-membership `avatarUrl` vs tenhle `main`? (potenciální `DL`/`CT` nález)
- [ ] AU: jde nahrát avatar „za" jiného uživatele? (`/users/me/*` = self z JWT, ověřit M-IDOR)
- [ ] TV: avatar whitelist bez SVG potvrzen — ověřit, že FE `accept="image/*"` neobejde BE (BE je brána, OK)
- [ ] FE↔BE limit: FE 5 MB ([AvatarUploader.tsx:7](../../src/features/profile/components/AvatarUploader/AvatarUploader.tsx#L7)) vs BE? users.controller `limits.fileSize` (VERIFY shoda)
- [ ] DELETE avatar → `deleteUserImage` smaže `main`; co `avatarUrl` v entitě/membershipech (dangling)?
- [ ] `UserAvatar` fallback/deleted tombstone render — žádný leak smazaného obrázku
