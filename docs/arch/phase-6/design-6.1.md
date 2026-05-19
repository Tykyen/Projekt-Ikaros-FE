# Design audit 6.1 — Světový chat (`frontend-design`)

Výstup `frontend-design` auditu pro krok 6.1. Vstup do §4.8 specu a do `plan-6.1.md`.

> **Názvosloví** (spec §0): **kanál** = sbalovací kontejner v sidebaru (`ChatGroup`);
> **konverzace** = chatovací místnost uvnitř (`ChatChannel`).

---

## 1. Koncept — „Depeše"

Světový chat není Discord. Je to **operativní srdce hry** — místo, kde se odehrává
roleplay. Vizuální metafora: **dispečink / korespondenční dossier**. Sidebar = *registr
linek*, prostřední panel = *přepis depeší*, presence panel (PJ) = *nástup / muster*.

**Klíčové napětí:** chat musí být dost *neutrální*, aby přijal kterýkoli z 12+ žánrových
skinů (cyberpunk, dark-fantasy, western, horor, vesmír, steampunk, apokalypsa…), a zároveň
dost *charakterní*, aby nepůsobil genericky. Řešení — **kosti vs. povrch**:

- **Kosti (fixní):** layout, rytmus sidebaru, řádkový „deník" zpráv, kotvy pro ornamenty.
- **Povrch (skin-driven):** barvy, textury, výplně ornamentů — z `--theme-*` tokenů +
  opt-in proměnných, které per-skin `decorations.css` může naplnit.

Chat je řádkový (reuse `MessageList`/`MessageItem` z fáze 4 — žádné bubliny), drží
konzistenci s Hospodou 4.1.

---

## 2. Signature prvek — „nit kanálu"

To jediné, co si uživatel zapamatuje. Každý **kanál má barvu** (§4). Aktivní konverzace
protáhne barvu svého kanálu jako **tenkou světelnou nit** napříč prostředním panelem:
levý 2px seam message streamu + focus-ring composeru + podtržení headeru konverzace.

Na první pohled *cítíš*, ve kterém kanálu jsi — jedna akcentová nit prošitá celým
dossierem, jako záložková stužka. Skin-agnostické (`color-mix` nad skin tokeny), levné,
nezaměnitelné. Při přepnutí konverzace nit 200 ms přebarví (`transition` na barvě seamu).

---

## 3. Layout & mřížka

```
PJ / Pomocný PJ (3 panely)            Hráč (2 panely)
┌────────┬──────────────┬────────┐    ┌────────┬───────────────────┐
│ SIDEBAR│  MESSAGE      │PRESENCE│    │ SIDEBAR│  MESSAGE STREAM   │
│ 272 px │  STREAM 1fr   │ 220 px │    │ 272 px │  1fr              │
│        │              │        │    │        │                   │
│ pinned │  ┌header────┐│přítomní│    │        │  ┌header────────┐ │
│ ──────│  │ transcript││ ────── │    │        │  │ transcript    │ │
│ kanály │  │          ││ členové│    │        │  │               │ │
│        │  └composer──┘│        │    │        │  └composer───────┘ │
└────────┴──────────────┴────────┘    └────────┴───────────────────┘
```

- Vnější rám: `1px solid --theme-border-soft`, `--radius-md`, výška
  `calc(100dvh - --header-h - reserve)` — stejný princip jako Hospoda.
- Sidebar má **diagonálně useknutý vnitřní seam** (pravý okraj 1px + `--theme-glow`
  hairline) — drobné grid-breaking gesto, ať to není jen tři obdélníky.
- Presence panel se renderuje **jen `PomocnyPJ+`**; hráči se grid zúží na 2 sloupce.

---

## 4. Sidebar — registr linek

- **Pinned sekce** nahoře — připnuté konverzace: kompaktní řádky, ikona 📌, oddělená
  `--section-divider`.
- **Kanál** (`ChatGroup`) = sbalovací „kniha": hlavička s chevronem, názvem
  (`--font-display`, uppercase, `letter-spacing 0.06em`), volitelným mini-thumbem
  obrázku kanálu (24 px, `--radius-sm`) a **barevným hřbetem** vlevo (3px).
- **Barvy kanálů — harmonický systém, ne náhodná duha.** 6 slotů
  `--chat-group-1 … --chat-group-6` v chat modulu, default = kurátorovaná sada laděná
  tak, aby seděla na tmavé i světlé skiny. Per-skin `decorations.css` je **smí
  přebarvit** k žánru. Kanál → slot deterministicky (hash `id` % 6).
- **Konverzace** (`ChatChannel`) = dvouřádková dlaždice: 1. řádek ikona dle `accessMode`
  (🌐 `all` / 🔒 `roles` / 👥 `members`) + název + unread badge vpravo (pill, barva
  kanálu); 2. řádek **náhled poslední zprávy** (`lastMessagePreview`, `--text-xs`,
  `--theme-text-dim`, jeden řádek s ellipsis). Na hover 📌 pin toggle. Aktivní
  konverzace: výplň `--theme-nav-active-bg`, levý 3px segment v barvě kanálu.
- PJ: `+ Kanál` (pata sidebaru) a `+ Konverzace` (hover hlavičky kanálu) — decentní
  ghost tlačítka, ne křiklavá.

---

## 5. Message stream

- Řádkový deník (reuse `MessageItem`): čas · jméno · obsah. Seskupení po sobě jdoucích
  zpráv téhož autora do 3 min (hlavička jen u první) — jako 4.1.
- **Header konverzace:** název (`--font-display`), pod ním 1px podtržení v barvě kanálu
  (nit), vpravo počet členů / tlačítko presence sheetu (mobil/PJ).
- Systémové zprávy vystředěné, `--text-sm`, `--theme-text-muted`.
- Soft-deleted: kurzíva, `--theme-text-dim`, „Zpráva byla smazána".
- **Composer:** focus-ring v barvě kanálu (nit). V 6.1 jen prostý text + Enter;
  whisper/přílohy/NPC zapíná 6.2 (`ChatInput` dostane props na skrytí).
- Prázdná konverzace: decentní in-fiction hláška („Zatím žádné depeše."), ne prázdná plocha.

---

## 6. Presence panel (PJ/Pomocný PJ) — „muster"

Roster členů konverzace **grupovaný dle world role** — tři sbalovací sekce
(viz screenshot starého Matrixu): **Vypravěči** · **Korektoři** · **Ostatní**.

- Nadpis sekce: `--font-display`, uppercase, `letter-spacing 0.06em`, počet členů
  v závorce, `--section-divider` pod ním.
- Řádek člena: avatar (s `--radius-full`), jméno, **online tečka** vlevo od avataru —
  `--success` plná = právě přítomen, jinak prázdná/ztlumená. Přítomní řazeni nahoru
  v rámci sekce, offline ztlumení (`--theme-text-dim`).
- Vypravěči dostanou drobný akcent (jméno `--theme-heading`) — vizuální hierarchie.
- Reuse `UserList`, rozšířený o sekce + online indikátor.
- Mobil: side-sheet zprava, `backdrop-filter: blur`.

> Časové štítky („naposled 2 h") záměrně vynechány — 6.1 ukazuje jen online/offline,
> last-seen je dluh (spec §5).

---

## 7. Skin-hook strategie

Chat CSS konzumuje **jen `--theme-*` tokeny** → token-level skin funguje pro všech 12+
žánrů zdarma, hned. Navíc chat vystaví **opt-in ornamentové proměnné** s bezpečným
fallbackem — per-skin `decorations.css` je smí naplnit:

| Proměnná | Co | Fallback |
|---|---|---|
| `--chat-panel-texture` | textura/obrázek panelů | `none` |
| `--chat-sidebar-edge` | ozdoba pravého seamu sidebaru | hairline glow |
| `--chat-channel-marker` | tvar markeru aktivního kanálu | plný 3px segment |
| `--chat-group-1…6` | paleta barev kanálů | kurátorovaný default |

⚠️ Obrázkové ornamenty/textury per žánr **dodá autor na vyžádání** — audit z toho dělá
konkrétní seznam (viz §9). CSS-only ornamenty (seamy, hřbety, vignette) kreslím sám.
Pravidla: ornamenty scoped na `[data-theme]`, originální per žánr, žádná recyklace
(`feedback_skin_originality` + `feedback_theme_isolation`).

---

## 8. Motion

- Načtení stránky: sidebar kanály stagger fade-in (`animation-delay`, 40 ms krok).
- Nová zpráva: fade + slide-up 120 ms (jako 4.1).
- Přepnutí konverzace: nit přebarví 200 ms; transcript krátký fade 100 ms.
- Sbalení kanálu: výška `grid-template-rows 0fr↔1fr` transition.
- Vše respektuje `prefers-reduced-motion` (skiny mají `reducedMotion` flag).

---

## 9. Seznam assetů k dodání autorem (per žánr, volitelné)

Audit doporučuje token-level + CSS-only ornamenty pro **všech 12 skinů jako základ**.
Pokud autor bude chtít bohatší žánrovou grafiku, dodá:
- texturu panelu (bezešvá, ~256×256, webp/png) — `--chat-panel-texture`,
- volitelně motiv pravého seamu sidebaru (vertikální, ~16px šíře).

Bez dodaných assetů zůstává chat na čistém token-level skinu — plně funkční a žánrově
přebarvený, jen bez rastrových textur.

---

## 10. Mobil

- < 768px: vždy 1 sloupec — viditelný je message stream.
- Sidebar = levý drawer (hamburger v headeru kanálu), presence = pravý sheet (jen PJ).
- Composer ukotven dole, `safe-area-inset-bottom`.
- Touch terče ≥ 44px; ověří `mobil-desktop` po implementaci.
