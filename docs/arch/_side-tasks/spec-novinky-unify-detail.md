# Spec — Sjednocení novinek + detail-okno

**Typ:** side-task (oprava z testerské zpětné vazby)
**Vznik:** 2026-06-22
**Stav:** návrh ke schválení
**Repo:** FE only (žádná BE změna)

## Problém (co řekli testeři)

1. **Globální novinky** (`/ikaros`, `/ikaros/novinky`) vypadají chudě: sbalená karta = jen titulek + štítek + datum. Chybí jim obrázek, úryvek a vizuální parita se světovými.
2. **Světové novinky** (`/svet/:slug`, `/svet/:slug/novinky`) ukazují jen 3řádkový úryvek (`…`) a **plný text se nedá zobrazit nikde** — žádný detail view neexistuje.
3. Kdyby se plný text rozbalil přímo v kartě (jako dnes u globálních), karta roste do výšky a je „divná a vysoká".

## Cíl

- Globální i světové novinky mají **stejnou preview-kartu**: obrázek (16:9) / fallback ikona, štítek důležitosti, datum, titulek, krátký úryvek.
- Klik na kartu (kdekoli mimo admin akce) otevře **vystředěné detail-okno (modal)** s plným textem, obrázkem a křížkem na zavření.
- Karty zůstanou nízké a uniformní; plný text žije v překryvu, ne v rostoucí kartě.

## Návrh řešení

### A. Sdílená prezentační vrstva + per-doménové adaptéry

Dnes jsou dvě nezávislé kopie ([`NewsCard`](../../../src/features/ikaros/components/NewsCard/NewsCard.tsx) pro globální, [`WorldNewsCard`](../../../src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsCard.tsx) pro svět). Sjednotíme je:

- **Nové sdílené komponenty** v `src/shared/ui/news/`:
  - `NewsPreviewCard` — prezentační preview-karta (média 16:9, štítek, datum-chip, titulek, úryvek, volitelný `adminSlot`/kebab). Klik → `onOpen()`.
  - `NewsDetailModal` — postavené nad sdíleným `Modal` (`size="lg"`): velký obrázek, štítek + plné datum, titulek, **plný obsah** přes `RichTextEditor readOnly`, doménový „footer" (autor / odkaz), křížek (× už je v `Modal`).
  - `newsVm.ts` — view-model `NewsCardVM` (sjednocený tvar dat).
- **Adaptéry** zůstávají v doménách (kvůli hookům a doménovým rozdílům):
  - globální: čistá funkce `IkarosNews → NewsCardVM`.
  - svět: tenká komponenta-wrapper, která uvnitř volá `usePagesDirectory` + `useCalendarConfigs` (resolve odkazu a fantasy data), složí `NewsCardVM` a vyrenderuje sdílenou kartu/modal.

💡 Proč adaptér jako komponenta u světa: resolve odkazu/kalendáře běží přes hooky → musí být na top-levelu komponenty (rules-of-hooks), ne uvnitř `.map()`.

### B. `NewsCardVM` (sjednocený tvar)

```ts
interface NewsCardVM {
  id: string;
  title: string;
  contentHtml: string;        // plný obsah (modal) i zdroj pro úryvek (karta)
  tone: 'info' | 'warning' | 'system';  // řídí barvu + ikonu štítku/fallbacku
  typeLabel: string;          // doménový text štítku ("Upozornění" / "Důležité" / …)
  image?: {
    url: string;
    focalX?: number | null; focalY?: number | null;
    zoom?: number | null; fit?: 'cover' | 'contain' | null;
  } | null;
  dateChipLabel: string;      // krátké datum na kartě (relativní / fantasy)
  dateChipTitle?: string;     // tooltip (absolutní)
  fullDateLabel: string;      // plné datum v modalu
  footer?: ReactNode;         // autor (globální) / odkaz (svět) — render jen v modalu
  archived?: boolean;
}
```

### C. Štítek důležitosti (tone)

- Vizuál (barva + ikona) řídí `tone`: `info` / `warning` / `system`.
- Mapování typů: globální `warning → warning`, světové `alert → warning`; `info`/`system` 1:1.
- **Text štítku zůstává doménový** — globální „Upozornění", světové „Důležité" (neslučujeme sémantiku, jen vzhled).
- Realizace: štítek se přesune/zobecní do sdílené komponenty beroucí `{ tone, label }`. Stávající [`TypeChip`](../../../src/features/world/components/TypeChip/TypeChip.tsx) (keyed na `WorldNewsType`) se na ni převede (re-export / tenký wrapper), aby ostatní volání nepadla.

### D. Chování karty a klik

- Celá karta je klikatelná (button-like, `role` + klávesy Enter/Space) → otevře detail-modal pro danou novinku.
- **Admin akce** (kebab u světa, inline tlačítka u globální `NovinkyPage`) zůstávají na kartě a **musí `stopPropagation`**, aby klik na ně neotevřel modal.
- **Odkaz** (interní stránka / externí URL u světa) se přesune **do modalu** → karta je čistý preview, žádná kolize klik-cílů.

### E. Detail-modal obsah

- `Modal size="lg"`, title = titulek novinky (× a Escape řeší `Modal`).
- Tělo: velký obrázek (svět respektuje focal/zoom/fit; globální plain), štítek + plné datum, plný `RichTextEditor readOnly`, footer (globální: `— autor · absolutní datum`; svět: odkaz na stránku / externí + případně „archivováno").

### F. Co se NEmění (mimo rozsah)

- Žádná BE změna, žádné nové datové pole.
- Tvorba/editace beze změny: [`NewsFormModal`](../../../src/features/ikaros/components/NewsFormModal.tsx), [`WorldNewsEditorModal`](../../../src/features/world/pages/WorldDashboardPage/WorldDashboard/components/WorldNewsEditorModal.tsx).
- Admin akce, role-gating, archivace, stránkování, scope taby — beze změny.
- Mrtvé pole `defaultExpanded` na globální `NewsCard` se **ruší** (nikde se nepředává).

## Dotčená místa

| Co | Soubor |
|---|---|
| nové sdílené | `src/shared/ui/news/NewsPreviewCard.tsx`, `NewsDetailModal.tsx`, `newsVm.ts` |
| globální wrapper | `src/features/ikaros/components/NewsCard/NewsCard.tsx` (přepsat na adaptér) |
| světový wrapper | `…/WorldDashboard/components/WorldNewsCard.tsx` (přepsat na adaptér) |
| štítek | `src/features/world/components/TypeChip/TypeChip.tsx` (zobecnit/re-export) |
| call-sites (beze změny props nebo minimálně) | `PlatformNewsSection`, `NovinkyPage`, `NewsColumn`, `WorldNewsPage` |

## Responsivita & a11y

- Karta 16:9 + modal `lg` musí fungovat na mobilu (≤768px: modal blízko fullwidth, scroll) i desktopu — ověřit `mobil-desktop` po implementaci.
- Karta: klikatelná s klávesovou obsluhou (Enter/Space), `aria-label`. Modal už má focus-trap, scroll-lock, návrat focusu.

## Otevřené otázky

1. **Umístění sdílených komponent**: `src/shared/ui/news/` (navrženo) vs. nechat v jedné z featur. → navrhuji `shared/ui/news`.
2. **Datum-chip na kartě**: ponechat dnešní relativní formát (globální `formatRelativePast`, svět `relativeEventDate`/fantasy)? → ano, beze změny logiky, jen sjednotit do VM.
