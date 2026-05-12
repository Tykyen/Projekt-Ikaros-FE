# Plán 1.0u — Magie a kouzla visual upgrade

**Datum:** 2026-05-11
**Spec:** [`spec-1.0u-magie-upgrade.md`](spec-1.0u-magie-upgrade.md) ✅ schváleno 2026-05-11
**Asset prompty:** [`prompts-1.0u-magie-assets.md`](prompts-1.0u-magie-assets.md) — 2 prompty pro ChatGPT
**Branch:** `main` (direct commit, vzorem `1.0s` kyberpunk / `1.0t` postapo)
**Single PR** — kompletní skin v jednom kroku

---

## 0. Pre-flight

| Item | Status | Poznámka |
|---|---|---|
| 3 raster zdrojové assety | ✅ | `assets-source/themes/magie/{logo.png, medailon.png}` (dodáno user) + `public/themes/backgrounds/magie.webp` (existuje) |
| Vizuální audit dodaných assetů | ✅ | Logo = purple+gold frame s anděl + "Projekt Ikaros" calligraphy; medailon = anděl v ametystovém faseted rámu na space BG; BG = kouzelník v síni s krystaly a aurorou. Tier-1 |
| Frontend-design audit | ✅ | 2026-05-11, schválen glassmorphic+amethyst direction |
| Shared `btn3d` modul identifikován | ✅ | `src/themes/_shared/btn3d.module.css` — používá headerBtn + navItem + rightAddBtn (composes) |
| User Q&A | ✅ | active=zlato+ametyst inner glow; sidebar=střední průhlednost+blur; fonts=100% unikátní (Quintessential/Macondo/Sorts Mill Goudy/Mea Culpa); 2 raster assety navíc |
| Spec 1.0u schválen | ✅ | 2026-05-11 |

**Raster assety (5 celkem — 3 existující + 2 nové):**

| Asset | Zdroj | Cíl | Status |
|---|---|---|---|
| `logo.webp` | `assets-source/themes/magie/logo.png` | `public/themes/magie/decor/logo.webp` | ⏳ konvert |
| `medailon.webp` | `assets-source/themes/magie/medailon.png` | `public/themes/magie/decor/medailon.webp` | ⏳ konvert |
| `magie.webp` (BG) | existuje | `public/themes/backgrounds/magie.webp` | ✅ ponechat |
| `ametyst-corner.webp` | ChatGPT → `assets-source/themes/magie/ametyst-corner.png` | `public/themes/magie/decor/ametyst-corner.webp` | 🆕 ke generování |
| `spell-disc.webp` | ChatGPT → `assets-source/themes/magie/spell-disc.png` | `public/themes/magie/decor/spell-disc.webp` | 🆕 ke generování |

**Inline SVG vars (cca 16 — všechny v `index.ts`):**

| Var | Účel |
|---|---|
| `--asset-sigil-nav` | 8 paprsků + oko (NAVIGACE) |
| `--asset-sigil-universe` | orbitální kruh + planety (VESMÍRY) |
| `--asset-sigil-chat` | triquetra v kruhu (CHAT) |
| `--asset-sigil-admin` | hexagram + dva kruhy (ADMINISTRACE) |
| `--asset-sigil-worlds` | zemská sféra + meridiány (MOJE SVĚTY) |
| `--asset-sigil-talk` | penta-spirála (MOJE DISKUZE) |
| `--asset-sigil-book` | knižní pečeť (OBLÍBENÉ ČLÁNKY) |
| `--asset-sigil-eye` | oko v trojúhelníku (OBLÍBENÉ OBRÁZKY) |
| `--asset-icon-uvodnik` až `--asset-icon-hospoda` | 7× nav ikony (line-art, currentColor) |
| `--asset-icon-administrace` až `--asset-icon-oblibene-obrazky` | 5× pravý panel ikony |
| `--asset-signature-flourish` | signature self-draw SVG path |
| `--asset-plus-magic` | „+" tlačítko glyph |
| `--asset-sparkle-dot` | sparkle orbit dot |

---

## 1. Implementační fáze

### Fáze A — Příprava assetů (~10 min)

**A1.** Vygenerovat 2 raster assety přes ChatGPT podle `prompts-1.0u-magie-assets.md`:
- Open ChatGPT → paste prompt 1 (ametyst-corner) → download PNG → save jako `assets-source/themes/magie/ametyst-corner.png`
- Same pro prompt 2 (spell-disc) → `assets-source/themes/magie/spell-disc.png`

**A2.** Konvertovat 5 raster assetů na WEBP:
- Vytvořit cílový adresář `public/themes/magie/decor/`
- Použít existující konverzní skript (per kyberpunk/postapo pattern) — typicky `bun scripts/convert-theme-assets.ts magie` nebo manual `cwebp -q 90`
- Output: 5 souborů ve `public/themes/magie/decor/`:
  - `logo.webp` (~360 width, quality 90)
  - `medailon.webp` (~256, quality 90)
  - `ametyst-corner.webp` (256×256, transparent, quality 92)
  - `spell-disc.webp` (512×512, transparent, quality 92)

**Verifikace:** otevřít každý WEBP v prohlížeči, ověřit transparency a kvalitu.

### Fáze B — Google Fonts integration (~5 min)

**B1.** Edit `index.html` — přidat preconnect + Google Fonts link tag pro 5 fontů:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Quintessential&family=Macondo&family=Sorts+Mill+Goudy:ital@0;1&family=Mea+Culpa&family=Cinzel+Decorative:wght@400;700&display=swap" rel="stylesheet">
```

**Verifikace:** v devtools Network filtr `font/woff` → 5 fontů 200 OK po `:root[data-theme="magie"]` aktivaci.

### Fáze C — `index.ts` rewrite (~30 min)

**C1.** Komplet rewrite `src/themes/themes/magie/index.ts`:
- Vzorem kyberpunk pattern (inline SVG data-uri helper `svg()`, theme object)
- Cca 22 vars pro paletu (`--magie-*` tokens)
- Cca 16 inline SVG assets jako data-uri
- 5 raster asset URLs
- 4 unikátní `--font-*` tokens
- Legacy tokeny (`--bg-primary`, `--accent`, `--text-primary`, …) mapped na magie paletu

**C2.** Helper funkce pro sigily:
```ts
const sigil = (innerSvg: string) => svg(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linejoin='round' stroke-linecap='round'>
    <circle cx='32' cy='32' r='28' opacity='0.5'/>
    <circle cx='32' cy='32' r='22' opacity='0.3'/>
    ${innerSvg}
  </svg>
`);
```

Pak 8× `sigil(...)` calls s vnitřními glyfy.

### Fáze D — `decorations.css` rewrite (~60 min)

**D1.** Komplet rewrite `src/themes/themes/magie/decorations.css`:

Struktura (per kyberpunk/postapo template, ale magie scope):
```
1. Base BG color
2. Atmosférický overlay (radial vignette)
3. Topbar — glassmorphic, gold hairline pod
4. Logo styling (raster + fallback)
5. ⭐ Polished glassmorphic btn3d (idle / hover / active / primary / disabled)
6. Sidebar/right frame — glassmorphic panely + backdrop-filter
7. Corner ornaments — ametystový krystal raster (4× s mirror)
8. Section titles — Quintessential + iridescent underline
9. Section accent labels — Macondo
10. Per-section barva (data-section-key)
11. Per-nav-item barva (data-nav-key)
12. ⭐ Levitating navItem animation (phase offset)
13. ⭐ Sparkle orbit (active nav)
14. Nav icons (mask-image)
15. „+" tlačítka
16. ⭐ Welcome card — glassmorphic + spell-disc centerpiece
17. Welcome card medailon
18. Welcome card text styling (Quintessential H1, Macondo label, Mea Culpa signature + self-draw)
19. Novinky card
20. ⭐ Floating arcane sigils per section (watermark)
21. Form controls (input/select/textarea)
22. Buttons (primary/danger)
23. Skin selector dropdown
24. Tooltips, badges, scrollbars
25. Focus visible
26. Empty hints
27. Mobile responsive (≤768px)
28. Mobile small (≤480px)
29. ⭐ @supports fallback pro backdrop-filter
30. Reduced-motion safe (animace OFF/static)
```

**D2.** Klíčové animace v decorations.css (per spec):
- `magie-levitate-corner` (6s, 4× phase 0/1.5/3/4.5s)
- `magie-levitate-nav` (5s, per-item phase offset přes `:nth-child(odd/even)` selektory nebo `--nav-i` custom prop)
- `magie-iridescent-shift` (12s, background-position 0→100%)
- `magie-spell-disc-rotate` (90s linear infinite, CW)
- `magie-sparkle-orbit` (6s, 3 dots phase 0/120/240°)
- `magie-signature-draw` (2.5s ease-out 1, stroke-dasharray)

### Fáze E — IkarosLayout potencionální tweak (~10 min)

**E1.** Zkontrolovat `IkarosLayout.tsx` — přidává `data-section-key` attributy na sekce? Pokud ne, doplnit (jako kyberpunk vyžaduje). Per-nav-key by mělo už být.

**E2.** Pokud potřeba — přidat `style={{ '--nav-i': index }}` na navItem pro phase offset levitate.

### Fáze F — Visual QA (~20 min)

**F1.** `bun run dev` → otevřít aplikaci v Chrome (desktop)
**F2.** Switch na theme „Magie a kouzla" v admin panelu
**F3.** Checklist:
- [ ] Header (pošta, Tyky, odhlásit) má polished btn3d s zlato+ametyst glow
- [ ] Levý sidebar nav items mají individual phase levitation
- [ ] Pravý sidebar admin items mají stejný btn3d styl
- [ ] ÚVODNÍK active stav: zlatý rim + ametyst inner glow + 3 sparkle orbit dots
- [ ] Welcome card má spell-disc rotating centerpiece za textem
- [ ] Welcome card má signature v Mea Culpa s self-draw flourish
- [ ] 4× corner ametystového krystalu levituje s offset phase
- [ ] Section titles v Quintessential, accent labels v Macondo
- [ ] Iridescent underline cykluje 5 barev
- [ ] Floating arcane sigil watermarks v rozích sekcí (opacity 0.06)
- [ ] Body text v Sorts Mill Goudy (italics tested)

**F4.** Chrome DevTools → emulate mobile (375px, 768px) — checklist:
- [ ] Backdrop-blur snížen na 10px (768px) / 6px (480px)
- [ ] Sparkle orbit vypnutý na 768px
- [ ] Corner krystal menší (40px / 32px)
- [ ] Spell-disc opacity 0.10 na mobilu
- [ ] Welcome card padding compact
- [ ] Topbar buttons icon-only ≤480px

**F5.** Firefox check (backdrop-filter fallback) — pokud máš starší Firefox testing, jinak alespoň `@supports not (backdrop-filter: blur(1px))` rules verified syntakticky.

**F6.** DevTools → render → enable „Emulate CSS media feature `prefers-reduced-motion: reduce`":
- [ ] Levitate animace OFF
- [ ] Spell-disc rotation OFF
- [ ] Sparkle orbit OFF
- [ ] Iridescent shift OFF (static gradient state)
- [ ] Signature draw OFF (instant full state)

**F7.** Spustit `mobil-desktop` skill (per CLAUDE.md povinné).

### Fáze G — Build & commit (~5 min)

**G1.** `bun run build` — ověřit no TypeScript errors, no CSS warnings.
**G2.** Visual sanity check `dist/` — fonts loaded, WEBP files in `public/themes/magie/decor/`.
**G3.** Commit message:
```
feat(themes/magie): krok 1.0u — Magie a kouzla skin upgrade

- Polished glassmorphic btn3d napříč header+sidebar+right panel
- 2 raster hero assety (ametyst-corner, spell-disc) + 3 existující
- 16 inline SVG (8 sigils, 12 nav/section icons, signature, plus, sparkle)
- 100% unikátní typografie: Quintessential, Macondo, Sorts Mill Goudy, Mea Culpa
- 7 originálních motivů (M1-M7): levitating corner, scrying disc, sigils,
  iridescent underline, levitating navs, sparkle orbit, signature self-draw
- Glassmorphic sidebar panely (backdrop-blur 14px + @supports fallback)
- Mobile + reduced-motion safe
```

---

## 2. Soubory

### Nově vytvořené
- `public/themes/magie/decor/logo.webp` (konvert z PNG)
- `public/themes/magie/decor/medailon.webp` (konvert z PNG)
- `public/themes/magie/decor/ametyst-corner.webp` (ChatGPT + konvert)
- `public/themes/magie/decor/spell-disc.webp` (ChatGPT + konvert)
- `assets-source/themes/magie/ametyst-corner.png` (ChatGPT output)
- `assets-source/themes/magie/spell-disc.png` (ChatGPT output)

### Upravené
- `src/themes/themes/magie/index.ts` (full rewrite — ~250 lines)
- `src/themes/themes/magie/decorations.css` (full rewrite — ~700 lines)
- `index.html` (přidat Google Fonts link tag pro 5 fontů)
- *(potenciálně)* `src/app/layout/IkarosLayout/IkarosLayout.tsx` (data-section-key + --nav-i pokud chybí)

### Nedotčené
- Wszystky ostatní themes (žádný globální dopad)
- Shared `src/themes/_shared/btn3d.module.css` (pouze override CSS vars přes selektor scope)
- `public/themes/backgrounds/magie.webp` (zachovat)
- `public/themes/thumbnails/magie.webp` (regenerovat optional, pokud změna palety vyžaduje)

---

## 3. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Backdrop-filter blur performance na slabých GPU | Medium | `@media (max-width: 768px)` snižuje blur na 10px; `@supports not` fallback na vyšší opacity bez blur |
| 5 Google Fonts (Quintessential+Macondo+Sorts Mill Goudy+Mea Culpa+Cinzel Dec) — FOIT/FOUT | Low | `display=swap` + system serif fallback v `--font-*` tokenech |
| Quintessential rendering na malých velikostech (≤12px) — flourish detaily se ztratí | Low | Section titles min 13px, body min 14px |
| 4 raster assety load delay (logo + medailon + corner + disc) | Low | WEBP s quality 90 → ~30-60KB each, total <250KB |
| Animace na low-end zařízeních pomalé (8 elements with translateY animations) | Medium | Levitate phase offset rozkládá load v čase; reduced-motion safe; mobile vypíná sparkle orbit |
| ChatGPT vygeneruje asset v jiném stylu než spec popisuje | Medium | Asset prompty mají detailní palette referenci + style guidance; pokud první iterace nesedí, user může požádat o re-roll |
| Active state ametyst inner glow může konfliktovat se zlatým borderem na malých tlačítkách | Low | Inner glow je `inset` shadow — nedotýká se borderu; testováno v Fáze F |
| WCAG kontrast Sorts Mill Goudy body text na glassmorphic surface | Medium | Pearl text (`#f4f0ff`) na velvet (~`#160a2e` po blur) má ratio >7:1 — safe |

---

## 4. Akceptační kritéria (final gate)

- [ ] Spec 1.0u všechna kritéria splněna
- [ ] 5 raster assetů v `public/themes/magie/decor/` (logo, medailon, ametyst-corner, spell-disc) — BG zůstává v backgrounds/
- [ ] `index.ts` má 22+ vars, 16 inline SVG, 4 unique font tokens
- [ ] `decorations.css` má 30 sekcí, 6 keyframes, @supports fallback, 2 mobile breakpointy, reduced-motion block
- [ ] `index.html` má Google Fonts preconnect + load
- [ ] `bun run build` pass — žádné TS errors, žádné CSS warnings
- [ ] Visual QA desktop+mobile checklist (Fáze F) all green
- [ ] `mobil-desktop` skill run a schválen
- [ ] Commit message dle template (Fáze G)

---

**Po odsouhlasení tohoto plánu + asset promptů:**
1. Vygeneruješ 2 raster assety v ChatGPT (instrukce v `prompts-1.0u-magie-assets.md`)
2. Vložíš PNG do `assets-source/themes/magie/`
3. Dáš mi vědět → spustím implementaci Fáze A-G
