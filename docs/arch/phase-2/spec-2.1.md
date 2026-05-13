# Spec 2.1 — Ikaros dashboard (`/`)

**Status:** Draft — čeká na schválení
**Rozsah:** FE (dashboard stránka + 3 sekce + 3 nové inner karty) + BE (1 nový endpoint pro cross-world upcoming events) + 1 bug fix shape `useMyWorlds`
**Repo:** `Projekt-ikaros-FE` (FE) + `Projekt-ikaros` (BE), větev `feat/krok-2.1-dashboard`
**Velikost:** odhad ~22 FE souborů (~900 ř.) + ~6 BE souborů (~300 ř.)
**Autor:** PJ + Claude
**Datum:** 2026-05-13
**Souvisí:** [spec-1.4.md](../phase-1/spec-1.4.md) (RoleChip, pending-actions infra), [spec-3.6a-role-matrix.md](../phase-3/spec-3.6a-role-matrix.md) (WorldRoleIcon, `--role-world-*` tokeny)

---

## 1. Cíl

Dashboard na `/` přestane být statická welcome stránka a stane se rozcestníkem pro přihlášeného uživatele: **Moje světy** (karty s hero obrázkem, role chipem, CTA) → **Blížící se schůzky** (top 5 napříč mými světy, RSVP toggle) → **Platformové novinky** (top 5, read-only). Anon uživatel vidí stávající welcome card + Novinky (beze změny).

---

## 2. Kontext / motivace

Krok 2.1 z roadmapy (`docs/roadmap-fe.md:387–390`) je první stránka v Ikaros jádře. Po dokončení fáze 1 (auth, profil, uživatelé, presence, e-mail flow, přátelé) má uživatel funkční účet, ale po loginu narazí na prázdný uvítací welcome card bez akce. Dashboard má dát:

1. **Rychlý přístup ke světům** — sidebar je úzký, neukáže obrázek/popis. Karty se hero obrázkem přitáhnou zpět do hry.
2. **Připomínku schůzek** — kalendář bude až ve fázi 9.2 per-world. Dashboard agreguje nejbližší eventy napříč světy = single source of truth "kam musím dnes/zítra".
3. **Sledovatelnost platformy** — Ikaros novinky existují v BE (`/api/IkarosNews`), ale na FE nejsou nikde viditelné. Dashboard je nejpřirozenější místo.

Bez 2.1 je `/` mrtvý route a uživatel po loginu skáče rovnou do `/ikaros/uzivatele` nebo `/svet/:id` přes sidebar.

---

## 3. Audit současného stavu

### 3.1 FE — DashboardPage

- [`src/features/ikaros/pages/DashboardPage.tsx`](../../../src/features/ikaros/pages/DashboardPage.tsx:14–93) — soubor o 93 řádcích. Obsahuje welcome card (anon + logged-in identicky) + Novinky card s placeholder `<p>Zatím žádné novinky.</p>` a tlačítkem "Přidat novinku" pro logged-in (mock, žádný handler).
- [`src/features/ikaros/pages/DashboardPage.module.css`](../../../src/features/ikaros/pages/DashboardPage.module.css) — styly pro welcome + novinky.
- Route registrace: [`src/app/router.tsx`](../../../src/app/router.tsx) — `/` → `DashboardPage` pod `IkarosLayout`.

### 3.2 FE — World API hook

- [`src/features/world/api/useWorlds.ts:7–15`](../../../src/features/world/api/useWorlds.ts) — `useMyWorlds()` typovaná jako `useQuery<World[]>`.
- [`backend/src/modules/worlds/worlds.service.ts:82–94`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts) — `findMyWorlds()` vrací **`Promise<{ world: World; membership: WorldMembership }[]>`**.
- **NESROVNALOST**: FE typ a BE shape se rozcházejí. Sidebar v [`IkarosLayout.tsx:129–134`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) přistupuje k `w.id`, `w.name`, `w.ownerId` jako k `World`, ale skutečné runtime objekty jsou `{ world, membership }`. Buď je sidebar dlouhodobě broken (asi pravděpodobné — světy se v sidebaru sotva zobrazují), nebo někde mezi tím leží transform, který jsme nenašli.

### 3.3 BE — Ikaros News

- [`backend/src/modules/ikaros-news/`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/ikaros-news) — `GET /api/IkarosNews` (public, list aktivních), `POST` / `DELETE` admin-only. Žádná paginace, vrací všechny aktivní setřízené `createdAtUtc: -1`.
- DTO shape: `{ id, title, content, authorId, authorName, createdAtUtc, isActive }`.
- FE: žádný hook na FE neexistuje. Současný DashboardPage news placeholder není napojený.

### 3.4 BE — Game Events

- [`backend/src/modules/game-events/`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/game-events) — `GET /api/game-events?worldId=<id>&fromDate=<iso>&limit=<n>` (per-world, JWT, respektuje group visibility v service).
- DTO shape: `{ id, worldId, title, date, description, imageUrl, targetGroup, groupOnly, confirmable, confirmedBy: { userId, userName }[], comments, reminderSent, createdAt, updatedAt }`.
- `POST /api/game-events/:id/confirm` — RSVP toggle (kterýkoli člen). **Pozn.:** dle game-events.service.ts je RSVP binární (přidá/odebere `confirmedBy`), ne 3-stavový. Spec 9.1 patrně dodá `declinedBy` / `maybeBy`. Pro 2.1: binární RSVP (Půjdu / nepřihlášen).
- **Cross-world agregátor neexistuje** — pro dashboard "moje blížící se eventy napříč světy" musíme přidat.

### 3.5 FE — sdílené primitivy reuse

- `IkarosCard` ([`src/shared/ui/IkarosCard/IkarosCard.tsx`](../../../src/shared/ui/IkarosCard/IkarosCard.tsx)) — varianty `welcome` / `news` přes `data-frame-panel`. Pro 2.1 reuse + 1 nová varianta není potřeba (dashboard sekce použijí `news` panel).
- `RoleChip` ([`src/features/users/components/shared/RoleChip.tsx`](../../../src/features/users/components/shared/RoleChip.tsx)) — globální role. Pro world role je potřeba samostatná `WorldRoleChip` (viz 4.3.4).
- `WorldRoleIcon` ([`src/features/ikaros/pages/HelpPage/sections/RolesSection.tsx`](../../../src/features/ikaros/pages/HelpPage/sections/RolesSection.tsx) — vytvořený v 3.6a) — 6 ikon mapovaných na `WorldRole`. Reuse pro chip.
- `ConfirmDialog` ([`src/shared/ui/ConfirmDialog/`](../../../src/shared/ui/ConfirmDialog)) — z 1.8. Reuse pro RSVP "Odhlásit z events" potvrzení (volitelně).

---

## 4. Návrh řešení

### 4.1 BE — nový endpoint `GET /api/game-events/upcoming/mine`

**Cesta:** `GET /api/game-events/upcoming/mine?limit=<n>` (default 5, max 20)
**Auth:** JWT povinný (`JwtAuthGuard`)
**Vrací:** `UpcomingEventDto[]` setřízeno vzestupně dle `date`.

```ts
interface UpcomingEventDto {
  id: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  title: string;
  date: string;       // ISO 8601
  confirmable: boolean;
  myRsvp: 'confirmed' | 'none';  // jen 2 stavy (binární RSVP v BE)
  confirmedCount: number;
}
```

**Algoritmus v service:**
1. `memberships = membershipRepo.findByUserId(userId)` → seznam `worldId` + `role`.
2. Pro každý `worldId` aktuální user **member** (= `role >= Ctenar`). `Zadatel` (role=0) nemá vidět eventy.
3. `events = gameEventsRepo.findUpcomingForWorlds(worldIds, fromDate=now, limit*memberships.length)`. Single Mongo query s `$in: worldIds`, `date: { $gte: now }`, sort `date: 1`, limit 100.
4. Filter respektuje `groupOnly` + `targetGroup` (stejně jako [`game-events.service.ts:findByWorld()`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/game-events/game-events.service.ts) — extrahovat helper `canUserSeeEvent(event, membership)`).
5. Připojit `worldName` + `worldSlug` z `worldsRepo.findByIds(worldIds)` (in-memory map).
6. Spočítat `myRsvp = event.confirmedBy.some(c => c.userId === userId) ? 'confirmed' : 'none'`.
7. Slice `0, limit`.

**Test plán BE:**
- Unit: `findUpcomingForUser_skipsZadatel`, `findUpcomingForUser_appliesGroupOnly`, `findUpcomingForUser_sortsByDate`, `findUpcomingForUser_respectsLimit`.
- E2E: setup 2 světy, 5 eventů (mix groupOnly), GET → expect filtered subset, paginace, RSVP přítomné v `confirmedBy`.

### 4.2 BE — Fix RSVP endpoint (out of scope, ale ověřit)

Stávající `POST /api/game-events/:id/confirm` je binární toggle. **V 2.1 použijeme `myRsvp: 'confirmed' | 'none'`** — uživatel klikne na "Půjdu" → POST confirm (přidá). Klikne na "Půjdu" znovu → POST confirm (odebere, toggle). 3-stavový RSVP (Půjdu / Nevím / Nejdu) přijde s fází 9.1.

**Designový dopad na FE (Q3 brainstorming):** dashboard zobrazí jen 2 stavy — outline "Půjdu" button + filled "✓ Půjdu" button (toggle). Žádný `Nevím` / `Nejdu` v 2.1.

→ **Update designu z auditu:** ne 3-stavový segmented control, ale 1-button toggle.

### 4.3 FE — Dashboard stránka

#### 4.3.1 Struktura

```
src/features/ikaros/pages/DashboardPage/        ← restructure (současný flat soubor → složka)
├── DashboardPage.tsx                            ← orchestrátor (auth-aware switch)
├── DashboardPage.module.css                    ← layout grid
├── sections/
│   ├── WorldsSection.tsx                       ← "Moje světy" sekce
│   ├── WorldsSection.module.css
│   ├── UpcomingEventsSection.tsx               ← "Blížící se schůzky"
│   ├── UpcomingEventsSection.module.css
│   ├── PlatformNewsSection.tsx                 ← "Novinky platformy"
│   ├── PlatformNewsSection.module.css
│   └── AnonWelcomeSection.tsx                  ← welcome card (extrakt současného)
└── __tests__/
    ├── DashboardPage.spec.tsx
    ├── WorldsSection.spec.tsx
    ├── UpcomingEventsSection.spec.tsx
    └── PlatformNewsSection.spec.tsx
```

#### 4.3.2 Auth-aware switch v `DashboardPage.tsx`

```tsx
export default function DashboardPage() {
  // současný useEffect na openLogin/openRegister/openForgotPassword zachovat
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  return (
    <div className={s.page}>
      {!isAuthenticated && <AnonWelcomeSection />}
      {isAuthenticated && <WorldsSection />}
      {isAuthenticated && <UpcomingEventsSection />}
      <PlatformNewsSection />
    </div>
  );
}
```

#### 4.3.3 WorldsSection — karty světů

```tsx
function WorldsSection() {
  const { data, isLoading, error } = useMyWorlds(); // shape: { world, membership }[]
  if (isLoading) return <IkarosCard variant="news" header={<SectionHeader title="Moje světy" />}>{skeleton}</IkarosCard>;
  if (error)     return <IkarosCard ...>{errorState}</IkarosCard>;
  if (!data?.length) return <IkarosCard ...>{emptyState}</IkarosCard>;
  return (
    <IkarosCard variant="news" header={<SectionHeader title="Moje světy" icon={<Globe />} />}>
      <div className={s.worldsGrid}>
        {data.map(({ world, membership }) => (
          <WorldCard key={world.id} world={world} membership={membership} />
        ))}
      </div>
    </IkarosCard>
  );
}
```

**Layout:**
- Desktop (>1024 px) + tablet (769–1024 px): `display: grid; grid-template-columns: 1fr 1fr;` (2 col).
- Mobil (≤768 px): `grid-template-columns: 1fr;` (1 col).

**Empty state:** `"Zatím nejsi v žádném světě."` + 2 button: `[Prozkoumat světy]` → `/ikaros/vesmiry`, `[Vytvořit svět]` → `/ikaros/vytvorit-svet`.

#### 4.3.4 WorldCard (inner)

```tsx
interface WorldCardProps {
  world: World;
  membership: WorldMembership;
}
```

**Layout:**
- Levý sloupec: hero obrázek 96×96 px (desktop) / 80×80 px (mobil), `border-radius: var(--radius-md)`, `object-fit: cover`. Fallback při chybějícím `world.imageUrl`: gradient placeholder `linear-gradient(135deg, var(--accent), var(--accent-strong))` + ikona `<Globe>` uvnitř.
- Pravý sloupec:
  - Nadpis `world.name` (display font, var(--text-strong))
  - Meta řádek: `{world.genre} · {world.playerCount} hráč{ů}` (var(--text-muted))
  - `<WorldRoleChip role={membership.role} />` (nová komponenta)
  - Popis `world.description` — `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;` (max 2 řádky)
- Spodní řádek: `<Link to={`/svet/${world.slug}`} class={ctaButton}>Vstoupit do světa →</Link>` (3D button style, full-width).

**Card-level hover:** `transform: translateY(-2px); box-shadow: var(--shadow-lg);`. Bez SVG ornamentů — světy uvnitř sekce-level rámu nesmí přebijet sekci.

**Card styl:** `border: 1px solid var(--border-soft); border-radius: var(--radius-md); background: var(--bg-elev-1); padding: var(--sp-3);`.

**Klik celé karty** = `<Link>` wrapping. CTA tlačítko je `<span>` uvnitř, vizuální landmark + a11y label.

#### 4.3.5 WorldRoleChip — nová komponenta

Soubor: `src/features/world/components/WorldRoleChip/WorldRoleChip.tsx` (+ `.module.css` + `.spec.tsx` + `.stories.tsx`).

```tsx
interface WorldRoleChipProps {
  role: WorldRole;
  size?: 'sm' | 'md';
}
```

Mapování — analog `RoleChip` z 1.4, ale použije:
- Ikony z `WorldRoleIcon` (3.6a)
- Barvy z `--role-world-*` tokenů (3.6a)
- Labely: `Zadatel` → "Žadatel", `Ctenar` → "Čtenář", `Hrac` → "Hráč", `Korektor` → "Korektor", `PomocnyPJ` → "Pomocný PJ", `PJ` → "PJ"

**Reasoning proč ne globální `RoleChip`:** globální role (Admin/Spravce*/Uzivatel) a world role (PJ/Hrac/...) jsou různé pojmy a memory [[project_roles_architecture]] říká „nikdy nemíchat v jednom selectoru". Stejné platí pro chip.

#### 4.3.6 UpcomingEventsSection — eventy

```tsx
function UpcomingEventsSection() {
  const { data, isLoading } = useUpcomingEventsMine({ limit: 5 });
  // ... loading / error / empty / list
  return (
    <IkarosCard variant="news" header={<SectionHeader title="Blížící se schůzky" icon={<CalendarClock />} action={<Link to="/ikaros/vesmiry">Zobrazit vše →</Link>} />}>
      <div className={s.eventsList}>
        {data.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </IkarosCard>
  );
}
```

**Empty state:** `"Žádné nadcházející schůzky."` (žádné CTA — uživatel je v každém světě, ale eventy se přidávají per-world v 9.1).

**"Zobrazit vše →"** v 2.1 vede dočasně na `/ikaros/vesmiry` (kalendář cross-world neexistuje). V 9.2 změníme na `/ikaros/kalendar` nebo skryjeme. → Sledovat jako D-NEW v 2.1.

#### 4.3.7 EventCard (inner, řádkový)

```tsx
interface EventCardProps {
  event: UpcomingEventDto;
}
```

**Layout (desktop):**
- Levá strana: datum chip (outlined `border: 1px solid var(--accent)`, padding 8/12, font-mono), text: `relativeEventDate(event.date)` — viz 4.3.8.
- Středová strana: `<Link to={`/svet/${event.worldSlug}`} class={s.eventLink}>` (název eventu bold + světa light v jedné řádce).
- Pravá strana: RSVP toggle button — `event.myRsvp === 'confirmed' ? <button class={s.rsvpActive}>✓ Půjdu</button> : <button class={s.rsvpInactive}>Půjdu</button>`. Klik → `useToggleRsvp` mutation.

**Klik na datum / název / svět** = celý řádek je `<Link>`, RSVP button je `<button>` uvnitř s `e.stopPropagation()`.

**Mobil (≤768 px):**
- Stack vertical: datum chip nahoře, název+svět pod ním, RSVP button vpravo zarovnaný na střed.

**Card styl:** stejný jako WorldCard (border-soft, bg-elev-1, radius-md, padding sp-2 sp-3).

**Pokud `event.confirmable === false`** — RSVP button nezobrazujeme (eventy které nepřipouští RSVP, čistě info).

**Pokud `event.date` ≤ 24 h od nyní** — datum chip získá `var(--accent-strong)` border + bold text (urgency hint).

#### 4.3.8 `relativeEventDate(date: string, now = new Date())` util

Soubor: `src/features/world/utils/relativeEventDate.ts` (+ `.spec.ts`).

Logika:
- Stejný den (≤ 24h, calendar day match) → `"dnes HH:mm"` (cs locale, `Intl.DateTimeFormat`)
- Zítra (+1 calendar day) → `"zítra HH:mm"`
- Tento týden (do +6 dní) → `"<weekday> HH:mm"` (`po 19:00`, `čt 8.5.`?). Použít cs weekday short + den/měsíc.
- Dál → `"<weekday> D.M. HH:mm"` (`út 12.5. 19:00`)
- Příští rok+ → `"D.M.YYYY HH:mm"` (`12.5.2027 19:00`)

Pozn.: cs locale Intl má někdy divnou kapitalizaci ("Čt 8. 5."). Vlastní fce s konstantním weekday mapou je jistější. Testy na boundary případy (DST, půlnoc, leap year).

#### 4.3.9 useUpcomingEventsMine — nový hook

Soubor: `src/features/world/api/useGameEvents.ts` (+ `.spec.tsx`).

```ts
export function useUpcomingEventsMine(opts: { limit?: number } = {}) {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['game-events', 'upcoming-mine', opts.limit ?? 5],
    queryFn: () => api.get<UpcomingEventDto[]>(`/game-events/upcoming/mine?limit=${opts.limit ?? 5}`),
    enabled: !!token,
    staleTime: 60_000,  // 1 minute — date drifting "dnes/zítra" se mění s časem
  });
}

export function useToggleRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => api.post<void>(`/game-events/${eventId}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['game-events', 'upcoming-mine'] });
    },
  });
}
```

#### 4.3.10 PlatformNewsSection — novinky

```tsx
function PlatformNewsSection() {
  const { data, isLoading } = useIkarosNews();
  // ...
  return (
    <IkarosCard variant="news" header={<SectionHeader title="Novinky" icon={<Newspaper />} action={<Link to="/ikaros/novinky">Zobrazit vše →</Link>} />}>
      {/* list nebo empty */}
    </IkarosCard>
  );
}
```

**Limit:** `data.slice(0, 5)` — BE vrací všechny, slice na FE (žádná paginace v BE). Optional dluh: pokud bude novinek mnoho, přidat `?limit=...` do BE → **D-NEW** (lazy).

**"Zobrazit vše →"** vede na `/ikaros/novinky` — ta stránka v 2.1 NEEXISTUJE, vznikne v 3.1. Pro 2.1: link rendrovat conditional jen pokud `data.length > 5`, nebo vždy a v 3.1 dodat target.

**Pro anon:** stejný BE endpoint (public), stejná sekce, stejné zobrazení. Pouze správa (Přidat / Smazat) neexistuje v 2.1 — přijde v 3.1.

**Empty state:** `"Zatím žádné novinky."` (zachovat současný text).

#### 4.3.11 NewsCard (inner)

```tsx
interface NewsCardProps {
  news: IkarosNews;
}
```

**Layout (desktop):**
- Horní řádek: nadpis (display font, bold) | pravý sloupec: relativní datum (`vor 2 dny`, `dnes` — analog event util, jiná fce nebo same). Pro 2.1 jednoduchá: `formatRelativeDate(createdAtUtc)`.
- Excerpt: `news.content` truncate `-webkit-line-clamp: 2` (max 2 řádky).
- Spodní řádek vpravo: `— {news.authorName}` (italic, muted).

**Mobil:** datum pod nadpis (vertical stack), zbytek stejně.

**Card styl:** stejný border-soft, bg-elev-1. Bez hover transformace (read-only, není klikací).

#### 4.3.12 useIkarosNews — nový hook

Soubor: `src/features/ikaros/api/useIkarosNews.ts` (+ `.spec.tsx`).

```ts
export function useIkarosNews() {
  return useQuery({
    queryKey: ['ikaros-news'],
    queryFn: () => api.get<IkarosNews[]>('/IkarosNews'),  // BE má capital path
    staleTime: 5 * 60_000,
  });
}
```

Pozn. BE má route `'/IkarosNews'` (capital), ne `/api/ikaros-news`. Sledovat / nechat tak — BE už je deployed.

### 4.4 Type sync — `IkarosNews`, `UpcomingEventDto`

Soubor: `src/shared/types/index.ts` — přidat:

```ts
export interface IkarosNews {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAtUtc: string;
  isActive: boolean;
}

export interface UpcomingEventDto {
  id: string;
  worldId: string;
  worldName: string;
  worldSlug: string;
  title: string;
  date: string;
  confirmable: boolean;
  myRsvp: 'confirmed' | 'none';
  confirmedCount: number;
}

export interface MyWorldEntry {
  world: World;
  membership: WorldMembership;
}
```

Po spec-driven-development volat `type-sync` skill v plan fázi (BE generuje OpenAPI, sjednotí s FE).

### 4.5 Fix shape `useMyWorlds`

```diff
- export function useMyWorlds() {
-   const token = useAtomValue(accessTokenAtom);
-   return useQuery({
-     queryKey: ['worlds', 'my'],
-     queryFn: () => api.get<World[]>('/worlds/my'),
+ export function useMyWorlds() {
+   const token = useAtomValue(accessTokenAtom);
+   return useQuery({
+     queryKey: ['worlds', 'my'],
+     queryFn: () => api.get<MyWorldEntry[]>('/worlds/my'),
      enabled: !!token,
      staleTime: 5 * 60_000,
    });
  }
```

**Důsledky:**
- [`IkarosLayout.tsx:107–145`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) — sidebar `worlds.slice(0, 8).map((w) => ...)` se musí změnit na `worlds.slice(0, 8).map(({ world: w }) => ...)`. **Bug fix** — pokud sidebar dnes světy nezobrazuje, opraví to. Pokud zobrazuje (díky type assertion `World[]`), behavior se nezmění.
- [`IkarosLayout.tsx:173` RightPanel](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) — analog.
- [`src/features/profile/components/WorldsSection.tsx`](../../../src/features/profile/components/WorldsSection.tsx) — analog (potřebné ověřit, jak používá).
- `usePublicWorlds` zůstává `World[]` (BE `GET /api/worlds` vrací plochá data bez membership pro anon).

### 4.6 SectionHeader sdílená komponenta

Soubor: `src/features/ikaros/pages/DashboardPage/components/SectionHeader.tsx`.

```tsx
interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}
```

Reuse přes 3 sekce (Moje světy / Schůzky / Novinky). Styl konzistentní s `<h3 class="novinkyTitle">` v současném DashboardPage. Pokud později vznikne `<h3>` jinde (Vesmiry, Diskuze), refactor do shared/ui.

---

## 5. Out of scope

- **Správa novinek** (Přidat / Smazat / Edit) — přijde v 3.1.
- **Detail eventu** + 3-stavový RSVP (Půjdu / Nevím / Nejdu) — přijde v 9.1.
- **Cross-world kalendář** (`/ikaros/kalendar`) — 9.2.
- **Stránka `/ikaros/novinky`** — 3.1.
- **Heraldic ornament panely pro nové sekce** — používáme stávající `data-frame-panel="novinky"` slot. Žádný theme update.
- **`UnreadCount` badge / live invalidate** — sidebar už má, dashboard nepotřebuje.
- **Eventy push notifikace** (reminder) — 13.2.
- **Customizace pořadí sekcí uživatelem** — fixní `Světy → Eventy → Novinky` pro logged-in.
- **Eventy filter** (jen některé světy, jen confirmable, atd.) — žádné filtry v 2.1.

---

## 6. Acceptance kritéria

### BE

1. ✅ `GET /api/game-events/upcoming/mine` existuje, vyžaduje JWT, vrací `UpcomingEventDto[]`.
2. ✅ Algoritmus filtruje out `Zadatel` membership (role=0).
3. ✅ Algoritmus respektuje `groupOnly` + `targetGroup` (analog stávajícího `findByWorld`).
4. ✅ Default limit 5, max limit 20 (query validation).
5. ✅ Setřízeno `date: 1` (vzestupně).
6. ✅ Unit testy (4+ scénáře) + 1 e2e happy path.

### FE

7. ✅ `/` pro **anon** zobrazuje welcome card + PlatformNewsSection (přesně jako dnes + Novinky napojené na BE).
8. ✅ `/` pro **logged-in** zobrazuje v pořadí: WorldsSection → UpcomingEventsSection → PlatformNewsSection.
9. ✅ `useMyWorlds` má shape `MyWorldEntry[]`. Sidebar v `IkarosLayout` opravený (světy se zobrazují).
10. ✅ WorldCard: hero obrázek 96×96 / 80×80, role chip, popis truncate 2 řádky, "Vstoupit do světa" CTA.
11. ✅ Empty state pro Moje světy: text + 2 CTA tlačítka.
12. ✅ EventCard: datum chip (relativní formát), RSVP toggle (binární), klik na řádek → `/svet/:slug`.
13. ✅ Empty state pro Eventy: text "Žádné nadcházející schůzky."
14. ✅ NewsCard: nadpis + excerpt truncate 2 řádky + relativní datum + autor.
15. ✅ Empty state pro Novinky: "Zatím žádné novinky."
16. ✅ Žádné hardcoded barvy — `lint:colors` čistý.
17. ✅ Responsivní: 2col → 1col grid pro Světy. Eventy + Novinky 1col stack.
18. ✅ `prefers-reduced-motion` vypne stagger reveal + transform hover.
19. ✅ Anon nevidí "Moje světy" ani "Blížící se schůzky".
20. ✅ Logged-in s 0 světy vidí empty state v "Moje světy", sekce Eventy se nezobrazí (skryta — žádné světy = žádné eventy).
21. ✅ FE testy: DashboardPage role-aware render (3), WorldCard render + role chip (4), EventCard RSVP toggle (3), NewsCard render + truncate (2), relativeEventDate (8 boundary cases), WorldRoleChip (6 roles + size).

### Build / lint

22. ✅ `npm run lint` + `lint:colors` + `tsc` + `test:run` + `build` čisté.
23. ✅ Po implementaci spustit `mobil-desktop` skill — viewport 360 a 1440.
24. ✅ Po implementaci spustit `napoveda` skill — aktualizovat sekci Stránky o `/` dashboard novou strukturu.

---

## 7. Test plán

### BE
- Unit: `game-events.service.findUpcomingForUser` (4 scénáře).
- E2E: `game-events.e2e.spec.ts` rozšířit o "upcoming/mine" path (auth, member filter, group filter, limit).

### FE
- Komponenty (Vitest + RTL): viz acceptance #21.
- Util `relativeEventDate`: 8 cases (dnes / zítra / weekday / další týden / DST přechod / půlnoc / leap year / past date).
- Smoke přes browser: login → `/` → klik na world kartu → detail světa otevřen. Klik na event kartu → svět. Klik RSVP → button přepne stav (optimistic není v 2.1, jen refresh po success).
- Mobil viewport (360×640): grid 1col, event card vertical stack, button full-width.
- Multi-theme smoke: přepnout na `vesmirna-bitva`, `pergamen`, `severske-runy` — ověřit že border/bg/text tokeny fungují, nikde nevykukuje hardcoded barva.

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Sidebar bug regresí (po fix shape `useMyWorlds`) | Střední | Střední | Manuální smoke po fixu + ověření `worlds.slice(0,8).map(...)` dostane data ve formě `{world, membership}`. Test pokrývající sidebar render. |
| BE `/upcoming/mine` performance při mnoha membershipech | Nízká | Střední | Mongo `$in` query s indexem na `{ worldId: 1, date: 1 }`. Audit existing index v fáze 0. |
| Race condition RSVP toggle (user dvakrát klikne) | Nízká | Nízká | `useMutation` má disabled stav během inflight + invalidate po success. |
| Theme regression (nový sekce panely jiné než dnes) | Nízká | Nízká | Reuse `data-frame-panel="novinky"` — žádný nový slot, žádný theme update. |
| `relativeEventDate` boundary bugs (DST, půlnoc) | Střední | Nízká | Comprehensive unit tests (8 cases). Použít `Intl.DateTimeFormat` pro display, vlastní logika jen pro výběr větve. |

**Rollback:** Revertovat větev `feat/krok-2.1-dashboard`. BE endpoint nemá data migraci, jen nový kód — bez follow-up cleanupu. FE `useMyWorlds` shape change → revert spolu se sidebar callsity. Pokud potřeba samostatně revertovat jen FE části (zachovat BE endpoint pro budoucnost), tak BE PR + FE PR jako separátní commity.

---

## 9. Otázky k autorovi (volitelně)

Žádné, autor delegoval. Volby:

- Anon = welcome + Novinky (žádná zm. struktury welcome card).
- Pořadí logged-in = Světy → Eventy → Novinky.
- World karta = hero obrázek 96×96 (square, vlevo) + meta + role chip + CTA.
- Empty world state = 2 CTA tlačítka.
- Event RSVP = binární (Půjdu toggle) — 3-stavový přijde v 9.1.
- Limity = světy všechny, eventy 5, novinky 5.
- Eventy filter = všechny budoucí (bez horní hranice).
- Grid světy desktop = 2col.

---

**Po schválení specu napíšu implementační plán** (přesné CLI / file diffy / pořadí kroků).
