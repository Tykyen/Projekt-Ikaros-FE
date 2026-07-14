# Spec 21.5g — Ceníky: éra Přítomnost (USD) + měnový flag

> Roadmap: rozšíření knihovny Ceníků (21.5f) o druhou éru. Vize: tři éry ceníků — **středověk/fantasy** (hotovo, 21.5f, zl/st/md) → **přítomnost** (tato spec, USD) → **budoucnost** (později, kredity). Follow-up dávky: 1. a 2. světová válka (dobové USD, extra rešerše — mimo scope této spec).
> **Stav:** 🟢 FE+BE IMPLEMENTOVÁNO (2026-07-13) — schváleno uživatelem („Jdeme na to."). BE `currency` (schema/DTO/service/toEntity; typecheck+lint ✓), FE `formatPrice`/editor `$`/badge/`InsertToShopModal.priceCurrency` (build ✓, vitest 7 ✓). Rešerše hotová (6 agentů, 995 položek). Seed pipeline: scratchpad `cenik-pritomnost/` (merge→queries→fetch-images→build-seed) → `scripts/seed-migrace/ceniky-pritomnost-seed.json` + parametrizovaný `ceniky-import.js` + workflow `seed-ceniky-pritomnost.yml`. **Dry-run HTML `c:\tmp\ceniky-pritomnost-dry-run.html` musí schválit uživatel PŘED spuštěním workflow.**

---

## 1. Účel

Druhá sada komunitních ceníků pokrývající **současnost**: vše, co postava v moderním světě potřebuje — práce a výdělky, potraviny, drogerie, oblečení, elektronika, vozidla, nemovitosti, služby, zbraně… Ceny **v amerických dolarech** z rešerše veřejných dat (BLS, průměrné US retail ceny, MSRP). Názvy a popisy česky, ceny USD. Cíl ~20 ceníků / ~1 000 položek (parita se středověkým seedem).

## 2. Klíčová rozhodnutí

- **R1 — Měnový flag `currency: 'gsc' | 'usd' | 'credits'`** na úrovni ceníku, default `gsc` (stávající ceníky beze změny, bez migrace). **Interní uložení ceny se NEMĚNÍ** — `{gold, silver, copper}` zůstává; USD mapuje 1:1 na strukturu 1/10/100: `gold` = dolary, `silver` = desetníky (10 ¢), `copper` = centy. `credits` = rezervováno pro éru Budoucnost (jen enum hodnota, obsah později).
- **R2 — Zobrazení a editace per měna.** `formatGsc` → obecný `formatPrice(p, currency)`: `gsc` beze změny („2 zl 5 st"), `usd` = `$12.34` (celé dolary bez centů = „$12", vše nula = „zdarma"), `credits` zatím jako `1 234 kr`. Editor: u `usd` ceníku místo tří polí zl/st/md **jedno desetinné pole `$`** (parse na dolary+centy → gold/silver/copper). Měna se volí při založení ceníku (select v jádru editoru), u existujícího ceníku ji smí změnit jen autor draftu/kurátor.
- **R3 — Vklad do obchodu beze změny výpočtu.** `priceGsc` a vzorec `gold + silver/10 + copper/100` platí pro všechny měny (u USD dá přesně dolary s centy). Jediná změna: `InsertToShopModal` dostane volitelné `currency` a přizpůsobí popisek selectu („Měna pro zlaté" / „Měna pro dolary" / „Měna pro kredity").
- **R4 — Obsah = rešerše veřejných US dat.** Mzdy z **BLS OES**, potraviny z **BLS average price data**, ostatní typické US retail/MSRP ceny (~2025/26), zaokrouhlené na herně praktické hodnoty. U mzdových položek cena = **měsíční hrubý výdělek**, popis uvádí hodinovku a rok. Generické názvy položek („Smartphone střední třídy"), konkrétní modely jen kde jsou ikonické (zbraně: Glock 17, AR-15…). Žádné převzaté texty — popisy vlastní, česky.
- **R5 — Moderní zbraně a ochrana → Předměty BEZ statbloků.** Střelné zbraně, chladné zbraně, neprůstřelné vesty/helmy jdou i do katalogu Předmětů (jen jádro: název · popis · druh zbraň/zbroj · obrázek), ceníkové položky linkují přes `linkedItemId`. **Žádné statblocky** — v Matrix stylu věci nemají kostky zranění ani bonusy, jsou to jen věci a čísla (ceny). Statblocky pro libovolné systémy může později doplnit komunita standardním flow „navrhnout statblok". **Těžiště této spec jsou položky a ceny.**
- **R6 — Obrázky: stejná licenční kázeň jako 21.5f R6.** Jen Wikimedia Commons PD/CC0 > CC BY > CC BY-SA, povinný `imageCredit`, Cloudinary folder `community-ceniky`.
- **R7 — Éra přes tagy, žádné nové pole.** Každý ceník dostane tag `přítomnost` + kategorii; FE filtr štítků už existuje. (Středověkým ceníkům lze později doplnit tag `fantasy` — mimo scope.)
- **R8 — Seed = stejná pipeline jako 21.5f R8:** scratchpad pipeline (research → build → obrázky → dry-run HTML) → `scripts/seed-migrace/ceniky-pritomnost-seed.json` + reuse `ceniky-import.js` (parametr souboru/seedTagu) + workflow `seed-ceniky-pritomnost.yml`. SeedTag `ceniky:pritomnost:v1`. **Dry-run HTML musí schválit uživatel PŘED spuštěním workflow.**

## 3. Změny BE (modul `price-lists`)

Field-drift checklist (schema → DTO → service → **toEntity**):

- Schema `price_lists`: `currency: string enum ['gsc','usd','credits'], default 'gsc'`.
- Create/Update DTO: volitelné `currency` s enum validací.
- Service: propsat při create/update (update jen autor draftu / kurátor — stejná práva jako zbytek jádra).
- `toEntity`: přidat do whitelistu.
- ⚠️ Po nasazení nutný restart BE (starý bundle by pole dropnul).

## 4. Změny FE (`src/features/ikaros/ceniky`)

- `types.ts`: `currency` v typu + `formatPrice(p, currency)` (nahradí přímá volání `formatGsc`; `formatGsc` zůstane jako gsc větev).
- `CenikEditorModal`: select měny v jádru + přepínání editace ceny (3 pole gsc ↔ 1 pole `$`).
- `KomunitniCenikDetailPage` + karty knihovny: cena přes `formatPrice`; badge měny na kartě ceníku (💲 u usd).
- `shopInsert.ts` + `InsertToShopModal`: propsat `currency`, upravit popisek selectu měny (R3).
- Testy: vitest na `formatPrice` (usd formát, hrany 0 ¢ / jen centy / zdarma) + persistence editoru (gsc→usd→gsc, hodnoty se nesmí ztratit).

## 5. Obsah — návrh ceníků éry Přítomnost (~20 / ~1 000 položek)

| Ceník | ≈Položek | Sekce / poznámky | Hlavní zdroj |
|---|---|---|---|
| Práce a výdělky | 70 | sekce dle odvětví; cena = měsíční mzda | BLS OES |
| Potraviny | 90 | pečivo · maso · mléčné · ovoce/zelenina · trvanlivé | BLS avg prices |
| Restaurace a občerstvení | 40 | fast food · restaurace · kavárna | veřejné ceníky |
| Nápoje a alkohol | 60 | nealko · pivo · víno · lihoviny | retail |
| Drogerie a hygiena | 45 | — | retail |
| Domácnost a nábytek | 60 | nábytek · spotřebiče · kuchyň | retail |
| Oblečení a obuv | 70 | pánské · dámské · boty · doplňky | retail |
| Elektronika | 75 | telefony · PC · TV/audio · foto · konzole | MSRP |
| Komunikace a předplatné | 25 | tarify · internet · streaming | veřejné ceníky |
| Nemovitosti a nájmy | 25 | koupě · nájem; dle typu a lokality | Zillow/celostátní mediány |
| Auta a motorky | 55 | třídy vozů · ojetiny · motorky | MSRP/KBB |
| Doprava a cestování | 35 | palivo · MHD · taxi · letenky · hotel | veřejná data |
| Služby | 55 | řemeslníci · osobní služby · právní | veřejná data |
| Zdraví a léky | 35 | lékárna · ošetření (US ceny) | veřejná data |
| Střelné zbraně | 60 | pistole · revolvery · pušky · brokovnice; **link → Předměty** | MSRP |
| Chladné zbraně a sebeobrana | 30 | nože · teleskopy · pepřáky/tasery; **link → Předměty** | retail |
| Ochranné prostředky | 15 | vesty · helmy · štíty; **link → Předměty** (zbroje) | retail |
| Outdoor a survival | 45 | kemping · nářadí · optika | retail |
| Sport a volný čas | 40 | — | retail |
| Zvířata | 25 | pořízení + krmivo | veřejná data |
| Drogy | 15 | ilegální trh (herní ceny) | UNODC/veřejné odhady |
| Knihy a média | 25 | — | retail |

Celkem ~995 položek ve 22 cenících + ~105 předmětů do katalogu Předmětů (zbraně/ochrana, jádro bez statbloků).

## 6. Mimo scope

Éra Budoucnost (kredity — jen enum) · ceníky 1./2. světové války (follow-up dávky, dobové USD) · kurzy/převody mezi měnami · přecenění nebo tagování středověkých ceníků · picker linkovaného předmětu (trvá dluh z 21.5f) · **statblocky pro jiné systémy než matrix** (follow-up: adaptace s bonusy dle stylu systému, vlastní čísla bez kopírování příruček, seed jako návrhy pending review).

## 7. Postup

1. Schválení této spec.
2. BE+FE `currency` flag (kap. 3+4) — samostatné dávky, nemíchat.
3. Rešerše obsahu (web research per ceník, průběžně do scratchpad JSON).
4. Zbraně/ochrana do Předmětů (jen jádro, bez statbloků) + linky z ceníků.
5. Obrázky Wikimedia → Cloudinary.
6. Dry-run HTML → **schválení uživatelem** → workflow seed.
7. `funkce` + `napoveda` + zaškrtnutí roadmapy.
