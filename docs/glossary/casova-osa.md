---
name: casova-osa
aliases: [timeline, časová osa, historie světa, timeline event]
category: herni-mechaniky
related: [[kalendar-sveta], [herni-cas], [pavucina]]
status: draft
---

# Časová osa

**TL;DR:** Chronologická historie světa (timeline) — minulé události s datem, názvem, popisem a obrázkem.

## Detail

Časová osa zobrazuje příběhovou historii světa v chronologickém pořadí. Záznam má datum, název, popis a volitelný obrázek.

Má **vlastní** konfiguraci kalendáře přes `worldSettings.timelineCalendarSlug` a samostatný getter (`getTimelineConfig`) — není to refaktor hlavního [[kalendar-sveta|kalendáře]]. Tím může běžet na jiném kalendáři než aktuální [[herni-cas|herní čas]].

## Kde se objevuje

- v dokumentaci: [15-cas-pribeh.md](docs/funkce/15-cas-pribeh.md)
- v UI: sekce Timeline / historie světa

## Nepleť s

- **[[herni-cas]]** — současnost; časová osa je minulost.
- **[[herni-akce]]** — nadcházející událost s RSVP; timeline jsou minulé události.
