# Spec 9.1-II — Komentáře u game events

**Status:** DRAFT — čeká na souhlas
**Velikost:** M (FE-only, BE už hotové)
**Návaznost:** [spec-9.1-game-events.md](spec-9.1-game-events.md) (9.1-I implementováno 2026-05-24, commits `b236b7e5` BE + `9c28961` FE)

---

## 1 — Cíl

Hráči a PJ diskutují pod každou herní akcí. Vláknové komentáře (root + jednoúrovňové reply), emoji reakce, edit vlastních, soft-delete (vlastní nebo PJ+). Komentáře přístupné v archivu i u nadcházejících akcí (PJ může vést retro k proběhlé hře).

---

## 2 — BE — vše hotové

Endpointy + service + validace už existují (BE pokryt 9.1 BE plánem dříve). Žádné BE rozšíření.

```ts
POST   /api/game-events/:id/comments                    // root nebo reply na root
PATCH  /api/game-events/:id/comments/:commentId         // edit vlastní
DELETE /api/game-events/:id/comments/:commentId         // soft-delete vlastní nebo PJ+
POST   /api/game-events/:id/comments/:commentId/react   // toggle emoji reakce
```

Datový model (z BE `EventComment`):

```ts
interface EventComment {
  id: string;
  parentId: string | null;          // null = root; jinak root.id (1 úroveň)
  authorId: string;
  authorName: string;
  content: string;                  // 1–2000
  createdAt: Date;
  editedAt: Date | null;
  reactions: Record<string, string[]>;  // emoji → userIds[]
  isDeleted: boolean;
}
```

**BE constraints:**
- `parentId` musí být root (`parent.parentId === null`) — žádné nested-nested (BE 400 jinak)
- Edit jen vlastní (`authorId === user.id`), ne smazané (BE 400)
- Delete vlastní nebo PJ+ (canManage)
- Reakce na smazaný = silent ignore (BE vrátí event bez změny)
- Smazaný comment má `content: ''` + `isDeleted: true` (zachovává `parentId`, `authorName`, `createdAt` pro thread strukturu)

---

## 3 — Datový model FE

Rozšíření `GameEvent` typu o `comments`:

```ts
export interface EventComment {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;        // BE Date → FE ISO string
  editedAt: string | null;
  reactions: Record<string, string[]>;
  isDeleted: boolean;
}

export interface GameEvent {
  // ... existující pole z 9.1-I
  comments: EventComment[];   // NEW v 9.1-II
}
```

⚠️ **Pozor:** BE už `comments` v `GameEvent` schema vrací (pole existuje), FE typ ho ale teď ignoruje. Spec 9.1-II ho přidá do FE typu — žádná migrace dat.

---

## 4 — UI struktura

### 4.1 — Kam komentáře umístit

**Rozhodnutí (recommended):** **Expand-on-click v kartě** — pod tělem karty se rozbalí komentářová sekce po kliknutí na „💬 N komentářů" footer.

Důvody:
- **Žádný extra modal** = kontext akce zůstává viditelný
- **Mobile-friendly** — modal s thread je nepřehledný
- **Grid layout zachován** — karta s otevřenými komentáři přeteče na celý řádek (`grid-column: 1 / -1`)
- **Lazy-load** — komentáře se načtou až při expand (samostatný `useGameEventComments(id, enabled)` hook), neplýtvá BW u 50 akcí v archivu

Alternativy zvážené:
- **Samostatný modal/sheet** — zbytečné UI navíc, ztrácí kontext (KO)
- **Vždy zobrazené pod kartou** — vizuální šum, plýtvá BW, problém u archivu se stovkami akcí (KO)

### 4.2 — Komponentní strom

```
GameEventCard
  ├─ <existující media + body + RSVP + attendees>
  └─ <GameEventCommentsFooter>      ← „💬 3 komentáře" toggle
      └─ <GameEventComments>        ← rozbalený panel (lazy load on expand)
           ├─ <CommentList>
           │    └─ <CommentThread>  ← root + nested replies
           │         ├─ <CommentItem> (root)
           │         │    ├─ avatar + authorName + relativní čas + "upraveno" pill
           │         │    ├─ content (RichText nebo plain text? — viz Q1)
           │         │    ├─ <ReactionsRow>  ← emoji + count + toggle
           │         │    └─ actions: 💬 Odpovědět | ✏️ Upravit | 🗑 Smazat
           │         └─ <CommentItem replies>  ← reply items pod root (indent)
           ├─ <CommentComposer>     ← nový root comment
           └─ <CommentComposer parentId="...">  ← reply composer (rozbalí pod root)
```

### 4.3 — Smazaný komentář

Render „*Komentář byl smazán*" italic, šedý, **bez** reactions / edit / reply tlačítek. Zachová slot v threadu (jinak by reply na smazaný root osiřel).

⚠️ **Smazaný root s reply:** reply zůstanou viditelné, ale parent placeholder „*smazáno*" zůstane nad nimi. UX-wise OK (transparentnost).

---

## 5 — Reactions

**Rozhodnutí (recommended):** **Predefinovaná sada 6 emoji + složený picker pro custom.**

Sada: 👍 ❤️ 😂 😮 😢 🎉

Důvody:
- BE povoluje libovolný unicode (max 16 znaků) — flexibilita zachována
- Predefinovaná sada = jeden klik (mobile-friendly), žádný picker pop-up pro běžnou reakci
- Custom picker přes „+" tlačítko (volitelně 9.1-II nebo dluh) — málokdo použije

Implementace v 9.1-II: **jen sada 6 emoji, žádný custom picker.** Custom = samostatný dluh.

**Render reactions:**
- Pod content řádek: chips `[emoji] [count]`, klik = toggle
- Vlastní reakce = aktivní stav (border accent)
- Tooltip na chip ukazuje až 5 userNames + „+N další"

---

## 6 — Edit + delete UI

**Edit in-place:**
- Klik „Upravit" → content se nahradí `<textarea>` + Uložit/Zrušit buttons
- Vlastní comment only (FE skryje button, BE 403 backup)
- Po uložení: optimistic update + `editedAt` pill „upraveno" + tooltip s ISO

**Delete:**
- Vlastní comment: `ConfirmDialog` „Smazat svůj komentář?" + danger
- PJ+ moderation: `ConfirmDialog` „Smazat komentář od `{authorName}`?" + reason field (volitelně — viz Q2)
- Soft-delete → optimistic invalidace

---

## 7 — Hooky a invalidace

```ts
// Comments fetch (lazy on expand)
useGameEventComments(eventId, enabled)
  // queryKey: ['game-events', 'comments', eventId]
  // staleTime: 10_000 (10s — drobně reaktivnější než 30s u eventů)
  // enabled: !!eventId && enabled

useAddComment(eventId)
useEditComment(eventId)
useDeleteComment(eventId)
useReactToComment(eventId)
  // všechny invalidují ['game-events', 'comments', eventId]
  // + ['game-events', 'upcoming-world'/'archive-world'] kvůli count badge v karte
```

**Polling vs. socket:**
- 9.1-II = jen staleTime 10s + manual invalidate po mutaci
- WebSocket live sync = **BE gap** (poznámka v roadmap §1499: „BE gap — Game Events WS")
- Pokud později přibyde WS, hook se rozšíří o `useSocketEvent` invalidaci

---

## 8 — Permission matrix (rozšíření 9.1-I §7)

| Akce | Hráč | PomocnyPJ | PJ | Admin |
|---|---|---|---|---|
| Číst komentáře | ✓ (akce ji vidí) | ✓ | ✓ | ✓ |
| Přidat root comment | ✓ | ✓ | ✓ | ✓ |
| Přidat reply | ✓ | ✓ | ✓ | ✓ |
| Reagovat (emoji) | ✓ | ✓ | ✓ | ✓ |
| Upravit vlastní | ✓ | ✓ | ✓ | ✓ |
| Upravit cizí | — | — | — | — (žádná moderace edit) |
| Smazat vlastní | ✓ | ✓ | ✓ | ✓ |
| Smazat cizí | — | ✓ | ✓ | ✓ |
| Číst archiv komentářů | — (Hrac nemá archiv) | ✓ | ✓ | ✓ |

**Vázáno na archive role gate z 9.1-I:** komentáře u archivních akcí může číst jen PJ+ (přístup k samotné akci je gated, takže k jejím komentářům také).

⚠️ **Smazaný komentář u proběhlé akce může editovat?** — BE neumožní (`isDeleted: true → 400`). Stejně tak na FE skryjeme tlačítko.

---

## 9 — Acceptance criteria 9.1-II

1. Klik na „💬 N komentářů" footer rozbalí komentářovou sekci pod kartou (grid-column: 1 / -1).
2. Lazy-load: hook `useGameEventComments` se aktivuje až při prvním expandu, ne dřív.
3. Root comments + reply zobrazené hierarchicky (reply odsazené 24 px vlevo).
4. Composer dole — Enter nebo „Odeslat" button → POST + optimistic přidání.
5. Reply composer otevřen pod root comment po kliku „Odpovědět" — Esc nebo Zrušit zavře.
6. Reactions row pod content: 6 emoji chips + count + tooltip s userNames.
7. Klik na emoji = toggle (přidat/odebrat reakci); aktivní stav má border accent.
8. Edit in-place: klik „Upravit" → textarea s prefilled content → Uložit (PATCH) nebo Zrušit. „upraveno" pill po úspěchu.
9. Delete: ConfirmDialog → DELETE → soft-delete → render „*Komentář byl smazán*".
10. Smazaný comment **nezobrazuje** reactions/edit/reply/delete buttons.
11. PJ vidí na cizím commentu tlačítko Smazat (moderation).
12. Editace cizího commentu skrytá (FE) i 403 (BE).
13. Archive akce: Hrac nevidí komentáře (skip footer render). PJ+ vidí.
14. Validace composer: 1–2000 znaků, počítadlo `1234 / 2000` při >1800.
15. Empty state: „Žádné komentáře. Buď první!" + zobrazený composer.
16. Mobil: composer textarea full-width, action buttons stack, reactions chips wrap.
17. FE testy: hook gating (enabled false → no fetch), CommentItem (5 stavů: own/foreign/edited/deleted/reply), ReactionsRow (toggle, active state), Composer (validation, Enter submit, Esc cancel).
18. `mobil-desktop` audit ✓
19. `napoveda` aktualizace ✓ (rozšířit „Akce světa" o komentáře)

---

## 10 — Otevřené otázky

**Q1 — Formátování commentu (plain text vs. RichText):**
- **A** (recommended): Plain text (newlines zachovány přes `white-space: pre-wrap`). Markdown/HTML zakázáno. Jednoduchý, bezpečný, mobile-friendly.
- **B**: Markdown podporovaný (bold, italic, links). Vyžaduje renderer (react-markdown). Větší rozsah, riziko XSS pokud špatně sanitized.

**Q2 — Moderation delete reason:**
- **A** (recommended): Bez reason pole — PJ smaže silently. Audit log není v 9.1-II.
- **B**: PJ vyplní povinný reason → uloží do `EventComment.deletionReason` (BE rozšíření) → zobrazí se v placeholder „*Smazáno PJ: <reason>*". Větší rozsah, BE rozšíření.

**Q3 — Custom emoji picker:**
- **A** (recommended): Jen sada 6 emoji v 9.1-II. Custom picker = samostatný dluh (málokdo použije).
- **B**: Sada + „+" tlačítko otevře unicode picker (emoji-mart nebo podobné). Větší rozsah.

**Q4 — Notifikace o novém commentu:**
- **A** (recommended): Žádné notifikace v 9.1-II. Vidíš to při příští návštěvě stránky.
- **B**: Toast „Nový komentář u Akce X" když přijde reply na můj root — vyžaduje socket nebo polling. Out-of-scope, závisí na WS.

**Q5 — Pořadí komentářů:**
- **A** (recommended): Root comments DESC (nejnovější nahoře), reply ASC (chronologicky pod root).
- **B**: Všechno DESC (i reply).
- **C**: Všechno ASC (chronologicky odshora).

---

## 11 — Mimo rozsah (→ dluh nebo budoucí fáze)

- WebSocket live sync (BE gap)
- Custom emoji picker (Q3-B)
- Moderation reason (Q2-B)
- Comment threads s víc úrovněmi (BE explicitně omezeno na 1 úroveň)
- Markdown / mentions / @user
- Comment notifications (Q4-B)
- Comment search / filter
- Sticky / pinned comments

---

## 12 — Reference

- BE controller: [`backend/src/modules/game-events/game-events.controller.ts:107-147`](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/game-events/game-events.controller.ts)
- BE service comments: [`game-events.service.ts:319-518`](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/game-events/game-events.service.ts)
- BE schema: [`game-event.schema.ts:16-29`](file:///C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/game-events/schemas/game-event.schema.ts)
- FE typ k rozšíření: [`src/shared/types/index.ts:681`](src/shared/types/index.ts#L681)
- Karta k rozšíření: [`src/features/world/components/GameEventCard/GameEventCard.tsx`](src/features/world/components/GameEventCard/GameEventCard.tsx)
- Spec 9.1-I (nadřazený): [`spec-9.1-game-events.md`](spec-9.1-game-events.md)
- Memory: [[project-game-events-archive-policy]] (archive role gate platí i pro komentáře)
