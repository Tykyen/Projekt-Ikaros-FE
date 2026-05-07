# Poznámky pro AI agenta

## Před zahájením práce

- Přečti `src/components/layout/IkarosLayout/IkarosLayout.tsx` a `WorldLayout.tsx`
- Přečti `src/contexts/WorldContext.tsx`
- Ověř že `<Outlet />` je přítomný v každém layoutu

## Důležitá omezení

- Layouty nesmí obsahovat page-specifickou logiku — jen shell strukturu
- `WorldContext` se nesmí používat mimo children `WorldLayout`
- Responsive pravidlo: mobile ≤768px musí mít drawer, ne sidebar

## Závislosti

- `docs/arch/phase-0/0.1-design-system/` — CSS proměnné a UI komponenty
- `src/api/hooks/useWorlds.ts` — `useMyWorlds()`, `useWorld()`
- `src/api/hooks/useMessages.ts` — `useUnreadCount()`
- `src/api/hooks/useSocket.ts` — `useSocketInit()`

## Časté chyby

- Volat `useWorldContext()` mimo `WorldLayout` strom — způsobí runtime error
- Přidávat page logiku do layoutu místo do příslušné page komponenty
- Zapomenout `onNav` callback v drawer linkách (drawer se nezavírá po navigaci)
