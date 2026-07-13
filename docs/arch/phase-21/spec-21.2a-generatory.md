# Spec 21.2a — Generátory: Jména + Potomci (první realizace 21.2)

> Roadmap: **první etapa 21.2 Procedurální generátory postav & detailů** (zodpovídá otevřenou otázku „které generátory první" → jména + rodina). Zdroj dat a modelu: uživatelův `Generátor jmen Morvol.xlsx` (listy Generátor · Potomci generátor · Přijímení · Ženská jména · Mužská jména · Poznámky). Vzor rodiny Společné tvorby: [spec-21.5a](spec-21.5a-herbar.md) (kurátorský flow, seed pipeline [spec-21.5f](spec-21.5f-ceniky.md)).
> **Stav:** 🟢 FE+BE IMPLEMENTOVÁNO (2026-07-13) — BE modul `name-sets` (typecheck+lint ✓), FE `/ikaros/generatory` (11. dlaždice; enginy `random`/`names`/`demography`/`familyNames` s vitest suitou 14 testů; build ✓, HelpPage 25 ✓). Schváleno vč. všech 9 vylepšení („všechny tři body navíc a to co jsi říkal určitě udělej také"). Seed pipeline: Morvol z Excelu + Markov, státy z Wikidata (⚠️ WDQS neunese GROUP BY — surové řádky + lokální agregace) — 🚧 fetch běží, pak dry-run gate (`c:\tmp\jmena-dry-run.html`) + deploy + workflow `seed-name-sets.yml`.

---

## 1. Účel

Nová **11. dlaždice hubu Společná tvorba: „Generátory"** (`/ikaros/generatory`) se dvěma nástroji:

1. **Generátor jmen** — náhodná jména z **jmenných sad** (sada = národ/stát: mužská jména + ženská jména + příjmení). Sady: **~22 národů Morvolu** (z uživatelova Excelu, doplněné na cílové počty) + **≥40 států světa** (nové, vč. garantované české sady).
2. **Generátor potomků** — věrný přepis modelu z Excelu: náhodné rodinné sloty (dítě ano/ne, pohlaví, věk matky při porodu, dožitý věk, věkový rozdíl partnera, dožitý věk partnera) pro rychlou stavbu rodin/rodokmenů; napojený na generátor jmen (vnořené generátory z roadmapy 21.2).

## 2. Klíčová rozhodnutí

- **R1 — Jmenná sada = dokument komunitní knihovny** (kolekce `name_sets`): `name` (národ/stát) · `category` (`morvol` | `svet`) · `description` (původ/jazyk) · `maleNames[]` · `femaleNames[]` · `surnames[]` · `surnameNote?` („nemá příjmení" / „podle rodiče" — Ogerská, Saimatei) · tags · draft/approved · kurátor (`isBestieCurator`) · moderace 20B (`ReportTargetType.NameSet`) · pending fronta. **Komunita může sady rozšiřovat i zakládat vlastní** (fantasy sady pro jiné světy) — naplňuje „tabulky plní komunita" z 21.2. Bez komentářů (parita herbář).
- **R2 — Editor sady = hromadný textový vstup** (3 textarey, jedno jméno na řádek; dedup + trim při uložení), ne itemizovaný editor — sady mají tisíce položek.
- **R3 — Generování čistě na klientu.** FE stáhne sadu (lazy, jen zvolenou) a losuje uniformně: počet výsledků 1–50, pohlaví (muž/žena/mix), formát (jméno + příjmení / jen jméno / jen příjmení), **zámek per řádek** (přegenerovat jen nezamčené — vzor „vygeneruj/přegeneruj/zamkni" z roadmapy), kopírování jednotlivě i vše. Žádný BE endpoint pro generování.
- **R4 — Generátor potomků = demografický model (v2), NE uniformní sloty.** Uživatel výslovně chtěl lepší statistiku než svůj původní `RANDBETWEEN` model (2026-07-13: „Pokud najdeš lepší statistická data, budu jen rád"). Model = **porodní řada** (počet dětí je VÝSLEDEK, ne vstup), postavená na předindustriální demografii (anglické farní registry / CAMPOP, Our World in Data):
  - **Sňatek matky:** trojúhelníkové rozdělení 16–26 let (vrchol 20; nastavitelné).
  - **Porodní intervaly:** 24–36 měsíců (průměr ~30 — doloženo 30,5 měs.), interval s věkem matky roste; plodnost končí 40–45 (postupná sterilita).
  - **Úmrtí matky při porodu:** 1 % na porod (kumulativně ≈ 1 z 18 žen za život — sedí na doložená data); úmrtí ukončí řadu a vypíše se („zemřela při porodu N. dítěte").
  - **Dvojčata:** 1,5 % porodů.
  - **Pohlaví:** 51,2 % chlapci (přirozený poměr 105:100).
  - **Dětská úmrtnost (preset):** kojenecká (do 1 roku) + dětská (1–15). Presety: **Středověk (default)** 20 % + 15 % (dožití 15 let ≈ 68 %) · **Tvrdý svět** 25 % + 20 % (≈ 55 % — plný historický průměr „skoro každé druhé dítě") · **Prosperita/šlechta** 8 % + 7 % (≈ 85 %). Toggle „zobrazovat děti zemřelé v dětství" (default zap — pro rodokmeny; s věkem úmrtí).
  - **Dožití dospělých** (kdo přežil 15): los z aproximované úmrtnostní tabulky — pásma 15–30 (12 %) · 30–45 (20 %) · 45–60 (28 %) · 60–75 (28 %) · 75–90+ (12 %); medián ~57 (odpovídá e15 ≈ +40 let).
  - **Partner:** jen u dětí doživších dospělosti, šance sňatku 88 %; věkový rozdíl (muž starší) normální μ=+3, σ=4, ořez −5…+15; dožití partnera ze stejné tabulky dospělých.
  - Výstup = tabulka dětí (pohlaví · věk matky při porodu · osud/dožitý věk · partner: rozdíl věku + dožití) + tlačítko **„Pojmenuj"** (dosadí jména ze zvolené jmenné sady dle pohlaví). Zámky per řádek, kopírování. Všechny parametry editovatelné (presety = výchozí hodnoty).
  Sekce **„Království"** (dynastie/provincie/tituly) z Excelu se NEpřenáší — rozhodnuto uživatelem 2026-07-13 (Morvol-specifická; kandidát na per-svět tabulky v plné 21.2).
- **R5 — Cílové počty per sada: ≥800 příjmení + ≥500 mužských + ≥500 ženských jmen** (zadání uživatele). Zdroje doplnění: **Wikidata (CC0)** — křestní jména a příjmení podle země/jazyka; **ČR open data MV ČR** (četnost jmen a příjmení) pro garantovanou českou sadu; Morvol národy = stávající jména z Excelu (vyčištěná: trim, dedup, normalizace VELKÝCH písmen) + doplnění z reálného jazykového poolu, na který národ mapuje (viz §5). U malých jazyků, kde zdroj nedá minimum, se dorovnává z širšího jazykového regionu — sada vždy splní minima.
- **R6 — Seed = mechanismus ceníků**: lokální pipeline → `name-sets-seed.json` → workflow → import v BE kontejneru (idempotence `seedTag`), **dry-run gate** (přehled sad + vzorky + mapování národ→jazyk) před nahráním. Bez obrázků (sady je nemají; dlaždice má ikonu).
- **R7 — Login-required čtení** (parita celé rodiny Společné tvorby).

## 2b. Schválená vylepšení (2026-07-13, všech 9)

- **V1 — Přechylování ženských příjmení**: vlastnost sady `femaleSurnameRule: 'none'|'cs'` — česká pravidla za běhu (…ý→…á; …í beze změny; koncová samohláska pryč + „ová"; -ek→-ková; jinak +„ová"). Zapnuto pro českou/slovanské sady a Skřety/Hobity.
- **V2 — „Běžná jména častěji"**: seznamy ze zdrojů uložené SEŘAZENÉ dle četnosti (`frequencySorted: true`) → generátor volitelně losuje Zipfovým vážením (rank-based, žádná váhová data). U Morvol sad vypnuto.
- **V3 — Celá rodina jedním klikem**: výstup potomků zahrnuje i rodiče (jména, věk sňatku, dožití, příčina smrti) a partnery dětí se jmény — blok ke zkopírování.
- **V4 — Rok světa**: volitelný letopočet → výstup s roky narození/úmrtí místo věků (prosté sčítání, bez integrace kalendářů).
- **V5 — Příčina smrti (flavor)**: vážená tabulka dle věku/pohlaví/kontextu (kojenec-nemoc · porod u žen v plodném věku, propojeno s modelem · bitva/nehoda u mužů 15–45 · sešlost věkem…).
- **V6 — Demografický profil sady**: volitelná pole `demography { lifespanMult?, fertilityFrom?, fertilityTo? }` — elfí sada počítá potomky elfí demografií; default lidský.
- **V7 — Přízviska**: volitelný 4. seznam sady `epithets[]` („Hrbáč", „z Lipan") + toggle ve formátu výstupu jmen.
- **V8 — Mini-rodokmen**: hloubka generací 1–3 (přeživší sezdané děti dostanou vlastní porodní řadu; synové dědí příjmení, dcery berou partnerovo), strop ~200 osob, odsazený stromový výstup.
- **V9 — Deterministický seed**: mulberry32 z textového seedu; každé generování zobrazí použitý seed (sdílení „stejný seed = stejná rodina"), pole pro ruční zadání.

## 3. Datový model — `NameSet` (kolekce `name_sets`)

```
NameSet { scope:'community', name ⭐, category: 'morvol'|'svet'|'vlastni',
          description?, surnameNote?, tags?,
          maleNames: string[], femaleNames: string[], surnames: string[],
          epithets: string[],                     // V7 (default [])
          femaleSurnameRule: 'none'|'cs',         // V1
          frequencySorted: boolean,               // V2
          demography?: { lifespanMult?: number,   // V6
                         fertilityFrom?: number, fertilityTo?: number },
          status: draft|approved, authorId, approved*, moderation* }
```

Duplicitní jména UVNITŘ pole nejsou (dedup při zápisu); DTO limit 6000/pole (ochrana). Bez obrázků (žádný media cleanup).

## 4. FE

Route `/ikaros/generatory` — **11. dlaždice** hubu (ikona `Dices`); dvě záložky:
- **Jména:** výběr sady (skupiny Morvol / Státy světa / Vlastní; hledání), parametry (počet/pohlaví/formát), výsledky se zámky, kopírování; odkaz „Spravovat sady" → list sad (2 knihovny draft/approved, vzor herbář) + editor (R2) + detail sady (statistiky počtů, vzorky, akce kurátora).
- **Potomci:** parametry (R4) + tabulka slotů + „Pojmenuj" ze zvolené sady + kopírování. Data-atributy `data-generator-*`.

## 5. Seed — sady a mapování

**Morvol (z Excelu, sloupce → sady):** Lidská · Elfí (elfí/satyrská příjmení sdílená — v Excelu jeden sloupec) · Trpasličí (≈ skandinávská) · Harpyje · Brolgové · Skřetí/Hobití (≈ česká) · Ogerská (bez příjmení — `surnameNote`) · Ašatská · Padlí skřeti/hobiti (≈ ruská/cyrilice v závorce) · Satyři · Saimatei (příjmení „podle rodiče" — `surnameNote`; jména ≈ polská/slovanská VELKÝMI → normalizovat) · Cielfané (≈ italská) · Skřítci (≈ japonská) · Hirejchal (≈ vietnamská) · Vampýři (≈ nizozemská) · Kentauři (≈ francouzsko-germánská?) · Gorily (≈ norská) · Tan-Tan (≈ řecká/čínská?) · Orkové (≈ turecká) · Istreliané (≈ arabská) · Butelengové (≈ indická) · Kudlanky (≈ čínská). ⚠️ Mapování odvozeno ze vzorků — **potvrdí se v dry-runu** (uživatel zkontroluje, doplnění musí ladit s jeho zvukem národa).

**Státy světa (≥40; výběr laděn na JAZYKOVOU odlišnost — rozhodnutí uživatele 2026-07-13: Slovensko vyřazeno, Maďarsko/Finsko drženy jako odlišné jazyky, přidány izoláty a vzdálené rodiny):** Česko ⭐ · Polsko · Ukrajina · Rusko · Německo · Rakousko · Švýcarsko · Francie · Itálie · Španělsko · Portugalsko · Anglie · Skotsko · Irsko · Wales · Nizozemsko · Švédsko · Norsko · Dánsko · Finsko · Island · Maďarsko · Rumunsko · Bulharsko · Srbsko · Chorvatsko · Řecko · Turecko · Litva · Albánie · **Baskicko** (jazykový izolát) · **Gruzie** · **Arménie** · Egypt/arabská · Izrael/hebrejská · Írán/perská · Indie · **Bangladéš** · Čína · Japonsko · Korea · Vietnam · Thajsko · **Kambodža** · Mongolsko · **Indonésie** · **Filipíny** · Etiopie · Nigérie/yorubská · Keňa/svahilská · **JAR/zuluská** · Brazílie · Mexiko · USA. (54 sad.)

## 6. Mimo scope

Plný engine tabulek 21.2 (vážené položky, podmínky, editor obecných tabulek) · generátory vzhledu/povahy/příběhu · sekce Království (dynastie/tituly — per-svět data později) · přímé napojení na tvorbu postavy/NPC a rodokmen 17.7 (výstup se kopíruje; integrace = další etapa) · skiny.
