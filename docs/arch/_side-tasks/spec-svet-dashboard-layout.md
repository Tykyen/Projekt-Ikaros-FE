# Side-task — Přestavba layoutu World dashboardu

**Status:** ✅ Schváleno + implementováno (2026-05-18)
**Rozsah:** FE — přeskupení `WorldDashboard` (member větev). Bez BE změn, bez nových dat.
**Velikost:** odhad ~6 souborů / ~250 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-18
**Souvisí:** [spec-5.2.md](../phase-5/spec-5.2.md) (dashboard), kroky 5.5a / 5.6 (StatBar, dlaždice Chat)

---

## 1. Cíl

`WorldDashboard` má dnes 3 sloupce (Akce / Novinky / Oblíbené) + spodní lištu `StatBar` se 4 dlaždicemi (Hráčů / Akcí / Novinek / Chat). Dlaždice „Akcí" a „Novinek" duplikují počet, který je vidět ve sloupcích vedle.

Cíl — integrované rozložení: tlačítka **Hráči** a **Chat** přímo nad svými obsahovými sloupci, **Oblíbené** jako plnovýškový pravý sloupec.

---

## 2. Cílové rozložení

```
┌──────────┐ ┌──────────┐ ┌──────────────┐
│  HRÁČI   │ │  CHAT    │ │              │
└──────────┘ └──────────┘ │  Oblíbené    │
┌──────────┐ ┌──────────┐ │  stránky     │
│  Akce    │ │ Novinky  │ │              │
│  (box)   │ │ (box)    │ │              │
└──────────┘ └──────────┘ └──────────────┘
```

- **Levý sloupec:** dlaždice Hráči (nahoře) + box Akce (pod ní).
- **Střední sloupec:** dlaždice Chat (nahoře) + box Novinky (pod ní).
- **Pravý sloupec:** Oblíbené stránky — plná výška (span obě řádky).
- **`StatBar` lišta zaniká** — dlaždice Akcí a Novinek (počty) se ruší úplně.

---

## 3. Audit současného stavu

- `WorldDashboard.tsx` — `.grid` (3 sloupce `1fr 1.4fr 1fr`) s `EventsColumn` / `NewsColumn` / `FavoritePagesColumn`, pod tím `<StatBar>` (4 dlaždice).
- `StatBar.tsx` — lišta dlaždic; `StatItem` má `icon`, `value?`, `label`, `to?`, `badge?`.
- `WorldDashboard.module.css` — `.grid`, `.col` (fadeUp stagger), tablet 2 sloupce, mobil 1.
- Dlaždice „Hráči" → `/svet/:slug/hraci` (5.6), „Chat" → `/svet/:slug/chat` + `badge` z `useWorldChatUnread` (placeholder 0).

---

## 4. Návrh řešení

### 4.0 Dotčené soubory

```
WorldDashboardPage/WorldDashboard/
├── WorldDashboard.tsx                ← nový grid, bez StatBar
├── WorldDashboard.module.css         ← grid layout
├── components/
│   ├── DashTile.tsx + .module.css    ← NOVÁ — klikací dlaždice (z StatBaru)
│   ├── StatBar.tsx + .module.css     ← SMAZAT
│   └── StatBar.module.css            ← SMAZAT
└── __tests__/cards.spec.tsx          ← StatBar testy → DashTile
```

### 4.1 `DashTile` — klikací dlaždice

Nahrazuje `StatBar` / `StatItem`. Jedna dlaždice:
- Props `{ icon, label, to, value?, badge? }`.
- Kompaktní **horizontální** layout — ikona vlevo, label, vpravo `value` (velké číslo) nebo `badge` (svítící počet, jen > 0). Nižší než dnešní `StatBar` stat (není to obsahový box).
- Klikací (`<Link>`), panel-styl (`--surface-2`, `--frame-border`, `radius 12px`), hover lift; `prefers-reduced-motion`.

### 4.2 `WorldDashboard` — nový grid

- Grid 3 sloupce `1fr 1fr 1.1fr`, řádky `auto 1fr`:
  - `[1,1]` dlaždice Hráči, `[2,1]` dlaždice Chat (řádek 1 — auto výška).
  - `[1,2]` `EventsColumn`, `[2,2]` `NewsColumn` (řádek 2).
  - `[3, 1/3]` `FavoritePagesColumn` — span obě řádky.
- Dlaždice Hráči — `value` = počet členů (`useWorldMembers`), `to` = `/hraci`.
- Dlaždice Chat — `badge` = `useWorldChatUnread`, `to` = `/chat`.
- `useWorldGameEvents` / `useWorldNews` pro počty ve `StatBaru` **už nejsou potřeba** — počty zmizely; sloupce si data tahají samy.
- Staggered `fadeUp` reveal (dlaždice + sloupce).

### 4.3 Responsivita

- **Tablet (≤1024):** Oblíbené ztratí plnou výšku — layout 2 sloupce: řádek 1 Hráči+Chat, řádek 2 Akce+Novinky, řádek 3 Oblíbené přes celou šířku.
- **Mobil (≤768):** 1 sloupec, pořadí Hráči → Akce → Chat → Novinky → Oblíbené (páry drží pohromadě).

### 4.4 Design audit (`frontend-design`)

- Dlaždice Hráči/Chat = **navigační prvek**, vizuálně lehčí než obsahové sloupce — kompaktní, horizontální, ať „sedí na" svém sloupci jako záhlaví.
- Sloupce (`DashColumn`) beze změny vnitřku — mění se jen umístění v gridu.
- Tokeny only — `lint:colors` ✓.

---

## 5. Out of scope

- Obsah sloupců Akce / Novinky / Oblíbené — beze změny (5.5).
- Chat unread tracking — fáze 6 (placeholder hook zůstává).
- Non-member / pending větve dashboardu — beze změny.

---

## 6. Acceptance kritéria

1. `WorldDashboard` — grid: Hráči+Akce vlevo, Chat+Novinky uprostřed, Oblíbené plnovýškový pravý sloupec.
2. `StatBar` lišta zrušena; dlaždice Akcí/Novinek (počty) pryč.
3. `DashTile` — Hráči (počet členů, → `/hraci`), Chat (badge unread, → `/chat`).
4. Tablet 2 sloupce + Oblíbené na šířku; mobil 1 sloupec (Hráči → Akce → Chat → Novinky → Oblíbené).
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. Testy `StatBar` přepsány na `DashTile`.

---

## 7. Test plán

- `DashTile` — render ikona + label; `value` velké číslo; `badge` jen > 0; `to` → `<Link>`.
- `WorldDashboard` — render 2 dlaždic + 3 sloupců, žádná `StatBar` lišta.
- `mobil-desktop` audit.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Smazání `StatBar` rozbije import jinde | Nízká | Nízký | `StatBar` se používá jen ve `WorldDashboard` — ověřit grepem. |
| Grid span na tabletu těsný | Střední | Nízký | Breakpoint 1024 → 2sloupcový fallback. |

**Rollback:** Revert commitu — layout-only změna.

---

## 9. Otázky k autorovi

Žádné — rozložení odsouhlaseno (ASCII), mobil dle návrhu.

> Po schválení → implementace.
