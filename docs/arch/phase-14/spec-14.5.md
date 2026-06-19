# Spec 14.5 — FE E2E smoke (Playwright)

> Fáze 14 · krok 14.5 · [A5 · dopad střední · náklad střední]
> Status: **✅ implementováno** (2026-06-19)

## ✅ Implementováno (2026-06-19)

Hotovo a ověřeno lokálně (`npm run test:e2e` → 1 passed; lint 0 errors; vitest sanity OK).
Soubory: [playwright.config.ts](../../../playwright.config.ts),
[e2e/smoke.spec.ts](../../../e2e/smoke.spec.ts),
[e2e/mock-api.ts](../../../e2e/mock-api.ts),
[e2e/fixtures.ts](../../../e2e/fixtures.ts);
job `frontend-e2e` v [ci.yml](../../../.github/workflows/ci.yml);
`data-testid="tactical-map-viewport"` v `TacticalMapView.tsx`;
`e2e/**` exclude v `vitest.config.ts`; scripty `test:e2e` / `test:e2e:ui`.

**Odchylky od návrhu (drobné):**
- Fixtures sloučeny do **jednoho** `e2e/fixtures.ts` (návrh měl `fixtures/{user,world,map}.ts`)
  — pro jeden smoke je víc souborů zbytečná režie.
- Přidán **jen 1** `data-testid` (`tactical-map-viewport`). Kartu světa řeší
  `a[href="/svet/:slug"]`, login je scopovaný do dialogu `getByLabel('Přihlášení')`
  (`Heslo` s `exact:true`, jinak matchne i toggle „Zobrazit heslo"). Karta ani login
  testid nepotřebovaly.
- Klíčová neznámá z návrhu vyřešena: `useWorldStatus` membership **nečte** dedikovaný
  endpoint, ale odvozuje ji z `GET /worlds/my` → mock membership a scéna drží přes
  společné `world.id`.
- PIXI `<canvas>` se v headless chromiu (Playwright Desktop Chrome) **reálně vyrenderoval**
  → nejhlubší assert drží, fallback na canvasWrapper nebyl potřeba.

---


## Kontext a zúžení rozsahu

Roadmapa 14.5 zní „FE CI brána + E2E smoke" a tvrdí „FE dnes jen deployuje, BE bránu má".
**To je zastaralé.** CI brána mezitím vznikla v [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)
(přidána při 16. auditu, fáze B1): build (`tsc -b` + vite) + lint + nav audit + vitest +
cross-repo kontraktní scannery + anti-regression guard, na každý push/PR na `main`.

Z 14.5 tedy reálně **chybí jediná věc: E2E smoke**. Playwright je nainstalovaný
(`@playwright/test`), ale není config, test ani CI job. Spec se zužuje na E2E.

## Cíl

Jeden Playwright happy-path test, který projde appkou jako uživatel:
**login → seznam světů → vstup do světa → otevření taktické mapy**, a ověří, že hlavní
cesta vůbec naběhne (žádný runtime crash). Běží jako **blokující** CI job na každý PR.

## Proč varianta C (FE-only s mockovaným BE)

Zvaženy tři architektury:

- **A) Plný stack v CI** — checkout BE (`Tykyen/Projekt-ikaros`, public) + Mongo replSet +
  seed scénář + FE preview. Nejvěrnější, ale pomalé, křehké, nutná verzní koordinace FE↔BE.
  Vysoká údržba pro sólo projekt.
- **B) Post-deploy smoke proti produkci** — jen „web naživu", ne happy-path; riziko mutace
  prod dat. Případně později jako doplněk do `deploy.yml`.
- **C) FE-only, mock BE přes Playwright network interception** — ✅ **zvoleno.**

**Důvod volby C:** cíl roadmapy je „jeden chybný commit může shodit web bez varování".
C přesně to chytá — rozbitý lazy chunk, router config, PIXI init crash mapy — runtime chyby,
které `tsc` ani unit testy nezachytí. Je rychlá (~30 s běh testu), deterministická (žádná
flaky závislost na BE/DB), běží na každý PR. FE↔BE kontraktní drift už hlídají cross-repo
scannery v `ci.yml`, takže C neřeší to, co je jinde pokryto. Věrnost varianty A je pro sólo
projekt vykoupená trvalou křehkostí; C dá většinu hodnoty za zlomek nákladů.

## Scénář (happy-path)

1. Anon přijde na `/`.
2. Otevře login (modal přes atom / `?openLogin=1`), vyplní identifier + heslo, odešle.
3. `POST /api/auth/login` → `{ status:'ok', accessToken, refreshToken, user }` (mock).
4. FE hydratuje uživatele: `GET /api/users/me` → `User` (mock).
5. Redirect na seznam světů `/ikaros/vesmiry`; `GET /api/worlds/my` → 1 svět (mock).
6. Klik na kartu světa → `/svet/:worldSlug`.
   `GET /api/worlds/slug/:slug` → `World`; `GET /api/worlds/:id/members`,
   `GET /api/worlds/:id/settings` → mock.
7. Přechod na mapu `/svet/:worldSlug/takticka-mapa` (route má `memberOnly()` guard).
8. `GET /api/maps/active?worldId=:id` → `MapScene` (mock).
9. Socket.IO: polling fallback → mapa se renderuje i bez WS upgrade (read-only).
10. **Assert:** map canvas (PixiJS) je v DOM a vidím očekávanou kotvu mapy. Test zelený =
    celá cesta naběhla bez crashe.

## Mock strategie

Playwright `page.route()` / `context.route()` zachytí `**/api/**` a vrátí JSON fixtures.
Endpointy k mocknutí (potvrzeno průzkumem kódu):

| Endpoint | Účel |
|---|---|
| `POST /api/auth/login` | `LoginOkResponse` (accessToken + refreshToken + user) |
| `GET /api/users/me` | hydratace přihlášeného uživatele |
| `GET /api/worlds/my` | seznam mých světů (≥1) |
| `GET /api/worlds/slug/:slug` | detail světa |
| `GET /api/worlds/:id/members` | členové (≥1) |
| `GET /api/worlds/:id/settings` | nastavení/menu světa |
| `GET /api/maps/active?worldId=:id` | aktivní scéna mapy |
| `socket.io` (polling) | necháme spadnout / prázdná odpověď — mapa to přežije |

**Klíčová data ve fixtures (jinak guard/redirect):**
- `membership.role ≥ 2 (Hrac)` a `membership.currentSceneId` nastavené → projde `memberOnly()`
  guard mapy a `/maps/active` vrátí scénu (ne `MAP_NO_ACTIVE_SCENE` → EmptyState).
- `accessToken` = libovolný neexpirovaný JWT-like string (FE ho jen ukládá do atomu;
  validaci dělá až BE, který je mockovaný). Refresh flow se tím nespustí.

## Soubory (návrh)

```
e2e/
  smoke.spec.ts            # happy-path test
  fixtures/
    user.ts               # User + LoginOkResponse
    world.ts              # World + membership + members + settings
    map.ts                # MapScene
  mock-api.ts             # helper: zaregistruje všechny page.route() handlery
playwright.config.ts       # testDir e2e, webServer vite preview, chromium, baseURL
```

- `playwright.config.ts`: `testDir: './e2e'`, `webServer` spustí `vite preview --port 4173`
  (build artefakt z CI), `baseURL: http://localhost:4173`, projekt jen **chromium**
  (1 prohlížeč stačí na smoke), `reporter` list + (CI) blob/HTML artefakt.

## CI integrace

Nový job `frontend-e2e` v existujícím [ci.yml](../../../.github/workflows/ci.yml)
(sdílí trigger push/PR na `main`):

```yaml
frontend-e2e:
  name: Frontend E2E smoke (Playwright)
  runs-on: ubuntu-latest
  timeout-minutes: 15
  steps:
    - checkout / setup-node 20 / npm ci
    - npx playwright install --with-deps chromium
    - npm run build                 # artefakt pro vite preview
    - npm run test:e2e              # playwright test (webServer = vite preview)
```

Nové npm scripty:
- `test:e2e` → `playwright test`
- `test:e2e:ui` → `playwright test --ui` (lokální ladění)

## Kolize vitest × playwright (povinný fix)

E2E testy jsou `e2e/*.spec.ts` a importují `@playwright/test`. Vitest default scrapuje
`**/*.spec.ts` → pokusil by se je spustit a spadl. Nutno v [vitest.config.ts](../../../vitest.config.ts)
přidat do `test.exclude` vzor `e2e/**` (se zachováním `configDefaults.exclude`, ať nezmizí
`node_modules`/`dist`). Symetricky `playwright.config.ts` má `testDir: './e2e'`, takže
playwright nesahá na unit testy.

## Selektory

Projekt nemá globální `data-testid` konvenci (jen lokální v kalendáři/RTE). Smoke pojede
primárně přes **role/text** (čeština). Kde je text nejednoznačný nebo křehký, přidá se
**minimální sada stabilních `data-testid` kotev** (max ~3): login submit, karta světa na
seznamu, wrapper map canvasu. Přidání kotvy = drobný dotek prod komponenty, vždy jen
`data-testid`, žádná změna chování.

## Otevřené otázky (zodpovězeno)

- **Blokovat merge, nebo varovat?** → **Blokovat.** C je deterministická, ne flaky, takže
  blokování nehrozí falešnými červenými. Brána má smysl jen když blokuje.
- **Každý push, nebo nightly?** → **Každý PR/push na `main`.** Běh ~30 s + install ~1 min;
  nightly se hodí pro drahé E2E (varianta A), ne pro tohle.

## Akceptační kritéria

1. `npm run test:e2e` lokálně projde zeleně (login → svět → mapa, map canvas v DOM).
2. `npm run test:run` (vitest) dál projde — e2e adresář vitest ignoruje (žádný nový fail).
3. `npm run build` + `npm run lint` čisté (žádné nové TS/lint chyby).
4. Job `frontend-e2e` přidán do `ci.yml`, blokující, na push/PR na `main`.
5. Roadmapa 14.5 zaškrtnuta + poznámka o zúžení rozsahu (CI brána už existovala).

## Mimo rozsah (vědomě)

- Plný stack / reálný BE (varianta A) — nepoměr náklad/údržba pro sólo projekt.
- Post-deploy prod smoke (varianta B) — případný pozdější follow-up do `deploy.yml`.
- Více scénářů, více prohlížečů, vizuální regrese — smoke = jeden happy-path.
- FE pre-commit hook — roadmapa „volitelně"; FE bez prettieru (`feedback_fe_no_prettier`),
  necháváme na CI.
