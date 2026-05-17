# Implementační plán 5.3 — Nastavení světa

**Spec:** [spec-5.3.md](spec-5.3.md)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE)
**Větev FE:** `feat/krok-5.3-world-settings` (odbočí z `feat/krok-5.0-world-theme`)
**Větev BE:** `feat/krok-5.3-world-settings-be`

Pořadí: **BE napřed** (FE hooky na něj spoléhají) → FE infra → orchestrátor → taby → testy → úklid.

---

## Task 1 — BE zásahy (repo `Projekt-ikaros`)

**Soubory:**
- Modify: `backend/src/modules/worlds/dto/update-member.dto.ts`
- Create: `backend/src/modules/worlds/dto/update-akj-types.dto.ts`
- Modify: `backend/src/modules/worlds/worlds.controller.ts`
- Modify: `backend/src/modules/worlds/worlds.service.ts`
- Modify: `backend/src/modules/worlds/interfaces/world-membership.interface.ts`
- Modify: `backend/src/modules/worlds/worlds.service.spec.ts` + `worlds.controller.spec.ts`

- [ ] **Step 1 — DTO fix (8.1):** `UpdateMemberRoleDto` → `@IsIn([0, 1, 2, 3, 4, 5])`.
- [ ] **Step 2 — AKJ endpoint (8.2):**
  - `UpdateAkjTypesDto { akjTypes: AkjTypeDto[] }` (`@ValidateNested`, `@Type(() => AkjTypeDto)`; `AkjTypeDto` reuse z `update-world-settings.dto.ts`).
  - Controller handler `PUT :worldId/settings/akj-types` (`@UseGuards(JwtAuthGuard)`).
  - Service `updateAkjTypes(worldId, akjTypes, requester)` — ověří `canManageMembers`, `settingsRepo.upsert(worldId, { akjTypes })`, emit `world.settings.updated`, vrátí `WorldSettings`.
- [ ] **Step 3 — enrichMembers (8.3):**
  - `WorldMembership` interface — přidat `user?: PublicOwnerSummary`.
  - Service privátní `enrichMembers(members)` — `Promise.all` přes `usersService.publicProfile(userId)`, try/catch per člen.
  - `getMembers` vrátí `enrichMembers(...)` výsledek.
- [ ] **Step 4:** `cd backend && npx tsc --noEmit && npx jest --no-coverage` → ✓
- [ ] **Step 5 — testy:** role `4` projde / `-1` 403; AKJ endpoint PomocnyPJ ✓ + Hráč 403; member response má `user.username`.
- [ ] **Step 6 — commit:** `feat(worlds): AKJ endpoint pro PomocnyPJ + role DTO fix + member enrich (krok 5.3)`

**Acceptance:** spec #1, #1b, #1c.

---

## Task 2 — FE: typy + API hooky

**Soubory:**
- Modify: `src/shared/types/index.ts`
- Create: `src/features/world/api/{useUpdateWorld,useWorldMembers,useUpdateMember,useRemoveMember,useWorldSettings,useUpdateWorldSettings,useUpdateAkjTypes}.ts`

- [ ] **Step 1 — typy:** do `index.ts` přidat:
  - `WorldMembership` → `user?: { id: string; username: string; avatarUrl?: string }`.
  - `WorldSettings` interface (`id, worldId, hiddenNavItems, customGroups, groupColors, akjTypes, ...`) + `AkjType { key, name, level }`.
- [ ] **Step 2 — hooky** (vzor `useCreateWorld.ts` — `useMutation` + `qc.invalidateQueries`):
  - `useUpdateWorld()` → `PATCH /worlds/:id`, invaliduje `['worlds', ...]`.
  - `useWorldMembers(worldId)` → `useQuery` `GET /worlds/:id/members`.
  - `useUpdateMember(worldId)` → 3 mutace (role/group/akj) nebo 1 hook s `field` param; invaliduje members query.
  - `useRemoveMember(worldId)` → `DELETE .../members/:membershipId`, invaliduje members + `['worlds','my']`.
  - `useWorldSettings(worldId)` → `useQuery` `GET .../settings`.
  - `useUpdateWorldSettings(worldId)` → `PUT .../settings` (groupColors).
  - `useUpdateAkjTypes(worldId)` → `PUT .../settings/akj-types`.
- [ ] **Step 3:** `tsc` ✓.

**Acceptance:** podklad pro #5–#17.

---

## Task 3 — FE: `Tabs` komponenta (`shared/ui`)

**Soubory:** Create `src/shared/ui/Tabs/{Tabs.tsx,Tabs.module.css,index.ts}`; Modify `src/shared/ui/index.ts`.

- [ ] **Step 1:** `Tabs` dle spec §4.2 — `items/activeId/onChange/children/orientation`. ARIA `tablist`/`tab`/`tabpanel`, `aria-selected`, klávesy ←/→ (vertikální ↑/↓).
- [ ] **Step 2 — CSS:** vertikální rejstřík (desktop), aktivní = `--theme-nav-active-bg` + levý 3px `--accent` bar; hover `--theme-nav-hover-bg`; mobil ≤ 768 → horizontální scroll lišta, touch ≥ 44 px. Tokeny only.
- [ ] **Step 3:** export z `shared/ui/index.ts`.

**Acceptance:** spec #4.

---

## Task 4 — FE: `WorldSettingsPage` orchestrátor + role gating

**Soubory:**
- Replace: `src/features/world/pages/WorldSettingsPage.tsx` → adresář `WorldSettingsPage/`
- Create: `WorldSettingsPage/{WorldSettingsPage.tsx,WorldSettingsPage.module.css,index.ts}`
- Modify: `src/app/router.tsx` (import — route `nastaveni` zůstává `memberOnly`)

- [ ] **Step 1:** `useWorldContext()` → `world/userRole/worldId/loading`. Loading → `Spinner`; `world == null` → `WorldNotFound`.
- [ ] **Step 2 — gating:** spočítat viditelné taby dle §4.1 tabulky (globální Admin/Superadmin = PJ). Aktivní tab = první viditelný; stav v URL hashi (`#zakladni`, `#clenove`…) — `useSearchParams`/`location.hash`.
- [ ] **Step 3:** render `<Tabs>` + panel aktivního tabu (lazy import tabů přes `React.lazy` — sníží bundle).
- [ ] **Step 4:** `index.ts` default export; ověřit router import.

**Acceptance:** spec #2, #3.

---

## Task 5 — Tab 5.3a Základní info

**Soubory:** Create `tabs/BasicInfoTab.tsx` + CSS; Create `lib/worldSettingsSchema.ts`.

- [ ] **Step 1 — zod schéma:** `basicInfoSchema` (name 2–60, description ≤ 1000, genre, system, dice, maxPlayers 1–999 nullable, playersWanted ≤ 500).
- [ ] **Step 2 — RHF formulář:** `useForm` + `zodResolver`, `defaultValues` z `world`. Reuse řízených sekcí z `CreateWorldPage` (`BasicInfoSection` bez slug-check, `GenreSection`, `PlayersSection`, `SystemSection`) přes RHF `Controller`.
- [ ] **Step 3 — slug read-only:** zobrazit „Adresa: `/svet/<slug>`", needitovatelné.
- [ ] **Step 4 — hero upload:** `useUploadContentImage()`, náhled `imageUrl`, „Nahrát"/„Odebrat" → zápis do RHF pole `imageUrl`.
- [ ] **Step 5 — submit:** `useUpdateWorld` (poslat jen změněná pole — `dirtyFields`), toast „Změny uloženy".
- [ ] **Step 6:** ověřit, že změna `genre` nesahá na `themeId`.

**Acceptance:** spec #5, #6, #7.

---

## Task 6 — Tab 5.3b Přístup

**Soubory:** Create `tabs/AccessModeTab.tsx` + CSS.

- [ ] **Step 1:** single-select chips 4 režimů (reuse `PillChips` stylu / `AccessModeSection` rozšířený o `closed`), `ACCESS_LABELS` z `accessMode.ts`.
- [ ] **Step 2:** panel s vysvětlením dopadu pod aktivní volbou.
- [ ] **Step 3:** „Uložit" → `useUpdateWorld` `{ accessMode }`; přechod na `closed` → `ConfirmDialog`.

**Acceptance:** spec #8.

---

## Task 7 — Tab 5.3c Členové

**Soubory:** Create `tabs/MembersTab.tsx`, `components/{MemberRow,GroupColorEditor}.tsx` + CSS.

- [ ] **Step 1:** `useWorldMembers(worldId)` → tabulka. Řádek `MemberRow` — `UserAvatar` + `user.username` (fallback „Neznámý uživatel"), `WorldRoleIcon`.
- [ ] **Step 2 — editory:** role `<select>` (WorldRole 0–5 čeština), skupina `<select>` z `customGroups`, AKJ `<select>`/number dle `akjTypes`. Uloží přes `useUpdateMember`.
- [ ] **Step 3 — hierarchie:** PJ self-demote/remove disabled + tooltip; promote na PJ → `ConfirmDialog` „více PJ"; řádky nad vlastní rolí disabled.
- [ ] **Step 4 — odebrat člena:** `ConfirmDialog` → `useRemoveMember`.
- [ ] **Step 5 — `GroupColorEditor`:** mapuje skupinu → hex; uloží `useUpdateWorldSettings` `{ groupColors }`. **Render jen pro `userRole ≥ PJ`.**
- [ ] **Step 6 — responsive:** desktop řádky / mobil karty (§4.10).

**Acceptance:** spec #9, #10, #11.

---

## Task 8 — Tab 5.3d AKJ úrovně

**Soubory:** Create `tabs/AkjTab.tsx`, `components/AkjLevelEditor.tsx` + CSS.

- [ ] **Step 1:** `useWorldSettings(worldId)` → `akjTypes`. Lokální editovatelný seznam.
- [ ] **Step 2:** přidat/přejmenovat/smazat/změnit `level`; `key` auto-derive z názvu (slug). Řazení dle `level`.
- [ ] **Step 3:** vysvětlující panel (AKJ = stupňovaná prověrka, krok 7.2e).
- [ ] **Step 4:** „Uložit" → `useUpdateAkjTypes` `{ akjTypes }`.

**Acceptance:** spec #12.

---

## Task 9 — Tab 5.3f Vzhled

**Soubory:** Create `tabs/ThemeTab.tsx`, `components/{ThemePresetGrid,ThemeCustomEditor}.tsx`, `lib/{themeTokens,contrastGuard}.ts` + CSS.

- [ ] **Step 1 — `themeTokens.ts`:** katalog dle spec §4.7 — čisté barvy (hex) + alpha vrstvy (hex + alpha). Per token: `key`, `label`, `kind: 'color' | 'alpha'`.
- [ ] **Step 2 — `contrastGuard.ts`:** WCAG kontrastní poměr (relativní luminance); `contrastRatio(fg, bg)` → number.
- [ ] **Step 3 — `ThemePresetGrid`:** `listThemes('world')`, radiogroup, thumbnaily, aktivní = `--accent` rámeček + glow.
- [ ] **Step 4 — `ThemeCustomEditor`:** levý panel tokenů (`<input type=color>` + hex + alpha range), pravý sticky náhled. Změna → debounced `applyTheme(themeId, { overrides, backgroundUrl })`. Upload pozadí → `useUploadContentImage`. Kontrast badge.
- [ ] **Step 5 — cleanup:** `useEffect` cleanup — opuštění tabu bez uložení → `applyTheme` zpět na původní stav světa (`useWorldTheme`).
- [ ] **Step 6 — uložení:** `useUpdateWorld` `{ themeId, themeOverrides, themeBackgroundUrl }`; FE limity = BE sanitace (`--theme-` prefix, ≤ 200 zn., ≤ 60 položek). „Zpět na preset" čistí overrides.

**Acceptance:** spec #13, #14, #15, #16.

---

## Task 10 — Tab 5.3e Členství

**Soubory:** Create `tabs/MembershipTab.tsx` + CSS.

- [ ] **Step 1:** karta „Odejít ze světa" — popis dopadu.
- [ ] **Step 2:** PJ → tlačítko disabled + vysvětlení (transfer/smazání). Jinak `ConfirmDialog` → `useRemoveMember` (vlastní `membershipId`).
- [ ] **Step 3:** úspěch → invalidace `useMyWorlds`, `navigate('/')`, toast.

**Acceptance:** spec #17 (uzavírá D-064).

---

## Task 11 — Testy

**Soubory:** Create `WorldSettingsPage/__tests__/*`.

- [ ] FE testy dle spec §7 (Vitest + RTL) — odhad ~25: gating, `Tabs`, `BasicInfoTab`, `AccessModeTab`, `MembersTab`/`MemberRow`, `AkjLevelEditor`, `ThemeCustomEditor`, `contrastGuard`, `MembershipTab`.
- [ ] `npm run lint && npm run lint:colors && npx tsc --noEmit && npm run build && npm run test:run` → ✓

**Acceptance:** spec #18, #19.

---

## Task 12 — Úklid 5.3g

- [ ] **Step 1:** skill `mobil-desktop` — celá stránka (taby, tabulka členů, theme editor) na ≤ 768 / tablet / desktop.
- [ ] **Step 2:** skill `napoveda` — `/ikaros/napoveda` + popis Nastavení světa a světových rolí (Korektor / PomocnyPJ / PJ).
- [ ] **Step 3 — roadmapa:** odškrtnout 5.3a–g v `docs/roadmap-fe.md`, uzavřít D-064; zapsat dluhy **D-NEW-world-transfer**, **D-NEW-slug-rename** (skill `dluh`).
- [ ] **Step 4 — commit + spec status** → ✅ Implementováno.

**Acceptance:** spec #20.

---

## Pořadí commitů

1. BE: `feat(worlds): AKJ endpoint + role DTO fix + member enrich (krok 5.3)` — repo `Projekt-ikaros`
2. FE: `feat(svet): API hooky + Tabs komponenta (krok 5.3)`
3. FE: `feat(svet): Nastavení světa — orchestrátor + taby info/přístup (krok 5.3a/b)`
4. FE: `feat(svet): Nastavení světa — členové + AKJ (krok 5.3c/d)`
5. FE: `feat(svet): Nastavení světa — theme editor + odchod (krok 5.3f/e)`
6. FE: `test(svet): krok 5.3 — testy + nápověda + mobil-desktop`

> Členění commitů je vodítko — drží taby logicky pohromadě. Při potížích lze sloučit.
