# Spec 20.6 — Přehled využití motivů a skinů (admin statistika)

**Fáze:** 20 (Governance, právo & moderace — Platforma + Provoz)
**Stav:** 📝 návrh (spec ke schválení) — 2026-07-15
**Typ:** nová feature (BE agregační endpoint + FE sekce v admin Přehledu)
**Souvisí:** admin dashboard (`features/admin`), motivy (`src/themes`), skiny deníku (16.2c), skin chatu (16.1d)
**Zadání:** přání testerů — vědět, kolik lidí/světů používá který motiv/skin, aby se dalo rozhodnout, které málo využívané osekat.

---

## 1. Cíl

Read-only **přehled využití** všech vizuálních voleb platformy pro tým správy: kolik uživatelů / světů / členství používá který **motiv** a **skin**. Slouží jako podklad pro **osekání** málo využívaných motivů/skinů (samotné osekání = samostatný krok 2, viz §9).

Nová **sekce „Motivy a skiny"** v admin Přehledu (`OverviewTab`), stejný vzor jako existující sekce Analytics / Růst / Náklady.

---

## 2. Kontext / motivace

Platforma nabízí velké množství vizuálních voleb:
- **33 motivů** ([registry.ts](../../../src/themes/registry.ts#L43)) — 21 platformových + 12 světových
- **8 skinů deníku** ([diary skins](../../../src/features/world/pages/CharacterDetailPage/diary-systems/skins/registry.ts#L34))
- **12 skinů chatu** (= světové ThemeId, [chat skins](../../../src/features/world/chat/skins/registry.ts#L14))

Udržovat každý motiv/skin na profesionální úrovni stojí čas (viz `base.md` — na grafice se nešetří). Bez čísel nevíme, které nikdo nepoužívá a dají se vyřadit. Tento přehled ta čísla dodá.

---

## 3. Audit současného stavu

### Datové zdroje — 5 dimenzí (vše v Mongo, agregovatelné `$group`)

| # | Dimenze | Pole v DB | Škála | Jednotka | Default při `null` |
|---|---------|-----------|-------|----------|--------------------|
| 1 | **Platformový motiv** | `User.themeId` | 33 (platform+world) | uživatel | `modre-nebe` ([DEFAULT_THEME](../../../src/themes/registry.ts#L38)) |
| 2 | **Motiv světa** | `World.themeId` | 12 světových | svět | `ikaros` ([DEFAULT_WORLD_THEME](../../../src/themes/registry.ts#L40)) |
| 3 | **Per-člen motiv světa** (5.9b) | `WorldMembership.themeId` | 12 | členství | dědí motiv PJ / světa |
| 4 | **Skin deníku** (16.2c) | `WorldMembership.diarySkin` | 8 | členství | dle `world.system` ([resolveDefaultSkin](../../../src/features/world/pages/CharacterDetailPage/diary-systems/skins/registry.ts#L83)) |
| 5 | **Skin chatu** (16.1d) | `WorldMembership.chatSkin` | 12 | členství | auto dle světa |

> Pole potvrzena v kódu: [User.themeId](../../../src/shared/types/index.ts#L69), [Membership.themeId/diarySkin](../../../src/shared/types/index.ts#L562), [chatSkin](../../../src/features/world/chat/api/useMembershipAppearance.ts#L16).

### Vzor, který kopírujeme 1:1 (admin stat sekce)

BE `GET /admin/stats/growth` → FE `growth.types.ts` (zrcadlo DTO) + `useGrowthStats.ts` (query hook, `staleTime` 60 s, BE cache 15 min) + `GrowthSection.tsx` (MiniBarChart / tabulka) → zařazeno v [OverviewTab.tsx](../../../src/features/admin/components/OverviewTab/OverviewTab.tsx#L119). Stejný řetězec postavíme pro motivy.

### Role / přístup
Route `/admin` má `RoleGuard [Superadmin, Admin]` (spec 20.5 §3). Přehled je platformový obsah → **jen globální role**, dědí guard route, žádná nová kontrola.

---

## ⚠️ 4. Klíčová past — `null` ≠ „nevyužité"

Všechny volby jsou nullable a `null` = **dědí default** (viz tabulka §3). Naivní `count(themeId)` by u default motivů vrátil ~0, i když je fakticky „používá" většina lidí, co nikdy nesáhli na přepínač. **Osekání podle takového čísla smaže nejpoužívanější motiv.**

**Řešení — BE rozliší „explicitně vybráno" od „děděno":**
- `counts[id]` = počet entit s `field === id` (**raw, explicitní volba**)
- `noChoice` = počet entit s `field == null` (dědí default)

FE dopočítá:
- **Efektivní využití** default motivu = `counts[default] + noChoice`; ostatní = `counts[id]`.
- **Kandidát na osekání** = motiv/skin s `counts[id] === 0` **a zároveň není default dimenze** → nikdo si ho vědomě nevybral.

💡 U dimenzí 4/5 (diarySkin/chatSkin) je default **závislý na světě** (`world.system` / motiv světa), takže `noChoice` **nerozpouštíme** na konkrétní skin (vyžadovalo by drahý `$lookup` a stejně to nejsou vědomé volby). Zobrazíme `noChoice` jako jeden agregát „bez volby (dědí podle světa)". Kandidát na osekání = `counts[id] === 0` (nikdo vědomě).

---

## 5. Datový kontrakt (BE → FE)

```ts
// FE: src/features/admin/api/themeUsage.types.ts (zrcadlo BE DTO)
export interface DimensionUsage {
  /** Celkem entit v dimenzi (users / worlds / memberships). */
  total: number;
  /** Z toho bez explicitní volby (field == null → dědí default). */
  noChoice: number;
  /** themeId/skinId → počet ENTIT s explicitní volbou. Klíče jen skutečně
   *  vyskytnuté v DB (i legacy/neznámé ID — FE je označí). */
  counts: Record<string, number>;
}

export interface ThemeUsageStats {
  generatedAt: string;          // ISO
  platformTheme: DimensionUsage; // User.themeId
  worldTheme: DimensionUsage;    // World.themeId
  memberTheme: DimensionUsage;   // WorldMembership.themeId
  diarySkin: DimensionUsage;     // WorldMembership.diarySkin
  chatSkin: DimensionUsage;      // WorldMembership.chatSkin
}
```

**BE:** `GET /admin/stats/theme-usage` (guard Superadmin/Admin), 5× `$group` (nebo `$facet` v jednom průchodu per kolekce: users 1×, worlds 1×, worldMemberships 3×). Cache 15 min (vzor growth). Žádný nový tracking — čistá agregace stavu.

**BE je hloupé, FE chytré:** BE vrací jen syrové počty. FE přes [registry](../../../src/themes/registry.ts) doplní lidské názvy, scope (platform/world), pořadí, a označí ID, která v registru nejsou → **legacy/smazaný motiv** (taky užitečný signál).

---

## 6. FE návrh — `ThemeUsageSection`

Nové soubory (vzor Growth):
- `src/features/admin/api/themeUsage.types.ts` — typy výše
- `src/features/admin/api/useThemeUsageStats.ts` — query hook (`adminKeys.themeUsage`, `staleTime` 60 s)
- `src/features/admin/components/ThemeUsageSection/ThemeUsageSection.tsx` + `.module.css`
- zařadit `<ThemeUsageSection />` do [OverviewTab](../../../src/features/admin/components/OverviewTab/OverviewTab.tsx) (za `CostsSection`)

**Layout sekce** (`<section>` s `sectionTitle` „Motivy a skiny"):
5 podbloků (jeden per dimenze), každý = nadpis + horizontální bar list seřazený sestupně dle efektivního využití. Řádek = název motivu · bar · číslo (`counts`) · u default badge „+ N děděno" · u nuly badge „nevyužité" (`tone accent`). Bar reuse vzoru z GrowthSection cohort tabulky (CSS `width %`), případně `MiniBarChart`.

- Nahoře souhrn: „Kandidáti na osekání: **N** motivů / **M** skinů s 0 vědomými volbami."
- `total` a `noChoice` čestně popsané v hlavičce každého bloku (např. „ze 128 členství si 90 nechalo default").
- Loading / error stav dle vzoru (`isLoading` skeleton, `role="alert"` chyba).

**Responsivita** (base.md): bar list je jednosloupcový flow → mobil OK; dlouhé názvy `text-overflow`, `overflow-x` na tabulkových blocích. Po impl. → skill `mobil-desktop`.

---

## 7. Co feature NEdělá (hranice V1)

- **Neoseká** motivy/skiny — jen měří. Osekání (skrýt z nabídky / deprecovat) = **krok 2**, dotýká se registru (FE) i `THEME_IDS`/whitelistů (BE) na více místech ([theme_ids_dual](../../../../memory/project_theme_ids_dual_source.md)). Rozhodne se podle čísel z tohoto přehledu.
- **Nemapuje** `noChoice` u diary/chat skinů na konkrétní systémový default (§4).
- **Neřeší** skiny kostek (`diceSkinMapping`) — jiná struktura (`Record` per typ); případné rozšíření později.
- Žádné časové řady — snapshot stavu k `generatedAt`.

---

## 8. Testy

- FE: `ThemeUsageSection.test.tsx` — render s mock daty (default badge, „nevyužité" badge, kandidáti souhrn, legacy ID mimo registr), loading/error stav. Vzor [GrowthSection.test.tsx](../../../src/features/admin/components/GrowthSection/__tests__/GrowthSection.test.tsx).
- BE: e2e agregace — seed users/worlds/memberships s mixem null/hodnot → ověřit `counts` vs `noChoice`.

---

## 9. Otevřené otázky

1. **Umístění** — sekce v Přehledu (návrh), nebo samostatný tab „Motivy"? Sekce = konzistence s Growth/Costs; tab = víc místa, když bude bloků hodně. → **návrh: sekce**, přesun na tab triviální později.
2. **Řazení podbloků** — dle jednotky (uživatelé → světy → členství), nebo dle „důležitosti" (nejdřív hlavní platformový motiv)? → **návrh: pořadí dimenzí z tabulky §3**.
3. Zahrnout do každého řádku i **% z total**, nebo stačí absolutní číslo + bar? → **návrh: absolutní + bar; % jen v tooltipu/aria**.

---

## 10. Workflow

`base.md`: Brainstorming ✅ → **tento spec (schválení ⏳)** → implementační plán → potvrzení → kód → `funkce` + `napoveda` + `mobil-desktop`.
Po impl.: zaškrtnout v roadmap2 (nová karta 20.6), aktualizovat `docs/funkce/` (admin schopnost) a `/ikaros/napoveda` (pokud se týká hráče — zde spíš ne, admin nástroj).
