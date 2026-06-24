# Spec 16.2b — Deník DrD 1.6: grafický redesign (fantasy „Iluminovaný kodex kováře")

**Status:** ✅ **Reálný list HOTOVÝ 2026-06-24** — implementace ověřena (tsc -b + `npm run build` + vitest 15/15 + eslint 0); vizuál po deployi potvrdí uživatel. Prototyp-kontrakt: `c:\tmp\drd16-denik-audit.html`. Erb = dekorativní SVG (upload vlastního = navazující sub-krok, per postava). Skiny (7 stylů) = 16.2c (teď self-contained pergamen). **Zbývá pro drd16:** taktická mapa + bestie + chat (samostatné body 16.2a); funkce/napoveda dávkově po kompletním systému.
**Rozsah:** FE only. Přepis vizuálu `Drd16Sheet` + nová/restrukturovaná pole; BE bez změn (vše přes volný `diary.customData`).
**Repo:** `Projekt-ikaros-FE`, commit na `main` (žádná feature větev).
**Autor:** PJ + Claude · **Datum:** 2026-06-24
**Souvisí:** roadmap2 16.2a „Pilíř DENÍK" · `sablona-denik-per-system.md` (drd16 = 2. systém po Matrixu) · spec-16.2a (Matrix = vzor) · spec-16.2c (skiny).

> **Druhý systém po Matrixu.** Default skin = **fantasy**. Reálný papírový list „Osobní deník" je univerzální napříč povoláními → class-specifický obsah jde do volných polí. Pravidla DrD se NErekonstruují z paměti (CH-023) — mechaniky níže jsou potvrzené uživatelem.

---

## 1. Cíl
Z dnešního tmavého „amber dungeon" formuláře udělat **profesionální fantasy character sheet** — iluminovaný pergamenový kodex na kovárně. Čitelný na první pohled, self-contained nad libovolným skinem, věrný reálnému papíru, ale funkční (editor listu, ne pravidlový engine).

## 2. Audit současného stavu
`sheets/drd16/Drd16Sheet.tsx` (841 ř + PrintView) + `constants.ts` + `styles/drd16.css`:
- **Data** v `diary.customData` **bez prefixu** (`str_val`, `hp_current`, `meleeWeapons`…) přes `makeCdAccess(cd, '', onChange)`. (Ostatní systémy mají prefix; drd16 je výjimka — necháváme kvůli BC.)
- Sekce dnes: Identita · Primární (7 vč. Velikost/Pohyb jako čísla s bonusem) · Sekundární (5) · Naložení (Lehké/Střední/Těžké) · Zbraně melee/ranged · Dovednosti · OČ · HP/Mana svislé tracky · textarea schopnosti/kouzla.
- 3 režimy: `mode view|edit` + `usePrintMode()` → `Drd16PrintView`.
- `getDrdBonus(val)` — **potvrzeně správný** (krok po 2: 13–14→+1 … 21–22→+5; extrapoluje i pro NPC > 21). NEMĚNIT.

## 3. Klíčová rozhodnutí

| # | Rozhodnutí | Důvod |
|---|-----------|-------|
| R1 | **Self-contained pergamenový HUD**, scoped `[data-diary-system='drd16']`, tokeny `--mx-*` s **fantasy fallbacky** v `:where(...)` | deník se renderuje nad libovolným skinem; token-ready = 16.2c skiny skoro zdarma ([[project_overlay_rgb_tokens]]) |
| R2 | **Velikost = písmeno** (A/B/C, u NPC i jiné), BEZ bonusu | reálný papír; není to házená vlastnost |
| R3 | **Pohyblivost = základní číslo + 3 pod-řádky** (mírné/střední/velké naložení), čísla bez bonusu | pohltí bývalé „Naložení"; „nepotřebuju váhu" → ruční čísla, ne výpočet z hmotnosti |
| R4 | **Postřeh = 2×2 % tabulka** (Objevení objektů / mechanismů × Náhodný / Hledaný) | reálný papír |
| R5 | **5 háznových vlastností** (Síla/Obr/Odl/Int/Cha) se zlatým **auto-bonusem** `getDrdBonus`; Velikost+Pohyblivost mimo | jen tyto mají bonus |
| R6 | **PC soft-cap 21** (červené varování, neblokuje — povolí dočasný buff); **NPC bez stropu** | hráč trvale ≤21, NPC výš; `isNpc` z `useCharacter` (jako Matrix) |
| R7 | **Povolání 2-stupňové**: základní + **specializace odemknutá od 6. úrovně** (5 rodin × 2) | Válečník→Bojovník/Šermíř · Hraničář→Chodec/Druid · Zloděj→Lupič/Sicco · Alchymista→Pyrofor/Theurg · Kouzelník→Čaroděj/Mág |
| R8 | **Životy/Magy = iluminovaný žebřík** (vždy 50 příček = konst. výška); ≤50 bodů „1 příčka = 1 bod" (papír), >50 přepne na **poměr** a přečísluje popisky | uživatel preferoval tento vzhled; scaling řeší poměr, ne změna vizuálu |
| R9 | **Mobil ≤ 900px: žebřík → kompaktní vodorovný proužek** + číslo + krokovátka | dva svislé žebříky se na mobil nevejdou |
| R10 | **Zbroj** = tabulka u OČ (název · příspěvek k OČ · pozn.); OČ zůstává ruční číslo | „možnost zapsat zbroj"; žádná auto-matika OČ |
| R11 | **Drop** vybavení/poklad/hmotnostní náklad; **neměnit BE** | mimo rozsah deníku |

## 4. Sekce listu (pořadí dle prototypu)
1. **Hero** — erb (viz §6) + jméno · Rasa / Povolání (+ Specializace od 6.) / Úroveň · destičky Max. životů / Max. magů.
2. **HUD lišta** — Životy `cur/max` · Magy `cur/max` · Obranné číslo.
3. **Sloupec 1** — Vlastnosti (5 + bonus, Velikost-písmeno) · Pohyblivost (základní + 3 naložení) · Postřeh (2×2 %).
4. **Sloupec 2** — Boj tváří v tvář · Boj střelecký · Obrana (OČ + Zbroj) · Dovednosti.
5. **Sloupec 3** — Životy a magy (žebřík / na mobilu proužek).
6. **Spodní zóna** — Zvláštní schopnosti · Kouzla/Spellbook · Poznámky.

## 5. Datové klíče (`customData`, bez prefixu — BC)

| Pole | Klíč | Stav |
|---|---|---|
| Jméno / Rasa / Úroveň | `name` `race` `level` | reuse |
| Povolání (rodina) | `class` | reuse |
| **Specializace** | `class_spec` | **nový** |
| HP / Mana / OČ | `hp_current` `hp_max` `mana_current` `mana_max` `defense` | reuse |
| 5 vlastností | `str_val` `dex_val` `con_val` `int_val` `cha_val` (+ `*_mod` override BC) | reuse |
| **Velikost (písmeno)** | `size_letter` | **nový** (`siz_val` osiří) |
| Pohyblivost základní | `mov_val` | reuse (číslo) |
| Pohyblivost při naložení | `enc_light` `enc_med` `enc_heavy` | **reuse, nová sémantika** = mírné/střední/velké |
| **Postřeh 2×2 %** | `per_obj_rand` `per_obj_seek` `per_mec_rand` `per_mec_seek` | **nové** (`per/obj/mec/rnd/sea` osiří) |
| Zbraně / Dovednosti | `meleeWeapons[]` `rangedWeapons[]` `drdSkills[]` | reuse |
| **Zbroj** | `armor[]` = `[{name,oc,note}]` | **nový** |
| Schopnosti / Kouzla | `special_abilities` `spells` | reuse |
| **Poznámky** | `notes` | **nový** |
| **Erb (volitelný obrázek)** | `erb` | **nový** — viz §6 |

> Osiřelé klíče (`siz_val`, `per`,`obj`,`mec`,`rnd`,`sea`) needětujeme — zůstanou v DB neškodně; žádná migrace.

## 6. Erb (otevřené rozhodnutí)
Reálně řeší „hráč si ho vloží sám". **Doporučená varianta (čeká potvrzení):**
- **Dekorativní SVG štít** = default (vždy něco, nuly navíc) — konzistentní s Matrixem, kde deník záměrně **nezobrazuje portrét** (16.2a R2/H1: directory lookup byl vadný → iniciály).
- **Volitelný upload vlastního erbu** (`erb` = URL nahraného obrázku) jako override; **per postava**.
- ⚠️ Otevřené: (a) per postava vs per hráč; (b) zapojit upload teď, nebo dekorativní SVG teď + upload jako samostatný malý sub-krok. Default do potvrzení: **dekorativní SVG teď**, upload jako navazující sub-krok (ne dluh — vědomá hranice rozsahu).

## 7. Tři režimy
- **view:** čistý readout (žebřík/inputy/krokovátka neaktivní).
- **edit:** inputy + klikací příčky + krokovátka + „+ Přidat" (zbraně/dovednosti/zbroj/řádky) + ✕; save přes `customDataPatch` (delta).
- **print:** aktualizovat `Drd16PrintView` na novou strukturu (Velikost-písmeno, Pohyblivost+naložení, Postřeh 2×2, Zbroj, Specializace).

## 8. Co NEděláme
- Žádná BE změna. · Neměníme `getDrdBonus`. · Neřešíme taktickou mapu/bestie/chat (samostatné body 16.2a). · 7 skinů = 16.2c (teď jen fantasy default, ale CSS token-ready).

## 9. Otevřené otázky
- **O1 — Erb** (§6): per postava (doporučeno) vs per hráč; upload teď vs sub-krok.
