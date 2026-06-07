# Rulebook F0 — Inventář zdroje (stará Matrix DB)

> Výstup F0 extrakce (2026-06-07). Zdroj: `C:\Matrix\dump\MatrixDatabase\Pages.bson`
> (3540 stránek, jednosvětová DB — **bez `worldId`**). Čteno Node skriptem přes
> `bson` balík. Raw dump: `C:\tmp\matrix-pages-raw.json`.
> Doprovází spec `spec-2.3f-ikaros-rulebook.md`.

## Strom knihy (potvrzeno z odkazů hubů)

Hub **`pravidla`** (type 8) → 13 kapitol:

1. `tvorba-postav` — Tvorba postav
2. `aspekty` — Aspekty
3. `body-osudu` — Body osudu
4. `sazky` — Sázky
5. `iniciativa` — Iniciativa
6. `uroven-sil` — Úroveň sil
7. `pretlak` — Přetlak
8. `unava` — Únava
9. `leceni-a-zraneni` — Léčení a zranění
10. **`magicka-pravidla`** (sub-hub, type 8) → 21 typů magie (níž)
11. **Programování** → sub-hub `matrix-informace` → 8 pod-stránek (níž)
12. `jazykova-politika` — Jazyková politika
13. `jazykove-rodiny` — Jazykové rodiny

### 10. Magická pravidla → 21 typů (úplný seznam, řeší oříznutý screenshot)

alchymie, antimagie, demonologie, druidska-magie, exorcismus, lecebna-magie,
magie-tela, nekromancie, obranna-magie, ohniva-magie, ovladani-magie (titul
„Ovládání energie/magie"), psionika, rostlinna-magie, stinova-magie,
samanska-magie, teleportacni-magie, vestecka-magie, vodni-magie, vzdusna-magie,
zemni-magie, zvireci-magie.

### 11. Programování → sub-hub `matrix-informace` → 8 pod-stránek

boj-s-programy, druhy-pripojeni, identifikace, **metrixova-rozhrani** (⚠️ překlep
v DB → opravit na „Matrixová rozhraní"), offline-vs-online, programovani-akj,
systemova-obrana, svobodny-matrix.

⚠️ Hub `matrix` má i `programy` a `matrix-mista`. Rozhodnutí PJ (2026-06-07):
- **`programy` ZAŘADIT** — není to lore, je to **katalog programů** (viz níž). Patří
  do kapitoly 11 jako druhá část.
- `matrix-mista` (Místa) = lore/setting → **vyloučit**.

### 11b. Katalog programů (`programy` sub-hub) → 6 kategorií → 68 programů

> 🕓 **ODLOŽENO (PJ 2026-06-07): „programy nech, pak to uděláme".** Vlastní pozdější
> fáze (F7). Kapitola 11 zatím dodá jen 8 mechanik z `matrix-informace`.

⚠️ **Velký rozsah:** 6 kategorií, ale každá odkazuje na desítky jednotlivých
programů. Celkem **68 unikátních programů, ~93 000 znaků, 68 obrázků** — víc obsahu
než celý zbytek knihy. Každý program = záznam typu „bestiář" (~1370 znaků, popis
chování). Kategorie:

| kategorie | ~programů | příklady |
|---|---:|---|
| kontrolni-programy | 16 | aid, xid, mid, hlidka, scai, hound, velky-bratr |
| antikontrolni-programy | 15 | mlha, stin, invisible, zmizik, zrcadlovy-obraz |
| uzivatelske-programy | 14 | encyklopedie, prekladac, holograficky-ucitel |
| obranne-programy | 10 | agent, drony, turrety, silove-pole, vojaci |
| viry | 9 | hollow, zombie, vampir, infiltrator, morigan |
| hybridni-programy | 7 | adonis, eva, tron, octopus, pani-jezera |

**Návrh struktury:** každá kategorie = 1 stránka s programy jako **sbalovací
záznamy** (ne 68 samostatných routes → zabilo by navigaci). Vzor UX = `sections[]`
isCollapsed. Konceptuálně blízko Bestiáři (`project_bestiar_design`) — možná budoucí
integrace, teď NE.

**Obrázky programů:** 68 ks = velký regenerační nárok. Návrh: fázovat — pravidla +
typy magie (priorita) nejdřív, obrázky programů jako pozdější/volitelná dávka.

## Délka textu (≈58 000 znaků celkem, zvládnutelné)

| kapitola | znaků | obrázek |
|---|---:|:---:|
| uroven-sil | 6944 | – |
| tvorba-postav | 3422 | – |
| jazykova-politika | 3303 | – |
| sazky | 3109 | – |
| aspekty | 2938 | – |
| pretlak | 2863 | – |
| nekromancie | 2045 | ✓ |
| leceni-a-zraneni | 2039 | – |
| exorcismus | 1929 | ✓ |
| unava | 1745 | – |
| zemni-magie | 1744 | ✓ |
| iniciativa | 1688 | – |
| vodni-magie | 1523 | ✓ |
| vzdusna-magie | 1517 | ✓ |
| programovani-akj | 1512 | ✓ |
| body-osudu | 1405 | – |
| jazykove-rodiny | 1366 | ✓ |
| lecebna-magie | 1324 | ✓ |
| ostatní typy magie | ~500–1400 každý | ✓ |

(Pod-stránky Programování nejsou v této tabulce — text doberu při extrakci F1.)

## Kvalitativní nálezy (co učesat)

- **Emoji-nadpisy** v tělech („🧠 1. ZÁKLADNÍ PŘEDSTAVA") — sjednotit na čistou
  typografickou hierarchii.
- **Překlepy:** „Achymie" → Alchymie, „Metrixová" → Matrixová.
- **Tabulky:** stará DB má `table` objekt; Ikaros `page.content` nemá table
  extension → převést na definiční seznamy / nadpisy (viz `project_page_content_no_tables`).
- **Číselné stupně** (např. alchymie 1–6) se v `plainText` ztrácí — brát ze
  strukturovaného `paragraphs` (TipTap), ne z plainText.
- **Jazyková politika:** v DB odkazuje na STÁTY (EU, Británie, NUSA, Čína, Rusko,
  Kongo, Nigérie, Sábská říše, Indie, Amazonská říše) → dle PJ **vyhodit státy**,
  nechat jen Úrovně jazykového zvládnutí + Základní info o jazykovém prostředí.
- **Flavor-příklady** (např. aspekt „Tak trochu kokot") — zachovat hlas PJ, jen
  uhladit kontext. (Ke konfirmaci.)

## Soupis obrázků (k regeneraci PJ → 26 ks)

Cíl: re-host do Ikaros CloudinF (Superadmin je má spravovat). Staré = Google Drive
ID (ne Cloudinary). PJ dodá nové → navrhuju ukládat do `C:\tmp\rulebook-images\`
pojmenované `<slug>.png` (alchymie.png, ohniva-magie.png …).

| slug | k čemu | starý Drive ID |
|---|---|---|
| alchymie | runy/alchymistická dílna | 1rT-xFdHCvLqsODL_crvFOrycQSx3y6IN |
| antimagie | rušení magie | 1qxyhK-Cex5nEIeEyOBYhhs9L69Bz_BH9 |
| demonologie | démon / pakt | 1IRvaXfltqfYkx6mKaQF-s0ckwpbPQOAf |
| druidska-magie | příroda / druid | 1y1_pUX1wxFO05W0VS-5RWSS7TVYGCkxW |
| exorcismus | vymítání | 1PRgERcSfQ7ILiQCPtRNmz_kScFiDKKFJ |
| lecebna-magie | léčení | 1m4z1TCbvq3WSa9c6p03Ee3GQ7aRfzdTM |
| magie-tela | tělesná přeměna | 1JIhY9JMhfR9LRxcMVp_lJNxYHgzsun-w |
| nekromancie | nemrtví | 1ubnIsDnIxA7QMENtOeIpWIbuJvCvp5JC |
| obranna-magie | štít / bariéra | 1bc6RLuiZwGTMCkKNKE507co8xnqyRGja |
| ohniva-magie | oheň | 1H2mVUjCvB4i6Gkazd5bTvfae5hb0bJUK |
| ovladani-magie | manipulace energie | 1DLqUh5_51cOIEUvIOiEp-cPyMeD7sJ2u |
| psionika | psychická síla | 1d0pheW5yZqe01csjfzM6I81ecJOg0UBE |
| rostlinna-magie | rostliny | 107emDOdoN5dXnpe36kKqLemS3d8_XiMQ |
| stinova-magie | stíny | 1NsGs-rHfpiFx0RZksZkrRK-m4KppYQym |
| samanska-magie | šaman / duchové | 1rZRaWFgXKKkz_yKmnPkaA1gjleCP4PEb |
| teleportacni-magie | teleport / portál | 1qt-86Yv3PyANyC7ifSE5RQAyEHfloCJ9 |
| vestecka-magie | věštba | 1HACbZ432uITYbKZ4WdX4I3w7kN-W_U6f |
| vodni-magie | voda | 1yh6isTHiX9b2_l5qgm9Zqvurz0rSve75 |
| vzdusna-magie | vzduch / vítr | 1vScQeIJeMV1DyC8X_WkTjAWsYjiJoFvO |
| zemni-magie | země / kámen | 1y8Smm56F2x2s4bL2jP-gqwzvYyCyteIx |
| zvireci-magie | zvířata | 1IiQQXZW1m-yVHeZCAGv0bdpXGSdyV59m |
| programovani-akj | programování v Matrixu | 1uDQWunh6gb6fNJDrRJCZ_jaPz1xvMakM |
| jazykove-rodiny | jazyky / rodokmen | 10eqJBcQNJyuOKmYNtoK4-kFHG0qE_N8K |
| (Programování hub) | Matrix-rain (zelený déšť) | 1C3BRi0auek4hZVVoqGKkCS3SYkVvREMn |

> `programy` (19SK0lNZ…) a `matrix-mista` (1WkI-3o…) = lore, vyloučeno z knihy.
