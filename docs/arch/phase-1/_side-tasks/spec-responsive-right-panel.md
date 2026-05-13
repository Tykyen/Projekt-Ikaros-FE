# Spec — Responzivní pravý panel (IkarosLayout)

**Status:** Draft — čeká na schválení
**Rozsah:** FE (layout) — malé, ~2 soubory
**Repo:** `Projekt-ikaros-FE`
**Velikost:** ~150 ř. (CSS + ~30 ř. TSX)
**Autor:** PJ + Claude
**Datum:** 2026-05-13
**Souvisí:** [docs/arch/phase-0/0.2-layout/purpose.md](../../phase-0/0.2-layout/purpose.md), [IkarosLayout.tsx](../../../../src/app/layout/IkarosLayout/IkarosLayout.tsx), [IkarosLayout.module.css](../../../../src/app/layout/IkarosLayout/IkarosLayout.module.css)

---

## 1. Cíl

Zpřístupnit pravý panel (Administrace, Moje světy, Moje diskuze, Oblíbené články/obrázky) na všech viewportech. Aktuálně pravý panel **úplně mizí** pod 1280px — tablet, malý notebook i mobil ho nemají vůbec.

---

## 2. Kontext / motivace

Layout je definován v [IkarosLayout.module.css:382-404](../../../../src/app/layout/IkarosLayout/IkarosLayout.module.css#L382-L404):

```css
@media (max-width: 1280px) {
  .body { grid-template-columns: 240px 1fr; gap: ...; }
  .rightPanel { display: none; }   /* ← problém */
}
@media (max-width: 768px) {
  .body { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .hamburger { display: flex; }   /* jen pro levý drawer */
}
```

**Důsledky:**
- Pod 1280px (běžný 13" notebook, tablet na šířku) uživatel ztratí přístup k:
  - **Theme switcher** (Administrace) — nemůže přepnout skin
  - **Uživatelé/Přátelé** + pending badge (čekající žádosti)
  - **Moje světy** + tlačítko "+ Vytvořit svět"
  - **Moje diskuze** + tlačítko "+ Nová diskuze"
  - **Oblíbené články / obrázky**
- Mobilní hamburger otevírá **jen levý** drawer (Navigace, Vesmíry, Chat). Pravý panel je na mobilu úplně nedostupný.
- Decisions.md [phase-0/0.2-layout/decisions.md:25-30](../../phase-0/0.2-layout/decisions.md#L25-L30) zmiňuje pouze drawer ve `WorldLayout`, pro IkarosLayout responzivní strategie není dokumentována.

---

## 3. Řešení

Dvě rozdílné strategie pro tablet a mobil, dle uživatelského rozhodnutí (2026-05-13).

### 3.1 Tablet a malý notebook (769px–1280px)

**Zachovat 3-sloupcový layout viditelný**, zúžit oba boční panely:

```css
@media (max-width: 1280px) {
  .body {
    grid-template-columns: 220px 1fr 220px;
    gap: var(--sp-3);
    padding: var(--sp-2) var(--sp-3) var(--sp-3);
  }
  /* .rightPanel display: none ZRUŠIT */
}
```

**Důvod:** Místa je dost, uživatel vidí všechno bez dalších klikání. Zúžení z 280 → 220px je o ~22 % a panely mají krátké labely + nav items, které se v 220px pohodlně vejdou.

**Anon režim:** `.shellAnon .body` zůstává 2-sloupcový (jen sidebar + main) — anonymní uživatel pravý panel nemá tak jako tak.

### 3.2 Mobil (< 769px) — dva drawery

**Druhý drawer napravo** s vlastním tlačítkem v headeru:

- **Levé tlačítko**: `☰` hamburger (zachováno) → otevře levý drawer (Navigace, Vesmíry, Chat)
- **Pravé tlačítko**: ozubené kolo `⚙` (`Settings` ikona z `lucide-react`) → otevře pravý drawer (Administrace, Moje světy, Moje diskuze, Oblíbené)
  - Zobrazí se **jen pro přihlášené uživatele** (`isAuthenticated`), stejně jako pravý panel na desktopu
  - Pozice: pravý okraj headeru, vlevo od ostatních header tlačítek

**Drawer pravý:**
- Pozice: `position: fixed; right: 0; top: 0; bottom: 0;`
- Šířka: `var(--sidebar-w, 280px)`
- Animace: `transform: translateX(110%)` → `translateX(0)`
- Backdrop: sdílí stejný backdrop jako levý drawer (oba ho zavírají kliknutím)
- Zavře se po kliknutí na navigační item uvnitř (stejně jako levý)
- Na desktopu (`min-width: 769px`) je úplně mimo render (`display: none !important`)

### 3.3 Header tlačítka na mobilu

Stávající stav (mobil ≤ 768px): hamburger vlevo, logo, `headerNav` vpravo (Pošta, Avatar, Odhlásit — labely skryté, jen ikony).

Nový stav:
- Hamburger `☰` (vlevo, beze změny)
- Logo (beze změny)
- Pravé tlačítko `⚙` (NOVÉ, jen pro `isAuthenticated`, pozice v `headerNav` na začátku — vlevo od Pošta)
- Pošta, Avatar, Odhlásit (beze změny)

---

## 4. Acceptance kritéria

- [ ] **Desktop ≥ 1281px**: 3 sloupce 280/1fr/280, pravý panel viditelný (beze změny)
- [ ] **Tablet/malý notebook 769–1280px**: 3 sloupce 220/1fr/220, **pravý panel viditelný**, theme switcher dostupný
- [ ] **Mobil ≤ 768px**: hlavní obsah 1fr, oba sidebary skryté, **dva hamburgery v headeru** (vlevo ☰, vpravo ⚙ jen pro auth), levý drawer i pravý drawer otevíratelné
- [ ] **Anonymní uživatel** na mobilu nevidí pravé tlačítko (`⚙`) ani pravý drawer
- [ ] Po kliknutí na nav item v pravém drawer se drawer zavře
- [ ] Backdrop zavře oba drawery (klik kdekoli mimo)
- [ ] Žádný horizontální scroll v žádném viewportu
- [ ] Žádná regrese na WorldLayout (ten má vlastní drawer napravo, nemíchat)
- [ ] Test stávajících unit testů projde (pokud existují pro IkarosLayout)

---

## 5. Mimo rozsah

- Theme switcher v headeru jako compact dropdown (možný follow-up dluh — uživatel naznačil "bonus", ale do tohoto specu nepatří)
- Bottom tab bar paradigm (zamítnuto — uživatel chce drawer-based UX)
- Změna `WorldLayout` (samostatný layout s vlastními pravidly)
- Změna obsahu samotného pravého panelu (sekce zůstávají)

---

## 6. Technické poznámky

- **CSS proměnná `--sidebar-w`** se v aktuálních breakpointech přepisuje? Zkontrolovat — `var(--sidebar-w, 280px)` se používá pro grid i drawer. Pro tablet by mělo zůstat 220px jen v `.body` gridu, drawery zůstávají 280px (mobil má víc místa než 220).
- **Z-index**: pravý drawer musí mít stejný `z-index` jako levý (`calc(var(--z-overlay) + 1)`), backdrop pod nimi (`var(--z-overlay)`).
- **State**: stávající `drawerOpen` je `boolean` pro levý drawer. Přidat `rightDrawerOpen: boolean` (samostatný state, oba drawery můžou být teoreticky open současně — ale UX by je měl vzájemně zavírat? → Otevření jednoho zavře druhý, aby nevznikly dva fixed overlay panely najednou).
- **Ikona `Settings`** z `lucide-react` (už importována jinde v projektu — ověřit, nebo použít `Cog` / `SlidersHorizontal`).

---

## 7. Otevřené otázky

1. Má pravý drawer mít stejnou animaci a stejné `PanelCorners` jako desktopová varianta? → **Ano** (konzistence)
2. Má se theme switcher v pravém drawer zobrazovat jako full-width dropdown stejně jako na desktopu? → **Ano** (stávající `.themeSwitcherSlot` CSS funguje)
3. Vzájemné zavírání drawerů: má otevření pravého zavřít levý a naopak? → **Ano** (jeden overlay v daný čas)
