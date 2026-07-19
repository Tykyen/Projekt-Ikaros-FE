# Spec — Vlastník postavy smí editovat OBSAH svých AKJ záložek

**Status:** ✅ IMPLEMENTOVÁNO 2026-07-19 (BE+FE). BE typecheck + eslint (0 warn) + jest 94/94 zelené; FE tsc -b + eslint + vitest zelené. Rozhodnutí §11: Q1 ano · Q2 ano · Q3 vyřešen v tomto zátahu (D-067). Čeká BE restart + FE deploy + živé ověření.
**Autor:** PJ + Claude
**Datum:** 2026-07-19
**Rozšiřuje:** [spec-akj-protected-tabs.md](spec-akj-protected-tabs.md) (datový model + gate) + [spec-akj-owner-visibility.md](spec-akj-owner-visibility.md) (owner výjimka na READ path)

---

## 1. Problém

Vlastník postavy hráče (PC) **vidí** své AKJ záložky (přes owner-výjimku, spec-akj-owner-visibility), ale **nemůže je editovat**:

- **FE:** na aktivní AKJ záložce ve vieweru není žádné edit tlačítko. `PostavaLayout.tsx:294` má `showEditBtn = subdocTabActive && !activeAkjTab && canEdit` — AKJ taby jsou z „Upravit záložku" **explicitně vyloučené**. „Upravit Bio" se ukazuje jen na profilu (`canEdit && activeTab === 'profil'`, ř. 293). AKJ tab se renderuje čistě read-only (`OstatniLayout` → `RichTextEditor readOnly`).
- **BE:** i kdyby se vlastník do editoru dostal, `pages.service.ts` `update()` pro `ownerScoped` (vlastník PC) **zahodí celé pole `akjTabs`** z patche (`delete persistDto.akjTabs`, ~ř. 574). Vlastníkovy změny AKJ se nikdy neuloží.

Dnešní model je konzistentní (vlastník vidí, needituje), ale nedostatečný: vlastník má mít možnost spravovat obsah **svých** záložek (typicky „Soukromé"), když mu to PJ povolí.

## 2. Cíl

1. **Nové per-záložka právo `ownerEditable`** — PJ v editoru zaškrtne „Vlastník smí upravovat obsah". Default = vypnuto (opt-**in**).
2. Když je zapnuté, vlastník PC smí ve vieweru **inline** editovat `contentOverride` té záložky: **text + obrázek + boxy (tabulka)**.
3. Vlastník **nikdy** nesmí měnit: `access` (kdo vidí), `ownerHidden`, `ownerEditable`, `name`, `order`, `id`, ani přidávat/mazat záložky nebo sahat na cizí (PJ) záložky.

💡 **Proč opt-in (`ownerEditable`), ne opt-out:** editace je citlivější než viditelnost. Default → jen PJ edituje (dnešní chování). Staré záložky bez pole zdědí `false` = beze změny. Kontrast s `ownerHidden`, kde default „vidí" dává smysl.

## 3. Datový model

Nové pole na sub-entitě `AkjTab`:

```ts
export interface AkjTab {
  id: string;
  name: string;
  order: number;
  access: AccessRequirement[];
  ownerHidden?: boolean;
  /** Vlastník postavy (page.ownerUserId) smí inline editovat contentOverride
   *  této záložky (text/obrázek/boxy). Default/undefined = false = jen PJ.
   *  Platí jen pro PC (ownerUserId) a jen dokud !ownerHidden (nelze editovat
   *  neviditelnou záložku). NIKDY nedovoluje měnit access/ownerHidden/name/order. */
  ownerEditable?: boolean;
  contentOverride?: AkjTabContentOverride;
}
```

## 4. Zápisová cesta (BE) — selektivní merge, ne osekání

Jádro. Dnešní `if (ownerScoped) { … delete persistDto.akjTabs; … }` (pages.service.ts ~ř. 572–578) se pro `akjTabs` **nahradí selektivním merge**. Ostatní citlivá pole (`accessRequirements`, `ownerUserId`, `type`, `slug`) se dál mažou beze změny.

```
// jen když ownerScoped (vlastník PC / autor pending návrhu)
if (persistDto.akjTabs !== undefined) {
  persistDto.akjTabs = mergeOwnerEditableAkjTabs(page.akjTabs, persistDto.akjTabs)
} else {
  delete persistDto.akjTabs   // nic neposlal → neměnit
}
```

`mergeOwnerEditableAkjTabs(dbTabs, incoming)`:

1. **Base = `page.akjTabs` z DB** (findById, ř. ~521) — jediný důvěryhodný zdroj flagů a access.
2. Pro **každou** DB záložku (zachovej pořadí a množinu DB):
   - Najdi příchozí záložku podle **`id`**.
   - Pokud nalezena **A** `dbTab.ownerEditable === true` **A** `!dbTab.ownerHidden` → vezmi z ní **POUZE `contentOverride`**; všechna ostatní pole (`id`, `name`, `order`, `access`, `ownerHidden`, `ownerEditable`) z **DB**.
   - Jinak → DB záložka **beze změny**.
3. Příchozí záložky s `id`, které v DB neexistuje → **ignoruj** (vlastník nesmí přidávat).
4. DB záložky chybějící v příchozím → **zachovej** (vlastník nesmí mazat).
5. Výsledek = plné pole (mohutnost = `dbTabs`) → projde `sanitizeAkjTabs` (sanitizace HTML/tabulky + drop runtime `locked`).

⚠️ **Kritická past — nikdy nevěř DTO u autorizačních polí.** `ownerEditable`, `ownerHidden` i `access` se čtou **z DB**, ne z příchozí záložky. Kdyby merge četl `ownerEditable` z payloadu, vlastník si ho nastaví `true` na PJ záložku a edituje ji → eskalace. Stejně `access` — čtení z DTO by dovolilo zvýšit clearance / přidat granty.

⚠️ **Moderátor (PJ, `ownerScoped === false`) beze změny** — full-replace `akjTabs` z DTO jako dnes (PJ má z `filterAkjTabsForViewer` `seesAll` → kompletní data, nic neztratí).

⚠️ **Optimistic lock:** inline owner-save posílá `expectedUpdatedAt` (jako PageEditor, 7.2k) → souběžná PJ editace vrátí 409 místo tiché ztráty. Merge čte `page` z `findById` mimo transakci; `expectedUpdatedAt` je pojistka.

## 5. Chování napříč rolemi (write)

Jednotná invarianta: **kdo nemá `seesAll` (kompletní čtení `akjTabs`), nesmí full-replace — mění jen `contentOverride` záložek, které SMÍ editovat; zbytek se bere z DB.** `seesAll = worldAdminBypass || membership.role ≥ PJ` (stejný výpočet jako `filterAkjTabsForViewer`).

| Editor | `seesAll` | `akjTabs` v update |
|---|---|---|
| PJ / platform Admin (elevated) | ano | full-replace z DTO (dnešní chování) |
| **PomocnyPJ** (role 4) | ne | **selektivní merge** — `contentOverride` záložek, které **plně vidí** (`passesAccess`, ne locked/skryté) |
| **Vlastník PC** (ownerScoped, role ≥ Hráč) | ne | **selektivní merge** — `contentOverride` záložek s `ownerEditable && !ownerHidden` |
| Autor pending návrhu (whitelist typ) | ne | merge, ale predikát nikdy nesedí (není vlastník) → `akjTabs` beze změny |
| Cizí hráč | — | 403 (assertCanEditPage → assertCanWrite) |

✅ **D-067 vyřešen tímto zátahem** (rozhodnuto 2026-07-19): `PomocnyPJ` je jen další „editor bez `seesAll`" — sdílí stejný merge helper jako vlastník, liší se pouze predikát „smí editovat záložku". Tím zaniká full-replace data-loss (dřív by z PageEditoru zničil PJ-only a locked záložky). Přístupová pravidla (`access`/`ownerHidden`/`name`/`order`) zůstávají PJ doménou u všech ne-`seesAll` editorů.

## 6. FE viewer — inline mini-editor (`PostavaLayout`)

Na aktivní AKJ záložce se vlastníkovi zobrazí tlačítko **„Upravit záložku"**, když:

```
showAkjOwnerEdit = !!activeAkjTab && !activeAkjTab.locked
                && activeAkjTab.ownerEditable === true
                && isOwner    // page.ownerUserId === currentUser.id
```

- Klik → místo read-only `OstatniLayout` se zobrazí **inline editor** (nová komponenta `AkjOwnerInlineEditor`) s předvyplněným `contentOverride` (nebo zděděným obsahem jako výchozím):
  - **Text** → `RichTextEditor` (onChange, `linkDirectory` + slugify jako v AkjTabsPanel).
  - **Obrázek** → `HeroUploadCard compact`.
  - **Boxy** → `TablePanel`.
- **Uložit** → `useUpdatePage.mutateAsync({ id: page.id, input: { akjTabs: [{ ...activeAkjTab, contentOverride: edited }], expectedUpdatedAt } })`. Posílá **jen tu jednu** záložku; BE merge ji spáruje podle `id` a ostatní DB záložky nechá být.
- **Zrušit** → discard guard (neuložené změny) jako u subdoc tabů.
- 403 → friendly toast; 409 → nabídnout refetch (reuse vzoru z PageEditoru dle možností).

💡 **Proč inline (varianta B), ne přes PageEditor:** vlastník nikdy neuvidí cizí/PJ záložky ani pole, co mu nepatří. PageEditor by mu servíroval BE-**filtrované** `akjTabs` a full-replace save by skryté záložky smazal — přesně past z §5.

⚠️ **Jen `PostavaLayout` (PC).** `WithAkjTabs` (flat typy Ostatní/Galerie) žádného ownera nemá → inline editor tam nezobrazovat.

## 7. UI editoru (`AkjTabsPanel`, jen PJ)

- Nový checkbox **„Vlastník smí upravovat obsah"** na kartě `AkjTabCard`, hned pod stávajícím „Vlastník postavy vidí tuto záložku".
  - Gated `ownerControlled` (jen PC), stejně jako `ownerHidden` toggle.
  - Zaškrtnuto → `ownerEditable: true`.
  - **Disabled** (a vynulovat na false) když je záložka pro vlastníka skrytá (`ownerHidden === true`) — neviditelnou nelze editovat. Krátký hint: „Nejdřív povol vlastníkovi záložku vidět."
- Preset **„Soukromé"** (nový PC dostává automaticky) — zvážit rovnou `ownerEditable: true`, ať je „Soukromé" hráčův prostor i k psaní. → **otevřený bod (§11 Q1)**.

## 8. Bezpečnost (shrnutí)

1. Flag `ownerEditable`, `ownerHidden`, `access`, `name`, `order`, `id` — **vždy z DB**, nikdy z DTO.
2. Editovat lze jen záložku s `ownerEditable && !ownerHidden` a jen vlastníkem (`page.ownerUserId`).
3. `contentOverride.content` + `.table` → `sanitizeRichText` / `sanitizeTable` (už v `sanitizeAkjTabs`).
4. `contentOverride.imageUrl` — dnes se nesanitizuje. Vlastník je méně důvěryhodný než PJ. → **otevřený bod (§11 Q2):** basic URL guard (odmítnout `data:` / `javascript:`, whitelist upload CDN).
5. Owner nemůže přidat/smazat záložku ani sáhnout na PJ (`ownerHidden:true`) záložky — merge je párovaný podle DB.

## 9. Dotčená místa (field-drift checklist)

Nové pole `ownerEditable` — viz [[project_be_field_checklist]] (vždy od toEntity mapperu):

| # | Soubor | Změna |
|---|---|---|
| 1 | BE `repositories/pages.repository.ts` (`toEntity`, ~ř. 407) | mapovat `ownerEditable: tab.ownerEditable as boolean \| undefined` |
| 2 | BE `schemas/page.schema.ts` | akjTabs = `MixedArraySubSchema` (volné) — bez změny, ověřit průchod |
| 3 | BE `dto/create-page.dto.ts` `AkjTabDto` (~ř. 255) | `@IsOptional() @IsBoolean() ownerEditable?: boolean` |
| 4 | BE `interfaces/page.interface.ts` `AkjTab` (~ř. 203) | `ownerEditable?: boolean` |
| 5 | BE `pages.service.ts` `update()` (~ř. 572–578) | selektivní merge místo `delete akjTabs` pro ownerScoped (§4) |
| 6 | BE `pages.service.ts` nový helper `mergeOwnerEditableAkjTabs` | párovaný merge dle id (§4) |
| 7 | BE `pages.service.ts` `sanitizeAkjTabs` (~ř. 131) | ověřit passthrough `ownerEditable` |
| 8 | FE `api/pages.types.ts` `AkjTab` | `ownerEditable?: boolean` |
| 9 | FE `PageEditor/panels/AkjTabsPanel.tsx` | checkbox v `AkjTabCard` (§7); presety |
| 10 | FE `PageViewer/layouts/PostavaLayout.tsx` | `showAkjOwnerEdit` gate + render inline editoru (§6) |
| 11 | FE nový `PageViewer/components/AkjOwnerInlineEditor.tsx` | mini-editor (RichText + HeroUpload + TablePanel) + save |

⚠️ **BE restart nutný** ([[feedback_be_restart_required]]) — jinak ValidationPipe whitelist tiše dropne `ownerEditable`.
⚠️ **BE+FE nemíchat v jedné paralelní dávce** ([[feedback_no_mixed_be_fe_batch]]).

## 10. Test (persistence A→B→A + escalation, přes BE)

**Merge (BE, `pages.service.spec.ts`):**
- Vlastník PC pošle změnu `contentOverride` záložky s `ownerEditable:true` → uloží se; ostatní (skryté PJ) záložky zůstanou.
- Vlastník pošle payload se **změněným `access` / `ownerHidden` / `ownerEditable` / `name`** → BE je **ignoruje** (načteno z DB beze změny). Escalation neprošla.
- Vlastník pošle záložku s `id`, co v DB není → ignorováno (nepřidá se).
- Vlastník vynechá jednu ownerEditable záložku → zůstane v DB (nesmaže).
- Vlastník edituje záložku s `ownerEditable:false` → contentOverride se **neuloží**.
- PJ (moderátor) full-replace `akjTabs` funguje beze změny.

**Viewer (FE):** owner s `ownerEditable:true` vidí „Upravit záložku"; s `false` nevidí; na locked/cizí nevidí; edit → save → obsah tam po refetchi je.

## 11. Otevřené body k odsouhlasení

- **Q1** ✅ ANO — preset „Soukromé" dostane rovnou `ownerEditable: true` (hráčův prostor i ke psaní).
- **Q2** ✅ ANO — basic `imageUrl` guard teď (odmítnout `data:`/`javascript:`, whitelist upload CDN).
- **Q3** ✅ ZMĚNA (2026-07-19) — `PomocnyPJ` full-replace data-loss (D-067) se řeší **v tomto zátahu** (sjednocený merge, viz §5), ne samostatně.

## 12. Mimo rozsah

- Retro-migrace: existující záložky nedostanou `ownerEditable` automaticky (PJ zapne ručně).
- Editace `name` / `access` / pořadí vlastníkem — nikdy (to je PJ doména).
- Owner **tvorba/mazání** AKJ záložek — ne, jen editace obsahu existujících.
