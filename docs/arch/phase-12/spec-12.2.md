# Spec 12.2 — World admin: Headline / menu builder (`/svet/:worldSlug/admin/headline`)

**Fáze:** 12 — Admin & nastavení
**Krok:** 12.2
**Stav:** 🟡 návrh ke schválení
**Datum:** 2026-06-03
**Role gate:** world PJ (`WorldRole.PJ`) + globální Admin/Superadmin (fallback)

---

## 1. Účel

Poslední zbylý světový admin nástroj. Jedno místo, kde PJ řídí **horní lištu (headline) světa**:

1. **Skryje systémové moduly** (`hiddenNavItems`) — už existuje rozptýleně, konsoliduje se sem.
2. **Postaví vlastní navigaci** (`customHeadline` — strom skupin + odkazů na stránky), která se **přidá** k systémové liště.
3. **Spravuje šablony menu** (`menuTemplates`) — pojmenované sady odkazů pro rychlé vložení do vlastní navigace.
4. **Nastaví „Last info" box** (`lastInfo`) — krátké oznámení PJ členům světa (proužek pod hlavičkou).

Promítá se do `WorldLayout` (krok 5.1) přes `PUT /worlds/:worldId/settings`.

---

## 2. Výchozí stav (ověřeno v kódu 2026-06-03)

### Co JIŽ funguje
- **BE `world-settings` kompletní** — schema/DTO/service pro `hiddenNavItems`, `customHeadline` (`HeadlineNode[]`), `menuTemplates` (`MenuTemplate[]`). Role gate `canAdminWorld` (world PJ+ / globální Admin+). Endpoint `GET|PUT /worlds/:worldId/settings`.
- **`hiddenNavItems` — živé** v `NavVisibilityTab` (`/svet/:slug/nastaveni#navigace`): checkbox seznam, ukládá přes `useUpdateWorldSettings`. SSOT `worldNavConfig.ts` (`HIDEABLE_NAV_ITEMS`, `isNavItemHidden`).
- **`WorldLayout`** — `buildNav()` staví skupiny, `filterNavByHidden()` aplikuje `hiddenNavItems`. **NEbere v potaz `customHeadline` ani `lastInfo`.**
- **Vzor PJ-only stránky** — `CalendarConfigsPage`, `PagesAdminPage` (dvoupanel, `WorldMembershipGuard minWorldRole=PJ`).

### Co CHYBÍ
- **FE typy** — `WorldSettings` (src/shared/types) ani `UpdateWorldSettingsInput` neobsahují `customHeadline`, `menuTemplates`, `lastInfo`. BE první dvě umí; `lastInfo` zatím neexistuje **nikde**.
- **BE pole `lastInfo`** — schema + DTO. Jediná BE dostavba kroku.
- **Stránka `/svet/:slug/admin/headline`** + render `customHeadline`/`lastInfo` ve `WorldLayout`.

---

## 3. Rozhodnutí (závazná)

### R1 — Konsolidace `hiddenNavItems`
Skrývání modulů se **přesune** z `NavVisibilityTab` na novou stránku jako sekce „Viditelnost modulů". `NavVisibilityTab` v `WorldSettingsPage` se **nahradí odkazem** na `/svet/:slug/admin/headline` (ne dvojkolejné UI). *Princip jako 12.1 konsolidace.*

### R2 — `customHeadline` je **aditivní**
Vlastní skupiny/odkazy se **přidají za** systémovou navigaci (po skrytí modulů). PJ nemůže ztratit přístup k esenciálům. `WorldLayout` po `filterNavByHidden` připojí převedený `customHeadline`.

### R3 — `lastInfo` = jednoduchý text + viditelnost
BE pole `lastInfo: { text: string; updatedAt: Date } | null`. FE: textarea (max 280 znaků, plain text), přepínač zobrazit/skrýt. Render: dismissible proužek pod hlavičkou `WorldLayout`, viditelný **všem členům**. Dismiss je klientský (localStorage per `worldId`+`updatedAt`) — nová zpráva se objeví znovu.

### R4 — `menuTemplates`
Pojmenovaná sada odkazů (`{ name, items: [{label, href, order?}] }`). UX: PJ vytvoří šablonu, tlačítkem „Vložit do navigace" rozbalí její položky jako novou skupinu do `customHeadline`. *Šablony = produktivita, ne další render surface.*

### R5 — Odkazy v `customHeadline`/`menuTemplates`
Odkaz cílí na **stránku světa** (relativní `to`/`href`, např. `/svet/:slug/stranky/<slug>`) nebo libovolnou interní cestu. Výběr stránky přes existující page directory (autocomplete), s možností ručního zadání cesty. Externí URL (http) povolené, render s ↗.

---

## 4. Funkční rozsah

### 12.2a — FE/BE typy + BE pole `lastInfo`
- BE: `world-settings.schema.ts` + `update-world-settings.dto.ts` + interface → `lastInfo`.
- FE: `WorldSettings` + `UpdateWorldSettingsInput` → `customHeadline`, `menuTemplates`, `lastInfo`. Nové typy `HeadlineNode`, `MenuTemplate`, `LastInfo` v `src/shared/types`.

### 12.2b — Stránka `/svet/:slug/admin/headline`
- Route v `router.tsx` (`WorldMembershipGuard minWorldRole=PJ`, fallback Admin/Superadmin) mezi `admin/kalendare` a `:slug`.
- Layout: vlevo sekce editoru (akordeon/karty), vpravo **živý náhled** headline lišty (desktop) / náhled nahoře (mobil).
- Sekce:
  1. **Viditelnost modulů** — přesun `NavVisibilityTab` logiky (checkbox/eye toggle dle `HIDEABLE_NAV_ITEMS`).
  2. **Vlastní navigace** — tree builder `customHeadline`: přidat skupinu / odkaz, přejmenovat, smazat, řadit (nahoru/dolů), zanořit odkaz do skupiny.
  3. **Šablony menu** — CRUD `menuTemplates` + „Vložit do navigace".
  4. **Last info** — textarea + viditelnost + náhled proužku.
- Jediné „Uložit" (dirty-tracking), `useUpdateWorldSettings` rozšířené o nové fieldy. Optimistic invalidace.

### 12.2c — Render ve `WorldLayout`
- `appendCustomHeadline(nav, customHeadline)` — `HeadlineNode[]` → NavGroup (skupina = dropdown, list = top-level link). Připojí za `filterNavByHidden`. Desktop nav i mobilní drawer.
- `LastInfoBar` — proužek pod `<header>`, jen členové, dismissible (localStorage `ikaros.lastinfo.dismissed.<worldId>` = uložené `updatedAt`).

### 12.2d — `mobil-desktop` audit + `napoveda`
- Náhled na mobilu nad editorem; tree ovládání touch-friendly (≥44px terče).
- Nápověda: nová PJ stránka „Hlavní lišta světa".

---

## 5. Datové tvary

```ts
// src/shared/types
export interface HeadlineNode {
  id: string;
  label: string;
  isGroup: boolean;
  to?: string;            // odkaz (list node)
  children?: HeadlineNode[]; // pod-odkazy (group node)
}
export interface MenuTemplateItem { label: string; href: string; order?: number; }
export interface MenuTemplate { name: string; items: MenuTemplateItem[]; }
export interface LastInfo { text: string; updatedAt: string; visible: boolean; }
```

BE DTO `lastInfo`: `{ text @MaxLength(280), visible @IsBoolean }` (server doplní `updatedAt` při změně textu).

---

## 6. Mimo rozsah
- Drag&drop myší (jen tlačítka nahoru/dolů — touch-safe, jednodušší); D&D = budoucí vylepšení.
- Víceúrovňové zanoření (max 1 úroveň: skupina → odkazy), shoda s `HeadlineNode` v praxi.
- Per-role viditelnost vlastních položek (jen viditelné všem členům).
- WS real-time sync `lastInfo` (refetch při navigaci stačí; `world.settings.updated` event existuje, ale FE gateway pro něj řešit nebudeme).

---

## 7. Testy (cíl)
- BE: `lastInfo` upsert (set/clear), role gate (Hrac 403, PomocnyPJ 403, PJ ok).
- FE: convert `appendCustomHeadline`, tree operace (add/remove/reorder/nest), `isNavItemHidden` zachováno, LastInfoBar dismiss logika, dirty-tracking save.
