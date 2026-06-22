# Spec 15.8 — Hospoda pro hosty (anonymní přístup do globálního chatu)

**Stav:** ✅ IMPLEMENTOVÁNO 2026-06-22 (BE+FE, pushnuto; čeká BE restart + env `ANON_SESSION_TTL`) · **Fáze:** 15 (H1 Viditelnost / komunita) · **Roadmap:** navazuje na [15.7](../../roadmap2.md) (anon homepage — „Pozvi přátele", Hospoda ponechána v anon menu) · **Souvis.:** chat 4.1 (Hospoda), 6.7/6.8 (persona/avatary), 1.4/2FA (captcha Turnstile), [project_ws_security_patterns]

**Implementace (commity):** BE `Projekt-ikaros` — A1‑A3 token/data/ban, A4‑A8 guard/scope/identita/ban/WS; FE `Projekt-ikaros-FE` — B1‑B7 anonSession/brána/host mód. Plán [docs/superpowers/plans/2026-06-22-hospoda-anon.md](../../superpowers/plans/2026-06-22-hospoda-anon.md). **Ověřeno:** BE jest (auth 86, global-chat service 47, controller 7, gateway 36, guard 5, ban 4), FE tsc‑b + vitest 4 + build. **Realizační odchylky od plánu:** (1) `UserRole.Guest = 99` sentinel (dual‑source FE+BE) — guest potřeboval hodnotu pro povinné `role`; gating ho nikdy nepustí (2. pojistka). (2) rate‑limit **in‑memory v service** per anon‑id (ne `@Throttle`, ten klíčuje per IP a omezil by i členy). (3) `GuestOrMemberGuard` volá passport přes grandparent prototyp, member gate jen pro nečlena (host nemá DB účet → `findById` by spadl). **Zbývá ops:** BE restart + `ANON_SESSION_TTL=14d` do env.

**Cíl:** Nepřihlášený návštěvník („host") může v **Hospodě** (globální chat) **číst i psát** pod dočasnou identitou `anonym{N}` — ochutná komunitu bez registrace. Akviziční nástroj navazující na 15.7. **Jen Hospoda**, ne Rozcestí.

## 0. Rozhodnutí z brainstormingu (2026-06-22)

| # | rozhodnutí | volba |
|---|---|---|
| R1 | **Rozsah** | číst **i** psát (ne jen read-only) |
| R2 | **Anti-bot bariéra** | **captcha (Turnstile) jednou** při získání host session |
| R3 | **Identita / persistence** | **dlouhodobá** (token platí týdny), **náhodné** jméno `anonym{N}`; refresh/reconnect drží stejnou identitu, dokud token žije |
| R4 | **Rozsah akcí hosta** | **jen text + čtení** — žádný upload, DM/šepot, mazání, emoty |
| R5 | **Moderace** | Admin/Superadmin smaže zprávu + **zabanuje `anon-id`** (kolekce `anon_bans`) + **rate-limit** per `anon-id`; IP ban a auto-moderace mimo první kolo |
| R6 | **Technický přístup** | **① guest token** — BE vydá guest JWT (role `guest`), jednotný auth flow HTTP i WS |

**Trade-off vědomě přijatý (R3):** dlouhodobá identita = host může v Hospodě žít týdny bez registrace (slabší tah na registraci), výměnou za **smysluplný ban** (efemérní identitu nejde zabanovat) a konzistentní konverzaci. Host pořád nemá svět/postavu/poštu → důvod registrovat se zůstává.

## 1. Flow (od kliku po zprávu)

1. Anonim klikne „Hospoda" (vlevo — viditelná i anonimovi z 15.7).
2. `/chat` veřejné (zrušen `requireAuth`). `ChatPage` rozhodne:
   - přihlášený člen → dnešní chat beze změny,
   - host s platnou session (guest token v úložišti) → rovnou chat (host mód),
   - host bez session → **brána `AnonChatGate`** (captcha).
3. Captcha (Turnstile) → `POST /auth/anon-session {captchaToken}` → BE ověří captcha, vyrobí náhodné `anon-id` + jméno `anonym{N}`, vydá **guest JWT** (platnost týdny), vrátí `{ token, anonName }`.
4. FE uloží guest token (`localStorage: ikaros.anonToken`), nastaví `anonSessionAtom`.
5. `ChatRoom "hospoda"` v host módu: WS handshake s guest tokenem → `client.data.userId = anon-id`. HTTP GET historie/přítomní + POST zprávy fungují (endpointy přijmou guest token).
6. Host píše **text**. Zpráva nese `anonym{N}` + odznak „host", bez avataru. Vidí historii + přítomné. Žádný upload/DM/mazání.
7. Refresh/reconnect: token v úložišti → stejná identita, bez nové captcha (dokud token žije).
8. Přechod host → člen: po registraci/přihlášení se guest token zahodí, naskočí členský chat.

## 2. Backend

- **`POST /auth/anon-session`** (veřejný, captcha-gated) — ověří Turnstile (reuse `captcha.service`, **fail-closed**), vygeneruje `anon-id` (náhodné, např. `anon_<nanoid>`) + jméno `anonym{N}` (náhodné číslo), vydá guest JWT (`{ sub: anon-id, role: 'guest', anonName }`, expirace env `ANON_SESSION_TTL`, default ~14 d). Kontroluje `anon_bans` (zabanovaný → 403).
- **Guest-aware auth** — guard přijme guest JWT **bez DB lookupu** (host nemá `User` záznam) a postaví `RequestUser` z claims (`anon-id`, `anonName`, role guest). Hospoda endpointy (`global-chat`: `room-info`, `messages` GET/POST) přijmou **člen NEBO guest** token; bez tokenu → 401.
- **Scope guest tokenu = JEN Hospoda** — guard odmítne guest na všech ostatních endpointech (světy, profil, pošta, admin, Rozcestí) → 403.
- **Identita zprávy** — `resolveSenderIdentity`: guest → `senderName = anonName` (z claims), `senderAvatarUrl = null`, **nové pole `isAnonymous: true`** ve schématu zprávy (default false), `senderId = anon-id`. Žádný DB lookup. Člen beze změny.
- **Presence** — guest se registruje (`anon-id` + jméno + `isAnonymous`); dnešní `if (!userId) return` projde (`userId` = `anon-id`).
- **Moderace** — kolekce **`anon_bans`** (`anon-id`, kdy, kým); Admin `DELETE` zprávy (existuje) + nový ban endpoint; zabanovaný `anon-id` → 403 při psaní i při vydání session. **Rate-limit per `anon-id`** (Throttler, X zpráv/min).
- **WS** — guest token v handshake → `client.data.userId = anon-id`, `role = guest`. Stejná cesta jako člen (identita z ověřeného tokenu — drží [project_ws_security_patterns]).

## 3. Frontend

- **`/chat` veřejné** — `router.tsx` zrušit `requireAuth` na Hospodě; **Rozcestí zůstávají login-only**.
- **`anonSessionAtom`** — guest token + `anonym{N}`, **oddělený od `currentUserAtom`** (členský flow netknutý). Token v `localStorage: ikaros.anonToken`.
- **`AnonChatGate`** — anonim bez session vidí uvítání „Vstup do Hospody jako host" + Turnstile + tlačítko; po ověření získá guest token a vejde. S platnou session se brána přeskočí.
- **ChatRoom host mód** — reuse dnešní `ChatRoom`: identita z `anonSessionAtom`, **skryté akce** (upload/DM/mazání/emoty — jen text), zprávy i přítomní s **odznakem „host"** + `anonym{N}`, bez avataru (placeholder/odlišná barva).
- **WS + HTTP** — posílají guest token; api klient po něm sáhne, když není členský token.
- **Přechod host → člen** — po registraci/přihlášení guest token zahodit, naskočí členský chat.

## 4. Bezpečnost (7 pojistek)

1. **Scope** — guest jen Hospoda; jinde 403 i s platným tokenem.
2. **Žádná impersonace** — `senderName` z JWT claims (ne z requestu); odznak „host" + bez avataru.
3. **Stejná sanitizace** — guest zprávy přes identickou kontrolu obsahu (XSS, délka) jako členské.
4. **Captcha fail-closed** — selhání/výpadek captcha → session se NEVYDÁ (vědomě se vyhýbáme pasti captcha fail-OPEN, viz prod-config audit PC-01).
5. **Podpis tokenu** — guest JWT podepsán serverovým klíčem, role v claimu → nepadělatelný.
6. **Ban + rate-limit** — váže na `anon-id` z tokenu; zabanovaný neprojde ani s platným tokenem.
7. **Žádný leak** — guest vidí jen veřejnou Hospodu, nic členského.

## 5. Testy

- **BE:** anon-session (captcha ok / **fail-closed**) · guest guard (Hospoda ✓ / jiný endpoint 403) · send jako guest (`isAnonymous`, jméno z claims) · ban `anon-id` (403 psaní i vydání session) · rate-limit (throttle).
- **FE:** `AnonChatGate` (captcha → token) · ChatRoom host mód (skryté akce + odznak) · `anonSessionAtom` oddělený od člena · `/chat` veřejné · přechod host→člen.
- **WS:** guest connect → správná identita; bez tokenu → nelze psát/join.

## 6. Dotčené soubory (předběžně)

- **BE nové:** `auth` anon-session endpoint + service, guest guard/strategy větev, `anon_bans` schema + service, rate-limit guard pro anon.
- **BE změna:** `global-chat.controller.ts` (guard), `global-chat.service.ts` (`resolveSenderIdentity`, send + ban + rate-limit), `global-chat.gateway.ts` (presence guest), `chat.gateway.ts` (guest handshake), schema zprávy (`isAnonymous`).
- **FE nové:** `AnonChatGate`, `anonSessionAtom` + api, host-mód větve v `ChatRoom`.
- **FE změna:** `router.tsx` (`/chat`), `ChatPage`, `useGlobalChat`, api klient (guest token), `useSocket` (guest handshake).

## 7. Otevřené otázky
1. **`ANON_SESSION_TTL`** — kolik dní přesně (návrh 14)? 
2. **Rate-limit práh** — kolik zpráv/min pro hosta (návrh ~10/min)?
3. **Retention anon zpráv** — mazat staré anon zprávy z historie po čase, nebo nechat? (návrh: mimo první kolo)
4. **Jméno `anonym{N}`** — rozsah čísla (návrh 1000–9999, ať nekoliduje a je krátké).
5. **Ban UI** — kde Admin banuje `anon-id` (kontextové menu zprávy v Hospodě)? Detail v plánu.
