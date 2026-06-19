# Spec 14.7 — Export / záloha světa + import (Tisk/PDF · ZIP · round-trip)

> Fáze 14 · krok 14.7 · [H0-06 · dopad střední · náklad střední]
> Status: **🟡 spec ke schválení** (2026-06-19)
> Repozitáře: **oba** (FE `Projekt-ikaros-FE`, BE `Projekt-ikaros/backend`)
> Kryje i dluh **D-NEW-INV-ADMIN-UI** (FE konzument GDPR `GET /data-export/me`).

## Cíl

Dát uživateli vlastní kopii dat — proti vendor lock-inu (důvěrová páka z PDF/roadmapy) a jako doplněk serverových záloh (14.4). Dvě roviny:

1. **Tisk / PDF jednotlivých entit** (deník, záložky, kalendář, bestiář, mapy, stránka, pavučina, storyboard, obchod) — rychlé, „co vidím, to vytisknu".
2. **Záloha celého světa** do staženého ZIP (JSON + média) + **import zpět** (obnova / klon světa z balíku).

## Pravidlo viditelnosti (napříč celým krokem)

**Dotyčný exportuje/tiskne jen to, co reálně vidí.** PJ = vše; hráč = viditelná data + odemčené AKJ. Toho dosáhneme **znovupoužitím existujících viditelnostních filtrů** — žádná nová access logika:

| Entita | Filtr k reuse (BE) | Soubor |
|---|---|---|
| Page / Postava / NPC | `assertAccess` + `filterAkjTabsForViewer` + `passesAccess` | `pages.service.ts:769–917` |
| World-mapy (atlas) | `worldMaps.list()` (kaskáda složek, maže `visibleToPlayerIds`) | `world-maps.service.ts:62–117` |
| Game-events / timeline | `canView()` / `assertViewOrThrow()` | `game-events.service.ts:77–98` |
| Bestie | scope `system` (všem) / `user` (owner) / `world` (člen) | `bestiae.service` |
| Role/PJ bypass | `canManageMembers` / `canEditWorldData` / `assertMember` | `worlds.service.ts:1914–1972` |

> ⚠️ **Tvrdé pravidlo pro pilíř A i B:** export/print render NESMÍ volat širší endpoint než běžné zobrazení. Bere přesně ta data, která už FE/BE vrací pro view. Žádný „export-only" endpoint, který obchází filtry.

---

## Architektura — dva pilíře

| Pilíř | Co | Kde | Pokrývá body |
|---|---|---|---|
| **A — Tisk/PDF** | `window.print()` nad print-friendly renderem | **FE** | 2–14 |
| **B — Záloha + import** | ZIP (JSON+média) serializace + obnova | **BE** + FE UI | 1 + import |

💡 **Proč pilíř A přes `window.print()` a ne serverový PDF:** serverové PDF (puppeteer) v BE neexistuje = velká nová infra. FE už má viditelná data → tisk je zadarmo a automaticky filtrovaný. Prohlížeč v tisk-dialogu nabídne „Tisk" i „Uložit jako PDF" → jedna cesta pokryje *vytisknout* i *stáhnout PDF*. Rozhodnutí je vratné (puppeteer lze přidat později pro server-side PDF, pokud bude potřeba pixel-perfect).

---

## Část A — Tisk / PDF (FE)

### A0 — Sdílený tiskový framework

- **Tiskový mód entity:** route/parametr (např. `?tisk=1` nebo dedikovaná `/svet/:slug/tisk/...`), který vykreslí entitu v print layoutu.
- **`PrintLayout` + `usePrint()`** — sdílená komponenta + hook: připraví obsah, zavolá `window.print()`, po dokončení vrátí UI.
- **`@media print` stylesheet (sdílený):** skryje navigaci/tlačítka/HUD, černá-na-bílé, rozumné marginy, page-breaks mezi sekcemi.
- ⚠️ **Past — rozbalení obsahu:** AKJ záložky a `isCollapsed` sekce musí být v tisku **rozbalené** (jinak se vytiskne jen vizuálně otevřené). Print render je explicitně otevře.
- ⚠️ **Past — obrázky/pozadí:** `print-color-adjust: exact` (jinak prohlížeč zahodí pozadí/barvy), pozor na velké `bigImage`.
- Tlačítko **„Tisk / PDF"** v hlavičce/akcích každé tisknutelné entity. Mobil i desktop (na mobilu Chrome → „Uložit jako PDF").

### A — entity a jejich tisk

| # | Entita | Zdroj dat (reuse) | Volby |
|---|---|---|---|
| 2 | Deník postavy | `CharacterDiary` (sections + customData) | — |
| 5 | Deník NPC | `CharacterDiary` (NPC) | — |
| 3 | Záložky postavy **mimo kalendář** | Page `akjTabs` (filtrované) + subdoc finance/inventory/notes (viditelné) | **kalendář opt-in** (zaškrtnout) + **rozsah** |
| 6 | Záložky NPC mimo kalendář | dtto pro NPC | kalendář opt-in |
| 4 | Kalendář (PJ / postava / NPC / lokace) | `CharacterCalendar` + agregát + game-events | **rozsah** (od–do / N měsíců / N let) |
| 7 | Celý bestiář (vlastní / globální) | `Bestie` dle scope | scope: vlastní vs globální |
| 8 | Určité bestie | `Bestie` (výběr) | multi-select |
| 9 | Mapy (všechny / určité) | `WorldMapEntry` (atlas obrázky, filtrované) | all / výběr |
| 10 | Hvězdná mapa | `UniverseMap` (nodes+links) | — |
| 11 | Určitá stránka | `Page` (viditelná) | — |
| 12 | Pavučina | `Page` s `isWoodWide` (síť propojených) | celá síť |
| 13 | Storyboard | campaign (`StoryboardView`/`ScenarioTree`) | **jednotlivě / vše** |
| 14 | Obchod | shop (`ShopView` + položky) | — |

### A — kalendář s rozsahem (body 3, 4, 6)

Kalendář je **opt-in** (u záložek zvlášť zaškrtnout) a vždy s **rozsahem**:
- Volba rozsahu: od–do (fantasy datum) / posledních N měsíců / N let.
- 📚 *fantasy datum* = `{year, monthIndex, day, hour?}` dle `WorldCalendarConfig` daného světa (ne reálné datum).
- Tisk vykreslí jen události spadající do rozsahu; respektuje viditelnost (groupOnly events, skryté postavy).

---

## Část B — Záloha celého světa + import (BE + FE)

### B1 — Serializace stromu světa

Nový BE modul **`world-export`**. Sebere viditelný strom **jednoho** světa (dle `:id` v URL, ze kterého se export spustil — **žádná cross-world agregace**) do JSON:

```
World (root)
├─ WorldSettings
├─ WorldMembership[]            (import: remap/zahodit userId)
├─ Page[] (+ akjTabs filtrované)
├─ Character[] + 5 subdoc (diary/finance/inventory/calendar/notes)
├─ Bestie[] (scope dle viditelnosti)
├─ WorldMapEntry[] (atlas)        }
├─ MapScene[] (taktické)          } média referencují přes imageUrl
├─ UniverseMap (hvězdná)
├─ WorldCalendarConfig[]
├─ GameEvent[] / TimelineEvent[]
├─ campaign (storyboard / scenarios)
├─ shop (položky, skupiny)
├─ WorldGmNotes (jen PJ)
└─ [volitelně] chat               (zaškrtávací blok, default OFF)
```

### B2 — Formát balíku (ZIP) — **import-ready**

```
svet-<slug>-<datum>.zip
├─ manifest.json     { version, scope, exportedAt, worldSlug, counts, hasChat }
├─ data.json         celý strom (stabilní ID, reference grafu)
└─ media/            stažené binárky (avatary, mapy, obrázky), pojmenované deterministicky
```

- **`scope`** v manifestu = `"pj-full"` (PJ, kompletní) | `"viewer-partial"` (hráč, oříznuto filtry).
- **`version`** = verze schématu balíku → import migruje starší.
- Média: stáhnout z Cloudinary/disku, vložit do `media/`, v `data.json` nahradit `imageUrl` relativní cestou do balíku → při importu re-upload.

### B3 — Chat (volitelný blok)

- Default **vypnuto** (chat je obří + citlivý, GDPR ho také vynechává).
- PJ může zaškrtnout → přidá `chat/` (kanály + zprávy + attachmenty).
- Import balík **s chatem i bez** musí zvládnout (manifest `hasChat`).

### B4 — Stažení (stream, ať nezatíží server)

- **V1 = přímý stream** přes `archiver`: `GET /worlds/:id/export?scope=...&chat=0` → ZIP se generuje on-the-fly a pipuje do response (médi se streamují z Cloudinary do archivu, nedrží se celý v paměti).
- 🔀 *Alternativa (zamítnuto pro V1):* async job s temp úložištěm + polling/progress. Zvolen přímý stream — žádná nová job/queue infra, splňuje „nezatíží server" (paměťově streamuje). Pokud velké světy narazí na request-timeout → eskalace na async job (vratné).
- FE: tlačítko **„Exportovat / Zálohovat vše"** v nastavení světa + výběr scope (auto dle role) + chat checkbox + neurčitý progress + download.

### B5 — Import zpět (round-trip)

- `POST /worlds/import` (multipart ZIP) → parse `manifest.json`.
- ⚠️ **Přijme jen `scope === "pj-full"`** — `viewer-partial` odmítne (vyrobil by zmrzačený svět).
- **2-pass ID remap:** 1) vygeneruj mapu staré→nové ID pro všechny entity; 2) přepiš každou referenci (`characterRef`, `campaignSubjectId`, `calendarConfigId`, `folderId`, AKJ grants, parent linky).
- **Média:** `media/` → re-upload na Cloudinary → mapa stará→nová URL → přepiš `imageUrl`.
- **Účty:** `userId`/`ownerUserId` na cílové platformě neexistují → membership zahodit nebo namapovat na importujícího PJ (ten se stane ownerem).
- **Verze:** `version` < aktuální → migrace; > aktuální → odmítnout.
- **Kdo smí:** kdo smí zakládat svět (vytváří **nový** svět, importující = nový PJ/owner).
- 🔀 Pozn.: pro „omylem smazaný svět" zůstává primární **soft-delete 30d recovery** — import je disaster-recovery z lokálního souboru, ne náhrada.

### B6 — Round-trip ověření

Test: export `pj-full` → import → porovnat strukturu/počty entit (referenční integrita). To je hlavní záruka, že remap nic neutrhl — proto se export+import dělají **v jednom záběru**.

---

## Fázování (kompletní sub-kroky — žádný odložený dluh)

- **14.7a** ✅ *(2026-06-19)* — FE print framework (A0: `printMode` atom, `usePrint`, `PrintButton`, globální `print.css`) + tisk **stránky** (11) a **deníku PC/NPC** (2,5). **Pavučina (12) přesunuta do 14.7b** (canvas force-graph ≠ `isWoodWide` flag — viz plan-14.7a).
- **14.7b** ✅ *(2026-06-19)* — zbytek print entit ve 4 vlnách: **b-1** bestiář/obchod/mapy-atlas/storyboard (7,8,9,13,14) · **b-2** záložky postavy/NPC mimo kalendář, kalendář opt-in (3,6) · **b-3** kalendář s rozsahem 1–12 měsíců (4) · **b-4** pavučina + hvězdná (12,10), canvas snapshot `toDataURL`; WebGL hvězdná → DOM seznam těles. „Určité bestie/mapy" = přes filtr/složku/search (ne multi-select). Viz [plan-14.7b.md](plan-14.7b.md).
- **14.7c** ✅ *export hotový (2026-06-19)* — BE modul `world-export` (`GET /worlds/:id/export`, `pj-full`=PJ/Admin / hráč 403) → ZIP (`manifest.json`+`data.json`) celého lore stromu (stránky, postavy + všechny subdocs, kalendáře, taktické scény, atlas map, hvězdná, timeline, události, bestiář světa, celá kampaň) + FE tab „Export / Záloha" v nastavení světa. **Mimo V1:** binárky médií do ZIP (URL zůstávají v datech), per-PJ poznámky, chat. **Import (B5/B6) ODLOŽEN** — formát je **import-ready** (stabilní ID + `version` + `scope`).

> Každý sub-krok je samostatně kompletní a nasaditelný (pilíř A nezávisí na B).

---

## Dotčené soubory (orientačně)

**FE:**
- `src/features/world/export/` — nový: `PrintLayout`, `usePrint`, `print.module.css`, per-entita print views, „Zálohovat vše" panel + import dialog.
- Tlačítka „Tisk / PDF" v: `PageViewer`, `CharacterDetailPage`, bestiář, `world-maps`, universe mapa, `StoryboardView`, `ShopView`, kalendář.
- `WorldSettings` stránka — sekce Export/Záloha/Import.
- GDPR `data-export/me` konzument (profil → „Stáhnout moje data") = uzavře D-NEW-INV-ADMIN-UI.
- `docs/roadmap2.md`, `docs/funkce/*`, Nápověda.

**BE:**
- `backend/src/modules/world-export/` — nový modul: controller (`export` stream, `import` multipart), service (serializace s reuse filtrů, ID remap, média).
- `archiver` package (ZIP stream). Reuse `upload.service` pro média.
- Reuse viditelnostních filtrů z `pages`/`world-maps`/`game-events`/`bestiae`/`worlds`.

## Rizika

- ⚠️ **Referenční integrita importu** — string FK bez `ref:` (db-integrity audit) → 2-pass remap musí být úplný, jinak dangling odkazy. Round-trip test je brána.
- ⚠️ **Velikost balíku** — světy s mnoha médii = velký ZIP/dlouhý request → sledovat timeout; fallback async job.
- ⚠️ **Print rozbalení** — AKJ/collapsed sekce neotevřené → neúplný tisk.
- ⚠️ **`print-color-adjust`** — bez něj prohlížeč zahodí pozadí/barvy (memory `project_pdf_generation`).
- ⚠️ **BE restart** po novém modulu (`project_be_restart_required`).
- ⚠️ **Leak-safe** — `viewer-partial` balík nesmí obsahovat `accessRequirements`/`visibleToPlayerIds` jiných (export už filtruje, ale ověřit i odstranění metadat).

## Zodpovězené otevřené otázky

- **Formát PDF?** → FE `window.print()` (ne serverový puppeteer). Vratné.
- **Co do hromadné zálohy?** → vše viditelné lore; **chat volitelný, default OFF**; hromadné PDF NE (PDF jen per-entita přes pilíř A).
- **Kdo smí exportovat?** → každý člen svůj viditelný scope (PJ=full, hráč=partial); import jen z `pj-full`.
- **Import teď?** → **ANO, společně s exportem** (round-trip ověření integrity).

## Plán ověření (před push)

- FE: `npm run build` + `npm run test:run` zelené; print views ověřit `mobil-desktop` skillem (tlačítka mobil+desktop, tisk-náhled).
- BE: `npm run typecheck` + `npm run lint:check` + `npx jest --maxWorkers=2` zelené.
- **Round-trip:** export `pj-full` testovacího světa → import → diff počtů entit + namátkové reference = shoda.
- Viditelnost: hráčův export = `viewer-partial`, neobsahuje AKJ/skryté; import takového balíku odmítnut.
- Po BE změně **restart**.
