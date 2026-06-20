---
name: stranka
aliases: [page, stránka, wiki stránka, Page entity, wiki]
category: svet
related: [[typ-stranky], [pristup-ke-strance], [akj-zalozka], [postava], [sablona-stranky]]
status: draft
---

# Stránka

**TL;DR:** Jednotná obsahová entita `Page` ve [[svet|světě]] — wiki, postavy, NPC, lokace, novinky…; rich-text s wikilinky.

## Detail

Stránka je univerzální jednotka obsahu světa. Od kroku 9.1 je Page **primární** a sjednocená s [[postava|Character]] (Character drží jen 5 [[subdokument-postavy|subdokumentů]]). Stránka má [[typ-stranky|typ]], rich-text obsah (TipTap, bez table extension), [[akj-zalozka|AKJ záložky]], zpětné odkazy a [[pristup-ke-strance|pravidla přístupu]].

⚠️ `page.content` se renderuje BEZ table extension → `<table>` se zahodí; seedovaný obsah dělej jako list/heading, ne tabulky.

## Kde se objevuje

- v dokumentaci: [11-stranky-wiki-informace.md](docs/funkce/11-stranky-wiki-informace.md)
- v UI: stránky ve světě (wiki, postavy, informace)

## Nepleť s

- **[[postava]]** — herní entita; postava je dnes navázaná na stránku.
- **[[sablona-stranky]]** — šablona atributové tabulky, ne obsah stránky.
