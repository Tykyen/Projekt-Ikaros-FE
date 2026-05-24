# Plán 8.1-FIR — Implementace Finance / Výbava redesign + recovery

**Stav:** 📝 návrh — čeká na schválení
**Spec:** [spec-8.1-finance-inventory-recovery.md](spec-8.1-finance-inventory-recovery.md) v3
**Datum:** 2026-05-24

---

## 1. Rozsah ve dvou repech

| Repo | Změny |
|------|-------|
| **Projekt-ikaros** (BE) | Schema + interface + DTO + repo `toEntity` + service `getFinance/getInventory` lazy-create + service spec test rozšíření |
| **Projekt-ikaros-FE** | typy `characters.types.ts` + 3 komponenty (FinanceTab, InventoryTab, PostavaLayout) + CSS rewrite + `ErrorState` shared component + `mobil-desktop` audit + testy |

---

## 2. Pořadí implementace

```
A) BE: schema + interface + repo notes pole          (15 min)
B) BE: service getFinance/getInventory lazy-create   (10 min)
C) BE: service spec test rozšíření                   (15 min)
D) FE: typy (CharacterFinance/Inventory + notes)     ( 5 min)
E) FE: PostavaLayout — tab visibility + redirect     (10 min)
F) FE: ErrorState shared komponenta + scss           (15 min)
G) FE: FinanceTab — redesign view + edit             (60 min)
H) FE: InventoryTab — redesign view + edit           (60 min)
I) FE: subdocs CSS modul rewrite                     (45 min)
J) FE: aktualizace testů (FinanceTab/InventoryTab/PostavaLayout) (45 min)
K) FE: mobil-desktop audit                           (30 min)
L) Roadmapa + dluhy update                           (10 min)
```

Pozn.: časy odhad, ne závazek. Commity granulárně po krocích A–L (preference [feedback_work_on_main.md](.../memory/feedback_work_on_main.md): přímo na main, žádné feature branche).

---

## 3. BE změny detailně

### 3.1 Schema — přidat `notes` pole

**[character-finance.schema.ts](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/schemas/character-finance.schema.ts)** po řádku 21:

```ts
@Prop({ default: '' }) notes: string;
```

**[character-inventory.schema.ts](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/schemas/character-inventory.schema.ts)** po řádku 12:

```ts
@Prop({ default: '' }) notes: string;
```

📚 *Mongoose `@Prop({ default: '' })` znamená: nové dokumenty dostanou `''`, existující bez pole vrátí `undefined` z lean() — toEntity mapper si s tím poradí přes `?? ''`. Žádná migrace, žádný backfill.*

### 3.2 Interface — přidat `notes` pole

**[character-finance.interface.ts](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/interfaces/character-finance.interface.ts)** — v `CharacterFinance` přidat `notes: string;`.

**[character-inventory.interface.ts](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/interfaces/character-inventory.interface.ts)** — v `CharacterInventory` přidat `notes: string;`.

### 3.3 Repository toEntity — namapovat `notes`

**character-finance.repository.ts** v `toEntity` přidat:
```ts
notes: (doc.notes as string) ?? '',
```
A v `create()` doplnit `notes: ''` do initial dokumentu (kvůli D-073 explicit init).

**character-inventory.repository.ts** stejně. ⚠️ [feedback_chat_naming.md](.../memory/feedback_chat_naming.md) sice mluví o chat repo, ale memory [project_chat_channel_field_checklist.md](.../memory/project_chat_channel_field_checklist.md) si pamatuju, že `toEntity` mapper je častý zdroj tiché ztráty fieldu při PATCH. → pečlivě ověřit.

### 3.4 Service — lazy-create při GET pro PC

**character-subdocs.service.ts** ([service.ts:291](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/character-subdocs.service.ts#L291) `:355`):

Změna signatury `getFinance` + `getInventory` — přidat parametry `isNpc: boolean` + `kind: 'persona' | 'location'`. Controller už character drží z `assertSubdocAccess()`, takže přepošle:

```ts
async getFinance(
  characterId: string,
  isNpc: boolean,
  kind: 'persona' | 'location',
): Promise<CharacterFinance> {
  const finance = await this.financeRepo.findByCharacterId(characterId);
  if (finance) return finance;

  // NPC / Lokace tento subdoc dle 8.1 nemají vůbec.
  if (isNpc || kind === 'location') {
    throw new NotFoundException({
      code: 'FINANCE_NOT_APPLICABLE',
      message: 'Tato postava finance nemá.',
    });
  }

  // PC bez subdoku (legacy / emit failure) — lazy-create.
  return this.financeRepo.create(characterId);
}
```

Stejně `getInventory` (s `INVENTORY_NOT_APPLICABLE`).

**character-subdocs.controller.ts** ([controller.ts:141](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/character-subdocs/character-subdocs.controller.ts#L141) `:210`):

```ts
return this.subdocsService.getFinance(
  character.id,
  character.isNpc,
  character.kind,
);
```

⚠️ Ověřit, že `character` z `assertSubdocAccess()` vrací `isNpc` + `kind` — pokud ne, doplnit projekci.

### 3.5 BE testy

**character-subdocs.service.spec.ts** — přidat testy:

```
describe('getFinance lazy-create')
  • returns existing finance unchanged
  • creates fresh finance for PC without subdoc and returns it (lazy)
  • throws FINANCE_NOT_APPLICABLE for NPC
  • throws FINANCE_NOT_APPLICABLE for Location

describe('getInventory lazy-create') — stejné případy
```

Pokud existující testy volaly `getFinance(id)` s jedním parametrem, upravit volání + mocky.

---

## 4. FE změny detailně

### 4.1 Typy

**[characters.types.ts:140](src/features/world/pages/api/characters.types.ts#L140)** — `CharacterFinance` přidat `notes: string;`.
**[characters.types.ts:153](src/features/world/pages/api/characters.types.ts#L153)** — `CharacterInventory` přidat `notes: string;`.

⚠️ Dodržet [type-sync skill pravidla](.claude/skills/type-sync.md) — BE typ je zdroj pravdy, FE shape je odraz.

### 4.2 `PostavaLayout.tsx` — tab visibility + redirect

V [PostavaLayout.tsx:123-141](src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx#L123-L141):

```ts
const isCharacterPC = character && !character.isNpc && character.kind !== 'location';

const tabs: TabItem[] = [
  { id: 'profil', label: 'Profil', icon: <UserCircle size={16} /> },
  ...(character ? [{ id: 'denik', ... }] : []),
  ...(isCharacterPC ? [
    { id: 'finance', label: 'Finance', icon: <Coins size={16} /> },
    { id: 'vybava', label: 'Výbava', icon: <Backpack size={16} /> },
  ] : []),
  ...(character ? [{ id: 'kalendar', ... }] : []),
  ...(canSeePrivate && character ? [{ id: 'poznamky', ... }] : []),
];
```

A v render switchi:
```ts
{activeTab === 'finance' && isCharacterPC && <FinanceTab ... />}
{activeTab === 'vybava' && isCharacterPC && <InventoryTab ... />}
```

Plus useEffect pro deep-link redirect:
```ts
useEffect(() => {
  if ((activeTab === 'finance' || activeTab === 'vybava') && character && !isCharacterPC) {
    setActiveTab('profil');
  }
}, [activeTab, character, isCharacterPC]);
```

### 4.3 `ErrorState` shared komponenta

Nová: `src/features/world/pages/CharacterDetailPage/components/SubdocErrorState.tsx`:

```tsx
interface Props {
  error: unknown;
  resourceLabel: 'Finance' | 'Výbava';
  onRetry: () => void;
}

export function SubdocErrorState({ error, resourceLabel, onRetry }: Props) {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const code = parseApiErrorCode(error);

  if (status === 404 && (code === 'FINANCE_NOT_APPLICABLE' || code === 'INVENTORY_NOT_APPLICABLE')) {
    return <p className={s.empty}>Tato postava {resourceLabel.toLowerCase()} nemá.</p>;
  }
  if (status === 403) {
    return <p className={s.empty}>Soukromé — vidí jen PJ a vlastník.</p>;
  }
  return (
    <div className={s.errorBox}>
      <p>{resourceLabel} se nepodařilo načíst.</p>
      <button onClick={onRetry} className={s.retryBtn}>Zkusit znovu</button>
    </div>
  );
}
```

📚 *`parseApiErrorCode` (už existuje v [api/client.ts:106](src/shared/api/client.ts#L106)) parsuje doménový code z `error.response.data.error.code`. To je BE konvence z `HttpExceptionFilter`.*

### 4.4 `FinanceTab.tsx` — kompletní rewrite

Layout 2-sloupcový (main / aside).

**View (4.4a):**
```tsx
function FinanceTabView({ data, onBackToProfil }) {
  const income = data.entries.filter(e => e.amount >= 0).reduce((s, e) => s + e.amount, 0);
  const expenses = data.entries.filter(e => e.amount < 0).reduce((s, e) => s + e.amount, 0);
  return (
    <div className={s.financeShell}>
      <div className={s.financeMain}>
        <div className={s.heroCard}>
          <div className={s.heroBadges}>
            <span className={`${s.heroBadge} ${s.badgeActive}`}>Aktivní účet</span>
            <span className={s.heroBadge}>Zabezpečená relace</span>
          </div>
          <div className={s.heroBalance}>
            <span className={s.heroLabel}>Aktuální zůstatek</span>
            <span className={s.heroValue}>{fmtAmount(data.balance)} {data.currency}</span>
          </div>
          <div className={s.heroSplit}>
            <div className={`${s.splitCard} ${s.splitIncome}`}>
              <span>Příjmy</span>
              <strong>+{fmtAmount(income)} {data.currency}</strong>
            </div>
            <div className={s.splitDivider} />
            <div className={`${s.splitCard} ${s.splitExpense}`}>
              <span>Výdaje</span>
              <strong>{fmtAmount(expenses)} {data.currency}</strong>
            </div>
          </div>
        </div>

        <section className={s.section}>
          <h2 className={s.sectionTitle}>Historie transakcí</h2>
          <Transactions data={data} />
        </section>

        {data.notes?.trim() && (
          <section className={s.notesCard}>
            <h2 className={s.notesTitle}>Rozepsané</h2>
            <RichTextEditor value={data.notes} readOnly />
          </section>
        )}
      </div>

      <aside className={s.financeAside}>
        {page.imageUrl && <img src={...} className={s.asidePortrait} />}
        <h1 className={s.asideTitle}>Finance<br/><span className={s.asideName}>{page.title}</span></h1>
        <ul className={s.metaList}>
          <li><span>🛡️</span><span>Typ účtu</span><strong>{data.accountType}</strong></li>
          <li><span>🔑</span><span>Stav přístupu</span><strong>{data.accessLocation ? 'Aktivní' : 'Nenastaveno'}</strong></li>
          <li><span>💶</span><span>Měna</span><strong>{data.currency || 'Nenastavena'}</strong></li>
          <li><span>🔄</span><span>Poslední synchronizace</span><strong>{fmtDate(data.updatedAt)}</strong></li>
        </ul>
        <button className={s.disconnectBtn} onClick={onBackToProfil}>Odpojit účet</button>
      </aside>
    </div>
  );
}
```

⚠️ FinanceTab dnes nemá přístup k `page` (jen `slug`). Musím přidat prop `page: Page` — PostavaLayout už `page` má, předá to. Aside potřebuje `imageUrl` a `title` z page.

**Edit (4.4b):**
- Stejný layout, ale main pravá strana je formulář (entries + metadata + actions) místo view, **plus** RichTextEditor pro `notes`.
- `onBackToProfil` callback → `setActiveTab('profil')` v PostavaLayout, předá se přes nový prop.

### 4.5 `InventoryTab.tsx` — kompletní rewrite

**View:**
```tsx
function InventoryTabView({ data, page }) {
  const sections = [...data.sections].sort((a, b) => a.order - b.order);
  const totalItems = sections.reduce((acc, s) =>
    acc + s.items.reduce((c, i) => c + (i.quantity ?? 1), 0), 0);

  return (
    <div className={s.invShell}>
      <div className={s.invMain}>
        {sections.map(sec => (
          <CollapsibleSection key={sec.id} section={sec} onQtyChange={...} />
        ))}
        {data.notes?.trim() && (
          <CollapsibleNotes notes={data.notes} />
        )}
      </div>

      <aside className={s.invAside}>
        {page.imageUrl && <img ... className={s.asidePortrait} />}
        <h1 className={s.asideName}>{page.title}</h1>
        <div className={s.asideSubtitle}>Osobní výbava</div>
        <div className={s.asideStats}>
          <strong>{sections.length}</strong> sekce
          <span className={s.divider}>|</span>
          <strong>{totalItems}</strong> položek
        </div>
      </aside>
    </div>
  );
}
```

Item row s inline qty stepper:
```tsx
<li className={s.itemRow}>
  <span>{item.text}</span>
  <div className={s.qtyControl}>
    <button onClick={() => onQtyChange(sec.id, item.id, -1)}>−</button>
    <span className={s.qtyValue}>{item.quantity ?? 1}</span>
    <button onClick={() => onQtyChange(sec.id, item.id, +1)}>+</button>
  </div>
</li>
```

`onQtyChange` ve view režimu — optimistic update přes `useUpdateCharacterInventory`. (Pro view-only čtenáře — pokud nemá edit oprávnění, stepper se skryje. Otázka: čte se to z `canEdit` v PostavaLayout? Předat jako prop.)

**Edit:**
- `SectionListEditor` už existuje, použít. Plus přidat RichTextEditor sekci „Rozepsané".

### 4.6 `subdocs.module.css` rewrite

Stávajících 210 řádek nahradit novou strukturou. Hlavní bloky:

```
/* Layout */
.financeShell, .invShell { display: grid; grid-template-columns: 2fr 1fr; gap: var(--sp-5); }
.financeMain, .invMain { display: flex; flex-direction: column; gap: var(--sp-5); }
.financeAside, .invAside { /* sticky aside karta */ }

/* Hero */
.heroCard { border: 1px solid var(--frame-border); border-top: 2px solid var(--accent); ... }
.heroBadges { display: flex; gap: var(--sp-2); }
.heroBadge { padding: 4px 10px; border: 1px solid var(--frame-border); border-radius: var(--radius-sm); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.06em; }
.badgeActive { border-color: var(--accent); color: var(--accent); }
.heroBalance { /* obrovský text */ }
.heroValue { font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.5rem); color: var(--accent-bright); }
.heroSplit { display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch; gap: var(--sp-3); }
.splitDivider { width: 1px; background: var(--frame-border); }
.splitIncome strong { color: var(--accent-bright); }
.splitExpense strong { color: var(--accent-danger, #ff5764); }

/* Aside */
.asidePortrait { width: 140px; height: 140px; border-radius: 50%; border: 3px solid var(--accent); object-fit: cover; }
.asideTitle { font-family: var(--font-display); font-size: var(--text-lg); }
.asideName { font-size: var(--text-2xl); color: var(--accent-bright); text-shadow: 0 0 12px color-mix(in srgb, var(--accent) 40%, transparent); }
.metaList li { display: grid; grid-template-columns: auto 1fr auto; padding: 8px 12px; border-left: 2px solid var(--accent); background: var(--surface-2); border-radius: var(--radius-sm); }
.disconnectBtn { /* outline button */ }

/* Inventory section collapsible */
.invSectionCard { border: 1px solid var(--frame-border); border-radius: var(--radius-md); }
.invSectionHeader { display: flex; justify-content: space-between; cursor: pointer; padding: var(--sp-3); }
.itemRow { display: flex; justify-content: space-between; padding: 6px var(--sp-2); }
.qtyControl { display: inline-flex; align-items: center; gap: 6px; background: var(--surface-3, rgba(0,0,0,0.3)); padding: 2px 6px; border-radius: var(--radius-sm); }
.qtyControl button { width: 24px; height: 24px; }

/* Notes karta */
.notesCard { border: 1px solid var(--frame-border); padding: var(--sp-4); }

/* Error states */
.errorBox { padding: var(--sp-4); text-align: center; }
.retryBtn { /* outline button */ }

/* Mobile ≤ 768px */
@media (max-width: 768px) {
  .financeShell, .invShell { grid-template-columns: 1fr; }
  .financeAside, .invAside { /* kompakt banner — portrait 80px, metadata zúžit */ }
  .asidePortrait { width: 80px; height: 80px; }
  .heroValue { font-size: 2rem; }
  .heroSplit { grid-template-columns: 1fr; }
  .splitDivider { display: none; }
  .qtyControl button { min-width: 32px; min-height: 32px; }
  .disconnectBtn { width: 100%; }
}
```

### 4.7 Testy

| Soubor | Nové scénáře |
|--------|--------------|
| `FinanceTab.spec.tsx` | • hero badges visible<br/>• balance + income + expenses calculated from entries<br/>• transactions list sorted by date desc<br/>• notes section renders only when notes non-empty<br/>• aside metadata: účet/přístup/měna/sync<br/>• „Odpojit účet" volá onBackToProfil<br/>• ErrorState pro 404 NOT_APPLICABLE / 403 / 500 |
| `InventoryTab.spec.tsx` | • sections render collapsed by default<br/>• click header expands/collapses<br/>• qty stepper +/- volá mutation<br/>• total items count v aside<br/>• notes section renders only when non-empty<br/>• ErrorState scénáře |
| `PostavaLayout.spec.tsx` (vznikne) | • Finance + Výbava tab visible pro PC<br/>• Finance + Výbava tab hidden pro NPC<br/>• Finance + Výbava tab hidden pro Location<br/>• deep-link `?tab=finance` na NPC → redirect na profil |

### 4.8 mobil-desktop audit

Po finální FE implementaci spustit skill `mobil-desktop`. Acceptance:
- Desktop ≥ 1025 px: 2-sloupec, aside sticky.
- Tablet 769–1024 px: 2-sloupec, užší aside.
- Mobil ≤ 768 px: stack, aside kompakt banner, qty stepper buttons ≥ 32×32 px, disconnect btn full-width.

---

## 5. Risk register

| # | Riziko | Mitigace |
|---|--------|----------|
| R1 | BE `assertSubdocAccess` nevrací `kind` / `isNpc` | Zkontrolovat. Pokud ne, rozšířit projekci v `charactersService.assertSubdocAccess`. |
| R2 | Existující subdoc bez `notes` při PATCH ztratí pole | Repository `update($set: data)` zapíše jen poslané fieldy — bezpečné. Žádný full-replace. |
| R3 | Inline qty stepper ve view režimu = velký refetch noise | `useUpdateCharacterInventory` musí dělat optimistic update + invalidovat queryKey až po onSuccess. Pokud dnes ne, doplnit v hooku. |
| R4 | Existující testy 8.1c/d předpokládají starý layout | Update testů je v plánu (4.7), žádný překvap. |
| R5 | Skin tokeny `--accent-danger` neexistují | Ověřit. Pokud chybí, fallback `#ff5764` (Matrix barva). |
| R6 | Hero badges „Aktivní účet" sedí jen pro moderní/sci-fi skiny, ne pro fantasy | Autor schválil držet doslovně. Pokud bude vadit, řeší se per-theme override v `themes/<id>/decorations.css` nebo v budoucím dluhu. |

---

## 6. Akceptační kritéria

1. **Hráč PC**: otevře Finance/Výbavu → vidí Matrix-style layout s daty. Žádný error.
2. **Hráč PC bez subdoku (legacy)**: stejné jako 1, BE si subdoc tiše založí.
3. **NPC / Lokace**: Finance + Výbava tab v navigaci **nejsou**. Deep-link `?tab=finance` → silent redirect na Profil.
4. **403 (cizí postava bez práv)**: jasná hláška „Soukromé".
5. **500 / síť**: error box s tlačítkem „Zkusit znovu".
6. Mobile audit prošel.
7. BE testy: 8 nových (4 lazy-create + 4 NOT_APPLICABLE).
8. FE testy: ≥ 15 nových.
9. Žádný regress — všechny existující testy pass, lint pass, build pass.

---

## 7. Po dokončení

- Roadmap-fe.md — fáze 8.1 doplnit zápis „8.1-FIR follow-up dokončen 2026-MM-DD" pod 8.1g.
- Pokud bude potřeba budoucí cleanup (např. backfill notes pole), zapsat do `docs/dluhy.md` přes skill `dluh`.
- `napoveda` skill spustit — Finance/Výbava layout se změnil, hráčská nápověda v `/ikaros/napoveda` potřebuje aktualizaci.

---

## 8. Otevřené body k potvrzení

- **B1** — `inventory.qtyChange ve view režimu` vyžaduje permission check (jen owner + PJ může editovat qty mimo edit mode). PostavaLayout zná `canEdit`. Předat jako prop do InventoryTab, qty stepper renderovat jen pokud `canEdit`. **OK?**
- **B2** — `FinanceTab` potřebuje prop `page: Page` pro aside (portrait + title). Změna signatury (dnes jen `slug` + `mode` + `onExitEdit` + `onDirtyChange`). **OK?**
- **B3** — „Stav přístupu" v aside je dnes odvozeno z `accessLocation !== ''`. Matrix to měl jako vlastní field. Alternativa: přidat enum field do BE schématu. **Návrh: zatím odvodit, pole nepřidávat — žádný benefit pro hráče.**
- **B4** — `lastSyncDate` v BE existuje ale dnes se nikam neukládá. Aside zobrazí `updatedAt` (timestamp). **OK?**
