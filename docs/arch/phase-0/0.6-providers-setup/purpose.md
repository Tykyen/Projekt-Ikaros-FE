# Účel

Dokončit root setup aplikace — přidat chybějící providers, Toaster a aktivovat theming mechanismus.

## Odpovědnosti

- `JotaiProvider` v `main.tsx` — explicitní scope pro Jotai atomy
- `<Toaster />` (Sonner) v `main.tsx` — umožní toast notifikace kdekoliv v appce
- `useThemeSync` hook nebo efekt — čte `activeThemeAtom` a aplikuje `data-theme` na `<html>`
- Fix D-002 — opravit `useSocketInit` toast logiku (false positive při prvním připojení)

## Mimo rozsah

- Světové theming (přepínání na téma konkrétního světa) — řeší se až v fázi 5
- Změna samotných barevných palet — vizuální identita se řeší separátně

## Kontext

Po 0.6 bude `main.tsx` kompletní:
```tsx
<StrictMode>
  <JotaiProvider>
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>        // ← 0.5
        <RouterProvider router={router} />
        <Toaster />                // ← 0.6
      </GlobalErrorBoundary>
    </QueryClientProvider>
  </JotaiProvider>
</StrictMode>
```

`data-theme` se aplikuje přes `useEffect` v samostatném `ThemeSync` komponentě renderované uvnitř `JotaiProvider` (potřebuje přístup k atomu).
