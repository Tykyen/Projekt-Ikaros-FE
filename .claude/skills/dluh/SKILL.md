---
name: dluh
description: Zapiš technický dluh, chybu, riziko nebo nesrovnalost do docs/dluhy.md. Spusť kdykoli najdeš něco, co neopravuješ hned.
---

# Skill: dluh

Zapíše nový záznam do `docs/dluhy.md` (sekce "Otevřené").

## Postup

1. **Přečti** `docs/dluhy.md` — zjisti nejvyšší existující ID (D-NNN) a urči další číslo.
2. **Sestav záznam** podle šablony níže — vyplň ze kontextu konverzace.
3. **Vlož** nový záznam na začátek sekce `## Otevřené` (za nadpis, před první existující záznam).
4. **Informuj uživatele** jednou větou: co jsi zapsal a pod jakým ID.

## Šablona záznamu

```
### D-NNN — <stručný název>
**Soubor:** `<cesta>` — <kontext/funkce>
**Problém:** <co je špatně a proč>
**Dopad:** <Vysoký / Střední / Nízký> — <upřesnění>
**Řešení:** <návrh opravy>
**Kdy:** <kdy by se mělo řešit, nebo při jaké příležitosti>

---
```

## Pravidla

- ID je vždy sekvenční — nikdy nepřeskakuj, nikdy neopakuj.
- Pokud kontext nestačí pro některé pole, doplň `TBD`.
- Záznam piš česky, stručně, konkrétně.
- Nezapisuj dluhy, které jsou už v sekci "Uzavřené".
- Nezapisuj dluhy, které se právě opravují (ty jdou rovnou do kódu).
