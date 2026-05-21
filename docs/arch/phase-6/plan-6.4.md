# Plan 6.4 — Custom emotes

**Status:** 🟢 Implementace
**Spec:** [spec-6.4.md](spec-6.4.md)
**Design:** [design-6.4.md](design-6.4.md)
**Datum:** 2026-05-21
**Pořadí:** P1 (BE) → P2 (FE foundation) → P3 (rendering) → P4 (admin per-svět) → P5 (admin globální) → P6 (picker) → P7 (WS) → P8 (závěr).

---

## P1 — BE doplňky (~80 ř.)

| Soubor | Změna |
|---|---|
| `backend/src/modules/emotes/interfaces/custom-emotes-repository.interface.ts` | + `countByWorldId(worldId: string): Promise<number>;` + `countGlobal(): Promise<number>;` |
| `backend/src/modules/emotes/repositories/custom-emotes.repository.ts` | impl. count metod |
| `backend/src/modules/emotes/emotes.service.ts` | `create` + `createGlobal` kontrola limitu (100 / 200); `deleteFromWorld` + `deleteGlobal` emit `emote.deleted` |
| `backend/src/modules/emotes/emotes.gateway.ts` | `@OnEvent('emote.deleted')` → broadcast `emote:deleted` (svět) nebo `emote:deleted-global` (server.emit) |
| `backend/src/modules/emotes/emotes.service.spec.ts` | + testy limitu + emit eventů |

**Checklist:** BE `npm run test` zelený.

---

## P2 — FE foundation (~280 ř.)

| Soubor | Obsah |
|---|---|
| `src/features/world/chat/emotes/lib/types.ts` | `WorldEmote` interface (id, worldId, name, shortcode, imageId, createdBy, createdAt) |
| `src/features/world/chat/emotes/lib/buildEmoteUrl.ts` | `imageId → Cloudinary URL` přes `cloudinary.ts`, transform `c_limit,w_128,h_128,f_auto,q_auto` |
| `src/features/world/chat/emotes/lib/mergeEmoteSets.ts` | union global+world (world priorita) → `WorldEmoteSet` |
| `src/features/world/chat/emotes/lib/mergeEmoteSets.spec.ts` | testy priorit |
| `src/features/world/chat/emotes/lib/validateEmoteFile.ts` | FE guard: type ∈ {png, jpeg, gif, webp}, size ≤ 512 KB |
| `src/features/world/chat/emotes/lib/validateEmoteFile.spec.ts` | testy |
| `src/features/world/chat/emotes/api/useWorldEmotes.ts` | GET `/emotes/:worldId` + WS sync |
| `src/features/world/chat/emotes/api/useGlobalEmotes.ts` | GET `/emotes/global` + WS sync |
| `src/features/world/chat/emotes/api/useCreateEmote.ts` | POST `/emotes/:worldId` |
| `src/features/world/chat/emotes/api/useDeleteEmote.ts` | DELETE `/emotes/:worldId/:id` |
| `src/features/world/chat/emotes/api/useCopyEmote.ts` | POST `/emotes/:worldId/:id/copy` |
| `src/features/world/chat/emotes/api/useCreateGlobalEmote.ts` | POST `/emotes/global` |
| `src/features/world/chat/emotes/api/useDeleteGlobalEmote.ts` | DELETE `/emotes/global/:id` |

---

## P3 — Render napojení (~50 ř.)

| Soubor | Změna |
|---|---|
| `src/features/world/chat/components/WorldChatRoom.tsx` | + `useWorldEmotes`, `useGlobalEmotes`, memoized `mergeEmoteSets`, předat do `ChannelView` |
| `src/features/world/chat/components/ChannelView.tsx` | accept `worldEmotes` prop, propagovat do `MessageItem` |
| `src/features/chat/components/MessageItem.tsx` | accept `worldEmotes` prop, předat do `renderChatContent` |

📚 **Proč prop drilling, ne context:** existující řetězec je 3 vrstvy hluboko (room → view → item), prop má lepší typovou stabilitu než context a vyhne se zbytečným re-renderům přes provider. Pokud bude později víc konzumentů (např. CharacterChat, GalleryComments), refaktor do contextu — zatím YAGNI.

---

## P4 — Admin per-svět (~480 ř.)

| Soubor | Obsah |
|---|---|
| `src/features/world/pages/WorldEmotesAdminPage/WorldEmotesAdminPage.tsx` | stránka — header + counter bar + grid |
| `src/features/world/pages/WorldEmotesAdminPage/WorldEmotesAdminPage.module.css` | styly |
| `src/features/world/pages/WorldEmotesAdminPage/index.ts` | barrel default export |
| `src/features/world/chat/emotes/components/EmoteGrid.tsx` | grid karet + upload tile |
| `src/features/world/chat/emotes/components/EmoteGrid.module.css` | |
| `src/features/world/chat/emotes/components/EmoteCard.tsx` | karta (image, shortcode, name, delete, copy) |
| `src/features/world/chat/emotes/components/EmoteCard.module.css` | |
| `src/features/world/chat/emotes/components/EmoteUploadDialog.tsx` | modal sigil + shortcode input + name |
| `src/features/world/chat/emotes/components/EmoteUploadDialog.module.css` | |
| `src/features/world/chat/emotes/components/EmoteEmptyState.tsx` | empty state s velkým kosočtvercem |
| `src/features/world/chat/emotes/components/EmoteCounter.tsx` | progress bar 8/100 |
| `src/features/world/chat/emotes/components/CopyEmoteDialog.tsx` | modal výběru cílového světa |
| `src/app/router.tsx` | + route `/svet/:worldSlug/admin/emotes` s `WorldMembershipGuard minWorldRole={PomocnyPJ}` |
| `src/app/layout/WorldLayout/WorldLayout.tsx` (nebo nav config) | nav položka „Emoty" v admin sekci pro `PomocnyPJ+` |

---

## P5 — Admin globální (~120 ř.)

Reuse komponenty z P4 (variant `'global'`).

| Soubor | Obsah |
|---|---|
| `src/features/ikaros/pages/IkarosEmotesAdminPage/IkarosEmotesAdminPage.tsx` | reuse `EmoteGrid` + `EmoteUploadDialog` v global režimu |
| `src/features/ikaros/pages/IkarosEmotesAdminPage/IkarosEmotesAdminPage.module.css` | |
| `src/features/ikaros/pages/IkarosEmotesAdminPage/index.ts` | barrel |
| `src/app/router.tsx` | + `/ikaros/admin/emotes` s `RoleGuard roles={[Superadmin, Admin]}` |
| `src/app/layout/IkarosLayout/IkarosLayout.tsx` (nebo nav) | nav položka „Emoty" pro `UserRole.Admin+` |

EmoteGrid + EmoteUploadDialog dostanou prop `variant: 'world' | 'global'` → větvení hooku (create/delete) a chování (kopírovat skryto pro global).

---

## P6 — Picker v composeru (~220 ř.)

| Soubor | Obsah |
|---|---|
| `src/features/world/chat/emotes/components/ChatEmotePickerPopover.tsx` | nový popover — 3 sekce (Tohoto světa / Globální / Statické) + search |
| `src/features/world/chat/emotes/components/ChatEmotePickerPopover.module.css` | |
| `src/features/world/chat/emotes/components/EmoteSection.tsx` | jedna sekce — header + grid tiles |
| `src/features/world/chat/components/ChannelComposer.tsx` | nahradit `EmojiPickerPopover` za `ChatEmotePickerPopover` (jen v composeru — reakce dál používají původní) |

📚 **Pozn.:** `EmojiPickerPopover` (frimousse-based) se neodstraňuje — používají ho reakce na zprávy. Composer dostane vlastní picker s 3 sekcemi + statickými emoji z `EMOTES` mapy fáze 4.

---

## P7 — WS sync (zahrnuto v P2, finální verifikace)

`useWorldEmotes` + `useGlobalEmotes` mají WS handler v `useEffect`. P7 = testovací průchod:
- 2 prohlížeče v stejném světě → PJ uploadne → druhý vidí ihned.
- Smazání → mizí ihned.
- Globální: 2 prohlížeče v různých světech → Admin smaže globální → oba vidí změnu.

---

## P8 — Závěr

- [ ] `mobil-desktop` audit (admin grid, modal, picker — všechny breakpointy).
- [ ] `napoveda` skill — nová sekce „Custom emoty" do `/ikaros/napoveda`.
- [ ] Roadmap: zaškrtnout 6.4 v `docs/roadmap-fe.md`.
- [ ] `dluh` skill — založit dluhy z §7 specu (`D-NEW-emote-update`, `D-NEW-cloudinary-orphan-cleanup`, `D-NEW-emote-gif-perf`, `D-NEW-emote-autocomplete`, `D-NEW-emote-categories`).
- [ ] `npm run typecheck` + `npm run test` + BE `npm run test` zelené.

---

## Acceptance gates

Před tím, než označím etapu hotovou:

| Etapa | Gate |
|---|---|
| P1 | BE testy zelené, žádné nové ESLint warningy |
| P2 | typecheck zelený, unit testy zelené |
| P3 | manuální test: zpráva s `:smile:` ve světě, kde `smile` existuje, vykreslí `<img>` |
| P4 | manuální test: PJ může vytvořit, smazat, kopírovat emote ve světě |
| P5 | manuální test: Admin může vytvořit a smazat globální emote |
| P6 | manuální test: picker v composeru ukazuje 3 sekce, klik vloží `:shortcode:` |
| P7 | manuální test: WS sync funguje v 2 prohlížečích |
| P8 | mobil-desktop + napoveda + dluhy + roadmap |
