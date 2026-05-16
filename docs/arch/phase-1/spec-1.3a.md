# Spec 1.3a — Profil (self-edit)

**Datum:** 2026-05-08
**Status:** ✅ Implementováno
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.3a
**Závisí na:** 1.2 (Registrace) ✅, 1.1 (Login modal) ✅, 1.0 (theme systém) ✅
**Předchází:** 1.3b (Username change + Admin role), 1.3c (Tombstone + cleanup)
**Souvisí s:** D-005 (`/users/me` plnohodnotná hydratace), D-003/D-004 (`User.themeId`)

---

## 1. Cíl

Dát přihlášenému uživateli **`/ikaros/profil`** stránku, kde si edituje vlastní data:
- profilové údaje (displayName, město, bio)
- avatar (upload + 3 default avatary podle pohlaví)
- profil postavy v Rozcestí (jméno, bio, avatar — samostatná sub-entita)
- e-mail (s flagem `emailVerified`, bez povinné verifikace)
- barva chatu (Hospoda + Rozcestí)
- globální motiv
- heslo (sekce Bezpečnost, vyžaduje staré heslo)

Zároveň postavit **`MediaUploadService`** na BE (sharp → WebP konverze, výstupní úložiště) jako crosscutting feature použitelnou napříč moduly.

**Username change** a **smazání účtu** jsou v 1.3a **viditelné jako disabled UI** — implementační logika přijde v 1.3b a 1.3c (linkováno tooltipem "Připravujeme").

---

## 2. Rozsah

### 2.1 V rozsahu 1.3a

**BE:**
- Rozšířit `User` entitu o pole: `displayName`, `city`, `bio`, `avatarUrl`, `defaultAvatarType` (`male` | `female` | `being`), `characterName`, `characterBio`, `characterAvatarUrl`, `chatColor`, `themeId`, `emailVerified`, `lastLoginAt`, `usernameChangedAt` (pole pro 1.3b cooldown — vytvoříme už teď, aby migrace nebyla rozsekaná)
- Migrace s defaulty (existující řádky: `defaultAvatarType: 'male'`, `chatColor: '#FFFFFF'`, `emailVerified: false`)
- `GET /api/users/me` — rozšíření response o všechna nová pole + agregát `worldsCount`
- `PATCH /api/users/me` — pole `displayName`, `city`, `bio`, `chatColor`, `themeId`, `defaultAvatarType`, `characterName`, `characterBio` (**email NE — viz 1.7**)
- `PATCH /api/users/me/password` — `{ currentPassword, newPassword }`, ověř bcrypt, nastav nové, **revokuj rodinu refresh tokenů** (vyhodí ostatní zařízení)
- `POST /api/users/me/avatar` — multipart upload, max 5 MB, typ `image/*`, projde `MediaUploadService` (resize 512×512, WebP), vrací `{ avatarUrl }`
- `POST /api/users/me/character/avatar` — analogicky pro avatar postavy (resize 256×256)
- `DELETE /api/users/me/avatar`, `DELETE /api/users/me/character/avatar` — odstranění (vrací zpět na `defaultAvatarType` resp. žádný avatar postavy)
- **`MediaUploadService`** — interní BE service:
  - vstup: `Buffer` (multer), výstup: `{ url, width, height, sizeBytes }`
  - sharp pipeline: auto-rotate (EXIF), resize (cover, max dimensions), `.webp({ quality: 85 })`
  - storage: lokální filesystem (`/uploads/<scope>/<userId>-<hash>.webp`) v 1.3a; S3 / Cloudinary jako pozdější dluh — interface zachovaný
  - každý nový upload uživatele přepíše předchozí (žádný orphan)
  - mazání předchozího souboru při uploadu nového nebo při delete
- BE testy (níže §7.1)

**FE:**
- Route `/ikaros/profil` (lazy-loaded, pod `IkarosLayout`, vyžaduje auth — `requireAuth` loader z 1.1)
- `ProfilePage` komponenta s **layout shell**:
  - desktop (≥768px): levý sidebar s taby (sekce) + pravý content
  - mobil: stack všech sekcí pod sebou, sticky save bar nahoře (pokud probíhá edit)
- **Sekce na profilu:**
  1. **Header karta** (vždy nahoře, neoddělitelná) — viz §5.1
  2. **NĚCO O MNĚ** — bio
  3. **POSTAVA V ROZCESTÍ** — postava sub-entita
  4. **MOJE SVĚTY** — read-only readout
  5. **PLACEHOLDER** Moje diskuze / Moje články / Moje galerie (prázdné, hláška "Bude dostupné v dalším updatu")
  6. **Vzhled** — globální motiv (link na `<ThemeSwitcher>`) + barva chatu (color picker)
  7. **Bezpečnost** — změna hesla; změna username **disabled** + "Připravujeme (1.3b)"
  8. **Účet** — smazání účtu **disabled** + "Připravujeme (1.3c)"
- **Edit flow:** inline edit (každá sekce má vlastní `<EditCard>` s `Upravit` / `Uložit` / `Zrušit`); žádné modaly. Důvod: profil je dlouhý, modal by skrýval kontext.
- `useUpdateProfile`, `useUpdatePassword`, `useUploadAvatar`, `useUploadCharacterAvatar`, `useDeleteAvatar` hooky (TanStack Query mutations)
- `useMyProfile` hook = `useQuery(['users', 'me'])` — refetch po každé mutation
- Avatar upload: drag&drop area + file input; preview před uploadem; client-side validation (typ, velikost); progress při uploadu
- Color picker: `react-colorful` `<HexColorPicker>` (~3 KB, lepší UX zejména na iOS Safari) + textový hex synchronizovaný
- Default avatar selector: 3 ikonky muž/žena/bytost (radio-style), aktivní vyznačený rámečkem
- Nahradit avatar v `IkarosLayout` headeru za live `currentUser.avatarUrl ?? defaultAvatarFor(defaultAvatarType)`
- `useAuthBootstrap` — po refreshi přistanout `/users/me` data do `currentUserAtom` (vyřeší D-005)
- Tests + Storybook (níže §7.2)

### 2.2 Mimo rozsah 1.3a (explicitně)

- **Username change** — UI viditelné, ale `disabled` s tooltipem; logika v 1.3b
- **Smazání účtu** — UI viditelné, ale `disabled` s tooltipem; logika v 1.3c
- **Změna emailu** — vyžaduje verifikační flow přes mailer (1.7). V 1.3a je pole `email` **read-only** v UI (zobrazuje se v header kartě, ale nelze měnit) + tooltip „Změna emailu bude dostupná v 1.7". Flag `emailVerified` v DB existuje (default `false`); plnohodnotný flow přijde v 1.7.
- **Image cropping** — uživatel uploadne, BE udělá `cover` resize. Crop UI doplníme jako dluh, pokud bude potřeba.
- **Veřejný profil `/ikaros/uzivatel/:id`** — krok 1.4
- **Moje diskuze / články / galerie reálná data** — fáze 3.x doplní; v 1.3a placeholder
- **Pomocný PJ + role v rámci světa** — krok 12.x (admin) / 5.3 (nastavení světa)
- **Cloudinary / S3 storage** — nyní lokální filesystem; storage abstrakce přes `MediaUploadService` interface — později swap

---

## 3. Backend změny

### 3.1 Datový model — User entita

```ts
// backend/src/modules/users/user.entity.ts (rozšíření)
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;

  // existující pole (nedotýkáme se):
  @Column({ unique: true }) email: string;
  @Column({ unique: true }) username: string;
  @Column() passwordHash: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER }) role: UserRole;
  @CreateDateColumn() createdAt: Date;

  // NOVÉ v 1.3a:
  @Column({ nullable: true, length: 64 }) displayName: string | null;
  @Column({ nullable: true, length: 100 }) city: string | null;
  @Column({ nullable: true, type: 'text' }) bio: string | null;
  @Column({ nullable: true }) avatarUrl: string | null;
  @Column({ type: 'enum', enum: ['male', 'female', 'being'], default: 'male' })
  defaultAvatarType: 'male' | 'female' | 'being';

  @Column({ nullable: true, length: 64 }) characterName: string | null;
  @Column({ nullable: true, type: 'text' }) characterBio: string | null;
  @Column({ nullable: true }) characterAvatarUrl: string | null;

  @Column({ length: 7, default: '#FFFFFF' }) chatColor: string;  // hex včetně #
  @Column({ nullable: true }) themeId: string | null;            // viz D-003/D-004
  @Column({ default: false }) emailVerified: boolean;

  @Column({ nullable: true, type: 'timestamptz' }) lastLoginAt: Date | null;
  @Column({ nullable: true, type: 'timestamptz' }) usernameChangedAt: Date | null;
}
```

**Migrace:** jediná migrace `1.3a-user-profile-fields.ts`, všechna pole nullable nebo default → bez nutnosti backfillu.

**`lastLoginAt`** se bude updatovat v `AuthService.login` a `AuthService.register` (přidat 1 řádek). Nepoužíváme decorator (`@BeforeUpdate` apod.) — explicitní v service je čitelnější.

### 3.2 GET /api/users/me — rozšíření

**Před:** `{ id, email, username, role }` (z JWT decode v 1.1)
**Po:**
```ts
type MeResponse = {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  displayName: string | null;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  defaultAvatarType: 'male' | 'female' | 'being';
  characterName: string | null;
  characterBio: string | null;
  characterAvatarUrl: string | null;
  chatColor: string;          // '#FFFFFF' default
  themeId: string | null;
  emailVerified: boolean;
  createdAt: string;          // ISO
  lastLoginAt: string | null; // ISO
  worldsCount: number;        // agregát z worlds modulu
};
```

`worldsCount` = počet světů, kde je uživatel členem (jakákoli role). Implementace: sub-query / lazy count v `UsersService.getMe()`.

**FE D-005 vyřešen:** `useAuthBootstrap` dostane plnohodnotná data, přestane spoléhat na JWT decode pro user info.

### 3.3 PATCH /api/users/me — update profilu

```ts
// dto
export class UpdateMeDto {
  @IsOptional() @IsString() @Length(0, 64) displayName?: string;
  @IsOptional() @IsString() @Length(0, 100) city?: string;
  @IsOptional() @IsString() @Length(0, 1000) bio?: string;
  // email NENÍ v DTO — změna přijde v 1.7 přes verifikační flow
  @IsOptional() @IsString() @Length(0, 64) characterName?: string;
  @IsOptional() @IsString() @Length(0, 1000) characterBio?: string;
  @IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/) chatColor?: string;
  @IsOptional() @IsString() @MaxLength(64) themeId?: string;
  @IsOptional() @IsIn(['male', 'female', 'being']) defaultAvatarType?: 'male' | 'female' | 'being';
}
```

**Validace:**
- Prázdný string → smazat hodnotu (`null` v DB) — explicitně
- `chatColor` musí být validní hex (`#RRGGBB`); 3-znakovou verzi (`#FFF`) BE odmítne s 400 — UI ji rozšíří před odesláním
- **`username` v PATCH NEPOSÍLÁME** — zachycujeme v 1.3b workflow
- **`email` v PATCH NEPOSÍLÁME** — zachycujeme v 1.7 (verifikační flow)

**Response:** stejný shape jako `GET /users/me` (refetch by request) — lze i `204 No Content` a FE invalidate query, ale konzistence s ostatními PATCH (1.1/1.2) → vrací 200 + nový stav.

### 3.4 PATCH /api/users/me/password — změna hesla

```ts
export class ChangePasswordDto {
  @IsString() @MinLength(6) @MaxLength(128) currentPassword: string;
  @IsString() @MinLength(6) @MaxLength(128) newPassword: string;
}
```

**Logika:**
1. Načti `User` se `passwordHash`
2. `bcrypt.compare(currentPassword, user.passwordHash)` → false → `UnauthorizedException({ code: 'INVALID_PASSWORD', message: 'Současné heslo je špatně' })`
3. `passwordHash = bcrypt.hash(newPassword, 12)`
4. **Revokuj rodinu refresh tokenů** — invalidace v `RefreshTokenService` (zruší VŠECHNY existující refresh tokeny tohoto uživatele kromě aktuálního session — viz §3.4.1)
5. Response: `{ success: true }` + nový access token (volitelné — uživatel zůstává přihlášený)

**§3.4.1 Refresh token revokace strategie:**
- Aktuální session má `refreshTokenId` z JWT payload
- Revokuj všechny `RefreshToken` rows kde `userId = me AND id != currentRefreshTokenId`
- Tím se ostatní zařízení odhlásí při příštím refresh
- Aktuální zařízení zůstává přihlášené

### 3.5 POST /api/users/me/avatar — upload

**Multer config:** `memoryStorage()`, limit 5 MB, mime `image/jpeg|png|webp|gif`.

**Endpoint:**
```ts
@Post('me/avatar')
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
async uploadAvatar(
  @CurrentUser() user: User,
  @UploadedFile() file: Express.Multer.File
): Promise<{ avatarUrl: string }> {
  if (!file) throw new BadRequestException({ code: 'NO_FILE' });
  if (!file.mimetype.startsWith('image/')) throw new BadRequestException({ code: 'INVALID_TYPE' });

  const result = await this.mediaUpload.process(file.buffer, {
    scope: 'user-avatar',
    userId: user.id,
    width: 512,
    height: 512,
    fit: 'cover',
  });

  // smaž starý soubor (pokud existuje)
  if (user.avatarUrl) await this.mediaUpload.delete(user.avatarUrl);

  await this.usersRepo.update(user.id, { avatarUrl: result.url });
  return { avatarUrl: result.url };
}
```

**Analogicky** `POST /api/users/me/character/avatar` s `width: 256, height: 256`.

**Mazání:** `DELETE /api/users/me/avatar` → `mediaUpload.delete(user.avatarUrl)` + `update({ avatarUrl: null })`.

### 3.6 MediaUploadService

```ts
// backend/src/shared/media/media-upload.service.ts (nový shared module)
@Injectable()
export class MediaUploadService {
  private readonly uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  private readonly publicBaseUrl = process.env.UPLOAD_PUBLIC_URL ?? '/uploads';

  async process(
    buffer: Buffer,
    opts: { scope: string; userId: string; width: number; height: number; fit?: 'cover' | 'inside' }
  ): Promise<{ url: string; width: number; height: number; sizeBytes: number }> {
    const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 12);
    const filename = `${opts.userId}-${hash}.webp`;
    const relPath = path.join(opts.scope, filename);
    const absPath = path.join(this.uploadDir, relPath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });

    const processed = await sharp(buffer)
      .rotate()  // EXIF auto-orient
      .resize(opts.width, opts.height, { fit: opts.fit ?? 'cover', position: 'attention' })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    await fs.writeFile(absPath, processed.data);
    return {
      url: `${this.publicBaseUrl}/${relPath.replace(/\\/g, '/')}`,
      width: processed.info.width,
      height: processed.info.height,
      sizeBytes: processed.info.size,
    };
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith(this.publicBaseUrl)) return;
    const relPath = url.slice(this.publicBaseUrl.length).replace(/^\//, '');
    const absPath = path.join(this.uploadDir, relPath);
    await fs.unlink(absPath).catch(() => undefined);
  }
}
```

**Static serving:** Nest expose `/uploads` jako static directory (`ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'uploads'), serveRoot: '/uploads' })`). V devu funguje, v produkci nginx/CDN přebere.

**Sharp závislost** — `npm i sharp` v BE (~30 MB ve `node_modules`, native binárka). Pokud BE už `sharp` má (audit potřeba), reuse. Jinak dluh: zvážit alternativu `@squoosh/lib`.

### 3.7 BE testy

- `users.service.spec.ts` — `getMe` vrací rozšířená pole + worldsCount; `updateMe` aplikuje patch, email change resetuje `emailVerified`; conflict pro duplikát emailu
- `users.controller.spec.ts` — endpointy chráněné `JwtAuthGuard`; payload validace přes DTO
- `change-password.spec.ts` — bcrypt validace, revokace refresh tokenů
- `media-upload.service.spec.ts` — sharp pipeline, hash deduplikace, delete starého souboru, error cases (corrupted buffer)
- `users.controller.e2e-spec.ts` — full flow `GET → PATCH → GET`, upload avataru, change password
- `1.3a-user-profile-fields.migration.spec.ts` — up/down

---

## 4. Frontend — architektura

### 4.1 Router

```ts
// src/router.tsx (přidat)
{
  path: 'ikaros/profil',
  loader: requireAuth,
  lazy: () => import('@/pages/ikaros/ProfilePage').then(m => ({ Component: m.default })),
}
```

### 4.2 Komponentní strom

```
ProfilePage
├── ProfileSidebar           // taby na desktopu, hidden na mobilu
├── ProfileHeader            // header karta — avatar, jméno, město, …
└── ProfileSections
    ├── BioSection           // "NĚCO O MNĚ"
    ├── CharacterSection     // "POSTAVA V ROZCESTÍ"
    ├── WorldsSection        // "MOJE SVĚTY" (read-only)
    ├── CommunityPlaceholders  // diskuze/články/galerie (1.3a stub)
    ├── AppearanceSection    // theme + chat color
    ├── SecuritySection      // změna hesla; username disabled
    └── AccountSection       // smazání účtu disabled
```

Každá `*Section` je `<EditCard>` s read view + edit view. Hooks: `useToggleEdit()` lokálně.

### 4.3 EditCard — společná struktura

```tsx
type EditCardProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;          // read view
  editView: ReactNode;          // form
  onSave: () => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
  setEditing: (v: boolean) => void;
  isSaving: boolean;
};
```

Použití:
```tsx
<EditCard title="Něco o mně" {...}>
  {bio || <span className={styles.empty}>Zatím nic nenapsáno.</span>}
</EditCard>
```

### 4.4 Hooky

```ts
// src/api/hooks/useProfile.ts
export function useMyProfile() {
  return useQuery({ queryKey: ['users', 'me'], queryFn: () => api.get<MeResponse>('/users/me') });
}

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

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (dto: { currentPassword: string; newPassword: string }) =>
      api.patch('/users/me/password', dto),
    onSuccess: () => toast.success('Heslo změněno. Ostatní zařízení byla odhlášena.'),
  });
}

export function useUploadAvatar(scope: 'user' | 'character') {
  const qc = useQueryClient();
  const url = scope === 'user' ? '/users/me/avatar' : '/users/me/character/avatar';
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post<{ avatarUrl: string }>(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'me'] }),
  });
}
```

### 4.5 Avatar komponenta

```tsx
// src/components/ui/UserAvatar/UserAvatar.tsx
type Props = {
  src?: string | null;
  defaultType?: 'male' | 'female' | 'being';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
};

export function UserAvatar({ src, defaultType = 'male', size = 'md', alt }: Props) {
  const fallback = `/defaults/avatars/${defaultType}.webp`;
  return (
    <img
      src={src ?? fallback}
      alt={alt ?? ''}
      className={clsx(styles.avatar, styles[size])}
      onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
    />
  );
}
```

V 1.3c se rozšíří o `deleted` prop (černá páska overlay).

### 4.6 Default avatary — assety

**Stav:** PJ dodal 3 ikonky (cca 1280×1280 PNG s transparent okrajem):
- `female.png` — ženská silueta s křídlem, tmavě zelené pozadí + zlatý kruh
- `male.png` — mužská silueta s křídlem, tmavě zelené pozadí + zlatý kruh
- `being.png` — bytost se dvěma rozpaženými křídly, tmavě zelené pozadí + zlatý kruh

Pozadí je **uniformně tmavě zelené** (vědomé designové rozhodnutí — ikonky jsou theme-neutrální, ne theme-aware overlay).

**Pipeline:**
1. Vstupní PNG do `assets-source/default-avatars/`
2. Skript `npm run defaults:optimize` (analogie `themes:optimize`) — sharp:
   - resize 512×512 (cover) → `public/defaults/avatars/<type>.webp` (header use)
   - resize 256×256 (cover) → `public/defaults/avatars/<type>-sm.webp` (chat / drobnější UI)
   - quality 85, lossless: false
3. Skript v `package.json` + CI guard (committed WebP musí matchovat zdroj)

### 4.7 Hydratace `useAuthBootstrap` (vyřešení D-005)

**Před:** decode JWT payload → `{ id, email, username, role }`
**Po:** decode JWT (rychlý optimistic state) → `useQuery(['users', 'me'])` → přepiš `currentUserAtom` plnohodnotnými daty

```ts
// src/api/hooks/useAuthBootstrap.ts (rozšíření)
export function useAuthBootstrap() {
  const accessToken = useAtomValue(accessTokenAtom);
  const setUser = useSetAtom(currentUserAtom);

  // 1. Optimistic z JWT (existující)
  useEffect(() => {
    if (!accessToken) return;
    const claims = decodeJwt(accessToken);
    setUser((prev) => prev ?? { id: claims.sub, email: claims.email, username: claims.username, role: claims.role, /* …null defaults */ });
  }, [accessToken]);

  // 2. Plnohodnotná hydratace
  useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.get<MeResponse>('/users/me'),
    enabled: !!accessToken,
    onSuccess: (data) => setUser(data),
  });
}
```

**`currentUserAtom` typ** se rozšíří o všechna nová pole — všude, kde se čte `currentUser.foo`, projít a doplnit (TS errors navedou).

---

## 5. UI/UX detail

### 5.1 Header karta

Layout (desktop):
```
┌────────────────────────────────────────────────────────────────┐
│  [AVATAR 128]   USERNAME              JMÉNO                    │
│                 Tyky                  Pavel J.        [Upravit]│
│                 MĚSTO                 ÚČET ZALOŽEN             │
│                 Praha                 8. 5. 2025               │
│                 POSLEDNÍ PŘIHLÁŠENÍ   BARVA CHATU              │
│                 8. 5. 2026 v 13:29    ■ #FFFFFF               │
│                 GLOBÁLNÍ MOTIV                                 │
│                 Modré nebe                                     │
└────────────────────────────────────────────────────────────────┘
```

Mobilně: avatar nahoře centered, pole pod ním ve sloupci. Tlačítko "Upravit" otevře edit view sekce.

**Visual:** používá `<IkarosCard>` (existující z layout cleanup) per-theme (3D rámeček, glow). Avatar má `border-radius: 50%` (kruh) + per-theme border z tokenů.

**Role badge** — vedle username, malý chip:
- `USER` → skrytý
- `ADMIN` → modrý chip "ADMIN"
- `SUPERADMIN` → zlatý chip "SUPERADMIN"

### 5.2 Edit views

**BioSection edit:** `<textarea maxlength="1000">` + counter "835 / 1000"
**CharacterSection edit:** 3 pole — input jména (max 64), textarea bio (1000), drag&drop / file input pro avatar postavy + preview
**AppearanceSection edit:**
- Globální motiv: link "Otevřít přepínač témat" → otevře existující `<ThemeSwitcher>` v dropdownu (komponenta z 1.0)
- Barva chatu: `<HexColorPicker>` z `react-colorful` + `<input type="text" pattern="^#[0-9A-Fa-f]{6}$">` synchronizováno (změna v jednom propaguje druhý); preview "Tvé zprávy budou vypadat takto" s ukázkou chat bubbliny
**SecuritySection edit:** 3 pole (current, new, confirm) + indikátor síly hesla (reuse z 1.2)

**Save flow:**
- Validace zod (analogicky jako `registerSchema` v 1.2 — `profileSchema.ts` per sekce)
- Submit → mutation → success: read view + toast + opustit edit
- Error 400 → field error (pokud BE vrací `code`/`field`); jinak banner
- Error 5xx / network → banner v sekci

### 5.3 Avatar upload UI

```
┌─────────────────────────────────────┐
│  [Náhled 128]   ↑ Nahrát fotku      │
│                 ✗ Odebrat           │
│                                     │
│  Nebo zvol výchozí avatar:          │
│  ◉ Muž   ○ Žena   ○ Bytost          │
└─────────────────────────────────────┘
```

- Nahrát → file picker (accept `image/*`); klient-side validace (typ, ≤5 MB)
- Drag&drop nad kartu → highlight border
- Po výběru: client preview (blob URL) → "Nahrát" / "Zrušit" → mutation
- Po úspěchu: refetch `users/me`, toast "Avatar aktualizován"
- Odebrat → confirm "Opravdu odstranit avatar?" → DELETE → fallback na default

### 5.4 Mobile

- Sidebar taby skryty, sekce stack
- Sticky save bar nahoře pokud `dirty` v aktuálně otevřené edit view
- Tap targety ≥44px
- Po grafických úpravách spustit skill `mobil-desktop` (per `base.md`)

### 5.5 A11y

- Sekce mají `<h2>` titulky, `<section aria-labelledby>`
- `<EditCard>` v edit modu — focus na první input
- Tlačítka mají aria-label
- Color picker — kromě nativního inputu i textový hex (screenreader-friendly)
- Avatar `<img alt={username}>` (ne `alt=""`, je to relevantní obsah)

### 5.6 Theme

Profil respektuje aktuální `data-theme`. Všechny barvy z theme tokenů. EditCard má per-theme glow z `decorations.css`.

---

## 6. Akceptační kritéria

### 6.1 Hydratace + render
- [ ] Otevři `/ikaros/profil` přihlášen → header karta naplněná z `/users/me`
- [ ] Logout → otevři `/ikaros/profil` → redirect na `/?openLogin=1` (per `requireAuth` z 1.1)
- [ ] Hard refresh `/ikaros/profil` → po hydrataci viditelný plný profil (ne jen JWT payload)

### 6.2 Edit profilu
- [ ] Klik "Upravit" v Bio sekci → textarea, max 1000 znaků
- [ ] 1001 znaků → counter červeně, submit blokovaný
- [ ] Klik "Uložit" → PATCH 200 → toast, read view, nový text viditelný
- [ ] Klik "Zrušit" → opustí edit bez uložení, žádný request
- [ ] Email pole v header kartě je read-only + tooltip "Změna emailu bude dostupná v 1.7"
- [ ] Změna chatColor `#FF0000` → preview swatch v header kartě se okamžitě změní
- [ ] Změna defaultAvatarType (Žena) bez avatarUrl → header avatar fallback na ženskou ikonku
- [ ] Změna města → header zobrazí novou hodnotu

### 6.3 Avatar upload
- [ ] Drag&drop PNG 1 MB → preview → "Nahrát" → POST 200 → header avatar = nový obrázek (WebP)
- [ ] Upload 6 MB JPEG → klient-side error "Soubor je příliš velký" před odesláním
- [ ] Upload PDF → klient-side error "Pouze obrázky"
- [ ] Po druhém uploadu se starý soubor smaže (BE — kontrola v `users.service.spec`)
- [ ] "Odebrat avatar" → confirm → DELETE → fallback na `defaultAvatarType`
- [ ] Avatar postavy upload analogicky, separátní slot

### 6.4 Změna hesla
- [ ] Špatné `currentPassword` → 401 → field error "Současné heslo je špatně"
- [ ] `newPassword === currentPassword` → klient-side warning (volitelné, ne blocker)
- [ ] Krátké heslo (<6) → zod chyba
- [ ] Confirm mismatch → zod chyba
- [ ] Úspěch → toast "Heslo změněno. Ostatní zařízení byla odhlášena.", form reset
- [ ] Otevři druhou kartu se starým refresh tokenem → po prvním 401 a refresh attempt → odhlášení (force logout)
- [ ] Aktuální session zůstává přihlášená

### 6.5 Sekce read-only / placeholder
- [ ] MOJE SVĚTY zobrazuje seznam z `/users/me/worlds` (existující endpoint?) — pokud ne, použij `useMyWorlds` z 0.5
- [ ] Klik na svět v MOJE SVĚTY → naviguje na `/svet/:slug`
- [ ] Placeholder sekce (diskuze/články/galerie) — ukáže "Bude dostupné v dalším updatu", žádný request

### 6.6 Disabled UI (placeholder pro 1.3b/c/1.7)
- [ ] Sekce Bezpečnost — pole "Username" `disabled` + tooltip "Změna username bude dostupná v 1.3b"
- [ ] Header karta — pole "Email" read-only + tooltip "Změna emailu bude dostupná v 1.7"
- [ ] Sekce Účet — tlačítko "Smazat účet" `disabled` + tooltip "Smazání účtu bude dostupné v 1.3c"

### 6.7 A11y
- [ ] Tab order: header → sekce shora dolů
- [ ] Edit mode: focus na první input
- [ ] Banner role="alert", aria-live
- [ ] Avatar má `alt={username}`
- [ ] Color picker má `<label>`

### 6.8 Mobile
- [ ] Sekce stack, žádný sidebar
- [ ] Avatar 96px, header pole pod sebou
- [ ] Sticky save bar v edit módu
- [ ] Tap targety ≥44px
- [ ] Skill `mobil-desktop` prošel — žádný regression

### 6.9 BE
- [ ] `GET /api/users/me` přihlášen → 200 + nový shape
- [ ] `GET /api/users/me` neautentizovaně → 401
- [ ] `PATCH /api/users/me` valid → 200 + updated shape
- [ ] `PATCH /api/users/me` s polem `email` → 400 (BE odmítne neznámé pole, nebo silently ignoruje — rozhodnout v plánu)
- [ ] `PATCH /api/users/me/password` špatné heslo → 401 + `code: 'INVALID_PASSWORD'`
- [ ] `POST /api/users/me/avatar` 6 MB → 413 (multer limit)
- [ ] `POST /api/users/me/avatar` text/plain → 400 + `code: 'INVALID_TYPE'`
- [ ] `POST /api/users/me/avatar` PNG → 200 + `{ avatarUrl }` ukazující na `.webp`
- [ ] Dvojitý upload → starý soubor smazán z disku
- [ ] Migrace `1.3a-user-profile-fields` proběhne, default hodnoty správně nastaveny

---

## 7. Testy

### 7.1 BE

**Unit (jest):**
- `users.service.spec.ts` — `getMe`, `updateMe`, `changePassword`, `uploadAvatar` happy + edge cases
- `media-upload.service.spec.ts` — sharp pipeline (resize, WebP, EXIF rotate), delete starého souboru, hash dedup
- `auth.service.spec.ts` — login update `lastLoginAt`

**E2E (supertest):**
- `users.e2e-spec.ts`:
  - GET /me 401 anon, 200 auth (nový shape)
  - PATCH /me — happy + email duplicate + invalid color
  - PATCH /me/password — happy + bad current + token revoke side effect
  - POST /me/avatar — happy + size limit + type rejection
  - DELETE /me/avatar — fallback

**Migrace:**
- `1.3a-user-profile-fields.migration.spec.ts` — up vytvoří sloupce s defaulty; down drop

### 7.2 FE

**Unit (vitest):**
- `profileSchema.spec.ts` — zod schémata pro každou sekci (bio, character, password, color)
- `useProfile.spec.ts` — useMyProfile cache key, useUpdateProfile invalidate, useUploadAvatar FormData
- `UserAvatar.spec.tsx` — fallback na default per type, error fallback při broken src

**Component (RTL):**
- `ProfilePage.spec.tsx` — render sekcí, requireAuth redirect, loading state
- `BioSection.spec.tsx` — toggle edit, save, cancel, counter
- `CharacterSection.spec.tsx` — 3 pole, avatar upload preview
- `AppearanceSection.spec.tsx` — color picker sync (color ↔ text input)
- `SecuritySection.spec.tsx` — change password happy + bad current + mismatch
- `AvatarUploader.spec.tsx` — drag&drop, file input, size validation, type validation

**Storybook:**
- `ProfilePage/Default` (full data)
- `ProfilePage/EmptyProfile` (vše null)
- `ProfilePage/EditingBio`
- `ProfilePage/UploadingAvatar` (loading)
- `ProfilePage/PasswordError`

**Skill `mobil-desktop`** — po grafických úpravách (per `base.md`).

---

## 8. Migrace / breaking changes

### 8.1 BE
- **Migrace** `1.3a-user-profile-fields` — additive sloupce s defaulty, žádný breaking
- `GET /users/me` rozšířený response — additive, FE 1.1/1.2 stále funguje (ignoruje nová pole)
- `PATCH /users/me` — nový endpoint, žádný impact
- Static `/uploads` directory — nutno expose v Nest config

### 8.2 FE
- `currentUserAtom` typ rozšířen — všude, kde se čte, projít TS errors
- `useAuthBootstrap` druhá fáze hydratace — testy přechod nereagovat na rozšířený shape

### 8.3 Závislosti
- BE: `sharp` (~30 MB) — pokud ještě není
- BE: `@nestjs/serve-static` — pokud ještě není
- BE: `@nestjs/platform-express` multer + `@types/multer`
- FE: `react-colorful` (~3 KB) — color picker

---

## 9. Tracked dluhy

- **D-013** — Image cropping UI (uživatel uploadne, ukáže se crop modal před odesláním). Aktuálně server-side `cover` resize. Doplníme po feedbacku.
- **D-014** — Email verifikace flow (potvrzovací e-mail) — **vyřešeno v 1.7** (Reset hesla + mailer). Email change tam dostane verifikační flow (změna → email s potvrzovacím linkem → po kliknutí update + `emailVerified: true`).
- **D-015** — Migrace `/uploads` na S3/Cloudinary. `MediaUploadService` má strategy interface; swap = nová impl.
- **D-016** — Audit log změn profilu (kdo a kdy změnil email, heslo, …). Užitečné pro SUPERADMIN, ne MVP.
- **D-018** — Sentinel `themeId` validace na BE proti registry témat (aby BE odmítl neplatné ID). Aktuálně BE jen ukládá string.

---

## 10. Otevřené body k revizi

- [ ] **`worldsCount` zdroj** — máme `useMyWorlds` z 0.5; BE `getMe` agregát = sub-query do `world_members` table. Konzistence s FE — ověřit, že vrací stejné číslo jako `useMyWorlds.length`.
- [ ] **`sharp` na BE — už existuje?** Pokud ne, instalace je 30 MB binárka. Alternativy: `@squoosh/lib` (čistá JS, pomalejší). Doporučuju `sharp` — standardní, rychlé, FE pipeline ho už používá pro `themes:optimize`.
- [ ] **Static `/uploads` v produkci** — nginx / CDN přebere; v dev BE serveruje. OK?
- [ ] **Postava v Rozcestí jako sub-entita** — v 1.3a je to tři pole na User. Nevadí. Pokud později vznikne plnohodnotná entita `IkarosCharacter` (např. v rámci 1.8 přátelé / 4.1 Hospoda), migrujeme. Ale to není problém 1.3a.
- [ ] **`PATCH /users/me` s polem `email`** — silently ignorovat (whitelist DTO) nebo 400 reject? Doporučuju **400 reject** — jasná zpráva, že FE nemá email posílat. Rozhodneme v plánu.
- [ ] **Audit pole `usernameChangedAt`** — vytváříme už v 1.3a, používá se v 1.3b. Cooldown gating je 1.3b odpovědnost. V 1.3a se pole nikdy neaktualizuje (username se nemění).

---

## 11. Po schválení tohoto specu

Vytvořím `docs/arch/phase-1/plan-1.3a.md` — implementační plán s konkrétními soubory, pořadím změn (BE migrace → BE service → BE controller → FE hooky → FE komponenty), test stepy a checklisty. Počkám na schválení toho, pak budu kódovat.
