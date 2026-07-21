# Vypravěč — 00 · Vize a rozhodnutí

Stav: podklad · 2026-07-20 · Vazby: roadmap3 fáze 25.2 (nahrazuje), 26.1–26.5 (naplňuje), 25.3/25.4/28.2/28.4 (dotýká se)
Vstupní dokument sady `docs/vypravec/` (obsah sady na konci). Zdroj: syntéza 5 návrhů + kritika (19 mezer); **kde kritika opravuje syntézu, platí kritika** — opravy jsou zde už zapracované.

---

## 1. Vize a role

Vypravěč je postava-průvodce platformy Ikaros: **jediná doručovací vrstva nad jedním registrem obsahu**, která spojuje:

- **nápovědu** — „kde jsem a co tu smím" (kontextová hlavička z route+role, nulový klik),
- **navigaci** — „vezmi mě tam" (deep-link + highlight cílového prvku),
- **tutoriál** — „proveď mě" (cesty 26.1–26.3, krok = úkol v reálném UI),
- plus vysvětlování chybových a prázdných stavů, které dnes vypadají jako rozbitá aplikace.

Zásady (závazné, detail [03-interakcni-model.md](03-interakcni-model.md)):

- **Pull-first:** sám promluví jen ve 4 definovaných momentech (post-registrace · první vstup do netriviální sekce · detekovaný zákys · milník); nikdy nepřerušuje rozdělanou práci; zavřenou radu nikdy neopakuje.
- **Nikdy nehádá:** v betě plně deterministický (žádné LLM za runtime) — scripted postava, která odpoví špatně, je horší než žádná.
- **Jeden zdroj pravdy:** postupně pohlcuje 5 dnešních nezávislých zdrojů nápovědy (dle inventury 07 §2: data-driven kusy HelpPage · AnonStartPanel „Začni tady" · in-situ „?" vč. TM nápověd · empty-state CTA · HelpPage sections) — nesmí vzniknout šestý zdroj driftu. Řetěz: kód → `docs/funkce/` → registr → doručovací plochy.
- **Retenční cíl:** první úspěch každé persony do minut, sociální akce do 24 h, důvod k návratu.

Feature = **Vypravěč**; mluví v něm **tři postavy jedné tajné organizace tvůrců** (model potvrzen 2026-07-21): **Ishida** — šéf (platforma, Putyka/Camp/voice; „tohle místo jsem stvořil") · **Joe** — agentka v terénu (vše uvnitř světů vč. chatu světa; předání při prvním vstupu do světa) · **Měďák** — výcvikář POUZE pro taktickou mapu (hloubkový průvodce TM, v2). Nikdo z nich nikdy neřekne „jsem tvůj PJ"; Joe a Měďák neradí k příběhu — radí k nástrojům, hru vede PJ. Persona, hlasy a grafika: [02-persona-a-grafika.md](02-persona-a-grafika.md) + prompty [02a-prompty-grafika.md](02a-prompty-grafika.md).

---

## 2. Vazba na roadmap3

| Fáze | Vztah | Jak ji Vypravěč plní |
|---|---|---|
| **25.2** Post-registrační navedení | **nahrazuje** | Volba persony po registraci + rozcestníky + empty-state CTA renderované z registru; AnonStartPanel „Začni tady" pohlcen (kroky konečně klikací). |
| **26.1** PJ Start | **naplňuje** (MVP‑A, plně) | Plná cesta 5 kroků (svět → rozhlédnutí → NPC → brána+pozvánka → první zpráva), cíl ~15 min, mezi-aha ≤5 min, dokončenost ~70 %. |
| **26.2** Cesta hráče | **naplňuje** (stretch S1 lehký checklist; plně v2) | Najdi stůl → ozvi se → postava; fallback prázdné bety = Putyka/Camp; krok 3 = **čekací stav**, ne odškrtávací krok (oprava kritiky — závisí na akci PJ). |
| **26.3** Cesta worldbuildera | **naplňuje** (v2) | MVP jen rozcestník topiků; plná cesta (wiki + [[wikilink]] → Pavučina → vitrína) v2. |
| **26.4** Kontextové tipy & checklist | **naplňuje** (MVP‑A) | Persona dialog (jediné auto-otevření vůbec) + persistovaná volba → odpověď na otevřenou otázku 26.4 zní **ANO, personu ukládat** (`UserOnboardingState.persona`). |
| **26.5** Krátké návody | **naplňuje** (v2) | 10 návodů jako topiky typu NÁVOD (3–7 kroků, deep-link + done-signál) v registru — ne statický text v HelpPage. |
| 25.3 Beta rámec | dotýká se | Changelog „Co je nového" (stretch S3) = kanál rytmu; beta banner zůstává samostatná featura. |
| 25.4 Ukázkové světy | dotýká se | Uvítací svět = cíl kroku „Najdi stůl" cesty hráče (rozhodnutí 4). ⚠ Číselný drift: 25.3 odkazuje changelog na „25.4", ale 25.4 = ukázkové světy — **opravit v roadmapě**, nestavět na tom. |
| 28.2 Metriky bety | dotýká se | Telemetrická kolekce dodává aktivační funnel per persona; append-only retenční sběr `{userId, isoWeek}` zůstává vlastní kód 28.2. |
| 28.4 Rytmus komunikace | dotýká se | `changelog.ts` + badge na kotvě = doručení changelogu testerům. |

---

## 3. Otevřená rozhodnutí pro vlastníka

Kompletní seznam (syntéza §10, **aktualizovaný o dopady kritiky** — změny označeny ✎, nová rozhodnutí ➕). U každého doporučení + proč.

| # | Rozhodnutí | Doporučení | Proč |
|---|---|---|---|
| 1 | **Persona lock** | ✅ **schváleno**: 2026-07-20 Ishida; **2026-07-21 rozšířeno na TŘI postavy — Ishida (platforma + Putyka/Camp) · Joe (světy vč. chatu světa) · Měďák (jen TM, v2)**; repliky „zatím", ladění jen úpravou 02 §2.1 | Blokuje všechny texty; řeší kolizi „Vypravěč = PJ"; TM dostane tematického výcvikáře (úsečné rozkazy = ideální formát kroků). |
| 2 | **Grafika** (3 sady: Ishida 10 · Joe 10 · Měďák 4 assety) | Vlastník generuje z [02a-prompty-grafika.md](02a-prompty-grafika.md); pořadí masteři → kontrola (silueta/rozpoznatelnost) → busty; do dodání placeholder silueta | Grafika nesmí blokovat architekturu; Měďák bez siluety (TM nemá FAB). |
| 3 | **26.2 v betě:** stretch lehký checklist vs. jen rozcestník | Stretch S1 — celý blok, když zbyde čas; ✎ krok 3 „Tvoje postava" jako čekací stav + „hotovo z tvé strany" po kroku 2, timeout 7 dní → tip na jiný svět | Hráči testerů-PJ dorazí během vlny 1 = nejcennější persona; progress 2/3 navždy u mrtvého světa demotivuje. |
| 4 | **Uvítací/ukázkový svět (25.4)** s publicShowcase jako cíl „Najdi stůl" | Ano, 1 oficiální svět spravovaný vlastníkem; do té doby fallback Putyka/Camp | Sociální akce nesmí čekat na schválení PJ; Vypravěč nesmí slibovat, co katalog nedá. |
| 5 | **Push v betě:** zákaz nových kategorií/připomínek; Ishidův hlas v textech existujících notifikací | Potvrdit zákaz; hlas ano, ale až stretch S4 | Špatně načasovaný personifikovaný push poškodí důvěru v postavu; textová úprava = nulové riziko. |
| 6 | **Deep-link kontrakt `?sekce=X&topik=Y`** jako veřejný | ✅ **schváleno 2026-07-20** (formát `?sekce=X&topik=Y`, česky, malá písmena); v MVP‑A linkovat jen holé `/ikaros/napoveda`, parametrické odkazy doplnit do registru hromadně s MVP‑B implementací | Kontrakt se po zveřejnění nemění; schváleno včas → odkazy se nebudou psát dvakrát. |
| 7 | **Telemetrie:** kolekce s TTL 90 dní + věta do /soukromi | ✎ Ano, s přesnou formulací: **userId SE sbírá** (funnel per-user, osobní follow-up odpadlých), **entity ID světů/stránek NE**, query truncate 200 znaků; kolekce + UserOnboardingState **zapojit do self-delete cleanup** (smazat/anonymizovat); /soukromi popíše: co, TTL, vazba na účet, výmaz při smazání účtu | Bez telemetrie se beta (28.2) nedá vyhodnotit; původní „žádná entity ID" byla zavádějící — osobní identifikátor tam je, GDPR text musí být poctivý. |
| 8 | **„Rychlá volba" ve wizardu tvorby světa** vs. textové vedení | MVP jen textové vedení přes minimální pole + varování před pastmi (TÚ/magie jen při založení); quick-mode v2 dle telemetrie | UI zásah do wizardu těsně před betou = regresní riziko. |
| 9 | **Skill rename `napoveda` → `vypravec-obsah`** + úprava base.md | Po betě; teď jen rozšířit obsah skillu | Méně churn v pravidlech před vlnou 1. |
| 10 | **Zkratka Shift+V** | Ano, po ověření kolizí (f/e/Ctrl+K obsazené v PageVieweru); ✎ + mobilní vstup = položka „Vypravěč" v existujícím mobilním menu/draweru | Shift+V na mobilu neexistuje — bez položky v menu je mobil na kolizních plochách (TM, chat) v MVP‑A bez vstupu do Vypravěče. |
| 11 | **Definice „aha akce":** hráč = první zpráva ∨ žádost o vstup; PJ = svět + první NPC; worldbuilder = svět + první vlastní stránka | Schválit takto | Ukotvuje funnel; měřitelné z existujících eventů/probe. |
| 12 | **Anonym:** progres jen localStorage, delta merge při registraci; ztráta při smazání storage akceptovaná | Ano; ✎ merge polí = **set-union** (dismissed/seenRoutes jen rostou), ne LWW | Plynulý přechod anonym→účet za minimální cenu; LWW na polích by porušil „zavřené se neopakuje" (scénář race 23.5). Povinný persistence test A→B→A. |
| 13 | ➕ **Rollout pro existující účty** (22 migrovaných Matrix účtů, vlastník, admini) | Backfill při prvním loadu bez UserOnboardingState: účet starší než datum nasazení → seed `seenRoutes` z aktuálních rout, milníky odvozené probem označit done **bez oslavy** (oslavu spouští jen event), místo auto-open persony jednorázová bublina „Chceš, abych tě provedl?" | Moment „post-registrace" u nich nikdy nenastane; bez backfillu záplava „Poprvé tady?" na místech, která znají roky, a retroaktivní oslava starého světa. |
| 14 | ➕ **Souběh a přepínání person/cest** | MVP: **max 1 aktivní cesta**, ostatní pauznuté; přepnutí kdykoli z menu Cesty; persona = výhybka první cesty, **ne trvalý zámek** | Tester bývá PJ i hráč zároveň (PJ testeři vlny 1 si vzájemně hrají); singulární `activeJourney` musí mít definované chování. |

Rozhodnutí 1, 2 a 6 blokují obsah/odkazy → schválit v týdnu 1; zbytek do startu MVP‑B.

---

## 4. Fázování

Opraveno dle kritiky („plán MVP‑A nesedí sám se sebou"): D1 rozpočítán na D1–D2, schválení vlastníka vyjmuto z kritické cesty, pořadí řezu jmenováno předem. Proces dle pravidel projektu: `frontend-design` návrh před UI panelem → `spec-driven-development` před kódem → statický `mobil-desktop` + živé screenshoty od vlastníka.

### 4.1 MVP‑A — musí být před vlnou 1 (~11 pracovních dní)

Obsah (AI drafty, voice pass) běží **paralelní stopou** na placeholderech; dev čas = engine + review. Schvalování vlastníkem (rozhodnutí 1, 2, 6) běží paralelně, **neblokuje** dev dny.

| Den | Práce |
|---|---|
| D1–D2 | Typovaný route registr extrahovaný z router.tsx + parity test router↔registr; typy registru (prerekvizita §7.5 syntézy, reálně 1–2 dny). |
| D3–D4 | VypravecRoot: FAB + **inventura fixed prvků pravého dolního rohu** (WorldVoiceHost right:16/bottom:16, PWA bannery, DiceRollOverlay) + kolizní politika (bottom-stack `--fab-shift`, voice `--voice-host-h` — závazně 03 §2) — oprava kritiky; panel/bottom-sheet, stavy, a11y základ, theming tokeny + placeholder silueta. |
| D5 | Kontextový engine + RouteHeaders (~25) + kontextové karty. |
| D6 | BE `user-onboarding` + FE store + localStorage + anon merge; **pole set-union, skaláry LWW**; flush přes sendBeacon/visibilitychange, nepotvrzené delty re-POST při dalším loadu; **backfill existujících účtů** (rozhodnutí 13). |
| D7–D8 | Journey engine: DoneConditions s **`contextWorldId`** (cesta scopovaná na svět; lišta v jiném světě = badge „cesta pokračuje ve světě X"), eventy s payloadem `{worldId?, channelKind?}`, accessMode probem z WorldContext; probe rekonsiliace, lišta kroku (na kolizní ploše **minimalizovaný proužek**, ne zmizení), pauza/obnova + jednoduchý highlight. |
| D9 | Cesta 26.1 + persona dialog 26.4 + rozcestníky hráč/worldbuilder + ~8 FE eventů + ~20 kotev `data-vypravec`. |
| D10 | Chybová mapa (interceptor 2× chyba → topik) s deklarovaným vztahem k friendly-messaging (hláška = 1. linie, topik = „proč a co dál" = 2. linie) + 3 klíčové empty-states. |
| D11 | Telemetrie (endpoint + kolekce TTL + skript) + CI testy (mrtvé odkazy, unikátní ID) + finální review Tier 0 + smoke test celé cesty + buffer. |

**Pořadí řezu při skluzu (jmenováno předem, řežou se celé bloky — fb_no_debt):** S4 → S3 → S2 → S1 → přesun MVP‑B položek hlouběji do bety. Z jádra MVP‑A se neřeže.

### 4.2 MVP‑B — první dny bety (~4–5 dní, additivní, neblokuje vlnu 1)

Wrap 4 in-situ „?" helpů + mapping test audience (PomocnýPJ nesmí tiše ztratit/získat obsah) · implementace deep-link kontraktu `?sekce&topik` + hromadné doplnění parametrických odkazů do registru · zbytek CI validací (audience sanity, kotvy guard, coverage soft report) · zbylé empty-states (do 5) · theming/mobil doladění dle screenshotů · migrace vlny 1–2 (data-driven zdroje HelpPage, AnonStartPanel). Do MVP‑B je „?" **přiznaný legacy vstup** (parita obsahu až wrapem) — oprava nekonzistence §3.4 vs. §9 syntézy.

### 4.3 Stretch bloky (celé, v pořadí)

**S1** cesta 26.2 lehký checklist s fallbackem Putyka/Camp (~1 d) → **S2** MiniSearch fulltext + build index (~1 d) → **S3** changelog „Co je nového" (~0,5 d) → **S4** Ishidův hlas v textech existujících push (~0,5 d).

### 4.4 v2 (po vlně 1, ~2–3 týdny rozložené)

Plné cesty 26.2 + 26.3 · **hloubkový průvodce taktické mapy s Měďákem** (cesta scéna→tokeny→mlha/LoS→iniciativa→orchestrace + série návodů; doručení přes „?" panel a proužek — TM je kolizní plocha) · 10 návodů 26.5 + slovníček · tenké topiky všech rout · Kronika UI + tři fáze vztahu + readiness odemykání · rozšířené milníky · push kategorie `vypravec` (rozhodnutí vlastníka) · admin dashboard trychtýře v /admin Přehledu · WS `onboarding:updated` · coverage hard-fail + allowlist · empty-states plošně · highlight polish · zbylé pózy grafiky · start rozřezu HelpPage (nejdřív data-driven sekce).

### 4.5 v3 (růst)

LlmBrain za flagem (RAG nad registrem, Haiku, cache, rate-limit, strop) · dokončení rozřezu HelpPage po kapitolách · per-system obsah (13 systémů kostek) · ukázkové světy (25.4) v cestě hráče · staleness přes hash sekce · notifikace „od Ishidy" s reálnou hodnotou · per-motiv kostýmy · i18n (texty jsou data od dne 1).

---

## 5. Rizika (zhuštěně)

| Riziko | Mitigace |
|---|---|
| Šestý zdroj pravdy (hardcode texty ve spěchu) | „Nové help texty jen do registru" od dne 1 (PR konvence); skilly funkce/napoveda vynucují topiky; CI mrtvé odkazy. |
| Duplicitní chybové texty vs. friendly-messaging | Deklarovaný dvouvrstvý vztah (hláška 1. linie / topik 2. linie); postupně `shortMessage` z téhož topiku; CI kontrola protichůdného znění. |
| Rozsah přeteče | Split MVP‑A/MVP‑B/stretch + jmenované pořadí řezu (§4.1); celé bloky, žádné půlky. |
| Křehkost kotev/deep-linků při refaktorech | Kotvy = explicitní kontrakt + CI guard; typovaný route registr + parity test; slovní fallbacky; kontrakt zmrazen po schválení. |
| Checklist lže (ušlý event, multi-device, cizí svět) | Probe = zdroj pravdy, event jen trigger oslavy; `contextWorldId` scope; set-union merge polí; sendBeacon flush. |
| Kolize FAB v pravém dolním rohu (voice, PWA bannery) | Inventura fixed prvků + kolizní politika v D3–D4; default při neznámé kolizi = skrýt. |
| Prázdná beta pro hráče | Fallback Putyka/Camp; uvítací svět (rozhodnutí 4); nikdy neslibovat, co katalog nedá. |
| Důvěra v postavu (špatná odpověď > žádná) | Deterministický brain; obsah jen z docs/funkce; voice pass + review; poctivý fallback; LLM až v3 za flagem. |
| LCP regres | Eager < 10 kB gz, vše lazy, GET po idle; brána plny-auditu. |
| Vizuální rozbití napříč 12 motivy / 8 skiny | Jen tokeny + `rgb(var/α)`, silueta currentColor, nikdy `:root`, mimo skinované plochy. |
| Existující účty zaplavené onboardingem | Backfill (rozhodnutí 13). |
| Malé kohorty = šum | Kvalitativní follow-up každého odpadlého; design cest neměnit uprostřed vlny. |
| Obsahová směna na 1 vývojáři | Skill-vynucený krok při změně funkčnosti; 30min týdenní rituál; gaps/stale skripty. |
| Persona kýč / mate ne-geeky | Flavor limit 1/8, humor nikdy v chybách, voice pass proti few-shotům. |

---

## Obsah sady

| Soubor | Obsah |
|---|---|
| 00-vize-a-rozhodnuti.md | (tento dokument) vize, vazba na roadmap3, rozhodnutí vlastníka, fázování, rizika |
| [01-mapa-prostoru.md](01-mapa-prostoru.md) | mapa prostoru platformy: routy + tiery, top-10 zákysů, chybové kódy → topiky, kolizní plochy, 18 oblastí (zadání obsahové výroby) |
| [02-persona-a-grafika.md](02-persona-a-grafika.md) | tři postavy (Ishida · Joe · Měďák), terminologické pravidlo, style-guide tří hlasů, few-shot repliky vč. předávacích, grafický brief; prompty v [02a-prompty-grafika.md](02a-prompty-grafika.md) |
| [03-interakcni-model.md](03-interakcni-model.md) | kotva/povrchy, inventura pravého dolního rohu + kolizní politika (`--fab-shift`), stavy, push/pull ústava, mobil/desktop, a11y |
| [04-architektura.md](04-architektura.md) | registr, kontextový a checklist engine, persistence, vyhledávání, theming, výkon, brain šev; telemetrie §5.6 |
| [05-retence-a-cesty.md](05-retence-a-cesty.md) | persona volba, cesty 26.1/26.2/26.3, milníky, graduace, push, anti-dark-patterns; metriky/vyhodnocení §9 |
| [06-obsah-a-udrzba.md](06-obsah-a-udrzba.md) | řetěz pravdy, výrobní linka, šablony jednotek, priority Tier 0–2, CI validace, skilly |
| [07-migrace-napovedy.md](07-migrace-napovedy.md) | migrace 5 existujících zdrojů nápovědy, deep-link kontrakt, HelpPage plán |
| [08-skill-vypravec.md](08-skill-vypravec.md) | přestavba skill vrstvy (rozšíření `funkce`, nový text `napoveda`, týdenní směna, rename po betě) |

Pozn.: samostatný soubor „metriky/telemetrie" neexistuje — telemetrie je ve 04 §5.6, funnel a vyhodnocení v 05 §9.
