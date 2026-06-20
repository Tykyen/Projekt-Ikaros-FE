# Chybový deník — index

Záznam **mých vlastních chyb, omylů a slepých uliček** + poučení. Vede ho skill [`chyby`](../../.claude/skills/chyby/SKILL.md).

**Hlavní účel: NECYKLIT SE.** Než zkusím další variaci nějaké opravy, projdu **tenhle index** (je krátký — jen řádky). Když tu vidím podobný už neúspěšný pokus, **nezkouším ho znovu** — změním přístup od základu, nebo se zeptám.

> Pravidlo: tutéž chybu 2× = STOP. · **Příští ID: CH-009.**

## Jak je deník členěný

- Tento `README.md` = **index** (jeden řádek per chyba: ID · oblast · stručně · příznak cyklení). Drží se krátký — proto se dá vždy přečíst celý.
- **Detaily** jsou v souborech per oblast (`tisk.md`, `be.md`, `fe.md`, `proces.md`, …) — sem zapisuje skill plný záznam. Nové oblasti se zakládají dle potřeby.
- Když index narostl moc → archivovat vyřešené/staré řádky do `archiv.md` (ponechat poučení, zkrátit index).

## Index chyb

| ID | Oblast | Stručně | Příznak cyklení |
|----|--------|---------|-----------------|
| [CH-001](tisk.md#ch-001) | tisk | `visibility:hidden`+`absolute;inset:0` → ořez na 1 stránku | ladím inset/position, obsah se ořezává |
| [CH-002](tisk.md#ch-002) | tisk | klon do `<body>` měl obsah, ale celý neviditelný | „klon má obsah", ale tisk prázdný |
| [CH-003](tisk.md#ch-003) | tisk | řešil jsem barvu, ač skryté bylo úplně vše | ladím barvy, ale nevidím vůbec nic |
| [CH-004](tisk.md#ch-004) | proces/tisk | 3 varianty téže CSS izolace + deploy-test smyčka | 3. „fix tisku" za sebou, jiný CSS detail |
| [CH-005](tisk.md#ch-005) | tisk | `win.print()` dřív než načtení obrázků | text se tiskne, obrázky ne |
| [CH-006](tisk.md#ch-006) | tisk | reset na `afterprint` hlavního okna (tisk v jiném okně) | UI hlavní stránky zaseknuté v tisk. stavu |
| [CH-007](tisk.md#ch-007) | tisk | CSS appky v tisk. okně bez resetu SPA layoutu → prázdné listy | hodně stránek, většinou prázdných |
| [CH-008](tisk.md#ch-008) | tisk | `position:static !important` na `*` rozbil obrázky | oprava A vrátí regresi B |
| [CH-META](tisk.md#ch-meta) | tisk | klonování živého DOMu na tisk je principiálně křehké | dlouhá série dílčích „fixů" jedné featury |
