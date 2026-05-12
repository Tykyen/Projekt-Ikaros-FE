# Plán 1.5 — Presence (online indikátor + socket push)

**Datum:** 2026-05-12
**Status:** ✅ Implementováno + cleanup batch 2026-05-12 (BE 895 testů ✓, FE 232 testů ✓, tsc ✓, lint:colors ✓, build ✓)

**Cleanup batch (po hlavní implementaci):**
- Pre-existing failures vyřešené: `PendingActionCard.stories.tsx` TS generic cast, `RoleStar.tsx` hardcoded barvy → `--role-star-*` tokeny, `IkarosLayout` chevrons SVG `#d4111c` → `currentColor` + theme token
- D-049 (idle stav), D-050 (last-seen tooltip), D-052 (privacy „neviditelný" mód) uzavřené
**Spec:** `docs/arch/phase-1/spec-1.5.md` ✅ (schváleno 2026-05-12 + defaults §9: Q1-A, Q2-A, Q3-A, Q4-A)
**Pořadí prací:** BE registry → BE gateway → BE endpoint → BE tests → FE state → FE komponenta → FE integrace → FE cleanup → FE tests → polish

---

## 0. Předpoklady (ověřit před startem)

1. **BE** má `JwtService` registrovaný globálně (potvrzeno — `IkarosMessagesGateway` ho injektuje stejně).
2. **BE** `User` má `lastSeenAt` (potvrzeno, řádek `users.repository.ts:141`).
3. **BE** stávající `GET /api/presence/online` (25h) zůstává beze změny — žádný regression test musí selhat.
4. **FE** `getSocket()` posílá `auth: { token }` (potvrzeno — `src/features/chat/api/socket.ts:14`).
5. **FE** `useSocketInit()` je voláno v `IkarosLayout` (potvrzeno — `src/app/layout/IkarosLayout/IkarosLayout.tsx:363`).

Pokud kterýkoliv bod neplatí — pozastavit a komunikovat.

---

## 1. Pre-flight checklist

### 1.1 BE — ověřit
- [ ] `@nestjs/websockets`, `@nestjs/jwt`, `socket.io` dostupné (potvrzeno, ostatní gateways je používají)
- [ ] `JwtAuthGuard` + `IUsersRepository` se nemění
- [ ] `PresenceModule` bude importovat `JwtModule` (přes existující global registrace) — žádný nový auth bootstrap

### 1.2 FE — ověřit
- [ ] `jotai` dostupný, `getDefaultStore()` pattern reuse (`features/chat/api/socket.ts`)
- [ ] `lucide-react` ikony — žádné nové potřeba
- [ ] Žádné nové npm závislosti

### 1.3 CSS tokens
- [ ] Přidat do `src/themes/_shared/tokens.css`:
  - `--presence-online: #22c55e` (emerald-500)
  - `--presence-offline: transparent`
  - `--presence-ring: var(--color-panel, #fff)` — kontrast ring nad avatarem

---

## 2. Backend — pořadí kroků

> Pracovní adresář BE: `C:\Matrix\ProjektIkaros\Projekt-ikaros\backend`

### 2.1 OnlinePresenceRegistry (in-memory)

**Nový soubor:** `backend/src/modules/presence/online-presence.registry.ts`

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class OnlinePresenceRegistry {
  /** userId → Set<socketId> */
  private readonly map = new Map<string, Set<string>>();

  /** Vrátí true pokud user POPRVÉ přišel online (žádné předchozí sockety). */
  add(userId: string, socketId: string): boolean {
    let set = this.map.get(userId);
    const wasEmpty = !set;
    if (!set) {
      set = new Set();
      this.map.set(userId, set);
    }
    set.add(socketId);
    return wasEmpty;
  }

  /** Vrátí true pokud user odešel offline (poslední socket pryč). */
  remove(userId: string, socketId: string): boolean {
    const set = this.map.get(userId);
    if (!set) return false;
    set.delete(socketId);
    if (set.size === 0) {
      this.map.delete(userId);
      return true;
    }
    return false;
  }

  /** Odstranění socketu bez znalosti userId (cleanup po disconnect). */
  removeBySocket(socketId: string): string | null {
    for (const [userId, set] of this.map.entries()) {
      if (set.has(socketId)) {
        set.delete(socketId);
        if (set.size === 0) {
          this.map.delete(userId);
          return userId;
        }
        return null;
      }
    }
    return null;
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.map.keys());
  }

  isOnline(userId: string): boolean {
    return this.map.has(userId);
  }
}
```

**Akceptační:**
- [ ] `add` první socket → `true`; druhý socket stejného usera → `false`
- [ ] `remove` poslední socket → `true`; když jich má víc → `false`
- [ ] `removeBySocket` vrátí userId právě když to byl poslední socket
- [ ] `getOnlineUserIds()` vrací aktuální keys

### 2.2 PresenceGateway

**Nový soubor:** `backend/src/modules/presence/presence.gateway.ts`

```ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnlinePresenceRegistry } from './online-presence.registry';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' },
  namespace: '/',
})
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(PresenceGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly registry: OnlinePresenceRegistry,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) return; // anon socket — žádný presence
      const payload = this.jwtService.verify<{ sub?: string }>(token);
      const userId = payload?.sub;
      if (!userId) return;

      // Snapshot pro nově připojeného (před add — ať se nevidí sám v listu)
      const snapshot = this.registry.getOnlineUserIds();
      client.emit('presence:snapshot', { userIds: snapshot });

      // Uložit data na socket (pro disconnect lookup)
      (client.data as { userId?: string }).userId = userId;

      const cameOnline = this.registry.add(userId, client.id);
      if (cameOnline) {
        this.server.emit('presence:update', { userId, online: true });
      }
    } catch (err) {
      this.logger.debug(`presence handleConnection failed: ${String(err)}`);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId) return;
    const wentOffline = this.registry.remove(userId, client.id);
    if (wentOffline) {
      this.server.emit('presence:update', { userId, online: false });
    }
  }
}
```

**Klíčové detaily:**
- `client.emit('presence:snapshot')` → jen tomuto klientovi (initial state)
- `server.emit('presence:update')` → broadcast všem (online/offline change)
- **Race condition guard:** snapshot se posílá PŘED `registry.add` → uživatel v něm sám sebe neuvidí, ale uvidí ho `presence:update` který přijde hned po (`online: true`). Akceptovatelné, FE atom merguje.

**Akceptační:**
- [ ] Anon socket (bez tokenu) — `handleConnection` no-op, žádný emit
- [ ] Invalid token — `handleConnection` no-op (catch)
- [ ] Valid socket → snapshot doručen tomuto klientovi
- [ ] First socket → broadcast `online: true`
- [ ] Druhý socket stejného user → broadcast NENÍ (registry vrátí `false`)
- [ ] Disconnect — pokud poslední socket, broadcast `online: false`

### 2.3 Endpoint `GET /api/presence/online-now`

**Soubor:** `backend/src/modules/presence/presence.controller.ts` (rozšířit)

```ts
@Get('online-now')
@Throttle({ default: { limit: 30, ttl: 60000 } })
@ApiOperation({ summary: 'Aktuální snapshot online (active socket) uživatelů' })
@ApiResponse({ status: 200, description: 'string[] — pole userIds' })
getOnlineNow(): string[] {
  return this.registry.getOnlineUserIds();
}
```

Inject `OnlinePresenceRegistry` do controlleru (jednotná instance přes DI).

**Akceptační:**
- [ ] Bez auth → 401
- [ ] S auth → 200 s array
- [ ] Throttle 30/min funguje

### 2.4 PresenceModule (registrace)

**Soubor:** `backend/src/modules/presence/presence.module.ts`

```ts
@Module({
  imports: [UsersModule, JwtModule.register({})], // JwtModule prefer použít stávající global
  providers: [PresenceService, OnlinePresenceRegistry, PresenceGateway],
  controllers: [PresenceController],
  exports: [OnlinePresenceRegistry],
})
export class PresenceModule {}
```

**Akceptační:**
- [ ] `app.module.ts` už importuje `PresenceModule` (potvrzeno, řádek 25) — žádná změna
- [ ] BE startup bez chyb

### 2.5 BE testy

**Nový soubor:** `backend/src/modules/presence/online-presence.registry.spec.ts` (~5 testů)
- add první socket → true; druhý socket → false
- remove poslední → true; další → false
- removeBySocket return userId only na last
- getOnlineUserIds vrací current keys

**Nový soubor:** `backend/src/modules/presence/presence.gateway.spec.ts` (~5 testů)
- handleConnection anon → no emit
- handleConnection invalid JWT → no emit (catch path)
- handleConnection valid → snapshot na klienta + broadcast `online: true` při prvním socketu
- handleConnection druhý socket → broadcast SKIP
- handleDisconnect poslední socket → broadcast `online: false`

**Rozšířit:** `backend/src/modules/presence/presence.service.spec.ts` zůstává; jen ověřit že `findOnlineSince` (REST `/online` 25h) NEZMĚNĚNO.

**Akceptační:**
- [ ] `cd backend && npm test` — všechny suites passed, alespoň 10 nových testů
- [ ] Stávající tests beze změny (žádný regression)

---

## 3. Frontend — pořadí kroků

> Pracovní adresář FE: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE`

### 3.1 Presence state (atom + hooks)

**Nový soubor:** `src/shared/presence/store.ts`

```ts
import { atom } from 'jotai';

/** Set userIds, kteří jsou právě teď online (aktivní socket). */
export const onlineUserIdsAtom = atom<Set<string>>(new Set<string>());
```

**Nový soubor:** `src/shared/presence/usePresence.ts`

```ts
import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { getDefaultStore } from 'jotai';
import { getSocket } from '@/features/chat/api/socket';
import { onlineUserIdsAtom } from './store';

type SnapshotPayload = { userIds: string[] };
type UpdatePayload = { userId: string; online: boolean };

/** Inicializuje subscribery presence eventů. Volat jednou v root layoutu. */
export function usePresenceInit(): void {
  useEffect(() => {
    const socket = getSocket();
    const store = getDefaultStore();

    const onSnapshot = (data: SnapshotPayload) => {
      store.set(onlineUserIdsAtom, new Set(data.userIds));
    };

    const onUpdate = (data: UpdatePayload) => {
      const current = store.get(onlineUserIdsAtom);
      const next = new Set(current);
      if (data.online) next.add(data.userId);
      else next.delete(data.userId);
      store.set(onlineUserIdsAtom, next);
    };

    socket.on('presence:snapshot', onSnapshot);
    socket.on('presence:update', onUpdate);

    // Reconnect — pokud BE restartne, server pošle nový snapshot automaticky
    // při novém handleConnection. Žádná FE akce potřeba.

    return () => {
      socket.off('presence:snapshot', onSnapshot);
      socket.off('presence:update', onUpdate);
    };
  }, []);
}

/** True pokud user má aktuálně aktivní socket spojení. */
export function useIsOnline(userId: string | undefined | null): boolean {
  const set = useAtomValue(onlineUserIdsAtom);
  if (!userId) return false;
  return set.has(userId);
}
```

**Akceptační:**
- [ ] `usePresenceInit` přihlásí 2 eventy + odhlásí v cleanup
- [ ] `useIsOnline(undefined)` → `false`
- [ ] `useIsOnline(id)` reaguje na atom změny

### 3.2 `<OnlineDot />` komponenta

**Nové soubory:**
- `src/shared/presence/OnlineDot.tsx`
- `src/shared/presence/OnlineDot.module.css`

```tsx
// OnlineDot.tsx
import clsx from 'clsx';
import { useIsOnline } from './usePresence';
import s from './OnlineDot.module.css';

interface OnlineDotProps {
  userId: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Spec 1.5 — overlay tečka na avatara. Offline = transparent (Q1-A).
 * Pozicování `absolute` vůči rodičovskému relative wrapperu.
 */
export function OnlineDot({ userId, size = 'md', className }: OnlineDotProps) {
  const online = useIsOnline(userId);
  return (
    <span
      className={clsx(
        s.dot,
        size === 'sm' && s.sm,
        size === 'md' && s.md,
        online ? s.online : s.offline,
        className,
      )}
      aria-label={online ? 'Online' : 'Offline'}
      role="status"
    />
  );
}
```

```css
/* OnlineDot.module.css */
.dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--presence-ring, #fff);
  pointer-events: none;
}
.md { width: 10px; height: 10px; }
.sm { width: 8px; height: 8px; }
.online { background: var(--presence-online, #22c55e); }
.offline { background: var(--presence-offline, transparent); box-shadow: none; }
```

**Akceptační:**
- [ ] Online state — zelená tečka s ringem
- [ ] Offline state — transparent, no ring (žádný vizuální šum)
- [ ] `aria-label` mění se podle stavu

### 3.3 Tokens

**Edit:** `src/themes/_shared/tokens.css`

Přidat sekci na konec (před `}`):
```css
  /* Presence (1.5) */
  --presence-online: #22c55e;
  --presence-offline: transparent;
  --presence-ring: var(--color-panel, #fff);
```

**Akceptační:**
- [ ] `lint:colors` projde (tokeny v `_shared/`, ne v komponentě)

### 3.4 Integrace — IkarosLayout (header)

**Edit:** `src/app/layout/IkarosLayout/IkarosLayout.tsx`

1. **Přidat import:**
```tsx
import { usePresenceInit } from '@/shared/presence/usePresence';
import { OnlineDot } from '@/shared/presence/OnlineDot';
```

2. **Volání hooku** (v `IkarosLayout` komponentě po `useSocketInit()`):
```tsx
useSocketInit();
usePresenceInit();
```

3. **`HeaderLoggedIn`** — wrap UserAvatar do relative spanu + OnlineDot. Q3-A: vlastní stav = vždy online když přihlášen (přiřadit `userId={user.id}` — vlastní socket je v registry, tj. atom obsahuje vlastní userId po snapshot+update).

```tsx
<Link to="/ikaros/profil" className={s.headerBtn}>
  <span className={s.avatarWrapper} style={{ position: 'relative', display: 'inline-block' }}>
    <UserAvatar
      src={user.avatarUrl}
      defaultType={user.defaultAvatarType ?? 'male'}
      size="xs"
      alt={user.username}
      className={s.avatar}
    />
    <OnlineDot userId={user.id} size="sm" />
  </span>
  <span className={s.headerBtnLabel}>{user.username}</span>
</Link>
```

4. **Sidebar Vesmíry cleanup:** odstranit `<span className={s.worldOnlineDot} />` z obou `Vesmíry` sekcí (sidebar + right panel `Moje světy`).

**Akceptační:**
- [ ] Header avatar má zelenou tečku po přihlášení
- [ ] Z DOMu zmizely `worldOnlineDot` spany u světů
- [ ] CSS class `.worldOnlineDot` v `IkarosLayout.module.css` smazána (nepoužitý kód)

### 3.5 Integrace — UserCard

**Edit:** `src/features/users/components/tabs/UsersTab/UserCard.tsx` + `UserCard.module.css`

1. Wrap `<UserAvatar>` do `<span className={s.avatarWrapper}>` (relative)
2. Přidat `<OnlineDot userId={user.id} size="md" />` jako sibling

```tsx
<span className={s.avatarWrapper}>
  <UserAvatar
    src={user.avatarUrl}
    defaultType={user.defaultAvatarType}
    size="lg"
    alt={`Avatar ${user.username}`}
    className={s.avatar}
    deleted={isDeleted}
  />
  {!isDeleted && <OnlineDot userId={user.id} size="md" />}
</span>
```

**CSS:** `UserCard.module.css` přidat `.avatarWrapper { position: relative; display: inline-block; }`.

**Akceptační:**
- [ ] Online userové v adresáři mají dot
- [ ] Deleted/pending účty NEMAJÍ dot (irelevantní pro tombstone)

### 3.6 Integrace — PublicUserProfileHeader

**Edit:** `src/features/users/components/PublicProfile/PublicProfileHeader.tsx`

Najít avatar render a wrapnout stejně jako v UserCard:
```tsx
<span className={s.avatarWrapper}>
  <UserAvatar ... />
  {!isDeleted && <OnlineDot userId={profile.id} size="md" />}
</span>
```

**CSS:** stejný `.avatarWrapper` v `PublicProfileHeader.module.css`.

**Akceptační:**
- [ ] Veřejný profil online usera má dot
- [ ] Tombstone profile (admin výjimka) nemá dot

### 3.7 FE testy

**Nový:** `src/shared/presence/__tests__/usePresence.spec.ts` (~6 testů)
- `onlineUserIdsAtom` initial empty
- `usePresenceInit` snapshot handler → atom = nový Set
- `usePresenceInit` update `online: true` → atom přidá
- `usePresenceInit` update `online: false` → atom odebere
- `useIsOnline(undefined)` → false
- `useIsOnline(id)` reactivní na atom

(Mock `getSocket()` pro deterministické testy — vrátí mock socket s `.on/.off/.emit`.)

**Nový:** `src/shared/presence/__tests__/OnlineDot.spec.tsx` (~4 testů)
- Render online → třída `s.online` + `aria-label="Online"`
- Render offline → třída `s.offline` + `aria-label="Offline"`
- Size `sm` vs `md` — class
- Custom `className` prop propaguje

**Existující testy reuse:** žádné změny v `UserCard.spec.tsx` / `IkarosLayout` testech očekávané — pokud existují snapshot testy, aktualizovat snapshoty.

**Akceptační:**
- [ ] `npm test` všechny pass
- [ ] Coverage: 10+ nových testů
- [ ] Žádný regression

---

## 4. Polish

### 4.1 HelpPage update
- [ ] Spustit skill `napoveda` po implementaci — aktualizovat tab Stránky (1.5 ✅) a FAQ pokud relevantní (jak funguje online indikátor)

### 4.2 Roadmap update
- [ ] `docs/roadmap-fe.md` → 1.5 z `- [ ]` na `- [x]` + odstavec s realizovanými body (analogie k 1.4, 1.3a-c)

### 4.3 Dluhy update
- [ ] `docs/dluhy.md` → přidat D-049 (idle), D-050 (last-seen tooltip pokud nezahrnuto), D-051 (Redis), D-052 (privacy)

### 4.4 Quality gates
- [ ] FE: `npm run lint && npm run lint:colors && npm run test:run && npm run build`
- [ ] BE: `cd backend && npm test && npm run build`
- [ ] Skill `mobil-desktop` — overit OnlineDot pozici na 320px / 768px / 1280px (avatar v header je xs=32px → dot 8px bottom-right; na UserCard avatar lg=80px → dot 10px)

### 4.5 Bonus (Q2-A) — „Naposledy online před X"
- [ ] V `PublicProfileHeader` přidat tooltip pod avatar: pokud `!useIsOnline(id) && profile.lastSeenAt`, render `<span title="Naposledy online {relativeTime(lastSeenAt)}">⌚</span>` vedle username
- [ ] **Podmínka pro bonus:** `PublicUserProfile` DTO musí obsahovat `lastSeenAt`. Pokud ne, BE update: přidat do `PUBLIC_PROJECTION` (`users.service.ts`). **Pozor — privacy review** v 1.4 spec §1 explicitně NEvylučuje `lastSeenAt` z public profilu (vylučuje `lastLoginAt`). Tj. `lastSeenAt` je „kdy naposledy interagoval" = nižší citlivost než `lastLoginAt`. Stále diskutabilní → pokud bude bonus mít vedlejší costs, **přesunout do D-050** bez bloku.
- [ ] Relative time util — vlastní (žádná `date-fns` závislost): `<1 min "právě teď"`, `<60 min "před X min"`, `<24 h "před X h"`, `<7 d "před X d"`, jinak ISO datum.

---

## 5. Pořadí commitů (doporučené)

1. `feat(presence): OnlinePresenceRegistry + unit tests` (BE)
2. `feat(presence): PresenceGateway + handleConnection/Disconnect` (BE)
3. `feat(presence): GET /api/presence/online-now endpoint` (BE)
4. `feat(presence): FE state + usePresence hook` (FE)
5. `feat(presence): OnlineDot komponenta + tokens` (FE)
6. `feat(presence): integrace IkarosLayout header + Vesmíry cleanup` (FE)
7. `feat(presence): integrace UserCard + PublicProfileHeader` (FE)
8. `feat(presence): last-seen tooltip bonus` (FE — *jen pokud Q2-A bez komplikací*)
9. `docs(1.5): roadmap + dluhy + HelpPage` (docs)

Cíl: každý commit zelený (lint+test+build).

---

## 6. Rizika a mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| Race condition: snapshot doručen po update | nízká | nízký (atom merguje Set) | Pořadí v `handleConnection` — snapshot → registry.add → emit update. FE atom merguje (Set). |
| Multi-tab false offline | střední | střední | Registry je multi-socket (Set<socketId>). Test 2.1 ověří. |
| BE crash → stale online state na FE | střední | nízký | Po reconnect server pošle nový snapshot → FE atom reset. `useSocketInit` už řeší reconnect toast. |
| Privacy concern: každý vidí presence | nízká | střední (do 1.7) | Adresář je Admin-only (1.4); public profil je gated `requireAuth`. Privacy opt-out → D-052 (1.7). |
| Token expiry během socket spojení | nízká | nízký | Socket žije do disconnect — FE refresh token v REST nezmění socket auth. Pokud server restart, klient reconnectuje s novým tokenem (axios interceptor). |
| Redis multi-instance | nízká (jen single-instance dnes) | vysoký (pokud škáláno) | Out-of-scope 1.5, D-051 |

---

## 7. Definition of Done

- [ ] Všechny `### X.Y Akceptační` body z §2 a §3 ✅
- [ ] §4.4 Quality gates ✅
- [ ] Spec §6 (akceptační kritéria) všech 8 funkčních + 4 performance + 2 resilience + 22 testů ✅
- [ ] §4.1 HelpPage update + §4.2 roadmap update + §4.3 dluhy update
- [ ] Spec 1.5 přesunut na ✅ status v záhlaví; plan 1.5 přesunut na ✅ status
- [ ] Manuální test multi-tab v dev: otevřít 2 karty se 2 různými usery → vidí navzájem online v adresáři / public profilu / header
