# Plán 16.1c — Hledání bestie v railu → statblok bestie (hod za bestii)

**Status:** ✅ Implementováno 2026-06-23 (build zelený, chat 109 testů, eslint 0; WorldChatPage 105 kB bez PIXI). Čeká živý smoke + funkce/napoveda.
**Spec:** [spec-16.1.md](spec-16.1.md) §4.3, R2, R3 (schváleno)
**Rozsah:** malý–střední — sjednotit hledání (NPC + bestie do **jednoho pole** dle tvého záměru), bestie z **katalogu** (read-only staty, klikací schopnosti → chat). Staví na 16.1a/b.
**Repo:** `Projekt-ikaros-FE`, commit na `main`.

---

## 1. O co se opřeme (reuse)

| Co | Kde | Jak |
|----|-----|-----|
| Katalog bestií | [useBestiar.ts](../../../src/features/world/bestiar/hooks/useBestiar.ts) — `useBestiar(worldId, systemId)` → `{system,world,user}` | zdroj bestií pro search + panel |
| Schopnosti bestie | [bestieAbilities.ts](../../../src/features/world/bestiar/lib/bestieAbilities.ts) — `getBestieAbilities(bestie)` → `[{label,value}]` (z `systemStats.abilities`) | klikací hody |
| Statblok render | [BestieStatblock.tsx](../../../src/features/world/tactical-map/components/tokens/BestieStatblock.tsx) — `canEdit=false` → `EntityStatbar` (staty read-only) + ability roll chipy | jádro panelu |
| Token z katalogu | [buildSpawnToken.ts](../../../src/features/world/tactical-map/utils/buildSpawnToken.ts) — `buildBestieToken(bestie,0,0)` → validní `MapToken` | BestieStatblock chce `token`; vyrobím reálný (žádný type-lie) |
| Most hodu + atribuce `bestie` | `useChatDiaryRoll` (16.1a) — větev `bestie` (override jméno+avatar, bez slug) | **už hotová** |
| Systém světa | `useWorldContext().world.system` | `systemId` pro `useBestiar` + schema statbloku |

⚠️ **Coupling chat → tactical-map:** `BestieStatblock` + `buildBestieToken` (a tranzitivně `EntityStatbar`/`systemEntitySchemaRegistry`) žijí v `tactical-map`. Statblok bestie tam ale fakticky bydlí — importnu je **přímo** (ne přes barrel), žádný PIXI se netáhne (jsou to DOM/schema komponenty). Přesun do `shared/` = případný dluh, ne teď.

---

## 2. Sjednocené hledání (jedno pole NPC + bestie)

Tvůj původní záměr = **jedno okno hledání** pod Přítomními (NPC i bestie). 16.1b zavedlo `NpcDiarySearch` (jen NPC). 16.1c ho **nahradí** `RailEntitySearch` — jedno pole, sloučené výsledky:

- NPC: `usePersonaDirectory` (filtr `type==='NPC'`) → `{kind:'npc', slug, title, imageUrl}`.
- Bestie: `useBestiar(worldId, systemId)` (`[...system,...world,...user]`) → `{kind:'bestie', bestie}`.
- Sloučit, filtrovat dle jména (diakritika-insensitive), cap ~8; každý řádek s **chipem typu** (NPC / bestie).
- Vlastní lehký dropdown (PersonaAutocomplete je typovaný na `PageDirectoryEntry`, nezvládne union + „bestie" chip) — vizuál dle vzoru PersonaAutocomplete.
- `NpcDiarySearch.*` (16.1b) smazat (nahrazeno). `PersonaAutocomplete.placement` zůstává (maska ho dál používá `up`; `down` se v railu přestane volat — neškodí, obecné API).

🔀 *Alternativa:* nechat NPC pole z 16.1b a přidat druhé „Hledat bestii" → 2 pole, menší diff, horší UX. **Nevolím** — tvůj záměr je jedno pole.

---

## 3. Nové soubory

### 3.1 `rail/RailEntitySearch.tsx` (+ `.module.css`)
Sjednocené hledání (viz §2). Props `{ worldId; systemId; onSelect: (r: RailSearchResult) => void }`.
```ts
type RailSearchResult =
  | { kind: 'npc'; slug: string; title: string; imageUrl?: string }
  | { kind: 'bestie'; bestie: Bestie };
```

### 3.2 `rail/BestieRollPanel.tsx` (+ `.module.css`)
- `token = buildBestieToken(bestie, 0, 0)` (useMemo).
- `<BestieStatblock token systemId worldId canEdit={false} stats={bestie.systemStats} abilities={getBestieAbilities(bestie)} notes="" disabled={false} onStatsChange/onAbilitiesChange/onNotesChange={noop} onRollAbility={roll} />`.
- `roll = makeOnRoll({ kind:'bestie', rollerName: bestie.name, avatarUrl: bestie.imageUrl })` z `useChatDiaryRoll(worldId, channelId)`; ability klik → `onRoll({ label: a.label, modifier: parseInt(a.value)||0, kind:'fate' })`.
- Hlavička: ⟵ zpět · jméno bestie · zavřít. Pod statblokem volitelně `bestie.notes` (lore, read-only).
- Bez save (katalog, žádný token na mapě).

---

## 4. Změněné soubory

### 4.1 [ChatContextRail.tsx](../../../src/features/world/chat/components/rail/ChatContextRail.tsx)
- `useWorldContext()` → `systemId = world?.system`.
- `selected` → union: `{kind:'diary', slug, title, attribution} | {kind:'bestie', bestie}`.
- presence topSlot: `RailEntitySearch` místo `NpcDiarySearch`; `onSelect`:
  - `npc` → `{kind:'diary', slug, title, attribution:{kind:'npc',…}}` (jako 16.1b),
  - `bestie` → `{kind:'bestie', bestie}`.
- render: `selected.kind==='bestie'` → `BestieRollPanel`, jinak `DiaryRollPanel`.

### 4.2 Smazat `rail/NpcDiarySearch.tsx` + `.module.css` + `.spec.tsx` (nahrazeno RailEntitySearch).

---

## 5. Chování / atribuce

| Akce | panel | atribuce | hod |
|------|-------|----------|-----|
| PJ klik člen | DiaryRollPanel | `pj` | jako „PJ" |
| PJ vybere NPC | DiaryRollPanel | `npc` | jako NPC |
| **PJ vybere bestii** | **BestieRollPanel** (statblok read-only) | **`bestie`** | **jako bestie** (jméno+avatar) |

---

## 6. Testy (vitest)

- `RailEntitySearch.spec.tsx` — sloučí NPC (persona dir) + bestie (bestiar); filtr dle jména; chip typu; `onSelect` vrátí správný `kind`.
- `BestieRollPanel.spec.tsx` — mock `useChatDiaryRoll` + `BestieStatblock` (stub vystaví ability klik) → klik schopnosti zavolá `onRoll` s `label/modifier/fate`; ověř atribuci `bestie` předanou do `makeOnRoll`.
- `ChatContextRail.spec.tsx` (rozšíření) — výběr bestie → `BestieRollPanel` se správnou bestií; NPC/PC větve beze změny.

---

## 7. Acceptance (spec §6 bod 8)

1. ✅ PJ má v railu jedno pole hledání → najde NPC i bestie (chip typu).
2. ✅ Výběr bestie → její statblok v railu (staty read-only, ⟵ zpět).
3. ✅ Klik na schopnost bestie → zpráva atribuovaná bestii (jméno + avatar).
4. ✅ `npm run build` ✓, testy zelené, eslint 0; chat bundle bez PIXI navíc.

---

## 8. Mimo 16.1c
- **16.1d** — `onRoll` + grafika zbylých systémů; případně přesun schema-form do `shared/` (coupling).

---

**Po potvrzení kóduju: RailEntitySearch → BestieRollPanel → ChatContextRail union → smazat NpcDiarySearch → testy → build.**
