# Spec 2.1c — Edit a Delete Ikaros akce (uzavření dluhu D-XXX z 2.1b)

**Status:** ✅ Hotovo (2026-05-14) — FE 383 testů ✓ (+7 nových), lint ✓, tsc ✓.
**Rozsah:** FE only — BE PUT/DELETE endpointy už existují z 2.1b — **malé** (~150 ř. FE + ~50 ř. testů)
**Repo:** `Projekt-ikaros-FE`
**Větev:** `main`
**Autor:** PJ + Claude
**Datum:** 2026-05-14
**Souvisí:** [spec-2.1b-ikaros-events.md](./spec-2.1b-ikaros-events.md) §5 (mimo rozsah edit), §10 (dluhy D-XXX)

---

## 1. Cíl

Admin/Superadmin může na kartě globální Ikaros akce **upravit** nebo **smazat** akci přes kebab menu (•••) v rohu karty. Uzavírá dluh edit (D-XXX z 2.1b) + chybějící UI pro delete (hook existoval, ale nikde se nevolal).

---

## 2. Rozhodnutí

| Volba | Hodnota | Důvod |
|---|---|---|
| Spouštěč | Kebab (`•••`) v pravém horním rohu media | DRY pro 2 a více akcí, konzistence s `UsersTable` |
| Edit modal | Refactor `CreateIkarosEventModal` → `IkarosEventModal` s optional `event?` propem | DRY, jeden formulář + zod schema |
| Delete UX | Sdílený `<ConfirmDialog>` (existující primitiv z 1.8) | Konzistence napříč platformou |
| Roles | Admin/Superadmin (per `feedback_platform_vs_world_roles`) | BE už restricted, FE jen guarduje UI |
| Image remove | „Odebrat obrázek" v editu pošle `imageUrl: null` | BE update DTO to už akceptuje |

---

## 3. Změny

### FE — hook
[`useIkarosEvents.ts`](../../../src/features/ikaros/api/useIkarosEvents.ts):
- Přidat `useUpdateIkarosEvent()` — `mutationFn: ({ id, dto }) => api.put('/ikaros-events/:id', dto)`, invalidate `['ikaros-events']`.

### FE — modal refactor
- Přejmenovat `CreateIkarosEventModal.tsx` → `IkarosEventModal.tsx` (komponenta + soubor).
- Přidat optional prop `event?: IkarosEvent`.
- Pokud `event` definovaný:
  - Title: „Upravit akci", submit: „Uložit změny"
  - `defaultValues` z `event` (title, ISO date trimnutá na `YYYY-MM-DDTHH:mm`, description, confirmable)
  - Image state init z `event.imageUrl` + `imageFocalX/Y`
  - Submit → `useUpdateIkarosEvent.mutateAsync({ id: event.id, dto })`
  - Image remove → `imageUrl: null` v dto (BE schema akceptuje `null`)
- Pokud `event` nedefinovaný → původní create chování.
- Update imports v `IkarosEventsSection.tsx` + testech.

### FE — karta
[`IkarosEventCard.tsx`](../../../src/features/ikaros/components/IkarosEventCard.tsx):
- Číst `currentUserAtom`, kebab visible jen pro `UserRole.Admin | UserRole.Superadmin`.
- Kebab v pravém horním rohu media wrapperu (overlay nad obrázkem, žlutý hover).
- Items: **Upravit** (Pencil) + **Smazat** (Trash2, `variant: 'danger'`).
- Stav `editOpen` + `deleteOpen` + `kebabAnchor` ref.
- Render `<IkarosEventModal>` (edit mode) + `<ConfirmDialog>` (delete confirm).
- Delete confirm body: „Opravdu chceš smazat akci `<název>`?"

### FE — typy
`IkarosEvent` v `shared/types` už má `imageFocalX/Y` (z 2.1b) — žádná změna.

---

## 4. Akceptační kritéria

- **AK1:** Admin/Superadmin vidí `•••` kebab v rohu media na každé akci.
- **AK2:** Ostatní role (Ikarus, Hrac, world-role) kebab nevidí.
- **AK3:** Klik na **Upravit** → otevře modal s předvyplněnými daty.
- **AK4:** Změna title + uložit → toast „Akce upravena.", modal zavřen, list aktualizovaný.
- **AK5:** Klik na „Odebrat obrázek" v editu + uložit → akce po refresh nemá `imageUrl`.
- **AK6:** Klik na **Smazat** → `ConfirmDialog` „Opravdu chceš smazat akci `<název>`?".
- **AK7:** Confirm → DELETE proběhne, toast „Akce smazána.", karta zmizí ze seznamu.
- **AK8:** Cancel ve confirm dialogu → nic se nestane.
- **AK9:** 401/403 → toast „Nemáš oprávnění."
- **AK10:** Mobile (≤768px) → kebab tap-target ≥ 44px, popover přepne na bottom sheet (řeší `<KebabMenu>` primitiv).

---

## 5. Mimo rozsah

- ❌ Bulk edit / bulk delete.
- ❌ Historie změn / undo.
- ❌ Admin list page `/ikaros/admin/akce` — zůstává budoucí dluh.

---

## 6. Testy

- `useIkarosEvents.spec.tsx` — přidat 1 test pro `useUpdateIkarosEvent` (PUT + invalidate).
- `IkarosEventModal.spec.tsx` (rename z `CreateIkarosEventModal.spec.tsx`) — přidat 2 testy: edit mode prefill, edit mode submit volá PUT.
- `IkarosEventCard.spec.tsx` — přidat 2 testy: kebab visible jen admin/superadmin, delete confirm flow.

Cíl: **+5 nových FE testů**.

---

## 7. Po dokončení

- Spec 2.1b §10: označit D-XXX (edit modal) uzavřený inline (`✅ Vyřešeno 2.1c`).
- `docs/roadmap-fe.md`: krátká poznámka u 2.1b.
- Skill `mobil-desktop` po UI hotovém.
- Skill `napoveda` — admin pravomoci v sekci Akce rozšířeny o úpravu/smazání.
