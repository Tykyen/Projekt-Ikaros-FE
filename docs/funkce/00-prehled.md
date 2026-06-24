# 00 — Přehled funkcí platformy Projekt Ikaros

> **Účel:** Hloubková, **kódem ověřená** inventura všeho, co platforma dnes umí. Slouží jako podklad pro budoucí uživatelský průvodce (návody) a pro strategii rozšiřování. Každé tvrzení bylo ověřeno přímo ve zdrojovém kódu FE i BE — ne odhadem.
>
> **Snímek k:** 2026-06-24 · **Repozitáře:** FE `Projekt-ikaros-FE` (React/TS), BE `Projekt-ikaros/backend` (NestJS).
>
> ⚠️ Toto je stav kódu, ne marketingový popis. Kde se název funkce rozchází s realitou, je to označeno v sekci „Nesrovnalosti & dluhy" na konci každé kapitoly.

---

## Jak číst

Každá funkce má jednotnou strukturu:

- **Co to je** — k čemu slouží (1–2 věty).
- **Kde** — route + umístění v menu/UI.
- **Kdo** — kdo vidí / kdo edituje; role gating ověřený na **FE i BE** (FE samo nestačí, BE je autoritativní).
- **Co jde dělat** — všechny reálné akce.
- **Hranice / co neumí** — limity a chybějící části (vstup pro plánování expanze).
- **Zvláštnosti** — důležité chování, pasti, real-time/WS závislosti.
- **Stav** — ✅ funguje · 🚧 částečné · ⚠️ stub / mrtvé.
- **Kód** — odkazy `soubor:řádek` na FE i BE.

### Legenda stavů

| Symbol | Význam |
|---|---|
| ✅ | Funkce reálně funguje FE↔BE, ověřeno v kódu. |
| 🚧 | Částečně hotové — chybí část (typicky FE bez BE nebo naopak, nebo nedotažený edge case). |
| ⚠️ | Stub / mrtvá routa / vydávané za hotové, ale fakticky neběží. |

---

## Role model (závazný slovník)

### Globální role (UserRole) — platforma

| Role | Hodnota | Stručně |
|---|---|---|
| Superadmin | 1 | Plná moc nad platformou (jediný smí obnovit opuštěný svět, mazat kategorie). |
| Admin | 2 | Platformová správa (uživatelé, moderace účtů, smazané světy, search index). |
| Ikarus | 9 | Běžný registrovaný uživatel. |
| SpravceClanku | 10 | Schvaluje a spravuje články. |
| SpravceGalerie | 11 | Schvaluje a spravuje galerii. |
| SpravceDiskuzi | 12 | Moderuje diskuze. |

+ **Granulární admin práva (D-033):** `canManageAdmins`, `canModerateContent`, `canEditPlatformPages` — viz kap. 08 (pozn.: `canEditPlatformPages` je dnes mrtvý flag).

> ⚠️ **Drift:** FE enum drží 6 rolí, **BE enum stále nese legacy world role (3–8)** — viz kap. 08.

### Světové role (WorldRole) — uvnitř každého světa zvlášť

| Role | Hodnota | Stručně |
|---|---|---|
| Zadatel | 0 | Požádal o vstup, čeká na schválení. |
| Ctenar | 1 | Čte obsah světa. |
| Hrac | 2 | Hraje — má postavu, vidí timeline/počasí/akce. |
| Korektor | 3 | Smí editovat data světa (např. téma, šablony tabulek). |
| PomocnyPJ | 4 | Pomocný vypravěč — většina správy obsahu (stránky, kalendáře, chat, postavy). |
| PJ | 5 | Vypravěč = vlastník světa; plná governance (nastavení, mazání, předání, role). |

> **Elevation (2026-06-21, nahradila R-20):** platformový Admin/Superadmin má world pravomoci **uspané** — chová se jako hráč, dokud si je per-svět vědomě **nenahodí** (toggle „Aktivovat admina" v hlavičce světa). Elevated = plná moc PJ v tom světě; de-elevated = jako nečlen/člen. BE-enforced (`world_elevations` + `worldAdminBypass` napříč ~45 branami), audit, logout skládá. Výjimka mimo elevaci = obnova opuštěného světa. Detail viz kap. 09.

---

## Průřezové koncepty (platí napříč kapitolami)

- **Autoritativní BE:** FE guardy jsou jen UX; o přístupu rozhoduje BE (`assertAccess`, `assertMember`, `@Roles`, `canAdminWorld`, `worldAdminBypass`…). Admin bez aktivní **elevace** je BE i FE bránami odmítnut jako nečlen; po nahození (elevation) projde vším v daném světě.
- **Real-time (WebSocket):** identita ze socketu (JWT `client.data.userId`), ne z payloadu. World-level eventy chodí jako leak-safe signál `world:{id}` → klient si refetchne filtrovaný GET. Ruční `room:join` nutně s reconnect re-join.
- **Per-system schémata:** postavy i bestie mají staty dle herního systému světa; schémata jsou canonical na FE → exportují se do BE, kde je validace v soft-mode (chybí-li schema, důvěřuje FE). 13+ herních systémů.
- **Témata / skiny:** `:root` vlastní buď globální ThemeProvider, nebo WorldLayout (per-svět téma) přes gate atom — nikdy ne třetí aplikátor.
- **AKJ chráněné záložky:** obsah na stránkách lze zamknout podle „clearance" + „grant"; zamčené záložky se hráči ukazují jako 🔒 (jméno + úroveň, bez obsahu), po přístupu 🔓 + obsah.
- **Soft-delete:** mazání světa = 30denní recovery; řada entit má koš místo tvrdého smazání.
- **Prázdné & chybové stavy (15.6):** sdílená primitiva `StatePlaceholder` → `<EmptyState>` (nic k zobrazení) / `<ErrorState>` (401/403/404/500/load-error) / `<FullPageState>`. 3 velikosti (hero/panel/inline), role-aware CTA, 11 nadžánrových WebP ilustrací (`public/illustrations/states/`). Žádná „prázdná bílá obrazovka": prázdné seznamy = ilustrace + výzva; chyby = vlídná hláška + cesta ven. Anonym na chráněné route → 401 „přihlas se" (leak-safe, FE dle `isAuthenticatedAtom`).
- **Výpadek backendu / údržba (deploy, restart):** FE rozlišuje „BE je dole" od skutečné 404/403. Klasifikátor `isBackendUnavailable` (`src/shared/api/isBackendUnavailable.ts`): axios chyba bez `response` (network/ECONNREFUSED/timeout) **nebo** 502/503/504 = výpadek; 404/403/500 = BE odpověděl. Axios interceptor (`client.ts`) po **2** po sobě jdoucích výpadcích zvedne `backendUnavailableAtom`, první úspěšná odpověď ho shodí. Globální `<MaintenanceOverlay>` (mount v `main.tsx`, nad vším) ukáže vlídné „Probíhá údržba" místo matoucího „Tento svět nenajdeme" (dřív: BE restart → `WorldNotFound`) a sám poll-uje `GET /api/health` (veřejný); po naběhnutí BE se schová a invaliduje dotazy → stránky se obnoví bez reloadu. **Stav: ✅** (FE-only, bez BE změny).
- **Prerender pro crawlery (15B.1):** veřejné routy se vyhledávačům a sociálním scraperům servírují jako **hotové HTML**; lidé dostávají dnešní SPA beze změny. FE nginx (`default.conf.template`: mapy `$prerender_ua` + `$prerender_path` + `$do_prerender`, interní `location = /__prerender`) podle `User-Agent` (Googlebot, Seznambot, facebookexternalhit, …) **a** whitelistu veřejných cest přepne na **self-hosted headless Chromium sidecar** (`prerender/index.js`, puppeteer-core + alpine Chromium, LRU cache s TTL, graceful fallback na SPA při selhání). SPA signalizuje „obsah domalován" přes `window.__PRERENDER_READY__` (`src/app/PrerenderReady.tsx`, čeká na `useIsFetching()===0`; tvrdý strop 10 s v `main.tsx`). **Leak-safe:** render běží jako anonym — nginx mu maže `Cookie`/`Authorization`, takže privátní svět je BE nedostupný (`OptionalJwtAuthGuard` → 404) a prerender ho fyzicky nezíská. **Whitelist** = `/`, `/podminky`, `/ikaros/{napoveda,novinky,vesmiry,clanky,galerie}`, `/svet/:slug`; auth/citlivé routy (`/chat`, `/reset-password`, `/admin/*`, member-only) se **NEprerenderují**. Per-page `<title>`/description/OG dodává **15B.2** (níže). Sidecar v `docker-compose.yml` (`prerender`, bez host portu, `depends_on` frontend). **Stav: 🚧 kód hotový + lokálně ověřeno (render/cache/fallback), čeká deploy** + ops ověření RAM serveru (Chromium ~150–300 MB).
- **SEO meta / sitemap / robots (15B.2):** každá veřejná stránka má **vlastní** `<title>`, meta description, canonical a OG/Twitter kartu přes sdílenou komponentu `<Seo>` (`src/shared/seo/Seo.tsx`) — **bez** knihovny, **nativní React 19 hoisting** `<meta>`/`<link>` do `<head>`; titulek imperativně `document.title` (jinak by hoisting zdvojil statický `<title>` z `index.html`). Zapojeno do 10 veřejných stránek (homepage, vesmíry, články+detail, galerie+detail, nápověda, novinky, podmínky, `/svet/:slug`); description z TipTap přes `metaDescription()` (strip+ořez ~160). **Indexace:** veřejné světy (`public`/`open`) + `Published` články/galerie ano; private/closed svět a nepublikovaný obsah → `noindex` (`<Seo noindex>`). `public/robots.txt` = whitelist (Allow `/`, Disallow `/admin`,`/chat`,`/reset-password`,profil/pošta/diskuze/…) + `Sitemap:` odkaz. **`/sitemap.xml`** = BE modul `seo` (`backend/.../modules/seo`, `GET /api/sitemap.xml`, **leak-safe** — jen veřejné entity, stejné filtry jako přehledy; in-memory cache 1 h); FE nginx proxuje externí `/sitemap.xml` → `https://${BACKEND_HOST}/api/sitemap.xml` (SEO same-host). **Vizuální breadcrumbs** (`src/shared/ui/Breadcrumbs`) na detailech svět/článek/galerie (`Domů › Sekce › název`), datově (`Crumb[]`) využité i pro `BreadcrumbList` JSON-LD (15B.3, níže). **Stav: 🚧 FE+BE kód hotový + testy (FE 11, BE 6) zelené, čeká deploy** (+ BE restart). JSON-LD strukturovaná data = **15B.3 (níže)**, sdílecí tlačítka = 15B.6.
- **Strukturovaná data / JSON-LD (15B.3):** veřejné detailové stránky vystaví vyhledávači strojově čitelná data (schema.org) v `<script type="application/ld+json">` → Google může zobrazit náhledový obrázek, datum, drobečky (vyšší proklik). Komponenta `<JsonLd>` + čisté buildery v `src/shared/seo/jsonLd.tsx` (vše v jednom `.tsx` — oddělené `JsonLd.tsx`+`jsonLd.ts` by na Windows case-insensitive FS kolidovalo, viz CH-019). **Schémata:** `Article` (článek; obrázek = 1. `<img>` z TipTap obsahu přes `firstImageSrc`, fallback brand logo — `IkarosArticle` nemá `coverUrl`; tentýž helper napojen i na `og:image` článku v `<Seo>`, takže sdílecí náhled už není jen logo — vyřešená nesrovnalost z 15B.2), `ImageObject` (galerie, vč. `width`/`height`), `CreativeWork` (svět; `creator` z `world.owner.username`), `BreadcrumbList` (reuse `Crumb[]` z breadcrumbs — jeden zdroj pro vizuál i data), `WebSite`+`Organization` (homepage brand). **Gating:** JSON-LD se renderuje jen na `indexable` stránce (stejná podmínka jako `<Seo noindex>` — `Published` obsah / `public`/`open` svět); `serializeJsonLd` escapuje `<` → `<` proti `</script>` breakoutu. **Vědomě vynecháno:** `Person`/`ProfilePage` (veřejné profily jsou v robots `Disallow` + privacy), `DiscussionForumPosting` (diskuze za `requireAuth`+`JwtAuthGuard`, neindexovatelné), `AggregateRating` (Google u `Article` hvězdičky neukazuje, self-serving rating = riziko manual action). **BE beze změny** (čerpá z týchž veřejných entit jako 15B.2). FE `src/shared/seo/jsonLd.tsx`, integrace v `ArticleDetailPage`/`GalleryDetailPage`/`WorldDashboardPage` (jen non-member view)/`DashboardPage`. **Stav: 🚧 FE kód hotový + testy 15/15 + build zelený, čeká deploy** (BE restart netřeba). Ověření: Google Rich Results Test.
- **Bezpečnostní HTTP hlavičky (14.3):** HTML dokument servíruje **FE nginx** (`default.conf.template` `location /`) — sem patří hlavní **XSS-CSP** (allowlist skriptů/stylů/spojení: self + Cloudflare Turnstile + Google Fonts + Cloudinary + `BACKEND_HOST` přes nginx envsubst), HSTS, Referrer-Policy, Permissions-Policy. **BE** vrací jen JSON/obrázky → `helmet()` jako API hardening (`default-src 'none'`, HSTS, nosniff, `frame-ancestors 'none'`; `crossOriginResourcePolicy:false` aby nerozbil PixiJS `/static/` textury) — `main.ts` za `enableCors`. Inline pre-hydration theme skript povolen přes **SHA-256 hash** + build guard (`scripts/check-csp-hash.mjs`, drift = build fail). **Stav: 🚧 kód hotový, nasazeno report-only** (`CSP_HEADER_NAME` přepínač) → enforce po sběru porušení. Past: TipTap/PixiJS/dice WASM mohou v report-only vyžádat `style-src 'unsafe-inline'` / `script-src 'wasm-unsafe-eval'`.

---

## Mapa kapitol

### Platforma (Ikaros)

| # | Kapitola | Hlavní routy |
|---|---|---|
| [01](01-ucet-prihlaseni-bezpecnost.md) | Účet, přihlášení & bezpečnost | login, `/reset-password`, `/email-verify`, 2FA, self-delete |
| [02](02-profil-uzivatele-pratelstvi.md) | Profil, uživatelé & přátelství | `/ikaros/profil`, `/ikaros/uzivatel/:id`, `/ikaros/uzivatele` |
| [03](03-uvodnik-objevovani-svetu.md) | Úvodník & objevování světů | `/`, `/ikaros/vesmiry`, `/ikaros/vytvorit-svet` |
| [04](04-komunitni-obsah.md) | Komunitní obsah | `/ikaros/clanky`, `/galerie`, `/diskuze`, `/novinky` |
| [05](05-komunikace-platformy.md) | Komunikace platformy | `/chat`, `/chat/rozcesti`, `/ikaros/posta`, push |
| [06](06-akce-oblibene.md) | Akce & oblíbené | `/ikaros/akce`, `/ikaros/oblibene` |
| [07](07-napoveda-podminky.md) | Nápověda & podmínky | `/ikaros/napoveda`, `/podminky` |
| [08](08-platformova-administrace.md) | Platformová administrace | `/admin`, `/admin/dungeon-builder`, `/ikaros/admin/emotes` |

### Svět (`/svet/:worldSlug`)

| # | Kapitola | Hlavní routy |
|---|---|---|
| [09](09-svet-vstup-clenstvi.md) | Svět: vstup, dashboard, členství & role | index, `/hraci`, `/skupina/:groupKey` |
| [10](10-nastaveni-hlavni-lista.md) | Nastavení světa & hlavní lišta | `/nastaveni`, `/admin/headline` |
| [11](11-stranky-wiki-informace.md) | Stránky, wiki & informace | `/stranky`, `/:slug`, `/edit/:slug`, `/pravidla` |
| [12](12-postavy-bestiar-ekonomika.md) | Postavy, bestiář & ekonomika | `/postavy`, `/moje-postava`, `/bestiar`, `/obchod`, `/prevodnik-men` |
| [13](13-komunikace-sveta.md) | Komunikace světa | `/chat`, `/novinky` |
| [14](14-mapy-nastroje-hry.md) | Mapy & nástroje hry | `/mapa`, `/mapy`, `/takticka-mapa`, `/zvuky`, `/denik-pj` |
| [15](15-cas-pribeh.md) | Čas & příběh | `/kalendar`, `/timeline`, `/pocasi`, `/akce`, `/pavucina`, `/scenare` |

---

## Kde hledat nesrovnalosti

Každá kapitola končí sekcí **„⚠️ Nesrovnalosti & dluhy (k ověření)"** — soupis míst, kde se kód rozchází s názvem/očekáváním (mrtvé routy, stuby, FE bez BE, drift FE↔BE). Tyto body jsou nejcennější vstup pro plánování dalších etap: ukazují, co vypadá hotově, ale není, a kde jsou díry k zaplnění.
