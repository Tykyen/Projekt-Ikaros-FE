# Spec + Plan 1.0v — Měsíc visual upgrade

**Datum:** 2026-05-12
**Status:** 🟡 ke schválení
**Skin:** `mesic` (Měsíc)
**Branch:** `main` (direct commit, vzorem 1.0u magie)
**Scope:** `[data-theme="mesic"]` — žádný globální dopad

---

## 1. Koncept

> **„Lunární pohádková zahrada — refined wedding-under-moonlight elegance"**

Dědí magie 1.0u glassmorphic btn3d pattern, ale **klidnější**: žádné rotace v centerpiece (nebo 2× pomalejší než magie), žádný iridescent shift, žádné comety. Calm contemplative refinement. Silver+cobalt+pearl, NE ametyst.

---

## 2. Palette (z dodaných assetů)

| Token | Barva | Role |
|---|---|---|
| `--mesic-night-cobalt` | `#0a1430` | BG base |
| `--mesic-velvet-night` | `#13183a` | Surface |
| `--mesic-royal-night` | `#1d2552` | Surface lift |
| `--mesic-silver-moon` | `#d4d8ff` | **Primary border + active accent** |
| `--mesic-pearl` | `#f4f8ff` | Hover bright, body text |
| `--mesic-cobalt` | `#3d6cfa` | Hover halo + decorative accent |
| `--mesic-cobalt-deep` | `#1a3a8a` | Active inner glow |
| `--mesic-cream` | `#f5efd6` | Lantern glow + soft highlight |
| `--mesic-section-silver` | `#d4d8ff` | Section accent variant |
| `--mesic-section-cobalt` | `#3d6cfa` | Section accent variant |
| `--mesic-section-pearl` | `#f4f8ff` | Section accent variant |
| `--mesic-section-cream` | `#f5efd6` | Section accent variant |

## 3. Typografie — 100% unikátní 4-font sada

| Role | Font | Charakter | Unique? |
|---|---|---|---|
| Logo (fallback) | **Great Vibes** | flowing wedding-invitation cursive | sdílí modre-nebe/zlaty-standard/bila (jen fallback, baked do raster) |
| Display heading | **Eagle Lake** | fairy-tale flourish serif | ✅ unikátní |
| Section accent | **Imperial Script** | ultra-refined cursive | ✅ unikátní |
| Body | **Cormorant Infant** | softer Cormorant variant | ✅ unikátní |
| Signature | **Sail** | distinctive Latin cursive | ✅ unikátní |

Google Fonts URL — přidat do `index.html`:
```
family=Eagle+Lake&family=Imperial+Script&family=Cormorant+Infant:ital@0;1&family=Sail
```

## 4. Originální motivy (M1-M8)

| M | Motiv | Liší se od |
|---|---|---|
| **M1** | Polished glassmorphic btn3d (silver+cobalt) | Magie má gold+ametyst, mesic silver+cobalt |
| **M2** | 4 měsíční fáze v rozích (RASTER, 4 různé) | Magie 1 ametyst × 4 mirror, mesic 4 různé fáze |
| **M3** | Lunar disc centerpiece (RASTER, 180s CCW) | Magie spell-disc 90s CW, mesic 2× pomalejší + opačný směr |
| **M4** | Constellation hairline pod section title | Magie iridescent gradient, mesic connected-dots line |
| **M5** | Single twinkle star namísto orbit | Magie 3 dots orbit 6s, mesic 1 star slow pulse 4s |
| **M6** | Lantern glow vlevo welcome card | Reference BG lanterny — cream warm soft pulse 8s |
| **M7** | Moon-phase + zodiac sigils per section | Magie arcane sigils, mesic celestial astronomy glyphs |
| **M8** | Sail signature self-draw | Magie Mea Culpa thin spectral, mesic Sail medium-weight Latin |

**Sdílené z magie 1.0u (foundation):**
- Polished glassmorphic btn3d skrz `[class*="btn3d"]` (header + nav + admin konzistentně)
- Glassmorphic sidebar panely (backdrop-blur 16px saturate 130% — víc saturate než magie, ale podobně)
- Per-section colors + per-nav colors (4-color harmony palette)
- Levitating navItem s phase offset
- Section sigils + nav icons inline SVG
- Mobile responsive + reduced-motion safe

## 5. Section accent mapping

| Sekce | Barva | Sigil |
|---|---|---|
| NAVIGACE | silver-moon | crescent + směrová šipka |
| VESMÍRY | cobalt | orbital ellipse + planety |
| CHAT | pearl | crescents + spojnice (dialog) |
| ADMINISTRACE | silver-moon | full moon disk |
| MOJE SVĚTY | cobalt | sphere + meridiany |
| MOJE DISKUZE | pearl | crescents + multiple lines |
| OBLÍBENÉ ČLÁNKY | cream | star + scroll |
| OBLÍBENÉ OBRÁZKY | silver-moon | moon-phase wheel |

**Active border vždy silver-moon** (koheze s logem).

## 6. Assety (7 raster)

| Asset | Zdroj | Cíl | Status |
|---|---|---|---|
| logo.webp | `assets-source/themes/mesic/logo.png` | `public/themes/mesic/decor/logo.webp` | ✅ konvertováno (245 KB) |
| medailon.webp | `assets-source/themes/mesic/medailon.png` | `public/themes/mesic/decor/medailon.webp` | ✅ konvertováno (269 KB) |
| moon-phase-tl.webp | waxing crescent | `public/themes/mesic/decor/moon-phase-tl.webp` | ✅ konvertováno (10.5 KB) |
| moon-phase-tr.webp | full moon | `public/themes/mesic/decor/moon-phase-tr.webp` | ✅ konvertováno (9.7 KB) |
| moon-phase-bl.webp | waning crescent | `public/themes/mesic/decor/moon-phase-bl.webp` | ✅ konvertováno (15.5 KB) |
| moon-phase-br.webp | new moon silhouette | `public/themes/mesic/decor/moon-phase-br.webp` | ✅ konvertováno (14.5 KB) |
| moon-disc.webp | lunar disc centerpiece | `public/themes/mesic/decor/moon-disc.webp` | ✅ konvertováno (116 KB) |
| mesic.webp (BG) | existuje | `public/themes/backgrounds/mesic.webp` | ✅ ponecháno |

**Inline SVG vars** (~14): 8× section sigils + 12× nav/section ikony + signature flourish + twinkle dot + plus glyph.

## 7. Implementační plán

### Fáze A — Konverze (✅ HOTOVO)
- 7 raster assetů zkonvertováno do `public/themes/mesic/decor/`

### Fáze B — Google Fonts (~5 min)
- Edit `index.html` — přidat Eagle Lake + Imperial Script + Cormorant Infant + Sail

### Fáze C — `index.ts` rewrite (~30 min)
- Inline SVG helpery (sigil, icon)
- 8 sigils (celestial/zodiac glyphs)
- 12 ikony (7 nav + 5 right panel)
- 5 raster URL referencí
- 4-color palette + section accents

### Fáze D — `decorations.css` rewrite (~60 min)
- Hero: polished glassmorphic btn3d (silver+cobalt variant)
- Glassmorphic sidebar/welcome card
- Per-corner moon phase mapping (4 různé assets)
- Lunar disc centerpiece (180s CCW)
- Section iridescent → constellation-dot hairline
- Single twinkle star (active nav)
- Lantern glow welcome card
- Sail signature self-draw
- 6 keyframes, @supports fallback, mobile/reduced-motion

### Fáze E — Visual QA (~15 min)
- Desktop + mobile
- Reduced-motion test
- Build pass

### Fáze F — Commit
```
feat(themes/mesic): krok 1.0v — Měsíc skin upgrade

- Polished glassmorphic btn3d (silver+cobalt) napříč header+sidebar+right
- 5 raster ornament assetů + 2 logo/medailon raster + BG
- 4 různé měsíční fáze v rozích panelů
- Lunar disc centerpiece 180s CCW (calmer than magie)
- 100% unikátní typografie: Eagle Lake, Imperial Script, Cormorant Infant, Sail
- 8 originálních motivů (M1-M8) wedding-moonlight elegance
- Constellation-dot hairline (NE iridescent jako magie)
- Single twinkle star (NE orbit)
- Lantern glow welcome card
```

## 8. Akceptační kritéria

- [ ] Skin scoped na `[data-theme="mesic"]`, žádný globální dopad
- [ ] Polished glassmorphic btn3d funguje konzistentně na header + sidebar + pravý panel
- [ ] 4 různé měsíční fáze v rozích panelů (tl/tr/bl/br každý jiný asset)
- [ ] Lunar disc rotuje 180s CCW za welcome textem
- [ ] Constellation-dot hairline pod section titles (NE iridescent)
- [ ] Single twinkle star pulses na active nav (NE orbit)
- [ ] Lantern glow soft pulse 8s vlevo welcome card
- [ ] 4-font typografie načítaná (Eagle Lake + Imperial Script + Cormorant Infant + Sail)
- [ ] Mobile breakpointy (≤768px, ≤480px)
- [ ] Reduced-motion safe
- [ ] WCAG contrast ≥ 4.5:1
- [ ] Build pass: `vite build`
- [ ] Visual QA desktop + mobile

---

**Po souhlasu** spustím Fáze B-F (~2h práce).
