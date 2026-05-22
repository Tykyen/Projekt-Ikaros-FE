# Spec 8.1 — Detail postavy: editační vlna

> **Stav:** hotovo (implementováno 2026-05-22) • **Autor:** Claude + PJ • **Datum:** 2026-05-22
> Roadmap: [docs/roadmap-fe.md](../../roadmap-fe.md) řádek 1246+
> Navazuje na: read-only vlnu 8.1 (commity `1946f21` 8.1a, `b14532c` 8.1b, `8e12ab1` 8.1c)
> Návazný spec: spec-8.2 (tvorba postavy + kaskáda), spec-8.5 (editor schématu deníku)
> Rozsah: převážně FE + **1 malá BE úprava** (`assertSubdocAccess` gating, §4.10)

---

## 1. Cíl

Doplnit **editaci** do existujícího detailu postavy (`/svet/:worldSlug/postava/:slug`).
Detail je dnes plně **read-only** — 6 tabů (Profil, Deník, Finance, Výbava, Kalendář,
Poznámky) data jen zobrazuje. Tato vlna přidává inline **režim úprav**: PJ a vlastník
postavy mohou editovat všech 6 oblastí přímo na stránce. Tím se krok 8.1 dle roadmapy
(`GET/PATCH .../diary`, `.../finance` + `add-monthly` + `undo`, `GET/PUT .../calendar` …)
uzavírá kompletně.

## 2. Kontext / motivace

Read-only vlna 8.1 (3 commity, body 8.1a–8.1g) je hotová a v `main`, ale roadmap má
krok 8.1 stále nezaškrtnutý `[ ]` — a právem: body 8.1b–8.1f v roadmapě explicitně
požadují `PATCH`/`PUT` endpointy a finanční akce `add-monthly`/`undo`, což jsou
**zápisové operace**. Kód read-only vlny to sám přiznává — na třech místech komentář
„*editace přijde s navazující vlnou*" (`CharacterDetail.tsx:32`, `FinanceTab.tsx:23`).

Bez editace je character sheet jen výpis: PJ nemá jak postavě upravit bio, hráč si
nezapíše do deníku, finance nelze zaúčtovat. Pro reálné hraní je editace nutná.

> **Nesrovnalost (hlášena autorovi):** read-only vlna 8.1a–c vznikla **bez spec
> souboru** — `docs/arch/phase-8/` dosud neexistovala. Tento spec ji zakládá; popis
> read-only stavu v §3 slouží i jako zpětná dokumentace.

## 3. Audit současného stavu

### 3.1 Hotovo (read-only vlna)

| Vrstva | Soubory | Stav |
|---|---|---|
| Routa | `router.tsx` — `/svet/:worldSlug/postava/:slug` | ✅ |
| Entry + presenter | `CharacterDetailPage/CharacterDetailPage.tsx`, `CharacterDetail.tsx` | ✅ read-only |
| Hlavička | `components/CharacterHeader.tsx` | ✅ avatar + jméno + badge typu |
| Taby | `components/{BioTab,DiaryTab,FinanceTab,InventoryTab,NotesTab,CalendarTab}.tsx` | ✅ read-only |
| GET hooky | `api/useCharacter.ts`, `api/useCharacterSubdocs.ts` (5×) | ✅ |
| Typy | `api/characters.types.ts` | ✅ Character + 5 subdoc |
| Testy | `__tests__/{CharacterDetail,DiaryTab,FinanceTab}.spec.tsx` | ✅ read-only |

### 3.2 BE — zápisové endpointy (hotové, čeká na FE napojení)

| Endpoint | Tělo | Pozn. |
|---|---|---|
| `PATCH /worlds/:worldId/characters/:slug` | `UpdateCharacterDto` | bio, info bloky, `diaryData` (deep-merge), `extraBlocks`, `imageUrl`, `name` |
| `PATCH .../characters/:slug/diary` | `sections`, `customData`, `personalDiarySchema` | hodnoty + sekce |
| `PUT .../characters/:slug/calendar` | `events`, `color`, `displaySettings` | celý subdoc |
| `PATCH .../characters/:slug/finance` | `entries`, `accountType`, `accessLocation`, `currency` | `balance`/`transactions` počítá BE |
| `POST .../characters/:slug/finance/add-monthly` | — | sečte `entries`, založí transakci, navýší `balance` |
| `POST .../characters/:slug/finance/undo` | — | vrátí poslední transakci |
| `PATCH .../characters/:slug/inventory` | `sections` | |
| `PATCH .../characters/:slug/notes` | `content` | |

Přístup k subdoc endpointům hlídá BE `characters.service.ts → assertSubdocAccess`:
povolí **role ≥ PJ** *nebo* **vlastníka** (`!isNpc && userId === requester`).

### 3.3 Co chybí (rozsah této vlny)

- Žádné `useMutation` hooky — `api/` má pouze GET.
- Žádný edit-mode render v tabech — komponenty umí jen číst.
- Žádný mechanismus přepnutí stránky do režimu úprav.
- Sdílené edit komponenty (editor sekcí s položkami, editor info bloků) neexistují.

### 3.4 Zjištěné dluhy / nesrovnalosti

| # | Popis | Řešení |
|---|---|---|
| N-1 | FE `CharacterDetail.tsx:37` počítá `canSeePrivate` jako **PomocnyPJ(4)+** nebo vlastník, ale BE `assertSubdocAccess` povoluje subdoc jen **PJ(5)+** nebo vlastníkovi. PomocnyPJ tak vidí tab Poznámky, ale `GET .../notes` mu vrátí 403. | **Rozhodnuto (A2):** rozšířit BE `assertSubdocAccess` na PomocnyPJ(4)+. Viz §4.10. |
| N-2 | `Character` ani subdoc typy nemají `updatedAt` → nelze poslat optimistic-concurrency token jako u stránek (`expectedUpdatedAt`, 7.2k). | Concurrency mimo rozsah, viz §5. Dluh přes skill `dluh`. |

## 4. Návrh řešení

### 4.1 Mechanika režimu úprav

UX zvolené autorem: **inline toggle** (ne samostatná routa).

- `CharacterDetail` drží stav `editMode: boolean`. Default `false`.
- Hlavička dostane tlačítko **„Upravit"** — viditelné jen když `canEdit` (§4.9).
- V `editMode` je editovatelný **právě aktivní tab**. Ostatní taby zůstávají v read
  renderu. Záhlaví edit zóny: „⚠ Režim úprav: \<název tabu\>".
- Dole **sticky lišta** (vzor `EditorStickyBar`, `PageEditor/components/`): tlačítka
  **Uložit změny** / **Zrušit**. Uložit je `disabled` bez změn nebo při běžící mutaci.
- Každý tab si drží **lokální form state** (kopie dat ze serveru). „Zrušit" stav
  zahodí, „Uložit" pošle mutaci.
- **Discard guard:** přepnutí tabu nebo odchod ze stránky s neuloženými změnami →
  potvrzovací dialog („Máš neuložené změny…").
- Po úspěšném uložení: invalidace příslušného query, toast „Uloženo", `editMode`
  zůstává zapnutý (uživatel může pokračovat).

```
CharacterDetail
 ├─ CharacterHeader      (+ tlačítko Upravit / badge Režim úprav)
 ├─ Tabs
 │   └─ aktivní tab:  <XxxTab mode={editMode ? 'edit' : 'view'} … />
 └─ EditStickyBar       (jen editMode — Uložit / Zrušit)
```

Každý `XxxTab` dostane prop `mode: 'view' | 'edit'`; view větev = dnešní kód beze změn.

### 4.2 Profil — bio (8.1a + 8.1g)

Edituje `PATCH /characters/:slug`:
- `name`, `imageUrl` (avatar) — v hlavičce; upload avataru přes existující mechaniku
  `RichTextEditor.onImageUpload` / shared uploader (ověřit zdroj v impl. plánu).
- `publicBio`, `privateBio` — `RichTextEditor` bez `readOnly`.
- `publicInfoBlocks`, `privateInfoBlocks` — editor řádků `{label, value}`: přidat /
  smazat / přeřadit.
- `extraBlocks` hodnoty — editace `diaryData[block.key]` dle `block.type`.
  **Definice** `extraBlocks` (přidání/odebrání bloku schématu) je **mimo rozsah** —
  patří do editoru schématu (krok 8.5).
- **`accessRequirements`** (rozhodnuto B) — editor pravidel viditelnosti postavy:
  řádky `{type, value}`, `type ∈ {UserId, AKJ, Role, AKJType}`. Jen pro PJ — řídí,
  kdo postavu uvidí. Hodnoty `value` dle typu (ID člena / AKJ úroveň / název role).
  Sdílí vzor s `AccessPanel` editoru stránek (`PageEditor/panels/AccessPanel.tsx`) —
  ověřit reuse v impl. plánu.

### 4.3 Deník (8.1b)

Edituje `PATCH /characters/:slug/diary`:
- `sections` — sdílený **`SectionListEditor`** (§4.8): název, obsah (`RichTextEditor`),
  položky `{text, quantity?, note?}`, pořadí, collapse.
- `customData[block.id]` — hodnoty bloků osobního schématu (`stat`/`bar`/`list`/`text`).
- `personalDiarySchema` (definice bloků) — **mimo rozsah** (krok 8.5).

### 4.4 Finance (8.1c)

- `PATCH /finance`: editace `entries` `{label, amount}` (přidat/smazat/upravit),
  `accountType`, `accessLocation`, `currency`.
- `balance` a `transactions` jsou **read-only** — počítá je BE.
- Tlačítko **„Zaúčtovat měsíc"** → `POST /finance/add-monthly`.
- Tlačítko **„Vrátit poslední transakci"** → `POST /finance/undo` (jen když existuje
  transakce; potvrzení).

### 4.5 Výbava (8.1d)

`PATCH /inventory` — `sections` přes týž `SectionListEditor` jako deník.

### 4.6 Poznámky (8.1e)

`PATCH /notes` — `content` přes `RichTextEditor` bez `readOnly`.

### 4.7 Kalendář (8.1f)

`PUT /calendar` (celý subdoc):
- `events` — CRUD seznamu: `{title, start, end, allDay, hourStart, hourEnd,
  description}`. Editace v seznamu/řádkovém formuláři.
- `color`, `displaySettings.defaultView` — výběr barvy a výchozího pohledu.
- **Mimo rozsah:** měsíční mřížka, nebeská tělesa, fantasy config — to je **fáze 9.2**.

### 4.8 Nové soubory

```
src/features/world/pages/api/
  useCharacterMutations.ts      # useUpdateCharacter, 5× subdoc PATCH/PUT,
                                # useFinanceAddMonthly, useFinanceUndo
src/features/world/pages/CharacterDetailPage/components/
  EditStickyBar.tsx             # Uložit / Zrušit (vzor EditorStickyBar)
  editors/
    SectionListEditor.tsx       # sdílený editor sekcí+položek (deník, výbava)
    InfoBlockEditor.tsx         # sdílený editor řádků {label,value} (bio)
    SchemaValueEditor.tsx       # vstup pro hodnotu bloku dle type
    AccessRequirementEditor.tsx # editor accessRequirements (jen PJ)
```

Mutace = vzor `useUpdatePage` (`useMutation` + `queryClient.invalidateQueries` nad
`charactersQueryKey`). Každá invaliduje svůj `detail`/`subdoc` klíč.

### 4.9 Oprávnění

`canEdit = (userRole ≥ WorldRole.PomocnyPJ) || isOwner` — zrcadlí BE
`assertSubdocAccess` **po úpravě §4.10**.
`isOwner = !character.isNpc && character.userId === currentUser.id`.
`accessRequirements` editor je navíc omezen jen na **PJ(5)+** (vlastník-hráč
neřídí vlastní viditelnost).
Hodnoty propočítá `CharacterDetail` a předá tabům + hlavičce. BE zůstává autoritou
(FE gating je jen UX — skrývá tlačítka, nezakládá bezpečnost).

### 4.10 BE úprava — gating `assertSubdocAccess` (rozhodnuto A2)

Soubor `backend/src/modules/characters/characters.service.ts`, metoda
`assertSubdocAccess`: změnit `role >= WorldRole.PJ` → `role >= WorldRole.PomocnyPJ`.
Tím PomocnyPJ získá GET i PATCH/PUT subdokumentů — sjednoceno s FE `canSeePrivate`.
Ověřit i gating `GET /characters/:slug` (viditelnost `privateBio`) a `PATCH
/characters/:slug` — sjednotit na stejnou hranici.
> Cross-repo: BE je `c:\Matrix\ProjektIkaros\Projekt-ikaros\backend`. Před BE
> commitem `prettier --write` (jinak husky hook selže).

## 5. Mimo rozsah

| Položka | Patří do |
|---|---|
| Editor definice schématu deníku (bloky stat/bar/list/text, `personalDiarySchema`, `extraBlocks` definice) | krok 8.5 |
| Plný kalendářový pohled — mřížka, nebeská tělesa, fantasy config | fáze 9.2 |
| Tvorba a mazání postavy, convert PC↔NPC, přiřazení hráči | krok 8.2 |
| Adresář postav, `/moje-postava` | krok 8.3 |
| Optimistic-concurrency token (BE nemá `updatedAt` na postavě/subdoc) — N-2 | dluh `dluhy.md` |

## 6. Akceptační kritéria

- [x] BE `assertSubdocAccess` rozšířen na PomocnyPJ(4)+; PomocnyPJ dostane subdoc bez 403.
- [x] PomocnyPJ+ / vlastník vidí na detailu tlačítko „Upravit"; nižší role ne.
- [x] Režim úprav zpřístupní editaci aktivního tabu; sticky lišta Uložit/Zrušit.
- [x] Profil: editace jména, avataru, veřejného i soukromého bia + info bloků; uloží `PATCH /characters/:slug`.
- [x] Profil: PJ může editovat `accessRequirements` postavy (řádky type/value).
- [x] Deník: editace sekcí, položek a hodnot bloků; uloží `PATCH .../diary`.
- [x] Finance: editace `entries` + metadat; „Zaúčtovat měsíc" a „Vrátit transakci" fungují.
- [x] Výbava: editace sekcí s položkami; uloží `PATCH .../inventory`.
- [x] Poznámky: editace obsahu; uloží `PATCH .../notes`.
- [x] Kalendář: CRUD událostí + barva/pohled; uloží `PUT .../calendar`.
- [x] Neuložené změny při přepnutí tabu / odchodu → potvrzovací dialog.
- [x] Po uložení: toast + aktualizovaná data (invalidace query).
- [x] `mobil-desktop` audit — editace funkční na mobilu i desktopu.
- [x] Roadmap 8.1a–8.1g zaškrtnuto, `napoveda` aktualizována.

## 7. Test plán

- **Unit/component:** rozšířit `DiaryTab.spec`, `FinanceTab.spec`, `CharacterDetail.spec`
  o edit větve; nové specy pro `SectionListEditor`, `InfoBlockEditor`, edit toky financí
  (add-monthly/undo), discard guard.
- **Smoke (skill `verify`):** projít každý tab — zapnout úpravy, změnit, uložit, ověřit
  perzistenci po reloadu; 403 cesta pro neoprávněného.
- **Responsive:** skill `mobil-desktop` po dokončení UI.

## 8. Riziko & rollback

| Riziko | Mitigace |
|---|---|
| Souběžná editace (dva PJ) přepíše změny — N-2 | Bez `updatedAt` nelze řešit; zaznamenat jako dluh, akceptovat „last write wins" pro tuto vlnu. |
| `diaryData` deep-merge na BE — odebrání klíče se nemusí projevit | Ověřit chování v impl. plánu; případně poslat explicitní `null`. |
| Nekonzistence gateingu PomocnyPJ vs. PJ — N-1 | Vyřešit dle §9 otázka A před implementací. |
| Velký rozsah (6 oblastí) v jedné vlně | Implementaci členit per tab; sdílené editory první. Pořadí navrhne impl. plán. |

**Rollback:** editace je aditivní (prop `mode`, nové soubory). Revert commitů vlny
vrací plně funkční read-only detail.

## 9. Schválená rozhodnutí (2026-05-22)

| # | Rozhodnutí |
|---|---|
| Rozsah | Editace všech 6 oblastí (bio, deník, finance, výbava, poznámky, kalendář). |
| UX | Inline režim úprav (toggle), ne samostatná routa. |
| A (N-1) | **A2** — rozšířit BE `assertSubdocAccess` na PomocnyPJ(4)+; FE gating sjednocen na PomocnyPJ. |
| B (accessReq) | **Zahrnout teď** — editor `accessRequirements` do tabu Profil, jen pro PJ. |

---

**Stav workflow:** **hotovo** — spec schválen, frontend-design audit ([design-8.1.md](design-8.1.md))
i implementační plán ([plan-8.1.md](plan-8.1.md)) provedeny, editační vlna 8.1
naimplementována a otestována (2026-05-22). Zbývající dluh concurrence → D-073.
