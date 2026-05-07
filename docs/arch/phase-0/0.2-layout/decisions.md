# Technická rozhodnutí

## WorldContext jako součást WorldLayout

**Rozhodnutí:** `WorldContext.Provider` je přímo v `WorldLayout`, ne v samostatné wrapping komponentě.

**Důvod:** Každá světová stránka potřebuje kontext — layout je přirozené místo pro jeho poskytnutí.

**Dopad:** Přístup ke světovému kontextu je dostupný všem child routes pod `/svet/:worldId`.

---

## `isPJ` check přes číslo role

**Rozhodnutí:** `isPJ = world.ownerId === user.id || user.role <= 3` (Superadmin=1, Admin=2, PJ=3).

**Důvod:** Rychlá kontrola bez nutnosti volat BE, konzistentní s `UserRole` enum.

**Alternativy:** Volat BE endpoint pro check role (odmítnuto — zbytečný request).

**Dopad:** Pokud se změní `UserRole` enum nebo přibude nová role, je třeba aktualizovat tuto podmínku.

---

## Hamburger drawer zprava ve WorldLayout

**Rozhodnutí:** Mobilní drawer se otevírá zprava (overlay), ne zleva jako v IkarosLayout.

**Důvod:** WorldLayout má horizontální header nav — drawer zprava je přirozené rozšíření.
