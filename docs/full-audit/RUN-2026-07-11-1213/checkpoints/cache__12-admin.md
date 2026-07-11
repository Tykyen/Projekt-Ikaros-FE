# Checkpoint — cache / 12-admin

> RUN-2026-07-11-1213 · styl cache (TanStack invalidace) · registr `docs/cache-audit.md` (prefix C-)
> READ-ONLY re-audit oblasti proti HEAD. Předchozí sweep 2026-06-05 (C-51..C-55).
> Oblast 12-admin.md ✅ hotová (C-51 🟠, C-52 🟠, C-53 🟡, C-54 🟡, C-55 ⚖️).

## Dosažená vs cílová L

- **Cílová:** běžné mutace L2+; destruktivní (`DEL`/`CB`) a optimistic (`OPT`) L3+.
- **Dosažená:** **L2** — statický key-match / prefix-match ověřen element-po-elementu; grep-potvrzený orphan.
  Vitest specy existují (`useAdminUsers.spec.tsx`, `useAdminResetCooldown.spec.tsx`, `PlatformAdminPage.spec.tsx`) = L3 test-exists pro dřívější fixy, **nespuštěno** v tomto běhu.

## Verdikt regrese známých nálezů (♻️ — NEhlásit jako nové)

- **♻️ C-54 — OPRAVENO.** `adminKeys` factory ([adminKeys.ts:12-25](../../../../src/features/admin/api/adminKeys.ts#L12)) používaná query i invalidacemi napříč `useAdminUsers`/`useAdminFriendships`/`useAdminStats` — drift eliminován, rozšířeno o `analytics`/`growth`/`costs`. Inline pole zmizela.
- **♻️ C-52 — OPRAVENO.** Všechny user-mgmt mutace teď invalidují `adminKeys.auditLog`: role/supporter/ban/unban/request-deletion/cancel-deletion/set-permissions/approve/reject/bulk×3 ([useAdminUsers.ts:133,159,196,217,242,263,299,340,381,398,415,465](../../../../src/features/admin/users/api/useAdminUsers.ts#L133)). Prefix-match `['admin','audit-log']` ⊑ `['admin','audit-log',query]` ✅.
- **♻️ C-53 — beze změny (DEV-only, funguje).** `useAdminResetCooldown` ([useAdminFriendships.ts:57-59](../../../../src/features/admin/friendships/api/useAdminFriendships.ts#L57)) stále zahodí vrácený `friendship`, invaliduje `friendships`+`auditLog`. Latentní, ne bug.
- **♻️ C-55 — beze změny (⚖️ by-design).** `world-search` orphan (MeiliSearch async reindex). `useRebuildSearchIndex` → `STATS_KEY` self-contained const ([useSearchIndex.ts:37](../../../../src/features/admin/api/useSearchIndex.ts#L37)) ✅.
- **♻️ C-51 — jen ČÁSTEČNĚ opraveno (jádro pro user-osy uzavřeno, world/content osa PŘETRVÁVÁ).** Fix přidal `adminKeys.stats` invalidaci do user-mgmt mutací → `users.total/pendingDeletion` + `queue.pendingUsernameRequests` (přes approve) se obnoví. **ALE** dashboard county `worlds.total` a `content.{articles,galleryImages,discussions}` ([adminStats.types.ts:13-20](../../../../src/features/admin/api/adminStats.types.ts#L13)) invaliduje **žádná** mutace — world create/soft-delete/restore ([useWorldLifecycle.ts:17,54](../../../../src/features/world/api/useWorldLifecycle.ts#L17) → jen `['worlds']`) ani content CRUD (oblast 10) `adminKeys.stats` netrefí. Grep `adminKeys.stats`/`['admin','stats']` mimo `features/admin` = 0. Jádro C-51 pro world/content osu tedy **stále otevřené** — reportuji jako ♻️ (známé, nenavyšovat), ale oblast 12 by neměla být značená jako plně vyřešená.

## Nové nálezy (🆕)

### 🆕 C-RUN-12a · `FO`/parity · 🟡 — reject username request míjí `adminKeys.stats` (asymetrie s approve)
- **Osa:** FO (P1). Sub-gap C-51 fixu, přehlédnutý i checkpointem oblasti 02 (ten reject ověřil jen na audit-log/pending-actions).
- **Kde:** `useAdminApproveUsernameRequest` invaliduje `adminKeys.stats` ([useAdminUsers.ts:339](../../../../src/features/admin/users/api/useAdminUsers.ts#L339)), ale `useAdminRejectUsernameRequest` onSuccess ([useAdminUsers.ts:462-468](../../../../src/features/admin/users/api/useAdminUsers.ts#L462)) invaliduje jen `usernameRequests`+`users`+`auditLog`+`pending-actions` — **NE** `adminKeys.stats`.
- **Rozpor:** reject **i** approve odeberou žádost z pending → dekrementují `queue.pendingUsernameRequests`. Approve dashboard county obnoví, reject ne.
- **Trigger:** admin odmítne username žádost → přepne na záložku Přehled. **Viditelnost:** klikatelný accent badge „Žádosti o username" (`to="/ikaros/uzivatele?tab=zpracovat"`, [OverviewTab.tsx:129-140](../../../../src/features/admin/components/OverviewTab/OverviewTab.tsx#L129)) drží starý (o 1 vyšší) count. **Workaround:** F5 / staleTime 60s + refetchOnMount tabu. Tichý drift, žádná chyba.
- **Závažnost:** 🟡 — týž widget jako C-51 (🟠 třída akční fronty), ale reziduum je jediný vynechaný řádek v jinak kompletním fixu + reject je řidší akce než approve.
- **Návrh:** přidat `qc.invalidateQueries({ queryKey: adminKeys.stats })` do `useAdminRejectUsernameRequest.onSuccess` (parita s approve `:339`).

### 🆕 C-RUN-12b · `DEL`/P5 · 🟡 — smazání aktivní admin-chat konverzace nechá stránku na mrtvém kanálu
- **Osa:** DEL/LC (P5). Nová plocha 20.5 (admin chat), přidaná po sweepu 2026-06-05 → není v registru.
- **Kde:** `useDeleteAdminChannel` ([useAdminChat.ts:324-332](../../../../src/features/admin/chat/api/useAdminChat.ts#L324)) invaliduje jen `adminChatKeys.channels`. Delete se volá z `ChannelModal.remove` na **aktivní** konverzaci ([ChannelModal.tsx:94-96](../../../../src/features/admin/chat/components/ChannelModal.tsx#L94), `onSuccess: onClose`).
- **Rozpor:** `AdminChatPage.activeConvId` se po smazání **neresetuje**; auto-select prvního kanálu běží jen když `!activeConvId` ([AdminChatPage.tsx:110-115](../../../../src/features/admin/chat/pages/AdminChatPage.tsx#L110)). Po smazání: `activeConv=find()→undefined` (header fallback „Chat"), ale `useAdminChatMessages(activeConvId)` je **stále enabled** se smazaným ID ([AdminChatPage.tsx:118-120](../../../../src/features/admin/chat/pages/AdminChatPage.tsx#L118)) → dotaz na `/admin-chat/channels/{smazané}/messages` → 403/404. Chybí `removeQueries(messages(id))` i reset `activeConvId`.
- **Trigger:** superadmin smaže právě otevřenou konverzaci. **Viditelnost:** panel zprávy zůstane na mrtvém kanálu (prázdný/chybový fetch), žádný auto-přeskok na jiný kanál. **Workaround:** ručně kliknout na jinou konverzaci. Jen superadmin, self-inflicted, recoverable → 🟡.
- **Návrh:** v `ChannelModal.remove.onSuccess` (nebo v page handleru) po smazání: pokud `deletedId===activeConvId` → `setActiveConvId(null)` (spustí auto-select) + `qc.removeQueries({ queryKey: adminChatKeys.messages(deletedId) })`.

### 🆕 C-RUN-12c · `WS`/P4 · 🟡 (VERIFY) — admin-chat úkoly + dokumenty bez WS realtime (cross-admin staleness)
- **Osa:** WS/P4 (parita WS↔REST). Nová plocha 20.5.
- **Kde:** admin-chat **zprávy** mají plný realtime (`platform-chat:message`/`:deleted`/`:updated` + unread `platform-chat:activity`, [useAdminChat.ts:212-251](../../../../src/features/admin/chat/api/useAdminChat.ts#L212), [useAdminChatLive.ts:35](../../../../src/features/admin/chat/api/useAdminChatLive.ts#L35)). **Úkoly** ([useAdminTasks.ts](../../../../src/features/admin/chat/api/useAdminTasks.ts)) a **dokumenty** ([useAdminDocuments.ts](../../../../src/features/admin/chat/api/useAdminDocuments.ts)) mají jen REST invalidaci vlastní `list` — grep potvrdil **žádný** WS listener (`platform-chat:task`/`:document` neexistuje).
- **Rozpor:** úkol/dokument vytvořený/změněný adminem A se adminovi B s otevřeným panelem neobjeví přes push — jen default staleTime 30s + `refetchOnWindowFocus`. Lokální aktér vidí svou změnu (invalidate list) ✅; gap je jen cross-admin.
- **Trigger:** dva admini v `/admin/chat` současně; A přidá/odškrtne úkol → B ho hned nevidí. **Viditelnost:** tichý stale (bounded ≤30s / focus). **Workaround:** přepnutí okna / počkat. Interní low-freq nástroj → 🟡.
- **Návrh:** buď vědomě by-design (doplnit pozn. „úkoly/dokumenty nejsou realtime"), nebo BE emit `platform-chat:tasks:changed`/`:documents:changed` + FE listener invaliduje `adminTaskKeys.list`/`adminDocKeys.list`. → PROOF-REQUEST BE-1.

## ⚖️ By-design / bez nálezu (potvrzeno)

- **⚖️ analytics / growth / costs = orphan snapshoty (by-design, jako C-55).** `useAnalyticsSummary` ([useAnalyticsSummary.ts:12](../../../../src/features/admin/api/useAnalyticsSummary.ts#L12)), `useGrowthStats` ([useGrowthStats.ts:13](../../../../src/features/admin/api/useGrowthStats.ts#L13)), `useCostStats` ([useCostStats.ts:12](../../../../src/features/admin/api/useCostStats.ts#L12)) — read-only agregáty s těžkou BE cache (5 min–1 h), FE staleTime 60s–5min. Žádná mutace je neinvaliduje a ani by neměla (časové řady). Nový povrch po sweepu, ale ne bug.
- **✅ send/delete/reaction admin-chat message.** `handleSend` používá call-site `onSuccess` setQueryData append ([AdminChatPage.tsx:187-198](../../../../src/features/admin/chat/pages/AdminChatPage.tsx#L187)) — CB-drop při unmountu pokryt WS echem + dedupe (`old.some(m.id===)`). `useDeleteAdminMessage` setQueryData tombstone + WS potvrzení. `useSocketReconnect` re-join + invalidate historie ([useAdminChat.ts:206-210](../../../../src/features/admin/chat/api/useAdminChat.ts#L206), FIX-4/C-05 vzor). Čisté.
- **✅ DeletedWorldsTab restore.** `useRestoreWorld` → `['worlds']` prefix-matchuje `['worlds','deleted']` ([useWorldLifecycle.ts:28,54](../../../../src/features/world/api/useWorldLifecycle.ts#L28)) → obnovený svět zmizí z tabu ✅. (Stats `worlds.total` gap = ♻️ C-51 výše.)
- **✅ tasks/documents lokální CRUD.** create/update/delete → invalidate vlastní `list` ([useAdminTasks.ts:34,50,58](../../../../src/features/admin/chat/api/useAdminTasks.ts#L34), [useAdminDocuments.ts:28,38,47](../../../../src/features/admin/chat/api/useAdminDocuments.ts#L28)). M-CEN čistý.

## PROOF-REQUESTy

- **BE-1 (+ws parita):** Emituje BE jakýkoli WS event pro admin-chat **tasks/documents**? Pokud NE → C-RUN-12c je potvrzený parita-gap (buď dokumentovat jako by-design, nebo doplnit emit+listener). Pokud ANO → chybí FE listener.
- **RT-1 (M4 runtime):** Ověřit C-RUN-12b — superadmin smaže aktivní konverzaci → sledovat, zda `useAdminChatMessages` hodí 403/404 na smazaný kanál a UI zůstane bez auto-přeskoku.

## Pokrytí

- **Query hooky (konzumenti):** useAdminStats, useSearchIndexStats, useWorldSearch (C-55), useAdminFriendshipByPair/ByUser, useAdminAuditLog, useAdminUsers, useAdminUsernameRequests, useAnalyticsSummary, useGrowthStats, useCostStats, useAdminChatChannels/Messages/Unread(+Total)/Staff/Tasks/Documents, useDeletedWorlds — všechny přečteny.
- **Mutace (writers):** useRebuildSearchIndex, useAdminResetCooldown, 14× useAdminUsers (role/supporter/ban/unban/request+cancel-deletion/permissions/approve/reject/bulk×3), admin-chat 11× (send/delete/upload/reaction/markRead/create+update+delete channel, tasks×3, documents×3), useRestoreWorld — přečteny do plné hloubky.
- **Orphan/parita sken:** grep `adminKeys.stats`/`['admin','stats']`/`admin-chat`/`platform-chat:*` přes celý `src`. `adminKeys.stats` writer výhradně `features/admin` (world/content osa 0 → ♻️ C-51). WS listenery pro tasks/docs = 0 (C-RUN-12c).
- **Mimo scope (jen zmíněno):** world lifecycle invalidace (03), content stats writers (10) — cross-oblast, zde jen doloženo, že `adminKeys.stats` nikde netrefí.

## Shrnutí

- **🆕 3:** C-RUN-12a 🟡 (reject username → stats parity gap), C-RUN-12b 🟡 (DEL — smazaná aktivní konverzace = mrtvý kanál), C-RUN-12c 🟡/VERIFY (tasks/docs bez WS realtime).
- **♻️ 5:** C-54 opraveno · C-52 opraveno · C-53/C-55 beze změny · **C-51 jen částečně** (world/content stats osa přetrvává — oblast neznačit jako plně dořešenou).
- **2 PROOF-REQUESTy** (BE WS emit tasks/docs; runtime delete-active-channel).
- Dosažená hloubka **L2**.
