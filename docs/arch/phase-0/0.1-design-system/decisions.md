# Technická rozhodnutí

## CSS Modules místo CSS-in-JS

**Rozhodnutí:** Každá komponenta má vlastní `.module.css` soubor.

**Důvod:** Žádná runtime overhead, přirozený pro Vite, jednoduché pro AI agenty číst a generovat.

**Alternativy:** Tailwind (odmítnuto — příliš verbose v JSX), styled-components (odmítnuto — runtime cost).

**Dopad:** Všechny komponenty v projektu používají CSS Modules. Neměnit bez diskuze.

---

## `data-theme` atribut pro theming

**Rozhodnutí:** Téma se přepíná atributem `data-theme` na root elementu nebo layout wrapperu.

**Důvod:** Čisté CSS řešení bez JS overhead, snadné per-svět theming.

**Alternativy:** CSS třídy (odmítnuto — méně sémantické), context/JS theming (odmítnuto — zbytečná komplexita).

**Dopad:** Světy definují CSS proměnné pro `[data-theme="<worldId>"]`.

---

## Barrel export z `ui/index.ts`

**Rozhodnutí:** Všechny UI komponenty exportovány přes `src/components/ui/index.ts`.

**Důvod:** Čistší importy v kódu (`import { Button, Spinner } from '../ui'`).

**Dopad:** Každá nová UI komponenta musí být přidána do `index.ts`.
