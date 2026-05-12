# Frontend-design audit — krok 1.4

**Datum:** 2026-05-12
**Status:** ✅ Schváleno 2026-05-12 (rozhodnutí §13 + §12.1 (b) + §12.2 barevné odlišení Spravce)
**Vstupy:** `docs/arch/phase-1/spec-1.4.md` ✅, theme tokens `src/themes/_shared/tokens.css`, vzor heraldic upgrade `src/themes/themes/modre-nebe`
**Výstup po schválení:** impl. plán 1.4

---

## 0. Aesthetic direction — „signature cards, banner tabs, scroll queue"

Stránka `/ikaros/uzivatele` má **tři vizuálně odlišné moduly**, které čtenář musí na první pohled rozlišit (i napříč 21 tématy):

| Modul             | Vizuální archetyp                                                                                          | Důvod                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **UserCard**      | „signet" — portrétní karta s rohovou punctuací (cornerstones), avatar = pečeť, text = manuskript           | rychlý vizuální lookup, vzájemně podobné karty se snadno scannují                |
| **PendingActionCard** | „letter / scroll" — landscape karta s levou ikonou aktora, středovým popisem akce, pravými akčními tlačítky | musí být **na první pohled jiná než UserCard** — uživatel chápe „toto je akce"     |
| **Tab nav**       | „banner flags" — taby s decorativními end-caps (reuse `nav-end-cap` z 1.0f pro modré nebe; fallback divider gradient) | hlavní orientační prvek stránky — musí být silnější než vnitřní view-toggle      |

Princip: **portrét vs. landscape** odděluje „kdo to je" od „co potřebuje rozhodnutí". Themes každý dokáží polepit vlastními ornamenty (modré nebe = heraldic cornerstones, kyberpunk = neonové výseky rohů, postapo = lepicí pásky, atd.), ale **kostra a anatomie zůstávají identické** napříč skiny — auditace UX se nezhroutí pod kyberpunkem.

Žádné emoji, žádné dekorativní gradienty mimo theme tokeny. Decorations.css patří per téma, ne do shared CSS.

---

## 1. UserCard — anatomie

### 1.1 Desktop (≥1024px, 4 sloupce)

```
┌─────────────────────────────────────┐  ← rohové cornerstones (theme-decor)
│ ◇                                 ⋮ │  ← TL ornament │ kebab (44×44 hit area)
│                                     │
│           ┌───────────┐             │
│           │  avatar   │             │  ← 80px round, fallback defaultAvatarType
│           │   80px    │             │
│           └───────────┘             │
│                                     │
│        tyky_tan_junior              │  ← username, --font-display, weight-semi, --text-base
│         Tyky Tan Junior             │  ← displayName, --font-body, --text-sm, --text-muted
│                                     │
│        ▭ Superadmin                 │  ← role chip (viz §2)
│                                     │
│        ◷ 4 světy   · od 03/2025     │  ← worldsCount + createdAt, --text-xs --text-muted
│                                     │
│ ◇                                 ◇ │  ← BL/BR cornerstones
└─────────────────────────────────────┘
   hover: translateY(-2px) + glow ring
```

**Anchor body:**
- Rohové cornerstones `◇` jsou theme-decor placeholdery — výchozí téma renderuje 4× `position: absolute` SVG/webp 12px (heraldic diamond pro modré nebe, neon corner-cut pro kyberpunk, kruhový nýt pro hospodu, atd.). Generic fallback = jeden `1px` solid border + `--theme-border-soft`.
- Avatar je `<UserAvatar size="lg" />` (existující komponenta z 1.3a) s `defaultAvatarType` fallbackem.
- Kebab = `<button>` 44×44 hit area, vizuálně 32×32 grafika (přebytek je padding pro touch), umístění `top: var(--sp-2); right: var(--sp-2);` aby nekolidovalo s TL cornerstone.

### 1.2 Mobil (<768px, 2 sloupce)

```
┌──────────────────┐
│ ◇             ⋮  │
│   ┌─────────┐    │  ← avatar 64px
│   │ 64px    │    │
│   └─────────┘    │
│                  │
│ tyky_tan_junior  │  ← --text-sm
│ Tyky Tan Junior  │  ← --text-xs
│                  │
│ ▭ Superadmin     │  ← chip menší, single line
│                  │
│ ◷ 4   · 03/25    │  ← worldsCount kompaktně, datum bez „od"
│ ◇             ◇  │
└──────────────────┘
```

**Mobile-specific:**
- Hover lift → neaplikujeme (touch); místo toho **active state press**: `transform: scale(0.985)` při `:active`.
- Kebab vždy viditelný (na desktopu by mohl být reveal-on-hover; doporučuji **vždy viditelný** kvůli predictabilitě — viz §10.4).

### 1.3 States

| State                 | Vizuál                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------- |
| default               | `--theme-surface` background, theme-border, cornerstones default                              |
| hover (desktop only)  | `translateY(-2px)`, `box-shadow: 0 8px 24px var(--theme-shadow), 0 0 24px var(--theme-glow-gold)`; cornerstones zesvětlí o 1 stop |
| focus-within          | `outline: 2px solid var(--theme-accent-bright); outline-offset: 2px;`                          |
| active / pressed      | `transform: scale(0.985); transition: 80ms;`                                                  |
| `pendingDeletion`     | overlay viz §1.4                                                                              |
| `deleted` (tombstone) | overlay viz §1.4 + `<UserAvatar deleted />` band                                              |
| loading skeleton      | šedý placeholder bez cornerstones, shimmer animace přes `--theme-surface-soft`                |

### 1.4 Overlay pro pending-deletion / deleted (admin `?includeDeleted=1`)

```
┌─────────────────────────────────────┐
│ ◇                                 ⋮ │
│        ┌───────────┐                │
│        │\\\\avatar\\│   ← 1.3c band │
│        │  + grayscale │              │
│        └───────────┘                │
│                                     │
│        tyky_tan_junior              │
│        Tyky Tan Junior              │
│                                     │
│  ╶─── PENDING DELETION 12d ───╴    │  ← status pásek
│  ╶───      DELETED            ───╴ │  ← druhá varianta
└─────────────────────────────────────┘
```

**Tokens:**
- Status pásek: `background: var(--tombstone-band); color: #fff; font: var(--text-xs) / var(--font-display); letter-spacing: 0.12em; text-transform: uppercase;`
- Karta jako celek: `opacity: 0.78; filter: grayscale(0.35);`
- Pro `deleted` (hard tombstone) přidat horní pásek **„DELETED"** + datum smazání.
- Pro `pendingDeletion` přidat **„PENDING DELETION {N}d"** kde N = dní do `deletedAt`.
- `<UserAvatar deleted />` (existující z 1.3c) zachová svůj diagonální band.

---

## 2. Role chip — návrh tokenů + vizuál

### 2.1 Anatomie chipu

```
   ╭───────────────────╮
   │ ▭  SUPERADMIN     │   ← icon (lucide stable; theme může swap přes :has())
   ╰───────────────────╯       label, uppercase, letter-spacing 0.08em, --text-xs
```

- Single-line pill, `padding: 2px var(--sp-2)`, `border-radius: var(--radius-full)`
- Icon 12×12 vlevo, label vpravo
- Žádné dva role chipy na téže kartě (uživatel má jednu platforma-wide roli)

### 2.2 Doporučení: barva **+** ikona (ne jen jedno)

| Důvod                                       | Detail                                                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| WCAG (barvoslepost)                         | barva sama o sobě není dostatečný informační kanál — ikona kompenzuje                                |
| Sub-varianty Spravce (Clanku/Galerie/Diskuzi) | barvou se nedostanou (palette by se znečistila); **ikonou** se rozliší elegantně                     |
| Theme resilience                            | barva je theme-aware, ikona je theme-independent → fallback při neexistenci `--role-*-bg` v skinu    |

### 2.3 CSS proměnné — návrh nové sady

Přidat do `src/themes/_shared/tokens.css` jako default fallbacky, jednotlivá témata mohou přepsat:

```css
:root {
  /* Role chip — semantic colors mapped to existing palette aliases.
     Themes inherit defaults via legacy --accent / --info / --warning.
     Témata mohou přepsat per-role pokud chtějí výraznější odlišení. */

  /* Superadmin — nejvyšší autorita, gold/bright */
  --role-superadmin-bg:    var(--theme-accent-bright, var(--warning));
  --role-superadmin-fg:    var(--text-on-accent, #050508);
  --role-superadmin-ring:  var(--theme-glow-gold, var(--success-glow));

  /* Admin — platform autorita, brand accent */
  --role-admin-bg:         var(--theme-accent, var(--accent));
  --role-admin-fg:         var(--text-on-accent, #050508);
  --role-admin-ring:       var(--theme-border, var(--accent-soft));

  /* Spravce* — každý sub-typ má vlastní semantickou barvu (rozhodnutí §12.2).
     Sjednocený label-formát (krátké jméno domény), barva komunikuje doménu. */

  /* Správce článků — warm amber (pero/inkoust/manuskript) */
  --role-spravce-clanku-bg:    #d97706;
  --role-spravce-clanku-fg:    #ffffff;
  --role-spravce-clanku-ring:  rgba(217, 119, 6, 0.35);

  /* Správce galerie — magenta/purple (vizuální/obraz) */
  --role-spravce-galerie-bg:   #a855f7;
  --role-spravce-galerie-fg:   #ffffff;
  --role-spravce-galerie-ring: rgba(168, 85, 247, 0.35);

  /* Správce diskuzí — teal/green (konverzace/proud) */
  --role-spravce-diskuzi-bg:   #14b8a6;
  --role-spravce-diskuzi-fg:   #ffffff;
  --role-spravce-diskuzi-ring: rgba(20, 184, 166, 0.35);

  /* PJ a Hrac nemají chip — žádné tokeny. */
}
```

**Pozn.:** barvy Spravce* jsou hardcoded defaults (žádný theme-aware fallback — sub-typy potřebují stabilní rozlišení napříč skiny, jinak by se kategorie ztrácely). Jednotlivá témata mohou v `index.ts` přepsat (např. kyberpunk → neonové varianty stejných hue), ale **default je univerzálně čitelný**.

### 2.4 Mapování role → chip

| `UserRole` enum         | Label         | Icon (lucide)  | Background var                       |
| ----------------------- | ------------- | -------------- | ------------------------------------ |
| `Superadmin = 1`        | „Superadmin"  | `ShieldStar`   | `--role-superadmin-bg`               |
| `Admin = 2`             | „Admin"       | `Shield`       | `--role-admin-bg`                    |
| `PJ = 3`                | — (žádný chip) | —              | —                                    |
| `Hrac = 9`              | — (žádný chip) | —              | —                                    |
| `SpravceClanku = 10`    | „Články"      | `FileText`     | `--role-spravce-clanku-bg` (amber)   |
| `SpravceGalerie = 11`   | „Galerie"     | `ImageIcon`    | `--role-spravce-galerie-bg` (purple) |
| `SpravceDiskuzi = 12`   | „Diskuze"     | `MessageSquare`| `--role-spravce-diskuzi-bg` (teal)   |

**Label-formát:** krátká doménová zkratka (8 znaků max) — funguje na kartě i na veřejném profilu jednotně. Tooltip na chipu doplní plné jméno role („Správce článků") pro screenreadery a hover na desktopu.

### 2.5 Kontrast (WCAG AA)

| Role chip            | Background | FG       | Kontrast |
| -------------------- | ---------- | -------- | -------- |
| Superadmin (m. nebe) | `#ffd36a`  | `#050508`| 14.8 : 1 |
| Admin (m. nebe)      | `#d6aa45`  | `#050508`| 10.2 : 1 |
| Spravce článků       | `#d97706`  | `#ffffff`| 4.5 : 1  |
| Spravce galerie      | `#a855f7`  | `#ffffff`| 4.8 : 1  |
| Spravce diskuzí      | `#14b8a6`  | `#ffffff`| 4.6 : 1  |

Všechny ≥ 4.5 : 1 (WCAG AA pro normální text). Audit pro každé další téma se přidá do `npm run audit:contrast`.

---

## 3. Tab nav — 3 taby s role-aware visibility

### 3.1 Desktop layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│   ◇━━ PŘÁTELÉ ━━◆       UŽIVATELÉ        ZPRACOVAT •3 ◆━━              │
│                          ▔▔▔▔▔▔▔▔▔                                       │
└──────────────────────────────────────────────────────────────────────────┘
        ↑                       ↑                  ↑
   (default neadmin)        (admin only)       badge u tabu (jen pokud > 0)
```

- Aktivní tab podtržený silnou linkou v `--theme-accent` + jemný `--theme-glow-gold` halo.
- Inaktivní tab čte v `--theme-text-muted`, hover převede na `--theme-text`.
- Decorativní `◇━━` cap reuse `--asset-nav-end-cap-l/r` pro modré nebe; ostatní témata fallback čistý gradient `--section-divider`.
- Badge: pill `--text-xs / weight-bold`, background `--danger` pokud > 0, jinak skrytý.

### 3.2 Mobil layout

```
┌─────────────────────────────┐
│  PŘÁTELÉ  UŽIVATELÉ  •3   │  ← scroll-x pokud nutné
│  ───────                     │
└─────────────────────────────┘
```

- Žádné decorativní end-caps na mobilu (vizuální šum). Jen text + active underline.
- Horizontal scroll, momentum: `overflow-x: auto; scroll-snap-type: x mandatory;`

### 3.3 Visibility logika

```ts
function visibleTabs(role: UserRole): Tab[] {
  const base: Tab[] = ['pratele', 'zpracovat']; // všichni
  if (role === UserRole.Superadmin || role === UserRole.Admin) {
    return ['pratele', 'uzivatele', 'zpracovat'];
  }
  return base;
}

function defaultTab(role: UserRole): Tab {
  return role === UserRole.Superadmin || role === UserRole.Admin
    ? 'uzivatele'
    : 'pratele';
}
```

Pokud uživatel přijde na `?tab=uzivatele` ale jeho role tab nemá, FE silently přepne na `defaultTab(role)` a toast: „Nemáš oprávnění k tabu Uživatelé".

### 3.4 URL state per tab

| Tab        | Query params                                                                        |
| ---------- | ----------------------------------------------------------------------------------- |
| pratele    | `?tab=pratele` (v 1.4 kostra, žádné další params)                                    |
| uzivatele  | `?tab=uzivatele&view=cards|table&page=N&search=…&sort=new|abc&role=…&includeDeleted=1` |
| zpracovat  | `?tab=zpracovat&section=…` (admin sub-tab — viz §6)                                  |

Doporučení: **router-level useSearchParams**, žádný interní state pro tyto klíče (browse back/forward zachová stav).

---

## 4. View-toggle uvnitř tabu Uživatelé

### 4.1 Anatomie

```
┌──────────────────────────────────────────────────────────────┐
│  [▦ Karty]  [≡ Tabulka]      ⌕ search…       Sort: ▾ Nejnov. │
│   ────────                                                    │
└──────────────────────────────────────────────────────────────┘
```

- Segmented control, **levý**, default Karty.
- Search input vpravo od view-toggle, sdíleno s tabulkou (1.3b `UsersFilters` reuse).
- Sort selector vpravo, sdíleno.
- Pod tímhle barem renderuje buď `<CardsGrid />` nebo `<UsersTable />` podle `?view`.

### 4.2 Vizuál segmented control

```
┌──────────────┬──────────────┐
│ ▦ Karty      │ ≡ Tabulka    │
└──────────────┴──────────────┘
   active           inactive
   bg: --theme-accent / fg: --text-on-accent
   inactive: bg: transparent / fg: --theme-text-muted, hover --theme-text
```

- Touch target 44×44 (vertikální padding `var(--sp-3)`).
- `aria-pressed` na každém tlačítku.
- Transition `--transition-base` na bg/fg.

### 4.3 State zachování při view switch

**Důležité:** přepnutí view **nevynuluje** search/sort/page. URL params zůstanou, jen `view` se přepíše. Admin si představí: „najdu Tondu vyhledáváním, přepnu na tabulku, vidím ho v kontextu" — toto musí fungovat.

---

## 5. Kebab menu na kartě

### 5.1 Desktop

```
                      ⋮
                  ┌───────────────────────────────┐
                  │ ◷  Otevřít profil             │
                  │ ⚒  Změnit roli                │
                  │ ⛔  Banovat                    │
                  │ ✕   Smazat účet               │
                  │ ───────────────────────────── │
                  │ ≡  Otevřít v tabulce          │
                  └───────────────────────────────┘
```

- Otevírá se downward / left (closer to right edge of card).
- Width: 240px min, padding `var(--sp-2)`, `--radius-md`, `--shadow-lg`.
- Border `1px solid var(--theme-border)`.
- Background `var(--theme-surface-strong)` (more opaque než karta sama).
- Sekce **destructive** (Banovat, Smazat) v `color: var(--danger)`, separator `border-top: 1px solid var(--theme-border-soft)` od Otevřít v tabulce.

### 5.2 Mobil

- Kebab klik → bottom sheet (full-width, slide-up od dolního okraje).
- Stejné položky, větší touch targety (48×48), separátor čar.
- Backdrop `var(--scrim)` se zavřením na tap.

### 5.3 A11y

- Trigger: `<button aria-haspopup="menu" aria-expanded={open} aria-label="Akce na uživateli {username}">`
- Menu: `<ul role="menu">` s `<li role="menuitem">` per položka.
- Trap focus uvnitř menu, ESC zavře, klik mimo zavře.
- Arrow keys navigace.

### 5.4 Per-role visibility položek

| Položka                | Hrac/Spravce*/PJ vidí? | Komu chybí?                                                                        |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| Otevřít profil         | ano (vždy)             | —                                                                                  |
| Změnit roli            | ne                     | jen Admin/Superadmin; Admin nemůže měnit Superadminy (1.3b hierarchy)              |
| Banovat                | ne                     | jen Admin/Superadmin; nelze self-ban                                               |
| Smazat účet            | ne                     | jen Admin/Superadmin (moderation delete z 1.3c)                                    |
| Otevřít v tabulce      | ne                     | jen Admin/Superadmin (view-toggle switch)                                          |

**Pozn.:** Spravce* a běžní hráči v 1.4 tab Uživatelé nevidí (RoleGuard), takže kebab uvidí jen Admin/Superadmin. Tabulka uvedená výše je defenzivní (pro případ že by Spravce v budoucnu dostal read-only přístup).

---

## 6. PendingActionCard — anatomie

### 6.1 Desktop (landscape, plná šířka tabu Zpracovat)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ┌────────┐                                                                  │
│ │        │  ŽÁDOST O PŘÁTELSTVÍ                                  · 12 min   │
│ │ avatar │  tyky_tan_junior tě chce přidat do přátel                        │
│ │  56px  │                                                                  │
│ │        │  „Ahoj, hráli jsme spolu Matrix 2024…" (volitelná zpráva)        │
│ └────────┘                                                                  │
│                                                       [ Odmítnout ][ Přijmout ] │
└────────────────────────────────────────────────────────────────────────────┘
```

**Anatomie:**
- **L-kolona** (~80px) = avatar nebo thumbnail (článek = miniatura článku, galerie = obrázek thumb, world join = avatar žadatele + ikona světa).
- **Mid-kolona** (flex 1) = **strukturovaný popis akce**:
  - Řádek 1: type label uppercase (uppercase, `--text-xs`, `--text-muted`, letter-spacing) + relativní časová značka vpravo
  - Řádek 2: hlavní popis (`--text-sm`, `--theme-text`, semibold pro klíčové entity)
  - Řádek 3 (volitelný): doplňující text (zpráva, citace, kontext) — italic, `--theme-text-muted`
- **R-kolona** (auto) = akční tlačítka, primary + secondary podle typu.

### 6.2 Mobil (stacked)

```
┌──────────────────────────────┐
│ ŽÁDOST O PŘÁTELSTVÍ          │
│                              │
│ ┌────────┐                   │
│ │ avatar │  tyky_tan_junior │
│ │  56px  │  · 12 min        │
│ └────────┘                   │
│                              │
│ ti chce přidat do přátel.    │
│                              │
│ „Ahoj, hráli jsme..."        │
│                              │
│ [ Odmítnout ] [ Přijmout ]   │
└──────────────────────────────┘
```

### 6.3 Renderer registry — jak vypadají různé typy

| `PendingActionType`         | L-kolona               | Mid                                                              | R akce                                       |
| --------------------------- | ---------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| `friend_request`            | avatar žadatele 56px   | „{username} tě chce přidat do přátel" + volitelná zpráva         | Odmítnout / **Přijmout**                     |
| `world_join_request` (2.4)  | avatar žadatele 56px   | „{username} žádá o vstup do světa **{worldName}**"                | Odmítnout / **Přijmout**                     |
| `article_pending_review` (3.2) | thumb článku 56×56  | „**{title}** od {author}" + first 80 chars excerpt               | Odmítnout / Vrátit s poznámkou / **Schválit** |
| `gallery_pending_review` (3.3) | obrázek thumb 56×56 | „**{caption|filename}** od {author}"                              | Odmítnout / **Schválit**                     |
| `discussion_report` (3.4)   | ikona vlajka + thumb avatar | „{reporter} nahlásil příspěvek od {author}" + první řádek příspěvku | Zamítnout hlášení / Smazat příspěvek / Banovat |
| `discussion_join_request` (3.4) | avatar žadatele 56px | „{username} žádá o vstup do diskuze **{discussionTitle}**"        | Odmítnout / **Přijmout**                     |
| `username_request` (1.3b → 1.4) | avatar 56px         | „{username} žádá změnu na **{requestedUsername}**"                | Odmítnout / **Schválit**                     |

**Architektura FE** (impl. plán to rozvine):

```tsx
// pseudokód, naznačení directionu
type PendingActionRenderer<T> = {
  L: (item: T) => ReactNode;
  Mid: (item: T) => ReactNode;
  Actions: (item: T, opts: { isLoading: boolean }) => ReactNode;
};

const REGISTRY: Record<PendingActionType, PendingActionRenderer<unknown>> = {
  friend_request: friendRequestRenderer,  // 1.8
  world_join_request: worldJoinRenderer,  // 2.4
  // ...
};
```

V 1.4 registry obsahuje jen `username_request` (přesun z 1.3b) — ostatní fáze registrují svůj renderer při dokončení.

### 6.4 States

- **idle** — outline pill button styly, theme-aware.
- **pending** (in-flight mutation) — disabled + spinner v primary akčním tlačítku.
- **resolved** — karta s 1.5s fade-out animací zmizí ze seznamu.
- **error** — toast (`sonner`) s `parseApiError`, karta zůstane.

### 6.5 Bulk akce v Zpracovat?

Spec nemluví o bulk akcích ve Zpracovat. **Doporučení audit:** nezavádět v 1.4. Jednotlivé akce jsou kontextové, bulk by vyžadoval selection UI, které by zaplevelilo landscape kartu. Pokud admin chce hromadné — vrátí se do tabulky v Uživatelé tabu (která už bulk akce má). V 1.4 = single-card akce.

---

## 7. Empty states ve Zpracovat tabu

### 7.1 Žádné položky (pro funkční role)

```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│              ┌──────────┐                │
│              │   icon   │                │  ← lucide Inbox 48px, --theme-text-muted
│              └──────────┘                │
│                                          │
│         Nic ke zpracování.               │  ← --font-display, --text-md
│   Až přijde nová žádost, ukáže se zde.   │  ← --font-body, --text-sm, --theme-text-muted
│                                          │
│                                          │
└──────────────────────────────────────────┘
```

### 7.2 Placeholder pro role bez funkčního obsahu v 1.4

Příklad pro Hrac:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              ┌──────────┐                                │
│              │   icon   │                                │
│              └──────────┘                                │
│                                                          │
│          Brzy: žádosti o přátelství                      │
│                                                          │
│   Tady budou tvoje příchozí žádosti o přátelství.        │
│   Funkce přijde s krokem 1.8.                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Per role různý text (viz spec §1.2 tabulka).
- Žádné tlačítko „Notify me" — funkce přijde, není potřeba subscribe.
- **Důležité:** Spravce* uvidí placeholder pro **svou roli**, ne pro všechny (Spravce galerie nevidí placeholder pro články atd.).

### 7.3 Loading state

- Skeleton — 3 šedé PendingActionCard placeholdery, shimmer animace.
- Žádný spinner alone — sidebar bar s neviditelnou aktivitou je matoucí pro queue UI.

---

## 8. PublicUserProfilePage — layout

### 8.1 Layout shell (zrcadlí 1.3a, bez edit)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [page-frame TL ornament]              [page-frame TR ornament]     │
│                                                                     │
│   ╶─────── tvůj veřejný profil — upravit můžeš v Nastavení ──────╴  │  ← self-banner (jen pokud id === me.id)
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌──────┐  tyky_tan_junior                ▭ Superadmin       │   │
│   │  │ 128px│  Tyky Tan Junior                                   │   │
│   │  │ avat │  ◷ Praha   ·   4 světy   ·   člen od 03/2025      │   │
│   │  └──────┘                                                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ╶─── O MNĚ ───╴                                                  │  ← skrytá pokud bio === null
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Lorem ipsum dolor sit amet, hráč Matrix od 2024…           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ╶─── POSTAVA V ROZCESTÍ ───╴                                      │  ← skrytá pokud characterName === null
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌──────┐  Neo Anderson                                     │   │
│   │  │  64px│  Hacker, hledá pravdu o Matrixu…                  │   │
│   │  └──────┘                                                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ╶─── AKCE ───╴                                                    │
│   [ Napsat zprávu (3.5) ]  [ Přidat do přátel (1.8) ]               │  ← obě disabled v 1.4, tooltip
│   [ Otevřít v administraci ]                                        │  ← jen Admin/Superadmin, primary
│                                                                     │
│  [page-frame BL ornament]              [page-frame BR ornament]     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Komponentová mapa

| Sekce            | Komponenta                            | Reuse z                                       |
| ---------------- | ------------------------------------- | --------------------------------------------- |
| Self-banner      | `<SelfProfileBanner />`               | nová, jen v 1.4                               |
| Header karta     | `<PublicProfileHeader />`             | analog `<ProfileHeader>` z 1.3a (read-only)   |
| O mně            | `<PublicBioSection />`                | analog `<BioSection>` z 1.3a (read-only)      |
| Postava          | `<PublicCharacterSection />`          | analog `<CharacterSection>` z 1.3a (read-only)|
| Akce             | `<PublicProfileActions />`            | nová                                          |
| Admin overlay (tombstone) | `<TombstoneBanner />` na header karta | 1.3c filozofie                                |

**Důležité:** komponenty by měly reuse layout z 1.3a (CSS modules), jen bez edit chrome. Doporučení v impl. plánu: vyextrahovat sdílený **read-only** shell, který 1.3a edit komponenty wrapují, a 1.4 ho používá přímo.

### 8.3 Self-profile banner

```
╶─────────── Toto je tvůj veřejný profil — upravit můžeš v Nastavení profilu ───────────╴
```

- Umístění **uvnitř header karty** jako thin top strip (ne nad kartou — na mobilu by tlačil obsah níž).
- Background: `var(--theme-surface-soft)`, color: `var(--theme-text-muted)`, font: `--text-xs / --font-body`, italic.
- Link „Nastavení profilu" jako theme-aware accent underline.

### 8.4 Akce sekce — disabled placeholdery

```
┌───────────────────────────┐  ┌──────────────────────────┐
│  ⏷  Napsat zprávu          │  │  ⏷  Přidat do přátel     │
│      Připravujeme — 3.5    │  │      Připravujeme — 1.8  │
└───────────────────────────┘  └──────────────────────────┘
```

- Tlačítka mají `disabled` attribute + `aria-disabled="true"` + tooltip s relevantním krokem.
- Vizuálně: `opacity: 0.45;`, `cursor: not-allowed;`, žádný hover lift.
- Pod tlačítkem mikro-text „Připravujeme — 3.5" (jen pokud `prefersReducedTooltip` flag — viz §10.6).

### 8.5 Admin akce „Otevřít v administraci"

- Jen pro Admin/Superadmin a jen pokud `profileId !== me.id` (admin se nemůže otevřít v adminu).
- Vede na `/ikaros/uzivatele?tab=uzivatele&view=table&focus={profileId}` — focus param scrolluje na řádek tabulky + dočasný highlight.
- Vizuálně **primary** tlačítko (uzavírá D-029).

---

## 9. Pravý panel link (Administrace sekce)

### 9.1 Anatomie

```
┌────────────────────────────────────────┐
│  ADMINISTRACE                          │  ← SectionTitle
│  ─────────────────────                 │
│                                        │
│  [theme switcher]                      │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ ◷  Uživatelé             • 3  →  │  │  ← Admin/Superadmin
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ ◷  Přátelé              • 1  →  │  │  ← Spravce*/PJ/Hrac
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

- Levá ikona (lucide Users / UsersRound — TBD)
- Label (adaptivní)
- Pending count badge (vpravo střed)
- Chevron `→` jako accent
- Hover state: `--theme-nav-hover-bg`, theme glow

### 9.2 Badge pulse

- Když `pendingCount > 0` a předchozí render byl 0 (nově příchozí žádost), badge **pulzuje** 3× (per-theme `--theme-accent-bright` glow) přes 1.2s a pak ustálí.
- Subtle ale notifikuje — žádný toast (toast je pro chat/socket).

### 9.3 Pending count zdroj

- Single endpoint `GET /api/pending-actions/count` který vrací `{ total: number }` pro aktuálního uživatele (sčítá napříč queue typy podle role).
- TanStack Query staleTime 30s, plus socket invalidace při relevantních eventech (`friend:request`, `world:join_request`, atd.).
- Skladbu po-typu (jen v rámci tabu Zpracovat) — separate query.

---

## 10. UX rationale (rozhodnutí, která spec needetailoval)

### 10.1 Proč kebab a ne primary „Spravovat" tlačítko?

Karta má **jednu primární akci = otevřít profil** (klik na kartu). Sekundární akce jsou destructivní/admin → ty patří do kebab menu, aby zelená pole karty (avatar, jméno) zůstala primární scan-target. Single primary button by konkuroval avatar/jménu o pozornost.

### 10.2 Proč Karty default ve view-toggle, ne Tabulka?

Spec explicitně: „rychlý vizuální lookup". Tabulka je nástroj pro **hromadné** akce (bulk ban, sort by column). Karty jsou rychlejší pro „kde je ten Tonda" use-case — avatar + barva chipu uvidíš v 1/4 vteřiny.

### 10.3 Proč role chip jen pro role > Hrac/PJ?

PJ je per-world role — v Ikaros vrstvě je z hlediska platformy nesmysl (každý PJ je PJ v nějakém světě, ne globálně). Hrac je default → chip by byl šum.

### 10.4 Proč kebab vždy viditelný (ne reveal on hover)?

- Predictabilita: uživatel ví, kde akce jsou.
- Mobile parity: na touchu hover nefunguje. Když je kebab reveal-on-hover, na touchu by musel být always-visible → divergence platforem. Jednotné chování > drobná čistota desktopu.

### 10.5 Proč PendingActionCard landscape (ne portrait jako UserCard)?

Vizuální diferenciace „karta = data" vs. „karta = akce". Když přepneš mezi taby Uživatelé ↔ Zpracovat, oko okamžitě vidí, že jsi v jiném módu. Landscape navíc lépe sedí struktuře „kdo • co • kdy • akce".

### 10.6 Tooltip nebo mikro-text pro disabled akce?

Doporučuji **tooltip primárně, mikro-text fallback**. Tooltip se otevírá na hover/focus, na touchu nefunguje → mikro-text pod tlačítkem (jen na touchu / `:hover`-supported media query).

### 10.7 Self-profile uvnitř karty vs. nad ní?

Uvnitř — banner výše by na mobilu posunul header dolů a uživatel by viděl jenom „Toto je…" než scrolluje. Inside-strip se vejde do horní lišty karty.

---

## 11. Nové CSS proměnné (souhrn — k zavedení v impl. plánu)

```css
:root {
  /* ── 1.4: Role chip semantic colors ── */
  --role-superadmin-bg:    var(--theme-accent-bright, var(--warning));
  --role-superadmin-fg:    var(--text-on-accent, #050508);
  --role-superadmin-ring:  var(--theme-glow-gold, var(--success-glow));

  --role-admin-bg:         var(--theme-accent, var(--accent));
  --role-admin-fg:         var(--text-on-accent, #050508);
  --role-admin-ring:       var(--theme-border, var(--accent-soft));

  --role-spravce-bg:       var(--info, #5ba4f5);
  --role-spravce-fg:       #050508;
  --role-spravce-ring:     rgba(91, 164, 245, 0.30);

  /* ── 1.4: UserCard cornerstones (default fallback) ── */
  --usercard-corner-size:  8px;
  --usercard-corner-color: var(--theme-border, var(--accent-soft));

  /* ── 1.4: Tab nav ── */
  --tab-underline-h:       2px;
  --tab-underline-color:   var(--theme-accent, var(--accent));
  --tab-badge-bg:          var(--danger);
  --tab-badge-fg:          var(--text-on-danger, #fff);

  /* ── 1.4: Deletion status pásek (rozšíření --tombstone-band) ── */
  --status-band-pending:   rgba(245, 166, 35, 0.85);  /* warning tone */
  --status-band-deleted:   var(--tombstone-band);
}
```

Žádné z těchto tokenů `:root` defaultů nepřebíjí témata. Theme overrides jsou volitelné — modré nebe může v `index.ts` přidat:

```ts
'--role-superadmin-bg': '#ffd36a',           // explicit override pro intenzivnější gold
'--usercard-corner-color': '#d6aa45',        // theme-specific cornerstone
```

---

## 12. Slabiny ve specu objevené při auditu

### 12.1 Audit log uvnitř tabu Zpracovat? ✅ Rozhodnuto (b)

**Rozhodnutí 2026-05-12:** Audit log vystupuje ze Zpracovat tabu a stává se **4. tabem „Audit" jen pro Admin/Superadmin**.

**Dopady:**
- Admin/Superadmin vidí **4 taby**: Přátelé / Uživatelé / Zpracovat / Audit (default tab po otevření zůstává Uživatelé).
- Zpracovat zůstává čistě actionable queue. Pro Admin/Superadmin v 1.4 obsahuje jen username requests (přesun z 1.3b „Žádosti o username" tab).
- Audit log tab reuse `AuditLogTab` z 1.3b (přesun bez funkčních změn).
- Spec §2.1 a §1.1 tabulka aktualizovat na 4 taby pro Admin/Superadmin.

### 12.2 Spravce sub-typy — label + barevné rozlišení ✅ Rozhodnuto

**Rozhodnutí 2026-05-12:**
- **Jednotný label-formát**: krátká doménová zkratka „Články" / „Galerie" / „Diskuze" (chip se vejde na kartu i na profil)
- **Každý Spravce sub-typ má vlastní semantickou barvu** — viz §2.3 a §2.4
- **Tooltip na chipu** doplní plné jméno role pro screenreadery a hover desktop

**Vizuální mapování:**
- Články → amber (`#d97706`) — manuskript/pero
- Galerie → magenta (`#a855f7`) — vizuální/barvy
- Diskuze → teal (`#14b8a6`) — konverzace/proud

Tokeny v §2.3, mapping v §2.4, kontrast v §2.5.

### 12.3 Tlačítko „Otevřít v administraci" pro Admin sebe sama

Spec §3.5: self-profile dostane banner „View as". Audit doplňuje: pokud Admin otevře vlastní public profil, tlačítko „Otevřít v administraci" by ho navádělo na samo sebe — nesmysl.

**Doporučení:** tlačítko **skryté** pokud `profileId === me.id`. Triviální, ale spec to nezmínil.

### 12.4 Pending count zdroj

Spec §3.6 nezmiňuje, **jak** se počítá pending count v pravém panelu (badge u kolonky Uživatelé/Přátelé).

**Doporučení (impl. plán):** Nový endpoint `GET /api/pending-actions/count` který agreguje napříč registrovanými `IPendingActionProvider`. V 1.4 vrátí jen `username_request` count pro Admin/Superadmin (vše ostatní = 0). Další fáze přidají.

→ Potvrzení v impl. plánu.

### 12.5 Bulk akce v tabu Uživatelé / Karty mód

Spec §3.1 (A): tabulka mód má bulk akce (z 1.3b). Karty mód = jen jednotlivé. Audit potvrzuje (§6.5) — ale **mělo by být explicitně v specu**.

→ **Akce:** doplnit do specu jednu větu „Bulk akce dostupné jen v Tabulka módu; Karty mód jsou single-item akce přes kebab."

### 12.6 Sort sloupců v tabulce vs. sort v kartách

Spec mluví o sort toggle „Nejnovější / Abecedně" — to je pro Karty. Tabulka má per-sloupec sort z 1.3b (createdAt, username, role, status).

**Konflikt:** když uživatel sortuje v tabulce podle `role` a přepne na Karty (které sort by role nemají), karta sortuje podle čeho?

**Doporučení:** Karty mají vlastní omezenou sadu sort options (Nejnovější / Abecedně). Při view switch z tabulky → karty, pokud aktuální sort není mezi options, fallback na default „Nejnovější". URL: `?sort=new` po fallbacku.

→ Pridat do impl. plánu.

### 12.7 Self-card v Adresáři

Když Admin browseje Karty mód, **vidí sebe sama mezi kartami**? Spec nemluví.

**Doporučení:** ano, vidí. Klik na sebe → veřejný profil s self-banner (§3.5). Nepotřebuje skrytí, je to konzistentní.

→ Potvrzení v impl. plánu.

### 12.8 Mobil — search input umístění při view-toggle

Spec nezmiňuje. Na mobilu je málo místa pro `[Karty | Tabulka] [search…] [Sort ▾]` v jednom řádku.

**Doporučení:**
- ř.1: `[Karty | Tabulka]` (segmented full-width)
- ř.2: `[⌕ search…]` full-width
- ř.3: `[Sort: ▾ Nejnov.]` (filter chip)
- Sticky nahoru při scrollu, `position: sticky; top: var(--header-h);`

---

## 13. Rozhodnutí k odsouhlasení před impl. plánem

| #     | Otázka                                                                       | Doporučení                                                            |
| ----- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| §2.2  | Role chip = barva + ikona (ne jen jedno)                                     | **ANO** obojí (WCAG + theme resilience + Spravce sub-varianty)        |
| §2.3  | Nové CSS proměnné `--role-*-bg/-fg/-ring`                                    | Přidat do `_shared/tokens.css` s fallback chainem                      |
| §2.4  | Sub-Spravce rozlišení = ikona (FileText/ImageIcon/MessageSquare), barva stejná | **ANO**                                                               |
| §3.3  | Tab visibility logic (kódová ukázka v §3.3)                                  | OK                                                                    |
| §4.1  | View-toggle defaultně Karty                                                  | OK                                                                    |
| §5.4  | Kebab vždy viditelný (ne reveal on hover)                                    | **ANO** (mobile parity)                                                |
| §6.3  | PendingActionCard renderer registry s `PendingActionType` enum               | OK — formalizovat v impl. plánu                                        |
| §6.5  | Žádné bulk akce v Zpracovat tabu v 1.4                                       | **ANO**                                                               |
| §7.2  | Per-role placeholder text ve Zpracovat (Spravce*/PJ/Hrac)                    | OK                                                                    |
| §8.3  | Self-banner uvnitř header karty (ne nad ní)                                  | **ANO**                                                               |
| §8.5  | Admin „Otevřít v administraci" link (closes D-029)                           | **ANO** + skrýt pro self (§12.3)                                       |
| §9.2  | Badge pulse animation při příchozí žádosti                                   | **ANO** subtle, 3× pulse                                              |
| §12.1 | Audit log uvnitř Zpracovat (a) / vlastní 4. tab (b) / samostatná stránka (c) | **(b)** 4. tab „Audit" jen pro Admin/Superadmin                       |
| §12.2 | Spravce chip label = krátké „Články" / dlouhé „Správce článků"               | Krátké na kartě, dlouhé na profilu                                    |
| §12.4 | Endpoint `GET /api/pending-actions/count`                                    | **ANO** zavést v 1.4 jako jediný source pravdy                         |
| §12.6 | Sort fallback při view switch tabulka → karty                                | **ANO** fallback na default Nejnovější                                |
| §12.8 | Mobile layout filter baru — 3 řádky stacked                                   | **ANO**                                                               |

---

## 14. Skin originality — co kde žije

Pravidlo z paměti `feedback_skin_originality.md` — žádné recyklované ornamenty mezi tématy. Pro 1.4 to znamená:

- **UserCard cornerstones** = per téma vlastní asset (heraldic diamond pro modré nebe, neon corner-cut pro kyberpunk, lepidlo pro postapo, runy pro severské, atd.). V 1.4 spec definuje jen **strukturu** + token `--usercard-corner-color`. Themes pak dodávají per-decor přes `decorations.css`.
- **Tab end-caps** = jen modré nebe (reuse existující asset z 1.0f). Ostatní témata zatím simple underline + section divider. **Postupně** lze přidat per téma (impl. plán nezavazuje).
- **PendingActionCard** = beze decoru v 1.4. Sjednocená anatomie přes všechny témata. Pokud později téma chce přidat scroll/letter atmosféru, dorobí přes decorations.css.

---

## 15. Co dělat dál

1. **Odsouhlasit otázky v §13** (zejména §12.1 Audit log umístění).
2. **Aktualizovat spec-1.4.md** s rozhodnutími z auditu (Audit log § ref pokud (b), bulk akce explicit, sort fallback, self-card v adresáři, atd.).
3. **Sepsat impl. plán 1.4** — soubor `docs/arch/phase-1/plan-1.4.md`:
   - rozdělit BE / FE / Tests do fází (např. 1. BE endpointy + DTO, 2. PendingActionType infra, 3. FE refactor AdminUsersPage → UsersPage, 4. PublicUserProfilePage, 5. UserCard + PendingActionCard, 6. integrace + URL state, 7. testy a polish)
   - definovat konkrétní soubory ke změně/vytvoření
   - definovat acceptance kritéria per fázi
4. Po schválení impl. plánu → kód.
5. Po každé grafické úpravě komponent → skill `mobil-desktop` (paměť `feedback_workflow.md`).
