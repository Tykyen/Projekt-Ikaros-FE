# Chybový deník — proces

Procesní chyby (workflow, návyky, dodržování pravidel). Index v [README](README.md).

---

### CH-010 — Nezapisoval jsem řešení do deníku průběžně (i po nastavení pravidla) · 2026-06-20
**Kontext:** Po rozšíření pravidla „deník nahazuj i po řešení/přepracování" (base.md + skill) jsem dál opravoval tisk (obrázky, page-break, profil, aside, qty) a diagnostikoval Matrix — a NIC z toho nezapsal. Upozornil mě uživatel: „proč jsi nevyužil deník".
**Co jsem udělal špatně:** Bral jsem deník jako vyžádanou akci, ne jako návyk po každé opravě. Pravidlo jsem sám nastavil a vzápětí nedodržel.
**Proč to je problém:** Přesně tyhle postupy (co jsem řešil a jak) mají v deníku být — kvůli tomu ho uživatel chce: sebereflexe, kontinuita, „vědět, co jsem udělal a zhodnotit". Bez nich deník nesplní účel.
**Poučení:** Po každé netriviální opravě/řešení deník nahodit HNED, ne na vyžádání. Disciplína nestačí → doplněna hook-připomínka (hlídka) `.claude/hooks/`.
**Příznak cyklení:** Uživatel se ptá „proč jsi nevyužil deník / kde máš poznámky".

---

### CH-014 — `Set-Location` (PowerShell) tiše přesunul i Bash cwd → `tsc -b` běžel ve špatném repu (falešný zelený) · 2026-06-21
**Kontext:** Při 15.4 (D) jsem pro BE jest pustil PowerShell `Set-Location …\backend; npx jest`. Sdílený pracovní adresář se tím přepnul na backend **i pro Bash tool**. Následný `npx tsc -b` (mířený na FE) tak proběhl v backendu → backend build → `EXIT 0`. FE změny D zůstaly **neověřené**, ač jsem hlásil „tsc zelený".
**Co jsem udělal špatně:** Předpokládal jsem, že Bash a PowerShell mají oddělený cwd. Nemají — `Set-Location`/`cd` v jednom přepíše druhý. Po něm jsem nezkontroloval `pwd`.
**Jak odhaleno:** Glob/eslint hlásily „MapDrawingLayer.tsx neexistuje", ač Write i `tsc` prošly → **rozpor „build prošel, ale soubor není"** = červená vlajka. `pwd` ukázal `…/backend`.
**Poučení:** Pro cross-repo příkazy NE `Set-Location` na přepnutí — použij `npm --prefix <dir> run <script>` (cwd-agnostic) nebo PowerShell `Push-Location`/`-WorkingDirectory`. Po jakémkoli `Set-Location` ověř `pwd` před build/test. **Verifikace „exit 0" nestačí — musí běžet ve správném repu.** Rozpor mezi nástroji (tsc OK × Glob nenajde) ber jako signál cwd/prostředí, ne „záhada".
**Příznak cyklení:** „Build prošel, ale soubor nenalezen" / eslint nenajde čerstvě zapsaný soubor.

---

### CH-015 — Cyklení na vzhledu UI (stupnice mapy), protože uživatel testoval PROD a mé změny byly lokální/necommitnuté · 2026-06-21
**Kontext:** 15.3 stupnice mapy `MapScaleFrame` prošla ~5 iteracemi vzhledu (L-tvar → plný rám → pravítko po jednotkách → vyplněná lišta → průhlednost). Uživatel po každé poslal feedback ze **screenshotu produkce** (`www.projekt-ikaros.com`), jenže ten běžel na jeho **posledním FE commitu** — moje úpravy byly lokální, necommitnuté → uživatel reagoval pořád na PŘEDCHOZÍ (nebo úplně starou) verzi. „Zase špatně" často znamenalo „nevidím to, cos udělal", ne „udělals to špatně".
**Co jsem udělal špatně:** Iteroval jsem vizuál dál a dál, aniž jsem **vynutil nasazení** mezi koly. Feedback loop byl rozbitý (porovnává se proti stale stavu), takže konvergence nebyla možná, jen pseudo-cyklení. Flagoval jsem deploy-gap, ale pozdě/málo důrazně a nezastavil jsem se.
**Poučení:** **Vizuální feedback na produkci vyžaduje deploy.** Když uživatel testuje prod a mé změny jsou lokální → než si vyžádám další vizuální feedback, MUSÍ být předchozí verze nasazená (commit+push+deploy), jinak se točíme nadarmo. Buď řešit deploy mezi koly, nebo vizuální změnu nasbírat a nasadit jednorázově. Deploy-gap hlásit HNED a důrazně, ideálně blokovat další iteraci, dokud se nevyřeší.
**Příznak cyklení:** ≥3 kola „oprav vzhled X" na téže komponentě + feedback ze screenshotu produkce + mé změny stále necommitnuté.

---

### CH-016 — `git commit` po selhaném pokusu spolkl staged zbytky → smíchaný commit · 2026-06-21
**Kontext:** Push BE = 2 plánované commity (15.5 templates + 15.6 auth). 1. pokus: `git add templates; commit; git add auth; commit` — OBA commity selhaly na pre-commit hooku (prettier/prettier v jednom 15.5 spec souboru). Po opravě (`eslint --fix`) jsem znovu `git add templates; commit -F msg1; git add auth; commit -F msg2`.
**Co jsem udělal špatně:** Po selhaném commitu **staging area přežívá** — auth soubory zůstaly staged z 1. (selhaného) pokusu. Takže `commit -F msg1` (15.5 zpráva) spolkl VŠE staged = 7 templates + 3 auth = **10 souborů**; `commit -F msg2` (auth zpráva) pak hlásil „nothing to commit". Auth se sice pushnul (funkčně OK), ale pod zprávou „15.5 osnovy" — historie nepřesná.
**Proč to nefungovalo:** Mentální model „git add X; commit = commitne jen X" je špatný — `commit` bez cesty commitne CELÝ index, ne jen poslední `add`. A selhaný commit index NEvyprázdní.
**Poučení:** (1) Před každým commitem v multi-commit sekvenci ověř `git diff --cached --name-only` (co je REÁLNĚ v indexu), ne jen co jsem teď přidal. (2) Nebo commitni cíleně: `git commit <cesty> -F msg` (commitne jen dané cesty, ignoruje zbytek indexu). (3) Po selhaném commitu zvaž `git reset` před dalším pokusem. (4) „N files changed" > očekávaný počet = červená vlajka, zkontroluj PŘED push. Náprava smíchaného commitu na pushnutém `main` = rewrite + force push (riziko) → nechat, pokud je to jen kosmetika zprávy.
**Příznak:** `commit` hlásí víc souborů, než jsem naposledy `add`-oval; navazující commit „nothing to commit".

---

### CH-022 — Diagnostika „odhlašuje mě z mobilu" naslepo (TTL fallback + per-user model), ač deník měl přímý záznam · 2026-06-24
**Kontext:** Uživatel: „pracuju na PC, odhlásí mě z mobilu, nechci to, restart vázat na uživatele". Spustil jsem 2× Explore (BE+FE auth), dospěl k hypotéze „degradovaný fallback `JWT_REFRESH_TTL_DAYS ?? 3`" a doporučil **variantu B (per-user sliding session)**, dokonce eskaloval na `spec-driven-development`. Teprve při čtení kódu pro spec jsem zjistil, že B je technicky nerealizovatelná (refresh token + cookie fyzicky sídlí na klientovi, server z PC requestu na mobilní token nedosáhne; `refresh()` ani nečte DB `expiresAt`). A pak jsem (až teď) otevřel index deníku — kde byl **přímý záznam z 2026-06-21**: sliding UŽ existuje, TTL je úmyslně 3 d, kořen „odhlašuje po dnech" = **refresh v prod nejede (cross-site cookie / deploy topologie)**, ne kód/model.
**Co jsem udělal špatně:** (1) Diagnostikoval a doporučil řešení (B) **před** čtením kódu, který určuje proveditelnost. (2) Index deníku jsem přečetl až po dvou agentech a jednom doporučení — přitom tam byl hotový závěr přesně k téhle otázce. Riskoval jsem zopakování už zamítnuté cesty (měnit TTL/model místo deploye).
**Proč to je problém:** base.md má deník jako **brzdu proti cyklení** — „před opakováním přístupu projdi index". U opakujícího se tématu (auth/session) jsem ho neprošel první → málem druhý průchod stejnou slepou uličkou.
**Poučení:** (1) U auth/session/deploy témat **čti `docs/chybovy-denik/README.md` index PRVNÍ**, před Explore agenty. (2) Nedoporučuj konkrétní variantu řešení, dokud nemám přečtený kód, který rozhoduje o proveditelnosti — „doporučuju B" před ověřením = slib, který beru zpět. (3) httpOnly cookie + JWT `exp` = expirace žije na klientovi; „per-user obnova cizího zařízení ze serveru" je principiálně mimo dosah → nevymýšlet pro to spec.
**Příznak cyklení:** Vracím se k tématu, které deník už uzavřel jiným kořenem; navrhuju měnit TTL/auth model, ač předchozí závěr ukázal na deploy.

---

### CH-023 — Tvrdil jsem, že `getDrdBonus` je špatně — pravidlo jsem rekonstruoval z paměti místo z uživatelova zdroje · 2026-06-24
**Kontext:** Sběr specu pro grafický redesign deníku DrD 1.6 (16.2b). Uživatel poslal fotku „TABULKA POSTIHŮ A BONUSŮ", ale nečitelnou. Místo abych počkal na čitelný zdroj, **domyslel jsem si „standardní" DrD tabulku z paměti** (kladná strana krok po 3: 13-15→+1, 16-18→+2) a prezentoval uživateli „tabulku nesrovnalostí" s ❌ — tvrdil, že kód počítá bonusy špatně a nadhodnocuje je.
**Co jsem udělal špatně:** Z nečitelné fotky jsem vyplnil mezery domnělým standardem a na jeho základě **prohlásil funkční kód za vadný**. Skutečná varianta (kterou uživatel vzápětí napsal) jde po 2: 13-14→+1, 15-16→+2, … 21-22→+5 — což `floor((val-11)/2)` počítá přesně správně, i extrapolace pro NPC > 21.
**Proč to je problém:** Eroze důvěry v kód, který byl celou dobu v pořádku; zbytečné kolo; málem bych „opravoval" správnou funkci do nesprávné.
**Poučení:** (1) Systémová/herní pravidla **NIKDY** nerekonstruovat z paměti domnělého standardu — existují varianty. (2) Když je autoritativní zdroj (fotka/sken) nečitelný, **ptej se a počkej**; netvrď přitom nic o (ne)správnosti kódu. (3) Nepiš „❌ nesrovnalost", dokud nemám hodnoty ověřené ze zdroje, ne z paměti.
**Příznak cyklení:** Prezentuju „bug v pravidlech" odvozený z paměti; navrhuju opravit výpočet, který reálná tabulka potvrzuje jako správný.

---

### CH-025 — atribuoval jsem 48 test-fail jako 1 kořen z uťatého background outputu · 2026-06-25
**Kontext:** Po implementaci 16.2b-mapa drd16 plný vitest hlásil 48 fail / 4 soubory. Reportoval jsem uživateli „48 pre-existujících fail = No QueryClient (useDiarySkin→useWorldStatus)".
**Co jsem udělal špatně:** Charakterizoval jsem celou množinu jediným kořenem podle **uťatého** background-task outputu (`tail` viděl jen `DiaryTab.spec`; vitest přepisuje řádky `\r`, buffer se ořízl). Extrapoloval jsem root z části dat.
**Proč to nefungovalo:** Realita = 4 soubory, **3 různé kořeny**: `DiaryTab.spec` (8× No QueryClient — useDiarySkin přidán v `e4c056e6`) · `nav-guard-matrix.spec` (31× — friendly-messaging přepsal 403 text → `outcomeOf` regex `/403|odepřen|forbidden/` nesedí, + možná WMG fallback) · `OverviewTab.spec` (3×) · `RegisterModal.spec` (6×). Jen DiaryTab byl „No QueryClient".
**Poučení:** Před charakterizací množiny selhání získej ÚPLNÝ seznam padlých souborů — běh přesměruj `2>&1 | tr '\r' '\n' > log` a `grep "^ FAIL "` na souhrn; netipuj root z `tail` background bufferu (ořezává + má `\r`).
**Příznak cyklení:** tvrdím jeden společný kořen pro multi-file selhání z částečného/background outputu.

---

### CH-035 — Chrome headless screenshot ořez vypadal jako horizontální overflow · 2026-06-28
**Kontext:** `mobil-desktop` ověření JaD deníku; screenshot na `--window-size=375` ukazoval pravou stranu (Zázemí, meta, HP) oříznutou.
**Co jsem udělal špatně:** předpokládal jsem horizontální overflow a 3× re-screenshotoval + 2× upravil CSS (meta zmenšení, grid/table `min-width:0`) na základě obrázku — místo abych overflow ověřil měřením.
**Proč to nefungovalo:** Chrome headless nejde pod ~482 px šířku okna (OS/engine minimum). Renderoval viewport 482, ale `--screenshot` uložil jen 375px výřez → pravá strana „chyběla" kvůli ořezu screenshotu, ne kvůli scrollu. Injektovaná diagnostika ukázala `scrollWidth === clientWidth === 482` a prázdný seznam přetékajících prvků = žádné přetečení.
**Poučení:** responsivitu ověřuj MĚŘENÍM (`documentElement.scrollWidth` vs `clientWidth` + JS výpis prvků s `right > clientWidth`), ne okem z headless screenshotu. Pro užší než ~482 px buď DevTools-protocol device metrics, nebo full-width screenshot ≥482 (mobilní media queries jsou stejně aktivní). Tři identické screenshoty po CSS změně = signál, že problém je ve screenshotu, ne v CSS.
**Příznak cyklení:** opakované re-screenshoty „pořád to přetéká" + obrázek identický i po CSS úpravě.

---

---

## CH-042 — full build PŘED napsáním testu → tsc -b test nezkontroloval, vitest run type-check nedělá → CI fail — 2026-06-30

**Co se stalo:** Po dokončení shadowrun bestie jsem spustil full `npm run build` (tsc -b + vite + csp) a dostal exit 0. AŽ POTÉ jsem napsal `ShadowrunBestiePanel.spec.tsx`. Ten obsahoval TS chybu: `const mockPerform = vi.fn(() => …)` má inferovanou 0-arg signaturu, ale volal jsem `mockPerform(req)` → `TS2554: Expected 0 arguments, but got 1`. Ověřil jsem ho jen `vitest run` (zelený) a prohlásil hotovo.

**Proč to proklouzlo:** `vitest run` transpiluje přes esbuild **bez striktního type-checku** → runtime test běží i s TS chybou. `tsc -b` (v `npm run build`) type-check DĚLÁ — ale můj build proběhl, než test existoval. CI Docker build (`RUN npm run build`) ho pak zachytil → exit 2, deploy spadl.

**Fix:** `vi.fn((_req: unknown) => …)` (parametr v implementaci → signatura přijímá argument). Full build poté zelený (tsc -b ✓, vite ✓, csp ✓).

**Poučení:** `vitest run` ≠ type-check. **Po napsání/úpravě každého .spec znovu `npm run build`** (ne jen vitest), protože testy jsou v tsc -b projektu. Pořadí „kód → build → testy → hotovo" je špatně; správně „kód + testy → build → hotovo". Rodina [project_fe_test_precommit] (vitest bez striktního type-checku) + [project_fe_build_preexisting_errors] (tsc --noEmit/dílčí běh nestačí, nutný plný `npm run build`).

**Zhodnocení:** špatně — předčasné „hotovo + build✓" (build byl stale vůči pozdějšímu testu); chytil to až uživatel CI logem. Dobře — reprodukováno lokálně jedním plným buildem (ne hádáno z uťatého CI screenshotu), kořen jednoznačný, fix triviální.

---

### CH-046 — Četl jsem špatný `roadmap2.md` (sousední BE repo) místo našeho FE → tvrdil uživateli mylnou premisu · 2026-07-03
**Kontext:** Zadání „přidej Společnou tvorbu, uprav roadmap2". Workspace má **dvě `docs/` složky**: `Projekt-ikaros\docs` (BE, přidaný working dir) a `Projekt-ikaros-FE\docs` (náš repo). Oba obsahují `roadmap2.md`, ale **úplně jiný obsah** — BE = „Opravný plán backendu" (fáze 0–6, vše ✅); FE = „master-plan Etapy II" (fáze 14–22 vč. Fáze 16 „Český příkop" a Fáze 21 „Komunitní tvorba"). Na úvod jsem Read otevřel absolutní cestu do **BE** verze a na jejím základě uživateli tvrdil: „roadmap2 je hotový BE plán, fáze 0–6, komunitní featura tam nepatří → dej to do roadmap-fe".
**Co jsem udělal špatně:** Neověřil jsem, že čtu soubor z **našeho** repa. `git status` na úvodu ukazoval `M docs/roadmap2.md` — relativní k cwd (`Projekt-ikaros-FE`), tedy FE verze. Já sáhl absolutní cestou do sousedního BE stromu. Mylnou premisu jsem prezentoval jako fakt a postavil na ní doporučení.
**Jak odhaleno:** `phase-16/README.md` odkazuje `Roadmap: docs/roadmap2.md (Fáze 16)` — jenže verze, co jsem četl, žádnou Fázi 16 neměla. Rozpor „dokument má/nemá Fázi 16" ukázal, že čtu jiný soubor.
**Proč to je problém:** Mylná premisa → špatné doporučení (roadmap-fe místo roadmap2) → uživatel musel korigovat („jde nahoru… 16. část"). Zbytečné kolo hned na startu; eroze důvěry v můj úvodní rozbor.
**Poučení:** V multi-repo workspace s duplicitními názvy (`roadmap2.md`, `roadmap-fe.md`, `funkce/`, `chybovy-denik/` existují v OBOU stromech) ověř, že čtený soubor je z **aktivního repa** — `git status` cesty jsou relativní k cwd; absolutní cesta našeho repa obsahuje `-FE`. Než postavím tvrzení na obsahu souboru, zkontroluj původ, zvlášť u „prázdný/hotový, tam to nepatří" závěrů.
**Příznak cyklení:** Tvrdím o dokumentu opak toho, co uživatel čeká; křížový odkaz z jiného docs souboru ukazuje jiný obsah, než čtu.

---

### CH-047 — Spustil jsem browser/server pro náhled návrhu, ač to uživatel zakázal · 2026-07-03
**Kontext:** Připravoval jsem HTML návrh admin chatu (frontend-design). Abych ověřil render a udělal screenshot, sáhl jsem po Playwright MCP (`browser_navigate`), a když `file://` selhalo, začal psát a chystat se spustit lokální Node HTTP server, ať návrh naservíruju do prohlížeče.
**Co jsem udělal špatně:** Vzal jsem si za cíl „udělat screenshot sám" a automaticky sáhl po browseru + serveru, aniž bych respektoval, že to uživatel nechce. Zastavil mě („žádné otvírání browseru samostatně").
**Proč to nefungovalo / proč špatně:** Uživatel si náhledy dělá a posílá sám (viz `feedback_screenshot_collaboration`); moje iniciativa s browserem/serverem šla proti jeho workflow — navíc `file://` je v Playwright MCP blokované, takže ta cesta stejně nevedla k cíli.
**Poučení:** HTML návrhy/mockupy dodávej jako **soubor** (do `C:/tmp/`), uživatel je otevře ručně. Nespouštěj browser (Playwright/Chrome headless) ani lokální server kvůli náhledu. Render neověřuj sám — počkej na screenshot od uživatele. (Uloženo i jako memory `feedback_no_browser_launch`.)
**Příznak cyklení:** Chystám se „jen rychle" spustit browser/server pro vizuální kontrolu; uživatel reaguje „žádné otvírání browseru".

---

### CH-048 — Admin chat jsem převedl z mockupu doslova jako ohraničenou kartu, ač dohoda byla full-screen · 2026-07-03
**Kontext:** Blok A admin chatu (`/admin/chat`). HTML mockup jsem kreslil jako samostatný soubor s okrajem a page hlavičkou (velký nadpis „Chat" + shell `max-width:1440px; height:clamp(...)`). Do Reactu jsem ho převedl 1:1 → ohraničená karta uprostřed stránky.
**Co jsem udělal špatně:** Dohoda i referenční světový chat = **přes celou plochu** (full-bleed viewport). Přenesl jsem vizuál mockupu doslova (karta), místo abych trefil FORMÁT PLOCHY dle reference. Uživatel reklamoval („řekli jsme že to bude přes celou věc… a to není").
**Proč to nefungovalo:** Nová route pod `IkarosLayout` nedědí chat full-height — `.main` má default `padding-top:220px` (welcome prostor) a `.mainChat` (full-výška) se aplikuje jen na `isChat` (`/chat*`), ne na `/admin/chat`. I kdybych shell roztáhl, layout ho zmáčkl.
**Jak opraveno:** `isAdminChat = pathname.startsWith('/admin/chat')` → `mainChat` i pro admin chat; stránka bez velké hlavičky (back-link do sidebaru); shell `height:calc(100dvh − var(--header-h) − sp2)`, full width, bez radiusu.
**Poučení:** Mockup HTML v izolovaném souboru je ukázka TVARU obsahu, ne formátu plochy — full-bleed vs. karta ověř proti referenční obrazovce (světový chat) a proti tomu, jak layout obaluje route. Nová route ve full-screen módu = zkontroluj, jestli dědí layout výjimku (`mainChat`/padding), ne jen CSS komponenty.
**Příznak cyklení:** Uživatel ukazuje referenční screenshot „má to být přes celou věc / takto", moje verze je zmenšená/ohraničená karta.

---

### CH-049 — Full-bleed přes 2 konfliktní grid třídy → main spadl do úzkého tracku · 2026-07-03
**Kontext:** Dotažení full-bleed (CH-048): skrýt levý navigační sidebar `IkarosLayout`, ať admin chat zabere celou šířku. Přidal jsem `isAdminChat && s.bodyFull` (grid `1fr`) VEDLE existujícího `(isChat||isAdmin) && s.bodyNoRight` (grid `280px 1fr`) + `.bodyFull .sidebar{display:none}`.
**Co jsem udělal špatně:** Aplikoval jsem OBĚ konfliktní grid třídy zároveň na `.body`. `.bodyFull` NEpřebilo `.bodyNoRight` (v bundlu vyhrál `bodyNoRight`) → grid zůstal dvousloupcový. Se skrytým sidebarem (`display:none`) se `main` auto-placnul do PRVNÍHO tracku (280px) místo aby vyplnil plochu → chat i pravý panel neviditelné (jen ~280px levého sloupce), zbytek prázdné pozadí. Uživatel: „proč se mi tady nic nezobrazuje".
**Proč to nefungovalo:** Dvě třídy se stejnou specificitou měnící `grid-template-columns` = výsledek závisí na pořadí v bundlu (křehké, nespoléhat). `display:none` na grid item track uvolní → zbylý in-flow item (`main`) se přesune do prvního cellu.
**Jak opraveno:** Třídy VÝLUČNĚ ternárem: `isAdminChat ? s.bodyFull : (isChat||isAdmin) && s.bodyNoRight`. Admin chat dostane jen `bodyFull` (grid `1fr`) → main vyplní.
**Poučení:** Nikdy neaplikuj DVĚ třídy měnící TÉŽ vlastnost (grid-template-columns) na stejný element — override je závislý na pořadí bundlu, ne na zdrojovém pořadí. Použij výlučnou logiku. Při skrývání grid sloupce (`display:none`) ověř, kam se přesunou zbylé items (auto-placement do 1. tracku).
**Příznak cyklení:** „přes celou věc" nefunguje po full-bleed úpravě; jen úzký levý sloupec vidět, zbytek prázdný.

---
