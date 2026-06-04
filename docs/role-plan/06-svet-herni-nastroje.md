# 06 — Svět: herní nástroje (události / kalendář / timeline / počasí / deník PJ)

Nástroje PJ s mixem prahů (PomocnyPJ pro většinu zápisů, PJ pro preset mazání) a dvěma speciálními
hranami: **`groupOnly` události** (404 anti-leak pro cizí skupinu) a **archive policy** (hráč vidí jen
nedávné/nadcházející události — 24h cutoff, N-40). Timeline má navíc práh čtení **≥Hrac(2)** (Ctenar
nestačí — jiný než zbytek světa).

**BE:** `game-events`, `calendars`, `world-calendar-config`, `timeline`, `world-weather`, `world-gm-notes`
**FE:** `features/world` — Events, Calendar, Timeline, Weather, GmNotes (deník PJ)

> Sourozenec [bug-plan/10-svet-hra](../bug-plan/10-svet-hra.md). Tady role/leak/state hrany.

---

## A. Herní události (`PA` `LK` `OW`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| HN-01 | `canManage` ([game-events.service.ts:55]) = GlobalAdmin \|\| role>=PomocnyPJ(4) → create/update/delete. Hráč → 403 `[auto]` | `PA` | M4 | ⬜ |
| HN-02 | `canView` ([:66]) = GlobalAdmin \|\| (member && role>Zadatel); `groupOnly=true` → PomocnyPJ+ \|\| `member.group === event.targetGroup`. Skupinová izolace `[auto]` | `OW` `LK` | M1 | ⬜ |
| HN-03 | `assertViewOrThrow` ([:88]) → **404** (ne 403) když nemá přístup — neprozradí existenci události cizí skupiny. Red-team: hráč skupiny A GET událost skupiny B → 404 `[auto]` | `LK` | M8 | ⬜ |
| HN-04 | **N-40 archive policy:** hráč (role<PomocnyPJ) má 24h cutoff — vidí jen nedávné/nadcházející; archiv PJ-only. By-design (9.1-I). Ověřit, že FE nevolá archiv jako hráč (jinak prázdno/403) `[auto]` | `ST` `OR` | M1 | ⬜ |
| HN-05 | FE `Events` — tlačítka create/edit/delete jen PomocnyPJ+; skupinové události filtruje dle `member.group`. Parita s BE `canView` groupOnly `[auto]` | `PA` `LK` | M1 | ⬜ |

---

## B. Kalendář & konfigurace (`PA` `EN`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| HN-06 | `calendars.assertCanModerate` ([:142]) = PomocnyPJ+ → úprava kalendářních událostí. Hráč → 403 `[auto]` | `PA` | M4 | ⬜ |
| HN-07 | `world-calendar-config.assertMember` ([:313]) = member && role>=**Hrac(2)** pro čtení configu; pending/Ctenar? Ověřit práh (Ctenar smí číst kalendář?) `[auto]` | `EN` `PA` | M1 | ⬜ |
| HN-08 | `world-calendar-config.assertCanWrite` ([:341]) = PomocnyPJ+ → změna configu. `calendar-defaults` (PATCH /worlds) = PomocnyPJ+ nebo Admin `[auto]` | `PA` | M4 | ⬜ |
| HN-09 | **N-41 regrese:** `SetInGameDateModal` leap-aware (Únor 29 v nepřestupném roce). Ne role bug, ale ověřit, že set-in-game-date je PJ akce `[auto]` | `PA` | M1 | ⬜ |

---

## C. Timeline (`EN` `PA`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| HN-10 | `timeline.assertMember` ([timeline.service.ts:247-273](../Projekt-ikaros/backend/src/modules/timeline/timeline.service.ts#L247)) = member && role>=**Hrac(2)** pro čtení — **Ctenar(1) nestačí!** Jiný práh než zbytek světa. Ověřit, že FE timeline nezobrazí Ctenar/Zadatel (jinak BE 403) `[auto]` | `EN` `OR` | M2 | ✅ **R-06 opraveno** — FE `timeline` route `memberOnly(Hrac)` (gate Ctenar dřív) + BE rozlišený kód Zadatel/Ctenar |
| HN-11 | `timeline.assertCanWrite` ([:279]) = PomocnyPJ+; neexistující svět → 404 (anti-leak) `[auto]` | `PA` `LK` | M4 | ⬜ |
| HN-12 | FE Timeline — gating čtení na Hrac+, zápis na PomocnyPJ+. Parita s oběma prahy `[auto]` | `PA` | M1 | ⬜ |

---

## D. Počasí (`PA` `EN`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| HN-13 | `world-weather.assertMember` ([:359]) = každý člen čte počasí; `assertCanWrite` ([:390]) = PomocnyPJ+ pro úpravu; `assertIsPJ` ([:169]) = **PJ(5)** pro mazání custom presetu. **Tři prahy** `[auto]` | `EN` `PA` | M2 | ⬜ |
| HN-14 | FE Weather — generovat/upravit počasí PomocnyPJ+; mazat preset PJ. Ověřit, že FE nerozhazuje tři prahy `[auto]` | `PA` | M1 | ⬜ |
| HN-15 | Počasí přes WS (`weather:updated` do `world:{id}`) — N-8: room join bez membership (přijaté riziko, počasí = kosmetika). Odkaz oblast 09 `[auto]` | `LK` | M5 | ⬜ |

---

## E. Deník PJ / GM notes (`OW` `PA`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| HN-16 | `world-gm-notes.assertPj` ([:40]) = PomocnyPJ+ → deník PJ (WorldGmNotes) je world-level **per-PJ** (paměť: gm-diary architecture). Hráč → 403; deník je privátní per-PJ `[auto]` | `OW` `PA` | M4 | ⬜ |
| HN-17 | Red-team: PomocnyPJ A čte deník PomocnyPJ B? Deník je per-PJ — ověřit, že jeden PJ nevidí poznámky druhého (ownership uvnitř staff) `[auto]` | `OW` | M8 | ⬜ |
| HN-18 | Hráčův deník = CharacterNotes (oblast 05); deník PJ = WorldGmNotes. Ověřit, že se nepletou (hráč nedostane GM notes přístup) `[auto]` | `OW` | M1 | ⬜ |

---

## F. Matice persona × akce (herní nástroje)

| Akce / persona | guest | Zadatel | Ctenar | Hrac | Korektor | PomocnyPJ | PJ | GlobalAdmin |
|---|---|---|---|---|---|---|---|---|
| číst události (vlastní skupina) | 🚫 | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| číst událost **cizí** skupiny | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | ✅ | ✅ |
| archiv událostí (>24h) | 🚫 | ⛔ | ⛔ˢ | ⛔ˢ | ⛔ˢ | ✅ | ✅ | ✅ |
| create/edit událost | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| číst kalendář config | 🚫 | ⛔ | ⛔? | ✅ | ✅ | ✅ | ✅ | ✅ |
| číst **timeline** | 🚫 | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ |
| zapsat timeline/kalendář | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| upravit počasí | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| smazat počasí preset | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| deník PJ (vlastní) | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ᵒ | ✅ᵒ | ✅ |

`ˢ` = archiv je PJ-only (N-40, by-design). `⛔?` = Ctenar čtení kalendář config — ověřit práh (HN-07).
`✅ᵒ` = vlastní deník PJ (per-PJ ownership, HN-17).

> **Delta parity (herní nástroje):**
> - HN-10 timeline ≥Hrac — Ctenar/Zadatel **nevidí** · ověřit, že FE je nezkouší zobrazit (jinak 403)
> - HN-03 groupOnly 404 — **⚠️ red-team** (cizí skupina → 404 ne 403)
> - HN-04 archiv 24h — **by-design** (N-40), ověřit FE nevolá jako hráč
> - HN-13 počasí 3 prahy — **ověřit FE nerozhazuje**
> - HN-17 deník PJ per-PJ — **⚠️ red-team** (PomocnyPJ↔PomocnyPJ izolace)
> - ostatní → vyplnit.

---

## Test coverage gaps

- `groupOnly` 404 anti-leak (HN-03) — red-team test cizí skupina.
- Timeline ≥Hrac práh (HN-10) — kontraktní test FE↔BE (jiný práh než zbytek).
- Deník PJ per-PJ izolace (HN-17) — ownership test uvnitř staff vrstvy.
- Počasí 3 prahy (HN-13) — test, že PomocnyPJ nesmaže preset.

---

## Známá rizika

- **RH-1 (`EN`/HN-10)** — timeline čtení na **Hrac(2)**, ne Ctenar. Snadno přehlédnutelné — pokud FE
  zobrazí timeline Ctenari, dostane 403. Either over-restrikce BE, nebo over-exposure FE.
- **RH-2 (`OW`/HN-17)** — deník PJ je per-PJ; pokud `assertPj` jen kontroluje roli (PomocnyPJ+) a ne
  ownership poznámky, jeden staff vidí poznámky druhého. **Red-team povinný.**
- **RH-3 (`OR`/HN-04)** — archiv 24h je by-design omezení hráče; FE komentář „minulé i budoucí" je
  zastaralý (N-40). Není bug, ale ověřit, že FE nevolá archiv jako hráč (zbytečné 403/prázdno).
