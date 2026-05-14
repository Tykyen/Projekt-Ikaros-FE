# Design audit 2.4 — Detail světa + welcome view

**Status:** Návrh — čeká na výběr směru
**Datum:** 2026-05-14
**Skill:** `frontend-design`
**Souvisí se:** [spec-2.4.md](./spec-2.4.md) §4.5 (Detail), §4.5b (Welcome)

---

## Kontext

Dvě stránky, dva role:

- **`/svet/:id/info`** = **vitrína světa**. Anon/nečlen sem přichází z karet ve Vesmírech / dashboardu. Cíl: vzbudit zájem, dát info, dotlačit k Join. Konkurent: e-shop product page, "buy now" CTA.
- **`/svet/:id`** = **návrat domů** pro člena. Cíl: rychle se zorientovat a kliknout dál do gameplay. Konkurent: hotel lobby, IDE start screen.

**Skin-agnosticita:** komponenta používá výhradně `var(--surface-1)`, `var(--accent)`, `var(--frame-border)`, `var(--font-display)`, `var(--font-body)`. **Ornamenty řeší skin layer** (memory: `feedback_theme_isolation`, `feedback_skin_originality`). Audit se zaměřuje na:

1. **Strukturu** layoutu (kompozice, hierarchie, asymetrie)
2. **Scale** (typografická hierarchie, spacing system)
3. **Motion** (entrance, hover, focus, transitions)
4. **Stavy** (loading, error, 5 stavů CTA)
5. **Mobile vs desktop** přechody

---

## 3 vizuální směry

### Směr A — „Almanach" (editorial magazine)

**Mood:** seriózní, dlouhotrvající, čtené. Inspirace: The Atlantic, Harper's, časopis Tvar. Svět je článek, hráč je čtenář, který se rozhoduje.

**Kompozice Detail (`/info`):**

```
┌────────────────────────────────────────────────────────────────┐
│  ← Zpět na Vesmíry                              [≡ Sdílet]    │ ← top bar (lehký)
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  No. 042 · FANTASY · 2026-05-14                  ← indicia    │
│                                                                │
│  Šedý           Hrad           u                              │
│  Zapomenutých           Vod                                    │  ← H1 96px, ragged
│                                                                │
│  Mistr: Tomáš · 12 hráčů · Otevřený svět                     │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────── Popis ───────┐    ┌─── Meta sidebar ───┐           │
│  │                     │    │                     │           │
│  │ Tento svět je o…    │    │ TÓNY                │           │
│  │ (drop cap T)        │    │ Temný · Hrdinský    │           │
│  │ ipsum lorem dolor   │    │ Mystický            │           │
│  │ sit amet, justified │    │                     │           │
│  │ text…               │    │ KOSTKY              │           │
│  │                     │    │ d20 · d6 · 2d6      │           │
│  │ (multi-paragraph)   │    │                     │           │
│  │                     │    │ SYSTÉM              │           │
│  │ ─────               │    │ Matrix              │           │
│  │                     │    │                     │           │
│  │ Hledám hráče:       │    │ KAPACITA            │           │
│  │ "Aktivní a kreativní│    │ 12 / 20 (8 volných)│           │
│  │  hráče, kteří…"     │    │                     │           │
│  │                     │    │ ┌─────────────────┐ │           │
│  └─────────────────────┘    │ │ Požádat o vstup │ │ ← sticky  │
│                              │ └─────────────────┘ │           │
│                              └─────────────────────┘           │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Vlastník                                                      │
│  ┌─[avatar]─┐  Tomáš                                          │
│  │          │  PJ tohoto světa                                │
│  └──────────┘  Členem od 2025-11-03                           │
└────────────────────────────────────────────────────────────────┘
```

**Hierarchie typografie:**
- **H1 (jméno světa)**: `clamp(48px, 8vw, 96px)`, `var(--font-display)`, line-height 0.95, letter-spacing -0.02em, **ragged right** (více řádků pokud dlouhé jméno).
- **Indicia stripe**: 12px UPPERCASE TRACKED (letter-spacing 0.25em), `var(--text-muted)`. Drobná masthead-like detail.
- **Drop cap** v popisu (`p::first-letter`): 64px, float-left, padding-right 12px, `var(--font-display)`.
- **Meta labels** (TÓNY, KOSTKY, …): 11px UPPERCASE TRACKED, `var(--text-muted)`, margin-bottom 4px nad hodnotou.

**Spacing:**
- Vertical rhythm 8px base, sekce padding `48px 0`.
- Desktop max-width 1200px, content gutter 80px.
- Mobile: vše 1col, padding 20px.

**Motion:**
- Page load: stagger reveal — indicia → H1 → meta → popis → sidebar (0/100/200/300/400ms `fadeUp`). Respekt `prefers-reduced-motion`.
- Hover na CTA: `transform: scale(1.02)` + shadow lift, transition 200ms cubic-bezier(.4,0,.2,1).
- Drop cap při hover popis sekce: rotace -2deg, pomalá (400ms).
- Žádné parallax (cheesy pro tento mood).

**Welcome view (`/svet/:id`):**
```
┌────────────────────────────────────────┐
│  Vítej zpět v Šedém Hradu              │ ← H1 56px, ragged
│  ─────                                  │ ← hairline divider 32px
│  Vstoupil jsi naposledy 14. května     │ ← 14px italic
│                                         │
│  ┌─Chat─┐ ┌─Stránky─┐ ┌─Mapa─┐ ┌─Postavy─┐  ← čtvercové tiles, 2x2 grid
│  │  💬  │ │   📖   │ │  🗺  │ │   🎭   │
│  │      │ │        │ │      │ │        │
│  └──────┘ └────────┘ └──────┘ └────────┘
│                                         │
│  ─────                                  │
│  Aktivita ve světě a kalendář přibyde  │ ← placeholder
│  brzy.                                  │
└────────────────────────────────────────┘
```

**Pro:** seriózní, slouží textu, skin-agnostic, „čte se" jako kniha — RPG souznění bez nutnosti dekorace v komponentě.
**Proti:** méně „WOW" první dojem; v dark fantasy skinu může působit suše bez ornamentu skinu.

---

### Směr B — „Tarot" (portrétová karta)

**Mood:** rituální, sběratelský, „každý svět je karta v mém balíčku". Inspirace: tarotová sada, Magic the Gathering proxy cards, Pentiment.

**Kompozice Detail:**

```
┌──────────────────────────────────────────────────────┐
│  ←                                          [Sdílet] │
│                                                       │
│           ┌──────────────────────────┐               │
│           │                          │               │
│           │   [hero image / gradient]│               │
│           │                          │               │
│           │                          │               │
│           │   ŠEDÝ HRAD              │               │ ← portrait card 5:8
│           │   ════════════           │               │   max-width 540
│           │                          │               │
│           │   Fantasy · Mystický     │               │
│           │   ⚂ d20 · 2d6 · d6       │               │
│           │   ⚜ Matrix               │               │
│           │   ⚇ 12/20                │               │
│           └──────────────────────────┘               │
│                                                       │
│                  ┌──────────────────┐                │
│                  │ Požádat o vstup  │  ← CTA pod kartou
│                  └──────────────────┘                │
│                                                       │
│           ───── O světě ─────                        │ ← divider s ornamentem (skin)
│                                                       │
│           Tento svět je o…                           │
│           (centered text, max-width 540)             │
│                                                       │
│                                                       │
│           ───── Vlastník ─────                       │
│           [avatar]                                   │
│           Tomáš                                      │
└──────────────────────────────────────────────────────┘
```

**Hierarchie:**
- **Card** = `aspect-ratio: 5/8`, `max-width: 540px`, `border: 2px solid var(--frame-border)`, `padding: 32px`, `background: linear-gradient(135deg, var(--surface-2), var(--surface-1))`. Skin přidá ornamenty rohu/rámu.
- **Card title** uvnitř: `var(--font-display)`, 36px, centered, podtržítko `border-bottom: 1px solid var(--accent)` na ~60% šířce.
- **Card meta řádky**: 14px, `var(--font-body)`, s vlastními glyfy ⚂ ⚜ ⚇ (Unicode), padded vertically.

**Spacing:**
- Card center-aligned, vertikálně 60vh viewport-relativní (na desktop), 100% width na mobile.
- Vše ostatní (popis, owner) centered s max-width 540px (stejná šířka jako karta — vytváří „karta + komentář" rytmus).

**Motion:**
- Page load: karta **flip-in** ze 90° rotace na 0° (700ms `cubic-bezier(.34,1.56,.64,1)`). Stagger: CTA appear po 800ms.
- Hover na kartě: `transform: rotateY(2deg) translateY(-4px)` + shadow expansion.
- Klik na CTA: 3D press feedback (`transform: scale(.97)` 100ms, pak release).

**Welcome view:**
- Centered card-like layout, žádný flip — pouze fade.
- 4 dlaždice ve 2x2 jako 4 mini-karty.

**Pro:** memorable, ikonická, RPG fanouška chytne; mobile-friendly (vertikálně přirozené).
**Proti:** méně místa pro text popisu (poetic limit 540px); flip animace na low-end mobilu = jank; všechny světy vypadají „stejně silně" → ztráta hierarchie podle obsahu.

---

### Směr C — „Manifest" (brutalist minimalism)

**Mood:** moderní, kontrastní, „muzejní pop". Inspirace: Aesop, Jonathan Adler e-shop, Apple product pages. Nečekané pro RPG kontext = pamatuje se.

**Kompozice Detail:**

```
┌─────────────────────────────────────────────────────────────┐
│  ←                                                  [Sdílet] │
│                                                              │
│                                                              │
│                                                              │
│       Šedý                                                   │
│                                                              │ ← H1 120px, levý
│       Hrad                                                   │   sloupec, weight 200
│                                                              │
│                                                              │
│       u Zapomenutých Vod                                     │ ← podtitul 24px
│                                                              │
│                                                              │
│                  ┌─────────────────────────────────────┐    │
│                  │ Požádat o vstup                  →  │    │
│                  └─────────────────────────────────────┘    │
│                                                              │
│                                                              │
│       Fantasy. Mystický. 12 hráčů. Otevřený.                │ ← jeden řádek meta
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓ scroll
┌─────────────────────────────────────────────────────────────┐
│       Popis                                                  │
│                                                              │
│       Tento svět je o…                                      │
│       (text level large 22px, line-height 1.7)              │
│                                                              │
│       ─────                                                  │
│                                                              │
│       Tóny                  Kostky                          │
│       Temný                 d20                              │ ← 2 sloupce, large
│       Hrdinský              2d6                              │
│       Mystický              d6                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓ scroll
┌─────────────────────────────────────────────────────────────┐
│       Vlastník                                               │
│       [avatar 80px] Tomáš                                    │
└─────────────────────────────────────────────────────────────┘
```

**Hierarchie:**
- **H1**: `clamp(72px, 12vw, 160px)`, weight 200 (thin), letter-spacing -0.04em, `var(--font-display)`. Multi-line dle slov (slovo per řádek).
- **CTA**: full-width až `max-width: 600px`, padding `24px 32px`, žádný border-radius (sharp), `var(--accent)` background, arrow `→` vpravo. Při hover: arrow translate-x +8px.
- **Body text**: 22px, `var(--font-body)`, line-height 1.7, `max-width: 60ch`. Nikoli justified — left-aligned.

**Spacing:**
- Hero zabírá ~80vh. Jeden „akt" per scroll.
- Section separators = pouze whitespace (žádné dividery), 120px vertical padding.

**Motion:**
- Page load: H1 **per slovo fade-up** stagger (0/120/240ms), pak meta line po 600ms.
- Scroll: každá další sekce má `scroll-snap-align: start`. Reveal on scroll (intersection observer): translateY(40px) → 0, opacity 0 → 1.
- CTA hover: arrow `→` translate-x +8px (200ms ease), background slightly darkens.

**Welcome view:**
```
┌────────────────────────────────────────┐
│                                         │
│   Vítej zpět.                          │ ← H1 56px
│                                         │
│                                         │
│   Šedý Hrad                             │ ← H2 28px, ragged
│                                         │
│                                         │
│   01 Chat              02 Stránky      │
│      ──────              ──────        │ ← link-like tiles
│      Pokračovat          Číst svět     │
│      v rozhovoru.        a pravidla.   │
│                                         │
│   03 Mapa              04 Postavy      │
│      ──────              ──────        │
│      Otevřít atlas.      Tvá družina.  │
│                                         │
└────────────────────────────────────────┘
```

**Pro:** moderní, neorganický kontrast k „fantasy" — pamatuje se přesně proto že je netypické; čtenář v klidu (žádný vizuální noise); skin přidá texturu/ornament a stane se to bezpečným.
**Proti:** může „neevokovat fantasy" pro tradiční hráče; vysoký scroll na desktopu (3 akty); H1 120px+ vyžaduje krátký název (dlouhé jméno přebije design).

---

## Doporučení

**Směr A — Almanach.** Důvody:

1. **Slouží primární funkci** = čtenář se rozhoduje, potřebuje text. Editorial dvousloupec dává popisu (long-form) i meta (scan-friendly) každému svůj rytmus.
2. **Skin-agnostic z definice** — pracuje s typografií a kompozicí, ne s dekorací. Skin přidá ornamenty rámů, drop caps, dividery — komponenta jen drží strukturu.
3. **Robust pro různé délky obsahu** — H1 96px tolerable pro krátké i dlouhé jména světa (ragged right); meta sidebar má jasné sekce nezávislé na počtu tónů/kostek.
4. **Konzistentní s 2.3 Workshop** — `CreateWorldPage` je hustá, ale čistá. „Almanach" je její vitrína (form vs. publication).
5. **Welcome view** přirozeně navazuje: krátký nadpis + 4 dlaždice = „obálka časopisu" oproti „článku" Detailu.

**Sekundární doporučení (pokud chceš odvážnější):** **Směr C — Manifest**, ale jen pokud jsi OK s tím, že detail bude vyžadovat víc scrollu a krátké jméno světa (≤ 3 slova) bude vypadat lépe než dlouhé.

**Co bych nevolil:** **Směr B — Tarot**, i když je atraktivní:
- Popis se nevejde — 540px width × 6 řádků = 60 slov max, ale uživatel v 2.3 mohl napsat 1000 znaků (cca 150 slov).
- Flip animace je „cool ale Pro 5%": první návštěvník zaúpí, repeated visitor ji vypne (nebo `prefers-reduced-motion`).
- Skin layer pravděpodobně bude **chtít** dělat rámeček karty sám (rituální / pergamen / arcana ornament) — pokud komponenta už drží portrétovou kartu, skin nemá kam vstoupit. Konflikt s `feedback_skin_originality`.

---

## Společné principy (napříč směry)

- **Žádné hardcoded barvy** — vše `var(--*)`.
- **Žádné konkrétní fonty v komponentě** — pouze `var(--font-display)` / `var(--font-body)` / `var(--font-script)`.
- **Žádné ornamenty/dekorace v komponentě** — to je výhradně skin layer.
- **Touch target ≥ 44px** na mobilu (CTA, dlaždice, link).
- **`prefers-reduced-motion: reduce`** vypne stagger animace (instantní reveal).
- **Aria labels** na všech interactive (CTA, dlaždice, Sdílet, Zpět).
- **Loading state** = skeleton (hero placeholder + 3 lines text) s `shimmer` animací.
- **Error state** = „Svět nenalezen" + 1 link „← Zpět na Vesmíry".

---

## CTA — 5 stavů (společné napříč směry)

| Stav | Label | Ikona | Disabled | Behavior |
|------|-------|-------|----------|----------|
| Anon | „Vstoupit" | — | ne | otevřít LoginModal |
| Public, ne-member | „Vstoupit" | — | ne | `useJoinWorld.mutate()` → toast → navigate `/svet/:id` |
| Open/Private, ne-member | „Požádat o vstup" | — | ne | `useJoinWorld.mutate()` → toast „Žádost odeslána" → přepni na disabled |
| Zadatel | „Žádost odeslána" | ⏳ | **ano** | tooltip „Čekej na schválení PJ" |
| Member | „Vstoupit do hry" | → | ne | `navigate('/svet/:id')` |
| Closed | „Svět je uzavřen" | 🔒 | **ano** | tooltip „PJ svět uzavřel" |

CTA má 3 vizuální variants podle disabled stavu:
- **Primary active**: `background: var(--accent)`, `color: var(--surface-1)`, full opacity, hover shift.
- **Disabled pending** (Zadatel): `background: transparent`, `border: 1px dashed var(--frame-border)`, `color: var(--text-muted)`, žádný hover.
- **Disabled closed**: `background: var(--surface-2)`, `border: 1px solid var(--frame-border)`, ikona 🔒 prominentní.

---

## Otázky k autorovi (před impl. plánem)

1. **Směr A / B / C / vlastní?** Default doporučení: **A — Almanach**.
2. **Hero image** — pokud `world.imageUrl` chybí, fallback na:
   - (a) plný `var(--accent-gradient)` (vibrant)
   - (b) `var(--surface-2)` (decentní, „prázdná galerie")
   - (c) noise texture overlay nad `var(--surface-1)` (atmosférická)
   - Default doporučení: **(b)** — necháme skin layer rozhodnout, jestli přidat texturu.
3. **Welcome view ikony dlaždic** — Unicode emoji (💬 📖 🗺 🎭) nebo SVG (lucide-react: MessageSquare / BookOpen / Map / Users)?
   - Default: **lucide-react** (konzistence s Zpracovat tabem, kde se už používají).
4. **Drop cap v popisu** (Směr A) — ano / ne?
   - Default: **ano**, ale jen na desktopu (≥ 1024px). Mobile by drop cap rozbil flow.

Odpověz výběrem směru (`A` / `B` / `C` / vlastní) + případně 2/3/4. Pak doplním audit dle volby a přejdu k impl. plánu.
