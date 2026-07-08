# Spec 19.4 — Model podpory (freemium „Podporovatel")

**Stav:** **IMPLEMENTOVÁNO 2026-07-08** (BE+FE, BE typecheck + FE build zelené, helper test 4/4). Čeká **BE restart** + `mobil-desktop` + `funkce`/`napoveda` + commit (uživatel). · **Fáze:** 19 · **Roadmap:** [§19.4](../../roadmap2.md) [Příloha B]
**Režim:** **A2** (odsouhlaseno uživatelem 2026-07-08) — status = **ruční grant + čistý dar**, NE placené předplatné. Výhody nejsou *smluvně* vázané na platbu → zůstáváme v režimu daru, bez platební brány / DPH / spotřebitelských povinností. Právní review před veřejným během (viz §8).
**Repozitáře:** BE (nové pole na User + gating v worlds/chat + admin grant + veřejný endpoint zdi) + FE (badge, gating v dice, stránka, admin toggle).
**Závislosti:** staví na `users` modulu (identita), `worlds` (limit světů — už existuje `WORLD_QUOTA_REACHED`), `chat/dice` (skiny + vězení), `admin` (audit + grant flow).

📚 **Freemium** = plnohodnotný základ zdarma, drobné výhody navíc pro podporovatele. **Efektivní podporovatel** = má výhody, ať už z ručně uděleného flagu, nebo protože je členem týmu (role).

---

## 0. Účel jednou větou

Zavést **status „Podporovatel"** (flag na uživateli), který odemyká tři drobné výhody (víc světů / vězení kostek / prémiové skiny) a nese vizuální **odznak Ikara**; status **uděluje admin ručně** (tým automaticky z role), podpora se přijímá jako **dobrovolný dar** na nové **veřejné stránce** se zdí podporovatelů.

## 1. Zásadní zjištění z auditu kódu (2026-07-08) — rámují návrh

| # | zjištění | důsledek |
|---|---|---|
| **Z1** | Pojem „podporovatel/supporter/tier" v kódu (BE+FE) **NEEXISTUJE** — 0 výskytů. Greenfield. | Nový flag na `User`, celý gating od nuly. |
| **Z2** | `toEntity()` v `users.repository.ts:330-409` je **whitelist mapper** (field-drift past, memory `be_field_check`). | Nové pole POVINNĚ i sem, jinak tiše zmizí z `/me` i public. |
| **Z3** | FE `AccessTokenPayload` je **mrtvý typ** (D-020) — FE identitu bere z `/users/me`, ne z JWT. `sanitize()`/`SafeUser` jsou spread. | JWT **neřešíme**. Flag přiteče na FE sám, jakmile je na entitě `User`. |
| **Z4** | Status se mění za běhu (admin grant). Token je stale. | Gating (BE) čte **aktuální stav z DB**, ne z tokenu. FE gating z `currentUserAtom` (`/me`), refetch po `user.identity.changed`. |
| **Z5** | Limit světů už existuje: `MAX_ACTIVE_WORLDS_PER_OWNER=30`, error `WORLD_QUOTA_REACHED`, Admin+ bez limitu (`worlds.service.ts:414`). `countByUserId` = „je NEBO vlastní" (vlastník má vždy membership), ALE počítá i **soft-deleted** světy. | Freemium limit navěsit na stejné místo; počítat jen **aktivní** světy (join přes `findByIds`+`isActive`). |
| **Z6** | „Běžné kostky" = skupina materiálů `bezne` (18). „Ostatní" = `kamen/kov/draci/element/mysticke` (51). „Vězení" = memetická sub-funkce skinů (uvěznit smolný skin), ne moderace. Persistence per `WorldMembership` (`diceSkinMapping`, `jailedDiceSkins`). | Gating = filtr skupin + záložka Vězení ve `SkinPickerPanel` + BE guard při ukládání. |
| **Z7** | Veřejný adresář `GET /users` je za `JwtAuthGuard` (jen přihlášení). Stránka podpory má být **veřejná** (marketing i pro anon). | Zeď potřebuje **nový veřejný endpoint** `GET /users/supporters` (leak-safe). |

## 2. Datový model — jeden flag + datum (zdroj pravdy = BE)

Na `User` přidat **dvě** pole (nic víc — binární status, žádné tiery):

| pole | typ | default | význam |
|---|---|---|---|
| `isSupporter` | `boolean` | `false` | ručně udělený status podporovatele |
| `supporterSince` | `Date?` | — | kdy udělen (řazení zdi + „podporovatel od"); NEodvozovat z `createdAt` |

**Efektivní podporovatel** (nikdy se neukládá do wire — derivuje se v místě):
```ts
isEffectiveSupporter(role, isSupporter) =
  isSupporter || [Superadmin, Admin, SpravceClanku, SpravceGalerie, SpravceDiskuzi].includes(role)
```
- BE: common helper (pro gating guardy). FE: zrcadlo `src/shared/lib/supporter.ts` (pro badge + UI gating).
- 💡 Drží se RAW `isSupporter` + `role` zvlášť na drátě, derivace jedním helperem → jeden zdroj pravdy, žádný fetch navíc (oba vstupy už jsou v každém `User`/`PublicUser` payloadu).
- ⚠️ To řeší i nesrovnalost B ze zadání: tým (Admin/Superadmin/Správci) je podporovatel **automaticky** (z role), ne že by se podporovatel stal adminem.

**Field-drift checklist (Z2, memory `be_field_check` — v tomto pořadí):**
1. `user.schema.ts` (~ř.120): `@Prop({ default: false }) isSupporter?: boolean;` + `@Prop({ type: Date }) supporterSince?: Date;` + index `UserSchema.index({ isSupporter: 1, supporterSince: -1 })`.
2. `users.repository.ts` `toEntity` (~ř.408): `isSupporter: (doc.isSupporter as boolean) ?? false,` + `supporterSince: doc.supporterSince,`.
3. `user.interface.ts`: `User` (58) + `PublicUserListItem` (181-193) → `isSupporter`, `supporterSince`.
4. Explicitní public mappery: `publicProfileV14` (505-523) + `toPublicListItem` (431-452) → `isSupporter: user.isSupporter ?? false` (+ `supporterSince`).
5. FE `src/shared/types/index.ts`: `User` (53), `PublicUserListItem` (1129), `PublicUserProfile` (1150), `AdminUsersListItem` (169) → přidat pole.

## 3. Gating — tři výhody (BE autorita + FE UX)

### 3.1 Světy — limit 3 pro nepodporovatele (Z5)
- **Metrika:** aktivní světy uživatele = `countByUserId` **filtrováno na `isActive`** (soft-deleted nezabírají slot). Doporučeno zapouzdřit do `WorldsService.countActiveWorldsForUser(userId)`.
- **Konstanta:** `MAX_ACTIVE_WORLDS_NON_SUPPORTER = 3`.
- **Pravidlo:** `isEffectiveSupporter=false` → limit **3** (je NEBO vlastní); podporovatel → stávající chování (owner-kvóta 30 / Admin+ bez limitu). Zdroj `isSupporter`+`role` = **načíst usera z DB v service** (ne z tokenu, Z4).
- **Enforcement (4 cesty, kde roste počet světů):** `create` (414), `joinPublic` (762), `requestAccess` (779). U `approveAccessRequest` (886) kontrola míří na **žadatele** (`ar.userId`), ne na PJ.
- **Error:** nový `WORLD_MEMBERSHIP_QUOTA_REACHED` (přidat do `error-codes.generated.ts` BE i FE). Hláška odkazuje na `/ikaros/podporovatele`.
- **⚠️ Grandfathering:** limit blokuje jen **nové přidání nad 3**, NIKDY neodebírá existující. Kdo dnes má 4+ světů, o nic nepřijde (jen nemůže přidat další, dokud neklesne pod 3 nebo se nestane podporovatelem).
- **FE:** rozšířit `catch` v `CreateWorldPage.tsx:163-175` o nový kód; obdobně u join/access-request hooků; preventivní disable CTA „Vytvořit svět" + hint, když `countActive ≥ 3 && !supporter`.

### 3.2 Prémiové skiny kostek (Z6)
- **Nepodporovatel:** vidí jen skupinu `bezne` (18 materiálů). 5 prémiových skupin (`kamen/kov/draci/element/mysticke`) se zobrazí **zamčené** (🔒), ne skryté — marketing (vidí, co získá) + odkaz na `/podporovatele`. Vzor memory `akj_locked_visible`.
- **FE:** `SkinPickerPanel.tsx` — sidebar skupin (119-141) + grid: prémiové karty `disabled`+🔒 pro `!supporter`. `default` materiál `kamen-obsidian` je ze skupiny `kamen` → pro nepodporovatele fallback na `bezne` výchozí (neuzamknout jim vlastní výchozí kostku!).
- **BE guard:** `chat.service.ts` update appearance (~2405) — odmítnout uložení `diceSkinMapping` s materiálem z prémiové skupiny od nepodporovatele (403 / tiché ořezání na `bezne`). Autorita, ne jen FE.

### 3.3 Vězení kostek (Z6)
- **Nepodporovatel:** záložka **Vězení** + tlačítka ☠/❤ skryté.
- **FE:** `SkinPickerPanel.tsx:142-155` (záložka) + `DicePickerPopover` `onOpenJail` — render jen pro `supporter`.
- **BE guard:** odmítnout update `jailedDiceSkins` od nepodporovatele (`chat.service.ts:2405`).

## 4. Odznak Ikara — `SupporterBadge`

- Nová komponenta `src/shared/ui/SupporterBadge/` = **existující brand asset Ikara** (NEvyrábět nový). Kandidáti: [`public/favicon.webp`](../../../public/favicon.webp) (okřídlená silueta, univerzální) nebo [`public/themes/hospoda/decor/brass-stamp-ikaros.webp`](../../../public/themes/hospoda/decor/brass-stamp-ikaros.webp) (zlatá pečeť = sémanticky „odznak"). Velikosti `sm|md` jako `RoleStar`. Výběr assetu + rámeček/glow = návrh ve `frontend-design` (razítko zlaté z hospoda-skinu → případně přebarvit do brand fialové `ikaros`, memory `ikaros_skin`).
- **Zobrazovací pravidlo — PRIORITA, nikdy obojí (rozhodnuto uživatelem 2026-07-08):** má-li uživatel **hvězdu** (`RoleStar` vrací badge — Superadmin/Admin/Správci) → **hvězda vyhrává, žádný Ikaros odznak**. Jinak je-li `isSupporter` → **Ikaros odznak**. Jinak nic. Tj. **hvězda (role) > Ikaros (podporovatel) > nic**. Admin má výhody dál (je efektivní podporovatel pro gating), jen vizuálně nosí prestižnější hvězdu.
- 💡 Implementačně: `RoleStar` zůstává a má přednost; `SupporterBadge` se renderuje **jen když `RoleStar` pro danou roli vrací `null`** (běžné role) **a** `isSupporter`. Množina „má hvězdu" ⊆ „efektivní podporovatel", takže kdo nemá hvězdu a je podporovatel = běžný uživatel s uděleným statusem.
- **Call-sites (kde dnes žije `RoleStar`):** `ProfileHeader.tsx:123`, `UsersTable.tsx:182`, chat `MessageItem.tsx:248/384` (přes `renderSenderBadge`, plněno v `AdminChatPage`). Plus `RoleChip` na kartách (`UserCard`, `PublicProfileHeader`). Nejčistší = jedna komponenta `IdentityBadge` (role → hvězda; jinak supporter → Ikaros), nasazená na všechna místa místo přímého `RoleStar`.
- **Odznak = malý symbol u jména** (velikost jako `RoleStar`), varianta **C** (základní obrázek Ikara v kruhu + jemný fialový svit; rozhodnuto uživatelem 2026-07-08). NE avatar.
- **Kolize s default avatarem — neřeší se (uživatel 2026-07-08):** default avatary jsou z téže okřídlené rodiny (`being.webp` apod.), ale odznak je jiná vrstva (malý u jména) a podporovatelé mají zpravidla vlastní avatar → kolize nepravděpodobná.

## 5. Admin grant — ruční udělení statusu (režim A2)

Status uděluje/odebírá **admin** (tým je efektivní podporovatel automaticky z role, nemusí se udělovat). **Samostatný endpoint**, ne rozšíření role-DTO (vzor `admin-permissions`, ne `updateRole`).

| metoda | routa | guard | tělo |
|---|---|---|---|
| `PATCH` | `/admin/users/:id/supporter` | `AdminGuard` | `{ isSupporter: boolean }` (`@IsBoolean`) |

- **`AdminService.setSupporter(actor, id, isSupporter)`** dle vzoru `updateUserRole` (160-184): `findById` → `usersRepo.update(id, { isSupporter, supporterSince: isSupporter ? new Date() : undefined })` → `this.audit(actor, target, isSupporter ? 'SUPPORTER_GRANT' : 'SUPPORTER_REVOKE', {before}, {after})` → emit `user.identity.changed` (FE refetch `/me`).
- **Audit akce** `SUPPORTER_GRANT`/`SUPPORTER_REVOKE` na 3 místech: BE `admin-audit-log.interface.ts` union, FE `index.ts:201` union, FE `AuditLogTab.tsx` label+styl mapa (jinak prázdný řádek).
- **FE:** `useAdminSetSupporter()` = kopie `useAdminUpdateRole` (mutace `PATCH .../supporter`, stejných 5 invalidací: `adminKeys.users`, `public-users`, `public-user-profile`, `adminKeys.stats`, `adminKeys.auditLog`). V `UsersTable.tsx` toggle do actionsRow (235) + Badge „Podporovatel" do Status-sloupce (191-231). Bez optimistic (invalidation-based, gate `isPending`).
- ⚠️ NEjde reuse `SetAdminPermissionsDto` (gatuje `role===Admin`); podporovatel je napříč rolemi.

## 6. Stránka `/ikaros/podporovatele` (veřejná)

**Samostatná top-level stránka** (ne subtab `UsersPage` — ta je login-only + komunitní; tohle je marketing i pro anon). Route **bez** `requireAuth`. Soubor `src/features/ikaros/pages/SupportersPage.tsx` (ASCII název).

**⚠️ Stránka respektuje globální platform skin** (nemá vlastní pozadí ani barvy — přání uživatele). Obsahové panely obalit do `IkarosCard` (variant `welcome`) **nebo** ruční `data-frame-panel="card"` + 4× `<CornerOrnament position="tl|tr|bl|br"/>` (vzor `SystemLandingPage.tsx:35-46`); nadpisy přes `SectionTitle`/třídu `sectionTitle`. Tím každý skin (Modré nebe atd.) sám domalují zlaté filigrán rohy, double-stroke a diamantové oddělovače. Vše přes `--theme-*` tokeny, žádné hardcoded barvy. Odznak Ikara = jediná brand konstanta (obrázek), prsten dědí `--theme-accent`.

**Nav:** odkaz do `RightPanel` pod „Uživatelé" (splní „pod uživateli", IkarosLayout ~ř.498) — ⚠️ RightPanel je **auth-only**, takže pro anon přidat odkaz i do `PRIMARY_NAV` (levý panel, vzor „Nápověda") nebo patičky. Ikona `HandHeart`/`Heart`.

**Sekce (shora dolů):**
1. **Hero — proč podpořit.** Provoz serveru (Cloudinary/hosting stojí peníze), český nezávislý projekt, komunitní étos. Žádný nátlak.
2. **Co status dává.** Transparentní tabulka: víc světů (3 → dle uvážení), vězení kostek, 51 prémiových skinů, odznak Ikara. ⚠️ Formulace „podporovatelé mají navíc", NIKDY „zaplať a dostaneš" (A2, §8).
3. **Jak podpořit.** Kanál na dar (účet/QR / Ko-fi / Patreon — **parametr, čeká rozhodnutí uživatele**) + **POVINNÝ disclaimer** doslovně dle právního rámce: *„Tento příspěvek je dobrovolnou podporou provozu Projektu Ikaros. Nejde o cenu za digitální službu ani o předplatné. Poskytnutím příspěvku nevzniká nárok na konkrétní funkci, kapacitu, technickou podporu ani protihodnotu."*
4. **Zeď podporovatelů.** Veřejný grid (avatar, username, „podporovatel od"), řazení `supporterSince` desc. Data z `GET /users/supporters`.
5. **Můj stav** (přihlášený): jsem/nejsem podporovatel; nepodporovatel vidí „čerpáš X/3 světů" + CTA. Podporovatel vidí poděkování + odznak.

> ~~6. Transparentní provozní ukazatel~~ — **ODLOŽENO (uživatel 2026-07-08).** „Vybráno X / cíl Y" zatím ne. Případně později.

**Zeď — endpoint (Z7):** nový **veřejný** `GET /users/supporters` (BEZ `@UseGuards`, s `@Throttle`), **deklarovat PŘED `@Get(':id')`** (jinak route collision). Service `listSupporters()` → repo `findSupporters()` (klon `findPublicPaginated` s `filter.isSupporter=true`, zachovat `isDeleted`/`deletionRequestedAt`/`hiddenInDirectory` filtry — leak-safe), sort `{ supporterSince: -1 }`. **Leak-safe whitelist** odpovědi: `username`, `displayName`, `avatarUrl`, `defaultAvatarType`, `supporterSince` — **bez** role/emailu/worldsCount. Podporovatelů budou desítky–stovky → vrátit vše jedním dotazem (limit-strop ~200 pro jistotu). FE hook `useSupporters()` (bez auth).
- ⚠️ `hiddenInDirectory` podporovatele: kdo se skryl v adresáři → respektovat a na zdi **nezobrazit** (default). Případně opt-in „zobrazit mě na zdi" = budoucí dluh.

## 7. Bezpečnost & soukromí

- **Grant** jen `AdminGuard`. **Gating** vždy autoritativní na BE (světy/kostky/vězení) — FE gating je jen UX, nikdy jediná bariéra (klient by šel obejít).
- **Zeď** je veřejná → přísný leak-safe whitelist (§6), filtr tombstone/pending/hidden.
- `isSupporter` **není** self-nastavitelné (NEpřidávat do `UpdateUserDto`/self-PATCH — šlo by falšovat klientem). Jen admin endpoint.
- `anonymizeForHardDelete` (`repository:214`): reset `isSupporter=false` u tombstone (není PII, ale nemá smysl).

## 8. Právní (A2) — MIMO kód, ale blokující před veřejným během

- Model = **dobrovolný dar bez vymahatelného protiplnění**. Výhody NEjsou smluvně vázané na platbu (status je grant, ne nákup). Disclaimer §6.3 povinný.
- ⚠️ I tak **hraniční** (rámec ř.27 „příspěvek s výhodou"); kapacita 3 světy + kosmetika = nízká „podstatnost výhody", ale **finální posouzení = advokát/daňový poradce** před spuštěním veřejných darů (rámec [51-podpora-dph.html](../../pravni-ramec/build/51-podpora-dph.html)).
- Stránka fyzicky **odděluje** „podpoř provoz" (dar) od „co mají podporovatelé" (poděkování) — žádné „zaplať X → dostaneš Y".
- Přechod na přiznané předplatné (A1) později = aditivní (přidat platební bránu + OP + DPH), tento model nebrání.

## 9. Testy

- **BE:** `isSupporter`/`supporterSince` toEntity roundtrip (field-drift); `setSupporter` (grant/revoke + audit + supporterSince set/clear); world limit — nepodporovatel 4. svět (create/join/requestAccess) → `WORLD_MEMBERSHIP_QUOTA_REACHED`, podporovatel projde, soft-deleted nezabírá slot, grandfathering (4 existující → nemaže); dice guard (prémiový materiál/jail od nepodporovatele odmítnut); `GET /users/supporters` (leak-safe pole, filtr hidden/deleted, řazení).
- **FE:** `SupporterBadge` (podporovatel→Ikaros, jinak fallback); `SkinPickerPanel` (nepodporovatel: prémiové zamčené, vězení skryté, vlastní výchozí kostka dostupná); `SupportersPage` (zeď render, můj stav, disclaimer viditelný); admin toggle (mutace+invalidace). Vitest bez globals.
- Build zelený (`npm run build` = tsc -b). BE jest.

## 10. Ops & dotčené soubory

**BE (nové/změna):** `user.schema.ts`, `user.interface.ts` (+Public*), `users.repository.ts` (toEntity, findSupporters), `users.service.ts` (mappery, listSupporters), `users.controller.ts` (`GET /users/supporters` před `:id`), `admin.controller.ts` (`PATCH .../supporter`+DTO), `admin.service.ts` (`setSupporter`), `admin-audit-log.interface.ts` (union), `worlds.service.ts` (limit v create/join/requestAccess + `countActiveWorldsForUser`), `chat.service.ts` (dice/jail guard), `error-codes.generated.ts` (`WORLD_MEMBERSHIP_QUOTA_REACHED`), common `supporter` helper. **Restart BE nutný** (memory `fb_be_restart`).
**FE (nové):** `SupporterBadge/`, `SupportersPage.tsx` + route, `useSupporters.ts`, `useAdminSetSupporter.ts`, `src/shared/lib/supporter.ts`. **FE (změna):** `shared/types/index.ts`, `SkinPickerPanel.tsx`, `DicePickerPopover.tsx`, `UsersTable.tsx`, `AuditLogTab.tsx`, `CreateWorldPage.tsx` (+join/access hooky), `RoleStar` call-sites (badge priorita), `IkarosLayout.tsx` (nav), `router.tsx`, `errorCodes.generated.ts`, `adminKeys`/audit union.
**Kanál na dary:** čeká rozhodnutí uživatele (účet/QR/Ko-fi/Patreon) — ovlivní §6.3 a právní zařazení (dar vs. veřejná sbírka).
**Docs:** `roadmap2.md` (19.4 detail + zaškrtnout po impl.), `docs/funkce/` (skill `funkce`), `/ikaros/napoveda` (skill `napoveda`), `dluhy.md` (hidden-on-wall opt-in, provozní ukazatel automatizace, právní review).
**Pořadí impl.:** BE (model→gating→grant→endpoint, restart) → FE (typy→badge→dice gating→admin toggle→stránka). Nemíchat BE+FE v jedné dávce (memory `fb_no_mixed_batch`). Po UI → `mobil-desktop`. Vzhled badge + stránky → `frontend-design` návrh před impl.
