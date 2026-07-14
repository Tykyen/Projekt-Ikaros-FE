# Spec 21.5j — Ceníky: éra Blízká budoucnost (kredity) — osidlování sluneční soustavy

> Roadmap: šestá obsahová dávka Ceníků (středověk → přítomnost → WW1+WW2 → western → **blízká budoucnost**). Budoucnost je rozdělena na DVĚ éry dle uživatele: 21.5j blízká budoucnost (kolonizace sluneční soustavy, ~2075) a 21.5k galaktické dobrodružství (samostatný příkaz později). BE/FE beze změn — `currency: 'credits'` je v kódu od 21.5g.
> **Stav:** 🟢 SEED PŘIPRAVEN (2026-07-14) — 13 ceníků / 380 položek v kreditech + 27 předmětů (skafandry=zbroj, flechette/coilgun=střelné; bez statbloků). Ceny extrapolace reálné ekonomiky dle kotev (agenti ověřili: MOXIE→kyslík 1 kr/den sedí energeticky, ISS recyklace 98 %, Starship $/kg, asteroid-mining deflace kovů, saturační potápěči jako hazard-pay analogie). Obrázky Wikimedia 379/380 (reálné NASA analogy). R7 érové sekce knihovny implementovány (FE, vitest 9 ✓). **Dry-run `c:\tmp\ceniky-nearfuture-dry-run.html` musí schválit uživatel PŘED spuštěním workflow `seed-ceniky-nearfuture.yml`.** První éra s fikčními cenami — extrapolace, ne dohledaná data.

---

## 1. Klíčová rozhodnutí

- **R1 — Měna: kredity (`credits`).** Kalibrace **1 kr ≈ kupní síla 1 USD (2025)** — hráč intuitivně čte hodnoty. FE zobrazí „125 kr" / „5,25 kr" (formatPrice z 21.5g). Uložení gold=kredity, silver/copper=setiny.
- **R2 — Ceny = extrapolace reálných dat, ne libovůle.** Agenti nejdřív rešerší REÁLNÉ kotvy (SpaceX $/kg, ceny skafandrů, vesmírná turistika, ISS provoz, ISRU studie, NASA rozpočty) a pak extrapolují do ~2075 podle sdílené tabulky kotev (kap. 2) — všech 6 agentů stejnou, aby mzdy ↔ doprava ↔ zboží ekonomicky seděly (lekce z cenové revize Morvolu). Reálná kotva patří do popisu, kde dává smysl („dnes stojí X, v éře kolonií…" NE — popis je herní/encyklopedický z pohledu éry; kotvy slouží kalibraci).
- **R3 — Setting neutrální, bez IP.** Žádné názvy z Expanse/Star Citizen apod. — obecné pojmy (kupole, habitat, ISRU, cycler, mass driver). Popisy česky, encyklopedické z pohledu obyvatele éry.
- **R4 — Zbraně/ochrana → Předměty bez statbloků**: sekce Palné a energetické → `střelná/vrhací zbraň`, Chladné a nesmrtící → `zbraň`; skafandry a ochrana těla → `zbroj` (EVA skafandr = „zbroj" éry). ⚠️ herní kolorit: střelné zbraně v habitatu = riziko dekomprese → důraz na nesmrtící (v popisech).
- **R5 — Obrázky Wikimedia**: reálné analogy (NASA PD fotky — EVA skafandry, ISS interiéry, Mars povrch, hydroponie, roboti, prototypy railgunu; NASA concept art = PD). Dotazy bez éra-kvalifikátorů.
- **R6 — Seed reuse:** éra `nearfuture` v pipeline `cenik-valky/`, tag `blízká budoucnost`, seedTag `ceniky:nearfuture:v1`, workflow `seed-ceniky-nearfuture.yml`. Dry-run `c:\tmp\ceniky-nearfuture-dry-run.html` schvaluje uživatel.
- **R7 — Knihovna seskupená podle ér (FE, požadavek uživatele u 71 nasazených ceníků):** `KomunitniCenikyPage` seskupí seznam do chronologických sekcí podle érového štítku (Středověk a fantasy [`morvol`] → Divoký západ → 1. světová → 2. světová → Přítomnost → Blízká budoucnost → Galaktické dobrodružství); ceníky bez érového štítku → „Ostatní" (komunitní tvorba). Registr ér = FE konstanta v `types.ts` (tag → label, pořadí). Filtr štítku i knihovny návrhů zůstávají beze změny. **Rozšíření (2026-07-14, u 110 nasazených):** klikací **chips filtr ér** nad štítkovým filtrem (`eraChips` — jen éry existující v aktuální knihovně, s počty; „Vše" = reset; `aria-pressed`, 44px dotyk na mobilu; neexistující volba se degraduje na „Vše").
- **R8 — Inspirace fan tvorbou (pokyn uživatele):** ceny lze kalibrovat i podle ekonomik ze sci-fi filmů a fanouškovských děl (wiki, fan RPG suplementy) — jen HODNOTY a poměry, žádné převzaté texty ani IP názvy (R3 platí). Hlavní využití u 21.5k galaktické dobrodružství.

## 2. Ekonomické kotvy éry (~2075) — SDÍLENÉ všemi agenty

| Kotva | Hodnota | Reálný základ (2025) |
|---|---|---|
| Náklad Země → LEO | 20 kr/kg | Falcon 9 ~2 700 $/kg, Starship cíl <100 $/kg |
| LEO → povrch Měsíce | +80 kr/kg | ~5–10× LEO dnes |
| Země → povrch Marsu | 250 kr/kg (okno) | studie 100–500 $/kg při plné technologii |
| Letenka osoba do LEO | 15 000 kr | dnes 55 M$ (Axiom) → pokles o 3 řády |
| Letenka Měsíc / Mars | 60 000 / 200 000 kr | extrapolace hmotnosti+podpory |
| Základní mzda kolonisty | 3 000 kr/měs + rizikové | dnešní technik 4–6k $ + hazard pay |
| Specialista (pilot, lékař, inženýr) | 8 000–15 000 kr/měs | prémie za vzácnost na frontieru |
| Kyslík (ISRU, osoba/den) | 1 kr | MOXIE-class elektrolýza, lokální |
| Voda recyklovaná (100 l) | 2 kr | ISS recyklace >95 % |
| Voda importovaná/led z asteroidu (t) | 500 kr | ISRU těžba vs. import |
| Energie (kWh, solár/jádro) | 0,05 kr | dnešní utility-scale solár |
| Import ze Země | cena zboží + hmotnost × transport | káva 250 g na Mars ≈ 5 + 63 kr |
| Habitat modul obytný (nový, 20 m²) | 250 000 kr | prefab + certifikace přetlaku |

Luxus = vše importované a „pozemské" (káva, čokoláda, dřevo, kožené boty); levné = lokální ISRU (kyslík, voda, regolitové stavby, hydroponická zelenina).

## 3. Obsah — 13 ceníků / ~380 položek (sufix „— blízká budoucnost")

| Ceník | ≈ | Poznámky |
|---|---|---|
| Práce a výdělky | 40 | kolonista, EVA technik, pilot, hydroponik, AI operátor, horník na asteroidech |
| Služby a licence | 25 | údržba skafandru, dekontaminace, pilotní licence, pojištění, notář kolonie |
| Doprava a lety | 30 | starty, letenky, cargo, cycler kajuta, palivo metan/LOX, výtahy nákladu |
| Suroviny a obchod | 25 | led, regolit, He-3, vzácné kovy, mining claim, tištěné díly |
| Bydlení a habitaty | 25 | kajuta, modul, kupole nájem, tlakový stan, regolitový kryt |
| Životní podpora | 30 | kyslík, voda, filtry, scrubbery, recyklátory, náhradní díly |
| Potraviny | 35 | hydroponie, řasy, mykoprotein, bioreaktorové maso, importy (káva!) |
| Zábava a neřesti | 25 | VR, nízkogravitační sporty, destilát z kolonie, tabák (černý trh — zákaz v habitatu) |
| Skafandry a ochrana | 30 | EVA/IVA skafandr (→ Předměty, zbroj), radiační vesta, přilby, údržba |
| Zbraně a bezpečnost | 30 | nesmrtící důraz, coilgun, flechette (nízké riziko dekomprese), zámky, drony (→ Předměty) |
| Nářadí a technika | 30 | 3D tiskárny, vakuové svařování, rover, manipulátor, diagnostika |
| Elektronika a komunikace | 25 | komunikátor, laserový uplink, výpočetní čas, pásmo, senzory |
| Zdraví a medicína | 30 | radiační medicína, kostní terapie, chirurgie, hibernační lůžko (experimentální) |

## 4. Mimo scope

Galaktické dobrodružství (21.5k — samostatný příkaz) · FTL/exotika · změny BE/FE · statblocky.

## 5. Postup

Rešerše reálných kotev + extrapolace (6 agentů, 1 vlna, sdílená tabulka kotev) → merge (`nearfuture`, currency credits) → Commons dotazy (2 agenti, reálné analogy) → fetch+retry → build → **dry-run schválí uživatel** → commit → workflow.
