# Implementační plán 3.2a — BE infrastruktura

**Status:** Návrh — čeká na potvrzení PJ
**Spec:** [spec-3.2.md §7](./spec-3.2.md)
**Větev:** `feat/krok-3.2a-be-articles-infra` (v `Projekt-ikaros`)
**Odhad:** ~600 ř. nového BE + ~350 ř. BE testů
**Repo:** `Projekt-ikaros` (backend)

---

## Postup vysoké úrovně

| # | Fáze | Cíl |
|---|---|---|
| A | Schemas + DTOs | `ArticleReadSchema`, `ArticleCategorySchema`, DTOs |
| B | `ikaros-categories` modul (nový) | CRUD endpointy + admin guard |
| C | `article-reads` rozšíření existujícího `ikaros-articles` modulu | Reads tracking endpointy |
| D | `ArticleReviewProvider` | Provider + registrace v `IkarosArticlesModule` |
| E | Anon read (`OptionalJwtAuthGuard`) | Articles controller refactor |
| F | Category validation refactor | Service `assertCategoryExists` |
| G | Migrace seed kategorií + legacy slug migrace | Idempotentní migrace |
| H | Testy | +25 testů (provider, anon, reads, categories) |
| I | Lint + build + commit + PR | Push na main |

⚠️ **PJ checkpoint po každé fázi A–H** — krátký report + souhlas pokračovat. Pokud PJ řekne „pokračuj sám", přeskočíme.

---

## Fáze A — Schemas + DTOs

### A1. `ArticleReadSchema`

**Nový soubor:** `backend/src/modules/ikaros-articles/schemas/article-read.schema.ts`

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ArticleReadDocument = HydratedDocument<ArticleReadSchemaClass>;

@Schema({ collection: 'article_reads' })
export class ArticleReadSchemaClass {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) articleId: string;
  @Prop({ default: () => new Date() }) readAt: Date;
}

export const ArticleReadSchema = SchemaFactory.createForClass(ArticleReadSchemaClass);
ArticleReadSchema.index({ userId: 1 });
ArticleReadSchema.index({ articleId: 1 });
ArticleReadSchema.index({ userId: 1, articleId: 1 }, { unique: true });
```

### A2. `ArticleCategorySchema`

**Nový soubor:** `backend/src/modules/ikaros-categories/schemas/article-category.schema.ts`

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ArticleCategoryDocument = HydratedDocument<ArticleCategorySchemaClass>;

@Schema({ collection: 'article_categories' })
export class ArticleCategorySchemaClass {
  @Prop({ required: true, unique: true }) key: string;
  @Prop({ required: true }) label: string;
  @Prop({ required: true }) color: string;
  @Prop({ required: true }) order: number;
  @Prop({ default: () => new Date() }) createdAtUtc: Date;
}

export const ArticleCategorySchema = SchemaFactory.createForClass(ArticleCategorySchemaClass);
ArticleCategorySchema.index({ order: 1 });
```

### A3. DTOs

**Nové soubory:** `backend/src/modules/ikaros-categories/dto/`

- `create-article-category.dto.ts`:
  ```ts
  export class CreateArticleCategoryDto {
    @IsString() @IsNotEmpty() @Matches(/^[a-z0-9-]+$/) @MaxLength(40) key: string;
    @IsString() @IsNotEmpty() @MaxLength(60) label: string;
    @IsString() @Matches(/^#[0-9a-fA-F]{6}$/) color: string;
    @IsInt() @Min(0) order: number;
  }
  ```
- `update-article-category.dto.ts`:
  ```ts
  export class UpdateArticleCategoryDto {
    @IsOptional() @IsString() @MaxLength(60) label?: string;
    @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{6}$/) color?: string;
    @IsOptional() @IsInt() @Min(0) order?: number;
  }
  ```

### A4. Commit

```
feat(articles): A. schemas + DTOs for reads and categories

- ArticleReadSchema with compound unique index (userId, articleId)
- ArticleCategorySchema with unique key + order index
- DTOs for category CRUD (slug regex, hex color regex)
```

---

## Fáze B — `ikaros-categories` modul (nový)

### B1. Repository

**Nový soubor:** `backend/src/modules/ikaros-categories/repositories/article-categories.repository.ts`

Interface:

```ts
export interface IArticleCategoriesRepository {
  findAll(): Promise<ArticleCategory[]>;
  findByKey(key: string): Promise<ArticleCategory | null>;
  create(data: CreateArticleCategoryDto): Promise<ArticleCategory>;
  update(key: string, patch: Partial<ArticleCategory>): Promise<ArticleCategory | null>;
  delete(key: string): Promise<boolean>;
}
```

Mongo implementace using `ArticleCategoryDocument`. `findAll` řadí `{ order: 1 }`.

### B2. Service

**Nový soubor:** `backend/src/modules/ikaros-categories/article-categories.service.ts`

```ts
@Injectable()
export class ArticleCategoriesService {
  constructor(
    @Inject('IArticleCategoriesRepository')
    private readonly repo: IArticleCategoriesRepository,
    @Inject('IIkarosArticlesRepository')
    private readonly articlesRepo: IIkarosArticlesRepository,
  ) {}

  async findAll() { return this.repo.findAll(); }

  async findByKey(key: string) {
    const cat = await this.repo.findByKey(key);
    if (!cat) throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Kategorie nenalezena' });
    return cat;
  }

  async create(dto: CreateArticleCategoryDto) {
    const existing = await this.repo.findByKey(dto.key);
    if (existing) throw new ConflictException({ code: 'CATEGORY_KEY_TAKEN', message: 'Kategorie s tímto klíčem už existuje' });
    return this.repo.create(dto);
  }

  async update(key: string, dto: UpdateArticleCategoryDto) {
    await this.findByKey(key);
    return this.repo.update(key, dto);
  }

  async delete(key: string) {
    await this.findByKey(key);
    const inUse = await this.articlesRepo.countByCategory(key);
    if (inUse > 0) {
      throw new ConflictException({
        code: 'CATEGORY_IN_USE',
        message: `Kategorii nelze smazat — používá ji ${inUse} článků`,
      });
    }
    return this.repo.delete(key);
  }
}
```

### B3. Controller

**Nový soubor:** `backend/src/modules/ikaros-categories/article-categories.controller.ts`

```ts
@Controller('article-categories')
export class ArticleCategoriesController {
  constructor(private readonly service: ArticleCategoriesService) {}

  @Get() findAll() { return this.service.findAll(); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateArticleCategoryDto, @CurrentUser() user: RequestUser) {
    this.assertAdmin(user.role);
    return this.service.create(dto);
  }

  @Patch(':key')
  @UseGuards(JwtAuthGuard)
  update(@Param('key') key: string, @Body() dto: UpdateArticleCategoryDto, @CurrentUser() user: RequestUser) {
    this.assertAdmin(user.role);
    return this.service.update(key, dto);
  }

  @Delete(':key')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async delete(@Param('key') key: string, @CurrentUser() user: RequestUser) {
    if (user.role !== UserRole.Superadmin) throw new ForbiddenException();
    await this.service.delete(key);
  }

  private assertAdmin(role: UserRole) {
    if (![UserRole.Admin, UserRole.Superadmin].includes(role)) {
      throw new ForbiddenException({ code: 'CATEGORY_FORBIDDEN', message: 'Jen Admin/Superadmin' });
    }
  }
}
```

### B4. Module + registrace

**Nový soubor:** `backend/src/modules/ikaros-categories/ikaros-categories.module.ts`

Registrovat v `AppModule`. Export `ArticleCategoriesService` pro use v `ikaros-articles` (validation).

### B5. `IkarosArticlesRepository.countByCategory(key)`

**Edit:** existující repo + interface — přidat `countByCategory(key: string): Promise<number>`.

### B6. Commit

```
feat(categories): B. ikaros-categories module (CRUD + admin guards)
```

---

## Fáze C — `article-reads` rozšíření

### C1. Repository

**Nový soubor:** `backend/src/modules/ikaros-articles/repositories/article-reads.repository.ts`

```ts
export interface IArticleReadsRepository {
  upsertRead(userId: string, articleId: string): Promise<void>;
  isRead(userId: string, articleId: string): Promise<boolean>;
  unreadCount(userId: string): Promise<number>;
}
```

`upsertRead` použije Mongo `findOneAndUpdate` s `{ upsert: true, setDefaultsOnInsert: true }`. Idempotentní.

`unreadCount` aggregate:
```ts
const publishedCount = await this.articlesRepo.countByStatus('Published');
const readCount = await this.readsModel.countDocuments({
  userId,
  articleId: { $in: await this.articlesRepo.findPublishedIds() },
});
return publishedCount - readCount;
```

⚠️ **Optimalizace:** pokud `articles_count > 10000`, replace aggregate s `articles.lookup` přes Mongo `$facet`. Pro <10k stačí počítat takhle.

### C2. Service extension v `IkarosArticlesService`

**Edit:** `backend/src/modules/ikaros-articles/ikaros-articles.service.ts`

Inject `IArticleReadsRepository`. Přidat:

```ts
async markRead(articleId: string, userId: string): Promise<void> {
  const article = await this.repo.findById(articleId);
  if (!article) throw new NotFoundException(...);
  if (article.status !== 'Published') {
    throw new BadRequestException({
      code: 'ARTICLE_NOT_PUBLISHED',
      message: 'Lze označit jen publikovaný článek',
    });
  }
  await this.readsRepo.upsertRead(userId, articleId);
}

async isReadByUser(articleId: string, userId: string): Promise<boolean> {
  return this.readsRepo.isRead(userId, articleId);
}

async unreadCountForUser(userId: string): Promise<number> {
  return this.readsRepo.unreadCount(userId);
}
```

### C3. Controller endpointy

**Edit:** `ikaros-articles.controller.ts` — přidat 3 endpointy:

```ts
@Post(':id/mark-read')
@HttpCode(204)
async markRead(@Param('id') id: string, @CurrentUser() user: RequestUser) {
  await this.service.markRead(id, user.id);
}

@Get('unread-count')
unreadCount(@CurrentUser() user: RequestUser) {
  return this.service.unreadCountForUser(user.id).then(count => ({ count }));
}

@Get(':id/read-status')
readStatus(@Param('id') id: string, @CurrentUser() user: RequestUser) {
  return this.service.isReadByUser(id, user.id).then(read => ({ read }));
}
```

### C4. Commit

```
feat(articles): C. mark-as-read tracking (article_reads collection)
```

---

## Fáze D — `ArticleReviewProvider`

### D1. ListItem type

**Nový soubor:** `backend/src/modules/ikaros-articles/interfaces/article-review-list-item.interface.ts`

```ts
export interface ArticleReviewListItem {
  articleId: string;
  title: string;
  preview: string;       // prvních 200 znaků obsahu (stripped HTML pro 3.2b TipTap output)
  category: string;
  authorId: string;
  authorName: string;
  submittedAt: string;   // ISO
}
```

### D2. Provider

**Nový soubor:** `backend/src/modules/ikaros-articles/article-review.provider.ts`

```ts
import { Injectable, Inject } from '@nestjs/common';
import { IPendingActionProvider } from '../pending-actions/pending-action-provider.interface';
import { PendingActionType } from '../pending-actions/pending-action-type.enum';
import { UserRole } from '../users/interfaces/user.interface';
import type { IIkarosArticlesRepository } from './interfaces/ikaros-articles-repository.interface';
import type { ArticleReviewListItem } from './interfaces/article-review-list-item.interface';

const REVIEWER_ROLES = [UserRole.Superadmin, UserRole.Admin, UserRole.SpravceClanku];

@Injectable()
export class ArticleReviewProvider implements IPendingActionProvider<ArticleReviewListItem> {
  readonly type = PendingActionType.ArticlePendingReview;

  constructor(
    @Inject('IIkarosArticlesRepository')
    private readonly repo: IIkarosArticlesRepository,
  ) {}

  canHandle(_userId: string, role: UserRole): boolean {
    return REVIEWER_ROLES.includes(role);
  }

  async countForUser(_userId: string, role: UserRole): Promise<number> {
    if (!this.canHandle(_userId, role)) return 0;
    return this.repo.countByStatus('Pending');
  }

  async listForUser(_userId: string, role: UserRole, page: number, limit: number) {
    if (!this.canHandle(_userId, role)) return { items: [], total: 0 };
    const offset = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      this.repo.findPendingPaginated(offset, limit),
      this.repo.countByStatus('Pending'),
    ]);
    const items: ArticleReviewListItem[] = articles.map((a) => ({
      articleId: a.id,
      title: a.title,
      preview: this.stripHtml(a.content).slice(0, 200),
      category: a.category,
      authorId: a.authorId,
      authorName: a.authorName,
      submittedAt: a.updatedAtUtc.toISOString(),
    }));
    return { items, total };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
```

### D3. Repo doplnit `findPendingPaginated` + `countByStatus`

**Edit:** `ikaros-articles.repository.ts` + interface.

```ts
findPendingPaginated(offset: number, limit: number): Promise<IkarosArticle[]>;
countByStatus(status: string): Promise<number>;
```

Mongo: `find({ status: 'Pending' }).sort({ updatedAtUtc: -1 }).skip(offset).limit(limit)`.

### D4. Registrace v `IkarosArticlesModule.onModuleInit()`

**Edit:** `ikaros-articles.module.ts`

```ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IkarosArticleSchemaClass.name, schema: IkarosArticleSchema },
      { name: ArticleReadSchemaClass.name, schema: ArticleReadSchema },
    ]),
    PendingActionsModule, // ⚠️ import
  ],
  controllers: [IkarosArticlesController],
  providers: [
    IkarosArticlesService,
    ArticleReviewProvider,
    { provide: 'IIkarosArticlesRepository', useClass: IkarosArticlesRepository },
    { provide: 'IArticleReadsRepository', useClass: ArticleReadsRepository },
  ],
})
export class IkarosArticlesModule implements OnModuleInit {
  constructor(
    private readonly pendingActions: PendingActionsService,
    private readonly provider: ArticleReviewProvider,
  ) {}

  onModuleInit() {
    this.pendingActions.register(this.provider);
  }
}
```

### D5. Commit

```
feat(articles): D. ArticleReviewProvider for Zpracovat tab integration
```

---

## Fáze E — Anon read (`OptionalJwtAuthGuard`)

### E1. Ověřit existenci `OptionalJwtAuthGuard`

Vzor: `ikaros-news.controller.ts` ho už používá (3.1). Reuse.

### E2. Controller refactor

**Edit:** `ikaros-articles.controller.ts`

```ts
@Get()
@UseGuards(OptionalJwtAuthGuard)
findAll(@CurrentUserOrNull() user: RequestUser | null) {
  return this.service.findAll(user?.role, user?.username);
}

@Get(':id')
@UseGuards(OptionalJwtAuthGuard)
findById(@Param('id') id: string, @CurrentUserOrNull() user: RequestUser | null) {
  return this.service.findById(id, user?.id, user?.role, user?.username);
}
```

Ostatní endpointy (`/my`, `/pending`, `/stats`, `POST`, `PUT`, `DELETE`, `/submit`, `/approve`, `/reject`, `/rate`, `/mark-read`, `/unread-count`, `/read-status`) zůstávají `@UseGuards(JwtAuthGuard)`.

### E3. Service změny

**Edit:** `ikaros-articles.service.ts`

```ts
async findAll(role?: UserRole, username?: string): Promise<IkarosArticle[]> {
  if (!role) return this.repo.findPublished();  // anon
  if (this.isAdmin(role, username || '')) return this.repo.findPublishedAndPending();
  return this.repo.findPublished();
}

async findById(
  id: string,
  userId: string | undefined,
  role: UserRole | undefined,
  username: string | undefined,
): Promise<IkarosArticle> {
  const article = await this.repo.findById(id);
  if (!article) throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Článek nenalezen' });

  // Anon → jen Published
  if (!userId) {
    if (article.status !== 'Published') {
      throw new ForbiddenException({ code: 'ARTICLE_ACCESS_DENIED', message: 'Přístup odepřen' });
    }
    return article;
  }

  // Authenticated — původní logika
  if (
    article.status !== 'Published' &&
    article.authorId !== userId &&
    !this.isAdmin(role!, username || '')
  ) {
    throw new ForbiddenException({ code: 'ARTICLE_ACCESS_DENIED', message: 'Přístup odepřen' });
  }
  return article;
}
```

### E4. Commit

```
feat(articles): E. anon read for Published articles (OptionalJwtAuthGuard)
```

---

## Fáze F — Category validation refactor

### F1. Odstranit hardcoded enum z DTO

**Edit:** `backend/src/modules/ikaros-articles/dto/create-article.dto.ts`

```ts
export class CreateArticleDto {
  @IsString() @IsNotEmpty() @MaxLength(300) title: string;
  @IsString() @IsNotEmpty() @MaxLength(50000) content: string;
  @IsString() @IsOptional() @Matches(/^[a-z0-9-]+$/) category?: string;  // slug, validation v service
  @IsBoolean() @IsOptional() submit?: boolean;
}
```

Stejně v `update-article.dto.ts`.

### F2. Service validation

**Edit:** `ikaros-articles.service.ts`

Inject `ArticleCategoriesService`. V `create()` a `update()`:

```ts
async create(dto: CreateArticleDto, authorId: string, authorName: string, _role: UserRole) {
  const categoryKey = dto.category ?? 'ostatni';
  await this.categoriesService.findByKey(categoryKey); // throws if not found
  const status = dto.submit ? 'Pending' : 'Draft';
  const article = await this.repo.create({
    title: dto.title,
    content: dto.content,
    category: categoryKey,
    // ...
  });
  // ...
}

async update(id: string, dto: UpdateArticleDto, userId: string, _role: UserRole, _username: string) {
  // ...
  if (dto.category) await this.categoriesService.findByKey(dto.category);
  // ...
}
```

### F3. Schema field type

**Edit:** `ikaros-article.schema.ts` — `@Prop({ default: 'ostatni' }) category: string;` (slug místo PascalCase).

### F4. Commit

```
feat(articles): F. category as slug + DB validation (no more hardcoded enum)
```

---

## Fáze G — Migrace seed + legacy slug migrace

### G1. Migrace seed kategorií

**Nový soubor:** `backend/src/migrations/202605151200-seed-article-categories.ts`

```ts
const DEFAULTS = [
  { key: 'povidky',  label: 'Povídky',  color: '#64b5f6', order: 0 },
  { key: 'poezie',   label: 'Poezie',   color: '#ce93d8', order: 1 },
  { key: 'uvahy',    label: 'Úvahy',    color: '#ffb74d', order: 2 },
  { key: 'recenze',  label: 'Recenze',  color: '#4caf50', order: 3 },
  { key: 'postavy',  label: 'Postavy',  color: '#ff8a65', order: 4 },
  { key: 'ostatni',  label: 'Ostatní',  color: '#8b98a5', order: 5 },
];

export async function up(db: Db) {
  for (const cat of DEFAULTS) {
    await db.collection('article_categories').updateOne(
      { key: cat.key },
      { $setOnInsert: { ...cat, createdAtUtc: new Date() } },
      { upsert: true },
    );
  }
}

export async function down(db: Db) {
  await db.collection('article_categories').deleteMany({
    key: { $in: DEFAULTS.map(c => c.key) },
  });
}
```

Idempotent (`$setOnInsert`), bezpečný re-run.

### G2. Legacy slug migrace článků

**Nový soubor:** `backend/src/migrations/202605151201-articles-category-slug.ts`

```ts
const MAPPING: Record<string, string> = {
  Povidky:  'povidky',
  Poezie:   'poezie',
  Uvahy:    'uvahy',
  Recenze:  'recenze',
  Postavy:  'postavy',
  Ostatni:  'ostatni',
};

export async function up(db: Db) {
  for (const [from, to] of Object.entries(MAPPING)) {
    await db.collection('ikaros_articles').updateMany(
      { category: from },
      { $set: { category: to } },
    );
  }
}

export async function down(db: Db) {
  const reverse = Object.fromEntries(Object.entries(MAPPING).map(([k, v]) => [v, k]));
  for (const [from, to] of Object.entries(reverse)) {
    await db.collection('ikaros_articles').updateMany(
      { category: from },
      { $set: { category: to } },
    );
  }
}
```

### G3. Commit

```
feat(articles): G. migrations — seed categories + legacy slug rename
```

---

## Fáze H — Testy

### H1. `article-review.provider.spec.ts` (+8 cases)

- `canHandle` pro 6 globálních rolí (Superadmin/Admin/SpravceClanku=true, Ikarus/SpravceGalerie/SpravceDiskuzi=false)
- `countForUser` vrací jen Pending count
- `listForUser` paginuje
- Payload má všechna pole
- `stripHtml` odstraní tagy

### H2. `ikaros-articles.service.spec.ts` rozšíření (+6 cases)

- Anon `findAll(undefined)` → jen Published
- Anon `findById(Draft)` → 403
- `create` s neexistujícím category → NotFoundException
- `update` s neexistujícím category → NotFoundException
- `create` bez category → default `'ostatni'`
- `findAll(SpravceClanku)` → Published + Pending

### H3. `article-reads.repository.spec.ts` (+5 cases)

- `upsertRead` idempotentní (2× call = 1 záznam)
- `isRead` true/false
- `unreadCount` správně počítá Published - read

### H4. `article-categories.service.spec.ts` (+6 cases)

- CRUD happy path
- `create` duplicate key → 409
- `delete` in-use category → 409
- `findByKey` not found → 404

### H5. Commit

```
test(articles): H. +25 BE tests for 3.2a
```

---

## Fáze I — Lint + build + commit + PR

### I1. `npm run lint`

Fix all warnings.

### I2. `npm run build`

Verify TypeScript compile.

### I3. `npm run test`

Full suite must pass. Cíl: **+25 testů, žádný regression.**

### I4. Run migrace lokálně

`npm run migrate:up` — seed + slug.

### I5. PR

Title: `feat(articles): 3.2a — BE infrastructure (provider, anon, reads, categories)`

Body:
- Spec link
- 6 fází shrnutí
- Acceptance criteria checked
- Migrations notes
- Breaking changes: none (legacy enum hodnoty migrovány)

---

## Příprava na 3.2b

Po landingu 3.2a → FE může začít 3.2b TipTap editor paralelně. 3.2c+d čekají na merged 3.2a (potřebují endpointy a kategorie collection).
