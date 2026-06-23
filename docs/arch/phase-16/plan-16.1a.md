# Plán 16.1a — Rámec railu + deník v chatu + matrix (referenční systém)

**Status:** ✅ Implementováno 2026-06-23 (build zelený, 15 nových testů + 103 chat testů, eslint 0). Čeká živý smoke + funkce/napoveda.
**Spec:** [spec-16.1.md](spec-16.1.md) (schváleno 2026-06-23)
**Rozsah 16.1a:** kontextový rail (presence/diary) · most hodu z deníku do chatu · referenční systém matrix (hráč-self + PJ-load-člena) · readout fix overlaye. NPC (16.1b), bestie (16.1c), zbylé systémy (16.1d) **mimo tento plán**.
**Repo:** `Projekt-ikaros-FE`, commit na `main`.

---

## 1. O co se opřeme (reuse — bez kopií)

| Co | Kde | Jak použít |
|----|-----|-----------|
| `DiaryTab` (slug-driven, self-load, view/edit, save) | [DiaryTab.tsx:57](../../../src/features/world/pages/CharacterDetailPage/components/DiaryTab.tsx#L57) | embed v railu s `slug` + `onRoll`; už propouští `onRoll` do sheetu |
| `useCharacterDiary` / `useUpdateCharacterDiary` | [useCharacterSubdocs.ts:26](../../../src/features/world/pages/api/useCharacterSubdocs.ts#L26) · [useCharacterMutations.ts:177](../../../src/features/world/pages/api/useCharacterMutations.ts#L177) | DiaryTab si je volá sám; pro cizí postavu BE vrací 403 (PJ má přístup) — **žádná BE práce** |
| `useMyCharacterSlugs` | [useMyCharacterSlugs.ts:10](../../../src/features/world/tactical-map/hooks/useMyCharacterSlugs.ts#L10) | slug(y) postavy hráče; MVP 1:1 přes `membership.characterPath` |
| `useWorldMembers` | [useWorldMembers.ts:9](../../../src/features/world/api/useWorldMembers.ts#L9) | roster + member→characterPath pro PJ-load |
| Dice payload + roll engine + format | [chat/dice/lib/](../../../src/features/world/chat/dice/lib/) (`rollEngine`, `dicePayload`, `formatMessage`) | most hodu — chat-local, žádný import z tactical-map |
| 3D overlay | `useDiceRollOverlay` ([DiceRollOverlayProvider](../../../src/features/world/chat/dice/components/DiceRollOverlayProvider.tsx)) — **obaluje celou `WorldChatPage`** | rail uvnitř → `trigger()` funguje |
| Skin resolver | `useDiceSkinMapping(worldId).getSkin(type)` | skin hodu = membership volba (parita s mapou, R3) |
| Odeslání | `useSendMessage(worldId, channelId)` ([useWorldChat.ts](../../../src/features/world/chat/api/useWorldChat.ts)) | post hodu (content+dicePayload+diceSkin+override) |
| Matrix sheet `onRoll` | [MatrixSheet.tsx:44,67,183](../../../src/features/world/pages/CharacterDetailPage/diary-systems/sheets/matrix/MatrixSheet.tsx#L44) | ⚡Iniciativa + 🎲 per schopnost — referenční systém hotový |

💡 Most hodu schválně **chat-local** (ne import `performSheetRoll` z tactical-map) — chat nemá záviset na mapě; sdílíme až úroveň `chat/dice/lib`.

---

## 2. Nové soubory

### 2.1 `chat/dice/lib/rollFromDiary.ts`
Čistá funkce — zrcadlo `performSheetRoll`, ale chat-local + vrací i `content`.
```ts
rollDiaryRequest(req: { label; modifier?; kind? }): { dicePayload: DicePayload; content: string } | null
```
- `kind: 'fate'` → `rollFate()` + `buildFatePayload` + `formatFateMessage`.
- `kind: 'd4'..'d100'` → `rollGenericDice` + `buildGenericPayload` + `formatGenericDiceMessage`.
- jinak `null` (pool/mixed z deníku nepodporováno — parita s mapou).

### 2.2 `chat/components/rail/useChatDiaryRoll.ts`
Hook, který vrací `onRoll` továrnu pro deníkový sheet.
```ts
useChatDiaryRoll(worldId, channelId, { currentUser, members })
  → makeOnRoll(attribution: RollAttribution): SystemSheetProps['onRoll']
```
- uvnitř: `rollDiaryRequest(req)` → `getSkin(payload.type)` → `overlay.trigger(payload, skin, rollerName, doSend)` → `doSend = () => sendMessage.mutate({ content, dicePayload, diceSkin, ...override })`.
- `RollAttribution` (viz §4) určuje `override*` + `rollerName`.

### 2.3 `chat/components/rail/ChatContextRail.tsx`
Orchestrátor railu — nahradí dnešní přímý `ChannelMemberPanel` ve slotu.
- Props: `{ worldId, channel, activeChannelId, role, currentUser, presence, onClose }`.
- Stav: `mode: 'presence' | 'diary'`, `target: { slug, attribution } | null`.
- **Hráč** (`!isManager`): mode vždy `diary`, target = vlastní postava (`useMyCharacterSlugs`); bez presence, bez zpět. Když nemá postavu → empty stav „Nemáš přiřazenou postavu".
- **PJ**: start `presence` → `ChannelMemberPanel` (s novým `onSelectMember`) → klik člena přepne na `diary` (target = member slug, attribution `pj`), tlačítko ⟵ zpět. (NPC/bestie search = stub místo pro 16.1b/c.)

### 2.4 `chat/components/rail/DiaryRollPanel.tsx`
Tenký wrapper kolem `DiaryTab`.
- Props: `{ slug, attribution, channelId, currentUser, members, canEdit }`.
- Lokální `mode: 'view'|'edit'` toggle (tlačítko „Upravit" jen když `canEdit`), `onDirtyChange` → varování při zavření s neuloženými změnami.
- `onRoll = makeOnRoll(attribution)` z `useChatDiaryRoll`.
- Render: `<DiaryTab slug mode onExitEdit onDirtyChange onRoll />`.

### 2.5 CSS moduly k novým komponentám (`*.module.css`).

---

## 3. Změněné soubory

### 3.1 [WorldChatRoom.tsx](../../../src/features/world/chat/components/WorldChatRoom.tsx)
- `membersOpen` → zobecnit na `railOpen` (default closed, localStorage per svět, **pro obě role** — dnes jen PJ ř.83-93).
- Slot `membersSlot` (ř.315-324): vždy (i hráč) renderovat `<ChatContextRail>` místo přímého `ChannelMemberPanel`.
- `presence` hook je dnes PJ-only (`isManager`) — pro hráče presence nepotřeba (jeho rail = deník), necháme PJ-only.
- Layout třídy `withMembers/membersOpen` (ř.252-257) navázat na `railOpen` bez `isManager` gate.
- `ChannelView` prop `onToggleMembers` → `onToggleRail` pro obě role; předat `railOpen`.

### 3.2 [ChannelView.tsx](../../../src/features/world/chat/components/ChannelView.tsx)
- Hlavičkové tlačítko railu (ř.475-501) zpřístupnit **i hráči**: PJ ikona `Users` (+ presence badge), hráč ikona `BookOpen` / popisek „Můj deník".
- Prop rename `onToggleMembers→onToggleRail`, `membersOpen→railOpen`.

### 3.3 [ChannelMemberPanel.tsx](../../../src/features/world/chat/components/ChannelMemberPanel.tsx)
- Nový prop `onSelectMember?(entry: RosterEntry)`. Member řádek (ř.134-157) → `<button>` když `onSelectMember`; klik → rail přepne na diář dané postavy.
- Member bez `characterPath` → řádek bez akce (disabled / bez kurzoru) + tooltip „Bez přiřazené postavy".
- ⚠️ slug = `member.characterPath` (resp. `.split('/').pop()`); doplnit do `RosterEntry`.

### 3.4 [DiceRollOverlay.tsx](../../../src/features/world/chat/dice/components/DiceRollOverlay.tsx) — readout fix (spec 4.6)
Rovnice (ř.194-211): mezi `skillMod` a `eqSign` vložit operand součtu kostek, **jen když `modifier !== 0`**:
```
Ledový dotek  (+4)  −1  =  +3
              mod   sum      total
```
- nový `<span className={styles.diceSum}>` se znaménkem `payload.sum`.
- `DiceRollOverlay.module.css`: styl `.diceSum` (decentní, odlišný od `.skillMod`).
- ⚠️ konzistence: jen overlay; `DiceMessage` „součet hodu" už má (necháme).

---

## 4. Atribuce hodu (spec R1)

`RollAttribution` → mapování na send payload:

| Kontext | override | rollerName (overlay/readout) | render v chatu |
|---------|----------|------------------------------|----------------|
| hráč na své postavě (`self`) | žádný | jeho postava/username | jeho persona |
| PJ na cizí postavě (`pj`) | žádný | PJ jméno | render-time „PJ" (`makePjDisplayResolver`) |
| PJ za NPC (`npc`) — 16.1b | `overrideName/Avatar/Slug = NPC` | jméno NPC | NPC |
| PJ za bestii (`bestie`) — 16.1c | `overrideName/Avatar = bestie` | jméno bestie | bestie |

V 16.1a implementuju `self` + `pj`. `npc`/`bestie` typy zavedu do `RollAttribution` (rozšiřitelnost), ale větve plním v 16.1b/c.

---

## 5. Pořadí implementace (uvnitř 16.1a)

1. `rollFromDiary.ts` + unit testy (čistá funkce, nejlevnější jistota).
2. `DiceRollOverlay` readout fix + test (izolované, zlepší i mapu hned).
3. `useChatDiaryRoll` hook + test atribuce.
4. `DiaryRollPanel` (wrapper DiaryTab + view/edit).
5. `ChatContextRail` + úpravy `WorldChatRoom` / `ChannelView` / `ChannelMemberPanel`.
6. Smoke v reálném chatu (matrix svět): hráč hod schopnosti, PJ klik člen → hod; mobil overlay/scrim.
7. `mobil-desktop` skill (rail je nový layout prvek).

---

## 6. Testy (vitest, bez globals, explicit importy — viz [[project_fe_test_precommit]])

- `rollFromDiary.spec.ts` — fate i generic: `dicePayload` tvar, `content` formát, modifier promítnut do `total`, nepodporovaný kind → null.
- `useChatDiaryRoll.spec.tsx` — atribuce `self` (bez override) vs `pj` (bez override, jiný rollerName); volá overlay.trigger a po něm send s `dicePayload`.
- `DiceRollOverlay.spec.tsx` — readout ukazuje `sum` když `modifier!==0`, skrývá když `0`.
- `ChatContextRail.spec.tsx` — hráč → rovnou diář vlastní postavy; PJ → presence, po `onSelectMember` přepne na diář + ⟵ zpět; hráč nevidí cizí.
- `ChannelMemberPanel` — člen s `characterPath` klikací, bez něj disabled.

---

## 7. Acceptance (podmnožina spec §6 pro 16.1a)

1. ✅ Hráč otevře rail „Můj deník" (matrix svět), klikne schopnost → hod do aktivní konverzace (overlay + zpráva), atribuce jeho postava.
2. ✅ Hráč edituje deník v railu → uloží se do Character subdoku (vidět na listu).
3. ✅ PJ: Přítomní → klik člen → jeho deník v railu (⟵ zpět); hod atribuovaný PJ.
4. ✅ Readout overlaye ukazuje součet kostek i velikost schopnosti (modifier≠0) — mapa i chat.
5. ✅ Rail funguje mobil i desktop (overlay/scrim jako stávající slot).
6. ✅ `npm run build` (tsc -b) prochází; testy zelené.

---

## 8. Rizika

| Riziko | Mitigace |
|--------|----------|
| `DiaryTab` edit mód je široký na úzký rail | 16.1a funkčně OK; grafika rail-fit → `mobil-desktop` + případně 16.1d polish |
| Dva odběry `useCharacterDiary` (list + rail) | TanStack dedup dle queryKey; žádný extra fetch |
| `railOpen` pro hráče mění layout třídy (dnes PJ-only) | důsledně odpojit od `isManager`; pokrýt testem |
| Slug z `characterPath` s lomítkem | `.split('/').pop()` jako `useMyCharacterSlugs` |
| Composer dice vs rail dice — dvě cesty odeslání | OK pro 16.1a; sjednocení composeru na `rollFromDiary` = volitelný cleanup později (hot path nechávám) |

**Rollback:** rail aditivní; návrat = slot zpět na `ChannelMemberPanel` + tlačítko PJ-only. Readout fix samostatně revertovatelný.

---

## 9. Mimo 16.1a (další pluginy do railu)
- **16.1b** — NPC search v presence hlavičce (`usePersonaDirectory`+`PersonaAutocomplete`) → `DiaryRollPanel` s attribution `npc`.
- **16.1c** — bestie search → `BestieRollPanel` (statblok z katalogu, roll-only).
- **16.1d** — zbylých 12 systémů: ověřit/doplnit `onRoll` klikatelnost + grafika v railu.

---

**Po potvrzení plánu začnu kódovat — pořadím §5 (rollFromDiary → readout fix → hook → panel → rail/wiring).**
