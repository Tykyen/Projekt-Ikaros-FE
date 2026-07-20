# 10 — Nastavení světa & hlavní lišta

Hloubková, kódem ověřená inventura. FE = `Projekt-ikaros-FE`, BE = `Projekt-ikaros/backend`.

Světové role (číselně, **nižší = vyšší moc** ve world enumu naopak — pozor, FE `WorldRole` má Zadatel nejníž a PJ nejvýš): Zadatel < Ctenar < Hrac < Korektor < PomocnyPJ < PJ. Platformové role (UserRole, nižší číslo = vyšší): Superadmin(1) < Admin(2).

Klíčové pravidlo (R-20, doplněno elevací 2026-06-21 a FIX-19 2026-07-05 — ověřeno v kódu): platformový Admin/Superadmin **BEZ aktivní elevace** nemá governance moc uvnitř světa (settings/mazání řídí jen skutečná world role). **S aktivní elevací** (per-svět toggle, kap. 09 sekce I) MÁ plnou PJ governance moc přes `canAdminWorld` (settings, mazání, šablona deníku) a `canManageMembers`/`canEditWorldData` (členové, AKJ, skupiny, vzhled) — do 2026-07-05 tuhle bránu elevace ještě nepokrývala (FIX-19), i s aktivním "Admin režimem" skončila mutace 403. Jediná výjimka, kterou elevace neobchází, je **předání světa** (`transferOwnership`, striktně jen skutečný vlastník) a **obnova** (restore) opuštěného soft-smazaného světa (jen Admin/Superadmin, i bez elevace — je to platformová akce mimo world runtime).

---

## Nastavení světa (`WorldSettingsPage`)

### Přehled — tabová stránka
- **Co to je:** stránka `/svet/:slug/nastaveni`. Tabová, aktivní tab drží URL hash (`#vzhled` atd.).
- **Kde:** FE `src/features/world/pages/WorldSettingsPage/WorldSettingsPage.tsx`. Vstup z hlavičky světa přes ozubené kolečko (`WorldLayout.tsx:659`; ≤768 px ⚙ ustupuje searchi a žije v draweru, `:775`).
- **Kdo (FE):** route `memberOnly(p(WorldSettingsPage))` — vyžaduje členství (Čtenář+). Viditelnost tabů řídí `effectiveRole` = `PJ` při aktivní elevaci (`world.elevated`) **jinak** skutečná world role (`WorldSettingsPage.tsx:253-256`) — platform Admin bez world membershipu a bez elevace nevidí žádný PJ tab; s elevací vidí a smí totéž co PJ (FIX-19, kap. 09 sekce I).
- **Kdo (BE):** každý tab volá jiný endpoint s vlastním guardem (viz níže). Nejde o jeden monolit.
- **Hranice:** tab se zobrazí jen když `effectiveRole >= minRole` a (volitelně) `world.system === minSystem`.
- **Stav:** ✅
- **Kód:** FE `WorldSettingsPage.tsx:80-236` (TABS), `:243-267` (gate).

Tabulka tabů (FE `TABS` pole, `WorldSettingsPage.tsx:80-236` — **19 tabů**):

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
| Souboj v chatu | `chat-souboj` | PJ | — | `ChatCombatDefaultsTab` (16.1e) |
| Emoty světa | `emotes` | PomocnyPJ | — | `WorldEmotesAdminPage` |
| Kalendáře | `kalendare` | PomocnyPJ | — | `CalendarConfigsPage` |
| Šablona deníku | `sablona-deniku` | PJ | `vlastni` (custom) | `WorldDiarySchemaEditorPage` |
| Šablona bestie | `sablona-bestie` | PJ | `vlastni` (custom) | `WorldEntitySchemaEditorPage` (16.2g F2) |
| Vzhled | `vzhled` | PomocnyPJ | — | `ThemeTab` |
| Můj vzhled | `muj-vzhled` | Ctenar | — | `MyThemeTab` |
| Členství | `clenstvi` | Ctenar | — | `MembershipTab` |
| Export / Záloha | `export` | PJ | — | `ExportTab` (14.7c) |
| Smazat svět | `smazat` | PJ | — | `DeleteWorldTab` |

---

### Tab Základní info
- **Co to je:** metadata světa — název, popis („Identita"), žánr (preset/vlastní), „Koho hledáte", kapacita (maxPlayers), herní systém (preset/vlastní), kostky/mechaniky (PillChips), viditelnost hodů na mapě (3 checkboxy), hero obrázek.
- **Co jde dělat:** ukládá **jen změněná pole** (delta) přes `PATCH /worlds/:id`. Slug je readonly (nelze měnit z UI). Změna systému smart-replace kostek a na BE archivuje + re-seeduje diary schema.
- **Kdo (FE):** Korektor+. **Kdo (BE):** `update()` → `canEditWorldData` = world role **Korektor+** (membership, nebo elevovaný platform Admin) — `worlds.service.ts:648-659`, `:2763-2772`.
- **Viditelnost hodů na mapě:** `diceVisibility` = `{ showPjRolls, showNpcBestieRolls, showTeammateRolls }`, default jen spoluhráči. Uplatní se na taktické mapě (10.2j).
- **Hranice:** žánr/systém se ukládá jako string (preset i custom). Slug se mění jinde (`PATCH /worlds/:id/slug`, není v UI nastavení). Změna systému přepíše schémata deníku.
- **Stav:** ✅
- **Kód:** FE `tabs/BasicInfoTab.tsx`; BE `worlds.controller.ts:168-182`, `worlds.service.ts:648`.

### Tab Přístup (režim přístupu + výkladní skříň)
- **Co to je:** přepínač `accessMode` světa: `public` (Veřejný, okamžitý vstup jako Čtenář), `open` (Veřejný se schválením — žádost), `private` (Soukromý — vidí jen členové+žadatelé, vstup přes žádost), `closed` (Uzavřený — nikdo nový, ani žádostí). Navíc **22.4 „výkladní skříň"** — toggle `publicShowcase` (veřejné nahlížení anonymem, viz kap. 09).
- **Co jde dělat:** přepnout režim; přechod na „Uzavřený" potvrzuje dialog. Ukládá `PATCH /worlds/:id { accessMode }` / `{ publicShowcase }`.
- **Kdo (FE):** Korektor+; toggle vitríny je disabled na privátním světě (`AccessModeTab.tsx:87-92`). **Kdo (BE):** `accessMode` → `canEditWorldData` (Korektor+); **`publicShowcase` → `canAdminWorld` (PJ+)** — governance rozhodnutí (`worlds.service.ts:685-700`). Vitrína na `private` světě = 400 `SHOWCASE_PRIVATE_WORLD`.
- **Hranice:** žádné per-člen výjimky; režim je globální pro svět. Join/žádosti řeší samostatné endpointy (`/join`, `/access-request`, approve/reject — `worlds.controller.ts:249-323`).
- **Stav:** ✅
- **Kód:** FE `tabs/AccessModeTab.tsx`; BE `worlds.service.ts:648`, `:685`.

### Tab Členové
- **Co to je:** tabulka členů — řádky `MemberRow` (role, skupina, AKJ úroveň, přiřazení postavy, odebrání, „vytvořit postavu pro člena"). Pod tabulkou pro PJ+ panel **Skupiny a barvy** (`GroupColorEditor`).
- **Co jde dělat:**
  - Změna role člena — `PATCH /worlds/:wid/members/:mid/role`.
  - Změna skupiny — `.../group`. AKJ úroveň — `.../akj`. Přiřazení postavy — `.../character` (nese i avatarUrl postavy). Toggle `isFree` — `.../free`. Odebrání člena — `DELETE .../members/:mid`.
  - **Skupiny + barvy + znak:** `GroupColorEditor` ukládá přes `PUT /worlds/:wid/settings` tři pole: `customGroups` (názvy), `groupColors` (mapa název→hex), `groupImages` (mapa název→URL znaku). Barva odlišuje skupinu v chatu/seznamech; znak (emblém) se zrcadlí do ikony linkovaného chat kanálu.
- **Kdo (FE):** tab PomocnyPJ+; panel Skupiny jen PJ+ (`viewerRole >= PJ`). **Kdo (BE):**
  - member operace (role/group/akj/character/free) → `canManageMembers` = **PomocnyPJ+** (`worlds.service.ts:2753-2762`).
  - skupiny/barvy/znak přes `PUT /settings` → `canAdminWorld` = **PJ+** (`worlds.service.ts:1788-1816`, `:2738-2751`).
- **Hranice:** každý member endpoint volá `assertMembershipInWorld` (N-18) — nelze měnit membership z cizího světa. Skupiny založí jen PJ (parita FE/BE OK). R-03 — `updateMemberRole` má navíc strop role (vertikální eskalace) a roli vlastníka nelze měnit jinak než přes `transferOwnership` (`worlds.service.ts:1999-2010`).
- **Stav:** ✅
- **Kód:** FE `tabs/MembersTab.tsx`, `components/GroupColorEditor.tsx`; BE `worlds.controller.ts:452-602`, `worlds.service.ts:1973-2225`.

### Tab AKJ úrovně
- **Co to je:** definice „stupňované prověrky" (AKJ) řídící viditelnost wiki stránek. Editor `AkjLevelEditor`, úrovně se libovolně pojmenují.
- **Co jde dělat:** CRUD úrovní (`key`, `name`, `level`). Ukládá přes dedikovaný `PUT /worlds/:wid/settings/akj-types`.
- **Kdo (FE):** PomocnyPJ+. **Kdo (BE):** `updateAkjTypes` → `canManageMembers` = **PomocnyPJ+** (`worlds.service.ts:1866-1893`). Záměrně oddělený endpoint, aby AKJ zvládl i PomocnyPJ bez plného PJ-only `PUT /settings`.
- **Hranice:** přiřazení úrovní jednotlivým členům je v tabu Členové (ne tady). Vlastní AKJ logika (zámek záložek) je v modulu stránek.
- **Stav:** ✅
- **Kód:** FE `tabs/AkjTab.tsx`; BE `worlds.controller.ts:493-505`, `worlds.service.ts:1866`.

### Tab Postavy & NPC (viditelnost subdoc záložek)
- **Co to je:** matice viditelnosti subdokumentových záložek na detailu postavy podle typu (PostavaHrace / NPC) × tab (Deník, Finance, Výbava, Kalendář, Poznámky). Tab „Profil" je vždy povinný (mimo matici).
- **Co jde dělat:** zapnout/vypnout, reset na výchozí. Ukládá `PUT /worlds/:wid/settings { characterTabVisibility }`.
- **Kdo (FE):** PJ. **Kdo (BE):** `updateSettings` → `canAdminWorld` = **PJ+**. BE má whitelist + dedup (`CHARACTER_TAB_WHITELIST`, `sanitizeUpdateSettingsDto`, `worlds.service.ts:1818-1850`).
- **Hranice:** skrytí je čistě filtr pohledu — data se nemažou, jen zmizí z UI. Filtruje pohled rolí, které by jinak měly přístup ke všem subdoc tabům (PJ, PomocnyPJ, vlastník PC).
- **Stav:** ✅
- **Kód:** FE `tabs/CharacterTabsVisibilityTab.tsx`; BE DTO `dto/update-world-settings.dto.ts:17-24` (whitelist), `:160-163` (pole).

### Tab Šablony (per-svět šablony stránek)
- **Co to je:** CRUD šablon atributových tabulek pro nové stránky (8.1d). Karty s ikonou, počtem polí, default titulkem.
- **Co jde dělat:** vytvořit/upravit/smazat šablonu (label, key, ikona, hlavičky polí, defaultTitle). Použijí se v editoru stránek jako stripe karet.
- **Kdo (FE):** Korektor+. **Kdo (BE):** modul `world-page-templates` — CRUD `assertCanManage` = **Korektor+** (`world-page-templates.service.ts:155-176`), GET přes `assertCanViewWorld` (FIX-58 — nečlen privátního světa šablony nepřečte, `:41-46`). Klíč musí být unikátní v rámci světa (`TEMPLATE_KEY_TAKEN`).
- **Hranice:** smazání šablony nemění existující stránky, které ji použily.
- **Stav:** ✅
- **Kód:** FE `tabs/PageTemplatesTab.tsx`, `pages/api/useWorldPageTemplates.ts`.

### Tab Mapy (výchozí nastavení map světa — 15.4 E)
- **Co to je:** PJ nastaví výchozí parametry map světa: typ mřížky (hex/čtverec/žádná), velikost buňky, měřítko (jednotek/buňku + jednotka), zobrazit stupnici, viditelnost HP (PC/NPC/bestie), povolit kreslení hráčům. **Každá nově založená scéna je zdědí**; existující scény zůstávají a každou lze přepsat v „Upravit scénu".
- **Kdo (FE):** tab PJ+. **Kdo (BE):** `PUT /worlds/:worldId/settings` (`mapDefaults`, PJ+ `canAdminWorld`).
- **Zvláštnost:** seed je **server-side** v `MapsService.create` (jen když scéna není ze šablony ani s explicitním configem) — schválně mimo `CreateMapDto` (jeho `HexConfigDto` whitelist by nová pole zahodil). `mapDefaults` = volný objekt na `WorldSettings` (vzor `pjChatPersona`).
- **Hranice:** dědí jen NOVÁ scéna; změna defaultů nepřepíše existující scény.
- **Stav:** ✅
- **Kód:** FE `tabs/MapDefaultsTab.tsx`; BE `worlds` (schema/interface/dto/repo `mapDefaults`, DTO `:187`) + `maps/maps.service.ts` (seed v `create`).

### Tab Souboj v chatu (16.1e)
- **Co to je:** výchozí viditelnost HP v **combat rosteru chatu** per typ účastníka — `showHpPc` / `showHpNpc` / `showHpBestie` (všechny default `true`).
- **Co jde dělat:** PJ nastaví jednou; každá konverzace hodnoty zdědí, dokud je nepřebije vlastním 👁 přepínačem v panelu Souboj.
- **Kdo (FE):** PJ+. **Kdo (BE):** `PUT /worlds/:worldId/settings` (`chatCombatDefaults`, PJ+ `canAdminWorld`).
- **Hranice:** samostatné od `mapDefaults` (chat ≠ taktická mapa); per-konverzace přepis defaulty nemění.
- **Stav:** ✅
- **Kód:** FE `tabs/ChatCombatDefaultsTab.tsx`; BE DTO `update-world-settings.dto.ts:193`.

### Tab Šablona deníku (diary schema editor) — základ „Vlastního systému" (16.2g F1)
- **Co to je:** editor schématu deníku postavy (8.5) — jádro **„Vlastního systému"** (meta-systém 16.2g). Záložka jen pro svět se systémem **„Vlastní Systém"** (`SYSTEM_CUSTOM_ID = 'vlastni'`, explicitní alias → `generic` engine v `systemId.ts`) — u presetů je schema seedované automaticky.
- **Co jde dělat:** definovat bloky schématu (key/label/type/config/order) — **9 typů**: `stat`/`number`/`bar`/`list`/`text`/`textarea`/`image`/`relation`/`formula`; seskupit bloky do **sekcí** (`config.layoutArea`); u `formula` zadat **vzorec** (`config.expression`, počítá z `key` číselných bloků); import/export JSON; verzování (archiv předchozích, remap klíčů). **Prázdný svět nabídne 3 startovní šablony** (Fantasy/Sci-fi/Minimal) nebo start od nuly.
- **Vyplňování hodnot postavy:** hráč v deníku postavy (`DiaryTab`) vyplní hodnoty všech typů — `number` číselný input, `textarea` víceřádkový, `relation` **picker postavy** (`PagePicker`, ukládá slug), `formula` je **read-only** (dopočítává se z ostatních polí, nejde ručně přepsat). Bloky se zobrazí seskupené do sekcí. Per-postava override schématu přes „Vlastní šablona".
- **Kdo (FE):** PJ + `minSystem='vlastni'`. **Kdo (BE):** verzování přes `POST /worlds/:id/diary-schema-versions` → **PJ+**. Vytvoření nové verze archivuje předchozí a inkrementuje `version`. `config` je na BE **volný objekt** (`MixedArraySubSchema` `strict:false`, DTO `@IsObject`) → `expression` projde bez BE změny/restartu.
- **Hranice:** u presetových systémů tab vůbec není (gate `minSystem`). Změna systému v Základní info re-seeduje schema. `formula` odkazuje na `key` číselných bloků (identifikátor bez diakritiky/pomlček); vzorec umí `+ − * / %` a závorky, **ne funkce**. Vlastní kostkové mechaniky (F4) čekají — hody bestie zatím 4dF.
- **Skiny (F6, 2026-07-02):** vlastní systém (generic) má **8 vlastních skinů** (blokové karty) přepínatelných na deníku postavy (🎨 Vzhled) — propíšou se do deníku, bojového panelu na mapě i v chatu (PC i bestie), obalů, hodů, dicelogu, orchestrace. MLP = světlý/duhový. `styles/generic-skins/*` + `generic` v `:is()` embed seznamech; per uživatel×svět. Render-ověřeno.
- **Stav:** ✅ deník builder (F1) + bestie builder (F2) + 8 skinů (F6) · 🚧 F4 (vlastní kostky)
- **Kód:** FE `pages/WorldDiarySchemaEditorPage` (+`templates/starterTemplates.ts`, `components/{BlockConfigPanel,SchemaPreview}.tsx`, `utils/schemaMappers.ts`), `CharacterDetailPage/components/{DiaryTab,DiaryBlockView,diaryFormula}.tsx` + `editors/SchemaValueEditor.tsx`, `world/systemId.ts` (alias `vlastni→generic`); BE `worlds.service.ts` diarySchemaVersion metody, `diary-schema-versions.schema.ts` (config volný). Spec `docs/arch/phase-16/spec-16.2g-vlastni-system.md`.

### Tab Šablona bestie (16.2g F2) — jen „Vlastní Systém"
- **Co to je:** editor per-svět schématu bestie (statblok) pro „Vlastní Systém". Analog „Šablony deníku", ale drží bohatší `SystemEntitySchema.sections` (pole s `combatBehavior` → HP bar / iniciativa na mapě). Statblok se z něj vykreslí v bestiáři, na taktické mapě i v chatu.
- **Co jde dělat:** definovat sekce → pole (název/klíč/typ `number|string|enum|boolean|computed`, `combatBehavior`, min/max, možnosti enumu, vzorec, povinné); živý náhled přes `EntityStatbar`; start ze základní šablony (HP/zbroj/pohyb/iniciativa) nebo z prázdné. Uložení = nová verze (archivuje předchozí).
- **Kdo (FE):** PJ + `minSystem='vlastni'`. **Kdo (BE):** `POST /worlds/:id/entity-schema-versions` → **PJ+** (`EntitySchemaVersionsService` přes `WorldsService.assertCanAdminWorld`); read = member. Kolekce `entity_schema_versions` (worldId+entityType+version).
- **Render:** FE `useResolvedEntitySchema(worldId, systemId, entityType)` — pro `vlastni` vezme world verzi (token fallbackuje na world `bestie` = jedno schéma katalog+mapa), jinak/dokud nedorazí statický registry (`generic:bestie`/`generic:token`). Napojeno v `BestieStatblock` (mapa+chat), `BestiePanelView`, `BestieEditorModal`.
- **Validace bestií:** `BestiaeService` validuje `systemStats` scope='world' proti world schématu (`SystemStatsValidator.*WithSchema`), jinak registry; soft-mode (chybí schéma → projde).
- **Hranice:** jen deník + bestie statblok; **hody z bestie = 4dF** (vlastní kostková mechanika = F4). Vzhled panelů = generický (skiny = F6). U presetových systémů tab není.
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
- **Kdo (FE):** PomocnyPJ+. **Kdo (BE):** `world-calendar-config` write floor = PomocnyPJ+. Default kalendář + timelineEpoch přes `PATCH /worlds/:wid/calendar-defaults` (PomocnyPJ+, R-NEW, `worlds.service.ts:1895-1950`, controller `:506-520`).
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
- **Kdo (FE):** **PomocnyPJ+** (dřív Korektor — viz bug níže). **Kdo (BE):** ukládá přes `PATCH /worlds/:id` (`themeId`, `themeOverrides`, `themeBackgroundUrl`); cílený guard JEN na theme pole → `canManageMembers` = **PomocnyPJ+** (`worlds.service.ts:665-681`), zbytek polí (jméno/popis) zůstává Korektor+ přes `canEditWorldData`. BE sanitizuje overrides (`sanitizeThemeOverrides`: jen `--theme-*` klíče, max 60 — `worlds.service.ts:134`), úklid starých blobů pozadí (UM-03).
- **Hranice:** sdílený skin/barvy/pozadí mění jen vedení (PomocnyPJ+); písmo se tu nenastavuje. `null` pozadí = clear.
- **Stav:** ✅
- **Kód:** FE `tabs/ThemeTab.tsx`, `WorldSettingsPage.tsx:196-205` (tab gate), `components/ThemePresetGrid.tsx`, `components/ThemeCustomEditor.tsx`; BE `worlds.service.ts:665` (`update` theme guard).

### Tab Můj vzhled (per-uživatel — vlastní motiv, pozadí, barvy, a11y)
- **Co to je:** osobní vzhled světa **jen pro mě** (5.9 + 5.9b). 5.9 = jas/kontrast/barvy nad sdíleným skinem; **5.9b nově = vlastní motiv (skin) a vlastní pozadí**. Vše na membershipu, nepropisuje se do World ani jiným členům.
- **Co jde dělat:** vybrat vlastní **motiv** (`ThemePresetGrid` → `themeId`), nahrát vlastní **pozadí** (`themeBackgroundUrl`), vlastní barvy (`themeUserOverrides`), posuvníky jas/kontrast (0.7–1.3), „Zpět na vzhled PJ" (clear všeho). Ukládá `PUT /worlds/:wid/members/me/theme`.
- **„Follow PJ":** vlastní `themeId` se ukládá jen když se LIŠÍ od `world.themeId` (jinak `null`) → člen není zaseknutý na starém motivu, když PJ změní sdílený. Pozadí funguje i samostatně nad sdíleným motivem.
- **Vrstvení:** vlastní motiv člena = samostatná vrstva (PJ overrides/pozadí laděné pro skin světa se na cizí skin nevztáhnou); bez vlastního motivu jen vrší úpravy nad sdíleným. Viz `WorldLayout.tsx`.
- **Kdo (FE):** Ctenar+ (každý člen). **Kdo (BE):** `updateMyTheme` (`worlds.service.ts:2226`, controller `:604-618`) — vyžaduje jen **membership** (jakákoli role), self-scoped (`me` z JWT); `themeUserOverrides` prochází `sanitizeThemeOverrides` (`:2256`). `''`/`null` z FE = clear (`$set: null`); `undefined` Mongoose stripne (backward-compat).
- **Hranice:** font člen stále nemění (out of scope 5.9b). Jas+kontrast jako CSS `filter` na obsahové vrstvě.
- **Stav:** ✅
- **Kód:** FE `tabs/MyThemeTab.tsx`, `WorldLayout.tsx` (resolver), `shared/types` (`WorldMembership.themeId/themeBackgroundUrl`); BE `worlds.controller.ts` (`me/theme`), `worlds.service.ts` (`updateMyTheme`), `world-membership.schema.ts` + `.repository.ts` (`toEntity`), `dto/update-member.dto.ts`.

### Tab Členství (odejít / předat svět)
- **Co to je:** ukončení vlastního členství + (pro vlastníka) předání světa.
- **Co jde dělat:**
  - **Odejít ze světa** — `DELETE /worlds/:wid/members/:mid` na vlastní membership. Vlastník odejít **nemůže** (musí nejdřív předat).
  - **Předat svět** (jen vlastník) — modal s výběrem nového vlastníka (člen role Hráč+); `PATCH /worlds/:id/owner`. Po předání: nový = PJ, původní = PomocnyPJ.
- **Kdo (FE):** Ctenar+ (sekce předání jen vlastník). **Kdo (BE):** `transferOwnership` smí **jen vlastník** světa (ne platform Admin, ani elevovaný — R-NEW, `worlds.service.ts:2614`). Nový vlastník musí být člen.
- **Hranice:** předání nelze vzít zpět bez součinnosti nového vlastníka. Kandidáti = členové Hráč+ kromě sebe.
- **Stav:** ✅
- **Kód:** FE `tabs/MembershipTab.tsx`; BE `worlds.controller.ts:204-218` (`PATCH :id/owner`), `:452-464` (`DELETE members/:id`).

### Tab Smazat svět (soft-delete)
- **Co to je:** soft-delete světa s 30denním recovery oknem.
- **Co jde dělat:** smazat svět (dvojí potvrzení). Data zůstávají; obnovit do 30 dní může **jen administrátor**, po 30 dnech cron hard-delete (`world-cleanup.cron.ts`).
- **Kdo (FE):** tab PJ. **Kdo (BE):** `softDelete` → `canAdminWorld` = **PJ membership NEBO elevovaný platform Admin/Superadmin** (FIX-19, RUN-2026-07-05 — `worlds.service.ts:2347-2388`). **Obnova** (`POST /worlds/:id/restore`) → jen Admin/Superadmin, do 30 dní, **bez elevace** (elevation-exempt, `worlds.service.ts:2390-2426`).
- **✅ VYŘEŠENO 2026-07-05 (FIX-19):** FE text „PJ vlastník i Admin" (`DeleteWorldTab.tsx:11`) je teď přesný pro **elevovaného** Admina — dřív `canAdminWorld` elevaci vůbec nečetl (dead parametr), takže i s aktivním "Admin režimem" mazání spadlo na 403.
- **Stav:** ✅
- **Kód:** FE `tabs/DeleteWorldTab.tsx`; BE `worlds.service.ts:2347`, `worlds.controller.ts:219-247`.

---

## Export / Záloha světa (14.7c)

### Co to je
Stažení kompletních dat jednoho světa do ZIP (JSON strom). Pilíř B spec-14.7 — uživatelova vlastní záloha proti vendor lock-inu.

### Kde
- FE tab „Export / Záloha" v `WorldSettingsPage` (`tabs/ExportTab.tsx`), JEN PJ.
- BE `GET /worlds/:worldId/export?chat=` → `world-export.service.streamExport` (`modules/world-export/`).

### Kdo
- FE: tab `minRole: WorldRole.PJ`.
- BE: `resolveScope` (`world-export.service.ts:145-169`) — **elevovaný** platform Admin/Superadmin (`worldAdminBypass`, `:156`) nebo `WorldRole.PJ` → `pj-full`. Role < Hráč / nečlen → 403 `EXPORT_FORBIDDEN`; Hráč–PomocnyPJ → `viewer-partial`, a ten `streamExport` odmítá 403 `EXPORT_VIEWER_PARTIAL_NOT_READY` (`:179-184`). Hráčský `viewer-partial` je **vědomě mimo scope** (viz Hranice).

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
- **Moderačně skrytý deník se do ZIP nedostane (D-066-ZBYTKY b, 2026-07-13):** export čte diary repo přímo, MIMO moderation gate `assertDiaryNotModerationHidden` — bez filtru by PJ-full ZIP vynesl obsah, který PJ v UI nevidí (skrytý deník vidí jen platform revieweři, vlastník i PJ dostanou 404). `characterSubdocs.diaries[]` se proto filtruje přes `omitModerationHiddenDiaries` (deník s `moderationHidden:true` se **celý vynechá**, žádný placeholder; legacy dokument bez flagu zůstává). Kryto testem `export-moderation.spec.ts`. Kód: BE `world-export/export-moderation.util.ts`.
- `archiver` 8 = `new ZipArchive()` (ne factory `archiver()`).
- Média: `collectMediaUrls` rekurzivně projde JSON strom, `fetch` → `media/N.<ext>` + mapa do `media-manifest.json` (pro budoucí import re-upload).

### Stav
✅ funguje (export) — `pj-full` ZIP kompletní vč. **médií / gm-notes / chatu**; `viewer-partial` vědomě mimo scope; **import odložen**.

### Kód
FE `WorldSettingsPage/tabs/ExportTab.tsx`; BE `modules/world-export/{world-export.controller,world-export.service,world-export.module}.ts`.

---

## Per-svět téma / skin (jak se aplikuje)

- **Co to je:** svět má vlastní skin (`themeId`), barevné overrides, pozadí. Tyto se aplikují na celý shell světa i na `:root` (kvůli portálům — modaly žijí mimo `.shell`).
- **Kde:** FE `src/app/layout/WorldLayout/WorldLayout.tsx`, `src/themes/state.ts`, `src/themes/applyTheme.ts`, `src/themes/worldTheme.ts`.
- **Jak (ověřeno):**
  - `resolveWorldTheme(world)` dá `themeId/overrides/backgroundUrl` (`WorldLayout.tsx:443`).
  - **Náhled má přednost:** `worldThemePreviewAtom` (z editoru) > `World` data (`:442`, `:468-469`).
  - **Vrstvení (5.9b):** motiv = `preview ?? membership.themeId ?? world.themeId` (`:452`); když má člen vlastní motiv (≠ svět), je jeho vrstva SAMOSTATNÁ (jen `membership.themeUserOverrides`/pozadí, bez PJ overrides cizího skinu); jinak `{ ...world.themeOverrides, ...membership.themeUserOverrides }` (`:456-466`). Vlastní `membership.themeBackgroundUrl` přebíjí pozadí světa.
  - **Jas/kontrast** člena = CSS `filter` na `<main>` (`:471-479`).
  - **Vlastnictví `:root`:** atom `worldThemeActiveAtom` (`themes/state.ts:44`) — dokud je `WorldLayout` mountnutý, `ThemeProvider` přeskočí globální `applyTheme` (jinak by race po opuštění profilu přepsal world skin globálním motivem, `WorldLayout.tsx:497-501`). Pozadí přes `||` (ne `??`), aby prázdný string spadl na pozadí skinu (`:484`).
  - **Efekt skinu:** `theme.effect === 'matrix-rain'` → `<MatrixRain>` (brand identita skinu `ikaros`, `:560`).
  - **EXIT:** unmount obnoví globální motiv uživatele (`:513-517`).
- **Kdo nastavuje:** vedení PomocnyPJ+ (tab Vzhled, sdílený výchozí); každý člen Ctenar+ (tab Můj vzhled — vlastní motiv/pozadí/barvy/a11y jen pro sebe).
- **Stav:** ✅
- **Kód:** `WorldLayout.tsx:439-517`, `themes/state.ts:7-44`.

---

## Hlavní lišta / menu builder (`WorldHeadlineAdminPage`, spec 12.2)

- **Co to je:** dedikovaná stránka `/svet/:slug/admin/headline` — jediné místo pro řízení horní lišty světa: viditelnost modulů + vlastní navigace + šablony menu + „Last info" box. Vlevo editor, vpravo živý náhled, jedno tlačítko Uložit (dirty-tracking).
- **Kde:** FE `pages/WorldHeadlineAdminPage/WorldHeadlineAdminPage.tsx` + `components/*`. Rozcestník na ni vede z tabu Nastavení „Hlavní lišta" (`HeadlineLinkTab.tsx`).
- **Kdo (FE):** route guard `WorldMembershipGuard minWorldRole=PJ` (fallback Sa/Admin) — `router.tsx:496-508`. **Kdo (BE):** ukládá `PUT /worlds/:wid/settings` → `canAdminWorld` = **PJ+**.

### Sekce: Viditelnost modulů (`NavVisibilitySection`)
- Skryje/zobrazí moduly v horní liště. Whitelist skrývatelných = `HIDEABLE_NAV_ITEMS` (`worldNavConfig.ts:29-134`, **16 položek**) ve skupinách Informace / Svět / Hra / top-level.
- **Skrývatelné:** Magický systém, Technologie · Časová osa, Mapa vesmíru, Atlas map, Pavučina, Obchod, **Akce** · Taktická mapa, Bestiář, Storyboard, Generátor počasí, Převodník měn, Zvuková databáze, **Stavitel** (podzemí/města) · Kalendář.
- **NELZE skrýt (esenciál = položky bez `id`):** Skupiny, Pravidla (skupina Informace), Stránky (skupina Svět) — `isNavItemHidden` je defense-in-depth (`worldNavConfig.ts:142-149`): id mimo `HIDEABLE_NAV_IDS` projde vždy, i kdyby ho někdo do `hiddenNavItems` vsunul. „Přehled" a „Novinky" v nav vůbec nejsou — Přehled je přes název světa, Novinky na úvodní stránce (spec 12.3 R1/R2).
- **Hranice:** skrytí se týká **jen navigace** — přes URL je stránka stále dostupná (skrytí ≠ zákaz přístupu).
- Ukládá do `hiddenNavItems[]`.

### Sekce: Vlastní navigace (`CustomHeadlineBuilder`)
- Strom: top-level uzly = skupina (rozbalovací menu, 1 úroveň odkazů) nebo přímý odkaz. Řazení tlačítky ↑/↓ (touch-safe). Cíl odkazu přes `LinkTargetEditor`.
- Tato navigace se přidá **za** systémovou (aditivně) — `buildFullWorldNav` (`worldNavConfig.ts:293-310`).
- Ukládá do `customHeadline[]` (`HeadlineNode`).

### Sekce: Šablony menu (`MenuTemplatesSection`)
- Pojmenované sady odkazů; tlačítko „Vložit" rozbalí šablonu jako novou skupinu do vlastní navigace. Ukládá `menuTemplates[]`.

### Sekce: „Last info" box (`LastInfoSection`)
- Krátké oznámení PJ (max 280 znaků, DTO `LastInfoDto`) — proužek pod hlavičkou (`LastInfoBar`). Toggle viditelnosti, `null` = nenastaveno. Server je autorita nad `updatedAt` (po změně textu se proužek objeví znovu i po dismissu). Ukládá `lastInfo` (`worlds.service.ts:1822-1836`).

### Systémová navigace + gating (ověřeno)
- `buildWorldNav` (`worldNavConfig.ts:163-267`): skupiny Informace / Svět / Hra + top-level Kalendář.
- **Role-aware skrývání nad rámec whitelistu:** Časová osa, Generátor počasí a Stavitel jen pro Hrac+ (`canAccess(Hrac)`); Kalendář jen pro PomocnyPJ+; Deník PJ a Storyboard jen pro `isPJ` (`worldNavConfig.ts:220-264`). To je parita s route guardy (N-04/05), aby klik nevedl na tichý redirect.
- **Existence referenční stránky (D-NEW-INV-WIKI):** `buildWorldNav` bere navíc `existingPageSlugs` — odkazy Magický systém/Technologie zmizí, když stránka neexistuje (`:180-181`, `:196-208`). `undefined` = ukaž vše (BC pro náhled 12.2 a testy).
- `WorldLayout` skládá nav přes `buildFullWorldNav(slug, isPJForNav, hiddenNavItems, customHeadline, customGroups, canAccess, existingPageSlugs)` (`WorldLayout.tsx:360-372`).
- **Hranice:** vlastní navigace je čistě aditivní; nelze přeřadit/skrýt systémové položky přesunem, jen je vypnout přes whitelist.
- **Stav:** ✅
- **Kód:** FE `WorldHeadlineAdminPage.tsx`, `worldNavConfig.ts`, `WorldLayout.tsx`; BE DTO `update-world-settings.dto.ts:46-64` (Headline/MenuTemplate/LastInfo) + `:117-194` (settings DTO), `worlds.service.ts:1788`.

---

## Datový model nastavení (BE)

`WorldSettings` (perzistuje přes `PUT /worlds/:wid/settings`, DTO `update-world-settings.dto.ts:117-194`):
`hiddenNavItems[]`, `customGroups[]`, `groupColors{}`, `groupImages{}`, `currencies[]`, `hideDefaultWeather`, `customHeadline[]` (HeadlineNode), `lastInfo|null`, `akjTypes[]`, `menuTemplates[]`, `diarySchema[]`, `characterTabVisibility`, `pjChatPersona|null`, `timelineCalendarSlug|null`, **`mapDefaults|null`** (15.4 E), **`chatCombatDefaults|null`** (16.1e).

**Read gating** (`getSettingsForRequester`, `worlds.service.ts:1748-1786`): Admin/Sa + člen → plný objekt; nečlen veřejného světa → veřejný subset (`toPublicSettings`, `:1777`, nuluje `akjTypes/diarySchema/menuTemplates/lastInfo/pjChatPersona`); nečlen **privátního** světa → 404.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

1. ✅ VYŘEŠENO 2026-07-05 (FIX-19, RUN-2026-07-05) — **Mazání světa — FE text vs. BE realita.** `DeleteWorldTab.tsx` (a route komentář `WorldSettingsPage.tsx:176`) říká, že mazat smí „PJ vlastník i Admin". Do 2026-06-18 šlo o špatný text (BE Admina vůbec nepouštěl); po zavedení elevace (2026-06-21) FE tab elevovanému Adminovi ukazoval, ale `canAdminWorld` elevaci ještě nečetl → mazání spadlo na 403 i s aktivním "Admin režimem". Teď `canAdminWorld` čte `worldAdminBypass` — text je pravdivý pro **elevovaného** Admina/Superadmina.
2. **`getSettings` (interní, `worlds.service.ts:1737`) vs. `getSettingsForRequester` (REST, `:1748`).** `ensureWorldChat`/persona čtou přes interní `getSettings` (plný objekt) — REST GET prochází filtrem. Konzistentní, ale dva čtecí vstupy = riziko driftu při přidání citlivého pole (přidat ho i do `toPublicSettings`, `:1777`). **Stále platí** (ověřeno 2026-07-20) — od doby zápisu přibyla pole `mapDefaults`/`chatCombatDefaults`, obě neutrální, do `toPublicSettings` je nikdo nepřidal.
3. **`hideDefaultWeather` / `currencies` v DTO, ale bez vlastního UI tabu v Nastavení.** Currencies řeší Převodník měn, počasí svůj modul — v Nastavení nemají záložku. Není bug, jen nejednotnost „vše v Nastavení".
4. **Vlastní navigace nevaliduje cíl odkazu proti reálným routám.** **Stále platí** (ověřeno 2026-07-20): `HeadlineNodeDto.to` je volný `@IsString() @MaxLength(512)` (`update-world-settings.dto.ts:58`), `LinkTargetEditor.tsx` žádnou kontrolu existence nedělá. Odkaz na neexistující world routu projde a vede na 404/catch-all. Zvážit validaci/varování v `LinkTargetEditor`.
5. ✅ VYŘEŠENO 2026-06-27 (D-NEW-INV-SEC) — **`themeUserOverrides` sanitizace doplněna.** `updateMyTheme` aplikuje **stejný** `sanitizeThemeOverrides` jako world-level update (`--theme-*` prefix, max 200 zn., max 60) — `worlds.service.ts:2256`, definice `:134`. BE už nepřijme cizí custom properties z přímého API; FE editor není jediný garant.
