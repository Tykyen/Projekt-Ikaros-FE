# Spec 9.5 — Světové novinky — parita s 9.1 akcemi

**Status:** DRAFT — čeká na souhlas
**Velikost:** M (BE drobné rozšíření + FE refactor karty/modalu)
**Návaznost:** 9.1 game events (`9c28961`, `5a06a43`) — sjednotit vizuální jazyk

---

## 1 — Cíl

User: „Hele v případě novinek bych to chtěl stejně. Nadpis, obrázek, obsah, typ, datum kdy to bylo. Odkaz na stránku pokud to jde (stejně jako je tomu třeba u Page)."

Sjednotit světové novinky se stejným paternem jako game events:
- Hero obrázek 16:9 s focal point
- Karta s titulem, datem (precize countdown), excerpt, type chip, link na stránku
- Modal create/edit s upload + focal overlay + page picker (místo plain URL)
- Stránka `/svet/:slug/novinky` zachová toolbar (Aktivní/Archiv) a adminskou správu

---

## 2 — BE rozšíření

Module: `backend/src/modules/world-news/`

### 2.1 — `WorldNews` schema + interface

```ts
// schemas/world-news.schema.ts
@Prop({ default: null, type: String }) imageUrl: string | null;
@Prop({ default: null, type: Number }) imageFocalX: number | null;
@Prop({ default: null, type: Number }) imageFocalY: number | null;

// link — povýšit z plain string na structured ref:
@Prop({ default: null, type: String }) link: string | null;        // externí URL (legacy)
@Prop({ default: null, type: String }) linkPageSlug: string | null; // page-link reference
```

**Pozor — backward compat:** existující dokumenty mají `link` jako plain string nebo `undefined`. Migraci dat neděláme — frontend si poradí s oběma:
- `linkPageSlug !== null` → render link na `/svet/<slug>/<linkPageSlug>` (interní)
- `link !== null` && `linkPageSlug === null` → render plain `<a href={link}>` (externí, legacy)
- Oboje null → bez linku

### 2.2 — DTO

`create-world-news.dto.ts` + `update-world-news.dto.ts`:
```ts
@IsOptional() @IsString() @MaxLength(2048) @Matches(/^(https?:\/\/|\/)/) imageUrl?: string | null;
@IsOptional() @IsNumber() @Min(0) @Max(100) imageFocalX?: number;
@IsOptional() @IsNumber() @Min(0) @Max(100) imageFocalY?: number;
@IsOptional() @IsString() @MaxLength(120) linkPageSlug?: string | null;
```

(Update varianta s `ValidateIf` pro nullable focal — paralela s `update-game-event.dto.ts`.)

### 2.3 — Service + repo

`WorldNewsRepository.toEntity` mapping nových polí. Service `create`/`update` propaguje DTO → patch.

### 2.4 — Testy

- DTO accept focal 0/50/100 + reject -1/101
- Repo round-trip imageFocal + linkPageSlug
- Service create + update propaguje fields

---

## 3 — FE rozšíření typu

`shared/types/index.ts` — rozšířit `WorldNewsItem`:

```ts
export interface WorldNewsItem {
  // ... existující ...
  imageUrl?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  /** 9.5 — interní link na wiki stránku světa (priorita před `link`). */
  linkPageSlug?: string | null;
}
```

---

## 4 — Refactor `WorldNewsCard` → plnohodnotná karta

**Strategie:** copy-and-adapt z `GameEventCard` → nová `WorldNewsCard` (rename existující nebo přepis na místě).

### 4.1 — Layout

```
WorldNewsCard
  ├─ <media> (16:9, focal point)
  │   ├─ <img> nebo fallback ikona (typ-specifická: Bell pro info, AlertTriangle pro alert, Settings pro system)
  │   └─ kebab (PJ+) — Upravit / Archivovat / Smazat
  └─ <body>
       ├─ meta row: <TypeChip>, <DateChip relativeEventDate>, archivovaný stav?
       ├─ <h4 title>
       ├─ <p excerpt> (truncate 3 řádky, plainText z content)
       └─ link row (pokud je)
            ├─ linkPageSlug → <Link to={`/svet/${worldSlug}/${slug}`}>📄 {pageName} →</Link>
            └─ link (legacy) → <a href={link} target="_blank">🔗 Externí odkaz →</a>
```

### 4.2 — TypeChip (nová sdílená komponenta)

Lehčí varianta `GroupChip` ale pro `WorldNewsType`:

```ts
const TYPE_META: Record<WorldNewsType, { label: string; color: string; icon: ReactNode }> = {
  info:   { label: 'Informace', color: 'var(--accent)',  icon: <Info size={12} /> },
  alert:  { label: 'Důležité',  color: 'var(--danger)',  icon: <AlertTriangle size={12} /> },
  system: { label: 'Systém',    color: 'var(--warning)', icon: <Settings size={12} /> },
};
```

### 4.3 — Archivovaný stav

Pokud `news.archived === true`: karta má `opacity: 0.78` (analog `cardPast` u `GameEventCard`) + chip „archivováno" v meta řádce.

### 4.4 — Page name resolution

Pro `linkPageSlug` potřebujeme zobrazit lidsky čitelné jméno stránky, ne jen slug. Možnosti:
- **A** (recommended): hook `usePagesDirectory(worldId)` — fetchne všechny stránky → mapuje `slug → name`. Cache shared mezi kartami.
- **B**: BE serializuje `linkPageName` do response — extra BE změna.

Doporučuju **A** — žádná BE změna. Cache TanStack `['pages-directory', worldId]` se sdílí.

---

## 5 — Refactor `WorldNewsEditorModal` → s upload + focal + page picker

Copy struktura z `GameEventModal`. Pole:

| Pole | Komponenta | Poznámka |
|---|---|---|
| Title | Input | required, max 200 |
| Type | select | info / alert / system |
| Date | datetime-local | required |
| Content | Textarea nebo RichText | 1–10000 |
| Image upload | ImagePlus picker | reuse `useUploadImage` z 3.1b |
| Focal point | clickable overlay | reuse pattern z `GameEventModal` |
| Link page | **`<PagePicker>`** ← NEW | autocomplete podle `usePagesDirectory` |
| Externí link | Input | volitelný, jen pokud není zvolena stránka |

### 5.1 — `<PagePicker>` — nová sdílená komponenta

```ts
interface Props {
  worldId: string;
  value: string | null;            // page slug nebo null
  onChange: (slug: string | null) => void;
  /** Volitelně filter — např. jen Lokace pro lokace-event ref. */
  filterType?: PageType[];
  placeholder?: string;
}
```

Render: autocomplete input s dropdown — search v `usePagesDirectory(worldId).data` (filter podle `title` / `slug`). Zobrazí název + typ chip + slug. Klik = `onChange(slug)` + ukáže ji jako chip s `×` (clear).

📚 **Co je `usePagesDirectory`:** existující hook v `src/features/world/pages/api/usePagesDirectory.ts` — vrací redukovaný seznam Page entity světa (slug, title, type). Reuse v PagesListPage, CharactersPage.

⚠️ **Mutual exclusivity:** linkPageSlug vs. link — jen jedno. UI to vynutí: pokud user zvolí stránku, externí link input se disabluje (a naopak).

---

## 6 — Refactor `NewsColumn` v dashboardu světa

Paralela s `EventsColumn` po 9.1 follow-up (`29ae9e5`):
- Footer link na `/svet/:slug/novinky` ← už správně
- Pokud má PJ+ tlačítko „+ Nové oznámení" v hlavičce — ověřit existenci, jinak doplnit (paralela s 2.1b/9.1 EventsColumn `+` button)
- **`WorldNewsCard` v `NewsColumn` musí být plnohodnotná** s obrázkem (analog GameEventCard refactor v EventsColumn)

⚠️ **Card kompaktnost v dashboardu:** novinky v sloupci mají `max 3`. Plnohodnotná karta s 16:9 obrázkem v 1col sloupci = vysoký scroll. Akceptováno (analog akce na dashboardu). Pokud chce kompaktní variantu, dodáme prop `compact` (mimo 9.5).

---

## 7 — Stránka `/svet/:slug/novinky` (WorldNewsPage)

Stávající: má toolbar Aktivní / Archiv + grid. Pojďme:
- Nahradit `WorldNewsCard` za refactorovanou (s obrázkem) — automatický wireup
- Toolbar zachovat
- Modal: rozšířený editor (viz §5)

---

## 8 — Permission matrix (žádná změna)

| Akce | Hráč | PomocnyPJ | PJ | Admin |
|---|---|---|---|---|
| Číst novinky | ✓ | ✓ | ✓ | ✓ |
| Vytvořit / upravit / smazat | — | ✓ | ✓ | ✓ |
| Archivovat / obnovit | — | ✓ | ✓ | ✓ |
| Upload obrázku | — | ✓ | ✓ | ✓ |

---

## 9 — Acceptance criteria

1. BE `WorldNews` schema má `imageUrl/imageFocalX/imageFocalY/linkPageSlug` jako optional/nullable
2. DTO validuje focal 0-100, accept null v update přes `ValidateIf`
3. Karta s obrázkem renderuje `<img>` s focal `object-position: x% y%`
4. Karta bez obrázku → typ-specifická fallback ikona (Bell/AlertTriangle/Settings)
5. TypeChip vlevo nahoře — barva per typ (`info` accent, `alert` danger, `system` warning)
6. Modal upload obrázku: drag&drop + file input, 10MB limit, focal click overlay
7. PagePicker autocomplete: max 8 výsledků, search po title/slug, klik vybere
8. PagePicker zvolen → externí link input disabled, naopak také
9. Klik na linkPageSlug v kartě → naviguje na `/svet/<worldSlug>/<linkPageSlug>` (React Router Link)
10. Klik na externí link → otevře v novém tabu (`target="_blank"`)
11. Archivovaná karta má opacity 0.78 + chip „archivováno"
12. Backward compat: novinka s plain `link` (legacy bez `linkPageSlug`) renderuje externí link
13. Dashboard `NewsColumn`: 3 karty s obrázky, „+" button pro PJ+, footer link na `/novinky`
14. FE testy: TypeChip (3 varianty), PagePicker (search + select + clear + disabled when external link), WorldNewsCard (5 stavů: bez img / s img / s page link / s ext link / archive)
15. BE testy: imageFocal DTO + repo round-trip, linkPageSlug round-trip
16. `mobil-desktop` static audit ✓
17. `napoveda` update — sekce „Novinky světa" rozšíření o obrázek + page link

---

## 10 — Otevřené otázky

**Q1 — RichText content:** karta dnes plain-text excerpt z HTML. Modal má textarea s plain content. Spec 9.5 neřeší — content zůstává plain text (paralela s `GameEventModal`). Pokud chceš RichText (bold/italic/links inline), samostatný feature.

- **A** (recommended): plain text zachováno, neřešit v 9.5
- **B**: RichText (TipTap nebo podobný) → větší rozsah

**Q2 — PagePicker filter podle typu:**
- **A** (recommended): bez filtru (všechny Page typy — wiki, Lokace, NPC, postava). PJ rozhodne, co je relevantní pro novinku.
- **B**: výchozí filter jen wiki/Lokace (vynechá NPC a postavy hráčů)

**Q3 — Mutual exclusivity link vs. linkPageSlug:**
- **A** (recommended): UI vynutí jen jedno. BE povoluje obě (backward compat). Pokud user vyplní externí link a pak zvolí stránku, BE smaže `link`.
- **B**: BE vynucuje 400 pokud oboje → restriktivnější.

**Q4 — Type chip vs. type-stripe (současný design):**
- **A** (recommended): nahradit pruh za chip vlevo nahoře (konzistence s GroupChip / DateChip u akcí). Stripe odstranit.
- **B**: zachovat stripe + přidat chip → vizuální redundance.

**Q5 — Backward compat plan `link` field:**
- **A** (recommended): zachovat `link` jako legacy field navždy (žádný cleanup). Nové novinky preferují `linkPageSlug`.
- **B**: migrace existujících `link` → `linkPageSlug` pokud match na world page → dluh navíc, drobné refactory.

---

## 11 — Mimo rozsah

- RichText content (Q1-B)
- Per-novinka přístupová pravidla (analog `accessMode` u Page)
- Komentáře pod novinkou (paralela 9.1-II, ale samostatný spec)
- Multi-page link (1 novinka → N stránek)
- Sticky / pinned novinky
- Email notifikace nové novinky

---

## 12 — Reference

- BE: [`world-news/schemas/world-news.schema.ts`](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/world-news/schemas/world-news.schema.ts)
- FE typ: [`src/shared/types/index.ts:711`](src/shared/types/index.ts#L711)
- Card k refactoru: [`WorldNewsCard.tsx`](src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsCard.tsx)
- Modal k refactoru: [`WorldNewsEditorModal.tsx`](src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsEditorModal.tsx)
- Vzor pro karty: [`GameEventCard.tsx`](src/features/world/components/GameEventCard/GameEventCard.tsx) (9.1-I)
- Vzor pro modal: [`GameEventModal.tsx`](src/features/world/components/GameEventModal/GameEventModal.tsx) (9.1-I)
- PagePicker zdroj dat: [`usePagesDirectory.ts`](src/features/world/pages/api/usePagesDirectory.ts)
