# Šablona — průchod deníku per herní systém (16.2)

**Účel:** opakovatelný postup pro dotažení deníku každého systému do plné grafické + funkční podoby (reálný list · taktická mapa · bestie · chat · 7 skinů). Destilováno z **pilotního průchodu Matrix** (2026-06-23/24). Pro každý systém zkopíruj [§ Checklist per systém](#checklist-per-systém) a odškrtávej.

**Zlatá pravidla (z Matrixu — platí v každém kroku):**
- **Prototyp = kontrakt.** Vizuál i chování lad' v **standalone HTML** (`c:\tmp\<systém>-<místo>-audit.html`), odsouhlas, **až pak** produkční kód. Šetří cyklení (CH-015/CH-020).
- **Ověřuj sám, ne naslepo.** Agentní/„mělo by" report = hypotéza → `tsc -b` + `npm run build` + relevantní testy + `eslint`. Vizuál potvrzuje **uživatel** po deployi.
- **Reuse > kopie.** Jeden zdroj pravdy (deník = `MatrixSheet` přes `DiaryTab`; combat/bestie reuse logiky). Single source = chat dostane vzhled zdarma.
- **BE a FE nemíchat** v jedné dávce; po BE změně **restart**. Git commituje uživatel (pokud výslovně neřekne jinak).
- **Deník (`chybovy-denik`)** u netriviálního řešení; **funkce + napoveda** po dokončení systému; **roadmap** matice (`16.2a` per systém) odškrtávat.

---

## Workflow (kroky)

### 0. Příprava systému
- [ ] **Ověřit `id` systému** napříč vrstvami (nabídka `RPG_SYSTEMS` ↔ `diary-systems/registry` ↔ `map-systems/registry` ↔ BE). ⚠️ **Drift** (CH: alias `draci-hlidka→drdh`, `drd-plus→drdplus`, `call-of-cthulhu→coc`) — pokud nový systém, přidej alias do obou registry; parity test (`diary-systems/__tests__/registry.test.ts`) to chytí.
- [ ] Ověřit, že **deník (`SystemSheet`) existuje** v `diary-systems/sheets/<id>/` (jinak je to větší práce než redesign).

### 1. Stará verze — snímek
- [ ] **Ukázat, jak deník vypadá teď** — reálný screenshot (Ikaros/produkce) **i** zdroj sheetu (`sheets/<id>/<Id>Sheet.tsx`). Pochopit **sekce + mechaniky** (staty, výpočty, hody, validace). Pozor: mechaniky bývají systémově specifické (Matrix: trojúhelník bodů, aspekty×6, iniciativa 4dF+⌊aspekty/2⌋).

### 2. Volba skinu pro systém
- [ ] **Přiřadit default skin** dle žánru → `diary-systems/skins/registry.ts` `DEFAULT_SKIN_BY_SYSTEM` (matrix→sci-fi · DrD/JaD→fantasy · CoC→horor · …). Hráč si pak může přepnout (`🎨 Vzhled`).

### 3. Reálný list (deník postavy/NPC)
- [ ] **HTML prototyp** (`c:\tmp\<id>-denik-audit.html`) — hero + sekce + view/edit; lad' s uživatelem (úpravy + ukázky reálných dat).
- [ ] **Produkční sheet** — přepsat `<Id>Sheet.tsx` + `styles/<id>.css` (HUD/tokeny), reuse `makeCdAccess` (data `customData` prefix `<id>_`), 3 režimy view/edit/print, PC vs NPC (`useCharacter.isNpc`).
- [ ] **Ověřit:** tsc · sheet testy (přepsat na novou strukturu) · build · eslint. Vizuál po deployi.
- [ ] Roadmap: `[x] Reálný list (grafika)`.

### 4. Taktická mapa — combat panel
- [ ] **HTML prototyp** (`c:\tmp\<id>-mapa-audit.html`) — **ořez na bojové minimum** (jen co je v boji potřeba), HUD styl listu.
- [ ] **Produkční panel** — `<Id>CombatPanel.tsx` + `.module.css` (stavy přes `data-*` atributy), reuse logiky (auto-save debounce, `onRoll`/`onMapRoll`, permission gate `canEdit`). Zaregistrovat v `combatPanels.ts` (`COMBAT_PANELS[id]`).
- [ ] **Ověřit:** tsc · panel testy (mock `useCharacter`/`useCharacterDiary`) · 58+ token-panel · build · eslint.
- [ ] Roadmap: `[x] Taktická mapa (grafika)`.

### 5. Bestiář — schémata
- [ ] **Zkontrolovat schémata** `tactical-map/schemas/<id>/token.json` **a** `bestie.json`. **Pokud chybí → vytvořit** (sekce + fields + `combatBehavior` damageable/armor-reducer/movement/initiative). Vzor: `schemas/matrix/token.json`.

### 6. Bestie — statblok na mapě
- [ ] **HTML prototyp** (`c:\tmp\<id>-bestie-audit.html`).
- [ ] **Rozhodnout:** generický schema engine (`BestiePanelView`) stačí, **nebo** Matrix-specific panel (vlastní mechanika — Matrix: HP odvozené `clamp(maxHP+zbroj−zranění)`, iniciativa sjednocená, autosave, pips+🎲). Pokud specific → `<Id>BestiePanel.tsx` + napojit v `TokenSystemSheet` bestie větvi (`world.system==='<id>'`).
- [ ] **Ověřit:** tsc · bestie testy (HP výpočet přes počet aktivních segmentů, ne křehký text) · build · eslint.
- [ ] Roadmap: `[x] Bestie (grafika)`.

### 7. Chat — propsání
- [ ] **Ověřit reuse:** chat rail běží na `DiaryTab → getDiaryPreset(system).SystemSheet`, takže přepsaný list **zdědí vzhled v chatu automaticky** (single source). Otevřít chat deník → potvrdit HUD/skin. *(Pozn.: chat = plný list, ne kompaktní combat panel — rozhodnutí 16.1a.)*
- [ ] Roadmap: `[x] Chat (→ 16.1)`.

### 8. Skiny — dotáhnout 7 stylů
- [ ] **Tokenizovat** sheet (`<id>.css`) na `--mx-*` tokeny (sci-fi defaulty v `:where([data-diary-system='<id>'])` = regrese-safe) + combat/bestie module brát tokeny **z předka**.
- [ ] Ověřit 7 skin sad (`diary-skins.css`) sedí i pro tento systém; doladit **per-systém ornamenty/specifika** (fantasy DrD ≠ fantasy Matrix).
- [ ] **Ověřit:** všech 7 skinů × (list + combat + bestie) vizuálně. tsc/build/testy.
- [ ] Roadmap: `[x] Skiny (→ 16.2c)`.

### 9. Uzávěr systému
- [ ] `funkce` (inventura) + `napoveda` (hráčský výtah) aktualizovat.
- [ ] `chybovy-denik` ✅ ŘEŠENÍ za systém (poučení/pasti).
- [ ] Roadmap matice: systém zaškrtnut na všech místech.

---

## Vzory z Matrixu (reference, co kopírovat)
| Místo | Soubory |
|---|---|
| Reálný list | `diary-systems/sheets/matrix/MatrixSheet.tsx` · `styles/matrix.css` · `constants.ts` |
| Combat panel | `token-panel/system-panels/MatrixCombatPanel.tsx` + `.module.css` · `combatPanels.ts` |
| Bestie | `token-panel/system-panels/MatrixBestiePanel.tsx` · napojení `TokenSystemSheet.tsx` (bestie větev) |
| Schémata | `tactical-map/schemas/matrix/token.json` + `bestie.json` |
| Skiny | `diary-systems/skins/{registry,useDiarySkin,DiarySkinSelector}.ts(x)` · `styles/diary-skins.css` |
| BE skin pole | `WorldMembership.diarySkin` (reuse `themeId` vzor) + endpoint `PUT members/me/theme` |
| Specs | `spec-16.2a-denik-matrix.md` · `spec-16.2c-skiny-deniku.md` |

---

## Checklist per systém (kopíruj na každý systém)

### Systém: `__________` (`id`)
- [ ] 0. Příprava (id/drift, deník existuje)
- [ ] 1. Stará verze (screenshot + zdroj sheetu)
- [ ] 2. Default skin přiřazen
- [ ] 3. Reálný list — prototyp → produkce → ověřeno → vizuál
- [ ] 4. Taktická mapa (combat panel) — prototyp → produkce → ověřeno → vizuál
- [ ] 5. Bestiář schémata (token.json + bestie.json) existují / vytvořeny
- [ ] 6. Bestie statblok — prototyp → produkce → ověřeno → vizuál
- [ ] 7. Chat — propsání ověřeno
- [ ] 8. Skiny — 7 stylů × 3 místa doladěno
- [ ] 9. Uzávěr (funkce + napoveda + deník + roadmap)

> **Pořadí systémů** (prioritně CZ příkop): matrix ✅ (pilot) → drd16 → drdplus → drd2 → jad → pi → drdh → dnd5e → shadowrun → gurps → fate → coc → vlastni.
