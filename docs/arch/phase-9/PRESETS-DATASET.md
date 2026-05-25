# Presets dataset — 20 historických kalendářů

**Reference:** Poskytl PJ 2026-05-25 jako podklad pro spec 9.3-followup.

**Calibration anchor:** pondělí 25. května 2026 Gregorian = `World.timelineEpoch + N days` (N spočítat při impl).

---

## Rychlý převod dnešního data

| # | Kalendář | Datum odpovídající 25. 5. 2026 |
|---|---|---|
| 1 | Gregoriánský | pondělí 25. května 2026 |
| 2 | Juliánský | pondělí 12. května 2026 |
| 3 | Islámský / hidžra | 8. dhu al-hidždža 1447 AH (po západu slunce 9.) |
| 4 | Židovský | 9. sivan 5786 (po západu slunce 10.) |
| 5 | Čínský | 9. den 4. lun. měsíce, rok Bing-wu (Ohnivý kůň) |
| 6 | Perský / Solar Hidžra | 4. chordád 1405 SH |
| 7 | Indický národní / Saka | 4. džjéštha 1948 Saka |
| 8 | Etiopský | 17. ginbot 2018 |
| 9 | Koptský | 17. pašons 1742 AM |
| 10 | Buddhistický (thajský civilní) | 25. května 2569 BE |
| 11 | Mayský (GMT model) | 13.0.13.11.3; 6 Ak'bal; 16 Sip |
| 12 | Aztécký (běžná rekonstrukce) | 6 Calli; trecena 1 Tecpatl; rok 1 Tochtli; 14 Ochpaniztli |
| 13 | Staroegyptský (model dle koptské návaznosti) | 17. pašons / období šemu |
| 14 | Římský (zápisem gregoriánského dne) | a.d. VIII Kal. Iun. (gregorian) / a.d. IV Id. Mai. (julián) |
| 15 | Babylonský (model dle hebrejské návaznosti) | 9. simanu |
| 16 | Řecký / Attický | ~10. thargelión, athénský rok 2025/2026 |
| 17 | Francouzský revoluční | sextidi 6. prairial, rok CCXXXIV |
| 18 | Světový (The World Calendar) | čtvrtek 23. května 2026 |
| 19 | Mezinárodní pevný / Cotsworthův | čtvrtek 5. června 2026 |
| 20 | Holocénní | pondělí 25. května 12026 HE |

---

## Detailní popis kalendářů

### 1. Současné civilní a náboženské

#### 1. Gregoriánský

- **Pohyb:** solární. 365 / 366 (přestupný = dělitelný 4, kromě století nedělitelných 400).
- **Měsíce:** leden, únor, březen, duben, květen, červen, červenec, srpen, září, říjen, listopad, prosinec.
- **Dny týdne (ISO):** pondělí, úterý, středa, čtvrtek, pátek, sobota, neděle.
- **Letopočet:** CE/AD. Cyklus se opakuje po 400 letech.

#### 2. Juliánský

- **Pohyb:** solární předchůdce gregoriánského. Každý 4. rok přestupný (bez gregoriánských výjimek).
- **Dnes posun:** 13 dní za Gregorianem (1900–2099).
- **Měsíce:** stejné jako Gregorian.
- **Dny týdne:** 7, stejně jako Gregorian.
- **Rok:** průměr 365.25 dne.

#### 3. Islámský / Hidžra

- **Pohyb:** čistě lunární. 12 lunárních měsíců = ~354–355 dní. Měsíce se posouvají vůči ročním obdobím ~10–11 dní/rok.
- **Měsíce:** muharram, safar, rabí al-awwal, rabí al-thání, džumádá al-úlá, džumádá al-áchira, radžab, ša'bán, ramadán, šawwál, dhu al-qa'da, dhu al-hidždža.
- **Dny týdne:** al-ahad, al-ithnajn, ath-thuláthá, al-arbi'á, al-chamís, al-džum'a, as-sabt. Den začíná západem slunce.
- **Letopočet:** AH (od hidžry, 622 CE = 1 AH).

#### 4. Židovský (Hebrew)

- **Pohyb:** **lunisolární**. Měsíce sledují Měsíc, rok přestupný měsíc.
- **Měsíce (náboženské pořadí):** nisan, ijar, sivan, tamuz, av, elul, tišri, chešvan, kislev, tevet, ševat, adar. V přestupném roce: adar I + adar II.
- **Dny týdne:** jom rišon, jom šeni, jom šliši, jom revi'i, jom chamiši, jom šiši, šabat. Den začíná západem slunce.
- **Letopočet:** AM („od stvoření světa"). Přestupy řízeny 19letým **Metonickým cyklem**.

#### 5. Čínský

- **Pohyb:** **lunisolární**. Měsíce lunární, korekce pomocí přestupného měsíce + 24 solárních termínů.
- **Měsíce:** číslované 1.–12. (zhengyue, …, layue). Přestupný měsíc opakuje číslo předchozího.
- **Dny:** 1–29/30 v lunárním měsíci + šedesátkový cyklus nebeských kmenů × pozemských větví.
- **Roky:** 60letý cyklus (10 kmenů × 12 větví), zvěrokruh: krysa, buvol, tygr, zajíc, drak, had, kůň, koza, opice, kohout, pes, prase.

#### 6. Perský / Solar Hidžra

- **Pohyb:** solární, velmi přesně navázaný na jarní rovnodennost. Rok začíná svátkem **Nourúz**.
- **Měsíce:** farvardín, ordíbehešt, chordád, tír, mordád, šahrívar, mehr, ábán, ázar, dej, bahman, esfand.
  - Měsíce 1–6: 31 dní. Měsíce 7–11: 30 dní. Esfand: 29 (30 v přestup).
- **Dny týdne:** šanbe, yekšanbe, došanbe, sešanbe, čaháršanbe, pandžšanbe, džome.
- **Letopočet:** SH (Solar Hijri, 622 CE = 1 SH).

#### 7. Indický národní / Saka

- **Pohyb:** solární. Rok začíná měsícem čaitra (obvykle 22. března, v přestupném roce 21. března).
- **Měsíce:** čaitra, vaišákha, džjéštha, ášádha, šrávana, bhádra, ášvin, kártika, agrahájana, pauša, mágha, phálguna.
- **Dny týdne:** ravivára, somavára, mangalavára, budhavára, brihaspativára, šukravára, šanivára.
- **Letopočet:** Saka (78 CE = 1 Saka). Rok 365 dní.

#### 8. Etiopský

- **Pohyb:** solární. **13 měsíců** (12 × 30 + krátký 13. o 5/6 dnech).
- **Měsíce:** meskerem, tikimt, hidar, tahsas, tir, jakatit, megabit, miazia, ginbot, sene, hamle, nehase, pagume.
- **Dny týdne:** ehud, segno, maksegno, erob, hamus, arb, kidame.
- **Letopočet:** posun ~7–8 let za Gregorianem. Nový rok 11. (nebo 12.) září gregoriánsky.

#### 9. Koptský

- **Pohyb:** solární, odvozený od staroegyptského. **13 měsíců** (12 × 30 + krátký 5/6 dní).
- **Měsíce:** thout, paopi, hathor, koiak, tobi, meshir, paremhat, parmouti, pashons, paoni, epip, mesori, pi kogi enavot.
- **Dny týdne:** tkyriake, pesnau, pshoment, peftoou, ptiou, psoou, psabbaton.
- **Letopočet:** AM (éra mučedníků, 284 CE = 1 AM).

#### 10. Buddhistický

- **Pohyb:** thajský civilní = prakticky Gregorian s buddhistickým letopočtem (+543 let). V jihovýchodní Asii existují i lunisolární buddhistické varianty.
- **Měsíce (thajské):** makarakhom, kumphaphan, minakhom, mesayon, phruetsaphakhom, mithunayon, karakadakhom, singhakhom, kanyayon, tulakhom, phruetsachikayon, thanwakhom.
- **Dny týdne:** wan athit, wan chan, wan angkhan, wan phut, wan pharuhat, wan suk, wan sao.
- **Letopočet:** BE (Buddhist Era = Gregorian + 543). 2026 CE = 2569 BE.

---

### 2. Významné historické

#### 11. Mayský

- **Pohyb:** kombinace 3 cyklů.
- **Tzolk'in (260 dní):** 20 denních jmen × čísla 1–13.
  - Jména: imix, ik', ak'bal, k'an, chikchan, kimi, manik', lamat, muluk, ok, chuwen, eb', b'en, ix, men, kib', kaban, etz'nab', kawak, ajaw.
- **Haab (365 dní):** 18 měsíců po 20 dnech + wayeb' (5 dní).
  - Měsíce: pop, wo', sip, sotz', sek, xul, yaxk'in, mol, ch'en, yax, sak', keh, mak, k'ank'in, muwan, pax, k'ayab, kumk'u, wayeb'.
- **Dlouhý počet:** k'in (1 den), winal (20 dní), tun (360 dní), k'atun (7200 dní), b'ak'tun (144000 dní).
- **Korelace GMT:** počátek Long Count = 11. 8. 3114 př. n. l. proleptic Gregorian.
- **Dnes:** 13.0.13.11.3; 6 Ak'bal; 16 Sip.

#### 12. Aztécký

- **Pohyb:** 2 paralelní cykly + 52letý svazek.
- **Tonalpohualli (260 dní):** 20 znamení × čísla 1–13.
  - Znamení: cipactli, ehecatl, calli, cuetzpalin, coatl, miquiztli, mazatl, tochtli, atl, itzcuintli, ozomahtli, malinalli, acatl, ocelotl, cuauhtli, cozcacuauhtli, olin, tecpatl, quiahuitl, xochitl.
- **Xiuhpohualli (365 dní):** 18 měsíců × 20 dní + 5 nemontemi.
  - Měsíce: atlcahualo, tlacaxipehualiztli, tozoztontli, huey tozoztli, toxcatl, etzalcualiztli, tecuilhuitontli, huey tecuilhuitl, tlaxochimaco, xocotl huetzi, ochpaniztli, teotleco, tepeilhuitl, quecholli, panquetzaliztli, atemoztli, tititl, izcalli.
- **Roky:** kombinace 1–13 × {tochtli, acatl, tecpatl, calli}.

#### 13. Staroegyptský

- **Pohyb:** solární civilní, 365 dní (3 období po 120 + 5 epagomenálních).
- **Období:** akhet (záplavy), peret (růst), šemu (sklizeň).
- **Měsíce:** původně 1.–4. měsíc každého období; pozdější koptská tradice používá jména (thout, paopi, …).
- **Dny:** 30 dní v měsíci, 3 desetidenní období.
- **Letopočet:** regnal years (rok vlády panovníka).

#### 14. Římský

- **Pohyb:** nejstarší 10 měsíců (martius–december). Pozdější republikánský 12 měsíců.
- **Měsíce (pozdější):** ianuarius, februarius, martius, aprilis, maius, iunius, quintilis/iulius, sextilis/augustus, september, october, november, december.
- **Dny:** zpětně k pevným bodům — **kalendae** (1.), **nonae** (5./7.), **idus** (13./15.). Plus 8-denní tržní cyklus **nundinae**.
- **Letopočet:** podle konzulů nebo **ab urbe condita** (od založení města).

#### 15. Babylonský

- **Pohyb:** **lunisolární**. Měsíce začínají pozorováním srpku Měsíce; přestupný měsíc dle potřeby.
- **Měsíce:** nisannu, ajjaru, simanu, du'uzu, abu, ululu, tašrítu, arahsamnu, kislimu, tebétu, šabátu, addaru. Přestupný často 2× addaru.
- **Dny:** 1–29/30, sedmidenní rytmus historicky spojován.
- **Letopočet:** dle panovníka, později seleukovská éra.

#### 16. Řecký / Attický

- **Pohyb:** **lunisolární**, athénský. Rok začíná v létě po letním slunovratu.
- **Měsíce:** hekatombaión, metageitnión, boédromión, pyanepsión, maimakterión, poseideón, gamélión, anthestérión, elafébolión, múnichión, thargélión, skiroforión.
- **Dny:** dle fáze měsíce, 3 desítky v měsíci.
- **Letopočet:** podle archonta.

#### 17. Francouzský revoluční

- **Pohyb:** solární. Rok začíná u podzimní rovnodennosti v Paříži. 12 měsíců × 30 + 5/6 doplňkových dnů (sansculottides).
- **Měsíce:** vendémiaire, brumaire, frimaire, nivôse, pluviôse, ventôse, germinal, floréal, prairial, messidor, thermidor, fructidor.
- **Dny v dekádě (10!):** primidi, duodi, tridi, quartidi, quintidi, sextidi, septidi, octidi, nonidi, décadi.
- **Letopočet:** rok I = 22. 9. 1792 CE. Aktuálně rok CCXXXIV.

---

### 3. Alternativní a moderní návrhy

#### 18. Světový kalendář (The World Calendar)

- **Pohyb:** reformní solární. 12 měsíců rozdělených do 4 čtvrtletí (31+30+30). Každé čtvrtletí začíná nedělí.
- **Měsíce:** leden, únor, …, prosinec.
- **Dny týdne:** neděle–sobota. **World Day** na konci roku (mimo týden), **Leap Day** po 30. červnu v přestupném (mimo týden).

#### 19. Mezinárodní pevný / Cotsworthův

- **Pohyb:** reformní solární. **13 měsíců × 28 dní**.
- **Měsíce:** leden, únor, březen, duben, květen, červen, **sol**, červenec, srpen, září, říjen, listopad, prosinec.
- **Dny týdne:** každý měsíc začíná nedělí, končí sobotou (přesně 4 týdny).
- **Year Day** mimo týden, přestupný den taky mimo.

#### 20. Holocénní

- **Pohyb:** **není to nový kalendář, jen letopočet**. Gregoriánské měsíce/dny + 10000 k roku.
- **Letopočet:** HE (Human Era). 2026 CE = 12026 HE.

---

## Calibration notes pro implementaci

- **Solar (Gregorian, Julian, Solar Hijri, Saka, Ethiopian, Coptic, Buddhist Thai, Holocene):** deterministický, žádný posun, calibrace 1× na anchor.
- **Lunar (Islamic):** lokálně se může lišit ±1 den (pozorování srpku).
- **Lunisolar (Hebrew, Chinese, Babylonian, Greek Attic):** Metonic 19letý cyklus pro Hebrew/Babylonian/Greek; Chinese vyžaduje true sun/moon — zjednodušíme na Metonic aproximaci.
- **Speciální (Mayan, Aztec, Roman, French Rev, Cotsworth, World):** vlastní engine variant (`CalendarKind` enum).
