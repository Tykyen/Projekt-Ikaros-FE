# Spec 13.1 — Vyhledávání (per-world)

> Stav: **implementováno 2026-06-03**. Per-world search + infrastruktura
> (MeiliSearch) + access kontrola + admin monitoring (13.1c). Globální search
> v `IkarosLayout` zůstává jako roadmap feature 13.1a (BE je už bezpečný) — viz §6.

## 0. Infrastruktura (doplněno při zprovoznění)

> ⚠️ **Oprava routy:** `SearchController`/`StatsController` měly (z portu Matrixu)
> `@Controller('api/search')` / `@Controller('api/stats')`, ale globální prefix
> je už `api` → routy byly `/api/api/search` (FE volal `/api/search` → 404 →
> „Nic nenalezeno"). Opraveno na `@Controller('search')` / `@Controller('stats')`.

- **MeiliSearch** (fulltext provider) přidán do `docker-compose.yml` (služba
  `meilisearch`, port 7700, `MEILI_ENV=development`). Bez něj search vracel
  prázdno (`meili.search` má `catch → []`). BE `onModuleInit` index auto-rebuildne
  ze všech stránek (`rebuildIndex → findAll`).
- Embedding provider (ONNX granite-107/278) funguje paralelně; modely v
  `backend/data/model_cache`.
- **Access kontrola (BE):** `GET /api/search` vyžaduje `worldId` (jinak 400) +
  `worldsService.findByIdForRequester` (404 u cizího privátního světa). Mutační
  endpointy `search/created|updated|deleted|reindex|rebuild` a celý `stats` modul
  mají `AdminGuard`.

## 1. Cíl

Funkční vyhledávání **stránek (wiki) v rámci jednoho světa**. Nahrazuje statický
`<div>Hledat...</div>` v hlavičce světa funkčním vyhledávacím polem + modalem
s výsledky. Vychází ze staré implementace Matrixu (`SearchBar.tsx`,
`useSearchProviders.ts`, `service.search`), portované na náš stack.

## 2. BE kontrakt (hotový, beze změny)

- `GET /api/search?q=&count=&provider=&worldId=` → `SearchResult[]`
  - `SearchResult = { id, title, slug, score, providerKey, providerName }`
  - **Když je `worldId`** → BE filtruje výsledky jen na stránky daného světa
    (`pagesRepo.findByWorld` → whitelist slugů). To zajišťuje izolaci světů.
  - Vždy posíláme `worldId` (reálné ObjectId světa) → žádný leak mezi světy.
  - ⚠️ Param je **`q`** (ne `query` jako ve starém Matrixu).
- `GET /api/search/providers` → `SearchProviderInfo[] = { key, displayName }[]`

## 3. UX

- **Spouštění:** klik na pole „Hledat…" v hlavičce světa **nebo** zkratka
  `Ctrl+K` / `Cmd+K` (jen v kontextu světa) → otevře **modal**.
  - Volba modalu (ne dropdown): funguje identicky na mobilu i desktopu, hlavička
    světa je úzká a plná akcí. Roadmapa povoluje „modal / dropdown".
- **Modal:**
  - Vyhledávací `input` s autofocusem.
  - Debounce **300 ms** → volá search. Prázdný dotaz = žádné volání, žádné výsledky.
  - Seznam výsledků: název stránky + skóre (decentně). Bez výsledků → „Nic nenalezeno".
  - Provider = vždy `combined` (fulltext + sémantika). **Selektor provideru
    odstraněn** (2026-06-03) — „Combined / MeiliSearch / Granite Embedding" je
    technický žargon, hráč by nevěděl co zvolit. Stejně tak skóre se hráči
    nezobrazuje (jen název stránky; relevanci nese pořadí).
  - Klik na výsledek / `Enter` na zvýrazněném → navigace na stránku, modal se zavře.
  - `Esc` / klik na pozadí → zavřít.
  - Klávesy `↑`/`↓` posouvají zvýraznění (keyboard nav).
- **Navigace na výsledek:** na URL detailu wiki stránky světa (přesný tvar route
  ověřit v impl. plánu — `/svet/{worldSlug}/...{slug}`).

## 4. Architektura (FE)

Nový modul `src/features/world/search/`:

- `api/useWorldSearch.ts` — TanStack Query hook; klíč `['world-search', worldId, provider, q]`,
  `enabled` jen pro neprázdný `q`; volá `apiClient` na `/search`.
- `api/useSearchProviders.ts` — hook na `/search/providers` (cache, default resolve).
- `model/searchProviderAtom.ts` — jotai atom (persist volby provideru v sezení).
- `components/WorldSearchModal.tsx` + `.module.css` — modal s inputem, výsledky, selektorem.
- `WorldLayout` — stav `searchOpen`, `Ctrl+K` listener, statický div → tlačítko
  otevírající modal.

Typy: `SearchResult`, `SearchProviderInfo` v `src/features/world/search/types.ts`
(zrcadlí BE interface — žádné DTO drift).

## 5. Responsive (base.md)

- Pole „Hledat…" v hlavičce: na desktopu viditelné v `actions`; na mobilu se
  hlavička sbaluje do hamburgeru — modal se proto musí dát otevřít i z mobilu.
  Řešení: malé tlačítko/ikona lupy zůstává dostupná i v mobilním layoutu
  (detail v impl. plánu) + `Ctrl+K` na desktopu.
- Modal: full-width sheet na mobilu (≤768), centrovaný panel na desktopu.
- `mobil-desktop` audit po implementaci.

## 6. Mimo rozsah (vědomě)

- **Globální search v `IkarosLayout` (13.1a napříč platformou).** BE bez `worldId`
  vrací celý index **bez access kontroly** → leak názvů stránek z privátních
  světů. Vyžaduje BE access filtr; odloženo.
- **13.1c — admin index monitoring** (stav indexace, rebuild/reindex). Samostatný
  krok, napojení na admin hub (fáze 12) + `stats` modul.
- Indexace mimo `pages` (postavy, diskuze, články) — BE indexuje jen `pages`.

## 7. Akceptační kritéria

- [ ] V hlavičce světa funkční pole „Hledat…", otevírá modal (klik i `Ctrl+K`).
- [ ] Debounced dotaz vrací stránky **jen z aktuálního světa** (worldId filtr).
- [ ] Výběr provideru funguje, default Combined; skóre viditelné.
- [ ] Klik / Enter naviguje na stránku, modal zavře; Esc/pozadí zavře.
- [ ] Funguje na mobilu i desktopu (`mobil-desktop`).
- [ ] Žádný TS error (`tsc --noEmit`), vitest zelený.
