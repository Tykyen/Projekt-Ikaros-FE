---
name: subdokument-postavy
aliases: [subdoc, subdokument, subdokumenty postavy, character subdocs]
category: herni-mechaniky
related: [[postava], [denik-postavy], [financni-ucet], [staty-systemu]]
status: draft
---

# Subdokument postavy

**TL;DR:** Pět samostatných kolekcí navěšených na [[postava|postavu]] — Deník, Kalendář, Finance, Výbava (inventář), Poznámky.

## Detail

Od sjednocení Page+Character (krok 9.1) drží `Character` jen 5 subdokumentů, zbytek obsahu je na [[stranka|stránce]]. Subdokumenty:

1. **[[denik-postavy|Deník]]** — vyprávěcí deník + per-systémová listina statů.
2. **Kalendář** — osobní kalendář postavy (viz [[kalendar-sveta]]).
3. **[[financni-ucet|Finance]]** — bankovní účty a transakce (jen PC).
4. **Výbava / inventář** — osobní věci (jen PC).
5. **Poznámky** — volné poznámky, dohody s PJ.

Subdokumenty se vytvářejí lazy (self-healing) při prvním přístupu. [[npc]] mají stejnou sadu; [[lokace]] jen kalendář.

## Kde se objevuje

- v dokumentaci: [12-postavy-bestiar-ekonomika.md](docs/funkce/12-postavy-bestiar-ekonomika.md)
- v UI: záložky na stránce postavy

## Nepleť s

- **[[akj-zalozka]]** — chráněná záložka na stránce, ne subdokument.
