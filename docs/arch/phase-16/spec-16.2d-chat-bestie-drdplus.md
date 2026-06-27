# Spec 16.2d-chat-bestie — DrD+ bestie v railu světového chatu (parita s mapou)

**Status:** ✅ HOTOVO (schváleno 2026-06-27 + „i s obalením a log dicem"; impl. + 34 testů + build zelené). „Obalení": chrome railu nese drdplus pergamen přes railShell `[data-diary-system='drdplus']` (DiarySkinScope nad celým aside, display:contents). „Log dice": dice readout v chatu nese skin přes DiceRollOverlay drdplus větev. Sdílené jádro `DrdPlusBestieCombatActions` (mapa↔chat, 0 drift).
**Rozsah:** **FE only.** DrD+ (`drdplus`) bestie v pravém railu světového chatu — katalog (`BestieRollPanel`, 16.1c) + roster instance (`BestieInstancePanel`, 16.1e). Ostatní systémy beze změny.
**Repo:** `Projekt-ikaros-FE`, commit na `main`. · **Autor:** PJ + Claude · **Datum:** 2026-06-27
**Souvisí:** spec-16.2d-mapa-drdplus (mapový `DrdPlusBestiePanel` = vzor) · spec-16.2b-chat-bestie-drd16 (analog drd16) · [[project_drd16_system_status]] · CH-032 (per-systém parita v chatu).

> Dokončuje paritu DrD+ napříč povrchy (deník/mapa/**chat**). Stejný vzor jako drd16, jen DrD+ specifika.

---

## 1. Cíl / problém
DrD+ bestie v chatu renderuje **generic `BestieStatblock`** — jiný vzhled (žádný pergamen) i chování (žádné 2k6+/BČ/ÚČ/OČ/ZZ chipy, žádná iniciativa z BČ) než mapový `DrdPlusBestiePanel`. `BestieRollPanel`/`BestieInstancePanel` větví jen `drd16`/`matrix`, drdplus díra.

## 2. Řešení
Větev `systemId === 'drdplus'` v obou rail panelech → **`DrdPlusChatBestiePanel`** (sourozenec mapového `DrdPlusBestiePanel`), obaleno `DiarySkinScope` (pergamen). Reuse `DrdPlusBestiePanel.module.css` (stejný pergamen vzhled).

## 3. Klíčová rozhodnutí
| # | Rozhodnutí | Důvod |
|---|---|---|
| R1 | **Hody 2k6+** (BČ/ÚČ/OČ + Vlastnosti/Tělo/Smysly), **ZZ = d6**; `systemStats.postih` přičítán k modifieru. Routing `useChatDiaryRoll` (atribuce `bestie`), klik na chip/řádek = hod. | parita s mapou; chat dice trubka |
| R2 | **BČ → iniciativa** přes `useChatDiaryRoll` `onResult(total)` → `onPatch({initiative})` (souboj lišta řadí dle `combatant.initiative`). Katalog bez persistence. | parita s mapou + drd16; „BČ určí i iniciativu" |
| R3 | **Wound = pásma** (Bez postihu / Postih / Kóma) z `injury` vs `mez_zraneni`, jako mapa. Injury v chatu uložen v **`systemStats.injury`** (combatant nemá `token.injury`); ± steppery (−5/−1/+1/+5) instance; postih inline. Katalog read-only. | věrná parita; combatant systemStats je volný |
| R4 | **Ochrana + Vlastnosti + Tělo + Smysly** = read + klik-hod; **Schopnosti + Poznámky** = read. | reference, parita |
| R5 | **Edit = INLINE** (toggle „✏ Upravit bestii" → inputy přímo v panelu), NE modal — DrD+ mapový panel edituje inline a `DrdPlusBestieForm` neexistuje. Persist přes `useCombatantMutation` (op `update`, debounce autosave 500 ms, vzor `BestieInstancePanel`). Katalog bez editu. | konzistence s mapovým DrD+ panelem; bez nové form komponenty |
| R6 | **Sdílené jádro `DrdPlusBestieCombatActions`** — extrahovat z `DrdPlusBestiePanel` read/roll/inline-edit části (Útoky, Vlastnosti/Tělo/Smysly, Ochrana, Schopnosti, Poznámky), použít v mapě I chatu. Wound (pásma) zůstává per-panel (jiný zdroj injury: `token.injury` vs `systemStats.injury`). | 0 drift (vzor drd16 `Drd16BestieCombatActions`); mapa+chat jeden zdroj |

## 4. Rozdíly chat vs mapa (vědomé)
| Aspekt | Mapa | Chat |
|---|---|---|
| Roll routing | `onMapRoll` (3D overlay + map log) | `useChatDiaryRoll` (overlay + zpráva do konverzace) |
| Edit cíl | `useTokenUpdate` (scéna) | `useCombatantMutation` (roster) |
| Injury | `token.injury` | `systemStats.injury` |
| Iniciativa | `token.initiative` | `combatant.initiative` (přes `onResult→onPatch`) |

## 5. Soubory (FE)
- **Nový** `chat/components/rail/DrdPlusChatBestiePanel.tsx` (reuse `DrdPlusBestiePanel.module.css`).
- **Nový** `tactical-map/components/token-panel/system-panels/DrdPlusBestieCombatActions.tsx` (sdílené jádro, extrahováno z `DrdPlusBestiePanel`).
- **Úprava** `DrdPlusBestiePanel.tsx` — přepojit na sdílené jádro (0 regrese, guard testy).
- **Úprava** `BestieRollPanel.tsx` + `BestieInstancePanel.tsx` — větev `drdplus`.
- **Test** `DrdPlusChatBestiePanel.spec.tsx` (BČ→initiative/onPatch; ÚČ/ZZ kind; inline edit autosave; katalog read-only) + udržet `DrdPlusBestiePanel.spec` zelený.

## 6. Co se NEDĚLÁ
- Ostatní systémy beze změny. Žádná BE změna (combatant `systemStats`/`initiative` už existují). Žádný nový BE wound model.

## 7. Otevřené (k potvrzení v plánu)
- R3 injury klíč `systemStats.injury` — ověřit, že combatant patch `systemStats` neztratí klíč (drd16 patchuje `systemStats.hp` volně → OK).
- R6 rozsah extrakce vs. regrese mapy (mitigace: `DrdPlusBestiePanel.spec` + build před/po).
