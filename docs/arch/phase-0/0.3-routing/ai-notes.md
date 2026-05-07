# Poznámky pro AI agenta

## Před zahájením práce

- Přečti `src/router.tsx` — kompletní route tree
- Přečti `src/store/authStore.ts` — klíče a encoding tokenů v localStorage
- Přečti `routing.md` — kompletní mapa routes a guards

## Důležitá omezení

- Nové stránky musí mít `export default` (vyžaduje `React.lazy`)
- Nový stub přidat do `src/router.tsx` i do `routing.md`
- `/:slug` v WorldLayout musí zůstat **poslední** — je catch-all
- `RoleGuard` je FE UX ochrana — BE vždy validuje práva samostatně
- Neměnit encoding tokenu v `authLoader` bez aktualizace `authStore.ts`

## Závislosti

- `docs/arch/phase-0/0.2-layout/` — layouty použité jako parent routes
- `src/store/authStore.ts` — `accessTokenAtom` (klíč: `ikaros.jwt`)
- `src/types/index.ts` — `UserRole` enum pro RoleGuard

## Časté chyby

- Přidat route pro `/svet/:worldId/xxx` před `/:slug` — catch-all route musí být vždy poslední
- Zapomenout `export default` u nové page komponenty — `React.lazy` selže
- Použít `minRole` místo `roles[]` v RoleGuard — selhává pro specializované role
- Přidat novou route bez aktualizace `routing.md`
