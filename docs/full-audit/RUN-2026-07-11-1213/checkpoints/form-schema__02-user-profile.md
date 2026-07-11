# Checkpoint — form-schema / 02-user-profile

> RUN-2026-07-11-1213 · styl form-schema (FE zod/typ ↔ BE DTO ↔ DB `@Prop` ↔ mapper) · registr `docs/form-schema-audit.md` (prefix `F-`)
> READ-ONLY re-audit oblasti proti HEAD. Předchozí sweep 2026-06-05 (F-23/24/27/28 + UP-D1..D4) + RUN 2026-06-20 (F-RUN-01, F-24 sjednoceno).
> Write path: `PATCH/PATCH me` (`UpdateUserDto`) + dedikované `me/notification-preferences`, `me/request-email-change`, `me/avatar`, `me/character/avatar`, `me/username-request`, `password`, `me/favorite-pages|characters`, `:id/theme`, `updateCalendarMonth`.

## Dosažená vs cílová L

- **Cílová:** běžná pole L2+; pole s rizikem tiché ztráty (`WL`/`NM`, P1/P3) L3+ (test/e2e).
- **Dosažená:** **L2** (statický 3-vrstvý kontrakt ověřen pole-po-poli: FE zod/typ/UI-emit ↔ BE DTO ↔ Mongoose `@Prop` ↔ service merge ↔ toEntity ↔ push konzument). Nový nález F-RUN-02 dotažen průchodem P1 přes 5 vrstev staticky (L2); red-team 400 (M5) / kontraktový test (M3) nefiren → PROOF-REQUEST na L3/L4.

## Nové nálezy (🆕)

### 🆕 F-RUN-02 · `NM`/`WL` (P1/P3) · 🟠 — notifikační kategorie `adminChat` chybí v DTO i DB subdoc → toggle „Chat správy" vrací 400 a preference nejde nikdy uložit
- **Osa:** `NM`/`WL` (3-vrstvý drift + `forbidNonWhitelisted` 400). **Nová plocha 15.9/20.5** (notifikační preference + kategorie admin-chat) přidaná **po** sweepu 2026-06-05 → není v registru. Stejná systematická třída jako **F-01/F-27** (FE jméno/množina pole ≠ BE DTO → drop → 400), ale nová entita (`notificationPreferences`).
- **FE (typ + UI + emit):** kategorie `adminChat` je 1. třída — `notification-preferences.ts` (BE) + FE kopie `src/features/notifications/lib/notificationPreferences.ts:16,29` (`adminChat: true`), UI skupina „Správa platformy" render **bezpodmínečně všem** [notificationPreferences.ts:112-121](../../../../src/features/notifications/lib/notificationPreferences.ts#L112) → `NotificationPreferencesSection.tsx:97-121` mapuje všechny `NOTIFICATION_GROUPS`; toggle volá `update.mutate({ [key]: !current })` [:34](../../../../src/features/profile/components/NotificationPreferencesSection.tsx#L34) → `useNotificationPreferences.ts:16-17` `PATCH /users/me/notification-preferences` body `{ adminChat: bool }`.
- **BE DTO (chybí):** `UpdateNotificationPreferencesDto` má jen 8 polí (`pushEnabled, worldChat, worldEvent, ownDiscussion, ownContent, worldNews, ikarosNews, hospoda`) — **`adminChat` NENÍ** — `backend/src/modules/users/dto/update-notification-preferences.dto.ts:7-16`.
- **DB subdoc (chybí):** `notificationPreferences` @Prop subdoc taky bez `adminChat` (stejných 8 polí) — `backend/src/modules/users/schemas/user.schema.ts:165-178`.
- **Konzument (paradox):** push filtr přitom `adminChat` **čte** — `platform-chat.service.ts:514` `wantsPush(prefs, 'adminChat')` — takže pole se používá pro doručení, ale nejde ho uložit.
- **Rozpor / co se stane:** `forbidNonWhitelisted:true` (main.ts:53-56, PC-07/F-RUN-01) → tělo `{ adminChat }` obsahuje neznámé pole → **400 Bad Request** hned na ValidationPipe → `onError` toast „Uložení selhalo". I kdyby DTO pole mělo, Mongoose strict subdoc `adminChat` **stripne** (service merge `...existing + ...partial` [users.service.ts:339-345] zapisuje do subdoc bez pole) → **nikdy nepersistuje** → `wantsPush(...,'adminChat')` vrací vždy default `true`. Uživatel (i tým správy) **nemůže vypnout push „Chat správy"**, a navíc dostane 400 při pokusu.
- **Dopad na existující data:** žádné nevalidní dokumenty (pole se nikdy neuloží). Migrace ne — čistá oprava kontraktu (přidat pole do DTO **i** subdoc).
- **Návrh:** přidat `@IsOptional() @IsBoolean() adminChat?: boolean;` do `UpdateNotificationPreferencesDto` **a** `adminChat: { type: Boolean }` do subdoc `notificationPreferences` v `user.schema.ts` (obě vrstvy — jinak DTO projde, DB stripne). Zvážit kontraktový test FE payload-klíče ↔ DTO (jako u F-01/F-27) přes všechny notif kategorie, ať `NotificationCategory` a DTO nikdy nedriftují. Alternativa (menší): FE nevyrenderovat skupinu „Správa platformy" nečlenům týmu — neřeší ale rozbití pro tým.
- **L:** L2 (statika 5 vrstev). → PROOF-REQUEST BE-1.

## Verdikt regrese známých nálezů (♻️ — NEhlásit jako nové)

Všechny fixy z 2026-06-05 + 2026-06-20 jsou **přítomné v HEAD** (čtením potvrzeno):

- **♻️ F-27 / UP-D3** (`NM`/`WL` username change) — **opraveno**: FE mapuje `{ newUsername: requestedUsername }` [useAdminUsers.ts:36](../../../../src/features/admin/users/api/useAdminUsers.ts#L36) na BE `RequestUsernameChangeDto.newUsername` (`request-username-change.dto.ts:9`). Controller `users.controller.ts:295-298` čte `dto.newUsername`. Nefunkční flow zprovozněn.
- **♻️ F-24 / UP-D1** (`LN` displayName 64≠32) — **sjednoceno na 32**: FE `profileSchemas.ts:17` `max(32)` + `ProfileHeader.tsx:198` `maxLength={32}` = BE `update-user.dto.ts:23` `@MaxLength(32)`. Shoda.
- **♻️ F-28 / UP-D4** (`RG` chatColor submit gate) — **opraveno**: `AppearanceSection.tsx:57-70` gate `isValidChatColor = /^#[0-9A-Fa-f]{6}$/.test(color)` v `saveColor` + `EditCard saveDisabled={!isValidChatColor}` [:202]. Neúplný hex se nepošle. BE `@Matches(/^#[0-9a-fA-F]{6}$/)` (`update-user.dto.ts:48`).
- **♻️ F-23 / UP-D2** (`RG` username regex drift) — **ponecháno by-design + lživý komentář opraven**: FE `usernameRequestSchema` stále přísnější slug `/^[a-z0-9-]+$/` (`profileSchemas.ts:49`), komentář `:40-42` teď korektně říká „FE je ZÁMĚRNĚ přísnější než BE". BE `update-user.dto.ts:34` + `request-username-change.dto.ts:8` = `/^[^@]+$/` (sjednoceno register↔change-BE). FE ⊂ BE → žádný hard-fail. Bez změny.
- **♻️ F-RUN-01** (`WL` `forbidNonWhitelisted:true`) — stále platí (`main.ts:53-56`); model osy = „400 na neznámém/přejmenovaném poli" (živý na F-RUN-02).

## Ověřeno ✅ (nová/nepřečtená plocha od sweepu — bez nálezu)

- **request-email-change (1.7, `NM`/`LN`)** — ✅ shoda: FE `{ newEmail, currentPassword }` (`useEmailChangeRequest.ts:11`, `emailChangeSchema.ts` `newEmail.email().max(255)` + `currentPassword.max(128)`) ↔ BE `RequestEmailChangeDto` `@IsEmail @MaxLength(255) newEmail` + `@IsString @MinLength(1) @MaxLength(128) currentPassword` (`request-email-change.dto.ts:6-14`). Názvy i délky sedí.
- **favorite-pages (5.2, `TY`/`LN`)** — ✅ `UpdateFavoritePagesDto` `@IsArray @ArrayMaxSize(100) @IsString({each}) @Matches(/^[a-z0-9][a-z0-9-]*$/,{each})` (`update-favorite-pages.dto.ts:10-19`); replace-all, cap 100 zrcadlí FE `MAX_FAVORITE_PAGES`. Bez driftu.
- **notification-preferences ostatní pole** (`pushEnabled` + 7 kategorií mimo adminChat) — ✅ 3-vrstvě shodné (DTO ↔ subdoc ↔ FE `NotificationCategory`). `undefined` = default z kódu (by-design, neukládá se).
- **password change (UP-07, `LN`)** — ✅ `ChangePasswordDto` `oldPassword @MinLength(1)@MaxLength(128)` / `newPassword @MinLength(8)@MaxLength(128)` = FE `passwordSchema`. (Vnitřní policy 8 vs register 6 = ⚖️ AU-03, mimo tuto oblast.)
- **THEME_IDS (UP-09, `EN`)** — 33 ID (21 platform + 12 world), `theme-ids.ts` = FE registry (paměť `theme_ids_dual_source`); `@IsIn(THEME_IDS)` gate write path. DB `@Prop` bez enum (by-design, `@IsIn` chrání). Beze změny.
- **defaultAvatarType (UP-11, `EN`)** — stále **bez FE write** (grep 0 mutací); enum `male|female|being` shodný DTO↔DB. Bez driftu.
- **avatar delete UP-13/UP-14 (`NL`)** — beze změny (dedikované `DELETE`, mimo DTO/ValidationPipe, `''` round-trip OK; controller `:122-161`). ⚖️ by-design.

## Latentní / mimo scope

- `updateCalendarMonth/:id` (`users.controller.ts:436-450`) bere **raw body `{ calendarMonth: unknown }` bez DTO** → zapisuje do `themeSettings.calendarMonth`. `themeSettings` je `@IsObject` libovolný objekt (by-design flexibilní) → žádná validace hodnoty. Nízké riziko (self-only, arbitrary theme setting); ne eskalováno.
- `themeSettings`/`chatPreferences` = `@IsObject()` bez nested validace (Record<string,unknown>) — konzistentní napříč vrstvami, by-design volný prostor. Ne nález.

## PROOF-REQUESTy

- **BE-1 (+e2e / M5 red-team):** Vypálit `PATCH /users/me/notification-preferences` s `{ adminChat: false }` proti běžícímu BE → očekávaný **400** (forbidNonWhitelisted). Potvrdí F-RUN-02 mechanismus na L4 + slouží jako regresní test (analogie `useResetPassword.spec`/`useRequestUsernameChange.spec` pro F-01/F-27). Doplnit kontraktový test „každý klíč `NOTIFICATION_CATEGORIES` má odpovídající pole v DTO".

## Pokrytí

- **UpdateUserDto pole UP-01..UP-15:** všech 15 znovu přečteno proti HEAD (DTO/schema/mapper/FE), všechny známé delty ověřeny opravené/by-design.
- **Dedikované write endpointy:** `me/notification-preferences`, `me/request-email-change`, `me/avatar`(±delete), `me/character/avatar`(±delete), `me/username-request`, `me/favorite-pages`, `me/favorite-characters`, `password`, `:id/reset-password`, `:id/theme`, `updateCalendarMonth` — controller přečten celý (`users.controller.ts` 1-585).
- **Vrstvy dotažené u F-RUN-02:** FE typ → FE UI render → FE mutation emit → BE DTO → Mongoose subdoc → service merge → toEntity → push konzument (`platform-chat.service.ts:514`).
- **Nezkoumáno (jiná oblast):** 20C `isMinor`/`parentalConsentStatus`/`acceptedTermsAt`/`termsVersion` = registrační write path (oblast 01 auth), bez profilového write endpointu → mimo 02.

## Shrnutí

- **🆕 1** — F-RUN-02 🟠 (`NM`/`WL`): kategorie `adminChat` chybí v `UpdateNotificationPreferencesDto` i DB subdoc → toggle „Chat správy" 400 + pref nikdy nepersistuje (push filtr ji ale čte). Systematická třída F-01/F-27, nová plocha 15.9/20.5.
- **♻️ 5** známých (F-23/24/27/28 + F-RUN-01) potvrzeno **opravených / by-design** v HEAD — NEhlásit jako nové.
- **1 PROOF-REQUEST** (M5 red-team 400 + kontraktový test kategorií).
- Dosažená hloubka **L2** (cíl `NM`/`WL` = L3+ → chybí runtime/test proof).
