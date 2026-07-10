# Spec 16.2b-2 — Komunitní (globální) bestiář

> Roadmap: [roadmap2.md](../../roadmap2.md) krok **16.2b-2** (aktivace pod **21.5** „Společná tvorba").
> Navazuje na: [spec-21.5](../phase-21/spec-21.5-spolecna-tvorba.md) (hub + stub route `/ikaros/bestiar`), 16.2b-1 (dnešní 3-scope bestiář), 20B (report/moderace), 21.4 (moderace komunitního obsahu).
> **Stav:** 🟢 SCHVÁLENO (2026-07-09) — kostra „to jsme stvořili" + 3 rozhodnutí potvrzena uživatelem. Zbývá implementační plán.

---

## 1. Účel

Platformová (cross-svět, cross-systém) **knihovna bytostí** pod „Společnou tvorbou". Komunita:
- prohlíží a **diskutuje** globální bytosti,
- **tvoří** nové (jako návrh) a ladí staty systém po systému,
- **vkládá** si bytost do vlastního (světového/osobního) bestiáře — ze schválených i z návrhů.

Světový bestiář (`/svet/:slug/bestiar`) **zůstává beze změny**. Tohle je katalog **téhož modelu** na platformové ploše, ne paralelní featura.

## 2. Klíčový datový princip — jedna bytost, mapa systém → statblok

Roadmapa 16.2b: *„Jedna bestie = lore/text + mapa `systém → statblok`; přidání systému = přidat sadu statů, ne novou bestii."*

**Globální bytost** = společný **lore** (jméno, latinský název, popis, obrázek, typ) + **mapa statbloků** klíčovaná `systemId`:

```
GlobalBestie {
  scope: 'community'          // NOVÝ 4. scope (viz §3)
  name, latin?, description, imageUrl + výřez, kind, tags[]   // sdílený lore
  status: 'draft' | 'approved'         // stav celé bytosti (knihovna návrhů vs schválená)
  authorId, createdAt, approvedAt?, approvedBy?
  moderationHidden?, moderationHiddenReason?     // reuse 20B
  statblocks: {
    [systemId]: {
      systemStats: Record<string, unknown>   // stejný tvar jako dnešní Bestie.systemStats
      status: 'draft' | 'approved'           // staty se schvalují SAMOSTATNĚ (systém po systému)
      authorId, createdAt
      // discussion viz §4
    }
  }
}
```

**Dvě úrovně stavu (záměr):**
- Bytost `draft` → celá je v **knihovně návrhů**.
- Bytost `approved`, ale některý statblock `draft` → bytost je ve **schválené** knihovně, ale ta konkrétní pravidlová záložka nese odznak „návrh — neověřeno" (viz HTML ukázka, záložka Matrix).

✅ **ROZHODNUTO #1 (varianta a):** globální bytosti jsou **samostatné úložiště** (`community` scope) na stránce ve Společné tvorbě; odsud se **kopíruje do světových bestiářů**. Dnešní `system/user/world` bestie zůstávají single-system; klon „zplošťuje" vybraný statblock. Nerozbíjí existující data.

## 2a. Pravidlo úprav — lore volně, staty diskusí (hráč) / přímo (kurátor)

> Uživatelské zadání: *„Bestii můžeme měnit slovně případně obrázkem, ale staty se musí diskutovat."* + upřesnění 2026-07-10: *„To, že je globální bestie schválená, neznamená, že se staty nebudou/nemohou měnit — správci, admini a superadmin je musí dokázat změnit."*

- **Lore** (`name`, `latin`, `description`, `imageUrl` + výřez, `kind`, `tags`) — **edituje se přímo** (autor bytosti / kurátor). Nízké riziko, textová/obrazová změna.
- **Staty** (`statblocks[systemId].systemStats`) — pravidlo záleží na roli:
  - **Běžný hráč:** staty **NEmění přímou editací**. Nový statblok i změna existujícího jde přes **diskusní/schvalovací tok**: návrh → diskuse ke statům (§4) → schválení kurátorem (§5). Staty jsou herně citlivé (balanc) → ladí se veřejně, ne tiše přepisují.
  - **Kurátor** (správci diskuzí + správci článků + Admin/Superadmin — titíž jako v §5) smí staty **existujícího** statbloku **editovat přímo**, a to i u **schválené** verze. Schválenost je značka kvality, **ne zámek** — errata/rebalanc/oprava překlepu musí jít bez zakládání nové verze. Přímý zápis zachová `status`, `authorId`, `createdAt`; přepíše jen `systemStats`.
- **Důsledek pro UI/BE:** pro hráče je `statblocks[sys].systemStats` z pohledu běžné editace **read-only** (zápis jen schváleným návrhem). Pro kurátora je zdrojem přímý upsert `POST /bestiae/community/:id/statblock` (existující verzi přepíše jen kurátorovi — [bestiae.service.ts](../../../../Projekt-ikaros/backend/src/modules/bestiae/bestiae.service.ts) `proposeStatblock`); FE ho vystaví tlačítkem „✎ Upravit staty" u aktivní záložky.

## 3. Scope — 4. „community"

Enum dnes: `system | user | world` ([bestie.schema.ts](../../../../Projekt-ikaros/backend/src/modules/bestiae/schemas/bestie.schema.ts)). Přidat `community`.

| scope | kdo tvoří/edituje | viditelnost | poznámka |
|---|---|---|---|
| system | Admin/Superadmin | všechny světy daného systému | dnešní admin katalog |
| user | vlastník (PJ) | jen vlastník, cross-world | osobní |
| world | PomocnyPJ+ | daný svět | dnešní |
| **community** | **kdokoli přihlášený (jako návrh)** → kurátor schvaluje | **platforma (všichni)** | **nový** |

- **Atribuce autora** (`authorId`) — povinná u community.
- **Snapshot při klonu** (🔁 stejná semantika jako spawn na mapu) — vložená kopie je nezávislá; pozdější změna katalogu ji neovlivní.

## 4. Diskuse — dvouúrovňová

Dnešní `ikaros-discussions` je standalone fórum, **post nejde navázat na entitu** (jen `discussionId`, žádný target). → potřeba lehká entita komentářů s cílem.

```
BestieComment {
  targetType: 'beast' | 'statblock'
  bestieId                       // vždy
  systemId?                      // jen pro targetType='statblock'
  authorId, content, createdAt
  moderationHidden?, moderationHiddenReason?    // reuse 20B
}
```

- **Úroveň „beast"** = diskuse o bytosti / lore, napříč systémy (pod knihou).
- **Úroveň „statblock"** = diskuse jen k dané pravidlové verzi (balanc per systém), pod záložkou.
- Flat (bez vláken) pro MVP; řazení chronologicky.

✅ **ROZHODNUTO #2:** **nová lehká entita `BestieComment`** (target = bytost / statblok). **UI/UX chování jako stávající diskuse v projektu** („stejně jak jsme to zajišťovali") — konzistentní vzhled a ovládání, jen napojené na bytost + systém. Dvě úrovně = `targetType` (`beast` / `statblock`).

## 5. Schvalovací workflow (návrh → schváleno)

Reuse vzoru článků/galerie (pending badge už agregován v 21.5, §Pending badge).

- **Vytvoření** community bytosti přihlášeným = `status:'draft'` → **knihovna návrhů**.
- **Autor má návrh hned u sebe:** při vytvoření draftu se autorovi **současně vytvoří klon do jeho world/user bestiáře** (viz §6) — má bytost k hraní, i než projde schválením. (Uživatelské zadání: „i když vytvořil jen návrh, má ji ve svém bestiáři.")
- **Kurátor** schválí → `status:'approved'`, `approvedAt/By` → bytost **přejde do schválené knihovny**.
  - **Kurátor = správci diskusí + správci článků + Admin/Superadmin** — titíž lidé, co dnes moderují komunitní obsah (`DiscussionPendingReview` + `ArticlePendingReview` moderátoři). Žádná nová role.
- **Statblok** se schvaluje samostatně (`statblocks[sys].status`).
- **Moderace** (20B): `moderationHidden` skryje bytost/komentář; listener jako u dnešní bestie (`bestiae/moderation-enforcement.listener.ts`).
- **Pending badge:** přidat typ **`CommunityBestiePendingReview`** do `pending-actions` systému (`PendingActionType`, `pendingBadge.ts`, `usePendingActionsCount().byType`); vidí/schvaluje ho **kdo moderuje diskuse NEBO články** (+ Admin/Superadmin). Dlaždice Bestiář + nav „Společná tvorba" ho zahrnou do agregovaného badge.

## 6. Vkládání do vlastního bestiáře (klon)

- Tlačítko **„＋ Vlož"** v detailu vezme **právě zobrazenou pravidlovou verzi** (aktivní `systemId` záložka).
- Cíl: aktivní **svět** uživatele (world scope) nebo **osobní** (user scope) — výběr při vložení, default dle kontextu.
- Vytvoří dnešní single-system `Bestie` (`systemStats = statblocks[sys].systemStats`, `clonedFromId = globalBestieId`), **snapshot** (nezávislá kopie).
- Funguje i pro bytost/statblok ve stavu `draft` (neověřené) — jen s vizuálním varováním.
- 📌 Reuse existující klon infrastruktury (`CloneBestieModal`, `clonedFromId`, `useBestieMutations`).

## 7. FE — kostra (schváleno vizuálně, „to jsme stvořili")

Referenční HTML: `scratchpad/globalni-bestiar-navrh.html`.

**Route:** `/ikaros/bestiar` — nahradit `ComingSoonPage` funkční stránkou (veřejná, čtení bez auth; tvorba/vklad vyžaduje login).

**Dvě obrazovky:**
1. **Knihovna** — **dvě úplně oddělené knihovny** (velké přepínací hřbety): 📖 *Schválená* · ✎ *Návrhy*. Uvnitř **seznam** (rejstřík): portrét · jméno + latinsky · typ · dostupné systémy · počet komentářů · „＋ Vlož". Filtry ve dvou řádcích: **Typ** (draci/nemrtví/…) a **Systém** (D&D/DrD/…). U svého návrhu odznak „✓ v mém světě".
2. **Detail bytosti — „kniha":** obrázek (iluminace) + lore (dropcap) → **hlavní diskuse o bytosti** → **pravidlové záložky** (systémy; jen ty s obsahem + „＋ Přidat systém") → statblok aktivní záložky → **diskuse ke statům** té záložky. Prázdná/návrhová záložka = výzva „navrhnout staty" + varovný proužek.

**Editor:** reuse `EntitySchemaForm` (per-system schema, jak dnešní `BestieEditorModal`) pro tvorbu/úpravu statbloku daného systému; lore editor (jméno/popis/obrázek) zvlášť.

**Komponenty (nové, `src/features/ikaros/bestiar/`):** `KomunitniBestiarPage`, `BestiarLibraryList`, `BestieBook` (detail), `RulesetTabs`, `StatblockView` (reuse render z `BestieDetail`), `TwoLevelDiscussion`, `InsertToBestiaryModal`.

## 8. Skiny — model **C** (vlastní tvar per motiv), fázově

Rozhodnutí uživatele: **každý platformový motiv = vlastní tvarový jazyk + signature ornament** (jako `bestieSkins.css` pro 12 world motivů). Týká se **21 platformových motivů** (`scope:'platform'`); world motivů **ne** (bestiář je platformová plocha).

**Architektura (povinná, ať skiny jdou navléct bez přepisu kostry):**
- Kostra rendruje **stabilní data-atributy**: `data-bestie-book`, `data-bestie-portrait`, `data-ruleset-tabs`, `data-statblock`, `data-discussion`, `data-lib-list`, `data-lib-row` …
- Vzhled výhradně přes `[data-theme='X'] [data-bestie-*]` v dedikovaném CSS (`komunitniBestiarSkins.css`), barvy/fonty z `--theme-*` tokenů; skin řeší **tvar + ornament**, ne hardcoded barvy.
- **Neutrální motivy** (`bila`, `modre-nebe`, `zlaty-standard`) = čistý minimalistický jazyk, žádný nucený ornament.

**Postup (série, ne jeden zátah — `fb_no_debt`: každý motiv kompletní):**
1. **Etalon** (schválit kvalitu + šablonu): `pergamen` (archetyp *Kniha*) + `sci-fi` nebo `kyberpunk` (archetyp *Obrazovka*).
2. Po schválení etalonu → zbylých ~19 motivů dle šablony, motiv po motivu.
3. Každý motiv: `frontend-design` návrh → schválení → impl → `mobil-desktop`.

⚠️ **Skiny jdou AŽ po funkčním MVP** (kostra + data + BE). Nemá smysl skinovat nehotovou kostru.

## 9. Pořadí stavby

```
1) BE: 4. scope 'community' + GlobalBestie model (statblocks mapa) + BestieComment + endpointy + klon + moderace/pending
2) FE: route /ikaros/bestiar (nahradit stub) + knihovna (2×seznam+filtry) + detail (kniha+taby+2úrovňová diskuse) + editor + vklad
3) MVP ověření na 1 neutrálním vzhledu (default) — funkčně kompletní
4) SKINY C — etalon (2) → schválení → zbylých 19 (série)
```

✅ **ROZHODNUTO #3:** **BE model + endpointy první** (datový model je jádro featury), FE hned na reálné API. BE a FE se nemíchají v jedné dávce (`fb_no_mixed_batch`).

## 10. Responsive (base.md)

- Seznam: řádky se na ≤768px zalomí (portrét+jméno nahoře, systémy/akce pod); ověřit 375/768/1440.
- Detail „kniha": `spread` (obrázek|lore) → 1 sloupec na ≤760px; záložky scrollovatelné horizontálně.
- Po každém skinu povinný `mobil-desktop`.

## 11. Mimo scope

- Herbář/Lektvary/Kouzla/Hádanky (21.5a–d) — **dědí tento model**, samostatné specy.
- Vlákna (threaded) v diskusi — MVP flat.
- „Reveal" bytosti hráčům (16.2b-3) — samostatné, blíž AKJ.
- World motivy pro bestiář (netýká se platformové plochy).

## 12. Otevřené otázky

- ✅ **Kurátor bytostí** = **správci diskusí + správci článků + platform Admin/Superadmin** (rozhodnutí uživatele 2026-07-09). Reuse existující moderace komunitního obsahu (`pending-actions`, typy `DiscussionPendingReview`/`ArticlePendingReview`); přidá se `CommunityBestiePendingReview` viditelný pro tentýž okruh. Žádná nová role.
- Pre- vs post-moderace návrhů (roadmapa 16.2b otevřená otázka; 21.4). Návrh: **post** (návrh je hned viditelný v knihovně návrhů, kurátor povyšuje).
- ✅ **Editace statů po schválení** (rozhodnutí 2026-07-10): kurátor edituje **přímo** (viz §2a) — draft i approved. MVP **bez verzované historie** (držet historii statů odloženo), jen přepis + `updatedAt`. Autorská editace vlastního draftu a hráčský návrh revize approved verze zůstávají odložené.
- Duplicity (dvě komunitní „drak") — merge nástroj? Odloženo.
