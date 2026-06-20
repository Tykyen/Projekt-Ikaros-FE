---
name: editor-obsahu
aliases: [rich text editor, TipTap, editor obsahu, WYSIWYG editor]
category: ui
related: [[stranka], [wikilink], [denik-postavy]]
status: draft
---

# Editor obsahu

**TL;DR:** Rich-text (WYSIWYG) editor [[stranka|stránek]] a [[denik-postavy|deníků]] postavený na knihovně TipTap — formátování, [[wikilink|wikilinky]], odkazy.

## Detail

Editor obsahu (TipTap) je hlavní nástroj pro psaní obsahu. Umí formátování, nadpisy, seznamy, [[wikilink|wikilinky]] (`[[…]]`) přes LinkPicker a vkládání odkazů.

⚠️ `page.content` se renderuje **bez** table extension → `<table>` se zahodí (viz [[stranka]]). Generovaný/seedovaný obsah dělej jako list/heading, ne tabulky.

## Kde se objevuje

- v dokumentaci: [11-stranky-wiki-informace.md](docs/funkce/11-stranky-wiki-informace.md)
- v UI: editace stránek a deníků

## Nepleť s

- **[[sablona-stranky]]** — předpis atributové tabulky; editor obsahu píše volný text.
