# cache / 02-uzivatele-pratele — checkpoint RUN-2026-06-20-1621

> Auditor: Claude Sonnet 4.6 · Datum: 2026-06-20 · Read-only.
> Cílová hloubka: L1–L3 (statika + key-match + existující testy). L4 = PROOF-REQUEST.

---

## Pokrytí

Prošel jsem veškerý kód oblasti 02 dle plánu:

**Query hooky (čtení):**
- `useFriends.ts` — `['friends']`
- `useOutgoingFriendRequests.ts` — `['friends','outgoing']`
- `useBlockedFriends.ts` — `['friends','blocked']`
- `useFriendshipStatus.ts` — `['friendship-status', userId]`
- `usePendingActions.ts` — `['pending-actions','count']` + `['pending-actions', type, page, limit]`
- `usePublicUsers.ts` — `['public-users', params]`
- `usePublicUserProfile.ts` — `['public-user-profile', id]`
- `useUserLookup.ts` — `['user-lookup', query]`
- `useAdminUsers.ts` — `['users','me','username-request']`, `['users','me','username-request','last-unseen-decided']`, `[...adminKeys.users, query]`, `[...adminKeys.usernameRequests, query]`, `[...adminKeys.auditLog, query]`
- `useAdminFriendships.ts` — `[...adminKeys.friendships,'by-pair',...]`, `[...adminKeys.friendships,'by-user',...]`

**Mutace:**
- `useFriendshipMutations.ts` — `useSendFriendRequest`, `useAcceptFriendRequest`, `useRemoveFriend`, `useRemoveFriendByUserId`, `useBlockUser`, `useUnblockUser`
- `useAdminUsers.ts` — `useAdminUpdateRole`, `useAdminBanUser`, `useAdminUnbanUser`, `useAdminRequestDeletion`, `useAdminCancelDeletion`, `useAdminSetAdminPermissions`, `useAdminApproveUsernameRequest`, `useAdminRejectUsernameRequest`, `useAdminBulkBan`, `useAdminBulkUnban`, `useAdminBulkRoleChange`, `useRequestUsernameChange`, `useCancelMyUsernameRequest`, `useMarkUsernameRequestSeen`
- `useAdminFriendships.ts` — `useAdminResetCooldown`

**WS hook:**
- `useFriendshipsSocket.ts` — všech 6 eventů + reconnect + `user:identity:changed`

**Call-sites:**
- `PublicProfileActions.tsx`, `FriendsTab.tsx`, `FriendRequestRenderer.tsx`, `OutgoingRequestCard.tsx`, `BlockedRequestCard.tsx`, `ZpracovatTab.tsx`

**Admin factory:**
- `adminKeys.ts`

**Testy:**
- `useFriendshipsSocket.spec.tsx` (S-05 reconnect + C-13 WS parita)
- `useAdminUsers.spec.tsx` (C-12/C-14/C-45/C-51/C-52/C-54)
- `useBlockUser.spec.tsx`, `useSendFriendRequest.spec.tsx`

**BE gateway (ověření WS kontrastu):**
- `users-identity.gateway.ts`

---

## Dosažená L vs cílová L

| Oblast | Dosažená | Cílová |
|---|---|---|
| Friendship REST mutace (C-12, C-13, C-14 opravy) | **L3** (testy potvrzeny staticky) | L2+ |
| WS friendship eventy (C-13 parita) | **L3** (test `useFriendshipsSocket.spec.tsx`) | L2+ |
| WS reconnect (S-05) | **L3** (test `useFriendshipsSocket.spec.tsx`) | L2+ |
| admin mutace → public profil/adresář | **L3** (test `useAdminUsers.spec.tsx`) | L2+ |
| admin factory `adminKeys` | **L2** (statická analýza, klíče konzistentní) | L2+ |
| CB placement všechna call-sites | **L2** (statická analýza — všechna invalidace v hookovém `onSuccess`) | L2 |
| `user:identity:changed` WS + BE push | **L2** (BE gateway i FE listener ověřeny) | L2 |
| Zbývající (L4 runtime) | **PROOF-REQUEST** | L4 |

---

## Nálezy

### ✅ Dříve nalezené C-12, C-13, C-14 — OPRAVENO, potvrzeno L3

**C-12** (`useAdminUpdateRole` / `ban` / `unban` / `requestDeletion` / `cancelDeletion` / `setAdminPermissions` / `bulkBan` / `bulkUnban` / `bulkRoleChange` / `approveUsernameRequest`):
Všechny invalidují `['public-users']` + `['public-user-profile']`. Ověřeno kódem + testem `useAdminUsers.spec.tsx:40`. ✅L3

**C-13** (WS parita friendship):
- `friend:request:accepted` invaliduje `['pending-actions']` ✅ (řádek 51)
- `friend:request:canceled` invaliduje `['friendship-status']` ✅ (řádek 63)
- `friend:removed` invaliduje `['pending-actions']` ✅ (řádek 68)
Potvrzeno testem `useFriendshipsSocket.spec.tsx:70–98`. ✅L3

**C-14** (admin username approve/reject → audit-log + users):
- approve invaliduje `adminKeys.auditLog` ✅ (řádek 308)
- reject invaliduje `adminKeys.auditLog` ✅ (řádek 433) + `adminKeys.users` ✅ (řádek 432)
Potvrzeno testem `useAdminUsers.spec.tsx:155,183`. ✅L3

---

### 🆕 Nové nálezy

**C-RUN-01 · `FO`/`WS` · `user:identity:changed` neobnoví `['friends']` po username změně**
- Kde: `useFriendshipsSocket.ts:81–84`
- Kód: `user:identity:changed` invaliduje `['users','me']` + `['public-user-profile']`, ale **ne `['friends']`**.
- Dopad: Uživatel A změní username (admin schválí). Uživatel B má A v přátelích — v `FriendsTab` vidí staré jméno do staleTime 30s / F5. `FriendListItem.friend.username` pochází z `useFriends` → `['friends']` — ta se neinvaliduje.
- Trigger: admin schválí username request → BE emituje `user:identity:changed{kind:'username'}` do `user:{targetId}`. FE dotčeného uživatele (target) si obnoví vlastní data, ale **ostatní přátelé** neinvalidují svůj `['friends']` seznam.
- Viditelnost: jméno kamaráda v přátelích drží staré. Nezávažné (30s staleTime), ale nesoulad.
- Návrh: přidat `qc.invalidateQueries({ queryKey: ['friends'] })` do `user:identity:changed` handleru — nebo akceptovat 30s staleTime jako by-design (WS event chodí jen dotčenému uživateli, ne jeho přátelům, takže oprava by potřebovala BE-side broadcast do přátel). **Pravděpodobně by-design** (push stávajícím přátelům = cross-user broadcast = scope překračuje event design). Viz PROOF-REQUEST P-02-1.
- L1 · 🆕
- Závažnost: 🟡

**C-RUN-02 · `FO` · `useAdminRejectUsernameRequest` neinvaliduje `['public-users']`/`['public-user-profile']`**
- Kde: `useAdminUsers.ts:430–436`
- Kód: `reject` invaliduje `adminKeys.usernameRequests`, `adminKeys.users`, `adminKeys.auditLog`, `['pending-actions']` — ale **ne `['public-users']`, `['public-user-profile']`**.
- Srovnání: `approve` (řádek 300–316) invaliduje oboje. `reject` ne.
- Dopad: username reject **nemění username** (request je jen odmítnut, původní username zůstává) → profil se fakticky nezmění. Vizuálně žádný efekt. **Pravděpodobně by-design / false-positive** — na rozdíl od `approve`, kde se username skutečně mění a profil zobrazuje nové jméno.
- Pozn.: komentář v `approve` říká `C-12 — role/ban/deletion...` — je to chybný komentář (schválení username je jiný důvod), ale invalidace je správná. U `reject` je to opravdu nepotřeba.
- Závažnost: ⚖️ by-design (nevzniká stale, username se nezměnil)
- L2 · 🆕

**C-RUN-03 · `CB` · `FriendRequestActions` volá `mutateAsync` v inline onClick**
- Kde: `FriendRequestRenderer.tsx:77–90`
- Kód: `onClick={async () => { await remove.mutateAsync(...); onResolve(); }}` a `onClick={async () => { await accept.mutateAsync(...); onResolve(); }}`
- Toto je call-site `mutate(v, {onSuccess})` pattern? Ne — **hook `useRemoveFriend` / `useAcceptFriendRequest` mají invalidaci v `useMutation({onSuccess})`** (config level), ne v call-site callbacku. `onResolve()` je jen lokální UI callback. Invalidace tedy přežijí unmount. ✅
- Závažnost: ⚖️ čistá (false-positive)
- L2 · 🆕

**C-RUN-04 · `LC` · `ZpracovatTab` `setTimeout(invalidate, 320ms)` — race-prone pattern**
- Kde: `ZpracovatTab.tsx:107–111`
- Kód:
  ```ts
  setTimeout(() => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
    setResolvingKey(null);
  }, 320);
  ```
- Dopad: invalidace `['pending-actions']` je zpožděna o 320ms jako animační debounce. Pokud komponenta unmountuje PŘED 320ms (navigace pryč), `setTimeout` callback stále doběhne (setTimeout přežívá unmount, na rozdíl od `useEffect`). `qc.invalidateQueries` na unmountnutém queryClient nenastane chyba (QC žije na globální úrovni). Fakticky bezpečné, ale anti-pattern: animační delay je vázán na business invalidaci.
- Závažnost: 🟡 (latentní; dopad = na pomalém smazání by badge mohl chvíli zobrazovat starou hodnotu pokud se naviguje < 320ms po akci — krajní případ)
- Návrh: oddělit animaci (`setResolvingKey(null)`) od invalidace (invalidovat okamžitě v `onResolve` callbacku, ne v setTimeout). Ale jde o call-site v komponentě, ne v hooku — invalidace `['pending-actions']` je tu lokální callback bez vazby na mutaci (renderer volá `onResolve()` ze svého vlastního handleru). Latentní.
- L2 · 🆕

---

### ♻️ Potvrzené existující nálezy (bez změny)

- **D-02-3** `LC` 🟡 — privacy-gate 403 error cache po friendship accept. Stále platí — code nechanged. Netlumeno testem.

---

## Souhrn stavu oblasti 02

| Kategorie | Stav |
|---|---|
| C-12, C-13, C-14 (původní nálezy) | ✅ opraveno + L3 testy |
| WS reconnect (S-05) | ✅ opraveno + L3 test |
| `user:identity:changed` WS | ✅ implementováno, 1 drobný scope gap (C-RUN-01 🟡) |
| admin factory | ✅ L2 |
| CB placement | ✅ L2 (config-level, přežívají unmount) |
| `useAdminRejectUsernameRequest` public klíče | ⚖️ by-design (C-RUN-02) |
| `ZpracovatTab` setTimeout | 🟡 latentní (C-RUN-04) |

---

## PROOF-REQUEST

### P-02-1 — `user:identity:changed` scope přátel (C-RUN-01)

**Otázka:** Emituje BE `user:identity:changed` (nebo jiný WS event) i do roomů **přátel** dotčeného uživatele po schválení username? Nebo jen do `user:{targetId}`?

**Kde ověřit:** `users-identity.gateway.ts:36–48` — pouze `user:{p.userId}` room. Žádný broadcast do přátel.

**Důsledek:** pokud BE nebroadcastuje do přátel, pak stale `['friends']` u ostatních je by-design (30s staleTime spravuje). L2 = strukturální ověření.

**Doporučení:** L4 runtime ověření (M4): schválí admin username → zkontrolovat zda kamarád bez F5 vidí nové jméno v FriendsTab do 5s. Ale bez BE změny (broadcast do přátel) je to nevyřešitelné jen na FE.

---

### P-02-2 — D-02-3 privacy-gate 403 error cache

**Otázka:** Existuje v reálném nasazení uživatelský profil s nastavením „viditelný jen přátelům" (vrací 403 nečlenu)?

**Kde ověřit:** `PublicUserProfilePage.tsx:45` — chybový handling; BE endpoint `GET /users/profile/v14/:id` — podmínky 403.

**Důsledek:** pokud privacy-gate neexistuje v produkci (žádný uživatel tuto feature nevyužívá), D-02-3 je bezpředmětný. L4 = prověření nastavení profilu v produkci.
