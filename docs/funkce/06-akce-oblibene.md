# 06 — Akce & oblíbené

Kapitola pokrývá platformový kalendář globálních akcí a osobní záložky (oblíbené + připnuté) napříč komunitními moduly. Vše ověřeno v kódu FE i BE.

---

### Kalendář akcí platformy
- **Co to je:** Měsíční kalendář globálních (platformových, "Ikaros") akcí — minulých i budoucích. S možností potvrdit účast (RSVP).
- **Kde:** route `/ikaros/akce` (`AkcePage`). Menu: "Akce". Loader `requireAuth`.
- **Kdo:**
  - FE — jen přihlášený (loader). Tlačítko "Nová akce" a kebab (Upravit/Smazat) vidí jen **Admin/Superadmin** (`currentUser.role`).
  - BE — celý controller `ikaros-events` za `JwtAuthGuard`. Čtení = každý přihlášený; mutace (create/update/delete) = jen Admin/Superadmin (`assertCanWrite`, jinak 403 `FORBIDDEN_PLATFORM_ROLE`); RSVP = každý přihlášený.
- **Co jde dělat:**
  - **Desktop:** měsíční mřížka (`buildMonthGrid`), akce jako chip s časem v buňce dne. Listování šipkami (`shiftMonth ±1`), tlačítko "Dnes". Klik na chip → modal "Detail akce" (`IkarosEventCard`).
  - **Mobil (≤768 px):** místo mřížky seznam rozdělený "Nadcházející" / "Proběhlé" (řazený podle data).
  - **RSVP (Zúčastním se):** tlačítko na kartě (jen pokud `event.confirmable`), `POST /ikaros-events/:id/confirm` toggluje účast. Karta ukazuje počet účastníků a první 4 jména + "+N".
  - **Admin — vytvoření/úprava akce** (`IkarosEventModal`): Název (max 200, povinný), Datum a čas (`datetime-local`, povinné, ISO), Obrázek (volitelný, max 10 MB, s nastavením středu výřezu / zoom / fit cover|contain), Popis (max 5000), checkbox "Povolit potvrzení účasti" (`confirmable`, default true).
  - **Admin — smazání:** kebab → Smazat (ConfirmDialog). BE = **soft delete** (`isActive: false`).
- **Datový tvar akce (BE response):** id, title, date, description, imageUrl + image focal/zoom/fit, `confirmable`, `confirmedCount`, `confirmedBy[]` (userId+userName), `myRsvp` ('confirmed'|'none'), authorId/authorName, createdAtUtc, isActive.
- **Hranice / co neumí:**
  - Akce jsou **platformové, nikoli světové** — herní akce konkrétního světa jsou samostatný modul (`world-news` / game-events), sem se nemíchají.
  - **Žádné kapacitní limity / čekací listina** RSVP — jen toggle účasti, neomezený počet.
  - Žádná opakující se / vícedenní akce (jeden timestamp `date`, žádné `endDate`).
  - Žádné kategorie/štítky akcí, žádné připomenutí e-mailem.
  - Mřížka i mobilní seznam pracují s **lokálním časem prohlížeče** (`new Date(...).getHours()` apod.) — žádná timezone konfigurace.
  - `findUpcoming` (dashboard) má limit default 5, max 20; samotná `AkcePage` načítá `useIkarosEvents()` = `findAll` (všechny aktivní, bez stránkování).
- **Zvláštnosti:** Modal detailu drží jen `selectedId` a akci derivuje z čerstvé query (po RSVP/edit/delete se obsah otevřeného modalu obnoví — C-40). Na kartě "DNES!"/"ZÍTRA!" odznak pro akce do 24 h. WS event `ikaros-events.changed` se emituje po každé mutaci (real-time refresh).
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/AkcePage/AkcePage.tsx:29`, karta `src/features/ikaros/components/IkarosEventCard.tsx:42`, modal `src/features/ikaros/components/IkarosEventModal.tsx:35`. BE controller `backend/src/modules/ikaros-events/ikaros-events.controller.ts`, service `ikaros-events.service.ts:53` (findAll/upcoming/create/update/delete/confirm), DTO `ikaros-events/dto/create-ikaros-event.dto.ts`.

---

### Oblíbené / záložky
- **Co to je:** Osobní záložky (bookmarky) napříč třemi komunitními moduly + jejich "připnutí" do pravého panelu.
- **Kde:** route `/ikaros/oblibene` (`FavoritesPage`). Menu: "Oblíbené". Loader `requireAuth`. Tři taby v URL `?typ=` (diskuze / clanky / obrazky).
- **Kdo:** Jen přihlášený (loader). Záložky jsou čistě osobní (vázané na účet).
- **Co jde dělat:**
  - **Tab Diskuze / Články / Obrázky** — seznam položek, které máš v oblíbených.
  - **Připnutí (PinToggle, špendlík)** — přepne, zda se položka zobrazí v pravém panelu. Limit **max 5 na typ** (`MAX_PINNED`). Připnout lze jen oblíbenou položku.
  - Karty vedou na detail (`/ikaros/diskuze/:id`, `/ikaros/clanky/:id`, `/ikaros/galerie/:id`); u obrázků thumbnail (Cloudinary).
  - Přidávání/odebírání z oblíbených (heart/záložka) se děje **na detailu nebo kartě v daném modulu** (Diskuze/Články/Galerie), ne přímo na této stránce — `FavoritesPage` jen agreguje a umožňuje připínání.
- **Kde se ukládá (BE — důležité zjištění):**
  - **Vše na dokumentu User** (`backend/src/modules/users/schemas/user.schema.ts`), jako pole ID:
    - Oblíbené: `favoriteDiscussionIds`, `favoriteArticleIds`, `favoriteGalleryIds` (string[]).
    - Připnuté: `pinnedDiscussionIds`, `pinnedArticleIds`, `pinnedGalleryIds` (string[]) — podmnožina oblíbených, max 5/typ.
    - Související: `likedDiscussionIds` (lajky diskuzí, samostatné od oblíbených).
  - **Toggly žijí v modulu daného obsahu**, ne v centrálním "favorites" modulu:
    - Diskuze: `GET /ikaros-discussions/my-favorites`, `POST /ikaros-discussions/:id/toggle-favorite`, `POST /:id/toggle-pin` (limit + kontrola NOT_FAVORITE → 409 `PIN_LIMIT` / `NOT_FAVORITE`).
    - Články a Galerie mají analogické endpointy (FE hooky `useMyFavoriteArticles/Gallery`, `useTogglePinArticle/Gallery`).
  - **✅ OPRAVENO 2026-07-05 (SEC-22/FIX-9, RUN-2026-07-05):** `my-favorites` (Diskuze i Galerie) dřív vracelo položky **bez ohledu na stav** — pokud sis oblíbil diskuzi/obrázek, který mezitím zůstal `Draft`/`Pending`/byl zamítnut (nebo šlo o cizí neschválený obsah, na který ses dostal oblíbením), viděl jsi ho dál v `/ikaros/oblibene`. Teď `findMyFavorites` filtruje viditelnost stejně jako běžné čtení (`Published` každý, `Pending` navíc admin, `Draft`/`Rejected` jen autor) — cizí neschválený obsah se přes oblíbené už nezobrazí.
  - Stav připnutí FE čte z `currentUser.pinnedXIds` (pole na uživateli), oblíbené z `GET …/my-favorites`.
- **Záložky uvnitř světů (samostatné, nesouvisí s touto stránkou):**
  - `favoriteCharacters: Map<worldId, slug[]>` — oblíbené postavy per svět (sdíleno napříč zařízeními, nahradilo localStorage).
  - `favoritePageSlugs: Map<worldId, slug[]>` — osobní oblíbené wiki stránky per svět, pořadí významné (reorder); zobrazují se v dashboardu světa a indexu stránek (hvězdička / klávesa `f`). Toto je per-user, nahradilo dřívější sdílené `world.favoritePageSlugs`.
- **Hranice / co neumí:**
  - Oblíbené pokrývají **jen 3 globální moduly** (Diskuze, Články, Galerie). Akce, novinky, uživatelé, světy se do "Oblíbených" přidat nedají.
  - Připnutí je **max 5 na typ** (tvrdý limit, 409 při překročení) — žádná konfigurace.
  - Žádné složky / tagy / poznámky u záložky; jen plochý seznam per typ.
  - Pin-toggle vyžaduje, aby položka byla nejdřív oblíbená (jinak `NOT_FAVORITE`).
- **Zvláštnosti:** "Oblíbené" (favorite) a "Připnuté" (pinned) jsou dvě úrovně — připnuté je podmnožina oblíbených promítaná do pravého panelu. Architektura je **denormalizovaná na User** (pole ID), ne přes join/kolekci "favorites" — každý modul si svůj toggle řeší sám, ale zapisuje do polí uživatele.
- **Stav:** ✅
- **Kód:** FE `src/features/ikaros/pages/FavoritesPage.tsx:54`, hooky `src/features/ikaros/api/useDiscussions.ts` / `useArticles.ts` / `useGallery.ts`, `src/features/ikaros/components/PinToggle.tsx`. BE pole `backend/src/modules/users/schemas/user.schema.ts:38-47` (+ `:133` favoriteCharacters, `:140` favoritePageSlugs), toggly `backend/src/modules/ikaros-discussions/ikaros-discussions.service.ts:407` (toggleFavorite) / `:434` (togglePin), controller `ikaros-discussions.controller.ts:79,159`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)
- **Žádný centrální "favorites" modul.** Oblíbené/připnuté jsou pole ID rozeseté po `User` dokumentu a každý obsahový modul (diskuze/články/galerie) má vlastní duplicitní toggle-favorite/toggle-pin implementaci. Při přidání 4. typu oblíbeného obsahu se vzor zkopíruje počtvrté (riziko driftu).
- **Dvojí význam "oblíbené".** Globální záložky (`favoriteDiscussionIds` atd. — stránka `/ikaros/oblibene`) vs. in-world oblíbené (`favoriteCharacters`, `favoritePageSlugs` — dashboard světa / index stránek) jsou nezávislé systémy se stejným jménem. Pro uživatelského průvodce nutno odlišit.
- **Akce nejdou přidat do oblíbených** — RSVP "Zúčastním se" je jediný způsob, jak si akci "uložit". Žádná vazba mezi akcemi a stránkou Oblíbené.
- **`confirmedBy` vrací prázdné jméno u smazaných uživatelů** (`names.get(uid) ?? ''`) — na kartě akce se může objevit prázdný chip účastníka. K ověření vizuálního dopadu.
- **Akce pracují s lokálním časem prohlížeče** (žádná timezone normalizace) — uživatelé v jiných pásmech mohou vidět akci v jiném dni/čase, než autor zamýšlel.
- **Soft-delete akcí** (`isActive: false`) — smazané akce zůstávají v DB bez zjevného cleanup jobu (na rozdíl od některých jiných modulů). K ověření retence.
