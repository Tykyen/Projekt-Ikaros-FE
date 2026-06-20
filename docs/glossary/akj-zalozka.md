---
name: akj-zalozka
aliases: [AKJ záložka, protected tab, chráněná záložka, AKJ tab]
category: role-a-prava
related: [[akj-urovne], [pristup-ke-strance], [stranka]]
status: draft
---

# AKJ záložka

**TL;DR:** Chráněná záložka na [[stranka|stránce]] s vlastní úrovní utajení — zamčená se hráči ukazuje (🔒 jméno + úroveň), po získání přístupu se odemkne obsah.

## Detail

AKJ záložka je per-stránka chráněná sekce (clearance + grant, vynucené na BE). Nahradila starší `privateContent`/`'soukrome'` i page-level AccessPanel.

Viditelnost (reverze „no leak existence"):
- clearance záložky se hráči ukazují **zamčené** — 🔒 jméno + úroveň, bez obsahu,
- po přístupu 🔓 + obsah,
- záložky typu PJ-info / Soukromé zůstávají úplně skryté.

📚 Vlastník postavy vidí AKJ záložky na své PC defaultně (`ownerHidden` opt-out). [[pomocny-pj|PomocnyPJ]]+ a platform Admin+ obcházejí page-level AKJ gate.

## Kde se objevuje

- v dokumentaci: [11-stranky-wiki-informace.md](docs/funkce/11-stranky-wiki-informace.md)
- v UI: záložky na stránce (`AkjLockedPanel`)

## Nepleť s

- **[[akj-urovne]]** — stupně utajení (číselník); AKJ záložka je sekce chráněná některou z úrovní.
- **[[subdokument-postavy]]** — datový subdokument postavy, ne chráněná záložka stránky.
