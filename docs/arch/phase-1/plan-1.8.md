# Plán 1.8 — Přátelé (Friendships)

**Stav:** návrh, čeká schválení
**Datum:** 2026-05-13
**Spec:** [`spec-1.8.md`](./spec-1.8.md) ✅ Q1–Q5 schváleno
**Design audit:** zaprotokolováno v komentáři skill `frontend-design` (2026-05-13), klíčové výstupy promítnuté do §6 (UI) tohoto plánu

---

## 0. Předpoklady a vstupy

- **Existující infra (1.4):** `PendingActionsService`, `IPendingActionProvider` interface, `PendingActionType.FriendRequest` enum, `PENDING_ACTION_RENDERERS` registry, `PendingActionCard` 3-sloupový shell. Rozšiřujeme, neměníme.
- **Existující infra (1.5):** `PresenceGateway` pattern (JWT v handshake, in-memory userId→sockets map). Replikujeme pro friendships.
- **Existující infra (1.3c):** tombstone semantika (`isDeleted`, `deletionRequestedAt`), `<UserAvatar deleted />` overlay.
- **Audit zjištění:** `AdminUserKebabMenu` v admin code neexistuje (admin akce jsou inline buttons v `UsersTable`). Q1=B se zužuje na „nové primitivy bez refactoru admin code".

## 1. Cíle plánu

1. BE modul `friendships` od nuly (schema, repo, service, gateway, controller, provider, testy)
2. FE feature `friendships` od nuly (api hooks, komponenty, socket integration, testy)
3. Refactor `ZpracovatTab` na agregátor přes všechny registered `PendingActionType` (Q3)
4. Nové sdílené primitivy `<ConfirmDialog>` + `<KebabMenu>` v `shared/ui` (Q1)
5. Dynamické `PublicProfileActions` s 5 stavy + `cooldown` schování (Q2)
6. Naplnění `FriendsTab` (sekce přátel + collapsible odeslané žádosti + empty state CTA)
7. Per-pair cool-down 24h po declined (Q4 = spec)

Mimo rozsah: viz spec §8.

## 2. Implementační pořadí (BE-first vertical)

Pořadí přesně odpovídá Q4. Každá fáze končí přípravou na review, žádná fáze nepokračuje bez zelených testů.

```
Fáze A (BE foundation)    → schema + interface + repository + testy
Fáze B (BE service)       → business pravidla + cool-down + testy
Fáze C (BE provider)      → IPendingActionProvider + registrace + testy
Fáze D (BE gateway)       → socket eventy + testy
Fáze E (BE controller)    → REST endpointy + e2e
Fáze F (FE shared UI)     → ConfirmDialog + KebabMenu primitivy + storybook
Fáze G (FE api + types)   → hooks + zod schemas + types index
Fáze H (FE komponenty)    → FriendCard kebab, OutgoingRequestCard, FriendsTab, renderer
Fáze I (FE integrace)     → PublicProfileActions, ZpracovatTab refactor, socket hook
Fáze J (FE testy + ENV)   → unit + integration + manuální QA matrix
Fáze K (Cleanup + docs)   → roadmap-fe zaškrtnout, dluhy.md update, decisions.md
```

---

## 3. Fáze A — BE foundation (schema, repo)

**Cíl:** Friendship entity uložená v DB, indexed, kanonické pořadí IDs, žádná business logika.

### A.1 `friendship.interface.ts`

```ts
// backend/src/modules/friendships/interfaces/friendship.interface.ts

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Friendship {
  id: string;
  userAId: string;          // canonical: lower ObjectId.toString()
  userBId: string;          // canonical: higher ObjectId.toString()
  requestedById: string;    // who currently has open pending request
  status: FriendshipStatus;
  blockedById?: string | null;       // §spec D-055 — unused in 1.8
  lastDeclinedAt?: Date | null;      // per-pair cooldown driver
  lastDeclinedById?: string | null;  // who declined (one of A/B)
  createdAt: Date;
  acceptedAt?: Date | null;
  updatedAt: Date;
}
```

### A.2 `friendship.schema.ts`

```ts
@Schema({ collection: 'friendships', timestamps: true })
class FriendshipSchemaClass {
  @Prop({ required: true, index: true }) userAId: string;
  @Prop({ required: true, index: true }) userBId: string;
  @Prop({ required: true })               requestedById: string;
  @Prop({ required: true, enum: ['pending','accepted','declined','blocked'], default: 'pending', index: true })
  status: FriendshipStatus;
  @Prop({ type: String, default: null })  blockedById: string | null;
  @Prop({ type: Date,   default: null })  lastDeclinedAt: Date | null;
  @Prop({ type: String, default: null })  lastDeclinedById: string | null;
  @Prop({ type: Date,   default: null })  acceptedAt: Date | null;
}

// Indexes:
FriendshipSchema.index({ userAId: 1, userBId: 1 }, { unique: true, name: 'pair_unique' });
FriendshipSchema.index({ userAId: 1, status: 1 });
FriendshipSchema.index({ userBId: 1, status: 1 });
```

### A.3 `friendships-repository.interface.ts`

```ts
interface IFriendshipsRepository {
  findByPair(a: string, b: string): Promise<Friendship | null>;
  findById(id: string): Promise<Friendship | null>;
  create(data: { userAId; userBId; requestedById }): Promise<Friendship>;
  update(id: string, patch: Partial<Friendship>): Promise<Friendship | null>;
  deleteById(id: string): Promise<boolean>;
  listAcceptedForUser(userId: string, page: number, limit: number): Promise<{ items: Friendship[]; total: number }>;
  listPendingIncoming(userId: string, page: number, limit: number): Promise<{ items: Friendship[]; total: number }>;
  listPendingOutgoing(userId: string, page: number, limit: number): Promise<{ items: Friendship[]; total: number }>;
  countPendingIncoming(userId: string): Promise<number>;
}
```

### A.4 `friendships.repository.ts` (Mongo impl)

- `findByPair(a, b)` automaticky normalizuje pár přes helper `canonicalPair(a, b)` → `{ userAId, userBId }`
- `listAcceptedForUser`: `find({ $or: [{ userAId: userId }, { userBId: userId }], status: 'accepted' }).sort({ acceptedAt: -1 }).skip(...).limit(...)`
- `countPendingIncoming`: `count({ $or: [{ userAId: userId }, { userBId: userId }], status: 'pending', requestedById: { $ne: userId } })`

### A.5 Helper `canonicalPair`

```ts
// backend/src/modules/friendships/utils/canonical-pair.util.ts
export function canonicalPair(a: string, b: string): { userAId: string; userBId: string } {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}
```

### A.6 Testy fáze A

- `friendships.repository.spec.ts`:
  - create → canonical order zachován
  - findByPair → najde v obou směrech args
  - unique index → duplicate insert vyhodí 11000

**Akceptace:** jest unit zelený, žádné regrese v ostatních modulech.

---

## 4. Fáze B — BE service (business logic)

**Cíl:** `FriendshipsService` s business pravidly ze spec §3.4, cool-down 24h, vrací DTO ready pro emit/response.

### B.1 ENV

`backend/src/app.module.ts` `configValidationSchema`:
```ts
FRIEND_REQUEST_COOLDOWN_HOURS: Joi.number().integer().min(0).default(24),
```

### B.2 `friendships.service.ts` — metody

| Metoda | Vrací | Vyhazuje |
|---|---|---|
| `sendRequest(fromId, toId)` | `Friendship` | 400 `SELF_FRIEND`, 404 `USER_NOT_FOUND`, 409 `ALREADY_FRIENDS`, 409 `REQUEST_EXISTS`, 429 `REJECTED_RECENTLY` |
| `accept(id, byId)` | `Friendship` | 404, 403 `NOT_RECIPIENT`/`NOT_PARTICIPANT`, 409 `NOT_PENDING` |
| `remove(id, byId)` | `{ outcome: 'canceled'|'declined'|'removed'|'cleanup'; friendship: Friendship | null }` | 404, 403 `NOT_PARTICIPANT` |
| `removeByPartner(currentId, partnerId)` | `void` | — (idempotentní, 204) |
| `listAccepted(userId, page, limit)` | `{ items: FriendListItem[]; total: number }` | — |
| `listOutgoing(userId, page, limit)` | `{ items: FriendRequestListItem[]; total: number }` | — |
| `getStatusForPair(currentId, otherId)` | `FriendshipStatusResponse` | — |

### B.3 Cool-down logika v `sendRequest`

```ts
const existing = await repo.findByPair(fromId, toId);
if (existing?.status === 'accepted') throw 409 ALREADY_FRIENDS;
if (existing?.status === 'pending')  throw 409 REQUEST_EXISTS;
if (existing?.status === 'declined') {
  const cooldownMs = COOLDOWN_HOURS * 3600_000;
  const declinedAgainstFrom = existing.lastDeclinedById !== fromId; // recipient declined fromId's attempt
  if (declinedAgainstFrom && existing.lastDeclinedAt && (Date.now() - existing.lastDeclinedAt.getTime() < cooldownMs)) {
    const retryAfter = new Date(existing.lastDeclinedAt.getTime() + cooldownMs);
    throw new HttpException({ code: 'REJECTED_RECENTLY', retryAfter: retryAfter.toISOString() }, 429);
  }
  // Recycle row:
  return repo.update(existing.id, { status: 'pending', requestedById: fromId });
}
// existing === null:
return repo.create({ ...canonicalPair(fromId, toId), requestedById: fromId });
```

### B.4 `remove` flow rozhoduje podle původního stavu

```ts
const f = await repo.findById(id);
if (!f) throw 404;
if (![f.userAId, f.userBId].includes(byId)) throw 403 NOT_PARTICIPANT;

if (f.status === 'pending') {
  if (byId === f.requestedById) {
    await repo.deleteById(id);
    return { outcome: 'canceled', friendship: f };
  } else {
    const updated = await repo.update(id, {
      status: 'declined',
      lastDeclinedAt: new Date(),
      lastDeclinedById: byId,
    });
    return { outcome: 'declined', friendship: updated };
  }
}
if (f.status === 'accepted') {
  await repo.deleteById(id);
  return { outcome: 'removed', friendship: f };
}
if (f.status === 'declined') {
  // manuální cleanup (admin/test) — silent
  await repo.deleteById(id);
  return { outcome: 'cleanup', friendship: f };
}
throw 400 INVALID_STATE; // blocked — mimo rozsah
```

### B.5 `getStatusForPair` — driver pro veřejný profil

```ts
if (current === other) return { kind: 'self' };
const f = await repo.findByPair(current, other);
if (!f) return { kind: 'none' };
if (f.status === 'accepted')  return { kind: 'accepted', friendshipId: f.id };
if (f.status === 'pending')   return f.requestedById === current
  ? { kind: 'pending_outgoing', friendshipId: f.id }
  : { kind: 'pending_incoming', friendshipId: f.id };
if (f.status === 'declined') {
  // Q2 — schované pro odmítnutého žadatele
  const declinedAgainstCurrent = f.lastDeclinedById !== current;
  if (declinedAgainstCurrent && stillInCooldown(f)) return { kind: 'cooldown' };
  return { kind: 'none' };
}
return { kind: 'none' };
```

### B.6 DTO mappers

`backend/src/modules/friendships/mappers/`:
- `toFriendListItem(f, partnerUser)` — hydratuje `friend` z `IUsersRepository.findById`
- `toFriendRequestListItem(f, counterpartUser, direction)` — direction = `incoming`/`outgoing`
- `toFriendshipDto(f)` — raw response z `sendRequest`/`accept`

User lookup pro hydrataci přes injected `IUsersRepository` (UsersModule je global).

### B.7 Testy fáze B

`friendships.service.spec.ts` (24 cases):
- sendRequest happy → pending, canonical, requestedById=from
- sendRequest self → 400
- sendRequest na tombstone → 404 (mock UsersRepo)
- sendRequest na pending-deletion → 404
- sendRequest duplicate pending same direction → 409
- sendRequest duplicate pending opposite direction → 409
- sendRequest accepted → 409
- sendRequest declined within cooldown, declined against fromId → 429 s retryAfter
- sendRequest declined within cooldown, but fromId was decliner → recycle to pending
- sendRequest declined after cooldown → recycle, lastDeclinedAt zachován
- accept happy → status=accepted, acceptedAt nastaveno
- accept by requester → 403 NOT_RECIPIENT
- accept by non-participant → 403 NOT_PARTICIPANT
- accept already accepted → 409 NOT_PENDING
- remove pending by requester → outcome=canceled, row deleted
- remove pending by recipient → outcome=declined, lastDeclinedAt set, row updated
- remove accepted by either → outcome=removed
- remove declined → outcome=cleanup
- remove by non-participant → 403
- getStatusForPair: self / none / pending_outgoing / pending_incoming / accepted / cooldown / declined-after-cooldown=none
- listAccepted paginate
- listOutgoing returns direction='outgoing'

**Mock setup:** `IUsersRepository` mock pro `findById` (vrací `null` pro tombstone). Mock `Date.now` pro cooldown testy přes `jest.useFakeTimers`.

**Akceptace:** všechny 24 cases zelené.

---

## 5. Fáze C — BE provider (PendingActions integrace)

### C.1 `friend-request.provider.ts`

```ts
@Injectable()
export class FriendRequestProvider implements IPendingActionProvider, OnApplicationBootstrap {
  readonly type = PendingActionType.FriendRequest;

  constructor(
    @Inject('IFriendshipsRepository') private readonly repo: IFriendshipsRepository,
    @Inject('IUsersRepository') private readonly usersRepo: IUsersRepository,
    private readonly friendshipsService: FriendshipsService,
    private readonly pendingActions: PendingActionsService,
  ) {}

  onApplicationBootstrap() { this.pendingActions.register(this); }

  canHandle(): true { return true; } // všichni přihlášení

  async countForUser(userId: string): Promise<number> {
    return this.repo.countPendingIncoming(userId);
  }

  async listForUser(userId: string, _role, page, limit) {
    const { items, total } = await this.repo.listPendingIncoming(userId, page, limit);
    const partnerIds = items.map(f => f.requestedById);
    const partners = await this.usersRepo.findManyByIds(partnerIds);  // helper — viz C.2
    return {
      items: items.map(f => toFriendRequestListItem(f, partners.get(f.requestedById)!, 'incoming')),
      total,
    };
  }
}
```

### C.2 `IUsersRepository.findManyByIds` doplnit

Audit existing interface — pokud chybí, přidat metodu (batch lookup, výkonem důležité).

### C.3 Testy fáze C

`friend-request.provider.spec.ts` (6 cases):
- canHandle vždy true
- countForUser ignoruje outgoing
- listForUser stránkuje
- listForUser hydratuje counterpart (mock UsersRepo.findManyByIds)
- listForUser handle null partner (tombstone hard-deleted edge — vrací counterpart=tombstone shape s deleted=true)
- registrace v `onApplicationBootstrap` zavolá pendingActions.register

---

## 6. Fáze D — BE gateway (socket eventy)

### D.1 `friendships.gateway.ts`

```ts
@WebSocketGateway({ cors: ..., namespace: '/' })
export class FriendshipsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) return;
      const { sub: userId } = this.jwt.verify<{ sub: string }>(token);
      (client.data as { userId: string }).userId = userId;
      this.addUserSocket(userId, client.id);
    } catch {/* invalid token — ignore */}
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId) return;
    this.removeUserSocket(userId, client.id);
  }

  // Emit helpers — volané z FriendshipsService přes EventEmitter2:
  emitToUser(userId: string, event: string, payload: unknown) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const sid of sockets) this.server.to(sid).emit(event, payload);
  }
}
```

### D.2 Komunikace service ↔ gateway přes EventEmitter2

Service vyhlašuje events:
```ts
this.eventEmitter.emit('friendship.request.incoming', { userId: toId, payload: {...} });
this.eventEmitter.emit('friendship.request.accepted', { userId: requesterId, payload: {...} });
// atd.
```

Gateway naslouchá:
```ts
@OnEvent('friendship.request.incoming')
handleIncoming({ userId, payload }: { userId: string; payload: unknown }) {
  this.emitToUser(userId, 'friend:request:incoming', payload);
}
// + accepted, declined, canceled, removed (5 total)
```

Důvod: gateway nepotřebuje injectovat service (cyklický dep), service nezná socket detaily.

### D.3 Event payloady (souladné s FE §7)

```ts
'friend:request:incoming' { friendshipId, from: { id, username, avatarUrl, defaultAvatarType, displayName, role } }
'friend:request:accepted' { friendshipId, by:   { id, username, avatarUrl, defaultAvatarType, displayName } }
'friend:request:declined' { friendshipId, by:   { id, username } }
'friend:request:canceled' { friendshipId, by:   { id, username } }
'friend:removed'          { friendshipId, by:   { id, username } }
```

### D.4 Testy fáze D

`friendships.gateway.spec.ts` (5 cases):
- handleConnection registruje socket pod userId
- handleDisconnect odregistruje
- emitToUser cílí jen na sockety daného userId, ne broadcast
- handleConnection bez tokenu → no-op
- onEvent → emitToUser pro každý z 5 eventů

---

## 7. Fáze E — BE controller (REST endpointy)

### E.1 `friendships.controller.ts`

| Method | Path | Body / Param | Throttle | Response |
|---|---|---|---|---|
| GET | `/friends` | `?page=1&limit=50` | 60/min | `{ items: FriendListItem[]; total }` |
| GET | `/friends/requests/outgoing` | `?page=1&limit=50` | 60/min | `{ items: FriendRequestListItem[]; total }` |
| GET | `/friends/status/:userId` | path param | 120/min | `FriendshipStatusResponse` |
| POST | `/friends/request` | `{ userId }` | 30/min | `201 { friendship }` |
| POST | `/friends/:id/accept` | path param | 60/min | `200 { friendship }` |
| DELETE | `/friends/:id` | path param | 60/min | `204` |
| DELETE | `/friends/by-user/:userId` | path param | 60/min | `204` |

Všechno pod `JwtAuthGuard`, `@CurrentUser()` decorator.

### E.2 DTO

`send-friend-request.dto.ts`: `{ @IsString() @IsNotEmpty() userId: string }`.

### E.3 `friendships.module.ts`

```ts
@Module({
  imports: [
    MongooseModule.forFeature([{ name: FriendshipSchemaClass.name, schema: FriendshipSchema }]),
    AuthModule, // pro JwtService (gateway handshake)
    // UsersModule globální + PendingActionsModule globální — auto-injected
  ],
  controllers: [FriendshipsController],
  providers: [
    FriendshipsService,
    FriendshipsGateway,
    FriendRequestProvider,
    { provide: 'IFriendshipsRepository', useClass: MongoFriendshipsRepository },
  ],
})
export class FriendshipsModule {}
```

Registrovat v `app.module.ts` `imports` array.

### E.4 E2E `friendships.e2e-spec.ts`

- bootstrap dvou test users (přes existující seed/helper)
- POST request → 201, řádek pending
- POST request znovu → 409 REQUEST_EXISTS
- recipient: POST `:id/accept` → 200, status accepted
- GET `/friends` (oba účty) → 1 item každý
- GET `/friends/status/:other` → kind='accepted'
- DELETE `:id` → 204
- POST request after remove → 201 (new pending)
- recipient DELETE pending → 204, řádek `declined`
- requester POST request znovu (do 24h) → 429 REJECTED_RECENTLY
- mock skok času +25h → POST → 201 recyclováno
- GET `/pending-actions/count` → zahrnuje friend pending
- GET `/pending-actions?type=friend_request` → vrací item

**Akceptace:** všechny e2e cases zelené, žádné regrese v `users.e2e-spec.ts` / `auth.e2e-spec.ts`.

---

## 8. Fáze F — FE shared primitivy

**Cíl:** `<ConfirmDialog>` + `<KebabMenu>` v `src/shared/ui/`, jeden Storybook story per komponenta.

### F.1 `<ConfirmDialog>`

`src/shared/ui/ConfirmDialog/ConfirmDialog.tsx` (~60 LoC) — wrapper nad existující `<Modal>`:

```ts
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;            // default "Zrušit"
  confirmVariant?: 'primary' | 'danger'; // default 'primary'
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
}
```

- Reuse `Modal size="sm"`
- Footer = `<Button variant="ghost" onClick={onClose}>{cancelLabel}</Button> <Button variant={confirmVariant} loading={isPending} onClick={onConfirm}>{confirmLabel}</Button>`
- Default focus na cancel button (méně destructive)
- Theme-aware přes Modal (žádné nové tokeny)

`ConfirmDialog.module.css` — minimální (mezery v body, layout footeru). Reuse Modal tokens.

Export přes `src/shared/ui/index.ts`.

### F.2 `<KebabMenu>`

`src/shared/ui/KebabMenu/KebabMenu.tsx` (~120 LoC) — popover s items + bottom sheet variant pro mobil.

```ts
export interface KebabMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
  onClick: () => void;
}

interface KebabMenuProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: KebabMenuItem[];
  ariaLabel?: string;
}
```

Implementační detaily:
- `createPortal(document.body)` pro popover (z-index ≥ modal)
- Position: `useEffect` měří `anchor.getBoundingClientRect()`, popover absolute (top/left) — flip pokud overflow
- Klik mimo / Escape → `onClose`
- Mobile (≤ 768): `position: fixed; bottom: 0; left: 0; right: 0;` (bottom sheet), translateY animace
- Items: 36px desktop / 48px mobil; ikona 14/16; danger color via `var(--color-danger)`
- Storybook story: 3 variants (2 items default, danger item, mobile-resized iframe)

`KebabMenu.module.css` — desktop popover + mobile sheet media query.

Export přes `src/shared/ui/index.ts`.

### F.3 Testy fáze F

- `ConfirmDialog.spec.tsx`: render, klik confirm volá callback, isPending disabluje, escape zavírá
- `KebabMenu.spec.tsx`: render items, klik volá onClick + onClose, klik mimo zavírá, danger variant třída

### F.4 Manuální QA

- Storybook gallery test — 21 témat × `<ConfirmDialog>` + `<KebabMenu>`
- Mobile viewport (Chrome DevTools 375×667) — KebabMenu bottom sheet pattern

---

## 9. Fáze G — FE api hooks + types

### G.1 Rozšíření `src/shared/types/index.ts`

```ts
export interface FriendListItem {
  friendshipId: string;
  acceptedAt: string;
  friend: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    defaultAvatarType: DefaultAvatarType;
    role: UserRole;
    city: string | null;
    deleted: boolean;
    pendingDeletion: boolean;
  };
}

export interface FriendRequestListItem {
  friendshipId: string;
  requestedAt: string;
  direction: 'incoming' | 'outgoing';
  counterpart: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    defaultAvatarType: DefaultAvatarType;
    role: UserRole;
  };
}

export type FriendshipStatusKind =
  | 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted' | 'self' | 'cooldown';

export interface FriendshipStatusResponse {
  kind: FriendshipStatusKind;
  friendshipId?: string;
}

export interface FriendshipDto {
  id: string;
  userAId: string;
  userBId: string;
  requestedById: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  acceptedAt: string | null;
  updatedAt: string;
}
```

### G.2 API hooks `src/features/friendships/api/`

| Hook | Type | Query/Mutation |
|---|---|---|
| `useFriends` | query | `GET /friends?limit=100` |
| `useOutgoingFriendRequests` | query | `GET /friends/requests/outgoing?limit=100` |
| `useFriendshipStatus(userId)` | query | `GET /friends/status/:userId`, enabled = !!userId |
| `useSendFriendRequest` | mutation | `POST /friends/request`, invalidates: `['friendship-status', userId]`, `['friends']` |
| `useAcceptFriendRequest` | mutation | `POST /friends/:id/accept`, invalidates: `['pending-actions']`, `['friends']`, `['friendship-status']` |
| `useRemoveFriend` | mutation | `DELETE /friends/:id`, invalidates same as accept |
| `useRemoveFriendByUserId` | mutation | `DELETE /friends/by-user/:userId` (UX alias) |

Všechny reuse `api` client + chybové kódy `code: 'REJECTED_RECENTLY' | 'ALREADY_FRIENDS' | ...` z `ApiError` shape.

### G.3 Toast utils

`src/features/friendships/lib/toasts.ts`:
```ts
export function toastIncomingRequest(from: { username: string }, navigate: (to: string) => void) {
  toast(`${from.username} ti poslal/a žádost o přátelství`, {
    description: 'Otevři Zpracovat tab pro odpověď.',
    action: { label: 'Zobrazit', onClick: () => navigate('/ikaros/uzivatele?tab=zpracovat') },
    duration: 8000,
  });
}
export function toastRequestAccepted(by: { username: string }) {
  toast.success(`${by.username} přijal/a tvou žádost o přátelství`, { duration: 5000 });
}
```

### G.4 Testy fáze G

- `useFriendshipStatus.spec.tsx` — kind mapping pro všech 6 case (vč. 'cooldown')
- `useSendFriendRequest.spec.tsx` — 429 REJECTED_RECENTLY mapping na toast „Tento uživatel ti nedávno odmítl žádost. Zkus to za {hours}h."
- Toast utils — render snapshot text

---

## 10. Fáze H — FE komponenty

### H.1 `<FriendKebabMenu>` — kontextová varianta `<KebabMenu>`

`src/features/friendships/components/FriendKebabMenu.tsx`:

```tsx
export function FriendKebabMenu({ anchor, open, onClose, friend, onRemoveClick }: Props) {
  const navigate = useNavigate();
  return (
    <KebabMenu
      anchor={anchor}
      open={open}
      onClose={onClose}
      items={[
        { key: 'open', label: 'Otevřít profil', icon: <ExternalLink size={14} />, onClick: () => { navigate(`/ikaros/uzivatel/${friend.id}`); onClose(); } },
        { key: 'remove', label: 'Odebrat z přátel', icon: <UserMinus size={14} />, variant: 'danger', onClick: () => { onRemoveClick(); onClose(); } },
      ]}
      ariaLabel={`Akce pro přítele ${friend.username}`}
    />
  );
}
```

### H.2 `<OutgoingRequestCard>` — inline řádek

`src/features/friendships/components/OutgoingRequestCard.tsx`:

```tsx
<div className={s.row}>
  <UserAvatar src={...} defaultType={...} size="sm" />
  <div className={s.text}>
    <strong>{counterpart.username}</strong>
    <span className={s.muted}>· čeká od {formatRelative(requestedAt)}</span>
  </div>
  <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
    <X size={14} /> Zrušit
  </Button>
</div>
```

CSS: padding 12px 16px, gap 12px, surface-subtle background. Mobile: stack vertically (avatar+text v řádce, tlačítko full-width pod tím).

### H.3 Refactor `FriendsTab.tsx`

```tsx
export function FriendsTab() {
  const { data: friends, isLoading } = useFriends();
  const { data: outgoing } = useOutgoingFriendRequests();
  const [kebabAnchor, setKebabAnchor] = useState<{ user: FriendListItem['friend']; el: HTMLElement; friendshipId: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ friendshipId: string; username: string } | null>(null);
  const remove = useRemoveFriend();

  if (isLoading) return <SkeletonGrid />;

  if (!friends?.items.length && !outgoing?.items.length) return <EmptyState />;

  return (
    <section aria-label="Přátelé">
      {friends && friends.items.length > 0 && (
        <FriendsGridSection items={friends.items} onKebab={(f, anchor) => setKebabAnchor({ user: f.friend, el: anchor, friendshipId: f.friendshipId })} />
      )}
      {outgoing && outgoing.items.length > 0 && (
        <OutgoingSection items={outgoing.items} />
      )}
      {kebabAnchor && (
        <FriendKebabMenu
          anchor={kebabAnchor.el}
          open
          onClose={() => setKebabAnchor(null)}
          friend={kebabAnchor.user}
          onRemoveClick={() => { setConfirmRemove({ friendshipId: kebabAnchor.friendshipId, username: kebabAnchor.user.username }); setKebabAnchor(null); }}
        />
      )}
      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Odebrat z přátel?"
        message={<>Opravdu chceš odebrat <strong>{confirmRemove?.username}</strong> z přátel? Bude si muset poslat novou žádost.</>}
        confirmLabel="Odebrat"
        confirmVariant="danger"
        isPending={remove.isPending}
        onConfirm={async () => {
          await remove.mutateAsync(confirmRemove!.friendshipId);
          setConfirmRemove(null);
        }}
      />
    </section>
  );
}
```

### H.4 Empty state

```tsx
function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className={s.empty}>
      <Users size={48} />
      <h2>Zatím nemáš přátele</h2>
      <p>Najdi nové známé v adresáři uživatelů a pošli jim žádost o přátelství.</p>
      <Button onClick={() => navigate('/ikaros/uzivatele?tab=uzivatele')}>Otevřít adresář →</Button>
    </div>
  );
}
```

### H.5 `<FriendRequestRenderer>` — registr v `PENDING_ACTION_RENDERERS`

`src/features/friendships/components/FriendRequestRenderer.tsx`:

```tsx
export function FriendRequestLeft({ item }: { item: FriendRequestListItem }) {
  return <UserAvatar src={item.counterpart.avatarUrl} defaultType={item.counterpart.defaultAvatarType} size="md" alt={item.counterpart.username} />;
}

export function FriendRequestMid({ item }: { item: FriendRequestListItem }) {
  return (
    <>
      <div className={s.metaRow}>
        <span className={s.typeLabel}>Žádost o přátelství</span>
        <span className={s.timestamp}>{formatRelative(item.requestedAt)}</span>
      </div>
      <p className={s.title}>
        <strong>{item.counterpart.username}</strong> ti posílá žádost o přátelství
      </p>
    </>
  );
}

export function FriendRequestActions({ item, onResolve, isLoading }: { ... }) {
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriend();
  return (
    <>
      <Button size="sm" variant="danger" disabled={isLoading || accept.isPending || remove.isPending}
        onClick={async () => { await remove.mutateAsync(item.friendshipId); onResolve(); }}>
        <X size={14} /> Odmítnout
      </Button>
      <Button size="sm" disabled={isLoading || accept.isPending || remove.isPending}
        onClick={async () => { await accept.mutateAsync(item.friendshipId); onResolve(); }}>
        <Check size={14} /> Přijmout
      </Button>
    </>
  );
}
```

`rendererRegistry.tsx` rozšířit:
```ts
const friendRequestRenderer: PendingActionRenderer<FriendRequestListItem> = {
  type: PendingActionType.FriendRequest,
  renderLeft: (i) => <FriendRequestLeft item={i} />,
  renderMid: (i) => <FriendRequestMid item={i} />,
  renderActions: (i, h) => <FriendRequestActions item={i} onResolve={h.onResolve} isLoading={h.isLoading} />,
};

export const PENDING_ACTION_RENDERERS = {
  [PendingActionType.UsernameRequest]: usernameRequestRenderer,
  [PendingActionType.FriendRequest]: friendRequestRenderer,
} as Partial<Record<PendingActionType, PendingActionRenderer<unknown>>>;
```

### H.6 Refactor renderer text styles

Extrahovat sdílené třídy (`.metaRow`, `.typeLabel`, `.timestamp`, `.title`) z `UsernameRequestRenderer.module.css` do nového `src/features/users/components/tabs/ZpracovatTab/renderer-text.module.css` (nebo CSS shared mixin). Oba renderery importují.

### H.7 Testy fáze H

- `FriendKebabMenu.spec.tsx`: render items, klik na "Odebrat" volá `onRemoveClick`
- `OutgoingRequestCard.spec.tsx`: render avatar+text+button, klik volá callback
- `FriendsTab.spec.tsx`: empty state s CTA, render přátel grid, render outgoing sekce, kebab → confirm flow
- `FriendRequestRenderer.spec.tsx`: accept/decline mutace + onResolve volání

---

## 11. Fáze I — FE integrace

### I.1 Refactor `PublicProfileActions`

```tsx
export function PublicProfileActions({ profileId, meId, isAdmin }: Props) {
  const { data: status } = useFriendshipStatus(profileId);
  const send = useSendFriendRequest();
  const remove = useRemoveFriend();
  const accept = useAcceptFriendRequest();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const showFriendAction = status?.kind !== 'self' && status?.kind !== 'cooldown'; // Q2 — schované při cooldown
  return (
    <section aria-label="Akce">
      <h3>Akce</h3>
      <div className={s.actionsRow}>
        <div className={s.friendActionZone}>
          {showFriendAction && status && renderFriendButton(status, { send, remove, accept, setConfirmRemove, profileId })}
        </div>
        <Button variant="secondary" disabled title="Připravujeme — krok 3.5"><Mail size={14} /> Napsat zprávu</Button>
        {isAdmin && profileId !== meId && (
          <Button onClick={() => navigate(`/ikaros/uzivatele?tab=uzivatele&view=table&focus=${profileId}`)}>
            <Shield size={14} /> Otevřít v administraci
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Odebrat z přátel?"
        ... // identický pattern jako FriendsTab
      />
    </section>
  );
}
```

Helper `renderFriendButton` mapuje stav na JSX podle tabulky z auditu §5.

CSS: `.friendActionZone { min-width: 220px; min-height: 40px; }` — vizuální stabilita.

### I.2 Refactor `ZpracovatTab` na agregátor

```tsx
export function ZpracovatTab({ role }: ZpracovatTabProps) {
  const registeredTypes = Object.keys(PENDING_ACTION_RENDERERS) as PendingActionType[];

  return (
    <div className={s.tab}>
      {registeredTypes.map(type => (
        <PendingActionGroup key={type} type={type} />
      ))}
    </div>
  );
}

function PendingActionGroup({ type }: { type: PendingActionType }) {
  const { data, isLoading } = usePendingActions(type);
  const renderer = PENDING_ACTION_RENDERERS[type];
  if (isLoading || !data || data.items.length === 0 || !renderer) return null;

  return (
    <section className={s.group}>
      <h3 className={s.groupTitle}>{groupTitle(type)} ({data.total})</h3>
      {data.items.map(item => (
        <PendingActionCard key={(item as { friendshipId?: string; id?: string }).friendshipId ?? (item as { id: string }).id} {...} />
      ))}
    </section>
  );
}

function GlobalEmpty() {
  // shown když všechny grouply 0 — sleduje aggregate count přes usePendingActionsCount
}
```

`groupTitle(type)`:
- `username_request` → „Žádosti o změnu přezdívky"
- `friend_request` → „Žádosti o přátelství"

**Důležité:** `usePendingActions` se volá per typ. BE provider `canHandle` rozhodne, jestli vrátí items — non-admin pro `username_request` dostane `{ items: [], total: 0 }` (a sekce se skryje automaticky).

Empty state celé tabu pokud `usePendingActionsCount() === 0`:

```tsx
<EmptyZpracovat />  // existing visual reuse — ikona Inbox + „Nic ke zpracování"
```

### I.3 Socket integrace `useFriendshipsSocket`

`src/features/friendships/hooks/useFriendshipsSocket.ts`:

```ts
export function useFriendshipsSocket() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  useSocketEvent('friend:request:incoming', (payload: { from: { username: string } }) => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
    qc.invalidateQueries({ queryKey: ['friendship-status'] });
    toastIncomingRequest(payload.from, navigate);
  });

  useSocketEvent('friend:request:accepted', (payload: { by: { username: string } }) => {
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['friendship-status'] });
    toastRequestAccepted(payload.by);
  });

  useSocketEvent('friend:request:declined', () => {
    qc.invalidateQueries({ queryKey: ['friendship-status'] });
  });
  useSocketEvent('friend:request:canceled', () => {
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
  });
  useSocketEvent('friend:removed', () => {
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['friendship-status'] });
  });
}
```

Mount v `IkarosLayout` (vedle `usePresenceInit`):

```ts
useFriendshipsSocket();
```

### I.4 Testy fáze I

- `PublicProfileActions.spec.tsx` rozšíření — 6 stavů (5 buttonů + cooldown schovaný)
- `ZpracovatTab.spec.tsx` — agregátor render, hide empty groups, global empty state
- `useFriendshipsSocket.spec.tsx` — listener invalidates pro každý event

---

## 12. Fáze J — Validace + manuální QA matrix

### J.1 Automated

- `npm run lint`
- `npm run lint:colors`
- `npm test -- --run`
- `npm run build`
- BE: `npm test`, `npm run test:e2e`

### J.2 Manuální QA matrix

| Scénář | Kroky | Očekávané |
|---|---|---|
| Send → accept happy | A pošle B z `/ikaros/uzivatel/<B>` → B vidí toast + Zpracovat tab badge → B klik Přijmout | obě strany mají kartu v Přátelé |
| Send → decline → spam | A pošle B → B odmítne → A zkouší znovu | tlačítko schované na A profilu B; po 24h ENV reset → znovu |
| Cancel pending | A pošle B → A zruší z OutgoingRequestCard | B nemá pending v Zpracovat |
| Remove accepted | mají se v přátelích → A klikne Odebrat → confirm | B ztratí kartu z grid (socket update) |
| Tombstone | partner si smaže účet | karta zůstane s `deleted` overlay, Odebrat funguje |
| Offline socket | A pošle B, B offline | po B přihlášení vidí pending v Zpracovat (žádný toast) |
| Self profil | otevřu vlastní `/ikaros/uzivatel/<self>` | žádné friend tlačítko |
| Admin moderation | Admin pošle žádost běžnému useru | funguje stejně |
| Mobil sheet | klik na kebab v Přátelé tabu na 375px viewportu | KebabMenu = bottom sheet |
| 21 témat | switch theme v headeru, otevřít `?tab=pratele` | žádné hardcoded barvy, vše vykresleno OK |

### J.3 Cross-browser

Chrome, Firefox, Safari (macOS), iOS Safari (mobil) — manuální smoke test 5 nejhlavnějších flows.

---

## 13. Fáze K — Cleanup + dokumentace

1. `docs/roadmap-fe.md` — zaškrtnout 1.8 položky, přidat tracked dluhy D-055/056/057/058/059
2. `docs/dluhy.md` — registrovat dluhy s popisem
3. Volitelné: `docs/arch/phase-1/decisions-1.8.md` — vést rozhodnutí auditu (D1–D11) + Q1–Q5 pro budoucí AI agenty
4. `docs/dluhy.md` D-041 — doplnit poznámku „cron cleanup musí mazat i friendships"

## 14. Riziká a mitigace

| Riziko | Mitigace |
|---|---|
| Race: A klikne accept v ten samý moment co B klikne cancel | BE atomická update s `findOneAndUpdate({ status: 'pending' })` → druhá strana dostane 409 NOT_PENDING |
| Socket event missed (offline) | Query klíče `['friends']`, `['friendship-status']`, `['pending-actions']` mají `staleTime: 30s` — refetch při focus okna |
| Cool-down zneužití (declined → 24h block, decline znovu, atd.) | Záměrné — recipient má kontrolu. Pokud chce hard block, čeká na D-055 |
| FE neidempotentní mutace | Mutations používají `mutateAsync` → user button disabled během `isPending` |
| Tombstone partner ID neexistuje | Provider `listForUser` vrací counterpart shape s deleted=true (defensive) |

## 15. Akceptační kritéria (z spec §10 + design audit §11)

- [ ] BE friendships modul kompletní, všechny endpointy throttle 60/min
- [ ] BE jest + e2e zelené, žádné regrese
- [ ] FE všechny socket eventy invalidují správně query klíče
- [ ] PublicProfileActions má 5 viditelných stavů + cooldown schování
- [ ] FriendsTab empty state má funkční CTA do adresáře
- [ ] ZpracovatTab agregátor zobrazuje jen non-empty groups
- [ ] FriendKebabMenu = bottom sheet na ≤ 768px
- [ ] ConfirmDialog focus na cancel default, escape/backdrop zavírá
- [ ] `lint:colors` clean (žádné hardcoded barvy)
- [ ] Storybook gallery pass na 21 témat
- [ ] Manuální QA matrix všech 10 scénářů zelená

## 16. Schvalovací stop

**Souhlasím s plánem → následuje implementace fáze A.**

Implementace bude probíhat sekvenčně dle §2 (A → B → C → ... → K). Po každé fázi A–J zelený status update; fáze K je závěrečný commit.
