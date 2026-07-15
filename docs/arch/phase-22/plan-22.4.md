# Plán 22.4 — Veřejná výkladní skříň světa

**Spec:** [spec-22.4-verejna-vykladni-skrin.md](spec-22.4-verejna-vykladni-skrin.md) · **Stav:** ✅ OBĚ DÁVKY HOTOVÉ 2026-07-15 — A (BE): typecheck+lint+unit 326+e2e showcase 14/14+regrese 51/51 · B (FE): build (tsc -b)+eslint+vitest dotčené oblasti; navíc opraven interceptor (anon 401 bez kicku na login) a MyThemeTab.spec (dynamický import → statický). Čeká commit uživatele + restart BE + živé ověření (anon okno, vitrína on/off, Googlebot curl).
**Pořadí dávek:** A (BE) → B (FE) — nemíchat (BE potřebuje restart, FE se testuje na živém webu).

**Zpřesnění z přípravy plánu (proti spec):**
- „Pravidla" NEJSOU samostatný BE modul — je to wiki stránka s rezervovaným slugem `pravidla` (`RulesPage.tsx:14`). Otevření pages `GET :slug` je pokryje zdarma. → BE práce jen 3 moduly: worlds (flag), pages, world-maps, bestiae.
- Bestiář světa: čtení = kterýkoli člen (bez role prahu, `assertCanReadWorld`), kontrakt anon=Čtenář sedí.
- Pages obsah je dnes čitelný **každému přihlášenému** u ne-private světa (`assertCanViewWorld` gatuje jen private) — vitrína tedy posouvá hranici „registrovaný → internet", ne „člen → internet". Nemění se, jen konstatováno.

---

## Dávka A — BE (`Projekt-ikaros/backend`)

### A1. Flag `publicShowcase` na světě
- `schemas/world.schema.ts` — `publicShowcase: { type: Boolean, default: false }`.
- `dto/update-world.dto.ts` — `@IsOptional() @IsBoolean() publicShowcase?: boolean`.
- `worlds.service.ts` update: při nastavení `publicShowcase=true` odmítnout pro `accessMode='private'` (400); při změně `accessMode → private` flag automaticky shodit.
- `repositories/worlds.repository.ts` **toEntity** — přidat do whitelistu (FE guard flag potřebuje číst i anonymně).
- ⚠️ field-checklist kompletně: schema → DTO → service → toEntity (viz `be_field_check`).

### A2. Sdílený helper
- `common/utils/showcase.ts` — `assertShowcaseViewable(world): void` — `world.isActive ∧ accessMode ≠ 'private' ∧ publicShowcase`, jinak `ForbiddenException` (kód `SHOWCASE_DISABLED`, přívětivá hláška). Bere world doc (lookup si dělá volající modul).

### A3. Pages — otevřít `GET :slug`
- `pages.controller.ts` `GET :slug` — `JwtAuthGuard` → `OptionalJwtAuthGuard` (per-route, CH-120 pattern; ostatní routy beze změny).
- `pages.service.ts` — větev `user === undefined`: world lookup → `assertShowcaseViewable`; dál stejná cesta jako člen bez clearance (AKJ tab filtr, `accessRequirements` → 403/zamčeno, `moderationHidden` → skryto). **Ověřit, že AKJ/access filtry snesou `user=undefined`** (žádný crash na `user.id`).
- Ověřit, co viewer reálně fetchuje (usePage → jen `GET :slug`?); pokud PageViewer tahá další read routy (backlinks…), NEotvírat je — viewer musí selhat tiše (FE B5).

### A4. World-maps (atlas) — otevřít read
- `world-maps.controller.ts` — sundat class-level guard, každá routa explicitně: mutace `JwtAuthGuard`, read (`list` + případný detail/folders) `OptionalJwtAuthGuard`.
- `world-maps.service.ts` — anon větev: `assertShowcaseViewable` → dál **cesta hráče** (`isPublic` mapy, kaskáda složek, `stripForPlayer`); anon `userId=undefined` nesmí matchnout `visibleToPlayerIds`.

### A5. Bestiae — otevřít world read
- `bestiae.controller.ts` — sundat class-level guard, per-routa: `GET` (list) + `GET :id` → `OptionalJwtAuthGuard`, vše ostatní (community, mutace) `JwtAuthGuard` beze změny.
- `bestiae.service.ts` `assertCanReadWorld` — anon větev: world lookup (inject worlds repo/model) → `assertShowcaseViewable`. `assertCanRead` scope `user`/`system` pro anon: `system` OK, `user` scope 403.
- Pozn.: list bez `worldId` (osobní/systémové) pro anon → jen `system` scope, žádné `user` položky.

### A6. Sitemap
- `seo.service.ts` — pro světy `accessMode ∈ {public, open} ∧ publicShowcase ∧ isActive` přidat: `/svet/:slug/stranky`, `/svet/:slug/bestiar`, `/svet/:slug/pravidla` + jednotlivé wiki stránky `/svet/:slug/:pageSlug` (jen bez `accessRequirements`, bez `moderationHidden`; strop 200 stránek/svět). Cache 1 h beze změny.

### A7. e2e leak-pojistky (test-first duch: psát souběžně s A3–A5)
Nový `test/showcase.e2e-spec.ts` (vzor existujících world e2e):
1. anon + vitrínový svět: `GET pages/:slug` 200 · bestiae list/detail 200 · world-maps list 200 (jen isPublic, bez `visibleToPlayerIds`).
2. **Invariant anon ⊆ Čtenář:** tatáž data přes Čtenáře, anon response nesmí obsahovat záznam/pole navíc.
3. anon + svět bez vitríny: totéž → 403 `SHOWCASE_DISABLED`.
4. anon + private svět: 403/404 dle modulových konvencí.
5. AKJ stránka: anon nikdy nedostane obsah.
6. mutace anon (POST page, PATCH world…): 401.
7. `publicShowcase=true` na private světě: 400; `accessMode→private` shodí flag.
- Spouštět `--maxWorkers=2` (flaky paralelismus).

**Hotovo A =** typecheck + lint:check (hook) + jest ručně; restart BE; uživatel commitne.

---

## Dávka B — FE (`Projekt-ikaros-FE`)

### B1. Typ
- `src/shared/types/index.ts` — `World.publicShowcase?: boolean` (+ případný world settings typ).

### B2. Nastavení světa
- `WorldSettingsPage/tabs/AccessModeTab.tsx` — sekce „Veřejné nahlížení (výkladní skříň)": toggle + text „Návštěvník z internetu uvidí totéž co člen v roli Čtenář (kromě chatu, taktické mapy, voice a herních nástrojů). Vyhledávače obsah zaindexují."; disabled pro `private` s vysvětlením; uložení přes `useUpdateWorld`.

### B3.–B4. Router + guard
- `WorldMembershipGuard.tsx` — nový prop `allowShowcase?: boolean`: když member/owner/elevation checky nepustí a `allowShowcase ∧ world?.publicShowcase` → render (read-only pohled).
- `router.tsx` — helper `showcaseOrMember(element, minRole=Ctenar)` = `memberOnly` s `allowShowcase`; nasadit na: `novinky`, `stranky`, wiki catch-all `:slug`, `postavy`, `mapa`, `mapy`, `bestiar`, `pravidla`. Ostatní world routes beze změny.

### B5. WorldLayout / navigace / read-only
- `WorldLayout.tsx` — třetí nav stav: nečlen/anon ∧ `world.publicShowcase` → redukovaná nav (filtr `buildFullWorldNav` na vitrínový set §2) + trvalý CTA banner „Přidej se" (reuse `JoinCTA`).
- Ověřit anon chování stránek §2: `userRole=null` = nejnižší (edit prvky schované), žádné member-only fetche, které by toastovaly 401/403 (případně podmínit `isMember`). WS join (mapy/počasí) pro anon nespouštět.

### B6. SEO
- Vitrínové podstránky: `Seo` title/description (`stránka · svět`), `indexable = publicShowcase ∧ accessMode ∈ {public, open}` (rozšířit logiku z `WorldDashboardPage.tsx:43`), jinak noindex; breadcrumbs + `worldJsonLd` kde dává smysl.
- `ShareButton` na PageVieweru ve vitrínovém režimu (reuse, komentář „pro vitrínu 17.3").

### B7. Prerender whitelist
- `default.conf.template` — rozšířit `$is_public` regex o `/svet/[slug]/(novinky|stranky|postavy|mapa|mapy|bestiar|pravidla)` + wiki `/svet/[slug]/[pageSlug]` (⚠️ catch-all nesmí chytit member-only routy — regex vyjmenovat, ne wildcard).

### B8. Dokumentace (před commitem)
- skilly `funkce` (kap. 09 svět-vstup-členství + dotčené moduly) + `napoveda` (sekce pro PJ: co vitrína zveřejní) + `mobil-desktop` (AccessModeTab, CTA banner, anon nav) + zaškrtnout 22.4 v roadmapě.

**Hotovo B =** `npm run build` (tsc -b) + eslint --fix; živé ověření dle spec §6 = uživatel (anon okno, vitrína on/off, Googlebot curl).

---

## Rizika
1. AKJ filtry a strip vrstvy s `user=undefined` — projít každé místo, kde se sahá na `user.id` (crash = 500 pro anonyma).
2. Sundání class-level guardů (A4, A5) — každá routa MUSÍ dostat explicitní guard; kontrola diffu routa po routě (jinak tichý anon přístup k mutaci).
3. FE stránky §2 můžou mít skryté member-only fetche (presence, prefs) — anon smoke-test každé sekce.
4. Prerender regex — chyba = bot dostane member-only SPA shell (neškodné) NEBO se necachuje vitrína (SEO ztráta); otestovat curl-em.
