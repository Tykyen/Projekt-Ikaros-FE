# Roadmap 2 — Projekt Ikaros · Etapa II

**Vyspělost · diferenciace · růst**

**Stav:** návrh k diskuzi (nic z Etapy II nezačato)
**Vznik:** 2026-06-14, odvozeno z *Hloubkové strategické analýzy* (PDF v `~/Downloads/Ikaros-hloubkova-analyza.pdf` + `Ikaros-analyza-vylepseni.pdf`)
**Revize:** 2026-06-15 — sladěno s master-planem *Návrh budoucích změn* (6 horizontů H0–H5, ~50 karet). Doplněny mezery (SEO, export, homepage, prázdné stavy, streamer overlay, docking), opravena nesrovnalost Dungeon Builderu, přidána křížová tabulka H0–H5 ↔ fáze, rozpad systémů (16.2) per systém a, b, c…, appendixy KPI a Vizuální design systém.
**Revize:** 2026-06-18 — doplněn **Průřez Ú (Úklid dluhů & nesrovnalostí)** z kódem ověřené inventury funkcí [`docs/funkce/`](funkce/00-prehled.md); cíl Etapy II = 0 otevřených nesrovnalostí v inventuře. 9 nových seskupených dluhů D-NEW-INV-* v `docs/dluhy.md`.
**Navazuje na:** `docs/roadmap-fe.md` (Etapa I, fáze 0–13 — jádro platformy)
**Repo:** FE `Projekt-ikaros-FE` · BE `Projekt-ikaros`

> **Jak číst tuto roadmapu.** Tohle je **mapa směru, ne závazek k provedení**. Každý bod má *Cíl*, *Proč*, *Návrh přípravy*, hrubý *BE/FE rozsah* a **Otevřené otázky k diskuzi** — protože konkrétní podobu každé featury teprve doladíme. Nic se neimplementuje bez schválení a bez obvyklého workflow **spec → souhlas → impl. plán → souhlas → kód** (skill `spec-driven-development`), u UI navíc design audit (`frontend-design`) a `mobil-desktop`.
>
> Značky u nadpisů: `[kód z analýzy · dopad · náklad]`. Cíl je dělat **vysoký dopad / malý náklad** první. `🔁 reuse` = stavíme na existujícím modulu, ne od nuly.

> **Jak na Etapě II spolupracujeme (vizuální kontext).** Roadmapa popisuje *kam*, ne *jak to teď vypadá*. Proto:
> - **Claude si aktivně řekne o screenshoty**, kdykoli potřebuje vidět aktuální stav UI — než navrhne grafickou změnu, rozbor featury, nebo když má generovat/upravovat obrázky a assety. Nehádá podobu naslepo.
> - **Uživatel posílá screeny aktuální obrazovky**, aby ukázal, jak práce vypadá v tuto chvíli — to je vstup pro analýzu „kam se posunout".
> - **Doptávání je vítané a povinné** u nejasností — radši se zeptat než tiše odhadnout (drží to s pravidlem projektu „neopravuj tiše, čekej na souhlas").
> - Tohle platí zvlášť pro práci nad `roadmap2` a její karty: nejdřív vizuální kontext + diskuze, pak teprve spec → plán → kód.

---

## Strategická osa (proč právě tyto fáze)

Etapa I postavila **platformu** (auth, komunita, světy, chat, postavy, mapy, kalendáře). Etapa II ji má proměnit z *funkční* na *vyspělou, bezpečnou a pro českou scénu nenahraditelnou*. Vede nás analýza trhu:

- **Nejsme nejhlubší v žádné disciplíně, ale jediní, kdo spojí stůl + svět + komunitu — česky.** To je naše zbraň. Etapa II ji brousí, místo aby se snažila porazit Foundry v jeho hře.
- **Tři scénáře budoucnosti (pořadí ambicí A → B → C):**
  - **A — „Domov komunity"** (~1 rok): nikdo nemá důvod odejít; bezpečné, příjemné, zvládne to nováček. *(Fáze 14–15 + 16.4)*
  - **B — „Fórovka 2.0 pro Česko"** (~1–2 roky): moderní náhrada českých fórovek; výchozí volba pro novou textovou hru. *(Fáze 16)*
  - **C — „Český all-in-one stůl"** (~2–3 roky): plnohodnotná česká alternativa Foundry, s komunitou navrch. *(Fáze 17)*
- **Cíl je dojít až na C — a trumfnout všechny.** A+B je začátek (domov + nenahraditelnost pro CZ scénu); jakmile to stojí pevně, jdeme na C a doháníme i živý stůl. Ne kvůli zisku — abychom **dokázali, že na to máme** a že má smysl posunout komunitu na novou úroveň ve velkém stylu.
- **Kdybychom měli udělat jen tři věci:** ① zálohy + 2FA (ztráta dat/účtů je nevratná), ② fórovkový mód (jediné, co Discord neumí a zavírá CZ díru), ③ onboarding + demo svět (jinak třetina nováčků odejde první týden).

**Průřezové principy Etapy II:**
1. **Bezpečnost a data mají přednost** — pojistka před parádou.
2. **Hobby charakter zůstává** — žádný povinný placený obsah; štědrý free základ je naše výhoda.
3. **Čeština a komunita jsou jádro** — i18n a globální ambice schválně odkládáme.
4. **AI jen volitelně, transparentně, s limity** — nikdy vnucené.
5. **Udržitelné tempo** — vlny po sobě, ne vše naráz; chrání to data i tvůj čas.
6. **Obsah dělá komunita** — platforma dává nástroje, **procedurální generátory** a sdílené knihovny; hráči a PJ je plní (Fáze 21). Nejudržitelnější a nejbohatší zdroj obsahu — a původní záměr projektu, jen rozložený z jedněch ramen na celou komunitu.

---

## Přehled fází Etapy II

| # | Název | Vlna z analýzy | Doména | Stav |
|---|-------|----------------|--------|------|
| 14 | Bezpečnost & provozní odolnost | Vlna 1 — Pojistka | Platforma | ⬜ |
| 15 | Rychlé výhry & parita stolu | Vlna 2 — Rychlé výhry | Svět + Platforma | ⬜ |
| 15B | SEO & objevitelnost | Vlna 2b — Objevitelnost | Platforma + Obsah | ⬜ |
| 16 | Český příkop | Vlna 3 — Příkop | Svět + Komunita | ⬜ |
| 17 | Vlajkové funkce | Vlna 4 — Vlajky | Svět | ⬜ |
| 18 | AI asistence | Vlna 5 — AI horizont | Svět + Platforma | ⬜ |
| 19 | Růst, metriky & udržitelnost | Příloha A + B | Platforma + Provoz | ⬜ |
| 20 | Governance, právo & moderace | Příloha C | Platforma + Provoz | ⬜ |
| 21 | Komunitní tvorba & sdílený obsah | Vize komunity | Svět + Komunita | ⬜ |

> Legenda: ✅ Hotovo &nbsp;|&nbsp; 🟡 Rozpracováno &nbsp;|&nbsp; ⬜ Čeká &nbsp;|&nbsp; 👑 vlajková priorita
>
> **Pořadí ≠ termíny.** Fáze 14 (zejména zálohy a 2FA) je urgentní a vyplatí se interleavovat **už teď**, nezávisle na dokončení Etapy I.

### Křížová tabulka — horizonty master-planu (H0–H5) ↔ fáze Etapy II

Master-plan *Návrh budoucích změn* (6/2026) krájí stejnou práci na 6 horizontů. Tato roadmapa drží vlastní doménové členění (fáze 14–21); tabulka mapuje obojí na sebe, ať dokumenty mluví stejnou řečí.

| Horizont (PDF) | Zaměření | Odpovídá fázím Etapy II |
|---|---|---|
| **H0 — Pojistka domu** | Bezpečnost & provoz | Fáze 14 (vč. 14.7 export, 14.8 starý web, 14.9 audity) |
| **H1 — Viditelnost** | Aktivace & první dojem | 15.1 PWA, 15.2–15.4 mapa, 15.6 prázdné stavy, 15.7 homepage, 16.4 onboarding, 17.3 vitrína |
| **H2 — Objevitelnost** | SEO & obsah | **Fáze 15B (celá — nová)** |
| **H3 — Český příkop** 👑 | Diferenciace | Fáze 16 + 17.5 sdílení + 17.6 hlas |
| **H4 — Herní vlajky** | Parita & „wow" | Fáze 17 + 21.3 generátor podzemí |
| **H5 — AI & škálování** | Trend & růst | Fáze 18 + 19.2 limity + 19.4 dary + 21.2 generátory (bez-AI alternativa) |

> **Priority drift (vědomý).** PDF řadí výš/dřív: odstřižení starého webu (H0 ↔ bylo 19.3 → přesunuto do **14.8**), veřejnou vitrínu (H1 ↔ 17.3) a sdílení/hlas (H3 ↔ 17.5/17.6). Čísla fází ponechána kvůli stabilitě odkazů; reálné pořadí provádění se řídí horizonty výše + principem „pořadí ≠ termíny".

---

## Fáze 14 — Bezpečnost & provozní odolnost
**Vlna 1 — Pojistka.** Nepřidává viditelné funkce; chrání vše, co už máme. Levné, vysoký dopad, jde první.

**Závislosti:** žádné blokující — lze začít okamžitě.

### - [x] 14.1 Dvoufaktorové přihlášení (2FA / TOTP) — [A1 · dopad vysoký · náklad malý] ✅ *(2026-06-18)*
**Cíl:** Druhý zámek u přihlášení — jednorázový kód z aplikace v mobilu + záložní kódy.
**Proč:** Uniklé heslo je nejčastější ztráta účtu; 2FA blokuje ~99,9 % případů. Kritické u PJ, který ovládá celý svět, a u adminů.
**Návrh přípravy:** rešerše knihovny (`otplib`/`speakeasy`), rozhodnout default (povinné pro Admin/Superadmin, dobrovolné jinak), spec na recovery flow (ztráta telefonu → záložní kódy).
**BE:** 🔁 reuse `security-tokens` + `auth` modulu — TOTP secret per user, verifikace při loginu, záložní kódy (hash v DB), nová pole na `User`. Endpoints: setup/enable/disable/verify.
**FE:** 🔁 reuse sekce „Tvá zařízení"/Bezpečnost v profilu — QR pro spárování, zadání kódu, výpis záložních kódů; krok navíc v `LoginModal`.
**Otevřené otázky:** Povinné pro koho? Povolit i e-mailový druhý faktor jako alternativu? Pamatovat zařízení na X dní?
**✅ Implementováno (2026-06-18, `spec-14.1`):** TOTP (QR spárování) + 10 jednorázových záložních kódů + **remember-device včetně revokace** (rozhodnuto vzít do V1). Dobrovolné pro všechny. Secret šifrovaný (AES-256-GCM, `TOTP_ENC_KEY`), challenge-based login (žádný token před ověřením 2FA), trust cookie httpOnly, auto-revoke při změně hesla / vypnutí 2FA. BE 91 testů, FE build+smoke zelené.
**Follow-upy (mimo V1):** **14.1-a** e-mailový OTP jako volitelná *slabší* metoda (nesmí sdílet kanál s resetem hesla) · **14.1-c** vynucení 2FA pro Admin/Superadmin + admin „odemkni uživatele" (lockout recovery).

### - [x] 14.2 Oprava captcha „fail-open" — [A2 · dopad vysoký · náklad malý] 🔁 ✅ *(2026-06-19)*
**Cíl:** Při výpadku captcha služby request **zablokovat**, ne propustit; sjednotit s dokumentací.
**Proč:** Bezpečnostní prvek, který se při potížích vypne, není ochrana. Známý nález **PC-01** z prod-config auditu.
**Návrh přípravy:** ověřit aktuální chování `captcha.service.ts`, rozhodnout fail-closed + alerting, dotáhnout dluh **D-011** (captcha provider).
**BE:** přepnout logiku na fail-closed + log/alert; sladit `.env` a dokumentaci.
**FE:** ověřit chování registračního/login formuláře při blokaci (jasná hláška, ne tichý fail).
**Otevřené otázky:** Který provider (hCaptcha/Turnstile/reCAPTCHA)? Práh, kdy captcha vyžadovat (vždy vs. po N pokusech)?
**✅ Implementováno (2026-06-19):** Prošetření ukázalo, že **BE captcha už byla fail-closed** (PC-01 opraveno 2026-06-14): prázdný token / prod bez secretu / síťová chyba → `false`. Provider = **Cloudflare Turnstile** + honeypot (otevřené otázky zodpovězeny: práh = vždy při registraci). Live probe na produkci potvrdil reálný site key (`0x…`) i funkční BE secret (fake token → `CAPTCHA_FAILED`, ne propuštěn). **Dotaženo:** (B) FE `RegisterModal` už tiše nepřepadá na test key v prod buildu → fail-closed (bez klíče widget nahrazen hláškou, submit blokován); (C) sladěn zavádějící komentář `captcha.service.ts` s `env.validation` (RECOMMENDED/warn, ne boot-fatal). **Login captchu nemá záměrně** (anti-bot na registraci; login chrání rate-limit 429).
> 🔴 **Vedlejší kritický nález (opraveno):** probe odhalil, že **registrace na produkci byla rozbitá** — FE honeypot `hp` se posílal, ale `RegisterDto` ho neměl → `forbidNonWhitelisted` (PC-07) → 400 „Neznámé pole hp". Příčina: honeypot byl jen na FE; PC-07 změnil tichý drop na tvrdý 400. Fix: `hp?` přidán do `RegisterDto` (`@MaxLength(0)` = symetrie s FE zod) → prázdné projde, vyplněné (bot) → 400. BE e2e regrese test přidán (13/13). **Vyžaduje BE restart + redeploy.**

### - [x] 14.3 Bezpečnostní hlavičky (CSP, HSTS, helmet) — [A3 · dopad vysoký · náklad malý] ✅ *(2026-06-19)*
**Cíl:** Prohlížeč dostane pravidla, která zneutralizují XSS (CSP) a vynutí HTTPS (HSTS).
**Proč:** Platforma plná uživatelského textu (chat, bio, články) je přirozený cíl XSS; CSP je záchranná síť, i kdyby kontrola selhala. Cookie už jsou HttpOnly/Secure/SameSite (PC-18).
**Návrh přípravy:** sestavit CSP allowlist (self, Cloudinary, Meili, push, případně AI služby), otestovat na stagingu, aby nerozbila legitimní zdroje.
**BE:** `helmet` middleware + laděná CSP, `X-Frame-Options`, `Referrer-Policy`, HSTS.
**FE:** ověřit, že žádný inline skript/styl CSP neporušuje (případně nonce).
**Otevřené otázky:** Report-only fáze nejdřív (sběr porušení) než tvrdé vynucení? Které externí domény musí být na allowlistu?
**✅ Implementováno (2026-06-19, `spec-14.3`):** Klíčová oprava zadání: **hlavní XSS-CSP patří na FE nginx** (servíruje HTML dokument), ne na BE (vrací jen JSON/obrázky). Rozděleno: **FE [default.conf.template](../../default.conf.template)** = jádro (CSP, HSTS, Referrer-Policy, Permissions-Policy; per-env `BACKEND_HOST` přes nginx envsubst; inline pre-hydration skript přes **SHA-256 hash** + build guard [check-csp-hash.mjs](../../scripts/check-csp-hash.mjs) + `.gitattributes` LF, ať hash sedí napříč Win/Linux). **BE [main.ts](../../../Projekt-ikaros/backend/src/main.ts)** = `helmet()` hardening (API `default-src 'none'`, HSTS, nosniff, `frame-ancestors 'none'`, `crossOriginResourcePolicy:false` kvůli PixiJS `/static/` texturám). **Report-only fáze proběhla na produkci** → allowlist doladěn z reálných nálezů: `script-src 'unsafe-eval'`+youtube (YT IFrame API/zvuky), `style-src 'unsafe-inline'`, `connect-src` res.cloudinary.com+data:, `worker-src blob:`, `frame-src` youtube. **Enforce je teď default** (`CSP_HEADER_NAME`, rollback na report-only přes GitHub var). **ZBÝVÁ provoz:** redeploy (enforce) + smoke neprozkoumaných stránek (galerie/postavy/bestiář/kalendář/admin/motivy). Follow-up **14.3-a**: serverový `report-uri` sběr · **14.3-b**: nahradit YT IFrame API lite-embedem → odpadne `'unsafe-eval'`. Související: dluh **D-NEW-WS-UPGRADE** (WS upgrade na edge proxy, nesouvisí s CSP).

### - [ ] 14.4 Zálohy & plán obnovy (DR) — [A4 · dopad vysoký · náklad střední] 👑provoz
**Cíl:** Automatická noční záloha DB s rotací na oddělené úložiště + ověřená obnova + 1stránkový runbook.
**Proč:** Tichá ztráta dat je jediná chyba, ze které se komunita nevzpamatuje. Stovky hodin práce ve světech.
**Návrh přípravy:** zvolit úložiště (mimo hlavní server), rozvrh rotace (např. 7 denních + 4 týdenní), naplánovat čtvrtletní test obnovy.
**BE/Ops:** `mongodump` cron + upload na oddělené úložiště; média drží Cloudinary; runbook „co dělat, když spadne server".
**Otevřené otázky:** Kam zálohovat (jiný cloud/region)? Jak dlouho držet? Šifrovat zálohy? Kdo má k nim přístup?

### - [x] 14.5 FE CI brána + E2E smoke — [A5 · dopad střední · náklad střední] ✅ *(2026-06-19)*
**Cíl:** Před nasazením FE automaticky proběhne typecheck + lint + testy + jeden E2E happy-path.
**Proč:** FE dnes jen deployuje (BE bránu má); jeden chybný commit může shodit web bez varování. Playwright je nainstalovaný, jen nevyužitý.
**Návrh přípravy:** GitHub Actions workflow zrcadlící BE `ci.yml`; vybrat 1 kritický scénář (login → vstup do světa → otevření mapy).
**FE:** workflow + první Playwright test; volitelně FE pre-commit hook (pozor: FE bez prettieru — viz `feedback_fe_no_prettier`).
**Otevřené otázky:** Blokovat merge, nebo jen varovat zpočátku? Spouštět E2E na každý push, nebo nightly?
**✅ Implementováno (2026-06-19, [spec-14.5](arch/phase-14/spec-14.5.md)):** Klíčová oprava zadání: **CI brána už existovala** — [ci.yml](../.github/workflows/ci.yml) (vznikla při 16. auditu, fáze B1) dělá build `tsc -b` + lint + nav audit + vitest + cross-repo kontraktní scannery + anti-regression guard. Zbýval **jen E2E smoke**. Architektura: **Playwright FE-only, BE mockovaný** přes `page.route('**/api/**')` ([e2e/mock-api.ts](../e2e/mock-api.ts)) + abort socket.io — rychlé (~13 s), deterministické, žádný backend/DB. (Zváženo a zamítnuto: plný stack v CI = pro sólo projekt křehké; kontraktní drift hlídají cross-repo scannery.) Happy-path [e2e/smoke.spec.ts](../e2e/smoke.spec.ts): login (UI formulář) → `/ikaros/vesmiry` → klik na kartu světa → `/svet/:slug/takticka-mapa`, assert že PIXI `<canvas>` naběhl (chytí runtime crash, který tsc/unit nezachytí). Nový **blokující** job `frontend-e2e` v ci.yml (na každý push/PR na `main`). Otevřené otázky zodpovězeny: **blokovat** (deterministické, ne flaky) + **na každý PR** (rychlé). Jediný dotek prod kódu = `data-testid="tactical-map-viewport"`. Vitest `e2e/**` exclude (jinak by scrapnul Playwright `*.spec.ts`). FE pre-commit hook vědomě vynechán (FE bez prettieru, necháno na CI).

### - [ ] 14.6 SCA (skenování závislostí) + rate-limit pro škálu — [A6 · dopad střední · náklad malý]
**Cíl:** Automatické hlídání zranitelných balíčků; připravený Redis-backed rate-limit pro multi-instance.
**Proč:** Zranitelnost v balíčku je častý vstup útoku; in-memory throttler (dluh **D-028**) přestane chránit při víc instancích BE.
**Návrh přípravy:** zapnout Dependabot + `npm audit` v CI; navrhnout přepínač throttleru na Redis (Redis už ve stacku je).
**BE:** Redis throttler jako opt-in; CI audit krok.
**Otevřené otázky:** Práh závažnosti, který blokuje build? Zapínat Redis throttler hned, nebo až při škálování?

### - [ ] 14.7 Export světa / kampaně (ZIP · JSON · PDF) — [H0-06 · dopad střední · náklad střední]
**Cíl:** Výrazné tlačítko „Exportovat / Zálohovat vše" v nastavení světa → kompletní data světa ke stažení (struktura JSON + média ZIP + čitelné PDF).
**Proč:** Zkušení PJ jsou (právem) paranoidní o svá data. I když 90 % tlačítko nikdy nepoužije, samotný fakt, že ho vidí, **odstraňuje strach z vendor lock-inu** → přímá důvěrová páka, proč zůstat. Doplňuje serverové zálohy (14.4) o uživatelovu vlastní kopii.
**Návrh přípravy:** definovat serializovatelný strom světa (existuje datový model); rozhodnout formáty (JSON vždy, ZIP médií, PDF přes Chrome headless — 🔁 vzor `project_pdf_generation`); u velkých světů streamovat/dávkovat.
**BE:** serializace stromu světa + balíček médií; export job (stream, ať nezatíží server).
**FE:** tlačítko v nastavení světa + indikátor průběhu + download.
**Otevřené otázky:** Co všechno do exportu (jen lore, nebo i chat/mapy/kampaně)? Kdo smí exportovat (PJ vs. členové)? Import zpět (obnova z exportu) teď, nebo později?
> 🔗 Kryje i **D-NEW-INV-ADMIN-UI** (Průřez Ú): GDPR `GET /data-export/me` je dnes BE-only bez FE konzumenta — sem patří uživatelské stažení vlastních dat.

### - [ ] 14.8 Odstřižení od starého webu (SMTP + embedding model) — [H0-08 · dopad střední · náklad střední] 🔁 *(přesun z 19.3)*
**Cíl:** Žádná závislost na umírajícím `patrikzplzne.cz` — přesun embedding modelu vyhledávání na vlastní hosting, maily přes vlastní SMTP do produkce, ověřit web push na reálném telefonu (iPhone PWA na plochu).
**Proč:** Když starý web zhasne, něco tiše přestane fungovat (riziko **R5**). Proto patří do **pojistky**, ne až do růstu — PDF to řadí do H0. Dluhy **PC-02** (mailer), **PC-21** (model); SMTP rozpracován (`project_smtp_email_setup`).
**Návrh přípravy:** vybrat hosting modelu; dotáhnout GitHub vars/secret pro SMTP v env production + deploy; push self-test (iPhone nutně PWA na plochu — váže na 15.1).
**Ops/BE:** nahrát model na vlastní hosting; dokončit SMTP přepnutí + deploy + test; push test.
**Otevřené otázky:** Kam hostovat model? Termín, než starý web definitivně padne?

### - [ ] 14.9 Dokončit běžící audity kvality — [H0-07 · dopad střední · náklad střední] 🚧
**Cíl:** Dotáhnout rozběhnuté auditní sweepy: cascade-delete, db-integrity, seed-scenario gauntlet, navigace — opravit otevřené nálezy.
**Proč:** Audity hlídají, že rostoucí kód tiše neztrácí data ani nevede uživatele do slepých uliček. Levná pojistka proti regresi; navazuje na 12+ hotových auditních stylů (viz `docs/`).
**Návrh přípravy:** pokračovat dle existujících plánů (`docs/cascade-delete-*`, `db-integrity-*`, `seed-scenario-*`, `nav-*`); nálezy řešit gated, po souhlasu.
**BE/FE:** dokončit sweepy + opravy.
**Otevřené otázky:** Které nálezy jsou blokující vs. odložitelné do dluhů?

---

## Fáze 15 — Rychlé výhry & parita stolu
**Vlna 2 — Rychlé výhry.** Nízká cena, citelně zvyšují kvalitu i pocit profesionality. Odemykají adopci a scénář A.

**Závislosti:** ideálně po 14.1–14.4 (mít pojistku), ale technicky nezávislé.

### - [ ] 15.1 PWA — instalace na plochu — [D1 · dopad vysoký · náklad malý] 🔁
**Cíl:** Z webu „appka" — ikona na ploše, spolehlivější push (na iOS push **vyžaduje** PWA na ploše).
**Proč:** Push už máme (VAPID, modul `push`); PWA ho zpřístupní víc lidem a dá pocit skutečné aplikace bez App Store.
**Návrh přípravy:** web manifest, service worker (cache shellu + offline fallback stránka), ikony per branding.
**FE:** manifest + service worker + „nainstaluj" hint; ověřit s existující push infrastrukturou.
**Otevřené otázky:** Co cacheovat offline (jen shell, nebo i poslední data)? Vlastní install prompt, nebo nechat na prohlížeči?

### - [ ] 15.2 Čtvercová & bezmřížková mapa — [B1 · dopad vysoký · náklad střední] 1)🔁
**Cíl:** Volba mřížky na úrovni scény: hex / čtverec / žádná.
**Proč:** Většina systémů (D&D, DrD, Zaklínač) i většina stažených map počítá se čtvercem nebo bez mřížky; hex-only odrazuje část PJ hned na startu.
**Návrh přípravy:** ověřit abstrakci souřadnic (dnes q/r) — rozšíření, ne přepis; spec na rendering + pohyb tokenů per typ mřížky; dopad na fog, efekty, měření.
**BE:** pole typu mřížky na scéně (🔁 `maps`/scény); mapper whitelist (pozor `project_map_token_tomapper_whitelist`).
**FE:** render mřížky + snapping pohybu per typ; migrace existujících hex scén beze změny.
**Otevřené otázky:** Jak řešit přepočet existujících hex scén? Podpora obdélníkových políček/velikostí tokenů 2×2?

### - [ ] 15.3 Měření, pravítko & šablony oblastí — [B3 · dopad střední · náklad malý] 🔁
**Cíl:** Pravítko (vzdálenost v jednotkách scény) + šablony kouzel (kužel, koule, linie, čtverec).
**Proč:** Denní chleba taktiky; máme výbuchové oblasti, chybí obecné měření navázané na mřížku.
**Návrh přípravy:** spec na jednotky scény (políčko = X meL), přichytávání šablon na mřížku z 15.2.
**FE:** nástroj pravítko + parametrické šablony (overlay vrstva nad mapou).
**Otevřené otázky:** Sdílet měření/šablony s ostatními hráči, nebo soukromé? Ukotvit jednotky na nastavení světa?

### - [ ] 15.4 Kreslení & anotace na mapě — [B5 · dopad nízký · náklad malý]
**Cíl:** Čára, šipka, kruh, text přímo do scény.
**Proč:** Drobnost, kterou hráči u VTT očekávají a postrádají.
**Návrh přípravy:** rozhodnout perzistenci (uložit do scény vs. dočasné), viditelnost (PJ/all).
**FE:** jednoduchá kreslicí vrstva (free-draw, tvary, text) s mazáním.
**Otevřené otázky:** Kdo smí kreslit (PJ vs. hráči)? Ukládat kresby do scény trvale?

### - [ ] 15.5 Osnovy & šablony stránek — [C4 · dopad nízký · náklad malý] 🔁
**Cíl:** Předvyplněné osnovy podle typu stránky (Postava: vzhled / motivace / tajemství…).
**Proč:** Prázdná stránka děsí; osnova snižuje bariéru tvorby. Máme šablony stránek na úrovni světa — chybí obsahové prompty.
**Návrh přípravy:** sada osnov per typ (lokace/frakce/osoba/…); volitelné při zakládání stránky.
**BE/FE:** 🔁 rozšíření `world-page-templates` o obsahové osnovy; výběr při create.
**Otevřené otázky:** Editovatelné PJ-em per svět, nebo fixní platformové? Provázat s typovým systémem stránek?
> ⚠️ Obsah osnov seeduj jako list/heading, **ne tabulky** — TipTap je u page.content zahodí (`project_page_content_no_tables`).

### - [ ] 15.6 Prázdné stavy (empty states) s výzvou — [H1-05 · dopad vysoký · náklad malý]
**Cíl:** Žádná prázdná bílá obrazovka. Každý prázdný stav = tematická ilustrace + vlídný text + velké primární tlačítko. Špatně: „Nemáte vytvořené postavy." Správně: „Tvá družina hrdinů tu zatím chybí. [Vytvořit postavu]".
**Proč:** Prázdná obrazovka po registraci je nejkritičtější bod, kde mizí třetina nováčků. **Nejlevnější páka na aktivaci** s velkým dopadem; přirozeně se pojí s onboardingem (16.4).
**Návrh přípravy:** soupis prázdných stavů napříč moduly (postavy, stránky, mapy, chat, kampaně…); sada znovupoužitelných komponent + ilustrace per žánr/skin.
**FE:** sdílená `<EmptyState>` komponenta (ilustrace + text + CTA) nasazená napříč moduly.
**Otevřené otázky:** Ilustrace per skin, nebo neutrální? Texty per modul, nebo generické?

### - [ ] 15.7 Role-based homepage / rozcestník — [H1-02 · dopad vysoký · náklad střední]
**Cíl:** Veřejná úvodní stránka jako rozcestník: *Pro vypravěče · Pro hráče · Pro textové hry · Pro worldbuildery*. Hero s jediným slibem + dvě CTA („Zkusit demo", „Začít zdarma"), pod tím tři pilíře (veď / hraj / udrž komunitu), pak reálný náhled + sociální důkaz (featured světy z 17.3).
**Proč:** Když produkt pokrývá více use-cases, prvních 20 s musí být absolutně čitelných; personalizace dle role snižuje tření a zrychluje aktivaci (tak to dělá Roll20, World Anvil, LegendKeeper).
**Návrh přípravy:** copy per persona; 4 landing podstránky; provázat s vitrínou (17.3) jako náhled a s demo světem (16.4).
**FE:** nová veřejná homepage + 4 landing podstránky.
**Závislosti:** ideálně po 17.3 (vitrína, aby měl hero co ukázat) a 16.4 (demo). Bez SEO (15B) zatím jen marketingová hodnota.
**Otevřené otázky:** Kolik person (4, nebo méně)? Sjednotit s existující úvodní stránkou, nebo nová route?

---

## Fáze 15B — SEO & objevitelnost
**Vlna 2b — Objevitelnost (master-plan H2).** Ikaros má fungovat jako motor uživatelského obsahu: veřejné světy, články, profily a diskuze jsou nejlepší a nejlevnější reklama. Dnes je čistá SPA — Google nevidí skoro nic. Tahle vlna to otevře.

**Předpoklad:** míříme na **veřejnou** platformu (rozhodnuto, viz Otevřené otázky #5). Pokud by se Ikaros měl držet čistě uzavřenou komunitou, celá Fáze 15B + karta 17.3 (vitrína) padají — proto je SEO až po viditelnosti (potřebuje veřejnou vrstvu z 17.3) a před příkopem (veřejná tvorba je nejlevnější akvizice pro CZ scénu).

**Závislosti:** potřebuje veřejnou vrstvu (17.3 vitrína) a veřejnou homepage (15.7).

### - [ ] 15B.1 SSR / prerender veřejných stránek — [H2-01 · dopad vysoký · náklad velký]
**Cíl:** Veřejné stránky (vitrína, články, veřejné profily a světy) servírovat jako hotové HTML — prerender přes headless Chrome (Prerender.io / Rendertron / React Snap) pro crawlery, nebo cílené SSR. Přihlášená část zůstává SPA.
**Proč:** U klientsky renderovaného webu vyhledávač nečeká na JS — bez prerenderu zůstává veřejný obsah neviditelný. Prerender dá Googlebotu plné HTML bez velké změny architektury.
**Návrh přípravy:** rozhodnout prerender vs. SSR; začít prerenderem jen pro veřejné routy (SSR celé app = velký zásah).
**Ops/FE:** prerender služba/proxy NEBO SSR vrstva pro public routy.
**Otevřené otázky:** Prerender (jednodušší) vs. SSR (čistší)? Které routy jsou veřejné?

### - [ ] 15B.2 Meta tagy, title, sitemap, robots — [H2-02 · dopad vysoký · náklad střední]
**Cíl:** `<title>` + meta description per stránka (`react-helmet-async`), `sitemap.xml`, `robots.txt`, canonical URL, breadcrumbs.
**Proč:** Bez sitemap a canonical se veřejný obsah špatně indexuje; title musí odpovídat obsahu, ne být boilerplate. Technický základ celého SEO.
**FE:** helmet-async napříč veřejnými stránkami + generátor sitemap (dynamická → dávkově/cache).
**Otevřené otázky:** Jak generovat sitemap velkých světů? Které stránky do indexu?

### - [ ] 15B.3 Structured data (JSON-LD) — [H2-03 · dopad střední · náklad střední]
**Cíl:** Strukturovaná data: `Article` (články, lore), `ProfilePage` (autoři, světy), `BreadcrumbList`, `DiscussionForumPosting` (veřejné **komunitní diskuze** — modul Diskuze z Etapy I).
**Proč:** Google díky tomu zobrazí náhledový obrázek, datum, hodnocení → vyšší CTR.
> Pozn.: dřívější opora o „veřejná RP vlákna z 16.1" padá — herní příběhy jsou v **privátním** světovém chatu (rozhodnutí 2026-06-15c), neindexují se. Indexovatelný komunitní obsah = články + veřejné diskuze + veřejné světy (vitrína 17.3).
**FE:** JSON-LD generátory podle typu stránky (validovat přes Rich Results Test).
**Otevřené otázky:** Které typy schémat prioritně? Jsou komunitní diskuze veřejné (nepřihlášený je vidí)?

### - [ ] 15B.4 👑 Landing pages pro české systémy — [H2-04 · dopad vysoký · náklad střední] 🔁
**Cíl:** Obsahově bohaté stránky pro Dračí Doupě, DrD II, Jeskyně a Draci, textové hry a worldbuilding — co Ikaros pro daný systém umí, jak začít, ukázky, šablony.
**Proč:** **Český SEO příkop** — globální konkurence to lokálně nenabízí; nejsilnější organická akvizice na českém trhu. Provázané s hloubkovou podporou systémů (16.2).
**Návrh přípravy:** landing šablona + SEO copy per systém (people-first, ne klíčové fráze).
**FE/Obsah:** šablona + obsah per systém.
**Otevřené otázky:** Které systémy první? Provázat 1:1 s rozpadem 16.2a–m?

### - [ ] 15B.5 Academy / evergreen obsah + Core Web Vitals — [H2-05 · dopad střední · náklad střední]
**Cíl:** Redakční seriály („jak založit svět", „jak řídit intriky", „jak hrát textové RPG", „ukázkové světy") + provozní standard rychlosti: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.
**Proč:** Education je akviziční i retenční vrstva (World Anvil Academy, Kanka learning hub); obsahový flywheel — produkt generuje obsah, obsah přivádí uživatele. CWV zlepší UX i ranking.
**Obsah/FE:** redakční obsah (🔁 článkový modul) + perf optimalizace (lazy loading, image pipeline, code splitting).
**Otevřené otázky:** Kdo píše obsah? Dávkovat udržitelně (vyžaduje průběžnou údržbu).

---

## Fáze 16 — Český příkop
**Vlna 3 — Příkop.** Tady je hlavní strategická energie. Zahraniční nástroje to neumí a Discord dělá špatně. Toto je scénář B.

**Závislosti:** těží z hotové Fáze 14–15 (bezpečné a příjemné prostředí), ale 16.1 lze specovat paralelně.

### - [ ] 16.1 Dlouhé příběhy ve světovém chatu (oddělené příběhové kanály) — [E1 · dopad vysoký · náklad malý] 🔁
**Cíl:** Dlouhé, paralelní a **oddělené** příběhy/ságy se hrají **ve světovém chatu** — PJ má kanály jako jednotlivé příběhové linky / místa. **Žádný nový typ chatu.** Karta = ověřit, že stávající chat tohle plně zvládá, a doladit chybějící drobnosti pro vyprávěcí hraní.
**Proč:** Tvé rozhodnutí (2026-06-15c): světový chat **je k tomu uzpůsoben** — kanály/skupiny drží oddělené příběhy, máme hraní „za postavu" (PJ persona + avatar postavy, chat 6.7/6.8). Stavět třetí systém vláken by byl zbytečný náklad i riziko rozbití funkčního chatu.
**Návrh přípravy:** projít existující světový chat skrz potřeby vyprávěcího hraní a vypsat, co (pokud něco) chybí — typicky: odběr kanálu + push na nový příspěvek, archiv/řazení dlouhé linky, čtení dlouhých formátovaných příspěvků na mobilu, snadné přepnutí mluvící postavy.
**BE:** 🔁 spíš drobná rozšíření existujícího chatu (odběr kanálu, případně formátování), **ne** nová entita. Reuse `push`, AKJ pro skrytý obsah.
**FE:** doladění čtení/psaní dlouhých příspěvků v kanálu, persona postavy (máme), mobilní čtení.
> ⚖️ **Trade-off, který bereme vědomě:** rušíme **asynchronní play-by-post** jako samostatný differentiator. Async (psát po dnech, řazení striktně po tazích, vlákno jako dokument) je to, co Discord dělá špatně a co analýzy označovaly za hlavní příkop. Světový **realtime** chat s kanály je blíž tomu, co Discord umí — zprávy sice zůstávají, ale není to plnohodnotná „fórovka 2.0". Vědomá volba: nižší náklad a žádné riziko místo nového systému. Pokud se časem ukáže poptávka po pravém async, dá se 16.1 znovu otevřít.
**✅ Rozhodnuto (2026-06-15c) — žádný nový typ chatu:**
- **Dlouhé / oddělené příběhy → světový chat** (je k tomu uzpůsoben): kanály = příběhové linky / místa, hraní za postavu už máme. Samostatný async play-by-post systém **se nestaví** (viz trade-off výše).
- **One-shoty / večerní oddychovka → globální Rozcestí** (16.6): večerní hra s kamarády, uložit/načíst scénu.
- Tím se ruší dřívější plán „fórovka = nový systém vláken" (2026-06-15a/b). 16.1 je teď jen **doladění existujícího chatu**, ne nová entita.

**Otevřené otázky:** Co konkrétně chatu chybí pro pohodlné dlouhé vyprávění (odběr kanálu? archiv? mobilní čtení dlouhých příspěvků?) — zjistit průchodem reálným chatem (vyžádám si screen). Kdo zakládá příběhové kanály a kdo do nich smí psát (role/skupiny — máme)?

### - [ ] 16.2 👑 Hloubková podpora RPG systémů — dotažení per systém — [E2 · dopad vysoký · náklad velký] 🔁
**Cíl:** Každý systém s deníkem dotáhnout do plnohodnotné podoby ve **třech pilířích**:
1. **Deník** — deníkový list + kostkové mechaniky (hody dle systému, pasti, postih/bonus, dílčí výpočty v rozumné míře).
2. **Bestiář** — kompendium příšer per systém (statbloky v tvaru daného systému, spawnovatelné na mapu).
3. **Dodatky k pravidlům** — předměty, kouzla/schopnosti, vybavení, tabulky — referenční obsah, na který deník a hra odkazují.

**Proč:** Foundry/Roll20 mají pro české systémy slabou/žádnou podporu — **náš příkop**. „Mít schéma" ≠ „mít list s mechanikou, bestiář a pravidlové dodatky". Tohle z Ikara dělá jediné místo, kde se české systémy dají plnohodnotně hrát.

**Společný základ (dělat jednou, sdílet napříč systémy):**
- 🔁 `system-presets` + per-system schema engine (schéma canonical na FE → export do BE, `project_schema_be_fe_sync`).
- 🔁 Bestiář 3-scope (system/user/world) + snapshot při spawnu (`project_bestiar_design`); pilíř „Bestiář" plní **system** scope per systém.
- Kostkový engine s presety hodů per systém (k6/k%/d20/dpool/fudge/3d6…).
- Rozsah „mechaniky": **jen hody + základní výpočty**, ne plná automatizace pravidel (hranice v „Co tato roadmapa NEDĚLÁ").

**Rozhodnuto (2026-06-15):** dotáhnout **všechny systémy, které dnes mají deník**; **prioritně české** (příkop). Každý systém = vlastní podbod níže, každý se třemi pilíři (Deník · Bestiář · Dodatky). Stav každého pilíře značíme zvlášť.

> ⚠️ **Drift k vyřešení** (ověřeno 2026-06-15, dluh D-NEW-SYS-DIARY-DRIFT): **Dračí Hlídka má dvě nesladěná id.** Nabídka ji ukládá jako `world.system = 'draci-hlidka'`, ale deník je registrovaný pod `drdh` (`drdh.ts`: `id:'drdh'`, `name:'Dračí Hlídka'`). → svět „Dračí Hlídka" svůj deník nenajde. **Žádné samostatné „Dračí Doupě Hero" neexistuje** — `drdh` JE Dračí Hlídka. Před rozjezdem 16.2 sjednotit na jedno id napříč vrstvami (nabídka · FE registry/types/preset · BE system-presets). Provázat s 15B.4 (CZ landing pages 1:1 se systémy).

#### Prioritně — české systémy (příkop)
- [ ] **16.2a Matrix / Ikaros pravidla** (`matrix`) — vlastní systém platformy. ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2b Dračí Doupě 1.6** (`drd16`) — k6/k%, postih/bonus, pasti. ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2c Dračí Doupě Plus** (`drd-plus`) — ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2d Dračí Doupě II** (`drd2`) — ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2e Jeskyně a Draci** (`jad`) — ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2f Příběhy Impéria** (`pi`) — ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2g Dračí Hlídka** (`draci-hlidka` / deník pod `drdh`) — ⚠️ **id drift** (D-NEW-SYS-DIARY-DRIFT): sjednotit id, pak dotáhnout tři pilíře. Deník (DrdhSheet, 6 povolání) už existuje. ☐ Deník ☐ Bestiář ☐ Dodatky

#### Parita — zahraniční systémy s deníkem
- [ ] **16.2h Dungeons & Dragons 5e** (`dnd5e`) — d20 + modifikátory. ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2i Shadowrun** (`shadowrun`) — d6 pool. ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2j GURPS** (`gurps`) — 3d6 roll-under. ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2k Fate Core / Accelerated** (`fate`) — 4dF (fudge). ☐ Deník ☐ Bestiář ☐ Dodatky
- [ ] **16.2l Call of Cthulhu** (`call-of-cthulhu`) — k% + sanity. ☐ Deník ☐ Bestiář ☐ Dodatky

#### Engine pro vlastní systém
- [ ] **16.2m Vlastní systém** (`vlastni` / `generic`) — ne dotahovat obsah, ale dát PJ **nástroje**, aby si deník, bestiář i dodatky pravidel vytvořil sám (editor schématu listu + custom bestie + custom dodatky). Tohle je most k Fázi 21 (komunitní tvorba).

**Otevřené otázky:** Kolik automatizace je „akorát" per systém (jen hody, nebo i základní výpočty jako únava/zranění)? Sdílet kompendium/dodatky napříč světy (system scope) i mezi uživateli (→ 21.1)? Pořadí dotahování v rámci priority (DrD 1.6 → JaD → DrD II → …)?

### - [ ] 16.3 Migrace obsahu ze starých fórovek / Matrixu — [E3 · dopad vysoký · náklad střední] 🔁
**Cíl:** Import postav, stránek a vláken ze staré DB; ideálně generický import z phpBB/Webnode exportů.
**Proč:** Komunity nepřejdou, když musí ručně přepsat roky obsahu. Snadný import = rozdíl mezi „zkusím" a „nemám čas"; získává **celé skupiny najednou** — přímá odpověď na síťový efekt. (Migrace uživatelů Matrixu už běží — viz `project_matrix_user_migration`.)
**Návrh přípravy:** zmapovat strukturu staré Matrix DB; navrhnout mapování entit; one-off vs. opakovatelný import; dotáhnout krok 19 z Etapy I (migrace dat).
**BE:** migrační skripty (postavy/stránky/vlákna); idempotence; logování.
**Otevřené otázky:** Jen Matrix, nebo i generický phpBB/Webnode? Mapovat staré účty na nové (vazba na běžící user migraci)? Jak řešit chybějící/nekonzistentní data?

### - [ ] 16.4 Onboarding nového PJ + demo svět — [D2 · dopad vysoký · náklad střední] 👑adopce
**Cíl:** Průvodce při založení světa + volitelný předvyplněný „demo svět" (ukázková stránka, postava, scéna, chat) + kontextové tipy.
**Proč:** Strmá křivka učení je napříč oborem stížnost č. 1; **37 % nováčků odchází do 6 měsíců** kvůli ní. Přímá páka na retenci (viz Příloha A — trychtýř). Nápověda je výborná — tohle je její aktivní, vtažená verze.
**Návrh přípravy:** zmapovat „cestu nového uživatele" (Příloha A); vybrat 3–5 kroků průvodce; seed demo světa (read-only sandbox).
**BE:** seed demo světa (🔁 vzor seedů při create světa).
**FE:** průvodce (wizard) + kontextové tipy + vstup do demo světa.
**Otevřené otázky:** Demo svět sdílený read-only, nebo kopie per uživatel? Průvodce přeskočitelný? Tipy odznačitelné („už nezobrazovat")?

### - [ ] 16.5 Interaktivní mapa s body na stránky — [C1 · dopad vysoký · náklad střední] 🔁
**Cíl:** Na obrázek mapy připíchneš body; klik otevře wiki stránku té lokace.
**Proč:** Spojí geografii s příběhem — dělá svět „živým" (vlajka LegendKeeperu). Máme atlas a 3D vesmír zvlášť, ne klikací piny na 2D mapě.
**Návrh přípravy:** spec na vrstvu pinů nad atlasem (🔁 `world-maps`), navázání na `Page`, řízení viditelnosti přes AKJ.
**BE:** piny jako entita navázaná na mapu + stránku + viditelnost.
**FE:** umístění/editace pinů (PJ), klik → stránka; mobilní ovládání.
**Otevřené otázky:** Piny i na 3D vesmírné mapě, nebo jen 2D atlas? Viditelnost per AKJ úroveň? Vnořené mapy (klik na město → mapa města)?

### - [ ] 16.6 One-shot v Rozcestí — hra na jeden večer + uložení/načtení scény — [dopad střední · náklad střední] 🔁
**Cíl:** Rozcestí (globální chat) jako místo pro **krátké hry na jeden večer**: hráči se sejdou, dají dohromady příběh. Klíčové: **uložit scénu** (taktickou mapu + rozestavení) a **načíst** ji, aby se dala znovu zahrát.
**Proč:** Tvoje zadání (2026-06-15): one-shoty patří do Rozcestí, dlouhé kampaně do světového chatu (viz 16.1). One-shot bez setupu = nízká bariéra, „start in seconds" — přivádí i lidi, co nechtějí zakládat celý svět.
**Návrh přípravy:** rozhodnout, co „scéna" v Rozcestí je (taktická scéna mimo svět? lehčí varianta?); 🔁 sdílení/klonování scén (17.5) + knihovna map (`project_takticka_mapa_library`, full snapshot kromě PC tokenů).
**BE/FE:** uložení scény do (osobní/sdílené) knihovny + načtení do Rozcestí; provázat s taktickou mapou.
**Otevřené otázky:** Scéna v Rozcestí = plná taktická mapa, nebo zjednodušená? Kdo smí scénu uložit/sdílet? Patří k tomu i one-shot kostky/postavy bez světa?

---

## Fáze 17 — Vlajkové funkce
**Vlna 4 — Vlajky.** Vyšší cena nebo závislost na předchozím. „Wow" funkce a růstové páky. Toto je scénář C — až na pevném základu vln 1–3.

**Závislosti:** 17.1 a 17.2 silně těží z Fáze 15.2 (mřížka); dělat až po ní.

### - [ ] 17.1 Dynamické světlo & linie pohledu (LoS) — [B2 · dopad vysoký · náklad velký]
**Cíl:** Token automaticky vidí jen tam, kam dohlédne přes stěny a podle světla.
**Proč:** Náš fog je dnes ruční štětec; automatická vize je herně i atmosféricky o úroveň výš (vlajka Foundry).
**Návrh přípravy:** **velká featura — povinný spec + prototyp.** Vrstva stěn/překážek + výpočet viditelnosti (raycasting; u hexu i čtverce). Výkon na velkých scénách. Doporučení: až po 15.2 a 17.2 (import map se stěnami zlevní obsah).
**BE/FE:** vrstva stěn (editor + úložiště); real-time výpočet vize per token; integrace s fogem.
**Otevřené otázky:** Spočítat na klientovi, nebo serveru? Zdroje světla jako entity? Migrace existujícího ručního fogu?

### - [ ] 17.2 Import hotových map (UVTT / .dd2vtt) — [B4 · dopad střední · náklad střední]
**Cíl:** Načtení mapy ve formátu UVTT (nese i stěny a světla) → hotová scéna.
**Proč:** Obří ekosystém hotových map; jeden import = scéna připravená i pro 17.1. PJ nemusí nic kreslit.
**Návrh přípravy:** spec parseru UVTT → scéna (obrázek + stěny + světla + rozměr mřížky).
**BE/FE:** parser + mapování na naši scénu/stěny.
**Otevřené otázky:** Které varianty formátu podporovat? Kam s licencemi importovaných map (jen vlastní soubory)?

### - [ ] 17.3 Veřejná „výkladní skříň" světa — [C3 · dopad střední · náklad střední] 🔁
**Cíl:** Přepínač „veřejná prezentace" — vybrané stránky/mapa/timeline viditelné i nepřihlášenému.
**Proč:** Celý World Anvil stojí na publikování světa čtenářům; nový zájemce dnes nevidí ukázku, na kterou by se chytil. Marketing i pýcha autora; živí trychtýř (Příloha A, krok 1).
**Návrh přípravy:** 🔁 rozšířit existující `isPublic` + leak-safe filtry; rozhodnout, co lze zveřejnit.
**BE:** veřejné read-only endpointy s přísnými leak-safe filtry (pozor `auth-leak-policy`).
**FE:** veřejná prezentační stránka světa (bez přihlášení).
**Otevřené otázky:** Co všechno jde zveřejnit (stránky/mapa/timeline/postavy)? Per-stránka, nebo per-svět přepínač? SEO/náhledové karty pro sdílení?

### - [ ] 17.4 Doladění mobilní hry na mapě — [D3 · dopad střední · náklad střední]
**Cíl:** Plné dotykové ovládání mapy (pinch-zoom, tažení tokenů, výběr) na malém displeji.
**Proč:** Český hráč hraje hodně z mobilu; dotyk na mapě bývá u VTT bolavé místo (pravidlo projektu „mobil i desktop").
**Návrh přípravy:** cílený průchod skillem `mobil-desktop` přes taktickou mapu.
**FE:** gesta, velikosti dotykových terčů, sbalitelné panely, výkon.
**Otevřené otázky:** Zjednodušené mobilní rozvržení mapy, nebo plná parita s desktopem?

### - [ ] 17.5 Sdílení & klonování světů/šablon — [E4 · dopad střední · náklad střední] 🔁
**Cíl:** „Publikovat jako šablonu" pro svět/scénu/bestii → katalog k naklonování.
**Proč:** Obsah přitahuje obsah; buduje síťový efekt klíčový u niky. Máme privátní knihovnu map — chybí veřejné sdílení.
**Návrh přípravy:** rozhodnout co lze sdílet a co se při klonu nese (pozor na PC tokeny — 🔁 `project_takticka_mapa_library`).
**BE/FE:** veřejný katalog šablon + klonování do světa.
**Otevřené otázky:** Moderovat sdílené šablony? Atribuce autora? Sdílet i celé světy, nebo jen scény/bestie/stránky?

### - [ ] 17.6 Integrace hlasu (odkaz nebo embed Jitsi) — [D4 · dopad střední · náklad malý]
**Cíl:** Pole „hlasová místnost" na úrovni scény/světa + tlačítko „Připojit se k hlasu". Stupně: (1) jen odkaz na Discord/Jitsi; (2) **embed Jitsi přímo do okna Ikara** („vše na jednom okně").
**Proč:** Skupiny chtějí mluvit; **vlastní** hlasový/video stack od nuly (WebRTC SFU, TURN servery) je drahý a křehký — ten neděláme.
> 💡 **Korekce k „zdarma to nepůjde":** „vše v jednom okně" **jde zdarma** přes **Jitsi Meet** — je open-source, `meet.jit.si` je veřejně zdarma a místnost lze **embednout iframem** přímo do scény/světa. Zdarma nejde jen *vlastní* hlasový stack; **integrace cizího (Jitsi) zdarma je**. Volitelně později self-host Jitsi (víc soukromí, vyžaduje server).
**FE:** pole odkazu + tlačítko; embed Jitsi iframe (Jitsi External API).
**Otevřené otázky:** Jen odkaz (nejlevnější), nebo rovnou embed Jitsi? Per scéna, nebo per svět? Self-host Jitsi později kvůli soukromí?

### - [ ] 17.7 Rodokmeny — [C2 · dopad nízký · náklad střední] 🔁 (volitelné)
**Cíl:** Vizuální strom „rodič → dítě / sňatek".
**Proč:** World Anvil i Kanka to mají; fanoušci ság to milují. Naše Pavučina umí obecné vztahy, ne dedikovaný strom.
**Návrh přípravy:** speciální layout nad existujícími `CampaignRelationship` (typy rodič/potomek/choť). Nižší priorita.
**Otevřené otázky:** Samostatná featura, nebo jen nový pohled v Pavučině?

### - [ ] 17.8 Přístupnost (WCAG, klávesnice, čtečky) — [D5 · dopad nízký · náklad malý] 🔁
**Cíl:** Ovládání z klávesnice + popisky pro čtečky u ikonových tlačítek.
**Proč:** Rozšiřuje okruh hráčů a je to správně; kontrastní audit už běží (`audit:contrast`).
**FE:** fokusové stavy, `aria-label`, ovládání chatu/menu z klávesnice (inkrementálně).
**Otevřené otázky:** Cílit konkrétní WCAG úroveň (AA), nebo průběžné zlepšování?

### - [ ] 17.9 Streamer overlay (OBS režim) — [H4-04 · dopad střední · náklad střední]
**Cíl:** Režim zobrazení, který skryje všechna okna/menu/lišty a nechá jen čistou mapu s průhledným pozadím pro chroma key — připravené pro OBS.
**Proč:** Streamování RPG (actual play) je hlavní motor přílivu nováčků; krásný nástroj pro streamery = **exponenciální reklama zdarma**. Z konkurence to dnes umí jen Alchemy.
**Návrh přípravy:** „stream mode" view nad stabilním mapovým enginem; průhledné pozadí + chroma key volby.
**FE:** stream-mode layout (skryté UI) + transparentní pozadí.
**Otevřené otázky:** Jen mapa, nebo i overlay deníku/iniciativy? Konfigurovatelné, co se skryje?

### - [ ] 17.10 Docking / panelový workspace + kontextové palety — [H4-07 · dopad střední · náklad velký]
**Cíl:** Encyklopedie/karta nestvůry se při hře otevře jako přesunovatelný boční panel nebo plovoucí okno (minimalizovat do lišty, obnovit) — místo opouštění mapy. Plus kontextové menu na pravý klik a plovoucí palety přesně u kurzoru (Fittsova ergonomie).
**Proč:** PJ při bitvě překlikává spoustu oken — context switching ničí plynulost. Nejlepší webové appky (Notion, Figma) fungují jako operační systém, ne stránka.
**Návrh přípravy:** state-management pro docking/plovoucí okna; **začít side-drawerem**, plovoucí okna později (komplexita stavu).
**FE:** docking framework + kontextová menu.
**Otevřené otázky:** Side-drawer napřed, nebo rovnou plovoucí okna? Ukládat rozložení panelů per uživatel?

### - [ ] 17.11 Companion mobilní režim — mobil jako deník — [H4-06 · dopad střední · náklad velký] 🔁
**Cíl:** Na mobilu se Ikaros během hry přepne do role **asistenta hráče**: místo obří mapy velký interaktivní **deník postavy** (záložky, obří HP, masivní tlačítka útoků/hodů, které odešlou hod na hlavní mapu sdílenou třeba na TV). Komunita/pošta ve stylu WhatsApp/Discord se spodním tab barem.
**Proč:** Vtlačit 4K mapu na 6" displej je chyba — mobil není na hraní mapy, mobil je **osobní deník**. Český hráč hraje hodně z mobilu. Rozdělit zážitek podle zařízení. (Rozšiřuje 17.4, které řeší jen dotyk na mapě.)
**Návrh přípravy:** cílený `mobil-desktop` průchod; sdílet logiku s desktopem, lišit jen layout (dvě UI varianty = víc údržby).
**FE:** dedikované mobilní pohledy (deník, komunita) + bottom tab bar; hod z mobilu → sdílená mapa.
**Otevřené otázky:** Auto-přepnutí dle zařízení, nebo volba? Které moduly mají mobilní companion verzi?

### - [ ] 17.12 Živá příběhová mapa napojená na hru (chat / bojová scéna) — [nápad 2026-06-15 · dopad střední · náklad střední] 🔁
**Cíl:** U vlajkové hry vidí hráči **aktivní mapu napojenou na probíhající hru** — na chat nebo přímo na bojovou scénu — kde koukají, **kde zrovna jsou v příběhu**. Mapa se „rozsvítí" u aktuální lokace/scény, kterou hra právě řeší.
**Proč:** Spojuje příběh s geografií živě — hráč neztrácí orientaci v ságe; posiluje imerzi. Tvůj nápad (2026-06-15) — „zajímavá varianta". Staví na interaktivní mapě s piny (16.5) a propojuje ji se stavem hry (aktivní scéna / chat kanál → pin na mapě).
**Návrh přípravy:** rozhodnout, co je „aktuální poloha v příběhu" (aktivní scéna? kanál světového chatu? ručně PJ?); navázání pin (16.5) ↔ scéna/kanál; 🔁 taktická mapa + per-player scene assignment (`project_takticka_mapa_assignment`), world-room WS signál (`project_map_world_room_join`).
**BE/FE:** vazba aktivní scény/kanálu na pin mapy; živý ukazatel „tady jste" (push/WS); read-only pohled pro hráče.
**Otevřené otázky:** Polohu nastavuje PJ ručně, nebo se odvozuje z aktivní scény/kanálu automaticky? Per hráč (každý jinde), nebo sdílená pozice družiny? Napojit na fórovku/Rozcestí (16.1/16.6) i na světový chat?

---

## Fáze 18 — AI asistence
**Vlna 5 — AI horizont.** Nejteplejší trend oboru. Nestavíme AI — chytře integrujeme tam, kde ušetří PJ čas. **Až na pevném jádru.** Vždy volitelné, transparentní, s limity.

**Závislosti:** stabilní jádro (Fáze 14–16). 18.2 se hezky pojí s 16.1 (fórovka).

> **Společné mantinely celé Fáze 18 (k odsouhlasení dřív, než cokoli začne):** každé volání AI stojí peníze → **tvrdé limity + fronty + sledování nákladů**; AI obsah vždy **označený**; vše **opt-in**; respektovat, že část komunity AI (zvlášť art) odmítá. Provázat s Fází 19.2 (náklady) a 20.3 (právo/etika).

### Proveditelnost a náklady (odpověď na „jak a jestli to půjde") ✅
**Jde to, a je to levné.** Technicky je každá z funkcí 18.1–18.3 **jediné volání API** (přes oficiální Anthropic SDK na BE) — pošleme kontext světa/systému + požadavek, dostaneme text/obrázek, uložíme jako koncept k doladění. Žádná složitá agentní infrastruktura, žádný „AI vypravěč".
- **Model:** Claude (Opus 4.8 nejchytřejší — $5/$25 za 1M tokenů vstup/výstup; pro tahle jednoduchá generování bohatě stačí levnější **Haiku 4.5** $1/$5 nebo Sonnet 4.6 $3/$15). Volba modelu = ladění ceny vs. kvality.
- **Cena za úkon (odhad):** vygenerování NPC ≈ **0,1–0,6 Kč**; shrnutí dlouhého vlákna ≈ **0,3–1,5 Kč** (dle modelu). Stovky úkonů měsíčně = jednotky až nižší desítky korun.
- **Levnější přes „cache":** opakovaně používaný kontext světa/systému lze cacheovat → čtení ~10 % ceny.
- **Pojistky:** denní/měsíční limit na uživatele/svět + fronta (Fáze 19.2), aby náklady neutekly.
- **Levnější (nulová) alternativa = procedurální generátory** z dat a náhodných tabulek (jména, věk, vzhled, příběhy, rodina…) — **bez peněz**, plně v naší režii, viz **Fáze 21.2**. AI je pak volitelná *chytřejší* vrstva nad nimi (uhladit text), ne náhrada.
- **Závěr:** technicky triviální, finančně zanedbatelné. Otázka není „jestli to půjde", ale „jak moc to chceme a kde dát limity".

### - [ ] 18.1 Generátor NPC & popisů na klik — [F1 · dopad střední · náklad střední]
**Cíl:** Tlačítko „navrhni NPC" (jméno, povaha, vzhled, krátké pozadí) a „rozveď popis" na stránce/postavě.
**Proč:** Zkracuje přípravu z hodin na minuty — silný důvod zůstat.
**Návrh přípravy:** vybrat AI poskytovatele a model; promyšlené promptování v kontextu světa/systému; limity per uživatel/svět. *(Pozn.: při návrhu napojení na Claude/Anthropic API použít skill `claude-api`.)*
**BE:** služba s frontou + limity; ukládání výstupu jako konceptu k doladění.
**FE:** tlačítka v editoru stránky/postavy; jasné označení „návrh AI".
**Otevřené otázky:** Který poskytovatel? Limit volání (denní/měsíční)? Kdo platí náklady (provoz vs. podporovatelé)?

### - [ ] 18.2 AI shrnutí session / příběhového kanálu — [F3 · dopad nízký · náklad malý] 🔁
**Cíl:** Z dlouhého **příběhového kanálu světového chatu** (16.1) nebo session vytvoří „co se stalo minule".
**Proč:** U dlouhých ság, kde kanál žije týdny, je shrnutí zlato — hráč rychle dožene děj.
**BE/FE:** poslat text kanálu na AI → uložit shrnutí ke kanálu/scéně.
**Otevřené otázky:** Automaticky, nebo na vyžádání? Kdo shrnutí vidí (PJ/all)?

### - [ ] 18.3 AI portréty & ilustrace — [F2 · dopad nízký · náklad střední]
**Cíl:** Generování portrétu postavy/NPC nebo ilustrace lokace v editoru.
**Proč:** Vizuál zvedá zážitek; ne každý umí kreslit/hledat obrázky.
**Návrh přípravy:** vybrat generátor obrázků; 🔁 nahrání do Cloudinary; **zvážit licenční/etické otázky AI artu** (část komunity odmítá → volitelné, označené).
**Otevřené otázky:** Vůbec ano? Pokud ano, jen volitelně a viditelně označené? Náklady na generování obrázků?

---

## Fáze 19 — Růst, metriky & udržitelnost
**Přílohy A + B.** Aby platforma nejen fungovala, ale **rostla a uživila se** (časem i tvého času). Většinou levné, vysoký nepřímý dopad.

### - [ ] 19.1 Onboarding funnel & metriky retence — [Příloha A]
**Cíl:** Sledovat jednoduchý trychtýř (příchod → registrace → první akce → první hra → návrat) a hlavní metriku **„kolik lidí se příští týden vrátí"**.
**Proč:** Lidé padají na kroku 1 a 3 (nepochopení, prázdná první obrazovka), ne na herních funkcích. Měřit = vědět, kde tlačit.
**Návrh přípravy:** rozhodnout, co a jak měřit (i ručně/odhadem stačí); respektovat soukromí (žádné invazivní trackování).
**Otevřené otázky:** Vlastní lehké metriky, nebo žádný externí analytics kvůli soukromí? Co přesně sledovat?

### - [ ] 19.2 Náklady & limity (storage kvóta, AI limity) — [Příloha B] 🔁
**Cíl:** Předvídatelné náklady — kvóta na úložiště per uživatel/svět + tvrdé limity AI.
**Proč:** Cloudinary i AI volání jsou platba dle objemu; bez limitů náklady utečou. Známé dluhy **D-NEW-UM10** (chybí kvóta), AI limity z Fáze 18.
**BE:** kvóty + počítadla; limity/fronty pro AI.
**Otevřené otázky:** Výše kvót? Co dělat při překročení (blok vs. upozornění)?

### - [ ] 19.3 Odstřižení od starého webu → **přesunuto do 14.8** (Pojistka)
> Patří do bezpečnostní pojistky, ne do růstu — starý web může zhasnout kdykoli (riziko R5), PDF to řadí do H0. Plné zadání viz **[14.8](#--148-odstřižení-od-starého-webu-smtp--embedding-model--h0-08--dopad-střední--náklad-střední--přesun-z-193)**.

### - [ ] 19.4 Model podpory (dary / „podporovatel") — [Příloha B]
**Cíl:** Dobrovolné dary/Patreon na provoz; drobná kosmetika jako poděkování (nikdy herní výhoda).
**Proč:** Komunita ráda přispěje na projekt, který má ráda; štědrý free základ zůstává konkurenční výhodou.
**Otevřené otázky:** Vůbec teď, nebo až platforma žije (scénář A)? Jaká kosmetika je „fér" (odznak/barva), aby nerozdělila komunitu?

### - [ ] 19.5 LFG / nábory (objevování her a hráčů) — [analýza sekce 5] 🔁
**Cíl:** Lehké „hledám hru / hledám hráče" — nábory navázané na přehled světů + adresář.
**Proč:** Reálná potřeba i v ČR, kterou nikdo česky neřeší; pomáhá proti prázdné platformě (krok 5 trychtýře).
**Otevřené otázky:** Samostatná featura, nebo rozšíření přehledu světů? Moderace náborů?

---

## Fáze 20 — Governance, právo & moderace
**Příloha C.** Co platformu chrání před lidskými a právními riziky. „Mít připraveno", ne hasit.

### - [ ] 20.1 Pravidla komunity + nahlašování všude — [Příloha C] 🔁
**Cíl:** Jasná pravidla komunity + viditelné nahlašování u veškerého uživatelského obsahu.
**Proč:** Platforma s uživatelským obsahem přitáhne i nevhodný; máme základ (nahlašování, role správců) — sjednotit a zviditelnit.
**Otevřené otázky:** Kde všude nahlašovat (chat/vlákna/galerie/profily)? Eskalace k moderátorům?

### - [ ] 20.2 Zásady ochrany údajů (GDPR) + nezletilí — [Příloha C] 🔁
**Cíl:** Stránka zásad ochrany údajů + ohledy pro nezletilé hráče.
**Proč:** V ČR/EU platí GDPR; máme self-delete s anonymizací a data-export modul — doplnit transparentnost a souhlas. Dluh **D-010** (GDPR souhlas).
**Otevřené otázky:** Věková hranice/souhlas rodičů? Co vše zveřejnit v zásadách?
> 🔗 **Podmínky užití:** pracovní **verze 1.0** vydaná 2026-06-18 (FE `TermsPage`, BE `TERMS_VERSION='1.0'`). Zbývá **finální právní revize (advokát)** po beta — to je tady. Před veřejným nasazením blokující.

### - [ ] 20.3 Obsah & autorská práva (upload, AI art) — [Příloha C]
**Cíl:** Pravidla pro nahraný obsah (cizí autorská práva) a označování AI obsahu.
**Proč:** Riziko u nahraných obrázků i AI artu (Fáze 18); část komunity AI odmítá.
**Otevřené otázky:** Jak řešit nárokovaný cizí obsah (takedown postup)? Povinné označení AI obsahu?

### - [ ] 20.4 Udržitelné tempo / anti-burnout / bus factor — [Příloha C]
**Cíl:** Chránit hlavní (a možná jediný) zdroj — tebe: udržitelné tempo, dokumentace, automatizace.
**Proč:** Vyhoření a „bus factor 1" (vše v jedné hlavě) jsou reálná rizika sólo projektu. Kryje se s automatizací (14.4, 14.5) a kvalitou docs (máme).
**Otevřené otázky:** Jak nastavit udržitelný rytmus vln? Co je minimum dokumentace, aby projekt přežil pauzu?

---

## Fáze 21 — Komunitní tvorba & sdílený obsah
**Vize: obsah dělá komunita.** Tvůj původní záměr (chtěl jsi spoustu věcí vytvořit sám) se mění na *udržitelnější* model: platforma dá **nástroje, generátory a sdílené knihovny**, a komunita je plní. Dlouhodobě nejbohatší zdroj obsahu — a nezávislý na jednom člověku.

**Závislosti:** těží z 17.5 (sdílení), bestiáře (scope system/user/world) a schvalovacích toků (máme u článků/galerie). Procedurální generátory (21.2) jsou **zdarma** a nezávislé na AI.

### - [ ] 21.1 Globální/komunitní knihovny obsahu (items, bestie, kouzla, šablony) — [dopad vysoký · náklad střední] 🔁
**Cíl:** Sdílené knihovny, do kterých komunita přidává: **vlastní předměty (items)**, bestie, kouzla, šablony stránek/postav — klonovatelné do libovolného světa.
**Proč:** Obsah přitahuje obsah; jeden přidaný statblok/item poslouží stovkám PJ. Rozšiřuje bestiář (dnes 3 scope) o **komunitní/globální scope** a navazuje na sdílení (17.5). Pokrývá tvoje „custom itemy, globální itemy, globální bestie".
**Návrh přípravy:** rozhodnout 4. „globální/komunitní" scope vedle system/user/world; atribuce autora; verzování; snapshot při klonu (🔁 bestiář spawn semantics).
**BE/FE:** rozšíření bestiáře + nové typy „global item/spell"; katalog + klonování; 🔁 upload pro obrázky.
**✅ Rozhodnuto (2026-06-15) — kdo smí přidávat do globálu:** defaultně **Admin, Superadmin, vedoucí diskusí (SpravceDiskuzi)**. Navíc **grantovatelná pravomoc běžnému hráči**, který má nápady (per-user flag „smí přispívat do globální knihovny", uděluje admin/správce). 🔁 vzor granular permissions (D-031) + grant model jako AKJ clearance.
**Otevřené otázky:** Pre-moderace (schválit před zveřejněním) vs. post (nahlásit)? Jak grant hráči udělovat (na žádost, nebo proaktivně)? Jak řešit kvalitu (hodnocení, kurátor → 21.4)?

### - [ ] 21.2 Procedurální generátory postav & detailů (zdarma) — [dopad vysoký · náklad velký] ✅bez-AI
**Cíl:** Generátory, které z **dat a náhodných tabulek** vytvoří cokoli, co postava má: **jména, výšku, věk, vzhled, povahu, životní příběh, rodinu/rodokmen, majetek…** Jednoduché, deterministické, **bez jakýchkoli nákladů**.
**Proč:** Tvůj preferovaný směr — žádné peníze za AI, plně v naší režii. Klasický a oblíbený nástroj (Dračí Hlídka má podobné). „Jen to bude dost práce" = hlavní náklad jsou **datové tabulky**, ne kód.
**Klíč:** tabulky plní a rozšiřuje **komunita** (váže na 21.1) — per-systém i per-svět sady (české jméno ≠ elfí ≠ sci-fi). Generátor je tenká vrstva nad daty.
**Návrh přípravy:** návrh datového formátu tabulek (vážené položky, podmínky, **vnořené generátory** — „rodina" volá „jméno"); seed základních CZ/fantasy sad; UI „vygeneruj / přegeneruj / zamkni pole".
**BE/FE:** generátor engine (weighted random + skládání) + editor tabulek + napojení na tvorbu postavy/NPC.
**Vztah k AI (Fáze 18):** procedurální = **zdarma a výchozí**; AI (18.1) je volitelná *chytřejší* vrstva pro souvislý text (uhladit vygenerovaný příběh) — ne náhrada.
**Otevřené otázky:** Které generátory první (jména → příběh → rodina)? Formát tabulek pro komunitní příspěvky? Per-systém vs. globální sady?

### - [ ] 21.3 Stavitel & generátor podzemí / map — [H4-01 · dopad střední · náklad velký] 🔁
**Cíl:** Tvorba map + procedurální generátor podzemí s parametry (velikost, téma) a tlačítkem „Přegenerovat, dokud se nelíbí" → výsledek rovnou na taktickou mapu jako scéna. Volitelně AI obrázek (18.3). Inspirace: Azgaar na úrovni dungeonů.
**Proč:** Tvůj původní oblíbený nápad; „nástroj pro líné vypravěče", skvělý na one-shoty (16.6), šetří PJ kreslení. Procedurální = zdarma; navazuje na import map (17.2).
> ⚠️ **Oprava nesrovnalosti (ověřeno 2026-06-15):** Dungeon Builder **NENÍ hotový** — [DungeonBuilderPage.tsx](src/features/admin/pages/DungeonBuilderPage.tsx) je `[stub] Dungeon builder` (prázdná stránka). Dřívější formulace „reuse, už máme tile editor s exportem" byla **chybná**. 21.3 = postavit od nuly (editor mřížky + generátor + napojení na scénu), ne reuse. Návod (kap. 26) ho slibuje jako hotový — i dokumentaci opravit.
**Návrh přípravy:** generační algoritmus + editor mřížky (čtvercová z 15.2) + napojení na scénu; kurátorské šablony témat proti generickému výstupu.
**Otevřené otázky:** Jen dungeony, nebo i exteriéry/města? Procedurální layout vs. jen knihovna dílků?

### - [ ] 21.4 Kurátorství & moderace komunitního obsahu — [dopad střední · náklad střední] 🔁
**Cíl:** Schvalování, hodnocení a atribuce sdíleného obsahu (items/bestie/mapy/generátorové tabulky).
**Proč:** Komunitní obsah potřebuje kvalitu a moderaci; 🔁 schvalovací toky, co už máme (články/galerie), + role správců.
**Otevřené otázky:** Pre-moderace (schválit před zveřejněním) vs. post (nahlásit)? Kdo kurátoruje (noví správci)?

---

## Průřez Ú — Úklid dluhů & nesrovnalostí z inventury funkcí (docs/funkce)

> **Vznik:** 2026-06-18, z kódem ověřené inventury [`docs/funkce/`](funkce/00-prehled.md) (16 kapitol, snímek k 2026-06-18). Každá kapitola má sekci „⚠️ Nesrovnalosti & dluhy".
> **Cíl Etapy II:** na konci Etapy II = **0 otevřených** „⚠️ Nesrovnalostí" v `docs/funkce/`. Skill `funkce` drží inventuru živou; tahle tabulka drží úklid.
> **Dva koše:** **(1) rychlé fixy** — chybný text v nápovědě / komentáři / labelu („máme to lepší") — se řeší **mimo roadmapu** jako průběžný úklid (soupis vede Claude, dohodnuto 2026-06-18). **(2) reálná práce** níže, namapovaná na fáze + dluhy v `docs/dluhy.md`.

| Téma | Co dotáhnout (reálná práce) | Fáze | Dluh |
|---|---|---|---|
| **Bezpečnost účtu/světa** | Sjednotit min. délku hesla (registrace 6 → 8); ověřit/zavřít nechráněný `GET /users/profile/:id` (možný leak — bez friend-only/tombstone gate); sanitizovat `themeUserOverrides` v `updateMyTheme`; doplnit role-floor na `POST /campaign/scenarios` (storyboard tvoří i hráč); ověřit únik reálného jména přes render-time PJ persona v push/feed/exportu | 14 | D-NEW-INV-SEC |
| **Push & notifikace** | `url` do push payloadu (deep-link novinky + chat — SW připraven, payload prázdný); throttle/opt-out + vyloučit odesílatele u globálního chatu (dnes push na **každou** zprávu všem); push i pro poštu; per-typ předvolby místo jediného přepínače | 14.8 / 15.1 | D-NEW-INV-PUSH |
| **Chybějící admin/účet UI** | FE pro existující BE endpointy: reset hesla uživatele, založení uživatele adminem, změna cizího e-mailu; konzument GDPR `GET /data-export/me`; „odhlásit všechna zařízení" (logout-all) | 14.7 / 20.2 | D-NEW-INV-ADMIN-UI |
| **Profil & uživatelé** | Napojit „Moje diskuze / články / galerie" (dnes stub „dostupné ve fázi 3"); per-role taby `/ikaros/uzivatele` (implementovat, nebo odstranit mrtvý `role` param); validace `displayName` (min/regex); `worldsCount` u karet přátel (dnes 0) | 15.6 / 16.4 | D-NEW-INV-PROFILE |
| **Stránky & wiki** | Tabulky v `page.content` se ve vieweru zahazují (read layouty bez `enableTable`) → přidat do readonly vieweru, nebo v editoru zakázat / převést na sekce; smazaná seedovaná stránka (`pravidla`/`magicky-system`/`technologie`) → mrtvý odkaz v menu „Informace" (2 nepropojené vrstvy) | 15.5 | D-NEW-INV-WIKI |
| **Data konzistence** | Staty/HP tokenu PC/NPC se z taktické mapy nepropisují do listiny postavy (TODO v `map-operations`); `updateCurrencies` full-replace → delta merge (riziko ztráty měn); subdoc finance/výbava se zakládají i pro NPC/Lokaci, ale nejdou přečíst (orphan data); odstranit legacy `GET /characters/directory` | 16.2 | D-NEW-INV-DATA-SYNC |
| **Mapy & nástroje** | Dokončit undo (`scene.deactivate`, `member.bulkAssignToScene` mají `inverse=null`); sjednotit role-prahy (atlas „Mapy" = PJ vs. ostatní nástroje = PomocnyPJ); combat order dvojí zdroj pravdy (`scene.combat.order` vs. live-sort); pozn.: „A* pohyb" reálně jen dosah — buď doplnit pathfinding (velká featura, → 17.x), nebo opravit spec (rychlý fix) | 17.x | D-NEW-INV-MAPS |
| **Čas & kaskády** | Mazání kalendářového configu nečistí navázané timeline/akce (cascade); soft-delete akcí bez cleanup jobu; in-game datum (modul Počasí) vs. „Dnes" v `/kalendar` z reálného data; `/akce` chybí v hlavní nav liště; odstranit prošlý legacy redirect `/sprava-udalosti` + překlep route `/calenders` | 14.9 | D-NEW-INV-CASCADE |
| **Úklid kódu** | Vyhodit legacy world role z BE `UserRole` (3–8, FE už nemá); mrtvý flag `canEditPlatformPages`; `Tyky` hardcoded admin bypass (3× service) → role/flag; in-memory paginace `getUsers`; tichý fail MeiliSearche → health/chyba místo prázdna; centralizovat duplikovaný favorites toggle; sync audit-log labelů FE↔BE | 14.9 | D-NEW-INV-CLEANUP |

> **Záměrné chování (NE dluh — jen zdokumentováno v inventuře, neopravuje se):** R-20 (platform Admin „nahlíží", nespravuje cizí svět), `assertMember` práh = Hrac, AKJ vs. page-level bypass PomocnyPJ, finance/výbava 404 pro NPC/Lokaci, soft-mode validace statů bez schématu, názvosloví „kanál/konverzace" a `public`/`open`. Tyhle se jen drží v průvodci jasně vysvětlené.

---

## Otevřené strategické otázky (k diskuzi, než se rozjede Etapa II)

**✅ Rozhodnuto (2026-06-15):**
1. **Pořadí** — interleave OK (14.4 zálohy + 16.1 fórovka spec hned, zbytek postupně).
2. **Fórovka vs. chat (definitivně 2026-06-15c)** — **žádný nový typ chatu.** Dlouhé/oddělené příběhy = světový chat (kanály = příběhové linky, je k tomu uzpůsoben); one-shoty = Rozcestí (16.6). Samostatný async play-by-post se **nestaví** (16.1 = jen doladění chatu). Trade-off (ztráta čistě async differentiatoru) vědomě přijat.
3. **AI vs. generátory** — character/detail generátory dělat **procedurálně (zdarma, Fáze 21.2)**; AI (Fáze 18) jen jako volitelná chytřejší vrstva, proveditelné a levné, hlídané limity (19.2).
4. **Ambice** — míříme až na **C**; A+B je začátek, pak doháníme stůl. „Trumfnout všechny."
5. **Obsah = komunita** — platforma dává generátory a knihovny, komunita plní (Fáze 21).
6. **Veřejnost (17.3, 15B) — hybrid:** platforma **je veřejná** a aktivně nabírá venkovní komunitu (skupiny, lidi, fanoušky fantasy) → SEO (15B) + vitrína (17.3) ve scope. **Zároveň** musí umět hostit **oddělené, uzavřené komunity a skupiny** vedle sebe. Veřejnost je tedy **opt-in per svět/obsah** (veřejné světy nabírají, soukromé zůstávají skryté a leak-safe).
7. **Systémy (16.2) — všechny s deníkem, prioritně české:** dotáhnout všechny systémy, které dnes mají deník, každý ve třech pilířích (deník · bestiář · dodatky pravidel). Rozpad 16.2a–m. České prioritně.
8. **Globální scope (21.1):** zavést komunitní/globální scope; přidávat smí Admin/Superadmin/SpravceDiskuzi + **grantovatelně i běžný hráč** s nápady (viz 21.1).

**Stále otevřené:**
9. **Drift systémů:** `draci-hlidka` (id v nabídce) ↔ `drdh` (id deníku) = **táž Dračí Hlídka, dvě id** → sjednotit před 16.2 (dluh D-NEW-SYS-DIARY-DRIFT, viz drift v 16.2).
10. **Generátory (21.2):** které první (jména → příběh → rodina)? Formát tabulek pro komunitní příspěvky?
11. **Veřejnost — detaily (17.3):** co přesně lze zveřejnit (stránky/mapa/timeline/postavy)? Per-stránka, nebo per-svět přepínač? SEO náhledové karty?
12. **Co chybí světovému chatu pro dlouhé příběhy (16.1):** zjistit cíleným průchodem reálným chatem (vyžádám si screen).
13. **Hlas zdarma (17.6):** Jitsi embed (open-source, zdarma) vs. jen odkaz na Discord — ověřit proveditelnost embedu „vše v jednom okně".

---

## Co tato roadmapa záměrně NEDĚLÁ

- **Plná automatizace pravidel** à la Foundry/Fantasy Grounds — bezedná údržba vázaná na jeden systém; rozbila by univerzálnost 13 systémů.
- **Plné 3D / vlastní hlasový/video stack** — drahé, mimo rozsah; atmosféru řešíme jinak (počasí, hudba), hlas přes odkaz (17.6).
- **Vlastní marketplace s prodejem obsahu** — platforma není o penězích; sdílení zdarma (17.5) ano, prodej ne.
- **Internacionalizace (angličtina)** — cíl je česká scéna; dveře nechat architektonicky otevřené, ale neinvestovat.
- **Nativní mobilní appka (App Store/Play)** — PWA (15.1) dá 90 % přínosu bez schvalování a druhé kódové základny.
- **AI na sílu** — vždy opt-in, označené, s limity.

---

## Appendix A — KPI & metriky (master-plan §08)

> Nejčastější chyba podobných produktů: přeměřovat „registrace" a podměřovat **aktivaci**. Severka Ikara = **týdně aktivní vypravěči a hráči, kteří udělali smysluplnou akci** (lepší než MAU — Ikaros žije z vracení a sociálního použití). U hobby projektu stačí měřit **ručně/odhadem** — jde o směr, ne přesnost. Detailní napojení v 19.1.

| Vrstva | KPI | Co sledovat |
|---|---|---|
| Akvizice | CTR homepage → registrace | dle role (PJ / hráč / textovka) |
| Aktivace | signup → first value | otevřel demo, vytvořil svět, přijal pozvánku, založil vlákno |
| Aktivace | time to first value | minuty do první smysluplné akce |
| Engagement | WAU storyteller / WAU player | týdně aktivní vedení vs. hraní |
| Retence | D7 / D30 / W4 | po registraci i po prvním vytvoření světa |
| Komunita | invite-to-join rate | poměr pozvaných, kteří se přidají |
| Showcase | showcase → signup CTR | kolik lidí chytne read-only svět (17.3) |
| Příběhové hraní | první příběhový kanál / příspěvek za postavu / návrat do kanálu | světový chat (16.1) + Rozcestí one-shot (16.6) |
| Trust | 2FA adoption, restore-drill success, moderation SLA | provozní zdraví (14.1, 14.4) |
| SEO | index coverage, organic landing mix, CZ-system traffic | růst bez placené akvizice (15B) |

**Jedna metrika, která stačí:** *„Kolik lidí se příští týden vrátí?"* (týdenní návratnost). Roste → děláme správné věci. Neroste → problém je v trychtýři výš.

**Event taxonomie (minimum):** `view_homepage` · `select_role` · `view_showcase_world` · `sign_up_completed` · `open_demo_world` · `create_world_completed` · `first_page_created` · `first_map_opened` · `first_invite_sent` · `first_player_joined` · `pwa_install` · `push_opt_in` · `create_story_channel` · `post_in_story_channel` · `start_oneshot_rozcesti` · `return_after_7_days`

---

## Appendix B — Vizuální design systém (master-plan §10)

> **Princip > konkrétní barva.** Ikaros má vlastní fialovou synthwave identitu + 21+11 přepínatelných skinů — z master-planu bereme **principy** (hierarchie karet, animace, tmavý režim), ne paletu. Barvy řeší existující theme systém scoped na `[data-theme]` (`feedback_theme_isolation`, `project_theme_root_ownership`).

- **Typografie:** nadpisy/UI = čistá geometrická bezpatková (Inter/Outfit/Poppins); dlouhé čtení (lore, fórovka) = volitelně patkové (Merriweather/Lora) — méně únavy při stovkách odstavců.
- **Barvy & hierarchie (role, ne hex):** primární akce = kontrastní akcentová per-skin; premium/highlight = zlatavá výjimečně; destruktivní = červená jen na mazání + dvoufázové potvrzení; tmavý režim = hluboká šedomodrá, **nikdy `#000`**. Overlaye přes `rgb(var(--white-rgb)/α)`, ne hardcode (`project_overlay_rgb_tokens`).
- **Karty/stíny/pohyb:** jemné zaoblení 6–8 px + decentní stín; **žádná UI animace nad 150–250 ms** (ease-in-out) — appka musí působit „ostře", ne líně.
- **Přístupnost & mobil (→ 17.8):** ARIA štítek + ovladatelnost z klávesnice (WCAG 2.2); na mobilu velké terče, bottom sheets, sbalitelné panely, pinch-zoom mapy; skeleton screens místo prázdna; haptická odezva při uložení (PWA). Audit kontrastu už běží (`audit:contrast`).
- **Pravidlo projektu:** po každé grafické úpravě UI skill `mobil-desktop`; před spec na design skill `frontend-design`.

---

## Zdroje a souvislosti

- *Návrh budoucích změn — master-plan rozvoje* (2026-06-15) — strategický + implementační podklad, 6 horizontů H0–H5, ~50 karet, ověřeno proti kódu FE+BE. **Hlavní zdroj této revize.**
- *Hloubková strategická analýza* (2026-06-14) — `~/Downloads/Ikaros-hloubkova-analyza.pdf`, `~/Downloads/Ikaros-analyza-vylepseni.pdf` (mapování bodů A1–F3, profily konkurence, trendy, český rozbor).
- Etapa I — `docs/roadmap-fe.md` (fáze 0–13).
- Navázané dluhy: PC-01 (captcha), PC-02/PC-21 (starý web), D-011 (captcha provider), D-010 (GDPR), D-028 (Redis throttler), D-NEW-UM10 (storage kvóta), D-031 (granular permissions).
- Dluhy z inventury funkcí (Průřez Ú): D-NEW-INV-SEC, D-NEW-INV-PUSH, D-NEW-INV-ADMIN-UI, D-NEW-INV-PROFILE, D-NEW-INV-WIKI, D-NEW-INV-DATA-SYNC, D-NEW-INV-MAPS, D-NEW-INV-CASCADE, D-NEW-INV-CLEANUP (zdroj: `docs/funkce/`).
- Navázané audity: prod-config, log-hygiene, error-contract, nav, ws, cascade-delete, db-integrity (viz `docs/`).

> **Tento dokument je živý návrh.** Po společné diskuzi se upraví priority, rozsah a otevřené otázky se rozhodnou. Teprve pak vzniká per-featura spec a plán.
