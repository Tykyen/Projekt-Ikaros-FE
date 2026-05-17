# Spec 5.1 — WorldLayout — dokončení

**Status:** ✅ Implementováno (2026-05-17)
**Rozsah:** FE — malý dodělek světového shellu (kostra stojí z 2.4). Žádné BE změny.
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-5.1-worldlayout`
**Velikost:** odhad ~10 souborů / ~400 ř. (1 nová stub stránka + 1 skeleton + úpravy WorldLayout/WorldContext + CSS + testy)
**Autor:** PJ + Claude
**Datum:** 2026-05-17
**Souvisí:** [spec-2.4.md](../phase-2/spec-2.4.md) (světový shell + join flow), roadmapa fáze 5 (`docs/roadmap-fe.md` ř. 837)

---

## 1. Cíl

Dokončit světový shell `WorldLayout` tak, aby byl připravený přijmout světový theme (krok 5.0) a kontext postavy (fáze 8). Konkrétně: doplnit do headeru accessMode badge a slot „aktuální přihlášená postava", přidat do `WorldContext` slot `character`, nahradit 21 holých `[stub]` world stránek jednou kultivovanou placeholder komponentou, ověřit mobile drawer (touch targety) a doplnit loading/404 stav layoutu.

Žádná nová funkčnost — krok je o **dokončení a zkultivování** existující kostry.

---

## 2. Kontext / motivace

`WorldLayout` vznikl v kroku 2.4 jako split-header shell (light header pro non-member / pending, plný header s nav pro membery). Funguje, ale je nedodělaný:

- Header zmiňuje genre badge, ale **nemá accessMode badge** (roadmapa fáze 5 ho vyžaduje) ani žádný náznak „kdo jsem v tomto světě".
- `WorldContext` nemá slot pro postavu — fáze 8 (character flow) ho bude potřebovat; lepší zavést prázdný slot teď, než později měnit tvar kontextu napříč konzumenty.
- Všech **21 world sub-stránek jsou 3řádkové stuby** (`return <div>[stub] Pravidla světa</div>`). Pro uživatele, který v kroku 5 reálně vstoupí do světa a začne klikat v nav, je to nedůstojné — uvidí syrový `[stub]` text.
- Loading a 404 stav layoutu nejsou ošetřené — při načítání se v názvu zobrazí `...`, ale nav i akce se renderují; u neexistujícího světa řeší 404 až vnitřní `WorldDashboardPage`, header zůstává prázdný.

Bez tohoto kroku by 5.0 (světový theme) stavěl na nehotovém shellu a fáze 8 by musela retrofitovat `WorldContext`.

---

## 3. Audit současného stavu

### WorldLayout — [`src/app/layout/WorldLayout/WorldLayout.tsx`](../../../src/app/layout/WorldLayout/WorldLayout.tsx)

- **Header** (ř. 150–201): EXIT button, název světa (link na index), `genreBadge` (jen pokud `world.genre`). Plný blok (nav + actions + hamburger) jen pro `showFullNav` (member / globální admin).
- `showFullNav = status === 'member' || isGlobalAdmin` — light/full split z 2.4 funguje.
- **Nav** (`buildNav`, ř. 15–49): 6 skupin — `Informace` (Přehled, Pravidla), `Chat`, `Svět`, `Nástroje` (7 položek), `Společenství` (3 položky), `Kalendář`. Položka „Tvorba podzemí" míří mimo svět na `/admin/dungeon-builder`.
- **Dropdown** (`NavDropdown`, ř. 54–104): click-to-open, outside-click zavírá. OK.
- **Mobile drawer** (ř. 204–249): zprava, backdrop, `drawerLink` padding `var(--sp-2)` ≈ 8 px → **touch target pod 44 px** (porušuje base.md).
- **Loading**: `useWorld` `isLoading` → název headeru `...`, ale celý header/nav se renderuje. Žádný skeleton.
- **Error / 404**: layout neřeší — když `useWorld` selže, `world` je `undefined`, header ukáže „Svět", `Outlet` vyrenderuje `WorldDashboardPage`, ten zobrazí `WorldNotFound`. Header nad 404 stránkou je polovičatý (EXIT + „Svět").
- `data-theme={themeId}` + `bgStyle` z globálního `themeAtom` — světový theme řeší 5.0, **v 5.1 se nedotýkáme**.

### WorldContext — [`src/features/world/context/WorldContext.tsx`](../../../src/features/world/context/WorldContext.tsx)

- `WorldContextValue` = `worldId`, `worldSlug`, `world`, `isPJ`, `userRole`, `loading`. Kompletní pro dnešek; **chybí slot `character`**.

### World sub-stránky — [`src/features/world/pages/`](../../../src/features/world/pages/)

- 21 stránek, **všechny 3řádkové stuby**: `RulesPage`, `MapPage`, `TacticalMapPage`, `CurrencyPage`, `WeatherPage`, `SoundsPage`, `StorylinesPage`, `ShopPage`, `GroupsPage`, `CampaignPage`, `CharactersPage`, `CalendarPage`, `TimelinePage`, `EventsPage`, `MyCharacterPage`, `WorldChatPage`, `PagesListPage`, `PageViewerPage`, `PageEditorPage`, `PagesAdminPage`, `NPCDirectoryPage`, `WorldSettingsPage`.
- Routing: [`src/app/router.tsx:201-257`](../../../src/app/router.tsx) — `/svet/:worldSlug/*`, `memberOnly` guard.

### Hotové (NEstub, mimo rozsah)

- `WorldDashboardPage` (index) — reálný obsah z 2.4 (hero + info + join/member větve). Krok 5.2 ho rozšíří. **5.1 se ho nedotýká.**

---

## 4. Návrh řešení

### 4.1 WorldContext — slot `character`

Rozšířit `WorldContextValue` o slot postavy. V 5.1 vždy `null` (plný character flow = fáze 8). Slot zavádíme teď, aby fáze 8 neměnila tvar kontextu.

```ts
/** Aktivní postava uživatele v tomto světě. Plní fáze 8; do té doby vždy null. */
export interface WorldCharacterSlot {
  characterPath: string;   // slug postavy → /svet/:slug/<characterPath>
  name: string;
  avatarUrl?: string;
}

export interface WorldContextValue {
  worldId: string;
  worldSlug: string;
  world: World | null;
  isPJ: boolean;
  userRole: WorldRole | null;
  /** Fáze 8 — aktivní postava ve světě. Do té doby null (header fallbackuje na účet). */
  character: WorldCharacterSlot | null;
  loading: boolean;
}
```

`WorldLayout` doplní `character: null` do `ctxValue`. Default contextu rovněž `character: null`.

> 💡 **Proč slot teď:** Tvar `WorldContextValue` čte víc komponent. Přidat pole později = širší diff a riziko. Prázdný slot je levný a fázi 8 ušetří retrofit.

### 4.2 Header — accessMode badge + slot postavy

**accessMode badge** — reuse mapy a stylu z [`WorldDetailHero`](../../../src/features/world/components/WorldDetailHero/WorldDetailHero.tsx) (`ACCESS_LABELS`: public→Veřejný, open→Veřejný se schválením, private→Soukromý, closed→Uzavřený). Aby se mapa nezdvojovala, vytáhne se do sdíleného helperu.

- **Nový soubor** `src/features/world/lib/accessMode.ts` — export `ACCESS_LABELS` + `accessModeLabel(mode)`.
- `WorldDetailHero` i `WorldLayout` ho importují (DRY).
- Badge v headeru vedle názvu, vedle stávajícího `genreBadge` (oba zachovány — rozhodnutí autora). Pořadí: název · accessMode badge · genre badge.

**Slot „aktuální přihlášená postava"** — prvek v pravé části headeru (před / vedle `actions`). Zobrazení:
- Pokud `character` (fáze 8) → avatar postavy + jméno postavy.
- Fallback (vždy v 5.1) → avatar účtu + `username` uživatele.
- **Neklikatelné** (rozhodnutí autora) — jen `<div>`, žádný link. Plný flow (přepínání postav, proklik) přijde ve fázi 8.
- Avatar fallback: pokud `avatarUrl` chybí, iniciála v kolečku (reuse existujícího `Avatar` komponentu ze `shared/ui`, pokud existuje — ověřit v impl. plánu; jinak jednoduchý fallback).
- Zobrazuje se jen v plném headeru (`showFullNav`) — light header (non-member) zůstává beze změny.

⚠️ **Šířka headeru:** Header má `overflow: hidden` a `gap`. Přidání badge + postava slotu zúží prostor pro nav. Na desktopu OK; na úzkých šířkách (769–1024 px tablet) ověřit, že se nic neořízne — případně skrýt `searchBar` dřív (už je `display:none` ≤ 768).

### 4.3 Nav — finální statické dropdowny + placeholder strategie

Nav skupiny zůstávají (Informace / Chat / Svět / Nástroje / Společenství / Kalendář) — odpovídají roadmapě, **beze změny struktury**. Headline builder (custom menu PJ) je descopován na fázi 12.

**Placeholder pro nehotové stránky** — rozhodnutí autora: **jednotná `WorldStubPage`**. Nav zůstává plně klikatelná; každá nehotová stránka místo `[stub] …` vyrenderuje kultivovaný panel „Tato sekce bude dostupná s krokem X".

- **Nový soubor** `src/features/world/pages/WorldStubPage/` — komponenta + CSS + index.
  - Props: `title` (název sekce), `step` (číslo/label kroku), volitelně `note` (1 věta kontextu).
  - Vzhled: centrovaný panel — ikona/emoji, nadpis sekce, věta „Tato sekce bude dostupná s krokem **{step}**", volitelná poznámka. Reuse skin tokenů, žádné hardcoded barvy. Tonálně sladit s `WorldNotFound`.
- **Nový soubor** `src/features/world/pages/worldStubMap.ts` — mapa route → `{ title, step, note? }`. Jediný zdroj pravdy pro stub metadata.

  | Route | Title | Krok |
  |---|---|---|
  | `chat` | Chat světa | 6 |
  | `stranky`, `nova-stranka`, `edit/:slug`, `:slug` (wiki), `pravidla` | Stránky světa / Pravidla | 7 |
  | `postavy`, `moje-postava` | Postavy / Moje postava | 8 |
  | `kalendar`, `timeline`, `sprava-udalosti` | Kalendář / Časová osa / Události | 9 |
  | `pocasi` | Generátor počasí | 9.4 |
  | `mapa` | Mapa vesmíru | 10.1 |
  | `takticka-mapa` | Taktická mapa | 10.2 |
  | `pavucina` | Pavučina vztahů | 11.1 |
  | `scenare` | Scénáře a příběhy | 11.2 |
  | `obchod` | Obchod světa | 11.3 |
  | `prevodnik-men` | Převodník měn | 11.4 |
  | `zvuky` | Zvuková databáze | 13.3 |
  | `nastaveni` | Nastavení světa | 5.3 |
  | `skupiny` | Skupiny | 5.3 |
  | `admin/stranky`, `admin/adresar-postav` | Správa stránek / Adresář postav | 7 / 8 |

- **Náhrada 21 stubů**: každá stub stránka se zredukuje na jednořádkový wrapper, např.:
  ```tsx
  import { WorldStubPage } from './WorldStubPage';
  export default function RulesPage() {
    return <WorldStubPage title="Pravidla světa" step="7" />;
  }
  ```
  `WorldDashboardPage` (index) **se nemění** — má reálný obsah.

> 🔀 **Alternativa (zamítnuta):** disabled nav položky. Autor zvolil klikatelnou nav + stub stránku — uživatel se kamkoli dostane a uvidí, co kde čekat. Konzistentní i pro přímý URL přístup.

### 4.4 Mobile drawer — touch targety

- `drawerLink`, `drawerSectionTitle`, `drawerNewPage` — zvýšit vertikální padding tak, aby výška klikatelného prvku byla **≥ 44 px** (base.md). Dnes `drawerLink` má `padding: var(--sp-2) var(--sp-2)` (≈ 8 px) → výška ~32 px. Navýšit na `var(--sp-3)` vertikálně + `min-height: 44px`.
- `hamburger` má 36 px → zvětšit na 44 px (touch).
- Ověřit, že drawer scrolluje, když je obsah delší než viewport (`overflow-y: auto` už je).
- Drawer dnes nemá close (×) tlačítko — zavírá se backdropem / volbou položky. Ponechat (backdrop stačí), **nebo** doplnit × — rozhodne impl. plán dle UX; minimalisticky ponechat.

### 4.5 Loading / error stav layoutu

- **Loading** (`isLoading || statusLoading`): místo poloprázdného headeru zobrazit **header skeleton** — EXIT zůstává funkční (uživatel může odejít), název + badge nahradit šedými placeholder bloky, nav skrýt. Tělo (`Outlet`) ukáže vlastní spinner (řeší stránky samy / `WorldDashboardPage`).
  - Realizace: jednoduchý `data-loading` / podmíněný render uvnitř headeru, ne nová komponenta — drobnost.
- **404 / neexistující svět**: když `useWorld` skončí chybou a `world == null` po dokončení loadingu → layout vyrenderuje **jen light header** (EXIT + „Svět neexistuje") a `Outlet` (kde `WorldDashboardPage` ukáže `WorldNotFound`). Nav/akce se nesmí renderovat (dnes by se u globálního admina mohly).
  - Konkrétně: `showFullNav` musí být `false`, když `world` chybí — přidat podmínku `!!world && (status === 'member' || isGlobalAdmin)`.

### 4.6 mobil-desktop audit

Po vizuálních úpravách spustit skill `mobil-desktop` na `WorldLayout` (header, nav dropdowny, drawer, postava slot) — mobil ≤ 768, tablet 769–1024, desktop > 1024.

---

## 5. Out of scope

- **Světový theme** (`data-world-theme`, `applyWorldTheme`) — krok 5.0. 5.1 ponechává globální `themeAtom`.
- **Character flow** — výběr/přepínání postav, proklik na postavu, plnění `character` slotu reálnými daty — fáze 8. 5.1 jen zavádí prázdný slot a fallback na účet.
- **Headline builder** — custom menu PJ (`hiddenNavItems`, `customHeadline`) — fáze 12.
- **Obsah world sub-stránek** — žádná stránka se v 5.1 neimplementuje, jen se sjednocuje placeholder. Reálný obsah řeší příslušné kroky 5.3 / 6 / 7 / 8 / 9 / 10 / 11 / 13.
- **WorldDashboardPage** (index, world dashboard) — krok 5.2.
- **Globální search** v headeru (`searchBar`) — zůstává neaktivní placeholder „Hledat…" jako dnes; aktivace = fáze 13.1.

---

## 6. Acceptance kritéria

1. `WorldContextValue` má slot `character: WorldCharacterSlot | null`; `WorldLayout` i default context dodávají `null`.
2. Header (plný) zobrazuje accessMode badge se správným českým labelem pro všechny 4 režimy; genre badge zachován.
3. `ACCESS_LABELS` / `accessModeLabel` žije v jednom sdíleném souboru; `WorldDetailHero` i `WorldLayout` ho importují (žádná duplicitní mapa).
4. Header (plný) zobrazuje slot postavy — avatar + jméno; v 5.1 vždy fallback na účet (`username`); neklikatelné.
5. Slot postavy se nezobrazuje v light headeru (non-member / pending).
6. Všech 21 world sub-stránek renderuje `WorldStubPage` s korektním názvem sekce a číslem kroku dle `worldStubMap`; žádná stránka neukazuje syrový `[stub]` text.
7. `WorldDashboardPage` (index) zůstává beze změny — reálný obsah z 2.4.
8. Nav je plně klikatelná; proklik na nehotovou sekci zobrazí `WorldStubPage`.
9. Mobile drawer — všechny klikatelné prvky (`drawerLink`, `drawerNewPage`, `hamburger`) mají touch target ≥ 44 px.
10. Loading stav layoutu zobrazí header skeleton (EXIT funkční, název/badge placeholder, nav skrytá).
11. Neexistující / nedostupný svět → layout renderuje jen light header (žádná nav/akce ani pro globálního admina); tělo ukáže `WorldNotFound`.
12. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
13. Žádný hardcoded barevný literál (`WorldStubPage` i header úpravy přes skin tokeny).
14. Mobile (≤ 768) i tablet (769–1024) layout ověřen skillem `mobil-desktop`.
15. Stránka `Nápověda` (`/ikaros/napoveda`) — ověřit, zda 5.1 přidává něco k popisu (světový shell); pravděpodobně beze změny — rozhodne skill `napoveda`.

---

## 7. Test plán

### Automated (Vitest + RTL)

- `accessModeLabel` — vrací správný label pro `public/open/private/closed` + fallback pro neznámý.
- `WorldStubPage` — renderuje `title` a `step`; renderuje `note`, když je předán.
- `WorldLayout` — plný header: přítomnost accessMode badge + slot postavy (fallback username); light header: nepřítomnost slotu postavy a nav.
- `WorldLayout` — `world == null` po loadingu → žádná nav ani pro globálního admina.
- `worldStubMap` — každá route má `title` i `step` (žádný `undefined`).
- Odhad: **+8–10 FE testů**.

### Manuální smoke

- Vstup do světa jako member → header: název + accessMode badge + genre + postava slot (username).
- Proklik všemi nav dropdowny → každá nehotová sekce ukáže `WorldStubPage` se správným krokem.
- Mobil: hamburger → drawer, položky se dají pohodlně trefit prstem, drawer scrolluje.
- Neexistující slug `/svet/neexistuje` → light header + `WorldNotFound`.
- Pomalá síť (throttling) → header skeleton během načítání.

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Header se na tabletu (769–1024) ořízne po přidání badge + postava slotu | Střední | Nízký | `mobil-desktop` audit; postava slot na úzkém viewportu zkrátit (jen avatar) — ověřit v impl. plánu. |
| Náhrada 21 stubů zanese překlep v route→krok mapě | Nízká | Nízký | `worldStubMap` jako jediný zdroj; test ověří úplnost. |
| `WorldStubPage` se v 5.3/6/7… zapomene nahradit reálným obsahem | Střední | Nízký | Stub je vizuálně zjevně „nehotová sekce"; roadmapa kroky trackuje. |
| Skeleton bliká u rychlé sítě | Nízká | Nízký | Skeleton jen během reálného `isLoading`; krátký dotaz z cache ho nevyvolá. |

**Rollback:** Revert FE commitu. Změny jsou aditivní (nový slot, nové komponenty) + náhrada stub obsahu — žádná data ani BE. Revert vrátí holé `[stub]` stránky.

---

## 9. Otázky k autorovi

Žádné — autor delegoval brainstorming, rozhodnutí (2026-05-17):

- **Placeholder:** jednotná `WorldStubPage` s mapou route→krok; nav zůstává plně klikatelná.
- **Slot postavy v headeru:** jen zobrazení (avatar + jméno), neklikatelné; fallback na účet uživatele. Plný flow = fáze 8.
- **Header badge:** accessMode badge **i** genre badge (oba).

---

**Po schválení specu napíšu implementační plán** (přesné CLI / file diff).
