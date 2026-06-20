---
name: self-healing
aliases: [self-healing, lazy-create, samoopravení, lazy subdoc]
category: architektura
related: [[subdokument-postavy], [postava]]
status: draft
---

# Self-healing (lazy-create)

**TL;DR:** Chybějící [[subdokument-postavy|subdokument]] postavy se vytvoří automaticky při prvním přístupu, místo aby chyběl/spadl.

## Detail

Self-healing je vzor, kdy systém doplní chybějící data za běhu. U [[postava|postav]] se [[subdokument-postavy|subdokumenty]] (deník, finance…) lazy-vytvoří při prvním otevření, takže staré postavy bez subdoku nespadnou, jen se subdoc dogeneruje.

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)

## Nepleť s

- **[[cascade-delete]]** — úklid po smazání; self-healing naopak chybějící doplňuje.
