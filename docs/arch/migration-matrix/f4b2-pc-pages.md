# F4b-2 — PC veřejné stránky (dílčí spec)

> **Stav:** SCHVÁLENO (2026-06-07), připraveno k importu. Navazuje na [`index.md`](./index.md) F4b-2 a [`HANDOFF.md`](./HANDOFF.md).
> Cíl: každý hráč má v Ikaru jednu veřejnou Page postavy napojenou na svou kartu (F3).

## 1. Klíčové zjištění (proč ne „17 řádků")

CSV má 17 řádků podtypu `Postava`, ale reálný cíl je **20 PC hráčů**. Dvě příčiny:

### A) 24 char záznamů (F3) = jen 20 hráčů — 4 přezdívky
Stará postava měla **2 hub stránky** (jméno + přezdívka) → F3 z každé udělalo samostatnou Character. Jde o **tutéž postavu**, ne duplikát náhodou:

| 1 hráč (userId …) | kanonická karta | přezdívka (dup. karta) |
|---|---|---|
| …e5c2 | `katerina-penkavova` | `katerina` |
| …e5c0 | `li-mingguo` | `mingguo` |
| …e5b0 | `pumi-stin` | `kraven` |
| …e5b1 | `skarn-rudvik` | `severan` |

→ 4 duplicitní karty řeší **F4-cleanup** (smazat, `_mig:f3`).

### B) 3 hráči bez řádku `Postava` — veřejná stránka zařazena jinam
| Hráč | veřejná stránka | CSV říká | kam (ne)šla |
|---|---|---|---|
| Lotri Spielmann (`lo3`) | `lotri-spielmann` | NPC/Ostatní | F4b jako **NPC** + dovytvořená NPC karta `lotri-spielmann` ❌ |
| Myra Rosier (`myra`) | `myra-rosier` | Ostatní/Ostatní | F4a jako **Ostatní** (bez napojení) |
| Shiro Yamada (`yamada-shiro`) | `shiro-yamada` | PC/Ostatní | **nikam** (propadlo sítem) |

→ F4b-2 je bere jako prezentační zdroj; mis-importy `lotri-spielmann`/`myra-rosier` uklidí F4-cleanup.

## 2. Model (potvrzeno uživatelem)

V Ikaru **1 postava = 1 Page** (`Page.slug === Character.slug`, sjednocení 9.1). Veřejnost/tajnost se řeší **obsahem a záložkami**, ne slugem:

| část Page `<char-slug>` | zdroj (starý Matrix) | kdo vidí |
|---|---|---|
| **veřejný obsah** (`content`) | stará **Postava** stránka (`jesse-helsing`…) | všichni hráči |
| **záložka „Tajné"** (`akjTabs`) | stará **char-slug/Tajné** stránka (`helsing`…) | vlastník + PJ → **F4d** |
| další AKJ záložky | `akj-N-*` | dle clearance → **F4d** |

⚠️ **F4b-2 dělá jen veřejnou Page.** Tajné/AKJ/Kontakty záložky = samostatný krok F4d (tam i oprava propadlých částí — viz §5).

## 3. Párovací strategie (oprava vůči naivnímu F4c)

Naivní párování přes `vlastnik_cil`→jméno přes **všechny** chary chytalo NPC dvojníky (Měďák „Patrik Dodwell" → NPC `patrik-dodwell` místo PC `medak`). F4b-2 páruje **jen na 20 kanonických PC**, klíče v pořadí (první shoda):

1. `vlastnik_cil` → PC jméno (+ reverse-rename: „Zara Hawke" → `zara`/„Zara Villiam")
2. **titul stránky** → PC jméno (opraví Měďáka, Archibalda, Da Shi)
3. slug stránky == PC char slug

## 4. Cílový tvar Page (ověřeno proti `page.schema.ts`)

```js
{
  slug: <kanonický char slug>,        // = nová Page slug
  worldId: 'matrix',
  type: 'Postava hráče',              // PAGE_TYPES.PostavaHrace
  title: <char.name>,                 // jméno z F3 (rename už aplikován: Zara Villiam)
  content: <Postava-page paragraphs>, // TipTap string, VEŘEJNÝ obsah
  plainText, imageUrl, bigImage,      // imageUrl = GDrive ID → F12 marker customData._migImage
  table?, sections:[], galleryImages:[], videos:[], menu:[],
  isWoodWide:false, accessRequirements:[], order:0,
  ownerUserId: <char.userId>,         // Ikaros ID
  // characterRef doplní workflow za běhu: db.characters.findOne({worldId,slug:characterSlug})
}
```

- **characterRef** se NEukládá do JSON — workflow ho dohledá přes `characterSlug` za běhu (správné `_id` z DB, idempotentní).
- `accessRequirements:[]` — stránka je veřejná; tajnost jde do `akjTabs` (F4d).

## 5. Propadlé části (audit) — pro F4d, ne F4b-2

10 částí PC hráčů je v CSV mimo kategorii PC → propadnou, pokud se neopraví ve F4d:
`poznamky-mingguo` (Ostatní→PC/Poznámky), `akj-2-li-mingguo` (AKJ Ostatní→PC/AKJ), `kontakty-archie`/`poznamky-archie` (Ostatní→PC), `akj-8-zara-hawke`, + AKJ „cíl nenalezen" u helsing/medak/sion/archie/lo3. F4d je dohledá přes jméno cíle.

## 6. Odložené

- **Archie** = volná postava (starý deník patřil účtu „Test" `682f…bcf5`). Necháváme `ownerUserId` z F3; přiřazení hráče později.
- **Abi, Zara** mají 2 Tajné stránky — F4d zpracuje obě jako 2 záložky.

## 7. Mechanika importu

Workflow `import-matrix-pc-pages.yml` (BE repo), vzor `import-matrix-npc.yml`:
- 3 režimy (dry-run/import/rollback), data `migration/f4b2-pc-pages.json.gz`.
- Idempotent: existující slug Page přeskočí. Tag `_mig:'f4b2'`. Rollback: `db.pages.deleteMany({worldId:'matrix',_mig:'f4b2'})`.
- **Pořadí:** F4-cleanup → F4b-2. (Pozn.: kolize Page-slug nehrozí — duplicitní jsou *karty*, ne stránky; cleanup je kvůli čistotě, ne blokující.)
