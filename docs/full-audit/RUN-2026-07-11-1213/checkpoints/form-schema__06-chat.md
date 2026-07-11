# Checkpoint — form-schema / oblast 06-chat

- **Styl:** form-schema (registr `docs/form-schema-audit.md`, prefix `F-`)
- **Oblast:** `docs/form-schema-plan/06-chat.md` (chat channel/group/message/scheduled)
- **Datum:** 2026-07-11 · **Režim:** READ-ONLY
- **Hloubka:** L1–L2 statika (M1) napříč FE-claim ↔ DTO ↔ schema ↔ mapper ↔ service; L3 pro scheduled attachments + dicePayload→isDiceRoll (zelené jest spec)
- **Trigger poznámka:** styl 46 nahlásil `dicePayload @IsObject` bez validace → prioritní focus.

## Verdikt: bez NOVÝCH 🔴/🟠; 1× 🆕 🟡 (robustnost/fairness) + 1× ♻️ stale doc (fix již v kódu)

---

## ♻️ CT-D1 / F-19 — scheduled `attachments` JIŽ OPRAVENO (registr/plán stale)

Plán `06-chat.md:141,180` značí **CT-D1 🐛** a registr `form-schema-audit.md:170` vede **F-19** jako
otevřený red-team nález („scheduled `attachments` `@IsArray` nad `unknown[]`, prvky nevalidované").
**V kódu je fix nasazený:**

- **DTO:** `backend/src/modules/chat/dto/create-scheduled-message.dto.ts:26-30`
  ```ts
  @IsOptional() @IsArray()
  @ValidateNested({ each: true }) @ArrayMaxSize(10)
  @Type(() => ChatAttachmentDto)
  attachments?: ChatAttachmentDto[];
  ```
  → parita s message DTO (`create-message.dto.ts:70-74`); prvky nyní validovány přes `ChatAttachmentDto`
  (`url @IsUrl`, `size 1..52428800`, `type` enum 3, `mimeType/filename/publicId` limity — `chat-attachment.dto.ts:11-23`).
- **Regresní test (L3):** `create-scheduled-message.dto.spec.ts` — 6 testů „F-19", vč.
  „odmítne libovolný objekt protlačený do attachments" (`{foo:'bar'}`), neplatné url/type/size, `>10` (ArrayMaxSize).
- **Klasifikace:** ♻️ (známý nález, **fix landed**) → **doc-drift**: přeznačit CT-D1 na ✅ v plánu a
  F-19 na ✅ opraveno v registru (aktuálně matoucí — tvrdí otevřený red-team).

---

## 🆕 CT-27 `dicePayload` — `@IsObject` bez cap + klient-autoritativní hod (F-CHAT-NEW)

- **Osa:** `TY`/`RN` (robustnost) + cross-ref herní integrita/fairness (styl 46) · **Záv.:** 🟡 (red-team-only / fairness)
- **FE:** dice engine posílá strukturovaný objekt hodu (faces/total/type/modifier).
- **DTO:** `create-message.dto.ts:110-112` — `@IsOptional() @IsObject() dicePayload?: Record<string, unknown>`
  → přijme **libovolný tvar objektu**, žádný `@ArrayMaxSize`/hloubkový/velikostní strop (na rozdíl od
  attachments). `@IsObject` odmítne jen pole/primitivum.
- **Schema:** `chat-message.schema.ts:63-64` — `@Prop({ type: Object, default: null })` → ukládá raw.
- **Service:** `chat.service.ts:1382,1419` — `isDiceRoll = !!dto.dicePayload || …`; `dicePayload: dto.dicePayload ?? null`
  → **žádný re-roll ani ověření vnitřní konzistence**; uloží klientskou hodnotu 1:1 a broadcastne všem v kanálu (WS).
- **Mapper:** `chat-message.repository.ts:335-336` round-trip OK → `WL` v pořádku (pole přežije write+read).
- **Bound:** globální body limit **5 MB** (`main.ts:62`) → jediný strop; jeden `dicePayload` může nést ~5 MB
  vnořeného objektu, persistováno raw + rozesláno všem klientům kanálu.
- **Dva úhly:**
  1. **Robustnost (form-schema):** freeform objekt bez struktury/velikostního stropu → stejná třída jako
     **F-20** (bestie `abilities[]` bez `@ValidateNested`) a původní CT-31/F-19. Bloat/amplifikace přes WS.
  2. **Fairness (mimo scope form-schema, patří stylu 46):** výsledek hodu je **klient-autoritativní** —
     BE total/faces neověřuje ani nepřepočítá → autentizovaný hráč může **zfalšovat výsledek hodu**
     (poslat `dicePayload:{total:20,...}` pro reálně padlou 3).
- **Pozn. k existující klasifikaci:** plán `06-chat.md:137` značí CT-27 **⚖️ by-design** („volný objekt —
  různé tvary hodů, schema záměrně bez struktury"). To drží pro *tvar*. NOVÉ vs. doc = chybějící
  **velikostní/hloubkový strop** + **fairness** (klient-autoritativní RNG). Nejde o tichou ztrátu dat.
- **Dopad na existující data:** žádný (existující docs z FE = validní; riziko jen red-team payloadem).
- **Návrh (k diskuzi, neopravovat tiše):** buď (a) přijmout jako by-design (sociální důvěra, PJ přítomen)
  a jen doplnit `dicePayload` **velikostní/hloubkový guard** (odmítnout > N kB / hloubku), nebo (b)
  serverově přepočítat hod (větší zásah, řeší styl 46). Minimum: dokumentovat jako vědomý dluh
  (fairness = klient-autoritativní) a přidat velikostní strop analogicky attachments.

---

## Ověřená paritová pole (bez rozporu, L2)

- **CT-19 message `attachments`** — `@ValidateNested({each}) @ArrayMaxSize(10) @Type(ChatAttachmentDto)`
  (`create-message.dto.ts:70-74`), prvky plně validovány (`chat-attachment.dto.ts`). ✅ shoda. Navíc
  `chat.service.ts:1386` `assertAttachmentsOrigin` (UM-08) — přílohy musí pocházet z našeho uploadu.
- **CT-31 scheduled `attachments`** — viz F-19 výše (opraveno).
- **UpdateMessageDto** `attachmentsToAdd` (`@ValidateNested @ArrayMaxSize(10) @Type`) /
  `attachmentsToRemove` (`@IsString{each} @ArrayMaxSize(10)`) — `update-message.dto.ts:20-31` ✅ shoda.
- **CT-24 customFont/Size** — `@IsIn(CHAT_FONT_KEYS/…SIZE_KEYS)` ✅. **CT-25 color** `@IsHexColor`
  (schema záměrně bez enum, komentář `chat-message.schema.ts:45-48`) ⚖️. **CT-26 clientNonce** `@IsUUID`
  + partial unique index ✅. **CT-28 diceSkin** `@IsString @MaxLength(64)` ✅.

## Pole přidaná PO sweepu (2026-06-05) — projdou celý řetězec (žádný WL drop)

Nejsou v „Soupisu polí" plánu, ověřeny nově:
- **overridePageSlug** — DTO `@IsString @MaxLength(200)` (`create-message.dto.ts:64-67`); service gate na
  `overrideName` (`chat.service.ts:1399`); schema `:17`; mapper `chat-message.repository.ts:314`. ✅ round-trip.
- **visibleTo** — DTO `@IsArray @IsString({each})` (`:46-49`); schema `[String] :29`; mapper `:324`. ✅
  round-trip. ⚪ drobnost: **bez `@ArrayMaxSize`** (velké pole projde) — triviální robustnost, neblokující.
- **mapRef / ChatMapRefDto** — DTO `@ValidateNested @Type(ChatMapRefDto)` (worldMapId/worldId `@MaxLength(64)`,
  title `@MaxLength(200)`, `:21-25,77-80`); schema `Object :37`; mapper `:327`. ✅ round-trip.

---

## Návrhy na aktualizaci doc (bez editace v tomto READ-ONLY běhu)

1. `form-schema-plan/06-chat.md` — CT-D1 (řádky 141, 180) přeznačit 🐛 → ✅ (fix v DTO + spec).
2. `form-schema-audit.md` — F-19 (řádek 170) přeznačit na ✅ opraveno; doplnit odkaz na
   `create-scheduled-message.dto.spec.ts`.
3. Zvážit zápis F-CHAT-NEW (CT-27 dicePayload cap+fairness) — nebo předat stylu 46 (herní integrita),
   kam fairness angle patří primárně; ve form-schema jen jako 🟡 robustnost (třída F-20).

## Metriky
- Soubory čtené: 06-chat.md, plán README, registr, create-message.dto, create-scheduled-message.dto(+spec),
  chat-attachment.dto, update-message.dto, chat-message.schema, chat-message.repository (mapper),
  chat.service (sendMessage), main.ts (body limit).
- Nové nálezy: **1× 🆕 🟡** (CT-27 dicePayload). Stav: **1× ♻️** doc-stale (CT-D1/F-19 fixed).
- Nejvyšší dosažená úroveň: **L3** (scheduled attachments spec zelené; dicePayload→isDiceRoll spec).
