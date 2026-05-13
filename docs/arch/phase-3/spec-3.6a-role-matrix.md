# Spec 3.6a — Sekce „Role & oprávnění" v Nápovědě: dvě úrovně, karty + matice

**Status:** Draft — čeká na schválení
**Rozsah:** FE — středně velké (1 sekce stránky + 1 nová sdílená UI komponenta + tokeny)
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-3.6a-role-matrix`
**Velikost:** odhad ~6 souborů / ~450 ř. (z toho ~60 % obsah/JSX)
**Autor:** PJ + Claude
**Datum:** 2026-05-13
**Souvisí:** [spec-3.6.md](spec-3.6.md) (původní HelpPage), [tokens.css](../../../src/themes/_shared/tokens.css) (`--role-star-*`)

---

## 1. Cíl

Přepsat sekci **Role & oprávnění** v `/ikaros/napoveda` tak, aby vizuálně i obsahově vyjasnila **dvě nezávislé úrovně rolí v Ikaru** — globální (platforma) a world (svět) — pomocí dvojice _karty rolí + matice oprávnění_ na úrovni. Cíl: hráč i admin z jednoho pohledu vidí, kdo co smí, a kde role platí.

---

## 2. Kontext / motivace

- Sekce Role v `RolesSection.tsx` aktuálně **míchá globální a world role v jedné tabulce** (PJ a Hráč jsou v sloupci „Globální role"). To je sémanticky špatně — PJ je world-scoped, ne platformní role.
- Stejný defekt je v admin role selectoru ([ADMINISTRACE → Uživatelé]) — dropdown nabízí v jednom seznamu globální i world role. Toto **není scope tohoto specu** (zakládá se dluh, viz §5).
- Uživatel poslal dvě referenční matice oprávnění (screenshoty 2026-05-13) — finální zdroj pravdy pro obsah matice. Konsolidováno do paměti [project-roles-architecture](../../../../../Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/project_roles_architecture.md).
- Spec 3.6 vznikl před tímto vyjasněním. Tento spec ho nepřepisuje globálně, jen **upgraduje sekci Role**.

---

## 3. Audit současného stavu

### Soubory

- [src/features/ikaros/pages/HelpPage/sections/RolesSection.tsx](../../../src/features/ikaros/pages/HelpPage/sections/RolesSection.tsx) — 210 ř. JSX, 4 textové tabulky.
- [src/features/ikaros/pages/HelpPage/HelpPage.module.css](../../../src/features/ikaros/pages/HelpPage/HelpPage.module.css) — `.tableWrap`, `.callout` styly.
- [src/themes/_shared/tokens.css](../../../src/themes/_shared/tokens.css) — `--role-star-*` (5 globálních rolí: superadmin/admin/spravce-diskuzi/spravce-clanku/spravce-galerie). World role barevné tokeny **chybí**.
- [src/shared/ui/RoleStar/RoleStar.tsx](../../../src/shared/ui/RoleStar/RoleStar.tsx) — komponenta hvězdičky pro **globální** role (Star ikonka z lucide). World role ekvivalent **chybí**.
- [src/shared/types/index.ts:1-13](../../../src/shared/types/index.ts#L1-L13) — `UserRole` enum: Superadmin/Admin/PJ/Korektor/Hrac/Ctenar/Zadatel/Ikarus/SpravceClanku/SpravceGalerie/SpravceDiskuzi.
- [src/shared/types/index.ts:267-273](../../../src/shared/types/index.ts#L267-L273) — `WorldRole` enum: Pending/Hrac/Korektor/PomocnyPJ/PJ.

### Problémy v existujícím obsahu

1. **`RolesSection.tsx:42-48`** — řádek `PJ` v tabulce „Globální role". Zavádějící.
2. **`RolesSection.tsx:49-56`** — řádek `Hráč` v „Globální role". Hráč je v `UserRole.Hrac` (5), ale chování popsané v Help (vlastní profil/postava/diskuze) odpovídá `Ikarus` base uživateli. Zmatek mezi „obyčejný uživatel platformy" a „hráč ve světě".
3. **`RolesSection.tsx:67-76`** — řádek „Korektor / Čtenář / Žadatel / Ikarus — V přípravě". Korektor/Čtenář/Žadatel patří do world matice. Ikarus je base globální. Sloučeno do jednoho řádku „v přípravě" → falešný dojem že nic z toho nefunguje.
4. **`RolesSection.tsx:152-201`** — sekce „Světové role" má 5 rolí (PJ/PomPJ/Korektor/Hráč/Čeká na schválení). Chybí **Čtenář** (= pasivní účastník) jako samostatná role. „Čeká na schválení" je vlastně **Žadatel** — sjednotit naming.
5. **Žádné vizuální matice ✓/—** — všechno je prozaicky popsané; uživatel chce sklopnou tabulku jako referenci.
6. **Žádná barevná diferenciace world rolí** — chybí tokeny i ikonky.

### Co je naopak v pořádku — zachovat

- Sekce „Hierarchie a omezení adminů" (`:81-105`) — pravidla BE forcingu, logicky korektní.
- Tabulka „Co kdo smí udělat s kým" (`:107-150`) — actor × target matice pro globální admin akce. Doplňuje, neredundantní.
- `.callout` „Založ si Pomocného PJ" (`:203-207`) — užitečný tip.

---

## 4. Návrh řešení

### 4.1 Cílová struktura sekce Role (top-down)

```
<intro>  Dvě úrovně rolí v Ikaru…  </intro>

<h2>Globální role</h2>
  <p>Co platí — jeden uživatel = jedna globální role.</p>
  <RoleCards type="global" />        ← 6 karet: Ikaros, Superadmin, Admin, Spr. diskuzí, Spr. článků, Spr. galerie
  <h3>Matice oprávnění</h3>
  <PermissionMatrix type="global" /> ← 5 sloupců (Sa/A/D/Č/G; Ikaros vynechán = nic nemá) × 8 řádků oprávnění

<h2>Hierarchie a omezení adminů</h2>  ← ZACHOVAT z aktuální verze
  <ul>…</ul>

<h2>Co kdo smí udělat s kým</h2>      ← ZACHOVAT
  <table>…</table>

<h2>Role ve světech</h2>
  <p>World role platí jen v daném světě; uživatel může být ve více světech v různých rolích.</p>
  <RoleCards type="world" />          ← 6 karet: PJ, Pom. PJ, Korektor, Hráč, Čtenář, Žadatel
  <h3>Matice oprávnění</h3>
  <PermissionMatrix type="world" />   ← 6 sloupců × 7 řádků oprávnění

<.callout> Tip o Pomocném PJ </.callout>  ← ZACHOVAT
```

### 4.2 Globální role — obsah karet

| Role | Ikonka | Badge | Popis (1–2 věty) |
|------|--------|-------|------------------|
| **Ikaros** | (bez hvězdy, šedá `Star` outline) | „Základní uživatel" | Každý registrovaný má roli Ikaros. Vlastní profil, postava v Rozcestí, účast v komunitě. |
| **Superadmin** | ★ zelená | „Zakladatel platformy" | Plný přístup ke všem funkcím. Jediný, kdo nastavuje Admin role a granular permissions. |
| **Admin** | ★ oranžová | „Důvěryhodný moderátor" | Adresář uživatelů, ban/role/smazání (s hierarchií), schvalování žádostí o přezdívku, audit log. |
| **Správce diskuzí** | ★ žlutá | „Moderátor diskuzí" | Schvaluje pending diskuze, moderuje příspěvky. Notifikace při nové čekající. |
| **Správce článků** | ★ červená | „Moderátor článků" | Schvaluje a zamítá články, moderuje literární obsah. |
| **Správce galerie** | ★ modrá | „Moderátor galerie" | Schvaluje obrázky, moderuje galerii. |

### 4.3 Globální matice oprávnění

| Oprávnění | Superadmin | Admin | Spr. diskuzí | Spr. článků | Spr. galerie |
|---|:---:|:---:|:---:|:---:|:---:|
| Schvalování diskuzí | ✓ | ✓ | ✓ | — | — |
| Schvalování článků | ✓ | ✓ | — | ✓ | — |
| Schvalování galerie | ✓ | ✓ | — | — | ✓ |
| Správa příspěvků | ✓ | ✓ | ✓ | ✓ | ✓ |
| Úprava profilů uživatelů | ✓ | ✓ | — | — | — |
| Správa uživatelů | ✓ | ✓ | — | — | — |
| Správa obsahu platformy | ✓ | ✓ | — | — | — |
| Systémová nastavení | ✓ | — | — | — | — |

Pozn.: **Ikaros se v matici nezobrazuje** — sloupec by byl celý `—` a karta sama říká „základní uživatel".

### 4.4 World role — obsah karet

| Role | Ikonka (lucide) | Badge | Popis |
|------|-----------------|-------|-------|
| **PJ (Průvodce hrou)** | `Crown` magenta | „Vlastník světa" | Plná správa: členové, role, obsah, mapy, kampaně, kalendář, nastavení. |
| **Pomocný PJ** | `Shield` fialová | „Zástupce PJ" | Stejné pravomoci jako PJ kromě mazání obsahu a nastavení světa. Auto-promoce na PJ když PJ smaže účet. |
| **Korektor** | `PenLine` cyan | „Editor" | Read + úprava dat světa (texty, stránky, postavy). Bez mazání a správy členů. |
| **Hráč** | `User` sky-blue | „Základní role" | Účastní se hry, prohlíží obsah, spravuje svou postavu. Nemůže upravovat data světa. |
| **Čtenář** | `Eye` silver | „Pasivní účastník" | Jen prohlíží obsah světa. Nemůže spravovat ani svou postavu. _(Dříve „Nezařazený")._ |
| **Žadatel** | `Hourglass` amber | „Čeká na schválení" | Požádal o přístup do uzavřeného světa, čeká na PJ. Zatím ne-člen. |

### 4.5 World matice oprávnění

| Oprávnění | PJ | Pom. PJ | Korektor | Hráč | Čtenář | Žadatel |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Prohlížení obsahu | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Správa své postavy | ✓ | ✓ | ✓ | ✓ | — | — |
| Úprava dat světa | ✓ | ✓ | ✓ | — | — | — |
| Vytváření obsahu | ✓ | ✓ | — | — | — | — |
| Správa členů | ✓ | ✓ | — | — | — | — |
| Mazání obsahu | ✓ | — | — | — | — | — |
| Nastavení světa | ✓ | — | — | — | — | — |

### 4.6 Nové sdílené UI

#### 4.6.1 Token cleanup — `src/themes/_shared/tokens.css` (rozšíření)

```css
/* World role barvy — analogicky k --role-star-* */
--role-world-pj:           #c050a0;  /* magenta — vlastník */
--role-world-pj-asst:      #9333ea;  /* purple — zástupce */
--role-world-corrector:    #06b6d4;  /* cyan — editor */
--role-world-player:       #60a5fa;  /* sky — aktivní hráč */
--role-world-reader:       #94a3b8;  /* silver — pasivní */
--role-world-applicant:    #f59e0b;  /* amber — čeká */
```

Hodnoty jsou theme-independent (sjednoceno přes všechny skiny). Pokud konkrétní skin chce override, dá si je do svého `index.ts` (paterm jako [project-tyky-superadmin]).

#### 4.6.2 `<WorldRoleIcon>` — nová sdílená komponenta

`src/shared/ui/WorldRoleIcon/` — analogická k `<RoleStar>`:

- Props: `role: WorldRoleKey` (sjednocená string union, ne enum — viz §5), `size?: 'sm'|'md'|'lg'`, `showLabel?: boolean`.
- Renderuje lucide ikonu zabarvenou přes `--role-world-color` (CSS variable per role).
- Exportováno přes `src/shared/ui/index.ts`.

`WorldRoleKey` = `'pj' | 'pj-asst' | 'corrector' | 'player' | 'reader' | 'applicant'` — string aliasy, **nezávislé** na BE enumu `WorldRole`. Důvod: vizualizace v Nápovědě nemá vazbu na runtime data, jen labely.

#### 4.6.3 `<RoleCard>` — privátní komponenta `RolesSection`

Lokální (privátní v `HelpPage/sections/`), ne sdílená. Props: `icon`, `iconColorVar`, `title`, `badge`, `description`. Vykreslí kartu s levým border-left v barvě role + jemný inner glow (viz design proposal).

#### 4.6.4 `<PermissionMatrix>` — privátní komponenta `RolesSection`

Props: `headers: { key, label, icon }[]`, `rows: { label, cells: (true|false)[] }[]`. Vykreslí tabulku s ✓ v barvě role (cell color = `--role-*-color`) nebo `—`. Sticky první sloupec na mobilu.

### 4.7 Responzivita

| Breakpoint | Karty | Matice |
|---|---|---|
| ≥ 1024 px | 1 sloupec, full-width, `padding 24px` | Tabulka, header sticky-top při scrollu stránky |
| 720–1024 px | 1 sloupec, `padding 16px` | Tabulka |
| < 720 px | 1 sloupec, `padding 12px`, menší ikony | `overflow-x: auto`, sticky první sloupec (`position: sticky; left: 0`), fade gradient vpravo |

Vychází z `.tableWrap` paternu, který už používá `overflow-x: auto`.

### 4.8 CSS module strategie

Rozšíření existujícího `HelpPage.module.css` o:
- `.roleCard` + barevné modifikátory (`.roleCardSuperadmin`, …, `.roleCardPj`, …) — `border-left-color` + `box-shadow inset` glow.
- `.permissionMatrix`, `.matrixCell` (✓ s glow), `.matrixCellEmpty` (—).
- `.matrixStickyFirstCol` pro mobilní sticky.
- `.roleBadge` + barevné modifikátory pro pill v kartě.

Žádný globální CSS, žádný edit cizí komponenty (mimo přidání tokenů a nové komponenty).

---

## 5. Out of scope

Explicitně **mimo** tento spec — založí se dluhy:

1. **Refactor `UserRole` enumu** — odstranění world rolí (PJ/Korektor/Hrac/Ctenar/Zadatel) z globálního enumu. Vyžaduje BE koordinaci, migraci dat.
2. **Refactor `WorldRole` enumu** — doplnění Ctenar, přejmenování Pending → Zadatel. Vyžaduje BE.
3. **Oprava admin role dropdownu v ADMINISTRACI** — nesmí nabízet world role mezi globálními. Samostatná FE změna v `UsersTab/RoleSelector` (lokalizovat v implementačním plánu nového dluhu).
4. **Reálné funkční chování Korektor / Čtenář / Žadatel ve světech** (BE check, UI gating) — fáze 5+ (world layer).
5. **Lokalizace** — texty jsou hard-coded česky stejně jako zbytek HelpPage.
6. **Změna FAQ / dalších sekcí HelpPage** — pouze sekce Role.
7. **Audit/aktualizace `<RoleChip>` komponenty** — té se nedotýkáme (používá `UserRole` enum, ne ikonky pro karty Nápovědy).

---

## 6. Acceptance kritéria

1. ✅ Sekce Role v `/ikaros/napoveda?sekce=role` zobrazuje **dva bloky**: Globální role + Role ve světech, vizuálně oddělené `<h2>`.
2. ✅ Každý blok má **karty rolí** (6 karet) + **matici oprávnění** v tomto pořadí.
3. ✅ Globální matice obsahuje přesně **5 sloupců** (Sa/A/Spr.D/Spr.Č/Spr.G) × **8 řádků** oprávnění dle §4.3.
4. ✅ World matice obsahuje **6 sloupců** (PJ/PomPJ/Korektor/Hráč/Čtenář/Žadatel) × **7 řádků** dle §4.5.
5. ✅ Karty mají barevný left-border v barvě role; ikonky svítí (text-shadow glow).
6. ✅ `<RoleStar>` (existující) použito v matici header pro globální; `<WorldRoleIcon>` (nová) pro world.
7. ✅ Mobil < 720 px: matice horizontálně scrollovatelná, první sloupec sticky.
8. ✅ Sekce „Hierarchie a omezení adminů" + „Co kdo smí udělat s kým" + tip o Pomocném PJ — **zachovány** bez změny obsahu.
9. ✅ Žádný řádek „PJ" / „Hráč" v sekci „Globální role".
10. ✅ Žádný řádek „v přípravě" sdružující world role + Ikarus.
11. ✅ Funguje napříč všemi 21 motivy (smoke test na `modre-nebe`, `kyberpunk`, `pergamen`).
12. ✅ `tsc`, `lint`, `vitest` zelené.

---

## 7. Test plán

### Automated

- **`RolesSection.spec.tsx`** (rozšíření existujícího nebo nový):
  - Render obsahuje text „Globální role" i „Role ve světech".
  - 6 globálních karet (queryAllByRole/data-testid).
  - Matice globální: 5 sloupců + 8 řádků; specifická buňka „Systémová nastavení × Admin" je „—".
  - Matice world: 6 sloupců; buňka „Žadatel × Prohlížení obsahu" je „—".
  - WorldRoleIcon: snapshot pro každou roli (6 variant).
- **`WorldRoleIcon.spec.tsx`** (nová):
  - Render každé role; má aria-label.
  - `size` mění svg width.

### Manuální smoke

1. `/ikaros/napoveda?sekce=role` v Chrome desktop ≥ 1280 — vizuál odpovídá designu.
2. Stejné v Firefox mobile emulator iPhone SE — sticky first column funguje, scroll plynulý.
3. Přepnout 3 themy (modre-nebe, kyberpunk, pergamen) — žádný kontrast pod minimum, hvězdičky barevně viditelné.
4. Skill `mobil-desktop` — vizuální audit.

---

## 8. Riziko & rollback

| Riziko | Mitigace |
|---|---|
| Barvy world rolí kolidují se skinem (kyberpunk neon, pergamen sépie) | Token hodnoty zvolené ze střední saturace; skin může override; smoke test 3 motivů |
| Matice na úzkém mobilu (< 360 px) ošklivě overflow | `min-width` na tabulku, `overflow-x: auto`, sticky first column + fade indikátor |
| Uživatel přečte matici a očekává funkční Korektor/Čtenář/Žadatel ve světě dnes | Pod world maticí poznámka „Reálná funkčnost rolí přijde s fází 5+ (světová vrstva)" |
| Existující testy `HelpPage.spec.tsx` se rozbijí | Před commitem `npm run test -- HelpPage` lokálně; selektory uvnitř testů jen update |

**Rollback:** revert single commit. Stránka funguje i bez specu — předchozí RolesSection zůstává v git history.

---

## 9. Otázky k autorovi

Žádné — autor delegoval (`jdeme na to`). Volby:

- Q1: Hodnoty pro Čtenář/Žadatel v matici — **odvozeno logicky**: Čtenář = read-only ve světě (může vidět + nemůže nic); Žadatel = nic (čeká).
- Q2: Ikonka „Pomocný PJ" — `Shield` (zástupce, ochrana).
- Q3: Pozice nové sekce „Hierarchie" — **zachovat mezi globálními a world**, jak je dnes.
- Q4: Barva PJ — magenta (`#c050a0`), inspirace screenshotem uživatele.
- Q5: World role barvy v `tokens.css` jako theme-independent (skiny mohou override) — nepřidávat per-skin override v této spec, jen v globálním `_shared/tokens.css`.
- Q6: Naming v paměti vs. kódu — paměť mluví o „Čtenář" a „Žadatel", FE enum má `Pending`. **V této spec se enumu nedotýkám**, jen labelujeme jako „Čtenář"/„Žadatel" v UI. Refactor enumu = dluh §5.1/5.2.

---

**Po schválení specu napíšu implementační plán** (`plan-3.6a-role-matrix.md`) s přesným diffem souborů, pořadím kroků a CLI příkazy.
