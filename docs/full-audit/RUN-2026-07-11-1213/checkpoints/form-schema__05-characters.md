# Checkpoint — form-schema / 05-characters

> Oblast: `docs/form-schema-plan/05-characters.md` · registr `docs/form-schema-audit.md` (prefix `F-`)
> Styl: form-schema (FE validace ↔ BE DTO ↔ DB model ↔ mapper) · osy `RQ` `EN` `WL` `TY` `NL` · P1 + P2
> RUN 2026-07-11-1213 · READ-ONLY re-audit proti HEAD (BE `backend` + FE `Projekt-ikaros-FE`)

## Dosažená vs cílová L

- **Dosažená: L2** — statické čtení všech 4 vrstev vedle sebe (FE typ/payload → DTO dekorátor → Mongoose `@Prop` → `toEntity` mapper) + grep dead-code / callerů. Doslovné citace soubor:řádek.
- **Cílová:** L2+ běžná pole, L3 pro `WL`/`NM`. Round-trip M4 (write→GET, CH-06/CH-09 shallow/delta merge A→B→A) NEBĚŽEL (vyžaduje e2e stack) — subdoc merge round-trip zůstává PROOF-request.

## Hlavní zjištění: oblastní doc + registr jsou STALE vůči HEAD

`05-characters.md` byl psán pro sweep 2026-06-05 a stále vede **3× 🐛 (CH-D1/CH-D2/CH-D3)** jako otevřené.
Všechny tři jsou na HEAD **VYŘEŠENÉ v kódu** — doc/registr je nedotáhly. Bez nových aktivních rozporů.

---

## Známé nálezy — stav vůči HEAD

### 🔓 CH-D1 / F-16 (`LN` — `name` bez server max) — VYŘEŠENO na HEAD

- Doc `05-characters.md:46,91` (řádek 167 registru F-16) tvrdí „`@IsString` create req **bez `@MaxLength`**".
- HEAD: `backend/src/modules/characters/dto/create-character.dto.ts:11` — `@IsString() @MaxLength(200) name: string;` → shoda s FE `Page.title maxLength={200}` a s PG-D2/F-14 (pages title už také `@MaxLength(200)`).
- DB `character.schema.ts:18` `@Prop({ required: true }) name` (bez limitu, jako u pages — ok, DTO je brána).
- **Verdikt:** rozpor odstraněn. Registr F-16 → překlopit na ✅. Migrace dat: jen kdyby prod `name` >200 (odvozeno z `Page.title`, tam týž limit → konzistentní).

### 🔓 CH-D2 / F-17 (`EN`/`WL` — FE `CreateCharacterInput.isLocation` dead-code drift) — VYŘEŠENO (typ i hook smazány)

- Doc `05-characters.md:49,71,87` + registr F-17/K-F14 popisují FE typ `CreateCharacterInput.isLocation:boolean` ([characters.types.ts:63]) + nevolaný `useCreateCharacter` ([useCharacterMutations.ts:120]).
- HEAD: grep `CreateCharacterInput|useCreateCharacter` v celém `Projekt-ikaros-FE/src` = **0 shod**. Oba symboly odstraněny; `characters.types.ts` už `isLocation` nese jen v komentáři (řádek 5), `CreateCharacterInput` neexistuje.
- BE `kind` enum drží konzistentně napříč vrstvami: DTO `create-character.dto.ts:15` `@IsIn(['persona','location'])` · schema `character.schema.ts:29-30` `enum:['persona','location'] default 'persona'` · mapper `characters.repository.ts:134` `?? 'persona'`.
- **Verdikt:** dead-code drift zmizel. Registr F-17 → ✅ (uklizeno). Bez dat/migrace.

### 🔓 CH-D3 / F-18 (`WL` — legacy bio pole v `CreateCharacterDto`) — VYŘEŠENO (pole z DTO odebrána)

- Doc `05-characters.md:35,78,89` + registr F-18/K-F15 tvrdí, že `CreateCharacterDto` deklaruje `imageUrl/publicBio/publicInfoBlocks/privateBio/privateInfoBlocks/accessRequirements` ([create-character.dto.ts:24-42]), zatímco schema po 9.1 nemá → Mongoose strict drop / matoucí kontrakt.
- HEAD: `create-character.dto.ts` má nyní **jen** `slug`, `name(@MaxLength 200)`, `userId?`, `isNpc`, `kind?`, `campaignSubjectId?` (řádky 9-17). Legacy bio pole pryč → kontrakt čistý, bio kanonicky na Page (`characterRef`).
- **Verdikt:** matoucí kontrakt odstraněn. Registr F-18 → ✅. Bez dat/migrace.

### ⚖️ CH-01/03/04/05/06/07/08/09/10/11 — verdikty ze sweepu drží

- CH-01 slug (⚖️ žádný `@Matches`, service `.toLowerCase()`+unique index `worldId,slug`), CH-04 `isNpc` create `@IsBoolean` **bez** `@IsOptional` (`create-character.dto.ts:13` — jediný caller `pages.service` ho vždy posílá), CH-07 `extraBlocks` `@IsArray` bez `@ValidateNested` + mapper cast `as SchemaBlock[]` (`repository:136`), CH-10 `preferredCalendarConfigId` v schema+mapper (`schema:40-41`, `repository:139-140`) ale v žádném char DTO (⚖️ mimo char write-path), CH-11 `expectedUpdatedAt` (`update-character.dto.ts:32`, service vyřízne → 409). Vše beze změny, verdikty platí. Convert DTO `convert-character.dto.ts` = jen `@IsOptional @IsString userId?` (shoda).

---

## 🆕 Reziduum (nízké) — FE `UpdateCharacterInput` nese mrtvá legacy pole + `useUpdateCharacter` nikde nevolán

- **[osa]** `WL`/`NM` (P1) — stejná třída jako F-18, ale posunutá na FE **update** typ, dnes neaktivní (dead code).
- **Kde:**
  - FE `Projekt-ikaros-FE/src/features/world/pages/api/useCharacterMutations.ts:42-57` — `UpdateCharacterInput` stále deklaruje `imageUrl?`, `publicBio?`, `publicInfoBlocks?: InfoBlock[]`, `accessRequirements?: AccessRequirement[]`.
  - BE `backend/src/modules/characters/dto/update-character.dto.ts:15-33` tato pole **NEMÁ** (jen slug/name/userId/isNpc/kind/diaryData/extraBlocks/campaignSubjectId/customData/expectedUpdatedAt). Schema je taky nemá.
  - Konzument: `useUpdateCharacter` (`useCharacterMutations.ts:104`) — grep `useUpdateCharacter\b` v celém `src` = **jen definiční soubor**, žádný volající → hook je sám dead code (name/bio postavy se po 9.1 edituje přes Page/`pages.service`, ne přímým `PATCH /characters`).
- **Dopad DNES: žádný.** Hook nikdo nevolá, tudíž `imageUrl/publicBio/...` se nikdy neodešlou → žádné 400 (`forbidNonWhitelisted:true`, `main.ts`). Latentní: kdyby se `useUpdateCharacter` zapojil a předal legacy pole, `PATCH` spadne na **400**.
- **Návrh (cleanup, low):** smazat `useUpdateCharacter` + `UpdateCharacterInput` legacy pole, nebo je zúžit na skutečná pole `UpdateCharacterDto`. Mrtvý typ mate kontrakt (přesně důvod, proč se čistil `CreateCharacterInput`). Migrace dat: NE.
- **L:** L2 (strukturálně; grep callerů potvrdil nevyužití).

---

## Souhrn pro registr

- **#🆕 = 1** (reziduální dead-code FE `UpdateCharacterInput`/`useUpdateCharacter`, 🟡 low, neaktivní).
- **🔓 3** (CH-D1/F-16, CH-D2/F-17, CH-D3/F-18) — vše VYŘEŠENO na HEAD; registr `form-schema-audit.md` (F-16/17/18) + `05-characters.md` (3× 🐛) jsou **stale**, doporučeno překlopit na ✅.
- **Žádný 🔴 / ⭐.** Nejzávažnější = doc/registr drift (3 „otevřené" 🐛, které kód už uzavřel).

## PROOF-REQUESTy (neběžely — L3→L4)

- **PROOF-M4-subdoc-merge** (CH-06 `diaryData` shallow-merge / CH-09 `customDataPatch` delta): round-trip A→B→A na živých datech — ověřit, že merge nezahodí klíče z jiných system presetů (`feedback_persist_across_variants`). Deprecated `UpdateDiaryInput.customData` full-replace stále v FE typu (`useCharacterMutations.ts:66`) — ověřit, že nový kód jede `customDataPatch`.
- **PROOF-M5-convert** (CH-convert `XF`): PC→NPC→PC round-trip — zachová subdoc data (finance/inventory), `isNpc` konzistentně dle přítomnosti `userId`.
- Doc housekeeping (mimo audit scope): F-16/F-17/F-18 → ✅ v registru; `05-characters.md` přepsat CH-D1/D2/D3 na vyřešené.
