# F-Pravidla B — import odloženého subsystému (programy / staty / lore)

> Dílčí spec migrace Matrix→Ikaros. Navazuje na `PRESKOCENE-STRANKY.md`, `PROPADLE-ODKAZY.md`, [`f5-links.md`](./f5-links.md). Stav: **NÁVRH — čeká na souhlas.**

## Účel
„Pravidla B" = 182 stránek záměrně odložených při F4 (0 živých), na které míří stovky propadlých odkazů. Uživatel je ručně roztřídil v Excelu (`Downloads/PRAVIDLA-B-WORKSHEET.csv`, sloupec `tve_rozhodnuti`). Tahle fáze je naimportuje dle jeho rozhodnutí → propadlé odkazy se rozsvítí.

## Rozhodnutí uživatele (182 řádků)
| Rozhodnutí | Počet | Akce |
|---|---:|---|
| **stránka** | 111 | world Page (vzor F4a), slug = starý slug |
| **AKJ** | 51 | PJ-only `akjTab` na rodičovské stránce programu (vzor F4d) |
| **rulebook** | 20 | NEimportovat jako novou stránku — viz „Rulebook" níže |

## ⚠️ Klíčový princip: UPSERT podle slugu (ne blind create)
Lokální f4a snapshot je **zastaralý** — mezitím vznikly seedované stránky (`jazykove-rodiny` už žije jako placeholder „Předpřipravený přehled"). Blind insert by dělal duplicity / kolidoval na `{worldId,slug}` unique. **Proto cílíme podle reálného stavu DB** (lekce F12):

Pro každý řádek `db.pages.findOne({worldId, slug})`:
- **neexistuje** → vytvoř (insert).
- **existuje + placeholder** (krátký/seed obsah) → **vyplň** obsahem z dumpu.
- **existuje + reálný obsah** → **přeskoč + nahlas** (konflikt k ruční revizi, nepřepisovat naslepo).

`worldId` = ObjectId `6d6174726978000000000001` (NE slug — kritická past migrace).

## Mapování dat
- **Obsah:** staré `paragraphs` (TipTap JSON) → HTML přes `migration/tiptap2html-mongo.js` (vzor fix-content-html). `Page.content` = HTML.
- **Typ:** `stránka` → `Ostatní` (rozcestníky `*-programy` → `Seznam`). `title` ze starého.
- **Obrázek:** `imageUrl` ze starého (po F12 mapě, pokud GDrive ID → Cloudinary; jinak ponechat/prázdné).
- **AKJ staty:** `staty-<X>` → `akjTab` na stránce `<X>`:
  - 50/51 rodičů je v importu (`stránka`). Výjimka: `staty-vampiri` → rodič **`vampir`** (titul „Vampíři" ≠ stránka „Vampír").
  - `tab = {id:'mig-'+slug, name:'Staty', order, access:[{type:'Role',value:'PJ'}], ownerHidden:false, contentOverride:{content:HTML, imageUrl, table}}` (staré `accessRequirements {type:2,'PJ'}` = PJ-only → Role PJ).
  - Dedup: `staty-espada` je v datech 2×.

## Rulebook (19) — VŽDY skip (nikdy nevyplňovat)
NEvytváříme ani neplníme rulebook obsah. Workflow rulebook řádek **vždy přeskočí** (jen nahlásí, které neexistují = čekají na seed).
- **magie** (16): jsou to **reálné rulebook stránky** (ověřeno živě — `antimagie`, `ohniva-magie`, `zvireci-magie`, `nekromancie`…). Obsah žije v `customData`/LevelSpine, ne v `content` → placeholder-heuristika by je dle krátkého `content` omylem přepsala starým dumpem. **NESAHAT.** Link se rozsvítí, protože stránka existuje (stejný slug).
- **programovani-akj**: existuje „Programování" v pravidlech → odkaz se napojí, neimportovat.
- **svobodny-matrix**: rulebook → skip.

⚠️ **`jazykove-rodiny` přeřazeno na `stranka`** (ne rulebook) — je to běžná seedovaná reference (typ Ostatní, ne rulebook), uživatel chce vyplnit její placeholder. `jazykova-politika` zůstává rulebook (už má reálný obsah → skip).

## Workflow (BE repo, vzor F4a/F12)
`migration/f-pravidla-b.js` + `.github/workflows/import-matrix-pravidla-b.yml`, data `migration/f-pravidla-b-data.json.gz` (generováno lokálně z dumpu + Excel rozhodnutí).
- **Režimy:** `dry-run` (default — pro KAŽDÝ řádek: existuje? obsah? → create/fill/skip/konflikt + souhrn), `import` (confirm `IMPORT`), `rollback` (confirm `ROLLBACK`).
- **Idempotence + tag** `_mig:'fpravidlab'`; záloha přepsaného obsahu (`_migPravBBefore`) jen jednou. Rollback vrací.
- **Dry-run = ground truth:** nahradí separátní dump. Uživatel pustí dry-run → vidí reálný stav → pak ostře.

## Mimo rozsah
- Rulebook struktura / seedování magie + jazyků (samostatný rulebook task).
- Menu světa (buildWorldNav hardcoded) — stránky dostupné přes odkazy/hledání i bez menu (řeší se zvlášť, pokud vůbec).
- Přepis reálného (ne-placeholder) obsahu — workflow nahlásí konflikt, neřeší automaticky.

## Otevřené
- Heuristika „placeholder vs reálný obsah" pro fill (práh délky / seed marker) — doladit dle dry-run vzorku.
- GM master AKJ (gm01…) a číselné cíle — mimo tuhle fázi (viz `PROPADLE-ODKAZY.md`).
