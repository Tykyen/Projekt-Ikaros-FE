# Spec 15B.7 — Analytics: měření návštěvnosti (admin/superadmin)

**Stav:** ✅ IMPLEMENTOVÁNO 2026-06-22 (BE 19 testů + FE 8 testů zelené, build OK, mobil-desktop audit; **čeká deploy + BE restart + redeploy prerender sidecaru**) · **Fáze:** 15B (H2 Objevitelnost / SEO) · **Roadmap:** [15B.7](../../roadmap2.md) [H2-07] · **Těží z:** [15B.1 prerender](spec-15B.1-prerender.md) (rozliš bota od člověka), [15B.2 meta/sitemap](spec-15B.2-meta-sitemap.md) (které routy jsou veřejné) · **Zobrazuje se v:** Administrace → Přehled (rozšíření `OverviewTab`, ne nový tab)

**Cíl:** Admin/Superadmin vidí v Přehledu administrace **celkovou návštěvnost platformy** — kolik návštěv/návštěvníků chodí, na které stránky, odkud (vyhledávač / přímo / interně / sociální / odkaz), a trend v čase. Agregát pro provozovatele, **žádná data o jednotlivých uživatelích**.

**Proč:** SEO vlna (15B) zvedá viditelnost — bez měření nevíš, jestli funguje. Přehled návštěvnosti je přirozená zpětná vazba na celou Fázi 15B (objevitelnost).

📚 **Page view** = jedno zobrazení stránky (jeden ping). **Návštěvník (session)** = jedna anonymní relace (sessionStorage nonce, zaniká zavřením tabu) — hrubý odhad „kolik lidí", ne cross-session identita.
📚 **TTL index** = Mongo index nad `Date` polem s `expireAfterSeconds`; databáze sama maže dokumenty starší než N → historie se drží automaticky bez cron jobu.

---

## 0. Rozhodnutí z brainstormingu (2026-06-22, čeká schválení)

| # | rozhodnutí | volba | proč |
|---|---|---|---|
| R1 | **Self-hosted vs externí** | **self-hosted** (vlastní counter v BE modul `analytics`) | žádná 3rd-party, žádné cookies → **bez consent banneru**, GDPR-čisté; sedí na anon render z 15B.1; plná kontrola, nula nákladů. GA4/Plausible = cizí závislost + cookie lišta. |
| R2 | **Granularita** | ukládám **surové page-view eventy**, dashboard agreguje aggregation pipeline | jeden zdroj pravdy → agreguju libovolně (trend / top stránky / zdroje) bez předpočítaných tabulek. |
| R3 | **Historie** | **TTL index 90 dní** na `createdAt` | trend do 90 dní pokryje potřebu; auto-mazání, žádný cron. Delší trend = budoucí denní rollup (viz §8). |
| R4 | **Veřejná vs přihlášená část** | počítat **obojí**, ukládat `authed: boolean` | provozovatel chce celkovou aktivitu; dashboard zvlášť ukáže podíl anonymních (= SEO/akviziční efekt). |
| R5 | **Umístění UI** | **sekce „Návštěvnost" v `OverviewTab`** (Přehled) | přání uživatele (2026-06-22); návštěvnost je přirozené rozšíření admin dashboardu, ne separátní nástroj. |
| R6 | **Graf** | **vlastní lehký CSS/SVG** (bar chart + horizontální bary) | pár sloupců nestojí za ~100 kB `recharts` dep. |
| R7 | **Identita návštěvníka** | **sessionStorage nonce** (náhodný, anonymní), žádná IP/cookie | hrubý odhad sessions bez PII; GDPR-čisté. IP se **neukládá**. |
| R8 | **Bot/prerender filtr** | BE zahodí ping když UA = bot (sdílený regex) **nebo** UA obsahuje `Ikaros-Prerender` marker | prerender sidecar (15B.1) je headless Chrome → spustí SPA JS → odpálil by ping; marker ho odřízne. Boti většinou JS nespustí, regex je 2. pojistka. |

**Záběr proti roadmapě:** roadmapa nechává otevřené self-hosted vs externí (R1), granularitu (R2), historii (R3), přihlášenou část (R4). Všechny rozhodnuty výše. UI = rozšíření Přehledu místo nového tabu (R5, přání uživatele).

---

## 1. Architektura

```
PROHLÍŽEČ ČLOVĚKA (SPA)                         BOT / PRERENDER SIDECAR
  každá změna routy                               Googlebot → statické HTML (JS neběží)
  │  usePageViewPing()                            sidecar (headless Chrome) → JS BĚŽÍ
  ▼                                                 │ ping by se odeslal
  POST /api/analytics/pageview                       ▼ ale UA = "...Ikaros-Prerender"
  { path, referrer, sessionId, authed }            POST /api/analytics/pageview
        │                                                 │
        ▼                                                 ▼
   ┌─────────────────── BE modul `analytics` ───────────────────┐
   │ AnalyticsController.pageview()  [VEŘEJNÝ, bez guardu]       │
   │   ├─ UA = bot regex? ──────────────┐                        │
   │   ├─ UA obsahuje Ikaros-Prerender? ├─→ ano → 204, NEUKLÁDAT │
   │   └─ jinak → ulož AnalyticsEvent                            │
   │        { path, referrerCategory(odvozeno), sessionId,       │
   │          authed, createdAt }  (TTL 90 d)                    │
   │                                                              │
   │ AnalyticsController.summary()  [AdminGuard]                 │
   │   └─ aggregation pipeline → AnalyticsSummary (cache 5 min)  │
   └──────────────────────────────────────────────────────────────┘
        │
        ▼
   FE Administrace → Přehled → sekce „Návštěvnost"
   (karty + denní bar chart + top stránky + zdroje)
```

---

## 2. Datový model (BE)

Kolekce `analytics_events` (modul `analytics`, vzor dle `seo` modulu):

```ts
@Schema({ collection: 'analytics_events' })
class AnalyticsEventSchemaClass {
  @Prop({ required: true }) path: string;            // normalizovaná routa, max 200 zn., bez query
  @Prop({ required: true }) referrerCategory: string;// 'search'|'social'|'referral'|'internal'|'direct'
  @Prop({ required: true }) sessionId: string;        // anon nonce (hash? viz pozn.), max 64 zn.
  @Prop({ required: true }) authed: boolean;          // přihlášený návštěvník?
  @Prop({ required: true, default: Date.now }) createdAt: Date;
}
// TTL index: createdAt → expireAfterSeconds = 90*24*3600
// běžné indexy: createdAt, path, referrerCategory (pro aggregation)
```

**Pozn. sessionId:** FE pošle náhodný nonce ze `sessionStorage`. BE ho uloží tak jak je (je anonymní, neváže se k userId). Žádná IP, žádný user-agent string se neukládá (UA jen pro filtr, pak zahodit). → žádné PII.

**Normalizace path:** dynamické segmenty se **negeneralizují** (chceme vidět konkrétní `/svet/:slug`), jen se ořízne query string a délka. (Pozn.: pokud by se v budoucnu objevila citlivá routa v path, zvážit allowlist veřejných prefixů — viz §7.)

---

## 3. BE — endpointy (modul `analytics`)

| metoda | routa | guard | tělo / odpověď |
|---|---|---|---|
| `POST` | `/analytics/pageview` | **žádný** (veřejný, i anon) | `{ path, referrer, sessionId, authed }` → `204` (vždy, i při ignoru — neprozrazuj filtr) |
| `GET` | `/analytics/summary?days=7\|30\|90` | **`AdminGuard`** (Admin+) | `AnalyticsSummary` (viz §4) |

- **Bot/prerender filtr** v `pageview`: čte `req.headers['user-agent']`. Sdílený seznam bot regexů = **kopie z nginx mapy** (`googlebot|bingbot|seznambot|yandex|…`) v konstantě `BOT_UA_RE`. Marker `Ikaros-Prerender` → ignoruj. ⚠️ Po každé změně bot seznamu synchronizovat nginx ↔ BE konstantu (zapsat do `chybovy-denik` jako dual-source past).
- **Referrer kategorizace** (BE z `referrer` v body, ne z hlavičky — SPA navigace hlavičku nemá): prázdný → `direct`; vlastní doména (`FRONTEND_URL` host) → `internal`; google/seznam/bing/duckduckgo/yandex → `search`; facebook/twitter/x/instagram/discord/reddit/linkedin → `social`; jinak → `referral`.
- **Cache** summary: in-memory `{ data, at }` TTL 5 min per `days` (vzor `SeoService`). Dashboard nehází DB aggregation na každý refetch.
- **Rate-limit** `pageview`: lehký (BE už má throttler? — ověřit; jinak měkký limit per IP-hash/min jako anti-spam, bez ukládání IP).
- **Validace:** `class-validator` DTO — `path` string ≤200, `sessionId` string ≤64, `authed` boolean, `referrer` optional string ≤500. ValidationPipe whitelist (past z `feedback_be_restart_required`).

---

## 4. AnalyticsSummary (BE DTO = FE typ)

```ts
interface AnalyticsSummary {
  range: { days: number; from: string; to: string };
  totals: {
    views: number;          // page views v období
    visitors: number;       // distinct sessionId
    anonShare: number;      // 0..1 podíl anon page views (authed=false)
  };
  daily: { date: string; views: number; visitors: number }[]; // vzestupně, 1 bod/den
  topPaths: { path: string; views: number }[];                // top ~10
  sources: { category: string; views: number }[];             // search/direct/internal/social/referral
  generatedAt: string;
}
```

Aggregation: `$match` na `createdAt >= from` → větve přes `$facet` (totals / daily `$group` by den / topPaths `$group` by path `$limit` 10 / sources `$group` by category / visitors `$addToSet sessionId` → `$size`).

---

## 5. FE — sběr (page-view ping)

- `src/shared/analytics/usePageViewPing.ts` — hook v root layoutu, sleduje `useLocation().pathname`; na každou změnu pošle `POST /analytics/pageview`.
- `sessionId`: `sessionStorage.getItem('ik_anon_sid')` nebo nový `crypto.randomUUID()` (uloží zpět).
- `referrer`: `document.referrer` (jen 1. ping session, jinak `''` → BE udělá `internal`/`direct`).
- `authed`: z `currentUserAtom` (přihlášený?).
- **Fire-and-forget**: `void api.post(...).catch(() => {})` — ping nikdy nesmí rozbít UX ani zdržet render. Bez TanStack Query (není to read).
- ⚠️ **Neposílat ping z neveřejných admin/edit rout?** → ne, počítáme i přihlášenou část (R4); ale `authed` flag je rozliší. Ping běží všude v SPA.

## 6. FE — dashboard (sekce v `OverviewTab`)

Nová sekce **„Návštěvnost"** mezi „Obsah" a „Fronta" (nebo na konec před Rychlé odkazy):

- **Přepínač období** 7 / 30 / 90 dní (segmented, drobný; default 7).
- **StatCards** (reuse `StatCard`): Návštěvy · Návštěvníci · Podíl anonymních (%) · (volitelně) Návštěvy/den průměr.
- **Denní trend** — vlastní CSS bar chart: `daily[]` → flex sloupce, výška = `views / max`, hover tooltip (datum + počet). Komponenta `MiniBarChart` (`src/features/admin/components/AnalyticsSection/`).
- **Top stránky** — list `path → views` s horizontálním barem (% z max), path klikací (link na danou routu).
- **Zdroje** — list kategorií s horizontálním barem a procenty.
- Hook `useAnalyticsSummary(days)` (vzor `useAdminStats`, `staleTime` 60 s, query key `adminKeys.analytics(days)`).
- Loading skeleton + error hláška ve stylu `OverviewTab`.
- Mobil: karty 1–2 sloupce, chart scroll/zmenšení (mobil-desktop audit po implementaci).

---

## 7. Bezpečnost & soukromí

- **Žádné PII:** neukládá se IP, user-agent string, ani userId. Jen path, kategorie zdroje, anon session nonce, authed bool, čas.
- **Bez cookies** → žádný consent banner potřeba (sessionStorage není sledovací cookie; nonce je anonymní a per-tab).
- **Dashboard čtení jen Admin+** (`AdminGuard`); ingest endpoint veřejný (musí, kvůli anon návštěvám) ale jen zapisuje, nic nečte/nevrací.
- **Leak:** summary nevrací nic o konkrétním uživateli; agregáty. `path` může teoreticky obsahovat slug privátního světa, ale to je jen URL (ne obsah) a vidí ji jen Admin — akceptováno; budoucí allowlist prefixů viz §2.
- **Anti-inflace:** bot/prerender filtr (R8); rate-limit pingu (§3).

## 8. Mimo záběr / budoucí

- **Denní rollup** kolekce pro trend > 90 dní (až bude objem velký — TTL events drží jen 90 d). Teď zbytečné.
- **Geolokace / zařízení / prohlížeč** — vědomě ne (PII, navíc dep).
- **Per-svět návštěvnost pro PJ** — jiný feature (governance), ne tento admin agregát.
- **Real-time „právě teď online"** — Přehled už má „Aktivní (24 h)" z presence; tady ne.

## 9. Ops

- Nový BE modul `analytics` → registrace v `app.module.ts`; **BE restart nutný** (`feedback_be_restart_required`).
- Úprava `prerender/index.js`: `page.setUserAgent(ua + ' Ikaros-Prerender')` → **redeploy prerender sidecaru**.
- TTL index se vytvoří při startu (Mongoose `@Schema` + index). Ověřit, že vznikl.
- Env: žádné nové.

## 10. Testy

- **BE:** `analytics.service.spec` — referrer kategorizace (5 případů), bot/prerender filtr (ignor), aggregation summary (seed eventy → očekávané totals/daily/topPaths/sources), cache TTL.
- **FE:** `usePageViewPing` (route change → 1 ping, sessionId persist), `AnalyticsSection` render (data → karty + bars; loading; error). Vitest bez globals, fireEvent (`project_fe_test_precommit`).
- Build `npm run build` (tsc -b) zelený před push (`project_fe_build_preexisting_errors`).

## 11. Dotčené soubory

**BE (nové):** `backend/src/modules/analytics/{analytics.module,analytics.controller,analytics.service,analytics.service.spec}.ts`, `dto/{pageview.dto,analytics-summary.dto}.ts`, `schemas/analytics-event.schema.ts` · **BE (změna):** `app.module.ts` (registrace).
**FE (nové):** `src/shared/analytics/usePageViewPing.ts`, `src/features/admin/components/AnalyticsSection/{AnalyticsSection.tsx,MiniBarChart.tsx,*.module.css}`, `src/features/admin/api/{useAnalyticsSummary.ts,analytics.types.ts}` · **FE (změna):** `OverviewTab.tsx` (sekce), `adminKeys.ts` (`analytics` key), root layout (mount `usePageViewPing`).
**Prerender (změna):** `prerender/index.js` (UA marker).
**nginx:** beze změny (bot regex zůstává; BE má vlastní kopii).
**Docs po implementaci:** `roadmap2.md` (zaškrtnout 15B.7), `docs/funkce/` (inventura), `napoveda` (pokud relevantní pro hráče — spíš ne, admin nástroj).
