# Roadmap 2 — Projekt Ikaros · Etapa II

**Vyspělost · diferenciace · růst**

**Stav:** návrh k diskuzi (nic z Etapy II nezačato)
**Vznik:** 2026-06-14, odvozeno z *Hloubkové strategické analýzy* (PDF v `~/Downloads/Ikaros-hloubkova-analyza.pdf` + `Ikaros-analyza-vylepseni.pdf`)
**Navazuje na:** `docs/roadmap-fe.md` (Etapa I, fáze 0–13 — jádro platformy)
**Repo:** FE `Projekt-ikaros-FE` · BE `Projekt-ikaros`

> **Jak číst tuto roadmapu.** Tohle je **mapa směru, ne závazek k provedení**. Každý bod má *Cíl*, *Proč*, *Návrh přípravy*, hrubý *BE/FE rozsah* a **Otevřené otázky k diskuzi** — protože konkrétní podobu každé featury teprve doladíme. Nic se neimplementuje bez schválení a bez obvyklého workflow **spec → souhlas → impl. plán → souhlas → kód** (skill `spec-driven-development`), u UI navíc design audit (`frontend-design`) a `mobil-desktop`.
>
> Značky u nadpisů: `[kód z analýzy · dopad · náklad]`. Cíl je dělat **vysoký dopad / malý náklad** první. `🔁 reuse` = stavíme na existujícím modulu, ne od nuly.

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
| 16 | Český příkop | Vlna 3 — Příkop | Svět + Komunita | ⬜ |
| 17 | Vlajkové funkce | Vlna 4 — Vlajky | Svět | ⬜ |
| 18 | AI asistence | Vlna 5 — AI horizont | Svět + Platforma | ⬜ |
| 19 | Růst, metriky & udržitelnost | Příloha A + B | Platforma + Provoz | ⬜ |
| 20 | Governance, právo & moderace | Příloha C | Platforma + Provoz | ⬜ |
| 21 | Komunitní tvorba & sdílený obsah | Vize komunity | Svět + Komunita | ⬜ |

> Legenda: ✅ Hotovo &nbsp;|&nbsp; 🟡 Rozpracováno &nbsp;|&nbsp; ⬜ Čeká &nbsp;|&nbsp; 👑 vlajková priorita
>
> **Pořadí ≠ termíny.** Fáze 14 (zejména zálohy a 2FA) je urgentní a vyplatí se interleavovat **už teď**, nezávisle na dokončení Etapy I.

---

## Fáze 14 — Bezpečnost & provozní odolnost
**Vlna 1 — Pojistka.** Nepřidává viditelné funkce; chrání vše, co už máme. Levné, vysoký dopad, jde první.

**Závislosti:** žádné blokující — lze začít okamžitě.

### - [ ] 14.1 Dvoufaktorové přihlášení (2FA / TOTP) — [A1 · dopad vysoký · náklad malý]
**Cíl:** Druhý zámek u přihlášení — jednorázový kód z aplikace v mobilu + záložní kódy.
**Proč:** Uniklé heslo je nejčastější ztráta účtu; 2FA blokuje ~99,9 % případů. Kritické u PJ, který ovládá celý svět, a u adminů.
**Návrh přípravy:** rešerše knihovny (`otplib`/`speakeasy`), rozhodnout default (povinné pro Admin/Superadmin, dobrovolné jinak), spec na recovery flow (ztráta telefonu → záložní kódy).
**BE:** 🔁 reuse `security-tokens` + `auth` modulu — TOTP secret per user, verifikace při loginu, záložní kódy (hash v DB), nová pole na `User`. Endpoints: setup/enable/disable/verify.
**FE:** 🔁 reuse sekce „Tvá zařízení"/Bezpečnost v profilu — QR pro spárování, zadání kódu, výpis záložních kódů; krok navíc v `LoginModal`.
**Otevřené otázky:** Povinné pro koho? Povolit i e-mailový druhý faktor jako alternativu? Pamatovat zařízení na X dní?

### - [ ] 14.2 Oprava captcha „fail-open" — [A2 · dopad vysoký · náklad malý] 🔁
**Cíl:** Při výpadku captcha služby request **zablokovat**, ne propustit; sjednotit s dokumentací.
**Proč:** Bezpečnostní prvek, který se při potížích vypne, není ochrana. Známý nález **PC-01** z prod-config auditu.
**Návrh přípravy:** ověřit aktuální chování `captcha.service.ts`, rozhodnout fail-closed + alerting, dotáhnout dluh **D-011** (captcha provider).
**BE:** přepnout logiku na fail-closed + log/alert; sladit `.env` a dokumentaci.
**FE:** ověřit chování registračního/login formuláře při blokaci (jasná hláška, ne tichý fail).
**Otevřené otázky:** Který provider (hCaptcha/Turnstile/reCAPTCHA)? Práh, kdy captcha vyžadovat (vždy vs. po N pokusech)?

### - [ ] 14.3 Bezpečnostní hlavičky (CSP, HSTS, helmet) — [A3 · dopad vysoký · náklad malý]
**Cíl:** Prohlížeč dostane pravidla, která zneutralizují XSS (CSP) a vynutí HTTPS (HSTS).
**Proč:** Platforma plná uživatelského textu (chat, bio, články) je přirozený cíl XSS; CSP je záchranná síť, i kdyby kontrola selhala. Cookie už jsou HttpOnly/Secure/SameSite (PC-18).
**Návrh přípravy:** sestavit CSP allowlist (self, Cloudinary, Meili, push, případně AI služby), otestovat na stagingu, aby nerozbila legitimní zdroje.
**BE:** `helmet` middleware + laděná CSP, `X-Frame-Options`, `Referrer-Policy`, HSTS.
**FE:** ověřit, že žádný inline skript/styl CSP neporušuje (případně nonce).
**Otevřené otázky:** Report-only fáze nejdřív (sběr porušení) než tvrdé vynucení? Které externí domény musí být na allowlistu?

### - [ ] 14.4 Zálohy & plán obnovy (DR) — [A4 · dopad vysoký · náklad střední] 👑provoz
**Cíl:** Automatická noční záloha DB s rotací na oddělené úložiště + ověřená obnova + 1stránkový runbook.
**Proč:** Tichá ztráta dat je jediná chyba, ze které se komunita nevzpamatuje. Stovky hodin práce ve světech.
**Návrh přípravy:** zvolit úložiště (mimo hlavní server), rozvrh rotace (např. 7 denních + 4 týdenní), naplánovat čtvrtletní test obnovy.
**BE/Ops:** `mongodump` cron + upload na oddělené úložiště; média drží Cloudinary; runbook „co dělat, když spadne server".
**Otevřené otázky:** Kam zálohovat (jiný cloud/region)? Jak dlouho držet? Šifrovat zálohy? Kdo má k nim přístup?

### - [ ] 14.5 FE CI brána + E2E smoke — [A5 · dopad střední · náklad střední]
**Cíl:** Před nasazením FE automaticky proběhne typecheck + lint + testy + jeden E2E happy-path.
**Proč:** FE dnes jen deployuje (BE bránu má); jeden chybný commit může shodit web bez varování. Playwright je nainstalovaný, jen nevyužitý.
**Návrh přípravy:** GitHub Actions workflow zrcadlící BE `ci.yml`; vybrat 1 kritický scénář (login → vstup do světa → otevření mapy).
**FE:** workflow + první Playwright test; volitelně FE pre-commit hook (pozor: FE bez prettieru — viz `feedback_fe_no_prettier`).
**Otevřené otázky:** Blokovat merge, nebo jen varovat zpočátku? Spouštět E2E na každý push, nebo nightly?

### - [ ] 14.6 SCA (skenování závislostí) + rate-limit pro škálu — [A6 · dopad střední · náklad malý]
**Cíl:** Automatické hlídání zranitelných balíčků; připravený Redis-backed rate-limit pro multi-instance.
**Proč:** Zranitelnost v balíčku je častý vstup útoku; in-memory throttler (dluh **D-028**) přestane chránit při víc instancích BE.
**Návrh přípravy:** zapnout Dependabot + `npm audit` v CI; navrhnout přepínač throttleru na Redis (Redis už ve stacku je).
**BE:** Redis throttler jako opt-in; CI audit krok.
**Otevřené otázky:** Práh závažnosti, který blokuje build? Zapínat Redis throttler hned, nebo až při škálování?

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

---

## Fáze 16 — Český příkop
**Vlna 3 — Příkop.** Tady je hlavní strategická energie. Zahraniční nástroje to neumí a Discord dělá špatně. Toto je scénář B.

**Závislosti:** těží z hotové Fáze 14–15 (bezpečné a příjemné prostředí), ale 16.1 lze specovat paralelně.

### - [ ] 16.1 👑 Fórovkový (play-by-post) mód — [E1 · dopad vysoký · náklad střední] 🔁
**Cíl:** Asynchronní vyprávěcí hra ve vláknech navázaných na svět/lokaci/scénu: dlouhé formátované příspěvky, hraní „za postavu", oddělení IC/OOC, trvalá archivace, řazení po tazích, odběr + push.
**Proč:** Páteř české textové scény je play-by-post; trend async hraní mu dává vítr i globálně. Náš chat je realtime/krátkodobý, pro ságu se nehodí. **Discord to dělá špatně** (vlákna se ztrácejí, postavy nenapojené, nula struktury). **Nejdůležitější položka celé roadmapy** — dělá z Ikara náhradu fórovek, ne jen VTT.
**Návrh přípravy:** **brainstorming + samostatný spec je povinný** (skill `spec-driven-development`). Vyjasnit datový model vlákna, vztah k chatu (nová entita vs. rozšíření), napojení na postavy (persona z adresáře — 🔁 vzor PJ persona `project_chat_pj_persona_avatar`), moderaci, archiv. Design audit (`frontend-design`) na čtení dlouhých příspěvků.
**BE:** nový typ obsahu „vlákno/sága" napojený na svět + postavy; příspěvky (formátovaný TipTap), odběry, soft-delete/edit, řazení; reuse `push` pro notifikace, AKJ pro skrytý obsah.
**FE:** rozhraní vlákna (čtení + psaní dlouhých příspěvků), přepínač IC/OOC, výběr postavy, mobilní čtení, odběr.
**✅ Rozhodnuto (2026-06-15):** Realtime chat **zůstává jak je** (max. drobná vylepšení) — fórovka je **samostatný nový systém** trvalých vláken, **ne** refaktor chatu. Dva oddělené světy: krátkodobý chat + perzistentní vyprávěcí vlákna. Tím odpadá riziko rozbití funkčního chatu.
**Otevřené otázky (k diskuzi — klíčové):** Je vlákno vázané na lokaci/scénu, nebo volné? Kdo zakládá vlákno a kdo do něj smí psát (role/skupiny)? Házení kostek ve vlákně? Verze „na jeden večer" vs. „dlouhá kampaň"? Mají vlákna herní datum (rpDate)?

### - [ ] 16.2 👑 Hloubková podpora českých systémů (DrD, DrD II, Jeskyně a draci) — [E2 · dopad vysoký · náklad střední] 🔁
**Cíl:** Plnohodnotné deníkové listy + kostkové mechaniky pro české systémy (k6/k%, pasti, postih/bonus) + naplnit jejich kompendium (příšery, předměty).
**Proč:** Foundry/Roll20 mají pro české systémy slabou/žádnou podporu — **náš příkop**. Seedujeme 13 systémů, ale „mít schéma" ≠ „mít list s mechanikou". (Existují české utility jako Dračí Hlídka — naše výhoda je integrace všeho dohromady.)
**Návrh přípravy:** rešerše konkrétních mechanik DrD/DrD II/JaD; rozhodnout rozsah „mechaniky" (jen hody vs. dílčí výpočty — pozor na hranici v Fázi „Co nedělat"); 🔁 vzor `project_schema_be_fe_sync` (schéma canonical na FE → export do BE).
**BE/FE:** dedikované listy + kostkové presety per systém; 🔁 `system-presets` + bestiář kompendium per systém.
**Otevřené otázky:** Které systémy prioritně (DrD II? JaD?)? Kolik automatizace je „akorát" (jen hody, nebo i základní výpočty)? Sdílet kompendium napříč světy?

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

### - [ ] 17.6 Integrace hlasu (odkaz, ne stavba) — [D4 · dopad střední · náklad malý]
**Cíl:** Pole „odkaz na hlasovou místnost" (Discord/Jitsi) na úrovni scény/světa + tlačítko „Připojit se k hlasu".
**Proč:** Skupiny chtějí mluvit; vlastní hlasový stack je drahý a křehký. Integrace splní 90 % potřeby.
**FE:** pole odkazu + tlačítko; volitelně embed Jitsi.
**Otevřené otázky:** Jen odkaz, nebo embedovaná místnost (Jitsi iframe)? Per scéna, nebo per svět?

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

### - [ ] 18.2 AI shrnutí session / vlákna — [F3 · dopad nízký · náklad malý] 🔁
**Cíl:** Z dlouhého chatu nebo fórovkového vlákna (16.1) vytvoří „co se stalo minule".
**Proč:** U async hraní, kde vlákno žije týdny, je shrnutí zlato.
**BE/FE:** poslat text na AI → uložit shrnutí k vláknu/scéně.
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

### - [ ] 19.3 Odstřižení od starého webu — [Příloha C/B] 🔁
**Cíl:** Žádná závislost na umírajícím `patrikzplzne.cz` — přesun embedding modelu na vlastní hosting, maily přes vlastní SMTP.
**Proč:** Když starý web zhasne, něco přestane fungovat. Dluhy **PC-02** (mailer) a **PC-21** (model). SMTP už rozpracován (`project_smtp_email_setup`).
**Ops/BE:** nahrát model na vlastní hosting; dokončit SMTP přepnutí + deploy.
**Otevřené otázky:** Kam hostovat model? Termín, než starý web definitivně padne?

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
**Otevřené otázky:** Kdo smí přidávat do globálu (každý vs. ověření)? Jak řešit kvalitu (hodnocení, kurátor)?

### - [ ] 21.2 Procedurální generátory postav & detailů (zdarma) — [dopad vysoký · náklad velký] ✅bez-AI
**Cíl:** Generátory, které z **dat a náhodných tabulek** vytvoří cokoli, co postava má: **jména, výšku, věk, vzhled, povahu, životní příběh, rodinu/rodokmen, majetek…** Jednoduché, deterministické, **bez jakýchkoli nákladů**.
**Proč:** Tvůj preferovaný směr — žádné peníze za AI, plně v naší režii. Klasický a oblíbený nástroj (Dračí Hlídka má podobné). „Jen to bude dost práce" = hlavní náklad jsou **datové tabulky**, ne kód.
**Klíč:** tabulky plní a rozšiřuje **komunita** (váže na 21.1) — per-systém i per-svět sady (české jméno ≠ elfí ≠ sci-fi). Generátor je tenká vrstva nad daty.
**Návrh přípravy:** návrh datového formátu tabulek (vážené položky, podmínky, **vnořené generátory** — „rodina" volá „jméno"); seed základních CZ/fantasy sad; UI „vygeneruj / přegeneruj / zamkni pole".
**BE/FE:** generátor engine (weighted random + skládání) + editor tabulek + napojení na tvorbu postavy/NPC.
**Vztah k AI (Fáze 18):** procedurální = **zdarma a výchozí**; AI (18.1) je volitelná *chytřejší* vrstva pro souvislý text (uhladit vygenerovaný příběh) — ne náhrada.
**Otevřené otázky:** Které generátory první (jména → příběh → rodina)? Formát tabulek pro komunitní příspěvky? Per-systém vs. globální sady?

### - [ ] 21.3 Generátor map — [dopad střední · náklad střední] 🔁
**Cíl:** Rychlé generování map: procedurální (jeskyně/sídla) + 🔁 reuse **Dungeon Builder** (už máme tile editor s exportem). Volitelně AI obrázek (18.3).
**Proč:** Tvůj původní oblíbený nápad; šetří PJ kreslení. Procedurální = zdarma; navazuje na import map (17.2).
**Otevřené otázky:** Jen dungeony, nebo i exteriéry/města? Procedurální layout vs. jen knihovna dílků?

### - [ ] 21.4 Kurátorství & moderace komunitního obsahu — [dopad střední · náklad střední] 🔁
**Cíl:** Schvalování, hodnocení a atribuce sdíleného obsahu (items/bestie/mapy/generátorové tabulky).
**Proč:** Komunitní obsah potřebuje kvalitu a moderaci; 🔁 schvalovací toky, co už máme (články/galerie), + role správců.
**Otevřené otázky:** Pre-moderace (schválit před zveřejněním) vs. post (nahlásit)? Kdo kurátoruje (noví správci)?

---

## Otevřené strategické otázky (k diskuzi, než se rozjede Etapa II)

**✅ Rozhodnuto (2026-06-15):**
1. **Pořadí** — interleave OK (14.4 zálohy + 16.1 fórovka spec hned, zbytek postupně).
2. **Fórovka vs. chat** — dva oddělené systémy; chat zůstává, fórovka je nová vrstva.
3. **AI vs. generátory** — character/detail generátory dělat **procedurálně (zdarma, Fáze 21.2)**; AI (Fáze 18) jen jako volitelná chytřejší vrstva, proveditelné a levné, hlídané limity (19.2).
4. **Ambice** — míříme až na **C**; A+B je začátek, pak doháníme stůl. „Trumfnout všechny."
5. **Obsah = komunita** — platforma dává generátory a knihovny, komunita plní (Fáze 21).

**Stále otevřené:**
5. **Veřejnost (17.3):** ukazovat světy ven (marketing), nebo zůstat čistě uzavřená komunita?
6. **České systémy (16.2):** které prioritně (DrD II? JaD?) a kolik „mechaniky" je akorát?
7. **Globální scope (21.1):** zavést 4. „komunitní/globální" scope vedle system/user/world pro items/bestie? Kdo smí přidávat a jak moderovat?
8. **Generátory (21.2):** které první (jména → příběh → rodina)? Formát tabulek pro komunitní příspěvky?
9. **Fórovka detaily (16.1):** vázat vlákno na lokaci/scénu, nebo volné? Kostky ve vlákně? „Na jeden večer" vs. dlouhá kampaň?

---

## Co tato roadmapa záměrně NEDĚLÁ

- **Plná automatizace pravidel** à la Foundry/Fantasy Grounds — bezedná údržba vázaná na jeden systém; rozbila by univerzálnost 13 systémů.
- **Plné 3D / vlastní hlasový/video stack** — drahé, mimo rozsah; atmosféru řešíme jinak (počasí, hudba), hlas přes odkaz (17.6).
- **Vlastní marketplace s prodejem obsahu** — platforma není o penězích; sdílení zdarma (17.5) ano, prodej ne.
- **Internacionalizace (angličtina)** — cíl je česká scéna; dveře nechat architektonicky otevřené, ale neinvestovat.
- **Nativní mobilní appka (App Store/Play)** — PWA (15.1) dá 90 % přínosu bez schvalování a druhé kódové základny.
- **AI na sílu** — vždy opt-in, označené, s limity.

---

## Zdroje a souvislosti

- *Hloubková strategická analýza* (2026-06-14) — `~/Downloads/Ikaros-hloubkova-analyza.pdf`, `~/Downloads/Ikaros-analyza-vylepseni.pdf` (mapování bodů A1–F3, profily konkurence, trendy, český rozbor).
- Etapa I — `docs/roadmap-fe.md` (fáze 0–13).
- Navázané dluhy: PC-01 (captcha), PC-02/PC-21 (starý web), D-011 (captcha provider), D-010 (GDPR), D-028 (Redis throttler), D-NEW-UM10 (storage kvóta).
- Navázané audity: prod-config, log-hygiene, error-contract, nav, ws, cascade-delete, db-integrity (viz `docs/`).

> **Tento dokument je živý návrh.** Po společné diskuzi se upraví priority, rozsah a otevřené otázky se rozhodnou. Teprve pak vzniká per-featura spec a plán.
