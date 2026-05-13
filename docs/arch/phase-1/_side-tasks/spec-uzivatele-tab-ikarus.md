# Spec — Tab „Uživatelé" pro běžné role (Ikarus + Správci)

**Status:** Schváleno 2026-05-13 — otázky 1/2/3 rozhodnuty (disabled placeholdery, default `uzivatele`, fix `useAdminUsers` enabled v PR)
**Rozsah:** FE — malé, ~3 soubory
**Repo:** `Projekt-ikaros-FE`
**Velikost:** ~50 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-13
**Souvisí:** [spec-1.4.md](../spec-1.4.md), [usersPageTabs.helpers.ts](../../../../src/features/users/components/usersPageTabs.helpers.ts), [UsersTab.tsx](../../../../src/features/users/components/tabs/UsersTab/UsersTab.tsx), [PublicProfileActions.tsx](../../../../src/features/users/components/PublicProfile/PublicProfileActions.tsx)

---

## 1. Cíl

Zpřístupnit tab **Uživatelé** v `/ikaros/uzivatele` všem přihlášeným uživatelům (nejen Admin/Superadmin). Běžný uživatel (Ikarus, SpravceClanku, SpravceGalerie, SpravceDiskuzi) tam uvidí stejnou mřížku karet jako admin, ale **bez adminských ovládacích prvků** (tabulka, „Zobrazit smazané", focus na admin akci). Klik na kartu → public profil, kde jsou pro non-admin dostupné akce „Napsat zprávu" + „Přidat do přátel" (NE „Otevřít v administraci" — to je už dnes skryté přes `isAdmin` check).

---

## 2. Kontext / motivace

**Aktuální stav** [usersPageTabs.helpers.ts:10-15](../../../../src/features/users/components/usersPageTabs.helpers.ts#L10-L15):

```ts
visibleTabsForRole(role) {
  if (role === Superadmin || role === Admin) {
    return ['pratele', 'uzivatele', 'zpracovat', 'audit'];
  }
  return ['pratele', 'zpracovat'];   // ← Ikarus nemá 'uzivatele'
}
```

Důsledek: běžný uživatel nemá způsob, jak procházet adresář ostatních uživatelů. Public profil je dosažitelný jen přes přímý odkaz (např. z chatu). To omezuje sociální funkce (objevit kohokoliv, koho znám, a navázat kontakt).

**Co už funguje (a NEMĚNIT):**
- [PublicProfileActions.tsx:22](../../../../src/features/users/components/PublicProfile/PublicProfileActions.tsx#L22) — `showAdminAction = isAdmin && profileId !== meId` — „Otevřít v administraci" je už dnes skryté pro non-admin.
- „Napsat zprávu" + „Přidat do přátel" jsou v public profilu jako **disabled placeholdery** (čekají krok 3.5 a 1.8). To je úmyslný stav 1.4.

**Co je dnes broken pro Ikarus:**
- Nemůže otevřít tab „Uživatelé" na `/ikaros/uzivatele` (i kdyby vložil ?tab=uzivatele, `useEffect` redirect ho přesměruje s toastem „Nemáš oprávnění").

---

## 3. Řešení

### 3.1 `visibleTabsForRole` — rozšířit přístup k 'uzivatele' pro všechny role

```ts
export function visibleTabsForRole(role: UserRole | undefined): UsersPageTab[] {
  if (role === UserRole.Superadmin || role === UserRole.Admin) {
    return ['pratele', 'uzivatele', 'zpracovat', 'audit'];
  }
  return ['pratele', 'uzivatele', 'zpracovat'];  // ← přidáno 'uzivatele'
}
```

`audit` zůstává jen pro Admin/Superadmin.

`defaultTabForRole` zůstává beze změny:
- Admin/Superadmin → `'uzivatele'` (default)
- Ostatní → `'pratele'` (default, aby nově dostupný tab nezastínil hlavní use case přátel)

### 3.2 `UsersTab` — režim pro non-admin

UsersTab momentálně obsahuje:
1. **View toggle Karty / Tabulka** — Tabulka volá `useAdminUsers` (admin endpoint `GET /api/admin/users`) → **musí být skryto pro non-admin**.
2. **„Zobrazit smazané" checkbox** — adminská featura, ovlivňuje query parametr `includeDeleted` → **skrýt pro non-admin**.
3. **Search input** — public, zůstává.
4. **Sort select** — public, zůstává.
5. **CardsGrid** — volá `usePublicUsers` (public endpoint `GET /api/users`) → zůstává.

**Implementace:**

```tsx
// V UsersTab.tsx
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';

const me = useAtomValue(currentUserAtom);
const isAdmin = me?.role === UserRole.Superadmin || me?.role === UserRole.Admin;

// V renderu:
{isAdmin && <ViewToggle value={view} onChange={setView} />}
{isAdmin && <label>...Zobrazit smazané...</label>}

// Pokud view === 'table' a !isAdmin, force fallback na 'cards' (defenzivní)
const effectiveView: UsersTabView = isAdmin ? view : 'cards';
```

**Edge case:** non-admin uživatel zadá `?view=table` v URL → ignoruje se, vyrenderuje se `cards`. Žádný toast (silent fallback, neagresivní).

### 3.3 `UserCard` / `CardsGrid` — beze změny

Klik na kartu → navigate na `/ikaros/uzivatel/${id}` (public profil) — stejný flow pro admin i Ikarus. Kebab tlačítko v UserCard zůstává volitelné (`onKebab?`), `CardsGrid` ho nepředává — kebab tedy zůstává nepoužitý (potenciální future feature, ale **mimo rozsah tohoto specu**).

### 3.4 `PublicProfileActions` — beze změny

`isAdmin` check už dnes skrývá „Otevřít v administraci". „Napsat zprávu" + „Přidat do přátel" zůstávají disabled placeholdery (1.8 / 3.5).

### 3.5 `RightPanel` v IkarosLayout — label

Aktuálně:
```tsx
const label = isAdmin ? 'Uživatelé' : 'Přátelé';
```

**Návrh:** zachovat — link pořád vede na `/ikaros/uzivatele`, jen label se mění. Pro non-admin je vstupní brána stále „Přátelé" (default tab), uvnitř pak najdou taby Přátelé / Uživatelé / Zpracovat.

---

## 4. Acceptance kritéria

- [ ] **Ikarus, SpravceClanku, SpravceGalerie, SpravceDiskuzi** na `/ikaros/uzivatele` vidí 3 taby: Přátelé, Uživatelé, Zpracovat. Default tab je **Přátelé**.
- [ ] **Admin, Superadmin** vidí beze změny 4 taby: Přátelé, Uživatelé, Zpracovat, Audit. Default tab je **Uživatelé**.
- [ ] Non-admin na tabu „Uživatelé" vidí:
  - Search input ✓
  - Sort select ✓
  - Mřížku karet ✓
  - **NEvidí**: View toggle Karty/Tabulka, „Zobrazit smazané" checkbox
- [ ] Non-admin URL `?view=table` → silently ignored, vyrenderuje se cards.
- [ ] Klik na kartu → public profil. Tam:
  - Non-admin vidí: „Napsat zprávu" (disabled) + „Přidat do přátel" (disabled). NEvidí „Otevřít v administraci".
  - Admin vidí beze změny: vše tři tlačítka, admin button funkční.
- [ ] Update **HelpPage** (sekce Stránky) — popsat že tab Uživatelé je nově dostupný všem (D-048 prevence).
- [ ] Existující unit testy `usersPageTabs.helpers.spec.ts` doplnit o nový case pro Ikarus.

---

## 5. Mimo rozsah

- **Aktivace „Napsat zprávu"** — čeká na krok 3.5 (Pošta — dnes jen `MailPage.tsx` stub).
- **Aktivace „Přidat do přátel"** — čeká na krok 1.8 (friendships modul).
- **Kebab menu v UserCard** — placeholder existuje (`onKebab?` prop), ale CardsGrid ho nepředává. Implementace dropdown menu = samostatný úkol (zda vůbec potřeba — public profile už akce má).
- **Tab Audit pro non-admin** — zůstává jen Admin/Superadmin.
- **Změna defaultního tabu** — non-admin default zůstává `pratele` (záměrné, hlavní use case).

---

## 6. Riziko / poznámky

- **`includeDeleted` v query** — non-admin nemá UI checkbox, ale URL parametr `?includeDeleted=1` by mohl projít do `usePublicUsers`. **BE musí ignorovat** `includeDeleted` pro non-admin requesty (defenzivní; FE jen UX). Pokud BE neignoruje, dluh.
- **`useAdminUsers` na public stránce** — nesmí se volat když je view=cards, ale `UsersTab.tsx:84-88` ho **vždy volá** (`enabled` mu chybí). Pro non-admin by request padl s 403. **Fix v rozsahu**: přidat `enabled: isAdmin && view === 'table'` do `useAdminUsers`. (Buď v tomhle PR nebo jako follow-up dluh.)

---

## 7. Otevřené otázky

1. **Najít přátele:** je „Přátelé" tab pro Ikarus stále smysluplný jako default, když je tab „Uživatelé" (= přehled VŠECH lidí) silnější vstupní brána pro objevení nových lidí? → Návrh: ponechat `pratele` jako default; uživatel sám přejde do „Uživatelé" když chce hledat nové. Důvod: až dorazí 1.8, „Přátelé" bude full-featured a primární use case.
2. **Helper soubor přejmenovat** v komentářích? `Spec 1.4 — role-aware viditelnost tabů` (řádek 5) zachovat, jen rozšířit komentář o D-053 / tuto úpravu. → ANO.
3. **Zda zobrazit `pendingDeletion` overlay non-adminům** — momentálně `UserCard` zobrazuje status band pro pending/deleted účty. Pro non-admin to nedává smysl (BE by tyto účty stejně neměl vracet, pokud `includeDeleted=false`). → Žádná FE změna potřeba, BE-side concern.
