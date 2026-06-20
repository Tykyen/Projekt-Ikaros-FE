# form-schema / 05-characters — checkpoint RUN-2026-06-20-1621

> Datum: 2026-06-20. Sweep: statická analýza L1–L2 veškerého character form/DTO kódu v HEAD.
> Repo FE: 96460577 / BE aktuální HEAD.

---

## Pokrytí

Prošlo:
- `characters.types.ts` (FE typ `Character`, `CustomDiaryBlock`, subdoc typy)
- `useCharacterMutations.ts` (všechny mutační hooky vč. `UpdateCharacterInput`, `UpdateDiaryInput`, `UpdateFinanceInput`, `UpdateCalendarInput`, `UpdateInventoryInput`, `UpdateNotesInput`)
- `create-character.dto.ts`, `update-character.dto.ts`, `convert-character.dto.ts` (BE DTOs)
- `character.schema.ts` (DB Mongoose schema)
- `characters.repository.ts` (`toEntity` mapper)
- `update-character-diary.dto.ts`, `adjust-balance.dto.ts` (subdoc DTOs)
- `character-diary.schema.ts`, `character-diary.repository.ts` (toEntity mapper deníku)
- `character-subdocs.controller.ts` (body typy endpointů)
- `character-accounts.controller.ts` (body typy)
- `useDiarySchema.ts` (personal diary schema mutace)
- `schemaMappers.ts` (`flattenSchemaBlock`, `nestCustomBlock`)
- `diarySchema.types.ts` (`DiarySchemaBlock`, `DiaryBlockConfig`)
- `character-diary.interface.ts` (BE `CustomDiaryBlock` interface)
- Porovnání FE `CustomDiaryBlock` vs BE `CustomDiaryBlockDto`

Neprošlo (live infra): round-trip M4, red-team M5 — viz PROOF-REQUEST.

---

## Dosažená L vs cílová L

| Oblast | Dosažená | Cílová |
|---|---|---|
| character create/update/convert DTOs | L2 | L2+ |
| diary `CustomDiaryBlockDto` vs FE `CustomDiaryBlock` | L2 | L3 |
| subdoc calendar/finance/inventory/notes | L1 (no-DTO path) | L2 |
| `UpdateCharacterInput` legacy drift | L2 | L2 |
| finance accounts | L1 | L2 |

---

## Nálezy

### 🔴 F-RUN-CH-01 — `NM`/`WL` PersonalDiarySchema s `image` bloky → **400** při uložení (forbidNonWhitelisted) 🆕

- **Pole:** `CustomDiaryBlock.imageUrl` v `personalDiarySchema[]` (PATCH `/characters/:slug/diary`)
- **FE:** `characters.types.ts:86` deklaruje `imageUrl?:string` na `CustomDiaryBlock`; `schemaMappers.ts:19` `flattenSchemaBlock` vyplní `imageUrl: b.config?.imageUrl` (vždy pro `image` blok); `useDiarySchema.ts:102-108` `useUpdatePersonalDiarySchema` pošle celý `CustomDiaryBlock[]` includující `imageUrl`.
- **BE DTO:** `update-character-diary.dto.ts:42-53` `CustomDiaryBlockDto` **nemá** pole `imageUrl` ani `expression` — whitelist je `{id, type, label, description, maxValue, minValue, color, options, order, layoutArea}`.
- **BE interface:** `character-diary.interface.ts:4-13` `CustomDiaryBlock` také nemá `imageUrl`/`expression`.
- **Mechanismus:** `forbidNonWhitelisted:true` (PC-07, `main.ts:53`) → pole `imageUrl` na validovaném `@ValidateNested({each:true})` sub-objektu vrátí **400** (`property imageUrl should not exist`).
- **Kdy nastane:** kdykoli PJ uloží personal diary schema pro postavu, jejíž efektivní schéma obsahuje blok typu `image` (světové nebo vlastní). `flattenSchemaBlock` vždy kopíruje `imageUrl` z `config.imageUrl`.
- **Dopad:** funkce „Vlastní šablona deníku" (DiarySchemaEditorModal → `updateSchemaMut.mutate(next)`) je **aktivně rozbitá** pro světy s `image` typem bloku v deníkovém schématu. Uložení vrátí 400, toast zobrazí chybu, schema se neuloží.
- **Dopad na existující data:** žádný (write selhává, nic se nezapisuje).
- **Návrh:** Přidat `@IsOptional() @IsString() @MaxLength(2048) imageUrl?: string;` a `@IsOptional() @IsString() @MaxLength(1000) expression?: string;` do `CustomDiaryBlockDto` (a do BE `CustomDiaryBlock` interface). Nebo FE strippovat `imageUrl`/`expression` před odesláním v `useUpdatePersonalDiarySchema`. Doporučuji přidat do DTO (kanonická cesta). L2. 🆕

---

### 🟡 F-RUN-CH-02 — `WL` `UpdateCharacterInput` legacy bio pole vs `UpdateCharacterDto` — dead-code drift (nová třída, update path) ♻️

- **Pole:** `imageUrl?`, `publicBio?`, `publicInfoBlocks?`, `accessRequirements?` v `UpdateCharacterInput` (FE `useCharacterMutations.ts:44-50`)
- **FE:** deklaruje pole; BE `UpdateCharacterDto` je **nemá**; `useUpdateCharacter` je definovaná na řádku 104, ale **nikde nevolána** (grep: 0 callsites mimo definici).
- **Dopad:** Zatím nulový (dead code). Kdybychom `useUpdateCharacter` zapojili a předali by se legacy pole, `forbidNonWhitelisted:true` vrátí 400 pro každé z nich.
- **Klasifikace:** ♻️ (stejná třída jako F-17/F-18, ale tentokrát update path místo create path; F-17/F-18 v registru jsou pro `CreateCharacterInput`, tato jsou pro `UpdateCharacterInput`).
- **Návrh:** Smazat `imageUrl`, `publicBio`, `publicInfoBlocks`, `accessRequirements` z `UpdateCharacterInput` (stejný vzor jako F-17/F-18 cleanup na create). L2. ♻️

---

### ✅ F-16 OPRAVENO (neevidováno) — `@MaxLength(200)` přidán do `CreateCharacterDto.name` 🔓

- **Registr tvrdí** (form-schema-audit.md řádek 167): F-16 `🟡 LN 05 character name bez server max` — stav `—` (neoznačeno za opravené).
- **Aktuální kód:** `create-character.dto.ts:11`: `@IsString() @MaxLength(200) name: string;` — limit je přítomen.
- **Závěr:** F-16 byl opraven (pravděpodobně spolu s obecnou DTO cleanup), ale **registr to nevede jako opravené**. Registr je v nesouladu s HEAD. 🔓

---

### ✅ F-17 + F-18 OPRAVENY (neevidováno) — CreateCharacter dead code smazán 🔓

- **Registr tvrdí:** F-17 `🟡 EN/WL 05 character kind enum ↔ FE isLocation — dead code`, F-18 `🟡 WL 05 CreateCharacterDto legacy imageUrl/publicBio/… schema nemá → drop`.
- **Aktuální kód:**
  - `useCharacterMutations.ts` / `characters.types.ts`: grep `useCreateCharacter` → 0 výsledků; `CreateCharacterInput` → 0 výsledků. Dead code smazán.
  - `create-character.dto.ts`: obsahuje POUZE `{slug, name, userId, isNpc, kind, campaignSubjectId}` — všechna legacy bio pole odstraněna.
- **Závěr:** F-17 a F-18 opraveny, registr to nevede. 🔓

---

### ⚖️ CH-10 `preferredCalendarConfigId` — FE type drift (není v `Character` interface) ⚖️

- **BE mapper** `characters.repository.ts:139-141` vrací `preferredCalendarConfigId` v entitě.
- **FE typ** `Character` (`characters.types.ts:23-40`) toto pole **nemá**.
- **Dopad:** GET `/characters/:slug` vrací pole, FE TypeScript ho tiše ignoruje (žádný compile error, TS zúží typ). Čtení `character.preferredCalendarConfigId` na FE skončí `undefined` (TS chyba).
- **Klasifikace:** ⚖️ by-design zatím (čte se přes dedikovaný calendar settings endpoint), nebo 🟡 drift pokud se má pole zobrazit. Závisí na use-case. Mimo write-path (žádný DTO pro nastavení přes update character), takže není WL risk — uložitelnost přes jiný endpoint.
- **Stav:** žádný nový nález, zmiňováno v oblastním plánu jako CH-10 ⚖️.

---

### ⚖️ Subdoc kontroléry bez DTO (calendar/finance/inventory/notes) — L1, by-design

- `character-subdocs.controller.ts` endpointy `updateCalendar`/`updateFinance`/`updateInventory`/`updateNotes` berou `@Body() body: Record<string, unknown>` — žádná class-validator validace, ValidationPipe nefunguje na plain object.
- **Dopad:** FE může poslat libovolná pole, BE je předá rovnou do service bez whitelistu. Žádná tichá ztráta (vše projde), ale také žádná vstupní validace.
- **Klasifikace:** ⚖️ by-design (deliberate pass-through vzor), zmiňováno v plánu jako subdoc oblast. Mimo scope nového nálezu.

---

## PROOF-REQUEST

| # | Co ověřit | Metoda | Priorita |
|---|---|---|---|
| PR-CH-01 | Ověřit **živě** na serveru: PATCH `/characters/:slug/diary` s `personalDiarySchema` obsahující blok s `imageUrl` → opravdu vrátí 400? Nebo je forbidNonWhitelisted na nested dto vypnutý jinak? | M5 (red-team payload) | 🔴 před opravou |
| PR-CH-02 | Round-trip P2: uložit diary s `customDataPatch`, přečíst zpět, ověřit, že klíče zůstaly (A→B→A delta merge) | M4 | 🟠 |
| PR-CH-03 | Ověřit stav registru: jsou F-16/F-17/F-18 opraveny na prod serveru (BE restart proběhl)? | M4 (GET + PATCH test) | 🟡 |

---

## Poznámky k předchozím nálezům (sweep 2026-06-05)

- **CH-D1** (name bez max) → opraveno v HEAD, neevidováno.
- **CH-D2** (isLocation dead-code) → opraveno v HEAD, neevidováno.
- **CH-D3** (legacy bio v CreateCharacterDto) → opraveno v HEAD, neevidováno.
- Globální `forbidNonWhitelisted:true` invertuje „tichý drop" na „400" — stará analýza o `whitelist:true` tichém dropu je outdated pro všechny oblasti.
