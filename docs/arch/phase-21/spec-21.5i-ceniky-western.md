# Spec 21.5i — Ceníky: éra Divoký západ (dobové USD)

> Roadmap: pátá obsahová dávka knihovny Ceníků (éry: středověk 21.5f → přítomnost 21.5g → WW1+WW2 21.5h → **western**). Mirror [spec-21.5h](spec-21.5h-ceniky-valky.md) — čistě obsahová dávka, BE/FE beze změn.
> **Stav:** 🟢 SEED PŘIPRAVEN (2026-07-14) — 13 ceníků / 391 položek + 31 předmětů (zbraně/nože bez statbloků); obrázky Wikimedia 100 % (391/391 — dotazy bez éra-kvalifikátorů dle poučení z 21.5h daly 98 % napoprvé, retry jen 8). Doložené kotvy: Colt SAA $17, Winchester 1873 $27–40, Stetson $5, Levi's $1.25–1.46, longhorn Texas $4 vs. Kansas $30, Homestead $18. Výstupy: `scripts/seed-migrace/ceniky-western-seed.json` + workflow `seed-ceniky-western.yml`. **Dry-run `c:\tmp\ceniky-western-dry-run.html` musí schválit uživatel PŘED spuštěním workflow.**

---

## 1. Klíčová rozhodnutí (dědí R1–R7 z 21.5h)

- Dobové nominální USD ~1865–1890, rok v popisu; `currency: 'usd'`.
- Názvy nesou éru („Potraviny — divoký západ"), tag `divoký západ`.
- Zbraně + nože → Předměty bez statbloků (kind dle sekce), `linkedKey`.
- Obrázky Wikimedia (dobové PD fotky/katalogové rytiny); dotazy BEZ éra-kvalifikátorů (poučení z 21.5h), éru nese předmět sám.
- Seed: `ceniky-western-seed.json` + workflow `seed-ceniky-western.yml`, seedTag `ceniky:western:v1`; pipeline reuse `cenik-valky/` skriptů (přidaná éra `western`).
- Jedna vlna 6 agentů (jediná éra — sekvenčnost dodržena).

## 2. Obsah — 13 ceníků / ~400 položek

| Ceník („— divoký západ") | ≈ | Poznámky |
|---|---|---|
| Práce a mzdy | 40 | kovboj $25–40/měs + strava, trail drive, šerif, marshal, lovec bizonů, zlatokop, Pony Express |
| Potraviny a zásoby | 40 | general store: mouka, fazole, slanina, káva Arbuckle, konzervované broskve, hardtack |
| Saloon a podniky | 25 | whiskey 25¢, pivo, jídlo, hotel, koupel 25¢, faro, opera house |
| Oblečení | 35 | Stetson, boty, ostruhy, Levi's (1873!), duster, chapsy, bandana |
| Domácnost a potřeby | 35 | kamna, petrolejka, Dutch oven, valcha, provaz, stan |
| Doprava a cestování | 25 | dostavník, vlak emigrant/1. třída, prérijní vůz, telegram, Pony Express |
| Koně a dobytek | 30 | cow pony, mustang, mula, voli, longhorn, sedlo, podkování |
| Pozemky a stavby | 20 | Homestead Act $18, parcela, ranč, důlní claim, srub, sod house |
| Služby | 25 | kovář, lékař, prádelna, **pohřebák**, advokát, fotograf |
| Zbraně | 40 | Colt SAA $17, Winchester 1873, Sharps, derringer, coach gun; **link → Předměty** |
| Vybavení stopaře | 30 | lasso, bowie nůž (→ Předměty), bedroll, rýžovací pánev, dynamit, dalekohled |
| Zdraví a léky | 25 | hadí olej, laudanum, chinin, extrakce kulky, zubař |
| Neřesti a zábava | 20 | tabák, doutníky, hrací karty, dime novel, banjo |

## 3. Postup

Rešerše (6 agentů, 1 vlna) → merge → Commons dotazy (2 agenti) → fetch+retry → build → **dry-run `c:\tmp\ceniky-western-dry-run.html` schválí uživatel** → commit → workflow.
