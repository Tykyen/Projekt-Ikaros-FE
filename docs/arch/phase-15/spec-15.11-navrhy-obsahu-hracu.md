# Spec 15.11 — Návrhy obsahu hráčů (pending stránky ke schválení PJ)

**Stav:** ✅ SCHVÁLENO v1 (2026-07-16) — čeká na implementační plán · **Fáze:** 15 · **Rozsah:** FE + BE — velké (nový životní cyklus stránky `pageStatus`) · **Potvrzeno:** pending NPC nejde spawnovat na TM ani mentionovat v chatu (jen `approved`).
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE) · **Autor:** PJ + Claude · **Datum:** 2026-07-16
**Souvisí:** [15.10 správa hráčů](spec-15.10-sprava-hracu-jeskyne.md) (recykluje multi-typ frontu „ke zpracování"), pages modul, `assertCanWrite`/`assertAccess`

---

## 1. Cíl

Hráč (člen role **Hráč+**) smí **navrhovat vlastní obsah** — NPC, lokace, wiki stránky, galerie, rodokmeny — které vzniknou jako **pending** (viditelné jen jemu + PJ). PJ je pak **schválí, upraví nebo vrátí k přepracování**. Dnes stránky tvoří jen PomocnyPJ+; tohle otevírá řízenou spoluúčast hráčů na světě.

---

## 2. Kontext / motivace

Citace testera (2026-07-16): *„Ve chvíli, kdy hráč je již hráčem, má možnost vytvářet pro schválení vlastní NPC a jiné stránky. Musí je ale PJ schválit či případně upravit."*

Je to **živá pending stránka se schvalováním** — mechanika, kterou [15.10 fáze C](spec-15.10-sprava-hracu-jeskyne.md) u *vstupu* odložila (nečlen by pending stránku v soukromém světě sám nepřečetl). **Tady je autor už členem** → svět vidí → problém viditelnosti mizí a jde to udělat naplno.

---

## 3. Audit současného stavu (ověřeno v kódu)

- **Tvorba stránek = PomocnyPJ+.** `pages.service.ts:1265-1290` `assertCanWrite`: `worldAdminBypass || membership.role >= PomocnyPJ(4)`, jinak 403 `PAGE_FORBIDDEN`. Volá `create`/`update`/`delete`. **Hráč (Hrac=2) dnes nevytvoří nic.**
- **FE tlačítka „Nová stránka/postava" PJ-only** (`CharacterDirectory.tsx:165`, `WorldLayout` `+ Nová stránka` `isPJ`).
- **Page nemá stav.** `page.interface.ts` / `page.schema.ts` — žádné `pageStatus`/`draft`/`approved`. Stránka je živá hned. (15.10 var. A `characterStatus` **nezavedla** — postava vzniká už approved.)
- **Viditelnost:** `assertAccess` (`pages.service.ts:1114-1159`) — hlavní per-page gate. **Past:** stránka s prázdným `accessRequirements` → early-return na ř. 1129 (pustí všem). Gate pro pending musí být PŘED ním. `findDirectory` (`:693-756`) `assertAccess` **NEvolá** → druhá, oddělená cesta.
- **Typy Page** (`PAGE_TYPES`): Lokace, Noviny, Seznam, Galerie, Zoom, Rodokmen, Obrazovka, Ostatní, Postava hráče, NPC.
- **Vzor „obsah ke schválení":** `ArticlePendingReview` (ikaros-articles) — pending-action provider + renderer. Platformový; pro světové stránky = analogický **world-scoped** provider.
- **Multi-typ fronta (15.10):** `WorldPendingActionItem.type` union + `getWorldPendingActions` + `RequestsList` už existují → **rozšířit o `page-review`**.

---

## 4. Návrh řešení

### 4.0 Rozhodnutí (potvrzeno 2026-07-16)

| # | rozhodnutí | volba |
|---|---|---|
| R1 | **Které typy hráč navrhuje** | **whitelist:** `NPC` · `Lokace` · `Ostatní` · `Seznam` (obecné wiki) · `Galerie` · `Rodokmen`. NE `Postava hráče` (řeší 15.10 „Chci hrát"), NE `Noviny`/`Obrazovka`/systémové. |
| R2 | **Kdo smí navrhovat** | **role Hráč (`Hrac`=2)+** (tj. Hrac, Korektor, PomocnyPJ, PJ). Čtenář/Žadatel ne. |
| R3 | **Stav stránky** | nové pole **`pageStatus: 'pending' \| 'approved'`** na Page (obecné). Default **`approved`** (legacy + PJ/staff tvorba). Hráčem (přesně role `Hrac`) tvořená = `pending`. |
| R4 | **Relaxace brány** | člen role ≥ `Hrac` smí `create` Page **whitelisted typu (R1)** s `pageStatus='pending'`, `ownerUserId=self`. Update jen dokud `pending` a je autor. Jiný typ / cizí owner / non-pending → normální brána (≥ PomocnyPJ). PomocnyPJ+ tvoří rovnou `approved` (dnešní chování). |
| R5 | **Viditelnost pending** | `pending` stránku vidí **jen autor (`ownerUserId`) + moderátor (role ≥ PomocnyPJ / owner světa / elevovaný admin)**. Gate v `assertAccess` PŘED early-return (ř. 1129) + filtr ve `findDirectory`. 404 skryje existenci. |
| R6 | **Schvalovací fronta** | pending stránky = nový typ **`page-review`** v multi-typ frontě „ke zpracování" (15.10): world-scoped `getWorldPendingActions` + world-scoped listing; PJ vidí na stránce Hráči / v draweru / zvonečku. |
| R7 | **PJ akce** | **Schválit** → `pageStatus='approved'` (živé). **Upravit** → otevře stránku v editoru (moderátor smí editovat i pending), pak Schválit. **Odmítnout** → **vrátit k přepracování** (zůstane `pending`, autor doladí a znovu „Odeslat"); volitelně **Zahodit** (smaže Page). |
| R8 | **Odeslání ke schválení** | hráč vytvoří pending → rovnou je ve frontě (žádný extra „odeslat"). Edituje dokud `pending`. (Zjednodušení: pending = čeká na PJ; žádný samostatný `draft` stav.) |

### 4.1 Fáze E1 — BE

- **`pageStatus`** (field-checklist [project_be_field_checklist]): `page.interface.ts` · `page.schema.ts` (`@Prop enum ['pending','approved']`, **bez default**) · `pages.repository.ts` `toEntity` (**fallback `'approved'`** pro legacy) · `findDirectory` projekce. **NE do `CreatePageDto`** (status řídí service, ne klient).
- **Relaxace `create`** (R4): v `create` větvit — typ ∈ whitelist & požadováno `pending` & role ∈ [Hrac, PomocnyPJ)? → místo `assertCanWrite` relaxovaný check (`membership.role >= Hrac`, svět aktivní), **server-set** `ownerUserId=requester.id` + `pageStatus='pending'`. Jinak `assertCanWrite` (≥ PomocnyPJ) → `pageStatus='approved'`.
- **Relaxace `update`** (R4): autor smí editovat vlastní `pending` stránku (whitelisted typ). Jiné → `assertCanWrite`.
- **Viditelnost** (R5): v `assertAccess` PŘED ř. 1129 blok „pending → jen autor + moderátor, jinak 404"; `findDirectory` map filtr drop pending pro ne-autora/ne-moderátora + `pageStatus` do projekce.
- **Schválení/vrácení:** `POST /worlds/:worldId/pages/:slug/approve` (moderátor → `pageStatus='approved'`) · `.../reject` (`mode: 'rework' | 'discard'`). Emit `world.page-review.*`.
- **`PageReviewProvider`** (world-scoped) + `page-review` v `getWorldPendingActions` (multi-typ). Item: `{ type:'page-review', id(slug), userId(author), displayName, pageTitle, pageType, createdAt }`.
- Testy: relaxace (whitelist typ / role Hrac / cizí owner → 403) · viditelnost pending (autor+moderátor vidí, cizí 404, findDirectory filtr) · approve/reject · default approved legacy.

### 4.2 Fáze E2 — FE

- **„Navrhnout stránku/NPC"** — hráči (role Hrac+) zpřístupnit `NewPageWizardModal` **omezený na whitelist typů (R1)**; z adresáře postav (NPC) + z wiki/index. Odešle create → pending.
- **Pending indikace:** hráč vidí svou pending stránku (badge „Čeká na schválení PJ"), edituje ji; po schválení badge zmizí.
- **`page-review` renderer** ve world-scoped `RequestsList` (stránka Hráči / drawer / zvoneček): náhled (odkaz na pending stránku) + **Schválit** / **Upravit** (→ editor) / **Odmítnout** (rework/discard). Renderer `PageReviewRenderer`. *(Globální „Zpracovat" tab pro page-review vynechán — world-scoped fronta v kontextu světa pokrývá PJ; viz Out of scope.)*
- Realtime: WS `world:page-review-*` → invalidace fronty.

---

## 5. Out of scope

- Samostatný `draft` autosave stav (V1: pending = čeká na PJ).
- Návrhy **Postavy hráče** (řeší 15.10 „Chci hrát"), Novin, systémových stránek (Pravidla/Magie…), taktických map, obchodu.
- Verzování / diff návrhu vs. schváleného.
- Per-svět nastavení „hráči smí/nesmí navrhovat" (V1: vždy zapnuto pro Hráč+; per-svět toggle = pozdější).
- Návrhy úprav **existujících** (approved) cizích stránek (V1: jen tvorba nových vlastních).

---

## 6. Acceptance kritéria

1. Hráč (role Hrac) vytvoří NPC/Lokaci/wiki/Galerii/Rodokmen → vznikne `pending`, `ownerUserId`=on; v seznamech/wiki ji **ostatní hráči nevidí**, autor + PJ ano.
2. Hráč nevytvoří `Postavu hráče` cizí / systémový typ / mimo whitelist → normální brána (403 pokud < PomocnyPJ).
3. Pending stránku (i přes přímý slug) **cizí hráč nepřečte** → 404; v adresáři/directory se neukáže.
4. PJ vidí návrh ve frontě „ke zpracování" (`page-review`) na stránce Hráči / draweru / zvonečku.
5. PJ **Schválí** → `pageStatus='approved'`, stránka je živá pro všechny dle běžných pravidel; zmizí z fronty.
6. PJ **Upraví** → otevře editor pending stránky, uloží, schválí.
7. PJ **Odmítne (rework)** → zůstane `pending`, autor edituje a je zpět ve frontě; **Zahodit** → Page smazána.
8. Legacy stránky (bez `pageStatus`) + PJ/PomocnyPJ tvorba = `approved` (viditelné jako dnes, žádná regrese).

---

## 7. Test plán

- **BE:** relaxace create (whitelist × role × owner) · update autor pending · viditelnost pending (assertAccess 404 cizí, findDirectory filtr, autor+moderátor OK) · approve → approved · reject rework/discard · `page-review` v getWorldPendingActions · default approved legacy · `PageReviewProvider` scope.
- **FE:** wizard omezený na whitelist pro Hráče · pending badge + edit · `PageReviewRenderer` (schválit/upravit/odmítnout) · fronta multi-typ.
- **Manuál:** `mobil-desktop` · `auth-policy` (pending leak) · `socket-contract` (page-review WS) · `type-sync`.

---

## 8. Riziko & rollback

| riziko | mitigace |
|---|---|
| Relaxace brány = hráč zapisuje do světa (abuse) | úzká výjimka: JEN whitelist typ, `owner=self`, `pending`, role ≥ Hrac, svět aktivní; e2e authz test cizí owner/typ/role → 403 |
| Pending stránka unikne cizímu hráči | gate v `assertAccess` PŘED early-return 1129 + `findDirectory` filtr; e2e leak test cizím hráčem přes obě cesty |
| `pageStatus` default rozbije legacy | default `approved`, chybějící = approved; test starých stránek |
| NPC pending v taktické mapě / chatu (dangling) | pending NPC nesmí jít spawnovat/mentionovat — ověřit token/mention cesty (spawn jen approved) |

**Rollback:** aditivní (`pageStatus` + endpointy + relaxace). Rollback = skrýt hráčské „Navrhnout" tlačítko + vrátit `assertCanWrite` bez výjimky; `pageStatus` chybějící = approved → staré stránky OK.

---

## 9. Otázky k autorovi — VYŘEŠENO (2026-07-16)

1. **Typy:** ✅ NPC · Lokace · Ostatní/Seznam · **Galerie** · **Rodokmen**.
2. **Kdo:** ✅ jen **role Hráč (2)+**.
3. **Odmítnutí:** ✅ **vrátit k přepracování** (+ PJ smí upravit; volitelně Zahodit).

---

## 10. Návaznost (po implementaci)

`funkce` (nová schopnost: hráč tvoří pending obsah, `pageStatus` životní cyklus, relaxace brány, page-review fronta, změna oprávnění) + `napoveda` (hráčský výtah: jak navrhnout NPC/stránku, jak PJ schvaluje). Recykluje 15.10 frontu.
