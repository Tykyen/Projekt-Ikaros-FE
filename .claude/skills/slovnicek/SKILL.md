---
name: slovnicek
description: Vytvoří nebo aktualizuje heslo ve slovníčku pojmů (docs/glossary/). Spusť když narazíš na nový projektový pojem, který může mást amatéra, když uživatel řekne "přidej do slovníčku X" / "co znamená Y", nebo při auditu nedávno změněných docs/kódu.
---

# Skill: slovnicek

Drží `docs/glossary/` v souladu s pojmy, kterými se v projektu reálně mluví. Bez něj se vyrojí synonyma a každý dokument si pojem definuje po svém.

## Kdy spustit

- **Auto-detekce při práci** — narazím v rozhovoru, kódu nebo dokumentaci na pojem, který:
  - není ve slovníčku (kontrola podle `name` i `aliases`),
  - je projektově specifický (PJ, svět, kanál, skin, ornament, …) a nebo
  - obvykle plete (kanál vs. konverzace, téma vs. skin, globální vs. world role).
- **Na vyžádání** — uživatel řekne „přidej do slovníčku X", „co znamená Y", „aktualizuj heslo Z".
- **Audit** — uživatel řekne „projdi slovníček" / „co tam chybí" → vytipuju kandidáty z nedávných commitů a docs.

Nespouštěj při:
- Obecných programátorských pojmech (`useState`, `Promise`, `JWT`, …) — slovníček je pro **projektové** pojmy, ne pro frontend lexikon.
- Pojmech, které jsou jen v jednom commitu a možná zmizí (počkej, ať se to ustálí).
- Drobných synonymech existujícího hesla — místo nového hesla přidej alias do toho stávajícího.

## Workflow návrh → souhlas → zápis

⚠️ **Skill nikdy nepíše definici tiše.** Vždy:

1. **Detekuj pojem** a zjisti, jestli už není v `docs/glossary/` (název nebo alias). Pokud je, jdi na bod 5 (update místo create).
2. **Připrav návrh hesla:**
   - `name` — kebab-case slug, **česky** (`pan-jeskyne`, ne `gamemaster`).
   - `aliases` — zkratky, synonyma, anglický ekvivalent (`[PJ, gamemaster, GM]`).
   - `category` — jedna z 7 (viz níže). Když si nejsi jistý, vyber tu, ze které pojem **vznikl**, a souvislosti hoď do `related`.
   - `related` — `[[slug]]` odkazy na propojené pojmy.
   - `status: draft`.
   - **TL;DR** (1 věta) + kostry sekcí Detail / Kde se objevuje / Nepleť s.
3. **Ukáž uživateli návrh** a zeptej se na souhlas.
4. **Po souhlasu zapiš** soubor `docs/glossary/<slug>.md` + **aktualizuj index** v `docs/glossary/README.md` (kategorie + abecední seznam).
5. **Update existujícího hesla:** přečti, navrhni změny diffem, po souhlasu zapiš. Pokud se mění `name` nebo přibývá alias, projdi a updatuj `related` odkazy v ostatních heslech.
6. **Když souvisí s UI**, který hráč uvidí, **připomeň `napoveda`** — možná je třeba doplnit i nápovědu.
7. **Na konci revize touchni `docs/glossary/.reviewed`** (přepiš/ulož) — utiší to auto-připomínku (viz níže) do další změny funkčnosti. **Platí i když nic nepřidáváš** — pokud po prověření žádný nový pojem nevznikl, stejně touchni `.reviewed`, ať hook nehlásí dokola.

## Auto-připomínka (hook)

Stop hook [`.claude/hooks/glossary-reminder.ps1`](../../hooks/glossary-reminder.ps1) (registrovaný v `settings.json`) po každém turnu porovná mtime nejnovějšího `.md` v `docs/funkce` / `docs/arch` (kde vznikají pojmy) vs. marker `docs/glossary/.reviewed`. Když je funkčnost novější → vypíše měkkou připomínku, ať spustíš tenhle skill.

- **Self-resolving:** po revizi touchni `.reviewed` → marker je nejnovější → ticho.
- **Záměrně NEhlídá `src/`** (to dělá `denik-reminder`) ani celé `docs/` (audit dokumenty se mění furt → alarm fatigue).
- **Limit:** nechytí pojem, co padl jen v chatu a ještě není v docs — to zůstává na auto-detekci výše a na „přidej do slovníčku X".

## Kategorie (rozvržení)

Každý pojem patří **do jedné**. Sekundární souvislosti řeší `related`.

| Kategorie | Co sem patří |
|-----------|--------------|
| `architektura` | stack, providers, routing, error boundary, build |
| `role-a-prava` | platformové i světové role, oprávnění, hierarchie |
| `svet` | svět, dashboard světa, world nav, společenství |
| `chat` | kanály, konverzace, presence, zprávy |
| `tema-a-skin` | skin, ornament, theme isolation, vzhled |
| `ui` | layout, dlaždice, komponenty, mobil/desktop |
| `herni-mechaniky` | game-events, postavy, sezení, akce |

📚 **Šuplík per pojem** = jasná primární kategorie ve frontmatteru. Když to nejde rozhodnout, je to znamení, že pojem je moc široký a nejspíš se má rozdělit.

## Pravidla

- **Česky, kebab-case slug.** Žádný `game-master.md` — `pan-jeskyne.md` s aliasem `gamemaster`.
- **Drž tvoje pojmenování.** Když uživatel mluví o „kanálu" a „konverzaci" (i když BE má opačně — viz [[kanal]] / [[konverzace]]), slovníček odráží **frontend / komunikační** úzus, ne backend kód. Backend pojmenování jde do sekce *Nepleť s*.
- **`status: draft` dokud neproběhne revize uživatelem.** Definici nikdy nezamykej do `stable` sám.
- **TL;DR je závazná disciplína** — jedna věta, srozumitelná amatérovi. Když se to nedaří, pojem je špatně vymezený.
- **Nepleť s** je povinná, pokud existuje **podobně znějící pojem** (téma vs. skin, kanál vs. konverzace, globální vs. world role).
- **Index v README.md drž synchronizovaný** — kategorie i abecední seznam. Žádné sirotčí soubory bez záznamu v indexu.
- **Žádné definice z hlavy** pro projektově nejasné věci — pokud nevíš, napiš `TBD` v Detail a počkej, až to uživatel doplní.
- **Nelinkuj na specs/plans/audity** v sekci *Kde se objevuje* (ty se mění) — jen na **kód** a **stabilní dokumentaci**.

## Vazba na ostatní skilly

- `spec-driven-development` — spec a plány můžou linkovat na pojmy přes `[[slug]]`. Když ve spec vznikne nový pojem, spusť `slovnicek`.
- `napoveda` — když pojem dostane veřejné UI (uvidí ho hráč), updatuj **i nápovědu**.
- `dluh` — když najdeš pojem, ale nejde definovat (chybí kontext, čeká se na rozhodnutí), zapiš jako dluh místo `status: draft` ve slovníčku.

## Pomocný workflow při auditu

1. Projdi `git log --since="2 weeks ago" --name-only` (nebo poslední commity z roadmapy).
2. Vypiš pojmy, které se v diffech opakují a nejsou ve slovníčku.
3. Předlož **seznam kandidátů** uživateli — necháš ho vybrat, které doplnit.
4. Vybrané pojmy zpracuj jeden po druhém standardním workflow (návrh → souhlas → zápis).
