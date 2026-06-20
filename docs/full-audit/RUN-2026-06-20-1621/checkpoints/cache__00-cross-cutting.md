# cache / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

> Datum: 2026-06-20. Auditor: agent (statická analýza HEAD). Read-only.
> Základ: původní sweep 2026-06-05 (`cache-plan/00-cross-cutting.md`) + delta 103 commitů do HEAD.

---

## Pokrytí

Prošel jsem:

1. **queryClient config** — `main.tsx:18-25` (staleTime/retry/gcTime/refetchOnWindowFocus beze změny).
2. **Router loadery** — `router.tsx` celý (359→rozšířeno o nové routy); `requireAuth` je stále jediný loader, nefetchuje data. K-C4 ✅ nadále platí.
3. **Jotai dual-cache** — `authStore.ts`, `useAuth.ts`, `AuthBootstrap.tsx`, `usePinnedChannels.ts`, `useThemeSync.ts`. Bridge RQ→atom (`useCurrentUserHydration`) ověřen. C-58 fix ověřen: `usePinnedChannels.ts:44-47` píše `setQueryData(['users','me'])` + atom současně.
4. **Nové namespaces od 2026-06-05** — `['world-maps']`, `['world-map-folders']`, `['trusted-devices']`, `['push','subscriptions']`. Každý ověřen pro query + invalidace.
5. **Inline vs. factory census** — přidány nové factory: `pushDeviceKeys`, lokální `calendarConfigsKey` (self-contained), lokální `key`/`foldersKey`/`mapsKey` v maps API. Nový inline drift v `world-maps` (3 definice téhož klíče).
6. **M-CEN (mutace bez cache efektu)** — zkontrolovány všechny nové mutace: `useDeleteWorld`, `useRestoreWorld`, `useCreateWorldMap`, `useUpdateWorldMap`, `useDeleteWorldMap`, `useReorderWorldMaps`, folder mutace, `useEnableTotp`, `useDisableTotp`, `useRevokeTrustedDevice`, `useUnsubscribeDevice`. Každá má ≥1 cache efekt. `useTotpSetup` (setup bez efektu) a `useRegenerateBackupCodes` — by-design (response přímo, žádná cache entita).
7. **useSocketReconnect pokrytí** — `ChatRoom.tsx:262` (C-05/C-56 fix) ověřen. `useMapSocket.ts:80-88` používá `socket.on('connect')` ekvivalent. Nové WS hooky (push notifikace = žádný room join, jen SW). Bez nových mezer.
8. **K-C10 (first-segment-dynamic)** — 0 klíčů s dynamickým `[0]` — ověřeno grep `queryKey.*\[worldId` → 0 výskytů. Nadále platí.
9. **qc.clear() při login/logout** — `useAuth.ts:44,67,90,123` — pokrývá i nové namespaces `trusted-devices`, `push/subscriptions` (clear je totální).
10. **Inbox nových mutací** (CB osa) — `DeleteWorldTab.tsx:55-60` volá `mutateAsync` v try-catch s navigací, invalidace je v `onSuccess` hooku → bezpečné (CB OK).

---

## Dosažená L vs cílová L

| Oblast | Cílová L | Dosažená L | Poznámka |
|---|---|---|---|
| queryClient config | L2 | L2 ✅ | čtení + prefix-match sem. |
| Router loadery (K-C4) | L2 | L2 ✅ | ověřeno čtením celého router.tsx |
| Jotai bridge (K-C6) | L2 | L2 ✅ | bridge + C-58 fix ověřeny |
| K-C10 first-segment | L2 | L2 ✅ | grep 0 výskytů |
| Factory vs inline (nová data) | L2 | L1-L2 | world-maps = 3 inline def. (nový drift) |
| M-CEN (nové mutace) | L2 | L2 ✅ | všechny nové mutace mají cache efekt |
| WS reconnect (nové hooky) | L2 | L2 ✅ | C-05 fix + mapSocket.connect OK |
| `['trusted-devices']` lifecycle | L2 | L2 ✅ | qc.clear() + useDisableTotp invalidace |
| `['push','subscriptions']` lifecycle | L2 | L2 ✅ | factory + invalidace |
| `['world-maps']`/`['world-map-folders']` | L2 | L1 | inline drift (C-RUN-01); žádné runtime testy |
| C-57 (cross-device theme sync) | PROOF | PROOF-REQUEST | runtime/cross-device nelze staticky |
| C-58 fix | L2 | L2 ✅ | setQueryData(['users','me']) in usePinnedChannels:44 |
| C-56/C-05 fix | L2 | L2 ✅ | useSocketReconnect v ChatRoom:262 |

---

## Nálezy

### 🟡 C-RUN-01 · `KM`/`SC` · `['world-maps']` definován na 3 místech inline — drift-trap
- **Místo:**
  - `useWorldMaps.ts:8` — inline `['world-maps', worldId]` (query)
  - `useWorldMapMutations.ts:5` — `const key = (worldId) => ['world-maps', worldId]` (lokální, mutace)
  - `useWorldMapFolderMutations.ts:10` — `const mapsKey = (worldId) => ['world-maps', worldId]` (lokální, folder mutace cross-invalidace)
- **Dopad:** Aktuálně správně — tři definice produkují totožný tvar. Ale refaktoring jedné (přidání segmentu, rename) neupraví ostatní → tichý drift = cache přestane mít efekt. Vzor C-18 (`usePage` inline).
- **Trigger:** budoucí rename/rozšíření klíče v jednom souboru. **Viditelnost:** žádná ihned. **Workaround:** –.
- **Návrh:** extrahovat do sdíleného `worldMapsQueryKeys` factory souboru (jako `worldChatKeys`, `worldCurrenciesQueryKey` v currencies/api.ts). 3 soubory naimportují tutéž funkci → drift impossible.
- **L1** · 🆕

### 🟡 C-RUN-02 · `KM` · `['world-map-folders']` definován na 2 místech inline — drift-trap
- **Místo:**
  - `useWorldMapFolders.ts:8` — inline `['world-map-folders', worldId]` (query)
  - `useWorldMapFolderMutations.ts:9` — `const foldersKey = (worldId) => ['world-map-folders', worldId]` (lokální)
- **Dopad/Trigger/Workaround:** analogické C-RUN-01. Aktuálně bez dopadu.
- **Návrh:** sloučit do téhož factory souboru jako C-RUN-01 (`worldMapsQueryKeys.folders(worldId)`).
- **L1** · 🆕

### ♻️ C-57 · `P7`/`LC` · `themeAtom` „local wins" maskuje cross-device změnu motivu
- **Stav:** nadále platí (viz `useThemeSync.ts:43-53`). Kód beze změny od původního nálezu.
- **Nový pohled:** není nová regrese — by-design záměr zdokumentován v komentáři `/* local wins */`. Registrováno jako ⚖️ C-57 v registru. Potvrzuji, že HEAD kód je konzistentní s popisem.
- **L1** · ♻️

### ♻️ `worldCurrenciesQueryKey` dual-definition — D-05-2 fix ověřen
- **Soubory:** `currencies/api.ts:21` (`['world-currencies', worldId]`) a `characters.types.ts:261` (`['worlds', worldId, 'currencies']`). Oba existují.
- **Fix:** `currencies/api.ts:59` explicitně invaliduje oba klíče ve `onSettled`. Ověřeno na HEAD. Registrován jako D-05-2 a opraveno v registru.
- **Stav:** opraveno, žádný nový nález. L2 ✅.

### ♻️ K-C10 · první segment dynamic — vyvrácen, nadále platí
- Grep `queryKey.*\[worldId` → 0 hits. Grep `queryKey.*\[\`` → 0 hits. 222→approx. 240 keys v HEAD, všechny mají namespace string na `[0]`. ✅

### ♻️ K-C4 · router loadery — vyvrácen, nadále platí
- `router.tsx` přidáno 10+ nových routes (help, mapy světa, GM deník, skupiny…), všechny bez `loader:` nebo s `loader: requireAuth` (nefetchuje data). ✅

---

## PROOF-REQUEST

| # | Typ | Popis | Co je potřeba |
|---|---|---|---|
| PR-01 | Runtime | C-57: cross-device theme sync — ověřit, zda změna motivu na zařízení B se projeví na A (local-wins záměr vs. požadavek) | manuální M4 test na 2 zařízeních / tabech |
| PR-02 | BE side | `user:{id}` auto-join po WS reconnectu — ověřit, že `handleConnection` v gateway re-joinne room i po reconnectu (FE nevolá `room:join user:...`) | čtení BE `WorldsGateway.handleConnection` + M4 test |
| PR-03 | Runtime | `usePinnedChannels` C-58 fix — ověřit, že po pin + window focus (staleTime expiry → refetch `/users/me`) pin nezmizí | M4 test: pin kanál, počkej 30s, focus tab |

---

## Závěr delta 2026-06-05 → 2026-06-20

Všechna opravená C-xx (C-05, C-06, C-07, C-29, C-56, C-58) jsou v kódu HEAD ověřena. Žádná regrese.
Nové featury (world-maps, 2FA/trusted-devices, push subscriptions, favorite-pages, world lifecycle)
jsou implementovány správně — cache efekty přítomny, factory klíče nebo korrektní inline.
**Jediná nová triviální nalezená třída:** 3+2 inline definice `['world-maps']` / `['world-map-folders']`
(drift-trap, vzor C-18). Žádné nové 🔴 nebo 🟠 nálezy.
