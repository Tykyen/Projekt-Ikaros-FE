# Spec 21.5a — Herbář (komunitní katalog rostlin) + vklad do obchodu

> Roadmap: [docs/roadmap2.md](../../roadmap2.md) krok **21.5a**. Navazuje na: [spec-21.5](spec-21.5-spolecna-tvorba.md) (hub + stub route `/ikaros/herbar`), **dědí model** [spec-16.2b-2](../phase-16/spec-16.2b-2-bestiar-komunitni.md) (komunitní bestiář — scope + knihovny + kurátorství + klon).
> **Stav:** 🟢 IMPLEMENTOVÁNO — **Etapa A ✅ + Etapa B ✅ (2026-07-10)**. Zbývá ostrý seed katalogu (po deploji), skiny (21 motivů) a per-systém staty (odloženo, §11). Zadání uživatele 2026-07-10.

---

## 1. Účel

Platformový (cross-svět, cross-systém) **katalog rostlin/bylin** pod „Společnou tvorbou" (`/ikaros/herbar`). Komunita rostliny prohlíží, diskutuje, tvoří (jako návrh) a **vkládá si je do obchodu svého světa** (po jedné i hromadně) s možností upravit ceny.

Herbář je **druhá plná knihovna** po komunitním bestiáři a staví na **témže modelu** (16.2b-2). Kde to jde, reuse; herbář-specifické jsou jen pole karty a **nový cíl klonu = obchod světa** (bestiář klonuje do bestiáře, herbář do ceníku).

## 2. Klíčové rozhodnutí (z diskuze 2026-07-10)

- **R1 — Jednotná karta jako MVP, model rozšiřitelný o per-systém staty.** Rostlina = **systémově neutrální karta** (lore + herbářová pole). Na rozdíl od bestie NEmá v MVP statbloky per systém. ⚠️ Ale datový model nese **prázdnou `statblocks` mapu** (stejný tvar jako `GlobalBestie`), aby šlo per-systém účinky (kolik léčí v DnD × DrD) přidat **později bez migrace**. Uživatel: „hodily by se, ale zatím nevím, jak to bude v praxi vypadat" → per-systém UI **odloženo** (otevřená otázka §11), model připraven.
- **R2 — Community scope + dvě knihovny (Schválená / Návrhy).** Reuse 16.2b-2 §3 beze změny: 4. scope `community`, `status: draft|approved`, autor/kurátor, moderace 20B, pending badge.
- **R3 — Navrhovaná cena žije v katalogu, upravitelná při vkladu.** Rostlina má pole **`suggestedPrice`** (číslo, bez měny — katalog je cross-svět). Při vkladu do obchodu se předvyplní; PJ („dotyčný") si cenu i měnu **upraví**. Uživatel: „cena v budoucnu navrhovaná v globálním katalogu a případně si ji upraví dotyčný."
- **R4 — Cíl vkladu = obchod světa** (ne per-svět herbář). Herbář je zatím **jen globální katalog**; do světa se rostlina dostává vkladem do **obchodu** (Etapa B). Samostatný per-svět herbář (jako sekce světa) = odloženo, mimo scope.
- **R5 — Jednoúrovňová diskuse.** Bestiář má dvouúrovňovou (o bytosti + ke statům per systém). Herbář bez per-systém statů → **jen jedna úroveň** (diskuse o rostlině). Reuse `BestieComment` s `targetType:'beast'` ekvivalentem, druhá úroveň se doplní až s per-systém staty.

## 3. Datový model — `GlobalPlant`

**Odvozeno z reálného dokumentu `Lektvary herbář.docx`** (~51 rostlin, 63 obrázků). Karta má v datech přesně 4 pole (Název / Roste / Použití / Vzácnost) + obrázek — žádný popis, cena ani staty. Model to zrcadlí, zbytek je volitelné/budoucí. Struktura mirror `GlobalBestie` ([bestie.schema.ts](../../../../Projekt-ikaros/backend/src/modules/bestiae/schemas/bestie.schema.ts)):

```
GlobalPlant {
  scope: 'community'                       // reuse 4. scope
  name                                     // primární název (Andělika, Áron, Bahenní lilie)
  aliases?                                 // lidová/regionální jména za pomlčkou (děhel; dračí jazyk, hadí jazyk)
  imageUrl?, imageFocalX/Y?, imageZoom?, imageFit?   // obrázek + výřez (reuse bestie image pole)
  habitat?                                 // „Roste" — herní lokalita, volný text (Hobitín Faladop, Elfský les, Trpasličí hory)
  usage?                                   // „Použití" — část rostliny, volný text (plod; květ, list; kořen; nať)
  rarity?                                  // „Vzácnost" — enum 5 stupňů (viz níže)
  rarityNote?                              // volný dovětek ze zdroje („pěstuje se na zahrádkách", „v Burnasu běžná")
  description?                             // lore / popis — ve zdroji CHYBÍ, doplní komunita později
  tags[]?                                  // volitelné štítky (léčivá, jedovatá, …)
  suggestedPrice?                          // R3 — navrhovaná cena (číslo, bez měny) — ve zdroji CHYBÍ, doplní se
  status: 'draft' | 'approved'             // R2
  authorId, createdAt, approvedAt?, approvedBy?
  moderationHidden?, moderationHiddenReason?          // reuse 20B
  statblocks: {}                           // R1 — prázdná mapa, připraveno na per-systém (odloženo)
}
```

- **Vzácnost (`rarity`)** — enum **5 stupňů dle reálných dat**: `bezna | stredne_bezna | stredne_vzacna | vzacna | velmi_vzacna`. Ve zdroji „běžný/běžná … velmi vzácný/vzácná" (rod se liší, hodnota stejná). Volný dovětek („pěstuje se na zahrádkách") → `rarityNote`. Informativní + filtr + barevný odznak; volitelně mapuje na násobek ceny (nice-to-have, ne MVP).
- **`name` vs `aliases`** — ve zdroji „Andělika - děhel" = primární `Andělika` + alias `děhel`; „Áron - dračí jazyk, hadí jazyk" = primární + 2 aliasy. Migrace rozdělí podle první pomlčky. **Pozn.: nejsou to latinské názvy** (jako u bestie), ale lidová/herní jména → pole je `aliases`, ne `latin`.
- **`habitat`/`usage`** — volný text (lokality jsou herní: „Darendalův hvozd", „Bažiny Země nikoho"). Strukturovat (číselník) = odloženo.

## 4. Scope, knihovny, schvalování — reuse 16.2b-2

Beze změny modelu: community scope, Schválená/Návrhy knihovny, autor tvoří návrh (draft) → kurátor (`CURATOR_ROLES`: Superadmin/Admin/SpravceClanku/SpravceDiskuzi) schválí. **Lore edituje autor/kurátor přímo; kurátor edituje i schválenou položku přímo** (převzato z opravy 16.2b-2 §2a — u herbáře bez per-systém statů se pravidlo zjednodušuje: přímá editace polí je OK, protože nejde o herní balanc statbloku).

## 5. FE — kostra (reuse bestiář)

**Route:** `/ikaros/herbar` — nahradit `ComingSoonPage` funkční stránkou; dlaždice `tiles.ts` `active:true`.

> **Auth (rozhodnuto 2026-07-10):** čtení i tvorba **vyžadují přihlášení** — celý `PlantsController` pod `JwtAuthGuard` (parity s komunitním bestiářem, který je taky login-required). Společná tvorba **není** veřejná pro anonyma; případné zveřejnění by se řešilo najednou pro bestiář i herbář (`OptionalJwtAuthGuard` na GET), zatím nechceme.

**Dvě obrazovky (vzor `KomunitniBestiar{Page,Detail}`):**
1. **Knihovna** — Schválená / Návrhy (přepínací hřbety), seznam-rejstřík: portrét · název + latinsky · vzácnost · lokalita · počet komentářů · **„＋ Vlož do obchodu"**. Filtry: vzácnost, tag.
2. **Detail „karta rostliny"** — obrázek (iluminace) + lore (dropcap) + tabulka polí (Roste / Použití / Vzácnost) → diskuse. Vizuálně odpovídá screenshotu (tabulková karta).

**Editor:** lore + herbářová pole (name/latin/habitat/usage/rarity/description/tags/suggestedPrice + obrázek přes `HeroUploadCard`). Reuse formulářových vzorů z `ikaros/bestiar/components`.

**Komponenty** (`src/features/ikaros/herbar/`): `KomunitniHerbarPage`, `HerbarLibraryList`, `PlantCard` (detail), `PlantEditorModal`, `PlantDiscussion` (reuse `BestieDiscussion`), `InsertToShopModal` (Etapa B).

## 6. Etapa B — vklad do obchodu světa ✅ (2026-07-10)

**HOTOVO.** Cíl: z globální rostliny vytvořit `ShopItem` ve světě uživatele. **Předpoklady (splněno):**

1. ✅ **Obrázek v obchodu** — `ShopItem` rozšířen o `imageUrl` + `imageFocalX/Y`/`imageZoom`/`imageFit` (parita bestie/rostlina) v `campaign-shop-item.schema.ts`, interface, `create-campaign-shop-item.dto.ts` i repo `toEntity`. FE: upload přes `HeroUploadCard` v `ShopItemForm`, miniatura na kartě `ShopItemCard` (fallback = iniciála názvu). → **užitek i mimo herbář** (ruční položky obchodu).
2. ✅ **Bulk endpoint** — `POST /campaign/shopitems/bulk?worldId=` (musí být před `/shopitems/:id`), wrapper `BulkCreateShopItemsDto` (`{items}`, `ArrayMinSize(1)`/`ArrayMaxSize(200)`, `SHOP_BULK_MAX=200`), gate PomocnyPJ+ **dvojí** (controller `role()` floor → `INSUFFICIENT_WORLD_ROLE` + service `getWorldRole` re-check + `SHOP_BULK_EMPTY`/`SHOP_BULK_TOO_MANY`), service `createShopItemsBulk`, repo `createMany` (`insertMany`). Základ i pro budoucí **předpřipravené obchody** (shop templates, roadmap 21.1:707).
3. ✅ **Import vrstva herbář → obchod** (`InsertToShopModal`, single + bulk):
   - **Po jedné:** tlačítko „＋ Vlož do obchodu" na detailu rostliny → single create: výběr cílového světa (jen kde jsi PomocnyPJ+, přes `useMyWorlds`) + skupina obchodu (`useShopGroups`) + **cena/měna předvyplněná `suggestedPrice ?? 0`** (`CurrencyAmountInput`), PJ upraví. Vytvoří 1 `ShopItem` (name = jméno rostliny, description = souhrn Roste/Použití/Lidová jména, imageUrl+výřez z rostliny).
   - **Hromadně:** „🛒 Vlož vše do obchodu" z listu → bulk: založí `ShopItem` za každou zobrazenou/filtrovanou rostlinu s **jednotnou výchozí cenou** (0; PJ dolaďuje v obchodě), volá bulk endpoint po dávkách ≤200. Ceny se pak upraví přes **existující** editaci obchodu (`PUT /campaign/shopitems/:id`).
4. ✅ **Kdo:** vkládá **PJ / PomocnyPJ+** cílového světa (tlačítko vidí každý přihlášený, ale výběr světa i BE gate omezují vklad na PomocnyPJ+; obchod needituje běžný hráč — reuse dnešní gate).

## 6b. Migrace — počáteční náplň katalogu z `Lektvary herbář.docx`

Uživatel dodal reálný dokument (`~/Downloads/Lektvary herbář.docx`, 19 MB) a chce ho **naimportovat** („kdyby jsme ho i vytvořili, nezlobil bych se"). Migrace naplní globální herbář reálnými rostlinami — katalog není prázdný od začátku.

- **Zdroj:** Word tabulky, ~51 rostlin, každá 4 pole (Název/Roste/Použití/Vzácnost) + obrázek; **63 obrázků** ve `word/media/`.
- **Vynechat prázdné šablony** — na konci dokumentu je 5 prázdných karet (jen hlavičky bez hodnot); migrace je **ignoruje** (import jen rostlin s vyplněným názvem).
- **Parser** (jednorázový skript, ne runtime): rozbalit .docx → `word/document.xml` → z tabulek vytáhnout 4 pole; `name`/`aliases` split podle první pomlčky; `rarity` namapovat na enum (5 stupňů), zbytek řádku → `rarityNote`; obrázky z `word/media/` spárovat s rostlinami (dle pořadí/pozice v dokumentu) a nahrát do úložiště (Cloudinary/webp, 🔁 vzor F12 migrace obrázků).
- **Cílový stav:** `scope:'community'`, `status:'approved'` (jde o kurátorský seed, ne komunitní návrh), `authorId` = Superadmin (Tyky).
- **Idempotence:** import podle `name` (re-run nepřidá duplikáty).
- ⚠️ **Párování obrázků** je hlavní riziko (63 obrázků × 51 rostlin — některé mají víc, některé možná žádný). Ověřit ručně po importu; skript vypíše nespárované.

## 7. Skiny

Odloženo (jako bestiář — až po funkčním MVP). Kostra od začátku s **stabilními data-atributy** (`data-plant-card`, `data-herbar-list`…) pro pozdější motiv-aware skiny.

## 8. Responsive (base.md)

Seznam zalomí na ≤768px; karta rostliny `spread` (obrázek|lore) → 1 sloupec na mobilu; po MVP povinný `mobil-desktop`.

## 9. Pořadí stavby

```
Etapa A (herbář katalog):
  1) BE: kolekce plants (scope community) + endpointy (list/detail/create/updateLore/approve) + moderace/pending — vzor bestiae
  2) Migrace: parser docx → seed ~51 rostlin + 63 obrázků (community/approved, autor Superadmin) — §6b
  3) FE: route /ikaros/herbar (nahradit stub) + knihovna (2×seznam+filtry) + detail karta + editor
  4) MVP ověření (default vzhled) na reálných datech, funkčně kompletní

Etapa B (vklad do obchodu) ✅ 2026-07-10:
  4) BE: ShopItem + imageUrl (+focal/zoom/fit); bulk endpoint POST /campaign/shopitems/bulk (gate PomocnyPJ+, max 200) ✅
  5) FE: InsertToShopModal (single + bulk) + obrázek v ShopItemForm + miniatura v ShopItemCard ✅
  6) MVP ověření vkladu (single + bulk + úprava cen) — build+testy ✓ (živé ověření po deploji)

Později (odloženo): per-systém staty rostlin (statblocks UI) · skiny 21 motivů · per-svět herbář sekce
```

BE a FE se nemíchají v jedné dávce (`fb_no_mixed_batch`); BE napřed, FE na reálné API.

## 10. Mimo scope

- Lektvary/Kouzla/Hádanky (21.5b–d) — dědí týž model, samostatné specy.
- Per-svět herbář jako sekce světa (klon do „herbáře světa") — odloženo, do světa jde přes obchod.
- Předpřipravené obchody / shop templates (21.1) — bulk endpoint je jejich základ, ale vlastní featura zvlášť.

## 11. Otevřené otázky

- ✅ **Lektvary** — v dokumentu nejsou (jen herbář). Uživatel dodá zdroj lektvarů později → **samostatná migrace + spec 21.5b**. Neblokuje 21.5a.
- **Per-systém staty rostlin** — jaká pole (účinek/síla/trvání?) a UI. Uživatel zatím neví „jak to bude v praxi vypadat" → model připraven (`statblocks`), návrh a UI až bude jasné.
- **Měna navrhované ceny** — `suggestedPrice` je bez měny (číslo). Jak mapovat na měnu světa při vkladu (jako báze? PJ zvolí měnu?).
- **`referenceLink`** — má vložená položka obchodu odkazovat zpět na kartu rostliny (herbář)? (Dnes `referenceLink` = slug wiki stránky světa.)
- ✅ **Vzácnost** — vyřešeno z reálných dat: 5 stupňů (`bezna/stredne_bezna/stredne_vzacna/vzacna/velmi_vzacna`) + `rarityNote`.
