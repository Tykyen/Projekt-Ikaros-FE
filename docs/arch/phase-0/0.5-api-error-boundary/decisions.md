# Technická rozhodnutí

## React class component pro Error Boundary

**Rozhodnutí:** `GlobalErrorBoundary` implementována jako React class component s `componentDidCatch`.

**Důvod:** React Error Boundary lze implementovat pouze jako class component (funkcionální komponenty to neumí). Hooks jako `use-error-boundary` jsou třetí strany — nechceme závislost navíc.

**Dopad:** Jediný class component v projektu — výjimka z jinak funkcionálního stylu.

---

## Dvě vrstvy error handlingu

**Rozhodnutí:** `errorElement` na routes (React Router) + `GlobalErrorBoundary` (React) jako dvě oddělené vrstvy.

**Důvod:** `errorElement` zachytí chyby z loaderů a actions. `GlobalErrorBoundary` zachytí rendering chyby mimo route kontext (např. chyba v `IkarosLayout` samotném, nebo v root providerech).

**Dopad:** Většina chyb se zachytí v `errorElement` — `GlobalErrorBoundary` je skutečně jen záchranná síť pro edge cases.

---

## Tiché API selhání → toast

**Rozhodnutí:** Chyby při fetchování dat v komponentách (React Query `isError`) se zobrazují jako Sonner toast, ne jako Error Boundary pád.

**Důvod:** Chyba při načítání seznamu světů by neměla shodit celou appku. Toast je proporcionální reakce.

**Dopad:** Každá komponenta s API voláním musí ošetřit `isError` stav a zavolat `toast.error(parseApiError(error))`.
