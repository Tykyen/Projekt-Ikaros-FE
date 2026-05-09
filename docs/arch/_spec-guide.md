# Průvodce systémem specifikací — FE

Každá fáze má vlastní složku s spec dokumenty. Spec slouží jako vstup pro AI agenta — agent čte spec **před** zahájením implementace.

> Index všech fází: [README.md](README.md). Šablony: [_templates/](_templates/).

---

## Struktura složek

```
docs/arch/
├── README.md                       # index všech fází
├── _spec-guide.md                  # tento soubor
├── _templates/
│   ├── spec-template.md            # flat spec šablona (current)
│   ├── plan-template.md            # flat plan šablona (current)
│   └── (legacy: index.md, purpose.md, decisions.md, ai-notes.md, …)
├── phase-0/
│   ├── README.md                   # phase-0 přehled kroků
│   ├── 0.1-design-system/          # legacy per-step složka (jen phase-0)
│   │   ├── index.md, purpose.md, decisions.md, ai-notes.md
│   ├── 0.2-layout/                 # legacy per-step
│   ├── 0.3-routing/                # legacy per-step
│   ├── 0.5-api-error-boundary/     # legacy per-step
│   ├── 0.6-providers-setup/        # legacy per-step
│   ├── spec-0.5-0.6.md             # flat
│   └── plan-0.5-0.6.md
├── phase-1/
│   ├── README.md                   # phase-1 přehled
│   ├── spec-1.1.md, plan-1.1.md
│   ├── spec-1.2.md, plan-1.2.md
│   ├── spec-1.2c-debt-cleanup.md   # sub-cleanup, jen spec
│   ├── spec-1.3a.md, plan-1.3a.md
│   ├── spec-1.6a-feature-modules.md
│   └── _side-tasks/                # paralelní jednorázové úkoly bez čísla
│       └── spec-superadmin-seed.md
└── (phase-2/, phase-3/, …)         # podle hlavni-plan.md jak přijdou
```

---

## Konvence pojmenování

- **`spec-<step>[-<slug>].md`** — co a proč. Vstup pro implementaci.
  Příklady: `spec-1.2.md`, `spec-1.2c-debt-cleanup.md`, `spec-1.6a-feature-modules.md`.
- **`plan-<step>[-<slug>].md`** — jak konkrétně (CLI, file diffs). **Volitelný.**
- **Sub-cleanupy** (typu 1.2c–h) mají **jen spec**, žádný plan.
- **Side-tasky** bez čísla (paralelní jednorázové) → `phase-X/_side-tasks/`.
- **Legacy phase-0** kroky 0.1–0.6 zůstávají v per-step složkách (hotové, neměníme).

---

## Povinný workflow — bez výjimky

1. **Brainstorming** — prodiskutovat klíčová rozhodnutí s uživatelem.
2. **Spec dokument** — `phase-X/spec-X.Y.md` shrnující celý krok. Primární review artefakt.
3. **Uživatel schválí spec** — agent čeká, nezačíná kódovat.
4. **Implementační plán** — pro větší kroky `phase-X/plan-X.Y.md`. Pro sub-cleanupy se přeskakuje.
5. **Uživatel potvrdí plán** — agent čeká.
6. **Implementace** — teprve teď agent kóduje.

---

## Formát spec dokumentu

Použij šablonu [_templates/spec-template.md](_templates/spec-template.md). Vždy obsahuje:

- **Cíl** — co a proč, jednoodstavcově.
- **Kontext / motivace** — proč teď.
- **Audit současného stavu** — konkrétní cesty / čísla řádků.
- **Návrh řešení** — diff (před → po), klíčová rozhodnutí.
- **Out of scope** — explicitní hranice.
- **Acceptance kritéria** — ověřitelný checklist.
- **Test plán** — automated + smoke.
- **Riziko & rollback** — tabulka rizik s mitigací.
- **Otázky k autorovi** (volitelně) — nebo "delegováno + volby" pokud autor předem rozhodl.

---

## Legacy per-step soubory (jen phase-0)

Phase-0 dokumenty `index.md` / `purpose.md` / `ui-spec.md` / `api-calls.md` / `state.md` / `routing.md` / `decisions.md` / `ai-notes.md` zůstávají pro referenci. **Nové fáze je nepoužívají** — všechno je v jednom flat `spec-X.Y.md`.

Pokud někdy bude potřeba retroaktivně dokumentovat hotovou fázi, použij flat spec šablonu, ne per-step strukturu.

---

## Workflow AI agenta při čtení specu

1. Agent dostane cestu ke spec souboru (`docs/arch/phase-X/spec-X.Y.md`).
2. Přečte spec — sekce 1–4 dají kontext, sekce 6 acceptance kritéria.
3. Pokud existuje `plan-X.Y.md`, přečte i ho — má přesné CLI / diff.
4. Teprve pak implementuje.
