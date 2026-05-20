---
name: cooldown
aliases: [cool-down, pauza]
category: architektura
related: [[zpracovat-tab]]
status: draft
---

# Cooldown

**TL;DR:** Časová pauza, během níž se nelze opakovat akce — např. 30 dní po změně username, 24 h po odmítnutí žádosti o přátelství.

## Detail

Cooldown chrání platformu před spam akcemi a dává protistraně čas na rozmyšlenou. Konkrétní hodnoty se liší podle workflow:

- **Změna username** — 30 dní.
- **Odmítnutí přátelství** — 24 h, než lze znovu požádat.
- **Reset hesla e-mailem** — max 3× za 15 min (anti-spam).

Cooldowny se počítají server-side, FE jen zobrazuje stav („Zkus znovu za X").

## Kde se objevuje

- v kódu: TBD (rozeseté po workflow handlerech BE)
- v dokumentaci:
  - HelpPage AccountSection + FaqSection
- v UI:
  - Profil → Bezpečnost (změna username), [[zpracovat-tab]] (po odmítnutí)

## Nepleť s

- **ban** — administrativní blok bez automatického konce.
- **rate limit** — síťová ochrana per request, ne per workflow.
