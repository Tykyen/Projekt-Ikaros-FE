---
name: wikilink
aliases: [wikilink, wiki odkaz, LinkPicker, LinkPickerPopover, vkládání odkazů]
category: ui
related: [[stranka], [editor-obsahu], [backlinks]]
status: draft
---

# Wikilink

**TL;DR:** Vnitřní odkaz na [[stranka|stránku]]/entitu vkládaný přes `[[` dropdown (LinkPicker) — generuje i [[backlinks|zpětné odkazy]].

## Detail

Wikilink je odkaz mezi obsahem světa. Vkládá se v [[editor-obsahu|editoru]] napsáním `[[`, které otevře našeptávač (sjednocený `LinkPickerPopover`, shared `LinkPicker`). Z wikilinků se počítají [[backlinks|backlinks]].

📚 Sjednocený picker (7.2n) používá rail/bublina/buňka/menu; past: nevyrábět 4. kopii, shared bere generický `LinkSuggestion` + `makeSlug`.

## Kde se objevuje

- v dokumentaci: [11-stranky-wiki-informace.md](docs/funkce/11-stranky-wiki-informace.md)
- v kódu: `shared/ui/LinkPicker`
- v UI: vkládání odkazů v editoru

## Nepleť s

- **[[backlinks]]** — opačný směr (kdo odkazuje sem).
- **[[deep-link]]** — URL parametr na entitu; wikilink je odkaz v obsahu.
