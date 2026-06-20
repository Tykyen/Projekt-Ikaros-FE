---
name: tisk
aliases: [print, tisk, PDF export, tisk stránky, print mode]
category: architektura
related: [[stranka], [postava], [denik-postavy]]
status: draft
---

# Tisk

**TL;DR:** Režim tisku [[stranka|stránky]]/[[postava|postavy]]/[[denik-postavy|deníku]] do samostatného okna přes `window.print` (pilíř A exportu světa, spec 14.7).

## Detail

Tisk vykreslí obsah do tiskového okna (`window.print`) — body 2–14 exportu světa (pilíř A). Past při PDF generování projektu obecně: PDF jen přes Chrome headless (chybí pandoc/wkhtmltopdf), nutný izolovaný `--user-data-dir` + `print-color-adjust:exact`, jinak tiše selže.

Pozn.: `data-print-scope` se dává na stabilní wrapper. Hvězdná/WebGL část se pro tisk řeší DOM seznamem, ne canvasem.

## Kde se objevuje

- v dokumentaci: [11-stranky-wiki-informace.md](docs/funkce/11-stranky-wiki-informace.md)
- v kódu: tiskové wrappery (`data-print-scope`)
- v UI: tlačítko Tisk na stránce/postavě

## Nepleť s

- **Export světa (14.7c)** — ZIP export přes BE modul `world-export`; tisk je window.print jednotlivé stránky.
