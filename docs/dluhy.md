# Technické dluhy

> Soubor obsahuje **pouze otevřené a částečně řešené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-05-24 (sweep post-infrastruktura + UX detailu postavy + D-061 dotažení).

---

## Vyřešené 2026-05-31 (sweep dluhů)

- **D-060 — Cross-world kalendář link** ✅ (mrtvý dluh) — předpoklad zmizel. Soubor
  `DashboardPage/sections/UpcomingEventsSection.tsx` už neexistuje; nahrazen
  `IkarosEventsSection.tsx`, jehož „Zobrazit vše →" link míří na živou route
  `/ikaros/akce` (ne na dočasný `/ikaros/vesmiry`). Není co implementovat.
- **D-065 — GurpsSheet deník: tlačítko „Iniciativa"** ✅ — `GurpsSheet` dostal zpět
  `onRoll` prop + `<SheetInitiativeButton onRoll={onRoll} kind="d20" />` na začátek
  dashboardu (analogicky CoC). GURPS init je fakticky Basic Speed, ne kostka, ale
  quick-roll widget `kind` nepodporuje 3d6 → `d20` dle zadání dluhu. Testy 9/9.
- **D-NEW-register-captcha-tests** ✅ — globální mock `@marsidev/react-turnstile`
  v [setup.ts](../src/__tests__/setup.ts) (emituje token přes `onSuccess` na mount).
  RegisterModal spec **14/14** (byl timeout na disabled submit). Turnstile používá
  jen RegisterModal → globální mock nikoho jiného neovlivní.
- **Lint regrese 4 errors → 0** ✅ — dluh `D-react19-strict-cleanup` psal „0 errors",
  ale mezitím přibyly 4 hard errors. Opraveno: unused `FATE_TARGETS` import
  (DiceRollOverlay), unused `describe` (diceVisibility.spec), `access-before-declared`
  `startPlaylist` (useYoutubePlayer — přesun deklarace nad init-effekt),
  mirror-ref reassign (usePanelLayout — write-only `onDragEnd` + 1 cílený
  eslint-disable na R19 `immutability` false-friend). Warningy (50) řešeny zvlášť.

- **D-064 — Orchestr: vkládání PC z katalogu** ✅ — vyřešeno v 10.2n přechodem ambient
  i palet na sdílený `CharacterCatalogModal` se **search + sekvenční multi-add** (klik
  přidává položky bez zavření modalu, ✓ u už-přidaných). Pokrývá i „bulk" vkládání PC z
  katalogu při velkém počtu položek. Seskupení vložených tokenů (původní „skupiny") se
  po dohodě s userem **nepronásleduje** — orchestrace řeší rozmístění per scéna/hráč
  (sekce „Přístup a viditelnost"). Rozhodnutí user 2026-05-31.

## Vyřešené 2026-05-24 (po sweepu)

- **D-040-followup customData data loss** 🚨 ✅ — **kritický bug** odhalen při real-world testu (user nahodil DrD16 preset, uložil, switch zpět na Matrix nevyšel). Root cause: `character-diary.repository.update` použil `$set: { customData: {...} }` = REPLACE celého objektu; v kombinaci s read-side coerce (filter customData podle aktivního schématu) způsoboval **data loss** při system switchi:
   1. `getDiary` filtroval matrix_* keys → FE nedostal historická data
   2. FE po editu pošle `customData = { ...filteredEmpty, drd16_newKey }` → BE REPLACE → matrix_* nadobro smazané
  **Fix:** delta merge pattern. **BE:** `UpdateCharacterDiaryDto.customDataPatch?: Record<string, unknown>` (delta); `CharacterDiaryRepository.updateWithCustomDataPatch` generuje flat `$set: { 'customData.<key>': value }` + `$unset` pro `null` values; `CharacterSubdocsService.updateDiary` rozeznává obě cesty (delta = preferovaná, legacy customData full-replace = warning v logu). `getDiary` read-side coerce **odstraněn** (pass-through pro write-side merge safety). **FE:** `cdAccess.set` posílá `{ customDataPatch: { [key]: value }}`; `SystemSheetProps.onChange` přijímá union (customDataPatch | customData); `DiaryTab` drží `customDataPatch` state + `displayCustomData = base ⊕ patch` merge na render; `UpdateDiaryInput.customDataPatch?` field. **Testy:** BE 1451 zelených (+5 D-040-followup — pass-through getDiary, delta merge $set, $unset null, BC legacy full-replace), FE 1146 zelených (sheet specs + DiaryTab spec migrated `customData` → `customDataPatch`).
- **D-061 zbývající** ✅ — `WorldsService.approveAccessRequest` přepsán na `connection.startSession().withTransaction(async () => { … })` s graceful fallback na sekvenční flow (analogicky `CharacterAccountsService.transfer`). `WorldMembershipRepository.save` a `WorldAccessRequestRepository.delete` rozšířeny o optional `ClientSession` parametr (override base). Při `Transaction numbers are only allowed on a replica set` chybě se aktivuje sequential fallback s idempotentním cleanup. **Testy:** worlds.service.spec rozšířen o 2 nové scénáře (transaction success + replica-set fallback), 85 zelených.
- **D-040** ✅ — Plná tombstone integrace dle [spec-D-040-tombstone.md](arch/spec-D-040-tombstone.md). **BE:** `UsersService.findManyTombstoneInfo(ids)` batch helper s 60s in-memory cache + `MongoUsersRepository.findByIds()`; per-feature enrichment v `ChatService.getMessages/searchMessages`, `IkarosArticlesService.findAll/findById/findMy/findPending/findMyFavorites`, `IkarosDiscussionsService.findAll/findById/findAllPaginated/findPending/findMyFavorites/getPosts`, `IkarosGalleryService.findAll/findById/findMy/findPending/findMyFavorites`. Entity rozšířeny o `senderIsDeleted` / `authorIsDeleted` / `creatorIsDeleted`. **FE:** sdílený util `shared/lib/tombstone.ts` (`resolveTombstone()`) + 4 testy; renderer wireup do `MessageItem` (chat — avatar tombstone band + name přepis, NPC override má prioritu), `ChatSearchModal`, `ArticleDetailPage`/`ArticlesPage`/`ArticleReviewRenderer`, `DiscussionDetailPage`/`DiscussionsPage`/`DiscussionReviewRenderer`, `GalleryCard`/`GalleryDetailPage`/`GalleryReviewRenderer`/`Lightbox`. **Testy:** BE 1449 zelených (+13 nových — `findManyTombstoneInfo` 6 + enrichment per-feature 7), FE 1147 zelených + 4 nové tombstone util.

---

## Otevřené

### D-066 — Per-token lock (zamčení jednotlivého tokenu)
**Soubor:** `src/features/world/tactical-map/types.ts` (`MapToken`) + `hooks/useTokenPermissions.ts`
**Problém:** Roadmapa 10.2m zmiňuje „respekt `isLocked`". Existuje jen `scene.isLocked` (zamkne pohyb tokeny celé scény hráčům). Per-token lock — zamknout konkrétní token, ne celou scénu — chybí: `MapToken` nemá pole `isLocked`, takže PJ nemůže přišpendlit jeden token a nechat ostatní volné.
**Dopad:** Nízký — scene-level lock pokrývá hlavní use-case (zamknout celou scénu během vyprávění); granularita per-token je nice-to-have.
**Řešení:** BE: `MapToken.isLocked?: boolean` ve schématu + `token.update` op + `toEntity` mapper. FE: gate v `useTokenPermissions.canDrag` (`token.isLocked && !isPj` → false) + toggle v TokenStatbarModal (PJ-only). BE+FE krok, nemíchat v jedné dávce.
**Kdy:** Až bude potřeba zamykat jednotlivé tokeny (např. dekorace/objekty na mapě), nebo v navazující map iteraci.

---

### D-react19-strict-cleanup — 44 React 19 strict lint warningy ve 30+ FE souborech
**Soubory:** Široký scope — viz `npx eslint src` výstup. Hot soubory:
- `PageEditor/hooks/{useFormDraftAutoSave,useSlugAutoGen}.ts`, `PageEditor/components/AkjCreateModal.tsx`
- `WorldSettingsPage/{components/TemplateEditorModal.tsx, tabs/BasicInfoTab.tsx}`
- `WorldDashboardPage/.../WorldNewsEditorModal.tsx`, `CharacterDetailPage/components/CalendarTab.tsx`
- `NPCDirectoryPage/components/NpcTemplateModal.tsx`, `CalendarConfigsPage/CalendarConfigEditor.tsx`
- chat: `useComposerSticky.ts`, `AppearancePopover.tsx`, `MentionAutocomplete.tsx`, `EmoteAutocomplete.tsx`, dice komponenty
- ostatní: `RegisterModal`, `ArticleDetailPage`, `GalleryLightbox`, `PagePalette`, `GameEventModal`, `PagePicker`

**Kategorie warningů (44):**
- `react-hooks/set-state-in-effect` (~25) — fix pattern "adjustment during render" (React 19), použito už ve `useDensity.ts` a `CalendarPage.tsx` jumpOpen jako vzor.
- `react-hooks/incompatible-library` (~6) — `watch()` z react-hook-form je **false positive** (knihovní API problém, vyžaduje upgrade lib nebo eslint-disable s odkazem).
- `react-hooks/refs` (~3) — access ref během renderu.
- `react-hooks/static-components` (~5) — komponenty deklarované uvnitř renderu, vyžaduje extrahovat ven.
- `react-hooks/exhaustive-deps` (~5) — drobné memo dependencies.
- 1× unused eslint-disable directive.

**Dopad:** Nízký — build prochází (TS 0 errors, lint 0 errors), runtime bug pozorován **nebyl**. Jde o R19 strict checks doporučující refactor patternů, ne reálné bugy. Riziko: některé `set-state-in-effect` mohou v krajních případech způsobovat cascading renders (perf), v praxi neviditelné.

**Řešení:** Samostatný sprint „react-19-strict-cleanup", ~1-2h. Postup:
1. Hromadně `set-state-in-effect` → pattern adjustment during render
2. Jednotlivě `refs` a `static-components` (vyžaduje extrakci komponent)
3. `incompatible-library` → eslint-disable s komentem dokud lib nevyřeší

**Kdy:** Mimo feature work. Při příští session zaměřené na perf/quality nebo když lint začne blokovat CI.

**Stav (2026-05-31):** Lint **errory 4 → 0** opraveny (viz „Vyřešené 2026-05-31"). Zbývá
**50 warningů** (R19 strict, 0 runtime dopadu): 18× `set-state-in-effect`, 8× `exhaustive-deps`,
7× `react-refresh/only-export-components`, 6× `static-components`, 4× `incompatible-library`,
3× `refs`, 4× ostatní. Tento sprint = jen warningy.

---

### D-063 — Tactical-map UI chrome modules používají hardcoded barvy místo `--map-*` tokenů
**Soubor:** `src/features/world/tactical-map/components/**/*.module.css` (15+ souborů: MapPjPanel, BestiePalette, ActiveScenesList, EditSceneModal, MapLibraryModal, ClearSceneDialog, CharacterCatalogModal, MapEmptyState, MapHiddenOverlay, MapLockedOverlay, MapZoomControls, PaletteSearchInput, MemberAssignmentTable, MapPlacementBanner, TokenStatbarModal, …)
**Problém:** UI chrome panely v taktické mapě (PJ panel, palety, modaly, banner) používají hardcoded `rgba(120, 100, 255, …)`, `rgba(20, 14, 50, …)`, `#fff`, `#ffb4b4` apod. `lint:colors` reportuje ~2800 globálně, z toho významný podíl z tactical-map. Existující `--map-*` vars v [_shared/map-tokens.css](src/themes/_shared/map-tokens.css) pokrývají jen render layer (canvas-bg, grid-stroke, token-ring, fog), nikoli UI chrome (panel-bg, panel-border, button-purple, button-purple-hover, danger-bg, danger-fg, accent-strong, …).
**Dopad:** Nízký — funkčně OK, ale nepodporuje theming map UI per skin (10.2 princip 8 — theming via world CSS vars). Při přidání nového map skinu bude třeba per-soubor overrides místo theme-level varů.
**Řešení:** Rozšířit `--map-*` token sadu o UI chrome layer (~10-15 nových vars: `--map-panel-bg`, `--map-panel-border`, `--map-accent`, `--map-accent-hover`, `--map-danger-bg`, `--map-danger-fg`, …). Refactor 15+ module.css na `var(--map-…)`. Riziko: vizuální drift, takže per-soubor screen review po refaktoru.
**Kdy:** Před 10.2j (skin-specific effects) nebo při zavedení druhého map skinu — pak teprve var() vrstva dává smysl. Do té doby konzistence s existujícími sourozenci > pedantská čistota.

---

### D-062c — Listings: AKJ-chráněné stránky bez indikátoru v adresáři / vyhledávání
**Soubor:** `GET /pages` + `GET /pages/directory` v BE; `CharacterDirectory.tsx` + listing komponenty v FE
**Problém:** `GET /pages` a `/pages/directory` aktuálně vrací AKJ-chráněné stránky **bez filtru a bez indikátoru**. User v adresáři vidí plný název, klik → AccessDenied (D-062a vyřešil zobrazení úrovně, ale nekonzistence zůstává). Listings by měly buď AKJ-chráněné stránky úplně filtrovat (jako backlinks dnes), nebo zobrazit stub kartu („🔒 AKJ: 3 — Tajný spis") podle Matrix vzoru.
**Dopad:** Nízký až Střední — UX nekonzistence. Bez D-062c je informace o existenci „nakopnutá" pouze přes AccessDenied screen (klik), ne v běžném pohledu na svět.
**Řešení:** Spec + plán samostatně. Klíčové rozhodnutí: ukazovat stub vždy / podle nastavení světa / podle role uživatele. Plus inline badge na hlavičce stránky (`AKJ: 3 W`) podle Matrix vzoru.
**Kdy:** Po dotazu uživatele (chce vidět existenci v adresáři / search?). Vychází z legacy Matrix (`C:/Matrix/Matrix/frontend/src/pages/Page.tsx:640` PJ container badgy).

---

### D-062 (původní) — IMPLEMENTOVÁNO 2026-05-24
Část a+b realizována jako [spec-akj-shielded-existence.md](arch/_side-tasks/spec-akj-shielded-existence.md).
- **D-062a (AccessDenied):** klik na AKJ-zamčený link → screen s konkrétní úrovní AKJ + jméno klíče + Wood-Wide hint.
- **D-062b (AkjDecryptedBanner):** otevřená AKJ-chráněná stránka má nahoře banner „UTAJENÝ ARCHIV [AKJ: N — Name] / Úspěšně dešifrováno" (theme variants přes CSS `[data-theme]`).
- **D-062c:** zbývající — listings stub + inline header badge — viz nahoře.

---

### D-NEW-chat-edit-attachments — Edit zpráv ve světovém chatu neumí měnit přílohy
**Soubor:** `src/features/world/chat/components/MessageEditInline.tsx`
**Kontext:** Krok 6.2c implementuje inline edit pouze pro `content`. BE `editMessage` DTO sice umí `attachmentsToAdd`/`attachmentsToRemove`, ale FE UI pro to (drag-add, klik-remove, re-validace limitů) by významně nafouklo modal — vědomě odsunuto.
**Dopad:** Nízký — user může smazat zprávu a poslat novou s opravenými přílohami. Discord/Messenger taky neumí editovat přílohy.
**Řešení:** Buď rozšířit `MessageEditInline` o sekci „přílohy" s tlačítky × per existujícím + paperclip pro nový upload, nebo nechat zavřené jako Discord-like UX.
**Kdy:** Až ze stížnosti reálných uživatelů.

---

### D-NEW-chat-presence-scale — In-memory presence světového chatu × více instancí BE
**Soubory:** BE `chat/chat-presence.service.ts`
**Stav:** `ChatPresenceService` drží presence konverzací v `Map` v paměti procesu. Pro single-instance BE správné rozhodnutí — nulová latence, žádná infra závislost. Socket.IO Redis adapter už je aktivovatelný přes env (`SOCKET_IO_REDIS=1`).
**Trigger:** nasazení víc instancí BE (load balancer / horizontální scaling) — presence by se mezi instancemi neviděla.
**Řešení:** Repurpose `Map` na Redis hash storage + použít Socket.IO Redis adapter pro broadcast.
**Kdy:** Při přechodu na multi-instance BE.

---

**Celkem otevřených dluhů: 6** — D-066 (per-token lock, BE+FE), D-react19-strict-cleanup
(50 warningů, řeší se), D-063 (map UI tokeny), D-062c (AKJ listings stub — rozhodnuto
var. **b**, čeká spec+BE), D-NEW-chat-edit-attachments (defer), D-NEW-chat-presence-scale
(defer, multi-instance).
