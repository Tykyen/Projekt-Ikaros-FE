# Spec 10.2o — Orchestrace: viditelnost vnitřku + flyout palety (UX fix)

> Status: **implementováno** · Fáze 10.2 · FE-only · navazuje na 10.2n

## Kontext

Orchestrační panel PJ (`MapPjPanel`) zůstává **kde je** — floating sbalitelný
panel vlevo dole, logy hodů nad ním (`bottomLeftStack`). Tato spec **nemění
místo ani koncept**, řeší jen *vnitřek*: viditelnost obsahu a uskupení sekcí.

## Problémy

1. **Ořezávání / nejde doscrollovat** — při rozbaleném panelu (+ logy nad ním)
   obsah přeteče viewport a spodní sekce/scény se utnou. `bottomLeftStack` nemá
   strop výšky, `MapPjPanel` má `max-height` počítané jen pro jeden panel.
2. **Hustota** — „Přístup a viditelnost" je nejhustší blok (karty per scéna,
   per-hráč toggly) a sedí v úzkém sloupci spolu se vším ostatním.
3. **Palety v úzkém sloupci** — seznam připravených PC/NPC/bestií roste dolů a
   tlačí ostatní obsah → ořezávání.

## Řešení

### A) „Přístup a viditelnost" → do nastavení scény (⚙)

- Z orchestračního panelu **zmizí** accordion „Přístup a viditelnost".
- Ovládání se přesune do `EditSceneModal` (⚙ u scény) jako nová sekce
  **„Přístup hráčů"** — pro **tu jednu** scénu: skrýt/zamknout vše, per-hráč
  override (👁/🔒), přiřadit/odebrat hráče.
- **Paradigma:** sekce je *okamžitá* (každý toggle/assign = hned na server),
  na rozdíl od zbytku modalu (save tlačítkem). Vizuálně odlišeno popiskem
  „Změny se projeví ihned" — bez čekání na Uložit.
- `AccessBoard` se použije s `activeScenes={[scene]}` (už mapuje pole scén).
  Member ops (assign/unassign) řeší vlastní mutace v modalu (`postWorldOperation`
  + invalidace members/activeScenes).

### B) PC / NPC / Bestiář → rozevírání **do boku** (flyout)

- Nová komponenta `PaletteFlyout` nahradí `PaletteAccordion` pro PC/NPC/Bestie.
- Hlavička (chevron + název + count) zůstává v panelu. Klik → **celá paleta**
  (toolbar: hledání + „+ z katalogu", a pod ním seznam připravených) se vysune
  do **plovoucího sloupce vpravo od panelu** s vlastní výškou a scrollem.
  → seznam připravených už nesoupeří o vertikální místo, nic se neořezává.
- **Jen jeden** flyout otevřený naráz (stav `openFlyout` v `MapPjPanel`).
- Pozicování: `position:absolute; left:calc(100% + 8px); bottom:0` vůči panelu
  (panel dostane `overflow:visible`, aby flyout nebyl oříznutý). `max-height`
  vázané na viewport, `overflow-y:auto`.
- **Mobil (≤ 768px):** vedle není místo → flyout jako *bottom sheet*
  (`position:fixed`, full-width odspodu, `max-height:60vh`, scroll).

### C) Aktivní scény

- Zůstává rozbalovací **dolů** (`PaletteAccordion`) — krátký obsah (pár scén +
  akce Knihovna / +Nová / Načíst přípravu).

### D) Strop výšky panelu (pojistka)

- `bottomLeftStack` / `MapPjPanel` dostane korektní strop výšky + vnitřní scroll,
  aby ani „Aktivní scény" nikdy nepřetekly viewport (logy nad orchestrací se
  do stropu započítají).

## Co se NEmění

- Místo panelu (vlevo dole), logy nad ním, sbalitelnost, default zavřený.
- API / operace / WS kontrakt.
- Logika palet, AccessBoard, ActiveScenesList (jen přesun + obal flyoutu).

## Akceptační kritéria

1. Žádný obsah orchestrace se neořezává; vždy jde doscrollovat / je v flyoutu.
2. „Přístup a viditelnost" je dostupný z ⚙ scény, funguje okamžitě, jasně
   odlišený od save-části modalu.
3. PC/NPC/Bestie se otevírají do boku (desktop) / jako bottom sheet (mobil);
   jen jeden naráz; search + katalog uvnitř zachované.
4. Funkce 1:1 (spawn, katalog, odebrání, skrytí/zámek, přiřazení) bez regrese.
5. Vizuál konzistentní s mapou (`--map-*`, `--font-mono`).
