# Plán 1.3a — Profil (self-edit)

**Datum:** 2026-05-08
**Status:** ⏳ Čeká na schválení
**Spec:** `docs/arch/phase-1/spec-1.3a.md` ✅
**Pořadí prací:** BE → FE → Asset pipeline → Tests

---

## 0. Aktualizace specu na základě BE reality

Při průzkumu BE jsem zjistil dvě skutečnosti, které mění implementační detaily (ne scope):

**A) BE je MongoDB / Mongoose, ne TypeORM / PostgreSQL.**
- Spec uváděl `@Entity` a `@Column` — ve skutečnosti jsou `@Prop()` v `user.schema.ts`
- **Žádné migrace** — Mongoose dynamicky přidá nullable pole při deployi nového kódu (existující dokumenty zůstanou bez nich, repo defaults dohrají)
- TypeORM repository pattern je v BE skutečnosti `BaseMongoRepository` (Mongoose wrapper)

**B) BE už používá Cloudinary** (`backend/src/modules/upload/upload.service.ts`).
- **Žádný `sharp` na BE**, žádné `/uploads` directory, žádný `ServeStaticModule`
- WebP konverze a resize → **Cloudinary URL transformations** (`f_webp,q_85,c_fill,w_512,h_512` v URL při delivery) — efektivnější než server-side
- **Dluh D-015** (Migrace `/uploads` na S3/Cloudinary) → **vyřešen** (BE už tam je)
- Storage class `MediaUploadService` ze specu **nepotřebujeme** — reuse existující `UploadService` + dílčí extension pro avatar scope

Tyto dva body **nemění funkční rozsah ani UX** — jen implementační vrstvu. Spec ponechán; tento plán pracuje s BE realitou.

---

## 1. Pre-flight checklist (před start kódu)

### 1.1 BE — ověřit
- [ ] `backend/src/modules/upload/upload.service.ts` umí přijmout `Buffer` + scope tag a vrátit Cloudinary URL
- [ ] Cloudinary credentials v `.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- [ ] `multer` config (memory storage) v upload modulu

### 1.2 FE — ověřit
- [ ] `react-colorful` instalovat: `npm i react-colorful`
- [ ] Existující `Card`, `IkarosCard`, `Button`, `Input`, `Modal`, `Spinner`, `Badge` exportované z `src/components/ui/index.ts`
- [ ] Zdrojové ikonky v `assets-source/default-avatars/{female,male,being}.png` ✅ (uloženy)

### 1.3 Asset pipeline
- [ ] Skript `scripts/optimize-default-avatars.mjs` (sharp resize 512 + 256 → WebP) — viz §4
- [ ] `npm run defaults:optimize` v `package.json`

---

## 2. Backend — pořadí kroků

> **STAV (2026-05-16): BE část dohnána dodatečně — viz dluh D-073.** Tato sekce
> se původně neimplementovala; FE (§3+) se postavil proti neexistujícímu BE.
> Dohnáno: §2.1 schema, §2.2 DTO, §2.3 (bez worldsCount agregátu — FE ho
> nepotřebuje), §2.4 `@Patch('me')`, §2.6 avatar endpointy, §2.7 `lastLoginAt`.
> §2.5 `changePassword` už existoval dřív (`PUT /users/password`).

> Pracovní adresář BE: `C:\Matrix\ProjektIkaros\Projekt-ikaros\backend`

### 2.1 Rozšířit `user.schema.ts`

`backend/src/modules/users/user.schema.ts` — přidat `@Prop()`:

```ts
@Prop() city?: string;                                        // 0-100
@Prop() bio?: string;                                          // 0-1000
@Prop({ type: String, enum: ['male', 'female', 'being'], default: 'male' })
defaultAvatarType: 'male' | 'female' | 'being';
@Prop() characterName?: string;                                // 0-64
@Prop() characterBio?: string;                                 // 0-1000
@Prop() characterAvatarUrl?: string;
@Prop({ default: '#FFFFFF' }) chatColor: string;               // hex incl #
@Prop() themeId?: string;
@Prop({ default: false }) emailVerified: boolean;
@Prop({ type: Date }) lastLoginAt?: Date;
@Prop({ type: Date }) usernameChangedAt?: Date;                // pro 1.3b
```

**Pozn.:** `displayName` a `avatarUrl` už existují — neduplikuji. Nepoužitá pole `profileImageUrl`, `characterPath`, `ikarosSkin`, `themeSettings`, `chatPreferences` ponechat (legacy z předchozí inkarnace; cleanup dluh D-019).

### 2.2 Rozšířit `UpdateUserDto`

`backend/src/modules/users/dto/update-user.dto.ts` — přidat:

```ts
@IsOptional() @IsString() @MaxLength(100) city?: string;
@IsOptional() @IsString() @MaxLength(1000) bio?: string;
@IsOptional() @IsIn(['male', 'female', 'being']) defaultAvatarType?: 'male' | 'female' | 'being';
@IsOptional() @IsString() @MaxLength(64) characterName?: string;
@IsOptional() @IsString() @MaxLength(1000) characterBio?: string;
@IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/) chatColor?: string;
@IsOptional() @IsString() @MaxLength(64) themeId?: string;
```

**`email` ani `username` v DTO NEPŘIDÁVAT** — controller je už blokuje (1.7 / 1.3b).

**Whitelist transform:** `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))` — ověřit v `main.ts` že je zapnuté. Pokud ano, `email`/`username` v PATCH bodyu → 400. Pokud ne, přidat (rozhoduje o akceptačním kritériu §6.9 v specu).

### 2.3 `GET /users/me` — worldsCount agregát

`backend/src/modules/users/users.service.ts` — nová metoda:

```ts
async getMe(userId: string): Promise<MeResponse> {
  const user = await this.usersRepo.findById(userId);
  if (!user) throw new NotFoundException();
  const worldsCount = await this.worldsRepo.countByUserId(userId);
  return this.toMeResponse(user, worldsCount);
}

private toMeResponse(user: User, worldsCount: number): MeResponse {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    displayName: user.displayName ?? null,
    city: user.city ?? null,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    defaultAvatarType: user.defaultAvatarType ?? 'male',
    characterName: user.characterName ?? null,
    characterBio: user.characterBio ?? null,
    characterAvatarUrl: user.characterAvatarUrl ?? null,
    chatColor: user.chatColor ?? '#FFFFFF',
    themeId: user.themeId ?? null,
    emailVerified: user.emailVerified ?? false,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    worldsCount,
  };
}
```

`backend/src/modules/worlds/worlds.repository.ts` — přidat:
```ts
async countByUserId(userId: string): Promise<number> {
  return this.worldMembershipModel.countDocuments({ userId }).exec();
}
```

`UsersController.getMe()` → změnit z `findById` na `getMe(userId)`.

### 2.4 `PATCH /users/me` — refactor + whitelist

`backend/src/modules/users/users.controller.ts`:

- Aktuální controller bere DTO a deleguje `usersService.update()`. Zachovat.
- Přidat guard: pokud body obsahuje `email` nebo `username` → `BadRequestException({ code: 'FIELD_NOT_ALLOWED' })`
- Volitelně: rovnou whitelist přes ValidationPipe (preferable — globální config v main.ts)
- `usersService.update()` aktualizuje pouze pole z DTO; prázdný string → `null` (Mongoose `$unset`)

Response: po update vrátit `getMe()` shape (refresh worldsCount není nutný, ale konzistence — vrať plnou response).

### 2.5 `PATCH /users/me/password` — nový endpoint

`backend/src/modules/users/dto/change-password.dto.ts`:
```ts
export class ChangePasswordDto {
  @IsString() @MinLength(6) @MaxLength(128) currentPassword: string;
  @IsString() @MinLength(6) @MaxLength(128) newPassword: string;
}
```

`UsersController`:
```ts
@Patch('me/password')
@UseGuards(JwtAuthGuard)
async changePassword(@CurrentUser() user, @Body() dto: ChangePasswordDto) {
  return this.usersService.changePassword(user.id, dto);
}
```

`UsersService.changePassword(id, dto)`:
1. Načti `User` se `passwordHash`
2. `bcrypt.compare(dto.currentPassword, user.passwordHash)` → false → `UnauthorizedException({ code: 'INVALID_PASSWORD' })`
3. `passwordHash = await bcrypt.hash(dto.newPassword, 12)`
4. `usersRepo.save(user)`
5. Inject `RefreshTokenRepository`, volat `revokeAllForUser(userId, exceptJti?)` — vyhodí ostatní zařízení
6. Return `{ success: true }`

**Aktuální session zůstává** — JWT access token nemá důvod expirovat dřív; pokud aktuální `refreshToken.jti` je předán z guardu, lze ho vyloučit z revoke (současné zařízení nezruší).

### 2.6 Avatar upload endpointy

`UsersController`:

```ts
@Post('me/avatar')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
async uploadAvatar(@CurrentUser() user, @UploadedFile() file): Promise<{ avatarUrl: string }> {
  if (!file) throw new BadRequestException({ code: 'NO_FILE' });
  if (!file.mimetype.startsWith('image/')) throw new BadRequestException({ code: 'INVALID_TYPE' });

  // Reuse UploadService (Cloudinary)
  const result = await this.uploadService.uploadBuffer(file.buffer, {
    folder: `ikaros/users/${user.id}/avatar`,
    publicId: 'main',  // overwrite, žádné orphan files
    transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'auto' }],
    format: 'webp',
  });

  await this.usersService.update(user.id, { avatarUrl: result.secureUrl });
  return { avatarUrl: result.secureUrl };
}

@Post('me/character/avatar')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
async uploadCharacterAvatar(@CurrentUser() user, @UploadedFile() file): Promise<{ characterAvatarUrl: string }> {
  if (!file) throw new BadRequestException({ code: 'NO_FILE' });
  if (!file.mimetype.startsWith('image/')) throw new BadRequestException({ code: 'INVALID_TYPE' });

  const result = await this.uploadService.uploadBuffer(file.buffer, {
    folder: `ikaros/users/${user.id}/character`,
    publicId: 'main',
    transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'auto' }],
    format: 'webp',
  });

  await this.usersService.update(user.id, { characterAvatarUrl: result.secureUrl });
  return { characterAvatarUrl: result.secureUrl };
}

@Delete('me/avatar')
@UseGuards(JwtAuthGuard)
async deleteAvatar(@CurrentUser() user) {
  if (user.avatarUrl) await this.uploadService.deleteByUrl(user.avatarUrl);
  await this.usersService.update(user.id, { avatarUrl: null });
  return { success: true };
}

@Delete('me/character/avatar')
@UseGuards(JwtAuthGuard)
async deleteCharacterAvatar(@CurrentUser() user) {
  if (user.characterAvatarUrl) await this.uploadService.deleteByUrl(user.characterAvatarUrl);
  await this.usersService.update(user.id, { characterAvatarUrl: null });
  return { success: true };
}
```

**Pokud `UploadService` nemá `uploadBuffer(buffer, opts)` API** — přidat tenkou metodu nad existující Cloudinary SDK volání. Reuse existující auth (env-based).

**`publicId: 'main'` strategie** — každý další upload přepíše předchozí stejným public_id → žádné orphan soubory v Cloudinary.

### 2.7 Login + register: `lastLoginAt`

`backend/src/modules/auth/auth.service.ts`:

- `login()` po `validateCredentials` → před `issueTokens`: `await this.usersRepo.updateLastLogin(user.id, new Date())`
- `register()` po vytvoření usera → `await this.usersRepo.updateLastLogin(newUser.id, new Date())`

`UsersRepository`:
```ts
async updateLastLogin(id: string, at: Date): Promise<void> {
  await this.userModel.updateOne({ _id: id }, { $set: { lastLoginAt: at } });
}
```

### 2.8 BE testy

Pořadí:
1. `users.service.spec.ts` — `getMe` (worldsCount), `update` (whitelist polí), `changePassword` (bcrypt + revoke)
2. `users.controller.spec.ts` — `GET /me` shape, `PATCH /me` rejects email/username
3. `users.e2e-spec.ts` — full flow: login → GET /me → PATCH /me → GET /me; upload avatar (mock Cloudinary); change password (real bcrypt)
4. `auth.service.spec.ts` — login/register nastavují `lastLoginAt`

---

## 3. Frontend — pořadí kroků

> Pracovní adresář FE: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE`

### 3.1 Rozšířit typ `User`

`src/types/index.ts:16` — rozšířit `User` o všechna nová pole (viz spec §3.2 `MeResponse`). Sekundárně projít TS errors v repo (kde se čte `currentUser.foo`).

### 3.2 `useMyProfile` + `useAuthBootstrap` rozšíření

Nový hook:
```ts
// src/api/hooks/useProfile.ts
export function useMyProfile() {
  const accessToken = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.get<MeResponse>('/users/me'),
    enabled: !!accessToken,
    staleTime: 30_000,
  });
}
```

`useAuthBootstrap` (`src/api/hooks/useAuth.ts:100-138`):
- Zachovat JWT decode (rychlý optimistic state)
- Po decode: zavolat `useMyProfile` interně (nebo expose ve `useAuthBootstrap` druhou fází) → po úspěchu `setCurrentUser(meResponse)`

**D-005 vyřešen.**

### 3.3 Mutation hooky

```ts
// src/api/hooks/useProfile.ts
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateMeRequest) => api.patch<MeResponse>('/users/me', dto),
    onSuccess: (data) => {
      qc.setQueryData(['users', 'me'], data);
      getDefaultStore().set(currentUserAtom, data);
      toast.success('Profil uložen');
    },
  });
}

export function useUpdatePassword() { /* viz spec §4.4 */ }

export function useUploadAvatar(scope: 'user' | 'character') {
  const qc = useQueryClient();
  const url = scope === 'user' ? '/users/me/avatar' : '/users/me/character/avatar';
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post<{ avatarUrl?: string; characterAvatarUrl?: string }>(url, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Avatar aktualizován');
    },
  });
}

export function useDeleteAvatar(scope: 'user' | 'character') { /* analog */ }
```

**Multipart v `api.client`** — Axios automaticky nastaví `Content-Type: multipart/form-data` při FormData payloadu. Ověřit, že interceptor neoverridne.

### 3.4 ProfilePage — implementace

`src/pages/ikaros/ProfilePage.tsx` — aktuálně stub, kompletně přepsat:

```
ProfilePage
├── ProfileSidebar (desktop only ≥768px)
├── ProfileHeader (vždy nahoře)
└── ProfileSections
    ├── BioSection
    ├── CharacterSection
    ├── WorldsSection
    ├── CommunityPlaceholders (diskuze/články/galerie)
    ├── AppearanceSection
    ├── SecuritySection
    └── AccountSection
```

CSS modul `ProfilePage.module.css` — grid layout, mobile stack.

### 3.5 ProfileHeader

`src/pages/ikaros/profile/ProfileHeader.tsx` — wrapped v `<IkarosCard variant="welcome">` (reuse, theme-aware ornamenty):

Layout viz spec §5.1 (avatar 128px + sloupce s polemi). Email read-only s tooltipem.

### 3.6 EditCard wrapper

`src/components/ui/EditCard/EditCard.tsx` — společná struktura per spec §4.3. Sdílená napříč všemi sekcemi pro DRY save/cancel/dirty handling.

### 3.7 Sekce (po pořadí)

1. **BioSection** (`src/pages/ikaros/profile/BioSection.tsx`) — read view: text nebo „Zatím nic nenapsáno"; edit: textarea max 1000 + counter; save → `useUpdateProfile({ bio })`
2. **CharacterSection** (`character/CharacterSection.tsx`) — 3 pole (name + bio + avatar); avatar přes `<AvatarUploader scope="character" />`
3. **WorldsSection** — read-only, použij existující `useMyWorlds` z 0.5; klik = `navigate('/svet/' + slug)`
4. **CommunityPlaceholders** — 3 prázdné karty „Bude dostupné v dalším updatu" (žádné requesty)
5. **AppearanceSection** — globální motiv (link na ThemeSwitcher) + `<ChatColorPicker>` (react-colorful + sync hex input)
6. **SecuritySection** — change password formulář (RHF + zod, reuse `passwordStrength` z 1.2); username field disabled + tooltip
7. **AccountSection** — tlačítko „Smazat účet" disabled + tooltip „Připravujeme (1.3c)"

Každá sekce má vlastní zod schema v `src/pages/ikaros/profile/schemas.ts`.

### 3.8 `UserAvatar` komponenta + default avatary

`src/components/ui/UserAvatar/UserAvatar.tsx` — viz spec §4.5; default fallback = `/defaults/avatars/{type}.webp`.

`src/components/ui/AvatarUploader/AvatarUploader.tsx` — drag&drop + file input + preview + upload progress; client-side validace (typ, ≤5 MB).

### 3.9 Color picker

`src/pages/ikaros/profile/ChatColorPicker.tsx`:

```tsx
import { HexColorPicker } from 'react-colorful';

export function ChatColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.wrapper}>
      <HexColorPicker color={value} onChange={onChange} />
      <input
        type="text"
        value={value}
        onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
        pattern="^#[0-9A-Fa-f]{6}$"
        maxLength={7}
      />
      <div className={styles.preview} style={{ color: value }}>Tvé zprávy budou vypadat takto</div>
    </div>
  );
}
```

### 3.10 IkarosLayout header — dynamic avatar

`src/components/layout/IkarosLayout/IkarosLayout.tsx:330` — nahradit:

```tsx
{user.avatarUrl ? <img /> : <span>initials</span>}
```

za:
```tsx
<UserAvatar src={user.avatarUrl} defaultType={user.defaultAvatarType} size="sm" alt={user.username} />
```

### 3.11 Theme propojení s BE

`src/themes/useThemeSync.ts` (existuje z 1.0 hybrid sync) — rozšířit o BE write-back přes `PATCH /users/me { themeId }`. Ověřit, že existující graceful 404 handling funguje (BE už podporuje `themeId` field).

**D-003 / D-004 vyřešeno.**

### 3.12 Router

`src/router.tsx:103` — `ikaros/profil` route už existuje (s `requireAuth` loader + lazy `ProfilePage`). Žádná změna.

### 3.13 FE testy + Storybook

Pořadí:
1. `profileSchemas.spec.ts` — zod per sekce
2. `useProfile.spec.ts` — hooky, atomy, invalidace
3. `UserAvatar.spec.tsx` — fallback per type
4. `AvatarUploader.spec.tsx` — drag&drop, size limit, type rejection
5. `ChatColorPicker.spec.tsx` — sync color ↔ text input
6. `BioSection.spec.tsx`, `CharacterSection.spec.tsx`, `AppearanceSection.spec.tsx`, `SecuritySection.spec.tsx`
7. `ProfilePage.spec.tsx` — render, requireAuth, loading
8. Storybook stories: `ProfilePage/{Default,Empty,EditingBio,UploadingAvatar,PasswordError}`

---

## 4. Asset pipeline — default avatary

### 4.1 Skript

`scripts/optimize-default-avatars.mjs`:
```js
import sharp from 'sharp';
import { glob } from 'glob';
import path from 'node:path';

const SRC = 'assets-source/default-avatars';
const OUT = 'public/defaults/avatars';

await fs.mkdir(OUT, { recursive: true });

for (const type of ['female', 'male', 'being']) {
  const input = path.join(SRC, `${type}.png`);
  await sharp(input).resize(512, 512, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.join(OUT, `${type}.webp`));
  await sharp(input).resize(256, 256, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.join(OUT, `${type}-sm.webp`));
}
```

### 4.2 `package.json` script

```json
"defaults:optimize": "node scripts/optimize-default-avatars.mjs"
```

### 4.3 Spustit

```bash
npm run defaults:optimize
```

Outputy commitnout do gitu (jako u themes — `public/themes/...`).

### 4.4 CI guard (volitelné, doplnit jako v `themes:optimize`)

Skript který zkontroluje, že `public/defaults/avatars/*.webp` matchuje hash zdrojů — pokud zdroje změníme bez znovuoptimalizace, CI selže.

---

## 5. Acceptance verification (smoke test)

Po dokončení BE + FE:

1. **BE smoke** — `curl` / Postman:
   - `POST /api/auth/login` → access token
   - `GET /api/users/me` → ověřit nový shape (worldsCount, lastLoginAt, …)
   - `PATCH /api/users/me` body s `{ city: "Praha", chatColor: "#FF0000" }` → 200, response s novými hodnotami
   - `PATCH /api/users/me` body s `{ email: "x@y.cz" }` → 400
   - `PATCH /api/users/me/password` happy + bad current
   - `POST /api/users/me/avatar` PNG → 200 + Cloudinary URL končící `.webp`
2. **FE smoke** — dev server (`npm run dev`):
   - Otevřít `/ikaros/profil` přihlášen → header karta + sekce vidět
   - Upravit bio, uložit → toast, read view
   - Změnit chatColor → header swatch update
   - Upload avatar → preview → submit → header avatar v IkarosLayout taky update
   - Změnit heslo → toast + ostatní zařízení odhlášena
   - Prohnat skill `mobil-desktop` (per `base.md`)

---

## 6. Deploy checklist

- [ ] BE: `npm run lint && npm run test && npm run test:e2e` ✅
- [ ] FE: `npm run lint && npm run test && npm run build` ✅
- [ ] FE: `npm run defaults:optimize` ✅ (committed assets)
- [ ] FE: `npm run lint:colors` (per `base.md` — žádné hardcoded barvy mimo theme tokeny)
- [ ] FE: skill `mobil-desktop` prošel
- [ ] BE: Cloudinary credentials v deploy ENV
- [ ] BE: nový soubor `package.json` (žádné nové deps na BE — Cloudinary už je)
- [ ] FE: `react-colorful` v `package.json`

---

## 7. Známé otevřené body po 1.3a

Tyto body nejsou blokující pro 1.3a, ale tracked jako nové dluhy:

- **D-019** — Cleanup legacy User polí (`profileImageUrl`, `characterPath`, `ikarosSkin`, `themeSettings`, `chatPreferences`) z user.schema.ts. Ponecháváme dokud nebude jasné, že je nikdo nečte (analýza repo + BE log).
- **D-020** — Deduplikace JWT payload vs `/users/me` shape (JWT má jen základ; client se spoléhá na drugou fázi hydratace). Pro robustnost: explicitně nezapisovat `currentUser` z JWT, jen z `/me` query.

---

## 8. Po schválení tohoto plánu

Začínám kódovat **v pořadí** §1 → §2 → §3 → §4 → §5. Každá sekce uzavřená committem (atomické PR / postupné push). Po §5 (smoke test) volám tě k akceptaci, pak §6 deploy checklist.
