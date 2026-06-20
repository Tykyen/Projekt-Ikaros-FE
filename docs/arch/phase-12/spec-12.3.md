# Spec 12.3 — Záložka „Informace": Skupiny + editovatelná Pravidla

**Fáze:** 12 — Admin & nastavení (navazuje na 12.2 headline)
**Krok:** 12.3
**Stav:** 🟡 návrh ke schválení
**Datum:** 2026-06-03
**Role gate:** čtení = členové; editace Pravidel = PomocnyPJ+

---

## 1. Účel

Přestavět dropdown **„Informace"** v horní liště světa:
- **A) Skupiny** — místo Přehled/Novinky podseznam skupin členů; každá skupina má vlastní autogenerovanou stránku se seznamem hrajících členů. Plus „Nezařazení".
- **B) Pravidla** — dnes stub; změnit na **editovatelnou wiki stránku** (jedna stránka, příručku případně později).

---

## 2. Výchozí stav (ověřeno 2026-06-03)

- **Informace dropdown** ([worldNavConfig.ts](../../../src/features/world/lib/worldNavConfig.ts) `buildWorldNav`): Přehled (`/svet/:slug`) · Novinky (`/novinky`) · Pravidla (`/pravidla`).
- **Skupiny existují**: `WorldMembership.group`, `WorldSettings.customGroups`, `groupColors`. PJ je spravuje v Nastavení → Členové (`MembersTab` + `GroupColorEditor`).
- **[WorldMembersPage](../../../src/features/world/pages/WorldMembersPage/WorldMembersPage.tsx)** (`/hraci`) už členy seskupuje dle skupin a filtruje žadatele — **logiku seskupení reusneme**.
- **`RulesPage`** = `WorldStubPage area="rules"` (žádná data).
- **Wiki Page systém** kompletní: `usePage`/`useCreatePage`/`useUpdatePage`, `PageEditorPage` (`/edit/:slug`, guard PomocnyPJ+), `PageViewer` (`OstatniLayout` + read-only `RichTextEditor`). Slug je volný string, žádné rezervované slugy.

---

## 3. Rozhodnutí (závazná)

### R1 — „Informace" obsah
Dropdown „Informace" = **dynamický seznam skupin** + „Nezařazení" + **Pravidla**. Přehled a Novinky se z dropdownu **odebírají**.

### R1b — Referenční stránky (dotaženo 2026-06-06)
Vedle Pravidel ukazuje „Informace" i další dvě **referenční wiki stránky** seedované při tvorbě světa (BE `pages-world-seed.listener`): **Magický systém** (`/magicky-system`) a **Technologie** (`/technologie`). Důvod: tři základní reference každé hry (jak se hraje / jak funguje magie / pokročilost techniky) mají hráči hned k ruce.
- **Pravidla** zůstávají **esenciální** (bez `id`, nelze skrýt) — páteř světa.
- **Magický systém + Technologie** jsou **skrývatelné** (`id: 'magicky-system' | 'technologie'`, skupina `informace` v `HIDEABLE_NAV_ITEMS`). PJ je odebere z menu v *Nastavení světa → Viditelnost modulů*; stránka zůstává dostupná přes URL (`filterNavByHidden` semantika, shodně s moduly Svět/Hra).
- Stránky existují prakticky ve všech světech (seed od commitu 4c36412). Smazaná/chybějící → `PageViewerPage` ukáže `PageNotFound` (žádný pád).

### R2 — Přehled / Novinky ✅ (potvrzeno 2026-06-03)
- **Přehled** dostupný klikem na **název světa** (už funguje v `WorldLayout`).
- **Novinky a Akce jsou na úvodní stránce** (Přehled) → odebrání z „Informace" je OK, přístup se neztrácí.
- **Aktualizace 2026-06-20 (plný audit):** „Akce" dostaly **navíc** vlastní položku v menu „Svět" (`id: 'akce'`, skrývatelná, `buildWorldNav`) kvůli objevitelnosti — dashboard widget se snadno přehlédl. Akce zůstávají i na úvodní stránce; položka je `memberOnly(Ctenar+)`, bez role-gate. „Novinky" zůstávají bez samostatného odkazu (jen úvodní strana).

### R3 — Stránka skupiny = autogenerovaná
Routa `/svet/:worldSlug/skupina/:groupKey`. Obsah = **automaticky generovaný seznam členů** skupiny (žádný ruční wiki text v MVP). Vizuál ve stylu wiki/člen-karet (reuse `WorldMembersPage` member karty). `groupKey` = URL-encoded název skupiny; „Nezařazení" = rezervovaný klíč `__none__`.

### R4 — Pravidlo zobrazení člena na stránce skupiny
Zobrazit člena **jen pokud má přiřazenou postavu** (`characterPath`) **a** `role >= WorldRole.Hrac`.
- Bez postavy se nezobrazí **nikdo** (ani Hráč, ani PomocnyPJ/PJ).
- Čtenář (1) a Žadatel (0) nikdy.

Render: vždy jméno postavy + world-scoped avatar (`worldMemberAvatar`), proklik na postavu. (Žádný fallback na účet — každý zobrazený člen má postavu.)

### R5 — „Nezařazení"
Zobrazitelní členové (dle R4 — tj. s postavou) bez skupiny, nebo se skupinou mimo `customGroups`. V Matrixu např. vedle skupin „Lumíci" / „Evropani" (z `customGroups`).

### R6 — Skupiny v dropdownu bez members query
Dropdown listuje **všechny `customGroups`** (z `WorldSettings`, už v layoutu) + „Nezařazení" + Pravidla. Prázdné skupiny se needitují pryč (PJ je definoval; stránka prázdné skupiny ukáže empty state). *Důvod: nezatěžovat `WorldLayout` dalším members dotazem; `buildWorldNav` zůstává čistá funkce.* Pokud `customGroups` prázdné → jen „Nezařazení" + Pravidla.

### R7 — Pravidla = jedna wiki stránka, rezervovaný slug `pravidla`
- `RulesPage` načte Page `usePage(worldId, 'pravidla')`.
  - **existuje** → render přes `PageViewer` (čtení) + tlačítko **Upravit** (PomocnyPJ+) → `/svet/:slug/edit/pravidla`.
  - **404** → empty state: PomocnyPJ+ vidí **„Vytvořit pravidla"** (založí Page slug=`pravidla`, type `Ostatní`); ostatní vidí „Pravidla zatím nejsou nastavena".
- Editace přes existující `PageEditorPage` (žádný nový editor). Reserved slug se nesmí měnit/duplikovat.

---

## 4. Funkční rozsah

### 12.3a — Informace dropdown
- `buildWorldNav` (nebo nová helper) generuje položky „Informace": skupiny (`customGroups` + Nezařazení) → `to: /svet/:slug/skupina/:key`, + Pravidla. Bez Přehled/Novinky.
- Skupiny dostanou `groupColors` tečku/odlišení? (volitelné, ne nutné v dropdownu).

### 12.3b — Stránka skupiny
- Route `skupina/:groupKey` (memberOnly) + lazy `GroupMembersPage`.
- `GroupMembersPage`: `useWorldMembers` + `useWorldSettings` + directory postav (pro jméno/avatar postavy), filtr dle R4/R5, reuse member-karty z `WorldMembersPage`. Empty state „Ve skupině zatím nikdo není.".
- Sdílená helper `lib/groupMembers.ts`: `isMemberVisibleInGroups(m)`, `groupKeyOf(m)`, `decodeGroupKey` — testovatelné.

### 12.3c — Pravidla wiki
- `RulesPage` přepsat ze stubu na wiki-loader (viz R7). Reuse `PageViewer` + empty/create state.
- Ověřit, že `PageEditor` umí create s pevným slugem `pravidla` (předvyplnit slug, needitovat ho).

### 12.3d — `mobil-desktop` audit + `napoveda`
- Stránka skupiny responsive (karty grid). Nápověda: aktualizovat „Pravidla" (ze stubu na funkční wiki) + nová „Skupiny" položka/popis.

---

## 5. Mimo rozsah
- Ruční wiki popis skupiny (jen autoseznam) — případně později.
- Pravidla jako víc-kapitolová příručka — později (zatím 1 stránka).
- Drag řazení skupin v dropdownu (pořadí = `customGroups` pořadí).
- Změna správy skupin (zůstává v Nastavení → Členové).

---

## 6. Testy (cíl)
- FE: `groupMembers` helper (filtr R4: Hrac ano, Ctenar ne, PJ bez postavy ne, PJ s postavou ano, Korektor bez postavy ano), `groupKeyOf`/decode, Nezařazení bucket.
- FE: `RulesPage` — existující page → viewer + Upravit (PomocnyPJ+); 404 → create CTA jen PomocnyPJ+.
- FE: dropdown „Informace" generuje skupiny + Nezařazení + Pravidla, bez Přehled/Novinky.
