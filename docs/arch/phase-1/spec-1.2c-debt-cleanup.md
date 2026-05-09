# Spec 1.2c — Debt cleanup (D-001 + dluhy.md sync)

**Status:** Draft — čeká na schválení
**Rozsah:** drobnost, ~15 ř. změn ve `client.ts` + úprava `dluhy.md`
**Autor:** PJ + Claude
**Datum:** 2026-05-08

---

## 1. Cíl

Splnit jeden FE dluh (**D-001**) a synchronizovat `docs/dluhy.md` se skutečným stavem kódu (D-007 už hotov v 1.1, D-002 dříve uzavřen).

Tento spec **není** o restrukturalizaci auth flow, refaktoru interceptoru, ani o sjednocení `LOGIN_INTENT_KEY` (vedlejší dluh — viz sekci 6).

---

## 2. Kontext — proč to teď

- 1.2 (Registrace) je hotová a bez deep-link bug-fixu (`f6e92bc`) by D-001 mohl být přehlédnut.
- Dluh popsán jako "tvrdý reload místo navigate", ale audit kódu ukázal, že je horší: cíl `/login` v `router.tsx` neexistuje → uživatel padne na **404** místo na úvodník s otevřeným LoginModalem.
- Cleanup `dluhy.md` zabrání budoucí konfuzi (D-007 je tam stále otevřený, ale typ je už čistý od 1.1).

---

## 3. Analýza současného stavu

### 3.1 `src/api/client.ts` — response interceptor

Na dvou místech (řádky 35 a 52) provádí:

```ts
window.location.href = '/login';
```

Spouští se když:
- **A)** přijde 401 a `refreshToken` v store není (uživatel nikdy nebyl přihlášen / odhlášen).
- **B)** přijde 401, refresh request sám padne (refresh token expirovaný / revokovaný / BE chyba).

Před redirectem se vyčistí `accessTokenAtom` i `refreshTokenAtom`. To je správně.

### 3.2 Auth flow v projektu (router + LoginModal)

- `router.tsx:64` — `LOGIN_INTENT_KEY = 'ikaros.loginIntent'` (sessionStorage klíč).
- `router.tsx:70-87` — `requireAuth` loader: pokud chybí JWT, uloží `pathname + search` do `LOGIN_INTENT_KEY` a vrátí `redirect('/?openLogin=1')`.
- `DashboardPage.tsx:21-28` — čte `?openLogin=1`, otevře LoginModal, smaže query param.
- `LoginModal.tsx:77-78` — po úspěšném loginu čte `LOGIN_INTENT_KEY` ze sessionStorage a naviguje tam.

**Závěr:** `/login` jako URL **neexistuje**. Správný redirect cíl pro nepřihlášeného uživatele je `/?openLogin=1` se zachováním zamýšlené cesty v `LOGIN_INTENT_KEY`.

### 3.3 Aktuální dopady

- 401 + chybějící refresh token → 404 page (`router.tsx:194` catch-all `*`).
- 401 + selhání refreshe → 404 page.
- Uživatel ztratí původní cestu (žádný `LOGIN_INTENT_KEY`) → po loginu skončí na `/` místo na cílové stránce.
- Tvrdý reload zahodí React state (router, jotai cache, atd.).

---

## 4. Návrh řešení

### 4.1 Nová helper funkce v `client.ts`

```ts
// Logout + redirect na úvodník s otevřeným LoginModalem.
// Volá se z response interceptoru když refresh selže nebo refreshToken chybí.
function logoutAndRedirectToLogin() {
  const store = getDefaultStore();
  store.set(accessTokenAtom, null);
  store.set(refreshTokenAtom, null);

  // Zachovat zamýšlenou cestu pro post-login redirect (mimic requireAuth loader).
  const target = window.location.pathname + window.location.search;
  if (target.startsWith('/') && !target.startsWith('//') && target !== '/') {
    sessionStorage.setItem('ikaros.loginIntent', target);
  }

  router.navigate('/?openLogin=1');
}
```

**Klíčové detaily:**
- **`router.navigate()`** místo `window.location.href` — žádný full reload, React state přežije.
- **Cíl `/?openLogin=1`** místo `/login` — odpovídá skutečné architektuře auth flow.
- **`LOGIN_INTENT_KEY`** uložení — uživatel po loginu skončí tam, kde byl (např. `/svet/abc/chat`).
- **Filtr `target !== '/'`** — pokud je už na úvodníku, neukládat (zbytečné).
- **Bezpečnostní filtr** `startsWith('/')` & `!startsWith('//')` — proti otevřenému redirectu (mimic `requireAuth`).
- **Hardcoded string `'ikaros.loginIntent'`** — duplicita s `router.tsx:64` a `LoginModal.tsx:19`. Sjednocení do shared konstanty je samostatný (nový) drobný dluh — viz sekci 6, **neřešíme v tomto specu**.

### 4.2 Import `router`

`client.ts` musí importovat `router` z `router.tsx`. To vytvoří circular dependency — `router.tsx` importuje pages, které importují `api` z `client.ts`. **Test:** Vite/ESM si typicky s lazy importy a moduly bez side-effectů poradí, ale ověříme za běhu (dev server start + 401 trigger).

**Pokud cyklický import bude problém:** alternativa je pozdní načtení uvnitř helperu:
```ts
const { router } = await import('../router');
router.navigate('/?openLogin=1');
```

Pojistka — neimplementovat preventivně, jen pokud build/start selže.

### 4.3 Refactor interceptoru

Nahradit oba `window.location.href = '/login'` voláním `logoutAndRedirectToLogin()`. Odstraní duplicitu (3 řádky cleanupu × 2 místa).

---

## 5. Acceptance kritéria

1. ✅ V `src/api/client.ts` se nikde neobjevuje `window.location.href = '/login'`.
2. ✅ Když přijde 401 a `refreshToken` v store není, uživatel přejde **bez full reloadu** na `/?openLogin=1`, otevře se LoginModal, a po úspěšném loginu skončí na původní cestě (deep-link).
3. ✅ Když přijde 401 a refresh request selže, chování je identické (bod 2).
4. ✅ Uživatel není v žádném scénáři nasměrován na 404.
5. ✅ Build (`npm run build`) prochází bez warning na cyklický import.
6. ✅ Dev (`npm run dev`) startuje a 401 flow funguje (manuální test: smazat token v DevTools → kliknout protected akci → modal se otevře, není 404).
7. ✅ `dluhy.md` má **D-001** přesunutý do "Uzavřené" s odkazem na 1.2c.
8. ✅ `dluhy.md` má **D-007** přesunutý do "Uzavřené" s poznámkou "vyřešeno v 1.1".

---

## 6. Out of scope (poznamenáno jako nové dluhy)

- **D-014 (nový):** `LOGIN_INTENT_KEY = 'ikaros.loginIntent'` je hardcoded ve 4 souborech (`router.tsx`, `LoginModal.tsx`, `RegisterModal.tsx`, po implementaci 1.2c i `client.ts`). Sjednotit do `src/auth/loginIntent.ts` jako exportovaná konstanta + helper funkce `saveLoginIntent(target)` a `consumeLoginIntent(): string | null`. **Nezahrnuto** — zvětšuje scope, ale po 1.2c má smysl.
- BE dluhy (D-003, D-008, D-009, D-013) — koordinace s BE-týmem mimo tuto session.
- Větší samostatné spec-y (D-010 GDPR, D-011 captcha, D-012 e-mail verifikace) — před prod nasazením.

---

## 7. Riziko & rollback

- **Riziko:** cyklický import `client.ts` ↔ `router.tsx` zlomí build/dev.
  - Mitigace: pokud nastane, použít `await import('../router')` uvnitř helperu (sekci 4.2).
- **Rollback:** revert jediného commitu (čistě FE změna, bez DB / BE / migrací).

---

## 8. Test plán

**Manuální (povinné, není automated test pro tohle):**

1. `npm run dev`, otevřít `/`.
2. Přihlásit se libovolným účtem.
3. Otevřít `/ikaros/profil` (chráněno).
4. V DevTools → Application → Local Storage → smazat `ikaros.jwt` a `ikaros.refreshToken`.
5. Kliknout na akci, která dělá API call (např. refresh dashboardu, otevření jiné chráněné stránky).
6. **Očekávané:** redirect na `/?openLogin=1`, modal se otevře, **žádný 404**, **žádný full reload** (React DevTools potvrdí, že strom přežil).
7. Přihlásit se znovu → skončit na původní cestě (`/ikaros/profil`).

**Automated:** žádný nový test. Existující auth flow E2E (pokud je) by měl projít beze změny.

---

## 9. Změny v souborech (high-level)

| Soubor | Druh změny | Velikost |
|---|---|---|
| `src/api/client.ts` | Přidat helper `logoutAndRedirectToLogin`, refactor interceptoru | ~+15 / -6 ř. |
| `docs/dluhy.md` | D-001 a D-007 → Uzavřené | ~+10 / -25 ř. |
| `docs/arch/phase-1/spec-1.2c-debt-cleanup.md` | Tento dokument | nový |

---

## 10. Otázky k autorovi

1. ✅ Souhlasíš s rozšířeným popisem D-001 (404 bug, ne jen UX) a tím, že redirect cíl bude `/?openLogin=1` (ne `/login`)?
2. ✅ Souhlasíš s pojistkou `await import('../router')` jen pokud cyklický import opravdu selže (= žádná preventivní obfuskace)?
3. ✅ Souhlasíš s tím, že D-014 (sjednocení `LOGIN_INTENT_KEY`) jen poznamenám do `dluhy.md` a neřeším teď?
