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

---

## IkarosLayout — responzivní strategie pravého panelu (2026-05-13)

**Rozhodnutí:** Tři odlišné módy podle viewportu:

- **Desktop ≥ 1281px:** 3 sloupce 280 / 1fr / 280 (původní stav).
- **Tablet 769–1280px:** 3 sloupce 220 / 1fr / 220 — **oba postranní panely viditelné**, jen zúžené. Anon mód zůstává 2-sloupcový.
- **Mobil ≤ 768px:** Dva drawery — levý `☰` (navigace), pravý `⚙` Settings ikona (administrace + světy + oblíbené, jen pro `isAuthenticated`). Otevření jednoho zavře druhý.

**Důvod:** Předchozí stav `display: none` na pravém panelu pod 1280px znemožnil přístup k Theme switcheru, Moje světy, oblíbeným atd. na běžných notebookech i mobilech. Zúžení 280→220 stačí (krátké labely, kompaktní nav items).

**Alternativy zamítnuté:**
- Sloučit do jednoho drawer (zamítnuto — uživatel chce symetrické UX).
- Bottom tab bar (zamítnuto — jiný paradigm než zbytek aplikace).

**Dopad:** Pravý panel je vždy dostupný. Sekce `RightPanel` přijímá `onNav` callback pro zavření drawer po kliknutí.

**Soubor specu:** [_side-tasks/spec-responsive-right-panel.md](../../phase-1/_side-tasks/spec-responsive-right-panel.md)
