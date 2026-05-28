# Plan 10.2c-edit-9g — Token info panel (side dock / drag / overlay) s per-system deníkem

**Status:** ✅ schváleno uživatelem 2026-05-28
**Velikost:** **L** (5 fází, postupný rollout, ~12 souborů)

## Motivace

Modal token sheet (`TokenStatbarModal` z 9b/9c) byl chyba. Old Matrix
(`MapPage.tsx:255-256, CharacterDiary.tsx:60-70`) má **3-mode side panel**:
- `dock` — fixed right, default ~420px wide, resize handle
- `drag` — absolute, draggable přes header, position v localStorage
- `overlay` — centered (mobile force)

Mode toggle `📌`/`🪟` v headeru. Persisted v localStorage `ikr-diary-mode`.

Plus deník **musí mít interaktivní rolly**:
- Klik dovednost → roll formula → výsledek do chatu (přes existing dice tray)
- + INICIATIVA button → roll → auto-update tokenu
- Propojené staty (token.HP ↔ character.diary.matrix_health)

## Fáze

| # | Co | Soubory | Velikost |
|---|---|---|---|
| **A** | `TokenInfoPanel` — 3-mode container, header (avatar + jméno + Body osudu + Odstranit + mode toggle), persist position/mode, resize handle | nový `TokenInfoPanel.tsx` + CSS, `usePanelMode.ts` hook | M |
| **B** | TokenStatbarModal → TokenInfoPanel switch v TacticalMapView. Embed MatrixSheet (existing) přes wrapper `TokenSystemSheet` | refactor TacticalMapView, smazat TokenStatbarModal | S |
| **C** | `SystemSheetProps.onRoll?: (label, formula, breakdown) => void`. MatrixSheet: schopnosti/aspekty/+INICIATIVA jako klikatelné buttony s onRoll callback | rozšíření SystemSheetProps + MatrixSheet úpravy | M |
| **D** | `onRoll` → emit přes existing `DicePickerPopover` payload → BE chat dice message (stejně jako ChannelComposer.sendDiceRoll) | TacticalMapView integration | S |
| **E** | Propojené staty: token.update ↔ character.diary patch bidirectional. Změna ŽIVOTY v deníku → token.update {currentHp}. Změna z combat tracker → diary patch. | useTokenUpdate rozšíření, MatrixSheet vitals patches token | M |
| **F+** | Ostatní systémy (Drd2/Coc/Dnd/Fate/Gurps/...) postupně dostávají onRoll handlers | per-system sheets | L (rozprostřeno) |

## Architektura

```
src/features/world/tactical-map/
├─ components/
│  └─ token-panel/
│     ├─ TokenInfoPanel.tsx          # 3-mode container (NEW)
│     ├─ TokenInfoPanel.module.css
│     ├─ PanelHeader.tsx             # avatar + jméno + Body osudu + actions
│     ├─ PanelModeToggle.tsx         # 📌 dock / 🪟 drag / 🗖 overlay
│     ├─ PanelResizeHandle.tsx       # drag levou hranu pro resize
│     └─ TokenSystemSheet.tsx        # wrapper embed MatrixSheet/Drd2Sheet/...
└─ hooks/
   ├─ usePanelMode.ts                # mode state + localStorage persistence
   └─ usePanelPosition.ts            # drag position state (jen drag mode)
```

LocalStorage klíče (mirror Matrix):
- `ikr-token-panel-mode` (`dock` / `drag` / `overlay`)
- `ikr-token-panel-pos` (`{x, y}` pro drag mode)
- `ikr-token-panel-width` (number, jen dock mode)

## Bezpečnost / scope

- View permissions zůstávají z 9b (PJ / owner / limited) — limited mode = jen Body osudu + Životy % bez plného sheet
- `onRoll` autorizace: kdokoli kdo vidí sheet může rollovat (klient-side; BE už autorizuje dice via chat channel access)

## Out of scope

- Combat tracker (10.2f)
- Initiative tracker top bar (10.2 future)
- Multi-player concurrent panel sync (jeden user otevře dva instance pro různé tokeny — defer)

## Real-time

- Roll → existing dice chat pipeline (✓ funguje)
- Token.update → existing WS broadcast (✓ funguje)
- character.diary.update → ❌ žádný WS broadcast (defer 10.2i)
