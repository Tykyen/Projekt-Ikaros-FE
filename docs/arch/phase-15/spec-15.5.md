# Spec 15.5 — Osnovy & šablony stránek (obsahová osnova)

**Stav:** návrh (čeká schválení) · **Fáze:** 15 · **Roadmap:** [§15.5](../../roadmap2.md) · **Dluh:** D-NEW-INV-WIKI (částečně)
**Varianta B (schváleno v brainstormingu):** rozšířit **stávající** per-svět šablonu `WorldPageTemplate` o jedno pole „obsahová osnova" (rich-text kostra). Žádný nový vazební koncept na typ stránky.

## 0. Princip

Dnešní šablona stránky drží **jen strukturu datové tabulky** (`headers`, `defaultTitle`). Po výběru dostane PJ prázdné buňky + **prázdný textový editor**. 15.5 přidá šabloně druhou složku — **osnovu textového těla** (nadpisy + návodné prompty), která se při zakládání stránky vloží do `page.content`.

```
WorldPageTemplate { headers[], defaultTitle, +contentOutline }
        │ výběr v editoru (DataTemplatePanel)
        ├─ headers/defaultTitle ──▶ state.table        (jako dnes)
        └─ contentOutline ────────▶ state.content       (NOVÉ, jen když je content prázdný)
```

## 1. Rozhodnutá designová volba (ke schválení)

| # | rozhodnutí | proč |
|---|---|---|
| R1 | Osnova = **rich-text HTML string** (`contentOutline`), ne seznam holých nadpisů | Roadmapa mluví o „obsahových **promptech**" — potřebujeme i návodný text pod nadpisem (kurzíva „sem napiš jak postava vypadá"), odrážky, ne jen `<h2>`. Reuse stávajícího `RichTextEditor`, formát 1:1 s `page.content` → žádný generátor/parser. |
| R2 | Osnova se vkládá do `content` **jen když je content prázdný** | Výběr šablony běží i v edit mode (DataTemplatePanel). Vkládat osnovu vždy by **přepsalo napsaný text**. „Prázdný content" splní „při zakládání" (nová stránka) a nikdy nepřepíše práci. |
| R3 | Osnova je **per-svět, editovatelná PJ-em** (jako headers) | Konzistentní se stávajícími šablonami; odpovídá otevřené otázce roadmapy „editovatelné PJ per svět vs. fixní platformové". |
| R4 | Editor osnovy běží **bez** `enableTable` | TipTap u `page.content` `<table>` tiše zahodí ([project_page_content_no_tables]). Bez table extension PJ tabulku ani nevloží → past řešena u kořene. |
| R5 | Osnova se **sanitizuje při uložení šablony** (`sanitizeRichText`) | Osnova je HTML, co poteče do `content`. Sanitizace u zdroje = žádné uložené XSS čekající na vložení. Druhá sanitizace v `pages.service` při create zůstává jako fallback. |

## 2. Datový model

### 2.1 BE `WorldPageTemplate` — nové pole `contentOutline`
| pole | typ | default | poznámka |
|---|---|---|---|
| `contentOutline` | `string?` | `undefined` | sanitizovaný TipTap HTML; prázdné = šablona bez osnovy (BC) |

Dotčená místa (field-drift checklist — [project_be_field_checklist], pořadí od mapperu):
1. **`repositories/world-page-templates.repository.ts` `toEntity`** — `contentOutline: doc.contentOutline as string | undefined` *(jinak GET tichá ztráta — KRITICKÉ první)*
2. `schemas/world-page-template.schema.ts` — `@Prop() contentOutline?: string;`
3. `interfaces/world-page-template.interface.ts` — `contentOutline?: string;`
4. `dto/create-world-page-template.dto.ts` — `@IsOptional() @IsString() @MaxLength(100_000) contentOutline?: string;` (update DTO dědí přes `PartialType`)
5. `world-page-templates.service.ts` `create`+`update` — předat `contentOutline` + **sanitizovat** přes `sanitizeRichText` (R5)

### 2.2 FE typ — `worldPageTemplates.types.ts`
- `WorldPageTemplate.contentOutline?: string`
- `CreateWorldPageTemplateInput.contentOutline?: string` (`UpdateWorldPageTemplateInput` dědí)

## 3. Architektura (FE)

### 3.1 Editace osnovy — `TemplateEditorModal.tsx`
Pod sekci „Hlavičky" přidat sekci **„Osnova obsahu (volitelné)"** s `RichTextEditor`:
- `value=outline`, `onChange=setOutline`, **bez `enableTable`** (R4), `maxLength=100_000`
- placeholder: „Předvyplněný text stránky — nadpisy a návodné prompty (např. ## Vzhled, ## Motivace…)"
- bez image-upload/wikilink (osnova je generická kostra, ne konkrétní stránka)
- `handleSubmit` přidá `contentOutline: outline.trim() || undefined`; hydrate při otevření z `existing.contentOutline`

### 3.2 Vložení osnovy — `DataTemplatePanel.tsx`
Dnes panel mění jen `state.table`. Rozšířit:
- nové props: `content: string`, `onApplyOutline: (html: string) => void`
- helper `isContentEmpty(html)` → `true` pro `''` / `<p></p>` / whitespace
- v `applyTemplate(t)`: po nastavení tabulky, pokud `t.contentOutline` a `isContentEmpty(content)` → `onApplyOutline(t.contentOutline)`
- **warning modal beze změny** — content se nikdy nepřepíše (R2), takže žádné nové potvrzení; warning zůstává čistě o tabulce
- karta šablony: pokud má osnovu, drobný indikátor (např. „+ osnova" v `cardDesc`)

### 3.3 Napojení — `PageEditor.tsx`
`<DataTemplatePanel … content={state.content} onApplyOutline={(html) => setField('content', html)} />`

## 4. Matrix seed (volitelné, v rámci kroku)
`world-page-templates.matrix-seed.ts` — doplnit `contentOutline` k 6 výchozím šablonám (Stát/Město/Frakce/…) jako ukázku. Seed je idempotentní a **neaktualizuje** existující záznamy → na již naseedovaném Matrixu se osnovy nedoplní samy (PJ je dopíše ručně, nebo jednorázová migrace mimo scope).

## 5. Dotčená místa — souhrn
**BE:** schema · interface · create-DTO · service (create+update, sanitize) · repository `toEntity` · matrix-seed · `world-page-templates.service.spec.ts` (rozšířit).
**FE:** `worldPageTemplates.types.ts` · `TemplateEditorModal.tsx` (+ CSS) · `DataTemplatePanel.tsx` (+ test) · `PageEditor.tsx`.

## 6. Ověření
- BE: `npx jest --maxWorkers=2` (dotčené suites world-page-templates) — [project_be_test_mongo_flaky]
- FE: `tsc -b` + vitest `DataTemplatePanel`/`PageTemplatesTab` + **`npm run build`** ([project_fe_build_preexisting_errors])
- `mobil-desktop` (TemplateEditorModal — nový editor v modalu), `funkce` + `napoveda` před commitem
- po BE změně **restart** ([feedback_be_restart_required]) — jinak ValidationPipe whitelist dropne `contentOutline`

## 7. Hranice scope
- **Žádná** vazba osnovy na typ stránky (PAGE_TYPES) — varianta A zamítnuta.
- Žádné substituční proměnné/templating (`{{location}}`), žádné AI generování.
- Osnova **nepřepisuje** existující text — kdo chce osnovu do rozepsané stránky, smaže text a přepne šablonu (nebo zkopíruje ručně).
- Předvyplnění **hodnot** tabulky (`values`) zůstává mimo — šablona dál dává jen prázdné buňky.

## 8. Otevřené (neblokuje start)
- Indikátor „+ osnova" na kartě v DataTemplatePanel — finální text/ikona při implementaci.
- Migrace osnov do už naseedovaného Matrixu — zatím ruční, případně samostatný skript.
