# Koncept — AKJ jako chráněné záložky stránky

**Status:** ✅ IMPLEMENTOVÁNO KOMPLETNĚ A+B+C+D (2026-06-02). Override = obrázek (HeroUploadCard) + text + table (boxy). Page-level AccessPanel odebrán (AKJ záložky řeší přístup granulárně). privateContent/'soukrome' kompletně odstraněny. Viz [plan-akj-protected-tabs.md](plan-akj-protected-tabs.md).
**Rozsah:** velký — datový model `Page` + `WorldMembership`, BE gate, PageViewer layouty, editor, migrace. Pohltí 2 existující funkce.
**Autor:** PJ + Claude
**Datum:** 2026-06-02
**Souvisí / nahrazuje:**
- [spec-akj-shielded-existence.md](spec-akj-shielded-existence.md) (D-062 — „zašifrováno" screen) — zůstává, reuse
- [spec-akj-pj-bypass.md](spec-akj-pj-bypass.md) (2026-06-02 — PJ bypass) — page-level záplata, AKJ záložky ji zjemní
- [spec-character-tab-visibility.md](spec-character-tab-visibility.md) (per-typ viditelnost) — **pohlceno** (stane se defaultem přebitelným per stránka)
- `privateContent` / `privateInfoBlocks` (krok 9.1) — **pohlceno** (stane se záložkou „PJ informace")

---

## 1. Vize

Dnes je AKJ **binární zámek na celou stránku**. Nově: stránka má **chráněné záložky** vedle Profil/Kalendář. Každá záložka nese vlastní obsah a vlastní pravidlo, **kdo ji vidí**. Jeden hráč vidí jinou sadu záložek než druhý.

Jednotící myšlenka:

> **Každá přídavná záložka stránky** (PJ informace, AKJ Dvůr, AKJ Královna…) **nese pravidlo viditelnosti**. Vidíš jen ty, na které máš přístup. Na které nemáš, ty **v liště vůbec nevidíš** — ani nevíš, že existují.

„PJ informace" není výjimka — je to chráněná záložka s pravidlem `role ≥ PomocnyPJ`. AKJ záložka = pravidlo `clearance / konkrétní hráč`. **Jeden mechanismus.**

---

## 2. Referenční příklad (NPC Král)

PJ vytvoří u Krále tři AKJ záložky:

| Záložka | Úroveň | |
|---|---|---|
| Dvůr | 3 | |
| Královna | 5 | |
| Milenka | 5 | dvě různé záložky, **obě úroveň 5** |

Přístup hráčů (přístup = splní **aspoň jednu** podmínku záložky, OR):

| Hráč | Co dostal | Vidí u Krále |
|---|---|---|
| A — mimo hrad | nic | nic (neví ani o existenci AKJ) |
| B — dvořan | klíč „Dvůr" | Dvůr |
| C — královna | klíč „Královna" | Královna |
| D — sluha | klíč „Milenka" | Milenka |
| E — šašek | 3 klíče jmenovitě | Dvůr + Královna + Milenka |
| F — boss zločinu | clearance 5 | vše ≤5 = všechny tři (**i u jiných NPC**) |
| G — bossův syn | clearance 3 | jen Dvůr (Královna/Milenka jsou 5 > 3) |
| PJ | — | vše |
| PomocnyPJ | jen co mu PJ dovolí (granty jako hráč) | dle grantů |

**Dvě nezávislé cesty k přístupu** (PJ na záložce nastaví jednu nebo obě):
1. **Konkrétní klíč** — jmenovité přiřazení hráče té záložce. Lokální („Královna u Krále").
2. **Globální prověrka (clearance)** — hráč má číslo N, vidí každou AKJ záložku ≤ N v **celém světě**.

---

## 3. Datový model

### 3.1 AKJ záložka na stránce

Nové pole na `Page`:

```ts
export interface AkjTab {
  id: string;                 // stabilní id záložky
  name: string;               // „Dvůr", „Královna", „PJ informace"
  level?: number;             // clearance práh (volitelný); chybí = jen jmenovité granty/role
  order: number;

  // Pravidlo viditelnosti — REUSE existující AccessRequirement[] (OR logika).
  // Typy: AKJ (clearance ≥ value), UserId (konkrétní hráč), Role (≥ role), AKJType.
  access: AccessRequirement[];

  // Obsah záložky — dědí z basic stránky, pole se přepisují jen když jsou vyplněná.
  contentOverride?: {
    imageUrl?: string;        // přepíše rám-obrázek
    content?: string;         // přepíše hlavní text
    table?: PageTable;        // přepíše „boxy" (sidebar)
    infoBlocks?: InfoBlock[];
    sections?: PageSection[];
  };
}

export interface Page {
  // … stávající
  akjTabs?: AkjTab[];
}
```

💡 **`access` = stávající `AccessRequirement[]`** — žádný nový engine. `level` je jen pohodlný shortcut, který se při uložení promítne do `access` jako `{ type: 'AKJ', value: String(level) }`. „Číslo i hráče, stačí jedna" = OR, což `assertAccess` už dělá.

### 3.2 Dědičnost rámu (obrázek + boxy)

`contentOverride` je **sparse** — vyplněné pole přepíše základ, prázdné dědí:

```
zobrazené pole = akjTab.contentOverride?.<pole> ?? basicPage.<pole>
```

Tvůj požadavek „vzhled stejný jako u Krále, ale PJ ho může měnit" = přesně tohle. Default dědí, override volitelný per pole.

### 3.3 Membership — clearance zůstává, granty jsou navíc

`membership.akj` (dnešní jedno číslo) **zůstává beze změny** = globální clearance (hráči F, G).

Konkrétní granty (hráči B–E) **nežijí na membershipu**, ale na záložce jako `{ type: 'UserId', value }` v `access[]`. Důvod: PJ je přidává **z té záložky** („kdo vidí tuhle věc"), což je tvoje preferovaná UX. Žádná migrace membershipu.

⚠️ **To znamená, že můj dřívější závěr „membership musí být sada klíčů" NEPLATÍ** — clearance je číslo (správně), granty jsou na záložce. Jednodušší, než jsem čekal.

---

## 4. Gate (BE)

### 4.1 Viditelnost záložky
Pro každou `akjTab` spočti `canSee`:
```
canSee = isPJ(membership)                         // PJ vidí vše
       || passesAccess(tab.access, membership)    // = dnešní assertAccess logika, OR
```
- **PomocnyPJ NEMÁ automatický bypass na AKJ záložky** — podléhá `tab.access` jako hráč (PJ mu uděluje granty/role). Liší se od page-level bypassu z [spec-akj-pj-bypass.md](spec-akj-pj-bypass.md), který řeší jen odemčení editoru.
- `GET /pages/:slug` vrací **jen záložky, na které mám `canSee`** — ostatní se neposílají vůbec (žádný leak existence, ani názvů).

### 4.2 Přímý odkaz na nedostupnou záložku
Wikilink/URL na konkrétní AKJ → BE 403 → **„Stránka je zašifrovaná, úroveň X"** (existující `AccessDenied`, D-062a). Reuse beze změny.

### 4.3 Zápis
Editace AKJ záložek = `assertCanWrite` (PomocnyPJ+), jako dnes obsah stránky. Kdo smí editovat, smí i nastavit `access` záložek.

---

## 5. UI

### 5.1 Viewer — lišta záložek
- AKJ záložky se zařadí do `Tabs` v layoutech ([LokaceLayout](src/features/world/pages/PageViewer/layouts/LokaceLayout.tsx), `PostavaLayout`, `OstatniLayout`) za základní záložky.
- Renderují se **jen ty s `canSee`** (BE už ostatní neposlal → FE jen vykreslí, co dostal).
- AKJ záložka = `OstatniLayout`-like render s mergnutým obsahem (override ?? basic) + `AkjDecryptedBanner` (D-062b) nahoře jako indikace utajení.

### 5.2 Editor — správa AKJ záložek
- Nová sekce v `PageEditor` „Chráněné záložky" (nahrazuje dnešní `AccessPanel`, který řešil page-level access).
- Per záložka: název, level (volitelný), seznam konkrétních hráčů (whitelist z členů), role práh; + override obsahu (obrázek/text/boxy — co necháš prázdné, dědí).
- „PJ informace" = předpřipravená záložka jedním klikem (`access: [{ type:'Role', value: PomocnyPJ }]`).

### 5.3 Členové — clearance
- `MemberRow` AKJ select → zůstává (= clearance číslo). Beze změny.

---

## 6. Co se pohltí / migruje

| Existující | Osud |
|---|---|
| Page-level `accessRequirements` | zůstává jako zámek na **základní** stránku (zpětná kompat); AKJ záložky jsou navíc |
| `privateContent` / `privateInfoBlocks` (9.1) | migrace → AKJ záložka „PJ informace" (`access: Role≥PomocnyPJ`). Dva systémy skrývání → jeden |
| `characterTabVisibility` (per-typ) | zůstává jako **default**; per-stránka AKJ záložky ho mohou přebít. Zvážit, zda vůbec dál držet |
| `AccessPanel` (page-level editor) | nahrazen editorem chráněných záložek |

---

## 7. Otevřené body k rozhodnutí

1. **Rozsah pilotu** — datový model + gate univerzálně; UI zapnout nejdřív na **NPC + bestie** (tvé příklady), pak Lokace/PC/wiki? Nebo rovnou všechny typy?
2. **`privateContent` migrace** — přemigrovat hned (čisté, ale dotkne se hotových postav), nebo nechat dočasně koexistovat a migrovat později?
3. **`characterTabVisibility`** — ponechat per-typ default, nebo ho rovnou celý nahradit AKJ-tab modelem?
4. **„Boxy" = co přesně** — potvrdit, že sidebar = `table` (+ `infoBlocks`/`sections`). Sjednotit terminologii.
5. **Clearance vs. záložka napříč světem** — hráč F (clearance 5) vidí „vše ≤5". Potvrdit, že clearance je čistě číslo bez vazby na názvy (Dvůr/Královna jsou jen labely).
6. **Pořadí záložek** — fixní `order`, nebo zvlášť řazení pro různé role? (Navrhuji prostý `order`.)

---

## 8. Proč to není malé (čestné varování)

- Datový model `Page` + nová sub-entita `AkjTab` (BE schema, DTO, sanitace HTML override obsahu, repo mapper — pozor na [[project_be_field_checklist]]).
- BE gate: filtrování záložek v `findBySlug`, per-tab `assertAccess`, nový response shape.
- 3 viewer layouty + nový editor panel + migrace `privateContent`.
- Migrace dat existujících světů.

Odhad: **velká fáze**, ne side-task. Doporučuji rozdělit na sub-kroky (A: datový model + gate, B: viewer, C: editor, D: migrace) — ale jako **jeden ucelený plán**, ať nevznikne polovičatý mezistav ([[feedback_no_debt]]).

---

## 9. Další krok

Po schválení tohoto modelu → rozpad na implementační plán se sub-kroky (spec-driven workflow: Unified spec → Implementační plán → Kód).
