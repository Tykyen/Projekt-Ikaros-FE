# 05 — Svět: postavy / bestiář / ekonomika

Doména s nejsilnějším **ownership** rozměrem: hráč pracuje s **vlastní** postavou / tokenem / nákpem /
účtem — ne cizími. A s **field-level** granularitou: účet postavy má 4 různé prahy (read / write-content /
write-settings / delete) nad jedním zdrojem. Plus `OR` blokery (N-22 obchod prázdný pro hráče, N-23
refund gating, N-24 multi-postava). Bestiář přidává **3-scope** model (system/user/world) s vlastními
pravidly per scope.

**BE:** `characters`, `character-subdocs` (accounts, diary, notes, persona, location, calendar),
`bestiae`, `world-currencies`, `campaign` (shop, purchases)
**FE:** `features/world` — CharacterDirectory, character detail, Bestiar, ShopView, MyPurchasesPanel, Currency

> Sourozenec [bug-plan/09-svet-postavy](../bug-plan/09-svet-postavy.md). Tady role/ownership/field hrany.

---

## A. Postavy — správa vs vlastnictví (`PA` `OW`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PO-01 | `create`/`update`/`delete` postavy → `assertCanManage` ([characters.service.ts:66]) = GlobalAdmin \|\| role>=**PJ(5)**. Pozor: postavy spravuje **PJ**, ne PomocnyPJ. Ověřit, že FE gating to drží (PomocnyPJ nevidí create/edit postavy?) `[auto]` | `PA` `EN` | M2 | ⬜ |
| PO-02 | `findBySlug` ([characters.service.ts:89]) — PomocnyPJ+ \|\| **owner** → plná postava; ostatní → public view. Ověřit, že hráč vidí plně **svou** postavu, ale jen public **cizí** `[auto]` | `OW` | M1 | ⬜ |
| PO-03 | Red-team: hráč `PATCH /characters/:cizíSlug` (cizí postava) → 403 (assertCanManage = PJ-only stejně, ale ověřit, že ani owner-hráč needituje skrz manage cestu) `[auto]` | `OW` | M8 | ⬜ |

---

## B. Subdokumenty postavy (`OW` field-level)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PO-04 | `assertSubdocAccess` ([characters.service.ts:123]) — **Lokace**: PomocnyPJ+ only (404 bez membership); **Persona**: PomocnyPJ+ \|\| owner. Různá pravidla per subdoc-typ. Ověřit každý typ (diary/notes/persona/location/calendar) `[auto]` | `OW` | M4 | ⬜ |
| PO-05 | **N-10 (bug-audit) regrese:** `assertSubdocAccess` má respektovat `action` (read vs write). GET kalendáře Lokace pro hráče = read → member; write → PomocnyPJ+. Ověřit, že GET nehází 403 hráči (spec 9.2) `[auto]` | `OW` `OR` | M1 | ⬜ |
| PO-06 | Deník/poznámky (CharacterNotes) — hráč čte/píše **vlastní**; PJ vidí. Red-team: hráč GET cizí deník → 403/404 `[auto]` | `OW` | M8 | ⬜ |

---

## C. Účet postavy — 4 prahy nad jedním zdrojem (P1 field-level `OW`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PO-07 | `assertReadAccess` ([character-accounts.service.ts:590]) = Staff(PomocnyPJ+) \|\| account owner. Hráč čte **svůj** účet, ne cizí `[auto]` | `OW` | M4 | ⬜ |
| PO-08 | `assertCanAdjust` ([:303]) = Staff \|\| (owner && `allowPlayerSelfAdjust`). N-23: FE skryje „Storno/Upravit" hráči bez práva. Ověřit paritu (FE gating dle `isStaff \|\| allowPlayerSelfAdjust`) `[auto]` | `OW` `PA` | M2 | ⬜ |
| PO-09 | `assertWriteSettingsAccess` ([:609]) = **Staff only** (PomocnyPJ+). Nastavení účtu (allowPlayerSelfAdjust) hráč **nesmí** měnit — jinak by si self-adjust povolil sám (eskalace!) `[auto]` | `ES` `OW` | M8 | ✅L2 (controller [:168] volá assert před update; staff-only [:615]) — **ALE** viz R-02 (bez GlobalAdmin bypassu; „jen PJ" = fakticky PomocnyPJ+) |
| PO-10 | `assertDeleteAccess` ([:622]) = Staff \|\| **primary** owner. Ověřit, že ne-primary owner nesmaže účet `[auto]` | `OW` | M1 | ⬜ |

### P1 sub-matice: účet postavy × persona

| operace / persona | owner-hráč (allowSelfAdjust=false) | owner-hráč (=true) | Staff (PomocnyPJ+) | PJ | cizí hráč |
|---|---|---|---|---|---|
| read (`assertReadAccess`) | ✅ | ✅ | ✅ | ✅ | ⛔ |
| adjust (`assertCanAdjust`) | ⛔ | ✅ | ✅ | ✅ | ⛔ |
| write-content | ✅? | ✅ | ✅ | ✅ | ⛔ |
| write-settings (`allowSelfAdjust` toggle) | ⛔ | ⛔ | ✅ | ✅ | ⛔ |
| delete | ✅ᵖ | ✅ᵖ | ✅ | ✅ | ⛔ |

`ᵖ` jen **primary** owner. ⚠️ PO-09 je kritický: kdyby hráč směl write-settings, povolí si self-adjust → eskalace.

---

## D. Obchod & nákupy (`OR` `OW`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PO-11 | **N-22 regrese:** `resolveShopScope` ([campaign.service.ts:93-101](../Projekt-ikaros/backend/src/modules/campaign/campaign.service.ts#L93)) — hráč musí vidět `isShared` položky PJ, ne prázdno. Ověřit, že obchod není pro hráče prázdný (herní bloker) `[auto]` | `OR` | M3 | ✅L2 (hráč<PomocnyPJ → `{worldId, isShared:true}`) |
| PO-12 | **N-24 regrese:** `listPurchases` ([campaign-purchase.service.ts:273-295](../Projekt-ikaros/backend/src/modules/campaign/services/campaign-purchase.service.ts#L273)) pro hráče vrací nákupy **všech** jeho postav (`$in: ids`); cizí `characterId` ignorován (IDOR-safe) `[auto]` | `OW` `OR` | M3 | ✅L2 |
| PO-13 | Storno nákupu → `adjust`/`assertCanAdjust`. Red-team: hráč stornuje **cizí** nákup → 403 `[auto]` | `OW` | M8 | ⬜ |
| PO-14 | Vytvořit/editovat shop item → PJ (campaign create = PJ). Ověřit, že hráč/PomocnyPJ nevytvoří položku `[auto]` | `PA` | M1 | ⬜ |
| PO-15 | FE `MyPurchasesPanel` — „Storno" tlačítko gated `isStaff \|\| allowPlayerSelfAdjust` (N-23); jinak „storno u PJ". Parita s BE `assertCanAdjust` `[auto]` | `PA` `OR` | M2 | ⬜ |

---

## E. Měny (`PA` `EN`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PO-16 | `world-currencies` — `assertCanAdmin` ([:185]) = PJ(5) pro add/remove měny; `assertCanEdit` ([:211]) = PomocnyPJ(4) pro metadata-only. **Dva prahy** nad měnami. Ověřit, že FE nerozhazuje (add=PJ, edit=PomocnyPJ) `[auto]` | `EN` `PA` | M2 | ⬜ |
| PO-17 | `assertMember` ([:167]) — čtení měn = každý člen. Zadatel → 403 `[auto]` | `PA` | M4 | ⬜ |

---

## F. Bestiář — 3-scope (`PA` `OW` `BY`)

| # | Bod | Osa | Metoda | Status |
|---|-----|-----|--------|--------|
| PO-18 | `assertCanRead` ([bestiae.service.ts:195]): scope `system`→všichni; `user`→owner \|\| GlobalAdmin; `world`→GlobalAdmin \|\| member. Ověřit každý scope `[auto]` | `OW` `PA` | M4 | ⬜ |
| PO-19 | `assertCanWrite` ([:216]): `system`→**GlobalAdmin only**; `user`→owner; `world`→`assertCanManageWorld` (PomocnyPJ+). Red-team: hráč zapíše system bestii → 403 `[auto]` | `ES` `OW` | M8 | ✅L2 ([bestiae.service.ts:220-232](../Projekt-ikaros/backend/src/modules/bestiae/bestiae.service.ts#L220) — system=GlobalAdmin, user=owner, world=PomocnyPJ+; hráč na system → 403) |
| PO-20 | Red-team: hráč edituje **cizí** `user`-scope bestii → 403 (`OW`) `[auto]` | `OW` | M8 | ⬜ |
| PO-21 | Spawn bestie na mapu = snapshot (paměť: bestie token = nezávislá instance). Ověřit, že spawn respektuje membership (řeší oblast 07) `[auto]` | `PA` | M1 | ⬜ |

---

## G. Matice persona × akce (postavy/ekonomika)

| Akce / persona | guest | Zadatel | Ctenar | Hrac | Korektor | PomocnyPJ | PJ | GlobalAdmin |
|---|---|---|---|---|---|---|---|---|
| číst public postavu | 🚫 | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| číst plně **vlastní** postavu | — | — | ✅ᵒ | ✅ᵒ | ✅ᵒ | ✅ | ✅ | ✅ |
| editovat postavu | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| číst **vlastní** účet | 🔒 | ⛔ | ✅ᵒ | ✅ᵒ | ✅ᵒ | ✅ | ✅ | ✅ |
| adjust vlastní účet | 🔒 | ⛔ | ✅ˢ | ✅ˢ | ✅ˢ | ✅ | ✅ | ✅ |
| měnit `allowSelfAdjust` | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| vidět položky obchodu | 🔒 | ⛔ | ✅ᶠ | ✅ᶠ | ✅ᶠ | ✅ | ✅ | ✅ |
| stornovat **vlastní** nákup | 🔒 | ⛔ | ✅ˢ | ✅ˢ | ✅ˢ | ✅ | ✅ | ✅ |
| stornovat **cizí** nákup | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ✅ |
| add/remove měnu | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| zapsat **system** bestii | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |

`ᵒ`=vlastní, `ˢ`=jen když `allowSelfAdjust`/staff, `ᶠ`=jen `isShared` položky (N-22).

> **Delta parity (postavy/ekonomika):**
> - PO-09 write-settings hráč — **⚠️ red-team** (eskalace: self-povolit adjust)
> - PO-11 obchod prázdný — **✅** (N-22), PO-12 multi-postava **✅** (N-24) — potvrdit
> - PO-08/15 refund gating — FE `isStaff||allowSelfAdjust` ↔ BE `assertCanAdjust` · **✅** (N-23)
> - PO-01 postavy=PJ ne PomocnyPJ — **ověřit FE práh** (riziko, že FE pustí PomocnyPJ)
> - ostatní → vyplnit.

---

## Test coverage gaps

- PO-09 write-settings eskalace (hráč si povolí self-adjust) — red-team M8, žádný test.
- `assertSubdocAccess` per-typ × action (PO-04/05) — N-10 fix, ověřit pokrytí všech subdoc typů.
- Bestiae 3-scope × role × ownership (PO-18/19/20) — kompletní matice testů.
- FE `MyPurchasesPanel` gating (PO-15) — N-23 má test, ověřit.

---

## Známá rizika

- **RE-1 (`ES`/PO-09)** — **nejkritičtější:** kdyby hráč směl `write-settings` účtu, povolí si
  `allowPlayerSelfAdjust=true` a obejde N-23 gating. Last line = `assertWriteSettingsAccess` (Staff only).
  Red-team povinný.
- **RE-2 (`OR`/PO-11/12)** — herní blokery: prázdný obchod / chybějící nákupy postav. FE může vypadat
  funkčně, ale hráč nic nekoupí/nestornuje. Stejně závažné jako leak.
- **RE-3 (`EN`/PO-01/16)** — různé prahy uvnitř domény (postavy=PJ, měny add=PJ/edit=PomocnyPJ, subdoc per-typ).
  Snadné, aby FE sjednotil na jeden práh a buď pustil moc (ES), nebo schoval moc (OR).
