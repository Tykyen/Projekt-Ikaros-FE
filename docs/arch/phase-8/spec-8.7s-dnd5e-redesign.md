# Spec 8.7s — D&D 5e deník: multipovolání, obory, přidávatelné sekce

**Status:** ✅ implementováno (2026-06-29) — sheet + constants + CSS + 32 testů zelené, build čistý, strukturální mobil-desktop OK; touch-target a11y fix doplněn. Čeká: živý mobil-desktop na zařízení + `funkce`/`napoveda` + commit.
**Předchůdce:** 8.7d (D&D 5e preset — 1:1 přenos legacy) — viz [spec-8.7](spec-8.7-diary-system-presets.md)
**Vzor:** 8.7p (JaD redesign) — viz [spec-8.7p](spec-8.7p-jad-redesign.md)
**Rozsah:** pouze systém `dnd5e`. Mění `sheets/dnd5e/*`, `styles/dnd5e.css`. Žádný jiný systém ani sdílené moduly. **Combat panel + bestiář NE** (později, jako JaD 8.7q/8.7r).

## 1. Cíl

Posunout D&D 5e deník z 1:1 přenosu legacy listu na **funkční tvorbu postavy**: multipovolání s obory (subclass), osobní zázemí jako výběr, auto-úroveň a strukturované přidávatelné sekce místo volných textarea. Funkčně shodné s JaD 8.7p, ale **zachovává vlastní vzhled** (Arcane Parchment, vínová `--dnd-accent`) i D&D specifikum, které JaD nemá: death-save pipy. (Bloky osobnosti Rysy/Ideály/Pouta/Vady **odebrány na přání uživatele** — jako JaD.)

## 2. Změny v hlavičce

| Pole | Dnes | Cíl |
|---|---|---|
| Jméno postavy (`dnd_charName`) | input | **odebráno z UI** (řeší stránka postavy) |
| Jméno hráče (`dnd_playerName`) | input | **odebráno z UI** |
| Povolání a úroveň (`dnd_classLevel`) | volný text | **nahrazeno** multipovolání panelem (§3) |
| Rasa (`dnd_race`) | input | beze změny |
| Přesvědčení (`dnd_alignment`) | input | **odebráno z UI** (na přání) |
| Zázemí (`dnd_background`) | volný text | **`<select>`** zázemí + „Vlastní…" |
| Body zkušeností (`dnd_xp`) | input | beze změny |
| Úroveň | — | **auto = součet úrovní povolání** (read-only badge) |

⚠️ Odebraná pole z UI **nemažeme z DB** (delta merge nesahá na klíče, které UI nezapisuje) — žádný data loss.

## 3. Multipovolání + obory

**Nové pole:** `dnd_classes` = JSON pole `[{ c, l, s, s2 }]`
- `c` = povolání, `l` = úroveň v povolání, `s` = obor (1. osa), `s2` = 2. osa (jen Černokněžník: pakt)

**Model** (`sheets/dnd5e/constants.ts`):
```ts
interface DndClassDef {
  sub: number;      // práh úrovně pro 1. osu (obor)
  list: string[];   // 1. osa
  label?: string;   // popisek 1. osy (default 'Obor')
  sub2?: number;    // práh 2. osy (jen Černokněžník)
  list2?: string[]; // 2. osa
  label2?: string;  // popisek 2. osy
}
```

**12 povolání** (pořadí dle zadání), s prahem oboru a popiskem osy:

| Povolání | sub | osa (label) | obory |
|---|---|---|---|
| Barbar | 3 | Stezka | Berserkr · Totemový — Medvěd/Vlk/Orel/Los/Tygr · Bojechtivec |
| Bard | 3 | Kolej | Bojový · Znalostní |
| Bojovník | 3 | Archetyp | Čaroknecht · Šampión · Taktik · Rytíř |
| Čaroděj | 1 | Původ | Divoká magie · Démoní rod · Bouřný čaroděj |
| Černokněžník | 1 / **3** | **Patron** + **Pakt** | Patron: Arcivíla/Běs/Prastarý/Nehynoucí · Pakt: čepele/rukověti/řetězu |
| Druid | 2 | Kruh | Kruh měsíce · Kruh země — Arktida/Bažina/Hory/Lesy/Pláně/Pobřeží/Poušť/Podzemí |
| Hraničář | 3 | Archetyp | Lovec · Pán zvířat |
| Klerik | 1 | Doména | Bouře · Příroda · Světlo · Šalba · Válka · Znalost · Život · Mystika |
| Kouzelník | 2 | Škola | Iluze · Nekromancie · Očarování · Transmutace · Věštění · Vymítání · Zaklínání · Zpěv meče |
| Mnich | 3 | Tradice | Cesta čtyř živlů · otevřené ruky · stínů · dlouhé smrti · Sluneční duše |
| Paladin | 3 | Přísaha | Oddanost · Pomsta · Starověku · Koruny |
| Tulák | 3 | Archetyp | Mystický šejdíř · Vrah · Lupič · Šibal · Švihák |

**Chování:**
- Řádek: `<select povolání>` + `<input úroveň>` + `<select obor>` [+ `<select pakt>` jen u Černokněžníka] + smazat.
- Obor `<select>` plněn z `list`. **Zamčený** (disabled), dokud `l < sub`; pod ním hint „obor od N. úrovně". 2. osa stejně proti `sub2`.
- „+ Přidat povolání" přidá řádek; smazání odebere.
- **Úroveň postavy** (badge) = `Σ l`.
- **Casteři** (auto-zapnou kouzla, nenastaví-li uživatel ručně): Bard, Čaroděj, Černokněžník, Druid, Klerik, Kouzelník, Paladin, Hraničář. Subclass-casteři (Čaroknecht, Mystický šejdíř, Cesta čtyř živlů) → ruční přepínač.

**Migrace (read-only, bez side-effectu):** `dnd_classLevel` je volný text → nelze spolehlivě mapovat na select. Je-li `dnd_classes` prázdné a `dnd_classLevel` má text → zobraz **jednorázový read-only hint** „Dřívější zápis: …" nad panelem + jeden prázdný editovatelný řádek. První edit uloží `dnd_classes`; `dnd_classLevel` zůstane v DB nedotčený.

## 4. Přidávatelné sekce (místo textarea)

| Sekce | Dnes | Nové pole | Tvar | Migrace (read-only) |
|---|---|---|---|---|
| Zdatnosti (zbroje/zbraně/nástroje) | `dnd_otherProf` textarea | `dnd_profs` | `string[]` | otherProf text → 1 řádek |
| Jazyky | — (součást textarea) | `dnd_langs` | `string[]` | — (nové, prázdné) |
| Schopnosti a rysy | `dnd_features` textarea | `dnd_feats` | `[{ n, d }]` | features text → `{ n:'', d: features }` |

Legacy klíče zůstanou v DB.

## 5. Layout

- Identita (hlavička) → **multipovolání panel (plná šířka)** → 3-sloupcový grid (zachovat stávající dnd rozložení) → **Poznámky (`dnd_play_notes`, plná šířka, úplně dole)**.
- Sloupec 1: vlastnosti (6), inspirace + zdatnostní bonus, záchranné hody, pasivní smysly (Vnímání/Vhled/Pátrání).
- Sloupec 2: boj (OČ/Iniciativa/Rychlost), životy, kostky životů + záchrany proti smrti (pipy), útoky.
- Sloupec 3: rychlý přehled kouzlení (jen caster), zdatnosti, jazyky, schopnosti.
- Kouzla (tab „Sesílání kouzel") — **beze změny** funkčně; auto-enable dle casterů (§3).

## 6. Vizuál

Scope `[data-diary-system='dnd5e']`, paleta beze změny. Nové třídy (theme vars dnd): `dnd-identity`, `dnd-level-badge`, `dnd-prof-list`, `dnd-prof-row`, `pcol`/`pcap`, `dnd-sub-hint`, `dnd-foot-hint`, `dnd-tag-row`, `dnd-feat`, `add-link`, `del-btn`, `dnd-notes-full`. Responsivita dle `base.md` (3→1 sloupec, prof-row stack na mobilu). Po implementaci → `mobil-desktop`.

## 7. Print view

`DndPrintView` aktualizovat: odebrat jméno/hráče; nahradit `classLevel` multipovoláním (Povolání L úr. — obor [/ pakt]); zázemí; auto-úroveň; zdatnosti/jazyky list; schopnosti (název: popis); poznámky. Zachovat útoky, kouzla.

## 8. Akceptační kritéria (DoD)

1. Hlavička bez jména/hráče/přesvědčení; zázemí = select + vlastní; úroveň = auto badge; rasa/XP zůstávají.
2. Multipovolání: přidat/smazat řádek, obory dle povolání, zámek oboru pod prahem, auto součet úrovní.
3. Černokněžník zobrazí 2 selecty (Patron od 1., Pakt od 3. úr); Totemový/Kruh země vypsané jako kombinace.
4. Zdatnosti/jazyky/schopnosti = přidávatelné; bloky osobnosti odebrány; poznámky dole.
5. Caster povolání auto-zapne tab kouzel; ruční přepínač má přednost.
6. Legacy D&D postava se zobrazí bez ztráty dat (migrace read-only), první edit uloží nová pole.
7. View mode disabluje vše; print view čte stejná data.
8. Testy zelené (přepsaný `DndSheet.spec.tsx`); build čistý; mobil i desktop OK.
9. Aktualizovat `funkce` (kap. deníky) + `napoveda` (Detail postavy) po živé kontrole.
```
