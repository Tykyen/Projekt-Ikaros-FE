# Spec 1.2h — `loginIntent` DRY refactor (D-014)

**Status:** Draft — čeká na schválení
**Rozsah:** drobnost FE — 1 nový soubor + 4 editace, žádná funkční změna
**Repo:** `Projekt-ikaros-FE`, branch `feat/krok-1.2-registrace`
**Velikost:** ~50 ř. změn celkem
**Autor:** PJ + Claude
**Datum:** 2026-05-08

---

## 1. Cíl

Sjednotit duplicitní hardcode konstanty `'ikaros.loginIntent'` ze 4 produkčních souborů do jediného shared modulu `src/auth/loginIntent.ts` s helper funkcemi `saveLoginIntent` a `consumeLoginIntent`.

**Funkční chování zůstává 100% identické.** Toto je čistý DRY/cleanup refactor bez behaviorálních změn.

---

## 2. Kontext

D-014 byl poznamenán během 1.2c implementace, kdy `client.ts` přidal **4. místo** s identickou hardcode konstantou + identickou save logikou (mimo to, co už bylo v `router.tsx`, `LoginModal.tsx`, `RegisterModal.tsx`).

**Risk hardcoded duplicity:**
- Změna hodnoty klíče (např. namespace shift `'ikaros.loginIntent'` → `'auth.loginIntent'`) vyžaduje editaci 4 míst — překlep = silent break.
- Změna bezpečnostního filtru pro `target` (aktuálně `startsWith('/') && !startsWith('//')`) vyžaduje editaci 2 míst — desync = security regression.

---

## 3. Audit současného stavu

### 3.1 Save místa (2)

**`src/api/client.ts:23-26`** (uvnitř `logoutAndRedirectToLogin`):
```ts
const target = window.location.pathname + window.location.search;
if (target.startsWith('/') && !target.startsWith('//') && target !== '/') {
  sessionStorage.setItem(LOGIN_INTENT_KEY, target);
}
```

**`src/router.tsx:80-85`** (uvnitř `requireAuth` loader):
```ts
const url = new URL(request.url);
const target = url.pathname + url.search;
if (target.startsWith('/') && !target.startsWith('//')) {
  sessionStorage.setItem(LOGIN_INTENT_KEY, target);
}
```

**Drobný rozdíl:** `client.ts` má navíc `target !== '/'` filtr (= neukládat když user už je na rootu). `router.tsx` ho nemá. **Záměrný drift?** Pravděpodobně ne — `client.ts` přidal tento filtr v 1.2c spec sekci 4.1 jako optimization (zbytečné). `router.tsx` by chování beze změny — pokud user volá protected route z `/`, ukládá `'/'` jako intent → po loginu redirect na `/'` (no-op vlastně).

**Rozhodnutí:** Sjednotit oba přes shared helper, který implementuje filtr `target !== '/'`. To znamená drobnou změnu chování v `router.tsx` (přesněji: `requireAuth` redirectne na `/?openLogin=1`, takže by uložení `'/'` jako intent stejně skončilo na `/` — chování se nemění funkčně).

### 3.2 Consume místa (2)

**`src/components/auth/LoginModal.tsx:77-78`** (po úspěšném loginu):
```ts
const intent = sessionStorage.getItem(LOGIN_INTENT_KEY);
sessionStorage.removeItem(LOGIN_INTENT_KEY);
// ... validace + navigate
```

**`src/components/auth/RegisterModal.tsx:124-125`** (po úspěšné registraci):
```ts
const intent = sessionStorage.getItem(LOGIN_INTENT_KEY);
sessionStorage.removeItem(LOGIN_INTENT_KEY);
// ... validace + navigate
```

Identický pattern + bezpečnostní validace `intent.startsWith('/')` před navigací — duplicitní kód.

### 3.3 Test files (2)

**`src/components/auth/LoginModal.spec.tsx`** a **`src/components/auth/RegisterModal.spec.tsx`** přístupují přes string literal `'ikaros.loginIntent'` přímo:

```ts
sessionStorage.setItem('ikaros.loginIntent', '/ikaros/posta');
// ...
expect(sessionStorage.getItem('ikaros.loginIntent')).toBeNull();
```

**Rozhodnutí:** Testy ponechat na string literal. Důvod: testy ověřují **observable session storage state**, ne implementační detail konstanty. Refactor uvnitř kódu se hodnotu klíče nemění, takže testy projdou beze změny. Přechod na helper import by jen zatemnil test záměr.

---

## 4. Návrh řešení

### 4.1 Nový soubor `src/auth/loginIntent.ts`

```ts
/**
 * Helpery pro post-login deep-link redirect přes sessionStorage.
 *
 * Save:    `requireAuth` loader (router.tsx) a `logoutAndRedirectToLogin`
 *          (api/client.ts) ukládají zamýšlenou cestu před přesměrováním
 *          na úvodník s otevřeným LoginModalem.
 * Consume: `LoginModal` a `RegisterModal` po úspěšném loginu/registraci
 *          čtou + mažou intent a navigují tam.
 *
 * Bezpečnostní filtr: target musí být relativní cesta začínající '/' a NE
 * začínající '//' (= absolute URL na jinou doménu — open redirect).
 */

export const LOGIN_INTENT_KEY = 'ikaros.loginIntent';

/**
 * Validuje, že target je bezpečná relativní cesta (žádný open redirect).
 */
function isSafeRelativePath(target: string): boolean {
  return target.startsWith('/') && !target.startsWith('//');
}

/**
 * Uloží zamýšlenou cestu do sessionStorage. Pokud je `target` nebezpečný
 * nebo rovný `/` (= žádný smysluplný redirect), no-op.
 */
export function saveLoginIntent(target: string): void {
  if (!isSafeRelativePath(target)) return;
  if (target === '/') return;
  sessionStorage.setItem(LOGIN_INTENT_KEY, target);
}

/**
 * Vrátí + smaže uloženou cestu. Validuje bezpečnost (pro případ, že někdo
 * sessionStorage manipuloval). Vrací `null` pokud nic není uloženo nebo je
 * hodnota nebezpečná.
 */
export function consumeLoginIntent(): string | null {
  const raw = sessionStorage.getItem(LOGIN_INTENT_KEY);
  sessionStorage.removeItem(LOGIN_INTENT_KEY);
  if (raw && isSafeRelativePath(raw)) return raw;
  return null;
}
```

**Klíčová rozhodnutí:**
- **Filtrování při save i consume** — defensive: pokud útočník přepíše `sessionStorage` ručně (např. přes XSS by se sneslo na fishnet), consume valídace zachytí.
- **`target !== '/'` filtr v save** — sjednoceno z `client.ts` chování. `router.tsx` důsledek: pokud user volá protected route z `/`, save no-op → po loginu skončí na `/` (default DashboardPage), což je stejné chování jako dnes (`/'` jako intent vede na `/'`).
- **Žádný `target !== ''` filtr** — `isSafeRelativePath('')` vrátí false (neprochází `startsWith('/')`), takže pokrytí.
- **Konstanta `LOGIN_INTENT_KEY` nadále exportována** — pro testy, pokud by se rozhodly přejít na import (volitelně, sekce 3.3).

### 4.2 Refactor `src/api/client.ts`

```ts
// Před (l. 6-9):
const apiBase = ...;
const LOGIN_INTENT_KEY = 'ikaros.loginIntent';

// Po:
const apiBase = ...;
// (LOGIN_INTENT_KEY constant smazán; import z auth/loginIntent)
```

```ts
// Před (l. 22-26 v logoutAndRedirectToLogin):
const target = window.location.pathname + window.location.search;
if (target.startsWith('/') && !target.startsWith('//') && target !== '/') {
  sessionStorage.setItem(LOGIN_INTENT_KEY, target);
}

// Po:
const target = window.location.pathname + window.location.search;
saveLoginIntent(target);
```

Přidat import:
```ts
import { saveLoginIntent } from '../auth/loginIntent';
```

### 4.3 Refactor `src/router.tsx`

```ts
// Před (l. 64):
const LOGIN_INTENT_KEY = 'ikaros.loginIntent';

// Po: smazat (import shora)
```

```ts
// Před (l. 80-85 v requireAuth):
const url = new URL(request.url);
const target = url.pathname + url.search;
if (target.startsWith('/') && !target.startsWith('//')) {
  sessionStorage.setItem(LOGIN_INTENT_KEY, target);
}

// Po:
const url = new URL(request.url);
saveLoginIntent(url.pathname + url.search);
```

Přidat import:
```ts
import { saveLoginIntent } from './auth/loginIntent';
```

### 4.4 Refactor `LoginModal.tsx` a `RegisterModal.tsx`

V obou souborech:

```ts
// Před:
const LOGIN_INTENT_KEY = 'ikaros.loginIntent';
// ...
const intent = sessionStorage.getItem(LOGIN_INTENT_KEY);
sessionStorage.removeItem(LOGIN_INTENT_KEY);
if (intent && intent.startsWith('/') && !intent.startsWith('//')) {
  navigate(intent);
} else {
  navigate('/');
}

// Po:
import { consumeLoginIntent } from '../../auth/loginIntent';
// ...
const intent = consumeLoginIntent();
navigate(intent ?? '/');
```

`consumeLoginIntent` už dělá bezpečnostní validaci, takže komponenty na ní nemusí duplikovat.

### 4.5 Out of scope

- **Test refactor** — nezahrnuto. Testy nadále používají literal `'ikaros.loginIntent'`. Pokud by hodnota klíče byla změněna, testy by musely být ručně aktualizovány — akceptujeme jako trade-off (testy nezatemňovat importem implementace).
- **Konsolidace `LoginModal` a `RegisterModal` post-auth flow** — oba modály mají duplicitní logiku okolo intent (čtení, navigace, modal close). To je v širším scope a vyžaduje vlastní spec.

---

## 5. Acceptance kritéria

1. ✅ Nový soubor `src/auth/loginIntent.ts` s exportem `LOGIN_INTENT_KEY`, `saveLoginIntent`, `consumeLoginIntent`.
2. ✅ V `src/api/client.ts` neexistuje `const LOGIN_INTENT_KEY`. Volání `saveLoginIntent(target)` místo inline logiky.
3. ✅ V `src/router.tsx` neexistuje `const LOGIN_INTENT_KEY`. Volání `saveLoginIntent(url.pathname + url.search)`.
4. ✅ V `LoginModal.tsx` a `RegisterModal.tsx` neexistuje `const LOGIN_INTENT_KEY`. Volání `consumeLoginIntent()`.
5. ✅ Vyhledávání `'ikaros.loginIntent'` v src vrátí jen: `auth/loginIntent.ts` (definice) + 2 spec soubory (test literály).
6. ✅ Build prochází (`npm run build`).
7. ✅ Lint prochází bez nových warning (`npm run lint`).
8. ✅ Testy prochází (`npm run test:run`) — `LoginModal.spec.tsx` a `RegisterModal.spec.tsx` musí projít beze změny (chování stejné).
9. ✅ `dluhy.md`: D-014 přesunuto do "Uzavřené" s odkazem na 1.2h.

---

## 6. Test plán

**Automated:** existující test suite musí projít (žádná funkční změna).

**Manuální:** ne-kritické (žádná funkční změna), ale doporučený smoke check:
1. Otevřít chráněnou route bez tokenu (`/ikaros/profil`) → očekávané: redirect na `/?openLogin=1`, sessionStorage obsahuje `ikaros.loginIntent` = `/ikaros/profil`.
2. Login → očekávané: navigate na `/ikaros/profil`, sessionStorage `ikaros.loginIntent` smazán.

---

## 7. Změny v souborech

| Soubor | Druh změny | Velikost |
|---|---|---|
| `src/auth/loginIntent.ts` | nový | ~30 ř. |
| `src/api/client.ts` | -konstanta, -inline logika, +import + 1 řádek volání | ~+1 / -5 ř. |
| `src/router.tsx` | -konstanta, -inline logika, +import + 1 řádek volání | ~+1 / -6 ř. |
| `src/components/auth/LoginModal.tsx` | -konstanta, -3 řádky inline logiky, +import + 1 řádek | ~+1 / -7 ř. |
| `src/components/auth/RegisterModal.tsx` | -konstanta, -3 řádky inline logiky, +import + 1 řádek | ~+1 / -7 ř. |
| `docs/dluhy.md` | D-014 → Uzavřené | ~+5 / -8 ř. |
| `docs/arch/phase-1/spec-1.2h-login-intent-dry.md` | tento dokument | nový |

---

## 8. Riziko & rollback

- **Riziko 1:** Drobná změna chování v `router.tsx` — předtím `setItem('/')` se zapsalo, teď ne (`target === '/'` filtr). Funkčně bez dopadu (po loginu se stejně vrátí na `/`), ale zmiňuji pro úplnost.
- **Riziko 2:** Existující testy `LoginModal.spec.tsx` / `RegisterModal.spec.tsx` přístupují ke storage přímo přes literal — testy nezávislé na refactoru, takže bezpečné.
- **Rollback:** revert 1 commitu.

---

## 9. Otázky k autorovi

1. ✅ Souhlasíš s out-of-scope rozhodnutím **nepřevádět testy** na helper import (zachovat literal `'ikaros.loginIntent'` v spec souborech)?
2. ✅ Souhlasíš se sjednocením filtru `target !== '/'` mezi `client.ts` a `router.tsx` (drobná změna chování v `router.tsx`, funkčně bez dopadu)?
3. ✅ Souhlasíš s umístěním souboru — `src/auth/loginIntent.ts` (nová složka `src/auth/`)? Alternativa: `src/utils/loginIntent.ts` nebo `src/api/loginIntent.ts`.

---

**Po schválení specu napíšu implementační plán.**
