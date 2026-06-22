# 03 — Úvodník & objevování světů

Kapitola pokrývá vstupní bránu platformy: úvodní stránku, přehled světů ("vesmírů") a wizard tvorby světa. Vše ověřeno v kódu FE i BE.

---

### Úvodní strana platformy (Dashboard)
- **Co to je:** Vstupní rozcestník platformy. Pro **anonima** funguje jako akviziční landing (15.7), pro **přihlášeného** jako uvítání + globální akce/novinky.
- **Kde:** route `/` (index), v IkarosLayout. Menu: logo / Úvodník.
- **Kdo:** Veřejná (anon i přihlášený). Žádný `requireAuth` loader.
- **Co jde dělat / co se zobrazí:**
  - `WelcomeSection` — uvítací karta ("Vítej v Projektu Ikaros…", podpis "administrátor"). Zobrazuje se **vždy** (anon i přihlášený). **Pro anonima navíc dvě CTA tlačítka** (`{!isAuthenticated && …}`): „Vytvořit svět zdarma" (otevře registrační modal přes `registerModalOpenAtom`) + „Prozkoumat světy" (naviguje na `/ikaros/vesmiry`). Přihlášený CTA nevidí.
  - `ShowcaseSection` — **jen pro anonima** (`{!isAuthenticated && <ShowcaseSection />}`), nad uvítací kartou. Rotující banner ukázek aplikace, **5 snímků** (`showcaseSlides.ts`: taktická mapa, chat, svět, postava, deník), crossfade á **5 s**, tečky + boční šipky, pauza při hoveru, `prefers-reduced-motion` vypne autorotaci (ruční ovládání zůstane). Data-driven — přidání snímku = řádek v `showcaseSlides.ts`. **Vlastní rám** (border + 4× `CornerOrnament`), **NEpoužívá** `data-frame-panel` (jinak by každý skin kreslil vlastní dekoraci — viz [CH-018]).
  - `IkarosEventsSection` — **jen pro přihlášené** (`{isAuthenticated && …}`). Nadcházející globální akce, max **3** (`useUpcomingIkarosEvents(3)`), odkaz "Kalendář akcí →" na `/ikaros/akce`. Admin/Superadmin má v hlavičce tlačítko `+` (otevře `IkarosEventModal`).
  - `PlatformNewsSection` — platformové novinky, prvních **3** (`data.slice(0,3)`), odkaz "Všechny novinky →" na `/ikaros/novinky`. Zobrazuje se i anonymovi. Admin/Superadmin má `+` (NewsFormModal).
  - **Pravý panel pro anonima** (`AnonStartPanel` v IkarosLayout) — dřív anon pravý panel **neměl** (`showRightPanel` byl `isAuthenticated && …`, nově `!isChat && !isAdmin`). Obsah = timeline „Začni tady" 3 kroky: ① „Zaregistruj se" (klikací → registrační modal), ② „Vytvoř svůj svět", ③ „Pozvi přátele". Přihlášený zde vidí dál Administrace / Moje světy / Oblíbené (beze změny).
  - **Levý panel skrývá anonimovi slepé odkazy** (`anonHidden` filtr): „Vytvořit svět", „Diskuze", „Rozcestí I.–III." (vedou jen na login) se anonimovi nezobrazí; CTA na tvorbu světa je místo toho v hero kartě. **Hospoda zůstává** viditelná (budoucí anon-chat 15.x; zatím klik → login).
  - Query parametry `?openLogin=1` / `?openRegister=1` / `?openForgotPassword=1` automaticky otevřou příslušný modal (jen pokud uživatel není přihlášený), pak se z URL odstraní. Sem redirectuje `requireAuth` při chybějícím tokenu.
- **Hranice / co neumí:** **Anon landing personalizace = 15.7 hotová** (showcase + CTA + Začni tady + skrytí slepých odkazů). **Pro přihlášeného personalizace na "/" stále chybí** — vidí generickou uvítací kartu + globální Akce/Novinky; „Moje světy" a „nejbližší akce napříč světy" jsou v pravém panelu a profilu, ne na dashboardu (15.7 řešilo záměrně jen anon pohled, přihlášený se nezměnil). Showcase obrázky jsou statické `.webp` v `public/images/showcase/` (dodává je člověk, výměna = nahradit soubor + řádek ve `showcaseSlides.ts`).
- **Zvláštnosti:** "Akce" a "Novinky" zde = **globální platformové** (Ikaros), ne světové. Akce na dashboardu jsou jen pro přihlášené, protože celé `ikaros-events` API je za `JwtAuthGuard`. Anon úvodní stránka je **čistě FE** (žádný BE endpoint navíc; veřejná data servíruje existující OptionalJwt API). Nový `data-anon` atribut na shellu umožňuje skinům theme-gating dekorací pro anonima (arabská lampa génia se anonimovi skryje, ať nekoliduje se showcase).
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/DashboardPage/DashboardPage.tsx:15`, sekce `…/sections/WelcomeSection.tsx`, `…/sections/ShowcaseSection.tsx`, data `…/sections/showcaseSlides.ts`, `…/sections/IkarosEventsSection.tsx:14`, `…/sections/PlatformNewsSection.tsx:14`. Layout `src/app/layout/IkarosLayout/IkarosLayout.tsx` (`AnonStartPanel`, `PRIMARY_NAV`/`CHAT_ROOMS` `anonHidden` filtr, `showRightPanel`, `data-anon`). Router `src/app/router.tsx:147`. Theme-gating `src/themes/themes/arabsky-svet/decorations.css` (`[data-anon]`).

---

### Seznam vesmírů / objevování světů
- **Co to je:** Mřížka aktivních světů s hledáním, filtrem a řazením. Vstupní bod pro objevování a vstup do hry.
- **Kde:** route `/ikaros/vesmiry` (`WorldsPage`). Menu: "Přehled vesmírů" / "Vesmíry". Nadpis "Vesmíry".
- **Kdo:** Veřejná (anon i přihlášený), bez loaderu. Viditelnost obsahu řeší BE.
- **Co jde dělat:**
  - **Hledání** podle názvu (klientský filter `name.toLowerCase().includes`), parametr `?q=`.
  - **Filtr přístupu** (chips): `Vše` / `Veřejné` (accessMode `public` nebo `open`) / `Mé světy` (jen přihlášený, podle membership). Parametr `?filter=`.
  - **Řazení** (select): `Nejnovější` (createdAt desc, default), `Abecedně` (cs locale), `Volná místa` (`maxPlayers - playerCount`, světy bez limitu jdou na konec). Parametr `?sort=`.
  - Klik na kartu (`WorldCard`) → `/svet/<slug>` (detail/dashboard světa). CTA na kartě je "Vstoupit do světa →" pro člena, jinak "Detail světa →".
  - Karta zobrazuje: hero obrázek nebo glóbus, název, žánr, počet hráčů (`X / Y hráčů` pokud je `maxPlayers`), a u člena chip jeho světové role.
- **Jak se svět objevuje (BE):**
  - FE volá `GET /worlds` (`usePublicWorlds`, i pro anon) + `GET /worlds/my` (`useMyWorlds`, jen s tokenem) a oba seznamy slévá do mapy podle id.
  - `GET /worlds` má `OptionalJwtAuthGuard`, ale service `findAll()` jen deleguje na repo `findAll()`, které **vždy filtruje `{ isActive: true, accessMode: { $in: ['public','open'] } }`** a řadí `createdAt: -1`. Tj. `private` a `closed` se v seznamu nikdy neobjeví (leak-safe), bez ohledu na to, kdo je přihlášený.
  - Vlastní `private`/`closed` světy (kde je uživatel členem) přicházejí přes `GET /worlds/my` (`findMyWorlds` = projde membershipy uživatele → načte světy podle id, bez accessMode filtru).
- **Viditelnost režimů (accessMode):**
  - `public` — vidí každý, lze rovnou vstoupit (`POST /worlds/:id/join` → membership Čtenář).
  - `open` — vidí každý (je v `findAll`), vstup přes žádost (`POST /worlds/:id/access-request`, PJ schvaluje).
  - `private` — v seznamu se NEzobrazí; detail `GET /worlds/:id|slug` vrací **404** anonymovi a non-memberovi (autor pending žádosti, člen a Admin/Superadmin ho vidí). Vzor "GitHub private repos".
  - `closed` — v seznamu se NEzobrazí (filter bere jen public/open), ale detail je dosažitelný přímým linkem; nelze do něj vstoupit.
- **Hranice / co neumí:** Filtr/řazení/hledání jsou **plně klientské** (žádné stránkování / server-side search — celý seznam public/open světů přijde najednou). "Volná místa" sort u světů bez `maxPlayers` používá `-1` (řadí je dozadu). Žádné kategorie/tagy žánrů ve filtru (jen text-search nad názvem). Detail světa a vstupní flow patří do jiné kapitoly (svět).
- **Zvláštnosti:** Termín "vesmír" v UI = svět (World). Samostatný BE modul `universe` je **3D mapa lokací uvnitř světa** (`GET /universe?worldId=`), NE platformové objevování světů — nesouvisí s tímto seznamem.
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/WorldsPage/WorldsPage.tsx:60`, toolbar `…/components/WorldsToolbar.tsx`, karta `…/DashboardPage/components/WorldCard.tsx`, API `src/features/world/api/useWorlds.ts`. BE controller `backend/src/modules/worlds/worlds.controller.ts:52`, service `worlds.service.ts:149` (`findAll`), `:252` (`findMyWorlds`), `:199` (`applyDetailScope` private→404), repo `worlds.repository.ts:108` (filter public/open).

---

### Vytvoření světa (wizard)
- **Co to je:** Jednostránkový formulář (ne klasický krokový wizard — všechny sekce naráz v mřížce) pro založení nového světa.
- **Kde:** route `/ikaros/vytvorit-svet` (`CreateWorldPage`). Menu: "Vytvořit svět". Loader `requireAuth`.
- **Kdo:** FE — jen přihlášený (loader). BE — `POST /worlds` za `JwtAuthGuard`; zakladatel se stane **PJ** světa (membership s rolí PJ, akj 0). Kvóta: ne-Admin max **30** aktivních světů (`MAX_ACTIVE_WORLDS_PER_OWNER`), Admin/Superadmin bez limitu (`WORLD_QUOTA_REACHED` = 403).
- **Co jde dělat — sekce formuláře:**
  1. **Základní info** (`BasicInfoSection`) — Název (2–60 zn.), Adresa/slug (auto z názvu, lze přepsat; kebab-case `a-z0-9-`; live check dostupnosti `GET /worlds/slug-available`), Popis (max 1000 zn.).
  2. **Žánr** (`GenreSection`) — výběr z 11 žánrů + "Vlastní" (text). Žánry: Fantasy, Dark Fantasy, Sci-Fi, Cyberpunk, Steampunk, Post-apokalypsa, Horor, Mystery, Historický, Současnost, Western. Žánr **odvozuje výchozí motiv** světa (mapa `genre → theme`); "Vlastní" → fallback motiv.
  3. **Hráči** (`PlayersSection`) — "Koho hledáte" (volný text `playersWanted`, max 500) a "Kapacita" (`maxPlayers` 1–999, nepovinné, jen pro sort "volná místa").
  4. **Přístupový režim** (`AccessModeSection`) — Soukromý (default) / Otevřený / Veřejný. (Hodnota `closed` existuje v BE DTO, ale ve wizardu nabízena není.)
  5. **Systém** (`SystemSection`) — RPG systém + kostky. 13 voleb: Ikaros pravidla (`matrix`, default), D&D 5e, Jeskyně a Draci, Dračí Doupě 1.6 / Plus / II, Dračí Hlídka, Příběhy Impéria, Shadowrun, GURPS, Fate, Call of Cthulhu, Vlastní Systém (text). Změna systému přednastaví sadu kostek (smart-replace, ruční úpravy nepřepíše).
  6. **Technologie** (`TechnologySection`) — rozsah TÚ "od–do" (0–14, default 4–4 = středověk). Seeduje stránku "Technologie".
  7. **Magie** (`MagicSection`) — multi-select 13 tradic (Vílí, Božská, Šamanská, Runová, Akademická, Krevní, Démonická, Nekromantická, Psionická, Přírodní, Kosmická, Snová, Alchymická). Seeduje stránku "Magický systém".
  8. **Motiv** (`ThemeSection`) — výchozí dle žánru, lze ručně přepsat (`themeOverride`).
  9. **Kalendáře** (`CalendarsSection`) — výběr z presetů (default jen Gregorián zaškrtnutý + jako ⭐ výchozí). První zaškrtnutý se stane defaultem; lze přepnout hvězdu.
- **Co se seeduje při založení (BE):**
  - Membership zakladatele s rolí **PJ**.
  - `dice` — pokud prázdné, doplní se sada dle systému (`defaultDiceForSystem`).
  - Měny (`currenciesService.seedForWorld(genre)`) a počasí (`weatherService.seedDefaultForWorld(genre)`).
  - Kalendáře: pokud DTO pošle `calendars`, seeduje každý preset; `[]` = svět bez kalendáře; chybějící pole = BC auto-seed Gregorián. Default slug = explicit > první > `gregorian`.
  - Diary schema: z presetu systému → `world_settings.diarySchema` + verze 1 do `diary_schema_versions`.
  - **Stránky (přes event `world.created`, listener `pages-world-seed`):** seeduje `pravidla`, `magicky-system`, `technologie`, `faq`, `videa`. Obsah: Pravidla = tahák dle systému, Technologie = univerzální škála + zvolený rozsah TÚ, Magický systém = škála + zvolené tradice. Pro systém `matrix` se Pravidla/Magie/Technologie nahradí kompletní "Pravidlovou knihou" (kapitoly 1–9).
- **Validace odeslání:** Název OK + slug OK (≥2, ne "taken"/"invalid") + žánr OK + systém OK + slug není "checking". Tlačítko jinak zakázané s nápovědou "Vyplň: …". Chyby: `WORLD_SLUG_TAKEN`/`CONFLICT` → "Adresa už existuje", `WORLD_QUOTA_REACHED` → hláška o limitu 30.
- **Hranice / co neumí:**
  - **Tóny vyprávění** (`tones`) — UI sekce vyřazena (2026-05-14), pole zůstává v BE schématu/DTO, ale z formuláře se neposílá.
  - **TÚ rozsah a tradice magie se volí JEN při tvorbě** — později v Nastavení už ne (zmiňuje to i nápověda). Mění se jen přepisem obsahu seedovaných stránek.
  - `techLevelMin/Max`, `magicTraditions`, `themeId`, `tones` se v `WorldsService.create()` jen rozprostřou (`...worldDtoFields`) do `worldsRepo.save` — žádná zvláštní validace na úrovni service; konzumuje je až seed listener.
  - Wizard je jedna stránka (žádné kroky/navigace mezi kroky, žádný "zpět/další").
  - Žádný náhled výsledného světa před vytvořením.
- **Zvláštnosti:** Po úspěchu redirect na `/svet/<slug>`. Slug se generuje z názvu (`useWorldSlug`), ale jde ručně přepsat. `accessMode` default `private` na FE i BE.
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/CreateWorldPage/CreateWorldPage.tsx:30`, konstanty `…/constants/genres.ts`, `…/constants/systems.ts`, `…/constants/technologyLevels.ts`, `…/constants/magicTraditions.ts`, sekce `…/components/*Section.tsx`. BE `worlds.controller.ts:125` (`create`), `worlds.service.ts:280` (`create` + seed), DTO `worlds/dto/create-world.dto.ts`, seed listener `backend/src/modules/pages/pages-world-seed.listener.ts:71`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)
- **Anon vs přihlášený dashboard — asymetrie po 15.7.** Anonim má od 15.7 plnou landing personalizaci (showcase + CTA + „Začni tady" panel + skrytí slepých odkazů). **Přihlášený dashboard se vědomě nezměnil** — vidí stejnou generickou uvítací kartu + globální Akce/Novinky, žádné „Moje světy" / „nejbližší akce napříč světy" přímo na "/". Personalizace přihlášeného dashboardu je otevřená (původní záměr 15.7 v roadmapě, zúžený dohodou na anon).
- ✅ OPRAVENO 2026-06-18 (přejmenováno na `WelcomeSection`) — komponenta uvítací karty se jmenuje `WelcomeSection` (ne `AnonWelcomeSection`), zobrazuje se všem; od 15.7 přidává anonimovi CTA tlačítka.
- ✅ OPRAVENO 2026-06-18 (FAQ srovnán s realitou) — **Dashboard ≠ popis v nápovědě/FAQ.** FAQ tvrdí, že úvodní stránka po přihlášení je "rozcestník — Moje světy, nejbližší Akce napříč světy a platformové Novinky". Skutečný `DashboardPage` renderuje pro přihlášeného jen uvítací kartu + globální Akce (max 3) + Novinky (max 3). "Moje světy" a "Moje akce napříč světy" jsou v pravém panelu / profilu, NE na dashboardu. K ověření, zda jde o záměr.
- **`tones` (tóny vyprávění)** — mrtvé pole: existuje v BE schématu i `CreateWorldDto`, ale FE sekce je vyřazená a nikdy se neposílá. Buď dořešit UI, nebo odstranit z DTO/schématu.
- **TÚ rozsah a tradice magie jsou nastavitelné jen při tvorbě.** Po založení se mění výhradně přepisem textu seedovaných stránek (`technologie`, `magicky-system`). Pole `techLevelMin/Max` a `magicTraditions` na světě dál existují, ale žádné UI je needituje. Potenciální past pro uživatele, který chce změnit "vyspělost světa".
- **`closed` accessMode není ve wizardu**, ale je v BE DTO i v repo logice (filtruje se ze seznamu, vstup zakázán). Vzniká jen jinde (změna nastavení?) — k ověření, kde se nastavuje a zda je to záměr.
- **Filtr/řazení/hledání světů je čistě klientské** — bez stránkování. Při velkém počtu public/open světů se přenese a vykreslí vše najednou (možný výkonový strop do budoucna).
- **Kvótní limit 30** je hardcoded konstanta (`MAX_ACTIVE_WORLDS_PER_OWNER`); FE hláška ho duplikuje natvrdo ("limitu 30 aktivních světů"). Při změně limitu nutno upravit obě místa.
