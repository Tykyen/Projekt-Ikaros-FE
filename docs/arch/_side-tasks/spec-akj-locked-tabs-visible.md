# Delta-spec — AKJ záložky: „ukaž zamčené" místo „skryj nedostupné"

**Status:** ✅ IMPLEMENTOVÁNO (2026-06-11). BE `filterAkjTabsForViewer` (map+locked, isBroadcastableAkjTab/lockedAkjTab), `AkjTab.locked`, BE testy přepsány (45/45). FE `AkjLockedPanel` + sdílený `useAkjArchiveTitle`, ikona Lock/Unlock ve 3 render-místech, editor bez „Minimální role". Nápověda (Faq/World/Start) aktualizována.
**Datum:** 2026-06-11
**Autor:** PJ + Claude
**Mění:** [spec-akj-protected-tabs.md](spec-akj-protected-tabs.md) — obrací jeho jádrové rozhodnutí (sekce §2.A „nic nevidíš, ani o existenci", §4.1, §5.1).
**Rozsah:** BE gate (jádro) + 3 FE render-místa + editor + typy + testy.

---

## 1. Změna v jedné větě

Dnes BE **vymaže** nedostupné AKJ záložky z response. Nově je **pošle zamčené** (jen `name + order + locked + úroveň`, **bez obsahu**) — hráč je vidí v liště se zámkem 🔒, a 🔓 u těch, na které dosáhl.

💡 **Proč to musí řešit BE:** kdyby FE dostal obsah a jen ho schoval, hráč si tajný text přečte v DevTools. Bezpečnost zůstává BE-enforced — obsah zamčené záložky se ke klientovi **vůbec nepošle**.

---

## 2. Které záložky se ukazují zamčené (klíčové rozhodnutí)

> **Záložka se pošle zamčená ⟺ má aspoň jednu `AKJ` (clearance) podmínku a žádnou `Role` podmínku.**
> Vše ostatní zůstává **úplně skryté** jako dnes.

Mapuje se na mentální model PJ: *„záložka s číslem clearance = veřejně viditelná záhada; záložka bez čísla = skrytá."*

| Typ záložky | `access` | Hráč bez práv vidí |
|---|---|---|
| In-fiction AKJ (clearance) | `AKJ:12` | 🔒 zamčená (jméno + „úroveň 12") |
| AKJ + jmenovité klíče | `AKJ:5` + `UserId:…` | 🔒 zamčená (klíče se NEposílají) |
| „PJ informace" (preset) | `Role:PomocnyPJ` | nic (skryté) |
| „Soukromé" (preset, PC) | `[]` prázdné | nic (skryté) |
| Jen jmenovitý klíč bez clearance | `UserId:…` | nic (skryté) |

⚠️ **Důsledek — leak jména.** Zamčené záložky odhalí svůj **název**. „AKJ 12" neškodí, ale PJ pojmenovaný „Vrah je Petr" vyzradí pointu. Záměr uživatele; do editoru přidám varování.

⚠️ **PC stránky.** Cizí hráč u cizí postavy uvidí její clearance záložky zamčené (odhalí, že PC má tajemství úrovně N). Vlastník je vidí odemčené (owner-výjimka beze změny). Bereme jako přijatelné/zamýšlené.

---

## 3. Backend

### 3.1 `filterAkjTabsForViewer` (pages.service.ts:731)
Místo `filter` → `map`:

```
seesAll (PJ/Admin) → vrať vše odemčené (beze změny)
jinak pro každou tab:
  canSee = passesAccess(tab) || ownerException
  if canSee:        → tab beze změny (locked:false, plný obsah)
  else if broadcastable(tab):  → STRIPPED: { id, name, order, locked:true,
                                  access: jen AKJ-reqs }  // bez UserId/Role/contentOverride/ownerHidden
  else:             → vynech (jako dnes)

broadcastable = tab.access má ≥1 {type:'AKJ'} a žádný {type:'Role'}
```

- `locked` je **computed, neukládá se** → žádná změna schématu. Pozor jen, aby response shape (DTO/serializace) `locked` nezahodila ([[project_be_field_checklist]] — read path).
- Stripped záložka nese v `access` **jen `AKJ` podmínky** → existující banner umí zobrazit „úroveň N", a neunikne, kteří hráči mají klíč.
- Aktualizovat `pages.service.spec.ts` (dnešní testy tvrdí opak — nedostupné se mažou).

### 3.2 Přímý odkaz na zamčenou záložku
Beze změny — `GET` na konkrétní URL stále 403 / „zašifrováno" (D-062a).

---

## 4. Frontend

### 4.1 Typ
`AkjTab` (pages.types.ts): přidat `locked?: boolean;`. (`contentOverride` u locked chybí → resolve nemá co dědit.)

### 4.2 Render (3 místa, sjednotit)
[WithAkjTabs](src/features/world/pages/PageViewer/components/WithAkjTabs.tsx), [PostavaLayout](src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx), [LokaceLayout](src/features/world/pages/PageViewer/layouts/LokaceLayout.tsx) — všechny tři dělají `sortedAkjTabs().map(... icon:<Lock/>)` + `resolveAkjTabPage`:

- **Ikona:** `locked ? <Lock/> : <Unlock/>`. (Dnes vždy `<Lock/>` — stane se z toho skutečný indikátor stavu.)
- **Obsah aktivní záložky:** `locked ? <AkjLockedPanel level={…}/> : <OstatniLayout page={resolveAkjTabPage(…)}/>`.
- `AkjLockedPanel` = inline „zašifrováno, úroveň N" — reuse stylu [AccessDenied](src/features/world/pages/PageViewer/components/AccessDenied.tsx) / [AkjDecryptedBanner](src/features/world/pages/PageViewer/components/AkjDecryptedBanner.tsx), úroveň z `tab.access` (AKJ req). Přesnou formu doladí impl. plán.

💡 Logiku `locked` nikdy nepočítá FE — bere hotový flag z BE (autorita zůstává na serveru).

### 4.3 Editor — `AkjTabsPanel.tsx`
- **Odebrat dropdown „Minimální role"** (řádky ~283–299) + nevyužitý `roleOf` helper. Typ `Role` v datech **zůstává** — preset „PJ informace" (`freshTab('pj')`) ho píše přímo, beze změny.
- Hint rozšířit: *„Záložky s číslem clearance hráč uvidí v liště zamčené (vč. názvu). Bez čísla zůstávají skryté."*
- (volitelně) per-záložka mikro-indikátor „bude hráčům vidět zamčená", když má clearance.

---

## 5. Po implementaci
- `mobil-desktop` (swap ikony + locked panel na mobilu/desktopu).
- `napoveda` (hráč nově vidí zamčené AKJ — změna chování, kterou musí znát).
- Zaškrtnout v roadmapě / uzavřít případný dluh.

---

## 6. Mimo rozsah
- Žádná změna clearance modelu ani owner-výjimky.
- „PJ informace" / „Soukromé" presety beze změny chování (zůstávají skryté).
- Žádná datová migrace (locked je runtime).
