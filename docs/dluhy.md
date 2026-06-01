# Technické dluhy

> Soubor obsahuje **pouze otevřené a částečně řešené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-05-24 (sweep post-infrastruktura + UX detailu postavy + D-061 dotažení).

---

## Vyřešené 2026-06-01 (D-063 — map UI tokeny)

- **D-063 — Tactical-map UI chrome → `--map-ui-*` tokeny** ✅ (varianta A2 — plná konsolidace).
  **492 hardcoded barev ve 39 chrome module.css + TSX inline** sjednoceno do **~30
  sémantických `--map-ui-*` tokenů** v [map-tokens.css](../src/themes/_shared/map-tokens.css).
  - **Trik na 8 opacit:** RGB triplety (`--map-ui-accent-rgb: 120 100 255`) +
    `rgb(var(--x) / <alpha>)` (CSS Color 4) → jeden token pokryje všechny průhlednosti.
  - **Konsolidace:** ~216 unikátních odstínů (copy-paste drift) sjednoceno na kanonické
    hodnoty → **drobný záměrný drift** u near-duplikátů (oprava drift chaosu).
  - **Vyloučeno (záměrná identita, ne chrome drift):** 6 `system-panels/*` combat panelů
    (Matrix neon, CoC parchment, GURPS steel…) → přidáno do `lint:colors` ALLOW.
    Canvas/PIXI data (effectColors, hpTier) → `lint-colors-ignore` (čte WebGL, ne CSS).
  - **Lint fix:** `RGB_RE` negative lookahead na `var(` (token-based `rgb(var()/a)` není
    hardcoded) + `.test.` do ALLOW.
  - **Výsledek:** `lint:colors` **0 v tactical-map** (z ~56), eslint 0, tsc 0, build 0,
    157 testů zelených. ⚠️ Vizuální drift review (běžící mapa) doporučen uživateli.

## Vyřešené 2026-06-01 (D-066 + D-062c)

- **D-066 — Per-token lock** ✅ — PJ může zamknout jednotlivý token (ne celou scénu).
  **BE** (`400e7b6`): `MapToken += isLocked?: boolean` (interface); op aplikace generic
  (`token.update` patch loop), authorizer gate by default (`isLocked` ∉
  `allowedPlayerFields` → hráč 403) + test. **FE**: `MapToken += isLocked`,
  `useTokenPermissions` gate (`token.isLocked && !isPj → false`), PJ toggle
  „🔓 Zamknout/🔒 Zamčen" v TokenInfoPanel header, 🔒 badge na zamčeném spritu
  (top-right). Spec: [spec-D-066-per-token-lock.md](arch/phase-10/spec-D-066-per-token-lock.md).
  Testy: BE maps 144 zelených (+1), FE tactical-map 123 zelených.
- **D-062c — AKJ stub karty v listings (var. b)** ✅ — stránka bez AKJ klíče se v adresáři
  i page-search zobrazí jako stub „🔒 AKJ: N — Název"; klik → AccessDenied (D-062a).
  **BE** (`2b9e8b8`): `GET /pages/directory` vrací per-entry `shieldedBy` (nesplněné
  AKJ/Role pro current usera); raw `accessRequirements` se NEvrací (privacy — UserId).
  `computeShieldedBy` refaktorován na čistou DB-free `shieldedFromRequirements`;
  directory načte membership+akjSettings JEDNOU (ne N+1 per stránka). **FE**:
  `PageDirectoryEntry += shieldedBy`, `PageCard` stub varianta (Lock ikona + ztlumená
  dashed karta + AKJ label), `PagePalette` 🔒 indikátor. Bezpečnost beze změny —
  directory už dřív vracel chráněné s title (jen vizuální indikace). Testy: BE pages 44
  (+2), FE 8 zelených.

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
- **D-react19-strict-cleanup — KOMPLETNĚ vyřešeno** ✅ — `npx eslint src` **0 errors,
  0 warnings** (z 4 errors + 50 warningů). Ověřeno: tsc 0 errors, **2320/2320 FE testů
  zelených** (294 souborů), žádná regrese.
  - **4 errory**: unused `FATE_TARGETS` (DiceRollOverlay), unused `describe`
    (diceVisibility.spec), `access-before-declared` `startPlaylist` (useYoutubePlayer
    → přesun deklarace nad init-effekt), mirror-ref reassign (usePanelLayout
    → write-only `onDragEnd` + 1 cílený eslint-disable na R19 `immutability` false-friend).
  - **50 warningů per-case**: `unused-disable` (4× odebráno), `incompatible-library`
    watch() (4× cílený disable — RHF false positive), `react-refresh/only-export`
    (7× file-level disable — DX/HMR, util/Context soubory), `exhaustive-deps`
    (8× → `useMemo` wrap stabilizace `?? []` referencí + timer-cleanup disable),
    `refs` (3× → `isDragging` state v ZoomableImage + lazy-init param v useFormDraftAutoSave
    + RHF disable RegisterModal), `static-components` (6× → SortHeader extrakce ven,
    ArticleDetail Wrapper → sdílený `cardInner`, PageCard Icon disable),
    `set-state-in-effect` (18× **per-case**: adjustment-during-render pro primitivní
    deps — GalleryLightbox/useComposerSticky/PagePalette/PoolPrompt/AkjCreate/SkinPicker/
    TemplateEditor/CalendarTabGrid/useSlugAutoGen/Mention+Emote autocomplete; render-phase
    self-limiting pro CalendarConfigsPage+AppearancePopover; cílený disable pro legit
    external/async/animaci — EmoteUploadDialog objectURL, DiceRollOverlay rAF,
    MatrixCombatPanel async mutace).
  - **Princip**: array/object deps NIKDY adjustment (riziko smyčky) → primitivní klíč
    nebo disable; primitivní deps adjustment (skutečná oprava, ne potlačení).

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

### D-062 (původní) — IMPLEMENTOVÁNO 2026-05-24
Část a+b realizována jako [spec-akj-shielded-existence.md](arch/_side-tasks/spec-akj-shielded-existence.md).
- **D-062a (AccessDenied):** klik na AKJ-zamčený link → screen s konkrétní úrovní AKJ + jméno klíče + Wood-Wide hint.
- **D-062b (AkjDecryptedBanner):** otevřená AKJ-chráněná stránka má nahoře banner „UTAJENÝ ARCHIV [AKJ: N — Name] / Úspěšně dešifrováno" (theme variants přes CSS `[data-theme]`).
- **D-062c (listings stub):** ✅ vyřešeno 2026-06-01 — viz „Vyřešené 2026-06-01". Inline header
  badge na hlavičce stránky je pokryt D-062b bannerem; samostatný „AKJ: N W" chip se nedělá.

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

**Celkem otevřených dluhů: 2** — D-NEW-chat-edit-attachments (defer, čeká na stížnost),
D-NEW-chat-presence-scale (defer, multi-instance BE). Oba vědomě odložené s konkrétním
triggerem.
