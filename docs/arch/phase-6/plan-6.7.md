# Plan 6.7 — implementační plán

**Spec:** [spec-6.7.md](spec-6.7.md) (✅ schváleno 2026-06-05)
**Pořadí:** BE jádro → BE auto-konverzace → BE prefs → FE. BE a FE nikdy nemíchat v jedné dávce ([[feedback_no_mixed_be_fe_batch]]).

---

## Etapa A — 6.7a Soukromá konverzace postavy (BE, `Projekt-ikaros`)

**A1 — Schema + mapper**
- `chat/schemas/chat-channel.schema.ts`: `@Prop() linkedMemberUserId?: string`. `type` už existuje (rozšířit hodnoty o `'character'`).
- `chat/repositories/chat-channel.repository.ts`: do `toEntity` whitelist přidat `linkedMemberUserId` (jinak GET zahodí — [[project_be_field_checklist]]).
- `chat/interfaces` / `ChatChannel` typ: pole doplnit.

**A2 — PJ+ access fix**
- `chat.service.ts` `hasChannelAccess`: u `accessMode==='members'` vrátit `true` i pro `canManageChat(requester…)`. Pozor: dnes bere jen `userId` — potřebuje znát roli → načíst membership a zkontrolovat `>= PomocnyPJ` (nebo platform Admin). Sjednotit s `hasAccessGivenMembership`.
- Test: PJ bez `allowedMemberIds` čte/píše do `members` konverzace; Hráč mimo seznam dostane 403.

**A3 — Seed + migrace**
- `seedDefaultGroups`: kanál „Postavy" **bez** konverzace „hráči" (smazat ten `channelRepo.save` blok).
- `ensureWorldChat`: po seedu/dorovnání — najít v kanálu „Postavy" konverzaci `name==='hráči'`; pokud **0 zpráv**, soft-delete. Idempotentní.
- Test: nový svět nemá „hráči"; existující prázdná „hráči" se smaže; „hráči" se zprávami zůstane.

**A4 — Auto-konverzace handler**
- `@OnEvent('world.character.assigned')` v `chat.service.ts`: najít kanál „Postavy" světa → najít konverzaci `linkedMemberUserId===userId` →
  - není: `createChannel`-like save (`members`, `[userId]`, name=jméno postavy, `type:'character'`, `linkedMemberUserId`), emit `chat.channel.created`.
  - je: `update` name na jméno postavy, emit `chat.channel.updated`.
- Jméno postavy: z `characterPath` přes pages/directory service (název entry); fallback username.
- Test: assign → vznik; re-assign (jiná postava) → přejmenování, ne duplikát.

---

## Etapa B — 6.7b/c Per-membership prefs (BE, `Projekt-ikaros`)

**B1 — WorldMembership schema + mapper**
- `worlds/schemas/world-membership.schema.ts`: `chatGroupOrder?: string[]`, `chatChannelOrder?: Map<string,string[]>` (Mongo Map / Mixed), `chatExpandedGroups?: string[]`.
- repo `toEntity`: doplnit tři pole do whitelistu.
- FE/BE typ `WorldMembership`.

**B2 — Endpoint `PATCH /worlds/:worldId/chat/my-prefs`**
- `chat.controller.ts`: route, `JwtAuthGuard`, member-guard (≥ Hráč, ne PJ).
- `chat.service.ts` `updateMyChatPrefs(worldId, userId, dto)`: partial update na requesterův membership přes `membershipRepo`.
- DTO `{ groupOrder?, channelOrder?, expandedGroups? }` — validace string[]/Record.
- Test: uloží jen poslaná pole; cizí membership nelze měnit.

---

## Etapa C — 6.7b/c FE (`Projekt-ikaros-FE`)

**C1 — Types + hook**
- `shared/types` + `world/chat/lib/types.ts`: prefs pole na membership.
- `world/chat/api/useChatPrefs.ts`: čtení z membership (už načteno přes `/worlds/my`); `useUpdateChatPrefs` — optimistic + **debounce ~400 ms**, PATCH `…/chat/my-prefs`.

**C2 — ChannelSidebar**
- Drag-drop **un-gate** z `canManage` → řadí každý; `onDragEnd` zapisuje do osobního pořadí (ne globální reorder endpoint).
- Aplikovat osobní pořadí: merge známých ID dle prefs, zbytek na konec dle globálního `order`.
- Collapse: init `collapsed = !(expandedGroups.includes(id) || obsahuje aktivní konverzaci)`; toggle → optimistic + persist.

**C3 — WorldChatRoom**
- Předat prefs + aktivní-kanál override do sidebaru.
- Staré `useReorderGroups/useReorderChannels` (globální) přestat volat (ponechat/smazat — rozhodnout při kódu).

---

## Závěr (Fáze 3)
- `napoveda` — chat: soukromé konverzace postav, osobní řazení/sbalení.
- Zaškrtnout roadmapu, uzavřít případné dluhy.
- `mobil-desktop` na sidebar (drag + collapse na 375/768/1440).
- FE `npm run build` ([[project_fe_build_preexisting_errors]]); BE `prettier --write` + `jest` ručně ([[feedback_be_precommit_prettier]]).

## Doporučené dávkování commitů
1. Etapa A (BE auto-konverzace + access fix + seed).
2. Etapa B (BE prefs schema + endpoint).
3. Etapa C (FE prefs + sidebar).
Každá etapa = ucelený, otestovaný celek; žádné půlené impl ([[feedback_no_debt]]).
