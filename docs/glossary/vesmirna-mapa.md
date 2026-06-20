---
name: vesmirna-mapa
aliases: [universe, vesmírná mapa, vesmír, force-directed graf, universe map]
category: herni-mechaniky
related: [[obrazkovy-atlas], [takticka-mapa], [pavucina]]
status: draft
---

# Vesmírná mapa

**TL;DR:** Interaktivní force-directed graf (universe) — uzly (planety/místa) a vazby mezi nimi.

## Detail

Vesmírná mapa (14.2) zobrazuje místa světa jako force-directed graf: uzly = planety/lokace, hrany = vazby. Slouží k makro-navigaci a vztahům mezi místy.

Signál `universe:updated` přes WS je jen `{worldId}` bez dat (leak-safe) — klient refetchuje filtrovaný GET.

## Kde se objevuje

- v dokumentaci: [14-mapy-nastroje-hry.md](docs/funkce/14-mapy-nastroje-hry.md)
- v UI: sekce Vesmír / universe ve světě

## Nepleť s

- **[[obrazkovy-atlas]]** — galerie obrázkových map; vesmírná mapa je graf.
- **[[takticka-mapa]]** — herní bojiště; vesmírná mapa je makro-graf míst.
- **[[pavucina]]** — graf příběhových vztahů NPC/frakcí, ne míst.
