# Diary System Presets (8.7)

Per-systémové presety pro deník postavy. Aktivní preset se vybírá podle
`world.system` (pole na entitě světa). Pokud systém v registry chybí,
fallback je `generic` preset (renderuje se přes `DiaryBlockView` z
PJ-definovaného schématu 8.5).

## Architektura

```
diary-systems/
├── types.ts                 — DiarySystemPreset, SystemId, SystemSheetProps
├── registry.ts              — Record<SystemId, DiarySystemPreset>
├── DiarySystemProvider.tsx  — context + data-attr wrapper + dynamic CSS load
├── _shared/                 — komponenty sdílené napříč systémy (např. Fate ⇆ PI)
├── presets/                 — metadata per systém (id, name, loadStyles, SystemSheet?)
├── styles/                  — CSS soubory scoped na [data-diary-system="<id>"]
└── sheets/                  — dedikované React sheets per systém
```

### Skin (data-theme) vs system (data-diary-system)

| Atribut | Scope | Zdroj | Příklad |
|---|---|---|---|
| `data-theme` | celá aplikace | uživatel vybírá v Administraci | `modre-nebe`, `ikaros` |
| `data-diary-system` | jen deník postavy | `world.system` (per svět) | `coc`, `dnd5e`, `shadowrun` |

Skiny zůstávají platformový vizuál (uživatelská volba), system preset
mění JEN vzhled a strukturu deníku v daném světě. Žádný preset nesahá
do sdílených stylů ani jiných skinů.

## Jak přidat nový systém

1. Doplň ID do `SYSTEM_IDS` v `types.ts`.
2. Vytvoř `presets/<id>.ts`:

```ts
import type { DiarySystemPreset } from '../types';
import { MyCustomSheet } from '../sheets/<id>/MySheet';

export const myPreset: DiarySystemPreset = {
  id: '<id>',
  name: 'Lidský název',
  description: 'Krátký popis pro tooltip.',
  SystemSheet: MyCustomSheet,
  loadStyles: () => import('../styles/<id>.css'),
};
```

3. Vytvoř `styles/<id>.css` — všechna pravidla prefixuj
   `[data-diary-system="<id>"]`. Žádné globální selektory.
4. Vytvoř `sheets/<id>/MySheet.tsx` — implementuje `SystemSheetProps`.
5. Zaregistruj v `registry.ts`:

```ts
import { myPreset } from './presets/<id>';

const REGISTRY = {
  generic: genericPreset,
  '<id>': myPreset,
};
```

6. Manuálně otestuj: vytvoř svět s `system: '<id>'`, otevři postavu,
   ověř že se aplikuje vizuál a sheet renderuje.

## Pravidla

- **Žádné dluhy.** Pokud nemůžeš dokončit přenos kompletně, neukládej
  TODO; raději rozdělit na menší samostatné iterace.
- **Bez sahání do shared CSS.** Veškeré nové styly jen v `styles/<id>.css`.
- **CustomData prefix per systém** — 1:1 přenos z legacy projektu
  (`coc_*`, `dnd_*`, `drd2_*`, ...). Náš `CharacterDiary.customData:
  Record<string, unknown>` to akceptuje bez schema-level změn.
- **Editor 8.5 vs dedikovaný sheet.** Pokud systém má dedikovaný sheet,
  editor schématu (8.5) se v Edit módu skryje a místo něj se zobrazí
  info, že šablonu určuje herní systém.
