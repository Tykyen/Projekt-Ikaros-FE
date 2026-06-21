# Spec — Elevation admin pravomocí ve světě (sudo / „nahození práv")

**Datum:** 2026-06-21
**Status:** ✅ Implementováno 2026-06-21 (BE F0–F2 + FE F3). BE: tsc + jest 2225/2225 + elevation lint guard zelené. FE: build + testy zelené. **Čeká BE restart + git (uživatel commituje ručně).**

> **Korekce při implementaci (§3.3):** de-elevated admin vidí **metadata** světa (shell: název) — potřebuje je pro elevation toggle a navigaci; gated zůstává **obsah** (pages/chat/settings/...). „Vidět jako hráč" se tedy týká obsahu, ne existence/jména světa.
**Typ:** Cross-cutting governance feature (BE + FE), mimo roadmapu (ad-hoc potřeba)
**Související:** R-20 (role-audit.md — platform admin vyřazen z governance světů), R-02 (admin bypass v ekonomice)

---

## 1. Cíl

Platformový Admin/Superadmin je často ve světě jako **běžný hráč**. Chce:
1. **Defaultně svět vidět a chovat se jako hráč** (jeho world membership role), bez „PJ pohledu" navíc.
2. **Na jeden klik dočasně získat admin/PJ moc** v konkrétním světě, když potřebuje vyřešit problém — bez třecích ploch („něco vidím a nemůžu").
3. Po vyřešení **moc zase složit**.

📚 **Elevation** = mocná role je trvale uspaná, aktivuje se vědomě jen na dobu zásahu. Bezpečnější než trvalý bypass (chrání před omylem, je auditovatelná).

---

## 2. Problém — současný stav

### 2.1 FE↔BE drift
- **BE worlds.service** (R-20): admin **nemá** governance moc (nastavení/členové/schvalování/transfer).
- **FE** ([WorldLayout.tsx:312-317](../../../../src/app/layout/WorldLayout/WorldLayout.tsx#L312), [WorldMembershipGuard.tsx:50](../../../../src/features/admin/components/WorldMembershipGuard.tsx#L50)): admina pořád staví do PJ pohledu (`globalRole <= Admin` bypass).
- Důsledek: FE ukáže PJ menu/tlačítka, BE akci 403kuje. Přesně „něco vidím, ale nemůžu".

### 2.2 Nekonzistence napříč BE moduly
Admin moc ve světě je dnes **roztříštěná** — někde je, někde ne:

| Doména | Admin moc dnes |
|---|---|
| worlds governance (nastavení, členové, transfer) | ❌ ne (R-20) |
| pages / chat / maps obsah | ✅ ano (bypass ponechán) |
| ekonomika (účty, nákupy) | ✅ ano (R-02 přidal) |
| ~17 dalších world modulů (počasí, kalendář, timeline, news, emotes, sounds, gm-notes, universe, …) | ✅ ano |

Celkem **~45 bypass bodů ve 20 modulech**, drtivě jednotný vzor `if (requester.role <= UserRole.Admin) return`. Stav je matoucí i bezpečnostně (admin má tichou moc skoro všude, ale nečekaně ne v governance).

💡 Elevation tenhle nepořádek **sjednotí pod jeden vědomý přepínač**: de-elevated = admin nemá moc nikde ve světě; elevated = má ji konzistentně všude (v daném světě).

---

## 3. Cílové chování

### 3.1 Stavy admina ve světě
- **De-elevated (default):** platformová role se ve world-scoped autorizaci **ignoruje**. Admin = jen jeho world membership role (Hrac, Ctenar, …) nebo nečlen. Vidí a může přesně to co odpovídající člen.
- **Elevated (pro daný svět):** platformový bypass **aktivní** → admin má plnou moc (read i write) ve VŠECH ~45 branách toho světa.

### 3.2 Scope
**Per-svět.** Elevuješ se v jednom světě; ostatní světy zůstávají de-elevated. (Bezpečnější, audit je jednoznačný.)

### 3.3 Read v de-elevated
Admin-nečlen na **private** světě v de-elevated stavu obsah **nevidí** (jako každý nečlen). Potřebuje dovnitř → elevuje se. To je cena za „vidět svět jako hráč".

⚠️ **Výjimka — restore opuštěného světa zůstává mimo elevation.** Obnova soft-smazaného světa (admin panel: `listDeleted` / `restore`) je platform-admin akce mimo world runtime, ne world-scoped brána. Admin tam svět vidí pořád (R-20 pojistka beze změny).

### 3.4 Platform akce mimo svět = beze změny
Ban účtu, admin panel, uživatelé, restore — to nejsou world-scoped brány, **elevation se jich netýká**. Admin je tam admin pořád.

### 3.5 Plná moderace v elevated stavu (vč. mazání chat zpráv)
V elevated stavu má admin/superadmin **plnou PJ moderaci**, výslovně včetně **mazání libovolných zpráv v chatech** (ne jen hodů kostek).

✅ **Ověřeno v kódu:** PJ/PomocnyPJ už dnes maže libovolnou zprávu svého světa ([chat.service.ts:1311-1357](../../../../../Projekt-ikaros/backend/src/modules/chat/chat.service.ts#L1311) — běžná zpráva projde přes `canManageChat`, kostky taktéž). Elevated admin to tedy dostane **automaticky** — stačí, aby `canManageChat` šla přes elevation helper. **Žádné rozšíření PJ pravomoci** se nemění (PJ to umí už teď), jen admin to získá v elevaci. (Pozn.: mazání kostek v global chatu `worldId=null` zůstává `role<=Admin` napřímo — není world-scoped, mimo elevation.)

⚠️ Bez času (D-3) je elevation vhodná i na dlouhé úklidové akce (hromadné mazání), což byl explicitní důvod pro „bez expirace".

---

## 4. Architektura

### 4.1 Princip „jeden bod, ne 45"
Všech ~45 bran čte `requester.role` z objektu sestaveného guardem. Místo úpravy 45 míst:

1. **Elevation stav se přilepí na `requester`** v guardu (jednou per request): `requester.elevatedWorldIds?: string[]` (admin může být elevated ve víc světech zároveň).
2. Zavede se **jediný helper** `worldAdminBypass(requester, worldId): boolean` = `requester.role <= Admin && requester.elevatedWorldIds?.includes(worldId)`.
3. **Všech ~45 `if (requester.role <= UserRole.Admin)` se nahradí** voláním helperu. Náhrada je mechanická a grepovatelná.
4. **Lint/CI guard:** žádný přímý `role <= UserRole.Admin` ve world-scoped modulech (musí jít přes helper). Hlídá, že se na žádnou bránu nezapomnělo a že žádná nová nevznikne mimo režim.

🔀 **Alternativa zamítnuta:** snížit `requester.role` globálně v de-elevated stavu — rozbila by platform-admin akce mimo svět (ban, panel). Bypass musí být world-scoped, ne globální potlačení role.

### 4.2 Kde žije elevation stav
**Server-side, perzistentní bez časové expirace** (D-3) — dedikovaná kolekce `world_elevations` `{ userId, worldId, activatedAt }`. (Vlastní kolekce, ne `security_tokens` — ty jsou stavěné na jednorázové TTL tokeny; elevation je perzistentní toggle stav.)

- Guard při requestu dotáhne aktivní elevation uživatele a naplní `requester.elevatedWorldId`.
- **Trvá do explicitního vypnutí NEBO odhlášení.** Žádná časová expirace. Logout elevation složí (bezpečnost — jinak by příští přihlášení bylo rovnou elevated).
- Restart BE elevation **neruší** (žije v DB) — vázáno na vědomé akce (toggle/logout), ne na infra události.

⚠️ Guard dělá +1 DB lookup per request. Mitigace: lookup **jen pro `role <= Admin`** (běžných uživatelů se netýká), případně krátká in-memory cache. Detail do impl. plánu.

### 4.3 API (návrh)
- `POST /worlds/:worldId/elevation` → zapne elevation (vytvoří security-token, audit log). Vrací `{ expiresAt }`.
- `DELETE /worlds/:worldId/elevation` → složí moc (smaže token, audit log).
- `GET /worlds/:worldId/elevation` → stav (elevated? do kdy?). (Nebo přibalit do existujícího world-status.)

### 4.4 Audit
Každá aktivace/složení → `admin_audit_log` (existuje): `action: 'world.elevation.activated' | '.revoked'`, `targetType: 'world'`, `targetId: worldId`.

---

## 5. FE

- **Zrušit slepý `globalRole <= Admin` bypass** v `isPJ`/`isPJForNav` ([WorldLayout.tsx](../../../../src/app/layout/WorldLayout/WorldLayout.tsx)) a `fallbackGlobalRoles` v [WorldMembershipGuard.tsx](../../../../src/features/admin/components/WorldMembershipGuard.tsx) → nahradit stavem „jsem elevated v tomhle světě?". Tím se opraví drift z §2.1.
- **Zdroj pravdy:** elevation stav z BE (GET), držený v atom/query, invalidace po toggle.
- **UI toggle:** zámek v hlavičce světa, viditelný jen pro platform Admin+.
  - 🔓 „Aktivovat admin pravomoci" (de-elevated) → po potvrzení zapne, refetch práv, svět se přepne do PJ/admin pohledu.
  - 🔒 „Složit pravomoci (aktivní do HH:MM)" (elevated) → vypne.
- Vizuální indikátor, že jsem v elevated režimu (aby admin nezapomněl, že má moc).

---

## 6. Klíčová rozhodnutí — k potvrzení

| # | Rozhodnutí | Návrh (doporučení) |
|---|---|---|
| **D-1** | Scope | ✅ **per-svět** |
| **D-2** | Read v de-elevated | ✅ admin = jako jeho membership / nečlen (ztrácí i read bypass) — viz §3.3 |
| **D-3** | Časový limit elevace | ✅ **žádný** — čistě on/off toggle, trvá do vypnutí/odhlášení (důvod: dlouhé úklidové akce) |
| **D-4** | Re-auth při aktivaci | ✅ **V1 bez** (jen klik + potvrzení + audit); 2FA/heslo volitelně později |
| **D-5** | Default po loginu | ✅ vždy **de-elevated** |
| **D-6** | Úložiště stavu | ✅ dedikovaná kolekce `world_elevations` (bez TTL) |
| **D-7** | Moderace chatu | ✅ elevated admin/superadmin maže **libovolné** chat zprávy (§3.5) |

---

## 7. Mimo rozsah
- Granularita „elevate jen na čtení" / per-modul — V1 je all-or-nothing per svět.
- Elevation pro ne-admin role (PomocnyPJ apod.) — netýká se.
- Globální „god mode všude naráz" — zamítnuto (§4.1).
- Změna platform-admin akcí mimo svět (§3.4).

---

## 8. Akceptační kritéria
- [ ] Admin (nečlen) na private světě v de-elevated stavu: obsah nevidí (404/403 jako nečlen), FE neukazuje PJ menu.
- [ ] Admin člen-Hrac de-elevated: vidí/může přesně jako Hrac, žádná PJ tlačítka.
- [ ] `POST /worlds/:id/elevation` → admin pak projde write branou (např. vytvoří stránku, změní nastavení) v tom světě.
- [ ] Elevation v světě A **neplatí** v světě B.
- [ ] Po expiraci/`DELETE` admin zase 403/nevidí jako de-elevated.
- [ ] Audit log má záznam activated + revoked.
- [ ] Grep guard: nula přímých `role <= UserRole.Admin` ve world-scoped modulech (vše přes helper).
- [ ] FE drift pryč: žádné PJ tlačítko, které BE 403kuje.
- [ ] BE `npx jest --maxWorkers=2` zelené; FE `npm run build` zelený.

---

## 9. Otevřené otázky — vyřešeno
- ~~**OQ-1** (read v de-elevated)~~ → ✅ ANO, admin ztrácí i read (D-2).
- ~~**OQ-2** (limit)~~ → ✅ žádný čas, on/off toggle (D-3).
- ~~**OQ-3** (rozsah)~~ → ✅ naráz, všech ~45 bran (D-7 + §4.1).

Zbývá ověřit v plánu: přesné chování `chat.service.deleteMessage` (zda je mazání už PJ-plné, nebo nutno rozšířit — §3.5).
