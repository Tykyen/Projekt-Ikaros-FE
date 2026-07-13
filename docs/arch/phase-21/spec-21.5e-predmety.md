# Spec 21.5e — Předměty (komunitní katalog) — druh→sada polí + obchod

> Roadmap: **realizace typu „items" z kroku 21.1** (Globální/komunitní knihovny obsahu), stavěno jako pátá knihovna Společné tvorby (číslujeme 21.5e). **Dědí model** [spec-21.5b](spec-21.5b-lektvary.md) (lektvary — jádro s druhem + statblocky per systém + vklad do obchodu) a [spec-21.5c](spec-21.5c-kouzla.md).
> **Stav:** 🟢 IMPLEMENTOVÁNO (2026-07-13) — BE modul `items` (kolekce `community_items`) i FE `/ikaros/predmety` (knihovny, detail, editor s druh→varianta polí, statblocky, obchod single/bulk, nová 9. dlaždice hubu). Ověřeno: BE typecheck+lint ✓ · FE build ✓ · vitest (cílené 27 + plná suita). Zbývá: skiny · import do výbavy · drdplus/matrix pole doladit. Schváleno uživatelem 2026-07-13 („Jdeme do toho").

---

## 1. Účel

Komunitní katalog **vlastních předmětů** (zbraně, zbroje, vybavení, kouzelné předměty) pod Společnou tvorbou (`/ikaros/predmety`, **nová 9. dlaždice hubu**). Předmět = jádro (druh + oznámení + obrázek + cena) + per-systém statblok (mechanika) + vklad do obchodu světa (single/bulk).

## 2. Klíčová rozhodnutí

- **R1 — Druh předmětu v jádru ŘÍDÍ sadu polí statbloku.** Předmět má uvnitř jednoho systému různá pole podle druhu (zbraň ≠ zbroj ≠ obecný předmět) → šablona systému má **3 varianty**: `weapon` (zbraň, střelná/vrhací zbraň) · `armor` (zbroj, štít) · `general` (vše ostatní vč. vlastního druhu). Mapování `itemKindGroup(kind)`.
- **R2 — Druhy (combo, jádro):** *zbraň · střelná/vrhací zbraň · zbroj · štít · oděv · nástroj · šperk · spotřební · kouzelný předmět · jiné* + vlastní text.
- **R3 — Volné páry všude.** Všechny statbloky předmětů mají zapnuté dynamické páry *popisek : hodnota* (freeform) — předměty jsou nejrozmanitější doména.
- **R4 — Kouzelné předměty bez 4. varianty.** DnD 5e / JaD mají ve VŠECH variantách volitelnou Vzácnost (5 stupňů) + Naladění ☐ + Magické vlastnosti → kouzelný meč = zbraňová pole + vzácnost.
- **R5 — Šablony = superset deníků** (Drd16Weapon/Armor, DrdhWeapon/Armor, GurpsMelee/Ranged + ARMOR_LOCS, CocWeapon, DndWeapon/JadWeapon) → budoucí import do výbavy postavy bez převodníku.
- **R6 — Reuse:** BE mirror `potions` (bez ingrediencí); FE reuse `SpellStatsFields`/`SpellStatblockView`/forms CSS z kouzel + generický `InsertToShopModal` (`itemToShopInsert`). Žádný přepis příruček; hodnoty text, enum jen uzavřené množiny.

## 3. Datový model — `Item` (kolekce `community_items`, mirror `potions` bez ingrediencí)

```
Item { scope:'community', systemId, name, aliases?, image*, kind ⭐,
       description, tags?, suggestedPrice?, status, authorId, approved*,
       moderation*, statblocks: Record<systemId, {systemStats,status,authorId,createdAt}> }
```

Komentáře `item_comments` ('item'|'statblock'), pending `community_item_pending_review`, moderace `ReportTargetType.Item`.

## 4. Šablony statbloků per systém (⭐ povinné; všechny + volné páry)

- **drd16** *(tabulky zbraní; superset deníku)*: weapon: ⭐ Útočnost („4+1") · Obrana zbraně (OZ) · Délka · Váha (mn) · Cena · Dostřel (malý/stř./velký) — armor: ⭐ Kvalita zbroje · Váha · Cena — general: Váha · Cena · Použití
- **drdh** *(superset deníku)*: weapon: ⭐ Typ (na blízko/na dálku) · ⭐ Útočnost · ⭐ Zranění · Obrana · Cena · Váha — armor: Kvalita · ⭐ Základ obrany (ZO) · Cena · Váha — general: Cena · Váha · Použití
- **dnd5e / jad**: weapon: ⭐ Zranění („1k8 sečné") · Vlastnosti (multicheck: lehká/těžká/všestranná/vytříbená/dvouruční/dosahová/vrhací/dostřelná/nabíjecí) · Dostřel · Cena · Váha — armor: ⭐ OČ („14 + Obr (max 2)") · Kategorie (lehká/střední/těžká/štít) · Nevýhoda k Nenápadnosti ☐ · Požadavek Síly · Cena · Váha — general: Cena · Váha · Použití — **všechny varianty:** Vzácnost (select 5, volit.) · Naladění ☐ · Magické vlastnosti (textarea)
- **gurps** *(superset deníku)*: weapon: ⭐ Zranění (sw/thr) · Dosah / Dostřel · Kryt (Parry) · Přesnost (Acc) · Rány · Min. Síla (ST) · Cena · Váha — armor: ⭐ DR · Lokace (multicheck 6 částí těla) · Cena · Váha — general: Cena · Váha · TL · Použití
- **coc** *(superset deníku)*: weapon: ⭐ Dovednost · ⭐ Zranění · Útoky/kolo · Dostřel · Náboje · Porucha · Cena — armor: ⭐ Zbroj (body) — general: Cena · Éra · Použití/účinek
- **shadowrun**: weapon: ⭐ Poškození (DV) · Útočné hodnocení · Režimy palby · Zásobník · Dostupnost · Cena — armor: ⭐ Hodnocení zbroje · Dostupnost · Cena — general: Hodnocení (rating) · Esence (cyberware) · Dostupnost · Cena
- **drdplus**: weapon: Útočnost · Zranění · Kryt · Délka · Váha · Cena — armor: Ochrana · Váha · Omezení · Cena — general: Váha · Cena · Použití — ⚠️ názvy doladit na živých datech
- **matrix**: všechny varianty: Cena · Váha · Účinek — ⚠️ potvrdit s autorem systému
- **drd2 · pi · fate · fae · generic**: volná šablona (jen páry; výbava = aspekty)

## 5. FE + obchod

Route `/ikaros/predmety` (+ `/:id`), **nová dlaždice** hubu (ikona `Swords`). Knihovny/filtry (systém · druh · štítek), detail (statblok dle druh→varianta + diskuse 2 úrovně), editor (jádro + statblok), návrh statbloku (varianta dle druhu jádra), vklad do obchodu single/bulk (`itemToShopInsert`: popis = druh + použití/mechanika). Data-atributy `data-item-*`.

## 6. Mimo scope

Import do výbavy postavy (šablony připraveny) · skiny · seed (jen vlastní tvorba) · předpřipravené obchody (21.1).
