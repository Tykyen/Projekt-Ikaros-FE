# Poznámky pro AI agenta

## Před zahájením práce

- Přečti `src/main.tsx` — aktuální stav
- Přečti `src/store/uiStore.ts` — `activeThemeAtom`
- Přečti `src/api/hooks/useSocket.ts` — `useSocketInit` (D-002)
- Přečti `docs/dluhy.md` — D-002 popis

## Co se vytváří / mění

- `src/components/ThemeSync.tsx` — nová komponenta (čte atom, aplikuje data-theme)
- `src/main.tsx` — přidat JotaiProvider, Toaster, ThemeSync
- `src/api/hooks/useSocket.ts` — fix D-002

## Finální struktura main.tsx

```tsx
<StrictMode>
  <JotaiProvider>
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" theme="dark" richColors />
      </GlobalErrorBoundary>
    </QueryClientProvider>
    <ThemeSync />
  </JotaiProvider>
</StrictMode>
```

`ThemeSync` je mimo `QueryClientProvider` — nepotřebuje query kontext.

## Důležitá omezení

- `ThemeSync` musí být uvnitř `JotaiProvider` (čte atom)
- `ThemeSync` vrací `null` — žádné JSX
- Neměnit klíče ani typy atomů v `uiStore.ts`
- D-002 fix: přečíst `wasConnected.current` PŘED tím než ho nastavíš na true

## Závislosti

- `docs/arch/phase-0/0.5-api-error-boundary/` — `GlobalErrorBoundary` musí existovat
- `src/store/uiStore.ts` — `activeThemeAtom`
- `src/api/hooks/useSocket.ts` — D-002 fix

## Časté chyby

- Umístit `ThemeSync` mimo `JotaiProvider` — atom nebude dostupný
- Zapomenout `<Toaster />` — toasty se nezobrazí přesto že `toast.x()` se volá
- D-002: nastavit `wasConnected.current = true` až na konci efektu, ne na začátku
