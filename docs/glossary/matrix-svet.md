---
name: matrix-svet
aliases: [Matrix world, seed svět]
category: svet
related: [[svet]], [[superadmin]]
status: draft
---

# Matrix svět

**TL;DR:** Speciální seed [[svet]] vytvořený automaticky při inicializaci databáze — patří primárnímu [[superadmin]]ovi (Tyky) a slouží jako referenční instance.

## Detail

Matrix svět vzniká přes seed skript: má pevný slug, `themeId = 'ikaros'`, vlastníka = první Superadmin v DB. Slouží jako:
- výchozí svět po čistém setupu (test, dev, první deploy),
- referenční ukázka funkčního světa.

Heslo Superadmina ani vlastnictví světa se neukládá do repozitáře.

## Kde se objevuje

- v kódu (BE):
  - backend/src/database/seed/matrix-world.seed.ts — definice seedu (slug, theme, owner)
- v UI:
  - Po čistém setupu viditelný jako první svět v `/svet`

## Nepleť s

- **běžný svět** — Matrix se nevytváří přes UI, ale ze seed skriptu; jinak se chová stejně.
