# Implementační plán 2.3 — Vytvoření světa

**Status:** ✅ Implementováno
**Spec:** [spec-2.3.md](./spec-2.3.md)
**Větev:** `feat/krok-2.3-create-world` (vznikne až po souhlasu)
**Odhad:** ~700 ř. FE + ~20 ř. BE + ~150 ř. testů

---

## Pořadí kroků (od BE směrem k FE, aby šlo průběžně testovat)

### Krok 1 — BE: doplnit `CreateWorldDto`

**Soubor:** `C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/worlds/dto/create-world.dto.ts`

Přidat 3 pole:
```ts
import { IsArray /* + existing */ } from 'class-validator';

@IsOptional() @IsArray() @IsString({ each: true }) tones?: string[];
@IsOptional() @IsString() @MaxLength(500) playersWanted?: string;
@IsOptional() @IsArray() @IsString({ each: true }) dice?: string[];
```

**Soubor:** `worlds.service.ts` — ověřit, že `create()` propaguje vstup beze ztráty (jen `...input` spread → OK; pokud explicitně whitelistuje, doplnit nová pole).

**Soubor:** `update-world.dto.ts` (pokud existuje) — analogicky doplnit (in-scope, protože 2.5 nás čeká a aby BE bylo konzistentní).

### Krok 2 — BE: test

**Soubor:** `worlds.service.spec.ts` — přidat test:
```ts
it('forwards tones/dice/playersWanted to repo on create', async () => {
  const dto = { name: 'X', slug: 'x', tones: ['Temný'], dice: ['d20'], playersWanted: 'aktivní hráče' };
  await service.create(ownerId, dto as CreateWorldDto);
  expect(repoCreate).toHaveBeenCalledWith(expect.objectContaining({
    tones: ['Temný'], dice: ['d20'], playersWanted: 'aktivní hráče',
  }));
});
```

### Krok 3 — FE: doplnit typ `World`

**Soubor:** [`src/shared/types/index.ts:282`](../../src/shared/types/index.ts) — přidat 2 řádky:
```diff
   tones?: string[];
+  playersWanted?: string;
+  dice?: string[];
   system: string;
```

### Krok 4 — FE: hook `useCreateWorld`

**Nový soubor:** `src/features/world/api/useCreateWorld.ts` (~30 ř.)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { World } from '@/shared/types';

export interface CreateWorldInput {
  name: string;
  slug: string;
  description?: string;
  genre?: string;
  tones?: string[];
  playersWanted?: string;
  maxPlayers?: number | null;
  accessMode: 'public' | 'open' | 'private';
  system: string;
  dice?: string[];
}

export function useCreateWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorldInput) =>
      api.post<World>('/worlds', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'public'] });
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}
```

### Krok 5 — FE: konstanty

**Refactor:** `src/features/ikaros/pages/CreateWorldPage.tsx` (stub) → `src/features/ikaros/pages/CreateWorldPage/` (složka).

**Nové soubory:**

`constants/genres.ts` (~15 ř.):
```ts
export const GENRES = [
  'Fantasy', 'Sci-Fi', 'Cyberpunk', 'Post-apokalypsa', 'Horror',
  'Mystery', 'Historický', 'Moderní / Současný', 'Western', 'Vlastní',
] as const;
export type Genre = (typeof GENRES)[number];
```

`constants/tones.ts` (~30 ř.) — 24 tónů + `'Vlastní'`:
```ts
export const TONES = [
  'Temný','Ponurý','Brutální','Realistický','Syrový','Tragický',
  'Hrdinský','Epický','Dobrodružný','Napínavý','Tajemný','Hororový',
  'Psychologický','Melancholický','Cynický','Nadějeplný','Romantický','Komorní',
  'Velkolepý','Stylizovaný','Groteskní','Sarkastický','Humorný','Černohumorný',
  'Vlastní',
] as const;
```

`constants/dice.ts` (~15 ř.):
```ts
export const DICE = [
  'd4','d6','d8','d10','d12','d20','d100 / procenta',
  '2d6','3d6','Pool d6','Pool d10','Mixed polyhedral','Fate kostky',
] as const;
```

`constants/systems.ts` (~15 ř.):
```ts
export interface RpgSystem { id: string; label: string; }
export const RPG_SYSTEMS: RpgSystem[] = [
  { id: 'matrix', label: 'Matrix (Klasická TTRPG Pravidla)' },
];
export const DEFAULT_SYSTEM = 'matrix';
```

### Krok 6 — FE: util `useWorldSlug` + test

**Nové soubory:** `hooks/useWorldSlug.ts` (~50 ř.) + `__tests__/useWorldSlug.spec.ts` (~30 ř.)

```ts
// hooks/useWorldSlug.ts
import { useEffect, useRef, useState } from 'react';

const TRANSLIT: Record<string, string> = {
  'á':'a','č':'c','ď':'d','é':'e','ě':'e','í':'i','ň':'n','ó':'o','ř':'r',
  'š':'s','ť':'t','ú':'u','ů':'u','ý':'y','ž':'z',
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function useWorldSlug(name: string) {
  const [slug, setSlug] = useState('');
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) setSlug(slugify(name));
  }, [name]);

  const onSlugChange = (value: string) => {
    dirtyRef.current = true;
    setSlug(value);
  };

  return { slug, onSlugChange };
}
```

**Test cases (4):**
1. `slugify('Šedý hrad')` → `'sedy-hrad'`
2. `slugify('Příběh & hra!')` → `'pribeh-hra'`
3. `slugify('aaa  bbb')` → `'aaa-bbb'` (mezery sloučené)
4. `useWorldSlug` — po ručním `onSlugChange` auto-derive už nefunguje (dirty flag).

### Krok 7 — FE: `CheckboxGrid` komponenta + test

**Nový soubor:** `components/CheckboxGrid.tsx` + `.module.css` (~70 ř.)

```tsx
interface Props {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  ariaLabel: string;
}

export function CheckboxGrid({ options, value, onChange, ariaLabel }: Props) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt)
      ? value.filter((v) => v !== opt)
      : [...value, opt]);
  };
  return (
    <div className={s.grid} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <label key={opt} className={s.cell}>
          <input
            type="checkbox"
            checked={value.includes(opt)}
            onChange={() => toggle(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}
```

CSS: `grid-template-columns: repeat(3, 1fr)` desktop; `repeat(2, 1fr)` tablet; `1fr` mobil. Touch target 44px+.

**Test cases (2):**
1. Klik na unchecked option volá `onChange` s přidaným prvkem.
2. Klik na checked option volá `onChange` s odebraným prvkem.

### Krok 8 — FE: `SectionCard` wrapper

**Nový soubor:** `components/SectionCard.tsx` + `.module.css` (~25 ř.)

Wrapper s nadpisem (`<h2>`) + volitelným popisem (`<p>`) + slot pro children. Žádný state. Reuse `var(--frame-border)`, `var(--surface-2)`, `var(--shadow-md)`.

### Krok 9 — FE: 5 sekcí

#### 9a. `BasicInfoSection.tsx` (~80 ř.)
- Props: `value: { name, slug, description }`, `onChange`, `slugAutoActive: boolean`, `onSlugManualChange`.
- Renderuje: 3 inputy (name, slug, description textarea).
- Inline validation message při `name.length < 2 || > 60`.
- Helper text pod slugem: `Adresa světa: /svet/{slug}`.

#### 9b. `GenreSection.tsx` (~70 ř.)
- Props: `genre, tones, customGenre, customTone`, `onChange`.
- Renderuje: `<select>` žánrů (GENRES) + free-text input pokud `genre === 'Vlastní'`.
- Pak `CheckboxGrid` pro TONES + free-text input pokud `tones.includes('Vlastní')`.

#### 9c. `PlayersSection.tsx` (~50 ř.)
- Props: `playersWanted, maxPlayers`, `onChange`.
- Renderuje: textarea + `<input type="number" min={1} max={999}>`.
- Layout: 2 sloupce desktop (textarea 2/3, number 1/3), 1 sloupec mobil.

#### 9d. `AccessModeSection.tsx` (~80 ř.)
- Props: `value: 'public'|'open'|'private'`, `onChange`.
- Renderuje 3 radio chips. Pod chipy popis aktuální volby:
  - `public`: „Každý si svět prohlédne a může do něj rovnou vstoupit."
  - `open`: „Každý si svět prohlédne, ale o vstup žádá PJ."
  - `private`: „Svět vidí jen členové. Vstup přes žádost."

#### 9e. `SystemSection.tsx` (~60 ř.)
- Props: `system, dice, customDice (NA)`, `onChange`.
- Renderuje: `<select>` z `RPG_SYSTEMS` + `CheckboxGrid` pro DICE.

### Krok 10 — FE: orchestrátor `CreateWorldPage.tsx`

**Nový soubor:** `CreateWorldPage/CreateWorldPage.tsx` (~180 ř.)

State (jedna kombinace `useState` per pole, ne form library — zachová pattern z projektu):
```tsx
const [name, setName] = useState('');
const { slug, onSlugChange } = useWorldSlug(name);
const [description, setDescription] = useState('');
const [genre, setGenre] = useState<string>('');
const [customGenre, setCustomGenre] = useState('');
const [tones, setTones] = useState<string[]>([]);
const [customTone, setCustomTone] = useState('');
const [playersWanted, setPlayersWanted] = useState('');
const [maxPlayers, setMaxPlayers] = useState<number | ''>('');
const [accessMode, setAccessMode] = useState<'public'|'open'|'private'>('private');
const [system, setSystem] = useState(DEFAULT_SYSTEM);
const [dice, setDice] = useState<string[]>([]);

const mutation = useCreateWorld();
const navigate = useNavigate();

const canSubmit =
  name.length >= 2 && name.length <= 60 &&
  slug.length >= 2 &&
  (genre !== '' && (genre !== 'Vlastní' || customGenre.trim() !== ''));

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!canSubmit) return;
  const finalGenre = genre === 'Vlastní' ? customGenre.trim() : genre;
  const finalTones = tones
    .filter((t) => t !== 'Vlastní')
    .concat(customTone.trim() ? [customTone.trim()] : []);
  try {
    const world = await mutation.mutateAsync({
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
      genre: finalGenre,
      tones: finalTones.length ? finalTones : undefined,
      playersWanted: playersWanted.trim() || undefined,
      maxPlayers: maxPlayers === '' ? null : maxPlayers,
      accessMode,
      system,
      dice: dice.length ? dice : undefined,
    });
    toast.success(`Svět «${world.name}» byl vytvořen.`);
    navigate(`/svet/${world.id}`);
  } catch (err) {
    const code = (err as ApiError)?.error?.code;
    if (code === 'CONFLICT') {
      toast.error('Slug už existuje, zvol jiný.');
    } else {
      toast.error('Vytvoření světa selhalo. Zkus to znovu.');
    }
  }
};

return (
  <form className={s.page} onSubmit={handleSubmit}>
    <header className={s.header}>
      <button type="button" onClick={() => navigate(-1)} aria-label="Zpět">←</button>
      <h1>Vytvořit nový svět</h1>
    </header>

    <BasicInfoSection ... />
    <GenreSection ... />
    <PlayersSection ... />
    <AccessModeSection ... />
    <SystemSection ... />

    <footer className={s.footer}>
      <button type="button" onClick={() => navigate(-1)}>Zrušit</button>
      <button type="submit" disabled={!canSubmit || mutation.isPending}>
        {mutation.isPending ? 'Vytvářím…' : 'Vytvořit svět'}
      </button>
    </footer>
  </form>
);
```

**CSS:** sticky footer, max-width 800 px, mobile breakpoint 768 px.

### Krok 11 — FE: `index.ts` re-export

**Nový soubor:** `CreateWorldPage/index.ts`:
```ts
export { default } from './CreateWorldPage';
```

**Smazat:** starý stub `src/features/ikaros/pages/CreateWorldPage.tsx` (musí být `git rm`, ne jen overwrite, aby složka neměla konflikt s file).

**Router:** žádná změna — `lazy(() => import('@/features/ikaros/pages/CreateWorldPage'))` rezolvuje na složku.

### Krok 12 — FE: testy

**Nové soubory:**

`__tests__/useWorldSlug.spec.ts` (4 testy — viz krok 6).

`__tests__/CheckboxGrid.spec.tsx` (2 testy — viz krok 7).

`__tests__/CreateWorldPage.spec.tsx` (3 testy):
1. „Vyplnění minima → mutation called s defaulty" — vyplň name='Test', vyber genre='Fantasy', klik 'Vytvořit svět'. Spy mutate; očekáváno `{name:'Test', slug:'test', genre:'Fantasy', accessMode:'private', system:'matrix'}`.
2. „Slug auto-derive zastaví po manuální editaci" — render, type 'Šedý', čekej `slug='sedy'`; manuálně změň slug na `'foo'`; type dále `'Šedý hrad'`; očekávej `slug='foo'`.
3. „Success → navigate '/svet/:id'" — mock mutateAsync vrací `{ id: 'w1', name: 'X' }`; submit; očekávej `navigate('/svet/w1')` called.

`__tests__/BasicInfoSection.spec.tsx` (1 test): error message při `name.length === 1`.

**Celkem +10 FE testů** (4 slug + 2 grid + 3 page + 1 section). Spec říká „~10", odpovídá.

### Krok 13 — Validace

```powershell
npm run lint
npm run lint:colors
npm run tsc
npm run build
npm run test:run
```

Všechny musí projít. FE celkem ~393 testů (383 existujících + 10 nových).

### Krok 14 — Roadmap update

V `docs/roadmap-fe.md` zaškrtnout položky 2.3:
- `[x] 2.3 Vytvoření světa` + datum 2026-05-14.
- `[x] Wizard: ...` (s poznámkou „realizováno jako single-page form, ne wizard").
- Přidat odkazy na spec + plan.
- Přidat sekci „Tracked dluhy z 2.3": **D-NEW-tooltips**, **D-NEW-quota**, **D-NEW-slug-check**.

---

## Soubory měněné/nové

### BE (Projekt-ikaros/backend)
| Soubor | Stav | LOC |
|--------|------|-----|
| `modules/worlds/dto/create-world.dto.ts` | edit | +3 |
| `modules/worlds/dto/update-world.dto.ts` | edit (pokud existuje a postrádá) | +3 |
| `modules/worlds/worlds.service.spec.ts` | edit | +15 |

### FE (Projekt-ikaros-FE)
| Soubor | Stav | LOC |
|--------|------|-----|
| `src/shared/types/index.ts` | edit | +2 |
| `src/features/world/api/useCreateWorld.ts` | nový | ~30 |
| `src/features/ikaros/pages/CreateWorldPage.tsx` | **smazat** stub | -3 |
| `src/features/ikaros/pages/CreateWorldPage/index.ts` | nový | 1 |
| `src/features/ikaros/pages/CreateWorldPage/CreateWorldPage.tsx` | nový | ~180 |
| `src/features/ikaros/pages/CreateWorldPage/CreateWorldPage.module.css` | nový | ~80 |
| `src/features/ikaros/pages/CreateWorldPage/components/SectionCard.tsx` | nový | ~25 |
| `src/features/ikaros/pages/CreateWorldPage/components/SectionCard.module.css` | nový | ~20 |
| `src/features/ikaros/pages/CreateWorldPage/components/CheckboxGrid.tsx` | nový | ~40 |
| `src/features/ikaros/pages/CreateWorldPage/components/CheckboxGrid.module.css` | nový | ~30 |
| `src/features/ikaros/pages/CreateWorldPage/components/BasicInfoSection.tsx` | nový | ~80 |
| `src/features/ikaros/pages/CreateWorldPage/components/GenreSection.tsx` | nový | ~70 |
| `src/features/ikaros/pages/CreateWorldPage/components/PlayersSection.tsx` | nový | ~50 |
| `src/features/ikaros/pages/CreateWorldPage/components/AccessModeSection.tsx` | nový | ~80 |
| `src/features/ikaros/pages/CreateWorldPage/components/SystemSection.tsx` | nový | ~60 |
| `src/features/ikaros/pages/CreateWorldPage/components/sections.module.css` | nový | ~100 |
| `src/features/ikaros/pages/CreateWorldPage/constants/genres.ts` | nový | ~15 |
| `src/features/ikaros/pages/CreateWorldPage/constants/tones.ts` | nový | ~30 |
| `src/features/ikaros/pages/CreateWorldPage/constants/dice.ts` | nový | ~15 |
| `src/features/ikaros/pages/CreateWorldPage/constants/systems.ts` | nový | ~15 |
| `src/features/ikaros/pages/CreateWorldPage/hooks/useWorldSlug.ts` | nový | ~50 |
| `src/features/ikaros/pages/CreateWorldPage/__tests__/useWorldSlug.spec.ts` | nový | ~30 |
| `src/features/ikaros/pages/CreateWorldPage/__tests__/CheckboxGrid.spec.tsx` | nový | ~30 |
| `src/features/ikaros/pages/CreateWorldPage/__tests__/CreateWorldPage.spec.tsx` | nový | ~80 |
| `src/features/ikaros/pages/CreateWorldPage/__tests__/BasicInfoSection.spec.tsx` | nový | ~25 |
| `docs/roadmap-fe.md` | edit (zaškrtnutí 2.3 + dluhy) | ~5 |

**FE celkem:** ~1130 ř. (vč. testů, CSS, type changes).
**BE celkem:** ~20 ř.

---

## Pořadí commitů

1. **BE:** `feat(worlds): krok 2.3 — accept tones/playersWanted/dice in CreateWorldDto` (~3 soubory, ~20 ř.) — push do `Projekt-ikaros` repo.
2. **FE infra:** `feat(types): World gets playersWanted + dice` + `feat(api): useCreateWorld hook` (~2 soubory).
3. **FE konstanty + util:** `feat(create-world): constants + slug util + tests` (~6 souborů + 2 testy).
4. **FE komponenty:** `feat(create-world): 5 form sections + CheckboxGrid + SectionCard` (~12 souborů).
5. **FE stránka + testy:** `feat(create-world): CreateWorldPage orchestrator + integration tests` (~5 souborů).
6. **Roadmap:** `docs: krok 2.3 — zaškrtnutí + tracked dluhy`.

---

## Otevřené body k potvrzení

1. **BE: ano commit do `Projekt-ikaros` repo** (analog 2.1b/2.1c)?
2. **`UpdateWorldDto`** — doplnit v rámci 2.3, nebo nechat na 2.5? (Doporučuji: doplnit teď, drobnost, drží konzistenci.)
3. **Pořadí commitů**: oddělené commity per logickou skupinu, nebo jeden velký commit pro celý FE? (Doporučuji oddělené per krok výše.)
4. **Free-text custom žánr/tón** — fakticky go-to-prod, nebo nechat jen výběr ze seznamu (jednodušší)? (Spec navrhuje custom; ale lze odložit jako out-of-scope.)
5. **Toast `'Vytvořit svět'` text** — preference?

Když řekneš „plán OK" (případně s úpravami), pustím se do implementace v pořadí kroků 1–14.
