# 12 — Admin

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `FO` `KM` `LC` (orphan) · perspektivy P1 (konzumentská inventura) + P4 (search eventual consistency) + P6 (orphan/dead).
> Soubory: `src/features/admin/api/`, `…/friendships/api/`, `…/components/SearchIndexTab/`, `…/users/components/AuditLogTab/`. Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-51…C-55`).
> **Stav: ✅ hotovo — 4 nálezy (C-51 🟠, C-52 🟠, C-53 🟡, C-54 🟡) + 1 ⚖️ by-design (C-55).**
> Admin **user management** (`useAdminUsers`) je pokrytý oblastí 02 (C-12/C-13/C-14) — zde se NEopakuje, jen se křížově odkazuje u audit-log fan-outu (C-52).
> Emotes admin v `features/admin/` **neexistuje** (grep prázdný) — žádný povrch.

## 1. Konzumentská inventura (P1)

| Zdroj / entita | `queryKey` | role | staleTime / refetch / enabled | soubor:řádek |
|---|---|---|---|---|
| Admin dashboard stats | `['admin','stats','overview']` | dashboard widgety (users/worlds/content/queue counts) | 60s; `enabled` param | [useAdminStats.ts:11](../../src/features/admin/api/useAdminStats.ts#L11) |
| Search index stats | `['admin','search-index-stats']` | SearchIndexTab (indexedCount/vectors/pending/status) | `refetchInterval:5000` | [useSearchIndex.ts:17,25](../../src/features/admin/api/useSearchIndex.ts#L17) |
| World search výsledky (MeiliSearch) | `['world-search', worldId, providerKey, q]` | search dropdown ve světě | 30s; `!!worldId && q.length>0` | [useWorldSearch.ts:28](../../src/features/world/search/api/useWorldSearch.ts#L28) |
| Friendship by-pair | `['admin','friendships','by-pair',userA,userB]` | FriendshipDebugTab (1 řádek) | 15s; `!!A && !!B && A!==B` | [useAdminFriendships.ts:22](../../src/features/admin/friendships/api/useAdminFriendships.ts#L22) |
| Friendship by-user | `['admin','friendships','by-user',userId]` | FriendshipDebugTab (seznam) | 15s; `!!userId` | [useAdminFriendships.ts:36](../../src/features/admin/friendships/api/useAdminFriendships.ts#L36) |
| Admin audit log | `['admin','audit-log',query]` | AuditLogTab (paginovaný seznam) | default 30s | [useAdminUsers.ts:350](../../src/features/admin/users/api/useAdminUsers.ts#L350) |

> Friendship by-pair/by-user jsou **DEV-only** (FriendshipDebugTab render gated `IS_DEV`, [PlatformAdminPage.tsx:81](../../src/features/admin/pages/PlatformAdminPage.tsx#L81)) — na produkci se nemountují. Reset cooldown ale na produkci dostupný přes route — viz C-55.

## 2. Mutace × konzument matice

| Mutace (soubor:řádek) | adminStats | search-index-stats | world-search | friendships (pair/user) | audit-log |
|---|---|---|---|---|---|
| useRebuildSearchIndex [useSearchIndex.ts:36](../../src/features/admin/api/useSearchIndex.ts#L36) | — | ✅ (`STATS_KEY`) | ⚖️ ne (eventual) | — | — |
| useAdminResetCooldown [useAdminFriendships.ts:56](../../src/features/admin/friendships/api/useAdminFriendships.ts#L56) | — | — | — | ✅ `['admin','friendships']` | ✅ `['admin','audit-log']` |
| user-mgmt mutace (ban/role/perm/deletion/username) — oblast 02 | **❌** | — | — | — | **❌** → C-52 |
| content mutace (články/galerie/diskuze/světy) — oblast 03/10 | **❌** | — | ⚖️ ne (eventual) | — | — |

**Žádná mutace** neinvaliduje `['admin','stats','overview']` (orphan → C-51) ani `['world-search',…]` (orphan, ale ⚖️ by-design → C-55).

## 3. Nálezy

### 🟠 C-51 · `LC`/`FO` (orphan) · admin dashboard stats nikdy neinvalidovány — jen 60s staleTime
- **Dotaz:** [useAdminStats.ts:9–16](../../src/features/admin/api/useAdminStats.ts#L9) `['admin','stats','overview']`, `staleTime:60_000`, jediný konzument [OverviewTab.tsx:25](../../src/features/admin/components/OverviewTab/OverviewTab.tsx#L25).
- **Rozpor:** **žádná** mutace v celém repu klíč `['admin','stats']` neinvaliduje (grep `'stats'` → jen definice + nesouvisející gallery/articles `…,'stats'`). Stat-karty čerpají z entit, které mutují jiné oblasti: `users.total/pendingDeletion` (ban/delete-request → oblast 02), `worlds.total` (create world → 03), `content.articles/galleryImages/discussions` (10), `queue.pendingUsernameRequests` (approve/reject username → 02). Žádná z těch mutací stats neobnoví.
- **Trigger:** admin zabanuje/smaže uživatele, schválí username request, vytvoří svět nebo článek → přepne na záložku Přehled. **Viditelnost:** widget „Čeká na smazání", „Žádosti o username", „Celkem uživatelů/světů/článků" tiše drží **staré číslo** (počitadlo, ne broken UI). **Workaround:** F5 nebo počkat do staleTime 60s + refetchOnMount při příštím přepnutí tabu.
- **Závažnost:** 🟠 — snapshot dashboard (komentář v souboru sám říká „snapshot, ne realtime"), 60s staleTime tlumí; ale `pendingDeletion`/`pendingUsernameRequests` jsou **akční fronty** s `tone:'accent'` odznakem → admin se může spolehnout na zastaralou 0/N. Zvlášť `pendingUsernameRequests` má `to="/ikaros/uzivatele?tab=zpracovat"` — kliknutelný badge na frontu.
- **Návrh:** buď (a) ponechat čistě jako snapshot a **přidat refetch tlačítko** v OverviewTab (`refetch()` z useQuery), nebo (b) do akčních mutací (`useAdminApproveUsernameRequest`, `useAdminRejectUsernameRequest`, `useAdminRequestDeletion`, `useAdminCancelDeletion`, bulk) přidat `invalidate(['admin','stats'])` pro fronta-county. Min. (a). Buď vědomě by-design (pak doplnit poznámku „snapshot — refresh ručně"), nebo doplnit invalidaci.

### 🟠 C-52 · `FO`/`KM` · audit-log invaliduje JEN cooldown reset — všechny ostatní auditované akce ho nechají stale
- **Konzument:** AuditLogTab `['admin','audit-log',query]` [useAdminUsers.ts:350](../../src/features/admin/users/api/useAdminUsers.ts#L350).
- **Jediný invalidátor:** [useAdminFriendships.ts:58](../../src/features/admin/friendships/api/useAdminFriendships.ts#L58) `invalidate(['admin','audit-log'])` (prefix-matchuje korektně — ✅ KM ověřeno: `['admin','audit-log']` ⊑ `['admin','audit-log',query]`).
- **Rozpor:** BE loguje do `AdminAuditLog` i akce z user-mgmt: BAN/UNBAN/ROLE_CHANGE/ADMIN_PERMISSIONS_CHANGE/USERNAME_REQUEST_APPROVED/REJECTED (jasné z `ACTION_LABELS` v [AuditLogTab.tsx:7–18](../../src/features/admin/users/components/AuditLogTab/AuditLogTab.tsx#L7)). Tyto mutace ([useAdminUsers.ts](../../src/features/admin/users/api/useAdminUsers.ts) — `useAdminBanUser:151`, `useAdminUnbanUser:166`, `useAdminUpdateRole:124`, `useAdminSetAdminPermissions:230`, `useAdminApproveUsernameRequest:264`, `useAdminRejectUsernameRequest:374`, bulk `:300/313/326`) invalidují **jen** `['admin','users']` / `['admin','username-requests']` — **nikdy** `['admin','audit-log']`.
- **Trigger:** admin zabanuje usera / změní roli / schválí username (vše loguje audit) → otevře záložku Audit log. **Viditelnost:** právě provedená akce **chybí** v audit logu, dokud nezabere staleTime/refetchOnMount (tab byl unmountovaný — viz pozn.). Tiše neúplný log, žádná chyba.
- **Pozn. (zmírnění):** AuditLogTab a UsersAdminTab jsou **různé taby** [PlatformAdminPage.tsx:77–80](../../src/features/admin/pages/PlatformAdminPage.tsx#L77) — audit-log query je při akci typicky **unmounted**, takže invalidace by stejně jen označila stale a refetch nastane při příštím mountu tabu (= stejný efekt jako teď přes staleTime). Proto 🟠 ne 🔴: cross-tab přepnutí audit log víceméně vždy refetchne. Riziko reálné jen když admin nechá Audit log otevřený v druhé záložce prohlížeče během akce.
- **Asymetrie:** cooldown reset (DEV-only nástroj) audit-log invaliduje, ale produkční ban/role akce ne — nekonzistentní vzor.
- **Návrh:** přidat `invalidate(['admin','audit-log'])` do auditovaných user-mgmt mutací (parita s cooldown resetem), nebo žádnou — ale sjednotit. Křížový odkaz: oblast 02 (C-12/C-13/C-14) řeší `['admin','users']` fan-out těchže mutací; audit-log je další zapomenutý konzument.

### 🟡 C-53 · `OPT`/`FO` · cooldown reset nepoužívá vrácený `friendship`, spoléhá na invalidate-refetch (DEV-only)
- **Mutace:** [useAdminFriendships.ts:51–59](../../src/features/admin/friendships/api/useAdminFriendships.ts#L51) — BE vrací `{ friendship: AdminFriendshipView }`, ale `onSuccess` ho **zahodí** a jen invaliduje `['admin','friendships']` (prefix-matchuje by-pair i by-user — ✅ KM) + `['admin','audit-log']`.
- **Posouzení:** invalidace **je** korektní a kompletní pro DEV nástroj — refetch obnoví `lastDeclinedAt:null` v řádku. by-pair/by-user jsou při resetu **mounted** (řádek pochází z jednoho z nich → `enabled` true) → refetch proběhne, ne jen mark-stale. **Není to bug**, jen latentní: vrácený `friendship` se nevyužívá (mohl by jít přes `setQueryData` pro instant update bez round-tripu). Krátký 15s staleTime + DEV-only gate → nízká priorita.
- **Trigger:** reset cooldownu v FriendshipDebugTab. **Viditelnost:** krátký flicker (refetch) místo instant update; po refetchi korektní. **Workaround:** žádný potřeba (funguje).
- **Návrh:** volitelně `setQueryData` na by-pair klíč z vráceného `friendship` pro instant odezvu; jinak ponechat. Žádná akce nutná.

### 🟡 C-54 · `KM`/`SC` (drift-trap) · friendships query klíče = inline pole na 4 místech, žádná factory
- **Místo:** klíče `['admin','friendships',…]` definovány inline v query ([useAdminFriendships.ts:22,36](../../src/features/admin/friendships/api/useAdminFriendships.ts#L22)) i invalidaci (`:57`). Stejně `['admin','audit-log']` — invalidace inline ve friendships (`:58`), query inline v useAdminUsers (`:350`), **dva soubory**.
- **Rozpor:** žádná key-factory (na rozdíl od 12 souborů, co ji mají). Dnes se shodují (✅ aktuálně OK), ale refactor jednoho místa (přejmenování segmentu, přidání scope) tiše rozbije druhé → invalidace do prázdna. Zvlášť cross-file `audit-log` (definice a invalidace v jiných featurech) je náchylné.
- **Trigger:** budoucí refactor. **Viditelnost:** latentní — dnes nic. **Závažnost:** 🟡 preventivní.
- **Návrh:** zvážit `adminFriendshipsQueryKey` / `adminAuditLogQueryKey` factory sdílenou mezi query a invalidací (vzor `charactersQueryKey`). Cross-ref C-52 (audit-log invalidace patří k user-mgmt mutacím → factory by sjednotila).

## 4. ⚖️ By-design / VERIFY (neeskalováno na bug)

### ⚖️ C-55 · `LC`/P4 · world-search výsledky = orphan + BE async reindex → eventual consistency (VERIFY)
- **Místo:** `['world-search', worldId, providerKey, q]` [useWorldSearch.ts:28](../../src/features/world/search/api/useWorldSearch.ts#L28), `staleTime:30_000`. **Žádná** content mutace ho neinvaliduje (orphan).
- **Posouzení — by-design:** search výsledky jdou přes MeiliSearch, který BE **asynchronně reindexuje** (paměť `project_search_per_world`). I kdyby FE invalidoval `['world-search']` hned po create stránky, BE index ještě **nemusí** nový dokument obsahovat (reindex job běží mimo request). FE invalidace by tedy nic nezískala — jen by refetchla stejný (ještě neaktualizovaný) index. Správné chování je **eventual consistency**: index dohoní, 30s staleTime + nové query (jiný `q`) přinesou čerstvý stav. **Není to FE cache bug.**
- **Trigger:** vytvořím stránku → hned hledám její název. **Viditelnost:** nová stránka chvíli (do reindexu) chybí ve výsledcích — vlastnost MeiliSearch async indexace, ne stale RQ cache. **Workaround:** opakovat hledání za pár sekund.
- **VERIFY (M4):** runtime — změřit reálnou latenci reindexu BE; pokud >minuty, zvážit FE toast „index se aktualizuje" po create. Patří spíš do oblasti 13/search-bug-plánu než cache. SearchIndexTab (`refetchInterval:5000`) dává adminovi vidět progress reindexu (`pendingPages`).

### ⚖️ SearchIndexTab rebuild — ✅ shoda
- [useSearchIndex.ts:32–40](../../src/features/admin/api/useSearchIndex.ts#L32): rebuild `onSuccess` → `invalidate(STATS_KEY)`. `STATS_KEY` = táž `as const` konstanta sdílená query i invalidací (`:17`) → **drift nemožný** (mini-factory vzor). Navíc `refetchInterval:5000` obnovuje progress nezávisle na invalidaci. **Ideální vzor — žádný nález.**

## 5. Census (M-CEN)
- **Čistý** — žádná mutace v oblasti bez cache efektu. `useRebuildSearchIndex` ✅ (`STATS_KEY`), `useAdminResetCooldown` ✅ (`friendships`+`audit-log`).

## 6. Souhrn nálezů
| ID | Závažnost | Osa | Jádro |
|---|---|---|---|
| C-51 | 🟠 | `LC`/`FO` | adminStats orphan — žádná mutace neobnoví dashboard county (akční fronty stale 60s) |
| C-52 | 🟠 | `FO`/`KM` | audit-log invaliduje jen cooldown reset; ban/role/username akce ho nechají stale (zmírněno cross-tab unmountem) |
| C-53 | 🟡 | `OPT`/`FO` | cooldown reset zahodí vrácený `friendship`, spoléhá na refetch (DEV-only, funguje) |
| C-54 | 🟡 | `KM` | friendships + audit-log klíče = inline na 4 místech, žádná factory (drift-trap) |
| C-55 | ⚖️ | `LC`/P4 | world-search orphan = by-design (MeiliSearch async reindex, eventual consistency); VERIFY latence |
