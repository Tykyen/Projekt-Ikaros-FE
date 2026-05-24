# Spec 9.1 — Game Events (světové akce)

**Status:** APPROVED (Q1–Q5 + archive policy potvrzeno 2026-05-24) — připraven na implementační plán 9.1-I.
**Velikost:** L (2 iterace, FE-heavy, BE drobné rozšíření)
**Motivace (PJ):** „Inspiruj se globálním (Ikaros akce z 2.1b/c), ale pro každý svět vlastní."

---

## 1 — Cíl

Stránka **akce světa** (`/svet/:worldSlug/akce`) jako paralela ke globálnímu `/ikaros/akce`. Členové vidí nadcházející / proběhlé herní akce, mohou potvrdit účast, PJ+ akce zakládá a spravuje. Skupinová viditelnost (event jen pro „Lumíky") a vláknové komentáře (9.1-II) povyšují FE nad rámec globálního ekvivalentu.

**Co se sjednocuje s globálním:**
- Vizuální jazyk karty (hero obrázek + meta + RSVP + attendees + kebab správy)
- Modal pattern (RHF + zod + image upload + focal point + datetime-local)
- Hooky struktura (`useGameEvents`, `useCreateGameEvent`, `useToggleRsvp`)

**Co je specifické pro svět:**
- `targetGroup` + `groupOnly` → barevné skupinové štítky + filtr v toolbaru
- Komentáře (thread + reakce + edit + soft-delete) — pouze ve světové variantě
- Permissions řešené přes `WorldRole` (PomocnyPJ+) místo globálního `UserRole`

⚠️ **NE** generic komponenta `EventCard` s `variant: 'ikaros' | 'game'` proppem. Místo toho **copy-and-adapt** z `IkarosEventCard`/`Modal` → nové `GameEventCard`/`Modal` v `src/features/world/components/`. Sdílená primitiva (`EventDateChip`, `EventRsvpButton`, `EventAttendeesList`) se vytáhnou do `src/shared/ui/events/` až ve **fázi 9.5** (světové novinky = třetí consumer; dřív = nesprávná abstrakce).

---

## 2 — Rozdělení do iterací

| Iterace | Obsah | Pokrývá podkroky roadmapy |
|---|---|---|
| **9.1-I** | Seznam (nadcházející/proběhlé), karta, RSVP toggle, skupinová viditelnost + barevné chipy, správa CRUD (PomocnyPJ+) vč. upload obrázku a focal point | 9.1a + 9.1b + 9.1c + 9.1e |
| **9.1-II** | Vláknové komentáře (root + 1 úroveň reply), emoji reakce, edit vlastního, soft-delete (vlastní nebo PJ+) | 9.1d |

Komentáře jsou samostatný feature s vlastní komplexitou (thread render, reactions toolbar, edit-in-place, deleted-stub) → vlastní spec+plan **9.1-II**. **Není to dluh** — splňuje pravidlo „kompletní sub-kroky" (`feedback_no_debt`).

---

## 3 — Datový model

### BE existuje (game-events module)

```ts
// backend/src/modules/game-events/interfaces/game-event.interface.ts
interface GameEvent {
  id: string;
  worldId: string;       // index
  title: string;         // 1–200
  date: string;          // ISO 8601 `YYYY-MM-DDTHH:mm...`
  description: string;   // ≤5000
  imageUrl: string | null;
  targetGroup: string | null;   // matchuje WorldSettings.customGroups[]
  groupOnly: boolean;           // true = vidí jen členové targetGroup
  confirmable: boolean;
  confirmedBy: { userId; userName }[];
  comments: EventComment[];     // 9.1-II
  reminderSent: boolean;
  createdAt; updatedAt;
}
```

### BE rozšíření (9.1-I)

**A) Image focal point** — `imageFocalX: number | null` + `imageFocalY: number | null` (0–100, default null = 50/50). Parita s `IkarosEvent`. Změny:
- `game-event.schema.ts` — 2 nová `@Prop({ default: null, type: Number })`
- `create-game-event.dto.ts` + `update-game-event.dto.ts` — 2 nové `@IsOptional @IsNumber @Min(0) @Max(100)` fields
- `game-event.interface.ts` — 2 nová pole
- `MongoGameEventRepository.toEntity` — mapping
- Service `create`/`update` — předání do patch
- BE testy — 2 nové unit (DTO accept + repo round-trip)

**B) `toDate` filter** (Q1-A) — rozšíření `findList` o `toDate?: string` (date ≤ X). Změny:
- `controller` — `@Query('toDate') toDate?: string`
- `service.findList` — propagace `toDate` do repo
- `repo.findList` — `if (toDate) match.date.$lte = toDate`
- `interface` — typ rozšířen
- BE testy — 1 nový e2e (past events filter)

**C) Cleanup job odstraněn** (archive policy — viz §3.5) — celý `GameEventCleanupJob` zmizí; `deleteOlderThan` zmizí z interface i implementace.

### 3.5 — Archive policy (Matrix-style, varianta A + cut-off −24h)

**Požadavek PJ:** „Stejně jako v Matrixu chci mít archiv na neomezenou dobu a stejně tak na neomezenou dobu dopředu." Upřesnění: „Matrix maže akce starší 24h, ale pak je uloží do archivu starých akcí."

**Architektonické rozhodnutí (2026-05-24):** Varianta **A — implicitní filter podle `date`**. Jedna kolekce `game_events`, žádný cron přesun, žádný `isArchived` flag. „Archiv" je jen druhá BE query se `toDate=now-24h`.

**Viditelnost archivu** (rozhodnuto 2026-05-24): **Archiv vidí pouze PomocnyPJ a vyšší.** Hráč vidí jen tab „Nadcházející"; toolbar pro něj filter chip group nevykresluje. BE blokuje archive query 403 pro Hrac (viz §8).

**Konstanta:** `ACTIVE_WINDOW_HOURS = 24` (BE, `common/constants/time.constants.ts`). Definuje:
- **Nadcházející** = `date ≥ now − 24h` (čerstvě proběhlé akce zůstávají 24h ještě „nahoře")
- **Archiv** = `date < now − 24h` (vše starší, sort DESC, neomezeně dozadu)

Důvody volby A nad C (fyzický přesun):
- UX identický s Matrixem.
- Žádný cron, žádná migrace komentářů/RSVP/reakcí mezi kolekcemi.
- Mongo `worldId + date` compound index zvládne `find({ date: { $lt: cutoff } }).limit(200)` i u 100 000 akcí.
- Komentáře u dávno proběhlých akcí fungují stejně jako u nadcházejících (jedna kolekce = jedna service path).

**Důsledek pro BE:**
- ❌ **Smazat `game-event-cleanup.job.ts`** — dnešní implementace maže (`deleteOlderThan`), ne archivuje. Z hlediska varianty A je celý job zbytečný (archiv = filtr).
  - Smazat soubor [game-event-cleanup.job.ts](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/game-events/game-event-cleanup.job.ts)
  - Odebrat import + provider z `game-events.module.ts:9,25`
  - Smazat `deleteOlderThan` z `IGameEventRepository` (interface:28) i `MongoGameEventRepository` (repo:81)
  - Odebrat mock v `game-events.service.spec.ts:76`
- ✅ **`game-event-reminder.job.ts` zůstává** — flag `reminderSent`, žádné mazání, OK.
- ✅ `findList` rozšířen o `toDate` (Q1-A v §3 B) — pokrývá archive query.

**Důsledek pro FE:**
- `EventsToolbar` má filter chip group **„Nadcházející | Archiv"** (URL state `?view=upcoming|archive`, default `upcoming`).
- `useGameEvents` rozdělen na **`useUpcomingGameEvents(worldId)`** a **`useArchiveGameEvents(worldId)`** (dvě query keys, dva range filtry).
- Cut-off `now − 24h` počítá FE jako `new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()` — drobně refresh-friendly (každý mount nový cut-off; přesnost na minutu stačí).
- `datetime-local` v `GameEventModal` **bez `max` atributu** — povolit libovolné budoucí datum (i +50 let).
- Empty state archivu: „Žádné archivované akce. Tady se brzy objeví historie."

**Riziko:** kolekce `game_events` poroste neomezeně. Akceptováno (PJ explicit). Mitigation:
- `worldId + date` index existuje.
- `findList` má `limit=200` cap → archiv jen prvních 200, dál samostatný dluh (rok-grouping / pagination / virtualizace).
- Pokud per-svět překročí ~10 000 eventů, přidat sub-index, rok-grouping UI, případně varianta C jako optimalizace bez funkčního dopadu.

⚠️ **Migrace dat**: existující data jsou neporušená — cleanup smazal jen akce 1+ den staré. Žádný backfill. Nové akce po odstranění jobu zůstávají navždy.

⚠️ **Pozor (časová zóna):** Cut-off počítaný klientem (`Date.now()`) běží v lokálním čase prohlížeče, ale BE filter pracuje s ISO datem (UTC). Akceptovatelná drift = pár hodin v okrajových případech (cestování mezi TZ). Pro tooltip „Akce zmizela z Nadcházející" žádný problém.

### Skupiny — reuse hotového (žádné nové schema)

- `WorldSettings.customGroups: string[]` (names)
- `WorldSettings.groupColors: Record<string, string>` (name → hex)
- `membership.group: string | null`

Hook v FE už existuje — `useWorldSettings(worldId)` (v `MembersTab`). Reuse pro:
- Výběr `targetGroup` v modalu (select s `customGroups[]`)
- Barva chipu na kartě (`groupColors[event.targetGroup]`)

---

## 4 — API mapování (vše existuje)

| FE hook | Endpoint | Použití |
|---|---|---|
| `useUpcomingGameEvents(worldId)` | `GET /api/game-events?worldId=&fromDate=<now-24h>&limit=200` | Nadcházející tab — date ≥ now − 24h, sort ASC |
| `useArchiveGameEvents(worldId)` | `GET /api/game-events?worldId=&toDate=<now-24h>&limit=200` | Archiv tab — date < now − 24h, sort DESC klient-side |
| `useGameEvent(id)` | `GET /api/game-events/:id` | Detail (možná nepotřeba — karta umí vše) |
| `useCreateGameEvent()` | `POST /api/game-events` | Modal Vytvořit (PomocnyPJ+) |
| `useUpdateGameEvent()` | `PUT /api/game-events/:id` | Modal Upravit (PomocnyPJ+) |
| `useDeleteGameEvent()` | `DELETE /api/game-events/:id` | Kebab Smazat (PomocnyPJ+) |
| `useToggleRsvp()` | `POST /api/game-events/:id/confirm` | RSVP button |
| `useUploadImage()` | reuse existující `useUploadImage` z 3.1b | Image upload v modalu |

9.1-II přidá: `useAddComment`, `useEditComment`, `useDeleteComment`, `useReactToComment`.

📚 **Co je `fromDate`/`toDate`:** BE date-range filtr. Cut-off je `now − 24h` (`ACTIVE_WINDOW_HOURS` konstanta). „Nadcházející" = `fromDate=now-24h` (vše čerstvě proběhlé + budoucí), „Archiv" = `toDate=now-24h` (vše starší).

---

## 5 — Route + navigace

**Změna**: `/svet/:worldSlug/sprava-udalosti` → **`/svet/:worldSlug/akce`** (konzistence s `/ikaros/akce`).

Akce:
- [src/app/router.tsx:255](src/app/router.tsx#L255) — přejmenovat path
- World nav dropdown — label „Akce" (případně reuse hidden flag check v `WorldSettings.hiddenNavItems`)
- Backward compat redirect: `/svet/:worldSlug/sprava-udalosti` → `/svet/:worldSlug/akce` (volitelně 1 měsíc, pak smazat — paralela s 9.1 page-character routeem)

---

## 6 — UI struktura (9.1-I)

```
EventsPage/
  EventsPage.tsx           — orchestrátor, načte useGameEvents
  EventsToolbar.tsx        — filter chips „Nadcházející | Proběhlé", group filter dropdown, „+ Nová akce" (PJ+)
  EventsList.tsx           — grid 2col→1col, EventCard.map
  components/
    GameEventCard.tsx      — karta (inspirace IkarosEventCard)
    GameEventModal.tsx     — create/edit modal (inspirace IkarosEventModal)
    GroupChip.tsx          — barevný štítek skupiny (reuse v kartě + modalu)
  api/
    useGameEvents.ts       — list + CRUD hooky
  lib/
    createGameEventSchema.ts  — zod schema (s targetGroup + groupOnly)
```

### `GameEventCard` — odlišnosti od `IkarosEventCard`

- **Header overlay**: barevný `GroupChip` (left) + datum chip (right) — Matrix vzor `EventCard.tsx` má `mx-event-card__badge` se `background: teamColor`
- **Countdown badge** „DNES!/ZÍTRA!/za N dní" — reuse z Matrix referenčního EventCard (Ikaros má jen DNES/ZÍTRA)
- **`groupOnly`** indikátor: pokud `groupOnly && targetGroup`, badge má lock ikonu (`Lock` z lucide) → vizuální hint „jen pro tuto skupinu"
- **Kebab** dostupný pro **WorldRole.PomocnyPJ+** místo globální `UserRole.Admin`
- Body, RSVP, attendees, focal point image — **identický** s Ikaros (proto copy-adapt namísto refaktoringu)

### `GameEventModal` — odlišnosti od `IkarosEventModal`

Nová pole na konci formu:
- `targetGroup` — `<select>` z `customGroups[]` + položka „— Pro všechny —" (`null`)
- `groupOnly` — `<input type="checkbox">` (disabled pokud `targetGroup === null`, label „Vidí jen členové této skupiny")

Validace: pokud `groupOnly === true`, `targetGroup` musí být `!== null` (BE už enforced — chyba `groupOnly vyžaduje targetGroup`).

### `EventsToolbar`

- **Filter chip group**: `Nadcházející | Archiv` (default Nadcházející, URL state `?view=upcoming|archive`). „Archiv" obsahuje všechny akce starší 24 h od proběhnutí (cut-off `ACTIVE_WINDOW_HOURS = 24`).
  - **Hráč (WorldRole.Hrac) chip group NEVIDÍ** — toolbar pro něj vykreslí jen group filter dropdown + „+ Nová akce" (PJ+ only btw, takže hráč nakonec vidí prázdný toolbar). Tab Archiv pro hráče **neexistuje**.
  - URL hack `?view=archive` pro hráče: client-side redirect na `?view=upcoming` (silent — žádný error toast, hráč nemá důvod tam být).
- **Group filter dropdown** (volitelně): `Všechny skupiny | <customGroups>`. Klient-side filtr nad načtenými eventy. (Server-side filtr nezavádět — BE už řeší visibility per role.)
- **„+ Nová akce" button** — PomocnyPJ+ only

### Empty states

- 0 nadcházejících + PJ+: „Žádné nadcházející akce. Naplánuj první →" (CTA otevře modal)
- 0 nadcházejících + Hráč: „Žádné nadcházející akce. PJ teprve plánuje."
- 0 v archivu: „Žádné archivované akce. Tady se brzy objeví historie."

---

## 7 — Permission matrix

| Akce | Hráč | PomocnyPJ | PJ | Admin / Superadmin |
|---|---|---|---|---|
| Zobrazit nadcházející (`date ≥ now − 24h`) | ✓ (vlastní skupina pokud `groupOnly`) | ✓ | ✓ | ✓ (member-only — nepřístupné anon/non-member) |
| **Zobrazit archiv (`date < now − 24h`)** | **❌ 403** | ✓ | ✓ | ✓ |
| Toggle RSVP (jen nadcházející) | ✓ | ✓ | ✓ | ✓ |
| Vytvořit akci | — | ✓ | ✓ | ✓ |
| Upravit / smazat | — | ✓ | ✓ | ✓ |
| Upload obrázku | — | ✓ | ✓ | ✓ |
| Vidět group-only akci jiné skupiny | — | ✓ (PJ+ vidí vše) | ✓ | ✓ |
| Vidět chipa filter „Nadcházející \| Archiv" | — | ✓ | ✓ | ✓ |

BE enforced — viz §8 archive role gate. FE skrývá toolbar chip group + odhlašuje archive query pro hráče.

---

## 8 — Visibility logic

### 8.1 — Skupinová viditelnost (`groupOnly`)

**BE filtruje v `findList`** — hráči vidí jen non-group-only + group-only kde `membership.group === event.targetGroup`. PomocnyPJ+ vidí vše (analog `findUpcomingForUser` v 2.1).

**FE neimplementuje druhý filtr** — dostane z BE už pre-filtrované pole. Pouze v PJ+ pohledu zobrazí GroupChip a `Lock` ikonu, aby PJ poznal „tuto akci běžný hráč jiné skupiny nevidí".

⚠️ **Pozor:** PJ vidí všechny skupiny — `GroupChip` na kartě bude vždy vykreslen i pro hráče (např. „Lumíci"-only event hráč ze skupiny Lumíci uvidí s chipem „Lumíci" + lock ikonou). Slouží jako informace „toto je naše skupina, ostatní to nevidí".

### 8.2 — Archive role gate

**Princip:** archiv = jakékoli volání `findList` s rozsahem zasahujícím před cut-off `now − ACTIVE_WINDOW_HOURS h`. Hráč (`WorldRole.Hrac`) ho nemá vidět ani po ručním curlu.

**BE implementace** v `GameEventsService.findList`:

```ts
const cutoff = new Date(Date.now() - ACTIVE_WINDOW_HOURS * HOUR_MS).toISOString();

const requestsArchive =
  filter.toDate !== undefined ||
  (filter.fromDate !== undefined && filter.fromDate < cutoff);

if (requestsArchive && membership.role < WorldRole.PomocnyPJ) {
  throw new ForbiddenException({
    code: 'ARCHIVE_PJ_ONLY',
    message: 'Archiv akcí vidí pouze PJ a Pomocný PJ.',
  });
}

// auto-clamp pro hráče: pokud žádný filter, BE silently přidá fromDate=cutoff
if (membership.role < WorldRole.PomocnyPJ && !filter.fromDate) {
  filter.fromDate = cutoff;
}
```

💡 **Proč dva mechanismy** (403 + auto-clamp): 403 brání explicitnímu pokusu o archiv (ostrý signál). Auto-clamp ošetřuje default chování — hráč zavolá `GET /game-events?worldId=X` bez filtru a dostane jen nadcházející, nikoli vše. Bez clampu by default query vrátila i archiv a my bychom museli filtrovat per-record (drahé + matoucí).

**FE implementace:**
- `useArchiveGameEvents` má `enabled: viewerRole >= WorldRole.PomocnyPJ` (TanStack Query disable). Hook pro hráče ani nevolá API.
- `useUpcomingGameEvents` volá vždy (i pro hráče), ale díky auto-clampu dostane jen nadcházející.
- `EventsToolbar` — filter chip group `Nadcházející | Archiv` render-guard `viewerRole >= WorldRole.PomocnyPJ`.
- Router/page logic: pokud `?view=archive` + role Hrac, `useEffect` přesměruje na `?view=upcoming` (silent replace).

**BE testy (přibývají):**
- Hrac volá `GET /game-events?worldId=X&toDate=2020-01-01` → 403 `ARCHIVE_PJ_ONLY`.
- Hrac volá `GET /game-events?worldId=X` (bez filtru) → vrácena jen `date ≥ cutoff` (auto-clamp).
- PomocnyPJ volá s `toDate=2020-01-01` → 200, vrácena historie.
- Hrac volá s `fromDate=2020-01-01` → 403 (rozsah zasahuje před cutoff).

---

## 9 — Acceptance criteria 9.1-I

1. `/svet/:worldSlug/akce` načte `useUpcomingGameEvents` (default) a vykreslí grid karet.
2. Toolbar přepíná `?view=upcoming|archive` (URL state, default upcoming). Upcoming → `useUpcomingGameEvents` (`fromDate=now-24h`, ASC). Archive → `useArchiveGameEvents` (`toDate=now-24h`, DESC).
3. Karta zobrazí: hero obrázek (s focal pointem) NEBO fallback ikonu, `GroupChip` (pokud `targetGroup !== null`), datum chip, countdown badge, název, čas, popis, RSVP toggle (pokud `confirmable`), attendees list (4 + "+N").
4. RSVP toggle: instant optimistic update + invalidace `useGameEvents`. 401/403 toast.
5. PomocnyPJ+ vidí v rohu karty kebab `Upravit | Smazat`. Klik → `GameEventModal` (edit) / `ConfirmDialog` (delete).
6. „+ Nová akce" otevře `GameEventModal` (create). Validace: title 1–200, date required (ISO), `groupOnly` ⇒ `targetGroup` required.
7. Image upload reuse `useUploadImage` (z 3.1b). Po uploadu klikací focal-point overlay (jak v `IkarosEventModal`). Persist `imageFocalX/Y`.
8. Hráč ze skupiny „Lumíci" **nevidí** event `{ groupOnly: true, targetGroup: 'Evropani' }`. PJ vidí, s lock ikonou + chipem „Evropani".
9. Group filter dropdown (volitelný UX) přepne klient-side filtr na `?group=Lumíci`.
10. Mobil: 1col grid, toolbar wrap, touch targety ≥44 px, modal scrollable.
11. Loading skeleton: 3 placeholder karty. Empty state per role (§6).
12. Route `/svet/:worldSlug/sprava-udalosti` → 301/replace na `/akce` (redirect element).
13. BE `imageFocalX/Y` round-trip funguje (POST + GET + PUT).
14. FE testy: card render (5 stavů: bez img / s img / group-only / RSVPed / archive), modal (create + edit + delete confirm), toolbar (upcoming/archive switch + group filter + chip group hidden pro hráče), permission (kebab visibility + archive tab hidden pro Hrac + redirect `?view=archive`→`upcoming` pro Hrac), countdown (DNES/ZÍTRA/za N dní/proběhlo). BE testy: imageFocal DTO accept + repo round-trip, `toDate` filter archive events, smazání cleanup jobu (existující testy zelené i bez `deleteOlderThan`), **archive role gate** (Hrac → 403 `ARCHIVE_PJ_ONLY`, PomocnyPJ → 200, auto-clamp pro Hrac).
15. **Archiv test (PJ)**: vytvoř event s datem **−2 roky** → vidíš v záložce Archiv (DESC). Vytvoř event **+10 let** → vidíš v záložce Nadcházející (na konci ASC). Žádná validace nebrání. Cleanup job po `npm test` v BE neběží (byl smazán).
16. **Cut-off test**: event s datem **přesně now − 23h 59min** zůstává v Nadcházející; event s **now − 24h 01min** je v Archivu (jen PJ+).
17. **Archiv hidden pro hráče**: hráč vidí jen tab Nadcházející (chip group nepřítomná). Ručně `?view=archive` v URL → instant redirect na `?view=upcoming`. Curl `GET /game-events?toDate=2020...` → 403 `ARCHIVE_PJ_ONLY` (BE).
18. `mobil-desktop` audit ✓ (skill spuštěn po grafice).
19. `napoveda` aktualizace ✓ (sekce „Akce světa" — nová stránka, role-aware popis viditelnosti archivu).

---

## 10 — Rozhodnutá Q1–Q5 (potvrzeno 2026-05-24)

- **Q1-A** ✅ BE `findList` rozšířit o `toDate` parametr (date ≤ X). Detail v §3 BE rozšíření B.
- **Q2-A** ✅ Pro 9.1-I bez pagination, jen `limit=200` cap. Rok-grouping / infinite scroll až jako budoucí dluh, pokud per-svět překročí ~10 000 eventů (viz §3.5 archive policy).
- **Q3-A** ✅ Krátkodobý redirect `/sprava-udalosti` → `/akce` (1 měsíc transition wrapper, pak smazat). Paralela s 9.1 page-character.
- **Q4-A** ✅ Group filter dropdown v `EventsToolbar` součástí 9.1-I.
- **Q5-A** ✅ Countdown badge „za N dní" — Matrix vzor, širší pokrytí než Ikaros (DNES/ZÍTRA/za N dní). Logic v `relativeCountdown.ts` util (nová), použito v `GameEventCard` (a možná i Ikaros zpětně — out of scope teď, jen pokud zatraktivní).

---

## 11 — Mimo rozsah (9.1)

- **Komentáře** → 9.1-II (vlastní spec+plan)
- **WS live sync** událostí (BE gap dle roadmapy) — bude separátní spec, dnes funguje push notifikace přes job
- **Per-postava kalendář eventů** → 9.2
- **Hidden nav item** „Akce" v `WorldSettings.hiddenNavItems` — předpoklad že nav dropdown už respektuje hiddenNavItems (jinak zvláštní mikro-úprava)
- **Notifikace** na nový event do chatu nebo e-mailem
- **Recurring events** (každý čtvrtek 19:00)
- **iCal export**
- **Drag-to-reschedule v kalendáři** — řeší 9.2
- **Pagination / virtualizace** archivu — pokud per-svět překročí ~10 000 eventů (samostatný dluh, ne 9.1)
- **Year-grouping** v záložce „Proběhlé" (např. „2026 (12)", „2025 (47)", …) — UX vylepšení nad archivem, samostatný dluh
- **Auto-archivace s tagy** (např. „kampaň X")

---

## 12 — Návaznosti

- **9.2 Kalendář** — game events zobrazené v měsíční mřížce; reuse `useGameEvents`
- **9.5 Světové novinky** — třetí consumer pro vytažení `src/shared/ui/events/` primitiv
- **5.3c Skupiny + barvy** — hotové, vstup pro `GroupChip` (`groupColors`, `customGroups`)
- **2.1 dashboard** — `useUpcomingEventsMine` agregátor už respektuje `groupOnly` filter (žádná změna)

---

## 13 — Reference

- **Globální vzor (reuse adaptér):** [IkarosEventCard.tsx](src/features/ikaros/components/IkarosEventCard.tsx), [IkarosEventModal.tsx](src/features/ikaros/components/IkarosEventModal.tsx), [useIkarosEvents.ts](src/features/ikaros/api/useIkarosEvents.ts)
- **Matrix funkční vzor:** `C:/Matrix/Matrix/frontend/src/components/EventCard.tsx`, `pages/EventsAdmin.tsx`, `pages/Calender.tsx`
- **BE:** `backend/src/modules/game-events/` (service, controller, dto, schemas)
- **Skupiny BE:** `WorldSettings.customGroups` + `groupColors` v [src/shared/types/index.ts:454](src/shared/types/index.ts#L454)
- **Skupiny FE UI:** [MembersTab.tsx:135-142](src/features/world/pages/WorldSettingsPage/tabs/MembersTab.tsx#L135-L142)
- **Roadmap blok:** [docs/roadmap-fe.md:1440-1450](docs/roadmap-fe.md#L1440-L1450)
