# 02 — Uživatelé & přátelé

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `FO` `WS` `KM` `SC` · perspektivy P1 (konzumentská inventura) + P4 (WS↔REST parita).
> Soubory: `src/features/users/api/`, `src/features/friendships/`, `src/features/admin/{users,friendships}/api/`,
> call-sites `PublicProfileActions` / `FriendRequestRenderer` / `BlockedRequestCard` / `OutgoingRequestCard` / `FriendsTab` / `ZpracovatTab`.
> Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-12…`).
> **Stav: ✅ hotovo — K-C8 částečně potvrzen (admin větev) / vyvrácen (friend větev). 3 nálezy + 4 latentní.**

## 1. Konzumentská inventura (P1)

### Friendship namespace (`friends`, `friendship-status`)

| Zdroj / entita | `queryKey` | role | staleTime / enabled | mount (soubor:řádek) |
|---|---|---|---|---|
| Seznam přátel | `['friends']` | seznam (FriendsTab) | 30s; `enabled` | [useFriends.ts:8](../../src/features/friendships/api/useFriends.ts#L8) · [FriendsTab.tsx:30](../../src/features/users/components/tabs/FriendsTab/FriendsTab.tsx#L30) |
| Odeslané žádosti | `['friends','outgoing']` | seznam (FriendsTab collapsible) | 30s; `enabled` | [useOutgoingFriendRequests.ts:8](../../src/features/friendships/api/useOutgoingFriendRequests.ts#L8) · [FriendsTab.tsx:31](../../src/features/users/components/tabs/FriendsTab/FriendsTab.tsx#L31) |
| Zablokovaní | `['friends','blocked']` | seznam (FriendsTab collapsible) | 30s; `enabled` | [useBlockedFriends.ts:7](../../src/features/friendships/api/useBlockedFriends.ts#L7) · [FriendsTab.tsx:32](../../src/features/users/components/tabs/FriendsTab/FriendsTab.tsx#L32) |
| Friendship stav (driver tlačítka) | `['friendship-status', userId]` | detail (PublicProfileActions tlačítko, 5 stavů + cooldown) | 15s; `!!userId` | [useFriendshipStatus.ts:8](../../src/features/friendships/api/useFriendshipStatus.ts#L8) · [PublicProfileActions.tsx:66](../../src/features/users/components/PublicProfile/PublicProfileActions.tsx#L66) |

> ⚠️ **`['friends','outgoing']` a `['friends','blocked']` jsou prefix-děti `['friends']`** —
> element-po-elementu `[0]='friends'`, segment `[1]` navíc → invalidace `['friends']` trefí **všechny tři**
> (seznam + outgoing + blocked). Klíčové pro verdikt fan-outu níže.

### Pending-actions namespace (sdílený s oblastmi 03/10)

| Zdroj / entita | `queryKey` | role | staleTime / enabled | mount (soubor:řádek) |
|---|---|---|---|---|
| Badge počet | `['pending-actions','count']` | badge (sidebar levý/pravý + tab + NotificationCenter) | 30s; `enabled` | [usePendingActions.ts:13](../../src/features/users/api/usePendingActions.ts#L13) · [IkarosLayout.tsx:197,396](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L197) · [UsersPage.tsx:41](../../src/features/users/pages/UsersPage.tsx#L41) · [NotificationCenter.tsx:28](../../src/features/notifications/components/NotificationCenter.tsx#L28) · [PendingTab.tsx:26](../../src/features/notifications/components/PendingTab.tsx#L26) |
| Pending list per typ | `['pending-actions', type, page, limit]` | seznam (ZpracovatTab group per `PendingActionType`) | 30s; `enabled` | [usePendingActions.ts:27](../../src/features/users/api/usePendingActions.ts#L27) · [ZpracovatTab.tsx:84](../../src/features/users/components/tabs/ZpracovatTab/ZpracovatTab.tsx#L84) |

> ⚠️ Dva oddělené klíče, ale oba prefixuje `['pending-actions']` (`[0]` se shoduje, list má segment `[1]` navíc).
> Invalidace `['pending-actions']` proto trefí **badge i seznam** zároveň — ✅ KM ověřeno.

### Users / public namespace

| Zdroj / entita | `queryKey` | role | staleTime / enabled | mount (soubor:řádek) |
|---|---|---|---|---|
| Veřejný adresář | `['public-users', params]` | seznam (UsersTab, role Admin+) | 30s | [usePublicUsers.ts:22](../../src/features/users/api/usePublicUsers.ts#L22) · [UsersTab.tsx:57](../../src/features/users/components/tabs/UsersTab/UsersTab.tsx#L57) |
| Veřejný profil cizího usera | `['public-user-profile', id]` | detail (profil bio/postava/role/deleted-flag) | 60s; `!!id` | [usePublicUserProfile.ts:13](../../src/features/users/api/usePublicUserProfile.ts#L13) · [PublicUserProfilePage.tsx:27](../../src/features/users/pages/PublicUserProfilePage.tsx#L27) · [CharacterDetailModal.tsx:17](../../src/features/chat/components/CharacterDetailModal.tsx#L17) |
| User lookup (picker) | `['user-lookup', query]` | ephemeral picker | 30s; `q≥2` | [useUserLookup.ts:16](../../src/features/ikaros/api/useUserLookup.ts#L16) |
| Můj username request | `['users','me','username-request']` | detail (vlastní žádost) | — | [useAdminUsers.ts:20](../../src/features/admin/users/api/useAdminUsers.ts#L20) |
| Poslední nesepsaná rozhodnutá žádost | `['users','me','username-request','last-unseen-decided']` | toast po loginu | 60s | [useAdminUsers.ts:67](../../src/features/admin/users/api/useAdminUsers.ts#L67) |

### Admin namespace

| Zdroj / entita | `queryKey` | role | staleTime / enabled | mount (soubor:řádek) |
|---|---|---|---|---|
| Admin seznam uživatelů | `['admin','users', query]` | seznam (UsersAdminTab) | default 30s | [useAdminUsers.ts:108](../../src/features/admin/users/api/useAdminUsers.ts#L108) |
| Admin žádosti o username | `['admin','username-requests', query]` | seznam | default | [useAdminUsers.ts:247](../../src/features/admin/users/api/useAdminUsers.ts#L247) |
| Admin audit log | `['admin','audit-log', query]` | seznam | default | [useAdminUsers.ts:350](../../src/features/admin/users/api/useAdminUsers.ts#L350) |
| Admin friendship by-pair | `['admin','friendships','by-pair',userA,userB]` | detail | 15s; obě IDs | [useAdminFriendships.ts:22](../../src/features/admin/friendships/api/useAdminFriendships.ts#L22) |
| Admin friendships by-user | `['admin','friendships','by-user',userId]` | seznam | 15s; `!!userId` | [useAdminFriendships.ts:36](../../src/features/admin/friendships/api/useAdminFriendships.ts#L36) |

## 2. Mutace × konzument matice

### Friendship mutace (REST) — [useFriendshipMutations.ts](../../src/features/friendships/api/useFriendshipMutations.ts)

Sdílený helper `invalidateFriendshipQueries` ([:10](../../src/features/friendships/api/useFriendshipMutations.ts#L10)) = `['friends']` + `['friendship-status']` + `['pending-actions']`.
`invalidateBlockQueries` ([:17](../../src/features/friendships/api/useFriendshipMutations.ts#L17)) = výše + redundantní `['friends','blocked']` (už pokryto `['friends']`).

| Mutace (soubor:řádek) | friends | outgoing | blocked | status | pa-count | pa-list | public-profile | public-users | admin-users | placement |
|---|---|---|---|---|---|---|---|---|---|---|
| useSendFriendRequest [:22](../../src/features/friendships/api/useFriendshipMutations.ts#L22) | ✅ | ✅ᵖ | ✅ᵖ | ✅ | ✅ᵖ | ✅ᵖ | **❌** | **❌** | — | config |
| useAcceptFriendRequest [:52](../../src/features/friendships/api/useFriendshipMutations.ts#L52) | ✅ | ✅ᵖ | ✅ᵖ | ✅ | ✅ᵖ | ✅ᵖ | **❌** | — | — | config |
| useRemoveFriend [:69](../../src/features/friendships/api/useFriendshipMutations.ts#L69) | ✅ | ✅ᵖ | ✅ᵖ | ✅ | ✅ᵖ | ✅ᵖ | **❌** | — | — | config |
| useRemoveFriendByUserId [:83](../../src/features/friendships/api/useFriendshipMutations.ts#L83) | ✅ | ✅ᵖ | ✅ᵖ | ✅ | ✅ᵖ | ✅ᵖ | **❌** | — | — | config |
| useBlockUser [:99](../../src/features/friendships/api/useFriendshipMutations.ts#L99) | ✅ | ✅ᵖ | ✅ | ✅ | ✅ᵖ | ✅ᵖ | **❌** | — | — | config |
| useUnblockUser [:119](../../src/features/friendships/api/useFriendshipMutations.ts#L119) | ✅ | ✅ᵖ | ✅ | ✅ | ✅ᵖ | ✅ᵖ | **❌** | — | — | config |

ᵖ = pokryto **prefix-matchem** (`['friends']`→outgoing/blocked; `['pending-actions']`→count/list). Ne explicitní klíč, ale fakticky invalidováno.

### Admin mutace — [useAdminUsers.ts](../../src/features/admin/users/api/useAdminUsers.ts) / [useAdminFriendships.ts](../../src/features/admin/friendships/api/useAdminFriendships.ts)

| Mutace (soubor:řádek) | admin-users | username-req | audit-log | admin-friendships | public-profile | public-users | placement |
|---|---|---|---|---|---|---|---|
| useAdminUpdateRole [:118](../../src/features/admin/users/api/useAdminUsers.ts#L118) | ✅ | — | — | — | **❌** | **❌** | config |
| useAdminBanUser [:133](../../src/features/admin/users/api/useAdminUsers.ts#L133) | ✅ | — | — | — | **❌** | **❌** | config |
| useAdminUnbanUser [:160](../../src/features/admin/users/api/useAdminUsers.ts#L160) | ✅ | — | — | — | **❌** | **❌** | config |
| useAdminRequestDeletion [:177](../../src/features/admin/users/api/useAdminUsers.ts#L177) | ✅ | — | — | — | **❌** | **❌** | config |
| useAdminCancelDeletion [:194](../../src/features/admin/users/api/useAdminUsers.ts#L194) | ✅ | — | — | — | **❌** | **❌** | config |
| useAdminSetAdminPermissions [:215](../../src/features/admin/users/api/useAdminUsers.ts#L215) | ✅ | — | — | — | **❌** | — | config |
| useAdminApproveUsernameRequest [:256](../../src/features/admin/users/api/useAdminUsers.ts#L256) | ✅ | ✅ | **⚠️** | — | **❌** | **❌** | config |
| useAdminRejectUsernameRequest [:359](../../src/features/admin/users/api/useAdminUsers.ts#L359) | **❌** | ✅ | **⚠️** | — | — | — | config |
| useAdminBulkBan/Unban/RoleChange [:291,307,320](../../src/features/admin/users/api/useAdminUsers.ts#L291) | ✅ | — | — | — | **❌** | **❌** | config |
| useRequestUsernameChange [:27](../../src/features/admin/users/api/useAdminUsers.ts#L27) | — | ✅ (`users,me,*`) | — | — | — | — | config |
| useCancelMyUsernameRequest [:48](../../src/features/admin/users/api/useAdminUsers.ts#L48) | — | ✅ (`users,me,*`) | — | — | — | — | config |
| useMarkUsernameRequestSeen [:76](../../src/features/admin/users/api/useAdminUsers.ts#L76) | — | ✅ (`last-unseen-decided`) | — | — | — | — | config |
| useAdminResetCooldown [:49](../../src/features/admin/friendships/api/useAdminFriendships.ts#L49) | — | — | ✅ | ✅ | — | — | config |

**⚠️ audit-log u username approve/reject:** approve/reject **nezapisují** `['admin','audit-log']` (jen `useAdminResetCooldown` ano) → audit log po username rozhodnutí stale do staleTime/F5. Latentní, viz D-02-4.

**Placement:** všechny friendship i admin mutace invalidují v `useMutation({onSuccess})` (config) → **přežijí unmount** komponenty. Osa `CB` čistá — i destruktivní `useRemoveFriend` přes `mutateAsync` v ConfirmDialog (PublicProfileActions / FriendsTab) má invalidaci v hooku, ne v call-site. ✅

### WS handlery — [useFriendshipsSocket.ts](../../src/features/friendships/hooks/useFriendshipsSocket.ts)

| Event (soubor:řádek) | friends | outgoing | blocked | status | pa-count/list | REST ekvivalent | parita |
|---|---|---|---|---|---|---|---|
| friend:request:incoming [:42](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L42) | — | — | — | ✅ | ✅ᵖ | useSendFriendRequest (u odesílatele) | příjemce: OK |
| friend:request:accepted [:48](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L48) | ✅ | ✅ᵖ | ✅ᵖ | ✅ | **❌** | useAcceptFriendRequest | **⚠️ chybí pa** |
| friend:request:declined [:54](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L54) | **❌** | ✅ | — | ✅ | — | (odesílatel) | OK (outgoing) |
| friend:request:canceled [:59](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L59) | — | — | — | **❌** | ✅ᵖ | (příjemce) | **⚠️ chybí status** |
| friend:removed [:63](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L63) | ✅ | ✅ᵖ | ✅ᵖ | ✅ | **❌** | useRemoveFriend (má pa) | **⚠️ chybí pa** |
| friend:blocked [:70](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L70) | ✅ | ✅ᵖ | ✅ᵖ | ✅ | ✅ | useBlockUser | OK |

> Mount: `useFriendshipsSocket()` jednou per session v [IkarosLayout.tsx:695](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L695); reconnect-safe přes `useSocketEvent`.
> Pozn.: WS doručení samo je dle [ws-audit.md](../ws-audit.md) podmíněné (gateway `@OnEvent` handlery) — to řeší ws-plán, ne tento. Zde jen **množina invalidací** za předpokladu, že event dorazí.

## 3. Verdikt K-C8 — `public-user-profile` / `public-users` orphan

**Mechanicky orphan potvrzen:** ani jedna mutace v repu neinvaliduje `['public-user-profile']`
ani `['public-users']` (grep — jen čtenáři + docs). Otázka zadání: obnoví se po akci stav?

### Friend větev → ⚖️ **vyvráceno (by-design, ne nález)**
Tlačítko „Přidat do přátel" / „Přátelé · Odebrat" na cizím profilu se řídí
**`useFriendshipStatus(profileId)`** ([PublicProfileActions.tsx:66](../../src/features/users/components/PublicProfile/PublicProfileActions.tsx#L66)),
**ne** daty z `public-user-profile`. Friendship mutace invalidují `['friendship-status']` →
**tlačítko se přepne bez F5.** Profil sám (`public-user-profile`) drží jen bio / postavu / avatar /
role / deleted-flag — **nic friendship-závislého**. Jeho neinvalidace po friend/accept/block/unblock
proto **nemá viditelný dopad**. Odpověď na otázku zadání („změní se stav tlačítka bez F5?") = **ANO**.

⚠️ **Jediná teoretická díra (D-02-3, 🟡):** privacy-gate 403 „profil viditelný jen přátelům"
([PublicUserProfilePage.tsx:45](../../src/features/users/pages/PublicUserProfilePage.tsx#L45)).
Pokud profil vrací 403 dle friendship vztahu a accept ho odemkne, `public-user-profile` zůstane v error
cache. Tlumeno: profil se v praxi otevírá navigací (fresh mount) a `retry:false` na 403 ponechá error
jen do staleTime 60s / refetchOnMount.

### Admin větev → 🟠 **potvrzeno (C-12)**
`public-users` (adresář, role Admin+) a `public-user-profile` zobrazují **role chip + deleted/pendingDeletion flag**
([PublicUserProfilePage.tsx:52](../../src/features/users/pages/PublicUserProfilePage.tsx#L52)).
Admin akce (`useAdminUpdateRole`, `useAdminBanUser`, `useAdminRequestDeletion`, bulk) invalidují
**jen `['admin','users']`** → otevřený veřejný profil / adresář banovaného/přerolovaného usera drží
**starou roli a chybí deleted overlay** do staleTime (30–60s) / F5. Viz nález C-12.

## 4. Verdikt fan-out `friends` (q:5, inv:2) a `friendship-status`

**`friends` fan-out: ✅ úplný.** Audit `inv:2` (mechanická rekonciliace) = počítá jen 2 **literální**
výskyty `['friends']`. Fakticky `['friends']` přes **prefix-match** invaliduje **všechny 3 konzumenty**
(`['friends']`, `['friends','outgoing']`, `['friends','blocked']`). Accept/remove/block/unblock obnoví
seznam přátel + odeslané + blocked současně. `inv:2 vs q:5` je **false-positive rekonciliace**, ne mezera. ✅L2 (KM)

**`friendship-status` fan-out: ✅ úplný (broad).** Invalidace `['friendship-status']` (bez `userId`)
prefix-matchuje **všechny** `['friendship-status', userId]` záznamy → status na libovolném otevřeném
profilu se obnoví. (SC: záměrně široké — invaliduje i status nezúčastněných userů; bezpečné, raději moc.)

**Souhrn fan-outu REST friendship akcí:** seznam přátel ✅ · outgoing ✅ · blocked ✅ ·
badge žádostí (`pending-actions count`) ✅ · pending list ✅ · status na profilu ✅ → **kompletní bez F5.**
Mezera je **jen na WS straně** (viz C-13) a u **admin** akcí vůči public klíčům (C-12).

## 5. Nálezy

### 🟠 C-12 · `FO` · admin role/ban/delete akce neobnoví `public-users` ani `public-user-profile`
- **Mutace:** [useAdminUpdateRole](../../src/features/admin/users/api/useAdminUsers.ts#L118), [useAdminBanUser](../../src/features/admin/users/api/useAdminUsers.ts#L133), [useAdminUnbanUser](../../src/features/admin/users/api/useAdminUsers.ts#L160), [useAdminRequestDeletion](../../src/features/admin/users/api/useAdminUsers.ts#L177), [useAdminCancelDeletion](../../src/features/admin/users/api/useAdminUsers.ts#L194), [useAdminSetAdminPermissions](../../src/features/admin/users/api/useAdminUsers.ts#L215), bulk [:291](../../src/features/admin/users/api/useAdminUsers.ts#L291) — všechny jen `invalidate(['admin','users'])`.
- **Konzument:** [public-users](../../src/features/users/api/usePublicUsers.ts#L22) (adresář UsersTab, Admin+), [public-user-profile](../../src/features/users/api/usePublicUserProfile.ts#L13) (role chip + deleted overlay).
- **Rozpor:** `['admin','users']` má `[0]='admin'`, public klíče `[0]='public-users'`/`'public-user-profile'` → **žádný prefix overlap** → public konzumenti se neobnoví.
- **Trigger:** admin změní roli / zabanuje usera a má zároveň otevřený jeho veřejný profil nebo adresář (jiný tab/sekce). **Viditelnost:** tiše stará role / chybějící deleted-banner (toast „zabanováno" přesto naskočí). **Workaround:** F5 / staleTime 30–60s.
- **Závažnost:** 🟠 — admin obvykle operuje uvnitř admin tabu (`admin,users` se obnoví správně), public view je sekundární; krátký staleTime tlumí.
- **Návrh:** do admin user-mutating `onSuccess` přidat `invalidate(['public-users'])` + `invalidate(['public-user-profile', userId])` (userId je v args u single-mutací; u bulk stačí `['public-users']` + `['public-user-profile']` broad).

### 🟠 C-13 · `WS`/`FO` · WS friendship eventy invalidují méně než REST ekvivalent (pa-count drift)
- **Místo:** [useFriendshipsSocket.ts:48,63](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L48) — `friend:request:accepted` a `friend:removed` invalidují `['friends']`+`['friendship-status']`, ale **ne `['pending-actions']`**.
- **Rozpor (P4):** REST sourozenci (`useAcceptFriendRequest`, `useRemoveFriend`) přes `invalidateFriendshipQueries` `['pending-actions']` **invalidují**. WS (= akce od druhé strany) obnoví **míň** → badge „N žádostí" v sidebaru drží staré číslo, dokud byl request pending. (Shoda s bug-plan UF-28.)
- **Trigger:** protistrana přijme/zruší přátelství zatímco mám otevřený Ikaros s pending badge. **Viditelnost:** badge counter v levém/pravém sidebaru drift (číslo nesedí s realitou). **Workaround:** F5 / 30s staleTime / vlastní akce (která pa invaliduje).
- **Sekundárně:** `friend:request:canceled` [:59](../../src/features/friendships/hooks/useFriendshipsSocket.ts#L59) invaliduje jen `['pending-actions']`, **ne `['friendship-status']`** — pokud mám zrovna otevřený profil odesílatele, tlačítko drží `pending_incoming` po zrušení žádosti druhou stranou.
- **Závažnost:** 🟠 — badge drift je „matoucí", ne broken stav; není destruktivní.
- **Návrh:** sjednotit WS handlery na stejnou množinu jako REST: přidat `['pending-actions']` do `accepted`+`removed`, `['friendship-status']` do `canceled`. Ideálně sdílet `invalidateFriendshipQueries` helper i ve WS hooku (jeden zdroj pravdy WS↔REST).

### 🟡 C-14 · `FO` · admin username approve/reject neobnoví audit log
- **Mutace:** [useAdminApproveUsernameRequest:256](../../src/features/admin/users/api/useAdminUsers.ts#L256) (invaliduje `username-requests`+`admin,users`), [useAdminRejectUsernameRequest:359](../../src/features/admin/users/api/useAdminUsers.ts#L359) (jen `username-requests`).
- **Konzument:** [admin audit-log](../../src/features/admin/users/api/useAdminUsers.ts#L350) `['admin','audit-log']`.
- **Rozpor:** rozhodnutí o username se zapisuje do audit logu (BE), ale FE ho neinvaliduje (na rozdíl od `useAdminResetCooldown`, který `['admin','audit-log']` invaliduje). Otevřený audit-log tab nezobrazí nový záznam.
- **Trigger:** admin schválí/odmítne username request s otevřeným audit-log tabem. **Viditelnost:** tiše chybí řádek v auditu. **Workaround:** F5 / staleTime. **Závažnost:** 🟡 (audit je read-only diagnostika, ne akční stav).
- **Bonus (KM):** `useAdminRejectUsernameRequest` navíc neinvaliduje `['admin','users']` (na rozdíl od approve) → sloupec „pending request" v admin user listu drží starou hodnotu po reject. Drobné, stejná závažnost.
- **Návrh:** přidat `invalidate(['admin','audit-log'])` do obou + `invalidate(['admin','users'])` do reject (parita s approve).

## 6. Latentní / VERIFY (neeskalováno na C-xx)

- **D-02-1 `FO` 🟢 (ověřeno OK)** — `friends` prefix fan-out je správný; `inv:2 vs q:5` rekonciliace = false-positive (prefix-match pokryje outgoing+blocked). Viz §4. Žádná akce.
- **D-02-2 `KM` 🟢 (ověřeno OK)** — `invalidateBlockQueries` [:17](../../src/features/friendships/api/useFriendshipMutations.ts#L17) volá `['friends','blocked']` **navíc** k `['friends']` — redundantní (už pokryto prefixem), ale neškodné. Latentní pozn., ne nález.
- **D-02-3 `LC`/auth 🟡** — privacy-gate 403 na `public-user-profile` se po `accept` nemusí odemknout (error cache, `retry:false`). Tlumeno fresh mountem při navigaci + staleTime 60s. VERIFY (M4): existuje friends-only privacy mode, který gate 403 vrací? → potvrdit dopad.
- **D-02-4 `WS` 🟡 (drift-trap)** — WS↔REST invalidace u friendships jsou **dvě nezávislé kopie** množiny klíčů (WS hook ručně, REST přes helper). Refactor jednoho zapomene druhý (kořen C-13). Preventivní: extrahovat sdílený `invalidateFriendshipQueries` i do WS hooku.
- **`user-lookup` / `users,me,username-request`** — `user-lookup` je ephemeral picker (⚖️ by-design orphan, žádná mutace nemusí invalidovat). `users,me,username-request` má vlastní mutace (`useRequestUsernameChange`/`useCancel`/`useMarkSeen`) které ho invalidují ✅.

**Census (M-CEN): čistý** — žádná friendship/admin mutace v oblasti není bez cache efektu (každý `useMutation` má ≥1 `invalidateQueries`).
