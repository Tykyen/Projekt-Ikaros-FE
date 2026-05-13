# Implementační plán — krok 3.6a Role matrix v Nápovědě

**Datum:** 2026-05-13
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-3.6a-role-matrix.md`](./spec-3.6a-role-matrix.md)
**Větev:** `feat/krok-3.6a-role-matrix` (vytvořím při startu)
**Odhad:** ~6 souborů změněno, ~3 nové soubory, ~450 ř. změn.

---

## Pořadí kroků

```
Step 1: tokeny           (foundation, žádná závislost)
Step 2: WorldRoleIcon    (závisí na Step 1)
Step 3: RolesSection     (závisí na Step 2)
Step 4: testy            (závisí na Step 3)
Step 5: roadmap + dluhy  (cleanup, nezávislé)
```

Per-step samostatný commit. Po Step 4 plné `tsc + lint + test:run` před Step 5.

---

## Step 1 — Nové CSS tokeny pro world role

**Soubory:**
- `src/themes/_shared/tokens.css` — přidat 6 řádků se `--role-world-*` proměnnými na konec souboru (za blok `RoleStar`).

**Diff:**
```css
  /* ── 3.6a — World role barvy (analogicky k --role-star-* pro globální role) */
  --role-world-pj:          #c050a0;
  --role-world-pj-asst:     #9333ea;
  --role-world-corrector:   #06b6d4;
  --role-world-player:      #60a5fa;
  --role-world-reader:      #94a3b8;
  --role-world-applicant:   #f59e0b;
```

**Acceptance kroku:** `npm run build` projde; v devtools `:root` má 6 nových proměnných.

---

## Step 2 — Nová sdílená komponenta `<WorldRoleIcon>`

**Nové soubory:**

### `src/shared/ui/WorldRoleIcon/WorldRoleIcon.tsx`

```tsx
import { Crown, Shield, PenLine, User, Eye, Hourglass, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import s from './WorldRoleIcon.module.css';

export type WorldRoleKey =
  | 'pj' | 'pj-asst' | 'corrector' | 'player' | 'reader' | 'applicant';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  role: WorldRoleKey;
  size?: Size;
  showLabel?: boolean;
  className?: string;
};

const SIZE_PX: Record<Size, number> = { sm: 14, md: 18, lg: 24 };

const CONFIG: Record<WorldRoleKey, { icon: LucideIcon; label: string; cls: string }> = {
  'pj':         { icon: Crown,     label: 'PJ',          cls: s.iconPj },
  'pj-asst':    { icon: Shield,    label: 'Pomocný PJ',  cls: s.iconPjAsst },
  'corrector':  { icon: PenLine,   label: 'Korektor',    cls: s.iconCorrector },
  'player':     { icon: User,      label: 'Hráč',        cls: s.iconPlayer },
  'reader':     { icon: Eye,       label: 'Čtenář',      cls: s.iconReader },
  'applicant':  { icon: Hourglass, label: 'Žadatel',     cls: s.iconApplicant },
};

export function WorldRoleIcon({ role, size = 'md', showLabel = false, className }: Props) {
  const { icon: Icon, label, cls } = CONFIG[role];
  return (
    <span className={clsx(s.wrapper, cls, className)} title={label} aria-label={label}>
      <Icon size={SIZE_PX[size]} strokeWidth={2} aria-hidden="true" />
      {showLabel && <span className={s.label}>{label}</span>}
    </span>
  );
}
```

### `src/shared/ui/WorldRoleIcon/WorldRoleIcon.module.css`

```css
.wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  vertical-align: middle;
  line-height: 1;
}
.wrapper svg {
  color: var(--role-world-color);
}
.iconPj         { --role-world-color: var(--role-world-pj); }
.iconPjAsst     { --role-world-color: var(--role-world-pj-asst); }
.iconCorrector  { --role-world-color: var(--role-world-corrector); }
.iconPlayer     { --role-world-color: var(--role-world-player); }
.iconReader     { --role-world-color: var(--role-world-reader); }
.iconApplicant  { --role-world-color: var(--role-world-applicant); }

.label {
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  color: var(--text-primary);
  letter-spacing: 0.04em;
}
```

### `src/shared/ui/WorldRoleIcon/index.ts`

```ts
export { WorldRoleIcon } from './WorldRoleIcon';
export type { WorldRoleKey } from './WorldRoleIcon';
```

### Update `src/shared/ui/index.ts`

```ts
export { WorldRoleIcon } from './WorldRoleIcon';
export type { WorldRoleKey } from './WorldRoleIcon';
```
(přidat za řádek `export { RoleStar } from './RoleStar/RoleStar';`)

**Acceptance kroku:** `npm run tsc -- --noEmit` projde; import `<WorldRoleIcon role="pj" />` se z jiného souboru přeloží.

---

## Step 3 — Přepis `RolesSection.tsx` + rozšíření `HelpPage.module.css`

### Soubor 1: `src/features/ikaros/pages/HelpPage/HelpPage.module.css` — rozšířit

Přidat na konec souboru (před `@media` blok) nové classy:

```css
/* ── 3.6a — Role karty + permission matice ─────────────────────────────── */

.roleCardGrid {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: var(--sp-4) 0 var(--sp-5);
}

.roleCard {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: color-mix(in srgb, var(--surface-2) 65%, transparent);
  border-left: 3px solid var(--role-card-color, var(--frame-border));
  border-radius: var(--radius-sm);
  box-shadow: inset 0 0 24px color-mix(in srgb, var(--role-card-color, transparent) 8%, transparent);
}

.roleCardIcon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  text-shadow: 0 0 12px color-mix(in srgb, var(--role-card-color, transparent) 40%, transparent);
}

.roleCardBody {
  flex: 1;
  min-width: 0;
}

.roleCardTitle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
  margin: 0 0 var(--sp-1);
  font-family: var(--font-display);
  font-size: var(--text-base);
  color: var(--theme-heading, var(--text-strong));
}

.roleCardBadge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--sp-2);
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: 0.02em;
  text-transform: none;
  background: color-mix(in srgb, var(--role-card-color, var(--surface-2)) 18%, transparent);
  color: var(--role-card-color, var(--text-muted));
  border: 1px solid color-mix(in srgb, var(--role-card-color, var(--frame-border)) 45%, transparent);
}

.roleCardDesc {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--theme-text-muted, var(--text-muted));
  line-height: 1.5;
}

/* Per-role barvy přes CSS variable override */
.roleCardIkaros        { --role-card-color: var(--theme-text-muted, var(--text-muted)); }
.roleCardSuperadmin    { --role-card-color: var(--role-star-superadmin); }
.roleCardAdmin         { --role-card-color: var(--role-star-admin); }
.roleCardSpravceDiskuzi { --role-card-color: var(--role-star-spravce-diskuzi); }
.roleCardSpravceClanku  { --role-card-color: var(--role-star-spravce-clanku); }
.roleCardSpravceGalerie { --role-card-color: var(--role-star-spravce-galerie); }
.roleCardPj            { --role-card-color: var(--role-world-pj); }
.roleCardPjAsst        { --role-card-color: var(--role-world-pj-asst); }
.roleCardCorrector     { --role-card-color: var(--role-world-corrector); }
.roleCardPlayer        { --role-card-color: var(--role-world-player); }
.roleCardReader        { --role-card-color: var(--role-world-reader); }
.roleCardApplicant     { --role-card-color: var(--role-world-applicant); }

/* Matice oprávnění */

.matrixWrap {
  overflow-x: auto;
  margin: var(--sp-2) 0 var(--sp-5);
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.matrix {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
  min-width: 540px;
}

.matrix th,
.matrix td {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--frame-border);
  text-align: center;
  vertical-align: middle;
}

.matrix th:first-child,
.matrix td:first-child {
  text-align: left;
  font-weight: var(--weight-semi);
  width: 38%;
  min-width: 180px;
  position: sticky;
  left: 0;
  background: var(--surface-3);
  z-index: 1;
}

.matrix thead th {
  background: var(--surface-2);
  color: var(--theme-heading, var(--text-strong));
  letter-spacing: 0.03em;
  text-shadow: none;
}

.matrix tbody tr:nth-child(even) td {
  background: color-mix(in srgb, var(--surface-2) 35%, transparent);
}

.matrix tbody tr:nth-child(even) td:first-child {
  background: var(--surface-3);
}

.matrixHeaderCell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-1);
}

.matrixHeaderLabel {
  font-family: var(--font-display);
  font-size: var(--text-xs);
  letter-spacing: 0.04em;
}

.matrixCheck {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--cell-color, var(--accent));
  text-shadow: 0 0 8px color-mix(in srgb, var(--cell-color, var(--accent)) 40%, transparent);
}

.matrixEmpty {
  color: var(--theme-text-muted, var(--text-muted));
  opacity: 0.5;
}

.matrixNote {
  margin: calc(-1 * var(--sp-3)) 0 var(--sp-5);
  font-size: var(--text-xs);
  color: var(--theme-text-muted, var(--text-muted));
  font-style: italic;
}
```

A drobnost v mediaqueries (`@media (max-width: 768px)`):

```css
@media (max-width: 768px) {
  .page { padding: var(--sp-4) var(--sp-3) var(--sp-8); }
  .tab { padding: var(--sp-2) var(--sp-3); font-size: var(--text-xs); }
  .pageItem :global(h3) { font-size: var(--text-sm); }
  /* 3.6a — menší ikonky karty na mobilu */
  .roleCard { padding: var(--sp-2) var(--sp-3); gap: var(--sp-2); }
  .roleCardIcon { width: 22px; height: 22px; }
}
```

### Soubor 2: `src/features/ikaros/pages/HelpPage/sections/RolesSection.tsx` — kompletní přepis

Nová struktura (zkrácený náčrt; finální kód v implementaci):

```tsx
import { Check, Star } from 'lucide-react';
import { RoleStar, WorldRoleIcon, type WorldRoleKey } from '@/shared/ui';
import { UserRole } from '@/shared/types';
import s from '../HelpPage.module.css';

// ── Definice obsahu (data-driven, aby se nedaly desync s textem mimo tabulku)

const GLOBAL_ROLE_CARDS = [
  { key: 'ikaros', cardCls: s.roleCardIkaros, title: 'Ikaros',
    badge: 'Základní uživatel', icon: 'star-outline',
    desc: 'Každý registrovaný uživatel. Vlastní profil, postava v Rozcestí, účast v komunitě.' },
  { key: 'superadmin', cardCls: s.roleCardSuperadmin, title: 'Superadmin',
    badge: 'Zakladatel platformy', icon: <RoleStar role={UserRole.Superadmin} size="lg" />,
    desc: 'Plný přístup ke všem funkcím. Jediný, kdo nastavuje Admin role a granular permissions.' },
  // … Admin, Spr. diskuzí, Spr. článků, Spr. galerie
] as const;

const GLOBAL_MATRIX_HEADERS = [
  { key: 'superadmin', label: 'Superadmin', role: UserRole.Superadmin,     colorVar: '--role-star-superadmin' },
  { key: 'admin',      label: 'Admin',      role: UserRole.Admin,          colorVar: '--role-star-admin' },
  { key: 'spr-d',      label: 'Spr. diskuzí', role: UserRole.SpravceDiskuzi, colorVar: '--role-star-spravce-diskuzi' },
  { key: 'spr-c',      label: 'Spr. článků',  role: UserRole.SpravceClanku,  colorVar: '--role-star-spravce-clanku' },
  { key: 'spr-g',      label: 'Spr. galerie', role: UserRole.SpravceGalerie, colorVar: '--role-star-spravce-galerie' },
];

const GLOBAL_MATRIX_ROWS = [
  { label: 'Schvalování diskuzí',        cells: [true, true, true, false, false] },
  { label: 'Schvalování článků',         cells: [true, true, false, true, false] },
  { label: 'Schvalování galerie',        cells: [true, true, false, false, true] },
  { label: 'Správa příspěvků',           cells: [true, true, true, true, true] },
  { label: 'Úprava profilů uživatelů',   cells: [true, true, false, false, false] },
  { label: 'Správa uživatelů',           cells: [true, true, false, false, false] },
  { label: 'Správa obsahu platformy',    cells: [true, true, false, false, false] },
  { label: 'Systémová nastavení',        cells: [true, false, false, false, false] },
];

const WORLD_ROLE_CARDS: Array<{
  key: WorldRoleKey; cardCls: string; title: string; badge: string; desc: string;
}> = [
  { key: 'pj',         cardCls: s.roleCardPj,        title: 'PJ (Průvodce hrou)', badge: 'Vlastník světa',
    desc: 'Plná správa: členové, role, obsah, mapy, kampaně, kalendář, nastavení.' },
  { key: 'pj-asst',    cardCls: s.roleCardPjAsst,    title: 'Pomocný PJ',         badge: 'Zástupce PJ',
    desc: 'Stejné pravomoci jako PJ kromě mazání obsahu a nastavení světa. Auto-promoce na PJ když PJ smaže účet.' },
  { key: 'corrector',  cardCls: s.roleCardCorrector, title: 'Korektor',           badge: 'Editor',
    desc: 'Read + úprava dat světa (texty, stránky, postavy). Bez mazání a správy členů.' },
  { key: 'player',     cardCls: s.roleCardPlayer,    title: 'Hráč',               badge: 'Základní role',
    desc: 'Účastní se hry, prohlíží obsah, spravuje svou postavu. Nemůže upravovat data světa.' },
  { key: 'reader',     cardCls: s.roleCardReader,    title: 'Čtenář',             badge: 'Pasivní účastník',
    desc: 'Jen prohlíží obsah světa. Nemůže spravovat ani svou postavu. (Dříve „Nezařazený".)' },
  { key: 'applicant',  cardCls: s.roleCardApplicant, title: 'Žadatel',            badge: 'Čeká na schválení',
    desc: 'Požádal o přístup do uzavřeného světa, čeká na PJ. Zatím není členem.' },
];

const WORLD_MATRIX_HEADERS: Array<{ key: WorldRoleKey; label: string; colorVar: string }> = [
  { key: 'pj',        label: 'PJ',       colorVar: '--role-world-pj' },
  { key: 'pj-asst',   label: 'Pom. PJ',  colorVar: '--role-world-pj-asst' },
  { key: 'corrector', label: 'Korektor', colorVar: '--role-world-corrector' },
  { key: 'player',    label: 'Hráč',     colorVar: '--role-world-player' },
  { key: 'reader',    label: 'Čtenář',   colorVar: '--role-world-reader' },
  { key: 'applicant', label: 'Žadatel',  colorVar: '--role-world-applicant' },
];

const WORLD_MATRIX_ROWS = [
  { label: 'Prohlížení obsahu',  cells: [true,  true,  true,  true,  true,  false] },
  { label: 'Správa své postavy', cells: [true,  true,  true,  true,  false, false] },
  { label: 'Úprava dat světa',   cells: [true,  true,  true,  false, false, false] },
  { label: 'Vytváření obsahu',   cells: [true,  true,  false, false, false, false] },
  { label: 'Správa členů',       cells: [true,  true,  false, false, false, false] },
  { label: 'Mazání obsahu',      cells: [true,  false, false, false, false, false] },
  { label: 'Nastavení světa',    cells: [true,  false, false, false, false, false] },
];

// ── Komponenty (privátní v rámci RolesSection.tsx)

function RoleCard(props: { cardCls: string; icon: React.ReactNode; title: string; badge: string; desc: string }) { … }
function PermissionMatrix(props: {
  headers: Array<{ key: string; label: string; colorVar: string; icon: React.ReactNode }>;
  rows: Array<{ label: string; cells: boolean[] }>;
}) { … }

// ── Hlavní render

export function RolesSection() {
  return (
    <>
      <p>Ikaros má dvě úrovně rolí: <strong>globální</strong> … a <strong>světová</strong> …</p>

      <h2>Globální role</h2>
      <p>Platí napříč celou platformou. Jeden uživatel má jednu globální roli.</p>
      <div className={s.roleCardGrid}>
        {GLOBAL_ROLE_CARDS.map(c => <RoleCard key={c.key} … />)}
      </div>
      <h3>Matice oprávnění</h3>
      <PermissionMatrix headers={GLOBAL_MATRIX_HEADERS_WITH_ICONS} rows={GLOBAL_MATRIX_ROWS} />

      <h2>Hierarchie a omezení adminů</h2>
      {/* ZACHOVAT beze změny */}

      <h2>Co kdo smí udělat s kým</h2>
      {/* ZACHOVAT beze změny */}

      <h2>Role ve světech</h2>
      <p>World role platí jen v daném světě; uživatel může být ve více světech v různých rolích.</p>
      <div className={s.roleCardGrid}>
        {WORLD_ROLE_CARDS.map(c => <RoleCard key={c.key} … icon={<WorldRoleIcon role={c.key} size="lg" />} … />)}
      </div>
      <h3>Matice oprávnění</h3>
      <PermissionMatrix headers={WORLD_MATRIX_HEADERS_WITH_ICONS} rows={WORLD_MATRIX_ROWS} />
      <p className={s.matrixNote}>Reálná funkčnost rolí Korektor/Čtenář/Žadatel ve světech přijde s fází 5+ (světová vrstva).</p>

      <div className={s.callout}>
        <strong>Tip:</strong> Pokud chceš svůj svět dlouhodobě, založ si v něm{' '}
        <strong>Pomocného PJ</strong>. Když budeš muset účet smazat, svět nezůstane bez vlastníka.
      </div>
    </>
  );
}
```

Pro Ikaros kartu speciální ikonka — `<Star size={24} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />` (outline, šedá).

**Acceptance kroku:** `tsc` ✓, `lint` ✓, render `<RolesSection />` neházze chybu, vizuál odpovídá designu.

---

## Step 4 — Testy

### `src/features/ikaros/pages/HelpPage/__tests__/HelpPage.spec.tsx` — update

Aktuální test (`:58-64`):
```ts
it('klik na „Role & oprávnění" → obsahuje Superadmin + Hierarchie + světové role', () => {
  …
  expect(screen.getByText(/Hierarchie a omezení adminů/)).toBeInTheDocument();
  expect(screen.getAllByText(/Superadmin/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Pomocný PJ/).length).toBeGreaterThan(0);
});
```

Rozšířit asserce o:
- `/Globální role/` viditelné
- `/Role ve světech/` viditelné
- text „Čtenář" (pasivní účastník) viditelný (regrese pro nový obsah)
- text „Žadatel" viditelný
- matice obsahuje `Schvalování diskuzí` a `Vytváření obsahu`

### Nový soubor: `src/shared/ui/WorldRoleIcon/__tests__/WorldRoleIcon.spec.tsx`

- Render každé `WorldRoleKey` → `aria-label` odpovídá očekávanému jménu (PJ, Pomocný PJ, Korektor, Hráč, Čtenář, Žadatel).
- `size="sm"` → svg má `width="14"`.
- `showLabel` → label text render.

### Nový soubor: `src/features/ikaros/pages/HelpPage/sections/__tests__/RolesSection.spec.tsx` (volitelné, pokud spec pokrytí drží)

Pokud HelpPage.spec úprav stačí, RolesSection samostatný test není nutný. Rozhodnutí: **vynechat**, pokrytí přes HelpPage.spec dostatečné.

**Acceptance kroku:** `npm run test:run -- HelpPage WorldRoleIcon` — všechny zelené; `npm run test:run` — celkový počet testů +n (n nových WorldRoleIcon).

---

## Step 5 — Roadmap, dluhy, cleanup

### `docs/roadmap-fe.md`

Pod řádek `3.6 Nápověda (`/ikaros/napoveda`) ✅` přidat sub-bullet:

```
- [x] 3.6a — Sekce Role: dvouúrovňový model (globální/world) s kartami + maticemi oprávnění (2026-05-13)
```

### `docs/dluhy.md`

Uzavřít / aktualizovat **D-NEW** (HelpPage content drift) — alespoň aktualizovat o zmínku „Sekce Role aktualizována v 3.6a, sekce Stránky/FAQ stále plánována k revizi po 1.8/2.x".

Otevřít **dva nové dluhy** (číslování od D-053):

#### D-053 — Refactor enumů UserRole / WorldRole

**Kontext:** `UserRole` v `src/shared/types/index.ts:1-13` míchá globální a world role (PJ/Korektor/Hrac/Ctenar/Zadatel jsou v globálním enumu). `WorldRole` v `:267-273` má `Pending` místo `Zadatel` a chybí `Ctenar`.

**Řešení:** Koordinovat s BE. Návrh: rozdělit `UserRole` na `GlobalRole` (Superadmin/Admin/SpravceDiskuzi/SpravceClanku/SpravceGalerie/Ikarus) + ponechat `WorldRole` rozšířený (Žadatel=-1, Hráč=0, Čtenář=1, Korektor=2, PomocnyPJ=3, PJ=4). Migrace dat na BE.

**Blokátor:** BE změna (TypeORM + Mongo schema) + migrace existujících dat.

#### D-054 — Admin role dropdown v ADMINISTRACI nabízí world role

**Kontext:** Screenshot 2026-05-13 — dropdown „Role" v ADMINISTRACE → Uživatelé obsahuje PJ/Korektor/Hráč/Čtenář/Žadatel společně s globálními. Sémanticky špatně.

**Řešení:** Lokalizovat selector (`src/features/admin/users/components/UsersTab/RoleSelector.tsx` nebo podobně), filtrovat options jen na **globální role**. World role pro daný svět se řídí v UI světa.

**Závisí na:** D-053 (čistý enum split). Bez něj jen filtr na seznamu hodnot.

### `docs/arch/phase-3/README.md`

Přidat řádek pod 3.6 spec/plán: `3.6a — Sekce Role role-matrix update (spec ✅ plán ✅ impl ✅)`.

**Acceptance kroku:** všechny tři dokumenty git diff vidí změny; debt sekce má dva nové záznamy.

---

## Závěrečný checklist

- [ ] `npm run build` projde (FE workspace)
- [ ] `npm run lint` projde
- [ ] `npm run test:run` projde (cca +6 testů: 5 WorldRoleIcon + 1–2 rozšíření HelpPage)
- [ ] Smoke test: `/ikaros/napoveda?sekce=role` v Chrome desktop ≥ 1280 — vizuál odpovídá designu (2 bloky, karty, matice)
- [ ] Smoke test: Chrome mobile emulator iPhone SE — matice scrollují horizontálně, první sloupec sticky
- [ ] Smoke test: 3 motivy (modre-nebe, kyberpunk, pergamen) — žádný kontrastní problém
- [ ] Skill `mobil-desktop` — vizuální audit
- [ ] `dluhy.md` — D-053 + D-054 otevřeny, D-NEW aktualizován
- [ ] `roadmap-fe.md` — 3.6a checkmark
- [ ] Skill `napoveda` — ověřit, že obsah Nápovědy konzistentní se zbytkem platformy
- [ ] Commit message dle konvence: `feat(help): role-matrix — globální/world dvouúrovňový model (3.6a)`

---

## Commit strategie

5 commitů:
1. `feat(themes): world role color tokens (3.6a)` — Step 1
2. `feat(ui): WorldRoleIcon component (3.6a)` — Step 2
3. `feat(help): role-matrix sekce — globální/world karty + matice (3.6a)` — Step 3
4. `test(help): role-matrix coverage + WorldRoleIcon tests (3.6a)` — Step 4
5. `docs: 3.6a doc cleanup, D-053/D-054 dluhy` — Step 5

Každý commit samostatně revertovatelný.
