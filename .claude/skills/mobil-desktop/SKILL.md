---
name: mobil-desktop
description: Ověř, že upravená UI komponenta, layout nebo stránka funguje správně na mobilu i počítači. Spusť po každé grafické úpravě UI.
---

# Skill: mobil-desktop

Vizuálně a strukturálně ověří responsivitu upravené komponenty.

## Viewporty k otestování

| Zařízení | Šířka |
|----------|-------|
| Mobil    | 375px |
| Tablet   | 768px |
| Desktop  | 1440px |

## Postup

1. **Spusť dev server** pokud neběží.
2. **Otevři komponentu v prohlížeči** — naviguj na stránku, kde se komponenta vyskytuje.
3. **Pro každý viewport** (375 → 768 → 1440px) udělej screenshot a zkontroluj:
   - [ ] Žádný horizontální scroll
   - [ ] Texty nejsou oříznuté ani přetékající
   - [ ] Tlačítka a interaktivní prvky jsou dostatečně velké pro dotyk (min. 44×44px na mobilu)
   - [ ] Obrázky se správně škálují
   - [ ] Layouty přechází plynule (flex/grid wrap bez rozbitých mezer)
   - [ ] Navigace a modály jsou použitelné na malé obrazovce
4. **Nahlásit výsledek** — projde / neprojde + popis konkrétních problémů.
5. **Pokud neprojde** — použij skill `dluh` nebo oprav hned (dle závažnosti), čekej na souhlas.

## Pravidla

- Netestuj jen vizuálně — zkontroluj i CSS (flex-wrap, overflow, min-width, media queries).
- Pokud komponenta používá pevné pixelové šířky (`width: 400px`), vlož dluh — je to potenciální problém.
- Na mobilu preferuj `stack` layout (prvky pod sebou), na desktopu `side-by-side`.
