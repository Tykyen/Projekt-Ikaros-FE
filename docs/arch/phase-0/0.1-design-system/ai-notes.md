# Poznámky pro AI agenta

## Před zahájením práce

- Přečti `src/components/ui/index.ts` — zjistíš které komponenty existují
- Přečti `src/index.css` — zjistíš dostupné CSS proměnné

## Důležitá omezení

- Každá nová UI komponenta musí mít vlastní složku s `Component.tsx` + `Component.module.css`
- Po přidání komponenty aktualizuj `src/components/ui/index.ts`
- Nepoužívej inline styles pro věci které patří do CSS Modules
- CSS proměnné pro barvy a spacing definuj v `src/index.css`, ne v jednotlivých `.module.css`

## Závislosti

Žádné — tato fáze je základ pro vše ostatní.

## Časté chyby

- Zapomenout přidat export do `src/components/ui/index.ts`
- Hardcodovat barvy místo použití CSS proměnných
- Vytvářet feature-specifické komponenty v `ui/` místo `features/`
