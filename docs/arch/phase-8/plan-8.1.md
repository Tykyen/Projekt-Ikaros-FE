# Implementační plán 8.1 — Detail postavy: editační vlna

> **Stav:** provedeno (2026-05-22) • **Datum:** 2026-05-22
> Spec: [spec-8.1.md](spec-8.1.md) • Design: [design-8.1.md](design-8.1.md)

Postup po krocích. Každý krok = jeden commit na `main`. Pořadí: nejdřív základ
(BE + mutace + skelet edit módu), pak sdílené editory, pak edit větve tabů, nakonec
dotažení. Tab edituji vždy „celý tab = jeden commit".

---

## Fáze A — Základ

**A1 — BE: gating `assertSubdocAccess`**
`backend/.../characters/characters.service.ts` — `role >= WorldRole.PJ` →
`>= WorldRole.PomocnyPJ`. Ověřit gating `GET`/`PATCH /characters/:slug` (privateBio,
update) a sjednotit na PomocnyPJ. `prettier --write` před commitem (husky).
Cross-repo commit v `Projekt-ikaros`.

**A2 — `api/useCharacterMutations.ts`**
8 hooků, vzor `useUpdatePage` (`useMutation` + invalidace `charactersQueryKey`):
`useUpdateCharacter` (`PATCH /characters/:slug` → invaliduje `detail`),
`useUpdateCharacterDiary` / `Finance` / `Inventory` / `Notes` (`PATCH .../{kind}`),
`useUpdateCharacterCalendar` (`PUT .../calendar`),
`useFinanceAddMonthly` / `useFinanceUndo` (`POST .../finance/{add-monthly,undo}`).
Subdoc mutace invalidují `subdoc(worldId, slug, kind)`.

**A3 — `components/EditStickyBar.tsx` + `.module.css`**
Sticky bottom bar dle design-8.1 §3. Props: `dirty`, `isPending`, `onSave`,
`onCancel`. Tokeny detailu postavy.

**A4 — `CharacterDetail` — skelet edit módu**
`editMode` state, `canEdit` výpočet (PomocnyPJ+ || vlastník), tlačítko „Upravit" do
`CharacterHeader`. Prop `mode: 'view'|'edit'` všem tabům. `EditStickyBar` jen v edit
módu. Discard guard: při změně tabu / `useBlocker` (react-router) při dirty → shared
`Modal`. Stav `dirty` hlásí aktivní tab nahoru (callback).

## Fáze B — Sdílené editory (`components/editors/`)

**B1 — `InfoBlockEditor.tsx`** — řádky `{label,value}`, add/remove, mřížka `infoGrid`.
**B2 — `SectionListEditor.tsx`** — sekce (title, `RichTextEditor`, položky
`{text,quantity?,note?}`), add/remove, pořadí ▲▼. Sdílí deník + výbava.
**B3 — `SchemaValueEditor.tsx`** — vstup hodnoty dle `block.type` (stat/bar/list/text).
**B4 — `AccessRequirementEditor.tsx`** — řádky `{type,value}`, reuse vzoru
`PageEditor/panels/AccessPanel.tsx`.

## Fáze C — Edit větve tabů

Každý tab: přidat `mode` prop, edit větev s lokálním form state (kopie query dat),
`dirty` detekce, `onSave` → mutace.

**C1 — BioTab** — `name`+`imageUrl` (hlavička), public/private bio (`RichTextEditor`),
info bloky (B1), `extraBlocks` hodnoty (B3), `accessRequirements` (B4, jen PJ).
→ `useUpdateCharacter`.
**C2 — DiaryTab** — sekce (B2) + hodnoty bloků `customData` (B3). → `useUpdateCharacterDiary`.
**C3 — FinanceTab** — `entries` + metadata; tlačítka „Zaúčtovat měsíc" / „Vrátit
transakci" (potvrzení). → `useUpdateCharacterFinance` + `add-monthly` + `undo`.
**C4 — InventoryTab** — sekce (B2). → `useUpdateCharacterInventory`.
**C5 — NotesTab** — `content` (`RichTextEditor`). → `useUpdateCharacterNotes`.
**C6 — CalendarTab** — CRUD `events`, `color`, `displaySettings`. → `useUpdateCharacterCalendar`.

## Fáze D — Dotažení

**D1 — Testy** — rozšířit `CharacterDetail`/`DiaryTab`/`FinanceTab` specy o edit;
nové specy `InfoBlockEditor`, `SectionListEditor`, discard guard, finance akce.
**D2 — `mobil-desktop`** audit (skill).
**D3 — Uzávěr** — roadmap 8.1a–g zaškrtnout, `phase-8/README.md`, dluh N-2
(`dluhy.md` přes skill `dluh`), skill `napoveda`.

---

## Rozhodnutí v plánu

- **Form state:** lokální `useState` per tab, hydratovaný z query dat při vstupu do
  edit módu; `dirty` = mělké porovnání s originálem. (Žádná form knihovna — drží to
  konzistenci s taby, které mají různý tvar dat.)
- **Pořadí:** A → B → C → D. C kroky nezávislé, lze přehazovat; C1 první (ověří
  vzor edit větve nad nejbohatším tabem).
- **Commity:** ~15 (A1–A4, B1–B4, C1–C6, D dle potřeby) na `main`.
- **`diaryData` deep-merge (riziko §8 spec):** ověřit v A2 — pokud BE neumí smazat
  klíč, řešit per případ; netýká se sekcí.

## Otevřené k ověření během implementace

- Zdroj uploaderu avataru (`onImageUpload` / shared) — dohledat v C1.
- `useBlocker` dostupnost dle verze react-router — fallback `beforeunload`.
- Přesný gating `GET/PATCH /characters/:slug` na BE — potvrdit v A1.

---

**Stav workflow:** **provedeno** — všechny kroky A–D dokončeny, editační vlna 8.1
naimplementována, otestována a commitnuta (2026-05-22).
