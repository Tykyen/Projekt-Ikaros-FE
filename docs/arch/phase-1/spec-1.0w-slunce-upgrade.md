# Spec + Plan 1.0w — Slunce visual upgrade

**Datum:** 2026-05-12
**Status:** 🟡 ke schválení
**Skin:** `slunce` (Slunce)
**Branch:** `main` (direct commit, vzorem 1.0u magie + 1.0v mesic)
**Scope:** `[data-theme="slunce"]` — žádný globální dopad

---

## 1. Koncept

> **„Antický sluneční kult v pouštních ruinách — egyptian sun-deity carved into temple stone, hostile heat"**

Dědí magie 1.0u glassmorphic btn3d pattern, ale **dramatičtější**: rychlejší motion (medium energy), flame flicker, heat shimmer. Black+gold+ember, NE soft/pastel. Ohnivá hostility, NE happy sunshine.

---

## 2. Palette (z dodaných assetů)

| Token | Barva | Role |
|---|---|---|
| `--slunce-obsidian` | `#0c0a08` | BG base |
| `--slunce-charcoal` | `#1a1410` | Surface |
| `--slunce-burnt-umber` | `#2a1e14` | Surface lift |
| `--slunce-gold-blazing` | `#ffb800` | **Primary border + active accent** |
| `--slunce-sun-white` | `#fff6c2` | Hover bright + body text on dark |
| `--slunce-ember` | `#ff4d1c` | Hover halo + decorative accent |
| `--slunce-ember-deep` | `#a02a08` | Active inner glow |
| `--slunce-copper` | `#b8741a` | Secondary accent |
| `--slunce-ruby` | `#c81818` | Section accent (intense) |
| `--slunce-section-gold` | `#ffb800` | Section variant |
| `--slunce-section-ember` | `#ff4d1c` | Section variant |
| `--slunce-section-copper` | `#b8741a` | Section variant |
| `--slunce-section-ruby` | `#c81818` | Section variant |

## 3. Typografie — 100% unikátní 4-font sada

| Role | Font | Charakter | Unique? |
|---|---|---|---|
| Logo (fallback) | **Diplomata SC** | engraved stone small caps | ✅ unikátní |
| Display heading | **Forum** | Trajan-like uppercase Roman | ✅ unikátní |
| Section accent | **Wallpoet** | dystopian distressed display | ✅ unikátní |
| Body | **Eczar** | sharp uncial serif (Egyptian feel) | ✅ unikátní |
| Signature | **Wallpoet** | engraved brand-mark NE cursive | shared s tribal-accent |

Google Fonts URL — přidat do `index.html`:
```
family=Diplomata+SC&family=Forum&family=Wallpoet&family=Eczar:wght@400;500;600
```

## 4. Originální motivy (M1-M8)

| M | Motiv | Liší se od |
|---|---|---|
| **M1** | Polished glassmorphic btn3d (gold+ember) | Magie gold+ametyst, mesic silver+cobalt, slunce gold+ember (hot palette) |
| **M2** | Sun corona ray corner (RASTER, 1 + mirror 4×) | Magie krystal, mesic moon phases, slunce radiating gold rays |
| **M3** | Flame disc centerpiece (RASTER, 90s CW) | Magie 90s CW (same speed) ale slunce má **flame flicker** brightness 4-6% pulse |
| **M4** | Cracked-earth hairline pod section title | Magie iridescent, mesic constellation-dots, slunce gold-orange-charcoal crack pattern |
| **M5** | Solar flare flicker na section underline | Brief brightening every 6-8s (gentle, NE kyberpunk disruptive flicker) |
| **M6** | Egyptian sun-glyph sigils per section | Ra eye, scarab, Aten, solar boat, ankh, was scepter, djed pillar, lotus — inline SVG |
| **M7** | Ember rising particles na active nav | 3 ember dots vertikálně + fade (NE orbit jako magie) |
| **M8** | Heat shimmer distortion welcome card | Subtle horizontal wavy 8s (žádný jiný skin) |
| **M9** | Wallpoet engraved signature | NE cursive — slunce je deity, ne admin |

**Sdílené z magie/mesic foundation:**
- Polished glassmorphic btn3d skrz `[class*="btn3d"]`
- Glassmorphic sidebar panels (backdrop-blur 10px saturate 110% — méně blur než magie/mesic, slunce má víc textury)
- Per-section colors + per-nav colors
- Mobile responsive + reduced-motion safe

## 5. Section accent mapping (Egyptian glyphs)

| Sekce | Barva | Egyptian sigil |
|---|---|---|
| NAVIGACE | gold-blazing | Eye of Ra |
| VESMÍRY | ember | Khepri scarab |
| CHAT | copper | Solar boat |
| ADMINISTRACE | gold-blazing | Aten disk |
| MOJE SVĚTY | ember | Ankh |
| MOJE DISKUZE | copper | Was scepter |
| OBLÍBENÉ ČLÁNKY | ruby | Djed pillar |
| OBLÍBENÉ OBRÁZKY | gold-blazing | Lotus |

**Active border vždy gold-blazing**.

## 6. Assety (4 raster)

| Asset | Zdroj | Cíl | Status |
|---|---|---|---|
| logo.webp | `assets-source/themes/slunce/logo.png` | `public/themes/slunce/decor/logo.webp` | ✅ konvertováno (243 KB) |
| medailon.webp | `assets-source/themes/slunce/medailon.png` | `public/themes/slunce/decor/medailon.webp` | ✅ konvertováno (232 KB) |
| sun-corner.webp | corona ray TL master | `public/themes/slunce/decor/sun-corner.webp` | ✅ konvertováno (27 KB) |
| flame-disc.webp | plamenný kruh | `public/themes/slunce/decor/flame-disc.webp` | ✅ konvertováno (143 KB) |
| slunce.webp (BG) | existuje | `public/themes/backgrounds/slunce.webp` | ✅ ponecháno |

**Inline SVG vars** (~14): 8× Egyptian sigils + 12× nav/section ikony + ember dot + plus glyph.

## 7. Implementační plán

### Fáze A — Konverze (✅ HOTOVO)

### Fáze B — Google Fonts (~5 min)
- Edit `index.html` — Diplomata SC + Forum + Wallpoet + Eczar

### Fáze C — `index.ts` rewrite (~30 min)
- Inline SVG helpery
- 8 Egyptian sigils (Eye of Ra, Khepri, Aten, Solar boat, Ankh, Was, Djed, Lotus)
- 12 ikony (7 nav + 5 right panel)
- 4 raster URL referencí
- Hot palette + section accents

### Fáze D — `decorations.css` rewrite (~60 min)
- Hero: polished glassmorphic btn3d (gold+ember variant)
- Glassmorphic sidebar/welcome card s heat shimmer
- Sun corona corner (4× s mirror, jako magie pattern)
- Flame disc centerpiece 90s CW + flicker 4s
- Section cracked-earth hairline
- Solar flare flicker subtle 6-8s
- Ember rising particles (active nav)
- Heat shimmer welcome card (8s subtle horizontal wavy)
- Wallpoet engraved signature
- 6 keyframes, @supports fallback, mobile/reduced-motion

### Fáze E — Visual QA (~15 min)

### Fáze F — Commit
```
feat(themes/slunce): krok 1.0w — Slunce skin upgrade

- Polished glassmorphic btn3d (gold+ember) napříč shellem
- 2 raster ornament + 2 logo/medailon raster + BG
- Sun corona corner (4× mirror) + flame disc 90s CW s flicker
- 100% unikátní typografie: Diplomata SC, Forum, Wallpoet, Eczar
- 8 originálních motivů egyptian sun-cult drama
- Cracked-earth hairline + solar flare flicker
- Ember rising particles + heat shimmer welcome card
- Wallpoet engraved signature (NE elegant cursive)
```

## 8. Akceptační kritéria

- [ ] Skin scoped na `[data-theme="slunce"]`, žádný globální dopad
- [ ] Polished glassmorphic btn3d (gold+ember) na header+sidebar+pravý panel
- [ ] Sun corona corner 4× per panel (1 asset + mirror)
- [ ] Flame disc rotuje 90s CW + subtle flicker za welcome textem
- [ ] Cracked-earth hairline pod section titles
- [ ] Solar flare flicker subtle na section underline 6-8s
- [ ] Ember rising particles na active nav (vertical, NE orbit)
- [ ] Heat shimmer distortion welcome card 8s
- [ ] Wallpoet signature (NE cursive)
- [ ] 4-font typografie (Diplomata SC + Forum + Wallpoet + Eczar)
- [ ] Mobile breakpointy
- [ ] Reduced-motion safe
- [ ] Build pass
- [ ] Visual QA

---

**Po souhlasu** spustím Fáze B-F (~2h práce).
