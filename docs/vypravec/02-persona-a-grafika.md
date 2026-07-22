# Vypravěč · 02 — Persona a grafika (Ishida + Joe)

Stav: podklad · 2026-07-21 · **rev. 3: model DVOU průvodců — Ishida (platforma) + Joe (světy), potvrzeno vlastníkem 2026-07-21** (rev. 2: Daidalos → Ishida, 2026-07-20) · Vazby: roadmap3 fáze 25.2 (Vypravěč), 26.1–26.5 (texty cest — blokuje je persona lock), 28.2 (vyhodnocení bety) · Generační prompty obou postav: [02a-prompty-grafika.md](02a-prompty-grafika.md)
Sousední podklady: [00-vize-a-rozhodnuti.md](00-vize-a-rozhodnuti.md) · [03-interakcni-model.md](03-interakcni-model.md) · [04-architektura.md](04-architektura.md) · [06-obsah-a-udrzba.md](06-obsah-a-udrzba.md)

---

## 1. Dva průvodci jedné organizace

Feature se jmenuje **Vypravěč**; mluví v ní **dvě postavy jedné fikce (tajná organizace tvůrců):**

| | Scope | Chat | Kompozice |
|---|---|---|---|
| **Ishida** — šéf | platformní routy, post-registrace, changelog, platformní chyby, HelpPage, push texty | Putyka · Camp · voice krčma | natočený doleva |
| **Joe** — agentka v terénu (§1.4) | vše uvnitř světů: „kde jsem", in-world topiky/chyby, kroky cest ve světě | chat světa (kostky, whitelist) | natočená doprava |
| **Měďák** — výcvikář TM (§1.5, v2) | POUZE taktická mapa (hloubkový průvodce TM v „?" panelu) | — | mírné 3/4 doleva |

**Předání:** při prvním vstupu do světa Ishida uživatele předá Joe (replika 9, §2.1) — narativní beat cesty 26.1. Wizard tvorby světa (platformní routa) vede ještě Ishida.

### 1a. Ishida — kdo je a proč

Vlastní postava vlastníka (OC). Archetyp: **něco mezi kloboučníkem a vůdcem tajné organizace** — elegantní gentleman-showman, tajemný, ale vřelý. Kotva funguje dvakrát:

1. **„Kde jsem?" — „Tohle místo jsem stvořil. Znám každý jeho kout."** Ishida je **Tvůrce platformy**: fikce kryje jádrovou schopnost — zná každou routu, protože ji postavil. Navigace není helpdesk, je to domácí právo pána domu.
2. **Úcta jako pojistka tónu.** Ishida mluví s každým hostem s úctou a přátelstvím — vzletná zdvořilost je jeho způsob moci; povýšenost je pod jeho úroveň (vestavěná ochrana proti Navi/Fi mentorování). Žije **v trochu jiném světě než uživatel** — o patro výš, na úrovni platformy, ne světů; proto může vysvětlovat governance, aniž by komukoli fušoval do hry. Varovné repliky před destruktivními akcemi (hard-delete apod.) podává vážně, bez humoru, sloučené s existujícími warning modaly.

**Oba průvodci jsou v betě plně determinističtí (scripted, žádné LLM).** Persona nesmí slibovat schopnost, kterou nemá — na dotaz mimo registr vždy poctivý fallback (repliky 8/8b), nikdy nehádá. Tajemno postav je vizuální a stylistické, **nikdy epistemické** — nemlží o faktech.

### 1.1 Terminologické pravidlo (závazné — řeší kolizi „Vypravěč = PJ")

„Vypravěč" má v české TTRPG komunitě zavedený význam = PJ. Proto:

| Kontext | Pravidlo |
|---|---|
| Entry point, nastavení, dokumentace | „Vypravěč" |
| Repliky | platforma: mluví **Ishida** · světy: mluví **Joe**; oba se představují jménem |
| Zákaz | Ishida ani Joe **nikdy** neřeknou „jsem tvůj PJ"; **Joe nikdy neradí k příběhu ani vedení hry** — radí k nástrojům, hru vede PJ |
| Vysvětlení role PJ | Ishida: *„PJ je vypravěč TVÉHO světa. Já jen spravuji dům, ve kterém všechny světy stojí."* · Joe: *„Příběh je PJova práce. Já ti ukážu, kde jsou páky."* |
| První replika po registraci | sváže obě jména: tlačítko „Vypravěč" → *„Zdravím tě, příteli. Jsem Ishida — tohle místo jsem stvořil…"* (plné znění §2.1/1) |

Dvouvrstvý role model (globální vs. světová role — doložený top zdroj zmatení) tím vysvětluje sama fikce: **Ishida = platforma, PJ = svět.**

### 1.2 Zamítnuté alternativy

| Alternativa | Důvod zamítnutí |
|---|---|
| **Daidalos** (stavitel labyrintu, mytologická vazba na brand Ikaros) | zamítnut vlastníkem 2026-07-20 — chce vlastní postavu s jiným charakterem (kloboučník × tajná organizace), ne mytologickou figuru |
| Bezejmenný „Vypravěč od stolu" (archetyp GM s lucernou) | generický („přebarvený sdílený vzhled" persony); přímo koliduje s rolí PJ |
| Zvířecí maskot (havran/sova, Duo model) | bez autority vysvětlovat role a governance; baby-schema nesedí na dospělé TTRPG publikum; nanejvýš v2+ *doplněk* Ishidy (posel u notifikací) |

### 1.3 Kde se kdo projevuje

- **Mimo svět (Ishida):** plná brand grafika — post-registrační dialog (26.4), panel Vypravěče (nahrazuje AnonStartPanel „Začni tady"), platformní empty-states, Putyka/Camp/voice.
- **Uvnitř světa (Joe):** panel a bubliny s jejím hlasem; FAB = **reálný Joe avatar** (✎ rozhodnutí vlastníka 2026-07-22 z živého testu — tlumená tokenizovaná silueta odložena jako v2 theming koncept; siluetové assety J-9/J-10 zůstávají v plánu pro v2). Siluetový podpis Joe = **lucerna**; Ishidův = cylindr.
- **Taktická mapa (Měďák):** FAB skrytý (kolizní plocha) — nápovědu TM ponese hloubkový průvodce TM (v2) v „?" panelu; mluvčí = **Měďák** (§1.5), scope PŘÍSNĚ jen TM, redukovaná sada assetů (avatar + 2–3 busty, žádná silueta).
- HelpPage zůstává „Ishidova knihovna" — dlouhé čtení, tisk, SEO; oba průvodci do ní deep-linkují.

### 1.4 Joe — agentka v terénu

Vlastní postava vlastníka (referenční obrázek = vlastní AI generát). Terénní profík, ne maskotka: klidná, sebejistá, přátelská. Žije o patro NÍŽ než Ishida — chodí světy s uživatelem.

| Prvek | Definice |
|---|---|
| Postava | mladá žena, klidný sebejistý přátelský výraz |
| Vlasy/oči | dlouhé tmavé zvlněné vlasy · výrazné modré oči |
| Oděv | praktický elegantní tmavý cestovní kabát s vysokým límcem, drobné mosazné knoflíky · tmavě indigový šátek · rukavice bez prstů · kožená brašna přes rameno, opasky, tmavé kožené kalhoty a boty (dle schváleného masteru 2026-07-21) |
| Znak organizace | **mosazný klíček na šňůrce na krku** — týž klíč, jaký má Ishida za pásem klobouku |
| Podpis | **malá mosazná lucerna** s cyan→magenta září — světlo na cestu; primární in-world silueta (čitelná ve 24 px, funguje fantasy i sci-fi) |
| Kompozice | natočená **doprava** (Ishida doleva — na společných plochách se dívají na sebe) |
| Styl | stejný stylizovaný realismus jako Ishida — jedna vizuální rodina |

### 1.5 Měďák — výcvikář taktické mapy (v2, potvrzeno 2026-07-21)

Vlastní postava vlastníka (reference = vlastní AI generát; z reference se vypouští sklenička a kanadská vlajka). TM specialista Ishidovy organizace — mluví JEN na taktické mapě (hloubkový průvodce TM, v2). Přezdívka sedí do kovové řady: klíč (Ishida) · lucerna (Joe) · **měď (Měďák)**.

| Prvek | Definice |
|---|---|
| Postava | ramenatý voják ~40 let, zvětralá tvář, drobná jizva na lícní kosti, soustředěný přísný, ale ne nepřátelský výraz |
| Vlasy/vousy | krátké **měděně kaštanové** vlasy, plnovous stejné barvy (odtud přezdívka) |
| Oděv | zelená polní košile s digitálním kamufláž vzorem; **místo vlajky mosazná nášivka-klíč na náprsní kapse** (znak organizace); psí známky |
| Zákaz z reference | ŽÁDNÁ sklenička, ŽÁDNÁ kanadská vlajka |
| Kompozice | mírné 3/4 natočení doleva; sada jen avatar + busty (TM nemá FAB → žádná silueta) |
| Styl | stejný stylizovaný realismus — jedna vizuální rodina |

---

## 2. Hlas — style-guide (závazný)

**Tři hlasy, jeden kodex.** Společné pro všechny: tykání, limity délky, humor nikdy v chybách, žádný guilt-trip, poctivost.

- **Ishida:** vzletná zdvořilost, hostitel („Zdravím tě, příteli") — s úctou a přátelstvím, sám patří do trochu jiného světa. „Příteli" je JEHO poznávací znak, max 1× za konverzaci.
- **Joe:** civilní, přátelsky věcná, stručnější — terén. „Příteli" nepoužívá; její flavor je cesta/světlo („posvítíme na to"). Vzlet nechává šéfovi.
- **Měďák** (jen TM): úsečný výcvikář — krátké věty, rozkazovací způsob v krocích („Polož token. Teď mlhu."), pod drsným povrchem laskavý; NIKDY neponižuje, nikdy neironizuje chybu uživatele. Flavor: vojenský minimalismus („cvičiště", „rozkaz", „krytí").

| Pravidlo | Hodnota |
|---|---|
| Oslovení | Tykání, všude vč. chybových hlášek. Oslovení „příteli" **max 1× za konverzaci** — jinak zevšední |
| Vzletnost | Patří do uvítání, oslav a přechodů; **instrukce a kroky návodů zůstávají věcné a strohé** (vzletný úvod, věcný obsah) |
| Proaktivní replika | ≤ 200 znaků, max 2 věty + 1 CTA |
| Vyžádaný topik | 3–6 vět + akce; návod = kroky po 1–2 větách |
| Flavor | Divadelně-tajemná metaforika (opona, scéna, kout, dům, brána, „moji lidé") **max v 1 z 8 replik**; jinak čistá čeština. Idiomy v registru značit `flavor: true` (budoucí i18n: překládat volně) |
| Humor | Laskavě suchý; nikdy na účet uživatele, **nikdy v chybových stavech** („ztratil ses" zakázáno; správně: „Tenhle kout vede jinam, než čekáš — tudy.") |
| Zákazy | Vykřičníky v instrukcích, zdrobněliny, anglicismy s českým ekvivalentem, guilt-trip, pasivní agrese, emoji (max 1 v oslavě) |
| Feedback patička topiku | textově **„Pomohlo ti to? [Ano] [Ne]"** — jediný feedback prvek UI (plní telemetrii feedback ±); textová varianta zvolena pro konzistenci se zákazem emoji |
| Pokora | Na dotaz mimo registr: replika 8 — nikdy nehádá; tajemno není výmluva pro mlžení o faktech |
| Poctivost | U 🚧 funkcí říká, co reálně funguje — zdroj `docs/funkce/` (runtime cesta: pole `status` topiku, viz [06-obsah-a-udrzba.md](06-obsah-a-udrzba.md)) |

**Vztah k friendly-messaging (závazné, proti driftu dvou formulací):** projekt už má vrstvu přívětivých 403/404 hlášek (rule friendly-messaging). Friendly hláška = **1. linie** (zůstává, co se stalo), Ishidův chybový topik = **2. linie** („PROČ + co dál + akce", doručuje se až při opakovaném zákysu). Obě formulace musí souznít — texty hlášek postupně čerpat z registru (pole `shortMessage` téhož topiku), CI kontroluje, že errorCode s hláškou i topikem nemají protichůdné znění.

### 2.1 Few-shot repliky (schváleno vlastníkem 2026-07-20 „zatím" — ladění vyhrazeno; změny jen úpravou tohoto seznamu, slouží jako few-shot pro voice pass AI výroby)

1. **[Ishida] Uvítání:** „Zdravím tě, příteli. Jsem Ishida — tohle místo jsem stvořil a znám každý jeho kout. Než vykročíš: chceš vést hru, hrát, nebo tvořit svět?"
2. **[Joe] Empty state postav (Hráč):** „Postavu ti tady zakládá tvůj PJ — napiš mu. Až bude na světě, najdeš ji pod Moje postava."
3. **[Joe] Žadatel:** „Tvá žádost leží u PJ. Dokud ji neschválí, brána zůstává zavřená — i pro mě, věř nebo ne. Stav sleduj na dashboardu světa. Čekání není chyba."
4. **[Ishida] Oslava prvního světa:** „Nový svět stojí — a ne prázdný. Dovolil jsem si ti předchystat pravidla, měny i kalendář. Rozhlédni se."
5. **[Joe] Chybějící kotva na mobilu (slovní fallback navigace):** „Na mobilu se ozubené kolečko skrývá v menu — otevři je a povedu tě dál."
6. **[Joe] Kostky zakázané:** „PJ zatím žádné kostky nepovolil. Whitelist najde v Nastavení světa — připomeň mu to."
7. **[Ishida] Údržba:** „Za oponou se právě přestavuje scéna. Malý moment — stránka se sama obnoví."
8. **[Ishida] Neznámý dotaz (platforma):** „Tenhle kout je neprobádaný i pro mě. Nahlédni do plné nápovědy — a já to předám svým lidem, něco s tím uděláme."
8b. **[Joe] Neznámý dotaz (svět):** „Tenhle kout nemám zmapovaný ani já. Mrkni do plné nápovědy — a já to předám šéfovi."
9. **[Ishida→Joe] Předání při prvním vstupu do světa:** Ishida: „Tady moje chodby končí. Tohle je Joe — uvnitř tě povede ona." · Joe: „Vítej. Posvítíme na to spolu."
10. **[Joe→Měďák] Předání na taktické mapě (v2, s hloubkovým průvodcem TM):** Joe: „Tady velí Měďák." · Měďák: „Vítej na cvičišti. Projdeme to po krocích. Nejdřív scéna."

**Doplňkové kalibrační repliky (z oprav kritika, tentýž voice pass):**

- **Existující účet (backfill, místo auto-open persony):** „Vidím, že to tu znáš, příteli. Kdybys přesto stál o doprovod, stačí zaklepat." — u účtů starších než nasazení se persona dialog neotvírá automaticky; jen jednorázová badge/bublina. Retroaktivně splněné milníky se odškrtnou **bez oslavy** (oslavu spouští jen event, ne probe).
- **Krok cesty cílící na kolizní plochu (chat composer):** instrukce se doručí **před** vstupem: „Otevřu ti Globální konverzaci — napiš cokoli, třeba pozdrav." Completion event pak jen potvrdí (detail v [03-interakcni-model.md](03-interakcni-model.md)).
- **Auto-tichý režim (3 zavřené bubliny):** „Nebudu rušit. Kdybys mě potřeboval, víš, kde mě najdeš."

---

## 3. Grafický brief

Cíl: vlastník dodá finální referenci, z ní se image-to-image vygeneruje sada, projde akceptačními testy a uloží pod předepsanými názvy. **Engine se do dodání grafiky staví na placeholder siluetě — grafika neblokuje architekturu.**

### 3.1 Koncept postavy — FINÁLNÍ definice (2026-07-21)

Ishida — elegantní gentleman-showman neurčitého věku (~30–40 na pohled), kloboučník × vůdce tajné organizace; divadelní elegance, ne karneval. Závazný vzhled (odlišení od předlohy je zapracované PŘÍMO v definici, viz §3.1a):

| Prvek | Definice |
|---|---|
| Klobouk | vysoký cylindr **půlnočně indigový**, **zářící pás gradient cyan→magenta**, **mosazný klíček zastrčený za pásem** (podpis) |
| Tvář | vlídný vědoucí úsměv se zavřenými rty (žádné tesáky), lehce zvednuté obočí, hladce oholený, **jantarové oči**, **normální lidské uši**; vzhled **~40 let** (✅ master v2 schválen 2026-07-21) |
| Vlasy | temně fialovočerné, kratší, sčesané na stranu |
| Oděv | dlouhý **slonovinový dvouřadý kabát** s vysokým límcem, mosazné knoflíky, tenké cyan prošití; tmavě indigová vesta; **sytě magentová jednobarevná vázanka/askot**; krémové rukavice s cyan švem; **mosazný špendlík-klíč** na klopě; tmavě indigové kalhoty, černé boty (dle masteru) |
| Styl | **stylizovaný realismus** (painterly digital art, měkké kinematické světlo — rozhodnutí vlastníka 2026-07-21); NE fotografie, NE anime; silné čitelné tvary kvůli zmenšeninám |

**Stav (2026-07-21):** vlastník generuje z kompletních promptů §3.4 (text-to-image; reference slouží jako stylová kotva pro případné image-to-image). Pořadí: master → kontrola (silueta 24 px + test rozpoznatelnosti §3.1a) → busty ze stejného seedu / image-to-image z masteru → siluety nakonec. Neumí-li nástroj průhlednost, jednolitá světle šedá (dev vyřízne).

### 3.1a Pravidla odvození (závazná — IP bezpečnost)

Výchozí obrázek vychází z rozpoznatelného chráněného designu (Mefisto Feles, *Blue Exorcist*, Kazue Kato). Finální Ishida **musí být samostatný design**, ne převlečený cizí:

| Musí se lišit | Smí zůstat |
|---|---|
| kombinace barev klobouku + pásky (bílý cylindr s růžovo-fialovým pásem = podpis předlohy) | archetyp: cylindr, dlouhý plášť, rukavice, showman gesto |
| tvar/proporce cylindru (jiná výška/krempa) | 3/4 kompozice |
| styl: stylizovaný realismus místo anime předlohy | |
| uši — **žádné špičaté** | tajemný úsměv (bez tesáků) |
| účes + barva vlasů | gesto smeknutí klobouku |
| zubatý úšklebek s tesáky, démonické rysy | |
| brož/špendlík a signature doplňky předlohy | |

**Akceptační test rozpoznatelnosti (blokuje schválení masteru):** reverse image search nenajde předlohu; člověk znalý anime na otázku „kdo to je?" neodpoví jménem existující postavy. Neprojde-li, upravit další rozlišovací prvek a opakovat.

### 3.2 Styl a paleta

Stylizovaný realismus — painterly digital character art, měkké kinematické světlo, bohatá ale omezená paleta. NE fotografie, NE anime, žádná gradientová pozadí, žádný text v obrázku. Tvary a kontrasty dost silné, aby busta přežila 64 px a silueta 24 px.

| Role | Barva |
|---|---|
| Kabát, rukavice | slonovinová/krémová |
| Klobouk, vesta | půlnočně indigová (blízko `#1a1033`) |
| Pás klobouku, prošití | gradient cyan `#22d3ee` → magenta `#ff3ea5` |
| Klíč, knoflíky, oči | mosaz `#c9963c` / jantar |
| Vázanka | sytá magenta |
| Vlasy | temně fialovočerná |

### 3.3 Seznam assetů

Společné technické požadavky všech: **PNG s průhledným pozadím, 2048×2048, postava centrovaná, konzistentní proporce, 3/4 natočení doleva.**

| # | Soubor | Obsah / póza | Účel v UI | Akceptační test |
|---|---|---|---|---|
| 1 | `ishida-master.png` | full-body, klidný stoj, ruce volně (případně jedna na klopě) | referenční master (zdroj konzistence), landing/marketing, velké empty-states | silueta rozpoznatelná při zmenšení na 24 px (cylindr = podpis); celá postava vč. klobouku uvnitř plátna |
| 2 | `ishida-bust-vita.png` | od pasu nahoru; vlídný úsměv, gesto smeknutí klobouku nebo ruka na hrudi s náznakem úklony | bublina: uvítání, persona dialog, oslavy (MVP) | čitelný v 64 px vedle bubliny na motivu ikaros (synthwave) i na světlém motivu |
| 3 | `ishida-bust-ukazuje.png` | od pasu nahoru; natažená paže doprava | bublina: navigace, „Vezmi mě tam", kroky cesty (MVP) | dtto; směr gesta jednoznačný i v 64 px |
| 4 | `ishida-bust-omluvny.png` | od pasu nahoru; lehký úklon, ruka na hrudi, omluvný výraz | bublina: chyby, údržba, fallback „neprobádaný kout" (MVP) | dtto; výraz čitelný jako omluvný, ne ustrašený |
| 5 | `ishida-bust-premysli.png` | od pasu nahoru; ruka na bradě | bublina: vyhledávání, delší vysvětlení (v2) | dtto |
| 6 | `ishida-bust-varuje.png` | od pasu nahoru; zdvižená dlaň „stop", vážný klidný výraz | destruktivní akce, warning modaly (v2) | dtto; nesmí působit výhrůžně |
| 7 | `ishida-bust-slavi.png` | od pasu nahoru; úsměv, klobouk smeknutý vzhůru v oslavném gestu | oslavy milníků (v2) | dtto; klobouk nesmí rozbít bounding box bublin |
| 8 | `ishida-avatar.png` | hlava + ramena (zdroj pro kruhový ořez) | kotva FAB mimo svět (48 px desktop / 44 px mobil), avatar v panelu | čitelný ve 48 px v kruhovém ořezu; **cylindr musí přežít kruhový ořez** — komponovat s kloboukem mírně nakloněným, ne plnou výškou |
| 9 | `ishida-silueta-master.png` | master póza, jednobarevná 100% černá plocha | CSS `mask-image` — kotva/postava uvnitř světa (barvu dodá token motivu) | bez vnitřních detailů, hladký obrys bez AA šumu; rozpoznatelná ve 24 px |
| 10 | `ishida-silueta-ukazuje.png` | póza busty (3) ukazuje směr, 100% černá | `mask-image` pro navigační stavy uvnitř světa | dtto |

MVP minimum = 1, 2, 3, 4, 8, 9, 10. Assety 5–7 = v2 (nedodání neblokuje betu).

### 3.4 Generační postup

**Primární cesta = image-to-image z reference vlastníka** s povinnými delta instrukcemi §3.4a (odlišení od předlohy se děje TADY, ne úpravou reference). Postup per asset: reference + delta segment + `[POSE]` segment; drží-li nástroj seed, fixovat.

### 3.4a Povinné delta instrukce (EN, přidat ke KAŽDÉ generaci z reference)

```text
CHANGE from the reference: hat band color to glowing cyan-to-magenta gradient (instead of pink/purple), slightly shorter top hat with a wider brim, normal human ears (not pointed), no fangs — warm closed-lips smile, hair color to deep violet-black with a different shorter cut, replace the chest brooch with a small stylized brass key pin, gloves to off-white with a thin cyan seam.
```

Delty naplňují §3.1a (každý řádek „musí se lišit" má svou instrukci); pokud master i tak neprojde testem rozpoznatelnosti, přitvrdit další prvek (barva kabátu, límec) a regenerovat. Konkrétní hodnoty (odstíny, střih vlasů) smí vlastník při generaci ladit — **měnit se musí VŠECHNY vyjmenované prvky, jak přesně je věc vkusu.**

Základní EN prompt (text-to-image fallback, kdyby image-to-image nefungoval):

```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Ishida, an elegant mysterious gentleman guide: slender man of indeterminate age, deep violet-black hair swept to one side, warm amber eyes, normal human ears, clean-shaven, warm knowing closed-lips smile; tall midnight-indigo top hat with a glowing cyan-to-magenta gradient band and a small brass key tucked into the band; long ivory double-breasted coat with high collar, brass buttons and thin cyan seam piping; dark indigo vest; solid deep-magenta ascot; off-white gloves; small brass key pin on the chest. [POSE: …]. Three-quarter view facing left. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

`[POSE]` segmenty per asset:

| Asset | [POSE] |
|---|---|
| 1 master | `full body, standing calm and composed, arms relaxed, confident gentle expression` |
| 2 vita | `waist-up, warm welcoming smile, tipping his top hat in greeting` |
| 3 ukazuje | `waist-up, focused friendly expression, one arm fully extended pointing to the right` |
| 4 omluvny | `waist-up, apologetic soft expression, slight bow with one hand on chest` |
| 5 premysli | `waist-up, thoughtful expression, one gloved hand on chin` |
| 6 varuje | `waist-up, serious calm expression, one raised palm in a composed stop gesture` |
| 7 slavi | `waist-up, delighted smile, raising his top hat upward in celebration` |
| 8 avatar | `head and shoulders portrait, calm friendly expression, top hat slightly tilted, composed for a circular avatar crop` |

**9/10 siluety** — vždy image-to-image z hotového schváleného assetu (1, resp. 3):
```text
Solid black silhouette of the same character and pose, single flat shape, no internal details, smooth clean edges, transparent background.
```

### 3.5 Návod na konzistenci (proti „různým Ishidům")

1. **Master první:** z reference vygenerovat a schválit `ishida-master.png` (vč. IP testu §3.1a) → teprve pak busty jako image-to-image varianty masteru (vadný master = všechno znovu).
2. Alternativa **character-sheet** (umí-li nástroj): mřížka póz v jednom obrázku z reference → rozřezat. Jeden generát = jedna tvář.
3. Siluety **vždy** image-to-image z finálního schváleného assetu (nikdy z textu — jinak nesedí obrys na barevnou verzi).

Každý asset před uložením projde svým akceptačním testem z tabulky §3.3; neprojde-li, regenerovat — netolerovat „skoro".

### 3.6 Uložení v repu a pojmenování

- Adresář: **`src/assets/vypravec/`** (nový; Vite import → hashované URL + kontrola existence při buildu; `public/illustrations` nechat stávajícím ilustracím).
- Názvy dle tabulky §3.3 (`ishida-<typ>[-<varianta>].png`), lowercase, bez diakritiky.
- PNG originály 2048×2048 se commitnou jako zdroj (jen ty použité; mezikroky a předloha-reference ne — **výchozí neupravený obrázek do repa nikdy** (IP)).

### 3.7 Zpracování po dodání (dev pipeline)

1. **Ověřit akceptační testy** (§3.3 + IP test §3.1a): náhledy 24/48/64 px na motivu ikaros i světlém motivu; screenshot vlastníkovi ke schválení.
2. **Ořez a padding:** oříznout průhledné okraje, sjednotit padding všech bust (stejná velikost hlavy/pozice očí napříč bustami — jinak bubliny při střídání výrazů „skáčou").
3. **WebP konverze:** z PNG vyrobit WebP ve velikostech použití (avatar ~96 a 192 px pro 1×/2×, busty ~256 a 512 px, master ponechat větší pro landing); PNG fallback `<picture>`. Vše `loading="lazy"`, `fetchpriority="low"` — grafika nesmí sáhnout na LCP rozpočet ([04-architektura.md](04-architektura.md)).
4. **Silueta → maska:**
   - PNG siluetu prahovat na čistou 1-bit alfu (žádný AA šum) a **vektorizovat na SVG** (potrace/ruční obtah, pak svgo) — eager FAB uvnitř světa vyžaduje **inline SVG siluetu** kvůli rozpočtu eager < 10 kB gz.
   - Použití jako maska (barvu dodá token motivu, nikdy hardcoded barva — lint:colors):
   ```css
   .vypravec-silueta {
     background: currentColor;
     mask-image: url("data:image/svg+xml,…"); /* inline SVG silueta */
     mask-repeat: no-repeat;
     mask-position: center;
     mask-size: contain;
   }
   ```
5. **Placeholder:** do dodání grafiky jede engine na jednoduché placeholder siluetě (generická postava s cylindrem, tatáž CSS maska) — výměna = výměna SVG, žádná změna kódu.

---

## 4. Otevřená rozhodnutí vlastníka (persona/grafika)

1. **Persona lock:** ✅ **schváleno** — 2026-07-20 Ishida; **2026-07-21 rozšířeno na tři postavy: Ishida (platforma) + Joe (světy) + Měďák (jen TM, v2)**; repliky §2.1 „zatím" — ladění vyhrazeno, změny jen úpravou §2.1.
2. **Grafika:** vlastník generuje z promptů [02a-prompty-grafika.md](02a-prompty-grafika.md) (3 sady: Ishida 10 · Joe 10 · Měďák 4). Pořadí: masteři → moje kontrola → busty. Engine mezitím na placeholderu.
3. **Ishida jako marketingový maskot platformy** (landing, sociální sítě)? Ovlivňuje rozsah generované sady (další pózy nad rámec tabulky) — rozhodnout nezávisle na betě.
4. **Ishidův hlas v textech existujících push notifikací** — jen stretch S4, čistě textová úprava; žádné nové push kategorie v betě.

## 5. Rizika specifická pro personu a grafiku

| Riziko | Mitigace |
|---|---|
| **IP: derivát rozpoznatelný jako předloha (Mefisto Feles)** | pravidla odvození §3.1a + test rozpoznatelnosti blokující schválení masteru; předloha se nikdy necommituje |
| Kolize „Vypravěč = PJ" mate role model | terminologické pravidlo §1.1 vynucené voice passem; Ishida roli PJ aktivně vysvětluje fikcí („správce domu") |
| Persona sklouzne do kýče / manýry („příteli" v každé větě) | flavor limit 1/8, „příteli" max 1×/konverzaci, vzlet jen v uvítáních/oslavách, humor nikdy v chybách, voice pass proti few-shotům |
| Přehnaná očekávání (uživatel čeká LLM) | poctivý fallback replika 8; deterministický brain; nikdy nehádá; tajemno není mlžení |
| Nekonzistentní AI grafika („různí Ishidové") | image-to-image ze schváleného masteru, siluety vždy z finálních assetů, akceptační testy 24–64 px |
| Grafika blokuje stavbu | placeholder silueta od D1, výměna bez změny kódu |
| Dvojí znění chyb (friendly hláška × topik) | vztah 1./2. linie (§2), shortMessage z registru, CI kontrola souladu |
