# F4d — AKJ záložky (dílčí spec)

> **Stav:** NÁVRH k souhlasu (2026-06-07). Navazuje na [`index.md`](./index.md) F4d, [`f4b2-pc-pages.md`](./f4b2-pc-pages.md).
> Cíl: přenést tajný obsah (Tajné/AKJ/Kontakty) jako **AKJ chráněné záložky** (`akjTabs`) na cílové stránky.

## 1. Rozsah (reconcile 2026-06-07) — **925 záznamů**

| typ záznamu | počet | → |
|---|---|---|
| **napojený** akjTab (Tajné/Kontakty/AKJ na existující stránku) | 687 | `$push akjTab` |
| **stub** (AKJ bez cíle → nová stub Page + záložka) | 45 | upsert Page + tab |
| **leak-convert** (viz §11) | 193 | stub + tab + záloha |
| **celkem** | **925** | |

Zdroj akjTab (566 CSV řádků): AKJ-sub 361, AKJ-kat 171, PC Tajné 20, PC Kontakty 14. Napárováno 687 (73 z toho **1:N**), 45 bez cíle → stub.
**Clearance N:** 1–15 (těžiště 4/6/8). **Staré práva:** type1 AKJ, type0 UserId, type2 Role.

## 2. Cílový tvar `akjTab` (ověřeno proti `page.interface.ts` / `pages.repository.ts`)

```js
{
  id: <uuid>,
  name: <název záložky>,          // „Tajné" | „Kontakty" | „AKJ <N>" | titul stránky
  order: <pořadí>,
  access: AccessRequirement[],    // OR logika; viz §4
  ownerHidden: false,             // PC Tajné/AKJ: vlastník vidí defaultně
  contentOverride: {              // sparse — vyplněné přepíše základ stránky
    content: <paragraphs TipTap>,
    imageUrl: <GDrive ID → F12>,
    table: <table pokud hasTable>,
  },
}
```

`AccessRequirement = {type:'UserId'|'AKJ'|'Role'|'AKJType', value:string}`. Záložku vidí, kdo splní **kterýkoli** access (OR) — plus **vlastník PC** (pokud `ownerHidden:false`) a **PJ/Admin vždy**.

## 3. Klasifikace zdroje → `name` záložky

| zdroj | `name` | `order` |
|---|---|---|
| PC Tajné | `Tajné` (víc → `Tajné 2`…) | 1 |
| PC Kontakty | `Kontakty` | 2 |
| AKJ s clearance | `AKJ <N>` (z titulu/type1) | 10 + N |
| AKJ bez čísla | titul stránky | 50 |

Obsah záložky = staré page `paragraphs` (+ `imageUrl`/`table` pokud jsou).

## 4. Přístupy (`access`) — mapování starých práv + dodržení grantů

Uživatel: *„AKJ záložky vidí ti, kdo je mají zpřístupněné; existující přístupy dodrž."* → překlad starých `accessRequirements`:

| staré | → Ikaros `access` |
|---|---|
| `{type:1, value:'N'}` (AKJ clearance) | `{type:'AKJ', value:'N'}` |
| `{type:0, value:<oldUserId>}` (konkrétní hráč) | `{type:'UserId', value:<F1 nové id>}` — **grant dodržen** |
| `{type:2, value:'Player'/'User'}` (role) | `{type:'Role', value:<mapovaná role>}` |

Clearance N = `type1` value, fallback parse z titulu „AKJ N". `type0` granty bez záznamu v F1 → vynechat + report.
**Owner visibility:** PC Tajné/AKJ/Kontakty → `ownerHidden:false` (vlastník vidí). NPC/Ostatní AKJ → bez ownera, jen access.

## 5. Párování cíle (`vlastnik_cil` → Ikaros slug)

Cíl = postava **i** organizace/lokace. Resolve: `vlastnik_cil` (po částech, oddělovač `,;\n`) → jméno postavy (F3) **nebo** titul existující stránky (F4a/b/b2) → slug.
- **reverse-rename** (Zara Hawke→`zara`, Abi démon→`erlend`) jako v F4b-2.
- **1:N (72):** stejná záložka se **zkopíruje na všechny** detekované cíle (spec 2c: AKJ 1:N).
- ⚠️ duplicitní cíl-slug (přezdívky) → mapuj na kanonickou Page (po cleanupu).

## 6. Bez cíle (~52) → host stub stránka

Spec 2d bod 6: cíl neexistuje → vytvoř **veřejnou stub Page** (`type:'Ostatní'`):
- veřejně **jen hláška** „Obsah dostupný pouze přes AKJ" — žádný biotext, žádný obrázek, žádná tabulka.
- skutečný obsah → `akjTabs` na téže stránce.
- slug = slug staré AKJ stránky (`akj-12-alzahir`…).

## 7. GM01–07 (Týmy GMOI) — schváleno

GMOI = Globální magická obranná iniciativa; hub `tymy-gmoi` „Týmy GMOI" existuje.
- **gm01–gm05** (AKJ/Ostatní): stub Page + AKJ záložka s obsahem; **veřejný odkaz na „Týmy GMOI"** (`tymy-gmoi`) ve stubu.
- **gm06** (už v Ikaru): doplnit odkaz na Týmy GMOI.
- **gm07** prázdná, **gm08** neexistuje → skip.
- Číslo (01–07) = označení/název stránky.

## 8. Oprava propadlých částí (audit, 10) — rozdělení

Mis-klasifikované části PC (CSV mimo PC) doimportovat na správné místo:
- **subdoc** (→ jako F4c): `poznamky-mingguo`→`character_notes`(mingguo→li-mingguo), `kontakty-archie`/`poznamky-archie` (archie). Pozn.: Kontakty dle rozhodnutí A = AKJ záložka, ne subdoc.
- **AKJ** (→ F4d): `akj-2-li-mingguo`, `akj-8-zara-hawke`, AKJ „cíl nenalezen" u helsing/medak/sion/archie/lo3 — párovat přes jméno cíle.

## 9. Mechanika importu

Workflow `import-matrix-akj.yml` (BE repo), vzor `import-matrix-npc.yml`:
- data `migration/f4d-akj.json.gz` = `[{targetSlug | stub, name, order, access[], contentOverride, ownerHidden, _src}]`.
- **idempotent:** `$addToSet`/merge akjTab podle `id` (deterministické id ze slug+name); re-run neduplikuje. Stub Page upsert dle slug.
- tag `_mig:'f4d'` na akjTab i stub Page. **Rollback:** `$pull` akjTabs `_mig:f4d` + `deleteMany` stub Page `_mig:f4d`.
- pořadí: po F4a/F4b/F4b-2 (cíle musí existovat).

## 11. LEAK FIX — 193 stránek s nefunkčním přístupem (priorita)

**Nález (2026-06-07):** F4a/F4b naimportovaly **193 stránek** se starými **číselnými** typy práv `{type:1,value:"8"}`. Ikaros `shieldedFromRequirements` zná jen řetězce `'AKJ'|'UserId'|'Role'|'AKJType'` → číslo `1` nematchuje žádnou větev → funkce vrací `undefined` = **stránka veřejná**. Tajný obsah (Odboj hierarchie + utajené projekty) byl **čitelný komukoli**.

**Dotčené:** F4a 144 + F4b NPC 49 = 193. Práva: type1 AKJ (172), type0 UserId (124), type2 Role (21). 6 stránek „jen Role" (PJ nástroje: `generator-pocasi`, `seznam-postav`…) — taky převedeny (PJ záložku vidí).

**Oprava (convert):** každá leak stránka → **veřejný stub** (`content` = „Obsah dostupný pouze přes AKJ", `imageUrl`/`table`/`accessRequirements` vyprázdněny) + **AKJ záložka** „Utajený archiv (AKJ N)" s **původním obsahem** a přemapovaným přístupem (1→AKJ, 0→UserId přes F1, 2→Role). Odpovídá staré UI „UTAJENÝ ARCHIV [AKJ: N]".

**Bezpečnost importu:** před stubbingem **záloha celé stránky** do `pages_mig_trash_f4d` (jen jednou — idempotent guard). Rollback `replaceOne` z trash → přesný originál (ověřeno mock testem: content/imageUrl/accessRequirements obnoveny i po opakovaném běhu).

## 11b. Odboj — hierarchie (vzor pro organizace)

`seznam-odboj` (veřejný hub) → odkazy na mezistránky **Velení Odboj 001–005** (AKJ 8), **Nejvyšší velení** (AKJ 10), **Vyšší členové 01–05** (AKJ 6). Mezistránky byly leak (Ostatní + acc type1) → §11 je převede na stub+záložku. Jejich tajný obsah (odkazy na **krycí čísla agentů** `0001`/`0010`…) zůstává v záložce; krycí čísla jsou samostatné cílové stránky.

## 10. Otevřené (defaulty zvoleny, lze změnit)
- 1:N → kopie na všechny cíle (default).
- Kontakty → AKJ záložka „Kontakty" (rozhodnutí A).
- GM odkaz veřejný (default).
- Role mapování `type2` value → konkrétní Ikaros role: doladit dle starých hodnot (Player/User → ?). **Prověřit před importem.**
