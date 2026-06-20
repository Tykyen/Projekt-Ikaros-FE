# form-schema / 06-chat — checkpoint RUN-2026-06-20-1621

> HEAD: FE 96460577 · BE 9cf98be · datum 2026-06-20

## Pokrytí

Projity vrstvy:
- FE form: `ChannelDialog.tsx`, `GroupDialog.tsx`, `useChannelMutations.ts`, `useEditMessage.ts`, `useUploadWorldAttachment.ts`, `useWorldChat.ts`, `ChannelComposer.tsx`, `ChannelView.tsx`
- FE typy: `chat/lib/types.ts`, `world/chat/lib/types.ts`
- BE DTO: `create-channel.dto.ts`, `update-channel.dto.ts`, `create-group.dto.ts`, `update-group.dto.ts`, `create-message.dto.ts`, `update-message.dto.ts`, `create-scheduled-message.dto.ts`, `chat-attachment.dto.ts`, `reorder-items.dto.ts`
- BE schema: `chat-channel.schema.ts`, `chat-group.schema.ts`, `chat-message.schema.ts`
- BE mapper (toEntity): `chat-channel.repository.ts`, `chat-group.repository.ts`, `chat-message.repository.ts`
- BE service: `chat.service.ts` (updateChannel, createChannel, accessMode logic)
- BE controller: `chat.controller.ts`, `scheduled-messages.controller.ts`, `scheduled-messages.job.ts`
- base-mongo.repository.ts (update = `$set` partial)

Vrstvy s živou infrou (L4): NEoznačeny za hotové → PROOF-REQUEST níže.

## Dosažená L vs cílová L

- CT-01..CT-17 (Channel + Group): **L2** — statická trojvrstvá shoda ověřena čtením kódu
- CT-18..CT-28 (Message): **L2** — všechna pole prošla 4 místy (DTO → schema → toEntity → FE typ)
- CT-29..CT-32 (Scheduled): **L2** — včetně ověření F-19 opravy v commit `aba3085`
- Cílová L: L2+ (kritická pole na L3+) — baseline L2 dosažen staticky

## Nálezy

### F-RUN-CS-01 — `TY`/`DF` ChatAttachment.type enum drift FE (global) ↔ BE DTO ♻️

- **Kde:** `src/features/chat/lib/types.ts:31` — FE typ `ChatAttachment.type = 'image' | 'document'` (2 hodnoty)
- vs. `backend/src/modules/chat/dto/chat-attachment.dto.ts:16` — BE `@IsIn(['image', 'video', 'document'])` (3 hodnoty)
- **Dopad:** FE typ TS nereprezentuje `'video'` → pokud BE někdy vrátí `type:'video'` (v budoucnu), FE render může selhat nebo to ignorovat. Aktuálně `uploadWorldChatFile` i `uploadGlobalChatFile` používají `GLOBAL_CHAT_ALLOWED_MIME` (bez video) → typ `'video'` se z uploadu nikdy nevygeneruje. FE světový chat re-uses `ChatAttachment` z globálního chatu, komentář to uznává.
- **Závěr:** latentní drift — aktuálně neaktivní (upload video nepovolí), ale DTO má dead branch. Pokud se video povolí, FE typ crashne render.
- **Návrh:** buď sjednotit FE typ na 3 hodnoty (`| 'video'`), nebo odebrat `'video'` z BE `@IsIn`. Pravděpodobně záměr zůstat na 2 pro chat.
- **Dopad na existující data:** žádný (v DB není žádné `type:'video'` ze světového chatu).
- **L1** · 🟡 · ♻️ (viz poznámka v původním CT-19 plánové tabulce, ale nebyl explicitně formalizován)

---

### F-RUN-CS-02 — `XF`/`DF` accessMode switch = stale allowedRoles/allowedMemberIds v DB 🆕

- **Kde:** `ChannelDialog.tsx:148-149` — FE při update posílá `allowedRoles` jen když `accessMode==='roles'`, `allowedMemberIds` jen když `accessMode==='members'`; přepnutí na `'all'` nepošle prázdné pole.
- vs. `backend/src/database/mongo/base-mongo.repository.ts:28` — update = `$set` partial (delta), ne full replace.
- vs. `chat.service.ts:170-176` — access check podmíněn `channel.accessMode`, stale hodnoty se ignorují.
- **Rozpor:** po přepnutí `members → all` zůstanou stará `allowedMemberIds` v DB (a analogicky `allowedRoles`). Přepis sice neunikne (accessMode gate stale ignoruje), ale DB stav je nekonzistentní.
- **Dopad:** žádný bezpečnostní (access gate jde přes `accessMode`), jen kosmetická DB špína. Pokud se někdy channel přepne zpět na `members`, starý seznam se "vrátí" bez toho aby PJ věděl.
- **Dopad na existující data:** platí pro stávající channely — existují dokumenty se stale poli.
- **Návrh:** při změně `accessMode` FE vynulovat i opačné pole (`dto.allowedRoles = []` při `!== 'roles'`), nebo BE service explicitně resetovat neaktivní pole při update accessMode.
- **L2** · 🟡 (latentní DB nekonzistence) · 🆕

---

### F-RUN-CS-03 — `WL` linkedMemberUserId chybí ve FE typu ChatChannel 🆕

- **Kde:** BE `interfaces/chat-channel.interface.ts:20` — `linkedMemberUserId?: string`
- vs. BE mapper `chat-channel.repository.ts:108` — vrací `linkedMemberUserId` v toEntity response
- vs. FE typ `world/chat/lib/types.ts:35-51` — `ChatChannel` pole **NEMÁ** `linkedMemberUserId`
- **Rozpor:** BE GET `/groups` vrací channels s `linkedMemberUserId` (serialize from plain object), FE typ pole nezná → TypeScript na FE nechytí přístup k poli → žádná FE komponenta ho nepoužívá (správně — je to interní BE pole pro PJ kartu postavy).
- **Dopad:** žádný funkční (pole není v API kontraktu potřeba na FE), ale BE odpověď ho obsahuje → FE dostává extra pole, které TS nezná. Potenciální leak privacy info (userId hráče viditelný v HTTP odpovědi všem přihlášeným členům světa, kteří GET /groups mohou).
- **Závěr:** `linkedMemberUserId` je internal BE pole, nemělo by se serializovat do GET response. Zároveň není to blokující problém pro formy.
- **Návrh:** přidat Exclude dekorátor nebo neseriáliovat `linkedMemberUserId` v GET response (přidat do FE typu jako optional, nebo lépe excludovat z response).
- **Dopad na existující data:** žádný.
- **L2** · 🟡 · 🆕

---

### F-RUN-CS-04 — registr F-19 neaktualizován po opravě v `aba3085` 🆕 (doc drift)

- **Kde:** `docs/form-schema-audit.md:171` — F-19 stav: bez označení ✅, text říká `@IsArray` nad `unknown[]`.
- vs. `backend/src/modules/chat/dto/create-scheduled-message.dto.ts:25-30` (HEAD) — má `@ValidateNested({ each: true }) @ArrayMaxSize(10) @Type(() => ChatAttachmentDto)`.
- vs. commit `aba3085` (po 2026-06-05 sweepU) — přidal `@ValidateNested` + `spec` test `create-scheduled-message.dto.spec.ts` s 4 testovými případy pro F-19.
- **Dopad:** F-19 je v registru jako otevřený nález (🟡), ale v kódu je opraveno + testováno. Zavádí auditní záznam.
- **Návrh:** označit F-19 v `form-schema-audit.md` jako `✅ opraveno (aba3085, 2026-06-XX)`.
- **L2** · ⚪ (doc drift) · 🆕

---

### Ověřeno jako shoda / by-design (bez nálezu):

- **CT-01/CT-12** `LN` — name trim+if(!trimmed) FE + `@MinLength(1)` BE: ⚖️ by-design (mezerové jméno FE blokne, BE by pustilo)
- **CT-02** `EN` — accessMode 3 hodnoty: FE literal = DTO `@IsIn` = schema default `'all'`; DB bez `enum` záměrné ✅
- **CT-03/CT-04** `TY/XF` — allowedRoles/allowedMemberIds podmínečné posílání dle accessMode ✅ (viz F-RUN-CS-02 pro stale)
- **CT-05** `NL` — imageUrl `''` = delete: channel/group DTO `@IsString` (ne `@IsUrl`) přijme `''`; na rozdíl od world (F-07 třída) — správně ✅
- **CT-06** `WL/NM` — groupId create: FE posílá v URL params (ne body); `CreateChannelDto` ho záměrně nemá; service bere z `groupId` URL param ✅ (K-F10 vyvrácen)
- **CT-07** — type: service default `'all'`; FE neposílá ✅
- **CT-08** — order: bulk reorder endpoint; mimo create/update ✅
- **CT-09/CT-10** `WL` — worldId/isGlobal: service-set záměrně, ne drop ✅
- **CT-11** `WL` — lastMessageAt/Preview: server-set read-only; mapper vrací ✅
- **CT-13** `NL` — imageUrl `''` group delete: `@IsString @MaxLength(512)` pustí `''` ✅
- **CT-14/CT-15** `RG` — create regex povinný vs update regex nullable: záměrný drift pro reset (`''` jen update) ✅
- **CT-17** `WL/NM` — linkedWorldGroup: service-set; FE typ ho deklaruje, mapper ho vrací ✅ (fix z commit `a6985bd`)
- **CT-18** `LN/XF` — content: `@IsOptional @MinLength(1) @MaxLength(4000)`; prázdnost vynutí controller + ✅
- **CT-19** `TY` — attachments `@ValidateNested {each}`, `@ArrayMaxSize(10)`, `@Type(ChatAttachmentDto)` ✅
- **CT-20..CT-28** — plně ověřeny mapper 4 místy ✅
- **CT-29..CT-32 (scheduled)** — F-19 opraveno; `sendAt` future check v controlleru; empty guard v controlleru ✅
- **overridePageSlug** (přidáno v `c52c017` po sweepU) — všechna 4 místa: DTO (`:57-61`) + schema (`:17`) + toEntity (`:257`) + FE typ (`chat/lib/types.ts:54`) ✅
- **reorder DTOs** `NM` — FE `{ items: [{id,order}] }` = BE `ReorderItemsDto.items[ReorderItemDto]` ✅
- **UpdateMessageDto** `NM/TY` — FE `{content,attachmentsToAdd,attachmentsToRemove}` = DTO klíče 1:1 ✅

## PROOF-REQUEST

**PR-06-01** `M4 round-trip` — CT-14/CT-15 create/update regex drift: přesně ověřit, zda create s `color=undefined` a edit s `color=''` funguje konzistentně (FE posílá `color ?? ''` jen pro edit, undefined pro create). Bez živé infry nelze L3+.

**PR-06-02** `M5 red-team` — CT-02 accessMode: DB bez `enum` → přímý DB write s libovolným string accessMode (mimo 'all'|'roles'|'members') přežije bez validace. Ověřit, zda to vede k pass-through chybě v `hasAccessGivenMembership`.

**PR-06-03** `M4 round-trip` — CT-05/CT-13 imageUrl `''` delete: ověřit GET response po `PATCH imageUrl:''` — vrátí `imageUrl: ''` nebo `imageUrl: undefined`? Mapper: `doc.imageUrl as string | undefined` → `''` projde jako string, ne undefined.
