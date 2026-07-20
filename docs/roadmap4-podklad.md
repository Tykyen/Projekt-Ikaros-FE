# Roadmap 4 — Licenční podklad (ověřená rešerše, zdroj pravdy)

> **Companion k [roadmap4.md](roadmap4.md).** Toto je durabilní evidence base, ze které karty roadmapy 4 čerpají — přežije session (na rozdíl od scratchpadu). Vygenerováno z ověřené internetové rešerše (38 agentů, 11 systémů × research→návrh→adversariální verify + 5 právních konceptů; strojová data v [roadmap4-data.json](roadmap4-data.json)).
>
> ⚖️ **Není právní stanovisko.** Každou položku před ostrým (zvlášť komerčním) nasazením potvrdí advokát. Před právním jednáním ulož PDF/screenshot aktuálního znění každé licence — podmínky se mění (zvlášť JaD bez verze). Needitovat ručně bez re-ověření primárního zdroje.

---

## Část A — Průřezové právní koncepty

### Správná atribuce CC BY 4.0 a CC BY 3.0 obsahu ve webové aplikaci (UI + DB položka + PDF export) a rozdíl vůči CC BY-NC-SA

CC licence (BY, BY-SA, ...) ukládají při každém sdílení díla splnit atribuční podmínky ze Sekce 3(a)(1) licence: uvést autora/autory (a další určené osoby), zachovat copyright notici, notici odkazující na licenci a na disclaimer záruk, poskytnout URI/odkaz na dílo a na text licence a VYZNAČIT, že jsi dílo upravil (a zachovat stopu předchozích úprav). CC to shrnuje do mnemotechniky TASL = Title, Author, Source, License. Ve verzi 4.0 je uvedení názvu (Title) volitelné a Sekce 3(a)(2) výslovně dovoluje splnit podmínky "jakýmkoli rozumným způsobem podle média, prostředků a kontextu" — včetně odkazu na samostatnou stránku s atribucemi. Ve verzi 3.0 (a starší) je název POVINNÝ a formulace je přísnější. Klíčové "no additional restrictions" (Sekce 2(a)(5)(B)) zakazuje na CC materiál uvalit dodatečné právní podmínky nebo DRM/technická opatření, která by komukoli dál bránila dělat to, co licence povoluje — tj. ToS ani ochrana obsahu aplikace nesmí omezit práva plynoucí z CC u konkrétní CC položky. Při nesplnění atribuce licence AUTOMATICKY zaniká (riziko porušení autorských práv); verze 4.0 přidává 30denní nápravné okno (kdo chybu do 30 dní od zjištění napraví, práva se automaticky obnoví) — verze 3.0 tuto automatickou obnovu NEMÁ. Zásadní rozdíl licencí: CC BY (a BY-SA) povolují KOMERČNÍ využití, takže neblokují budoucí monetizaci; CC BY-NC-SA přidává dvě pasti — NC (jen nekomerční, zabíjí monetizaci) a SA/copyleft (adaptace musíš šířit pod stejnou/kompatibilní licencí = nákaza). ND (NoDerivatives) navíc zakazuje jakékoli úpravy/adaptace. Pro maximum tvorby bez vyjednané licence: přijímat jen CC BY a CC0/public domain (u SA počítat s copyleft nákazou na odvozeniny), striktně se vyhnout NC a ND.

**Operační pravidla (do/nedělat v aplikaci):**
- DATOVÝ MODEL: u KAŽDÉ importované CC položky (bestie, kouzlo, předmět, obrázek, text, mapa) uchovávej strojově čitelná pole: title, creator/author (přesně dle přání autora, i pseudonym), sourceUrl (odkaz na originál, ne zkrácený), licenseId ve SPDX tvaru (napr. 'CC-BY-4.0', 'CC-BY-3.0', 'CC0-1.0'), licenseUrl (odkaz na deed licence), modified (bool) + modificationNote (co jsi změnil), volitelně copyrightNotice (© rok jméno) a publisher/instituce. Bez těchto polí položku NEIMPORTUJ.
- UI ZOBRAZENÍ: u každé CC položky renderuj viditelnou atribuci ve formátu TASL: "<Název>" (odkaz na source) od <Autor> (odkaz na profil), licencováno pod <Licence+verze> (odkaz na deed). Ideál: všechny 4 prvky jako hypertextové odkazy. U 4.0 smíš Title vynechat, u 3.0 a starších MUSÍŠ Title uvést.
- ZMĚNY: pokud jsi obsah upravil, ve viditelné atribuci to vyznač — u drobné úpravy pripiš napr. '/ upraveno' nebo 'oříznuto z originálu'; u tvůrčí adaptace uveď 'Toto dílo je adaptací <originál TASL> a je licencováno pod <licence>'. Nikdy netiše needituj CC dílo bez poznámky o změně.
- SAMOSTATNÁ STRÁNKA / THIRD_PARTY_NOTICES: verze 4.0 (Sekce 3(a)(2)) i praxe povolují splnit atribuci odkazem na souhrnnou stránku. Veď centrální kredity (napr. route /ikaros/licence + strojově čitelný soubor THIRD_PARTY_NOTICES / attributions.json) generovaný z DB polí, s plným TASL a aktivními odkazy pro každou položku. U položek v katalogu pak stačí odkaz na tuto stránku, ale prvek 'License' (název+odkaz) drž vždy u položky.
- PDF / TISK / OFFLINE EXPORT: v exportu, kde odkazy neklikají (PDF deníku, PDF karty, tisk), uváděj CELÉ URL textem, ne skryté hypertextové odkazy — jinak je zdroj/licence pro čtenáře neobjevitelná. Do exportu vždy vlož název, autora, plné URL zdroje a plný název+URL licence u každé použité CC položky (nebo odkaz na online kredit stránku uvedený plným URL).
- STROJOVĚ ČITELNÁ VRSTVA: kromě viditelné atribuce vlož do stránek s CC obsahem i metadata (napr. RDFa/schema.org 'license' + 'creator', nebo alespoň data-atributy), aby nástroje licenci rozpoznaly. ALE: metadata NIKDY nesmí být JEDINÁ atribuce — CC výslovně varuje před atribucí jen v EXIF/metadatech nebo v alt textu; alt text je pro přístupnost, ne pro licenci.
- NO ADDITIONAL RESTRICTIONS (Sekce 2(a)(5)(B)): na CC položky neuvaluj DRM ani smluvní podmínky, které by uživatelům bránily dělat to, co CC licence dovoluje. ToS platformy nesmí u konkrétní CC BY položky zakázat její další sdílení/úpravu/komerční užití dovolené licencí. Vlastní (ne-CC) obsah platformy tím omezen není — mísené stránky proto jasně odlišuj, co je CC a pod jakou licencí.
- VÝBĚR LICENCÍ PRO IMPORT (kvůli nerozhodnuté monetizaci): PREFERUJ CC BY a CC0/Public Domain — povolují komerci i úpravy, budoucí monetizaci neblokují. NEPŘIJÍMEJ NC (CC BY-NC*, včetně BY-NC-SA) — 'nekomerční' by zablokovalo budoucí zpoplatnění a definice komerčního užití je vágní/riziková. NEPŘIJÍMEJ ND (CC BY-ND, BY-NC-ND) — zakazuje jakoukoli úpravu/adaptaci, takže položku nesmíš přepočítávat/přeskládat do svých šablon.
- CC BY-SA (copyleft) POUZE OBEZŘETNĚ: komerci sice povoluje, ale ADAPTACE musíš šířit pod stejnou/kompatibilní licencí (nákaza). Pokud SA obsah jen zobrazuješ beze změny, je to OK s atribucí; jakmile z něj vytvoříš adaptaci (přepis, remix, odvozený generovaný obsah), výstup musí být BY-SA a to může 'nakazit' tvůj vlastní obsah — proto SA pro generátor/šablony NEmíchej s proprietárním obsahem bez právního posouzení.
- CO2 = CC0 ATRIBUCE: u CC0 / Public Domain Mark atribuce právně NENÍ povinná, ale doporučuje se uvést zdroj/instituci; přesto tato pole ukládej do DB kvůli dohledatelnosti a konzistenci kredit stránky.
- COMPLIANCE POJISTKA: dodržuj atribuci od začátku — při nesplnění licence AUTOMATICKY zaniká a hrozí porušení autorských práv. U 4.0 existuje 30denní náprava (obnoví se práva při opravě do 30 dní od zjištění), u 3.0 automatická obnova NENÍ. Proto: žádná CC položka v produkci bez vyplněné atribuce; import bez povinných polí blokuj validací.
- NIKDY: nepiš jako autora 'Creative Commons' ani hostující web (Flickr, Wikimedia) místo skutečného tvůrce; nepřejmenovávej autora; neuváděj jen 'Photo: Creative Commons'; nespoléhej na to, že licenci 'každý zná' — vždy uveď konkrétní licenci vč. verze (CC BY 4.0 vs 3.0) a odkaz na deed.

**Zdroje:** https://creativecommons.org/licenses/by/4.0/legalcode.en · https://creativecommons.org/licenses/by/3.0/legalcode.en · https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution · https://wiki.creativecommons.org/wiki/License_Versions · https://creativecommons.org/share-your-work/cclicenses/ · https://creativecommons.org/faq/ · https://wiki.creativecommons.org/wiki/NonCommercial · https://creativecommons.org/version4/

---

### DSA notice-and-action minimum pro hostování UGC (Nařízení EU 2022/2065, čl. 6, 16, 17)

DSA (Nařízení EU 2022/2065) je plně účinný od 17.2.2024 a platí pro Ikaros jako poskytovatele hostingu UGC nabízejícího službu uživatelům v EU. Notice-and-action povinnosti (čl. 16), povinnost odůvodnit každé omezení obsahu (čl. 17) a podmínky zbavení odpovědnosti (čl. 6) jsou v Kapitole III, Oddílu 2 a platí BEZ VÝJIMKY dle velikosti — tj. i pro betu zdarma. Jako pravděpodobně micro/small podnik je Ikaros dle čl. 19 osvobozen od dodatečných povinností online platforem (Oddíl 3: interní stížnosti, trusted flaggers…), od plnění veřejné DSA Transparency Database (čl. 24(5)) i od výroční transparenční zprávy (čl. 15) — ale povinný minimální mechanismus hlášení + odůvodnění zůstává. Jádro: (1) snadno dostupné elektronické tlačítko „Nahlásit" u každého UGC s poli zdůvodnění/URL/kontakt/dobrá víra; (2) potvrzení příjmu a notifikace rozhodnutí nahlašovateli bez zbytečného odkladu; (3) odůvodnění autorovi obsahu na trvalém nosiči s 6 povinnými prvky při každém smazání/skrytí/demotion/pozastavení; (4) dostatečně přesné hlášení = „skutečná znalost" → povinnost jednat expeditiously, jinak ztráta ochrany dle čl. 6; (5) append-only audit stopa notice→rozhodnutí→notifikace jako důkaz pro úřad. Detailní klasifikaci (hosting service, micro/small, výjimky) potvrdí právník.

**Operační pravidla (do/nedělat v aplikaci):**
- [ROZSAH] Ikaros = hostitel UGC → čl. 6, 16, 17 (Kapitola III, Oddíl 2) platí povinně a BEZ výjimky dle velikosti; DSA účinný už od 17.2.2024. Právník potvrdí klasifikaci 'hosting service' i 'micro/small'.
- [ROZSAH] Jako micro/small podnik (≤50 zaměstnanců / ≤10 M€ obrat) je Ikaros dle čl. 19 osvobozen od Oddílu 3 (interní stížnosti čl. 20, mimosoudní řešení čl. 21, trusted flaggers čl. 22…), od plnění veřejné Transparency Database dle čl. 24(5) i od výroční transparenční zprávy čl. 15 — notice-and-action (čl. 16) a odůvodnění (čl. 17) ale platí dál.
- [ROZSAH] Vždy platí i čl. 11 (jednotné elektronické kontaktní místo pro úřady, veřejně dostupné a udržované) a čl. 14 (podmínky/T&C musí srozumitelně popsat pravidla moderace, použité nástroje, lidský přezkum a řešení stížností). Firma usazená v ČR = v EU → zástupce dle čl. 13 netřeba.
- [UI] Tlačítko 'Nahlásit obsah' umísti ke KAŽDÉ ploše UGC: deníkové zápisy, chat, tokeny/popisky na taktické mapě, wiki/stránky, katalogy (bestiář, kouzla, předměty, herbář, lektvary, hádanky…), veřejné SEO landingy a AI-generovaný publikovaný obsah.
- [UI] Formulář hlášení pouze elektronicky, snadno dostupný a user-friendly, s poli: (a) dostatečně odůvodněné vysvětlení, proč je obsah nezákonný [povinné], (b) přesné umístění = automaticky předvyplněná URL + typ/ID entity, (c) jméno + e-mail nahlašovatele, (d) checkbox potvrzení dobré víry a úplnosti. U CSAM (směrnice 2011/93/EU) povol anonymní hlášení bez jména/e-mailu.
- [UI] Ihned po odeslání potvrď příjem hlášení (obrazovka + e-mail, je-li kontakt) — 'bez zbytečného odkladu' dle čl. 16(4).
- [UI] Po vyřízení uvědom nahlašovatele o rozhodnutí a poskytni info o možnostech nápravy (odkaz) — 'bez zbytečného odkladu' dle čl. 16(5). Hlášení vyřizuj včas, s péčí, nearbitrárně a objektivně (čl. 16(6)).
- [UI] Při JAKÉMKOLI omezení (smazání, znepřístupnění, demotion/omezení viditelnosti, pozastavení/zrušení účtu, omezení monetizace) pošli AUTOROVI obsahu odůvodnění na trvalém nosiči (e-mail + trvalý in-app záznam), srozumitelným jazykem — čl. 17.
- [UI] Odůvodnění (čl. 17(3)) musí obsahovat minimálně: (a) druh a územní/časový rozsah omezení, (b) fakta a okolnosti vč. toho, zda vzešlo z hlášení či z vlastní iniciativy, (c) zda byly použity automatizované prostředky, (d) při nezákonnosti právní základ + proč nezákonné, (e) při porušení T&C smluvní ustanovení + proč neslučitelné, (f) jasné a srozumitelné informace o nápravě (interní stížnost, mimosoudní řešení, soud).
- [UI] Výjimky z odůvodnění: příkaz úřadu dle čl. 9 (čl. 17(5)) a klamavý komerční obsah (čl. 17(2)). Jinak NIKDY neomezuj obsah tiše bez odůvodnění.
- [DB] Entita 'notice' (hlášení): reportedEntityType/Id, exactUrl, reason (text), notifierName, notifierEmail, goodFaithConfirmed(bool), createdAt, status, decision, decisionAt, decidedBy, automatedFlag.
- [DB] Entita 'statement of reasons / moderation action': targetEntityType/Id, targetUserId, actionType (remove|disable|demote|restrictVisibility|suspendAccount|terminate|restrictMonetization), scope (co/území/doba), factsBasis (odkaz na notice | vlastní iniciativa), automatedMeansUsed(bool), groundType (illegal|tc), legalOrContractualRef, explanation, redressInfo, deliveredAt, durableMediumRef.
- [DB] Veď append-only audit log řetězící notice → rozhodnutí → notifikaci nahlašovatele i autora. Slouží jako důkaz plnění pro Digital Services Coordinator/úřad. Uchovej minimálně po dobu okna na nápravu + možné dotazy úřadu.
- [DB] Obsah maž jako soft-delete; záznam odůvodnění (SoR) a audit stopu NIKDY nemaž spolu se smazaným obsahem — jinak nedoložíš rozhodnutí.
- [EXPORT] Připrav export audit stopy (hlášení + rozhodnutí + odůvodnění) pro úřad/DSC na vyžádání přes kontaktní místo dle čl. 11.
- [EXPORT] Datový model odůvodnění navrhni kompatibilní s formátem DSA Transparency Database (i když teď plnit nemusíš), s odděleným PSEUDONYMIZOVANÝM pohledem BEZ osobních údajů — levné škálování, až Ikaros přeroste micro/small nebo se stane online platformou.
- [NEDĚLAT] Nezaváděj obecnou monitorovací povinnost ani povinné proaktivní filtrování (čl. 8 to zakazuje jako povinnost). Dobrovolná vlastní moderace je OK a NEZTRÁCÍŠ tím zbavení odpovědnosti (čl. 7 'Good Samaritan').
- [NEDĚLAT] Neignoruj dostatečně přesné a odůvodněné hlášení: dle čl. 16(3) zakládá 'skutečnou znalost' pro čl. 6 → u zjevně nezákonného obsahu jednej expeditiously (rychle odstraň/znepřístupni), jinak ztrácíš zbavení odpovědnosti dle čl. 6.
- [NEDĚLAT] Nevyžaduj hlášení poštou/telefonem (jen elektronicky); nezveřejňuj autorovi obsahu osobní údaje nahlašovatele nad rámec nezbytného a zákonného.

**Zdroje:** https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng · https://www.eu-digital-services-act.com/Digital_Services_Act_Article_16.html · https://www.eu-digital-services-act.com/Digital_Services_Act_Article_17.html · https://www.eu-digital-services-act.com/Digital_Services_Act_Article_6.html · https://www.cms-digitallaws.com/en/dsa/article-19/ · https://www.eu-digital-services-act.com/Digital_Services_Act_Article_15.html · https://www.eu-digital-services-act.com/Digital_Services_Act_Article_11.html · https://digital-strategy.ec.europa.eu/en/faqs/dsa-transparency-database-questions-and-answers · https://dsa-library.com/article/6/

---

### ČR autorské právo: myšlenka/metoda vs. vyjádření (§2 odst. 6 z. 121/2000 Sb.) + zvláštní (sui generis) právo pořizovatele databáze (§88+) — aplikace na RPG VTT platformu

Český autorský zákon (121/2000 Sb.) staví hranici: podle §2 odst. 6 NENÍ chráněn námět, myšlenka, postup, princip, metoda, objev, teorie, matematický/obdobný vzorec ani údaj sám o sobě. To znamená, že herní SYSTÉM, jeho mechaniky, pravidla, výpočetní vzorce a jednotlivá čísla/fakta (staty) jsou volně použitelné — smíte je reimplementovat (deník s autofill+výpočty, kostky, generátor). Chráněné je naopak konkrétní VYJÁDŘENÍ: doslovný text pravidel a popisů (flavor, popisy kouzel/předmětů, dobrodružství, rady PJ), tvůrčí VÝBĚR A USPOŘÁDÁNÍ (souborné/databázové dílo dle §2 odst. 2 a 5), překlad, konkrétní příklady, ilustrace, mapy a umělecká grafika. Vedle autorského práva existuje NEZÁVISLÉ zvláštní právo pořizovatele databáze (§88–94): vzniká automaticky, bez tvůrčí úrovně, pokud pořízení/ověření/uspořádání databáze představuje kvalitativně nebo kvantitativně PODSTATNÝ vklad (§88a); dává výlučné právo na vytěžování a zužitkování celého obsahu nebo jeho podstatné části (§90) a trvá 15 let (§93, u zveřejněné databáze 15 let od zpřístupnění). Klíčové soudní upřesnění (SDEU C-203/02 British Horseracing Board): investice do VYTVOŘENÍ dat se nepočítá — chrání se jen investice do ZÍSKÁNÍ (sběru existujících prvků), ověření a zobrazení; novější C-762/19 CV-Online navíc podmiňuje zásah tím, že vytěžování (scraping) OHROŽUJE návratnost investice pořizovatele. Praktický dopad na veřejné katalogy: jednotlivá fakta a mechaniky volné, ale hromadné převzetí podstatné části cizího katalogu je zásah do jeho práva k databázi, i když jsou položky samy o sobě nechráněné. Cesta k MAXIMU tvorby bez vyjednané licence = vlastní/AI/uživatelský obsah + otevřené licence (SRD/OGL/CC) + reimplementace holých mechanik + přepsání textů vlastními slovy; nikdy nekopírovat cizí text, grafiku ani celé katalogy.

**Operační pravidla (do/nedělat v aplikaci):**
- MECHANIKY = VOLNÉ: Reimplementuj libovolný RPG systém — pravidla, atributy, výpočetní vzorce, tabulky holých hodnot, iniciativu, kostkové mechaniky. Spadá pod §2 odst. 6 (postup/metoda/vzorec/údaj sám o sobě), autorsky nechráněno. Autofill polí a výpočty v deníku jsou v pořádku.
- TEXT NIKDY NEKOPÍRUJ: Doslovné znění pravidel, flavor text, popisy kouzel/předmětů/bestií, příběhy dobrodružství a rady PJ jsou chráněné vyjádření. Vše přepiš vlastními slovy, vlastní strukturou. V deníku smí být mechanický label a hodnota (např. 'Dosah: 9 m', 'k6+2'), NE převzatý popisný odstavec.
- NÁZVY A IDENTITA: Názvy systémů a distinktivní 'product identity' (charakteristické názvy monster, míst, značky) mohou být chráněny známkově i jako výraz — používej generické názvy nebo vlastní. Známkové právo je oddělené od autorského, ale platí stejná opatrnost 'nekopíruj'.
- GRAFIKA/MAPY/ILUSTRACE = CHRÁNĚNO: Nikdy neimportuj vydavatelskou grafiku, ilustrace ani mapy. Používej jen vlastní, AI-generované nebo CC/otevřeně licencované assety. K asetu ukládej v DB pole zdroj + licence + atribuce.
- NEPŘEBÍREJ CIZÍ KATALOGY: Nenahrávej hromadně cizí bestiář/seznam kouzel/předmětů. Převzetí kvalitativně nebo kvantitativně PODSTATNÉ části cizí databáze = zásah do zvláštního práva (§90), i když je každá položka jen 'fakt'. Katalogy stav z vlastní tvorby, uživatelského obsahu nebo mnoha nezávislých/primárních zdrojů; každou položku ideálně přepiš.
- OTEVŘENÉ LICENCE JAKO CESTA K MAXIMU: Kde existuje SRD/OGL/CC (např. D&D SRD pod CC-BY), smíš licencovaný obsah použít v mezích licence. V DB veď per-položku pole licence + atribuce, ať prokážeš oprávněnost a splníš podmínky atribuce. Toto je legální cesta k velkému objemu bez individuálního vyjednávání.
- AI GENERÁTOR: Generované staty/mechaniky jsou fine. Zajisti, že výstup nereprodukuje chráněný text verbatim — filtruj/deduplikuj proti známým chráněným textům; generuj mechaniku a strukturu, ne opsané popisy.
- IMPORT/EXPORT: Export = vlastní data uživatele, OK. Import je rizikový vektor — nedodávej předinstalované balíčky s chráněným obsahem. Doplň podmínku, že za importovaný obsah odpovídá uživatel, a nabídni čistě mechanický (clean-room) referenční základ bez cizích textů.
- VLASTNÍ DATABÁZE — ZÍSKEJ OCHRANU SPRÁVNĚ: Chceš-li §88a ochranu vlastních katalogů, dokládej PODSTATNÝ VKLAD do ZÍSKÁNÍ, OVĚŘENÍ a ZOBRAZENÍ obsahu (ne pouze do jeho vytvoření — dle C-203/02 se tvorba dat nepočítá). Veď záznam o zdrojích a verifikaci. Primární pozice je ale defenzivní: neporušovat cizí práva.
- VEŘEJNÉ SEO LANDINGY / VEŘEJNÝ KATALOG: Vystavovat VLASTNÍ katalog veřejně je v pořádku a může sám zakládat sui generis ochranu. Nikdy veřejně nevystavuj scrapovaný cizí katalog. Pozor: zpřístupněním veřejnosti běží 15letá lhůta (§93) od prvního zpřístupnění — evidenční, ne blokující detail.
- FAKTA A REÁLNÁ DATA JSOU VOLNÁ: Jednotlivá reálná fakta (údaje o zemích/státech, historická fakta, reálné parametry) nejsou chráněna (§2 odst. 6). Úřední díla (zákony, rozhodnutí, oficiální státní materiály) jsou z ochrany vyloučena (§3). Ale KURÁTOROVANÁ kompilace faktů může nést právo k databázi — čerpej z více primárních zdrojů, nepřebírej celý set jednoho zpracovatele.
- SCRAPING JEN NEŠKODLIVĚ: Dle C-762/19 (CV-Online) je vytěžování cizí databáze závadné, pokud OHROŽUJE návratnost investice pořizovatele (typicky konkurenční služba). Neprovozuj automatizovaný sběr z konkurenčních RPG databází; drobné, neškodlivé využití nepodstatných částí (§91) je přípustné.
- DB SCHÉMA — PROVENANCE POVINNĚ: Ke každé položce katalogu přidej pole origin/source, license, isOriginal, attribution. Umožní to filtrovat, co lze veřejně sdílet vs. držet privátně, prokázat původ a automaticky blokovat veřejné vystavení obsahu bez čisté licence.
- PŘEKLADY: Překlad cizího chráněného textu je odvozené dílo a vyžaduje svolení autora originálu — nepřekládej a nepublikuj cizí pravidla/popisy. Vlastní český mechanický popis systému je OK.

**Zdroje:** https://www.zakonyprolidi.cz/cs/2000-121 — Zákon č. 121/2000 Sb., autorský zákon (kanonické znění; §2, §3, §88–94) · https://www.sagit.cz/_texty/sb00121.htm — plné znění zákona 121/2000 Sb. (ověřeno §2 odst. 2, 5, 6) · https://www.podnikatel.cz/zakony/zakon-c-121-2000-sb-autorsky-zakon/f2021969/ — HLAVA III Zvláštní právo pořizovatele databáze (§88–94) · https://e-sbirka.gov.cz/sb/2000/121/2015-01-01 — oficiální e-Sbírka, znění zákona 121/2000 Sb. · https://eur-lex.europa.eu/legal-content/CS/ALL/?uri=CELEX:62002CJ0203 — SDEU C-203/02 British Horseracing Board v. William Hill (získání vs. vytvoření dat) · https://www.akcisek.cz/blog/aktualni-judikatura-sdeu-zmeny-ve-vytezovani-obsahu-databaze — rozbor SDEU C-762/19 CV-Online v. Melons (scraping a ohrožení investice) · https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:62002CJ0203 — plné znění rozsudku C-203/02 (EN) · https://full.nkp.cz/nkkr/NKKR0102/0102114.html — D. Hartmanová: Právní úprava ochrany databází (odborný výklad) · https://www.zatrolene-hry.cz/diskuse/obecne-o-hrani-spolecenskych-her-3/autorska-prava-u-her-727/ — praktický výklad: nechráněný herní systém vs. chráněný text a grafika · https://ikaros.cz/pravni-ochrana-databazi-v-novem-autorskem-zakone — Právní ochrana databází v autorském zákoně (výklad sui generis)

---

### ORC License a otevřené enginy (BRP UGE, Year Zero Engine, Dragonbane) jako legální „generic" cesta pro Projekt Ikaros — co dovolují a jak zůstat legální bez vyjednané licence

Dvě právní vrstvy. (1) Herní MECHANIKY/pravidla (postupy, čísla, tabulky jako metoda hry) nejsou chráněné autorským právem (methods of operation), takže „generický" systém inspirovaný jakoukoli hrou lze stavět už teď — pokud nekopíruješ konkrétní TEXT, art, setting ani ochranné známky. (2) Otevřené licence jsou „safe harbor", který navíc dovolí reprodukovat i samotný text SRD. — ORC License (Azora Law/Paizo, registr. Library of Congress TX 9-307-067): systémově neutrální, TRVALÁ, NEODVOLATELNÁ, royalty-free; EXPLICITNĚ kryje software/apps/VTT/AI/video hry. Přijalo ji desítky vydavatelů vč. Chaosium pro Basic Roleplaying: Universal Game Engine (BRP UGE) — celý text pravidel je zdarma jako „BRP ORC Content Document", prodej vytvořených her royalty-free. Cena: reciprocita (mechaniky ve tvém díle automaticky licencuješ zpět pod ORC) + povinné notices + ZÁKAZ ochranných známek (Call of Cthulhu, RuneQuest, Pendragon, Glorantha, Chaosium…) a artu. — Year Zero Engine Free Tabletop License (Free League) je SAMOSTATNÁ licence (NE ORC): trvalá, neodvolatelná, royalty-free, celosvětová; EXPLICITNĚ povoluje „virtual tabletop module (VTT)", ale VÝSLOVNĚ VYLUČUJE NFT a video hry; povinný „not affiliated" disclaimer + přiložení/odkaz licence; volitelné oficiální YZE logo; nic než SRD (žádné značky/settingy/art). Dragonbane má vlastní 3rd-party licenci. — Závěr pro Ikara: generické „engine-kompatibilní" balíčky (d100 vyšetřovací horor v BRP stylu, dice-pool v YZE stylu) lze legálně vyrobit HNED bez vyjednávání; klíč je generické (neznačkové) pojmenování, správné notices/loga a striktní vyhýbání se cizím ochranným známkám, settingům a artu.

**Operační pravidla (do/nedělat v aplikaci):**
- ZÁKLAD: Mechaniky nejsou autorsky chráněné — generický systém 'inspirovaný X' je legální i bez licence, dokud nekopíruješ konkrétní znění textu, art, setting ani ochranné známky. Licence (ORC/FTL) jen navíc povolí reprodukovat samotný text SRD. Kdykoli sáhneš po textu SRD, řiď se licencí té hry.
- NÁZVOSLOVÍ: Balíčky pojmenuj GENERICKY, ne značkově. ANO 'Vyšetřovací horor d100', 'Univerzální percentilový systém', 'Dice-pool systém (Rok nula-kompatibilní)'. NE 'Call of Cthulhu', 'RuneQuest', 'Vaesen', 'Mutant', 'Dungeons & Dragons' jako název balíčku, tabu ani UI popisku.
- OCHRANNÉ ZNÁMKY: Žádná otevřená licence (ani ORC, ani YZE FTL) NEuděluje práva k ochranným známkám. NIKDE v aplikaci (UI, katalog, SEO landing, export, marketing, AI prompt) netvrď 'kompatibilní s D&D / Pathfinder / Call of Cthulhu' jako claim. Jediné povolené 'kompatibilní' značení jsou oficiální loga poskytnutá vydavatelem (viz níže).
- PŘEJMENUJ cizí proper nouns: pojmenované schopnosti, kouzla, příšery a lokace z cizího Licensed Material musíš přejmenovat na vlastní generické názvy (příklad z ORC AxE: 'Bimbol's Bursting Bunion' -> 'Bursting Bunion'). Přenášej strukturu statbloku/mechaniku, ne značkové jméno.
- BRP balíček (pod ORC): Zdroj = 'Basic Roleplaying ORC Content Document' od Chaosium. Do každého výstupu (PDF/tisk/landing/export) vygeneruj: (a) ORC Notice s textem 'This product is licensed under the ORC License held in the Library of Congress at TX 9-307-067 and available online at various locations including www.azoralaw.com/orclicense …'; (b) attribution '…based on Basic Roleplaying: Universal Game Engine, copyright © 2024 Chaosium Inc., by Jason Durall and Steve Perrin'; (c) 'Powered by BRP' logo (Chaosium ho výslovně poskytuje jako attribution).
- BRP zákazy: Nepoužívej Chaosium artwork, ilustrace, grafický design, trade dress, runy/geometrické symboly mimo latinku a arabské číslice. Nepoužívej trademarky Chaosium, Call of Cthulhu, RuneQuest, Pendragon, Superworld, Fantasy World, Futureworld ani setting Glorantha.
- YZE balíček (pod Year Zero Engine FTL, NE ORC): Zdroj = 'Year Zero Engine SRD v1.0'. Licence EXPLICITNĚ povoluje formu 'virtual tabletop module (VTT)' — to Ikara pokrývá. POVINNĚ přidej notice (doporučené znění): 'This game is not affiliated with, sponsored, or endorsed by Fria Ligan AB. The Year Zero Engine System Reference Document is used under Fria Ligan AB's Free Tabletop License.' a přilož KOPII NEBO ODKAZ na licenci ke KAŽDÉ publikaci (i na webu/reklamě). YZE logo je NEPOVINNÉ, ale když ho použiješ, jen oficiální verzi dle guidelines.
- YZE hranice: FTL kryje jen SRD — žádné jiné texty, art, značky ani settingy Free League (Vaesen, Mutant, Forbidden Lands, Alien, Blade Runner, Twilight:2000…). POZOR: FTL výslovně VYLUČUJE 'NFTs' a 'video games'; povoleny jen VTT moduly, tisk a PDF. Ikaros jako VTT/deník OK, ale nebalit YZE obsah do čehokoli, co by se dalo označit za video hru/NFT.
- RECIPROCITA ORC: Cokoli MECHANICKÉHO, co do ORC balíčku Ikaros přidá (vlastní pravidla, statbloky), je automaticky licencované zpět pod ORC a NELZE to zamknout jako Reserved Material. Naopak vlastní LORE, příběhy, značku a art Projektu Ikaros označ v Reserved Material Notice jako chráněné. YZE FTL reciprocitu nemá — svou hru vlastníš celou.
- DB model balíčku (nový per-content-pack záznam): pole license (enum: ORC | YZE-FTL | DRAGONBANE | GENERIC-NO-LICENSE), sourceDocument, requiredNoticeText, attributionText, reservedMaterialNotice, logoAsset (Powered-by-BRP / YZE), licenseUrl/licenseFileRef. Bez vyplněných notices se balíček nesmí publikovat/exportovat.
- EXPORT & VEŘEJNÉ VÝSTUPY: Každý export (PDF, tisková verze, deník, SEO landing, sdílená scéna), který obsahuje licencovaný obsah, MUSÍ automaticky vygenerovat příslušné notices a u YZE i odkaz na licenci + 'not affiliated' disclaimer. Notice nesmí jít odstranit uživatelem u oficiálních Ikaros balíčků.
- AI GENERÁTOR: ORC výslovně povoluje použití licencovaného materiálu i pro AI. Ale (a) do promptů/outputů nevkládej cizí ochranné známky ani settingy; (b) mechanický AI output nad ORC balíčkem je automaticky ORC-licencovaný — u ORC balíčků drž reciproční notice; (c) YZE FTL o AI mlčí a vylučuje video hry — u YZE obsahu AI generátor drž konzervativně na tvorbě VTT/deníkového obsahu, ne 'hry'.
- USER-GENERATED CONTENT vs OFICIÁLNÍ BALÍČKY: Odděl dvě věci. Oficiální Ikaros balíčky = platforma ručí a plní notices. Uživatelem nahraný chráněný obsah = odpovědnost uživatele; drž DMCA/notice-and-takedown a ToS, neprezentuj cizí chráněný obsah jako oficiální nabídku platformy.
- NEODVOLATELNOST: ORC i YZE FTL jsou neodvolatelné — co jednou pod ORC zveřejníš jako Licensed Material, nejde vzít zpět. Před publikací ORC balíčku vědomě rozhodni a zaznamenej, co je oficiální Ikaros ORC vklad (mechaniky) vs. co je Reserved (lore/značka).
- PRIORITA PRO 'MAXIMUM TVORBY BEZ LICENCE': 1) čistě generický systém (žádná licence, jen se vyhni textu/artu/značkám) = neomezené; 2) ORC balíčky (BRP UGE + desítky dalších ORC her) = plný text SRD, software/VTT/AI explicitně kryté, jen notices + žádné značky/art; 3) YZE FTL balíček = VTT modul explicitně povolen, jen notices + bez video-game/NFT formy. Všechny tři lze spustit HNED bez jednání s vydavatelem.

**Zdroje:** https://paizo.com/orclicense · https://paizo.com/blog/orc-license-the-final-version-is-here · https://www.chaosium.com/orc-license/ · https://www.chaosium.com/blogdownload-the-free-basic-roleplaying-orc-content-document-sell-the-games-you-create-royaltyfree/ · https://www.chaosium.com/content/orclicense/ORC_AxE_FINAL.pdf · https://koboldpress.com/wp-content/uploads/2023/09/ORC-License.FINAL_.pdf · https://a5esrd.com/how-to-use-the-open-rpg-creative-orc-license · https://freeleaguepublishing.com/community-content/free-tabletop-licenses/ · https://freeleaguepublishing.com/wp-content/uploads/2023/11/Year-Zero-Engine-License-Agreement.pdf · https://www.tribality.com/2023/02/16/free-league-launches-new-licenses-for-year-zero-engine-dragonbane/ · https://brpugesrd.xyz/ · https://bruge.us/rules/srd/

---

### Nominativní (referenční) užití cizí ochranné známky v EU a ČR — hranice "kompatibilní s X" vs. dojem oficiálního partnerství; bezpečné vs. rizikové formulace pro landing/SEO/UI RPG VTT platformy (názvy herních systémů: D&D, Pathfinder, Shadowrun, GURPS, Warhammer aj.).

Rámec stojí na třech pilířích, které se sčítají. (1) Nařízení (EU) 2017/1001, čl. 14(1)(c): majitel EU známky NEMŮŽE zakázat třetí straně užít známku "za účelem označení výrobků/služeb jako výrobků/služeb majitele nebo odkazu na ně, zejména je-li užití nezbytné k označení zamýšleného účelu (příslušenství, náhradní díly)" — ALE dle čl. 14(2) jen pokud je užití "v souladu s poctivými zvyklostmi v průmyslu nebo obchodě". (2) Český zákon 441/2003 Sb., § 10 = totožná výjimka (referenční užití + podmínka obchodních zvyklostí a dobrých mravů soutěže); jde o transpozici, vykládá se stejně. (3) I po průchodu známkovým testem samostatně platí nekalá soutěž — obč. zák. 89/2012 Sb. § 2976 a násl.: § 2977 klamavá reklama, § 2981 vyvolání nebezpečí záměny, parazitování na pověsti. HRANICI určuje judikatura SDEU. Gillette (C-228/03): užití je "nezbytné" jen tehdy, je-li jediným praktickým způsobem srozumitelně sdělit účel/kompatibilitu (stačí-li obecný popis/norma, známku neužívej); a NENÍ poctivé, pokud (a) vzbuzuje dojem obchodního propojení, (b) neoprávněně těží z rozlišovací způsobilosti/dobré pověsti (parazitování/free-riding), (c) známku znevažuje, (d) prezentuje produkt jako napodobeninu/repliku. BMW/Deenik (C-63/97): nezávislý subjekt SMÍ inzerovat "opravy a servis BMW", ale NESMÍ vyvolat dojem autorizovaného dealera / člena distribuční sítě. Interflora (C-323/09) pro SEO/klíčová slova: snippet/reklama musí běžnému uživateli umožnit BEZ OBTÍŽÍ poznat, že nabídka NEpochází od majitele známky ani od ekonomicky propojeného subjektu. ZÁVĚR pro tým: "kompatibilní s / pro / funguje s" = OK (referenční, poctivé); "oficiální / autorizovaný / licencovaný / partner / ve spolupráci s / schválený" = RIZIKO (dojem partnerství) bez skutečné smlouvy; slovní značku ano jen v nezbytném rozsahu, NIKDY logo/stylizaci/trade dress; vždy vlastní brand (Projekt Ikaros) dominantní + atribuce vlastnictví známky. Toto je orientační vodítko, ne právní stanovisko; sporné landingy nechat posoudit advokátem.

**Operační pravidla (do/nedělat v aplikaci):**
- UI/nazvoslovi — SLOVNI ZNACKA ANO, LOGO NE: Cizi systemove znamky uvadej jen jako holy textovy nazev ("Dungeons & Dragons 5e", "Shadowrun", "GURPS") a jen v rozsahu nezbytnem k identifikaci systemu. NIKDY nepouzivej logo, stylizovane pismo, ikonu, znakove barvy ani trade dress drzitele prav (Gillette: nezbytnost + poctive uziti; jinak parazitovani na povesti dle § 2981).
- UI/formulace — BEZPECNE vs. RIZIKOVE: BEZPECNE = "podpora pro hru D&D 5e", "denik kompatibilni se systemem Shadowrun", "pro hrace Pathfinderu", "funguje s pravidly GURPS". RIZIKOVE (implikuje partnerstvi/licenci) = "oficialni D&D nastroj", "autorizovany", "licencovany", "certifikovany", "partner Wizards of the Coast", "ve spolupraci s", "schvaleno vydavatelem". Rizikove formulace nepouzivat bez skutecne uzavrene smlouvy.
- UI/atribuce (disclaimer): U kazdeho vyraznejsiho vyskytu ciziho nazvu (landing, vyber systemu, patka) zobraz atribuci typu: "<Nazev> je ochranna znamka <vlastnika>. Projekt Ikaros neni s vlastnikem spojen ani jim schvalen." Disclaimer sam o sobe infringement nelECI, ale je silny protidukaz proti "dojmu obchodniho propojeni" (jadro testu BMW/Deenik + Gillette).
- UI/dominance vlastniho brandu: Vlastni znacka (Projekt Ikaros) musi byt vizualne dominantni a cizi znamka podrizena, cistě popisna. Cesky soud v BMW sporu pripustil "specializovany prodej a servis" u znamky, protoze doplnek jasne signalizoval nezavislost — stejny princip drz v UI (nazev systemu jako label, ne jako headline/brand stranky).
- UI/nepouzivat znamku jako vlastni identitu: Cizi znamku NIKDY nedavej do nazvu platformy, domeny, subdomeny, app iconu, e-mailu, nazvu produktu/tarifu ani jako dominantni vizualni prvek — vyvolava nebezpeci zamены (§ 2981) a neopravnene tezi z povesti (Interflora free-riding).
- SEO/meta a titulky: Znamku ve <title>, meta description, H1 a keywords smis uzit k popisu skutecne kompatibility, ale snippet musi beznému uzivateli umoznit BEZ OBTIZI poznat, ze Ikaros NENI drzitel prav ani ekonomicky propojeny subjekt (Interflora C-323/09, funkce puvodu). Formuluj napr. "RPG platforma pro D&D, Pathfinder a dalsi — Projekt Ikaros", NE "D&D Online" samotne.
- SEO/zadne impersonace a free-riding: Nestrukturuj SEO/PPC tak, aby platforma vypadala jako oficialni stranka systemu; netezi neopravnene z povesti znamky a znamku neznevazuj (Gillette faktory b,c; § 2976 parazitovani, § 2977 klamava reklama). Srovnavaci tvrzeni jen pravdiva a overitelna.
- Nezbytnost (Gillette test): Znamku uzij jen tam, kde je to jediny prakticky zpusob sdelit kompatibilitu. Kde staci genericky popis ("fantasy RPG", "vlastni system", "univerzalni system"), znamku vypust. Preferuj obecne kategorie a konkretni znamku jen kde je informacne nezbytna.
- DB/datovy model — takedown-ready: System uklada jako neutralni interni slug/enum (napr. dnd5e, shadowrun6, gurps) oddeleny od zobrazovaneho nazvu-znamky. Human-readable label + atribucni retezec ("...je ochranna znamka...") drz v JEDNOM zdroji pravdy, aby sel nazev/atribuce centralne prejmenovat pri namitce drzitele prav bez migrace dat.
- Export/PDF/generovany obsah: Do exportu, PDF a AI-generovaneho obsahu propaguj stejnou atribuci; NEvkladej loga drzitelu ani doslovny copyright-chraneny text pravidel/lore. AI generator nesmi reprodukovat chranene setting-nazvy a autorske vyjadreni (mimo znamky hrozi i autorsky narok) — pravidla/mechaniky jako takove chranene nejsou, ale konkretni text, jmena a lore ano.
- UGC/verejne landingy: Moderuj uzivatelsky obsah tak, aby hraci nevytvareli "oficialne pusobici" svety brandovane cizi znamkou/logem; platforma nesmi cizi znamku verejne/SEO-viditelne prezentovat zpusobem, ktery pusobi jako endorsement.
- Self-check pred publikaci landingu/skinu: Projdi 4 faktory poctiveho uziti (SDEU): (1) nevzbuzuje to dojem obchodniho propojeni? (2) netezi to neopravnene z povesti znamky? (3) neznevazuje to znamku? (4) neprezentuje produkt jako repliku/napodobeninu? Jakykoli "ano" = prepracovat. Sporne pripady eskalovat na pravni posouzeni (neni to pravni stanovisko).

**Zdroje:** Nařízení (EU) 2017/1001, čl. 14 — https://lexparency.org/eu/32017R1001/ART_14/ · Nařízení (EU) 2017/1001, konsolidované znění (EUR-Lex) — https://eur-lex.europa.eu/eli/reg/2017/1001/oj/eng · Zákon 441/2003 Sb. o ochranných známkách, § 10 (Omezení účinků) — https://www.zakonyprolidi.cz/cs/2003-441 · § 10 zákona 441/2003 Sb. (Kurzy.cz) — https://www.kurzy.cz/zakony/441-2003-zakon-o-ochrannych-znamkach/paragraf-10/ · epravo: Limity užívání cizí ochranné známky (BMW dealer příklad, § 10) — https://www.epravo.cz/top/clanky/limity-uzivani-cizi-ochranne-znamky-118146.html · profipravo: Oprávněné použití OZ dle § 10 odst. 1 písm. c) — https://profipravo.cz/index.php?csum=22f28897&id_article=257494&id_category=36&page=article · SDEU C-228/03 Gillette v LA-Laboratories (nezbytnost + 4 faktory poctivého užití) — https://ipcuria.eu/case?reference=C-228/03 · SDEU C-228/03 Gillette — plný text rozsudku (EUR-Lex) — https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:62003CJ0228 · SDEU C-63/97 BMW v Deenik (nezávislý servis vs. dojem autorizovaného dealera) — https://ipcuria.eu/case?reference=C-63%2F97 · SDEU C-323/09 Interflora v Marks & Spencer (SEO/klíčová slova, funkce původu, free-riding) — https://ipcuria.eu/case?reference=C-323/09 · SDEU C-323/09 Interflora — plný text (EUR-Lex) — https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A62009CJ0323 · Nekalá soutěž, obč. zák. 89/2012 Sb. § 2976 a násl. (§ 2977 klamavá reklama, § 2981 nebezpečí záměny, parazitování) — https://www.podnikatel.cz/zakony/novy-obcansky-zakonik/f4588398/ · INTA: Fair Use of Trademarks (přehled nominativního fair use) — https://www.inta.org/fact-sheets/fair-use-of-trademarks-intended-for-a-non-legal-audience/

---

## Část B — Systémy (per-system evidence)

### Dungeons & Dragons 5e (SRD 5.1 / 5.2.1)  `dnd5e`

**Strop:** `rich-open`

> SRD 5.2.1 je pod CC BY 4.0 (výhradně CC, bez OGL), která VÝSLOVNĚ dovoluje komerční užití, adaptaci, užití obsahu "in any manner" (VTT/aplikace/herní stůl), překlad i odvozená díla — a je irevokovatelná ("permanently available"). Nejotevřenější možný scénář: engine může postavit prakticky vše (deník, autofill, kouzla/bestiář ze SRD, taktická mapa, import/export, AI na SRD datech) VČETNĚ budoucí monetizace, bez smlouvy a bez právníka. Strop drží jen tři tvrdé hranice: (1) jen SRD podmnožina — žádný non-SRD obsah ani vyňatá PI monstra; (2) žádná značka/loga "Dungeons & Dragons" (jen "5E kompatibilní"); (3) povinná atribuce + poznámka o úpravě + disclaimer. Proto rich-open, ne moderate-open/reference-only. Fan Content Policy je slepá ulička (zakazuje komerci i vložení do software) — nestavět na ní. Finální posudek stále doporučen právníkovi, ale ceiling je jednoznačně nejvyšší kategorie.

**Licenční základ:**
- **Creative Commons Attribution 4.0 International (CC BY 4.0) — the license itself** — `cc-by-4.0` · ✔ primární zdroj · https://creativecommons.org/licenses/by/4.0/legalcode.en
  - „reproduce and Share the Licensed Material, in whole or in part; and produce, reproduce, and Share Adapted Material."
  - „The Licensor offers the Licensed Material as-is and as-available, and makes no representations or warranties of any kind concerning the Licensed Material."
  - „You must ... indicate if You modified the Licensed Material and retain an indication of any previous modifications"
- **System Reference Document 5.2.1 (SRD 5.2.1) released under CC BY 4.0 only** — `cc-by-4.0` · ✔ primární zdroj · https://www.dndbeyond.com/srd
  - „The System Reference Document 5.2.1 ("SRD 5.2.1") is provided to you free of charge by Wizards of the Coast LLC ("Wizards") under the terms of the Creative Commons Attribution 4.0 International License ("CC-BY-4.0")."
  - „This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd."
  - „Please do not include any other attribution to Wizards or its parent or affiliates other than that provided above."
  - „you may include a statement on your work indicating that it is "compatible with fifth edition""
  - „Once a document is published under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), it is permanently available under those terms."
- **System Reference Document 5.1 (SRD 5.1) — dual: CC BY 4.0 and OGL 1.0a** — `cc-by-4.0` · ✔ primární zdroj · https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf
  - „This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document."
  - „The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."
  - „you may include a statement that your work is "compatible with fifth edition" or "5E compatible""
- **Wizards of the Coast Fan Content Policy (separate brand-reference channel; NOT a commercial/software vehicle)** — `fan-policy` · ✔ primární zdroj · https://company.wizards.com/en/legal/fancontentpolicy
  - „You can't sell or license your Fan Content to any third parties for any type of compensation"
  - „You can't require payments, surveys, downloads, subscriptions, or email registration to access your Fan Content"
  - „You may not incorporate any Wizards of the Coast logos and trademarks in your Fan Content without our prior, written consent."
  - „[Title of your Fan Content] is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC."

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: ANO (CC-BY-4.0): text pravidel obsažený v SRD 5.2.1/5.1 lze reprodukovat doslovně i adaptovat, komerčně, natrvalo. Omezení: JEN text, který je v SRD — ne plné příručky (PHB/DMG/MM), ne non-SRD podtřídy/varianty.
- `commercial`: ANO (CC-BY-4.0 §2): komerční užití výslovně dovoleno bez royalties. Budoucí monetizace Ikara (předplatné, prodej) je na SRD obsahu legální. POZOR: Fan Content Policy komerci ZAKAZUJE — proto stavět na CC-BY, ne na FCP.
- `vtt_app`: ANO (CC-BY-4.0): licence dovoluje užití 'in any manner' — VTT/aplikace/herní stůl plně v pořádku (přesně to dělá Roll20 i D&D Beyond se SRD 5.2). Žádné zvláštní schválení netřeba.
- `logo_use`: NE: loga a ochranné známky WotC (vč. loga D&D, ampersandu) zakázány. FCP: 'You may not incorporate any Wizards of the Coast logos and trademarks ... without our prior, written consent.' Ani značku 'Dungeons & Dragons' nepoužívat jako název systému.
- `names_terminology`: ČÁSTEČNĚ: generické herní termíny obsažené v SRD (názvy vlastností, dovedností, mechanik) ANO. Značka 'Dungeons & Dragons' NE — SRD legal výslovně zakazuje jinou atribuci než danou větu. Použij label 'kompatibilní s pátou edicí' / '5E kompatibilní' (to je EXPLICITNĚ povoleno).
- `spells_abilities_lists`: ANO pro SRD podmnožinu: kouzla, schopnosti povolání a rysy uvedené v SRD lze přebírat i strojově zpracovat (autofill). NE pro kouzla/schopnosti mimo SRD (jen část plného seznamu je v SRD).
- `bestiary_statblocks`: ANO pro monstra/statbloky v SRD (lze doslovně i do struktur/DB). NE pro Product Identity vyňaté ze SRD: beholder, mind flayer, displacer beast, githyanki, githzerai, kuo-toa, slaad, umber hulk, yuan-ti, carrion crawler, tanar'ri, baatezu — tato do bestiáře nedávat (nutno originální náhrady).
- `autofill_calc_sheet`: ANO: herní mechaniky/vzorce nejsou autorskoprávně chráněné + text SRD je pod CC-BY. Autofill deník s výpočty (mody, HP, save DC, prof. bonus) je plně legální na SRD datech.
- `derivatives`: ANO (CC-BY-4.0 §2 'produce, reproduce, and Share Adapted Material'): odvozená díla, remix, transformace, vlastní obsah stavěný na SRD — dovoleno. Povinnost: označit, že jde o upravený materiál.
- `translation`: ANO: překlad je Adaptace pod CC-BY (dovolen komerčně). Český překlad SRD lze vytvořit a šířit; nutno vyznačit modifikaci + zachovat atribuční větu a odkaz na CC-BY.

**Vyžaduje:**
- Uvést PŘESNOU atribuční větu pro použitou verzi. SRD 5.2.1: 'This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd.'
- Uvést odkaz na licenci CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) a označit, že obsah je pod CC-BY-4.0.
- Označit, zda byl materiál upraven/modifikován (CC-BY §3 'indicate if You modified the Licensed Material') — týká se i překladu a autofill struktur.
- Zachovat / odkázat Disclaimer of Warranties a Limitation of Liability (CC-BY §5).
- NEuvádět žádnou jinou atribuci k Wizards nad rámec předepsané věty ('do not include any other attribution to Wizards or its parent or affiliates other than that provided above').
- Pokud by se přesto použil brand-odkaz přes Fan Content Policy (nedoporučeno pro platformu): obsah MUSÍ být zdarma + povinný FCP disclaimer '... unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. ...'
- Doporučení: systém v UI pojmenovat neutrálně (např. '5E kompatibilní (SRD 5.2.1)'), ne 'Dungeons & Dragons'.

**Zakazuje:**
- Použití log a ochranných známek WotC (logo D&D, wordmark 'Dungeons & Dragons', ampersand-logo) — bez písemného svolení zakázáno.
- Reprodukce non-SRD obsahu: plné příručky (PHB/DMG/MM), kouzla/podtřídy/kouzelné předměty/monstra, která NEJSOU v SRD.
- Vyňatá Product Identity monstra ze SRD: beholder, mind flayer/illithid, displacer beast, githyanki, githzerai, kuo-toa, slaad, umber hulk, yuan-ti, carrion crawler, tanar'ri, baatezu.
- Naznačování oficiálního schválení, endorsementu nebo napojení na Wizards of the Coast.
- (Fan Content Policy) Prodej/licencování obsahu za úplatu a vkládání do 'games or game components / software' — proto FCP NENÍ vhodný nosič pro herní platformu; použij CC-BY SRD.
- Odstraňování copyright/licenčních notic ze zdrojového SRD materiálu.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecně-neutrální deník** — Univerzální deník postavy bez systémových termínů — volná pole (jméno, popis, poznámky, inventář jako volný text, vztahy, deníkové zápisy). Žádný obsah odvozený z D&D.
  - *základ:* Vlastní UI a datový model, nulový cizí chráněný obsah. Mimo dosah jakékoli licence — nic k atribuci.
  - *guardraily:* Žádná systémová terminologie ani hodnoty ze SRD · Žádná atribuce nutná
- **[C] (b) Systémově-strukturovaný deník (pole/atributy/pořadí)** — Deník s poli 5E: 6 vlastností (Síla…Charisma), zdatnostní bonus, záchranné hody, dovednosti, HP/AC/iniciativa, úrovně, sloty kouzel — jako pojmenovaná pole ve struktuře a jejich pořadí/layout.
  - *základ:* MECHANIKA vlastními slovy: § 2 odst. 6 AutZ — herní systém, princip a metoda jsou z autorskoprávní ochrany vyloučeny; názvy atributů a rozvržení polí jsou funkční prvky, ne chráněný text. Navíc tytéž termíny jsou v SRD 5.2.1 pod CC BY 4.0.
  - *guardraily:* Jen názvy polí/hodnot; nekopírovat popisné odstavce SRD do UI bez atribuce · Používat generické/SRD termíny, ne brand D&D · Oddělit strukturu (naše) od případného převzatého textu
- **[C] (c) Autofill a výpočty** — Automatické dopočty: modifikátor = (hodnota−10)/2, zdatnostní bonus dle úrovně, DC záchrany = 8 + zdatnost + mod, útočný bonus, max HP, nosnost. Vlastní implementace výpočtů v deníku.
  - *základ:* MECHANIKA vlastními slovy: § 2 odst. 6 AutZ — matematický vzorec a metoda výpočtu nejsou chráněny. Herní mechanika je volná, implementujeme vlastním kódem (SRD text jen doplňkový zdroj pod CC BY).
  - *guardraily:* Vzorce psát jako vlastní kód, ne citovat prózu SRD · Oddělit výpočetní logiku od případného převzatého textu
- **[C] (d) Seznamy kouzel / schopností / předmětů — SRD podmnožina** — Naseedovat kouzla, rysy povolání a předměty, které JSOU v SRD 5.2.1, do DB včetně plného textu popisu a metadat (úroveň, škola, dosah, čas seslání) — pro výběr, autofill a náhled v deníku.
  - *základ:* PŘEVZATÝ LICENCOVANÝ OBSAH: CC BY 4.0 §2 — reprodukce i adaptace textu SRD (vč. strojového zpracování do DB) komerčně a natrvalo. Metadata/statistiky navíc jako fakta/mechanika (§ 2/6 AutZ).
  - *guardraily:* Seedovat VÝHRADNĚ položky obsažené v SRD 5.2.1 (whitelist ověřený proti PDF) · Nezavádět non-SRD kouzla/předměty/podtřídy · Atribuce SRD + poznámka o úpravě (strukturování/překlad) · Oddělený datový zdroj s příznakem licence
- **[C] (e) Bestiář a statbloky — SRD monstra** — Bestiář s monstry ze SRD 5.2.1 vč. plných statbloků (AC, HP, vlastnosti, akce, popis) do DB i na tokeny — číselné hodnoty i licencovaný text.
  - *základ:* PŘEVZATÝ LICENCOVANÝ OBSAH: CC BY 4.0 §2 pro text statbloků SRD; číselné hodnoty jako fakta (§ 2/6 AutZ).
  - *guardraily:* JEN SRD monstra; whitelist ověřený proti SRD 5.2.1 PDF PŘED finálním seedem · NIKDY vyňatá PI monstra: beholder, mind flayer/illithid, displacer beast, githyanki, githzerai, kuo-toa, slaad, umber hulk, yuan-ti, carrion crawler, tanar'ri, baatezu → jen originální náhrady · Atribuce + poznámka o úpravě · Žádné WotC ilustrace/art
- **[C] (f-1) Taháky pravidel — vlastními slovy (mechanika)** — Stručné přehledy mechanik (podmínky, akce v kole, výhoda/nevýhoda, odpočinky, ukrývání) NAPSANÉ vlastní formulací jako shrnutí, ne citace.
  - *základ:* MECHANIKA vlastními slovy: § 2 odst. 6 AutZ — pravidlo/mechanika je nechráněná myšlenka; chráněné je jen konkrétní vyjádření. Vlastní text = náš, bez cizí licence a bez atribuce.
  - *guardraily:* Skutečně přeformulovat, neparafrázovat větu po větě · Bez brandu D&D · Atribuce není nutná (vlastní text)
- **[C] (f-2) Taháky pravidel — doslovný text ze SRD (alternativa)** — Alternativně vložit relevantní pasáže SRD 5.2.1 doslovně (např. definice podmínek) jako referenční panel.
  - *základ:* PŘEVZATÝ LICENCOVANÝ OBSAH: CC BY 4.0 §2 — reprodukce SRD textu komerčně dovolena s atribucí.
  - *guardraily:* Jen SRD text, ne non-SRD · Povinná atribuce SRD + poznámka o úpravě/výtahu · Nemíchat s brandem/logy
- **[C] (g) Taktická mapa a tokeny** — VTT stůl: mřížka, dosahy, LoS/fog, tokeny navázané na statbloky/deníky, iniciativa. Vlastní engine a vlastní/samostatně licencované assety.
  - *základ:* CC BY 4.0 dovoluje užití obsahu 'in any manner' (VTT/aplikace) — přesně jako Roll20/D&D Beyond se SRD. Samotný engine i tokeny jsou naše (nejsou D&D obsah).
  - *guardraily:* Žádná WotC art/loga/trade dress; tokeny vlastní nebo samostatně licencované · Data statbloků na tokenech jen ze SRD (whitelist toToken/toEntity)
- **[C] (h) Veřejná landing / SEO stránka + wording** — Marketingová/SEO stránka systému pojmenovaného neutrálně: '5E kompatibilní (SRD 5.2.1)' / 'kompatibilní s pátou edicí'. Popis funkcí, klíčová slova.
  - *základ:* SRD legal VÝSLOVNĚ dovoluje tvrzení 'compatible with fifth edition' / '5E compatible'. Ochranná známka drží jen nutný nominativní odkaz na minimu.
  - *guardraily:* NEpoužívat 'Dungeons & Dragons' jako název systému · Žádné logo/ampersand/wordmark WotC ani trade dress · Nenaznačovat schválení/napojení na WotC · Zobrazit atribuci SRD + odkaz na CC BY 4.0 + disclaimer
- **[C] (i) Import / export** — Export/import postav a scén (vlastní JSON schéma) vč. SRD-odvozených hodnot; volitelná interoperabilita s formáty jiných 5E nástrojů.
  - *základ:* CC BY 4.0 §2 — reprodukce a šíření adaptovaného materiálu dovoleno. Formát/schéma je náš (funkční, § 2/6 AutZ).
  - *guardraily:* Exportní soubory nesoucí SRD text opatřit atribucí · Neexportovat non-SRD obsah · Interop na úrovni funkčního formátu, ne převzetí cizího chráněného datasetu
- **[C] (j) AI generátor kompatibilního obsahu** — Generátor NPC/monster/předmětů '5E kompatibilních' — mechanicky správné statbloky a originální flavor, groundovaný jen na SRD datech.
  - *základ:* MECHANIKA + adaptace: statistika/mechanika nechráněná (§ 2/6 AutZ); SRD jako grounding pod CC BY 4.0. Výstup = originální dílo postavené na volné mechanice.
  - *guardraily:* Grounding JEN na SRD 5.2.1; nevkládat non-SRD zdroje do promptu/RAG · Blokovat reprodukci non-SRD textu a vyňatých PI monster (beholder, mind flayer, …) · Výstup označit jako '5E kompatibilní', flavor originální · Nepředstírat oficiální/schválený obsah

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek právně obhájitelný a strop rich-open je správně určen. Primární zdroje potvrzují jádro: SRD 5.2.1 je pod CC BY 4.0 (komerční, adaptace, překlad, irevokovatelné), atribuční věta v návrhu je doslovně dle WotC statementu a disclaimer odpovídá CC BY §5. Dvojí právní základ (CC BY pro převzatý text + § 2/6 AutZ pro mechaniku) je solidní a správně odděluje nechráněnou mechaniku od chráněného vyjádření. Žádný zásadní overreach — licence skutečně dovoluje vše tvrzené vč. VTT a monetizace. Nutné opravy jsou GUARDRAILY, ne přehodnocení stropu: (1) atribuce CC BY §3 musí doprovázet SRD text na KAŽDÉ ploše, kde se zobrazuje (nejen v patičce), a při míchání s SRD 5.1 atribuovat obě verze; (2) SEO/branding — držet přesnou povolenou frázi 'kompatibilní s pátou edicí', '5E' jen jako neformální zkratku, a EXPLICITNĚ zakázat wordmark 'Dungeons & Dragons' v meta keywords/alt/skrytém textu (ochranná známka není CC BY licencována); (3) import/interop (i) musí filtrovat cizí non-SRD a sui-generis chráněné datasety, ne jen řešit export; (4) AI výstupy nesoucí SRD text atribuovat a moderovat na únik PI monster; (5) trademark disclaimer přeformulovat, aby nejmenoval Wizards/wordmark jako kredit — WotC zakazuje 'any other attribution to Wizards'. Po zapracování těchto guardrailů je návrh připraven k finálnímu posouzení právníkem; strop se nemění.
- **[needs-guardrail]** (d) Seed kouzel/rysů/předmětů ze SRD vč. plného textu do DB — CC BY §2 reprodukce i adaptace komerčně a natrvalo.
  - → Zajistit per-surface dostupnost atribuce u zobrazeného SRD textu (odkaz/ikona 'zdroj SRD 5.2.1'). Pokud část dat pochází z SRD 5.1 (položka jen tam), atribuovat i 5.1 zvlášť — neslévat pod jedinou 5.2.1 větu.
- **[needs-guardrail]** (f-1) Taháky pravidel vlastními slovy — § 2/6 AutZ, pravidlo je nechráněná myšlenka, atribuce není nutná.
  - → Při pochybnosti raději použít f-2 (doslovný SRD text + atribuce) — je vždy bezpečnější než těsná parafráze bez atribuce. Guardrail 'skutečně přeformulovat, ne větu po větě' vynutit review pravidlem.
- **[needs-guardrail]** (h) Veřejná landing/SEO: název '5E kompatibilní (SRD 5.2.1)' / 'kompatibilní s pátou edicí'; SRD to výslovně dovoluje.
  - → Preferovat přesnou povolenou frázi 'kompatibilní s pátou edicí' / 'compatible with fifth edition'; '5E' brát jen jako neformální zkratku, ne název produktu/logo. Explicitně zakázat 'Dungeons & Dragons' v meta keywords, skrytém textu i alt atributech.
- **[needs-guardrail]** (i) Import/export vč. SRD-odvozených hodnot; interoperabilita s formáty jiných 5E nástrojů; schéma je naše (§2/6 AutZ).
  - → Přidat guardrail na import: validovat, že importovaný obsah je SRD nebo vlastnictví uživatele; blokovat/označit vložení cizího chráněného datasetu; interop držet na úrovni funkčního FORMÁTU, ne převzetí cizí datové sady.
- **[needs-guardrail]** (j) AI generátor '5E kompatibilního' obsahu, grounding JEN na SRD; blokovat non-SRD text a PI monstra.
  - → K výstupům nesoucím doslovný SRD text připojit atribuci; logovat/moderovat výstupy na únik PI monster a non-SRD textu; grounding korpus držet odděleně s licenčním příznakem (viz avoid poslední bod).
- **[needs-guardrail]** attributionText + requiredDisclaimerText: přesná WotC věta + 'nad rámec neuvádíme žádnou další atribuci k WotC'; disclaimer uvádí, že 'Dungeons & Dragons, loga a známky jsou majetkem příslušných vlastníků'.
  - → Přeformulovat trademark disclaimer tak, aby NEJMENOVAL Wizards ani konkrétní wordmark jako kredit — např. obecně 'veškeré zmíněné ochranné známky jsou majetkem příslušných vlastníků; tento produkt není oficiální ani schválený'. Vyhnout se pozitivnímu jmenování 'Dungeons & Dragons' tam, kde by šlo číst jako přidaná atribuce.

**Avoid:**
- Značka 'Dungeons & Dragons' jako název systému — místo toho 'kompatibilní s pátou edicí' / '5E kompatibilní (SRD 5.2.1)' (SRD to výslovně dovoluje).
- Loga a ochranné známky WotC: logo D&D, ampersand-logo, wordmark, jakýkoli trade dress.
- Non-SRD obsah: plné příručky PHB/DMG/MM, kouzla/podtřídy/kouzelné předměty/monstra, která NEJSOU v SRD 5.2.1.
- Vyňatá Product Identity monstra: beholder, mind flayer/illithid, displacer beast, githyanki, githzerai, kuo-toa, slaad, umber hulk, yuan-ti, carrion crawler, tanar'ri, baatezu — do bestiáře ani do AI výstupů.
- Jakékoli naznačování oficiálního schválení, endorsementu nebo napojení na Wizards of the Coast.
- Stavba na Fan Content Policy jako nosiči — FCP zakazuje komerci i vložení do software/her (commercialSafe by bylo false); použij výhradně CC-BY SRD.
- Uvádění jakékoli DALŠÍ atribuce k Wizards nad rámec předepsané věty ('do not include any other attribution').
- Odstraňování copyright/licenčních notic ze zdrojového SRD materiálu.
- Naslepý seed bestiáře/kouzel bez ověření každé položky proti SRD 5.2.1 PDF.
- Míchání SRD dat s non-SRD daty v jednom neoznačeném datovém zdroji — datové zdroje držet oddělené s příznakem licence.

**Návrh disclaimeru:**
> Systém je "kompatibilní s pátou edicí" (5E) a staví na obsahu SRD 5.2.1. Nejde o oficiální produkt Wizards of the Coast a není jimi schválen, sponzorován ani s nimi nijak spojen. "Dungeons & Dragons", loga a související ochranné známky jsou majetkem příslušných vlastníků a nejsou zde užity. Licencovaný materiál SRD je poskytován "tak, jak je" (as-is a as-available), bez jakýchkoli záruk či prohlášení; v rozsahu povoleném zákonem je vyloučena odpovědnost za škody (viz CC BY 4.0 §5 Disclaimer of Warranties and Limitation of Liability, https://creativecommons.org/licenses/by/4.0/).

**Návrh atribuce:**
> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. — Obsah SRD 5.2.1 je poskytován pod licencí Creative Commons Attribution 4.0 International (CC BY 4.0): https://creativecommons.org/licenses/by/4.0/. Materiál byl upraven: strukturování do datových polí a atributů, automatické výpočty (autofill) a překlad do češtiny. Nad rámec výše uvedené věty neuvádíme žádnou další atribuci k Wizards of the Coast ani jeho přidruženým subjektům.

**Poznámky rešerše:** ZÁVĚR / DOPORUČENÍ STAVBY:

1) PRIMÁRNÍ NOSIČ = SRD 5.2.1 pod CC BY 4.0 (pouze CC, žádný OGL). Je to nejčistší, komunitně stabilní, IREVOKOVATELNÉ ('permanently available'). Preferuj 5.2.1 před 5.1 (novější 2024 pravidla, jen jedna licence). SRD 5.1 lze použít taky (duální CC-BY-4.0 + OGL 1.0a); pokud stavíš na CC-BY, OGL vůbec neřeš.

2) CO CC-BY POKRÝVÁ PRO IKARA (vše, co engine potřebuje): text pravidel (SRD podmnožina), autofill/výpočetní deník, seznamy kouzel/schopností (SRD podmn.), bestiář+statbloky (SRD monstra), taktická mapa/tokeny/VTT, chat, import/export, odvozená díla, PŘEKLAD do češtiny, a BUDOUCÍ KOMERČNÍ MONETIZACI. Vše bez smlouvy, bez právníka, bez poplatků.

3) TVRDÉ HRANICE (nedělat): žádná značka 'Dungeons & Dragons' jako název systému → místo toho '5E kompatibilní / kompatibilní s pátou edicí' (SRD legal to VÝSLOVNĚ dovoluje). Žádná WotC loga. Žádný non-SRD obsah (plné PHB/DMG/MM). Žádná vyňatá PI monstra (beholder, mind flayer, atd.) — do bestiáře jen SRD tvory nebo vlastní originály.

4) FAN CONTENT POLICY = SLEPÁ ULIČKA pro platformu. Je to samostatný kanál pro brand-odkazy fanoušků, ale ZAKAZUJE komerci a vkládání do software/her → nekombinovat jako nosič. Pro Ikaros se na FCP nespoléhej vůbec; CC-BY je striktně lepší a soběstačné.

5) POVINNÁ MECHANIKA V APPCE: na relevantním místě (patička / 'O systému' / legal stránka) zobrazit (a) přesnou atribuční větu SRD 5.2.1, (b) odkaz na CC BY 4.0, (c) poznámku o modifikaci (autofill/překlad = úprava), (d) odkaz na §5 disclaimer. Pro AI generátor 'kompatibilního obsahu': výstupy staví jen na SRD datech, jinak originální — negenerovat vyňatá PI monstra ani non-SRD statbloky.

OVĚŘENÍ: CC-BY-4.0 legalcode a Fan Content Policy fetchnuty přímo z primárních zdrojů (creativecommons.org, company.wizards.com). CC-BY status SRD potvrzen na oficiální dndbeyond.com/srd. Přesné atribuční věty SRD 5.2.1/5.1 z oficiálních WotC PDF (media.dndbeyond.com / media.wizards.com). Seznam vyňatých PI monster z komunitních zdrojů (historicky konzistentní od OGL éry) — doporučuji před finálním seedem bestiáře ověřit každé monstrum proti obsahu SRD 5.2.1 PDF přímo. Confidence 0.9: jádrová CC-BY fakta jistá; drobná nejistota jen u úplného výčtu non-SRD položek.

---

### Fate Core / Fate Accelerated (FAE)  `fate-core-fae`

**Strop:** `rich-open`

> Anglický SRD (Fate Core, Fate Accelerated i Fate Condensed) je pod CC BY 3.0 Unported — nejliberálnější CC licence: povoluje doslovné převzetí textu, jeho úpravu, vlastní překlad, distribuci ve VTT/herním stolu i KOMERČNÍ vydání, a NENÍ virální (derivát smíme licencovat jakkoli). Nejde tedy o reference-only ani fan-noncommercial strop — smíme reálně přebírat licencovaný obsah, ne jen popisovat mechaniku. Ikaros může TEĎ, bez smlouvy a bez právníka, postavit plnou systémovou podporu Fate. Strop drží dolů jen čtyři mantinely: (1) povinný atribuční blok stejně velkým písmem + vyznačení změn; (2) žádný endorsement / naznačování oficiálního Fate produktu; (3) žádné Fate/Evil Hat logo ani grafické assety/trade dress — CC kryje jen TEXT SRD, ne ilustrace; použitelné je jen samostatné Powered by Fate logo s povinným textem; (4) žádné DRM na distribuovaný text SRD (§4(a) CC BY) a zákaz komerčního použití NC/SA českého překladu d20.cz — nutný vlastní CZ překlad z anglického CC BY SRD.

**Licenční základ:**
- **Fate Core System & Fate Accelerated Edition (FAE) — anglický SRD** — `cc-by-3.0` · ✔ primární zdroj · https://fate-srd.com/official-licensing-fate
  - „Fate Core System and Fate Accelerated Edition are licensed under the Creative Commons Attribution 3.0 Unported license."
  - „This work is based on Fate Core System and Fate Accelerated Edition (found at https://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license"
  - „Create derivative works and translations freely / Use any license (including viral Creative Commons licenses) for your derivative work / Commercially publish without making your work open source / Copy the SRDs directly, maintaining original copyright notices"
  - „[Cannot] Imply or state that Evil Hat is endorsing or sponsoring you unless we've made a special arrangement"
  - „[Cannot] Create content 'prejudicial to Evil Hat's honor or reputation'"
  - „Evil Hat Productions officially endorses the Fate SRD website as the authoritative source for Fate System Reference Documents."
- **CC BY 3.0 Unported — právní text (legalcode)** — `cc-by-3.0` · ✔ primární zdroj · https://creativecommons.org/licenses/by/3.0/legalcode
  - „to create and Reproduce Adaptations provided that any such Adaptation ... takes reasonable steps to clearly label, demarcate or otherwise identify that changes were made to the original Work."
  - „You may not impose any effective technological measures on the Work that restrict the ability of a recipient of the Work from You to exercise the rights granted to that recipient."
  - „You may not implicitly or explicitly assert or imply any connection with, sponsorship or endorsement by the Original Author, Licensor ... of You or Your use of the Work."
  - „worldwide, royalty-free, non-exclusive, perpetual ... license to exercise the rights in the Work (žádné omezení komerčního užití)"
- **Fate Condensed — anglický SRD (samostatný atribuční blok)** — `cc-by-3.0` · ✔ primární zdroj · https://fate-srd.com/official-licensing-fate/cc
  - „This work is based on Fate Condensed (found at https://www.faterpg.com/), a product of Evil Hat Productions, LLC, developed, authored, and edited by PK Sullivan, Lara Turner, Fred Hicks, Richard Bellingham, Robert Hanz, and Sophie Lagacé, and licensed for our use under the Creative Commons Attribution 3.0 Unported license."
  - „The attribution text must be 'the same size as the rest of your copyright section.'"
- **Powered by Fate logo — trademark/logo policy** — `online-policy` · ✔ primární zdroj · https://fate-srd.com/official-licensing-fate
  - „Fate™ is a trademark of Evil Hat Productions, LLC. The Powered by Fate logo is © Evil Hat Productions, LLC and is used with permission."
  - „Color alterations require email permission to feedback@evilhat.com. The logo cannot be reshaped or partially used."
  - „You cannot use Evil Hat's official logo or the Fate logo without permission, but there is a 'Powered by Fate' logo you can use easily."
- **Fate — alternativní OGL 1.0a cesta (engine-level open alternativa k CC-BY)** — `other` · ✔ primární zdroj · https://fate-srd.com/official-licensing-fate/ogl
  - „Grab a copy of the OGL and put it in your product (+ Section 15 boilerplate s bracketed customizations)."
  - „The OGL compels you to keep open what you've borrowed, and to make a clear product identity declaration."
  - „It's bulkier and more baroque to use ... recommended mainly for folks who are already familiar with the OGL, and/or are looking to integrate our content together with something also available under the OGL."
- **Český překlad Fate SRD (d20.cz / fatesrd.d20.cz) — sirien** — `cc-by-nc-sa` · ✔ primární zdroj · https://fatesrd.d20.cz/
  - „Překlad Fate je zveřejněný pod licencí CC-BY-NC-SA."
  - „Originální Fate je vydáváno pod licencí CC-BY (bez omezení na nekomerční využití) ... pro Evil Hat Productions."
  - „Konkrétní verze licence není na stránce uvedena. Autor překladu: sirien (pomoc York, ShadoWWW)."

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: ANO — plný text pravidel Fate Core, FAE i Fate Condensed je v SRD pod CC BY 3.0 Unported; lze kopírovat doslovně a upravovat, podmínkou je atribuční blok a zachování copyright notices.
- `commercial`: ANO — CC BY 3.0 povoluje komerční užití a licence NENÍ virální (derivát smíš licencovat jakkoli, nemusíš ho zveřejnit jako open source). Budoucí monetizace Ikara je pro anglický SRD právně čistá.
- `vtt_app`: ANO — licence nemá žádné omezení oblasti užití; VTT/herní stůl/výpočetní nástroje povoleny. POZOR §4(a): na text SRD, který distribuuješ, nesmíš uvalit DRM/technická opatření omezující práva příjemců podle CC.
- `logo_use`: Fate logo a logo Evil Hat NE (jen po zvláštní dohodě). 'Powered by Fate' logo ANO s povinným textem (Fate™ is a trademark... used with permission); změna barvy jen po e-mailu na feedback@evilhat.com; logo se nesmí přetvářet ani používat po částech.
- `autofill_calc_sheet`: ANO — herní mechanika a matematika (žebřík/ladder, stres, consequences, refresh, fate points) není autorskoprávně chráněná; autofill+výpočetní deník je v pořádku. Kde v listu použiješ doslovný text pravidel, nese atribuci.
- `bestiary_statblocks`: ANO — formát statbloku = nechráněná mechanika; konkrétní příkladoví NPC/tvorové ze SRD (i World SRD, např. Atomic Robo) jsou pod CC BY 3.0, s atribucí. Statbloky lze přebírat i generovat.
- `names_terminology`: ANO — terminologie (aspects, fate points, stress, consequences, skills/approaches, stunts, ladder) je součástí SRD a je volně použitelná. Ochranná známka 'Fate™' se ale nesmí použít tak, aby naznačovala endorsement nebo jako název tvého produktu implikující spojení s Evil Hat.
- `spells_abilities_lists`: ANO — Fate nemá kouzla; ekvivalent = seznamy stuntů, approaches a skills, které jsou v SRD pod CC BY 3.0 a lze je přebírat, upravovat i strojově zpracovat.
- `translation`: ANO z anglického CC BY 3.0 SRD — vlastní/objednaný český překlad je povolen a smí být komerční. ALE stávající český překlad d20.cz (sirien) je CC BY-NC-SA → pro komerční platformu NEPOUŽITELNÝ; Ikaros musí vytvořit VLASTNÍ CZ překlad přímo z anglického CC BY SRD.
- `derivatives`: ANO — adaptace/odvozená díla povolena; podmínka: jasně vyznačit, že došlo ke změnám oproti originálu. Výsledek lze licencovat libovolně (non-viral).

**Vyžaduje:**
- Uvést přesný atribuční blok na copyrightové stránce, stejně velkým písmem jako zbytek copyright sekce: 'This work is based on Fate Core System and Fate Accelerated Edition (found at https://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license.'
- Pro Fate Condensed přidat samostatný atribuční blok (PK Sullivan, Lara Turner, Fred Hicks, Richard Bellingham, Robert Hanz, Sophie Lagacé).
- U jakékoli adaptace jasně vyznačit/demarkovat, že byly provedeny změny oproti originálu (CC BY 3.0 §3).
- Zachovat všechny copyright notices; uvést jména autorů, název díla a URI (https://www.faterpg.com/).
- Při použití 'Powered by Fate' loga uvést: 'Fate™ is a trademark of Evil Hat Productions, LLC. The Powered by Fate logo is © Evil Hat Productions, LLC and is used with permission.'
- Změnu barvy 'Powered by Fate' loga předem odsouhlasit e-mailem na feedback@evilhat.com; logo nepřetvářet ani nepoužívat po částech.
- Vlastní český překlad tvořit VÝHRADNĚ z anglického CC BY 3.0 SRD, nikoli z NC/SA překladu d20.cz.
- (Pouze pokud zvolíš OGL cestu místo CC-BY) přiložit celý text OGL 1.0a, doplnit řetězec Section 15 a deklarovat Product Identity.

**Zakazuje:**
- Naznačovat nebo tvrdit spojení, sponzorství či endorsement ze strany Evil Hat/autorů bez zvláštní dohody (CC BY 3.0 §4(b) + explicitní pravidlo Evil Hat).
- Používat Fate logo nebo oficiální logo Evil Hat bez svolení (dovoleno je jen samostatné 'Powered by Fate' logo).
- Uvalit na distribuovaný text SRD DRM/technická opatření omezující práva příjemců podle CC (§4(a)).
- Vytvářet obsah poškozující čest nebo reputaci Evil Hat (integrita díla / osobnostní práva).
- Komerčně využít český překlad d20.cz (licence NC = jen nekomerčně) ani ho použít bez share-alike (SA) — pro Ikaros efektivně zakázáno.
- Používat ochrannou známku 'Fate™' jako název/branding produktu způsobem implikujícím oficiální Fate produkt.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecně-neutrální deník** — Systémově agnostický deník postavy: volné textové sekce, poznámky, generické atributy, obrázek postavy, tagy — bez jediného odkazu na Fate. Prázdná kostra, kterou hráč naplní vlastním obsahem (UGC).
  - *základ:* Nepoužívá žádný chráněný obsah ani terminologii třetí strany. Čistý UI kontejner + uživatelský obsah. Mimo dosah jakékoli licence.
  - *guardraily:* Nebrandovat jako Fate produkt · Bez atribuce (není co atribuovat)
- **[C] (b) Systémově-strukturovaný deník (Fate pole/pořadí)** — List postavy strukturovaný dle Fate: High Concept, Trouble, sloty pro Aspects, u FAE šest Approaches (Careful/Clever/Flashy/Forceful/Quick/Sneaky), u Fate Core pyramida Skills, Stunts, stresové dráhy (Physical/Mental), Consequences (mild/moderate/severe), Refresh, Fate Points, Extras. Názvy polí a jejich pořadí = struktura listu + terminologie.
  - *základ:* Uspořádání a výběr polí listu = funkční mechanika/systém, nechráněno (§2 odst. 6 AutZ — postup, princip, metoda nejsou předmětem autorské ochrany). Terminologie (aspects, approaches, stress, consequences, stunts, refresh, fate points) je v SRD pod CC BY 3.0 a je volně použitelná jako popisky.
  - *guardraily:* Terminologii používat jen jako popisky polí · Vysvětlující věty k approaches/skills buď PARAFRÁZOVAT vlastními slovy (plně volné), NEBO převzít doslovně ze SRD s atribučním blokem + vyznačením změn · Doslovný text SRD nezamykat DRM (§4(a) CC BY) — musí zůstat kopírovatelný s atribucí · Nebrandovat list jako oficiální Fate produkt
- **[C] (c) Autofill + výpočty** — Automatické dopočty odvozených hodnot: počet stresových políček dle Physique/Will, validace pyramidy dovedností, sledování Refresh vs. součet Fate Points, dostupnost slotů Consequences, cena Stuntů vs. Refresh, zobrazení žebříku (ladder) +8 Legendary … -2 Terrible, výpočet přesahu (shifts) při konfliktech.
  - *základ:* Herní mechanika a matematika nejsou autorskoprávně chráněné (§2 odst. 6 AutZ — matematický vzorec/metoda/princip). Žebřík je mechanika; mapování číslo↔přídavné jméno je systém. Adjektiva žebříku jsou navíc terminologie v SRD pod CC BY 3.0.
  - *guardraily:* Samotné vzorce/mechaniky nevyžadují atribuci · Kde se v UI zobrazí doslovný popisný text ze SRD, nese atribuci · Výpočty popsat/implementovat vlastní logikou, ne kopií textu
- **[C] (d) Seznamy schopností (Fate nemá kouzla) — Stunts / Approaches / Skills** — Předvyplněný katalog: 18 defaultních Skills Fate Core + 6 FAE Approaches + příkladové Stunty. Dva režimy: (i) DOSLOVNĚ převzato ze SRD s atribucí, nebo (ii) PARAFRÁZE / originální stunty a uživatelsky vytvořené položky. Fate ekvivalent 'kouzel/schopností' = stunty, approaches, skills.
  - *základ:* Seznamy skills/approaches/stuntů jsou v SRD pod CC BY 3.0 — doslovné převzetí povoleno s atribucí. Mechanika 'stunt = pojmenovaná výjimka z pravidel' je nechráněná struktura (§2 odst. 6 AutZ). Vlastní/parafrázovaný obsah je zcela volný.
  - *guardraily:* Doslovné položky ze SRD → atribuční blok + vyznačení změn + zachování copyright notice · Doslovný SRD text nezamykat DRM — musí být extrahovatelný · Data ze SRD technicky oddělit (tagovat) od uživatelského a AI obsahu (oddělení zdrojů) · Nenaznačovat endorsement
- **[C] (e) Bestiář / statbloky** — Formát statbloku pro Fate NPC/tvory (aspekty, skills, stres, consequences, stunty). Předvyplněné příkladové NPC/tvory ze SRD — včetně World-of-Adventure / Atomic Robo SRD příkladů — s atribucí; plus generování vlastních statbloků a token-instancí.
  - *základ:* Formát statbloku = nechráněná mechanika/struktura (§2 odst. 6 AutZ). Konkrétní příkladoví tvorové/NPC ze SRD (i World SRD, např. Atomic Robo) jsou pod CC BY 3.0 — přebrání povoleno s atribucí. Nově vytvořené bytosti jsou originál.
  - *guardraily:* Doslovní tvorové ze SRD → atribuce + vyznačení změn + oddělený datový zdroj · U World SRD titulů ověřit, že daný text je skutečně pod CC BY 3.0 a použít správný atribuční blok titulu · Nepoužívat ilustrace tvorů z Fate knih (CC kryje jen text) — obrázky vlastní/originální · Nenaznačovat endorsement
- **[C] (f) Taháky pravidel (cheat sheet)** — Rychlá referenční karta jádra: čtyři akce (Overcome, Create Advantage, Attack, Defend), čtyři výsledky (Fail, Tie, Success, Success with Style), žebřík, ekonomika Fate Points, invoke/compel aspektů. Doporučený režim: shrnutí VLASTNÍMI SLOVY; volitelně doslovné výňatky ze SRD.
  - *základ:* Popis mechaniky vlastními slovy = nechráněná myšlenka/postup (§2 odst. 6 AutZ) — plně volné. Doslovné výňatky ze SRD jsou pod CC BY 3.0 (s atribucí).
  - *guardraily:* Preferovat vlastní formulace → odpadá atribuce i řešení DRM · Při doslovném převzetí: plný atribuční blok + vyznačení změn + bez DRM zámku · Nekopírovat layout/trade dress oficiálních karet
- **[C] (g) Taktická mapa + tokeny** — Zónová/taktická mapa vhodná pro Fate (zóny místo gridu), tokeny, situační aspekty na scéně, boost markery, tracker iniciativy/konfliktu. Generická VTT funkčnost s Fate terminologií zón/aspektů.
  - *základ:* Licence nemá žádné omezení oblasti užití — VTT/herní stůl výslovně povoleny. Žádný chráněný obsah není nutný; 'zóna', 'aspekt scény' je terminologie ze SRD (volně). Funkčnost mapy je generická.
  - *guardraily:* ŽÁDNÉ Fate ani Evil Hat logo na mapě/tokenech · Nepoužívat žádné umělecké assety/ikonografii/trade dress z Fate knih — CC kryje jen TEXT, ne grafiku; tokeny a ilustrace vlastní/originální · Volitelné 'Powered by Fate' logo jen s povinným textem, bez přebarvení/přetváření · Nenaznačovat endorsement
- **[C] (h) Veřejná landing / SEO stránka + wording** — Veřejná stránka propagující podporu Fate: kompatibilní wording ('nástroje pro hru Fate Core a Fate Accelerated', 'kompatibilní se systémem Fate'), SEO klíčová slova, popis funkcí. Faktické, nominativní odkazování na název hry.
  - *základ:* Nominativní/faktické užití názvu pro popis kompatibility (deskriptivní užití ochranné známky). Terminologie ze SRD volně použitelná. Meze: CC BY 3.0 §4(b) + explicitní pravidlo Evil Hat = zákaz naznačování spojení/endorsementu a zákaz užití Fate™ jako názvu produktu implikujícího oficiální Fate produkt.
  - *guardraily:* Používat pouze kompatibilní/nominativní formulace ('kompatibilní s', 'pro systém Fate'), NIKDY 'oficiální', 've spolupráci', 'schváleno Evil Hat' · Nepojmenovat produkt/službu 'Fate …' způsobem implikujícím oficiální produkt · Viditelně zobrazit disclaimer o neexistenci spojení + ochrannou známku Fate™ · Bez Fate/Evil Hat loga; volitelně jen 'Powered by Fate' logo s povinným textem (přebarvení jen po e-mailu na feedback@evilhat.com) · Netvořit obsah poškozující čest/reputaci Evil Hat
- **[C] (i) Import / export** — Export deníku/postavy/scény (JSON, PDF) včetně Fate struktury a hodnot; import z kompatibilních formátů. Datová přenositelnost uživatelova obsahu i systémové struktury.
  - *základ:* Struktura/mechanika a uživatelská data jsou volně přenositelné (§2 odst. 6 AutZ). Export přímo naplňuje princip CC BY §4(a) 'žádné DRM' — příjemce si obsah může odnést a dál uplatnit svá práva.
  - *guardraily:* Pokud export obsahuje doslovný text SRD, MUSÍ nést atribuční blok + copyright notices · Neuvalovat DRM/technická opatření bránící extrakci SRD textu (§4(a) CC BY) · Vyznačit provedené úpravy oproti originálu, pokud jde o adaptovaný text
- **[C] (j) AI generátor kompatibilního obsahu** — AI generuje NOVÝ Fate-kompatibilní obsah: aspekty, stunty, approaches popisy, NPC/statbloky, zápletky, situační aspekty scén — formulované originálně, vlastními slovy, ne reprodukcí SRD.
  - *základ:* Generovaný nový obsah popsaný vlastními slovy = originální/transformativní vyjádření nad nechráněnou mechanikou (§2 odst. 6 AutZ). Generování kompatibilního obsahu (bez doslovné reprodukce SRD) nespadá pod licenci vůbec.
  - *guardraily:* Zajistit, že výstup NEreprodukuje text SRD doslovně (jinak vzniká distribuce licencovaného textu a povinnost atribuce) · Výstup jasně označit jako AI-generovaný a strojově oddělit od oficiálního SRD datového zdroje · Nenaznačovat endorsement ani oficiální Fate obsah · Netvořit obsah poškozující reputaci Evil Hat

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek právně obhajitelný a nadprůměrně konzervativní — správně staví na tom, že anglický Fate SRD (Core/FAE/Condensed i World SRD jako Atomic Robo) je pod CC BY 3.0 Unported, což je ověřeno z primárních zdrojů a skutečně povoluje doslovné převzetí, úpravu, vlastní překlad, komerci i VTT/appku bez virality a bez vyjednané smlouvy. Klíčové pasti jsou podchycené: zákaz d20.cz CZ překladu (CC BY-NC-SA nákaza — potvrzeno), zákaz log/ilustrací/trade dressu (CC kryje jen TEXT), zákaz DRM (§4(a)), povinný atribuční blok stejné velikosti (znění ověřeno doslovně) a zákaz dojmu endorsementu. Nutné opravy před spuštěním: (1) MISSING GUARDRAIL — Fate Core font a 'Four Actions' ikony jsou '© Evil Hat, used with permission', NEJSOU pod CC BY; ošetřit u listu (b), výpočtů žebříku (c) i taháku (f). (2) OVERREACH u (e) — z Atomic Robo / World SRD přebírat jen generické mechaniky/statbloky, NE pojmenované chráněné postavy a značky (Atomic Robo, Tesladyne jsou separátní IP nad rámec CC BY licence rulesetu); komerční předvyplnění konkrétních postav je riziko. (3) Doplnit ošetření sui generis práva pořizovatele databáze (EU/CZ) u hromadných SRD katalogů (d) — CC BY 3.0 Unported ho nelicencuje tak jednoznačně jako 4.0; stavět na vlastní selekci/nepodstatné extrakci. (4) Drobně: opravit citaci CC BY 3.0 §3 → §4(b)/§4(a); text překladu čerpat z oficiálních SRD downloadů, ne z reformátovaného webu; u SEO (h) nepoužívat 'Fate' jako brand v názvu/doméně. Žádné z toho neboří strop 'rich-open' — jde o dolaďovací guardraily a jeden zúžený rozsah (e), ne o zásadní vyvrácení.
- **[needs-guardrail]** (b) Systémově-strukturovaný list (High Concept, Approaches, Skills, stress, consequences, refresh, fate points) — uspořádání=nechráněná mechanika, terminologie=SRD CC BY.
  - → Přidat guardrail: nepoužívat Fate Core font ani Four Actions/Fudge-dice ikonografii; popisky sázet vlastním fontem, symboly akcí/kostek vlastní/textové.
- **[needs-guardrail]** (d) Seznamy Skills/Approaches/Stunts — doslovně ze SRD s atribucí, nebo parafráze.
  - → Přidat guardrail: spoléhat na vlastní selekci/uspořádání katalogu a nepodstatnost extrakce; případně preferovat parafrázi u hromadných dat. Nepředstírat, že CC BY 3.0 jednoznačně licencuje i sui generis DB právo.
- **[overreach]** (e) Bestiář/statbloky — příkladoví tvorové/NPC ze SRD včetně World-of-Adventure / Atomic Robo SRD, doslovně s atribucí, commercialSafe, confidence 0.9.
  - → Přidat guardrail: z World/Atomic Robo SRD přebírat jen GENERICKÉ statbloky/mechaniky bez konkrétních chráněných postav a značek; pojmenované postavy/settingové entity nepředvyplňovat jako výchozí obsah. Ověřit per-title, že daný text je CC BY a že nejde o chráněnou postavu.
- **[needs-guardrail]** (f) Taháky pravidel — čtyři akce, čtyři výsledky, žebřík, ekonomika FP; doporučeně vlastními slovy, volitelně doslovně.
  - → Doplnit: ikony čtyř akcí a symboly kostek kreslit vlastní; nepoužívat Evil Hat Fate Core font/Four Actions ikonografii.
- **[needs-guardrail]** (h) Veřejná landing/SEO — nominativní 'kompatibilní s Fate', zákaz 'oficiální/schváleno', disclaimer, confidence 0.82.
  - → Zachovat guardraily; navíc nepoužívat 'Fate' v názvu produktu/domény/titulcích a hero-nadpisech jako brand, jen v popisné pozici; disclaimer umístit near-the-fold, ne jen do patičky.
- **[needs-guardrail]** Legal-basis (b/d): 'vyznačení změn dle CC BY 3.0 §3'.
  - → Opravit odkaz na §4(b) (atribuce/označení adaptace) a §4(a) (žádná technická opatření/DRM).

**Avoid:**
- NEPOUŽÍVAT český překlad Fate SRD z d20.cz (sirien) — je pod CC BY-NC-SA, tj. komerčně nepoužitelný a se share-alike; pro komerční Ikaros efektivně zakázaný. Vlastní CZ překlad tvořit VÝHRADNĚ z anglického CC BY 3.0 SRD.
- NEPOUŽÍVAT Fate logo ani oficiální logo Evil Hat. Povolené je jen samostatné 'Powered by Fate' logo s povinným textem ('Fate™ is a trademark of Evil Hat Productions, LLC. The Powered by Fate logo is © Evil Hat Productions, LLC and is used with permission.'); změna barvy jen po e-mailu na feedback@evilhat.com; logo nepřetvářet ani nepoužívat po částech.
- NENAZNAČOVAT ani netvrdit spojení, sponzorství či endorsement ze strany Evil Hat/autorů (CC BY 3.0 §4(b) + explicitní pravidlo Evil Hat).
- NEPOUŽÍVAT ochrannou známku Fate™ jako název/branding produktu způsobem implikujícím oficiální Fate produkt.
- NEPOUŽÍVAT žádné umělecké assety, ilustrace, ikonografii ani trade dress z Fate knih — CC BY kryje jen TEXT SRD, nikoli grafiku; veškeré obrázky/tokeny vlastní nebo originální.
- NEUVALOVAT DRM/technická opatření na distribuovaný text SRD (§4(a) CC BY) — doslovný SRD text musí zůstat extrahovatelný/kopírovatelný s atribucí.
- NEVYNECHAT atribuční blok: uvést ho na copyrightové stránce stejně velkým písmem jako zbytek copyright sekce; pro Fate Condensed přidat samostatný blok; u adaptací vždy vyznačit provedené změny.
- NETVOŘIT obsah poškozující čest nebo reputaci Evil Hat (integrita díla).
- NENECHAT AI reprodukovat SRD text doslovně bez atribuce — výstupy musí být originální/transformativní.

**Návrh disclaimeru:**
> Ikaros není spojen se společností Evil Hat Productions, LLC, ani jí není schválen či sponzorován. Fate™ je ochranná známka Evil Hat Productions, LLC. Tato platforma poskytuje nástroje kompatibilní s hrou Fate Core System a Fate Accelerated Edition (a případně Fate Condensed), jejichž pravidla jsou zveřejněna pod licencí Creative Commons Attribution 3.0 Unported. Text pravidel použitý na platformě je licencován pod CC BY 3.0; jakékoli úpravy oproti originálu jsou vyznačeny a nejsou schváleny ani ověřeny Evil Hat. Ilustrace, loga a značky Fate / Evil Hat nejsou součástí této licence a nejsou zde použity.

**Návrh atribuce:**
> HLAVNÍ ATRIBUČNÍ BLOK (povinný, doslovně anglicky, na copyrightové stránce, stejně velkým písmem jako zbytek copyright sekce): "This work is based on Fate Core System and Fate Accelerated Edition (found at https://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/)."

SAMOSTATNÝ BLOK PRO FATE CONDENSED (přidat POUZE pokud použijeme text z Fate Condensed): "This work is based on Fate Condensed (found at https://www.faterpg.com/), a product of Evil Hat Productions, LLC, developed, authored, and edited by PK Sullivan, Lara Turner, Fred Hicks, Richard Bellingham, Robert Hanz, and Sophie Lagacé, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/)."

DOPLŇKY: U každé adaptace/úpravy oproti originálu jasně vyznačit, že byly provedeny změny (CC BY 3.0 §3). Zachovat všechny copyright notices. Pokud (volitelně) použijeme logo "Powered by Fate", přidat: "Fate™ is a trademark of Evil Hat Productions, LLC. The Powered by Fate logo is © Evil Hat Productions, LLC and is used with permission."

**Poznámky rešerše:** ZÁVĚR: Pro Fate Core/FAE existuje SILNÁ veřejná otevřená cesta — anglický SRD je pod CC BY 3.0 Unported (Evil Hat), což je nejliberálnější CC, komerční a NEvirální. Ikaros může TEĎ legálně a bez smlouvy/právníka postavit: plný text pravidel, terminologii, stunty/approaches/skills, příklady NPC/tvorů (statbloky), autofill+výpočetní deník, taktickou mapu, VTT i komerční verzi — vše jen s atribučním blokem a bez naznačování endorsementu.

TŘI PRAKTICKÉ PASTI: (1) Český překlad d20.cz (sirien) je CC BY-NC-SA → pro komerční platformu nepoužitelný; nutný VLASTNÍ CZ překlad z anglického CC BY SRD. (2) Fate logo NE, ale 'Powered by Fate' logo ANO s povinným textem (změna barvy jen po e-mailu). (3) Zákaz endorsementu + zákaz obsahu poškozujícího reputaci Evil Hat.

VERIFIKACE AKTUÁLNOSTI: Ověřeno k datu rešerše (červenec 2026). Nenašel jsem žádnou relicenci na CC BY 4.0 ani přechod na ORC — CC BY 3.0 zůstává aktuální; Evil Hat stále oficiálně uvádí fate-srd.com jako autoritativní zdroj SRD. K dispozici je i alternativní OGL 1.0a cesta (engine-level open), doporučená jen pro integraci s jiným OGL obsahem — pro Ikaros je CC BY 3.0 jednodušší a výhodnější.

METODICKÁ POZNÁMKA: Přímé WebFetch na www.faterpg.com a fate.d20.cz selhalo na chybě TLS certifikátu (host mimo altnames). Obešel jsem to přes fate-srd.com (Evil Hat oficiálně endorsovaný autoritativní mirror licenčních textů), přes CC legalcode a přes fatesrd.d20.cz. Doslovná znění atribučních bloků, logo policy i CZ CC BY-NC-SA jsou potvrzena z primárních/autoritativních zdrojů; confidence 0.9. Detail 'Powered by Fate' logo podstránky vracel 500, ale povinný text loga je potvrzen ze dvou nezávislých autoritativních výtahů.

Zdroje: https://fate-srd.com/official-licensing-fate · https://fate-srd.com/official-licensing-fate/cc · https://fate-srd.com/official-licensing-fate/ogl · https://www.faterpg.com/licensing/licensing-fate-cc-by/ · https://creativecommons.org/licenses/by/3.0/legalcode · https://fatesrd.d20.cz/

---

### Jeskyně a Draci (JaD)  `jad`

**Strop:** `rich-open`

> Strop = rich-open. Komunitní licence JaD pro třetí strany (účinná 2025-12-02, ověřená ze dvou primárních zdrojů: jeskyneadraci.cz + vydavatel Mytago) VÝSLOVNĚ povoluje: volné použití všech pravidel JaD (vč. schopností a kouzel), všech termínů a JaD překladového klíče k DnD, komerční zpeněžení, libovolné (sub)licencování a tvorbu rozšíření i alternativních pravidel/hacků. Pokrývá celý plánovaný stack Ikara (deník, autofill, seznamy, bestiář, taktická mapa, generátor, landing/SEO) i budoucí KOMERČNÍ režim — bez vyjednané smlouvy a bez právníka (finálně schválí právník). KLÍČOVÉ ROZLIŠENÍ držící strop bezpečný napříč vrstvami: (1) LICENCOVANÝ OBSAH, který SMÍME PŘEVZÍT i doslovně = pouze mechanická/funkční data + termíny + překladový klíč (názvy povolání, atributů, dovedností, kouzel; úrovně, dosahy, kostky, DC, číselné statbloky, vzorce). (2) CHRÁNĚNÝ OBSAH, který smíme JEN POPSAT VLASTNÍMI SLOVY (parafráze) nebo vůbec ne = doslovné popisné/flavor BLOKY TEXTU a ILUSTRACE z oficiálních JaD produktů (výslovně zakázáno). Herní systém/mechanika je navíc nezávisle mimo autorskoprávní ochranu — §2 AutZ chrání konkrétní tvůrčí vyjádření, ne myšlenku, postup, systém, metodu ani matematický vzorec — takže i bez licence stojí výpočty a datová struktura na pevné zemi. EN SRD 5.1 pod CC-BY-4.0 (neodvolatelná) je engine-level pojistka pro podkladové mechaniky a jediná bezpečná cesta pro vícejazyčnost. Strop sráží pod bezvýhradné rich-open jen dva měkké body (proto guardraily, ne blokace): formát VTT/aplikace a překlad JaD-specifických českých pojmů nejsou v licenci jmenovány VÝSLOVNĚ. VTT = povolené odvozené dílo (licence neomezuje formu/médium a povoluje rozšíření i změny JaD; nic VTT nezakazuje). Překlad JaD-pojmů konzervativně nepředjímat — pro cizí jazyky stavět na EN SRD 5.1.

**Licenční základ:**
- **Komunitní licence JaD pro třetí strany (Licence JaD pro třetí strany)** — `community-license` · ✔ primární zdroj · https://www.jeskyneadraci.cz/blog/komunitni-tvorba-licence
  - „Svou tvorbu můžete: Libovolně zpeněžit"
  - „Libovolně licencovat (doporučujeme použití Creative Commons licencí)"
  - „Volně používat: Všechna pravidla Jeskyní a Draků (vč. schopností, kouzel atd.)"
  - „Všechny termíny a JaD překladový klíč k DnD"
  - „Obecnou JaD grafiku (styly textu, barvy, rámečky…), ale NE ilustrace"
  - „Tvořit: Rozšíření pro Jeskyně a Draky (dobrodružství, světy, nová povolání, pravidla atp.); Změny Jeskyní a Draků (alternativní pravidla, hacky atp.)"
  - „Nesmíte: Používat ilustrace z oficiálních JaD produktů"
  - „Nesmíte: Kopírovat bloky textů z oficiálních JaD produktů"
  - „Musíte viditelně použít nezměněné JaD logo komunitní tvorby (barva se může měnit kvůli viditelnosti)"
  - „Disclaimer: [Název produktu] je nezávislá tvorba [autora] a není spojena s autory ani vydavatelem hry Jeskyně a Draci (dostupné na imago.cz). Publikováno pod Licencí JaD pro třetí strany."
- **Mytago (vydavatel) — mirror téže komunitní licence** — `community-license` · ✔ primární zdroj · https://www.mytago.cz/blog/jad-komunitni-tvorba
  - „Svou tvorbu můžete: Libovolně zpeněžit"
  - „Libovolně licencovat (doporučujeme použití Creative Commons licencí)"
  - „Přisuzovat svému dílu podporu autorů nebo vydavatele — zakázáno"
- **D&D System Reference Document 5.1 (podkladová EN herní mechanika)** — `cc-by-4.0` · ✔ primární zdroj · https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf
  - „The System Reference Document 5.1 is provided to you free of charge under the terms of the Creative Commons Attribution 4.0 International License ("CC-BY-4.0")."
  - „This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document."

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: ANO — 'Volně používat: Všechna pravidla Jeskyní a Draků (vč. schopností, kouzel atd.)'. Herní mechaniky/systém nejsou chráněny autorským právem, jen konkrétní vyjádření. LIMIT: zákaz 'Kopírovat bloky textů z oficiálních JaD produktů' → pravidla implementuj jako funkční data/parafráze, ne doslovný copy-paste flavor textu.
- `commercial`: ANO, explicitně — 'Svou tvorbu můžete: Libovolně zpeněžit' + 'Libovolně licencovat'. Budoucí monetizace Ikara nad JaD obsahem je licencí povolena.
- `vtt_app`: Pravděpodobně ANO (implicitně) — licence neomezuje formu/médium a povoluje 'Rozšíření pro JaD' i 'Změny JaD' bez omezení; VTT/herní stůl/autofill = přípustné odvozené dílo. Není nikde zakázáno. Podmínka: povinný disclaimer + komunitní logo, žádné oficiální ilustrace ani textové bloky. (Formát 'aplikace/VTT' není v textu jmenován výslovně — proto 'implicitně', ne 'výslovně'.)
- `logo_use`: JEN komunitní logo. Oficiální a vydavatelská loga ZAKÁZÁNA. 'JaD logo komunitní tvorby' (kompatibility logo) je naopak POVINNÉ použít viditelně a nezměněně (lze měnit jen barvu kvůli čitelnosti).
- `names_terminology`: ANO, explicitně — 'Volně používat: Všechny termíny a JaD překladový klíč k DnD'. Názvy povolání, kouzel, atributů, dovedností atd. lze používat volně.
- `spells_abilities_lists`: ANO — 'Všechna pravidla JaD (vč. schopností, kouzel atd.)' volně. Seznamy kouzel/schopností a jejich mechanické hodnoty (úroveň, dosah, kostky, efekt) použitelné. LIMIT: doslovný popisný/flavor text kouzla opsaný z oficiálního produktu = zakázaný 'blok textu'.
- `bestiary_statblocks`: Implicitně ANO jako součást 'všech pravidel vč. schopností' — mechanické statbloky/číselné hodnoty bestií použitelné pro bestiář a tokeny. LIMIT: nekopírovat doslovný popisný text bestie z oficiálního produktu; konzervativně statbloky generuj/parafrázuj vlastními slovy.
- `autofill_calc_sheet`: ANO — autofill deník s výpočty je funkční implementace nechráněných herních mechanik + explicitně povolených termínů/překladového klíče. Bez kopírování textových bloků a bez oficiálních ilustrací je plně v mezích licence.
- `derivatives`: ANO, explicitně — 'Tvořit: Rozšíření pro Jeskyně a Draky (dobrodružství, světy, nová povolání, pravidla atp.)' a 'Změny Jeskyní a Draků (alternativní pravidla, hacky atp.)'.
- `translation`: NEUPRAVENO — překlad JaD obsahu / překladového klíče do dalších jazyků licence výslovně neřeší; konzervativně nepředpokládat automatické oprávnění. Pozn.: podkladové ANGLICKÉ mechaniky jsou přes SRD 5.1 pod CC-BY-4.0, takže překlad EN SRD je povolen (s CC-BY atribucí) — ne však JaD-specifické české pojmy.

**Vyžaduje:**
- Viditelně a čitelně zobrazit disclaimer: '[Název produktu] je nezávislá tvorba [autora] a není spojena s autory ani vydavatelem hry Jeskyně a Draci (dostupné na imago.cz). Publikováno pod Licencí JaD pro třetí strany.'
- Viditelně použít nezměněné 'JaD logo komunitní tvorby' (jedinou povolenou úpravou je barva kvůli viditelnosti/čitelnosti).
- Doporučeno licencovat vlastní tvorbu pod Creative Commons.
- Při využití podkladového D&D SRD 5.1 (anglická mechanika) uvést CC-BY-4.0 atribuci WotC: 'This work includes material taken from the System Reference Document 5.1 by Wizards of the Coast LLC…'.

**Zakazuje:**
- Používat ilustrace z oficiálních JaD produktů.
- Kopírovat bloky textů z oficiálních JaD produktů (žádný doslovný copy-paste flavor/pravidlového textu).
- Používat oficiální loga nebo loga vydavatele (výjimka = jedině logo komunitní tvorby).
- Prezentovat dílo jako 'oficiální' produkt Jeskyní a Draků.
- Přisuzovat svému dílu podporu autorů nebo vydavatele.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecně-neutrální deník** — Univerzální deník postavy/hráče bez systémových polí: volný text, poznámky, sekce, přílohy, timeline. Žádné JaD názvosloví ani struktura. Čistě uživatelský obsah.
  - *základ:* Žádné cizí IP. Obsah generuje uživatel; neodvozeno z JaD. Mimo dosah licence i autorského práva třetích stran.
  - *guardraily:* Žádné JaD názvy/loga/ilustrace v generickém režimu · Uživatelský obsah zůstává uživateli
- **[C] (b) Systémově-strukturovaný deník (JaD pole/atributy/pořadí)** — Deníkové schéma s JaD poli: atributy (Síla/Obratnost/…), povolání, úrovně, dovednosti, záchranné hody, sloty — jako pojmenované datové pole ve funkčním pořadí odpovídajícím JaD.
  - *základ:* Komunitní licence: „Volně používat: Všechny termíny a JaD překladový klíč k DnD“ + „Všechna pravidla JaD (vč. schopností, kouzel atd.)“. Struktura listu = funkční datové schéma; §2 AutZ nechrání systém/uspořádání mechaniky, jen konkrétní vyjádření.
  - *guardraily:* Termíny jako funkční labely, ne opsaný popisný text · Viditelný disclaimer + komunitní logo na povrchu · Vlastní vizuální layout, ne kopie oficiálního listu/trade dress
- **[C] (c) Autofill + výpočty odvozených hodnot** — Automatický výpočet modifikátorů, bonusu zdatnosti, HP, KZ/AC, DC záchran, nosnosti, iniciativy atd. z JaD/D&D vzorců; přepočet při změně vstupů.
  - *základ:* Matematické vzorce a herní mechaniky jsou z ochrany vyloučeny (§2 AutZ: myšlenka/postup/metoda/matematický vzorec). Komunitní licence navíc povoluje „všechna pravidla“. Výpočet = ryzí mechanika.
  - *guardraily:* Vzorce implementovat jako kód/funkční data, ne opsaný text · Disclaimer + logo na výstupu
- **[C] (d) Seznamy kouzel / schopností / předmětů (mechanická data)** — Katalogy kouzel, schopností povolání a předmětů s mechanickými poli: úroveň, škola, dosah, doba, trvání, kostky/efekt, cena, váha. Filtr/vyhledávání/vklad do deníku a obchodu.
  - *základ:* Komunitní licence: „Všechna pravidla JaD (vč. schopností, kouzel atd.)“ volně; mechanické hodnoty = fakta/data. Termíny volně dle překladového klíče.
  - *guardraily:* Mechanická pole ANO; popisný/flavor text kouzla či předmětu VLASTNÍ PARAFRÁZÍ, ne copy-paste z oficiálního produktu · Z fan projektu JaDsrd čerpat data, ne rozsáhlé textové pasáže · Disclaimer + komunitní logo
- **[C] (e) Bestiář + mechanické statbloky pro tokeny** — Bestiář a herní tokeny s číselnými statbloky: KZ/AC, HP, rychlost, atributy, útoky, kostky zranění, odolnosti, schopnosti, CR. Napojení na taktickou mapu.
  - *základ:* Komunitní licence: mechanické statbloky jako součást „všech pravidel vč. schopností“. Statblok = data/fakta. Nezávislá pojistka: monstra z EN SRD 5.1 pod CC-BY-4.0.
  - *guardraily:* Číselné statbloky ANO; popisný lore/flavor bestie VLASTNÍ PARAFRÁZÍ, konzervativně generovat vlastními slovy · ŽÁDNÉ oficiální ilustrace — vlastní/generovaná grafika nebo generické tokeny · U SRD-odvozených bestií nést CC-BY atribuci · Disclaimer + komunitní logo
- **[C] (f) Taháky pravidel** — Kondenzované referenční taháky: stavy, akce v boji, kryt, podmínky, přehled pravidel — jako rychlá pomůcka u stolu.
  - *základ:* Komunitní licence: „všechna pravidla JaD… volně používat“. Pravidla = mechanika, volně použitelná. §2 AutZ nechrání postup/metodu.
  - *guardraily:* Vlastní shrnutí/formulace, NE doslovné odstavce z příručky (zákaz „bloků textu“) · Disclaimer + komunitní logo
- **[C] (g) Taktická mapa + tokeny (VTT)** — Herní stůl: taktická mapa, tokeny se statbloky, iniciativa, mlha války, LoS, dosahy — jako odvozené VTT dílo pro JaD hru.
  - *základ:* Komunitní licence neomezuje formu/médium a povoluje „Rozšíření pro JaD“ i „Změny JaD“ bez omezení → VTT = přípustné odvozené dílo; nic ho nezakazuje. Mechanická token-data volně.
  - *guardraily:* ŽÁDNÉ oficiální ilustrace/mapy — vlastní, generovaná nebo uživatelem nahraná grafika s vlastními právy · Disclaimer + komunitní logo na povrchu · VTT není v licenci jmenován výslovně → beru jako implicitně povolené (proto nižší confidence)
- **[C] (h) Veřejná landing/SEO stránka + wording kompatibility** — Veřejné marketingové/SEO stránky uvádějící kompatibilitu s JaD: „kompatibilní s Jeskyněmi a Draky“, výčet podporovaných funkcí, klíčová slova.
  - *základ:* Nominativní použití názvu k označení kompatibility; komunitní licence povoluje referovat na JaD a používat termíny. Nejde o klamání o původu.
  - *guardraily:* Wording „kompatibilní s JaD / pro Jeskyně a Draci“, NIKDY „oficiální“ · NEtvrdit ani nenaznačovat podporu/schválení autorů či vydavatele (výslovně zakázáno) · ŽÁDNÁ oficiální/vydavatelská loga; POVINNĚ komunitní logo kompatibility (nezměněné, jen barva) · Disclaimer viditelně na stránce · Nejcitlivější vrstva (ochranná známka/endorsement) — disciplína ve formulacích
- **[C] (i) Import / export dat** — Import/export deníků, statbloků a katalogů v interchange formátu (JSON/vlastní); přenos mezi světy/uživateli, záloha.
  - *základ:* Komunitní licence povoluje odvozená díla i libovolné (sub)licencování; interchange mechanických hodnot = funkční data. Export = vlastní uživatelský obsah + mechanická data.
  - *guardraily:* Exportovat mechanická/uživatelská data + parafráze; NEbalit oficiální ilustrace ani doslovné bloky textu · Každý export nese disclaimer; SRD-odvozený EN obsah nese CC-BY atribuci · Oddělit datové zdroje (JaD licence vs. SRD CC-BY vs. uživatel) kvůli atribuci
- **[C] (j) AI generátor kompatibilního obsahu** — Generátor JaD-kompatibilního homebrew: nová povolání, kouzla, schopnosti, předměty, bestie, dobrodružství, alternativní pravidla — mechaniky + originální popisný text.
  - *základ:* Komunitní licence VÝSLOVNĚ povoluje „Rozšíření pro JaD (dobrodružství, světy, nová povolání, pravidla atp.)“ a „Změny JaD (alternativní pravidla, hacky atp.)“. Generovaný kompatibilní obsah = explicitně povolené rozšíření.
  - *guardraily:* Výstup = mechaniky + VLASTNÍ originální text; NEreprodukovat doslovné oficiální textové bloky ani ilustrace · Zabránit regurgitaci chráněných pasáží ve výstupu · Disclaimer + komunitní logo na generovaném obsahu a exportu

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek PRÁVNĚ OBHAJITELNÝ a strop rich-open je opřený o doslovný text dvou primárních zdrojů (jeskyneadraci.cz + mytago.cz), ne o dohad. Licence skutečně výslovně povoluje komerci, (sub)licencování, rozšíření i hacky, všechna pravidla vč. schopností/kouzel, termíny a překladový klíč — žádná záměna 'zdarma' za 'nekomerční'. Klíčové rozlišení licencovaná mechanika vs. chráněný flavor text/ilustrace je právně správné a §2 odst. 6 AutZ (vyloučení systému/metody/vzorce) i SRD 5.1 CC-BY-4.0 tvoří pevné nezávislé pojistky. NUTNÉ OPRAVY před nasazením: (1) DOPLNIT chybějící guardrail obsahových omezení z oficiální licence — vyhnout se reálné politice/provokaci a POVINNĚ označit dospělá/horor/temně-fantasy témata; kriticky se to týká AI generátoru (j), bestiáře (e) a UGC. (2) Zpřísnit práci s JaDsrd — nemá žádnou explicitní licenci, jeho česká próza je fanovský překlad s vlastním autorstvím → brát jen číselná fakta, veškerou prózu generovat vlastní. (3) VTT (g) není v licenci jmenován → ponechat nižší jistotu, držet EN SRD engine-fallback a před KOMERČNÍM VTT si vyžádat písemné potvrzení Mytago. (4) Doladit atribuci: u SRD-odvozeného obsahu uvést i indikaci úprav (CC-BY-4.0); u SEO držet striktně nominativní užití názvu (možná ochranná známka). (5) Ošetřit reziduum sui generis databáze (nescrapovat cizí kompilaci). Datum '2025-12-02' odpovídá publikaci na jeskyneadraci.cz, ale licence nemá verzi → před finálním právním schválením re-verifikovat. Žádný nález nedosahuje úrovně blokace stropu; jde o guardraily a jednu skutečně chybějící obsahovou politiku.
- **[needs-guardrail]** Kompletní avoid-list a feature (j) AI generátor pokrývají všechna licenční omezení.
  - → Přidat do avoid + do guardrails feature (j)/(e): content-policy filtr proti politickému/provokativnímu výstupu; povinné označení dospělého/horor/temně-fantasy obsahu; moderace UGC. Doplnit i do disclaimer/onboarding tvůrců.
- **[needs-guardrail]** Feature (g) Taktická mapa/VTT = přípustné odvozené dílo, commercialSafe:true, confidence 0.8.
  - → Ponechat guardrail. Před komerčním spuštěním VTT vyžádat písemné potvrzení od Mytago; držet EN SRD 5.1 CC-BY jako engine-fallback pro podkladové mechaniky; ve VTT jen mechanika + vlastní/uživatelská grafika.
- **[needs-guardrail]** Feature (d)/(e)/(i): z fan projektu JaDsrd (d20.cz) čerpat data.
  - → Zpřísnit guardrail: VEŠKEROU prózu JaDsrd brát jako off-limits; extrahovat jen číselná/mechanická fakta; popisy generovat vlastními slovy; nespoléhat na neexistující licenci JaDsrd.
- **[needs-guardrail]** Mechanická data = fakta/data, volně (features d/e/i).
  - → Data brát jen z JaD-licencovaného/SRD rozsahu; nescrapovat cizí kompilovanou databázi jako celek.
- **[uncertain]** Licence účinná/ověřená 2025-12-02.
  - → Citovat jako 'publikováno 2025-12-02 (jeskyneadraci.cz)'; protože licence nemá verzi a může se měnit, znovu ověřit aktuální znění těsně před právním schválením a před komerčním spuštěním.

**Avoid:**
- Nepoužívat žádné oficiální ilustrace z JaD produktů (obálky, mapy, artworky, tokeny) — nikde: deník, bestiář, taktická mapa, landing ani export.
- Nekopírovat doslovné bloky textu z oficiálních JaD produktů (flavor popisy kouzel/bestií, pravidlové odstavce) — vždy vlastní parafráze.
- Nepoužívat oficiální ani vydavatelská loga (imago / Mytago); jediná povolená grafika je NEZMĚNĚNÉ logo komunitní tvorby JaD (upravit lze jen barvu kvůli čitelnosti).
- Neprezentovat Ikaros ani JaD obsah jako „oficiální“ produkt Jeskyní a Draků.
- Netvrdit ani nenaznačovat podporu/schválení autorů nebo vydavatele (žádné „ve spolupráci s“, „podpořeno autory“).
- Nevynechat povinný disclaimer + komunitní logo na žádném JaD povrchu ani exportu.
- Neopisovat rozsáhlé pasáže z fan projektu JaDsrd (d20.cz) — čerpat data/mechaniky, ne velké textové bloky.
- Nepředjímat oprávnění k překladu JaD-specifických českých pojmů do dalších jazyků (licence to neřeší); pro vícejazyčnost stavět na EN SRD 5.1 CC-BY.
- Nemíchat licencované JaD termíny/mechaniky se SRD 5.1 obsahem nebo jinými zdroji bez oddělení zdrojů a správné atribuce.
- U AI generátoru nedovolit reprodukci doslovných oficiálních textů/ilustrací ve výstupu (guard proti regurgitaci).

**Návrh disclaimeru:**
> Ikaros je nezávislá tvorba a není spojena s autory ani vydavatelem hry Jeskyně a Draci (dostupné na imago.cz). Publikováno pod Licencí JaD pro třetí strany.

**Návrh atribuce:**
> Podpora systému Jeskyně a Draci (JaD) v Ikarovi je nezávislé rozšíření publikované pod Licencí JaD pro třetí strany; využívá volně dostupná pravidla, termíny a překladový klíč JaD. Na každém JaD povrchu a exportu je viditelně zobrazeno nezměněné logo komunitní tvorby JaD (jedinou povolenou úpravou je barva kvůli čitelnosti). Podkladové herní mechaniky vycházejí ze System Reference Document 5.1 od Wizards of the Coast LLC, dostupného pod licencí CC-BY-4.0: „This work includes material taken from the System Reference Document 5.1 by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document." Ikaros netvrdí podporu ani schválení autorů či vydavatele hry.

**Poznámky rešerše:** JaD NENÍ closed systém — existuje veřejná otevřená cesta: 'Komunitní licence JaD pro třetí strany', účinná od 2025-12-02 (zdroj: jeskyneadraci.cz/blog/komunitni-tvorba-licence; totožné znění mirror u vydavatele Mytago: mytago.cz/blog/jad-komunitni-tvorba). Licence je pro Ikara silně příznivá: volné použití pravidel + termínů + překladového klíče, výslovně povolená komerce a libovolné (sub)licencování, tvorba rozšíření i alternativních pravidel. Sečteno: autofill/výpočetní deník, taktická mapa+tokeny, bestiář (mechanické statbloky), seznamy kouzel/schopností, wiki a SEO landingy nad JaD lze postavit TEĎ, bez smlouvy a bez právníka.

TVRDÉ MANTINELY (must dodržet ve všech vrstvách Ikara): (1) žádné oficiální ilustrace; (2) žádné doslovné bloky textu z oficiálních JaD produktů — obsah (popisy kouzel, bestií, pravidel) implementovat jako funkční data / vlastní parafráze, ne copy-paste; (3) žádná oficiální/vydavatelská loga, POVINNĚ ale komunitní 'JaD logo kompatibility'; (4) na každém JaD povrchu/exportu povinný disclaimer; (5) nevydávat za oficiální ani netvrdit podporu autorů/vydavatele.

DŮSLEDEK PRO AI GENERÁTOR: generovat kompatibilní obsah je OK (rozšíření/homebrew jsou explicitně povolena), ale výstup nesmí reprodukovat doslovné oficiální textové bloky ani ilustrace → generuj mechaniky + originální text.

NEDOŘEŠENO / KONZERVATIVNĚ: (a) VTT/aplikace a (b) překlad JaD nejsou v licenci jmenovány výslovně — VTT beru jako povolené odvozené dílo (nic ho nezakazuje), překlad JaD-pojmů raději nepředjímat. (c) SRD text na JaDsrd.d20.cz je FANOUŠKOVSKÝ projekt Kostky (d20.cz), ne 'oficiální produkt'; licence dovoluje na něj 'referovat/odkazovat', ne nutně doslovně přebírat velké bloky — pro jistotu z JaDsrd čerpat data/mechaniky, ne opisovat rozsáhlé pasáže.

ENGINE-LEVEL OTEVŘENÁ CESTA (pojistka): JaD staví na D&D 5e. WotC vydal 27.1.2023 System Reference Document 5.1 pod CC-BY-4.0 (media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf), CC je neodvolatelná; novější SRD 5.2.1 (2025) rovněž CC-BY-4.0. To je ANGLICKÁ, trvale otevřená vrstva mechanik (povolání, kouzla, statbloky, pravidla) použitelná i komerčně jen za CC-BY atribuci — nezávisle na JaD. Pozor: CC-BY pokrývá EN SRD obsah, NE české pojmy/překladový klíč JaD (ty řeší komunitní licence JaD). Pro čistě český JaD obsah je primární právní základ komunitní licence JaD; SRD 5.1 CC-BY slouží jako nezávislá záruka pro podkladové mechaniky a jako cesta pro vícejazyčnost.

Confidence 0.85: znění licence ověřeno ze dvou nezávislých primárních zdrojů (oficiální web + vydavatel), verbatim citace sedí; SRD 5.1 CC-BY ověřeno z WotC PDF. Sráží jen: části citací prošly shrnutím WebFetch (ne 100% raw HTML) a formáty VTT/překlad nejsou v licenci explicitně adresovány.

Zdroje: https://www.jeskyneadraci.cz/blog/komunitni-tvorba-licence · https://www.mytago.cz/blog/jad-komunitni-tvorba · https://dnd5esrd.d20.cz/jeskyne-a-draci/0-uvod.html (JaDsrd, fan projekt Kostky) · https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf

---

### Příběhy Impéria  `pribehy-imperia`

**Strop:** `moderate-open`

> Dvouvrstvý strop. VRSTVA SETTING (Příběhy Impéria / Mytago) = fakticky BLOCKED: svět, pravidlový text, terminologie, seznamy schopností/kouzel (vč. Rukověť mága), bestiář, statbloky, ilustrace i značka jsou all-rights-reserved; obchodní podmínky výslovně zakazují šíření i úpravu bez písemného souhlasu, takže z PI nesmíme přenést NIC. VRSTVA ENGINE (Fate, Evil Hat) = rich/komerčně otevřená: Fate Core/Accelerated/Condensed pod CC-BY 3.0 Unported dovolují kopii i deriváty i překlad i komerci (non-viral) s atribucí. Provozní maximum je proto moderate-open: můžeme postavit bohatý, komerčně bezpečný Fate-kompatibilní herní stůl (deník, autofill, taktická mapa, kostky 4dF, tahák z Fate SRD, AI generátor), ale VŽDY jako generický engine, do něhož si obsah plní uživatelé — žádná PI data, texty, terminologie, bytosti, statbloky, ilustrace ani branding. Není to rich-open pro PI jako systém: samotný cílový obsah PI je off-limits, legální je jen generická Fate náhrada, kterou hráči PI naplní vlastními daty. Pokud přepracované vydání PI 2023 od Fate divergovalo, je PI ruleset o to víc vlastní chráněná exprese — otevřený zůstává jen generický Fate SRD.

**Licenční základ:**
- **Příběhy Impéria (Mytago) — herní text, svět, značka, ilustrace, statbloky** — `none-found` · ✔ primární zdroj · https://www.mytago.cz/obchodni-podminky
  - „není možné jej bez mého předchozího výslovného písemného souhlasu dále šířit nebo umožnit jeho užití dalším osobám či jej jakkoli upravovat"
  - „Porušení autorských práv je postižitelné podle autorského zákona"
- **Fate Core System & Fate Accelerated Edition (Evil Hat) — CC-BY** — `cc-by-3.0` · ✔ primární zdroj · https://fate-srd.com/official-licensing-fate/cc
  - „You have the right to create new works of any kind derived from the SRDs"
  - „you don't have to license those works under a Creative Commons license if you don't want to"
  - „This work is based on Fate Core System and Fate Accelerated Edition (found at https://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (https://creativecommons.org/licenses/by/3.0/)."
- **Fate Condensed (Evil Hat) — CC-BY 3.0 Unported** — `cc-by-3.0` · ✔ primární zdroj · https://fate-srd.com/official-licensing-fate/cc
  - „Fate Condensed ... a product of Evil Hat Productions, LLC, developed, authored, and edited by PK Sullivan, Lara Turner, Fred Hicks, Richard Bellingham, Robert Hanz, and Sophie Lagacé, and licensed under the Creative Commons Attribution 3.0 Unported license"
- **Fate (OGL 1.0a) — alternativní otevřená cesta pro Fate Core/Accelerated** — `other` · ✔ primární zdroj · https://fate-srd.com/official-licensing-fate/ogl
  - „The OGL compels you to keep open what you've borrowed, and to make a clear product identity declaration about what you're not making open by basing your game on OGL content."
- **Licence JaD pro třetí strany (Mytago) — NEPLATÍ pro Příběhy Impéria; jen důkaz adjacentní** — `community-license` · ✔ primární zdroj · https://www.mytago.cz/blog/jad-komunitni-tvorba
  - „Games Covered: Only Jeskyně a Draci is mentioned. Příběhy Impéria is not referenced anywhere in this document."
  - „[Název produktu] je nezávislá tvorba [autora] a není spojena s autory ani vydavatelem hry Jeskyně a Draci (dostupné na imago.cz). Publikováno pod Licencí JaD pro třetí strany."

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: DVĚ VRSTVY. PI text: NE — all-rights-reserved, obchodní podmínky Mytago zakazují šíření i úpravu bez písemného souhlasu. Generický Fate rules text: ANO — Fate Core / Accelerated / Condensed SRD pod CC-BY 3.0 Unported lze kopírovat i upravovat s povinnou atribucí (non-viral).
- `names_terminology`: PI značka / svět / vlastní názvy (Příběhy Impéria, settingové pojmy): NE — chráněno, žádná veřejná licence. Generické Fate herní termíny (aspekty, dovednosti/přístupy, stunty, Fate points, žebříček +/−, stress, consequences): ANO z Fate SRD.
- `spells_abilities_lists`: PI-specifické seznamy schopností/kouzel (vč. Rukověť mága): NE — autorský text. Generické Fate mechaniky/stunty: ANO z SRD; vlastní seznamy ve Fate formátu ANO.
- `bestiary_statblocks`: PI bestiář a konkrétní statbloky (bytosti settingu): NE — autorský text + chráněný svět. Vlastní tvory zapsané v generickém Fate formátu: ANO.
- `autofill_calc_sheet`: Generický Fate autofill/výpočetní deník (matematika žebříčku, počítání stressu/consequences, refresh Fate points, sčítání dovedností): ANO — mechanika jako myšlenka není chráněná a Fate SRD je CC-BY. NE plnit ho PI daty, tabulkami, texty ani settingovými poli.
- `commercial`: PI: NE bez smlouvy s Mytago (budoucí monetizace se PI obsahu nesmí dotknout). Fate SRD (CC-BY 3.0): ANO — komerční užití výslovně povoleno, licence není viral.
- `derivatives`: PI: NE (obchodní podmínky výslovně zakazují 'jakkoli upravovat'). Fate: ANO — 'right to create new works of any kind derived from the SRDs'.
- `translation`: PI: NE — překlad je odvozené dílo, zakázán bez souhlasu. Fate: ANO — překlad je plnohodnotné odvozené dílo pod CC-BY, povolen (existují i komunitní CZ překlady Fate).
- `vtt_app`: Generický Fate VTT / herní stůl (autofill deník, taktická mapa, tokeny, kostky, chat, generátor kompatibilního obsahu): ANO na bázi Fate SRD CC-BY 3.0 s atribucí. NE integrovat PI svět, texty, terminologii, statbloky ani ilustrace.
- `logo_use`: PI / Mytago logo: NE. Fate: Evil Hat/Fate loga NElze bez povolení; 'Powered by Fate' logo LZE užít s povinnou doložkou (viz requires). Logo nesmíš měnit tvar ani používat jen jeho část; barevnou úpravu jen po e-mailovém souhlasu Evil Hat.

**Vyžaduje:**
- Fate (CC-BY): u každého použitého SRD uvést atribuční blok z hlavičky SRD, přesně: 'This work is based on Fate Core System and Fate Accelerated Edition (found at https://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (https://creativecommons.org/licenses/by/3.0/).'
- Fate Condensed (CC-BY): obdobný atribuční blok s autory PK Sullivan, Lara Turner, Fred Hicks, Richard Bellingham, Robert Hanz, Sophie Lagacé, CC-BY 3.0 Unported.
- Při užití loga 'Powered by Fate' uvést: 'Fate™ is a trademark of Evil Hat Productions, LLC. The Powered by Fate logo is © Evil Hat Productions, LLC and is used with permission.'
- Při užití Fate fontu/ikon uvést: 'The Fate Core font is © Evil Hat Productions, LLC and is used with permission. The Four Actions icons were designed by Jeremy Keller.'
- Nesmí vznikat dojem, že produkt schvaluje/podporuje Evil Hat (no implied endorsement).
- PI (Mytago): pro JAKÉKOLIV užití PI obsahu (text, svět, názvy, statbloky, ilustrace, značka) je nutný předchozí výslovný písemný souhlas Mytago — bez smlouvy nelze.

**Zakazuje:**
- Kopírovat, šířit nebo upravovat text pravidel Příběhů Impéria, jejich svět/setting, terminologii, seznamy schopností/kouzel, bestiář, statbloky či ilustrace bez písemného souhlasu Mytago (obchodní podmínky, autorský zákon).
- Používat značku 'Příběhy Impéria' a loga Mytago.
- Opírat se o 'Licenci JaD pro třetí strany' — ta pokrývá jen Jeskyně a Draci, na Příběhy Impéria se nevztahuje.
- Považovat 'volně ke stažení' (verze 2009) za otevřenou licenci — jde o gratis, nikoli o právo k reuse/úpravě.
- Fate: měnit tvar loga 'Powered by Fate' nebo používat jen jeho část; používat Evil Hat/Fate loga bez povolení; implikovat podporu Evil Hat; užívat materiál způsobem poškozujícím reputaci Evil Hat.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecně-neutrální deník** — Zcela generický deník postavy: volná pole (jméno, popis, poznámky, portrét, tagy) bez jakékoli systémové struktury. Datový kontejner + UI neodvozený od žádného RPG. Prázdný, plní uživatel.
  - *základ:* Prázdný formulář/datový kontejner nenese chráněnou expresi (§2 AutZ: dílo = jedinečný výsledek tvůrčí činnosti; prázdná struktura pole jím není). Nic se z PI nepřebírá.
  - *guardraily:* Žádná settingová pole ani přednastavený obsah · Popisky polí generické, ne PI terminologie
- **[C] (b) Systémově-strukturovaný deník (generický Fate)** — Deník se strukturou Fate: pole pro aspekty, dovednosti/přístupy, stunty, Fate points, stress tracky, consequences, refresh. Popisujeme MECHANIKU vlastními slovy + generickou Fate terminologií z SRD; NEkopírujeme PI list ani PI pojmy.
  - *základ:* Výběr a uspořádání polí generického Fate charakterníku je funkční/standardní systém — herní mechanika a metoda nejsou chráněné (§2 odst. 6 AutZ vylučuje myšlenku, postup, metodu, princip). Navíc Fate SRD je CC-BY 3.0, takže i konkrétní Fate terminologie je licencovaná. PI-specifický list s PI terminologií by byl chráněná kompilace → nepřebírat.
  - *guardraily:* Jen generická Fate terminologie, ne PI settingové pojmy ani PI-specifické pojmenované subsystémy · Nezrcadlit 1:1 vydaný PI charakterník (výběr+uspořádání+názvy) · Žebříček popsat vlastní/komunitní CZ terminologií, ne PI překladem
- **[C] (c) Autofill + výpočty (generický Fate engine)** — Výpočetní jádro Fate: matematika žebříčku (Terrible…Legendary ↔ číselná škála), sčítání dovedností, počítání stress boxů a slotů consequences, refresh Fate points, resoluce hodu 4dF + dovednost vs. obtížnost. Čistá matematika/logika, prázdná vůči datům.
  - *základ:* Výpočet a herní procedura = neochránitelná myšlenka/metoda (§2 odst. 6 AutZ). Zároveň Fate SRD (CC-BY 3.0) tuto mechaniku výslovně dovoluje. Chráněná by byla jen konkrétní PI tabulka/text — ten neplníme.
  - *guardraily:* Engine je generický; datové zdroje = uživatelské nebo generický Fate, NIKDY PI tabulky/pole/texty · Oddělit výpočetní vrstvu od jakéhokoli obsahu (žádný PI seed)
- **[C] (d) Builder seznamů schopností/stuntů/předmětů (prázdný, generický Fate)** — Nástroj pro tvorbu a ukládání stuntů/schopností/předmětů ve Fate formátu, který si uživatel plní SÁM. Dodáváme jen prázdný builder + generickou Fate strukturu, ne obsah.
  - *základ:* Formát/mechanika stuntu je neochránitelný princip (§2 odst. 6 AutZ) + Fate SRD (CC-BY). PI-specifické seznamy (vč. Rukověť mága) jsou autorský text = nepřebírat; ale prázdný kontejner + vlastní uživatelský obsah jsou v pořádku.
  - *guardraily:* Default prázdný — žádné předvyplněné PI kouzlo/schopnost/předmět · Žádné PI názvy schopností ani PI katalogy · Neimportovat PI seznamy jako startovní knihovnu
- **[C] (e) Šablona bestiáře/statbloku (prázdná, generický Fate tvor)** — Šablona tvora ve Fate formátu (aspekty, dovednosti, stress, stunty) jako prázdný template; uživatel vytváří vlastní bytosti. Dodáváme strukturu, ne populaci.
  - *základ:* Struktura statbloku = generická Fate mechanika (§2 odst. 6 AutZ; Fate SRD CC-BY). PI bestiář a konkrétní hodnoty/lore/názvy tvorů jsou chráněný autorský text + chráněný svět → nikdy nedodáváme obsah, jen prázdný template.
  - *guardraily:* Žádní PI tvorové, PI hodnoty, PI jména ani lore · Bez ukázkového bestiáře odvozeného z PI · Náhledová data generická/neutrální
- **[C] (f) Tahák pravidel — generický Fate (reprodukce SRD s atribucí + vlastní popis mechaniky)** — Rychlý přehled pravidel Fate: buď (1) VERBATIM reprodukce Fate Condensed/Core SRD (to je licencí přímo dovoleno) s povinným atribučním blokem, nebo (2) mechanika popsaná VLASTNÍMI slovy. Je to tahák Fate, NE tahák Příběhů Impéria.
  - *základ:* Toto je jediná položka, kde smíme reprodukovat licencovaný text doslovně — Fate SRD je CC-BY 3.0 Unported a výslovně dovoluje kopii i úpravu s atribucí. Alternativně popis mechaniky vlastními slovy dle §2 odst. 6 AutZ. PI pravidlový text reprodukovat NELZE (all-rights-reserved).
  - *guardraily:* Při doslovné reprodukci SRD POVINNÝ CC-BY atribuční blok (viz attributionText) · Nesmí to být PI tahák: žádná PI-specifická/divergovaná pravidla, žádné bloky PI textu · Neuvádět dojem, že jde o oficiální PI pravidla
- **[C] (g) Taktická mapa + tokeny + kostky 4dF (system-agnostic VTT)** — Generický virtuální stůl: mapa, tokeny, fog of war, LoS, iniciativa, chat, Fate kostky (4dF). Plně system-agnostický software; obsah (mapy, art) dodává uživatel.
  - *základ:* Vlastní software + generická herní mechanika (4dF jako metoda, §2 odst. 6 AutZ; Fate SRD CC-BY). Žádný PI obsah se nepřebírá.
  - *guardraily:* Žádné PI mapy, PI ilustrace, PI token-art ani PI settingové názvy na mapě · Jen uživatelské nebo generické/licenčně čisté assety
- **[C] (h) Veřejná landing/SEO stránka — jen 'Fate-kompatibilní' wording** — Veřejná landing + SEO pro generický Fate-kompatibilní herní stůl. Marketing výhradně jako 'Fate-kompatibilní'. Volitelně logo 'Powered by Fate' S povinnou doložkou. Jméno Příběhy Impéria se v marketingu NEPOUŽÍVÁ.
  - *základ:* Slovní deskripce 'Fate-kompatibilní' + CC-BY Fate SRD; 'Powered by Fate' logo dovoleno s doložkou 'used with permission'. Značka Příběhy Impéria a loga Mytago nemají veřejnou licenci → nepoužívat; nominativní zmínka PI rizikuje dojem schválení, rešerše ji výslovně nedoporučuje bez licence.
  - *guardraily:* NIKDY 'Příběhy Impéria' jako název produktu ani v marketingu (ani nominativně bez licence) · Žádné logo/trade dress Mytago · Logo 'Powered by Fate' nedeformovat, needitovat tvar, jen s doložkou; neimplikovat endorsement Evil Hat · Povinný disclaimer o neexistenci vazby/schválení (viz requiredDisclaimerText)
- **[C] (i) Import/export uživatelských dat (generický formát)** — Přenositelnost DAT uživatele: export/import postav v otevřeném generickém formátu (JSON). Umožňuje uživateli vzít si vlastní obsah. My nedodáváme žádnou PI knihovnu.
  - *základ:* Uživatelova vlastní data + generický formát; nic z PI nedistribuujeme. Formát je náš/generický (§2 odst. 6 AutZ pro strukturu). Import obsahu je akt uživatele s jeho vlastními daty.
  - *guardraily:* Nedodávat žádné PI datové balíčky/knihovny ani importní šablony předvyplněné PI obsahem · Nestavět importér cíleně parsující/reprodukující publikované PI listy/statbloky jako hromadný obsah · Export = uživatelská data, ne redistribuce chráněného obsahu
- **[C] (j) AI generátor Fate-kompatibilního obsahu (přísně generický)** — AI generuje NOVÝ Fate-kompatibilní obsah (NPC, aspekty, stunty, scény, tvory) v generickém Fate formátu. Výstup je nová exprese ve funkčním formátu.
  - *základ:* Generuje novou expresi v neochránitelném mechanickém formátu (§2 odst. 6 AutZ) na bázi Fate SRD (CC-BY). Nejrizikovější položka: AI nesmí reprodukovat chráněnou PI expresi.
  - *guardraily:* NEtrénovat/neseedovat/nepromptovat model PI korpusem (texty, svět, statbloky, terminologie, ilustrace) · Nesmí vypisovat PI settingové názvy, PI tvory, PI seznamy kouzel ani PI lore · Na prompt 'vygeneruj Příběhy Impéria obsah' → generický Fate výstup, ne PI-derivát · Filtr/guard proti doslovné reprodukci chráněné exprese; lidská kontrola u komerčního nasazení

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek právně obhajitelný a jeho ústřední teze obstála i adversariálně: SETTING vrstva Příběhů Impéria je skutečně blokovaná (Mytago obchodní podmínky čl. VI.2 zakazují šíření, umožnění užití třetím i jakoukoli úpravu bez písemného souhlasu — ověřeno doslovně) a ENGINE vrstva Fate Core/Accelerated/Condensed je skutečně CC-BY 3.0 Unported, non-viral, komerčně i pro VTT bez field-of-use výluky (ověřeno na oficiálním Fate licensing zdroji). Strop moderate-open a všechny buildable položky a-j jako GENERICKÝ Fate nástroj plněný uživateli jsou legální. Žádná položka není tvrdý overreach do nelegálna. Nutné OPRAVY před nasazením (vesměs doplnění guardrailů, ne zrušení funkcí): (1) položka (h) 'Powered by Fate' logo — netvrdit 'used with permission' bez skutečného souhlasu Evil Hat; logo raději vynechat a držet jen slovní 'Fate-kompatibilní'; (2) doplnit SUI GENERIS databázové právo do guardrailů d/e/i — PI bestiář a Rukověť mága mohou být chráněná databáze i nad rámec copyrightu, importér nesmí být stavěn na hromadné parsování PI publikací; (3) atribuční CC-BY blok umístit do tiráže/patičky stejnou velikostí jako zbytek copyright sekce (formální podmínka licence); (4) AI generátor (j) — lidskou kontrolu, výstupní filtr a přenos odpovědnosti povýšit z doporučení na tvrdé podmínky komerce, ověřit atribuční dopad na AI výstupy; (5) marketing držet na 'Fate-kompatibilní', NIKDY 'kompatibilní s Příběhy Impéria' — engine navíc stojí na Fate Core (CC-BY), zatímco PI je modifikovaný Fate 2.0, takže PI-mechanická kompatibilita by vyžadovala reprodukci chráněné PI exprese. Po zapracování těchto pěti guardrailů je návrh komerčně bezpečný.
- **[needs-guardrail]** (h) Logo 'Powered by Fate' je 'dovoleno s doložkou used with permission'.
  - → Buď logo NEPOUŽÍVAT vůbec a spoléhat jen na slovní 'Fate-kompatibilní' (plně kryto CC-BY), NEBO před nasazením získat písemný souhlas Evil Hat a teprve pak doložku uvést. Do guardrailu přidat: 'logo jen po individuálním souhlasu EHP; do té doby zákaz'.
- **[needs-guardrail]** (f) Tahák: verbatim reprodukce Fate Condensed/Core SRD s atribučním blokem je licencí dovolena.
  - → Doplnit guardrail: atribuční blok viditelně v tiráži/patičce, stejnou velikostí jako zbytek copyright sekce, u každého SRD zvlášť; nesmí být skryt za odkaz jen 'na vyžádání'.
- **[needs-guardrail]** (d) builder seznamů, (e) šablona bestiáře, (i) import/export — prázdné generické kontejnery, žádná PI data.
  - → Do legalBasis a guardrailů (d/e/i) explicitně doplnit sui generis databázové právo: zákaz vytěžování/zužitkování podstatné části PI katalogů; importér nesmí být stavěn na hromadné parsování/reprodukci PI publikací, jen na uživatelova vlastní data.
- **[needs-guardrail]** (j) AI generátor Fate-kompatibilního obsahu — commercialSafe (confidence 0.75).
  - → Povýšit 'lidská kontrola' z doporučení na tvrdou podmínku komerčního nasazení; přidat výstupní guard proti substanční podobnosti + audit log; do ToS přenést odpovědnost za uživatelský prompt/výstup; ověřit, zda AI výstupy vyžadují Fate atribuci.
- **[needs-guardrail]** Engine stavíme jako 'generický Fate' na bázi Fate Core/Accelerated/Condensed SRD (CC-BY).
  - → Držet marketing striktně na 'Fate-kompatibilní' (Fate Core), NIKDY 'kompatibilní s pravidly Příběhů Impéria'. Nepřebírat žádný PI-specifický divergentní subsystém jako 'Fate'. Ověřit, že engine nekopíruje PI úpravy Fate 2.0.

**Avoid:**
- Kopírovat, šířit nebo upravovat pravidlový text Příběhů Impéria, jeho svět/setting, terminologii, seznamy schopností/kouzel (vč. Rukověť mága), bestiář, statbloky či ilustrace — bez písemného souhlasu Mytago (obchodní podmínky + autorský zákon).
- Používat značku 'Příběhy Impéria' jako název produktu nebo v marketingu (ani nominativně 'kompatibilní s Příběhy Impéria' bez licence — riziko dojmu schválení).
- Používat loga Mytago / PI trade dress.
- Přebírat PI český překlad Fate žebříčku / PI terminologii — překlad je chráněná odvozená exprese Mytago.
- Opírat se o 'Licenci JaD pro třetí strany' — kryje jen Jeskyně a Draci, na PI se nevztahuje.
- Považovat verzi 2009 'volně ke stažení' za otevřenou licenci — je to gratis, ne právo k reuse/úpravě.
- Seedovat/trénovat/promptovat AI generátor PI korpusem nebo ho nechat reprodukovat PI obsah.
- Předvyplňovat deník/builder/bestiář PI daty, tabulkami, kouzly, tvory nebo statbloky (data musí být uživatelská nebo generický Fate).
- Deformovat logo 'Powered by Fate', používat jen jeho část, používat Evil Hat/Fate loga bez doložky 'used with permission' nebo implikovat endorsement Evil Hat.
- Doslovně reprodukovat SRD (Fate) bez povinného CC-BY atribučního bloku.
- Dotýkat se PI obsahu v budoucím KOMERČNÍM režimu bez uzavřené smlouvy s Mytago.

**Návrh disclaimeru:**
> Tento nástroj je generický herní stůl a deník kompatibilní se systémem Fate. Nejde o oficiální produkt hry Příběhy Impéria — není s touto hrou ani s vydavatelstvím Mytago nijak spojen, propojen ani jimi schválen či podporován. Neobsahuje žádná pravidla, texty, svět, terminologii, seznamy schopností či kouzel, bytosti, statbloky ani ilustrace hry Příběhy Impéria; veškerý herní obsah si vytvářejí uživatelé sami. Fate™ je ochranná známka Evil Hat Productions, LLC. Tento nástroj nebyl vytvořen, schválen ani není podporován společností Evil Hat Productions.

**Návrh atribuce:**
> Tento nástroj využívá herní systém Fate na základě otevřených licencí Creative Commons Attribution 3.0 Unported. Povinné atribuční bloky:

This work is based on Fate Core System and Fate Accelerated Edition (found at https://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (https://creativecommons.org/licenses/by/3.0/).

This work is based on Fate Condensed (found at https://fate-srd.com/fate-condensed/), a product of Evil Hat Productions, LLC, developed, authored, and edited by PK Sullivan, Lara Turner, Fred Hicks, Richard Bellingham, Robert Hanz, and Sophie Lagacé, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (https://creativecommons.org/licenses/by/3.0/).

Doložka pouze při použití loga 'Powered by Fate': Fate™ is a trademark of Evil Hat Productions, LLC. The Powered by Fate logo is © Evil Hat Productions, LLC and is used with permission.

Doložka pouze při použití Fate fontu/ikon: The Fate Core font is © Evil Hat Productions, LLC and is used with permission. The Four Actions icons were designed by Jeremy Keller.

**Poznámky rešerše:** ZÁVĚR: Příběhy Impéria = UZAVŘENÝ systém, veřejná otevřená licence NEEXISTUJE (výslovně potvrzeno). Legální cesta pro Ikaros vede jen přes ENGINE-LEVEL Fate SRD, ne přes PI.

Dvě vrstvy:
1) PI / Mytago (svět, texty, značka, statbloky, ilustrace, PI-specifický ruleset) — all-rights-reserved. Obchodní podmínky zakazují šíření i úpravu bez písemného souhlasu, vymahatelné dle autorského zákona. Žádný SRD, žádná komunitní/třetí-strana licence, žádná fan policy pro PI. Adjacentní důkaz: Mytago provozuje 'Licenci JaD pro třetí strany' pro SVOU JINOU hru (Jeskyně a Draci), která PI vůbec nezmiňuje → Mytago umí open-licencovat, ale u PI to VĚDOMĚ neudělalo. Verze 2009 byla 'volně ke stažení' = gratis, ne open licence; přepracované vydání 2023 je placený komerční produkt (280 s., ISBN 978-80-88501-29-9).

2) Fate engine (Evil Hat) — OTEVŘENÝ. Fate Core, Fate Accelerated i Fate Condensed pod CC-BY 3.0 Unported (non-viral, komerce ANO, deriváty ANO, překlad ANO) s povinným atribučním blokem; alternativně OGL 1.0a pro Core/Accelerated (nutná Product Identity deklarace + Section 15). Loga/fonty Fate jen s doložkou 'used with permission', logo nelze deformovat.

PRAKTICKÝ NÁVOD pro Ikaros TEĎ (bez smlouvy, bez právníka): postav GENERICKÝ Fate herní stůl — autofill/výpočetní deník s Fate mechanikou (žebříček, aspekty, stunty, Fate points, stress/consequences), taktická mapa+tokeny, kostky (4dF), chat, wiki, AI generátor Fate-kompatibilního obsahu, veřejné SEO landing — vše pod Fate CC-BY 3.0 s atribucí a případně 'Powered by Fate' logem s doložkou. NEPŘEBÍREJ nic z Příběhů Impéria: svět, texty, názvy, terminologii settingu, seznamy kouzel/schopností, bestiář, statbloky, ilustrace ani značku. Marketuj jako 'Fate-kompatibilní', NIKDY jako 'Příběhy Impéria' bez licence od Mytago.

POZOR / nejistota: zdroje se rozcházejí, zda přepracované vydání 2023 systém 'přepsalo od základů' (odklon od Fate) vs. 'upravený Fate 2e'. Pokud PI ruleset od Fate divergoval, je o to víc VLASTNÍ chráněnou expression — otevřený zůstává jen generický Fate SRD, ne PI konkrétní pravidla. Obecně: herní mechanika jako abstraktní myšlenka není chráněná (idea/expression), ale konkrétní EXPRESE (text, tabulky, pojmenované subsystémy, terminologie) chráněná je → generický Fate autofill ANO, kopie PI textů/tabulek NE. Před navázáním PI-specifického obsahu nutná dohoda s Mytago.

Primární zdroje: mytago.cz/obchodni-podminky; mytago.cz/blog/jad-komunitni-tvorba; fate-srd.com/official-licensing-fate + /cc + /ogl; faterpg.com/licensing/licensing-fate-cc-by. Pozn.: imperium.mytago.cz (oficiální PI microsite) i faterpg.com měly TLS cert mismatch / redirecty a web.archive.org byl nedostupný přes WebFetch — obsah ověřen z fate-srd.com a mytago.cz přímo.

---

### Call of Cthulhu (Chaosium, 7th ed.)  `call-of-cthulhu`

**Strop:** `fan-noncommercial`

> CoC je UZAVŘENÝ systém — žádný veřejný SRD/OGL/ORC pro CoC-specifický obsah. Jediná veřejná bezsmluvní cesta pro CoC branding je Chaosium Fan Material Policy: NEKOMERČNÍ a jen WEB. Autocalc charakterový list je Fan Policy výslovně požehnaný (nejsilnější povolení). Ale plná CoC-brandovaná VTT (taktická mapa + tokeny) padá do výslovně vyloučené kategorie 'VTT' → strop pro CoC-brandovaný povrch je fanouškovský nekomerční web s povinným disclaimerem. Souběžná ODBRANDOVANÁ generická d100 vrstva (mechanika popsaná vlastními slovy dle §2 odst. 6 AutZ, případně text BRP:UGE pod ORC) umí i komerčně a bez media-restrikce — ale to už legálně NENÍ 'Call of Cthulhu' a nesmí nést žádný Mythos/CoC obsah ani značku. Strop tedy = fan-noncommercial pro cokoli s CoC identitou; komerční hlava je dosažitelná jen odbrandovaně.

**Licenční základ:**
- **Chaosium Fan Material Policy** — `fan-policy` · ✔ primární zdroj · https://www.chaosium.com/fan-material-policy/
  - „You may create your own versions of our character sheets, including web-based character sheets that autofill or calculate numerical values."
  - „Software, apps, and virtual tabletops (VTTs) including any item a user would download, install, and/or run, are not included in the Fan Material policy."
  - „Note, web-based character generators are fine; app based character generators are not."
  - „'Non-commercial' means you cannot sell or otherwise charge anyone for access to content used under this Fan Material Policy."
  - „You may reference the names of things, institutions, places, people, deities, and concepts"
  - „You may occasionally quote small sections of text, as long as you make clear where the text is from"
  - „You are not permitted to use our logos."
  - „You cannot emulate Chaosium or Moon Design Publications 'trade dress', including page templates, art styles or fonts."
  - „This [website, zine, or whatever it is] uses trademarks and/or copyrights owned by Chaosium Inc/Moon Design Publications LLC, which are used under Chaosium Inc's Fan Material Policy. We are expressly prohibited from charging you to use or access this content. This [website, character sheet, or whatever it is] is not published, endorsed, or specifically approved by Chaosium Inc. For more information about Chaosium Inc's products, please visit www.chaosium.com."
- **Chaosium Fan-Use and Licensing Q&A** — `online-policy` · ✔ primární zdroj · https://www.chaosium.com/fan-use-and-licensing-q-a/
  - „Under our Fan Material Policy you may create your own versions of our character sheets, including web-based character sheets that autofill or calculate numerical values. If you wish to monetise this, or produce an app that creates characters, you will require a Commercial License."
  - „Chaosium currently has an exclusive license agreement for Call of Cthulhu computer games with Focus Home Interactive. Consequently, while this agreement is in place, new licenses of any kind for 'Call of Cthulhu' computer/video games ... are not available."
  - „Note that even where the original Mythos works have entered the public domain, Chaosium's roleplaying game books constitute original expressions protected by copyright ... you cannot just copy our published text or use our material without permission."
- **Chaosium Trademarks and Copyrights** — `other` · ✔ primární zdroj · https://www.chaosium.com/trademarks-and-copyrights/
  - „Call of Cthulhu, Masks of Nyarlathotep, and Miskatonic University are registered trademarks ... of Chaosium Inc."
  - „Chaosium Inc. and the Chaosium logo are registered trademarks"
  - „Basic Roleplaying is a trademark of Chaosium Inc."
  - „Reproduction of material from this website by any means without written permission from Chaosium [is prohibited], with limited exceptions for images or short excerpts for the purpose of reviews and the copying of character sheets and handouts for non-commercial in-game use."
  - „Chaosium Arcane Symbol (the Star Elder Sign) © 1983; Chaosium Yellow Sign © 1989"
- **ORC License — Basic Roleplaying: Universal Game Engine (engine-level open path)** — `orc` · ✔ primární zdroj · https://www.chaosium.com/orc-license/
  - „The text of BASIC ROLEPLAYING: UNIVERSAL GAME ENGINE is available for personal and commercial use under the ORC license."
  - „Product Identity elements in this product include all artwork, illustrations, and graphic design ... all trademarks, including Call of Cthulhu, Chaosium, Fantasy World, Futureworld, Pendragon, RuneQuest, and Superworld."
  - „worldwide, royalty-free, non-sublicensable, non-exclusive, irrevocable license to exercise the Licensed Rights in the Licensed Material"
  - „under ORC, all game mechanics are automatically Licensed Material"
  - „under ORC, non-game mechanics are automatically Reserved Material unless you choose to designate them as Expressly Designated Licensed Material"
  - „Basic Roleplaying: Universal Game Engine, copyright © 2024 Chaosium Inc."
- **BRP System Reference Document / BRP Open Game License (older engine open path)** — `community-license` · ✔ primární zdroj · https://www.chaosium.com/brp-system-reference-document/
  - „You are certainly entitled to create your own game using creatures, stories, characters, or locations derived from the public domain stories of the Cthulhu Mythos – you just can't use Chaosium's BRP system to do that."
  - „Chaosium already has a game that does just that (Call of Cthulhu), the BRP-OGL does not allow you to publish your own variant of Call of Cthulhu."
  - „The license explicitly allows derivative works."
- **Miskatonic Repository (DriveThruRPG community content program)** — `marketplace-program` · ✔ primární zdroj · https://www.chaosium.com/miskatonic-repository/
  - „Creators can offer their work free of charge, set a price, or offer it as pay-what-you-want. 50% of the profit goes to the creator, and 50% is divided between Chaosium and DriveThruRPG."
  - „As of March 31, 2023, AI Art (such as Midjourney or Dall-E) is not permitted in new Chaosium community content titles, including the Miskatonic Repository."
- **Call of Cthulhu core game — no public open license (SRD/OGL/ORC) for CoC-specific content** — `none-found` · ✔ primární zdroj · https://www.chaosium.com/fan-use-and-licensing/
  - „There is not an Open Game License for Call of Cthulhu."
  - „the BRP-OGL does not allow you to publish your own variant of Call of Cthulhu"
  - „you can't use the BRP rules to create your own game using the Cthulhu Mythos"

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: Fan Material Policy (non-commercial, web-only): only 'occasionally quote small sections of text, as long as you make clear where the text is from.' Wholesale reproduction of Call of Cthulhu rules text is NOT permitted (copyrighted original expression, even where Lovecraft's Mythos is public domain). Engine path: the full BRP: Universal Game Engine text (d100 characteristics, skills, resistance table, combat) is reusable — including commercially — under the ORC license, but stripped of all CoC/Mythos-specific content.
- `names_terminology`: Yes under the Fan Policy for nominative reference: 'You may reference the names of things, institutions, places, people, deities, and concepts.' You may reference skill/characteristic/spell/creature/deity/place names. BUT 'Call of Cthulhu', 'Miskatonic University', 'Masks of Nyarlathotep', 'Nephilim' are registered trademarks — never usable as your product's brand, title, or logo.
- `spells_abilities_lists`: Spell/ability NAMES may be referenced (Fan Policy). Full descriptive spell/ability text is copyrighted — only 'small sections' quotable with source; a complete copied spell/ability list with descriptions is not covered non-commercially and needs a commercial license. No CoC-specific spells available under the ORC engine path.
- `bestiary_statblocks`: Not explicitly permitted. Creature/deity NAMES may be referenced; full statblock text/values are copyrighted expression, only quotable as 'small sections' with attribution. A complete CoC bestiary database is NOT covered by the Fan Policy → commercial license required. Generic BRP:UGE creature mechanics are reusable under ORC, but Mythos entities as Chaosium expresses them are excluded Product Identity.
- `autofill_calc_sheet`: YES — explicitly blessed and the strongest permission for Ikaros' deník: 'You may create your own versions of our character sheets, including web-based character sheets that autofill or calculate numerical values.' Conditions: must be web/browser-based (no download/install), and strictly non-commercial. Monetizing it, or shipping it as an app, requires a Commercial License.
- `commercial`: NO under the Fan Material Policy — 'Non-commercial means you cannot sell or otherwise charge anyone for access to content...'; the mandatory disclaimer states 'We are expressly prohibited from charging you to use or access this content.' Any paid/subscription/paywalled/ad-gated CoC use needs a negotiated Commercial License (and CoC computer/video games are unavailable — exclusive third-party license with Focus/Nacon). Commercial IS allowed at the engine level: BRP: Universal Game Engine 'is available for personal and commercial use under the ORC license' — generic d100 mechanics only, zero CoC IP.
- `vtt_app`: CoC-branded: excluded by the Fan Policy — 'Software, apps, and virtual tabletops (VTTs) including any item a user would download, install, and/or run, are not included in the Fan Material policy.' Browser-based character sheets/generators ARE allowed ('web-based character generators are fine; app based character generators are not'). A full VTT (tactical map + tokens) branded as Call of Cthulhu falls in the named 'VTT' exclusion → commercial license needed. Engine path has NO medium restriction: you may build a commercial web VTT/app on BRP:UGE mechanics, provided it carries no CoC/Mythos branding or content.
- `logo_use`: NO. 'You are not permitted to use our logos.' The Chaosium logo and 'Call of Cthulhu' are registered trademarks; the Star Elder Sign (© 1983) and Yellow Sign (© 1989) are separately copyrighted. You also 'cannot emulate ... trade dress, including page templates, art styles or fonts.'
- `derivatives`: Fan Policy: limited to original interpretations, not direct copies ('use our art for inspiration, not for direct copying'; 'don't retell one of our own stories in your words'; fan fiction/fan art OK). ORC engine path: full derivative works of the BRP:UGE mechanics are permitted (excluding Reserved Material/trademarks). Commercial derivative CoC scenarios/supplements are possible only via the Miskatonic Repository (DriveThruRPG storefront, 50/50 split) or a bespoke commercial license.
- `translation`: Not addressed by the Fan Material Policy; translating substantial CoC rules text is treated as a licensed/commercial activity (translations are among Chaosium's commercial licensing categories) → needs a commercial license. Referencing names in Czech is fine. Under the ORC path, translating the BRP:UGE text as a derivative work is permitted (mechanics only, with the required ORC notice).

**Vyžaduje:**
- Display the exact Fan Material Policy disclaimer verbatim on any CoC fan surface: 'This [website...] uses trademarks and/or copyrights owned by Chaosium Inc/Moon Design Publications LLC, which are used under Chaosium Inc's Fan Material Policy. We are expressly prohibited from charging you to use or access this content. This [...] is not published, endorsed, or specifically approved by Chaosium Inc. For more information about Chaosium Inc's products, please visit www.chaosium.com.'
- Keep all CoC content strictly non-commercial and free to access — no paywall, subscription, ad-gating, or any charge for access (this constrains Ikaros' future monetization for the CoC surface specifically).
- Keep the CoC surface web/browser-based only — no downloadable or installable client and no packaged app.
- When quoting rules text, quote only small sections and clearly state the source.
- For the ORC/BRP engine path: include the 'BRP: Universal Game Engine' ORC notice and credit 'Basic Roleplaying: Universal Game Engine, copyright © 2024 Chaosium Inc.', and designate your own setting/trademarks as Reserved Material.
- Respect Chaosium content restrictions: no excessive graphic violence/gore, no sexual abuse/pornography, no racist/homophobic/discriminatory content or overt political agendas.
- Miskatonic Repository content (if ever used) must be published through DriveThruRPG and contain no AI-generated art.

**Zakazuje:**
- No selling, subscription, paywall, or any charge for access to CoC content under the Fan Policy (non-commercial only).
- No use of Chaosium / Call of Cthulhu logos, the Star Elder Sign, or the Yellow Sign.
- No emulation of Chaosium trade dress — page templates, art styles, or fonts.
- No downloadable/installable software, apps, or VTT clients using CoC content; a full Call-of-Cthulhu-branded VTT is in the excluded 'VTT' category.
- No wholesale copying of rules text, full spell descriptions, published scenarios, or complete monster statblocks / bestiary databases.
- No use of registered trademarks (Call of Cthulhu, Miskatonic University, Masks of Nyarlathotep, Nephilim) as a product name, brand, or title.
- No app-based character generator without a commercial license.
- No Call of Cthulhu computer/video game — exclusive third-party license (Focus/Nacon) is in force; no new licenses available.
- ORC path caveat: you may NOT use the licensed BRP text to build a Cthulhu Mythos game or a Call of Cthulhu variant; all Chaosium trademarks are excluded Product Identity.
- No AI-generated art in any Chaosium community-content (Miskatonic Repository) title (since 2023-03-31).

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecně-neutrální deník (bez systému)** — Volný strukturovaný zápisník postavy BEZ jakýchkoli CoC polí a názvů — jméno, poznámky, deníkové zápisy, přílohy, tagy. Veškerý obsah píše uživatel sám.
  - *základ:* Vlastní původní software Ikaros; žádné cizí IP. Obsah = user-generated. Mimo dosah AutZ i trademarku úplně.
  - *guardraily:* Žádná předvyplněná CoC pole/názvy · Obsah tvoří uživatel, nic se nepřebírá
- **[C] (b) Systémově-strukturovaný deník — d100 skelet (odbrandovaný)** — Pole/atributy/pořadí odpovídající struktuře d100 hry popsané VLASTNÍMI SLOVY: charakteristiky (síla/kondice/velikost/obratnost/vzhled/inteligence/moc/vzdělání), odvozené hodnoty, seznam dovedností, příčetnost/štěstí/životy jako číselná pole, rozvržení sekcí. Bez loga, bez trade dress, bez převzatého popisného textu.
  - *základ:* §2 odst. 6 AutZ — postup, princip, metoda a systém NEJSOU dílem; struktura polí a herní mechanika = nechráněná myšlenka/metoda, lze popsat vlastními slovy. Navíc Fan Material Policy výslovně dovoluje 'your own versions of our character sheets'. Pro plně komerční variantu stavět na generickém d100 skeletu (ORC/BRP:UGE).
  - *guardraily:* Nepoužít 'Call of Cthulhu' jako název systému/světa/titulu — max nominativní 'kompatibilní s' · Nekopírovat popisné texty dovedností/atributů — jen vlastní formulace · Žádné šablony/fonty/trade dress Chaosium · Datově oddělit uživatelský obsah od referencí
- **[C] (c) Autofill + výpočty odvozených hodnot (vzorce/logika)** — Automatický výpočet: poloviční/pětinová hranice dovednosti, bonus k poškození a stavba z kombinace charakteristik, přepočty při změně vstupu, validace, rozvrh bodů. Logika = matematický postup.
  - *základ:* §2 odst. 6 AutZ — matematický vzorec a postup nejsou předmětem ochrany. Fan Material Policy tento případ VÝSLOVNĚ žehná: 'web-based character sheets that autofill or calculate numerical values' — nejsilnější explicitní povolení pro Ikaros deník.
  - *guardraily:* Vzorce implementovat z popisu mechaniky, ne opisem tabulek/textu z knih · Web/browser-based (Fan Policy: žádný stáhnutelný/instalovatelný klient) · Komerčně jen odbrandovaně; CoC-brandovaná verze nekomerčně
- **[·] (c') CoC-brandovaný charakterový list s autofill jako fan-artefakt** — Kompletní webový list explicitně prezentovaný jako pro Call of Cthulhu 7e s autofill/výpočty a nominativními odkazy na názvy — celý fanouškovský artefakt pod Fan Material Policy.
  - *základ:* Chaosium Fan Material Policy — explicitně dovoleno vytvořit vlastní web-based character sheet s autofillem. Nekomerční, jen web.
  - *guardraily:* Povinný disclaimer verbatim na povrchu · Nulový poplatek/paywall/předplatné/reklama na tomto povrchu · Jen web, žádný download/app · Žádné logo/Star Elder Sign/Yellow Sign/trade dress · Jen malé citace pravidel se zdrojem
- **[·] (d) Referenční seznam kouzel / schopností / předmětů (názvy + vlastní popis)** — Katalog s NÁZVY kouzel/schopností/předmětů jako odkaz + KRÁTKÝ mechanický souhrn napsaný vlastními slovy (co dělá, co se hází) a max malá citace se zdrojem. NE plné převzaté popisné texty ani celá databáze.
  - *základ:* Fan Policy — 'You may reference the names of things... deities, and concepts' + jen 'small sections' citovat se zdrojem. Názvy jako takové nejsou dílem; mechanický efekt vlastními slovy = §2/6 AutZ (metoda). Plné popisné texty jsou chráněná expression → nepřebírat.
  - *guardraily:* Žádné doslovné popisy z knih — vlastní formulace · Malé citace jen se zdrojem · Oddělit uživatelův homebrew od referenčních položek · Nekomerční povrch + disclaimer · Nevydávat kompletní opsanou databázi za vlastní
- **[·] (e) Bestiář — názvy tvorů/božstev + homebrew statbloky na prázdném skeletu** — Referenční NÁZEV tvora/božstva + vlastními slovy popsaný profil; statblok zadává UŽIVATEL do generických d100 polí (my dodáme jen prázdný skelet). NE kompletní převzaté statbloky ani popisné texty Chaosium.
  - *základ:* Fan Policy dovoluje referencovat názvy tvorů/božstev; jednotlivé hodnoty jako fakta nechráněny, ale tvůrčí výběr/uspořádání + popisný text statbloku Chaosium jsou chráněné → jen malé citace se zdrojem. Struktura statbloku = §2/6 (metoda). Kompletní CoC bestiář stojí MIMO Fan Policy → vyžadoval by komerční licenci.
  - *guardraily:* Nereplikovat kompletní oficiální statbloky ani bestiární databázi · Hodnoty ať zadává uživatel (jeho data), Ikaros dodá jen prázdný skelet · Vlastní slova u popisů · Nekomerční + disclaimer
- **[C] (f) Taháky / přehledy pravidel vlastními slovy** — Stručný přehled herních postupů (jak funguje test dovednosti, boj, příčetnost/hrůza) napsaný VLASTNÍMI SLOVY jako popis mechaniky, plus max malé citace klíčových frází se zdrojem. Vlastní příklady.
  - *základ:* §2 odst. 6 AutZ — postup/princip/metoda nejsou dílo, mechaniku lze popsat vlastními slovy. Fan Policy: 'occasionally quote small sections... make clear where the text is from.' Doslovný přepis pravidel NEpovolen.
  - *guardraily:* Žádné doslovné bloky pravidlového textu · Malé citace jen se zdrojem · Vlastní příklady, ne převzaté · Žádné tabulky opsané 1:1 s tvůrčím uspořádáním · CoC-brandovaný přehled nekomerčně
- **[C] (g) Taktická mapa + tokeny jako systémově-agnostický nástroj (odbrandovaný)** — Generický grid/mapový engine s tokeny, fog of war, iniciativou, LoS — vlastní software Ikaros BEZ jakéhokoli CoC obsahu a brandingu. Uživatel si nahrává vlastní mapy/tokeny.
  - *základ:* Vlastní původní software; mechaniky mapy = §2/6 (metoda). KLÍČ: Fan Policy VÝSLOVNĚ VYLUČUJE VTT ('virtual tabletops') → CoC-brandovaná plná VTT vrstva NENÍ pod Fan Policy = hlavní živé riziko. Odbrandovaný engine bez CoC obsahu je mimo tento problém; plně komerční umí i pod ORC/BRP:UGE (bez media-restrikce), pokud nenese žádné CoC/Mythos IP.
  - *guardraily:* NEbrandovat mapu jako 'Call of Cthulhu VTT' · Nedodávat CoC mapy/tokeny/handouty jako obsah · Uživatelský obsah datově oddělen · CoC-brandovanou plnou VTT vrstvu ODLOŽIT do komerční licence / dotazu na Chaosium — nejrizikovější bod celé Lane A
- **[·] (h) Veřejná landing/SEO stránka — nominativní wording** — Pravdivé popisné sdělení typu 'deník a nástroje kompatibilní s Call of Cthulhu 7. edice' pro SEO/orientaci, s ™ uznáním vlastnictví a disclaimerem o neexistenci vazby/schválení.
  - *základ:* Nominativní použití ochranné známky — pravdivý popisný odkaz na kompatibilitu, nezaměnitelný, bez implikace schválení. NE užití značky jako vlastního brandu/titulu/loga. Fan Policy: bez loga/trade dress; CoC povrch nekomerční.
  - *guardraily:* 'Call of Cthulhu' JEN jako popis kompatibility, nikdy jako název/logo/titul produktu/světa · Vždy disclaimer 'není spojeno ani schváleno Chaosium' · Žádné logo, Star Elder Sign, Yellow Sign, fonty ani trade dress · ™ uznání že značku vlastní Chaosium · Ryze nominativní zmínku u jinak generického produktu posoudí právník pro komerční režim
- **[C] (i) Import/export uživatelských dat + otevřený formát** — Export/import postavy/deníku uživatele do otevřeného formátu (JSON) — čistě souborová funkce nad daty, která vytvořil uživatel.
  - *základ:* Vlastní software, žádné cizí IP; přenášená data patří uživateli. Formát i I/O mechanika = §2/6 (metoda/formát).
  - *guardraily:* NEdodávat předplněné CoC content-packy (kouzla/bestiář/scénáře) jako importovatelné bundly = distribuce chráněného obsahu · Import cizích dat validovat, nevydávat cizí obsah za náš · Datové zdroje (user vs. reference) oddělené i v exportu
- **[C] (j) AI generátor kompatibilního ORIGINÁLNÍHO obsahu** — Generátor NOVÝCH, původních NPC/homebrew tvorů/zápletek postavený na generickém d100 skeletu popsaném vlastními slovy; výstup je originální, ne reprodukce Chaosium textu.
  - *základ:* Generovaná mechanika = §2/6 AutZ (metoda/postup, nechráněno). Výstup musí být PŮVODNÍ dílo, ne opis chráněné expression. Trademark: negenerovat pod značkou CoC jako vlastní produkt.
  - *guardraily:* Promptem NEnutit reprodukci oficiálních statbloků/popisů/scénářů Chaosium · Filtrovat výstup na potenciální doslovné převzetí z tréninkových dat · Zákaz AI-art u Miskatonic Repository se týká jen publikace přes DriveThruRPG, ne naší appky — přesto opatrně · Označit obsah jako homebrew/AI-generovaný, oddělit od referencí

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek právně obhajitelný a nadprůměrně obezřetný — správně identifikuje strop (fan-noncommercial pro cokoli s CoC identitou; komerční hlava jen odbrandovaně) a nejrizikovější bod (CoC-brandovaná plná VTT vrstva je Fan Policy VÝSLOVNĚ vyloučena — ověřeno verbatim). Klíčová tvrzení jsou primárně ověřena z Chaosium dokumentů: autofill list požehnán, VTT/apps/downloads vyloučeny, non-commercial = zákaz účtování za přístup, ORC pokrývá jen TEXT BRP:UGE a vylučuje všechny trademarky vč. 'Call of Cthulhu'. Nutné opravy před shipnutím: (1) DOPLNIT sui generis databázové právo (EU 96/9 / §88a AutZ) u katalogu kouzel (d) a bestiáře (e) — chybí úplně a je to reálné riziko u úplných seznamů v Chaosium výběru/uspořádání; (2) PŘEFORMULOVAT monetizační guardrail — proposal zaměňuje 'nekomerční' za 'žádná reklama'; Fan Policy nepřímou monetizaci (bannery/Ko-fi/Patreon) VÝSLOVNĚ dovoluje, zatímco skutečný tvrdý zákaz je 'charging for access', což je u freemium Ikara (Podporovatel) živé riziko entanglementu, jež proposal podceňuje; (3) KVANTIFIKOVAT citace na Chaosium strop 'max 1-2 věty se zdrojem' (teď jen vágní 'malé citace'); (4) doplnit guardrail proti instalovatelnému/PWA klientu s CoC obsahem; (5) škrtnout zbytečnou citaci ORC u holého odbrandovaného map-enginu (nepotřebuje ji). SEO nominativní užití (h) zůstává právně nejistá zóna vyžadující lawyer-review pro komerční režim. Žádné tvrzení není fatálně vadné; jde o doplnění guardrailů a jednu faktickou korekci, ne o strukturální přepracování.
- **[needs-guardrail]** (c') CoC-brandovaný autofill list jako fanartefakt — nekomerční, guardrail 'nulový poplatek/paywall/předplatné/reklama'.
  - → Přeformulovat: povolena je nepřímá monetizace (banner/tip jar/Patreon), ZAKÁZÁNO je účtovat za přístup. Přidat tvrdý guardrail: CoC povrch musí být mimo jakýkoli placený/freemium gating Ikara; pokud platforma jako celek monetizuje přístup k CoC nástroji → nutná komerční licence.
- **[needs-guardrail]** (d) Referenční katalog kouzel/schopností/předmětů: názvy + krátký vlastní popis + malé citace.
  - → Přidat: nereprodukovat podstatnou část Chaosium výběru/uspořádání položek (databázové právo); citace tvrdě limitovat na max 1-2 věty se zdrojem; katalog stavět jen jako řídké nominativní odkazy, ne jako úplnou přepsanou databázi.
- **[needs-guardrail]** (e) Bestiář: názvy tvorů/božstev + homebrew statbloky na prázdném skeletu, hodnoty zadává uživatel.
  - → Doplnit stejný databázový guardrail jako u (d); potvrdit, že Ikaros dodává jen prázdný skelet a NEpředvyplňuje žádné oficiální hodnoty; citace popisů max 1-2 věty se zdrojem. Confidence 0.7 je oprávněně nízké — nechat.
- **[uncertain]** (h) Veřejná landing/SEO — nominativní 'kompatibilní s Call of Cthulhu' + ™ uznání + disclaimer.
  - → Ponechat lawyer-review pro komerční režim. Tvrdé guardraily: značka jen jako popis kompatibility, nikdy blízko loga/trade dress, vždy disclaimer o neschválení, nikdy jako titul/brand produktu/světa; nesmí vizuálně dominovat.
- **[needs-guardrail]** (j) AI generátor kompatibilního ORIGINÁLNÍHO obsahu — §2/6, výstup původní, commercialSafe; zákaz AI-art u Miskatonic Repository se týká jen DriveThruRPG, ne appky.
  - → Doplnit guardrail: filtrovat výstup i na Chaosium-originální Mythos výtvory (ne jen na doslovné statbloky); komerční výstup plně odbrandovat; homebrew jasně označit a datově oddělit od referencí.

**Avoid:**
- Kopírovat doslovné znění pravidel, plné popisy kouzel/schopností, kompletní statbloky, scénáře nebo handouty (nad rámec malých citací se zdrojem).
- Použít logo Chaosium, logo Call of Cthulhu, Star Elder Sign (© 1983) nebo Yellow Sign (© 1989).
- Napodobovat trade dress — šablony stránek, styl ilustrací, fonty Chaosium/Moon Design.
- Použít 'Call of Cthulhu', 'Miskatonic University', 'Masks of Nyarlathotep' nebo 'Nephilim' jako název/brand/titul produktu, světa nebo systému.
- Zpoplatnit, paywall, předplatné nebo reklamně gateovat jakýkoli CoC-brandovaný povrch — Fan Policy je striktně nekomerční ('expressly prohibited from charging').
- Nabízet stáhnutelný/instalovatelný klient nebo packaged app s CoC obsahem — Fan Policy je jen web.
- Postavit CoC-brandovanou plnou VTT vrstvu (taktická mapa + tokeny) — spadá do výslovně vyloučené kategorie 'VTT'; to je nejrizikovější bod, před shipnutím ideálně dotaz na Chaosium/právníka.
- Dodávat předplněné CoC content-packy (kouzla/bestiář/scénáře) k importu = distribuce chráněného obsahu.
- Nechat AI reprodukovat oficiální statbloky nebo text Chaosium.
- Překládat rozsáhlý pravidlový text CoC — překlad je licencovaná/komerční aktivita.
- Použít licencovaný text BRP:UGE (ORC) k vytvoření Mythos hry nebo CoC varianty — výslovný carve-out; všechny značky Chaosium jsou vyloučené Product Identity.
- Mísit uživatelův homebrew s převzatým chráněným obsahem bez jasného datového oddělení a označení zdroje.
- Prezentovat platformu jako 'schválenou/podporovanou Chaosium' — vždy naopak výslovně uvést, že spojení není.

**Návrh disclaimeru:**
> POVINNÝ (Fan Policy vyžaduje verbatim, anglicky) — zobrazit na každém CoC povrchu: "This website uses trademarks and/or copyrights owned by Chaosium Inc/Moon Design Publications LLC, which are used under Chaosium Inc's Fan Material Policy. We are expressly prohibited from charging you to use or access this content. This website is not published, endorsed, or specifically approved by Chaosium Inc. For more information about Chaosium Inc's products, please visit www.chaosium.com." — Český doprovodný překlad (informativní, vedle anglického originálu): "Tato webová stránka používá ochranné známky a/nebo autorská práva vlastněná společnostmi Chaosium Inc./Moon Design Publications LLC, která jsou používána v souladu s Fan Material Policy společnosti Chaosium Inc. Je nám výslovně zakázáno účtovat vám poplatky za používání nebo přístup k tomuto obsahu. Tato stránka není vydána, podporována ani výslovně schválena společností Chaosium Inc. Více informací o produktech Chaosium Inc. najdete na www.chaosium.com."

**Návrh atribuce:**
> Call of Cthulhu je registrovaná ochranná známka společnosti Chaosium Inc. Projekt Ikaros není se společností Chaosium Inc. nijak spojen a není jí podporován ani schválen; veškeré odkazy na názvy jsou pouze nominativní pro účely kompatibility. — Podmíněná ORC atribuce (uvést POUZE tehdy, pokud reálně použijeme text 'Basic Roleplaying: Universal Game Engine', ne když mechaniku popisujeme jen vlastními slovy dle §2/6 AutZ): "Basic Roleplaying: Universal Game Engine, copyright © 2024 Chaosium Inc." — použito pod licencí ORC; vlastní nastavení a značky Ikaros jsou vyhrazeny jako Reserved Material.

**Poznámky rešerše:** Bottom line for Projekt Ikaros: Call of Cthulhu is a CLOSED system — there is NO public open license (no SRD/OGL/ORC) for CoC-specific content; the only public, no-contract path for CoC branding is the Chaosium Fan Material Policy, which is non-commercial and web-only. Two distinct legal lanes:

LANE A — CoC-branded, Fan Material Policy (verified current at chaosium.com/fan-material-policy/): You CAN legally ship, today, a free browser-based Call of Cthulhu character sheet / deník with autofill + calculations (this is explicitly named as permitted), plus reference skill/spell/monster/deity/place NAMES and small attributed rules quotes. You must show the exact disclaimer and charge nothing. What you CANNOT do under this lane: monetize it, copy full rules/spell text/statblocks, use logos/trade dress, or run it as a downloadable app. The biggest live RISK for Ikaros: the policy explicitly excludes 'virtual tabletops (VTTs)'. Ikaros is an all-in-one VTT (tactical map + tokens). The autocalc character-sheet feature is clearly inside the safe zone; a full CoC-branded tactical-map/token VTT is arguably the exact thing the policy carves out, even browser-based ('...including any item a user would download, install, and/or run' reads as illustrative, not the sole test). Conservative recommendation: for CoC, ship only the browser character sheet/deník (autofill/calc) + name references non-commercially with the disclaimer; treat the CoC-branded tactical map/VTT layer as requiring a Commercial License. Note this also blocks the future paid/freemium model for the CoC surface unless a commercial license is obtained.

LANE B — Engine-level open path (BRP under ORC + older BRP-OGL, verified at chaosium.com/orc-license/ and chaosium.com/brp-system-reference-document/): 'Basic Roleplaying: Universal Game Engine' is released under the ORC License for personal AND commercial use, worldwide, royalty-free, irrevocable, with derivatives and translations allowed and NO medium restriction — so you CAN build a fully commercial web VTT/app (tactical map, tokens, autocalc, etc.) on the generic BRP d100 engine. Price: it must carry ZERO Call of Cthulhu / Cthulhu Mythos content or trademarks. All Chaosium marks (Call of Cthulhu, Chaosium, RuneQuest, Pendragon...) are excluded Product Identity, and a specific carve-out forbids using the licensed BRP text to make a Mythos game or a CoC variant (even though Lovecraft's Mythos is itself public domain — you'd have to write your own non-BRP system to combine d100-style play with public-domain Mythos). This is the lane that survives future monetization.

Miskatonic Repository is a third path but is locked to the DriveThruRPG storefront (50/50 revenue split, no AI art) and is not usable as a mechanism inside the Ikaros web app itself.

All quotes above verified against Chaosium's own primary pages (fan-material-policy, fan-use-and-licensing-q-a, trademarks-and-copyrights, orc-license, brp-system-reference-document, miskatonic-repository) and the ORC license text (registered Library of Congress TX 9-307-067). Confidence 0.88; residual uncertainty is chiefly the legal judgment call on whether Ikaros' browser tactical-map layer counts as an excluded 'VTT' under Lane A — that specific question would benefit from a direct email to Chaosium or a lawyer before shipping CoC-branded map/token features.

---

### Dračí doupě 1.6 (DrD)  `draci-doupe-1.6`

**Strop:** `reference-only`

> Pro DrD 1.6 neexistuje zadna verejna otevrena licence (CC/SRD/OGL/ORC) ani fan/VTT/platform policy. Jedine vyslovne opravneni je sirit NEZMENENE oficialni free PDF (DrD Lite). Do aplikace proto nelze vlozit ZADNY oficialni obsah (pravidla, kouzla, schopnosti, statbloky, tabulky, ciselne datove sady, presety). Buildovatelne je jen neutralni/mechanikove naradi (denik, vypocetni engine, VTT, prazdne katalogy), ktere je komercne bezpecne, protoze herni MECHANIKA = metoda/postup/princip dle par.2 odst.6 AutZ (zak.121/2000) a autorske pravo ji nechrani; obsah plni uzivatel/PJ. Vse nad ramec neutralniho naradi + odkazu na nezmenene free PDF vyzaduje individualni pisemnou licenci ALTARu. Finalne potvrdi pravnik pred monetizaci (zbytkova nejistota = hranice mechanika vs. vyjadreni a vyklad "volne siritelna").

**Licenční základ:**
- **DrD – Zjednodušená pravidla ZDARMA (DrD Lite) – „volně šiřitelná“ zkrácená verze (proprietární, © ALTAR)** — `other` · ✔ primární zdroj · https://obchod.altar.cz/document_general_info.html?products_id=930
  - „Můžete použít tuto volně šiřitelnou zkrácenou verzi pravidel."
  - „Tato zjednodušená pravidla byla vytvořena na základě DrD Pravidel pro začátečníky verze 1.6 edice E."
  - „© 1992, 2001, 2006, 2008 ALTAR"
  - „Dračí doupě, DrD™ a ALTAR® jsou zapsané ochranné známky nakladatelství ALTAR"
- **Plná pravidla DrD 1.6 (Začátečníci/Pokročilí/Experti) + doplňky ALTAR (kouzla, nestvůry, dovednosti, alchymie) – ŽÁDNÁ veřejná otevřená licence** — `none-found` · ✔ primární zdroj · https://www.altar.cz/drd/
  - „Plnou verzi hry Dračí doupě vydalo nakladatelství ALTAR v několika samostatně prodejných dílech."
  - „Dračí doupě®, DrD™ a ALTAR® jsou zapsané ochranné známky nakladatelství ALTAR."
- **Fanovská/komunitní ani platform/VTT/online policy pro DrD 1.6 – NEEXISTUJE veřejně** — `none-found` · ✔ primární zdroj · https://www.altar.cz/
  - „Na altar.cz ani obchod.altar.cz není zveřejněna žádná licence/policy pro fanovský obsah, digitální deník, VTT ani aplikaci; jediná zdarma dostupná oficiální položka jsou „Zjednodušená pravidla ZDARMA“ označená pouze jako „volně šiřitelná“."

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: NE pro placená pravidla 1.6. U „Zjednodušených pravidel ZDARMA“ smíš pouze ŠÍŘIT NEZMĚNĚNÝ PDF soubor; přepisovat/přetiskovat jeho text do aplikace není pokryto – „volně šiřitelná“ = šíření díla, ne jeho rozmnožování do vlastního produktu ani úprava. Plné znění pravidel, tabulky, kouzla, nestvůry, dovednosti z placených knih = NE.
- `commercial`: NE – žádné veřejné komerční oprávnění. „Volně šiřitelná“ mlčí o komerci → neuděleno; práva vyhrazena © ALTAR. Pro monetizaci nutná individuální smlouva.
- `vtt_app`: NE – neexistuje žádná veřejná licence pro VTT / herní stůl / aplikaci / digitální deník. Nutný individuální písemný souhlas ALTARu.
- `logo_use`: NE – „Dračí doupě“, „DrD“, „ALTAR“ jsou ZAPSANÉ ochranné známky; logo ani název jako branding produktu/služby bez souhlasu nepoužívat.
- `names_terminology`: OPATRNĚ – jednotlivá slova/krátké názvy nechrání autorské právo, ale „Dračí doupě“/„DrD“ jsou ochranné známky. Nominativní zmínka („kompatibilní s…“) je právně šedá zóna a riziko ochranné známky; jako název/branding produktu NE.
- `spells_abilities_lists`: NE – konkrétní seznamy kouzel a zvláštních schopností a jejich textové znění (z knih i doplňků na altar.cz) = chráněné autorské vyjádření © ALTAR; nekopírovat do katalogu aplikace.
- `bestiary_statblocks`: NE – statbloky, hodnoty a popisy nestvůr z knih a z /drd/nestvury/ = chráněné vyjádření © ALTAR; nevkládat do bestiáře.
- `autofill_calc_sheet`: ČÁSTEČNĚ – herní MECHANIKA (výpočet bonusů, úrovní, mezí vyřazení, útočného čísla) je metoda/princip, kterou autorské právo nechrání (§2/§65 AutZ), takže vlastní výpočetní engine lze implementovat. ALE NESMÍŠ převzít tabulky, texty, názvy povolání/ras/kouzel a číselné datové sady z chráněných zdrojů – engine tedy zůstane bez oficiálního obsahu („prázdný“), obsah musí naplnit uživatel/PJ.
- `derivatives`: NE – odvozená díla neudělena; „volně šiřitelná“ povoluje jen šíření beze změn.
- `translation`: NE – překlad je úprava/odvozené dílo, neuděleno.

**Vyžaduje:**
- Při šíření volně šiřitelného PDF zachovat neporušené dílo včetně tiráže a copyrightu (© 1992, 2001, 2006, 2008 ALTAR).
- Kdekoli zmiňuješ systém, uvádět ochranné známky: „Dračí doupě®, DrD™ a ALTAR® jsou zapsané ochranné známky nakladatelství ALTAR.“
- Pro cokoli nad rámec pouhé distribuce nezměněného PDF (extrakce textu, přetisk, VTT/aplikace, digitální deník s oficiálním obsahem, komerce, logo) získat individuální písemný souhlas / licenci od ALTARu.

**Zakazuje:**
- Přetisk, reprodukce nebo úprava textu placených pravidel DrD 1.6 a doplňků (kouzla, nestvůry, dovednosti, alchymie, tabulky).
- Zabudování textu i volně šiřitelných „Zjednodušených pravidel“ do aplikace nad rámec šíření nezměněného souboru.
- Komerční užití jakéhokoli obsahu DrD bez smlouvy s ALTARem.
- Použití názvu / loga „Dračí doupě“ / „DrD“ / „ALTAR“ jako brandingu produktu nebo služby.
- Vytváření odvozených děl a překladů oficiálního obsahu.
- Vkládání statbloků nestvůr, kouzel, předmětů a hodnot z ALTAR zdrojů do katalogů/bestiáře/generátoru aplikace.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecne-neutralni denik (genericky)** — Volne strukturovany denik postavy/sveta: volna textova pole, vlastni sekce, poznamky, obrazky nahrane uzivatelem. Genericke popisky (Jmeno, Poznamky, Vybaveni). Zadna struktura ani terminologie prevzata z DrD.
  - *základ:* Vlastni UI a datovy model Ikara; zadne prevzate chranene vyjadreni. Prazdna aplikacni kostra + UGC nespada pod autorska prava treti strany.
  - *guardraily:* Bez znacky/loga DrD/ALTAR · Genericke popisky poli · Obsah plni vyhradne uzivatel (UGC)
- **[C] (b) Strukturovany denik - pole/atributy/poradi definovane uzivatelem/PJ** — Sablona s poli, atributy a poradim, ktere si definuje PJ/uzivatel (nazvy, poradi, vzorce). Platforma dodava PRAZDNY konfigurator, ne oficialni DrD preset. Jednotliva bezna slova (Sila, Obratnost, Zivoty) jsou pripustna jako kratke terminy.
  - *základ:* Par.2 odst.6 AutZ - usporadani funkcnosti = metoda, neni dilo; jednotliva kratka slova/obecne herni terminy nejsou chranene vyjadreni. Chraneny je originalni VYBER+USPORADANI konkretni sady DrD (kompilace) - ten neprebirame, definuje ho uzivatel.
  - *guardraily:* Nedodavat bundlovany oficialni DrD preset (nazvy povolani/ras + poradi + hodnoty jako datovou sadu) · Pole/sablonu definuje PJ · Bez odkazu na knihu/tabulku · Bez znacky
- **[C] (c) Autofill + vypocetni engine (mechanika)** — Engine, ktery z hodnot zadanych uzivatelem pocita odvozene hodnoty stylem DrD (bonusy z vlastnosti, uroven, zivoty, utocne cislo, mez vyrazeni, obrana). Vlastni kod/vzorce; ciselne datove sady (postupove tabulky, ceny, staty) se NEbundluji - zadava je PJ/uzivatel.
  - *základ:* Par.2 odst.6 AutZ - postup, princip, metoda a matematicky vzorec nejsou dilo. Herni mechanika = metoda vypoctu, volne implementovatelna vlastnim kodem. Neprebiran text pravidel ani chranene tabulky/kompilace hodnot.
  - *guardraily:* Vzorce psat vlastnim kodem, necitovat text ani tabulky z knih · Nebundlovat oficialni ciselne sady · Engine zustava 'prazdny', obsah plni uzivatel · Bez znacky
- **[C] (d) Prazdne uzivatelske katalogy (kouzla/schopnosti/predmety)** — Genericka evidence polozek, kam PJ/uzivatel vklada VLASTNI obsah (nazev, popis, hodnoty). Platforma nedodava zadny oficialni seznam kouzel/schopnosti/predmetu DrD.
  - *základ:* Vlastni datova struktura + UGC. Konkretni zneni a seznamy = chranene vyjadreni (C) ALTAR - nedodavaji se; format polozky je funkcni struktura.
  - *guardraily:* Nulovy predvyplneny oficialni obsah · Bez importu oficialnich dat · UGC = odpovednost uzivatele · Bez znacky
- **[C] (e) Prazdny bestiar / evidence nestvur (uzivatelska)** — Struktura pro tvorbu vlastnich nestvur a tokenu se staty, ktere zada PJ. Zadne oficialni statbloky, hodnoty ani popisy nestvur DrD.
  - *základ:* Vlastni struktura + UGC. Oficialni statbloky a popisy (vc. /drd/nestvury/) = chranene vyjadreni (C) ALTAR, neprebiraji se. Samotny format staty (pole HP/utok) je funkcni struktura.
  - *guardraily:* Nulove oficialni statbloky · Nebundlovat data z altar.cz · UGC · Bez znacky
- **[C] (f) Genericky resitel hodu / dice engine (mechanika, ne tahak pravidel)** — Nastroj na hazeni kostkami a vyhodnoceni proti cilovemu cislu (hod + bonus vs. cil), popsany VLASTNIMI slovy jako obecna mechanika. NENI reprodukce ani parafraze taháku/tabulek DrD.
  - *základ:* Par.2 odst.6 AutZ - mechanika hodu = metoda, neni chranena. Vlastni slova popisujici nechraneny postup. Riziko vznika az pri substantivni parafrazi vyberu/usporadani/tabulek knihy - to nedelame.
  - *guardraily:* Nereprodukovat/neparafrazovat zneni ani tabulky DrD · Nekopirovat vyber+usporadani pravidel knihy · Zustat na urovni univerzalni mechaniky · Konkretni pravidla si PJ zadava sam
- **[C] (g) Takticka mapa + tokeny (genericky VTT)** — Mrizka, tokeny, mlha, LoS, pohyb, iniciativa - vlastni VTT nastroj Ikara bez jakehokoli obsahu DrD. Mapy a token-art dodava uzivatel.
  - *základ:* Zcela vlastni nastroj; neobsahuje chranene vyjadreni DrD. Herni mechanika (pohyb/iniciativa) = metoda dle par.2 odst.6.
  - *guardraily:* Zadne oficialni mapy/art/logo DrD · Art dodava uzivatel · Bez trade-dress a znacky
- **[C] (h) Verejna landing/SEO stranka - neutralni wording** — Stranka popisujici obecne schopnosti Ikara (denik, vypocty, VTT pro vlastni/oblibene systemy) BEZ pouziti ochrannych znamek jako brandingu. Faktickou nominativni zminku ('funguje s pravidly, ktera uz vlastnite') je mozne pouzit s disclaimerem, ale pro komercni rezim je bezpecnejsi znacku vubec neuvadet.
  - *základ:* Vlastni marketingovy text. Znacky Draci doupe/DrD/ALTAR nelze uzit jako branding; nominativni uziti = pravni seda zona (riziko OZ), pro komerci nepouzivat jako identifikator produktu/sluzby.
  - *guardraily:* Zadne logo/trade-dress · Znacka NE v titulku/nazvu/URL/brandingu · Pripadna zminka jen nominativne + disclaimer + atribuce OZ · Bez sugesce oficialniho schvaleni/partnerstvi
- **[C] (i) Import/export vlastnich dat (UGC)** — Export a import deniku/sveta/katalogu ve vlastnim formatu Ikara (JSON), pouze pro data vytvorena uzivatelem. Volitelne prilozeni/odkaz na nezmeneny oficialni free PDF jako soubor.
  - *základ:* Prenos UGC, ktery vlastni/spravuje uzivatel; neobsahuje oficialni data. Nezmeneny free PDF spada pod 'volne siritelne'.
  - *guardraily:* Jen vlastni data uzivatele · Nedodavat 'DrD content pack' s oficialnimi daty · Neumoznit sdileni piratsky prepsanych pravidel · Free PDF jen nezmeneny + tirac
- **[·] (j) Genericky AI generator ORIGINALNIHO obsahu (bez DrD dat/brandingu)** — AI generator, ktery vytvari ORIGINALNI napady (nazvy NPC, mist, zapletek) mechanicky pouzitelne v jakemkoli systemu. NENI seedovan oficialnimi daty DrD, neni brandovan jako DrD, vystup reviduje clovek.
  - *základ:* Vlastni original neni odvozene dilo. ALE: generator naplneny oficialnimi daty nebo brandovany 'DrD-kompatibilni' = zakazano (riziko regurgitace treningovych dat + OZ). Proto jen genericky + originalni vystup.
  - *guardraily:* Zadna oficialni DrD data v promptu/seedu · Nebrandovat jako 'DrD generator' / 'kompatibilni s DrD' · Lidska kontrola vystupu · Vystup vlastni uzivatel · Nereprodukovat oficialni kouzla/nestvury/predmety
- **[·] (+) Distribuce nezmeneneho free PDF (Zjednodusena pravidla ZDARMA / DrD Lite)** — Odkaz na oficialni 'Zjednodusena pravidla ZDARMA' na obchod.altar.cz, pripadne poskytnuti NEZMENENEHO souboru ke stazeni s neporusenou tiraci a copyrightem.
  - *základ:* Jedine vyslovne opravneni - 'volne siritelna' zkracena pravidla. Plati POUZE pro sireni nezmeneneho dila, NE pro extrakci/pretisk textu do aplikace. Mlci o komerci -> komerce neudelena.
  - *guardraily:* Soubor NEMENIT (zadna extrakce textu do appky) · Zachovat tirac (C) 1992,2001,2006,2008 ALTAR + ochranne znamky · Preferovat ODKAZ pred rehostingem · Nekomercni ramec

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek právně obhajitelný a spíše nadstandardně konzervativní; strop 'reference-only' je správný a potvrzený primárními zdroji. Ověřeno nezávisle: (1) plná pravidla DrD 1.6 jsou ŽIVÝ placený produkt (moderní PDF za 99 Kč na obchod.altar.cz) — žádná veřejná otevřená licence (CC/SRD/OGL/ORC) ani fan/VTT/app policy neexistuje; (2) jediné výslovné oprávnění je 'volně šiřitelná zkrácená verze' (DrD Lite), doslova bez licenčního textu, mlčící o komerci i o úpravách — pokrývá tedy jen šíření NEZMĚNĚNÉHO souboru, ne vytěžení textu do aplikace; (3) 'Dračí doupě®, DrD™, ALTAR®, Asterion®' jsou potvrzené zapsané ochranné známky. Právní páteř (herní mechanika = metoda/postup/vzorec dle §2 odst. 6 AutZ, mimo autorskoprávní ochranu) je správná a nese buildovatelné neutrální nástroje (a,g = sound; c,e,d = sound s guardraily). Žádné tvrzení není hrubý overreach, ale k opravě před monetizací je nutné: (A) doplnit do zdůvodnění SUI GENERIS databázové právo (§88a–94 AutZ) a explicitně zakázat podstatné vytěžení oficiálních tabulek i po jednotlivých hodnotách — dnešní legalBasis se opírá jen o autorské právo/kompilaci a databázové právo opomíjí; (B) zpřísnit terminologické guardraily — DrD ražené termíny ('útočné číslo', 'mez vyřazení') NEJSOU generická slova, nezadrátovávat je jako labely enginu, jinak vzniká 'DrD engine' dojem; (C) žádný předvyplněný DrD preset ani v onboardingu (feature b); (D) free PDF jen ODKAZEM, nerehostovat z komerční platformy a nikdy v placené vrstvě; (E) u SEO značku pro komerci neuvádět ani nominativně jako identifikátor služby (mírný overreach v 'je možné použít') + doplnit nekalou soutěž §2976 OZ jako samostatný důvod; (F) k UGC katalogům/bestiáři přidat notice-and-takedown a neformulovat UI jako výzvu k vkládání oficiálního obsahu. Zbytková nejistota (hranice mechanika vs. vyjádření; rozsah 'volně šiřitelná') odůvodňuje finální potvrzení právníkem před monetizací.
- **[needs-guardrail]** CROSS-CUTTING: legalBasis features (b)(c)(d)(e) se opírá jen o autorskoprávní §2 odst. 6 AutZ a kompilaci; opomíjí ZVLÁŠTNÍ PRÁVO POŘIZOVATELE DATABÁZE (sui generis, §88a–94 AutZ).
  - → Do legalBasis (b)-(e) přidat větu o sui generis databázovém právu a explicitní zákaz PODSTATNÉHO vytěžení/přenosu oficiálních tabulek i po jednotlivých hodnotách; potvrdit, že engine i katalogy zůstávají prázdné a data plní výhradně uživatel.
- **[needs-guardrail]** (b) Strukturovaný deník — pole/atributy/pořadí definuje uživatel; jednotlivá běžná slova (Síla, Obratnost, Životy) přípustná; chráněný je jen originální VÝBĚR+USPOŘÁDÁNÍ konkrétní sady DrD.
  - → Ponechat feature, ale guardrail zpřísnit: platforma NESMÍ dodat žádný předvyplněný preset zrcadlící DrD sadu (názvy+pořadí+hodnoty); šablonu vytváří výhradně PJ/uživatel od prázdného konfigurátoru. Žádný 'DrD quick-start' preset ani v ukázce/onboardingu.
- **[needs-guardrail]** (c) Autofill + výpočetní engine počítá odvozené hodnoty stylem DrD (bonusy, úroveň, životy, útočné číslo, mez vyřazení, obrana); vzorce vlastním kódem = metoda dle §2 odst. 6, není dílo.
  - → Labely odvozených hodnot nechat uživatelsky definovatelné/generické; nezadrátovat ražené DrD termíny do UI. Vzorce psát vlastním kódem, žádné číselné sady nebundlovat (viz sui generis). Ponechat commercialSafe:true jen za těchto podmínek.
- **[needs-guardrail]** (d) Prázdné katalogy a (e) prázdný bestiář — generická struktura + UGC, nulový předvyplněný oficiální obsah; formát položky = funkční struktura.
  - → Doplnit guardrail: notice-and-takedown proces + neformulovat UI jako výzvu k vkládání oficiálního DrD obsahu (žádné 'importuj svá DrD kouzla'); UGC odpovědnost + moderace na nahlášení. Jinak jádro sound.
- **[needs-guardrail]** (f) Generický řešitel hodu — mechanika hodu vs. cílové číslo popsaná vlastními slovy; není reprodukce/parafráze taháku ani tabulek DrD.
  - → Ponechat na úrovni univerzálního 'hod+bonus vs. cíl'; žádné DrD-specifické rozlišovací tabulky/prahy/mechaniku pastí nereprodukovat ani neparafrázovat. Konkrétní pravidla zadává PJ.
- **[needs-guardrail]** (h) Landing/SEO — nominativní zmínku ('funguje s pravidly, která už vlastníte') je možné použít s disclaimerem, ale pro komerci bezpečnější značku vůbec neuvádět.
  - → Přeformulovat na: pro komerční režim značku NEUVÁDĚT ani nominativně jako identifikátor služby; pokud faktická zmínka nezbytná, jen v běžném textu (ne meta title/OG/keywords/URL), s prominentním disclaimerem a atribucí OZ, bez sugesce partnerství. Doplnit §2976 OZ jako samostatný důvod vedle OZ.
- **[needs-guardrail]** (i) Import/export vlastních dat + volitelné přiložení/odkaz na nezměněný free PDF; free PDF spadá pod 'volně šiřitelné'.
  - → Export/import UGC ponechat (sound). Free PDF: preferovat ODKAZ na obchod.altar.cz, NErehostovat na komerčním serveru, nikdy neumístit do placené/premium vrstvy; zachovat tiráž a (C) ALTAR. Zákaz sdílení pirátsky přepsaných pravidel (už v avoid) přenést i sem.

**Avoid:**
- Pretisk/prepis/parafraze textu placenych pravidel DrD 1.6 a doplnku (kouzla, nestvury, dovednosti, alchymie, tabulky) do aplikace
- Extrakce textu i 'volne siritelnych' Zjednodusenych pravidel do appky (povoleno jen sireni nezmeneneho souboru, ne rozmnozeni textu do produktu)
- Bundlovani oficialnich seznamu kouzel/schopnosti/predmetu a statbloku nestvur do katalogu/bestiare/generatoru
- Dodani oficialniho DrD presetu v deniku (nazvy povolani/ras/kouzel + poradi + hodnoty jako datova sada)
- Tahak pravidel reprodukujici nebo parafrazujici zneni a tabulky DrD (misto toho jen odkaz na free PDF)
- AI generator 'DrD-kompatibilniho'/oficialniho obsahu naplneny oficialnimi daty nebo brandovany jako DrD
- Pouziti nazvu/loga 'Draci doupe'/'DrD'/'ALTAR' jako brandingu produktu/sluzby, v titulku, URL nebo trade-dress
- Jakekoli komercni uziti oficialniho obsahu DrD bez individualni smlouvy s ALTARem
- Odvozena dila a preklady oficialniho obsahu DrD
- Sugesce oficialniho partnerstvi/schvaleni nakladatelstvim ALTAR
- Spolehnout se na CC BY-NC-SA u LEGIE.info (to je licence webu, NE knihy - realny PDF nese jen (C) ALTAR)
- Spolehnout se na online zverejneni DrD+/DrD II jako verejnou licenci pro treti strany

**Návrh disclaimeru:**
> Tento nastroj je neoficialni a nezavisly pomocnik pro stolni hrani. Neni nijak spojen s nakladatelstvim ALTAR ani s hrou Draci doupe a neni jimi schvalen. Neobsahuje zadna oficialni pravidla, kouzla, schopnosti, nestvury ani jine chranene materialy - veskery herni obsah si do nastroje vklada sam hrac nebo Pruvodce hrou (PJ). Pro oficialni pravidla si porridte originalni produkty nakladatelstvi ALTAR.

**Návrh atribuce:**
> Draci doupe (R), DrD (TM) a ALTAR (R) jsou zapsane ochranne znamky nakladatelstvi ALTAR. Projekt Ikaros s nakladatelstvim ALTAR nijak nesouvisi a neni jim schvalen ani sponzorovan. Pro oficialni pravidla si porridte originalni produkty ALTAR (altar.cz).

**Poznámky rešerše:** ZÁVĚR (konzervativní, bez právníka): Pro DrD 1.6 NEEXISTUJE žádná veřejná otevřená licence (ani CC, ani SRD/OGL/ORC, ani platform/VTT/fan policy). Ověřeno z primárních zdrojů – aktuální stav.

CO LZE POSTAVIT TEĎ bez smlouvy:
1) Prázdný „engine“ / autofill výpočetní deník, který implementuje HERNÍ MECHANIKU DrD (matematika bonusů, úrovní, životů, útočného čísla) jako funkčnost – mechanika/metoda není chráněná autorským právem (§2/§65 zák. 121/2000). Podmínka: žádné převzaté texty, tabulky, názvy povolání/ras/kouzel/nestvůr, žádné číselné datové sady z knih; obsah plní uživatel/PJ.
2) Distribuce NEZMĚNĚNÉHO oficiálního PDF „Zjednodušená pravidla ZDARMA“ (DrD Lite) jako odkaz/soubor – to je jediné výslovné „volně šiřitelná“ oprávnění. Nezahrnuje extrakci textu do appky.

CO NELZE bez individuálního souhlasu ALTARu: přetisk/přepis pravidel, seznamy kouzel/schopností, statbloky nestvůr, tabulky, generátor kompatibilního obsahu naplněný oficiálními daty, jakákoli komerce, název jako branding, logo, překlad, odvozená díla.

POZOR NA FALEŠNOU STOPU: databáze LEGIE.info uvádí u knihy „CC BY-NC-SA 3.0“, ale to je licence webu LEGIE (patička), NE knihy – ověřeno: skutečný ALTAR PDF nese pouze „© ALTAR“ + ochranné známky, žádné Creative Commons.

DrD+ / DrD II nejsou otevřenější (drdplus.info sice publikuje pravidla online, ale nese stejnou doložku ochranných známek ALTAR a odkazuje na koupi – nejde o veřejnou licenci pro třetí strany, patrně soukromé ujednání s ALTARem, na které se nelze spolehnout).

DOPORUČENÍ: Chce-li Ikaros oficiální obsah DrD (kouzla, bestiář, autofill s reálnými daty, branding „pro Dračí doupě“), je NUTNÁ individuální dohoda/licence s nakladatelstvím ALTAR (kontakt přes altar.cz). Zbytková nejistota (~0,15) = přesný právní výklad rozsahu „volně šiřitelná“ a hranice mechanika vs. vyjádření – doporučeno potvrdit právníkem před monetizací.

Primární zdroje: obchod.altar.cz/document_general_info.html?products_id=930 (popis „volně šiřitelná“), reálný PDF DrD Lite (tiráž © ALTAR + ochranné známky), altar.cz/drd/, pph.drdplus.info (doložka ochranných známek).

---

### Dračí doupě Plus / DrD+ (ALTAR, 2004; edice 2011)  `drd-plus`

**Strop:** `reference-only`

> Pro OBSAH DrD+ neexistuje žádný otevřený licenční ekvivalent (žádné SRD/ORC/CC). Text pravidel, kouzla, bestiář i svět (Taria/Asterion) jsou copyright ALTAR bez veřejné licence; drdplus.info je honor-gated přístupová politika, NE licenční grant třetím stranám. Otevřená je JEN softwarová vrstva — MIT engine drdplus/* (© J. Týc), který dovoluje use/modify/distribute/SELL. Reálný strop platformy proto NENÍ obsahová reprodukce, ale: (1) vlastními slovy popsaná herní MECHANIKA (§2/6 AutZ — funkční systém/vzorce/holá čísla nejsou chráněný výraz) + (2) autofill/výpočty postavené nad MIT enginem + (3) uživatelem vytvořený/AI-generovaný kompatibilní obsah. Cokoli s doslovným textem, popisy, jmény a flavorem ALTAR je za zdí. Proto 'reference-only': můžeme postavit plně funkční kompatibilní nástroj (deník, autofill, TM), ale NESMÍME dodávat oficiální obsah ALTAR jako data — ten si hráč nosí z legálně vlastněné kopie sám. Komerční režim: bezpečný jen pro softwarovou/mechanickou vrstvu, NIKDY pro obsah ALTAR.

**Licenční základ:**
- **ALTAR – pravidla DrD+ (obsah/text): žádná veřejná otevřená licence** — `none-found` · ✔ primární zdroj · https://www.altar.cz/drdplus/
  - „Dračí doupě®, DrD™ a ALTAR® jsou zapsané ochranné známky nakladatelství ALTAR."
  - „Copyright © 2026 e-shop nakladatelstvi ALTAR (Všeobecné obchodní podmínky řeší jen nákup/dodání zboží; neobsahují žádné svolení k dalšímu užití, šíření ani komerčnímu využití obsahu pravidel)"
  - „Volně šiřitelná jsou pouze 'Zjednodušená pravidla ZDARMA' pro KLASICKÉ Dračí doupě (jen úrovně 1–3), NIKOLI pro DrD+ — plná pravidla DrD+ jsou placený produkt."
- **drdplus.info – online reprodukce pravidel DrD+ (fan projekt J. Týc): přístupová politika, ne licenční grant třetím stranám** — `online-policy` · ✔ primární zdroj · https://bestiar.drdplus.info/
  - „Pokud nevlastníš pravidla DrD+, prosím, kup si je - podpoříš autory a budoucnost Dračího doupěte. Děkujeme!"
  - „prohlašuji na svou čest, že vlastním legální kopii"
  - „Volby přístupu: „Zkusím“ / „Koupím“ (odkaz na obchod.altar.cz) / „Vlastním“ — obsah je gated na čestné prohlášení o vlastnictví placené kopie; jde o tolerovanou/povolenou fan-reprodukci, ne o svolení k dalšímu šíření či odvozeninám."
- **MIT License – výpočetní engine drdplus/* (Copyright © 2014/2015 Jaroslav Týc)** — `other` · ✔ primární zdroj · https://raw.githubusercontent.com/drdplusinfo/tables/master/LICENSE
  - „The MIT License (MIT) Copyright (c) 2015 Jaroslav Týc"
  - „Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software"
  - „The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."
  - „tables/README + composer.json: "license": "MIT" — "Over sixty tables used for calculation and information in DrD+." (~30 MIT repos: tables, properties, races, professions, profession-levels, properties-by-fate/levels, background, skills, health, stamina, equipment, combat-actions, fight-properties, base-properties, armourer, destruction, drdplus-calculations, drdplus-current-properties, codes, rolls-on, gaming-session, drdplus-person …)"
  - „POZOR na hranici: obsahové repozitáře (rules-skeleton, rules-skeleton-web, index, bestiary-dm, adventures-dm, story, drdplus-wizard-codes, drdplus-theurgist-codes/spells, drdplus-introduction, drdplus-core-ideas = „Základní kameny DrD+, nedotýkat se!“) NEMAJÍ LICENCI (LICENSE = HTTP 404) → all-rights-reserved."

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: NE (obsah pravidel = ALTAR copyright, žádná veřejná licence). Reprodukce plného textu na drdplus.info běží jen pod čestným prohlášením o vlastnictví placené kopie + ochranné známky ALTAR — negrantuje třetím stranám právo text přebírat ani redistribuovat.
- `commercial`: JEN pro software: ano přes MIT engine drdplus/* (MIT výslovně dovoluje 'sell copies'). NE pro obsah ALTAR (text/kouzla/bestiář/svět Taria/Asterion) — ten komerčně bez smlouvy s ALTAR použít nelze.
- `vtt_app`: Ano, ale jen software: MIT engine drdplus/* lze zabudovat do VTT/aplikace, upravovat i redistribuovat (nutné zachovat MIT notice). Přebírat do appky text pravidel/statbloky ALTAR NE.
- `logo_use`: NE. „Dračí doupě®“, „DrD™“, „DrD+“ i „ALTAR®“ jsou zapsané ochranné známky ALTAR; logo ani název nelze užít jako branding. Přípustná jen nominativní zmínka slučitelnosti (např. „kompatibilní s DrD+“) v mezích fair use ochranných známek.
- `autofill_calc_sheet`: ANO (nejsilnější legální cesta): autofill/výpočetní deník lze postavit nad MIT knihovnami drdplus/* (tables, properties, professions, health, combat-actions, armourer…). Herní mechaniky/vzorce/číselné tabulky jako funkční systém nejsou samy o sobě chráněny autorským právem → lze reimplementovat. Podmínka: zachovat MIT notice a NEkopírovat publikovaný text/rozvržení tabulek ALTAR doslovně.
- `bestiary_statblocks`: NE pro text/flavor bestiáře ALTAR (bestiar.drdplus.info je gated na vlastnictví kopie, repo bestiary-dm bez licence). Holá číselná mechanika tvora je reimplementovatelná, ale popisy, jména a přepis statbloku jako text = ALTAR copyright.
- `derivatives`: Software: ANO (MIT dovoluje modify/merge/derivatives). Obsah: NE — odvozená díla z chráněného textu pravidel/kouzel/bestiáře bez smlouvy s ALTAR nelze.
- `names_terminology`: Pouze nominativně (odkaz na slučitelnost). Ochranné známky ALTAR nelze používat jako značku/název produktu. Obecná herní terminologie (názvy vlastností/povolání jako funkční pojmy) je nízkoriziková, ale doslovné převzetí definičního textu je copyright.
- `spells_abilities_lists`: NE pro seznamy/popisy kouzel a schopností jako text ALTAR (drdplus-wizard-codes / theurgist-spells bez licence, obsah gated). Mechanickou logiku lze reimplementovat, doslovné popisy/tabulky kouzel převzít nelze.
- `translation`: Software/kód: ano (MIT). Text pravidel/obsah ALTAR: překlad = odvozené dílo → NE bez svolení ALTAR.

**Vyžaduje:**
- dupe-suppressed

**Zakazuje:**
- Redistribuce/republikace textu pravidel DrD+, popisů kouzel a schopností, položek/flavoru bestiáře, dobrodružství a obsahu světa (Taria, Asterion) bez smlouvy s ALTAR.
- Užití názvů/loga „Dračí doupě“, „DrD“, „DrD+“, „ALTAR“ jako značky, názvu produktu nebo v brandingu (zapsané ochranné známky).
- Tvorba odvozených děl (vč. překladu) z chráněného textu pravidel/kouzel/bestiáře ALTAR.
- Zpřístupnění obsahu pravidel uživatelům, kteří nevlastní legální kopii (obcházení honor-gate drdplus.info).
- Komerční využití obsahu ALTAR (placené balíčky, prodej statbloků/kouzel jako textu) — MIT pokrývá jen software J. Týce, nikoli obsah vydavatele.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecně-neutrální deník postavy** — Univerzální herní deník bez systémové vazby: volná textová pole (jméno postavy, koncept, poznámky, příběh, inventář jako volný text, deníkové zápisky). Žádné DrD+ specifické atributy ani terminologie. Skin/motiv čistě vizuální, neutrální branding. Toto je nulová právní expozice — nic z ALTAR se nedotýká.
  - *základ:* Vlastní dílo platformy Ikaros. Žádný cizí chráněný obsah. Bez vazby na jakoukoli licenci.
  - *guardraily:* Žádná zmínka 'DrD+' v tomto obecném režimu (je to systémově agnostické). · Vlastní texty a hlášky, žádné převzetí prózy odjinud.
- **[C] (b) Systémově-strukturovaný deník DrD+ (pole/atributy/pořadí)** — Deník se strukturou odpovídající DrD+: pojmenovaná pole pro vlastnosti (Síla/Obratnost/Odolnost/Inteligence/Charisma... jako FUNKČNÍ pojmy), povolání, úroveň, životy/výdrž, dovednosti, boj (útočné/obranné číslo). Uspořádání polí a jejich pojmenování obecnou terminologií je struktura formuláře, ne přepis textu pravidel. Popisky/nápovědy k polím píšeme VLASTNÍMI SLOVY.
  - *základ:* §2/§6 AutZ (vlastní parafráze): herní mechanika, systém vlastností/povolání a struktura postavního listu jako funkční systém nejsou chráněný autorský výraz — chráněn je konkrétní text/rozvržení/prezentace ALTAR, ne fakt, že hra má vlastnost 'Síla' nebo že se počítá útočné číslo. Terminologie jako funkční pojem = nízkoriziková.
  - *guardraily:* NEkopírovat doslovně definiční text/popisy vlastností z pravidel ALTAR — přeformulovat vlastními slovy nebo nechat prázdné. · NEreprodukovat vizuální rozvržení oficiálního postavního listu (trade dress) — vlastní layout Ikaros. · Nepoužívat logo/značky; nadpis neutrální ('deník kompatibilní s DrD+'). · Číselné meze/tabulky needitovat z PDF ALTAR — viz vrstva (c).
- **[C] (c) Autofill + výpočty nad MIT enginem drdplus/*** — Nejsilnější legální cesta. Výpočetní vrstva deníku: dopočet odvozených hodnot (bonusy z vlastností, životy/výdrž, útočné/obranné číslo, nosnost, postihy od zbroje, výsledky hodů) buď přímým použitím MIT knihoven drdplus/* (tables, properties, professions, health, stamina, combat-actions, armourer, fight-properties, base-properties, calculations, current-properties, rolls-on...), nebo vlastní JS reimplementací téže mechaniky. ~60 výpočetních tabulek + logika je pod MIT.
  - *základ:* MIT License (© 2014/2015 Jaroslav Týc) VÝSLOVNĚ dovoluje use/copy/modify/merge/publish/distribute/sublicense/SELL a zabudování do aplikace/VTT — stačí zachovat MIT notice. Navíc §2/6 AutZ: samotné vzorce a holá čísla jako funkční systém nejsou chráněny, takže výpočty lze reimplementovat i nezávisle.
  - *guardraily:* POVINNĚ zachovat MIT notice (copyright © Jaroslav Týc + text MIT) v repu a v patičce/atribuci aplikace u této vrstvy. · Čerpat hodnoty z MIT tabulek nebo vlastní reimplementace — NIKDY neopisovat číselné tabulky přímo z PDF/textu ALTAR jako publikovaný výraz. · Oddělit datové zdroje: MIT-engine data v samostatném modulu s vlastní atribucí, oddělené od uživatelského obsahu. · Nepřebírat doslovný popisný text okolo tabulek (ten není součástí MIT enginu).
- **[·] (d) Seznamy kouzel/schopností/předmětů — JEN uživatelský/generovaný obsah + mechanická kostra** — Datový MODEL a UI pro kouzla/schopnosti/předměty (pole: název, cena many/energie, dosah, trvání, účinek jako číselná mechanika, poznámka). Naplnění: (1) uživatel si vloží vlastní z legálně vlastněné kopie, NEBO (2) AI generátor vytvoří vlastní kompatibilní obsah, NEBO (3) volitelně napojení na MIT drdplus codes/wizard-codes JEN pokud daný balík má MIT (kódy/identifikátory ano, popisné texty z content-repo bez licence NE).
  - *základ:* Model/struktura = §2/6 (funkční). Mechanická logika = reimplementovatelná. Naplnění obsahem stojí na uživateli (vlastník kopie) nebo na vlastní tvorbě — NE na reprodukci ALTAR textů.
  - *guardraily:* NEDODÁVAT oficiální seznamy/popisy kouzel a schopností jako předvyplněná data platformy (drdplus-wizard-codes/theurgist-spells content = bez licence, gated). · Doslovné popisy/tabulky kouzel z pravidel ALTAR nevkládat jako obsah. · Uživatelem vložený obsah držet v jeho soukromém prostoru (jeho legální kopie), neredistribuovat mezi hráči/veřejně. · AI-generovaný obsah označit jako 'kompatibilní, nikoli oficiální DrD+'. · commercialSafe=false: prodávat cizí obsah nelze; komerční smí být jen nástroj/engine, ne obsahové balíčky.
- **[·] (e) Bestiář / statbloky — model + mechanika, NE flavor ALTAR** — Struktura statbloku (jméno, životy, útočné/obranné číslo, zranění, vlastnosti tvora jako čísla) jako datový model + TM token. Naplnění: uživatelem vytvořené bestie NEBO AI-generované kompatibilní bestie. Holá číselná mechanika konkrétního tvora je reimplementovatelná.
  - *základ:* §2/6: číselná mechanika tvora (staty jako funkční hodnoty) není chráněný výraz. Chráněné je JMÉNO tvora specifické pro ALTAR, popis/flavor a přepis statbloku jako textu.
  - *guardraily:* NEPŘEBÍRAT texty/flavor/jména bestiáře ALTAR (bestiar.drdplus.info gated, repo bestiary-dm bez licence). · Nedodávat oficiální bestiář jako předvyplněnou databázi platformy. · Vlastní/generický popis tvora; specifická autorská jména stvoření z Asterionu/Tarie nepoužívat jako obsah. · Uživatelské statbloky = jeho prostor; komerční distribuce cizího bestiáře NE (commercialSafe=false).
- **[C] (f) Taháky pravidel — vlastní parafráze mechaniky, NE výcuc textu** — Rychlé referenční karty ('taháky') vysvětlující POSTUP mechaniky vlastními slovy: jak proběhne test vlastnosti, jak se počítá útok, pořadí kola boje, jak funguje únava — napsané jako originální výukový text Ikaros, ne jako výtah/citace pravidel. Doplněno odkazy 'detaily v příručce, kterou vlastníš'.
  - *základ:* §2/6 + vlastní autorský výraz: postup a pravidlo jako myšlenka/procedura nejsou chráněny; chráněn je konkrétní text ALTAR. Když napíšeme vysvětlení vlastními slovy, tvoříme vlastní dílo popisující veřejně známou mechaniku.
  - *guardraily:* ŽÁDNÉ doslovné bloky textu z pravidel — všechno přeformulovat vlastními slovy. · Nekopírovat příklady, kazuistiky ani formulace z knihy. · Nereprodukovat rozsáhlé číselné tabulky jako publikovaný výraz (kdyžtak jen výpočtem přes MIT engine). · Držet taháky stručné/funkční; nesuplovat prodávaná pravidla (nesmí být náhrada knihy — jinak riziko 'nahrazuje trh').
- **[C] (g) Taktická mapa + tokeny** — Plně vlastní VTT vrstva Ikaros: mapa, mřížka, tokeny, iniciativa, fog/LoS, dosahy pohybu/útoku dopočtené přes MIT engine. Tokeny nesou uživatelské/generované staty (viz e). Čistě funkční nástroj bez cizího obsahu.
  - *základ:* Vlastní software Ikaros + MIT engine pro výpočty vzdáleností/akcí. Žádný chráněný obsah ALTAR v samotném nástroji.
  - *guardraily:* Grafika map/tokenů vlastní nebo řádně licencovaná — ne art z produktů ALTAR. · Předvyplněné bestie/tokeny jen uživatelské/generované (viz e), ne oficiální bestiář. · Výpočtovou vrstvu opatřit MIT notice (viz c).
- **[C] (h) Veřejná landing/SEO stránka + wording** — Marketingová/SEO stránka: 'Deník a nástroje kompatibilní s Dračí doupě Plus (DrD+)'. Nominativní zmínka slučitelnosti, neutrální branding Ikaros, popis funkcí (autofill, deník, TM). Bez loga a bez trade dress ALTAR.
  - *základ:* Nominativní fair use ochranných známek: slovní zmínka 'kompatibilní s DrD+' k označení slučitelnosti je přípustná, pokud nevyvolá dojem oficiálního schválení/asociace. Sama slova jako identifikace systému, ne jako značka produktu.
  - *guardraily:* NEPOUŽÍVAT logo ani stylizované písmo/značky 'Dračí doupě®', 'DrD™', 'DrD+', 'ALTAR®' jako branding. · Vždy formulace 'kompatibilní s' / 'pro' — nikdy neimplikovat oficiálnost, partnerství či schválení ALTAR. · Uvést disclaimer o ochranných známkách a neoficiálnosti (viz requiredDisclaimerText). · Nepoužít 'DrD+' v názvu produktu/domény/loga Ikaros. · Nepřebírat obrázky/art/copy z materiálů ALTAR.
- **[C] (i) Import / Export** — Export/import postavy a herních dat v otevřeném formátu (JSON) — uživatel vlastní svá data, může je stáhnout a nahrát. Obsahuje jeho vlastní zápisy + mechanické hodnoty spočtené enginem.
  - *základ:* Uživatelova vlastní data + funkční hodnoty. Formát a nástroj = vlastní software. Žádný chráněný obsah ALTAR se neredistribuuje platformou.
  - *guardraily:* Export nesmí sloužit k hromadné redistribuci oficiálního obsahu ALTAR mezi uživateli (pokud si někdo vloží vlastní kopii, zůstává v jeho prostoru). · Neintegrovat scraper oficiálních gated zdrojů (drdplus.info) do importu — obcházelo by honor-gate. · Formát dokumentovat jako vlastní/otevřený, MIT-engine části s notice.
- **[C] (j) AI generátor kompatibilního obsahu** — Generátor, který vytváří ORIGINÁLNÍ kompatibilní obsah (kouzla, bestie, předměty, NPC, dobrodružné háčky) mechanicky slučitelný s DrD+ — vlastní jména, vlastní popisy, staty počítané přes MIT engine. Nahrazuje potřebu přebírat obsah ALTAR tím, že tvoří nový.
  - *základ:* Nově vytvořené dílo (parametrizované mechanikou = §2/6). Nevychází z reprodukce chráněného textu ALTAR, produkuje vlastní výraz slučitelný s funkčním systémem.
  - *guardraily:* Generátor NESMÍ mít v tréninku/promptu vložené doslovné texty pravidel/kouzel/bestiáře ALTAR jako zdroj k reprodukci — jen mechanickou kostru a vlastní kreativitu. · Výstup označit 'kompatibilní s DrD+, neoficiální, vygenerováno'. · Nevytvářet obsah imitující konkrétní chráněná jména/tvory/lokace ALTAR (Taria, Asterion, autorská stvoření). · Číselné hodnoty přes MIT engine, ne kopií tabulek ALTAR. · commercialSafe=true jen pro takto čistě generovaný vlastní obsah; ne pro 'generátor', který ve skutečnosti recituje pravidla.

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek právně obhajitelný a nadprůměrně konzervativní: správně routuje OBSAH na uživatele/AI a SOFTWARE na MIT engine, strop 'reference-only' je nastaven věcně správně (honor-gate = přístup, ne licence; content repo bez LICENSE = all-rights-reserved; známky ALTAR ověřeny). Před nasazením je ale nutné opravit několik přeceněných míst a doplnit guardraily. NEJDŮLEŽITĚJŠÍ: (1) MIT není clean shield pro herní DATA ALTAR — chrání jen Týcův KÓD a je 'AS IS' bez záruky titulu/neporušení; pokud engine ztělesňuje chráněnou kompilaci ALTAR, downstream stále riskuje. (2) Zcela chybí SUI GENERIS právo pořizovatele databáze (§88n. AutZ) — přepis kompletních tabulek 1:1 'vlastním kódem' může být zásah i u 'holých' čísel; reimplementovat z principu, ne transkripcí. (3) Neověřený předpoklad uniformního MIT — auditovat LICENSE každého balíčku i závislostí (rules-skeleton je 'code' a přesto bez licence; hrozí i GPL kontaminace). MENŠÍ, ale nutné: MIT notice přejmout per-package doslovně (ne vymyšlené '2014–2015'); disclaimer sladit s realitou (® jen Dračí doupě + ALTAR; DrD/DrD+ neoznačovat jako 'zapsané' bez ověření v ÚPV); SEO opřít o §10 ZOZ/čl.14 EUTM (poctivé zvyklosti), nikdy 'DrD+' v doméně/URL/názvu; AI doplnit VÝSTUPNÍ filtr chráněných jmen; a vyřešit napětí VTT — doslovný text ALTAR nesmí na sdílené plochy (token/chat), jen holá čísla + vlastní obsah; zakázat embed/iframe gated drdplus.info. Kontext, který posiluje konzervativnost: ALTAR nemá ŽÁDNOU fan/VTT policy (žádný safe harbor à la Chaosium CoC), takže vše mimo MIT stojí jen na hranici myšlenka/výraz + známkovém právu a je vystaveno C&D. Po zapracování těchto oprav je návrh obhajitelný pro provoz plně funkčního kompatibilního nástroje bez dodávání obsahu ALTAR.
- **[overreach]** (c) MIT engine je bezpečný komerční štít pro ~60 výpočetních tabulek a číselné hodnoty; 'MIT VÝSLOVNĚ dovoluje SELL' → commercialSafe:true.
  - → Přeformulovat legalBasis: MIT = štít jen vůči Týcovým právům ke KÓDU, nikoli vůči případným právům ALTAR k podkladovým herním datům. Preferovat NEZÁVISLOU reimplementaci mechaniky z veřejně známého principu (§2/6) místo spoléhání, že MIT 'pere' hodnoty ALTAR. commercialSafe držet true pro softwarovou/mechanickou vrstvu, ale doplnit výhradu titulu.
- **[needs-guardrail]** (c)/(d) Fallback 'vlastní JS reimplementace téže mechaniky' — číselné tabulky lze reimplementovat, protože holá čísla nejsou chráněna (§2/6).
  - → Doplnit guardrail: reimplementovat mechaniku z FUNKČNÍHO PRINCIPU (vzorec → dopočet), NE transkripcí kompletních tabulek ALTAR; nekopírovat strukturu/pořadí/členění tabulek z PDF. Kde tabulky pocházejí z MIT repa, čerpat odtud (Týc nese riziko); jinak generovat hodnoty výpočtem. Explicitně pojmenovat riziko sui generis databáze v avoid.
- **[needs-guardrail]** Celá výpočetní vrstva stojí na MIT balíčcích drdplus/* (tables, properties, health, combat-actions, armourer, ...) = jednotně MIT.
  - → Guardrail: PŘED zabalením ověřit LICENSE KAŽDÉHO konkrétního balíčku i jeho tranzitivních závislostí (ne předpokládat MIT z jednoho vzorku). Balíček bez LICENSE = nepoužít. Skenovat na GPL/AGPL/NC v celém dependency stromu.
- **[needs-guardrail]** attributionText: 'The MIT License (MIT), Copyright © 2014–2015 Jaroslav Týc' jako blanket atribuce.
  - → Nereprodukovat vymyšlený rozsah let; přejmout doslovný copyright notice z LICENSE každého použitého balíčku (per-package), případně agregovat skutečné roky. Vygenerovat atribuci automaticky ze zdrojových LICENSE souborů, ne ručně.
- **[needs-guardrail]** requiredDisclaimerText: '„Dračí doupě®", „DrD™", „DrD+" a „ALTAR®" jsou zapsané ochranné známky nakladatelství ALTAR.'
  - → Sladit disclaimer s ověřenou realitou: '„Dračí doupě®" a „ALTAR®" jsou zapsané ochranné známky nakladatelství ALTAR; „DrD" a „DrD+" jsou označení užívaná nakladatelstvím ALTAR.' Neoznačovat ™/neověřené jako 'zapsané'. Registraci DrD+ ověřit v databázi ÚPV/EUIPO před finálním zněním.
- **[needs-guardrail]** (h) SEO/landing 'kompatibilní s DrD+' = přípustné nominativní fair use ochranných známek.
  - → Rámovat právní základ jako §10 ZOZ / čl.14 EUTM (poctivé zvyklosti), ne US 'nominative fair use'. Guardrail: 'DrD+' užívat jen v nezbytné míře pro označení slučitelnosti v textu, NIKDY v doméně/subdoméně/URL slugu/názvu produktu/OG-title; disclaimer o neoficiálnosti viditelně nad ohybem stránky; vyhnout se vizuální blízkosti k *.drdplus.info.
- **[needs-guardrail]** (d)(e)(i) Uživatelem vložený obsah z legální kopie držet v 'jeho soukromém prostoru', neredistribuovat — tím je vklad vlastního obsahu OK.
  - → Explicitně oddělit: doslovný oficiální TEXT ALTAR (popisy kouzel/flavor/statblok jako text) NEsmí na sdílené plochy (TM token, chat, sdílená scéna) — tam jen mechanické hodnoty (holá čísla) a uživatelův vlastní/generovaný text. Verbatim text ALTAR jen v čistě soukromém, jinému hráči nepřístupném poznámkovém prostoru vlastníka.
- **[needs-guardrail]** (j) AI generátor je bezpečný, pokud NEMÁ v tréninku/promptu doslovné texty ALTAR (jen mechanickou kostru).
  - → Přidat VÝSTUPNÍ kontrolu, ne jen vstupní: blocklist chráněných jmen/lokací/tvorů ALTAR aplikovaný na výstup, detekce blízké shody s known-flavor, povinné označení 'neoficiální/vygenerováno'. Ideálně lidský/automat review před uložením do sdíleného prostoru.
- **[needs-guardrail]** Honor-gate obcházet nesmíme; import nesmí scrapovat drdplus.info.
  - → Doplnit do avoid: neembeddovat, neiframovat, neproxovat ani necachovat obsah *.drdplus.info (vč. 'Zkusím' trialu) uvnitř platformy; odkazovat jen externím prolinkem na altar.cz / drdplus.info.

**Avoid:**
- Dodat jako součást platformy oficiální TEXT pravidel DrD+, popisy kouzel/schopností, statbloky a flavor bestiáře, dobrodružství nebo obsah světa (Taria, Asterion) — vše copyright ALTAR bez veřejné licence.
- Použít logo, značku nebo stylizovaný název 'Dračí doupě®', 'DrD™', 'DrD+' či 'ALTAR®' jako branding, název produktu, doménu nebo v identitě Ikaros (zapsané ochranné známky). Přípustná jen nominativní zmínka slučitelnosti.
- Kopírovat doslovné bloky textu z pravidel — definice vlastností, popisy, příklady, číselné tabulky jako publikovaný výraz/rozvržení ALTAR.
- Reprodukovat vizuální rozvržení oficiálního postavního listu / trade dress ALTAR.
- Scrapovat nebo přebírat obsah z drdplus.info / bestiar.drdplus.info — je honor-gated na čestné prohlášení o vlastnictví kopie, není to licenční grant třetím stranám; obcházení gate = porušení.
- Tvořit odvozená díla (včetně překladu) z chráněného textu pravidel/kouzel/bestiáře bez smlouvy s ALTAR.
- Komerčně zpřístupnit/prodávat OBSAH ALTAR (placené balíčky statbloků/kouzel/pravidel) — MIT pokrývá jen software J. Týce, ne obsah vydavatele.
- Zaměnit obsahové repozitáře drdplus (rules-skeleton, index, bestiary-dm, adventures-dm, story, wizard-codes/theurgist obsah, core-ideas) za MIT — mají LICENSE = 404 → all-rights-reserved; MIT je jen výpočetní/engine vrstva.
- Vynechat MIT notice u vrstvy postavené nad drdplus/* enginem (porušení MIT).
- Zpřístupnit reprodukci pravidel uživatelům, kteří nevlastní legální kopii (obcházení honor-gate).

**Návrh disclaimeru:**
> Tento nástroj je neoficiální fanouškovský projekt a není nijak spojen s nakladatelstvím ALTAR ani jím schválen. „Dračí doupě®“, „DrD™“, „DrD+“ a „ALTAR®“ jsou zapsané ochranné známky nakladatelství ALTAR. Platforma Ikaros neposkytuje text pravidel, kouzla, bestiář ani obsah světa Dračího doupěte Plus — pro hru je potřeba legálně vlastnit oficiální pravidla, která si můžete pořídit u nakladatelství ALTAR (altar.cz). Nástroj poskytuje pouze vlastní deník, výpočty a pomůcky slučitelné s mechanikou DrD+; veškerý herní obsah (kouzla, bestie, předměty, poznámky) si vytváří nebo vkládá uživatel sám ze své legálně vlastněné kopie.

**Návrh atribuce:**
> Výpočetní vrstva tohoto nástroje využívá open-source knihovny projektu drdplus (github.com/drdplusinfo) pod licencí MIT. The MIT License (MIT), Copyright © 2014–2015 Jaroslav Týc. Software je poskytován „tak, jak je“, bez jakékoli záruky. Tento produkt není oficiálním produktem DrD+ ani nakladatelství ALTAR a je s nimi pouze kompatibilní.

**Poznámky rešerše:** ZÁVĚR — co lze legálně postavit TEĎ (bez smlouvy, konzervativně):

MAXIMUM = autofill/výpočetní DrD+ deník + kalkulace nad MIT enginem drdplus/* (Jaroslav Týc). ~30 repozitářů na github.com/drdplusinfo (i na Packagist jako drdplus/*) je pod MIT: tables (60+ výpočetních tabulek), properties, races, professions, profession-levels, properties-by-fate/levels, background, skills, health, stamina, equipment, combat-actions, fight-properties, base-properties, armourer, destruction, drdplus-calculations, drdplus-current-properties, codes, rolls-on, gaming-session ad. MIT dovoluje use/modify/distribute/sublicense/SELL i zabudování do VTT/appky — jen zachovat MIT notice. Herní mechaniky/vzorce/tabulky jako FUNKČNÍ systém nejsou chráněny autorským právem (CZ/EU), takže výpočty lze reimplementovat.

ZDI — co NELZE bez vyjednané smlouvy s ALTAR: text pravidel, popisy kouzel/schopností jako text, statbloky+flavor bestiáře, dobrodružství, svět (Taria/Asterion), a názvy/logo (zapsané ochranné známky Dračí doupě®/DrD™/DrD+/ALTAR®). Obsahové repozitáře na GitHubu jsou ZÁMĚRNĚ bez licence (LICENSE = 404 → all-rights-reserved), a plný text na *.drdplus.info je gated na čestné prohlášení o vlastnictví placené kopie („prohlašuji na svou čest, že vlastním legální kopii“) + výzva k nákupu.

KLÍČOVÝ ROZDÍL (zadání): drdplus.info NENÍ otevřená obsahová licence. Otevřená je jen SOFTWAROVÁ vrstva (MIT © J. Týc); OBSAH zůstává copyright ALTAR. Nutno oddělit: MIT engine = ANO; text/known-how ALTAR = NE.

ENGINE-LEVEL OTEVŘENÁ CESTA: na úrovni OBSAHU pro DrD+ NEEXISTUJE žádný SRD/ORC/CC ekvivalent (na rozdíl od D&D 5e SRD nebo Chaosium BRP/ORC). Jediná otevřená cesta = MIT výpočetní engine (software). Pro plnohodnotný obsahový DrD+ produkt je nutná dohoda s ALTAR.

DOPORUČENÍ pro Projekt Ikaros: (1) Stavět DrD+ deník s autofill/výpočty nad MIT drdplus/* (JS port nebo volání logiky), s MIT notice v repu/patičce. (2) Vlastní texty/hlášky, žádné přebírání prózy pravidel; hodnoty čerpat z MIT tabulek, ne z PDF ALTAR. (3) Branding neutrální („kompatibilní s DrD+“), bez loga/známek. (4) Kouzla/bestiář/pravidlové texty nevkládat jako obsah — buď generovat vlastní kompatibilní obsah (i přes AI generátor), nebo vyjednat licenci s ALTAR. (5) Před monetizací obsahu (ne enginu) mít smlouvu s ALTAR.

Confidence 0.85: primární zdroje ověřeny (MIT LICENSE soubory, patičky *.drdplus.info, altar.cz, e-shop podmínky). Nejistota: přesný právní základ svolení drdplus.info od ALTAR není zveřejněn (dohoda vs. tolerance) a hranice „mechanika vs. chráněný výraz“ je právní posouzení, které bez právníka zůstává rizikové u hraničních případů (doslovné tabulky, terminologie).

---

### Dračí doupě II (DrD II)  `drd2`

**Strop:** `reference-only`

> Pro DrD II NEEXISTUJE žádná otevřená licence (žádné OGL/ORC/CC/otevřené SRD); systém je proprietární © ALTAR 2012 a značky „Dračí doupě / DrD / ALTAR“ jsou zapsané ochranné známky. Autorizovaný SRD (drd2srd.d20.cz) je svolení vázané na projekt d20.cz, NE licence pro Ikaros. Fanouškovská podpora ALTARu je neformální, bez licenčních podmínek a jen nekomerční — na komerční platformu se nedá spolehnout. Reálný strop: reprodukce jakéhokoli chráněného OBSAHU příruček (pravidla, katalogy povolání/schopností/kouzel, statbloky) = NE; oficiální obsah smíme jen ODKAZOVAT jako externí zdroj. Přitom platforma smí stavět plné generické, system-agnostické NÁSTROJE (deník, výpočty, mapa, tokeny, katalog-kontejner), protože herní mechanika a vzorce jsou dle §2 odst. 6 AutZ nechráněné myšlenky/postupy/metody — to je vlastní IP Ikara, ne obsah DrD II. Proto „reference-only“ (na obsah), nikoli „blocked“ (nástroje jdou) ani „fan-noncommercial“ (fan-tolerance nekryje komerční režim). Konkrétní důkaz rizika přímo v repu: drd2Abilities.ts (264 schopností, hlavička „Obsah pochází z příruček DrD II (ALTAR)“) — to je přesně to, co bez smlouvy nesmí ven.

**Licenční základ:**
- **Autorská práva ALTAR — proprietární systém, ŽÁDNÁ otevřená licence** — `none-found` · ✔ primární zdroj · https://www.drd2.cz/
  - „© ALTAR 2012"
- **Registrované ochranné známky Dračí doupě / DrD / ALTAR** — `other` · ✔ primární zdroj · https://ppj.drdplus.info/
  - „Dračí doupě, DrD a ALTAR jsou zapsané ochranné známky nakladatelství ALTAR"
- **Pirátská verze — volně šiřitelná zkrácená pravidla (zdarma)** — `online-policy` · ✔ primární zdroj · https://obchod.altar.cz/drd-ii-piratska-verze-p-1000.html
  - „volně šiřitelná zkrácená verze pravidel"
  - „Neposkytuje veškeré možnosti plné verze, slouží pouze jako úvod do hry formou krátkého ukázkového dobrodružství."
- **Neformální podpora fanouškovské tvorby (bez licenčních podmínek)** — `fan-policy` · ✔ primární zdroj · https://drd2.cz/rozsireni
  - „Do budoucna pro vás připravujeme možnost vkládat i vaše vlastní rozšíření."
- **DrDII SRD (drd2srd.d20.cz) — autorizovaný, ale NENÍ otevřená licence** — `online-policy` · ✔ primární zdroj · https://drd2srd.d20.cz/
  - „DrDII patří nakladatelství Altar a toto SRD vzniklo s výslovným svolením nakladatele i autorů hry."
  - „Stejně jako u ostatních SRD, samotný fakt že je DrDII nyní k dispozici v markdown zdroji znamená, že s ním lze pracovat dále - berte přitom ohledy na práva Altaru a autorů."

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: NE (mimo úzkou výjimku). Plná pravidla jsou proprietární © ALTAR. Volně šiřitelná je pouze 'Pirátská verze' = zkrácený úvod (cca 20 s., 3 povolání), nikoli plná pravidla. Autorizovaný text pravidel je online na drd2srd.d20.cz, ale jen na základě svolení pro TENTO projekt (d20.cz/Kostka), bez otevřené licence a bez blanketního práva pro třetí strany. Ikaros nesmí přebírat text pravidel z příruček.
- `names_terminology`: Bez licence. 'Dračí doupě' a 'DrD' jsou registrované ochranné známky. Jednotlivé herní pojmy jsou nutné k hraní (interoperabilita) a názvy postupů/mechanik jako takové nejsou autorskoprávně chráněné, ale používat značku 'Dračí doupě II / DrD II' k označení produktu/služby/skinu bez svolení = riziko porušení ochranné známky. Bezpečné: neutrální/vlastní označení systému.
- `spells_abilities_lists`: NE. Seznamy a popisy povolání, zvláštních schopností a kouzel jsou chráněné vyjádření z příruček ALTAR. Holé číselné hodnoty a mechaniky jsou nechráněné ideje, ale kurátorský VÝBĚR + USPOŘÁDÁNÍ + doslovné popisy chráněny jsou → bez licence nereprodukovat katalog schopností/kouzel.
- `bestiary_statblocks`: NE. Statbloky a popisy bytostí z příručky Bestiář (2012) jsou chráněné vyjádření. Nekopírovat texty ani tabulkové profily převzaté z příručky.
- `autofill_calc_sheet`: ŠEDÁ ZÓNA — podmíněně ANO. Samotné výpočetní vzorce a herní mechaniky jsou nechráněné ideje; deník s autofill/výpočty lze postavit tak, že HRÁČ zadá vlastní hodnoty (system-agnostický formulář). NESMÍ obsahovat převzatý text, tabulky ani popisy z příruček ALTAR a nesmí se prezentovat jako oficiální DrD II obsah.
- `commercial`: NE. Žádná veřejná licence komerční užití nedovoluje. Budoucí monetizace obsahu/funkcí navázaných na DrD II bez individuální smlouvy s ALTAR = vysoké riziko. (Precedens: pokus o licenci 2015 – Ondrusz – neuspěl kvůli komplikacím s mnoha spoluautory.)
- `derivatives`: Bez formálního udělení práv. ALTAR neformálně 'povzbuzuje a podporuje' fanoušky tvořit a sdílet vlastní volitelná pravidla/povolání/schopnosti, ale bez publikovaných licenčních podmínek — jde o podporu, ne o převod práv. Nekomerční fanouškovské sdílení tolerováno; aplikační/komerční odvozeniny nepokryty.
- `vtt_app`: NE. Žádná veřejná licence nepokrývá VTT/aplikaci. Autorizovaný SRD je svolení pro projekt d20.cz, nikoli licence pro Ikaros. Pro VTT reprodukující chráněný obsah je nutná smlouva.
- `translation`: NE bez svolení ALTAR (dílo je proprietární; překlad = odvozené dílo).
- `logo_use`: NE. Logo a značky 'Dračí doupě', 'DrD', 'ALTAR' jsou registrované ochranné známky nakladatelství ALTAR — nepoužívat pro označení, branding ani skin.

**Vyžaduje:**
- Žádné formální povinnosti atribuce nejsou stanoveny — protože není udělena ŽÁDNÁ veřejná licence (nelze splnit podmínky, které neexistují; chybějící licence = chybějící právo, ne volné užití).
- Pokud by se cokoli čerpalo z DrDII SRD (drd2srd.d20.cz): platí 'berte přitom ohledy na práva Altaru a autorů' — a svolení je vázané na projekt d20.cz, ne na Ikaros.
- Pro cokoli nad rámec volně šiřitelné 'Pirátské verze' (tj. plná pravidla, povolání, schopnosti, kouzla, bestiář, komerce, VTT reprodukce) je nutná individuální písemná smlouva s ALTAR.
- Respektovat registrované ochranné známky (Dračí doupě®, DrD, ALTAR) — nepoužívat jako značku produktu/služby bez svolení.

**Zakazuje:**
- Reprodukce plných pravidel a jejich chráněného vyjádření (text z příruček) bez licence.
- Přebírání seznamů a popisů povolání, zvláštních schopností a kouzel z příruček ALTAR (katalog schopností/kouzel).
- Kopírování statbloků a popisů bytostí z příručky Bestiář (2012).
- Použití registrovaných ochranných známek 'Dračí doupě', 'DrD', 'ALTAR' a loga jako označení produktu, služby, skinu nebo brandingu.
- Komerční využití obsahu DrD II bez smlouvy s ALTAR (týká se i budoucí monetizace platformy navázané na tento systém).
- Vydání VTT/aplikace, která reprodukuje chráněný text/obsah DrD II, bez licence.
- Překlad a distribuce příruček bez svolení nakladatele.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecně-neutrální deník** — System-agnostický deník: volná pole (jméno postavy, koncept, poznámky, inventář jako volný text, vlastní uživatelské sekce). Hráč si vše plní sám, nic není předvyplněno. Existující FE list Drd2Sheet.tsx v tomto režimu (hráč zadává ZS ručně, katalog je odpojen) tento vzor už naplňuje.
  - *základ:* Vlastní dílo platformy Ikaros. Prázdný formulář/nástroj neobsahuje žádné chráněné vyjádření DrD II — je to nechráněná idea nástroje. Nepřebírá se žádný text z příruček.
  - *guardraily:* žádný převzatý text z příruček · žádná značka/logo DrD/ALTAR · generický název sekcí · obsah = 100 % vstup hráče
- **[C] (b) Systémově-strukturovaný deník (pole/atributy/pořadí)** — Deník s poli odpovídajícími STRUKTUŘE tvorby postavy DrD II — názvy herních veličin (vlastnosti, životaschopnost, obranné/útočné číslo…), seznam názvů povolání a graf podmiňujících povolání (základní→pokročilá→mistrovská). Přesně to, co dnes dělá drd2Professions.ts. Hráč zadává vlastní hodnoty; pole jen strukturují vstup.
  - *základ:* §2 odst. 6 AutZ: myšlenka, postup, princip, metoda nejsou dílem → herní systém a struktura tvorby postavy jsou nechráněné. Názvy jednotlivých herních veličin/povolání jsou funkční pojmy nutné k interoperabilitě (hratelnosti), samy o sobě nedosahují úrovně autorského díla. Přebírá se STRUKTURA (nechráněná idea), NIKOLI popisný text (chráněné vyjádření).
  - *guardraily:* pole = jen názvy veličin, ŽÁDNÉ definice/popisy z příručky · nekopírovat 1:1 grafickou podobu oficiálního listu postavy (výběr+uspořádání může být chráněná kompilace dle §2 odst. 2/5 — vlastní layout) · nepoužívat „Dračí doupě II“ jako obchodní název deníku (jen referenčně, viz (h)) · disclaimer „neoficiální“
- **[C] (c) Autofill + výpočty** — Deník dopočítává odvozené hodnoty z hráčem zadaných vstupů podle herních vzorců (bonusy z vlastností, nosnost, obranné/útočné číslo, přepočty úrovní). Hráč zadá vstupní hodnoty, systém spočítá výsledek.
  - *základ:* §2 odst. 6 AutZ výslovně vylučuje z ochrany „postup, princip, metodu, matematický a obdobný vzorec“. Herní výpočet je metoda/vzorec = volně implementovatelný. Výpočetní logika vzniká vlastní implementací z obecné znalosti mechaniky.
  - *guardraily:* vzorce implementovat z principu, NE opisem tabulek z příručky · nezobrazovat převzaté tabulkové hodnoty/tabulky z příruček jako datový podklad · žádná prezentace jako „oficiální“ výpočet DrD II · oddělit datové zdroje: kód = mechanika, obsah = vstup hráče
- **[C] (d) Katalog kouzel/schopností/předmětů — JEN prázdný uživatelský kontejner** — Nástroj-katalog (vzor herbář/lektvary/kouzla/předměty 21.5), kam si PJ/hráč vkládá VLASTNÍ položky. Buildable je prázdný framework + obsah zadaný uživatelem. NENÍ buildable předvyplnění oficiálním katalogem DrD II (264 ZS v drd2Abilities.ts = přesně to, co ven nesmí).
  - *základ:* Prázdný katalog = vlastní nástroj Ikara (idea nástroje, §2/6). Oficiální katalog schopností/kouzel je naopak chráněné vyjádření: kurátorský VÝBĚR + USPOŘÁDÁNÍ + popisy = soubor/kompilace dle §2 odst. 2/5 AutZ → reprodukce bez licence NE. Uživatelem vložený obsah je odpovědnost uživatele.
  - *guardraily:* NEpředvyplňovat oficiálními DrD II kouzly/schopnostmi/předměty · žádný seed z příruček ani z drd2srd.d20.cz · drd2Abilities.ts držet ODPOJENÝ a MIMO produkční bundle (tree-shake/ne-import) až do smlouvy · hráč vkládá vlastní; možnost sdílet jen fanouškovský/nekomerční obsah s disclaimerem
- **[C] (e) Bestiář / statbloky — JEN prázdný nástroj + tokeny** — Generický tvůrce bestií a tokenů (Drd2BestiePanel.tsx, tactical-map bestie schema), kde PJ zadává VLASTNÍ nestvůry (názvy, hodnoty, popis). Buildable je nástroj + PJ-obsah. NENÍ buildable přenos statbloků a popisů z příručky Bestiář (2012).
  - *základ:* Struktura statbloku (sada polí) = idea/šablona, §2/6. Konkrétní profil a popis bytosti z příručky = chráněné vyjádření + kurátorský výběr → NE. Holé číslo samo o sobě je údaj (§2/6), ale ucelený statblok+popis převzatý z knihy je chráněný.
  - *guardraily:* nekopírovat texty ani tabulkové profily z Bestiáře 2012 · žádný seed oficiálních bytostí · tokeny = vlastní/licencovaná grafika uživatele, ne art z příruček · disclaimer „neoficiální, obsah PJ“
- **[C] (f) Taháky pravidel — jen vlastními slovy + odkaz na oficiál** — Stručná funkční připomenutí JÁDROVÝCH mechanik napsaná vlastními slovy (např. „hod k6 + vlastnost proti obtížnosti“), doplněná prominentním ODKAZEM na volně šiřitelnou „Pirátskou verzi“ a autorizovaný SRD jako externí zdroj plných pravidel. NENÍ to reprodukce ani parafráze celé kapitoly.
  - *základ:* Postup/princip hry je dle §2/6 AutZ volně popsatelný vlastními slovy. Hranice: blízká parafráze rozsáhlejšího chráněného textu nebo převzetí výběru+uspořádání příručky = riziko odvozeného díla/kompilace → proto minimalismus + odkaz místo reprodukce. Odkaz na externí oficiální zdroj práva ALTARu neporušuje.
  - *guardraily:* jen krátké mechaniky vlastními slovy, žádné souvislé bloky/parafráze z příručky · nereplikovat výběr a strukturu příručkové kapitoly · plná pravidla NEhostovat — jen odkázat na oficiální/Pirátskou verzi/SRD · neprezentovat jako oficiální · disclaimer + atribuce
- **[C] (g) Taktická mapa + tokeny** — Plně generický VTT nástroj: mřížka, boj, iniciativa, fog/LoS, tokeny, kostky (TacticalMapView, DiceLogPanel). Bez jakéhokoli obsahu DrD II — jen mechanika VTT a uživatelská grafika.
  - *základ:* Vlastní generický nástroj Ikara. VTT mechaniky (grid, iniciativa, dohled) jsou postupy/metody (§2/6) a neváží se na chráněný obsah DrD II. Žádné převzaté vyjádření.
  - *guardraily:* žádné mapy/art/logo z příruček DrD II · tokeny = vlastní nebo řádně licencovaná grafika uživatele · kostkové mechaniky implementovat obecně, ne opisem tabulek · systémová vazba jen přes strukturu (viz b), ne obsah
- **[C] (h) Veřejná landing/SEO stránka + wording (referenční užití značky)** — Marketingová stránka /ikaros/systemy/draci-doupe-2 (dnes published:true), která FAKTICKY/REFERENČNĚ uvádí, že platforma podporuje hru v systému Dračí doupě II (deník, taktická mapa, chat za postavu). Značka použita jen k popisu kompatibility, ne jako brand produktu.
  - *základ:* Referenční/deskriptivní užití ochranné známky (nominative/referential use, čl. 14 nařízení o EUTMR + § užití ZOZ) je přípustné, pokud (1) je nezbytné k označení, k čemu služba slouží, (2) je v souladu s poctivými zvyklostmi a (3) nevzbuzuje dojem propojení/schválení. Popsat „hrajte i Dračí doupě II“ ≠ pojmenovat produkt „Ikaros DrD II“.
  - *guardraily:* ŽÁDNÉ logo, font ani trade dress ALTARu · nepoužívat mark jako název produktu/skinu ani v doméně · viditelný disclaimer o neexistujícím propojení s ALTAR · psát správně „Dračí doupě II“ (ne kreativní kapitalizace budící dojem loga) · držet referenčně/fakticky, ne dominantně brandově · právník potvrdí wording před ostrým komerčním nasazením
- **[C] (i) Import/export vlastních dat hráče** — Export a import deníku/postavy jako JSON — tj. hodnot, které do systému zadal sám hráč (jeho data). Umožní zálohu, přenos mezi světy, migraci.
  - *základ:* Data zadaná uživatelem jsou jeho obsah; jejich export/import je funkce nástroje, nikoli reprodukce chráněného díla. Formát/schéma = idea (§2/6).
  - *guardraily:* exportovat/importovat JEN uživatelská data, ne balík oficiálního obsahu · nedodávat importér, který stahuje/embeduje oficiální DrD II obsah · nedistribuovat „DrD II content pack“ odvozený z příruček/SRD · při sdílení mezi uživateli přenášet jen jejich vlastní obsah
- **[C] (j) AI generátor kompatibilního obsahu** — Generátor NOVÝCH originálních položek (NPC, nestvůra, předmět, zápletka), které jsou MECHANICKY kompatibilní se strukturou DrD II (používají pole/veličiny dle b), ale text je nově vytvořený a originální. Slouží jako inspirace/rychlá tvorba pro PJ.
  - *základ:* Nově vygenerované originální vyjádření není reprodukcí; mechanická struktura (pole) je nechráněná idea (§2/6). Výstup je nové dílo tvořené hráčem/PJ za pomoci nástroje.
  - *guardraily:* NEkrmit model copyrightovanými příručkami ani SRD (žádný RAG/kontext z chráněného textu) · výstup = originální próza + struktura, ne převzaté názvy/popisy oficiálních kouzel/nestvůr · filtr proti near-verbatim reprodukci · označit jako AI-generované, neoficiální, fanouškovské · lidská kontrola PJ před použitím

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek právně OBHAJITELNÝ a nadprůměrně opatrný: strop „reference-only\" je správně odvozený a ověřený primárními zdroji — hlavička SRD doslovně potvrzuje, že jde o svolení vázané na projekt d20.cz (ne licenci pro Ikaros), §2 odst. 6 AutZ doslovně vylučuje myšlenky/postupy/metody/vzorce, a v repu je ověřeno, že drd2Abilities.ts (264 ZS, „obsah pochází z příruček DrD II (ALTAR)\") NENÍ importován do bundlu. Návrh nezaměňuje „volně šiřitelné\" za „nekomerční licenci\" ani nespoléhá na SRD/pirátku jako základ reuse — to je korektní. Nástroje (a,c,e,g,i) a prázdné kontejnery (d) jsou sound. NUTNÉ OPRAVY před ostrým komerčním nasazením: (1) DOPLNIT chybějící analýzu zvláštního práva pořizovatele databáze (sui generis, §88a–90 AutZ) — nikde v rámci není, přitom míří přímo na (b) katalog povolání + graf podmíněnosti, (c) velké tabulky, (d) katalogy; „jen struktura/funkční pojmy\" tuto ochranu neobchází. (2) SNÍŽIT confidence a zpřísnit (b): reprodukce úplného ALTARem sestaveného seznamu povolání + hran = riziko kompilace/DB, ne neutrální fakt. (3) UGC vrstva u sdílení (d/e): komerční platforma potřebuje notice-and-takedown + zákaz sdílení obsahu odvozeného z příruček (ne jen „nekomerční\"), jinak sekundární odpovědnost. (4) (f) a (j) jsou skutečné rizikové body — držet nízkou confidence, tvrdé stropy, žádné systematické pokrytí/nahrazení příručky, povinná lidská kontrola a per-znění právní review. (5) (h) přidat vrstvu nekalé soutěže (§2976 OZ) a hlídat, aby SEO meta/slug nebudily dojem oficiálnosti/schválení. (6) Ověřit skutečný zápis ochranných známek v ÚPV/EUIPO (tvrzení „zapsané\" nepodloženo), závěr guardrailů však platí i pro nezapsané chráněné označení. Žádné tvrzení není fatálně vadné; jde o doplnění guardrailů a kalibraci confidence, ne o přepsání strategie.
- **[needs-guardrail]** (b) Systémově-strukturovaný deník: názvy veličin + celý seznam povolání + graf podmiňujících povolání (základní→pokročilá→mistrovská); „funkční pojmy, přebírá se jen struktura" (conf 0.82)
  - → Doplnit guardrail: nereplikovat ÚPLNÝ oficiální katalog povolání + celý graf podmíněnosti jako datovou sadu (riziko sui generis DB). Přebírat jen abstraktní strukturu polí nutnou k hratelnosti; názvy povolání ideálně jako uživatelský vstup nebo minimální podmnožinu, ne shipovat kompletní ALTARem sestavený seznam+hrany. Snížit confidence.
- **[needs-guardrail]** (d-sdílení) „hráč vkládá vlastní; možnost sdílet jen fanouškovský/nekomerční obsah s disclaimerem; uživatelem vložený obsah je odpovědnost uživatele"
  - → Doplnit: notice-and-takedown mechanismus, zákaz sdílení obsahu odvozeného z příruček/SRD (ne jen „nekomerční"), moderaci/report, ToS přenášející odpovědnost + reálné odstraňování na výzvu.
- **[needs-guardrail]** (f) Taháky pravidel vlastními slovy + odkaz na oficiál/pirátku/SRD; „ne reprodukce ani parafráze celé kapitoly" (conf 0.55)
  - → Zpřísnit: tvrdý strop rozsahu, žádné systematické/úplné pokrytí kapitoly, jen izolované jádrové mechaniky; PŘED komerčním nasazením právní review konkrétního znění; explicitně nereplikovat pořadí/strukturu příručky.
- **[needs-guardrail]** (h) Veřejná SEO/landing /ikaros/systemy/draci-doupe-2 s referenčním užitím značky (nominative use, čl. 14 EUTMR) (conf 0.6)
  - → Doplnit caveat nekalé soutěže; zajistit, že SEO title/meta/OG neimplikují oficiální/schválené; disclaimer nad ohybem; právník potvrdí wording před ostrým komerčním během (návrh už zmiňuje).
- **[needs-guardrail]** (j) AI generátor originálního, mechanicky kompatibilního obsahu; NEkrmit model příručkami/SRD, filtr proti near-verbatim (conf 0.5)
  - → Doplnit: provenance/logging výstupů, zákaz marketingu výstupů jako „DrD II obsah", POVINNÁ lidská kontrola PJ jako trvalá pojistka (ne volitelná), ToS s přenosem odpovědnosti; přiznat reziduální riziko úniku chráněného vyjádření z báze modelu.
- **[uncertain]** Značky „Dračí doupě", „DrD", „ALTAR" jsou ZAPSANÉ ochranné známky (tvrzeno v ceilingReason, avoid, disclaimeru)
  - → Ověřit skutečný zápis v ÚPV/EUIPO/WIPO databázi před ostrým nasazením; text disclaimeru formulovat tak, aby platil i kdyby šlo o nezapsané, avšak chráněné označení (trade name/nekalá soutěž).
- **[needs-guardrail]** Napříč rámcem (b/c/d): opora jen o §2 odst. 6 AutZ (idea/metoda) a §2 odst. 2/5 (kompilace)
  - → Přidat do rámce samostatný odstavec o sui generis DB právu: reprodukce podstatné části systematicky uspořádaných dat DrD II (i „jen struktury" jako celé sady) = riziko i bez autorské původnosti → přebírat jen minimum nutné k interoperabilitě, ne úplné datové sady.

**Avoid:**
- Reprodukovat plná pravidla ani souvislé bloky/parafráze textu z příruček DrD II (© ALTAR).
- Zapojit/nasadit katalog zvláštních schopností (drd2Abilities.ts, 264 ZS „obsah pochází z příruček DrD II (ALTAR)“) nebo jakýkoli katalog kouzel/povolání převzatý z příruček — kurátorský výběr+uspořádání+popisy jsou chráněné (§2 odst. 2/5 AutZ). Držet odpojené a MIMO produkční bundle až do smlouvy.
- Předvyplňovat (seedovat) deník/katalog/bestiář oficiálním obsahem z příruček nebo z drd2srd.d20.cz.
- Kopírovat statbloky a popisy bytostí z Bestiáře DrD II (2012).
- Kopírovat 1:1 grafickou podobu/uspořádání oficiálního listu postavy (riziko chráněné kompilace).
- Použít logo, font nebo trade dress a značky „Dračí doupě“, „DrD“, „ALTAR“ jako název produktu, služby, skinu, domény nebo brandingu (zapsané ochranné známky).
- Spoléhat na svolení pro projekt drd2srd.d20.cz jako právní základ pro Ikaros — svolení je vázané na jiný projekt (d20.cz/Kostka), nezakládá právo třetí strany.
- Krmit AI generátor copyrightovanými příručkami/SRD (RAG i trénink) a nechat ho reprodukovat oficiální kouzla/nestvůry.
- Distribuovat „DrD II content pack“ nebo překlad příruček.
- Prezentovat cokoli jako „oficiální“ obsah DrD II nebo budit dojem propojení/schválení nakladatelstvím ALTAR.
- Komerčně monetizovat obsah navázaný na DrD II bez individuální písemné smlouvy s ALTAR (fanouškovská tolerance je jen nekomerční a bez licenčních podmínek).
- Hostovat plná pravidla / Pirátskou verzi lokálně místo pouhého odkazu na oficiální zdroj.

**Návrh disclaimeru:**
> Neoficiální fanouškovský nástroj. Platforma Ikaros není vytvořena, schválena ani podporována nakladatelstvím ALTAR a není s ním nijak propojena. Tento nástroj neobsahuje pravidla, texty ani obsah z příruček Dračí doupě II — slouží jako univerzální pomůcka pro hodnoty a obsah zadané samotným hráčem. „Dračí doupě“, „DrD“ a „ALTAR“ jsou zapsané ochranné známky nakladatelství ALTAR. Plná pravidla získáte od nakladatele; volně šiřitelná „Pirátská verze“ i autorizované SRD jsou dostupné z oficiálních zdrojů provozovatele práv.

**Návrh atribuce:**
> „Dračí doupě II“, „Dračí doupě“, „DrD“ a „ALTAR“ jsou zapsané ochranné známky nakladatelství ALTAR (© ALTAR 2012). Uvedení systému je pouze referenční — k označení kompatibility hry. Platforma Ikaros s nakladatelstvím ALTAR není nijak spojena. Odkazy na oficiální a volně šiřitelné materiály směřují na zdroje provozovatele práv (drd2.cz, obchod.altar.cz, drd2srd.d20.cz).

**Poznámky rešerše:** ZÁVĚR: Pro DrD II NEEXISTUJE žádná veřejná otevřená licence (žádné OGL/ORC/Creative Commons/otevřené SRD). Systém je uzavřený, proprietární (© ALTAR). Bez individuální smlouvy s ALTAR lze LEGÁLNĚ postavit jen: (1) system-agnostický deník/autofill, kde hodnoty zadává hráč (mechaniky = nechráněné ideje); (2) generické nástroje (kostky, taktická mapa, chat, tokeny) bez převzatého textu; (3) odkaz/embed na volně šiřitelnou 'Pirátskou verzi' nebo na autorizovaný SRD (drd2srd.d20.cz) jako externí zdroj, NIKOLI přebírání jeho obsahu do Ikara.

POZOR NA MÍRU JISTOTY: Ochranné známky ('Dračí doupě, DrD a ALTAR jsou zapsané ochranné známky nakladatelství ALTAR') potvrzeny doslovně na oficiálních stránkách DrD+ (drdplus.info) a v modulu ALTAR (Asterion 'Dodatky'). Neformální podpora fanoušků je na drd2.cz reálně deklarovaná, ale konkrétní pobídkovou větu ('autoři povzbuzují...') mám jen z agregace vyhledávání, ne doslovně z primárního zdroje — proto v keyQuotes uvádím jen ověřené doslovné citace.

PRECEDENS RIZIKA: Pavel Ondrusz (2015) žádal o licenci/práva k DrD, neuspěl (ne kvůli penězům, ale kvůli autorskoprávním komplikacím s mnoha spoluautory) → po konzultaci s právníkem musel napsat SAMOSTATNOU hru 'Dračí hlídka', aby neporušil práva ALTARu. Signál: i vyjednaná licence je u DrD prakticky obtížná.

SRD NUANCE: drd2srd.d20.cz obsahuje Základní (revidovaná) pravidla v markdownu 's výslovným svolením nakladatele i autorů', ALE nejde o otevřenou licenci — je to svolení pro tento komunitní projekt s výhradou 'berte ohledy na práva Altaru a autorů'. Nezakládá právo třetí strany (Ikaros) obsah reprodukovat/komercializovat.

OVĚŘENÍ KÓDU: Repo-wide grep 'ALTAR' našel jen typ dungeon-objektu 'altar' (map builder), NE komentář tvrzený v zadání ('katalog schopností pochází z příruček ALTARu a čeká na licenci'). Schémata DrD II v kódu existují (backend/assets/schemas/drd2-*.json: character/diary/token/bestie PC+NPC), ale bez licenční anotace — doporučuji doplnit poznámku o právním statusu k těmto souborům (dluh).

DOPORUČENÍ: Držet DrD II ve stavu 'system-agnostický kontejner bez převzatého obsahu' dokud nebude smlouva s ALTAR; oslovit ALTAR kvůli explicitnímu svolení, pokud se plánuje distribuce katalogů schopností/kouzel/bestiáře.

---

### Dračí Hlídka  `draci-hlidka`

**Strop:** `reference-only`

> Dračí Hlídka je uzavřený (proprietární) systém BEZ jakékoli veřejné otevřené licence — SRD/OGL/ORC/Creative Commons/komunitní ani fan policy NEEXISTUJÍ na žádné vrstvě. I bezplatná verze LITE nese „© BlackTower™ Všechna práva vyhrazena" a VÝSLOVNĚ zakazuje zveřejňování, pozměňování či kopírování obsahu (i jednotlivých částí) bez předchozího písemného souhlasu autora; web 2026 uvádí „All Rights Reserved"; obchodní podmínky ani digitální platforma neudělují kupujícímu žádná práva k obsahu. Bez uzavřené smlouvy proto nelze dodat ani šířit ŽÁDNÝ chráněný obsah DH. Reálný strop = (1) generický/systémově-neutrální engine (deník, výpočetní logika, taktická mapa, chat) coby původní dílo Ikara; (2) NOMINATIVNÍ zmínka kompatibility bez loga a bez implikace oficiálnosti; (3) model BYO-content — veškerý chráněný DH obsah (kouzla, schopnosti, bestie, tabulky) vkládá výhradně sám uživatel ze své legálně pořízené kopie a drží se soukromě. Vše nad rámec (texty pravidel, seznamy, statbloky, tabulky, logo/branding, překlad, VTT balík třetí strany, komerční těžení z IP/známek) vyžaduje PŘEDCHOZÍ PÍSEMNÝ souhlas BlackTower. Proto strop není „blocked" (název smíme užít nominativně a generický kompatibilní nástroj postavit), ale ani „fan-noncommercial" (žádná fan policy neexistuje) — je to přesně „reference-only".

**Licenční základ:**
- **Doložka autorských práv / ochranných známek v BEZPLATNÉ verzi LITE (ukázková pravidla) — hráčská i vypravěčská** — `other` · ✔ primární zdroj · https://www.dracihlidka.cz/wp-content/uploads/2020/12/DH-LITE.pdf
  - „Dračí Hlídka, Hlídka a BlackTower jsou zapsané ochranné známky společnosti BlackTower. Tato pravidla jsou chráněným autorským dílem dle zákona. Jakékoliv zveřejňování, pozměňování či kopírování jejich obsahu nebo jednotlivých částí bez předchozího písemného souhlasu autora je zakázáno. © 2021 BlackTower™ Všechna práva vyhrazena."
  - „© 2021 BlackTower™ Všechna práva vyhrazena. (identická doložka i v DH-LITE-PJ.pdf, vypravěčská verze)"
- **Žádná veřejná otevřená licence (SRD / OGL / ORC / CC / komunitní / fan policy) pro Dračí Hlídku NEEXISTUJE** — `none-found` · ✔ primární zdroj · https://www.dracihlidka.cz/
  - „© 2026 BlackTower™ & Dračí Hlídka™ All Rights Reserved (patička oficiálního webu, aktuální 2026)"
  - „Obchodní podmínky (dracihlidka.cz/obchodni-podminky) NEOBSAHUJÍ žádné ustanovení o autorských právech, licenci k obsahu ani udělení práv kupujícímu — jde jen o spotřebitelskou kupní smlouvu."
  - „Digital platforma (digital.dracihlidka.cz): pouze '© 2026 Black Tower s.r.o.', žádné EULA/otevřená data/API."
- **FAQ — bezplatné výtisky organizacím (nejde o licenci k obsahu, jen omezení přeprodeje)** — `online-policy` · ✔ primární zdroj · https://www.dracihlidka.cz/faq/
  - „Pravidla jsou poskytnuta bezplatně ... Mají sloužit podpoře hraní v dané organizaci. Jako takové je proto nelze přeprodávat dál."
  - „FAQ řeší jen KANÁL pro zaslání vlastního dobrodružství k publikaci PŘÍMO NA JEJICH WEBU ('Se souhlasem autorů jsme část dobrodružství upravili') — není to obecné udělení práv třetím stranám tvořit/šířit odvozený obsah ani nástroje."

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: NE (bez písemného souhlasu). Pravidla jsou 'chráněným autorským dílem dle zákona'; i bezplatná LITE výslovně zakazuje 'zveřejňování, pozměňování či kopírování obsahu nebo jednotlivých částí bez předchozího písemného souhlasu autora'. Nelze reprodukovat text pravidel z LITE ani z placených knih.
- `names_terminology`: Jen NOMINATIVNĚ. 'Dračí Hlídka', 'Hlídka' i 'BlackTower' jsou zapsané ochranné známky — název systému lze použít pouze popisně k označení kompatibility ('podpora pro / kompatibilní s Dračí Hlídka'), NIKDY jako vlastní značku/branding ani způsobem implikujícím oficiálnost. Herní terminologie doslovně převzatá z textu pravidel je autorské dílo → nepřebírat verbatim.
- `spells_abilities_lists`: NE. Seznamy kouzel/schopností = konkrétní výraz z pravidel (chráněný text) → nešířit bez souhlasu. Hodnoty smí do nástroje zadat pouze sám uživatel ze SVÉ zakoupené kopie (BYO obsah).
- `bestiary_statblocks`: NE. Statbloky a popisy bestií = chráněný text → zabudovat/šířit bez písemného souhlasu nelze. Přípustné jen jako uživatelem vložený obsah z jeho vlastní licencované kopie.
- `autofill_calc_sheet`: PODMÍNĚNĚ. Samotná herní MECHANIKA/vzorec (myšlenka, systém pravidel) není autorskoprávně chráněna — kalkulační logiku deníku (např. 'výsledek = 1k10 + oprava za atribut + stupeň dovednosti') lze implementovat. NELZE ale předvyplnit/dodat chráněný obsah (tabulky hodnot, popisy ras/povolání, kouzla, bestie). Bezpečná cesta = PRÁZDNÝ autofill deník + obsah zadává uživatel.
- `commercial`: NE (na jakémkoli obsahu/značkách DH). Komerční těžení z chráněného obsahu nebo ze známek bez smlouvy je vyloučeno. Monetizovat lze jen vlastní generický nástroj bez zabudovaného DH IP.
- `derivatives`: NE. 'pozměňování ... obsahu nebo jednotlivých částí bez předchozího písemného souhlasu autora je zakázáno.' Odvozená díla z textu pravidel nejsou veřejně licencována.
- `vtt_app`: Jen OFICIÁLNÍ cesta. VTT podpora existuje výhradně od BlackTower (Roll20 kompendium + Foundry modul, vlastní digitální platforma Sirael). Třetí strana NESMÍ distribuovat DH obsah jako VTT modul/appku. Vlastní nástroj (Ikaros) musí být bez zabudovaného DH obsahu — jen prázdná kostra + uživatelský/nominativně-kompatibilní vstup.
- `translation`: NE. Překlad = odvozené dílo / 'pozměňování obsahu' → vyžaduje předchozí písemný souhlas autora.
- `logo_use`: NE. Logo i slovní známky ('Dračí Hlídka', 'Hlídka', 'BlackTower') jsou chráněné — nepoužívat jako branding, ve znaku produktu ani způsobem naznačujícím oficiální partnerství/schválení.

**Vyžaduje:**
- Pro JAKÉKOLI užití obsahu pravidel (text, kouzla, schopnosti, bestie, tabulky, překlad, odvozeniny) získat PŘEDCHOZÍ PÍSEMNÝ souhlas autora (BlackTower / Black Tower Entertainment s.r.o.) — bez něj nelze legálně nic z toho šířit.
- Při pouhém odkazu na kompatibilitu použít název striktně nominativně ('podpora pro / kompatibilní s Dračí Hlídka'), bez loga a bez implikace oficiálnosti či partnerství.
- Ochranné známky psát jako cizí a řádně označit (např. 'Dračí Hlídka™ / BlackTower™ jsou ochranné známky společnosti BlackTower') a neregistrovat/nepoužívat kolidující značku.
- Neposkytovat/nepřebalovat bezplatně poskytnuté výtisky (organizacím) k dalšímu přeprodeji.
- Chráněný obsah do nástroje smí vkládat jen sám uživatel ze své zakoupené/licencované kopie; platforma se dodává prázdná (bez DH IP).

**Zakazuje:**
- Zveřejňování, pozměňování či kopírování obsahu pravidel nebo jeho jednotlivých částí bez předchozího písemného souhlasu autora (doslovný zákaz i v bezplatné LITE).
- Šíření/zabudování seznamů kouzel a schopností, statbloků a popisů bestií, tabulek předmětů a hodnot z pravidel (včetně LITE) do vlastního produktu.
- Překlady chráněného obsahu.
- Použití loga a slovních známek 'Dračí Hlídka' / 'Hlídka' / 'BlackTower' jako vlastní značky nebo způsobem implikujícím oficiálnost či schválení.
- Komerční užití obsahu DH nebo jeho známek bez uzavřené licenční smlouvy.
- Distribuce DH obsahu jako VTT modulu/appky třetí strany (oficiální VTT je vyhrazeno BlackTower).
- Přeprodej bezplatně poskytnutých výtisků pravidel.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecně-neutrální deník** — Zcela systémově neutrální karta postavy: volné textové sekce (jméno, příběh, poznámky, inventář jako volný text), obrázek, tagy, vlastní pole. Žádná pole odvozená z DH, žádné předvyplněné hodnoty. 100% původní UI a datový model Ikara.
  - *základ:* Původní autorské dílo Ikara; neobsahuje žádný cizí chráněný obsah ani ochranné známky. Zcela mimo dosah práv BlackTower.
  - *guardraily:* Žádné zmínky DH ani její terminologie v UI · Žádná DH grafika, tokeny ani trade dress
- **[C] (b) Systémově-strukturovaný deník (schéma polí/atributů/pořadí)** — Prázdná kostra deníku uspořádaná podle SYSTÉMU DH — jaká pole/atributy existují, jejich vzájemné vazby a pořadí (blok atributů → dovednosti → boj → zdroje). Popisky polí generické/obecné (Síla, Obratnost, Zdraví, Zranění). Hodnoty prázdné, plní uživatel.
  - *základ:* §2 odst. 6 z. č. 121/2000 Sb. (AutZ): autorské právo nechrání myšlenku, postup, princip, metodu ani systém — jen konkrétní vyjádření. Soustava a pořadí atributů = herní systém (nechráněný). Krátké obecné popisky polí postrádají autorskoprávní individualitu.
  - *guardraily:* Nepřebírat VERBATIM originální DH-ražené termíny (coined terms) jako popisky — u nich vlastní/obecné znění nebo nechat definovat uživatele · Nereprodukovat celé uspořádané tabulky/seznamy z pravidel (výběr+uspořádání může být chráněná kompilace/databáze) · Dodávat STRUKTURU, ne obsah polí
- **[C] (c) Autofill + výpočetní engine (prázdný)** — Kalkulační logika deníku: vzorce a přepočty (např. výsledek testu = 1k10 + oprava za atribut + stupeň dovednosti; odvozené hodnoty jako funkce vstupů). Engine počítá, ale všechny vstupní hodnoty a tabulky zadává uživatel. Dodává se PRÁZDNÝ.
  - *základ:* §2 odst. 6 AutZ — matematický a obdobný vzorec, metoda i postup nejsou chráněny 'samy o sobě'. Herní mechanika = nechráněná myšlenka; výpočetní logiku lze implementovat vlastními slovy/kódem.
  - *guardraily:* NEPŘEDVYPLŇOVAT chráněný obsah (tabulky hodnot, popisy ras/povolání, ceníky, XP prahy z pravidel) · Bezpečná cesta = prázdný autofill, hodnoty vkládá uživatel ze své kopie · Nedodávat kurátorské tabulky DH jako součást enginu
- **[C] (d) Katalogy kouzel/schopností/předmětů — POUZE prázdná struktura + BYO** — Prázdné datové struktury a formuláře pro kouzla/schopnosti/předměty (pole: název, dosah, účinek, cena, poznámka). Konkrétní obsah vkládá výhradně uživatel ze své zakoupené kopie. Ikaros NEDODÁVÁ žádný seznam ani popisy.
  - *základ:* Struktura formuláře = nechráněný systém (§2/6 AutZ). Konkrétní seznamy kouzel/schopností + jejich popisy = chráněné vyjádření a chráněný výběr/uspořádání → nelze dodat ani šířit. Model BYO-content: zdrojem obsahu je uživatel.
  - *guardraily:* Nikdy nedodávat/nezabudovat konkrétní kouzla/schopnosti/předměty z DH (ani z LITE) · Uživatelem vložený DH obsah držet SOUKROMÝ pro jeho účet/svět — nesdílet mezi uživateli (jinak = distribuce) · Žádný veřejný katalog, výkladní skříň ani tržiště DH obsahu
- **[C] (e) Bestiář / statbloky — POUZE prázdná struktura + BYO** — Prázdné schéma statbloku (pole: název, hodnoty vlastností, útoky, obrana, poznámky) a UI bestiáře. Konkrétní bestie, jejich hodnoty i popisy vkládá uživatel ze své kopie. Ikaros nedodává žádné statbloky ani ilustrace.
  - *základ:* Schéma = nechráněný systém (§2/6 AutZ). Statblok jako autorsky sestavený celek + popisné texty = chráněné vyjádření → nedodávat. BYO-content.
  - *guardraily:* Nedodávat žádné statbloky ani popisy bestií z DH · Uživatelský obsah soukromý, nepoužít platformu jako distribuční kanál · Žádné DH ilustrace/tokeny bestií
- **[C] (f) Taháky pravidel — jen vlastními slovy popsaná generická mechanika + prázdný uživatelský tahák** — Volitelně vlastními slovy formulované, obecné vysvětlení NECHRÁNĚNÝCH mechanik (např. 'test dovednosti = hod k10 + opravy, porovnej s obtížností'). Plus prázdný uživatelský tahák, kam si výcuc ze své kopie zapíše sám uživatel. ŽÁDNÝ verbatim text pravidel.
  - *základ:* Mechanika/postup = nechráněná myšlenka (§2/6 AutZ). Vlastní nezávislý popis mechaniky = naše původní vyjádření. Chráněn je jen konkrétní TEXT, tabulky, příklady a uspořádání pravidel.
  - *guardraily:* ŽÁDNÝ doslovný text pravidel ani parafráze kopírující strukturu/wording/příklady · Nekopírovat výběr a uspořádání kapitol (hrozí odvozené dílo) · Nepřebírat tabulky · DH-specifické detailní postupy raději nechat jako uživatelský (BYO) tahák · Bez DH-ražené terminologie ve větším rozsahu
- **[C] (g) Taktická mapa + tokeny (generická)** — Plnohodnotná generická VTT vrstva: mřížka, tokeny, fog of war, LoS, iniciativa, měření. Systémově neutrální, funguje s jakýmkoli systémem. Uživatel si nahrává vlastní mapy a tokeny.
  - *základ:* Původní generický nástroj Ikara; neobsahuje žádný DH obsah ani známky. VTT funkce jsou obecná technologie, ne DH IP.
  - *guardraily:* Nedodávat DH mapy, tokeny, ilustrace ani artwork · Nepozicovat jako 'DH VTT modul' (oficiální VTT je vyhrazen BlackTower) — je to generický nástroj · Nahrané DH materiály jsou uživatelský obsah, soukromý
- **[C] (h) Veřejná landing/SEO stránka + wording (nominativní kompatibilita)** — Veřejná stránka smí uvádět kompatibilitu ryze popisně: 'podpora pro Dračí Hlídka', 'kompatibilní s Dračí Hlídka'. SEO klíčová slova textově. Vždy s disclaimerem a ™ atribucí.
  - *základ:* Nominativní (popisné) užití ochranné známky k označení kompatibility — přípustné, pokud nevzniká záměna o původu ani dojem oficiálnosti/schválení a použije se jen v nezbytném rozsahu.
  - *guardraily:* ŽÁDNÉ logo ani trade dress DH/BlackTower · Neimplikovat oficiálnost, partnerství ani schválení · Známky psát jako cizí + ™ a větu o vlastnictví BlackTower · Nepoužít DH jako vlastní značku/název produktu ani v doméně · Užít jen slovní známku textově, minimálně nutně
- **[C] (i) Import/export (BYO data uživatele)** — Nástroj umožní uživateli IMPORTOVAT vlastní obsah (z jeho kopie) do prázdných struktur a EXPORTOVAT jeho vlastní zadaná data (JSON/PDF). Formát i nástroj jsou Ikara.
  - *základ:* Nástroj/formát = původní dílo Ikara. Import/export vlastního obsahu uživatele = nakládání uživatele s jeho daty; Ikaros nedodává ani nešíří DH obsah.
  - *guardraily:* Nedodávat žádné DH content-balíčky k importu · Neumožnit uživatel↔uživatel sdílení/publikaci DH-odvozeného obsahu jako veřejný katalog (= distribuce) · BYO obsah držet soukromý pro účet/svět · Export jen vlastních dat uživatele
- **[C] (j) AI generátor kompatibilního obsahu (originální výstup)** — Generátor tvoří NOVÝ, ORIGINÁLNÍ obsah (NPC, předměty, potvory) na nechráněné mechanické kostře 'kompatibilní s DH' — vlastní jména, vlastní popisy, vlastní hodnoty. Negeneruje ani nereprodukuje konkrétní DH kouzla/bestie/texty.
  - *základ:* Mechanická kostra = nechráněný systém (§2/6 AutZ). Nově vytvořený originální obsah = vlastní dílo, ne reprodukce DH — za předpokladu, že model DH chráněný text nepožírá ani nevydává.
  - *guardraily:* Model NESMÍ být krmen chráněným DH textem ani ho vydávat · Filtrovat výstup, aby nereprodukoval DH jména/popisy/statbloky · Výstup značit jako neoficiální a originální · Nezakládat generátor na DH tabulkách/seznamech · Pozor na vyvíjející se právo AI — proto konzervativně

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek právně obhajitelný a vhodně konzervativní: strop 'reference-only' je správný a dobře podložený — nezávisle ověřeno, že Dračí Hlídka nemá ŽÁDNOU veřejnou otevřenou licenci (žádný SRD/OGL/ORC/CC ani fan policy), web nese '© 2026 BlackTower™ & Dračí Hlídka™ All Rights Reserved' a publikace komunitního obsahu jde jen přes individuální dohodu. Model generický engine + nominativní zmínka kompatibility + BYO-private je legálně nejlepší dostupná cesta a avoid-list je věcně správný. NUTNÉ OPRAVY před komerčním nasazením: (1) Zohlednit klíčové zjištění, které návrh přehlíží — BlackTower provozuje VLASTNÍ oficiální digitální produkty přímo konkurující Ikaru (platforma Sirael web+DB, oficiální iOS/Android aplikace s deníkem/hody/kouzly, oficiální deník na Roll20). To zvyšuje riziko záměny/dojmu schválení a otevírá NEZÁVISLOU nekalosoutěžní rovinu (§2976 an. obč. zák.), kterou návrh vůbec neřeší; confidence u (h) a positioning (g) jsou proto mírně optimistické — přidat silné anti-confusion guardraily a nezacilovat SEO na názvy oficiálních produktů. (2) Doplnit u BYO features notice-and-takedown a zákaz navádění ke kopírování (hostingová výjimka). (3) Doslovnou doložku LITE buď ověřit z kopie, nebo kotvit strop na potvrzeném 'All Rights Reserved'. Žádný nález netvrdí, že by cokoliv 'blokovaného' mělo být povoleno — korekce jdou směrem k VĚTŠÍ opatrnosti, ne k rozšíření stropu.
- **[uncertain]** LITE 'VÝSLOVNĚ zakazuje zveřejňování, pozměňování či kopírování obsahu (i jednotlivých částí) bez předchozího písemného souhlasu autora.'
  - → Buď doslovný text LITE fyzicky ověřit z legálně stažené kopie, nebo přeformulovat na 'LITE nese výhradu všech práv a neuděluje žádná práva' bez uvozovek okolo nepotvrzené formulace.
- **[needs-guardrail]** (g) Generická taktická mapa/VTT + (h) nominativní 'kompatibilní s Dračí Hlídka' na SEO/landing jsou komerčně bezpečné (h confidence 0.85).
  - → Přidat guardrail: (1) explicitní, opakovaný disclaimer 'neoficiální / bez vztahu k Sirael a oficiálním aplikacím DH'; (2) nepozicovat jako náhradu/ekvivalent oficiálních appek; (3) snížit confidence (h) na ~0.7; (4) zvážit právní posudek k nekalé soutěži před komerčním spuštěním.
- **[needs-guardrail]** (h) 'SEO klíčová slova textově' a užití slovní známky 'v nezbytném rozsahu' jsou v pořádku.
  - → Guardrail: NEcílit SEO/klíčová slova na názvy oficiálních produktů ('Sirael', název oficiální appky) ani na fráze implikující 'oficiální/THE Dračí Hlídka aplikace'; omezit na čistě popisné 'kompatibilní s'.
- **[needs-guardrail]** (d)(e)(i) BYO obsah držený soukromě pro účet je komerčně bezpečný (confidence 0.8).
  - → Přidat: (1) mechanismus notice-and-takedown a reakci na oznámení; (2) NEnavádět/neusnadňovat hromadné kopírování chráněného obsahu (žádné 'importuj celá pravidla'); (3) obsah výhradně user-initiated a soukromý; (4) ToS přenášející odpovědnost na uživatele + zákaz nahrávat obsah bez práv.

**Avoid:**
- Dodat, zabudovat nebo šířit text pravidel DH (byť jednotlivé části) — včetně bezplatné verze LITE; vše je 'chráněné autorské dílo' s výhradou všech práv.
- Šířit seznamy kouzel a schopností, statbloky a popisy bestií, tabulky předmětů/hodnot/ceníků z pravidel jako součást produktu.
- Předvyplňovat autofill deníku chráněnými DH daty (tabulky, popisy ras/povolání, kouzla, bestie) — dodávat jen prázdnou kostru.
- Použít logo nebo slovní známky 'Dračí Hlídka' / 'Hlídka' / 'BlackTower' jako vlastní značku, v názvu produktu, doméně nebo způsobem implikujícím oficiálnost/schválení/partnerství.
- Vytvářet překlady chráněného obsahu DH (= odvozené dílo).
- Vyrábět odvozená díla z textu pravidel (parafráze kopírující wording/strukturu/příklady/uspořádání kapitol).
- Distribuovat DH obsah jako VTT modul/appku třetí strany — oficiální VTT je vyhrazeno BlackTower.
- Komerčně těžit z jakéhokoli obsahu DH nebo z jejích ochranných známek bez uzavřené licenční smlouvy.
- Provozovat veřejný katalog / výkladní skříň / sdílení scén, kde by uživatelé mezi sebou šířili DH-odvozený obsah — platforma by se stala distribučním kanálem; BYO obsah držet soukromý.
- Přeprodávat nebo přebalovat bezplatně poskytnuté výtisky pravidel.
- Trénovat AI generátor na chráněném DH textu nebo nechat ho reprodukovat konkrétní DH jména/popisy/statbloky.
- Spoléhat na 'LITE zdarma' jako na licenci — je to jen bezplatný vzorek s výhradou všech práv, ne otevřené udělení práv.

**Návrh disclaimeru:**
> Projekt Ikaros není oficiální produkt a není nijak spojen, sponzorován ani schválen společností BlackTower (Black Tower Entertainment s.r.o.) ani autory hry Dračí Hlídka. Názvy „Dračí Hlídka", „Hlídka" a „BlackTower" jsou ochranné známky společnosti BlackTower™ a jsou zde použity výhradně popisně k označení kompatibility. Platforma neobsahuje a nešíří žádná pravidla, texty, kouzla, schopnosti, bestie ani tabulky ze hry Dračí Hlídka; veškerý takový obsah si do nástroje vkládá výhradně sám uživatel ze své vlastní legálně pořízené kopie a zůstává soukromý pro jeho účet.

**Návrh atribuce:**
> Dračí Hlídka™, Hlídka™ a BlackTower™ jsou ochranné známky společnosti BlackTower (Black Tower Entertainment s.r.o.). Projekt Ikaros s touto společností není nijak propojen a není jí schválen. Použití názvu je čistě popisné (nominativní) k označení kompatibility nástroje.

**Poznámky rešerše:** ZÁVĚR: Dračí Hlídka je UZAVŘENÝ (proprietární) systém. VEŘEJNÁ OTEVŘENÁ LICENCE (SRD/OGL/ORC/Creative Commons/komunitní/fan policy) NEEXISTUJE na žádné vrstvě — potvrzeno primárně: (a) i bezplatná verze LITE výslovně zakazuje zveřejňování/pozměňování/kopírování obsahu bez předchozího písemného souhlasu; (b) obchodní podmínky ani digitální platforma neobsahují žádné udělení práv; (c) web aktuálně (2026) uvádí 'All Rights Reserved'. 'LITE zdarma' = pouze bezplatný vzorek s výhradou všech práv, NE otevřená licence.

CO LZE POSTAVIT TEĎ BEZ SMLOUVY A BEZ PRÁVNÍKA (maximum, konzervativně):
1) Systémově NEUTRÁLNÍ nástroj (prázdný deník + kalkulační logika + taktická mapa + chat + bestiář/kouzla jako PRÁZDNÉ struktury). Herní mechaniky a vzorce jsou myšlenka/systém — autorské právo je nechrání (chráněn je jen konkrétní TEXT/výraz), takže výpočetní logiku deníku lze implementovat.
2) 'Kompatibilita' řešena NOMINATIVNĚ ('podpora pro Dračí Hlídka'), bez loga, bez implikace oficiálnosti.
3) Model BYO-CONTENT: chráněná data (kouzla, schopnosti, bestie, tabulky) zadává výhradně uživatel ze své zakoupené kopie; platforma se dodává bez DH IP.
CO NELZE: dodat/šířit text pravidel, seznamy kouzel/schopností, statbloky bestií, tabulky, překlady; použít logo/značky jako branding; komerčně těžit z DH obsahu; přebalit DH do VTT/appky. Vše výše vyžaduje předchozí PÍSEMNÝ souhlas BlackTower.

ENGINE-LEVEL OTEVŘENÁ CESTA: pro Dračí Hlídku NEEXISTUJE — jde o původní český systém (duchovní nástupce Dračího doupěte, inspirovaný D&D), NEpostavený na žádném SRD/OGL. Otevřené licence na úrovni enginu (D&D 5.1 SRD pod CC-BY-4.0, ORC License, Chaosium BRP) umožňují stavět GENERICKÝ / D&D-kompatibilní obsah, NIKOLIV reprodukovat Dračí Hlídku. Ani předchůdce Dračí doupě (Altar/Mytago) nemá otevřenou licenci.

OMEZENÍ REŠERŠE: Konkrétní registrační čísla ochranných známek v rejstříku ÚPV se nepodařilo strojově ověřit (databáze ÚPV je JS aplikace; Patentoid nález nevrátil). Registraci ('zapsané ochranné známky') však deklaruje sám držitel v primárních zdrojích datovaných 2021 (LITE PDF) i 2026 (web) — deklarace je tedy aktuální; pro jistotu doporučeno ověřit zápis přímo v rejstříku ÚPV před jakýmkoli užitím názvu. Text doložky z LITE PDF byl extrahován přes pdftotext, diakritika rekonstruována (font měl neúplnou ToUnicode mapu); znění je standardní česká právní formulace a odpovídá i patičce webu.

---

### GURPS (Generic Universal RolePlaying System) — Steve Jackson Games  `gurps`

**Strop:** `reference-only`

> GURPS je plně uzavřený systém — žádné SRD/OGL/ORC/CC. Jediná veřejná povolení (SJ Games Online Policy + GURPS FAQ) jsou výslovně NEKOMERČNÍ, kdykoli odvolatelná bez upozornění a FAQ 2.18 řadí VTT/online hru mezi „computer game", který bez formální licence NELZE. Pro komerčně zamýšlenou platformu proto použitelný strop kolabuje na dvě věci: (1) systémově NEUTRÁLNÍ nástroje, kam si terminologii/obsah/vzorce doplní sám uživatel (mechanika = neochranitelná myšlenka/postup dle §2 AutZ, analogicky §65/2), a (2) čistě POPISNÉ (nominativní) pojmenování „GURPS" s disclaimerem, bez loga a trade dress. NESMÍME přebírat chráněný výraz — pravidlový text, tabulky, formuláře, kurátorované seznamy kouzel/výhod/dovedností/předmětů ani publikované statbloky — a nesmíme brandovat „GURPS" jako inzerovanou podporovanou/placenou funkci. Fan-nekomerční vrstva (uživatelovy vlastní originální statbloky/scénáře s terminologií, PC character-generator) sice právně existuje, ale monetizované platformě jako provozovateli nepomáhá a rešerše doporučuje nezabudovávat terminologii. Bohatší podpora = licence od SJ Games (Director of Licensing / Powered by GURPS). Finálně schválí právník.

**Licenční základ:**
- **Steve Jackson Games Online Policy (Fan Pages, Fan Fiction, and Free Game Aids)** — `online-policy` · ✔ primární zdroj · https://www.sjgames.com/general/online_policy.html
  - „Copyrighted text (like game rules and vignette text) may not be used without special permission of Steve Jackson Games. To get this permission, write to the Director of Licensing."
  - „Post (or make available for download) forms, charts, tables and text from one of your games? No; that is a violation of copyright. ... eventually the whole text would be online, for free, and we couldn't sell any books."
  - „Character stats, and original background and scenario material using our rules terminology, are a permitted use, as long as you're not selling it in any way."
  - „Create a character generator or other game aid? If you mean a "game aid" or "player aid" program, yes, you certainly can, if it's for a PC-type computer and you include the appropriate notices. We currently do not allow "apps" for mobile devices to be created using our content or trademarks."
  - „Anything more than a character creation game aid is a problem, because at that point it's not just like a game in your living room; it's more like a "computer game.""
  - „Create my own MUD, MUSH or computer game based on a SJ Games property? In general, no. These conflict with our licensing program."
  - „If you want to charge money for a game aid based on our work, the Online Policy does NOT apply . . . you must either get a license from us, or sell us the game aid for distribution as a regular product, and either way we'll hold you to professional standards."
  - „The material presented here is my original creation, intended for use with the GURPS system from Steve Jackson Games. This material is not official and is not endorsed by Steve Jackson Games."
  - „[GAME NAME] is a trademark of Steve Jackson Games, and its rules and art are copyrighted by Steve Jackson Games. All rights are reserved by Steve Jackson Games. This game aid is the original creation of [YOUR NAME] and is released for free distribution, and not for resale, under the permissions granted in the Steve Jackson Games Online Policy."
  - „the first use of a product logo on any webpage or PDF'd game aid (and, preferably, all uses) must link back to our official page for that product, and any use of our company logo must link back to our home page."
  - „This permission does NOT extend to copying our trade dress. In general, if you make your material look like a SJ Games product, it's over the line."
  - „Our eye-in-the-pyramid logo, in its various forms, and the image of the Ogre are registered trademarks. (Our staff and official volunteers can use these images as avatars ... but we ask that others not do so.)"
  - „This policy, the permissions it gives, and any similar permissions given under other circumstances, are subject to change or withdrawal at any time without notice."
- **GURPS FAQ — Section 2 (Steve Jackson Games and GURPS), esp. Q2.18 / Q2.15 / Q2.16** — `other` · ✔ primární zdroj · https://www.sjgames.com/gurps/faq/FAQ4-2.html
  - „Can I use GURPS rules to build a computer game, online game, MOO/MUSH/MUCK/MUD/etc.? No . . . it's not legal to take the GURPS rules and base a game on them without formal permission. SJ Games is open to licensing inquiries from professional developers ... but, to preserve system integrity and protect the possibility of a professional computer implementation, the company does not grant permission for "homebrew" games or M*s to use the GURPS name and rules."
  - „GURPS Lite is a slimmed-down, 32-page version of GURPS. ... It is available for both Third and Fourth Edition, as free e23 downloads in PDF format."
  - „What does Powered By GURPS mean? A description can be found here."
- **GURPS Lite — copyright/distribution notice (official free 32-page introductory rules)** — `other` · ✔ primární zdroj · https://www.sjgames.com/gurps/lite/
  - „GURPS LITE is copyright © 1998, 1999, 2000, 2001, 2003 by Steve Jackson Games Incorporated. It is intended for free distribution. You are encouraged to copy and share these 32 pages freely. You may not charge for it, except to cover the actual cost of copying. You may not remove any part of it. You may not change or modify it, except that retailers, distributors or conventions may add "Courtesy of (name)" at the top of this page. You absolutely may not incorporate this game, or parts of it, into another product for distribution in any way."
  - „You may distribute this PDF file freely under the above restrictions, and post copies of it online. You may not sell it or include it as part of any product for sale without the written permission of Steve Jackson Games Incorporated."
- **Powered by GURPS (PBG) — professional/negotiated publishing license program** — `other` · ✔ primární zdroj · https://www.sjgames.com/poweredbygurps/
  - „What does "Powered by GURPS" mean? ... The only thing we can say for sure about all the PBG books is that they're compatible with GURPS."
  - „Some PBG books are released by companies other than SJ Games!"
  - „SJ Games is open to licensing inquiries from professional developers – contact [the Director of Licensing]"
- **No open/SRD path for GURPS (no SRD, no OGL, no ORC, no Creative Commons)** — `none-found` · ✔ primární zdroj · https://www.sjgames.com/general/online_policy.html
  - „GURPS nemá žádný System Reference Document ani otevřenou licenci. SJ Games nikdy nevydalo GURPS pod OGL/ORC/CC. Jediná veřejná povolení jsou nekomerční Online Policy + FAQ; cokoli nad jejich rámec vyžaduje 'formal permission' / 'special permission of Steve Jackson Games' (Director of Licensing)."
  - „it's not legal to take the GURPS rules and base a game on them without formal permission"

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: NE (bez smlouvy). Pravidlový text je chráněný a nelze reprodukovat: 'Copyrighted text (like game rules ...) may not be used without special permission'; 'forms, charts, tables and text from one of your games? No; that is a violation of copyright.'
- `names_terminology`: OMEZENĚ. Nominativní/referenční užití terminologie a slovní značky je povoleno JEN nekomerčně, s označením (TM)/(R), odkazem zpět na sjgames.com a disclaimerem ('original background and scenario material using our rules terminology, are a permitted use, as long as you're not selling it in any way'). Komerční platforma s brandingem 'podpora GURPS' jde nad rámec policy.
- `spells_abilities_lists`: NE. Publikované seznamy kouzel / výhod / nevýhod / dovedností jsou chráněný text a tabulky ('tables and text ... No'). Reprodukce zakázána. Uživatel smí vytvořit VLASTNÍ originální položky s použitím terminologie, ale jen nekomerčně.
- `bestiary_statblocks`: OMEZENĚ. Uživatelem vytvořené ORIGINÁLNÍ statbloky s terminologií jsou povolené nekomerčně ('Character stats ... using our rules terminology, are a permitted use, as long as you're not selling it'). Reprodukce publikovaných bestií/statbloků z knih = chráněný text → NE. Komerčně NE.
- `autofill_calc_sheet`: OMEZENĚ, pro Projekt Ikaros prakticky NE. Online Policy povoluje NEKOMERČNÍ 'character generator / game aid' program, ale JEN pro PC (výslovný zákaz mobilních 'apps') a 'nic víc než tvorba postavy'; jakmile aid dělá víc, 'it's more like a computer game' → mimo policy. Autofill+výpočetní deník zasazený do online all-in-one VTT platformy (a s budoucí monetizací) tuto hranici překračuje.
- `commercial`: NE (bez smlouvy). 'If you want to charge money for a game aid based on our work, the Online Policy does NOT apply ... you must either get a license from us, or sell us the game aid.' Veškerá komerce vyžaduje formální licenci (Director of Licensing / Powered by GURPS).
- `derivatives`: OMEZENĚ. Originální rozšíření herní linie, scénáře a fan-fikce s terminologií jsou povolené nekomerčně; 'restatement of the copyrighted rules' NE. Nesmí imitovat trade dress ani vypadat jako oficiální produkt.
- `vtt_app`: NE (bez smlouvy). FAQ 2.18: 'Can I use GURPS rules to build a computer game, online game ...? No ... not legal ... without formal permission.' Online Policy: MUD/MUSH/computer game 'In general, no'; mobilní apps s obsahem/značkami GURPS zakázány; tool nad rámec tvorby postavy = 'computer game'. VTT/herní stůl přesně sem spadá.
- `translation`: NE (bez svolení). Překlad pravidel = odvozenina chráněného textu, vyžaduje svolení. SJ Games řídí VLASTNÍ dobrovolnický překlad GURPS Lite, nedává právo třetím stranám překládat pravidla do aplikací.
- `logo_use`: OMEZENĚ. Slovní značku 'GURPS' lze užít referenčně za podmínek (bold/italic, (TM)/(R), odkaz zpět, disclaimer, NEKOMERČNĚ, bez imitace trade dress). Registrované logo Eye-in-the-Pyramid a obraz Ogre NELZE užívat. Logo na merch/produkty NE. Komerční platforma = mimo policy.

**Vyžaduje:**
- Označit ochranné známky symbolem (TM)/(R) a první výskyt zvýraznit (bold/italic/barva).
- První užití produktového loga (nejlépe každé) musí odkazovat zpět na oficiální stránku daného produktu na sjgames.com; užití firemního loga → odkaz na homepage SJ Games.
- Uvést disclaimer, že materiál je původní tvorba pro GURPS a 'is not official and is not endorsed by Steve Jackson Games', včetně vložených odkazů na sjgames.com.
- Uvést notice o vlastnictví ochranných známek a copyrightu SJ Games + odkaz na Online Policy.
- U jakéhokoli 'game aid' vložit předepsaný text: '... released for free distribution, and not for resale, under the permissions granted in the Steve Jackson Games Online Policy.'
- Materiál musí být ZDARMA a nekomerční (jinak Online Policy neplatí a je nutná licence).
- Neimitovat trade dress (3e 'frame' / 4e 'puzzle piece'); nic nesmí vzbuzovat dojem oficiálního SJ Games produktu.
- Počítat s tím, že povolení je kdykoli odvolatelné bez upozornění ('subject to change or withdrawal at any time without notice').

**Zakazuje:**
- Reprodukce pravidlového textu, vignette textu, formulářů, tabulek a grafů z knih GURPS (porušení copyrightu).
- Reprodukce publikovaných seznamů kouzel / výhod / nevýhod / dovedností a statbloků bestií z knih.
- Jakékoli komerční užití pod Online Policy — vyžaduje formální licenci (Director of Licensing) nebo prodej díla SJ Games.
- Mobilní aplikace využívající obsah nebo ochranné známky GURPS ('We currently do not allow "apps" for mobile devices').
- Online hry / computer games / VTT nad rámec pouhé tvorby postavy / MUD/MUSH/MUCK/MUD ('it's more like a computer game'; FAQ 2.18 'No ... not legal ... without formal permission').
- Imitace trade dress a užití registrovaných log (Eye-in-the-Pyramid, Ogre).
- Incorporace GURPS Lite nebo jeho částí do jiného produktu, jeho úprava, prodej či zahrnutí do díla na prodej ('You absolutely may not incorporate this game, or parts of it, into another product for distribution in any way').
- Reprint out-of-print produktů.
- Překlad pravidel bez svolení SJ Games.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Systémově-neutrální deník / volné plátno** — Prázdný free-form deník a plátno (rich-text + volné bloky), kam si hráč/PJ zapíše libovolné hodnoty a poznámky. Žádná zabudovaná GURPS terminologie, žádná předvyplněná pole, žádné pravidlo. Platforma dodává jen editor a plátno; obsah = 100 % vstup uživatele.
  - *základ:* Nástroj neobsahuje žádný chráněný výraz SJ Games. Autorské právo (§2 AutZ) chrání ztvárnění, ne prázdný formulář ani uživatelův vlastní vstup. Nezávisí na Online Policy, protože se GURPS vůbec nedotýká.
  - *guardraily:* Žádný předvyplněný GURPS obsah · Žádná zmínka/logo GURPS v samotném nástroji · Uživatelův obsah je jeho odpovědnost
- **[C] (b) Uživatelsky definovatelný strukturovaný list (builder polí/atributů/pořadí)** — Generický builder listu postavy: PJ/uživatel si sám vytvoří pole, atributy, sekce a jejich pořadí (např. si sám pojmenuje ST/DX/IQ/HT, deriváty, body). Platforma dodá prázdnou kostru a typy polí (číslo/text/výběr), NE hotový GURPS list. Rekonstrukci systému provádí uživatel.
  - *základ:* Struktura/skladba mechaniky (že systém má 4 atributy a point-buy) je neochranitelná myšlenka/postup/princip — §2 AutZ chrání výraz, ne metodu (analogicky §65/2 u SW; US idea/expression + merger/funkcionalita). Terminologii navíc dodává uživatel, takže platforma nešíří žádný chráněný text.
  - *guardraily:* Nedodávat hotový 'GURPS list' jako produkt platformy · Nereprodukovat oficiální rozložení listu (trade dress: 3e rám / 4e puzzle) · Nebrandovat feature jako 'GURPS'; jinak commercialSafe padá · Labely obecné nebo zadané uživatelem
- **[C] (c) Autofill + výpočty (prázdný vzorcový engine)** — Obecný výpočetní engine: pole X = funkce polí A,B (např. uživatel nastaví 'HP = ST'). Platforma dodá kalkulátor a odvozená pole; vzorce/presety si zadá uživatel nebo komunita (nekomerčně, na vlastní odpovědnost). Deník pak počítá automaticky.
  - *základ:* Matematické vztahy/vzorce a metoda výpočtu jsou neochranitelné (§2 AutZ výslovně nechrání objevený vzorec ani postup/princip). Engine je 'prázdný' — žádný převzatý text ani kurátorovaný set. Kdo zadá vzorce, ten za výběr odpovídá.
  - *guardraily:* Platforma NEdistribuuje předpřipravený 'GURPS preset' vzorců/polí v komerčním režimu · Presety jsou uživatelský/komunitní obsah (nekomerční fan užití) · Žádný převzatý tabulkový/textový doprovod z knih · Bez GURPS brandingu enginu
- **[C] (d) Katalogy kouzel/schopností/předmětů — PRÁZDNÉ, uživatelsky plnitelné** — Znovupoužití vzoru herbář/lektvary/kouzla/předměty: prázdný katalog, do kterého uživatel vkládá VLASTNÍ originální položky. Platforma nedodává žádný seznam z knih GURPS.
  - *základ:* Nástroj = prázdná databáze (neochranitelná struktura + user content). Publikované seznamy kouzel/výhod/nevýhod/dovedností/předmětů jsou chráněný výraz (tables and text → NE) a NEreprodukují se. Uživatelovy vlastní originální položky s terminologií jsou dle Online Policy povolené jen nekomerčně (jeho odpovědnost).
  - *guardraily:* NEimportovat/nebundlovat oficiální GURPS seznamy · Žádný 'oficiální data pack' · Uživatelský obsah označit jako neoficiální, na odpovědnost autora · Prázdný katalog bez GURPS brandingu
- **[C] (e) Bestiář / statbloky — PRÁZDNÝ nástroj, uživatel tvoří vlastní** — Generický bestiář: uživatel vytváří VLASTNÍ originální statbloky. Platforma nedodává žádnou bestii z knih. Struktura statbloku (pole) je uživatelsky/šablonově definovaná (viz b).
  - *základ:* Nástroj neobsahuje chráněný obsah. Uživatelem vytvořené originální 'character stats using rules terminology' jsou dle Online Policy povolené — ale výslovně JEN nekomerčně ('as long as you're not selling it'). Reprodukce publikovaných statbloků z knih = chráněný text → NE.
  - *guardraily:* NEreprodukovat publikované bestie/statbloky z knih · Uživatelské GURPS statbloky = nekomerční fan obsah, odpovědnost autora · Platforma je nesmí komerčně prodávat/zpřístupňovat jako GURPS obsah · Bez GURPS brandingu nástroje
- **[C] (f) Taháky pravidel — jen uživatelské poznámky + odkaz ven** — Plocha na VLASTNÍ poznámky/taháky uživatele (jeho slova) + externí odkaz na oficiální free zdroje (GURPS Lite na sjgames.com). Platforma NEhostuje ani nereprodukuje pravidlový text/tabulky.
  - *základ:* Vlastní poznámky uživatele = user content. Popis mechaniky VLASTNÍMI SLOVY je přípustný (myšlenka/postup nechráněn, §2 AutZ), ale reprodukce pravidlového textu, tabulek a formulářů z knih = porušení copyrightu → NE. GURPS Lite lze jen ODKAZOVAT, ne inkorporovat/upravovat/hostovat ('You absolutely may not incorporate ... into another product').
  - *guardraily:* NEreprodukovat text/tabulky/grafy/formuláře z knih · GURPS Lite jen link ven, nikdy hosting/kopie/úprava · Platforma nedodává vlastní 'GURPS cheat sheet' jako obsah · Vlastní slova ≠ parafráze převzaté struktury tabulky
- **[C] (g) Taktická mapa + tokeny (systémově neutrální VTT vrstva)** — Mřížka, tokeny, fog/LoS, iniciativa, měření — vše jako obecná VTT mechanika nezávislá na GURPS. Žádná GURPS pravidla/tabulky/art zabudované.
  - *základ:* Grid, tokeny, LoS, iniciativa jsou obecné herní/softwarové mechaniky (neochranitelná myšlenka/postup). Platforma nedodává žádný chráněný GURPS výraz. Nezávisí na Online Policy.
  - *guardraily:* Žádné GURPS-brandované tokeny/art · Nereprodukovat mapy/bojové tabulky z knih · Pravidla boje si řídí uživatel (viz c) · Bez loga/trade dress
- **[·] (h) Veřejná / SEO stránka — POPISNÁ (nominativní) zmínka GURPS** — Landing s neutrálním wordingem ('přines si vlastní systém / kompatibilní s vlastními pravidly'). Název 'GURPS' JEN nominativně/popisně, s disclaimerem, bez loga a trade dress. Komerčně-bezpečná verze název GURPS neuvádí vůbec — pak je to čistě neutrální stránka platformy.
  - *základ:* Nominativní/popisné užití ochranné známky pro pravdivé označení kompatibility je v zásadě přípustné (nominative fair use / popisné užití). ALE: Online Policy je nekomerční a inzerovaná 'podpora GURPS' na monetizované platformě přesahuje povolené nominativní/nekomerční užití značky; SJ Games je vůči tomu nepřátelské. Proto komerčně bezpečné je pouze úplné vypuštění názvu; jakákoli zmínka GURPS = jen popisná, s disclaimerem a se souhlasem právníka.
  - *guardraily:* Nikdy logo Eye-in-the-Pyramid ani obraz Ogre · Neimitovat trade dress, nevzbuzovat dojem oficiálního/schváleného produktu · (TM)/(R) + disclaimer + odkaz zpět na sjgames.com · Nepoužívat 'GURPS' jako marketingový claim/název placené funkce · Nominativní zmínku před ostrým nasazením posoudí právník
- **[C] (i) Import / export vlastních dat uživatele** — Export a import TOHO, co si uživatel sám vytvořil (deník/položky), v neutrálním formátu (JSON / PDF vlastního obsahu). Přenositelnost dat mezi světy/účty.
  - *základ:* Předmětem přenosu jsou uživatelova vlastní data; formát/serializace je funkční mechanika (neochranitelná). Žádný chráněný výraz SJ Games.
  - *guardraily:* NEbundlovat/neimportovat oficiální GURPS datové soubory ani chráněný obsah · Žádný 'oficiální GURPS data pack' · Export nesmí vkládat převzatý text/tabulky · Bez GURPS brandingu
- **[C] (j) AI generátor — jen NEUTRÁLNÍ flavour, bez statů a bez brandingu** — Generátor popisného/atmosférického obsahu (jména, popisy, zápletky, prostředí) BEZ herních statů vázaných na GURPS a BEZ značky 'GURPS'. Systémově neutrální kreativní pomůcka.
  - *základ:* Generovaný popisný obsah nevázaný na chráněná pravidla ani značku není odvozeninou GURPS. Naopak generátor 'GURPS-kompatibilního' obsahu = dvojité riziko (odvozenina chráněných pravidel + užití ochranné známky + riziko reprodukce chráněného textu z tréninku) → mimo rozsah.
  - *guardraily:* Negenerovat GURPS herní staty/pravidla ani je neoznačovat jako 'GURPS' · Žádná značka/logo GURPS ve výstupu ani UI generátoru · Nepromptovat model na reprodukci pravidlového textu/tabulek/seznamů · Výstup je kreativní flavour, ne pravidlový obsah

**Adversariální kontrola (verify):**
- *net:* Návrh je nadprůměrně konzervativní a jeho faktická tvrzení o policy jsem u zdrojů POTVRDIL: Online Policy je nekomerční ('as long as you're not selling it in any way'), kdykoli odvolatelná bez upozornění; zpoplatnění ruší její platnost ('the Online Policy does not apply'); mobilní apps nepovoleny (jen PC aids); online/computer game bez profesionální licence NE; GURPS Lite 'absolutely may not incorporate... into another product'; trade dress (3e rám / 4e puzzle) zakázán. Strop reference-only + systémově-neutrální prázdné nástroje jsou právně obhajitelné a žádné tvrzení není hrubý overreach — (h) je správně označeno jako komerčně nebezpečné. Zbývá opravit čtyři vady, než to půjde k právníkovi: (1) HLAVNÍ — unconditional 'commercialSafe:true' u katalogů/enginu/bestiáře (c/d/e) zastírá, že bezpečnost kolabuje v okamžiku, kdy monetizovaná platforma GURPS user-obsah PRODÁVÁ nebo veřejně DISTRIBUUJE/klonuje přes showcase/marketplace/freemium; nutná tvrdá brána 'GURPS user-obsah = privátní & nekomerční, nikdy do distribučních/placených vrstev'. (2) Chybí EU/CZ sui generis právo pořizovatele databáze pro ručně přepsané oficiální seznamy. (3) Neutralita VTT (g) musí držet i na prezentační/marketingové vrstvě — sestavený produkt nesmí být nabízen jako 'GURPS online hra'. (4) Dodané disclaimer/attribution texty samy užívají 'GURPS' a rámují platformu jako GURPS-kompatibilní, což si protiřečí se závěrem 'komerčně bezpečné = bez názvu'. Po zapracování těchto guardrailů a s finálním posudkem právníka je návrh jako celek obhajitelný.
- **[needs-guardrail]** (b) Uživatelsky-definovatelný builder listu — commercialSafe:true (0.8)
  - → Překotvit legal basis na §2/6 AutZ + Baker v. Selden (ne §65/2). Hard-gate: GURPS uživatelské šablony nesmí do showcase/marketplace/klonu/freemium; sdílení jen soukromé, nekomerční.
- **[needs-guardrail]** (c) Prázdný vzorcový engine, presety = user/komunitní obsah — commercialSafe:true (0.75)
  - → Doplnit guardrail: žádné komunitní GURPS presety přes zpoplatněnou/veřejnou distribuci; presety drž jako privátní import na vlastní odpovědnost. Uvést riziko compilation copyright na výběr/uspořádání.
- **[needs-guardrail]** (d) Prázdné katalogy kouzel/předmětů plněné uživatelem — commercialSafe:true (0.85)
  - → Přidat sui generis DB právo do legal basis i avoid. Podmínit commercialSafe: platí JEN když GURPS user-obsah nikdy neprojde prodejem/showcase/klonem; jinak rating padá.
- **[needs-guardrail]** (e) Prázdný bestiář, uživatel tvoří vlastní statbloky — commercialSafe:true (0.8)
  - → Změnit na podmíněně-bezpečné: GURPS uživatelské statbloky musí zůstat privátní a nekomerční; zákaz surfacingu přes showcase/marketplace/clone/streamer-overlay. Bez této tvrdé brány commercialSafe=false.
- **[needs-guardrail]** (g) Systémově-neutrální VTT (grid/tokeny/LoS/iniciativa) — commercialSafe:true (0.95)
  - → Guardrail: sestavený produkt se nikdy nesmí inzerovat/nabízet jako 'GURPS online hra / VTT pro GURPS'; neutralita platí i pro marketing a UI, ne jen absenci pravidel.
- **[needs-guardrail]** (j) AI generátor — jen neutrální flavour, bez statů a bez značky — commercialSafe:true (0.65)
  - → Přidat výstupní filtr proti regurgitaci pravidlového textu/tabulek/seznamů; log a blok GURPS-terminologických výstupů; nepromptovat na pravidla. Bez filtru je 0.65 optimistické.
- **[needs-guardrail]** Průřezově: 'user content na vlastní odpovědnost' jako základ commercialSafe pro c/d/e na MONETIZOVANÉ platformě se sdílením
  - → Zavést tvrdou bránu: veškerý GURPS-terminologický user-obsah = privátní, nekomerční, NIKDY v showcase/marketplace/klonu/streamer-overlay/placeném tieru. Ratingy c/d/e přeznačit na 'podmíněně bezpečné' s touto bránou jako blokující podmínkou, ne jako měkkou poznámkou.

**Avoid:**
- Reprodukce pravidlového textu, vignette textu, formulářů, tabulek a grafů z knih GURPS (porušení copyrightu).
- Předvyplněné OFICIÁLNÍ seznamy kouzel / výhod / nevýhod / dovedností / předmětů z knih (chráněný výraz).
- Reprodukce publikovaných statbloků bestií z knih GURPS.
- Platformou distribuovaný 'GURPS preset' (předpřipravená pole/vzorce/šablona listu) v KOMERČNÍM režimu bez licence.
- Branding 'GURPS' jako inzerovaná podporovaná/placená funkce; logo Eye-in-the-Pyramid; obraz Ogre; imitace trade dress (3e rám, 4e puzzle piece).
- Hostování, úprava nebo inkorporace GURPS Lite do platformy (povolen jen odkaz ven; 'may not incorporate ... into another product').
- AI generátor GURPS-kompatibilních herních statů / pravidel / obsahu s terminologií (odvozenina + ochranná známka).
- Mobilní aplikace využívající obsah nebo ochranné známky GURPS ('We currently do not allow apps for mobile devices').
- VTT / online hru nad rámec pouhé tvorby postavy prezentovanou jako GURPS ('it's more like a computer game'; FAQ 2.18 → bez formální licence NE).
- Překlad pravidel GURPS do češtiny bez svolení SJ Games (odvozenina chráněného textu).
- Jakékoli PLACENÉ zpřístupnění GURPS-specifického obsahu bez licence — Online Policy na komerci NEPLATÍ.
- Spoléhat na Online Policy jako právní základ pro komerční platformu (je nekomerční a kdykoli odvolatelná bez upozornění).
- Uživatelský GURPS obsah (statbloky/položky) komerčně prodávat/zpřístupňovat jménem platformy (nekomerční jen jako user fan obsah).

**Návrh disclaimeru:**
> GURPS je ochranná známka Steve Jackson Games Incorporated a její pravidla a ilustrace jsou chráněny autorským právem Steve Jackson Games. Všechna práva vyhrazena. Tento materiál je původní tvorba uživatele určená pro použití se systémem GURPS; není oficiální a není schválen ani podporován společností Steve Jackson Games. Platforma Projekt Ikaros nereprodukuje pravidlový text, tabulky ani seznamy z produktů GURPS — veškerý herní obsah vytvářejí uživatelé na vlastní odpovědnost. Uvolněno pro bezplatné, nekomerční užití v rámci povolení Steve Jackson Games Online Policy (sjgames.com/general/online_policy.html), které může být kdykoli změněno nebo odvoláno.

**Návrh atribuce:**
> GURPS™ je ochranná známka Steve Jackson Games Incorporated (sjgames.com). Uvedení názvu systému je čistě popisné (nominativní) a neznamená spojení se společností Steve Jackson Games ani její schválení či podporu. Podmínky viz oficiální Online Policy: sjgames.com/general/online_policy.html.

**Poznámky rešerše:** ZÁVĚR PRO PROJEKT IKAROS: GURPS je UZAVŘENÝ systém. Výslovně potvrzuji, že NEEXISTUJE žádná veřejná otevřená licence (žádné SRD, žádný OGL, žádný ORC, žádné Creative Commons) ani engine-level otevřená cesta pro GURPS. Jediná veřejná povolení jsou (a) SJ Games Online Policy a (b) GURPS FAQ — obojí čistě NEKOMERČNÍ fan-policy, kdykoli odvolatelná. Rovněž NEEXISTUJE komerční community-content program (žádná obdoba DMs Guild/marketplace) — jediná placená cesta 'Powered by GURPS' je individuálně vyjednaná profesionální licence (mimo zadání: bez smlouvy a bez právníka).

CO IKAROS BEZ SMLOUVY POSTAVIT MŮŽE: reálně téměř nic z toho, co dělá platformu platformou. Online Policy povoluje jen: nekomerční fan-stránky/komentář; nekomerční 'character generator/game aid' JEN pro PC (ne mobil, ne app) a nic víc než tvorbu postavy; uživatelovy vlastní originální statbloky/scénáře s terminologií, nekomerčně, s disclaimerem.

PROČ ZROVNA IKAROS NARÁŽÍ: Projekt Ikaros je webová all-in-one VTT/herní-stůl platforma (autofill+výpočetní deník, taktická mapa+tokeny, chat, bestiář, kouzla, veřejné SEO landing stránky, AI 'generátor kompatibilního obsahu') s plánovanou budoucí monetizací. To spadá současně pod TŘI zákazy Online Policy/FAQ: (1) 'online game / computer game' = 'more like a computer game' (FAQ 2.18 výslovně NE bez formal permission); (2) mobilní/app rozměr (web app běží i na mobilu); (3) komerční užití (Online Policy 'does NOT apply' na placené). Navíc 'GURPS' jako inzerovaná systémová podpora na monetizované platformě přesahuje povolené nominativní/nekomerční užití značky. AI 'generátor GURPS-kompatibilního obsahu' = dvojité riziko: odvozenina chráněných pravidel + užití ochranné známky.

DOPORUČENÍ (konzervativní): GURPS NEZAŘAZOVAT jako plnohodnotný podporovaný systém bez formální licence od SJ Games. Bezpečné maximum bez smlouvy = systémově NEUTRÁLNÍ deník/plátno, kde si uživatel sám vyplní vlastní hodnoty, BEZ zabudované GURPS terminologie/pravidel/tabulek/seznamů a BEZ brandingu 'GURPS'. Pro skutečnou podporu GURPS je jedinou cestou oslovit SJ Games Director of Licensing (poweredbygurps@sjgames.com / licensing) a vyjednat licenci — což je mimo rozsah 'bez smlouvy'.

POZN. K AKTUÁLNOSTI: Online Policy je živě dostupná dnes (ověřeno 2026-07-20), ale je datovaná 'Updated May 15, 2012' — předchází moderním VTT. Závěr o VTT/platformě se proto opírá o její jazyk 'online game / computer game / mobile app' a o GURPS FAQ 2.18, které oba explicitně pokrývají tento případ. Confidence 0.95; jediná zbytková nejistota je hranice 'game aid' vs 'computer game', kterou ale konzervativní výklad (VTT = computer game) jasně řeší v neprospěch bezlicenčního nasazení.

---

### Shadowrun  `shadowrun`

**Strop:** `reference-only`

> Shadowrun je uzavřený proprietární systém: NEEXISTUJE OGL/SRD/ORC/Creative Commons ani veřejná fan-licence pro software. Jediná veřejná cesta (Holostreets / Shadowrunner Collective) je marketplace program pro STATICKÉ publikace prodávané výhradně přes DriveThruRPG/OneBookShelf — výslovně NENÍ licence pro externí web/VTT/aplikaci, tj. přesně to, čím Ikaros je. Bez sjednané licence od Catalyst/Topps proto NELZE reužít žádný oficiální obsah (pravidlový text, tabulky, seznamy kouzel/gearu, statbloky, mapy, art, loga) ani produkt brandovat jako Shadowrun. Reálný strop = 'reference-only': smíme (1) stavět systémově-agnostické generické nástroje bez cizího IP, (2) implementovat samotnou HERNÍ MECHANIKU vlastními slovy/vlastním kódem (nechráněný postup/metoda/vzorec dle §2 odst. 6 AutZ), (3) nominativně minimálně odkázat kompatibilitu. Veškerý systémový OBSAH musí dodat sám uživatel. Není to 'blocked' (generické nástroje + originální re-exprese mechaniky buildable jsou), ale ani 'fan-noncommercial' (žádná fan-licence neexistuje).

**Licenční základ:**
- **Holostreets: The Shadowrunner Collective — Content Guidelines (Catalyst Game Labs community content program)** — `marketplace-program` · https://help.drivethrurpg.com/hc/en-us/articles/13610633912343-Catalyst-Game-Labs-Holostreets-The-Shadowrunner-Collective-Content-Guidelines
  - „You may create content for any edition of Shadowrun, including: First Edition (SR1), Second Edition (SR2), Third Edition (SR3), Fourth Edition (SR4), Fourth Edition Anniversary (SR4A), Fifth Edition (SR5), Anarchy (SR:A), and Sixth World Edition (SR6)."
  - „New gear, qualities, spells, adept powers, programs, complex forms, vehicles, and drones can be released but they should be made consistent with the timeline the material is presented in."
  - „The complete Holostreets logo and Shadowrun logo must appear on the cover and title page of the publication. It must be clear and unobscured, but it should not be the predominate graphical element on the page."
  - „No published Shadowrun art or graphics may be used besides those explicitly provided."
  - „AI-generated art should not be used on Holostreets. Since Holostreets is a paying market, we want creators to be used and compensated for their work, and we have serious concerns about the ethics of how AI uses artists' images to generate their pieces."
  - „While Holostreets material is non-canonical within the Shadowrun setting, creators are free to explore new avenues, generate new storylines, and otherwise tell the stories they want to tell."
- **OneBookShelf Community Content Agreement (binding click-through license under Holostreets)** — `community-license` · https://help.drivethrurpg.com/hc/en-us/articles/12723257131927-Community-Content-Agreement
  - „OneBookShelf ... administers the Community Content Programs under license from the participating Publishers."
  - „To get involved, all you need to do is read the Content Guidelines specific to a program, write your content, and click through a Community Content Agreement with OneBookShelf when uploading your content."
  - „The publisher does own the IP that they contribute, plus the Community Content Program agreement will grant the publisher and other Community Content Creators a license to use your IP. The publisher does not own any of the unique IP that you create in your publications."
- **No open/public license for Shadowrun (no OGL, SRD, ORC, or Creative Commons)** — `none-found` · ✔ primární zdroj · https://en.wikipedia.org/wiki/Open_Game_License
  - „Shadowrun does not have rules under an OGL — the system uses proprietary licensing rather than open licensing."
  - „The Roll20 compendium only has Pathfinder and D&D because the two systems have SRD and OGL licenses (Shadowrun has none)."
- **Shadowrun trademark/copyright ownership (The Topps Company; Catalyst = licensee)** — `other` · https://www.shadowruntabletop.com/legal/
  - „Shadowrun, Sixth World, and Matrix, and associated graphics and logos are registered trademarks and/or trademarks of The Topps Company, Inc., in the United States and/or other countries."
  - „Catalyst Game Labs and the Catalyst Game Labs logo are trademarks of InMediaRes Productions, LLC."
  - „Catalyst Game Labs has license from them to produce tabletop gaming products, supplements, and fiction."

**Dovoluje / nedovoluje (per vrstva):**
- `rulesText`: JEN uvnitř Holostreets publikace (statické PDF/tisk prodávané přes DriveThruRPG/OneBookShelf). Lze psát NOVÁ pravidla pro libovolnou edici (SR1–SR6, Anarchy). Kopírovat/hostovat oficiální pravidlový text na vlastním webu/VTT/aplikaci = NE (chráněno copyrightem, žádná veřejná licence).
- `names_terminology`: Názvy a terminologie použitelné jen v rámci Holostreets publikace. Mimo program jsou 'Shadowrun', 'Sixth World', 'Matrix' registrované ochranné známky Topps — bez licence NE.
- `spells_abilities_lists`: Nová kouzla/adept powers/qualities/complex forms lze PUBLIKOVAT v Holostreets. Přebírat oficiální seznamy kouzel/schopností z knih do vlastní appky/databáze = NE (copyright).
- `bestiary_statblocks`: Nové statbloky lze v Holostreets publikaci. Import oficiálních statbloků do vlastního bestiáře/DB/VTT = NE.
- `autofill_calc_sheet`: NE. Žádná veřejná licence nepovoluje interaktivní autofill/výpočetní deník s pravidly Shadowrunu ve VTT/aplikaci. Holostreets kryje jen statické publikace, ne software.
- `derivatives`: Odvozená díla POUZE jako publikace v programu Holostreets (nekanonická). Odvozeniny mimo marketplace bez sjednané smlouvy = NE.
- `vtt_app`: NE. Žádná veřejná licence pro externí web, VTT ani aplikaci. Oficiální VTT je exkluzivní partnerství Catalyst × Roll20 (obsah + tokeny + character sheety na Roll20) — třetí strana to nesmí replikovat.
- `translation`: Neupraveno explicitně; Holostreets je primárně anglofonní marketplace. Překlad oficiálního textu bez výslovného svolení Catalyst/Topps = NE.
- `commercial`: Komerčně ANO, ale JEN v Holostreets (placené tituly), s revenue splitem mezi OneBookShelf, Catalyst Game Labs a tvůrce. Komerční užití IP mimo tento program = NE.
- `logo_use`: POVINNÉ v Holostreets: kompletní logo Holostreets + logo Shadowrun na obálce a titulní straně, jasné a nezakryté, ale ne dominantní grafický prvek. Jiné oficiální Shadowrun grafiky/arty NE — jen dodané art packs; k ostatní grafice si tvůrce zajistí práva sám.

**Vyžaduje:**
- Publikovat VÝHRADNĚ přes program Holostreets na DriveThruRPG/OneBookShelf (marketplace); ne na vlastním webu, VTT ani v aplikaci.
- Při uploadu odsouhlasit klikací OneBookShelf Community Content Agreement (licence od publishera, ne od tebe).
- Umístit kompletní logo Holostreets + logo Shadowrun na obálku a titulní stranu — jasné, nezakryté, nedominantní.
- Používat jen dodané art packs; ke vší ostatní grafice si zajistit práva samostatně.
- Držet obsah konzistentní s časovou linií dané edice (např. wireless Matrix ne před 2072).
- Prezentovat obsah jako nekanonický.
- Uvádět ochranné známky The Topps Company a Catalyst Game Labs / InMediaRes dle jejich notace.

**Zakazuje:**
- Stavět externí web, VTT nebo aplikaci s pravidly, terminologií, statbloky nebo logy Shadowrunu — žádná veřejná licence to nepovoluje (to je přesně případ Projektu Ikaros).
- Autofill/výpočetní deník, kalkulačka nebo databáze kouzel/statbloků čerpající z oficiálních pravidel mimo Holostreets.
- Distribuovat/prodávat mimo ekosystém DriveThruRPG/OneBookShelf (a partnerský Roll20 marketplace).
- Používat oficiální Shadowrun arty/grafiky (povoleny jen dodané art packs).
- Používat AI-generovaný art.
- Adult obsah (explicitní sex/násilí na úrovni hard R / NC-17) a obsah propagující diskriminaci chráněné třídy.
- Používat logo jako dominantní grafický prvek nebo v zakryté/nejasné podobě.

**Buildable — co postavit (C = commercial-safe):**
- **[C] (a) Obecně-neutrální deník** — Prázdný deník/karta postavy s uživatelsky definovatelnými sekcemi a poli. Žádné SR-specifické názvy ani předvyplněné hodnoty; strukturu i obsah si vytvoří uživatel sám.
  - *základ:* Vlastní tvůrčí dílo Ikara, nulové cizí IP. Nespadá pod žádnou ochrannou známku ani copyright třetí strany.
  - *guardraily:* Žádný předvyplněný SR obsah · Žádná zmínka o Shadowrunu jako brandu · Uživatel = jediný zdroj dat · Disclaimer o obecnosti nástroje
- **[C] (b) Systémově-strukturovaný deník (pole/atributy/pořadí)** — Schéma deníku odrážející STRUKTURU kyberpunkové mechaniky (8 atributů typu Body/Agility/Reaction…, Edge, dovednosti, iniciativa jako datová pole a jejich pořadí), sestavené vlastními silami. Jen funkční labely, žádné opsané definice.
  - *základ:* §2 odst. 6 AutZ — postup/princip/metoda hry a funkční označení pole nejsou autorské dílo; struktura karty = nechráněná mechanika. Labely typu 'Body/Reaction' jsou obecná funkční slova, ne tvůrčí expression.
  - *guardraily:* Nepojmenovat produkt 'Shadowrun'/'Sixth World'/'Matrix' · Žádný opsaný popisný text z příruček · Jen funkční labely, ne definice/pravidla · Prezentovat jako obecný/kompatibilní kyberpunkový systém · Viditelný disclaimer o neoficiálnosti
- **[C] (c) Autofill + výpočty (dice pool, odvozené hodnoty)** — Výpočetní engine, který z uživatelem ZADANÝCH hodnot počítá odvozené (iniciativa = Reaction+Intuition, dice pool = atribut+dovednost, limity apod.) podle vzorců implementovaných vlastními silami.
  - *základ:* §2 odst. 6 AutZ — matematický vzorec a metoda výpočtu nejsou chráněny; implementujeme mechaniku, nikoli text/tabulky. Nepřebíráme žádné oficiální tabulky ani rules text.
  - *guardraily:* Vzorce implementovat sám, žádné opsané tabulky/ceníky/modifikátory jako data · Nedodávat oficiální hodnoty jako předvyplněný dataset · Bez SR brandingu · Nevydávat za oficiální/licencovaný kalkulátor
- **[C] (d) Prázdné kontejnery pro kouzla/schopnosti/předměty** — Datové sekce 'kouzla', 'adept powers', 'výbava' jako PRÁZDNÉ struktury, do nichž obsah zadává výhradně uživatel. Neobsahují žádné oficiální seznamy.
  - *základ:* Prázdná kategorie = funkční struktura (nechráněná, §2/6). Oficiální seznamy jsou naopak chráněná kompilace (§88 AutZ — zvláštní právo pořizovatele databáze) + jednotlivé popisy = autorský text → NEpřebírat.
  - *guardraily:* Nikdy nepředvyplnit oficiálními kouzly/gearem · Bez opsaných popisů/statů z knih · Uživatelský obsah = odpovědnost uživatele · Neagregovat oficiální seznamy ani ze sdílených uživatelských dat
- **[C] (e) Prázdný bestiář / uživatelské statbloky** — Struktura bestiáře a statbloku (pole pro atributy/HP/skills) PRÁZDNÁ; naplňuje ji uživatel vlastními daty. Žádné oficiální stvůry, názvy ani hodnoty jako dataset.
  - *základ:* Schéma statbloku = funkční/mechanické (nechráněné, §2/6). Oficiální statbloky jako výběr + text + kompilace jsou chráněné (autorský text + §88 databáze) → NEimportovat/nehostit.
  - *guardraily:* Žádný předvyplněný oficiální bestiář · Bez oficiálních názvů stvůr jako datasetu · Uživatel dodává veškerý obsah · Neredistribuovat uživatelem nahrané oficiální statbloky
- **[·] (f) Tahák mechaniky vlastními slovy (minimální, transformativní)** — Stručné vysvětlení PRINCIPU mechaniky (jak funguje dice pool, glitch, iniciativa) plně přeformulované vlastními slovy, bez tabulek a bez citací. Ne náhrada příručky.
  - *základ:* §2 odst. 6 AutZ — vysvětlení metody/principu není chráněno; chráněná je jen konkrétní expression. Nutně plně přeformulováno (transformativní), žádný verbatim text ani opsané tabulky.
  - *guardraily:* Žádný verbatim text ani opsané tabulky/hodnoty · Bez loga/trade dress · Nepoužívat známku jako název produktu (max nominativní zmínka) · Držet minimální rozsah, ne substitut příručky · Před komerčním nasazením právník · Disclaimer
- **[C] (g) Obecná taktická mapa + generické/uživatelské tokeny** — Systémově agnostická grid/hex mapa: měření, LoS, fog, iniciativa. Tokeny generické nebo nahrané uživatelem.
  - *základ:* Vlastní/obecná VTT funkčnost bez cizího IP; mechanika mřížky/měření je nechráněná. Žádný oficiální SR asset se nepoužívá.
  - *guardraily:* Žádné oficiální SR mapy/art/tokeny/loga · Jen generické nebo uživatelské assety · Bez SR brandingu na dlaždicích/UI · Bez oficiálních ikon výbavy/kouzel
- **[·] (h) Veřejná stránka — jen nominativní zmínka kompatibility** — Landing/SEO text, který systém NEbranduje jako Shadowrun; nanejvýš jedna faktická věta o kompatibilitě s kyberpunkovou mechanikou. Preferováno zcela obecné znění bez známky.
  - *základ:* Nominativní/deskriptivní užití známky (zák. 441/2003 Sb.; čl. 14 EUTMR) — dovoleno označit kompatibilitu jen v nezbytném rozsahu, bez loga a bez dojmu schválení/partnerství.
  - *guardraily:* Žádné logo ani trade dress · Bez tvrzení o oficiálnosti/partnerství/schválení · Nezakládat SEO na cizí známce jako hlavní háček (riziko dilution) · Viditelný disclaimer · Preferovat obecné znění bez názvu · Komerčně jen minimalisticky + právník
- **[C] (i) Import/export UŽIVATELSKÝCH dat** — Uživatel exportuje/importuje SVŮJ deník (JSON apod.). Žádný dodaný oficiální datový balík ani konvertor oficiálních souborů.
  - *základ:* Data patří uživateli; přenos vlastního obsahu bez cizího IP. Formát = funkční, nechráněný.
  - *guardraily:* Nedodávat oficiální SR datové balíky · Neparsovat/neredistribuovat oficiální soubory jako obsah · Import = uživatelův obsah a jeho odpovědnost · Neagregovat importy do sdílené oficiální DB
- **[·] (j) AI generátor NOVÉHO kompatibilního obsahu** — AI generuje ORIGINÁLNÍ nekanonický obsah (nová NPC, mise, gear) mechanicky slučitelný — vždy nový text, ne reprodukce příruček.
  - *základ:* Výstup = nová expression + nechráněná mechanika (§2/6). Nesmí reprodukovat chráněný text ani vydávat za oficiální/kanonické.
  - *guardraily:* Zákaz verbatim reprodukce příruček · Žádné oficiální názvy/loga prezentované jako oficiální · Výstup označit jako neoficiální/fanouškovský · Nezakládat prompt na hostovaném oficiálním textu · Komerčně po právníkovi

**Adversariální kontrola (verify):**
- *net:* Návrh je jako celek právně obhajitelný a nezvykle poctivě konzervativní: správně a ověřeně konstatuje, že pro Shadowrun NEEXISTUJE žádná veřejná licence (OGL/SRD/ORC/CC ani fan-policy), že Holostreets/Shadowrunner Collective je pouze marketplace pro STATICKÉ publikace na DriveThruRPG (nekryje web/VTT/app — jediná oficiální VTT cesta je vyjednané partnerství Catalyst–Roll20) a že bez sjednané licence nelze reužít žádný chráněný text, seznamy, statbloky, art ani známky. Strop 'reference-only' je opodstatněný. Žádné tvrzení nepředstírá, že by nějaká licence něco povolovala (žádný klasický overreach) — vše stojí na nechráněné mechanice (§2/6 AutZ), vlastní expression a generických nástrojích, což je solidní základ. Nutné opravy jsou dolaďovací, ne koncepční: (1) změkčit formulaci, že Holostreets 'výslovně' vylučuje apps (je jen mimo rozsah); (2) doplnit guardrail proti kopírování TRADE DRESS oficiálního character sheetu/UI a nešířit kompletní kanonickou sestavu atributů jako pojmenovaný 'SR template' (present jako user-built); (3) přidat provozní UGC pojistky (notice-and-takedown, repeat-infringer, zákaz agregace uživatelsky nahraného oficiálního obsahu) k položkám d/e/i; (4) u (j) AI a (f) taháku rozšířit zákazy na kanonický setting/proper nouns a na sledování struktury/pořadí příručky, ne jen 'verbatim text'; (5) u (h) učinit defaultem úplné nepojmenování Shadowrunu a nominativní zmínku jen jako úzkou výjimku bez SEO háčku, s právníkem. Po těchto úpravách je buildable jádro (a,g,i bezpečně; b,c,d,e s guardraily) komerčně obhajitelné a hraniční položky (f,h,j) zůstávají nekomerční do posouzení právníkem.
- **[needs-guardrail]** overallCeiling=reference-only; Holostreets/OneBookShelf 'výslovně NENÍ licence pro externí web/VTT/aplikaci'
  - → Přeformulovat na 'Holostreets svým rozsahem nepokrývá web/VTT/aplikaci (je omezen na publikace prodávané přes DriveThruRPG); nelze se o něj opřít'. Doplnit, že jediná oficiální VTT cesta je licenční partnerství (Roll20), tedy vyjednaná licence, ne veřejná.
- **[needs-guardrail]** (b) Systémově-strukturovaný deník opisující strukturu SR (8 atributů Body/Agility/Reaction…, Edge, iniciativa) jako pole a jejich pořadí
  - → Nešířit hotovou SR sestavu jako pojmenovaný 'Shadowrun' template — nechat uživatele pole vytvořit/aktivovat; nepoužít 'Matrix' jako název pole/feature; nenapodobovat vizuální rozvržení oficiálního listu (vlastní layout). Přidat guardrail 'žádný trade dress oficiálního deníku'.
- **[needs-guardrail]** (c) Autofill/výpočty (dice pool=atribut+dovednost, iniciativa=Reaction+Intuition, limity) vlastní implementací
  - → Explicitně zakázat i komentáře/popisky/hodnoty opsané z příruček; žádné oficiální tabulky modifikátorů/limitů jako seed data; kalkulačka pracuje jen s hodnotami zadanými uživatelem.
- **[needs-guardrail]** (d) Prázdné kontejnery pro kouzla/schopnosti/výbavu, obsah zadá uživatel
  - → Doplnit DMCA/notice-and-takedown režim + repeat-infringer politiku + zákaz veřejného sdílení uživatelských 'balíčků', které by de facto rekonstruovaly oficiální seznamy.
- **[needs-guardrail]** (e) Prázdný bestiář / uživatelské statbloky
  - → Stejné UGC pojistky jako (d); navíc zákaz oficiálních názvů stvůr jako vyhledávatelného/sdíleného datasetu.
- **[needs-guardrail]** (f) Tahák mechaniky vlastními slovy (minimální, transformativní), commercialSafe:false
  - → Držet skutečně minimální rozsah, nezrcadlit strukturu/pořadí kapitol příručky, žádná parafráze 'věta po větě'; nikdy jako substitut pravidel; komerčně jen po právníkovi. Přidat guardrail 'nekopírovat uspořádání/sekvenci originálu'.
- **[needs-guardrail]** (h) Veřejná stránka — nominativní zmínka kompatibility, commercialSafe:false
  - → Default = systém vůbec nepojmenovávat (obecné 'kompatibilní kyberpunkový systém'); nominativní zmínka jen jako úzká výjimka, nikdy jako hlavní SEO háček, bez loga/trade dress, s disclaimerem, komerčně po právníkovi.
- **[needs-guardrail]** (j) AI generátor NOVÉHO kompatibilního obsahu (NPC/mise/gear)
  - → Rozšířit guardrails: zákaz kanonických proper nouns / setting IP / známkových názvů (nejen 'text'); výstupní filtr na verbatim/near-verbatim reprodukci; povinné označení 'neoficiální/fanouškovské'; prompt nestavět na hostovaném oficiálním obsahu.
- **[needs-guardrail]** avoid[] + requiredDisclaimerText + attributionText (Topps vlastník, Catalyst licencí; nominativní varianta + bezpečnější bezejmenná)
  - → Doplnit do avoid[]: 'napodobovat vizuální layout/trade dress oficiálního listu či UI' a 'používat kanonické názvy korporací/postav/míst (setting IP) jako obsah'. Přidat provozní guardrail platformy: DMCA notice-and-takedown + repeat-infringer + zákaz agregace uživatelsky nahraného oficiálního obsahu.

**Avoid:**
- Hostovat/kopírovat oficiální pravidlový text, tabulky, ceníky ani je opisovat parafrází blízkou originálu.
- Reužít oficiální seznamy kouzel / adept powers / qualities / complex forms / gearu / vozidel / dronů (chráněná expression + databázové právo §88 AutZ).
- Importovat/hostit oficiální statbloky a bestiář (výběr + text + kompilace).
- Předvyplnit deník/bestiář/katalog/kalkulátor jakýmkoli oficiálním SR obsahem — vše musí zadat uživatel.
- Použít loga a trade dress (Shadowrun, Sixth World, Matrix, Catalyst Game Labs, Holostreets) v jakékoli podobě.
- Použít oficiální Shadowrun grafiku/art/mapy/tokeny/ikony.
- Brandovat produkt jako 'Shadowrun' nebo tvrdit oficiálnost / licenci / partnerství / schválení (Topps ani Catalyst).
- Stavět autofill/výpočetní deník nebo databázi čerpající z oficiálních pravidel jako dodaného datasetu.
- Používat ochrannou známku jako dominantní grafický prvek nebo hlavní SEO háček (riziko dilution / implied endorsement).
- Překládat oficiální text bez výslovného svolení Catalyst/Topps.
- Předstírat, že Holostreets / OneBookShelf Community Content Agreement kryje web/VTT/aplikaci — kryje jen statické publikace na DriveThruRPG.
- Distribuovat systémový obsah mimo dohodnutý rámec; jakákoli monetizace SR IP vyžaduje individuálně sjednanou licenci od Catalyst/Topps.

**Návrh disclaimeru:**
> Projekt Ikaros není spojen se společnostmi The Topps Company, Inc. ani Catalyst Game Labs / InMediaRes Productions, LLC, není jimi schválen ani sponzorován. Shadowrun, Sixth World a Matrix jsou (registrované) ochranné známky The Topps Company, Inc. Tato platforma neobsahuje žádný oficiální herní text, tabulky, statbloky, grafiku ani loga; veškerá herní mechanika je popsána a implementována vlastními slovy a veškerý systémový obsah (kouzla, výbava, bestie apod.) zadávají výhradně sami uživatelé, kteří za něj nesou odpovědnost.

**Návrh atribuce:**
> Shadowrun®, Sixth World® a Matrix jsou ochranné známky The Topps Company, Inc. Catalyst Game Labs je ochranná známka InMediaRes Productions, LLC. Případné použití těchto názvů slouží výhradně k označení kompatibility (nominativní užití); nejde o oficiální ani licencovaný produkt a nevzniká tím žádný vztah schválení či partnerství. Bezpečnější varianta: název systému vůbec neuvádět a používat obecné označení (např. „kompatibilní kyberpunkový systém").

**Poznámky rešerše:** ZÁVĚR PRO IKAROS: Pro Shadowrun NELZE na základě veřejných licencí legálně postavit prakticky NIC z toho, co Ikaros je (VTT/herní stůl, autofill deník s výpočty, taktická mapa s tokeny, bestiář/DB kouzel/předmětů, SEO landing stránky se systémovým obsahem, AI generátor kompatibilního obsahu). Shadowrun je UZAVŘENÝ proprietární systém: NEEXISTUJE OGL/SRD/ORC/Creative Commons ani žádná veřejná fan-licence pro software. IP vlastní The Topps Company (po akvizici Toppsu Fanaticsem 2022 zůstává ochranná známka vedená na Topps), publikuje licencovaný Catalyst Game Labs.

Jediná veřejná cesta = program Holostreets / Shadowrunner Collective, ale to je MARKETPLACE PROGRAM pro STATICKÉ PUBLIKACE (PDF/tisk) prodávané výhradně přes DriveThruRPG/OneBookShelf — výslovně NENÍ licence pro externí web/VTT/aplikaci. Do Holostreets by teoreticky šlo napsat placenou nekanonickou příručku (nová pravidla/gear/kouzla) s povinnými logy, ale nedá se z něj odvodit právo hostovat systémový obsah v Ikarosu.

Oficiální VTT podpora je exkluzivní partnerství Catalyst × Roll20 (hotové sheety/tokeny na Roll20) — potvrzuje, že Catalyst si VTT drží pod vlastní/sjednanou licencí; třetí strana to bez smlouvy nesmí.

Cesta k monetizaci Shadowrunu v Ikarosu = POUZE individuálně vyjednaná licence od Catalyst Game Labs / Topps (mimo zadání 'bez smlouvy'). Bezpečná alternativa bez licence: nechat uživatele nahrát vlastní data, nedodávat žádný oficiální systémový obsah, vyhnout se známkám/logům/artům.

METODIKA/OMEZENÍ DŮKAZŮ: Přímý WebFetch primárních stránek DriveThruRPG (help i support) vracel HTTP 403; shadowruntabletop.com/legal spadl na socket hang up. Text guidelines a trademark notace jsem četl přes extrakci obsahu těchto primárních URL nástrojem WebSearch + korroboroval napříč nezávislými zdroji (geeknative, shadowrunsixthworld, DTRPG support summaries). Respektoval jsem projektové pravidlo — NEotevíral jsem prohlížeč/Playwright. Proto verifiedFromPrimarySource=false u položek na blokovaných doménách. Před spolehnutím doporučuji prokliknout primární URL a potvrdit AKTUÁLNÍ přesné znění (guidelines se mohou měnit; poslední velká úprava komunikace Catalyst byla leden 2024, ale ta se týkala moderace sociálních sítí, ne IP-licence).

---
