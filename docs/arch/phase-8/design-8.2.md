# Design 8.2 — Adresář postav + modaly tvorby/convertu

> **Typ:** frontend-design audit • **Datum:** 2026-05-22
> Vstup do: implementačního plánu [plan-8.2.md](plan-8.2.md) • Spec: [spec-8.2.md](spec-8.2.md)
> Cíl: vzhled nových obrazovek konzistentní se zavedeným design systémem (skin „ikaros").

---

## 0. Východiska z auditu

Aplikace má hotový design systém — centralizované tokeny (`themes/_shared/tokens.css`),
CSS moduly, theme-aware barvy, 3D hloubku uvnitř světa (`[data-world-shell]`).
**Nic se nevymýšlí — nové obrazovky skládám z hotových vzorů.**

| Vzor | Zdroj | Použití v 8.2 |
|---|---|---|
| Stránka se sekcemi | `WorldMembersPage` (`.page` → `.pageHead` → `.sections` → `.section`) | kostra adresáře |
| Karta v gridu | `MemberCard`, `UsersTab` card | `CharacterCard` |
| Grid | `repeat(auto-fill, minmax(200px,1fr))`, gap 12px | mřížka adresáře |
| Badge typu | `CharacterHeader.typeBadge` (pill, font-display, uppercase, lucide ikona) | `CharacterTypeBadge` |
| Modal / footer | `shared/ui/Modal` (size sm–xl) | oba modaly |
| Potvrzení | `shared/ui/ConfirmDialog` | mazání, PC→NPC |

### 0.1 Klíčové rozlišení — tvar avataru

`UserAvatar` je **kruh** (`border-radius: 50%`) — reprezentuje **člověka**.
`CharacterHeader` avatar je **čtverec** (`border-radius: 8px`) — reprezentuje **postavu**.

💡 Adresář to drží: karta postavy = **čtvercový** avatar. Vizuálně odlišuje „postavy"
od „lidí" (stránka Hráči) na první pohled, bez popisku. Konzistentní s detailem 8.1.

### 0.2 Nález — sdílený badge typu

`CharacterHeader` má `typeBadge` (NPC / Hráčská postava / Lokace) napevno v sobě.
Adresář i karty potřebují týž badge → impl. plán **extrahuje** `CharacterTypeBadge`
(sdílená komponenta, reuse v hlavičce i kartě). Není to dluh — je to plánovaná
součást 8.2 (spec §4.8 počítá s novými komponentami).

---

## 1. Adresář postav (`/svet/:worldSlug/postavy`)

### 1.1 Layout

Kostra = `WorldMembersPage`. `max-width: 1100px`, `padding: 24px 16px`.

```
.page
├─ .pageHead  ── nadpis (font-display 32px, neonový svit)  +  [+ Nová postava]
│                "Postavy světa"                             (Button primary, jen PJ)
├─ .filterBar ── pill přepínač:  ( Vše )( Hráčské )( NPC )( Lokace )
└─ .sections
   ├─ .section "Postavy hráčů"   (ikona User, modrá)   [count]
   │   └─ .grid → CharacterCard …
   ├─ .section "Nehráčské postavy" (ikona Bot, fialová) [count]
   │   └─ .grid → CharacterCard …
   └─ .section "Lokace"           (ikona MapPin, cyan)  [count]
       └─ .grid → CharacterCard …
```

- **`.pageHead`** — nadpis vlevo (font-display, neonový text-shadow dle skinu),
  tlačítko „Nová postava" vpravo (`Button` `variant="primary"` `size="md"`, ikona
  `UserPlus`). Tlačítko jen pro PJ; nižší role ho nevidí. Na mobilu (≤768px) tlačítko
  pod nadpis, plná šířka.
- **`.filterBar`** — vodorovná řada pill tlačítek (Vše / Hráčské / NPC / Lokace).
  Aktivní pill: `background: var(--accent)`, `color: var(--text-on-accent)`.
  Neaktivní: `border: 1px solid var(--border-soft)`, transparentní. Styl = `Badge`
  pill rozměry. Při filtru ≠ Vše se zobrazí jen odpovídající sekce.
- **`.section`** — záhlaví dle `WorldMembersPage.sectionHead`: lucide ikona (18px,
  barva typu) + titul (12px, uppercase, `letter-spacing: 0.08em`, font-display) +
  `count` pill (`background: var(--surface-3)`). Prázdná sekce **skrytá**.
- **`.grid`** — `repeat(auto-fill, minmax(200px, 1fr))`, `gap: 12px`;
  `@media (max-width:768px)` → `minmax(140px, 1fr)`.

### 1.2 CharacterCard

Vzor `MemberCard` + `UsersTab` card, ale **čtvercový** avatar.

```
┌─────────────────┐
│   ▓▓▓▓▓▓▓▓▓     │  ← avatar 80×80, border-radius 8px (čtverec)
│   ▓▓ avatar ▓   │     border 1px frame-border
│   ▓▓▓▓▓▓▓▓▓     │
│                 │
│   Jméno postavy │  ← font-display 15px, heading barva
│   ⬡ NPC         │  ← CharacterTypeBadge (pill, ikona)
│   👤 Hráč Novák │  ← jen PC: jméno hráče, text-muted 11px, ikona User 12px
└─────────────────┘
```

- `.card` — flex column, center, `gap: 8px`, `padding: 16px`,
  `background: var(--surface-2)`, `border: 1px solid var(--frame-border)`,
  `border-radius: 12px`, `data-elev="card"` (3D hloubka — adresář je ve světě).
- Hover: `transform: translateY(-2px)`, `border-color: var(--accent)`.
  Active: `transform: scale(0.985)`.
- Klik kamkoli na kartu → `/svet/:worldSlug/postava/:slug`. Karta je `<a>`/link
  (a11y — celá karta klikací, ne jen jméno).
- PC bez avataru → fallback (neutrální čtvercový placeholder, ne kruh defaultů
  `UserAvatar` — postava ≠ člověk; placeholder doladí impl. plán).
- PC řádek hráče — jen u PC; NPC/Lokace ho nemá.

### 1.3 Barvy typů (sladěné s rolemi + lucide ikonami z `CharacterHeader`)

| Typ | Ikona (lucide) | Barva | Pozn. |
|---|---|---|---|
| PC — hráčská postava | `User` | `#60a5fa` (modrá, = role Hráč) | |
| NPC | `Bot` | `var(--accent)` `#a96cff` (fialová) | |
| Lokace | `MapPin` | `#06b6d4` (cyan, = `--role-world-corrector`) | |

`CharacterTypeBadge` = pill (`border-radius: 9999px`, font-display 11px, uppercase,
`letter-spacing: 0.05em`), `background: color-mix(barva 12%)`, `color: barva`,
`border: 1px solid barva` — vzor `WorldRoleChip`.

### 1.4 Stavy

- **Loading** — 6–8 skeleton karet (shimmer animace `@keyframes shimmer`, už existuje).
- **Prázdný stav** (svět bez postav) — centrovaný blok: ikona `Users` velká (dim
  barva), text „Zatím tu nejsou žádné postavy". Pro PJ navíc `Button primary`
  „Vytvořit první postavu". Pro nižší role jen text.
- **Prázdná sekce** při aktivním filtru — sekce skrytá; pokud filtr nevrátí nic,
  zobraz krátký text „Žádné postavy tohoto typu".
- **Vstup stránky** — sekce animují `fadeUp` staggered (vzor `WorldMembersPage`,
  ~400ms, respektovat `prefers-reduced-motion`).

---

## 2. CreateCharacterModal

`Modal` `size="md"` (560px). Title „Nová postava". Footer: `Zrušit` (ghost) +
`Vytvořit postavu` (primary, `loading` během mutace).

### 2.1 Pořadí polí — typ první

💡 Typ postavy mění zbytek formuláře (pole „Hráč" se objeví jen u PC) — proto je
**první a vizuálně výrazný**, ne schovaný v selectu.

```
Modal "Nová postava"  (560px)
┌──────────────────────────────────────────┐
│  TYP POSTAVY                              │
│  ┌────────┐ ┌────────┐ ┌────────┐         │  ← 3 klikací dlaždice
│  │  👤    │ │  🤖    │ │  📍    │         │     ikona + popisek
│  │ Hráčská│ │  NPC   │ │ Lokace │         │     aktivní = accent border
│  └────────┘ └────────┘ └────────┘         │
│                                            │
│  Jméno postavy            [____________]  │  ← Input + label
│  URL (slug)               [____________]  │  ← Input, auto z jména
│    použije se: /postava/<slug>            │     helper text, inline error
│                                            │
│  Hráč  (jen typ Hráčská)  [ select  ▾ ]   │  ← objeví se jen pro PC
│                                            │
│  Avatar                   [▓] [Nahrát…]   │  ← čtvercový náhled 72×72
│  Krátký popis             [  textarea  ]  │  ← volitelné, krátké
└──────────────────────────────────────────┘
   [ Zrušit ]            [ Vytvořit postavu ]
```

- **Typ** — 3 dlaždice vedle sebe (`flex`, na ≤768px pod sebou). Dlaždice: ikona
  (24px) + popisek; aktivní = `border-color: var(--accent)` + jemný glow,
  `background: var(--accent-soft)`. Radio chování.
- **Jméno** — `Input` `label="Jméno postavy"`, povinné.
- **Slug** — `Input` `label="URL adresa (slug)"`. Předvyplní se slugify z jména,
  dokud uživatel pole ručně neupravil (pak se přestane přepisovat). Helper text pod
  polem. Kolize → `Input error` „Tento slug už ve světě existuje" (modal zůstane
  otevřený, pole zvýrazněné).
- **Hráč** — pouze typ PC. Select členů světa (role Hráč+). Stylovat jako `Input`
  (label nad, stejná výška). Otevřeno z `MemberRow` → předvyplněno, **zamčené**
  (`disabled`, vedle avatar + jméno člena).
- **Avatar** — čtvercový náhled (72×72, `border-radius: 8px`) + `Button ghost`
  „Nahrát obrázek"; upload přes shared mechaniku. Volitelné.
- **Krátký popis** — `textarea` (stylovaná jako `Input`, 3 řádky), label „Krátký
  popis". Volitelné — rozsáhlou editaci řeší detail postavy.
- Submit `disabled` dokud: prázdné jméno, prázdný slug, nebo (typ PC ∧ nevybraný
  hráč).

### 2.2 Po úspěchu

Toast „Postava vytvořena", modal zavřít, navigace na detail nové postavy.

---

## 3. ConvertToPcModal (NPC → PC)

`Modal` `size="sm"` (400px). Title „Převést na hráčskou postavu".

```
Modal  (400px)
┌────────────────────────────────┐
│  Komu bude postava patřit?      │
│                                  │
│  ○  ▓ avatar  Hráč Novák        │  ← seznam členů (Hráč+),
│  ●  ▓ avatar  Hráč Dvořák       │     radio výběr s avatary
│  ○  ▓ avatar  Hráč Svoboda      │
└────────────────────────────────┘
   [ Zrušit ]      [ Převést na PC ]
```

- Seznam členů světa (role Hráč+) jako radio řádky s kruhovým `UserAvatar` (size sm)
  + jménem. U delších seznamů `overflow-y: auto`, `max-height` ~280px.
- Footer: `Zrušit` (ghost) + `Převést na PC` (primary, `disabled` bez výběru).
- **Convert PC → NPC** modal nemá — stačí `ConfirmDialog` („Finance a výbava se
  skryjí.", `confirmVariant` ne danger, je to vratné — primary).

---

## 4. Hlavička detailu — akce convert / delete

`CharacterHeader` dostane vedle tlačítka „Upravit" (8.1) akce pro PJ. Aby se
hlavička nepřeplnila, **kebab menu** (`⋮`, ikona `MoreVertical`) s položkami:

- „Převést na NPC" / „Převést na PC" (dle aktuálního typu; skryté pro Lokaci)
- „Smazat postavu" (danger barva v menu)

Menu jen pro PJ. Na mobilu stejné kebab menu (úspora místa). Vzor dropdownu — ověřit
existující v repu (impl. plán); jinak lehký `Menu` nad `Button ghost`.

🔀 Alternativa: dvě samostatná tlačítka v řadě. Zamítnuto — hlavička už nese avatar,
jméno, badge, „Upravit"; na mobilu (≤540px) by se rozsypala. Kebab drží klid.

---

## 5. Responsive

| Breakpoint | Adresář | Modaly |
|---|---|---|
| > 1024px | grid `minmax(200px)`, 4–5 sloupců | modal `md`/`sm` centrovaný |
| 769–1024px | grid `minmax(200px)`, 3 sloupce | beze změny |
| ≤ 768px | grid `minmax(140px)`; „Nová postava" plná šířka pod nadpis; typ-dlaždice v modalu pod sebe | Modal řeší šířku sám |
| ≤ 540px | 2 sloupce karet; kebab menu v hlavičce | footer tlačítka plná šířka |

Vše respektuje `prefers-reduced-motion` (vypnout `fadeUp`/`slideUp`).

---

## 6. Shrnutí pro implementační plán

1. **Adresář** = kostra `WorldMembersPage` + grid + sekce; nová `CharacterCard`
   (čtvercový avatar), `.filterBar` pill přepínač.
2. **`CharacterTypeBadge`** — extrahovat z `CharacterHeader`, sdílet s kartou.
3. **`CreateCharacterModal`** — typ jako 3 dlaždice první; slug auto+editovatelný;
   pole „Hráč" podmíněné typem; submit gating.
4. **`ConvertToPcModal`** — radio seznam členů; PC→NPC jen `ConfirmDialog`.
5. **`CharacterHeader`** — kebab menu (convert + delete), jen PJ.
6. Žádné nové tokeny ani barvy — vše z `tokens.css` a skinu. Postavy = čtvercový
   avatar (odlišení od lidí). Typy: PC modrá / NPC fialová / Lokace cyan.
