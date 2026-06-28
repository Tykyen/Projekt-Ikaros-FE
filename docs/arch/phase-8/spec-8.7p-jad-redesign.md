# Spec 8.7p — JaD deník: multipovolání, obory, přidávatelné sekce

**Status:** ✅ implementováno (2026-06-28) — sheet + constants + CSS + 29 testů zelené, build čistý, mobil/desktop ověřeno
**Předchůdce:** 8.7b (JaD preset — 1:1 přenos legacy) — viz [spec-8.7](spec-8.7-diary-system-presets.md)
**Rozsah:** pouze systém `jad`. Mění `sheets/jad/*`, `styles/jad.css`, `presets/jad.ts` popis. Žádný jiný systém ani sdílené moduly.

## 1. Cíl

Posunout JaD deník z 1:1 přenosu legacy listu na **funkční tvorbu postavy dle JaD pravidel**: multipovolání s obory, osobní zázemí jako výběr, a strukturované přidávatelné sekce místo volných textarea. Vychází z odsouhlaseného HTML návrhu (`c:/tmp/jad-denik-navrh.html`).

## 2. Změny v hlavičce

| Pole | Dnes | Cíl |
|---|---|---|
| Jméno postavy (`jad_charName`) | input | **odebráno z UI** (jméno řeší stránka postavy) |
| Přesvědčení (`jad_alignment`) | input | **odebráno z UI** |
| Hráč (`jad_player`) | input | **odebráno z UI** |
| Rasa (`jad_race`) | input | beze změny |
| Zázemí (`jad_background`) | volný text | **`<select>`** 16 osobních zázemí + „Vlastní…" |
| Zkušenosti (`jad_xp`) | input | beze změny |
| Úroveň (`jad_level`) | ruční input | **auto = součet úrovní povolání** (read-only badge) |

⚠️ Odebraná pole z UI **nemažeme z DB** (delta merge nesahá na klíče, které UI nezapisuje) — žádný data loss, jen je nezobrazujeme.

## 3. Multipovolání + obory

**Nové pole:** `jad_classes` = JSON pole `[{ c: string, l: string, s: string }]`
- `c` = povolání, `l` = úroveň v povolání, `s` = obor/specializace

**Data** (`sheets/jad/constants.ts`, z PDF „přehled povolání a oborů"):
```
JAD_CLASSES: Record<název, { sub: number; list: string[] }>
```
`sub` = prahová úroveň výběru oboru. 11 povolání:
Alchymista(3), Barbar(3), Bard(3), Bojovník(3), Čaroděj(1), Černokněžník(1), Druid(2), Klerik(1), Kouzelník(2), Lovec netvorů(3), Tulák(3).

**Chování:**
- Řádek: `<select povolání>` + `<input úroveň>` + `<select obor>` + smazat.
- Obor `<select>` plněn z `JAD_CLASSES[c].list`. **Zamčený** (disabled), dokud `l < sub`; pod ním hint „obor od N. úrovně".
- „+ Přidat povolání" přidá řádek; smazání odebere.
- **Úroveň postavy** (badge) = `Σ l`.
- `JAD_CASTERS` (Alchymista, Bard, Čaroděj, Černokněžník, Druid, Klerik, Kouzelník) — je-li mezi povoláními kouzlící a `jad_spellEnabled` ještě není nastaveno, zapni ho (jen jednou, nepřepisuj ruční volbu).

**Migrace (read-only, bez side-effectu):** je-li `jad_classes` prázdné, odvodím initial `[{ c: jad_class, l: jad_level||'1', s: '' }]` z legacy pro zobrazení. První edit uloží `jad_classes`; legacy `jad_class`/`jad_level` zůstanou v DB nedotčené.

## 4. Přidávatelné sekce (místo textarea)

| Sekce | Dnes | Nové pole | Tvar |
|---|---|---|---|
| Zdatnosti (zbroje/zbraně/nástroje) | `jad_other_profs` textarea | `jad_profs` | `string[]` |
| Jazyky | — (součást textarea) | `jad_langs` | `string[]` |
| Schopnosti | `jad_features` textarea | `jad_feats` | `[{ n, d }]` (název + popis) |
| Pomůcky | součást „Ostatní zdatnosti a Pomůcky" | **zrušeno** | — |

**Migrace (read-only):** je-li `jad_profs` prázdné a `jad_other_profs` má text → zobraz jeden řádek s tím textem. Je-li `jad_feats` prázdné a `jad_features` má text → zobraz jednu schopnost `{ n: '', d: features }`. Legacy klíče zůstanou v DB.

## 5. Layout

- Hlavička (identita) → **multipovolání panel (plná šířka)** → 3-sloupcový grid → **Poznámky (plná šířka, úplně dole)**.
- Sloupec 3: Rychlý přehled kouzlení (jen sesilatel) · Zbraně · Zdatnosti · Jazyky · Schopnosti.
- Kouzla (tab „Kouzla / Truhla") — **beze změny**.

## 6. Vizuál

Sladit s návrhem: pergamenové panely, vínová akcentní linka na nadpisech, `Cinzel` nadpisy. Zachovat scope `[data-diary-system='jad']` a paletu blízkou stávající (`--jad-accent`). Nové třídy: `jad-identity`, `jad-level-badge`, `jad-prof-row`, `jad-sub-hint`, `jad-tag-row`, `jad-feat`. Responsivita dle `base.md` (3→1 sloupec, prof-row stack na mobilu).

## 7. Print view

`JadPrintView` aktualizovat: odebrat jméno/přesvědčení/hráč/pomůcky; přidat multipovolání (povolání L úroveň — obor), zázemí, zdatnosti list, jazyky list, schopnosti (název: popis). Auto úroveň = součet.

## 8. Akceptační kritéria (DoD)

1. Hlavička bez jména/přesvědčení/hráče; zázemí = select; úroveň = auto badge.
2. Multipovolání: přidat/smazat řádek, obory dle povolání, zámek oboru pod prahem, auto součet úrovní.
3. Zdatnosti/jazyky/schopnosti = přidávatelné; pomůcky pryč; poznámky dole.
4. Legacy JaD postava se zobrazí bez ztráty dat (migrace read-only), první edit uloží nová pole.
5. View mode disabluje vše; print view čte stejná data.
6. Testy zelené (upravený `JadSheet.spec.tsx` + nové case); build čistý; mobil i desktop OK.
