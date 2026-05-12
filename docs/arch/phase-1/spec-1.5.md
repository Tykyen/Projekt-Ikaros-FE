# Spec 1.5 — Presence (online indikátor + socket push)

**Datum:** 2026-05-12
**Status:** ✅ Schváleno 2026-05-12 (defaults §9: Q1-A, Q2 → D-050, Q3-A, Q4-A)
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.5
**Závisí na:** 1.4 (UserCard, public profile, IkarosLayout header avatar) ✅
**Předchází:** 1.8 (Přátelé — online dot vedle jména přítele použije stejnou infru)
**Souvisí s:** D-045 (privacy toggle „skrýt mě v adresáři" — analogický pro presence, řešíme až v 1.7)

---

## 1. Cíl

Zavést **canonický presence stav** uživatele (online / offline) napříč platformou — jediný zdroj pravdy v BE, push aktualizace přes Socket.IO, sjednocená vizualizace přes `<OnlineDot />` komponentu.

**Definice „online":** uživatel má **aktivní socket spojení** k serveru (tj. má otevřenou kartu Projekt Ikaros a je přihlášen). Žádný polling, žádný heartbeat — připojený socket = online, disconnect = offline.

**Definice „naposledy aktivní":** `User.lastSeenAt` (už existuje, auto-update přes `JwtAuthGuard`) — out-of-scope tooltip pro 1.5, využije se až ve veřejném profilu jako sekundární info (může v 1.5 přijít jako *bonus*, pokud minimální cost — viz §5).

---

## 2. Rozsah

### 2.1 V rozsahu 1.5

**BE — nový socket subsystém:**
- Nový `PresenceGateway` (Nest WebSocketGateway, namespace defaultní `/`) — handler `connection` přidá `userId` do in-memory **OnlinePresenceRegistry** + emit `presence:update { userId, online: true }` všem připojeným klientům
- Handler `disconnect` — odstraní socket; pokud uživateli zbývá ≥1 socket, nic; pokud poslední, emit `presence:update { userId, online: false }`
- Registry je **multi-socket aware** (uživatel může mít několik karet) — drží Map<userId, Set<socketId>>
- Nový endpoint `GET /api/presence/online-now` — vrátí aktuální snapshot z `OnlinePresenceRegistry` jako `string[]` userIds; `JwtAuthGuard`
- **Zachovat** stávající `GET /api/presence/online` (25h threshold přes `lastSeenAt`) beze změny — zůstává jako „recently active" sémantika (může se hodit budoucím statistikám, dashboardům)
- Po `connection` server **emituje volajícímu** `presence:snapshot { userIds: string[] }` (initial state, ať FE nemusí zvlášť volat REST)

**BE — auth do socketu:**
- Stávající `getSocket()` na FE už posílá `auth: { token }`. BE musí v `PresenceGateway.handleConnection` ověřit JWT (přes existující strategii / util) a získat `userId`. Anonymní socket = ignore (žádný presence emit, ale necháme připojený kvůli `chat:presence` v global-chat).

**FE — `usePresence()` hook + state:**
- Globální Jotai atom `onlineUserIdsAtom: Set<string>`
- `usePresenceInit()` — voláno jednou v `IkarosLayout` (vedle `useSocketInit()`); přihlásí se na `presence:snapshot` (set initial) + `presence:update` (delta merge)
- `useIsOnline(userId)` — boolean selector hook nad atomem
- Bez REST fetch — initial state přichází jen přes socket snapshot (jednodušší, lokálně konzistentní)

**FE — `<OnlineDot />` komponenta:**
- Props: `userId` (povinný), `size?: 'sm' | 'md'` (default `md`, 10px / 8px)
- Renderuje `<span>` s pozicovacími styly absolute na rodičovský element (avatar wrapper)
- Stavová třída `s.online` / `s.offline`; barva přes theme tokeny `--presence-online` (zelená, default `#22c55e`) a `--presence-offline` (šedá, default `var(--color-text-muted-30)`)
- Ring (bílý / theme bg) okolo tečky pro kontrast nad avatarem
- `aria-label="Online"` / `aria-label="Offline"` (read-only stav, žádná interakce)

**FE — integrace:**
- `IkarosLayout` header — vedle `UserAvatar` v `HeaderLoggedIn` (vlastní stav — bude *vždy online* pokud je socket connected; defenzivně checkujeme jako každého jiného userId)
- `UserCard` (Uživatelé tab v `/ikaros/uzivatele`) — překryv na avataru (bottom-right)
- `PublicUserProfileHeader` (`/ikaros/uzivatel/:id`) — překryv na avataru
- **Sidebar Vesmíry placeholder** (`worldOnlineDot`) **odstranit** — světy nemají presence (vizuální dluh z 1.0/1.2). To NENÍ presence integrace, je to **cleanup** v rámci 1.5

### 2.2 Mimo rozsah 1.5

- **Idle stav** (online / idle / offline) — tří-stavový lifecycle, vyžaduje JS aktivitu detekci (mousemove / focus / visibilitychange) + samostatné socket eventy. Návrh do D-049.
- **Privacy „neviditelný" mód** — user opt-out z presence broadcastu. Logická spárování s D-045 (skrýt v adresáři) — diskuse pro 1.7.
- **„Naposledy online před X" tooltip** — UI nad `lastSeenAt`. Možný *bonus* (viz §5), pokud minimální cost; jinak D-050.
- **Online indikátor v Přátelích tabu** — tab je v 1.4 kostra (empty state). Naplní 1.8.
- **Online indikátor v chatu / článcích / galerii / diskuzi** — vyřeší příslušné fáze (4.x, 3.x).
- **Redis adapter pro Socket.IO** — pro multi-instance deploy. In-memory registry je single-instance; analogicky k D-028 (Redis varianta cache). Návrh do D-051.

---

## 3. Datový kontrakt (BE → FE socket)

### 3.1 Socket eventy

| Směr | Event | Payload | Kdy |
|---|---|---|---|
| `server → client` (po `connection`) | `presence:snapshot` | `{ userIds: string[] }` | Jednorázově při připojení autentizovaného socketu |
| `server → all clients` | `presence:update` | `{ userId: string, online: boolean }` | Když user přijde online (první socket) / odejde (poslední disconnect) |

### 3.2 REST endpoint (out-of-band fallback)

| Metoda | Endpoint | Auth | Popis |
|---|---|---|---|
| `GET` | `/api/presence/online-now` | JWT | Aktuální snapshot OnlinePresenceRegistry. Response: `string[]` userIds. Throttle 30/min/IP. **Není v FE flow potřeba** — socket snapshot stačí. Endpoint existuje pro dev tooling / debug. |

### 3.3 Nezměněné

- `GET /api/presence/online` (25h threshold) — zůstává
- `JwtAuthGuard.updateLastSeen` — zůstává
- `chat:presence` v `GlobalChatGateway` — zůstává, řeší chat-room-scoped presence (kdo je v této místnosti). Logika oddělená od globálního presence.

---

## 4. UI — `<OnlineDot />`

### 4.1 Layout

```
┌─────────────┐
│   Avatar    │
│             │
│             │
│           ● │ ← OnlineDot 10×10px, absolute bottom: -2px right: -2px
└─────────────┘
```

- Velikost `md`: 10px (UserCard avatar lg=80px, profil header avatar xl)
- Velikost `sm`: 8px (header avatar xs=32px)
- Ring: 2px outer ring v barvě pozadí karty (`var(--color-bg)` nebo `var(--color-panel)`) — kontrast nad avatarem napříč 21 tématy
- Barva online: `var(--presence-online, #22c55e)` (default emerald-500)
- Barva offline: `var(--presence-offline, transparent)` — **offline = neviditelný dot** (nepřidává vizuální šum, prázdné místo = offline). Alternativa: šedá tečka pro „explicitní offline" — viz §5 otevřená otázka.

### 4.2 Tema overrides

Žádné per-theme overrides v 1.5. Jeden globální tok = jedna sémantika. Pokud jednotlivé theme chtějí jiný odstín zelené, mohou přepsat token v `themes/themes/<id>/index.ts` — out-of-scope spec.

### 4.3 Responsive

`<OnlineDot />` má fixní pixely (10 / 8) — ne `clamp()`. Avatar je už responsive (`UserAvatar size`), dot drží absolutní polohu vůči wrapperu.

---

## 5. Otevřené otázky (rozhodnout před implementací)

**Q1 — Offline dot: viditelný (šedá) vs. neviditelný (transparent)?**
- (A) **Transparentní offline** — minimalistické, offline = absence dotu. Doporučení.
- (B) Šedá tečka pro offline — explicitnější, ale vizuální šum pro většinu adresáře (typicky 90 %+ offline).

**Q2 — Tooltip „naposledy online před X" — *bonus* nebo D-050?**
- (A) **Bonus v 1.5** — využije `lastSeenAt` z `PublicUserProfile`. Cost: `relativeTime` util + tooltip na header avatar. ~30 min práce. Doporučení.
- (B) Odložit do D-050. Důvod: ladění UX, jiný spec.

**Q3 — Header avatar a vlastní stav:**
- (A) **Vždy online když přihlášen** (zjednodušení — vlastní stav nevyžaduje subscribe). Doporučení.
- (B) Konzistentní logika (i vlastní userId přes `useIsOnline(me.id)`) — defenzivnější, ale pro vlastní user redundantní (jestli máš socket, jsi online — tautologie).

**Q4 — REST `online-now` endpoint:**
- (A) **Nechat (dev tooling)** — žádné FE volání. Doporučení.
- (B) Vynechat — YAGNI. Endpoint = další povrch k údržbě.

---

## 6. Akceptační kritéria

### 6.1 Funkční

1. **Online dot v header** — po přihlášení / refresh stránky se na vlastním avataru objeví zelená tečka
2. **Online dot v adresáři** (Admin) — UserCard s avatarem aktuálně připojeného uživatele má zelenou tečku; offline uživatel ji nemá
3. **Online dot na public profilu** — `/ikaros/uzivatel/:id` zobrazí zelenou tečku, pokud user má aktivní socket
4. **Push update — online:** otevři druhou kartu (nebo přihlas druhého usera) → první karta vidí update **bez reloadu**
5. **Push update — offline:** zavři druhou kartu / odhlas se → ostatní vidí offline **bez reloadu**
6. **Multi-tab:** uživatel se dvěma kartami = jedno `presence:update` (online při první kartě, offline až po zavření druhé)
7. **Anon viewer:** anonymní (nepřihlášený) uživatel nedostává `presence:snapshot` ani `presence:update` (nemá JWT na socketu)
8. **Vesmíry sidebar cleanup:** `worldOnlineDot` placeholder smazán z `IkarosLayout`

### 6.2 Performance

- `presence:update` payload < 100 B (`{ userId, online }`)
- `presence:snapshot` při ~100 online userech < 5 kB
- FE atom set ops O(1) (Set)
- Žádný polling, žádný interval timer

### 6.3 Resilience

- Server crash / restart → klient po reconnectu dostane fresh `presence:snapshot`
- Network drop → klient po reconnectu dostane fresh snapshot (žádný stale state)

### 6.4 Testy

**BE:**
- `PresenceGateway.handleConnection` ověří JWT, přidá userId do registry, emitne snapshot volajícímu a update broadcast
- `handleDisconnect` odstraní socket; emit pouze při poslední disconnect (multi-socket test)
- `OnlinePresenceRegistry` unit testy (add/remove, multi-socket count, getOnlineIds)
- Anon socket connection: registry nedotčen
- Pokrytí: ~10 nových testů

**FE:**
- `onlineUserIdsAtom` initial empty
- `usePresenceInit` reacting na `presence:snapshot` → set atom
- `usePresenceInit` reacting na `presence:update online:true` → add
- `usePresenceInit` reacting na `presence:update online:false` → delete
- `useIsOnline(id)` selector
- `<OnlineDot />` render: online state, offline state, aria-label, ring overlay
- Pokrytí: ~12 nových testů

---

## 7. Architektonické důsledky

- **OnlinePresenceRegistry** zavádí první **in-memory globální server-side state** v BE (předchozí stav byl bezstavový + DB). Konsekvence: single-instance only do D-051 (Redis adapter).
- **Socket.IO jako jediný zdroj presence updates** — žádný polling, žádný DB read. To znamená: pokud BE restartne mezitím co FE drží stale state, **musí klient zachytit reconnect a re-snapshot**. `useSocketInit` už řeší toast při reconnect — `usePresenceInit` musí přidat `on('connect', refetch snapshot)`.
- **Future:** stejná infra (gateway + registry pattern) může sloužit pro: „kdo zrovna píše v chatu" (4.x), „kdo prohlíží stránku" (7.x), atd. Není potřeba duplikovat.
- **Privacy by default later:** D-045 (privacy toggle pro adresář) by se v 1.7 měl rozšířit na presence opt-out — kdo se schová z adresáře, schová se i z presence broadcastu.

---

## 8. Tracked dluhy z 1.5

- **D-049** ✅ Idle stav (3-stavový) — uzavřeno v 1.5 cleanup batch
- **D-050** ✅ „Naposledy online před X" tooltip — uzavřeno v 1.5 cleanup batch
- **D-051** ⬜ Redis adapter pro `OnlinePresenceRegistry` (multi-instance deploy)
- **D-052** ✅ Privacy „neviditelný" mód — uzavřeno v 1.5 cleanup batch

## 9. Doporučení (defaults pokud user nezasáhne)

- Q1 → **(A) Transparentní offline**
- Q2 → **(A) Tooltip jako bonus** v 1.5 (~30 min navíc)
- Q3 → **(A) Vlastní stav = vždy online** v header
- Q4 → **(A) Endpoint nechat** (dev tooling)
