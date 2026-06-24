# Implementační plán 16.1e — Bestie / combat roster v konverzaci

**Spec:** [spec-16.1e-bestie-konverzace.md](spec-16.1e-bestie-konverzace.md) (schválena 2026-06-24, mockup odsouhlasen).
**Repo:** FE `Projekt-ikaros-FE` + BE `Projekt-ikaros`. Commit na `main` (git ruční — user).
**Vzor reuse:** mapa `useCombat` / `InitiativeBarItem` / `buildBestieToken` / `MatrixBestiePanel` autosave / `useChatDiaryRoll`.

---

## Sub-kroky (pořadí = závislosti)

### 16.1e-A — BE: model + operace (základ) ⏳
Soubory (`backend/src/modules/chat/`):
- `schemas/chat-channel.schema.ts` — `@Prop` `combatants` (`[Object]`, def `[]`), `combat` (`{ active, round, currentCombatantId }`, def `{active:false,round:0}`), `chatCombatConfig` (`{ showHpPc?, showHpNpc?, showHpBestie? }`).
- `interfaces/chat-channel.interface.ts` — tytéž typy + nový `ChatCombatant` discriminated union (character | bestie, viz spec 4.1).
- `repositories/chat-channel.repository.ts` `toEntity` — **whitelist + combatants/combat/chatCombatConfig** (jinak tichá ztráta — field-drift past).
- `dto/` — `combatant-ops.dto.ts` (add/update/remove) + `combat-op.dto.ts` (start/turn/end). Whitelist polí per kind.
- `chat.controller.ts` — routy:
  - `POST   /chat/channels/:id/combatants`        (add)
  - `PATCH  /chat/channels/:id/combatants/:cid`   (update HP/init/inCombat/name/notes)
  - `DELETE /chat/channels/:id/combatants/:cid`   (remove)
  - `PATCH  /chat/channels/:id/combat`            (start/turn/end)
  - `GET    /chat/channels/:id/combatants`        (server-filtrovaný dle role+R3)
- `chat.service.ts` — atomic `$push`/`$set arrayFilters`/`$pull`; `buildBestieInstance(bestie)` (snapshot z `bestiae.service.findById`, world+system scope, access check); combat start/turn/end logika (reuse pořadí z `useCombat` — round wrap); gating **PomocnyPJ+** (O2); `systemStats` soft validace (jen bestie).
- WS: `chat.service` emit `chat.combat.updated { channelId }` → `chat.gateway` `@OnEvent` → `server.to('chat:'+channelId).emit('chat:combat:updated', { channelId })` (leak-safe signál).
- **GET filtr (R3/O1):** hráč dostane combatanty, ale HP/staty jen u typů s `showHp{Pc|Npc|Bestie}` true (config konverzace ?? world default); jinak portrét+jméno bez HP. Armor/skryté staty hráči nikdy.

**Po A: BE restart** (feedback_be_restart_required) + `npx jest --maxWorkers=2` chat suite.

### 16.1e-B — FE: data vrstva ⏳
`src/features/world/chat/`:
- `lib/types.ts` — `ChatCombatant`, `ChatCombatState` (type-sync s BE).
- `api/useChannelCombatants.ts` — GET (server-filtrovaný), query key per channel.
- `api/useCombatantMutation.ts` — add/update/remove, **optimistic apply + rollback** (vzor `useTokenUpdate`).
- `api/useChatCombat.ts` — analog `useCombat`: derivuje `combatants`/`bench`/`isActive`/`round`/`currentId`, akce start/nextTurn(wrap)/jumpTo/end → `PATCH /combat`.
- WS listener `chat:combat:updated` → invalidate (s `useSocketReconnect` re-join `chat:{channelId}` — ws-security).

### 16.1e-C — FE: lišta `ChatInitiativeBar` ⏳
- `chat/components/combat/ChatInitiativeBar.tsx` + `.module.css` (port `InitiativeBar` + `InitiativeBarItem` vizuál; adapter `ChatCombatant`→item props). `roundBox` (jen `isActive`), `kindDot` (PC/NPC/bestie), ovládání boje (Začít / Další tah / Konec) vpravo, `+ přidat`.
- Napojení nad `ChannelView` message-stream (PJ vždy; hráč read-only, HP dle R3).

### 16.1e-D — FE: bok + spawn ⏳
- Klik `i` → otevře v railu: **bestie** → `BestieStatblock` `canEdit` (PJ) + autosave (vzor `MatrixBestiePanel`) → `useCombatantMutation`; **postava/NPC** → `DiaryRollPanel` (existuje, live HP z deníku).
- `ChatContextRail` rozšířit o combat-instance mód (vedle diary/bestie).
- `+ přidat` → `RailEntitySearch`: bestie → add instance; člen z Přítomní → add `character` ref.
- Hod schopnosti z boku → `useChatDiaryRoll` (atribuce jméno+obrázek combatanta).
- **HP visibility = per-typ přepínač** (showHpPc/Npc/Bestie) v ovládání boje/nastavení konverzace — **NE per-instance** (oprava mockupu).

### 16.1e-E — World default HP visibility (O3, samostatně pro chat) ⏳
- BE world settings + pole `chatCombatDefaults { showHpPc/Npc/Bestie }` (samostatné, nesdílet s map defaults).
- FE `WorldSettingsPage` — sekce v existujícím tabu (Chat / Hra).

### 16.1e-F — testy + integrace + docs ⏳
- FE vitest: `useCombatantMutation` optimistic+rollback · `useChatCombat` nextTurn wrap · gating (hráč read-only / filtr HP) · sort · adapter union.
- BE jest (`--maxWorkers=2`): ops atomic · gating Hrac→403 · GET filtr per role · field-drift toEntity.
- `mobil-desktop` (lišta scroll-x, bok overlay/scrim) · `funkce` (13-komunikace-sveta) + `napoveda` (změna funkčnosti chatu).
- `npm run build` (tsc -b) zelený před push.

---

## Pasti (z paměti)
- **field-drift:** začni od `toEntity` mapperu, jinak GET zahodí `combatants` (project_be_field_checklist).
- **BE restart** po každé BE změně; ValidationPipe whitelist tiše dropne neznámé fields.
- **WS reconnect:** ruční `room:join` nutně s `useSocketReconnect`.
- **HP single source:** bestie = `systemStats['health.current']`; PC/NPC = deník (nikdy neduplikovat).
- **mixed BE+FE:** nepouštět BE+FE operace v jedné paralelní dávce.
