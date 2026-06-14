# Spec 8.x — Přepočet měny účtu (currency conversion on change)

**Status:** ✅ Implementováno (2026-06-14) — čeká BE restart + manuální smoke
**Rozsah:** **FE + BE** (nový atomický endpoint + dialog + hook).
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (backend), větev `main`
**Velikost:** odhad ~9–12 souborů. BE: service `changeCurrency` + endpoint + repo helper + DTO (~4). FE: dialog + hook + SettingsAccountSection napojení + testy (~5–8).
**Autor:** PJ + Claude
**Datum:** 2026-06-14
**Souvisí:** [spec-8.x-prep-finance-currency.md](spec-8.x-prep-finance-currency.md) (§5 out-of-scope „změna měny … neřeší přepočet historie — samostatný dluh"), [spec-11.4](../phase-11/spec-11.4.md) (sdílená currency vrstva, kurzy).

---

## 1. Cíl

Dnes změna měny účtu (Finance → Nastavení účtu → MĚNA) jen **přepíše kód měny** — zůstatek, historii ani šablony příjmů/výdajů nepřepočítá. Výsledek je matoucí: „100 000 €" se po změně na £ ukáže jako „100 000 £" (jiná hodnota, stejné číslo). 8.x-prep to vědomě odložila.

Cíl: při změně měny účet **přepočítat kurzem** (zůstatek + historie + šablony), aby PJ nemusel počítat ručně. Reálný scénář: postava přechází do jiné měnové zóny. Sekundárně ponechat „jen přeznačit" pro opravu omylem zvolené měny.

---

## 2. Audit současného stavu

| Vrstva | Dnes |
|---|---|
| **Model** | `CharacterAccount { currency: string, balance: number, transactions[], incomeEntries[], expenseEntries[] }`. `balance` = **cachovaný součet `transactions[].delta`** (atomicky `$inc` v `appendTransaction`). `FinanceTransaction` **nemá vlastní měnu** — řídí se `account.currency`. ([character-account.interface.ts](../../../../Projekt-ikaros/backend/src/modules/character-subdocs/interfaces/character-account.interface.ts)) |
| **Změna měny** | FE [SettingsAccountSection.tsx](../../../src/features/world/pages/CharacterDetailPage/components/accounts/SettingsAccountSection.tsx) → `useUpdateAccount` PATCH → BE `updateAccountSettings` jen `dbPatch.currency = patch.currency`. **Žádný přepočet.** |
| **Kurz** | `WorldCurrencyItem.rate` (relativní k první měně). Vzorec `amount * (from.rate / to.rate)` — BE [world-currencies.service.ts](../../../../Projekt-ikaros/backend/src/modules/world-currencies/world-currencies.service.ts), FE [convertAmount.ts](../../../src/features/world/currencies/shared/convertAmount.ts) (round na 4 des.). |
| **Transfer** | Blokovaný mezi různými měnami (`CURRENCY_MISMATCH`) — bez konverze. |

⚠️ **Kořen problému:** `balance = Σ delta` a transakce nemají měnu → nelze „jen přepočítat zobrazené číslo" (rozbila by se invarianta, další `$inc` by počítal špatně). Přepočet musí být **celý účet atomicky**.

---

## 3. Návrh řešení

### 3.1 Co přepočet udělá (na BE, atomicky)

Kurz `r = rate(staráMěna) / rate(nováMěna)` (= `convertAmount` faktor). Přepočítají se **všechna peněžní pole** účtu:

- `transactions[].delta` → `round(delta * r, 4)` (každá zvlášť),
- `incomeEntries[].amount` → `round(amount * r, 4)`,
- `expenseEntries[].amount` → `round(amount * r, 4)`,
- `balance` → **`Σ` přepočítaných `delta`** (drží invariantu `balance = Σ delta`; když účet nemá transakce → `round(balance * r, 4)`),
- `currency` → nový kód.

Popisky, data (`date`, `inGameDate`), `transferRef`, `performedByUserId`, `label`, `notes` se **nemění** — mění se jen částky.

> 💡 **Proč přepočítat i historii:** UI renderuje všechny transakce v aktuální měně účtu. Kdyby historie zůstala v původních číslech, staré „+100 000" by svítilo s novým symbolem £ u eurové hodnoty. Přepočet celé knihy to srovná; popisky/data zůstávají.

### 3.2 Volba při změně (dialog)

Při změně MĚNA + uložení se otevře **`ChangeCurrencyDialog`** s náhledem:

```
Změna měny účtu: EUR € → GBP £
Zůstatek:        100 000 €  →  80 000 £   (kurz 0,8)
Přepočítá se i historie transakcí a šablony příjmů/výdajů.

[ Přepočítat kurzem ]   [ Jen přeznačit ]   [ Zrušit ]
```

- **Přepočítat kurzem** (primární) → BE `changeCurrency` s `convert: true`.
- **Jen přeznačit** (sekundární) → `convert: false` (dnešní chování — jen kód).
- **Zrušit** → MĚNA select se vrátí na původní hodnotu.

**Když převod nelze** (některá měna není ve `world_currencies` nebo `rate` ≤ 0): dialog skryje „Přepočítat", ukáže hlášku *„Pro přepočet musí mít obě měny nastavený kurz ve světových měnách."* a nabídne jen „Jen přeznačit" / „Zrušit".

### 3.3 BE — atomický endpoint

- **Endpoint** `PATCH /worlds/:worldId/accounts/:accountId/currency`, body `ChangeAccountCurrencyDto { currency: string; convert: boolean }`. Gate `assertWriteSettingsAccess` (PJ+).
- **Service `changeCurrency`** (`character-accounts.service.ts`):
  - načte účet + `world_currencies` (rate lookup, reuse z 11.4),
  - `convert:false` → jen `currency` (= dnešní relabel),
  - `convert:true` → spočítá `r`; když chybí validní rate → `BadRequestException { code:'CURRENCY_RATE_MISSING' }`; jinak přepočítá pole dle §3.1,
  - zápis **jednou** atomicky (nový repo helper `replaceMoneyFields(accountId, { currency, balance, transactions, incomeEntries, expenseEntries })` přes `findByIdAndUpdate $set`).
- Currency se **vyřadí** z generického `updateAccountSettings` toku z UI (jde výhradně přes tento endpoint); BE pole tam může zůstat (nepoužité z FE).

### 3.4 FE napojení

- **Hook** `useChangeAccountCurrency(worldId, accountId)` — PATCH `/currency`, invalidace jako ostatní account mutace.
- **`ChangeCurrencyDialog`** — props `{ account, targetCurrency, currencies, onClose }`; náhled přes `convertAmount` (FE), 3 tlačítka, gate převodu dle dostupnosti kurzu.
- **`SettingsAccountSection`** — `handleSaveSettings`: ostatní pole uloží jako dnes (bez `currency`); když se `currency` liší → otevře `ChangeCurrencyDialog` (místo tichého uložení měny). Po úspěchu toast „Měna změněna" / „Přepočítáno kurzem: 100 000 € → 80 000 £".

---

## 4. Out of scope

- **Marker transakce „Přepočet měny"** v historii (delta-0 by re-zaváděl matoucí nulové řádky z 8.x-prep B2). Audit = změna částek + toast.
- **Zpětný přesný round-trip** (€→£→€ může lišit o zaokrouhlení) — akceptováno (4 des. místa).
- **Hromadný přepočet více účtů** najednou.
- **Auto-přepočet při změně `rate`** ve světových měnách (kurzy se mění → existující účty se nepřepočítají).
- **Sdílení měny u transferu** (`CURRENCY_MISMATCH` zůstává — po převodu účtu na £ nepůjde transfer na € účty).

---

## 5. Acceptance kritéria

1. Změna MĚNA + Uložit → otevře `ChangeCurrencyDialog` s náhledem (starý → nový zůstatek + kurz).
2. „Přepočítat kurzem" → BE atomicky přepočítá `balance` + všechny `transactions[].delta` + `incomeEntries/expenseEntries[].amount` + nastaví `currency`; `balance == Σ delta` drží.
3. „Jen přeznačit" → změní jen `currency` (dnešní chování).
4. „Zrušit" → MĚNA select se vrátí, nic se neuloží.
5. Když některá měna nemá platný kurz → dialog nabídne jen „Jen přeznačit"; BE convert vrátí `CURRENCY_RATE_MISSING` (403/400 gate jistota).
6. Endpoint `PATCH …/accounts/:id/currency` je PJ-only (`assertWriteSettingsAccess`); hráč → 403.
7. Popisky, data (`date`/`inGameDate`), `transferRef` transakcí se přepočtem nemění — jen částky.
8. Historie v UI po převodu zobrazuje přepočítané částky v nové měně konzistentně (žádná stará hodnota s novým symbolem).
9. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓ (FE); BE `typecheck`+`lint:check`+`jest --maxWorkers=2` ✓.
10. `mobil-desktop` (dialog na 375 px) + `napoveda` (krátká zmínka u Finance). **Po BE změně restart.**

---

## 6. Test plán

### BE (Jest, `character-accounts.service.spec`)
- `changeCurrency convert:true` — přepočítá balance + deltas + entries správným `r`; `balance == Σ delta`.
- `convert:false` — jen currency, částky beze změny.
- chybějící/0 rate → `CURRENCY_RATE_MISSING`.
- hráč → 403 (settings gate).
- účet bez transakcí → `balance = round(balance*r)`.

### FE (Vitest)
- `ChangeCurrencyDialog` — náhled převodu (convertAmount), 3 akce; bez kurzu skryje „Přepočítat".
- `SettingsAccountSection` — změna currency otevře dialog; stejná currency neotevře.
- `useChangeAccountCurrency` — volá správný endpoint + invaliduje.

### Manuální smoke
1. Účet 100 000 € → změň na £ (kurz 0,8) → „Přepočítat" → zůstatek 80 000 £, historie „Krypto +80 000 £".
2. Totéž → „Jen přeznačit" → 100 000 £ (čísla beze změny).
3. Měna bez kurzu → dialog jen „Jen přeznačit".
4. Mobil 375 px → dialog čitelný, tlačítka wrap.

---

## 7. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Zaokrouhlení rozhodí `balance = Σ delta` | Nízká | Střední | `balance := Σ` přepočítaných delta (ne nezávislý round) → invarianta drží. |
| Přepočet přepíše historii (částky) nevratně | Jistota (záměr) | Střední | Explicitní dialog s náhledem + „Jen přeznačit"; popisky/data zůstávají. |
| Účet s legacy měnou mimo `world_currencies` | Střední | Nízký | Convert nedostupný → relabel only + hláška. |
| Po převodu nejde transfer na účty staré měny | Jistota | Nízký | Existující pravidlo; zmíněno v dialogu/nápovědě. |
| BE běží starý bundle | Střední | Nízký | restart (memory `feedback_be_restart_required`). |

**Rollback:** revert FE+BE commitu. Přepočet je jednorázová datová operace na účtu — rollback kódu nevrací už přepočítané účty (PJ může přepočítat zpět opačným kurzem). Aditivní endpoint, žádné schema změny.

---

## 8. Otevřené otázky

Rozhodnuto (2026-06-14): převod je **hlavní akce** s potvrzovacím dialogem a náhledem; „jen přeznačit" sekundárně; přepočítá se **celý účet** (zůstatek + historie + šablony) kurzem ze světových měn.

---

**Po schválení specu napíšu implementační plán** (BE atomický `changeCurrency` → FE dialog + hook + napojení → testy; BE/FE odděleně).
