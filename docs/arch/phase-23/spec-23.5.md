# Spec 23.5 — Sliding session v produkci (oprava refresh race)

**Stav:** schváleno uživatelem 2026-07-19 · implementováno (BE jest 80/80, FE vitest 3/3 + build zelený) · čeká deploy + živé ověření
**Karta:** roadmap3 fáze 23, karta 23.5 · **Původ:** inventura funkcí 01 (refresh) + pozorování „odhlásí mě do 3 dnů"

## Problém

Sliding session (access 1 d + refresh cookie 60 d, rotace při každém refreshi) je navržená správně a v produkci nakonfigurovaná správně (same-origin přes Caddy ověřeno 2026-06-24; GitHub vars nenastavené → compose defaulty `JWT_EXPIRES_IN=1d`, `JWT_REFRESH_TTL_DAYS=60`). Přesto se testeři odhlašují po ~1 dni.

**Kořen = race při souběžném refreshi:**

1. FE interceptor (`src/shared/api/client.ts:116`) spouští **vlastní** `POST /auth/refresh` pro každý 401 — načtení stránky po expiraci access tokenu vystřelí N paralelních refreshů se **stejnou cookie**.
2. BE rotace s reuse-detection **bez grace** (`auth.service.ts:486–526`): první refresh jti zrotuje, druhý přijde s už-revokovaným → `REFRESH_TOKEN_ABUSED` → **revoke celé rodiny**. Race je v kódu přiznaná („Akceptujeme").
3. FE na fail reaguje toastem „Přihlášení vypršelo" + logout → session reálně nepřežije první expiraci access tokenu.

Cíl (uživatel): jakákoli aktivita session tiše prodlouží; odhlášení až po dlouhé nečinnosti (60 d), nikdy během práce.

## Rozhodnutí

- **FE single-flight refresh:** modulový sdílený promise — první 401 spustí refresh, všechny souběžné 401 na něj čekají a retry-nou s novým tokenem. Toast + logout se při failu provede **jednou** (uvnitř sdíleného flow), ne za každý čekající request.
- **BE grace window 60 s:** při rotaci se nástupnický pár (access+refresh string) uloží do **in-memory cache** klíčované starým jti (TTL 60 s). Refresh s revokovaným jti → hit v cache = vrátit **týž** nástupnický pár (žádná nová rotace, žádný revoke rodiny); miss = reuse-detection jako dosud. Řeší multi-tab, PWA vs. prohlížeč a síťové retry, které FE single-flight nepokryje.
  - Bezpečnost: zloděj replay-ující ukradený token v ≤60 s okně dostane týž pár jako oběť → obě strany sdílí jednu chain → příští rotace opět koliduje mimo okno → detekce jen zpožděna o ≤60 s. Standardní praxe (Auth0 „reuse interval").
  - Zamítnuté alternativy: Web Locks API na FE (nepokryje PWA/retry) · úložiště páru v DB (persistovat raw tokeny nechceme; Redis až při 2+ replikách BE — dnes 1).
- **Konfigurace beze změny** — defaulty 1d/60 jsou správné; GitHub vars se nezakládají.
- **Roadmapa 23.5 přepsat** — text karty tvrdí vyvrácenou cross-site hypotézu.

## Zásahy

| # | Repo/Soubor | Změna |
|---|---|---|
| 1 | FE `src/shared/api/client.ts` | single-flight: sdílený `refreshPromise` (reset ve `finally`), interceptor čeká na něj; toast+logout jen 1× při failu; guard pro anonyma (bez Authorization) beze změny |
| 2 | BE `modules/auth/auth.service.ts` | grace cache `Map<oldJti, {pair, expiresAt}>` (TTL 60 s, lazy cleanup); zápis při rotaci, čtení ve větvi `stored.revoked` před reuse-detection |
| 3 | BE `auth.service.spec.ts` | nové testy: reuse v grace okně → týž pár, rodina žije · reuse po oknu → `REFRESH_TOKEN_ABUSED` + revoke rodiny |
| 4 | FE test (vitest) | single-flight: 3 souběžné 401 → právě 1 volání `/auth/refresh`, všechny retry s novým tokenem; fail → 1 toast + logout |
| 5 | FE `docs/roadmap3.md` | karta 23.5: stav/kroky dle reálného kořene |
| 6 | FE `docs/funkce/01-ucet-prihlaseni-bezpecnost.md` | sekce „Refresh token rotace": TTL 60 d (ne 3), grace window, single-flight |

## Vědomě nekryto

- Grace cache je in-memory → restart BE v 60 s okně = staré chování (výjimečný souběh, akceptováno). Při přechodu na 2+ repliky BE nutný přesun do Redisu (vzor `THROTTLER_REDIS`) — poznámka do kódu.
- `requireAuth` loader dál nevaliduje expiraci tokenu (existující přiznaný dluh, mimo rozsah — interceptor to řeší).
- Nápověda beze změny (hráčsky viditelná změna = „už to neodhlašuje", není co vysvětlovat).

## Ověření

① BE jest (auth.service.spec) + FE vitest zelené · ② po deployi živě (uživatel): po >1 dni od loginu otevřít svět s Network tabem — právě 1 `POST /auth/refresh` → 200, žádný `REFRESH_TOKEN_ABUSED`, žádné odhlášení · ③ dlouhodobě: denní práce bez opakovaného přihlašování.
