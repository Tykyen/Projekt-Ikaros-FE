# Plán 1.0o — Severské runy visual upgrade

**Datum:** 2026-05-11
**Spec:** [`spec-1.0o-severske-runy-upgrade.md`](spec-1.0o-severske-runy-upgrade.md) ✅
**Asset prompty:** [`prompts-1.0o-severske-runy-assets.md`](prompts-1.0o-severske-runy-assets.md) ✅
**Branch:** `main` (přímý commit po dokončení)
**Single PR** — kompletní skin v jednom kroku

---

## 0. Pre-flight ✅

| Item | Status | Poznámka |
|---|---|---|
| 18 assetů v `assets-source/themes/severske-runy/` | ✅ | 16 AI + logo + medailon |
| `optimize-theme-assets.mjs` spuštěn | ✅ | 18× webp v `public/themes/severske-runy/decor/` |
| `finalize-severske-runy-assets.mjs` vytvořen + spuštěn | ✅ | resize na cílové rozměry hotov |
| Background `public/themes/backgrounds/severske-runy.webp` | ✅ | fjord scene, neměníme |
| Thumbnail `public/themes/thumbnails/severske-runy.webp` | ✅ | existuje |
| Layout audit (`IkarosLayout.tsx`) | ✅ | Administrace už nahoře, top bar 3-item — shoda se spec |
| `PanelCorners` injectuje `<CornerOrnament position="tl|tr|bl|br" />` | ✅ | 4 rohy ve všech panelech — hook pro vlčí hlavy |

---

## 1. Kroky implementace

### Krok 1 — Sancreek font do `index.html`

Přidat `&family=Sancreek` do existující Google Fonts URL (řádek 39).

### Krok 2 — `src/themes/themes/severske-runy/index.ts` — rozšířit tokens

Změny:
- Změnit `--font-display` z `"Uncial Antiqua"` na `"Sancreek"` (fallback `"MedievalSharp"`)
- Přidat material tokens (`--mat-oak`, `--mat-oak-mid`, `--mat-oak-deep`, `--mat-iron`, `--mat-iron-highlight`, `--mat-iron-deep`, `--mat-frost`, `--mat-rune-recess`)
- Přidat bronze akcent (`--accent-bronze`, `--accent-bronze-bright`, `--accent-bronze-dim`)
- Přidat stone surface (`--bg-card-stone`, `--bg-card-stone-2`)
- Přidat asset URLs (`--asset-logo`, `--asset-corner-tl`, `--asset-welcome-arch`, `--asset-wolfshield-divider`, `--asset-rune-circle-floor`, `--asset-rune-knot-seal`, `--asset-medailon-frame`, `--asset-medailon`, + 10× `--asset-icon-*`)
- Změnit `reducedMotion: 'safe'` → `reducedMotion: 'gentle'` (snow + breathe + hover sjednoceně vypnutelné)

### Krok 3 — `src/themes/themes/severske-runy/decorations.css` — kompletní přepsání

Struktura ~700-800 řádků, sekce po sekcích:

| Sekce | Obsah |
|---|---|
| 1. Background & atmosféra | gradient overlay (ice-blue glow top, dark bottom, vignette) |
| 2. Snow fall (3 vrstvy) | `body::before` + `body::after` + `#root::before`, SVG snowflake patterny, 60s/90s/120s |
| 3. Shell typografie | `.logo` (Cinzel) + `--logo-img-display: block` + `--asset-logo` + `--asset-logo-w` |
| 4. Topbar | `.header` dark oak panel s iron strap dole, header buttons styling |
| 5. Side panely (sidebar + drawer) | dark oak background + iron banding (4 hrany), `[data-frame-panel="sidebar"]` |
| 6. Pravý panel | stejné jako sidebar, `[data-frame-panel="right"]` |
| 7. Vlčí hlavy v rozích panelů | `CornerOrnament[data-position]` s `--asset-corner-tl` + mirror transforms + ice-blue eye glow pseudo (`::before` overlay s box-shadow) + hover panel → eye intensify |
| 8. Section titles | `.sectionTitle` → Sancreek font, ice-blue color, all-caps, letter-spacing |
| 9. Wolfshield divider | `.section + .section::before` → wolfshield-divider asset jako horizontální banner |
| 10. Welcome card | granit stone surface, `welcome-arch` jako `::before` overlay, medailon vlevo, rune-circle-floor jako `::after` pod cardem |
| 11. Nav buttons | idle wood + iron rivets, hover frostbreath pseudo (`::after` mlha), active ice-blue runa glow + breathe + ice-crackle (pseudo `::before` SVG mask) |
| 12. Nav ikony per `data-nav-key` | každý `data-nav-key` → background-image z `--asset-icon-*` |
| 13. Cards (Novinky atd.) | dark oak + iron banding (NE granit) |
| 14. ThemeSwitcher styling | inherit existing pattern, decentní bronze accent |
| 15. Mobile breakpoints | scaling, snow fall reduction (1 vrstva), welcome-arch fallback |
| 16. Reduced-motion | všechny animace `animation: none`, snow display none, breathe static |

### Krok 4 — Verifikace mobile + desktop (TEST)

1. `npm run dev` → otevřít browser, přepnout na skin "Severské runy"
2. Desktop test (1920×1080):
   - Vlčí hlavy ve všech 4 rozích každého panelu ✓
   - Welcome card má arch + medailon vlevo + paragraph vpravo ✓
   - Rune-circle-floor viditelný pod welcome card ✓
   - Nav buttons → idle/hover/active state ✓
   - Wolfshield divider mezi sekcemi ✓
   - Pravý panel: Administrace nahoře, pak ostatní sekce ✓
   - Top bar 3-item (Pošta + Profile + Odhlásit) ✓
   - Snow fall viditelný ✓
   - Sancreek na sekčních headingsech ✓
3. Mobile test (375×667):
   - Drawer sidebar opens
   - Welcome arch crop OK
   - Nav medailony čitelné
   - Snow fall fallback (1 vrstva)
4. Reduced-motion test: `prefers-reduced-motion: reduce` v dev tools
5. Smoke test: přepnout na 2-3 jiné skiny → žádná regrese

### Krok 5 — Memory update

Po hotové impl:
- Aktualizovat `MEMORY.md` index pokud bylo něco rozhodnuto nového
- Žádné nové memory entries — workflow byl standardní (spec → impl)

### Krok 6 — Roadmap update

Zaškrtnout 1.0o v `docs/roadmap-fe.md` (pokud existuje a obsahuje 1.0o entry).

---

## 2. Risk mitigace dle spec 9

| Risk | Akce v implementaci |
|---|---|
| 9.1 Sancreek čitelnost mobile | Sancreek POUZE `.sectionTitle` (24px+), labels zůstávají Lora |
| 9.2 Snow performance | Mobile (≤768px) → 1 vrstva, compact (≤480px) → skip |
| 9.3 Wolf eye blink | **SKIP V1** — jen pasivní glow + hover intensify |
| 9.4 Medailon-frame použití | MVP: nepoužitý ve V1 (asset zůstává v decor/, ale není referencovaný v CSS). Lze přidat později jako decorative element. |
| 9.5 Skin selector | Reuse `ThemeSwitcher`, žádný custom dropdown |
| 9.6 Rune-circle mobile | Scale 0.5 mobile, skip compact |
| 9.7 Vlčí hlavy overflow | `overflow: visible` na `[data-frame-panel]` v scoped CSS |
| 9.8 Admin "high seat" | Layout už má Administrace nahoře — **žádný `order:` patch nutný** |
| 9.9 Reduced-motion | Zvýšit na `'gentle'` v index.ts, fallback v CSS |

---

## 3. Akceptace

Spec 8 sekce — všech 14 checkboxů. Manuální spot-check (žádný automatický visual diff).

---

## 4. Co NEDĚLÁME (out of scope V1, ze spec 10)

- Krkavec sleduje scroll
- Rune scroll custom dropdown
- Wolf eye blink easter egg
- Mlha z dveří v pozadí
- Custom `RuneTally` React komponenta — V1 použijeme **CSS-only fallback** (pseudo-element počítá `data-count` přes `attr()` nebo standard numerický badge zůstane, pouze přebarven). Plná tally implementace odložena.
