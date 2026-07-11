# ext-46 — Integrita herního stavu & férovost · dosažená L3

## 🔴 POTVRZENO — server nikde nerekomputuje/neclampuje TM herní stav
| Pole | soubor:řádek | problém | fix |
|---|---|---|---|
| dice payload (TM) | `maps/dto/operations/dice-ops.dto.ts:20` `@IsObject`; `map-operations.service.ts:1325` `$push` verbatim | hráč pošle `{sum:20,total:999}` → zobrazí se jako pravý hod | typovaný DicePayloadDto + invarianty (sum===Σrolls, roll∈[1,faces], total v rozsahu) NEBO server RNG |
| dice payload (chat) | `chat/dto/create-message.dto.ts:110-112` `@IsObject`; `chat.service.ts:1419` verbatim | totéž | totéž |
| token currentHp (vlastní) | `token-ops.dto.ts:50`; `map-operations.service.ts:642` absolutní `$set` | `currentHp:99999` i zápor; žádný clamp/monotonie | `@IsInt() @Min(0)` + server clamp max(0,min(maxHp,x)); zvážit `$inc` delta (řeší i lost-update PT-14a) |
| token initiative | authorizer `:151` whitelist bez mezí | `99999` = vždy první | bounds -100..100 nebo PJ autorita |
| rollerKind/rollerName | `dice-ops.dto.ts:15-16`; authorizer `:166` jen byUserId+tokenId | neověřeno vs WorldMembership.role | derivovat na serveru |
| token.move/dice.roll v boji | authorizer `:83-109`,`:166` bez `currentTokenId` | hráč koná mimo svůj tah | turn gate: if combat.isActive → token.id===currentTokenId (PJ bypass) |

## Pozitivně (oprava hypotéz):
- CIZÍ token chráněn: `operations-authorizer.service.ts:134` characterId!==user.id → 403. Hráč sahá jen na VLASTNÍ.
- combat.turn je PJ-only (authorizer default :213). Hráč pořadí neposune.
- Měna JE server-autoritativní (character-accounts assertCanAdjust, atomic+revert) — protipól děravé TM vrstvy.
- FE RNG `rollEngine.ts:73` je kryptografický, ale to férovost neřeší (hráč obchází FE).

## Testy: NEEXISTUJÍ (jen injection+xss v test/security/). attack-catalog.md:37 má PT-46a-e jako `it.failing` ale SPEC CHYBÍ. Založit `test/security/game-integrity.attack.e2e-spec.ts` + operations-authorizer.spec (turn gate/rollerKind) + map-operations.spec (HP clamp).

## Fix status: HP clamp + initiative bounds + turn gate + dice bounds = FIXNU (BE, test-first). rollerKind server-derive = FIXNU. Vše BE.
