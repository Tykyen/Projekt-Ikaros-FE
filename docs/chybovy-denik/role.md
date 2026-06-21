# Chybový deník — role / oprávnění / governance

Detaily k záznamům z indexu ([README.md](README.md)) pro oblast rolí, oprávnění a governance světa.

---

## ✅ ŘEŠENÍ — Elevation („nahození práv"): admin moc uspaná, per-svět nahoditelná (náhrada R-20) — 2026-06-21

**Problém / zadání.** Superadmin/admin jsou často ve světě jako hráči; „viditelnost na úrovni vedoucího" jim překážela a zároveň R-20 jim odebralo veškerou moc ve světě natvrdo. Cíl: admin se defaultně chová jako hráč, ale na jeden klik si per-svět „nahodí" plnou PJ moc, vyřeší problém a zase složí.

**Co zabralo (přístup).**
- **Jeden koncept místo ~45 řešení.** Guard (`JwtAuthGuard`/`OptionalJwtAuthGuard`) plní `requester.elevatedWorldIds` (jen pro `role<=Admin`), helper `worldAdminBypass(user, worldId)` (`common/utils/world-elevation.ts`) nahradil VŠECH ~45 přímých `role <= Admin` ve world-scoped branách. Stav elevace v kolekci `world_elevations` (bez TTL, toggle).
- **Delegace + VLASTNÍ úplný sweep.** Převod 45 bran ve 20 modulech jsem rozdělil 5 paralelním agentům (deterministický vzor + klasifikace A/B/C). Ale subagent klasifikace **přestřelovala i podstřelovala** — minula `bestiae`, `upload`, `scheduled-messages`, `world-access-request`, `emotes:68`, část `worlds.service`. Zachránil to **vlastní kompletní grep sweep** (`role (<=|>|===) UserRole.(Admin|Superadmin)` napříč celým `src`).
- **Signatura na `RequestUser`, ne optional param.** U funkcí s odděleným `userId, userRole` jsem NEzaváděl optional `elevatedWorldIds?` (zapomenutý callsite by tsc neodhalil → tichá díra), ale změnil signaturu na povinný `requester` → tsc vynutil opravu všech callsites.
- **Kategorie B (cross-user / WS) z DB.** Funkce, které čtou roli cizího uživatele z DB (`chat.isWorldManagerByUserId`) nebo běží na WS bez HTTP guardu (`maps.gateway`), nemají `requester.elevatedWorldIds` → čtou elevaci z DB přes `elevationService.isElevated`. Elevace žije v DB, takže to jde.
- **Lint guard proti regresi.** `scripts/check-elevation-bypass.mjs` (v `lint:check`) hlídá, že nevznikne nový přímý world `role<=Admin`; legitimní výjimky přes `// elevation-exempt`.
- **UX korekce spec za běhu.** De-elevated admin musí vidět **metadata** světa (shell: název) — jinak se nedostane k toggle, aby se elevoval. Upřesnil jsem spec D-2: gated je *obsah* (pages/chat/settings), ne existence/jméno světa.

**Jak ověřeno.** BE: `tsc` 0 + `jest --maxWorkers=2` **2225/2225** + `lint:check` (eslint + elevation guard) zelené. FE: `npm run build` (tsc -b) zelený + vitest (guard 6 / layout 7 / toggle 4) zelené.

**Zhodnocení.**
- 👍 **Dobře:** deterministický helper vzor + silné záchranné sítě (tsc na povinné typy + 2225 auth testů + lint guard + vlastní review diffu) umožnily bezpečně delegovat objemnou auth práci 5 agentům. Volba „povinný `RequestUser` místo optional param" eliminovala celou třídu tichých děr.
- 👎 **Poučení 1:** subagent klasifikace/inventura je **hypotéza, ne fakt** — u plošné bezpečnostní změny VŽDY vlastní úplný grep sweep obou forem (`<=` i `>`), ne spoléhat na agentní seznam. (Stejné poučení jako u plného auditu: agentní TL;DR přestřeluje.)
- 👎 **Poučení 2:** první odhad „zbývá jen router `memberOnly`" byl nepřesný — `memberOnly` byl už vyřešen opraveným `WorldMembershipGuard`, ale skutečný FE drift byl jinde (**7 komponent s vlastním `role<=Admin` world gate**: počasí, news, mapa, bestiář). Odhalil ho až grep sweep FE, ne paměť. → i u FE „dokončení" udělej sweep, nedůvěřuj dílčí poznámce.
- 👍 **Bonus:** sweep odhalil dead code (`WeatherSetsModal` `isGlobalAdmin || true`) a FE>BE drift v bestiáři (admin editoval user-scope bestie, BE = owner-only) → opraveno BE-konzistentně (system=platform admin, world=elevation, user=owner).
