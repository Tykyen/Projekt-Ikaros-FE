# Spec 3.4 — Ikaros diskuze (`/ikaros/diskuze`)

**Status:** ✅ Hotovo (2026-05-15) — všechny sub-fáze 3.4a–f implementovány
**Rozsah:** FE (3 stránky + vlákno + 3 renderery) + BE (rozšíření modulu `ikaros-discussions`, 3 providery, report collection)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (backend)
**Velikost:** velká — rozdělena do **5 sub-fází** (3.4a–e), každá vlastní plán + PR
**Autor:** PJ + Claude
**Datum:** 2026-05-15
**Souvisí:**
- [spec-3.3.md](spec-3.3.md) — galerie: vzor brownfield workflow, provider, renderer, sub-fáze
- [spec-3.2.md](spec-3.2.md) — články: RichTextEditor, `RejectReasonModal`, `discussion link` follow-up
- [spec-1.4.md](../phase-1/spec-1.4.md) — Zpracovat tab infra (`IPendingActionProvider`)

---

## 1. Cíl

Postavit **modul diskuzí** na Ikaros platformě:

- **Přehled** (`/ikaros/diskuze`) — seznam schválených diskuzí, hledání, řazení (aktivita / nové / oblíbené), taby Přehled / Moje.
- **Detail / vlákno** (`/ikaros/diskuze/:id`) — hlavička diskuze (název, popis, vývěska), stránkované vlákno příspěvků, formulář nového příspěvku.
- **Vytvoření** (`/ikaros/diskuze/nova`) — název, popis, otevřená/uzamčená.
- **Manageři a pozvánky** — creator/manažer spravuje manažery a zve uživatele do uzamčené diskuze.
- **Žádost o přidání** do uzamčené diskuze → queue `discussion_join_request` (řeší manažer diskuze).
- **Hlášení příspěvků** → queue `discussion_report` (řeší SpravceDiskuzi/Admin).
- **Schvalování nových diskuzí** → queue `discussion_pending_review` (řeší SpravceDiskuzi/Admin) — *nově, viz §13/R2*.
- **Like diskuze** — toggle, počítadlo `likeCount` — *nově, viz §13/R3*.
- **Recenze obsahu** — články (3.2) i obrázky (3.3) dostanou textové recenze: stávající hodnocení 1–5★ rozšířené o volitelný text. Sekce recenzí na detailu článku i obrázku (R5, sub-fáze 3.4f).

> 📌 **Diskuze ≠ recenze.** Diskuze = samostatné téma — vytvoříš téma (název + popis) a na něj se vede vlákno příspěvků; nezávislý objekt. Recenze = hodnocení *konkrétního článku/obrázku* (hvězdy + text), žije v modulu toho obsahu, ne v Diskuzích.

Vše funguje na 21 vizuálních skinech (skin-agnostic CSS tokens) a na mobilu i desktopu.

---

## 2. Kontext / motivace

- Roadmap 3.4: „Seznam diskuzí, `/:id` vlákno; manageři, pozvánky; hlášené příspěvky `discussion_report`; žádost o přidání `discussion_join_request`; sekce Diskuze o článku."
- **Brownfield** — BE modul `ikaros-discussions` už existuje (jako galerie 3.3), je registrovaný a otestovaný. 3.4a ho rozšiřuje.
- Diskuze = konverzační dvojče modulu Článků. Workflow schvalování, provider pattern, `RejectReasonModal`, RichTextEditor — vše se přebírá.
- Cíl: 3.4 bez nedodělků.

---

## 3. Audit současného stavu

> **POZOR — brownfield.** BE modul `ikaros-discussions` **už existuje, je registrovaný v `app.module.ts` a funkční** (vč. `*.service.spec.ts`, `*.repository.spec.ts`). Vznikl dřívějším krokem feature-parity. 3.4a **rozšiřuje** existující modul.

### 3.1 BE — co modul `ikaros-discussions` UMÍ

- Prefix `/ikaros-discussions`, collections `ikaros_discussions` + `ikaros_discussion_posts`.
- Endpointy: `GET /` (list), `GET /pending`, `GET /my-favorites`, `GET /:id`, `POST /` (create), `PATCH /:id`, `POST /:id/approve`, `POST /:id/reject`, `POST /:id/invite`, `POST /:id/toggle-favorite`, `GET /:id/posts` (stránkované), `POST /:id/posts`, `DELETE /:id/posts/:postId`.
- Workflow: create → `isApproved` (admin = auto-schválení, jinak `false`) → approve / reject (reject m=smaže diskuzi + posty + notifikace tvůrci).
- `isOpen` (otevřená / uzamčená), `managerIds`, `invitedUserIds`, `bulletin` (vývěska), `postCount`, `lastActivityUtc`.
- Přístup: admin vidí vše; ostatní jen schválené; uzamčenou jen creator/manažer/pozvaný.
- Notifikace (nová diskuze / approve / reject / invite) přes interní zprávy `ikaros-messages`.
- `ADMIN_ROLES = [Superadmin, Admin, PJ, SpravceDiskuzi]` + výjimka `username === 'Tyky'`.

### 3.2 BE — co modulům CHYBÍ

| # | Modul | Chybí | Řešení |
|---|---|---|---|
| C1 | discussions | Hlášení příspěvků | 3.4a — collection `ikaros_discussion_reports`, endpoint `POST /:id/posts/:postId/report`; 3.4b — `DiscussionReportProvider` |
| C2 | discussions | Žádost o přidání do uzamčené diskuze | 3.4a — pole `joinRequestIds`, endpointy `POST /:id/join-request` + `POST /:id/join-request/:userId/resolve`; 3.4b — `DiscussionJoinProvider` |
| C3 | discussions | Správa manažerů | 3.4a — `POST /:id/managers/:userId` + `DELETE /:id/managers/:userId` (creator + admin) |
| C4 | discussions | Schvalování přes Zpracovat tab | 3.4b — `DiscussionReviewProvider` (`discussion_pending_review`) — viz R2 |
| C5 | discussions | Like diskuze | 3.4a — endpoint `POST /:id/toggle-like` + collection-level evidence — viz R3 |
| C6 | discussions | `ADMIN_ROLES` obsahuje `PJ` | 3.4a — odebrat (diskuze = platformový obsah, PJ je world-scoped — memory pravidlo) |
| C7 | discussions | `AddPostDto.content` limit 10000 (krátký pro HTML z RTE) | 3.4a — zvednout na ~20000; bez server-side sanitizace (model §8) |
| C8 | articles + gallery | Hodnocení 1–5★ bez textu | 3.4f — `ArticleRatingSchema`/`GalleryRatingSchema` rozšířit o `text?`; rate DTO o `text?` — viz §11 |

> ⚠️ **Nesrovnalost (likeCount):** schema má `likeCount`, žádný endpoint ho nemění → mrtvé pole. Rozhodnuto (R3): implementovat toggle-like.
> ⚠️ **Nesrovnalost (PendingActionType):** enum `discussion_pending_review` zatím neexistuje — přidá ho R2.

### 3.3 FE — co existuje

- Stuby [DiscussionsPage.tsx](../../../src/features/ikaros/pages/DiscussionsPage.tsx), [DiscussionsNewPage.tsx](../../../src/features/ikaros/pages/DiscussionsNewPage.tsx).
- Routy `ikaros/diskuze`, `ikaros/diskuze/nova` (chybí `:id` detail).
- Vzor: modul galerie/článků v `src/features/ikaros/` — `api/useGallery.ts`, `RejectReasonModal`, `RatingStars`, `formatRelativePast`.
- `PENDING_ACTION_RENDERERS` registry v `src/features/users/components/tabs/ZpracovatTab/rendererRegistry.tsx`.
- `RichTextEditor` (TipTap) z 3.2 — používá `ArticleEditorPage`.

---

## 4. Datový model

### 4.1 Collection `ikaros_discussions` (rozšíření existující)

Existující pole zůstávají. 3.4a **přidává**:

```
IkarosDiscussion
  …existující (title, description, bulletin, creatorId/Name, isApproved,
    isOpen, managerIds, invitedUserIds, postCount, likeCount,
    createdAtUtc, lastActivityUtc)
  joinRequestIds   string[]   + NOVÉ   userId čekající na přijetí do uzamčené diskuze
```

Migrace starých dokumentů: `joinRequestIds` default `[]`. Diskuze **nemá vazbu na článek/obrázek** — je to samostatné téma (R5).

### 4.2 Collection `ikaros_discussion_reports` (nová)

```
IkarosDiscussionReport
  id            string
  discussionId  string
  discussionTitle string                denormalizováno (pro renderer)
  postId        string
  postContentSnapshot string             obsah v době nahlášení (post může být smazán)
  postAuthorName string
  reporterId    string
  reporterName  string
  reason        string                   povinný, max 1000
  createdAtUtc  Date
  resolved      boolean    default false
```

Index `(resolved, createdAtUtc DESC)`. Reporty se nemažou — po vyřízení `resolved: true` (audit stopa).

### 4.3 Like diskuze (R3)

Aby `likeCount` nešlo zneužít opakovaným klikem, je potřeba evidence kdo lajkoval.
**Rozhodnutí:** pole `User.likedDiscussionIds: string[]` (zrcadlí `favoriteDiscussionIds`). `likeCount` zůstává denormalizovaný čítač na diskuzi.

---

## 5. API — modul `ikaros-discussions`

Stávající endpointy zůstávají. **Nové / změněné:**

```
POST   /ikaros-discussions/:id/toggle-like                  + NOVÝ (C5) → { isLiked, likeCount }
POST   /ikaros-discussions/:id/managers/:userId             + NOVÝ (C3) — creator + admin
DELETE /ikaros-discussions/:id/managers/:userId             + NOVÝ (C3) — creator + admin
POST   /ikaros-discussions/:id/join-request                 + NOVÝ (C2) — přihlášený, uzamčená diskuze
POST   /ikaros-discussions/:id/join-request/:userId/resolve + NOVÝ (C2) — manažer, { accept: boolean }
POST   /ikaros-discussions/:id/posts/:postId/report         + NOVÝ (C1) — přihlášený, { reason }
```

> Recenze (3.4f) **nejsou** endpointy tohoto modulu — rozšiřují `POST /ikaros-articles/:id/rate` a `POST /ikaros-gallery/:id/rate`, viz §11.

Sémantika:
- **toggle-like** — přidá/odebere `discussionId` z `User.likedDiscussionIds`, atomicky `$inc` `likeCount`.
- **managers** — `POST` přidá userId do `managerIds` (idempotentně), `DELETE` odebere; creatora nelze odebrat. Notifikace novému manažerovi.
- **join-request** — jen pro `isOpen: false`. Přidá `userId` do `joinRequestIds`. Idempotentní (už pozvaný / už žádá → no-op). Notifikace manažerům.
- **join-request/resolve** — manažer: `accept` → přesun do `invitedUserIds`, jinak jen odebere z `joinRequestIds`. Notifikace žadateli.
- **report** — vytvoří `IkarosDiscussionReport`; notifikace SpravceDiskuzi.

> 💡 **Proč denormalizace** (`discussionTitle`, `postContentSnapshot`): renderer ve Zpracovat tabu nesmí dělat join přes víc collections. Zápis je vzácný, čtení časté.

---

## 6. Role a oprávnění

Diskuze je **platformový obsah** → jen globální role, **bez world-scoped PJ** (C6, memory pravidlo).

| Akce | Kdo |
|---|---|
| Číst schválené / otevřené diskuze | každý přihlášený |
| Číst uzamčenou diskuzi + příspěvky | creator / manažer / pozvaný / admin |
| Vytvořit diskuzi, psát příspěvky | každý přihlášený (do diskuze, kam má přístup) |
| Žádat o přidání do uzamčené | každý přihlášený |
| Hlásit příspěvek | každý přihlášený |
| Editovat diskuzi, zvát, řešit join-requesty, spravovat manažery | creator / manažer (manažery jen creator+admin) |
| Mazat příspěvky | autor příspěvku / manažer / admin |
| Schvalovat / zamítat diskuze, řešit reporty | `Superadmin`, `Admin`, `SpravceDiskuzi` |

- `DiscussionReviewProvider.canHandle()` / `DiscussionReportProvider.canHandle()` → `true` pro `[Superadmin, Admin, SpravceDiskuzi]`.
- `DiscussionJoinProvider.canHandle()` → DB lookup: `true` pokud je uživatel manažerem ≥1 diskuze s čekajícím join-requestem (per-user, ne per-role).

---

## 7. Pending actions integrace (3.4b)

Tři queue typy. Enum `PendingActionType` rozšířen o `DiscussionPendingReview = 'discussion_pending_review'` (R2; `DiscussionReport`, `DiscussionJoinRequest` už existují).

### 7.1 `discussion_pending_review` — schvalování diskuzí

- **BE:** `DiscussionReviewProvider`, queue = neschválené diskuze. `listForUser` → `findPending()`.
- `DiscussionReviewListItem`: `{ discussionId, title, descriptionExcerpt, creatorId, creatorName, submittedAt }`.
- **FE:** `DiscussionReviewRenderer` — Left: ikona diskuze; Mid: název (link) + autor + čas; Actions: „Schválit" + „Vrátit s poznámkou" (`RejectReasonModal` reuse).
- `GROUP_TITLES[DiscussionPendingReview] = 'Diskuze ke schválení'`.

### 7.2 `discussion_report` — hlášené příspěvky

- **BE:** `DiscussionReportProvider`, queue = `ikaros_discussion_reports` kde `resolved: false`.
- `DiscussionReportListItem`: `{ reportId, discussionId, discussionTitle, postId, postContentSnapshot, postAuthorName, reporterName, reason, createdAt }`.
- Resoluce: „Smazat příspěvek" (smaže post + `resolved: true`) / „Ponechat" (jen `resolved: true`).
- **FE:** `DiscussionReportRenderer` — Mid: nahlášený obsah + důvod + kdo nahlásil; Actions: 2 tlačítka.
- `GROUP_TITLES[DiscussionReport] = 'Nahlášené příspěvky'`.

### 7.3 `discussion_join_request` — žádosti o přidání

- **BE:** `DiscussionJoinProvider`, `listForUser` filtruje diskuze, kde je uživatel manažer, a vrací jejich `joinRequestIds`.
- `DiscussionJoinRequestListItem`: `{ discussionId, discussionTitle, userId, username, requestedAt }`.
- **FE:** `DiscussionJoinRequestRenderer` — Left: avatar žadatele; Mid: jméno + název diskuze; Actions: „Přijmout" / „Odmítnout".
- `GROUP_TITLES[DiscussionJoinRequest] = 'Žádosti o přidání do diskuze'`.

---

## 8. Příspěvky — RichTextEditor (R1)

- `content` příspěvku = HTML z `RichTextEditor` (TipTap), shodně s články 3.2.
- **Bezpečnostní model (převzato z článků):** BE HTML **nesanitizuje** — důvěřuje TipTapu. Zápis i čtení jdou přes TipTap, jehož schema nezná `<script>` apod.; cokoli mimo schema TipTap při re-parse zahodí. Render proto **vždy přes `<RichTextEditor readOnly>`**, nikdy `dangerouslySetInnerHTML`.
- **BE:** `AddPostDto.content` max zvednut z 10000 na ~20000 (HTML je delší než plain text). Žádná schema změna, žádný server-side sanitizér.
- **FE:** formulář příspěvku používá `<RichTextEditor>` bez `onImageUpload` (příspěvky bez obrázků v 3.4 — viz §14), render přes `<RichTextEditor readOnly>`.
- Vlákno: každý příspěvek = karta (avatar autora, jméno, čas, obsah, tlačítka Smazat/Nahlásit dle oprávnění).

> ⚠️ **Dluh `D-NEW-html-sanitization` (preexistující):** absence server-side sanitizace HTML v článcích i diskuzích je implicitní spoléhání na klienta — kdo obejde FE a POSTne `<script>` přímo na API, uloží ho (render ho ale zahodí). Není to nedodělek 3.4 — dědíme z 3.2. Eviduji jako dluh.

---

## 9. Vizuální směr

Diskuze = **konverzační vlákno**. Žádný nový samostatný „směr" jako Salon u galerie — reuse existující tokeny (`--card-*`, `--prose-*`, `--text-muted`, `--role-spravce-diskuzi-*`).

- **Seznam** — řádky/karty diskuzí: název, úryvek popisu, `postCount` + `lastActivityUtc` + `likeCount`, badge zámku u uzamčených, hvězdička oblíbené.
- **Vlákno** — střídmé karty příspěvků, vlastní příspěvek decentně odlišen, sticky formulář dole.
- **Hlavička diskuze** — název, popis, vývěska (`bulletin`) jako zvýrazněný blok, je-li vyplněná.
- Nové tokeny jen pokud nutné (`--disc-*`), s fallbackem na existující. Řeší se v design auditu (frontend-design skill mezi spec a plánem) — viz memory pravidlo.

---

## 10. FE struktura

```
src/features/ikaros/
  pages/
    DiscussionsPage.tsx          přehled — seznam, taby, hledání, řazení
    DiscussionDetailPage.tsx     :id — hlavička + vlákno + formulář + manage panel
    DiscussionsNewPage.tsx       /nova — vytvoření
  components/
    DiscussionCard.tsx           řádek diskuze v seznamu
    DiscussionPost.tsx           karta příspěvku ve vlákně
    DiscussionManagePanel.tsx    manažeři, pozvánky, join-requesty, zámek
    ReportPostModal.tsx          modal „Nahlásit příspěvek" (důvod)
    DiscussionReviewRenderer.tsx       Zpracovat sloty
    DiscussionReportRenderer.tsx       Zpracovat sloty
    DiscussionJoinRequestRenderer.tsx  Zpracovat sloty
  api/
    useDiscussions.ts            React Query — CRUD, workflow, posts, like, managers, join, report
  lib/
    discussions.ts               filterDiscussions(), sort helpers, accessLabel
```

Routing v `src/app/router.tsx` (IkarosLayout children) — **pořadí: `/nova` před `/:id`**:

```
ikaros/diskuze            DiscussionsPage         requireAuth
ikaros/diskuze/nova       DiscussionsNewPage      requireAuth
ikaros/diskuze/:id        DiscussionDetailPage    requireAuth
```

> ⚠️ Diskuze jsou **logged-in only** (na rozdíl od článků/galerie). Anonym nevidí — odpovídá konverzačnímu charakteru a oprávnění §6.

---

## 11. Recenze obsahu (3.4f)

> Roadmap-položka „Diskuze o článku" se po upřesnění (R5) ukázala jako **recenze**, ne diskuze. Není to feature Diskuze modulu — je to **rozšíření hodnocení** v modulech `ikaros-articles` (3.2) a `ikaros-gallery` (3.3). Diskuze (témata) a recenze (hodnocení obsahu) jsou dva oddělené mechanismy.

**Model:** recenze = stávající hvězdičkové hodnocení 1–5★ + volitelný text. Jeden uživatel = jedna recenze na daný článek/obrázek (opětovné odeslání edituje), autor nemůže recenzovat vlastní obsah (stávající pravidlo).

### 11.1 BE — rozšíření hodnocení (articles + gallery)

Dnešní subdokument `ArticleRatingSchema` / `GalleryRatingSchema` je `{ userId, stars }`. 3.4f přidává:

```
Rating (subdokument ratings[])
  userId        string                  (stávající)
  stars         number  1–5             (stávající)
  userName      string   + NOVÉ          denormalizováno pro výpis
  text?         string   + NOVÉ          recenzní text, max 2000, plain text
  createdAtUtc  Date     + NOVÉ
  updatedAtUtc? Date     + NOVÉ          při editaci recenze
```

- Rate endpoint `POST /ikaros-articles/:id/rate` a `POST /ikaros-gallery/:id/rate` — DTO rozšířen o `text?`. Upsert per `userId` zůstává.
- `averageRating` se počítá beze změny (jen z `stars`).
- Mazání recenze: autor recenze + schvalovací role modulu (`SpravceClanku` / `SpravceGalerie` / Admin / Superadmin).

> 🔀 **Plain text, ne RTE.** Recenze je krátký názor, ne článek — `RichTextEditor` by byl těžkotonážní. Příspěvky v Diskuzích RTE mají (R1), recenze ne. Pokud chceš sjednotit, řekni.

### 11.2 FE — sekce „Recenze"

- Na [ArticleDetailPage.tsx](../../../src/features/ikaros/pages/ArticleDetailPage.tsx) i `GalleryDetailPage.tsx` sekce **„Recenze"**:
  - Formulář — `RatingStars` (výběr) + textarea; je-li uživatel už recenzoval, formulář předvyplněn (edit režim).
  - Seznam recenzí — avatar, jméno, hvězdy, text, čas; vlastní recenze nahoře s tlačítky Upravit/Smazat.
- Reuse `RatingStars`; existující souhrn (průměr + distribuce) zůstává nad seznamem.

---

## 12. Sub-fáze

> **Sloučení 3.4a+3.4b** (rozhodnuto 2026-05-15, PJ — „sluč a aplikuj"): provider z 3.4b
> potřebuje endpointy z 3.4a, proto se obě sub-fáze udělaly jedním BE+FE balíkem.

| Sub | Rozsah | PR |
|---|---|---|
| **3.4a+b** ✅ | BE — rozšířit modul `ikaros-discussions`: pole `joinRequestIds`, collection `ikaros_discussion_reports`, endpointy toggle-like / managers / join-request / report / resolve-report, `AddPostDto` limit, PJ pryč z `ADMIN_ROLES`, `User.likedDiscussionIds`; `DiscussionReview/Report/Join` providery + enum `discussion_pending_review` + registrace. FE — 3 renderery do `PENDING_ACTION_RENDERERS`, `GROUP_TITLES`, `useDiscussions` (workflow hooky), sdílené typy. | BE+FE ✅ |
| **3.4c** ✅ | FE — `DiscussionsPage` (seznam, taby, hledání, řazení), `DiscussionsNewPage`, `useDiscussions`, `lib/discussions`, routing (diskuze logged-in only) | FE ✅ |
| **3.4d** ✅ | FE — `DiscussionDetailPage` (vlákno, RTE formulář, like/oblíbené, admin schválení), `DiscussionManagePanel` (zámek, vývěska, správci, pozvánky, žádosti), hlášení přes `RejectReasonModal`. BE — `GET /users/lookup` (picker), `GET /ikaros-discussions/:id/members` | BE+FE ✅ |
| **3.4e** ✅ | `napoveda` (ručně — diskuze 🚧→✅, FAQ, StartSection), `mobil-desktop` (responsivní CSS + 44px touch targety napříč) | FE ✅ |
| **3.4f** ✅ | Recenze (§11) — BE rozšíření hodnocení `ikaros-articles` + `ikaros-gallery` o `text`/`userName`/`createdAtUtc`; FE sdílená `ReviewsSection` na obou detailech | BE+FE ✅ |

> **Pozn. k 3.4f:** rating subdokument dostal `createdAtUtc` (= čas posledního odeslání recenze), `updatedAtUtc` z §11.1 vynechán — `upsertRating` dělá full-replace, samostatný „vytvořeno vs. upraveno" by vyžadoval čtení původního záznamu; pro recenzi zbytečné.

---

## 13. Testy

- **BE:** nové endpointy (toggle-like, managers, join-request lifecycle, report), 3 providery (`canHandle`/`count`/`list`), join-request gating (jen uzamčená), report resoluce, HTML sanitizace; recenze — rate s `text?`, edit/mazání recenze (3.4f). Cíl ~+45.
- **FE:** seznam render + filtr/řazení, vlákno + stránkování, RTE formulář, like toggle, manage panel, 3 renderery; sekce Recenze na obou detailech (3.4f). Cíl ~+32.

---

## 14. Mimo rozsah

- Obrázky v příspěvcích → budoucí fáze (3.4 příspěvky jen text/formátování).
- Reakce / vlákna odpovědí (reply na příspěvek) → budoucí fáze (3.4 = ploché vlákno).
- Reálná data „Oblíbené diskuze" v sidebaru → **3.7** (FE napojení), BE už hotové.
- Hromadné schvalování diskuzí → dluh (sdílí s `D-NEW-bulk-pending-articles`).
- WebSocket realtime příspěvky → fáze 4 (chat infra).

---

## 15. Rozhodnutí (2026-05-15, PJ)

1. **R1** — Obsah příspěvků = **RichTextEditor (TipTap)**, konzistence s články.
2. **R2** — Schvalování nových diskuzí **sjednoceno do Zpracovat tabu** — nový queue typ `discussion_pending_review`.
3. **R3** — Mrtvé `likeCount` → **implementovat like diskuze** (toggle-like endpoint + `User.likedDiscussionIds`).
4. **R4** — Diskuze jsou **logged-in only** — anonym nevidí ani seznam (odchylka od článků/galerie).
5. **R5** — Roadmap-položka „Diskuze o článku" = ve skutečnosti **recenze** (hvězdy + text) pod článkem **i obrázkem**. Není to Diskuze modul — rozšiřuje hodnocení v `ikaros-articles` + `ikaros-gallery`. Řeší sub-fáze **3.4f** (§11). Diskuze samotné **nemají žádnou vazbu na obsah** — jsou to samostatná témata.
6. **R6** — Reject diskuze ji **maže** (vč. postů) — ponecháno dnešní BE chování, žádný soft-status.
