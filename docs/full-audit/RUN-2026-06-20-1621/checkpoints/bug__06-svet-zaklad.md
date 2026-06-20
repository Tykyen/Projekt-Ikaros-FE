# bug / 06-svet-zaklad — checkpoint RUN-2026-06-20-1621

## Pokrytí

### Soubory prošlé (HEAD):
**BE:**
- `worlds.controller.ts` — všechny endpointy, guardy, parametry
- `worlds.service.ts` — celý (joinPublic, requestAccess, approveAccessRequest, leave, updateMemberRole, updateSettings, sanitizeThemeOverrides, assertMember, canAdminWorld, canManageMembers, canEditWorldData, transferOwnership, requestCharacter, assertMembershipInWorld, isSlugAvailable, create, update, renameSlug, softDelete, restore, updateCalendarDefaults, updateAkjTypes, updateMyTheme, updateMyPjAvatar, getDiarySchemaVersions, getDiarySchemaVersion, enrichMembers, getSettingsForRequester, toPublicSettings)
- `worlds.gateway.ts` — handleWorldUpdated, handleWorldDeleted, handleMembershipChanged, handleMembershipRemoved, handleAccessRequested, handleAccessApproved, handleAccessRejected, handleAccessCancelled, handleWorldNewsChanged, handleConnection
- `worlds.repository.ts` — findAll, findByCurrentOrPreviousSlug, renameSlug, findByIds, existsBySlug, increment
- `world-news.controller.ts` — všechny endpointy
- `world-news.service.ts` — findMany, count, findById, create, update, delete, archive, unarchive, assertCanReadScope, assertCanWrite
- `update-member.dto.ts` — všechny DTO
- `world-membership.interface.ts` — WorldRole enum
- `worlds.controller.spec.ts` (přečten, velmi slabé pokrytí)
- `universe.gateway.ts`

**FE:**
- `WorldLayout.tsx` — celý (isPJ, isPJForNav, showFullNav, nav, persona, worldTheme)
- `WorldContext.tsx` (import)
- `WorldMembershipGuard.tsx` — celý
- `WorldDashboardPage.tsx` — celý
- `WorldMembersPage.tsx` — celý
- `WorldSettingsPage.tsx` — celý (TABS array, tab gating)
- `MembershipTab.tsx` — celý
- `AccessModeTab.tsx` — celý
- `AkjTab.tsx` — celý
- `ThemeTab.tsx` — celý
- `MyThemeTab.tsx` — celý
- `WorldNewsPage.tsx` — celý
- `useWorldStatus.ts` — celý
- `useWorlds.ts` — celý (useWorld slug vs ObjectId)
- `useWorldAccessSocket.ts` — celý
- `useWorldAccessSocket.spec.tsx`
- `useWorldSocket.ts` — celý
- `useWorldNews.ts` — celý
- `useUpdateMyWorldTheme.ts`
- `useUpdateWorld.ts`
- `isWorldPlayer.ts`

### Osy prošlé:
A (Vytvoření & detail) ✅ L1-L2
B (Membership & join flow) ✅ L1-L2
C (World role & oprávnění) ✅ L1-L2
D (Nastavení světa) ✅ L1-L2
E (Členové / skupiny / pravidla / novinky) ✅ L1-L2
F (WS signály a real-time) ✅ L1-L2

### M-metody použité:
M1 (statické čtení), M2 (kontrakt FE↔BE), M4 (auth gating, role guardy)

## Dosažená L vs cílová L

L2 / cílová L3 — kód přečten a cross-referován (FE←→BE), ale žádné spuštěné existující testy.
Test coverage oblast 06 je slabá (worlds.controller.spec.ts = jen 2 testy: defined + findAll;
worlds.gateway.spec.ts existuje ale nebyl čten). Proof-request pro L3 u kritických cest níže.

## Nálezy

### N-RUN-01 — [A/SZ-37] assertMember blokuje Ctenar(1), ne jen Zadatel(0)
- **Kde:** `worlds.service.ts:1934` — `if (membership.role < WorldRole.Hrac)`
- **Dopad:** Spec SZ-37 dokumentuje "odmítne Zadatel(0)", ale kód odmítá `< Hrac(2)` → Ctenar(1) také dostane 403 na `GET /worlds/:id/diary-schema-versions`. Ctenar je legitimní člen který smí číst svět, ale diary schema (šablona deníku postavy) je interní PJ nástroj → blokování Čtenáře je pravděpodobně záměrné, jen nedokumentované.
- **Dopad:** Nízký — diary schema versions žádné FE UI nevolá pro Ctenar (jen editor PJ); žádný praktický uživatelský dopad.
- **Návrh:** Opravit dokumentaci SZ-37 ("odmítne Zadatel(0) a Ctenar(1)") nebo přidat komentář do kódu. Žádná kódová změna potřebná.
- **L1** — statické čtení
- **Klasifikace:** 🟡 🆕 (spec-vs-kód nesrovnalost, nefunkční bug)

### N-RUN-02 — [B/SZ-22] world.character.requested event bez WS gateway handleru → PJ nevidí žádost v real-time
- **Kde:** `worlds.service.ts:1201` emit `world.character.requested`; `worlds.gateway.ts` — žádný `@OnEvent('world.character.requested')` handler
- **Dopad:** Když Ctenar požádá o postavu (role → Zadatel), PJ nedostane žádný WS push. FE member cache se neinvaliduje (`['worlds', worldId, 'members']`). PJ musí ručně obnovit stránku nebo počkat do next navigation. Pending actions jsou bez WS signálu.
- **Návrh:** Buď (a) přidat `@OnEvent('world.character.requested')` do WorldsGateway který emituje `world:membership:changed` do `world:{worldId}` roomu, nebo (b) přidat `world:pending-character` event do `user:{ownerId}` (lépe — PJ nemusí být v `world:{id}` roomu). Nízká priorita — workflow funguje, jen bez live update.
- **L1** — statické čtení + grep FE/BE
- **Klasifikace:** 🟡 🆕 (UX gap, žádná datová korupce)

### N-RUN-03 — [C/SZ-32] BE `GET /worlds/:id/members` — spec říká "bez JwtAuthGuard" ale teď má OptionalJwtAuthGuard
- **Kde:** `worlds.controller.ts:301` — `@UseGuards(OptionalJwtAuthGuard)` a `getMembers` volá `findByIdForRequester(worldId, requester)` kde `requester` může být null
- **Dopad:** Spec SZ-32 říká "endpoint bez JwtAuthGuard: kdokoli (anon) může listovat členy světa". Ale N-7 byl opravený — nyní `OptionalJwtAuthGuard` + `findByIdForRequester` vrací 404 pro private svět bez přístupu. Anonymní uživatel vidí členy jen public/open světa (applyDetailScope propustí). Tato situace je **správná** (oprava N-7), ale SZ-32 spec body jsou stale (říká "bez JwtAuthGuard" a "záměrně veřejný"). Spec bod je zastaralý.
- **Návrh:** Aktualizovat spec bod SZ-32 — endpoint má `OptionalJwtAuthGuard`, members private světa jsou anonymnímu přístupu skryté (N-7 fix). Žádná kódová změna.
- **L1** — statické čtení
- **Klasifikace:** 🟡 🔓 (otevřená spec-vs-kód nesrovnalost, byl N-7)

### N-RUN-04 — [D/SZ-44] AccessModeTab: mode state se neresetuje po externím změně world.accessMode
- **Kde:** `AccessModeTab.tsx:49-50` — `useState(world?.accessMode ?? 'private')` bez `useEffect` reset
- **Dopad:** Pokud jiný admin změní accessMode světa (WS `world:updated` → world refetch → world.accessMode = nová hodnota), lokální `mode` state zůstane stale. Vizuálně PillChips ukazuje starou volbu, `dirty = mode !== world.accessMode` bude true → Uložit tlačítko povolené i bez záměrné změny uživatele. Pokud uživatel klikne Uložit, přepíše novou hodnotu starší.
- **Návrh:** Přidat `useEffect` který synchronizuje `mode` při změně `world.accessMode`: `useEffect(() => { setMode(world?.accessMode ?? 'private'); }, [world?.accessMode]);`
- **L1** — statické čtení + logická dedukce
- **Klasifikace:** 🟠 🆕 (reálný bug — vlastník A změní mode, vlastník B (open tab) neví a přepíše zpět)

## PROOF-REQUEST

### PR-01 — L3 test: worlds.service.ts kritické cesty
Spustit `npx jest --testPathPattern=worlds.service.spec.ts --maxWorkers=2` (BE).
Ověřit: joinPublic → 409 pri duplicate; approveAccessRequest → tx fallback bez replica set; requestAccess → 409 WORLD_ALREADY_MEMBER; updateMemberRole → ceiling check PomocnyPJ; assertMember → Ctenar 403.

### PR-02 — L3 test: worlds.gateway.spec.ts
Spustit `npx jest --testPathPattern=worlds.gateway.spec.ts --maxWorkers=2` (BE).
Ověřit: handleMembershipChanged, handleMembershipRemoved, handleAccessCancelled jsou v testu pokryty (plan notes: nebyly dřív).

### PR-03 — L3 test: world-news.service.spec.ts
Spustit `npx jest --testPathPattern=world-news.service.spec.ts --maxWorkers=2`.
Ověřit: assertCanReadScope → scope=archived bez tokenu → 401; create → worldId=null non-admin → 403.

### PR-04 — FE vitest: WorldLayout.spec.tsx
Spustit `npx vitest run --project '!storybook' WorldLayout`.
Ověřit: isPJ flag pro PomocnyPJ membership (ne jen owner+admin).

### PR-05 — Manuální (human): AccessModeTab stale state (N-RUN-04)
Otevřít svět jako PJ ve dvou záložkách. V záložce A přepnout na 'open' a uložit. V záložce B ověřit, zda AccessModeTab stále ukazuje původní hodnotu (stale state) a jestli Uložit je povolené.
