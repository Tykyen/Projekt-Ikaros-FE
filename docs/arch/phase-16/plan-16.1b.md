# Plán 16.1b — Hledání NPC v railu → deník NPC v chatu

**Status:** ✅ Implementováno 2026-06-23 (build zelený, +3 testy, eslint 0). Čeká živý smoke + funkce/napoveda.
**Spec:** [spec-16.1.md](spec-16.1.md) §4.1, R1, R2 (schváleno)
**Rozsah:** malý — PJ search NPC v presence railu → načte deník NPC; hod atribuovaný NPC. Staví na 16.1a (rail + most hodu + atribuce `npc` už hotová).
**Repo:** `Projekt-ikaros-FE`, commit na `main`.

---

## 1. O co se opřeme (reuse)

| Co | Kde | Jak |
|----|-----|-----|
| Persona adresář (postavy + NPC) | [usePersonaDirectory.ts](../../../src/features/world/pages/api/usePersonaDirectory.ts) — `GET .../pages/directory?type=Postava hráče,NPC` | filtr na `type === 'NPC'` |
| Našeptávač | [PersonaAutocomplete.tsx](../../../src/features/world/chat/components/PersonaAutocomplete.tsx) — `{query, entries, onSelect, onClose}` | reuse 1:1 (↑↓/Enter/Esc, diakritika-insensitive) |
| Deník NPC v railu | `DiaryRollPanel` (16.1a) | `slug = entry.slug`, `attribution = npc` |
| Atribuce NPC | `useChatDiaryRoll` (16.1a) — větev `npc` (override jméno+avatar+slug) | **už hotová**, jen ji dodá rail |

💡 NPC = Character `isNpc` **s deníkem** (project_npc_vs_bestie) → `useCharacterDiary(worldId, npcSlug)` funguje stejně jako u PC. Bestie (statblok) = až 16.1c.

---

## 2. Nové soubory

### 2.1 `rail/NpcDiarySearch.tsx` (+ `.module.css`)
PJ-only vyhledávací pole v presence railu.
- `usePersonaDirectory(worldId)` → filtr `type === 'NPC'`.
- Vstup (text) + `PersonaAutocomplete` (NPC entries, otevřený při fokusu/psaní).
- `onSelect(entry)` → callback nahoru (rail). Po výběru pole vyčistit.
- Props: `{ worldId; onSelect: (entry: PageDirectoryEntry) => void }`.

---

## 3. Změněné soubory

### 3.1 [ChatContextRail.tsx](../../../src/features/world/chat/components/rail/ChatContextRail.tsx)
- `selected` stav zobecnit: `{ slug; title } → { slug; title; attribution: RollAttribution }` (drží i `npc` override data).
- PJ member klik (dnes) → `attribution: { kind:'pj', rollerName:'PJ' }`.
- **PJ presence větev:** nad `ChannelMemberPanel` vykreslit `<NpcDiarySearch onSelect={…} />`. Výběr NPC → `setSelected({ slug: entry.slug, title: entry.title, attribution: { kind:'npc', rollerName: entry.title, avatarUrl: entry.imageUrl, slug: entry.slug } })`.
- `DiaryRollPanel` dostane `attribution={selected.attribution}` (místo hardcoded `pj`).

Hráč ani DiaryRollPanel/useChatDiaryRoll se nemění (atribuce `npc` už existuje).

---

## 4. Chování / atribuce

| Akce | slug deníku | atribuce | hod v chatu |
|------|-------------|----------|-------------|
| PJ klik na člena | `member.characterPath` | `pj` | jako „PJ" |
| **PJ vybere NPC** | `entry.slug` | `npc` (jméno+avatar+slug) | **jako to NPC** (override) |

PJ na NPC smí editovat (canEdit = isManager). ⟵ zpět vrací na presence (+ search).

---

## 5. Testy (vitest)

- `NpcDiarySearch.spec.tsx` — adresář se zafiltruje na NPC (PC se nenabízí); výběr volá `onSelect` s entry.
- `ChatContextRail.spec.tsx` (rozšíření) — PJ: po výběru NPC → `DiaryRollPanel` se `slug` NPC + `attribution.kind === 'npc'` + override (rollerName/avatar/slug).

---

## 6. Acceptance (spec §6 bod 7)

1. ✅ PJ v presence railu má pole „Hledat NPC"; našeptává NPC světa (ne PC).
2. ✅ Výběr NPC → jeho deník v railu (⟵ zpět na Přítomní).
3. ✅ Hod schopnosti NPC → zpráva atribuovaná NPC (jméno + avatar + klikací slug).
4. ✅ `npm run build` ✓, testy zelené, eslint 0.

---

## 7. Mimo 16.1b
- **16.1c** — bestie search → `BestieRollPanel` (statblok z katalogu, roll-only).
- **16.1d** — `onRoll` + grafika zbylých systémů.

---

**Po potvrzení kóduju: NpcDiarySearch → zobecnění selected v ChatContextRail → testy → build.**
