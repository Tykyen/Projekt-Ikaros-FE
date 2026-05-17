# Spec 5.3 — Nastavení světa (`/svet/:worldSlug/nastaveni`)

**Status:** ✅ Schváleno (2026-05-17) — AKJ úrovně přesunuty na PomocnyPJ+ (nový BE endpoint)
**Rozsah:** FE (nová plná stránka, ~6 tab panelů, nová `Tabs` komponenta, mutation hooky) + **BE zásahy** (DTO fix + nový AKJ endpoint + populace jmen členů — §8)
**Větev:** `feat/krok-5.3-world-settings` (odbočí z `feat/krok-5.0-world-theme`)
**Velikost:** odhad ~35–40 souborů / ~2200 ř. (velký krok — 6 tabů + theme editor)
**Autor:** PJ + Claude
**Datum:** 2026-05-17
**Souvisí:** [spec-5.0.md](./spec-5.0.md) (theme infra), [spec-5.1.md](./spec-5.1.md) (WorldLayout shell, `WorldStubPage`), [spec-2.3.md](../phase-2/spec-2.3.md) (formulář vytvoření světa — reuse sekcí), roadmapa `docs/roadmap-fe.md` ř. 863–873

---

## 1. Cíl

Nahradit stub `WorldSettingsPage` plnou stránkou **Nastavení světa** — tabové rozhraní, kde správci světa upravují metadata, přístupový režim, členy, AKJ úrovně a vzhled, a kde si kterýkoli člen může nastavit odchod ze světa.

Stránka pokrývá podsekce roadmapy **5.3a–5.3g**:

| Tab | Podsekce | Endpoint | Minimální role |
|---|---|---|---|
| Základní info | 5.3a | `PATCH /worlds/:id` | Korektor+ |
| Přístup | 5.3b | `PATCH /worlds/:id` | Korektor+ |
| Členové | 5.3c | `PATCH .../members/:id/role\|group\|akj`, `PUT .../settings` (barvy skupin) | PomocnyPJ+ (barvy skupin PJ+) |
| AKJ úrovně | 5.3d | `PUT /worlds/:worldId/settings/akj-types` (nový BE endpoint) | PomocnyPJ+ |
| Vzhled | 5.3f | `PATCH /worlds/:id` | Korektor+ |
| Členství | 5.3e | `DELETE .../members/:membershipId` | Čtenář+ (ne PJ) |

5.3g (`mobil-desktop` audit + `napoveda`) je úklidová podsekce, ne tab.

---

## 2. Kontext / motivace

- `/svet/:worldSlug/nastaveni` dnes renderuje `WorldStubPage` („dostupné s krokem 5.3"). Route i `memberOnly` guard (Čtenář+) stojí z 5.1.
- BE modul `worlds` je **kompletní** — všechny potřebné endpointy existují (`PATCH /worlds/:id`, `GET/PUT /worlds/:worldId/settings`, member endpointy, `DELETE` membership). Žádné nové endpointy. **Jediný BE zásah:** oprava jednoho validačního dekorátoru (viz §3.4 a §8).
- Theme infrastruktura z 5.0 stojí (`applyTheme`, `useWorldTheme`, `listThemes`, registry 21 motivů). 5.3f je **editor UI** nad ní — runtime část (`themeOverrides`, `themeBackgroundUrl`) z 5.0d hotová.
- Krok 5.2 (world dashboard) i fáze 6+ na tuto stránku odkazují (dice picker čte `World.dice` editovatelný v 5.3a).

---

## 3. Audit současného stavu

### 3.1 FE — co je hotové a reusovatelné

- **Sekční komponenty z `CreateWorldPage`** (`src/features/ikaros/pages/CreateWorldPage/components/`) — `BasicInfoSection`, `GenreSection`, `PlayersSection`, `AccessModeSection`, `SystemSection`, `ThemeSection`, `SectionCard`, `PillChips`. Všechny řízené přes `value` + `onXyzChange` props → použitelné v edit formuláři. Constants: `genres.ts` (32 žánrů + `themeForGenre`), `systems.ts` (13), `dice.ts` (13), `tones.ts` (24).
- **Theme** — `applyTheme(id, { overrides, backgroundUrl })`, `useWorldTheme(world)`, `listThemes('world')`, `THEMES` registry, `worldThemeOverridesAtom`. `WorldThemeSwitcher` (header popover — per-uživatel override).
- **accessMode** — `src/features/world/lib/accessMode.ts` → `ACCESS_LABELS`, `accessModeLabel(mode)`.
- **API** — `useWorld(worldKey)`, `useMyWorlds()`. **Chybí** mutation hook pro `PATCH /worlds/:id` a member endpointy.
- **Upload** — `useUploadContentImage()` → `POST /upload/content-image` → `{ url, publicId, width, height }`. Volně přihlášený uživatel.
- **shared/ui** — `Button`, `Input`, `Modal`, `ConfirmDialog`, `Card`, `Badge`, `Spinner`, `UserAvatar`, `WorldRoleIcon`, `KebabMenu`. **Chybí `Tabs`.**
- **react-hook-form + zod** nainstalované; pattern v `RegisterModal`. `CreateWorldPage` používá vlastní `useState` — nový edit formulář bude **RHF + zod** (řízené sekce z CreateWorldPage to umožní — berou `value`/`onChange`).
- **WorldContext** — `worldId`, `worldSlug`, `world`, `isPJ`, `userRole`, `loading`.
- **Router** — `src/app/router.tsx`, route `nastaveni` = `memberOnly(WorldSettingsPage)` (Čtenář+, `WorldMembershipGuard`).

### 3.2 BE — relevantní endpointy (audit potvrdil kompletnost)

- `PATCH /worlds/:id` — `UpdateWorldDto` (name, description, imageUrl, genre, tones, playersWanted, playerCount, maxPlayers, dice, system, isActive, accessMode, themeId, themeOverrides, themeBackgroundUrl). Guard `canEditWorldData` = **Korektor+**. `themeOverrides` BE sanituje (jen `--theme-` prefix, hodnota ≤ 200 znaků, ≤ 60 položek).
- `GET /worlds/:worldId/settings` — member-only → `WorldSettings`. `PUT` — `UpdateWorldSettingsDto`, guard `canAdminWorld` = **PJ+**. Relevantní pole: `groupColors: Record<string,string>`, `customGroups: string[]`, `akjTypes: AkjType[]` (`{ key, name, level }`).
- `GET /worlds/:id/members?role=&group=` → `WorldMembership[]` (`id, userId, worldId, role, joinedAt, avatarUrl?, characterPath?, group?, isFree?, akj`).
- `PATCH .../members/:membershipId/role` — `UpdateMemberRoleDto`, guard `canManageMembers` = **PomocnyPJ+**.
- `PATCH .../members/:membershipId/group` — `UpdateMemberGroupDto { group? }`, **PomocnyPJ+**.
- `PATCH .../members/:membershipId/akj` — `UpdateMemberAkjDto { akj: 0–999999 }`, **PomocnyPJ+**.
- `DELETE .../members/:membershipId` — self **nebo** `canManageMembers`. **PJ se nemůže odebrat/odejít.**
- Upload: `POST /upload/image` je **Admin/Superadmin only** → pro hero světa **nepoužitelný**; používá se `POST /upload/content-image`.

### 3.3 Role — hierarchie (potvrzeno BE auditem)

`WorldRole`: `Zadatel=0`, `Ctenar=1`, `Hrac=2`, `Korektor=3`, `PomocnyPJ=4`, `PJ=5`.
BE permission gates: `canEditWorldData` ≥ Korektor, `canManageMembers` ≥ PomocnyPJ, `canAdminWorld` ≥ PJ. Globální Admin/Superadmin obchází vše.

### 3.4 Nesrovnalosti zjištěné auditem

1. **Roadmapa zjednodušuje na „vše PJ+"** — realita BE je jemnější (Korektor edituje metadata, PomocnyPJ spravuje členy). **Rozhodnutí autora (2026-05-17): FE respektuje BE hierarchii** — taby se zobrazují/skrývají podle role.
2. **`UpdateMemberRoleDto` bug** — `@IsIn([-1, 0, 1, 2, 3, 5])`: chybí `4` (PomocnyPJ), obsahuje legacy `-1` (zrušený „Pending" po migraci D-053). **Rozhodnutí autora: opravit BE DTO** na `@IsIn([0, 1, 2, 3, 4, 5])` — viz §8.
3. **Hero upload** — roadmapa odkazuje `POST /upload/image` (Admin-only). Použije se `POST /upload/content-image`.
4. **Transfer ownershipu světa** — BE endpoint **neexistuje**. PJ leave proto zůstává mimo rozsah 5.3 (roadmapa to tak má — leave je Čtenář+, ne PJ). Transfer = budoucí dluh **D-NEW-world-transfer**.
5. **`GET /worlds/:id/members` vrací jen `WorldMembership`** bez jmen — ověřeno v `worlds.service.getMembers` (vrací holé `membershipRepo.findByWorldId`). Tabulka členů 5.3c potřebuje jména → **BE zásah** §8.3 (populace user summary, analogická existující `enrichWithOwner`).

---

## 4. Návrh řešení

### 4.0 Struktura souborů

```
src/features/world/pages/WorldSettingsPage/
├── WorldSettingsPage.tsx            ← orchestrator: načtení světa, role gate, Tabs
├── WorldSettingsPage.module.css
├── index.ts
├── tabs/
│   ├── BasicInfoTab.tsx             ← 5.3a — RHF formulář metadat + hero upload
│   ├── AccessModeTab.tsx            ← 5.3b — accessMode přepínač
│   ├── MembersTab.tsx               ← 5.3c — tabulka členů + barvy skupin
│   ├── AkjTab.tsx                   ← 5.3d — editor AKJ úrovní
│   ├── ThemeTab.tsx                 ← 5.3f — preset selektor + custom editor
│   ├── MembershipTab.tsx            ← 5.3e — odchod ze světa
│   └── *.module.css
├── components/
│   ├── MemberRow.tsx                ← řádek tabulky členů (role/group/akj editory)
│   ├── GroupColorEditor.tsx         ← barvy skupin (groupColors)
│   ├── AkjLevelEditor.tsx           ← seznam AKJ úrovní (add/edit/remove/reorder)
│   ├── ThemePresetGrid.tsx          ← mřížka 21 motivů (radiogroup)
│   ├── ThemeCustomEditor.tsx        ← color pickery + upload pozadí + kontrast guard
│   └── *.module.css
├── lib/
│   ├── worldSettingsSchema.ts       ← zod schémata (basic info, akj)
│   ├── themeTokens.ts               ← katalog editovatelných --theme-* tokenů
│   └── contrastGuard.ts             ← výpočet kontrastního poměru (WCAG)
└── __tests__/

src/features/world/api/
├── useUpdateWorld.ts                ← PATCH /worlds/:id
├── useWorldMembers.ts               ← GET /worlds/:id/members
├── useUpdateMember.ts               ← PATCH .../members/:id/{role,group,akj}
├── useRemoveMember.ts               ← DELETE .../members/:membershipId
├── useWorldSettings.ts              ← GET /worlds/:worldId/settings
└── useUpdateWorldSettings.ts        ← PUT /worlds/:worldId/settings

src/shared/ui/Tabs/
├── Tabs.tsx                         ← nová generická tab komponenta
├── Tabs.module.css
└── index.ts
```

### 4.1 Orchestrátor + role gating

`WorldSettingsPage` (uvnitř `WorldLayout`, route už existuje):

1. `useWorldContext()` → `world`, `userRole`, `worldId`, `loading`.
2. Spočítá viditelné taby podle `userRole` (globální Admin/Superadmin = jako PJ):

   | Tab | Podmínka viditelnosti |
   |---|---|
   | Základní info | `userRole ≥ Korektor` |
   | Přístup | `userRole ≥ Korektor` |
   | Členové | `userRole ≥ PomocnyPJ` |
   | AKJ úrovně | `userRole ≥ PomocnyPJ` |
   | Vzhled | `userRole ≥ Korektor` |
   | Členství | vždy (Čtenář+) |

3. Aktivní tab = první viditelný; volitelně přes URL hash (`#clenove`) — řeší impl. plán, default první tab.
4. Čtenář / Hráč (role < Korektor) vidí **jen tab Členství** → stránka funguje jako „odejít ze světa".
5. Loading → `Spinner`; `world == null` → `WorldNotFound`.

> 💡 **Proč gating na FE i když BE chrání:** BE vždy odmítne neoprávněný zápis (403). FE gate je čistě UX — nemá smysl ukazovat Čtenáři formulář, který mu BE stejně neuloží. Bezpečnost stojí na BE, ne na skrytém tabu.

### 4.2 `Tabs` komponenta (nová, `shared/ui`)

Generická, bezstavová-řízená:

```ts
interface TabItem { id: string; label: string; icon?: ReactNode; }
interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  children: ReactNode;        // panel aktivního tabu
  orientation?: 'horizontal' | 'vertical';  // default horizontal
}
```

- ARIA: `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, klávesy ←/→ (resp. ↑/↓).
- **Mobil (≤ 768):** horizontální taby → scrollovatelný řádek, nebo `<select>` fallback — rozhodne `mobil-desktop` audit. Touch target ≥ 44 px.
- Skin tokeny, žádné hardcoded barvy.

### 4.3 Tab 5.3a — Základní info

RHF + zod formulář; **reuse řízených sekcí z `CreateWorldPage`** (`BasicInfoSection` bez slug-availability — slug se needituje, je v URL, viz níže; `GenreSection`, `PlayersSection`, `SystemSection`). Sekce dostanou prefill z `world` a RHF `onChange` handlery.

Editovatelná pole → `PATCH /worlds/:id`:
- `name`, `description`, `genre` (+ custom), `system` (+ custom), `dice`, `maxPlayers`, `playersWanted`, `imageUrl` (hero).
- **Tóny** — UI bylo vypnuto v 2.3 (2026-05-14); zůstává vypnuté i zde (pole v BE žije dál).

**Slug** — needitovatelný. Slug je v URL a změna by rozbila odkazy; zobrazí se read-only („Adresa: `/svet/<slug>`"). Změna slugu = budoucí dluh **D-NEW-slug-rename** (vyžaduje redirect strategii).

**Hero obrázek** — nahrání přes `useUploadContentImage()`; náhled aktuálního `imageUrl`, tlačítko „Nahrát"/„Odebrat". Po uploadu se `url` zapíše do RHF pole `imageUrl` a uloží s formulářem.

> ⚠️ **`genre` vs. `themeId`:** Změna žánru v tomto tabu **nepřenastaví** motiv světa. Svět už existuje, motiv je explicitní volba v tabu Vzhled. Auto-odvození žánr→motiv platí jen při zakládání světa (5.0f).

Submit → `useUpdateWorld` → toast „Změny uloženy", invalidace `['worlds', ...]`.

### 4.4 Tab 5.3b — Přístup

`accessMode` přepínač — single-select chips (reuse `PillChips` stylu, čtyři možnosti vč. `closed`). Pod aktivní volbou panel s vysvětlením dopadu na join flow:

- **Veřejný** (`public`) — kdokoli vidí, vstup okamžitý (role Čtenář).
- **Veřejný se schválením** (`open`) — kdokoli vidí, vstup přes žádost schválenou PJ.
- **Soukromý** (`private`) — vidí jen členové a žadatelé; vstup přes žádost.
- **Uzavřený** (`closed`) — svět zamčený, nikdo nový nevstoupí (ani žádostí).

Uloží `PATCH /worlds/:id` s `accessMode`. Samostatný tab (ne součást 5.3a) — je to citlivá změna, vlastní „Uložit" + potvrzení při přechodu na `closed`.

### 4.5 Tab 5.3c — Členové

Tabulka členů (`useWorldMembers` → `GET /worlds/:id/members`):

- Sloupce: avatar + jméno, role, skupina, AKJ úroveň, datum vstupu, akce.
- **Role** — `<select>` (`MemberRow`), `WorldRole` 0–5 s českými labely; uloží `PATCH .../members/:id/role`.
- **Skupina** — `<select>` z `WorldSettings.customGroups` + „bez skupiny"; uloží `.../group`.
- **AKJ úroveň** — number/`<select>` napojené na definované `akjTypes` (viz 5.3d); uloží `.../akj`.
- **Akce** — odebrat člena (`ConfirmDialog` → `DELETE .../members/:id`).

**Hierarchická omezení (FE, BE je vynutí taky):**
- PJ nemůže demotovat ani odebrat **sám sebe** (jediná cesta z PJ = transfer, který neexistuje → tlačítka disabled s tooltipem).
- Povýšení na PJ (`role = 5`) → `ConfirmDialog` s varováním „Svět bude mít více PJ" (BE transfer ownershipu nemá — `ownerId` se nemění; vznikne druhý PJ).
- PomocnyPJ nemůže měnit roli členů s rolí ≥ vlastní — řeší BE; FE zobrazí disabled.

**Barvy skupin** — `GroupColorEditor` v rámci tohoto tabu, ale **gated na PJ+** (ukládá `PUT .../settings` → `groupColors`). Mapuje název skupiny → hex barva. Pro PomocnyPJ se editor barev skryje (vidí jen tabulku členů).

> 📚 **Skupina** = volné textové označení party/frakce ve světě (`customGroups`); barva slouží k vizuálnímu odlišení v chatu/seznamech.

### 4.6 Tab 5.3d — AKJ úrovně

`AkjLevelEditor` nad `WorldSettings.akjTypes` (`{ key, name, level }[]`). **PomocnyPJ+** přes **nový dedikovaný BE endpoint** `PUT /worlds/:worldId/settings/akj-types` (viz §8).

- Seznam úrovní seřazený dle `level`. Každá: `name` (editovatelný — PJ/PomocnyPJ pojmenuje dle světa), `level` (číslo), `key` (interní identifikátor, auto z názvu nebo skrytý).
- Akce: přidat úroveň, přejmenovat, smazat, změnit `level`.
- Vysvětlující panel: „AKJ = stupňovaná prověrka. Určuje, které wiki stránky hráč uvidí (krok 7.2e). Přiřazení úrovně členům → tab Členové."
- Uloží celé pole `akjTypes` přes `PUT /worlds/:worldId/settings/akj-types`.

> 💡 **Proč dedikovaný endpoint:** `PUT /worlds/:worldId/settings` je gatovaný na PJ+ a sahá na 8 polí (skryté menu, šablony, měny, diary schema…). Aby AKJ definici zvládl i PomocnyPJ bez toho, aby dostal celý settings, dostává AKJ vlastní endpoint s guardem `canManageMembers` (PomocnyPJ+). Zbytek settings zůstává PJ-only.

### 4.7 Tab 5.3f — Vzhled

Dvě části:

**A) Preset selektor** — `ThemePresetGrid`: mřížka `listThemes('world')` (21 motivů), radiogroup, thumbnaily. Výběr presetu nastaví `themeId`.

**B) Custom editor** — `ThemeCustomEditor` (rozbalitelný „Upravit barvy"):
- Katalog editovatelných tokenů `themeTokens.ts` — podmnožina `--theme-*`:
  - **Čisté barvy** (hex picker): `--theme-text`, `--theme-text-muted`, `--theme-heading`, `--theme-accent`, `--theme-accent-bright`, `--theme-accent-cyan`.
  - **Vrstvy s průhledností** (hex picker + alpha slider → `rgba()`): `--theme-surface`, `--theme-surface-strong`, `--theme-border`, `--theme-shadow`, `--theme-glow-gold`.
  - Gradienty (`--theme-bg-overlay`, `--theme-nav-active-bg`) **mimo rozsah editoru** — příliš složité na picker; ponechány z presetu.
- **Upload vlastního pozadí** — `useUploadContentImage()` → `themeBackgroundUrl`.
- **Živý náhled** — editor volá `applyTheme(themeId, { overrides, backgroundUrl })` při změně (debounced) → uživatel vidí výsledek okamžitě.
- **Kontrast guard** (`contrastGuard.ts`) — počítá WCAG kontrastní poměr `--theme-text` proti `--theme-surface`. Poměr < 4.5:1 → varování „Text může být na pozadí špatně čitelný" (neblokuje uložení, jen upozorní).
- „Zpět na preset" — vyčistí `themeOverrides` + `themeBackgroundUrl`.

Uloží `PATCH /worlds/:id` s `themeId` / `themeOverrides` / `themeBackgroundUrl`. BE sanituje overrides (`--theme-` prefix, ≤ 200 znaků/hodnota, ≤ 60 položek) — FE drží stejné limity, aby uživatel nedostal tichý drop.

> ⚠️ **Náhled vs. uživatelský override:** `useWorldTheme` má per-uživatel override (5.0e, localStorage). Náhled v editoru ukazuje **sdílený základ světa** (to, co PJ ukládá), ne lokální override editujícího. Po opuštění tabu bez uložení se musí motiv vrátit do stavu před editací — řeší impl. plán (cleanup ve `useEffect`).

### 4.8 Tab 5.3e — Členství (odchod ze světa)

Viditelný všem (Čtenář+):
- Karta „Odejít ze světa" — popis důsledku, tlačítko → `ConfirmDialog` → `DELETE .../members/:membershipId` (vlastní `membershipId` z `useMyWorlds` nebo membership v kontextu).
- Po úspěchu: invalidace `useMyWorlds`, redirect `/`, toast „Opustil jsi svět «{name}»".
- **PJ** — tlačítko disabled, vysvětlení: „Jako PJ nemůžeš svět opustit. Musíš ho předat jinému PJ (zatím nedostupné) nebo smazat." → uzavírá D-064.

### 4.10 Vizuální vrstva — směr „Velitelský pult"

Design audit (`frontend-design`, 2026-05-17). Stránka žije uvnitř světového motivu — **veškerá barevnost dědí z aktivního theme**, žádná vlastní paleta. Audit proto řeší **strukturu a charakter**, ne barvy. Navazuje na vizuální jazyk `CreateWorldPage` (karty `SectionCard`, pill chips, `fadeUp` reveal).

**Koncept:** Nastavení = řídicí konzole světa, ne další formulář. Vertikální rejstřík tabů + panel obsahu.

- **Tab rejstřík** — desktop: vertikální sloupec ~220 px vlevo, `position: sticky`. Každý tab = ikona (`lucide-react`: `Settings` / `ShieldHalf` / `Users` / `Eye` / `Palette` / `DoorOpen`) + label.
  - Aktivní tab: pozadí `var(--theme-nav-active-bg)` (gradient token **už existuje** pro nav v headeru — reuse = konzistence), levý 3px proužek `var(--accent)`, text `var(--accent-bright)`.
  - Hover: `var(--theme-nav-hover-bg)`. Focus-visible: `outline: 2px solid var(--accent)`.
  - Mobil (≤ 768): rejstřík → horizontálně scrollovatelná lišta nad obsahem, pill-style (reuse `PillChips` vzhledu), aktivní = accent fill. Touch ≥ 44 px.
- **Panel obsahu** — karty v jazyce `SectionCard` (`border: 1px solid var(--frame-border)`, `border-radius: 12px`, `background: var(--surface-2)`, `box-shadow: var(--shadow-md)`). Titulky uppercase, `letter-spacing: 0.08em` (jako `SectionCard .title`).
- **Tabulka členů** — žádná syrová `<table>`. Desktop: řádky oddělené `var(--frame-border)` dividery, `UserAvatar` + jméno + `WorldRoleIcon`, inline editory (`<select>` role/skupina, number AKJ) zarovnané do mřížky. Mobil: každý řádek → vertikální karta (páry „label: hodnota" stacked, editory plná šířka).
- **Theme editor** — dvoupanelové rozložení:
  - Levý panel: katalog tokenů, řádek = `název | swatch <input type=color> | hex textinput`; alpha tokeny navíc `<input type=range>` 0–100 %.
  - Pravý panel: **živý náhled** — mini ukázka (panel, nadpis, tělo textu, tlačítko, akcent) renderovaná s aktuálními overrides; `position: sticky` aby zůstala při scrollu.
  - Kontrast guard: badge u náhledu — `var(--success)` „✓ kontrast OK" / `var(--warning)` „⚠ poměr 3.1:1".
  - Preset grid: thumbnaily 21 motivů, radiogroup; aktivní preset má rámeček `var(--accent)` + jemný glow (`box-shadow` s `--theme-glow-gold`).
- **Motion** — přepnutí tabu: `fadeUp` panelu (reuse keyframes z `SectionCard.module.css`, `animation-delay` stagger po kartách). Respekt `prefers-reduced-motion: reduce`.
- **Tokeny only** — žádný hardcoded barevný literál (`lint:colors` ✓). Stíny/glow přes `--shadow-*` / `--theme-glow-*`.

> 🔀 **Alternativa (zamítnuta):** horizontální taby nad obsahem. Při 6 tabech s různou viditelností dle role by se šířka lišty měnila a na tabletu lámala. Vertikální rejstřík je stabilní a škáluje (settings-pattern z GitHubu/Linearu).

### 4.9 mobil-desktop + nápověda (5.3g)

- Po vizuální hotovosti spustit skill `mobil-desktop` na celou stránku (taby, tabulka členů, theme editor — mobil ≤ 768 / tablet / desktop).
- Skill `napoveda` — přidat na `/ikaros/napoveda` popis stránky Nastavení světa a sekci světových rolí (Korektor / PomocnyPJ / PJ — kdo co v nastavení smí).

---

## 5. Out of scope

- **Transfer ownershipu světa** (`ownerId` na jiného uživatele) — BE endpoint neexistuje. Dluh **D-NEW-world-transfer**.
- **Smazání světa** z UI — `DELETE /worlds/:id` na BE existuje, ale roadmapa 5.3 destrukci světa neuvádí; samostatné rozhodnutí.
- **Změna slugu** — read-only; dluh **D-NEW-slug-rename**.
- **Headline / menu builder** (`customHeadline`, `hiddenNavItems`, `menuTemplates`) — fáze 12.2.
- **Měny světa** (`currencies`) — krok 11.4.
- **Kalendář / diary schema** (`calendarConfig`, `diarySchema`) — fáze 9 / taktická mapa.
- **Použití AKJ na stránce** (`accessRequirements`) — krok 7.2e. 5.3d jen definuje úrovně.
- **Gradient tokeny v theme editoru** — ponechány z presetu.
- **Tóny** světa — UI vypnuté od 2.3.

---

## 6. Acceptance kritéria

### BE
1. `UpdateMemberRoleDto` `@IsIn` opraveno na `[0, 1, 2, 3, 4, 5]`; existující testy zelené; +1 test (promote na PomocnyPJ projde, `-1` odmítnuto).
1b. Nový endpoint `PUT /worlds/:worldId/settings/akj-types` (guard PomocnyPJ+) ukládá `akjTypes`; +2 testy (PomocnyPJ uloží, Hráč dostane 403).
1c. `GET /worlds/:id/members` vrací `user: { id, username, avatarUrl }` per člen; +1 test.

### FE — obecné
2. `/svet/:worldSlug/nastaveni` renderuje tabovou stránku; stub nahrazen.
3. Taby se zobrazují podle role: Čtenář/Hráč vidí jen „Členství"; Korektor navíc Základní info / Přístup / Vzhled; PomocnyPJ navíc Členové a AKJ úrovně. Globální Admin = jako PJ.
4. Nová `Tabs` komponenta v `shared/ui` — ARIA tablist, klávesová navigace.

### FE — 5.3a Základní info
5. Formulář prefilled z `world`; uloží `PATCH /worlds/:id`; toast + invalidace cache.
6. Slug read-only. Hero upload přes `/upload/content-image`, `url` → `imageUrl`.
7. Změna `genre` nezmění `themeId`.

### FE — 5.3b Přístup
8. Přepínač 4 režimů s vysvětlením; uloží `accessMode`; přechod na `closed` potvrzen dialogem.

### FE — 5.3c Členové
9. Tabulka členů z `GET /worlds/:id/members`; jména členů zobrazena (viz §9).
10. Změna role/skupiny/AKJ uloží příslušný `PATCH`; PJ nemůže demotovat/odebrat sebe (disabled); promote na PJ potvrzen dialogem.
11. Barvy skupin (`GroupColorEditor`) viditelné jen PJ+.

### FE — 5.3d AKJ
12. Přidat/přejmenovat/smazat/seřadit AKJ úroveň; uloží `PUT .../settings/akj-types`; tab viditelný PomocnyPJ+.

### FE — 5.3f Vzhled
13. Preset grid 21 motivů; výběr nastaví `themeId`.
14. Custom editor — hex pickery + alpha slidery, živý náhled přes `applyTheme`, upload pozadí; uloží `themeOverrides`/`themeBackgroundUrl`.
15. Kontrast guard varuje při poměru < 4.5:1 (neblokuje).
16. Opuštění tabu bez uložení vrátí motiv do původního stavu.

### FE — 5.3e Členství
17. Odchod ze světa (Čtenář+) — confirm, `DELETE`, redirect `/`, invalidace `useMyWorlds`. PJ má tlačítko disabled s vysvětlením. Uzavírá D-064.

### Build / lint / test
18. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓. Žádný hardcoded barevný literál.
19. FE +~25 testů; BE +1 test.
20. `mobil-desktop` audit (≤ 768 / tablet / desktop). `napoveda` aktualizace.

---

## 7. Test plán

### BE
- `UpdateMemberRoleDto` — role `4` projde, `-1` odmítnuto.

### FE (Vitest + RTL)
- `WorldSettingsPage` — gating: render tabů pro Čtenáře / Korektora / PomocnyPJ / PJ.
- `Tabs` — přepínání, ARIA, klávesy ←/→.
- `BasicInfoTab` — prefill, submit volá `useUpdateWorld` s diffem.
- `AccessModeTab` — změna režimu, confirm na `closed`.
- `MembersTab` / `MemberRow` — změna role, self-demote PJ disabled, promote-PJ confirm.
- `AkjLevelEditor` — add/rename/remove/reorder.
- `ThemeCustomEditor` — token edit volá `applyTheme`; cleanup po unmount.
- `contrastGuard` — poměr pro známé páry barev (WCAG referenční hodnoty).
- `MembershipTab` — leave flow; PJ disabled.

### Manuální smoke
- Vstup jako PJ → všech 6 tabů; jako Hráč → jen Členství.
- Editace metadat → reload → změny drží.
- Theme editor → změna barvy → živý náhled → uložit → reload jiným uživatelem vidí změnu.
- Leave world → redirect `/`, svět zmizí z „Moje světy".

---

## 8. BE změny (mimo FE repo)

Dva zásahy v BE repu (`backend/src/modules/worlds/`):

### 8.1 Fix `UpdateMemberRoleDto`

Soubor `dto/update-member.dto.ts`:

```diff
- @IsIn([-1, 0, 1, 2, 3, 5])
+ @IsIn([0, 1, 2, 3, 4, 5])
  role: WorldRole;
```

Odůvodnění: `-1` je legacy „Pending" zrušený migrací D-053; `4` (PomocnyPJ) v platném `WorldRole` chybělo. Bez opravy nelze přes UI nikoho povýšit na Pomocného PJ. +1 BE test.

### 8.2 Nový endpoint pro AKJ úrovně

`PUT /worlds/:worldId/settings/akj-types` — aby AKJ úrovně mohl definovat i PomocnyPJ, aniž by získal celý `PUT .../settings` (PJ-only, 8 polí).

- **Controller** (`worlds.controller.ts`) — nový handler, guard `JwtAuthGuard` + permission check `canManageMembers` (PomocnyPJ+).
- **DTO** — `UpdateAkjTypesDto { akjTypes: AkjTypeDto[] }` (reuse existující `AkjTypeDto`).
- **Service** (`worlds.service.ts`) — metoda `updateAkjTypes(worldId, akjTypes, requester)` — ověří `canManageMembers`, zapíše `akjTypes` do `WorldSettings`, vrátí aktualizovaný `WorldSettings` (nebo jen `akjTypes`).
- +2 testy: PomocnyPJ uloží ✓; Hráč → 403.

> Ostatní pole `WorldSettings` (`groupColors`, `hiddenNavItems`, `menuTemplates`, `currencies`, `diarySchema`…) zůstávají výhradně na `PUT .../settings` (PJ+). Barvy skupin v tabu Členové (§4.5) proto zůstávají PJ-only.

### 8.3 Populace jmen členů do `GET /worlds/:id/members`

`getMembers` dnes vrací holé `WorldMembership[]`. Tabulka 5.3c potřebuje `username` + avatar účtu.

- **Service** (`worlds.service.ts`) — nová privátní `enrichMembers(members)`, analogická existující `enrichWithOwner`: pro každý `userId` zavolá `usersService.publicProfile(userId)` (batch / `Promise.all`), připojí `user: { id, username, avatarUrl }`. Smazaný účet → `user` undefined, FE fallback „Neznámý uživatel".
- `getMembers` vrátí `(WorldMembership & { user?: PublicOwnerSummary })[]`.
- Rozšířit `WorldMembership` interface (BE) o volitelné `user?: PublicOwnerSummary`.
- +1 BE test (member response obsahuje `user.username`).

> 💡 **Proč ne FE batch lookup:** Stejný vzor už BE má pro `owner` světa. Držet enrichment na BE = jeden konzistentní tvar dat, FE nemusí řešit N+1 dotazů na uživatele.

---

## 9. Otázky k autorovi / k ověření v impl. plánu

1. ~~Jména členů~~ — **vyřešeno:** ověřeno v BE kódu, řeší §8.3 (populace user summary).
2. **URL stav tabu** — aktivní tab v URL hashi (`#clenove`) kvůli sdílitelnosti odkazu. **Návrh: ano** (levné, užitečné pro „pošli mi správu členů") — impl. plán potvrdí.
3. **Theme editor — sada tokenů** — podmnožina v §4.7 je finální výchozí sada; impl. plán ji zhmotní v `themeTokens.ts`.

> Workflow: po schválení tohoto specu → `frontend-design` audit (vizuální směr tabové stránky + theme editoru) → implementační plán (přesné CLI / file diffy) → po schválení kód.
