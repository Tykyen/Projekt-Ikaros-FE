# Spec 1.2d — BE env cleanup (D-013)

**Status:** Draft — čeká na schválení
**Rozsah:** drobnost, jen BE; `backend/.env.example` rozšíření + dokumentační komentáře
**Repo:** `C:\Matrix\ProjektIkaros\Projekt-ikaros` (backend)
**Branch BE:** `feat/krok-1.2-registrace` (stejný jako FE)
**Autor:** PJ + Claude
**Datum:** 2026-05-08

---

## 1. Cíl

Vyčistit dluh **D-013** v BE repu:
- `backend/.env.example` musí obsahovat **všechny** env proměnné, které BE skutečně používá (ne jen některé).
- Každá proměnná má mít komentář k účelu.
- `JWT_SECRET` placeholder doplnit instrukcí na generaci silného secretu.

Tento spec **není** o:
- Joi schema validation (krok 2 z původního dluhu) — větší rozhodnutí, samostatná drobnost po dnešní iteraci.
- Generaci skutečných prod secrets (krok 3) — to je deployment task, ne kódový dluh.

---

## 2. Kontext — proč to teď

- Při krocích 1.1 / 1.2 se zjistilo, že BE crashuje 500, pokud chybí `JWT_REFRESH_SECRET`. E2E testy mají vlastní fallback (`test-secret-refresh`), runtime na :3000 selhával.
- `.env.example` aktuálně obsahuje jen 7 proměnných, ale BE reálně čte **11+**:
  - Chybí: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (push notifications)
  - Chybí: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (image upload)
- Bez kompletního `.env.example` jiný vývojář (nebo nový PR reviewer, AI agent, deployment skript) nemá jak zjistit, co je potřeba nastavit.
- `JWT_SECRET=change-this-secret-in-production` je jasně placeholder, ale chybí pokyn, **jak** vygenerovat skutečný secret.

---

## 3. Audit současného stavu

### 3.1 `backend/.env.example` (aktuální obsah, 8 ř.)

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ikaros
JWT_SECRET=change-this-secret-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=change-this-different-secret-in-production
JWT_REFRESH_TTL_DAYS=30
FRONTEND_URL=http://localhost:5173
```

### 3.2 `backend/.env` (skutečně lokální, NE committed) — pro porovnání

Obsahuje navíc `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Cloudinary chybí (push send pravděpodobně funguje, image upload v dev možná disabled / using placeholder).

### 3.3 Skutečně konzumované env vars v BE source

Audit přes `grep -r "process.env" + "config.get"`:

| Proměnná | Kde čtena | Required? | Kategorie |
|---|---|---|---|
| `MONGODB_URI` | `database/database.module.ts:10` | ✅ throw v prod | Database |
| `JWT_SECRET` | `auth.module.ts:24`, `auth/strategies/jwt.strategy.ts:12` | ✅ throw | Auth |
| `JWT_EXPIRES_IN` | `auth.module.ts:29` | optional (default `7d`) | Auth |
| `JWT_REFRESH_SECRET` | `auth.service.ts:35` | ✅ throw | Auth |
| `JWT_REFRESH_TTL_DAYS` | `auth.service.ts:207` | optional (default `30`) | Auth |
| `PORT` | `main.ts` (Nest default) + `app.controller.ts` | optional (default `3000`) | Runtime |
| `FRONTEND_URL` | `app.controller.ts`, CORS | optional | Runtime |
| `VAPID_PUBLIC_KEY` | `push/push.service.ts:28,34` | ✅ pro push | Push |
| `VAPID_PRIVATE_KEY` | `push/push.service.ts:29` | ✅ pro push | Push |
| `VAPID_SUBJECT` | `push/push.service.ts:27` | ✅ pro push | Push |
| `CLOUDINARY_CLOUD_NAME` | `upload/upload.service.ts:40`, `images/images.controller.ts:13` | ✅ pro upload | Cloudinary |
| `CLOUDINARY_API_KEY` | `upload/upload.service.ts:41` | ✅ pro upload | Cloudinary |
| `CLOUDINARY_API_SECRET` | `upload/upload.service.ts:42` | ✅ pro upload | Cloudinary |

V `app.controller.ts` (health endpoint) už existuje koncept "required envs":
```ts
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN'];
const CLOUDINARY_KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const VAPID_KEYS = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'];
```
→ Tato seznamy jsou source of truth pro to, co `.env.example` musí obsahovat (minimálně).

### 3.4 Co chybí

V `.env.example` chybí **6 proměnných** (3× VAPID, 3× Cloudinary). Navíc žádná proměnná nemá komentář k účelu.

---

## 4. Návrh řešení

### 4.1 Nový obsah `backend/.env.example`

Sekce komentované, sekce seskupené podle logiky:

```env
# ─── Runtime ──────────────────────────────────────────────────────────────
# Port HTTP serveru (default 3000).
PORT=3000

# URL frontendu — používá se pro CORS a redirecty.
FRONTEND_URL=http://localhost:5173

# ─── Database ─────────────────────────────────────────────────────────────
# MongoDB connection string. V production prostředí MUSÍ být explicitně nastaveno
# (BE crashuje při startu, pokud chybí).
MONGODB_URI=mongodb://localhost:27017/ikaros

# ─── Auth (JWT) ───────────────────────────────────────────────────────────
# Tajný klíč pro podepisování access tokenů. V produkci vygenerovat:
#   openssl rand -hex 32
# NIKDY necommitovat skutečný produkční secret do gitu.
JWT_SECRET=change-this-secret-in-production

# Životnost access tokenu (formát zod-style: '7d', '15m', '24h'). Default 7d.
JWT_EXPIRES_IN=7d

# Tajný klíč pro podepisování refresh tokenů. MUSÍ být odlišný od JWT_SECRET.
# V produkci vygenerovat: openssl rand -hex 32
JWT_REFRESH_SECRET=change-this-different-secret-in-production

# Životnost refresh tokenu ve dnech. Default 30.
JWT_REFRESH_TTL_DAYS=30

# ─── Push notifications (Web Push / VAPID) ────────────────────────────────
# Vygenerovat: npx web-push generate-vapid-keys
# Bez těchto klíčů push notifikace nefungují (BE startne, ale push moduly selžou).
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@ikaros.cz

# ─── Image upload (Cloudinary) ────────────────────────────────────────────
# Credentials z https://cloudinary.com/console — Account Details.
# Bez těchto image upload (galerie, avatary, articles attachments) nefunguje.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4.2 Klíčová rozhodnutí

- **Hodnoty placeholderů zůstávají prázdné** pro `VAPID_*`, `CLOUDINARY_*` a `*_SECRET`. Žádné fake hodnoty (jako `dev-refresh-secret-change-me-d8f3a92e4b1c70a1e9b264f5cd83ba1f` v reálném `.env`) — `.env.example` má být **šablona**, ne working dev konfig.
- **`JWT_SECRET` necháváme `change-this-secret-in-production`** s komentářem, jak vygenerovat. Funkčně je to placeholder, který BE načte (nehází 500), ale je vidět, že není OK.
- **Komentáře v češtině** — soulad se zbytkem projektu (CLAUDE.md, dokumentace).
- **Žádné odstranění z `.env`** — nic neměníme v lokálním vývojářském `.env`. Pouze rozšiřujeme `.env.example`.

### 4.3 Out of scope

- **Joi schema validation** (krok 2 z dluhu): `ConfigModule.forRoot({ validationSchema: Joi.object({...}) })` by zajistil fail-fast při startu místo runtime 500. Přidává `joi` jako dep + ~30 ř. konfigurace. Návrh: **nový dluh D-015**, samostatná drobnost po 1.2d.
- **Generace skutečných prod secrets** (krok 3): deployment task, ne kódová změna. Zůstává v dluhu jako "TODO před prod nasazením".
- **`.gitignore` audit pro `.env`**: ověřím, že `.env` je v `.gitignore` (předpokládám ano), ale neopravuju, pokud je problém — to je samostatná bezpečnostní záležitost.

---

## 5. Acceptance kritéria

1. ✅ `backend/.env.example` obsahuje **všech 13 proměnných** (PORT, FRONTEND_URL, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_TTL_DAYS, 3× VAPID, 3× CLOUDINARY).
2. ✅ Každá sekce má hlavičkový komentář (`# ─── Runtime ───`, `# ─── Database ───`, atd.).
3. ✅ JWT_SECRET má komentář s `openssl rand -hex 32` instrukcí.
4. ✅ VAPID block má komentář s `npx web-push generate-vapid-keys` instrukcí.
5. ✅ CLOUDINARY block má odkaz na Cloudinary console URL.
6. ✅ `dluhy.md` má **D-013** přesunutý do "Uzavřené" s odkazem na 1.2d, **NEBO** zúžený s poznámkou "kroky 2 (Joi) a 3 (prod secrets) zůstávají" — viz otázka v sekci 8.
7. ✅ Nový dluh **D-015** (Joi config validation) přidán do "Otevřené" v `dluhy.md` (pokud user souhlasí s odložením kroku 2).
8. ✅ `.env` v BE repu zůstává nezměněný (jen `.env.example` se mění).
9. ✅ `.gitignore` ověřeno — `.env` ne `.env.example` je tam (jen check, neoprava).

---

## 6. Test plán

**Manuální:**
1. Otevřít `.env.example` — vizuálně překontrolovat strukturu (sekce, komentáře, prázdné placeholdery).
2. `npm run start:dev` (BE) — startuje normálně z původního `.env` (žádná regrese).
3. `git diff backend/.env` — žádná změna (jen example se mění).
4. `git ls-files | grep .env` — `.env.example` ano, `.env` ne (gitignore funguje).

**Automated:** žádný nový test. Existující BE test suite (`npm test`) musí projít beze změny — nic v kódu se nemění.

---

## 7. Změny v souborech

| Soubor | Druh změny | Velikost |
|---|---|---|
| `backend/.env.example` | Rozšíření z 8 ř. na ~40 ř. (komentáře + 6 nových proměnných) | ~+32 ř. |
| `docs/dluhy.md` (FE repo) | D-013 → Uzavřené (nebo update), nový D-015 | ~+15 / -10 ř. |
| `docs/arch/phase-1/spec-1.2d-be-env-cleanup.md` (FE repo) | Tento dokument | nový |

**Žádný produkční kód se nemění.** Jen dokumentace + šablona.

---

## 8. Otázky k autorovi

1. ✅ Souhlasíš s out-of-scope rozhodnutím o **Joi validation** (krok 2 dluhu) — přejmenuju na nový dluh **D-015**, neřeším teď?
2. ✅ Souhlasíš s out-of-scope **prod secrets** (krok 3) — zůstává jako TODO note, ne kódový dluh?
3. ✅ Souhlasíš s tím, že **`.env.example` má prázdné placeholdery pro secrets/keys** (žádné fake hodnoty)?
4. ✅ Komentáře v `.env.example` v **češtině** — OK, nebo preferuješ angličtinu (mezinárodní open-source konvence)?

---

## 9. Riziko & rollback

- **Riziko:** žádné — měníme jen šablonu, ne živý `.env`. Žádný produkční kód.
- **Rollback:** revert jednoho commitu v BE repu.

---

## 10. Komit & branche

- BE repo, branch `feat/krok-1.2-registrace` (stejná jako FE — paralelní práce).
- Jeden commit: `chore(env): rozšíření .env.example o všechny používané proměnné (D-013)`.
- Po commitu push na BE remote — koordinace s PJ.

---

**Po schválení specu napíšu implementační plán s přesným diffem.**
