# Spec 16.1g — Pojmenovaná nápovědní paleta u color pickerů

**Stav:** ✅ implementováno (2026-07-05) — čeká vizuální potvrzení + commit
**Trigger:** barva chatu — uživatel chce ke každému color pickeru nápovědu s pojmenovanými barvami (jako referenční tabulka HTML barev), ale česky a čitelnou.
**Rozsah:** sdílená FE komponenta + nasazení na všechny color pickery světa/profilu + „zadarmo" pro budoucí.

---

## 1. Účel

Uživatel u barevných pickerů netuší, jakou barvu zvolit — hex kód nic neřekne. Nápovědní paleta nabídne **pojmenovanou sadu barev** (název + hex), klik = rychlá volba. Je to nápověda i zkratka zároveň.

Vzor od uživatele = polská tabulka 16 základních HTML barev (black, navy, maroon…). **Nekopírujeme ji doslova** — půlka jejích barev je krajně tmavá/světlá a v chatu na příslušném pozadí mizí. Místo toho kurátorská česká paleta čitelná na tmavém i světlém podkladu.

## 2. Rozsah — kde se nasadí

Dvě kategorie color pickerů:

**A) react-colorful `HexColorPicker`** (velká gradientní plocha = „paleta" ze screenshotu):
1. `ChatColorPicker` — barva chatu (profil)
2. `AppearancePopover` — barva zprávy ve světě

**B) nativní `<input type="color">`** (malý čtvereček → OS picker; paletu přidáme *vedle*):
3. `StyleRail` — barva textu stránky (TipTap `setColor`)
4. `BlockConfigPanel` — barva pruhu (deník schema, `config.color`)
5. `NodeEditorForm` — barva tělesa (univerzum)
6. `GroupColorEditor` — barva skupiny světa
7. `ThemeCustomEditor` — barevné tokeny motivu (**má alpha kanál**)

**Budoucí:** komponenta je sdílená → nový picker ji přidá jedním importem, nápovědu dostane zadarmo.

## 3. Komponenta `NamedColorPalette` (`src/shared/ui/NamedColorPalette/`)

```ts
interface NamedColorPaletteProps {
  /** Aktuální hodnota (hex) — pro zvýraznění aktivní dlaždice. Volitelné. */
  value?: string;
  /** Klik na barvu → vrátí hex velkými písmeny (#RRGGBB). */
  onPick: (hex: string) => void;
  /** Defaultně sbaleno; lze vynutit rozbalení. */
  defaultOpen?: boolean;
  /** Vlastní popisek summary (default „Pojmenované barvy"). */
  label?: string;
}
```

**Chování:**
- `<details>` / `<summary>` — nativní rozbalování, defaultně **sbalené** (ať nenafoukne úzké popovery). Žádný JS state.
- Uvnitř mřížka dlaždic (**varianta A**): barva = plocha dlaždice, na ní český název + hex.
- Text na dlaždici auto bílý/černý dle jasu barvy (perceptuální luminance > 0.6 → tmavý text). Utilita `readableTextOn(hex)`.
- Aktivní dlaždice (`value` == hex) má rámeček/značku „✓".
- Klik → `onPick(hex)` v `#RRGGBB` velkými písmeny.
- Data palety = `palette.ts` ve stejném adresáři (export `NAMED_COLORS`).

## 4. Paleta — `NAMED_COLORS` (18 barev)

Kurátorská, čitelná na tmavém i světlém pozadí (střední jas + sytost). Krajně tmavé/světlé odstíny vynechány schválně.

| Skupina | Barvy (název · hex) |
|---|---|
| **Teplé** | Rubínová #E5484D · Korálová #FF6B4A · Jantarová #F5A524 · Zlatá #FBCA3E · Malinová #E93D82 · Růžová #FF8DC7 |
| **Studené** | Limetková #A5D63F · Smaragdová #30A46C · Mátová #4CC38A · Tyrkysová #12B5C9 · Blankytná #4CA2E8 · Safírová #4667E6 · Levandulová #9B8AFB · Ametystová #A15FD9 |
| **Neutrální** | Sněhová #FFFFFF · Pergamen #EAE0CC · Stříbrná #C0C6CE · Břidlicová #8A94A6 |

Data mají skupiny (nadpisy se ve variantě A nezobrazují jako řádky, ale drží pořadí teplé→studené→neutrální).

## 5. Vzhled (varianta A — schváleno)

- Rozbalovací sekce pod pickerem (u kategorie B vedle čtverečku).
- Mřížka 2 sloupce (v úzkém popoveru), dlaždice ~44px výšky: název (600) + hex (mono, menší, poloprůhledný).
- Hover: lehký lift + stín.
- Poznámka pod summary: „Klikni pro rychlou volbu. Krajně tmavé/světlé odstíny vynechány — v chatu by mizely."
- Barvy tokenizované z `--surface-*`, `--frame-border`, `--text-*` → sedí na všech skinech. Barvy dlaždic jsou datové (výjimka z lint:colors, `lint-colors-ignore` v `palette.ts`).

## 6. Integrace per místo

**Kategorie A** (pod picker, `onPick` = existující setter):
- `ChatColorPicker`: `onPick={(hex) => onChange(hex)}`.
- `AppearancePopover`: `onPick={(hex) => setColor(hex)}`.

**Kategorie B** (rozbalovací pod/vedle čtverečku):
- `StyleRail`: `onPick={(hex) => chain().setColor(hex).run()}`.
- `BlockConfigPanel`: `onPick={(hex) => setConfigField('color', hex)}`.
- `NodeEditorForm`: `onPick={(hex) => patch({ color: hex })}`.
- `GroupColorEditor`: `onPick={(hex) => setRows(...idx.color=hex)}`.
- `ThemeCustomEditor`: `onPick={(hex) => setToken(key, toCssColor(hex, alpha, kind))}` — **alfa zachována** z aktuální hodnoty tokenu.

## 7. Edge cases / rozhodnutí

- **Nativní OS picker nezasahujeme** — paleta je samostatný prvek vedle čtverečku.
- **Alpha (ThemeCustomEditor):** paleta dá hex, wrapper dopočte přes `toCssColor` s aktuální alfou → průhlednost se neztratí.
- **Kontrast chatu:** existující `guardChatColor` běží dál nezávisle; paleta nabízí čitelné barvy, ale guard je poslední pojistka.
- **Kategorie B „technické" kontexty** (theme tokeny, barva tělesa): stejná paleta — je obecně hezká, není chatově specifická.

## 8. Přístupnost + mobil

- `<summary>` fokusovatelné, Enter/Space rozbalí (nativní).
- Dlaždice = `<button>`, `title="Název #HEX"`, `aria-label`.
- Auto text kontrast zajišťuje čitelnost názvu na dlaždici.
- Mobil: mřížka 2 sl. se vejde do spodního sheetu popoveru; ověří `mobil-desktop` po implementaci.

## 9. Co NEřešíme

- Vlastní pojmenování barev uživatelem, oblíbené/nedávné barvy (možný budoucí krok).
- Náhrada nativních `<input type="color">` za react-colorful (mimo rozsah).
