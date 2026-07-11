# Checkpoint — form-schema / oblast 07-bestiae

> RUN-2026-07-11-1213 · styl **form-schema** (registr `docs/form-schema-audit.md`, prefix `F-`)
> Oblast: `docs/form-schema-plan/07-bestiae.md` — create/update/clone bestie + systemStats.
> READ-ONLY. Osy `RQ` `LN` `EN` `NL` `TY` · perspektiva P4 (systemStats → oblast 10).
> Dosažená hloubka **L2** (statický kontrakt FE payload ↔ BE DTO ↔ DB `@Prop` ↔ `toEntity` mapper + service,
> přímé čtení všech vrstev). Cílová L2+ (běžná pole) / L4 u NL-clear + red-team (PROOF-REQUEST ↓).

---

## Kontext: povrch oblasti VÝRAZNĚ narostl od sweepu 2026-06-05

Area file `07-bestiae.md` popisuje starý model (BE-01…BE-12): 3-hodnotový scope, top-level `abilities[]`,
žádný image-crop, žádná community, žádná moderace. Kód od té doby přidal (bez aktualizace area file):
- **16.2b-2 community scope** — nová 4. hodnota `scope:'community'`, mapa `statblocks` (systém→statblok),
  pole `latin/kind/tags/status/authorId/approvedAt/approvedBy`, 5 nových DTO + FE feature `ikaros/bestiar`.
- **image-crop** `imageFocalX/Y`, `imageZoom`, `imageFit` (parity s GameEvent/WorldNews).
- **description** (16.2h, veřejný popis, `@MaxLength(4000)`) oddělený od GM `notes`.
- **B5 moderace** `moderationHidden`/`moderationHiddenReason` (service-set).

Celý tento povrch je v area file **neauditovaný** → area file potřebuje refresh (viz F-RUN-BE-D0).

---

## Známé nálezy — stav (♻️ NEhlásit jako nové)

- **♻️ BE-D1 / F-09 `LN` imageUrl bez délkového limitu → OPRAVENO.** `@MaxLength(2048)` je nyní ve všech
  DTO: `create-bestie.dto.ts:35`, `update-bestie.dto.ts:27`, `create-community-bestie.dto.ts:49`,
  `update-bestie-lore.dto.ts:45`. Registr `form-schema-audit.md:155` = ✅ opraveno (návrh byl 2048). Shoda.
  Area file 07-bestiae.md ř.58/80/99 to stále vede jako otevřené 🐛 BE-D1 → **stale**.
- **♻️ BE-D2 / F-20 `TY`/`WL` abilities[] prvky nevalidované → VYŘEŠENO ODEBRÁNÍM.** Top-level pole
  `abilities` úplně zrušeno (D-NEW-BESTIE-ABILITIES-DUP) — chybí v DTO (`create-bestie.dto.ts:74-77`
  komentář), schema (`bestie.schema.ts:49-53`), interface (`bestie.interface.ts:32-34`) i FE typu
  (`types.ts:25-28`). Schopnosti žijí v `systemStats.abilities` (per-system, patří do oblasti 10).
  Area file ř.38/60/85/101 stále vede BE-07/BE-D2 → **stale**.

---

## Nové nálezy

### 🆕 F-RUN-BE-D3 · 🟠 `NL` — world bestii NELZE odebrat obrázek (clear se tiše ztratí)
- **Vrstvy:** FE `BestieEditorModal.tsx:105` `imageUrl: imageUrl.trim() || undefined`. HeroUploadCard
  „Odebrat" nastaví `onChange('')` (`HeroUploadCard.tsx:220`) → `''.trim() || undefined` = **`undefined`**.
  `undefined` se v JSON PATCH těle **vynechá** → BE `updateAtomic(id, dto)` `$set` (`bestiae.repository.ts:174`)
  klíč `imageUrl` nedostane → stará URL zůstává. Service orphan-cleanup `bestiae.service.ts:217`
  (`dto.imageUrl !== undefined`) se rovněž přeskočí.
- **Rozpor / co se stane:** PJ klikne Odebrat → Uložit → obrázek se **znovu objeví** (nikdy se nesmazal),
  blob osiří jen když se nahradí jiným. Nelze dosáhnout stavu „bez obrázku". Třída = historické F-07
  (world imageUrl clear), zde v bestie povrchu a jako **tichý no-op** místo 400.
- **Asymetrie:** community lore cesta to dělá SPRÁVNĚ — `ikaros/.../BestieEditorModal.tsx:90`
  posílá `imageUrl: imageUrl || ''` → BE `$set imageUrl:''` → smaže + emit orphaned
  (`bestiae.service.ts:441-447`). Dvě cesty, dvě různé clear-semantiky.
- **Dopad na existující data:** žádný (jen chování writu).
- **Návrh:** world modal posílat `imageUrl: imageUrl.trim()` (i prázdné `''`, ne `|| undefined`), stejně
  jako lore cesta; BE `''` už umí (`@IsOptional @IsString` bez `@IsUrl`). **PROOF-REQUEST L4:** round-trip
  set image → Odebrat → PATCH → GET, ověřit `imageUrl` je prázdné. **Priorita 2.**

### 🆕 F-RUN-BE-D4 · 🟡 `EN` — imageFit enum NEvynucen v community DTO (asymetrie s core DTO)
- **Vrstvy:** core cesta enum drží — `create-bestie.dto.ts:60` a `update-bestie.dto.ts:49`
  `@IsOptional @IsIn(['cover','contain'])`. Community cesta ne — `create-community-bestie.dto.ts:71-73`
  a `update-bestie-lore.dto.ts:66-68` mají jen `@IsOptional @IsString imageFit?: 'cover'|'contain'|null`
  (**bez `@IsIn`**). DB `bestie.schema.ts:42` `@Prop({ type: String, default: null })` bez `enum`.
- **Rozpor / co se stane:** red-team `POST /bestiae/community {imageFit:'evil'}` projde všemi vrstvami a
  uloží se; FE ho pak vloží do CSS `object-fit` (`imageStyle`) → neplatná hodnota. Community FE modal
  crop UI nemá (HeroUploadCard bez focal/zoom/fit props) → pole plní jen red-team, ale je dosažitelné.
- **Dopad na existující data:** žádný (FE nikdy neposílá; existing docs mají `null`).
- **Návrh:** sjednotit — `@IsIn(['cover','contain'])` do obou community DTO (+ příp. `enum` do schema).
  **PROOF-REQUEST L4 (M5):** red-team `imageFit:'x'` na `/bestiae/community`. **Priorita 3.**

### 🆕 F-RUN-BE-D5 · 🟡 `RN`/`TY` — community `tags[]` bez `@ArrayMaxSize` (per-prvek limit ano, počet ne)
- **Vrstvy:** `create-community-bestie.dto.ts:41-45` a `update-bestie-lore.dto.ts:37-41`:
  `@IsArray @IsString({each}) @MaxLength(40,{each})` — per-prvek 40 znaků, ale **žádný limit počtu prvků**.
  DB `bestie.schema.ts:69` `@Prop({ type: [String], default: undefined })` bez omezení. FE
  `ikaros/.../BestieEditorModal.tsx:50-53` split čárkou bez limitu počtu.
- **Rozpor / co se stane:** red-team pošle tisíce štítků → uloží se (payload/DB nafouknutí, filtr `kind`
  neovlivněn, ale index/render zátěž). Nízké — robustnost.
- **Dopad na existující data:** žádný.
- **Návrh:** `@ArrayMaxSize(20)` (nebo dle UI). **Priorita 4.**

### ♻️/meta F-RUN-BE-D0 · 🟡 doc — area file 07-bestiae.md zastaralý vůči kódu
- 07-bestiae.md vede 3-hodnotový `scope` (ř.32/54/71) — realita DB `enum ['system','user','world',
  'community']` (`bestie.schema.ts:26`), top-level `abilities` (ř.38/60/85) — **odebráno**, a BE-D1/BE-D2
  jako otevřené 🐛 (ř.99/101) — **opraveno**. Chybí celý povrch 16.2b-2 (community/statblocks), image-crop,
  `description`, moderace. **Návrh:** refresh matice + přidat řádky pro nová pole; uzavřít BE-D1/BE-D2. Ne blocker.

---

## Ověřeno ✅ (shoda napříč vrstvami, L2)

| Pole | FE | BE DTO | DB `@Prop` | mapper | Δ |
|---|---|---|---|---|---|
| scope (core) | select user/world/(system gated) `BestieEditorModal.tsx:225-233` | create `@IsIn 3` `:17`; clone `@IsIn 2` `:13` | `enum 4` (+community) `:26` | ✓ `:31` | ✅ ⚖️ community server-set (`service:371`), do generic create DTO nepatří |
| systemId | `[derived]` prop, create-only | create `@IsString @MinLength(1)` `:20-22`; update immutable | required `:31` | ✓ | ✅ shoda |
| worldId | `scope==='world'?worldId:undefined` `:131` | create/clone `@IsOptional @IsString` | opt sparse `:34` | ✓ | ✅ XF vynucen v service `:137-139` |
| name | trim+`if(!name.trim())`+`maxLength=100` `:90,178` | create/update `@MinLength(1)@MaxLength(100)` | required `:36` | ✓ | ✅ (⚖️ `' '` třída CT-01) |
| imageUrl | `trim()||undefined` (core) / `||''` (lore) | `@IsOptional @IsString @MaxLength(2048)` (vše) | opt `:37` | ✓ `:35` | ✅ délka OK (F-09 fix); **clear viz D3** |
| imageFocalX/Y | `hasImage?focal:null` `:107-108` | `@IsNumber @Min(0)@Max(100)` | Number default null `:39-40` | ✓ `:36-37` | ✅ range shoda |
| imageZoom | `hasImage?zoom:null` `:109` | `@IsNumber @Min(100)@Max(400)` | Number default null `:41` | ✓ `:38` | ✅ |
| imageFit | `hasImage?fit:null` `:110` (ImageFit=cover\|contain) | core `@IsIn`; **community jen @IsString** | String default null `:42` | ✓ `:39` | ⚠️ **community drift → D4** |
| notes | `notes.trim()` vždy, `maxLength=2000` `:111,266` | `@IsOptional @MaxLength(2000)` | default '' `:44` | ✓ `?? ''` `:40` | ✅ shoda |
| description | `description.trim()`, `maxLength=4000` `:112,213` | `@IsOptional @MaxLength(4000)` | default '' `:47` | ✓ `?? ''` `:41` | ✅ shoda (SAN: plain text, žádný `dangerouslySetInnerHTML` v bestiáři) |
| newName (clone) | `trim()||undefined`, `maxLength=100` `CloneBestieModal:96` | `@IsOptional @MinLength(1)@MaxLength(100)` | →name | ✓ | ✅ service `?? '(kopie)'` `:309` |
| clonedFromId/ownerUserId/deletedAt/moderationHidden(+Reason) | `[svc]` | **DTO nemá** (server-set; red-team → 400 forbidNonWhitelisted) | opt/default | ✓ `:43-46,57` | ✅ WL drží |
| community latin/kind/tags | `ikaros BestieEditorModal:146,159,50` maxLength 120/60/— | `@MaxLength 120/60`, tags each 40 | opt `:66-69` | ✓ `:50-52` | ✅ (tags počet → D5) |
| community statblocks | schvalovací tok | service-set (`propose/approve`), DTO `ProposeStatblockDto` `@IsObject` | Object default {} `:81` | ✓ `:57` | ✅ per-system staty → oblast 10 |

**systemStats (P4):** DTO jen `@IsObject`; validace `SystemStatsValidatorService` soft-mode
(`bestiae.service.ts:66-85,162`); world-scoped fallback na `entity_schema_versions` (16.2g F2).
Per-system parita/enum/min-max → **oblast 10** (`SY-xx`), zde neřešeno. Mapper vrací `?? {}`.

---

## Pokrytí

- **BE:** create/update/clone DTO, community DTO (create/lore/clone/propose), schema, repository (toEntity
  + všech 12 write metod), service (create/update/softDelete/restore/clone/community/moderation) — přečteno celé.
- **FE:** world `BestieEditorModal`, `CloneBestieModal`, `bestiarApi`, `types` + community `BestieEditorModal`,
  `InsertToBestiaryModal`, `komunitniBestiarApi`, `types` — přečteno celé. HeroUploadCard clear ověřen.
- **Neřešeno (mimo záběr):** systemStats per-system parita (oblast 10); ProposeStatblock/comments logika
  (patří spíš do bug/role-plánu); L3 test-exekuce (spec soubory existují: `useBestieMutations.spec`,
  `Drd16BestieForm.spec`, `BestieDetail.systems.spec` — nespuštěny, READ-ONLY).

## PROOF-REQUESTy
- **PR-D3 (L4, M4 round-trip):** world bestie set image → HeroUploadCard Odebrat → Uložit → GET → ověřit
  `imageUrl` prázdné (očekává selhání = potvrzení D3).
- **PR-D4 (L4, M5 red-team):** `POST /bestiae/community {imageFit:'garbage'}` → očekává 400 (nyní projde).
- **PR-D5 (L4, M5 red-team):** `POST /bestiae/community` s 1000 tags → očekává odmítnutí (nyní projde).

## Metodika / jistota
L1-L2 statické čtení všech vrstev (M1). Nálezy D3/D4/D5 odvozeny deterministicky z rozporu vrstev
(HeroUploadCard clear ověřen čtením). L4 vyžaduje round-trip/red-team (PROOF-REQUESTy). Žádný 🔴,
žádná migrace dat. Dosažená **L2**, oblast kontrakt konzistentní kromě 3 nových nálezů (1× 🟠 NL, 2× 🟡).
