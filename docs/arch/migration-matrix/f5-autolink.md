# F5 krok 2 — Auto-link zmínek (runtime)

> Dílčí spec migrace. Navazuje na [`f5-links.md`](./f5-links.md) (krok 1). Stav: **NÁVRH**.

## Problém
Migrovaný obsah zmiňuje názvy existujících stránek (státy, postavy, události, organizace) v **prostém textu**, ale nejsou z nich odkazy — autoři je v původním Matrixu ručně nezalinkovali. Cíl: automaticky z těchto zmínek udělat odkazy na jejich stránky.

## Rozhodnutí (odsouhlaseno)
- **Runtime hook**, ne data-workflow. Důvod: data-workflow by vkládal `<a>` do HTML regexem (riziko rozbití obsahu — vložení uvnitř tagu/odkazu); runtime pracuje s **DOM text nodes** (text a odkazy oddělené automaticky), navíc zalinkuje i **budoucí** obsah a nemění data.
- **Jen vlastní jména** (filtr proti šumu — `Nebo`=spojka 1468× bez filtru). **Bez skloňování** (v1 jen 1. pád). **Matrix** + obecná slova na blacklistu.
- Cílí jen **existující** stránky.

## Filtr entit
Kandidát = stránka, jejíž `type ∈ {Lokace, Ostatní, Postava hráče, NPC}` (Události/Skupiny jsou na FE „Ostatní"; Seznam/Noviny/Galerie/Rodokmen/Obrazovka vynechány) A jejíž `title`:
- **víceslovný** (≥2 slova) → vždy (specifický, „První magická válka", „New York"), nebo
- **jednoslovný** → délka ≥5 znaků A není v `BLACKLIST` (obecná CZ slova + `matrix`).

Audit (s filtrem): **707 odkazů, 522 stránek**, čistá vlastní jména (Británie, Indie, New York, Havran, Asgard…). Bez filtru 4971 (šum).

## Chování hooku `useAutoLink`
- Běží **jen na hlavním obsahu** (PageViewer content), NE na tabulkách/sidebaru (strukturovaná data, ne próza).
- Projde **DOM text nodes** mimo existující `<a>` (TreeWalker). Pro každou zmínku entity (přesný tvar, **case-sensitive**, celé slovo přes `\p{L}\p{N}` hranice):
  - **jen 1. výskyt** dané entity na stránce (wiki konvence),
  - **ne self** (stránka neodkazuje sama na sebe),
  - obalí text do `<a href="/svet/<worldSlug>/<slug>" data-autolink="1">`.
- Delší názvy se matchují dřív (`New York` před `York`) — kandidáti seřazeni délkou desc.
- Nav chování (SPA navigace) dodá existující [`useBrokenLinks`](../../../src/features/world/pages/PageViewer/hooks/useBrokenLinks.ts) — auto-link `<a>` je už world-scoped, takže ho hook vezme jako validní a přidá click→`navigate`. Žádná duplicita handleru.
- **MutationObserver + `pageshow`** (stejně jako 1a) — async render obsahu / Back přes bfcache.
- **Idempotentní:** text uvnitř `<a>` (i auto-link) se přeskakuje → opakovaný běh nic nepřidá, žádná smyčka mezi observery (vložení `<a>` = childList, world-scope = jen atributy).

## Dotčené soubory
- **`useAutoLink.ts`** (nový hook) + napojení v `PageViewer.tsx` (vedle `useBrokenLinks`, stejný containerRef + `page.slug` jako self).
- Test hooku.

## Mimo rozsah
- Skloňování (v2), tabulky/sidebar, auto-vytváření chybějících stránek, obecné koncepty mimo filtr (whitelist by chtěl ruční kurátorství).
