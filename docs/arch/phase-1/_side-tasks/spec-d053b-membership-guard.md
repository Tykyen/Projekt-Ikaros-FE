# Spec D-053b — Per-world membership guard (FE + BE)

**Status:** ✅ Done (2026-05-14)
**Rozsah:** FE + BE — střední (FE ~3–4 soubory + testy, BE ~2 soubory + testy)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (backend)
**Velikost odhad:** ~10 souborů změněno, ~250 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-14
**Souvisí:** [spec-d053-role-architecture-cleanup.md](spec-d053-role-architecture-cleanup.md) (toto je follow-up), dluh **D-053b** v `docs/dluhy.md`.

---

## 1. Cíl

Po dokončení D-053 (odstranění world-scoped rolí z globálního `UserRole`) **vrátit world PJ přístup** k per-world admin endpointům a per-world admin route stránkám, ale **membership-based**: PJ daného světa povolen, PJ jiného světa NE.

Konkrétně:

- **BE:** `MapsService.moveToken`/`removeToken` rozšířit o `worldId` parametr a ověřovat `WorldMembership.role >= WorldRole.PJ` v daném světě (místo globálního `UserRole.PJ` jak před D-053).
- **FE:** Nahradit `RoleGuard roles={[Superadmin, Admin]}` ve 3 per-world admin route komponentou `WorldMembershipGuard`, která navíc konzultuje `WorldContext.userRole`.

---

## 2. Kontext / motivace

### Co D-053 změnilo

D-053 odstranil `UserRole.PJ`, `Korektor`, `Hrac`, `Ctenar`, `Zadatel` z globálního enumu — všechny patří do `WorldRole`. Důsledek: kódové cesty, které historicky spoléhaly na *„globální PJ"*, ztratily kontrolu, kterou kdy povolovala.

Dvě konkrétní místa byly **dočasně zúžena** v rámci D-053:

1. **BE `maps.service.ts`** — `moveToken`/`removeToken` dnes povolují jen `Superadmin`/`Admin` (z globálního pohledu). World PJ daného světa nemůže ve své vlastní bitvě hýbat tokeny.
2. **FE `router.tsx`** — 3 per-world admin routes (`/svet/:worldId/admin/stranky`, `/svet/:worldId/admin/adresar-postav`, `/svet/:worldId/admin/dungeons`) ChroněnyRoleGuard limited na `Superadmin`/`Admin`. PJ světa nemůže administrovat *vlastní* svět.

### Co D-053b vrací

Per-world admin akce (BE + FE) **musí povolit i PJ daného světa**, ne každého PJ napříč platformou. To znamená:

- BE: membership lookup (`WorldMembership` tabulka) → ověřit, že volající má v daném `worldId` roli `WorldRole.PJ` nebo vyšší.
- FE: nová komponenta `WorldMembershipGuard` (analog `RoleGuard`) konzultuje `WorldContext.userRole` (membership-based, ne `User.role`).

### Proč to teď

Dluh nese štítek **"Před fází 5 (world layer), nebo při explicitní stížnosti world PJ"**. Fáze 5 je teprve v plánu (svět-základ), ale:

- Pokud někdy postavíme detail světa s admin akcemi, narazíme.
- Memory `feedback_platform_vs_world_roles` říká: `PJ je world-scoped, do platformy nepatří` — D-053b finalizuje *funkční dopad* tohoto pravidla.
- Stav je dnes nekonzistentní: D-053 jen *zúžila*, neopravila. Existují TODO komentáře v `router.tsx` (řádky 133, 173, 182) které tento dluh explicitně připomínají.

---

## 3. Audit současného stavu

### BE — `maps.service.ts`

> **Nutné si dohledat při schválení.** Spec nepřečetl konkrétní `maps.service.ts:moveToken/removeToken` v BE repu — doplnit v implementační fázi. Pravděpodobně:
> - Aktuální signatura: `moveToken(mapId, tokenId, position, requester: { id, role })`.
> - Po D-053b: `moveToken(mapId, tokenId, position, requester: { id }, worldId)` + `WorldMembershipRepository` lookup.

### FE — `RoleGuard.tsx`

```tsx
// src/features/admin/components/RoleGuard.tsx
export function RoleGuard({ roles, children }: Props) {
  const user = useAtomValue(currentUserAtom);
  if (!user || !roles.includes(user.role)) return <ForbiddenPage />;
  return <>{children}</>;
}
```

— jednoduchý guard, čte `currentUserAtom.role` (globální).

### FE — `router.tsx` per-world routes (řádky ~130–186)

3 routes pod `WorldLayout` (s `WorldContext` providerem):

| Route | Page | TODO komentář |
|---|---|---|
| `/svet/:worldId/admin/dungeons` | `DungeonBuilderPage` | `D-053 — UserRole.Ikarus odebrán; per-world PJ je D-053b` |
| `/svet/:worldId/admin/stranky` | `PagesAdminPage` | `D-053 — UserRole.Ikarus odebrán; per-world PJ je D-053b` |
| `/svet/:worldId/admin/adresar-postav` | `NPCDirectoryPage` | `D-053 — UserRole.Ikarus odebrán; per-world PJ je D-053b` |

Všechny tři dnes mají `RoleGuard roles={[Superadmin, Admin]}`.

### FE — `WorldContext`

Existuje, vrací `{ worldId, world, isPJ, userRole, loading }` (podle [roadmap-fe.md:56](../../../roadmap-fe.md#L56)). `userRole` je membership-based, perfektní zdroj.

---

## 4. Návrh řešení

### BE

#### 4.1 `MapsService.moveToken` / `removeToken`

- Přidat `worldId: string` parameter (povinný).
- Před akcí: lookup `WorldMembershipRepository.findByUserAndWorld(requester.id, worldId)`.
- Povolit pokud:
  - `requester.role <= UserRole.Admin` (globální Admin/Superadmin), NEBO
  - `membership.role >= WorldRole.PJ` (membership-based).
- Jinak `ForbiddenException({ code: 'NOT_WORLD_PJ' })`.

#### 4.2 Controller

- `MapsController` endpoints `POST /maps/:mapId/tokens/:tokenId/move` a `DELETE /maps/:mapId/tokens/:tokenId` musí předat `worldId`. Buď z body, nebo lookup přes `mapId → map.worldId`. (Preferuji lookup, abychom nezáviseli na klientovi.)

#### 4.3 Testy

- 4 nové scénáře:
  - Sa proběhne pro libovolný svět.
  - Admin proběhne pro libovolný svět.
  - World PJ daného světa proběhne.
  - World PJ JINÉHO světa → 403 `NOT_WORLD_PJ`.

### FE

#### 4.4 Nová komponenta `WorldMembershipGuard`

```tsx
// src/features/admin/components/WorldMembershipGuard.tsx
interface Props {
  minWorldRole: WorldRole;  // např. WorldRole.PJ
  fallbackGlobalRoles?: UserRole[];  // např. [Superadmin, Admin] (vždy povolené)
  children: ReactNode;
}

export function WorldMembershipGuard({ minWorldRole, fallbackGlobalRoles, children }: Props) {
  const user = useAtomValue(currentUserAtom);
  const { userRole: worldRole, loading } = useWorldContext();
  if (loading) return <Spinner />;
  // 1) globální fallback (Sa/Admin)
  if (user && fallbackGlobalRoles?.includes(user.role)) return <>{children}</>;
  // 2) membership-based check
  if (worldRole != null && worldRole >= minWorldRole) return <>{children}</>;
  return <ForbiddenPage />;
}
```

#### 4.5 `router.tsx` migrace

3 routes:

```tsx
<WorldMembershipGuard
  minWorldRole={WorldRole.PJ}
  fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
>
  {p(DungeonBuilderPage)}
</WorldMembershipGuard>
```

#### 4.6 Testy

- 5 scénářů (jeden komponentový test, parametrizovaný):
  - anon → ForbiddenPage.
  - Superadmin → projde bez ohledu na membership.
  - Admin → projde bez ohledu na membership.
  - PJ daného světa → projde.
  - Hrac daného světa → ForbiddenPage.

---

## 5. Otevřené otázky / rozhodnutí pro schválení

| # | Otázka | Návrh |
|---|---|---|
| Q1 | Má BE `worldId` přijít z body/path parametru, nebo se odvodit z `mapId`? | Odvodit z `mapId` (`MapsService.findById → map.worldId`) — klient se nezeptá špatně. Vyšší IO o 1 query, ale safer. |
| Q2 | Má `WorldMembershipGuard` přejmout `RoleGuard` (rename), nebo žít vedle? | Vedle. `RoleGuard` zůstává pro **čistě platformové** routes (`/ikaros/admin`). `WorldMembershipGuard` je per-world. Konvence: `RoleGuard` = globální only, `WorldMembershipGuard` = world-aware. |
| Q3 | Pokud `WorldContext.loading=true`, ukázat Spinner nebo ForbiddenPage? | Spinner — uživatel může být PJ a jen čekáme na membership data. Forbidden by ho blesklo zbytečně. |
| Q4 | Co s `WorldRole.Pending` (Žadatel)? | Implicit deny — `minWorldRole={WorldRole.PJ}` nepustí. Pending nikam admin routes nemá. |
| Q5 | Má guard rovnou redirectovat na `/svet/:worldId` (úvod světa), nebo zobrazit `ForbiddenPage`? | `ForbiddenPage` zatím — konzistentní s `RoleGuard`. Redirect můžeme přidat později. |

---

## 6. Dopad / breaking changes

- **BE:** `moveToken/removeToken` API surface zůstane stejný (z pohledu HTTP klienta), interně přibyde worldId lookup. **Žádný BC break.**
- **FE:** 3 routes získají nový guard. Test fixtures musí mockovat `WorldContext` v testech příslušných pages — drobná údržba.
- **TODO komentáře** v `router.tsx` budou odstraněny.

---

## 7. Hotová akceptační kritéria

- [ ] BE: world PJ daného světa může hýbat tokeny v dané mapě.
- [ ] BE: world PJ *jiného* světa dostane 403 `NOT_WORLD_PJ`.
- [ ] BE: existující Admin/Superadmin testy zelené.
- [ ] FE: `WorldMembershipGuard` komponenta existuje + testy.
- [ ] FE: 3 per-world admin routes používají `WorldMembershipGuard`.
- [ ] FE: TODO komentáře v `router.tsx` odstraněny.
- [ ] D-053b záznam v `docs/dluhy.md` přesunut z Otevřené do Uzavřené (s commitem).

---

## 8. Mimo rozsah

- Per-world admin sekce (sidebar / UI) — to je vlastní spec ve fázi 5.
- BE audit ostatních world-scoped endpointů kromě `maps.moveToken/removeToken` — pokud při auditu najdeme další místa s podobnou děrou, **založíme separátní dluhy**, ne implementujeme zde.
- `WorldRole` enum změny — D-053 už hotovo.

---

## 9. Status implementace

- [x] Spec schválen (2026-05-14)
- [x] Implementační plán napsán ([plan-d053b-membership-guard.md](plan-d053b-membership-guard.md))
- [x] Implementační plán schválen
- [x] BE kód — `MapsService.canManageWorld` predikát; `moveToken/removeToken` ho používají namísto `userRole <= UserRole.PJ`
- [x] FE kód — `WorldMembershipGuard` komponenta + migrace 2 per-world routes v `router.tsx`
- [x] Testy — BE +4 scénáře (maps.service.spec) **40/40**; FE +7 scénářů (WorldMembershipGuard.spec) **7/7**
- [x] Dluh uzavřen (přesun z `docs/dluhy.md` Otevřené)
