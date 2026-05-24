# Plán 9.1-I — Game Events (implementace)

**Spec:** [spec-9.1-game-events.md](spec-9.1-game-events.md) (APPROVED 2026-05-24)
**Status:** DRAFT — čeká na souhlas, pak implementace
**Rozsah:** 9.1-I = seznam + RSVP + skupiny + správa + focal point + archive policy + role gate. **Bez komentářů** (→ samostatný 9.1-II).

---

## Závislosti

- **Spec hotový a schválený** ✅
- **BE běží lokálně** (`npm run start:dev` v `Projekt-ikaros/backend`) — po BE změnách RESTART nutný (memory `feedback_be_restart_required`)
- **Pre-commit prettier** — před BE commitem `npx prettier --write` (memory `feedback_be_precommit_prettier`)
- **Pre-existing**: `useUploadImage` (z 3.1b), `ConfirmDialog`, `KebabMenu`, `Modal`, `Button`, `Input` (`@/shared/ui`)
- **World context**: `useWorldContext` (viewerRole, world), `useWorldSettings` (customGroups + groupColors)

---

## Fáze 1 — BE rozšíření (`Projekt-ikaros/backend`)

Pořadí podle závislostí — konstanta první, cleanup brzy (čistí povrch), pak rozšíření.

### 1.1 — Konstanta `ACTIVE_WINDOW_HOURS`

**Soubor:** `src/common/constants/time.constants.ts`

```ts
export const ACTIVE_WINDOW_HOURS = 24;
export const ACTIVE_WINDOW_MS = ACTIVE_WINDOW_HOURS * HOUR_MS;
```

### 1.2 — Smazat cleanup job

- ❌ Smazat soubor `src/modules/game-events/game-event-cleanup.job.ts`
- ✏️ `src/modules/game-events/game-events.module.ts` — odebrat import (řádek 9) + provider (řádek 25)
- ✏️ `interfaces/game-event-repository.interface.ts` — smazat `deleteOlderThan(before: Date): Promise<number>` (řádek 28)
- ✏️ `repositories/game-event.repository.ts` — smazat implementaci `deleteOlderThan` (řádek 81)
- ✏️ `game-events.service.spec.ts` — odebrat mock `deleteOlderThan: jest.fn()` (řádek 76)

**Test:** `npm test game-events` zelený i bez `deleteOlderThan`. Žádný cleanup-specific test soubor neexistuje.

### 1.3 — Image focal point

- ✏️ `schemas/game-event.schema.ts` — přidat:
  ```ts
  @Prop({ default: null, type: Number }) imageFocalX: number | null;
  @Prop({ default: null, type: Number }) imageFocalY: number | null;
  ```
- ✏️ `interfaces/game-event.interface.ts` — `imageFocalX: number | null; imageFocalY: number | null;`
- ✏️ `dto/create-game-event.dto.ts` + `dto/update-game-event.dto.ts`:
  ```ts
  @IsOptional() @IsNumber() @Min(0) @Max(100) imageFocalX?: number | null;
  @IsOptional() @IsNumber() @Min(0) @Max(100) imageFocalY?: number | null;
  ```
- ✏️ `repositories/game-event.repository.ts` `toEntity` — přidat mapping
- ✏️ `game-events.service.ts` `create` + `update` — propagace do patche

### 1.4 — `toDate` filter

- ✏️ `game-events.controller.ts` `list` — přidat `@Query('toDate') toDate?: string`
- ✏️ `game-events.service.ts` `findList` — propagace `toDate` do repo
- ✏️ `interfaces/game-event-repository.interface.ts` `FindListFilter` — `toDate?: string`
- ✏️ `repositories/game-event.repository.ts` `findList`:
  ```ts
  if (filter.toDate) match.date = { ...(match.date ?? {}), $lte: filter.toDate };
  ```
  + sort logic — pokud `toDate` a žádný `fromDate`, sortovat DESC (archive); jinak ASC.

### 1.5 — Archive role gate

**Soubor:** `game-events.service.ts` `findList` (na začátku, hned po `getMembership`):

```ts
import { ACTIVE_WINDOW_MS } from '../../common/constants/time.constants';
import { WorldRole } from '../worlds/interfaces/world.interface'; // ověřit cestu

const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();

const requestsArchive =
  filter.toDate !== undefined ||
  (filter.fromDate !== undefined && filter.fromDate < cutoff);

if (requestsArchive && membership.role < WorldRole.PomocnyPJ) {
  throw new ForbiddenException({
    code: 'ARCHIVE_PJ_ONLY',
    message: 'Archiv akcí vidí pouze PJ a Pomocný PJ.',
  });
}

if (membership.role < WorldRole.PomocnyPJ && !filter.fromDate) {
  filter.fromDate = cutoff;
}
```

### 1.6 — BE testy

**Soubor:** `game-events.service.spec.ts` (rozšířit existující) + nové e2e `test/game-events-archive.e2e-spec.ts`.

- ✅ `imageFocal` DTO accept (0, 50, 100, null) + reject (-1, 101, 'foo')
- ✅ `imageFocal` repo round-trip (create → findById vrací focal X/Y)
- ✅ `toDate` filter vrací jen `date ≤ toDate`
- ✅ Archive role gate:
  - Hrac + `toDate=2020-01-01` → 403 `ARCHIVE_PJ_ONLY`
  - Hrac + `fromDate=2020-01-01` → 403
  - Hrac bez filtru → 200, auto-clamp na `fromDate=cutoff`
  - PomocnyPJ + `toDate=2020-01-01` → 200
  - PJ + `fromDate=2020-01-01` → 200

### 1.7 — BE checklist před commitem

- `npx prettier --write src/modules/game-events/` (memory `feedback_be_precommit_prettier`)
- `npm test` — všechno zelené
- `npm run build` — žádné TS errory
- **RESTART** `start:dev` po reload schema (memory `feedback_be_restart_required`)

---

## Fáze 2 — FE infrastruktura (`Projekt-ikaros-FE`)

### 2.1 — Typ `GameEvent` v shared/types

**Soubor:** `src/shared/types/index.ts` (rozšířit existující `GameEvent` pokud je, jinak přidat)

```ts
export interface GameEventConfirmation { userId: string; userName: string; }

export interface GameEvent {
  id: string;
  worldId: string;
  title: string;
  date: string;
  description: string;
  imageUrl: string | null;
  imageFocalX: number | null;   // NEW
  imageFocalY: number | null;   // NEW
  targetGroup: string | null;
  groupOnly: boolean;
  confirmable: boolean;
  confirmedBy: GameEventConfirmation[];
  confirmedCount?: number;       // FE convenience (může odvodit)
  myRsvp?: 'confirmed' | 'none'; // FE convenience pokud BE už posílá
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  // comments?: GameEventComment[]; // přidá 9.1-II
}
```

### 2.2 — Zod schema

**Soubor:** `src/features/world/lib/createGameEventSchema.ts`

```ts
export const createGameEventSchema = z.object({
  title: z.string().trim().min(1, 'Název je povinný').max(200),
  date: z.string().min(1, 'Datum je povinné'),
  description: z.string().max(5000).optional(),
  targetGroup: z.string().nullable().optional(),
  groupOnly: z.boolean().default(false),
  confirmable: z.boolean().default(true),
}).refine(
  (v) => !v.groupOnly || (v.targetGroup !== null && v.targetGroup !== undefined),
  { message: 'Skupinová akce vyžaduje výběr skupiny.', path: ['targetGroup'] },
);

export type CreateGameEventFormValues = z.infer<typeof createGameEventSchema>;
```

### 2.3 — Util `relativeCountdown.ts`

**Soubor:** `src/features/world/utils/relativeCountdown.ts`

```ts
export function relativeCountdown(isoDate: string, now = new Date()): string {
  const event = new Date(isoDate);
  const diffDays = Math.round((+event - +now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `proběhlo před ${Math.abs(diffDays)} dny`;
  if (diffDays === 0) return 'DNES';
  if (diffDays === 1) return 'ZÍTRA';
  return `za ${diffDays} dní`;
}
```

+ test soubor `__tests__/relativeCountdown.spec.ts` (4 case: minulost/dnes/zítra/za N).

### 2.4 — API hooky

**Soubor:** `src/features/world/api/useGameEvents.ts` (rozšířit existující — má `useUpcomingEventsMine`, `useToggleRsvp`)

Přidat:
- `useUpcomingGameEvents(worldId)` — `fromDate=now-24h`, `enabled: !!worldId`
- `useArchiveGameEvents(worldId, viewerRole)` — `toDate=now-24h`, `enabled: viewerRole >= WorldRole.PomocnyPJ`
- `useCreateGameEvent()` — POST + invalidace upcoming
- `useUpdateGameEvent()` — PUT + invalidace obou tabů
- `useDeleteGameEvent()` — DELETE + invalidace obou tabů
- `useToggleRsvp()` — existuje, reuse

Query klíče:
- `['game-events', worldId, 'upcoming']`
- `['game-events', worldId, 'archive']`

⚠️ `useArchiveGameEvents` musí explicitně `enabled: viewerRole >= WorldRole.PomocnyPJ` — i jen volání by hráče zbytečně tlačilo do 403 toastu.

### 2.5 — Reuse `useUploadImage`

Existuje v `src/features/ikaros/api/useUploadImage.ts`. Buď reuse přímo (re-export), nebo extrahovat do `src/shared/api/`. **Doporučení:** zatím přímý import z `@/features/ikaros/api/useUploadImage` (cross-feature, ale jeden řádek; extrakce až ve fázi 9.5).

---

## Fáze 3 — FE komponenty

### 3.1 — `GroupChip`

**Soubor:** `src/features/world/components/GroupChip/GroupChip.tsx` + `.module.css`

Props: `name: string; color: string; size?: 'sm' | 'md'; locked?: boolean`. Render barevný pill s textem; pokud `locked`, `Lock` ikona vlevo (lucide).

### 3.2 — `GameEventCard`

**Soubor:** `src/features/world/components/GameEventCard/GameEventCard.tsx` + `.module.css`

**Postup**: copy [IkarosEventCard.tsx](src/features/ikaros/components/IkarosEventCard.tsx) → adaptovat:
- Import `GroupChip` místo plain text v hlavičce
- Import `useWorldContext` pro `viewerRole` (kebab visibility: `>= PomocnyPJ` místo globální `UserRole.Admin`)
- Import `relativeCountdown` místo `relativeEventDate` + přidat countdown badge (Matrix vzor — DNES!/ZÍTRA!/za N dní)
- Skip `lucide Lock` import zvlášť pro group-only
- Reuse RSVP, attendees, focal-point image logic 1:1

### 3.3 — `GameEventModal`

**Soubor:** `src/features/world/components/GameEventModal/GameEventModal.tsx` + `.module.css`

**Postup**: copy [IkarosEventModal.tsx](src/features/ikaros/components/IkarosEventModal.tsx) → adaptovat:
- Použít `createGameEventSchema` místo `createIkarosEventSchema`
- Mutation hooks `useCreateGameEvent` / `useUpdateGameEvent` místo Ikaros variant
- Přidat dvě pole na konec form-bodyje:
  - `<select name="targetGroup">` — `customGroups` + „— Pro všechny —" option
  - `<Controller name="groupOnly">` — checkbox disabled pokud `targetGroup === null`
- Načtení `customGroups` + `groupColors` z `useWorldSettings(worldId)` (na zvážení: hook ne, prop od EventsPage; doporučuju **prop**, méně async loading state)

---

## Fáze 4 — FE stránka

### 4.1 — `EventsToolbar`

**Soubor:** `src/features/world/pages/EventsPage/components/EventsToolbar.tsx`

Props: `viewerRole`, `view`, `onViewChange`, `groupFilter`, `onGroupFilterChange`, `customGroups`, `onCreate`.

Render:
- **Pokud `viewerRole >= PomocnyPJ`**: chip group `Nadcházející | Archiv`
- **Vždy**: group filter dropdown (Vše + customGroups)
- **Pokud `viewerRole >= PomocnyPJ`**: „+ Nová akce" button

### 4.2 — `EventsList`

**Soubor:** `src/features/world/pages/EventsPage/components/EventsList.tsx`

Props: `events: GameEvent[]`, `customGroups: string[]`, `groupColors: Record<string,string>`, `viewerRole`, `loading`, `view`.

Render: grid 2col → 1col @ 768px, `GameEventCard.map`, loading skeleton 3×, empty state per `view` + `viewerRole`.

### 4.3 — `EventsPage` orchestrátor

**Soubor:** `src/features/world/pages/EventsPage/EventsPage.tsx`

Logika:
- Načte `useWorldContext` (worldId, viewerRole)
- Načte `useWorldSettings(worldId)` (customGroups, groupColors)
- URL state `?view=upcoming|archive&group=<name>`
- Pokud `view === 'archive'` && `viewerRole < PomocnyPJ` → `useEffect` replace na `?view=upcoming`
- Volá `useUpcomingGameEvents` NEBO `useArchiveGameEvents` (podle view + role)
- Klient-side group filter aplikuje na `events`
- Modal state pro Create
- Render: `EventsToolbar` + `EventsList`

**Smazat** stub `src/features/world/pages/EventsPage.tsx` (přesun do složky).

### 4.4 — Route přejmenování + redirect

**Soubor:** `src/app/router.tsx`

- Změnit `path: 'sprava-udalosti'` → `path: 'akce'` (řádek 255)
- Přidat redirect:
  ```tsx
  { path: 'sprava-udalosti', element: <Navigate to="../akce" replace /> }
  ```
- Pokud world nav dropdown existuje s labelem „Správa událostí" → přejmenovat na „Akce" (najít konkrétní soubor přes `Grep "sprava-udalosti"`)

---

## Fáze 5 — Testy + audit

### 5.1 — FE unit testy

**Soubory v `__tests__/`:**

- `relativeCountdown.spec.ts` — 4 case (minulost/dnes/zítra/za N)
- `GroupChip.spec.tsx` — render s color + lock icon variant
- `GameEventCard.spec.tsx` — 5 state (no img, with img, group-only, RSVPed, archive past)
- `GameEventModal.spec.tsx` — create + edit (open with event) + validation (groupOnly bez targetGroup → error)
- `EventsToolbar.spec.tsx` — chip group hidden pro Hrac + visible pro PomocnyPJ + group filter changes
- `EventsPage.spec.tsx` — URL `?view=archive` u Hrac → replace na `upcoming` (useEffect test)
- `useGameEvents.spec.ts` — `useArchiveGameEvents` `enabled: false` pro Hrac (mock useWorldContext)

### 5.2 — `mobil-desktop` skill

Po dokončení UI spustit `mobil-desktop` skill (memory `base.md` rule). Audit:
- Toolbar wrap na 360px
- Modal scrollable
- Touch targety ≥44px
- Filter chip group readable na mobilu

### 5.3 — `napoveda` skill

Po dokončení 9.1-I spustit `napoveda` skill. Sekce „Akce světa" — nová stránka, role-aware popis:
- Hráč: vidí nadcházející akce, RSVP
- PJ+: navíc archiv + správa

### 5.4 — Smoke test (ručně)

Před commit:
1. Vytvořit akci **+10 let** → Nadcházející (na konci ASC)
2. Vytvořit akci **−2 roky** → Archiv (DESC, top)
3. RSVP toggle → optimistic update
4. Switch tab Nadcházející ↔ Archiv jako PJ — oba querys fungují
5. Login jako Hrac → toolbar bez chip group; ručně `?view=archive` v URL → redirect na upcoming
6. Vytvořit group-only akci pro „Lumíci" → Hrac z „Evropani" ji nevidí, PJ ji vidí s lock chipem
7. Upload obrázku + focal point → karta zobrazí správně středovou pozici

---

## Fáze 6 — Roadmap + memory

### 6.1 — Roadmap update

[docs/roadmap-fe.md:1440-1450](docs/roadmap-fe.md#L1440-L1450) — označit 9.1a, 9.1b, 9.1c, 9.1e jako hotové; přidat link na spec+plan + shrnutí. 9.1d zůstává otevřený pro 9.1-II.

### 6.2 — Memory update

Nová memory `project_game_events_archive_policy.md` — důležité pro budoucí 9.5 a další event-based features:
- Archive = implicitní filter podle `date`, žádný cron
- Cut-off `ACTIVE_WINDOW_HOURS = 24` (BE konstanta)
- Role gate: Hrac nesmí sahat do archivu (BE 403 + FE skrytí)
- Auto-clamp v service pro default Hrac query

---

## Pořadí provedení (lineární, žádné paralelní fáze)

1. Fáze 1 (BE) — všechno najednou, pak restart + testy
2. Fáze 2 (FE infra) — typy, hooky, util, schema
3. Fáze 3 (komponenty) — GroupChip → Card → Modal
4. Fáze 4 (stránka) — Toolbar → List → Page → Router
5. Fáze 5 (testy + audit) — průběžně po každé komponentě, finální smoke test
6. Fáze 6 (roadmap + memory)

**Commit strategy:** memory `feedback_work_on_main` → commitujeme přímo na main. Granularita commitů per fáze (5–6 commitů celkem):
- `feat(9.1-I-BE): game-events archive + focal + role gate`
- `feat(9.1-I-FE): infrastruktura — typy, hooky, util, schema`
- `feat(9.1-I-FE): GameEventCard + GroupChip + Modal`
- `feat(9.1-I-FE): EventsPage + Toolbar + List + route /akce`
- `test(9.1-I): FE testy + smoke pass`
- `docs(9.1-I): roadmap + memory update`

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| BE schema migrace `imageFocalX/Y` v Mongo — staré dokumenty nemají pole | `default: null` v `@Prop` → Mongo vrátí undefined, repo `toEntity` mapuje na `null`. Žádný backfill. |
| Hrac volá `useArchiveGameEvents` omylem (TanStack `enabled` selhání) | Druhá vrstva: BE 403. FE jen UX, BE security. |
| `useWorldSettings` neexistuje nebo vrací jiný tvar | Ověřit hned na začátku fáze 2 (`Grep useWorldSettings`). Pokud chybí, použít přímo `useWorld(worldId)` + odvodit ze `settings` field. |
| Route redirect `/sprava-udalosti` → `/akce` rozbije browser back | `<Navigate replace>` (history replace, ne push). |
| Cut-off `now - 24h` počítaný v hooku → re-render každou re-mount | Akceptovatelné — query klíč obsahuje fromDate, tedy re-render = nový fetch. Pro stable klíč můžeme zaokrouhlit na minutu. **Rozhodnutí v implementaci:** zaokrouhlit na minutu (`Math.floor(Date.now() / 60_000) * 60_000`). |
| Komentáře pole v `GameEvent` interface — kdy přidat | 9.1-II přidá. Teď bez `comments` v FE typu (BE už má, FE ignoruje). |

---

## Akceptační kritéria (full check po fázi 5.4)

Viz [spec §9](spec-9.1-game-events.md#9-—-acceptance-criteria-91-i). Všech 19 musí projít.

---

## Mimo plán 9.1-I (→ 9.1-II nebo dluh)

- Komentáře, thread, reakce, edit, soft-delete (9.1-II)
- Vytažení sdílených primitiv do `src/shared/ui/events/` (až 9.5)
- WS live sync (BE gap, samostatný spec)
- Pagination / year-grouping archivu (až per-svět překročí ~10 000 eventů)
