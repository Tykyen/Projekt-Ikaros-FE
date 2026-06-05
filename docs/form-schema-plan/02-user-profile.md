# 02 — User profile (UpdateUserDto)

> **Entita:** `User` · **write path:** `PATCH /users/me` (+ dedikované endpointy avatar/username/password).
> **FE styl:** zod (`profileSchemas.ts`, auth schémata) + dedikované modály.
> **Osy:** `LN` `RG` `EN` `WL` `NL` · perspektiva **P1** (plný průchod pole).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`F-xx`). Stav: ✅ sweep 2026-06-05 — 4 rozpory (UP-D3 🔴, UP-D1 🟠, UP-D2 🟡, UP-D4 🟡), zbytek ✅/⚖️.

Tři vrstvy: **FE** [profileSchemas.ts](../../src/features/profile/lib/profileSchemas.ts) ·
**BE DTO** [update-user.dto.ts](../../../Projekt-ikaros/backend/src/modules/users/dto/update-user.dto.ts) ·
**DB** [user.schema.ts](../../../Projekt-ikaros/backend/src/modules/users/schemas/user.schema.ts).

---

## Soupis polí (povrch oblasti)

Profilová pole nastavitelná uživatelem přes `PATCH /users/me` + dedikované flow (username, heslo, avatar).
„FE form" = kde to uživatel zadává; pokud FE validace chybí, je to samo o sobě kandidát.

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| UP-01 | `displayName` | string | `headerSchema` | `LN` |
| UP-02 | `city` | string | `headerSchema` | `LN` |
| UP-03 | `bio` | string | `bioSchema` | `LN` |
| UP-04 | `characterName` | string | `characterSchema` | `LN` |
| UP-05 | `characterBio` | string | `characterSchema` | `LN` |
| UP-06 | `username` (change) | string | `usernameRequestSchema` | `RG` `LN` |
| UP-07 | `password` (change) | string | `passwordSchema` | `RQ` `XF` |
| UP-08 | `chatColor` | string hex | chat nastavení | `RG` |
| UP-09 | `themeId` | enum | theme selector | `EN` |
| UP-10 | `profileVisibility` | enum | privacy toggle | `EN` |
| UP-11 | `defaultAvatarType` | enum | avatar volba | `EN` |
| UP-12 | `hiddenPresence` / `hiddenInDirectory` | bool | privacy toggly | `TY` |
| UP-13 | `characterAvatarUrl` | string | upload/delete endpoint | `NL` |
| UP-14 | `avatarUrl` | string url | upload | `RG` `NL` |
| UP-15 | `characterPath` | string | (interní) | `RG` |

---

## Matice pole × vrstva

> Buňka = pravidlo na dané vrstvě (`—` = vrstva pole neomezuje). **Δ** = verdikt parity: `✅ shoda` /
> `🐛 F-xx` / `⚠️ ⬜ ověřit`. Pravidla doplněná z přípravné inventury; **Δ se uzavírá až při sweepu**.

| # | Pole | FE (zod) | BE DTO | DB `@Prop` | Δ |
|---|---|---|---|---|---|
| UP-01 | displayName | `max(64)` opt + `maxLength={64}` | `@MaxLength(32)` opt | `@Prop()` — | 🐛 **UP-D1** (64≠32 → FE pustí 33–64, BE 400; už inventura K-F2) |
| UP-02 | city | `max(100)` opt + `maxLength={100}` | `@MaxLength(100)` opt | `@Prop()` — | ✅ shoda |
| UP-03 | bio | `max(1000)` opt + `maxLength={1000}` | `@MaxLength(1000)` opt | `@Prop()` — | ✅ shoda |
| UP-04 | characterName | `max(64)` opt + `maxLength={64}` | `@MaxLength(64)` opt | `@Prop()` — | ✅ shoda |
| UP-05 | characterBio | `max(1000)` opt + `maxLength={1000}` | `@MaxLength(1000)` opt | `@Prop()` — | ✅ shoda |
| UP-06 | username (change) | `/^[a-z0-9-]+$/` 3–32, pole `requestedUsername` | `/^[^@]+$/` 3–32, pole `newUsername` | required,unique, — fmt | 🐛 **UP-D2** (regex drift, už K-F1) + 🐛 **UP-D3** (název pole `requestedUsername`≠`newUsername` → WL drop → 400) |
| UP-07 | password (change) | `oldPassword min(1)` · `newPassword min(8) max(128)` | `oldPassword @MinLength(1)` · `newPassword @MinLength(8) @MaxLength(128)` | `passwordHash` (N/A) | ✅ shoda (FE↔DTO názvy i délky sedí; vnitřní policy 8 vs register 6 = ⚖️, viz AU-03) |
| UP-08 | chatColor | picker `/^#[0-9A-Fa-f]{6}$/`, ale **submit bez gate** | `/^#[0-9a-fA-F]{6}$/` | `default '#FFFFFF'` | 🐛 **UP-D4** (FE nevynutí úplný 6-znak hex před uložením → částečný hex 400) |
| UP-09 | themeId | select z `THEMES` (registry) → PATCH `{themeId}` | `@IsIn(THEME_IDS)` | `@Prop()` — bez enum | ⚖️ by-design (FE registry ↔ BE THEME_IDS **množinově shodné**, 33 ID; DB bez `enum` nevynutí, ale `@IsIn` gate write path → bez rizika dat) |
| UP-10 | profileVisibility | toggle posílá jen `'public'\|'friends'` | `@IsIn(['public','friends'])` | `enum ['public','friends'] def public` | ✅ shoda (3-vrstvě množinově) |
| UP-11 | defaultAvatarType | **bez FE write** (jen read/`UserAvatar` fallback); typ `'male'\|'female'\|'being'` | `@IsIn(['male','female','being'])` | `enum [...] def 'male'` | ✅ shoda (enum 3-vrstvě; FE pole needituje, žádný drift) |
| UP-12 | hidden* | toggly posílají `boolean` | `@IsBoolean` | `default false` | ✅ shoda |
| UP-13 | characterAvatarUrl | mazání přes `DELETE /users/me/character/avatar` (ne PATCH body) | `@IsString` (`''`=delete) | `@Prop()` — | ⚖️ by-design (delete = dedikovaný endpoint → service `update({characterAvatarUrl:''})` mimo DTO/`@IsUrl`; `toEntity` vrací `''`, FE fallback na falsy → funguje) |
| UP-14 | avatarUrl | mazání přes `DELETE /users/me/avatar` (ne PATCH body) | `@IsUrl` | `@Prop()` — | ⚖️ by-design (FE neposílá `avatarUrl` v PATCH body vůbec; delete píše `''` přes service mimo ValidationPipe → `@IsUrl` `''` neodmítne; round-trip OK) |
| UP-15 | characterPath | — (interní, world-join; bez FE write) | `@Matches(/^[a-z0-9-]+\/[a-z0-9-]+$/)` | `@Prop()` — | ✅ shoda (FE pole needituje; server vynutí formát, žádné FE pravidlo k driftu) |

---

## Kontrolní body (co u každého pole ověřit při sweepu)

- **UP-01 `LN`** — FE `max(64)` pustí 33–64, BE `@MaxLength(32)` → 400? Která hodnota je kanonická? *(hot)*
- **UP-06 `RG`/`NM`** — 3 různá username pravidla (register `/^[^@]+$/` ↔ change FE `/^[a-z0-9-]+$/` ↔ change BE `/^[^@]+$/`); FE komentář tvrdí shodu s BE — ověřit/opravit. **Migrace:** existující usernames s mezerami/velkými písmeny? *(hot)*
- **UP-07 `RQ`/`XF`** — min délka hesla: register 6 vs change/reset 8 — jednotná policy? (vrstvy FE↔BE sedí, jde o vnitřní nekonzistenci)
- **UP-08 `RG`** — FE chatColor input validuje hex? (BE `@Matches`, DB default) — bez FE validace špatná hodnota → 400.
- **UP-09 `EN`** — `THEME_IDS` dual-source (FE registry ↔ BE konstanta, paměť `theme_ids_dual_source`); DB `@Prop` bez `enum` → DB nevynutí. Shoda množin + zdroj.
- **UP-10/11 `EN`** — enum hodnoty FE select ↔ DTO `@IsIn` ↔ DB `enum` — množinová shoda 3-vrstvě.
- **UP-13 `NL`** — „smazat avatar" = FE pošle `''`? BE bere `''` jako delete (komentář), DB uloží `''`. Round-trip: po deletu GET vrací `''` nebo pole chybí? Mapper?
- **UP-14 `RG`/`NL`** — `@IsUrl` odmítne `''` → jak se maže avatar? (UP-13 má proto `@IsString` bez `@IsUrl` — ověřit konzistenci obou avatar polí)

---

## Delta parity (plní sweep)

> Sweep 2026-06-05. ValidationPipe = `whitelist: true, transform: true` **bez `forbidNonWhitelisted`** (`backend/src/main.ts:15`) → neznámá pole se **tiše dropnou** (ne 400); required pole chybějící v body ale spadne na svém validátoru → 400. Write path profilu = `PATCH /users/me` (controller `updateMe`, `users.controller.ts:70`) → `usersService.update(id, dto)` (`users.service.ts:209`) — service **nedělá** class-validator re-validaci, jen kopíruje definovaná pole; DTO dekorátory běží **jen** v ValidationPipe na `@Body()`.

**UP-D3** (🔴 NM/WL — nový nález sweepu) `requestedUsername` vs `newUsername` (žádost o změnu username) — FE: `POST /users/me/username-request` posílá `{ requestedUsername }` (`src/features/admin/users/api/useAdminUsers.ts:30-33`; pole z `usernameRequestSchema.requestedUsername`, `profileSchemas.ts:39`) · BE DTO: `request-username-change.dto.ts:9` má pole **`newUsername`** (`@IsString @MinLength(3) @MaxLength(32) @Matches(/^[^@]+$/)`); controller `users.controller.ts:256` čte `dto.newUsername` · DB: `username` (přepíše se až po schválení žádosti) · **rozpor:** `requestedUsername` se přes whitelist **tiše zahodí**, `newUsername` v body chybí → `@IsString @MinLength(3)` selže → **400 Bad Request**. Flow „požádat o změnu username" je **rozbitý** (analogie AU-D2 `newPassword`/`password`). · **dopad na data:** žádné nevalidní dokumenty (žádost nikdy nevznikne); migrace ne. · **návrh:** sjednotit název pole — buď FE posílat `{ newUsername }`, nebo přejmenovat DTO pole + `usersService.requestUsernameChange` arg na `requestedUsername`. FE→`newUsername` je menší a drží konzistenci s register/DTO.

**UP-D1** (🟠 už inventura K-F2) `displayName` délka — FE: `headerSchema.displayName max(64)` (`profileSchemas.ts:15`) + `<Input maxLength={64}>` (`ProfileHeader.tsx:195`) · BE DTO: `update-user.dto.ts:14` `@MaxLength(32)` · DB: `@Prop()` bez limitu (`user.schema.ts:31`) · **rozpor:** FE pustí 33–64 znaků, BE odmítne `@MaxLength(32)` → **400**. Kanonická hodnota nejasná (FE 64 ↔ BE 32). · **dopad na data:** žádné nevalidní dokumenty (BE 400 chrání DB); migrace ne. · **návrh:** sjednotit limit — rozhodnout 32 vs 64 a srovnat obě vrstvy (FE zod + `maxLength` i BE `@MaxLength`).

**UP-D2** (🟡 už inventura K-F1) `username` (change) regex drift — FE: `usernameRequestSchema /^[a-z0-9-]+$/` 3–32 (`profileSchemas.ts:43-46`), komentář ř.37 **mylně** tvrdí „shodný s BE: /^[a-z0-9-]{3,32}$/" · BE DTO: `request-username-change.dto.ts:8` `@Matches(/^[^@]+$/)` (jen zákaz `@`, jako register) · DB: `username` required/unique, bez fmt · **rozpor:** FE je **přísnější** než BE (zakáže velká písmena, mezery, diakritiku…), BE povolí cokoli kromě `@`. FE je podmnožinou BE → **žádný hard-fail**, ale FE zbytečně blokuje per-BE validní jména + komentář je nepravdivý + drift vs register (oblast 01, AU-02 `/^[^@]+$/`). · **dopad na data:** existující usernames můžou mít znaky mimo FE regex (velká písmena/mezery) — FE změna by je nešla zadat znovu; samotná žádost ale data nemigruje. · **návrh:** rozhodnout cílové pravidlo (strict `[a-z0-9-]` vs lenient `[^@]`) jednotně pro register + change; opravit/odstranit mylný komentář v `profileSchemas.ts:37`.

**UP-D4** (🟡 RG — nový nález sweepu) `chatColor` chybí FE submit gate — FE: `ChatColorPicker` validuje `HEX_RE /^#[0-9A-Fa-f]{6}$/` jen pro `aria-invalid`/preview, ale `handleHexInput` propustí i částečný hex (`HEX_PARTIAL_RE /^#[0-9A-Fa-f]{0,6}$/`, `ChatColorPicker.tsx:14,28-32`); `AppearanceSection.saveColor` posílá `color` **bez kontroly úplnosti** (`AppearanceSection.tsx:48-51`), `EditCard` Uložit disabluje jen při `isSaving` (`EditCard.tsx:81`) · BE DTO: `update-user.dto.ts:30` `@Matches(/^#[0-9a-fA-F]{6}$/)` · DB: `default '#FFFFFF'` · **rozpor:** uživatel může do HEX inputu napsat neúplný hex (`#ABC`, `#`) a kliknout Uložit → BE `@Matches` odmítne → **400**. (Drag v `HexColorPicker` emituje vždy úplný hex → běžný flow OK; mezera je jen ruční částečný vstup.) · **dopad na data:** žádné nevalidní dokumenty (BE 400 chrání); migrace ne. · **návrh:** v `saveColor`/`EditCard` gate na `HEX_RE.test(color)` (disable Uložit nebo inline chyba) než se pošle PATCH.

## Round-trip / migrační poznámky

> **UP-13/UP-14 NL avatar delete (verdikt ⚖️ by-design, OBĚ pole konzistentní):** Mazání avataru NEjde přes `PATCH /users/me` body, ale přes dedikované `DELETE /users/me/avatar` resp. `DELETE /users/me/character/avatar` (`users.controller.ts:106-112,137-145`). Endpointy volají `usersService.update(id, { avatarUrl: '' })` / `{ characterAvatarUrl: '' }` přímo (ne přes `@Body() UpdateUserDto`) → ValidationPipe a tím i `@IsUrl()` na `avatarUrl` se **vůbec nespustí** → `''` projde do DB. `toEntity` (`users.repository.ts:312,360`) vrací uložené `''` zpět (nestripuje), FE `UserAvatar`/`AvatarUploader` berou `''` jako falsy → fallback na default avatar. **Round-trip OK pro obě pole; žádný WO-D3-typ rozpor.** Pozn.: rozdíl `@IsString` (UP-13) vs `@IsUrl` (UP-14) v DTO je irelevantní pro delete (delete jde mimo DTO); `@IsUrl` se uplatní jen na hypotetickém PATCH `avatarUrl`, který FE nikdy neposílá (upload jde taky přes dedikovaný `POST`, který posílá BE-vygenerovanou URL). Avatar pole tedy NEjsou v PATCH-body povrchu reálně použita.
>
> **UP-06 migrace (UP-D2/UP-D3):** případná změna username pravidla = migrace existujících jmen mimo nový regex (server běží). UP-D3 (název pole) je čistá oprava kódu bez migrace.
>
> **THEME_IDS dual-source (UP-09):** FE `src/themes/registry.ts` `THEMES` (33 klíčů) ↔ BE `users/constants/theme-ids.ts` `THEME_IDS` (33 položek) — ověřeno **množinově shodné** (paměť `theme_ids_dual_source`); při přidání motivu nutno aktualizovat obě (jinak BE 400 na nový validní motiv).
