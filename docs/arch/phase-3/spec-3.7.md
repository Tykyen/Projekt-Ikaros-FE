# Spec 3.7 — Oblíbené: globální obsah (články / diskuze / obrázky)

**Status:** ✅ Hotovo 2026-05-16
**Rozsah:** BE (User schéma + 3 moduly) **+** FE (typy, hooky, UI, sidebar, nová stránka) — větší
**Repo:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE`. Commity přímo do `main` v obou (konvence 3.x).
**Velikost:** odhad BE ~10–12 souborů / ~220 ř., FE ~14–16 souborů / ~420 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-16
**Souvisí:** spec-3.2 (Články), spec-3.3 (Galerie), spec-3.4 (Diskuze — favorites diskuzí zčásti hotové).

---

## 1. Cíl

Sjednotit featuru „oblíbené" napříč veškerým globálním (Ikaros) obsahem — **články,
diskuze, obrázky**. Uživatel si jakoukoli položku označí záložkou. Svoje oblíbené
spravuje na dedikované stránce `/ikaros/oblibene` a vybrané (**připnuté**) vidí
v pravém panelu `IkarosLayout`, který dnes má jen prázdné placeholdery.

---

## 2. Kontext / motivace

- Pravý panel `IkarosLayout` má sekce-placeholdery **„Oblíbené články"** a **„Oblíbené
  obrázky"** ([IkarosLayout.tsx:290-300](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L290-L300))
  — obě jen `„Žádné oblíbené"`. Sekce „Oblíbené diskuze" zatím **chybí úplně**.
- Diskuze už favorites mají zčásti hotové (viz §3). 3.7 dořeší zbylé dva typy,
  sjednotí model, naplní sidebar a doplní vrstvu **připnutí**.
- Oblíbené = osobní bookmark, čistě per-user. Nemá dopad na řazení, viditelnost
  ani moderaci obsahu.

⚠️ **Oblíbené ≠ hodnocení.** „Oblíbené" je binární soukromá záložka (mám / nemám,
vidí jen vlastník). **Hodnocení** (`POST /:id/rate`, komponenta `RatingInline`) je
veřejná známka, která se **průměruje** přes všechny uživatele — to už články i
galerie mají z fází 3.2/3.3 a 3.7 se ho nedotýká. Aby se obě věci nepletly,
oblíbené dostane ikonu **záložky** (`Bookmark`), hvězda zůstává vyhrazená ratingu.

### 2.1 Dvě vrstvy: oblíbené vs. připnuté

| | **Oblíbené** (favorite) | **Připnuté** (pinned) |
|---|---|---|
| Co je | celá kolekce záložek uživatele | ručně vybraná podmnožina oblíbených |
| Kde se zobrazí | stránka `/ikaros/oblibene` (všechno) | pravý panel sidebar (max 5 / typ) |
| Jak se nastaví | ikona záložky na detailu / kartě | pin toggle na stránce Oblíbené |
| Omezení | bez limitu | **max 5 na typ obsahu** |
| Závislost | — | připnout lze **jen oblíbenou** položku |

Připnutí je nadstavba: každá připnutá položka je vždy zároveň oblíbená. Odebrání
z oblíbených automaticky odepne (BE cascade).

---

## 3. Audit současného stavu

### 3.1 Diskuze — favorites zčásti hotové (referenční vzor)

| Prvek | Stav |
|---|---|
| `User.favoriteDiscussionIds: string[]` | ✅ [user.schema.ts:39](BE), [user.interface.ts:49](BE) |
| `POST /ikaros-discussions/:id/toggle-favorite` → `{ isFavorite }` | ✅ controller ř. 140 |
| `GET /ikaros-discussions/my-favorites` → `IkarosDiscussion[]` | ✅ controller ř. 60 |
| FE hook `useToggleFavoriteDiscussion` | ✅ [useDiscussions.ts:139](../../../src/features/ikaros/api/useDiscussions.ts#L139) |
| FE záložka na **detailu** (dnes `Star`) | ✅ [DiscussionDetailPage.tsx:151-167](../../../src/features/ikaros/pages/DiscussionDetailPage.tsx#L151-L167) |
| `User.pinnedDiscussionIds` + `toggle-pin` endpoint | ❌ chybí |
| FE sidebar sekce „Oblíbené diskuze" | ❌ chybí |
| FE hook „moje oblíbené diskuze" (`GET /my-favorites`) | ❌ endpoint není napojen |

→ U diskuzí zbývá: **BE** připnutí (pole + endpoint) + **FE** (hook, sidebar,
refactor záložky `Star`→`Bookmark`). Roadmapa byla neaktuální (psala „napojit
hvězdičku" — favorite hvězdička už napojená je).

### 3.2 Články — favorites CHYBÍ KOMPLETNĚ

- BE: `ikaros-articles` modul nemá favorites/pin, `User` nemá `favoriteArticleIds`.
  Existuje jen `rate` / `mark-read`.
- FE: `useArticles.ts` nemá favorite hook; [ArticlesPage.tsx:252-327](../../../src/features/ikaros/pages/ArticlesPage.tsx#L252-L327)
  (`ArticleCard`) ani `ArticleDetailPage.tsx` nemají záložku.

### 3.3 Galerie — favorites CHYBÍ KOMPLETNĚ

- BE: `ikaros-gallery` modul nemá favorites/pin, `User` nemá `favoriteGalleryIds`.
- FE: `useGallery.ts` bez favorite hooku; `GalleryCard.tsx` ani `GalleryDetailPage.tsx`
  nemají záložku.

---

## 4. Rozhodnutí autora (2026-05-16, brainstorming)

1. ✅ **Datový model = pole `*Ids`** na `User` — žádné sjednocené `favorites[]`.
   `favoriteDiscussionIds` už je; přibude `favoriteArticleIds`, `favoriteGalleryIds`
   a tři `pinned*Ids`. Konzistentní s hotovým modelem diskuzí, nulová migrace.
2. ✅ **Endpoint pattern = `toggle-*`** — `POST /:id/toggle-favorite` →
   `{ isFavorite }`, `POST /:id/toggle-pin` → `{ isPinned }`, `GET /my-favorites`.
3. ✅ **Rozsah = všechny tři typy** + připnutí + stránka Oblíbené, v jednom kroku.
4. ✅ **Ikona oblíbených = `Bookmark`** (záložka), ne hvězda — hvězda kolidovala
   s rating hvězdičkami na kartách. Diskuze se ze `Star` překlopí na `Bookmark`.
5. ✅ **`DiscussionDetailPage` se refaktoruje** na sdílenou `<FavoriteToggle>`.
6. ✅ **Připnutí** — sidebar zobrazuje ručně připnuté položky, **max 5 na typ**.
   Ikona připnutí = `Pin` (lucide), spravuje se na stránce Oblíbené.
7. ✅ **Sidebar fallback** — když uživatel v dané sekci nemá **nic připnuto**,
   sidebar zobrazí **5 nejnovějších oblíbených** daného typu (aby panel nebyl
   prázdný, dokud uživatel pinování neobjeví). Jakmile něco připne, fallback se
   vypne a zobrazí se výhradně připnuté. *(Viz §10 — k potvrzení.)*

---

## 5. Návrh řešení

### 5.1 BE — User schéma

Do `user.schema.ts` + `user.interface.ts` přidat (vedle `favoriteDiscussionIds`):

```ts
@Prop({ type: [String], default: [] }) favoriteArticleIds: string[];
@Prop({ type: [String], default: [] }) favoriteGalleryIds: string[];
@Prop({ type: [String], default: [] }) pinnedDiscussionIds: string[];
@Prop({ type: [String], default: [] }) pinnedArticleIds: string[];
@Prop({ type: [String], default: [] }) pinnedGalleryIds: string[];
```

`default: []` → žádná data-migrace.
⚠️ Ověřit `users.repository.toEntity` — musí všech 5 polí propsat (dluh z 3.5:
`toEntity` historicky zahazoval pole). Bez toho favorites/pin tiše nefungují.

### 5.2 BE — modul `ikaros-articles`

Zrcadlově dle `ikaros-discussions`:

- `POST /ikaros-articles/:id/toggle-favorite` → přidá/odebere `id` v
  `favoriteArticleIds`, vrátí `{ isFavorite: boolean }`.
  **Cascade:** při odebrání z favorites odebrat `id` i z `pinnedArticleIds`.
- `POST /ikaros-articles/:id/toggle-pin` → přidá/odebere `id` v `pinnedArticleIds`,
  vrátí `{ isPinned: boolean }`.
  - **Guard 1:** připnout lze jen `id`, které je v `favoriteArticleIds` → jinak `409`.
  - **Guard 2:** max 5 v `pinnedArticleIds`; při pokusu o 6. → `409` s hláškou.
- `GET /ikaros-articles/my-favorites` → `IkarosArticle[]` pro `favoriteArticleIds`.
- Vše `@UseGuards(JwtAuthGuard)` — jen přihlášený, žádné role gating.
- `toggle-*` na neexistující článek → `404`.

### 5.3 BE — modul `ikaros-gallery`

Analogicky: `toggle-favorite`, `toggle-pin`, `my-favorites` nad `*GalleryIds`.

### 5.4 BE — modul `ikaros-discussions` (doplnění)

`toggle-favorite` + `my-favorites` už existují. Doplnit:

- `POST /ikaros-discussions/:id/toggle-pin` → `{ isPinned }`, stejné dva guardy.
- Cascade odepnutí do `toggleFavorite` (dnes neřeší pinned, protože pinned nebyl).

### 5.5 FE — typy

`shared/types`: rozšířit `User` o `favoriteArticleIds?`, `favoriteGalleryIds?`,
`pinnedDiscussionIds?`, `pinnedArticleIds?`, `pinnedGalleryIds?` (vše `string[]`).
Návratové tvary `ToggleFavoriteResponse = { isFavorite: boolean }`,
`TogglePinResponse = { isPinned: boolean }`.

### 5.6 FE — hooky

Per-modul, konzistentní s `useDiscussions`:

- `useArticles.ts` → `useToggleFavoriteArticle()`, `useTogglePinArticle()`,
  `useMyFavoriteArticles()`.
- `useGallery.ts` → `useToggleFavoriteGallery()`, `useTogglePinGallery()`,
  `useMyFavoriteGallery()`.
- `useDiscussions.ts` → `useTogglePinDiscussion()`, `useMyFavoriteDiscussions()`
  (toggle-favorite hook už je).

Query klíče: `['articles','favorites']` atd. Toggle-favorite/pin mutace
invaliduje příslušný `favorites` klíč **i** `['auth','me']` (pinned ids jsou na
`User`) → sidebar i stránka se obnoví. `staleTime` ~20 s.
Připnutí přes `409` (limit/ne-favorite) → mutace zachytí a zobrazí `toast.error`
s konkrétní hláškou; FE limit nehlídá sám (single source of truth = BE).

### 5.7 FE — sdílená komponenta `<FavoriteToggle>`

Dnes je favorite tlačítko **inline** v `DiscussionDetailPage`. Pro tři typy zavést
sdílenou komponentu:

```
<FavoriteToggle isFavorite={bool} onToggle={fn} pending={bool} variant="button" | "icon" />
```

- `variant="button"` — ikona + text „Oblíbené" (detailové stránky).
- `variant="icon"` — jen ikona, kompaktní (karty / dlaždice galerie).
- Ikona `Bookmark` (lucide) — vyplněná (`fill`) když `isFavorite`, obrysová když
  ne. `aria-pressed`. **Ne `Star`** — hvězda patří ratingu (§2).
- `DiscussionDetailPage` se refaktoruje na tuto komponentu (přejde `Star`→`Bookmark`).

Umístění záložky:

| Typ | Detail | Karta / dlaždice v seznamu |
|---|---|---|
| Článek | ✅ `variant="button"` | ✅ `variant="icon"` v `ArticleCard` |
| Obrázek | ✅ `variant="button"` v lightboxu/detailu | ✅ `variant="icon"` v `GalleryCard` |
| Diskuze | ✅ (refactor stávající) | ❌ diskuze kartu dnes nemají, nepřidáváme |

### 5.8 FE — sidebar `IkarosLayout`

Pravý panel, sekce „Oblíbené" — zobrazuje **připnuté** (s fallbackem dle §4.7):

- **„Oblíbené diskuze"** — nová sekce mezi „Moje diskuze" a „Oblíbené články".
- **„Oblíbené články"**, **„Oblíbené obrázky"** — naplnit reálnými daty.
- Zdroj dat: `useMyFavorite*()` → FE vyfiltruje podle `User.pinned*Ids`; když je
  prázdné, fallback = prvních 5 nejnovějších oblíbených.
- `data-section-key`: `oblibene-diskuze`, `oblibene-clanky`, `oblibene-obrazky`.
- Položka = odkaz na detail (články/diskuze) / malý náhled (obrázky). Max 5.
- Pod nimi **„Zobrazit vše →"** na `/ikaros/oblibene?typ=<diskuze|clanky|obrazky>`
  — vzor `showAllLink` ([IkarosLayout.tsx:277](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L277)),
  zobrazí se jen když je oblíbených > 0.
- Anonym: sekce se nevolají / nezobrazí (hook gate `!!currentUser`, vzor 3.8).
- Prázdný stav (žádné oblíbené): `s.emptyHint` „Žádné oblíbené".

### 5.9 FE — stránka „Moje oblíbené" (`/ikaros/oblibene`)

Dedikovaná stránka se všemi záložkami uživatele + správa připnutí.

- Route `/ikaros/oblibene` uvnitř `IkarosLayout`, jen pro přihlášené.
- **3 taby** — Diskuze / Články / Obrázky; aktivní tab v URL `?typ=clanky`
  (vzor `?sekce=` z `HelpPage`, `?slozka=` z pošty). Neznámý `typ` → fallback
  na default tab. Back/forward funguje.
- Obsah tabu = mřížka **jednotných karet** `FavoriteCard` (sdílená v rámci
  stránky). *Odchylka od původního návrhu „reuse `ArticleCard`/`GalleryCard`/
  karta diskuze" (implementace 2026-05-16): tři existující karty jsou
  neexportované, mají nesourodou strukturu (`<li>` vs `<Link>` vs `<button>`)
  a každá vlastní `categories` závislost — jednotná `FavoriteCard` dala čistší
  kód i konzistentní vzhled stránky Oblíbené.*
- Každá karta má **pin toggle** (ikona `Pin`): připnuté zvýrazněné. Při dosažení
  limitu 5 v daném tabu jsou nepřipnuté pin ikony `disabled` + tooltip
  „Připnout lze max 5 — nejdřív něco odepni". (Limit reálně enforcuje BE `409`.)
- Data: tytéž `useMyFavorite*` hooky jako sidebar (sdílená query cache, žádný
  extra fetch).
- Prázdný tab: `„V oblíbených zatím nic nemáš"`.

⚠️ Nová stránka → po dokončení spustit skill **`napoveda`** (sekce „Stránky" +
role/přístup v `/ikaros/napoveda`).

### 5.10 Vizuál

- `Bookmark` (oblíbené) — `fill` ve stavu oblíbené; `Pin` (připnuté) — `fill` /
  rotace ve stavu připnuto. Barvy z `var(--accent)` / `var(--text-*)`. Žádné nové
  theme tokeny, žádné hardcoded barvy (`lint:colors`). Drží 21 motivů.
- Sidebar položky reuse `s.navItem` / `s.navList` / `s.emptyHint` / `showAllLink`.
- `<FavoriteToggle>` a pin UI mají vlastní `.module.css`.

### 5.11 Mobil / desktop

- Pravý panel je na mobilu drawer — sekce Oblíbené tam fungují stejně.
- `variant="icon"` na kartě a pin ikona nesmí překrývat klikací plochu karty
  (overlay roh, `stopPropagation`).
- Stránka `/ikaros/oblibene`: taby + responzivní mřížka (reuse breakpointů
  z `ArticlesPage` / galerie).
- Po implementaci **`mobil-desktop` audit** pro sidebar, karty i novou stránku.

### 5.12 Soubory

**BE (`Projekt-ikaros`):**
```
backend/src/modules/users/schemas/user.schema.ts          # + 5 polí
backend/src/modules/users/interfaces/user.interface.ts    # + 5 polí
backend/src/modules/users/users.repository.ts             # ověřit toEntity propsání
backend/src/modules/ikaros-articles/{controller,service}.ts   # toggle-favorite/pin, my-favorites
backend/src/modules/ikaros-gallery/{controller,service}.ts    # toggle-favorite/pin, my-favorites
backend/src/modules/ikaros-discussions/{controller,service}.ts # + toggle-pin, cascade
+ *.spec.ts pro všechny tři moduly (toggle/pin/limit/cascade)
```

**FE (`Projekt-ikaros-FE`):**
```
src/shared/types/index.ts                                 # User + favorite/pinned pole
src/features/ikaros/api/useArticles.ts                    # + favorite/pin/my-favorites
src/features/ikaros/api/useGallery.ts                     # + favorite/pin/my-favorites
src/features/ikaros/api/useDiscussions.ts                 # + pin/my-favorites
src/features/ikaros/components/FavoriteToggle.tsx (+.module.css)  # NOVÁ
src/features/ikaros/components/PinToggle.tsx (+.module.css)       # NOVÁ
src/features/ikaros/pages/ArticleDetailPage.tsx
src/features/ikaros/pages/ArticlesPage.tsx                # ArticleCard
src/features/ikaros/pages/GalleryDetailPage.tsx
src/features/ikaros/components/GalleryCard.tsx
src/features/ikaros/pages/DiscussionDetailPage.tsx        # refactor na FavoriteToggle
src/features/ikaros/pages/FavoritesPage.tsx (+.module.css)  # NOVÁ /ikaros/oblibene
src/app/layout/IkarosLayout/IkarosLayout.tsx              # 3 sidebar sekce + showAllLink
src/app/router/*                                          # route /ikaros/oblibene
+ *.spec.tsx pro FavoriteToggle, PinToggle, FavoritesPage, klíčové hooky
```

---

## 6. Out of scope

- **Sjednocené `favorites[]` pole** — vědomě zamítnuto (§4.1).
- **Oblíbené ve světovém obsahu** (wiki stránky, postavy) — jiná fáze (7.x).
- **Záložka na kartě diskuze** — diskuze list ponecháme beze změny.
- **Drag & drop řazení připnutých** — pořadí = pořadí připnutí, bez přesouvání.
- **Notifikace / real-time** sync napříč zařízeními — invalidace query stačí.
- **Cleanup osiřelých favorite/pinned id** po smazání obsahu — `my-favorites`
  filtruje na existující obsah, osiřelé id se tiše vynechá (viz §8).

---

## 7. Acceptance kritéria

1. `User` má 5 polí `favorite*Ids` / `pinned*Ids` (default `[]`).
2. `toggle-favorite` přepíná stav a vrací `{ isFavorite }`; odebrání z favorites
   položku zároveň odepne (cascade).
3. `toggle-pin` přepíná stav a vrací `{ isPinned }`; připnout lze jen oblíbenou
   položku (`409` jinak); 6. připnutí v rámci typu → `409`.
4. `GET .../my-favorites` vrací pole obsahu; endpointy vyžadují přihlášení (401).
5. Záložka na detailu článku, obrázku i diskuze — klik přepne stav, ikona reaguje.
6. Záložka `variant="icon"` na kartě článku a dlaždici galerie; klik nepropadne
   do otevření detailu.
7. Sidebar zobrazí připnuté položky (max 5/typ); bez připnutých → fallback 5
   nejnovějších oblíbených; bez oblíbených → „Žádné oblíbené".
8. „Zobrazit vše →" vede na `/ikaros/oblibene` na správný tab.
9. Stránka `/ikaros/oblibene` — 3 taby, `?typ=` v URL, mřížka karet, pin toggle;
   nad limitem 5 jsou nepřipnuté pin ikony disabled.
10. Po toggle favorite/pin se sidebar i stránka obnoví bez reloadu.
11. Anonym sidebar sekce Oblíbené nevidí; `/ikaros/oblibene` ho přesměruje na login.
12. `DiscussionDetailPage` po refaktoru funguje stejně jako dřív.
13. Žádné hardcoded barvy, drží ve 21 motivech; mobil ≤ 768 px OK.
14. BE `npm test`, FE `lint` / `lint:colors` / `test:run` / `build` / `tsc` projdou.

---

## 8. Riziko & rollback

| Riziko | Pravděp. | Mitigace |
|---|---|---|
| `users.repository.toEntity` zahodí nová pole (dluh z 3.5) | Střední | Explicitně ověřit + test, že všech 5 polí projde |
| Osiřelé favorite/pinned id po smazání obsahu | Střední | `my-favorites` filtruje na existující obsah; osiřelé id se tiše vynechá |
| Refactor `DiscussionDetailPage` rozbije hotovou favorite logiku | Nízká | Regresní test diskuzí; refactor je extrakce UI, API beze změny |
| Záložka/pin na kartě překryje klik do detailu | Nízká | `stopPropagation`, `mobil-desktop` audit |
| Race: dvě záložky/zařízení překročí limit 5 pinů | Nízká | BE počítá délku pole atomicky při zápisu → `409` |

**Rollback:** FE — odebrat komponenty z míst nasazení, sidebar zpět na placeholdery,
route smazat. BE — pole jsou aditivní (`default []`), endpointy lze ponechat. Bezpečné.

---

## 9. Test plán

**BE:** `ikaros-articles` / `ikaros-gallery` / `ikaros-discussions` `*.spec.ts` —
`toggleFavorite` přidá/odebere id + cascade odepnutí; `togglePin` guardy
(ne-favorite → 409, 6. pin → 409); `findMyFavorites` vrací jen existující obsah;
404 na neexist. id.

**FE:** `FavoriteToggle.spec.tsx` / `PinToggle.spec.tsx` — render variant,
stav ↔ fill, `pending`/`disabled`, `onToggle`. `FavoritesPage.spec.tsx` — taby,
`?typ=` sync, fallback, prázdný stav. Hook testy — invalidace po toggle.
`IkarosLayout` — sidebar render připnutých / fallback / prázdný stav.
`lint`, `lint:colors`, `test:run`, `build`.

**Manuální smoke:** označit obsah záložkou → naskočí na stránce Oblíbené →
připnout → naskočí v sidebaru; připnout 6. → toast chyba; odebrat z oblíbených →
zmizí ze sidebaru i stránky; smazat oblíbený obsah → bez chyby; mobil 360 px.

---

## 10. Otevřené otázky k potvrzení při schválení

1. ~~Refactor `DiscussionDetailPage`~~ — rozhodnuto §4.5, ano.
2. ~~Ikona favorite~~ — rozhodnuto §4.4, `Bookmark`.
3. ~~Limit / připnutí~~ — rozhodnuto §4.6, max 5/typ, ručně.
4. ~~Sidebar fallback (§4.7)~~ — potvrzeno 2026-05-16: fallback ANO (5 nejnovějších
   oblíbených, dokud uživatel nic nepřipne).
