# Spec 8.7v — Call of Cthulhu: bestie (statblok na mapě + v chatu)

**Status:** 🚧 schválen vizuál (HTML prototyp `c:\tmp\coc-bestie-audit.html`, 2026-07-01) — implementováno, build+testy zelené, čeká živé ověření po deployi.
**Navazuje na:** 8.7t (deník), 8.7u (combat panel + percentile). **Vzor:** GURPS 8.7r (bestie — dedikovaný statblok, sdílené jádro mapa↔chat).

## 1. Cíl

CoC byl jediný systém bez dedikovaného bestie panelu (jel přes generický schema-engine → holý formulář, žádné hody, SAN loss se ztratil). Přidat **horror-dossier „kartu netvora"** s d100 hody + prominentní **ztrátou příčetnosti** (signature CoC).

## 2. Schémata (superset)

- `schemas/coc/token.json` → **v2 superset** — přidáno: meta (creature_type/tactic), characteristics.* (8), dodge/fighting/damage_bonus/build, attacks (list), sanity_loss.*, abilities (list). ⚠️ **Musí být superset** — mapa PATCH prochází `sanitize` proti token schématu (BE strict); pole mimo schéma by se při editaci zahodila (vzor GURPS „token = superset").
- `schemas/coc/bestie.json` → přidáno meta + attacks (konzistence s tokenem; bestiář editor + spawn snapshot).
- `combatBehavior`: health.current = damageable, characteristics.dex/initiative.current = initiative, armor = armor-reducer, movement.

## 3. Komponenty

- `CocBestieCombatActions.tsx` — **sdílené jádro** (mapa↔chat, 0 drift): Vlastnosti (8, klik = d100 percentile) · **Ztráta příčetnosti** (on_seeing/on_attack) · Útoky (zásah d100 + škody mixed) · Boj (Úhyb/Boj klik + BZ/Stavba/Brnění/Pohyb) · Zvláštnosti (modal). Export `parseCocDamage` (XKY → mixed{dY}; „+BZ"/text ignoruje; d3 → null).
- `CocBestiePanel.tsx` + `.module.css` — **mapa**: HP± (currentHp + systemStats health.current), iniciativa = OBR (flat), inline edit, `sanitize` proti `coc:token`.
- `CocChatBestiePanel.tsx` — **chat**: sourozenec, `useChatDiaryRoll`, `onPatch` (systemStats VOLNÝ), reuse jádro + mapStyles.

## 4. Napojení

- `TokenSystemSheet.tsx` — `if (systemId === 'coc')` → `CocBestiePanel` (mapa bestie větev).
- `BestieInstancePanel.tsx` — `systemId === 'coc'` → `CocChatBestiePanel` (bestie v boji, editovatelná).
- `BestieRollPanel.tsx` — `systemId === 'coc'` → `CocChatBestiePanel` (katalogová bestie, read-only).

## 5. Hody

- Vlastnost / zásah / dovednost = `d100` percentile „pod cíl" (8.7u engine) → úroveň úspěchu v dicelogu/readoutu.
- Škody = `mixed{dY}` (parseCocDamage).
- Iniciativa = `flat` (= OBR; CoC nehází) → `token.initiative`.

## 6. Akceptační kritéria (DoD)

1. Bestie na mapě i v chatu = horror-dossier statblok; HP bar±, vlastnosti/útoky klik = d100, SAN loss prominentní.
2. Edit nezahodí data (token.json superset + sanitize).
3. Build čistý · CocBestiePanel 8 · schema 64 · ESLint čistý.
4. Živé ověření na mapě + v chatu (po deployi). 0 BE (schémata FE, systemStats volný/Mixed).

**Odloženo:** 8 skinů (skill `skin`), bestiář editor UI (generický), chat propsání širší revize (fáze 5).
