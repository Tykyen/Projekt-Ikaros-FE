# Fáze 0.5 + 0.6 — GlobalErrorBoundary + Providers Setup — Implementační plán

**Cíl:** Přidat záchrannou síť pro rendering pády (`GlobalErrorBoundary`), správně zapouzdřit root aplikace do providerů (Jotai, QueryClient), přidat Toaster, vytvořit `ThemeSync` komponentu a opravit bug D-002 v `useSocketInit`.

**Spec:** `docs/arch/phase-0/spec-0.5-0.6.md`

---

## Struktura souborů

```
src/
  components/
    GlobalErrorBoundary.tsx     ← NOVÝ — React class component, zachytí rendering pády
    ThemeSync.tsx               ← NOVÝ — čte activeThemeAtom, aplikuje data-theme na <html>
  api/
    hooks/
      useSocket.ts              ← ZMĚNA — fix D-002 (wasConnected.current pořadí)
  main.tsx                      ← ZMĚNA — JotaiProvider, GlobalErrorBoundary, Toaster, ThemeSync
```

---

## Task 1: GlobalErrorBoundary

**Files:**
- Create: `src/components/GlobalErrorBoundary.tsx`

- [ ] **Step 1: Vytvoř komponentu**

```tsx
// src/components/GlobalErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', fontFamily: 'sans-serif' }}>
          <h1>Něco se pokazilo</h1>
          <p>V aplikaci nastala neočekávaná chyba.</p>
          <button onClick={() => window.location.reload()}>
            Obnovit stránku
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Task 2: ThemeSync

**Files:**
- Create: `src/components/ThemeSync.tsx`

- [ ] **Step 1: Vytvoř komponentu**

```tsx
// src/components/ThemeSync.tsx
import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { activeThemeAtom } from '../store/uiStore';

export function ThemeSync() {
  const theme = useAtomValue(activeThemeAtom);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}
```

---

## Task 3: Fix D-002 — useSocketInit

**Files:**
- Modify: `src/api/hooks/useSocket.ts`

- [ ] **Step 1: Oprav pořadí operací v efektu**

Najdi efekt který řeší toast notifikace (řádky ~24-32) a nahraď ho:

```ts
// PŘED (chybný):
useEffect(() => {
  if (status === 'connected') wasConnected.current = true;
  if (status === 'disconnected' && wasConnected.current) {
    toast.warning('Ztratilo se spojení se serverem...');
  }
  if (status === 'connected' && wasConnected.current) {
    toast.success('Spojení obnoveno');
  }
}, [status]);

// PO (správný):
useEffect(() => {
  if (status === 'disconnected' && wasConnected.current) {
    toast.warning('Ztratilo se spojení se serverem...');
  }
  if (status === 'connected' && wasConnected.current) {
    toast.success('Spojení obnoveno'); // jen při REconnect
  }
  if (status === 'connected') {
    wasConnected.current = true; // nastavit AŽ na konci
  }
}, [status]);
```

---

## Task 4: Aktualizace main.tsx

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Přidej importy**

```ts
import { Provider as JotaiProvider } from 'jotai';
import { Toaster } from 'sonner';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { ThemeSync } from './components/ThemeSync';
```

- [ ] **Step 2: Nahraď render tree**

```tsx
createRoot(document.getElementById("root")!).render(
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
);
```

> `ThemeSync` je záměrně mimo `QueryClientProvider` — nepotřebuje query kontext, ale musí být uvnitř `JotaiProvider`.

---

## Task 5: Ověření + uzavření

**Files:**
- Modify: `docs/dluhy.md`
- Modify: `docs/roadmap-fe.md`

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Uzavři D-002 v dluhy.md**

Přesuň D-002 do sekce "Uzavřené" s poznámkou: `Opraveno v 0.6 — wasConnected.current nastavován až na konci efektu.`

- [ ] **Step 3: Zaškrtni 0.5 + 0.6 v roadmap-fe.md**
