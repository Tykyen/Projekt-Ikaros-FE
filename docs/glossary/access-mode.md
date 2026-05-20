---
name: access-mode
aliases: [accessMode, přístupový režim]
category: chat
related: [[konverzace]], [[kanal]], [[world-role]]
status: draft
---

# Access mode

**TL;DR:** Režim řízení přístupu ke [[konverzace]] — určuje, kdo do ní smí: všichni / podle role / vyjmenovaní členové.

## Detail

`accessMode` má tři hodnoty:
- `'all'` — všichni členové [[svet]]a.
- `'roles'` — jen vyjmenované [[world-role]] (`allowedRoles: WorldRole[]`).
- `'members'` — jen vyjmenovaní uživatelé (`allowedMemberIds: string[]`).

Pole `allowedRoles` / `allowedMemberIds` se používá jen pro odpovídající mode.

## Kde se objevuje

- v kódu (BE):
  - backend/src/modules/chat/interfaces/chat-channel.interface.ts — `accessMode`, `allowedRoles`, `allowedMemberIds`
  - backend/src/modules/chat/schemas/chat-channel.schema.ts
- v kódu (FE):
  - [src/features/world/chat/lib/types.ts](../../src/features/world/chat/lib/types.ts) — `ChatChannel` typ
- v UI:
  - Vytvoření / editace konverzace — výběr access mode + checkboxy rolí / picker členů

## Nepleť s

- **`World.accessMode`** — separátně řízený přístup ke **světu** jako celku (jiný koncept, stejný název pole).
