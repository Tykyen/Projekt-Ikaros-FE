# 02 — Vrstva scannerů (chytají co tvrdí? mají zuby? jsou trvanlivé?)

> 8 statických scannerů je páteř „papírové" obrany. Tahle oblast ověří, že každý (a) reálně selže na
> driftu, který má hlídat (zuby vstupu), a (b) není tak křehký, že ho přejmenování obejde. Osy: `LIVE`
> `DUR` `TEETH`.

## Scannery (z FE `package.json`)
| Script | Soubor | Hlídá | `--ci`? |
|---|---|---|---|
| `audit:routes` | scripts/route-audit.mjs | FE↔BE HTTP kontrakt | ověřit |
| `audit:nav` | scripts/nav-audit.mjs | router dead/orphan links | ✅ exit 1 |
| `audit:ws` | scripts/ws-audit.mjs | FE↔BE WS eventy | ⚠️ jen report |
| `audit:config` | scripts/prod-config-scan.mjs | 4-zdroj env drift | ✅ `--ci` |
| `audit:errors` | scripts/error-contract-scan.mjs | error code parita | ✅ `--ci` |
| `audit:logs` | scripts/log-hygiene-scan.mjs | log leak/debug | ✅ `--ci`/`--docker` |
| `audit:contrast` | scripts/audit-theme-contrast.mjs | WCAG kontrast | ✅ exit 1 |
| `lint:colors` | scripts/lint-no-hardcoded-colors.mjs | hardcoded barvy | ověřit |

## Checklist (per scanner)
1. **`--ci` chování** — vrací exit 1 na nález? (Bez toho ho nelze zapojit do CI → zůstane G1 navždy.)
   `audit:ws` a `audit:routes` jsou podezřelé (jen report) → `AR-xx` „scanner bez exit kódu".
2. **Zuby vstupu (TEETH)** — vlož umělý drift (dočasně rozbij route/error code/env) → scanner **musí**
   červenat. Zelená = scanner je slepý → `AR-xx`. (Necommitovat umělý drift.)
3. **Trvanlivost (DUR)** — je scanner string-match (`audit:ws`/`audit:routes`)? Přejmenuj symbol →
   obejde ho? Pokud ano: `AR-xx` DUR-RISK, doporuč AST/typovou variantu (vzor: log-hygiene M-SCAN ts-morph).
4. **Běží zeleně na `main`?** — předpoklad pro blocking zapojení (oblast 01). Pokud červená na
   pre-existujícím stavu → buď zbývající nálezy opravit, nebo guard nasadit jako warning-only nejdřív.

## Seed kandidáti
- **K-AR10** 🟡 `DUR` — `audit:ws`/`audit:routes` string-match → křehké.
- (z K-AR1) — všechny scannery G1 dokud nejsou v CI.

## Výstup
- Per scanner: má zuby? má `--ci`? je DUR-křehký? → řádky v matici (třída `contract`/`config`/`log`/`nav`).
- Seznam scannerů připravených k zapojení (oblast 01 Fáze B).
