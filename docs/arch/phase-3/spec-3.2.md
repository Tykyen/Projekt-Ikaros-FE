# Spec 3.2 — Ikaros články (`/ikaros/clanky`)

**Status:** ✅ Schváleno (2026-05-15, PJ)
**Rozsah:** FE (3 stránky + sdílený TipTap editor + Zpracovat renderer + discovery features) + BE (provider, anon read, mark-as-read collection, kategorie collection)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (backend)
**Velikost:** velká — rozdělena do **5 sub-fází** (3.2a–e), každá vlastní plán + PR
**Autor:** PJ + Claude
**Datum:** 2026-05-15
**Souvisí:**
- [spec-3.1.md](spec-3.1.md) — novinky (vzor admin page, zavře D-066 TipTap)
- [spec-1.4.md](../phase-1/spec-1.4.md) — Zpracovat tab infra
- [spec-2.4.md](../phase-2/spec-2.4.md) — vzor pre-membership entity (zde `article_reads`)
- Legacy ref: `C:\Matrix\Matrix\frontend\src\pages\Ikaros\IkarosArticles*.tsx`

---

## 1. Cíl

Postavit **plnou literární komunitu článků** na Ikaros platformě:

- **Přehled** publikovaných článků (`/ikaros/clanky`) — search, sort, filtr kategorie, anon read.
- **Detail článku** (`/ikaros/clanky/:id`) — Editorial Atelier reading experience (TipTap rendered, drop cap, reading progress, distribuce hodnocení, „více od autora", mark-as-read tracking).
- **Editor** (`/ikaros/clanky/novy`, `/ikaros/clanky/:id/upravit`) — sdílený TipTap rich-text editor s bubble menu, auto-save do localStorage, kategorie picker.
- **Schvalování** přes Zpracovat tab (1.4 architektura) — `ArticleReviewProvider` + FE renderer; žádný inline pending banner.
- **Workflow:** Draft → Pending → Published / Rejected, rating 1–5★, autor nemůže hodnotit vlastní článek.
- **Dynamické kategorie** spravované adminem (DB collection, ne hardcoded enum).
- **Mark-as-read tracking** s badge „Nepřečteno" v přehledu.

Vše musí fungovat na 21 vizuálních skinech (skin-agnostic CSS tokens). Editorial Atelier je default Ikaros vibe, skiny mohou tokeny override.

---

## 2. Kontext / motivace

- Roadmap 3.2 původně mluvil o „Přehled (Published), `/novy` editor (TipTap), Draft → Pending → Published workflow, rating". Při auditu (2026-05-15, brainstorming s PJ) jsme rozsah rozšířili o **mark-as-read**, **dynamické kategorie**, **anon read**, **discovery features** (distribuce hodnocení, „více od autora", auto TOC) — cílem je **3.2 bez nedodělků**, ne MVP s technickými dluhy.
- BE modul `ikaros-articles` je **z velké části hotový** (CRUD + workflow + rating, viz Audit §3.1). FE staví jen UI + napojení na existující BE; výjimky jsou 4 nové BE features (provider, anon, reads, kategorie collection).
- Editor zavírá **dluh D-066** (TipTap, z 3.1).
- Sdílený `<RichTextEditor>` komponent je investice použitelná v 3.4 (diskuze), 3.5 (pošta), a budoucích fázích.

---

## 3. Audit současného stavu

### 3.1 BE — `ikaros-articles` modul (kompletní)

Soubor: `Projekt-ikaros/backend/src/modules/ikaros-articles/`.

**Endpointy** (vše dnes `@UseGuards(JwtAuthGuard)`):
- `GET /ikaros-articles` — Published (+pending pro admina).
- `GET /ikaros-articles/my` — vlastní (všechny status).
- `GET /ikaros-articles/pending` — Admin only.
- `GET /ikaros-articles/stats` — statistiky autora.
- `GET /ikaros-articles/:id` — detail (autor / Published / admin).
- `POST /ikaros-articles` — create (Draft nebo Pending dle `dto.submit`).
- `PUT /ikaros-articles/:id` — update (jen Draft/Rejected, jen autor).
- `DELETE /ikaros-articles/:id` — autor + admin.
- `POST /ikaros-articles/:id/submit` — Draft/Rejected → Pending.
- `POST /ikaros-articles/:id/approve` — Admin only.
- `POST /ikaros-articles/:id/reject` — Admin only, `{ reason? }`.
- `POST /ikaros-articles/:id/rate` — `{ stars: 1–5 }`, autor nemůže.

**Schema fields:** `title`, `content`, `category` (enum hardcoded 6×), `authorId`, `authorName`, `status` (`Draft|Pending|Published|Rejected`), `rejectReason?`, `ratings[]`, `averageRating`, timestamps, `publishedAtUtc?`.

**Notifikace:** Service už posílá interní zprávy (`IkarosMessages`) adminovi při submit a autorovi při approve/reject.

⚠️ **Co BE nemá a 3.2 to potřebuje:**
1. `ArticleReviewProvider implements IPendingActionProvider` — chybí, queue typ `article_pending_review` je v enumu (1.4), ale neexistuje provider, který by ho registroval v `PendingActionsService`.
2. Optional JWT na `GET /` + `GET /:id` Published-only pro anon — dnes všechno za JWT guardem.
3. `article_reads` collection + endpointy pro mark-as-read.
4. `article_categories` collection + CRUD + migrace seed.

### 3.2 BE — Pending Actions infra (1.4, hotová)

Soubor: `Projekt-ikaros/backend/src/modules/pending-actions/`.

- `IPendingActionProvider<TItem>` interface — `canHandle()`, `countForUser()`, `listForUser()`.
- `PendingActionsService.register(provider)` — registry, voláno v `onModuleInit()` jednotlivých modulů.
- `PendingActionType.ArticlePendingReview = 'article_pending_review'` — typ v enumu **už existuje** (chystaný z 1.4 pro 3.2).

Vzor implementace: `FriendshipsService` (1.8), `WorldsService` (2.4) — `onModuleInit()` registruje vlastní provider.

### 3.3 FE — Zpracovat tab (1.4, hotová)

Soubor: `src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx`.

- 3 zaregistrované renderery: `username_request`, `friend_request`, `world_access_request`.
- Kontrakt: `PendingActionRenderer<T>` má `renderLeft(item)`, `renderMid(item)`, `renderActions(item, helpers)`.
- 3.2d přidá 4. renderer pro `article_pending_review`.

### 3.4 FE — Legacy implementace (anti-vzor reference)

Soubory: `C:\Matrix\Matrix\frontend\src\pages\Ikaros\IkarosArticles.tsx`, `IkarosArticleDetail.tsx`, `IkarosArticleEditor.tsx`.

- Funkční, ale **inline styles**, plain textarea (žádný TipTap), `prompt()` pro reject reason, žádný reading flow, žádný auto-save, žádný search/sort, statistiky jako separátní tab.
- **Bereme z legacy:** 6 kategorií + barvy jako default, status badges (Draft/Pending/Published/Rejected), rating 1–5★ s hover preview, „min čtení" (`words / 200`), border-left v barvě kategorie.
- **Zahazujeme:** vše ostatní (UI/UX redesign od nuly).

### 3.5 FE — Existující design tokeny

Globální tokeny dostupné: `--surface-base`, `--surface-elevated`, `--frame-border`, `--accent`, `--text-strong`, `--text-muted`, `--text-subtle`. Per-skin override v `[data-theme="<id>"]`. 21 skinů.

⚠️ **3.2 přidává nové tokeny** (viz §6) — vše musí mít fallback default a být skin-overridable.

---

## 4. Rozsah

### 4.1 V rozsahu 3.2

**BE (3.2a):**
- ✅ `ArticleReviewProvider` + registrace v `IkarosArticlesModule.onModuleInit()`
- ✅ `OptionalJwtAuthGuard` na `GET /ikaros-articles` + `GET /:id` (anon vidí jen Published, žádný `findMy/stats/pending`)
- ✅ `article_reads` collection + `POST /:id/mark-read` + `GET /unread-count`
- ✅ `article_categories` collection + CRUD endpointy + admin panel + migrace seed 6 výchozích
- ✅ Refactor `category` na schemě z hardcoded enum na FK ref na `article_categories.key` (validation: musí existovat)

**FE (3.2b):**
- ✅ Sdílený `<RichTextEditor>` v `src/shared/components/RichTextEditor/`
- ✅ TipTap setup s 7 toolbar tlačítky: bold / italic / H2 / H3 / blockquote / bullet list / odkaz
- ✅ Bubble menu nad selection (ne top toolbar)
- ✅ Auto-save do localStorage hook `useDraftAutoSave`
- ✅ Self-host fonty přes `@fontsource-variable/fraunces` + `@fontsource-variable/crimson-pro` + `@fontsource-variable/jetbrains-mono`

**FE (3.2c):**
- ✅ `/ikaros/clanky` přehled (2 taby Přehled / Moje + mini stats widget v Moje)
- ✅ `/ikaros/clanky/:id` detail s reading experience
- ✅ `/ikaros/clanky/novy` + `/ikaros/clanky/:id/upravit` editor
- ✅ `RejectReasonModal` (povinný reason min 10 znaků)
- ✅ Search v přehledu (client-side debounced)
- ✅ Sort dropdown (Nejnovější / Nejlépe hodnocené / Nejvíc hodnocených)
- ✅ Kategorie filter pill chips s wax-seal dot
- ✅ Reading progress bar (2px top, fixed)
- ✅ Sticky autor card (margin-note italic vibe)
- ✅ Pravý panel link „Správa článků" pro SpravceClanku/Admin/Superadmin

**FE (3.2d):**
- ✅ `ArticlePendingReviewRenderer` v `PENDING_ACTION_RENDERERS` registry
- ✅ Renderer karty: title + autor + náhled prvních 200 znaků + tlačítka „Schválit" / „Vrátit s poznámkou"

**FE (3.2e):**
- ✅ Distribuce hodnocení (5 horizontálních bar lišt, Goodreads pattern)
- ✅ „Více od tohoto autora" sekce na detailu (3 random Published od autora)
- ✅ Mark-as-read tracking na FE — badge „Nepřečteno" na kartě v přehledu
- ✅ Auto TOC z `<h2>`/`<h3>` v rendered TipTap obsahu (sidebar @ desktop, accordion @ mobile)

### 4.2 Mimo rozsah 3.2

- ❌ **Cloudinary upload obrázků** v TipTap → **fáze 3.3 Galerie** (přidám položku do roadmapy)
- ❌ **Diskuze pod článkem** („Diskutuj o tomto") → **fáze 3.4 Diskuze** (přidám položku do roadmapy)
- ❌ Komentáře pod článkem (mimo diskuze) — vůbec ne, používáme 3.4 link pattern
- ❌ Audit log UI (kdo schvaloval/zamítl, kdy) — položka 3.6c universal audit (D-067 z 3.1)
- ❌ Pull request style review (rozhovor mezi adminem a autorem) — pokud bude poptávka, nový dluh
- ❌ Verze článků (historie editů) — nový dluh později
- ❌ Bulk approve/reject — D-NEW-bulk-pending (z 2.4)
- ❌ Push notifikace na schválení — fáze 13.2
- ❌ Tagy (volné, vedle kategorií) — později
- ❌ „Reading mode" (fullscreen, F key) — nový dluh později
- ❌ Reading stats (kolik lidí dočetlo, time spent) — vyžaduje samostatnou analytickou infra, mimo 3.2

---

## 5. Vizuální směr — Editorial Atelier (A + C synth)

**DNA:** Disciplinovaná typografie literárního časopisu (*Paris Review*, *Substack*) + decorative ornaments z manuskriptu (drop cap, glyph dividers, margin notes).

### 5.1 Klíčové vizuální prvky

- **`N° 0142` mono article ID** nahoře u titulku (Fraunces lookup pak JetBrains Mono pro ID)
- **Small-caps kategorie label** s thin separator (`POVÍDKY  ·  Listopad 2026`)
- **Wax-seal dot** v kategorii pill chip — tiny circle 6px v `--cat-*` barvě před label
- **Dramatic drop cap** první písmeno detailu — Fraunces 96px italic, float-left, 8 řádků vysoký
- **Glyph section breaks** `✦ ❦ ❧ ☙` — deterministická rotace per article ID (`charCodeAt(0) % 4`), JS-controlled
- **Reading progress bar** — fixed top, 2px, accent color, naplňuje se podle scroll position
- **Sticky autor card** — italic, smaller font, margin-note vibe (na desktopu vlevo od obsahu, na mobile nahoře)
- **Distribuce hodnocení** — 5 horizontálních lišt (5★ ▰▰▰▰▱ 62%), Goodreads pattern
- **Kategorie border-left** 3px v barvě kategorie na kartě přehledu + 4px na detail-headeru
- **„Více od autora"** sekce dole detailu — 3 mini karty s glyphem `❧`

### 5.2 Co NEděláme

- ❌ Žádná paper texture (skin conflict)
- ❌ Žádné border-illustration kolem každé karty (přetížené)
- ❌ Žádné italic display titles (rušivé pro reading)
- ❌ Žádné dekorativní glyphs napříč přehledu (jen na detailu)

📚 *Proč mix A + C funguje:* glyphs a drop cap jsou pure Unicode + typography — fungují na všech 21 skinech bez konfliktu. Žádná textura, žádný image asset. Originalita přes detail, ne přes wrap.

### 5.3 ASCII layout — detail (cílový stav)

```
━━━━━━━━━━━━ reading progress 47% ━━

                  N° 0142
                  POVÍDKY · Listopad 2026

         Cesta
         do hvozdů
         ────
         Petra K. · 4 min čtení

┌─ Petra K. ─┐
│  avatar    │   ┌─┐
│            │   │Z│lomil si nohu hned u vchodu, ale
│  8 článků  │   └─┘ vůle ho vedla dál mezi borovice.
│  ★ 4,3     │
│            │   Říkali mu, že tam najde odpověď, ale
│  margin    │   nikdo už necitoval z čeho...
│  italic    │
│            │              ✦
│  Více →    │
└────────────┘   Druhého rána slunce probudilo…
   (sticky)

                 ──────

                ★★★★☆  4,3 z 5

                5 ▰▰▰▰▰▰▰▰ 62%
                4 ▰▰▰▰▱▱▱▱ 25%   12 hodnocení
                3 ▰▱▱▱▱▱▱▱ 8%
                2 ▱▱▱▱▱▱▱▱ 5%
                1 ▱▱▱▱▱▱▱▱ 0%

                 ──────

         ❧ Více z atelieru Petry K.

         ❧ Smutek a ranní mlha    4,7 (15)
         ❧ Na konci světa         4,1 (22)
         ❧ Dům u jezera           3,9 (8)
```

---

## 6. Typografie a design tokeny

### 6.1 Nové fonty (self-host)

| Účel | Font | npm package | Velikost (subsetted latin-ext) |
|------|------|-------------|-------------------------------|
| Display + drop cap | `Fraunces Variable` (axes: opsz, SOFT, WONK) | `@fontsource-variable/fraunces` | ~80 KB |
| Body prose | `Crimson Pro Variable` | `@fontsource-variable/crimson-pro` | ~50 KB |
| Mono accent | `JetBrains Mono Variable` | `@fontsource-variable/jetbrains-mono` | ~50 KB |

**Loading strategie:**
- `@fontsource-variable/fraunces/wght.css` + preload 400+700 weights
- `@fontsource-variable/crimson-pro/wght.css` + preload 400 weight
- `@fontsource-variable/jetbrains-mono/wght.css` + preload 500 weight
- `font-display: swap`
- Subset jen latin-ext (čeština)

⚠️ **Bundle cost:** ~180KB. Akceptovatelný pro literární platformu kde typografie je core feature.

### 6.2 Nové CSS tokeny v `src/app/styles/theme.css` (base layer)

```css
:root {
  /* Prose typografie */
  --prose-font-display: 'Fraunces Variable', ui-serif, Georgia, serif;
  --prose-font-body: 'Crimson Pro Variable', ui-serif, Georgia, serif;
  --prose-font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;
  --prose-max-width: 65ch;
  --prose-line-height: 1.7;
  --prose-paragraph-spacing: 1.5em;
  --prose-drop-cap-size: 5em;
  --prose-divider-glyphs: '✦', '❦', '❧', '☙';

  /* Kategorie default barvy (legacy paleta) */
  --cat-povidky: #64b5f6;
  --cat-poezie:  #ce93d8;
  --cat-uvahy:   #ffb74d;
  --cat-recenze: #4caf50;
  --cat-postavy: #ff8a65;
  --cat-ostatni: #8b98a5;

  /* Status badges */
  --status-draft:     var(--text-muted);
  --status-pending:   #ff9800;
  --status-published: #4caf50;
  --status-rejected:  #ff4444;
}
```

⚠️ **Skin override pattern** — sci-fi skiny si mohou v `[data-theme="sci-fi-corp"] { --prose-divider-glyphs: '▸'; --prose-font-display: 'Orbitron', ...; }`.

### 6.3 Per-kategorie barva — dynamicky z BE

Kategorie jsou v 3.2 v DB (collection `article_categories`). FE čte `color` field a aplikuje jako inline `style="--cat-current: <color>"` na border-left / chip background.

Default `--cat-*` tokeny v §6.2 slouží jako fallback při hydraci, BE pošle confirm hodnoty.

---

## 7. Sub-fáze 3.2a — BE infrastruktura

**Repo:** `Projekt-ikaros` (backend)
**Velikost:** ~10 nových / 4 upravené BE soubory
**Závisí na:** 1.4 pending-actions infra (hotová), 3.1 BE patterns (hotová)
**Předchází:** 3.2c (FE potřebuje BE endpointy), 3.2d (FE renderer potřebuje BE provider data)

### 7.1 `ArticleReviewProvider`

Nový soubor: `backend/src/modules/ikaros-articles/article-review.provider.ts`.

```ts
@Injectable()
export class ArticleReviewProvider implements IPendingActionProvider<ArticleReviewListItem> {
  readonly type = PendingActionType.ArticlePendingReview;

  constructor(
    @Inject('IIkarosArticlesRepository') private readonly repo: IIkarosArticlesRepository,
    private readonly usersRepo: IUsersRepository,
  ) {}

  canHandle(_userId: string, role: UserRole, _perms?: AdminPermissions): boolean {
    return [UserRole.Superadmin, UserRole.Admin, UserRole.SpravceClanku].includes(role);
  }

  async countForUser(_userId: string, role: UserRole): Promise<number> {
    if (!this.canHandle(_userId, role)) return 0;
    return this.repo.countByStatus('Pending');
  }

  async listForUser(
    _userId: string,
    role: UserRole,
    page: number,
    limit: number,
  ): Promise<{ items: ArticleReviewListItem[]; total: number }> {
    if (!this.canHandle(_userId, role)) return { items: [], total: 0 };
    const offset = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      this.repo.findPendingPaginated(offset, limit),
      this.repo.countByStatus('Pending'),
    ]);
    const items: ArticleReviewListItem[] = articles.map((a) => ({
      articleId: a.id,
      title: a.title,
      preview: a.content.slice(0, 200),
      category: a.category,
      authorId: a.authorId,
      authorName: a.authorName,
      submittedAt: a.updatedAtUtc.toISOString(),
    }));
    return { items, total };
  }
}
```

Registrace v `ikaros-articles.module.ts`:

```ts
export class IkarosArticlesModule implements OnModuleInit {
  constructor(
    private readonly pendingActions: PendingActionsService,
    private readonly provider: ArticleReviewProvider,
  ) {}
  onModuleInit() { this.pendingActions.register(this.provider); }
}
```

### 7.2 Optional JWT pro public read

Refactor `ikaros-articles.controller.ts`:

```ts
// Anon-friendly endpointy
@Get()
@UseGuards(OptionalJwtAuthGuard)
findAll(@OptionalCurrentUser() user: RequestUser | null) {
  return this.service.findAll(user?.role, user?.username);
}

@Get(':id')
@UseGuards(OptionalJwtAuthGuard)
findById(@Param('id') id: string, @OptionalCurrentUser() user: RequestUser | null) {
  return this.service.findById(id, user?.id, user?.role, user?.username);
}
```

Service změny:
- `findAll(role?, username?)` — pokud `role === undefined` (anon) → vrátí jen `findPublished()`.
- `findById(id, userId?, role?, username?)` — anon vidí jen Published; non-Published → 403.

⚠️ **`OptionalJwtAuthGuard`** musí existovat (vzor 3.1 novinky, který už používá `OptionalJwtAuthGuard`). Reuse.

### 7.3 `article_reads` collection

Nový soubor: `backend/src/modules/ikaros-articles/schemas/article-read.schema.ts`.

```ts
@Schema({ collection: 'article_reads' })
export class ArticleReadSchemaClass {
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ required: true, index: true }) articleId: string;
  @Prop({ default: () => new Date() }) readAt: Date;
}
export const ArticleReadSchema = SchemaFactory.createForClass(ArticleReadSchemaClass);
ArticleReadSchema.index({ userId: 1, articleId: 1 }, { unique: true });
```

Nové endpointy:

| Method | Path | Guard | Popis |
|---|---|---|---|
| POST | `/ikaros-articles/:id/mark-read` | JWT | Upsert `article_reads`. Idempotentní. Volá se z FE při `IntersectionObserver` detect že uživatel dočetl > 50 % obsahu. Vrací 204. |
| GET | `/ikaros-articles/unread-count` | JWT | Vrací `{ count: number }` — počet Published článků, které uživatel ještě nečetl. Pro badge v pravém panelu / Komunita sekci. |
| GET | `/ikaros-articles/:id/read-status` | JWT | Vrací `{ read: boolean }` — pro detail page (skrýt mark-as-read CTA pokud už přečteno). |

Service:
- `markRead(articleId, userId)` — upsert; idempotentní.
- `unreadCountForUser(userId)` — `findPublished().count() - readCount.where(userId).count()` (efficient via aggregate).
- `isReadByUser(articleId, userId)` — boolean.

### 7.4 `article_categories` collection

Nový soubor: `backend/src/modules/ikaros-articles/schemas/article-category.schema.ts`.

```ts
@Schema({ collection: 'article_categories' })
export class ArticleCategorySchemaClass {
  @Prop({ required: true, unique: true }) key: string;   // 'povidky', 'poezie', ...
  @Prop({ required: true }) label: string;               // 'Povídky', 'Poezie'
  @Prop({ required: true }) color: string;               // '#64b5f6'
  @Prop({ required: true }) order: number;               // 0, 1, 2, ...
  @Prop({ default: () => new Date() }) createdAtUtc: Date;
}
```

Nový modul: `backend/src/modules/ikaros-categories/`.

Endpointy:

| Method | Path | Guard | Popis |
|---|---|---|---|
| GET | `/article-categories` | None | Public read. Vrací array seřazené dle `order`. Cache 5 min. |
| POST | `/article-categories` | JWT + Admin/Superadmin | Create. Body: `{ key, label, color, order }`. 409 pokud `key` duplicate. |
| PATCH | `/article-categories/:key` | JWT + Admin/Superadmin | Update label/color/order. `key` immutable. |
| DELETE | `/article-categories/:key` | JWT + Superadmin | Smaže pokud žádný článek nemá tento `key`. 409 jinak. |

⚠️ **Validace `category` v `ikaros-articles`:** dnes je hardcoded enum v DTO. Refactor:
- Odstranit `@IsIn([...])` v `CreateArticleDto`.
- Service `create()` / `update()` — před uložením `await categoryRepo.findByKey(dto.category)` → 400 pokud not found.
- Default při create bez category: pokud `Ostatni` neexistuje → 500 (migrace musí seedovat).

**Migrace seed** (`backend/src/migrations/<timestamp>-seed-article-categories.ts`):

```ts
const DEFAULTS = [
  { key: 'povidky',  label: 'Povídky',  color: '#64b5f6', order: 0 },
  { key: 'poezie',   label: 'Poezie',   color: '#ce93d8', order: 1 },
  { key: 'uvahy',    label: 'Úvahy',    color: '#ffb74d', order: 2 },
  { key: 'recenze',  label: 'Recenze',  color: '#4caf50', order: 3 },
  { key: 'postavy',  label: 'Postavy',  color: '#ff8a65', order: 4 },
  { key: 'ostatni',  label: 'Ostatní',  color: '#8b98a5', order: 5 },
];
// upsert by key — idempotentní
```

⚠️ **Compat migrace pro stávající články:** legacy enum hodnoty (`'Povidky'`, `'Poezie'`, ...) → mapping na slugged keys (`'povidky'`, `'poezie'`, ...). Single migration script. Bez ztráty dat.

📚 *Proč slug místo PascalCase legacy:* slugy jsou URL-safe (pro `/clanky?cat=povidky` filter), konzistentní s `article_categories.key`, snadnější CSS token mapping (`--cat-povidky`).

### 7.5 Akceptační kritéria 3.2a

- BE-AK1: `ArticleReviewProvider.canHandle` vrací `true` pro Superadmin/Admin/SpravceClanku, `false` pro ostatní role.
- BE-AK2: `countForUser` vrací počet Pending článků (ne včetně Draft/Rejected).
- BE-AK3: `listForUser` paginuje 20/stránka, řazení `updatedAtUtc DESC`.
- BE-AK4: `GET /pending-actions/count` po startu zahrnuje pending články pro správně-rolovaného usera.
- BE-AK5: `GET /pending-actions?type=article_pending_review` vrací očekávaný payload (`ArticleReviewListItem`).
- BE-AK6: Anon (`GET /ikaros-articles` bez JWT) → 200 s Published-only listem.
- BE-AK7: Anon (`GET /ikaros-articles/:id` pro Draft/Pending/Rejected) → 403.
- BE-AK8: `POST /:id/mark-read` idempotentní (2× volání = stejný výsledek, žádný duplicate).
- BE-AK9: `GET /unread-count` vrací správný počet (Published count - read count).
- BE-AK10: `GET /article-categories` public, vrací seřazené dle `order`.
- BE-AK11: `POST /article-categories` Admin only, 403 pro ne-admina.
- BE-AK12: `DELETE /article-categories/:key` 409 pokud existuje článek s tímto `key`.
- BE-AK13: Migrace seed vytvoří 6 výchozích kategorií idempotentně.
- BE-AK14: `CreateArticleDto` validuje `category` proti DB (ne hardcoded enum).
- BE-AK15: Legacy data migrace přejmenuje enum hodnoty na slugy bez ztráty článků.

---

## 8. Sub-fáze 3.2b — Sdílený TipTap editor

**Repo:** `Projekt-ikaros-FE`
**Velikost:** ~6 nových souborů (komponenty + hook + styles + spec)
**Závisí na:** nic (čistý FE komponent)
**Předchází:** 3.2c (editor stránky ho použijí)
**Zavře dluh:** D-066

### 8.1 Adresářová struktura

```
src/shared/components/RichTextEditor/
├── RichTextEditor.tsx         # hlavní komponent
├── RichTextEditor.module.css  # styles
├── BubbleMenu.tsx             # bubble menu nad selection
├── extensions.ts              # TipTap extension konfigurace
├── useDraftAutoSave.ts        # auto-save hook
├── RichTextEditor.spec.tsx    # testy
└── index.ts                   # barrel export
```

### 8.2 Závislosti

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-placeholder": "^2.x"
}
```

⚠️ **Nepřidáváme:**
- `@tiptap/extension-image` (Cloudinary v 3.3)
- `@tiptap/extension-table` (literární obsah ne tabulky)
- `@tiptap/extension-code-block` (přeplnění)

### 8.3 API

```tsx
interface RichTextEditorProps {
  /** HTML obsah (TipTap output je HTML). */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Při změně se zavolá s pozicí cursoru pro auto-save state restore. */
  onSelectionChange?: (pos: number) => void;
  /** Klíč pro localStorage auto-save. Pokud nezadáno, auto-save vypnut. */
  autoSaveKey?: string;
  /** Max délka v znacích (UI-level, ne HTML). */
  maxLength?: number;
  /** Read-only render mode (pro detail stránky). */
  readOnly?: boolean;
  className?: string;
}
```

### 8.4 Bubble menu

Zobrazí se nad textovou selekcí. 7 tlačítek:

| Tlačítko | Action | Klávesa |
|---|---|---|
| **B** | Bold | ⌘B |
| **I** | Italic | ⌘I |
| **H2** | Heading 2 | ⌘⌥2 |
| **H3** | Heading 3 | ⌘⌥3 |
| **„ ”** | Blockquote | ⌘⇧B |
| **•** | Bullet list | ⌘⇧8 |
| **🔗** | Link toggle (prompt URL) | ⌘K |

⚠️ **Žádný top toolbar** — bubble menu only. Čistý Medium-like writing experience.

### 8.5 Auto-save hook

```ts
function useDraftAutoSave(
  key: string | undefined,
  value: string,
  options?: { debounceMs?: number }, // default 3000
): {
  hasUnsavedLocal: boolean;
  /** Snapshot z localStorage — pokud existuje a je novější než BE value, ukáže se uživateli „pokračovat?" dialog. */
  restoreCandidate: string | null;
  clearLocalDraft: () => void;
}
```

Behavior:
- `localStorage` key: `article-draft:{userId}:{articleId|new}`
- Debounce 3s po posledním change → write do localStorage
- Při mount: pokud localStorage má kontent + ten se liší od props.value → vrátí `restoreCandidate` (nezavádí ho automaticky)
- `beforeunload` event — pokud `hasUnsavedLocal === true` a posledních X ms se nesynchronizovalo, prompt browser native
- Po úspěšném BE save (autor klikne „Uložit koncept" / „Odeslat") → `clearLocalDraft()`

### 8.6 Read-only render (pro detail)

`<RichTextEditor value={article.content} readOnly />` renderuje HTML z TipTap bez editorial chrome. Použito v `ArticleDetailPage`.

Auto-aplikuje prose CSS class: `var(--prose-font-body)`, `var(--prose-line-height)`, `max-width: var(--prose-max-width)`.

### 8.7 Akceptační kritéria 3.2b

- BE-AK16: `<RichTextEditor>` renderuje s placeholderem.
- BE-AK17: Klávesa B v selection → text bold (HTML `<strong>`).
- BE-AK18: Klik na H2 v bubble menu → text v selection se obalí `<h2>`.
- BE-AK19: ⌘K → prompt → URL paste → text v selection se obalí `<a>`.
- BE-AK20: `autoSaveKey` defined → po 3s od change se obsah objeví v `localStorage[key]`.
- BE-AK21: Mount s existujícím local draft (jiným než `value`) → `restoreCandidate` neprázdný.
- BE-AK22: `clearLocalDraft()` smaže `localStorage[key]`.
- BE-AK23: `readOnly` mode — bubble menu se nezobrazí, klávesy nefungují, content jen renderuje.
- BE-AK24: Maxlength překročen → další input zablokován (TipTap `transformPaste`).

---

## 9. Sub-fáze 3.2c — Stránky articles

**Repo:** `Projekt-ikaros-FE`
**Velikost:** velká — ~18 nových / 4 upravené FE soubory
**Závisí na:** 3.2a (BE provider, anon, kategorie collection), 3.2b (sdílený editor)
**Předchází:** 3.2d (Zpracovat renderer používá payload z provideru, ale logika je nezávislá → může jít paralelně s 3.2c)

### 9.1 Routes

V `src/app/router.tsx`:

```tsx
{ path: 'ikaros/clanky', element: p(ArticlesListPage) },
{ path: 'ikaros/clanky/novy', loader: requireAuth, element: p(ArticleEditorPage) },
{ path: 'ikaros/clanky/:id', element: p(ArticleDetailPage) },  // anon-friendly
{ path: 'ikaros/clanky/:id/upravit', loader: requireAuth, element: p(ArticleEditorPage) },
```

Anon → `/clanky` a `/clanky/:id` (Published) volný; `/novy` a `/upravit` redirect na `/login`.

### 9.2 `ArticlesListPage` (`/ikaros/clanky`)

**Struktura:**

```
┌─ Header ──────────────────────────────────────┐
│                                               │
│   ČLÁNKY                                      │
│   Literární archiv komunity                   │
│                                               │
│   [Přehled]  Moje      🔍 hledat…  ⇅ Nové    │
│                                               │
│   ⊙ Povídky ⊙ Poezie ⊙ Úvahy …                │
└───────────────────────────────────────────────┘
│                                               │
│   N° 0142                       ★★★★☆ (12)   │
│   Cesta do hvozdů               ●●●●●●●○○○   │
│   ──                                         │
│   Začátek příběhu jako preview text…          │
│   POVÍDKY · Petra K. · 4 min · ⊙ Nepřečteno   │
│                                               │
│   N° 0141 …                                   │
└───────────────────────────────────────────────┘
```

**Taby:**
- `?tab=prehled` (default) — Published od všech, search/sort/filter
- `?tab=moje` (auth only) — autor vidí všechny své status, mini stats widget nahoře

**Stats widget v tabu Moje** (z BE `GET /ikaros-articles/stats`):

```
┌────────────────────────────────────────────────┐
│  6  Celkem    3 Publikováno    2 Konceptů      │
│  1  Pending   0 Zamítnutých    ★ 4,2 průměr    │
└────────────────────────────────────────────────┘
```

**Search:** client-side `useDebouncedValue(query, 250ms)`, hledá v `title + content` (HTML stripped na plain text pro match).

**Sort dropdown:**
- Nejnovější (default) — `publishedAtUtc DESC`
- Nejlépe hodnocené — `averageRating DESC, ratings.length DESC` (tie-breaker)
- Nejvíc hodnocených — `ratings.length DESC`

**Kategorie filter pill chips** — multi-select OR. `?cat=povidky,poezie`. Wax-seal dot v každém chipu.

**Karta článku:**
- border-left 3px v `--cat-<key>` barvě
- N° ID mono nahoře
- Title display font
- 2-řádkový preview (CSS `line-clamp: 2`)
- Metadata: kategorie chip + autor link + čas čtení
- Rating: hvězdy + počet
- **Badge „Nepřečteno"** pokud `isReadByUser(articleId) === false` (z hooku `useArticleReadStatus`)

**Grid:** `repeat(auto-fill, minmax(360px, 1fr))` → 2-3 sloupce @ desktop, 1 sloupec @ mobile.

### 9.3 `ArticleDetailPage` (`/ikaros/clanky/:id`)

**Layout @ desktop (> 1024 px):**

```
┌─ Reading progress bar (fixed top, 2px) ──────┐
│                                              │
│           N° 0142                            │
│           POVÍDKY · 12. listopadu 2026       │
│                                              │
│           Cesta                              │
│           do hvozdů                          │
│           ────                               │
│           Petra K. · 4 min čtení             │
│                                              │
│  ┌─ Autor ──┐                                │
│  │ avatar   │   ┌─┐                          │
│  │ Petra K. │   │Z│lomil si nohu hned…       │
│  │ 8 textů  │   └─┘                          │
│  │ ★ 4,3    │                                │
│  │ italic   │   Druhého rána slunce…         │
│  │ Více →   │                ✦               │
│  └──────────┘   Třetí den jsem našel…        │
│  (sticky)                                    │
│                                              │
│              ───                             │
│              Hodnocení                       │
│              ★★★★☆ 4,3 z 5                  │
│              5 ▰▰▰▰▰▰ 62%                    │
│              ...                             │
│                                              │
│              ───                             │
│              ❧ Více od Petry K.              │
│              ❧ Smutek a ranní mlha           │
│              ...                             │
└──────────────────────────────────────────────┘
```

**Layout @ mobile (≤ 768 px):**
- Autor card nad obsahem (ne sticky-left, ale „note" panel s italic typografií)
- Auto TOC accordion mezi autor card a obsahem
- Vše full width

**Komponenty:**
- `ReadingProgressBar` — `useScrollProgress()` hook, CSS `transform: scaleX(progress)`.
- `ArticleHeader` — N° ID + kategorie label + title display font + autor metadata.
- `AuthorSidebar` — sticky avatar + name link + count textů + rating + odkaz „Více →".
- `AutoTOC` — `extractHeadings(htmlContent)` → list anchor links. Smooth scroll to anchor.
- `<RichTextEditor readOnly />` — obsah s drop cap CSS (`.prose ::first-letter`).
- `GlyphDivider` — random glyph z `--prose-divider-glyphs` token, deterministic per articleId.
- `RatingPanel` — průměr + 5×5 hvězdy + distribuce bar chart + „Vaše hodnocení" pro auth ne-autora.
- `MoreFromAuthor` — `useMoreFromAuthor(authorId, excludeArticleId)` — 3 random Published.
- `AdminActions` — pokud `isAdmin && status === 'Pending'` → tlačítka „Schválit" + „Vrátit s poznámkou" (otevírá `RejectReasonModal`).
- `AuthorActions` — pokud `isAuthor && (status === 'Draft' || status === 'Rejected')` → tlačítka „Upravit", „Odeslat ke schválení", „Smazat".

**Mark-as-read trigger:**
- `IntersectionObserver` na last paragraph div. Když je 50 % viditelný a uživatel je >= 30 sec na stránce → `POST /:id/mark-read`. Jediný call per session (memoizovaný).
- Anon: skip (žádný BE call).

### 9.4 `ArticleEditorPage` (`/novy` + `/:id/upravit`)

**Layout:**

```
┌────────────────────────────────────────────────┐
│  ← Zpět              ✦ uloženo · 14:23         │
│                                                │
│                                                │
│         Název článku                           │
│         (velký display, no border)             │
│                                                │
│         Začněte psát…                          │
│         (TipTap content area)                  │
│                                                │
│         (bubble menu nad selection)            │
│                                                │
├─ Sticky bottom bar ────────────────────────────┤
│  ⊙ Povídky  ⊙ Poezie  ⊙ …    [Koncept] [Odeslat]│
└────────────────────────────────────────────────┘
```

**Komponenty:**
- `TitleInput` — `<input>` s display fontem 48px, no border, placeholder „Název článku", auto-grow.
- `<RichTextEditor autoSaveKey={...}>` s placeholderem „Začněte psát…".
- `CategoryPicker` — pill chips s wax-seal dot, single-select.
- `SaveDraftButton` — POST/PUT s `submit: false`.
- `SubmitButton` — POST/PUT s `submit: true`. Primary CTA.
- `AutoSaveIndicator` — „✦ uloženo · 14:23" / „✎ ukládání…" / „⚠ neuložené změny".
- `RestoreDraftModal` — pokud localStorage má novější draft než BE → modal „Máš rozpracovaný draft z 14:23, pokračovat?" se 2 akcemi (Ano = load local, Ne = discard a load BE).

**Edge cases:**
- Create mode (`/novy`) bez existujícího článku → SaveDraft vytvoří v BE, navigate `/upravit/:newId` replace, zachová obsah.
- Edit mode (`/:id/upravit`) → load article, fail-fast 403 pokud ne-autor nebo status Published/Pending.
- Submit success → toast „Článek odeslán ke schválení" + navigate `/clanky?tab=moje`.

### 9.5 `RejectReasonModal`

```tsx
interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  articleTitle: string;
}
```

- Modal s textarea min 10 znaků (zod schema), počet zbývajících znaků.
- Tlačítka: „Zrušit" (sekundární), „Vrátit autorovi" (primary).
- Po confirm → loading state, success → toast „Článek vrácen autorovi" + close.

⚠️ **Reason je povinný** — empty / < 10 znaků → submit disabled.

### 9.6 Pravý panel — link „Správa článků"

V `IkarosLayout.tsx` `RightPanel` sekce Administrace:

```tsx
{(isAdmin || role === UserRole.SpravceClanku) && (
  <Link to="/ikaros/clanky?tab=prehled" className={s.navItem}>
    <FileText size={18} /> Správa článků
  </Link>
)}
```

⚠️ Schvalování je v `/ikaros/uzivatele?tab=zpracovat`, ne tady. Tento link vede na seznam (admin si pak klikne na pending v Zpracovat tabu, ne v přehledu).

### 9.7 Akceptační kritéria 3.2c

- FE-AK1: Anon `/ikaros/clanky` → vidí jen Published, žádný „Moje" tab.
- FE-AK2: Auth `/ikaros/clanky` → vidí oba taby (default „Přehled").
- FE-AK3: Search debounce 250ms, filtruje client-side po `title + content` (stripped HTML).
- FE-AK4: Sort dropdown mění řazení bez nového BE callu (client-side sort).
- FE-AK5: Kategorie filter multi-select (Povídky + Poezie → OR match).
- FE-AK6: Karta článku má correct border-left barvu z `--cat-<key>` (z BE category color).
- FE-AK7: Badge „Nepřečteno" se zobrazí pokud `read=false` pro auth usera.
- FE-AK8: `/ikaros/clanky/:id` anon Published → 200 a renderuje obsah.
- FE-AK9: `/ikaros/clanky/:id` anon ne-Published → 403 page.
- FE-AK10: Drop cap první písmeno detailu má `var(--prose-drop-cap-size)`.
- FE-AK11: Reading progress bar naplňuje se podle scroll position.
- FE-AK12: Auto TOC se zobrazí pokud obsah má >= 2× `<h2>` nebo `<h3>`.
- FE-AK13: Glyph divider mezi paragrafy — deterministic per articleId.
- FE-AK14: Mark-as-read POST se zavolá jednou per session při scroll > 50 % + 30s na stránce.
- FE-AK15: Admin „Vrátit s poznámkou" → otevře `RejectReasonModal`, blokuje submit < 10 znaků.
- FE-AK16: Autor (Draft/Rejected) „Upravit" → naviguje na editor, „Smazat" → ConfirmDialog → DELETE.
- FE-AK17: Editor placeholder „Začněte psát…" zmizí při focus + input.
- FE-AK18: Auto-save indicator přejde z „✎ ukládání…" do „✦ uloženo · HH:MM" za 3s.
- FE-AK19: Editor mount s local draft existujícím → `RestoreDraftModal`.
- FE-AK20: Submit z editoru → toast + navigate `/clanky?tab=moje`.
- FE-AK21: Mobile (≤ 768 px) → autor card nad obsahem, ne sticky-left.
- FE-AK22: Pravý panel link „Správa článků" jen pro Admin/Superadmin/SpravceClanku.

---

## 10. Sub-fáze 3.2d — Zpracovat tab renderer

**Repo:** `Projekt-ikaros-FE`
**Velikost:** malá — 1 nový soubor + 1 update registry
**Závisí na:** 3.2a (BE provider vrátí `ArticleReviewListItem` payload)
**Předchází:** žádné

### 10.1 `ArticleReviewRenderer`

Soubor: `src/features/ikaros/components/ArticleReviewRenderer.tsx`.

```tsx
export const ArticleReviewLeft: FC<{ item: ArticleReviewListItem }> = ({ item }) => (
  <div className={s.left}>
    <span className={s.id}>N° {item.articleId.slice(-4)}</span>
    <span className={s.category} style={{ '--cat': getCategoryColor(item.category) }}>
      <span className={s.dot} /> {getCategoryLabel(item.category)}
    </span>
  </div>
);

export const ArticleReviewMid: FC<{ item: ArticleReviewListItem }> = ({ item }) => (
  <div className={s.mid}>
    <Link to={`/ikaros/clanky/${item.articleId}`} className={s.title}>{item.title}</Link>
    <p className={s.preview}>{item.preview}…</p>
    <span className={s.meta}>
      <Link to={`/ikaros/uzivatel/${item.authorId}`}>{item.authorName}</Link>
      · {timeAgo(item.submittedAt)}
    </span>
  </div>
);

export const ArticleReviewActions: FC<ActionsProps> = ({ item, onResolve, isLoading }) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  return (
    <>
      <button onClick={() => onResolve(approveArticle(item.articleId))} disabled={isLoading}>
        Schválit
      </button>
      <button onClick={() => setRejectModalOpen(true)} disabled={isLoading}>
        Vrátit s poznámkou
      </button>
      <RejectReasonModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={(reason) => onResolve(rejectArticle(item.articleId, reason))}
        articleTitle={item.title}
      />
    </>
  );
};
```

### 10.2 Registry update

`src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx`:

```tsx
import {
  ArticleReviewLeft,
  ArticleReviewMid,
  ArticleReviewActions,
} from '@/features/ikaros/components/ArticleReviewRenderer';

const articleReviewRenderer: PendingActionRenderer<ArticleReviewListItem> = {
  type: PendingActionType.ArticlePendingReview,
  renderLeft: (item) => <ArticleReviewLeft item={item} />,
  renderMid: (item) => <ArticleReviewMid item={item} />,
  renderActions: (item, helpers) => (
    <ArticleReviewActions item={item} onResolve={helpers.onResolve} isLoading={helpers.isLoading} />
  ),
};

export const PENDING_ACTION_RENDERERS = {
  // ... existující
  [PendingActionType.ArticlePendingReview]: articleReviewRenderer as PendingActionRenderer<unknown>,
};
```

### 10.3 Akceptační kritéria 3.2d

- FE-AK23: `Admin/Superadmin/SpravceClanku` v Zpracovat tabu vidí pending články.
- FE-AK24: Renderer karta zobrazuje N° ID, kategorii, title, preview, autor, čas.
- FE-AK25: Klik „Schválit" → POST `/:id/approve` → karta zmizí z fronty, toast.
- FE-AK26: Klik „Vrátit s poznámkou" → modal → submit → POST `/:id/reject` s reasonem → karta zmizí.
- FE-AK27: Klik na title v kartě → naviguje na `/ikaros/clanky/:id`.
- FE-AK28: Klik na autor link → naviguje na `/ikaros/uzivatel/:authorId`.

---

## 11. Sub-fáze 3.2e — Discovery features

**Repo:** `Projekt-ikaros-FE`
**Velikost:** střední — ~6 nových komponentů + 2 nové hooks
**Závisí na:** 3.2c (komponenty se mountují na detail page)
**Předchází:** žádné

### 11.1 `RatingDistribution`

5 horizontálních lišt (5★ ▰▰▰▰▰▰ 62%). Goodreads pattern.

```tsx
function RatingDistribution({ ratings }: { ratings: ArticleRating[] }) {
  const counts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: ratings.filter(r => r.stars === stars).length,
    pct: ratings.length > 0 ? (ratings.filter(r => r.stars === stars).length / ratings.length) * 100 : 0,
  }));
  return (
    <div className={s.dist}>
      {counts.map(({ stars, count, pct }) => (
        <div key={stars} className={s.row}>
          <span className={s.star}>{stars}</span>
          <div className={s.bar}><div className={s.fill} style={{ width: `${pct}%` }} /></div>
          <span className={s.pct}>{pct.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}
```

### 11.2 `MoreFromAuthor`

```tsx
function MoreFromAuthor({ authorId, excludeId }: Props) {
  const { data } = useMoreFromAuthor(authorId, excludeId); // 3 random Published, ne excludeId
  if (!data?.length) return null;
  return (
    <section>
      <h3>❧ Více od {data[0].authorName}</h3>
      {data.map(a => <MoreItem key={a.id} article={a} />)}
    </section>
  );
}
```

Hook implementace: GET `/ikaros-articles?author=:id&status=published&exclude=:eid&limit=3&sort=random`. Nový BE filter `author`, `exclude`, `sort=random` — alternativně FE shuffle z `useArticlesList()` cache.

⚠️ **Pragmatická volba:** **FE shuffle z existujícího cache** — žádný nový BE endpoint. `useQuery` `['ikaros-articles', 'all']` se používá pro `/clanky` přehled, můžeme z něj vzít všechny od autora a randomly select 3.

### 11.3 `ArticleReadStatus` hook

```ts
function useArticleReadStatus(articleId: string, enabled = true) {
  return useQuery({
    queryKey: ['article-reads', 'status', articleId],
    queryFn: () => api.get<{ read: boolean }>(`/ikaros-articles/${articleId}/read-status`),
    enabled,
    staleTime: 60_000,
  });
}

function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['article-reads', 'unread-count'],
    queryFn: () => api.get<{ count: number }>('/ikaros-articles/unread-count'),
    enabled,
    staleTime: 30_000,
  });
}

function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/ikaros-articles/${id}/mark-read`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['article-reads'] });
    },
  });
}
```

Použití:
- `useArticleReadStatus(id)` → karta v Přehledu (badge „Nepřečteno" pokud `!data?.read`).
- `useUnreadCount()` → badge v pravém panelu sekce „Komunita" (volitelné, klidně v 3.2e nebo později).
- `useMarkRead()` → call v `IntersectionObserver` na detail page.

### 11.4 `AutoTOC`

Extrahuje `<h2>` + `<h3>` z TipTap HTML, vytvoří anchor links s smooth scroll.

```ts
function extractHeadings(html: string): TOCEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h2, h3');
  return Array.from(headings).map((h, idx) => ({
    id: `heading-${idx}`,
    text: h.textContent || '',
    level: h.tagName === 'H2' ? 2 : 3,
  }));
}
```

Render:
- @ desktop (> 1024 px): sticky right sidebar
- @ tablet (769–1024 px): collapse do top accordion
- @ mobile (≤ 768 px): accordion mezi autor card a obsahem

⚠️ Pokud `headings.length < 2` → TOC se nezobrazí (krátký článek nepotřebuje).

### 11.5 Akceptační kritéria 3.2e

- FE-AK29: `RatingDistribution` zobrazí 5 lišt se správnými percenty.
- FE-AK30: `MoreFromAuthor` zobrazí max 3 jiné Published články autora, ne aktuální.
- FE-AK31: `MoreFromAuthor` skryt pokud autor má jen jeden článek.
- FE-AK32: Karta v Přehledu má badge „Nepřečteno" pro auth usera s `read=false`.
- FE-AK33: Auth user scroll detail >50 % + 30s → `mark-read` POST jednou.
- FE-AK34: Po `mark-read` se badge „Nepřečteno" odstraní (queryClient invalidate).
- FE-AK35: Detail s 3+ heading-y → TOC se zobrazí.
- FE-AK36: Klik na TOC entry → smooth scroll to heading.

---

## 12. Testy

### 12.1 BE testy (3.2a)

- `article-review.provider.spec.ts` (+~8 cases):
  - `canHandle` pro 6 globálních rolí + (SpravceClanku=true, ostatní=false)
  - `countForUser` vrací jen Pending
  - `listForUser` paginuje + filtruje
  - Payload `ArticleReviewListItem` má všechna pole
- `ikaros-articles.service.spec.ts` rozšíření (+~6 cases):
  - Anon `findAll` vrátí jen Published
  - Anon `findById` Draft → 403
  - `category` validace proti DB collection (existující/neexistující key)
- `article-reads.service.spec.ts` (+~5 cases):
  - `markRead` idempotentní
  - `unreadCountForUser` správně počítá
  - `isReadByUser` boolean
- `article-categories.service.spec.ts` (+~6 cases):
  - CRUD operace
  - 409 při duplicate key
  - 409 při delete pokud existuje článek s tímto key
  - Migrace seed idempotentní
- Cíl: +25 BE testů.

### 12.2 FE testy (3.2b)

- `RichTextEditor.spec.tsx` (+~10 cases):
  - Render placeholderu
  - Bold/italic/H2/H3/quote/list/link bubble menu actions
  - Klávesa B/I → bold/italic
  - `autoSaveKey` → localStorage write po 3s
  - Mount s local draft → `restoreCandidate`
  - `clearLocalDraft` smaže localStorage
  - `readOnly` mode skryje bubble menu
- Cíl: +10 FE testů.

### 12.3 FE testy (3.2c)

- `ArticlesListPage.spec.tsx` (+~12 cases):
  - Anon vidí jen Přehled tab
  - Auth vidí oba taby
  - Search filter v `title + content`
  - Sort dropdown změní řazení
  - Kategorie multi-select filter
  - Badge „Nepřečteno" pro auth usera
- `ArticleDetailPage.spec.tsx` (+~10 cases):
  - Anon Published renderuje
  - Anon Draft → 403 page
  - Drop cap se aplikuje na první písmeno
  - Reading progress bar reaguje na scroll
  - Mark-as-read se zavolá při 50 % + 30s
  - Admin Pending → tlačítka „Schválit" / „Vrátit s poznámkou"
  - Autor Draft → tlačítka „Upravit" / „Odeslat" / „Smazat"
- `ArticleEditorPage.spec.tsx` (+~8 cases):
  - Create mode prázdný editor
  - Edit mode load existující článek
  - Submit s prázdným title → blokováno
  - Auto-save indicator přejde z ukládání → uloženo
  - `RestoreDraftModal` při local draft
- `RejectReasonModal.spec.tsx` (+~4 cases):
  - Submit blokován < 10 znaků
  - Submit s correct reason → onConfirm
- Cíl: +34 FE testů.

### 12.4 FE testy (3.2d)

- `ArticleReviewRenderer.spec.tsx` (+~5 cases):
  - Renderuje payload fields
  - Klik „Schválit" → mutation
  - Klik „Vrátit s poznámkou" → modal
- Registry test (+1 case): renderer registered.
- Cíl: +6 FE testů.

### 12.5 FE testy (3.2e)

- `RatingDistribution.spec.tsx` (+~3 cases): percenta správně, prázdný state.
- `MoreFromAuthor.spec.tsx` (+~3 cases): zobrazí max 3, skryt při 0.
- `useArticleReadStatus.spec.ts` (+~3 cases): query + mutation invalidation.
- `AutoTOC.spec.tsx` (+~4 cases): extract H2/H3, skip při < 2 heading.
- Cíl: +13 FE testů.

### 12.6 Celkový cíl

**+25 BE + +63 FE = +88 testů.** Existující 400+ FE testů a 956+ BE testů nesmí regressovat.

---

## 13. Dluhy & rizika

### 13.1 Otevřené dluhy z předchozích fází (které 3.2 zavře)

- ✅ **D-066** (z 3.1) — TipTap rich-text editor → zavřeno v **3.2b**

### 13.2 Položky přesunuté do budoucích fází (NE dluh, plnoprávná položka)

- **Cloudinary upload v TipTap** → roadmap 3.3 přidá: „Cloudinary upload extension pro `<RichTextEditor>` (article editor + galerie)"
- **„Diskuze o článku" link** → roadmap 3.4 přidá: „Sekce 'Diskuze o článku' na detailu článku + reverse link z diskuze"

### 13.3 Rizika

- **R1 — Bundle size:** +180KB fontů. Mitigace: subset latin-ext, `font-display: swap`, preload jen 3 weights.
- **R2 — Auto-save data loss:** chyba v localStorage write → autor ztratí draft. Mitigace: `try/catch`, fallback `beforeunload` browser prompt.
- **R3 — Mark-as-read spam:** uživatel rychle scrolluje → 50 % zachycen ihned → POST se zavolá zbytečně. Mitigace: minimální 30s na stránce.
- **R4 — Kategorie migrace dat:** legacy enum hodnoty (`'Povidky'`) → slug (`'povidky'`) na existujících článcích. Mitigace: single migration script, idempotent, ne-destructive (backup).
- **R5 — Skin clash s glyph divider:** Matrix theme `✦` může vypadat divně. Mitigace: skin si nastaví `--prose-divider-glyphs: '▸'` v override CSS.
- **R6 — Drop cap fallback:** `::first-letter` nepodporovaný edge case (text začíná emoji). Mitigace: feature detect a fallback no drop cap.
- **R7 — TipTap learning curve:** team novinek (D-066 to neudělal). Mitigace: 3.2b je samostatná sub-fáze s vlastní specifikací, kompletní izolace.
- **R8 — Reading progress on short articles:** krátký článek = celá strana viditelná hned. Progress bar dosahne 100 % bez scrollu. Akceptovatelné UX.
- **R9 — Cache invalidation pro mark-as-read:** po `mark-read` POST se Přehled musí re-fetch (badge pryč). Mitigace: `qc.invalidateQueries(['article-reads'])` + Přehled má `useArticleReadStatus` per article.

### 13.4 Nově vznikající dluhy (po implementaci 3.2)

- **D-NEW-search-be:** Server-side full-text search v Mongo (`$text` index) — dnes client-side, ok do ~500 článků. Logovat pro `dluhy.md`.
- **D-NEW-bulk-pending-articles:** Bulk approve/reject víc článků najednou. (Související s D-NEW-bulk-pending z 2.4.)
- **D-NEW-article-versions:** Historie editů (commit log per článek). Pro literární komunitu by se hodilo.

---

## 14. Sekvence sub-fází (závislosti)

```
┌─────────┐   ┌─────────┐
│ 3.2a BE │   │ 3.2b    │
│ infra   │   │ TipTap  │   (paralelně OK)
└────┬────┘   └────┬────┘
     │             │
     └──────┬──────┘
            ▼
       ┌─────────┐         ┌─────────┐
       │ 3.2c    │         │ 3.2d    │
       │ pages   │ ◄──────► │ Zpracovat│  (paralelně OK)
       └────┬────┘         └─────────┘
            │
            ▼
       ┌─────────┐
       │ 3.2e    │
       │ discovery│
       └─────────┘
```

**Doporučená sekvence PR:**
1. **3.2a** (BE) — landuje první (samostatný PR v `Projekt-ikaros` repo)
2. **3.2b** (TipTap) — landuje paralelně s 3.2a (samostatný PR v `Projekt-ikaros-FE`)
3. **3.2c + 3.2d** — landují jako 2 PR po 3.2a+3.2b (mohou jít v jednom PR pokud team OK)
4. **3.2e** — landuje jako poslední (drobné, ale závisí na 3.2c)

---

## 15. Rozhodnutí autora (2026-05-15)

PJ schválil všechna 10 rozhodnutí v jednom kroku („jdeme do toho"):

1. ✅ Sekvence PR: 4 PR (3.2a, 3.2b, 3.2c+d, 3.2e)
2. ✅ Fonty bundle ~180KB akceptovatelné
3. ✅ Mark-as-read trigger 50 % + 30 s
4. ✅ Reject reason povinný min 10 znaků
5. ✅ Auto-save debounce 3 s
6. ✅ Kategorie collection s admin CRUD
7. ✅ Slug migrace (`'Povidky'` → `'povidky'`)
8. ✅ „Více od autora" — FE shuffle z cache (žádný nový BE endpoint)
9. ✅ Mark-as-read = nová collection `article_reads`
10. ✅ Anon vidí Published

---

## 16. Workflow

Spec **návrh** vytvořen 2026-05-15. Další kroky:

1. ⏳ **Schválení PJ** — odpovědi na §15 rozhodnutí.
2. ⏳ **Implementační plány** per sub-fázi: `plan-3.2a.md`, `plan-3.2b.md`, `plan-3.2c.md`, `plan-3.2d.md`, `plan-3.2e.md`.
3. ⏳ **Implementace** v doporučené sekvenci (§14).
4. ⏳ **Aktualizace `roadmap-fe.md`** — checkbox 3.2 + položky do 3.3 a 3.4 (Cloudinary v TipTap, Diskuze o článku).
5. ⏳ **Aktualizace `dluhy.md`** — uzavřít D-066, otevřít D-NEW-search-be / D-NEW-bulk-pending-articles / D-NEW-article-versions.
6. ⏳ **Spuštění skill `napoveda`** — aktualizace `/ikaros/napoveda` stránky o novou funkčnost.
