# 01 — Auth & účet

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `FO` `CB` `WS` · perspektivy P7 (dual-cache RQ↔jotai) + P1 (konzumentská inventura).
> Soubory: `src/features/auth/api/`, `…/auth/components/`, `…/auth/pages/`, `src/features/profile/api/`,
> `…/profile/components/`, `src/shared/store/authStore.ts`, `…/admin/users/api/useAdminUsers.ts` (username request),
> `src/themes/useThemeSync.ts`. Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-27…C-32`).
> **Stav: ✅ hotovo — 6 nálezů (C-27…C-32). K-C6 potvrzen (C-27 + C-28).**

## 0. Architektura identity uživatele — kde žije pravda (P7)

Identita current usera žije **ve dvou cache** současně:

| Store | Co drží | Kde se zapisuje | Kde se čte |
|---|---|---|---|
| **jotai `currentUserAtom`** (`atomWithStorage`, localStorage `ikaros.user`) | celý `User` (username, avatar, role, theme, oblíbené, pinned, deletion stav) | login/register/logout/reactivate/delete (`store.set`), `useUpdateProfile`+avatar (`getDefaultStore().set`), `useCurrentUserHydration` useEffect (`data→setUser`) | **header `HeaderLoggedIn`** ([IkarosLayout.tsx:614](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L614)), **`RightPanel`** (role/admin gate, oblíbené, pinned — [:380](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L380)), `AccountSection`, `DeleteAccountModal`, `ThemeProvider`/`useThemeSync`, `AppearanceSection.themeSettings` filter, +90 dalších míst |
| **RQ `['users','me']`** | `User` (stejný shape, z `/users/me`) | `useUpdateProfile`/avatar `setQueryData`, `useCurrentUserHydration`/`useMyProfile` `queryFn`, favoriteCharacters optimistic | `useMyProfile` (ProfilePage detail, SecuritySection cooldown), `useCurrentUserHydration` (root), `useFavoriteCharacters` | 

> ⚠️ **Klíčová asymetrie (kořen K-C6):** dvě cesty zápisu se chovají různě.
> - **`setQueryData(['users','me'], data)` + `getDefaultStore().set(currentUserAtom, data)`** (profil/avatar mutace) → **dual-write**, obě cache čerstvé → header i ProfilePage OK. ✅
> - **`invalidateQueries(['users','me'])`** sám (email-verify, email-change-confirm, username-request) → refetchne **jen RQ query**. `currentUserAtom` se aktualizuje **nepřímo** přes `useCurrentUserHydration` useEffect (`if (data) setUser(data)`), který běží **jen pokud je `<AuthBootstrap>` mounted** (je — root [main.tsx:32](../../src/app/main.tsx#L32)) a query je mounted+enabled. Most existuje, ale je implicitní — viz C-27.
> - **raw `api.patch('/users/me', …)` bez cache efektu** (`useThemeSync`) → **ani jedna** cache se neaktualizuje → C-28.

## 1. Konzumentská inventura (P1)

| Zdroj / entita | `queryKey` / atom | role | staleTime / enabled | soubor:řádek |
|---|---|---|---|---|
| Current user (RQ) | `['users','me']` | profil detail + SecuritySection cooldown + favoriteCharacters optimistic | 30s; `!!accessToken` | [useAuth.ts:144,162](../../src/features/auth/api/useAuth.ts#L144) |
| Current user (jotai) | `currentUserAtom` | **header (jméno/avatar)** + **RightPanel (role gate, oblíbené, pinned)** + Account/Delete/Theme | localStorage | [authStore.ts:7](../../src/shared/store/authStore.ts#L7) |
| Moje postavy (cross-world) | `['users','me','characters']` | sekce MyCharactersSection na profilu | 60s; `!!accessToken` | [useMyCharactersGlobal.ts:14](../../src/features/profile/api/useMyCharactersGlobal.ts#L14) |
| Vlastní username request | `['users','me','username-request']` | banner v SecuritySection | default 30s | [useAdminUsers.ts:17](../../src/features/admin/users/api/useAdminUsers.ts#L17) |
| Posl. nerozhodnutá username žádost | `['users','me','username-request','last-unseen-decided']` | toast po loginu (AuthBootstrap) | 60s; `!!token` | [useAdminUsers.ts:64](../../src/features/admin/users/api/useAdminUsers.ts#L64) |
| Availability (registrace) | `['check-username',v]` / `['check-email',v]` | live validace — read-only, žádná mutace | 30s; délka+formát | [useAvailability.ts:21,40](../../src/features/auth/api/useAvailability.ts#L21) |

> `accessTokenAtom`/`refreshTokenAtom` = session tokeny (localStorage), nejsou serverový stav.
> `themeAtom` (jotai, localStorage `ikaros.theme`) = vizuální theme, **odděleně** od `user.themeId` (dva zdroje — viz C-28).

## 2. Mutace × konzument matice

| Mutace (soubor:řádek) | RQ `['users','me']` | jotai `currentUserAtom` | způsob | placement |
|---|---|---|---|---|
| useUpdateProfile (displayName/city/bio/chatColor/privacy/themeSettings/character) | ✅ setQueryData | ✅ store.set | dual-write | `useMutation({onSuccess})` |
| useUploadAvatar / useDeleteAvatar | ✅ setQueryData | ✅ store.set | dual-write | onSuccess |
| useUploadCharacterAvatar / useDeleteCharacterAvatar | ✅ setQueryData | ✅ store.set | dual-write | onSuccess |
| useChangePassword | — | — | jen toast (žádný user data delta) | onSuccess |
| useEmailVerify | ✅ invalidate | ⚠️ nepřímo (hydration most) | invalidate-only | onSuccess → **C-27** |
| EmailChangeConfirmPage | ✅ invalidate | ⚠️ nepřímo (most) | invalidate-only | `mutateAsync().then` → **C-27 / C-30** |
| useRequestUsernameChange / useCancelMyUsernameRequest | ✅ invalidate (+`username-request`) | ⚠️ nepřímo (most) | invalidate-only | onSuccess → **C-27** |
| **useThemeSync** (změna globálního motivu) | **❌** | **❌** | raw `api.patch`, žádný cache efekt | useEffect debounce → **C-28** |
| useEmailChangeRequest (request, ne confirm) | — | — | jen toast (delta až po confirm) | by-design |
| useLogin / useRegister / useReactivateDeletion | — (nečistí cizí cache) | ✅ store.set(user) | atom-only | onSuccess → **C-29** |
| useLogout (timer) | **❌ nečistí** | ✅ store.set(null) | atom-only | timeout cb → **C-29** |
| useRequestSelfDeletion (dryRun=false) | ✅ invalidate + ❌ neclear | ✅ store.set(null) | mix → **C-29** |
| useReactivateDeletion | ✅ invalidate | ✅ store.set(user) | dual | onSuccess |

**WS handlery v oblasti:** žádný auth/profil WS event neaktualizuje `['users','me']` / `currentUserAtom`. Identita usera se mění jen vlastní akcí → změna username schválená adminem (jiný klient) se k uživateli dostane **jen** přes `last-unseen-decided` toast po příštím loginu/refetchi, ne živým pushem → C-31.

## 3. Verdikt seed kandidáta K-C6 — potvrzen (rozdělen na C-27 + C-28)

Zadání K-C6: „update profilu invaliduje query, ale obnoví se jméno/avatar v headeru, když ten čte z jotai atomu?"

**Header (`HeaderLoggedIn`) i RightPanel čtou identitu z `currentUserAtom` (jotai), NE z `['users','me']`** ([IkarosLayout.tsx:614,380](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L614)). Verdikt je **dvojí**:
- **Hlavní edit cesta (ProfileHeader → `useUpdateProfile`, avatar) je v pořádku** — dělá explicitní dual-write (`setQueryData` + `getDefaultStore().set(currentUserAtom)`), takže header se překreslí okamžitě. Toto K-C6 **nepotvrzuje** pro jméno/avatar/displayName/chatColor/privacy. ✅
- **Potvrzeno ale pro „tiché" cesty:** mutace, které dělají **jen `invalidate(['users','me'])`** (C-27) nebo **raw PATCH bez cache efektu** (C-28 theme), spoléhají buď na nepřímý hydration most, nebo neobnoví atom vůbec.

## 4. Nálezy

### 🟠 C-27 · `P7`/`FO` · `invalidate(['users','me'])` obnoví jen RQ, jotai atom závisí na nepřímém hydration mostu
- **Mutace:** [useEmailVerify.ts:11](../../src/features/auth/api/useEmailVerify.ts#L11), [EmailChangeConfirmPage.tsx:58](../../src/features/auth/pages/EmailChangeConfirmPage.tsx#L58), [useAdminUsers.ts:39,54](../../src/features/admin/users/api/useAdminUsers.ts#L39) (request/cancel username) — všechny dělají **jen** `invalidateQueries(['users','me'])`, bez `getDefaultStore().set(currentUserAtom)`.
- **Konzument:** header/RightPanel čtou `currentUserAtom` ([IkarosLayout.tsx:614,395](../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L614)) — role gate, avatar, jméno. Most: invalidate → refetch RQ → `useCurrentUserHydration` useEffect `if(data) setUser(data)` ([useAuth.ts:150-152](../../src/features/auth/api/useAuth.ts#L150)) přepíše atom.
- **Rozpor:** atom se obnoví **jen** když je `<AuthBootstrap>` mounted (je, root) **a** `['users','me']` mounted+enabled (refetch běží jen pro mounted dotazy). Email-verify/confirm běží na **samostatných stránkách** (`/overit-email`, `/zmena-emailu`) — pokud tam `useCurrentUserHydration` query běží (AuthBootstrap je v root nad routerem, takže ano), most drží. Funguje, ale je to **implicitní řetěz** přes globální effect, ne explicitní zápis vedle invalidace jako u profil mutací. Drift-trap: kdokoli odmountuje/zúží AuthBootstrap rozbije obnovu atomu po těchto akcích.
- **Trigger:** ověření e-mailu / potvrzení změny e-mailu / žádost o username. **Viditelnost:** `emailVerified` badge v ProfileHeader (čte RQ `data` → OK); ale `user.email` v headeru/jinde, který čte atom, by se opozdil o jeden refetch tick. Reálně tiše OK díky mostu. **Workaround:** F5.
- **Závažnost:** 🟠 (funguje přes most, ale latentně křehké + nekonzistentní vzor vůči profil mutacím, které atom píší explicitně).
- **Návrh:** sjednotit na vzor profil mutací — buď do `onSuccess` přidat `getDefaultStore().set(currentUserAtom, refetchedData)`, nebo (lépe) zavést sdílený helper `applyMeUpdate(data)` který dělá `setQueryData` + atom set, a používat ho všude místo holé invalidace. Min. zdokumentovat hydration most jako kontrakt.

### 🟠 C-28 · `P7`/`FO` · změna globálního motivu nepíše do ŽÁDNÉ user cache (RQ ani atom stale)
- **Mutace:** [useThemeSync.ts:42,68](../../src/themes/useThemeSync.ts#L42) — `api.patch('/users/me', { themeId })` **bez** `setQueryData`, **bez** `invalidate`, **bez** `currentUserAtom` set. ThemeSwitcher mění jen `themeAtom` (vizuál se přepne), server se dorovná debounced PATCHem.
- **Konzument:** RQ `['users','me'].themeId` + `currentUserAtom.themeId`. Čtenář: ProfileHeader pole „Globální motiv" `value={user.themeId}` ([ProfileHeader.tsx:185](../../src/features/profile/components/ProfileHeader.tsx#L185)) a `useThemeSync` initial-sync logika (`user.themeId` vs `themeAtom`).
- **Rozpor:** po změně motivu drží `['users','me'].themeId` i `currentUserAtom.themeId` **starou** hodnotu (PATCH response se zahodí). Vizuál je správně (themeAtom), ale **datová pravda v cache je stale** dokud staleTime 30s / refetch / F5. ProfileHeader „Globální motiv" zobrazí starý themeId. Při dalším mountu `useThemeSync` čte stale `user.themeId`, ale `themeAtom` (localStorage) vyhrává díky `hadStoredThemeAtMount` guardu → vizuál nerozbitý; jde čistě o stale data v cache.
- **Trigger:** uživatel přepne globální motiv v ThemeSwitcher → otevře profil. **Viditelnost:** ProfileHeader řádek „Globální motiv" ukazuje předchozí motiv, ač UI běží na novém. Tiché. **Workaround:** F5 / 30s staleTime na ProfilePage.
- **Závažnost:** 🟠 (vizuál OK díky atomu, jen zobrazené datové pole stale; cross-device sync funguje při fresh loadu).
- **Návrh:** v outbound PATCH `useThemeSync` po úspěchu udělat `setQueryData(['users','me'], old => old && {...old, themeId})` + `getDefaultStore().set(currentUserAtom, old => …)` (nebo invalidate). PATCH už vrací usera (BE `/users/me` PATCH → `User`) → lze rovnou `setQueryData(response)`.

### 🟠 C-29 · `CB`/`P7` · logout / delete / login NEČISTÍ RQ cache (`qc.clear`) — cross-user cache leak
- **Místo:** [useAuth.ts:90-93](../../src/features/auth/api/useAuth.ts#L90) (`useLogout` timeout), [useDeleteAccount.ts:74-77](../../src/features/profile/api/useDeleteAccount.ts#L74) (`useRequestSelfDeletion`), [useAuth.ts:39-46,60-67](../../src/features/auth/api/useAuth.ts#L39) (login/register) — všechny mění **jen jotai atomy**, žádný `qc.clear()` / `qc.removeQueries()`. Grep potvrdil: **`qc.clear()` se v celém `src/` nevyskytuje.**
- **Rozpor:** RQ cache (`['users','me']`, `['users','me','characters']`, `['worlds','my']`, oblíbené, pošta, …) přežívá logout celá (gcTime 5 min default). `enabled:!!accessToken` jen zablokuje **nové** fetche — neodstraní existující záznamy. Při **logout A → login B v jednom tabu bez F5** vidí B v cache data uživatele A, dokud se každý dotaz neoznačí stale a nerefetchne (staleTime 30s–5min, jen pro mounted dotazy). `currentUserAtom` se sice přepíše na B (login píše atom), ale RQ-driven konzumenti (ProfilePage detail, SecuritySection cooldown, moje postavy, pošta) chvíli míchají A+B.
- **Trigger:** odhlášení a přihlášení jiného účtu ve stejné session (sdílený počítač, testování, account switch). **Viditelnost:** tiše stará data druhého uživatele — **falešná identita v RQ-driven sekcích** (citlivé: cizí pošta/postavy/účet). **Workaround:** F5 (router reload by RQ nevyčistil sám, ale full reload ano).
- **Závažnost:** 🟠 (na hraně 🔴 — leak osobních dat mezi účty; tlumeno tím, že většina headeru čte atom, který se přepíše, a staleTime krátký; ale RQ detail dotazy drží stale).
- **Návrh:** přidat `qc.clear()` (nebo cílené `qc.removeQueries`) **na logout** (po vyčištění atomů) a **na úspěšný login/register/reactivate** (před/po set atomů). `useLogout` ale nemá přístup ke `queryClient` (čistá funkce mimo komponentu) → buď přepsat na hook s `useQueryClient`, nebo nechat clear v `HeaderLoggedIn.handleLogout`. Pozor na 5s undo (`pendingLogoutAtom`) — clear až po vypršení timeru, ne při startu (jinak undo vrátí prázdnou cache).

### 🟠 C-30 · `CB` · EmailChangeConfirmPage invaliduje v `mutateAsync().then` — unmount-drop riziko
- **Místo:** [EmailChangeConfirmPage.tsx:54-60](../../src/features/auth/pages/EmailChangeConfirmPage.tsx#L54) — `confirm.mutateAsync(token).then(() => { …; qc.invalidateQueries(['users','me']); })`. Invalidace žije v `.then` na call-site, ne v `useMutation({onSuccess})`.
- **Rozpor:** pokud uživatel po kliku v mailu během on-mount POST odnaviguje (rychlý klik „Přejít na profil" zobrazí se až po success, ale obecně call-site callback se ztratí při unmountu mezi requestem a resolve). Konkrétně tady malé riziko (stránka čeká na resolve, tlačítka až ve `success` stavu), ale vzor je křehký. **Stejný vzor v EmailVerifyPage** [:54-60](../../src/features/auth/pages/EmailVerifyPage.tsx#L54) (tam ale invalidace žije v `useMutation({onSuccess})` v [useEmailVerify.ts:9](../../src/features/auth/api/useEmailVerify.ts#L9) — bezpečně; page jen `.then(setState)`).
- **Trigger:** potvrzení změny e-mailu + okamžitý odchod ze stránky. **Viditelnost:** `['users','me']` se neinvaliduje → starý e-mail v profilu do staleTime/F5. **Workaround:** F5. **Závažnost:** 🟠→🟡 (úzké okno; success UI drží mount).
- **Návrh:** přesunout `invalidateQueries(['users','me'])` (a ideálně atom update — C-27) z page `.then` do `useEmailChangeConfirm` `useMutation({onSuccess})` — paritní s `useEmailVerify`. Tím přežije unmount.

### 🟡 C-31 · `WS` · změna identity (schválený username, ban, role) nemá real-time push k uživateli
- **Místo:** v oblasti **žádný** WS handler neaktualizuje `['users','me']` / `currentUserAtom`. Admin schválí username ([useAdminUsers.ts:263](../../src/features/admin/users/api/useAdminUsers.ts#L263)) → invaliduje jen `['admin',…]`, ne cílového uživatele. Toast žadateli řeší `last-unseen-decided` polling po **příštím loginu** (AuthBootstrap), ne živě.
- **Rozpor:** když adminu schválí username / změní roli / zabanuje právě přihlášeného uživatele, jeho header (atom) i RQ profil drží **starou** identitu, dokud se neodhlásí/nerefreshne nebo nezaberou staleTime. Žádný `user:updated` WS event.
- **Trigger:** admin akce nad aktivně přihlášeným uživatelem. **Viditelnost:** uživatel vidí staré jméno/roli/oprávnění do F5; ban-gate se neprojeví dokud další request nevrátí 401/403. **Workaround:** F5 / relog. **Závažnost:** 🟡 (vzácné; bezpečnostně tlumeno BE gate na requestech — viz role-plan).
- **Návrh (cross-oblast):** zvážit `user:self:updated` WS signál (paritní s `universe:updated` vzorem) → klient `invalidate(['users','me'])` + atom refresh. Mimo scope cache-fixu; eskalovat do ws-contract-plan. Zde jen evidence.

### 🟡 C-32 · `P7` (drift-trap) · `themeAtom` vs `user.themeId` = dva nezávislé zdroje pravdy pro motiv
- **Místo:** [useThemeSync.ts:18-51](../../src/themes/useThemeSync.ts#L18) — motiv žije v `themeAtom` (localStorage `ikaros.theme`) **i** v `user.themeId` (RQ/atom). Sync má manuální „local wins / fresh device BE wins" logiku přes `hadStoredThemeAtMount`.
- **Rozpor:** není to broken invalidace, ale strukturální dual-source. C-28 je jeho přímý důsledek (PATCH nepíše do user cache → po reloadu se rozhoduje, který zdroj vyhraje). Pokud by se C-28 opravil (PATCH píše `user.themeId`), zmizí riziko desynchronizace mezi `themeAtom` a `user.themeId`.
- **Trigger:** přepnutí motivu na zařízení A, otevření na zařízení B (cross-device). **Viditelnost:** B při fresh loadu (prázdné localStorage) bere `user.themeId` (BE) — ale ten je stale dokud C-28 neopraven. **Workaround:** F5 / relog na B. **Závažnost:** 🟡 (preventivní; kořen sdílený s C-28).
- **Návrh:** vyřešit C-28 (PATCH píše do user cache) → jediný outbound zdroj. Dlouhodobě zvážit derivaci `themeAtom` z `user.themeId` při hydrataci místo dvou nezávislých store.

## 5. Latentní / VERIFY (neeskalováno na C-xx)

- **D-01-1 `OPT` ✅** — `useFavoriteCharacters` ([useFavoriteCharacters.ts:78-95](../../src/features/world/pages/CharactersPage/hooks/useFavoriteCharacters.ts#L78)) optimisticky píše `setQueryData(['users','me'])` s `onMutate` snapshot + `onError` rollback + `onSettled` invalidate — plný cyklus. Žije **jen** v RQ (žádný jotai mirror oblíbených) → bez cross-store driftu. (Detail oblast 05.)
- **D-01-2 `CB` ✅** — `useUpdateProfile`/avatar invalidace/setQueryData žijí v `useMutation({onSuccess})` (přežijí unmount). Edit form na ProfilePage, mount stabilní. ✅
- **D-01-3 `LC` VERIFY 🟡** — dva současné mounty `['users','me']` (`useMyProfile` v ProfilePage + `useCurrentUserHydration` v root AuthBootstrap) sdílí jeden cache záznam. `setQueryData` aktualizuje oba; invalidate refetchne (oba mounted+enabled). Korektní, ale závisí na tom, že AuthBootstrap query je vždy mounted (je, root nad routerem). M4 runtime by potvrdil obnovu atomu po email-verify na samostatné route.
- **`useChangePassword` ✅** — BE revokuje refresh tokeny ostatních zařízení; FE nemá user-data delta k obnově (jen toast). Census OK (mutace bez cache efektu je zde **správně** — žádný čtený zdroj se nemění).
- **`useEmailChangeRequest` / `useForgotPassword` / `useResetPassword` ✅** — request fáze, žádná user-data delta v cache (e-mail se mění až confirm → C-30/C-27). ResetPassword po úspěchu úmyslně NEdělá auto-login → žádná cache k seedování. Census OK.

**Census (M-CEN):** mutace bez cache efektu jsou **úmyslné** (changePassword, forgot/reset-password, email-change-request, dryRun delete, availability — read-only). Jediná mutace s **user-data deltou a chybějícím cache efektem** je `useThemeSync` PATCH → **C-28**.
