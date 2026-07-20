# 15 — Čas & příběh

Kapitola pokrývá nástroje světa pro plynutí času (kalendář, multi-kalendáře, počasí, in-game datum), historii (časová osa), nadcházející herní akce (RSVP + komentáře) a vyprávění (pavučina vztahů, storyboard scénářů). Vše ověřeno v kódu FE i BE.

Role-zkratky (světové, vzestupně): Zadatel(0) < Ctenar(1) < Hrac(2) < Korektor(3) < PomocnyPJ(4) < PJ(5). Globální Admin/Superadmin většinou obchází světové brány (`requester.role <= UserRole.Admin` shortcut).

---

### Kalendář světa (PJ pohled)
- **Co to je:** Měsíční mřížka sjednocující **herní akce** (game-events) + **kalendářové události postav/NPC/Lokací** (character calendar subdoc agregát) do jednoho přehledu. Nazváno v UI „Kalendář světa — PJ pohled".
- **Kde:** route `/svet/:slug/kalendar` (`CalendarPage`). Menu „Kalendář" (top-level, hideable).
- **Kdo:**
  - FE — route gate `memberOnly(PomocnyPJ)` (R-18 — viz `router.tsx:420`). V nav se položka zobrazí jen `canAccess(PomocnyPJ)`.
  - BE — agregát `GET /worlds/:id/calendars/aggregate` přes `assertCanModerate` = **PomocnyPJ+** (nebo Admin+). Neexistující svět → 404, nečlen/nízká role → 403.
- **Co jde dělat:**
  - Měsíční mřížka generovaná z aktivního `CalendarConfig` (počet sloupců = `daysOfWeek.length`), navigace šipkami ±měsíc, tlačítko „Dnes", **skok na rok+měsíc** přes popover (jump).
  - **Přepínač zobrazeného kalendáře** (`select`) — jen pokud má svět víc než 1 config; události z různých kalendářů se konvertují přes absolutní den (`toAbsDay`/`fromAbsDay`).
  - **Filtr entit** (sidebar strom): typy akce / postavy / NPC / Lokace + per-entita zaškrtnutí; „Skrýt vše" / „Reset". Persistuje rozbalené skupiny v `localStorage` per svět; skryté entity jen session.
  - **Barva entity v kalendáři** — klik na swatch otevře `GroupColorPicker`, uloží `PATCH /worlds/:id/calendars/:slug/settings` (color / Auto dle názvu). gameEvents nemají vlastní barvu (fixní `#7c5cff`).
  - **Hustota (density)** — compact / detail toggle s auto-fallbackem podle max událostí na den; perzistováno per svět.
  - **Den detail drawer** se VŠEMI akcemi dne (čitelný seznam: čas, název, typ, entita) — otevře ho **klik na číslo dne** (Detail i Compact mód, když má den ≥1 akci; u data je počet akcí `12. · 5` jako signál klikatelnosti), odkaz `+N dalších`, nebo klik na buňku v Heat módu. Plus **modal detailu** jedné události (datum, kalendář, vlastník, popis). Buňky mají overlay lunárních fází a sezónní tint borderu.
  - **Pozice (rok/měsíc) se pamatuje** per svět v `localStorage` přes refresh (`usePersistedCalendarCursor`).
- **Hranice / co neumí:**
  - Je to **read+filter dashboard PJ**, ne editor — nové události se z této stránky **nepřidávají** (akce se tvoří v /akce, kalendářové subdoc události na postavě/NPC/lokaci).
  - Hráč ani Čtenář se sem **vůbec nedostane** (PomocnyPJ floor) — neexistuje „hráčský pohled" na sjednocený kalendář.
  - Skryté entity (per-entita filter) se **neukládají** mezi sessiony (jen rozbalení skupin se ukládá).
  - „Dnes" se mapuje z reálného gregoriánského data přes absDay — **žádný posun in-game času** se zde nepromítá (in-game datum řeší modul Počasí).
- **Zvláštnosti:** Agregát filtruje skryté kalendáře (`displaySettings.isHiddenInAggregate`). `kind`/`isNpc` se enrichuje z `Characters` adresáře (Lokace = `kind:'location'`).
- **Stav:** ✅
- **Kód:** FE `src/features/world/pages/CalendarPage.tsx:79`, buňka `CalendarPage/components/CalendarCell.tsx` (klik na číslo dne → `onExpandDay`), drawer `components/DayDetailDrawer.tsx`, hooks `CalendarPage/hooks/useDensity.ts`, `hooks/useEntityIndex.ts`, `hooks/usePersistedCalendarCursor.ts`. BE controller `backend/src/modules/calendars/calendars.controller.ts:8` (`@Controller('worlds/:worldId/calendars')`), `:13` (`@Get('aggregate')`), `:21` (`@Patch(':slug/settings')`), service `calendars.service.ts:36` (`aggregate`), `:83` (`updateSettings`), `:112` (`assertCanModerate`). Engine `src/shared/lib/calendarEngine/`.

---

### Konfigurace kalendářů (databáze kalendářů)
- **Co to je:** Správa N **fantasy/historických kalendářů** per svět — vlastní měsíce, dny v týdnu, sezóny, nebeská tělesa (lunární fáze), přestupné a lunisolární pravidla. Jeden je **výchozí** (⭐), jeden je vázán na **časovou osu** (🕐).
- **Kde:** route `/svet/:slug/admin/kalendare` (`CalendarConfigsPage`). Layout: sidebar seznam + editor.
- **Kdo:**
  - FE — `WorldMembershipGuard` min **PomocnyPJ** + fallback global Admin/Superadmin (N-08 parita s BE).
  - BE — `worlds/:id/calendar-configs`: GET (list/detail) = **member (Hrac+)**, POST/PATCH/DELETE = **PomocnyPJ+** (`assertCanWrite`). DELETE výchozího → 403 `DEFAULT_CONFIG_LOCKED`. Duplicitní slug → 409 `SLUG_TAKEN`.
- **Co jde dělat:**
  - **2-krokový wizard „+ Přidat kalendář":** (1) picker presetu, (2) identita (název + slug s auto-suffixem při konfliktu). Lze i prázdný kalendář.
  - **14 vestavěných presetů** (definovaných ve FE, kalibrovaných deterministicky): gregorian, julian, solar-hijri, saka, ethiopian, buddhist-thai, coptic, hebrew, islamic-hijri, chinese-simple, egyptian-civil, babylonian, greek-attic, holocene. Kategorie: současné civilní / náboženské / historické / alternativní.
  - **Editor configu** (`CalendarConfigEditor`): název, hodin/den, dny v týdnu, měsíce (název + počet dní), nebeská tělesa, sezóny, `epochOffset`. PATCH = **delta merge** (posílá jen změněná pole). Slug nelze přejmenovat (rename = smaž+vytvoř).
  - **Nastav výchozí** (⭐ → `world.defaultCalendarConfigSlug`) a **Nastav pro časovou osu** (🕐 → `worldSettings.timelineCalendarSlug`).
  - **Přestupné roky** (`leapYearRule`: every-4 / solar-hijri-33 / islamic-30, opt-in) a **lunisolární** (Metonic 19-letý cyklus, opt-in) — engine extension, kalibrace přes `calibrateEpochOffset`.
- **Hranice / co neumí:**
  - Presety jsou **fixní seznam ve FE** (`CALENDAR_PRESETS`) — uživatel nepřidá vlastní preset do knihovny, jen vytvoří/edituje config světa.
  - **Slug je immutable** (přejmenování = nový kalendář).
  - Plánované iterace F-III (Mayan/Aztec/Roman/French Rev/Cotsworth/World Calendar přes `CalendarKind` enum) **nejsou implementované** — jen komentář v `presets/index.ts`.
  - Validace pokrývá jen sezóny (rozsah měsíce/dne) — žádná hlubší kontrola konzistence měsíců.
  - Mazání configu **nemaže** události, které na něj odkazují (`calendarConfigId`) — žádná migrace/sirotčí kontrola.
- **Zvláštnosti:** Auto-seed `gregorian` configu při vzniku světa (`seedGregorianDefault`, idempotentní). Při tvorbě světa lze nasadit víc presetů naráz (`applyPresetTemplate`). BE schéma drží `months/celestialBodies/seasons` jako Mixed array (`MixedArraySubSchema`).
- **Stav:** ✅
- **Kód:** FE `src/features/world/pages/CalendarConfigsPage/CalendarConfigsPage.tsx:29`, editor `CalendarConfigEditor.tsx:26`, picker `components/CalendarPresetPicker.tsx`, presety `src/shared/lib/calendarEngine/presets/index.ts:17–31` (14 presetů), kalibrace `presets/calibration.ts`. BE controller `backend/src/modules/world-calendar-config/world-calendar-config.controller.ts:28` (`@Controller`), `:29` (class), service `world-calendar-config.service.ts:35` (class; `assertCanWrite:374`, `SLUG_TAKEN:105`, `DEFAULT_CONFIG_LOCKED:168`, `seedGregorianDefault:234`), schéma `schemas/world-calendar-config.schema.ts`, celestial utils `world-calendar-config.utils.ts`.

---

### Časová osa (timeline)
- **Co to je:** Vertikální **historická osa světa** — chronologie nejdůležitějších událostí, lidí a míst. Datum dle dedikovaného kalendáře pro timeline.
- **Kde:** route `/svet/:slug/timeline` (`TimelinePage`). Menu „Časová osa" (group „Svět", hideable). Pozn.: BE controller je globální `@Controller('timeline')` s `worldId` v query, ne pod `/worlds/:id`.
- **Kdo:**
  - FE — route gate `memberOnly(Hrac)` (R-06, `router.tsx:423`). V nav skryto Čtenáři (N-05, jen `canAccess(Hrac)`). Zápis = `userRole >= PomocnyPJ` (`canWrite`).
  - BE — read (`GET` list / `year-counts` / `:id`) = **member Hrac+** (`assertMember`; Ctenar → 403 `INSUFFICIENT_ROLE`, Zadatel → 403 `PENDING_MEMBERSHIP`). Write (POST/PUT/DELETE) = **PomocnyPJ+** (`assertCanWrite`).
- **Co jde dělat:**
  - **Cursor pagination** (infinite scroll, `useInfiniteTimelineEvents`, default sort `desc` = nejnovější rok nahoře, v rámci roku ASC). Filtry v URL: `fromYear`, `toYear`, `q` (fulltext title+text), `sort`.
  - **Year scrubber** (sidebar / drawer) z agregátu `{year, count}` (`year-counts`).
  - **Přidat/upravit/smazat událost** (PomocnyPJ+) přes `TimelineEventModal` + `ConfirmDialog`. Pole: rok/měsíc/den/hodina, název, rich-text text, obrázek (focal point), odkaz, `pageSlug` (vazba na stránku), **celestial overrides** (ruční přepis fáze nebeského tělesa pro daný den).
  - **✅ OPRAVENO 2026-07-05 (FUNC-02, RUN-2026-07-05) — „odstranit obrázek".** Nastavení `imageUrl` na prázdno v editoru se dřív na BE neprojevilo (update ho tiše ignoroval) — obrázek zůstal viset i po „smazání". Teď `imageUrl: null` v těle requestu obrázek reálně smaže a uklidí storage (event `media.orphaned`), stejně jako u ostatních modulů s obrázkem (game-events/world-news). Doloženo `timeline.service.ts:234–243` (v kódu nese marker **CD-RUN-1 / FIX-11b**) + úklid při smazání události `:264–267`.
  - **Nebeské stavy** se počítají read-time z aktivního configu (`calculateCelestialStates`) — lunární fáze u událostí.
  - **Konverze data** mezi kalendáři světa (`DateConversionPopup`).
- **Hranice / co neumí:**
  - Vyžaduje **alespoň 1 kalendář** — bez configu varovný box „svět nemá kalendář" a nelze přidávat (FE blok + BE `getTimelineConfig` → null).
  - `worldId` je **immutable** — událost nelze přesunout mezi světy (PUT s `worldId` → 400 `EVENT_WORLD_IMMUTABLE`); přesun = smaž+vytvoř.
  - **Žádná vazba na herní akce ani na character-kalendář** — timeline je samostatná kolekce (historie), nemíchá se se sjednoceným kalendářem.
  - Rich-text se **sanitizuje** na write i read (allowlist); `data:` base64 obrázky se v listu strhávají (`stripBase64`), v detailu se ponechávají.
- **Zvláštnosti:** Timeline má **vlastní getter** `getTimelineConfig` (priorita: `timelineCalendarSlug` → `defaultCalendarConfigSlug` → `configs[0]`), záměrně oddělený od `getConfigInternal`. Route `year-counts` musí být před `:id`.
- **Stav:** ✅
- **Kód:** FE `src/features/world/pages/TimelinePage/TimelinePage.tsx:50`, osa `TimelineAxis.tsx`, modal `components/TimelineEventModal.tsx`, API `api/useTimelineEvents.ts`. BE controller `backend/src/modules/timeline/timeline.controller.ts:30` (`@Controller('timeline')`), `:31` (class), service `timeline.service.ts:65` (class; `assertMember:274`, `assertCanWrite:311`, `create:153`, `stripBase64:59`), cursor `lib/timeline-cursor.ts`, schéma `schemas/timeline-event.schema.ts`.

---

### Počasí (generátor počasí)
- **Co to je:** Generátory atmosférických podmínek per region světa — manuální i **simulované** počasí (Markovovy přechody, gaussovská teplota, Köppenovy zóny, sezónní interpolace), + řízení **in-game data** světa (advance-day).
- **Kde:** route `/svet/:slug/pocasi` (`WorldWeatherPage`). Menu „Generátor počasí" (group „Hra", hideable). BE `worlds/:id/weather-generators`.
- **Kdo:**
  - FE — route gate `memberOnly(Hrac)` (R-18, `router.tsx:425`); v nav skryto Čtenáři. `canManage = PomocnyPJ+` (nebo global Admin), `canDelete = PJ+` (nebo Admin).
  - BE — read (list/detail/history) = **member Hrac+** (`assertMember`), všechny mutace (create/update/delete/generate/setCurrent/broadcast/advance-day/set-in-game-date/reorder/clearMapWeather) = **PomocnyPJ+** (`assertCanWrite`).
- **Co jde dělat:**
  - **Vytvořit generátor** z reálného světa (Praha, Reykjavík…), archetypu (poušť, mírné oceánské, sci-fi/fantasy sady) nebo ručně — bohatý wizard (`WeatherPresetWizard`, fuzzy search, kategorie, naposledy použité).
  - **Vygenerovat počasí** (`/generate`, volitelně monthIndex/day/seed) — simulace s variancí; **ručně nastavit** (`/current`); **historie** snapshotů (`/history`, max 200).
  - **Broadcast** aktuálního počasí do **chatu** (system message) nebo na **taktickou mapu** (persistuje `World.activeMapWeather` + WS `weather.updated`); PJ může mapové počasí **vypnout** (`map-weather/active` DELETE).
  - **In-game datum světa:** „Nastavit datum" (`set-in-game-date`), „+1 den" / „+7 dní" (`advance-day` = posun + regenerace všech generátorů). Header ukazuje aktuální in-game datum/čas (custom kalendář → měsíc z `calendarMonth`).
  - **Drag-to-reorder** generátorů (dnd-kit, optimistic `displayOrder`), **oblíbené** (FE-only localStorage per user×world, řadí nahoru), **sety** generátorů (batch-create „1 klik = X regionů").
  - WS subscribe (`useWeatherWsSubscribe`) auto-patchuje cache na broadcast eventy (živý update v jiném tabu/zařízení).
- **Hranice / co neumí:**
  - Hráč/Čtenář (Čtenář ani nedojde) má **read-only** — žádné generování/broadcast/drag/sety/datum.
  - Oblíbené jsou **čistě FE** (localStorage), nesdílí se ani nepřežijí jiné zařízení.
  - Advance-day rozsah **1–365 dní** (BE validace v service `advanceDay`, `world-weather.service.ts:868` → 400 `WEATHER_ADVANCE_DAY_INVALID`; není to DTO validátor).
  - Simulace je **deterministická per seed**, ale není to fyzikální model — Markov/gauss aproximace; klimatické epochy jen orientační.
  - In-game datum je uloženo jako **storage-only Date** (UTC), zobrazení se interpretuje dle world kalendáře — pro custom kalendář může být UX „den X (Rok = real-world)".
- **Zvláštnosti:** Simulační modul je **sdílený BE↔FE** (auto-copy přes `scripts/sync-simulation-to-fe.ts`, parity test gate v CI). Literal-path routes (`reorder`, `advance-day`, `set-in-game-date`, `map-weather/active`) musí být před `:id`.
- **Stav:** ✅
- **Kód:** FE `src/features/world/pages/WorldWeatherPage/WorldWeatherPage.tsx:92`, modaly `modals/`, wizard `modals/wizard/`, data `data/` (archetypy/realWorld/sety). BE controller `backend/src/modules/world-weather/world-weather.controller.ts:36` (`@Controller('worlds/:worldId/weather-generators')`), `:37` (class), service `world-weather.service.ts` (`generate:424`, `broadcast:1101`, `advanceDay:855`, `setInGameDate:777`, `assertCanWrite:402`), simulace `simulation/index.ts`.

---

### Herní akce (events)
- **Co to je:** Nadcházející herní akce světa + **archiv** proběhlých, s RSVP účastí, komentáři (vlákna 1 úroveň) a reakcemi, push notifikacemi.
- **Kde:** route `/svet/:slug/akce` (`EventsPage`); od **2026-06-20** v menu „Svět" (skrývatelné `id:'akce'`) i na úvodní stránce (levý sloupec „Akce" + footer „Všechny akce →"). Legacy redirect `/sprava-udalosti` **smazán 2026-06-20** (expiroval). BE `@Controller('game-events')` s `worldId` v query; smazání akce = **hard delete + `media.orphaned`** (CD-RUN-4b; dřív soft-delete bez obnovy).
- **Kdo:**
  - FE — route `memberOnly(p(EventsPage))` **bez druhého argumentu** → default `WorldRole.Ctenar` (`router.tsx:182` — `memberOnly` má `minWorldRole: WorldRole = WorldRole.Ctenar`), tj. **Čtenář+**, ne Hrac+. Tab „Archiv" a tlačítko „Nová akce" jen **PomocnyPJ+** (`viewerRole >= PomocnyPJ`); hráč při `?view=archive` → silent redirect na upcoming.
  - BE — read = **kterýkoli člen kromě Zadatele** (`canView:122` → `if (!m || m.role === WorldRole.Zadatel) return false`, list `:186` stejně), tj. **Ctenar+** — parita s FE gate. **Archiv** (date < cutoff 24 h) = jen **PomocnyPJ+** (jinak 403 `ARCHIVE_PJ_ONLY`); hráč bez `fromDate` dostane auto-clamp na cutoff (vidí jen nadcházející). Mutace eventu = **PomocnyPJ+** (`assertManage`). Komentář/RSVP/reakce = každý, kdo event vidí (`canView`, respektuje groupOnly). Editace komentáře = jen autor; mazání = autor nebo PJ-mod.
- **Co jde dělat:**
  - **Upcoming / Archiv** taby (URL `?view=`), **filtr podle skupiny** (`?group=`, klient-side dle `targetGroup` + barvy skupin z worldSettings).
  - **Vytvořit/upravit/smazat akci** (`GameEventModal`): název, datum+čas, popis, obrázek (focal/zoom/fit), cílová skupina + `groupOnly`, `confirmable` (RSVP). `groupOnly` vyžaduje `targetGroup` (jinak 400).
  - **RSVP** (`/:id/confirm` toggle), **komentáře** root + reply na root, **editace/soft-delete** komentáře, **emoji reakce** toggle na komentář.
  - **Push notifikace** při vytvoření akce (respektuje groupOnly příjemce) + **cron připomínky 24 h a 1 h předem** (15.9; `GameEventReminderJob` à 15 min, okna 23–25 h / 0.75–1.25 h, nezávislé flagy `reminderSent` + `reminder1hSent`). Vše kategorie push `worldEvent` (respektuje `notificationPreferences`).
  - Dashboard widget „blížící se akce" napříč světy uživatele (`upcoming/mine`, limit 5, max 20).
- **Hranice / co neumí:**
  - Komentáře jsou jen **2 úrovně** (root + jedna vrstva reply; reply nesmí mířit na jiný reply).
  - **Žádné kapacitní limity / čekací listina** RSVP, žádné opakující se ani vícedenní akce (jeden timestamp `date`, žádné `endDate`).
  - Archive cutoff je pevných **24 h** (`ACTIVE_WINDOW_MS`), s `ARCHIVE_SKEW_MS` 5 min tolerancí kvůli FE zaokrouhlení — žádná konfigurace.
  - Filtr skupin je **klient-side** (nestránkuje se per skupina).
  - Hard delete eventu maže přidružený obrázek (event `media.orphaned`), ale samotný event je **hard delete** (ne soft).
- **Zvláštnosti:** Archive policy = varianta A (implicit filter dle date, ne separátní endpoint). `findList` limit default 100 / max 500. `confirmedBy` lze přepsat i přes update (PJ).
- **Stav:** ✅
- **Kód:** FE `src/features/world/pages/EventsPage/EventsPage.tsx:24`, toolbar/list `components/`, modal `src/features/world/components/GameEventModal/GameEventModal.tsx`, dashboard `pages/WorldDashboardPage/.../columns/EventsColumn.tsx`. BE controller `backend/src/modules/game-events/game-events.controller.ts:34` (`@Controller('game-events')`), `:36` (class), service `game-events.service.ts` (`findList:168`, `create:290`, `notifyOnCreate:623`, `assertManage:131`, archive gate `ARCHIVE_PJ_ONLY:201`, `ARCHIVE_SKEW_MS:40`, `ACTIVE_WINDOW_MS` z `common/constants/time.constants`), cron `game-event-reminder.job.ts:36` (`@Cron('*/15 * * * *')`, okna 24 h `:49` / 1 h `:56`, `CronLockService` proti dvojímu pushi při 2+ replikách).

---

### Pavučina / kampaň
- **Co to je:** PJ nástroj „**Pavučina**" — graf **vztahů** mezi subjekty kampaně (NPC/frakce/místa), příběhové **linky** (storylines), rychlé poznámky a dashboard „Dnes" (krizové vztahy, aktivní linky, připnuté poznámky). Vrstvený (per-hráč) přehled. **11.5:** graf je i pracovní plocha — tvorba subjektů/vztahů, „materializace" subjektu na reálnou stránku a „vyvolání" (přeskok na napojenou stránku).
- **Kde:** route `/svet/:slug/pavucina` (`CampaignPage` → `CampaignView`). Menu „Pavučina" (group „Svět"). BE `@Controller('campaign')` s `worldId` v query.
- **Kdo:**
  - FE — route `memberOnly(p(CampaignPage))` **bez druhého argumentu** → default `WorldRole.Ctenar` (`router.tsx:182`), tj. **Čtenář+**, ne Hrac+. `isPJ = PJ+` → přepínač vrstev (LayerSwitcher = data jiných hráčů, read-only). Hráč/PomocnyPJ vidí vlastní + sdílená (`isShared`) data.
  - BE — `getWorldRole:71` vyžaduje **jen členství** (žádný role-floor; nečlen → 403 `NOT_A_MEMBER`, N-06 oprava) — parita s FE Ctenar gate; read/write scope pak dle role: **PJ** = celý svět, **PomocnyPJ** = vlastní + `isShared`, níže = jen vlastní (`resolveScope`). `canModify` = PJ vždy / PomocnyPJ na sdílených / jinak jen vlastník. `getPlayers` (vrstvy) = jen **PJ** (controller `< PJ` → 403). Changelog = **PomocnyPJ+**.
- **Co jde dělat:**
  - **Taby:** „◉ Dnes" (dashboard — krize/aktivní linky/připnuté poznámky/recent changes), „Subjekty" (CRUD subjektů + vztahů, detail), „Linky" (storylines), „Síť" (interaktivní graf `PavucinaGraph`, filtr dle storyline, deeplink `?storyline=`).
  - **Graf jako pracovní plocha (11.5, tab „Síť"):**
    - Tlačítko **„+ Subjekt"** v ovládacím pruhu grafu → otevře `SubjectForm` bez odskoku do tabu Subjekty (modal je zvednutý do `CampaignView`, sdílí ho graf i tab).
    - **Kontextové menu uzlu** (pravý klik na desktopu; na dotyku 2. tap na už zaměřený uzel — 1. tap = fokus/ego-síť): **Detail subjektu · Vyvolat stránku · + Vztah odsud · Upravit · Smazat**. Tvorba/úprava/mazání jen když `!readOnly` (cizí vrstva = jen Detail + Vyvolat). Menu se pozicuje s clampem do viewportu.
    - **„+ Vztah odsud"** předvyplní `RelationshipForm` daným subjektem jako A, výběr B = combobox. *(Drag-to-connect tažením není — mimo scope.)*
  - **Vyvolání („Vyvolat stránku"):** navigace na `/svet/:slug/:pageOrCharSlug` — reálnou stránku napojenou přes `linkedPageSlug` **nebo** `linkedCharacterSlug` (11.5 fix N2 — dřív klikací odkaz jen z `linkedPageSlug`). Bez napojení je akce disabled (menu i tlačítko v `SubjectDetail`).
  - **Materializace subjektu → reálná stránka (11.5 B1):** subjekt bez vazby a s materializovatelným typem (PC→Postava hráče, NPC, Lokace, Frakce, Organizace, Stát) má v detailu tlačítko **„Založit reálnou stránku"** (`useMaterializeSubject`) → `useCreatePage` (title=jméno, slug=slugify+kolizní `uniqueSlug` proti adresáři) → napojí `linkedPageSlug` (+ `linkedCharacterSlug` u person) zpět na subjekt (pak jde vyvolat). **Role-aware:** PJ/PomocnyPJ → stránka rovnou živá; řadový hráč → NPC/Lokace/Frakce/Org/Stát vznikají jako **návrh (pending)** ke schválení PJ (label „Navrhnout stránku ke schválení", toast „Návrh odeslán PJ"); **PC hráč založit nesmí** (tlačítko skryté; BE by vrátil 403). `OTHER` typ = nemateriaizovatelný. Gating vynucuje BE `resolveCreateMode`. Alternativní vstup (11.5 B1b): **checkbox „vytvořit ve světě i reálnou stránku a napojit ji"** přímo v `SubjectForm` při tvorbě subjektu — zobrazí se jen pro nenapojený materializovatelný typ, který viewer smí založit (role-aware `canMaterialize`).
  - **Subjekty:** typ (NPC/…), avatar, štítky, status (active/…), vazba na stránku (`linkedPageSlug`) i postavu (`linkedCharacterSlug`), poznámky. Našeptávač `SubjectForm` napojí i **Frakci/Organizaci/Stát** (11.5 `pageTypeToSubjectType`).
  - **Vztahy:** mezi dvěma subjekty, status (vč. `crisis` → dashboard), vazba na storyline; mazání subjektu **kaskádně maže jeho vztahy** (`deleteBySubjectId`).
  - **Storylines:** level, status (`active` → dashboard), vazba na subjekty.
  - **Vrstvy (PJ):** přepnutí na hráčovu vrstvu = read-only badge „jen pro čtení".
  - **Changelog:** auditní log změn (TTL 90 dní, max ~200 záznamů).
  - **Obchod kampaně** (shopitems/groups + nákup/storno) je technicky součástí stejného `campaign` modulu (N-22 scope: hráč vidí `isShared` položky) — UI ale žije v sekci Obchod, ne v Pavučině.
- **Hranice / co neumí:**
  - Graf je vázaný na **vybranou vrstvu** (ownerId) — křížově se nezobrazují data víc hráčů naráz.
  - **`isShared` smí nastavit jen PomocnyPJ+** (`resolveIsShared`) — hráčovo `isShared` se vždy přepíše na false.
  - Dashboard „Dnes" je odvozený, ne konfigurovatelný (fixní: crisis vztahy ≤10, active storylines, pinned open notes, 20 recent changes).
  - Nečlen světa **nemá přístup** ani přes přímé API (oprava N-06 — dřív kdokoli přihlášený mohl zakládat data cizímu světu).
  - **Materializace jen po jednom** subjektu (žádná dávka), jen materializovatelné typy (OTHER ne). **Vyvolání = navigační přeskok** na stránku, ne spawn NPC do chatu/na mapu. **Vztah z grafu jen přes menu** (žádný drag-to-connect tažením — `react-force-graph` to nemá nativně).
  - Materializace hráče = posun soukromého subjektu do (pending) **světové** stránky — vědomý krok (label „Navrhnout ke schválení").
- **Zvláštnosti:** Changelog je fire-and-forget (`logChange` `.catch()` ignoruje chybu). `getWorldRole` mapuje global Admin+ na `WorldRole.PJ`.
- **Stav:** ✅
- **Kód:** FE `src/features/world/pages/CampaignPage.tsx`, `campaign/components/CampaignView.tsx:60` (orchestrátor + sdílené modaly + `getMaterializeLabel`/`invokeSubject`), graf `PavucinaGraph.tsx:54` (context-menu `menu` stav, „+ Subjekt"), detail `SubjectDetail.tsx` („Vyvolat stránku" + materializace), materializace `campaign/useMaterializeSubject.ts` (`SUBJECT_TO_PAGE_TYPE`/`isMaterializable`), našeptávač `SubjectForm.tsx` (`pageTypeToSubjectType`), dashboard `DnesTab.tsx`, API `campaign/api.ts`. BE controller `backend/src/modules/campaign/campaign.controller.ts:41` (`@Controller('campaign')`), `:43` (class), `getPlayers:67` (PJ-only), service `campaign.service.ts` (`getWorldRole:71`, `resolveScope:95`, `canModify:122`, `getDashboard:1325`); nové Page-typy + pending gating `backend/src/modules/pages/interfaces/page.interface.ts:18` (`PAGE_TYPES`/`PLAYER_PROPOSABLE_PAGE_TYPES`), `pages.service.resolveCreateMode`.

---

### Storyboard / scénáře
- **Co to je:** PJ nástroj „**Storyboard**" — stromová struktura **scénářů/scén** (složky + scény) s editorem, provázáním na subjekty, storylines, stránky, mapové scény a bestie; sdílený `campaign` modul (scenarios).
- **Kde:** route `/svet/:slug/scenare` (`StorylinesPage` → `StoryboardView`). Menu „Storyboard" (group „Hra"; v nav jen pro `isPJ`). Spec 11.2.
- **Kdo:**
  - FE — route `WorldMembershipGuard` min **PomocnyPJ** + fallback Admin/Superadmin (hráč/Čtenář nemá přístup ani přes přímou URL). `isPJ = PJ+` → vrstvy; `isGm = PomocnyPJ+` → plná GM editace (tajná pole gmNotes/cíl/výsledek). `canShare = isGm && vlastník`.
  - BE — **stejné endpointy `campaign/scenarios`** jako Pavučina: scope `resolveScope` (PJ celý svět / PomocnyPJ vlastní+sdílené), `canModify` per entita. `POST /scenarios` má od 2026-06-27 role-floor `< PomocnyPJ → 403` (D-NEW-INV-SEC; defense-in-depth k FE PomocnyPJ guardu); ostatní campaign create gate = členství + scope.
- **Co jde dělat:**
  - **Strom scénářů** (`ScenarioTree`): vytvořit složku/scénu, **drag&drop přesun** (reparent + reorder, optimistic), **šablony** (`ScenarioTemplatesDialog`, `scenarioTemplates.ts`), mazání (děti se povýší o úroveň výš = osiření).
  - **Editor scény** (`ScenarioEditor`): název, obrázky, vazba na stránku (`linkedPageSlug`), subjekty, storylines; meta v `contentData.storyTree` (parentId/order/kind/status/mapSceneIds/pageSlugs/bestieIds).
  - **Panel provázání** (`ScenarioLinksPanel`, jen pro scény): odkazy na mapové scény, stránky, bestie + „odeslat obrázek do chatu" (`SendImageToChatDialog`).
  - **Vrstvy (PJ):** přehled scénářů jiných hráčů read-only. Poslední otevřená scéna se pamatuje per svět v `localStorage`.
  - **Sdílení** scénáře (PomocnyPJ+ vlastník) → zviditelní ho PJ/PomocnyPJ.
- **Hranice / co neumí:**
  - **Žádný samostatný BE modul** — scénáře jsou „campaign scenarios" (sdílí controller/service/scope s Pavučinou); meta stromu žije v generickém `contentData` (ne first-class sloupce).
  - Hráč/Čtenář **nevidí** Storyboard vůbec (PomocnyPJ floor na FE guardu).
  - Reorder/move je dávkový PUT přes `reorder` — při velkém stromu řeší pořadí celý sourozenecký seznam.
  - „Síť" zobrazení scénářů neexistuje — graf je jen pro vztahy (Pavučina); scénáře jsou strom.
- **Zvláštnosti:** `isShared` opět jen PomocnyPJ+ (resolveIsShared). Tajná pole (gmNotes/cíl/výsledek) edituje `isGm` (PomocnyPJ+), ne pouhý PJ.
- **Stav:** ✅
- **Kód:** FE `src/features/world/pages/StorylinesPage.tsx`, `campaign/components/StoryboardView.tsx:55`, strom `ScenarioTree.tsx`, editor `ScenarioEditor.tsx`, provázání `ScenarioLinksPanel.tsx`, meta `campaign/scenarioMeta.ts`, šablony `scenarioTemplates.ts`. BE controller `backend/src/modules/campaign/campaign.controller.ts` (sekce Scenarios `:407` GET list, `:418` GET detail, `:432` POST + role-floor `< PomocnyPJ → 403 INSUFFICIENT_WORLD_ROLE` `:446`, `:459` PUT, `:483` DELETE), service `campaign.service.ts` (`findScenarios`/`createScenario`), schéma `schemas/campaign-scenario.schema.ts`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

- **Terminologie „kalendář" je přetížená trojmo:** (1) `/kalendar` = sjednocený PJ pohled (akce+postavy), (2) `/admin/kalendare` = databáze configů (měsíce/sezóny), (3) character-subdoc calendar (události na postavě). Pro průvodce nutno jasně rozlišit — uživatel snadno zamění.
- **Dvě „Akce":** světové herní akce (`/svet/:slug/akce`, game-events) vs. platformové akce (`/ikaros/akce`, ikaros-events, kap. 06). Stejný název, jiný modul. (FE legacy redirect `/sprava-udalosti` **smazán 2026-06-20** po expiraci.)
- **`/akce` v nav liště** — přidáno do menu „Svět" (2026-06-20, skrývatelné `id:'akce'`, `memberOnly(Ctenar+)`); zároveň zůstává na úvodní stránce (spec 12.3 R2). Vyřešeno.
- **Pavučina i Storyboard sdílí jeden BE modul `campaign`** s `worldId` v **query** (ne v path) — odlišné od většiny world modulů (`worlds/:id/...`). Pro konzistenci kontraktu vhodné poznamenat. (Pozn.: legacy `LegacyCalendersController` / `/calenders` překlep **SMAZÁN 2026-06-20** — eventy jedou přes `worlds/:worldId/characters/:slug/calendar` (character-subdocs); definice přes `/worlds/:worldId/calendar-configs`.)
- **Mazání kalendářového configu** — **OPRAVENO** (2026-06-20, CD-RUN-2): `remove` nulluje dangling `worldSettings.timelineCalendarSlug` (fallback v `getTimelineConfig` ponechán jako druhá pojistka). Soft-delete timeline/akce viz cascade-delete audit.
- **Storyboard scénáře — role floor DOPLNĚN** (2026-06-27, D-NEW-INV-SEC): `POST /campaign/scenarios` má `< PomocnyPJ → 403` na controlleru (mimo CH-011 riziko interních volání), sjednoceno s FE PomocnyPJ guardem. Ostatní campaign create (subjects/storylines/quicknotes) floor záměrně nemají — member-private přes `resolveScope`.
- **In-game datum žije v modulu Počasí**, ale `/kalendar` „Dnes" se počítá z reálného gregoriánského data — tj. posun in-game času (advance-day) se v sjednoceném kalendáři **nepromítne**. Možný UX rozpor k vyjasnění.
- **Oblíbené generátory počasí jsou jen localStorage** (FE-only, per zařízení) — nepřežijí přihlášení z jiného zařízení; uvést jako limit, ne bug.
