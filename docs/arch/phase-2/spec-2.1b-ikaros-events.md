# Spec 2.1b — Globální Ikaros akce + revize dashboardu

**Status:** ⚠️ FE hotovo (2026-05-14), **BE nikdy nedodáno** — modul `ikaros-events` a generic `POST /upload/image` nevznikly (původní tvrzení „BE 28 testů" bylo nepravdivé). Backend dostavěn až ve fázi **3.1b** (2026-05-15) — viz [spec-3.1b-novinky-rozsireni.md](../phase-3/spec-3.1b-novinky-rozsireni.md).
**Rozsah:** BE (nový modul `ikaros-events` + 1 generic upload endpoint) + FE (revize dashboardu + profile sekce + create modal + ~3 hooky + ~4 komponenty) — **velké**
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE)
**Větev:** `main` (po dohodě 3.1a)
**Velikost:** ~600 ř. BE (~250 ř. testů) + ~900 ř. FE (~400 ř. testů) ≈ 5–7 dní práce
**Autor:** PJ + Claude
**Datum:** 2026-05-14
**Souvisí:** [spec-2.1.md](./spec-2.1.md) (původní dashboard — tento spec ho **reviduje**), [spec-3.1a-news-create-early.md](../phase-3/spec-3.1a-news-create-early.md) (Novinky create modal — analog), 9.1 (světové game-events — zůstává oddělené)

---

## 1. Cíl

Zavést **globální platformové akce** jako samostatnou BE entitu `IkarosEvent`. Admin/Superadmin je vytváří v dashboardu. Logged-in uživatelé vidí v sekci „Akce" vlevo, vedle „Novinky" vpravo.

**Klíčové oddělení (po dohodě 2026-05-14):**

| Místo | Co se zobrazuje |
|---|---|
| `/` úvodník | Globální `IkarosNews` + globální `IkarosEvent` |
| `/svet/:id` | Světové novinky + světové `GameEvent` |
| `/ikaros/profil` | „Mé blížící se akce napříč světy" (přesun původní `UpcomingEventsSection`) |

Důsledek: stávající `UpcomingEventsSection` (cross-world game-events) **mizí z dashboardu** a přesouvá se na profile page.

---

## 2. Kontext / motivace

- 2.1 spec přinesl cross-world agregátor game-events na dashboard. Vznikla nesrovnalost — světové akce byly viditelné na platformové stránce, mícháním scope.
- Nové pravidlo (autor 2026-05-14): světový obsah patří do světa, platformový obsah na platformu.
- Platforma potřebuje vlastní eventy (komunitní setkání, výročí Ikaros, společné maratony, planned downtime apod.) — nezávislé na konkrétním světě.
- BE má hotovou infru pro analog: `IkarosNews` modul (schema, repo, controller, service, DTOs) a `UploadService.uploadGalleryImage` pro Cloudinary upload. Tento spec je opakováním osvědčeného patternu.

---

## 3. Audit současného stavu

### 3.1 Dashboard

- [`DashboardPage.tsx`](../../../src/features/ikaros/pages/DashboardPage/DashboardPage.tsx) — render: `AnonWelcomeSection` + 2-col grid s `UpcomingEventsSection` (logged-in only) + `PlatformNewsSection`.
- [`sections/UpcomingEventsSection.tsx`](../../../src/features/ikaros/pages/DashboardPage/sections/UpcomingEventsSection.tsx) — používá `useUpcomingEventsMine` (cross-world game-events).
- [`components/EventCard.tsx`](../../../src/features/ikaros/pages/DashboardPage/components/EventCard.tsx) — řádek s datem chip, názvem, světem, RSVP toggle.
- [`useGameEvents.ts`](../../../src/features/world/api/useGameEvents.ts) — hooky `useUpcomingEventsMine` + `useToggleRsvp`.

### 3.2 BE — chybějící entity

- `IkarosEvent` entita **neexistuje** — žádné schema, controller, service, DTOs.
- Generic image upload endpoint **neexistuje** — `UploadService.uploadGalleryImage` je k dispozici, ale je volaná jen z chat controlleru (vyžaduje `channelId`).

### 3.3 BE — co máme

- [`UploadService.uploadGalleryImage`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/upload/upload.service.ts#L162) — generic image upload do Cloudinary s lokálním fallbackem, vrací `{ url, publicId }`.
- [`IkarosNews` modul](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/ikaros-news/) — vzor pro `IkarosEvent`.

### 3.4 Profile page

- [`/ikaros/profil`](../../../src/features/profile/pages/ProfilePage.tsx) — existuje, 7 sekcí. Sekce „Moje světy" tam je, ale „Mé akce" zatím není.

---

## 4. Návrh řešení

### 4.1 BE — modul `ikaros-events`

Adresářová struktura kopíruje `ikaros-news`:

```
backend/src/modules/ikaros-events/
├── ikaros-events.module.ts
├── ikaros-events.controller.ts
├── ikaros-events.service.ts
├── schemas/ikaros-event.schema.ts
├── interfaces/ikaros-event.interface.ts
├── interfaces/ikaros-event-repository.interface.ts
├── repositories/ikaros-event.repository.ts
├── dto/create-ikaros-event.dto.ts
├── dto/update-ikaros-event.dto.ts
└── ikaros-events.service.spec.ts
```

#### Schema

```ts
@Schema({ collection: 'ikaros_events' })
export class IkarosEventSchemaClass {
  @Prop({ required: true, maxlength: 200 }) title: string;
  @Prop({ required: true, type: Date }) date: Date;       // kdy se akce koná
  @Prop({ maxlength: 5000 }) description?: string;
  @Prop() imageUrl?: string;                              // Cloudinary URL
  @Prop({ default: true }) confirmable: boolean;          // RSVP povolen?
  @Prop({ type: [String], default: [] }) attendeeUserIds: string[];
  @Prop({ required: true }) authorId: string;
  @Prop() authorName?: string;                            // legacy denormalizace, viz IkarosNews
  @Prop({ default: () => new Date() }) createdAtUtc: Date;
  @Prop({ default: true }) isActive: boolean;
}

// Indexy
IkarosEventSchema.index({ date: 1, isActive: 1 });        // upcoming query
IkarosEventSchema.index({ createdAtUtc: -1 });
```

#### DTO

```ts
// create-ikaros-event.dto.ts
{
  @IsString @IsNotEmpty @MaxLength(200) title: string;
  @IsString @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/) date: string;  // ISO 8601
  @IsOptional @IsString @MaxLength(5000) description?: string;
  @IsOptional @IsString @MaxLength(2048) @Matches(/^(https?:\/\/|\/)/) imageUrl?: string;
  @IsOptional @IsBoolean confirmable?: boolean;            // default true
}
```

#### Endpoints (controller)

| Metoda + path | Guard | Role | Popis |
|---|---|---|---|
| `GET /api/ikaros-events` | JwtAuthGuard | logged-in | All aktivních eventů (sort `date: 1`), pole `myRsvp: 'confirmed'\|'none'` derivováno z `attendeeUserIds` |
| `GET /api/ikaros-events/upcoming?limit=N` | JwtAuthGuard | logged-in | Top N nadcházejících (`date >= now`), default 5, max 20 |
| `POST /api/ikaros-events` | JwtAuthGuard | Admin/Superadmin | Create |
| `PUT /api/ikaros-events/:id` | JwtAuthGuard | Admin/Superadmin | Edit |
| `DELETE /api/ikaros-events/:id` | JwtAuthGuard | Admin/Superadmin | Soft delete (`isActive=false`) |
| `POST /api/ikaros-events/:id/confirm` | JwtAuthGuard | logged-in | RSVP toggle — odmítne pokud `confirmable=false` (409 `RSVP_DISABLED`) |

**Auth pravidla:**
- Read: jen logged-in (žádný anon access — důsledek tvého rozhodnutí 2026-05-14).
- Mutate (Create/Update/Delete): `UserRole.Admin` nebo `UserRole.Superadmin`. PJ a další world role **NE** (platformový obsah, viz `feedback_platform_vs_world_roles` memory).
- RSVP: kdokoli logged-in.

#### Service logika

- `create(dto, user)` — ověř role, vlož + denormalizuj `authorName`.
- `findActive()` / `findUpcoming(limit)` — repo query, mapuj `myRsvp` per request user.
- `confirm(id, user)` — fail-fast pokud `confirmable=false`, toggle membership v `attendeeUserIds` array.
- `delete(id, user)` — ověř role, soft delete.

### 4.2 BE — generic image upload endpoint

Nový soubor (nebo extension existujícího `UploadController`):

```ts
@Post('image')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB
}))
async uploadImage(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: RequestUser,
) {
  if (!file) throw new BadRequestException('Soubor je povinný');
  if (user.role > UserRole.Admin) {
    throw new ForbiddenException('Jen Admin/Superadmin');
  }
  return this.uploadService.uploadGalleryImage(file);
  // vrací { url, publicId }
}
```

**Path:** `POST /api/upload/image` (volné, použitelné pro novinky 3.2+ i další features).

### 4.3 FE — typy

V [`src/shared/types/index.ts`](../../../src/shared/types/index.ts):

```ts
export interface IkarosEvent {
  id: string;
  title: string;
  date: string;             // ISO
  description?: string;
  imageUrl?: string;
  confirmable: boolean;
  attendeeUserIds: string[];
  authorId: string;
  authorName?: string;
  createdAtUtc: string;
  isActive: boolean;
  myRsvp?: 'confirmed' | 'none';   // BE derivuje per logged-in
}
```

### 4.4 FE — hooky `useIkarosEvents.ts`

```ts
src/features/ikaros/api/useIkarosEvents.ts:
- useIkarosEvents() — GET /ikaros-events (1 min stale, JWT-gated)
- useUpcomingIkarosEvents(limit?) — GET /ikaros-events/upcoming?limit=N
- useCreateIkarosEvent() — POST + invalidate
- useUpdateIkarosEvent() — PUT + invalidate
- useDeleteIkarosEvent() — DELETE + invalidate
- useToggleIkarosEventRsvp() — POST /:id/confirm + invalidate
```

### 4.5 FE — upload hook

```ts
src/features/ikaros/api/useUploadImage.ts:
- useUploadImage() — useMutation s FormData, POST /upload/image, vrací { url, publicId }
```

### 4.6 FE — komponenty

#### `CreateIkarosEventModal.tsx`

Soubor: `src/features/ikaros/components/CreateIkarosEventModal.tsx`.

Form fields (po vzoru druhého mockupu, bez týmu):
- **Název akce** * — `Input`, 1–200 znaků, autoFocus
- **Datum a čas** * — `<input type="datetime-local">`, validace ISO format
- **Obrázek (max 10 MB)** — file picker, preview, optional. Po výběru: `useUploadImage.mutateAsync` → uloží `imageUrl`. Loading state. Drag & drop nice-to-have.
- **Popis (volitelný)** — `<textarea>`, 0–5000 znaků
- **Povolit potvrzení účasti** — checkbox, default `true`

Submit: `useCreateIkarosEvent`, toast, close.

#### `IkarosEventCard.tsx`

Karta podle třetího mockupu (sidebar style):
- Obrázek nahoře (16:9, gradient fallback bez obrázku)
- Datum chip (relativní formát z `relativeEventDate` — reuse z 2.1)
- Název akce
- Čas (HH:mm) v accent barvě
- Urgent chip „DNES" / „ZÍTRA" (≤24h, reuse z 2.1)
- Popis (truncate ~3 řádky)
- RSVP button **„Zúčastním se" / „Nezúčastním se"** (pokud `event.confirmable === true`)
- Počítadlo účastníků (pokud `confirmable === true`) — `4 účastníci` + chips s avatary

#### `IkarosEventsSection.tsx`

Soubor: `src/features/ikaros/pages/DashboardPage/sections/IkarosEventsSection.tsx`.

Struktura identická jako `PlatformNewsSection` (3.1a):
- `useUpcomingIkarosEvents(5)` (placeholderData: [])
- `SectionHeader` „Akce" + ikona `CalendarClock` + `action` button `+` pro Admin/Superadmin
- Empty state: „Žádné nadcházející akce."
- Error state: „Nepodařilo se načíst akce."
- List: `<IkarosEventCard>` × N
- Modal: `<CreateIkarosEventModal>`

#### `ProfileEventsSection.tsx` (přesun)

Soubor: `src/features/profile/components/ProfileEventsSection.tsx`.

Stejné API jako původní `UpcomingEventsSection` z dashboardu:
- `useUpcomingEventsMine(5)` (cross-world game-events)
- `EventCard` (reuse z 2.1 z DashboardPage/components)
- Zachovat title „Moje blížící se akce ve světech"

Integrace v `ProfilePage.tsx` — nová 8. sekce mezi „Moje světy" a „Komunitní stopa".

### 4.7 FE — dashboard revize

`DashboardPage.tsx`:

```tsx
// PŘED
<div className={s.twoCol}>
  {isAuthenticated && <UpcomingEventsSection />}
  <PlatformNewsSection />
</div>

// PO
<div className={s.twoCol}>
  {isAuthenticated && <IkarosEventsSection />}
  <PlatformNewsSection />
</div>
```

`UpcomingEventsSection.tsx` se z `sections/` smaže (přesun do `profile/components/ProfileEventsSection.tsx`).

### 4.8 Responsivita

- `IkarosEventsSection` + `IkarosEventCard` → mobile-first (full-width, image 16:9, RSVP button 44px+).
- Modal na mobilu full-width (Modal `size="md"` to už řeší).
- Datum picker `datetime-local` má native mobile UI (datepicker).

---

## 5. Mimo rozsah

- ❌ Rich text editor pro `description` (TipTap) — fáze 3.2.
- ❌ Multi-image gallery — jen jeden header image.
- ❌ Recurring events (každý týden atd.) — nice-to-have, později.
- ❌ Push notifikace o akci — fáze později.
- ❌ Edit modal (jen create + delete). Edit přijde s admin pages.
- ❌ List page `/ikaros/akce` (jen dashboard widget) — fáze později.
- ❌ Anon visibility — globální akce vidí jen logged-in (autor 2026-05-14).
- ❌ Světové akce/novinky — zůstávají v rozsahu fáze 5/9 (světová vrstva).

---

## 6. Akceptační kritéria

### Dashboard

- AK1: Anon vidí jen `AnonWelcomeSection` + `PlatformNewsSection` (žádné akce).
- AK2: Logged-in vidí `IkarosEventsSection` vlevo + `PlatformNewsSection` vpravo.
- AK3: `UpcomingEventsSection` na dashboardu už neexistuje (přesun na profile).

### Admin/Superadmin

- AK4: Vidí `+` v hlavičce Akce.
- AK5: Klik na `+` → otevře `CreateIkarosEventModal`.
- AK6: Form: title (povinný), datum (povinný), obrázek (volitelný, max 10 MB), popis (volitelný), confirmable toggle (default ON).
- AK7: Upload obrázku → loading spinner, po nahrání preview.
- AK8: Submit → toast.success „Akce vytvořena.", modal zavřen, akce v seznamu (sort `date: 1`).
- AK9: 401/403 → toast.error „Nemáš oprávnění" + close.

### IkarosEventCard

- AK10: Pokud `confirmable=true` → tlačítko „Zúčastním se" / „Nezúčastním se" (toggle).
- AK11: Pokud `confirmable=false` → žádné RSVP tlačítko, jen info „Termín".
- AK12: Účastníci se zobrazí chip-listem (max 4 jména + „+N").
- AK13: Klik na RSVP → optimistic update, BE invalidace.

### Profile page

- AK14: Logged-in vidí novou sekci „Moje blížící se akce ve světech" s cross-world game-events.
- AK15: Stejný `EventCard` (reuse z 2.1), stejný RSVP toggle pro game-events.

### Edge cases

- AK16: BE: POST /ikaros-events bez role → 403.
- AK17: BE: POST /:id/confirm na akci s `confirmable=false` → 409 `RSVP_DISABLED`.
- AK18: FE: prázdná DB → „Žádné nadcházející akce." (placeholderData: []).
- AK19: Mobile (≤768px) → IkarosEventsSection a PlatformNewsSection pod sebou, modal full-width.

---

## 7. Testy

### BE

- `ikaros-events.service.spec.ts`:
  - `create` — Admin/Superadmin OK, jiné role 403, denormalizace authorName
  - `findActive` / `findUpcoming` — sort, limit cap
  - `confirm` — RSVP_DISABLED edge, toggle membership
  - `delete` — soft delete, role check
  - 12–15 unit testů
- `ikaros-events.controller.e2e.spec.ts`:
  - 401 anon, 403 non-admin pro POST
  - Happy path Admin POST + GET upcoming
  - RSVP toggle 2x = idempotentní
  - 5 e2e testů
- `upload.controller.spec.ts` — test nového `POST /upload/image`:
  - 401 anon, 403 non-admin, 200 Admin, 413 příliš velký soubor
  - 3 testy

### FE

- `useIkarosEvents.spec.tsx` — fetch, placeholderData, invalidace po mutaci. 3 testy.
- `useCreateIkarosEvent.spec.tsx` — POST + invalidate `['ikaros-events']`. 1 test.
- `useToggleIkarosEventRsvp.spec.tsx` — POST + invalidate. 1 test.
- `useUploadImage.spec.tsx` — FormData, response shape. 2 testy.
- `CreateIkarosEventModal.spec.tsx` — render, validace, image upload, submit, error. 6 testů.
- `IkarosEventCard.spec.tsx` — confirmable on/off, urgent chip, attendees rendering. 5 testů.
- `IkarosEventsSection.spec.tsx` — role visibility `+`, empty, error, list. 4 testy.
- `DashboardPage.spec.tsx` — update existujícího: ověřit, že `UpcomingEventsSection` už není, je `IkarosEventsSection`. 1 nový test.
- `ProfileEventsSection.spec.tsx` — render cross-world game-events. 2 testy.

Cíl: **+25–30 nových testů** (BE + FE).

---

## 8. Migrace dat

Žádná — `ikaros_events` collection vznikne prázdná. `UpcomingEventsSection` přesun je čistě FE (BE endpoint `/game-events/upcoming/mine` zůstává).

---

## 9. Implementační etapy

Velký scope — rozdělím do **4 etap** pro postupné schvalování plánu:

### Etapa 1 — BE foundation (1–2 dny)
- Modul `ikaros-events` (schema, repo, service, controller, DTOs)
- Generic upload endpoint `POST /upload/image`
- BE testy

### Etapa 2 — FE infra + dashboard revize (1 den)
- FE typy + hooky (`useIkarosEvents`, `useCreateIkarosEvent`, `useToggleIkarosEventRsvp`, `useUploadImage`)
- `IkarosEventsSection` + `IkarosEventCard`
- Dashboard: swap `UpcomingEventsSection` → `IkarosEventsSection`
- FE testy sekce + card

### Etapa 3 — Create modal (0.5–1 den)
- `CreateIkarosEventModal` s image upload preview
- `createIkarosEventSchema` zod
- Modal testy

### Etapa 4 — Profile přesun (0.5 dne)
- `ProfileEventsSection` v profile
- Integrace do `ProfilePage`
- Testy

Po každé etapě: lint, tsc, test:run, skill `mobil-desktop`. Commit po etapě.

---

## 10. Dluhy a rizika

- **Riziko:** `attendeeUserIds: string[]` v dokumentu může růst u populárních akcí. Pro MVP OK; refactor na samostatnou `ikaros_event_attendees` collection až bude potřeba (>500 účastníků na akci).
- **Riziko:** Cloudinary upload může selhat → uživatel ztratí formulářová data. Mitigation: upload je oddělený krok od submit; pokud upload selže, form zůstane otevřený.
- ~~**Dluh D-XXX:** Edit modal pro Ikaros akci~~ — ✅ **Vyřešeno 2.1c (2026-05-14)**, viz [spec-2.1c-ikaros-events-edit.md](./spec-2.1c-ikaros-events-edit.md).
- **Dluh D-YYY (vytvořit):** List page `/ikaros/akce` s paginací (později).
- **D-NEW2 z 2.1** zůstává — `IkarosNews` paginace.

---

## 11. Otevřené otázky

Žádné — všechna klíčová rozhodnutí dohodnutá v diskuzi 2026-05-14:
- ✅ Layout: 2-col Akce | Novinky
- ✅ Globální vs. světové oddělené
- ✅ Anon vidí jen Novinky (žádné akce)
- ✅ Admin/Superadmin jediná role pro create
- ✅ `confirmable` toggle pro RSVP
- ✅ Naming: `IkarosEvent` / `ikaros-events`
- ✅ Přesun `UpcomingEventsSection` na profile

---

## 12. Po dokončení

- Aktualizovat `docs/roadmap-fe.md` — 2.1b checkmark + dopad na 2.1
- Update `/ikaros/napoveda` (skill `napoveda`) — popis sekce Akce + role oprávnění
- Mobile/desktop test (skill `mobil-desktop`)
- Memory update pokud vznikla nová pravidla
