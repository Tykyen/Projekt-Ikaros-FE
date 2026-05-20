---
name: kanal
aliases: [channel, ChatGroup]
category: chat
related: [[konverzace]]
status: draft
---

# Kanál

**TL;DR:** Skupina konverzací sdružených pod jedním názvem — kontejner, ne zpráva.

## Detail

**Kanál** = nadřazená skupina, ve které žije několik [[konverzace]]. Hráč si vybere kanál → uvnitř vidí jednu nebo víc konverzací.

⚠️ **Frontend vs. backend pojmenování je invertované:**
- ve frontendu / s uživatelem mluvíme o **kanálu** = skupina konverzací,
- v backendu / databázi je to entita `ChatGroup`.

Slovníček odráží **frontend úzus** (jak to uživatel vidí), backend pojmenování patří jen do *Nepleť s*.

## Kde se objevuje

- v kódu (FE):
  - [src/features/world/chat/lib/types.ts](../../src/features/world/chat/lib/types.ts) — `interface ChatGroup`
  - [src/features/world/chat/components/ChannelGroup.tsx](../../src/features/world/chat/components/ChannelGroup.tsx)
  - [src/features/world/chat/components/ChannelSidebar.tsx](../../src/features/world/chat/components/ChannelSidebar.tsx)
  - [src/features/world/chat/api/useWorldChat.ts](../../src/features/world/chat/api/useWorldChat.ts)
- v kódu (BE):
  - backend/src/modules/chat/interfaces/chat-group.interface.ts
  - backend/src/modules/chat/schemas/chat-group.schema.ts — collection `chatgroups`
  - backend/src/modules/chat/repositories/chat-group.repository.ts
- v dokumentaci:
  - [docs/arch/phase-6/spec-6.1.md](../arch/phase-6/spec-6.1.md) — chat architektura
- v UI:
  - Levý sloupec světového chatu (seznam sbalovatelných kanálů)
  - Drag-and-drop reorder, mini thumbnail u kanálu

## Nepleť s

- **[[konverzace]]** — jednotlivá místnost uvnitř kanálu (BE: `ChatChannel`).
- **`ChatGroup` (BE entita)** — backend název pro tentýž koncept; frontend ho **nepoužívá**.
