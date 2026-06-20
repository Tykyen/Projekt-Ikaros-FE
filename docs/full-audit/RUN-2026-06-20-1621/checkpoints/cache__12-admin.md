# cache / 12-admin — checkpoint RUN-2026-06-20-1621

> Auditor: plný hloubkový audit oblasti 12 (Admin) cache-invalidation TanStack Query.
> HEAD: main, 2026-06-20.

## Pokrytí

Prošel jsem VEŠKERÝ admin cache kód:
- `src/features/admin/api/adminKeys.ts` — centrální factory (C-54 fix)
- `src/features/admin/api/useAdminStats.ts` — dotaz stats
- `src/features/admin/api/useSearchIndex.ts` — dotaz + mutace rebuild
- `src/features/admin/friendships/api/useAdminFriendships.ts` — dotazy + mutace cooldown reset
- `src/features/admin/users/api/useAdminUsers.ts` — všechny mutace (ban/unban/role/perms/delete/cancel/bulk/approve/reject) + dotazy
- `src/features/admin/users/api/useAdminUsers.spec.tsx` — testovací pokrytí C-51/C-52/C-54
- `src/features/admin/friendships/api/__tests__/useAdminResetCooldown.spec.tsx` — test cooldown resetu
- `src/features/admin/components/OverviewTab/OverviewTab.tsx` — konzument stats
- `src/features/admin/components/SearchIndexTab/SearchIndexTab.tsx` — konzument + rebuild call-site
- `src/features/admin/users/components/AuditLogTab/AuditLogTab.tsx` — konzument audit-log (ACTION_LABELS)
- `src/features/admin/pages/PlatformAdminPage.tsx` — tab architektura
- `src/features/world/api/useWorldLifecycle.ts` — useDeletedWorlds + useRestoreWorld + useDeleteWorld
- `src/features/admin/components/DeletedWorldsTab/DeletedWorldsTab.tsx` — nová záložka, nový povrch
- `src/features/ikaros/api/useIkarosNews.ts` — archive/unarchive/delete mutace, auditované
- BE: `backend/src/modules/admin/interfaces/admin-audit-log.interface.ts` — AdminAuditAction enum
- BE: `backend/src/modules/ikaros-news/ikaros-news.service.ts` — logování IKAROS_NEWS_* do audit logu

Cross-reference:
- Plán 12-admin.md + cache-audit.md (stav před tímto auditem: ✅ opraveno C-51..C-54)
- AuditLogTab ACTION_LABELS (8 akcí ve FE, z toho 3 IKAROS_NEWS_*)

## Dosažená L vs cílová L

| Konzument | L dosažená | Cíl |
|---|---|---|
| adminStats (`[...adminKeys.stats,'overview']`) | L3 — testy C-51 zelené pro updateRole/ban/bulkBan/approve | L2+ |
| search-index-stats (STATS_KEY) | L2 — KM ověřen (self-contained const) | L2 |
| adminFriendships by-pair/by-user | L2 — factory + KM ověřen | L2 |
| audit-log (`[...adminKeys.auditLog, query]`) | L3 — testy C-52 zelené; **GAP: IkarosNews+reject bez test** | L2+ |
| worlds/deleted (DeletedWorldsTab — nový povrch) | L1 — read | L2 |

Celková L oblasti: **L3 (testy) pro uživatelské admin mutace; L1 pro nové povrchy (IkarosNews, DeletedWorldsTab)**

## Nálezy

### C-RUN-01 · FO · `useAdminRejectUsernameRequest` neinvaliduje `adminKeys.stats`
- **Kde:** `src/features/admin/users/api/useAdminUsers.ts:430–442`
- **Problém:** `onSuccess` invaliduje `usernameRequests`, `users`, `auditLog`, `pending-actions` — ale **chybí `adminKeys.stats`**. Přitom `queue.pendingUsernameRequests` v adminStats klesá po každém reject. Oproti tomu `useAdminApproveUsernameRequest` (řádek 307) stats invaliduje.
- **Dopad:** Admin zamítne žádost o username → záložka Přehled drží starý počet „Žádostí o username" v kartě Fronty (s `tone:'accent'` odznakem a odkazem `/ikaros/uzivatele?tab=zpracovat`) do 60s staleTime. Asymetrie: approve obnoví, reject ne.
- **Workaround:** F5 nebo přepnutí na jinou záložku + zpět do Přehledu (refetchOnMount po 60s).
- **Návrh:** přidat `qc.invalidateQueries({ queryKey: adminKeys.stats });` do `useAdminRejectUsernameRequest` onSuccess (parita s approve).
- **L1** · 🆕

### C-RUN-02 · FO · IkarosNews admin mutace neinvalidují `adminKeys.auditLog`
- **Kde:** `src/features/ikaros/api/useIkarosNews.ts:103–134` (useArchiveIkarosNews, useUnarchiveIkarosNews, useDeleteIkarosNews)
- **Problém:** BE loguje `IKAROS_NEWS_ARCHIVE`, `IKAROS_NEWS_UNARCHIVE`, `IKAROS_NEWS_DELETE` do `AdminAuditLog` (ověřeno: `ikaros-news.service.ts:201,228,251`). FE mutations invalidují jen `NEWS_KEY` (`['ikaros-news']`) — žádná z nich neinvaliduje `adminKeys.auditLog`. Záznam v `ACTION_LABELS` v `AuditLogTab.tsx:16–18` potvrzuje, že FE audit log zobrazuje tyto akce.
- **Dopad:** Admin archivuje/smaže ikaros novinku → přepne na záložku Audit log → chybí právě provedená akce (archivace/smazání). Triviálně zmírněno cross-tab unmountem (refetchOnMount zabere při přepnutí), ale při otevřeném audit logu v druhém panelu trvale stale.
- **Workaround:** přepnutí záložky/F5.
- **Návrh:** importovat `adminKeys` do `useIkarosNews.ts` a přidat `qc.invalidateQueries({ queryKey: adminKeys.auditLog })` do `onSuccess` tří auditovaných mutací (archive/unarchive/delete). Alternativa: centrální helper `invalidateAdminAudit(qc)`.
- **L1** · 🆕

### C-RUN-03 · FO/LC · `useRestoreWorld` a `useDeleteWorld` neinvalidují `adminKeys.stats` (worlds.total)
- **Kde:** `src/features/world/api/useWorldLifecycle.ts:17–57`
- **Problém:** `useRestoreWorld.onSuccess` invaliduje jen `['worlds']` (broadcastuje smazané/aktivní světy). `useDeleteWorld.onSuccess` tamtéž. Ale admin dashboard karta „Celkem světů" čte `adminStats.worlds.total` z `[...adminKeys.stats,'overview']` — a ta se po restore/delete neinvaliduje.
- **Dopad:** Admin obnoví nebo smaže svět → záložka Přehled drží starý počet světů 60s. Mírný dopad (čistě informační, není to akční fronta s odznakem).
- **Workaround:** F5 nebo wait 60s.
- **Návrh:** přidat `qc.invalidateQueries({ queryKey: adminKeys.stats })` do obou mutací. Pozn.: `adminKeys` by bylo nutné importovat do `useWorldLifecycle.ts` (cross-feature dep) — alternativně jen prefix `['admin','stats']` inline.
- **L1** · 🆕

## PROOF-REQUEST

### PROOF-1 · M3/M5 — Invalidační testy pro IkarosNews mutace (C-RUN-02)
Žádný existující test neověřuje, že `useArchiveIkarosNews` / `useUnarchiveIkarosNews` / `useDeleteIkarosNews` invalidují `adminKeys.auditLog`. Před opravou: napsat vitest spy test v `useIkarosNews.spec.ts` (nebo nový soubor), vzor viz `useAdminUsers.spec.tsx`.

### PROOF-2 · M3 — Test pro `useAdminRejectUsernameRequest` na `adminKeys.stats` (C-RUN-01)
`useAdminUsers.spec.tsx` testuje approve+auditLog, ale test „reject invaliduje stats" chybí. Existující test na řádku 183–195 ověřuje auditLog+users, ne stats.

### PROOF-3 · M4 — Runtime ověření world restore/delete → dashboard counter (C-RUN-03)
Vyžaduje živé prostředí (live infra) — soft-smaž svět, zkontroluj counter před/po obnově. Bez M4 je tento nález L1.
