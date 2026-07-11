# bug / 00-cross-cutting — checkpoint RUN-2026-07-11-1213

STATUS: DONE · dosažená L2 (cílová L3) · 2 🆕 (0 🔴, 1 🟡, 1 🟢) + potvrzené známé (♻️)

## Pokrytí (co jsem prošel)

**BE (`C:/Matrix/ProjektIkaros/Projekt-ikaros/backend`):**
- `src/common/guards/jwt-auth.guard.ts` — celý (per-request DELETED/BANNED/DELETION_PENDING gate + freshness role z DB + elevation)
- `src/common/guards/optional-jwt-auth.guard.ts` — celý (PT-35e: DB re-check, degrade na anonyma)
- `src/common/guards/roles.guard.ts` — celý (INSUFFICIENT_ROLE 403, CS)
- `src/common/filters/http-exception.filter.ts` — celý (@Catch() catch-all, code propagace, Multer/Cast/dup-key/413/parse větve, 5xx→Sentry+alert)
- `src/socket-io.adapter.ts` — celý (wsAccountGate ban/delete middleware, Redis adapter + error handlery)
- `src/gateways/{app,base}.gateway.ts` — celé (room:join chat:/user: gate, ROOM_PATTERN)
- `src/gateways/gateways.module.ts` — struktura
- `src/app.module.ts` + `src/main.ts` — celé (ThrottlerGuard APP_GUARD, global filter, ValidationPipe forbidNonWhitelisted, helmet CSP/HSTS, CORS, body limit 5mb, static/uploads CORP)
- `src/modules/chat/chat.gateway.ts:41-57` — handleConnection nastavuje `client.data.userId = payload.sub` (ověřeno: sdílený socket namespace '/' → AppGateway user:/chat: gate má identitu)

**FE (`C:/Matrix/ProjektIkaros/Projekt-ikaros-FE`):**
- `src/app/router.tsx` — celý (requireAuth loader, memberOnly, route order X-02, catch-all `:slug` poslední, `*`→NotFound, errorElement na obou layoutech, Suspense wrapper `p()`)
- `src/app/main.tsx` — celý (GlobalErrorBoundary pozice nad RouterProvider, QueryClient, Toaster, monitoring init)
- `src/shared/api/client.ts` — celý (interceptory, refresh flow, parseApiError/Code, backend-unavailable práh)
- `src/features/chat/api/socket.ts` — celý (SocketManager singleton, auth, reconnectSocket)
- `src/features/chat/api/useSocket.ts` — celý (useSocketInit/Reconnect/Event lifecycle)
- `src/features/auth/api/useAuth.ts` — celý (useLogin/Register/Logout/Bootstrap/CurrentUserHydration)
- `src/features/auth/components/AuthBootstrap.tsx`, `src/shared/store/authStore.ts`, `src/features/chat/store/anonSession.ts`
- `src/features/admin/components/{RoleGuard,WorldMembershipGuard}.tsx`
- `src/app/layout/{IkarosLayout,WorldLayout}` — socket init, isPJ (N-16), header logged-in switch, isAuthenticated gating
- `src/pages/errors/{ErrorPage,NotFoundPage,ForbiddenPage}.tsx`, `src/shared/ui/GlobalErrorBoundary.tsx`
- `src/features/world/context/WorldContext.tsx`

**Osy/M-metody:** A (X-01..07 M1), B (X-10..14 M1+M4), C (X-20..24 M1), D (X-30..33 M1+M5), E (X-40..46 baseline).

## Dosažená L vs cílová L
Cílová **L3**; dosaženo **L2** (obě strany přečteny, kontrakt/identita/role sledovány) pro A/B/C/D. E baseline: FE tsc/eslint **0 errors** (15 react-refresh warningů, non-blocking — X-41 ✅; N-45 linkify **opraveno**), BE dle registru zelené.
X-07 mechanicky ověřen: všech ~90 lazy importů má default export (3 barrely přes `export { X as default }`).

## Verifikované jako OPRAVENÉ od minula (neopakuji jako nové)
- **SEC-01** (`room:join` `user:` prefix bez gate) → **FIX-1** `app.gateway.ts:48-53` (gate `room !== user:${userId}`). ✅
- **JWT role staleness** (REST) → `jwt-auth.guard.ts:69` + `optional-jwt-auth.guard.ts:40` čtou roli čerstvě z DB. ✅
- **Redis výpadek shodí instanci** → `socket-io.adapter.ts:100-105` pub+sub `.on('error')`. ✅
- **N-16** isPJ zahrnuje PomocnyPJ+ → `WorldLayout.tsx:366-372`. ✅
- **N-45** eslint linkify → FE lint 0 errors. ✅

## Nálezy

### N-RUN-CC-01 — [B/C] Vynucený logout (interceptor) nechává stálou identitu + drafty + RQ cache + lastRoute · 🟡 🆕
**Kde:** `src/shared/api/client.ts:43-51` (`logoutAndRedirectToLogin`) vs `src/features/auth/api/useAuth.ts:129-157` (`useLogout`).
**Problém:** `logoutAndRedirectToLogin()` (volaný z interceptoru pro **BANNED** `:78`, **DELETED/DELETION_PENDING** `:86-92` a **session-expiry po selhání refreshe** `:110-115`) čistí JEN `accessTokenAtom` + `refreshTokenAtom`. Naproti tomu manuální `useLogout` navíc čistí `currentUserAtom` (`:139`), `qc.clear()` (`:142`, C-29), `clearAllComposerSticky()`+`clearAllDraftAttachments()` (`:146-147`, FIX-3) a `clearLastRoute()` (`:149`). Vynucená cesta nic z toho nedělá → v localStorage zůstane `ikaros.user` (username/avatar/bio/email/themeId), composer drafty (NPC maska, RP datum, text, přílohy), `lastRoute` a in-memory RQ cache.
**Navíc:** `useLogin`/`useRegister` onSuccess (`useAuth.ts:44-62,98-117`) dělají `qc.clear()`, ale composer drafty ani lastRoute **NEčistí** → po vynuceném odhlášení (ban/expirace) uživatele A se do relace nově přihlášeného B na stejném zařízení **prolijí composer drafty A** (přesně scénář, který FIX-3 hlídá jen na manuální cestě).
**Dopad:** Header se skryje správně (switch na `isAuthenticated` = token null, `IkarosLayout.tsx:953`), takže vizuálně neviditelné; ale na **sdíleném zařízení** po ban/expiraci zůstávají A-ova profilová data + rozpracované zprávy/přílohy čitelné z localStorage a bleednou do B po přihlášení. Privacy/data-hygiena, ne funkční blok.
**Návrh:** Vytáhnout úklidovou rutinu (currentUser + qc.clear + composer sticky/drafts + lastRoute) do sdíleného helperu a volat ji i v `logoutAndRedirectToLogin`; ideálně composer/lastRoute čistit i v `useLogin` onSuccess (account switch bez předchozího odhlášení).
**L2 · 🆕 nový** (v registru ani předchozích cross-cutting checkpointech nezaznamenáno).

### N-RUN-CC-02 — [A] `RoleGuard` bez loading stavu → možný flash ForbiddenPage · 🟢 🆕
**Kde:** `src/features/admin/components/RoleGuard.tsx:12-15`.
**Problém:** `RoleGuard` rozhoduje jen z `currentUserAtom`; když je `user` null, okamžitě renderuje `ForbiddenPage`. Nemá loading stav (na rozdíl od `WorldMembershipGuard.tsx:48`, který má `if (loading) <Spinner/>`). V běžném případě je `currentUserAtom` synchronně hydratovaný z localStorage (`atomWithStorage 'ikaros.user'`), takže flash nenastane; projeví se jen v hraničním stavu (platný `ikaros.jwt`, ale `ikaros.user` prázdný/poškozený) — pak admin krátce vidí 403 na `/admin*`, než `useCurrentUserHydration` dotáhne `/users/me` a atom se doplní (reaktivně přepne na obsah).
**Dopad:** Nízký, kosmetický, hraniční stav. Bezpečnostně OK (fail-closed).
**Návrh:** Gate na `isAuthenticated` — dokud token je a user ještě null, zobrazit Spinner místo ForbiddenPage.
**L2 · 🆕 nový** (marginální).

## Potvrzené známé (♻️ — NEhlásím jako nové, jen stav)
- **N-43** socket handshake JWT zamrzlý — `socket.ts:24-25` `auth: token ? { token } : undefined` je **statický objekt**; interceptor po refreshi (`client.ts:106`) mění `accessTokenAtom`, ale `useSocketInit` (`useSocket.ts:19-25`) na změnu tokenu jen zavolá `getSocket()`, které vrací STARÝ socket → reconnect po expiraci pošle starý token. **Stále otevřené.** (♻️ z RUN-2026-07-05, N-RUN-02 z 06-20)
- **N-44** souběžné 401 → paralelní `POST /auth/refresh` bez single-flight — `client.ts:94-116`; při rotaci refresh cookie druhý běh = reuse → `revokeFamily` = odhlášení všech zařízení. **Stále otevřené.** (♻️)
- **Access token nejde zneplatnit** (žádný tokenVersion/jti) — passwordChanged/logoutAll revokují jen refresh; WS wsAccountGate roli neobnovuje. **Detailně řešeno v `ext-35__session.md` tohoto RUNu** (F1 tokenVersion). Neduplikuji.
- **X-33** WS kontrakt (`docs/websocket-api.md`) nesedí na kód (presence:*/friend:*/world:access-*/emote:* nedokumentované). (♻️ N-RUN-01 z 06-20; `audit:ws` párování v kódu zelené, MD drift trvá.)

## Drobná pozorování (neeskaluji)
- Guest (anon, TTL 14 d) při 401 projde stejnou refresh větví `client.ts:94` → `POST /auth/refresh` bez cookie selže → toast „Přihlášení vypršelo" + redirect z Hospody na `/?openLogin=1`. Matoucí text pro nepřihlášeného hosta; okrajové (14 d TTL). Návrh: přeskočit refresh, když je jen `anonSessionAtom` (bez `accessTokenAtom`).
- `requireAuth` (`router.tsx:148`) kontroluje jen PŘÍTOMNOST tokenu (ne expiraci) — by-design (expirovaný projde, první API 401 → refresh). OK.

## PROOF-REQUEST
1. **N-RUN-CC-01:** Na sdíleném zařízení: přihlásit A, napsat draft v chatu (composer sticky), nechat účet zabanovat (nebo vypršet access+refresh) → ověřit, že po forced-logout zůstává v localStorage `ikaros.user` + composer draft; pak přihlásit B → ověřit, zda B vidí A-ovy drafty. Nelze plně staticky (localStorage runtime).
2. **N-43/N-44:** viz PROOF-REQUEST v RUN-2026-06-20-1621 / 2026-07-05 (timing expirace + souběžné 401). Beze změny.
