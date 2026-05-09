# Architektura — index

> Tento adresář obsahuje **detailní specifikace** pro implementaci kroků projektu.
> Vyšší úroveň: [docs/hlavni-plan.md](../hlavni-plan.md) (high-level fáze) + [docs/roadmap-fe.md](../roadmap-fe.md) (kroky a stav).
> Tracked dluhy: [docs/dluhy.md](../dluhy.md).

---

## Konvence

- **`spec-<step>[-<slug>].md`** — co a proč. Vstup pro implementaci.
- **`plan-<step>[-<slug>].md`** — jak konkrétně (CLI příkazy, file diffs). Volitelný; jen u větších kroků.
- **Sub-cleanupy** (typu 1.2c–h) mají **jen spec**, žádný plan.
- **Side-tasky** bez čísla (paralelní jednorázové) → `phase-X/_side-tasks/`.
- **Legacy phase-0** (kroky 0.1–0.6) používá per-step složky s `index.md`/`purpose.md`/`decisions.md`/`ai-notes.md`. Hotové, neměníme; nové kroky používají flat konvenci.

Workflow: **spec → souhlas autora → plán (volitelně) → souhlas → kód.** Detailní průvodce: [_spec-guide.md](_spec-guide.md). Šablony: [_templates/](_templates/).

---

## Přehled fází

| Fáze | Téma | Stav | Index |
|---|---|---|---|
| 0 | Základ a infrastruktura | ✅ Hotovo | [phase-0/README.md](phase-0/README.md) |
| 1 | Auth & Uživatelé | ⏳ In progress | [phase-1/README.md](phase-1/README.md) |
| 2 | Ikaros jádro | Plánováno | — |
| 3 | Ikaros komunita | Plánováno | — |
| 4 | Globální chat (Hospoda) | Plánováno | — |
| 5 | Svět — základ | Plánováno | — |
| 6 | Svět — chat | Plánováno | — |
| 7 | Svět — Wiki stránky | Plánováno | — |
| 8 | Svět — Postavy | Plánováno | — |
| 9 | Svět — Herní nástroje | Plánováno | — |
| 10 | Svět — Mapy | Plánováno | — |
| 11 | Svět — Kampaně | Plánováno | — |
| 12 | Admin & nastavení | Plánováno | — |
| 13 | Pokročilé funkce | Plánováno | — |

---

## Známé nesrovnalosti (historický dluh)

- **0.4 Auth infra** a **1.0 Theme system** byly implementovány **bez specu**. Akceptováno jako fakt, neretrofitujeme.
- **Krok 1.2f** v číslování chybí (přeskočeno z 1.2e na 1.2g). Žádný retrofit.
- **Phase-0 hybrid** — některé kroky jsou per-step složky, jiné flat (`spec-0.5-0.6.md`). Sjednocení by stálo víc než přínosu (kroky hotové).
