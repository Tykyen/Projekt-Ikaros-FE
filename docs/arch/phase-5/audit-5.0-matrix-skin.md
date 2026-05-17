# Design audit — Matrix skin (krok 5.0)

**Status:** podklad pro implementační plán 5.0
**Vstup:** `C:\Matrix\Matrix\frontend\src\styles\matrix.tokens.scss` (starý `--mx-*` systém), spec-5.0
**Sken:** `frontend-design` skill, 2026-05-17

---

## 1. Token mapování `--mx-*` → `--theme-*` kontrakt

Theme kontrakt (povinné tokeny, dle `modre-nebe` + `_shared/tokens.css` aliasů) a zdroj z Matrix systému:

| `--theme-*` kontrakt | Zdroj `--mx-*` | Pozn. |
|---|---|---|
| `--theme-bg-overlay` | — (nový) | linear darken nad `matrix-bg`; odvodit z `--mx-ink-900` |
| `--theme-surface` | `--mx-surface-1` `rgba(18,12,52,.48)` | glass panel |
| `--theme-surface-strong` | `--mx-ink-800` / `--mx-diary-frame-bg` | |
| `--theme-surface-soft` | `--mx-surface-3` | |
| `--theme-border` | `--mx-bd-violet` `rgba(185,120,255,.45)` | |
| `--theme-border-soft` | `--mx-bd-soft` `rgba(165,125,255,.22)` | |
| `--theme-border-cyan` | `--mx-bd-cyan` `rgba(80,220,255,.55)` | |
| `--theme-text` | `--mx-text` `rgba(210,214,232,.78)` | |
| `--theme-text-muted` | `--mx-text-muted` `rgba(170,176,202,.58)` | |
| `--theme-heading` | `--mx-text-strong` / `--mx-violet-500` | |
| `--theme-accent` | `--mx-violet-500` `#c86dff` | brand |
| `--theme-accent-bright` | — (nový) | světlejší violet, ~`#e0a8ff` |
| `--theme-accent-cyan` | `--mx-cyan-500` `#3fe0ff` | sekundární |
| `--theme-glow-gold` → přejmenovat | `--mx-cta-s-glow-*` | Matrix nemá gold → glow violet |
| `--theme-glow-cyan` | `--mx-cta-p-glow-*` | |
| `--theme-shadow` | `--mx-shadow-1` | |
| `--theme-nav-hover-bg` / `-active-bg` | odvodit z `--mx-violet-700` | |
| `--header-bg` | `--mx-ink-800` (ne gradient — viz modre-nebe pozn.) | |

### Co `--mx-*` NEMÁ — musí se v Matrix skinu nově zvolit

- **Fonty** (`--font-logo / -display / -body`) — `matrix.tokens.scss` fonty neřeší. **Nutná volba** — viz §3.
- **Semantické stavy** `--success / --warning / --danger / --info` (+ `-soft`, `-soft-border`). Částečný zdroj: `--mx-diary-green` (success), `--mx-diary-red` (danger). Warning/info chybí → odvodit (žluto-violet pro warning, `--mx-cyan-500` pro info).
- `--text-on-accent` / `--text-on-danger` — tmavý ink (`#070812`).
- Role chip / RoleStar override — volitelné (default `_shared/tokens.css` stačí).
- Layout chrome (`--header-h`, `--frame-pad-*`, `--sidebar-w`, asset rozměry).

**Závěr:** `--mx-*` pokrývá barvy / surfaces / borders / shadows ~80 %. Doplnit fonty + semantické stavy + accent-bright. Mapování není 1:1 přejmenování — `--mx-*` má jemné odstíny pro 3D karty (`--mx-msg-*`, `--mx-diary-*`, `--mx-side-*`), které theme kontrakt neřeší; ty se buď zahodí, nebo přidají jako extra Matrix-specific tokeny (jen pokud je `decorations.css` Matrixu využije).

---

## 2. Originalita ornamentů — ⚠️ kolize s `kyberpunk`

Skin `kyberpunk` (`src/themes/themes/kyberpunk/`) už obsadil prostor „tmavý sci-fi neon": cyan `#00f0ff` + magenta `#ff0080`, midnight-indigo panely, **digital rain**, **HUD bracket rohy**, **CJK watermarky**, **broken neon flicker**, **RGB-split aberrace**. Matrix paleta (violet + cyan, tmavé ink) je téže rodiny.

**Matrix skin se MUSÍ odlišit jiným ornamentálním vokabulářem** (memory `feedback_skin_originality`). Zakázáno recyklovat cokoli z kyberpunku: žádný rain, žádné HUD brackety, žádné CJK glyphy, žádný flicker.

### Navržený směr — „dimenzionální glass / multivesmírný rift"

Matrix svět je o **prolínání dimenzí a realit** — ne neonová ulice. Vizuální jazyk:

- **Prizmatická refrakce panelů** — okraj glass panelu nese jemný violet→cyan světelný lom (jako hrana skla), ne neonový outline. Statický gradient, žádný neon halo.
- **Konstelační síť** — tenké linie spojující světelné uzly v pozadí / rozích; odkazuje na pavučinu vztahů a propojené světy. Pomalý, téměř statický drift.
- **Rift glow** — jedna diagonální světelná trhlina v atmosférickém overlay (radiální violet jádro → cyan okraj). Klid, ne blikání.
- **Hmota skla** — `backdrop-filter: blur` (`--mx-blur-panel: 14px`) + jemný vnitřní highlight nahoře (`inset 0 1px 0 rgba(255,255,255,.06)`) — 3D dojem ze starého `--mx-*` systému zachovat, je to Matrix podpis.

Tonalita: **klidná, hloubková, kontemplativní** — opak kyberpunkové překotné neon-chaotičnosti. Stejná paleta, opačná energie.

Ornamenty inline SVG data-uri v `vars` (vzor kyberpunk `svg()` helper). Žádné AI-gen WEBP rastry mimo `matrix-bg` pozadí.

---

## 3. Fonty

Kyberpunk: Audiowide / Bebas Neue / Share Tech Mono. **Matrix nesmí použít žádný z nich.** Návrh páru (k potvrzení / úpravě v impl. plánu — distinctive, ne generické):

- **Display / logo:** geometrický sci-fi font s klidnou linií — kandidáti: `Unbounded`, `Michroma`, `Sora` (široké, ne arcade jako Audiowide).
- **Body:** čitelný humanistický sans s lehce technickým charakterem — `Exo 2`, `Chivo`, případně `Inter`-free alternativa.
- ⚠️ Vyhnout se `Orbitron` (klišé sci-fi) a `Inter` / system fonts (memory: generické).

---

## 4. Doporučení do implementačního plánu

1. Matrix skin = `src/themes/themes/matrix/` — `index.ts` (`Theme`, `scope: 'world'`) + `decorations.css`.
2. Token mapování dle §1 — `--mx-*` přepsat na `--theme-*` hodnoty (ne aliasovat `--mx-*`, ten v Ikaru neexistuje).
3. Doplnit fonty (§3), semantické stavy, `accent-bright`.
4. `decorations.css` — ornamentální jazyk dle §2; scoped `[data-theme="matrix"]`, inline SVG. Žádná recyklace kyberpunku.
5. `matrix-bg.png` → asset pipeline (`npm run themes:optimize` → WebP, thumbnail).
6. `ThemeId` union + `THEMES` registry rozšířit o `'matrix'`.
7. Vizuální smoke proti kyberpunku — vedle sebe v ThemeGallery, ověřit že nepůsobí jako varianta.
