
### ✅ ŘEŠENÍ — JaD deník se neukládal: customData whitelist filtroval i dedikované systémy · 2026-06-28
**Co nakonec zabralo:** `resolveAllowedKeys` (character-subdocs.service) filtroval customData deníku dle aktivního světového `DiarySchemaVersion` i pro systémy s dedikovaným FE sheetem. JaD svět („Svět víl") měl naseedovaný generic-style stub schema z `jadPreset` (klíče `race/class/zivotyMax/…` bez prefixu), ale `JadSheet` ukládá `jad_*` → `coerceCustomData` všechny `jad_*` zahodil → prázdný `$set` → PATCH 200 OK, ale 0 uloženo (toast „Deník uložen", po reloadu prázdno). Fix: whitelist platí JEN pro `generic` (PJ schema editor); dedikované systémy (`active.system !== 'generic'`) = pass-through, symetricky s read-side pass-through v `getDiary`.
**Proč to je správně:** matrix „fungoval" jen náhodou (preset klíče = `matrix_*` = FE klíče); jad/dnd5e stub klíče se neshodují → koncepčně whitelist nepatří dedikovaným sheetům (sheet je autorita, čte jen svůj prefix). Runtime fix opraví existující světy BEZ migrace dat (`active.system='jad'` se ignoruje). Diagnóza ověřena ČTENÍM (Explore agent měl správný směr, ale závěr potvrzen v kódu — `jadPreset.schema` reálně stub, `coerceCustomData` reálně filtruje).
**Jak ověřeno:** BE typecheck čistý + 36 jest testů (upravený generic coerce + nový regresní „dedikovaný systém nezahodí `jad_*`"). Commit 6a5fcf4 push na main. Čeká ruční Deploy workflow (produkční BE běží starý kód, dokud uživatel nenasadí).
**Zhodnocení:** dobře. Bug NEbyl z mé 8.7p práce (existoval od 8.7b dedikovaného sheetu), jen se projevil na světě se seedovanou schema-verzí. Production data-loss → prokomunikováno před fixem (co/dopad/návrh), nasazení (outward) necháno uživateli.

---

### ✅ ŘEŠENÍ — 19.4 freemium „Podporovatel" (BE+FE, jeden zátah) · 2026-07-08
**Co zabralo:** Přechod modelu podpory z „dary" na **freemium** (režim A2): flag `isSupporter`+`supporterSince` na User, gating (3 světy / prémiové skiny kostek / vězení), odznak Ikara (`IdentityBadge`), admin grant + audit, veřejná zeď + stránka `/ikaros/podporovatele`.
**Proč to je správně:**
- **Field-drift past první:** začal jsem od `toEntity` whitelist mapperu (users.repository) — bez řádku by nové pole tiše zmizelo z `/me` i public, i když schema+interface OK (`be_field_check`).
- **error-codes se NEeditují ručně** — jsou `.generated.ts` ze skriptu `error-contract-scan.mjs --emit`; přidal jsem jen `throw` a spustil generátor (BE+FE zrcadlo naráz).
- **Běžné kostky = prefix `bezne-`** (groupSlug v katalogu) → BE guard je prostý prefix-check, ŽÁDNÉ zrcadlení FE katalogu na BE (žádný nový drift).
- **JWT jsem NEŘEŠIL** — FE `AccessTokenPayload` je mrtvý typ (D-020, FE jede z `/me`); gating čte AKTUÁLNÍ stav z DB (status se mění grantem, token by byl stale). `usersService.findById` v guardech.
- **Priorita badge = hvězda (role) > odznak (podporovatel) > nic** (uživatel rozhodl OBRÁCENĚ než původní návrh „odznak místo hvězdy"); `IdentityBadge` renderuje `SupporterBadge` jen když `roleHasStar`=false.
**Jak ověřeno:** BE `tsc --noEmit` čistý, FE `npm run build` zelený (✓ 13.72s), jest helper 4/4. Runtime čeká BE restart (produkce běží starý bundle).
**Zhodnocení:** dobře. Průzkum kódu 8 agenty PŘED spec (role/světy/kostky/JWT/admin/nav/asset) odhalil pasti dřív než kód → 0 přepisů. Netriviální bod = právní režim (dar vs. freemium=předplatné): prokomunikováno z vlastního právního rámce projektu, uživatel zvolil A2 (grant+dar, výhody nevázané smluvně na platbu). Zbývá funkce/napoveda/mobil-desktop (dokumentace/ověření, ne kód).

---

### ✅ ŘEŠENÍ — whisper filtr do Mongo query (limit = viditelné) + oprava pre-existujícího test-mocku · 2026-07-10
**Co nakonec zabralo:** `getMessages` filtroval šepoty (`visibleTo`) AŽ v JS PO `limit` → hráč dostal <50, když bylo ve staženém okně cizí šepoty, a FE stránkování (tlačítko „Zobrazit starší" = count>=50) mu selhalo. Fix: `findByChannelId` dostal volitelný `visibilityUserId` a filtr `$or` (visibleTo neexistuje / prázdné / obsahuje userId) jde do Mongo query — stejný vzor jako `findFeed`. Service předá `visibilityUserId: canSeeAllWhispers ? undefined : userId` a JS `.filter` zahodil. `limit` teď = počet VIDITELNÝCH → FE beze změny. (Latentní bug z pátrání kolem CH-066 — reálný, i když NEbyl příčinou toho konkrétního symptomu.)
**Pre-existující chyba (opravena při tom):** 4 testy `updateMembershipAppearance — diceSkinMapping/jailedDiceSkins` padaly `usersService.findById is not a function` — `enforceSupporterDiceGate` (19.4) volá `findById`, ale global `mockUsersService` ho neměl. Ověřeno `git stash` = padaly i na původním kódu (NE moje regrese). Fix: `mockUsersService.findById` → entitled user (`isSupporter:true`), aby prémiové skiny prošly gate.
**Jak ověřeno:** BE `tsc --noEmit` ✓, eslint ✓, `jest chat.service.spec --runInBand` = **125/125** (whisper testy přepsané na nový kontrakt: mock simuluje DB filtr dle visibilityUserId; + 3 limit testy dostaly visibilityUserId). Repo query korektnost = sdílený `findFeed` vzor.
**Zhodnocení:** Dobře. Past: filtr přesunut z JS do DB → mockované service testy musely přejít z „ověř výsledek" na „ověř předaný visibilityUserId" (jinak by mock nefiltroval). `$or` na `visibleTo` není v indexu `{channelId,_id}` — možný multikey index jako budoucí dluh (findFeed platí týž náklad). Nutný **restart BE**.

## ✅ ŘEŠENÍ — 3 kritické bezpečnostní díry z gap-huntu (SSRF export · Redis pád · JWT role staleness) — 2026-07-11

**Kontext.** Gap-hunt skillu plny-audit (viz audit.md) našel 3 díry v HEAD, uživatel řekl „rovnou je oprav". Všechny BE (jedna dávka, žádné míchání s FE).

**Co zabralo.**
- **SSRF** (`world-export.service.ts`): `isMediaUrl` byl substring-check (`includes('cloudinary')` / media přípona) → propustil `http://169.254.169.254/x.png`; `fetch` bez timeout/size. Fix = `new URL()` parse + origin-allowlist (`res.cloudinary.com`/`*.cloudinary.com`, jen https) — uzavírá SSRF už při SBĚRU URL (isMediaUrl je jediná brána, volá ji `collectMediaUrls`) + `AbortSignal.timeout(10s)`+`redirect:'error'`+cap 25 MB jako defense-in-depth.
- **Redis** (`socket-io.adapter.ts`): pub/sub bez `.on('error')` → unhandled 'error' event shodí proces. Fix = handler na oba klienty (ioredis retryuje sám).
- **JWT freshness** (`jwt-auth.guard.ts`): guard usera z DB načítal kvůli ban/delete, ale roli nepřepisoval → čtena stará JWT role. Fix = `request.user.role = user.role` PŘED elevation lookupem.

**Jak ověřeno.** tsc --noEmit 0, eslint 0 (3 soubory + spec), guard testy 25/25. **JWT fix shodil 1 existující test** — a to SPRÁVNĚ: fixture měl DB usera bez role, takže `role` se přepisovala na `undefined`. Oprava fixtures (DB user dostal roli) + PŘIDÁN regresní test „demotovaný admin ztratí práva" (JWT role 2, DB role 5 → přepíše na 5, žádná elevace). To je přesně G≥2 pojistka pro SESS třídu.

**Zhodnocení — dobře/špatně.**
- 👍 Padlý test = signál, ne překážka: odhalil, že fix reálně mění chování (role z DB). Fixture opraven + regresní pin přidán, ne jen „umlčen".
- 👍 SSRF fix cílí na jedinou bránu (isMediaUrl) — zpřísnění na sběru je čistší než jen na fetchi; přesto i fetch dostal pojistky (redirect/timeout/size).
- ⚠️ Trade-off: allowlist pustí jen Cloudinary — legacy media z jiných hostů se do exportu nefetchnou (bezpečnostně správné; rozšířit host = 1 řádek). Nutný BE restart+deploy, jinak běží starý bundle.
- ⚠️ Zbývá: `tokenVersion` pro logout-all (access token dnes přežije „odhlásit všude" do expirace) — samostatný follow-up.

## CH-120 — JWT freshness fix byl POLOVIČNÍ: opravil jsem JwtAuthGuard, zapomněl sourozence OptionalJwtAuthGuard — 2026-07-11

**Chyba.** Opravoval jsem JWT role staleness (demotovaný admin drží práva ze staré JWT). Přidal jsem `request.user.role = user.role` do **`JwtAuthGuard`** a považoval to za hotové (commit c8c1b9e). Ale existuje **sourozenec `OptionalJwtAuthGuard`** (read endpointy `GET /worlds/:id`, gallery, news…), který roli z DB VŮBEC nenačítal a neověřoval ban → demotovaný/zabanovaný uživatel držel elevovaný přístup na těch cestách dál. Díra zůstala z poloviny otevřená; našel ji až pentest gap-hunt (PT-35e).

**Fix.** Doplněn stejný pattern i do `OptionalJwtAuthGuard` (načíst usera z DB, degradovat banned/deleted na anonyma — optional kontrakt nehází, roli z DB). UsersModule je @Global → DI bezpečné (commit 1fc63d1).

**Poučení / příznak cyklení.** Po opravě GUARDU (nebo jakékoli sdílené auth logiky) **zgrepuj SOUROZENCE** — auth často má víc variant téhož (Jwt/OptionalJwt, per-request/per-socket). Fix v jedné variantě ≠ hotovo. Spojení s CH-011 (gate do service metody volané i interně): vždy hledat VŠECHNA místa téhož vzoru. Příznak: „opravil jsem X, ale díra stejné třídy se pak našla v X'".

## CH-121 — přidání metody do interface rozbilo typované jest.Mocked<> mocky: full jest ZELENÝ, nest build ČERVENÝ — 2026-07-11

**Past.** GDPR erasure: přidal jsem metody do 3 repo interfaces (`anonymizeBySender`/`anonymizeByUser`/`deleteByUserId`). Full jest prošel 2531/2531 → vypadalo hotovo. Ale `tsc --noEmit` (= `nest build` deploy path) FAILNUL: 3 specy mají `jest.Mocked<IRepository>` (typovaný mock), kterému teď chybí nové metody → TS2322. Runtime jest to nevadí (mock je strukturálně OK pro běžící testy), ale tsc/build to zachytí → **deploy build by spadl.**

**Fix.** Doplnit `<metoda>: jest.fn()` do každého typovaného mocku (push/ikaros/global-chat spec).

**Poučení.** Po JAKÉKOLI změně interface/DTO/typu spouštěj `tsc --noEmit` (nebo `nest build`), NE jen jest — jest a typecheck jsou různé brány. Sesterská lekce k deploy-blockeru z téhož RUN (union `@Prop` bez `type`): jest zelený NEgarantuje build/boot zelený. Příznak: „testy projdou, ale build/deploy spadne".

## CH-122 — server clamp gatovaný `typeof===number` je obejitelný číselným STRINGEM (pentest našel v MÉ opravě) — 2026-07-11

**Chyba (má neúplná oprava).** V auditu jsem přidal HP clamp (styl 46) do `map-operations.service` token.update: `if (typeof patch.currentHp === 'number') { clamp }`. Pentest (PT-46d-bypass) to prostřelil: klient pošle `currentHp: "9e9"` jako **STRING** → `typeof !== 'number'` → clamp se PŘESKOČÍ → uloží se doslova → FE parsuje 9e9. Můj vlastní clamp šel obejít typovou záměnou. DTO patch je `@IsObject()` bez hloubkové typové kontroly, takže string projde.

**Fix.** `Number()` coerce + `Number.isFinite` reject: `Number("9e9")`=9e9 (finite) → clampne na maxHp; `Number("abc")`=NaN → 400 `MAP_TOKEN_STATS_INVALID`. `it.failing` pin překlopen na zelený `it`.

**Poučení.** U NE-DŮVĚRYHODNÝCH číselných polí (klient je posílá i jako string) NIKDY negatuj na `typeof===number` — obejde se stringem → clamp/validace se přeskočí. VŽDY `Number()` coerce + `isFinite` reject, nebo typované DTO (`@IsInt`) místo `@IsObject()`. Příznak: „opravil jsem clamp/validaci, ale drží jen pro jeden datový typ (number), string ji obejde". Sesterská lekce k CH-121 (jest ≠ typecheck): oprava ≠ oprava proti VŠEM tvarům vstupu.

## ✅ ŘEŠENÍ — 2 auth P0 díry z pentestu ZAVŘENY: tokenVersion (invalidace access tokenu) + per-účet TOTP lockout — 2026-07-12

**Co zabralo.** Pentest (PT-35a/e) doložil 2 auth díry, které audit vědomě nechal (blast-radius) jako `it.failing` piny. Po schválení specu opraveno:
- **PT-35e — access token přežil „odhlásit všude" / změnu hesla.** Access token je stateless JWT (TTL 3 dny); `logoutAll` i `handlePasswordChanged` revokovaly jen REFRESH token, access žil dál. Fix = **`tokenVersion`** na useru: access token nese claim `tv`, `JwtAuthGuard` (kde už usera z DB kvůli ban/delete gate načítám) porovná `tv` s DB — nesouhlas → `401 SESSION_REVOKED`. `logoutAll` + `handlePasswordChanged` bumpnou `$inc tokenVersion`.
- **PT-35a — 2FA kód šel brutit donekonečna.** `loginTotp` ověřuje challenge přes `peek` (nespotřebuje při chybě) a nikde nedržel čítač neúspěchů → útočník s platným heslem hádal 6místný kód bez limitu (per-IP throttle obejde rotací IP). Fix = **per-účet lockout**: `failedTotpAttempts` + `totpLockedUntil`; 5 chyb → zámek 15 min (`429 TOTP_LOCKED`), úspěch resetuje. Atomické repo metody (`$inc` / `findByIdAndUpdate`).

**Proč to je správně (a ne jiná varianta).** (1) **tokenVersion default 0 + starý token bez claimu = 0** → při deployi se NIKDO neodhlásí (kill nastane až po prvním reálném bumpu); to je klíčová vlastnost proti „big-bang logoutu". (2) **Kontrola v guardu, ne nová DB query** — usera tam už načítám kvůli ban/delete/role-freshness, `tv` porovnání je zdarma. (3) **Lockout per-ÚČET, ne per-IP** — pentest schválně rotoval `X-Forwarded-For`; per-IP throttle by nechytl. (4) **Ban/delete řeší per-request gate zvlášť** (zabít token umí i bez logout-all) → tokenVersion pokrývá jen dobrovolné „odhlásit všude" + změnu hesla, nezdvojuje ban cestu.

**Jak ověřeno.** `nest build` ✅ · `tsc --noEmit` ✅ · `eslint` ✅ · session.attack e2e: PT-35a + PT-35e `it.failing`→`it` **GREEN** (9 passed) · celá security e2e 65/65 (regrese guard/token) · unit **2531/2531**. Validita pinů zadarmo: oba byly RED jako `it.failing`, teď procházejí jako `it` → přechod dokazuje, že je zavřela obrana. **BE past (CH-121 znovu):** rozšíření `IUsersRepository` o 3 metody NErozbilo `tsc` (volný mock cast), ale runtime jest ANO (`resetTotpFailures is not a function` v `auth.service.spec`) → doplněn mock. Vždy po interface změně i `jest`, nejen `tsc`.

**Zhodnocení — dobře/špatně.**
- 👍 Guard už usera načítal → tokenVersion přidán bez výkonového nákladu; default-0 invariant = bezpečný deploy.
- 👍 Pin `it.failing`→`it` = validita obrany prokázaná automaticky, žádné ruční „vypni obranu, ať zčervená".
- 👎 `logoutAll` NEMÁ FE UI (funkce 01-ucet:65) → tokenVersion nejvíc těží z cesty **změna hesla**; FE tlačítko „odhlásit všude" + `SESSION_REVOKED` instant-logout v `client.ts` zůstávají FE follow-up.
- ⚠️ Enumerace účtů (PT-35b/c/d) NEopravena — vědomý trade-off (accepted), zůstává `it.failing`.
