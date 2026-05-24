# Infrastructure spec — Mongo replica set + Redis + Captcha

**Stav:** 📝 návrh — čeká na rozhodnutí autora
**Datum:** 2026-05-24
**Pokrývá dluhy:** D-011, D-028, D-051, D-061, D-NEW-chat-presence-scale, D-8.6-replica-set

---

## Proč

Šest otevřených dluhů sdílí jednoho blokátora — externí infrastrukturu nebo provider účet. Vyřešení jednoho každého samostatně by znamenalo nekonzistentní setup; **sjednotit do jednoho infrastructure rollout** = méně práce + jednotný DevX.

## 1. Mongo replica set

### Pokrývá

- **D-061** — atomické `approveAccessRequest` (smaž AR + create membership v transakci)
- **D-8.6-replica-set** — atomický transfer mezi účty (place + receive)

### Současný stav

Dev MongoDB běží jako **standalone** instance (`mongodb://localhost:27017/ikaros`). Mongo transakce (`session.withTransaction()`) vyžadují replica set i pro single-node deploy.

Dnes je workaround:
- `approveAccessRequest` — sekvenční s idempotent cleanup (orphan AR se odstraní při dalším pokusu)
- `CharacterAccountsService.transfer` — sekvenční s revert-on-fail (race window error → log + manual fix)

### Cílový stav

**Jediná instance MongoDB v replica set módu** (`rs.initiate()` na single node). Žádná druhá replika — jen aktivuje transakce.

### Implementace

#### 1.1 Docker-compose / dev setup

Pokud má autor docker-compose: přidat parametr `--replSet rs0`:

```yaml
services:
  mongo:
    image: mongo:7
    command: ['mongod', '--replSet', 'rs0', '--bind_ip_all']
    ports:
      - '27017:27017'
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: |
        mongosh --eval "try { rs.status() } catch { rs.initiate({_id:'rs0', members:[{_id:0, host:'localhost:27017'}]}) }"
      interval: 10s
```

Pokud bez docker-compose (lokální `mongod`):
1. Spusť `mongod --replSet rs0 --dbpath C:\data\db`
2. V druhém terminálu `mongosh` → `rs.initiate()`

#### 1.2 BE změny

**`backend/src/database/database.module.ts`** — connection string už má replica set; default URI v `.env`:

```
MONGODB_URI=mongodb://localhost:27017/ikaros?replicaSet=rs0
```

**`approveAccessRequest`** v `worlds.service.ts`:

```ts
async approveAccessRequest(requestId: string, approverId: string) {
  const session = await this.connection.startSession();
  try {
    await session.withTransaction(async () => {
      const request = await this.accessRequestRepo.findById(requestId, session);
      if (!request) throw new NotFoundException();
      // ... validace ...
      await this.membershipRepo.create({ userId: request.userId, worldId: request.worldId, ... }, session);
      await this.accessRequestRepo.deleteById(requestId, session);
    });
  } finally {
    await session.endSession();
  }
}
```

**`CharacterAccountsService.transfer`** — přepsat sekvenční flow na `withTransaction` (viz spec 8.6 §3.3, kód už připravený, jen aktivovat).

#### 1.3 Test ovařování

- BE testy musí v CI běžet s replica setem. Buď `mongodb-memory-server` v replica set módu (`MongoMemoryReplSet`), nebo standalone mock.
- Jeden integration test pro každý workflow (transfer happy + abort).

### Akceptace

- `npm run start:dev` se připojí na replica set
- `npm test` projde bez chyby v transakčních testech
- Manuální test: simulace selhání v půli transferu → oba účty zůstanou nedotčené

### Odhad

~3 hodiny (docker-compose + .env + 2 service rewrite + integration test setup).

---

## 2. Redis (in-memory data store)

### Pokrývá

- **D-028** — Cache pro `JwtStrategy.validate` ban check (Redis pub/sub)
- **D-051** — `OnlinePresenceRegistry` (in-memory Map → Redis hash + Socket.IO adapter)
- **D-NEW-chat-presence-scale** — Chat presence multi-instance (Redis adapter)

### Současný stav

- Ban check cache je `Map<userId, ts>` v paměti procesu — single-instance only
- `OnlinePresenceRegistry` je `Map<userId, RegistryEntry>` — single-instance only
- Chat presence `Map<channelId, Set<userId>>` — single-instance only

Při horizontálním škálování BE by každá instance měla vlastní obraz a `presence:update` broadcast by se nepropagoval.

### Cílový stav

**Redis 7+ instance** + dva pakety:
- `ioredis` — client pro cache + pub/sub
- `@socket.io/redis-adapter` — sdílený Socket.IO pub/sub mezi instancemi

### Implementace

#### 2.1 Docker-compose

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: ['redis-server', '--appendonly', 'yes']
    volumes:
      - redis-data:/data
```

#### 2.2 `.env` rozšíření

```
REDIS_URL=redis://localhost:6379
```

#### 2.3 BE změny

**Nový modul** `backend/src/common/redis/redis.module.ts`:

```ts
@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: () => new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
```

**`UserBanCacheService`** — vyměnit `Map` za Redis:

```ts
async isBanned(userId: string): Promise<boolean> {
  const cached = await this.redis.get(`ban:${userId}`);
  if (cached !== null) return cached === '1';
  const banned = await this.usersRepo.isBanned(userId);
  await this.redis.set(`ban:${userId}`, banned ? '1' : '0', 'EX', 60);
  return banned;
}

// Pub/sub channel pro invalidaci napříč instancemi:
async onBanChange(userId: string) {
  await this.redis.del(`ban:${userId}`);
  await this.redis.publish('user-ban-invalidate', userId);
}
```

**`OnlinePresenceRegistry`** — Map → Redis hash (`HSET online:users <userId> <json>`). TTL 90s, refresh při každém heartbeat.

**Socket.IO Redis adapter** — v `main.ts`:

```ts
import { createAdapter } from '@socket.io/redis-adapter';
const pubClient = redis.duplicate();
const subClient = redis.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

#### 2.4 Test setup

`ioredis-mock` pro unit testy; pro e2e může běžet Redis container.

### Akceptace

- 2 BE instance na různých portech vidí stejnou presence
- Ban v jedné instanci se propaguje pub/sub do druhé do 100 ms
- Spuštění bez Redis = graceful degradation? **Otázka:** ne, padá s clear error message (Redis je teď infra dependency).

### Odhad

~6 hodin (2 services + adapter + tests + .env + Docker).

---

## 3. Captcha provider (D-011)

### Současný stav

- Honeypot field implementován (FE skryté pole + BE `@MaxLength(0)` validace)
- Naivní boty odfiltrovány; dedikovaní scraper boti s headless browserem obejdou

### Doporučení: **Cloudflare Turnstile**

Důvody:
- **Privacy-friendly + GDPR compliant** — žádné tracking cookies, žádný uživatelský data sharing s 3rd party
- **Bezplatné** pro unlimited use
- **Bez „I'm not a robot" checkboxu** — invisible-first, friction-free pro hráče
- Cloudflare účet už pravděpodobně máš (DNS / Cloudinary)

Alternativy:
- **hCaptcha** — populární, ale visible checkbox + Cloudflare lepší DX
- **Friendly Captcha** — německé GDPR, ale platí se po prvních 1000 ověření/měs.

### Co potřebuju od tebe

1. **Cloudflare účet** — pokud nemáš, vytvořit (zdarma na cloudflare.com)
2. **Turnstile site key + secret** — vygenerovat v dashboardu Cloudflare → Turnstile → Add site
3. Vložit do `.env`:
   ```
   TURNSTILE_SITE_KEY=0x4AAAAAAAxxxxxxxxxxxx
   TURNSTILE_SECRET=0x4AAAAAAAxxxxxxxxxxxx
   ```

### Implementace (po získání keys)

#### 3.1 FE

```bash
npm install @marsidev/react-turnstile
```

V `RegisterModal.tsx`:

```tsx
import { Turnstile } from '@marsidev/react-turnstile';

<Turnstile
  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
  onSuccess={(token) => setCaptchaToken(token)}
/>
```

#### 3.2 BE

```ts
// auth.service.ts při register:
async verifyCaptcha(token: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET!, response: token }),
  });
  const json = await res.json();
  return json.success === true;
}
```

`RegisterDto` přidá `@IsString() captchaToken: string;`. Pokud `verifyCaptcha` false → 400 `CAPTCHA_FAILED`.

### Akceptace

- Registrace bez Turnstile widgetu nelze (FE povinné pole)
- BE odmítne registraci bez `captchaToken`
- Test prošlý reálnou captchou v Cloudflare dashboardu

### Odhad

~3 hodiny (FE widget + BE verify + DTO + 1 test).

---

## 4. Pořadí rolloutu (doporučené)

1. **Mongo replica set** první — odblokuje 2 dluhy, žádný nový SDK
2. **Redis** druhé — odblokuje 3 dluhy, jeden externí dependency
3. **Captcha** poslední — vyžaduje tvé rozhodnutí (provider + účet) + nejmenší tech impact

Každá vrstva je nezávislá — můžou se aplikovat samostatně.

---

## 5. Co potřebuju od tebe pro odstartování

1. **Souhlas** s každou ze tří vrstev — chceš Mongo replica set? Redis? Cloudflare Turnstile?
2. **Cloudflare účet info** (pro captchu) — nemusíš sdílet credentials, jen mě informovat že jsi `.env` zaplnil; já implementuji FE/BE.
3. **Docker-compose** existuje? Pokud ne, máš preferenci jak provozovat dev infrastrukturu (lokální `mongod` + `redis-server` přes scoop/choco)?

Po odpovědích zapíšu implementační plán pro každou vrstvu a pojedu rollout.

---

## 6. Co je mimo scope (pro pozdější)

- **Mongo cluster v produkci** (3-node replica set) — tohle spec řeší jen dev. Produkční replica set je samostatný DevOps spec.
- **Redis sentinel / cluster** — jednoinstance je OK pro Ikaros scale; sentinel až při milionech requests/min.
- **Captcha A/B test** — Turnstile vs. hCaptcha measurement; doporučuju startovat s jedním.
