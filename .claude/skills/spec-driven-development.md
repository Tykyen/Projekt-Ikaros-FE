---
name: spec-driven-development
description: Use when implementing any FE feature or phase — to verify spec exists before coding, and to update spec after implementation. Use when user asks to build, modify, or fix any component, page, or feature.
---

# Spec-driven development (FE)

Řídí celý vývojový cyklus: ověření specifikace → implementace → aktualizace specifikace.

## Fáze 1: Ověření specifikace

1. Identifikuj fázi a feature z kontextu úkolu
2. Zkontroluj `docs/arch/phase-X/spec-X.Y.md` — unified spec soubor pro danou fázi
3. **Pokud spec chybí:**
   - Zastav práci
   - Informuj uživatele — spec musí existovat a být schválena před implementací
   - Odmítni implementovat dokud spec neexistuje a není schválena uživatelem
4. **Pokud spec existuje:**
   - Přečti celý spec soubor
   - Přečti případné dílčí soubory (`purpose.md`, `decisions.md`, `ai-notes.md`) pokud existují

## Fáze 2: Implementace

- Implementuj přesně dle specifikace — nic navíc, nic vynechat
- Při každém netriviálním rozhodnutí ověř soulad se specifikací
- Pokud implementace odhalí rozpor nebo mezeru ve spec — zastav se a upozorni uživatele před pokračováním
- Dodržuj responsive pravidla z `base.md` (mobile ≤ 768px, tablet 769–1024px, desktop > 1024px)

## Fáze 3: Aktualizace specifikace

Po dokončení implementace:

1. **Zaškrtni hotové položky** v `docs/roadmap-fe.md`
2. **Uzavři dluhy** v `docs/dluhy.md` které implementace vyřešila
3. **Doplň dílčí spec soubory** (volitelně) — `purpose.md`, `decisions.md`, `ai-notes.md` pro potřeby budoucích AI agentů

Povinný workflow viz `base.md`:
`Brainstorming → Unified spec → Schválení → Implementační plán → Potvrzení → Kód`
