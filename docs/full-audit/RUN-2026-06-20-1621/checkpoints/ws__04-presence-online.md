# ws / 04-presence-online — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: plný-audit agent.

---

## Pokrytí

Přečteny a prohledány (HEAD):

**BE:**
- `backend/src/modules/presence/presence.gateway.ts` — celý
- `backend/src/modules/presence/presence.gateway.spec.ts` — celý (7 testů)
- `backend/src/modules/presence/presence.service.ts` — celý
- `backend/src/modules/presence/presence.module.ts`
- `backend/src/modules/presence/presence.controller.ts`
- `backend/src/modules/users/interfaces/user.interface.ts` (hiddenPresence)
- `backend/src/modules/users/users.service.ts` (hiddenPresence REST flow)

**FE:**
- `src/shared/presence/usePresence.ts` — celý
- `src/shared/presence/store.ts` — celý
- `src/shared/presence/OnlineDot.tsx` — celý
- `src/shared/presence/__tests__/usePresence.spec.tsx` — celý
- `src/shared/presence/__tests__/OnlineDot.spec.tsx` — celý
- `src/features/chat/api/socket.ts` (reconnectSocket, getSocket)
- `src/features/chat/api/useSocket.ts` (useSocketInit, useSocketReconnect, useSocketEvent)
- `src/features/profile/components/PrivacySection.tsx` (hiddenPresence toggle + reconnectSocket)
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` (usePresenceInit volání)
- `src/features/chat/api/usePresenceHeartbeat.ts`

---

## Dosažená L vs cílová L

| Oblast | Cíl plánu | Dosaženo |
|--------|-----------|----------|
| A. Snapshot & update — payload parita | L2 (✅ v plánu) | L2 ✅ potvrzeno |
| B. Idle / active (multi-tab) | L2 (W-11 opraveno) | L3 ✅ (test W-11 green) |
| C. Disconnect / offline | L2 (✅ v plánu) | L2 ✅ potvrzeno |
| D. Reconnect & OnlineDot | smíšené ⚠️ | L2 + 2 nové nálezy |
| Test coverage (usePresence) | gap (plán) | L3 (testy existují) |

Celkové dosažení: **L2–L3** (statika + kontrakt + testy). L4 (round-trip) nedosažen — PROOF-REQUEST.

---

## Stav W-11 v registru

Registr (`ws-audit.md`) má nesoulad: **TL;DR říká „W-11 ✅ opraveno"**, ale individuální entry má `⬜ navrženo`.
Kód v `presence.gateway.ts:19-31` a spec `presence.gateway.spec.ts:107-136` potvrzují, že oprava (per-socket idle) **je implementována a otestována**.
→ Jde o zastaralý status v individuální entry, nikoli reálný problém.

---

## Nálezy

### W-RUN-01 — [LK/PL] `hiddenPresence` ignorován v PresenceGateway — uživatel v neviditelném módu je vidět jako online 🆕

- **Kde:** `presence.gateway.ts:37-62` (handleConnection), `users/interfaces/user.interface.ts:98` (hiddenPresence), `profile/components/PrivacySection.tsx:26-29`
- **Popis:** Uživatel si zapne „Neviditelný mód" (`hiddenPresence=true`) v profilu → FE volá `reconnectSocket()`. BE `handleConnection` znovu proběhne, ale **nikde nekontroluje `user.hiddenPresence`**. Gateway neloauje user z DB — zná jen JWT (userId z `sub`). Výsledek: uživatel je přidán do `this.sockets`, dostane `presence:snapshot` a ostatní dostanou `presence:update {status:'online'}` o něm. REST vrstva (`lastSeenAt=null`) hiddenPresence respektuje, WS vrstva ne.
- **Dopad:** Střední — deklarovaná funkce „skryj online stav" nefunguje přes WS tečku. Uživatel se sám jeví jako online i po zapnutí neviditelného módu. FE doc (`PrivacySection.tsx:60-65`) popisuje funkci jako fungující.
- **Návrh:** Gateway musí načíst `hiddenPresence` flag při `handleConnection` — buď injektovat `UsersRepository` a volat `findById`, nebo přidat `hiddenPresence` claim do JWT payloadu (rychlejší, ale vyžaduje re-login při změně → proto je `reconnectSocket()` na FE). Druhá varianta sedí lépe s reconnect-flow záměrem. Alternativně: BE emitovat `presence:update offline` ihned po disconnect, pokud `hiddenPresence=true` uživatele — pak ale nový klient nemá v snapshotu ani chybovou informaci.
- **L2** (statická analýza — BE kód jasně chybí check, FE záměr dokumentován)
- 🆕

---

### W-RUN-02 — [LC] `usePresenceInit` nevyužívá `socketStatusAtom` → po `reconnectSocket()` zůstane přítomný na starém socketu 🆕

- **Kde:** `src/shared/presence/usePresence.ts:26-94` vs `src/features/chat/api/useSocket.ts:67-89` (`useSocketEvent`)
- **Popis:** `usePresenceInit` volá `getSocket()` jednou při mountu (`useEffect([], [])`) a registruje `socket.on('presence:snapshot', ...)` na tuto instanci. `useSocketEvent` oproti tomu sleduje `socketStatusAtom` a po každé změně přeregistruje listener na aktuální socket instanci. Když `reconnectSocket()` (volaný z PrivacySection při toggle hiddenPresence) zavolá `disconnectSocket()` + `getSocket()`, vznikne **nová socket instance**. `usePresenceInit` stále drží listenery na staré (odpojené) instanci → `presence:snapshot` z nového handleConnection nikdy nedorazí do FE Map. Online tečky **zamrznou na stale stavu** i po reconnectu.
- **Dopad:** Střední — viditelný bug po každém `reconnectSocket()` volání (hiddenPresence toggle). Presence Map drží před-toggle stav navždy (do remount layoutu = page reload). Ovlivní i scénář: session timeout + re-login (token obnova) pokud prochází přes disconnectSocket.
- **Návrh:** Přidat `socketStatusAtom` do deps `useEffect` v `usePresenceInit` (vzor identický s `useSocketEvent`), nebo refaktorovat pomocí `useSocketEvent('presence:snapshot', onSnapshot)` + `useSocketEvent('presence:update', onUpdate)`. Idle tracker musí zůstat ve stejném effectu nebo získat vlastní.
- **L2** (statická analýza — architekturální drift vůči `useSocketEvent` vzoru jasně viditelný)
- 🆕

---

### W-RUN-03 — [TEST] Chybí test pro "předposlední socket disconnect = žádný offline broadcast" (PRES-09 negatívní případ) ♻️

- **Kde:** `presence.gateway.spec.ts` — 7 testů, ale žádný nepokrývá multi-tab disconnect bez offline broadcast
- **Popis:** Plánový bod PRES-09 je označen `✅L2` (staticky ověřeno: `set.size === 0` guard na řádku 72). Spec má test pro „poslední socket → offline" (řádek 96), ale **nemá test pro „předposlední socket disconnect → žádný offline"** — tu část, kde se může chyba snadno vlít: stačí odebrat guard a testy stále projdou.
- **Dopad:** Nízký — guard je přítomen v kódu, ale není pojištěn testem. Regresní riziko při future refactoru handleDisconnect.
- **Návrh:** Doplnit test: connect 2 sockety téhož usera, disconnect první → ověřit že `srv.emit('presence:update', {...offline})` NEBYLO voláno; pak disconnect druhý → ověřit offline.
- **L1** (testovací gap, kód správný)
- ♻️ (z PRES-09 ⚠️ zmíněna, nyní explicitní nález)

---

### W-RUN-04 — [LK] `presence:snapshot` posílá VŠECHNY online uživatele platformy každému klientovi bez filtrování dle `hiddenPresence` ♻️

- **Kde:** `presence.gateway.ts:48-52` (snapshot build — bere `this.sockets.keys()` bez filtru)
- **Popis:** Snapshot obsahuje userId každého uživatele s aktivním socketem. Uživatelé s `hiddenPresence=true` by neměli být v snapshotu (to je záměr funkce „Neviditelný mód"). Navíc i bez hiddenPresence: platformový seznam „kdo je online" je viditelný každému přihlášenému uživateli, bez ohledu na friendships nebo blokaci. Toto je přímý dopad W-RUN-01 (hiddenPresence v gateway chybí).
- **Dopad:** Nízký-střední. Primárně dopad přes W-RUN-01 (hiddenPresence). Ostatní aspekt (seznam online všem) je pravděpodobně by-design (viz plánový PRES-14 ⚠️ „návrhová/privacy otázka").
- **Návrh:** Fix závisí na řešení W-RUN-01. Jakmile gateway bude vědět o hiddenPresence, stačí přeskočit takového uživatele v `entries` snapshotu i v broadcast update při connect.
- **L2**
- ♻️ (z PRES-14 ⚠️, nyní konkretizováno jako dopad W-RUN-01)

---

### W-RUN-05 — [LC] `usePresenceInit` idle timer neřeší remount při `reconnectSocket()` — idle state se desynchronizuje 🆕

- **Kde:** `src/shared/presence/usePresence.ts:48-66` (idle tracker), `src/features/profile/components/PrivacySection.tsx:26-29`
- **Popis:** Po `reconnectSocket()` (PrivacySection toggle) `usePresenceInit` zůstane na starém socketu (W-RUN-02), ale idle tracker (`isIdle`, `lastActivity`, interval) dále běží v původním closure. Nový socket nezná idle stav uživatele — BE `handleConnection` přidá uživatele jako `online`. Pokud byl uživatel idle před reconnectem, nový socket ho nebude hlásit jako idle až do dalšího `tick()` cyklu (30s) nebo activity eventu.
- **Dopad:** Nízký (kosmetické — idle tečka). Symptom: po hiddenPresence toggle se uživatel na 0–30s jeví jako online i když byl idle.
- **Návrh:** Řeší se se W-RUN-02 — po přeregistraci na nový socket idle tracker musí znovu vyslat `presence:idle` pokud `isIdle === true`. Nebo: na reconnect vždy emit `presence:active` (nejjednodušší — BE re-evaluuje z nuly).
- **L1**
- 🆕

---

## Shrnutí oprav z plánové oblasti (verifikace)

| Bod | Plán říká | Stav HEAD | Poznámka |
|-----|-----------|-----------|----------|
| W-11 (multi-tab idle) | ✅ opraveno (TL;DR) / ⬜ navrženo (entry) | ✅ implementováno + test | entry zastaralá |
| PRES-01..04 (snapshot/update) | ✅L2 | ✅ potvrzeno | sedí |
| PRES-05 (idle/active round-trip) | ✅L2 | ✅ potvrzeno | sedí |
| PRES-09 (last socket offline) | ✅L2 | ✅ potvrzeno, test v spec | negativní případ untested → W-RUN-03 |
| PRES-10 (FE offline → delete z Map) | ✅L1 | ✅ potvrzeno | `next.delete(userId)` |
| PRES-11 (reconnect snapshot replace) | ✅L2 | ⚠️ částečně — funguje pro WS reconnect, ALE selže po `reconnectSocket()` → W-RUN-02 | |
| PRES-12 (OnlineDot stale po WS výpadku) | ⚠️ | ⚠️ potvrzeno — žádná FE clear Map při disconnect; WS reconnect posílá snapshot (ok), ale `reconnectSocket()` to láme | W-RUN-02 |
| PRES-13 (hiddenPresence ve snapshotu) | ⚠️ | 🔴 potvrzeno — hiddenPresence v gateway chybí | W-RUN-01 + W-RUN-04 |
| PRES-14 (snapshot privacy) | ⚠️ | ⚠️ by-design kandidát, ale dopad přes W-RUN-01 | W-RUN-04 |

---

## PROOF-REQUEST

**PR-04-1:** BE test — spustit `npx jest --testPathPattern presence.gateway --maxWorkers=2` a ověřit 7/7 zelených. Statika jasná, ale W-11 test závisí na mock.id propagaci (spec řádek 116: `{ id: 's1', data: d1 }`). Ověřit, že `idleSockets` opravdu identifikuje sockety dle `client.id`.

**PR-04-2:** FE test — spustit `vitest run --project '!storybook' src/shared/presence` a ověřit zelené (usePresence.spec.tsx + OnlineDot.spec.tsx).

**PR-04-3:** Live ověření hiddenPresence flow — zapnout neviditelný mód → ověřit v WS frame (DevTools) zda `presence:update {online}` dojde ostatním klientům. Toto je klíčový proof pro W-RUN-01 závažnost.

---

## Závažnost nálezů

| ID | Závažnost | Osa | Stav |
|----|-----------|-----|------|
| W-RUN-01 | 🟠 střední | LK/PL | 🆕 nový |
| W-RUN-02 | 🟠 střední | LC | 🆕 nový |
| W-RUN-03 | 🟡 nízká | TEST | ♻️ konkretizace PRES-09 |
| W-RUN-04 | 🟡 nízká | LK | ♻️ konkretizace PRES-14 |
| W-RUN-05 | ⚪ kosmetická | LC | 🆕 nový |
