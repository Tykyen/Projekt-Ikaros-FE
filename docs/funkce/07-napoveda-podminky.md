# 07 — Nápověda & podmínky

Krátká kapitola: vestavěná stránka Nápověda (6 tabů, statická), Podmínky užití a **legal stránky Přílohy C** (Zásady OÚ, Pravidla komunity, Kontakt) + sdílená patička. Tato kapitola popisuje PŘESNĚ dnešní obsah Nápovědy — je to baseline, který tahle inventura funkcí nahrazuje a rozšiřuje.

---

### Stránka Nápověda
- **Co to je:** Vestavěný onboarding / referenční přehled platformy v 6 tabech. **Plně statická** — veškerý text je natvrdo v React komponentách (žádný CMS, žádné načítání z BE).
- **Kde:** route `/ikaros/napoveda` (`HelpPage`). Menu: "Nápověda". Bez loaderu = **veřejná** (anon i přihlášený).
- **Kdo:** Veřejná, čtení pro všechny. Žádné role gating (vše je hardcoded text, žádné akce).
- **Struktura:** 6 tabů řízených parametrem `?sekce=` (`HELP_TABS = ['start','platforma','svet','role','ucet','faq']`, default `start`). Každý tab = jedna sekční komponenta s rozbalovacími akordeony. Lead text uvádí datum "Aktualizováno k 2026-07-09".
- **Co Nápověda dnes obsahuje (po tabech):**
  1. **Začni tady** (`StartSection`) — "Co je Projekt Ikaros"; akordeony: *První kroky* (registrace → profil/postava → vstup do světa), *Co uvidíš a co odemkne registrace* (bez přihlášení vs. po registraci), *Orientace v rozhraní* (hlavička, levý sidebar, hlavní/pravý panel, zvonek, hledání, mobil), *Slovníček pojmů* (Svět, PJ, Postava, NPC, Bestie, Token, AKJ, Motiv, Camp, Putyka, Pavučina, Taktická mapa), *Vzhled (motivy)*.
  2. **Platforma** (`PlatformSection`) — nástroje napříč světy, seskupené do akordeonů s audience štítkem: *Úvod & vesmíry* (Úvodník, Přehled vesmírů, RPG systémy, Nábory), *Komunikace* (Putyka, Voice krčma, Camp I.–III., Pošta, Notifikační centrum/zvonek, Instalace PWA, Diskuze), *Obsah komunity* (Společná tvorba, Články, Galerie — vč. prohlášení práv + AI štítku, Novinky, Akce/kalendář, Oblíbené), *Lidé & profil* (Profil, Veřejný profil, Online indikátor, Adresář uživatelů, Reset hesla), **Pravidla, soukromí & nahlašování (20.1/20.2)** (Nahlásit obsah, Pravidla komunity `/kodex`, Ochrana OÚ `/soukromi`, Kontakt `/kontakt`), *Správa platformy* (/admin, Globální emoty, Interní chat správy).
  3. **Svět** (`WorldSection`) — nástroje uvnitř světa (`/svet/…`): *Základy světa* (Přehled, Role ve světě, Wiki čtení/editor, Index a Správa stránek), *Informace & lidé* (Pravidla/Magie/Technologie, Hráči, Skupiny, Adresář postav, Detail postavy, Osobní výbava), *Mapy & vizuál* (Mapa vesmíru, Mapy/atlas), *Taktická mapa* (vlastní obsáhlá sekce: PC, NPC/bestie, deníky, hod kostkou, ping, efekty, mlha války, iniciativa, scény/orchestrace, počasí, hudba), *Příběhové nástroje PJ* (Bestiář, Pavučina, Storyboard, Deník PJ), *Svět v čase* (Počasí, Kalendář, Správa kalendářů, Časová osa, Akce/Novinky světa), *Ekonomika* (Převodník měn, Obchod), *Komunikace & zvuk* (Chat světa, Zvuky), *Nastavení & správa* (Nastavení světa, Hlavní lišta, Šablona deníku, Custom emoty, AKJ záložky).
  4. **Role & oprávnění** (`RolesSection`) — *Globální role* (karty: Ikaros, Superadmin, Admin, Správce diskuzí/článků/galerie + matice oprávnění + hierarchie adminů + tabulka "co kdo smí s kým") a *Světové role* (karty: PJ, Pomocný PJ, Korektor, Hráč, Čtenář + matice + přístup k tabům Nastavení). Pozn.: u Korektora/Čtenáře je v textu štítek "(v přípravě)". **Role Žadatel z nápovědy odstraněna (D-065, 2026-07-16)** — hráč ji nikdy nedostane (nikdo ji nepřiřazuje, `Zadatel`(0) je jen interní sentinel „žádná role"), a karta ji navíc popisovala chybně jako „požádal o přístup, není členem" = to je `WorldAccessRequest`, ne role. Nahrazeno pravdivým odstavcem pod maticí: bez schválení nemáš roli žádnou → po schválení rovnou Hráč (s postavou) nebo Čtenář.
  5. **Účet & profil** (`AccountSection`) — akordeony: Hlavička & něco o mně, Postava v Campu, Vzhled a čitelnost, Přezdívka & e-mail (změna e-mailu/přezdívky, cooldown 30 dní), Heslo & reset, Dvoufaktorové ověření (2FA, záložní kódy, důvěryhodná zařízení), Avatar, Soukromí (neviditelný mód, pošta jen pro přátele), Notifikace, Moje světy & komunitní stopa, **Moderace (moje hlášení a rozhodnutí, 20.1)**, **Stáhnout moje data (20.2)**, **Věk a režim ochrany nezletilých (20.2)**, Smazání účtu (tombstone, 30denní hold).
  6. **FAQ** (`FaqSection`) — 4 kategorie (Účet, Komunita, Svět & hra, Obecné) s rozklikávacími otázkami (`<details>`); ~30 otázek (nápověda ve světě, změna přezdívky/hesla/e-mailu, **stažení dat**, **věk/režim nezletilého**, smazání účtu, tombstone, "Zpracovat" fronta, **nahlašování obsahu + co se stane**, **označení AI obrázku**, přátelé/blokování, Pošta, zvonek, **kde jsou pravidla/soukromí/kontakt**, AKJ záložky, skrytí scény, deník na mapě, obnova světa, vzhled světa, hudba, hledání, motiv, ban adminů, mobil, hlášení chyb…).
- **Hranice / co neumí:**
  - **Vše statické** — žádná editace z UI, žádná synchronizace se skutečným stavem platformy (aktualizuje se ručně skillem `napoveda`, riziko zastarání). Datum aktualizace je hardcoded řetězec.
  - Žádné vyhledávání v nápovědě, žádné deep-linky na konkrétní akordeon (jen `?sekce=` na tab).
  - Obsahuje **placeholdery na média** (`IllustrationSlot`, `ScreenshotSlot`) — ilustrace/screenshoty se odkazují přes `media.ts`, mnoho z nich jen rezervuje místo (k ověření, kolik je reálně naplněno).
  - Některé popsané funkce mají v textu štítek "🚧 Připravujeme" / "(v přípravě)" — nápověda popisuje i cílový stav, ne jen hotové.
- **Zvláštnosti:** Tato inventura funkcí (`docs/funkce/*`) je zamýšlena jako **přesnější, kódem ověřený podklad**, který tento statický baseline nahrazuje/rozšiřuje. Existuje samostatný skill `napoveda`, který má stránku držet v souladu se stavem platformy.
- **Stav:** ✅ (funguje, ale obsah je manuálně udržovaný)
- **Kód:** FE `src/features/ikaros/pages/HelpPage/HelpPage.tsx`, taby `…/helpers.ts`, sekce `…/sections/{Start,Platform,World,Roles,Account,Faq}Section.tsx`, komponenty `…/components/` (HelpAccordion, PermissionTable, IllustrationSlot, ScreenshotSlot…), média `…/media.ts`. Router `src/app/router.tsx:159`.

---

### Podmínky užití
- **Co to je:** Statická stránka s podmínkami použití. **Pracovní verze / placeholder** (D-010).
- **Kde:** route `/podminky` (`TermsPage`). Veřejná (bez loaderu). Odkazuje se na ni registrační flow (odsouhlasení) a FAQ ("hlášení chyb e-mailem na adresu v podmínkách").
- **Kdo:** Veřejná, čtení pro všechny.
- **Co obsahuje:** 5 sekcí — 1. Účel platformy, 2. Zpracování osobních údajů (GDPR, kontakt `tykytanjunior@gmail.com`), 3. Pravidla chování, 4. Smazání účtu (30denní soft delete + anonymizace/tombstone), 5. Změny podmínek. Záhlaví má **viditelné upozornění**, že jde o pracovní verzi. Patička: "Verze podmínek: 0.1 (placeholder, 2026-05-08)".
- **Hranice / co neumí:** Čistě statický text, žádné verzování v DB, žádný consent-tracking na této stránce (souhlas se ukládá při registraci do `User.acceptedTermsAt` / `termsVersion`). Text je explicitně označen jako placeholder před produkčním nasazením.
- **Zvláštnosti:** Komentář v kódu upozorňuje, že finální text musí dodat PJ po právní konzultaci. Registrace i patička nově odkazují i na Zásady OÚ a Kontakt (viz níže).
- **Stav:** ⚠️ (funkční stránka, ale obsah = placeholder určený k nahrazení)
- **Kód:** FE `src/features/ikaros/pages/TermsPage.tsx`. Souhlas: `backend/src/modules/users/schemas/user.schema.ts:84` (`acceptedTermsAt`, `termsVersion`). Router `src/app/router.tsx:160`.

---

### Zásady ochrany osobních údajů (`/soukromi`) — 20.2
- **Co to je:** Statická stránka GDPR informací (čl. 13) — správce, účely × právní základy, kategorie údajů, zpracovatelé, předání mimo EU, retence, práva subjektu, nezletilí, kontakt/stížnost. **Informace, ne souhlas** (uživatel bere na vědomí).
- **Kde:** route `/soukromi` (`PrivacyPage`), **veřejná** (bez loginu). Odkazuje se z registrace, patičky a `/podminky`.
- **Kdo:** čtení pro všechny.
- **Hranice / co neumí:** čistě statický text; identita správce (spolek), konkrétní zpracovatelé a mechanismy DPF/SCC jsou placeholdery `[DOPLNIT: …]` (blokuje veřejné spuštění, ne provoz — dluh). Verze 1.0, právní revize plánována po beta.
- **Stav:** 🚧 (funkční stránka, obsah pracovní verze s placeholdery identity správce)
- **Kód:** FE `src/features/ikaros/pages/PrivacyPage.tsx` (+ `legalPage.module.css`). Router `src/app/router.tsx:198`.

### Pravidla komunity / kodex (`/kodex`) — 20.1
- **Co to je:** Statická stránka pravidel komunity — hodnoty + zákazy (mj. „ohrožení nezletilých — nulová tolerance"). Veřejná verze provozního kodexu.
- **Kde:** route `/kodex` (`CodeOfConductPage`), **veřejná**. Odkaz v patičce.
- **Kdo:** čtení pro všechny.
- **Hranice / co neumí:** statický text; propojení na nahlašování (20.1) je popisné, tlačítko „Nahlásit" je u obsahu, ne zde.
- **Stav:** ✅ (statická stránka funguje; obsah pracovní verze)
- **Kód:** FE `src/features/ikaros/pages/CodeOfConductPage.tsx`. Router `src/app/router.tsx:199`.

### Kontakt (`/kontakt`) — 20.1
- **Co to je:** Kontaktní místo dle DSA (čl. 11 orgány / čl. 12 uživatelé) — co uvést při nahlášení / žádosti.
- **Kde:** route `/kontakt` (`ContactPage`), **veřejná**. Odkaz v patičce a ze Zásad OÚ.
- **Kdo:** čtení pro všechny.
- **Hranice / co neumí:** kontaktní e-mail správce = placeholder `[DOPLNIT]` (SMTP propojený, konkrétní adresa čeká na identitu spolku). In-app nahlašování je primární cesta (viz kap. 08).
- **Stav:** ✅ (statická stránka; e-mail placeholder)
- **Kód:** FE `src/features/ikaros/pages/ContactPage.tsx`. Router `src/app/router.tsx:200`.

### Sdílená patička (SiteFooter) — 20A
- **Co to je:** Legal patička s odkazy Podmínky / Ochrana údajů / Pravidla komunity / Kontakt / Nápověda + `© rok Projekt Ikaros`.
- **Kde:** renderuje se uvnitř `<main>` za `<Outlet/>` v `IkarosLayout`, gate `showRightPanel` (`!isChat && !isAdmin`) → v chat/admin focus módu se skryje. Rok z runtime `new Date().getFullYear()`.
- **Kdo:** viditelná všem na content stránkách.
- **Stav:** ✅
- **Kód:** FE `src/shared/ui/SiteFooter/SiteFooter.tsx` (+ css), mount v `src/app/layout/IkarosLayout/IkarosLayout.tsx`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)
- 🚧 ŘEŠENO 2026-06-18 (vydána **verze 1.0**, BE `TERMS_VERSION` sjednocen na `'1.0'`; finální právní revize advokátem plánována po beta) — **Podmínky jsou stále placeholder (verze 0.1).** Text výslovně varuje, že není finální a chybí právní konzultace. Před veřejným nasazením nutné nahradit. `termsVersion` v patičce ("0.1") nemusí odpovídat server-side konstantě ukládané při registraci — k ověření shody.
- **Nápověda je manuálně udržovaná a může se rozcházet se skutečným stavem.** Datum "Aktualizováno k 2026-06-18" je hardcoded; obsah popisuje i funkce "v přípravě" (Korektor, Čtenář). Tato inventura by měla sloužit jako zdroj pravdy pro budoucí přepis. **Doloženo 2026-07-16:** karta „Žadatel" tu přežila i to, že roli nikdo nepřiřazoval, a popisovala ji věcně špatně — drift nápovědy není hypotetický.
- **Štítky "v přípravě" / "🚧 Připravujeme"** v nápovědě nejsou nikde provázané se skutečným stavem implementace — jde o ruční poznámky. Pro průvodce nutno ověřit, co reálně funguje (viz ostatní kapitoly inventury).
- **Media sloty** (`IllustrationSlot`/`ScreenshotSlot`) — k ověření, kolik ilustrací/screenshotů je reálně dodáno vs. jen rezervované místo.
- ✅ OPRAVENO 2026-06-18 (FAQ srovnán s realitou) — **Nápověda popisuje úvodní stránku jinak, než ji renderuje kód** (FAQ "rozcestník: Moje světy + akce napříč světy + novinky" vs. skutečný dashboard = uvítání + globální akce + novinky). Viz též nesrovnalost v kapitole 03.
