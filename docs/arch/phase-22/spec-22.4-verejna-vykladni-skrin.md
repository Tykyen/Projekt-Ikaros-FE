# Spec 22.4 — Veřejná „výkladní skříň" světa

**Stav:** ✅ IMPLEMENTOVÁNO 2026-07-15 (BE+FE; čeká commit + deploy + živé ověření) · impl. plán: [plan-22.4.md](plan-22.4.md) · **Fáze:** 22 (finální SEO dotažení, konec Etapy II) · **Roadmap:** [22.4](../../roadmap2.md) [C3] (bývalý 17.3) · **Navazuje:** 15B.1 prerender, 15B.2 meta/sitemap, 15B.6 OG sdílení, D-063 veřejný shell světa · **Souvis.:** [auth-leak-policy], 22.5 (klonování šablon staví na stejném veřejném čtení)

**Cíl:** PJ zapne přepínač **„Veřejné nahlížení"** a vybrané obsahové sekce světa (novinky, wiki stránky, postavy, mapy, bestiář, pravidla) uvidí i **nepřihlášený návštěvník** — read-only, bez AKJ, bez chatu a živé hry. Google obsah zaindexuje → svět je ochutnávka/marketing pro nové hráče.

---

## 0. Rozhodnutí z brainstormingu (2026-07-15)

| # | rozhodnutí | volba | proč |
|---|---|---|---|
| R1 | **Per-svět vs. per-stránka** | **per-svět master přepínač**, žádné per-stránka checkboxy | jednodušší mentální model pro PJ („zapnu vitrínu = svět vidí internet očima Čtenáře"); per-stránka gating už zajišťuje AKJ |
| R2 | **Nový flag vs. recyklace** | **nový boolean `publicShowcase`** (default `false`), NE `accessMode`, NE `isPublic` map | `accessMode: public` znamená „kdokoli může *vstoupit*", ne „obsah na internetu" — tichá recyklace by zpětně zveřejnila obsah bez souhlasu PJ (GDPR, reálná jména). `isPublic` na mapách = „všichni **členové**", jiná sémantika. |
| R3 | **Bezpečnostní kontrakt** | **anonym = Čtenář bez rukou**: anon NIKDY nevidí víc, než vidí člen v roli `Ctenar (1)`, a nemá žádnou mutaci | jedno pravidlo, snadno vysvětlitelné PJům, snadno testovatelné; reuse existujících role-prahů (timeline Hráč+, deník PJ PomocnýPJ+ → anon automaticky nevidí, žádný nový visibility model) |
| R4 | **Explicitní výjimky nad rámec R3** | **chat, taktická mapa, voice, presence, zvuky, obchod, převodník měn, akce, pavučina** anon nevidí, i když Čtenář ano | živý herní stav / interaktivní nástroje — divák z internetu nemá co sledovat probíhající hru; nulová SEO hodnota; menší leak-plocha |
| R5 | **Dostupnost přepínače** | jen pro `accessMode ∈ {public, open, closed}`; `private` svět přepínač nemá (UI disabled + vysvětlení) | private = 404 pro nečleny všude na BE; „privátní vitrína" je protimluv |
| R6 | **Mechanismus BE** | reuse **`OptionalJwtAuthGuard`** + centrální brána `assertShowcaseViewable(world)` v services | hotový, prověřený pattern (worlds/pages-directory/universe/world-news už ho používají) |

**Trade-off vědomě přijatý (R1+R3):** zapnutím vitríny jde na internet VŠE, co vidí Čtenář (vč. atlas map s `isPublic=true` — ty PJ „zveřejnil" členům). UI přepínače to musí **explicitně říct** („Návštěvník z internetu uvidí totéž co člen v roli Čtenář…"). Výměnou žádná per-stránka administrace.

---

## 1. Architektura

```
anon GET /svet/:slug/stranky/:pageSlug
        │
        ▼
FE router: showcaseOrMember guard ── nečlen & world.publicShowcase ──▶ render read-only
        │                                    (jinak → redirect /svet/:slug + CTA)
        ▼
BE endpoint (OptionalJwtAuthGuard)
        │  request.user == undefined (anon)
        ▼
service: assertShowcaseViewable(world)   ← world aktivní ∧ accessMode ≠ private ∧ publicShowcase
        │  OK → pohled Čtenáře (stejné filtry/strip jako pro roli Ctenar)
        ▼
whitelist toEntity mapper + strip (AKJ, moderationHidden, visibleToPlayerIds…)
```

- **Jedna brána, jeden pohled:** anon po průchodu bránou dostává **identickou response jako Čtenář** — žádná třetí varianta filtrování. Kde service filtruje per-role, anon = `role < Ctenar` (nejnižší).
- **Mutace beze změny:** všechny POST/PATCH/DELETE zůstávají `JwtAuthGuard` + role. Vitrína otevírá VÝHRADNĚ read endpointy ze sekce §2.

---

## 2. Matice sekcí (co vitrína otevírá)

**ANO — obsahové sekce (SEO/marketing hodnota):**

| sekce | FE route | dnešní stav BE pro anon | práce |
|---|---|---|---|
| Detail světa | `/svet/:slug` | ✅ už funguje (hero+info+JoinCTA) | jen doplnit vitrínové odkazy/CTA |
| Novinky | `novinky` | ✅ `scope=active` už anon čte | jen FE guard+nav |
| Seznam stránek | `stranky` | ✅ directory už anon čte (CH-120) | jen FE guard+nav |
| Wiki stránka | `:slug` (catch-all) | ❌ JWT-only (`GET pages/:slug`) | **BE: Optional+brána+strip** · FE guard |
| Postavy (adresář) | `postavy` | ✅ directory už anon čte | jen FE guard+nav (bez PC↔user vazby — ta je JWT-only, zůstává) |
| Vesmírná mapa | `mapa` | ✅ public uzly už anon čte | jen FE guard+nav (viewer read-only) |
| Atlas map | `mapy` | ❌ JWT-only (class-level) | **BE: Optional+brána**; anon = pohled hráče (`isPublic` mapy, `stripForPlayer`) · FE guard |
| Bestiář světa | `bestiar` | ❌ JWT-only *(ověřit v impl. plánu)* | **BE: Optional+brána** · FE guard |
| Pravidla | `pravidla` | ❌ JWT-only *(ověřit v impl. plánu)* | **BE: Optional+brána** · FE guard |

**NE — vyloučeno (R4 + role-prahy):**
- **R4 výjimky:** `chat`, `takticka-mapa`, `voice`, presence panel, `zvuky`, `obchod`, `prevodnik-men`, `akce`, `pavucina`.
- **Role-prahem zadarmo (Čtenář nevidí → anon nevidí):** `timeline`+`pocasi` (Hráč+), `kalendar`, `scenare`, `denik-pj`, `nastaveni`, `hraci`, world `admin/*` (PomocnýPJ/PJ+).
- **AKJ stránky:** anon = člen bez clearance → stejné chování jako Čtenář bez přístupu (zamčený záznam v adresáři, obsah nikdy).

⚠️ **Matice §2 je bezpečnostní hranice** — otevírá se výhradně vyjmenovaný seznam endpointů, nic „plošně".

---

## 3. Bezpečnost / leak-safe (klíčové)

1. **Kontrakt R3 jako invariant testů:** pro každý otevřený endpoint e2e assert `anonResponse ⊆ ctenarResponse` (anon nikdy nevrátí pole/záznam, který Čtenář nedostane).
2. **Brána `assertShowcaseViewable`:** `world.isActive ∧ accessMode ≠ 'private' ∧ publicShowcase === true`, jinak pro anon **403** (přihlášený nečlen padá do dnešních pravidel beze změny). Statusy drží modulové konvence ([auth-leak-policy]; world detail má vědomý 404-GitHub pattern — nemění se).
3. **Reuse strip vrstev:** `stripForPlayer` (mapy — maže `visibleToPlayerIds`, tajné piny), pages directory omit (`accessRequirements`, `moderationHidden`), AKJ tab filtr, whitelist toEntity mappery. **Žádný nový mapper „pro anon"** — anon jede Čtenářovou cestou.
4. **Zapnutí/vypnutí je okamžité:** brána čte flag per-request z DB, žádná cache viditelnosti. Vypnutí přepínače = anon okamžitě 403 (Google si obsah dropne při dalším crawlu; do sitemap se svět přestane propisovat hned).
5. **Žádná mutace pro anon:** nové endpointy se neotevírají pro POST/PATCH/DELETE; FE schovává akční prvky (edit tlačítka, formuláře) pro nečleny — ale hranice je BE, ne FE.
6. **PC↔user vazby, e-maily, reálná jména:** anon dostává jen to, co už dnes dostává Čtenář přes whitelist mappery; roster s `userId` vazbou zůstává JWT-only.

---

## 4. BE změny

1. **World schema:** `publicShowcase: { type: Boolean, default: false }` — field checklist kompletně: schema → `create/update-world.dto` (validace: nastavit smí jen PJ, jen ne-private) → service → **toEntity** → FE typ (`src/shared/types`). Při přepnutí světa na `private` flag **automaticky shodit** (konzistence R5).
2. **Brána:** `assertShowcaseViewable(world)` jako sdílený helper (návrh: `common/utils` vedle `world-elevation.ts`), volaná ze services otevíraných modulů, když `user === undefined`.
3. **Otevření endpointů dle §2:** pages detail (`GET :slug` + data pro viewer), world-maps list/detail, bestiář světa, pravidla — `JwtAuthGuard` → `OptionalJwtAuthGuard` **jen na read routách** (pozor CH-120: Optional se dává per-routa, ne class-level, ať se neotevře víc).
4. **Sitemap (`seo.service`):** světy s `publicShowcase` přidají podstránky — minimálně `/svet/:slug/stranky` + jednotlivé viditelné wiki stránky (bez AKJ). Cache 1 h zůstává.
5. **e2e testy (leak-pojistky):** viz §6.

## 5. FE změny

1. **WorldSettings → AccessModeTab:** přepínač „Veřejné nahlížení (výkladní skříň)" + varovný popis (viz trade-off R1+R3); disabled pro `private`.
2. **Router:** nový guard-helper `showcaseOrMember(minRole)` pro routes z §2 — člen jede postaru; nečlen/anon projde, jen když `world.publicShowcase` (world data má WorldLayout ze slugu); jinak dnešní redirect na index světa. Anon na ne-vitrínové routě → redirect + login CTA (auth-policy: 403 ≠ 404).
3. **WorldLayout / navigace:** pro anon+vitrína zapnout **redukovanou nav** (jen sekce §2, reuse `buildFullWorldNav` s filtrem) + trvalý CTA prvek „Líbí se ti tenhle svět? Přidej se" (reuse `JoinCTA`). Akční prvky (tvorba, edit) schované — read-only pohledy pro Čtenáře už z velké části existují.
4. **SEO:** `Seo` meta na vitrínových podstránkách (title = `stránka · svět`), `indexable = publicShowcase ∧ accessMode ∈ {public, open}` (rozšíření dnešní logiky ve `WorldDashboardPage`), jinak `noindex`. `worldJsonLd` + breadcrumbs na podstránkách. OG karty přes existující 15B.6 + `ShareButton` (má komentář „pro vitrínu 17.3" — teď se použije).
5. **Prerender (nginx `default.conf.template`):** rozšířit whitelist o vitrínové cesty `/svet/:slug/(novinky|stranky|postavy|mapa|mapy|bestiar|pravidla)` + wiki `/svet/:slug/:pageSlug`. Ne-vitrínový svět vrátí anonymní SPA bez obsahu → prerender leak-safe zadarmo (renderuje jako anonym).

---

## 6. Ověření (jak poznám, že 22.4 funguje)

- **e2e BE:** anon na vitrínovém světě čte wiki stránku/bestiář/mapy (200, obsah = Čtenářova response); anon na světě **bez** vitríny → 403; anon na `private` → 404/403 dle modulu; anon NIKDY nedostane AKJ obsah, `visibleToPlayerIds`, tajné piny, TM/chat/voice endpointy (401 beze změny); mutace anon → 401.
- **Invariant test R3:** pro každý otevřený endpoint porovnat anon vs. Čtenář response (anon ⊆ Čtenář).
- **FE ručně (uživatel na živém webu):** anonymní okno → vitrínový svět: vidí nav sekcí §2, obsah read-only, CTA přidání; svět bez vitríny: jen dnešní detail+CTA; člen: žádná změna chování.
- **SEO:** `curl -A "Googlebot" /svet/<slug>/stranky/<page>` → plné HTML s obsahem; sitemap obsahuje vitrínové URL; ne-vitrínový svět podstránky v sitemap nemá; vitrínová stránka nese OG meta.
- **Persistence:** zapnout → vypnout → zapnout přepínač (A→B→A) drží stav; přepnutí světa na private flag shodí.

---

## 7. Otevřené otázky / rizika

1. **Bestiář + pravidla BE tvar** — controllery nebyly v průzkumu; ověřit v impl. plánu, které read routy přesně otevřít (a zda pravidla nemají PJ-only koncepty).
2. **Už-otevřené anon endpointy** (pages directory, characters directory, universe public uzly, world-news active) dnes NEgatují na `publicShowcase` — nechat (současné chování, nic neleakuje nad Čtenáře), nebo sjednotit pod vitrínu (= zpřísnění)? Návrh: **nechat v 22.4 beze změny**, sjednocení zvážit jako samostatný bod.
3. **Vesmírná mapa pro anonyma** — PIXI 3D viewer je těžký a neprerenderovatelný; nechat (funguje pro lidi, `noindex` netřeba řešit), nebo z MVP vyřadit? Návrh: nechat, je to efektní výkladní skříň.
4. **Rozsah sitemap** — jen `/svet/:slug/stranky` vs. každá wiki stránka (u velkých světů stovky URL). Návrh: každá viditelná stránka, limit per svět doladit v impl. plánu.
5. **Moderace vitrín** — zveřejněný svět s závadným obsahem: řeší existující platformní moderace/nahlašování (20.x)? Ověřit, že report flow funguje i pro anonyma (min. odkaz na kontakt).
6. **Náhledové obrázky OG** — svět má cover; wiki stránka `imageUrl`; fallback řetěz doladit v impl. plánu.

---

## 8. Dotčené soubory (předběžně)

**BE (`Projekt-ikaros/backend`):**
- `src/modules/worlds/schemas/world.schema.ts` + `dto/update-world.dto.ts` + `worlds.service.ts` + `repositories/worlds.repository.ts` (toEntity) — flag `publicShowcase`.
- `src/common/utils/` — `assertShowcaseViewable` helper.
- `src/modules/pages/pages.controller.ts` + `pages.service.ts` — Optional na `GET :slug` (+ viewer data), brána.
- `src/modules/world-maps/world-maps.controller.ts` + `world-maps.service.ts` — Optional na read routy, brána.
- Bestiář + pravidla moduly (dle OO1).
- `src/modules/seo/seo.service.ts` — vitrínové URL.
- `test/` — e2e leak-pojistky §6.

**FE (`Projekt-ikaros-FE`):**
- `src/shared/types/index.ts` — `World.publicShowcase`.
- `src/features/world/pages/WorldSettingsPage/tabs/AccessModeTab.tsx` — přepínač.
- `src/app/router.tsx` — `showcaseOrMember` helper na routes §2.
- `src/features/admin/components/WorldMembershipGuard.tsx` (či nový guard) — vitrínová větev.
- `src/app/layout/WorldLayout/WorldLayout.tsx` + `src/features/world/lib/worldNavConfig.ts` — anon nav + CTA.
- `src/shared/seo/` použití na vitrínových stránkách; `WorldDashboardPage.tsx` indexable logika.
- `default.conf.template` — prerender whitelist.

**Beze změny:** chat, taktická mapa, voice, presence, mutační endpointy, CSP, prerender sidecar kód.
