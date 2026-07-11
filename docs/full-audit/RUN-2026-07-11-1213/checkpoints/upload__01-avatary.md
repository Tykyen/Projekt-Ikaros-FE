# Checkpoint — upload-media / 01-avatary

**Oblast:** `docs/upload-media-plan/01-avatary.md` (user + character avatar, 5 MB, `public_id:main` overwrite)
**Styl:** upload-media (registr `docs/upload-media-audit.md`, prefix `UM-`; RUN `UM-RUN`)
**Datum:** 2026-07-11
**Dosažená L:** L3 (guard/IDOR/whitelist/overwrite + membership propagace ověřeny čtením). M-IDOR runtime NEspuštěn.
**Cílová L:** L3.

Přečteno: `users.controller.ts:97-161` (avatar/char-avatar POST+DELETE), `upload.service.ts:610-670` (`uploadUserImage`/`deleteUserImage`), `worlds.service.ts` avatarUrl/characterAvatarUrl (grep + `:2272-2344` onCharacterCreated/updateMemberCharacter/removed).

---

## Verdikt: ✅ oblast čistá, UM-15 opraveno

Avatar pipeline zůstává bezpečná a IDOR-čistá; jediná otevřená hypotéza UM-15 (dangling `membership.avatarUrl`) je **opravena**.

## Stav dřívějších oprav / pozitiv (regrese-check — DRŽÍ)

- **IDOR čistý:** `/users/me/avatar` i `/users/me/character/avatar` berou `user.id` z JWT (`@CurrentUser`), folder `ikaros/users/${user.id}/...` — nelze nahrát za cizí účet. (users.controller:114-118/145-149)
- **Overwrite bez orphanu:** `uploadUserImage:635-637` `public_id:'main', overwrite:true, format:'webp'` → nový upload přepíše starý, **0 orphanů** i při změně přípony (vždy webp). (anti-nález potvrzen)
- **EXIF strip:** avatar re-encode `webp + crop:fill + gravity:auto` (`:638-641`) strhne EXIF/GPS — bez `strip_profile` potřeby.
- **Whitelist bez SVG:** `allowedImageTypes` (jpeg/png/gif/webp) `:615-620` + `assertMagicBytes:626`.
- **Delete cleanup:** `deleteUserImage` maže `<folder>/main`; `@OnEvent('user.deletion.hardDeleted')` (upload:795) maže avatar+character folder; DELETE endpoint nuluje `avatarUrl`/`characterAvatarUrl` v User.
- **FE↔BE limit shodný:** BE 5 MB (`users.controller:102/133`) = FE 5 MB. Bez driftu.

### UM-15 (dangling membership.avatarUrl) — ✅ OPRAVENO
- **Kde:** `worlds.service.ts:2272-2322` (onCharacterCreated/updateMemberCharacter) — `avatarUrl` se do membership zapisuje **jen když `payload.imageUrl !== undefined`** (komentář UM-15: „bezpodmínečný zápis vynuloval snapshot membership.avatarUrl → broken image").
- **Delete propagace:** `:2336-2344` — při odebrání postavy sbírá `member.avatarUrl` → emit `character.avatars.removed` → upload listener uklidí Cloudinary bloby.
- **Verdikt:** write-path drift uzavřen; snapshot membership.avatarUrl se už nevynuluje omylem. L3.

---

## Nové nálezy (🆕)

Žádný elevovaný. Pouze drobnost níže.

## Drobnost / dluh (bez elevace)

- **Avatar upload bez per-route `@Throttle`** — `users.controller:99/130` POST avatar nemá `@Throttle` (jen globální 100/min/IP). Konzistentní s vědomým rozhodnutím UM-10 (throttle scoped na `/upload*`), ploška je `/users/me/*` JWT-vázaná (spam vázaný na účet, ne anonym) + `overwrite:main` (nový avatar přepíše → žádný storage nárůst per uživatel). 🟡 dluh, neelevovat.
- **Character avatar shared `main` per user:** `ikaros/users/<id>/character/main` je JEDEN blob per uživatel (ne per-svět). Per-svět avatar žije v `membership.avatarUrl` (jiný snapshot, řešen UM-15). `characterAvatarUrl` v User = globální default. Dvě různá pole, konzistentní — ne nález.
