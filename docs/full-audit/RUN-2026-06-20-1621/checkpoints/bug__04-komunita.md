# bug / 04-komunita — checkpoint RUN-2026-06-20-1621

## Pokrytí

**BE soubory přečteny:**
- `ikaros-articles/ikaros-articles.service.ts` + `ikaros-articles.controller.ts`
- `ikaros-articles/ikaros-articles.service.spec.ts` (parcial)
- `ikaros-gallery/ikaros-gallery.service.ts` + `ikaros-gallery.controller.ts`
- `ikaros-gallery/ikaros-gallery.service.spec.ts` (parcial)
- `ikaros-gallery/gallery-categories.controller.ts`
- `ikaros-discussions/ikaros-discussions.service.ts` + `ikaros-discussions.controller.ts`
- `ikaros-discussions/ikaros-discussions.service.spec.ts` (addPost sekce)
- `ikaros-news/ikaros-news.service.ts` + `ikaros-news.controller.ts`
- `ikaros-events/ikaros-events.service.ts` + `ikaros-events.controller.ts`
- `ikaros-categories/ikaros-categories.controller.ts`

**FE soubory přečteny:**
- `ArticleDetailPage.tsx`, `ArticleEditorPage` (přes cross-ref grep)
- `DiscussionsPage.tsx`, `DiscussionDetailPage.tsx`
- `GalleryUploadPage.tsx`, `GalleryDetailPage.tsx` (struct)
- `FavoritesPage.tsx`
- `NovinkyPage/NovinkyPage.tsx`
- `AkcePage/AkcePage.tsx`
- `HelpPage/HelpPage.tsx` (jmen sekce, struct)
- `TermsPage.tsx` (struct)

**Osy / M-metody:**
- M1 (statické čtení kódu): všechny osy A–E
- M4 (auth gating): A:KM-01..15, B:KM-39..41, C:KM-50..55, D:KM-74..79, D:KM-85..86, E:KM-100..105
- M2 (kontrakt FE↔BE): KM-27..33, KM-45..47, KM-71..73, KM-82..84, KM-96..99
- M3 (testy): `addPost` sekce diskuze spec ověřena

## Dosažená L vs cílová L

**L2 / L_cílová: L3** — strukturální ověření (čtení kódu + cross-ref BE↔FE), bez spuštěných testů.
Oblast je velká a bez živé DB; auth-gating logika ověřena staticky (kód čitelný, role jasné).
Proof-requesty pro L3 níže.

## Nálezy

### N-RUN-01 — [C/addPost] Uzamčená diskuze: libovolný auth user může přidat příspěvek
- **Kde:** `backend/.../ikaros-discussions/ikaros-discussions.service.ts:496-522`
- **Popis:** `addPost()` ověřuje pouze `discussion.isApproved`, ale NEVOLÁ `canAccessDiscussion()`. Pro uzamčenou diskuzi (`isOpen=false`) tak může libovolný přihlášený uživatel, který není `creatorId`, `managerIds` ani `invitedUserIds`, přidat příspěvek přes `POST /ikaros-discussions/:id/posts`.
- **Kontrast:** `getPosts()` na řádku 483 stejný `canAccessDiscussion` check volá.
- **Test:** `service.spec.ts` addPost sekce (ř. 361–379) žádný locked+non-member test nemá.
- **Dopad:** 🔴 Porušení přístupu — uzamčená diskuze nedrží svou sémantiku; neoprávněný user zapisuje.
- **Návrh:** přidat check `if (!this.canAccessDiscussion(discussion, authorId, role, username))` před uložením (signature addPost rozšířit o role/username, nebo vynechat pro admina)
- **L2** · **🆕 nový**

### N-RUN-02 — [C/Moje tab] FE filtr diskuzí „Moje" ignoruje pozvané uživatele
- **Kde:** `FE src/features/ikaros/pages/DiscussionsPage.tsx:24-29`
- **Popis:** Tab „Moje" filtruje: `d.creatorId === user.id || d.managerIds.includes(user.id)`. Chybí `|| d.invitedUserIds.includes(user.id)`. Uživatel pozvaný do uzamčené diskuze ji v tabu „Moje" neuvidí — musí ji dohledat v Přehledu.
- **Dopad:** 🟡 UX — funkčně nenabourává přístup, ale uživatel nevidí „své" diskuze kde má přístup pozvánkou.
- **Pozn.:** Plan KM-73 `[human]` — odhaleno staticky.
- **L1** · **🔓 otevřený** (bylo [human] v plánu, potvrzeno staticky)

### N-RUN-03 — [A/KM-30] MarkAsReadObserver volá markRead i pro přihlášeného admina na Pending článek
- **Kde:** `FE src/features/ikaros/pages/ArticleDetailPage.tsx:416-466`
- **Popis:** Podmínka `if (!user || article.status !== 'Published' || readStatus?.read) return;` správně stráží — ne-Published → early return. ✅ KM-30 je OK.
- **Poznámka:** toto je POTVRZENÍ správnosti, ne nález.

### N-RUN-04 — [E/KM-99] FE FavoritesPage pinDisabled: MAX_PINNED na FE = 5, shoduje se s BE
- **Kde:** `FE src/features/ikaros/pages/FavoritesPage.tsx:37,178`
- **Popis:** `const MAX_PINNED = 5` odpovídá BE `ikaros-articles.service.ts:37` i gallery/discussions. Podmínka `pinned.length >= MAX_PINNED && !isPinned` je správná. ✅ KM-99 OK.

### N-RUN-05 — [D/KM-89] Events `findUpcoming` ořezávání limitu: `parseLimit` max = 20
- **Kde:** `backend/.../ikaros-events/ikaros-events.controller.ts:34-38`
- **Popis:** `parseLimit` ořezává na `Math.min(n, 20)`, takže `?limit=25` → 20. ✅ KM-89 sedí.

### N-RUN-06 — [D/KM-78] News `?limit=200` ořezán na 100
- **Kde:** `backend/.../ikaros-news/ikaros-news.controller.ts:117`
- **Popis:** `parsePositiveInt(limitStr, { max: 100 })` ořezává na 100. ✅ KM-78 sedí.

### N-RUN-07 — [A/KM-08] Update článku gating: admin (SpravceClanku) NEMŮŽE editovat cizí artikel
- **Kde:** `backend/.../ikaros-articles/ikaros-articles.service.ts:294-298`
- **Popis:** `update()` kontroluje `article.authorId !== userId` → 403 BEZ výjimky pro admina. Admin musí artikel schválit/odmítnout, ale nemůže ho editovat. ✅ KM-08 OK (jiný uživatel = 403 bez ohledu na roli). Záměrné.

### N-RUN-08 — [B/KM-47] GalleryUploadPage edit mód skryje file picker — ověřeno
- **Kde:** `FE src/features/ikaros/pages/GalleryUploadPage.tsx:130-136,152-155`
- **Popis:** Edit mód: `!isEdit && (...)` podmínka skryje tlačítko „Změnit soubor"; `<input type="file">` zůstane v DOM (kvůli `ref`), ale není přístupný. Navíc `isEdit && (<p>Soubor... nelze vyměnit</p>)` zobrazí hint. ✅ KM-47 OK.

### N-RUN-09 — [C/addPost-access-sig] `addPost` controller neposílá role/username do service
- **Kde:** `backend/.../ikaros-discussions/ikaros-discussions.controller.ts:317`  
  `return this.service.addPost(id, dto.content, user.id, user.username);`
- **Popis:** `addPost` service signature bere jen `authorId, authorName` (bez `role`/`username`). Fix N-RUN-01 vyžaduje rozšíření signatury nebo extrakci check na controller úrovni.
- **Dopad:** implementační poznámka k N-RUN-01 (ne samostatný nález)

### N-RUN-10 — [A/KM-32] FE nemá `useArticleVersions` hook (dokumentovaný coverage gap)
- **Kde:** BE `ikaros-articles.controller.ts:111-119` má `GET :id/versions`, FE hook `useArticleVersions` neexistuje
- **Popis:** Funkce verzí na FE chybí — uživatel nemůže procházet historii revizí. Plánem označeno jako coverage gap, není bug, ale FE feature stub.
- **Dopad:** 🟡 Chybějící funkce (BE má endpoint, FE ho nevyužívá)
- **L1** · **🔓 otevřený** (dokumentovaný v coverage gaps)

### N-RUN-11 — [B/KM-48] Gallery kategorie DELETE: je jen Superadmin (OK), ale `assertAdmin` pro POST/PATCH = Admin+
- **Kde:** `backend/.../ikaros-gallery/gallery-categories.controller.ts:85-92`
- **Popis:** `DELETE /gallery-categories/:key` → `if (user.role !== UserRole.Superadmin)` = 403. Plan KM-48 říká `DELETE od Admin (ne Superadmin) vrátí 403` — ✅ sedí (Admin ≠ Superadmin → 403).

### N-RUN-12 — [A/KM-19+KM-20] Mark-read pro ne-Published: BE vrátí 400 ARTICLE_NOT_PUBLISHED
- **Kde:** `backend/.../ikaros-articles/ikaros-articles.service.ts:580-587`
- **Popis:** `markRead` kontroluje `article.status !== 'Published'` → 400. ✅ KM-21 (idempotent — `upsertRead` je idempotent). ✅ KM-20 sedí.

### N-RUN-13 — [D/KM-80] Archive novinky idempotent: `setArchived(id, true, userId)` — závisí na repozitáři
- **Kde:** `backend/.../ikaros-news/ikaros-news.service.ts:193`
- **Popis:** `service.archive()` volá `repo.setArchived(id, true, userId)`. Idempotence závisí na implementaci `setArchived` — pokud repozitář dělá `findByIdAndUpdate({archived:true})`, je to idempotentní. L1 — bez čtení repo kódu.
- **PROOF-REQUEST:** spustit `npx jest ikaros-news.service.spec.ts` + ověřit test na idempotentní archivaci.

### N-RUN-14 — [A/FE-KM-31] ArticleDetailPage REVIEWER_ROLES = [Superadmin, Admin, SpravceClanku] ✅ sjednoceno s BE
- **Kde:** `FE src/features/ikaros/pages/ArticleDetailPage.tsx:36-40`
- **Popis:** N-14 byl opraven — PJ odstraněn. FE i BE shodné ADMIN_ROLES. ✅ sjednoceno.

## PROOF-REQUEST

1. **N-RUN-01 (kritický):** `npx jest --maxWorkers=2 ikaros-discussions.service.spec` — přidat test: locked discussion + non-member user volá `addPost` → měl by dostat 403. Bez testu je access gap potvrzená jen staticky (L2).

2. **N-RUN-13:** `npx jest --maxWorkers=2 ikaros-news.service.spec` — ověřit existenci testu pro idempotentní archivaci (double-archive). Pokud test chybí, gap pro KM-80.

3. **KM-03 (search):** `npx jest --maxWorkers=2 ikaros-articles` — search endpoint pokrytí; ověřit že `searchPublished`/`searchPublishedAndPending` existují a mají test.

4. **KM-51 (diskuze filter):** L3 vyžaduje test: přihlášený uživatel bez přístupu k uzamčené diskuzi dostane ze `findAll` prázdný výsledek nebo ji nevidí.
