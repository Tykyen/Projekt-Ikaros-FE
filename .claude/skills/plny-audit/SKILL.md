---
name: plny-audit
description: Závěrečná HLOUBKOVÁ brána kvality — projede každou oblast (00→X) všech 16 auditních stylů proti AKTUÁLNÍMU kódu BE+FE do PLNÉ cílové hloubky (statika L1-L3 + proof-vrstvy +db/+e2e/+teeth/+formal). Nejdřív self-maintenance (ověří/doplní, že plány sedí na HEAD), pak vyčerpávající průchod píď po pídi s maximálním fan-outem agentů (1 agent = 1 oblast), pak proof-vrstvy, brána a report. Běh klidně dny. Resumable. Spustit na konci 14.9 a na konci Etapy II, kdy je cílem doložit, že nezůstala ani nejmenší chyba. NEopravuje bez souhlasu.
---

# Skill: plný audit (hloubková závěrečná brána)

**NE rychlý orchestrátor.** Tohle je **závěrečná hloubková brána** spouštěná v klíčových bodech
. Cíl: projít **každý kousek** webu **píď po pídi, oblast po
oblasti** přes všech 16 auditních stylů a doložit **maximální dosažitelnou jistotu, že nezůstala ani
nejmenší chyba**. Hloubka před rychlostí — běh **klidně dny**. Rychlost se získává **paralelizací**
(masivní fan-out agentů po oblastech), NE zkracováním hloubky.

> Historie: dřív byl tento skill „rychlý orchestrátor L1-L2". To byla vada návrhu — 16 auditů bylo
> stavěno jako **extrémně hloubkové** (dny běhu, záměr). Skill je teď přehrává v plné hloubce.

## Co dělá / NEdělá

| Dělá | NEdělá |
|---|---|
| projede **každou oblast 00→X** každého auditu do **plné cílové hloubky** | nestrop­uje na L1-L2 / nešidí hloubku kvůli času |
| **self-maintenance**: ověří + doplní, že plány sedí na aktuální HEAD | nepouští audit proti zastaralému plánu (tichý drift) |
| **maximální fan-out** agentů (1 agent = 1 oblast), ve vlnách | nehrne vše jedním sériovým průchodem |
| **infra je default ON** (+db/+e2e/+teeth/+formal); chybí → hlasitě stojí | netváří se „hotovo", když proof-vrstva neproběhla |
| **resumable** (per-oblast checkpoint) — dlouhý běh přežije přerušení | nezačíná po přerušení od nuly |
| 16. (anti-regression) jako **závěrečná brána** | neopravuje automaticky / bez souhlasu |

## Argumenty

| Arg | Význam |
|---|---|
| _(bez)_ | **plná hloubka, vše ON** — freshness + vyčerpávající průchod 00→X + všechny proof-vrstvy + brána |
| `--resume` | pokračuj z checkpointů (přeskoč už hotové oblasti) |
| `--audit <a,b,…>` | jen vyjmenované audity (názvy plán-dirů bez `-plan`), pořád plná hloubka |
| `--area <NN>` | jen oblast(i) daného čísla (ladění jedné oblasti) |
| `diff <ref>` | jen audity/oblasti dotčené git diffem proti `<ref>` (rychlý mezikrok, NE závěrečná brána) |
| `--no-db` / `--no-e2e` / `--no-teeth` / `--no-formal` | **opt-OUT** proof-vrstvy (vědomě nižší hloubka — do reportu jako ⏭️) |
| `--update-baseline` | po běhu ulož census jako nový coverage baseline |

> **Inverze proti staré verzi:** hloubka je **default**, infra se odpojuje opt-outem. Bez příznaku =
> nejhlubší možný běh. Opt-out se v reportu objeví jako vědomá mezera, ne ticho.

---

## Fáze 0 — Příprava + infra (nic se nesmí tiše ošidit)

1. **Git HEAD** obou repo (`git rev-parse HEAD` ve FE i BE) → do reportu.
2. **Auto-discovery + manifest oblastí:** vyjmenuj `docs/*-plan/` ↔ `docs/<name>-audit.md`. Pro každý
   audit naglobuj **oblasti**: `docs/<audit>-plan/[0-9][0-9]-*.md` (00, 01, … X) + README.
   Výsledek = **manifest jednotek** `(audit, oblast)` — celý pracovní seznam (~150-200 jednotek).
   Oblast uvedená v README, ale **bez souboru** → zaznamenej jako mezeru pro Fázi A (audituje se
   z popisu v README).
3. **Infra bring-up / verify (default ON):**
   - **Mongo** (`+db`): nastartuj/ověř dev nebo staging Mongo (BE `docker-compose` nebo
     `MongoMemoryReplSet`). **Produkční DB jen read-only a jen s EXPLICITNÍM souhlasem uživatele**
     ([project_server_swap]). Chybí → vrstvu označ a **hlasitě stůj**, ne tichý L2.
   - **Stryker** (`+teeth`): `@stryker-mutator/core` (BE i FE `stryker.conf.json`).
   - **TLC** (`+formal`): `tla2tools.jar` + Java. (Pozn.: bývá v `c:/tmp/tla2tools.jar`.)
   - **e2e** (`+e2e`): BE jest e2e harness (`MongoMemoryReplSet`).
   - Cokoli chybí a není opt-outnuto → **STOP s instrukcí, jak odblokovat** (ne tiché snížení hloubky).
4. **RUN složka:** `docs/full-audit/RUN-<YYYY-MM-DD-HHmm>/` + `scanners/` + **`checkpoints/`**
   (per-jednotka `<audit>__<oblast>.md` → resumability) + `proof/` (výstupy proof-vrstev).

### Mapa audit → scanner + proof-vrstvy (per oblast čti cílovou L z plánu)

| Plán dir | Registr (prefix) | Scanner (podpora Fáze A) | Repo | Proof-vrstvy (Fáze C) |
|---|---|---|---|---|
| `bug-plan` | `bug-audit.md` (`N-`) | `npm run audit:routes` | FE↔BE | e2e |
| `role-plan` | `role-audit.md` (`R-`) | `npm run audit:routes` | FE↔BE | e2e |
| `nav-plan` | `nav-audit.md` (`NAV-`) | `npm run audit:nav` | FE↔BE | e2e/crawl |
| `ws-contract-plan` | `ws-audit.md` (`W-`) | `npm run audit:ws` | BE | e2e |
| `prod-config-plan` | `prod-config-audit.md` (`PC-`) | `npm run audit:config` | BE+FE | — |
| `error-contract-plan` | `error-contract-audit.md` (`EC-`) | `npm run audit:errors` | FE+BE | e2e probe |
| `log-hygiene-plan` | `log-hygiene-audit.md` (`LH-`) | `npm run audit:logs` | BE | runtime e2e |
| `form-schema-plan` | `form-schema-audit.md` (`F-`) | — | FE↔BE | e2e round-trip |
| `cache-plan` | `cache-audit.md` (`C-`) | — | FE | e2e round-trip |
| `upload-media-plan` | `upload-media-audit.md` (`UM-`) | — | BE | +db + e2e (probe) |
| `state-consistency-plan` | `state-consistency-audit.md` (`S-`) | — | FE+BE | +formal (TLC) |
| `cascade-delete-plan` | `cascade-delete-audit.md` (`CD-`) | — | BE | +db (orphan/blob-scan) |
| `db-integrity-plan` | `db-integrity-audit.md` (`DI-`) | — | BE | +db (integrity-scan/M-TYPE) |
| `race-condition-plan` | `race-condition-audit.md` (`RC-`) | — | BE | +e2e + +formal (TLC) |
| `seed-scenario-plan` | `seed-scenario-audit.md` (`SS-`) | — | BE | +e2e (replSet) |
| `anti-regression-plan` | `anti-regression-audit.md` (`AR-`) | `npm run audit:regression -- --ci` | META | **běží POSLEDNÍ** |
| _(všechny)_ | — | — | — | `+teeth` (Stryker) ověří sílu testů |

---

## Fáze A — Freshness / self-maintenance (plány MUSÍ sedět na HEAD)

> Bez tohoto by se hloubkový průchod opřel o zastaralou inventuru a tiše minul nový kód.

1. `npm run audit:census -- --json` + spusť podpůrné scannery (`audit:routes/nav/ws/config/errors/logs`)
   do `scanners/` — živý povrch.
2. **Per audit** porovnej plán (oblasti 00→X + jejich inventury) s aktuálním kódem:
   - nový povrch (kolekce/route/listener/DTO/upload/delete-cesta/env…) z census → patří do oblasti?
   - chybí soubor oblasti, který README slibuje?
   - sedí „zamrzlé" počty v plánu („~70 kolekcí" apod.) na realitu?
3. **Self-doplnění (rozhodnutí #4):** zastaralou inventuru / chybějící položku oblasti **doplň přímo do
   plánu** (`docs/<audit>-plan/…`), označ datem `(plný audit RUN <datum>)`. Nedestruktivně — přidávej,
   historii needituj.
4. **Brána A:** report „všech 16 plánů aktuální vůči HEAD <git>". Teprve pak Fáze B. Doplněné oblasti
   vstupují do manifestu Fáze B.

---

## Fáze B — Vyčerpávající průchod oblastí (MAX paralelně, rozhodnutí #2)

Pracovní seznam = všechny `(audit, oblast)` z manifestu. S `--resume` přeskoč jednotky, co už mají
hotový checkpoint.

### Vlnový fan-out (jádro rychlosti)
- Dispatchuj **co nejvíc agentů souběžně** — v jednom message tolik `Agent` volání, kolik harness
  unese; jak agenti dojíždějí, **doplňuj další jednotky** (drž pool nasycený na max).
- Agenti jsou **read-only** → paralelizace bezpečná. (Opravy ve Fázi E se neparalelizují a BE+FE se
  nemíchá — [feedback_no_mixed_be_fe_batch].)
- Po každé vlně **zapiš checkpoint** každé hotové jednotky → resumability (rozhodnutí #1).

### Prompt agenta oblasti (vyplň `<…>`)

> Jsi hloubkový auditor **oblasti `<NN-název>`** stylu **`<audit>`**. READ-ONLY — nepiš kód, jen čti a hlas.
> Tvůj záběr je JEN tato oblast, ale v ní **vyčerpávající** — píď po pídi.
> 1. Přečti **celý** soubor oblasti `docs/<audit>-plan/<NN-…>.md` + plán README (osy, perspektivy P*,
>    M-metody, úrovně jistoty L*, **Cílová hloubka pro tuto oblast**, „Pracovní postup", pasti) +
>    relevantní část registru `docs/<audit>-audit.md` (známé nálezy + stav).
> 2. Projdi **VEŠKERÝ** kód v záběru této oblasti podle „Pracovní postup" — **každý** dotčený soubor/
>    symbol, **každou osu**, **každou M-metodu dosažitelnou staticky**. Cíl = plná statická hloubka
>    (L1-L3: čtení + cross-ref + strukturální důkaz), ne L2 strop.
> 3. Vrstvy, co potřebují živou infru (DB/e2e/Stryker/TLC), **NEoznačuj za hotové** — místo toho vydej
>    **PROOF-REQUEST**: přesně co spustit (`+db` integrity/orphan na kolekci X · `+e2e` která sada ·
>    `+teeth` Stryker na modul Y · `+formal` TLC na Z.tla) a co to má dokázat.
> 4. Vrať: (a) **čerstvé nálezy** ve formátu registru, klasifikuj `🆕 nový`/`♻️ regrese`/`🔓 otevřený`,
>    formát `<PREFIX>-RUN — [osa] popis · Kde: soubor:řádek · Dopad · Návrh · dosažená L<n>`;
>    (b) **pokrytí**: které soubory/osy/M-metody jsi reálně prošel; (c) **dosažená L vs cílová L**
>    oblasti; (d) seznam **PROOF-REQUEST** pro Fázi C.
> Stručně, česky, žádné slepé výpisy souborů. Když nic čerstvého: „bez nových nálezů, prošel jsem
> <co>, dosažená L<n>".

Posbírej výstupy → zapiš checkpointy → pokračuj další vlnou, dokud manifest není hotový.

---

## Fáze C — Proof-vrstvy (centrálně, jednou, paralelně kde to jde)

Agreguj **PROOF-REQUESTy** ze všech oblastí a pusť těžké důkazy **jednou** (ne per agent):

- **`+db`** (read-only, nejdřív dev/staging/`matrix`; prod jen s explicitním souhlasem):
  `db-integrity-plan/tools/integrity-scan` (TYPE/OR/RR/DUP/INV…) + `cascade-delete-plan/tools/orphan-scan`
  + blob-audit (Cloudinary vs DB URL). Skripty materializuj z `.md` do `proof/`, spusť s `MONGO_URI`.
- **`+e2e`**: BE jest e2e (`--maxWorkers=2`, [project_be_test_mongo_flaky]) — seed-scenario (replSet),
  race-condition, error/log runtime probe. `test/race/` + `seed-scenario`.
- **`+teeth`**: Stryker **per modul** (= další paralelizace) — měří, jestli testy chytí umělé mutace.
  Dlouhé; běž na pozadí.
- **`+formal`**: TLC per `.tla` (`state-consistency-plan/tla/`, `race-condition-plan/tla/`) s `tla2tools.jar`.
- **Mapuj výsledky zpět na oblasti**: každý PROOF-REQUEST dostane výsledek → oblast finalizuje
  `dosažená L = cílová L`, nebo (opt-out/chybí infra) hlasitě `⏭️ blokováno + jak odblokovat`.

---

## Fáze D — Konsolidace + META brána + report

1. `RUN/report.md` (šablona níže): **per-oblast matice** (každá `00→X`: cílová vs dosažená L, nálezy,
   proof výsledek) + souhrn za audit.
2. **Brána:** `npm run audit:regression -- --ci` (běží POSLEDNÍ). Nenulový exit = regrese-riziko → 🔴.
3. **TL;DR uživateli:** kolik oblastí dosáhlo cílové L / kolik blokováno · nálezy 🆕/♻️/🔓 · 🔴 · stav
   brány · coverage drift z Fáze A · návrh pořadí oprav. **Pak teprve člověk kontroluje.**

## Fáze E — Opravy (GATED)

NEopravuj bez souhlasu ([feedback_workflow]). Při opravách: **BE+FE nemíchat** v jedné dávce
([feedback_no_mixed_be_fe_batch]); po BE změně **restart** ([feedback_be_restart_required]); FE **nikdy
prettierem** → `eslint --fix` + `npm run build` ([feedback_fe_no_prettier], [project_fe_build_preexisting_errors]);
BE jest `--maxWorkers=2` + precommit typecheck+lint, testy ručně ([feedback_be_precommit_prettier]); ke
každé opravě **pojistka G≥2**; aktualizuj `docs/<audit>-audit.md` + inventuru plánu; git **na uživateli**
([feedback_git_manual]).

---

## Šablona reportu (`RUN/report.md`)

```markdown
# Plný audit (hloubková brána) — RUN <datum> (FE <head> / BE <head>)

## TL;DR
- Oblastí celkem: <N> · dosáhlo cílové L: <x> · ⏭️ blokováno: <y>
- Nálezy: <n> (🆕 <a> / ♻️ <b> / 🔓 <c>) · 🔴 <k>
- Freshness (Fáze A): <z> plánů doplněno na HEAD · coverage drift souhrn
- META brána (audit:regression --ci): ✅ / ❌
- Rozsah: <full/diff/výběr> · proof-vrstvy: <db/e2e/teeth/formal — ON/opt-out>

## Per oblast (matice)
| Audit | Oblast | Cílová L | Dosažená L | 🆕 | ♻️ | 🔓 | 🔴 | Proof | Pozn. |
|---|---|---|---|---|---|---|---|---|---|

## 📈 Freshness / coverage drift (Fáze A)
| Audit | Co bylo zastaralé | Doplněno do plánu |
|---|---|---|

## Detail nálezů
### <PREFIX>-RUN — …

## ⏭️ Neproběhlé vrstvy (opt-out / chybí infra)
| Audit/oblast | Vrstva | Důvod | Jak odblokovat |
```

## Pravidla a hranice

- **Hloubka je default.** Nikdy ji tiše nesnižuj kvůli času — paralelizuj, nebo hlasitě nahlas opt-out/blok.
- **Future-proof:** cílovou hloubku/postup oblasti čti vždy **live z plánu**; nikdy nehardcoduj do skillu.
- **Self-maintenance napřed:** plány musí sedět na HEAD, než začne hloubkový průchod.
- **Resumable:** každá hotová oblast = checkpoint; `--resume` neopakuje hotové.
- **Nedestruktivně:** RUN report je nový soubor; registry/plány jen doplňuj, historii nepřepisuj.
- **Opravy jen po souhlasu** (Fáze E).

## Pasti prostředí (z paměti)

- `audit:ws/config/errors/logs` žijí ve FE `scripts/`, čtou BE přes `IKAROS_BE_ROOT` (default
  `../../Projekt-ikaros`). Spustitelné z FE rootu.
- BE e2e harness boot: `archiver` v8 je ESM → jest mock přes `moduleNameMapper` (`test/mocks/archiver.stub.ts`),
  jinak padá celá e2e sada (SS-RUN-01).
- Seed-scenario FA/RC tx potřebují `MongoMemoryReplSet`; bez něj jen happy-path L2.
- BE jest plně paralelně flaky → `--maxWorkers=2` ([project_be_test_mongo_flaky]).
- `+db` skripty (`integrity-scan`/`orphan-scan`) jsou v `.md` → materializuj do `proof/*.mjs`, spusť z BE
  (kvůli `mongodb` driveru), `MONGO_URI` z BE `.env` (hodnotu netiskni). Produkční cíl
  `www.projekt-ikaros.com` — read-only + explicitní souhlas ([project_server_swap]).
- `tla2tools.jar` bývá v `c:/tmp/`; Java přítomná (1.8).
- Stryker config: `backend/stryker.conf.json` + FE `stryker.conf.json`.
- Harness pustí omezený počet agentů naráz → fan-out po **vlnách**, pool drž nasycený.
