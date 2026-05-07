# Technická rozhodnutí

## JotaiProvider přidáme

**Rozhodnutí:** Přidat `JotaiProvider` do `main.tsx` jako wrapper nad vším ostatním.

**Důvod:** Jotai funguje bez Provider díky default store, ale explicitní Provider je lepší praxe — umožňuje izolaci v testech a jasně vymezuje scope atomů.

**Dopad:** `getDefaultStore()` v `client.ts` a `socket.ts` pracuje se stejným store — JotaiProvider to nenarušuje.

---

## Toaster pozice: bottom-right

**Rozhodnutí:** `<Toaster position="bottom-right" theme="dark" richColors />`

**Důvod:** Standardní pozice která nepřekrývá hlavní obsah. Dark theme odpovídá designu aplikace. `richColors` zajistí barevné rozlišení success/error/warning.

---

## ThemeSync jako samostatná komponenta

**Rozhodnutí:** `data-theme` aplikace v `<ThemeSync />` komponentě (ne přímo v `main.tsx`).

**Důvod:** `main.tsx` je TSX ale musí být uvnitř `JotaiProvider` aby mohl číst `activeThemeAtom`. Samostatná komponenta je čistší než inline logika v main.

**Dopad:** `ThemeSync` se renderuje jako child `JotaiProvider` v `main.tsx`, nevrací žádné JSX (`return null`).

---

## Fix D-002 — oddělení initial connect od reconnect

**Rozhodnutí:** Přidat `didConnect` ref který se nastaví na `true` až po prvním `connected` eventu. Toast "Spojení obnoveno" se zobrazí pouze při `connected` kde `wasConnected` bylo `true` **před** tímto runnem efektu.

**Důvod:** Současný kód nastavuje `wasConnected.current = true` a hned kontroluje stejnou podmínku v jednom efektu — toast se zobrazí i při prvním připojení.
