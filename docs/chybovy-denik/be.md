
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
