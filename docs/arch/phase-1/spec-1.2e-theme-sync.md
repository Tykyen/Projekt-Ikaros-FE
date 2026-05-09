# Spec 1.2e — Cross-device theme sync (D-003 + D-004)

**Status:** Draft — čeká na schválení
**Rozsah:** full-stack drobnost — nový BE endpoint + 2 řádky FE
**Repos:** BE `Projekt-ikaros`, FE `Projekt-ikaros-FE` — oba branch `feat/krok-1.2-registrace`
**Autor:** PJ + Claude
**Datum:** 2026-05-08

---

## 1. Cíl

Po loginu na 2. zařízení uvidět stejné téma jako na 1. zařízení (cross-device theme persistence).

Aktuálně FE volá `PATCH /users/me { themeId }`, BE endpoint neexistuje → 404 → tichý `console.warn`. Téma per-device přes localStorage funguje, cross-device nikoli.

---

## 2. Kontext — proč to teď

- 1.0b vytvořil multi-theme infrastrukturu (21 témat) + ThemeSwitcher.
- 1.1 přidal auth → po loginu má FE přístup ke `currentUserAtom`.
- 1.2 nyní hotová → pojďme uzavřít poslední drobnost theme stacku, abychom 1.0b/1.2 work mohli reálně užít cross-device.
- D-003 + D-004 popisované jako blokované BE — ale po auditu zjištěno, že cesta **C** (sjednocená v této spec-u) **nepotřebuje BE schema změnu**, jen 1 nový endpoint nad existující `update()` logikou.

---

## 3. Audit současného stavu

### 3.1 BE

[`backend/src/modules/users/users.controller.ts`](Projekt-ikaros/backend/src/modules/users/users.controller.ts):
- `GET /users/me` — vrací full profile přihlášeného (`getMe`, ř. 38-45).
- `PATCH /users/:id` — full update přes `UpdateUserDto`, vyžaduje `id === requester.id` || admin (ř. 139-160).
- `PUT /users/:id/theme` — užší endpoint pro `themeSettings` merge (ř. 121-137).

Service [`users.service.ts`](Projekt-ikaros/backend/src/modules/users/users.service.ts) má `update(id, dto)` (ř. 79-102), který **už deep-merguje `themeSettings`**:
```ts
if (dto.themeSettings != null) {
  updateData.themeSettings = { ...existing.themeSettings, ...dto.themeSettings };
}
```

DTO [`update-user.dto.ts`](Projekt-ikaros/backend/src/modules/users/dto/update-user.dto.ts):
```ts
@IsOptional() @IsObject() themeSettings?: Record<string, unknown>;
```

Schema `User.themeSettings: Record<string, unknown>` — freeform JSON.

### 3.2 FE

[`src/themes/useThemeSync.ts`](src/themes/useThemeSync.ts):
- **Inbound** (l. 20-24): `(user as { themeId?: string }).themeId` — type cast, čeká top-level `themeId` field.
- **Outbound** (l. 41): `api.patch('/users/me', { themeId })` — endpoint který neexistuje.

`User` typ [`src/types/index.ts:16-33`](src/types/index.ts#L16):
- Má `themeSettings: Record<string, unknown>`.
- Nemá `themeId` field (D-004 blokované na D-003).

### 3.3 Co chybí

**Mezera mezi FE a BE:**
- FE: `PATCH /users/me { themeId }` (top-level)
- BE: jen `PATCH /users/:id { themeSettings: {...} }` (nested)

→ FE volání nemá v BE protějšek.

---

## 4. Návrh řešení — cesta C

**Schválené v dialogu:** žádný nový schema field. Theme se ukládá do `User.themeSettings.themeId`. Nový endpoint `PATCH /users/me` jako pohodlný kontrakt pro current-user akce (žádný `id` v URL, FE nemusí znát ownId).

### 4.1 BE změny

**Nový endpoint** v `users.controller.ts`:

```ts
@Patch('me')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Aktualizace vlastního profilu (current user)' })
@ApiResponse({ status: 200, description: 'Profil aktualizován' })
@ApiResponse({ status: 401, description: 'Neautorizováno' })
updateMe(
  @Body() dto: UpdateUserDto,
  @CurrentUser() requester: Requester,
) {
  // Stejná logika jako PATCH /:id, ale pro current user — bez param `id`,
  // bez admin override, bez username change check (Superadmin změnu username
  // dělá explicitně přes PATCH /:id).
  if (dto.username !== undefined) {
    throw new ForbiddenException(
      'Změnu username může provést jen Superadmin přes PATCH /users/:id',
    );
  }
  return this.usersService.update(requester.id, dto);
}
```

**Pozice:** vložit **nad** `@Get('me')` (řádek 38) nebo logicky pod ním. Doporučuji bezprostředně po `@Get('me')` (ř. 46) pro symetrii GET/PATCH `/me`.

**Klíčové detaily:**
- Volá existující `usersService.update(id, dto)` — žádná service změna.
- Reuse-uje existující `UpdateUserDto` — žádný nový DTO.
- Username change na `/users/me` zakázán (klientovi by stejně Superadmin nepoužil tento endpoint, ale lepší explicitně blokovat než dovolit).
- Žádný admin override — `/users/me` je z definice "current user". Pokud admin chce měnit cizího usera, použije `/users/:id`.

**Žádná schema změna, žádná migrace.** `User.themeSettings.themeId` bude prostě další klíč ve freeform JSON objectu.

### 4.2 FE změny

[`src/themes/useThemeSync.ts`](src/themes/useThemeSync.ts):

**Inbound** (l. 20-24):
```ts
// Před:
const userThemeId = (user as { themeId?: string }).themeId;
// Po:
const userThemeId = (user.themeSettings as { themeId?: string } | undefined)?.themeId;
```

**Outbound** (l. 41):
```ts
// Před:
api.patch('/users/me', { themeId }).catch(...)
// Po:
api.patch('/users/me', { themeSettings: { themeId } }).catch(...)
```

**Smazat** zbylou tichou `console.warn` chybu pro 404 (l. 42-45) — endpoint teď existuje, 404 by znamenal jiný problém.

### 4.3 Typové změny

**Žádný nový type field.** `User.themeSettings: Record<string, unknown>` zůstává — `themeId` je tam jen jeden z freeform klíčů. FE čte přes cast `(user.themeSettings as { themeId?: string })?.themeId`.

**Alternativa zvažovaná:** přidat `User.themeSettings: { themeId?: ThemeId; calendarMonth?: unknown; ... }` typed object. **Zamítnuto** protože:
- Mění typ pro 1 use case, zatímco zbytek `themeSettings` (calendarMonth, atd.) je legitimně freeform.
- Zvyšuje vazbu mezi `User` typem a theme registry (`ThemeId` enum).
- D-004 původně chtěl top-level `themeId` field, ale po cestě C je to overkill — řešíme přes existující freeform.

D-004 se uzavírá s poznámkou "cestou C nezůstává proč přidávat top-level field; type cast je akceptovatelný kompromis pro freeform JSON storage".

### 4.4 Out of scope

- Sync `chatPreferences` přes `/users/me` — DTO ho už podporuje, ale FE feature pro něj není 1.2 scope.
- Sync ostatních fields (displayName, avatarUrl, …) — patří do 1.3 (profil & avatar), ne sem.
- BE endpoint `DELETE /users/me` (vlastní účet smazat) — out of scope, ne dluh.

---

## 5. Acceptance kritéria

1. ✅ BE: nový endpoint `PATCH /api/users/me` s `JwtAuthGuard`, přijímá `UpdateUserDto`.
2. ✅ BE: endpoint volá `usersService.update(requester.id, dto)`.
3. ✅ BE: `username` change přes `/users/me` vrací 403.
4. ✅ BE: existující testy prochází (nic se v service vrstvě nemění).
5. ✅ BE: nový unit/e2e test pro `PATCH /users/me { themeSettings: { themeId: 'modre-nebe' } }` → user dostane merged themeSettings.
6. ✅ FE: `useThemeSync.ts` čte `user.themeSettings?.themeId` (ne top-level `themeId`).
7. ✅ FE: `useThemeSync.ts` posílá `{ themeSettings: { themeId } }` (ne `{ themeId }`).
8. ✅ FE: žádný `console.warn` o "endpoint not implemented" — endpoint teď existuje.
9. ✅ FE: build prochází (`npm run build`).
10. ✅ Manuální test cross-device:
    - Login na zařízení A, změna tématu na "sci-fi" → reload → téma se zachová.
    - Login stejného účtu na zařízení B (incognito / jiný browser) → po loginu téma "sci-fi" automaticky.
11. ✅ `dluhy.md`: D-003 a D-004 přesunuty do "Uzavřené" s odkazem na 1.2e.

---

## 6. Test plán

### 6.1 BE — nový unit test

V `users.controller.spec.ts` (pokud existuje) nebo new file:

```ts
it('PATCH /users/me ukládá themeSettings.themeId', async () => {
  // Mock: requester = { id: 'u1', role: Hrac }
  await controller.updateMe({ themeSettings: { themeId: 'sci-fi' } }, { id: 'u1', role: 5 });
  expect(usersService.update).toHaveBeenCalledWith('u1', {
    themeSettings: { themeId: 'sci-fi' },
  });
});

it('PATCH /users/me s username vyhazuje Forbidden', async () => {
  expect(() =>
    controller.updateMe({ username: 'newname' }, { id: 'u1', role: 5 })
  ).toThrow(ForbiddenException);
});
```

### 6.2 FE — žádný nový automatizovaný test

`useThemeSync` nemá unit test (atomic ad-hoc hook). Manuální test přes scénář.

### 6.3 Manuální test (povinný)

**Předpoklady:** BE běží, FE dev server běží, Mongo DB s testovacím účtem.

1. Přihlásit se jako Tyky (Superadmin) na :5173.
2. Otevřít DevTools → Network tab.
3. Kliknout na ThemeSwitcher → vybrat "sci-fi".
4. **Ověřit Network:** request `PATCH http://localhost:3000/api/users/me` s body `{"themeSettings":{"themeId":"sci-fi"}}` → status 200.
5. Hard reload stránky (Ctrl+F5).
6. Ověřit: téma "sci-fi" stále aktivní (z BE, ne z localStorage — test smazat localStorage před reloadem).
7. Otevřít incognito okno → login stejným účtem → téma "sci-fi" automaticky aktivní.

### 6.4 Edge cases

- **Anon path:** `useThemeSync` má `if (!user) return` na začátku obou efektů (l. 16, l. 29) → anon nikdy nevolá BE. Žádný regrese.
- **Logout:** uvnitř `useThemeSync` se `previous.current = themeId` reset-uje při null user (l. 30) → po logoutu další theme change → outbound efekt skipne (`previous.current === themeId`). OK.
- **Race condition:** Initial sync vs outbound — `initialSynced.current` ref garantuje, že initial sync proběhne jen jednou. OK.

---

## 7. Změny v souborech

| Soubor | Repo | Druh změny | Velikost |
|---|---|---|---|
| `backend/src/modules/users/users.controller.ts` | BE | nový endpoint `@Patch('me')` | ~+18 ř. |
| `backend/src/modules/users/users.controller.spec.ts` | BE | +2 unit testy (pokud spec existuje) | ~+25 ř. |
| `backend/test/users.e2e-spec.ts` | BE | +1 e2e test (volitelně) | ~+15 ř. |
| `src/themes/useThemeSync.ts` | FE | inbound + outbound přepis na `themeSettings.themeId` | ~+3 / -5 ř. |
| `docs/dluhy.md` | FE | D-003, D-004 → Uzavřené | ~+10 / -25 ř. |
| `docs/arch/phase-1/spec-1.2e-theme-sync.md` | FE | tento dokument | nový |

---

## 8. Riziko & rollback

- **Riziko 1:** Existing `PATCH /users/:id` endpoint zůstává — pokud někdo (např. admin UI v 1.3) už dnes používá `PATCH /users/{ownId}` s themeSettings, bude fungovat dál. Žádná regrese.
- **Riziko 2:** Conflict mezi `PUT /users/:id/theme` (existing) a new `PATCH /users/me`. Oba zapisují `themeSettings`. Pokud FE volá oba paralelně, last-write-wins. **Nefunkčně problém.** Pokud chceme deprecate `PUT /users/:id/theme`, lze udělat v samostatném cleanupu (nový dluh, low priority).
- **Rollback:** revert 1 commitu BE + 1 commitu FE.

---

## 9. Otázky k autorovi

1. ✅ Cesta C schválena (žádný schema field, jen nový endpoint + `themeSettings.themeId`)?
2. ✅ Souhlasíš, že **D-004** se uzavře jako "vyřešeno cestou C, top-level `themeId` field je nadbytečný" (FE čte přes type cast freeform)?
3. ✅ Souhlasíš s blokací `username` change na `/users/me` (Superadmin musí použít `/users/:id`)?
4. ✅ Souhlasíš s **out of scope** rozhodnutími (žádný `chatPreferences` sync, žádný cleanup `PUT /users/:id/theme`)?

---

**Po schválení specu napíšu implementační plán.**
