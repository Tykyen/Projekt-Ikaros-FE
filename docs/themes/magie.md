# Téma: Magie a kouzla

**ID:** `magie`  
**Referenční obrázek:** [assets/magie.png](assets/magie.png)

---

## Atmosféra

Kouzelníkova sanctum v srdci temné gotické věže. Arcana kruhy, levitující krystaly, rohatý grimoire otevřený na kletbě, plášťem zahaleý mág pozorující hvězdy. Purpurová obloha s aurory, zlaté dekorativní bordury jako runy, fialové astrální energie. Projekt Ikaros jako magická akademie — záhadná, vznešená, nevyzpytatelná. Zlato jako magický materiál, fialová jako astrální síla.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#060410` | Hlavní pozadí — hluboká magická tma |
| `--bg-secondary` | `#0c0618` | Sidebary — temná fialová noc |
| `--bg-card` | `#100820` | Karty — astrální tma |
| `--bg-card-hover` | `#160c2c` | Hover stav karet |
| `--accent-gold` | `#c8900a` | Primární zlatá — bordury, ikony, ornament |
| `--accent-gold-bright` | `#e8b020` | Hover zlatá, glow |
| `--accent-gold-dim` | `#604808` | Tlumená zlatá — subtilní bordury |
| `--accent-purple` | `#8020d0` | Primární fialová — krystalový glow, aktivní prvky |
| `--accent-purple-bright` | `#a040e8` | Světlá fialová — glow exploduje |
| `--accent-purple-dim` | `#401080` | Tmavá fialová — bordury |
| `--accent-arcane` | `#c030a0` | Magenta/arcane — vrcholky krystalů, speciální prvky |
| `--accent-teal` | `#20a8d0` | Tyrkysová — "Projekt Ikaros" text, cyan orby |
| `--text-primary` | `#e0d0f8` | Hlavní text — světlá levandulová |
| `--text-secondary` | `#806090` | Sekundární text — tlumená fialová |
| `--text-muted` | `#302040` | Vypnuté prvky |
| `--border-gold` | `#c8900a50` | Zlatá bordura (průhledná) |
| `--border-gold-strong` | `#c8900a` | Silná zlatá bordura — panely |
| `--border-purple` | `#8020d040` | Fialová bordura (průhledná) |

> **Dominantní fialová s zlatem:** Fialová = astrální magie. Zlatá = artefakty, ornament. Tyrkys = speciální texty. Žádná šedá ani neutrální.

---

## Tlačítka (3D efekt)

Zlatem lemovaný magický artefakt. Elegantní, arcane, vznešený.

```
Tvar:      border-radius: 4px — mírně zaoblené
           Zlaté diamantové ornamenry v rozích (◆ ::before/::after)
Normální:  tmavý fialový gradient + zlatá bordura + temný stín
Hover:     fialový krystalový glow (0 0 16px #8020d0) + translateY(-2px) + bordura zesvětlí
Active:    translateY(2px) — magická resonance
Primární:  tmavý gradient + silná zlatá bordura + ◆ ornament
Aktivní nav: zlatý bg + tmavý text + ◆ vlevo svítí zlatě
```

---

## Dekorativní prvky

- **◆ Diamantové ornamenry:** Zlaté diamanty v rozích panelů + mezi sekcemi jako oddělovače — charakteristický prvek celého tématu
- **Arcane kruh:** Svítící mystický kruh/astroláb v background scéně — pomalu rotuje `@keyframes spin { 360deg / 60s }`
- **Krystalový obelisk:** Velká purpurová krystalová věž vpravo dole — `filter: drop-shadow(0 0 20px #8020d0)`
- **Plovoucí krystaly:** Malé svítící krystaly rozptýlené kolem scény (background-image detail)
- **Plášťem zahaleý mág:** Silueta kouzelníka s glowing orb v background scéně
- **Otevřený grimoire:** Kniha kouzel v background scéně s zářícím textem
- **Svíčky:** Zlatě tónované svíčky v background scéně (neanimované)
- **Logo kruh:** Tmavě fialový kruh s zlatým arcane ornamentálním prstencem — runové symboly podél okraje
- **Logo bird:** Bílý/levandulový Ikaros ptáček — `filter: drop-shadow(0 0 10px #a040e8)`
- **Aurory:** Purpurovo-modré astrální záře v background nebi (CSS gradient overlay)

---

## Typografie

- **Logo:** Fantasy script — Cinzel Decorative nebo MedievalSharp — kurzívní, vznešený
- **"Projekt Ikaros" v logu:** Zlatá kaligrafická kurzíva — `font-style: italic`
- **Nadpisy:** Cinzel nebo IM Fell English — historický, magický
- **Navigace:** Uppercase, letter-spacing 2px, serif — jako arcane nápisy
- **Text:** Lora nebo EB Garamond — čitelný, mystický
- **Admin kurzíva:** Tyrkysová italic — jako psaní magickým inkoustem
- **"Projekt Ikaros" v textu:** Tyrkysová (`--accent-teal`)

---

## Rozdíly od ostatních témat

| Vlastnost | Zlatý standard | Arabský svět | Magie |
|-----------|---------------|-------------|-------|
| Zlatá | Dominantní, čistá | Arabesque | Arcane ornament |
| Sekundární | Žádná | Tyrkysová | Fialová (dominant) |
| Prostředí | Astronomický přístroj | Mešita, koberec | Gotická věž, grimoire |
| Ikony nav | Zlaté standardní | Zlaté orientální | Barevné magické orby |
| Pozadí karet | Čistá čerň | Hluboká tyrkys | Astrální tma |
| Dekor | Orrery | Pointed arch | Krystal, arcane kruh |
| Pocit | Luxus, prestiž | Orient, tajemství | Arcane, nadpřirozeno |

---

## Poznámky pro implementaci

- ◆ Diamant ornament: CSS `clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)` — malý 8px gold element
- Arcane kruh rotation: `@keyframes arcane-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }` — `animation: arcane-spin 60s linear infinite`
- Krystal glow: `filter: drop-shadow(0 0 15px #8020d0) drop-shadow(0 0 30px #a040e8)` — vrstvený glow
- Logo kurzíva: `font-family: 'Cinzel Decorative'; font-style: italic; color: var(--accent-gold-bright)`
- Plovoucí krystal animace (drobné): `@keyframes float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }` — každý jiný delay
- Aurory v bg: `background: radial-gradient(ellipse at 30% 20%, #8020d030, transparent), radial-gradient(ellipse at 70% 10%, #20a8d020, transparent)`
- Nav ikony: každá má jinou barvu (teal, purple, magenta, gold) — nejednotný ale záměrný chaos magiky
- Celkový vibe: `backdrop-filter: blur(1px)` na panelech — jako kouzelná mlha
