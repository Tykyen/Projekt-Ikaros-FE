# Spec 13.6 — Kontextová („in-situ") nápověda ve světě

**Status:** ✅ Realizováno (2026-06-06) — všechny dávky A–F. Bloky povýšeny do `@/shared/ui/help` (kromě `PermissionTable`/`ScreenshotSlot`/`IllustrationSlot`, které in-situ nepotřebuje → zůstaly v HelpPage). Modul `src/features/world/help/` (button/modal/toolbox + role-aware cheat-sheety) zapojen do dashboardu, taktické mapy i chatu. Build/testy(31)/lint:colors/eslint ✓.
**Rozsah:** FE only (`Projekt-ikaros-FE`). Žádné BE změny.
**Cíl uživatele:** „Někteří nečtou nápovědu." Dát hráčům i PJ pomoc **přímo v kontextu** — na úvodní straně světa, v taktické mapě a v chatu — aby věděli, co všechno mají k dispozici, a uměli to využít.
**Navazuje na:** [spec-13.5](spec-13.5-napoveda-redesign.md) (sada bloků + obsah o nástrojích světa).

---

## 1. Princip

- **Role-aware obsah všude.** PJ (PomocnyPJ+) vidí svoje nástroje **i** ty sdílené s hráči (má toho víc). Hráč (Hráč/Korektor) vidí svou podmnožinu. Jeden mechanismus, dvě sady obsahu, napříč všemi třemi vstupy.
- **In-situ = stručný cheat-sheet + odkaz na detail.** V kontextu (zvlášť na mapě v zápalu hry) chce člověk rychlou připomínku „co dělá které tlačítko / klávesa", ne encyklopedii. Každý in-situ vstup proto končí odkazem **„Plná nápověda →"** na `/ikaros/napoveda?sekce=svet`. Plný výklad zůstává tam (13.5), in-situ je zkratka.
- **Reuse, ne duplikace.** Stavíme na sadě bloků z 13.5.

## 2. Detekce role (existující)

`useWorldContext()` → `userRole: WorldRole | null`, `isPJ: boolean`
(`src/features/world/context/WorldContext.tsx`). Pořadí enumu:
`Zadatel < Ctenar < Hrac < Korektor < PomocnyPJ < PJ`.

Bucket pro obsah:
- **`pj`** = `userRole >= WorldRole.PomocnyPJ` (PomocnyPJ, PJ; + globální Admin/Superadmin jako na mapě).
- **`hrac`** = člen pod tím prahem (Hrac, Korektor; Čtenář vidí jen čtecí podmnožinu).

> Žádný server gate — jde o nápovědu, ne o data. Položky se jen filtrují podle role na FE.

## 3. Architektura

### 3a. Povýšení sady bloků do `@/shared/ui/help/`
Generické bloky z 13.5 (`HelpAccordion`+Sub, `InfoCard`+`InfoGrid`, `TagChip`, `TermGrid`,
`CalloutBox`, `StepList`, `PermissionTable`, `accents.ts`) **přesunout** z
`src/features/ikaros/pages/HelpPage/components/` do `src/shared/ui/help/`.
- CSS bloků přesunout z `HelpPage.module.css` do `src/shared/ui/help/Help.module.css`
  (sekce 13.5 si ponechají vlastní `HelpPage.module.css` třídy: `page/tabs/matrix/roleCard/faqItem/…`,
  které blokům slouží jako reuse základ — pozor na sdílené třídy `matrix*`, `roleCard*`, `callout`, `statusPill`;
  ty zůstávají v HelpPage a `PermissionTable` je dnes používá → buď je `PermissionTable` přenese s sebou,
  nebo se duplikuje minimální set do `Help.module.css`. Executor zvolí čistší.)
- `ScreenshotSlot`, `IllustrationSlot`, `media.ts` **zůstávají v HelpPage** (vázané na registr
  obrázků plné nápovědy; in-situ cheat-sheety je nepotřebují).
- Aktualizovat importy v `HelpPage/sections/*` na `@/shared/ui/help`.
- Akceptace dílčí: `/ikaros/napoveda` vypadá a funguje **identicky** jako po 13.5 (čistý refactor).

### 3b. Nový modul `src/features/world/help/`
```
src/features/world/help/
├── WorldHelpModal.tsx        # Modal (z @/shared/ui) + footer „Plná nápověda →"
├── WorldHelpButton.tsx       # „?" ikona-tlačítko (HelpCircle), jednotný vzhled
├── WorldToolboxPanel.tsx     # dashboard panel „Co máš po ruce" (role-aware)
├── content/
│   ├── TacticalMapHelp.tsx   # cheat-sheet mapy (role-aware)
│   └── ChatHelp.tsx          # cheat-sheet chatu (role-aware)
├── toolboxItems.ts           # data: nástroje světa { key, title, desc, icon, to, roles }
└── *.module.css
```

### 3c. Obsahový model (data-driven, role-aware)
```ts
type HelpAudience = 'pj' | 'hrac';
type ToolItem = {
  key: string;
  title: string;
  desc: string;          // 1 věta „co umí"
  icon: ReactNode;
  to?: string;           // route ve světě (klik naviguje)
  audience: HelpAudience[]; // kdo položku vidí; 'pj' = i sdílené s hráčem
};
```
Filtrování: hráč vidí `audience.includes('hrac')`; PJ vidí vše (`'pj'` ∪ `'hrac'`).

## 4. Tři vstupy

### 4.1 Úvodní strana světa — panel „Co máš po ruce"
- Umístění: [WorldDashboard.tsx](../../../src/features/world/pages/WorldDashboardPage/WorldDashboard/WorldDashboard.tsx) — nová sekce **pod** 3-sloupcovým gridem (plná šířka), aby nerozbila stávající grid-areas.
- Nadpis dle role: PJ → „Co máš jako PJ po ruce", hráč → „Co můžeš ve světě dělat".
- `InfoGrid` dlaždic (`InfoCard`) z `toolboxItems.ts` filtrovaných rolí; klik na dlaždici s `to` → `navigate`. Dlaždice bez `to` (např. „postava" když ji hráč nemá) jen informuje.
- Příklady položek:
  - **hrac+pj:** Postava (moje), Chat světa, Taktická mapa, Pavučina, Kalendář, Obchod, Stránky/Wiki, Bestiář (čtení).
  - **jen pj:** Storyboard, Generátor počasí, Deník PJ, Nastavení světa, Hlavní lišta, Správa stránek, Custom emoty, Šablona deníku, AKJ záložky.
- Patička panelu: „Plná nápověda →" na `/ikaros/napoveda?sekce=svet`.
- Default: panel viditelný (ne sbalený) — je to onboarding; volitelně collapsible přes `HelpAccordion`.

### 4.2 Taktická mapa — tlačítko „?"
- Umístění: `WorldHelpButton` poblíž `MapZoomControls` / v rohu viewportu ([TacticalMapView.tsx](../../../src/features/world/tactical-map/TacticalMapView.tsx)).
- Klik → `WorldHelpModal` (size `lg`) s `TacticalMapHelp` (role-aware):
  - **hrac:** pohyb vlastním tokenem, statbar postavy (Staty/Deník/Poznámky), hod kostkou (🎲), ping (dvojklik), iniciativa (kde jsem), počasí přepínač, „mapa skrytá/zamčená" stavy.
  - **pj navíc:** orchestrace scén, přiřazení hráčů, skrýt/zamknout mapu, spawn (drag/klik) PC/NPC/bestie, efekty, mlha války, vysílání počasí/hudby, zámek tokenu, Deník PJ.
- Forma obsahu: `HelpSubAccordion`/`TermGrid`/`CalloutBox` (klávesy a ikony). Viditelné pro **všechny** členy; obsah dle role.

### 4.3 Chat světa — tlačítko „?"
- Umístění: `WorldHelpButton` v hlavičce konverzace vedle Hledat/Přítomní ([ChannelView](../../../src/features/world/chat/components/)).
- Klik → `WorldHelpModal` (size `md`) s `ChatHelp` (role-aware):
  - **hrac:** psaní + Enter, odpověď s citací, emoji reakce, šepot, přílohy, editace vlastní zprávy, `@zmínka`, herní datum, hod kostkou + skiny, emoty `:zkratka:`, řazení kanálů (úchopka ⋮⋮), oblíbené.
  - **pj navíc:** zakládání kanálů/konverzací a přístupů, NPC mód, moderace (mazání), panel Přítomní.

## 5. Komponenty (API)

- `WorldHelpButton`: `{ onClick, label?, size? }` — ikona `HelpCircle`, `aria-label="Nápověda"`, jednotný vzhled napříč mapou/chatem.
- `WorldHelpModal`: `{ open, onClose, title, children }` — wrapper nad `@/shared/ui` `Modal`; patička vždy „Plná nápověda →" (`Link` na `/ikaros/napoveda?sekce=svet`, otevře v nové záložce nebo naviguje — executor zvolí; na mapě raději nová záložka, ať hráč nepřijde o scénu).
- `WorldToolboxPanel`: `{ }` — čte `useWorldContext`, vykreslí role-aware `InfoGrid`.
- `TacticalMapHelp` / `ChatHelp`: `{ audience: HelpAudience }` — čistě prezentační, testovatelné bez kontextu.

## 6. Akceptační kritéria

1. `@/shared/ui/help/` obsahuje povýšené bloky; `/ikaros/napoveda` funguje a vypadá identicky (regrese 0).
2. Dashboard: panel „Co máš po ruce" — PJ verze (víc dlaždic) i hráč verze (podmnožina); dlaždice s `to` navigují; patička odkazuje na plnou nápovědu.
3. Taktická mapa: „?" tlačítko viditelné všem členům; modal s role-aware cheat-sheetem; PJ vidí víc než hráč.
4. Chat: „?" tlačítko v hlavičce; modal s role-aware cheat-sheetem.
5. Žádný server gate; obsah filtrován podle `userRole` na FE; anonym/Žadatel panely/tlačítka neřeší (nemají přístup do světa).
6. Responsivní (mobil 375 / tablet / desktop) — panel i modaly; `mobil-desktop` audit ✓.
7. `npm run build` ✓, `eslint` dotčených ✓, `npm run lint:colors` bez nových nálezů, `npm run test:run` ✓.
8. Token-only, žádné hardcoded barvy.

## 7. Test plán

- `WorldToolboxPanel` — PJ vidí PJ-only položky, hráč ne; dlaždice s `to` má odkaz.
- `TacticalMapHelp` / `ChatHelp` — `audience='pj'` renderuje nadmnožinu oproti `'hrac'`.
- `WorldHelpModal` — otevře/zavře, patička míří na `/ikaros/napoveda?sekce=svet`.
- Smoke: dashboard s panelem, mapa s „?", chat s „?" se vyrenderují bez chyby.
- Regrese: stávající `HelpPage.spec` + `blocks.spec` po přesunu do shared dál procházejí.

## 8. Plán realizace po dávkách

- **Dávka A — Povýšení bloků do `@/shared/ui/help/`** (čistý refactor; `/napoveda` beze změny chování). Nech odsouhlasit jako mezikrok — je to základ pro zbytek.
- **Dávka B — `world/help` infrastruktura:** `WorldHelpButton`, `WorldHelpModal`, `toolboxItems.ts`, role model + testy.
- **Dávka C — Dashboard panel** (PJ + hráč varianta).
- **Dávka D — Taktická mapa „?"**.
- **Dávka E — Chat „?"**.
- **Dávka F — dotažení:** `mobil-desktop`, `build`, kontrola skill `napoveda` (in-situ nápověda = nový koncept → zmínit ve FAQ/Start plné nápovědy).

---

> Po schválení spec: impl. plán Dávky A → potvrzení → kód.
