---
name: gdpr-export
aliases: [GDPR export, export dat, data export, stažení dat]
category: architektura
related: [[deletion-pending], [reaktivace]]
status: draft
---

# GDPR export

**TL;DR:** Export vlastních dat uživatele do JSON (GDPR) — BE hotový, FE zatím bez konzumenta (rozpojeno).

## Detail

GDPR export umožní uživateli stáhnout svá data v JSON. ⚠️ Stav: BE endpoint existuje, ale FE nemá konzumenta — funkce je rozpojená (viz docs/dluhy). Souvisí se [[deletion-pending|self-delete]] tokem (GDPR avatar).

## Kde se objevuje

- v dokumentaci: [01-ucet-prihlaseni-bezpecnost.md](docs/funkce/01-ucet-prihlaseni-bezpecnost.md), [08-platformova-administrace.md](docs/funkce/08-platformova-administrace.md)

## Nepleť s

- **[[deletion-pending]]** — smazání účtu; GDPR export jen stahuje data.
