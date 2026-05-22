# Design audit 8.1 — edit UI detailu postavy

> **Stav:** podklad pro `plan-8.1.md` • **Datum:** 2026-05-22
> Spec: [spec-8.1.md](spec-8.1.md)

Audit edit vrstvy. **Princip: edit UI nesmí být nový vizuál** — splývá s read-only
detailem, mění se jen obsah karet (statický text → vstup). Žádný „editor" vzhled.

## 1. Vizuální jazyk (zjištěno)

Detail postavy: tmavé téma, karty `background var(--surface-2)` + `1px solid
var(--frame-border)` + `var(--radius-md)`. Nadpisy `var(--font-display)`, labely
uppercase `var(--text-xs)` `letter-spacing .05em`. Akcenty `--accent` / `--accent-bright`.
Rozteče `var(--sp-*)`. Privátní sekce = `dashed` rámeček.

> Nesrovnalost: `EditorStickyBar.module.css` používá starší token set
> (`--bg-panel`, `--border`, `--color-danger`) místo `--frame-border` / `--surface-2`.
> Nový `EditStickyBar` postavím na **tokenech detailu postavy**, ne kopií starého baru.

## 2. Edit zóna aktivního tabu

- Stejné karty jako read mód. Pole = `<input>` / `<textarea>` / `RichTextEditor`
  bez `readOnly`, uvnitř téže karty.
- Vstupy: `background var(--surface-3)`, rámeček `--frame-border`, focus → rámeček
  `--accent` (transition 120ms). Konzistentní výška, `var(--radius-md)`.
- **Signál edit módu:** nad obsahem tabu tenký pruh — ikona tužky + `Režim úprav:
  <název tabu>` v `--font-display`, barva `--accent-bright`. Decentní, ne křiklavý
  banner.
- Read i edit větev v jedné komponentě (prop `mode`) — žádné duplicitní stránky.

## 3. EditStickyBar

- Vzor `EditorStickyBar`: `position: sticky; bottom: 0`, `backdrop-filter: blur(8px)`,
  horní rámeček. Tokeny ale sjednoceny s detailem (`--frame-border`, panel surface).
- Vpravo: **Zrušit** (ghost — transparent + `--frame-border`) • **Uložit změny**
  (fill `--accent`, text `--text-on-accent`). Disabled při `!dirty` nebo `isPending`.
- Vlevo: indikátor `● Neuložené změny` (`--accent-bright`) když `dirty`.
- Spinner `Loader2` v tlačítku během mutace (vzor EditorStickyBar).
- Slide-up reveal při vstupu do edit módu (~150ms). Žádné další animace — utilitární.

## 4. Sdílené editory

- **SectionListEditor** (deník + výbava): sekce = karta — title input, obsah
  `RichTextEditor`, seznam položek. Položka = řádek `text` + `quantity` (number) +
  `note` + ikona koš. Pořadí: tlačítka ▲▼ (ne drag — spolehlivé na mobilu i a11y).
  Akce `+ Přidat položku`, `+ Přidat sekci` jako ghost tlačítka s `Plus` ikonou.
- **InfoBlockEditor** (bio): mřížka `infoGrid`, řádek = `label` + `value` input + koš.
  `+ Přidat údaj`.
- **AccessRequirementEditor** (Profil, jen PJ): řádek = `<select>` typ
  (UserId/AKJ/Role/AKJType) + vstup `value` (dle typu select/text) + koš. `+ Přidat
  pravidlo`. Reuse vzoru `PageEditor/panels/AccessPanel.tsx`.
- **SchemaValueEditor**: vstup dle `block.type` — `stat`→number, `bar`→number+max,
  `list`→tag/řádky, `text`→textarea.

## 5. Responsivita

- Sticky lišta: na ≤640px plná šířka, tlačítka `flex: 1` vedle sebe.
- Karty sekcí: stack. Položka sekce na ≤640px — `label/value`/`text+qty+note`
  inputy pod sebou (column), na desktopu v řádku.
- `infoGrid` zůstává `auto-fill minmax(220px,1fr)` — funguje i v edit módu.
- Skill `mobil-desktop` audit po implementaci (povinné).

## 6. Stavy a mikrointerakce

- Discard guard = shared `Modal` (`src/shared/ui/Modal`), ne `window.confirm`.
- Po uložení: toast „Uloženo" (shared toast), `dirty=false`, edit mód zůstává.
- Chyba mutace: toast s chybou, lišta zůstává, data nezahozena.
- Prázdné stavy v edit módu: místo „Deník je prázdný" rovnou `+ Přidat sekci`.
