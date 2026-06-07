# HANDOFF — Migrace Matrix → Ikaros (stav 2026-06-07)

> **Start here pro novou konverzaci.** Plný plán: [`index.md`](./index.md). Paměť: `project_matrix_full_migration.md`.
> Přečti tenhle soubor + `index.md` celý, pak pokračuj fází podle „ZBÝVÁ".

## Co to je
Jednorázová **transformační** migrace obsahu ze starého .NET Matrixu do Ikaros světa `matrix` na **newmatrix**. NE kopie — staré ploché jednosvětové schéma → Ikaros world-scoped.

## Prostředí (klíčové cesty)
- **Zdrojový dump:** `C:\Matrix\dump\MatrixDatabase` (28 kolekcí, čteno **Node + balík `bson` z `backend/node_modules`**, NE mongorestore).
- **Cíl:** Ikaros `https://newmatrix.patrikzplzne.cz` = server `oak.server.leafhost.cz:11122`, `/opt/projekt-ikaros-be`, mongo container `mongo`, DB `ikaros`, replicaSet `rs0`. ⚠️ **Starý Matrix běží pro hráče na `https://www.projekt-ikaros.com` — NESAHAT.**
- **BE repo** (sem jdou import workflowy + data): `Tykyen/Projekt-ikaros` = `C:\Matrix\ProjektIkaros\Projekt-ikaros`. **FE repo** (sem jde spec/docs): `Tykyen/Projekt-Ikaros-FE` = pracovní adresář.
- **Ručně revidovaná klasifikace stránek:** `C:\Users\arafo\Downloads\f2-klasifikace.csv` (3625 řádků; sloupce `slug;titul;kategorie;podtyp;vlastnik_cil;clearance;jistota;duvod;DO_OBCHODU;TVE_ROZHODNUTI;POZNAMKA`). **Toto je pravda pro kategorie/vazby.** Parsovat robustním CSV parserem (pole mají `;` a `\n` uvnitř).
- **F1 user mapa:** `C:\tmp\f1-user-map.json` (old ObjectId → Ikaros _id). **F3 postavy:** `C:\tmp\f3-characters.json`. Generátory: `C:\tmp\f{1,2,3,4a,4b-npc,4c}-*.js`.

## Mechanika importu (vzor — kopíruj ho)
GitHub Actions workflow v **BE repu** `.github/workflows/import-matrix-*.yml`:
- 3 režimy: `dry-run` (default, jen počítá), `import` (confirm `IMPORT`), `rollback` (confirm `ROLLBACK`).
- Data **gzip** v `migration/*.json.gz`, workflow `gunzip -c` → mongosh skript přes `ssh ... docker compose exec -T mongo mongosh '...ikaros?replicaSet=rs0' --quiet`.
- **Idempotentní** (skip/upsert dle slug nebo characterId), každý dokument **tag `_mig:'fXX'`** → čistý rollback.
- **Workflow commituju+pushuju já**, **spouští ho uživatel ručně** na webu (Actions → workflow → Run). Vždy: napřed dry-run → ověřit číslo → import.
- **Před spuštěním vždy lokálně ověřit** skript: `node --check` + mock běh (mock `db`).
- ⚠️ **Bash classifier občas vypadává** (`claude-opus-4-8 temporarily unavailable`) → retry (po vlnách naběhne), nebo `dangerouslyDisableSandbox:true`.

## HOTOVO ✅ (živé v newmatrix)
| Fáze | Co | Workflow | tag | Výsledek |
|---|---|---|---|---|
| F1 | Účty (24, už byly migrované dřív) | export-ikaros-users | — | mapa hotová |
| F3 | Postavy 943 (24 PC + 919 NPC) + diáře | `import-matrix-characters.yml` | `_mig:f3` | vloženo 943 |
| F4a | Lore stránky 1643 (Lokace/Ostatní/Seznam/Rodokmen) | `import-matrix-pages.yml` | `_mig:f4a` | vloženo 1643 |
| F4b | NPC stránky 1075 (napojené characterRef; 177 karet dovytvořeno) | `import-matrix-npc.yml` | `_mig:f4b` | vloženo 1075 |
| F4c | PC subdocs 49 (výbava 17 / finance 15 / poznámky 17) | `import-matrix-subdocs.yml` | `_mig:f4c` | zpracováno 49 |
| F4-cleanup | smazáno 7 (4 dup karty přezdívek + Lotri NPC karta/stránka + Myra Ostatní); záloha v `*_mig_trash` | `cleanup-matrix-dupes.yml` | trash | smazáno 7 |
| F4b-2 | PC veřejné stránky **20** (`Postava hráče`, `characterRef` za běhu, `ownerUserId`); slug=char slug, obsah z Postava-page | `import-matrix-pc-pages.yml` | `_mig:f4b2` | vloženo 20 |

**Stav newmatrix:** ~**1116 postav** (1120 − 4 dup) + ~**2737 stránek** (+20 PC −1 Myra) + PC subdocs (výbava vč. Měďák 59 položek). Dílčí spec F4b-2: [`f4b2-pc-pages.md`](./f4b2-pc-pages.md).

## ZBÝVÁ 🔜 (pořadí + návod)
1. **F4d — AKJ záložky (velký, ~760).** 415 „AKJ N cíl" + 348 AKJ-Ostatní (podtyp) + PC Tajné + PC AKJ + PC Kontakty(rozhodnutí A). → `akjTabs` na cílovou stránku (cíl přes `vlastnik_cil`/parse „AKJ N <cíl>"). **Chybí-cíl → vygeneruj host stub stránku** (veřejně jen hláška „Obsah jen v AKJ", bez textu/obrázku) + připoj záložku. `akjTab = {id,name,order,access:[{type:'AKJ',value:'N'}],ownerHidden:false,contentOverride:{content,imageUrl,table}}`. Práva: staré `{type:2,value:'Player'}`→`{type:'Role',...}`, `{type:0,value:oldUserId}`→`{type:'UserId',value:<F1 nové id>}`.
2. **F5 — Odkazy:** auto-link výskyty jmen stránek v obsahu vč. českého skloňování (Londýna→Londýn); report nevyřešených.
3. **F12 — Obrázky:** `imageUrl`/`bigImage` = **Google Drive ID** → rehost do Ikaros Cloudinary (konverze webp). Obrázkové karty (Vzhled/Mapa) **zůstávají viditelné + propojené s vlastníkem** (NE mazat/slučovat). **Mapy → Atlas (Mapy)** + vložené u stránky vlastníka.
4. **F6** Pavučina (Universes+`isWoodWide`), **F7** kalendáře (Calenders→character calendar subdoc), **F8** timeline (97)+zvuky (9), **F9** akce (GameEvents 15), **F10** obchod (výbava s `DO_OBCHODU`), **F11** chat 1:1 (ChatMessages/Channels/chatGroups).

## Závazná pravidla / gotchas (detail ve specu)
- **`Page.slug === Character.slug`** (FE hledá `useCharacter(slug)`). Subdoc kolekce keyed `characterId` (unique).
- **Klasifikace = CSV `kategorie`/`podtyp`**; vazby = CSV `vlastnik_cil` (uživatel ručně vyplnil cílovou postavu/stránku). 6 import pravidel: spec sekce 2d. Párování PC: spec 2f.
- **Jméno postavy** = čisté z CSV (NE „X Deník"); **rename** = změň jméno, ale link klíč/slug nech původní (Zara Hawke→slug `zara`, jméno „Zara Villiam").
- `-denik` = PC, `-denik-pj` = NPC (jen 7 mají dvojče = PC tajné). „Vymazat není potřeba" → neimportovat.
- **`plainText` prázdné ≠ prázdné** — obsah je v `paragraphs` (TipTap), strukturovaná data v `sections` (výbava, 16 PC) / `table` (finance) / `accountTable`. Obrázkové (Rodokmen/Mapa/Vzhled) mají jen image.
- **Stará Page pole:** `paragraphs`(TipTap str→`content`), `plainText`, `table`{hasTable,headers,values}, `accountTable`(finance), `sections`[{_id,title,content,isCollapsed,order,items:[{_id,text,quantity,note}]}], `videos`, `imageUrl`(GDrive), `bigImage`, `accessRequirements`[{type:0=UserId/2=Role,value}], `isWoodWide`.
- **AKJ model (potvrzeno uživatelem):** AKJ obsah (text i obrázek) **jen v záložce**, nikdy veřejně; číslo = clearance; char AKJ = vlastník+PJ vždy vidí, ostatní po projití čísla.
- Ikaros subdoc tvary: `character_inventories{sections[]≈staré sections 1:1 _id→id, notes}`, `character_finances{balance,accountType,accessLocation,currency,lastSyncDate,entries[],transactions[],notes}`, `character_notes{content}`, `character_diaries{customData['matrix_*']}` (preset `MatrixSheet`).

## První akce v nové konverzaci
Pokračovat **F4b-2** (PC veřejné stránky) — postavit generátor podle vzoru `C:\tmp\f4b-npc-generate.js`, ověřit, commit do BE repa, uživatel pustí dry-run→import. Pak **F4d**.
