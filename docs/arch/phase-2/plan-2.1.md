# Implementační plán — krok 2.1 Ikaros dashboard

**Datum:** 2026-05-13
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-2.1.md`](./spec-2.1.md)
**Větev:** `feat/krok-2.1-dashboard` (vytvořím při startu, oba repa)

---

## Pořadí

BE → typy → FE hooks → FE komponenty → FE stránka → testy → cleanup. BE napřed, aby FE mohl integrovat reálné API.

---

## Step 1 — BE: nový endpoint `GET /api/game-events/upcoming/mine`

**Cíl:** cross-world upcoming events agregátor.

**Soubory (Projekt-ikaros backend):**

- `src/modules/game-events/dto/upcoming-event.dto.ts` — **NOVÝ.** Definovat `UpcomingEventDto` shape (viz spec §4.1).
- `src/modules/game-events/dto/upcoming-query.dto.ts` — **NOVÝ.** `class UpcomingQueryDto { @IsOptional() @IsInt() @Min(1) @Max(20) limit?: number; }`
- `src/modules/game-events/interfaces/game-event-repository.interface.ts` — přidat metodu:
  ```ts
  findUpcomingForWorlds(
    worldIds: string[],
    fromDate: string,
    limit: number,
  ): Promise<GameEvent[]>;
  ```
- `src/modules/game-events/repositories/game-event.repository.ts` — implementace:
  ```ts
  async findUpcomingForWorlds(worldIds, fromDate, limit) {
    if (worldIds.length === 0) return [];
    const docs = await this.model
      .find({ worldId: { $in: worldIds }, date: { $gte: fromDate } } as never)
      .sort({ date: 1 })
      .limit(limit)
      .lean()
      .exec();
    return docs.map(d => this.toEntity(...));
  }
  ```
- `src/modules/game-events/game-events.service.ts` — nová metoda:
  ```ts
  async findUpcomingForUser(user: RequestUser, limit: number): Promise<UpcomingEventDto[]> {
    const memberships = await this.membershipRepo.findByUserId(user.id);
    const visibleMemberships = memberships.filter(m => m.role !== WorldRole.Zadatel);
    if (visibleMemberships.length === 0) return [];
    const worldIds = visibleMemberships.map(m => m.worldId);
    // Načti více než limit, abys mohl filtrovat groupOnly a dorovnat
    const rawEvents = await this.repo.findUpcomingForWorlds(
      worldIds,
      new Date().toISOString(),
      Math.min(limit * 5, 100),
    );
    const membershipByWorld = new Map(visibleMemberships.map(m => [m.worldId, m]));
    const filtered = rawEvents.filter(e => {
      const m = membershipByWorld.get(e.worldId);
      if (!m) return false;
      if (!e.groupOnly) return true;
      if (m.role >= WorldRole.PomocnyPJ) return true;
      return e.targetGroup !== null && m.group === e.targetGroup;
    });
    const worlds = await this.worldsRepo.findByIds(worldIds);
    const worldMap = new Map(worlds.map(w => [w.id, w]));
    return filtered.slice(0, limit).map(e => {
      const world = worldMap.get(e.worldId);
      return {
        id: e.id,
        worldId: e.worldId,
        worldName: world?.name ?? '',
        worldSlug: world?.slug ?? '',
        title: e.title,
        date: e.date,
        confirmable: e.confirmable,
        myRsvp: e.confirmedBy.some(c => c.userId === user.id) ? 'confirmed' : 'none',
        confirmedCount: e.confirmedBy.length,
      };
    });
  }
  ```
  - Globální admin: vidí všechno (analog k existujícímu `canView`). Pro 2.1 však stačí ne-admin path; admin path doplníme jako `if (this.isGlobalAdmin(user))` větev navrch (vrátí všechny upcoming events napříč platformou). **Otázka pro plán:** chceme admin variantu? Defaultně NE — admin vidí jen své membership světy stejně jako kterýkoli člen. Konzistentnější UX (admin také hraje, dashboard je jeho hráčský view). _Rozhodnutí: stejný flow pro admina i člena (žádná admin výjimka v `/upcoming/mine`)._
- `src/modules/game-events/game-events.controller.ts` — nový route:
  ```ts
  @Get('upcoming/mine')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Blížící se eventy přihlášeného uživatele napříč jeho světy' })
  @ApiResponse({ status: 200, description: 'OK' })
  async getUpcomingMine(
    @CurrentUser() user: RequestUser,
    @Query() query: UpcomingQueryDto,
  ): Promise<UpcomingEventDto[]> {
    return this.service.findUpcomingForUser(user, query.limit ?? 5);
  }
  ```
  **Pozor:** `@Get('upcoming/mine')` musí být **PŘED** `@Get(':id')` v controlleru, jinak NestJS rezolvuje `upcoming` jako id. Existující `@Get(':id')` v game-events.controller.ts je na řádku ~XX (ověřit, vložit nad něj).

**Příkaz (větev + adresářová příprava):**
```bash
cd C:\Matrix\ProjektIkaros\Projekt-ikaros
git checkout -b feat/krok-2.1-dashboard
```

**Acceptance kroku:**
- TS build `cd backend; npm run build` čistý.
- `npm run test:unit -- game-events.service` čistý (existující testy nesmí padnout).

---

## Step 2 — BE: testy nového flow

**Soubory:**
- `src/modules/game-events/game-events.service.spec.ts` — rozšířit o `describe('findUpcomingForUser')`:
  - `vrátí prázdné pole pokud nemá membershipy`
  - `vyfiltruje Zadatel membership`
  - `respektuje groupOnly + targetGroup`
  - `setřídí podle date vzestupně`
  - `respektuje limit`
  - `vyplní worldName + worldSlug`
  - `myRsvp = confirmed pokud user v confirmedBy`
  - `myRsvp = none jinak`
- `test/game-events.e2e-spec.ts` — přidat 1 happy path (login → seed 2 worlds + 3 events napříč → GET `/api/game-events/upcoming/mine?limit=5` → expect 3 ordered by date).

**Příkaz:**
```bash
cd C:\Matrix\ProjektIkaros\Projekt-ikaros\backend
npm run test:unit -- game-events
npm run test:e2e -- game-events
```

**Acceptance:** všechny testy zelené, celkem +9 unit + 1 e2e.

---

## Step 3 — FE: typy + bug fix `useMyWorlds`

**Soubory (Projekt-ikaros-FE):**
- `src/shared/types/index.ts` — přidat na konec sekce World:
  ```ts
  export interface MyWorldEntry {
    world: World;
    membership: WorldMembership;
  }

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
  ```
- `src/features/world/api/useWorlds.ts` — změnit typ:
  ```diff
  - queryFn: () => api.get<World[]>('/worlds/my'),
  + queryFn: () => api.get<MyWorldEntry[]>('/worlds/my'),
  ```
  + import `MyWorldEntry` z `@/shared/types`.
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` — fix obou volání `useMyWorlds()`:
  - `SidebarContent` (~ř. 107): `worlds?.slice(0, 8).map(({ world: w, membership }) => ...)`. Pozor: současný kód kontroluje `w.ownerId === currentUser.id` pro PJ badge — nahradit za `membership.role === WorldRole.PJ` (správnější — vlastník nemusí být PJ, např. admin). Import `WorldRole`.
  - `RightPanel` (~ř. 173): pokud kód dále jen počítá `worlds?.length`, beze změny chování stačí. Ověřit.
- `src/features/profile/components/WorldsSection.tsx` — ověřit, jak používá `useMyWorlds`. Pokud iteruje, fix analog.

**Příkaz:**
```bash
cd C:\Matrix\ProjektIkaros\Projekt-ikaros-FE
git checkout -b feat/krok-2.1-dashboard
npm run lint && npx tsc --noEmit
```

**Acceptance:** `tsc` čistý (typy se srovnají), lint čistý. Manual smoke v dev — sidebar zobrazuje světy správně (pokud byl dříve broken, opraví se).

---

## Step 4 — FE: nové hooky

**Soubory:**
- `src/features/ikaros/api/useIkarosNews.ts` — **NOVÝ.** Hook `useIkarosNews()`:
  ```ts
  import { useQuery } from '@tanstack/react-query';
  import { api } from '@/shared/api/client';
  import type { IkarosNews } from '@/shared/types';

  export function useIkarosNews() {
    return useQuery({
      queryKey: ['ikaros-news'],
      queryFn: () => api.get<IkarosNews[]>('/IkarosNews'),
      staleTime: 5 * 60_000,
    });
  }
  ```
- `src/features/ikaros/api/useIkarosNews.spec.tsx` — **NOVÝ.** 2 testy (fetch happy path, 200 response transform).
- `src/features/world/api/useGameEvents.ts` — **NOVÝ.** `useUpcomingEventsMine` + `useToggleRsvp`:
  ```ts
  import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
  import { useAtomValue } from 'jotai';
  import { api } from '@/shared/api/client';
  import { accessTokenAtom } from '@/shared/store/authStore';
  import type { UpcomingEventDto } from '@/shared/types';

  export function useUpcomingEventsMine(opts: { limit?: number } = {}) {
    const token = useAtomValue(accessTokenAtom);
    const limit = opts.limit ?? 5;
    return useQuery({
      queryKey: ['game-events', 'upcoming-mine', limit],
      queryFn: () => api.get<UpcomingEventDto[]>(`/game-events/upcoming/mine?limit=${limit}`),
      enabled: !!token,
      staleTime: 60_000,
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
- `src/features/world/api/useGameEvents.spec.tsx` — **NOVÝ.** 4 testy (loading, success, error, mutation invaliduje query).

**Příkaz:**
```bash
npm run test:run -- useIkarosNews useGameEvents
```

**Acceptance:** testy zelené.

---

## Step 5 — FE: `relativeEventDate` util

**Soubory:**
- `src/features/world/utils/relativeEventDate.ts` — **NOVÝ.** Vlastní cs format util (logika dle spec §4.3.8).
- `src/features/world/utils/relativeEventDate.spec.ts` — **NOVÝ.** 8 cases:
  - Dnes 19:00 → `"dnes 19:00"`
  - Zítra 09:00 → `"zítra 9:00"`
  - +3 dny (po 15:00) → `"po 15:00"`
  - +6 dní (čt 8.5. 19:00) → `"čt 8.5. 19:00"`
  - +30 dní → `"út 12.5. 19:00"` (s rokem jen pokud jiný)
  - Příští rok → `"12.5.2027 19:00"`
  - Půlnoc dnes → `"dnes 0:00"`
  - DST jaro 2026 → spravně přechod (test s fixed `now`)

**Acceptance:** 8 testů zelených.

---

## Step 6 — FE: `WorldRoleChip` komponenta

**Soubory:**
- `src/features/world/components/WorldRoleChip/WorldRoleChip.tsx` — **NOVÝ.** Reuse `WorldRoleIcon` z 3.6a + barvy z `--role-world-*`.
- `src/features/world/components/WorldRoleChip/WorldRoleChip.module.css` — **NOVÝ.** `.chip` base + per-role color modifier classes (`.role-pj`, `.role-pomocny-pj`, `.role-korektor`, `.role-hrac`, `.role-ctenar`, `.role-zadatel`).
- `src/features/world/components/WorldRoleChip/WorldRoleChip.spec.tsx` — **NOVÝ.** 6 testů (render každé role + label + ikona).
- `src/features/world/components/WorldRoleChip/WorldRoleChip.stories.tsx` — **NOVÝ.** Storybook gallery všech 6 rolí + 2 sizes.
- `src/features/world/components/WorldRoleChip/index.ts` — re-export.

**Acceptance:** testy zelené, storybook render OK.

---

## Step 7 — FE: `DashboardPage` restructure (folder)

**Cíl:** převést flat `DashboardPage.tsx` + `.module.css` na složku `DashboardPage/`.

**Soubory:**
- `src/features/ikaros/pages/DashboardPage.tsx` → `src/features/ikaros/pages/DashboardPage/DashboardPage.tsx`.
- `src/features/ikaros/pages/DashboardPage.module.css` → `src/features/ikaros/pages/DashboardPage/DashboardPage.module.css`.
- `src/features/ikaros/pages/DashboardPage/index.ts` — `export { default } from './DashboardPage';`.
- `src/app/router.tsx` — ověřit, že import `'./features/ikaros/pages/DashboardPage'` funguje (lazy via folder + index.ts).

**Příkaz (git aware move):**
```bash
mkdir src\features\ikaros\pages\DashboardPage
git mv src\features\ikaros\pages\DashboardPage.tsx src\features\ikaros\pages\DashboardPage\DashboardPage.tsx
git mv src\features\ikaros\pages\DashboardPage.module.css src\features\ikaros\pages\DashboardPage\DashboardPage.module.css
```

**Acceptance:** `npm run build` čistý, `/` se otevírá ve dev serveru (existing chování zachováno).

---

## Step 8 — FE: extract `AnonWelcomeSection`

**Soubory:**
- `src/features/ikaros/pages/DashboardPage/sections/AnonWelcomeSection.tsx` — **NOVÝ.** Extrakce welcome card z `DashboardPage.tsx` (řádky 47–70 v původním souboru) — JSX + andel medailon.
- Pohyb relevantní CSS tříd (`.medallion`, `.welcomeTitle`, `.titleAccent`, `.paragraph`, `.signature`) z `DashboardPage.module.css` do nového `AnonWelcomeSection.module.css`.

**Acceptance:** anon `/` má stejný welcome render jako dnes.

---

## Step 9 — FE: `SectionHeader` sdílená komponenta

**Soubory:**
- `src/features/ikaros/pages/DashboardPage/components/SectionHeader.tsx` — **NOVÝ.** Props `{ title, icon?, action? }`. Layout: `<h3 class="title"><Icon /> <span>{title}</span></h3> {action && <div class="action">{action}</div>}`.
- `src/features/ikaros/pages/DashboardPage/components/SectionHeader.module.css` — **NOVÝ.** Flex space-between, gap, theme tokeny.

**Acceptance:** rendrá se jako `<header>` slot uvnitř `<IkarosCard variant="news" header={<SectionHeader ... />}>`.

---

## Step 10 — FE: `WorldsSection` + `WorldCard`

**Soubory:**
- `src/features/ikaros/pages/DashboardPage/sections/WorldsSection.tsx` — **NOVÝ.** Hook `useMyWorlds` → empty / loading / list grid 2col.
- `src/features/ikaros/pages/DashboardPage/sections/WorldsSection.module.css` — **NOVÝ.** Grid + responsive breakpoints.
- `src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx` — **NOVÝ.** Hero 96×96 + meta + role chip + popis 2-line truncate + CTA. Wrapped v `<Link to="/svet/:slug">`.
- `src/features/ikaros/pages/DashboardPage/components/WorldCard.module.css` — **NOVÝ.** Border, bg-elev, hover transform, gradient fallback pro hero.
- `src/features/ikaros/pages/DashboardPage/__tests__/WorldsSection.spec.tsx` — **NOVÝ.** 3 testy (loading skeleton, empty state s 2 CTA, list 2 cards).
- `src/features/ikaros/pages/DashboardPage/__tests__/WorldCard.spec.tsx` — **NOVÝ.** 4 testy (hero image / fallback gradient, role chip pro PJ vs Hrac, popis truncate, klik vede na slug).

**Acceptance:** testy zelené, `lint:colors` čistý.

---

## Step 11 — FE: `UpcomingEventsSection` + `EventCard`

**Soubory:**
- `src/features/ikaros/pages/DashboardPage/sections/UpcomingEventsSection.tsx` — **NOVÝ.** Hook `useUpcomingEventsMine` → empty / loading / list.
- `src/features/ikaros/pages/DashboardPage/sections/UpcomingEventsSection.module.css` — **NOVÝ.** Vertical stack.
- `src/features/ikaros/pages/DashboardPage/components/EventCard.tsx` — **NOVÝ.** Datum chip (`relativeEventDate`) + název + world link + RSVP button toggle (`useToggleRsvp`). Klik kolem RSVP button = stopPropagation. Wrap `<Link to="/svet/:slug">`.
- `src/features/ikaros/pages/DashboardPage/components/EventCard.module.css` — **NOVÝ.** Flex row, mobil vertical stack, datum chip styling, RSVP button states (active/inactive).
- `src/features/ikaros/pages/DashboardPage/__tests__/UpcomingEventsSection.spec.tsx` — **NOVÝ.** 3 testy (loading, empty, list).
- `src/features/ikaros/pages/DashboardPage/__tests__/EventCard.spec.tsx` — **NOVÝ.** 3 testy (datum chip render, RSVP toggle click, klik na řádek vede na world slug).

**Acceptance:** testy zelené.

---

## Step 12 — FE: `PlatformNewsSection` + `NewsCard`

**Soubory:**
- `src/features/ikaros/pages/DashboardPage/sections/PlatformNewsSection.tsx` — **NOVÝ.** Hook `useIkarosNews` → slice(0, 5) → empty / list. Anon i logged-in.
- `src/features/ikaros/pages/DashboardPage/sections/PlatformNewsSection.module.css` — **NOVÝ.**
- `src/features/ikaros/pages/DashboardPage/components/NewsCard.tsx` — **NOVÝ.** Nadpis + excerpt 2-line + datum + autor.
- `src/features/ikaros/pages/DashboardPage/components/NewsCard.module.css` — **NOVÝ.**
- `src/features/ikaros/pages/DashboardPage/__tests__/PlatformNewsSection.spec.tsx` — **NOVÝ.** 2 testy (empty, list).

**Acceptance:** testy zelené.

---

## Step 13 — FE: orchestrátor `DashboardPage.tsx`

**Soubory:**
- `src/features/ikaros/pages/DashboardPage/DashboardPage.tsx` — kompletní rewrite:
  ```tsx
  import { useEffect } from 'react';
  import { useSearchParams } from 'react-router-dom';
  import { useAtomValue, useSetAtom } from 'jotai';
  import {
    isAuthenticatedAtom,
    loginModalOpenAtom,
    registerModalOpenAtom,
    forgotPasswordModalOpenAtom,
  } from '@/shared/store/authStore';
  import { AnonWelcomeSection } from './sections/AnonWelcomeSection';
  import { WorldsSection } from './sections/WorldsSection';
  import { UpcomingEventsSection } from './sections/UpcomingEventsSection';
  import { PlatformNewsSection } from './sections/PlatformNewsSection';
  import s from './DashboardPage.module.css';

  export default function DashboardPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const isAuthenticated = useAtomValue(isAuthenticatedAtom);
    const setLoginModalOpen = useSetAtom(loginModalOpenAtom);
    const setRegisterModalOpen = useSetAtom(registerModalOpenAtom);
    const setForgotPasswordModalOpen = useSetAtom(forgotPasswordModalOpenAtom);

    useEffect(() => {
      // ... ZACHOVAT identicky existující useEffect z původního DashboardPage
    }, [/* deps */]);

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
- `src/features/ikaros/pages/DashboardPage/DashboardPage.module.css` — kompletní rewrite: `.page { display: flex; flex-direction: column; gap: var(--sp-5); }` + stagger reveal animace + `@media (prefers-reduced-motion: reduce)`.

**Acceptance:** rendrá se v `/` jako anon (welcome + news) a jako logged-in (worlds + events + news).

---

## Step 14 — FE: smoke test `DashboardPage.spec.tsx`

**Soubory:**
- `src/features/ikaros/pages/DashboardPage/__tests__/DashboardPage.spec.tsx` — **NOVÝ.** 3 testy:
  - Anon: vidí AnonWelcomeSection + PlatformNewsSection, nevidí WorldsSection ani UpcomingEventsSection.
  - Logged-in: vidí 3 logged-in sekce v pořadí Worlds → Events → News.
  - URL `?openLogin=1` jako anon otevře login modal (zachování existujícího chování).

**Acceptance:** testy zelené. Celkem FE pro 2.1: ~25 nových testů.

---

## Step 15 — Multi-theme smoke + responsive

**Manuální:**
1. `npm run dev`
2. Login → `/`.
3. Přepnout theme switcherem na **vesmirna-bitva**, **pergamen**, **severske-runy**, **kyberpunk**, **bila** → vizuálně ověřit:
   - Border / bg / text všech karet
   - Hero gradient fallback
   - RSVP button + datum chip
4. DevTools → viewport 360×640 → ověřit:
   - Grid světy 1col
   - Hero 80×80
   - Event card vertical stack
   - News datum pod nadpis
5. `prefers-reduced-motion: reduce` → ověřit, že stagger animace + hover transform zmizí.

**Příkaz:**
```bash
npm run dev
# → manuální klik
```

**Acceptance:** žádná hardcoded barva neuniká, mobil layout bez horizontal scrollu, animace respektují user preference.

---

## Step 16 — Spuštění `mobil-desktop` skill

**Příkaz:**
```
/mobil-desktop
```

**Acceptance:** skill nehlásí žádné regrese.

---

## Step 17 — Cleanup + roadmap

**Soubory:**
- `docs/roadmap-fe.md` — sekce "Fáze 2 — Ikaros jádro":
  - Zaškrtnout `### - [x] 2.1 Ikaros dashboard`
  - Přidat krátký popisek dokončení (analog 1.x stylu): "✅ (2026-05-13), Spec: ..., 25 FE testů, 9+1 BE testů".
- `docs/dluhy.md` — přidat **D-NEW** (Cross-world kalendář link — Eventy "Zobrazit vše →" vede dočasně na `/ikaros/vesmiry`, finální target v 9.2). **D-NEW2** (BE `IkarosNews` paginace — pokud bude novinek mnoho).

**Příkaz:**
```bash
git status
git add docs src
git commit
```

**Acceptance:** roadmap zaktualizovaná, dluhy zaznamenané.

---

## Step 18 — Spuštění `napoveda` skill

**Příkaz:**
```
/napoveda
```

**Acceptance:** sekce Stránky v `/ikaros/napoveda` aktualizovaná o novou strukturu dashboardu (Moje světy / Eventy / Novinky), FAQ relevantně doplněna pokud potřeba.

---

## Závěrečný checklist

- [ ] BE `npm run build` + `npm run test:run` + `npm run test:e2e` čisté
- [ ] FE `npm run build` + `npm run lint` + `npm run lint:colors` + `npm run test:run` + `tsc --noEmit` čisté
- [ ] Anon: `/` zobrazuje welcome + news, žádný JS error
- [ ] Logged-in: `/` zobrazuje 3 sekce v pořadí Světy → Eventy → Novinky
- [ ] Klik na world kartu → `/svet/:slug` ✅
- [ ] Klik na event row → `/svet/:slug` ✅; klik na RSVP toggle nezpůsobí navigaci
- [ ] Empty states pro Světy / Eventy / Novinky fungují
- [ ] Sidebar v `IkarosLayout` zobrazuje světy správně (bug fix)
- [ ] Responsive 360 px bez horizontálního scrollu
- [ ] 5 random theme switch → všechno čitelné
- [ ] `dluhy.md` aktualizováno (D-NEW: kalendář link, D-NEW2: news paginace volitelně)
- [ ] `roadmap-fe.md` zaškrtnuto 2.1
- [ ] `napoveda` skill spuštěný
- [ ] 2 commity (BE + FE) v `feat/krok-2.1-dashboard` na obou repech

---

## Commit strategie

Per-repo 1 commit (BE = 1 commit "feat(game-events): upcoming/mine endpoint", FE = 1 commit "feat(dashboard): 2.1 sections — worlds + events + news"). Commit messages cs/en mix dle stávající konvence (cs subject, en module prefix).

Pokud Step 3 (useMyWorlds shape fix) odhalí, že sidebar byl skutečně broken — commitnout zvlášť jako `fix(layout): use {world, membership} shape from /worlds/my` pro jasný audit trail.
