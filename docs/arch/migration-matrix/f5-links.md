# F5 — Oprava interních odkazů v obsahu (runtime rewrite)

> Dílčí spec migrace Matrix→Ikaros. Index: [`index.md`](./index.md), stav: [`HANDOFF.md`](./HANDOFF.md).
> Stav: **NÁVRH — čeká na schválení.**

## Problém
Starý Matrix byl jednosvětový → odkazy v obsahu stránek jsou uložené jako holý slug (`<a href="svedsko">`) nebo root-relativní (`/svedsko`). Ikaros je víc-světový, stránka žije pod `/svet/:worldSlug/:slug`. Browser proto interní odkaz otevře jako root `/svedsko` → **404**. Navíc render dává všem odkazům `target="_blank"` ([extensions.ts:51-57](../../../src/shared/ui/RichTextEditor/extensions.ts#L51)) → otevírá novou kartu, takže ani SPA routing klik nezachytí.

Týká se ~2300 migrovaných stránek, ale řešení je obecné (každý svět, i budoucí obsah).

## Současný stav
[`useBrokenLinks.ts`](../../../src/features/world/pages/PageViewer/hooks/useBrokenLinks.ts) (7.1d) už po renderu projde `<a href>` v obsahu, rozpozná **3 tvary** interních odkazů (`/svet/<slug>/<slug>`, `/<slug>`, `<slug>`), přeskočí externí (`http(s):`/`mailto:`/`tel:`/`#`), vícesegmentové cesty a `WORLD_RESERVED` routy. Neexistující slug → `.brokenLink` class + `preventDefault` na klik.

**Co chybí:** pro **validní** interní odkaz hook nic nedělá → zůstává holý `href` + `target="_blank"` → 404.

Volá se 2×, obě volání zůstávají beze změny: [PageViewer.tsx:89](../../../src/features/world/pages/PageViewer/PageViewer.tsx#L89) (obsah), [PageSidebar.tsx:86](../../../src/features/world/pages/PageViewer/components/PageSidebar.tsx#L86) (datová tabulka).

## Cílové chování
Hook rozdělí odkazy do 3 kategorií:

| Kategorie | Detekce | Akce |
|---|---|---|
| **Externí** | `http(s):`, `mailto:`, `tel:`, `#`, vícesegmentové, `WORLD_RESERVED` | beze změny (zůstává `target="_blank"`) |
| **Interní validní** | slug existuje v directory | přepiš `href` → `/svet/${worldSlug}/${target}`, odeber `target="_blank"` + `rel`, klik → SPA `navigate()` |
| **Interní rozbitý** | slug NEexistuje | `.brokenLink` + `preventDefault` (beze změny, jak dnes) |

## Rozhodnutí
- **Runtime, ne data** (cesta A vs. zavrhnutá B = přepis HTML). Slug je world-relativní identifikátor; do kterého světa patří ví viewer z URL. Zadrátovat `/svet/matrix/` do obsahu by rozbilo přenositelnost stránek mezi světy (pravidla to vyžadují) a přejmenování světa. → **obsah se nemění.**
- **`extensions.ts` BEZE ZMĚNY.** `target="_blank"` se ponechá globálně (externí odkazy ho legitimně chtějí); hook ho přepíše jen u interních validních. Jediný měněný soubor = hook.
- **Hash/query se zachová** při přepisu href (kotvy na nadpisy fungují dál).
- **Idempotence:** opakovaný běh (hook má `revision` deps) z `/svet/matrix/svedsko` znovu vytěží `svedsko` (tvar 1) a přepíše na totéž. Click-handler navázaný jednou přes dataset flag (vzor stávajícího `brokenBound`).
- **Editor beze změny:** wikilink extension dál vkládá holý slug (`href: item.slug`) — runtime hook ho při zobrazení sjednotí.

## Dotčené soubory
- **`useBrokenLinks.ts`** — jediná produkční změna (přidat `useNavigate`, větev „interní validní").
- Test broken-link detekce — rozšířit o nové chování (přepis href, navigace, idempotence, externí nedotčen).

## Mimo rozsah
- Přepis dat / migrační workflow (zavrhnuto).
- Změna `extensions.ts` / editoru / wikilink dropdownu.
- Vizuální změny (žádná UI úprava → `mobil-desktop` se neaplikuje; chování klikání je shodné na touch i myši).
- Auto-vytváření chybějících cílových stránek (broken zůstává broken — to je samostatná feature).

## Test plán
- externí odkaz (`https://…`) → href i `target="_blank"` nedotčené
- holý slug existující → href = `/svet/<w>/<slug>`, bez `target`, klik volá `navigate`
- `/slug` existující → totéž
- `/svet/<w>/<slug>` existující → idempotentní (beze změny chování)
- slug neexistující → `.brokenLink` + klik blokován (regrese stávajícího)
- slug s `#kotva` → hash zachován v přepsaném href

---

## Krok 1b — broken odkazy (data oprava, samostatný workflow)

Audit obsahu (`C:\tmp\f5-audit.js`): **14 745 odkazů, 531 broken (3,7 %)**. Rozpad:
- **~261 pravidla/magické školy** (SKIP rulebook) → patří do Pravidlové knihy, neřešit zde.
- **~76 postava-mismatch** → starý slug `jmeno-prijmeni` ≠ reálný slug postavy (často přezdívka: `abigail-wattson`→`abi`, `gabriel-patrik-dodwell`→`medak`, `archibald-of-lindsay`→`archie`). **Opraveno workflow.**
- **2 „smazané"** (`myra-rosier`→`myra`, `lotri-spielmann`→`lo3`) — postavy žijí pod přezdívkou, jen duplicitní karta smazána → přemapovat.
- **~157 long-tail** (skloňování, překlepy, nevzniklé) → ponechat broken (červené = „doplň stránku").

**Mapa** (`C:\tmp\f5-links-gen.js` → ověří new existuje + old je broken): 14 mapování / 76 odkazů, `migration/f5-links.json.gz`.
**Workflow** `fix-matrix-links.yml` + `migration/f5-fix.js` (BE): regex `(href="/?)<old>"` → `$1<new>"`, zachová `/` prefix, kratší slug netknut (uzavírací uvozovka). ⚠️ Mismatch odkazy jsou na **3 místech** — workflow opravuje všechna: `Page.content` (74), `Page.table` headers+values (~33, datové tabulky v sidebaru), `Page.akjTabs[].contentOverride.content` (~41, F4d záložky). Per-pole záloha (`_migF5Before`/`_migF5TableBefore`/`_migF5AkjBefore`) jen jednou → idempotentní i napříč běhy. Flag `_migF5Links`, rollback vrací vše. Mock: fix+idempotence+rollback OK.

> ⚠️ **Dvě pasti, na které se přišlo až za běhu:**
> 1. Živý `content` je **HTML** (po opravě #2), NE TipTap JSON jako lokální `.json` mocky → regex cílí atribut `href="..."`, ne `"href":"..."`. (První dry-run vrátil 0.)
> 2. Odkazy nejsou jen v `content` — i v `table` a `akjTabs`. První běh (jen content) je minul. Vždy auditovat VŠECHNA pole nesoucí HTML.
**Vynecháno** (zůstává broken): `eva` (2 Evy — ambiguita), `juan-romano-jr` (junior≠senior), `magie-tela`/`polsko-litevske-uzemi` (jiné entity).

> 💡 Slug-mismatch se generuje ze `slugify(jméno postavy)` == broken slug → jistota, že je to táž postava (ne náhodná prefix-shoda jako `magie-tela`→`magie`).

## Stav
- ✅ Krok 1a (runtime rewrite hook) — implementováno, tsc 0, 8/8 testů, build OK.
- 🔜 Krok 1b (broken-fix workflow) — připraveno, čeká dry-run → fix.
- 🔜 Krok 2 (auto-link vlastních jmen) — po kroku 1; audit varuje před obecnými slovy (`Nebo` = spojka 1468×).
