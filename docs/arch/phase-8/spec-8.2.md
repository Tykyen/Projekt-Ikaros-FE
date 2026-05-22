# Spec 8.2 — Adresář postav + tvorba / mazání / convert

> **Stav:** návrh — čeká na schválení • **Autor:** Claude + PJ • **Datum:** 2026-05-22
> Roadmap: [docs/roadmap-fe.md](../../roadmap-fe.md) řádek 1258+
> Navazuje na: spec-8.1 (detail postavy + editační vlna) — [spec-8.1.md](spec-8.1.md)
> Návazný spec: spec-8.3 (`/moje-postava` + slot ve `WorldContext`), spec-8.4 (NPC šablony)
> Rozsah: FE + **1 BE úprava** (kaskádní mazání subdokumentů, §4.9)

---

## 1. Cíl

Umožnit **vznik, zánik a změnu typu** postavy a dát postavám **přehledovou plochu**.
Krok 8.1 dal funkční detail postavy (čtení + editace 6 oblastí), ale postava se
dosud nedá vytvořit a neexistuje žádný seznam — jediný zdroj postav je seed,
jediná cesta k detailu je přímá URL. Tato vlna přidává:

1. **Adresář postav** (`/svet/:worldSlug/postavy`) — jádro: seznam karet ve 3 sekcích
   (PC / NPC / Lokace), filtr typu, prokliky na detail.
2. **Tvorbu** postavy (PC / NPC / Lokace) přes formulářový modal.
3. **Mazání** postavy (PJ) s potvrzením.
4. **Convert PC ↔ NPC** z hlavičky detailu.
5. **Přiřazení postavy hráči** (`membership.characterPath`).

Tím PJ spravuje postavy kompletně z UI — od založení po zánik — bez zásahu do DB.

## 2. Kontext / motivace

Roadmap krok 8.2 (řádky 1258–1266) požaduje `POST .../characters`, automatickou
kaskádu subdokumentů, `PATCH .../convert`, přiřazení hráči přes
`PATCH .../members/:id/character` a mazání. BE všechny endpointy **má** (§3.1).
FE má z 8.1 jen GET + PATCH/PUT hooky — chybí create / delete / convert a veškeré UI.

> **Odchylka od roadmapy (rozhodnuto 2026-05-22):** roadmap původně řadil **adresář
> postav** do kroku 8.3. Tvorba postavy ale nemá přirozený domov bez seznamu, kde
> postavy vidíš — tlačítko „Nová postava" patří do adresáře, ne do správy členů.
> Proto se **jádro adresáře přesouvá do 8.2**. Krok 8.3 se zúží na `/moje-postava`,
> slot postavy ve `WorldContext` a member-facing vychytávky adresáře (fulltext
> hledání, oblíbené, seskupení dle herních skupin). Roadmapa se upraví po schválení
> tohoto specu.

## 3. Audit současného stavu

### 3.1 BE — endpointy (hotové, čekají na FE napojení)

| Endpoint | Tělo | Role | Pozn. |
|---|---|---|---|
| `GET /worlds/:worldId/characters/directory` | — | člen (Čtenář+) | seznam `CharacterDirectoryEntry` |
| `POST /worlds/:worldId/characters` | `CreateCharacterDto` | PJ(5)+ | viz §3.2–3.3 |
| `DELETE /worlds/:worldId/characters/:slug` | — | PJ(5)+ | fyzické smazání, **bez kaskády** — N-2 |
| `PATCH /worlds/:worldId/characters/:slug/convert` | `{ userId? }` | PJ(5)+ | `userId` → PC, prázdné → NPC |
| `PATCH /worlds/:worldId/members/:membershipId/character` | `{ characterPath? }` | PomocnyPJ(4)+ / sám sobě | prázdné = odpojit |

Cross-repo BE: `c:\Matrix\ProjektIkaros\Projekt-ikaros\backend`.

### 3.2 BE — `CreateCharacterDto`

`backend/src/modules/characters/dto/create-character.dto.ts`:

| Pole | Povinné | Pozn. |
|---|---|---|
| `slug` | ✅ | BE jen `toLowerCase()` + kontrola unicity (`CHARACTER_SLUG_TAKEN`) — **generuje FE** |
| `name` | ✅ | |
| `isNpc` | ✅ | rozhoduje typ |
| `isLocation` | — | default `false` |
| `userId` | — | jen PC |
| `imageUrl` | — | avatar |
| `publicBio` / `privateBio` | — | |
| `publicInfoBlocks` / `privateInfoBlocks` | — | |
| `accessRequirements` | — | |
| `campaignSubjectId` | — | |

### 3.3 BE — mapování typu postavy

| Typ (UI) | `isNpc` | `isLocation` | `userId` |
|---|---|---|---|
| **PC** (hráčská postava) | `false` | `false` | ID hráče |
| **NPC** | `true` | `false` | — |
| **Lokace** | `true` | `true` | — |

### 3.4 BE — kaskáda subdokumentů po vytvoření

Event `character.created` → `CharacterSubdocsService.onCharacterCreated`
(`backend/src/modules/character-subdocs/character-subdocs.service.ts:45`):

| Typ | Kalendář | Deník | Poznámky | Finance | Výbava |
|---|---|---|---|---|---|
| PC | ✅ | ✅ | ✅ | ✅ | ✅ |
| NPC | ✅ | ✅ | ✅ | — | — |
| **Lokace** | ✅ | — | — | — | — |

FE kaskádu **neřídí** — po vytvoření jen invaliduje query a subdokumenty se dotáhnou.

### 3.5 FE — co existuje (reuse)

| Vrstva | Soubor | Pozn. |
|---|---|---|
| Typy | `pages/api/characters.types.ts` | `Character`, `CharacterDirectoryEntry`, `charactersQueryKey` (vč. `directory`) |
| Mutace 8.1 | `pages/api/useCharacterMutations.ts` | vzor `useMutation` + invalidace — rozšířit |
| Stub adresáře | `pages/CharactersPage.tsx` | dnes `<WorldStubPage area="characters" />` — naplnit |
| Routa | `app/router.tsx` — `/svet/:worldSlug/postavy` (`memberOnly`, Čtenář+) | hotová |
| Hlavička detailu | `CharacterDetailPage/components/CharacterHeader.tsx` | sem convert + delete |
| Správa členů | `WorldSettingsPage/tabs/MembersTab.tsx`, `components/MemberRow.tsx` | sem přiřazení + „Vytvořit PC" |
| Member mutace | `world/api/useUpdateMember.ts` | vzor PATCH člena — paralela |
| Modal / dialog | `shared/ui/Modal`, `shared/ui/ConfirmDialog` | |
| Toast | `sonner` (`toast.success` / `toast.error`) | |
| Vzor create | `world/api/useCreateWorld.ts`, `pages/api/useCreatePage.ts` | mutace + invalidace + slug |
| Vzor stránky | `CharacterDetailPage/` — routing layer + presenter | adresář ať drží stejný vzor |

### 3.6 Zjištěné nesrovnalosti / dluhy

| # | Popis | Řešení |
|---|---|---|
| N-1 | Roadmap (ř. 1305) chce pro Lokaci kalendář + deník + poznámky; BE jí dává **jen kalendář** (`character-subdocs.service.ts:51` `if (!isLocation)`). | **Rozhodnuto:** přijmout BE stav (Lokace = místo, ne osoba). Opravit text roadmapy ř. 1305. |
| N-2 | `DELETE` postavy je fyzické a BE **nemá handler `character.deleted`** → osiřelé subdokumenty + `membership.characterPath` ukazuje na neexistující postavu (hráč dostane 404 na `/moje-postava`). | **Rozhodnuto:** opravit BE v rámci 8.2 — viz §4.9. |
| N-3 | BE slug **negeneruje** — FE musí poslat slug v `CreateCharacterDto`. | FE generuje slug z jména, viz §4.3. |
| N-4 | Roadmap zmiňuje „PC příp. přes žádost hráče"; BE žádný request endpoint nemá. | **Rozhodnuto:** mimo rozsah — postavu zakládá jen PJ. Viz §5. |

## 4. Návrh řešení

### 4.1 Vstupní body

| Akce | Místo | Gating (FE) |
|---|---|---|
| Procházet postavy světa | **Adresář** `/svet/:worldSlug/postavy` | Čtenář(1)+ (člen) |
| Vytvořit postavu (PC/NPC/Lokace) | Adresář — tlačítko „Nová postava" v záhlaví | PJ(5)+ |
| Vytvořit PC pro konkrétního hráče | `MemberRow` — u člena bez postavy „Vytvořit postavu" | PJ(5)+ |
| Přiřadit / odpojit postavu hráči | `MemberRow` — výběr postavy u člena | PomocnyPJ(4)+ / sám sobě |
| Převést PC ↔ NPC | `CharacterHeader` na detailu postavy | PJ(5)+ |
| Smazat postavu | `CharacterHeader` na detailu postavy | PJ(5)+ |

### 4.2 Adresář postav (`/svet/:worldSlug/postavy`)

Naplní stub `CharactersPage.tsx`. Vzor: routing layer + presenter jako
`CharacterDetailPage/`.

- Data: `useCharacterDirectory` → `GET .../characters/directory` → `CharacterDirectoryEntry[]`.
- **3 sekce** dle typu: Postavy hráčů (PC) / NPC / Lokace. Prázdná sekce skrytá.
- **Filtr typu** — přepínač Vše / PC / NPC / Lokace.
- **Karta postavy** — avatar, jméno, badge typu; u PC jméno přiřazeného hráče.
  Klik → detail `/svet/:worldSlug/postava/:slug`.
- Záhlaví: tlačítko **„Nová postava"** (jen PJ) → `CreateCharacterModal`.
- Adresář je **member-facing** (Čtenář+ vidí); fulltext hledání, oblíbené a
  seskupení dle herních skupin → **krok 8.3**.

### 4.3 Tvorba postavy — `CreateCharacterModal`

Modal nad `shared/ui/Modal`. Pole (minimální — zbytek se doplní editací 8.1):

- **Jméno** — text, povinné.
- **Slug** — generuje FE z jména (slugify: lowercase, diakritika pryč, mezery → `-`).
  Pole zobrazené a ručně přepisovatelné; při kolizi `CHARACTER_SLUG_TAKEN` z BE →
  inline chyba „Tento slug už ve světě existuje".
- **Typ** — přepínač PC / NPC / Lokace. Mapování na `isNpc`/`isLocation` dle §3.3.
- **Hráč** — select členů světa; **viditelný a povinný jen pro typ PC**.
  - Otevřeno z `MemberRow` → předvyplněno daným členem, pole zamčené.
  - Otevřeno z adresáře → výběr ze členů světa (role Hráč+).
- **Avatar** — `imageUrl`; upload přes shared mechaniku (zdroj ověřit v impl. plánu —
  vzor `RichTextEditor.onImageUpload`).
- **Veřejné bio** — krátký text; rozsáhlou editaci řeší detail.

Submit → `useCreateCharacter` → `POST /worlds/:worldId/characters`. Po úspěchu:
toast „Postava vytvořena", invalidace directory + členů, **navigace na detail**
nové postavy.

⚠️ Kaskáda subdokumentů běží na BE po `character.created`. Pokud GET subdokumentu na
detailu vrátí 404 dřív, než kaskáda doběhne — ošetřit refetch/retry. Sync/async
chování BE emitu ověřit v impl. plánu (riziko R-1).

### 4.4 Mazání postavy

- Tlačítko „Smazat postavu" v `CharacterHeader` — jen PJ(5)+.
- `ConfirmDialog` (`confirmVariant="danger"`): „Smazat postavu \<jméno\>? Smažou se
  i deník, finance, výbava, poznámky a kalendář. Akci nelze vrátit."
- `useDeleteCharacter` → `DELETE /worlds/:worldId/characters/:slug`.
- Po úspěchu: toast, invalidace directory + členů, **navigace na adresář** `/postavy`.

### 4.5 Convert PC ↔ NPC

- V `CharacterHeader`, jen PJ(5)+, **skryté pro `isLocation`** (BE convert Lokaci
  nepodporuje).
- **PC → NPC:** tlačítko „Převést na NPC" → `ConfirmDialog` („Finance a výbava se
  skryjí."). `useConvertCharacter` s prázdným tělem (`{}`).
- **NPC → PC:** tlačítko „Převést na PC" → modal s výběrem hráče (sdílí member-select
  z §4.3). `useConvertCharacter` s `{ userId }`.
- BE skrytí/odkrytí financí + výbavy (`isHidden`) řeší event `character.converted` —
  FE po convertu invaliduje detail + všechny subdoc query + directory.

### 4.6 Přiřazení postavy hráči

- V `MemberRow`: u každého člena ovládání „Postava" — výběr postavy / „— žádná —" /
  „Vytvořit postavu" (otevře `CreateCharacterModal`, typ PC, hráč předvyplněn).
- Select nabízí **PC postavy světa** (`useCharacterDirectory`, filtr na PC).
- Změna → `PATCH /worlds/:worldId/members/:membershipId/character` s `characterPath`
  (slug postavy) nebo prázdné = odpojit.
- Gating FE: PomocnyPJ(4)+ nebo úprava sebe sama (zrcadlí BE).
- Po úspěchu: toast, invalidace členů.

> Slot postavy ve `WorldContext` (čtení vlastní postavy přihlášeným hráčem) **dotahuje
> krok 8.3** — 8.2 jen zapisuje `characterPath`.

### 4.7 Oprávnění (FE gating)

`canManageCharacters = userRole >= WorldRole.PJ` — tvorba, mazání, convert.
`canAssignCharacter = userRole >= WorldRole.PomocnyPJ || isSelf` — přiřazení.
Adresář vidí každý člen (Čtenář+). FE gating je jen UX (skrývá tlačítka); autorita
zůstává na BE.

### 4.8 Nové / dotčené soubory (FE)

```
src/features/world/pages/api/
  useCharacterMutations.ts      # ROZŠÍŘIT: useCreateCharacter, useDeleteCharacter,
                                #           useConvertCharacter
  useCharacterDirectory.ts      # NOVÝ: GET .../characters/directory
src/features/world/api/
  useUpdateMemberCharacter.ts   # NOVÝ: PATCH .../members/:id/character
src/features/world/pages/CharactersPage/        # NOVÁ složka (ze stubu)
  CharactersPage.tsx            # routing layer
  CharacterDirectory.tsx        # presenter — sekce + filtr
  components/
    CharacterCard.tsx           # karta postavy
    CreateCharacterModal.tsx    # formulář tvorby postavy
src/features/world/pages/CharacterDetailPage/components/
  (CharacterHeader.tsx)         # DOTČENÝ: akce Převést / Smazat
  ConvertToPcModal.tsx          # NOVÝ: výběr hráče pro NPC → PC
src/features/world/pages/WorldSettingsPage/components/
  (MemberRow.tsx)               # DOTČENÝ: výběr postavy + „Vytvořit postavu"
```

Přesná struktura (sdílení `CreateCharacterModal` mezi adresářem a `MemberRow`,
rozdělení `CharacterHeader`) — doladí impl. plán.

### 4.9 BE úprava — kaskádní mazání (N-2)

Soubor `backend/src/modules/characters/characters.service.ts` (`delete`) +
`character-subdocs.service.ts`:

1. `delete()` emituje event `character.deleted` (`{ characterId, worldId, slug }`).
2. `CharacterSubdocsService` přidá handler `onCharacterDeleted` — smaže všech 5
   subdoc kolekcí dle `characterId`.
3. Vyčistit `membership.characterPath` u všech členů světa, kteří mazanou postavu
   měli přiřazenou (handler v `worlds` modulu, nebo přímé volání ze service).

Požadavek: po smazání postavy **nesmí zůstat** osiřelé subdokumenty ani
`characterPath` ukazující na neexistující postavu. Konkrétní mechanika (event vs.
přímé volání, který modul) — na impl. plánu.

> Cross-repo: před BE commitem `prettier --write` (jinak husky hook selže).

## 5. Mimo rozsah

| Položka | Patří do |
|---|---|
| `/moje-postava`, slot postavy ve `WorldContext` | krok 8.3 |
| Adresář — fulltext hledání, oblíbené, seskupení dle herních skupin | krok 8.3 |
| NPC šablony, bestiář, NPC adresář | krok 8.4 |
| Editor schématu deníku | krok 8.5 |
| Žádost hráče o vytvoření PC (request flow + BE endpoint) — N-4 | odloženo |
| Convert pro typ Lokace (BE nepodporuje) | — |
| Optimistic-concurrency token (N-2 ze spec-8.1, BE bez `updatedAt`) | dluh D-073 |

## 6. Akceptační kritéria

- [ ] `/postavy` zobrazí adresář — karty ve 3 sekcích (PC / NPC / Lokace), filtr typu, proklik na detail.
- [ ] Adresář je member-facing (Čtenář+ vidí); tlačítko „Nová postava" jen PJ.
- [ ] `CreateCharacterModal`: vytvoření PC / NPC / Lokace; správné mapování `isNpc`/`isLocation`/`userId`.
- [ ] Slug se generuje z jména, je přepisovatelný; kolize slugu → inline chyba.
- [ ] U člena bez postavy je v `MemberRow` volba „Vytvořit postavu" (typ PC, hráč předvyplněn).
- [ ] Po vytvoření: toast + navigace na detail; subdokumenty se dotáhnou (kaskáda).
- [ ] `MemberRow`: přiřazení / odpojení postavy hráči; uloží `PATCH .../members/:id/character`.
- [ ] `CharacterHeader`: PJ může postavu smazat (ConfirmDialog) — navigace na adresář.
- [ ] `CharacterHeader`: convert PC ↔ NPC; NPC → PC vyžaduje výběr hráče; skryté pro Lokaci.
- [ ] BE: `DELETE` postavy smaže subdokumenty a vyčistí `characterPath` u členů (N-2).
- [ ] `mobil-desktop` audit — adresář, modaly i akce funkční na mobilu i desktopu.
- [ ] Roadmap upravena (adresář 8.3→8.2, zúžení 8.3, ř. 1305), `napoveda` aktualizována.

## 7. Test plán

- **Unit/component:** `CharacterDirectory` (sekce, filtr, prázdný stav), `CharacterCard`,
  `CreateCharacterModal` (3 typy, slugify, kolize slugu),
  `useCreateCharacter`/`useDeleteCharacter`/`useConvertCharacter` (mapování + invalidace),
  convert/delete v `CharacterHeader`, přiřazení v `MemberRow`, gating dle role.
- **BE:** test handleru `character.deleted` — smazání všech 5 subdoc kolekcí + vyčištění `characterPath`.
- **Smoke (skill `verify`):** vytvořit PC/NPC/Lokaci z adresáře, ověřit kaskádu na detailu;
  convert tam i zpět; smazat postavu; přiřadit/odpojit hráči.
- **Responsive:** skill `mobil-desktop` po dokončení UI.

## 8. Riziko & rollback

| # | Riziko | Mitigace |
|---|---|---|
| R-1 | Kaskáda subdokumentů na BE doběhne až po navigaci na detail → GET subdoc 404 | Ověřit sync/async emit v impl. plánu; FE refetch / retry na 404 |
| R-2 | Slug kolize odhalena až po submitu | Ošetřit `CHARACTER_SLUG_TAKEN` → inline chyba, modal zůstane otevřený |
| R-3 | Convert NPC → PC bez výběru hráče | Tlačítko submitu `disabled` dokud hráč nevybrán |
| R-4 | BE handler `character.deleted` mine některé subdoc kolekce | Test §7 pokrývá všech 5 kolekcí + `characterPath` |
| R-5 | Souběžná editace (N-2 ze spec-8.1) | Mimo rozsah — dluh D-073 |

**Rollback:** vlna je aditivní (nová stránka, nové hooky/komponenty, dotčené soubory
rozšířené o akce). BE změna kaskádního mazání je čistě nápravná. Revert commitů vlny
vrací stav po 8.1 (adresář zpět na stub).

## 9. Schválená rozhodnutí (2026-05-22)

| # | Rozhodnutí |
|---|---|
| Rozsah | Jádro adresáře postav přesunuto z 8.3 do 8.2 + tvorba / mazání / convert / přiřazení. |
| Vstupní body | Tvorba z adresáře (a z `MemberRow` pro PC); convert + delete z `CharacterHeader`; přiřazení z `MemberRow`. |
| N-1 (Lokace) | Přijmout BE stav — Lokace dostane jen kalendář. Opravit roadmap ř. 1305. |
| N-2 (delete) | Opravit BE v rámci 8.2 — kaskádní mazání subdokumentů + čištění `characterPath`. |
| N-4 (žádost) | Mimo rozsah — postavu zakládá jen PJ. |

---

**Stav workflow:** **návrh** — čeká na schválení uživatelem. Po schválení následuje
`frontend-design` audit (adresář + modaly tvorby/convertu) → implementační plán →
potvrzení → kód.
