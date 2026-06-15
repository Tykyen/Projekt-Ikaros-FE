---
name: plny-audit
description: Orchestruje všech 16 auditních stylů projektu proti AKTUÁLNÍMU kódu BE+FE. Audity 1-15 znovu DETEKUJÍ (8 deterministických scannerů + paralelní read-only sub-agenti) na plnou hloubku z plánů, 16. (anti-regression) je závěrečná brána. Navíc census hlídá, jestli kód PŘERostl rozsah auditů (coverage drift) a kde kontrolu rozšířit. Spusť na vyžádání ("plný audit", "/plny-audit") pro kompletní revizi nebo po velké změně. NEopravuje bez souhlasu.
---

# Skill: plný audit

Orchestrátor, **ne 17. audit**. Věrně přehraje 16 existujících auditních metodik proti živému kódu,
paralelizuje detekci přes sub-agenty, hlídá růst kódu vůči rozsahu auditů, a nahlásí nálezy k opravě.

## Co dělá / NEdělá

| Dělá | NEdělá |
|---|---|
| znovu **detekuje** všech 16 stylů proti aktuálnímu BE+FE | nevymýšlí nové osy/styly — přehrává existující |
| čte hloubku/postup **live z plánů** (future-proof) | **nezmrazuje** metodiku do skillu |
| **auto-discovery** auditů z `docs/*-plan/` ↔ `docs/*-audit.md` | nepřehlíží nové audity |
| **census** = detekuje růst povrchu → kde rozšířit kontrolu | nepředstírá pokrytí, co neproběhlo |
| hlasitě hlásí `⏭️ blokováno` u vrstev bez infry | tiše nezezelená |
| 16. (anti-regression) jako **závěrečná brána** | neopravuje automaticky / bez souhlasu |

## Argumenty

| Arg | Význam |
|---|---|
| _(bez)_ | full-depth detekce dosažitelná bez infry (scannery + statické sweepy L1-L2) + census + brána |
| `+db` | live DB scany (orphan-scan, integrity-scan, M-TYPE) → tier C/D na L4 |
| `+e2e` | BE jest e2e (race-condition, seed-scenario) — ⚠️ seed-scenario chce replSet harness (viz Pasti) |
| `+teeth` | Stryker mutace (L5-teeth) — desítky minut až hodiny |
| `+formal` | TLA+ TLC model-check (L8) |
| `diff <ref>` | jen audity dotčené git diffem proti `<ref>` (default `main`) |
| `<a,b,...>` | jen vyjmenované audity (názvy plán-dirů bez `-plan`) |
| `--update-baseline` | po běhu uloží aktuální census jako nový coverage baseline |

> Default schválen uživatelem: scannery + statické sweepy + census + META brána; `+db/+e2e/+teeth/+formal`
> odemykají hloubkové vrstvy. Drahé proofs (teeth/formal) se mezi běhy nemění — default je **ověří přes
> G-matici** (16. brána) a nabídne re-běh příznakem.

---

## Fáze 0 — Příprava

1. **Git HEAD** obou repo (`git rev-parse HEAD` ve FE i BE) → do reportu (odlišení „co je nové").
2. **Auto-discovery auditů:** vyjmenuj `docs/*-plan/` a spáruj s `docs/<name>-audit.md`. Každý pár =
   jeden audit. Runner odvoď z mapy níže (z názvu nejde). Nový audit v repu → automaticky v běhu.
3. **Rozsah** z argumentů (full / `diff` / výběr).
4. **Infra** dle hloubky: `+db`/`+e2e` → ověř/nastartuj Mongo (BE `docker-compose` nebo
   `MongoMemoryReplSet`); `+teeth` → `@stryker-mutator/core`; `+formal` → TLC. Chybí-li → vrstvu označ
   `⏭️ blokováno` (NE skip bez záznamu).
5. Založ `docs/full-audit/RUN-<YYYY-MM-DD-HHmm>/` (+ podsložku `scanners/`).

### Mapa audit → runner (fallback k auto-discovery)

| Plán dir | Registr (prefix) | Runner | Repo | Hloubka navíc |
|---|---|---|---|---|
| `bug-plan` | `bug-audit.md` (`N-`) | `npm run audit:routes` | FE↔BE | — |
| `role-plan` | `role-audit.md` (`R-`) | `npm run audit:routes` (sdílený) | FE↔BE | — |
| `nav-plan` | `nav-audit.md` (`NAV-`) | `npm run audit:nav` | FE↔BE | — |
| `ws-contract-plan` | `ws-audit.md` (`W-`) | `npm run audit:ws` | BE | — |
| `prod-config-plan` | `prod-config-audit.md` (`PC-`) | `npm run audit:config` | BE+FE | — |
| `error-contract-plan` | `error-contract-audit.md` (`EC-`) | `npm run audit:errors` | FE+BE | e2e probe `+e2e` |
| `log-hygiene-plan` | `log-hygiene-audit.md` (`LH-`) | `npm run audit:logs` | BE | runtime `+e2e` |
| `form-schema-plan` | `form-schema-audit.md` (`F-`) | **SWEEP** (sub-agent) | FE↔BE | — |
| `cache-plan` | `cache-audit.md` (`C-`) | **SWEEP** | FE | round-trip `+e2e` |
| `upload-media-plan` | `upload-media-audit.md` (`UM-`) | **SWEEP** | BE | L5 `+e2e/+db` |
| `state-consistency-plan` | `state-consistency-audit.md` (`S-`) | **SWEEP** | FE+BE | L8 `+formal` |
| `cascade-delete-plan` | `cascade-delete-audit.md` (`CD-`) | **SWEEP** | BE | orphan-scan `+db` |
| `db-integrity-plan` | `db-integrity-audit.md` (`DI-`) | **SWEEP** | BE | integrity-scan/M-TYPE `+db` |
| `race-condition-plan` | `race-condition-audit.md` (`RC-`) | **BE jest e2e** `+e2e` | BE | — |
| `seed-scenario-plan` | `seed-scenario-audit.md` (`SS-`) | **BE jest e2e** `+e2e` | BE | ⚠️ replSet bloker |
| `anti-regression-plan` | `anti-regression-audit.md` (`AR-`) | `npm run audit:regression -- --ci` | META | **běží POSLEDNÍ** |

---

## Fáze 1 — Scannery (tier A, deterministické)

Z FE rootu pusť každý runnable scanner, stdout ulož do `RUN/scanners/<audit>.txt`:

```
npm run audit:routes
npm run audit:nav
npm run audit:ws
npm run audit:config
npm run audit:errors
npm run audit:logs
```

Scannery vyjmenovávají **živý povrch** a diffují → nové routy/eventy/env/throw/logger uvidí samy.
Tvrdé nálezy bez agenta. Nenulový exit / nové řádky = nález do reportu.

## Fáze 1b — Coverage drift (census) — „přerostl kód rozsah auditů?"

1. `npm run audit:census -- --json` → živý povrch (kolekce, listenery, query-keys, upload sites,
   delete cesty, transakce, env, …) s počty + jmény + cílovým auditem.
2. Skript **diffuje vs baseline** (`docs/full-audit/coverage-baseline.json`). Lidský běh `npm run audit:census`
   vypíše čitelně „📈 přibylo / 📉 ubylo" po kategoriích.
3. **Capability-routing:** každá kategorie má přiřazený audit (viz skript). Nový povrch ve sweep-auditech
   (db-integrity, cascade, state, cache, form-schema, upload) = **coverage gap** → zařaď nové položky do
   **scope příslušného sub-agenta v této Fázi 2** (proauditovat hned) A nahlas „rozšiř inventuru v plánu".
4. Do reportu sekce **📈 Rozšíření kontroly**.

> ⚠️ Scannery (tier A) se rozšiřují samy; **sweepy mají v plánech zamrzlou inventuru** („70 kolekcí",
> „~40 listenerů") — census je jediný způsob, jak chytit, že je kód přerostl. Bez něj audity tiše stárnou.

## Fáze 2 — Sweepy (sub-agenti, paralelně, READ-ONLY)

Pro každý audit označený **SWEEP** (po případném zúžení rozsahem) dispatch **jednoho** sub-agenta.
Všechny dispatchni **v jednom messagu** (paralelní běh). Read-only — agent needituje kód.

> ⚠️ Sweepy jsou čtení → paralelizace v pořádku. Opravy (Fáze 5) se NEparalelizují a BE+FE se nemíchá
> v jedné dávce ([feedback_no_mixed_be_fe_batch]).

### Prompt sub-agenta (vyplň `<…>`)

> Jsi auditor stylu **`<audit>`**. NEpiš kód, jen čti a hlas.
> 1. Přečti `docs/<audit>-plan/README.md` (osy, perspektivy P*, M-metody, úrovně jistoty L*, **Cílová
>    hloubka per oblast**, **Pracovní postup**, pasti) + číslované oblasti + registr `docs/<audit>-audit.md`
>    (známé nálezy + jejich stav).
> 2. Projeď **aktuální kód** v záběru auditu podle „Pracovní postup". Dosáhni hloubky, jaká jde **bez
>    živé infry** (statické L1-L2: čtení + cross-ref os + census). Vrstvy potřebující DB/e2e/Stryker/TLC
>    **neoznačuj za hotové** — uveď `⏭️ L<n> vyžaduje <+db/+e2e/+teeth/+formal>`.
> 3. **Nový povrch z census** (předám seznam): proauditovat jako součást záběru.
> 4. Vrať **JEN čerstvé nálezy** ve formátu registru. Každý klasifikuj:
>    `🆕 nový` / `♻️ regrese` (dřív opravený, zase rozbitý) / `🔓 stále otevřený` (z registru, pořád platí).
>    Formát: `<PREFIX>-RUN — [osa] popis · Kde: soubor:řádek · Dopad · Návrh · dosažená úroveň L<n>`.
> 5. Na konci uveď **dosaženou hloubku vs cílová** (z plánu) a co zbývá pro plnou hloubku.
> Stručně, česky, žádné výpisy souborů. Pokud nic čerstvého: „bez nových nálezů, L<n>".

Posbírej výstupy agentů.

## Fáze 3 — Hloubkové vrstvy (gated příznaky)

- **`+db`** — pusť DB scany: `db-integrity-plan/tools/integrity-scan` (M-SCAN + M-TYPE),
  `cascade-delete-plan/tools/orphan-scan`. Read-only, NE na ostrý provoz (nejdřív dev/staging/`matrix`
  — [project_server_swap]).
- **`+e2e`** — BE jest e2e: `race-condition.e2e-spec.ts`, `seed-scenario.*` (⚠️ seed-scenario FA/RC chce
  `MongoMemoryReplSet` — bez něj jen happy-path L2, zbytek `⏭️ blokováno`). Použij `--maxWorkers=2`
  ([project_be_test_mongo_flaky]).
- **`+teeth`** — Stryker (BE i FE). Dlouhé. Jinak: ověř existenci teeth guardů přes G-matici.
- **`+formal`** — TLC nad `state-consistency-plan/tla/` + `race-condition-plan/tla/`.
- _Bez příznaku:_ proof-vrstvy se **ověří přes G-matici** v bráně (žije odvozený guard G≥3/G4?), neběží znovu.

## Fáze 4 — Konsolidace + META brána (16. audit)

1. Slož `RUN/report.md` (šablona níže) ze scannerů + sweepů + census + hloubkových vrstev.
2. **Brána:** `npm run audit:regression -- --ci`. Ověří, že každý opravený důležitý nález má živou
   pojistku (G≥2) — „je vše v pořádku". Nenulový exit = regrese-riziko → do reportu jako 🔴.
3. **TL;DR uživateli:** kolik 🆕/♻️/🔓 nálezů, kolik 🔴, coverage drift souhrn, stav brány, **návrh
   pořadí oprav**. Čekej na pokyn.

## Fáze 5 — Opravy (GATED — workflow projektu)

NEopravuj automaticky. Předlož plán oprav, čekej na souhlas ([feedback_workflow]). Při opravách:

- **Nemíchat BE+FE** v jedné paralelní dávce ([feedback_no_mixed_be_fe_batch]).
- Po BE změně **restart** (`nest --watch` drží starý bundle) ([feedback_be_restart_required]).
- FE **nikdy prettierem** → `eslint --fix` ([feedback_fe_no_prettier]); ověř `npm run build`
  ([project_fe_build_preexisting_errors]).
- BE jest **`--maxWorkers=2`** ([project_be_test_mongo_flaky]); BE precommit = typecheck+lint, testy ručně
  ([feedback_be_precommit_prettier]).
- Ke každé opravě **doplň pojistku G≥2** (test/scanner), ať brána nezčervená.
- Aktualizuj příslušný `docs/<audit>-audit.md` (stav nálezu) a **inventuru v plánu** u coverage gapů.
- Git **na uživateli** ([feedback_git_manual]).

---

## Šablona reportu (`RUN/report.md`)

```markdown
# Plný audit — RUN <datum> (FE <head> / BE <head>)

## TL;DR
- Čerstvé nálezy: <n> (🆕 <x> / ♻️ <y> / 🔓 <z>) · 🔴 <k>
- Coverage drift: +<a> kategorií přerostlo audit (detail ↓)
- META brána (audit:regression --ci): ✅ / ❌ <m> regrese-rizik
- Rozsah: <full/diff/výběr> · hloubka: <bez infry / +db / +e2e / …>

## Per audit
| Audit | Runner | 🆕 | ♻️ | 🔓 | 🔴 | Dosažená L | Pozn. |
|---|---|---|---|---|---|---|---|

## 📈 Rozšíření kontroly (coverage drift)
| Kategorie | Audit | Bylo | Teď | Nové položky | Akce |
|---|---|---|---|---|---|

## Detail nálezů
### <PREFIX>-RUN — …

## ⏭️ Neproběhlé vrstvy (vyžadují infru)
| Audit | Vrstva | Příznak/prerekvizit |
```

## Pravidla a hranice

- **Future-proof:** hloubku/postup čti vždy z plánů live; nikdy je nehardcoduj do skillu.
- **Hlasité mezery:** vrstva bez infry = `⏭️ blokováno + důvod + jak odblokovat`, ne tichý skip.
- **Nedestruktivně:** RUN report je nový soubor; historii registrů `*-audit.md` nepřepisuj — jen
  přidávej nové nálezy / měň stav existujících.
- **Coverage = měřitelné:** nový povrch ve sweep-auditu je nález („rozšiř kontrolu"), ne ticho.
- **Opravy jen po souhlasu**, podle pravidel Fáze 5.

## Pasti prostředí (z paměti)

- `audit:ws/config/errors/logs` žijí ve FE `scripts/`, ale čtou BE přes `IKAROS_BE_ROOT`
  (default `../../Projekt-ikaros`). Spustitelné z FE rootu.
- Seed-scenario: `backend/test/helpers/db.ts` je standalone Mongo → FA/RC tx neběží; pro plnou hloubku
  povýšit na `MongoMemoryReplSet` ([project_seed_scenario_audit]).
- BE jest plný paralelně flaky → `--maxWorkers=2` ([project_be_test_mongo_flaky]).
- Produkční cíl je `www.projekt-ikaros.com`; DB scany jen read-only a nejdřív dev/staging/`matrix`
  ([project_server_swap]).
