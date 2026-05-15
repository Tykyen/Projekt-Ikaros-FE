# Implementační plán 3.1b — Novinky + Akce (vč. dostavby BE z 2.1b)

**Spec:** [spec-3.1b-novinky-rozsireni.md](spec-3.1b-novinky-rozsireni.md)
**Strategie:** commity **přímo do `main`** v obou repech (bez feature větví — autorské rozhodnutí). Každá sub-fáze = jeden **zelený** commit (testy + build projdou), main nikdy rozbitý.
**Repa:** `[BE]` = `Projekt-ikaros` · `[FE]` = `Projekt-ikaros-FE`

---

## Co audit změnil oproti původnímu záměru

- 🔴 **BE z fáze 2.1b nikdy nevznikl** — modul `ikaros-events` ani generic upload endpoint. `git log --all` = nula commitů. Spec 2.1b i roadmap to lživě hlásí jako hotové. Sekce „Akce" na dashboardu je proto **dnes rozbitá**.
- ✅ FE pro akce je kompletní (`useIkarosEvents`, `IkarosEventModal`, `IkarosEventCard`, `useUploadImage`) — BE se dostaví **přesně podle FE kontraktu** (typ `IkarosEvent`, volané endpointy).
- ✅ BE `UploadService` už umí Cloudinary — generic `POST /upload/image` je tenká nadstavba.
- 💡 Po dostavbě BE `[c]` se dashboard „Akce" **sám opraví** — FE hook `useIkarosEvents` už existuje a míří správně. Po `[a]` se sám zprovozní FE `useUploadImage`.

---

## Sub-fáze (10 commitů: 3× BE, 7× FE)

### 3.1b-a `[BE]` — generic upload endpoint `POST /upload/image`

`backend/src/modules/upload/upload.controller.ts`

1. Nový handler `@Post('image')` — `JwtAuthGuard`, `FileInterceptor('file', memoryStorage, limit 10 MB)`, `MulterExceptionFilter`.
2. Validace: soubor povinný, MIME `image/*`, role Admin/Superadmin.
3. Volá `UploadService` (Cloudinary), vrací `{ url, publicId }`. Bez `channelId`.
4. Testy — image-only, chybějící soubor, role.

**Zelený check:** `npm test` v `backend/`.

### 3.1b-b `[BE]` — `ikaros-news`: `type` + `imageUrl`

`backend/src/modules/ikaros-news/`

1. `schemas/ikaros-news.schema.ts` — `@Prop({ default: 'info', index: true }) type` + `@Prop() imageUrl?`.
2. `interfaces/ikaros-news.interface.ts` — doplnit obě pole.
3. `dto/create-ikaros-news.dto.ts` + `update-ikaros-news.dto.ts` — `@IsIn(['info','warning','system']) @IsOptional() type?` + `@IsOptional @IsString @MaxLength(2048) imageUrl?`.
4. `ikaros-news.service.ts` — `create`/`update` propisují `type` (default `info`) + `imageUrl`.
5. Testy — `ikaros-news.service.spec.ts`: type default, type/imageUrl update.

### 3.1b-c `[BE]` — nový modul `ikaros-events` (dostavba 2.1b)

`backend/src/modules/ikaros-events/` — struktura kopíruje `ikaros-news`. **Kontrakt = FE typ `IkarosEvent`** + spec 2.1b §4.1.

1. `schemas/ikaros-event.schema.ts` — `title, date(Date), description, imageUrl?, imageFocalX?/Y?(0–100), confirmable(def true), attendeeUserIds[string], authorId, authorName?, createdAtUtc, isActive(def true)`. Indexy `{date:1,isActive:1}`, `{createdAtUtc:-1}`.
2. `interfaces/` — `ikaros-event.interface.ts` + `ikaros-event-repository.interface.ts`.
3. `dto/create-ikaros-event.dto.ts` + `update-ikaros-event.dto.ts` — viz 2.1b §4.1 + `imageFocalX/Y`.
4. `repositories/ikaros-event.repository.ts` — CRUD + `findActive` (sort `date:1`) + `findUpcoming(limit)` (`date>=now`) + soft delete.
5. `ikaros-events.service.ts` — create/update/delete (role check Admin+), `confirm` toggle (409 `RSVP_DISABLED` při `confirmable=false`), response mapping: `myRsvp`, `confirmedCount`, `confirmedBy` (join jmen z `UsersService`).
6. `ikaros-events.controller.ts` — `GET /ikaros-events`, `GET /ikaros-events/upcoming`, `POST`, `PUT /:id`, `DELETE /:id`, `POST /:id/confirm`. Read = `JwtAuthGuard`; mutace = Admin/Superadmin.
7. `ikaros-events.module.ts` + registrace v `app.module.ts`.
8. Testy — `ikaros-events.service.spec.ts` + `repository.spec.ts`.

**Zelený check:** `npm test` + `npm run build` v `backend/`; app nastartuje.

### 3.1b-d `[FE]` — typy, schema, color tokeny

1. `shared/types/index.ts` — `IkarosNewsType` + `IkarosNews` o `type`/`imageUrl`. Ověřit `IkarosEvent` proti BE (skill `type-sync`).
2. `createNewsSchema.ts` — `type: z.enum([...]).default('info')`.
3. `useIkarosNews.ts` — create/update DTO o `type` + `imageUrl`.
4. Color tokeny `--news-info/-warning/-system` (konvence z `cca4fe7`).

**Zelený check:** `npm run build` + schema test. *(FE `useUploadImage` a `useIkarosEvents` už existují — po BE a/c fungují bez FE změny.)*

### 3.1b-e `[FE]` — rozbalovací karta + dashboard 3 novinky

1. Povýšit `NewsCard` do `features/ikaros/components/NewsCard/` (sdílí dashboard + hub).
2. Accordion: sbaleno = nadpis (obarvený) + štítek typu + datum; rozbaleno = obrázek + obsah + autor za datem. `role="button"`, `aria-expanded`, Enter/Space.
3. `PlatformNewsSection.tsx` — `slice(0,3)` + odkaz „Všechny novinky →".
4. Testy.

### 3.1b-f `[FE]` — formulář novinky (typ + obrázek)

1. `NewsFormModal.tsx` — radio 3 typů + uploader obrázku (`useUploadImage` → `imageUrl`).
2. Tok: nahraj obrázek → `POST/PATCH /IkarosNews` s `type` + `imageUrl`.
3. Testy.

### 3.1b-g `[FE]` — stránka `/ikaros/novinky` (hub)

1. Nová `NovinkyPage` — rozbalovací karty, paginace (`useIkarosNewsList`/`Count`).
2. Admin+: Aktivní/Archiv přepínač, `+ Nová`, inline edit/archiv/smazat (logika z `NewsManagementTab`).
3. `router.tsx` — smazat redirect, přidat veřejnou route.
4. Testy.

### 3.1b-h `[FE]` — odstranění tabu Novinky z Uživatelů

1. `usersPageTabs.helpers.ts` — odebrat `'novinky'` z unionu + `visibleTabsForRole`.
2. `UsersPageTabs.tsx` + `UsersPage.tsx` — odebrat tab + mapování.
3. Smazat `tabs/NewsManagementTab/` vč. testů. `?tab=novinky` → default tab.
4. Testy `usersPageTabs.helpers.spec.ts`.

### 3.1b-i `[FE]` — stránka `/ikaros/akce` (kalendář) + dashboard 3 akce

1. Nová `AkcePage` — měsíční mřížka, navigace ◀▶ + „Dnes", akce v dnech, zdroj `useIkarosEvents()`.
2. Klik → `IkarosEventModal`. Admin+ → `+ Nová akce`. Mobil ≤768px → fallback seznam.
3. `router.tsx` — `ikaros/akce` (`requireAuth`).
4. `IkarosEventsSection.tsx` — `useUpcomingIkarosEvents(3)` + odkaz „Kalendář akcí →".
5. Testy.

### 3.1b-j `[FE]` — wrap-up

1. Skill `napoveda` — Nápověda o stránky Novinky + Akce.
2. Skill `mobil-desktop` — ověřit kartu, hub, kalendář.
3. `roadmap-fe.md` — oprava ř. 420 (lživý 2.1b BE status), ř. 521, nová sekce `3.1b`.
4. `spec-2.1b-ikaros-events.md` — oprava lživého statusu „✅ Hotovo".
5. Spec 3.1b `Draft → Done`; dluhy do `dluhy.md`.

---

## Pořadí závislostí

`a [BE]` → `b [BE]` → `c [BE]` (nezávislé na b, ale commitujeme po řadě) → `d [FE]` (type-sync na BE) → `e, f, g` (potřebují `d`) → `h` (po `g` — hub musí existovat než zmizí tab) → `i` (potřebuje BE `c`) → `j` (poslední).

## Rizika

| Riziko | Mitigace |
|--------|----------|
| Commit na main rozbije main | každá sub-fáze samostatně zelená (test+build) |
| `ikaros-events` neodpovídá FE kontraktu | kontrakt = FE typ `IkarosEvent` + hooky; BE testy ověří shape |
| BE `c` je velký | vlastní sub-fáze, samostatný zelený commit |
| Staré novinky bez `type` | BE default `info` + FE fallback `?? 'info'` |
| Akce pro anon prázdné | `/ikaros/akce` je `requireAuth` — dokumentováno, out of scope |

**Rollback:** `git revert <commit>` dané sub-fáze; vše aditivní.

---

**Čeká na schválení plánu. Po „ano" začínám sub-fází 3.1b-a `[BE]`.**
