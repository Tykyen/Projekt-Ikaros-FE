# Spec 8.1-FIR — Finance / Výbava: hráčský redesign + recovery

**Stav:** 📝 návrh v2 — čeká na schválení
**Datum:** 2026-05-24
**Závisí na:** 8.1c (Finance), 8.1d (Výbava), 9.1 (Page+Character sjednocení, `kind`), 1.0 (theme systém, `data-theme` + CSS vars)
**Typ:** follow-up + visual upgrade — dotahuje 8.1c/d na úroveň starého Matrixu (vizuál) a opravuje 404 skrytou UX díru
**Referenční vizuál:** `Matrix/frontend/src/components/finance/FinanceViewer.tsx` + `inventory/StructuredInventory.tsx` + `styles/page.scss` (řádky 1626–2030)

---

## 1. Problém

Hráč otevře svou postavu (`POSTAVA HRÁČE` „Ikaros test"), klikne tab **Finance** nebo **Výbava** → vidí jen:

> „Finance se nepodařilo načíst." / „Výbavu se nepodařilo načíst."

Žádný kontext, žádná akce. Postava je validní PC, jen nemá subdokument v DB.

### Root cause

1. **BE kaskáda** v [character-subdocs.service.ts:94-114](character-subdocs.service.ts) zakládá `finance` + `inventory` jen pro PC (`!isNpc && kind!=='location'`). Pokud `character.created` event neproběhl (legacy postava ze starší verze BE, race condition, NPC→PC convert s emit failure), dokument v DB chybí.
2. **BE GET `/finance` a `/inventory`** vrací 404 `FINANCE_NOT_FOUND` / `INVENTORY_NOT_FOUND` ([character-subdocs.service.ts:291-299](character-subdocs.service.ts), `:355-363`).
3. **FE [FinanceTab.tsx:50-52](src/features/world/pages/CharacterDetailPage/components/FinanceTab.tsx#L50-L52)** + [InventoryTab.tsx:31-33](src/features/world/pages/CharacterDetailPage/components/InventoryTab.tsx#L31-L33) hodí na jakýkoli error totéž lakonické hlášení — nerozlišuje 404 / 403 / 500.
4. **[PostavaLayout.tsx:125-141](src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx#L125-L141)** vykreslí taby `finance` + `vybava` vždy když `character` existuje — i pro NPC a Lokace, které tyto subdokumenty mít **nemají** (BE u nich do kaskády finance/inventory nepouští). Tab se zobrazí, klikne se, padá to.

---

## 2. Cíl

**Hlavní:** Finance + Výbava taby vypadají na úrovni starého Matrixu — hero zůstatek + split příjmy/výdaje + side profil karta s portrétem + metadata + „Rozepsané" sekce; výbava jako collapsible sekce s inline qty controls. Tématizováno přes existující skin CSS vars (`--accent`, `--accent-bright`, `--surface-2`, `--frame-border`), žádné inline `--skin-accent` hardcodované barvy.

**Vedlejší (recovery, jdou s redesignem):**

1. Hráč nikdy nesmí narazit na neinformativní „se nepodařilo načíst" v Finance/Výbava na vlastní PC, pokud jediný problém je chybějící subdokument.
2. Taby Finance + Výbava se zobrazí jen u postav, které je dle pravidel mít mají (PC).
3. Když BE 404 přijde nečekaně (legacy data), BE se uzdraví transparentně (lazy-create).
4. Ostatní chyby (403, 500, síť) musí být rozeznatelné a mít retry.

Mimo cíl:
- Žádná změna data modelu Finance/Inventory.
- Žádný backfill skript přes všechny světy — BE lazy-create stačí.
- **Multi-měna view** (krok 11.4) — `currency` je dnes string label, redesign se ho jen vizuálně dotkne.
- **Sound effects, parallax, video pozadí** ze starého Matrixu — Ikaros má skin systém který si dělá vlastní atmosféru, žádné FinanceViewer-specific dekorace.

---

## 3. Vizuální cíle (Matrix → Ikaros adaptace)

### 3.0a — Finance layout (Matrix přesně)

```
┌────────────────────────────────────────────────┬───────────────────┐
│ ┌─ Hero karta ──────────────────────────────┐ │ ┌─ Portrait ────┐ │
│ │ [● Aktivní účet]  [● Zabezpečená relace] │ │ │   avatar     │ │
│ │                                            │ │ │   postavy    │ │
│ │  Aktuální zůstatek                        │ │ └──────────────┘ │
│ │  ╔══════════════════════════════════════╗ │ │                  │
│ │  ║   12 450 ✦                          ║ │ │ Finance          │
│ │  ╚══════════════════════════════════════╝ │ │ Ikaros test      │
│ │                                            │ │                  │
│ │  ┌─ Příjmy ────┐ │ ┌─ Výdaje ─────────┐ │ │ 🛡️ Typ účtu      │
│ │  │  + 3 200 ✦  │ │ │  - 1 800 ✦       │ │ │    Běžný         │
│ │  └─────────────┘ │ └──────────────────┘ │ │ 🔑 Stav přístupu │
│ └────────────────────────────────────────────┘ │    Aktivní       │
│                                                │ │ 💶 Měna          │
│ ┌─ Historie transakcí ──────────────────────┐ │ │    Zlaťáky       │
│ │ Mzda za měsíc      2026-05-01    +3 200✦ │ │ │ 🔄 Posl. sync    │
│ │ Hospoda U Tří…     2026-05-04    -120 ✦  │ │ │    2026-05-22    │
│ │ …                                          │ │ │                  │
│ └────────────────────────────────────────────┘ │ │ ┌──────────────┐ │
│                                                │ │ │ Odpojit účet │ │
│ ┌─ Rozepsané ───────────────────────────────┐ │ │ └──────────────┘ │
│ │ (RichText z poznámek nebo monthly entries)│ │ │                  │
│ └────────────────────────────────────────────┘ │ └──────────────────┘
└────────────────────────────────────────────────┴───────────────────┘
```

Klíčové prvky:

- **2-sloupcový layout** (desktop): main 2fr / aside 1fr. Mobil = stack pod sebou (profil-side jde nahoru jako sticky banner s portretem + jménem).
- **Top accent border** na hero kartě — 2px solid `var(--accent)` (skin barva).
- **Badge řádek** nahoře v hero — `Aktivní účet` (accent border + accent text) + `Zabezpečená relace` (neutral). Statické, dekorativní (Matrix to měl jako „bankovní" feel — odpovídá modernímu finančnímu UI). Pokud jsou taky pro Ikaros vhodné, OK; alternativně lokalizovat na svět („Krytý glejtem" / „Zápis v komoře"). **Otevřená otázka 7.4.**
- **Hero label** „Aktuální zůstatek" — small caps, `--font-display`, decentní.
- **Hero value** — největší text na stránce, `--font-display`, `var(--accent-bright)`, číslo se symbolem měny (`12 450 ✦`).
- **Split příjmy / výdaje** — 2 karty oddělené vertikálním dividerem; `+3 200` v `--accent-bright` / `-1 800` v `--accent-danger`. Hodnoty = `Σ entries` (positive vs negative). 💡 *Matrix to počítal z headers tabulky, Ikaros má `entries[].amount` přímo.*
- **Historie transakcí** — Matrix tu sekci moc neměl jako vlastní kartu, ale v Ikaros existuje subdoc `transactions[]`. Renderovat pod hero kartou, ne v aside — view se tím dotáhne reálným obsahem.
- **„Rozepsané" notes karta** — Matrix měl `htmlNotes` z `paragraphs`. V Ikaros financí nic ekvivalentního není. Návrh: **pole `notes: string` (RichText, optional)** přidat do `CharacterFinance` schema — patří k specu? Nebo notes vynechat a tuhle kartu v Ikaros neukazovat? **Otevřená otázka 7.5.**

### 3.0b — Aside (profil karta) Finance

- **Portrait** — kruhový (Matrix měl square s rámečkem, Ikaros má kruhový theme — držet kruhový). Border 3px `var(--accent)`. Když `avatarUrl` chybí, placeholder s ikonou.
- **Title block** — `Finance` malým fontem, pod tím jméno postavy v `--font-display`, velké, `var(--text-primary)` s lehkým glow (`text-shadow: 0 0 12px var(--accent) / 0.4`).
- **Metadata řádky** — 4 řádky:
  - 🛡️ Typ účtu — `accountType`
  - 🔑 Stav přístupu — odvozeno: pokud má character `accessLocation` → „Aktivní", jinak „Nenastaveno"
  - 💶 Měna — `currency`
  - 🔄 Poslední synchronizace — `updatedAt` formátováno cs-CZ
  - Každý řádek: ikona vlevo (accent), label uppercase small caps, value bold. Levý border 2px accent.
- **Tlačítko „Odpojit účet"** — Matrix to měl jako návrat na rodičovskou stránku. V Ikaros postava není rodičovská stránka, ale **Profil tab** ve stejné PageView. → Použít jako **„Zpět na Profil"** (přepne `activeTab` na `'profil'`). Nebo úplně vynechat (taby už jsou nahoře). **Doporučuju vynechat** — duplikuje navigaci tabů.

### 3.0c — Výbava layout (Matrix přesně)

```
┌─────────────────────────────────────────────┬────────────────────┐
│ ┌─ Sekce: Zbraně  ▼  ───────────  5 položek┐│ ┌─ Portrait ─────┐ │
│ │  ⚔️ Krátký meč                  ⊖ 1 ⊕    ││ │   avatar       │ │
│ │  🏹 Luk                          ⊖ 1 ⊕    ││ └────────────────┘ │
│ │  🗡️ Dýka                         ⊖ 2 ⊕    ││                    │
│ │  …                                          ││ Ikaros test       │
│ └─────────────────────────────────────────────┘│ Osobní výbava     │
│                                              │ │                    │
│ ┌─ Sekce: Lektvary ▼ ──────────  3 položky─┐│ │ ── stats ──       │
│ │  🧪 Léčivý lektvar (malý)       ⊖ 3 ⊕    ││ │ 4 sekce │ 22 položek│
│ │  …                                          ││ │                    │
│ └─────────────────────────────────────────────┘│ │                    │
│                                              │ │                    │
│ ┌─ ROZEPSANÉ  ▼ ─────────────────────────────┐│ └────────────────────┘
│ │ (RichText z `notes` pole nebo legacy)      ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────┴────────────────────┘
```

Klíčové prvky:

- **Sekce jako collapsible karty** — header (chevron + název + počet položek), klik zavře/otevře. Edit režim: header obsahuje input s názvem + „Smazat sekci". Default v view: **všechny collapsed**? Matrix to měl tak. Pro Ikaros — pokud má hráč jen 1–2 sekce, expandni je defaultně. **Otevřená otázka 7.6.**
- **Item row** view:
  - `text` (název položky) vlevo
  - Vpravo: inline qty stepper `⊖ N ⊕` — kliknutí +/- okamžitě uloží přes `useUpdateCharacterInventory` (optimistic). Bez modal, bez confirm — je to běžná akce.
  - Pokud `item.note` existuje, malý šedý text pod nebo vpravo.
- **Item row** edit:
  - Qty input (number) | text input | trash button.
  - Add item button uvnitř sekce.
- **„Přidat novou sekci"** — full-width tlačítko dole, jen v edit režimu.
- **„ROZEPSANÉ" notes karta** — collapsible, dole. Default collapsed. Renderuje `notes: string` (RichText) z inventory subdocu. Pole dnes neexistuje → **přidat `notes?: string` do `CharacterInventory`** — patří k specu? **Otevřená otázka 7.5.**

### 3.0d — Aside Výbava

- **Portrait** + **jméno** + **subtitle „Osobní výbava"** — stejný styl jako Finance aside.
- **Stats řádek** — `4 sekce | 22 položek` (počet sekcí + sum quantity přes items).
- Bez tlačítka „Odpojit".

### 3.0e — Skinování

- **Žádné inline `var(--skin-accent, #6b8cff)` hexy** jako v Matrixu. Skin se aplikuje **automaticky** přes `data-theme` na ancestor (`IkarosLayout` / `WorldLayout`) a komponenty čtou `var(--accent)`, `var(--accent-bright)`, `var(--surface-2)`, `var(--frame-border)`, `var(--text-primary/secondary)`, `var(--font-display)`, `var(--radius-md)` z theme tokenů.
- Komponenty jsou **theme-agnostic** — fungují identicky v `modre-nebe`, `ikaros`, `kyberpunk`, atd. To je strikní pravidlo z [feedback_theme_isolation.md](.../memory/feedback_theme_isolation.md).
- Pokud konkrétní skin chce special-case (např. `ikaros` skin chce „synthwave neon" finance), řeší to ve **scope `[data-theme="ikaros"]` v jeho themes/ikaros/decorations.css**, ne v `subdocs.module.css`.

### 3.0f — Responsivita

- **Desktop > 1024 px:** 2-sloupcový (main 2fr / aside 1fr), aside sticky pod hero scroll.
- **Tablet 769–1024 px:** 2-sloupcový stejně, aside užší (1fr / 1fr).
- **Mobil ≤ 768 px:** stack — aside sjede nad main, ale **kompaktně** (portrait 80px, metadata jen 2 nejdůležitější, ostatní v collapse pod tlačítkem „více"). Stats karta výbavy → kompakt inline.
- `mobil-desktop` audit povinný po implementaci (skill `mobil-desktop`).

---

## 4. Řešení (3 vrstvy — beze změny od v1)

### 4.1 BE — lazy-create při GET pro PC

V `character-subdocs.service.ts` upravit `getFinance(characterId)` a `getInventory(characterId)`:

```
async getFinance(characterId: string): Promise<CharacterFinance> {
  const finance = await this.financeRepo.findByCharacterId(characterId);
  if (finance) return finance;

  // Lazy-create jen pro PC (kde subdoc patří dle kaskády 8.1c).
  // Caller (controller) už ověřil přístup; service zná character přes characterId.
  const character = await this.charactersRepo.findById(characterId); // injekce
  if (!character || character.isNpc || character.kind === 'location') {
    throw new NotFoundException({ code: 'FINANCE_NOT_APPLICABLE', message: '...' });
  }
  return this.financeRepo.create(characterId);
}
```

Stejně `getInventory`. Důsledky:
- Legacy PC bez subdoku se uzdraví prvním GET (žádný backfill).
- NPC + Lokace dostanou **404 `FINANCE_NOT_APPLICABLE`** (nový code, sémanticky odlišný od `FINANCE_NOT_FOUND`).
- Existující `FINANCE_NOT_FOUND` zmizí z normálního provozu (zbyde jen pro update-na-smazaný subdoc race conditions).

⚠️ **Otevřený bod k rozhodnutí:** chci do `CharacterSubdocsService` injektovat `CharactersRepository` (cross-modul). Alternativa: rozšířit payload metody o `kind` + `isNpc` parametry a předat je z controlleru, který character už načítá kvůli access guardu. **Doporučuju alternativu** — méně cross-modul vazeb, controller už character má.

### 4.2 FE — skrytí tabů pro NPC/Lokace

V [PostavaLayout.tsx:125-141](src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx#L125-L141):

```
const isPC = character && !character.isNpc && character.kind !== 'location';
const tabs = [
  { id: 'profil', ... },
  ...(character ? [{ id: 'denik', ... }] : []),
  ...(isPC ? [
    { id: 'finance', ... },
    { id: 'vybava', ... },
  ] : []),
  ...(character ? [{ id: 'kalendar', ... }] : []),
  ...(canSeePrivate && character ? [{ id: 'poznamky', ... }] : []),
];
```

Renderovací větve níže (`activeTab === 'finance' && character &&`) doplnit o `&& isPC` jako defense-in-depth pro případ deep-linku.

### 4.3 FE — rozlišení chybových stavů

V `FinanceTab.tsx` + `InventoryTab.tsx` nahradit:

```
if (isError || !data) {
  return <p className={s.empty}>Finance se nepodařilo načíst.</p>;
}
```

za:

```
if (isError) return <ErrorState error={error} onRetry={refetch} />;
if (!data) return <Spinner center />;  // jen loading edge case
```

Komponenta `ErrorState` (nová, sdílená v `subdocs.module.css`):
- **404 + code `FINANCE_NOT_APPLICABLE` / `INVENTORY_NOT_APPLICABLE`** → „Tato postava finance nemá." (statická, bez CTA — fallback pro deep-link na NPC).
- **404 + code `FINANCE_NOT_FOUND` / `INVENTORY_NOT_FOUND`** → „Pro tuto postavu zatím není evidence. **[Založit finance]**" tlačítko volá `refetch()` (po BE lazy-create projde).
- **403** → „Soukromé — vidí jen PJ a vlastník."
- **5xx / síť** → „Něco se pokazilo. **[Zkusit znovu]**" → `refetch()`.

📚 *`isError` je TanStack Query stav — true když poslední `queryFn` skončil throw. `refetch` ručně znovu spustí query, ignoruje `staleTime`.*

---

## 5. Dopady mimo přímý scope

- **Convert NPC→PC** ([character-subdocs.service.ts:127-139](character-subdocs.service.ts)) — dnes při convertu create-nebo-update. Funguje. Žádná změna.
- **`/moje-postava` redirect** — bez změny, tahá detail postavy přes Page slug.
- **Edit režim** Finance — `useUpdateCharacterFinance` PATCH na neexistující subdoc dnes hodí 404 (`updated == null`). Po lazy-create v GET to nebude problém: user nejdřív otevře tab (GET vytvoří) a potom edituje. Pro safety doplnit BE: pokud `update` najde null, zavolat lazy-create + retry update — **alternativně přijmout, že GET musí předcházet PATCH** (přirozený UX flow). Doporučuju druhé.

---

## 6. Co se NEbude dělat (záměrně mimo scope)

- Multi-měna view (krok 11.4 — světové měny + převodník). Dnes `currency: string` = jen label.
- Bulk transakce / kategorie výdajů.
- Drag&drop pořadí sekcí ve výbavě (Matrix to neměl, žádný požadavek).
- Export inventáře / financí do PDF.
- Sound effects, parallax pozadí, sci-fi „synthwave" overlay ze starého Matrixu (skin-specific, řeší per-theme decoration).

---

## 7. Testy (rámcově, detaily až do plánu)

- BE: getFinance pro PC bez subdoku → vrátí freshly created. Pro NPC → 404 NOT_APPLICABLE. Pro Lokaci → 404 NOT_APPLICABLE. Stejně getInventory.
- FE: FinanceTab + InventoryTab — error state pro každý ze 4 případů (NOT_APPLICABLE / NOT_FOUND / 403 / 500). Smoke test že retry volá `refetch`.
- FE: PostavaLayout — taby finance + vybava se zobrazí pro PC, ne pro NPC, ne pro Lokaci.

---

## 8. Rozhodnutí (po review autorem 2026-05-24)

Autor: **„držet se toho, co to je"** + **„výbava byla podobná Matrixu"** → ve sporných bodech držet Matrix verzi.

| # | Otázka | Rozhodnutí |
|---|--------|------------|
| 1 | „Založit finance/výbavu" CTA vs. transparentní lazy-create | **Transparentní lazy-create** v BE |
| 2 | NPC/Lokace deep-link `?tab=finance` | **Silent redirect na `profil`** |
| 3 | Confirm dialog před lazy-create | **Ne** |
| 4 | Hero badges „Aktivní účet" + „Zabezpečená relace" | **Držet doslovně z Matrixu** |
| 5 | Pole `notes: string` v Finance + Inventory schématu pro „Rozepsané" karty | **Ano** — přidat `notes?: string` do `CharacterFinance` i `CharacterInventory` (BE migrace + DTO + repo + service + FE RichTextEditor). Matrix-like. |
| 6 | Default collapsed sekce výbavy | **Vždy collapsed** (Matrix-like, hráč klikem expanduje co potřebuje) |
| 7 | Tlačítko „Odpojit účet" v aside Finance | **Držet** — label „Odpojit účet" doslovně z Matrixu, funkce = přepne `activeTab` na `'profil'` |
| 8 | Aside karta na mobilu | Kompaktní banner s portrétem + jménem + 2 metadata (zůstatek / počet sekcí + položek), zbytek collapsuje |

Dopady rozhodnutí Q5 (přidání `notes` pole):

- **BE:** `CharacterFinanceSchema` + `CharacterInventorySchema` rozšířit o `notes: { type: String, default: '' }`. DTO `UpdateCharacterFinanceDto` + `UpdateCharacterInventoryDto` přidat `notes?: string` (sanitize HTML). Service už dělá generický `update(...patch)`, beze změny. Žádná migrace nutná — Mongo Mongoose toleruje chybějící pole.
- **FE typy:** [characters.types.ts:140](src/features/world/pages/api/characters.types.ts#L140) + `:153` — přidat `notes?: string`.
- **FE editor:** Finance edit mode + Inventory edit mode dostanou novou sekci „Rozepsané" s `RichTextEditor` (už existuje, používá ho 8.1b deník).
- **FE view:** sekce „Rozepsané" se zobrazí jen pokud `notes?.trim().length > 0`.
