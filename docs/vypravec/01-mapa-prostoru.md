# 01 — Mapa prostoru platformy

Stav: podklad · 2026-07-20 · Vazby: roadmap3 fáze 25.2 (obsah), 26.1–26.5 (cesty/tutoriály), 28.2 (vyhodnocení bety) · Sousedé: [04-architektura.md](04-architektura.md) (registr, engine, kotvy) · Zdroj pravdy funkcí: `docs/funkce/`

Kurátorovaná mapa prostoru platformy = **zadání obsahové výroby Vypravěče**: z ní vznikají `RouteHeader` (§2), topiky a chybové topiky (§4), kotvy a empty-states. 18 oblastí v jednotné struktuře (routy · role · zákysy · hooks). Tiery obsahu dle SYNTEZA §7.4: **Tier 0 = MVP (25 rout, ~20 hlubokých topiků, ~15 chybových, 3–5 empty-states)**, Tier 1 = v2 (tenké topiky všech rout + návody 26.5), Tier 2 = v3 (per-system, admin, katalogy detailně).

---

## 1. Souhrnná tabulka rout + tier

Kanonický výčet z router.tsx (3 kořeny: IkarosLayout `/`, WorldLayout `/svet/:worldSlug`, pop-out `/svet/:worldSlug/karta-tokenu`). Zápis `:slug` v tabulkách níže = zkratka pro `:worldSlug` (kanonický parametr z router.tsx; v kódových blocích a RoutePattern vždy `:worldSlug`). **Tier 0 = routa dostane RouteHeader + kontextové karty v MVP.** O přístupu vždy rozhoduje BE; FE guardy jsou jen UX.

### Platforma (IkarosLayout)

| Routa | Min. přístup | Oblast | Tier |
|---|---|---|---|
| `/` (úvodník; `?openLogin=1`/`?openRegister=1` otevírá auth modaly) | veřejná | 03 | **0** |
| `/ikaros/vesmiry` | veřejná | 03 | **0** |
| `/ikaros/vytvorit-svet` | přihlášený | 03 | **0** |
| `/ikaros/nabory` · `/nova` | přihlášený | 03 | **0** |
| `/ikaros/napoveda` (`?sekce=start\|platforma\|svet\|role\|ucet\|faq`) | veřejná | 07 | **0** |
| `/ikaros/profil` | přihlášený | 02 | **0** |
| `/ikaros/uzivatele` (`?tab=pratele\|zpracovat`) | přihlášený | 02 | **0** |
| `/ikaros/uzivatel/:id` | přihlášený (profileVisibility='friends' → 403) | 02 | 1 |
| `/ikaros/posta` (`?komu=:id`) | přihlášený | 05 | **0** |
| `/ikaros/tvorba` (hub Společné tvorby) | veřejná | 10 | **0** |
| `/chat` (Putyka) | veřejná (host přes captcha) | 05 | **0** |
| `/chat/camp` · `/camp2` · `/camp3` (staré `/chat/rozcesti*` = redirect) | přihlášený | 05 | **0** |
| `/chat/voice` | přihlášený (anonHidden) | 05 | 1 |
| `/invite/:token` | přihlášený | 09 | **0** |
| `/ikaros/akce` | přihlášený | 06 | 1 |
| `/ikaros/oblibene` (`?typ=diskuze\|clanky\|obrazky`) | přihlášený | 06 | 1 |
| `/ikaros/novinky` | veřejná | 10 | 1 |
| `/ikaros/clanky` · `/:id` (čtení) / `/novy` · `/:id/upravit` (tvorba) | veřejná / přihlášený | 10 | 1 |
| `/ikaros/galerie` · `/:id` / `/nahrat` · `/:id/upravit` | veřejná / přihlášený | 10 | 1 |
| `/ikaros/diskuze` · `/nova` · `/:id` | přihlášený | 10 | 1 |
| `/ikaros/bestiar` · `/:id` (komunitní) | přihlášený | 12 | 1 |
| `/ikaros/herbar` · `/:id` | přihlášený | 12 | 1 |
| `/ikaros/kouzla` · `/lektvary` · `/predmety` · `/hadanky` · `/ceniky` (+`/:id`) | přihlášený | 10 | 2 |
| `/ikaros/generatory` · `/sady/:id` | přihlášený | 10 | 2 |
| `/ikaros/sceny` · `/:id` (katalog TM scén) | přihlášený | 14 | 2 |
| `/ikaros/podzemi` · `/:dungeonId` (osobní knihovna Stavitele) | přihlášený | 14 | 2 |
| `/ikaros/podporovatele` | veřejná | — | 2 |
| `/ikaros/systemy` · `/:slug` | flag `SYSTEM_LANDINGS_PUBLIC=false` → redirect `/` | 03 | 2 |
| `/podminky` · `/soukromi` · `/kodex` · `/kontakt` | veřejná | 07 | 2 |
| `/reset-password` · `/email-verify` · `/email-change/confirm` (`?token=`, TTL 1 h) | veřejná (token) | 01 | 1 |
| `/admin` (`?tab=prehled\|uzivatele\|smazane-svety\|audit\|search-index`) | Admin/Superadmin | 08 | 2 |
| `/admin/chat` · `/ikaros/admin/emotes` | Admin/Superadmin | 08 | 2 |
| `*` | 404 | — | chybový topik |

### Svět (WorldLayout, `/svet/:worldSlug/…`)

Guardy: **shell/index veřejný** (private → WorldNotFound) · **memberOnly** = Čtenář+ (nečlen tichý redirect na index; Superadmin/Admin bypass JEN s aktivní elevací `world.elevated` — de-elevovaný admin = nečlen, parita 07 §5.3) · **showcaseOrMember** = nečlen/anonym read-only jen při `world.publicShowcase` · vyšší floor dle položky. Nav (`buildFullWorldNav`) skrývá položky v paritě s guardy.

| Routa | Min. přístup | Oblast | Tier |
|---|---|---|---|
| `/svet/:slug` (index: hero+JoinCTA / pending banner / dashboard) | veřejný shell | 09 | **0** |
| `/svet/:slug/hraci` | člen | 09 | **0** |
| `/svet/:slug/skupina/:groupKey` | člen | 09 | 2 |
| `/svet/:slug/nastaveni` (19 hash tabů dle role) | člen (Čtenář+ vidí 2 taby) | 10 | **0** |
| `/svet/:slug/admin/headline` (menu builder) | PJ | 10 | 1 |
| `/svet/:slug/stranky` | showcaseOrMember | 11 | **0** |
| `/svet/:slug/nova-stranka` | člen (naostro PomocnyPJ+; Hráč = „+ Navrhnout") | 11 | **0** |
| `/svet/:slug/edit/:pageSlug` | člen (dle práv stránky) | 11 | **0** |
| `/svet/:slug/:pageSlug` (wiki catch-all, PageViewer/PostavaLayout) | showcaseOrMember | 11 | **0** |
| `/svet/:slug/pravidla` · `magicky-system` · `technologie` · `nabozenstvi` · `faq` · `videa` (seedované) | showcaseOrMember | 11 | 1 |
| `/svet/:slug/admin/stranky` | PomocnyPJ+ | 11 | 2 |
| `/svet/:slug/postavy` | showcaseOrMember | 12 | **0** |
| `/svet/:slug/moje-postava` | člen | 12 | **0** |
| `/svet/:slug/postava/:slug` | redirect (legacy) | 12 | — |
| `/svet/:slug/bestiar` | showcaseOrMember (čtení) / PomocnyPJ+ (správa) | 12 | **0** |
| `/svet/:slug/obchod` | člen | 12 | 1 |
| `/svet/:slug/prevodnik-men` | člen | 12 | 2 |
| `/svet/:slug/chat` | člen (psaní Hráč+) | 13 | **0** |
| `/svet/:slug/novinky` | showcaseOrMember | 13 | **0** |
| `/svet/:slug/takticka-mapa` | člen | 14 | **0** |
| `/svet/:slug/mapy` (atlas) · `/mapa` (vesmírný graf) | showcaseOrMember | 14 | 1 |
| `/svet/:slug/zvuky` | člen | 14 | 2 |
| `/svet/:slug/denik-pj` | PomocnyPJ+ | 14 | 2 |
| `/svet/:slug/podzemi` · `/:dungeonId` (Stavitel) | Hráč+ (tvorba Podporovatel/PJ+) | 14 | 2 |
| `/svet/:slug/kalendar` | PomocnyPJ+ | 15 | 1 |
| `/svet/:slug/admin/kalendare` | PomocnyPJ+ (Hráč → ForbiddenPage; BE GET je Hrac+ — jen techn. detail) | 15 | 2 |
| `/svet/:slug/timeline` · `/pocasi` | Hráč+ (mutace počasí PomocnyPJ+) | 15 | 1 |
| `/svet/:slug/akce` | Čtenář+ (tvorba+archiv PomocnyPJ+) | 15 | 1 |
| `/svet/:slug/pavucina` | člen (hráč vlastní vrstva) | 15 | 1 |
| `/svet/:slug/scenare` (Storyboard) | PomocnyPJ+ | 15 | 2 |
| `/svet/:slug/karta-tokenu` | pop-out mimo layout — **bez Vypravěče** | 14 | — |

**Tier 0 = přesně 25 rout** (tučné): trasa cesty 26.1 (vytvorit-svet → dashboard → stranky/nova-stranka → nastaveni/hraci → chat světa) + nejfrekventovanější povrchy obou pater.

---

## 2. Top-10 zákysů napříč oblastmi

Doložené sloupci „KDE SE ZTRÁCÍ" ve ≥2 oblastech → **~20 hlubokých topiků Tier 0** se staví primárně na nich.

| # | Zákys | Projev | Oblasti | Topik (kanonická ID dle [06-obsah-a-udrzba.md](06-obsah-a-udrzba.md) §5.1b) |
|---|---|---|---|---|
| 1 | **Dvouvrstvý role model** (globální UserRole vs. WorldRole; admin elevace R-20) | „Jsem Admin a ve světě nic nemůžu"; PJ čeká moc na platformě; „Aktivovat admina" nikdo nezná; logout elevaci shodí | 00, 02, 08, 09, Router | `role.dve-patra` |
| 2 | **4 accessMode** (public/open/private/closed) + „Chci hrát" vs. „Jen číst" | Jednou vstoupím hned, jindy čekám; private = 404 (nevím, zda svět existuje); po vstupu jsem „jen" Čtenář; nový svět je default Soukromý a PJ neví, proč nikdo nechodí | 03, 09, 10 | `svet.vstup` |
| 3 | **Žadatel = čekání, ne chyba** | Po žádosti nevidím obsah, chat „rozbitý"; Žadatel není role (sentinel 0) | 00, 07, 09, 13 | `svet.zadatel` |
| 4 | **Kanál vs. konverzace** (FE invertované vůči BE: „kanál"=ChatGroup, „konverzace"=ChatChannel) | Nejde psát do „kanálu" (je to složka); Čtenář nevidí Globální (accessMode `all` = Hráč+) | 13, Router | `svet.chat.kanal-vs-konverzace` |
| 5 | **Kostky whitelist** (`World.dice`, nastavuje PJ) | Chybí 🎲 / „PJ nedovolil kostky"; kostky se nehází v deníku, ale na TM/v chatu | 12, 13, 14 | `svet.chat.kostky` |
| 6 | **3 mapy** (Atlas `/mapy` · vesmírný graf `/mapa` · taktická `/takticka-mapa`) | Nový uživatel neví, kam pro co; hráč bez přiřazené scény vidí prázdnou TM | 14 | `rozcestnik.mapy` |
| 7 | **3 kalendáře** (PJ dashboard `/kalendar` · konfigurace `/admin/kalendare` · události na postavě/NPC/lokaci) + 2× „Akce" (svět vs. platforma) | Hledá „Přidat událost" v read-only dashboardu; hráč Kalendář v menu vůbec nevidí (floor PomocnyPJ) | 06, 15 | `rozcestnik.kalendare` |
| 8 | **„Postavu zakládá PJ"** | Hráč hledá „Nová postava" a nenajde (PJ+ only); Moje postava = prázdné CTA; postava vzniká schválením žádosti „Chci hrát" | 09, 12 | `postava.zaklada-pj` |
| 9 | **AKJ zámky** (🔒 clearance záložky; ≠ page-level accessRequirements) | Zamčená záložka vypadá jako chyba; PomocnyPJ má page-level bypass, ale AKJ záložky bez grantu nevidí; úrovně se definují #akj, přiřazují #clenove | 00, 10, 11 | `akj.zamky` |
| 10 | **Taby/nav dle role** | Hráč vidí v Nastavení jen 2 z 19 tabů („nastavení nefunguje"); nav světa skrývá položky; Čtenář z timeline/počasí tiše přesměrován na index světa (route floor Hráč, R-06/R-18) — „položka zmizela / vrátilo mě to na dashboard", ne 403 | 10, 15, Router | `svet.nastaveni.taby` |

Sekundární kandidáti (Tier 0/1 dle kapacity): dvě patra platforma/svět (2 chaty, 2× novinky, 2× akce, 2 bestiáře, 2 podzemí) · 3 „šablony" ve světě (stránky/deník/bestie) · 3 přepínače soukromí · 2 avatary (osobní vs. Camp postava) · NPC vs. Bestie · TTL 1 h zpráv globálního chatu · TÚ/magie/náboženství jen při tvorbě světa.

---

## 3. Chybové kódy → topik (Tier 0, ~15 položek)

Mapa `ERROR_TOPICS: Record<ErrorCode, TopicId>`; trigger = interceptor 2× stejný code+route za session (SYNTEZA §3.3). **Vztah k friendly-messaging (oprava kritika):** přívětivá hláška = 1. linie (zůstává), chybový topik = 2. linie „PROČ + co dál + akce"; texty hlášek postupně čerpat z registru (pole `shortMessage` téhož topiku), CI hlídá, že obě znění nejsou protichůdná — žádný druhý zdroj pravdy.

| # | Kód / stav | Kdy nastane | Topik říká |
|---|---|---|---|
| 1 | 403 role-floor | nízká WorldRole na BE akci (zápis: tvorba akce, mutace počasí…; čtecí routy gatuje FE floor tichým redirectem dřív) | floor + kdo roli udělí; **nikdy nenavigovat do 403** |
| 2 | 403/„čekání" Žadatele | pending žádost o vstup | čekání není chyba; stav na dashboardu světa; zrušení žádosti |
| 3 | 404 private svět | nečlen/anonym na private světě | svět možná existuje; přihlas se / požádej o vstup |
| 4 | 409 `LIMIT_REACHED` | kumulativní limity tvorby (2000 stránek/svět, 1000 bestií…) | limity + „ozvi se správci" |
| 5 | 403 `WORLD_QUOTA_REACHED` | 30 aktivních vlastněných světů/účet (Podporovatel; bez podpory 3 = `WORLD_MEMBERSHIP_QUOTA_REACHED`; ≠ kumulativní strop 50 vč. smazaných → 409 #4) | kvóta; kontakt na správce |
| 6 | 429 `REJECTED_RECENTLY` | opakovaná žádost o přátelství po odmítnutí | cooldown 7 dní jen pro odmítnutého; druhá strana může poslat kdykoli |
| 7 | `SOLE_PJ_BLOCK` | smazání účtu jediného PJ světa | nejdřív jmenovat PomocnéhoPJ / předat svět |
| 8 | `WORLD_OWNER_CANNOT_LEAVE` | vlastník chce odejít ze světa | předání světa v Nastavení #clenstvi (kandidát Hráč+) |
| 9 | `INSUFFICIENT_FUNDS` | nákup v obchodě | účty postavy, převodník měn, kdo dorovná |
| 10 | `USERNAME_CHANGE_VIA_REQUEST` | pokus o přímou změnu přezdívky | žádost přes profil → Bezpečnost; admin schvaluje; cooldown 30 dní |
| 11 | 404 `NOT_APPLICABLE` | Finance/Výbava u NPC | záměr (NPC má jen 3 subdokumenty), ne chyba |
| 12 | 403 `NOT_SUPPORTER` | tvorba ve Staviteli bez Podporovatele | freemium brána; co Podporovatel odemyká |
| 13 | „PJ nedovolil kostky" | prázdný whitelist `World.dice` | PJ nastaví v Nastavení světa; hráči „připomeň mu to" |
| 14 | zamčené AKJ záložky 🔒 | clearance bez grantu | utajení je záměr; o přístup požádej PJ |
| 15 | `SESSION_REVOKED` / MaintenanceOverlay | logout-all, změna hesla / výpadek BE | proč relace skončila; „přestavuje se, stránka se sama obnoví" |

Kandidáti Tier 1: 409 `PIN_LIMIT` + `NOT_FAVORITE` (oblíbené/připnuté) · 403 profil jen pro přátele · 404 `USER_NOT_FOUND` u blokace (anti-stalk — **topik nesmí prozradit blokaci**) · 409 slug kolize („Svět s tímto názvem už existuje") · 409 edit konflikt (měny, stránky) · TOTP lockout 15 min · 400 upload (5/10 MB, SVG zákaz, prohlášení práv).

---

## 4. Kolizní plochy a obyvatelé pravého dolního rohu (závazná inventura)

Oprava kritika: syntéza inventuru fixed prvků neobsahovala; FAB kotva (fixed vpravo dole) má existující obyvatele. Pravidlo skrytí (SYNTEZA §3.4): default při neznámé kolizi = skrýt; každá nová „soustředěná" plocha se doplňuje povinně.

| Plocha / prvek | Kde | Chování kotvy |
|---|---|---|
| **WorldVoiceHost** (Jitsi panel 17.6, `fixed right:16 bottom:16`) | světy s aktivním voice | závazně vyřešeno v [03-interakcni-model.md](03-interakcni-model.md) §2: viditelný voice host nastaví `--voice-host-h` → FAB vyskočí nad kartu přes `--fab-shift` (bottom-stack kontrakt) |
| PWA Install/UpdateBanner, DiceRollOverlay | globálně | bottom-stack `--fab-shift` tamtéž (detail 03 §2) |
| Chat composery (Putyka, Campy, chat světa) | `/chat*`, `/svet/:slug/chat` | **skrýt**; krok cesty cílící na composer doručí repliku PŘED vstupem (kritika ke kroku 5 cesty 26.1); lišta cesty = minimalizovaný proužek, ne zmizení |
| Taktická mapa | `/svet/:slug/takticka-mapa` | **skrýt**; vstup = „?" (WorldHelpButton) + Shift+V |
| Otevřený PageEditor | `/svet/:slug/nova-stranka`, `/edit/:slug` | **skrýt** při focusu v editoru |
| Otevřená mobilní klávesnice | všude | **skrýt** |
| Pop-out karta tokenu | `/svet/:slug/karta-tokenu` | VypravecRoot se vůbec nemountuje |
| 17.10 panelový workspace (až vznikne) | TM | doplnit do whitelistu povinně |

Náhradní vstupy na kolizních plochách: v MVP-A je „?" **přiznaný legacy vstup** (parita obsahu až MVP-B wrapem in-situ helpů — oprava kritika); mobil navíc položka „Vypravěč" v mobilním menu/draweru, aby TM/chat nebyly slepé místo.

### Rozsah pro anonyma (oprava kritika)

| Kde | FAB | Momenty |
|---|---|---|
| Veřejné platformní routy (`/`, vesmiry, clanky, galerie, napoveda, novinky, tvorba, legal) | ano | jen typ 2 (první vstup) + 3 (zákys); post-registrace se netýká; rozcestník míří na registraci (`?openRegister=1`) |
| Putyka `/chat` (host) | ano (mimo composer) | vysvětlení host módu, CTA registrace |
| Výkladní skříň světa (publicShowcase) | ano, audience anonymní Čtenář | vysvětlit vitrínu + CTA „Přidat se" |
| Private svět, auth-only routy | anonym se tam nedostane | — |

Vše v localStorage; po registraci delta merge do BE (SYNTEZA rozhodnutí 12).

---

## 5. Oblasti (18) — jednotná struktura

Struktura: **Co to je** (kondenzát) · **Routy** (viz §1) · **Role** · **Zákysy** (KDE SE ZTRÁCÍ → chybové topiky/tipy) · **Hooks** (→ topiky/návody). Kapitolová čísla = `docs/funkce/`.

### 00 — Přehled platformy (dvě patra, role, průřezové koncepty)

**Co:** Dvě patra: Ikaros (účet, profil, komunita, objevování) a Svět `/svet/:worldSlug` (wiki, postavy, mapy, kalendář, chat). Registrace → prohlížení vesmírů → vytvořit svět (= PJ) NEBO žádost o vstup (Žadatel → schválení PJ). Role dvouvrstvé, nikdy nemíchat: UserRole (Superadmin=1, Admin=2, Ikarus=9, správci obsahu 10–12) × WorldRole per svět (Zadatel=0 < Ctenar=1 < Hrac=2 < Korektor=3 < PomocnyPJ=4 < PJ=5). Admin má world moc uspanou (elevace, R-20). Průřezově: WS signál→refetch, per-system schémata (14 systémů), per-svět motivy/skiny, AKJ 🔒/🔓, soft-delete světa 30 dní, kumulativní limity (50 světů/účet vč. smazaných, 2000 stránek/svět, 1000 bestií → vlídná 409 `LIMIT_REACHED`; ≠ kvóta 30 aktivních světů, §3 #5), MaintenanceOverlay, SEO/prerender veřejných rout.
**Role:** o přístupu rozhoduje BE, FE guardy jen UX.
**Zákysy:** dvouvrstvý role model (top-10 #1) · dvě patra = 2 menu, 2 chaty, 2× novinky, 2× akce · Žadatel čeká bez obsahu (#3) · admin elevace · AKJ 🔒 vypadá jako chyba (#9) · MaintenanceOverlay vs. skutečná 404 · 409 LIMIT_REACHED u power-userů · obnovu opuštěného světa smí jen Superadmin · per-system deníky matou při přechodu mezi světy · množství rout bez průvodce.
**Hooks:** onboarding rozcestník hráč vs. vypravěč (persona dialog 26.4) · vysvětlovač rolí z WorldContextu („co smím tady a teď") · kontextová navigace per patro · první kroky Hráče (moje-postava → pravidla → chat → kalendář) i PJ (nastavení → pozvi → wiki → TM) · vysvětlit 🔒, Žadatele, limity, údržbu · admin elevace tutoriál · odkaz na HelpPage jako hlubší čtení.

### Router platformy (router.tsx + IkarosLayout + WorldLayout)

**Co:** 3 kořeny (viz §1). IkarosLayout: levý sidebar (Navigace/Vesmíry/Chat s presence), pravý panel (Administrace + Moje světy + Oblíbené; anonym „Začni tady"); focus módy bez pravého panelu pro `/chat*`, `/admin*`, `/ikaros/bestiar`. requireAuth bez JWT uloží login intent → `/?openLogin=1` → po loginu skok zpět. WorldLayout: index bez guardu, sub-routy WorldMembershipGuard (memberOnly/showcaseOrMember/floor). PWA applyStartupRestore obnoví poslední routu při cold-open.
**Zákysy:** role systémy (#1) · tichý redirect nečlena na index světa („nefunguje") · vitrína nekonzistentní na pohled (jen některé sekce) · wiki catch-all `/:slug` vs. pojem „stránky" · Putyka veřejná, campy/voice login-only a anonymovi zmizí · nav skrývá dle role (#10) · `/ikaros/systemy` redirect bez vysvětlení · chat naming invertovaný vůči BE (#4) · post-login skok na intent překvapí · legacy redirecty (rozcesti→camp, postava/:slug).
**Hooks (klíč pro engine):** scope z URL (prefix `/svet/:worldSlug` → world, jinak platforma; neznámý segment = wiki stránka) · číst WorldContext (worldId, world, isPJ, userRole, character, loading) · vysvětlit důvod redirectu (nečlen/anonym/floor) · mapa navigace (hub tvorby, chat místnosti) · nav skupiny světa (Informace/Svět/Hra) a proč položky chybí · rozlišit 2 bestiáře a 2 podzemí · Ctrl/Cmd+K = hledání světa · z parametrů (`:worldSlug`, `:slug`, `:id`, `:dungeonId`, `:groupKey`, `:token`) doplnit entitu.

### 01 — Účet, přihlášení & bezpečnost

**Co:** Registrace = modal (e-mail, přezdívka, heslo min 8, souhlas s podmínkami, věk 15+ povinný, Turnstile; auto-login). Login modal (e-mail/přezdívka; větve deletion_pending → reaktivace, totp_required). Logout s 5s undo; logout-all v profil→Bezpečnost. Reset hesla (mail, TTL 1 h; reset i reaktivuje účet v mazacím okně). Ověření e-mailu jen informativní badge. Změna e-mailu re-auth + link na NOVÝ e-mail (TTL 1 h). 2FA/TOTP wizard s QR + 10 záložních kódů (zobrazí se JEN jednou) + důvěryhodná zařízení 30 dní; 5 chyb = zámek 15 min. Smazání účtu: GDPR export předem, SOLE_PJ_BLOCK, 30denní hold, hard-delete = anonymizace (příspěvky zůstanou). Guest(99) = token bez účtu (Putyka), neprojde žádným gate.
**Zákysy:** login/registrace nemají routu (modaly + intent redirect) · věk <15 tvrdě blokuje · disabled „Vytvořit účet" bez zjevné příčiny (captcha/obsazené jméno) · badge „Neověřeno" nic neblokuje · záložní kódy jen jednou, bez varování při docházení · TOTP lockout vypadá jako rozbitý login · SOLE_PJ_BLOCK · po reaktivaci se povýšení PomocnýchPJ nevrací (D-034b) · 5s undo odhlášení · SESSION_REVOKED toast překvapí · změna e-mailu = klik v novém mailu do 1 h.
**Hooks:** průvodce registrací (15+, captcha, auto-login) · po registraci: ověř e-mail, nastav 2FA · tutoriál 2FA (ULOŽIT kódy!) · rozhodovací strom „nemůžu se přihlásit" (heslo/TOTP zámek/mazací okno/ban) · navigace profil→Bezpečnost · logout-all jako bezpečnostní akce + změna hesla · GDPR export (rozsah: účet, ne obsah světů) · průvodce smazáním účtu (export → SOLE_PJ → 30 dní → obnova) · po reaktivaci připomenout ruční srovnání rolí · role Hrac default ≠ world role.

### 02 — Profil, uživatelé & přátelství

**Co:** Vlastní profil `/ikaros/profil` = dlouhá self-edit stránka: Osobní karta (displayName ≤32, e-mail jen modálem, avatar 5 MB→512), bio ≤1000, **Postava v Campu** (globální chat-identita pro Putyku+Camp: jméno, popis, vlastní avatar), Přátelé, Světy/Postavy/Akce, Komunita, Vzhled (globální motiv, UI zoom 100–150 %, jas/kontrast, barva chatu — paleta 18), Soukromí (Neviditelný mód / Skrýt v adresáři / Jen pro přátele), Notifikace (push master + 9 kategorií), Bezpečnost (žádost o změnu username — admin schvaluje, cooldown 30 dní; heslo, 2FA, zařízení), Moderace (má hlášení + rozhodnutí + Odvolat se, DSA), Účet (JSON export, smazání; MinorNotice). Veřejný profil `/ikaros/uzivatel/:id` (jen přihlášený; friends-only → 403): akce dle stavu přátelství, Blokovat, Napsat zprávu. Adresář `/ikaros/uzivatele`: taby Přátelé (+odeslané, +zablokovaní), Uživatelé (grid, search, 24/str), **Zpracovat** (osobní fronta pending akcí dle rolí). Přátelství: žádost→přijetí; po odmítnutí cooldown 7 dní jen pro odmítnutého (429). Blokace jednosměrná, ruší přátelství, anti-stalk (blokovaný dostane 404). WS toasty.
**Zákysy:** username jen přes žádost (kryptický USERNAME_CHANGE_VIA_REQUEST) · 2 avatary (osobní vs. Camp postava) · e-mail vypadá needitovatelně · cooldown 7 dní se projeví až 429 · tab „Zpracovat" vypadá pokaždé jinak (role, skryté prázdné skupiny) · „Jen pro přátele" skryje i pro poštu prvním kontaktem · 3 přepínače soukromí s odlišnými efekty · blokace = 404 (vypadá jako smazaný účet) · UI zoom vynechává TM (záměr) · správa přátel v adresáři, ne na profilu · hloubková správa uživatelů pod /admin.
**Hooks:** onboarding profilu (avatar, displayName, Postava v Campu) · „jak najít spoluhráče" (adresář → search → profil → Přidat → Napsat) · stavy žádosti o přátelství + cooldown · tutoriál tabu Zpracovat (osobní fronta úkolů) · poradce soukromí (3 přepínače + dopad na poštu) · flow změny přezdívky · blokace (kde, důsledky, odblokování; nic neprozradit) · vzhled (motiv, zoom + výjimka TM, barva chatu) · notifikace (master + 9 kategorií + per-device) · moderace a GDPR sekce · chybové topiky 429/403/400 · adminům: správa je pod /admin.

### 03 — Úvodník & objevování světů

**Co:** Úvodník `/`: anonym = showcase rotátor, CTA „Vytvořit svět zdarma" (reg. modal) + „Prozkoumat světy", panel „Začni tady"; přihlášený = generická karta + 3 akce + 3 novinky, **bez personalizace** (Moje světy jen v pravém panelu). Vesmíry `/ikaros/vesmiry`: mřížka všech aktivních světů („vesmír" = svět!), hledání dle názvu, filtry, řazení — klientské, bez stránkování; vstup dle accessMode (public=join→Čtenář, open=žádost, private=zamčená karta+404 detail, closed=detail ano/vstup ne). Vytvoření světa `/ikaros/vytvorit-svet`: 1 stránka, 10 sekcí — název+popis (slug auto skrytý), žánr (11+vlastní→motiv), kapacita, accessMode (default Soukromý!), systém (14, přednastaví kostky vč. d6+/2d6+), TÚ 0–14, magie (13 tradic), náboženství, motiv, kalendáře; zakladatel=PJ; kvóta 30; BE seeduje měny/počasí/kostky/kalendáře/deník. schéma/6 stránek. **TÚ+magie+náboženství jen při tvorbě.** Nábory `/ikaros/nabory`: pinboard hledám hráče/hru, filtry systém/žánr/režim/fulltext, „Ozvat se" = přímá zpráva, limit 20/uživatel, expirace 30 dní filtrem. Landingy systémů za flagem → redirect.
**Zákysy:** „vesmír"=svět (a BE modul universe = 3D mapa lokací — jiná věc) · dashboard bez personalizace · 4 accessMode bez vysvětlení na místě (#2) · private 404 nejistota · po vstupu jsem Čtenář, hrát nemůžu · **past: TÚ/magie/náboženství jen při tvorbě** · slug skrytý, kolize hlášená u Názvu · d6+/2d6+ mechaniky nikdo nezná · žánr (fakt, filtruje se) vs. motiv (vzhled) · nábory login-only, anonym narazí · WORLD_QUOTA_REACHED · default Soukromý svět = prázdný katalog · filtr hledá jen v názvu.
**Hooks:** onboarding anonyma (Začni tady → registrace → 2 cesty) · vysvětlit accessMode u karty · **průvodce wizardem: minimální povinná pole + předem varovat před pastmi (krok 1 cesty 26.1)** · po založení: co se naseedovalo + kam dál · připomenout „svět je Soukromý — otevři bránu / vyvěs nábor" (krok 4) · nábory (lístek, Ozvat se, žánr vs. motiv) · rozcestník pro přihlášeného (Moje světy, akce, novinky, tvorba) · role poprvé (u vstupu do světa) · chybové stavy (kvóta, kolize názvu, prázdný filtr) · `?openLogin=1`/`?openRegister=1` pro cílené otevírání auth modalů.

### 05 — Komunikace platformy (chat, pošta, notifikace, push, PWA, emoty)

**Co:** Putyka `/chat` (veřejná, host přes captcha — jen text, 10 zpráv/min), Voice krčma `/chat/voice` (Jitsi, jen registrovaní, anonHidden), 3 Campy (RP místnosti Fantasy/Mystery/Sci-fi: sdílená scéna, vystupování za Camp postavu, Uložit/Načíst hru — 1 slot, auto-rotace lokace 12:00/00:00; scénu mění jen staff). **Zprávy všude TTL 1 hodina.** Reply, reakce, přílohy 10 MB, šepot, presence, report. Mazání zpráv jen Admin. Pošta `/ikaros/posta`: soukromá vlákna + systémové zprávy; friend-only filtr; bez příloh; soft-delete per uživatel; push default ZAP. Zvonek: taby Chaty (cross-world feed s deep-linkem), Události, Ke zpracování (jen kdo má pending). Web push (VAPID): per-zařízení přepínač + 9 kategorií; Putyka default VYP; granularita per-typ, ne per-svět; iOS vyžaduje PWA na ploše. PWA: install banner (dismiss=14 dní), offline jen statická stránka. Emoty: textové emoji v globálním chatu vs. custom obrázkové jen v chatu světa.
**Zákysy:** TTL 1 h nikde nesděleno („ztratil jsem historii") · 2 systémy emotů · host neví proč nemůže do Campu/přílohy/šepot · rotace scény Campu přepíše staff override; Načíst hru přepíše cizí rozehranou scénu (záměr) · 1 slot uložení tiše přepíše · push z Putyky default VYP; nejde ztlumit jen jeden svět · iOS push až po PWA na ploše · pošta: friend-only 403 nevysvětlené; mazání jen u mě · zvonek není úplný seznam, chybí „označit vše přečtené" · Voice krčma anonymovi neviditelná · skok na starou zprávu mimo okno ~50 = no-op.
**Hooks:** host mód + nabídka registrace · TTL upozornit při vstupu · průvodce Campem (žánr, scéna, Camp postava z profilu, Uložit/Načíst + limit) · rotace scény vysvětlit při zmatení · Voice krčma (tlačítka mikrofon/kamera/sdílení/pop-out) · šepot (host nemůže) · rozcestník emotů · nastavení push (zvonek→zařízení vs. profil→kategorie; Putyka opt-in) · iOS krok za krokem „Přidat na plochu" · pošta (deep-link `?komu=`, systémové zprávy, 403 friends-only) · tab Ke zpracování rolím s frontou · nahlášení zprávy (kdo, kam jde) · deep-link z feedu (svět+konverzace+zpráva) · PWA (kdy banner, dismiss 14 dní, offline limity).

### 06 — Akce & oblíbené (platformní)

**Co:** Kalendář akcí `/ikaros/akce`: měsíční mřížka (mobil ≤768 px = seznam), detail modal, RSVP „Zúčastním se" (toggle, jen confirmable; DNES!/ZÍTRA! badge). Tvorba/edit/mazání JEN Admin/Superadmin (PJ tu nemá nic); bez opakování, kategorií, kapacit; lokální čas prohlížeče; hard delete. Oblíbené `/ikaros/oblibene`: agregace 3 tabů (?typ=diskuze/clanky/obrazky) — přidává se srdíčkem NA DETAILU v modulech; navíc „připnutí" (max 5/typ → pravý panel; jen už oblíbenou položku — NOT_FAVORITE, PIN_LIMIT). Oblíbit jdou JEN diskuze/články/obrázky. Uvnitř světů nezávislé „oblíbené" (postavy, wiki, klávesa f).
**Zákysy:** na /oblibene nejde nic přidat · 2 stupně (oblíbené vs. připnuté) + nesamovysvětlující chyby · dvojí význam „oblíbené" (globální vs. in-world) · akce nejdou oblíbit (jen RSVP) · hráč nechápe, proč nemůže akci založit (platformový obsah) · herní akce světa žijí jinde · lokální čas bez timezone · chybějící RSVP tlačítko u neconfirmable akce vypadá jako bug · mobil/desktop úplně jiný layout.
**Hooks:** rozdíl platformové vs. světové akce + navigace dle záměru · tutoriál RSVP (toggle!) · flow záložek (detail → srdíčko → /oblibene → špendlík) · PIN_LIMIT rada (odepni jinou, limit 5/typ) · pořadí oblíbit→připnout · rozcestník dvou „oblíbených" · adminům tvorba akce (+ hard delete varování) · hráči proč nemůže zakládat + kam návrh · deep-link ?typ= · badge DNES!/ZÍTRA! + tlačítko Dnes.

### 07 — Nápověda & podmínky

**Co:** HelpPage `/ikaros/napoveda` — dnešní jediný onboarding: statická, 6 tabů přes ?sekce= (start=první kroky+slovníček žargonu · platforma=~40 nástrojů · svet=nástroje světa · role=matice globálních a světových rolí + „Aktivovat admina" · ucet=14 akordeonů (2FA, GDPR, smazání) · faq=39 otázek). Bez vyhledávání, bez deep-linků na akordeon, 0/10 screenshotů, hrozí drift. Legal: /podminky (v1.0, sladěno s BE TERMS_VERSION), /soukromi (13× [DOPLNIT]), /kodex, /kontakt (DSA, 7× [DOPLNIT] vč. e-mailů). SiteFooter linkuje vše, skrývá se v /chat*, /admin*, /ikaros/bestiar*.
**Zákysy:** dohledatelnost (39 FAQ + ~40 nástrojů bez fulltextu a deep-linků) · žargon (AKJ, Camp, Putyka, Pavučina, Token, Stavitel) schovaný ve slovníčku · role matou (Korektor a Čtenář „🚧 v přípravě") · „Žadatel není role" dřív popisováno chybně · 🚧 štítky neprovázané s realitou · **mrtvá cesta hlášení chyb** (FAQ→podminky→kontakt→[DOPLNIT]) · nulté vizuály · registrace nelinkuje /kodex · hardcoded datum aktualizace.
**Hooks:** Vypravěč jako náhrada vyhledávání (dotaz → tab+akordeon + navigace) · interaktivní tutoriál místo statického „Začni tady" · žargon on-demand kdekoli · role-poradce z matic (vč. Žadatel není role) · poctivost o 🚧 z `docs/funkce/` · navigace na legal (pravidla/nahlásit/GDPR/smazání) + překlenout mrtvý odkaz · kostkové FAQ per systém (k6+/2k6+, Shadowrun, DH, GURPS) · in-situ vrstva nad 17.13 + `@/shared/ui/help` bloky · suplovat chybějící screenshoty slovním popisem · obsah stavět na docs/funkce/, ne dědit drift HelpPage.

### Nápovědové vrstvy FE (HelpPage, in-situ „?", TM nápovědy, Začni tady, empty-states) — migrační podklad

**Co:** 5 vrstev (kanonická inventura: 07 §2): 1) HelpPage — sections/*.tsx ~170 kB JSX (WorldSection 61 kB, PlatformSection 38 kB, FaqSection 31 kB); data-driven výjimky: media.ts (HELP_MEDIA, skoro vše src:undefined), FAQ pole, GLOBAL_CARDS+PermissionRow, TAB_LABELS; není role-aware. 2) world/help: WorldHelpButton „?" + WorldHelpModal (patička → ?sekce=svet), ChatHelp + TacticalMapHelp — role-aware prop `audience:'pj'|'hrac'`; + WorldToolboxPanel (TOOLBOX_ITEMS data-driven, toolboxItemsFor(isPJ)). 3) TM nápovědy 17.13: OrchestraceHelp (prop canManageScenes) a EfektyKresleniHelp (audience) — reuse shared bloků. 4) AnonStartPanel „Začni tady" (IkarosLayout): hardcoded 3 kroky, kroky 2–3 neklikací. 5) Empty-state CTA roztroušené per obrazovka (5 klíčových míst, 07 §6).
**Zákysy (=technický dluh migrace §8 syntézy):** obsah duplikovaný ručně (TM/chat/orchestrace v WorldSection I v modalech — drift) · HelpPage ne-role-aware, in-situ ano ale dvojí logikou (audience vs. canManageScenes) · žádný fulltext, deep-link jen na tab · prázdné screenshoty · Začni tady neklikací · vazba modal→nápověda jen hrubá (vždy ?sekce=svet).
**Hooks (pořadí migrace):** snadné = už data-driven (TOOLBOX_ITEMS, FAQ pole, HELP_MEDIA, GLOBAL_CARDS, TAB_LABELS) → registr MVP · střední = 4 in-situ komponenty jako `bodyComponent` topiky bez přepisu, modaly i HelpPage renderují týž topik; **povinný mapping test audience/canManageScenes → VypravecAudience** (PomocnýPJ nesmí tiše ztratit obsah) · bolet bude = rozřez sections/*.tsx (akordeony bez ID, interní <Link>, 3 CSS zdroje) — po betě, po kapitolách, nikdy big-bang · deep-link kontrakt `?sekce=X&topik=Y` (MVP-A linkovat jen holé /ikaros/napoveda — oprava kritika) · AnonStartPanel → klikací rozcestník Vypravěče.

### Komunitní obsah platformy (Společná tvorba)

**Co:** Hub `/ikaros/tvorba` — 11 dlaždic: Diskuze, Články, Galerie, Bestiář, Herbář, Kouzla, Lektvary, Předměty, Hádanky, Ceníky, Generátory (+ Novinky mimo hub). Články (rich-text, hodnocení 1–5, připnutí max 5), Galerie (10 MB, povinné prohlášení práv, štítek AI, ne SVG, bez alb — jen kategorie), Diskuze (fórum, lajky, uzamčené s join-request), 8 katalogů se vzorem **draft → kurátor → publikováno**; Kouzla/Lektvary/Předměty mají statblocky per systém (šablonu vynucuje FE, „balancnuté" schvaluje kurátor); Herbář/Lektvary/Předměty/Ceníky umí vklad do obchodu světa (single/bulk, jediný world-gate: PomocnyPJ+); Hádanky se spoiler-reveal; Generátory čistě klientské (seed, zámky řádků, demografický model potomků); Ceníky per éra (středověk→galaxie), trojí měna, kurz 1 zl=10 st=100 md. Role vše globální: každý přihlášený navrhuje, recenzenti SpravceClanku/Galerie/Diskuzi, kurátor katalogů = SpravceDiskuzi/Clanku+Admin+; kategorie tvoří Admin+, maže JEN Superadmin; novinky jen Admin+. Anonym vidí Články, Galerii, Novinky, hub; Diskuze + katalogy login-only. Rejected = editovatelné + znovu odeslat; autor dostane poštu+push. Fronty se sbíhají v „Ke zpracování".
**Zákysy:** odeslané „zmizelo" (Pending, needitovatelné; tab Moje) · login-gate nekonzistentní (články ano, katalogy ne) bez vysvětlení · statblocky (proč needituju cizí, co je „balancnuté") · vklad do obchodu vidí každý, projde jen PomocnyPJ+ · galerie bez alb; editace nemění soubor · prohlášení práv + SVG zákaz · kategorie: Admin tvoří, jen Superadmin maže · Rejected ≠ konec · trojí měna ceníků · hádanky bez názvů, odpověď za spoilerem · generátory nesamovysvětlující · novinky platformy vs. světa vypadají stejně.
**Hooks:** orientace v hubu dle záměru · tutoriál první článek (autosave → Pending → rejectReason) · tutoriál upload (formáty, práva, AI štítek) · pipeline Draft→Pending→Published/Rejected + kdo schvaluje · průvodce katalogy pro PJ („naplnit obchod" → vklad single/bulk; „hádanka do jeskyně"; „jména NPC" → Generátory) · přidání statbloku v dalším systému · recenzent/kurátor: kde je fronta, bulk approve · „Nahlásit" jednotně vč. copyright takedown · diskuze otevřená vs. uzamčená · notifikace při schválení/zamítnutí + opt-out ikarosNews · připnutí max 5 · ceníky: navigace na éru dle světa + měny.

### 08 — Platformová administrace

**Co:** 6 globálních rolí (Superadmin=1, Admin=2, Ikarus=9, SpravceClanku=10, SpravceGalerie=11, SpravceDiskuzi=12; Guest=99 sentinel). /admin jen Superadmin+Admin: taby Přehled (statistiky 15B.7/19.1/19.2/20.6), Uživatelé (role, ban, soft-delete 30 dní, Podporovatel, reset hesla+e-mail jen Superadmin, bulk; Admin nesahá na Admina, nikdo na sebe), Smazané světy (obnova ≤30 dní), Audit log (28 akcí), Search index (rebuild), Friendship debug (DEV). Flagy D-033: canManageAdmins (jen Superadmin), canModerateContent (gatuje JEN mazání účtů — matoucí název). /admin/chat = interní chat správy (konverzace jen Superadmin, PDF ≤10 MB, úkoly). Obsahoví správci mají jen frontu „Zpracovat" (`/ikaros/uzivatele?tab=zpracovat`) + moderaci nahlášeného obsahu (M0–M4; M5–M7 a „ohrožení nezletilých" jen Admin+). Nahlašování (DSA): „Nahlásit" u ~12 typů obsahu, autor dostane odůvodnění do pošty, vidí v profilu→Moderace, odvolání 1× (jiný moderátor). GDPR: self-service export JSON, žádný admin override. Hledání vždy per-svět (worldId povinný); MeiliSearch tichý fail.
**Zákysy:** dvojí roleový svět (#1; governance světa = PJ, R-20) · fronta Zpracovat NENÍ v /admin · canModerateContent nemoderuje obsah · report (M0–M7) vs. schvalovací fronty = dvě věci v jedné frontě · M2/M3 skrytí vypadá jako bug i vlastníkovi · odvolání jen 1×, stav v profilu→Moderace · „anonymní" nahlášení = jen skrytí jména · statistiky svádí k misinterpretaci (snapshoty, odhady) · soft-delete okna 30 dní (účet i svět) · MeiliSearch tichý fail = „nic neexistuje" · GDPR export jen account metadata · Guest=99 sentinel; BE default Hrac=5 FE nepojmenovává (drift).
**Hooks:** globální vs. world role na dotaz „proč nemůžu X ve světě" · navigace správce obsahu na jeho pracoviště · provést nahlášením (kategorie, anonymita, ne vlastní obsah) · statement of reasons + odvolání · GDPR export (co obsahuje/neobsahuje) · obnova smazaného světa přes Admina · ban/smazání účtu (hold, obnova, PJ handover) · hierarchie a flagy adminům · čtení metrik Přehledu s limity · /admin/chat (kdo zakládá, PDF, úkoly, push kategorie) · Podporovatel (kdo uděluje, co odemyká) · diagnostika hledání (per-svět, rebuild, tichý fail) · globální vs. per-world emoty · deep-link „Otevřít v administraci".

### 09 — Svět: vstup, dashboard, členství & role

**Co:** Detail světa `/svet/:slug` = veřejný shell (private → 401/404). Vstup dle accessMode; JoinCTA 2 cesty: **„Chci hrát"** (mini-formulář jméno postavy+poznámka; schválení PJ vytvoří živou stránku postavy + roli Hráč) vs. **„Jen číst"** (→ Čtenář). PJ vyřizuje žádosti na 3 místech: tab Zpracovat, stránka Hráči („Čekající žádosti"), zvoneček+drawer. Proaktivní pozvání: cílená pozvánka nebo odkaz `/invite/:token` — **přijetí dává vždy Čtenáře**, PJ povyšuje ručně. Členský dashboard = 3 sloupce (Hráči+Akce / Chat+Novinky / Oblíbené stránky). Správa členů (role/skupina/AKJ/postava/odebrání) v Nastavení #clenove (PomocnyPJ+, role-ceiling: nikdo neudělí roli ≥ své); stránka Hráči = adresář+žádosti+pozvánky, role se tam NEmění. Skupiny = party/frakce (barva, znak, chat kanál) — nejsou oprávnění. Vlastník neodejde bez předání (#clenstvi; kandidát Hráč+; nový→PJ, původní→PomocnyPJ). Mazání: soft-delete 30 dní, obnoví jen platform Admin. Admin elevace (R-20; výjimka: předání světa neobchází). Výkladní skříň (publicShowcase, jen PJ, ne na private): anonym read-only vitrínové sekce + ShowcaseBar + CTA „Přidat se". ShareButton v hero. Online tečka = globální presence, ne per-svět.
**Zákysy:** názvosloví accessMode („Veřejný se schválením"=open mate) · 2 volby JoinCTA — „Jen číst" nedá postavu · Hráči vs. Nastavení#clenove = dvě místa správy lidí · **PomocnýPJ spravuje členy, ale NEschvaluje žádosti o vstup** (jen owner/co-PJ) · Čtenář z timeline/počasí tiše přesměrován na index (route floor Hráč; BE assertMember=Hráč už jen zálohou) · elevace vypadá jako rozbitá oprávnění · WORLD_OWNER_CANNOT_LEAVE bez postupu · pozvánka dává jen Čtenáře („nemám postavu") · skupina vypadá jako role · online tečka globální.
**Hooks:** průvodce vstupem (accessMode konkrétního světa + co které tlačítko udělá; doporučit „Chci hrát") · po žádosti: stav Žadatele, kde zrušit, co nastane po schválení · nový Čtenář: proč nevidí timeline/počasí, jak k postavě · čerstvý PJ: 3 místa žádostí, schválení s postavou, pozvání, kde měnit role · rozcestník správy lidí (Hráči vs. #clenove vs. #clenstvi) · hierarchie rolí + výjimka PomocnýPJ · předání a smazání světa krok za krokem · elevace pro adminy (logout ji shodí) · propagace (ShareButton, výkladní skříň) · chytré 403/404 s akcí · skupiny (založení, znak, vazba na kanál).

### 10 (kap.) — Nastavení světa & hlavní lišta

**Co:** `/svet/:slug/nastaveni` = 19 hash tabů gatovaných rolí a systémem: Ctenar+ „Můj vzhled" (osobní motiv/pozadí/jas — follow-PJ logika) a „Členství"; Korektor+ Základní info (název/žánr/systém/kostky/hero), Přístup (accessMode + toggle výkladní skříně — BE ale PJ-only!), Šablony stránek; PomocnyPJ+ Členové, AKJ úrovně, PJ v chatu, Emoty, Kalendáře, sdílený Vzhled; PJ-only Postavy&NPC (viditelnost záložek), Hlavní lišta (jen rozcestník na `/admin/headline`), Mapy (defaulty scén), Souboj v chatu (default HP viditelnost), Export/Záloha (ZIP vč. médií, chat opt-in `?chat=1`), Smazat svět, a jen u „Vlastní Systém": Šablona deníku + Šablona bestie (schema buildery, 3 startovní šablony). Menu builder `/admin/headline`: viditelnost 16 modulů (skrytí ≠ zákaz přístupu), vlastní odkazy (nevalidované → 404, dluh č. 4), šablony menu, „Last info" proužek 280 zn. Vstup = ⚙ v hlavičce (mobil ≤768 px v draweru).
**Zákysy:** uživatel nevidí taby nad svou rolí („nastavení nefunguje") (#10) · ⚙ na mobilu v draweru · Šablona deníku/bestie jen u Vlastního Systému · Vzhled vs. Můj vzhled (kdo co přebíjí, follow-PJ) · Hlavní lišta se edituje jinde · skrytí modulu neblokuje URL · nevalidovaný vlastní odkaz → 404 · vlastník neodejde bez předání · toggle výkladní skříně: Korektor vidí, BE dá 403; na private disabled · obnova smazaného světa jen Admin · currencies/počasí nemají tab (řeší se jinde) · změna systému re-seeduje schéma deníku (nečekaný efekt) · export ZIP jen PJ.
**Hooks:** mapa tabů dle role („proč nevidím X") · navigace vzhledů (jen pro sebe #muj-vzhled vs. svět #vzhled) · **checklist čerstvého PJ: Základní info → Přístup → Členové/skupiny → AKJ → Vzhled → Hlavní lišta** (fáze A cesty 26.1) · 4 accessMode + výkladní skříň · menu builder (skrytí neblokuje URL, varovat před překlepem, Last info) · tutoriál Vlastní Systém (šablona deníku 9 typů bloků, formula; hody zatím 4dF — F4 čeká) · AKJ: definice #akj, přiřazení #clenove · předání světa / odchod · smazání (soft-delete 30 dní → Admin) · doporučit Export před velkými změnami · R-20 adminům · defaulty Mapy/Souboj dědí jen NOVÉ scény/konverzace · mobil: kde je ⚙ + hash taby.

### 11 — Stránky, wiki & informace

**Co:** Jednotná entita Page, 13 typů (Lokace, Noviny, Seznam, Galerie, Zoom, Rodokmen, Obrazovka, Ostatní, Frakce/Organizace/Stát, PC, NPC); PC/NPC/Lokace auto-vytváří Character se subdokumenty (PC=5, NPC=3, Lokace=kalendář). Encyklopedie `stranky` (plochý seznam, fulltext, filtr typu, oblíbené s drag&drop) · PageViewer (9 layoutů, AKJ záložky, wikilinky, tisk/PDF, zkratky Ctrl+K/f/e/Shift+?) · PageEditor (identita, datová šablona=atributová tabulka, TipTap s [[wikilinky]], per-typ panely, AKJ záložky; auto-draft localStorage, Ctrl+S, 409 modal) · Návrhy hráčů 15.11: Hráč+ přes „+ Navrhnout" → pending, PJ schválí/vrátí/zahodí · Admin stránek (hromadné hard delete) · Šablony stránek (jen tabulka+osnova, NE celá stránka; osnova jen do prázdného contentu) · 6 seedovaných referenčních stránek + menu „Informace" · oblíbené per-uživatel per-svět. Přístup: page-level accessRequirements (OR: UserId/AKJ/Role/AKJType) + per-záložka AKJ (🔒 = jméno+úroveň bez obsahu); pending vidí autor+moderátor.
**Role:** Čtenář+ čte (anonym přes vitrínu) · Hráč+ navrhuje pending, edituje Bio své PC + ownerEditable záložky · Korektor+ spravuje šablony (paradox: stránku naostro ne) · PomocnyPJ+ tvoří/edituje/maže naostro, schvaluje, vidí backlinks — ale bez auto-bypassu AKJ záložek · PJ/elevovaný vidí vše.
**Zákysy:** seedovaná `nabozenstvi` NENÍ v menu Informace · 3 různé „šablony" (stránky/deník/bestie) · šablona neplní celou stránku · PomocnyPJ: page bypass ano, AKJ záložky ne (vypadá jako bug) · Korektor: šablony ano, stránka naostro ne · Hráč přehlédne „+ Navrhnout" (nevidí „Nová stránka") · pending nevidí ostatní (⏳ badge jen na detailu) · plochý seznam bez složek · přepnutí typu stránky ztrácí data (galerie/videa/menu) · legacy Rodokmen (starý typ=Zoom vs. familyTree) · hard delete bez undo · zkratky neviditelné (odhalí Shift+?) · backlinks jen PomocnyPJ+ · slug auto-suffix (mapa→mapa-2) · 🔒 clearance vs. úplně skrytá záložka — dva režimy · tisk černobílý, cross-origin obrázky se nevytisknou.
**Hooks:** onboarding tvůrce: 6 seedovaných stránek + skrytá nabozenstvi (krok 2 cesty 26.1 „Svět NENÍ prázdný") · průvodce první stránkou (typy; Lokace/NPC dostanou subdokumenty; šablona s osnovou — krok 3 cesty) · hráči „+ Navrhnout" + ⏳ · PJ fronta ke zpracování (Schválit/Vrátit/Zahodit) · AKJ záložky (presety PJ informace/Soukromé, clearance, 🔒; PomocnémuPJ vysvětlit ne-bypass) · vlastníkovi PC: Upravit Bio + ownerEditable · [[wikilink]] + LinkPicker + červené broken linky · rozcestník kde co je (katalog/Informace/Admin/Šablony) · 3 šablony — doptat se · zkratky + tisk s limity · oblíbené (f, drag&drop, dashboard) · varovat před destrukcí (přepnutí typu, mazání bez undo) · vitrína pro anonyma · page-level vs. AKJ zámky (OR logika) · CTA „Vytvořit pravidla" pro PomocnyPJ+.

### 12 — Postavy, bestiář & ekonomika

**Co:** Adresář postav `postavy` (PC+NPC karty, hledání, skupiny, oblíbené jen localStorage; „Nová postava" jen PJ+ → wizard stránky). Detail = Page (PostavaLayout); `moje-postava` = zkratka. **3-tier: PC (5 subdoc) · NPC (3 — Finance+Výbava 404 NOT_APPLICABLE záměrně) · Bestie (katalog, jen systemStats).** Per-system schema engine: 14 listů (matrix, dnd5e, jad, drdh, drdplus, drd2, drd16, coc, fate, fae, gurps, pi, shadowrun, generic); listy = evidence, ne engine; **kostky se hází až na TM/v chatu**. 8 skinů deníku per uživatel×svět (🎨 na DiaryTab). Bestiář světa (gate PomocnyPJ+): 3 scope Můj (cross-world) / Tohoto světa / Systémové (read-only); spawn = nezávislý snapshot. Komunitní bestiář+herbář (login, návrh→kurátor; vklad do světa/obchodu jen PomocnyPJ+). Obchod: správa PomocnyPJ+, nákup hráč jen pro svou PC — atomicky odečte účet + přidá do výbavy; storno. Převodník měn: kalkulačka každý člen, kurzy PomocnyPJ+, přidání/smazání měny PJ+. Finanční účty: multi-account, převody, měsíční bilance; hráč self-adjust jen s flagem. 🎒/💰 embed Výbavy/Financí v TM a chatu (jen PC).
**Zákysy:** hráč si postavu nezaloží (#8) · NPC vs. Bestie se plete (kde co tvořit) · NOT_APPLICABLE vypadá jako chyba · deník nehází kostkou (#5) · bestie=snapshot (úpravy katalogu se nepropíší do tokenů a naopak) · oblíbené jen localStorage (ztráta na jiném zařízení) · Moje postava bez postavy = jen CTA bez vysvětlení · komunitní tvorba čeká na kurátora · vklad jen kde jsem PomocnyPJ+ · skin per uživatel×svět (spoluhráči vidí jinak; do PDF nejde) · dvě hranice měn na jedné stránce (kurz PomocnyPJ / přidání PJ) · Bio se edituje přes PageEditor, ne na stránce.
**Hooks:** onboarding hráče „postavu ti založí PJ — napiš mu" + navigace moje-postava (empty state Tier 0) · 3-tier jednou větou · průvodce deníkem (list dle systému, hody až na mapě, tisk/PDF) · tutoriál nákupu (Nakupuji pro → odečet → výbava; storno; INSUFFICIENT_FUNDS) · Finance vs. Účty (bilance vs. banka; allowPlayerSelfAdjust) · PJ Bestiář (3 taby, klon, spawn=kopie) · Společná tvorba (návrh→schválení→vklad) · hromadný vklad herbáře do obchodu (až 200 položek) · role ekonomiky (obchod/kurzy PomocnyPJ+, měny PJ, hráč nakupuje) · skin picker (osobní volba) · viditelnost (cizí vidí jen Profil; PJ může taby skrýt) · převodník (kurz k základní měně 1.0; nákup převádí automaticky) · kontext hlášek (404 NPC normální; 409 měny = obnov stránku).

### 13 — Komunikace světa (chat + novinky)

**Co:** Chat: sidebar „kanály" (složky) + „konverzace" (vlákna) + pravý rail. Auto: kanál Globální (konverzace pro Hráče+) a Postavy (per-hráč soukromá linka s PJ, vzniká přidělením postavy); per družina kanál. Struktura jen PomocnyPJ+; pořadí/sbalení osobní cross-device. PJ persona (unified/individual, i zpětně; „za NPC" override). Šepoty (visibleTo) vidí adresáti + PomocnyPJ+. 🎲 jen kostky z whitelistu World.dice. Pravý rail: hráč Můj deník (klikací hod do konverzace, inline edit), PJ Přítomní + NPC/bestie + deníky členů. ⚔️ Souboj = combat roster (iniciativa, kola, HP; bestie perzistentní na konverzaci) — PomocnyPJ+ ovládá, hráč čte; HP viditelnost per typ (world default + per-konverzace 👁). Editace/reakce, mentions (@username/@all/@here/@character-slug), vzhled zprávy (18 barev), čtenářský font 👓, skin chatu (12 motivů jen pro sebe), přílohy 10 MB, hledání se skokem, starší po 50 (manuální), custom emoty, push deep-link `?konverzace=&zprava=`. Role: Žadatel nic, Čtenář strukturu (ne „all"), Hráč+ píše, PomocnyPJ+ vše. Novinky: karty (16:9, štítek info/alert/system), detail-okno; Čtenář+ (vitrína→anonym); publikace PomocnyPJ+ (tab Archiv); globální novinky jen Admin; web-push členům; interní odkaz linkPageSlug + fantasy datum; „Nahlásit".
**Zákysy:** kanál vs. konverzace (#4) · Čtenář/Žadatel nevidí Globální („rozbitý chat") · kostky (#5) · soukromou linku vidí celé vedení (bypass) · PJ persona (kdo mi píše; kde přepnout) · šepoty vidí PomocnyPJ+ · pravý rail kontextový, ikonka přehlédnutelná · roster vs. TM = dva souboje (roster bez gridu; HP bestie na konverzaci, HP postavy v deníku) · „Zobrazit starší" manuální · 3 personalizace v jedné 🎨 (co vidí ostatní vs. jen já) · novinky světové vs. globální; typ system jen vizuál · nečlen 403 na novinkách bez CTA.
**Hooks:** struktura chatu + kanál Postavy · co smím dle role + PJ tvorba kanálu/konverzace (accessMode all/members/role) · tutoriál hodu (🎲 Pool/Mixed, modifikátor; PJ na whitelist) · hráčův rail (Můj deník, klikací hod) · PJ rail (Přítomní, deníky, hod za NPC) · combat roster (přidání, Začít boj, Další tah, 👁 + world default) · PJ persona → Nastavení „PJ v chatu" · šepoty + NPC mód · 3 personalizace rozlišit · hledání, deep-linky, starší zprávy · mentions + push worldChat · novinky (tvorba s focal/zoom, interní odkaz, fantasy datum, archiv; hráči detail+Nahlásit) · družina↔kanál (znak = ikona kanálu, Nastavení→Členové). **Krok 5 cesty 26.1 („Napiš do svého světa") cílí sem — replika se doručí PŘED vstupem do composeru (kolizní plocha, §4).**

### 14 — Mapy & nástroje hry

**Co:** (1) Atlas map `mapy`: obrázkové mapy ve složkách, klikací vlaječky (piny na stránky/mapy/info), propojení 1:1 na taktickou scénu, poslání do chatu; správa PomocnyPJ+, leak-safe viditelnost; od 22.4 anonym u vitríny. (2) Vesmírná mapa `mapa`: force-graf planet/lokací, PJ draft mód; NENÍ bojiště. (3) Taktická mapa: PixiJS; tokeny PC/NPC/Bestie, per-system panely, HP bary, fog (štětec + auto LoS přes zdi), efekty/šablony, kreslení, pravítko, combat tracker s živou iniciativou, kostky, počasí, ambient zvuky, UVTT import, per-player scény, undo (PJ), knihovna šablon per-PJ + katalog `/ikaros/sceny` (licence, kurátor, klon PJ+), stream OBS, dotyk. Hráč: vlastní token, HP/injury/iniciativa; „PJ práva"=PomocnyPJ+; scény jen plný PJ. (4) Zvuky: YouTube stopy; taby Svět/Globální/Nominace (Admin schvaluje); vysílání až přes ambient panel mapy. (5) Deník PJ (PomocnyPJ+); hráč má na mapě poznámky postavy. (6) Stavitel: tile editor + generátory podzemí/město/krajina, klíč mapy, PNG export, export na TM se zdmi (jen PJ+, jen world režim); tvorba = Podporovatel nebo PJ+ (freemium); osobní knihovna cross-world.
**Zákysy:** 3 mapy (#6) · hráč bez scény vidí prázdno (assignToScene) · PomocnyPJ vs. plný PJ (scény, klon katalogu, Stavitel) · A* pathfinding neexistuje (movement = jen dosah) · zdi/světla z UVTT „spí" do zapnutí visionMode=dynamic · zvuky na /zvuky hrají jen lokálně · iniciativa řadí živě (pořadí se „samo mění") · drd2 záměrně bez HP baru · Stavitel za freemium (NOT_SUPPORTER teaser) · read-only licence scény se pozná až 403 při klonu · overlay „Scéna není připravena" (per-scéna i per-hráč override) · stream: průhlednost jen OBS Browser Source, jinak chroma.
**Hooks:** rozcestník 3 map dle záměru · PJ „od prázdné mapy k boji": scéna → pozadí/UVTT → přiřadit hráče → spawn → combat.start (návod 26.5; navazuje na OrchestraceHelp) · hráči na prázdné mapě: „PJ ti musí přiřadit scénu" (empty state Tier 0) · role-matice TM (hráč/PomocnyPJ/plný PJ; allowPlayerDrawing) · mlha války: štětec vs. LoS (dynamic + temná scéna + dosvit; zdi ožijí až zapnutím) · Stavitel→TM workflow + freemium · zvuky → ambient panel; nominace do globálu · atlas: vlaječky, per-pin viditelnost, scéna, do chatu · sdílení scén (publikace → kurátor → klon; licence clone/read) · per-system panel dle world.system (DrD+ 2k6+, PI 4dF, GURPS 3k6 roll-under) · undo (co vratné není: hody, částečně combat.end) · stream setup · mobilní gesta (1 prst pan, 2 prsty pinch, long-tap detail — jinde nedokumentováno) · doplňovat, ne duplikovat „?" nápovědy.

### 15 — Čas & příběh

**Co:** (1) Kalendář světa `kalendar` — read-only PJ dashboard (akce + události postav/NPC/lokací, filtry, drawer dne); jen PomocnyPJ+. (2) Konfigurace `admin/kalendare` — 14 presetů (gregorian…babylonian), vlastní měsíce/sezóny/tělesa/přestupné roky; ⭐ výchozí, 🕐 pro timeline; slug neměnný; FE routa PomocnyPJ+ (Hráč → ForbiddenPage; BE GET Hrac+ jen techn. detail — Hráč čte kalendářová data přes timeline/akce). (3) Timeline — chronologie dle 🕐 kalendáře; čtení Hrac+, zápis PomocnyPJ+; scrubber, lunární fáze, konverze dat; vyžaduje ≥1 kalendář. (4) Počasí — generátory per region (presety, archetypy, simulace, historie), broadcast do chatu/na TM, **řízení in-game data (+1/+7 dní advance-day s regenerací počasí)**; čtení Hrac+, mutace PomocnyPJ+, mazání PJ+. (5) Herní akce `akce` — RSVP, komentáře 2 úrovně, reakce, push + připomínky 24h/1h; čtou Ctenar+, tvorba+archiv (starší 24 h) PomocnyPJ+. (6) Pavučina — graf vztahů NPC/frakcí/míst, storylines, poznámky, dashboard Dnes; Ctenar+; hráč vlastní+sdílená vrstva, PJ vše; materializace subjektu na stránku (hráč jen návrh). (7) Storyboard `scenare` — strom scénářů/scén, šablony, drag&drop, vazby na mapové scény/stránky/bestie; PomocnyPJ+; sdílí BE modul campaign s Pavučinou.
**Zákysy:** 3 kalendáře (#7) · 2× „Akce" · kalendář světa je read-only (Přidat se hledá marně) · hráč sjednocený kalendář vůbec nevidí · **in-game datum (advance-day v Počasí) se nepromítá do „Dnes" v kalendáři (reálné gregoriánské) — známý rozpor** · timeline bez kalendáře nefunguje · slug kalendáře neměnný; mazání configu nemaže události · Pavučina vs. Storyboard (jeden BE modul, jiné publikum) · kontextové menu grafu (pravý klik / 2. tap) nesamovysvětlující · materializace hráče = jen pending; PC stránku nesmí · archiv akcí: hráč tiše přesměrován · oblíbené generátory jen localStorage.
**Hooks:** rozcestník 3 kalendářů dle záměru (akce → /akce; událost postavy → subdoc; definice → /admin/kalendare) · PJ první fantasy kalendář (preset → ⭐+🕐; slug neměnný) · timeline tutoriál (ověřit kalendář → událost → scrubber → konverze) · herní čas: advance-day v /pocasi + nepromítá se do Dnes · počasí (preset → generuj → broadcast; PJ vypne mapové) · herní akce (tvorba PomocnyPJ+, groupOnly, RSVP; proč hráč nevidí archiv) · role-aware přehled oblasti (Ctenar/Hrac/PomocnyPJ/PJ) · Pavučina (subjekt → vztah přes kontextové menu → storyline → materializace/Vyvolat stránku; dotyk: 1. tap fokus, 2. tap menu) · Storyboard (strom, šablony, vazby, do chatu, sdílení pro pomocné PJ) · dashboard Dnes (krize, aktivní linky, fixní složení) · při skrytých položkách vysvětlit floor místo mlčení.

---

## 6. Poznámky pro výrobu obsahu

- **Empty states Tier 0 (3–5):** moje-postava bez postavy (12) · dashboard čerstvého světa (09) · prázdné stránky (11) · TM hráče bez scény (14) · Žadatel banner (09).
- **Tier 1 návody 26.5 (10)** mapované na oblasti: Založ a otevři svět (03+10) · První postava (12) · První hod (13/14) · Pozvi hráče (09) · Od prázdné mapy k boji (14) · Mlha války/LoS (14) · První wiki + [[wikilink]] (11) · Kalendář a herní čas (15) · Obchod a peníze (12) · Najdi spoluhráče (02+03).
- **Poctivost o 🚧:** topiky dotýkající se Korektor/Čtenář „v přípravě", importu zálohy, F4 kostek Vlastního Systému nesou pole `status` (oprava kritika — plněno při voice passu, CI soft-report proti 🚧/✅ v docs/funkce/).
- **Anti-stalk pravidlo:** topiky k blokaci (02) a skrytému obsahu moderace (08, M2/M3) nesmí prozradit záměrné utajení konkrétnímu uživateli.
- Každá oblast výše = 1 výrobní dávka linky §7.2 syntézy (1 kapitola ≈ 8–15 jednotek ≈ ~2 h s AI); pořadí dávek: Tier 0 oblasti dle cesty 26.1 (03 → 09 → 10 → 11 → 12 → 13), pak zbytek.
