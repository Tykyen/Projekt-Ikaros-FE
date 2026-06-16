# N-2 — token-mapping pro zbývající hardcoded barvy

> Stav 2026-06-04. Podklad pro dotažení barevné konzistence (lint:colors).
> **Hotovo:** bílé/černé overlaye (408×) → `var(--white-rgb)`/`var(--black-rgb)`.
> **Zbývá:** ~2296 (lint:colors). Tento soubor je mapa, jak na ně — **vyžadují vizuální
> projití** (oko u browseru napříč tématy), proto nejsou v automatickém commitu.

## ⚑ Aktualizace 2026-06-16 — KLÍČOVÉ: většina „dluhu" je datová identita, ne chrome

`lint:colors` hlásí **2340**, ALE rozbor (per soubor + typ) ukázal, že to jsou
**dvě úplně různé věci**:

| Kategorie | Počet | Co s tím |
|---|---|---|
| **Datové identity** | **1271** | **NEtokenizovat → patří do ALLOW** (jako už vyňatý `tactical-map/system-panels`) |
| └ kostkové skiny (`/chat/dice/`) | 454 | `diceSkins.ts` (165) = palety 30 skinů; `components/models/*` + `polyhedralDice.css` = 3D render. Záměrně fixní napříč tématy. |
| └ herní systémy (`/diary-systems/`) | 817 | `styles/*.css` (drd2, shadowrun, gurps, matrix…) + `sheets/*.tsx` = identita systému, ne chrome. |
| **Skutečný chrome drift** | **1069** | tokenizovat (theme-aware) — viz mapa níž. 160 souborů, max 34/soubor, dlouhý chvost. |

**Typy z 2340:** rgba 1233, hex 1096, rgb 7, color-name 3, hsl 1.

**Doporučený první krok (bezpečný, bez vizuálu):** rozšířit `ALLOW` v
`scripts/lint-no-hardcoded-colors.mjs` o čistě datové cesty — tím spadne číslo
2340 → ~1069 a zůstane jen skutečný chrome:
- `/chat/dice/lib/` + `/chat/dice/components/models/` + `polyhedralDice.css`
- `/diary-systems/styles/` + `/diary-systems/sheets/`
- ⚠️ pozn.: dice **UI pickery** (`SkinPickerPanel`/`PoolPromptModal`/`DicePickerPopover`/
  `DiceRollOverlay` `.module.css`) jsou chrome okolo kostek — ty do ALLOW **ne**,
  patří do tokenizace.

**Top chrome soubory (cíle tokenizace, sestupně):** `TemplateEditorModal.module.css`
(34), `NotificationCenter.module.css` (28), `PostavaLayout.module.css` (27),
`DataTemplatePanel` (26), `StyleRail` (26), `HeroUploadCard` (23),
`LinkPickerPopover` (22), `WeatherGeneratorCard`/`AkjLockedPanel` (20).

**Tokeny, na které mapovat** (z [tokens.css](../src/themes/_shared/tokens.css)):
stíny `--shadow-sm/md/lg/xl` + `--depth-*`; overlaye `rgb(var(--white-rgb)/α)` /
`rgb(var(--black-rgb)/α)`; scrim `--scrim`; povrchy `--surface-1/2/3` /
`--theme-surface*`; okraje `--frame-border` / `--theme-border*`; sémantika
`--danger`/`--info`/`--warning`; role `--role-*`; novinky `--news-*`; presence
`--presence-*`. Bílá/černá konstanty `--white-rgb`/`--black-rgb`.

## Proč zbytek nejde automaticky

Bílá/černá byly **fyzikální konstanty** (255/0 jsou stejné v každém tématu) → tokenizace 1:1
beze změny vzhledu. Zbytek jsou **designové barvy** (fialová akcentová, modrý text…). Ty se
**mají měnit per téma** (světlé téma ≠ tmavé), takže patří na *theme-aware* token
(`var(--theme-accent)`, `var(--text)`…), ne na konstantu. Zabetonovat je do konstanty = schovat
před lintem, ale rozbít theme-awareness. A který theme token sémanticky sedí, pozná jen oko
(stejné `#fff` je jednou „bílá ikona", jindy „text na barvě").

## Kategorie a doporučený token

| Kategorie | Příklad (počet) | Doporučený token | Pozn. |
|---|---|---|---|
| Solid bílá/černá | `#fff` (149), `#000` (10) | `var(--text-strong)` / `var(--text)` / `var(--surface-*)` | dle role (text vs ikona vs pozadí) — **kontext** |
| Fialové akcenty | `#a78bfa` (48), `#7c5cff` (48) | `var(--theme-accent)` | blízké `--map-ui-accent` (120 100 255), ale ne přesné |
| Modré akcenty | `#3b5af6` (45), `#6f9bff`, `#78c8ff` | `var(--theme-accent)` / info token | rozlišit primary vs odkaz |
| Modrý text na tmavém | `rgba(220,230,255,α)` (~120) | nový `--text-on-dark-rgb` NEBO `var(--text-soft)` | konzistentní hodnota → kandidát na 1 token |
| Akcent s alfa | `rgba(120,100,255,α)` (~50) | `rgb(var(--theme-accent-rgb)/α)` | 120 100 255 = přesně map accent |
| Sémantické | `#ff5764`/`#f43f5e` (danger), `#22d3ee` (info), `#ffae00`/`#ffd166` (warning), `#ef4444` (error) | `var(--danger)`/`--info`/`--warning` | mapovat na sémantické role |
| Tmavé panely | `rgba(20,14,50,α)`, `rgba(30,40,60,α)` | `var(--surface-1/2/3)` | dle hloubky |
| Tlumený text | `#94a3b8`, `#e2e8f0` | `var(--text-muted)` / `--text-soft` | |

## Doporučený postup (pro projití u browseru)

1. **Per komponenta, ne globálně** — otevři komponentu v browseru, převeď její barvy, vizuálně
   ověř ve 2–3 tématech (světlé + tmavé + ikaros). Tím chytíš špatně zvolený token hned.
2. **Začni od `rgba(220,230,255,α)` a `rgba(120,100,255,α)`** — mají konzistentní hodnotu, takže
   buď 1 nový token (`--text-on-dark-rgb`), nebo přesné mapování na existující accent. Největší
   bezpečný kus po bílé/černé.
3. **Sémantické (`#ff5764` danger…)** — mapuj na sémantické tokeny, ne na konkrétní hex; sjednotí
   to barvy stavů napříč appkou.
4. **`#fff` solid (149×)** nech naposled — nejvíc kontextové (každý výskyt chce rozhodnutí).

## Jak měřit postup

```
npm run lint:colors   # počet hardcoded barev (2296 → cíl 0 mimo allowlist)
```

Allowlist (legit, neřešit): `themes/themes/`, `themes/effects/`, `themes/_shared/`,
`tactical-map/.../system-panels/` (záměrná systémová identita), `.spec.`/`.test.`,
inline `/* lint-colors-ignore */`.
