# Spec — Superadmin seed (Tyky účet)

**Datum:** 2026-05-08
**Status:** ⏳ Čeká na schválení
**Související:** `docs/arch/phase-1/spec-1.2.md` (Registrace) — paralelní práce, nezávislé
**Typ:** Jednorázová BE úloha (idempotentní skript)

---

## 1. Cíl

Vytvořit **první trvalý Superadmin účet** v BE databázi (uživatel `Tyky`) ještě před tím, než se rozjede registrace pro veřejnost. Tento účet bude PJ / vlastník platformy používat pro správu, testování a admin operace.

Nutno udělat **bezpečně** — heslo nikdy nesmí být committed do gitu, ani logované v plain textu.

---

## 2. Rozsah

### V rozsahu
- Nový BE skript `backend/scripts/seed-superadmin/index.ts`
- Nový npm script `npm run seed:superadmin` v `backend/package.json`
- Skript je **idempotentní** — při opakovaném spuštění:
  - Pokud uživatel s `email` neexistuje → vytvoří
  - Pokud existuje → updatuje pouze `role` na `Superadmin` (heslo NEpřepisuje)
  - Existence se kontroluje podle `email` (jednoznačný klíč)

### Mimo rozsah
- UI tooling pro admin role management → krok 12.1 Platform admin
- Multi-superadmin / batch seed → out of scope, řeš ad-hoc
- Reset hesla skriptem → bude řešeno přes 1.7 Reset hesla nebo `logoutAll`+manual DB

---

## 3. Skript — design

### 3.1 Cesta a struktura
```
backend/scripts/seed-superadmin/
└── index.ts
```

(Sleduje pattern existujících skriptů — `backend/scripts/parity-check/index.ts`, `backend/scripts/migrate-world-news/index.ts`.)

### 3.2 Vstupy přes ENV proměnné

```bash
SEED_SUPERADMIN_EMAIL=...      # povinné
SEED_SUPERADMIN_USERNAME=...   # povinné
SEED_SUPERADMIN_PASSWORD=...   # povinné, NIKDY neukládat do .env (committed)
MONGODB_URI=...                # už v .env z normálního BE běhu
```

**Heslo se předává out-of-band:**
- buď inline: `SEED_SUPERADMIN_PASSWORD='...' npm run seed:superadmin` (PowerShell: `$env:SEED_SUPERADMIN_PASSWORD='...'; npm run seed:superadmin`)
- nebo přes `.env.local` (gitignored — ověřit, že `.gitignore` má `.env.local` / `.env.*.local`)

Skript při startu zkontroluje přítomnost všech tří env proměnných; pokud chybí → exit 1 + stručná hláška, **nikdy** nelogovat hodnotu hesla.

### 3.3 Validace vstupů

Skript validuje stejnými constraints jako BE `RegisterDto`:
- `email` → musí obsahovat `@`, max 255 znaků (jednoduchá kontrola; nechci závislost na class-validator v skriptu)
- `username` → 3–32 znaků, **bez `@`** (regex `/^[^@]+$/`)
- `password` → min 6, max 128 znaků

Pokud nějaký selže → exit 1 + chybová hláška **bez echa hesla**.

### 3.4 Tok skriptu

```ts
// backend/scripts/seed-superadmin/index.ts (pseudocode)
async function main() {
  const { email, username, password } = readEnvOrExit();
  validateOrExit({ email, username, password });

  await mongoose.connect(process.env.MONGODB_URI);
  const UserModel = mongoose.model<User>('User', userSchema);

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role === UserRole.Superadmin) {
      console.log(`✓ Uživatel ${email} už je Superadmin — žádná změna.`);
    } else {
      existing.role = UserRole.Superadmin;
      await existing.save();
      console.log(`✓ Uživatel ${email} povýšen na Superadmin.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await UserModel.create({
      email: email.toLowerCase(),
      username,
      passwordHash,
      role: UserRole.Superadmin,
      isOnline: false,
      lastSeenAt: new Date(),
    });
    console.log(`✓ Vytvořen Superadmin: ${username} <${email}>.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Seed selhal:', err.message);  // err.message bez password
  process.exit(1);
});
```

### 3.5 Dependencies
- `mongoose` (už v BE)
- `bcrypt` (už v BE)
- `dotenv` (pro nahrání `.env` / `.env.local` na začátku skriptu — je-li potřeba)
- Nesahám na NestJS DI — skript běží v izolaci, přímo přes Mongoose modely.

### 3.6 npm script
```json
"seed:superadmin": "ts-node scripts/seed-superadmin/index.ts"
```

---

## 4. Bezpečnost

### 4.1 Heslo nikdy nelogovat
- Žádný `console.log(password)` ani vyšší error stack trace, který by ho mohl obsahovat.
- Pokud bcrypt nebo mongoose hodí výjimku, logujeme `err.message` (ne `err`).

### 4.2 Heslo nikdy v gitu
- `.env.local` MUSÍ být v `.gitignore` — ověřit (pokud není, dluh / commit `.gitignore` patch).
- Spec dokumenty (tento i ostatní) **NEOBSAHUJÍ heslo** — bylo předáno out-of-band v konverzaci.

### 4.3 Kontrola, že seed neproběhne náhodně v produkci
- Skript je opt-in (jen ručním `npm run seed:superadmin`).
- **Nepřidávat do `start:prod`, CI/CD, nebo `prepare` hooku.**
- Idempotence znamená, že náhodný re-run nezničí data — jen zajistí role.

---

## 5. Akceptační kritéria

- [ ] `npm run seed:superadmin` s validními env vytvoří uživatele s rolí `Superadmin`
- [ ] Druhé spuštění (uživatel už existuje) **nemění** heslo, jen log "už je Superadmin"
- [ ] Spuštění bez env → exit 1 + hláška "Chybí SEED_SUPERADMIN_*"
- [ ] Spuštění s neplatným email/username → exit 1 + hláška, **bez echa hesla**
- [ ] Login přes `POST /auth/login` s daným identifierem (e-mailem nebo "Tyky") + heslem → 200 + token
- [ ] Login response má `user.role === 'Superadmin'`
- [ ] FE hlavička po loginu Tyky ukazuje "UŽIVATELÉ" link (ne "PŘÁTELÉ") — per role-aware logika z 1.1
- [ ] `.env.local` je v `.gitignore` (ověřeno)
- [ ] Skript obsahuje commentář upozornění "Nepoužívat v produkci automaticky" + dokumentaci v hlavě souboru

---

## 6. Spuštění (instrukce pro PJ)

Po implementaci skriptu:

```bash
# 1) PowerShell (Windows)
$env:SEED_SUPERADMIN_EMAIL = "tykytanjunior@gmail.com"
$env:SEED_SUPERADMIN_USERNAME = "Tyky"
$env:SEED_SUPERADMIN_PASSWORD = "<heslo z konverzace>"
cd C:\Matrix\ProjektIkaros\Projekt-ikaros\backend
npm run seed:superadmin

# 2) Po úspěchu vyčistit env (volitelné, ale doporučené)
Remove-Item Env:SEED_SUPERADMIN_PASSWORD
```

Heslo je předáno **out-of-band** v aktuální konverzaci a nebude nikam committed.

---

## 7. Otevřené body k revizi

- [ ] **`.gitignore` audit** — ověřím při implementaci, že `.env.local` a `.env.*.local` jsou ignorované. Pokud ne, drobný patch.
- [ ] **`UserRole.Superadmin` enum existuje v BE** — ověřím v `users.interface.ts` před implementací (předpokládám ano, dle 1.1 spec §4.3 hlavička s "UŽIVATELÉ" linkem pro Superadmin role).
- [ ] **Mongoose model loading mimo NestJS DI** — chci se ujistit, že `userSchema` je importovatelný samostatně. Pokud je tightly coupled s `@nestjs/mongoose` decorators, ošetřím v plánu.

---

## 8. Po schválení tohoto specu

Implementace je triviální (cca 60 řádků TS) — nepotřebuje samostatný `plan-*.md`. Po schválení rovnou:
1. Napíšu skript
2. Přidám npm script do `backend/package.json`
3. Ověřím `.gitignore`
4. Spustím lokálně se zadanými env (heslo z konverzace)
5. Reportuju výsledek + smažu lokální env

Zbytek (login Tyky účtu z FE) ověřím manuálně po dokončení 1.2.
