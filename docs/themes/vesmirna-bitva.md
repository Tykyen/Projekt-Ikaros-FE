# Téma: Vesmírná bitva

**ID:** `vesmirna-bitva`  
**Referenční obrázek:** [assets/vesmirna-bitva.png](assets/vesmirna-bitva.png)

---

## Atmosféra

Loď je pod útokem. Masivní vesmírné bitevní lodě, laserové paprsky, exploze, trosky. Vše je v bojové pohotovosti — červená barva záplavy, varovné systémy, alert panely. Uživatel je uprostřed vesmírné války. Každý prvek UI dýchá krizí a naléhavostí.

Klíčový rozdíl od Vesmírné lodi: **Vesmírná loď = připraveni, dokováno. Vesmírná bitva = ÚTOK PRÁVĚ PROBÍHÁ.**

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#050305` | Hlavní pozadí — absolutní čerň |
| `--bg-secondary` | `#0a0508` | Sidebary — bojová tma |
| `--bg-card` | `#0f0508` | Karty — temně červená čerň |
| `--bg-card-hover` | `#150810` | Hover stav karet |
| `--accent-red` | `#c01818` | Primární bojová červená |
| `--accent-red-bright` | `#e02020` | Hover červená, alert |
| `--accent-red-glow` | `#ff3030` | Červený glow — alarm stav |
| `--accent-red-dim` | `#600808` | Tlumená červená — bordury |
| `--accent-orange-exp` | `#e05010` | Oranžová exploze — background detail |
| `--text-primary` | `#e0c0c0` | Hlavní text — studená načervenalá bílá |
| `--text-secondary` | `#804040` | Sekundární text — temně červená |
| `--text-alert` | `#ff4040` | Alert text — maximální červená |
| `--text-muted` | `#402020` | Vypnuté prvky |
| `--border-red` | `#c0181840` | Červené bordury (průhledné) |
| `--border-red-strong` | `#c01818` | Aktivní bojové bordury |
| `--border-subtle` | `#150808` | Jemné oddělovače |

---

## Unikátní UI prvky (jen toto téma)

### Alert panel (pravý sidebar)
```
┌─────────────────┐
│  ⚠ ALERT        │
│  STANICE POD    │
│  ÚTOKEM         │
│  PRIORITA 1     │
└─────────────────┘
```
- Červený blikající border (`@keyframes blink`)
- Červený pulsující background
- Vždy viditelný v pravém panelu

### Spodní status bar
```
⚠ VŠECHNY SYSTÉMY V POHOTOVOSTI ⚠
```
- Fixní na spodním okraji obrazovky
- Červená, uppercase, warning ikony po stranách

### Zaměřovací kříž (bottom center)
- Kruhový targeting reticle — dekorativní SVG
- Rotuje pomalu (`@keyframes rotate`)
- Červená barva, průhledný overlay

---

## Tlačítka (3D efekt)

Vojenský HUD styl, čistě červená na černé. Úderný, agresivní.

```
Tvar:      border-radius: 0 — přísně pravoúhlé (bojové)
Normální:  černý bg + červená bordura + červený spodní glow
Hover:     červený glow roste (0 0 15px #c01818) + translateY(-2px) + bg červení
Active:    translateY(2px) + glow zesláblý — jako stisknutí bojového tlačítka
Primární:  tmavě červený gradient + silná červená bordura
Aktivní nav: červený left-border (4px) + červený text + pulsující glow
```

---

## Dekorativní prvky

- **L-bracket rohy:** Jako Vesmírná loď, ale červené místo cyan
- **Battle damage:** Subtilní scratchy/diagonal marks na panelech (CSS nebo SVG overlay)
- **Radar/targeting:** Kruhový reticle dole — rotující SVG animation
- **Scan lines:** Červené jemné horizontal lines přes panely (CRT bojový display)
- **Explosion background:** Background-image — masivní vesmírná bitva s explozemi
- **Pulsující bordury:** Alert stav — `@keyframes pulse-border` na červených prvcích

---

## Typografie

- **Logo:** Orbitron ExtraBold nebo Russo One — agresivní, militaristický
- **Nadpisy:** Rajdhani Bold — kompaktní, bojový
- **Navigace:** Uppercase, letter-spacing 3px, sans-serif
- **Text:** Roboto Condensed — rychle čitelný i pod stresem
- **Admin kurzíva:** Červená italic — nečekaně poetické uprostřed chaosu
- **Alert text:** Uppercase, bold, červená — maximální urgence

---

## Rozdíly od Sci-fi a Vesmírné lodi

| Vlastnost | Sci-fi | Vesmírná loď | Vesmírná bitva |
|-----------|--------|-------------|----------------|
| Primární barva | Cyan | Cyan | Červená |
| Sekundární | Magenta | Amber | — (čistě červená) |
| Situace | Civilní provoz | Vojenský dok | Aktivní útok |
| Unikátní UI | Hologram | — | Alert panel + status bar |
| Atmosféra | High-tech | Průmyslová | Krize/urgence |
| Rohy | Chamfer | L-bracket | L-bracket (červené) |

---

## Poznámky pro implementaci

- Alert panel: dedikovaná komponenta `<BattleAlert />` viditelná jen v tomto tématu
- Status bar: `position: fixed; bottom: 0` — červený pruh přes celou šířku
- Blink animace: `@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }`
- Targeting SVG: absolutně pozicovaný, `pointer-events: none`, `z-index: 0`
- `border-radius: 0` globálně pro toto téma — žádné zaoblené rohy
- Červený glow: `box-shadow: 0 0 20px #c0181860` na aktivních prvcích
- Background exploze: `background-image` s opacity overlay pro čitelnost textu
