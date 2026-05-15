# Plán 3.4a — BE rozšíření modulu `ikaros-discussions`

**Spec:** [spec-3.4.md](spec-3.4.md) · **Sub-fáze:** 3.4a (BE only) · **Repo:** `Projekt-ikaros` (backend)
**Status:** ✅ Implementováno (2026-05-15) — sloučeno s 3.4b do jednoho BE+FE balíku
**Datum:** 2026-05-15

> **Pozn.:** Tento plán pokrýval jen 3.4a. Na pokyn PJ „sluč a aplikuj" byla 3.4a
> implementována zároveň s 3.4b (providery + enum + FE renderery) — viz spec §12.

Rozsah dle spec §12: pole `joinRequestIds`, collection `ikaros_discussion_reports`, endpointy
toggle-like / managers / join-request / report, `User.likedDiscussionIds`, odebrat PJ z `ADMIN_ROLES`,
zvednout limit `AddPostDto`. **Bez providerů a rendererů** — to je 3.4b.

---

## 1. Datové změny

### 1.1 `ikaros-discussion.schema.ts` — pole `joinRequestIds`

```ts
@Prop({ type: [String], default: [] }) joinRequestIds: string[];
```

Stejně do `IkarosDiscussion` interface a do `toEntity()` v `ikaros-discussions.repository.ts`
(`joinRequestIds: (doc.joinRequestIds as string[]) ?? []`). Migrace: default `[]` pokryje staré dokumenty.

### 1.2 Nová collection `ikaros_discussion_reports`

- **`schemas/ikaros-discussion-report.schema.ts`** — collection `ikaros_discussion_reports`:
  `discussionId, discussionTitle, postId, postContentSnapshot, postAuthorName, reporterId,
  reporterName, reason, createdAtUtc, resolved` (viz spec §4.2). Index `{ resolved: 1, createdAtUtc: -1 }`.
- **`interfaces/ikaros-discussion.interface.ts`** — přidat interface `IkarosDiscussionReport`.
- **`interfaces/ikaros-discussion-reports-repository.interface.ts`** — `IIkarosDiscussionReportsRepository`:
  `create`, `findUnresolved(skip,limit)`, `countUnresolved()`, `findById`, `markResolved(id)`.
  > `findUnresolved`/`countUnresolved` použije až provider v 3.4b — přidávám teď, ať je repo kompletní.
- **`repositories/ikaros-discussion-reports.repository.ts`** — `MongoIkarosDiscussionReportsRepository`,
  vzor dle `ikaros-discussions.repository.ts` (`toEntity`, `lean()`).

### 1.3 `User.likedDiscussionIds`

- `users/schemas/user.schema.ts` — `@Prop({ type: [String], default: [] }) likedDiscussionIds: string[];`
  (řádek vedle `favoriteDiscussionIds`).
- `users/interfaces/user.interface.ts` — `likedDiscussionIds: string[];`.
- `users/users.repository.ts` `toEntity()` — `likedDiscussionIds: (doc.likedDiscussionIds as string[]) ?? []`.
- Doplnit `likedDiscussionIds: []` do user fixtur v dotčených `*.spec.ts` (users.service.spec, account-cleanup.cron.spec) — jinak TS build padne.

---

## 2. DTO

- **`dto/report-post.dto.ts`** — `ReportPostDto { reason: string }` — `@IsString @IsNotEmpty @MaxLength(1000)`.
- **`dto/resolve-join-request.dto.ts`** — `ResolveJoinRequestDto { accept: boolean }` — `@IsBoolean`.
- **`dto/add-post.dto.ts`** — `@MaxLength(10000)` → `@MaxLength(20000)` (spec §8, HTML z RTE).

---

## 3. Service — `ikaros-discussions.service.ts`

### 3.1 `ADMIN_ROLES` — odebrat `PJ`

```ts
const ADMIN_ROLES = [UserRole.Superadmin, UserRole.Admin, UserRole.SpravceDiskuzi];
```

⚠️ Změna oprávnění — `isAdmin()` přestane platit pro PJ. Promítne se i do testů, kde PJ figuruje.

### 3.2 Nové metody

| Metoda | Logika |
|---|---|
| `toggleLike(discussionId, userId)` | načti usera → `likedDiscussionIds` toggle; `repo.adjustLikeCount(id, ±1)`; vrať `{ isLiked, likeCount }` |
| `addManager(id, targetUserId, requesterId, role, username)` | jen creator + admin (`assertCreatorOrAdmin`); idempotentně do `managerIds`; notifikace novému manažerovi |
| `removeManager(id, targetUserId, requesterId, role, username)` | jen creator + admin; creatora odebrat nelze (`BadRequestException`); odebrat z `managerIds` |
| `requestJoin(id, userId, username)` | jen `isOpen === false`; pokud už creator/manažer/pozvaný/žadatel → no-op; jinak push do `joinRequestIds` + notifikace manažerům |
| `resolveJoinRequest(id, targetUserId, accept, requesterId, role, username)` | `isManagerOrAdmin`; odebrat z `joinRequestIds`; `accept` → push do `invitedUserIds`; notifikace žadateli |
| `reportPost(discussionId, postId, reason, reporterId, reporterName)` | discussion + post musí existovat; reporter musí mít přístup (`canAccessDiscussion`); vytvoř `IkarosDiscussionReport` (snapshot `content`, `authorName`, `title`); notifikace SpravceDiskuzi |

- Nový privátní helper `assertCreatorOrAdmin(discussion, userId, role, username)` — `creatorId === userId || isAdmin`.
- Notifikace manažerům: nová privátní metoda `notifyManagers(discussion, subject, body)` — iteruje `managerIds`, lookup uživatele, `notifyUser`. (Creator je vždy v `managerIds`.)
- Konstruktor: přidat `@Inject('IIkarosDiscussionReportsRepository')`.

### 3.3 Repository — `ikaros-discussions.repository.ts`

Přidat metodu `adjustLikeCount(id: string, delta: number): Promise<IkarosDiscussion | null>`
přes `findByIdAndUpdate(id, { $inc: { likeCount: delta } }, { new: true })` — atomický čítač (spec §5).
Doplnit do `IIkarosDiscussionsRepository`.

> 🔀 **Alternativa:** `postCount` se dnes počítá read-then-write (race-prone). Mohl bych to sjednotit
> a převést i `postCount` na `$inc`. Mimo rozsah 3.4a — navrhuji jako dluh `D-NEW-postcount-race`.

---

## 4. Controller — `ikaros-discussions.controller.ts`

Nové endpointy (vše pod `@UseGuards(JwtAuthGuard)`):

```
POST   /ikaros-discussions/:id/toggle-like
POST   /ikaros-discussions/:id/managers/:userId
DELETE /ikaros-discussions/:id/managers/:userId          @HttpCode(204)
POST   /ikaros-discussions/:id/join-request
POST   /ikaros-discussions/:id/join-request/:userId/resolve   body ResolveJoinRequestDto
POST   /ikaros-discussions/:id/posts/:postId/report           body ReportPostDto
```

Vzor stávajících handlerů (`@CurrentUser()`, delegace na service).

---

## 5. Module — `ikaros-discussions.module.ts`

- `MongooseModule.forFeature` — přidat `IkarosDiscussionReportSchemaClass`.
- `providers` — přidat `{ provide: 'IIkarosDiscussionReportsRepository', useClass: MongoIkarosDiscussionReportsRepository }`.

---

## 6. Testy — `ikaros-discussions.service.spec.ts` (+ nový repo spec)

- `toggleLike` — like → unlike, `likeCount` ±1.
- `addManager` / `removeManager` — gating (creator/admin ano, cizí ne), creatora nelze odebrat.
- `requestJoin` — jen uzamčená; no-op když už má přístup; push do `joinRequestIds`.
- `resolveJoinRequest` — accept → `invitedUserIds`, reject → jen odebrání; gating manažer.
- `reportPost` — vytvoří report se snapshotem; 404 na neexistující post/diskuzi; přístup reportera.
- `ADMIN_ROLES` — PJ už **není** admin (úprava stávajících PJ testů).
- Nový `ikaros-discussion-reports.repository.spec.ts` — `create` / `findUnresolved` / `markResolved` / `countUnresolved` (vzor `ikaros-discussions.repository.spec.ts`).

Cíl 3.4a: **~+25 BE testů**.

---

## 7. Pořadí práce

1. Datová vrstva — schema/interface `joinRequestIds`, report collection (schema + interface + repo + repo-interface), `User.likedDiscussionIds` + fixtury.
2. Module — registrace report schema + repo.
3. DTO — `report-post`, `resolve-join-request`, `add-post` limit.
4. Repository — `adjustLikeCount`.
5. Service — `ADMIN_ROLES`, 6 nových metod + helpery.
6. Controller — 6 endpointů.
7. Testy → `npm run test` + `npm run build` (TS) v `Projekt-ikaros/backend`.

---

## 8. Mimo rozsah 3.4a

- Providery (`DiscussionReview/Report/Join`) + enum `discussion_pending_review` + FE renderery → **3.4b**.
- Recenze (`text?` v ratings) → **3.4f**.
- Jakýkoli FE → 3.4c+.

## 9. Otevřené body

- **D-NEW-html-sanitization** — preexistující dluh (spec §8), eviduji.
- **D-NEW-postcount-race** — `postCount` read-then-write; navrhuji evidovat jako dluh (§3.3).
