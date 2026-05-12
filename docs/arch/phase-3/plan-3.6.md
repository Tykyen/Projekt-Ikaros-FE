# Plán 3.6 — Implementace stránky Nápověda

**Status:** Draft — čeká na schválení
**Spec:** [spec-3.6.md](spec-3.6.md) ✅ schváleno 2026-05-12
**Větev:** `feat/krok-3.6-napoveda`
**Datum:** 2026-05-12

---

## 0. Design rozhodnutí (krátký audit místo samostatného design-3.6.md)

Stránka je **long-form text bez ornamentů ani nových theme tokenů**, proto se design audit zjednodušuje na rozhodnutí níže — nepotřebujeme `design-3.6.md` ve formátu 1.4 (kde se řešily karty/chipy/cornerstones napříč 21 motivy).

### Vizuální principy

1. **Reuse, ne reinvent** — TermsPage typografie (`h1` 1.6 lh, `h2` upper-case sm) + UsersPage tabs vzhled (border-bottom underline, scroll-snap).
2. **Max-width 800 px** (TermsPage má 720, ale tabulky rolí potřebují víc dechu — kontrast přes ano/ne sloupce vyžaduje ~720+ uvnitř obsahu).
3. **Žádné CornerOrnamenty** — long-form content. Konzistence s TermsPage.
4. **Žádné nové theme tokeny.** Jen `--text` / `--text-strong` / `--text-muted` / `--surface-2` / `--accent` / `--warning` / `--frame-border` / `--theme-heading` (fallback `--text-strong`).
5. **„Funguje" / „Připravujeme" pill**: `--accent` bg / `--surface-2` bg, drobný badge vedle nadpisu stránky v tabu „Stránky".
6. **Tabulky rolí**: `--surface-2` zebra rows, sticky první sloupec na mobilu, `overflow-x: auto`.
7. **`<details>` / `<summary>` pro FAQ** — nativní accordion, žádný JS state, theme-aware přes CSS. Ušetří 50 ř. kódu vs. custom accordion.
8. **Internal links** `<Link>` z react-router; externí (mailto) `<a>`.

### 21 motivů — quick mental audit

- **Modré nebe / Zlatý standard / Hospoda / Pergamen** — typografie standardní, žádné riziko. ✅
- **Kyberpunk / Vesmírná loď / Sci-fi** — display fonty na `h1/h2` jsou monospace/futuristic, ale tokeny `--text-strong` přepnou barvu sami. Acceptable. ✅
- **Nemrtví / Temná červeň** — temný background, `--surface-2` má dostatek kontrastu (ověřeno v 1.0 contrast auditu). ✅
- **Severské runy / Indiánské / Africké / Arabský svět** — display fontů na `h2`. Žádné ornamenty → nezasahuje. ✅
- **Bílá** — minimalistická, `--text-muted` šedá je čitelná. ✅
- **Měsíc / Slunce / Příroda / Čtyři živly / Magie / Postapo / Vesmírná bitva** — všechny prošly contrast auditem v 1.0. ✅

**Závěr auditu:** žádné theme override nepotřeba. Stačí lint:colors a vizuální smoke v Theme Storybook.

---

## 1. Pořadí souborů (8 souborů, ~750 ř.)

```
src/features/ikaros/pages/HelpPage/
├── HelpPage.tsx                       # ~70 ř. — tab state, URL sync, layout
├── HelpPage.module.css                # ~180 ř. — tabs + obsah + tabulky + responsive
├── helpers.ts                         # ~25 ř. — tab key parsing + validace
├── sections/
│   ├── StartSection.tsx               # ~90 ř. — Začni tady
│   ├── PagesSection.tsx               # ~150 ř. — seznam stránek ✅/🚧
│   ├── AccountSection.tsx             # ~100 ř. — 7 sekcí profilu + tombstone
│   ├── RolesSection.tsx               # ~130 ř. — tabulky + akční matice
│   └── FaqSection.tsx                 # ~70 ř. — <details> sekce
src/features/ikaros/pages/HelpPage/__tests__/
└── HelpPage.spec.tsx                  # ~80 ř. — render tabs, URL sync, sekce smoke
```

**Smazat:**
- `src/features/ikaros/pages/HelpPage.tsx` (stub, 3 ř.) — nahradíme adresářovou verzí.

**Upravit:**
- `src/app/router.tsx:24` — import `HelpPage` z `'@/features/ikaros/pages/HelpPage'` (index.ts re-export). Default vždy `./HelpPage.tsx` → `./HelpPage/HelpPage.tsx`. Pokud TS auto-resoluje přes adresář (next-style), žádná změna potřeba — viz krok 1.
- `docs/dluhy.md` — přidat **D-NEW** „aktualizovat HelpPage při každé fázi 1.5/1.7/1.8/2.x/3.x".
- `docs/roadmap-fe.md` — flagnout 3.6 jako ✅ a poznamenat „vytaženo dopředu".

---

## 2. Krok za krokem

### Krok 1 — Smazat stub + vytvořit adresář

```bash
# v repo rootu Projekt-ikaros-FE
rm src/features/ikaros/pages/HelpPage.tsx
mkdir -p src/features/ikaros/pages/HelpPage/sections
mkdir -p src/features/ikaros/pages/HelpPage/__tests__
```

Router pattern: vytvořím `HelpPage/index.ts` (re-export default), aby existující import `'@/features/ikaros/pages/HelpPage'` v [router.tsx:24](../../../src/app/router.tsx#L24) **fungoval beze změny**.

### Krok 2 — `helpers.ts` (tab klíče + validace)

```ts
// src/features/ikaros/pages/HelpPage/helpers.ts
export const HELP_TABS = ['start', 'stranky', 'ucet', 'role', 'faq'] as const;
export type HelpTab = (typeof HELP_TABS)[number];

export const TAB_LABELS: Record<HelpTab, string> = {
  start: 'Začni tady',
  stranky: 'Stránky',
  ucet: 'Účet & profil',
  role: 'Role & oprávnění',
  faq: 'FAQ',
};

export const DEFAULT_TAB: HelpTab = 'start';

export function parseTab(raw: string | null): HelpTab {
  return HELP_TABS.includes(raw as HelpTab) ? (raw as HelpTab) : DEFAULT_TAB;
}
```

### Krok 3 — `HelpPage.tsx` (kontejner)

```tsx
// src/features/ikaros/pages/HelpPage/HelpPage.tsx
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { HELP_TABS, TAB_LABELS, parseTab, type HelpTab } from './helpers';
import { StartSection } from './sections/StartSection';
import { PagesSection } from './sections/PagesSection';
import { AccountSection } from './sections/AccountSection';
import { RolesSection } from './sections/RolesSection';
import { FaqSection } from './sections/FaqSection';
import s from './HelpPage.module.css';

const SECTIONS: Record<HelpTab, () => JSX.Element> = {
  start: StartSection,
  stranky: PagesSection,
  ucet: AccountSection,
  role: RolesSection,
  faq: FaqSection,
};

export default function HelpPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get('sekce'));
  const Section = SECTIONS[tab];

  function changeTab(next: HelpTab) {
    setParams((prev) => {
      const out = new URLSearchParams(prev);
      if (next === 'start') out.delete('sekce');
      else out.set('sekce', next);
      return out;
    });
  }

  return (
    <article className={s.page}>
      <header className={s.header}>
        <h1>Nápověda</h1>
        <p className={s.lead}>
          Co stránky umí, kdo má jaká práva, jak na účet a kam se obrátit. Aktualizováno k 2026-05-12.
        </p>
      </header>

      <nav className={s.tabs} role="tablist" aria-label="Sekce nápovědy">
        {HELP_TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={clsx(s.tab, tab === t && s.tabActive)}
            onClick={() => changeTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      <section className={s.content}>
        <Section />
      </section>
    </article>
  );
}
```

### Krok 4 — `HelpPage.module.css`

```css
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-4) var(--sp-10);
  color: var(--text);
  line-height: 1.65;
}

.header h1 {
  margin: 0 0 var(--sp-2);
  color: var(--text-strong);
  font-family: var(--font-display);
}

.lead {
  margin: 0 0 var(--sp-5);
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.tabs {
  display: flex;
  gap: var(--sp-2);
  border-bottom: 1px solid var(--frame-border);
  margin-bottom: var(--sp-6);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.tab {
  position: relative;
  padding: var(--sp-3) var(--sp-4);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--theme-text-muted, var(--text-muted));
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  letter-spacing: 0.04em;
  cursor: pointer;
  scroll-snap-align: start;
  white-space: nowrap;
  transition:
    color var(--transition-base),
    border-color var(--transition-base);
}

.tab:hover { color: var(--theme-text, var(--text-primary)); }

.tabActive {
  color: var(--theme-heading, var(--text-strong));
  border-bottom-color: var(--tab-underline-color, var(--accent));
}

.content :global(h2) {
  margin: var(--sp-6) 0 var(--sp-3);
  font-size: var(--text-md);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-strong);
}

.content :global(h3) {
  margin: var(--sp-5) 0 var(--sp-2);
  font-size: var(--text-sm);
  color: var(--text-strong);
}

.content :global(p),
.content :global(ul),
.content :global(ol) {
  margin: 0 0 var(--sp-3);
}

.content :global(ul),
.content :global(ol) {
  padding-left: var(--sp-5);
}

.content :global(a) {
  color: var(--accent);
  text-decoration: underline;
}

.content :global(table) {
  width: 100%;
  border-collapse: collapse;
  margin: var(--sp-3) 0 var(--sp-5);
  font-size: var(--text-sm);
}

.content :global(th),
.content :global(td) {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--frame-border);
  text-align: left;
  vertical-align: top;
}

.content :global(th) {
  color: var(--text-strong);
  font-weight: var(--weight-semi);
  background: var(--surface-2);
}

.content :global(tbody tr:nth-child(even)) {
  background: color-mix(in srgb, var(--surface-2) 50%, transparent);
}

.tableWrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.statusPill {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 2px var(--sp-2);
  margin-left: var(--sp-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: 0.02em;
  vertical-align: middle;
}

.statusPillOk { background: var(--accent); color: var(--text-on-accent, #fff); }
.statusPillSoon { background: var(--surface-2); color: var(--text-muted); }

.pageItem {
  margin: 0 0 var(--sp-5);
  padding: var(--sp-3) var(--sp-4);
  background: color-mix(in srgb, var(--surface-2) 35%, transparent);
  border-left: 3px solid var(--frame-border);
  border-radius: var(--radius-sm);
}

.pageItemOk { border-left-color: var(--accent); }

.pageItem h3 {
  display: flex;
  align-items: center;
  margin: 0 0 var(--sp-2);
}

.pageItem code {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-left: var(--sp-2);
}

.faqItem {
  border-bottom: 1px solid var(--frame-border);
  padding: var(--sp-3) 0;
}

.faqItem summary {
  cursor: pointer;
  font-weight: var(--weight-semi);
  color: var(--text-strong);
  list-style: none;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.faqItem summary::before {
  content: '▸';
  color: var(--accent);
  font-size: 0.75em;
  transition: transform var(--transition-base);
}

.faqItem[open] summary::before {
  transform: rotate(90deg);
}

.faqItem summary::-webkit-details-marker { display: none; }

.faqItem p,
.faqItem ul {
  margin-top: var(--sp-2);
  color: var(--text);
}

.warning {
  padding: var(--sp-3) var(--sp-4);
  background: var(--surface-2);
  border-left: 3px solid var(--warning);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  margin: var(--sp-3) 0;
}

@media (max-width: 768px) {
  .page { padding: var(--sp-4) var(--sp-3) var(--sp-8); }
  .tab { padding: var(--sp-2) var(--sp-3); font-size: var(--text-xs); }
  .content :global(table) { min-width: 520px; }
}
```

> **Pozn.:** Pokud `color-mix()` není v cílovém browser supportu, fallback je transparent `var(--surface-2)` přímo (žádný visual bug, jen méně subtle gradient).

### Krok 5 — Sekce: `StartSection.tsx`

Obsah dle spec §4.2 — 5 odstavců + 1 seznam orientace. Použije `<Link>` na profil/uzivatele (anon → requireAuth redirect na login modal funguje sám).

Sekce komponuje statický JSX přes plain text + `<Link>` + `<ul>`. Žádný state.

### Krok 6 — Sekce: `PagesSection.tsx`

Pole jednotek `{ path, name, status, who, what, soon? }`. Mapuje na `<div className={s.pageItem}>` s ✅/🚧 pillem. Položky podle audit tabulky v specu §3.

```tsx
const PAGES: PageDoc[] = [
  { path: '/', name: 'Úvodník', status: 'ok',
    who: 'Všichni (anon i přihlášení)',
    what: 'Vítací stránka, novinky platformy, přehled vesmírů v sidebaru.' },
  { path: '/ikaros/napoveda', name: 'Nápověda', status: 'ok',
    who: 'Všichni', what: 'Tato stránka.' },
  // ...
];
```

### Krok 7 — Sekce: `AccountSection.tsx`

7 podsekcí dle §4.2. Bez tabulek, jen `<h3>` + `<p>`/`<ul>`. Zmínka tombstone + default avatary.

### Krok 8 — Sekce: `RolesSection.tsx`

Dvě tabulky (globální role + akční matice + světové role). Každá obalená `<div className={s.tableWrap}>`. Krátký intro paragraf nad každou.

### Krok 9 — Sekce: `FaqSection.tsx`

Pole `{ q, a }`. Render přes `<details className={s.faqItem}><summary>{q}</summary><p>{a}</p></details>`.

### Krok 10 — Test `HelpPage.spec.tsx`

```ts
- renderuje 5 tlačítek tabů s českými popisky
- default URL bez ?sekce= → tab „Začni tady" je aktivní + sekce „Začni tady" obsahuje text „Co je Projekt Ikaros"
- click „Stránky" → URL ?sekce=stranky + obsah obsahuje „Úvodník" + „Pošta"
- click „Role & oprávnění" → obsahuje řetězec „Superadmin" + „Hierarchie"
- click „FAQ" → details element existuje
- neznámé ?sekce=xyz → fallback na „Začni tady"
- click tab „Začni tady" z jiného tabu → URL bez `sekce=`
```

Vendor: `@testing-library/react`, `vitest`, `MemoryRouter`.

### Krok 11 — `index.ts` re-export

```ts
// src/features/ikaros/pages/HelpPage/index.ts
export { default } from './HelpPage';
```

(Pro jistotu — TypeScript moduleResolution `bundler` by si poradil i bez něj, ale explicitně bezpečně.)

### Krok 12 — Roadmap + dluhy update

```diff
# docs/roadmap-fe.md
- ### - [ ] 3.6 Nápověda (`/ikaros/napoveda`)
- - [ ] Statická stránka s tutoriály
+ ### - [x] 3.6 Nápověda (`/ikaros/napoveda`) ✅ (2026-05-12, vytaženo dopředu)
+ - [x] Statická stránka — 5 tabů (Začni tady / Stránky / Účet & profil / Role & oprávnění / FAQ)
+ - [x] Spec: `docs/arch/phase-3/spec-3.6.md`, Plán: `docs/arch/phase-3/plan-3.6.md`
```

```diff
# docs/dluhy.md (sekce ## Otevřené)
+ ### D-NEW — HelpPage content drift
+ **Kontext:** Stránka `/ikaros/napoveda` dokumentuje aktuální stav. Při fázích 1.5/1.7/1.8/2.x/3.x je nutné obsah aktualizovat (sekce Stránky + FAQ).
+ **Řešení:** Do PR checklistu fází přidat „aktualizovat HelpPage tab Stránky/FAQ".
```

### Krok 13 — Verifikace

```bash
npm run lint
npm run lint:colors
npm run test:run -- HelpPage
npm run build
```

Smoke v prohlížeči:
- `/ikaros/napoveda` anon: 5 tabů, žádný redirect.
- Login → stejná stránka, identický obsah.
- Switch tabů → URL `?sekce=...`.
- Refresh na `?sekce=role` → tab Role rovnou aktivní.
- DevTools 360 px: tabs scrollují, tabulky scrollují horizontálně.
- Theme switcher → projít 5 reprezentativních motivů (modré-nebe, kyberpunk, nemrtvi, pergamen, bila) — žádný layout break.

### Krok 14 — `mobil-desktop` skill

Podle CLAUDE.md po UI úpravě **vždy**. Spuštěno na hotovém HelpPage.

### Krok 15 — Commit + PR

```bash
git checkout -b feat/krok-3.6-napoveda
git add src/features/ikaros/pages/HelpPage docs/arch/phase-3 docs/roadmap-fe.md docs/dluhy.md
git rm src/features/ikaros/pages/HelpPage.tsx
git commit -m "feat(napoveda): krok 3.6 — statická nápověda 5 tabů (vytaženo dopředu)"
```

PR popis: shrnout spec/plán, screenshot 2 motivů (modré-nebe + kyberpunk), seznam tabů.

---

## 3. Acceptance kritéria (z spec §6, zde k odškrtnutí při review)

1. [ ] 5 tabů, default „Začni tady", URL `?sekce=...` (1×3 nahoře, žádný `sekce` při start).
2. [ ] Sekce „Stránky" obsahuje všech 23 položek audit tabulky se správným ✅/🚧.
3. [ ] Sekce „Role & oprávnění" obsahuje obě tabulky + akční matici.
4. [ ] Anon access funguje (žádný redirect).
5. [ ] `lint:colors` projde (žádné hardcoded barvy).
6. [ ] Responsive 360 px — tabs i tabulky scrollují, nic se neoříznul.
7. [ ] 21 motivů × smoke: žádný layout break (validováno přes Theme Storybook gallery).
8. [ ] `lint`, `test:run`, `build` ✅.
9. [ ] 7+ test cases v `HelpPage.spec.tsx`.
10. [ ] Roadmap + dluhy update commitnuté ve stejném PR.

---

## 4. Otevřené poznámky

- **Žádný BE** — všechno čistě FE / statický obsah.
- **Žádné nové npm závislosti.**
- **Žádné theme overrides** v `src/themes/themes/*` — vše čistě přes existující tokeny.
- **Index re-export** v `HelpPage/index.ts` zaručí, že `router.tsx` se neměnit nemusí — ověříme to TS buildem.

---

**Po schválení tohoto plánu kódujeme.**
