# Spec 16.2e — Deník postavy DrD II (drd2)

**Stav:** schváleno (prototyp = vizuální kontrakt), implementace krok 3 šablony 16.2 (reálný list).
**Vizuální kontrakt:** `c:/tmp/drd2-denik-audit.html` (iterativně odsouhlaseno s uživatelem).
**Existující kód:** `diary-systems/sheets/drd2/Drd2Sheet.tsx` (8.7h, adaptace z Matrixu) — **přepisuje se**.

## Účel

Předělat generický „Dark Forest Emerald HUD" deníku DrD II na **fantasy pergamenový list** věrný papírovému deníku ALTAR, ale s interaktivními digitálními prvky (klikací stupnice, výpočet využité úrovně, odemykání pokročilých povolání). Default skin `fantasy`.

## Rozsah

**UVNITŘ (jeden sloučený list, BEZ tabů):**
- Hlavička: Jméno · Rasa (kultura) · Úroveň (využitá auto / celková), erb „DrD II".
- **Zdroje:** Tělo / Duše / Vliv — klikací segmentová stupnice (aktuální 0..max, max editovatelný, default 10), každý vlastní barva + rukopisné jizvy.
- **Bojový stav:** Ohrožení / Výhoda — svislá stupnice 1–9 (klik) + velká číslice; Stavy a efekty (textarea).
- **Zbraně a zbroje:** tabulka Předmět / Charakteristika / Poznámka (add/remove).
- **Pomocníci:** seznam (add/remove), každý Charakteristika · Schopnost · Hranice · Platba · Pouto (stupnice 0–11).
- **Rituální předměty (zaříkávač):** seznam (add/remove), každý Předmět + Náboj (stupnice 0–5).
- **Zkušenosti:** Volné XP + XP celkem.
- **Povolání:** Základní (0–5) / Pokročilá / Mistrovská — karty s 5-pip level trackerem, poznámka, **odebrání (✕)**, přidání přes select; pokročilá/mistrovská ukazují podmiňující povolání (`requires`).
- **Zvláštní schopnosti:** zadávané **ručně** (název · povolání · typ · popis), add/remove.
- **Manévry:** statická nápověda (Rychle · Přesně · Mocně · Lstivě · Rozsáhle · Obrana).
- 3 režimy: view / edit / **print** (statický čitelný dokument se stejnými `drd2_*` daty).

**VEN (rozhodnutí uživatele):** Vybavení, Příběh hrdiny, **Původ** (Rasová ZS + Povahový rys), **Groše**, **Suroviny**, taby (sloučeno do jednoho listu).

## Datový model (`customData`, prefix `drd2_`)

| Klíč | Typ | Pozn. |
|---|---|---|
| `name`, `race`, `total_level` | string | hlavička |
| `body`,`body_max`,`soul`,`soul_max`,`influence`,`influence_max` | string(num) | max default 10 |
| `body_scars`,`soul_scars`,`influence_scars` | string | jizvy |
| `threat`,`advantage` | string(num 0–9) | stupnice |
| `state_effects` | string | textarea |
| `weapons` | JSON `[{name,char,note}]` | |
| `companions` | JSON `[{char,ability,bound,pay,bond}]` | `bond`=Pouto 0–11 |
| `rituals` | JSON `[{name,charge}]` | `charge` 0–5 |
| `xp_unused`,`xp_total` | string | |
| `basic_professions` | JSON `[{id,name,level,note}]` | |
| `advanced_professions`,`master_professions` | JSON `[{id,name,level,note}]` | requires z konstanty |
| `special_abilities` | JSON `[{name,source,type,description}]` | ruční |

**Zachované klíče** kvůli BC s 8.7h daty: name/race/total_level/body*/soul*/influence*/scars/threat/advantage/state_effects/weapons/xp_*/(*_)professions/special_abilities.
**Odebráno z UI** (data v DB neztracena, jen se nezobrazí): `race_ability`, `personality`, `coins`, `materials`, `comp_*` (starý jeden pomocník), `master_abilities`.

## Rozhodnutí

- **ALTAR katalog ZS** (`drd2Abilities.ts`, 264 schopností z příruček DrD II) — **NEMAZAT**, ponechán v repu „k ruce" pro budoucí licenční dohodu s ALTARem. **Odpojen od UI**: `Drd2Sheet` ho neimportuje. Seznamy povolání (názvy + `requires` = herní fakta, ne chráněný text) přesunuty do samostatného `drd2Professions.ts`.
- **Využitá úroveň** = součet levelů basic+advanced+master (auto), vedle ručně psané „celkové".
- Vzor **add/remove** sjednocen napříč: zbraně · pomocníci · rituály · povolání · ZS.
- `onRoll` (tactical-map embed) zachován — iniciativa d20.

## Ověření

`tsc -b` · `npm run build` · `vitest Drd2Sheet` · `eslint`. Vizuál po deployi + `mobil-desktop`.

## Krok 4 — Combat panel na taktické mapě (`Drd2CombatPanel`)

**Stav:** schváleno (prototyp `c:/tmp/drd2-mapa-audit.html`). Vzor = `DrdPlusCombatPanel` (single source s deníkem přes `makeCdAccess('drd2_')`, debounced `useUpdateCharacterDiary`, `canEdit` gate, `onRoll`). Přepisuje existující generický `Drd2CombatPanel` (port z Matrixu, čte zastaralá pole `comp_*`/`master_abilities`/`race_ability`).

**Hody:** vše **`2d6+`** (otevřený hod DrD). **Povolání = klik na celý řádek → `2d6+` + úroveň povolání** (pipy nastavují úroveň). **Iniciativa** = `⚡` tlačítko → `2d6+` bez modifikátoru (`initiative:true`). Žádné viditelné „2k6" labely na ovladačích.

**Sekce:**
- Vždy viditelné + editovatelné: úroveň (využitá/celková), **Zdroje** Tělo/Duše/Vliv (segmentové stupnice klik + jizvy), **Ohrožení/Výhoda** (1–9), stavy a efekty, **Povolání** (klik=hod).
- Rozevírací (collapsible): **Zbraně a zbroje** = read-only · **Pomocníci** = editovatelné · **Rituální předměty** = editovatelné · **Zvláštní schopnosti** = read-only.
- Datový model = **shodný s deníkem** (`drd2_*`: companions/rituals/special_abilities seznamy, ne staré `comp_*`). Single source.

**Embedy (F3, krok 8 částečně):** obal mapy + dice log + readout dědí fantasy pergamen přes `DiarySkinScope` (auto `data-diary-system='drd2'`) + tokeny `--dd-embed-*` v `diary-skins.css` (global bundle, NE lazy) + bloky v `DiceLogPanel.module.css` a `DiceRollOverlay.module.css`. Pasti: `@import` před style-rules, tokeny tam kde se konzument načítá (CH-027/028/034).

## Návaznost (šablona 16.2)

Krok 3 (reálný list) ✅ + krok 4 (combat panel) = tato spec. Pak 5–6 bestie, 8 skiny (7 stylů), 9 funkce+napoveda. Default skin `fantasy` (skins/registry.ts).
