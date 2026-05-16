# Spec 3.8 — Badge počtu pending akcí u nav položek Diskuze / Články / Galerie

**Status:** ✅ Hotovo 2026-05-16
**Rozsah:** BE (rozšíření 1 endpointu) **+** FE (typy, hook, layout, CSS) — malé
**Repo:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE`. Commity přímo do `main` v obou (konvence 3.x).
**Velikost:** odhad BE ~2–3 soubory / ~40 ř., FE ~5 souborů / ~80 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-16
**Souvisí:** spec-1.4 (`pending-actions` agregátor), spec-3.2/3.3/3.4 (review providery).

---

## 1. Cíl

Vedle nav položek **Diskuze**, **Články** a **Galerie** v levém panelu zobrazit číselný
badge — počet obsahu čekajícího na schválení (`Pending`), který daný uživatel
smí zpracovat. Badge slouží jako upozornění pro moderátory, že je co odbavit.

---

## 2. Kontext / motivace

- Schvalovací workflow už existuje u všech tří modulů: články/galerie mají
  `status: Draft|Pending|Published|Rejected`, diskuze `isApproved: boolean`.
  Obsah se zveřejní až po schválení správcem. **Domněnka autora potvrzena.**
- Pending položky se zpracovávají v tabu „Zpracovat" (`ZpracovatTab`) přes
  agregátor `pending-actions`. BE provider per typ řeší přes `canHandle`, kdo typ vidí.
- Dnes existuje jen agregovaný badge u „Uživatelé" v pravém panelu
  (`usePendingActionsCount` → `{ total }`). Moderátor článků/galerie/diskuzí
  nevidí na první pohled, **kde** něco čeká — musí otevřít „Zpracovat".
- Badge u konkrétní nav položky zkrátí cestu: uvidím „Články ③" → vím rovnou kam jít.

---

## 3. Audit současného stavu

### 3.1 Backend

| Prvek | Stav |
|---|---|
| `GET /pending-actions/count` | vrací jen `{ total: number }` — suma napříč všemi `canHandle` providery |
| `PendingActionsService.countForUser` | smyčka přes providery, `canHandle` gate, sčítá `provider.countForUser` |
| `ArticleReviewProvider` | typ `article_pending_review`, `canHandle` = Superadmin/Admin/SpravceClanku |
| `GalleryReviewProvider` | typ `gallery_pending_review`, `canHandle` = Superadmin/Admin/SpravceGalerie |
| `DiscussionReviewProvider` | typ `discussion_pending_review`, `canHandle` = Superadmin/Admin/SpravceDiskuzi |

→ **Role gating, který autor popsal, už BE provideři přesně implementují.**
Admin/Superadmin vidí vše; SpravceClanku jen články; SpravceGalerie jen galerii;
SpravceDiskuzi jen diskuze. FE nemusí roli řešit vůbec.

### 3.2 Frontend

- `usePendingActionsCount()` ([usePendingActions.ts](../../../src/features/users/api/usePendingActions.ts)) — `queryKey ['pending-actions','count']`, vrací `PendingActionsCountResponse = { total }`.
- `PRIMARY_NAV` v [IkarosLayout.tsx:65](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L65) — statické pole, `NavItem` renderuje ikonu + label, **bez badge**.
- Badge styl `s.navItemBadge` v `IkarosLayout.module.css` už existuje (používá ho „Uživatelé" v pravém panelu) — znovupoužitelný.
- `useDiscussions`/`useArticles`/`useGallery` mutace invalidují `['pending-actions']` → count query se obnoví po schválení/zamítnutí automaticky.

---

## 4. Návrh řešení

### 4.1 BE — `byType` rozpad v count endpointu

`PendingActionsService` dostane novou metodu (nebo `countForUser` rozšíří návratový tvar):

```ts
async countForUser(userId, role, adminPerms): Promise<{
  total: number;
  byType: Partial<Record<PendingActionType, number>>;
}>
```

Smyčka přes providery zůstává; pro každý `canHandle === true` provider se uloží
`byType[provider.type] = count` a přičte do `total`. Provideři, které uživatel
nevidí, v `byType` **nejsou** (nebo jsou 0) — role gating se propíše sám.

Endpoint `GET /pending-actions/count` vrátí `{ total, byType }`.
Zpětná kompatibilita: `total` zůstává → stávající badge „Uživatelé" funguje beze změny.

⚠️ **Mimo BE scope:** žádná změna providerů, `canHandle`, ani `pending-action`
typů. Jen agregace už počítaných hodnot.

### 4.2 FE — typy

`PendingActionsCountResponse` v `shared/types`:

```ts
export interface PendingActionsCountResponse {
  total: number;
  byType: Partial<Record<PendingActionType, number>>;
}
```

### 4.3 FE — mapování nav položka → pending typ

| `navKey` | pending typ | kdo vidí badge |
|---|---|---|
| `diskuze` | `discussion_pending_review` | Superadmin / Admin / SpravceDiskuzi |
| `clanky` | `article_pending_review` | Superadmin / Admin / SpravceClanku |
| `galerie` | `gallery_pending_review` | Superadmin / Admin / SpravceGalerie |

`NavItemDef` dostane optional `pendingType?: PendingActionType`. `PRIMARY_NAV`
ho doplní u tří položek. `NavItem` přečte `byType[pendingType]` a když > 0,
vykreslí `<span className={s.navItemBadge}>`.

Badge = počet **přihlášenému viditelných** položek. Pokud uživatel typ nevidí
(`canHandle` false na BE), `byType` klíč chybí → badge se nezobrazí. Žádná
role logika na FE.

### 4.4 FE — layout / hook

- `usePendingActionsCount` — beze změny logiky, jen nový návratový typ.
  `SidebarContent` zavolá hook jednou a předá `byType` do `NavItem` přes prop
  (nebo přímo, hook je levný — sdílená query cache).
- Anonym / nepřihlášený: hook se nevolá (badge se nezobrazí). Stávající
  pattern — `usePendingActionsCount(!!currentUser)`.

### 4.5 Vizuál

- Reuse `s.navItemBadge` — žádné nové theme tokeny, žádná nová barva.
- Badge vpravo v `NavItem`, za labelem (jako u „Uživatelé"). NavItem layout
  je `flex` ikona + label; badge se přidá jako třetí prvek, label dostane
  `flex: 1` pokud ještě nemá.
- `aria-label` na badge: `„{n} čeká na schválení"`.
- **Tooltip** (`title` na nav položce nebo lehký hover tooltip): formulace per
  doména — „{n} článků čeká na schválení" / „{n} obrázků…" / „{n} diskuzí…".

### 4.6 Mobil / desktop

- Levý nav je na desktopu sidebar, na mobilu drawer — stejný `NavItem`.
  Badge se vejde do obou (malý pill). Po implementaci `mobil-desktop` audit.

### 4.7 Real-time

- Žádný nový socket. Schválení/zamítnutí přes `useDiscussions`/`useArticles`/
  `useGallery` už invaliduje `['pending-actions']` → count query (potomek
  klíče) se přefetchne, badge klesne. Mimo to `staleTime 30 s`.

### 4.8 Soubory

**BE (`Projekt-ikaros`):**
```
backend/src/modules/pending-actions/
├── pending-actions.service.ts        # countForUser → { total, byType }
├── pending-actions.controller.ts     # getCount návratový tvar
└── pending-actions.service.spec.ts   # + test byType rozpadu + canHandle gate
```

**FE (`Projekt-ikaros-FE`):**
```
src/shared/types/index.ts                       # PendingActionsCountResponse + byType
src/features/users/api/usePendingActions.ts     # (typ — bez logiky)
src/app/layout/IkarosLayout/IkarosLayout.tsx    # NavItemDef.pendingType, NavItem badge
src/app/layout/IkarosLayout/IkarosLayout.module.css  # (reuse navItemBadge — pravděp. beze změny)
src/app/layout/IkarosLayout/IkarosLayout.spec.tsx    # + test badge render/skrytí
```

---

## 5. Out of scope

- **`discussion_report` a `discussion_join_request`** v badge u „Diskuze".
  Důvod: jiná cílovka — join requesty řeší jednotliví správci konkrétní
  diskuze (ne role SpravceDiskuzi), reporty jsou hlášení, ne schvalování
  vzniku. Autor zadání popsal výslovně schvalování *vzniku* obsahu. Badge =
  jen `discussion_pending_review`. **Viz §9 — otázka k potvrzení.**
- **Badge u jiných nav položek** (Úvodník, Nápověda, Vytvořit svět).
- **Badge u pravého panelu** (sekce Oblíbené apod.).
- **Per-world pending** — všechny tři typy jsou platformově globální.
- **Animace / push notifikace** při změně počtu.

---

## 6. Acceptance kritéria

1. `GET /pending-actions/count` vrací `{ total, byType }`; `byType` obsahuje
   jen typy, které requester přes `canHandle` vidí.
2. Superadmin/Admin vidí badge u všech tří položek (pokud je co schvalovat).
3. SpravceClanku vidí badge jen u „Články"; SpravceGalerie jen u „Galerie";
   SpravceDiskuzi jen u „Diskuze".
4. Běžný uživatel (Ikarus) nevidí žádný z těchto tří badge.
5. Badge zobrazuje počet `Pending` položek daného typu; při 0 se nezobrazí.
6. Po schválení/zamítnutí položky badge klesne (invalidace `['pending-actions']`).
7. Stávající badge „Uživatelé" v pravém panelu funguje beze změny (`total`).
8. Žádné hardcoded barvy (`lint:colors` projde), badge drží ve 21 motivech.
9. Mobil ≤ 768 px: badge se vejde do drawer nav, layout nedrhne.
10. BE `npm test`, FE `lint` / `lint:colors` / `test:run` / `build` / `tsc` projdou.

---

## 7. Test plán

**BE:**
- `pending-actions.service.spec.ts` — `countForUser` vrací `byType` jen pro
  `canHandle` providery; `total` = suma `byType`; uživatel bez práv → prázdné `byType`.

**FE:**
- `IkarosLayout.spec.tsx` — badge se vykreslí u položky když `byType[typ] > 0`;
  skryje se při 0 / chybějícím klíči; anonym badge nevidí.
- `lint`, `lint:colors`, `test:run`, `build`.

**Manuální smoke:**
- Jako SpravceClanku — vytvoř článek do `Pending` → u „Články" naskočí ①.
- Schval ho → badge zmizí.
- Jako Ikarus — žádný badge.
- Mobil 360 px → drawer, badge sedí.

---

## 8. Riziko & rollback

| Riziko | Pravděp. | Mitigace |
|---|---|---|
| Změna tvaru `count` rozbije stávající badge „Uživatelé" | Nízká | `total` zůstává, jen se přidá `byType` — aditivní |
| `byType` klíče (BE enum hodnoty) ≠ FE `PendingActionType` enum | Nízká | Stejné string hodnoty v obou repech (ověřeno) |
| Badge počítá víc položek, než moderátor reálně odbaví | Nízká | `byType` z `canHandle` providerů = přesně to, co vidí v „Zpracovat" |

**Rollback:** FE — odebrat `pendingType` z `PRIMARY_NAV` + badge z `NavItem`.
BE — `byType` je aditivní, lze ponechat. Bezpečný rollback.

---

## 9. Rozhodnutí autora (2026-05-16)

1. ✅ **Badge u „Diskuze" = jen `discussion_pending_review`** (schvalování nových
   diskuzí). Reporty a žádosti o vstup se do levého nav badge **nedávají** —
   jejich počet ale zůstává viditelný jinde:
   - **agregátní badge** u „Uživatelé / Přátelé" v pravém panelu
     (`/pending-actions/count → total`) sčítá i `discussion_report` +
     `discussion_join_request`;
   - **tab „Zpracovat"** ukazuje každý typ jako skupinu s počtem v nadpisu.

   Levý nav badge = moderace platformy (role SpravceDiskuzi). Žádosti o vstup
   do konkrétní diskuze řeší správce dané diskuze (klidně běžný uživatel) —
   ten je vidí přes agregátní badge + „Zpracovat", ne přes levý nav.
2. ✅ **Tooltip ano** — badge má hover tooltip „X čeká na schválení"
   (formulace per doména: článků / obrázků / diskuzí) navíc k `aria-label`.
