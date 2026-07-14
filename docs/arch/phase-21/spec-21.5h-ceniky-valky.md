# Spec 21.5h — Ceníky: éry 1. a 2. světová válka (dobové USD)

> Roadmap: třetí a čtvrtá obsahová dávka knihovny Ceníků — follow-up avizovaný v [spec-21.5g](spec-21.5g-ceniky-pritomnost.md) (éry: středověk 21.5f → přítomnost 21.5g → **WW1 + WW2** → budoucnost/další později; tyto dvě jsou dle uživatele primární).
> **Stav:** 🟢 SEEDY PŘIPRAVENY (2026-07-14) — zadáno uživatelem („stejným způsobem… dohledat na internetu"); žádné podklady, vše rešerší veřejných dat (12 web-search agentů sekvenčně: 6×WW1 → 6×WW2). WW1 = 15 ceníků / 454 položek + 38 předmětů; WW2 = 14 ceníků / 434 položek + 28 předmětů; obrázky Wikimedia 100 % (retry kolo zjednodušených dotazů). Výstupy: `scripts/seed-migrace/ceniky-ww1-seed.json` + `ceniky-ww2-seed.json`, workflows `seed-ceniky-ww1.yml`/`seed-ceniky-ww2.yml`. **Dry-runy `c:\tmp\ceniky-ww1-dry-run.html` a `c:\tmp\ceniky-ww2-dry-run.html` musí schválit uživatel PŘED spuštěním workflow (per éra).**

---

## 1. Účel

Dvě sady komunitních ceníků s **dobovými americkými cenami** (WW1 ≈ 1917–1918, WW2 ≈ 1942–1944) — mzdy a žold, potraviny, oblečení, domácnost, doprava, nemovitosti, služby, zbraně, vojenská výstroj, zvířata, neřesti. Cíl ~12 ceníků / ~360–400 položek na éru.

## 2. Klíčová rozhodnutí

- **R1 — Žádné změny BE/FE.** `currency: 'usd'` z 21.5g pokrývá dobové dolary (centové položky přes silver/copper — chléb 1918 = $0.10). Čistě obsahové dávky.
- **R2 — Názvy ceníků nesou éru** („Potraviny — 1. světová"), protože knihovna řadí všechny ceníky abecedně dohromady a bez sufixu by tři „Potraviny" nešly rozlišit. Tagy: `1. světová` / `2. světová`.
- **R3 — Ceny = dobové nominální USD** (BEZ přepočtu na dnešní hodnotu); rok/pramen ceny patří do popisu položky, u WW2 poznámka o přídělovém systému tam, kde platil. Zdroje: BLS historické retail ceny (1918/1943 existují), NBER, dobové katalogy (Sears), vojenské platové tabulky, muzejní/archivní prameny.
- **R4 — Zbraně a výstroj → Předměty bez statbloků** (mirror 21.5g R5): střelné zbraně (kind `střelná/vrhací zbraň`), bajonety/nože/šavle (`zbraň`), helmy (`zbroj`); linkedKey z ceníkových položek. Statblocky nikde (Matrix věci nemají kostky/bonusy).
- **R5 — Obrázky: Wikimedia Commons** (PD/CC0 > CC BY > CC BY-SA, povinný `imageCredit`) — u těchto ér velká výhoda: dobové fotografie jsou většinou PD.
- **R6 — Seed: reuse pipeline i importu.** Per éra vlastní seed JSON + workflow + seedTag (`ceniky:ww1:v1`, `ceniky:ww2:v1`, `ITEM_TAGS` dle éry) — nezávislé opakovatelné běhy. `ceniky-import.js` beze změny (parametrizace z 21.5g).
- **R7 — Dvě oddělené dry-run HTML** (`c:\tmp\ceniky-ww1-dry-run.html`, `c:\tmp\ceniky-ww2-dry-run.html`) — uživatel schvaluje každou éru zvlášť PŘED spuštěním workflow.

## 3. Obsah — návrh ceníků (per éra ~12)

| Ceník (sufix „— 1. světová" / „— 2. světová") | ≈WW1 | ≈WW2 | Poznámky |
|---|---|---|---|
| Práce a žold | 40 | 40 | civilní mzdy (dělník, farmář, úřednice…) + vojenský žold dle hodností; cena = měsíčně |
| Potraviny | 50 | 50 | BLS 1918/1943; WW2 popisy zmíní příděly (maso, cukr, káva) |
| Restaurace a podniky | 20 | 20 | diner, saloon/bar, káva, kino |
| Oblečení | 40 | 40 | Sears katalogy; uniformy do Výstroje |
| Domácnost | 40 | 40 | nábytek, kamna/icebox (WW1) vs. lednice/rádio (WW2) |
| Doprava | 25 | 30 | WW1: Model T, kůň+povoz, vlak; WW2: auto (zmrazené ceny), benzín+příděl, vlak/autobus |
| Nemovitosti a nájmy | 15 | 15 | koupě/nájem, farma |
| Služby | 25 | 25 | holič, lékař, zubař, právník, pošta |
| Zbraně | 40 | 40 | civilní tržní ceny + vojenské kontraktní (v popisu rozlišit); **link → Předměty** |
| Vojenská výstroj | 30 | 30 | helma (zbroj), plynová maska, uniforma, bajonet (zbraň), polní vybavení; **link → Předměty** u zbraní/helm |
| Zvířata | 20 | 15 | WW1: armádní koně/muly! |
| Neřesti a drobnosti | 15 | 20 | cigarety, doutníky, whiskey, noviny; WW2: válečné dluhopisy |
| Zdraví a léky | 30 | 30 | WW1: patentní medicíny; WW2: sulfa/penicilin |
| Zábava a média | 25 | 20* | WW1: Victrola, Brownie, hry; *WW2 = ceník „Elektronika a média" |
| Farma a nástroje | 30 | 30 | stroje, potahy, osivo; WW1: Fordson 1918 |
| **Celkem** | **~445** | **~430** | + ~60 předmětů do katalogu na éru |

**Sekvenční zpracování (požadavek uživatele):** nejdřív kompletní vlna 6 agentů na WW1, teprve po jejím dokončení vlna 6 agentů na WW2. Každá éra má vlastní dry-run a schvaluje se zvlášť.

## 4. Mimo scope

Další éry (budoucnost/kredity, jiné dekády) · přepočty inflace/kurzů · statblocky · změny FE/BE.

## 5. Postup

1. Rešerše (6 web-search agentů: 3×WW1 + 3×WW2) → JSONy ve scratchpadu.
2. Merge per éra (reuse merge.js s konfigurací éry) → Commons dotazy (agenti) → fetch-images (PD/CC filtr) → build-seed.
3. `scripts/seed-migrace/ceniky-ww1-seed.json` + `ceniky-ww2-seed.json` + workflows `seed-ceniky-ww1.yml`/`seed-ceniky-ww2.yml`.
4. Dry-runy → **schválení uživatelem per éra** → commit → workflow (BE deploy už netřeba — currency nasazeno v 21.5g).
5. `funkce` + `napoveda` + roadmapa + paměť.
