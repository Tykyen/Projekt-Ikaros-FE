# 07 — Nápověda & podmínky

Krátká kapitola: vestavěná stránka Nápověda (6 tabů, statická) a Podmínky užití (placeholder). Tato kapitola popisuje PŘESNĚ dnešní obsah Nápovědy — je to baseline, který tahle inventura funkcí nahrazuje a rozšiřuje.

---

### Stránka Nápověda
- **Co to je:** Vestavěný onboarding / referenční přehled platformy v 6 tabech. **Plně statická** — veškerý text je natvrdo v React komponentách (žádný CMS, žádné načítání z BE).
- **Kde:** route `/ikaros/napoveda` (`HelpPage`). Menu: "Nápověda". Bez loaderu = **veřejná** (anon i přihlášený).
- **Kdo:** Veřejná, čtení pro všechny. Žádné role gating (vše je hardcoded text, žádné akce).
- **Struktura:** 6 tabů řízených parametrem `?sekce=` (`HELP_TABS = ['start','platforma','svet','role','ucet','faq']`, default `start`). Každý tab = jedna sekční komponenta s rozbalovacími akordeony. Lead text uvádí datum "Aktualizováno k 2026-06-18".
- **Co Nápověda dnes obsahuje (po tabech):**
  1. **Začni tady** (`StartSection`) — "Co je Projekt Ikaros"; akordeony: *První kroky* (registrace → profil/postava → vstup do světa), *Co uvidíš a co odemkne registrace* (bez přihlášení vs. po registraci), *Orientace v rozhraní* (hlavička, levý sidebar, hlavní/pravý panel, zvonek, hledání, mobil), *Slovníček pojmů* (Svět, PJ, Postava, NPC, Bestie, Token, AKJ, Motiv, Camp, Hospoda, Pavučina, Taktická mapa), *Vzhled (motivy)*.
  2. **Platforma** (`PlatformSection`) — nástroje napříč světy, seskupené do akordeonů s audience štítkem: *Úvod & vesmíry* (Úvodník, Přehled vesmírů), *Komunikace* (Hospoda, Camp I.–III., Pošta, Notifikační centrum/zvonek, Diskuze), *Obsah komunity* (Články, Galerie, Novinky, Akce/kalendář, Oblíbené), *Lidé & profil* (Profil, Veřejný profil, Online indikátor, Adresář uživatelů, Reset hesla), *Správa platformy* (/admin, Globální emoty).
  3. **Svět** (`WorldSection`) — nástroje uvnitř světa (`/svet/…`): *Základy světa* (Přehled, Role ve světě, Wiki čtení/editor, Index a Správa stránek), *Informace & lidé* (Pravidla/Magie/Technologie, Hráči, Skupiny, Adresář postav, Detail postavy, Osobní výbava), *Mapy & vizuál* (Mapa vesmíru, Mapy/atlas), *Taktická mapa* (vlastní obsáhlá sekce: PC, NPC/bestie, deníky, hod kostkou, ping, efekty, mlha války, iniciativa, scény/orchestrace, počasí, hudba), *Příběhové nástroje PJ* (Bestiář, Pavučina, Storyboard, Deník PJ), *Svět v čase* (Počasí, Kalendář, Správa kalendářů, Časová osa, Akce/Novinky světa), *Ekonomika* (Převodník měn, Obchod), *Komunikace & zvuk* (Chat světa, Zvuky), *Nastavení & správa* (Nastavení světa, Hlavní lišta, Šablona deníku, Custom emoty, AKJ záložky).
  4. **Role & oprávnění** (`RolesSection`) — *Globální role* (karty: Ikaros, Superadmin, Admin, Správce diskuzí/článků/galerie + matice oprávnění + hierarchie adminů + tabulka "co kdo smí s kým") a *Světové role* (karty: PJ, Pomocný PJ, Korektor, Hráč, Čtenář, Žadatel + matice + přístup k tabům Nastavení). Pozn.: u Korektora/Čtenáře/Žadatele je v textu štítek "(v přípravě)".
  5. **Účet & profil** (`AccountSection`) — akordeony: Hlavička & něco o mně, Postava v Campu, Přezdívka & e-mail (změna e-mailu/přezdívky, cooldown 30 dní), Heslo & reset, Dvoufaktorové ověření (2FA, záložní kódy, důvěryhodná zařízení), Avatar, Soukromí (neviditelný mód, pošta jen pro přátele), Moje světy & komunitní stopa, Smazání účtu (tombstone, 30denní hold).
  6. **FAQ** (`FaqSection`) — 4 kategorie (Účet, Komunita, Svět & hra, Obecné) s rozklikávacími otázkami (`<details>`); ~26 otázek (nápověda ve světě, změna přezdívky/hesla/e-mailu, smazání účtu, tombstone, "Zpracovat" fronta, přátelé/blokování, Pošta, zvonek, AKJ záložky, skrytí scény, deník na mapě, obnova světa, vzhled světa, hudba, hledání, motiv, ban adminů, mobil, hlášení chyb…).
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
- **Zvláštnosti:** Komentář v kódu upozorňuje, že finální text musí dodat PJ po právní konzultaci.
- **Stav:** ⚠️ (funkční stránka, ale obsah = placeholder určený k nahrazení)
- **Kód:** FE `src/features/ikaros/pages/TermsPage.tsx`. Souhlas: `backend/src/modules/users/schemas/user.schema.ts:84` (`acceptedTermsAt`, `termsVersion`). Router `src/app/router.tsx:160`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)
- 🚧 ŘEŠENO 2026-06-18 (vydána **verze 1.0**, BE `TERMS_VERSION` sjednocen na `'1.0'`; finální právní revize advokátem plánována po beta) — **Podmínky jsou stále placeholder (verze 0.1).** Text výslovně varuje, že není finální a chybí právní konzultace. Před veřejným nasazením nutné nahradit. `termsVersion` v patičce ("0.1") nemusí odpovídat server-side konstantě ukládané při registraci — k ověření shody.
- **Nápověda je manuálně udržovaná a může se rozcházet se skutečným stavem.** Datum "Aktualizováno k 2026-06-18" je hardcoded; obsah popisuje i funkce "v přípravě" (Korektor, Čtenář, Žadatel). Tato inventura by měla sloužit jako zdroj pravdy pro budoucí přepis.
- **Štítky "v přípravě" / "🚧 Připravujeme"** v nápovědě nejsou nikde provázané se skutečným stavem implementace — jde o ruční poznámky. Pro průvodce nutno ověřit, co reálně funguje (viz ostatní kapitoly inventury).
- **Media sloty** (`IllustrationSlot`/`ScreenshotSlot`) — k ověření, kolik ilustrací/screenshotů je reálně dodáno vs. jen rezervované místo.
- ✅ OPRAVENO 2026-06-18 (FAQ srovnán s realitou) — **Nápověda popisuje úvodní stránku jinak, než ji renderuje kód** (FAQ "rozcestník: Moje světy + akce napříč světy + novinky" vs. skutečný dashboard = uvítání + globální akce + novinky). Viz též nesrovnalost v kapitole 03.
