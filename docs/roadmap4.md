# Roadmap 4 — Projekt Ikaros · Etapa IV

**Systémy, licence a stavba světů — legální maximum bez vyjednané smlouvy**

**Stav:** návrh k diskuzi (nic z Etapy IV nezačato)
**Vznik:** 2026-07-20 — syntéza z: (a) dvou právních podkladů (GPT rešerše v0.4 + interní realizační návrh 2026-07-19) brané jako **hypotézy k ověření, ne pravda**, (b) **vlastní internetové rešerše primárních zdrojů** (11 systémů × research → návrh → adversariální verify + 5 právních konceptů; ~38 agentů), (c) recon skutečného kódu FE k HEAD. Každé tvrzení dokumentů bylo **potvrzeno / vyvráceno / upřesněno** proti primárnímu zdroji.
**Navazuje na:** `roadmap3.md` (Etapa III) — jeho „Mimo scope" bod 1 tuto etapu výslovně rezervuje: *„Jednotlivé herní systémy a licence … bude řešit budoucí roadmapa (Etapa IV)."*
**Repo:** FE `Projekt-ikaros-FE` · BE `Projekt-ikaros`
**Podklad (zdroj pravdy — rešerše se NEopakuje, čerpá se odsud):** [roadmap4-podklad.md](roadmap4-podklad.md) (ověřená evidence per systém: licence + citace + permits/requires/prohibits + buildable + adversariální guardraily + disclaimery/atribuce + zdroje) · [roadmap4-data.json](roadmap4-data.json) (strojová data)

> ⚖️ **Toto NENÍ právní stanovisko.** Je to technicko-produktová rešerše s primárními zdroji. Každou kartu s právním základem **musí před ostrým (a zvlášť komerčním) nasazením potvrdit český advokát**. Roadmapa je psaná tak, aby ji šlo **auditovat po řádcích**: každá buildable položka nese svůj právní základ, guardraily z adversariální kontroly a jasný gate (build teď / build-ale-gated / až po licenci).

> **Jak číst tuto roadmapu.** Stejné jako roadmap2/3: karty s checkboxy `[ ]`/`[x]`, **pořadí = priorita provedení, žádné termíny**. Karta se odškrtne, až je hotová a ověřená. Workflow beze změny: **spec → souhlas → impl. plán → souhlas → kód** (`spec-driven-development`), u UI `frontend-design` + `mobil-desktop`, změna funkčnosti → `funkce` + `napoveda`.
>
> **Cíl Etapy IV.** Postavit systémy pro světy **naplno, ale legálně** — na dostupných licencích a na volné herní mechanice (§2 odst. 6 AutZ). Kde licence dovolí hodně (D&D SRD, Fate, JaD, ORC/YZE enginy), stavíme naplno. Kde je systém uzavřený (DrD rodina, Dračí Hlídka, Shadowrun, CoC, GURPS), stavíme **generickou vrstvu vlastními slovy teď** a *oficiální obsah* předpřipravíme, ale **držíme za manifestem** — až dorazí licence, jen se přepne spínač (vzor už v kódu: [drd2Abilities.ts](../src/features/world/pages/CharacterDetailPage/diary-systems/sheets/drd2/drd2Abilities.ts) — 264 schopností „k ruce", odpojených od UI).

---

## Legální maximum — souhrnná matice

> **Toto je přímá odpověď na „co všechno můžu v rámci systémů".** Strop = nejvyšší legální úroveň bez vyjednané smlouvy, ověřeno z primárních zdrojů.

| Systém | Strop | Licenční základ (ověřeno) | Co postavím TEĎ | Co je gated do licence |
|---|---|---|---|---|
| **D&D 5e** | 🟢 rich-open | SRD **5.2.1** (i 5.1) pod **CC BY 4.0**, výhradně CC, **bez OGL**, irevokovatelné, komerční | **vše L0–L3** vč. plného textu SRD kouzel/monster, doslovné pasáže, VTT, AI, komerčně | — (nic; kryto CC) |
| **Fate / FAE** | 🟢 rich-open | EN SRD (Core/FAE/Condensed) **CC BY 3.0 Unported**, komerční | vše L0–L3 z EN SRD, VTT, AI, komerčně | — (jen: vlastní CZ překlad, ne d20.cz) |
| **Jeskyně a Draci** | 🟢 rich-open | **Komunitní licence pro 3. strany** (publ. 2025-12-02), pravidla/schopnosti/kouzla/termíny, komerční | L0–L3 v rozsahu licence, VTT, AI | VTT komerčně → potvrzení Mytago |
| **ORC / YZE enginy** | 🟢 rich-open | **BRP UGE** (ORC License) · **Year Zero Engine SRD** (FTL) — plný text + VTT + AI *výslovně* | plnohodnotný **odbrandovaný** engine (horor d100 / dice-pool) | — (jen: bez cizí značky/artu) |
| **Příběhy Impéria** | 🟡 moderate-open | dvouvrstvé: **Fate engine** open (CC BY 3.0) · **setting/značka Mytago** all-rights-reserved | generický Fate engine (L0–L2 + prázdné L3) | celý PI setting/obsah → smlouva Mytago |
| **Call of Cthulhu** | 🟡 fan-noncommercial | odbrandovaně: **BRP/ORC** (komerční) · CoC-brand: **Chaosium Fan Policy** (nekomerční, jen web) | odbrandovaný d100 engine (komerčně) + CoC-brand fan list (nekomerčně) | CoC-specifický obsah/monster/kouzla → licence Chaosium |
| **Dračí doupě 1.6** | 🔴 reference-only | DrD Lite „volně šiřitelná" ≠ licence na odvozené nástroje; obsah © ALTAR | L0–L2 vlastními slovy + vlastní VTT + AI-originál | katalogy/oficiální obsah → smlouva ALTAR |
| **Dračí doupě Plus** | 🔴 reference-only | obsah © ALTAR (bez veřejné licence); `drdplus.info` **kód** MIT ≠ práva k datům | L0–L2 **reimplementací ze vzorce** + vlastní VTT + AI | katalogy kouzel/bestiář (text/flavor) → ALTAR |
| **Dračí doupě II** | 🔴 reference-only | obsah © ALTAR, žádná veřejná licence | L0–L2 vlastními slovy + prázdné kontejnery | katalog 264 ZS (už „k ruce") → ALTAR |
| **Dračí Hlídka** | 🔴 reference-only | zapsané známky BlackTower; LITE ≠ licence; vlastní digitál | L0–L2 vlastními slovy + vlastní VTT | veškerý oficiální obsah → smlouva BlackTower |
| **GURPS** | 🔴 reference-only | SJ Games Online Policy = fan, nekomerční; žádná platformová licence | L0–L2 vlastními slovy (point-buy) + vlastní VTT | katalog výhod/dovedností → licence SJ Games |
| **Shadowrun** | 🔴 reference-only | žádná OGL/SRD/ORC/CC; Holostreets = jen marketplace publikace, **ne web/VTT** | generický kyberpunk engine (i bez pojmenování) | veškerý SR obsah/setting → smlouva Catalyst/Topps |

**Legenda stropů:** 🟢 rich-open (stavíme naplno vč. oficiálního obsahu z licence) · 🟡 částečně (jedna vrstva open, druhá blokovaná) · 🔴 reference-only (generická vrstva vlastními slovy teď; oficiální obsah až po smlouvě).

> 💡 **Klíč napříč všemi systémy:** herní **mechanika je volná** (§2 odst. 6 AutZ — postup/metoda/vzorec/údaj sám o sobě není dílo). Blokuje se jen **konkrétní vyjádření** (text pravidel, flavor, popisy), **výběr/uspořádání rozsáhlého katalogu** (sui generis databáze §88+), **grafika/ilustrace/mapy** a **ochranná známka**. Proto skoro každá „generická" vrstva (vlastní VTT, výpočet ze zadaných hodnot, AI-originál, import/export vlastních dat) je **postavitelná i u closed systémů — a i komerčně**.

---

## Adjudikace tvrzení dokumentů (co rešerše potvrdila / vyvrátila / upřesnila)

| # | Tvrzení z podkladů | Výsledek | Ověřeno |
|---|---|---|---|
| 1 | „D&D SRD 5.1 i 5.2.1 pod CC BY 4.0; OGL 1.0a volitelně" | **UPŘESNĚNO** | SRD 5.2.1 je **výhradně CC BY 4.0, bez OGL**; irevokovatelné, komerční, VTT/AI/překlad povolené |
| 2 | „JaD licence možná nepokrývá SaaS/VTT — nejistota" | **UPŘESNĚNO** | Komunitní licence pro 3. strany **výslovně** dovoluje pravidla/komerci/sublicenci; **VTT komerčně** ale radši písemné potvrzení Mytago; licence bez verze → před komerčním nasazením re-ověřit |
| 3 | „drdplus.info může být otevřená cesta k obsahu DrD+" | **ČÁSTEČNĚ VYVRÁCENO** | MIT je jen na **kódu** (Tyc), **ne** na herních datech/právech ALTARu; bezpečné = **nezávislá reimplementace ze vzorce**, ne přepis tabulek; obsah zůstává closed |
| 4 | „Příběhy Impéria = blocked" | **UPŘESNĚNO** | Blokovaný je jen **setting/značka**; **generický Fate engine** (CC BY 3.0) je stavitelný |
| 5 | „CoC autofill sheet je dovolený" | **UPŘESNĚNO** | Ano dle Fan Policy, ale **nekomerčně a jen web**, mimo placený tier; komerční cesta jen **odbrandovaně přes BRP/ORC** |
| 6 | „Fate = CC BY 3.0; český překlad = CC BY-NC-SA" | **POTVRZENO** | + guardrail: **nepoužívat d20.cz překlad** (NC = komerčně jed), vlastní CZ překlad z EN |
| 7 | Riziková % skóre z realizačního návrhu | **OZNAČENO SUBJEKTIVNÍ** | Nejsou měřitelný fakt; roadmapa je nepoužívá jako právní argument |
| 8 | „Shadowrun Holostreets = cesta" | **POTVRZENO/UPŘESNĚNO** | Holostreets kryje jen **publikace na DriveThruRPG**, ne web/VTT/aplikaci |
| 9 | Kód: „SEO landingy systémů jsou veřejné (riziko)" | **VYVRÁCENO (zastaralé)** | `SYSTEM_LANDINGS_PUBLIC = false` — už vypnuté (spec-25.8) |
| 10 | Nově nalezená legální cesta pro closed žánry | **NÁLEZ** | **BRP UGE (ORC)** a **YZE SRD (FTL)** dávají plný text + VTT + AI *výslovně* — odbrandovaně |

---

## Mimo scope Etapy IV (vědomě)

1. **Vyjednávání konkrétních licencí** s vydavateli — externí brána; roadmapa jen předpřipraví aktivaci (fáze 37 ⛔).
2. **Právní identita organizace / advokátní schválení** — externí; každá 🟢/🟡 karta má před ostrým komerčním nasazením ⛔ „lawyer-review" checkbox.
3. **Ikaros / Matrix vlastní systém a `generic`** — nejsou předmětem této roadmapy (řeší se jinde; `generic` je vždy legální jádro).
4. **AI trénink na cizích textech** — zakázáno; AI generátory pracují jen s mechanikou a vlastními/licencovanými daty (viz průřezové principy).

---

## Přehled fází Etapy IV

| # | Název | Podstata | Stav |
|---|-------|----------|------|
| 32 | Právní jádro & systémová architektura | manifest práv · allowlist · atribuce/disclaimer · notices · provenance · DSA · UGC | ⬜ |
| 33 | Otevřené systémy (rich-open) | D&D 5e SRD · Fate/FAE · JaD — stavíme naplno | ⬜ |
| 34 | Otevřené enginy jako generická cesta | BRP/ORC (horor d100) · YZE (dice-pool) — legální bez značky | ⬜ |
| 35 | Polootevřené | Příběhy Impéria (Fate) · Call of Cthulhu (fan + BRP) | ⬜ |
| 36 | Uzavřené systémy (reference-only + gated) | DrD 1.6 · DrD+ · DrD II · Dračí Hlídka · GURPS · Shadowrun | ⬜ |
| 37 | Aktivační brána per systém | ⛔ příchod licence → flip statusu → light-up + testy | ⬜ |
| 38 | Beta-gate subset (cross-ref roadmap3) | Terms text · Miskatonic · allowlist reconcil. | ⬜ |

> Legenda: ✅ Hotovo · 🟡 Rozpracováno · ⬜ Čeká · ⛔ blokováno externě (licence/právník) · 🟢/🔴 = strop systému.
>
> **Pořadí:** 32 je vstupní podmínka všeho (bez manifestu/atribuce se nesmí zveřejnit žádný systémový obsah). 33–36 dle stropu (nejvíc hodnoty nejdřív). 37 běží průběžně, jak dorazí licence. 38 je podmínka veřejné bety (cross-ref roadmap3 fáze 31).

## Průřezové právní principy Etapy IV (závazné pro každou kartu)

1. **Mechanika volná, vyjádření chráněné** (§2/6 AutZ). Pravidla/atributy/vzorce/tabulky holých hodnot/iniciativu **reimplementuj** libovolně. **Doslovný text pravidel, flavor, popisy kouzel/předmětů/bestií, dobrodružství NIKDY nekopíruj** — přepiš vlastními slovy, vlastní strukturou. Výjimka: kde licence (CC/ORC/JaD) doslovný text *výslovně dovolí* + atribuce.
2. **Cizí katalog nepřebírej jako celek** (sui generis databáze §88+/§90). Ani „samá fakta" — podstatná část cizí kompilované DB je chráněná. Nescrapovat konkurenční RPG databáze.
3. **Vlastní databáze = aktivum.** Ke každé položce katalogu povinně pole `origin/source`, `license`, `isOriginal`, `attribution`. Umožní filtrovat veřejné vs. privátní, prokázat původ a automaticky blokovat sdílení chráněného.
4. **Atribuce CC = podmínka platnosti licence** (TASL: Title, Author, Source, License — vše jako odkaz). U 4.0 je 30denní náprava, u 3.0 licence zaniká automaticky. Preferuj **CC BY / CC0**; **NIKDY NC** (CC BY-NC* blokuje budoucí monetizaci); **CC BY-SA jen obezřetně** (copyleft nákaza na adaptace).
5. **Ochranná známka: slovní název ANO (jen nezbytně), logo/trade dress NE.** Bezpečné: „deník kompatibilní s <systém>". Rizikové (zakázané): „oficiální", „ve spolupráci", logo, doména/název produktu = cizí značka. Vlastní brand Ikaros musí být vizuálně **dominantní**, cizí značka podřízená + disclaimer „…není spojen ani schválen…". Interně: neutrální `slug`/enum oddělený od zobrazovaného názvu (už máme [systemId.ts](../src/features/world/systemId.ts)).
6. **Grafika/ilustrace/mapy/fonty** cizích vydavatelů **NIKDY**. Jen vlastní, AI-generované nebo CC/otevřeně licencované assety — s asset ledgerem (zdroj+licence+atribuce).
7. **AI generátor** produkuje jen **originální mechaniku/staty**; výstupní filtr proti verbatim chráněnému textu **i proti cizím proper nouns/setting IP**; povinné označení „neoficiální homebrew".
8. **UGC = odpovědnost uživatele + DSA notice-and-action.** Tlačítko „Nahlásit" u každé UGC plochy; entity `notice` + `statement of reasons`; append-only audit; soft-delete (SoR nikdy nemaž); kontaktní místo (čl. 11); T&C popíše moderaci (čl. 14). Micro/small výjimka z Oddílu 3 DSA. Žádná obecná monitorovací povinnost (čl. 8).
9. **Import je rizikový vektor** — nedodávej předinstalované balíčky s cizím obsahem; importovaný obsah = odpovědnost uživatele; validuj/označuj.
10. **Fail-closed.** Systém se do veřejné produkce nedostane defaultně — jen přes allowlist a schválený manifest. „Schované v UI" nestačí (nesmí do bundlu/API/SEO/seedu).

---

## Fáze 32 — Právní jádro & systémová architektura
**Vstupní podmínka všeho.** Bez manifestu, atribuce a DSA vrstvy se nesmí zveřejnit žádný systémový obsah. Staví na existujícím [systemId.ts](../src/features/world/systemId.ts) (`resolveSystemId` + `SYSTEM_ALIASES`) — ten je základ, rozšíří se o práva.

### - [ ] 32.1 Manifest práv per systém (rozšíření resolveSystemId) — [dopad vysoký · náklad střední]
**Cíl:** Jediný zdroj pravdy o systému: `id` (canonical), `displayName`, `legalBasis` (`owned|cc-by-4.0|cc-by-3.0|orc|yze-ftl|community-license|fan-policy|none`), `licenseName/Url/version`, `status` (`draft→researching→counsel_review→approved_open|approved_contract→enabled`), `approvedTargets` (bundle/api/seo/seed/ugc), `attributionHtml`, `disclaimerHtml`, `allowedContentDepth` (L0–L4), `commercialSafe`, `provenanceRequired`.
**Guardrail:** FE/BE/sitemap/seed/help čtou **jen** manifest; build fail, pokud `enabled` bez atribuce/disclaimeru nebo target mimo licenci.

### - [ ] 32.2 LEGAL_PROFILE allowlist (fail-closed) — [dopad vysoký · náklad malý]
**Cíl:** Produkce načte jen `status=enabled` systémy dle profilu; ne „všechno kromě zakázaného". Default beta = `generic` + `matrix` (mimo tuto roadmapu).

### - [ ] 32.3 Atribuce + disclaimer komponenta (data-driven, TASL) — [dopad vysoký · náklad střední]
**Cíl:** Komponenta čte manifest a renderuje viditelnou atribuci (Title/Author/Source/License jako odkazy) + disclaimer u každého systémového povrchu (deník, landing, export). PDF/tisk = celé URL textem.

### - [ ] 32.4 Per-položka provenance ve všech katalozích — [dopad vysoký · náklad střední]
**Cíl:** Pole `origin/source`, `license`, `isOriginal`, `attribution`, `systemPackageId` u kouzel/schopností/bestií/předmětů/herbáře/lektvarů. Umožní filtr „co lze veřejně sdílet".

### - [ ] 32.5 Stránka „Oznámení třetích stran" + THIRD_PARTY_NOTICES — [dopad střední · náklad malý]
**Cíl:** Veřejná route `/ikaros/licence` generovaná z manifestů (název, verze, licence, atribuce, disclaimer, vlastní změny) + build-time `THIRD_PARTY_NOTICES.md` + strojově čitelný JSON.

### - [ ] 32.6 DSA notice-and-action vrstva — [dopad vysoký · náklad střední] 👑
**Cíl:** Tlačítko „Nahlásit" u každé UGC plochy; entity `notice` (reportedEntity, exactUrl, reason, notifier, goodFaith, status, decision, audit) + `statement of reasons` (actionType, scope, facts, automatedFlag, appealPath); append-only audit; soft-delete; kontaktní místo (čl. 11). *(Kód už rozlišuje copyright jako důvod hlášení — rozšířit.)*

### - [ ] 32.7 UGC rights metadata + import guard — [dopad vysoký · náklad střední]
**Cíl:** U sdíleného UGC oddělit viditelnost / aplikační oprávnění / autorskou licenci; `rightsBasis`, `licenseId` (jen ARR/CC0/CC-BY/CC-BY-SA), `containsThirdPartyMarks`. Import validuje/označuje; žádné předinstalované cizí balíčky.

---

## Fáze 33 — Otevřené systémy (rich-open): stavíme naplno
**Tady je nejvíc hodnoty.** Licence dovolují i oficiální obsah — postavíme kompletní systém včetně katalogů.

### - [ ] 33.1 D&D 5e — 🟢 rich-open · SRD 5.2.1 (i 5.1) / CC BY 4.0
**Legální strop:** vše L0–L3 vč. **plného textu SRD**, VTT, AI, **komerčně** — kryto CC BY 4.0 (irevokovatelné).
**Build teď:**
- [ ] deník L0/L1 — pole 5E (6 vlastností, zdatnost, záchrany, dovednosti), struktura vlastní
- [ ] výpočty L2 — modifikátory, zdatnostní bonus, DC, iniciativa
- [ ] katalog L3 — kouzla / rysy / předměty **jen ze SRD 5.2.1** vč. plného textu do DB
- [ ] bestiář L3 — monstra ze SRD vč. plných statbloků
- [ ] taháky — vlastními slovy **nebo** doslovný SRD text + atribuce (doslovný je bezpečnější než těsná parafráze)
- [ ] taktická mapa + tokeny (vlastní VTT)
- [ ] landing/SEO — název **„kompatibilní s pátou edicí"** (ne „D&D" jako brand)
- [ ] AI generátor „5E kompatibilní" — grounding jen na SRD
- [ ] ⛔ lawyer-review před komerčním nasazením
**Guardraily (z verify):** per-surface atribuce u zobrazeného SRD textu (ikona „zdroj SRD 5.2.1"); položky jen z 5.1 atribuovat zvlášť; **žádné logo/wordmark/ampersand D&D**; **disclaimer NESMÍ jmenovat Wizards jako kredit** (implikuje endorsement) — použij obecné „ochranné známky jsou majetkem příslušných vlastníků"; import validuje SRD/vlastnictví; AI grounding korpus oddělený, filtr na non-SRD text.
**Avoid:** „Dungeons & Dragons" jako název systému; „5E" jako název produktu/loga (jen neformální zkratka); mimo-SRD obsah (Beholder, mind flayer, settingy, Forgotten Realms).

### - [ ] 33.2 Fate / FAE — 🟢 rich-open · EN SRD (Core/FAE/Condensed) / CC BY 3.0
**Legální strop:** vše L0–L3 z EN SRD, VTT, AI, komerčně — nejliberálnější CC.
**Build teď:**
- [ ] deník L0/L1 — High Concept, Trouble, Aspects, u FAE 6 Approaches
- [ ] výpočty L2 — stresová políčka dle Physique/Will, žebřík Terrible…Legendary
- [ ] katalog L3 — Skills / Approaches / Stunts z EN SRD s atribucí
- [ ] statbloky L3 — jen **generické** tvory/NPC (aspekty, skills, stres, stunty)
- [ ] taháky — čtyři akce, čtyři výsledky, žebřík, FP ekonomika
- [ ] zónová mapa + tokeny (Fate používá zóny, ne grid)
- [ ] landing „nástroje pro hru Fate Core" (popisně) + AI generátor
- [ ] ⛔ lawyer-review před komerčním nasazením
**Guardraily (z verify):** **NEbrat český překlad d20.cz** (CC BY-NC-SA — komerčně jed); vlastní CZ překlad **jen z EN CC BY 3.0**; **nepoužívat Fate Core font ani ikonografii čtyř akcí / Fudge kostek** — vlastní/textové symboly; z World SRD (Atomic Robo) jen generické statbloky, **ne pojmenované postavy/settingy**; „Fate" jen popisně, **ne v názvu produktu/domény/hero-nadpisu**; atribuce dle CC BY 3.0 §4(b), bez DRM §4(a).

### - [ ] 33.3 Jeskyně a Draci — 🟢 rich-open · Komunitní licence pro 3. strany (publ. 2025-12-02)
**Legální strop:** L0–L3 v rozsahu licence (pravidla, schopnosti, kouzla, termíny), VTT, AI, komerčně.
**Build teď:**
- [ ] deník L0/L1 — JaD pole (atributy, povolání, úrovně, dovednosti, záchrany)
- [ ] výpočty L2 — modifikátory, HP, KZ, DC, nosnost, iniciativa
- [ ] katalog L3 — kouzla / schopnosti povolání / předměty (mechanická data)
- [ ] bestiář L3 + mechanické statbloky pro tokeny
- [ ] taháky, taktická mapa, import/export, AI generátor JaD-kompatibilního homebrew
- [ ] povinný **disclaimer dle licence + komunitní logo** (v povolené podobě)
- [ ] ⛔ re-ověřit aktuální znění licence + (VTT komerčně) písemné potvrzení Mytago
**Guardraily (z verify):** **žádné oficiální ilustrace** (obálky/mapy/artworky/tokeny) nikde; **nekopírovat doslovné bloky textu**; z fan projektu **JaDsrd (d20.cz) brát jen mechanická/číselná fakta, prózu ne** (nemá pro nás licenci); nescrapovat cizí kompilovanou DB jako celek; licence nemá verzi → před komercí re-ověřit; AI/obsah — content-policy filtr + označení dospělého/horor obsahu.

---

## Fáze 34 — Otevřené enginy jako generická cesta (bez cizí značky)
**Legální „náhrada" i pro žánry uzavřených systémů.** Plný text SRD + VTT + AI *výslovně* povolené — jen odbrandovaně.

### - [ ] 34.1 BRP „Vyšetřovací horor d100" — 🟢 ORC License · Basic Roleplaying UGE (Chaosium)
**Legální strop:** plný text BRP SRD, software/VTT/AI **výslovně povoleno**, komerčně. Reciprocita: mechanické přídavky jsou automaticky ORC.
**Build teď:**
- [ ] kompletní d100 engine (charakteristiky, dovednosti, poškození, příčetnost-styl mechanika) z BRP ORC Content Document
- [ ] deník + výpočty + katalogy + bestiář (generičtí tvorové) + VTT + AI
- [ ] landing „Vyšetřovací horor d100 (BRP-kompatibilní)"
- [ ] povinné **ORC Notice** + atribuce v každém exportu/landingu
**Guardraily:** **NE** „Call of Cthulhu / RuneQuest / Pendragon" název; **žádný Chaosium artwork/trade dress/runy/Star Elder Sign**; přejmenovat cizí proper nouns; před publikací vědomě rozhodnout, co je Ikaros ORC vklad (neodvolatelné).

### - [ ] 34.2 YZE „Dice-pool systém (Rok nula-kompatibilní)" — 🟢 Year Zero Engine SRD / FTL
**Legální strop:** YZE SRD v1.0; FTL **výslovně povoluje „VTT modul"**, komerčně.
**Build teď:**
- [ ] step-die/dice-pool engine + deník + výpočty + VTT + AI
- [ ] povinné YZE notice + odkaz na licenci + „not affiliated"
**Guardraily:** jen SRD — **žádné settingy/značky Free League** (Vaesen, Mutant, Forbidden Lands, Alien, Blade Runner, T2000); FTL **vylučuje NFT a video games** (Ikaros web = OK).

> 💡 Tyto dva enginy dávají hráčům **plnohodnotný horor/percentilový i dice-pool zážitek legálně teď** — a jsou „generic fallback" pro světy, které by jinak sáhly po CoC/Shadowrunu.

---

## Fáze 35 — Polootevřené systémy

### - [ ] 35.1 Příběhy Impéria — 🟡 moderate-open · Fate engine open, setting Mytago blocked
**Legální strop:** generický Fate engine (jako 33.2); **setting/značka/obsah PI = blocked** bez smlouvy Mytago.
**Build teď:**
- [ ] generický Fate deník + výpočty (žebřík, FP) + zónová mapa + 4dF kostky + AI Fate-originál
- [ ] **prázdné** buildery stuntů/schopností/předmětů + prázdná šablona bestiáře (uživatel plní)
- [ ] tahák generického Fate (verbatim Fate Condensed/Core SRD + atribuce)
- [ ] landing **výhradně „Fate-kompatibilní"**
**Guardraily (z verify):** marketing **NIKDY „kompatibilní s pravidly Příběhů Impéria"** — jen „Fate Core"; nepřebírat PI-specifické divergentní subsystémy jako „Fate"; **sui generis** — žádné vytěžování PI katalogů (Rukověť mága apod.); „Powered by Fate" logo **nepoužívat** (nebo písemné svolení Evil Hat); atribuční blok viditelně v patičce, per SRD.
**Gated do smlouvy Mytago:** celý PI setting, svět, terminologie, seznamy schopností/kouzel, bestiář, statbloky, ilustrace, značka.

### - [ ] 35.2 Call of Cthulhu — 🟡 fan-noncommercial · odbrandovaně přes BRP/ORC (34.1)
**Legální strop:** dvě cesty — **(A) odbrandovaný BRP/ORC engine = komerčně** (34.1); **(B) CoC-brandovaný fan artefakt = nekomerčně, jen web.**
**Build teď (A — doporučeno):**
- [ ] plný horor engine přes 34.1 (bez CoC značky) — komerčně, plnohodnotně
**Build teď (B — CoC brand, nekomerčně):**
- [ ] CoC-brandovaný autofill charakterový list jako **fan artefakt** — d100 struktura vlastními slovy
- [ ] referenční katalog (názvy kouzel/tvorů/božstev + **krátký vlastní popis**, prázdný skelet statbloku)
- [ ] landing nominativní „kompatibilní s Call of Cthulhu 7e" + disclaimer
**Guardraily (z verify):** CoC-brand povrch **mimo jakýkoli placený tier** (nepřímá monetizace banner/tip jar/Patreon OK, **účtovat za přístup NE**); **žádné logo Chaosium/CoC, Star Elder Sign, Miskatonic trade dress** *(pozn.: „Miskatonic" je aktuálně v `coc.css`/`CocSheet.tsx` — odstranit, viz 38.2)*; citace max 1–2 věty se zdrojem; Ikaros dodává jen **prázdný skelet**, nepředvyplňuje oficiální hodnoty; sui generis — nereprodukovat výběr/uspořádání Chaosium; AI filtr i na Chaosium-originální Mythos.
**Gated do licence Chaosium:** CoC-specifický obsah (plné statbloky, kouzla, scénáře, handouty), komerční CoC-brand režim, VTT plně brandovaný jako CoC.

---

## Fáze 36 — Uzavřené systémy (reference-only + gated)
**Vzor pro všechny:** L0–L2 vlastními slovy **teď** + vlastní VTT + AI-originál; **oficiální obsah (L3) postav, ale drž za manifestem** (`status≠enabled`) — vzor [drd2Abilities.ts](../src/features/world/pages/CharacterDetailPage/diary-systems/sheets/drd2/drd2Abilities.ts). Landing jen nominativně. Žádné logo/text/tabulky/ilustrace.

### - [ ] 36.1 Dračí doupě 1.6 — 🔴 reference-only (© ALTAR; DrD Lite ≠ licence na nástroje)
**Build teď:** deník L0/L1 (struktura vlastními slovy) · výpočty L2 (ze vzorce) · prázdné kontejnery katalogů · vlastní VTT · AI-originál · import/export · landing „kompatibilní s Dračí doupě 1.6".
**Gated do smlouvy ALTAR:** katalogy povolání/kouzel/předmětů, bestiář, doslovný text/tabulky.
**Guardraily (z verify — 7 nálezů):** reimplementace mechaniky z principu, **ne přepis tabulek** (sui generis DB — zákaz i po jednotlivých položkách); **žádný předvyplněný preset zrcadlící DrD sadu** (názvy+pořadí+hodnoty) — šablonu vytváří uživatel; labely odvozených hodnot generické/uživatelské, DrD termíny nezadrátovat do UI; generický řešitel jen „hod+bonus vs. cíl", **žádné DrD tabulky pastí/prahů**; **pro komerční režim značku neuvádět ani nominativně** jako identifikátor služby; free PDF **jen odkazem na obchod.altar.cz** (nerehostovat, nikdy do placeného tieru); notice-and-takedown, UI neformulovat jako „importuj svá DrD kouzla".

### - [ ] 36.2 Dračí doupě Plus (DrD+) — 🔴 reference-only (© ALTAR; MIT jen na kód drdplus.info)
**Build teď:** deník L0/L1 · **výpočty L2 nezávislou reimplementací ze vzorce** · prázdné katalogy · vlastní VTT · AI-originál · landing nominativně.
**Guardraily (z verify — DrD+ mělo 9 nálezů):** **MIT chrání jen kód Týce, ne data/práva ALTARu** → preferuj vlastní reimplementaci, ne přepis ALTAR tabulek; **před použitím jakéhokoli `drdplus/*` balíčku ověř LICENSE každého balíčku i tranzitivních závislostí** (nepředpokládej MIT z jednoho vzorku); per-package doslovný copyright notice; **neembeddovat/neiframovat/neproxovat/necachovat `*.drdplus.info`** (jen externí odkaz); nominativní základ = **§10 ZOZ / čl. 14 EUTM** (ne US „nominative fair use"); oficiální ALTAR text nikdy na TM token/chat/sdílenou scénu.
**Gated do smlouvy ALTAR:** kouzla/bestiář/svět (Taria, Asterion) jako text/flavor.

### - [ ] 36.3 Dračí doupě II — 🔴 reference-only (© ALTAR)
**Build teď:** deník L0/L1 · výpočty L2 · prázdné kontejnery · vlastní VTT · AI-originál · landing nominativně.
**Gated do smlouvy ALTAR:** katalog 264 zvláštních schopností (**už postaven a „k ruce"** v [drd2Abilities.ts](../src/features/world/pages/CharacterDetailPage/diary-systems/sheets/drd2/drd2Abilities.ts) — přesně cílový vzor: build-then-gate).
**Guardraily (z verify — 7 nálezů):** **nereplikovat ÚPLNÝ oficiální katalog povolání + celý graf podmíněnosti jako datovou sadu** (sui generis DB — i „jen struktura" jako celek); seznamy povolání jako herní fakta **ověřit u právníka**, ne brát jako dané; taháky = tvrdý strop rozsahu, žádné systematické pokrytí kapitoly; AI generátor = **povinná lidská kontrola PJ** (ne volitelná) + zákaz marketingu výstupů jako „DrD II obsah" + provenance/logging; SEO title/meta/OG nesmí implikovat oficiálnost, disclaimer nad ohybem; **ověřit skutečný zápis známek** „Dračí doupě/DrD/ALTAR" v ÚPV/EUIPO/WIPO, disclaimer formulovat tak, ať platí i pro nezapsané-ale-chráněné; notice-and-takedown na obsah odvozený z příruček.

### - [ ] 36.4 Dračí Hlídka — 🔴 reference-only (zapsané známky BlackTower; LITE ≠ licence)
**Build teď:** deník L0/L1 (vlastními slovy) · výpočty L2 · prázdné kontejnery · vlastní VTT · AI-originál · landing jen opatrně nominativně.
**Gated do smlouvy BlackTower:** veškerý oficiální obsah, katalogy, statbloky.
**Guardraily (z verify — 4 nálezy):** aktivní digitální strategie držitele → landing nesmí konkurovat/působit oficiálně, **nepozicovat jako náhradu/ekvivalent** oficiálních aplikací; **opakovaný disclaimer „neoficiální / bez vztahu k Sirael a oficiálním aplikacím DH"**; **NEcílit SEO/klíčová slova na „Sirael" ani název oficiální appky** ani fráze „oficiální/THE Dračí Hlídka"; žádné logo Dračí Hlídka/BlackTower; LITE = ověřit doslovné znění z legální kopie **nebo** formulovat jako „nese výhradu všech práv, neuděluje žádná" (bez uvozovek u citace); notice-and-takedown, neusnadňovat hromadné kopírování.

### - [ ] 36.5 GURPS — 🔴 reference-only (SJ Games Online Policy = fan, nekomerční)
**Build teď:** systémově-neutrální **point-buy** deník · výpočty L2 · prázdné katalogy výhod/nevýhod/dovedností (uživatel plní) · vlastní VTT · AI-originál · landing „kompatibilní s pravidly GURPS" (bez „Powered by GURPS" bez svolení).
**Gated do svolení SJ Games:** katalog výhod/nevýhod/dovedností jako dodaná data; komerční režim.
**Guardraily (z verify — 7 nálezů; GURPS je NEJpřísnější):** Online Policy je **nekomerční a kdykoli odvolatelná** → **TVRDÁ BRÁNA: veškerý GURPS-terminologický uživatelský obsah = privátní + nekomerční, NIKDY do showcase / marketplace / klonu / freemium / streamer-overlay / placeného tieru**; VTT **nikdy neinzerovat jako „GURPS online hra / VTT pro GURPS"** (neutralita i v marketingu a UI, ne jen v datech); AI = výstupní filtr proti regurgitaci pravidel/tabulek/seznamů + blok GURPS-terminologických výstupů; právní základ = §2/6 AutZ (+ Baker v. Selden), ne autorská ochrana listu; žádné logo GURPS ani „Powered by GURPS" bez svolení.

### - [ ] 36.6 Shadowrun — 🔴 reference-only (žádná OGL/SRD/ORC/CC; Holostreets = jen marketplace)
**Build teď:** generický kyberpunk deník (struktura vlastními slovy) · výpočty L2 (dice-pool ze zadaných hodnot) · prázdné kontejnery · vlastní VTT · AI-originál nekanonický · import/export vlastních dat.
**Guardraily (z verify — Shadowrun 9 nálezů):** **default = systém vůbec nepojmenovávat** („kompatibilní kyberpunkový systém"); nominativní zmínka jen úzká výjimka, nikdy hlavní SEO háček; **„Matrix" nepoužívat jako název pole/feature**; nešířit hotovou SR sestavu jako pojmenovaný „Shadowrun" template (uživatel pole aktivuje sám); žádné oficiální tabulky modifikátorů/limitů jako seed; DMCA/takedown + repeat-infringer; AI zákaz kanonických proper nouns / setting IP / korporací.
**Gated do smlouvy Catalyst/Topps:** veškerý SR obsah, setting, seznamy (gear/kouzla/adept powers/complex forms/vozidla/drony).

---

## Fáze 37 — Aktivační brána per systém ⛔
**Spínač, ne přestavba.** Když dorazí licence (open už teď / vyjednaná později), systém se aktivuje bez rebuildu.

### - [ ] 37.x Šablona aktivace (pro každý systém)
- [ ] licence/důkaz uložen jako `evidenceId` (smlouva/e-mail **mimo Git**; do manifestu jen status+hash+scope+expirace)
- [ ] právník potvrdil rozsah (`approvedTargets`, `commercialUse`, území, expirace)
- [ ] manifest `status → enabled` (příslušné targety)
- [ ] gated L3 obsah „rozsvícen" (odblokován import/seed)
- [ ] atribuce/disclaimer/notices vygenerovány a viditelné
- [ ] **test: žádný jiný systém se neaktivoval; nic se neaktivuje jen změnou FE route**
- [ ] `funkce` + `napoveda` aktualizovány

---

## Fáze 38 — Beta-gate subset (cross-ref roadmap3)
**Musí být před veřejnou betou** (závislost pro roadmap3 fáze 31). Tyto položky jsou drobné, ale mění právně-citlivé texty → přes `spec-driven-development`.

### - [ ] 38.1 Terms — nahradit výčet značek neutrálním popisem
**Nález:** [TermsPage.tsx:35](../src/features/ikaros/pages/TermsPage.tsx#L35) jmenuje „Matrix, Dračí Doupě, Dungeons & Dragons a další systémy". **Fix:** „různé pravidlové systémy"; konkrétní názvy přesunout do manifestu/notices s disclaimerem.

### - [ ] 38.2 CoC — odstranit „Miskatonic" trade dress z produkčního balíčku
**Nález:** „Miskatonic" v [coc.css](../src/features/world/pages/CharacterDetailPage/diary-systems/styles/coc.css), coc-skins/minimal.css, [CocSheet.tsx](../src/features/world/pages/CharacterDetailPage/diary-systems/sheets/coc/CocSheet.tsx). **Fix:** vlastní neutrální horor vzhled; Miskatonic je značková identita Chaosium.

### - [ ] 38.3 Reconcile výběru světa s manifestem
**Nález:** [systems.ts](../src/features/ikaros/pages/CreateWorldPage/constants/systems.ts) nabízí všech 14; výběr musí číst manifest (`status=enabled` + `approvedTargets`), ne ruční seznam. *(Landingy už gated: `SYSTEM_LANDINGS_PUBLIC=false`.)*

---

## Zdroje (primární, ověřené rešerší)

**Právní rámec:** Zákon 121/2000 Sb. §2/6, §88–94 (autorský zákon, mechanika vs. vyjádření + sui generis DB) · Zákon 441/2003 Sb. + Nařízení (EU) 2017/1001 čl. 14 (známky, nominativní užití) · Nařízení (EU) 2022/2065 čl. 6/16/17 (DSA) · CC BY 4.0 a CC BY 3.0 legal code + Recommended practices for attribution.

**Licence systémů:** D&D SRD 5.2.1 (dndbeyond.com/srd, CC BY 4.0) · Fate SRD (fate-srd.com, faterpg.com/licensing, CC BY 3.0) · JaD komunitní licence (jeskyneadraci.cz + mytago.cz, publ. 2025-12-02) · Chaosium Fan Material Policy + ORC License (chaosium.com) · Paizo ORC License (paizo.com/orclicense) · Year Zero Engine SRD/FTL (Free League) · SJ Games Online Policy (sjgames.com) · Holostreets Guidelines (DriveThruRPG) · ALTAR (altar.cz, drd2.cz) · Dračí Hlídka (dracihlidka.cz) · Mytago / Příběhy Impéria (mytago.cz).

> **Durabilní podklad (v repu, zdroj pravdy):** [roadmap4-podklad.md](roadmap4-podklad.md) — plná ověřená evidence per systém (licence + doslovné citace + permits/requires/prohibits + buildable + adversariální guardraily + disclaimery/atribuce + primární zdroje vč. judikatury SDEU) · [roadmap4-data.json](roadmap4-data.json) — strojově čitelná data (11 systémů × research/proposal/verdict + 5 konceptů). Před právním jednáním ulož PDF/screenshot aktuálního znění každé licence — podmínky se mění (zvlášť JaD bez verze).
