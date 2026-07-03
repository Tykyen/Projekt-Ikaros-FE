# Plán 16.2h — Bestie: motivové vzhledy karty

> Ke spec [`spec-16.2h-bestie-motiv-vzhledy.md`](spec-16.2h-bestie-motiv-vzhledy.md). Čeká na potvrzení plánu → pak kód.
> **Pravidla:** BE a FE NEmíchat v jedné dávce (`feedback_no_mixed_be_fe_batch`); po BE změně restart (`feedback_be_restart_required`); FE ověřovat ručně; commituje uživatel.

---

## K1 — PILOT (dark-fantasy end-to-end)
> **Stav 2026-07-03:** K1a (BE) + K1b (FE) **kód hotový**, build+lint+testy zelené.
> K1c (naživo render) **čeká na deploy** (BE restart kvůli `description`) + user-test.

### K1a · BE: pole `description` (samostatná dávka)
Repo: `Projekt-ikaros/backend/src/modules/bestiae/`. Postup od `toEntity` (`project_be_field_checklist`):
1. `repositories/bestiae.repository.ts` — `toEntity` mapper: přidat `description: doc.description ?? ''`.
2. `schemas/bestie.schema.ts` — `@Prop({ default: '' }) description: string`.
3. `interfaces/bestie.interface.ts` — `description: string`.
4. `dto/create-bestie.dto.ts` + `dto/update-bestie.dto.ts` — `@IsString() @IsOptional() description?: string`.
5. Ověřit `bestiae.service.ts` (create/update) že pole projde (spread DTO), případně explicitně.
6. **BE restart** + rychlý smoke (create/update bestie s description vrací pole).

### K1b · FE: typ + komponenta + skin (samostatná dávka)
1. **Typ** `src/features/world/bestiar/types.ts` — `Bestie` + `description: string`.
2. **`BestieCard.tsx`** — přepsat na univerzální motiv-aware:
   - Odstranit switch na Drd16/Fate (přijde v K4; v K1 nechat, ale generic větev = nová karta).
   - Skeleton **sbaleno**: `data-bestie-card` (stabilní selektor pro skiny) + portrét (fallback iniciála/silueta) · jméno · kind (volitelně: četnost ze schématu, jinak nic) · popis (`bestie.description`, `-webkit-line-clamp:2`) · akce · chevron (`aria-expanded`).
   - **Disclosure:** `useState(open)`; klik na hlavičku/chevron toggluje; `[data-open]`.
   - **Rozbaleno:** `<BestieDetail>`.
3. **`BestieDetail.tsx`** (nový, read-only):
   - Vstup: `schema`, `systemStats`, `description`, `notes`, `canSeeNotes` (role ≥ PJ).
   - Render sekcí: **Popis** (description + dropcap) → **Boj** (HP bar z pole `combatBehavior:'damageable'` + armor/immunity) → pak iterace `schema.sections` (Útoky list → tabulka, ostatní number/string/enum → dlaždice/řádky) → **Poznámky** (notes, jen když `canSeeNotes`).
   - **Skrývat prázdná/nulová pole.**
4. **CSS:**
   - `BestieCard.module.css` — skeleton, jen `--theme-*` tokeny (žádné hardcoded barvy).
   - `bestieSkins.css` (nový, globální import) — motiv-skiny scoped `[data-theme='dark-fantasy'] [data-bestie-card] { … }` (tvar hexagon pečeť, pentagram sigil, vyryté dlaždice — clip-path + data-URI SVG). V K1 jen dark-fantasy blok.
5. **`BestieEditorModal.tsx`** — přidat pole **Popis** (`description` textarea) oddělené od **Poznámky (jen PJ)** (`notes`). Uložit v create/update payloadu.
6. **Render-ověření naživo** (Svět vil = drdplus, dark-fantasy motiv): sbaleno, rozbaleno, popis, poznámky-gate, editace. Screenshoty desktop + mobil.

### K1c · brána pilotu
Ověřit, že architektura sedí (schema→detail funguje na drdplus, skin drží, popis ukládá). Teprve pak K2+.

---

## K2 — Ověření napříč systémy
Otevřít 2–3 světy s jinými systémy (matrix, dnd5e, shadowrun) v dark-fantasy motivu → zkontrolovat, že `BestieDetail` správně vykreslí jejich schémata (jiná pole). Doladit read-renderer (typy polí, útoky vs. seznamy).

## K3 — Zbylých 11 motiv-skinů
Po dávkách (2–3 motivy / dávka) přidat CSS bloky do `bestieSkins.css` dle `docs/bestiar-motivy.md`. Render-ověření každého (**cache-bust `?v=N`**, unikátní třídy). Animované (matrix rain Ikaros, kola Steampunk) → lehká JS/ornament vrstva v `BestieCard` řízená `data-theme` (jen tyto dva).

## K4 — Odstranit staré karty
Smazat `Drd16BestieCard(.module.css)`, `FateBestieCard(.module.css)` + reference v `BestieCard.tsx`/`BestiarPage`. Ověřit drd16/fate/fae světy (jedou přes univerzální kartu). `Drd16BestieForm` v modalu zvážit (edit form drd16 — nechat, řeší jen editaci, ne kartu).

## K5 — Uzávěr
`mobil-desktop` na kartě i detailu; `funkce` (nové pole popis, rozbalovací detail, motivový vzhled karty, viditelnost poznámek PJ) + `napoveda` (hráčský výtah); `dluhy.md` uzavřít co padlo; commit (uživatel).

---

## Rizika / pasti
- **Module-hash vs. scoped skiny:** karta nese stabilní `data-bestie-card`; skiny scopují přes něj (ne přes hash třídy).
- **Ornament SVG:** preferovat CSS `background`/`mask` data-URI; JS vrstva jen pro animace.
- **BE restart** nutný, jinak `description` tiše mizí (`feedback_be_restart_required`).
- **Konflikt s `data-diary-skin`:** bestiář jede na `data-theme`; ověřit, že se nebijí.
