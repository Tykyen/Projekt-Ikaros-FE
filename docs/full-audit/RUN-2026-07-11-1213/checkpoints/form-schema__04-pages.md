# Checkpoint — form-schema / 04-pages

> Oblast: `docs/form-schema-plan/04-pages.md` · registr `docs/form-schema-audit.md` (prefix `F-`)
> Styl: form-schema (FE validace ↔ BE DTO ↔ DB model ↔ mapper) · osy `EN` `WL` `TY` `SAN` `LN` `DF` · P1 + P5
> RUN 2026-07-11-1213 · READ-ONLY re-audit proti HEAD (BE `backend` + FE `Projekt-ikaros-FE`)

## Dosažená vs cílová L

- **Dosažená: L2** (statické čtení všech 4 vrstev vedle sebe: FE state/payload → DTO dekorátor → Mongoose `@Prop` → `toEntity` mapper; + FE render pro SAN/P5). Doslovné citace soubor:řádek.
- **Cílová: L2+** (běžná pole), **L3** pro `WL`/`NM` (tichá ztráta) — round-trip M4 (write→GET) neběžel (vyžaduje e2e stack). WL nález níže ověřen strukturálně (L2), nikoli round-tripem.

## Kontext: oblastní doc je STALE vůči HEAD

`04-pages.md` byl psán pro sweep 2026-06-05. Od té doby přibyl **write povrch, který doc v soupisu polí NEMÁ**:
`imageFocalX/Y/Zoom/Fit` (parita s GameEvent), `familyTree` (17.7 Rodokmen), `quickRef` (Pravidlová kniha), `moderationHidden`/`moderationHiddenReason` (B4b), `akjTabs[].ownerHidden`, `akjTabs[].locked`. Re-audit projel i tento nový povrch.

---

## Nálezy

### F-RUN-P1 🟡 🆕 — `WL`/`NM` `quickRef` je v DB+mapperu+FE read/render, ale CHYBÍ ve write DTO (latentní asymetrie)

- **[osa]** `WL` (P1 plný průchod pole) — pole existuje na 4 read místech, ale ne na write dráze.
- **Kde:**
  - DB: `backend/src/modules/pages/schemas/page.schema.ts:15` — `@Prop({ default: '' }) quickRef?: string;`
  - mapper (read): `backend/src/modules/pages/repositories/pages.repository.ts:256` — `quickRef: (doc.quickRef as string) ?? ''`
  - BE iface: `backend/src/modules/pages/interfaces/page.interface.ts:193`
  - FE read type: `Projekt-ikaros-FE/src/features/world/pages/api/pages.types.ts:197`
  - FE render: `.../PageViewer/layouts/OstatniLayout.tsx:128` `<QuickRef value={page.quickRef} />` + `.../components/QuickRef.tsx`
  - Set JEN seedem: `backend/src/modules/pages/rulebook/rulebook-seed-data.ts` + `pages-world-seed.listener.ts:119`
  - **CHYBÍ:** `CreatePageDto` / `UpdatePageDto` (`create-page.dto.ts` — žádné `quickRef`); `PageEditorFormState` (`usePageEditorState.ts` — neobsahuje quickRef → editor ho neposílá).
- **Dopad DNES: žádný.** Editor quickRef nikdy neposílá (není ve state), takže žádné 400 (`forbidNonWhitelisted`); `update` jede `$set` (`base-mongo.repository.ts:29`), takže edit stránky quickRef NEsmaže (přežije). Seed-authored, read/render-only pole. Bez ztráty dat.
- **Latentní riziko:** feature Pravidlová kniha (`ikaros_rulebook`, 🚧 F2–F6) počítá s per-svět editací. Až se do editoru přidá quickRef input, `PATCH` s `quickRef` **spadne na 400** (`forbidNonWhitelisted:true`, `main.ts`), dokud se pole nedoplní do DTO — přesně vzor field-checklist (`project_be_field_checklist`: „začni od mapperu; write dráha zapomenutá").
- **Návrh:** preventivně přidat `@IsOptional() @IsString() @MaxLength(...)` `quickRef` do `CreatePageDto` (PartialType ho propaguje do Update). Kdyby quickRef někdy nesl HTML/rich obsah pro HUD, sanitizovat v service jako `content` (dnes je to plain taháк — bez HTML render, `QuickRef.tsx` needituje přes dangerouslySetInnerHTML → SAN zatím neaktuální). **Migrace dat: NE.**
- **L:** L2 (strukturálně; round-trip neběžel).

---

## Známé nálezy — stav vůči HEAD (NEHLÁSit jako nové)

- **♻️ F-14 / PG-D2 (title bez server max) — VYŘEŠENO na HEAD.** `create-page.dto.ts:272-274` má `@IsString() @MaxLength(200) title` = shoda s FE `maxLength={200}`. Doc `04-pages.md:6,58,125,144` + `form-schema-audit.md` (F-14) stále vedou PG-D2 jako otevřený 🐛 → **doc je stale** (drobná dokumentační nesrovnalost, low; návrh: překlopit PG-D2/F-14 na ✅). Migrace: pokud v prod existuje title >200, `@MaxLength(200)` by je při PATCH odmítl (backfill kontrola) — ale to je pro už-nasazený limit.
- **♻️ F-15 / PG-D3 (`sections[].isCollapsed` DTO default `false` ↔ mapper `?? true`) — STÁLE PŘÍTOMNO, beze změny.** DTO `create-page.dto.ts:55-56` `isCollapsed: boolean = false`; mapper `pages.repository.ts:302` `(s.isCollapsed as boolean) ?? true`. Vědomý dluh (🟣, FE vždy posílá → latentní jen legacy doc). Bez regrese, bez eskalace.
- **♻️ PG-D1 (`slug` bez `@Matches`) — ⚖️ by-design drží.** Ověřeno: editor NEEXPONUJE slug input (`IdentityPanel.tsx` slug nemá; `useSlugAutoGen.setSlug`/`resetAutoGen` v `PageEditor.tsx` nevolány — jen `slug.slug` do payloadu). FIX-21 komentář „editor umožňuje ruční rename slugu" je nepřesný, ale service `ensureAvailableSlug` to bezpečně ošetří. Rationale beze změny.
- **✅ F-RUN-02 (customData SAN) + PT-36a (table.title SAN) — implementováno na HEAD.** `pages.service.ts:74-83` `sanitizeCustomData`, `:61` `title: sanitizeRichText(...)`. Doc PG-14 ještě píše „žádná value validace" (mírně stale, ale kód je bezpečnější) — bez nálezu.

---

## Pokrytí — nový write povrch (ověřeno, bez nálezu)

| Pole | FE → DTO → DB → mapper | Verdikt |
|---|---|---|
| `imageFocalX/Y/Zoom/Fit` | state+payload (`PageEditor.tsx:206-209`) → DTO `@ValidateIf(!==null) @IsNumber @Min/@Max` (`create-page.dto.ts:288-314`) → schema `default:null` (`page.schema.ts:19-23`) → mapper `?? null` (`pages.repository.ts:260-263`) + directory projekce (`:152-156`) | ✅ plný P1, čistá parita. L2 |
| `familyTree` (+ FamilyPerson/Union) | FE posílá JEN `type==='Rodokmen'` (`PageEditor.tsx:225,257`) → DTO `FamilyTreeDto` nested (`:133-145`) → schema `type:Object` (`:29-33`) → mapper whitelist people/unions subpolí (`:268-295`); service `create` type-gate (`pages.service.ts:352-355`) | ✅ P1 kompletní; type-flip risk vyloučen (mapper `!!doc.familyTree` bezpečný — familyTree jen na Rodokmen). Render `FamilyNode.tsx` plain-text JSX (React escape) → **žádné XSS** (P5 čisté). L2 |
| `akjTabs[].ownerHidden` | FE `AkjTab.ownerHidden` → DTO `@IsOptional @IsBoolean` (`:247-249`) → MixedArray → mapper `tab.ownerHidden` (`:362`) | ✅ plný chain. L2 |
| `akjTabs[].locked` | DTO ho přijme (`:260-262`, jinak forbidNonWhitelisted shodí PATCH) → service `sanitizeAkjTabs` strhne před save (`pages.service.ts:96`) → mapper ho NEmapuje (read-time enrich `filterAkjTabsForViewer`) → FE strip na loadu (`usePageEditorState.ts:107`) | ✅ runtime-only, správně ošetřeno napříč vrstvami. L2 |
| `moderationHidden`/`...Reason` | schema+mapper, server-set přes `setModerationHidden` (`pages.service.ts:654`), NENÍ v DTO, z directory FE response odstraněno (`:715`) | ⚖️ by-design (systémová cesta, ne editor). L2 |

Ostatní pole (PG-01…PG-19 z doc): beze změny vůči sweepu 2026-06-05, verdikty drží.

## PROOF-REQUESTy

- **PROOF-M4-quickRef** (volitelné, L3→L4): e2e — vytvoř stránku s `quickRef` v payloadu → očekávej **400** (`forbidNonWhitelisted`), potvrdí latentní riziko F-RUN-P1 dřív, než feature rulebook editace přijde. + round-trip: seed rulebook stránky → PATCH (edit content) → GET → ověř `quickRef` přežil (`$set` nesmazal).
- **PROOF-M4-imageFocal** (L4): round-trip `imageFocalX/Y/Zoom/Fit` write→GET (vč. `null` clear a hranic Min/Max) — nová pole bez existující round-trip pojistky.
- Doc housekeeping (mimo audit scope, jen flag): překlopit PG-D2/F-14 na ✅ (title `@MaxLength(200)` doplněn); doplnit do soupisu polí `04-pages.md` nový povrch (focal/familyTree/quickRef/ownerHidden/locked/moderationHidden).
