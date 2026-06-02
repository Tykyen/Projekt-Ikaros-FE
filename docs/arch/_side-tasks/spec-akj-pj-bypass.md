# Side-task — AKJ read gate: bypass pro PomocnyPJ+ a platform Admin+

**Status:** ✅ IMPLEMENTOVÁNO (2026-06-02) — typecheck + lint čisté, 32 BE testů zelených (3 nové)
**Souvisí s:** [spec-akj-shielded-existence.md](spec-akj-shielded-existence.md), [pages.service.ts](../../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts) `assertAccess`
**Rozsah:** BE only (~1 metoda + 2 signatury + 2 controller volání + testy)
**Autor:** PJ + Claude
**Datum:** 2026-06-02

---

## 1. Problém

`assertAccess` ([pages.service.ts:571](../../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts)) vyhodnocuje `accessRequirements` (AKJ úroveň / role / userId) čistě podle `membership.akj`. **Nemá výjimku pro PJ.**

Důsledek: PJ vytvoří stránku (vesmírná stanice = Lokace) s AKJ úrovní vyšší, než má sám → `GET /pages/:slug` vrátí **403 i PJ**. Editor na 403 redirectuje na viewer ([PageEditorPage.tsx:65](../../../src/features/world/pages/PageEditor/PageEditorPage.tsx#L65)), viewer ukáže „Stránka je zašifrovaná" → „Otevřít v editoru" → editor → 403 → **nekonečná smyčka**. PJ je zamčen ze svého obsahu.

### Sémantický rozpor
AKJ je dle [glossary akj-urovne.md](../../glossary/akj-urovne.md) nástroj PJ pro skrývání obsahu **před hráči** — ne před sebou. Gate ho ale aplikuje univerzálně.

### Sekundární nekonzistence
`assertCanWrite` (zápis) AKJ vůbec nekontroluje — jen `role >= PomocnyPJ` + `requester.role <= Admin` shortcut. Read gate je tak **přísnější než write gate**. Po opravě budou symetrické.

## 2. Cíl

`assertAccess` propustí bez kontroly AKJ:
1. **World role `>= PomocnyPJ`** (membership.role)
2. **Platform role `<= UserRole.Admin`** (Admin + Superadmin) — stejný shortcut jako v `assertCanWrite`

Hráči (Hráč/Čtenář/…) AKJ gate dál podléhají beze změny. Žádná změna chování pro ně.

## 3. Implementace

### 3.1 `assertAccess` — nový volitelný param + bypass
```ts
private async assertAccess(
  page: Page,
  userId: string,
  worldId: string,
  platformRole?: UserRole,   // NOVÉ
): Promise<void> {
  if (!page.accessRequirements?.length) return;

  // PomocnyPJ+ a platform Admin+ obcházejí AKJ — gate skrývá obsah jen před hráči.
  if (platformRole !== undefined && platformRole <= UserRole.Admin) return;
  const membership = await this.membershipRepo.findByUserAndWorld(userId, worldId);
  if (membership && membership.role >= WorldRole.PomocnyPJ) return;

  // ...stávající loop nad accessRequirements (membership už načtený, reuse)...
}
```
⚠️ Stávající kód načítá `membership` až ve `for` loopu — přesuneme načtení nahoru a v loopu reuse (žádné dvojí volání).

### 3.2 Protáhnout `platformRole` do volajících
- `findBySlug(slug, worldId, userId, platformRole?)` → předá do `assertAccess`
- `findBacklinks(targetSlug, worldId, userId, platformRole?)` → předá do obou `assertAccess` volání (cílová stránka i kandidáti)

### 3.3 Controller — předat `user.role`
- `findOne` → `findBySlug(slug, worldId, user.id, user.role)`
- `getBacklinks` → `findBacklinks(slug, worldId, user.id, user.role)`

### 3.4 FE
**Žádná FE změna.** Smyčka editor↔viewer zmizí automaticky, jakmile BE vrátí 200. AccessDenied screen zůstává pro skutečné hráče.

## 4. Edge cases
- **PomocnyPJ vidí AKJ obsah jiného PomocnyPJ** — záměrně ano (důvěryhodná autorská role, stejně může vše editovat). Konzistentní s `filterPrivateForViewer` (řádek 628), které už PomocnyPJ+ propouští.
- **Backlinks listing** — PJ nově uvidí i backlinky na utajené stránky. Správně (není to leak — PJ má vidět vše).
- **Žádný membership + není Admin** (Žadatel mimo svět) → gate platí dál, 403.

## 5. Testy (BE `pages.service.spec.ts`)
- PomocnyPJ + AKJ 8, membership.akj 0 → **projde** (žádná 403)
- PJ + AKJ 8 → projde
- platform Superadmin bez membershipu + AKJ 8 → projde (platformRole bypass)
- Hráč + AKJ 8, akj 0 → **403** (beze změny)
- Hráč + AKJ 3, akj 5 → projde (splňuje úroveň, beze změny)

## 6. Akceptační kritéria
- [x] `assertAccess` bypass pro PomocnyPJ+ a platform Admin+
- [x] `platformRole` protažen přes `findBySlug` + `findBacklinks` z controllerů
- [ ] Smyčka editor↔viewer u AKJ-chráněné stránky pro PJ zmizí (manuální ověření na vesmírné stanici — **po restartu BE**)
- [x] Hráč bez úrovně dál dostává 403 + „Stránka je zašifrovaná" (regrese test)
- [x] BE unit testy zelené (3 nové: PomocnyPJ bypass, Superadmin bypass bez membershipu, hráč regrese)
