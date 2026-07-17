# Spec 15.10 — Správa hráčů v jeskyni (žádosti · přítomní · pozvánky · přihláška s postavou)

**Stav:** ✅ SCHVÁLENO v3 (design A+B+C potvrzen 2026-07-15) — čeká na implementační plán · **Fáze:** 15 (parita stolu / komunita) · **Rozsah:** FE + BE — velké (A malá · B nová entita `WorldInvite` · C životní cyklus postavy draft→pending→approved). **Implementace A+B+C dohromady** (sdílí multi-typ „ke zpracování" frontu).
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE) · **Autor:** PJ + Claude · **Datum:** 2026-07-15
**Souvisí:** [15B.6 sociální sdílení / pozvánkové odkazy](../phase-15B/spec-15B.6-social-sdileni.md), [19.3 nábory](spec-19.3.md), presence systém, `world-access-request` modul, [project_presence_panel_role], [project_world_dashboard_layout], [project_akj_pj_bypass]

---

## 1. Cíl

Dát PJ **správu jeskyně přímo v kontextu světa**, ne přes globální adresář a poštu:
1. **Schvalovat žádosti o vstup** tam, kde svět spravuje (dnes jen na `/ikaros/uzivatele → Zpracovat`, což nutí PJ odejít ze světa).
2. Vidět, **kdo z členů je právě online**.
3. **Pozvat / přidat hráče** do světa (dnes nemožné — vše je „hráč sám požádá").

Vše ve **vysunovacím panelu** (drawer), aby PJ nemusel překlikávat na jinou stránku.

---

## 2. Kontext / motivace

Citace testera (2026-07-15): *„Vidím počet hráčů… hlavně by bylo super přidat funkci Přidat/Pozvat hráče, zvlášť mám-li soukromou jeskyni. Hlavně bych chtěl operovat s věcmi ke zpracování (schválení žádostí o vstup) v konkrétní jeskyni, ne z hlavní stránky složitě přes notifikace/poštu. TOHLE ZDE CHYBÍ! Ideálně vysunovací okno, ať mě to nepřesměruje. Umístit viditelně, ale ať nepřekáží."*

**Co dnes je (audit kódu):**
- ✅ Žádosti o vstup **fungují** end-to-end — entita `WorldAccessRequest`, approve/reject endpointy, WS realtime.
- ❌ PJ je schvaluje **jen v globální frontě** `/ikaros/uzivatele → Zpracovat` (`ZpracovatTab` → `WorldAccessRequestRenderer`). V kontextu světa žádná sekce „čekající žádosti".
- ❌ **Pozvat hráče vůbec nejde** — modul `worlds` nemá invite entitu/endpoint. `MembersTab` spravuje jen existující členy.
- 🟡 **Presence je globální** (`OnlineDot`, `useIsOnline`), panel „Přítomní" existuje jen uvnitř chatu (`ChannelMemberPanel`), ne na dashboardu světa.

**Co se stane, když ne:** PJ soukromé jeskyně nemá jak dostat hráče dovnitř bez toho, aby hráč sám našel svět a požádal; a schvalování žádostí přes globální adresář + poštu je pro testery hlavní tření („překlikávání sem a tam").

---

## 3. Audit současného stavu (cesty)

### 3.1 Žádosti o vstup — BE (funkční)
- Schema: `backend/src/modules/worlds/schemas/world-access-request.schema.ts` — `{ worldId, userId, requestedAt }`, unique `(worldId,userId)`.
- Service: `worlds.service.ts` — `requestAccess:890`, `approveAccessRequest:978` (tx: smaž AR + vytvoř membership **Čtenář**), `rejectAccessRequest:1103`, `findMyAccessRequests:1139`.
- Controller: `worlds.controller.ts` — `POST /worlds/:id/access-request:273`, `.../approve:301`, `.../reject:317`.
- Moderace-gate: `assertCanModerateAccessRequests:1162` = vlastník **NEBO** člen role ≥ PJ **NEBO** platform Admin s aktivní elevací.
- Agregace do fronty: `world-access-request.provider.ts` → generický `pending-actions` modul (`GET /pending-actions` + `/count`).

### 3.2 ⚠️ Bug — co-PJ nevidí žádosti (přibaleno k této spec)
`WorldAccessRequestProvider.scopeForUser` (`world-access-request.provider.ts:103-112`) scopuje ne-adminům jen světy, které **vlastní** (`findByOwnerId`). Ale approve endpoint dovolí i **co-PJ** (member role ≥ PJ). → **Co-PJ má právo schválit, ale žádost ve frontě nevidí.** Nový per-world listing (§4.1) potřebuje stejný scope, takže bug řešíme rovnou: scope = „vlastník **NEBO** člen role ≥ PJ".

### 3.3 Žádosti o vstup — FE
- Hráč žádá: `JoinCTA.tsx` + `useWorldJoin.ts` (větví dle `accessMode`).
- PJ schvaluje: `features/users/pages/UsersPage.tsx:90` → `ZpracovatTab` → `WorldAccessRequestRenderer.tsx` (Přijmout/Odmítnout), `useApproveAccessRequest`/`useRejectAccessRequest` (`useWorldJoin.ts:64,89`).
- Realtime: `useWorldAccessSocket.ts` (`world:access-requested/approved/rejected/cancelled`), mount v `IkarosLayout`.
- Count: `usePendingActionsCount()` → `{ total, byType }` (`features/users/api/usePendingActions.ts`).

### 3.5 ⭐ Stránka „Hráči světa" — přirozený domov správy (upřesnění testera 2026-07-15)
- `features/world/pages/WorldMembersPage/WorldMembersPage.tsx` (spec 5.6, route `/svet/:worldSlug/hraci`, odkaz z dashboard dlaždice „Hráči").
- **Read-only adresář** členů: grupuje **Pán jeskyně** (PJ) / **Pomocní PJ** / custom skupiny (`customGroups` + `groupColors`) / **Bez skupiny**; `MemberCard` per člen (avatar, jméno, role chip, „Hraje za").
- **Dnes schválně skrývá pending žadatele** (ř. 75: „Zadatelé se nezobrazují") a je **jen pro čtení** — správa rolí/skupin je v `WorldSettingsPage → MembersTab`.
- Data: `useWorldMembers`, `useWorldSettings`, `useCharacterDirectory`, filtr `isWorldPlayer`.
- **→ Domov správy hráčů.** Sem patří: online tečky na kartách, sekce „Čekající žádosti" (PJ), tlačítko „Pozvat" (PJ). Drawer (§3.4) je jen rychlý shortcut na totéž odkudkoli ve světě.

### 3.4 Presence + dashboard + drawer (stavební kameny)
- Presence: `src/shared/presence/` — `useIsOnline(userId)`, `usePresenceStatus(userId)`, `OnlineDot.tsx` (zelená/amber/offline overlay tečka). Mapa `Map<userId,status>`, globální (ne per-svět).
- Členové: `useWorldMembers(worldId)` (`features/world/api/useWorldMembers.ts`), počet hráčů = `filter(isWorldPlayer)`.
- Roster předloha: `ChannelMemberPanel.tsx` (grupování dle role, online-first sort, klik→deník).
- Dashboard: `WorldDashboard.tsx` — 3sloupcový grid, dlaždice `DashTile` (`value` + `badge`).
- Hlavička světa: `WorldLayout.tsx` — blok akcí `s.actions:579-655` (hledání, +Nová stránka, ✉ Pošta, ⚙ Nastavení). Sem patří zvoneček.
- Drawer vzor: `features/world/pages/CalendarPage/components/DayDetailDrawer.tsx` (side-panel zprava, backdrop, focus-trap, ESC, pozadí zůstává vidět). **Sdílená `Drawer` komponenta neexistuje** — buď reuse `Modal`, nebo tento vzor.
- Přiřazení postavy členovi (existuje): `MembersTab` + `useUpdateMemberCharacter`.

### 3.6 Tvorba postavy + schvalování (pro fázi C) — realita: flow NEEXISTUJE
- **Postavu tvoří jen PJ.** BE brána `pages.service.ts:1265-1290` `assertCanWrite` vyžaduje role ≥ `PomocnyPJ (4)` → `Hrac/Ctenar/Zadatel` dostane 403. FE tlačítka „Nová postava" PJ-only (`CharacterDirectory.tsx:165`, `MyCharacterPage.tsx:43`, `MemberRow.tsx:58`).
- **Postava = Page** (`type='Postava hráče'`) + auto-Character kontejner (`pages.service.ts:328-355`), vazba na člena přes `WorldMembership.characterPath` (= Character.slug). Tvorba: `NewPageWizardModal` → `/svet/:slug/nova-stranka?type=PostavaHrace`.
- **Žádný stav postavy** — `character.interface.ts:49-83` nemá `status/draft/pending/approved`. Postava je živá hned. Žádný schvalovací krok.
- **Žádost o vstup a postava jsou oddělené** — `approveAccessRequest` dělá jen Čtenáře bez postavy; `WorldAccessRequest` nese jen `{worldId,userId,requestedAt}`.
- ~~**D-062 `requestCharacter`** (`POST /worlds/:id/request-character`) = slepá kostra: sníží `Ctenar→Zadatel`, emituje **mrtvý** event `world.character.requested` (žádný listener, žádný FE). → recyklujeme jako hák, nestavíme duplicitu.~~ **Neplatí — varianta A hák nakonec nevyužila** (cesta ke hraní vede přes access-request s `characterDraft` → rovnou `Hrac`), takže endpoint zůstal mrtvý a **2026-07-16 byl smazán (D-065)**. Role `Zadatel`(0) v enumu zůstává jako sentinel „žádná role" + obranná hrana nad historickými daty — viz `docs/funkce/09-svet-vstup-clenstvi.md`.
- **`AccessRequirement`** (`AccessRequirementEditor.tsx`, `pages.service.ts:passesAccess`) = kdo smí VIDĚT stránku (privacy/shielding, spec 8.1) — **nesouvisí** se vstupem/schválením. Nezaměňovat.

---

## 4. Návrh řešení

Tři fáze, **implementované dohromady**. **A** staví skoro celá z hotových dílů (malý BE). **B** je nová BE entita `WorldInvite`. **C** je životní cyklus postavy (draft→pending→approved) + spojení „žádost o vstup + návrh postavy".

### 4.0 Rozhodnutí

| # | rozhodnutí | volba | důvod |
|---|---|---|---|
| R1 | **Primární domov správy** | **Stránka „Hráči světa"** (`WorldMembersPage`, `/svet/:slug/hraci`) — dnes read-only, rozšíří se o správu. | Testerem označené přirozené místo; už grupuje členy dle role. Sem: online tečky + žádosti (PJ) + pozvat (PJ). |
| R1b | **Rychlý přístup odkudkoli** | **Zvoneček „ke zpracování" v hlavičce světa** (`WorldLayout` s.actions), jen `isPJ`, badge = počet žádostí → otevře **drawer** se seznamem žádostí + zkratkou na stránku Hráči. | Tester: „ať mě to nepřesměruje / moc překlikávání" — přístup k žádostem z mapy/chatu bez opuštění stránky. Drawer **sdílí `RequestsList`** se stránkou (nula duplicity). |
| R1c | **Dashboard dlaždice „Hráči"** | Beze změny domova — jen **přidat badge** = počet čekajících žádostí (jen `isPJ`). Klik vede na stránku Hráči (jako dnes). | Upozorní na frontu i z dashboardu; žádná nová dlaždice/šum. |
| R2 | **Forma panelu** | **Stránka = plná správa; drawer zprava = rychlý shortcut** (vzor `DayDetailDrawer`, ne full Modal). | Ctí obojí: tvůj point (domov = stránka) i testera (nepřesměrovat = drawer). |
| R3 | **Přítomní (online)** | **Online tečky `OnlineDot` přímo na `MemberCard`** na stránce Hráči (online-first sort volitelně) — NE samostatná sekce. | Sjednotí „kdo je online" s existujícím rosterem; minimální zásah, odpovídá screenshotu. |
| R3b | **Obsah stránky Hráči** | roster (+online) → nahoře **Čekající žádosti** (PJ, dnes skryté) → hlavička s tlačítkem **Pozvat** (PJ, fáze B). | Vše „lidé v jeskyni" na jednom domově. |
| R4 | **Per-world žádosti** | **Nový BE endpoint** `GET /worlds/:id/access-requests` (moderátor-gated), NE klientský filtr globální fronty. | Scoped, čisté, sjednotí scope a opraví co-PJ bug (§3.2). Globální fronta zůstává beze změny. |
| R5 | **Online v jeskyni** | průnik `useWorldMembers(worldId)` × `useIsOnline` — **bez nové BE presence**. | Presence infra existuje globálně; per-world scoping netřeba. |
| R6 | **Pozvánka — směr** | **Cílená pozvánka existujícího uživatele** (B1) + **pozvánkový odkaz/token** (B2). | Tester: „přidat i pozvat", „soukromá jeskyně". B1 pro lidi na platformě, B2 pro sdílení ven. |
| R7 | **Souhlas pozvaného** | **POVINNÝ** — pozvánka se objeví pozvanému v „ke zpracování", on přijme/odmítne. PJ NEpřidá člověka do světa bez jeho svolení. | Symetrie se žádostí; nikdo se neocitne ve světě, o který nestál (GDPR/UX). |
| R8 | **Výchozí role po přijetí** | **Čtenář** (stejně jako u schválené žádosti); PJ pak povýší v `MembersTab`. | Konzistence s `approveAccessRequest`. |
| R9 | **Odkaz vs. 15B.6** | 15B.6 = marketingové sdílení URL světa (privátní → „Požádat o vstup"). **B2 = skutečný invite token** s expirací/limitem použití → po přijetí rovnou membership (pre-approved). Koexistují. | Různý účel: 15B.6 objevitelnost, B2 řízená pozvánka. |
| **Fáze C** | | | |
| R11 | **Vstup + postava** | **SPOJENÉ** — „Chci hrát" = hráč rovnou vytvoří stránku postavy → tím vzniká žádost o vstup s navrženou postavou. PJ **jedním schválením** pustí dovnitř + schválí postavu → rovnou **Hráč**. Prostá „chci jen číst" žádost (Čtenář, bez postavy) zůstává vedle. | Testerovo „při žádosti vytvořit postavu"; pro soukromou fórovku přirozené (přijdeš, napíšeš postavu, PJ pustí). |
| R12 | **Stav postavy** | Nové pole `status: 'pending' \| 'approved'` na Page „Postava hráče" (draft = rozepsané, řeší autosave/nezveřejněno — pro V1 sloučeno do `pending`). **Default `approved`** (existující + PJ-tvorba = zpětná kompat). Hráčem tvořená = `pending`. | Minimální model; nerozbije existující postavy. |
| R13 | **Viditelnost pending postavy** | `pending` postavu vidí **jen autor + moderátoři** (PJ/co-PJ/owner). V rosteru/adresáři se `pending` neukazuje (nováček je „bez postavy", dokud PJ neschválí). | Nedopečená postava není veřejná; PJ ji vidí ke schválení. |
| R14 | **Kdo smí tvořit vlastní návrh** | Relaxovat bránu: **Žadatel/Čtenář smí vytvořit `pending` Page `Postava hráče` JEN pro sebe (owner=self) a JEN pro svět, kam žádá/je členem.** Jinak brána ≥ PomocnyPJ beze změny. | Umožní hráči návrh, bez otevření zápisu do světa. Úzký, ověřený povrch. |
| R15 | **Schválení / odmítnutí postavy** | PJ ve frontě „ke zpracování": **Schválit** → postava `approved` + membership `Hrac` + `characterPath`. **Odmítnout** → volba: (a) vrátit k přepracování (zůstane `pending`, hráč edituje) nebo (b) pustit bez postavy (Čtenář) / (c) zamítnout vstup celý. | Symetrie s access-request; PJ má kontrolu nad kvalitou postavy. |
| R16 | **Multi-typ fronta „ke zpracování"** | `RequestsList` + zvoneček/drawer/stránka Hráči + pending-actions umí **víc typů**: `access-request` (vstup) · `character-request` (návrh postavy). Recyklovat mrtvý event `world.character.requested` jako pending-action provider. | Sdílená infra A+C; kdyby A byla single-typ, přepisovala by se — proto A+C dohromady. |

### 4.1 Fáze A — Správa jeskyně (drawer + zvoneček + dlaždice)

**BE (malé):**
- Nový world-scoped endpoint `GET /worlds/:id/pending-actions` → pending položky world-a, **multi-typ** (R16): `access-request` + (fáze C) `character-request`. Item `{ type, id, userId, displayName, avatar, createdAt, meta }`. Gate = `assertCanModerateAccessRequests`. (V A vrací jen `access-request`; C přidá druhý typ do téhož endpointu.)
- Fix scope `WorldAccessRequestProvider.scopeForUser` → „vlastník NEBO člen role ≥ PJ" (§3.2). Sjednotit s helperem použitým v novém endpointu.
- Approve/reject reuse existujících endpointů (beze změny).

**FE — sdílené komponenty (napsat jednou, použít na stránce i v draweru):**
- `RequestsList.tsx` — **multi-typ** (R16) seznam položek „ke zpracování" pro daný svět: `access-request` (žádost o vstup) + `character-request` (návrh postavy, fáze C). Každá položka: avatar, jméno, typ (štítek „Žádá o vstup" / „Navrhl postavu {name}"), čas + Přijmout / Odmítnout inline. Prázdný stav `<EmptyState>` „Nic ke zpracování". Renderer per typ (vzor `rendererRegistry` z globální fronty).
- Hook `useWorldPendingActions(worldId)` — GET nového world-scoped endpointu (§4.1 BE), sloučí oba typy + badge count.

**FE — stránka „Hráči světa" (domov, `WorldMembersPage`):**
- **Online tečky:** `OnlineDot` na `MemberCard` přes `useIsOnline(member.userId)` (R3). Volitelně online-first sort v sekcích.
- **Sekce „Čekající žádosti"** nahoře, **jen `isPJ`** (dnes skryté ř. 75) → `<RequestsList>`.
- **Hlavička stránky:** tlačítko **„Pozvat hráče"** (jen `isPJ`) → otevře invite UI (fáze B). Dnešní `pageHead` má jen `<h1>`.

**FE — zvoneček + drawer (rychlý shortcut, R1b):**
- **Zvoneček v hlavičce** (`WorldLayout` s.actions, ~ř. 599): `HeaderButton` (jen `isPJ`), badge = `useWorldAccessRequests`. Klik → drawer.
- **Drawer** `WorldRequestsDrawer.tsx` (vzor `DayDetailDrawer`): `<RequestsList>` + odkaz „Otevřít správu hráčů" (na stránku Hráči). Žádná duplicita logiky — jen obal.
- **Dashboard dlaždice „Hráči"** (`WorldDashboard.tsx`): přidat `badge` = počet žádostí (jen `isPJ`); klik vede na stránku Hráči (beze změny cíle).
- Realtime: reuse `useWorldAccessSocket` — po `world:access-requested` invaliduje seznam + badge (stránka, drawer i dlaždice live).

### 4.2 Fáze B — Pozvánky

**BE — nová entita `WorldInvite`** (modul `worlds`):
```ts
// worldinvites — kolekce
{
  worldId: ObjectId,
  kind: 'user' | 'link',
  invitedUserId?: ObjectId,   // kind='user'
  token?: string,             // kind='link', náhodný unikát
  createdBy: ObjectId,        // PJ/owner
  role: WorldRole,            // default Čtenář (R8)
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired',
  expiresAt?: Date,
  maxUses?: number,           // kind='link'
  usedCount: number,          // kind='link'
  createdAt, updatedAt
}
```
Indexy: `(worldId, invitedUserId, status)` unique-ish pro pending user-invite (1 aktivní pozvánka na uživatele/svět), `token` unique.

**Endpointy:**
- `POST /worlds/:id/invites` — vytvořit. Body `{ kind, invitedUserId?, role?, expiresInDays?, maxUses? }`. Gate = moderátor. `kind='user'` → validace, že už není člen/nemá pending; emit WS pozvanému.
- `GET /worlds/:id/invites` — aktivní pozvánky světa (PJ přehled).
- `DELETE /worlds/:id/invites/:inviteId` — revoke.
- **Přijetí cílené (B1):** pozvánka se objeví pozvanému přes `pending-actions` (nový provider `WorldInviteProvider`, typ `WorldInvite`). `POST /worlds/:id/invites/:inviteId/accept` (vytvoří membership role R8, status=accepted) · `.../decline`.
- **Přijetí odkazem (B2):** `POST /invites/:token/accept` (JWT — přihlášený). Validace: status pending, `expiresAt`, `usedCount < maxUses`. Vytvoří membership, inkrementuje `usedCount`. Nepřihlášený → login → pak accept (reuse login-intent vzoru).

**FE:**
- **Invite UI z tlačítka „Pozvat hráče"** na stránce Hráči (§4.1) — modal/popover:
  - **Pozvat uživatele** (B1): search adresáře (reuse existující user-picker; ověřit reuse `LinkPicker` vzoru / users search) → odešle pozvánku → toast.
  - **Pozvací odkaz** (B2): tlačítko „Vytvořit odkaz" (volby expirace / max použití) → `Kopírovat odkaz` (reuse 15B.6 copy vzoru). Seznam aktivních pozvánek + revoke.
- **Pozvaný uživatel:** pozvánka v `NotificationCenter → Ke zpracování` (nový typ `WorldInvite`, renderer „Pozvánka do světa {name}" + Přijmout/Odmítnout) + WS toast. Symetrie s `WorldAccessRequestRenderer`.
- **Přijetí odkazu:** route `/invite/:token` → přihlášený accept → redirect do světa; nepřihlášený → login intent → accept.

### 4.3 Fáze C — Přihláška s postavou (VARIANTA A, revize 2026-07-15)

**Zvolená architektura (nahrazuje R12–R14, R16-detail):** návrh postavy = **data přiložená k žádosti o vstup**, ne živá `Page`. Živá stránka postavy vzniká **až při approve** (kdy ji tvoří PJ, který má práva). Důvod: přístup ke světu se řídí členstvím → nečlen by živou pending Page v **soukromém** světě sám nepřečetl (`assertCanViewWorld` → 404). Tím odpadá `characterStatus`, relaxace `assertCanWrite`, viditelnost pending Page i separátní `character-request` entita/provider. Spojený flow zůstává: **jedno „Schválit" pustí dovnitř i schválí postavu**.

**BE:**
- `WorldAccessRequest` + volitelné pole **`characterDraft?: { name: string; note?: string }`** (schema/interface/DTO/`toEntity` — field-checklist [project_be_field_checklist]). `requestAccess` přijme volitelný draft.
- **Fronta** (`getWorldPendingActions` + `WorldAccessRequestProvider.listForUser`): položka nese `characterName` (z draftu). FE odliší „žádá o vstup" vs „chce hrát jako {name}".
- **`approveAccessRequest` větví:** má-li AR `characterDraft` → (1) `pagesService.create` Page `Postava hráče` (title=`name`, content=`note`→escaped `<p>`, `ownerUserId`=žadatel) → auto-Character; (2) membership **Hráč** + `characterPath`=slug; (3) smaž AR. Bez draftu → membership **Čtenář** (dnešní chování). PagesService inject do WorldsService (`worlds.module` už `forwardRef(PagesModule)`; `PagesModule` exportuje `PagesService`). Sekvenční flow s best-effort cleanup (Page mimo tx — vlastní kaskáda `character.created`).
- `reject` beze změny (smaž AR + draft). Gate = `assertCanModerateAccessRequests` (existuje).
- `note` → escapovat HTML entity (`< > &`) před vložením do `content` (žádná injection přes draft).

**FE:**
- **`JoinCTA`** u open/private světa: dvě volby — **„Chci hrát"** (mini-formulář: jméno postavy + krátká poznámka pro PJ) → `requestAccess` s `characterDraft`; **„Jen číst"** = dnešní prostá žádost (→ Čtenář).
- **`RequestsList`** (multi-typ, R16): položka s postavou → „chce hrát jako **{name}**" + náhled poznámky; Přijmout (→ Hráč + živá stránka postavy) / Odmítnout. Bez postavy → „žádá o vstup" (dnes).
- **Po schválení** hráč dostane plnou **živou** stránku postavy a edituje ji naostro; přejde ze sekce „Nováčci" (R10) do rosteru jako Hráč.

**Odpadá oproti původnímu R12–R16:** `characterStatus` na Page · relaxace brány pro nečleny · viditelnost pending Page · `character-request` entita/provider · editace návrhu před schválením (návrh se píše jednou; plná editace až po vpuštění).

---

## 5. Out of scope

- Přidání člena **bez jeho souhlasu** (R7 — vždy přes přijetí).
- Pozvánka **neregistrovaného** přes e-mail (SMTP invite) — odkaz sdílí PJ sám (Web Share / kopírovat); e-mailová pozvánka = pozdější rozšíření (váže na 14.8 SMTP).
- Per-world **presence room** (R5 — stačí globální průnik).
- Napojení **náborů (19.3)** na pozvánky (dnes „ozvat se" = jen zpráva do pošty) — samostatná featura.
- Změna globální fronty `/ikaros/uzivatele → Zpracovat` — zůstává (per-world je navíc, ne náhrada).
- **Fáze C:** samostatný `draft` autosave stav (V1 slučuje do `pending`); víc navržených postav v jedné žádosti (1 postava/žádost); nastavení světa „vyžadovat postavu při vstupu" (obě cesty — číst i hrát — zůstávají volitelné); moderace/verze historie postavy.

---

## 6. Acceptance kritéria

**Fáze A:**
1. Stránka „Hráči světa" (PJ) ukáže nahoře sekci **Čekající žádosti**; hráč (ne-PJ) ji nevidí. Karty členů mají **online tečku** (online = zelená, offline = bez).
2. PJ vidí **zvoneček** v hlavičce světa s badge = počet žádostí (ne-PJ nevidí); klik → **drawer** zprava se seznamem žádostí; pozadí zůstává vidět; ESC/backdrop zavře; focus-trap funguje; odkaz „Otevřít správu hráčů" vede na stránku Hráči.
3. Přijmout (na stránce **i** v draweru) → žadatel se stane členem (Čtenář), zmizí ze seznamu, badge -1; Odmítnout → zmizí, membership nevznikne.
4. Nová žádost (WS `world:access-requested`) se na stránce, v draweru i v badge (+ dashboard dlaždici) objeví bez reloadu.
5. Klik na kartu člena → jeho deník (zachováno); online-first sort (pokud zapnut) řadí online nahoru.
6. **Co-PJ** (role ≥ PJ, nevlastní svět) žádosti **vidí a schválí** (bug §3.2 opraven) — na stránce, v draweru i globální frontě.

**Fáze B:**
7. PJ pozve existujícího uživatele → pozvanému se objeví „ke zpracování" pozvánka + WS toast; Přijmout → stane se členem (Čtenář); Odmítnout → membership nevznikne.
8. PJ nemůže pozvat člověka, který už je členem nebo má pending pozvánku (validace).
9. PJ vytvoří pozvací odkaz (expirace/limit) → jiný přihlášený uživatel přes `/invite/:token` → stane se členem; vypršelý/vyčerpaný odkaz → friendly chyba, membership nevznikne.
10. PJ vidí seznam aktivních pozvánek a může je zrušit (revoke) → odkaz/pozvánka přestane platit.

**Fáze C (varianta A):**
11. U open/private světa hráč zvolí „Chci hrát" → zadá jméno postavy (+ poznámku) → odešle; PJ vidí ve frontě „chce hrát jako **{name}**" (na stránce Hráči, draweru, zvonečku i globální frontě). „Jen číst" → prostá žádost jako dnes.
12. PJ Přijme žádost **s postavou** → vznikne živá stránka postavy (Page „Postava hráče", owner = žadatel) + žadatel se stane **Hráčem** s přiřazenou `characterPath`; zmizí z fronty. Přijme žádost **bez postavy** → **Čtenář** (dnes).
13. PJ Odmítne → membership nevznikne, žádost i návrh zmizí; žadatel může požádat znovu.
14. Před schválením nevzniká žádná Page — návrh (jméno+poznámka) žije jen jako data u žádosti; žádný leak nedopečené postavy, žádný zápis nečlena do světa.

---

## 7. Test plán

- **BE:** nový `GET access-requests` (gate, scope vlastník i co-PJ) · scope fix provider (co-PJ vidí) · invite create/accept/decline/revoke · odkaz accept (expirace, maxUses, dvojí použití) · validace duplicitní pozvánky · membership vzniká s rolí Čtenář · pending-actions `WorldInvite` provider.
- **FE:** drawer render · badge count · approve/reject invalidace · presence online-first sort · pozvat uživatele mutace · vytvořit/kopírovat/revoke odkaz · `WorldInvite` renderer v NotificationCenter · `/invite/:token` flow · **multi-typ `RequestsList`** (access + character).
- **BE fáze C:** relaxace brány (žadatel vytvoří vlastní `pending` postavu · cizí owner/typ/svět → 403) · viditelnost `pending` (autor+moderátor vidí, cizí ne) · approve → Hráč+characterPath+approved · reject 3 režimy · `CharacterRequestProvider` ve world-scoped i globální frontě · default `approved` u existujících postav (migrace-free).
- **FE fáze C:** `JoinCTA` „Chci hrát" wizard → pending postava + žádost · edit pending postavy (badge „čeká") · `CharacterRequestRenderer` (náhled + schválit/odmítnout).
- **Manuál:** `mobil-desktop` na drawer (mobil = full-width sheet, desktop = ~420px zprava) + wizard postavy; friendly hlášky (`auth-policy`); socket kontrakt (`socket-contract`) pro nové WS eventy; `type-sync` pro nové typy.

---

## 8. Riziko & rollback

| riziko | mitigace |
|---|---|
| Nový BE endpoint = FE napřed před BE | `npm run audit:routes`; BE first pro fázi A endpoint (nemíchat BE+FE dávku — [feedback_no_mixed_be_fe_batch]) |
| Invite token = bezpečnostní povrch (guessing, replay) | dostatečně dlouhý náhodný token, `expiresAt`, `maxUses`, status kontrola, moderátor-gate na create/revoke |
| Přidání člena bez souhlasu (leak do soukromého světa) | R7 — vždy přes přijetí pozvaným |
| Drawer overlay konflikt s mapou/fullscreen | vzor `DayDetailDrawer` + portal jako `Modal`; ověřit z-index nad hlavičkou |
| co-PJ scope fix rozšíří viditelnost i jinde | fix cíleně jen `WorldAccessRequestProvider.scopeForUser`; regrese test |
| **C:** relaxace brány = zápis nečlena do světa (leak/abuse) | úzká výjimka: JEN typ `Postava hráče`, `owner=self`, `pending`, `worldId` = svět žádosti; e2e test na cizí owner/typ/svět → 403 |
| **C:** `pending` postava unikne (vidí ji cizí hráč) | viditelnost autor+moderátor ve VŠECH list/detail dotazech; e2e leak test cizím hráčem |
| **C:** `characterStatus` default rozbije existující postavy | default `approved`, chybějící pole = approved (migrace-free); test starých postav |

**Rollback:** featura je aditivní (nový drawer, endpoint, entita `WorldInvite`, pole `characterStatus`). Rollback = skrýt zvoneček/dlaždici + „Chci hrát" (feature gate) + nevystavit invite/character-request endpointy; `characterStatus` chybějící = approved, takže staré postavy fungují. Existující flow (globální fronta, žádosti, PJ-tvorba postav) beze změny.

---

## 9. Otázky k autorovi — VYŘEŠENO (2026-07-15)

1. **R7 — souhlas pozvaného:** ✅ **povinný** (pozvaný klikne Přijmout). Tvrdé přidání bez souhlasu zamítnuto. U odkazu je „souhlas" = klik na URL.
2. **R6/B2 — pozvací odkaz:** ✅ **ANO, teď** — kompletní fáze B, obě cesty přes jednu entitu `WorldInvite`.
3. **R1c — dashboard dlaždice:** ✅ jen **badge** na existující dlaždici „Hráči", žádná nová dlaždice.
4. **R10 — Čtenáři v rosteru:** ✅ **sekce „Nováčci"** (členové bez postavy) na stránce Hráči — PJ (i hráči) vidí každého, kdo je v jeskyni; PJ odtud může přiřadit postavu.
5. **R11 — vstup + postava (fáze C):** ✅ **spojené** — „Chci hrát" = návrh postavy = žádost o vstup, PJ jedním schválením pustí + schválí postavu → Hráč. „Jen číst" žádost (Čtenář) zůstává vedle.
6. **Pořadí:** ✅ A+B+C **dohromady** — fronta „ke zpracování" rovnou multi-typ (R16), ať se A nepřepisuje.
7. **Fáze C — architektura:** ✅ **varianta A** (2026-07-15) — návrh postavy = data přiložená k žádosti, živá stránka postavy vzniká až při approve. Odpadá `characterStatus` / relaxace brány / viditelnost pending / `character-request` entita. Důvod: nečlen by živou pending Page v soukromém světě sám nepřečetl. Viz §4.3.

---

## 10. Návaznost (po implementaci)

`funkce` (nová BE schopnost invites + životní cyklus postavy `characterStatus` + hráč tvoří vlastní postavu, per-world fronta ke zpracování, změna oprávnění co-PJ, nové WS eventy) + `napoveda` (hráčský výtah: jak pozvat/přijmout, jak požádat o vstup s postavou, kde schvaluji žádosti a postavy) — měnit oba. Dluh co-PJ scope + D-062 recyklace → uzavřít v `docs/dluhy.md`.
```

**Po schválení specu → implementační plán (přesné file diff / pořadí BE→FE), pak kód.**
