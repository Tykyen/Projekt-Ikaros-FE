# Spec: Migrace dat starý Matrix → Ikaros svět `matrix`

> **Stav:** SCHVÁLENO, probíhá. **F1 (mapa uživatelů) HOTOVA (2026-06-07).** Toto je úvodní *unified* spec — skeleton rozsekaný na fáze.
> Každá fáze dostane vlastní dílčí spec (mapování polí) až přijde na řadu.

---

## 1. Účel a kontext

Jednorázová **transformační migrace** obsahu ze starého .NET Matrixu do nového Ikara.

- **Zdroj:** `C:\Matrix\dump\MatrixDatabase` — čerstvý živý `mongodump` (k 2026-06-07, 28 kolekcí). Čteno Node skriptem přes balík `bson` z `backend/node_modules` (žádný mongorestore).
- **Cíl:** Ikaros singleton svět `matrix` (už obsahuje Pravidlovou knihu + seed referenční stránky; účty už migrované).
- **Cílové prostředí:** ⚠️ **AKTUALIZACE 2026-06-12 — PROHOZENÍ SERVERŮ:** nový Ikaros (migrovaný svět) **TEĎ běží na `https://www.projekt-ikaros.com`** = aktuální produkční cíl pro další importy + deploy; **`newmatrix.patrikzplzne.cz` má od teď starou .NET Matrix DB** (= zdroj). — *Původní stav (do 2026-06-11, podle něj čti historické statusy „živé v newmatrix" níže): importovali jsme na `newmatrix.patrikzplzne.cz`, na živý starý Matrix `www.projekt-ikaros.com` se NESAHALO.* Zdrojový dump: `C:\Matrix\dump\MatrixDatabase`. Výsledek = **„vylepšený otisk"**. Dedup + idempotence platí.
- **Povaha:** NE kopie. Starý systém je **plochý jednosvětový** s jiným stylem (.NET PascalCase, číselné `type`, `accessRequirements` role-list). Ikaros je **world-scoped** s jiným modelem práv (AKJ/viditelnost) → každá kolekce se **překládá**.

⚠️ Záloha starého únorového snapshotu: `C:\Matrix\dump-2026-02`.

---

## 2. Zdroj — inventář kolekcí a osud

| Kolekce | Počet | Osud | Cíl v Ikaru |
|---|---|---|---|
| Pages | 3 625 | 🟢 migrovat | Page (world `matrix`) — viz F2/F4 |
| Characters | 963 | 🟢 migrovat | Character (vlastník z F1) |
| ChatMessages | 1 506 | 🟢 migrovat | chat (F11) |
| CampaignRelationships / Subjects / Storylines / QuickNotes | 113 / 99 / 15 / 1 | 🔴 zatím skip | (jen Pavučina) |
| TimelineEvents | 97 | 🟢 migrovat | Timeline (F8) |
| ChatChannels | 43 | 🟢 migrovat | chat (F11) |
| Calenders | 39 | 🟢 migrovat | character calendar subdoc (F7) |
| Users | 26 | ✅ hotovo | účty existují → jen ID mapa (F1) |
| NpcTemplates | 22 | 🔴 zatím skip | NE Bestie; důležité NPC jsou v `Characters` |
| WorldMemberships | 20 | 🟢 migrovat | WorldMembership světa `matrix` |
| GameEvents | 15 | 🟢 migrovat | Akce / GameEvents (F9) |
| sounds | 9 | 🟢 migrovat | zvuková databáze (F8) |
| chatGroups | 7 | 🟢 migrovat | chat skupiny (F11) |
| PushSubscriptions | 7 | 🔴 zahodit | vázané na zařízení |
| News | 6 | 🟢 migrovat | Novinky |
| Universes | 1 | 🟢 migrovat | Pavučina (F6) |
| IkarosMessages / MapScenes / MapTemplates / Worlds / CustomEmotes / WorldSettings | 3 / 3 / 2 / 2 / 1 / 1 | 🔴 zatím skip | mimo rozsah |
| ChannelReadStatuses | 299 | 🔴 zahodit | efemérní „přečteno" |
| PageEmbeddings | 14 433 | 🔴 zahodit | Ikaros reindexuje (MeiliSearch) |
| SearchStats | 1 | 🔴 zahodit | — |

**Worlds = 2:** `matrix` (hlavní) + `novy-svet` (test → zahodit).

---

## 2b. Dekódování zdroje (jak starý Matrix strukturuje obsah)

**Postava je rozsypaná do víc dokumentů**, spojených slug konvencí `<slug>-<suffix>`:
- `<slug>` (Page type 0) = **hub postavy**; `User.CharacterPath` → tento slug.
- `<slug>-denik` (kolekce `Characters`) = **karta/deník** (aspekty, schopnosti, zdraví, inventář…).
- volitelně `<slug>-finance` (t6), `<slug>-vybava` (t7), `<slug>-poznamky` (t9), `<slug>-kontakty` (t5).
- → **F3 musí slepit do JEDNÉ Ikaros postavy** (Page+Character unifikované) + subdokumenty.

**Dekód `type` enumu:**

| type | význam | počet |
|---|---|---|
| 5 | obecné lore + kontakty + mix | 2398 ← hlavní ruční kbelík |
| 1 | velké státy/regiony | 981 |
| 2 | menší státy | 120 |
| 0 | hub postavy | 25 |
| 4 | historické události | 24 |
| 9 | poznámky/deník | 21 |
| 7 | výbava | 18 |
| 6 | finance | 16 |
| 8 | rozcestníky/indexy | 15 |
| 10 / 11 | ? (prověřit) | 5 / 2 |

**Strategie auto-klasifikace (F2):** (1) `type` = první signál (0/1/2/6/7/8/9 ≈ 1200 stránek se zařadí skoro samo); (2) slug-suffix připojí finance/výbava/poznámky/kontakty k postavě dle prefixu; (3) shoda jména stránky s postavou/lokací; (4) **ruční revize hlavně na type 5** (2398). Pozn.: lokace-jako-NPC detekovat (rozhodnutí 5).

---

## 2c. Klasifikační taxonomie (F2) — schváleno uživatelem

| Hlavní kat. | Podtyp | Auto-detekce | ~počet |
|---|---|---|---|
| **Postava (PC)** | PC postava (hub) | type 0 + slug/jméno vlastněné (F1) | z 25 |
| | PC deník | `Characters` `-denik`, vlastněné | — |
| | PC tajné | ⚠️ jménem nedetekovatelné → `?`/ručně (zkusit `accessRequirements`) | — |
| | PC finance | type 6 / `-finance`, prefix = postava | 16 |
| | PC výbava | type 7 / `-vybava` | 18 |
| | PC poznámky | type 9 / `-poznamky` | 21 |
| | PC kontakty | `-kontakty` | — |
| | PC AKJ (clearance #) | `AKJ <n> <cíl>`, cíl = PC | z 415 |
| **NPC** | NPC / NPC deník | character hub/`-denik` NEvlastněné | — |
| | NPC AKJ | `AKJ <n> <cíl>`, cíl = NPC | z 415 |
| **Seznam** | rozcestník | type 8 | 15 |
| **Skupina** | strana skupiny | název „skupina/organizace" | ~37 |
| **Lokace** | | type 1/2 + lokace-jako-NPC ⚠️ (viz otázka) | 1101? |
| **Událost** | | type 4 | 24 |
| **Rodokmen** | | type 10 (rodina/rodokmen/family) | 5 |
| **Galerie** | (+ které k sobě patří) | ⚠️ jménem nedetekovatelné → `?`/ručně | — |
| **Pravidla** | SKIP (už v rulebooku) | shoda s rulebook slugy (dedup D) | — |
| **Pravidla B** | SKIP teď, **označit pro budoucí rozšíření** (magie/programování/jazyky) | rulebook F2–F4 témata | — |
| **Ostatní** | Ostatní / AKJ Ostatní | type 5 zbytek; AKJ s cílem = jiná stránka | ~1983 |
| **?** | pozornost | nízká jistota / cíl nenalezen | — |

**AKJ = 2. průchod:** kategorie (PC/NPC/Ostatní AKJ) se dědí podle kategorie cílové stránky. Clearance # se zachová. ⚠️ **AKJ může mířit na VÍC cílů** (info sdílená pro postavu i stránku / pro x stránek) → vazba **1:N**; klasifikace zachytí všechny detekované cíle, uživatel může přidat další.

---

## 2d. Import pravidla z revize uživatele (F4) — ZÁVAZNÉ

Zdroj = `Downloads/f2-klasifikace.csv` (ruční revize 2026-06-07, sloupce `slug;titul;kategorie;podtyp;vlastnik_cil;clearance;…;DO_OBCHODU;…;POZNAMKA`).

1. **`kategorie = AKJ`** (172) → stránka patří **POD entitu z `vlastnik_cil`**, napojí se jako její **součást** (chráněná AKJ záložka), ne samostatná stránka.
2. **Obrázkové stránky** `Vzhled X` / `Mapa X` (~127) → další stránka jen s obrázkem dané věci; připojí se k vlastníkovi (`vlastnik_cil`) jako **záložka viditelná u vlastníka** (mapy, místa, uniformy…). Mapy navíc patří do Atlasu (Mapy).
3. **Cenové stránky** `Cena X` (4) → **spojit dohromady** s odpovídající položkou zboží (cena byla samostatná stránka patřící k věci); položka jde do obchodu.
4. **Přejmenování** (POZNAMKA „Přejmenuj na Y", 2: Zara Hawke→Zara Villiam, Abi démon→Erlend) → změň **zobrazované jméno** na Y, ale **vlastníka/linkování nech na PŮVODNÍM jménu** (klíč zůstává Zara Hawke).
5. **Mazání** (POZNAMKA „Vymazat není potřeba", 32) → stránku **NEmigrovat**.
6. **AKJ ochrana**: každá stránka, co má AKJ, **dostane AKJ** (defaultně nic nevidět); u `Ostatní` některé dostávají AKJ **navíc**.
   - **AKJ-only stránka** (tvořená POUZE jako AKJ, bez veřejné verze) → veřejná Page = **stub: jen hláška „Obsah dostupný pouze přes AKJ"**. ŽÁDNÝ biotext, ŽÁDNÝ obrázek (`imageUrl` prázdné), ŽÁDNÁ tabulka — nic veřejného. Skutečný obsah jen v `akjTabs`. (F4d)
   - **AKJ model (potvrzeno uživatelem):** AKJ = obsah (text i obrázek) **JEN v záložce**, nikdy veřejně. Každá záložka má **číslo = clearance** (staré „AKJ N"). Character AKJ (Tajné/PC AKJ): **vlastník + PJ vždy vidí**, ostatní po projití čísla. `akjTab` ≈ `{name, level=číslo, order, access, contentOverride=obsah(paragraphs)}`.
   - **Cíl existuje** (F4a/F4b stránka) → přidej AKJ záložku k ní. **Cíl neexistuje** (samostatné AKJ, bod 3) → **vygeneruj host stránku** s veřejnou stub hláškou „jen AKJ text" + připoj AKJ záložku(y) s obsahem.
7. **Obchod** (DO_OBCHODU = `Obchod`, 260) → položka jde i do obchodu (F10), i když má vlastní stránku.
**Sloupec „do obchodu":** věc má vlastní stránku, ale jde i do obchodu (uživatel označí).

---

## 2e. Mapování postav (F3) — staré `Characters` → Ikaros

Ikaros Character = **tenký subdoc kontejner** (bio žije na Page po sjednocení 9.1). Stará postava `X-denik` se rozloží:

| Staré pole | Ikaros cíl |
|---|---|
| `slug` `X-denik` | `characters.slug` = **`X`** (hub slug, bez `-denik`) |
| `name`, vlastník (F1 mapa), isNpc | `characters`: `name`, `worldId='matrix'`, `userId` (PC) / `isNpc=true` (NPC), `kind='persona'` |
| health, magicHealth, armor, tiredness, overPressure, abilityPoints, fatePoints, magicGene, bornWhere, languages[], aspects[], abilities[] | `character_diaries.customData['matrix']` (per-system blok statů) |
| `inventory` (TipTap doc) | `character_inventories` (`notes` richtext / `sections`) |
| `contacts[]` | kontakty subdoc (většinou prázdné; doplní Kontakty-stránky v F4) |
| Finance/Výbava/Poznámky/Kontakty/AKJ = **samostatné Pages** | slijí se do subdoc **až v F4** |
| bio/obsah | hub **Page** (primární entita) |

**Cílové kolekce:** `characters`, `character_diaries`, `character_inventories`, `character_finances`, `character_notes`, `character_calendars`. Index `characters{worldId,slug} unique`.
**PC vs NPC:** PC = slug owned ve F1 mapě (userId set, isNpc=false); zbytek isNpc=true (lehké NPC, většina bez statů — jen 283/963 má aspekty, 557 inventář).
⚠️ **Otevřené:** přesný tvar `customData['matrix']` dle per-system schématu (FE) — dohledat před importem.

---

## 2f. Párování stránek k postavám (F4b/c/d) — SCHVÁLENO

**Klíč napojení = CSV `vlastnik_cil`** (uživatel ručně vyplnil cílovou postavu) → najít F3 postavu podle jména (slugy jsou nekonzistentní: `helsing-finance` vs `vybava-medak`).

| Podtyp (CSV) | → Ikaros cíl | Krok |
|---|---|---|
| PC Postava | veřejná Page (`type:'Postava hráče'`, `characterRef:{characterId}`, `ownerUserId`) | F4b |
| NPC | Page (`type:'NPC'`, `characterRef`, postava isNpc) | F4b |
| PC Tajné | **AKJ záložka** (`akjTabs`) — dle domluvy | F4d |
| PC AKJ + `pjSecretDiary` (twin z F3) | AKJ záložky | F4d |
| **PC Kontakty** | **AKJ záložka „Kontakty"** (rozhodnutí A — Ikaros nemá contacts subdoc) | F4d |
| PC Finance | `character_finances` (obsah → `notes` richtext) | F4c |
| PC Výbava | `character_inventories.notes` | F4c |
| PC Poznámky | `character_notes` | F4c |

Obsah subdoc/AKJ = staré page `paragraphs` (TipTap).

**Přesné cílové tvary (z BE DTO/schémat, ověřeno):**
- **Výbava → `character_inventories.sections`**: `PageSectionDto` = `{id,title,content,order,isCollapsed,items:[{id,text,quantity?,note?}]}` = **starý `sections` 1:1** (jen `_id`→`id`). (16 PC stránek má `sections`.)
- **Poznámky → `character_notes`** = `{characterId, content}` (content = paragraphs).
- **Finance → `character_finances`** = `{balance, entries[], transactions[], notes, accountType, currency}`. Čísla ze starého `table` (Zůstatek/Výdaje/Příjmy) + `accountTable` (12 PC). notes = paragraphs.
- **AKJ → `akjTabs[]`**: `{id, name, order, access: AccessRequirement[], ownerHidden:false, contentOverride:{content,imageUrl,table}}`. Clearance číslo → `access:[{type:'AKJ',value:'N'}]`.
- **Práva (mapování starých):** `{type:2,value:'Player'/'User'}` → `{type:'Role',value:...}`; `{type:0,value:<oldUserId>}` → `{type:'UserId',value:<nové ID z F1 mapy>}`. Typy: `'UserId'|'AKJ'|'Role'|'AKJType'`.

---

## 3. Závazné principy

1. **Idempotence + dry-run first** — každý import znovuspustitelný; nejdřív suchý běh s reportem „co by se stalo".
2. **Nedestruktivní k živým datům** — nikdy nepřepsat existující (rulebook, účty). Skip/merge.
3. **ID mapa = základ** — vše odkazuje na staré ObjectId; spárovat přes `Username` (jediný stabilní klíč).
4. **Klasifikace stránek = human-in-the-loop CSV** — 3625 stránek nelze tipnout naslepo.
5. **Dedup s existujícím obsahem** — pravidlové stránky už v Ikaru jsou → přeskočit.
6. **Transformace, ne kopie** — flat→world-scoped, PascalCase→camelCase, `type`-enum→Ikaros kind, `accessRequirements`→Ikaros práva.
7. **Ověření po každé fázi** — počty + vzorek; práce po malých dílech, nezastavovat doprostřed.

---

## 4. Fáze (malé, samostatně ověřitelné díly)

Pořadí podle závislostí. Každá fáze = vlastní dílčí spec + souhlas + impl plán + souhlas + kód + ověření.

| Fáze | Název | Vstup | Výstup | Závisí na |
|---|---|---|---|---|
| **F0** | Příprava & analýza | dump | inventář ✅, tento spec, úklid PII kopií | — |
| **F1** ✅ | Mapa uživatelů | Users (old) ↔ Ikaros users | **HOTOVO:** 24 spárováno, 2 test zahozeny, 0 chybí. Mapa `C:\tmp\f1-user-map.json` | F0 |
| **F2** ✅ | Klasifikace stránek | Pages | **HOTOVO:** ruční revize uživatele `Downloads/f2-klasifikace.csv` (3625 ř., finální kategorie + akční značky) | F0 |
| **F3** ✅ | Postavy | Characters | **NAIMPORTOVÁNO na newmatrix (943, preskoceno 0)** přes workflow `import-matrix-characters.yml` (tag `_mig:f3`, idempotentní, rollback k dispozici). 24 PC / 919 NPC. | F1 |
| **F4a** ✅ | Stránky — samostatné | Pages + CSV | **NAIMPORTOVÁNO (1643, preskoceno 0)** — Lokace/Ostatní/Seznam/Rodokmen, `import-matrix-pages.yml`, tag `_mig:f4a` | F2 |
| **F-Seznam** | Seznam: odkazy → `menu` | Seznam stránky (F4a) | extrakce odkazů z `content` do `page.menu` (95/123 str., 721 pol.), `extract-seznam-menu.yml`, flag `_migSeznamMenu`. Spec [`f-seznam-menu.md`](./f-seznam-menu.md) | F4a, F5 |
| **F4b** ✅ | NPC stránky → postavy | Pages | **NAIMPORTOVÁNO (1075: napojeno 898, dovytvořeno 177 karet, skip 0)** `import-matrix-npc.yml` `_mig:f4b`. PC stránky → F4b-2/c/d | F2, F3, F4a |
| **F4c** ✅ | PC výbava/finance/poznámky | Pages | **NAIMPORTOVÁNO** (49: inv 17 / fin 15 / notes 17, Měďák 59 ✓) `import-matrix-subdocs.yml` `_mig:f4c`. (Kontakty→F4d) | F3 |
| **F4b-2** 🔜 | PC veřejné stránky | Pages | Postava (17) → Page `Postava hráče` + characterRef + ownerUserId (slug=char slug) | F3 |
| **F4d** 🔜 | AKJ → akjTabs | Pages | ~520, na cílové stránky | F4a-c |
| **F5** | Přepis odkazů | hotové stránky | přepsané odkazy + report nevyřešených | F4 |
| **F6** | Pavučina | Universes + `isWoodWide` | graf uzlů/hran | F4 |
| **F7** | Kalendáře | Calenders | calendar subdoc postav | F3 |
| **F8** | Timeline + zvuky | TimelineEvents, sounds | timeline + zvuková DB | F0 |
| **F9** | Akce | GameEvents | herní události | F1 |
| **F10** | Výbava → obchod | subset z F2 | položky obchodu | F2, F4 |
| **F11** | Chat & skupiny | ChatMessages/Channels/chatGroups | chat věrně přenesen | F1 |
| **F12** | Obrázky | URL v datech / Google Drive | rehost + konverze webp + přepis URL | protíná F3, F4 |

**Klíčové závislosti:** F1 → vše s vlastnictvím (F3/F7/F9/F11). F2 → F4/F10. F4 → F5/F6. F12 protíná F3/F4.

---

## 5. Rozhodnutí (2026-06-07, vše odsouhlaseno)

1. **Obrázky (F12):** chceme **ty nejnovější** → priorita **Cloudinary URL z dat** (rehostnout, pokud žijí). Kde nejsou → **originály z Google disku** → přesunout + **konvertovat na webp** (vzor Pravidlová kniha).
2. **Obchod (F10):** výbava **má vždy u sebe cenu** → shop-ready. Které kusy patří do obchodu **upraví/označí uživatel**.
3. **Chat (F11):** přenést **1:1**; mapovat na Ikaros model (kanál/konverzace invertované).
4. **Klasifikace (F2):** předtipuju automaticky, ale **finální revizi dělá uživatel ručně** proti živému starému serveru a vrátí opravené CSV.
5. **Lokace-jako-NPC:** některá **místa** byla ve starém Matrixu vytvořena jako **NPC**, jen aby měla kalendář → při klasifikaci **detekovat a převést na Ikaros Lokace** (Page→Character `kind:location`).
6. **Odkazy (F5):** auto-prolinkovat výskyty **jmen stránek** v textu vč. **české skloňované formy** (`Londýna`→`Londýn`, `John Wick`→stránka). ⚠️ Opatrně na falešné shody.
7. **Dedup (D):** před importem stránek **zkontrolovat obsah Pravidlové knihy** a ty stránky přeskočit. Část dat se možná domigruje jinam později — teď neřešit.
8. **Pavučina:** migrovat **jen** Pavučinu (Universes + `isWoodWide`); **kampaňové nástroje a mapy zatím skip**.
9. **NPC ≠ Bestie:** důležité jsou **NPC jako postavy** (`Characters` s příznakem NPC → Ikaros Character-NPC). Stará kolekce `NpcTemplates` (šablony žetonů) **se teď neřeší, NEpřeklápět na Bestie**.
10. **Cílové prostředí:** oddělený server, starý Matrix běží dál; „vylepšený otisk".
11. **„Nový svět"** (test) → zahodit.

---

## 6. Rizika

- **Import do živého světa** (rulebook/účty) → mitigace: dry-run + idempotence + dedup.
- **Klasifikace 3625 stránek** = časově náročná pro uživatele → mitigace: auto-předtřídění + řazení dle jistoty (očividné odbavit hromadně).
- **Odkazy a obrázky** = leaky/rozbité cesty → samostatné reporty nevyřešených.
- **Per-collection field drift** → držet Ikaros field-drift checklist (toEntity mapper!).

---

## 7. Workflow

Tento `index.md` = unified overview (čeká schválení). Po schválení: fáze po fázi `dílčí spec → souhlas → impl plán → souhlas → kód → ověření`. Žádný kód před schválením dané fáze.
