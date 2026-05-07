# Technické dluhy

## Otevřené

### D-003 — BE endpoint `PATCH /api/users/me { themeId }` neexistuje
**Soubor:** `src/themes/useThemeSync.ts` — outbound sync useEffect
**Problém:** FE volá `api.patch('/users/me', { themeId })` při změně tématu, ale backend tento endpoint nepodporuje. FE chytá 404 a tichý `console.warn`, takže UX není narušen — ale theme se nepersistuje cross-device.
**Dopad:** Střední — funkčnost themingu funguje per-device přes localStorage; cross-device synchronizace chybí dokud BE nepřidá endpoint.
**Řešení:** BE-tým přidá `themeId: string` field do User entity, `PATCH /api/users/me` accept tento field, GET `/api/auth/me` (`/users/me`) vrátí ho v response.
**Kdy:** Po dokončení Iterace A, koordinace s BE-týmem v rámci dalšího sprintu.

---

### D-004 — `currentUserAtom` neobsahuje `themeId` field
**Soubor:** `src/types/index.ts` — User type / `src/store/authStore.ts` — currentUserAtom
**Problém:** Po BE změně (D-003) bude `User.themeId` vrácen z `/auth/me`, ale FE typ ho neobsahuje. Initial sync v `useThemeSync` ho čte přes type cast `(user as { themeId?: string }).themeId` — funkční ale bez type safety.
**Dopad:** Nízký — kód funguje, jen type cast místo proper typu.
**Řešení:** Po D-003 přidat `themeId?: ThemeId` do `User` typu v `src/types/index.ts`. Odstranit type cast v `useThemeSync.ts`.
**Kdy:** Při řešení D-003.

---

### D-001 — `window.location.href` při selhání refreshe
**Soubor:** `src/api/client.ts` — response interceptor  
**Problém:** Při selhání token refreshe (nebo chybějícím refresh tokenu) se provádí `window.location.href = '/login'` — tvrdý reload místo React Router navigate. Ztratí se router state.  
**Dopad:** Nízký — funkčně správně, jen UX drobnost.  
**Řešení:** Exportovat router z `router.tsx` a volat `router.navigate('/login')` místo `window.location.href`.  
**Kdy:** Při práci na 0.4 nebo auth fázi.

---

---

## Uzavřené

### D-002 — Toast "Spojení obnoveno" při prvním připojení
**Soubor:** `src/api/hooks/useSocket.ts` — `useSocketInit`  
**Opraveno v:** 0.6 — `wasConnected.current = true` přesunuto na konec efektu, toast se nyní zobrazí jen při REconnect.
