# 10 — Nastavení světa & hlavní lišta

Hloubková, kódem ověřená inventura. FE = `Projekt-ikaros-FE`, BE = `Projekt-ikaros/backend`.

Světové role (číselně, **nižší = vyšší moc** ve world enumu naopak — pozor, FE `WorldRole` má Zadatel nejníž a PJ nejvýš): Zadatel < Ctenar < Hrac < Korektor < PomocnyPJ < PJ. Platformové role (UserRole, nižší číslo = vyšší): Superadmin(1) < Admin(2).

Klíčové pravidlo **R-20** (ověřeno v kódu): platformový Admin/Superadmin **NEMÁ governance moc uvnitř světa** — settings/mazání/předání řídí jen skutečná world role. Jediná admin pojistka je obnova (restore) opuštěného soft-smazaného světa.

---

## Nastavení světa (`WorldSettingsPage`)

### Přehled — tabová stránka
- **Co to je:** stránka `/svet/:slug/nastaveni`. Tabová, aktivní tab drží URL hash (`#vzhled` atd.).
- **Kde:** FE `src/features/world/pages/WorldSettingsPage/WorldSettingsPage.tsx`. Vstup z hlavičky světa přes ozubené kolečko (`WorldLayout.tsx:520`).
- **Kdo (FE):** route `memberOnly(p(WorldSettingsPage))` — vyžaduje členství (Čtenář+). Viditelnost jednotlivých tabů řídí **jen skutečná world role** (`effectiveRole = userRole ?? Zadatel`), platform Admin bez world membershipu nevidí žádný PJ tab (R-20, `WorldSettingsPage.tsx:194-208`).
- **Kdo (BE):** každý tab volá jiný endpoint s vlastním guardem (viz níže). Nejde o jeden monolit.
- **Hranice:** tab se zobrazí jen když `effectiveRole >= minRole` a (volitelně) `world.system === minSystem`.
- **Stav:** ✅
- **Kód:** FE `WorldSettingsPage.tsx:65-232`.

Tabulka tabů (FE `TABS` pole, `WorldSettingsPage.tsx:65-183`):

| Tab | id | min. world role | min. system | komponenta |
|---|---|---|---|---|
| Základní info | `zakladni` | Korektor | — | `BasicInfoTab` |
| Přístup | `pristup` | Korektor | — | `AccessModeTab` |
| Členové | `clenove` | PomocnyPJ | — | `MembersTab` |
| AKJ úrovně | `akj` | PomocnyPJ | — | `AkjTab` |
| Postavy & NPC | `postavy-npc` | PJ | — | `CharacterTabsVisibilityTab` |
| Hlavní lišta | `navigace` | PJ | — | `HeadlineLinkTab` (rozcestník) |
| Šablony | `sablony` | Korektor | — | `PageTemplatesTab` |
| PJ v chatu | `pj-chat` | PomocnyPJ | — | `PjChatTab` |
| Emoty světa | `emotes` | PomocnyPJ | — | `WorldEmotesAdminPage` |
| Kalendáře | `kalendare` | PomocnyPJ | — | `CalendarConfigsPage` |
| Šablona deníku | `sablona-deniku` | PJ | `vlastni` (custom) | `WorldDiarySchemaEditorPage` |
| Vzhled | `vzhled` | Korektor | — | `ThemeTab` |
| Můj vzhled | `muj-vzhled` | Ctenar | — | `MyThemeTab` |
| Členství | `clenstvi` | Ctenar | — | `MembershipTab` |
| Smazat svět | `smazat` | PJ | — | `DeleteWorldTab` |

---

### Tab Základní info
- **Co to je:** metadata světa — název, popis („Identita"), žánr (preset/vlastní), „Koho hledáte", kapacita (maxPlayers), herní systém (preset/vlastní), kostky/mechaniky (PillChips), viditelnost hodů na mapě (3 checkboxy), hero obrázek.
- **Co jde dělat:** ukládá **jen změněná pole** (delta) přes `PATCH /worlds/:id`. Slug je readonly (nelze měnit z UI). Změna systému smart-replace kostek a na BE archivuje + re-seeduje diary schema.
- **Kdo (FE):** Korektor+. **Kdo (BE):** `update()` → `canEditWorldData` = world role **Korektor+** (membership, ne platform Admin) — `worlds.service.ts:424-517`, `:1964-1972`.
- **Viditelnost hodů na mapě:** `diceVisibility` = `{ showPjRolls, showNpcBestieRolls, showTeammateRolls }`, default jen spoluhráči. Uplatní se na taktické mapě (10.2j).
- **Hranice:** žánr/systém se ukládá jako string (preset i custom). Slug se mění jinde (`PATCH /worlds/:id/slug`, není v UI nastavení). Změna systému přepíše schémata deníku.
- **Stav:** ✅
- **Kód:** FE `tabs/BasicInfoTab.tsx`; BE `worlds.controller.ts:135-147`, `worlds.service.ts:424`.

### Tab Přístup (režim přístupu)
- **Co to je:** přepínač `accessMode` světa: `public` (Veřejný, okamžitý vstup jako Čtenář), `open` (Veřejný se schválením — žádost), `private` (Soukromý — vidí jen členové+žadatelé, vstup přes žádost), `closed` (Uzavřený — nikdo nový, ani žádostí).
- **Co jde dělat:** přepnout režim; přechod na „Uzavřený" potvrzuje dialog. Ukládá `PATCH /worlds/:id { accessMode }`.
- **Kdo (FE):** Korektor+. **Kdo (BE):** `canEditWorldData` (Korektor+).
- **Hranice:** žádné per-člen výjimky; režim je globální pro svět. Join/žádosti řeší samostatné endpointy (`/join`, `/access-request`, approve/reject — `worlds.controller.ts:229-298`).
- **Stav:** ✅
- **Kód:** FE `tabs/AccessModeTab.tsx`; BE `worlds.service.ts:424`.

### Tab Členové
- **Co to je:** tabulka členů — řádky `MemberRow` (role, skupina, AKJ úroveň, přiřazení postavy, odebrání, „vytvořit postavu pro člena"). Pod tabulkou pro PJ+ panel **Skupiny a barvy** (`GroupColorEditor`).
- **Co jde dělat:**
  - Změna role člena — `PATCH /worlds/:wid/members/:mid/role`.
  - Změna skupiny — `.../group`. AKJ úroveň — `.../akj`. Přiřazení postavy — `.../character` (nese i avatarUrl postavy). Toggle `isFree` — `.../free`. Odebrání člena — `DELETE .../members/:mid`.
  - **Skupiny + barvy + znak:** `GroupColorEditor` ukládá přes `PUT /worlds/:wid/settings` tři pole: `customGroups` (názvy), `groupColors` (mapa název→hex), `groupImages` (mapa název→URL znaku). Barva odlišuje skupinu v chatu/seznamech; znak (emblém) se zrcadlí do ikony linkovaného chat kanálu.
- **Kdo (FE):** tab PomocnyPJ+; panel Skupiny jen PJ+ (`viewerRole >= PJ`). **Kdo (BE):**
  - member operace (role/group/akj/character/free) → `canManageMembers` = **PomocnyPJ+** (`worlds.service.ts:1954-1962`).
  - skupiny/barvy/znak přes `PUT /settings` → `canAdminWorld` = **PJ+** (`worlds.service.ts:1000-1023`, `:1942-1952`).
- **Hranice:** každý member endpoint volá `assertMembershipInWorld` (N-18) — nelze měnit membership z cizího světa. Skupiny založí jen PJ (parita FE/BE OK).
- **Stav:** ✅
- **Kód:** FE `tabs/MembersTab.tsx`, `components/GroupColorEditor.tsx`; BE `worlds.controller.ts:398-476`, `worlds.service.ts:1227-1553`.

### Tab AKJ úrovně
- **Co to je:** definice „stupňované prověrky" (AKJ) řídící viditelnost wiki stránek. Editor `AkjLevelEditor`, úrovně se libovolně pojmenují.
- **Co jde dělat:** CRUD úrovní (`key`, `name`, `level`). Ukládá přes dedikovaný `PUT /worlds/:wid/settings/akj-types`.
- **Kdo (FE):** PomocnyPJ+. **Kdo (BE):** `updateAkjTypes` → `canManageMembers` = **PomocnyPJ+** (`worlds.service.ts:1077-1098`). Záměrně oddělený endpoint, aby AKJ zvládl i PomocnyPJ bez plného PJ-only `PUT /settings`.
- **Hranice:** přiřazení úrovní jednotlivým členům je v tabu Členové (ne tady). Vlastní AKJ logika (zámek záložek) je v modulu stránek.
- **Stav:** ✅
- **Kód:** FE `tabs/AkjTab.tsx`; BE `worlds.controller.ts:369-380`, `worlds.service.ts:1077`.

### Tab Postavy & NPC (viditelnost subdoc záložek)
- **Co to je:** matice viditelnosti subdokumentových záložek na detailu postavy podle typu (PostavaHrace / NPC) × tab (Deník, Finance, Výbava, Kalendář, Poznámky). Tab „Profil" je vždy povinný (mimo matici).
- **Co jde dělat:** zapnout/vypnout, reset na výchozí. Ukládá `PUT /worlds/:wid/settings { characterTabVisibility }`.
- **Kdo (FE):** PJ. **Kdo (BE):** `updateSettings` → `canAdminWorld` = **PJ+**. BE má whitelist + dedup (`CHARACTER_TAB_WHITELIST`, `sanitizeUpdateSettingsDto`, `worlds.service.ts:1029-1070`).
- **Hranice:** skrytí je čistě filtr pohledu — data se nemažou, jen zmizí z UI. Filtruje pohled rolí, které by jinak měly přístup ke všem subdoc tabům (PJ, PomocnyPJ, vlastník PC).
- **Stav:** ✅
- **Kód:** FE `tabs/CharacterTabsVisibilityTab.tsx`; BE DTO `dto/update-world-settings.dto.ts:103-115`.

### Tab Šablony (per-svět šablony stránek)
- **Co to je:** CRUD šablon atributových tabulek pro nové stránky (8.1d). Karty s ikonou, počtem polí, default titulkem.
- **Co jde dělat:** vytvořit/upravit/smazat šablonu (label, key, ikona, hlavičky polí, defaultTitle). Použijí se v editoru stránek jako stripe karet.
- **Kdo (FE):** Korektor+. **Kdo (BE):** modul `world-page-templates` (samostatné endpointy, ověř guard tam). Klíč musí být unikátní v rámci světa (`TEMPLATE_KEY_TAKEN`).
- **Hranice:** smazání šablony nemění existující stránky, které ji použily.
- **Stav:** ✅
- **Kód:** FE `tabs/PageTemplatesTab.tsx`, `pages/api/useWorldPageTemplates.ts`.

### Tab Šablona deníku (diary schema editor)
- **Co to je:** editor schématu deníku postavy (8.5). Záložka jen pro svět se systémem **„Vlastní Systém"** (`SYSTEM_CUSTOM_ID = 'vlastni'`) — u presetů je schema seedované automaticky.
- **Co jde dělat:** definovat bloky schématu (key/label/type/config/order).
- **Kdo (FE):** PJ + `minSystem='vlastni'`. **Kdo (BE):** verzování přes `POST /worlds/:id/diary-schema-versions` → **PJ+** (`worlds.controller.ts:548-561`). Vytvoření nové verze archivuje předchozí a inkrementuje `version`.
- **Hranice:** u presetových systémů tab vůbec není (gate `minSystem`). Změna systému v Základní info re-seeduje schema.
- **Stav:** ✅
- **Kód:** FE `pages/WorldDiarySchemaEditorPage`; BE `worlds.service.ts` diarySchemaVersion metody.

### Tab Emoty světa
- **Co to je:** správa custom emotů světa pro chat (6.4c). Mřížka, počítadlo (`EMOTE_LIMIT_PER_WORLD`), upload/edit/copy/delete.
- **Co jde dělat:** nahrát/upravit/smazat emote, zkopírovat z jiného světa.
- **Kdo (FE):** PomocnyPJ+. **Kdo (BE):** modul emotů (membership guard PomocnyPJ+).
- **Zvláštnost:** dřív orphan route `/admin/emotes` (N-03), kanonický přístup je teď tato záložka.
- **Stav:** ✅
- **Kód:** FE `pages/WorldEmotesAdminPage/WorldEmotesAdminPage.tsx`.

### Tab Kalendáře
- **Co to je:** multi-config kalendáře světa (9.2b). Reuse `CalendarConfigsPage`.
- **Kdo (FE):** PomocnyPJ+. **Kdo (BE):** `world-calendar-config` write floor = PomocnyPJ+. Default kalendář + timelineEpoch přes `PATCH /worlds/:wid/calendar-defaults` (`canAdmin` zde explicitně PomocnyPJ+, R-NEW, `worlds.service.ts:1105-1125`).
- **Stav:** ✅
- **Kód:** FE `pages/CalendarConfigsPage`.

### Tab Vzhled (téma/skin světa) — sdílený motiv
- **Co to je:** výběr preset motivu světa + editor vlastních barev (overrides) + vlastní pozadí. Sdílený vzhled — vidí ho všichni členové.
- **Co jde dělat:**
  - Vybrat preset (`ThemePresetGrid`), default `modre-nebe`.
  - Doladit barvy (`ThemeCustomEditor` → `themeOverrides`).
  - Nahrát vlastní pozadí (`themeBackgroundUrl`); `null` = explicit clear ($unset na BE).
  - „Zpět na preset" = vyčistí overrides i pozadí.
- **Živý náhled:** publikuje volbu do `worldThemePreviewAtom`; `WorldLayout` ho aplikuje na celý svět během editace; opuštění tabu náhled vyčistí (cleanup efektu).
- **Kdo (FE):** Korektor+. **Kdo (BE):** ukládá přes `PATCH /worlds/:id` (`themeId`, `themeOverrides`, `themeBackgroundUrl`) → `canEditWorldData` = **Korektor+**. BE sanitizuje overrides (`sanitizeThemeOverrides`: jen `--theme-*` klíče, max 60), úklid starých blobů pozadí (UM-03, `worlds.service.ts:466-513`).
- **Hranice:** skin (preset) a barvy mění Korektor; písmo se tu nenastavuje. `null` pozadí = clear.
- **Stav:** ✅
- **Kód:** FE `tabs/ThemeTab.tsx`, `components/ThemePresetGrid.tsx`, `components/ThemeCustomEditor.tsx`; BE `worlds.service.ts:424`.

### Tab Můj vzhled (per-uživatel doladění)
- **Co to je:** osobní úpravy vzhledu světa **jen pro mě** (přístupnost, 5.9) — jas, kontrast, vlastní barvy nad sdíleným skinem PJ.
- **Co jde dělat:** posuvníky jas (0.7–1.3) a kontrast (0.7–1.3), vlastní barvy (`themeUserOverrides`), reset na vzhled PJ. Ukládá `PUT /worlds/:wid/members/me/theme`.
- **Kdo (FE):** Ctenar+ (každý člen). **Kdo (BE):** `updateMyTheme` — vyžaduje jen **membership** (jakákoli role), self-scoped (`me` z JWT, `worlds.service.ts:1455-1483`).
- **Hranice:** skin a písmo určuje PJ a člen je nemění — jen jas/kontrast/barvy. Jas+kontrast se aplikují jako CSS `filter` na obsahovou vrstvu (`WorldLayout.tsx:376-383`).
- **Stav:** ✅
- **Kód:** FE `tabs/MyThemeTab.tsx`; BE `worlds.controller.ts:480-491`.

### Tab Členství (odejít / předat svět)
- **Co to je:** ukončení vlastního členství + (pro vlastníka) předání světa.
- **Co jde dělat:**
  - **Odejít ze světa** — `DELETE /worlds/:wid/members/:mid` na vlastní membership. Vlastník odejít **nemůže** (musí nejdřív předat).
  - **Předat svět** (jen vlastník) — modal s výběrem nového vlastníka (člen role Hráč+); `PATCH /worlds/:id/owner`. Po předání: nový = PJ, původní = PomocnyPJ.
- **Kdo (FE):** Ctenar+ (sekce předání jen vlastník). **Kdo (BE):** `transferOwnership` smí **jen vlastník** světa (ne platform Admin, R-NEW, `worlds.service.ts:1818-1877`). Nový vlastník musí být člen.
- **Hranice:** předání nelze vzít zpět bez součinnosti nového vlastníka. Kandidáti = členové Hráč+ kromě sebe.
- **Stav:** ✅
- **Kód:** FE `tabs/MembershipTab.tsx`; BE `worlds.controller.ts:184-198`.

### Tab Smazat svět (soft-delete)
- **Co to je:** soft-delete světa s 30denním recovery oknem.
- **Co jde dělat:** smazat svět (dvojí potvrzení). Data zůstávají; obnovit do 30 dní může **jen administrátor**, po 30 dnech cron hard-delete (`world-cleanup.cron.ts`).
- **Kdo (FE):** tab PJ. **Kdo (BE):** `softDelete` → `canAdminWorld` = **PJ membership** (`worlds.service.ts:1555-1587`). **Obnova** (`POST /worlds/:id/restore`) → jen Admin/Superadmin, do 30 dní (`worlds.service.ts:1598+`).
- **⚠️ Nesoulad:** FE texty (`DeleteWorldTab.tsx:11`, route komentář) tvrdí „PJ vlastník **i Admin**" může mazat, ale BE `canAdminWorld` platform Admina záměrně nepouští (R-20). Viz Nesrovnalosti.
- **Stav:** ✅ (s textovou nepřesností)
- **Kód:** FE `tabs/DeleteWorldTab.tsx`; BE `worlds.service.ts:1555`, `worlds.controller.ts:200-227`.

---

## Per-svět téma / skin (jak se aplikuje)

- **Co to je:** svět má vlastní skin (`themeId`), barevné overrides, pozadí. Tyto se aplikují na celý shell světa i na `:root` (kvůli portálům — modaly žijí mimo `.shell`).
- **Kde:** FE `src/app/layout/WorldLayout/WorldLayout.tsx`, `src/themes/state.ts`, `src/themes/applyTheme.ts`, `src/themes/worldTheme.ts`.
- **Jak (ověřeno):**
  - `resolveWorldTheme(world)` dá `themeId/overrides/backgroundUrl` (`WorldLayout.tsx:366`).
  - **Náhled má přednost:** `worldThemePreviewAtom` (z editoru) > `World` data (`:367-373`).
  - **Vrstvení overrides:** sdílené (PJ) + `membership.themeUserOverrides` (můj vzhled) — `:369-372`.
  - **Jas/kontrast** člena = CSS `filter` na `<main>` (`:376-383`).
  - **Vlastnictví `:root`:** atom `worldThemeActiveAtom` (`themes/state.ts:42`) — dokud je `WorldLayout` mountnutý, `ThemeProvider` přeskočí globální `applyTheme` (jinak by race po opuštění profilu přepsal world skin globálním motivem). Pozadí přes `||` (ne `??`), aby prázdný string spadl na pozadí skinu (`:387`).
  - **Efekt skinu:** `theme.effect === 'matrix-rain'` → `<MatrixRain>` (brand identita skinu `ikaros`).
  - **EXIT:** unmount obnoví globální motiv uživatele (`:415-420`).
- **Kdo nastavuje:** PJ/Korektor (tab Vzhled, sdílený); každý člen (tab Můj vzhled, jen pro sebe).
- **Stav:** ✅
- **Kód:** `WorldLayout.tsx:362-420`, `themes/state.ts:9-42`.

---

## Hlavní lišta / menu builder (`WorldHeadlineAdminPage`, spec 12.2)

- **Co to je:** dedikovaná stránka `/svet/:slug/admin/headline` — jediné místo pro řízení horní lišty světa: viditelnost modulů + vlastní navigace + šablony menu + „Last info" box. Vlevo editor, vpravo živý náhled, jedno tlačítko Uložit (dirty-tracking).
- **Kde:** FE `pages/WorldHeadlineAdminPage/WorldHeadlineAdminPage.tsx` + `components/*`. Rozcestník na ni vede z tabu Nastavení „Hlavní lišta" (`HeadlineLinkTab.tsx`).
- **Kdo (FE):** route guard `WorldMembershipGuard minWorldRole=PJ` (fallback Sa/Admin) — `router.tsx:322-333`. **Kdo (BE):** ukládá `PUT /worlds/:wid/settings` → `canAdminWorld` = **PJ+**.

### Sekce: Viditelnost modulů (`NavVisibilitySection`)
- Skryje/zobrazí moduly v horní liště. Whitelist skrývatelných = `HIDEABLE_NAV_ITEMS` (`worldNavConfig.ts:29-125`) ve skupinách Informace / Svět / Hra / Hlavní lišta.
- **Skrývatelné:** Magický systém, Technologie, Časová osa, Mapa vesmíru, Mapy, Pavučina, Obchod, Taktická mapa, Bestiář, Storyboard, Generátor počasí, Převodník měn, Zvuková databáze, Tvorba podzemí, Kalendář.
- **NELZE skrýt (esenciál):** Přehled, Stránky, Novinky, Pravidla (`isNavItemHidden` defense-in-depth, `worldNavConfig.ts:136-143`).
- **Hranice:** skrytí se týká **jen navigace** — přes URL je stránka stále dostupná (skrytí ≠ zákaz přístupu).
- Ukládá do `hiddenNavItems[]`.

### Sekce: Vlastní navigace (`CustomHeadlineBuilder`)
- Strom: top-level uzly = skupina (rozbalovací menu, 1 úroveň odkazů) nebo přímý odkaz. Řazení tlačítky ↑/↓ (touch-safe). Cíl odkazu přes `LinkTargetEditor`.
- Tato navigace se přidá **za** systémovou (aditivně) — `buildFullWorldNav` (`worldNavConfig.ts:261-276`).
- Ukládá do `customHeadline[]` (`HeadlineNode`).

### Sekce: Šablony menu (`MenuTemplatesSection`)
- Pojmenované sady odkazů; tlačítko „Vložit" rozbalí šablonu jako novou skupinu do vlastní navigace. Ukládá `menuTemplates[]`.

### Sekce: „Last info" box (`LastInfoSection`)
- Krátké oznámení PJ (max 280 znaků) — proužek pod hlavičkou (`LastInfoBar`). Toggle viditelnosti, `null` = nenastaveno. Server je autorita nad `updatedAt` (po změně textu se proužek objeví znovu i po dismissu). Ukládá `lastInfo` (`worlds.service.ts:1033-1047`).

### Systémová navigace + gating (ověřeno)
- `buildWorldNav` (`worldNavConfig.ts:156-233`): skupiny Informace / Svět / Hra + top-level Kalendář.
- **Role-aware skrývání nad rámec whitelistu:** Časová osa a Generátor počasí jen pro Hrac+ (`canAccess(Hrac)`); Kalendář jen pro PomocnyPJ+; Deník PJ a Storyboard jen pro `isPJ` (`worldNavConfig.ts:194-231`). To je parita s route guardy (N-04/05), aby klik nevedl na tichý redirect.
- `WorldLayout` skládá nav přes `buildFullWorldNav(slug, isPJForNav, hiddenNavItems, customHeadline, customGroups, canAccess)` (`WorldLayout.tsx:288-307`).
- **Hranice:** vlastní navigace je čistě aditivní; nelze přeřadit/skrýt systémové položky přesunem, jen je vypnout přes whitelist.
- **Stav:** ✅
- **Kód:** FE `WorldHeadlineAdminPage.tsx`, `worldNavConfig.ts`, `WorldLayout.tsx`; BE DTO `update-world-settings.dto.ts:54-152`, `worlds.service.ts:1000`.

---

## Datový model nastavení (BE)

`WorldSettings` (perzistuje přes `PUT /worlds/:wid/settings`, DTO `update-world-settings.dto.ts`):
`hiddenNavItems[]`, `customGroups[]`, `groupColors{}`, `groupImages{}`, `currencies[]`, `hideDefaultWeather`, `customHeadline[]` (HeadlineNode), `lastInfo|null`, `akjTypes[]`, `menuTemplates[]`, `diarySchema[]`, `characterTabVisibility`, `pjChatPersona|null`, `timelineCalendarSlug|null`.

**Read gating** (`getSettingsForRequester`, `worlds.service.ts:966-998`): Admin/Sa + člen → plný objekt; nečlen veřejného světa → veřejný subset (`toPublicSettings` nuluje `akjTypes/diarySchema/menuTemplates/lastInfo/pjChatPersona`); nečlen **privátního** světa → 404.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. ✅ OPRAVENO 2026-06-18 (JSDoc komentář) — **Mazání světa — FE text vs. BE realita.** `DeleteWorldTab.tsx` (a route komentář `WorldSettingsPage.tsx:176`) říká, že mazat smí „PJ vlastník i Admin", ale BE `softDelete` → `canAdminWorld` pouští **jen world PJ membership**, platform Admin je R-20 záměrně vyloučen. Platform Admin tlačítko sice na FE neuvidí (tab gate PJ), ale text mate. Doporučení: sjednotit text na „jen PJ světa".
2. **`getSettings` (interní) vs. `getSettingsForRequester` (REST).** `ensureWorldChat`/persona čtou přes interní `getSettings` (plný objekt) — REST GET prochází filtrem. Konzistentní, ale dva čtecí vstupy = riziko driftu při přidání citlivého pole (přidat ho i do `toPublicSettings`). K ověření při dalších settings polích.
3. **`hideDefaultWeather` / `currencies` v DTO, ale bez vlastního UI tabu v Nastavení.** Currencies řeší Převodník měn, počasí svůj modul — v Nastavení nemají záložku. Není bug, jen nejednotnost „vše v Nastavení".
4. **Vlastní navigace nevaliduje cíl odkazu proti reálným routám.** `to` je volný string (max 512). Odkaz na neexistující world routu projde a vede na 404/catch-all. Zvážit validaci/varování v `LinkTargetEditor`.
5. **`themeOverrides` sdílené vs. uživatelské mají stejný sanitizér jen na BE update světa.** `updateMyTheme` neaplikuje `sanitizeThemeOverrides` na `themeUserOverrides` (ověř `worlds.service.ts:1455`) — uživatel by mohl uložit ne-`--theme-*` klíče. K ověření, zda FE editor jediný garant.
