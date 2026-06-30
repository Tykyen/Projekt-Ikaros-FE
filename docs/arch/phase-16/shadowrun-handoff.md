# Shadowrun 6e — handoff pro další konverzaci

> **Účel:** navázat za studena na stavbu systému **Shadowrun 6e (Sixth World)** přes skill `system`.
> Datum předání: 2026-06-30. Paměť (auto-load): `project_shadowrun_system`, `project_embed_subdocs_vybava_finance`.
> Šablony (zdroj pravdy): `sablona-denik-per-system.md` + `sablona-skiny-per-system.md` + memory `reference_skin_playbook`.

## Kde to stojí (6 fází skillu `system`)

| Fáze | Stav |
|---|---|
| 1. Deník (list) | ✅ HOTOVO + ověřeno (build, 9 testů, render desktop/mobil) |
| 2. Bestie (schémata + panel) | ❌ **ZBÝVÁ — další na řadě** |
| 3. TM combat panel (PC) | ✅ HOTOVO + ověřeno (build, 78 testů, render reálného CSS) |
| 4. Bestie statblok na mapě | ❌ ZBÝVÁ (po fázi 2) |
| 5. Chat | ✅ HOTOVO zdarma (combat panel dědí přes `COMBAT_PANELS`) |
| 6. Uzávěr (`funkce`+`napoveda`) | ❌ ZBÝVÁ (pool dice + combat panel jsou funkční změny, ještě nezaneseno) |
| poté: 8 skinů (skill `skin`) | ❌ ZBÝVÁ |

**Git:** vše pushnuto na `main` (origin) — `c3a0781e "TM Run"` (fáze 3) na `4f3c6e78 "Shadowrun"` (deník+embed). Uživatel commituje RUČNĚ (nikdy necommituj sám). BE netknut, restart netřeba.

## Co je hotové (klíčové soubory)

**Deník (fáze 1):** `diary-systems/sheets/shadowrun/ShadowrunSheet.tsx` (HUD `.sr-*`, view/edit/print, PC/NPC) · `styles/shadowrun.css` (sci-fi `--mx-*` rodina scoped na shadowrun) · `constants.ts` (reálné 6e atributy) · `shared.ts` (math: `readAttrs/poolOf/srDerived/woundPenalty/armorTotalOf` + typy — **1 zdroj pravdy pro deník i panel**). Datové klíče `sr_*` (reuse legacy, bez migrace). Deníkové sekce `MagicPanel/MatrixPanel/AugPanel/QualitiesPanel/ContactsPanel/IdentityPanel` jsou **exportované** (reuse v panelu).

**Combat panel (fáze 3):** `tactical-map/components/token-panel/system-panels/ShadowrunCombatPanel.tsx` + `.module.css`. Registrace `combatPanels.ts` (`COMBAT_PANELS['shadowrun']`). Kompaktní celý deník (bojové jádro + Detaily v centrovaném `Modal`u reusujícím deníkové sekce). HP bar na tokenu: `resolveCharacterHp.ts` case `shadowrun` (fyzický záznamník: max=8+⌈Tělo/2⌉, zbývá=max−`sr_cond_phys`).

**SR6 dice engine (cross-cutting, reusable i pro WoD):** `chat/dice/lib/rollEngine.ts` `rollPoolHits(count,sides,threshold)` (úspěchy ≥5 + glitch) · `dicePayload.ts` `PoolDicePayload` rozšířen (hits/ones/glitch/criticalGlitch/hitThreshold) + `buildPoolHitsPayload` · roll flow `kind:'pool-d6'`+`pool` v `rollFromSheet.performSheetRoll` (TM) i `rollFromDiary.rollDiaryRequest` (chat) + `onRoll` union v `diary-systems/types.ts` · vykreslení v `DiceLogPanel.tsx`/`.module.css` + `DiceRollOverlay.tsx`/`.module.css` (faceHit/faceOne/glitch). **Iniciativa = REA+INT+1k6 (součet, `kind:'d6'`)**, NE pool.

**Výbava/Finance v embedu (mimo `system`, žádost autora):** `CharacterDetailPage/components/embed/EmbedSubdocsBar.tsx` (+`.module.css`) — tlačítka 🎒/💰 v TM (`TokenSystemSheet`) + chatu (`DiaryRollPanel`), **JEN PC** (NPC nemají Finance/Výbavu — BE gate). Modal mountuje soběstačné `InventoryTab`/`FinanceTab`. Roadmap bod **16.1g**.

## DALŠÍ KROK: fáze 2 — Bestie

Per `sablona-denik-per-system.md` kroky 5+6 a `system` skill fáze 2+4:
1. **Schémata** `tactical-map/schemas/shadowrun/token.json` + `bestie.json` (NEEXISTUJÍ — každý jiný systém je má). Vzor: `schemas/matrix/` nebo `schemas/jad/`. Sekce + fields + `combatBehavior` (damageable HP = fyzický záznamník, armor, movement, initiative). Pak `schemas/bootstrap.ts` + `registry.ts` + `npm run export-schemas` + BE restart.
2. **HTML návrh** statbloku → schválení uživatelem (prototyp=kontrakt, gate!).
3. **`ShadowrunBestiePanel.tsx`** (+ napojit v `TokenSystemSheet` bestie větvi `if systemId==='shadowrun'`, + chat `BestieRollPanel`/`BestieInstancePanel` jako ostatní). Reuse SR6 pool hod (`onRoll kind:'pool-d6'`). Sdílet jádro mapa↔chat (vzor `FateBestiePanel`+`fateBestieView` nebo `Drd2BestieCombatActions`).
4. Ověř build + testy + render. **`mobil-desktop`** po grafice.

> ⚠️ **Past (rodina CH-030/31):** než píšeš bestie schéma, ověř že konzument (`BestiarPage`, `buildBestieToken`, `TokenSystemSheet`) ho najde pod canonical `shadowrun` id (resolveSystemId). Schéma napsané dřív = mrtvý kód.
> ⚠️ **BE token.update = REPLACE systemStats + strict validace** → `token.json` musí být SUPERSET všeho, co panel patchuje (rodina FATE fáze 3/4 řešení).

## Pak: uzávěr + skiny

- **Fáze 6:** `funkce` (kap. 12 + dice engine pozn.) + `napoveda` (SR6 hody v boji, combat panel) — pool dice + panel jsou funkční změny.
- **8 skinů (skill `skin`):** přidat `shadowrun` do **embed enumerací** `:is([data-diary-system='...'])` v `DiceLogPanel.module.css` + `DiceRollOverlay.module.css` + `TokenInfoPanel.module.css` + `railShell.module.css` + `MapPjPanel`. shadowrun je `--mx-*` HUD rodina (jako matrix/pi) → spíš matrix vzor než dd-rodina. Default skin `scifi`.
- **Dluh per-skin:** vnitřek `InventoryTab`/`FinanceTab` v embed modalu zatím není per-skin tokenizovaný (16.1g follow-up).

## Prototypy (návrhy = kontrakt)
`c:/tmp/shadowrun-denik-audit.html` (deník) · `c:/tmp/shadowrun-mapa-audit.html` (combat panel) · `c:/tmp/sr-dicelog-mock.html` (dicelog pool vizuál — schváleno).
