---
name: vyhledavani
aliases: [search, vyhledávání, fulltext, MeiliSearch, embedding search, hledání]
category: architektura
related: [[stranka], [svet], [superadmin]]
status: draft
---

# Vyhledávání

**TL;DR:** Hledání obsahu per [[svet|svět]] — fulltext (MeiliSearch) + sémantické (embedding/ONNX vektory), s kontrolou přístupu.

## Detail

Vyhledávání (13.1) má dvě vrstvy:
- **fulltext** — MeiliSearch (textová shoda),
- **sémantické** — embedding search přes ONNX vektory (`EmbeddingSearchService`).

`worldId` je povinný + access check (leak-safe). Admin má záložku „Search index" (rebuild indexu).

⚠️ MeiliSearch v docker-compose je POVINNÝ — bez něj tiše prázdné výsledky.

## Kde se objevuje

- v dokumentaci: [08-platformova-administrace.md](docs/funkce/08-platformova-administrace.md)
- v UI: vyhledávací pole ve světě, admin Search index

## Nepleť s

- **[[vesmirna-mapa]]** / atlas — to je navigace; vyhledávání je textové/sémantické hledání.
