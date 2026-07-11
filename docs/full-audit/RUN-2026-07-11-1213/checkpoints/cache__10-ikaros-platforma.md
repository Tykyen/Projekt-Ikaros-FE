# Checkpoint — cache / 10-ikaros-platforma

RUN-2026-07-11-1213 · styl **cache** (TanStack invalidace) · registr `docs/cache-audit.md` · prefix `C-`
READ-ONLY hloubkový re-audit oblasti 10 proti HEAD. Osy: `FO` `CR` `KM` `CB` · P1 P5 P6/M-CEN P7.

## Dosažená vs cílová L
- **Dosažená: L2** (M1 statické čtení + M2 key-match + M-CEN mutation census; orphan/dead potvrzeny grepem 0 invalidátorů).
- **Cílová:** běžné L2+, destruktivní/optimistic L3+. Runtime (M4/L4) neděláno (read-only auditor).
- Baseline (tsc/vitest) NEspouštěno (read-only).

## Kontext: povrch oblasti NAROSTL od sweepu 2026-06-05
Původní sweep pokryl articles/discussions/gallery/categories/news/events. Od té doby přibyly moduly, které
původní plán NEzná (spadají do `features/ikaros`, tj. oblast 10 scope):
- **19.3 nábory** `api/useNabory.ts` (+NaborListek, NaboryPage)
- **19.4 supporters** `api/useSupporters.ts` (+SupportersPage) · admin grant `admin/users/api/useAdminUsers.ts`
- **16.2b-2 komunitní bestiář** `bestiar/hooks/useKomunitniBestiarMutations.ts` (+Insert modal, clone)
- **21.5a komunitní herbář** `herbar/hooks/useKomunitniHerbarMutations.ts` (+InsertToShopModal)
- **sdílený moderation** `src/shared/moderation/useModeration.ts` (NÁHRADA za starý `useReportPost` / C-41)

## Nálezy

### 🆕 C-RUN-1 · `FO`/P6/M-CEN 🟡 · veřejná zeď `['supporters']` je orphan — admin grant/revoke Podporovatele ji neobnoví
- **Kde (konzument):** `useSupporters` → `queryKey: ['supporters']`, staleTime 60s ([useSupporters.ts:11](../../../../src/features/ikaros/api/useSupporters.ts#L11)); jediný čtenář = `SupportersPage`.
- **Kde (mutace):** `useAdminSetSupporter` ([useAdminUsers.ts:154-159](../../../../src/features/admin/users/api/useAdminUsers.ts#L154)) invaliduje `adminKeys.users` + `['public-users']` + `['public-user-profile']` + `adminKeys.stats` + `adminKeys.auditLog` — **ale NE `['supporters']`**.
- **M-CEN:** grep `'supporters'` → 1 čtenář, **0 invalidátorů** = potvrzený orphan.
- **Dopad:** Admin udělí/odebere status Podporovatel → veřejná zeď `/ikaros/podporovatele` drží starý seznam do 60s staleTime / F5. Nově přidaný podporovatel se neobjeví (odebraný zůstane). Trigger: admin akce. Viditelnost: tiše starý seznam (marketing). Workaround: F5 / 60s.
- **Návrh:** do `useAdminSetSupporter.onSuccess` přidat `invalidate(['supporters'])`.
- **Závažnost:** 🟡 (orphan; 60s staleTime tlumí, akce vzácná, jen public wall).
- **L2.**

### 🆕 C-RUN-2 · `CR`/`FO`/M-CEN 🟡 · `clone` komunitní bestie NEinvaliduje cílový bestiář světa/osobní (žádný client cache efekt)
- **Kde (mutace):** `clone` v `useKomunitniBestiarMutations` ([useKomunitniBestiarMutations.ts:61-64](../../../../src/features/ikaros/bestiar/hooks/useKomunitniBestiarMutations.ts#L61)) — **jediná mutace bez `onSuccess`** (M-CEN). Call-site `InsertToBestiaryModal` onSuccess dělá jen `onInserted`+`onClose` ([InsertToBestiaryModal.tsx:56-63](../../../../src/features/ikaros/bestiar/components/InsertToBestiaryModal.tsx#L56)).
- **Kde (konzument):** cílový bestiář světa/osobní `['bestiar', worldId, systemId]` staleTime 30s ([useBestiar.ts:9,33-36](../../../../src/features/world/bestiar/hooks/useBestiar.ts#L9)). Klon vkládá do scope `world`/`user` (jiný namespace než `komunitni-bestiar`).
- **Dopad:** Klon globální bytosti do „Můj bestiář"/světa se v cílovém seznamu neobjeví z vlastní akce. Obnova jen přes: (a) BE WS `bestiar:changed` — **ale klient je při klonu na komunitní stránce, NENÍ v world/user room** → event nedostane; (b) navigace na bestiář = fresh mount refetch (tlumí). Reálná stale okna: cílový bestiář otevřený v jiném tabu bez WS eventu → stale do 30s.
- **Návrh:** `clone` doplnit `onSuccess: invalidate predicate q.queryKey[0]==='bestiar' && q.queryKey[2]===systemId` (parita s ostatními komunitními mutacemi + `useBestieMutations`). PROOF-REQUEST níže.
- **Závažnost:** 🟡 (latentní; navigation-refetch většinu případů zakrývá; 🟠 jen při otevřeném cílovém bestiáři v paralelním kontextu).
- **L2.**

### 🆕 C-RUN-3 · `KM`/dead-code 🟡 (minor) · `useReportNabor` je nevolaný hook (report jde přes sdílený `ReportButton`)
- **Kde:** `useReportNabor` ([useNabory.ts:112-119](../../../../src/features/ikaros/api/useNabory.ts#L112)) invaliduje `['pending-actions']`, ale **nikde se neimportuje/nevolá** (grep: jen definice). NaborListek reportuje přes `<ReportButton targetType="nabor">` → `useCreateReport` (moderation) ([NaborListek.tsx:97-106](../../../../src/features/ikaros/components/NaborListek.tsx#L97)).
- **Dopad:** Žádný runtime dopad (reálná cesta `useCreateReport` invaliduje `['pending-actions']`+`my-reports` ✅). Riziko = drift-trap/dead code: zavádějící duplicitní invalidační logika při budoucí úpravě.
- **Návrh:** smazat `useReportNabor` (dead), případně i `useCreateNabor/usePatchNabor/useDeleteNabor` invalidaci `['pending-actions']` prověřit (nábor CRUD nevytváří pending-action → over-invalidace, neškodná).
- **Závažnost:** 🟡 latentní / úklid.
- **L2.**

## Ověřeno ✅ (parita / korektní fan-out — bez nálezu)

**Známé C-37…C-42 — všechny OPRAVENÉ v HEAD, žádná regrese (🔓 = 0):**
- **C-37** ✅ bulk approve/reject → `['articles']` + `['pending-actions']` (dead klíč `['articles','pending']` odstraněn) — [useBulkArticleActions.ts:23-26,36-39](../../../../src/features/ikaros/api/useBulkArticleActions.ts#L23).
- **C-38** ✅ `useApproveArticle` → `['article-reads','unread-count']` — [useArticles.ts:116](../../../../src/features/ikaros/api/useArticles.ts#L116); **C-42** ✅ `useDeleteArticle` symetricky [useArticles.ts:91](../../../../src/features/ikaros/api/useArticles.ts#L91).
- **C-39** ✅ `useRateArticle` → `ARTICLES_KEY` (list+sidebar) [useArticles.ts:152](../../../../src/features/ikaros/api/useArticles.ts#L152); galerie parita `useRateGalleryImage` → `GALLERY_KEY` [useGallery.ts:167](../../../../src/features/ikaros/api/useGallery.ts#L167).
- **C-40** ✅ AkcePage drží jen `selectedId`, `selected` derivuje z `events.find()` živé query [AkcePage.tsx:43-45,210-218](../../../../src/features/ikaros/pages/AkcePage/AkcePage.tsx#L43).
- **C-41** ✅ přerámováno: `useReportPost` odstraněn, report jde přes `useCreateReport` (moderation) → `['pending-actions']`+`['moderation','my-reports']` [useModeration.ts:30-34](../../../../src/shared/moderation/useModeration.ts#L30).

**Nové moduly — parita OK:**
- **Nábory** CRUD (create/patch/delete) → `['nabory']` (prefixuje all+detail) + `['pending-actions']` ✅ [useNabory.ts:20-23](../../../../src/features/ikaros/api/useNabory.ts#L20). `useOzvatSe` bez cache efektu = OK (jen odešle zprávu, žádný lokální konzument).
- **Sdílený moderation** — moderační fronta jede přes `['pending-actions', type, …]` ([usePendingActions.ts:34](../../../../src/features/users/api/usePendingActions.ts#L34)); `useCreateReport`/`useResolveReport`/`useReviewAppeal` → `['pending-actions']` ✅, `useSubmitAppeal` → `['moderation','my-decisions']` ✅. (Cross-client update `my-reports`/`my-decisions` po cizí resolve jede jen staleTime 30s — konzistentní s celoprojektovým vzorem WS-less, neeskaluji.)
- **Komunitní bestiář/herbář** mutace (create/updateLore/propose/approve*/remove) → predikát `q.queryKey[0]==='komunitni-bestiar'|'komunitni-bestie'` resp. `'komunitni-herbar'|'komunitni-plant'` (list+detail) ✅. `useAddBestieComment` → `['bestie-comments',id]` ✅. (approve NErouteje přes pending-actions — draft/approved knihovna je vlastní filtr, ne sdílená fronta → OK.)
- **InsertToShopModal** (herbář→obchod) reuse `useCreateShopItem`/`useBulkCreateShopItems` — invalidace `shopKeys.root(worldId)` žije na **hook-level** onSuccess ([shop/api.ts:63,71,85](../../../../src/features/world/shop/api.ts#L63)) → cílový obchod se obnoví ✅.

## Latentní (neeskalováno)
- Delete v `useKomunitniHerbarMutations.remove` / gallery / articles používá `invalidate(namespace)`, ne `removeQueries(detail)` — stejný vzor jako D-10-1 (delete typicky naviguje pryč → nízké riziko 404 refetch).

## Pokrytí
- **Přečteno do L1-L3 statiky:** useNabory, useSupporters, useDiscussions, useArticles, useBulkArticleActions, useGallery (rate/delete), useModeration, AkcePage, NaborListek, useKomunitniBestiar(+Mutations), useKomunitniHerbar(+Mutations), InsertToBestiaryModal, InsertToShopModal, useBestiar, useAdminUsers(supporter), usePendingActions, shop/api.
- **Cross-ref:** shop hooky (oblast 05), moderation queue (oblast 02/11), world bestiar (oblast 07) — jen v rozsahu reuse z oblasti 10.

## PROOF-REQUESTy
1. **C-RUN-2 (BE):** emituje BE po `cloneCommunityBestie` (scope world/user) WS `bestiar:changed` do příslušné world/user room? Pokud NE → stale okno delší (jen navigation-refetch). Ověřit v `backend` bestiae/community clone service.
2. **C-RUN-1 (runtime M4):** po admin toggle Podporovatele zůstane `/ikaros/podporovatele` stale do 60s — potvrdit v běžící instanci.
3. **C-RUN-2 (runtime M4):** klon do „Můj bestiář" + navigace na world bestiář v paralelním tabu → objeví se bez F5?

## Shrnutí pro registr
- **C-RUN-1 🟡** `['supporters']` orphan — `useAdminSetSupporter` neobnoví veřejnou zeď podporovatelů.
- **C-RUN-2 🟡** `clone` komunitní bestie bez client cache efektu → cílový `['bestiar',…]` stale (spoléhá na BE WS + nav refetch).
- **C-RUN-3 🟡** `useReportNabor` dead code (report jede přes sdílený ReportButton).
- **Regrese 🔓 = 0.** Známé C-37…C-42 potvrzeny opravené v HEAD.
