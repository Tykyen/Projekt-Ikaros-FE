# Plán 1.0c — Zlatý standard visual upgrade

**Datum:** 2026-05-09
**Status:** ⏳ Čeká na schválení
**Spec:** `docs/arch/phase-1/spec-1.0c-zlaty-standard-upgrade.md` ✅
**Pořadí prací:** Pre-flight → Asset pipeline → Tokens → Decorations → IkarosLayout (PJ badge) → Test → Mobil-desktop sweep

---

## 0. Update specu po průzkumu kódu

Při psaní plánu jsem ověřil rizika R1–R6 ze specu. Výsledky:

| Risk | Stav | Dopad |
|---|---|---|
| **R1** `World.creatorId` chybí | 🟢 Vyřešen — `World.ownerId: string` existuje, použijeme `world.ownerId === currentUser.id` | PJ badge implementovatelný v plánu |
| **R2** `optimize-theme-assets.mjs` neumí decor | 🟡 Skript zpracovává jen `references/` a `backgrounds/`. Modre-nebe decor (logo.webp, andel-medallion.webp) **nemá zdroj v `assets-source/`** — webp jsou v `public/themes/modre-nebe/decor/` přímo. Pravděpodobně byly generovány ručně mimo pipeline. | Doplníme **3. target `decor`** do skriptu (~15 řádků), zdrojem `assets-source/themes/<themeId>/*.png` → `public/themes/<themeId>/decor/*.webp`, **bez resize** (zachová originální rozměry, jen WebP komprese q=85) |
| **R3** `backdrop-filter` výkon | 🟢 Použijeme **jen na panelech** (4 boxy), ne fixed overlay. Modre-nebe stejný pattern. | OK |
| **R4** Background tmavší než modre-nebe | 🟡 Vyladí se experimentálně — start na overlay 0.55→0.78, dopiluju během FE testu | OK |
| **R5** Cobalt aktivní stav „cizorodý" v gold paletě | 🟡 Subjektivní, vyladíme po vizuální kontrole — fallback je gold-only (~3 řádky CSS) | OK |
| **R6** `s.titleAccent` hardcoded | 🟢 Vyřešen — `DashboardPage.module.css` už používá `var(--theme-accent-cyan, var(--accent-bright))` s fallbackem na gold; když zlaty-standard.index.ts definuje `--theme-accent-cyan`, automaticky funguje | Žádná změna `DashboardPage.module.css` ani `DashboardPage.tsx` |

**Závěr:** scope plánu beze změny vůči specu. Jen R2 přidává mini-úkol (extension optimize skriptu).

---

## 1. Pre-flight checklist

### 1.1 Assety od uživatele
- [ ] `assets-source/themes/zlaty-standard/andel-medallion.png` (z chatu — angel ve zlatém ornátovém rámu, ~300×320 px)
- [ ] `assets-source/themes/zlaty-standard/logo.png` (z chatu — banner „Projekt Ikaros" se zlatým rámem, ~700×140 px)
- [x] `assets-source/themes/backgrounds/zlaty-standard.png` (dropnut a optimalizován 2026-05-09)

### 1.2 Verifikováno v kódu
- [x] `World.ownerId: string` v `src/shared/types/index.ts:141`
- [x] `currentUserAtom` v `src/shared/store/authStore.ts` (importováno v `IkarosLayout`)
- [x] `IkarosCard` má `medallion` slot, layout flex-row desktop / column mobil
- [x] `DashboardPage.module.css` už cyan accent + script font přes CSS proměnné (`--theme-accent-cyan`, `--font-script`) s gold fallbacky
- [x] `CornerOrnament.module.css` čte `--theme-accent`, `--theme-glow-gold`, `--theme-surface-strong` → automaticky se přizpůsobí zlatému standardu jakmile tokeny existují
- [x] `IkarosLayout.module.css` `.logoImg` čte `--asset-logo`, `--asset-logo-w`, `--logo-img-display` → automaticky se přepne na banner jakmile zlaty-standard tokeny definuje

### 1.3 Skripty
- [x] `npm run themes:optimize` funguje (background už regenerován)
- [ ] `optimize-theme-assets.mjs` rozšířit o `decor` target (krok §2)

---

## 2. Asset pipeline — extension `optimize-theme-assets.mjs`

### Diff `scripts/optimize-theme-assets.mjs`

Stávající skript zpracovává `references/` a `backgrounds/`. Přidáme handler pro decor folders **v každém theme adresáři**:

```diff
@@
 const SRC_BASE = path.resolve('assets-source/themes');
 const OUT_BASE = path.resolve('public/themes');

 const TARGETS = [
   { src: 'references',  out: 'thumbnails',  width: 320,  height: 180,  quality: 82 },
   { src: 'backgrounds', out: 'backgrounds', width: 1920, height: 1080, quality: 80 },
 ];

+/**
+ * Decor PNGs (logo, medailony, ornamenty per téma).
+ * Zdroj: assets-source/themes/<themeId>/*.png
+ * Cíl:   public/themes/<themeId>/decor/<name>.webp
+ * Bez resize — zachová originální rozměry, jen WebP komprese.
+ */
+async function processDecor() {
+  const entries = await readdir(SRC_BASE, { withFileTypes: true });
+  const themeDirs = entries
+    .filter((e) => e.isDirectory() && !['references', 'backgrounds'].includes(e.name))
+    .map((e) => e.name);
+
+  for (const themeId of themeDirs) {
+    const srcDir = path.join(SRC_BASE, themeId);
+    const outDir = path.join(OUT_BASE, themeId, 'decor');
+    const files = (await readdir(srcDir, { withFileTypes: true }))
+      .filter((e) => e.isFile() && /\.png$/i.test(e.name))
+      .map((e) => e.name);
+    if (files.length === 0) continue;
+    await mkdir(outDir, { recursive: true });
+    for (const file of files) {
+      const srcPath = path.join(srcDir, file);
+      const outName = file.toLowerCase().replace(/\.png$/i, '.webp');
+      const outPath = path.join(outDir, outName);
+      try {
+        await sharp(srcPath).webp({ quality: 85 }).toFile(outPath);
+        const stats = await stat(outPath);
+        console.log(`✓ ${themeId}/${file} → decor/${outName} (${(stats.size / 1024).toFixed(0)} KB)`);
+      } catch (err) {
+        console.error(`✗ ${themeId}/${file}: ${err.message}`);
+      }
+    }
+  }
+}

 async function main() {
   console.log('[themes] Optimizing assets...');
   for (const target of TARGETS) {
     await processDir(target);
   }
+  await processDecor();
   console.log('[themes] Done.');
 }
```

**Validace:** po dropu `andel-medallion.png` + `logo.png` od uživatele spustím `npm run themes:optimize`. Očekávaný výstup:
```
✓ zlaty-standard/andel-medallion.png → decor/andel-medallion.webp (XX KB)
✓ zlaty-standard/logo.png → decor/logo.webp (XX KB)
```

**Risk:** skript existuje v repu — dopad na ostatní témata? Žádný, protože `assets-source/themes/<themeId>/` neexistuje pro ostatní; jen `references/` a `backgrounds/`. Smyčka `themeDirs` nic nenajde.

---

## 3. Token model — `src/themes/themes/zlaty-standard/index.ts`

**Plný přepis souboru.** Pattern převzat z modre-nebe s úpravou palety. Diff:

```diff
 import type { Theme } from '@/themes/types';

+const decor = '/themes/zlaty-standard/decor';
+
 export const zlatyStandardTheme: Theme = {
   id: 'zlaty-standard',
   name: 'Zlatý standard',
   scope: 'both',
-  atmosphere: 'Královský luxus — pure black + rich gold, no blue',
+  atmosphere: 'Královský luxus — pure black + rich gold + subtle cobalt accents on active states',
   vars: {
+    // ── Background overlay ──
+    '--theme-bg-overlay':
+      'linear-gradient(180deg, rgba(2, 4, 8, 0.55) 0%, rgba(2, 4, 8, 0.78) 100%)',
+
+    // ── Glass surfaces ──
+    '--theme-surface':         'rgba(5, 6, 10, 0.78)',
+    '--theme-surface-strong':  'rgba(2, 3, 6, 0.92)',
+    '--theme-surface-soft':    'rgba(15, 12, 5, 0.55)',
+
+    // ── Borders ──
+    '--theme-border':       'rgba(212, 160, 23, 0.78)',
+    '--theme-border-soft':  'rgba(212, 160, 23, 0.32)',
+    '--theme-border-cyan':  'rgba(25, 214, 232, 0.45)',
+
+    // ── Text ──
+    '--theme-text':         '#f0e8d0',
+    '--theme-text-muted':   '#c4a960',
+    '--theme-heading':      '#f0c040',
+
+    // ── Accents ──
+    '--theme-accent':        '#d4a017',
+    '--theme-accent-bright': '#f0c040',
+    '--theme-accent-cyan':   '#19d6e8',
+
+    // ── Glow ──
+    '--theme-glow-gold':    'rgba(240, 192, 64, 0.42)',
+    '--theme-glow-cyan':    'rgba(25, 214, 232, 0.38)',
+    '--theme-shadow':       'rgba(0, 0, 0, 0.85)',
+
+    // ── Nav interactive states ──
+    '--theme-nav-hover-bg':  'rgba(212, 160, 23, 0.08)',
+    '--theme-nav-active-bg': 'linear-gradient(90deg, rgba(25, 214, 232, 0.18) 0%, rgba(25, 214, 232, 0) 100%)',
+
+    // ── Legacy tokeny (mapping na luxury) ──
     '--bg-primary':       '#050508',
     '--bg-secondary':     '#0a0a0f',
-    '--bg-card':          '#0c0c12',
-    '--bg-card-hover':    '#121220',
-    '--accent':           '#d4a017',
-    '--accent-bright':    '#f0c040',
+    '--bg-card':          'var(--theme-surface)',
+    '--bg-card-hover':    'var(--theme-surface-soft)',
+    '--accent':           'var(--theme-accent)',
+    '--accent-bright':    'var(--theme-accent-bright)',
     '--accent-dim':       '#8a6510',
-    '--accent-soft':      'rgba(212, 160, 23, 0.18)',
-    '--text-primary':     '#f0e8d0',
-    '--text-secondary':   '#907840',
+    '--accent-soft':      'var(--theme-border-soft)',
+    '--text-primary':     'var(--theme-text)',
+    '--text-secondary':   'var(--theme-text-muted)',
     '--text-muted':       '#504030',
-    '--border':           '#1a1510',
+    '--border':           'var(--theme-border-soft)',
     '--border-subtle':    '#0a0808',
-    '--border-strong':    '#d4a017',
+    '--border-strong':    'var(--theme-border)',
     '--success':          '#3ecf8e',
     '--warning':          '#d4a017',
     '--danger':           '#c04040',
     '--info':             '#d4a017',
     '--text-on-accent':       '#050508',
     '--text-on-danger':       '#ffffff',
     '--bg-overlay':           'rgba(0, 0, 0, 0.8)',
     '--success-soft':         'rgba(62, 207, 142, 0.12)',
     '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
     '--warning-soft':         'rgba(212, 160, 23, 0.16)',
     '--warning-soft-border':  'rgba(212, 160, 23, 0.4)',
     '--danger-soft':          'rgba(192, 64, 64, 0.14)',
     '--danger-soft-border':   'rgba(192, 64, 64, 0.4)',
     '--danger-focus-ring':    'rgba(192, 64, 64, 0.3)',
+
+    // ── Typography ──
     '--font-logo':        '"Cinzel Decorative", "Cinzel", Georgia, serif',
     '--font-display':     '"Cinzel", "Playfair Display", Georgia, serif',
     '--font-body':        '"Lato", "Lora", Georgia, serif',
+    '--font-script':      '"Great Vibes", "Brush Script MT", cursive',
+
+    // ── Layout chrome ──
+    '--header-h':         '88px',
+    '--header-bg':        '#050508',
+    '--frame-pad-y':      '40px',
+    '--frame-pad-x':      '18px',
+    '--sidebar-w':        '280px',
+
+    // ── Logo asset ──
+    '--asset-logo':           `url('${decor}/logo.webp')`,
+    '--asset-logo-w':         '260px',
+    '--asset-logo-w-mobile':  '200px',
+    '--logo-img-display':     'block',
+    '--logo-fallback-display':'none',
+
+    // ── Welcome card medallion ──
+    '--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,
   },
   fonts: {
     logo: 'Cinzel Decorative',
     display: 'Cinzel',
     body: 'Lato',
   },
   thumbnail: '/themes/thumbnails/zlaty-standard.webp',
   background: '/themes/backgrounds/zlaty-standard.webp',
   decorationsModule: () => import('./decorations.css'),
   reducedMotion: 'safe',
 };
```

**Risk lint:colors:** `lint:colors` skript zakazuje hardcoded hex barvy v komponentech, ale theme `index.ts` má whitelist (jediné místo, kde hex jsou OK). Ověřím při testu.

---

## 4. Decorations CSS — `src/themes/themes/zlaty-standard/decorations.css`

**Plný přepis souboru.** Z 27 řádků na ~140. Strukturováno do 12 sekcí dle specu §3.

```css
/* ── Zlatý standard — královský kosmický portál (spec 1.0c)
   Aktivuje se přes [data-theme="zlaty-standard"]. UI je CSS-native:
   glass black panely, gold + subtle cobalt akcenty, SVG corner ornamenty,
   atmosférický overlay nad kosmickým background. */

[data-theme="zlaty-standard"] {
  background-color: #020308;
}

/* ── 1. Atmosférický overlay nad backgroundem ── */
[data-theme="zlaty-standard"][data-shell="ikaros"]::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--theme-bg-overlay);
  pointer-events: none;
  z-index: 0;
}

/* ── 2. Glass panely — sidebar + right + welcome + novinky ── */
[data-theme="zlaty-standard"] [data-frame-panel="sidebar"],
[data-theme="zlaty-standard"] [data-frame-panel="right"],
[data-theme="zlaty-standard"] [data-frame-panel="card"],
[data-theme="zlaty-standard"] [data-frame-panel="novinky"] {
  position: relative;
  background: var(--theme-surface);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border: 1px solid var(--theme-border);
  border-radius: 22px;
  isolation: isolate;
  box-shadow:
    0 0 24px rgba(0, 0, 0, 0.6),
    inset 0 0 18px rgba(212, 160, 23, 0.08);
}

/* ── 3. Welcome andel medallion ── */
[data-theme="zlaty-standard"] [data-andel-medallion] {
  width: 200px;
  height: 215px;
  background-image: var(--asset-andel-medallion, none);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
  filter: drop-shadow(0 0 16px var(--theme-glow-gold));
}

/* ── 4. Section title — diamondy + zlatá linka ── */
[data-theme="zlaty-standard"] [class*="sectionTitle"] {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--theme-heading);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-family: var(--font-display);
}
[data-theme="zlaty-standard"] [class*="sectionTitle"]::before,
[data-theme="zlaty-standard"] [class*="sectionTitle"]::after {
  content: '◆';
  color: var(--theme-accent);
  font-size: 0.7em;
  flex: 0 0 auto;
}
[data-theme="zlaty-standard"] [class*="sectionTitle"]::before {
  background: linear-gradient(90deg, transparent, var(--theme-border) 30%, var(--theme-border));
  /* zlatá linka před prvním ◆ — přes inline-block trick řešíme v decorations: */
}
/* (pokud markup neumožní inline before/after gradient line, fallback = jen ◆ na koncích — vizuální kontrola) */

/* ── 5. Header logo banner (zlatý standard) ── */
[data-theme="zlaty-standard"] header [class*="logoImg"] {
  width: var(--asset-logo-w);
  height: var(--header-h);
  background-image: var(--asset-logo);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: left center;
  filter: drop-shadow(0 0 12px var(--theme-glow-gold));
  -webkit-mask-image: radial-gradient(ellipse 95% 85% at center, black 60%, transparent 100%);
  mask-image: radial-gradient(ellipse 95% 85% at center, black 60%, transparent 100%);
}

/* ── 6. Header tlačítka — zlatý border + hover/active glow ── */
[data-theme="zlaty-standard"] [class*="headerBtn"] {
  background: var(--theme-surface-strong);
  border: 1px solid var(--theme-border-soft);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transition: border-color 180ms ease-out, box-shadow 180ms ease-out;
}
[data-theme="zlaty-standard"] [class*="headerBtn"]:hover {
  border-color: var(--theme-border);
  box-shadow: 0 0 12px var(--theme-glow-gold);
}
[data-theme="zlaty-standard"] [class*="headerBtnActive"] {
  border-color: var(--theme-border-cyan);
  box-shadow: 0 0 12px var(--theme-glow-cyan);
}

/* ── 7. Nav položky — tmavé + zlatý border, aktivní = cobalt glow ── */
[data-theme="zlaty-standard"] [class*="navItem"] {
  background: transparent;
  border: 1px solid var(--theme-border-soft);
  border-radius: 10px;
  transition: background 180ms ease-out, border-color 180ms ease-out, box-shadow 180ms ease-out;
}
[data-theme="zlaty-standard"] [class*="navItem"]:hover {
  background: var(--theme-nav-hover-bg);
  border-color: var(--theme-border);
}
[data-theme="zlaty-standard"] [class*="navItemActive"] {
  background: var(--theme-nav-active-bg);
  border-color: var(--theme-border-cyan);
  color: var(--theme-text);
  box-shadow: 0 0 14px var(--theme-glow-cyan);
}
[data-theme="zlaty-standard"] [class*="navItemActive"] [class*="navItemIcon"] {
  filter: drop-shadow(0 0 6px var(--theme-glow-cyan));
}

/* ── 8. PJ badge u světa kde user je owner ── */
[data-theme="zlaty-standard"] [data-pj-badge] {
  display: inline-block;
  margin-left: auto;
  padding: 2px 7px;
  background: linear-gradient(180deg, var(--theme-accent-bright), var(--theme-accent));
  color: var(--bg-primary);
  font-size: 0.65em;
  font-weight: 700;
  letter-spacing: 0.1em;
  border-radius: 4px;
  text-transform: uppercase;
  box-shadow: 0 0 8px var(--theme-glow-gold);
}

/* ── 9. Heading ◆ marker (původní pravidlo z 1.0b — zachováno) ── */
[data-theme="zlaty-standard"] h1::before,
[data-theme="zlaty-standard"] h2::before {
  content: '◆';
  color: var(--theme-accent);
  margin-right: 8px;
  font-size: 0.7em;
}

/* ── 10. Reduced motion safe (žádné animace navíc) ── */
@media (prefers-reduced-motion: reduce) {
  [data-theme="zlaty-standard"] * {
    transition: none !important;
  }
}
```

**Pozn:** Použít `[class*="sectionTitle"]` apod. místo `.sectionTitle` — CSS modules generují hashed class names (`IkarosLayout_sectionTitle__xY7Z9`), substring match je standardní pattern v decorations (modre-nebe to taky tak dělá).

**Pozn k §4 sekce „zlatá linka":** Pseudo-elementy `::before`/`::after` mohou nést jen jeden content. Linku + diamond na téže straně dosáhneme přes **outline trick** nebo **flex grow span** v markupu. Při implementaci ověřím, jak to dnes řeší modre-nebe `sectionTitle`. Pokud neexistuje elegantní CSS-only řešení bez markup změny, **fallback** = jen `◆` na obou stranách (bez linky), což stále odpovídá obr. 2 dostatečně.

---

## 5. IkarosLayout.tsx — PJ badge

### 5.1 Importy + helper

V `IkarosLayout.tsx` rozšířit existující signatury `SidebarContent` a `RightPanel` o předaný `currentUserId` (nebo přečíst přímo přes atom):

```diff
@@
 function SidebarContent({
   isAuthenticated,
   onNav,
 }: {
   isAuthenticated: boolean;
   onNav?: () => void;
 }) {
+  const currentUser = useAtomValue(currentUserAtom);
   const myWorldsQuery = useMyWorlds();
   const publicWorldsQuery = usePublicWorlds();
   ...
```

(Identicky v `RightPanel`.)

### 5.2 Render badge

V mapě světů přidat za label:

```diff
   {worlds?.slice(0, 8).map((w) => (
     <Link key={w.id} to={`/svet/${w.id}`} className={s.navItem} onClick={onNav}>
       <span className={s.worldOnlineDot} />
       <span className={s.navItemLabel}>{w.name}</span>
+      {currentUser?.id && w.ownerId === currentUser.id && (
+        <span className={s.pjBadge} data-pj-badge>PJ</span>
+      )}
     </Link>
   ))}
```

### 5.3 CSS — `IkarosLayout.module.css`

Přidat základní layout (themed barvy řeší `decorations.css` přes `[data-pj-badge]`):

```diff
+/* ── PJ badge — base layout, theme barvy v decorations.css ── */
+.pjBadge {
+  display: inline-block;
+  margin-left: auto;
+  padding: 1px 6px;
+  font-size: 10px;
+  font-weight: var(--weight-bold);
+  border-radius: 4px;
+  letter-spacing: 0.08em;
+  text-transform: uppercase;
+  background: var(--accent-soft);
+  color: var(--accent-bright);
+  flex-shrink: 0;
+}
```

(Ostatní témata dostanou základní zlatý chip; zlatý standard ho přebije plnou variantou.)

### 5.4 Místa renderu

V `IkarosLayout.tsx`:
- `SidebarContent` Vesmíry sekce (řádek ~120)
- `RightPanel` Moje světy sekce (řádek ~170)

**Risk:** v `RightPanel` se renderuje **pouze pro `isAuthenticated` (logged-in)**, takže `currentUser` tam vždy existuje. V `SidebarContent` při anonymu nejsou moje světy ale public — takže badge se nezobrazí (`currentUser?.id` undefined). OK.

---

## 6. Pořadí implementace (commit list)

| # | Změna | Soubory | Commit zpráva |
|---|---|---|---|
| 1 | Asset pipeline extension | `scripts/optimize-theme-assets.mjs` | `chore(themes): krok 1.0c #1 — optimize-theme-assets podporuje decor target` |
| 2 | Token model zlatý standard | `src/themes/themes/zlaty-standard/index.ts` | `feat(themes): krok 1.0c #2 — zlaty-standard luxury tokens (gold + cobalt)` |
| 3 | Decorations CSS | `src/themes/themes/zlaty-standard/decorations.css` | `feat(themes): krok 1.0c #3 — zlaty-standard glass panely + ornamenty` |
| 4 | PJ badge | `src/app/layout/IkarosLayout/IkarosLayout.tsx`, `IkarosLayout.module.css` | `feat(layout): krok 1.0c #4 — PJ badge u světa, kde user je owner` |
| 5 | (Po dropu assetů) | spuštění `npm run themes:optimize` → vygeneruje `public/themes/zlaty-standard/decor/{logo,andel-medallion}.webp` | (commit s assety) `chore(assets): krok 1.0c #5 — zlaty-standard decor (logo, andel-medallion)` |

Commits 1–4 mohou jít před assety (token sloty mají fallback `none`); commit 5 následuje až po dropu uživatelem.

---

## 7. Test plán

### 7.1 Manuální vizuální check
- [ ] Spustit `npm run dev`, přihlásit se, přepnout na Zlatý standard v ThemeSwitcher
- [ ] Úvodník — porovnat s `02 cíl.png`:
  - background prosvítá ✅
  - glass panely sidebar + right ✅
  - welcome medailon vlevo + text vpravo ✅
  - „Projektu Ikaros." cobalt highlight ✅
  - signatura Great Vibes ✅
  - section title ◆ ✅
  - aktivní nav cobalt glow ✅
  - logo banner v hlavičce ✅
- [ ] PJ badge u světa kde user je owner (zlatý chip)
- [ ] Hover stavy tlačítek — zlatý glow

### 7.2 Vizuální regrese ostatních témat
- [ ] Přepnout na **Modré nebe** — žádná změna, vypadá jako před úpravou
- [ ] Přepnout na **Sci-fi** — žádná změna
- [ ] Přepnout na **Hospoda** — žádná změna
- [ ] (Storybook gallery: Themes/Gallery → All Themes — quick scan thumbnails)

### 7.3 Mobil-desktop sweep (`mobil-desktop` skill)
- [ ] DevTools → 375×667 (iPhone SE) — drawer sidebar, medailon nad textem, čitelné texty, PJ badge nepřetéká
- [ ] 768×1024 (iPad) — 2-sloupcový, pravý panel pod
- [ ] 1440×900 (desktop) — full 3-sloupcový

### 7.4 Lint + build + tests
- [ ] `npm run lint`
- [ ] `npm run lint:colors` (theme index.ts whitelist OK?)
- [ ] `npm run audit:contrast` (WCAG AA pro nové barvy)
- [ ] `npm run test:run` (140 FE testů musí projít)
- [ ] `npm run build` (production bundle OK)

### 7.5 Edge cases
- [ ] Anonym (logged-out): úvodník bez pravého panelu, sidebar bez Chat sekce, žádná regrese
- [ ] User bez vlastních světů: žádný PJ badge, jen seznam veřejných
- [ ] User s 1+ vlastními světy: PJ badge u nich

---

## 8. Po dokončení (housekeeping)

- [ ] Zaškrtnout v `roadmap-fe.md` — přidat řádek **1.0c — Zlatý standard visual upgrade ✅** v sekci Fáze 1 (mezi 1.0b a 1.1)
- [ ] Pokud R5 (cobalt aktivní stav) uživatel nakonec odmítne → fallback patch (3 řádky CSS — změnit `--theme-border-cyan` references na `--theme-border` v navItemActive a headerBtnActive)
- [ ] Aktualizace `docs/dluhy.md` pokud něco zůstane otevřené
- [ ] Volitelně: `purpose.md` / `decisions.md` / `ai-notes.md` v `phase-1/_side-tasks/1.0c-zlaty-standard/` (ne nutné)

---

## 9. Co NEDĚLÁM v rámci 1.0c

- ❌ Replikace na zbylých 19 témat (původní 1.0c v ChatGPT/Gemini briefu — to je jiný scope, samostatný spec později)
- ❌ Animovaný astroláb (background ho má staticky)
- ❌ Smazání Oblíbených článků/obrázků (uživatel chtěl zachovat)
- ❌ Změna BE / API / typů
- ❌ Nové externí fonty (Cinzel + Cinzel Decorative + Lato + Great Vibes — všechny už máme v themes)
- ❌ Refaktor `IkarosCard`, `CornerOrnament`, `DashboardPage` (struktura sedí)
- ❌ Globální `:root` tokeny (vše scoped na `[data-theme="zlaty-standard"]`)

---

**Schválení:** ⏳ Čeká na PJ. Po souhlasu **začnu kódovat v pořadí dle §6**.

> Uživatelská poznámka 2026-05-09: „Pak to stejně asi budeme ladit" — počítám s tím, drobné iterace po implementaci očekávané (overlay opacity, glow intenzita, cobalt vs gold-only na aktivním stavu). Plán má v §0 a §8 vyhrazené mechanismy pro rychlou iteraci.
