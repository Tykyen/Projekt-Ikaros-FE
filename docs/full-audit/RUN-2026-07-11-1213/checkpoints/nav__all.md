# nav — styl 10 (Navigace & routování) — checkpoint (RUN 2026-07-11)

READ-ONLY hloubkový audit. Registr [`docs/nav-audit.md`](../../../nav-audit.md), plán [`docs/nav-plan/`](../../../nav-plan/README.md). Prefix `NAV-`.
Hloubka: **L2** (M-SCAN tool diff + L1 čtení router/menu/breadcrumbs/generátory). Cíl: vede každý odkaz na živou cestu a chrání každá cesta to, co má?

## Vstupní stav
- Registr: **9 nálezů NAV-01..09, VŠE ✅ opraveno** (2026-06-14/06-20). Spot-check regresí:
  - NAV-01 — [useWorldSocket.ts:74](../../../../src/features/world/hooks/useWorldSocket.ts#L74) `navigate('/ikaros/vesmiry')` ✅ (ne mrtvé `svety`).
  - NAV-04/05 — [worldNavConfig.ts:220-256](../../../../src/features/world/lib/worldNavConfig.ts#L220) `canAccess(WorldRole)` predikát aplikován; [WorldLayout.tsx:348-352](../../../../src/app/layout/WorldLayout/WorldLayout.tsx#L348) předává `navBypass || navRole >= min` ✅.
  - NAV-02/03/08 — orphan routy smazány, `admin/kalendare`/`admin/stranky` = PomocnyPJ (parita s BE) ✅.
  - **0 regresí (♻️), 0 znovuotevřených (🔓).**
- Scanner `audit:nav` ([scanners/nav.txt](../scanners/nav.txt)): PATH-SET **86 rout**, LINK-SET **319 odkazů / 84 unik.**, **DEAD 0**, **ORPHAN 1**, **AMBIGUITA 0** → L2 čistý.

## Prošlé povrchy (L1+L2)
- **Router** [`router.tsx`](../../../../src/app/router.tsx) — `createBrowserRouter`, root `/` (IkarosLayout) + `/svet/:worldSlug` (WorldLayout) + samostatná `karta-tokenu` + catch-all `*`. Pořadí/shadowing: RR v7 ranking (K-NAV2 mýtus), `:slug` wiki catch-all poslední, static přebíjí. ✅
- **Guard coverage** — všechny world child routy mají `memberOnly()`/explicit `WorldMembershipGuard`; `{index:true}` world dashboard záměrně bez guardu (pre-join). Výjimka viz N2 níže.
- **Nav generátory** [`worldNavConfig.ts`](../../../../src/features/world/lib/worldNavConfig.ts) · [`headlineNav.ts`](../../../../src/features/world/lib/headlineNav.ts) · [`groupMembers.ts`](../../../../src/features/world/lib/groupMembers.ts) — všechny `to` cíle resolvují (scanner dead:0).
- **Menu** [`IkarosLayout`](../../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) `PRIMARY_NAV`/`CHAT_ROOMS`/RightPanel — všechny cíle živé (`/ikaros/*`, `/chat*`, `/admin*`). ✅
- **Mobil parita (MP)** — [WorldLayout.tsx:747](../../../../src/app/layout/WorldLayout/WorldLayout.tsx#L747) drawer renderuje TÝŽ `nav` z `buildFullWorldNav` jako desktop [:678](../../../../src/app/layout/WorldLayout/WorldLayout.tsx#L678). Žádná položka jen-desktop/jen-mobil. ✅
- **Breadcrumbs** [`Breadcrumbs.tsx`](../../../../src/shared/ui/Breadcrumbs/Breadcrumbs.tsx) — poslední crumb bez odkazu (`aria-current=page`), ostatní `<Link to={href}>`; `href` skládají volající stránky z živých cest (svět/článek/galerie detaily). Bez mrtvého cíle. ✅
- **Path modul** — stále NEEXISTUJE (kořen K-NAV1); router + magické stringy = 2 zdroje pravdy, dr++ift hlídá jen scanner. Dluh beze změny.

---

## Nálezy

### NAV-N1 🆕 🟡 `RG`/`VR`/`DL` — „Tvorba podzemí" nav nad-inzeruje globálně-gated routu
[`worldNavConfig.ts:246-251`](../../../../src/features/world/lib/worldNavConfig.ts#L246):
```ts
{ id: 'dungeon-builder', label: 'Tvorba podzemí', to: `/admin/dungeon-builder`, external: true },
```
Přidáno do skupiny **„Hra" BEZ gate** (ne `isPJ`, ne `canAccess`) → vidí **každý člen světa** (Ctenar+).
Routa [`router.tsx:272-281`](../../../../src/app/router.tsx#L272) = `RoleGuard([Superadmin, Admin])` (**globální** platformová role).
→ Kdokoli kromě Sa/Admin (i PJ světa bez globální role) klikne → `<ForbiddenPage/>` (403).
**Stejná třída jako opravené NAV-04/05** (nav neguje guard routy), ale pro **globální** roli — a `canAccess` predikát pokrývá jen **world** role, takže díru nechytá. Položka JE skrývatelná (PJ ji odebere), ale **default viditelná + rozbitá** pro nečleny-adminy.
Fix návrh (gated): přidat gate `isAdmin` do generátoru, nebo položku úplně odstranit z per-world nav (je to platformový tool). Verdikt: over-block / matoucí nav, ne leak.

### NAV-N2 🆕 🟡 `VR`/`GC`/`BP` — pop-out `karta-tokenu` bez FE guardu (BE-enforced)
[`router.tsx:413-417`](../../../../src/app/router.tsx#L413) — samostatná top-level routa `/svet/:worldSlug/karta-tokenu` (17.11, MIMO WorldLayout) má **`guard=none`** — jako jediná world-content routa **bez** `memberOnly`/`requireAuth`. I anonym může routu otevřít.
Obsah ale **hradí BE**: [`usePersonaDirectory`](../../../../src/features/world/pages/api/usePersonaDirectory.ts) → `GET /worlds/:id/pages/directory` → [`pages.service.findDirectory`](../../../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L676) volá `assertCanViewWorld` (nečlen privátního světa odmítnut). Bestie větev čte `GET /maps/:sceneId` — BP guard neověřen do hloubky (kandidát na L7-stack).
Navíc [`TokenCardPopoutPage.tsx:207`](../../../../src/features/world/pages/TokenCardPopoutPage/TokenCardPopoutPage.tsx#L207) `const canEdit = true` natvrdo → edit UI se ukáže všem; reálná práva vynucuje BE autosave (403). Politická nekonzistence, ne tvrdý leak.
Verdikt: **by-design (BE-enforced)**, ale odchylka od FE konvence (všude jinde `memberOnly`). Nízké riziko; zdokumentovat/sjednotit.

### Scanner hygiena (kosmetika, ne nález)
ORPHAN report [`nav.txt`](../scanners/nav.txt): `/svet/:worldSlug//svet/:worldSlug/karta-tokenu` = **false positive** ze 2 příčin:
1. **Dosažitelnost:** routa se otvírá přes `popoutHref` (window.open) z [`TacticalMapView.tsx:2113-2117`](../../../../src/features/world/tactical-map/TacticalMapView.tsx#L2113) — dynamický template ve složeném ternáru, který LINK-SET scan (jen `to=`/`navigate(`/`<Navigate>`) nematchne. Patří do whitelist kategorie **deep-link-only**.
2. **Kompozice cesty:** dvojitý prefix `/svet/:x//svet/:x/…` = artefakt scanneru u top-level routy s **absolutní** `path` (scanner prepend parent i k absolutní cestě).
Doporučení: přidat `karta-tokenu` do orphan-whitelistu (deep-link-only) + ošetřit absolutní path v kompozici → orphan report na 0.

---

## Osy — stav
| Osa | Stav | Pozn. |
|---|---|---|
| `DR` route–link drift | ✅ L2 | scanner dead:0 |
| `PA` param contract | ✅ L1 | `:worldSlug`/`:slug`/`:id`/`:groupKey` (decode) konzistentní s `useParams` |
| `GC` guard coverage | ⚠️ | world routy ✅; **karta-tokenu bez FE guardu** (N2, BE-enforced) |
| `RG` role-gate | ⚠️ | route enforcement ✅; **dungeon-builder nav over-block** (N1) |
| `OR` ordering/shadowing | ✅ L2 | ambiguita:0; RR v7 ranking |
| `DL` dead link | ✅ L2 | 0 |
| `RI` redirect integrity | ✅ L1 | chat/rozcesti*→camp*, world:deleted→vesmiry živé; legacy `sprava-udalosti` smazán |
| `VR` visibility vs reachability | ⚠️ | N1 (nad-inzerce) + N2 (skryté ale dosažitelné) |
| `MP` mobile parita | ✅ L1 | drawer == desktop nav |
| `HP`/`EX` help/externí | ⬜ | L2 mimo rozsah této dávky |
| `BP`/`RX`/`FZ`/`TE` nadstavba | ⬜ | render/e2e/crawl/mutace neběžely |

## Závěr
L2 brána **čistá** (scanner 0/0/0 po odečtení false-orphanu). 9 registrovaných nálezů opraveno, **0 regresí**. **2 nové 🆕 🟡** (oba over-block/konvence, ne tvrdý leak): **NAV-N1 dungeon-builder nav** (nejzávažnější — reálný 403 pro nečleny-adminy) a **NAV-N2 karta-tokenu bez FE guardu** (BE-enforced). Doporučeno gated fix N1 + whitelist/normalize scanner. Opravy neaplikovány (READ-ONLY, gated souhlas).
