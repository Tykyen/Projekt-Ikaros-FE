# Spec 21.5c — Kouzla (komunitní katalog) — šablony per systém

> Roadmap: [docs/roadmap2.md](../../roadmap2.md) krok **21.5c** (= realizace „kouzel" z 21.1, žádná druhá knihovna). Navazuje na: [spec-21.5](spec-21.5-spolecna-tvorba.md) (hub + stub `/ikaros/kouzla`), **dědí model** [spec-16.2b-2](../phase-16/spec-16.2b-2-bestiar-komunitni.md) (bestiář — scope + knihovny + kurátorství) a zkušenosti [spec-21.5a](spec-21.5a-herbar.md) (herbář).
> **Stav:** 🟢 IMPLEMENTOVÁNO (2026-07-13) — BE modul `spells` (community scope + statblocky + dvouúrovňová diskuse + moderace 20B + pending fronta) i FE `/ikaros/kouzla` (knihovny, detail, editor, návrh statbloku, šablony 14 systémů). Plán: [plan-21.5c.md](plan-21.5c.md). Ověřeno: BE typecheck+lint ✓ · FE build ✓ · vitest 3602+9 ✓. Zbývá: skiny (odloženo, jako bestiář/herbář). Zadání uživatele 2026-07-13 (4 vzorové obrázky DrD 1.6 / DrD+ / DnD 5e / JaD; „schvalovaná kouzla a kouzla přijmutá jako balancnutá").

---

## 1. Účel

Komunitní katalog **vlastních kouzel** pod Společnou tvorbou (`/ikaros/kouzla`). Hráči tvoří **originální kouzla** pro svůj systém; komunita je prohlíží, diskutuje, kurátor schvaluje.

## 2. Klíčová rozhodnutí (diskuze 2026-07-13)

- **R1 — Model bestiáře, ne herbáře.** Kouzlo je bytostně systémové (každý systém má jiný statblok) → **společné jádro (oznámení + obrázek) + mapa `statblocks` per systém** (jako `GlobalBestie`). Rostlina byla neutrální, kouzlo není.
- **R2 — Škola magie povinná v každém statbloku.** Per-systém taxonomie (viz §5); kde ji systém nemá (CoC, DrD 1.6 kouzelnická kouzla), doplňujeme vlastní zařazení (nabídka + volný text). Zadání: „u každé magie by měla být ještě škola magie, pokud tam není."
- **R3 — Hodnoty polí = text.** Hodnoty jsou vzorce („3 magy za blesk", „+16 (6 kol)", „2 mg [3]") → textová pole. Enum/checkbox jen u uzavřených množin (škola, úroveň/stupeň, složky V/P/S, povolání, rituál/soustředění).
- **R4 — Žádný seed z příruček.** Oficiální kouzla z příruček NEpřepisujeme (autorské právo, pravni-ramec kap. 23b). Katalog roste **jen z komunitní tvorby**. Zadání: „nechci přepisovat příručky, chci jen mít možnost, aby hráči vytvářeli vlastní kouzla."
- **R5 — Dvě úrovně šablon.** (a) **Plný statblok** — pevná pole (9 systémů, §5). (b) **Volná šablona** — škola + páry *popisek : hodnota* (drd2, pi, fate, fae, generic/vlastní systémy) — kouzlo jde založit i bez pevné šablony.
- **R6 — Šablony žijí ve FE, BE je schema-less.** `systemStats: Record<string, unknown>` jako u bestie; šablony = FE form-definice (constants, vzor `bestiar/components/systems.ts`). Přidání systému/pole = FE změna bez BE migrace.

## 3. Datový model — `GlobalSpell` (mirror `GlobalBestie`)

```
GlobalSpell {
  scope: 'community'
  systemId                                  // primární systém (kouzlo vzniklo pro něj)
  name                                      // název kouzla
  aliases?                                  // alternativní názvy (CoC „hlubší jména", lidové názvy)
  imageUrl?, imageFocalX/Y?, imageZoom?, imageFit?    // obrázek + výřez (reuse)
  description                               // „oznámení" — lore/popis účinku (volný text)
  tags[]?
  status: 'draft' | 'approved'              // Návrhy / Schválená knihovna
  authorId, createdAt, approvedAt?, approvedBy?
  moderationHidden?, moderationHiddenReason?
  statblocks: Record<systemId, { systemStats, status, authorId, createdAt }>   // jako bestie
}
```

Diskuse **dvouúrovňová** jako bestiář (o kouzle + ke statbloku systému) — reuse `BestieComment` vzor.

## 4. Konzistence s deníky (zdroj pravdy pro pole)

Deníky už kouzla strukturují — katalogové šablony jsou jejich **superset** (aby šel později udělat import katalog → deník):

| systém | deník má | katalog přidává |
|---|---|---|
| drd16 | `Drd16Spell`: název, zaklínadlo, magenergie, past, dosah, rozsah, vyvolání, trvání, obor, popis | působení, zdroj |
| dnd5e/jad | `DndSpell`/`JadSpell`: název, útok/SO, doba sesílání, dosah, trvání (+prepared/spellbook) | škola, úroveň, složky, soustředění, rituál, povolání, na vyšších úrovních |
| drdplus | `FORMA_AXES` (4 osy formy) | celý statblok |
| drdh | kouzelník: název/mana/obtížnost · hraničář: název/duš. síla/obtížnost | zaklínadlo, ověření, dosah, rozsah, vyvolání, trvání, vyžaduje |
| matrix | `MATRIX_MAGIC` (21 škol) | celý statblok |

## 5. Šablony statbloků per systém

Pole ⭐ = povinné; ostatní volitelná. **Škola vždy první pole editoru.**

### drd16 — Dračí doupě 1.6 *(vzor „Rozklad")*
- ⭐ **Škola (druh)** — nabídka: *mentální · vitální · pátrací · časoprostorová · materiální · energetická* + vlastní text (1.6 nemá jednotnou taxonomii; mág používá tyto druhy, kouzelnická kouzla druh nemají → doplní autor)
- Zaklínadlo · ⭐ Magenergie („6 mágů") · Past („Odl ~ 7 ~ polovina") · ⭐ Dosah · ⭐ Rozsah · ⭐ Vyvolání · ⭐ Trvání · Působení („1–10 kol") · Zdroj/kniha („Kniha Plíživé Smrti")

### drdplus — Dračí doupě+ *(vzor „Znám zkratku")*
- ⭐ **Obor** — enum 6 (magie života: *mentální · vitální · investigativní* · magie hmoty: *časoprostorová · materiální · energetická*)
- ⭐ Magenergie („2 mg [3]") · ⭐ **Náročnost** — víceřádkový text, prahy → hodnota parametru („+14 → Tloušťka +0 · +17 → +3 · +20 → +6") · ⭐ Vyvolání („+0") · ⭐ Dosah · ⭐ Rozsah · ⭐ Trvání („+16 (6 kol)")
- **Forma** — 4 osy dle deníku (Působení: přímá/nepřímá · Projev: paprsek/plocha/objem · Hmota: hmotná/nehmotná · Viditelnost: viditelná/neviditelná)

### dnd5e — D&D 5e *(vzor „Silová klec")*
- ⭐ **Škola** — enum 8: *věštění · iluze · nekromancie · očarování · proměny · vymítání · vyvolávání · zaklínání*
- ⭐ **Úroveň** — 0 (trik) až 9 · Rituál ☐
- ⭐ Vyvolání („1 akce") · ⭐ Dosah · ⭐ **Složky** — ☐V ☐P ☐S + materiál text („rubínový prach v hodnotě 1 500 zl") · ⭐ Trvání + Soustředění ☐ · **Povolání** — multi-výběr (bard, bojovník, černokněžník, druid, hraničář, klerik, kouzelník, mnich, paladin, tulák, zaklínač, barbar) · Útok / SO („SO Mou, polovina") · Na vyšších úrovních

### jad — Jeskyně a draci *(vzor „Ubrousku, prostři se!")*
- Stejná kostra jako dnd5e: ⭐ Škola (enum 8 totožný) · ⭐ **Stupeň** 0–9 (JaD terminologie) · Rituál ☐ · ⭐ Vyvolání · ⭐ Dosah (sáhy) · ⭐ Složky V/P/S + materiál · ⭐ Trvání + Soustředění ☐ · Povolání (JaD: bard, bojovník, černokněžník, druid, hraničář, klerik, kouzelník, mnich, paladin, tulák, zaklínač) · Útok / SO · Na vyšších stupních

### drdh — Dračí hlídka *(ověřeno Roll20 kompendium)*
- ⭐ **Obor** — enum 6: *divoká · proměn · mentální · ochranná · vitální · vysoká* (pole „Vyžaduje" v pravidlech)
- Zaklínadlo · ⭐ **Cena** (mana / duševní síla — kouzelník vs hraničář) · ⭐ Obtížnost · Ověření · ⭐ Vyvolání · ⭐ Dosah · ⭐ Rozsah · ⭐ Trvání · Vyžaduje (předpoklady — obory/stupně)

### coc — Volání Cthulhu (7e)
- ⭐ **Škola/kategorie** — volný text s nabídkou (*mýtická · lidová · snová*) — CoC školy nemá, zařazení doplňuje autor (R2)
- ⭐ **Náklady** — body magie + body příčetnosti („8 bodů magie; 1k6 příčetnosti") · ⭐ **Doba sesílání** · Alternativní jména · Hlubší varianty

### gurps — GURPS (4e)
- ⭐ **Kolej (škola)** — nabídka + vlastní: *vzduch · země · oheň · voda · zvířata · ovládání těla · komunikace a empatie · tvoření a lámání · očarování · jídlo · brány · léčení · iluze a tvoření · poznání · světlo a tma · meta-kouzla · mysl · pohyb · nekromantická · rostliny · ochrana a varování · zvuk · technologická · počasí*
- Třída (obyčejné / plošné / střela / blokovací / informační / odporované) · ⭐ **Cena** (seslání / udržování — „4/2") · ⭐ Doba seslání · ⭐ Trvání · Předpoklady (jiná kouzla / Magery)

### shadowrun — Shadowrun (6e)
- ⭐ **Kategorie (škola)** — enum 5: *bojová · detekční · léčebná · iluzní · manipulační*
- ⭐ **Typ** — many (M) / fyzické (F) · ⭐ **Dosah** — dotyk / přímá viditelnost / LOS oblast / vlastní · ⭐ **Trvání** — okamžité / udržované / permanentní · ⭐ **Odliv (Drain)** („5") · Poškození (bojová — F/O)

### matrix — Matrix (vlastní systém projektu)
- ⭐ **Škola** — enum 21 z `MATRIX_MAGIC` (alchymie, antimagie, démonologie, druidská, exorcismus, léčebná, magie těla, nekromancie, obranná, ohnivá, ovládání energie, psionika, rostlinná, stínová, šamanská, teleportační, věštecká, vodní, vzdušná, zemní, zvířecí)
- Cena/náročnost · Dosah · Trvání — volitelné texty (systém magii řeší schopnostmi; ⚠️ pole potvrdit s autorem systému při impl.)

### drd2 — Dračí doupě II *(volná šablona + nabídka okruhů)*
- ⭐ **Okruh (škola)** — volný text s nabídkou z povolání (přírodní magie, magie ohně, magie větru, zvířecí magie, psychická, kletby, rituální, vědmácká znamení…) — DrD II magii improvizuje ze schopností, pevný statblok nemá
- Zdroje/cena (Tělo/Duše/Vliv) · Náročnost/Ohrožení · Účinek · + volné páry *popisek : hodnota*

### pi · fate · fae — aspektové systémy *(volná šablona)*
- ⭐ Škola/okruh (volný text) · + volné páry *popisek : hodnota* (aspekt, dovednost, cena bodu osudu, stunt…)

### generic / vlastní systémy *(volná šablona)*
- ⭐ Škola (volný text) · + volné páry *popisek : hodnota*

## 6. FE kostra (reuse bestiář — detail až v impl. plánu)

- Route `/ikaros/kouzla` (nahradit stub), dlaždice `tiles.ts` → active.
- Knihovna (Schválená/Návrhy) + filtry: systém, škola, štítek. Řádek: obrázek · název · systém(y) · škola · diskuse.
- Detail „karta kouzla": obrázek + oznámení (lore) + statbloky per systém (taby jako bestiář) + diskuse.
- Editor: společné jádro + statblok dle šablony §5 (form-definice v constants; volná šablona = dynamické páry).
- Auth: login-required (parita bestiář/herbář). Moderace/pending reuse 20B.

## 7. Mimo scope / otevřené otázky

- **Vklad do obchodu** (svitky s cenou?) — u kouzel nejasné, MVP bez toho; případně později dle herbáře Etapa B.
- **Import katalog → deník** (kouzlo do spellbooku postavy) — přirozený další krok (§4 superset to umožňuje), samostatná spec.
- **Skiny** — odloženo (jako bestiář/herbář); od začátku stabilní data-atributy.
- **Shadowrun/GURPS české termíny** — návrh dle překladů Mytago/komunity; doladit při impl.
- Lektvary (21.5b) a Hádanky (21.5d) — samostatné specy, týž model.
