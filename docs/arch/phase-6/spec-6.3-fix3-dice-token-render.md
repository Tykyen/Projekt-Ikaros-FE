# Spec 6.3-fix3 — Kostka jako texturní žeton (konec rozbitých CSS polyedrů)

**Status:** ❌ ZAMÍTNUTO (2026-06-17) — PJ chce reálné 3D kostky, ne 2D žeton. Nahrazeno [spec-6.3-fix4-real-3d-dice.md](spec-6.3-fix4-real-3d-dice.md). Ponecháno jako záznam zvažované varianty.
**Rozsah:** FE only — render hozené kostky ve fullscreen overlay + sjednocení s chatem
**Repo:** `Projekt-ikaros-FE`
**Autor:** PJ + Claude · 2026-06-17
**Souvisí:** [spec-6.3-fix-dice-orientation.md](spec-6.3-fix-dice-orientation.md) (orientace 3D modelů), [spec-6.3.md](spec-6.3.md) (§4.6 rendering)

> Cíl: hozená kostka má **vypadat jako kostka** — i k4, k20, k100. Dnes fullscreen overlay skládá křehký CSS polyedr (vějíř ořezaných trojúhelníků/pětiúhelníků), který z profilu vypadá jako placka, šíp nebo „ježek", prosvítá skrz něj číslo i sousední tváře a občas zmizí.

---

## 1. Problém (potvrzeno screenshoty PJ)

V [DiceRollOverlay.tsx](../../../src/features/world/chat/dice/components/DiceRollOverlay.tsx) se kostka v klidové (`show`) fázi renderuje jako **plný 3D CSS model** se všemi tvářemi (`renderModelFor` → `D20Model`/`D4Model`/…). Symptomy:

- **k4 vypadá jako šíp** — `D4Model` skládá čtyřstěn ze 4 trojúhelníků (`clip-path`), do nich ořízne texturu → tenký teal trojúhelník.
- **deformované / „helma"** — boční tváře k12/k20 trčí kolem přední.
- **propisuje číslo i skin** — `<img>` textura leží přes CSS číslo; sousední tváře prosvítají.
- **kostka občas chybí** — nešťastná rotace + výpadek textury → prázdno.

Minulá oprava (`spec-6.3-fix`) spravila jen **orientaci** (která tvář míří k divákovi). Křehkost samotného polyedru neřešila.

📚 **Klíčové zjištění:** každý skin už veze **předrenderovaný obrázek pro každou tvář** ([diceSkins.ts](../../../src/features/world/chat/dice/lib/diceSkins.ts) — `d4_1Img`…`d20_20Img`, `d100_*`, `facePlus/Minus/Blank`). Ověřeno vizuálně (obsidian skin): obrázky jsou **plnohodnotné rendery kostek** — k4 lesklý trojúhelník s fazetou, k6/k20/k100 čtvercová plaketa, vše s neon číslem a zabudovaným leskem/stínem. Ta textura **kostka je**.

## 2. Příčina (root cause)

Dvě nekonzistentní render cesty pro klidovou kostku:

| | klidový stav |
|---|---|
| **chat** ([RollingDiceScene.tsx](../../../src/features/world/chat/dice/components/RollingDiceScene.tsx) `SettledDieFace`) | 2D snímek tváře (textura + fallback číslo) ✅ |
| **overlay** ([DiceRollOverlay.tsx:351](../../../src/features/world/chat/dice/components/DiceRollOverlay.tsx#L351)) | plný 3D CSS polyedr ✗ |

CSS polyedry (k4/k8/k10/k12/k20) jsou ze své podstaty křehké — vějíř trojúhelníků kolem středu nikdy nebude spolehlivě číst jako fyzická kostka. Overlay je navíc renderuje **velké** (na čele postavy), kde každá vada vynikne.

## 3. Řešení — texturní žeton + 2.5D tumble

Přestat v overlay kreslit CSS polyedr a sjednotit na **texturní žeton** sdílený s chatem.

### 3.1 Žeton (klidový stav)

- Render = `<img>` vítězné tváře v přirozeném **čtvercovém** poměru, velikost v overlay ~120–150 px.
- **Žádný přidaný rámeček / bevel / bgGradient** — artwork je self-contained (přidaný rámeček by k4 trojúhelník orámoval navíc). Výjimka: fallback, viz 3.4.
- **Stín a záře:** `filter: drop-shadow(0 8px 22px rgba(0,0,0,.6)) drop-shadow(0 0 16px <halo>)`, kde `<halo>` se odvodí ze `skin.symbolColor` (neon halo ladí se skinem).
- **Dosednutí (high-impact moment):** scale bounce `1 → 1.12 → 1` + krátký záblesk záře (intenzivnější halo na ~250 ms).
- **Klidové „dýchání":** jemný `translateY` ±3 px + ≤1.5° `rotateZ` wobble v pomalé smyčce, aby žeton nevypadal mrtvě.

💡 *Proč `drop-shadow` a ne `box-shadow`:* `drop-shadow` respektuje alfa tvaru obrázku (kde textura má průhlednost, stín kopíruje siluetu, ne čtvercový rám).

### 3.2 Hod (letová fáze)

- Žeton přiletí z náhodného okraje (zachovat stávající `buildDice` dráhu) + během letu **2.5D tumble**: `perspective` wrapper, kombinace `rotateX/rotateY/rotateZ` se scale, dosedne na `rotate 0` (plochý, čelem).
- **Face-cycling (volitelné, rozhodne impl. plán):** během letu prostřídat náhodné tváře téhož typu (dojem „kutálení čísel"), dosednout na výsledek. Vyžaduje preload pár tváří — využít stávající `texturePreloader`. Pokud by to komplikovalo, varianta bez cyklení (točí se rovnou výsledek) je akceptovatelná v1.

### 3.3 Sdílení kódu (žádná 4. kopie)

`SettledDieFace` + helpery `pickFaceImg` / `faceLabel` dnes žijí v `RollingDiceScene.tsx`. Vytáhnout do sdíleného modulu (`models/` nebo `lib/`), použít v chatu i overlay. Vzor: [project_link_picker_shared] — jeden generický zdroj, ne kopie.

### 3.4 Fallback (textura chybí / nenačte)

- Skin bez textury dané tváře nebo `onError` → zobrazit **fallback číslo** (`faceLabel`) na jednoduchém žetonu s `skin.bgGradient` + `borderColor` (to už `SettledDieFace` umí). Kostka tak **nikdy není prázdná**.
- 3D CSS polyedr se v overlay **přestane používat úplně** (i jako fallback) — fallback je vždy 2D číselný žeton.

### 3.5 d100 (dvě kostky)

Beze změny logiky: první žeton = `d100tens` (desítky), druhý = `d10` (jednotky). Mapování `describeFaces` zůstává.

## 4. Mimo rozsah

| Položka | Důvod |
|---|---|
| **Opravdové 3D fyzikální kostky** (three.js / dice-box) | Těžká závislost + vlastní modely → zahodí custom skiny. Vědomě odmítnuto (směr B). |
| **3D model v chatu během rolling fáze** | Funguje, není v záběru stížnosti; necháváme. Mění se jen overlay. (Volitelně lze sjednotit i chat rolling na 2.5D — rozhodne impl. plán.) |
| **Transparentní pozadí k4 textur** | k4 obrázek má tmavé navy pole kolem trojúhelníku; na tmavém backdropu splývá. Izolace siluety = úkol pro asset, ne render. |
| **Špatný glyf zapečený v textuře** | Vada dat skinu, ne renderu. Fallback číslo je vždy správné. |

## 5. Akceptační kritéria

- [ ] Overlay: k4 hod vypadá jako trojúhelníková kostka (artwork tváře), ne šíp.
- [ ] Overlay: k20/k12/k10/k8/k100 = čistý žeton vítězné tváře, žádné trčící tváře, žádný bleed čísla.
- [ ] Fate hod = `+`/`−`/`0` tvář jako žeton (padá i bespoke `<img>` hack v overlay).
- [ ] Textura chybí/nenačte → fallback číslo, kostka není nikdy prázdná.
- [ ] Dosednutí má bounce + záblesk; klid jemně „dýchá".
- [ ] `SettledDieFace` je sdílený (chat i overlay z jednoho zdroje), žádná kopie.
- [ ] `npm run build` (tsc -b) zelený; dice testy zelené.
- [ ] `mobil-desktop` audit (overlay na mobilu i desktopu).

## 6. Otevřené otázky pro PJ

1. **Face-cycling během letu** (kutálení čísel) — chceš v1, nebo stačí točit rovnou výsledek a cyklení doladit potom? (Doporučuji v1 bez cyklení — rychlejší, méně rizika; přidat zvlášť.)
2. **Chat rolling fáze** — nechat stávající 3D model, nebo rovnou sjednotit i tam na 2.5D žeton? (Doporučuji nechat — mimo stížnost, menší zásah.)

---

**Po schválení:** `plan-6.3-fix3-dice-token-render.md` (konkrétní soubory + sdílený modul + animační CSS) → potvrzení → kód → `mobil-desktop`.
