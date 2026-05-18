# Spec 5.6 — Stránka hráčů světa (adresář členů)

**Status:** ✅ Schváleno + implementováno (2026-05-18)
**Rozsah:** FE (`Projekt-ikaros-FE`) — nová stránka adresáře členů světa. Bez BE změn.
**Velikost:** odhad ~9 souborů / ~420 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-18
**Souvisí:** [spec-5.2.md](spec-5.2.md) (dashboard, StatBar), [spec-5.3.md](spec-5.3.md) (členové, skupiny)

---

## 1. Cíl

Dlaždice „Hráči" ve `StatBar` dashboardu je dnes jen neklikací počet. Cíl — udělat z ní vstup na **stránku hráčů světa**: adresář, kdo svět tvoří — vedení a členové po skupinách.

1. **Stránka „Hráči světa"** — nová route `/svet/:worldSlug/hraci`.
2. **Struktura** — nahoře vedení (PJ, Pomocní PJ) zvlášť; pod tím skupiny a jejich členové; nakonec „Bez skupiny".
3. **Vstupy** — klikací dlaždice „Hráči" ve `StatBar` + položka „Hráči" v nav světa.

---

## 2. Rozsah

| Část | Stav |
|---|---|
| Adresář členů — role, skupiny, barvy skupin, avatary | ✅ v rozsahu — `useWorldMembers` + `useWorldSettings` jsou hotové |
| Veřejná stránka postavy (proklik z karty člena) | ⛔ **fáze 8** — character flow; karta na to nechá slot |
| Deníky (hráčský i PJ pohled) | ⛔ **fáze 8** — BE schema existuje, FE nula |

### Mimo rozsah

- **Stránka postavy** a **deníky** — fáze 8 (character flow). Karta člena je připravena slotem, ale dokud fáze 8 nepřinese postavy, žádný odkaz na postavu/deník se nerenderuje.
- **Správa členů** (změna role / skupiny) — to řeší `WorldSettingsPage` (5.3c). Tato stránka je **jen pro čtení**.

---

## 3. Audit současného stavu

- **`useWorldMembers(worldId)`** ([api/useWorldMembers.ts](../../src/features/world/api/useWorldMembers.ts)) — `GET /worlds/:id/members` → `WorldMembership[]`; člen má `role` (`WorldRole`), `group?`, `characterPath?`, `avatarUrl?`, `user { id, username, avatarUrl? }`.
- **`useWorldSettings()`** — `customGroups: string[]`, `groupColors: Record<string,string>` (skupina → hex).
- **`WorldRole`** enum — `Zadatel 0 / Ctenar 1 / Hrac 2 / Korektor 3 / PomocnyPJ 4 / PJ 5`. Komponenta **`WorldRoleChip`** (ikona + label).
- **`StatBar`** ([WorldDashboard/components/StatBar.tsx](../../src/features/world/pages/WorldDashboardPage/WorldDashboard/components/StatBar.tsx)) — čistě prezentační, žádná dlaždice není klikací.
- **`UserAvatar`** (`@/shared/ui`) — avatar komponenta.
- Nav světa — `WorldLayout` `buildNav()`, skupina „Společenství" (Obchod / Skupiny / Pavučina).
- `CharactersPage` / `MyCharacterPage` — stub (fáze 8).

---

## 4. Návrh řešení

### 4.0 Dotčené soubory

```
src/features/world/
├── pages/WorldMembersPage/
│   ├── WorldMembersPage.tsx          ← NOVÁ — adresář členů
│   ├── WorldMembersPage.module.css
│   ├── MemberCard.tsx                ← NOVÁ — karta člena
│   ├── MemberCard.module.css
│   ├── WorldMembersPage.spec.tsx
│   └── index.ts
└── pages/WorldDashboardPage/WorldDashboard/
    ├── WorldDashboard.tsx            ← „Hráči" stat dostane odkaz
    └── components/StatBar.tsx (+css) ← podpora volitelného odkazu na dlaždici
src/app/router.tsx                    ← route `hraci`
src/app/layout/WorldLayout/WorldLayout.tsx  ← nav „Hráči"
```

### 4.1 Route + nav

- Route `{ path: 'hraci', element: memberOnly(p(WorldMembersPage)) }` pod `/svet/:worldSlug/*`.
- Nav — položka „Hráči" do skupiny „Společenství" v `buildNav()`.

### 4.2 `StatBar` — klikací dlaždice

- `StatItem` rozšířit o volitelné `to?: string`. Když je `to` zadáno, dlaždice se renderuje jako `<Link>` (hover stav); jinak `<div>` jako dnes.
- `WorldDashboard` — dlaždici „Hráči" předá `to={/svet/:worldSlug/hraci}`. Ostatní dlaždice beze změny.

### 4.3 `WorldMembersPage` — adresář

Data: `useWorldMembers(worldId)` + `useWorldSettings()`. Rozdělení členů:

1. **Vedení** — `role === PJ` → sekce „Pán jeskyně"; `role === PomocnyPJ` → sekce „Pomocní PJ". (Člen ve vedení se neopakuje ve skupinách.)
2. **Skupiny** — pro každou skupinu z `customGroups` sekce se členy, kde `member.group === skupina` a člen **není** ve vedení.
3. **Bez skupiny** — členové mimo vedení bez `group` (role `Ctenar` / `Hrac` / `Korektor`).
4. **Zadatelé** (`role === Zadatel`, pending vstup) — **nezobrazují se** (nejsou plnými členy).

Loading → `Spinner`; prázdný svět → kultivovaný empty stav.

### 4.4 `MemberCard`

- Avatar (`UserAvatar`), jméno (`user.username`), `WorldRoleChip`.
- **Slot pro fázi 8** — `characterPath` na membershipu existuje, ale dokud character flow (fáze 8) nepřinese stránku postavy a deníky, karta žádný odkaz na postavu/deník nerenderuje. Komentář v kódu označí místo.
- Karta je odkaz na profil postavy až ve fázi 8; teď neklikací.

### 4.5 Design audit (`frontend-design`)

Stránka žije uvnitř světového motivu — barvy dědí ze skinu (tokeny). Audit řeší strukturu a charakter.

- **Koncept „Síň společenství"** — kdo svět tvoří, hierarchicky shora dolů.
- **Sekce** — nadpisová lišta (ikona `lucide-react` + titulek, uppercase, `letter-spacing: 0.08em`) nad gridem karet — jazyk `DashColumn`.
- **Vedení** — sekce PJ + Pomocní PJ jako první, prominentnější (ikona role akcentová).
- **Skupina** — nadpis sekce nese barevnou tečku z `groupColors` (data-driven přes inline `--group-color` custom property; není to hardcoded literál).
- **Karty** — grid `repeat(auto-fill, minmax(200px, 1fr))`; panel-styl jako `DashColumn` (`--surface-2`, `--frame-border`, `radius 12px`). Hover jemný lift.
- **Motion** — staggered `fadeUp` reveal sekcí (`animation-delay`), `prefers-reduced-motion` respekt.
- **Tokeny only** — `lint:colors` ✓ (barvy skupin jsou uživatelská data, ne literál).

### 4.6 mobil-desktop + nápověda

`mobil-desktop` — grid karet 1/2/N sloupců dle šířky. `napoveda` — nová položka „Hráči světa" do `WORLD_PAGES_OK`.

---

## 5. Out of scope

- Stránka postavy + deníky → **fáze 8**.
- Správa rolí / skupin → `WorldSettingsPage` (5.3c).
- Klik na kartu člena (proklik na postavu) → fáze 8.

---

## 6. Acceptance kritéria

1. Route `/svet/:worldSlug/hraci` → `WorldMembersPage`; položka „Hráči" v nav (Společenství).
2. `StatBar` dlaždice „Hráči" je klikací → vede na stránku; ostatní dlaždice beze změny.
3. Stránka: sekce PJ + Pomocní PJ nahoře; skupiny s členy; „Bez skupiny"; Zadatelé skryti.
4. Skupina nese barvu z `groupColors`; `MemberCard` = avatar + jméno + `WorldRoleChip`.
5. Loading + prázdný stav.
6. Responsivní (mobil/tablet/desktop) — `mobil-desktop` audit.
7. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
8. FE testy — rozdělení do sekcí (vedení/skupiny/bez skupiny), Zadatel skryt, StatBar odkaz.

---

## 7. Test plán

- `WorldMembersPage` — render sekcí; PJ/PomocnyPJ ve vedení (ne ve skupině); člen se skupinou v sekci skupiny; bez skupiny v „Bez skupiny"; Zadatel se nezobrazí; empty stav.
- `StatBar` — dlaždice s `to` je `<Link>`, bez `to` je `<div>`.
- `MemberCard` — render avatar + jméno + role chip.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Člen s `group`, která není v `customGroups` | Nízká | Nízký | Fallback sekce „Bez skupiny" / „Ostatní". |
| Prázdné `customGroups` | Střední | Nízký | Jen vedení + „Bez skupiny". |
| `StatBar` změna rozbije 5.2 test | Nízká | Nízký | `to` volitelné — bez něj chování beze změny; test upravit. |

**Rollback:** Revert commitu — aditivní, nová stránka + volitelný `to` na StatBaru.

---

## 9. Otázky k autorovi

Žádné — rozsah odsouhlasen (adresář členů teď; vedení zvlášť → skupiny → bez skupiny; postavy a deníky = fáze 8).

> Po schválení → implementační plán → potvrzení → kód.
