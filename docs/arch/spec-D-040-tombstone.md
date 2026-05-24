# Spec D-040 — Tombstone integrace do chat / článek / galerie / diskuze

> Status: **draft, čeká na schválení**
> Datum: 2026-05-24
> Návaznosti: 1.3c (`<UserAvatar deleted />` primitive), `User.isDeleted` (BE schema + FE typ)

---

## 1. Cíl

Když uživatel smaže účet (soft-delete přes `deletionRequestedAt` + 30denní hold → hard cleanup nastaví `isDeleted=true` a anonymizuje řádek), jeho historický obsah (chat zprávy, články, diskuzní příspěvky, komentáře galerie) musí v UI rendrovat:

1. **Avatar** s tombstone overlay (`<UserAvatar deleted />`) — primitive existuje od 1.3c.
2. **Display name** přepsaný na **„Smazaný účet"** místo původního `displayName`.
3. **Žádný proklik na profil** (deaktivovat `Link to={/uzivatele/:slug}`).

Dnes (před D-040) tyto komponenty zobrazují **původní displayName + avatar** i po anonymizaci → matoucí UX, leak posledního známého stavu.

---

## 2. Scope

| Feature | BE response entity | FE renderer |
|---------|-------------------|-------------|
| **Chat zprávy** | `ChatMessage` (`senderId`, `senderName`, `senderAvatarUrl`) | `MessageBubble`, `ChatSearchResults` |
| **Ikaros články** | `IkarosArticle` (`authorId`, `authorDisplayName`, `authorAvatarUrl`) | `ArticleCard`, `ArticleDetailPage`, pending tab |
| **Diskuzní vlákna** | `IkarosDiscussion` (autor vlákna) + `DiscussionPost` (autor postu) | `DiscussionCard`, `DiscussionDetailPage` posts |
| **Galerie** | `Gallery` (autor uploadu) | `GalleryCard`, `GalleryDetailPage` |
| **Komentáře v galerii / diskuzích** | viz výše | viz výše |

**Mimo scope:**
- Tombstone v `WorldMembership` / `Character` (autor postavy zůstává viditelný i po smazání platformového účtu — herní svět ho udržuje pod správou PJ).
- Mention rendering v chat textu (`@username` → text). User mention zobrazí stále původní username — to je textový reference, ne avatar.

---

## 3. Architektura — BE batch enrichment

### 3.1 Nový helper v `UsersService`

```typescript
/**
 * Batch lookup pro feature services (chat, articles, discussions, gallery).
 * Vrací jen ID → minimální tombstone-relevantní data. Pro neexistující ID
 * (smazaný hard cleanup před tombstone migrace) vrací stub se `isDeleted=true`.
 */
async findManyTombstoneInfo(
  ids: string[]
): Promise<Map<string, { isDeleted: boolean; displayName: string; avatarUrl?: string }>>
```

- Implementace: `usersRepo.findByIds(distinct ids)` → mapuj `id → { isDeleted, displayName, avatarUrl }`.
- Pokud user ID v repo response chybí → `{ isDeleted: true, displayName: 'Smazaný účet' }` (hard cleanup).
- Cache: `60s` TTL přes existující in-memory cache pattern (analogicky `UserBanCacheService`).

### 3.2 Per-feature service enrichment

**Pattern (analogicky pro chat / articles / discussions / gallery):**

```typescript
async findAll(...): Promise<ChatMessage[]> {
  const raw = await this.repo.findAll(...);
  const authorIds = [...new Set(raw.map(m => m.senderId))];
  const info = await this.usersService.findManyTombstoneInfo(authorIds);
  return raw.map(m => ({
    ...m,
    senderIsDeleted: info.get(m.senderId)?.isDeleted ?? false,
  }));
}
```

Touchpointy:
- `chat.service.listMessages` + `findAndSearch` + WS broadcast (jen vlastní zpráva = single lookup)
- `ikaros-articles.service.findAll` + `findById` + `getPendingArticles` + `bulkApprove/Reject` (vrací IDs ne entity)
- `ikaros-discussions.service.findAll` + `findById` + `getPosts` (autor postu) + `addPost` (single)
- `gallery.service` (analogicky)

### 3.3 Entity rozšíření

- `ChatMessage.senderIsDeleted?: boolean`
- `IkarosArticle.authorIsDeleted?: boolean`
- `IkarosDiscussion.authorIsDeleted?: boolean`
- `DiscussionPost.authorIsDeleted?: boolean`
- `Gallery.authorIsDeleted?: boolean`
- `GalleryComment.authorIsDeleted?: boolean`

Optional pole — backward kompatibilita (FE před D-040 deploy neuvidí `undefined`, behavior beze změny).

---

## 4. FE renderer wireup

### 4.1 Helper hook (sdílený)

```typescript
// src/shared/hooks/useTombstoneAuthor.ts
export function useTombstoneAuthor<T extends { isDeleted?: boolean }>(
  author: T,
  fallback: { displayName: string; avatarUrl?: string }
): { displayName: string; avatarUrl?: string; deleted: boolean }
```

Inputem je `{ isDeleted, displayName, avatarUrl }` pole z entity. Pokud `isDeleted === true` → vrátí `{ displayName: 'Smazaný účet', avatarUrl: undefined, deleted: true }`. Jinak `{ ...fallback, deleted: false }`.

### 4.2 Touchpointy

- `MessageBubble` (světový chat, ikaros chat) — `<UserAvatar deleted={msg.senderIsDeleted} />` + name přepis
- `ChatSearchResults` (krok 6.6) — stejně
- `ArticleCard` + `ArticleDetailPage` — autor v záhlaví
- `ArticleReviewRenderer` (pending tab) — žádost o publish od smazaného usera = stále zobrazit jako „Smazaný účet"
- `DiscussionCard` + `DiscussionDetailPage` — autor vlákna v záhlaví + autoři postů
- `GalleryCard` + `GalleryDetailPage` + `Lightbox` — autor uploadu + autoři komentářů
- `NewsCard` — autor novinky (admin obsah, ale i tady)

### 4.3 Proklik na profil

- Pokud `deleted === true`, **deaktivovat** `<Link to={/uzivatele/:slug}>` → render jako `<span>` bez clickability.
- Tooltip „Tento účet byl smazán" (volitelné, hover-only).

---

## 5. Testy

### 5.1 BE

- `UsersService.findManyTombstoneInfo` — 4 testy (smazaný, aktivní, mix, prázdný input → empty map).
- Per-feature service: `findAll` returns enriched (smazaný autor → `senderIsDeleted: true`). 1 test/feature × 4 features = 4 testy.
- Cache hit test (1 lookup, druhý volání bez DB call).

### 5.2 FE

- `useTombstoneAuthor` — 3 testy (deleted → „Smazaný účet" + no avatar; not deleted → original; missing isDeleted → fallback original).
- `MessageBubble` snapshot s `senderIsDeleted` — render má tombstone band na avataru + „Smazaný účet" name.
- `ArticleCard` — analogicky.
- `DiscussionCard` — analogicky.
- Proklik na profil deaktivován (no `<Link>` render).

---

## 6. Edge cases

| Případ | Chování |
|--------|---------|
| User smazaný, ale autor postavy ve světě | Postava zůstává, ale platformový autor v chatu = „Smazaný účet". |
| Mention `@username` v textu zprávy odkazuje na smazaného | Text se nemění (historický záznam). Mention link deaktivován (klik = no-op). |
| Smazaný admin který schválil článek | `approvedBy` field zobrazí „Smazaný účet" v audit logu. |
| Hard cleanup proběhl (řádek user fyzicky smazán) | `findByIds` ID nenajde → stub `isDeleted=true`. |
| WS broadcast new chat message od smazaného uživatele | BE neměl pustit přes JwtStrategy (banned), ale defenzivně: enrich i nově vytvořenou zprávu. |
| Pending action od smazaného | Zobrazit jako tombstone, akce zablokované (Approve/Reject by failovaly na guard, ale UI zobrazí důvod). |

---

## 7. Náklady & odhad

- **BE:** ~6 h (helper + 4 service enrichments + testy + cache integration).
- **FE:** ~4 h (helper hook + 8 renderer touchpointů + testy).
- **Celkem:** ~10 h, realisticky 1.5 dne s buffer.

---

## 8. Sub-kroky (impl plán — po schválení specu)

1. BE: `UsersService.findManyTombstoneInfo` + cache + 4 testy.
2. BE: enrich `chat.service` + 2 testy.
3. BE: enrich `ikaros-articles.service` + 2 testy.
4. BE: enrich `ikaros-discussions.service` + 2 testy.
5. BE: enrich `gallery.service` + 2 testy.
6. FE: `useTombstoneAuthor` hook + 3 testy.
7. FE: chat renderery (`MessageBubble`, `ChatSearchResults`) + snapshot test.
8. FE: článek renderery (`ArticleCard`, `ArticleDetailPage`, `ArticleReviewRenderer`).
9. FE: diskuze renderery (`DiscussionCard`, `DiscussionDetailPage`, posts).
10. FE: galerie renderery (`GalleryCard`, `GalleryDetailPage`, `Lightbox`).
11. FE: smoke test E2E happy path — smazaný user historicky napsal zprávu → render tombstone.

---

## 9. Otevřené otázky

- Cache TTL 60 s pro `findManyTombstoneInfo` — stačí? Alternativa: invalidace přes Redis pub/sub `user.deleted` event (analogicky D-028 ban cache).
- Tooltip „Tento účet byl smazán" — zobrazit nebo ne? UX rozhodnutí.
- Mention `@username` link — completely deactivate, nebo redirect na 404 page „Účet smazán"?
