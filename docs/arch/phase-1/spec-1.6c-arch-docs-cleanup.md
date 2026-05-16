# Spec 1.6c — Cleanup `docs/arch/` (sjednocení konvence + index)

**Status:** ✅ Implementováno
**Rozsah:** přejmenování / přesun spec dokumentů, vytvoření indexu, aktualizace `_spec-guide.md`
**Repo:** `Projekt-ikaros-FE`
**Velikost:** ~30 souborů (přesun + 1 nový index + úprava guide), žádný kód
**Autor:** PJ + Claude
**Datum:** 2026-05-09
**Souvisí:** [1.6a — feature moduly](spec-1.6a-feature-modules.md), [1.6b — assets cleanup](spec-1.6b-assets-cleanup.md)

---

## 1. Cíl

Sjednotit konvenci pojmenování spec dokumentů v `docs/arch/`, přidat **`README.md` index** s přehledem stavu kroků, a aktualizovat [_spec-guide.md](docs/arch/_spec-guide.md) tak, aby odpovídal reálné struktuře.

---

## 2. Audit současného stavu

### 2.1 Dvě nekompatibilní konvence

**Konvence A — per-step složka** (phase-0 starší kroky 0.1–0.6):
```
phase-0/0.1-design-system/
  index.md
  purpose.md
  ai-notes.md
  decisions.md
  routing.md (jen 0.3)
```

Spec-guide [_spec-guide.md:9-21](docs/arch/_spec-guide.md#L9) popisuje právě tuto strukturu.

**Konvence B — flat soubory** (phase-0 později + celá phase-1):
```
phase-0/spec-0.5-0.6.md
phase-0/plan-0.5-0.6.md
phase-1/spec-1.1.md
phase-1/plan-1.1.md
phase-1/spec-1.2.md
phase-1/plan-1.2.md
phase-1/spec-1.2c-debt-cleanup.md
phase-1/spec-1.2d-be-env-cleanup.md
phase-1/spec-1.2e-theme-sync.md
phase-1/spec-1.2g-be-anon-access.md
phase-1/spec-1.2h-login-intent-dry.md
phase-1/spec-1.3a.md
phase-1/plan-1.3a.md
phase-1/spec-1.0b-theme-visuals.md          ← out-of-order (1.0b mezi 1.3*)
phase-1/spec-superadmin-seed.md             ← bez čísla
phase-1/spec-1.6a-feature-modules.md
phase-1/spec-1.6b-assets-cleanup.md
phase-1/spec-1.6c-arch-docs-cleanup.md      ← tento
```

**Problém 1:** Konvence A vs B nelze míchat. Spec-guide popisuje A, realita 90% B.

**Problém 2:** Plan dokument vs spec dokument — ne vždy spárované. `spec-1.1` má `plan-1.1`, `spec-1.2` má `plan-1.2`, ale `spec-1.2c–h` nemají plan (sub-cleanupy = jen spec). Nedokumentováno.

**Problém 3:** Soubory bez čísla (`spec-superadmin-seed.md`) nepatří do žádné fáze jasně.

**Problém 4:** Žádný index. Kdo přijde nový, neví kde začít. `_spec-guide.md` je proces, ne mapa.

### 2.2 Stav kroků (mapping spec ↔ roadmap)

Z [docs/roadmap-fe.md](docs/roadmap-fe.md):

| Krok | Spec | Plan | Stav v roadmap |
|---|---|---|---|
| 0.1 Design system | per-step složka | — | ✅ |
| 0.2 Layout | per-step složka | — | ✅ |
| 0.3 Routing | per-step složka | — | ✅ |
| 0.4 Auth infra | (chybí) | — | ✅ |
| 0.5 API + 0.6 Socket | `spec-0.5-0.6.md` | `plan-0.5-0.6.md` | ✅ |
| 1.0 Theme system | (chybí — implementováno) | — | ✅ |
| 1.0b Theme visuals | `spec-1.0b-theme-visuals.md` | — | (in-progress?) |
| 1.1 Login | `spec-1.1.md` | `plan-1.1.md` | ✅ |
| 1.2 Registrace | `spec-1.2.md` | `plan-1.2.md` | ✅ |
| 1.2c Debt cleanup | `spec-1.2c-debt-cleanup.md` | — | ✅ |
| 1.2d BE env cleanup | `spec-1.2d-be-env-cleanup.md` | — | ✅ |
| 1.2e Theme sync | `spec-1.2e-theme-sync.md` | — | ✅ |
| 1.2g BE anon access | `spec-1.2g-be-anon-access.md` | — | ✅ |
| 1.2h Login intent DRY | `spec-1.2h-login-intent-dry.md` | — | ✅ |
| 1.3a Profil self-edit | `spec-1.3a.md` | `plan-1.3a.md` | ⏳ |
| 1.6a Feature moduly | `spec-1.6a-feature-modules.md` | — | Draft (tato spec batch) |
| 1.6b Assets cleanup | `spec-1.6b-assets-cleanup.md` | — | Draft (tato spec batch) |
| 1.6c Arch/docs cleanup | `spec-1.6c-arch-docs-cleanup.md` | — | Draft (tento dokument) |
| Superadmin seed | `spec-superadmin-seed.md` | — | (BE-side, side-task) |

**Pozorování:**
- Některé hotové kroky **nemají spec** (0.4, 1.0). Historický dluh — buď spec dopsat, nebo přiznat v indexu.
- `1.0b` je out-of-order ale dává smysl (post-1.0 vizuální zpřesnění).
- `1.2f` chybí (mezi 1.2e a 1.2g) — překlep / přeskočená? **Nesrovnalost.**

---

## 3. Návrh cílové struktury

### 3.1 Sjednocená konvence — flat (Konvence B)

**Důvod:** většina dokumentů už je flat. Per-step složky jsou minorita (5 z 30+). Migrace flat → per-step by byla větší než opačná.

```
docs/arch/
├── README.md                       ← NOVÝ INDEX (přehled fází, kroků, stavu)
├── _spec-guide.md                  ← UPDATE (popis konvence B + workflow)
├── _templates/                     ← UPDATE (shoda s konvencí B — `spec-template.md`, `plan-template.md`)
├── phase-0/
│   ├── README.md                   ← přehled phase-0 kroků
│   ├── 0.1-design-system/          ← legacy ponechat (hotové, neměnit)
│   │   ├── index.md
│   │   ├── purpose.md
│   │   ├── ai-notes.md
│   │   └── decisions.md
│   ├── 0.2-layout/                 ← legacy ponechat
│   ├── 0.3-routing/                ← legacy ponechat
│   ├── 0.5-api-error-boundary/     ← legacy ponechat
│   ├── 0.6-providers-setup/        ← legacy ponechat
│   ├── spec-0.5-0.6.md             ← duplicita s 0.5-/0.6- složkami? viz 3.3
│   └── plan-0.5-0.6.md
├── phase-1/
│   ├── README.md                   ← přehled phase-1 kroků
│   ├── spec-1.0b-theme-visuals.md
│   ├── spec-1.1.md, plan-1.1.md
│   ├── spec-1.2.md, plan-1.2.md
│   ├── spec-1.2c-debt-cleanup.md
│   ├── spec-1.2d-be-env-cleanup.md
│   ├── spec-1.2e-theme-sync.md
│   ├── spec-1.2g-be-anon-access.md
│   ├── spec-1.2h-login-intent-dry.md
│   ├── spec-1.3a.md, plan-1.3a.md
│   ├── spec-1.6a-feature-modules.md
│   ├── spec-1.6b-assets-cleanup.md
│   ├── spec-1.6c-arch-docs-cleanup.md
│   └── _side-tasks/                ← speciální složka pro side-tasky bez čísla
│       └── spec-superadmin-seed.md
└── (phase-2/, phase-3/, …)         ← podle [docs/hlavni-plan.md] až přijdou
```

### 3.2 Konvence pojmenování

```
spec-<step>[-<slug>].md    ← spec ("co a proč")
plan-<step>[-<slug>].md    ← impl. plán ("jak konkrétně"; volitelný — jen u větších kroků)
```

**Pravidlo:** sub-cleanupy (typu `1.2c–h`) **mají jen spec**, žádný plan (zbytečný overhead). Hlavní kroky (1.1, 1.2, 1.3a, 1.6a/b/c) **mají oba**.

### 3.3 Co s phase-0 legacy složkami

Dvě varianty:

**Variant A — ponechat hybrid:**
- Phase-0 hotové legacy složky (0.1–0.3, 0.5–0.6) zůstanou.
- Spec-guide popíše obě konvence: "legacy per-step složka (deprecated)" + "flat (current)".
- Žádné přesouvání.

**Variant B — migrovat phase-0 na flat:**
- Z každé složky vytvořit `spec-0.X.md` (slepit `index.md` + `purpose.md` + `decisions.md` + `ai-notes.md`).
- Smazat složky.
- **Čistší, ale ~10–15 souborů merge prací bez funkčního benefitu** (kroky jsou hotové).

**Doporučení:** **Variant A**. Phase-0 je hotové, nikdo do něj nepíše. Cost > benefit.

### 3.4 Index `docs/arch/README.md`

Nový soubor se strukturou:

```markdown
# Architektura — index

> Zdroje: [docs/hlavni-plan.md](../hlavni-plan.md) (high-level fáze) +
> [docs/roadmap-fe.md](../roadmap-fe.md) (kroky a stav).
> Tento adresář obsahuje **detailní specifikace** pro implementaci.

## Konvence
- `spec-<step>.md` — co a proč
- `plan-<step>.md` — jak konkrétně (volitelně)
- Sub-cleanupy mají jen spec
- Side-tasky bez čísla → `phase-X/_side-tasks/`
- Detailní průvodce: [_spec-guide.md](_spec-guide.md)

## Fáze 0 — Základ ✅
- [Phase-0 přehled](phase-0/README.md)

## Fáze 1 — Auth & Uživatelé ⏳
- [Phase-1 přehled](phase-1/README.md)

## Plánované fáze
- 2 — Ikaros jádro
- 3 — Ikaros komunita
- ... (viz hlavni-plan.md)
```

### 3.5 Per-fáze přehledy `phase-X/README.md`

```markdown
# Phase 1 — Auth & Uživatelé

| Krok | Spec | Plan | Stav |
|---|---|---|---|
| 1.0b Theme visuals | [spec](spec-1.0b-theme-visuals.md) | — | ⏳ |
| 1.1 Login | [spec](spec-1.1.md) | [plan](plan-1.1.md) | ✅ |
| 1.2 Registrace | [spec](spec-1.2.md) | [plan](plan-1.2.md) | ✅ |
| 1.2c Debt cleanup | [spec](spec-1.2c-debt-cleanup.md) | — | ✅ |
| 1.2d BE env cleanup | [spec](spec-1.2d-be-env-cleanup.md) | — | ✅ |
| 1.2e Theme sync | [spec](spec-1.2e-theme-sync.md) | — | ✅ |
| 1.2g BE anon access | [spec](spec-1.2g-be-anon-access.md) | — | ✅ |
| 1.2h Login intent DRY | [spec](spec-1.2h-login-intent-dry.md) | — | ✅ |
| 1.3a Profil self-edit | [spec](spec-1.3a.md) | [plan](plan-1.3a.md) | ⏳ |
| 1.3b Username change | — | — | (plánováno) |
| 1.3c Tombstone | — | — | (plánováno) |
| 1.6a Feature moduly | [spec](spec-1.6a-feature-modules.md) | — | Draft |
| 1.6b Assets cleanup | [spec](spec-1.6b-assets-cleanup.md) | — | Draft |
| 1.6c Arch/docs cleanup | [spec](spec-1.6c-arch-docs-cleanup.md) | — | Draft |

## Side-tasks
- [Superadmin seed](_side-tasks/spec-superadmin-seed.md) — BE seed skript pro tykytanjunior@gmail.com

## Nesrovnalosti
- **1.2f chybí** — překlep při číslování (přeskočili jsme z 1.2e na 1.2g). Žádný retrofit, jen poznámka.
- **0.4 Auth infra a 1.0 Theme system nemají spec** — historický dluh, kroky implementovány bez specu. Akceptujeme jako fakt.
```

### 3.6 Aktualizace `_spec-guide.md`

Přepsat sekci "Struktura složek" tak aby odpovídala reálu (flat + legacy fallback). Doplnit:
- Konvenci `spec-<step>` / `plan-<step>`
- Pravidlo "sub-cleanupy mají jen spec"
- Pravidlo "side-tasky → `_side-tasks/`"
- Workflow: spec → souhlas → plan (volitelně) → souhlas → kód
- Odkaz na index `README.md`

### 3.7 Aktualizace `_templates/`

`_templates/` má dnes per-step složku konvence (`index.md`, `purpose.md`, …). Doplnit / nahradit:
- `_templates/spec-template.md` — flat spec šablona (struktura: cíl, kontext, audit, návrh, acceptance, riziko, otázky)
- `_templates/plan-template.md` — flat plan šablona (přesné CLI / file diff)
- Legacy per-step šablony (`index.md` atd.) **nechat** s poznámkou "legacy phase-0 only" pro budoucí konzistenci.

---

## 4. Návrh řešení (postup)

### Step 1 — Přesunout side-tasky
```
mkdir docs/arch/phase-1/_side-tasks
mv docs/arch/phase-1/spec-superadmin-seed.md docs/arch/phase-1/_side-tasks/
```

### Step 2 — Vytvořit indexy
- `docs/arch/README.md`
- `docs/arch/phase-0/README.md`
- `docs/arch/phase-1/README.md`

### Step 3 — Aktualizovat `_spec-guide.md`
Přepsat "Struktura složek" + doplnit workflow + index link.

### Step 4 — Vytvořit flat šablony
- `_templates/spec-template.md`
- `_templates/plan-template.md`

### Step 5 — Cross-link spec dokumentů
V každém spec doplnit `**Souvisí:**` řádek u úvodu (ve specifikacích 1.6a, 1.6b, 1.6c už je). Volitelně retrofit u starších spec — **out of scope**, jen u nových.

---

## 5. Out of scope

- **Migrace phase-0 legacy složek na flat** — Variant B z 3.3, neimplementujeme.
- **Dopsání chybějících speců (0.4, 1.0)** — kroky hotové, dluh akceptován.
- **Retrofit `**Souvisí:**` linků v starších spec** — bonus, ne nutnost.
- **Refactor v `docs/superpowers/`, `docs/dluhy.md`, `docs/hlavni-plan.md`, `docs/roadmap-fe.md`** — mimo `docs/arch/`. Vlastní cleanup.
- **Změna numerování kroků v roadmap** — není FE arch concern.

---

## 6. Acceptance kritéria

1. ✅ `docs/arch/README.md` existuje s přehledem fází + linkem na phase indexy a `_spec-guide.md`.
2. ✅ `docs/arch/phase-0/README.md` existuje s tabulkou kroků a stavem.
3. ✅ `docs/arch/phase-1/README.md` existuje s tabulkou kroků (včetně 1.6a, 1.6b, 1.6c) a stavem.
4. ✅ `docs/arch/phase-1/_side-tasks/` obsahuje `spec-superadmin-seed.md` (přesunutý).
5. ✅ `docs/arch/_spec-guide.md` má updatovanou sekci "Struktura složek" odpovídající realitě.
6. ✅ `docs/arch/_templates/spec-template.md` a `plan-template.md` existují (flat varianta).
7. ✅ Žádný broken link v rámci `docs/arch/` (manuální check + grep relativních odkazů).
8. ✅ Phase-0 legacy složky beze změny (Variant A z 3.3).

---

## 7. Riziko & rollback

| # | Riziko | Mitigace |
|---|---|---|
| 1 | Broken link v existujícím spec na přesunutý `superadmin-seed` | Grep `superadmin-seed` před přesunem, fix |
| 2 | Index zastará rychleji než kroky se uzavírají | Akceptujeme — index je snapshot, ne autoritativní zdroj. Pravda v `roadmap-fe.md`. |
| 3 | Hybrid konvence (legacy phase-0 + flat phase-1) zmate nového čtenáře | `_spec-guide.md` to explicitně popíše |

**Rollback:** všechny operace = move + create + edit markdown. Plně revertovatelné.

---

## 8. Otázky k autorovi

Žádné — autor delegoval. Volby:

1. **Variant A** (ponechat phase-0 legacy hybrid) — žádný refactor hotových kroků, ušetří čas.
2. **Indexy jako snapshot, ne autoritativní zdroj** — pravda zůstává v `roadmap-fe.md`. Index linkuje, ne duplikuje stav.
3. **Side-tasky** → `phase-X/_side-tasks/` (podtržítko = "interní složka", neřadí se mezi numbered kroky).
4. **`1.2f` mezera** — žádný retrofit, jen poznámka v phase-1 indexu.

---

**Po schválení specu napíšu implementační plán** (přesné `mv` příkazy, plný obsah `README.md` indexů, diff `_spec-guide.md`, plné šablony).
