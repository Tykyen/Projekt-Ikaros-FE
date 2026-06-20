# ws / 02-world-chat-gateway — checkpoint RUN-2026-06-20-1621

> Auditor: plný-audit agent, 2026-06-20. READ-ONLY.

## Pokrytí

Projito:
- `backend/src/modules/chat/chat.gateway.ts` (384 řádků, celý)
- `backend/src/modules/chat/chat.gateway.spec.ts` (191 řádků, celý)
- `backend/src/modules/chat/chat.service.ts` — relevantní části (`chat.unread.updated` emit, presence role, reorder)
- `src/features/world/chat/components/WorldChatRoom.tsx` (369 řádků, celý)
- `src/features/world/chat/components/ChannelView.tsx` (582 řádků, celý)
- `src/features/world/chat/components/SoundNowPlayingBanner.tsx` (122 řádků, celý)
- `src/features/world/chat/components/SoundBroadcastButton.tsx` (119 řádků, celý)
- `src/features/world/chat/api/useWorldChat.ts` (220 řádků, celý)
- `src/features/world/chat/api/useChannelPresence.ts` (50 řádků, celý)
- `src/features/world/chat/lib/types.ts` (99 řádků, celý)
- `src/features/notifications/api/useChatFeed.ts` (relevantní části)

Prošlo ověřením všech 25 bodů (WCH-01..25) z plánu oblasti.

## Dosažená L vs cílová L

| Sekce | Cílová L | Dosažená L | Pozn. |
|-------|----------|------------|-------|
| A — Messages | L2–L3 | **L3** | testy v gateway.spec pokrývají klíčové cesty |
| B — Unread | L3 | **L3** | applyUnreadEvent otestováno v useWorldChat.spec.ts (dle plánového komentáře); K-3 by-design zdokumentováno |
| C — Channels/Groups | L2 | **L2** | W-4 ✅ opraveno a ověřeno v kódu; viz 1 nový nález níže |
| D — Presence/Typing | L2–L3 | **L3** | W-3 ✅ opraveno + 3 nové spec testy ověřeny v gateway.spec |
| E — Sounds | L2 | **L2** | N-9 anti-spoofing ověřen; test gap WCH-23 trvá |
| F — Feed bump | L2 | **L2** | leak-safe signál ověřen čtením obou stran |
| W-7 lifecycle | L3 | **L3** | useSocketReconnect v ChannelView:258 + useUnreadSync:217 ověřeno |

**Celkové L:** L2–L3 napříč oblastí. Jediné L1 cesty jsou test gapy (WCH-23, viz níže).

## Nálezy

### W-RUN-01 — `chat:group:deleted` emituje holý string místo objektu · osa `PL` · ⚠️ nízká · 🆕

**Kde:** `chat.gateway.ts:345` — `emit('chat:group:deleted', payload.groupId)` posílá **raw string** (groupId), nikoliv objekt.  
Ostatní deleted eventy posílají objekt: `chat:channel:deleted` → `{ channelId, groupId }` (řádek 318–321), `chat:group:updated` → `{ worldId }` (řádek 337–338).

**FE dopad:** `WorldChatRoom.tsx:189` — `useSocketEvent('chat:group:deleted', invalidateGroups)` — callback ignoruje payload (jen invaliduje cache). Funkčně bezproblémové, ale:
1. **Typová nekonzistence**: FE handler `invalidateGroups` je `() => void`, takže raw string jako argument projde tiše. Kdyby někdo v budoucnu chtěl payload číst, narazí na neočekávaný typ.
2. **Nesoulad s dokumentací**: Plán oblasti (WCH-11) uvádí `deleted` nese `{ channelId, groupId }` resp. `groupId` — reálně je to jen `groupId` (string), ne object wrapper. Dokumentace je matoucí.

**Návrh:** Zabalit do objektu: `emit('chat:group:deleted', { worldId: payload.worldId, groupId: payload.groupId })` pro konzistenci s ostatními eventy. FE invalidateGroups zůstane funkční.  
**L1** (statické čtení). Bez testu pokrývajícího tento payload.

---

### Potvrzení opravených nálezů (dle ws-audit.md)

| ID | Status v kódu HEAD | Ověření |
|----|-------------------|---------|
| **W-3** (presence spoofing) | ✅ OPRAVENO | `chat.gateway.ts:93` — `userId = client.data.userId` z JWT; spec test na řádku 109-126 |
| **W-4** (channel:created metadata leak) | ✅ OPRAVENO | `chat.gateway.ts:299,309` — emituje `{ worldId }` bez objektu kanálu |
| **W-7** (reconnect re-join) | ✅ OPRAVENO | `ChannelView.tsx:258` — `useSocketReconnect` re-joinne `chat:{channelId}` + presence |

### Test gapy (beze změny oproti plánu)

- **WCH-23** (sound role gate test): `chat.gateway.spec.ts` testuje `handleSoundPlay` pro autentizaci (řádky 65–93), ale chybí explicitní test pro hráče s rolí < PomocnyPJ → tiché ignorování (role gate). Stav: gap-fill M7 nezahájen. **⚠️ nízká priorita**.

### Typový dluh (přetrvává, neblokuje)

`ChannelUnread` typ (types.ts:75) deklaruje `mentionCount: number` jako povinné pole. `chat:unread` WS event toto pole **nikdy neposílá** (BE emit: jen `{ channelId, count }`). FE `applyUnreadEvent` to ošetřuje `?? 0`. `useSocketEvent<ChannelUnread>('chat:unread', ...)` v useWorldChat.ts:210 typuje event jako plný `ChannelUnread` — to je lež (mentionCount vždy undefined za runtime). Totéž identifikováno jako K-3 (by-design) v ws-audit.md. Drobný typový dluh, funkčně neblokující.

## PROOF-REQUEST

Žádný — statické L1–L3 vrstvy jsou dostačující pro tuto oblast. Živá infrastruktura (L4 round-trip testy) není dostupná, nezaznačuji jako hotové.

Výjimka: **WCH-23** gap-fill test (M7) pro sound role gate — to je known gap, ne nový nález.
