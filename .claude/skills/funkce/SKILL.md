---
name: funkce
description: Udržuj kódem ověřenou inventuru funkcí v docs/funkce/ v souladu s realitou kódu. Spusť, když se změní funkčnost — nová stránka/route, stub→funkční, změna chování, změna role/oprávnění, nová BE schopnost, vyřešený nebo nově objevený dluh/nesrovnalost. Po dokončení implementace každé fáze/feature, společně se skillem napoveda, před commitem.
---

# Skill: funkce

Drží **`docs/funkce/`** — hloubkovou, **kódem ověřenou** inventuru všeho, co platforma umí — v souladu se skutečným stavem kódu. Tahle inventura je zdroj pravdy, na kterém se staví budoucí uživatelský **průvodce/návody** a **strategie rozšiřování**. Když zastará, plánuje se podle fikce.

> **Vztah k `napoveda`:** `funkce` = hluboký, technicky přesný zdroj (FE+BE, `soubor:řádek`, role gating, hranice, dluhy) pro tým. `napoveda` = mělký hráčský výtah (HelpPage). Při změně funkčnosti aktualizuj **oba**: nejdřív `funkce` (pravda), pak z ní `napoveda` (výtah pro hráče).

## Kdy spustit

- **Po implementaci nové stránky / route** (i stub — patří tam se stavem ⚠️/🚧).
- **Když funkce přejde ze stubu na funkční** (⚠️/🚧 → ✅).
- **Při změně chování existující funkce** (nová akce, změněný flow, nový edge case, nová hranice).
- **Při změně rolí / oprávnění** (nová role, změna kdo co smí, nová granular permission, změna FE i BE guardu).
- **Při nové BE schopnosti** (nový endpoint/modul) — i když FE zatím chybí (zaznamenej jako „BE bez FE").
- **Když se vyřeší nebo nově objeví dluh/nesrovnalost** dotýkající se nějaké funkce → uprav sekci „⚠️ Nesrovnalosti & dluhy" dané kapitoly.

Nespouštěj při: refaktoringu bez funkční změny · typo / CSS / theme úpravě · čistě interní dev/lint změně bez dopadu na to, co uživatel může dělat.

## Struktura `docs/funkce/` — kam co patří

```
docs/funkce/
├── 00-prehled.md            # vstup: účel, legenda stavů, ROLE MODEL, průřezové koncepty, mapa kapitol, „Snímek k: YYYY-MM-DD"
├── 01-ucet-prihlaseni-bezpecnost.md      # login, reset hesla, 2FA, email verify/change, self-delete
├── 02-profil-uzivatele-pratelstvi.md     # profil, veřejné profily, seznam uživatelů, přátelství
├── 03-uvodnik-objevovani-svetu.md        # dashboard, seznam světů, tvorba světa
├── 04-komunitni-obsah.md                 # články, galerie, diskuze, novinky platformy
├── 05-komunikace-platformy.md            # globální chat, Rozcestí, pošta, push, emoty (použití)
├── 06-akce-oblibene.md                   # platformové akce, oblíbené/záložky
├── 07-napoveda-podminky.md               # HelpPage, podmínky užití
├── 08-platformova-administrace.md        # admin panel, granular práva, search, dungeon builder, emoty (správa), export
├── 09-svet-vstup-clenstvi.md             # detail světa, dashboard, členství, role, skupiny, presence, governance R-20
├── 10-nastaveni-hlavni-lista.md          # nastavení světa (taby), per-svět téma, menu/headline builder
├── 11-stranky-wiki-informace.md          # stránky, wiki viewer/editor, AKJ záložky, šablony, pravidla/informace
├── 12-postavy-bestiar-ekonomika.md       # postavy PC/NPC, subdoc, per-system schema, bestiář, obchod, měny
├── 13-komunikace-sveta.md                # chat světa (kanály/konverzace, PJ persona, avatary), novinky světa
├── 14-mapy-nastroje-hry.md               # /mapa (Universe 3D), /mapy (atlas), taktická mapa, zvuky, deník PJ
└── 15-cas-pribeh.md                      # kalendář, konfigurace kalendářů, timeline, počasí, akce, pavučina, scénáře
```

Mapa kapitol je i v `00-prehled.md`. Když si nejsi jistý kam funkce patří, otevři `00-prehled.md`.

### Šablona jedné funkce (DODRŽUJ ji)

```markdown
### <Název funkce>
- **Co to je:** 1–2 věty.
- **Kde:** route + umístění v menu/UI.
- **Kdo:** kdo vidí / kdo edituje — FE guard i BE guard, konkrétní role.
- **Co jde dělat:** odrážky všech reálných akcí.
- **Hranice / co neumí:** limity, chybějící části, TODO/částečné.
- **Zvláštnosti:** důležité chování, pasti, real-time/WS závislosti.
- **Stav:** ✅ funguje / 🚧 částečné / ⚠️ stub-mrtvé.
- **Kód:** FE `soubor:řádek`, BE `soubor:řádek`.
```

### Mapování změna → cíl

| Typ změny | Cíl |
|-----------|-----|
| Nová platformní funkce/route | kap. 01–08 dle domény → přidej blok dle šablony |
| Nová světová funkce/route | kap. 09–15 dle domény → přidej blok dle šablony |
| Stub → funkční | uprav **Stav** (⚠️/🚧 → ✅), dotáhni „Co jde dělat" + „Kód" na realitu |
| Změna role/oprávnění | uprav **Kdo** (FE i BE) v dané funkci + zkontroluj role model v `00-prehled.md` |
| Nová BE schopnost bez FE | přidej blok se Stavem 🚧 a poznámkou „BE hotové, FE chybí" |
| Vyřešený dluh | smaž/uprav řádek v sekci „⚠️ Nesrovnalosti & dluhy" dané kapitoly |
| Nově objevená nesrovnalost | přidej řádek do „⚠️ Nesrovnalosti & dluhy" dané kapitoly |
| Změna napříč (role model, WS vzor, témata…) | uprav „Průřezové koncepty" v `00-prehled.md` |

## Postup

1. **Identifikuj změnu** z konverzace nebo z git diff (FE i BE). Pokud měla fázi v roadmapu, ověř stav v `docs/roadmap-fe.md` / `docs/roadmap2.md`.

2. **Klasifikuj** dle tabulky výše a najdi cílovou kapitolu (a konkrétní `### funkci` v ní).

3. **OVĚŘ V KÓDU — nepiš z paměti.** Tohle je hlavní pravidlo tohoto skillu (odlišuje ho od `napoveda`):
   - Otevři reálný FE soubor (stránka/komponenta/guard) **i** BE (controller/service/schema/dto).
   - Ověř role gating na **obou** stranách (FE guard + BE `assertAccess`/`assertMember`/`@Roles`/`canAdminWorld`…).
   - Každé tvrzení musí být podložené `soubor:řádek`. Když si nejsi jistý, že funkce reálně běží, napiš to explicitně (ne „funguje" naslepo).

4. **Aplikuj edit** přesně dle šablony a stylu okolních bloků:
   - Česky, stručně ale úplně — žádnou reálnou akci nevynech.
   - Stav vždy jeden z ✅ / 🚧 / ⚠️ (viz legenda v `00-prehled.md`).
   - Doplň/aktualizuj **Hranice / co neumí** — je to vstup pro plánování expanze, neořezávej ho.
   - Aktualizuj `soubor:řádek` v sekci **Kód**, pokud se posunuly.

5. **Synchronizuj sekci nesrovnalostí** dané kapitoly: vyřešené smaž, nové přidej.

6. **Aktualizuj datum** „Snímek k: YYYY-MM-DD" v `00-prehled.md` na dnešní datum.

7. **Pokud změna mění to, co hráč musí znát** → spusť i skill `napoveda` (mělký výtah). `funkce` je zdroj, `napoveda` je derivát.

8. **Krátký report uživateli** — 1–2 věty: kterou kapitolu/funkci jsi upravil a jaký je nový stav.

## Pravidla

- **Vše ověř v kódu, ne odhadem.** Inventura je „kódem ověřená" — to je její jediná hodnota. Nepodložené tvrzení ji znehodnotí.
- **BE je autoritativní.** Když se FE guard a BE guard liší, popiš oba a označ rozpor (typicky do sekce nesrovnalostí).
- **Stav jen ✅ / 🚧 / ⚠️** — žádné jiné varianty. Stub vydávaný za hotové = ⚠️.
- **Neořezávej „Hranice / co neumí"** ani sekci nesrovnalostí — to jsou nejcennější části pro expanzi.
- **Interní termíny SMÍ být** (D-NNN dluhy, spec čísla, BE error kódy, `soubor:řádek`) — na rozdíl od `napoveda` je tohle dokument pro tým, ne pro hráče.
- **Nepřidávej novou kapitolu bez souhlasu uživatele** — to je strukturální zásah. Nová funkce patří do existující kapitoly; jen pokud doménově nezapadá nikam, navrhni novou kapitolu uživateli.
- **Když je změn moc / velký redesign struktury**, zastav se a navrhni postup — nedělej tichý přepis celé složky.

## Vazba na ostatní workflow

- **Navazuje na `spec-driven-development`** — spusť `funkce` ve Fázi 3 (po implementaci), společně se zaškrtnutím roadmapu, ještě před `napoveda`.
- **Páruje se s `napoveda`** — `funkce` = hluboký zdroj pravdy, `napoveda` = hráčský výtah z něj. Měň oba.
- **Souvisí s `dluh`** — nově objevený dluh zapiš přes `dluh` do `docs/dluhy.md` A zrcadli do sekce „⚠️ Nesrovnalosti & dluhy" dotčené kapitoly.
- Pokud byla změna čistě grafická (skin/theme) bez funkčního dopadu, `funkce` **NE**spouštěj.
