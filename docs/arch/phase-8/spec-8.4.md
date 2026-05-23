# Spec 8.4 — NPC šablony + bestiář (`/svet/:worldId/admin/adresar-postav`)

**Stav:** ✅ schváleno 2026-05-23 (vč. EXTENDED rozšíření z §13 — všechny dluhy do scope)
**Datum:** 2026-05-23
**Závisí na:** 8.2 (CreateCharacterModal — kanonická cesta tvorby NPC postavy), `useUploadContentImage` (8.x — existuje), BE modul `npc-templates` (kompletní).

---

## 1. Cíl

PJ správa **knihovny NPC šablon** světa + sdíleného globálního **bestiáře**. Stránka `NPCDirectoryPage` (dnes stub) přestane být placeholder a začne plně sloužit jako:

1. **Mé šablony světa** — CRUD vlastních šablon (jméno, obrázek, staty, schopnosti, poznámky).
2. **Globální bestiář** — read-only seznam globálních šablon + jednoklik **„Importovat do světa"** (= zkopíruje šablonu z globálu pod aktuální `worldId` s `originTemplateId` na zdroj).
3. **BE fixy 8.4-BE-1 / 8.4-BE-2** uvnitř téhož kroku.

**Mimo cíl** (rozhraní pro budoucí kroky):
- **Vytvoření NPC `Character` postavy ze šablony** — tato akce **se v 8.4 nebuduje**. NPC postavy ve světě vznikají přes stávající [`CreateCharacterModal`](src/features/world/pages/CharactersPage/components/CreateCharacterModal.tsx) na `/postavy` (`isNpc=true`). Šablona je dnes „knihovna statů". Faktické instancování NPC = krok **10.2d** (tokeny na mapě), tam dostane smysl.
- **Editor `diarySchema` / `diaryData`** — pole na šabloně existují, ale jejich UI editor je explicitně **krok 8.5**. V 8.4 šablony tato pole drží jako prázdné defaulty (`[]` / `{}`). UI je nezobrazuje.
- Soft-delete šablony (BE má jen hard `DELETE`). Šablony se mažou natvrdo s `confirm()` dialogem; obnova není podporována. (Sjednoceno s 8.x charactery.)

---

## 2. Sub-úkol A — BE fixy uvnitř 8.4

### 2.1 8.4-BE-1: `movement` + `initiativeBase` v DTO

Schéma [npc-template.schema.ts:18-19](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/npc-templates/schemas/npc-template.schema.ts#L18-L19) a interface [npc-template.interface.ts:15-16](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/npc-templates/interfaces/npc-template.interface.ts#L15-L16) tato pole má, ale [CreateNpcTemplateDto](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/npc-templates/dto/create-npc-template.dto.ts) a [UpdateNpcTemplateDto](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/npc-templates/dto/update-npc-template.dto.ts) je **vůbec neobsahují**, controller [npc-templates.controller.ts:86-94](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/npc-templates/npc-templates.controller.ts#L86-L94) je v `update` payloadu vynechává. Roadmapa 8.4 oba zmiňuje.

**Změna:**

- `CreateNpcTemplateDto`, `UpdateNpcTemplateDto` doplnit:
  ```ts
  @IsOptional() @IsNumber() @Min(0) movement?: number;
  @IsOptional() @IsNumber() @Min(0) initiativeBase?: number;
  ```
- `NpcTemplatesController.update`: do explicitního mapování doplnit obě pole.
- Service `create` / `importToWorld` už defaulty na schématu má (`5` / `0`) — beze změny.

### 2.2 8.4-BE-2: Import jen z globálu

[npc-templates.service.ts:120-145](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/npc-templates/npc-templates.service.ts#L120-L145) — `importToWorld` načte šablonu jen podle `templateId` a slepě ji zkopíruje. **PJ světa A si tak může přes URL trik importovat šablonu z cizího světa B** (BE únik obsahu napříč světy).

**Změna:**

```ts
const tpl = await this.repo.findById(templateId);
if (!tpl)
  throw new NotFoundException({ code: 'GLOBAL_NPC_TEMPLATE_NOT_FOUND', message: 'Globální šablona nenalezena' });
if (tpl.worldId !== null)
  throw new ForbiddenException({ code: 'NPC_TEMPLATE_NOT_GLOBAL', message: 'Importovat lze jen globální šablonu' });
```

### 2.3 BE testy

`npc-templates.service.spec.ts` (existuje):
- ✅ `importToWorld` se zdrojem `worldId === null` → vytvoří kopii s `originTemplateId`.
- ✅ `importToWorld` se zdrojem `worldId === 'some-other-world'` → **`ForbiddenException` + kód `NPC_TEMPLATE_NOT_GLOBAL`**.
- ✅ `create` / `update` s `movement`, `initiativeBase` → uloženo a vráceno.
- ✅ `update` bez `movement` / `initiativeBase` → původní hodnoty zachované (existující test rozšířit).

---

## 3. Sub-úkol B — FE typy + API hooks

### 3.1 Typy

Vytvořit `src/features/world/pages/NPCDirectoryPage/api/npcTemplates.types.ts`:

```ts
export interface NpcAbility { label: string; value: string }

export interface NpcTemplate {
  id: string;
  worldId: string | null;          // null = globální (bestiář)
  originTemplateId?: string;       // pokud světová kopie globálu
  name: string;
  imageUrl?: string;
  notes: string;
  maxHp: number;
  armor: number;
  injury: number;
  movement: number;
  initiativeBase: number;
  abilities: NpcAbility[];
  // 8.5 (nezobrazuje 8.4 UI):
  diarySchema: unknown[];
  diaryData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NpcTemplateInput {
  name: string;
  imageUrl?: string;
  notes?: string;
  maxHp?: number;
  armor?: number;
  injury?: number;
  movement?: number;
  initiativeBase?: number;
  abilities?: NpcAbility[];
}
```

### 3.2 Hooks

`src/features/world/pages/NPCDirectoryPage/api/`:

| Hook | Endpoint | Klíč query/mutate | Invalidace |
|------|----------|-------------------|------------|
| `useNpcTemplates(worldId)` | `GET /worlds/:worldId/npc-templates` | `['npc-templates', worldId]` | — |
| `useGlobalNpcTemplates()` | `GET /worlds/:worldId/npc-templates/global`<sup>†</sup> | `['npc-templates', 'global']` | — |
| `useCreateNpcTemplate(worldId)` | `POST /worlds/:worldId/npc-templates` | — | `['npc-templates', worldId]` |
| `useUpdateNpcTemplate(worldId)` | `PUT /worlds/:worldId/npc-templates/:id` | — | `['npc-templates', worldId]` |
| `useDeleteNpcTemplate(worldId)` | `DELETE /worlds/:worldId/npc-templates/:id` | — | `['npc-templates', worldId]` |
| `useImportNpcTemplate(worldId)` | `POST /worlds/:worldId/npc-templates/:id/import` | — | `['npc-templates', worldId]` |

<sup>†</sup> Route je sice pod `:worldId`, ale data jsou globální (`worldId=null`). `worldId` v cestě je jen pro auth guard (JWT). FE klíč `['npc-templates', 'global']` proto **neobsahuje** `worldId` — výsledek je sdílený napříč světy, vyhneme se duplicitnímu fetchování při skoku PJ mezi světy.

### 3.3 Validace

Vstup do `useCreateNpcTemplate` / `useUpdateNpcTemplate`:
- `name` trim → pokud prázdný, mutation se nevolá (UI submit disabled).
- Číselné staty: `Math.max(0, Math.floor(value))`. Nulové defaulty z BE schématu (`maxHp=5, movement=5`).
- `abilities`: vyfiltrovat páry s prázdným `label` AND `value`.

---

## 4. Sub-úkol C — UI: `NPCDirectoryPage`

### 4.1 Layout

Cesta: [src/features/world/pages/NPCDirectoryPage.tsx](src/features/world/pages/NPCDirectoryPage.tsx) → přesun do **složky** `NPCDirectoryPage/` s `index.ts` (re-export), `NPCDirectoryPage.tsx`, `NPCDirectoryPage.module.css`, `components/`, `api/`, `__tests__/`.

```
┌────────────────────────────────────────────────────────────┐
│  ← Šablony NPC                          [ + Nová šablona ] │
│                                                             │
│  [ Mé šablony (4) ] [ Globální bestiář (17) ]              │
│                                                             │
│  🔍 Hledat šablonu…                                         │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ avatar │ │ avatar │ │ avatar │ │ avatar │               │
│  │ Goblin │ │ Skřet  │ │ Drak   │ │ Hlídač │               │
│  │ ❤12 🛡2│ │ ❤8  🛡0│ │ ❤80🛡6 │ │ ❤25🛡4 │               │
│  │ [✏][🗑]│ │ [✏][🗑]│ │ [✏][🗑]│ │ [✏][🗑]│               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
└────────────────────────────────────────────────────────────┘
```

Na záložce **Globální bestiář** karty místo `[✏][🗑]` mají `[↓ Importovat do světa]`. Pokud už šablona byla do tohoto světa importována (najdeme podle `world.originTemplateId === global.id` — viz §4.4), tlačítko se přepne na zašedlý chip „✓ Importováno" + odkaz na world kopii (scroll na kartu v záložce „Mé šablony").

### 4.2 Stavy stránky

- **Loading** (oba seznamy): grid skeleton 8 placeholder karet.
- **Error** (oba seznamy nezávisle): inline error karta s `parseApiError` + retry button.
- **Empty „Mé šablony"**: ilustrační karta s textem „Tento svět zatím nemá vlastní NPC šablony. Vytvoř novou, nebo si importuj něco z bestiáře." + dvě CTA „Nová šablona" / „Otevřít bestiář" (přepne tab).
- **Empty „Globální bestiář"**: „Bestiář je zatím prázdný." (text-only.)
- **Search bez výsledků**: „Žádná šablona neodpovídá hledání." + „Vymazat filtr".

### 4.3 Hledání

In-memory filter na klientovi, žádný debounce. Stejná `normalize()` strategie jako [CharactersPage/utils/normalize.ts](src/features/world/pages/CharactersPage/utils/normalize.ts) (NFD + diacritic strip).

Hledá v: `name` + `notes` (prefix `notes` na 100 znaků).

URL state: `?tab=mine|global&q=<search>` (`replace: true`).

### 4.4 Identifikace „už importováno"

`worldTemplates` (Mé šablony) má `originTemplateId?: string`. Při renderu **Bestiáře** sestavíme `Set<string>` z `worldTemplates.map(t => t.originTemplateId).filter(Boolean)` a karta z bestiáře zjistí podle vlastního `id`, jestli je `Set.has(id)`. Pokud ano → „✓ Importováno" stav (viz §4.1).

### 4.5 Karta `NpcTemplateCard`

`components/NpcTemplateCard.tsx`. Reuse výtvarného jazyka z [CharacterCard](src/features/world/pages/CharactersPage/components/CharacterCard.tsx) (rámeček, avatar kruh, hover lift), **ale**:

- Místo `playerName` řádku → řádek stat ikon: `❤️ {maxHp} 🛡️ {armor} 🦶 {movement} ⚡ {initiativeBase}` (lucide ikony: `Heart, Shield, Footprints, Zap`).
- Pod ikonami: max 3 abilities jako mikro-pills + „+N…" overflow chip. (Kompletní seznam až v edit modalu.)
- Footer karty: action row (varies per tab — viz §4.1).
- Karta v Bestiáři je **read-only**: avatar bez ✏️ overlay, ale na hover má jemný overlay s „↓ Importovat".
- Karta v Mé šablony: click na avatar/název otevře **edit modal**, ne navigaci (šablona nemá vlastní route — záměrně, není to entita pro hráče).

### 4.6 Mobile

- Tab pills zůstávají (touch target ≥ 40px).
- Grid karet `repeat(auto-fill, minmax(160px, 1fr))` (≤ 768px) / `minmax(220px, 1fr)` (> 768px). `mobil-desktop` audit po implementaci.
- „+ Nová šablona" — na mobilu jen ikona `+`, label v `aria-label`.

---

## 5. Sub-úkol D — `NpcTemplateModal` (create / edit)

`components/NpcTemplateModal.tsx`. Sdílí kód create/edit, prop `mode: 'create' | 'edit'`.

### 5.1 Pole formuláře

| Pole | Typ | Default | Validace |
|------|-----|---------|----------|
| Jméno | `Input` | — | trim required |
| Avatar | `useUploadContentImage` flow (reuse z CreateCharacterModal) | `imageUrl?` | žádná |
| maxHp | `Input type=number` | 5 | ≥ 0, integer |
| armor | num | 0 | ≥ 0, integer |
| injury | num | 0 | ≥ 0, integer |
| movement | num | 5 | ≥ 0, integer |
| initiativeBase | num | 0 | ≥ 0, integer |
| Schopnosti | dynamický seznam `{ label, value }` | `[]` | viz §5.2 |
| Poznámky | textarea (rows=4) | `''` | žádná |

**Layout:** Modal velikost `lg`. Avatar + jméno nahoře (vedle sebe na desktopu, pod sebou na mobile). Pak grid 2×3 s číselnými staty (HP / Zbroj / Zranění / Pohyb / Iniciativa). Pod tím sekce „Schopnosti", pod tím poznámky.

`diarySchema` / `diaryData` se **nezobrazují** (8.5).

### 5.2 Schopnosti — dynamický editor

Seznam řádků `[label input | value input | ✕ smazat]`, pod ním tlačítko `+ Přidat schopnost`. Žádné drag-reorder (out of scope).

- Při submitu se filtrují prázdné páry (`label === '' && value === ''`).
- Pár s vyplněným jen jedním ze sloupců se odešle (BE má jen string validaci na obou — povolíme).
- Max 50 položek (UI hard cap; reálně NPC mívá ≤ 10).

### 5.3 Submit chování

- **Create:** úspěch → toast `Šablona vytvořena` → close modal.
- **Edit:** úspěch → toast `Šablona uložena` → close modal.
- Optimistický update? **Ne** — invalidate `['npc-templates', worldId]` a refetch. Stránka má desítky karet, fetch je levný.
- Chyba: `toast.error(parseApiError(err))`. Modal zůstane otevřený, focus na první invalid pole.

### 5.4 Smazání

Z karty Mé šablony tlačítko 🗑 → nativní `confirm('Smazat šablonu "X"? Tato akce je nevratná.')` (sjednoceno s patternem CharacterDetailPage). Při OK volá `useDeleteNpcTemplate`.

Toast: `Šablona smazána` / `parseApiError`.

---

## 6. Sub-úkol E — Import z bestiáře

`components/ImportConfirmModal.tsx` — lehký dialog, ne plnotučný modal.

Trigger: button „↓ Importovat do světa" na kartě v bestiáři → otevře confirm modal:

```
Importovat „Goblin" do tohoto světa?

Šablona se zkopíruje pod aktuální svět. Po importu ji budeš
moct upravovat nezávisle na originálu.

[ Zrušit ]                                  [ ↓ Importovat ]
```

Po úspěšném `POST /:id/import`:
- Invalidate `['npc-templates', worldId]`.
- Toast `Šablona importována`.
- Modal zavřít.
- **UX bonus:** přepnout tab na „Mé šablony" a scroll na nově vytvořenou kartu (`element.scrollIntoView`). Pokud roste UX složitost, odložit (low value).

---

## 7. Routing + Guards

Route `/svet/:worldSlug/admin/adresar-postav` v [src/app/router.tsx:263-273](src/app/router.tsx#L263-L273) **už existuje** s `WorldMembershipGuard minWorldRole=PJ + fallbackGlobalRoles=[Sa, Admin]`. Beze změny.

`NPCDirectoryPage` lazy import beze změny — jen ukáže na novou složku přes `index.ts`.

`WorldStubPage` import v `NPCDirectoryPage.tsx` se odstraní. (Pozn.: ⚠️ `WorldStubPage` ještě používají další stub stránky — kontrola, ale neřešíme v 8.4.)

---

## 8. Mobile / Desktop

`mobil-desktop` skill po implementaci se zaměřením na:

- Grid karet — minmax breakpointy (§4.6).
- Tab pills wrap na mobilu, nepřeplňovat horizontální scroll.
- `NpcTemplateModal` na ≤ 768 px → full-screen (modal size `md` se v `Modal` shared UI komponentě automaticky overruje? — pokud ne, propsem `size="lg"` + CSS override pro `@media (max-width: 768px)`).
- Stat grid 2×3 → 1×6 stack na mobilu.
- Schopnosti řádek — label + value vedle sebe na desktopu, pod sebou na mobile (s ✕ button vždy vpravo).

---

## 9. Testy

**FE komponenty / hooky:**

| Soubor | Případy |
|--------|---------|
| `useNpcTemplates.spec.ts` | fetch worldových šablon; cache klíč |
| `useGlobalNpcTemplates.spec.ts` | fetch globálních; sdílený klíč napříč světy |
| `useCreateNpcTemplate.spec.ts` | success + invalidace; chyba |
| `useImportNpcTemplate.spec.ts` | success + invalidace; chyba `NPC_TEMPLATE_NOT_GLOBAL` |
| `NPCDirectoryPage.spec.tsx` | tab přepínač (URL `?tab=`), search filtr, „Importováno" badge, empty state |
| `NpcTemplateCard.spec.tsx` | render statů, abilities overflow, click → modal (mock) |
| `NpcTemplateModal.spec.tsx` | create flow, edit flow, abilities add/remove, prázdné páry filtered, validace záporných čísel |
| `ImportConfirmModal.spec.tsx` | confirm → mutace volána, cancel → ne |

**BE:** viz §2.3.

---

## 10. Otevřené body / rozhodnutí pro schválení

Defaulty vybrané v Auto Mode:

- **D1:** „Mé šablony" + „Globální bestiář" jako **dva taby** na jedné stránce (ne dva odkazy). Pokud chceš oddělit, můžu udělat dvě podstránky `/admin/adresar-postav` a `/admin/bestiar` — odhad +0.5h.
- **D2:** Šablona **nemá vlastní detail route** (`/sablona/:id`). Edit je modal. Důvod: šablona není veřejná entita pro hráče. Pokud chceš detail page (hlubší editace, share link), out of scope.
- **D3:** Smazání = `confirm()` (native). Modal `ConfirmDialog` shared UI komponenta neexistuje (ověř, pokud ano použijeme). Pokud existuje shared confirm dialog, použijeme ho místo nativního.
- **D4:** „Import už importováno" detekce přes `originTemplateId` (§4.4). Šablona z bestiáře je „importována" jen pokud byla naimportována přes `POST /:id/import` (BE ji zapíše). Ručně vytvořená duplicita beze stejného `originTemplateId` se jako „importováno" nezobrazí — záměr.
- **D5:** Karta v Bestiáři je **read-only**, žádný „náhled detailu" modal. Avatar + jméno + staty + abilities pills viditelně, full notes ne. Pokud PJ chce vidět notes před importem → můžeme přidat „náhled" modal (out of scope, ale snadno doplnitelné).
- **D6:** Validace dolní mez statů `0`. Horní mez **bez limitu** (boss může mít HP 9999). Step `1`, integer.
- **D7:** Pořadí karet — výchozí `updatedAt DESC` (nejnovější nahoře). Ne `name ASC` — víc reflektuje workflow PJ (právě upravená šablona je „aktivní"). Pokud chceš `name` ASC, řekni.
- **D8:** Reuse `useUploadContentImage` (existuje v `features/ikaros/api/`) — stejný flow jako `CreateCharacterModal`. Není to ideální architecturně (`ikaros` namespace pro world feature), ale rip-out v rámci 8.4 není vhodné. Možný dluh.

---

## 11. Tracked dluhy (po implementaci → `dluh.md`)

- **D-NPC-1:** `useUploadContentImage` přesunout z `features/ikaros/` do `shared/api/` nebo `features/media/` — sdílený across features.
- **D-NPC-2:** Drag & drop pořadí abilities v edit modalu (low priority, UX nice-to-have).
- **D-NPC-3:** Náhled globální šablony před importem (modal s full notes + abilities listem).
- **D-NPC-4:** Soft-delete šablon (BE má jen hard DELETE). Souvisí s šablonami napříč mapami — pokud token referuje smazanou šablonu, co se stane? (řeší 10.2d.)
- **D-NPC-5:** Globální admin (Sa/Admin) UI pro **přidávání do globálního bestiáře** — dnes BE `POST` validuje jen `worldId` z URL, nelze vytvořit globální šablonu (`worldId=null`) přes existující controller. Out of scope, ale je to dluh — globální bestiář dnes nelze nijak naplnit z FE.

---

## 12. EXTENDED scope — všechny dluhy uvnitř 8.4

Po schválení uživatelem **„všechny dluhy vyřeš a vše zpracuj"** se původní seznam tracked dluhů (§11) přesouvá do core scope. Tato sekce specifikuje jak.

### 12.1 D-NPC-1: `useUploadContentImage` → `shared/api/useUploadImage`

**Problém:** Hook leží v `features/ikaros/api/useUploadContentImage.ts`, ale konzumují ho **12 souborů napříč features** (`world/CharactersPage`, `world/PageEditor`, `world/chat`, `world/WorldSettingsPage`, `ikaros/ArticleEditorPage`). Závislost `features/world → features/ikaros` je špatný směr (world se má opírat o shared, ne o jiné feature).

**Řešení:**
1. Vytvořit `src/shared/api/useUploadImage.ts` — totožné API, jen v novém umístění + export typu `UploadImageResult`.
2. Reexport ze `src/shared/api/index.ts` (vytvořit, dnes je tam jen `client.ts`).
3. Update 12 konzumentů — import `from '@/shared/api'` místo `from '@/features/ikaros/api/useUploadContentImage'`.
4. Smazat starý `features/ikaros/api/useUploadContentImage.ts`.
5. Update testů (`HeroUploadCard.spec.tsx`, `CreateCharacterModal.spec.tsx` — vi mockují import path).

**Risk:** Mockované importy v testech. Před smazáním grep `useUploadContentImage` v `__mocks__` i `vi.mock(...)` callech. Pokud nějaký test mockuje starou path, refaktor i ten.

### 12.2 D-NPC-2: Drag & drop pořadí abilities

**Implementace bez nové dep:** HTML5 native drag & drop na řádcích editoru schopností v `NpcTemplateModal`. Důvod: do projektu netáhnout `@dnd-kit` jen kvůli ≤ 10 řádkům.

API řádku:
```tsx
<div
  draggable
  onDragStart={(e) => { e.dataTransfer.setData('text/idx', String(idx)); }}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    const from = Number(e.dataTransfer.getData('text/idx'));
    moveAbility(from, idx);
  }}
>
  <GripVertical aria-label="Přetáhnout" /> [label input] [value input] [✕]
</div>
```

- Vizuál: `cursor: grab` na drag handle, `outline` na hover, `opacity: 0.5` na drag source (přes `:active` + `aria-grabbed`).
- Klávesnice: `ArrowUp` / `ArrowDown` se zaktivním řádkem (focus na grip handle) přesouvá pořadí. Dostupné bez myši.
- Žádná drop indikátor čára — overkill pro krátký seznam.

### 12.3 D-NPC-3: Náhled globální šablony před importem

`PreviewTemplateModal` (read-only): otevírá se kliknutím na **kartu v bestiáři** (mimo Import tlačítko). Obsahuje:

- Velký avatar + jméno.
- Plný stat grid (HP, Zbroj, Zranění, Pohyb, Iniciativa).
- Kompletní seznam abilities (label/value list, ne pills).
- Plné notes (markdown? Ne, plain text — schéma to drží jako `string`).
- Footer: `[ Zavřít ]  [ ↓ Importovat ]`.

Modal je **read-only** — žádný edit z náhledu globálu (globál upravit může jen Sa/Admin přes 12.5, ne PJ).

### 12.4 D-NPC-4: Soft-delete šablon + restore

**BE:**

1. Schéma `NpcTemplate` přidat `@Prop({ type: Date, default: null }) deletedAt: Date | null;`.
2. Interface `NpcTemplate` přidat `deletedAt: Date | null`.
3. Repository:
   - `findByWorld(worldId)` → filter `deletedAt: null`.
   - `findGlobal()` → filter `deletedAt: null`.
   - Nová metoda `findDeletedByWorld(worldId): Promise<NpcTemplate[]>` → filter `deletedAt: { $ne: null }`.
   - `findById(id)` → **bez** filtru `deletedAt` (kvůli restore endpointu).
4. Service:
   - `remove(id, worldId)` → změnit z hard `deleteByIdAndWorld` na `updateByIdAndWorld(id, worldId, { deletedAt: new Date() })`.
   - Nová `restore(id, worldId)` → `updateByIdAndWorld(id, worldId, { deletedAt: null })`. NotFound pokud entity neexistuje nebo `deletedAt === null`.
   - Nová `hardRemove(id, worldId)` → trvalé smazání. Volá se z koše explicitně (PJ může „smazat trvale" smazanou šablonu).
   - `findDeleted(worldId)` → repo `findDeletedByWorld`.
5. Controller:
   - `DELETE /:id` → volá `remove` (soft).
   - `GET /trash` → vrací `findDeleted(worldId)` (PJ+).
   - `POST /:id/restore` → volá `restore`.
   - `DELETE /:id/hard` → volá `hardRemove`.
6. Auth: všechny tyto cesty pod `assertCanManage` (PJ+).

**FE:**

- Třetí tab `Koš (N)` v `NPCDirectoryPage` (badge počtu smazaných). Skryt, pokud `N === 0`.
- Karta v koši má disabled-look (opacity 0.6), zobrazuje datum smazání (relativní), tlačítka `[ ↶ Obnovit ]` + `[ ⨯ Smazat trvale ]`.
- „Smazat trvale" → `ConfirmDialog danger`: „Tato akce je nevratná. Šablona se smaže navždy." Confirm volá `DELETE /:id/hard`.
- Hooks: `useDeletedNpcTemplates(worldId)`, `useRestoreNpcTemplate(worldId)`, `useHardDeleteNpcTemplate(worldId)`.

### 12.5 D-NPC-5: Sa/Admin UI pro globální bestiář

**Problém:** BE controller routy jsou pod `:worldId`, takže globální šablony (`worldId=null`) nelze vytvořit přes existující `POST`. Globální bestiář dnes lze naplnit jen ručním DB zásahem.

**BE řešení — nový controller** `src/modules/npc-templates/admin-npc-templates.controller.ts`:

```ts
@Controller('admin/npc-templates')
@UseGuards(JwtAuthGuard, GlobalRoleGuard)
@MinRole(UserRole.Admin)
export class AdminNpcTemplatesController {
  @Get() findAllGlobal()                 // = service.findGlobal()
  @Get(':id') findOne(id)                // bez worldId filtru, jen worldId === null
  @Post() create(dto)                    // worldId: null
  @Put(':id') update(id, dto)
  @Delete(':id') remove(id)              // soft-delete i tady
  @Post(':id/restore') restore(id)
}
```

`GlobalRoleGuard` + `MinRole(UserRole.Admin)`: pokud neexistuje, vytvořit (vzor: existující guardy na admin moduly).

Service rozšíření:
- `createGlobal(dto)`, `updateGlobal(id, dto)`, `removeGlobal(id)`, `restoreGlobal(id)` — všechny operují s `worldId === null` constraint.

**FE řešení — nová stránka `/ikaros/administrace/npc-bestiar`:**

- Route přidat do `router.tsx` pod existující ADMINISTRACE sekci.
- Guard: globální `Sa/Admin` (`PrivateRoute minRole={UserRole.Admin}`).
- Layout: stejný jako `NPCDirectoryPage` ale **jen jeden tab** (globální).
- Tlačítko `[ + Nová globální šablona ]` otevírá `NpcTemplateModal` (sdílená komponenta, mode='create-global').
- Karta v adminu má `[ ✏️ Upravit ]  [ 🗑 Smazat ]` (soft-delete + koš funguje stejně).

**Sdílené komponenty:** `NpcTemplateModal` přijímá `mode: 'world-create' | 'world-edit' | 'global-create' | 'global-edit'` a mutaci dostane jako prop. Card má varianta `world` / `global` / `bestiary-readonly`.

### 12.6 Pořadí implementace s rozšířeným scopem

Beze změny vůči §6 plánu — D-NPC dluhy se integrují přirozeně:

1. BE 8.4-BE-1 (DTO) + 8.4-BE-2 (import guard) + 8.4-BE-3 (soft-delete) + 8.4-BE-4 (admin controller) — vše jeden commit, jeden modul.
2. FE infra: shared upload hook + typy + hooky.
3. FE UI: NPCDirectoryPage + komponenty.
4. FE admin: GlobalNpcAdminPage.
5. Audity + dokumentace.

---

## 13. Akceptační kritéria (definition of done)

- [ ] BE 8.4-BE-1 (movement/initiativeBase v DTO) — committed + testy zelené
- [ ] BE 8.4-BE-2 (import guard `worldId=null`) — committed + testy zelené
- [ ] `NPCDirectoryPage` se složkovou strukturou existuje, `WorldStubPage` z ní pryč
- [ ] Tab „Mé šablony" — list + create + edit + delete funguje E2E proti BE
- [ ] Tab „Globální bestiář" — list + import funguje E2E proti BE
- [ ] „✓ Importováno" badge identifikuje již naimportované
- [ ] `mobil-desktop` audit splněn (skill spuštěn, log v PR description)
- [ ] FE testy zelené (vit jednotlivé soubory v §9)
- [ ] `docs/roadmap-fe.md` 8.4 zaškrtnuto, `dluh.md` doplněn (§11)
- [ ] `napoveda` skill spuštěn (nová stránka pro PJ — doplnit do `/ikaros/napoveda`)
- [ ] D-NPC-1: `useUploadImage` v `shared/api`, 12 konzumentů přemigrováno, starý hook smazán
- [ ] D-NPC-2: D&D pořadí abilities funguje (myš + klávesnice)
- [ ] D-NPC-3: `PreviewTemplateModal` na klik z bestiáře
- [ ] D-NPC-4: Soft-delete + koš + restore + hard delete — BE + FE
- [ ] D-NPC-5: `AdminNpcTemplatesController` + `/ikaros/administrace/npc-bestiar` page
