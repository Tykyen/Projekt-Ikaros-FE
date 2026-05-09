# Spec 1.2g — BE anon access pro public-content moduly (D-008)

**Status:** Draft — čeká na schválení
**Rozsah:** BE — `OptionalJwtAuthGuard` + refactor 3 modulů (articles, gallery, discussions)
**Repo:** `C:\Matrix\ProjektIkaros\Projekt-ikaros` (backend)
**Branch:** `feat/krok-1.2-registrace`
**Velikost:** středně velký, ~150-250 ř., 7-10 souborů + testy
**Autor:** PJ + Claude
**Datum:** 2026-05-08

---

## 1. Cíl

Zpřístupnit anon (nepřihlášenému) uživateli **read** endpointy ve 3 BE modulech (`ikaros-articles`, `ikaros-gallery`, `ikaros-discussions`), aby FE IkarosLayout (po 1.1 veřejný) reálně fungoval. Write endpointy zůstávají chráněné JWT.

`ikaros-news` už pattern dodržuje (method-level `@UseGuards`) — bez změny.

Tento spec **není** o:
- Auditování security holes v jiných BE modulech (`timeline`, `world-weather`, `world-calendar-config` mají write endpointy bez auth) — viz nový dluh **D-016**.
- Globálním `APP_GUARD` patternu (varianta B) — odložené, vyžaduje plný BE audit.
- FE změnách — anon flow už funguje, jen dostává 401; po BE fixu začne dostávat data.

---

## 2. Kontext — proč to teď

- Krok 1.1 udělal `IkarosLayout` veřejný (anon vidí `/ikaros/clanky`, `/ikaros/galerie`, `/ikaros/diskuze` v navigaci).
- Aktuálně:
  - `IkarosArticlesController`, `IkarosGalleryController`, `IkarosDiscussionsController` mají **class-level** `@UseGuards(JwtAuthGuard)` (řádek 36/41/38).
  - Anon přijde na `GET /api/ikaros-articles` → BE vrátí **401**.
  - FE (zatím v 1.1 prázdné stránky) bude v krocích 3.2-3.4 (Články / Galerie / Diskuze) skutečně volat tyto API → bez fixu to budou prázdné stránky / chyby.
- Bez tohoto fixu D-008 **blokuje kroky 3.2-3.4**.

---

## 3. Audit současného stavu

### 3.1 Existující JWT guard

[`backend/src/common/guards/jwt-auth.guard.ts`](Projekt-ikaros/backend/src/common/guards/jwt-auth.guard.ts):

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // canActivate volá super.canActivate (passport), které throw 401 při chybějícím/invalid tokenu.
  // Při úspěchu navíc zavolá usersRepo.updateLastSeen.
}
```

Při chybějícím tokenu **throw 401**. Nepouští anon.

### 3.2 `@CurrentUser()` decorator

[`backend/src/common/decorators/current-user.decorator.ts`](Projekt-ikaros/backend/src/common/decorators/current-user.decorator.ts):

```ts
return request.user;  // RequestUser | undefined
```

Už **vrací `undefined`** pokud `req.user` není set. → **Nepotřebuje změnu** — funguje pro anon path "out of the box", pokud guard pustí dál bez populace user.

### 3.3 Service signatury 3 modulů (vzorek z `ikaros-articles.service.ts`)

```ts
async findAll(role: UserRole, username: string): Promise<IkarosArticle[]>
async findById(id: string, userId: string, role: UserRole, username: string): Promise<IkarosArticle>
```

Logika filtruje "approved + pending pro admina". Pro anon musí být jasné: **jen approved**.

### 3.4 Controllers (3 dotčené)

Všechny tři mají identický pattern:
```ts
@Controller('ikaros-XXX')
@UseGuards(JwtAuthGuard)   // <- class-level
export class IkarosXXXController {
  @Get()
  findAll(@CurrentUser() user: RequestUser) {  // user je tu vždy přítomen
    return this.service.findAll(user.role, user.username);
  }
  ...
}
```

### 3.5 Read vs Write endpointy (per-controller mapping)

**`ikaros-articles.controller.ts`:**
- READ (anon-OK po fixu): `GET /`, `GET /:id` *(seznam + detail veřejných článků)*
- READ-AUTH (vyžaduje user): `GET /my`, `GET /pending`, `GET /stats`
- WRITE: `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/submit`, `POST /:id/approve`, `POST /:id/reject`, `POST /:id/rate`

**`ikaros-gallery.controller.ts`:**
- READ (anon-OK po fixu): `GET /`, `GET /:id`
- READ-AUTH: `GET /my`, `GET /pending`
- WRITE: `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/submit`, `POST /:id/approve`, `POST /:id/reject`, `POST /:id/rate`

**`ikaros-discussions.controller.ts`:**
- READ (anon-OK po fixu): `GET /`, `GET /:id`, `GET /:id/posts`
- READ-AUTH: `GET /pending`, `GET /my-favorites`
- WRITE: `POST /`, `PATCH /:id`, `POST /:id/approve`, `POST /:id/reject`, `POST /:id/invite`, `POST /:id/toggle-favorite`, `POST /:id/posts`, `DELETE /:id/posts/:postId`

---

## 4. Návrh řešení

### 4.1 Nový `OptionalJwtAuthGuard`

Nový soubor `backend/src/common/guards/optional-jwt-auth.guard.ts`:

```ts
import { Injectable, ExecutionContext, Inject, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { IUsersRepository } from '../../modules/users/interfaces/users-repository.interface';
import type { RequestUser } from '../interfaces/request-user.interface';

/**
 * "Měkký" JWT guard — pokud token je validní, populuje req.user.
 * Pokud token chybí nebo je invalid, vrátí true (request projde) a req.user zůstane undefined.
 * Použití: read endpointy, které mohou existovat ve veřejné variantě (anon) i přihlášené.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  constructor(
    @Inject('IUsersRepository') private readonly usersRepo: IUsersRepository,
  ) {
    super();
  }

  // Override canActivate aby:
  //   1. Zkusil passport JWT validation, ale NEHODIL 401 při chybě.
  //   2. Při úspěchu zavolal updateLastSeen (jako JwtAuthGuard).
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = (await super.canActivate(context)) as boolean;
      if (result) {
        const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
        const userId = request.user?.sub;
        if (userId) {
          void this.usersRepo.updateLastSeen(userId).catch((err: Error) => {
            this.logger.warn(`updateLastSeen failed for ${userId}: ${err.message}`);
          });
        }
      }
    } catch {
      // Token chybí / invalid → anon, nech projít
    }
    return true;
  }

  // Override handleRequest aby NEHODIL při chybějícím user.
  // Default passport.handleRequest hodí UnauthorizedException pokud user není definovaný.
  handleRequest<TUser = RequestUser>(_err: unknown, user: TUser | false): TUser {
    return (user || (undefined as unknown)) as TUser;
  }
}
```

**Klíčové detaily:**
- Extends `AuthGuard('jwt')` (stejně jako `JwtAuthGuard`).
- `canActivate` wrappuje try/catch, vždy vrátí `true`.
- `handleRequest` override vrací `undefined` místo throw.
- `updateLastSeen` se volá jen pokud user je validní (= jako u standard guardu).

### 4.2 Modifikace controllerů — přesun guardů z class-level na method-level

**`ikaros-articles.controller.ts`:**

```ts
// 1. Smazat: @UseGuards(JwtAuthGuard) z class-level (řádek 36)
@ApiTags('Ikaros Articles')
@ApiBearerAuth()
@Controller('ikaros-articles')
export class IkarosArticlesController {

  // 2. READ veřejné — Optional guard
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@CurrentUser() user?: RequestUser) {
    return this.service.findAll(user?.role, user?.username);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findById(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    return this.service.findById(id, user?.id, user?.role, user?.username);
  }

  // 3. READ chráněné — JwtAuthGuard
  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@CurrentUser() user: RequestUser) { ... }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  findPending(@CurrentUser() user: RequestUser) { ... }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  findStats(@CurrentUser() user: RequestUser) { ... }

  // 4. WRITE — JwtAuthGuard (POST/PUT/DELETE)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(...) { ... }

  // ... atd.
}
```

Identický pattern aplikován na `ikaros-gallery` a `ikaros-discussions`.

### 4.3 Service signatury — `role` a `username` jako optional

**Strategie:** Místo úplného refactoru službu necháme přijmat `role?: UserRole, username?: string` (oba optional). Service checkuje `if (!role)` → anon path = jen approved content.

Příklad `ikaros-articles.service.ts`:

```ts
async findAll(role?: UserRole, username?: string): Promise<IkarosArticle[]> {
  const all = await this.repo.findAll();

  // Anon: jen approved.
  if (!role) {
    return all.filter((a) => a.status === 'approved');
  }

  // Auth path beze změny: approved + pending pro admina.
  if (this.isAdmin(role, username ?? '')) {
    return all;  // approved + pending
  }
  return all.filter((a) => a.status === 'approved');
}
```

Pro `findById`:

```ts
async findById(
  id: string,
  userId?: string,
  role?: UserRole,
  username?: string,
): Promise<IkarosArticle> {
  const article = await this.repo.findById(id);
  if (!article) throw new NotFoundException(...);

  // Anon: vidí jen approved.
  if (!role) {
    if (article.status !== 'approved') throw new NotFoundException(...);
    return article;
  }

  // Auth path: existing logic
  // ...
}
```

**Alternativní možnosti zvažované:**
- (a) Sentinel `UserRole.Anon = -1` → invazivnější, mění typový kontrakt napříč BE. **Zamítnuto.**
- (b) Dvě separátní metody `findAllPublic()` + `findAllForUser()` → controller logika by se rozdvojila. **Zamítnuto** (zdvojuje volání v controlleru).
- (c) Optional params s `if (!role)` early-return → **Zvoleno** (lokální change, čistá hierarchie).

### 4.4 Důsledek pro existující testy

Testy služeb (`*.service.spec.ts`) předávají povinné `role`/`username` parametry. Po refactoru se nic nezmění (params jsou optional ale stále se předávají). **Žádný test by se neměl rozbít.**

Testy controllerů (e2e) — pokud existují s anon scénářem, doplnit. Pokud testy volají jen autentizovaný path, žádná změna.

### 4.5 Out of scope

- **D-016 (nový):** Široký BE auth audit. ~14 controllerů má unguarded write endpointy (`timeline.create/update/delete`, `world-weather.create/update/delete/generate/broadcast`, `world-calendar-config.put`, atd.). To jsou **pravděpodobné security bugs** — zaslouží si vlastní spec, vlastní review.
- **APP_GUARD pattern (varianta B):** Globální guard + `@Public()` decorator. Po D-016 pravděpodobně lepší cesta, ale nejdřív musí být audit dokončen.
- **FE změny:** žádné. Po fixu BE začnou existující FE volání vracet data místo 401.

---

## 5. Acceptance kritéria

1. ✅ Nový soubor `backend/src/common/guards/optional-jwt-auth.guard.ts` existuje, exportuje `OptionalJwtAuthGuard`.
2. ✅ Guard je registrovaný jako provider v 3 modulech (`IkarosArticlesModule`, `IkarosGalleryModule`, `IkarosDiscussionsModule`) — nebo dostupný přes globální providers (záleží na DI struktuře).
3. ✅ V 3 controllerech je `@UseGuards(JwtAuthGuard)` na class-level **odstraněn**.
4. ✅ Read endpointy (`findAll`, `findById`, `getPosts`) v 3 controllerech mají `@UseGuards(OptionalJwtAuthGuard)`.
5. ✅ Write endpointy (`POST/PUT/PATCH/DELETE`) v 3 controllerech mají `@UseGuards(JwtAuthGuard)`.
6. ✅ Read-auth endpointy (`findMy`, `findPending`, `findMyFavorites`, `findStats`) mají `@UseGuards(JwtAuthGuard)`.
7. ✅ Service signatury read metod přijímají `role?: UserRole, username?: string` (optional).
8. ✅ Service implementace má anon path: `if (!role) return only approved content`.
9. ✅ Curl test (manuální): `curl http://localhost:3000/api/ikaros-articles` **bez Authorization header** vrátí 200 + array (může být prázdné, ale ne 401).
10. ✅ Curl test (manuální): `curl http://localhost:3000/api/ikaros-articles -X POST` **bez Authorization** vrátí 401 (write zůstává chráněné).
11. ✅ BE test suite (`npm test`) prochází bez nových failures (800+ testů).
12. ✅ `dluhy.md` má **D-008** přesunutý do "Uzavřené" s odkazem na 1.2g.
13. ✅ `dluhy.md` má nový **D-016** "BE auth audit — nezabezpečené write endpointy" v "Otevřené".

---

## 6. Test plán

**Nové unit testy** (každý modul má `*.service.spec.ts`):
- `findAll(undefined, undefined)` → vrátí jen approved.
- `findById(id, undefined, undefined, undefined)` na approved článku → vrátí.
- `findById(id, undefined, undefined, undefined)` na pending článku → throws NotFound (anon nemá vidět).

**Nové e2e testy** (volitelně, pokud existuje suite):
- `GET /api/ikaros-articles` bez Authorization → 200, array.
- `GET /api/ikaros-articles/:id` (approved id) bez Authorization → 200.
- `POST /api/ikaros-articles` bez Authorization → 401.

**Manuální curl test** (povinný před commitem):
```bash
# 1. BE běží na :3000, lokální .env (žádný build potřeba, npm run start:dev)
# 2. Test anon access:
curl -i http://localhost:3000/api/ikaros-articles
# Očekávané: 200, JSON array

# 3. Test write blocked:
curl -i -X POST http://localhost:3000/api/ikaros-articles \
  -H "Content-Type: application/json" -d '{"title":"x"}'
# Očekávané: 401 Unauthorized
```

---

## 7. Změny v souborech

| Soubor | Druh změny | Velikost |
|---|---|---|
| `backend/src/common/guards/optional-jwt-auth.guard.ts` | nový | ~40 ř. |
| `backend/src/modules/ikaros-articles/ikaros-articles.controller.ts` | refactor guards (class → method) | ~+12 / -1 ř. |
| `backend/src/modules/ikaros-articles/ikaros-articles.service.ts` | optional params + anon path | ~+10 / -2 ř. |
| `backend/src/modules/ikaros-articles/ikaros-articles.service.spec.ts` | +3 testy (anon scénáře) | ~+30 ř. |
| `backend/src/modules/ikaros-articles/ikaros-articles.module.ts` | provide `OptionalJwtAuthGuard` (pokud potřeba) | ~+2 ř. |
| (totéž pro `ikaros-gallery`) | identický refactor | ~+12 / -1 + ~+10 / -2 + ~+30 ř. |
| (totéž pro `ikaros-discussions`) | identický refactor | ~+12 / -1 + ~+10 / -2 + ~+30 ř. |
| `docs/dluhy.md` (FE repo) | D-008 → Uzavřené, nový D-016 | ~+25 / -25 ř. |
| `docs/arch/phase-1/spec-1.2g-be-anon-access.md` (FE repo) | tento dokument | nový |

**Celkem BE:** ~9 souborů, ~190-220 ř. změn.

---

## 8. Riziko & rollback

- **Riziko 1:** `OptionalJwtAuthGuard` špatně override-uje passport → invalid token by mohl projít jako anon (např. tampered JWT). Mitigace: passport v `super.canActivate` pořád dělá validaci; jen jsme změnili reakci na chybu (catch → return true). Validní token = user populován; invalid token = anon path. **Není security issue** — write endpointy mají standard `JwtAuthGuard`, který validní token vyžaduje.
- **Riziko 2:** Existující auth path se neúmyslně rozbije (např. přihlášený user dostane jiná data). Mitigace: service logika `if (!role)` dělá early-return; existující auth path zůstává **identický**.
- **Riziko 3:** DI selže — `OptionalJwtAuthGuard` potřebuje `IUsersRepository`, který ne vždy bude v scope. Mitigace: 3 dotčené moduly už `IUsersRepository` mají (díky `JwtAuthGuard`). Nový guard se přidá jako provider stejně.
- **Rollback:** revert jednoho commitu v BE repu. Žádná DB migrace, žádná schema změna.

---

## 9. Otázky k autorovi

1. ✅ Souhlasíš s **variantou A** (lokální `OptionalJwtAuthGuard`) místo plného B (`APP_GUARD` + `@Public()`) — viz analýza v auditu?
2. ✅ Souhlasíš s **strategií 4.3** (optional params s `if (!role)` early-return) místo separátních metod nebo sentinel role?
3. ✅ Souhlasíš s **přidáním D-016** (široký BE auth audit) jako nového dluhu — security holes v `timeline`, `world-weather`, `world-calendar-config`?
4. ✅ Souhlasíš se všemi mappingy read/write v sekci 3.5 (např. `ikaros-articles.GET /` = anon-OK, `GET /pending` = vyžaduje auth)?

---

**Po schválení specu napíšu implementační plán s přesnými diffy.**
