# Spec 10.2l — Deníky na mapě (+ deník PJ mimo mapu)

## Účel
Zpřístupnit z taktické mapy **deník / poznámky** k postavám i deník PJ, a doplnit
**deník PJ jako samostatnou stránku** mimo mapu (přístup z menu světa). Žádná
duplicita — mapa i stránka sdílí jedno notebook jádro a stejné endpointy.

## Stav před tímto krokem (retroaktivní dokumentace)
Drtivá většina 10.2l už **vznikla a je committed** v rámci token panelu (10.2c-edit-9bc)
a deníkového overlaye:

| Část | Stav | Soubor |
|------|------|--------|
| `MapNotebookOverlay` (overlay/dock na mapě) | hotovo | `tactical-map/components/notebook/MapNotebookOverlay.tsx` |
| `MapNotebookButton` (otevření) | hotovo | `tactical-map/components/notebook/MapNotebookButton.tsx` |
| `TokenDiaryTab` / `TokenNotesTab` (embed do token panelu) | hotovo | `tactical-map/components/tokens/Token{Diary,Notes}Tab.tsx` |
| `useGmNotes` / `useUpdateGmNotes` (`/worlds/:id/gm-notes`) | hotovo | `tactical-map/api/useGmNotes.ts` |
| Rozlišení deník PJ (`WorldGmNotes`, per-PJ) vs postava (`CharacterNotes`) | hotovo | `TacticalMapView.tsx` |

➡️ Token deníky, úprava HP/statů z deníku, PJ vs hráč přístup — **hotové z 10.2c-edit-9bc**.

## Co tento krok dodělává — deník PJ mimo mapu

PJ chce číst/psát svůj world-level deník i **bez otevření taktické mapy**. Proto
samostatná stránka `/svet/:worldSlug/denik-pj`, která **sdílí data** s tlačítkem
„Deník" na mapě (stejný endpoint `/worlds/:worldId/gm-notes`, stejný per-PJ záznam).

### Sdílené notebook jádro
Aby stránka i map-overlay nesdílely jen data, ale i UI, vytáhne se papír + autosave
do neutrální cesty `src/features/world/components/notebook/`:
- **`NotebookPaper`** — vizuál „papíru" + textová plocha (`onChange`), `NotebookStatus`
  (ukládám / uloženo / dirty indikátor).
- **`useNotebookAutosave(initialContent, mutate)`** — debounced autosave, vrací
  `{ content, setContent, status, dirty }`.

💡 *Sdílené jádro = jedna implementace papíru i autosave logiky pro mapu i stránku;
overlay na mapě a plná stránka jsou jen dva „rámy" kolem stejného jádra.*

### Stránka `WorldGmDiaryPage`
- Routa `/svet/:worldSlug/denik-pj`, lazy v `router.tsx`.
- **Role gate na routě:** `WorldMembershipGuard minWorldRole=PomocnyPJ`,
  `fallbackGlobalRoles=[Superadmin, Admin]`. Hráč routu nedostane.
- Data přes `useGmNotes(worldId, enabled)` + `useUpdateGmNotes(worldId)`.
- Layout: hlavička (titulek „Deník PJ" + název světa + `NotebookStatus`), uprostřed
  papír (`NotebookPaper`). Plně responzivní (mobil i desktop) — `mobil-desktop` audit.

### Nav položka (PJ-only)
Ve `WorldLayout` přibyde do skupiny **Hra** položka „Deník PJ" (`id: denik-pj`),
viditelná jen pro PJ+ (owner / globální Admin+ / world membership ≥ PomocnyPJ).
Při této příležitosti opraven `isPJForNav` — dřív chyběla větev membership, takže
ne-owner PJ neviděl PJ-only položky.

## Oprava číslování
Untracked kód nese komentáře `10.2j` (chybně — 10.2j = hod kostkou). Sjednotit na
**`10.2l`** v: `router.tsx`, `WorldLayout.tsx`, `WorldGmDiaryPage.tsx`.

## Mimo scope (defer)
- Sdílení deníku PJ mezi více PJ (per-PJ izolace zůstává).

*(Pozn.: papír používá `RichTextEditor` — bohatý text je tedy součástí jádra.)*

## Definition of done
- [ ] Stránka `/denik-pj` funkční, sdílí data s map deníkem
- [ ] Číslování komentářů `10.2j`→`10.2l`
- [ ] Testy: `NotebookPaper`, `useNotebookAutosave`, `WorldGmDiaryPage`
- [ ] `mobil-desktop` audit stránky
- [ ] `napoveda` aktualizována
- [ ] roadmapa: 10.2l zaškrtnuto
