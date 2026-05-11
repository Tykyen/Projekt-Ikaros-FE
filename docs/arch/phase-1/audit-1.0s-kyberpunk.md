# Audit 1.0s — Kyberpunk skin upgrade

**Datum:** 2026-05-11
**Spec:** [spec-1.0s-kyberpunk-upgrade.md](spec-1.0s-kyberpunk-upgrade.md)
**Plán:** [plan-1.0s.md](plan-1.0s.md)
**Status:** 🟡 ke schválení uživatelem

---

## Co se změnilo

### Soubory (moje práce, jen kyberpunk-scoped + global chrome)

| Soubor | Akce | Velikost |
|---|---|---|
| `src/themes/themes/kyberpunk/index.ts` | Kompletně přepsáno | 50 → 420 řádků |
| `src/themes/themes/kyberpunk/decorations.css` | Kompletně přepsáno | 23 → 720 řádků |
| `index.html` | Doplněno 3 Google Fonts (Audiowide, Bebas Neue, Share Tech Mono) | +3 family params |
| `public/themes/kyberpunk/decor/logo.webp` | Nový (z `assets-source/themes/kyberpunk/logo.png`) | ~50–80 KB |
| `public/themes/kyberpunk/decor/medailon.webp` | Nový (z `assets-source/themes/kyberpunk/medailon.png`) | ~30–50 KB |
| `public/themes/backgrounds/kyberpunk.webp` | Přepsáno (z `assets-source/themes/backgrounds/kyberpunk.png`) | 281 KB |
| `docs/arch/phase-1/spec-1.0s-kyberpunk-upgrade.md` | Nový | — |
| `docs/arch/phase-1/plan-1.0s.md` | Nový | — |
| `docs/arch/phase-1/audit-1.0s-kyberpunk.md` | Nový (tento dokument) | — |

### Theme isolation ✅
- `git status --short -- src/themes/themes/` ukazuje jen `kyberpunk/` jako mou úpravu (severske-runy diff je z předchozí session, ne 1.0s).
- Zbylých 20 témat = nulová regrese.

### Žádné AI gen WEBP, žádné ChatGPT prompty
- 22 inline SVG data-uri vars v `index.ts` (HUD bracket, rain strip, 8× CJK znaky, 12× ikony, signature, plus glyph)
- 3 raster assety (logo, medailon, background) — všechny dodal uživatel
- Žádný `_asset-prompts.md` soubor

---

## Checklist pro uživatele — vizuální kontrola

Otevři `http://localhost:5183` v browseru a přepni na **Kyberpunk** skin v pravém panelu ADMINISTRACE → výběr skinu.

### A. Atmosféra
- [ ] BG (megalopole + fénix hologram) je vidět skrze atmosférický overlay
- [ ] Žádné UI prvky se nezdají vůči pozadí přesycené / nečitelné
- [ ] Skin sedí Akihabara/HK 2099 noční déšť feel?

### B. 9 originálních motivů (každý zaškrtni jestli funguje a je vidět)
- [ ] **Sparse typografický rain** ve dvou edge strips (50px vlevo + vpravo, padající CJK + binární znaky v 6 cyklujících barvách, animuje 80s)
- [ ] **Section-color stripe 4px vlevo** od každého nav itemu (Úvodník=cyan / Vytvořit svět=magenta / Diskuze=green / Články=yellow / Galerie=purple / Nápověda=pink)
- [ ] **Broken neon flicker** na active nav (60ms blackout 1× za ~15s — vydrž jednu minutu, měl bys vidět 4× drobný neon „blink")
- [ ] **RGB-split chromatic aberration** na hover (najeď myší na nav item → text se rozštekne na cyan/red ghost)
- [ ] **Magenta horizontal hairline divider** uprostřed welcome card (růžová neonová čára přes celou kartu)
- [ ] **Wet pavement reflection** pod welcome card (vertikální cyan+magenta blur gradient pod kartou — jako odlesk v louži)
- [ ] **CJK watermarks** v rozích sekcí (光 / 宇 / 声 / 制 / 界 / 話 / 文 / 画) — subtilní, 0.04 opacity
- [ ] **Administrator signature self-draw** pod welcome cardem (cyan flourish se sám napíše při loadu, 2s ease-out, 1× per session)
- [ ] **Cyan+magenta HUD bracket corners** ve 4 rozích každého panelu (sidebar levý, sidebar pravý, welcome card, Novinky)

### C. Section-coloring (hallmark)
- [ ] Sekce NAVIGACE má cyan title + cyan watermark 光
- [ ] Sekce VESMÍRY má magenta title + magenta watermark 宇
- [ ] Sekce CHAT má green title + green watermark 声
- [ ] Sekce ADMINISTRACE (vpravo) má cyan title + cyan watermark 制
- [ ] Sekce MOJE SVĚTY má magenta title + magenta watermark 界
- [ ] Sekce MOJE DISKUZE má green title + green watermark 話
- [ ] Sekce OBLÍBENÉ ČLÁNKY má yellow title + yellow watermark 文
- [ ] Sekce OBLÍBENÉ OBRÁZKY má purple title + purple watermark 画

### D. Welcome card
- [ ] Medailon vlevo (192×192 desktop), neon glow okolo
- [ ] Title "Vítej v Projektu Ikaros." v Bebas Neue uppercase
- [ ] Accent "Projektu Ikaros." v cyan glow
- [ ] Body text v Share Tech Mono (CRT terminal feel)
- [ ] Administrator signature dole v Audiowide italic cyan
- [ ] Magenta hairline divider uprostřed
- [ ] Wet pavement reflection pod kartou

### E. Topbar
- [ ] Logo vlevo (neon HUD plaketa s anděl medailónem)
- [ ] Pravá tlačítka: POŠTA / UŽIVATELÉ / ZLATÝ STANDARD / TYKY / ODHLÁSIT
- [ ] **ZLATÝ STANDARD** má speciální magenta-purple gradient glow (alternativa k gold v kyberpunku, kontextově sedí)
- [ ] Cyan+magenta hairline pod topbarem

### F. Hover/Active states
- [ ] Nav hover: RGB-split text + section-color stripe se rozšíří + neon glow
- [ ] Active nav (Úvodník): cyan+magenta combined neon outline + flicker
- [ ] Topbar buttons hover: border → magenta + neon glow
- [ ] „+" tlačítka v pravém panelu (přidat svět, přidat diskuzi) — neon plus glyph, hover magenta

### G. Typography
- [ ] **Audiowide** logo fallback (pokud raster logo nezataženo)
- [ ] **Bebas Neue** section titles + welcome title + tlačítka
- [ ] **Share Tech Mono** body text

### H. Mobile (≤768px) — otevři DevTools → toggle device
- [ ] Sparse rain skryt (oba strips)
- [ ] HUD bracket corners zmenšené (52×52 tablet, 38×38 mobile)
- [ ] Logo zmenšeno na 220px
- [ ] Welcome card padding compressed (32px / 16px)
- [ ] Medailon zmenšen na 144×144
- [ ] Wet pavement reflection 40px height
- [ ] CJK watermarks 24×24
- [ ] Touch targets ≥48px

### I. Mobile small (≤480px)
- [ ] Medailon 112×112 nad textem (stack column)
- [ ] Header buttons icon-only
- [ ] Welcome card padding 24px / 12px

### J. Reduced-motion (DevTools → Rendering → Emulate prefers-reduced-motion: reduce)
- [ ] Rain animace zastavena (statická), opacity snížena na 0.30
- [ ] Broken neon flicker disabled (constant opacity 1.0)
- [ ] RGB-split hover disabled (text bez shadow split)
- [ ] Signature self-draw → instant full state

### K. Accessibility
- [ ] Focus visible — 2px cyan outline + glow shadow na všech interaktivních elementech (Tab přes nav items)
- [ ] Color contrast čitelný (text-primary #e4f7ff na bg-card #110c2e = WCAG AAA 17:1)
- [ ] Žádný čtecí text nepoužívá RGB-split (jen interactive hover)
- [ ] CJK watermarks `aria-hidden` (rendereny jako background-image, ne text node — automaticky AT-skip)

---

## Otevřené body / case-by-case otázky

1. **CJK znaky** (光 / 宇 / 声 / 制 / 界 / 話 / 文 / 画) — schvaluješ jako finální sadu? (smysluplná japonská slova: světlo / vesmír / hlas / řád / svět / rozhovor / text / obraz)
2. **ZLATÝ STANDARD button magenta-purple gradient** — sedí (premium feel v kyberpunk paletě) nebo vrátit gold tint?
3. **Thumbnail regenerace** (`public/themes/thumbnails/kyberpunk.webp`) — odloženo na post-1.0s, OK?
4. **Sparse rain rytmus** (80s loop) — vhodný / příliš pomalý / příliš rychlý?
5. **Flicker interval** (15s) — vhodný / příliš rušivý?

---

## Technické metriky

- **TypeScript check**: ✅ prošel bez chyb (`npx tsc --noEmit`)
- **Theme registry tests**: ✅ 7/7 prošlo
- **Všechny theme tests**: ✅ 19/19 prošlo
- **HTTP test**: ✅ `/themes/kyberpunk/decor/{logo,medailon}.webp` + `/themes/backgrounds/kyberpunk.webp` všechny vrací 200
- **CSS module load**: ✅ kyberpunk decorations.css se kompiluje bez chyb v dev serveru

---

## Postup po schválení

- [ ] Spustit `mobil-desktop` skill (povinné per CLAUDE.md / base.md)
- [ ] Zaškrtnout 1.0s v `docs/roadmap-fe.md`
- [ ] Uzavřít související dluhy v `docs/dluhy.md`
- [ ] Vytvořit screenshots do `docs/arch/phase-1/_screenshots/kyberpunk-{welcome,sidebar,zoom}.png`
- [ ] Commit s message `feat(themes/kyberpunk): krok 1.0s — Kyberpunk skin upgrade`
