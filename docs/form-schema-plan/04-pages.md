# 04 — Pages (Create/UpdatePageDto)

> **Entita:** `Page` (wiki / AKJ / PostavaHrace / NPC / Lokace) · **write path:** `POST /worlds/:worldId/pages` + `PATCH /worlds/:worldId/pages/:id`.
> **FE styl:** **inline** (`usePageEditorState` reducer + `useState`), **bez zod**. Jediná „validace" je `canSave = title.trim() && slug` v `PageEditor.tsx`.
> **Osy:** `EN` `WL` `TY` `SAN` · perspektivy **P1** (plný průchod nested polí) + **P5** (sanitizace rich-textu).
> Nálezy → [`../form-schema-audit.md`](../form-schema-audit.md) (`F-xx`). Stav: ✅ **sweep proběhl 2026-06-05** — 2× 🐛 (PG-D2 title bez server max, PG-D3 isCollapsed DF), zbytek ✅/⚖️.

Vrstvy: **FE** [usePageEditorState.ts](../../src/features/world/pages/PageEditor/hooks/usePageEditorState.ts) + panely · **FE submit** [PageEditor.tsx](../../src/features/world/pages/PageEditor/PageEditor.tsx) ·
**BE DTO** [create-page.dto.ts](../../../Projekt-ikaros/backend/src/modules/pages/dto/create-page.dto.ts) · [update-page.dto.ts](../../../Projekt-ikaros/backend/src/modules/pages/dto/update-page.dto.ts) ·
**DB** [page.schema.ts](../../../Projekt-ikaros/backend/src/modules/pages/schemas/page.schema.ts) ·
**mapper** [pages.repository.ts](../../../Projekt-ikaros/backend/src/modules/pages/repositories/pages.repository.ts) `toEntity` ·
**SAN** [sanitize-rich-text.ts](../../../Projekt-ikaros/backend/src/common/utils/sanitize-rich-text.ts) + [pages.service.ts](../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts).

> `UpdatePageDto extends PartialType(CreatePageDto)` → všechna pole optional + `expectedUpdatedAt` (filtrované před persist). Všechna pravidla níže = z `CreatePageDto`.

---

## Soupis polí (povrch oblasti)

Pole z editoru → DTO. „FE form" = kde to uživatel zadává; FE validace inline/žádná → samo o sobě kandidát.
Nested kontejnery (`sections[]`, `akjTabs[]`, …) rozepsané jako pod-body níže (P1 rekurze, mini-formulář).

| # | Pole | Typ | Kde FE | Hl. osa |
|---|---|---|---|---|
| PG-01 | `slug` | string | `useSlugAutoGen` (auto z title, skrytý) | `RG` `WL` |
| PG-02 | `type` | enum `PAGE_TYPES` | `IdentityPanel` select | `EN` |
| PG-03 | `title` | string | `IdentityPanel` input `maxLength={200}` | `RQ` `LN` |
| PG-04 | `content` | HTML | `ContentPanel` (TipTap) | `SAN` |
| PG-05 | `imageUrl` | string | `HeroUploadCard` (upload) | `NL` |
| PG-06 | `bigImage` | bool | `IdentityPanel` checkbox | `TY` |
| PG-07 | `isWoodWide` | bool | `IdentityPanel` checkbox | `TY` |
| PG-08 | `order` | number | (interní, ve state) | `TY` `RN` |
| PG-09 | `sections[]` | array obj | `SectionsPanel` | `WL` `SAN` `TY` |
| PG-10 | `galleryImages[]` | array obj | `GalleryPanel` (type Galerie) | `WL` `TY` |
| PG-11 | `videos[]` | array obj | `VideosPanel` (type Obrazovka) | `WL` `RG` |
| PG-12 | `menu[]` | array obj | `MenuPanel` (type Seznam) | `WL` `TY` |
| PG-13 | `table` | obj | `DataTemplatePanel` + `TablePanel` | `SAN` `TY` |
| PG-14 | `customData` | Record | `CustomDataPanel` (type Noviny) | `TY` `WL` |
| PG-15 | `accessRequirements[]` | array obj | (access UI) | `EN` `WL` |
| PG-16 | `akjTabs[]` | array obj | `AkjTabsPanel` | `EN` `WL` `SAN` |
| PG-17 | `ownerUserId` | string | `PostavaPanel` (PC) | `WL` |
| PG-18 | `characterRef` | obj | (interní, BE generuje) | `WL` |
| PG-19 | `expectedUpdatedAt` | string | state (optimistic lock) | `NL` |

> **Pozn. WL:** DTO obsahuje navíc `isWoodWide` (✓ mapper), `accessRequirements` (✓), `order` (✓). Pole `plainText` je BE-derived (`tipTapExtractor`), FE ho neposílá → mimo audit. `type='Lokace'` nemá vlastní panel — character se zakládá BE-side.

---

## Matice pole × vrstva

> Buňka = pravidlo na dané vrstvě (`—` = vrstva pole neomezuje). **Δ** = verdikt parity, plní sweep.
> Pravidla doplněná z přípravné inventury; **Δ se uzavírá až při sweepu**.

| # | Pole | FE (inline) | BE DTO | DB `@Prop` | mapper `toEntity` | Δ |
|---|---|---|---|---|---|---|
| PG-01 | slug | auto-slugify `[^a-z0-9]+→-`, `canSave: len>0` | `@IsString` (req) | `required:true` | ✓ `doc.slug` | ⚖️ by-design (žádný `@Matches`; service `.toLowerCase()`+unique; ruční edit by prošel, ale FE slug skrytý) → **PG-D1** |
| PG-02 | type | `<select>` z `ALL_PAGE_TYPES` | `@IsIn(Object.values(PAGE_TYPES))` | `required, default 'Ostatní'`, **bez enum** | ✓ `doc.type` | ⚖️ by-design (FE iface = BE iface 1:1 přes export; DTO `@IsIn` vynutí; DB bez enum jen legacy-safe) |
| PG-03 | title | `maxLength={200}` (HTML attr) + `canSave: trim>0` | `@IsString` (req), **bez MaxLength** | `required:true` | ✓ | 🐛 rozpor → **PG-D2** (FE 200 vs BE/DB bez limitu; required ✓ 3-vrstvě) |
| PG-04 | content | TipTap HTML (volné) | `@IsString` opt | `default ''` | ✓ `?? ''` | ✅ shoda (SAN: service `sanitizeRichText`, allowlist = TipTap schema) |
| PG-05 | imageUrl | string z uploadu, `\|\| undefined` | `@IsString` opt, **ne `@IsUrl`** | `@Prop()` — | ✓ | ⚖️ by-design (`@IsString` ne `@IsUrl` — povolí Cloudinary i `''`; delete sémantika konzistentní) |
| PG-06 | bigImage | checkbox bool | `@IsBoolean` opt | `default false` | ✓ `?? false` | ✅ shoda |
| PG-07 | isWoodWide | checkbox bool | `@IsBoolean` opt | `default false` | ✓ `?? false` | ✅ shoda |
| PG-08 | order | number ve state (init 0) | `@IsNumber` opt | `default 0` | ✓ `?? 0` | ⚖️ by-design (žádný `@Min`/`@IsInt`; FE žádné UI — interní reorder) |
| PG-09 | sections[] | inline reducer, viz pod-body | `@ValidateNested({each})` `PageSectionDto` | `[MixedArraySubSchema]` (volné) | ✓ explicit re-map | ⚠️ ověřit (DTO defaulty vs MixedArray; viz pod-body) |
| PG-10 | galleryImages[] | inline | `@ValidateNested({each})` `GalleryImageDto` | `[MixedArraySubSchema]` | ✓ explicit | ✅ shoda (DTO+mapper re-map id/url/caption/order) |
| PG-11 | videos[] | inline + `parseYouTubeVideoId` guard | `@ValidateNested({each})` `InstructionalVideoDto` | `[MixedArraySubSchema]` | ✓ explicit | ⚖️ by-design (youtubeUrl `RG` jen FE guard; BE `@IsString` — viz pod-body) |
| PG-12 | menu[] | inline | `@ValidateNested({each})` `MenuItemDto` | `[MixedArraySubSchema]` | ✓ `order ?? 0` | ✅ shoda |
| PG-13 | table | inline (`hasTable` gate před send) | `@ValidateNested` `PageTableDto` | `type:Object` | ✓ `normalizePageTable` | ✅ shoda (SAN: service `sanitizeTable→sanitizeRichText`) |
| PG-14 | customData | inline Record<string,string> | `@IsObject` opt | `type:Object, default {}` | ✓ `?? {}` | ⚖️ by-design (žádná value validace; jen type Noviny, volné key/value) |
| PG-15 | accessRequirements[] | (access UI) | `@ValidateNested({each})` `AccessRequirementDto` | `[MixedArraySubSchema]` | ✓ explicit | ✅ shoda (`@IsIn(['UserId','AKJ','Role','AKJType'])` + mapper všechny 4 — D-072 vyřešen) |
| PG-16 | akjTabs[] | inline, viz pod-body | `@ValidateNested({each})` `AkjTabDto` | `[MixedArraySubSchema]` | ✓ explicit + co | ⚠️ ověřit (nested; viz pod-body — DTO bez `sections`/`infoBlocks`) |
| PG-17 | ownerUserId | `\|\| undefined` (PC) | `@IsString` opt | `@Prop() index` | ✓ `\|\| undefined` | ⚖️ by-design (service gate: jen `type==='Postava hráče'`, jinak `undefined`) |
| PG-18 | characterRef | FE neposílá (BE generuje) | `@ValidateNested` `CharacterRefDto` | `type:Object` | ✓ | ⚖️ by-design (FE-out-of-scope write; BE auto-create v service) |
| PG-19 | expectedUpdatedAt | `?? undefined` (jen edit) | `@IsString` opt (jen Update) | N/A (filtrované před persist) | N/A | ✅ shoda (service `const {expectedUpdatedAt:_,...persistDto}` vyřízne; 409 `PAGE_CONFLICT`) |

### PG-09 `sections[]` — pod-body (P1 rekurze, `PageSectionDto`)

| Podpole | FE | BE DTO | DB | mapper | Δ |
|---|---|---|---|---|---|
| `id` | `crypto.randomUUID` | `@IsString` req | MixedArray | ✓ | ✅ shoda |
| `title` | input | `@IsString` req | — | ✓ `?? ''` | ✅ shoda |
| `content` | TipTap HTML | `@IsString` `=''` default | — | ✓ `?? ''` | ✅ shoda (SAN: service `sanitizeRichText(sec.content)` v create i update) |
| `order` | inline | `@IsNumber` `=0` | — | ✓ `?? 0` | ✅ shoda |
| `isCollapsed` | inline | `@IsBoolean` `=false` | — | ✓ `?? true` ⚠ | 🐛 rozpor → **PG-D3** (DTO default `false` vs mapper fallback `true`) |
| `items[]` | inline `PageSectionItemDto` | `@ValidateNested({each})` | — | ✓ explicit | ✅ shoda (`id/text` req, `quantity/note` opt — 3-vrstvě) |

### PG-11 `videos[]` — pod-body (`InstructionalVideoDto`)

| Podpole | FE | BE DTO | DB | mapper | Δ |
|---|---|---|---|---|---|
| `id` | UUID | `@IsString` req | MixedArray | ✓ | ✅ shoda |
| `title` | input (`\|\| 'Bez názvu'`) | `@IsString` req | — | ✓ `?? ''` | ✅ shoda |
| `youtubeUrl` | `buildYouTubeUrl(id)` | `@IsString` req (žádný URL regex) | — | ✓ `?? ''` | ⚖️ by-design (FE `parseYouTubeVideoId` regex guard ≠ BE `@IsString`; FE-only pojistka, přímý API by pustil) |
| `youtubeVideoId` | `parseYouTubeVideoId` | `@IsString` req | — | ✓ `?? ''` | ⚖️ by-design (FE 11-znak regex ≠ BE `@IsString`) |

### PG-13 `table` — pod-body (`PageTableDto`, osa SAN)

| Podpole | FE | BE DTO | DB | service SAN | Δ |
|---|---|---|---|---|---|
| `hasTable` | bool gate | `@IsBoolean` req | type:Object | — | ✅ shoda (FE odešle jen když true; mapper `t.hasTable === true`) |
| `title` | input | `@IsString` opt | — | — | ✅ shoda |
| `headers[]` | string[] HTML | `@IsString({each})` opt | — | ✓ `sanitizeTable→sanitizeRichText` | ✅ shoda (SAN allowlist = content) |
| `values[]` | string[] HTML | `@IsString({each})` opt | — | ✓ `sanitizeRichText` | ✅ shoda (SAN + `normalizePageTable` legacy `{text,link}`/string → HTML) |

### PG-16 `akjTabs[]` — pod-body (P1, `AkjTabDto`, osy EN+SAN+WL)

| Podpole | FE | BE DTO | DB | mapper/SAN | Δ |
|---|---|---|---|---|---|
| `id` | UUID | `@IsString` req | MixedArray | ✓ | ✅ shoda |
| `name` | input | `@IsString` req | — | ✓ `?? ''` | ✅ shoda |
| `order` | inline (reindex) | `@IsNumber` `=0` | — | ✓ `?? 0` | ✅ shoda |
| `access[]` | inline (clearance/role/userId) | `@ValidateNested({each})` `AccessRequirementDto` | — | ✓ explicit | ✅ shoda (`@IsIn` 4 hodnoty + mapper všechny 4) |
| `contentOverride.imageUrl` | `HeroUploadCard` | `@IsString` opt | — | ✓ | ✅ shoda |
| `contentOverride.content` | TipTap HTML | `@IsString` opt | — | ✓ `sanitizeAkjTabs→sanitizeRichText` | ✅ shoda (SAN; sanitizuje jen když `co.content !== undefined`) |
| `contentOverride.table` | `TablePanel` | `@ValidateNested` `PageTableDto` | — | ✓ `sanitizeTable` + `normalizePageTable` | ✅ shoda (SAN) |

> ⚠ DTO `AkjTabContentOverrideDto` **nemá** `sections` ani `infoBlocks` — service komentář je zmiňuje, ale FE typ `AkjTabContentOverride` je taky **nemá** (jen `imageUrl/content/table`). FE ↔ DTO se shodují → ⚖️ by-design (stale service komentář, ne data-loss path).

---

## Kontrolní body (co u každého pole ověřit při sweepu)

- **PG-01 `RG`/`WL`** — slug: FE auto-slugify produkuje `[a-z0-9-]`, ale DTO `@IsString` **bez `@Matches`**, DB bez patternu. Service dělá `.toLowerCase()`. Ruční edit slugu (`useSlugAutoGen.setSlug`) → může poslat libovolný string; BE nevynutí formát. Unikátnost: `PageSchema.index({worldId,slug},{unique})` + service `existsBySlugAndWorld` (`PAGE_SLUG_TAKEN`). *(hot)*
- **PG-02 `EN`** — `PAGE_TYPES` **3 kopie**: FE `pages.types.ts`, BE iface `page.interface.ts`, DTO čte `Object.values(PAGE_TYPES)` z iface. DB `@Prop` type bez `enum` → DB nevynutí (legacy hodnota projde). Množinová shoda FE↔BE + zdroj (latentní drift). *(hot)*
- **PG-03 `LN`/`RQ`** — title: FE `maxLength={200}` (jen HTML attr, ne tvrdá validace), DTO `@IsString` **bez `@MaxLength`**, DB `required`. Required sedí 3-vrstvě. Délka: nikdo server-side nevynutí → 201+ se uloží i 10k znaků. *(hot — chybějící server limit)*
- **PG-04 `SAN`** — content: DTO jen `@IsString`, **skutečné pravidlo v service** `sanitizeRichText` (allowlist: p/h2/h3/blockquote/b/i/s/u/ul/ol/li/a/img/table.../code/span/sub/sup; styles jen `color`; schemes http/https/mailto). Drift FE TipTap schema ↔ allowlist = tichá ztráta formátování; opačně = uložené XSS. Ověř paritu TipTap extensions ↔ allowedTags. *(P5)*
- **PG-05 `NL`** — imageUrl: FE pošle `state.imageUrl \|\| undefined`. „Smazat hero" → pošle `''` nebo undefined? DTO `@IsString` (ne `@IsUrl`) `''` pustí. Round-trip: po deletu GET vrací `''` nebo pole chybí?
- **PG-09 `WL`/P1** — sections: DTO má **defaulty na úrovni instance** (`content=''`, `order=0`, `isCollapsed=false`) — projdou jen při `@ValidateNested` transformaci? DB `MixedArraySubSchema` (volný). Mapper re-mapuje explicitně → pole mimo `id/title/content/order/isCollapsed/items` **se zahodí** (whitelist v `toEntity`). Ověř, že FE neposílá podpole, které mapper nezná.
- **PG-09 `isCollapsed` default rozpor** — DTO default `false` ↔ mapper fallback `?? true`. Pokud klient pole vynechá: DTO dosadí `false`, ale při čtení staré DB hodnoty (chybí) mapper vrátí `true`. Nekonzistence DF.
- **PG-11 `RG`** — videos: FE `parseYouTubeVideoId` odmítne neplatnou URL **před** přidáním; BE DTO `youtubeUrl`/`youtubeVideoId` jen `@IsString` → přímý API request s nesmyslem projde. FE-only guard.
- **PG-13 `SAN`** — table headers/values: rich-text HTML, sanitizováno `sanitizeTable→sanitizeRichText` (stejný allowlist jako content). `normalizePageTable` v mapperu normalizuje legacy tvary (`{text,link}` objekty, holé stringy) — round-trip starých dat. *(P5)*
- **PG-15/PG-16 `EN`** — `AccessRequirement.type ∈ {UserId,AKJ,Role,AKJType}`: DTO `@IsIn([...])` ✓, ale **D-072** — FE má `'AKJType'`, repository mapper/DTO ho historicky přehlížely (komentář v `pages.types.ts`). Ověř, že DTO `@IsIn` i mapper dnes `AKJType` znají (oba vypadají kompletní — potvrdit).
- **PG-16 `SAN`/`WL`/P1** — akjTabs: nejhlubší nested. `contentOverride.content` + `.table` sanitizováno (`sanitizeAkjTabs`). DTO `AkjTabContentOverrideDto` má jen `imageUrl/content/table` — žádné `sections`/`infoBlocks` přes komentář v service je zmiňuje → ověř, že FE override neposílá víc, než DTO/SAN zná (jinak tichá ztráta). Prázdné `akjTabs:[]` (smazání všech) musí projít (service: „truthy" check).
- **PG-17 `WL`** — ownerUserId: service gate `dto.type === 'Postava hráče' ? dto.ownerUserId : undefined` — pro ne-PC typy se zahodí i kdyby FE poslal. Vědomé zúžení; ověř, že FE pro PC vždy posílá.
- **PG-19 `NL`** — expectedUpdatedAt: service ho `destructure` vyřízne před persist (`const { expectedUpdatedAt:_, ...persistDto }`). Vynechání = bez 409 check (vědomé přepsání: `confirmSaveExisting`, `handleOverwriteConflict`).

---

## Delta parity (plní sweep)

> Sweep 2026-06-05. Verdikt ověřen doslovným čtením všech vrstev (FE soubor:řádek · BE DTO · DB · mapper).
> Globální `ValidationPipe({ whitelist:true, transform:true })` ([main.ts:15]) — **bez** `forbidNonWhitelisted` → neznámá pole se tiše strippnou (žádné 400).

**PG-D2** `title` — FE: `maxLength={200}` jen HTML attr ([IdentityPanel.tsx:71]), `canSave: trim>0` ([PageEditor.tsx:155]) · BE DTO: `@IsString` **bez `@MaxLength`** ([create-page.dto.ts:186-187]) · DB: `@Prop({ required:true })` bez limitu ([page.schema.ts:12]) · **rozpor:** žádný server-side délkový limit → přímý API request (nebo paste >200 obejde HTML attr) uloží title libovolné délky (10k+ znaků). Required ✓ 3-vrstvě (FE canSave + DTO + DB). · **dopad na data:** přidání `@MaxLength(200)` na DTO → backfill kontrola existujících delších titulů na živém serveru (migrace **podmíněně ano** — jen pokud nějaký >200 existuje, jinak ne). · **návrh:** přidat `@MaxLength(200)` do `CreatePageDto.title` (sjednotná hranice s FE); volitelně shodný limit na `name` postavy (CH-02, vázané). Závažnost 🟡 (drift / chybějící server limit — ne ztráta dat, ne 400 dnes).

**PG-D3** `sections[].isCollapsed` — FE: bool ve state, vždy posílá ([usePageEditorState] section objekty kompletní) · BE DTO: `@IsBoolean isCollapsed = false` default ([create-page.dto.ts:51-52]) · DB: MixedArray (volné, bez default) · mapper: `(s.isCollapsed as boolean) ?? true` ([pages.repository.ts:217]) · **rozpor:** DF nekonzistence — DTO default při vynechání `false`, ale mapper fallback při čtení staré/chybějící hodnoty `true`. Klient pole nikdy nevynechá (FE posílá vždy), takže **dnes se neprojeví** v běžném flow; latentní jen pro legacy doc bez pole nebo přímý API bez `isCollapsed`. · **dopad na data:** žádný (latentní, neaktivní cesta) — sjednocení na jeden default nevyžaduje migraci. · **návrh:** sjednotit mapper fallback `?? true` → `?? false` (shoda s DTO defaultem). Závažnost 🟡 (drift, latentní).

**PG-D1** `slug` (flagged, verdikt ⚖️ by-design) — FE: auto-slugify `[^a-z0-9]+→-` ([slugify.ts:11-18]), slug v UI skrytý, ruční edit jen přes `useSlugAutoGen.setSlug` (žádné UI volání) · BE DTO: `@IsString` **bez `@Matches`** ([create-page.dto.ts:180-181]) · DB: `required:true`, unique index `{worldId,slug}` ([page.schema.ts:9,59]) · service `.toLowerCase()` + `existsBySlugAndWorld` (`PAGE_SLUG_TAKEN`) ([pages.service.ts:148-154]). · **proč ne 🐛:** FE produkuje vždy validní slug, UI needituje slug ručně; přímý API s nevalidním slugem by prošel formátově, ale `.toLowerCase()` + unique index brání duplicitě a viewer route to snese. Formátová garance je vědomě jen FE-side. Pokud se v budoucnu otevře ruční edit slugu, doplnit `@Matches(/^[a-z0-9-]+$/)` do DTO.

## Round-trip / migrační poznámky

> _PG-13 `normalizePageTable` = round-trip legacy table tvarů (string[] / {text,link} → HTML string) — ověřit M4 A→B→A. PG-02 přidání DB `enum` na `type` by zneplatnilo legacy hodnoty (migrace). PG-03 přidání `@MaxLength` na title → backfill kontrola existujících delších titulů na živém serveru. PG-09 `isCollapsed` DF rozpor (false vs true) — round-trip vynechaného pole._
