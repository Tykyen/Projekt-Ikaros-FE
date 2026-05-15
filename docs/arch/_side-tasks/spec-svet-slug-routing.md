# Spec — `/svet/:slug` routing světů (slug místo ObjectId v URL)

**Status:** ✅ Hotovo (2026-05-15) — varianta A. Rozsah nakonec ~15 souborů
(spec podcenil: `useWorldStatus` potřebuje resolvnuté id, `WorldContext`
doplněn o `worldSlug`, víc generátorů odkazů). Přístup A beze změny.
**Rozsah:** FE — slug v URL světa, BE beze změny
**Repo:** `Projekt-ikaros-FE`, commit přímo do `main`
**Velikost:** odhad ~8–10 souborů / ~150 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-15

---

## 1. Cíl

URL světa má být `/svet/matrix` (čitelný slug) místo `/svet/69f5154fdb96c18758b1a038` (Mongo ObjectId). Platí pro všechny pod-stránky světa (`/svet/matrix/chat`, `/svet/matrix/postavy`, …).

---

## 2. Kontext / motivace

ObjectId v URL je nečitelné, nesdílitelné a vypadá neprofesionálně. Svět už má pole `slug` (`unique`, `lowercase`) — `matrix` pro svět Matrix. Stačí ho začít používat v routě.

**Proč ne změnit `_id` na `"matrix"`:** `_id` je v Mongu neměnné a slouží jako cizí klíč `worldId` napříč ~15 kolekcemi (memberships, pages, characters, chat, mapy, kalendáře, events…). Přepis `_id` = recreate dokumentu + kaskádová migrace všech referencí = vysoké riziko osiřelých dat. Slug routing tento problém celý obchází — `_id` zůstává, mění se jen co je v URL.

---

## 3. Audit současného stavu

- **Routing** — [router.tsx:184](../../../src/app/router.tsx#L184) parent `path: '/svet/:worldId'` + ~20 children. Hodnota `:worldId` segmentu = ObjectId.
- **Čtenáři `useParams`** — pouze **2 soubory**: [WorldLayout.tsx](../../../src/app/layout/WorldLayout/WorldLayout.tsx) (boundary — načítá svět) a [WorldDashboardPage.tsx](../../../src/features/world/pages/WorldDashboardPage/WorldDashboardPage.tsx). Ostatní místa dostávají `worldId` jako prop / z hooku (~24 souborů ho zmiňuje).
- **BE** — 11 controllerů má routy `worlds/:worldId/...`; očekávají ObjectId. [worlds.controller.ts:91](../../Projekt-ikaros/backend/src/modules/worlds/worlds.controller.ts#L91) **už má `GET /worlds/slug/:slug`** (`findBySlug`) i `GET /worlds/:id` (`findOne`).
- `WorldMembershipGuard` má `redirectTo="/svet/:worldId"`.

---

## 4. Návrh řešení — varianta A: slug-resolve na FE hranici

URL používá slug, ale **interně appka i BE dál jedou na ObjectId**. Slug se přeloží jednou, na vstupu do světové vrstvy.

### 4.1 Routing
- `router.tsx` — parent route `path: '/svet/:worldSlug'` (přejmenování segmentu). Children beze změny.

### 4.2 Resolve na hranici (`WorldLayout`)
- `WorldLayout` čte `useParams().worldSlug`.
- Načte svět: pokud je hodnota platný ObjectId → `GET /worlds/:id` (BC pro staré odkazy), jinak → `GET /worlds/slug/:slug`.
- Výsledný `world` (vč. reálného `id`) poskytne přes **React context** (`WorldContext`).
- Loading / 404 (svět neexistuje) řeší `WorldLayout` jako dosud.

### 4.3 Konzumace `worldId`
- Nový hook `useWorldId()` (čte `WorldContext`) — vrací **reálné ObjectId**.
- `WorldDashboardPage` a cokoliv dalšího, co dnes bere `worldId` z `useParams`, přejde na `useWorldId()`.
- **BE volání se nemění** — dostávají reálné ObjectId. Žádná změna BE, žádná změna 11 controllerů.

### 4.4 Odkazy na svět
- Generování odkazů (`<Link to={...}>`, navigace) — místo `world.id` použít `world.slug`.
- `WorldMembershipGuard` `redirectTo` — sladit se slugem.

### 4.5 Zpětná kompatibilita
- Staré URL `/svet/<ObjectId>` **fungují dál** — `WorldLayout` pozná ObjectId a načte podle id. Bookmarky se nerozbijí.

---

## 5. Zvažované alternativy (zamítnuto)

| Varianta | Proč ne |
|----------|---------|
| **B — BE přijme id-nebo-slug v `:worldId`** | Resolve logika v 11 controllerech (nebo centrální pipe/guard) — větší zásah do BE, vyšší riziko. Varianta A dosáhne téhož bez doteku BE. |
| **C — plné slug routing vč. BE cest** | `:worldId` → `:worldSlug` i v `/api/worlds/:worldSlug/...` všude — největší rozsah, BE i FE. Žádný přínos navíc oproti A. |
| **Změna `_id` na `"matrix"`** | `_id` neměnné + kaskádová migrace ~15 kolekcí. Nepřijatelné riziko. |

---

## 6. Acceptance kritéria

1. ✅ `/svet/matrix` i `/svet/matrix/chat` (a další pod-stránky) fungují.
2. ✅ Staré `/svet/<ObjectId>` odkazy stále fungují (BC).
3. ✅ Neexistující slug → stávající „svět nenalezen" stav.
4. ✅ Odkazy na svět napříč appkou míří na `/svet/<slug>`.
5. ✅ BE beze změny; všechna `/api/worlds/:worldId/...` volání dostávají reálné ObjectId.
6. ✅ FE testy zelené (vč. úpravy testů, co mockují `:worldId`).

---

## 7. Test plán

- `WorldLayout` — resolve slug → context (mock `GET /worlds/slug/:slug`); resolve ObjectId → context (BC větev); 404.
- `useWorldId` — vrací reálné id z contextu.
- `WorldDashboardPage` — čte id z contextu, ne z URL.
- Smoke: `/svet/matrix`, proklik do chatu, starý ObjectId odkaz.

---

## 8. Riziko & rollback

| Riziko | Mitigace |
|--------|----------|
| Místo čtoucí `useParams().worldId` se přehlédne | Jen 2 známí čtenáři; grep `worldSlug`/`worldId` po implementaci |
| Kolize slug vs ObjectId tvar | ObjectId má pevný tvar (24 hex) — detekce regexem spolehlivá |
| Staré odkazy | BC větev v `WorldLayout` (4.5) |

**Rollback:** revert commitu; routing je aditivní změna FE.

---

## 9. Otázka k autorovi

Doporučená je **varianta A** (FE-only, BE netknutý, využije existující `GET /worlds/slug/:slug`). Souhlasíš s A, nebo chceš jinou variantu?

---

**Po schválení napíšu implementační plán.**
