# Spec 6.2-followup — Maska: výběr postavy/NPC z adresáře

Status: **NÁVRH (čeká schválení)**
Navazuje: 6.2e (NPC pruh / „Maska"), 6.8 (PJ persona).
Dluh, který uzavírá: spec-6.2 ř. 207 — *„Volba z postav světa se v fázi 8 přidá jako další tab v popoveru."*

## 1. Problém

Maska (`NpcOverridePanel`) má dnes dvě **volná** pole: `Jméno NPC` + `Avatar URL`. PJ
musí jméno i URL avataru psát/kopírovat ručně, i když daný NPC už má ve světě
kartu (Page typu `NPC` / `Postava hráče`) s vlastním obrázkem.

## 2. Cíl

Když má entita kartu, PJ ji **vyhledá podle jména** v našeptávači a vybere —
maska se vyplní sama (jméno + avatar). Volné psaní (ad-hoc NPC bez karty)
**zůstává** beze změny. Když má entita kartu, její jméno v chatu je **klikací**
a vede na kartu.

## 3. Rozsah (rozhodnuto s uživatelem)

- Našeptávač nabídne **oba typy**: `NPC` **i** `Postava hráče` (zdroj
  `usePersonaDirectory`, který je vrací společně). Důvod: může se hodit jiným PJ.
- BE změna je **schválena**: ke zprávě se uloží `overridePageSlug` → klikací jméno.

## 4. UX chování

### 4.1 Panel masky
- Pole `Jméno NPC` dostane **našeptávač** (autocomplete) — stejný vzor jako
  `MentionAutocomplete` (`@zmínka`) v témže composeru.
- Filtruje adresář světa (`usePersonaDirectory`) substringem podle `title`,
  case/diakritika-insensitive. Položka ukazuje miniaturu (`imageUrl`) + jméno +
  odznak typu (NPC / hráč).
- **Výběr položky** vyplní atomicky:
  - `name` = `entry.title`
  - `avatarUrl` = `entry.imageUrl ?? ''`
  - `slug` = `entry.slug`  *(nová interní vazba)*
- Pole `Avatar URL` zůstává viditelné, předvyplněné z karty → PJ může avatar
  ručně přepsat (override). Když entita obrázek nemá, pole je prázdné (iniciála).

### 4.2 Volné psaní (beze změny)
- Když PJ napíše jméno a **žádnou položku nevybere**, odešle se jako dnes
  (`overrideName` + volitelně `overrideAvatarUrl`, **bez** `overridePageSlug`).

### 4.3 Rozvázání vazby
- Jakákoli **ruční editace pole `Jméno`** po výběru z adresáře **zruší `slug`**
  (jméno už nemusí sedět na kartu → vazbu zahodíme, zpráva degraduje na ad-hoc).
- Editace avataru vazbu **neruší** (link míří na kartu, ne na obrázek).

### 4.4 Klikací jméno v chatu
- Má-li zpráva `overridePageSlug`, jméno odesílatele v `MessageItem` je odkaz na
  `/svet/:worldSlug/postava/:slug` ([router.tsx:242](../../../src/app/router.tsx#L242)).
- Bez `overridePageSlug` → jméno je prostý text (dnešní stav).
- ⚠️ Odkaz **nezakládá nový přístup**: cílová stránka má vlastní bránu
  (shielded / friendly 404). Smazaná karta → friendly 404. Žádný leak (auth-policy).

## 5. Datový tok

```
NpcOverridePanel (autocomplete)
  └─ usePersonaDirectory(worldId) → [{ slug, title, type, imageUrl }]
       ▼ výběr
  NpcOverrideState { name, avatarUrl, slug? }   ← sticky (useComposerSticky)
       ▼ send
  ComposerSendPayload { overrideName, overrideAvatarUrl, overridePageSlug? }
       ▼ POST /worlds/:id/channels/:cid/messages
  BE CreateMessageDto.overridePageSlug → schema → toEntity → ChatMessage
       ▼ render
  MessageItem: overridePageSlug → klikací jméno
```

## 6. FE změny

| Soubor | Změna |
|---|---|
| `NpcOverridePanel.tsx` | našeptávač nad polem Jméno; `NpcOverrideState` += `slug?: string`; výběr vyplní jméno+avatar+slug; edit jména maže slug |
| nová `PersonaAutocomplete.tsx` (+css) | dropdown z `usePersonaDirectory`, miniatura + typ odznak; klon vzoru `MentionAutocomplete` |
| `ChannelComposer.tsx` | sticky pole `npcSlug`; payload `overridePageSlug`; `clearNpc` čistí i slug |
| `useComposerSticky` | += `npcSlug: string` |
| `ComposerSendPayload` | += `overridePageSlug?: string` |
| `features/chat/lib/types` (`ChatMessage`) | += `overridePageSlug?: string` |
| `MessageItem.tsx` | jméno → `<Link>` když `overridePageSlug` (potřebuje `worldSlug`) |
| `resolveDisplayName.ts` | beze změny (jméno řeší `overrideName` dál) |

⚠️ `MessageItem` je v `features/chat` (sdílený s globálním chatem). Klikací jméno
zapneme jen world chatem — přes nový optional prop `resolveOverrideHref?`, globální
chat ho nepředá. Žádná tvrdá závislost na router/worldSlug v globálním chatu.

## 7. BE změny (field-drift checklist — 4 místa + service)

| Místo | Změna |
|---|---|
| `dto/create-message.dto.ts` | `@IsOptional @IsString @MaxLength(200) overridePageSlug?` |
| `schemas/chat-message.schema.ts` | `@Prop({type:String}) overridePageSlug?` |
| `interfaces/chat-message.interface.ts` | `overridePageSlug?: string` |
| `repositories/chat-message.repository.ts` (toEntity) | namapovat pole (jinak GET zahodí) |
| `chat.service.ts` (write path) | uložit z DTO, **stejný gate jako overrideName** (`canManageChat`) |

- BE **neověřuje existenci** slugu (konzistence s `overrideName` free-textem; cílová
  stránka má vlastní bránu). Slug pochází z adresáře → realisticky platný.
- Bez `overrideName` se `overridePageSlug` ignoruje (vazba bez masky nedává smysl).

## 8. Edge cases

- Entita bez obrázku → avatar prázdný, jméno klikací funguje dál.
- PJ vybere, pak přepíše jméno → ad-hoc, slug pryč, jméno neklikací.
- Smazaná/přesunutá karta → odkaz = friendly 404 (akceptováno).
- Migrované staré NPC zprávy nemají `overridePageSlug` → neklikací (zpětně OK).
- Whisper / reply / dice se nemění.

## 9. Testy

- `PersonaAutocomplete.spec` — filtr dle jména, oba typy, výběr vyplní 3 pole.
- `NpcOverridePanel.spec` — edit jména po výběru maže slug.
- `MessageItem.spec` — `overridePageSlug` → odkaz; bez něj → text; globální chat bez prop → text.
- BE `chat.service.spec` — `overridePageSlug` se uloží jen s `overrideName` + gate role.

## 10. Mobil/desktop

Našeptávač = stejný overlay vzor jako `MentionAutocomplete` (už responsivní).
Po úpravě panelu spustit skill `mobil-desktop`.

## 11. Otevřené otázky

Žádné — rozsah odsouhlasen. Po schválení následuje implementační plán.
