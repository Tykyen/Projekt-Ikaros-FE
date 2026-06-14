# Spec 6.8-followup — PJ identita per člen (vlastní avatar) + persona slot v headeru

**Status:** ✅ Implementováno (2026-06-14) — čeká BE restart + manuální smoke
**Rozsah:** **FE + BE** (per-člen avatar na členství, režim v nastavení, chat resolver, header, editor).
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (backend), větev `main`
**Velikost:** odhad ~12–15 souborů. BE: schema+DTO+service+toEntity+members enrich+settings migrace (~6). FE: typy+pjPersona resolver+WorldLayout header+editor (režim + můj avatar)+testy (~7–10).
**Autor:** PJ + Claude
**Datum:** 2026-06-14
**Souvisí:** [spec-6.8.md](spec-6.8.md) (PJ persona v chatu), [spec-5.1.md](../phase-5/spec-5.1.md) (header persona slot, odloženo na fázi 8).

---

## 1. Cíl

Dnes celé vedení světa (role ≥ Pomocný PJ) vystupuje pod **jednou sdílenou identitou „PJ"** — záměrná anonymizace ([pjPersona.ts](../../../src/features/world/chat/lib/pjPersona.ts)). Dva různí PJ jsou v chatu nerozlišitelní.

Cíl: umožnit **per-svět volbu** — zachovat anonymní „PJ", **nebo** přepnout na **rozpoznatelné vedení**, kde každý PJ / Pomocný PJ vystupuje pod **vlastním obrázkem** a textem podle své role („PJ" / „Pomocný PJ"). Příjemce tak pozná, *který* člen vedení píše (podle obrázku) i *že* je to vedení (text role). Součástí je realizace odloženého **persona slotu v headeru**, který tutéž identitu zobrazí.

> **Klíčové zjednodušení (rozhodnutí 2026-06-14):** žádné vymyšlené přezdívky. Text = role, rozlišuje **avatar**. Tím odpadá per-člen textové pole — na backendu stačí per-člen **avatar**.

---

## 2. Současný stav

| Vrstva | Dnes |
|---|---|
| **WorldSettings.pjChatPersona** | jedna sdílená persona: `enabled`, `name` (default „PJ"), `avatarUrl`. Per svět, ne per člen. |
| **Editor** | [PjChatPersonaEditor](../../../src/features/world/pages/WorldSettingsPage/components/PjChatPersonaEditor.tsx) v tabu „PJ v chatu" — checkbox + Jméno persony + Avatar persony. PJ-only. |
| **Chat resolver** | [`makePjDisplayResolver(members, persona)`](../../../src/features/world/chat/lib/pjPersona.ts) → vrací **stejný** `{name,avatarUrl}` pro všechny `role ≥ PomocnyPJ`. NPC override vyhrává. Konzument: [ChannelView.tsx:204](../../../src/features/world/chat/components/ChannelView.tsx#L204). |
| **Header** | persona slot fallbackuje na účet, neklikatelné ([WorldLayout.tsx:523](../../../src/app/layout/WorldLayout/WorldLayout.tsx#L523)). |
| **WorldMembership** | `role`, `characterPath`, `avatarUrl` (= obrázek postavy), `group`. **Žádný per-člen avatar vedení.** |

---

## 3. Návrh řešení

### 3.1 Datový model

**`WorldMembership` += per-člen avatar vedení** (BE, world-scoped):
```ts
pjPersonaAvatarUrl?: string;  // obrázek, pod kterým člen vystupuje jako vedení
```
BE checklist (memory `project_be_field_checklist`): schema → DTO → service → **toEntity mapper** → enrich do `GET /worlds/:id/members`. Bez toEntity GET pole tiše zahodí.

**`WorldSettings.pjChatPersona` += režim:**
```ts
mode: 'unified' | 'individual';  // 'unified' = dnešní sdílené „PJ"
```
**Migrace:** `enabled:true`/`undefined` → `'unified'`; `enabled:false` → `'individual'`. `name`/`avatarUrl` zůstávají — používají se jen v `unified`.

### 3.2 Dva režimy (přepíná jen hlavní PJ)

| | **unified** (default, dnešek) | **individual** (nový) |
|---|---|---|
| **Text** | sdílené „PJ" pro všechny | **role** člena: „PJ" / „Pomocný PJ" |
| **Avatar** | jeden sdílený (`pjChatPersona.avatarUrl`) | **per člen** (`pjPersonaAvatarUrl` → účet → default) |
| **Rozliší hráč, kdo píše?** | ne (záměr) | ano — podle obrázku, role z textu |

NPC override („píšu za bytost") vyhrává v **obou** režimech (beze změny).

### 3.3 Nastavení — tab „PJ v chatu" (rozšíření + oprava přístupu)

⚠️ **Oprava přístupu:** tab „PJ v chatu" má dnes `minRole: WorldRole.PJ` ([WorldSettingsPage.tsx:122](../../../src/features/world/pages/WorldSettingsPage/WorldSettingsPage.tsx#L122)) → **Pomocný PJ ho vůbec nevidí**. Aby si Pomocný PJ mohl nastavit vlastní obrázek, **snížíme `minRole` tabu na `WorldRole.PomocnyPJ`** a uvnitř gateujeme po sekcích podle role:

| Sekce v tabu | Vidí | Význam |
|---|---|---|
| Přepínač režimu `Anonymně`/`Rozpoznatelně` + sdílený editor (Jméno + Avatar persony) | **jen PJ** | politika světa |
| **„Můj obrázek vedení"** (`pjPersonaAvatarUrl`, self-service) | **PomocnyPJ+** | každý svůj |

→ PJ vidí přepínač + sdílený editor + svůj „Můj obrázek vedení"; **Pomocný PJ vidí jen „Můj obrázek vedení"** (svůj).

Detaily:
1. **Přepínač režimu** `Anonymně` ↔ `Rozpoznatelně` (= `unified`/`individual`) — **PJ-only**. Nahradí dnešní checkbox. U `Rozpoznatelně` varovat: *„Hráči uvidí, který konkrétní PJ jim píše — i zpětně u starších zpráv."*
2. V režimu `Anonymně` má smysl jen sdílený editor (PJ); v `Rozpoznatelně` se uplatní per-člen obrázky. „Můj obrázek vedení" se zobrazuje **vždy** (PomocnyPJ+) jako příprava, ale projeví se až v `Rozpoznatelně` — s poznámkou o aktuálním režimu.
3. **„Můj obrázek vedení"** = avatar upload, self-service, zapisuje `pjPersonaAvatarUrl` na **vlastní** membership. Reuse avatar-části `PjChatPersonaEditor`. Náhled: „Zobrazíš se jako **{tvá role}** + tento obrázek."

> 💡 **Self-service:** přepínač režimu je politika světa (PJ), ale vlastní obrázek si nastaví každý z vedení sám. Proto tab vidí od PomocnyPJ, ale přepínač jen PJ.

> ⚠️ **BE musí gate vynutit taky:** snížení viditelnosti tabu je jen FE. Zápis `pjChatPersona.mode`/sdílené persony = PJ-only i na BE (settings PUT); zápis `pjPersonaAvatarUrl` = jen na vlastní membership (cizí → 403). FE gate je UX, BE gate je bezpečnost.

### 3.4 Header — realizace persona slotu

Větve (jediné dotčené místo [WorldLayout.tsx:523](../../../src/app/layout/WorldLayout/WorldLayout.tsx#L523)):

| Větev | Text | Avatar | Klik → |
|---|---|---|---|
| Hráč s postavou | jméno postavy | obrázek postavy | `/svet/:slug/<characterPath>` |
| Vedení · `unified` | „PJ" / „Pomocný PJ" | sdílený persona avatar → účet | `/svet/:slug/denik-pj` |
| Vedení · `individual` | „PJ" / „Pomocný PJ" | **můj** `pjPersonaAvatarUrl` → účet | `/svet/:slug/denik-pj` |
| Hráč bez postavy | username | účet | — (neklik) |

Logika do čistého helperu `resolvePersona(...)` (testovatelné bez Reactu). Klikatelné větve = `<Link>` (cursor/focus přes skin tokeny), hráč-bez-postavy = `<div>`.

### 3.5 Chat — rozšíření resolveru (6.8)

`makePjDisplayResolver(members, persona)` se větví podle `persona.mode`:
- `unified` → dnešní chování (sdílené `{name, avatarUrl}` pro všechny vedení).
- `individual` → per-sender: `{ name: roleLabel(m.role), avatarUrl: m.pjPersonaAvatarUrl || accountAvatar(m) }`, kde `roleLabel`: PJ→„PJ", PomocnyPJ→„Pomocný PJ".

`members` musí nést `pjPersonaAvatarUrl` + účet avatar (už má `user.avatarUrl`) + `role` (má). Žádná změna `MessageItem` kromě toho, že jméno teď může být „Pomocný PJ".

### 3.6 Fallbacky (jednotné napříč headerem i chatem)

- **Text:** role člena („PJ" / „Pomocný PJ"). (V `unified` sdílené „PJ".)
- **Avatar:** `pjPersonaAvatarUrl` → účet (`user.avatarUrl`) → default kolečko.

---

## 4. Out of scope

- Vymyšlené přezdívky vedení (text = vždy role).
- Per-kanál persona, víc obrázků na člena.
- Centrální správa cizích avatarů hlavním PJ (jen self-service + world přepínač).
- Deep-link rovnou na deník tab postavy / hráčův výběr z více postav (fáze 8).

---

## 5. Acceptance kritéria

1. `WorldMembership` má `pjPersonaAvatarUrl?`; čte se v `GET /members` (toEntity + enrich).
2. `WorldSettings.pjChatPersona.mode: 'unified'|'individual'`; migrace z `enabled` nezmění existující světy vizuálně (default `unified`).
3. **unified**: chat ukazuje všechno vedení jako sdílené „PJ" — beze změny vůči dnešku.
4. **individual**: chat ukazuje per-člen vlastní avatar + text role („PJ"/„Pomocný PJ"); dva členové vedení jsou rozlišitelní obrázkem.
5. Tab „PJ v chatu" viditelný od `PomocnyPJ` (Pomocný PJ vidí jen „Můj obrázek vedení"; PJ navíc přepínač + sdílený editor). Přepínač režimu / sdílená persona = PJ-only (FE i BE); „Můj obrázek vedení" zapisuje jen na vlastní membership (cizí = 403).
6. Header: hráč-s-postavou → klik na postavu; vedení → „PJ"/„Pomocný PJ" + avatar (dle režimu) → klik na deník PJ; hráč-bez-postavy → username neklik.
7. NPC override vyhrává v obou režimech.
8. `resolvePersona` (header) i resolver chatu pokryty testy pro oba režimy + fallbacky avataru.
9. Žádný hardcoded barevný literál. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓ (FE); BE `typecheck`+`lint:check`+`jest` (maxWorkers=2) ✓.
10. `mobil-desktop` audit headeru, chat bubliny i editoru ✓; touch target ≥ 44 px. **Po BE změně restart** (memory `feedback_be_restart_required`).

---

## 6. Test plán

### FE (Vitest + RTL)
- `resolvePersona` — 4 větve × 2 režimy × fallbacky avataru.
- `makePjDisplayResolver` — `unified` shared; `individual` per-sender role text + per-člen avatar (fallback účet); NPC override.
- `WorldLayout` — individual: header avatar = můj persona avatar; klik → `denik-pj`.
- Odhad **+8–12 FE testů**.

### BE (Jest)
- members GET vrací `pjPersonaAvatarUrl` (toEntity).
- settings PUT akceptuje `mode`; migrace `enabled`→`mode`.
- zápis per-člen avataru = vlastní membership (self), cizí = 403.

### Manuální smoke
- Svět `unified` → 2 členové vedení píší → oba „PJ" + společný obrázek (anonymní).
- Přepnout `individual`, Karel i Eva si nahrají svůj obrázek → chat i header je rozliší (Karel „PJ", Eva „Pomocný PJ", každý svůj obrázek).
- Hráč s postavou → header klik → postava; bez postavy → username neklik.

---

## 7. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Přepnutí na `individual` zpětně odhalí identity (render-time) | Jistota (záměr) | Střední | UI varování u přepínače; default zůstává `unified`. |
| Field-drift (schema bez toEntity → GET zahodí avatar) | Střední | Střední | BE checklist od toEntity; test members GET. |
| Migrace `enabled`→`mode` rozbije existující světy | Nízká | Vysoký | Mapování + test; default `unified` = dnešní chování. |
| BE běží starý bundle po změně | Střední | Nízký | restart / `nest --watch` (memory). |

**Rollback:** revert FE+BE commitu. Per-člen avatar je aditivní; `mode` má migraci. `unified` = status quo.

---

## 8. Rozhodnutí (potvrzeno 2026-06-14)

- Plná verze, **per-člen avatar** (žádná textová přezdívka — text = role).
- Per-svět přepínač `Anonymně`/`Rozpoznatelně` = **PJ-only**; vlastní obrázek = **self-service** (každý člen vedení svůj).
- V `individual` se ukazuje **role** člena („PJ"/„Pomocný PJ"), rozlišuje **avatar**.
- Vedení klik (header) → **deník PJ**.

---

**Po schválení specu:** spustím `frontend-design` (redesign tabu „PJ v chatu" — přepínač režimu + „Můj obrázek vedení"), pak napíšu implementační plán (BE a FE odděleně — memory `feedback_no_mixed_be_fe_batch`).
