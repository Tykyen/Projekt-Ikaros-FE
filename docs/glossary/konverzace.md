---
name: konverzace
aliases: [conversation, ChatChannel]
category: chat
related: [[kanal]]
status: draft
---

# Konverzace

**TL;DR:** Jednotlivá chatová místnost uvnitř [[kanal]] — to, ve kterém probíhá konkrétní rozhovor a zprávy.

## Detail

Konverzace žije uvnitř kanálu (skupiny). Uživatel klikne na konverzaci a vidí historii zpráv + může psát novou.

⚠️ **Frontend vs. backend pojmenování je invertované:**
- ve frontendu / s uživatelem mluvíme o **konverzaci** = jedna místnost,
- v backendu / databázi je to entita `ChatChannel`.

Slovníček odráží **frontend úzus** (jak to uživatel vidí), backend pojmenování patří jen do *Nepleť s*.

## Kde se objevuje

- v kódu (FE):
  - [src/features/world/chat/lib/types.ts](../../src/features/world/chat/lib/types.ts) — `interface ChatChannel`
  - [src/features/world/chat/components/ChannelView.tsx](../../src/features/world/chat/components/ChannelView.tsx) — messages + composer + presence
  - [src/features/world/chat/components/ChannelItem.tsx](../../src/features/world/chat/components/ChannelItem.tsx)
  - [src/features/world/chat/api/useWorldChat.ts](../../src/features/world/chat/api/useWorldChat.ts)
- v kódu (BE):
  - backend/src/modules/chat/interfaces/chat-channel.interface.ts — `accessMode`, `allowedRoles`, `allowedMemberIds`
  - backend/src/modules/chat/schemas/chat-channel.schema.ts — collection `chatchannels`
  - backend/src/modules/chat/repositories/chat-channel.repository.ts
- v dokumentaci:
  - [docs/arch/phase-6/spec-6.1.md](../arch/phase-6/spec-6.1.md)
- v UI:
  - Channel item v sidebaru, header s memberama
  - Message list + composer, unread badge

## Nepleť s

- **[[kanal]]** — skupina, do které konverzace patří (BE: `ChatGroup`).
- **`ChatChannel` (BE entita)** — backend název pro tentýž koncept; frontend ho **nepoužívá**.
