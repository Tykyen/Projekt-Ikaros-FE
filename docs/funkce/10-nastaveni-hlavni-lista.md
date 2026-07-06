# 10 — Nastavení světa & hlavní lišta

Hloubková, kódem ověřená inventura. FE = `Projekt-ikaros-FE`, BE = `Projekt-ikaros/backend`.

Světové role (číselně, **nižší = vyšší moc** ve world enumu naopak — pozor, FE `WorldRole` má Zadatel nejníž a PJ nejvýš): Zadatel < Ctenar < Hrac < Korektor < PomocnyPJ < PJ. Platformové role (UserRole, nižší číslo = vyšší): Superadmin(1) < Admin(2).

Klíčové pravidlo (R-20, doplněno elevací 2026-06-21 a FIX-19 2026-07-05 — ověřeno v kódu): platformový Admin/Superadmin **BEZ aktivní elevace** nemá governance moc uvnitř světa (settings/mazání řídí jen skutečná world role). **S aktivní elevací** (per-svět toggle, kap. 09 sekce I) MÁ plnou PJ governance moc přes `canAdminWorld` (settings, mazání, šablona deníku) a `canManageMembers`/`canEditWorldData` (členové, AKJ, skupiny, vzhled) — do 2026-07-05 tuhle bránu elevace ještě nepokrývala (FIX-19), i s aktivním "Admin režimem" skončila mutace 403. Jediná výjimka, kterou elevace neobchází, je **předání světa** (`transferOwnership`, striktně jen skutečný vlastník) a **obnova** (restore) opuštěného soft-smazaného světa (jen Admin/Superadmin, i bez elevace — je to platformová akce mimo world runtime).

---

## Nastavení světa (`WorldSettingsPage`)

### Přehled — tabová stránka
- **Co to je:** stránka `/svet/:slug/nastaveni`. Tabová, aktivní tab drží URL hash (`#vzhled` atd.).
- **Kde:** FE `src/features/world/pages/WorldSettingsPage/WorldSettingsPage.tsx`. Vstup z hlavičky světa přes ozubené kolečko (`WorldLayout.tsx:520`).
- **Kdo (FE):** route `memberOnly(p(WorldSettingsPage))` — vyžaduje členství (Čtenář+). Viditelnost tabů řídí `effectiveRole` = `PJ` při aktivní elevaci (`world.elevated`) **jinak** skutečná world role (`WorldSettingsPage.tsx:253-256`) — platform Admin bez world membershipu a bez elevace nevidí žádný PJ tab; s elevací vidí a smí totéž co PJ (FIX-19, kap. 09 sekce I).
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
| Mapy | `mapy` | PJ | — | `MapDefaultsTab` |
| PJ v chatu | `pj-chat` | PomocnyPJ | — | `PjChatTab` |
| Emoty světa | `emotes` | PomocnyPJ | — | `WorldEmotesAdminPage` |
| Kalendáře | `kalendare` | PomocnyPJ | — | `CalendarConfigsPage` |
| Šablona deníku | `sablona-deniku` | PJ | `vlastni` (custom) | `WorldDiarySchemaEditorPage` |
| Vzhled | `vzhled` | PomocnyPJ | — | `ThemeTab` |
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

### Tab Mapy (výchozí nastavení map světa — 15.4 E)
- **Co to je:** PJ nastaví výchozí parametry map světa: typ mřížky (hex/čtverec/žádná), velikost buňky, měřítko (jednotek/buňku + jednotka), zobrazit stupnici, viditelnost HP (PC/NPC/bestie), povolit kreslení hráčům. **Každá nově založená scéna je zdědí**; existující scény zůstávají a každou lze přepsat v „Upravit scénu".
- **Kdo (FE):** tab PJ+. **Kdo (BE):** `PUT /worlds/:worldId/settings` (`mapDefaults`, PJ+ `canAdminWorld`).
- **Zvláštnost:** seed je **server-side** v `MapsService.create` (jen když scéna není ze šablony ani s explicitním configem) — schválně mimo `CreateMapDto` (jeho `HexConfigDto` whitelist by nová pole zahodil). `mapDefaults` = volný objekt na `WorldSettings` (vzor `pjChatPersona`).
- **Hranice:** dědí jen NOVÁ scéna; změna defaultů nepřepíše existující scény.
- **Kód:** FE `tabs/MapDefaultsTab.tsx`; BE `worlds` (schema/interface/dto/repo `mapDefaults`) + `maps/maps.service.ts` (seed v `create`).

### Tab Šablona deníku (diary schema editor) — základ „Vlastního systému" (16.2g F1)
- **Co to je:** editor schématu deníku postavy (8.5) — jádro **„Vlastního systému"** (meta-systém 16.2g). Záložka jen pro svět se systémem **„Vlastní Systém"** (`SYSTEM_CUSTOM_ID = 'vlastni'`, explicitní alias → `generic` engine v `systemId.ts`) — u presetů je schema seedované automaticky.
- **Co jde dělat:** definovat bloky schématu (key/label/type/config/order) — **9 typů**: `stat`/`number`/`bar`/`list`/`text`/`textarea`/`image`/`relation`/`formula`; seskupit bloky do **sekcí** (`config.layoutArea`); u `formula` zadat **vzorec** (`config.expression`, počítá z `key` číselných bloků); import/export JSON; verzování (archiv předchozích, remap klíčů). **Prázdný svět nabídne 3 startovní šablony** (Fantasy/Sci-fi/Minimal) nebo start od nuly.
- **Vyplňování hodnot postavy:** hráč v deníku postavy (`DiaryTab`) vyplní hodnoty všech typů — `number` číselný input, `textarea` víceřádkový, `relation` **picker postavy** (`PagePicker`, ukládá slug), `formula` je **read-only** (dopočítává se z ostatních polí, nejde ručně přepsat). Bloky se zobrazí seskupené do sekcí. Per-postava override schématu přes „Vlastní šablona".
- **Kdo (FE):** PJ + `minSystem='vlastni'`. **Kdo (BE):** verzování přes `POST /worlds/:id/diary-schema-versions` → **PJ+**. Vytvoření nové verze archivuje předchozí a inkrementuje `version`. `config` je na BE **volný objekt** (`MixedArraySubSchema` `strict:false`, DTO `@IsObject`) → `expression` projde bez BE změny/restartu.
- **Hranice:** u presetových systémů tab vůbec není (gate `minSystem`). Změna systému v Základní info re-seeduje schema. `formula` odkazuje na `key` číselných bloků (identifikátor bez diakritiky/pomlček); vzorec umí `+ − * / %` a závorky, **ne funkce**. Vlastní kostkové mechaniky (F4) čekají — hody bestie zatím 4dF. Živý vizuál po deployi.
- **Skiny (F6, 2026-07-02):** vlastní systém (generic) má **8 vlastních skinů** (blokové karty) přepínatelných na deníku postavy (🎨 Vzhled) — propíšou se do deníku, bojového panelu na mapě i v chatu (PC i bestie), obalů, hodů, dicelogu, orchestrace. MLP = světlý/duhový. `styles/generic-skins/*` + `generic` v `:is()` embed seznamech; per uživatel×svět. Render-ověřeno.
- **Stav:** ✅ deník builder (F1) + bestie builder (F2) + 8 skinů (F6) · 🚧 F4 (vlastní kostky)
- **Kód:** FE `pages/WorldDiarySchemaEditorPage` (+`templates/starterTemplates.ts`, `components/{BlockConfigPanel,SchemaPreview}.tsx`, `utils/schemaMappers.ts`), `CharacterDetailPage/components/{DiaryTab,DiaryBlockView,diaryFormula}.tsx` + `editors/SchemaValueEditor.tsx`, `world/systemId.ts` (alias `vlastni→generic`); BE `worlds.service.ts` diarySchemaVersion metody, `diary-schema-versions.schema.ts` (config volný). Spec `docs/arch/phase-16/spec-16.2g-vlastni-system.md`.

### Tab Šablona bestie (16.2g F2) — jen „Vlastní Systém"
- **Co to je:** editor per-svět schématu bestie (statblok) pro „Vlastní Systém". Analog „Šablony deníku", ale drží bohatší `SystemEntitySchema.sections` (pole s `combatBehavior` → HP bar / iniciativa na mapě). Statblok se z něj vykreslí v bestiáři, na taktické mapě i v chatu.
- **Co jde dělat:** definovat sekce → pole (název/klíč/typ `number|string|enum|boolean|computed`, `combatBehavior`, min/max, možnosti enumu, vzorec, povinné); živý náhled přes `EntityStatbar`; start ze základní šablony (HP/zbroj/pohyb/iniciativa) nebo z prázdné. Uložení = nová verze (archivuje předchozí).
- **Kdo (FE):** PJ + `minSystem='vlastni'`. **Kdo (BE):** `POST /worlds/:id/entity-schema-versions` → **PJ+** (`EntitySchemaVersionsService` přes `WorldsService.assertCanAdminWorld`); read = member. Kolekce `entity_schema_versions` (worldId+entityType+version).
- **Render:** FE `useResolvedEntitySchema(worldId, systemId, entityType)` — pro `vlastni` vezme world verzi (token fallbackuje na world `bestie` = jedno schéma katalog+mapa), jinak/dokud nedorazí statický registry (`generic:bestie`/`generic:token`). Napojeno v `BestieStatblock` (mapa+chat), `BestiePanelView`, `BestieEditorModal`.
- **Validace bestií:** `BestiaeService` validuje `systemStats` scope='world' proti world schématu (`SystemStatsValidator.*WithSchema`), jinak registry; soft-mode (chybí schéma → projde).
- **Hranice:** jen deník + bestie statblok; **hody z bestie = 4dF** (vlastní kostková mechanika = F4). Vzhled panelů = generický (skiny = F6). U presetových systémů tab není. **Vyžaduje BE restart** (nová kolekce/modul).
- **Stav:** ✅ editor + render (F2) · 🚧 F3–F6
- **Kód:** FE `pages/WorldEntitySchemaEditorPage/{WorldEntitySchemaEditorPage,EntitySchemaEditor}.tsx`, `tactical-map/schemas/{useEntitySchemaVersions,entitySchemaVersions.types}.ts` + `generic/bestie.json`; BE `modules/entity-schema-versions/*`, `bestiae.service.ts` (validateStats), `system-stats-validator.service.ts` (`*WithSchema`). Spec `docs/arch/phase-16/spec-16.2g-vlastni-system.md`.

### Tab Emoty světa
- **Co to je:** správa custom emotů světa pro chat (6.4c). Mřížka, počítadlo (`EMOTE_LIMIT_PER_WORLD`), upload/edit/copy/delete.
- **Co jde dělat:** nahrát/upravit/smazat emote, zkopírovat z jiného světa.
- **Kdo (FE):** PomocnyPJ+. **Kdo (BE):** modul emotů (membership guard PomocnyPJ+).
- **Zvláštnost:** dřív orphan route `/admin/emotes` (N-03), kanonický přístup je teď tato záložka.
- **✅ OPRAVENO 2026-07-05 (SEC-11, RUN-2026-07-05):** `import type` na `CreateEmoteDto`/`UpdateEmoteDto`/`CopyEmoteDto` (`emotes.controller.ts`) mazal class-validator reflection metadata → **každý** upload/úprava/kopie emote (globální i světový) vracel 400, i když UI vypadalo funkčně. Teď `import` (ne `import type`) — vytváření/úprava/kopírování reálně funguje.
- **Stav:** ✅
- **Kód:** FE `pages/WorldEmotesAdminPage/WorldEmotesAdminPage.tsx`. BE `modules/emotes/emotes.controller.ts`.

### Tab Kalendáře
- **Co to je:** multi-config kalendáře světa (9.2b). Reuse `CalendarConfigsPage`.
- **Kdo (FE):** PomocnyPJ+. **Kdo (BE):** `world-calendar-config` write floor = PomocnyPJ+. Default kalendář + timelineEpoch přes `PATCH /worlds/:wid/calendar-defaults` (`canAdmin` zde explicitně PomocnyPJ+, R-NEW, `worlds.service.ts:1105-1125`).
- **Stav:** ✅
- **Kód:** FE `pages/CalendarConfigsPage`.

### Tab Vzhled (téma/skin světa) — sdílený motiv
- **Co to je:** výběr preset motivu světa + editor vlastních barev (overrides) + vlastní pozadí. Sdílený vzhled = **výchozí** pro všechny členy (každý si ho lokálně přebije v „Můj vzhled").
- **Co jde dělat:**
  - Vybrat preset (`ThemePresetGrid`), default `modre-nebe`.
  - Doladit barvy (`ThemeCustomEditor` → `themeOverrides`).
  - Nahrát vlastní pozadí (`themeBackgroundUrl`); `null` = explicit clear ($unset na BE).
  - „Zpět na preset" = vyčistí overrides i pozadí.
- **Živý náhled:** publikuje volbu do `worldThemePreviewAtom`; `WorldLayout` ho aplikuje na celý svět během editace; opuštění tabu náhled vyčistí (cleanup efektu).
- **Kdo (FE):** **PomocnyPJ+** (dřív Korektor — viz bug níže). **Kdo (BE):** ukládá přes `PATCH /worlds/:id` (`themeId`, `themeOverrides`, `themeBackgroundUrl`); cílený guard JEN na theme pole → `canManageMembers` = **PomocnyPJ+** (`worlds.service.ts` v `update()`), zbytek polí (jméno/popis) zůstává Korektor+ přes `canEditWorldData`. BE sanitizuje overrides (`sanitizeThemeOverrides`: jen `--theme-*` klíče, max 60), úklid starých blobů pozadí (UM-03).
- **Hranice:** sdílený skin/barvy/pozadí mění jen vedení (PomocnyPJ+); písmo se tu nenastavuje. `null` pozadí = clear.
- **Stav:** ✅
- **Kód:** FE `tabs/ThemeTab.tsx`, `WorldSettingsPage.tsx` (tab gate), `components/ThemePresetGrid.tsx`, `components/ThemeCustomEditor.tsx`; BE `worlds.service.ts` (`update` theme guard).

### Tab Můj vzhled (per-uživatel — vlastní motiv, pozadí, barvy, a11y)
- **Co to je:** osobní vzhled světa **jen pro mě** (5.9 + 5.9b). 5.9 = jas/kontrast/barvy nad sdíleným skinem; **5.9b nově = vlastní motiv (skin) a vlastní pozadí**. Vše na membershipu, nepropisuje se do World ani jiným členům.
- **Co jde dělat:** vybrat vlastní **motiv** (`ThemePresetGrid` → `themeId`), nahrát vlastní **pozadí** (`themeBackgroundUrl`), vlastní barvy (`themeUserOverrides`), posuvníky jas/kontrast (0.7–1.3), „Zpět na vzhled PJ" (clear všeho). Ukládá `PUT /worlds/:wid/members/me/theme`.
- **„Follow PJ":** vlastní `themeId` se ukládá jen když se LIŠÍ od `world.themeId` (jinak `null`) → člen není zaseknutý na starém motivu, když PJ změní sdílený. Pozadí funguje i samostatně nad sdíleným motivem.
- **Vrstvení:** vlastní motiv člena = samostatná vrstva (PJ overrides/pozadí laděné pro skin světa se na cizí skin nevztáhnou); bez vlastního motivu jen vrší úpravy nad sdíleným. Viz `WorldLayout.tsx`.
- **Kdo (FE):** Ctenar+ (každý člen). **Kdo (BE):** `updateMyTheme` — vyžaduje jen **membership** (jakákoli role), self-scoped (`me` z JWT). `''`/`null` z FE = clear (`$set: null`); `undefined` Mongoose stripne (backward-compat).
- **Hranice:** font člen stále nemění (out of scope 5.9b). Jas+kontrast jako CSS `filter` na obsahové vrstvě.
- **Stav:** ✅
- **Kód:** FE `tabs/MyThemeTab.tsx`, `WorldLayout.tsx` (resolver), `shared/types` (`WorldMembership.themeId/themeBackgroundUrl`); BE `worlds.controller.ts` (`me/theme`), `worlds.service.ts` (`updateMyTheme`), `world-membership.schema.ts` + `.repository.ts` (`toEntity`), `dto/update-member.dto.ts`.

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
- **Kdo (FE):** tab PJ. **Kdo (BE):** `softDelete` → `canAdminWorld` = **PJ membership NEBO elevovaný platform Admin/Superadmin** (FIX-19, RUN-2026-07-05 — `worlds.service.ts:1770-1811`). **Obnova** (`POST /worlds/:id/restore`) → jen Admin/Superadmin, do 30 dní, bez elevace (`worlds.service.ts:1813+`).
- **✅ VYŘEŠENO 2026-07-05 (FIX-19):** FE text „PJ vlastník i Admin" (`DeleteWorldTab.tsx:11`) je teď přesný pro **elevovaného** Admina — dřív `canAdminWorld` elevaci vůbec nečetl (dead parametr), takže i s aktivním "Admin režimem" mazání spadlo na 403.
- **Stav:** ✅
- **Kód:** FE `tabs/DeleteWorldTab.tsx`; BE `worlds.service.ts:1770`, `worlds.controller.ts:200-227`.

---

## Export / Záloha světa (14.7c)

### Co to je
Stažení kompletních dat jednoho světa do ZIP (JSON strom). Pilíř B spec-14.7 — uživatelova vlastní záloha proti vendor lock-inu.

### Kde
- FE tab „Export / Záloha" v `WorldSettingsPage` (`tabs/ExportTab.tsx`), JEN PJ.
- BE `GET /worlds/:worldId/export?chat=` → `world-export.service.streamExport` (`modules/world-export/`).

### Kdo
- FE: tab `minRole: WorldRole.PJ`.
- BE: `resolveScope` — platform Admin/Superadmin nebo `WorldRole.PJ` → `pj-full`; hráč/PomocnyPJ → 403 `EXPORT_PJ_ONLY`. Hráčský `viewer-partial` je **vědomě mimo scope** (viz Hranice).

### Co jde dělat
- Stáhnout ZIP `svet-<slug>-<datum>.zip` = `manifest.json` (version/scope/counts) + `data.json` (celý lore strom) + **`media/`** (stažené binárky obrázků) + `media-manifest.json` (URL → soubor).
- Obsah: world+settings+members, pages, characters + **všechny subdocs** (deník/finance/výbava/poznámky/kalendář/účty), kalendáře, taktické scény, atlas map+složky, hvězdná mapa, timeline, události, bestiář světa, kampaň (subjekty/vztahy/storylines/scénáře/quick-notes/obchod), **per-PJ poznámky** (`gmNotes`).
- **Chat opt-in** (`?chat=1`) → přidá skupiny + kanály + zprávy (limit 2000/kanál).

### Hranice — co neumí
- **Jen `pj-full`** (PJ/Admin). Hráčský `viewer-partial` export = **VĚDOMĚ MIMO SCOPE (2026-06-20)**: leak-safe filtrace přes ~15 modulů má špatný poměr riziko/hodnota a hráč svůj viditelný obsah dostane **tiskem** (pilíř A); ZIP je PJ nástroj pro zálohu celého světa. Lze přidat později (vlastní spec).
- **Média graceful skip** — propadlé/cizí/relativní URL se nestáhnou (zůstávají jen jako URL v datech).
- **Import zpět ODLOŽEN** — formát je import-ready (stabilní ID + `version` + `scope`), import se nestaví.
- Timeline limit 500 událostí; velké světy = přímý stream (sledovat timeout).

### Zvláštnosti
- `pj-full` čte celý strom přímo z repozitářů (PJ vidí vše → bez filtrů). Kvůli tomu přidány `exports:` repo tokenů do 6 modulů (campaign/world-maps/universe/timeline/game-events/character-subdocs).
- `archiver` 8 = `new ZipArchive()` (ne factory `archiver()`).
- Média: `collectMediaUrls` rekurzivně projde JSON strom, `fetch` → `media/N.<ext>` + mapa do `media-manifest.json` (pro budoucí import re-upload).

### Stav
✅ funguje (export) — `pj-full` ZIP kompletní vč. **médií / gm-notes / chatu**; `viewer-partial` vědomě mimo scope; **import odložen**. Reálné stažení v prohlížeči zatím user-neověřeno (zkontrolovat `media/` + chat), **čeká BE restart**.

### Kód
FE `WorldSettingsPage/tabs/ExportTab.tsx`; BE `modules/world-export/{world-export.controller,world-export.service,world-export.module}.ts`.

---

## Per-svět téma / skin (jak se aplikuje)

- **Co to je:** svět má vlastní skin (`themeId`), barevné overrides, pozadí. Tyto se aplikují na celý shell světa i na `:root` (kvůli portálům — modaly žijí mimo `.shell`).
- **Kde:** FE `src/app/layout/WorldLayout/WorldLayout.tsx`, `src/themes/state.ts`, `src/themes/applyTheme.ts`, `src/themes/worldTheme.ts`.
- **Jak (ověřeno):**
  - `resolveWorldTheme(world)` dá `themeId/overrides/backgroundUrl` (`WorldLayout.tsx:366`).
  - **Náhled má přednost:** `worldThemePreviewAtom` (z editoru) > `World` data (`:367-373`).
  - **Vrstvení (5.9b):** motiv = `preview ?? membership.themeId ?? world.themeId`; když má člen vlastní motiv (≠ svět), je jeho vrstva SAMOSTATNÁ (jen `membership.themeUserOverrides`/pozadí, bez PJ overrides cizího skinu); jinak `{ ...world.themeOverrides, ...membership.themeUserOverrides }`. Vlastní `membership.themeBackgroundUrl` přebíjí pozadí světa.
  - **Jas/kontrast** člena = CSS `filter` na `<main>` (`:376-383`).
  - **Vlastnictví `:root`:** atom `worldThemeActiveAtom` (`themes/state.ts:42`) — dokud je `WorldLayout` mountnutý, `ThemeProvider` přeskočí globální `applyTheme` (jinak by race po opuštění profilu přepsal world skin globálním motivem). Pozadí přes `||` (ne `??`), aby prázdný string spadl na pozadí skinu (`:387`).
  - **Efekt skinu:** `theme.effect === 'matrix-rain'` → `<MatrixRain>` (brand identita skinu `ikaros`).
  - **EXIT:** unmount obnoví globální motiv uživatele (`:415-420`).
- **Kdo nastavuje:** vedení PomocnyPJ+ (tab Vzhled, sdílený výchozí); každý člen Ctenar+ (tab Můj vzhled — vlastní motiv/pozadí/barvy/a11y jen pro sebe).
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

1. ✅ VYŘEŠENO 2026-07-05 (FIX-19, RUN-2026-07-05) — **Mazání světa — FE text vs. BE realita.** `DeleteWorldTab.tsx` (a route komentář `WorldSettingsPage.tsx:176`) říká, že mazat smí „PJ vlastník i Admin". Do 2026-06-18 šlo o špatný text (BE Admina vůbec nepouštěl); po zavedení elevace (2026-06-21) FE tab elevovanému Adminovi ukazoval, ale `canAdminWorld` elevaci ještě nečetl → mazání spadlo na 403 i s aktivním "Admin režimem". Teď `canAdminWorld` čte `worldAdminBypass` — text je pravdivý pro **elevovaného** Admina/Superadmina.
2. **`getSettings` (interní) vs. `getSettingsForRequester` (REST).** `ensureWorldChat`/persona čtou přes interní `getSettings` (plný objekt) — REST GET prochází filtrem. Konzistentní, ale dva čtecí vstupy = riziko driftu při přidání citlivého pole (přidat ho i do `toPublicSettings`). K ověření při dalších settings polích.
3. **`hideDefaultWeather` / `currencies` v DTO, ale bez vlastního UI tabu v Nastavení.** Currencies řeší Převodník měn, počasí svůj modul — v Nastavení nemají záložku. Není bug, jen nejednotnost „vše v Nastavení".
4. **Vlastní navigace nevaliduje cíl odkazu proti reálným routám.** `to` je volný string (max 512). Odkaz na neexistující world routu projde a vede na 404/catch-all. Zvážit validaci/varování v `LinkTargetEditor`.
5. **`themeUserOverrides` sanitizace DOPLNĚNA** (2026-06-27, D-NEW-INV-SEC): `updateMyTheme` teď aplikuje **stejný** `sanitizeThemeOverrides` jako world-level update (`--theme-*` prefix, max 200 zn., max 60). BE už nepřijme cizí custom properties z přímého API; FE editor není jediný garant.
