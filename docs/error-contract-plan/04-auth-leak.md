# 04 — Auth-leak: 401/403/404 sémantika (`AL`)

> **Otázka:** vrací guardy a služby **sémanticky správný** status (401 expired / 403 zákaz / 404 skrytí
> existence) **konzistentně napříč VŠEMI moduly**? Neleakuje některý modul existenci zdroje (403 tam, kde má
> být no-leak 404 — nebo naopak)?

## Pravidlo (z `../Projekt-ikaros/.claude/rules/auth-leak-policy.md` + skill `auth-policy`)
| Situace | BE | FE |
|---|---|---|
| Nepřihlášený, forbidden/neexistující | **403** | redirect login / „Přístup odepřen" |
| Přihlášený, zdroj neexistuje | **404** | „Nenalezeno" |
| Přihlášený, existuje, bez práv | **403** | „Nemáš oprávnění" (NE 404) |
| Token expiroval | **401** | refresh → retry → fail → login |

## Povrch
- Guardy: `JwtAuthGuard` (401 + `BANNED/DELETED/DELETION_PENDING`), `AdminGuard` (403 `NOT_PLATFORM_ADMIN`), `RolesGuard` (`false`→403), world access ([worlds.service.ts:178-207] no-leak).
- Per-modul access checks: pages, characters, maps, chat, campaign, calendars, sounds — vracejí 403 vs 404 konzistentně?
- FE: `ForbiddenPage`/`NotFoundPage`, route guard `PrivateRoute`, per-stránka 403/404 handling.

## Kontrolní body
- [ ] **World no-leak ✅** — private bez přístupu → 404 ([worlds.service.ts:155,178-207]). Cross-ref role R-20. `K-EC6`.
- [ ] **Parita napříč moduly** — má pages/characters/maps/chat **stejný** no-leak vzor jako worlds? Nebo některý leakuje 403 (=„existuje, ale…")? M-SHAPE namátkou per modul.
- [ ] **401 vs 403 pro anonyma** — anonymní request na chráněný zdroj → 401 (chybí token) nebo 403? Pravidlo říká 403 pro „nepřihlášený + forbidden". Konzistence s FE refresh logikou (FE refreshuje na 401, ne 403).
- [ ] **FE rozlišení** — FE ukazuje 403 jako „nemáš oprávnění" (ne „nenalezeno", ne prázdno)? Red flag `catch → navigate('/login')` (swalluje 403/404). Cross-ref skill `auth-policy`.
- [ ] **Guard bez kódu** — `RolesGuard` `false` → 403 bez `code` → FE generic. OK?

## Metoda
M-SHAPE (per modul: anonymní/cizí uživatel → assert status) → L4. Cross-ref [role-audit R-20], skill `auth-policy`. **NEDUPLIKOVAT** role audit — tady jde o **status jako contract**, ne o oprávnění.

## Seed
`K-EC6` (parita no-leak napříč moduly ⚖️).
