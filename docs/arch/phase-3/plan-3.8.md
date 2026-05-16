# Plán 3.8 — Badge pending akcí u nav Diskuze / Články / Galerie

**Spec:** [spec-3.8.md](spec-3.8.md) — schválena 2026-05-16
**Pořadí:** BE rozpad `byType` → FE typy → FE hook → FE layout/badge → testy.

---

## Frontend-design audit (verdikt)

Badge = malý číselný pill, **atention signál pro moderátora**. Závěr auditu:
**žádný nový design — reuse `s.navItemBadge`.**

- Třída `.navItemBadge` ([IkarosLayout.module.css:282](../../../src/app/layout/IkarosLayout/IkarosLayout.module.css#L282))
  už existuje, používá theme tokeny `--tab-badge-bg` / `--tab-badge-fg` /
  `--radius-full` → drží napříč 21 motivy bez zásahu.
- `.navItemLabel` má `flex: 1` → badge se vloží jako 3. flex-child `NavItem`u
  za label, bez úpravy layoutu.
- Vymýšlet pro badge vlastní distinktivní vizuál by **rozbilo** konzistenci
  motivů (badge je systémový prvek, ne hero). Restraint = správná volba.
- Jediný CSS dodatek: nic. Reuse 1:1.

---

## BE — `Projekt-ikaros`

### B1. `pending-actions.service.ts` — `countForUser` → `{ total, byType }`

Změnit návratový typ:

```ts
async countForUser(
  userId: string,
  role: UserRole,
  adminPerms?: AdminPermissions,
): Promise<{ total: number; byType: Partial<Record<PendingActionType, number>> }> {
  let total = 0;
  const byType: Partial<Record<PendingActionType, number>> = {};
  for (const provider of this.providers.values()) {
    const ok = await provider.canHandle(userId, role, adminPerms);
    if (!ok) continue;
    const count = await provider.countForUser(userId, role);
    byType[provider.type] = count;
    total += count;
  }
  return { total, byType };
}
```

Provideři, které uživatel nevidí (`canHandle` false), v `byType` nejsou.

### B2. `pending-actions.controller.ts` — `getCount`

```ts
async getCount(@CurrentUser() requester: Requester) {
  return this.service.countForUser(
    requester.id, requester.role, requester.adminPermissions,
  );
}
```

Návratový typ `{ total, byType }`. `@ApiResponse` description aktualizovat.

### B3. `pending-actions.service.spec.ts`

- Mock provider `countForUser` zůstává; aserce přepsat z `total` (number) na
  `result.total` + `result.byType`.
- Nový test: `byType` obsahuje jen typy s `canHandle === true`; `total` = suma
  hodnot `byType`; uživatel bez práv → `byType` prázdné, `total === 0`.

### B4. Ověření

`npm test` v `backend/`.

---

## FE — `Projekt-ikaros-FE`

### F1. `shared/types/index.ts`

```ts
export interface PendingActionsCountResponse {
  total: number;
  byType: Partial<Record<PendingActionType, number>>;
}
```

`PendingActionType` enum už existuje v témže souboru — stačí použít.

### F2. `features/users/api/usePendingActions.ts`

Bez změny logiky — `usePendingActionsCount` jen vrací nový tvar (typ se
propíše z `PendingActionsCountResponse`). Komentář doplnit o `byType`.

### F3. `app/layout/IkarosLayout/IkarosLayout.tsx`

1. Import `PendingActionType` z `@/shared/types`.
2. `NavItemDef` + `pendingType?: PendingActionType`.
3. `PRIMARY_NAV` — doplnit u tří položek:
   - `diskuze`  → `PendingActionType.DiscussionPendingReview`
   - `clanky`   → `PendingActionType.ArticlePendingReview`
   - `galerie`  → `PendingActionType.GalleryPendingReview`
4. `SidebarContent` — zavolat `usePendingActionsCount(isAuthenticated)`,
   předat `byType` do `NavItem` přes prop `pendingByType`.
5. `NavItem` — nová prop `pendingByType?: Partial<Record<PendingActionType, number>>`.
   Spočítat `count = pendingType ? pendingByType?.[pendingType] ?? 0 : 0`.
   Když `count > 0`:
   ```tsx
   <span className={s.navItemBadge} aria-label={`${count} čeká na schválení`}>
     {count}
   </span>
   ```
   Tooltip: `title` na `NavLink` — per doména („{n} článků čeká na schválení"
   / „{n} obrázků…" / „{n} diskuzí…"). Skloňování přes existující util, jinak
   jednoduchá funkce `domainTooltip(pendingType, count)`.

⚠️ `usePendingActionsCount` se v layoutu volá i dnes (RightPanel, badge
„Uživatelé"). React Query query je sdílená (`['pending-actions','count']`) —
druhé volání v `SidebarContent` nestojí extra request.

### F4. `IkarosLayout.module.css`

Beze změny — `navItemBadge` reuse.

### F5. Test — `IkarosLayout.spec.tsx` (nový, lehký)

Render `SidebarContent` (nebo `IkarosLayout`) s:
- mock `usePendingActionsCount` → `{ total: 5, byType: { article_pending_review: 5 } }`
  → u „Články" je badge `5`, u „Diskuze"/„Galerie" badge není.
- mock `byType: {}` → žádný z tří badge.
- anonym (`isAuthenticated=false`) → hook disabled, žádný badge.

Mock přes `vi.mock` na `usePendingActions` modul + ostatní layout hooky
(`useMyWorlds`, `usePublicWorlds`, `useUnreadCount`) stub na prázdná data.

### F6. Ověření

`npm run lint`, `lint:colors`, `test:run`, `tsc`, `build`.

---

## Po implementaci

1. `mobil-desktop` skill — badge v drawer nav na ≤ 768 px.
2. `napoveda` skill — změna funkčnosti (moderátor vidí počty) → aktualizovat
   `/ikaros/napoveda` pokud popisuje moderaci.
3. Roadmap — zaškrtnout 3.8 v `docs/roadmap-fe.md` (přidat sekci).
4. Commit do `main` v obou repech (konvence 3.x).

---

## Odhad

| Část | Soubory | Řádky |
|---|---|---|
| BE | 3 | ~40 |
| FE | 4 + 1 test | ~90 |
