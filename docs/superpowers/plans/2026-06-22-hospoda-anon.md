# Hospoda pro hosty (anon chat) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nepřihlášený „host" může číst i psát do globálního chatu Hospoda pod dočasnou identitou `anonym{N}`, zajištěnou guest JWT tokenem (captcha brána, ban + rate-limit).

**Architecture:** BE vydá po captcha **guest JWT** (claim `guest: true`, bez DB účtu). Nový guard přijme guest token bez DB lookupu a jen pro Hospodu; member tokeny jedou dnešní cestou. FE drží guest token v odděleném atomu, ukáže captcha bránu a v ChatRoomu zapne „host mód" (skryté akce + odznak). Spec: [spec-15.8-hospoda-anon.md](../../arch/phase-15/spec-15.8-hospoda-anon.md).

**Tech Stack:** BE NestJS + Mongoose + Passport JWT + @nestjs/throttler + Turnstile; FE React/TS + jotai + TanStack Query + socket.io-client + @marsidev/react-turnstile.

## Global Constraints

- **BE a FE NIKDY nemíchat v jedné commit/build dávce** (memory feedback_no_mixed_be_fe_batch) — Fáze A (BE) celá, pak Fáze B (FE).
- **Guest token scope = JEN Hospoda** — guest na jakémkoli jiném endpointu → 403.
- **Captcha fail-closed** — selhání/výpadek ověření → session se NEVYDÁ (žádný open fallback).
- **Nové pole zprávy = `isAnonymous`** (ne `isGuest`).
- **Konstanty:** `ANON_SESSION_TTL` = `14d` (env, default 14 d) · rate-limit **10 zpráv/min** · jméno `anonym` + náhodné číslo **1000–9999**.
- **BE testy:** `npx jest --maxWorkers=2` (memory: plný paralelní jest flaky). BE precommit = typecheck + lint (NE testy → pusť jest ručně).
- **FE testy:** vitest **v batchi** (single-file běh = „failed to find current suite"), explicitní importy (bez globals), `fireEvent` (ne user-event). FE formátovat **eslint --fix** (NIKDY prettier).
- **Po BE změně restart** (nest --watch nedrží whitelist ValidationPipe).
- **Identita z ověřeného tokenu** (`client.data.userId`), nikdy z payloadu (anti-spoofing).

---

# FÁZE A — BACKEND (`C:\Matrix\ProjektIkaros\Projekt-ikaros\backend`)

### Task A1: `isAnonymous` pole zprávy + `RequestUser.isGuest`

**Files:**
- Modify: `backend/src/modules/chat/schemas/chat-message.schema.ts` (+1 prop)
- Modify: `backend/src/common/interfaces/request-user.interface.ts` (+1 pole)
- Modify: `backend/src/modules/chat/interfaces/chat-message.interface.ts` (pokud existuje doménový typ — přidej `isAnonymous`)

**Interfaces:**
- Produces: `ChatMessage.isAnonymous: boolean` (default false); `RequestUser.isGuest?: boolean`.

- [ ] **Step 1:** Do `chat-message.schema.ts` přidej za `isSystem`:
```typescript
@Prop({ default: false }) isAnonymous: boolean;
```
- [ ] **Step 2:** Do doménového `ChatMessage` typu přidej `isAnonymous: boolean;` (a kde se message mapuje na entitu, default `false`).
- [ ] **Step 3:** Do `RequestUser` přidej volitelné pole:
```typescript
/** Host (anonym) bez DB účtu — guest JWT. Scope = jen Hospoda. */
isGuest?: boolean;
```
- [ ] **Step 4:** Build typů: `npm run typecheck` → Expected: PASS.
- [ ] **Step 5:** Commit: `git add -A && git commit -m "feat(chat): isAnonymous pole zprávy + RequestUser.isGuest (15.8 A1)"`

---

### Task A2: `anon_bans` schema + repository + service

**Files:**
- Create: `backend/src/modules/global-chat/schemas/anon-ban.schema.ts`
- Create: `backend/src/modules/global-chat/anon-ban.service.ts`
- Create: `backend/src/modules/global-chat/anon-ban.service.spec.ts`
- Modify: `backend/src/modules/global-chat/global-chat.module.ts` (registrace schématu + service)

**Interfaces:**
- Produces: `AnonBanService.isBanned(anonId: string): Promise<boolean>` · `ban(anonId, byUserId): Promise<void>` · `unban(anonId): Promise<void>`.

- [ ] **Step 1: Test** `anon-ban.service.spec.ts`:
```typescript
describe('AnonBanService', () => {
  it('isBanned vrací false když záznam není', async () => {
    repo.findOne.mockResolvedValue(null);
    expect(await service.isBanned('anon_x')).toBe(false);
  });
  it('isBanned vrací true po ban()', async () => {
    repo.findOne.mockResolvedValue({ anonId: 'anon_x' });
    expect(await service.isBanned('anon_x')).toBe(true);
  });
  it('ban() uloží anonId + bannedBy', async () => {
    await service.ban('anon_x', 'admin1');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ anonId: 'anon_x', bannedBy: 'admin1' }),
    );
  });
});
```
- [ ] **Step 2:** Run `npx jest anon-ban.service --maxWorkers=2` → FAIL (service neexistuje).
- [ ] **Step 3:** Schema: `anonId: string` (index, unique), `bannedBy: string`, `createdAt`. Service: `isBanned` = `!!await model.findOne({ anonId })`, `ban` = `model.create({ anonId, bannedBy })` (idempotent přes upsert), `unban` = `deleteOne`.
- [ ] **Step 4:** Run `npx jest anon-ban.service --maxWorkers=2` → PASS.
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): anon_bans schema + AnonBanService (15.8 A2)"`

---

### Task A3: `POST /auth/anon-session` (captcha → guest JWT)

**Files:**
- Modify: `backend/src/modules/auth/auth.controller.ts` (+endpoint)
- Modify: `backend/src/modules/auth/auth.service.ts` (+`createAnonSession`)
- Create: `backend/src/modules/auth/dto/anon-session.dto.ts`
- Modify: `backend/src/modules/auth/auth.service.spec.ts` (+testy)
- Modify: `backend/src/app.module.ts` nebo `auth.module.ts` — DI `AnonBanService` do auth (import GlobalChatModule export, NEBO sdílet přes forwardRef; preferuj export AnonBanService z global-chat module a import do auth module)

**Interfaces:**
- Consumes: `captchaService.verify(token): Promise<boolean>` (A: existuje), `AnonBanService.isBanned` (A2).
- Produces: `AuthService.createAnonSession(captchaToken: string): Promise<{ token: string; anonName: string; anonId: string }>`; endpoint `POST /auth/anon-session` body `{ captchaToken }`.

- [ ] **Step 1: Test** v `auth.service.spec.ts`:
```typescript
describe('createAnonSession', () => {
  it('captcha selže → BadRequest (fail-closed)', async () => {
    captcha.verify.mockResolvedValue(false);
    await expect(service.createAnonSession('bad')).rejects.toThrow(BadRequestException);
  });
  it('captcha OK → vydá guest JWT s guest:true + anonName', async () => {
    captcha.verify.mockResolvedValue(true);
    anonBan.isBanned.mockResolvedValue(false);
    jwt.sign.mockReturnValue('signed.jwt');
    const res = await service.createAnonSession('ok');
    expect(res.anonName).toMatch(/^anonym\d{4}$/);
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: res.anonId, guest: true, username: res.anonName }),
      expect.objectContaining({ expiresIn: expect.any(String) }),
    );
  });
});
```
- [ ] **Step 2:** Run `npx jest auth.service --maxWorkers=2` → FAIL.
- [ ] **Step 3:** Implementace `createAnonSession`:
  - `if (!await this.captchaService.verify(captchaToken)) throw new BadRequestException({ code: 'CAPTCHA_FAILED' });`
  - `anonId = 'anon_' + randomUUID()`, `anonName = 'anonym' + (1000 + randomInt(0, 9000))`.
  - (ban check: anonId je nově generované → nemůže být banned; ban se kontroluje při psaní, A6. Přeskoč zde.)
  - `token = this.jwtService.sign({ sub: anonId, guest: true, username: anonName }, { expiresIn: this.config.get('ANON_SESSION_TTL') ?? '14d' });`
  - return `{ token, anonName, anonId }`.
- [ ] **Step 4:** Controller (DTO `AnonSessionDto { @IsString() captchaToken }`), `@Throttle({ default: { limit: 5, ttl: 60000 }})` (anti-bot na vydání session):
```typescript
@Post('anon-session')
@Throttle({ default: { limit: 5, ttl: 60000 } })
createAnonSession(@Body() dto: AnonSessionDto) {
  return this.authService.createAnonSession(dto.captchaToken);
}
```
- [ ] **Step 5:** Run `npx jest auth.service --maxWorkers=2` → PASS. Commit: `git commit -am "feat(auth): POST /auth/anon-session guest JWT (15.8 A3)"`

---

### Task A4: Guest-aware guard + JwtStrategy guest větev

**Files:**
- Create: `backend/src/common/guards/guest-or-member.guard.ts`
- Modify: `backend/src/modules/auth/strategies/jwt.strategy.ts` (guest claim → RequestUser)
- Create: `backend/src/common/guards/guest-or-member.guard.spec.ts`

**Interfaces:**
- Produces: `GuestOrMemberGuard` — pustí member (přes JwtAuthGuard DB lookup) i guest (z claims, bez DB); naplní `req.user` (`RequestUser` s `isGuest`).

- [ ] **Step 1:** `jwt.strategy.ts` `validate()` rozšiř:
```typescript
validate(payload: Record<string, unknown>) {
  if (payload.guest === true) {
    return { id: payload.sub, username: payload.username, isGuest: true } as RequestUser;
  }
  return { id: payload.sub, email: payload.email, username: payload.username, role: payload.role, characterPath: payload.characterPath };
}
```
- [ ] **Step 2: Test** `guest-or-member.guard.spec.ts`:
```typescript
it('guest token → projde bez DB lookupu, req.user.isGuest = true', async () => {
  const ctx = mockCtx({ user: { id: 'anon_1', username: 'anonym1234', isGuest: true } });
  expect(await guard.canActivate(ctx)).toBe(true);
  expect(usersRepo.findById).not.toHaveBeenCalled();
});
it('member token → projde přes DB lookup (deleted check)', async () => {
  usersRepo.findById.mockResolvedValue({ id: 'u1', isDeleted: false });
  const ctx = mockCtx({ user: { id: 'u1', role: 5, username: 'gandalf' } });
  expect(await guard.canActivate(ctx)).toBe(true);
});
```
- [ ] **Step 3:** Run `npx jest guest-or-member.guard --maxWorkers=2` → FAIL.
- [ ] **Step 4:** Implementace: rozšiř `AuthGuard('jwt')`; po `super.canActivate`: pokud `req.user.isGuest` → vrať true (žádný DB lookup); jinak proveď stávající member kontrolu z `JwtAuthGuard` (deleted/banned/elevation) — extrahuj sdílenou logiku, NEDUPLIKUJ ji slepě (importuj/reuse z `JwtAuthGuard` helperu).
- [ ] **Step 5:** Run → PASS. Commit: `git commit -am "feat(auth): GuestOrMemberGuard + guest JWT strategy (15.8 A4)"`

---

### Task A5: global-chat.controller — guard + guest psaní/čtení

**Files:**
- Modify: `backend/src/modules/global-chat/global-chat.controller.ts`

**Interfaces:**
- Consumes: `GuestOrMemberGuard` (A4).

- [ ] **Step 1:** Na controlleru zaměň `@UseGuards(JwtAuthGuard)` → `@UseGuards(GuestOrMemberGuard)` JEN pro Hospodu-relevantní endpointy (`room-info`, `messages` GET, `messages` POST). Upload/delete/environment **nechej `JwtAuthGuard`/`AdminGuard`** (guest nesmí).
- [ ] **Step 2:** V `getRoomInfo`/`getMessages`/`sendMessage` přidej guard na úrovni handleru: `if (room !== 'hospoda' && user.isGuest) throw new ForbiddenException()` — guest jen Hospoda (Rozcestí čte/píše jen member).
- [ ] **Step 3: Test** (controller spec nebo e2e): guest na `GET /global-chat/messages?room=rozcesti-1` → 403; guest na `?room=hospoda` → 200.
- [ ] **Step 4:** Run `npx jest global-chat.controller --maxWorkers=2` → PASS.
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): Hospoda endpointy guest-aware, Rozcestí 403 pro guest (15.8 A5)"`

---

### Task A6: service — guest identita + isAnonymous + ban + rate-limit

**Files:**
- Modify: `backend/src/modules/global-chat/global-chat.service.ts` (`resolveSenderIdentity`, `sendMessage`)
- Modify: `backend/src/modules/global-chat/global-chat.service.spec.ts`
- Modify: `backend/src/modules/global-chat/global-chat.controller.ts` (`@Throttle` na send)

**Interfaces:**
- Consumes: `AnonBanService.isBanned` (A2), `RequestUser.isGuest` (A1).

- [ ] **Step 1: Test** v `global-chat.service.spec.ts`:
```typescript
it('guest → senderName=anonName, isAnonymous=true, žádný DB lookup', async () => {
  messageRepo.save.mockResolvedValue(makeMsg());
  await service.sendMessage('hospoda', { content: 'ahoj' }, { id: 'anon_1', username: 'anonym1234', isGuest: true });
  const call = messageRepo.save.mock.calls[0][0];
  expect(call.senderName).toBe('anonym1234');
  expect(call.isAnonymous).toBe(true);
  expect(call.senderAvatarUrl).toBeUndefined();
  expect(usersService.findById).not.toHaveBeenCalled();
});
it('zabanovaný guest → ForbiddenException', async () => {
  anonBan.isBanned.mockResolvedValue(true);
  await expect(service.sendMessage('hospoda', { content: 'x' }, { id: 'anon_b', username: 'anonym1', isGuest: true }))
    .rejects.toThrow(ForbiddenException);
});
```
- [ ] **Step 2:** Run `npx jest global-chat.service --maxWorkers=2` → FAIL.
- [ ] **Step 3:** `resolveSenderIdentity`: na začátku `if (user?.isGuest) return { senderName: user.username, senderAvatarUrl: undefined };` (přidej param `isGuest` nebo předej user). `sendMessage`: na začátku `if (user.isGuest && await this.anonBan.isBanned(user.id)) throw new ForbiddenException({ code: 'ANON_BANNED' });`; do `messageRepo.save` přidej `isAnonymous: user.isGuest ?? false`.
- [ ] **Step 4:** Controller `sendMessage` dostane `@Throttle({ default: { limit: 10, ttl: 60000 } })` (10/min). Run `npx jest global-chat --maxWorkers=2` → PASS.
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): guest identita + isAnonymous + ban check + rate-limit (15.8 A6)"`

---

### Task A7: WS gateway — guest handshake + presence

**Files:**
- Modify: `backend/src/modules/chat/chat.gateway.ts` (handshake guest)
- Modify: `backend/src/modules/global-chat/global-chat.gateway.ts` (presence guest bez profilu)

**Interfaces:**
- Consumes: guest JWT (A3).

- [ ] **Step 1:** `chat.gateway.ts handleConnection`: po `jwtService.verify` token už nese `guest:true` — `client.data.userId = payload.sub` funguje beze změny (sub = anonId). Přidej `client.data.isGuest = payload.guest === true`.
- [ ] **Step 2:** `global-chat.gateway.ts registerPresence`: profil dotahuj jen pokud **není** guest: `if (isNew && !client.data.isGuest) { …findById… }`. Pro guesta `avatarUrl/characterName` zůstanou undefined, `username` = anonName z join payloadu — ale **přepiš z client.data**, NE z payloadu (anti-spoof): username ber z ověřeného tokenu, ne z `payload.username`. Pro to potřebuješ anonName v `client.data` (ulož ho v handleConnection z `payload.username`).
- [ ] **Step 3: Test** (gateway spec): guest socket join hospoda → presence záznam má `userId=anonId`, `avatarUrl=undefined`, žádný `usersService.findById`.
- [ ] **Step 4:** Run `npx jest global-chat.gateway --maxWorkers=2` → PASS.
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): WS guest handshake + presence bez profilu (15.8 A7)"`

---

### Task A8: Admin ban endpoint

**Files:**
- Modify: `backend/src/modules/global-chat/global-chat.controller.ts` (+`POST anon-ban`)

**Interfaces:**
- Consumes: `AnonBanService.ban` (A2).

- [ ] **Step 1: Test:** `POST /global-chat/anon-ban` jako Hrac → 403; jako Admin → zavolá `anonBan.ban(anonId, admin.id)`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Endpoint:
```typescript
@Post('anon-ban')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Superadmin)
banAnon(@Body() dto: { anonId: string }, @CurrentUser() user: RequestUser) {
  return this.anonBanService.ban(dto.anonId, user.id);
}
```
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): Admin ban anon-id endpoint (15.8 A8)"`

**🔁 Po Fázi A:** `npx jest --maxWorkers=2` (celá suite zelená) + `npm run typecheck` + `npm run lint:check`. **BE restart.** Env: doplnit `ANON_SESSION_TTL=14d` do `.env` + prod vars.

---

# FÁZE B — FRONTEND (`c:\Matrix\ProjektIkaros\Projekt-ikaros-FE`)

### Task B1: `anonSessionAtom` + guest token v api klientu

**Files:**
- Create: `src/features/chat/store/anonSession.ts`
- Modify: `src/shared/api/client.ts` (interceptor: fallback guest token)
- Create: `src/features/chat/store/anonSession.spec.ts`

**Interfaces:**
- Produces: `anonSessionAtom` (`{ token, anonName, anonId } | null`, `atomWithStorage('ikaros.anonToken')`), `anonNameAtom` (derived).

- [ ] **Step 1:** `anonSession.ts`:
```typescript
export interface AnonSession { token: string; anonName: string; anonId: string; }
export const anonSessionAtom = atomWithStorage<AnonSession | null>('ikaros.anonToken', null);
export const anonNameAtom = atom((get) => get(anonSessionAtom)?.anonName ?? null);
```
- [ ] **Step 2:** `client.ts` request interceptor — když NENÍ member token, použij guest token:
```typescript
const token = store.get(accessTokenAtom) ?? store.get(anonSessionAtom)?.token;
if (token) config.headers.Authorization = `Bearer ${token}`;
```
⚠️ Member token má přednost (přihlášený nikdy neposílá guest token).
- [ ] **Step 3: Test:** atom default null; po set drží session; `anonNameAtom` derivuje jméno.
- [ ] **Step 4:** Run vitest batch (s B2/B3 testy) → PASS. (samostatně možný „no suite" bug — pouštěj ve skupině)
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): anonSessionAtom + guest token v api klientu (15.8 B1)"`

---

### Task B2: `useAnonSession` hook (získání guest tokenu)

**Files:**
- Create: `src/features/chat/api/useAnonSession.ts`
- Create: `src/features/chat/api/useAnonSession.spec.tsx`

**Interfaces:**
- Consumes: `POST /auth/anon-session` (A3), `anonSessionAtom` (B1).
- Produces: `useAnonSession()` → `{ startSession(captchaToken): Promise<void>, isPending }` (uloží session do atomu).

- [ ] **Step 1: Test:** `startSession('tok')` → `api.post('/auth/anon-session', { captchaToken: 'tok' })` → uloží `{token,anonName,anonId}` do atomu.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** `useMutation` na `api.post<AnonSession>('/auth/anon-session', { captchaToken })`, `onSuccess` → `setAnonSession(data)`.
- [ ] **Step 4:** Run batch → PASS.
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): useAnonSession hook (15.8 B2)"`

---

### Task B3: `AnonChatGate` (captcha brána)

**Files:**
- Create: `src/features/chat/components/AnonChatGate.tsx` + `.module.css`
- Create: `src/features/chat/components/AnonChatGate.spec.tsx`

**Interfaces:**
- Consumes: `useAnonSession` (B2), Turnstile (vzor `RegisterModal`).
- Produces: `<AnonChatGate />` — captcha → po ověření zavolá `startSession` → po úspěchu se brána odmountuje (rodič ukáže chat).

- [ ] **Step 1: Test:** render → vidí Turnstile + tlačítko „Vstoupit jako host" (disabled bez captcha tokenu); po `onSuccess` captcha + klik → zavolá `startSession`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Komponenta dle vzoru `RegisterModal` Turnstile (`VITE_TURNSTILE_SITE_KEY`), `captchaToken` state, tlačítko disabled dokud není token, onClick → `startSession(captchaToken)`.
- [ ] **Step 4:** Run batch → PASS. `mobil-desktop` (nová UI).
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): AnonChatGate captcha brána (15.8 B3)"`

---

### Task B4: socket handshake guest token

**Files:**
- Modify: `src/features/chat/api/socket.ts`

- [ ] **Step 1:** `getSocket()` — `auth` token fallback na guest:
```typescript
const token = store.get(accessTokenAtom) ?? store.get(anonSessionAtom)?.token ?? undefined;
socket = io(baseUrl, { auth: token ? { token } : undefined, ... });
```
- [ ] **Step 2:** `useSocketInit` — připoj socket i když je guest session (ne jen member token). Uprav podmínku z `!!accessToken` na `!!accessToken || !!anonSession`.
- [ ] **Step 3: Test:** s guest session se socket vytvoří s guest tokenem v auth.
- [ ] **Step 4:** Run batch → PASS.
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): WS handshake guest token (15.8 B4)"`

---

### Task B5: `/chat` veřejné + ChatPage anon routing

**Files:**
- Modify: `src/app/router.tsx` (řádek 167 — zrušit loader na `/chat`)
- Modify: `src/features/chat/pages/ChatPage.tsx`

- [ ] **Step 1:** `router.tsx`: `{ path: 'chat', element: p(ChatPage) }` (BEZ `loader: requireAuth`). Rozcestí (`chat/rozcesti*`) **nech `requireAuth`**.
- [ ] **Step 2:** `ChatPage`: 
```tsx
const isAuth = useAtomValue(isAuthenticatedAtom);
const anon = useAtomValue(anonSessionAtom);
if (!isAuth && !anon) return <AnonChatGate />;
return <ChatRoom room="hospoda" roomName="Interdimenzionální hospoda" icon={<Beer size={18} />} />;
```
- [ ] **Step 3: Test:** `ChatPage` bez auth a bez session → `AnonChatGate`; se session → `ChatRoom`.
- [ ] **Step 4:** Run batch → PASS.
- [ ] **Step 5:** Commit: `git commit -am "feat(chat): /chat veřejné + ChatPage anon brána (15.8 B5)"`

---

### Task B6: ChatRoom host mód (identita + skryté akce + odznak)

**Files:**
- Modify: `src/features/chat/components/ChatRoom.tsx`
- Modify: `src/features/chat/components/ChatInput.tsx` (skrýt upload pro guesta)
- Modify: `src/features/chat/components/MessageItem.tsx` (odznak „host")

**Interfaces:**
- Consumes: `anonSessionAtom` (B1).

- [ ] **Step 1:** `ChatRoom`: identita — když není member `user`, použij guest:
```typescript
const member = useAtomValue(currentUserAtom);
const anon = useAtomValue(anonSessionAtom);
const isGuest = !member && !!anon;
const identity = member ?? (anon ? { id: anon.anonId, username: anon.anonName } : null);
```
Předej `isGuest` do `ChatInput` (skryj upload, šepot) a do `MessageItem` přes `usersById`/flag.
- [ ] **Step 2:** `ChatInput`: `{!isGuest && <upload/whisper>}` — guest má jen textový input + odeslat.
- [ ] **Step 3:** `MessageItem`: když `message.isAnonymous` → vedle jména `<Badge variant="default">host</Badge>` + bez avataru (placeholder). Odlišná barva jména.
- [ ] **Step 4: Test:** host mód skryje upload/šepot; zpráva s `isAnonymous` ukáže odznak „host".
- [ ] **Step 5:** Run batch → PASS. `mobil-desktop`. Commit: `git commit -am "feat(chat): ChatRoom host mód + odznak host (15.8 B6)"`

---

### Task B7: přechod host → člen + úklid

**Files:**
- Modify: `src/features/auth/api/useAuth.ts` (po login/register zahodit guest session)

- [ ] **Step 1:** Po úspěšném login/register: `store.set(anonSessionAtom, null)` (guest token zahodit, naskočí member chat).
- [ ] **Step 2: Test:** po login se `anonSessionAtom` vynuluje.
- [ ] **Step 3:** Run batch → PASS.
- [ ] **Step 4:** Commit: `git commit -am "feat(chat): host→člen zahodí guest session (15.8 B7)"`

**🔁 Po Fázi B:** `npx eslint --fix` dotčené · `npx tsc -b` · vitest batch dotčených · `npm run build`. `mobil-desktop` · `funkce` (kap. 05 komunikace) · `napoveda` (host mód). **Aktualizovat `docs/funkce/05-*` + roadmapu** (Hospoda-anon ✅).

---

## Self-review (provedeno)
- **Spec coverage:** R1 (číst+psát) → A5/A6/B5/B6 · R2 (captcha) → A3/B3 · R3 (identita 14d) → A3 · R4 (jen text) → A5/B6 · R5 (ban+rate-limit) → A2/A6/A8 · R6 (guest token) → A3/A4. 7 bezpečnostních pojistek → A4 (scope), A6 (sanitizace reuse), A3 (fail-closed), A8 (ban). ✓
- **Typy:** `RequestUser.isGuest`, `AnonSession`, `isAnonymous` konzistentní napříč tasky. ✓
- **Pořadí:** A1→A8 (BE) plně před B1→B7 (FE); FE B2 konzumuje endpoint z A3. ✓
