# Plán 9.1-II — Komentáře u game events (implementace)

**Spec:** [spec-9.1-II-comments.md](spec-9.1-II-comments.md) (APPROVED 2026-05-25, Q1–Q5 = A)
**Status:** DRAFT — čeká na souhlas, pak implementace
**Rozsah:** FE-only. BE komentáře hotové (controller + service + validace).

---

## Závislosti

- **9.1-I uzavřeno** (commits `b236b7e5` BE, `9c28961` FE) ✅
- Existující `GameEventCard` v [src/features/world/components/GameEventCard/](src/features/world/components/GameEventCard/) (rozšiřuje se o footer + expand)
- Reuse `ConfirmDialog`, `Button`, `Modal` z `@/shared/ui`
- `useWorldContext` pro `userRole` (permission gates)
- `currentUserAtom` z `@/shared/store/authStore` pro own-comment detection
- `UserAvatar` z `@/shared/ui` pokud existuje (jinak fallback monogram)

---

## Fáze A — FE infrastruktura

### A.1 — Typ `EventComment` + rozšíření `GameEvent`

**Soubor:** [src/shared/types/index.ts](src/shared/types/index.ts)

```ts
export interface EventComment {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  reactions: Record<string, string[]>;
  isDeleted: boolean;
}

// Rozšířit existující GameEvent interface:
export interface GameEvent {
  // … existující pole z 9.1-I …
  comments: EventComment[];   // NEW
}
```

### A.2 — Hooky v `useGameEvents.ts`

**Soubor:** [src/features/world/api/useGameEvents.ts](src/features/world/api/useGameEvents.ts) (rozšířit existující)

Přidat:
```ts
// Lazy fetch (full event s comments — BE GET /:id vrací comments)
useGameEventDetail(eventId: string, enabled: boolean)
  // queryKey: ['game-events', 'detail', eventId]
  // staleTime: 10_000
  // enabled

useAddComment(eventId)
  // mutationFn: ({ content, parentId? }) → POST /:id/comments
useEditComment(eventId)
  // mutationFn: ({ commentId, content }) → PATCH /:id/comments/:commentId
useDeleteComment(eventId)
  // mutationFn: (commentId) → DELETE
useReactToComment(eventId)
  // mutationFn: ({ commentId, emoji }) → POST /:id/comments/:commentId/react
```

Všechny mutace invalidují `['game-events', 'detail', eventId]` + `['game-events', 'upcoming-world']` + `['game-events', 'archive-world']` (kvůli comment count badge).

⚠️ **Pozn.:** BE `findById` (`GET /:id`) vrací full event vč. comments. Single hook `useGameEventDetail` stačí — komentáře už jsou součástí.

### A.3 — Util `relativeTime.ts` (reuse nebo nový)

**Existuje:** `relativeTimeCs` v [src/shared/utils/relativeTimeCs.ts](src/shared/utils/relativeTimeCs.ts) (z 1.5 / D-050 — tooltip pro offline usery).

Ověřit format: „před 5 min", „před 2 h", „včera v 14:00", absolutní pro >7 dní. Pokud OK → reuse. Pokud ne → util `commentRelativeTime.ts` v `src/features/world/utils/`.

---

## Fáze B — Komponenty

Všechny v `src/features/world/components/EventComments/`.

### B.1 — `<CommentItem>`

**Soubor:** `EventComments/CommentItem.tsx` + `.module.css`

Props:
```ts
{
  comment: EventComment;
  worldRole: WorldRole;
  currentUserId: string | null;
  eventId: string;
  isReply?: boolean;            // true → indent + bez „Odpovědět"
  onReplyClick?: (commentId: string) => void;
}
```

Render (non-deleted):
- Avatar (32 px, monogram fallback)
- Header: `{authorName}` + `{relativeTime(createdAt)}` + (pokud `editedAt`) pill „upraveno" s tooltipem
- Content: `<p>` s `white-space: pre-wrap` (Q1-A plain text)
- `<ReactionsRow>` pod content
- Actions row: „💬 Odpovědět" (jen pokud `!isReply` a !isDeleted), „✏️ Upravit" (jen pokud `authorId === currentUserId`), „🗑 Smazat" (vlastní nebo `worldRole >= PomocnyPJ`)

Edit mode (in-place):
- `useState<string>(comment.content)` + Uložit/Zrušit
- Submit → `useEditComment` → optimistic update + exit edit mode
- Esc → zrušit
- Validace: 1–2000 znaků

Delete:
- `ConfirmDialog` — text per role (vlastní vs. moderation)
- Po confirm → `useDeleteComment` mutace

Render (deleted):
- `<p className={s.deleted}>*Komentář byl smazán*</p>`
- Žádné reactions / actions
- Avatar zůstává (zachovává thread strukturu)

### B.2 — `<ReactionsRow>`

**Soubor:** `EventComments/ReactionsRow.tsx` + `.module.css`

Props:
```ts
{
  reactions: Record<string, string[]>;
  currentUserId: string | null;
  onToggle: (emoji: string) => void;
  /** Pokud true (smazaný comment), render nic. */
  hidden?: boolean;
}
```

Render:
- 6 chips vždy (👍 ❤️ 😂 😮 😢 🎉), zobrazí jen ty s `count > 0` nebo na hover „+" pro přidání reakce
- **Refined:** zobrazit vždy chip pokud má >0, jinak v rozbalovacím pickeru „+"

Alternative simple (recommended pro 9.1-II): **always render 6 chips, count 0 jsou ghost (opacity 0.3), klik vždy toggle.** Picker odložit (Q3-A).

Klik chip → `onToggle(emoji)` + optimistic update
Tooltip — `userIds` převést na `userNames` (potřebujeme nebo přijmout že je jen userId)? — **fallback: ukázat jen count.** Reálné userNames vyžadují bulk fetch user names → zbytečné. Stačí count.

### B.3 — `<CommentComposer>`

**Soubor:** `EventComments/CommentComposer.tsx` + `.module.css`

Props:
```ts
{
  eventId: string;
  parentId?: string | null;     // null/undefined = root, string = reply
  onSubmit?: () => void;        // např. zavřít reply composer
  onCancel?: () => void;
  autoFocus?: boolean;
}
```

Render:
- `<textarea>` s `maxLength={2000}` + ref pro autofocus
- Pod textareu řádek: counter `{n} / 2000` (zobraz jen pokud `n > 1800`), Submit + Cancel buttons
- Enter (bez Shift) = submit; Shift+Enter = newline
- Esc = `onCancel` (jen reply composer)
- Submit → `useAddComment.mutate({ content, parentId })` → optimistic; po success volá `onSubmit`
- Empty content + Enter = no-op
- Loading state: button disabled + „Odesílám…"

### B.4 — `<CommentThread>`

**Soubor:** `EventComments/CommentThread.tsx`

Props:
```ts
{
  comments: EventComment[];
  eventId: string;
  worldRole: WorldRole;
  currentUserId: string | null;
}
```

Logika:
- Rozdělit `comments` na root (`parentId === null`) a replies (`parentId === root.id`)
- Sort root DESC by createdAt (Q5-A)
- Sort replies ASC by createdAt (Q5-A)
- Pro každý root: render `<CommentItem>` + nested replies + reply composer (toggle by `replyingTo` state)

State:
```ts
const [replyingTo, setReplyingTo] = useState<string | null>(null);
```

---

## Fáze C — Integrace do `GameEventCard`

### C.1 — `<GameEventCommentsFooter>`

**Soubor:** `EventComments/GameEventCommentsFooter.tsx`

Props:
```ts
{
  eventId: string;
  commentCount: number;
  expanded: boolean;
  onToggle: () => void;
}
```

Render: tlačítko `<button>` „💬 N komentářů" (nebo „Komentovat" pokud N=0). Aria-expanded pro a11y.

### C.2 — `<GameEventComments>`

**Soubor:** `EventComments/GameEventComments.tsx` + `.module.css`

Props:
```ts
{
  eventId: string;
  worldRole: WorldRole;
  currentUserId: string | null;
}
```

Logika:
- `useGameEventDetail(eventId, enabled=true)` — fetch fresh data s comments
- Loading skeleton (3 placeholder rows)
- Render `<CommentThread>` + `<CommentComposer parentId={null}>`
- Empty state „Žádné komentáře. Buď první!" + composer

### C.3 — Wireup do `GameEventCard`

Editace [src/features/world/components/GameEventCard/GameEventCard.tsx](src/features/world/components/GameEventCard/GameEventCard.tsx):

```tsx
const [commentsExpanded, setCommentsExpanded] = useState(false);
const commentCount = event.comments?.length ?? 0;
const canSeeComments = !isArchivePast || viewerRole >= WorldRole.PomocnyPJ;
// (Hrac u archivních akcí nemá přístup k samotné akci, ale safety check.)

// Pod attendees blok:
{canSeeComments && (
  <GameEventCommentsFooter
    eventId={event.id}
    commentCount={commentCount}
    expanded={commentsExpanded}
    onToggle={() => setCommentsExpanded((v) => !v)}
  />
)}
{commentsExpanded && canSeeComments && (
  <GameEventComments
    eventId={event.id}
    worldRole={viewerRole}
    currentUserId={currentUser?.id ?? null}
  />
)}
```

**CSS:** karta s `commentsExpanded` má `grid-column: 1 / -1` (na 2col gridu zabere celý řádek). Toggle přes data atribut:

```tsx
<article className={clsx(s.card, isPast && s.cardPast)} data-expanded={commentsExpanded}>
```

```css
.card[data-expanded='true'] {
  grid-column: 1 / -1;
}
```

⚠️ **Animace:** smooth expand by vyžadoval height transition; pro 9.1-II skip (paint shift OK). Polish dluh pokud bude rušit.

---

## Fáze D — Permissions & edge cases

D.1 **Archive role gate** — Hrac k archivním akcím nemá přístup (9.1-I), tj. ani jejich komentáře nevidí. Žádný extra check potřeba — karta archive akce se Hrac nezobrazí.

D.2 **Edit/Delete actions:**
- Edit: jen `comment.authorId === currentUser.id`
- Delete vlastní: jen `comment.authorId === currentUser.id`
- Delete cizí: jen `worldRole >= WorldRole.PomocnyPJ`

D.3 **Smazaný comment:**
- `comment.isDeleted === true` → `<CommentItem>` render mode = deleted (placeholder + bez actions)
- Reply na smazaný root: zůstanou viditelné pod placeholderem

D.4 **Anonymous user:**
- Stránka je `memberOnly` route → currentUser vždy existuje. Safety: `currentUserId === null` → skryté všechny actions.

---

## Fáze E — Testy

**Soubory v `EventComments/__tests__/`:**

E.1 `useGameEventDetail.spec.ts` — `enabled: false` → no fetch
E.2 `CommentItem.spec.tsx`:
  - render own: vidí Upravit + Smazat
  - render foreign + Hrac: nevidí Upravit ani Smazat
  - render foreign + PJ: vidí Smazat
  - render deleted: placeholder, žádné actions
  - render edited: pill „upraveno"
E.3 `ReactionsRow.spec.tsx`:
  - 6 chips render
  - klik chip → onToggle(emoji)
  - active state pokud `currentUserId` v reactions[emoji]
  - hidden=true → render null
E.4 `CommentComposer.spec.tsx`:
  - Enter submit
  - Shift+Enter = newline (žádný submit)
  - Esc → onCancel (pokud poskytnut)
  - Empty content + Enter = no-op
  - 2001 znaků → validation error
  - Counter zobrazen jen pokud `n > 1800`
E.5 `CommentThread.spec.tsx`:
  - root DESC, reply ASC
  - replyingTo state — composer toggle

---

## Fáze F — Polish & docs

F.1 `mobil-desktop` audit — static CSS check:
  - Composer textarea full-width na mobilu
  - Actions row column na <768px
  - Reactions chips wrap
  - Karta `grid-column: 1 / -1` na mobilu = no-op (už je 1col)

F.2 `napoveda` update [PagesSection.tsx](src/features/ikaros/pages/HelpPage/sections/PagesSection.tsx) — rozšířit záznam „Akce světa" o:
  > „Pod každou akcí jsou komentáře — root + jedno-úrovňová odpověď. Reakce emoji (👍 ❤️ 😂 😮 😢 🎉) jedním klikem. Vlastní komentář upravíš nebo smažeš; Pomocný PJ a Pán jeskyně mohou smazat cizí (moderace)."

F.3 Roadmap update [docs/roadmap-fe.md:1440](docs/roadmap-fe.md#L1440) — 9.1d ✅, celé 9.1 z 🟡 na ✅.

F.4 Memory — bez nové memory (9.1-II je incremental, archive policy z 9.1-I stále platí).

F.5 Commit FE 9.1-II.

---

## Pořadí provedení

1. Fáze A (infra) — typ + hooky + util check
2. Fáze B (komponenty) — CommentItem → ReactionsRow → Composer → Thread (každá samostatně, lze testovat izolovaně)
3. Fáze C (integrace) — Footer + Comments orchestrátor + Card wireup
4. Fáze D — permissions (součást komponent, ne samostatný krok — vlastně tu jen ověřuju)
5. Fáze E — testy průběžně, finální vitest run
6. Fáze F — polish + docs + commit

**Commit strategy:** jeden commit `feat(9.1-II-FE): komentáře u game events`.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| `useGameEventDetail` cache vs. list query — duplicitní data | Akceptováno: list query nemá comments (BE neoptimalizuje), detail query je extra hit. Při mutaci comment invaliduji obě (lehké, ale konzistentní). |
| Optimistic update reactions — race condition při rychlém toggle | TanStack `useMutation` outboxuje sekvenčně. Při fail = invalidate query (revert). |
| `commentCount` na kartě z list query (bez comments[]) → 0 i když 1+ | Buď list query rozšířit (BE změna, scope creep), nebo na kartě fetch detail při render (drahé). **Rozhodnutí v plánu:** zobrazit jen pokud `event.comments?.length > 0` (list query vrací undefined → footer „Komentovat"; po expand = fresh detail s reálným count). |
| Edit mode + rerender → ztracený rozpracovaný text | `useState` local — rerender nemaže. Pokud parent unmount (zavře expand), text se ztratí. Akceptováno. |
| Avatar — chybí UserAvatar v existing kompoentu? | Fallback: monogram (první písmeno authorName) ve span s background-color z hash(userId). |
| Mobil — composer textarea zabere obrazovku | `min-height: 80px` + `max-height: 200px` (scroll). OK pro Q1-A plain text. |

---

## Akceptační kritéria

Viz [spec §9](spec-9.1-II-comments.md#9-—-acceptance-criteria-91-ii). 19 kritérií.

---

## Mimo plán 9.1-II

- WS live sync (BE gap)
- Custom emoji picker (Q3-B)
- Moderation reason (Q2-B)
- Markdown / mentions (Q1-B)
- Notifikace o reply (Q4-B)
- Comment search / sticky / pinned
