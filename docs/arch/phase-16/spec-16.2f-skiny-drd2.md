# spec-16.2f — Skiny deníku pro Dračí doupě II (`drd2`, krok 8)

> **Status:** NÁVRH (design fáze). Čeká schválení HTML mockupů → pak impl.
> **Rodič:** `spec-16.2c-skiny-deniku.md` (architektura skinů, schváleno) +
> `sablona-skiny-per-system.md` (playbook, krok 8) + `spec-16.2e-denik-drd2.md`
> (deník DrD2, hotovo). Tahle spec = **per-systém implementační spec** skinů pro drd2.
> **Pořadí systémů:** matrix✅ drd16✅ drdplus✅ → **drd2 (tady)**.

---

## 1. Cíl

Osadit systém `drd2` kanonickou **rodinou skinů** v profesionální kvalitě (base.md:
kvalita > čas i počet; vlastní tvarový jazyk + 1 signature ornament; rodinná
konzistence napříč systémy). DrD2 deník je dnes **světlý fantasy pergamen** napevno;
po tomto kroku reaguje na volbu skinu (per uživatel × svět) na všech povrchech.

**Rozsah = 7 skinů** (fantasy = stávající baseline, nepíše se zvlášť — viz §3):
`scifi · horror · steampunk · nature · minimal · retro · anime(=MLP)`.

## 2. Architektura (dědí z 16.2c, bez nové)

- Skin = 1 CSS soubor scoped na `[data-diary-system='drd2'][data-diary-skin='<id>']`
  (vyšší specificita než systémový default → přebije).
- Registr `diary-systems/skins/registry.ts` = sdílený, **8 ID už existuje**, žádná
  změna. BE whitelist `update-member.dto.ts` = sdílený, **už obsahuje všech 8 ID**.
  `DEFAULT_SKIN_BY_SYSTEM.drd2 = 'fantasy'` už nastaveno.
- Volba per uživatel × svět (`WorldMembership.diarySkin`).

## 3. Proč fantasy NENÍ samostatný soubor

Deník DrD2 (`Drd2Sheet` + `drd2.css`) byl v 16.2e navržen jako **bespoke fantasy
pergamen** (signature = meč + erb „DrD II" + voskové pečeti). To JE fantasy identita
systému. `DEFAULT_SKIN_BY_SYSTEM.drd2='fantasy'` → bez volby skinu se zobrazí tenhle
baseline. (Odchylka od drdplus, kde se generický pergamen povýšil zvláštním
`fantasy.css` na grimoár — drd2 to nepotřebuje.) **7 nových skin souborů**, fantasy =
baseline. Pokud by se v budoucnu chtěl odlišný „iluminovaný grimoár" fantasy nad
baseline, je to +1 soubor; teď mimo rozsah.

## 4. Stav tokenizace (ZJIŠTĚNO Z KÓDU — určuje předkrok)

| povrch | soubor | stav | co je třeba |
|---|---|---|---|
| Deník list | `styles/drd2.css` `.drd2-sheet` | LOKÁLNÍ tokeny (`--parch-1/2/3 --ink --ink-soft --body --soul --infl --seal --gold --blood --emer`) | skin přebije přes `[ds][dsk] .drd2-sheet { --…}` + plocha/rám + ornamenty na `.drd2-*`. **Bez úpravy listu.** |
| Combat panel | `Drd2CombatPanel.module.css` | **NETOKENIZOVÁNO** (0× `var(--dd-*)`, natvrdo fantasy) | **Krok 1: regrese-safe tokenizace** |
| Bestie panel | `Drd2BestiePanel.module.css` | **NETOKENIZOVÁNO** (0× `var(--dd-*)`) | **Krok 1: regrese-safe tokenizace** |
| Embedy (obal/readout/dicelog) | `TokenInfoPanel` / `DiceRollOverlay` / `DiceLogPanel` | HOTOVO — `:is(…drd2)` čte `--dd-embed-*`, drd2 je definuje v `diary-skins.css` (světlá pergamen polarita) | skin jen přebije `--dd-embed-*` |

> ⚠️ **Klíčový rozdíl proti drdplus:** tam byly panely už tokenizované. U drd2 ne →
> krok 1 (tokenizace + plná `--dd-*` pergamen baseline na `[data-diary-system='drd2']`)
> je NUTNÝ předkrok, jinak panely zůstanou fantasy ve všech skinech.

## 5. Token kontrakt drd2

**5a. List `.drd2-sheet` (lokální):** `--parch-1 --parch-2 --parch-3 --parch-edge
--ink --ink-soft --ink-faint --rule --body --soul --infl --blood --emer --seal --gold
--shadow`. Skin je přebije + přepíše `background`/`box-shadow`/`::before`.

**5b. Panely `--dd-*` (po kroku 1):** base paleta + fonty + kompozity (`--dd-panel-bg
--dd-row-bg --dd-card-bg --dd-input-bg --dd-accent-grad --dd-accent-grad-strong
--dd-zz-grad`) + pásma (`--dd-band-ok/-warn/-crit`) + per-zdroj (`--dd-acc-body
--dd-acc-soul --dd-acc-infl`) + bestie (`--dd-acc-bestie`). Defaulty (pergamen
baseline) přidat do `[data-diary-system='drd2']` v `diary-skins.css`.

**5c. Embedy `--dd-embed-*`:** už existují (světlá polarita). Skin přebije:
`-surface(OPAQUE!) -border -line -text -muted -title -chip-bg -accent -num-font
-title-font -pos -neg -neutral`.

**Sémantika (drží napříč skiny):** Tělo=červená · Duše=modrá · Vliv=zlatá ·
Ohrožení=nebezpečí(krev) · Výhoda=příznivá(smaragd) · Sudba=damageable HP ·
kladný/záporný hod drží barvu významu.

## 6. Kanonická rodina (z playbooku §2 — DRŽ identitu)

scifi=holo velitelský HUD · horror=Půlnoční salon (viktoriánská upířina, bez gore) ·
steampunk=mosazný mechanický deník (cog-gauge) · nature=druidský herbář/letopis ·
minimal=archivní karta (jediný akcent zlato, preciznost) · retro=CRT/synthwave 80s ·
anime=MLP duhový cel-shade (id zůstává `anime`). Palety/fonty/ornamenty = sesterský
soubor `drd16-skins/<id>.css` / `drdplus-skins/<id>.css` + mockup `c:/tmp/drdplus-skins/<id>/`.

## 7. Implementační plán (po schválení mockupů)

0. **Design (TADY):** 7× HTML mockup galerie `c:/tmp/drd2-skins/<id>/` + notes → schválení.
1. **Tokenizace panelů (regrese-safe):** `Drd2CombatPanel.module.css` +
   `Drd2BestiePanel.module.css` — literály → `var(--dd-token, <původní fantasy literál>)`;
   plná `--dd-*` pergamen baseline do `[data-diary-system='drd2']` v `diary-skins.css`.
2. **Build + render default = beze změny** (regrese kontrola).
3. **7× `styles/drd2-skins/<id>.css`** (scoped compound): `@import` fontů → `.drd2-sheet`
   token override + plocha/rám → `--dd-*` panely → `--dd-embed-*` → signature ornamenty
   na `.drd2-*`. + 7× `@import './drd2-skins/<id>.css'` v `diary-skins.css`.
4. **Dicelog + readout signature:** per-skin bloky
   `[data-diary-system='drd2'][data-diary-skin='<id>'] .panel` / `.readout` v
   `DiceLogPanel.module.css` + `DiceRollOverlay.module.css` (tvary; barvy z `--dd-embed-*`).
5. **Verifikace:** Chrome headless harness — 7 skinů + default + mobil.
6. **Audit:** playbook §7 checklist (kontrast, embed opaque, signature přítomen, žádné
   hardcoded leaky, tlumení neonu, list↔panel konzistence).
7. **Uzávěr:** `mobil-desktop` · `funkce` + `napoveda` (skin = změna funkčnosti) ·
   `npm run build` · commit (uživatel ručně).

## 8. Pasti (playbook §9 — relevantní pro drd2)

`*/` v CSS komentáři rozbije build · `@import` fontů musí být první · hash module
třídy nejdou cílit globálně (ornament panelu nelze) · embed surface OPAQUE · default
skin se po tokenizaci nesmí změnit (fantasy baseline drž) · **browser render ≠ build →
`npm run build` vždy sám**.

## 9. Checklist

- [ ] Krok 0: 7 HTML mockupů + notes (design agenti) → **schválení uživatelem**
- [ ] Krok 1: combat+bestie panel tokenizovány (regrese-safe) + `--dd-*` baseline
- [ ] Krok 2: build ✓ + default render beze změny
- [ ] Krok 3: 7× `drd2-skins/<id>.css` + 7× @import
- [ ] Krok 4: dicelog + readout per-skin signature
- [ ] Krok 5: harness 7 skinů + default + mobil ✓
- [ ] Krok 6: audit projet, nálezy opraveny
- [ ] Krok 7: mobil-desktop · funkce · napoveda · build ✓ · commit
