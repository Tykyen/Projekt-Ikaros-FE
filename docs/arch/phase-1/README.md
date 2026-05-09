# Phase 1 — Auth & Uživatelé

**Stav:** ⏳ In progress (1.0–1.2 hotové; 1.3* a 1.6* rozpracované)

## Hlavní kroky

| Krok | Spec | Plan | Stav |
|---|---|---|---|
| 1.0 Theme system | (bez specu) | — | ✅ |
| 1.0b Theme visuals | [spec-1.0b-theme-visuals.md](spec-1.0b-theme-visuals.md) | — | ⏳ |
| 1.1 Login | [spec-1.1.md](spec-1.1.md) | [plan-1.1.md](plan-1.1.md) | ✅ |
| 1.2 Registrace | [spec-1.2.md](spec-1.2.md) | [plan-1.2.md](plan-1.2.md) | ✅ |
| 1.3 Profil — rozděleno | viz 1.3a/b/c | — | ⏳ |
| 1.3a Profil self-edit | [spec-1.3a.md](spec-1.3a.md) | [plan-1.3a.md](plan-1.3a.md) | ⏳ |
| 1.3b Username change + Admin role | — | — | Plánováno |
| 1.3c Tombstone smazaného účtu | — | — | Plánováno |
| 1.4 Adresář uživatelů | — | — | Plánováno |
| 1.5 Presence | — | — | Plánováno |
| 1.6a Reorganizace na feature moduly | [spec-1.6a-feature-modules.md](spec-1.6a-feature-modules.md) | — | Draft |
| 1.6b Cleanup obrázků | [spec-1.6b-assets-cleanup.md](spec-1.6b-assets-cleanup.md) | — | Draft |
| 1.6c Cleanup `docs/arch/` | [spec-1.6c-arch-docs-cleanup.md](spec-1.6c-arch-docs-cleanup.md) | — | Draft |
| 1.7 Reset hesla | — | — | Plánováno |
| 1.8 Přátelé | — | — | Plánováno |

## Sub-cleanupy v rámci 1.2

| Krok | Spec | Stav |
|---|---|---|
| 1.2c Debt cleanup | [spec-1.2c-debt-cleanup.md](spec-1.2c-debt-cleanup.md) | ✅ |
| 1.2d BE env cleanup | [spec-1.2d-be-env-cleanup.md](spec-1.2d-be-env-cleanup.md) | ✅ |
| 1.2e Theme sync | [spec-1.2e-theme-sync.md](spec-1.2e-theme-sync.md) | ✅ |
| 1.2g BE anon access | [spec-1.2g-be-anon-access.md](spec-1.2g-be-anon-access.md) | ✅ |
| 1.2h Login intent DRY | [spec-1.2h-login-intent-dry.md](spec-1.2h-login-intent-dry.md) | ✅ |

> **Pozn:** krok `1.2f` v číslování chybí (přeskočeno z 1.2e na 1.2g). Bez retrofit.

## Side-tasks

- [Superadmin seed](_side-tasks/spec-superadmin-seed.md) — BE seed skript pro `tykytanjunior@gmail.com` (vykonáno paralelně s 1.2).
