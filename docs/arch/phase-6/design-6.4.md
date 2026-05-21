# Design 6.4 — Custom emotes UI

**Status:** 🟡 Návrh k odsouhlasení
**Vstup:** [spec-6.4.md](spec-6.4.md)
**Datum:** 2026-05-21

> Cíl: dát třem novým UI artefaktům (PJ admin grid, Admin globální grid, composer picker) charakter, který nezní jako generic SaaS „icon gallery", ale jako součást **Ikaros synthwave světa** — kde Matrix rain padá za pozadím a každý glyf je malý artefakt.

---

## 0. Aesthetic direction

### Koncept — **Vitrína artefaktů**

Custom emote není „icon" ani „file". Je to **glyf světa** — sběratelský kus, který komunita světa nahrála a teď ho sdílí jako součást svého jazyka. Tomu odpovídá vizuál:

- **Karty jako relikvie** — fialový neonový rámeček, vnitřní glow při hover, ornament v rohu (drobná Ikaros runa).
- **Grid jako vitrína** — ne plochý uniformní grid, ale **karty na temném sametu** s vlastním podsvícením.
- **Upload není „drag here"** ale **kruhový sigil** — uživatel „aktivuje obřad" přidávání nového artefaktu.
- **Picker není „icon picker"** ale **svatyňka** — popover dělený neonovými lineary do tří „oltářů" (Tohoto světa / Globální / Statické).

### Tone vs. existující admin

Existující admin stránky v projektu jsou prosté (`PlatformAdminPage` = stub). Krok 6.4 ustanovuje **vzor** pro budoucí admin stránky ve světech (8.x postavy, 9.x kalendář, 11.x money) — proto investice do charakteru má smysl.

### Co NEdělat

- ❌ Žádné generic „icon gallery" s rovným gridem a Bootstrap shadows.
- ❌ Žádné Tailwind utility cluttering — všechny komponenty mají CSS Modules.
- ❌ Žádné emoji v UI textech (jen v UI prvcích, kde to dává smysl: `Plus`, `Trash2` z lucide-react). Akce mají lucide ikony, ne unicode emoji.
- ❌ Žádné generic „purple gradient" hladké přechody — Ikaros má `#a96cff` jako neonový **akcent**, ne jako wallpaper.
- ❌ Žádné rounded-2xl „card" prky — Ikaros je hranatý-techy (border-radius 4-6px max).

### Typography

| Použití | Font | Pozn. |
|---|---|---|
| Nadpisy stránek, modal title, sekce | **Orbitron** | Theme display font, neonový svit via existing `[data-theme='ikaros'] h1` |
| Body text, popisky, počítadla | **Rajdhani** | Theme body font |
| `:shortcode:` v kartách + picker tile labelech | **JetBrains Mono** | Nový — technický identifier, monospace, lehce méně bold než Orbitron |
| Tlačítka, chip akce | **Rajdhani 600** | Theme button standard |

⚠️ **JetBrains Mono** — pokud není v projektu (`Glob web fonts`), přidat přes Google Fonts `<link>` v `index.html` nebo lokálně. Fallback: `"JetBrains Mono", "Fira Code", ui-monospace, monospace`.

### Color tokens (z `ikarosTheme`)

```css
--theme-bg-primary:    #0c0820;          /* hluboká fialová noc */
--theme-surface:       rgba(20,12,44,0.74);
--theme-surface-soft:  rgba(38,24,72,0.48);
--theme-surface-strong: rgba(10,6,26,0.9);
--theme-border:        rgba(169,108,255,0.5);
--theme-border-soft:   rgba(169,108,255,0.26);
--theme-accent:        #a96cff;
--theme-accent-bright: #c9a4ff;
--theme-text:          #ece4ff;
--theme-text-muted:    #b3a6d4;
--theme-text-dim:      #6e6394;
--theme-glow:          rgba(169,108,255,0.42);

/* Nový v 6.4 — pouze v emote scope */
--emote-card-bg:       rgba(20,12,44,0.6);
--emote-card-bg-hover: rgba(38,24,72,0.72);
--emote-card-glow:     0 0 16px rgba(169,108,255,0.32);
--emote-card-glow-strong: 0 0 24px rgba(201,164,255,0.48);
--emote-tile-size-desktop: 96px;
--emote-tile-size-mobile:  80px;
```

### Motion

| Element | Animace | Trvání |
|---|---|---|
| Karta na mount | `opacity 0 → 1`, `translateY(8px) → 0` | 220 ms easeOut, stagger `60ms × index` (max 12 karet, ostatní bez staggeru) |
| Karta hover | `translateY(0 → -3px)`, `box-shadow` z subtle na strong | 180 ms easeOut |
| Karta delete | `scale 1 → 0.9 → 0`, opacity fade | 240 ms |
| Modal open | `opacity 0 → 1` + `scale 0.94 → 1` | 200 ms easeOut |
| Upload sigil hover/drag-over | `scale 1 → 1.04`, `box-shadow` pulse | infinite 1.6s easeInOut když drag-over |
| Picker emote tile hover | `background` fade + `box-shadow` glow | 120 ms |
| Counter „X / 100" tick | žádná animace (raw text) | — |

Vše respektuje `prefers-reduced-motion: reduce` — animace se redukují na čistý opacity fade (60 ms).

---

## 1. PJ admin per-svět — `/svet/:worldSlug/admin/emotes`

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ╔══════════════════════════════════════════════════════════╗       │
│  ║  CUSTOM EMOTY SVĚTA                                       ║       │
│  ║  ────────────────────────────                              ║       │
│  ║  Glyfy, které tvůj svět používá ve světovém chatu.        ║       │
│  ╚══════════════════════════════════════════════════════════╝       │
│                                                                      │
│  ╭─ 8 / 100 emotů ──────────────────────────────╮  ╭─ + Nový emote ╮│
│  │ ▰▰▰▰▰▰▰▰░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │  ╰───────────────╯│
│  ╰──────────────────────────────────────────────╯                   │
│                                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │   ◆    │ │   ◆    │ │   ◆    │ │   ◆    │ │   ◆    │ │   ◆    │ │
│  │ [img]  │ │ [img]  │ │ [img]  │ │ [img]  │ │ [img]  │ │ [img]  │ │
│  │        │ │        │ │        │ │        │ │        │ │        │ │
│  │:smile: │ │:heart: │ │:thx:   │ │:lol:   │ │:omg:   │ │:pog:   │ │
│  │ Smile  │ │  Heart │ │ Thanks │ │  LOL   │ │  OMG   │ │  Pog   │ │
│  │  🗑 ↪   │ │  🗑 ↪   │ │  🗑 ↪   │ │  🗑 ↪   │ │  🗑 ↪   │ │  🗑 ↪   │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
│                                                                      │
│  ┌────────┐ ┌ ─ ─ ─ ┐                                               │
│  │   ◆    │   ⊕      ← „upload tile" — vždy poslední, dashed border │
│  │ [img]  │   Nový                                                   │
│  │:next:  │ └ ─ ─ ─ ┘                                                │
│  │  Next  │                                                          │
│  │  🗑 ↪   │                                                          │
│  └────────┘                                                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Detaily

**Header**
- Žádný containing rectangle. Volně plovoucí title v Orbitronu, `font-size: 24px` desktop / 20px mobil. Pod titulem 1 px neonová horizontální linka (`background: linear-gradient(90deg, var(--theme-accent) 0%, transparent 60%)`).
- Subtext „Glyfy, které tvůj svět používá…" v Rajdhani, `text-muted`.

**Counter pás**
- Levá strana: progress bar — 8 segmentů z 100 vyplněných. Segment = 6×16px stejně vysoké dělené kostky, `gap: 1px`. Vyplněné = `var(--theme-accent)`, prázdné = `var(--theme-border-soft)`.
- Numerický popis: `8 / 100` v JetBrains Mono.
- Pravá strana: tlačítko „+ Nový emote" — pevný element, `border: 1px solid var(--theme-accent)`, neon glow na hover.

⚠️ Při ≥ 90% naplněnosti: progress bar mění barvu na `#ff9d3d` (oranžová) a v subtextu se objeví „Blížíš se limitu — zvaž úklid".

**Karta emote**
- Velikost: 140 × 180 px desktop. 120 × 160 mobil.
- Pozadí: `--emote-card-bg`.
- Border: 1 px `--theme-border-soft`, `border-radius: 6px`.
- Ornament v levém horním rohu: malý kosočtverec `◆` 6px × 6px, `color: var(--theme-accent-bright)`. (Sci-fi HUD vibe, ne dekorativní.)
- Obrázek: 96 × 96 px centrovaný, `image-rendering: pixelated` pokud zdrojový obrázek malý.
- `:shortcode:` v JetBrains Mono, `color: var(--theme-accent-bright)`, `font-size: 13px`.
- Name v Rajdhani, `text-muted`, `font-size: 12px`.
- Action row dole: `🗑` (Trash2 ikona) + `↪` (Copy ikona) z lucide-react. Skryté, opacity 0 → 1 na hover karty (touch: vždy opacity 0.6).
- Hover: `translateY(-3px)`, border zesílí na `--theme-border`, box-shadow `--emote-card-glow-strong`.

**Upload tile (poslední v gridu)**
- Stejná velikost jako karta. Dashed border `1px dashed var(--theme-border)`, transparent background.
- Velký `Plus` ikon (lucide) centrovaný, 32px, `color: var(--theme-accent)`.
- Pod: „Nový emote" v Rajdhani, `text-muted`.
- Klik = otevře upload modal.
- Hover: dashed → solid, glow.

📚 **Proč upload tile v gridu místo header buttonu?** Tlačítko v headeru zůstává (primární CTA). Ale na konci gridu je „přirozená" akce — když user vyplnil prvních 5 karet a chce další, nemusí scrollovat zpět nahoru. Dvojnásobná CTA, ne plýtvání.

### Empty state

Pokud svět nemá žádné emoty:

```
┌──────────────────────────────────────────────────────────────────────┐
│  CUSTOM EMOTY SVĚTA                                                  │
│  ────────────────────                                                │
│                                                                      │
│           ╭─────────────────────╮                                    │
│           │                     │                                    │
│           │       ◇             │ ← velký neonový kosočtverec       │
│           │     prázdná         │                                    │
│           │     vitrína         │                                    │
│           │                     │                                    │
│           ╰─────────────────────╯                                    │
│                                                                      │
│      Tento svět zatím nemá žádné vlastní emoty.                      │
│      Začni s prvním — třeba maskot nebo logo tvé komunity.           │
│                                                                      │
│              [ + Nahrát první emote ]                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- Velký kosočtverec 80px, `color: var(--theme-accent)`, `opacity: 0.4`, pomalá pulse animace (`opacity 0.4 → 0.6 → 0.4`, 3s).
- CTA je sám o sobě (žádný „nový emote" v headeru — když nic není, header counter taky chybí).

---

## 2. Upload modal — „Sigil obřad"

### Layout

```
┌────────────────────────────────────────────────┐
│  ◆ ─────────────────────────────────────  ✕   │ ← decorative neon line + Close
│                                                │
│     NOVÝ EMOTE                                 │ ← Orbitron 18px, neon glow
│     ─────────                                  │
│                                                │
│         ╭───────────────────╮                  │
│         │                   │                  │
│         │       ◯           │ ← „sigil" upload target
│         │    Drag-drop      │   80px kruh + glow
│         │    nebo klikni    │                  │
│         │                   │                  │
│         ╰───────────────────╯                  │
│                                                │
│         PNG · JPG · GIF · WebP                 │ ← chip badges
│         max 512 KB                             │
│                                                │
│   ──────────────────────────────────────────   │ ← divider (neon fade)
│                                                │
│   SHORTCODE                                    │ ← Orbitron 11px uppercase
│   ┌─────────────────────────────────────┐     │
│   │ :  smile___________________________ : │   │ ← inline „:" tokens v mono
│   └─────────────────────────────────────┘     │
│   a–z · 0–9 · _ · 2 až 32 znaků                │ ← Rajdhani text-dim
│                                                │
│   NÁZEV                                        │
│   ┌─────────────────────────────────────┐     │
│   │  Smile                              │     │
│   └─────────────────────────────────────┘     │
│                                                │
│   ─────────────────────────────────────────   │
│                                                │
│                     [Zrušit]  [Nahrát emote]  │ ← right-aligned actions
│                                                │
│ ◆ ─────────────────────────────────────  ◆    │ ← decorative footer corners
└────────────────────────────────────────────────┘
```

### Detaily

**Modal frame**
- `max-width: 480px`, `min-height: 540px` (fixed kvůli klidnému layoutu).
- Background: `var(--theme-surface-strong)` (skoro neprůhledný).
- Border: 1 px `var(--theme-border)`.
- `border-radius: 8px`.
- Box-shadow: `0 12px 60px rgba(0,0,0,0.6), 0 0 80px rgba(169,108,255,0.16)` (vrstvený — temný + fialový halo).
- Backdrop: `backdrop-filter: blur(8px)` na pozadí (Matrix rain zůstane vidět ale rozmazaný).

**Decorative corners**
- 4 rohy modalu mají drobné kosočtverce `◆` (4px × 4px), `color: var(--theme-accent)`.
- 1 px neonové linky pod headerem a před akcemi: `linear-gradient(90deg, var(--theme-accent) 0%, transparent 80%)`.

**Sigil — upload target**
- 80px kruh, `border: 2px solid var(--theme-border)`, `border-radius: 50%`.
- Inner background: `radial-gradient(circle, rgba(169,108,255,0.16) 0%, transparent 70%)`.
- Centrální ikona: `UploadCloud` lucide, 32px, `color: var(--theme-accent-bright)`.
- Text pod kruhem v Rajdhani: „Drag-drop nebo klikni", `text-muted`.

**Drag-over stav**
- `border-color: var(--theme-accent-bright)`.
- `box-shadow: 0 0 24px var(--theme-glow)`.
- Pulse animace na `box-shadow` infinite 1.6s.
- Inner radial gradient zesiluje na `rgba(169,108,255,0.32)`.

**Po zvolení souboru (preview state)**
- Sigil se „transformuje" — kruh zůstane, ale uvnitř místo `UploadCloud` ikony je **náhled obrázku** ořezaný do kruhu, scale aby vyplnil.
- Pod sigil text: `[soubor.png · 14 KB]` v JetBrains Mono + drobné `✕` zrušit volbu (vrátí se k drop targetu).
- Animace transformace: `scale 0.8 → 1` + fade 200ms.

**Shortcode input**
- Pseudo-tokenized vstup: `:` na začátku a konci jsou **non-editable** v `JetBrains Mono`, `color: var(--theme-accent-bright)`.
- Editable middle část je standard input, taky JetBrains Mono.
- Border bottom only: `border: none; border-bottom: 1px solid var(--theme-border-soft)`.
- Focus: bottom border tlustší + glow.
- Live validace: pokud invalid (regex fail) → border-color: `#ff5d5d`, pod inputem error message v `#ff9d9d`.

**Název input**
- Standard text input, Rajdhani.
- `border: 1px solid var(--theme-border-soft)`, `background: var(--theme-surface-soft)`.

**Tlačítka**
- „Zrušit" — ghost variant, `border: 1px solid var(--theme-border-soft)`, transparent bg.
- „Nahrát emote" — primary, `background: var(--theme-accent)`, `color: var(--theme-text-on-accent)`, **Orbitron** 13px uppercase, letter-spacing 0.08em. Disabled stav `opacity: 0.4` + cursor not-allowed dokud není soubor + shortcode + name vyplněn.
- Loading stav po kliknutí: text zmizí, malý spinner v `text-on-accent` barvě, button stays disabled.

### Submit flow

1. User vybere soubor → `validateEmoteFile(file)` → ✓ → sigil ukazuje preview, fields enable.
2. User píše shortcode → live regex check.
3. User klikne „Nahrát emote".
4. FE: `useUploadImage(file)` → `{ publicId }`.
5. FE: `useCreateEmote({ shortcode, name, imageId: publicId })`.
6. Optimistic insert do grid cache.
7. Modal zavře s 200ms fade.
8. Karta v gridu fade-in s drobným „arrival glow" (extra box-shadow pulse 800ms).

### Error stavy

- **Validace souboru failed** → toast „Soubor musí být PNG/JPG/GIF/WebP do 512 KB" + sigil zatřese (3 frames).
- **BE 409 EMOTE_SHORTCODE_TAKEN** → shortcode input border červený + error text „Tenhle shortcode už ve světě existuje".
- **BE 409 EMOTE_LIMIT_REACHED** → toast „Svět dosáhl limitu 100 emotů. Smaž nepoužívané." + modal nezavře.

---

## 3. Admin globální — `/ikaros/admin/emotes`

### Layout

Analogický k §1, s těmito rozdíly:

- Header text: **„GLOBÁLNÍ EMOTY PLATFORMY"** v Orbitronu.
- Subtext: „Glyfy dostupné napříč všemi světy Ikarosu. Sprav s rozvahou."
- Counter: 200 max.
- Karty **nemají** `↪ Kopírovat` ikonu (globální už je všude).
- Karty **mají** drobný ornament: vlevo dole `★` (Star ikona lucide, 8px, `color: var(--theme-accent-bright)`) — vizuální differentiator od per-svět karet.
- Background okolo gridu: jemně světlejší tón `rgba(20,12,44,0.4)` → naznačuje „elevated context" (globální = platform-level).
- Nav vstup: v `IkarosLayout` levý nav položka „Emoty" pod „Uživatelé", ikona `Sparkles` lucide (16px). Viditelná jen `UserRole.Admin+`.

---

## 4. Composer picker — „Svatyňka tří oltářů"

### Layout

```
┌────────────────────────────────────────┐
│ ◆ ─────────────────────────────── ✕   │
│                                        │
│   🔍 [_______________________]         │ ← search input
│                                        │
│   ╭─ TOHOTO SVĚTA · 8 ─────────────╮  │ ← section header
│   │ ⬚ ⬚ ⬚ ⬚ ⬚ ⬚ ⬚ ⬚              │  │ ← tile grid 8/row desktop
│   │ ⬚                              │  │
│   ╰────────────────────────────────╯  │
│                                        │
│   ╭─ GLOBÁLNÍ · 12 ────────────────╮  │
│   │ ⬚ ⬚ ⬚ ⬚ ⬚ ⬚ ⬚ ⬚              │  │
│   │ ⬚ ⬚ ⬚ ⬚                       │  │
│   ╰────────────────────────────────╯  │
│                                        │
│   ╭─ STATICKÉ · 16 ────────────────╮  │
│   │ 😊 😂 ❤ 👍 🎉 🔥 💡 ⭐         │  │
│   │ ... ...                        │  │
│   ╰────────────────────────────────╯  │
│                                        │
└────────────────────────────────────────┘
```

### Detaily

**Popover frame**
- Desktop: `width: 360px`, `max-height: 480px`, anchored above 😊 button v composeru.
- Mobil: bottom-sheet, `width: 100vw`, `max-height: 60vh`, slide-up animace 220 ms.
- Background: `var(--theme-surface-strong)`.
- Border: 1 px `var(--theme-border)`.
- `border-radius: 8px desktop` / `border-radius: 12px 12px 0 0 mobile`.
- Box-shadow: `0 -8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(169,108,255,0.12)`.

**Decorative neon header line**
- `◆ ────── ✕` — kosočtverec vlevo, neon linka, close vpravo.

**Search input**
- 36px výška, `background: var(--theme-surface-soft)`, `border-radius: 4px`.
- Ikona `Search` lucide 14px vlevo.
- Placeholder „Hledat glyf…" v Rajdhani `text-dim`.
- Focus: border-bottom glow.

**Sekce header**
- Orbitron 11px, uppercase, letter-spacing 0.1em.
- Counter v JetBrains Mono `text-muted`.
- 1 px neon underline pod headerem (fade z `--theme-accent` do transparent).

**Emote tile**
- 36 × 36 px desktop, 32 × 32 mobil.
- Background hover: `var(--emote-card-bg-hover)`.
- Border-radius: 4px.
- Klik vloží `:shortcode:` do composer textarea.
- Tooltip on hover (delay 600ms): `:shortcode: — Name` (přes existující tooltip primitive nebo `title` atribut).
- Grid: `repeat(auto-fill, minmax(36px, 1fr))` s `gap: 4px`.

**Search filter behavior**
- Match case-insensitive v `shortcode` OR `name`.
- Bez výsledků v sekci → sekce schovaná.
- Bez výsledků nikde → empty state „Nic neodpovídá".

**Statické sekce** (existující `EMOTES` z fáze 4)
- Reuse existující rendering — Unicode emoji, ne `<img>`. Stejná velikost tile, ale obsah text.

**Section collapse (volitelné)**
- Klik na header → collapse/expand té sekce. Pamatuje stav v `localStorage` (`ikaros.emotePicker.collapsed: { world: false, global: false, static: true }`).
- Default: všechny expanded. Po prvním collapse se preference uloží.

📚 **Proč „svatyňka tří oltářů"?** Tři sekce nejsou „tabs" (uživatel chce vidět najednou jaké glyfy má). Nejsou ani „flat grid" (smíchaly by se per-world s globálními a uživatel by nevěděl co odkud). Vertikální sekce s headery = nejsou kompromis, ale autentický UX vzor (Discord, Slack to dělá podobně, ale my dáme synthwave kabát).

---

## 5. Responsive breakpointy

| Element | Mobil (≤ 768) | Tablet (769–1024) | Desktop (> 1024) |
|---|---|---|---|
| Admin grid sloupce | 2 | 4 | 6–8 (`auto-fill, minmax(140px, 1fr)`) |
| Karta size | 120 × 160 | 130 × 170 | 140 × 180 |
| Karta image | 80×80 | 88×88 | 96×96 |
| Upload modal | full-screen | centered 90vw max 480 | centered 480 |
| Picker | bottom-sheet | popover 320 | popover 360 |
| Picker tiles per row | 6 | 7 | 8 |
| Tile size | 32×32 | 34×34 | 36×36 |
| Header font | 20px | 22px | 24px |

Touch terče ≥ 44 px — kartové action ikony (🗑 ↪) mají invisible expand `padding: 8px` aby tappable area byla 28px ikona + 16px padding = 44px.

---

## 6. Accessibility

- Všechny obrázky emote v `<img alt=":shortcode:">` — screenreader přečte shortcode.
- Upload sigil: `<button type="button" aria-label="Nahrát obrázek emote">`.
- Karta: `<article aria-label="Emote :smile: — Smile">` s tooltipem.
- Picker tile: `<button aria-label="Vložit :smile:" title=":smile: — Smile">`.
- Search: `<input role="searchbox" aria-label="Hledat emote">`.
- Counter „8 / 100": `<span aria-live="polite">` aby SR oznámil změnu.
- Delete confirm dialog: focus trap, ESC closes.
- Modal: `<dialog>` element nebo `role="dialog" aria-modal="true"`, focus na sigil při open.
- Reduced motion: všechny `@keyframes` s `prefers-reduced-motion: reduce` redukovány na opacity-only.

---

## 7. Co tato design vize **NEpokrývá** (a proč)

- **Konkrétní CSS hodnoty pixel-perfect** — toto je vize, ne styleguide. Konkrétní hodnoty doladí implementační plán + iterace.
- **Dark/light theme switch v admin** — Ikaros je dark-only. Future themes (5.7+) si poradí samy přes `--theme-*` proměnné.
- **Drag-reorder karet** — není v rozsahu 6.4 (řazení = `createdAt desc`).
- **Inline edit shortcode v kartě** — není v rozsahu 6.4 (re-create stačí).
- **Bulk delete checkbox** — není v rozsahu 6.4 (max 100 karet = manageable manually).

---

**Po schválení tohoto designu:**
Sepíšu `plan-6.4.md` se zachycením všech UI rozhodnutí + konkrétní implementační kroky (BE doplňky → FE API → render → admin page → picker → WS sync → testy → mobil-desktop audit → napoveda).
