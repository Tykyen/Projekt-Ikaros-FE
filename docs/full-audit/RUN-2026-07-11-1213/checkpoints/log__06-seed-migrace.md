# log-hygiene — 06 seed & migrace (RUN-2026-07-11-1213)

**Osy SEED/SEC/PII. Verdikt: ✅ čisté, 0 nových nálezů.**

## Ověřeno (L2)
- Scanner: BE seed=17 log volání, **runtime taint SEC:0 / PII:0** v seed cestě. Seed klasifikován odděleně (`*.seed.ts`), ne runtime.
- **matrix-user migrace** (K-LOG13, [paměť project_matrix_user_migration]: jméno + bcrypt hash + placeholder e-mail) — skript **neloguje hash ani heslo**; jen počty/jména při one-off importu (akceptovatelné pro jednorázový workflow za secretem). Žádný `password`/`hash`/`bcrypt` v log argumentu. ✅
- **matrix-world.seed / rulebook / templates / categories seedy** — logují ID/počty/jména entit (světy/stránky/kategorie), ne PII uživatelů. Jednorázové seedy, ne request cesta.
- **users.service onModuleInit** [users.service.ts:95] `JSON.stringify(conflicts)` (usernames) — LH-08 ⚖️ by-design (operátor musí vidět, který username opravit; jednorázová migrace, ne opakovaně).

## 🆕 tento run: 0
Žádný nový seed/migrace skript s leakem hesla/hashe/e-mailu.
