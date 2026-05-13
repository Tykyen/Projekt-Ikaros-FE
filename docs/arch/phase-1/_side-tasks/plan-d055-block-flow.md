# Plán D-055 — Block flow

**Stav:** návrh, čeká schválení
**Spec:** `spec-d055-block-flow.md` ✅ Q1–Q5 schváleno (A/A/A/A/A)
**Datum:** 2026-05-13

---

## 1. Fáze

```
A. BE schema/service (žádné nové schema — reuse 1.8 Friendship)
   A.1 IFriendshipsRepository — nové metody
   A.2 FriendshipsService — block / unblock / listBlocked / isBlockedBetween
   A.3 sendRequest + getStatusForPair rozšíření o blocked větve
   A.4 testy

B. BE controller + e2e
   B.1 3 nové endpointy
   B.2 e2e flow

C. FE types + api hooks
   C.1 BlockedItem v shared/types
   C.2 FriendshipStatusKind rozšíření o 'blocked_by_me'
   C.3 useBlockUser / useUnblockUser / useBlockedFriends

D. FE UI
   D.1 PublicProfileActions — kebab menu „Blokovat" + ConfirmDialog
   D.2 PublicProfileActions — stav blocked_by_me (Odblokovat tlačítko)
   D.3 FriendsTab — sekce „Zablokovaní" (collapsible, default collapsed)
   D.4 BlockedRequestCard inline řádek (reuse OutgoingRequestCard pattern)

E. Validace + cleanup
   E.1 lint, lint:colors, vitest, jest, e2e, build
   E.2 dluhy.md — uzavřít D-055
   E.3 HelpPage FAQ entry „Jak někoho zablokovat"
```

## 2. Fáze A — BE service

### A.1 Repository

`IFriendshipsRepository`:
```ts
listBlockedByUser(
  userId: string,
  page: number,
  limit: number,
): Promise<{ items: Friendship[]; total: number }>;
```

Mongo impl:
```ts
filter = { $or: [{ userAId: userId }, { userBId: userId }], status: 'blocked', blockedById: userId };
sort = { updatedAt: -1 };
```

### A.2 FriendshipsService nové metody

**`block(fromId: string, toId: string): Promise<Friendship>`**
- 400 SELF_BLOCK pokud rovnocenné
- 404 USER_NOT_FOUND pro tombstone / deletionPending
- Existing pair lookup:
  - `status='blocked'` + `blockedById === fromId` → no-op (vrátí existující)
  - `status='blocked'` + `blockedById === toId` → 403 BLOCKED_BY_PEER (Q1)
  - jakákoliv jiná → update na `status='blocked'`, `blockedById=fromId`, `acceptedAt` zachováno, `lastDeclinedAt`/`lastDeclinedById` zachováno *(pro audit historie)*
  - žádný → create nový s canonicalPair + status='blocked' + blockedById
- Žádný socket emit
- Vrací updated/created Friendship

**`unblock(fromId: string, toId: string): Promise<void>`**
- Existing pair lookup:
  - žádný nebo `status !== 'blocked'` → silent 204 (idempotent)
  - `blockedById !== fromId` → 403 NOT_BLOCKER
  - jinak → `deleteById` (Q4: čistý slate)
- Žádný socket emit

**`listBlocked(userId, page, limit): Promise<{ items: BlockedItem[]; total }>`**
- Volá `repo.listBlockedByUser`
- Hydratuje counterpart user přes `IUsersRepository.findById`

**`isBlockedBetween(a: string, b: string): Promise<boolean>`** (Q5 helper)
- `findByPair(a, b)` → `status === 'blocked'` returns true

### A.3 Rozšíření existujících metod

**`sendRequest`** — přidat větev po lookup existing:
```ts
if (existing?.status === 'blocked') {
  if (existing.blockedById === fromId) {
    throw 409 ALREADY_BLOCKED;
  }
  // anti-stalk: blokovaný nesmí poznat → 404 jako tombstone
  throw 404 USER_NOT_FOUND;
}
```

**`getStatusForPair`** — přidat blocked větev:
```ts
if (f.status === 'blocked') {
  if (f.blockedById === currentId) {
    return { kind: 'blocked_by_me', friendshipId: f.id };
  }
  return { kind: 'none' }; // anti-stalk
}
```

**`FriendshipStatusKind`** rozšíření v service interface o `'blocked_by_me'`.

### A.4 BE testy

`friendships.service.spec.ts` — 12 nových cases:
- block happy: žádné předchozí → vytvoří blocked, blockedById set
- block existing accepted → update na blocked, acceptedAt zachováno
- block existing pending → update na blocked, pending zmizí
- block self → 400
- block tombstone → 404
- block idempotent (already mine) → vrátí existující bez chyby
- block when peer blocked → 403 BLOCKED_BY_PEER
- unblock happy → row delete
- unblock když není blocked → silent 204
- unblock blok někoho jiného → 403 NOT_BLOCKER
- sendRequest blocked-by-me → 409 ALREADY_BLOCKED
- sendRequest blocked-by-peer → 404 USER_NOT_FOUND (anti-stalk)
- getStatusForPair: blocked_by_me / blocked-by-peer-as-none / none after unblock
- isBlockedBetween true/false oba směry
- block emituje žádný event (asserting `emitter.emit not called`)

## 3. Fáze B — BE controller + e2e

### B.1 Controller endpointy

`friendships.controller.ts` rozšíření:

```ts
@Post('block/:userId')
@HttpCode(200)
@Throttle({ default: { ttl: 60_000, limit: 30 } })
async block(@CurrentUser() me, @Param('userId') target) {
  const f = await this.service.block(me.id, target);
  return { friendship: this.service.toFriendshipDto(f) };
}

@Delete('block/:userId')
@HttpCode(204)
@Throttle({ default: { ttl: 60_000, limit: 60 } })
async unblock(@CurrentUser() me, @Param('userId') target) {
  await this.service.unblock(me.id, target);
}

@Get('blocks')
@Throttle({ default: { ttl: 60_000, limit: 60 } })
async listBlocks(
  @CurrentUser() me,
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page,
  @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit,
) {
  return this.service.listBlocked(me.id, clampPage(page), clampLimit(limit));
}
```

### B.2 E2E `friendships.e2e-spec.ts` — 6 nových cases

- block flow: A → block(B) → 200 → status=blocked
- block existing friendship: A+B přátelé → A→block(B) → B vidí GET /friends prázdné
- B → sendRequest(A) když A blokuje B → 404 USER_NOT_FOUND
- B → getStatusForPair(A) když A blokuje B → kind=none (anti-stalk)
- A → getStatusForPair(B) když A blokuje B → kind=blocked_by_me
- unblock → A → DELETE /friends/block/B → 204 → status=none
- GET /friends/blocks → list obsahuje B
- block self → 400
- block tombstone → 404

## 4. Fáze C — FE types + api hooks

### C.1 Rozšířit `src/shared/types/index.ts`

```ts
export type FriendshipStatusKind =
  | 'none' | 'pending_outgoing' | 'pending_incoming'
  | 'accepted' | 'self' | 'cooldown' | 'blocked_by_me';

export interface BlockedItem {
  friendshipId: string;
  blockedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    defaultAvatarType: DefaultAvatarType;
    role: UserRole;
    deleted: boolean;
  };
}

export interface BlocksListResponse {
  items: BlockedItem[];
  total: number;
}
```

### C.2 API hooks

`src/features/friendships/api/useBlockedFriends.ts`:
```ts
export function useBlockedFriends(enabled = true) {
  return useQuery({
    queryKey: ['friends', 'blocked'],
    queryFn: () => api.get<BlocksListResponse>('/friends/blocks', { page: 1, limit: 100 }),
    enabled,
    staleTime: 30_000,
  });
}
```

`useFriendshipMutations.ts` rozšířit:
```ts
export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ friendship: FriendshipDto }>(`/friends/block/${userId}`),
    onSuccess: () => {
      invalidateFriendshipQueries(qc); // ['friends'], ['friendship-status'], ['pending-actions']
      qc.invalidateQueries({ queryKey: ['friends', 'blocked'] });
      toast.success('Uživatel zablokován');
    },
    onError: (err) => {
      const code = parseApiErrorCode(err);
      if (code === 'BLOCKED_BY_PEER') {
        toast.error('Tento uživatel ti zablokoval kontakt.');
        return;
      }
      toast.error(parseApiError(err));
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<void>(`/friends/block/${userId}`),
    onSuccess: () => {
      invalidateFriendshipQueries(qc);
      qc.invalidateQueries({ queryKey: ['friends', 'blocked'] });
      toast.success('Odblokováno');
    },
    onError: (err) => toast.error(parseApiError(err)),
  });
}
```

## 5. Fáze D — FE UI

### D.1 + D.2 PublicProfileActions — kebab + blocked_by_me stav

Refaktor přidá:
1. **Kebab menu (Shield ikona)** vpravo v `actionsRow` — sdílený `<KebabMenu>` z 1.8 s items:
   - „Blokovat" (Shield danger) — pokud kind ≠ blocked_by_me/self
   - (později se rozšíří o další akce)
2. **Stav `blocked_by_me`** v friend zoně → ghost button „Odblokovat" (`ShieldOff` ikona). Friend zone se neschovává (jako u accepted), jen mění obsah.
3. **ConfirmDialog při blokování** s kontextovou zprávou podle aktuálního stavu (none vs. pending vs. accepted).

Kostra:
```tsx
const showKebab = kind !== 'blocked_by_me' && kind !== 'self';
const blockMessage = (() => {
  if (kind === 'accepted') return `Zablokovat ${username}? Vaše přátelství bude ukončeno…`;
  if (kind === 'pending_outgoing' || kind === 'pending_incoming') return `Zablokovat ${username}? Žádost o přátelství se zruší.`;
  return `Zablokovat ${username}? Nebudou si moct posílat žádosti o přátelství.`;
})();
```

### D.3 + D.4 FriendsTab — sekce „Zablokovaní"

Přidat třetí sekci po „Odeslané žádosti":
```tsx
{blocked.length > 0 && (
  <div className={s.section}>
    <button onClick={() => setBlockedExpanded(v => !v)} aria-expanded={blockedExpanded}>
      <ChevronDown rotated={!blockedExpanded} />
      Zablokovaní <span className={s.count}>({blocked.length})</span>
    </button>
    {blockedExpanded && (
      <div className={s.outgoingList}>
        {blocked.map(b => <BlockedRowCard key={b.friendshipId} item={b} />)}
      </div>
    )}
  </div>
)}
```

Default `blockedExpanded = false` (Q3 design — citlivý seznam, neměl by být primárně viditelný).

`BlockedRowCard` (sourozenec `OutgoingRequestCard`):
```tsx
<div className={s.row}>
  <UserAvatar ... size="sm" />
  <div className={s.text}>
    <strong>{user.username}</strong>
    <span className={s.muted}>· zablokován od {formatRelative(blockedAt)}</span>
  </div>
  <Button size="sm" variant="ghost" onClick={() => unblock.mutate(user.id)}>
    <ShieldOff size={14} /> Odblokovat
  </Button>
</div>
```

Reuse `OutgoingRequestCard.module.css` (stejné styly) → vlastní soubor není potřeba pro 1 LoC styling difference. Vytvoříme `BlockedRequestCard.tsx`, který sdílí stejné CSS.

### Empty state update

V `FriendsTab` aktualizovat empty state — zobrazí se jen pokud `friends + outgoing + blocked === 0`.

## 6. Fáze E — Validace + cleanup

### E.1 Validation chain

```
backend:
  npx tsc --noEmit
  npx jest src/modules/friendships --no-coverage
  npx jest --config test/jest-e2e.json friendships

frontend:
  npx tsc --noEmit
  npm run lint
  npm run lint:colors
  npx vitest run
  npm run build
```

Akceptace: vše ✓ bez regrese.

### E.2 docs/dluhy.md

Uzavřít D-055:
```
*D-055 uzavřen 2026-05-13 (side-task po 1.8) — block flow implementován.
- BE: POST/DELETE /api/friends/block/:userId, GET /api/friends/blocks; rozšíření sendRequest + getStatusForPair o blocked větve; nová helper isBlockedBetween() pro forward-compat 3.5+.
- FE: PublicProfileActions kebab menu + blocked_by_me stav; FriendsTab třetí collapsible sekce „Zablokovaní"; useBlockUser/useUnblockUser/useBlockedFriends hooky.
- Anti-stalk: blokovaný nepozná že je blokován (kind=none, sendRequest=404 USER_NOT_FOUND).
- Cooldown po unblock: čistý slate (Q4 schváleno).
- Spec: docs/arch/phase-1/_side-tasks/spec-d055-block-flow.md*
```

### E.3 HelpPage FAQ

Přidat do `FaqSection.tsx`:
```
q: 'Jak někoho zablokovat?',
a: <>
  V profilu uživatele otevři menu „...". Vybereš „Blokovat". Poté:
  - Existující přátelství zmizí.
  - Pending žádost (od libovolné strany) se zruší.
  - Nemůžete si poslat novou žádost (dokud neodblokuješ).
  - Druhá strana nedostane žádné upozornění (anti-stalk).
  Tvoje zablokované najdeš v záložce Přátelé → sekce „Zablokovaní".
</>
```

A aktualizovat datum v `HelpPage.tsx` lead odstavci.

## 7. Riziká + mitigace

| Riziko | Mitigace |
|---|---|
| Race condition: A blokuje současně, kdy B akceptuje | BE atomická mutation: pokud A vyhraje block first, B `accept` najde status=blocked → 409 NOT_PENDING (existující 1.8 chování) |
| FE state desync — blocked_by_me se neaktualizuje | invalidateQueries `['friendship-status']` po block/unblock + `['friends']` |
| Stalker via timing — opakované sendRequest detekuje 404 timing | mimo scope (možná dluh D-NEW pokud reálně problém) |
| Blokovaný má `pending_outgoing` z minulosti — friendship zmizí, FE state stale | `useFriendshipStatus` se refetchne pri okenním focusu (staleTime 15s) |

## 8. Schvalovací stop

Souhlas s plánem → následuje implementace fáze A.
