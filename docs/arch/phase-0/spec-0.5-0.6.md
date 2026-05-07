# Spec — Fáze 0.5 + 0.6

---

## 0.5 — Globální error boundary

### Co se řeší
Zbývající položka z roadmapy: záchranná síť pro všechny unhandled chyby v aplikaci.

### Vrstvení error handlingu (po implementaci)

```
GlobalErrorBoundary          ← zachytí vše co propadne níže (rendering pády)
  └── RouterProvider
        ├── errorElement: <ErrorPage />  (IkarosLayout)   ← chyby z loaderů
        ├── errorElement: <ErrorPage />  (WorldLayout)    ← chyby z loaderů
        └── komponenty → API chyba → toast (Sonner)       ← tiché selhání
```

### Co vznikne
- `src/components/GlobalErrorBoundary.tsx` — React class component (jediný class component v projektu, Error Boundary nelze udělat jako funkcionální komponentu)
- Zobrazí recovery UI s tlačítkem "Obnovit stránku" (`window.location.reload()`)
- Aktualizace `src/main.tsx` — `GlobalErrorBoundary` obalí `RouterProvider`

### Co se nemění
- `src/pages/errors/ErrorPage.tsx` — zůstává pro `errorElement` na routes
- Per-feature error stavy (React Query `isError`) — každá feature řeší sama přes `toast.error(parseApiError(error))`

### Co Error Boundary nezachytí (vědomě)
- Chyby v event handlerech
- Asynchronní chyby mimo render (Promise rejection)
- Chyby v serverových komponentách

---

## 0.6 — Providers + root setup

### Co se řeší
Čtyři zbývající věci: JotaiProvider, Toaster, data-theme aplikace, fix toast bugu.

### Finální struktura main.tsx

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

### Co vznikne / se mění

**1. JotaiProvider**
Přidá se do `main.tsx` jako nejvyšší wrapper. Jotai funguje i bez něj (default store), ale Provider je správná praxe a umožní izolaci v testech. `getDefaultStore()` v `client.ts` a `socket.ts` funguje dál bez změn.

**2. Toaster**
`<Toaster position="bottom-right" theme="dark" richColors />` uvnitř `GlobalErrorBoundary` (nebo vedle `RouterProvider`). Bez tohoto elementu v DOMu se žádný `toast.x()` nezobrazí.

**3. ThemeSync**
Nová komponenta `src/components/ThemeSync.tsx`:
- Čte `activeThemeAtom` z `uiStore`
- Aplikuje `document.documentElement.setAttribute('data-theme', theme)` přes `useEffect`
- Vrací `null` — žádné JSX
- Musí být uvnitř `JotaiProvider` (čte atom), ale mimo `QueryClientProvider` (nepotřebuje query kontext)

Výchozí hodnota `activeThemeAtom` je `'ikaros'` → při startu aplikace se na `<html>` nastaví `data-theme="ikaros"`. Přepínání na téma světa (`worldThemeAtom`) se řeší v fázi 5.

**4. Fix D-002 — useSocketInit**

Současný kód (chyba):
```ts
if (status === 'connected') wasConnected.current = true;
if (status === 'connected' && wasConnected.current) {
  toast.success('Spojení obnoveno'); // spustí se i při prvním připojení
}
```

Opravený kód:
```ts
if (status === 'disconnected' && wasConnected.current) {
  toast.warning('Ztratilo se spojení se serverem...');
}
if (status === 'connected' && wasConnected.current) {
  toast.success('Spojení obnoveno'); // jen při REconnect
}
if (status === 'connected') {
  wasConnected.current = true; // nastavit AŽ na konci
}
```

---

## Implementační pořadí

1. `GlobalErrorBoundary` komponenta
2. `ThemeSync` komponenta
3. Fix `useSocketInit` (D-002)
4. Aktualizace `main.tsx` (vše najednou)
5. TypeScript check
6. Uzavřít D-002 v `docs/dluhy.md`
7. Zaškrtnout 0.5 + 0.6 v roadmapě
