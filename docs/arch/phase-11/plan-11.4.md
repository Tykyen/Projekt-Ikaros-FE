# Implementační plán — krok 11.4 Měny a převodník

**Datum:** 2026-05-26
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-11.4.md`](./spec-11.4.md)
**Větev:** **`main`** — commit přímo (per `feedback_work_on_main.md`)
**Repo:** `Projekt-ikaros-FE` + drobný **BE patch** v `Projekt-ikaros/backend/src/modules/world-currencies/` (rozšíření role gate pro PomocnyPJ — viz Step 1b).

---

## Pořadí stavby (proč v tomto pořadí)

1. **Foundation:** types + API hooks — bez nich nelze ani shared, ani page testovat
2. **Shared infrastruktura** (utily → hook → komponenty + stories) — postaveno první, aby se hned dogfoodovala
3. **Page-local utily + validation** — `setAsBase` math + zod schemas
4. **Page-local komponenty** — sekce, modaly, řádek
5. **Page orchestrator** — přepis stubu
6. **Verifikace** — lint, lint:colors, test:run, build
7. **`mobil-desktop` audit** — UI projetí mobil vs desktop
8. **`napoveda` update** — sekce v nápovědě
9. **Roadmap + dluhy update** — zaškrtnutí, případné nové D-čísla

**Commit strategie:** 3 commity (sdílená vrstva / page / docs). Každý revert-safe.

---

## Step 1 — Složková struktura + foundation (types, API)

**Soubory (nové):**
- `src/features/world/currencies/types.ts` — typy sjednocené s BE (`WorldCurrencyItem`, `WorldCurrenciesPayload`, `ConvertRequest`, `ConvertResult`)
- `src/features/world/currencies/api.ts` — 3 hooky:
  - `useWorldCurrencies(worldId)` — GET `/worlds/:worldId/currencies`, `queryKey: ['world-currencies', worldId]`, `staleTime: 5*60_000`, `placeholderData: { items: [] }`
  - `useUpdateCurrencies(worldId)` — PUT, optimistic update, on success invalidate `['world-currencies', worldId]`
  - `useConvertMutation(worldId)` — POST convert (non-cached mutation), žádná invalidace

**Příkazy:**
```powershell
New-Item -ItemType Directory -Force "src/features/world/currencies/shared"
New-Item -ItemType Directory -Force "src/features/world/currencies/utils"
New-Item -ItemType Directory -Force "src/features/world/currencies/components"
```

**Acceptance kroku:** `tsc --noEmit` ✓; importy `api.ts` se rozeznají bez chyby.

---

## Step 1b — BE patch (role gate pro PomocnyPJ)

**Repo:** `Projekt-ikaros` (jiný než FE).

**Soubory (edit):**
- `backend/src/modules/world-currencies/world-currencies.service.ts` — přidat `isMetadataOnlyEdit(old, new): boolean` helper, přidat `assertCanEdit` (kopie `assertCanAdmin` s prahem `WorldRole.PomocnyPJ`), upravit `updateCurrencies` flow per spec §4.8b
- `backend/src/modules/world-currencies/world-currencies.service.spec.ts` — 5 nových testů (PomocnyPJ edit ok / add 403 / delete 403 / set-as-base ok; Hrac 403)

**Příkazy:**
```powershell
# v Projekt-ikaros repu:
npx prettier --write backend/src/modules/world-currencies/
npx jest backend/src/modules/world-currencies/world-currencies.service.spec.ts
```

**⚠️ Pre-commit:** spustit `prettier --write` jinak husky hook selže (memory `feedback_be_precommit_prettier.md`).
**⚠️ Restart BE:** po patchi nutný restart `nest start --watch` nebo nový spawn (memory `feedback_be_restart_required.md`) — FE refresh nestačí.

**Acceptance kroku:** 16 + 5 = 21 testů ✓, žádné regresi v existujících 11 testech.

**Commit BE (samostatný, v Projekt-ikaros repu):**
```
feat(world-currencies): PomocnyPJ smi edit existujicich men

- isMetadataOnlyEdit helper (porovnani sady code)
- assertCanEdit (prah PomocnyPJ) vs assertCanAdmin (prah PJ)
- PUT smi PomocnyPJ pokud nemeni sadu code (jen edit rate/name/symbol)
- add/delete dal jen PJ+
- 5 novych unit testu

Spec FE: docs/arch/phase-11/spec-11.4.md §4.8b
```

---

## Step 2 — Shared util: `convertAmount` + `formatCurrency`

**Soubory (nové):**
- `src/features/world/currencies/shared/convertAmount.ts` — `convertAmount`, `formatAmount`, `formatCurrency` (pure functions per spec §4.7b)
- `src/features/world/currencies/shared/convertAmount.spec.ts` — testy:
  - base→base; base→other; other→other (přes base); from===to short-circuit
  - neznámý code → null
  - BE math parita (fixtura: amount=10, ZL→ST → 100 přesně podle BE round logiky)
  - `formatAmount` cs-CZ separátor (`12345.6789` → `12 345,6789`), trailing zeros ořez
  - `formatCurrency` symbol fallback na code když symbol prázdný

**Acceptance kroku:** `npx vitest run shared/convertAmount` ✓

---

## Step 3 — Shared hook: `useUserPreferredCurrency`

**Soubory (nové):**
- `src/features/world/currencies/shared/useUserPreferredCurrency.ts` — Jotai atomFamily + `atomWithStorage`, klíč `ikaros.currency.preferred.<worldId>`, return `{ preferredCode, setPreferred, resolvedCode, resolvedItem }`
- `src/features/world/currencies/shared/useUserPreferredCurrency.spec.ts` — testy:
  - localStorage persist přes refresh (manuální set + remount)
  - fallback na base (první item) když stored code není v items
  - fallback na base při `preferredCode === null`
  - reakce na změnu items (uložená měna zmizí → resolvedCode skočí na base)

**Acceptance kroku:** `npx vitest run useUserPreferredCurrency` ✓

---

## Step 4 — Shared komponenty + Storybook stories

**Soubory (nové) — všechny v `src/features/world/currencies/shared/`:**

| Soubor | Co |
|---|---|
| `CurrencySelect.tsx` | dropdown, props `{ value, onChange, items, showSymbol?, filterBy?, ariaLabel? }`, používá nativní `<select>` (jednoduchost > knihovny) s themed CSS |
| `CurrencySelect.spec.tsx` | render, onChange, filterBy |
| `CurrencySelect.stories.tsx` | Default, WithoutSymbol, FilteredBaseOnly |
| `CurrencyDisplay.tsx` | `{ amount, currencyCode, items, convertTo?, showTooltip? }`, render `{formatted} {symbol}` + optional tooltip s base equivalence |
| `CurrencyDisplay.spec.tsx` | render bez/s convertTo |
| `CurrencyDisplay.stories.tsx` | Default, Converted, WithTooltip |
| `CurrencyAmountInput.tsx` | combo `<NumberInput> + <CurrencySelect>`, props `{ amount, currencyCode, onAmountChange, onCurrencyChange, items }` |
| `CurrencyAmountInput.spec.tsx` | controlled change amount + currency |
| `CurrencyAmountInput.stories.tsx` | Default, LargeAmount, EmptyState (no items) |
| `index.ts` | barrel: export všech 5 primitiv + typ |

**Acceptance kroku:** `npx vitest run shared/` ✓; `npm run storybook` (pokud nemá hot crash) zobrazí 3 stories — manuálně skipnout pokud Storybook build zdržuje, ale stories soubory existují.

---

## Step 5 — Page-local utily + validation

**Soubory (nové):**
- `src/features/world/currencies/utils/setAsBase.ts` — `recomputeRatesForNewBase(items, newBaseCode): WorldCurrencyItem[]` per spec §4.6
- `src/features/world/currencies/utils/setAsBase.spec.ts` — testy:
  - 3 měny: ZL=1, ST=0.1, MD=0.01; newBase=ST → ZL=10, ST=1, MD=0.1
  - poměry zachovány (1 ZL = 10 ST = 100 MD před i po)
  - 2 měny: ZL=1, GD=5; newBase=GD → ZL=0.2, GD=1
  - newBase už je base → no-op
  - newBase neexistuje → throw / return null (rozhodnu — pravděpodobně throw, defensivní)
- `src/features/world/currencies/validation.ts` — zod schemas:
  - `currencyItemSchema` (code/name/symbol/rate constraints per spec §4.4)
  - `currencyItemFormSchema` (validation s `excludeCode?` pro uniqueness check; uniqueness se ověřuje proti aktuálnímu items array předaným do schema továrny)
- `src/features/world/currencies/validation.spec.ts` — testy:
  - code regex (A-Z0-9, 1-8 znaků, uppercase)
  - duplicate code → error
  - duplicate code self-edit (excludeCode) → OK
  - rate ≤ 0 → error; rate > 1M → error
  - name max 40, symbol max 8

**Acceptance kroku:** `npx vitest run utils/ validation` ✓

---

## Step 6 — Page-local komponenty

**Soubory (nové) — všechny v `src/features/world/currencies/components/`:**

| Soubor | Co |
|---|---|
| `ConverterSection.tsx` | sekce 4.2 — používá `<CurrencyAmountInput>` (from) + swap button + `<CurrencyAmountInput>` (to, amount read-only/computed), klient `convertAmount` + paralelní BE `useConvertMutation` (debounced 250 ms) pro autoritativní result; default `from = base`, `to = preferred (přes useUserPreferredCurrency) nebo první ne-base`; setPreferred při změně `to` |
| `ConverterSection.spec.tsx` | render, debounce (vi.useFakeTimers), swap, edge 0/1 currency, from===to short-circuit, persistence preferred při změně to |
| `CurrenciesListSection.tsx` | sekce 4.3 — desktop tabulka, mobil card list (CSS @media); orchestruje role gate, kebab, `+ Přidat měnu` |
| `CurrenciesListSection.spec.tsx` | hráč render (žádné akce v DOM), PJ render (kebab + add), base badge, base smazat disabled |
| `CurrencyRow.tsx` | jeden řádek/karta — props `{ item, isBase, canManage, onEdit, onDelete, onSetAsBase }` |
| `CurrencyFormModal.tsx` | 4.4 — `<Modal>` + RHF + zodResolver, pole code/name/symbol/rate, base mode (rate disabled), submit = full-replace mutation s aktualizovanou položkou |
| `CurrencyFormModal.spec.tsx` | RHF validace, optimistic save, error toast, base mode rate disabled |
| `SetAsBaseModal.tsx` | 4.6 — `<Modal>` s preview tabulkou nových kurzů + confirm button → mutation |
| `SetAsBaseModal.spec.tsx` | preview math, confirm flow, cancel |
| `index.ts` | barrel pro page consumers |

**Klíčové detaily:**
- Optimistic update: pred mutation `qc.setQueryData(['world-currencies', worldId], newPayload)`; `onError` revert; `onSettled` invalidate
- Mutation guard proti stale snapshot: pokud `dataUpdatedAt > 30_000` → `await refetch()` před assemble (spec §8 mitigace)
- Toast: `import { toast } from 'sonner'`
- Role gate: `const canManage = userRole !== null && userRole >= WorldRole.PomocnyPJ`

**Acceptance kroku:** `npx vitest run components/` ✓; `npm run lint` ✓; `npm run lint:colors` ✓

---

## Step 7 — Page orchestrator

**Soubory (přepis):**
- `src/features/world/pages/CurrencyPage.tsx` — z stubu na orchestrátor:
  ```tsx
  export default function CurrencyPage() {
    const { worldId, userRole, loading } = useWorldContext();
    const { data, isLoading } = useWorldCurrencies(worldId);
    const items = data?.items ?? [];
    const canManage = userRole !== null && userRole >= WorldRole.PomocnyPJ;
    if (loading || isLoading) return <PageSkeleton />;
    return (
      <PageLayout title="Převodník měn">
        <ConverterSection items={items} worldId={worldId} />
        <CurrenciesListSection items={items} canManage={canManage} worldId={worldId} />
      </PageLayout>
    );
  }
  ```
- `PageSkeleton` — krátký lokální komponent (3 řádky tabulky skeleton + převodník skeleton); pokud existuje sdílený `PageSkeleton`, použít ten

**Acceptance kroku:** dev server `npm run dev`, otevři `/svet/<slug>/prevodnik-men` v prohlížeči, stránka renderuje (i bez měn — empty state)

---

## Step 8 — Verifikace (před commit 1+2)

```powershell
npm run lint
npm run lint:colors
npm run test:run
npm run build
```

**Acceptance:** všechny 4 zelené. Žádné `tsc` warnings.

**Commit 1 (po Step 4):** sdílená infrastruktura
```
feat(currencies-11.4): sdílená currency infrastruktura

- utily convertAmount + formatCurrency (pure, BE math parity)
- hook useUserPreferredCurrency (Jotai atomFamily + localStorage per worldId)
- komponenty CurrencySelect / CurrencyDisplay / CurrencyAmountInput
- Storybook stories pro 3 komponenty
- barrel src/features/world/currencies/shared/index.ts
- 6 test souborů (~30+ testů)

Pripraveno pro 11.3c (Shop) a 8.x (Character finance) konzumenty.
Spec: docs/arch/phase-11/spec-11.4.md §4.7b
```

**Commit 2 (po Step 7):** page-local
```
feat(currencies-11.4): stranka /prevodnik-men (sprava men + prevodnik)

- types + api hooks (useWorldCurrencies / useUpdateCurrencies / useConvertMutation)
- utily setAsBase + validation (zod)
- komponenty ConverterSection / CurrenciesListSection / CurrencyRow
- modaly CurrencyFormModal / SetAsBaseModal
- CurrencyPage orchestrator (PJ+ CRUD, hrac read-only, mobil cards)
- 7 test souborů (~40+ testu)

BE world-currencies modul je kompletni, FE napojen 1:1.
Spec: docs/arch/phase-11/spec-11.4.md
```

---

## Step 9 — `mobil-desktop` audit

Spustit skill `mobil-desktop`. Projít:
- Desktop ≥ 1024 px — tabulka, převodník centered max-width 720 px
- Tablet 769–1024 px — stejné jako desktop, ale full width
- Mobil ≤ 768 px — tabulka → card list, převodník stack, swap button viditelný, kebab funguje (popover → bottom-sheet)
- Touch targets ≥ 44 px (smaž, edit, set-as-base kebab itemy)
- Modal scroll na malých výškách

Pokud najde issue → fix v rámci impl. (žádný dluh, per `feedback_no_debt.md`).

---

## Step 10 — `napoveda` update

Spustit skill `napoveda`. Sekce „Měny a převodník" v `/ikaros/napoveda` — popis:
- Co je převodník (komu slouží)
- Kdo může spravovat měny (PJ+)
- Co je „základ" a jak změnit
- Hráčova preferovaná měna (per-svět)
- Známá limitace: souběžná editace dvou PJ = last-write-wins

---

## Step 11 — Roadmap update + commit 3

**Soubory (edit):**
- `docs/roadmap-fe.md` §11.4 — zaškrtnout `11.4a` a `11.4b` a `11.4c` na `[x]`, přidat realizační poznámku ve stylu předchozích kroků (počty souborů, testů, klíčové dluhy/decisions)
- `docs/dluhy.md` — pokud při implementaci vznikne nový tracked dluh (např. ESLint pravidlo na hluboké importy do `shared/` — D-XXX), zapsat. Spec §6 acceptance #25 to akceptuje jako „nice-to-have", ne MUST.

**Commit 3:**
```
docs(currencies-11.4): roadmap + napoveda + tracked dluhy

- roadmap-fe.md: oznacit 11.4a/b/c jako hotove + zhrnuti
- napoveda: nova sekce „Meny a prevodnik"
- dluhy: <pripadny D-XXX> nebo „zadne nove dluhy"
```

---

## Závěrečný checklist

- [ ] Build prochází (`npm run build`)
- [ ] Lint prochází (`npm run lint`)
- [ ] Lint colors prochází (`npm run lint:colors`)
- [ ] Testy prochází (`npm run test:run`) — očekávám +70 nových testů
- [ ] Smoke 1: nový svět fantasy → `/svet/<slug>/prevodnik-men` zobrazí ZL/ST/MD
- [ ] Smoke 2: jako PJ přidat „DK rate 100" → po refreshi zachováno
- [ ] Smoke 3: 10 DK → ST = 10 000 (math correct)
- [ ] Smoke 4: změna base na ST → kurzy přepočítány zachovaným poměrem
- [ ] Smoke 5: hráč → read-only, žádný edit v DOM
- [ ] Smoke 6: mobil 375 px → tabulka → cards, swap funguje
- [ ] Smoke 7: localStorage `ikaros.currency.preferred.<worldId>` existuje po změně `to` v převodníku
- [ ] `mobil-desktop` skill bez issues (nebo issues fixed)
- [ ] `napoveda` aktualizována
- [ ] `roadmap-fe.md` 11.4 zaškrtnuto
- [ ] `dluhy.md` aktualizováno (pokud relevantní)

---

## Commit strategie

3 commity (revert-safe granularity):

| # | Po kroku | Scope |
|---|---|---|
| 1 | Step 4 | sdílená infrastruktura (~10 souborů, 30+ testů) |
| 2 | Step 7 | page-local + orchestrátor (~10 souborů, 40+ testů) |
| 3 | Step 11 | docs (roadmap + nápověda + dluhy) |

Každý commit musí mít zelený lint + testy. Nepushuju (per default — uživatel rozhodne kdy push).

---

## Odhad času

- Step 1–4 (shared): ~60 min
- Step 5–7 (page): ~75 min
- Step 8–11 (verifikace + docs): ~30 min
- **Celkem:** ~3 h aktivního kódování, +čas na `mobil-desktop` audit a oprava nálezů
