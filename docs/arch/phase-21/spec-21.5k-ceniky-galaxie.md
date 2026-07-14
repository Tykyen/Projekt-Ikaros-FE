# Spec 21.5k — Ceníky: éra Galaktické dobrodružství (kredity)

> Roadmap: sedmá obsahová dávka Ceníků — druhá polovina „budoucnosti" dle rozdělení uživatele (21.5j blízká budoucnost → **21.5k galaktická space opera**). BE/FE beze změn; érový štítek `galaktické dobrodružství` už je v FE registru ér (21.5j R7).
> **Stav:** 🟢 SEED PŘIPRAVEN (2026-07-14) — 13 ceníků / 380 položek v kreditech + 38 předmětů (energetické zbraně `střelná`, zbroje+štíty `zbroj`; bez statbloků). Kalibrace z fan ekonomik proběhla dle pokynu (Traveller mzdy posádky sedí na kotvy ~1:1, SW ceny blasterů/droidů/lodí, Elite doky a vnitrosystém, Starfinder/Cyberpunk RED poměry kybernetiky — jen hodnoty, žádná IP jména v obsahu). Obrázky Wikimedia 380/380 (reálné analogy + retry). Výstupy: `scripts/seed-migrace/ceniky-galaxy-seed.json` + workflow `seed-ceniky-galaxy.yml`. **Dry-run `c:\tmp\ceniky-galaxy-dry-run.html` musí schválit uživatel PŘED spuštěním workflow.**

---

## 1. Klíčová rozhodnutí

- **R1 — Kredity, kontinuita s 21.5j** (1 kr ≈ kupní síla 1 USD 2025). Vyzrálá FTL civilizace: mezihvězdná doprava masová a dostupná, exotika (kybernetika, regenerace, lodě) = velké investice.
- **R2 — Setting-neutrální space opera**: FTL „skok", energetické zbraně, droidi, kybernetika, terraformace — obecné pojmy, žádná jména z existujících děl. Popisy česky, encyklopedické z pohledu obyvatele éry.
- **R3 — Sdílená tabulka kotev (kap. 2)** ve všech briefách — lekce z 21.5j (bez ní 6 agentů = 6 nekompatibilních hladin). Kalibrováno na fan ekonomiky (blaster ~500 kr, ojetý lehký frachtýř ~100–300k kr, mezisystémová letenka stovky kr).
- **R4 — Zbraně/zbroje → Předměty bez statbloků**: energetické i projektilové → `střelná/vrhací zbraň` (sekce Střelivo a doplňky ne); zbroje a osobní štíty → `zbroj`.
- **R5 — Obrázky Wikimedia = reálné analogy** (robot, bionická paže, tablet, kosmická loď, fúzní reaktor); u ryze fikčních položek se počítá s nižším pokrytím — bez obrázku je OK (precedens fantasy plavidla Morvolu).
- **R6 — Seed reuse**: éra `galaxy` v pipeline, tag `galaktické dobrodružství`, seedTag `ceniky:galaxy:v1`, workflow `seed-ceniky-galaxy.yml`. Dry-run `c:\tmp\ceniky-galaxy-dry-run.html` schvaluje uživatel.

## 2. Ekonomické kotvy éry — SDÍLENÉ všemi agenty

| Kotva | Hodnota |
|---|---|
| Mzda řadového člena posádky | 4 000 kr/měs |
| Specialista (FTL navigátor, medik, xenobiolog) | 10 000–20 000 kr/měs |
| Mezisystémová letenka (sousední systém, ekonomická) | 800 kr |
| Kajuta 1. třídy / luxus | 5 000 kr |
| Vnitrosystémový let | 100 kr |
| Nákladní FTL přeprava | 5 kr/kg mezi systémy |
| Energetická pistole civilní | 600 kr |
| Ojetý lehký frachtýř | 250 000 kr |
| Nový lehký frachtýř | 1 000 000 kr |
| Servisní droid | 8 000 kr |
| Kybernetická protéza standard | 8 000 kr |
| Regenerace končetiny | 15 000 kr |
| Kajuta na stanici (nájem/měs) | 400 kr |
| Energetický článek standard | 5 kr |
| Syntetizované jídlo (porce) | 3 kr; pravé pěstované 10× |

## 3. Obsah — 13 ceníků / ~380 položek (sufix „— galaktické dobrodružství")

| Ceník | ≈ | Poznámky |
|---|---|---|
| Práce a výdělky | 40 | posádka, FTL navigátor, lovec odměn (licencovaný), terraformátor, xenobiolog |
| Zdraví a medicína | 30 | regenerace, klonované orgány, med-pod, omlazovací kúra, hibernace |
| Hvězdné lodě | 30 | shuttly, kurýři, frachtýře, jachty, průzkumné lodě; nové/ojeté/leasing |
| Lodní vybavení a údržba | 30 | FTL pohon, štíty, senzory, dok, palivo, AI autopilot |
| Doprava a cestování | 25 | FTL letenky, kajuty, cargo, orbitální výtah |
| Bydlení a stanice | 25 | kajuty, byty jádrových/okrajových světů, pozemky kolonií |
| Potraviny a pochutiny | 30 | syntéza levná, pravé pěstované drahé, xeno-delikatesy |
| Neřesti a zábava | 30 | kantýna, xeno-koktejly, holo-zábava, hazard |
| Zbraně | 35 | energetické pistole/karabiny, omračovače, projektilové retro; **→ Předměty** |
| Zbroje a štíty | 25 | bojové obleky, osobní energetické štíty; **→ Předměty** |
| Kybernetika a implantáty | 25 | neurální rozhraní, oční implantáty, protézy (legální rámec) |
| Droidi a AI | 25 | servisní/pilotní droidi, AI asistenti, překladače |
| Elektronika a výbava dobrodruha | 30 | skenery, datapady, univerzální překladač, gravitační vak |

## 4. Postup

Rešerše fan ekonomik + extrapolace (6 agentů, kotvy v každém briefu) → merge (`galaxy`, credits) → Commons dotazy (2 agenti, reálné analogy) → fetch+retry → build → **dry-run schválí uživatel** → commit → workflow.
