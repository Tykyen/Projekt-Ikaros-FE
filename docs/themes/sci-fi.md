# Téma: Sci-fi

**ID:** `sci-fi`  
**Referenční obrázek:** [assets/sci-fi.png](assets/sci-fi.png)

---

## Atmosféra

Pohled z interiéru futuristické vesmírné stanice. Za oknem planety, vesmírné lodě, vzdálené město. Uvnitř holografické displeje, tech furniture, neonové světlo. Pocit high-tech budoucnosti — funkční, precizní, studené. Člověk je součástí stroje, stroj je součástí vesmíru.

Klíčový rozdíl od předchozích: **žádná fantasy, žádné zlato** — čistá technologie a neon.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#080c14` | Hlavní pozadí — temná ocelová čerň |
| `--bg-secondary` | `#0c1220` | Sidebary, panely |
| `--bg-card` | `#0f1628` | Karty, modaly |
| `--bg-card-hover` | `#141e32` | Hover stav karet |
| `--accent-cyan` | `#00c8ff` | Primární cyan — tech bordury, ikony, aktivní prvky |
| `--accent-cyan-glow` | `#40d8ff` | Glow efekty, hover |
| `--accent-cyan-dim` | `#006888` | Tlumená cyan, sekundární bordury |
| `--accent-magenta` | `#c020e0` | Sekundární neon — pink/fialová, akcenty |
| `--accent-magenta-glow` | `#e040ff` | Magenta glow |
| `--text-primary` | `#d0e8ff` | Hlavní text — studená modrá bílá |
| `--text-secondary` | `#5090b0` | Sekundární text |
| `--text-muted` | `#2a4060` | Vypnuté prvky |
| `--border-cyan` | `#00c8ff50` | Cyan bordury (průhledné) |
| `--border-cyan-strong` | `#00c8ff` | Aktivní cyan bordury |
| `--border-subtle` | `#0f2030` | Jemné oddělovače |

---

## Tlačítka (3D efekt)

Zkosené rohy (clip-path), neon glow, HUD styl. Žádné zaoblené rohy — vše je angulární.

```
Tvar:      clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)
           (zkosené levý-horní a pravý-dolní roh — sci-fi chamfer)
Normální:  tmavý bg + cyan bordura + slabý cyan box-shadow
Hover:     cyan glow roste (0 0 15px #00c8ff) + translateY(-2px) + bg zesvětlí
Active:    translateY(1px) + glow zesláblý
Primární:  cyan gradient uvnitř (tmavý → cyan zleva)
Aktivní nav: cyan left-border (3px) + cyan text + scan-line animace
```

---

## Dekorativní prvky

- **Rohové rohy:** Tech HUD rohy — tenké L-shape linky v rozích (ne ornamentální, funkční)
- **Zkosené bordury:** Všechny panely mají chamfered corners (45° ořez)
- **Holografický diagram:** Pravý panel — modrý star map / solární systém (rotující kroužky)
- **Scan lines:** Jemné horizontální linky přes panely (opacity 0.03) — CRT efekt
- **Neon odraz:** Růžový neon glow dole vlevo (prostředí stanice)
- **HUD readouts:** Drobné tech texty v rozích karet (koordináty, ID systémů — decorativní)
- **Logo frame:** Hexagonální rámeček okolo ikony Ikarose místo kruhového

---

## Typografie

- **Logo:** Orbitron nebo Exo 2 — čistý tech sans-serif, uppercase, NO cursive
- **Nadpisy:** Rajdhani nebo Exo 2 — techy, bold
- **Navigace:** Uppercase, letter-spacing 2px, monospace feel
- **Text:** Inter nebo Roboto — čistý, funkční
- **Admin kurzíva:** Monospace (`font-family: monospace`) + cyan barva — jako terminál

---

## Rozdíly od předchozích témat

| Vlastnost | Modré nebe | Zlatý standard | Sci-fi |
|-----------|-----------|----------------|--------|
| Akcent 1 | Zlatá | Zlatá | Cyan |
| Akcent 2 | Modrá | — | Magenta/fialová |
| Rohy | Zaoblené + ornament | Zaoblené + ornament | Zkosené (chamfer) |
| Font | Serif cursive | Serif | Sans-serif tech |
| Dekor | Zlaté ornamenty | Zlaté ornamenty + orrery | HUD linky + star map |
| Glow | Teplý zlatý | Teplý zlatý | Studený neon |
| Prostředí | Kosmický exteriér | Kosmický exteriér | Interiér stanice |

---

## Poznámky pro implementaci

- `clip-path` na panelech a tlačítkách pro chamfered corners
- Logo ikona Ikarose v hexagonálním framu (`clip-path: polygon(...)`)
- Pravý panel: rotující holografický SVG diagram (CSS animation)
- Scan-line efekt: `repeating-linear-gradient` přes panely
- Neon glow: `box-shadow: 0 0 20px var(--accent-cyan)` na aktivních prvcích
- Background: tmavý interiér + velké okno s vesmírnou scénou (background-image)
