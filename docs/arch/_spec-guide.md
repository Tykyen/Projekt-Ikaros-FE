# Průvodce systémem specifikací — FE

Každá fáze nebo feature má vlastní složku se specifikačními soubory. Spec slouží jako vstup pro AI agenta — agent čte spec **před** zahájením implementace.

---

## Struktura složek

```
docs/arch/
  _spec-guide.md           # Tento soubor
  _templates/              # Šablony pro nové specs
  phase-0/
    0.1-design-system/
    0.2-layout/
    0.3-routing/
    ...
  phase-1/
    1.1-login/
    ...
```

---

## Typy souborů

### `index.md`
Vstupní bod. Agent čte jako první. Obsahuje název, popis a seznam existujících souborů.

### `purpose.md`
Co feature dělá a proč existuje. Hranice odpovědnosti.

### `ui-spec.md`
UI požadavky — layout, komponenty, responsive chování, stavy (loading/empty/error).

### `api-calls.md`
Jaké BE endpointy feature volá — metoda, cesta, co posílá, co dostává.

### `state.md`
State management — Jotai atomy, React Query klíče, lokální stav.

### `routing.md`
Routes, URL parametry, guards (auth, role), redirect pravidla.

### `decisions.md`
Klíčová technická rozhodnutí přijatá při návrhu nebo implementaci a jejich důvody.

### `ai-notes.md`
Pokyny specificky pro AI agenta — co číst, co nesmí měnit, závislosti, časté chyby.

---

## Pravidlo

Spec se píše **před implementací**. Pro retroaktivně dokumentované fáze (0.1–0.3) spec zachycuje rozhodnutí která byla přijata.

---

## Povinný workflow — bez výjimky

1. **Brainstorming** — prodiskutovat klíčová rozhodnutí s uživatelem
2. **Unified spec dokument** — jeden soubor `docs/arch/phase-X/spec-X.Y[-X.Z].md` shrnující celou fázi. Toto je primární review artefakt — uživatel ho čte, opravuje a schvaluje.
3. **Uživatel schválí spec** — agent čeká, nezačíná kódovat
4. **Implementační plán** — agent popíše co a v jakém pořadí udělá
5. **Uživatel potvrdí** — agent čeká
6. **Implementace** — teprve teď agent kóduje
7. **Dílčí spec soubory** (volitelně) — `purpose.md`, `decisions.md`, `ai-notes.md` lze doplnit po implementaci pro potřeby AI agentů

## Formát unified spec dokumentu

Soubor `spec-X.Y.md` obsahuje vždy:
- Co se řeší (problém / chybějící věc)
- Co vznikne (nové soubory, změny)
- Klíčová rozhodnutí a jejich důvody
- Co se nemění
- Implementační pořadí

## Workflow AI agenta při čtení specu

1. Agent dostane cestu ke složce fáze
2. Přečte `index.md` — zjistí co existuje
3. Přečte soubory relevantní pro úkol
4. Teprve pak implementuje
