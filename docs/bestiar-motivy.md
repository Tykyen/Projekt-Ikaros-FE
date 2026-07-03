# Bestiář — poznámkový blok motivových vzhledů

Pracovní blok: jak vypadá **karta bestie** v každém z 12 motivů světa. Živý dokument —
aktualizuje se po každém dokončeném motivu.

## Cíl a postup
- **Fáze 1 ✅ HOTOVO** — navrženo a ověřeno **všech 12 vzhledů** (kabátků) karty bestie
  (sbaleno + rozbaleno) na systému **drdplus** (Svět vil). HTML prototypy v `scratchpad/bestie-<motiv>.html`.
- **Fáze 2 — PROBÍHÁ** — implementovat do FE kódu (BestieCard motiv-aware přes `data-theme`,
  per-motiv CSS) a **aplikovat na všech 14 systémů** (systém mění jen zobrazená pole, ne tvar).
  [Edit modal bestie řešit taky ve fázi 2.]
  - **K1 ✅** pilot dark-fantasy: BE `description` pole + univerzální BestieCard (disclosure)
    + BestieDetail (schema read) + tokeny + bestieSkins.css + editor +Popis. Build+testy OK.
    ČEKÁ K1c naživo (za loginem, dělá uživatel; nutný BE deploy+restart kvůli `description`).
  - **K3 ✅** všech 11 zbývajících skinů napsáno do `bestieSkins.css` (12 motivů celkem).
    Render-verify na harness (`scratchpad/bestie-skins-harness.html`) = každý motiv vlastní tvar
    portrétu, žádná kolize/leak. Reálný `npm run build` prošel (10.16s, CSP OK).
  - **K2 ✅** `BestieDetail` ověřen na VŠECH 14 systémech render testem
    (`BestieDetail.systems.spec.tsx`, 16/16) — syntetizuje staty ze schématu každého
    systému, assertuje root + Popis + Poznámky + každou neprázdnou sekci. drd16/fae/fate
    mají vlastní registrované schéma (ne generic fallback) → univerzál je pokryje.
  - **K4 ✅** smazán switch v `BestieCard.tsx` + 6 souborů (Drd16BestieCard/FateBestieCard
    .tsx+.module.css + 2 spec). Build 17.96s + bestiar suite 21/21 čisté. Zbytkový dluh:
    fate-skins CSS drží zmínky `FateBestieCard` v komentářích (5 souborů, netknuto bez souhlasu).
  - **K5 ✅** (2026-07-03): (a) **role gate** — `canSeeNotes` odpojeno od `canEdit`
    (`BestiarPage` počítá `isPjInWorld || admin || owner`, nový prop na `BestieCard`);
    (b) **mobil-desktop** ✅ 375/768/1440 (stack↔grid plynule, 0 horizontální scroll,
    rudý HP bar + hexagon skin sedí; jediný nález = sdílený `Button sm` 33px<44px, app-wide,
    ne card dluh); (c) **funkce** kap. 12 (render karty 16.2h + description/notes + canSeeNotes
    + smazané karty + generic fallback) + datum; (d) **napoveda** WorldSection bestiar (veřejný
    popis / PJ poznámky / rozbalovací karta / motiv) + datum, 25/25 testů.
  - **Repo cleanup:** 34 stray `bestie-*.png` prototypů omylem commitnutých v FE rootu → smazáno.
  - **ZBÝVÁ:** živý pilot K1c (uživatel, po FE build+deploy + BE restart) + ruční commit FE.

## Co je NEMĚNNÉ vs VOLNÉ (napříč motivy)
- **Neměnné (kotva):** (a) mechanika **otevírání/zavírání** karty (sbaleno ↔ rozbaleno);
  (b) **boční akční tlačítka s textovým nápisem** (Upravit / Klonovat / Smazat).
- **Volné (buď kreativní):** tvar/kontejner portrétu, rám, ornament, kompozice, nápad, akcenty.
  Každý motiv originální — uživatel pak vybírá **nejkreativnější** variantu. „Jsem pro jakýkoliv nápad."

## Dvě osy (nemíchat)
- **MOTIV** = vzhled (tvar + signature ornament + barvy/fonty z `--theme-*`). 12 motivů.
- **SYSTÉM** = jaká pole karta zobrazí (schema bestie). 14 systémů.
- Karta = *tvar(motiv)* naplněný *poli(systém)*.
- Barvy/fonty se berou z motiv tokenů; **tvar/ornament je per-motiv originální** (žádné sdílení).

## Společná struktura karty (SKELETON — stejný napříč všemi motivy)
**Sbaleno** (řádek v seznamu):
- portrét · jméno · typ/četnost · **popis** (2 řádky, oříznuto) · akce (Upravit/Klonovat/Smazat) · rozbalovací šipka
- ŽÁDNÉ staty ve sbaleném (bestiář = katalog, ne bojový tracker)

**Rozbaleno** (disclosure — klik na kartu/šipku):
1. Popis (plný)
2. **Boj** — Mez zranění (HP bar) · Ochrana · Nezranitelnost
3. **Útoky** — tabulka (BČ / ÚČ / OČ / ZZ / typ)
4. Vlastnosti
5. Tělo a pohyb
6. Smysly
7. Výskyt a ekologie
8. Schopnosti
9. Poznámky

## Společná pravidla
- **Popis** = univerzální pole na úrovni entity (nové `description`), 2 úrovně (sbaleno zkráceně / plné v detailu).
- **Poznámky = jen PJ** (GM taktika), oddělené od Popisu.
- **Prázdná / nulová pole se skrývají** (ať detail není samá 0).
- Barvy + fonty výhradně z motiv tokenů `--theme-*` (`surface`, `surface-strong`, `accent`,
  `accent-bright`, `accent-cyan`, `text`, `text-muted`, `heading`, `border`, `border-soft`,
  `border-secondary`, `glow-gold`, `glow-cyan`, `--font-display`, `--font-body`).
- Musí fungovat na **mobilu i desktopu**.

## Metodika per motiv
1. Načíst tokeny motivu z `src/themes/themes/<id>/index.ts` (barvy, fonty, atmosphere).
2. Vymyslet tvarový jazyk + signature ornament k atmosféře — **originální, nesdílet mezi motivy**.
3. **4 HTML návrhy** → render (Playwright) → uživatel vybere základ.
   - ⚠️ **VŠECHNY 4 návrhy musí být tvarově ODVÁŽNÉ/kreativní** — ne 1 divoký + 3 bezpečné „na dolití".
     Poučení z Fantasy: uživatel odmítl list/medailon/vitráž jako „očekávaná fantasy", vybral jen
     odvážný popínavý rám. Laťka = popínavý rám nebo výš. Žádné konvenční výplně.
4. Dotáhnout kartu (sbaleno + rozbaleno). [Edit modal řešíme až po vzhledech.]
5. Zapsat výsledný vzhled do logu níže.

## Technické pasti (render / CSS) — POVINNĚ ČÍST
- **Cache prohlížeče:** `py -m http.server` neposílá no-cache → Playwright drží starý HTML.
  Po KAŽDÉM editu re-renderuj s **cache-bust query** (`?v=N`, měň N), jinak vidíš starou verzi
  a „cyklíš" na už opravené chybě. (Stalo se u Steampunku — 3× stejný překryv byl jen cache.)
- **Kolize CSS tříd:** krátké názvy (`.rv`, `.cog`, `.pic`…) se pobijí napříč komponentami —
  nýt `.rv` × ekologie hodnota `.rv` → hodnota zdědila `position:absolute;width:11px` a zmizela.
  Drž názvy unikátní (nýt = `.rivet`).
- **Diagnóza překryvů/posunů:** neháď — přečti `getComputedStyle` + `getBoundingClientRect`
  přes `browser_evaluate`. Ukáže skutečnou příčinu za pár sekund.

---

## Log motivů (12)

### ✅ Dark Fantasy (`dark-fantasy`) — PEČEŤ
- **Stav:** vybráno + schváleno (na drdplus).
- **Atmosféra:** gotická katedrála pod krvavým měsícem.
- **Tokeny:** krvavá `#b51e2e` + studené stříbro `#c8ccd6` na `#0c0608`; fonty Grenze Gotisch (display) + EB Garamond (body).
- **Tvarový jazyk / signature:**
  - Portrét v **šestiúhelníkové pečeti** s kovovým okrajem (clip-path hexagon, gradient stříbro→krvavá).
  - **Krvavý pentagram sigil** v rohu portrétu (signature ornament).
  - Staty jako **vyryté dlaždice** do kamene (inset stín, tmavé vpadliny).
  - Nadpisy Grenze Gotisch, krvavo-stříbrný text-shadow glow.
  - Popis v rozbaleném s **iluminovanou iniciálou** (drop cap).
  - Sekce: small-caps stříbrné nadpisy + krvavá vodicí linka; schopnosti = krvavý kosočtverec; poznámky = boxed s krvavým levým okrajem.
- **Návrh:** `scratchpad/bestie-pecet.html`

### ✅ Fantasy (`fantasy`) — POPÍNAVÝ RÁM
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅.
- **Atmosféra:** vznešená elfí síň — zlatý filigrán a smaragdové světlo pod hvězdnou klenbou.
- **Tokeny:** antické zlato `#e3c66b` + smaragd `#6fd3a8` na `#0b1510`; fonty Marcellus (display) + Cormorant Garamond (body).
- **Tvarový jazyk / signature:**
  - Portrét v **kruhu obrostlém zlato-smaragdovými úponky** (SVG vine + listy v protilehlých rozích).
  - Rám karty s **měkkým asymetrickým zaoblením** (list/okvětní tvar, organické křivky místo tvrdých rámů).
  - Smaragdový okraj portrétu + smaragdový svit.
  - V detailu: **listové odrážky** u schopností, **úponkový oddělovač** sekcí, **zaoblené dlaždice** statů, zlatá iluminovaná iniciála popisu.
  - Nejdál od kamenné Pečeti — živé, přírodní, druidské.
- **Návrh:** `scratchpad/bestie-fantasy-koncepty.html` (koncept 04) → dotažení `scratchpad/bestie-fantasy.html`
### ✅ Sci-Fi (`vesmir`) — HOLOGRAFICKÁ PROJEKCE
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅.
- **Atmosféra:** můstek hvězdné lodi — ledově modré panely, chladný jas dálného vesmíru.
- **Tokeny:** cyan `#4fd4e4` + modrá `#5b8fd6` na `#070b12`; fonty Orbitron (display) + Exo 2 (body).
- **Tvarový jazyk / signature:**
  - Karta jako **promítaný hologram** — rohové `[ ]` závorky místo rámu, průsvitný panel, cyan svit.
  - Portrét „projekce" se **skenovacími linkami** a cyan tintem; blikající `▮` kurzor u jména.
  - **Živé prvky** (přeneseno z oblíbené interaktivity radaru): pohyblivá scan-linka přes portrét, jemný glow pulz panelu, blink kurzoru, hover reakce.
  - Detail: technické nadpisy sekcí (Orbitron uppercase + linka), **segmentovaný HP bar**, **hranaté dlaždice** statů, `>` odrážky schopností, HUD readout tón.
  - Jemná grid mřížka na pozadí (podlaha můstku).
- **Pozn.:** radar (koncept 03) byl blízko (uživatel: „svítí a interaguje"), ale vybrán hologram — jeho interaktivitu jsme do hologramu přenesli.
- **Návrh:** `scratchpad/bestie-scifi-koncepty.html` (koncept 01) → dotažení `scratchpad/bestie-scifi.html`
### ✅ Cyberpunk (`cyberpunk`) — DIAGONÁLNÍ CLASSIFIED (kombinace)
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅. (Pozor past: diagonální neon jako absolute dej do HLAVIČKY, ne na celou kartu — jinak se v rozbaleném protáhne přes celý detail.)
- **Atmosféra:** korporátní megablok — kyselý žlutý neon a varovné šrafy nad uhelnou tmou.
- **Tokeny:** kyselá žlutá `#f0d020` + ocel `#7d8a96` na `#0a0a08`; fonty Chakra Petch (display) + Rajdhani (body).
- **Tvarový jazyk / signature:**
  - Portrét s **diagonálním řezem** (clip-path šikmý) + **žlutá neonová trubice** protínající panel + **hazard proužek** (žluto-černé šrafy) pod obrázkem.
  - Žlutý **`// CLASSIFIED` tag** v rohu (corpo label).
  - Detail: industriální — Chakra Petch uppercase nadpisy sekcí, hazard oddělovače, ostré dlaždice s levým žlutým okrajem, stencil kódy (`BST-04`), `▸` odrážky.
- **Pozn.:** vzniklo z 2. sady (divočejší) — kombinace stylu 4 (diag obrázek) + CLASSIFIED tagu + hazardu. Sada 2 obsahovala i Targeting HUD / Wanted / Datamosh (nezvoleno).
- **Návrh:** `scratchpad/bestie-cyberpunk-koncepty2.html` (koncept 01) → dotažení `scratchpad/bestie-cyberpunk.html`
### ✅ Steampunk (`steampunk`) — MECHANICKÁ CEDULKA
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅. (Uživatel chtěl „víc technickou/kolečkovou" → čistá cedulka nahrazena mechanickou.)
- **Atmosféra:** parní metropole — měděné komíny, vzducholodě, jantarový smog.
- **Tokeny:** leštěná mosaz `#c8893a` + měděná patina `#5fa890` na `#16100a`; fonty Cinzel (display) + Spectral (body).
- **Tvarový jazyk / signature:**
  - Portrét (kruh) obklopený **třemi zabírajícími, točícími se ozubenými koly** (mosaz + patina).
  - **Rohové nýty** (`.rivet`, ne `.rv`!) drží plát; **ozubené kolo** jako oddělovač i prefix nadpisů sekcí; nýt v rohu každé statové dlaždice.
  - Detail: Cinzel nadpisy s ⚙ ikonou, ryté dlaždice statů, mosazný HP bar.
- **Pozn.:** čistá cedulka (koncept 04) i tlakoměr/soukolí/kotel (sada 1) nezvoleny; finální = mechanická.
- **Návrh:** dotažení `scratchpad/bestie-steampunk-tech.html` (čistá varianta v `bestie-steampunk.html`)
### ✅ Post-apokalypsa (`apokalypsa`) — PŘEBUJELÁ DIVOČINA
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅.
- **Atmosféra:** město pohlcené přírodou — mech na betonu, tlumené šedozelené ticho.
- **Tokeny:** mechová zeleň `#7e9c5c` + rez `#a06840` na betonové `#10130e`; fonty Oswald (display) + Spectral (body).
- **Tvarový jazyk / signature:**
  - **Vegetace (výhonky) prorůstá kartu** — nahoře v hlavičce, dole u paty; mechové skvrny v rozích; portrét v zeleném glow rámu. „Příroda kartu pohltila."
  - Detail: Oswald uppercase nadpisy s výhonkovou ikonou, výhonkové odrážky schopností, betonové dlaždice se zeleným okrajem, zelený HP bar.
  - Divoké, houževnaté (ne elegantní elfí úponky Fantasy).
- **Pozn.:** vzniklo z 2. (divočejší) sady — uživatel: beton moc jednoduchý, výhonky správný směr „ale víc bláznivé". Sada 2 měla i bio-anomálii / koláž / toxickou zónu (nezvoleno). Sada 1 (beton/sprej/plevel/štítek) taky nezvolena.
- **⚠️ Past:** vegetace jako `position:absolute` DEJ do hlavičky + paty, ne na celou kartu (jinak prorostne přes detail — viz cyberpunk neon).
- **Návrh:** `scratchpad/bestie-postapo-koncepty2.html` (koncept 01) → dotažení `scratchpad/bestie-postapo.html`
### ✅ Horor (`horor`) — ZAPRÁŠENÁ FOTOGRAFIE
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅.
- **Atmosféra:** opuštěné sídlo — slábnoucí svíčka, prach a tma za každými dveřmi.
- **Tokeny:** tlumené svíčkové zlato `#c89a52` + prachová `#8a8478` na téměř černé `#090807`; fonty IM Fell English (display) + Cormorant Garamond (body).
- **Tvarový jazyk / signature:**
  - Portrét jako **stará sépiová fotografie** v ohmataném dřevěno-mosazném rámečku; **pavučiny v rozích** karty + **prasklé sklo** přes portrét.
  - Detail: IM Fell nadpisy s ✦ ornamentem, sépiové/prašné dlaždice, svíčkový HP bar, ✦ odrážky, poznámky jako inkoustový zápis.
  - Melancholicky děsivé — NE krev (to má Dark Fantasy); tady prach, stáří, ticho.
- **Pozn.:** sada měla i svíčku v temnotě / drápovou stopu / ohořelý deník (nezvoleno).
- **Návrh:** `scratchpad/bestie-horor-koncepty.html` (koncept 02) → dotažení `scratchpad/bestie-horor.html`
### ✅ Mystery (`mystery`) — VYŠETŘOVACÍ NÁSTĚNKA + razítko NEVYŘEŠENO
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅.
- **Atmosféra:** deštivá noirová ulice — žluté světlo lampy v šedomodré mlze.
- **Tokeny:** žlutá lampa `#d8a24a` + šedomodrá `#5e7488` na modročerné `#0c0f14`; fonty Cinzel (display) + Crimson Pro (body).
- **Tvarový jazyk / signature:**
  - Portrét jako **nakloněný polaroid** (bílý rám) přišpendlený **červeným špendlíkem**; z okolí vedou **žluté provázky** (conspiracy board).
  - **Razítko „NEVYŘEŠENO"** (rotované, žluté) v hlavičce (vypůjčeno z konceptu 01 spis).
  - Detail: Cinzel nadpisy s ◆, žlutý HP bar, karteta-dlaždice, ◆ odrážky, poznámky jako detektivův zápis.
  - Detektivní styl (uživatel to explicitně chtěl).
- **⚠️ Past:** provázky jako `position:absolute` DEJ do hlavičky, ne na celou kartu (jinak v rozbaleném přes detail).
- **Pozn.:** sada měla i spis / deštivé noir okno / forenzní lupu (nezvoleno; razítko ze spisu přeneseno).
- **Návrh:** `scratchpad/bestie-mystery-koncepty.html` (koncept 02 + razítko z 01) → dotažení `scratchpad/bestie-mystery.html`
### ✅ Historický (`historie`) — BAROKNÍ RÁM + KORUNA
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅.
- **Atmosféra:** barokní dvorní sál — vinná červeň, staré zlato a mahagon ve světle svící.
- **Tokeny:** staré zlato `#bd9a4e` + vinná červeň `#8a3b3a` na mahagonu `#160d0c`; fonty Cormorant (display) + EB Garamond (body).
- **Tvarový jazyk / signature:**
  - Portrét jako **olejomalba** ve zlaceném **barokním akantovém rámu**, nad rámem **zlatá koruna**.
  - Detail: Cormorant nadpisy s ❦ fleuronem, zlaté dlaždice statů (mahagon + highlight), zlatý HP bar, ❦ odrážky, poznámky jako kronikový zápis.
  - Opulentní dvorní galerie — NE světlý pergamen, ale honosný sál.
- **Pozn.:** vzniklo ze sady 2 (uživatel chtěl koncept 1 rám + korunu z heraldiky). Sada 1: rám/rukopis/štít/pečeť. Sada 2: rám+koruna / medailon / kartuš / samet (nezvoleny 2-4).
- **Návrh:** `scratchpad/bestie-historie-koncepty2.html` (koncept 01) → dotažení `scratchpad/bestie-historie.html`
### ✅ Současnost (`moderni`) — POLAROID NA DŘEVĚ
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅.
- **Atmosféra:** útulný večerní interiér — teplé světlo lampy, dřevo a měkký textil.
- **Tokeny:** terakota `#c87e54` + šalvějová zeleň `#7d9478` na teplé hnědé `#15110d`; fonty Fraunces (display) + Newsreader (body).
- **Tvarový jazyk / signature:**
  - Portrét jako **polaroid fotka** (bílý okraj) ležící **našikmo** na dřevěném podkladu, ručně psaný popisek, měkký stín.
  - Detail: Fraunces nadpisy, čisté zaoblené dlaždice, terakota HP bar, jednoduché odrážky, poznámka jako ručně psaný lístek.
  - Cozy/hygge moderní — NE studený korporát; teplé, osobní, „ze zásuvky vzpomínek".
- **Pozn.:** sada měla i app kartu / textilní plátno / profilovou kartu (nezvoleno).
- **Návrh:** `scratchpad/bestie-moderni-koncepty.html` (koncept 02) → dotažení `scratchpad/bestie-moderni.html`
### ✅ Western (`western`) — ŠERIFSKÁ HVĚZDA NA DŘEVĚ
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅.
- **Atmosféra:** prašné pohraniční městečko za soumraku — vybledlé dřevo, teplé světlo.
- **Tokeny:** soumrační oranžová `#cf8a44` + vybledlá khaki `#8a8a64` na hnědé `#171009`; fonty Rye (display, kovbojský) + Spectral (body).
- **Tvarový jazyk / signature:**
  - Portrét uprostřed **realisticky kovové šerifské hvězdy** (kovový gradient lesk, ražené nýty na hrotech, leštěný prstenec) **přibité na ošlehané dřevěné prkno** (dřevěná textura karty).
  - Detail: Rye nadpisy s ★, dřevěné dlaždice statů, oranžový HP bar, ★ odrážky, poznámka jako zápis.
  - Kovbojská klasika — Rye font nese identitu.
- **Pozn.:** vzniklo ze sady 2 (uživatel: hvězda #3 zajímavá, ale „dopracovat graficky" → realistický kov). Sada 1: wanted/kůže/hvězda/vývěska. Sada 2: kov hvězda / na dřevě / kůže+laso / ražený odznak (nezvoleny ostatní).
- **Návrh:** `scratchpad/bestie-western-koncepty2.html` (koncept 02) → dotažení `scratchpad/bestie-western.html`
### ✅ Ikaros (`ikaros`) — SYNTHWAVE SLUNCE
- **Stav:** hotovo (na drdplus) — sbaleno + rozbaleno ✅.
- **Atmosféra:** fialové synthwave — neonové město pod hvězdnou oblohou a déšť kódu (brand platformy).
- **Tokeny:** fialový neon `#a96cff` + světle fialová `#d8ccff` na noční `#0c0820`; fonty Orbitron (display) + Rajdhani (body).
- **Tvarový jazyk / signature:**
  - Portrét vsazený do **pruhovaného synthwave slunce** (kruh s vodorovnými pruhy), **perspektivní mřížka** u paty karty, hvězdné pozadí, fialový neon glow.
  - Detail: Orbitron nadpisy, neonové dlaždice statů, fialový HP bar, neonové odrážky.
  - 80s retro-futuro brand Ikara — odlišené od studeného sci-fi (cyan HUD) fialovou synthwave estetikou.
- **Pozn.:** sada měla i déšť kódu (matrix rain) / outrun rám / neonové prstence (nezvoleno).
- **Návrh:** `scratchpad/bestie-ikaros-koncepty.html` (koncept 01) → dotažení `scratchpad/bestie-ikaros.html`
