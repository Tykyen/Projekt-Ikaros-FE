# 06 — Chat (channel / group / message / scheduled)

> **Entity:** `ChatChannel` (konverzace) · `ChatGroup` (kanál) · `ChatMessage` · `ScheduledMessage` ·
> **write path:** `POST/PATCH /worlds/:id/chat/channels`, `…/groups`, `POST …/channels/:id/messages`,
> scheduled `POST /chat/scheduled-messages`.
> **FE styl:** **inline** (`trim()` + `if (!trimmed)` + `maxLength` jako **HTML attr**, žádný zod) — drift-prone (styl ② z README).
> **Osy:** `LN` `EN` `WL` `NM` · perspektiva **P1** (plný průchod pole, ztráta při service-set polích a mapperu).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`CT-xx` → `F-xx`). Stav: ✅ sweep proběhl 2026-06-05 (lokální ID `CT-Dx`).

Vrstvy: **FE** [ChannelDialog.tsx](../../src/features/world/chat/components/ChannelDialog.tsx) ·
[GroupDialog.tsx](../../src/features/world/chat/components/GroupDialog.tsx) ·
[types.ts](../../src/features/world/chat/lib/types.ts) —
**BE DTO** [create-channel](../../../Projekt-ikaros/backend/src/modules/chat/dto/create-channel.dto.ts) /
[update-channel](../../../Projekt-ikaros/backend/src/modules/chat/dto/update-channel.dto.ts) /
[create-group](../../../Projekt-ikaros/backend/src/modules/chat/dto/create-group.dto.ts) /
[update-group](../../../Projekt-ikaros/backend/src/modules/chat/dto/update-group.dto.ts) /
[create-message](../../../Projekt-ikaros/backend/src/modules/chat/dto/create-message.dto.ts) /
[create-scheduled-message](../../../Projekt-ikaros/backend/src/modules/chat/dto/create-scheduled-message.dto.ts) —
**DB** [chat-channel](../../../Projekt-ikaros/backend/src/modules/chat/schemas/chat-channel.schema.ts) /
[chat-group](../../../Projekt-ikaros/backend/src/modules/chat/schemas/chat-group.schema.ts) /
[chat-message](../../../Projekt-ikaros/backend/src/modules/chat/schemas/chat-message.schema.ts) —
**mapper** [chat-channel.repository](../../../Projekt-ikaros/backend/src/modules/chat/repositories/chat-channel.repository.ts) /
[chat-group.repository](../../../Projekt-ikaros/backend/src/modules/chat/repositories/chat-group.repository.ts) /
[chat-message.repository](../../../Projekt-ikaros/backend/src/modules/chat/repositories/chat-message.repository.ts).

> ⚠️ **WL klíč** (paměť `project_chat_channel_field_checklist`): u channel ověř **5 míst** —
> FE payload → DTO → Mongoose `@Prop` → `toEntity` mapper → GET. `worldId`/`isGlobal`/`groupId`
> u channel **nedorazí z FE create DTO** (DTO je nemá) — nastavuje je **service**. Ověř, že to není
> tichá ztráta, ale záměr (server-side derivace).

---

## Soupis polí (povrch oblasti)

„FE form" = kde to uživatel zadává; FE inline validace = `trim()` + `if (!trimmed) return` + `maxLength`
HTML attr (klientský UX předfiltr, **ne** typovaná validace). Service-set pole (bez FE/DTO) značím `[svc]`.

### Channel (`ChatChannel`)

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| CT-01 | `name` | string | `ChannelDialog` (`Input maxLength=64`) | `LN` |
| CT-02 | `accessMode` | enum | access tlačítka | `EN` |
| CT-03 | `allowedRoles[]` | number[] | role checklist (jen `accessMode='roles'`) | `TY` `XF` |
| CT-04 | `allowedMemberIds[]` | string[] | member checklist (jen `='members'`) | `TY` `XF` |
| CT-05 | `imageUrl` | string | upload / odebrat (`''`=delete při edit) | `NL` `LN` |
| CT-06 | `groupId` | string | select (create + edit přesun) | `NM` `WL` |
| CT-07 | `type` | string | — (FE neposílá) | `LN` `WL` |
| CT-08 | `order` | number | — (FE neposílá; bulk reorder) | `RN` `WL` |
| CT-09 | `worldId` | string\|null | `[svc]` (route param) | `WL` |
| CT-10 | `isGlobal` | bool | `[svc]` | `WL` |
| CT-11 | `lastMessageAt` / `lastMessagePreview` | Date/string | `[svc]` read-only | `WL` |

### Group (`ChatGroup`)

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| CT-12 | `name` | string | `GroupDialog` (`Input maxLength=64`) | `LN` |
| CT-13 | `imageUrl` | string | upload / odebrat (`''`=delete) | `NL` `LN` |
| CT-14 | `color` | string slot | `GroupColorPicker` (`''`=reset) | `RG` `NL` |
| CT-15 | `iconKey` | string | `GroupIconPicker` (`''`=reset) | `RG` `NL` |
| CT-16 | `order` | number | — (bulk reorder) | `RN` `WL` |
| CT-17 | `linkedWorldGroup` | string | `[svc]` (auto-kanál družiny) | `WL` `NM` |

### Message (`ChatMessage`) — výběr klíčových polí

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| CT-18 | `content` | string | composer | `LN` `RQ` `XF` |
| CT-19 | `attachments[]` | object[] | upload (`ChatAttachmentDto`) | `TY` `LN` `RN` |
| CT-20 | `rpDate` | string | RP datum picker | `RG` |
| CT-21 | `replyToId` | string | reply UI | `LN` |
| CT-22 | `overrideName` | string | persona override | `LN` |
| CT-23 | `overrideAvatarUrl` | string url | persona override | `RG` `LN` |
| CT-24 | `customFont` / `customFontSize` | enum | composer toolbar | `EN` |
| CT-25 | `color` | string hex | per-svět membership color | `RG` |
| CT-26 | `clientNonce` | uuid | idempotentní retry (`nonce.ts`) | `RG` |
| CT-27 | `dicePayload` | object | dice engine | `TY` |
| CT-28 | `diceSkin` | string | dice skin volba | `LN` |

### Scheduled message (`ScheduledMessage`)

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| CT-29 | `channelId` | string | scheduler UI | `RQ` `NM` |
| CT-30 | `content` | string | scheduler composer | `LN` `XF` |
| CT-31 | `attachments[]` | unknown[] | scheduler upload | `TY` |
| CT-32 | `sendAt` | ISO string | datum/čas picker | `RG` `XF` |

---

## Matice pole × vrstva

> Buňka = pravidlo na dané vrstvě (`—` = vrstva pole neomezuje). **Δ** = verdikt parity: `✅ shoda` /
> `🐛 F-xx` / `⚠️ ⬜ ověřit`. Pravidla doplněná z přípravné inventury; **Δ se uzavírá až při sweepu**.

### Channel

| # | Pole | FE (inline) | BE DTO | DB `@Prop` | mapper `toEntity` | Δ |
|---|---|---|---|---|---|---|
| CT-01 | name | `trim`+`if(!trimmed)` + `maxLength=64` (HTML) | `@IsString @MinLength(1) @MaxLength(64)` | `required:true` — | ✓ `name` | ⚖️ by-design (FE `maxLength` jen UX; `@MinLength(1)` pustí `' '`, FE `if(!trimmed)` blokne — třída CT-01/12/BE-04) |
| CT-02 | accessMode | literal `'all'\|'roles'\|'members'` | `@IsOptional @IsIn([…3])` | `default 'all'` — bez `enum` | ✓ | ⚖️ by-design (3× shoda množiny; DB bez `enum` = záměr, write jen přes DTO) |
| CT-03 | allowedRoles | `WorldRole[]` (number), posíláno jen u `'roles'` | `@IsOptional @IsArray @IsNumber({each})` | `[Number] default []` | ✓ | ✅ shoda (DTO/schema/mapper sedí; XF níže) |
| CT-04 | allowedMemberIds | `string[]`, jen u `'members'` | `@IsOptional @IsArray @IsString({each})` | `[String] default []` | ✓ | ✅ shoda (mapper drží; XF poznámka v kontrolních bodech) |
| CT-05 | imageUrl | upload URL; edit `''`=delete | `@IsOptional @IsString @MaxLength(512)` | `@Prop String` — | ✓ | ✅ shoda (`''` projde `MaxLength`; service `...(imageUrl?{imageUrl}:{})` u create, update `$set:''`; mapper `as string\|undefined`) |
| CT-06 | groupId | select; create groupId v **URL**, edit `groupId` v **body** (přesun) | create DTO **nemá** `groupId`; update `@IsOptional @IsString` | `default null` | ✓ | ⚖️ by-design (**NE drop** — FE create destrukturuje `{groupId,...dto}` → URL `/groups/:groupId/channels`; service bere z param) |
| CT-07 | type | — (FE neposílá) | `@IsOptional @IsString @MaxLength(32)` | `default 'all'` | ✓ `'all'` | ✅ shoda (service `dto.type ?? 'all'`; FE needituje, default OK) |
| CT-08 | order | — (bulk reorder endpoint) | `@IsOptional @IsNumber @Min(0)` | `default 0` | ✓ | ✅ shoda (reorder přes `bulkUpdateOrders`, mimo create/update) |
| CT-09 | worldId | `[svc]` z `group.worldId` | **DTO nemá** | `default null` | ✓ | ⚖️ by-design (service `worldId: group.worldId` — derivace z URL groupId, ne tichá ztráta) |
| CT-10 | isGlobal | `[svc]` | **DTO nemá** | `default false` | ✓ | ⚖️ by-design (world-create ho nenastaví → zůstane `false` default; global kanál jinou cestou) |
| CT-11 | lastMessageAt / Preview | `[svc]` read-only | — | `@Prop` opt | ✓ | ✅ shoda (server-set v `sendMessage`, GET přes mapper vrací) |

### Group

| # | Pole | FE (inline) | BE DTO | DB `@Prop` | mapper `toEntity` | Δ |
|---|---|---|---|---|---|---|
| CT-12 | name | `trim`+`if(!trimmed)` + `maxLength=64` | `@IsString @MinLength(1) @MaxLength(64)` | `required:true` | ✓ | ⚖️ by-design (jako CT-01) |
| CT-13 | imageUrl | upload; `''`=delete | `@IsOptional @IsString @MaxLength(512)` | `@Prop String` | ✓ | ✅ shoda (jako CT-05; `''` přes `$set`) |
| CT-14 | color | slot `'0'..'11'`; `''`=reset (edit) | create `@Matches(/^([0-9]\|1[01])$/)` · update `/^([0-9]\|1[01])?$/` | `@Prop String` opt | ✓ | ⚖️ by-design (create↔update regex drift záměrný; FE posílá `''` **jen** update path [GroupDialog.tsx:84]; create posílá `undefined`) |
| CT-15 | iconKey | klíč `GROUP_ICONS`; `''`=reset | create `@Matches(/^[a-z0-9-]{1,32}$/)` · update `/^([a-z0-9-]{1,32})?$/` | `@Prop String` opt | ✓ | ⚖️ by-design (stejný vzor jako CT-14; reset `''` jen na update [GroupDialog.tsx:85]) |
| CT-16 | order | — (bulk reorder) | `@IsOptional @IsNumber @Min(0)` | `default 0` | ✓ | ✅ shoda |
| CT-17 | linkedWorldGroup | `[svc]` auto-kanál | **create/update DTO nemá** | `@Prop String` opt | ✓ | ⚖️ by-design (service-write; FE typ [types.ts:31] + mapper [chat-group.repository.ts:59] drží → drop **opraven**) |

### Message (výběr) + Scheduled

| # | Pole | FE (inline) | BE DTO | DB `@Prop` | mapper | Δ |
|---|---|---|---|---|---|---|
| CT-18 | content | composer (text) | `@IsOptional @IsString @MinLength(1) @MaxLength(4000)` | `default null` | ✓ | ✅ shoda (XF content/attachments řeší controller scheduled + composer; message bez explicit „aspoň jedno" — viz pozn.) |
| CT-19 | attachments | `ChatAttachmentDto[]` | `@ValidateNested({each}) @ArrayMaxSize(10) @Type` | `[MixedArray] default []` | ✓ | ✅ shoda (prvky validovány: url `@IsUrl`, size `1..52428800`, type enum 3, mime/filename limity [chat-attachment.dto.ts]) |
| CT-20 | rpDate | datum picker | `@Matches(/^\d{4}-\d{2}-\d{2}$/)` | `@Prop String` opt | ✓ | ✅ shoda (regex YYYY-MM-DD) |
| CT-21 | replyToId | reply UI | `@IsOptional @IsString @MaxLength(24)` | `@Prop String` opt | ✓ | ✅ shoda |
| CT-22 | overrideName | persona | `@IsOptional @IsString @MaxLength(64)` | `@Prop String` opt | ✓ | ✅ shoda |
| CT-23 | overrideAvatarUrl | persona | `@IsUrl @MaxLength(512)` | `@Prop String` opt | ✓ | ✅ shoda (`@IsUrl` odmítne `''`; reset persony = neposlat pole / poslat URL, ne prázdno — analogie UP-13/14) |
| CT-24 | customFont(Size) | toolbar enum | `@IsIn(CHAT_FONT_KEYS)` / `CHAT_FONT_SIZE_KEYS` | `default null` | ✓ | ✅ shoda (keys zrcadleny FE `chatFonts.ts` ↔ BE `chat-fonts.ts`; paralelní pole, ne sdílený modul — dokumentováno) |
| CT-25 | color | membership hex | `@IsHexColor` (world DTO) | `default null` (bez enum) | ✓ | ⚖️ by-design (schema záměrně bez enum — komentář [chat-message.schema.ts:37-40]: world named vs global hex) |
| CT-26 | clientNonce | `nonce.ts` UUID v4 | `@IsUUID` | `default null` sparse unique | ✓ | ✅ shoda (FE `crypto.randomUUID()` = v4 [nonce.ts:12]) |
| CT-27 | dicePayload | dice engine | `@IsObject` | `Object default null` | ✓ | ⚖️ by-design (volný objekt — různé tvary hodů, schema záměrně bez struktury) |
| CT-28 | diceSkin | skin volba | `@IsOptional @IsString @MaxLength(64)` | `default null` | ✓ | ⚖️ by-design (BE záměrně neověřuje ID skinu, FE fallback) |
| CT-29 | channelId (sched) | scheduler | `@IsString` (required) | `required` schema | — | ✅ shoda |
| CT-30 | content (sched) | scheduler | `@IsOptional @IsString @MaxLength(4000)` | `@Prop` opt | — | ✅ shoda (XF „aspoň jedno z content/attachments" vynutí **controller** [scheduled-messages.controller.ts:56] → 400 `SCHEDULED_MESSAGE_EMPTY`) |
| CT-31 | attachments (sched) | scheduler | `@IsOptional @IsArray` (`unknown[]`, **bez** `@ValidateNested`) | `[Object] default []` | — | 🐛 **CT-D1** (scheduled `attachments` **nevaliduje prvky** vs CT-19; job je injektuje do reálné zprávy bez re-validace) |
| CT-32 | sendAt | datum/čas | `@IsDateString` (+ controller: budoucnost) | `Date required` | — | ✅ shoda (future check v controlleru [scheduled-messages.controller.ts:50] → 400 `SCHEDULED_MESSAGE_PAST`) |

---

## Kontrolní body (co u každého pole ověřit při sweepu)

- **CT-01/CT-12 `LN`** — FE `maxLength=64` je **jen HTML attr** (UX), žádný typovaný min/max ani server-side
  mirror. FE `trim()` ořízne mezery, BE `@MinLength(1)` ne → samé mezery: FE blokne (`if(!trimmed)`), BE by
  pustil `' '`. Round-trip názvu s diakritikou/emoji proti `maxLength` (počítá code units, ne grafémy). *(hot)*
- **CT-02 `EN`** — `'all'|'roles'|'members'` existuje **3×**: FE literal (`ChannelAccessMode`), DTO `@IsIn`,
  DB **bez `enum`** (jen `default 'all'`). DB nevynutí → bad accessMode v DB projde. Množinová shoda + zdroj.
- **CT-03/CT-04 `XF`** — FE posílá `allowedRoles`/`allowedMemberIds` **jen** když `accessMode` odpovídá
  (jinak `undefined`). Při edit: `if(accessMode==='roles') dto.allowedRoles=roles`. Přepnutí members→all:
  zůstanou staré `allowedMemberIds` v DB (FE je nepošle prázdné)? BE má cross-field validaci vztahu? *(hot)*
- **CT-06 `WL`/`NM`** — **create DTO `CreateChannelDto` NEMÁ `groupId`**, ale FE create payload ho posílá
  (`createChannel.mutateAsync({ groupId, … })`). S `whitelist:true` → buď drop (a service ho bere odjinud),
  nebo to projde. Ověř, kde service `groupId` u create čte. Update DTO `groupId` má. *(hot — tichá ztráta riziko)*
- **CT-09/CT-10/CT-17 `WL`** — `worldId`, `isGlobal` (channel), `linkedWorldGroup` (group) **nejsou v žádném
  Create/Update DTO** → service-set. Schema + mapper je drží. Ověř: záměr (server derivace), ne zapomenuté pole.
  Paměť: `linkedWorldGroup` se „dříve tiše zahazoval při destructuringu" (types.ts komentář) — nyní fixed na FE typu.
- **CT-05/CT-13 `NL`** — „odebrat obrázek" = FE pošle `imageUrl: ''`. DTO `@MaxLength(512)` pustí `''`,
  schema bez required uloží `''`. Round-trip: po deletu GET vrací `''` nebo pole chybí? Mapper `imageUrl as string|undefined`.
- **CT-14/CT-15 `RG`** — **create vs update regex drift:** create `color` `^([0-9]|1[01])$` (povinný 1 znak,
  `''` **NEprojde**), update `^([0-9]|1[01])?$` (`?` → `''` **projde** = reset). FE u edit posílá `color ?? ''`
  pro reset → funguje jen na update path. Ověř, že create reset nepotřebuje. Stejný vzor `iconKey`. *(hot)*
- **CT-19 vs CT-31 `TY`/P1** — message `attachments` má `@ValidateNested({each}) @ArrayMaxSize(10)` +
  `ChatAttachmentDto` (url `@IsUrl`, size `1..52428800`, type `image/video/document`, mime/filename limity).
  **Scheduled** `attachments` je jen `@IsArray` nad `unknown[]` — **prvky se nevalidují**. Drift validační síly. *(hot)*
- **CT-18/CT-30 `XF`** — `content` je `@IsOptional` (smí chybět, pokud jsou attachments). Kde se vynutí
  „aspoň jedno z content/attachments"? V service, ne DTO → red-team prázdná zpráva.
- **CT-23 `RG`/`NL`** — `overrideAvatarUrl` `@IsUrl` odmítne `''` → reset persony jak? (analogie UP-13/14 z oblasti 02).
- **CT-24/CT-25/CT-26 `RG`/`EN`** — font keys (`CHAT_FONT_KEYS`) sdílený zdroj FE↔BE (`chatFonts.ts` ↔ konstanta)?
  `color` schema záměrně **bez** enum (komentář: world named vs global hex). `clientNonce` FE v4 ↔ DTO `@IsUUID`.

---

## Delta parity (plní sweep)

**CT-D1** scheduled `attachments` (validace prvků) — FE: scheduler upload (stejný `POST /chat/upload` jako message, produkuje validní `ChatAttachment`) · BE DTO message: `@ValidateNested({each}) @ArrayMaxSize(10) @Type(ChatAttachmentDto)` — prvky plně validovány (`url @IsUrl`, `size 1..52428800`, `type` enum 3, mime/filename limity) ([create-message.dto.ts:54-59], [chat-attachment.dto.ts:11-23]) · BE DTO scheduled: `@IsOptional @IsArray` nad `unknown[]` — **prvky se NEvalidují**, navíc **bez `@ArrayMaxSize`** ([create-scheduled-message.dto.ts:21-23]) · DB: `[Object] default []` ([scheduled-message.schema.ts:21]) · mapper: ano (round-trip) · **rozpor:** uložení nevalidní hodnoty — cron job ([scheduled-messages.job.ts:28-35]) přetypuje uloženou `unknown[]` na `CreateMessageDto.attachments` a volá `chatService.sendMessage` **přímo** (mimo HTTP ValidationPipe → `@ValidateNested` **neběží**), `sendMessage` ukládá `dto.attachments ?? []` bez re-validace ([chat.service.ts:898]) → libovolný objekt se persistuje do reálné `ChatMessage`. · **dopad na data:** migrace ne (existing scheduled docs pochází z FE = validní; riziko jen red-team payloadem na create endpoint) · **návrh:** přidat `@ValidateNested({each}) @ArrayMaxSize(10) @Type(() => ChatAttachmentDto)` na `CreateScheduledMessageDto.attachments` (parita s message DTO).

## Round-trip / migrační poznámky

> _CT-06 groupId create-drop = red-team payload (M5). CT-05/CT-13 `''` delete = round-trip GET (M4).
> CT-14/15 create vs update reset = A→B→A. CT-31 scheduled attachments bez validace = red-team payload.
> Zpřísnění (DB `enum` na accessMode, server-side name limit) na živém serveru → ověř existující dokumenty._
