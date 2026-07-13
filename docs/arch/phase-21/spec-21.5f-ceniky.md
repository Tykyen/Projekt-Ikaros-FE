# Spec 21.5f — Ceníky (komunitní knihovna) — kolekce položek s cenou + vklad do obchodu

> Roadmap: šestá knihovna Společné tvorby (21.5f), realizace „předpřipravených obchodů" z 21.1 v podobě sdílených ceníků. **Dědí model** [spec-21.5a](spec-21.5a-herbar.md) (herbář — nejjednodušší entita rodiny + vklad do obchodu + seed workflow) a odkazuje na [spec-21.5e](spec-21.5e-predmety.md) (Předměty — per-systém statblocky přes link).
> **Stav:** 🟢 FE+BE IMPLEMENTOVÁNO (2026-07-13) — BE modul `price-lists` (typecheck+lint ✓), FE `/ikaros/ceniky` + 10. dlaždice + rozšíření `InsertToShopModal` (build ✓, vitest 107+25 ✓). Seed pipeline postavena (`scripts/seed-migrace/ceniky-seed.json` + `ceniky-import.js` + workflow `seed-ceniky.yml`; 20 ceníků / 1011 položek, 933 s obrázkem Wikimedia PD/CC, 103 zbraní/zbrojí do Předmětů) — **čeká na dry-run schválení uživatelem (`c:\tmp\ceniky-dry-run.html`) a deploy BE**. Schváleno uživatelem 2026-07-13 („Prostě udělej postupně ty a všechno.").

---

## 1. Účel

Komunitní knihovna **ceníků** (`/ikaros/ceniky`, **nová 10. dlaždice hubu**). Ceník = pojmenovaná kolekce položek zboží/služeb (název · popis · obrázek · cena ve zlatých/stříbrných/měďácích · sekce), kterou správce světa (PomocnyPJ+) vloží jedním klikem do obchodu svého světa — s per-položkovými cenami. Primární obsah = seed ~20 ceníků z uživatelova `Ceník.xlsx` (Morvol, ~1 000 položek).

## 2. Klíčová rozhodnutí

- **R1 — Ceník = jeden dokument s vnořenými položkami** (`items[]`, max 200), ne tisíc samostatných komunitních entit. Kurátorská kontrola (draft/approved), komentáře i moderace na úrovni **ceníku**. Důvod: „Snídaně žebrácká" nemá co dělat jako samostatný katalogový předmět; editace je inline tabulka; vklad je bulk; nezaplaví katalog Předmětů.
- **R2 — Cena strukturovaná `{gold, silver, copper}`** (celá čísla ≥ 0), pevný poměr **1 zl = 10 st = 100 md** (odpovídá vzorcům zdrojového Excelu). Zobrazení složeně („2 zl 5 st", nulové složky se vynechávají; vše nula = „zdarma"). Jiné měny Excelu (Slunce, Měsíc, drahokamy…) se ignorují — jsou to jen přepočty.
- **R3 — Vklad do obchodu s per-položkovou cenou.** Rozšíření generického `InsertToShopModal` (herbář/lektvary/předměty): `ShopInsertItem` dostane volitelné `priceGsc?: {gold,silver,copper}`; pokud je přítomné, modal místo „Výchozí cena pro všechny" nabídne select **„Měna pro zlaté"** (default báze světa) a cena každé položky se spočte `gold + silver/10 + copper/100` v té měně. Svět bez měn → uloží se číslo bez měny. Reuse `POST /campaign/shopitems/bulk` (dávky ≤ 200). Zpětně kompatibilní (bez `priceGsc` beze změny chování).
- **R4 — Zbraně a zbroje: staty per systém přes LINK na Předměty**, ne embed. Položka ceníku má volitelné `linkedItemId` → `community_items`; detail ceníku zobrazí překlik. Statblocková mašinerie (návrhy per systém, kurátor, komentáře) se NEduplikuje — je v Předmětech ([spec-21.5e](spec-21.5e-predmety.md)). Otevírá budoucí „koupil → import do výbavy".
- **R5 — Žádné staty z cizích příruček** (stejné rozhodnutí jako kouzla 21.5c — copyright). Seed založí zbraně/zbroje v Předmětech se statblokem jen pro **matrix** (Morvol = uživatelův vlastní systém; kostky zranění ze sloupce Excelu, status approved — data od autora systému). Ostatní systémy doplní komunita přes existující flow „navrhnout statblok".
- **R6 — Obrázky: licenční kázeň.** Jediný zdroj = **Wikimedia Commons** s licenčním filtrem PD/CC0 > CC BY > CC BY-SA; u KAŽDÉHO převzatého obrázku povinné pole `imageCredit` (autor · zdroj · licence), FE ho zobrazuje jako tooltip miniatury. ⚠️ Obrázky lodí/vozů z Excelu se NEpoužily — drawing XML prozradil původ z vyhledávače („Výsledek obrázku pro elfs ship") = neznámá licence; reálné typy lodí dostaly PD rytiny/fotky z Commons, fantasy plavidla (elfí lodě, loď ašaků) zůstala bez obrázku. Fantasy názvy (čaje/piva/vína/knihy) = sdílené kategorie obrázků s rotací (piva dle typu s/t/ř/f, vína dle barvy). Dosažené pokrytí 933/1011 (92 %). Cloudinary folder `community-ceniky` (upload dělá import uvnitř BE kontejneru, stabilní public_id → idempotentní).
- **R7 — Reuse rodiny Společné tvorby:** BE mirror `plants` (community scope, draft/approved, kurátor gate `isBestieCurator`, login-required celý controller — parita), FE vzor herbář (2 knihovny, detail, editor), moderace `ReportTargetType.PriceList`, komentáře `price_list_comments` (jen úroveň ceníku, bez statblockové úrovně).
- **R8 — Seed = mechanismus `seed-plants`** (NDJSON + FE workflow `.github/workflows/seed-ceniky.yml` + `scripts/seed-migrace/`, idempotence `seedTag`, obrázky předem na Cloudinary). Seed workflows patří do FE repa.

## 3. Datový model — `PriceList` (kolekce `price_lists`)

```
PriceList { scope:'community', name ⭐, description?, imageUrl?+focal/zoom/fit,
            tags?, status: draft|approved, authorId, approved*, moderation*,
            items: PriceListItem[] (max 200) }

PriceListItem { id (uuid), name ⭐, description?, section?,
                imageUrl?+focal/zoom/fit, imageCredit?,
                gold:int≥0, silver:int≥0, copper:int≥0,
                linkedItemId?, order }
```

Komentáře `price_list_comments`, pending `community_price_list_pending_review`, PRICELIST_* error kódy. `section` = volný text (skupiny uvnitř ceníku: „V hospodě", regiony čajů…); FE tabulku podle sekcí seskupuje.

## 4. FE

Route `/ikaros/ceniky` (+ `/:id`), **nová 10. dlaždice** hubu (ikona `ReceiptText`). Knihovny návrhy/schválené + hledání a filtr štítků (vzor herbář). **Detail** = hlavička (název, popis, obrázek, štítky, akce) + tabulka položek seskupená po sekcích: miniatura · název · popis · cena („2 zl 5 st") · překlik na Předmět (`linkedItemId`) · single vklad do obchodu; nad tabulkou filtr sekce + bulk „Vložit ceník do obchodu" (respektuje aktivní filtr sekce). **Editor** = jádro + inline správa položek (přidat/upravit/smazat/přesunout, sekce, obrázek s focal/zoom/fit + `imageCredit`, cena 3 pole zl/st/md, výběr linknutého předmětu přes existující picker vzor). Oprávnění mirror herbář (autor draftu / kurátor). Data-atributy `data-cenik-*`.

## 5. Mimo scope

Import do výbavy postavy · skiny (fáze `skin`) · per-svět privátní ceníky (community only, jako celá rodina) · editace kurzu 1:10:100 (pevný) · statblocky přímo v položkách ceníku (řeší link na Předměty).

## 6. Seed z `Ceník.xlsx` (Morvol)

Zdroj: `G:\Můj disk\Morvol\Všeobecné\Ceník.xlsx` (24 listů). Ceny čteme VÝHRADNĚ ze sloupců Zlatý/Stříbrný/Měďák. Legenda zkratek (druhy čajů, stupňovitost piv, typy bylin/drog…) z listu **Pomocné tabulky** → do popisů položek. 1 list = 1 ceník:

| List | ≈Položek | Název | Cena | Popis / sekce |
|---|---|---|---|---|
| Běžné zboží | 123 | A | B/C/D | — |
| Balíčky jídla | 12 | D | F/G/H | **uzavřené samostatné body**: popis = „Uvnitř" + váha + počet dní |
| Byliny a koření | 67 | B | C/D/E | sekce dle Typ (bylina/koření) |
| Ceny podniků | 53 | A | B/C/D | služby |
| Čaje | 79 | C | D/E/F | sekce = region (A); popis += druh (B, legenda) |
| Domy | 23 | A | B/C/D | — |
| Drahokamy a Kovy | 42 | A | B/C/D | sekce Drahokamy/Kovy |
| Drogy | 16 | B | C/D/E | popis += typ (A, legenda) |
| Jídlo | 36 | A | B/C/D | — |
| Knihy | 50 | B | C/D/E | popis += počet stran (A) |
| Oblečení | 128 | A | B/C/D | — |
| Očarování | 50 | B | C/D/E | služby; popis += hodiny (A); sekce zbraně/zbroje |
| Pití | 24 | A | B/C/D | sekce „V hospodě" / „V tržnici, obchodě" |
| Pivo | ~90 | D | E/F/G | sekce = region (A); popis += pivovar (B) + stupňovitost/typ (C, legenda) |
| Stavební materiál | 21 | A | B/C/D | — |
| Víno | ~50 | C | D/E/F | sekce druhy vín/vinice; popis += sladkost+barva / region+vinice |
| Vozy a lodě | 27 | A | B/C/D | sekce Vozy/Lodě; **obrázky z listů Vzhled lodí + Vzhledy vozů** |
| Zbraně | 85 | B | C/D/E | popis += kostky (A); **link → Předměty** (matrix statblok) |
| Zbroje | 18 | B | C/D/E | **link → Předměty** (matrix statblok) |
| Zvířata | 20 | A | B/C/D | — |

Vynechává se: **Výdělek** (mzdy, není zboží), **Pomocné tabulky** (jen legenda), listy vzhledů (zdroj obrázků). Řádky sekčních nadpisů a obecných druhů („Místní pivo"…) → sekce „Obecné" nebo sekční nadpis dle listu. Celkem ~1 014 položek ve 20 cenících + ~103 předmětů v katalogu Předmětů (zbraně+zbroje, systemId `matrix`).

Pipeline: parser xlsx (hotový, scratchpad) → kurátorské mapování obrázků (Wikimedia API + ruční kontrola relevance, R6) → upload Cloudinary → NDJSON → seed workflow. Dry-run výstup (přehled položek + navržených obrázků) předložit uživateli PŘED nahráním.
