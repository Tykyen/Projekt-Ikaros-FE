# Poznámky pro AI agenta

## Před zahájením práce

- Přečti `src/pages/errors/ErrorPage.tsx` — existující error page pro `errorElement`
- Ověř že `main.tsx` má `errorElement` na obou layoutech v `router.tsx`

## Co se vytváří

- `src/components/GlobalErrorBoundary.tsx` — class component
- Aktualizace `src/main.tsx` — `GlobalErrorBoundary` jako nejvyšší wrapper

## Důležitá omezení

- `GlobalErrorBoundary` nesmí používat hooks (class component)
- Nesmí duplikovat `errorElement` — jsou to dvě různé věci
- Recovery UI musí mít tlačítko které volá `window.location.reload()` nebo resetuje boundary state

## Závislosti

- `docs/arch/phase-0/0.6-providers-setup/` — 0.6 doplní Toaster do main.tsx, 0.5 přidá GlobalErrorBoundary
- `src/pages/errors/ErrorPage.tsx` — existující, neměnit

## Doporučený postup

1. Vytvořit `GlobalErrorBoundary` komponentu
2. Obalit `RouterProvider` v `main.tsx`
3. Ověřit TypeScript build

## Časté chyby

- Zapomenout že Error Boundary nezachytí chyby v event handlerech ani asynchronní chyby — jen rendering
- Umístit boundary příliš hluboko — musí být nad `RouterProvider`
