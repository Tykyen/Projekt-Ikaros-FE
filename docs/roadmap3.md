# Roadmap 3 — Projekt Ikaros · Etapa III

**Úplná beta · důvěra · aktivace · český trh**

**Stav:** návrh k diskuzi (nic z Etapy III nezačato)
**Vznik:** 2026-07-19 — syntéza z: (a) ověření všech dluhů `docs/dluhy.md` proti HEAD obou rep (1 agent = 1 dluh), (b) inventury stavu (roadmap-fe, roadmap2 karta po kartě, `docs/funkce/`, ops/CI/testy, git), (c) auditu „cesty testera" v kódu, (d) webové rešerše beta praktik + historie platforem (Foundry, Roll20, World Anvil, LegendKeeper, Owlbear, Kanka), (e) *Konkurenční a realizační rešerše* (PDF, 2026-07-19). Celkem 28 ověřovacích agentů.
**Navazuje na:** `roadmap-fe.md` (Etapa I, fáze 0–13 — uzavřena) · `roadmap2.md` (Etapa II, fáze 14–22 — implementačně hotová; otevřené zbytky překlopeny sem)
**Repo:** FE `Projekt-ikaros-FE` · BE `Projekt-ikaros`

> **Jak číst tuto roadmapu.** Stejný systém jako roadmap2: karty s checkboxy `[ ]`/`[x]`, **pořadí = priorita provedení, žádné termíny**. Každá karta se odškrtne, až je hotová a ověřená. Workflow beze změny: **spec → souhlas → impl. plán → souhlas → kód** (`spec-driven-development`), u UI `frontend-design` + `mobil-desktop`.
>
> **Co je cíl Etapy III.** Na konci je **úplná, provozně certifikovaná beta**: platforma, na kterou lze pozvat cizí lidi, která neztratí data, sama hlásí problémy, umí přijmout zpětnou vazbu, nováčka aktivně vede — a je připravená na veřejné spuštění tak, že po dodání právních vstupů se jen doškrtne fáze 31. Konkurujeme české scéně (Discord+Roll20/Foundry+Docs balíky, Dračí Hlídka digitál, Digi Jeskyně) a stavíme architektonické základy, na které půjde později navázat i směrem ven.
>
> **Hlavní zjištění ověřování:** kód je z ~90 % připravený — beta vázne na provozu (zálohy, monitoring, nasazovací fronta), na testerské výbavě (hlášení chyb, navedení nováčka) a na aktivaci/důvěře (rešerše: „hlavní dluh není v počtu funkcí, ale v aktivaci, důvěře, distribuci a provozní kapacitě").

---

## Mimo scope Etapy III (vědomě)

1. **Jednotlivé herní systémy a licence** — čeká na právníka/držitele práv; bude řešit **budoucí roadmapa (Etapa IV)**. Zde jen bezpečné *ohraničení* veřejných slibů (karta 25.8) — to není řešení systémů, ale ochrana před nekrytým slibem.
2. **Právní identita organizace** — název, spolek, údaje správce. Externí brána; fáze 31 ji jen předpřipravuje (⛔ karty čekají na vstup).
3. **Plošná zahraniční lokalizace (i18n/EN)** — čeština je jádro. Stavíme jen tak, abychom si nezavřeli dveře (karta 30.4), překlad se teď nedělá.
4. **AI funkce, billing/monetizace ostrá, školy/mládež/LARP segmenty** — dle rešerše odložit; nemají vyšší prioritu než důvěra, aktivace a provoz.
5. **Bus factor** — přijaté riziko; zmírňujeme jen lacino (zálohy, runbooky, admin role), nový programátor není v plánu Etapy III.

---

## Přehled fází Etapy III

| # | Název | Podstata | Stav |
|---|-------|----------|------|
| 23 | Provozní pojistky | zálohy · monitoring · maily · release brány | ⬜ |
| 24 | Nasazovací fronta & úklid | deploye · živá ověření · seedy · doc úklid | ⬜ |
| 25 | Testerská výbava & první dojem | hlášení chyb · beta rámec · ukázkové světy · ohraničení slibů | ⬜ |
| 26 | Segmentový onboarding 👑 | PJ Start · Hráč · Worldbuilder · návody | ⬜ |
| 27 | Zlaté cesty & certifikace jádra | 5 zlatých cest e2e · mobil · scope registr · SLO · pentest | ⬜ |
| 28 | Beta provoz (kohorty A→C) | proces, metriky, admin role, komunikace | ⬜ |
| 29 | Úklid dluhů | překlopený obsah `dluhy.md` → karty | ⬜ |
| 30 | Škálovací brána & základy | škála · import · i18n-ready · infra hardening | ⬜ |
| 31 | Brána veřejného launche | ⛔ právní balík · SEO · go/no-go | ⬜ |

> Legenda: ✅ Hotovo · 🟡 Rozpracováno · ⬜ Čeká · 👑 vlajková priorita · ⛔ blokováno externě (právník/držitelé práv/uživatel-rozhodnutí)
>
> **Pořadí fází = doporučené pořadí provedení.** Fáze 23–25 jsou vstupní podmínka kohorty A; fáze 26–27 smí dobíhat souběžně s kohortou A; fáze 28 běží průběžně od otevření; 29–30 dle triggerů u karet; 31 po dodání externích vstupů.

**Průřezové principy Etapy III** (doplňují principy roadmap2):
1. **Kapacita je součást produktu** — sólo dev: support nesmí přesáhnout ~35 % času dva týdny po sobě, jinak se nábor zastaví (červené signály, karta 28.1).
2. **Certifikovat, ne přidávat** — žádná nová velká doména během Etapy III; scope registr A/B/C (karta 27.3). Rešerše: „další kvalitativní skok nevznikne vyšší rychlostí, ale menším veřejným slibem, certifikací a měřením."
3. **Ztráta dat a rozbité core = jediné nepřijatelné kategorie bety.** Vše ostatní smí být v betě nedokonalé, pokud je to označené.
4. **Prázdno je horší než málo** — nulové indikátory a prázdné katalogy skrýt nebo naplnit (25.5, 25.6, 24.4).
5. **Důvěra = funkce**: zálohy, export, moderace, transparentní changelog.

---

## Fáze 23 — Provozní pojistky
**Jediná kategorie, kde beta dnes reálně hoří.** Vše jsou hodiny až dny práce; bez 23.1–23.4 nelze pozvat nikoho cizího.

### - [x] 23.1 Zálohy s off-site cílem + test obnovy — [dopad vysoký · náklad malý] 👑provoz *(překlopeno z 14.4 + dluh D-DB-BACKUP-CRON)* ✅ 2026-07-19
**Cíl:** Denní automatická záloha DB mimo server + jedna ověřená obnova + rotace.
**✅ Implementováno a ověřeno (spec [spec-23.1](arch/phase-23/spec-23.1.md)):** `db-backup.yml` — denní cron 02:00 UTC + rclone upload do **Backblaze B2** (bucket `projekt-ikaros-backups`, EU, SSE, lifecycle last-version; klíče jen v GitHub secrets, na serveru nic) · retence 7 denních (`daily/`) + 4 týdenní (`weekly/`, nedělní server-side kopie) + 5 lokálních · **restore drill = nový `db-restore-drill.yml`** (měsíčně + ručně): obnova do čistého mongo:7 v runneru + verifikace počtů + hlídání stáří zálohy < 48 h · selhání i úspěch → Discord (`DISCORD_ALERT_WEBHOOK`). **První ostrý běh + drill 2026-07-19 zelené:** 110 kolekcí / 43 127 dokumentů, download ~10 s, restore ~7 s; postup obnovy s časy v runbooku §6. Zbývá jen pasivně: ráno po prvním nočním cronu mrknout do Actions, že běžel sám.
**Pozn.:** mongodump kryje jen DB — `uploads-data` volume a Meili ne; média primárně na Cloudinary (off-site z podstaty), Meili se reindexuje. Vědomé, jen to vědět.

### - [x] 23.2 Externí uptime monitoring — [dopad vysoký · náklad nulový] ✅ 2026-07-19
**Cíl:** Nezávislá služba hlídá FE doménu + `GET /api/health` a píše do Discordu.
**Proč:** Vnitřní monitoring (Discord alerty, heartbeat, 5xx, brute-force, disk, RSS) je nadprůměrný, ale neumí ohlásit vlastní smrt; heartbeat kryje s latencí až 24 h.
**✅ Hotovo:** **HetrixTools free** (ne UptimeRobot — free tier má Discord/webhooky za paywallem + ToS od 10/2024 zakazuje komerční užití): 2 monitory à 1 min ze 4 EU lokací (Amsterdam/London/Frankfurt/Warsaw, trigger 50 %+1) — `Ikaros API health` = `/api/health` s keyword checkem `"status":"ok"` (chytá i `degraded`, který vrací HTTP 200) · `Ikaros FE` = root. Notifikace → Discord webhook „Uptime" (kanál ops alertů), test doručen. Detaily v runbooku §9 (BE repo).

### - [x] 23.3 E-maily do produkce — ověřit a dotáhnout — [dopad vysoký · náklad malý] *(překlopeno z 14.8, část SMTP; dluh PC-02)*
**Cíl:** Reset hesla a ověřovací maily reálně chodí.
**Stav:** kód kompletní (SMTP provider, Mongo outbox, denní cap 400, priorita reset hesla, retry/backoff). Nasazení vars možná už proběhlo — **ověřit prakticky**.
**Kroky:** ① test „Zapomenuté heslo" na reálný mail · ② pokud nechodí: GitHub env production vars `SMTP_HOST/PORT/USER/MAIL_FROM` + secret `SMTP_PASS`, deploy, retest · ③ ověřit `FRONTEND_URL` (jinak odkazy do localhost) · ④ `MAIL_FROM` vlastní doména ⇒ SPF/DKIM/DMARC DNS, jinak spam.

### - [x] 23.4 Error tracking reálně zapnutý — [dopad vysoký · náklad malý] ✅ 2026-07-19
**Cíl:** Pády testerů vidíme, i když je nenahlásí (většina nenahlásí — mlčky odejdou).
**✅ Hotovo:** Sentry SaaS free (org EU region, projekty `ikaros-fe`+`ikaros-be`; FE var `VITE_SENTRY_DSN`, BE secret `SENTRY_DSN`). Cestou 3 miny (spec 23.4): ① LH-13 → `beforeSend` scrubber FE+BE (jinak by JWT/hesla egresovala) · ② CSP `connect-src` → `${SENTRY_HOST}` odvozený v deployi z DSN · ③ adblock blokuje `*.ingest.sentry.io` → **tunnel** `POST /api/monitoring/tunnel` (BE relay pinovaný na vlastní org). Ověřeno živě: testovací event v dashboardu přes tunnel i se zapnutým adblockem; postupy v runbooku §10 (BE repo).

### - [x] 23.5 Refresh token v produkci (sliding session) — [dopad vysoký · náklad malý] ✅ 2026-07-19
**Cíl:** Aktivní tester není nikdy odhlášen; logout až po 60 dnech nečinnosti zařízení.
**Stav:** kořen nalezen a opraven 2026-07-19 (kód hotový, čeká deploy + živé ověření). Cross-site hypotéza z inventury byla vyvrácená už 2026-06-24 (same-origin přes Caddy, cookie first-party, TTL 60 d aktivní — GitHub vars nenastavené ⇒ compose defaulty `1d`/`60`). Skutečný kořen = race souběžných refreshů: FE spouštěl vlastní `POST /auth/refresh` pro každý 401 → druhý z paralelních refreshů trefil reuse-detection → revoke celé rodiny tokenů → odhlášení po ~1 dni (první expirace access tokenu).
**Oprava (spec-23.5):** ① FE single-flight (souběžné 401 sdílí jeden refresh promise, `client.ts`) · ② BE grace okno 60 s (reuse čerstvě zrotovaného jti vrátí týž nástupnický pár místo revoke rodiny, `auth.service.ts`). Testy: jest 80/80, vitest single-flight 3/3.
**Hlídka:** zaškrtnuto s podmínkou — pokud do 2 dní od nasazení dojde k samovolnému odhlášení, bod se znovu otevře (příznak: Network ≥2 paralelní `/auth/refresh`, druhý 401 `REFRESH_TOKEN_ABUSED`; BE log „rodina tokenů revokována"). Nutný deploy OBOU polovin (BE grace + FE single-flight).

### - [ ] 23.6 Drobný infra hardening — [dopad střední · náklad malý]
**Kroky:** ① FE `docker-compose.yml`: log rotace (x-logging anchor z BE compose, ~8 řádků; nginx access log dnes roste bez stropu) · ② BE port 3001 bind na 127.0.0.1 (dnes 0.0.0.0 → obchází Caddy TLS; runbook §1) + stejný fix FE port 8081 · ③ ufw ověřit (§5). Mongo/Redis auth (§2–3) až karta 30.5.
**Stav (spec-23.6, 2026-07-19):** ① log rotace hotová v kódu (FE compose), čeká FE deploy · ②+③ **uzavřeny zjištěním**: server je za NAT poskytovatele (žádný Caddy na hostu, TLS ukončuje edge leafhost na jiném stroji) → loopback bind ZAKÁZÁN (rozbil by prod, v compose varovný komentář); porty 3001/8080/27017 zvenku stejně filtrované; ufw inactive a nechává se tak (docker ji obchází). Nové nálezy (interní síť 10.10.10.0/24 + starý matrix-mongodb na 0.0.0.0:27017) → zdokumentováno v runbooku §1, řešit s kartou 30.5. Vedlejší produkt: workflow `server-check.yml` (read-only diagnostika serveru).

### - [ ] 23.7 Release brány: e2e+security do CI, cross-repo scannery, „deploy jen po zelené" — [dopad vysoký · náklad střední]
**Cíl:** Před pouštěním cizích lidí hlídat regrese automaticky; release má evidenci.
**Stav:** **BE e2e + security attack suite (229 testů vč. 7 útočných: IDOR/session/injection/XSS/anti-abuse/GDPR/herní integrita) neběží v žádné CI.** Cross-repo kontraktní scannery + anti-regression guard jsou za vypnutou `ENABLE_CROSSREPO_AUDIT`. Deploy je `workflow_dispatch` bez vazby na CI.
**Kroky:** ① CI job BE e2e (mongo service / mongodb-memory-server, maxWorkers 1) · ② zapnout `ENABLE_CROSSREPO_AUDIT` (+ dořešit ~21 falešných pozitiv route scanneru) · ③ deploy krok ověří zelenou CI pro HEAD (gh api) · ④ release evidence: deploy zapíše commit sha + čas (stačí GitHub run log + novinka-changelog z 25.4).
**Otevřené otázky:** rollback na image tag per sha teď, nebo až karta 30.6? (dnes: git revert + redeploy ~10 min — pro betu snesitelné)

---

## Fáze 24 — Nasazovací fronta & úklid
**Kód je pushnutý (oba main == origin), ale ~20 hotových věcí čeká na deploy/restart/živé ověření.** Bez odbavení uvidí testeři FE↔BE drift a nahlásí náš nasazovací dluh jako bugy.

### - [ ] 24.1 Deploy obou částí nad HEAD + ověření zvenku — [dopad vysoký · náklad malý]
⚠️ **Pořadí: FE deploy PŘED BE** (BE už nemá legacy route `GET /characters/directory` — starý FE bundle by dostal 404 na adresář postav). Ověřit zvenku dle zavedeného postupu (grep chunků / Last-Modified — viz `project_fe_deploy_stale_bundle`).

### - [ ] 24.2 Ops kroky vázané na deploy — [dopad střední · náklad malý]
env `ANON_SESSION_TTL=14d` (15.8) · migrace `npm run migrate:discussion-reports` (20.1–20.3) · **CSP enforce** + smoke neprozkoumaných stránek (galerie/postavy/bestiář/kalendář/admin/motivy) · ověřit RAM prerender sidecaru (Chromium ~150–300 MB).

### - [ ] 24.3 Živá ověření (checklist s uživatelem) — [dopad vysoký · náklad malý]
Jeden „ověřovací večer" na živém webu: nábory 19.3b filtr · Pavučina 11.5 · vitrína 22.4 anon flow · klon scény 22.5 · AKJ owner-edit (D-067) · export světa — reálné stažení ZIP (media/ + chat) · UVTT import `.dd2vtt` · LoS výkon velké scény · Stavitel 21.3 · dotyk mapy na telefonu 17.4 · web push na reálném telefonu (iPhone = PWA na plochu) · stream overlay v OBS · voice (pokud dosud živě neověřen) · komunitní bestiář 16.2b-2. Co padne, opravit před kohortou A.

### - [ ] 24.4 Obsahové seedy — [dopad střední · náklad malý]
Čekají jen na dry-run schválení / spuštění workflow: hádanky 47 · herbář 56 (ostrý běh) · jmenné sady ~76 + přízviska · ceníky 7 ér (Morvol, Přítomnost, WW1, WW2, Divoký západ, Blízká budoucnost, Galaxie). Prázdné knihovny = „opuštěný projekt" dojem; plné = testeři mají co testovat.

### - [ ] 24.5 Dokumentační úklid — [dopad nízký · náklad malý]
① `roadmap-fe.md`: doškrtnout stale checkboxy (9.2, 10.3→odkaz 21.3, 13.3, 5.7 procesní řádek), aktualizovat úvodní tabulku fází. ② `roadmap2.md`: ověřit 3 podezřelé checkboxy [x] bez záznamu implementace (16.3 migrace, 17.10 docking — dle paměti impl. nezačala, duplicitní „17.1" živá mapa); doškrtnout master 21.3; opravit odkaz 16.4→22.3. ③ `docs/funkce/`: vnitřní drifty (kap. 12 vs 04 herbář; kap. 04 push novinek; kap. 14 atlas role). ④ chybový deník: srovnat číslování (hlavička vs index, duplicitní CH-069/077). ⑤ smazat stale pointer shop-purchase (FA cíl je v kódu hotový vč. race testu). ⑥ BE repo: `git worktree remove` 10 mrtvých worktrees.

---

## Fáze 25 — Testerská výbava & první dojem
**Z auditu cesty testera + rešerše prvního dojmu.** Bez 25.1 se zpětná vazba rozteče mimo platformu; bez zbytku kouká nováček na prázdno a odchází.

### - [ ] 25.1 In-app hlášení chyb — [dopad vysoký · náklad střední] 👑
**Cíl:** Stránka/tlačítko „Nahlásit chybu" dostupné odkudkoli; hlášení pod minutu.
**Dnes slepá smyčka:** FAQ → „napiš e-mailem dle kontaktu" → ContactPage má `[DOPLNIT: e-mail]`. Tlačítko „Nahlásit" je jen DSA obsahová moderace. Discord v UI není.
**Rozhodnuto (uživatel):** primární kanál = **in-app stránka**, ne Discord (existuje, ale nebude se extrémně využívat).
**BE:** jednoduchý `bug-report` endpoint (text + automatický kontext: URL/route, verze buildu, prohlížeč, userId) + admin výpis/inbox (reuse vzorů content_report, ale oddělená entita — bug ≠ obsahová moderace).
**FE:** tlačítko v patičce/hlavičce → modal/stránka; potvrzení „díky, sledujeme"; odkaz i z nápovědy a FAQ. Do ContactPage doplnit provozní e-mail (existuje — fallback kanál).
**Otevřené otázky:** screenshot příloha ve V1, nebo jen text+kontext? Notifikace admina (Discord webhook při novém reportu)?

### - [ ] 25.2 Post-registrační navedení — [dopad vysoký · náklad malý]
**Dnes paradox:** anon má panel „Začni tady" + uvítací kartu s CTA — **registrací obojí zmizí**; nový uživatel s 0 světy vidí generický pozdrav.
**FE:** CTA řada („Prozkoumej světy / Najdi nábor / Vytvoř svět / Prohlédni ukázkový svět") i pro přihlášeného s 0 světy; checklist „Začni tady" ponechat členům bez světa. Váže na 26.4.

### - [ ] 25.3 Beta rámec: banner + očekávání + štítek — [dopad střední · náklad malý]
**Cíl:** Jednorázový dismissable banner po loginu: co je beta, co smí být rozbité, kde hlásit chyby (25.1), kde je changelog (25.4).
**Rešerše:** riziko rozdílného očekávání 60–75 % — web říká „beta", interně teprve certifikujeme. **Otevřená otázka:** do splnění fází 23–25 používat štítek „testovací provoz / raný náhled" a „beta" nasadit až s kohortou A?

### - [ ] 25.4 Changelog + „Známé problémy" z Novinek — [dopad střední · náklad malý]
Nástroj existuje (/ikaros/novinky + admin CRUD). **FE:** odkaz Novinky do levé navigace/patičky. **Proces:** při každém deployi novinka „Co je nové"; jedna přišpendlená „Známé problémy" (šetří duplicitní reporty). Jmenovitě děkovat testerům, jejichž report vedl k opravě — nejlevnější retence testerů.

### - [ ] 25.5 Ukázkové světy & klonovatelné šablony — [dopad vysoký · náklad střední] 👑obsah
**Cíl (dle rešerše):** 2–3 **kompletní ukázkové světy** (různé žánry, hotová cesta — „takhle vypadá živá hra") + 3–5 **malých světů ke klonování** (PJ nezačíná z prázdné stránky) + 8–12 krátkých scénářů/prvních sezení.
**Mechanika hotová:** `publicShowcase` (anon = Čtenář), sdílení scén 22.5, šablony stránek 15.5, generátory a knihovny 21.x. Zbývá **obsah** + odkazy z dashboardu/nápovědy.
**Otevřené otázky:** které žánry (fantasy + sci-fi/Matrix + …)? kdo plní — autor, admin síť („správce ukázkového světa" role, 28.3)?

### - [ ] 25.6 Úklid prvního dojmu — [dopad střední · náklad malý]
Z rešerše živého webu: ① skrýt/přejmenovat veřejně viditelný svět s `/test/` v názvu · ② skrýt nulové indikátory (Putyka „0 online" apod. — prázdnota nesmí být první signál) · ③ **PWA install prompt odložit**, dokud uživatel nezažil hodnotu (dnes hned; odhad −5–15 % první konverze) · ④ prověřit ~3s spinner nápovědy (první dojem) · ⑤ patička/beta štítek viditelný i v layoutech, kde se dnes nerenderuje.

### - [ ] 25.7 Kurátorský první výběr motivů — [dopad střední · náklad malý]
**Rešerše:** 33 motivů = rozhodovací zátěž + vizuální QA plocha; kyberpunk default polarizuje.
**Návrh:** v prvním výběru 4–6 „podpisových" motivů (zbytek za „Další motivy…"), žádné mazání. **Otevřené otázky:** neutrálnější default, nebo rychlá volba dle žánru při registraci/založení světa? Kterých 4–6? *(Kvalita skinů zůstává princip — tady jde o kurátorství nabídky, ne o šetření na grafice.)*

### - [x] 25.8 Ohraničení systémových slibů ⚠️ — [dopad vysoký · náklad malý] ✅ 2026-07-19
**Kolize (rešerše):** veřejná stránka „RPG systémy" slibovala hraní DrD 1.6, DrD II a JaD vč. deníku a taktické mapy — mantinel projektu ale říká „licence čekají, systémy neřešíme".
**✅ Implementováno (spec [spec-25.8](arch/phase-25/spec-25.8.md)):** rozhodnuto uživatelem „skryj" (generická stránka zamítnuta). Vše za flagem `SystemLanding/flag.ts` (`SYSTEM_LANDINGS_PUBLIC=false`): routy `/ikaros/systemy*` → gate loader redirect na `/` (stránky byly indexované, ne 404) · nav položka + sekce nápovědy skryty · BE sitemap bez 4 záznamů · prerender řádek zakomentován · dashboard meta bez názvů systémů. In-app funkčnost (výběr systému, deníky) beze změny — není to veřejný claim. Vědomě neskryto: TermsPage „např." výčet (právní popisný text → advokát, 31.1) a zmínky v nápovědě světa (dokumentace reálné funkce). Zpětné zapnutí po licencích = 3 kroky (návod ve flag.ts). Ověřeno: FE build+budget+CSP ✓, audit:nav ✓, vitest 120 ✓, BE typecheck + seo 7/7 ✓. **Čeká FE+BE deploy.**

### - [ ] 25.9 Registrační brzda (volitelné) — [dopad nízký · náklad malý]
Registrace je dnes otevřená komukoli (Turnstile + 15+); platformní invite/whitelist neexistuje. Pro kohorty A/B stačí nešířit URL. Env-flag invite kód / kapacitní cap připravit, jen kdyby se to zvrhlo. **Otevřená otázka:** chceme pro kohortu C pozvánkové kódy (měřitelné „přišel doporučením"), nebo volný vstup s capem?

---

## Fáze 26 — Segmentový onboarding 👑
**Rešerše ROI #1 a #7: „Bez aktivace se žádná další funkce nepočítá."** Tři oddělené první cesty místo jednoho obřího průvodce (nahrazuje kartu 22.3 v beta podobě; plný wizard zůstává jako pozdější rozšíření).

### - [ ] 26.1 PJ Start — [dopad vysoký · náklad střední] 👑
**Cíl:** nový PJ do ~15 minut: šablona světa → pozvánka hráčům → jednoduchá postava → první zpráva/scéna → ví o exportu. Cílová úspěšnost ~70 % bez pomoci (měříme v kohortě A ručně, later 19.1 funnel).
**Návrh:** vedený tok „Založ svět" (výběr šablony/klonu z 25.5 → checklist prvních kroků v dashboardu světa → CTA pozvánky WorldInvite → CTA první scény). 🔁 reuse: šablony světů/stránek, WorldInvite (15.10), empty states 15.6, mapDefaults.
**Otevřené otázky:** checklist persistentní per svět (dismiss), nebo jen do prvního splnění? Kolik šablon světa do startu?

### - [ ] 26.2 Cesta hráče — [dopad vysoký · náklad malý]
**Cíl:** pozvaný hráč do ~7 minut: invite link → jasná role → postava/převzetí postavy → odpověď v chatu → notifikace zapnuté. Cílová úspěšnost ~80 %.
**Návrh:** po přijetí pozvánky landing „Co teď" (postava → chat → deník); prázdné stavy vedou k akci. 🔁 reuse WorldInvite + přihláška s postavou (15.10).

### - [ ] 26.3 Cesta worldbuildera — [dopad střední · náklad malý]
**Cíl:** do ~15 minut: první článek → vztah/pavučina → bod na mapě → veřejné/read-only sdílení (vitrína 22.4). Cílová úspěšnost ~70 %.
**Návrh:** checklist v prázdném světě bez hráčů; provázat s osnovami stránek (15.5) a atlasem.

### - [ ] 26.4 Kontextové tipy & checklist po registraci — [dopad střední · náklad malý]
Lehká vrstva nad 25.2: po registraci volba „Chci vést hru / Hrát / Tvořit svět" → nasměrování do 26.1/26.2/26.3. Žádný intruzivní tour framework — checklist + empty-state CTA. **Otevřená otázka:** volbu ukládat (persona pro dashboard), nebo jen jednorázově navigovat?

### - [ ] 26.5 Krátké návody v nápovědě — [dopad střední · náklad malý]
10–15 návodů, **každý řeší jeden úkol do 5 minut** (založ svět, pozvi hráče, první scéna, hod v chatu, mapa+tokeny, deník, export…). 🔁 reuse HelpPage struktury; naplnit ScreenshotSloty reálnými snímky (spolupráce: uživatel dodá screenshoty).

---

## Fáze 27 — Zlaté cesty & certifikace jádra
**Rešerše ROI #3: chránit kritické propojení produktu — to je hlavní diferenciátor (síla propojení 84 %).**

### - [ ] 27.1 Pět zlatých cest FE↔BE e2e — [dopad vysoký · náklad střední] 👑
**Cíl:** certifikované e2e průchody (BE e2e harness + FE Playwright rozšíření smoke):
① pozvánka → členství → postava · ② postava → deník → chat → hod · ③ mapa → token → iniciativa → výsledek · ④ wiki → scénář → událost → kronika · ⑤ komunitní položka → schválení → klon do světa.
**Proč:** dnes 1 FE smoke happy-path + BE e2e po modulech; zlaté cesty svazují moduly dohromady — přesně tam vznikají cross-repo regrese (rešerše: pravděpodobnost 50 %, dopad 90 %).
**Návrh:** BE e2e per cesta (rozšíření seed-scenario páteře 16/16); FE Playwright: cesty ①② nad mock-API rozšířit o reálnější fixtures. Napojit na CI z 23.7.

### - [ ] 27.2 Mobilní core cesty — [dopad střední · náklad střední]
**Cíl:** zlaté cesty ①–③ projít na telefonu (hráči u stolu drží mobil). Statická CSS review + živý průchod uživatelem (fb_tests_live); opravit, co drhne. 🔁 reuse 17.4 dotyk mapy. **Ne** nový mobilní layout — jen průchodnost core cest.

### - [ ] 27.3 Scope registr A/B/C + scope freeze — [dopad vysoký · náklad malý]
**Cíl (rešerše):** každá viditelná funkce zařazena: **A** = beta core (certifikováno, supportujeme) · **B** = viditelné, označené „preview" · **C** = skryté za feature flagem. Nový uživatel má z prvního kontaktu vidět ~20–35 % méně šíře (výběr, ne mazání).
**Návrh:** tabulka v docs (zdroj: `docs/funkce/`) + FE „preview" badge komponenta + flagy pro C. Pravidlo Etapy III: **žádná nová doména, dokud A-scope není certifikovaný** (výjimky jen po diskuzi).
**Otevřené otázky:** které dnešní moduly spadnou do B/C? (návrh připravím z funkce inventury k odsouhlasení)

### - [ ] 27.4 SLO brána: plný audit s +load/+perf — [dopad vysoký · náklad velký]
**Cíl:** poprvé reálně proměřit SLO (500 světů / 50 hráčů v jeskyni / LCP ≤ 2,5 s) — skill `plny-audit` s proof vrstvami +load/+perf/+render, které dosud nikdy neběžely. Bundle guard už v CI (300,7/350 kB).
**Kdy:** po fázích 23–26, před kohortou C (omezená veřejná).

### - [ ] 27.5 Pentest — [dopad vysoký · náklad střední]
**Cíl:** skill `pentest` (T1 útočné e2e v CI regresi + T2 DAST proti lokálnímu stacku) — AŽ PO průchodu plny-auditu (27.4). Nikdy proti produkci bez souhlasu.

---

## Fáze 28 — Beta provoz (proces, běží průběžně od otevření)

### - [ ] 28.1 Kohorty A → B → C + červené signály — [dopad vysoký · náklad nulový (proces)]
**Plán (dle rešerše, pravděpodobnosti zvládnutí 85–90 % / 75–85 % / 55–70 %):**
- **Kohorta A:** 10–20 lidí, 3–5 světů; každý má kontakt na konkrétního admina; měří se aktivace, chyby, čas prvního úspěchu; žádný růstový tlak. *(vstupní podmínka: fáze 23–25)*
- **Kohorta B:** 30–80 lidí, 10–20 světů, 2–3 segmenty; první veřejné ukázkové světy; support už nestojí jen na autorovi. *(podmínka: kritické nálezy A opraveny + 26.x hotové)*
- **Kohorta C:** omezená veřejná beta — kapacitní limit / pozvánkové vlny, týdenní go/no-go. *(podmínka: 27.4 SLO + 27.5 pentest)*
**Červené signály (další nábor STOP):** P0 ztráta dat či neověřený restore · >5 % nováčků narazí na blokující chybu · <50 % PJ dokončí svět+pozvánku · <60 % pozvaných hráčů vstoupí do světa · >1 incident/10 aktivních uživatelů týdně po 2. týdnu · support >35 % času autora 2 týdny po sobě · veřejný slib necertifikované funkce.

### - [ ] 28.2 Metriky bety + minimální sběr retence — [dopad vysoký · náklad malý]
**Sledovat (admin Growth/Analytics/Náklady už existují):** aktivace (PJ svět do 24 h ≥50 %, pozvánka ≥45 %, hráč vstup ≥60 %, postava ≥55 %) · retence světů (aktivní svět 4. týden ≥35 %, 8. týden ≥25 % — **aktivní svět > denní login jednotlivce**) · důvěra (P0 ztráty dat = 0, restore drill 100 %, P1 bez postmortemu = 0) · PMF signály po 3 kohortách (≥50 % světů aktivních 4. týden, ≥40 % PJ „velmi zklamán bez Ikarosu", ≥30 % registrací doporučením, support ≤25 % času, ≥60 % světů užívá 2+ propojené oblasti).
**Kód hned:** minimální append-only sběr retence `{userId, isoWeek}` (D-19.1 část) — **data nejdou doplnit zpětně**, každý týden bez sběru je ztracený.

### - [ ] 28.3 Admin síť: konkrétní role + znalostní báze — [dopad vysoký · náklad malý]
Nepředávat „pomáhejte s betou", ale role: **onboarding buddy · support triage · moderátor obsahu · správce ukázkového světa · zapisovatel incidentů · beta cohort lead · backup operátor statusu**. + znalostní báze (FAQ odpovědí supportu) a šablony hlášení → počet přerušení autora může klesnout o 40–60 %. Technická eskalace zůstává na autorovi (přijatý bus factor).
**Otevřená otázka:** kanál supportu = in-app (25.1) + co dál — admin chat 20.5, nebo Discord role?

### - [ ] 28.4 Rytmus komunikace — [dopad střední · náklad nulový (proces)]
Changelog při každém deployi (25.4) · týdenní souhrn (co je nové, známé problémy, díky jmenovitě) · uzavírat smyčku („opraveno díky X"; u nepřijatých návrhů říct proč) · po konci každé kohorty shrnutí. Beta má **předem definované otázky** (co se chceme dozvědět) — bez cíle je beta jen PR.

### - [ ] 28.5 Incident proces — [dopad střední · náklad malý]
Runbook „web nejede" pro netechnického admina (co zkontrolovat, koho vzbudit, co napsat uživatelům — backup operátor z 28.3) · pravidlo: každý P1 má krátký postmortem (co, proč, pojistka) do chybového deníku · týdenní 15min provozní kontrola (heartbeat, záloha proběhla + namátkové stažení, Sentry trend, disk/RSS, Cloudinary usage).

---

## Fáze 29 — Úklid dluhů *(překlopený obsah `docs/dluhy.md` — po dokončení karty mizí dluh definitivně; nové dluhy se dál zapisují do dluhy.md a při revizi roadmapy se překlápí sem)*

> Ověřeno proti HEAD 2026-07-19 (15/15, viz git log dluhy.md). Karty drží původní triggery — „řešit dřív = mrtvý kód" platí; pořadí v této fázi je doporučené pořadí, AŽ trigger nastane nebo zbyde kapacita.

### - [ ] 29.1 Deník: optimistic-lock `expectedUpdatedAt` — *(D-DIARY-HP-DELTA + D-073)* — [náklad malý]
Souběžné HP úpravy v deníku = last-write-wins (BE flat `$set`, FE absolutní hodnoty ze stale cache; 12 combat panelů). Bestie tokeny deltu mají, deník ne. **Cesta (c):** dotáhnout `expectedUpdatedAt` (dnes half-wired; hotové vzory ve 4 modulech vč. `character-account.repository.ts`). Pozor na UX 409 u debounced auto-save (refetch+retry). **Trigger:** stížnost na „zmizelé HP" v betě, nebo volná kapacita ~1 den.

### - [ ] 29.2 Token→deník HP sync pro 5 systémů — *(D-HP-MAP-SYSTEMS)* — [náklad střední] ⏳trigger
Shadowrun/fae/fate/drdplus/drd2 nemají zápisové mapování (čtení funguje). Vyžaduje produktová rozhodnutí o herní sémantice (SR track? drdplus pásma? fate box? drd2 zdroj?) + FE caller + BE mapa naráz. **Trigger:** vznik FE calleru / poptávka z bety. *(Souvisí s Etapou IV — systémy.)*

### - [ ] 29.3 Kostky: levné utažení + Cesta B — *(D-DICE-SERVER-RNG)* — [náklad malý / velký] ⏳trigger
Levné utažení (0,5–1 d): sync `tens/ones` s faces, přepočet crit/glitch, 2d6+ faces 1..6, meze breakdown — brání matoucím renderům. **Cesta B** (server RNG, port roll enginu): až trigger kompetitivní/turnajová integrita.

### - [ ] 29.4 Meili čeština: upgrade + stopWords — *(D-MEILI-CZ)* — [náklad malý]
Upgrade image v1.6→v1.15 (index se rebuil duje při startu BE; bump tagu + wipe volume) + české stopWords; synonyms průběžná kurace. Stemming v Meili neexistuje — víc nejde. **Trigger:** relevance CZ fulltextu začne bolet (typicky s růstem obsahu v kohortě C).

### - [ ] 29.5 Paginace katalogů — *(D-PERF-BE)* — [náklad střední] ⏳trigger
`GET /worlds` + `GET /pages` bez limitu; breaking pro FE (klient-side filtr) → BE `?page=&limit=` + projekce + FE stránkovaný katalog **naráz**. **Dřív jen:** projekce `content` z pages listingu, pokud se v betě ukáže pomalé načítání seznamu stránek bohatého světa (MB payload). **Trigger:** viditelně pomalý katalog / stovky světů.

### - [ ] 29.6 Storage kvóty per-user + FE `bytes` — *(D-NEW-UM10 + D-19.2-BYTES)* — [náklad střední]
Do launche kryje admin dashboard nákladů (Cloudinary usage) + rate-limity + creation capy. **Před kohortou C / launch:** ① FE protáhne `bytes` z upload response do entit (levné, měřit co nejdřív — zpětně nejde) · ② BE upload-ledger per user + gate + vlídná hláška · ③ agregace per svět/uživatel v adminu.

### - [ ] 29.7 Privátní média: ACL doručení — *(D-NEW-UM02)* — [náklad velký] ⏳trigger
Cloudinary `type: 'upload'` = veřejná URL (random 20+ znaků publicId = průmyslový standard, Discord/Slack model). **Trigger:** komerční/placený privátní obsah. Pak varianta (a) proxy s ACL pro mapy/chat přílohy; TipTap embedy = known gap.

### - [ ] 29.8 Barvy → tokeny — *(D-NEW-color-tokens)* — [náklad velký, po kouskách]
Reálně 3888 nálezů/230 souborů, z toho ~2184 je datová identita skinů (5 souborů) → **první krok:** ALLOW/split identity bloky, ať lint měří skutečný chrome (~1700). Pak průběžně po komponentách při práci na nich (vizuální kontrola 2–3 témat). Plán: `n2-color-mapping.md`.

### - [ ] 29.9 Pravá kohortní retence (plné řešení) — *(D-19.1-RETENCE)* — [náklad malý]
Minimální sběr běží od 28.2; tady: W-o-W agregace + DTO + FE retenční tabulka v admin Growth. **Trigger:** po 4+ týdnech sběru (dřív není co ukázat).

### - [ ] 29.10 Embedding modely na vlastní hosting — *(D-NEW-PC21; překlopeno z 14.8 část 2)* — [náklad malý] ⛔akce uživatele
Stáhnout 4 model soubory → vlastní úložiště → 4 env vars **+ ~4 řádky v `deploy.yml`** (workflow URL vars nepředává — bez toho GitHub vars nezaberou; dluh to nezmiňoval) · volitelně volume pro `model_cache`. **Trigger:** rušení `patrikzplzne.cz` (server_swap) nebo zapnutí embedding search (RAM rozhodnutí ~2,5 GB).

### - [ ] 29.11 Zápis rozsahu multi-instance stavů — *(doplněk D-NEW-chat-presence-scale)* — [náklad nulový]
Do karty 30.2 doplněno: per-instance stavů je víc, než dluh uváděl (global-chat `connectedUsers`/`environments`/`voicePresence`, `anonRate`, `lastResetMailAt`) — hotovo zapsáním do 30.2, nic se nestaví.

---

## Fáze 30 — Škálovací brána & architektonické základy
**Podmíněná fáze:** karty se spouští triggerem (růst/škála), ne kalendářem. Drží „základy, na které půjde navázat i venku" — architektura, ne překlad.

### - [ ] 30.1 Connection cap + presence room-scoping — *(D-RT-SCALE)* — [náklad střední]
① **In-memory per-user/IP connection cap** na 1 instanci funguje (Redis netřeba — oprava argumentu dluhu; dnes anonym může otevírat sockety bez limitu) — udělat před kohortou C. ② Presence broadcast dnes `server.emit` všem (O(N²)) → room-scoping po **produktovém rozhodnutí** kdo koho vidí online (přátelé/svět/globálně) + FE snapshot úprava. **Trigger ②:** stovky souběžně online.

### - [ ] 30.2 Multi-instance stav → Redis — *(D-NEW-chat-presence-scale + D-051)* — [náklad velký] ⏳trigger
Chat presence Map, global-chat `connectedUsers`/`environments`/`startHere`/`voicePresence`, `anonRate`, `lastResetMailAt`, platformní presence → Redis. Infra ready (`SOCKET_IO_REDIS=1`, CronLock). **Trigger:** 2+ BE instance (load balancer). Dělat dřív = mrtvý kód.

### - [ ] 30.3 Import světa (round-trip k exportu) — [dopad vysoký · náklad velký] *(odloženo z 14.7)*
**Proč (rešerše ROI #4):** export+import = důvěrový mechanismus i snížení ceny přechodu; formát ZIP je import-ready. **Cíl:** minimální import `pj-full` ZIP → nový svět (round-trip ověření). **Otevřené otázky:** kolize ID/médií; co s chatem; jen vlastní zálohy, nebo i cizí (sdílení světů)?

### - [ ] 30.4 i18n-ready základy (nezavírat dveře) — [dopad nízký · náklad malý]
**Rozhodnuto:** čeština jádro, překlad se nedělá. Jen: ① configem řízené identity texty (název organizace/e-maily — stejně nutné pro fázi 31) · ② zásada pro nový kód: user-facing stringy neukládat do DB struktur/enumů (mapovat na FE) · ③ krátký zápis do docs, jak by extrakce jednou proběhla (ať budoucí rozhodnutí má odhad). Žádná extrakce tisíců textů teď.

### - [ ] 30.5 Mongo/Redis auth + zbytek infra hardeningu — [náklad malý]
Runbook §2–3 (keyFile/requirepass; okno ~15 min výpadku, koordinovat) · Caddyfile do verze (dnes žije jen na serveru, §7) · mem limity kontejnerů zvážit. **Kdy:** před kohortou C.

### - [ ] 30.6 Rollback: image tag per git sha — [náklad malý] ⏳trigger
Dnes rollback = git revert + rebuild (~10 min). Tagované image + `docker compose` pin = návrat v minutě. **Trigger:** častější/rizikovější nasazování během kohort B/C.

---

## Fáze 31 — Brána veřejného launche
**Po splnění je beta „úplná" a veřejné spuštění je jen rozhodnutí.** Jednotlivé systémy → Etapa IV (po licencích).

### - [ ] 31.1 Právní balík ⛔ (právník/spolek)
Doplnit identitu správce do /soukromi, /kontakt, Podmínek (~20 placeholderů `[DOPLNIT]`, 2–4 h po dodání) · finální revize Podmínek advokátem · rodičovský souhlas <15 (dnes stub) · rozhodnutí content-erasure zpráv · potvrzení zpracovatelů + DPF/SCC. **Předpřipravit bez právníka:** doplnit už rozhodnuté poskytovatele (hosting, SMTP) — zúží zbytek na čistě spolkové údaje; texty identity configem (30.4①).

### - [ ] 31.2 Podporovatel: dary ostrý běh ⛔ (právník)
Kanál na dary (účet/QR vs Ko-fi vs Patreon) = právní zařazení (dar vs veřejná sbírka) → rozhodnout s právníkem u zakládání spolku. Freemium gating je hotový a v betě běží bez plateb.

### - [ ] 31.3 SEO ověření po nasazení — [náklad malý]
Prerender/meta/sitemap/JSON-LD jsou v kódu (15B) — po deployi ověřit: Googlebot dostává HTML, Rich Results test, Search Console sitemap, OG náhledy. Academy/obohacení landingů (22.1/22.2) zůstávají v roadmap2 → navazují na Etapu IV.

### - [ ] 31.4 Go/no-go checklist veřejného spuštění
Vše najednou: fáze 23–28 odškrtnuté · SLO brána 27.4 + pentest 27.5 zelené · metriky kohorty C nad minimy (28.2) · červené signály 0 · právní balík 31.1–31.2 dodán · štítek „beta" → „omezená veřejná beta" (25.3). Teprve pak veřejná komunikace.

---

## Co jsme domysleli navíc (a vědomě NEděláme v Etapě III)

Aby bylo vidět, že se na to nezapomnělo — jen to nepatří do úplné bety:

| Nápad | Proč teď ne | Kdy |
|---|---|---|
| Komunitní eventy typu WorldEmber (výzvy, soutěže) | nejlevnější motor obsahu — ale až s živou kohortou B/C | během kohorty C |
| Partnerství (CZ RPG weby, spolky, tvůrci) | rešerše ROI #8; vyžaduje stabilní betu jako demo | s kohortou C |
| Read-only sdílené odkazy do světa (mimo vitrínu) | snižuje cenu přechodu; vitrína 22.4 kryje první potřebu | dle poptávky bety |
| Discord bot / integrace (hody, notifikace do Discordu) | „propojit, ne nahradit" — silná karta, ale nová doména | Etapa IV |
| Mobilní companion mód (17.11) | 27.2 řeší průchodnost; companion je nová plocha | Etapa IV |
| Slovenský pilot | rešerše 55–70 % vhodnost — až po důkazu CZ retence | po launchi |
| Anglický niche pilot („campaign OS pro lore-heavy") | až po CZ důkazu; 30.4 drží dveře otevřené | po launchi |
| Druhý programátor / předání znalostí | bus factor přijat; admin role 28.3 kryjí ne-kódové oblasti | po betě |

---

## Otevřená rozhodnutí (sběrně — každé má kartu)

1. **25.3** — štítek „testovací provoz" do doby splnění bran vs. nechat „beta"?
2. **25.5** — žánry ukázkových světů + kdo je plní?
3. **25.7** — kterých 4–6 podpisových motivů; default?
4. ~~**25.8** — systémové landing pages: skrýt vs. generická stránka?~~ ✅ rozhodnuto „skrýt" a implementováno 2026-07-19 (spec-25.8).
5. **25.9 / 28.1** — kohorta C: pozvánkové kódy vs. volný vstup s capem?
6. **26.4** — ukládat personu (PJ/hráč/worldbuilder) pro dashboard?
7. **27.3** — návrh A/B/C zařazení modulů (připravím k odsouhlasení).
8. **28.3** — sekundární kanál supportu (admin chat 20.5 vs Discord role)?

---

## Vazba na dokumenty

- `docs/dluhy.md` — **vyprázdněno 2026-07-19**: otevřené dluhy překlopeny do fáze 29 (+ 23.1, 30.1, 30.2, 31.1); soubor dál slouží k zápisu nových dluhů (skill `dluh`), při revizi roadmapy se překlápí sem.
- `roadmap2.md` — otevřené karty anotovány „→ R3": 14.4→23.1 · 14.8→23.3+29.10 · 19.2 vynucování kvót→29.6 · 22.3→26.1–26.4 (plný wizard později) · 22.1/22.2→zůstávají (vážou na Etapu IV / obsah).
- `roadmap-fe.md` — stale checkboxy řeší karta 24.5.
- Beta metriky a červené signály vychází z *Konkurenční a realizační rešerše* (2026-07-19); přepočítat po prvních kohortách.
