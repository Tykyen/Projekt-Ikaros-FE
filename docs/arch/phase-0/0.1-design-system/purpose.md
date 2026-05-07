# Účel

Definuje vizuální základ aplikace — tokeny, komponenty a theming — tak aby všechny fáze stavěly na jednotném designu.

## Odpovědnosti

- CSS custom properties (spacing, typografie, barvy) v `src/index.css`
- Základní UI komponenty: `Button`, `Input`, `Card`, `Modal`, `Spinner`, `Badge`
- Theming architektura přes `data-theme` atribut — Ikaros platforma vs. světy

## Mimo rozsah

- Konkrétní barevné schéma světů (každý svět má vlastní téma, řeší se per-svět)
- Feature-specifické komponenty (patří do `components/features/`)

## Kontext

Všechny ostatní fáze závisí na tomto design systému. Komponenty jsou v `src/components/ui/`, exportovány přes `src/components/ui/index.ts`.
