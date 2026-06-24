# Spec 16.1f — Čtenářský font override v chatu (čitelnost na přání)

**Status:** ✅ **IMPLEMENTOVÁNO 2026-06-24** (schváleno + impl. plán odsouhlasen). BE 3 pole (`readerFontOverride/readerFont/readerFontSize` na `WorldMembership`, whitelist na `/chat/appearance`) + FE (override 2 resolverů v `ChannelView`, přepínač 👓 v hlavičce — na mobilu skrytý, konfigurace v `AppearancePopover` sekce „Jak čtu ostatní", `READABLE_FONT_KEYS`). FE build ✓ + chat testy 243/243 ✓; BE typecheck+lint ✓. **⚠️ BE čeká restart** (`feedback_be_restart_required`). Při práci doplněny 2 UI fixy (neprůhledné pozadí popoveru+sdíleného Modalu, kompaktní `DiceMessage`) + opraven dluh `D-NEW-chat-combat-test-provider`.
**Rozsah:** cross-stack — BE (3 pole + whitelist na existujícím endpointu `/chat/appearance`) + FE (override dvou resolverů v `ChannelView`, přepínač v hlavičce konverzace, konfigurační sekce v `AppearancePopover`).
**Repo:** FE `Projekt-ikaros-FE` · BE `Projekt-ikaros`, commit na `main`.
**Autor:** PJ + Claude · **Datum:** 2026-06-24
**Souvisí:** roadmap2.md 16.1 (testerské rozšíření, sourozenec 16.1d/16.1e) · 6.2f „Vzhled mé zprávy" (per-svět `chatColor/chatFont/chatFontSize`) · `chatFonts.ts` · `feedback_be_restart_required` · `project_be_field_checklist` · `feedback_no_mixed_be_fe_batch`.

---

## 1. Cíl
Tester (čtenář) chce **dvě věci najednou**:
1. **Defaultně vidět zprávy fontem, který si každý odesílatel zvolil** (6.2f) — umělecký/atmosférický záměr (např. ozdobné písmo pro zvýraznění v hospodě) zůstává.
2. **Na přání jedním přepínačem převést všechen text do písma, které se *jemu* dobře čte** — když je cizí ozdobný font nečitelný.

„Čitelné" **není fixní systémový font** — je to **čtenářova vlastní volba** fontu + velikosti. Každý čtenář si nastaví, co vyhovuje jemu.

## 2. Klíčová rozhodnutí (z brainstormingu 2026-06-24)
- **Per-viewer + per-svět.** Ovlivní jen jak *daný čtenář* čte zprávy *v tomto světě*. Nikomu jinému se nic nemění, nic se neposílá do zpráv. Nastavuje se zvlášť per svět.
- **Persistence v BE** na `WorldMembership` (sync napříč zařízeními — rozhodnutí PJ 2026-06-24, ne localStorage).
- **Override sjednotí font i velikost** — mini velikosti (0,8×) bolí čitelnost stejně jako ozdobný font. Čtenář volí oboje.
- **Barva zpráv zůstává** — `chatColorGuard` (kontrast) už čitelnost barvy hlídá a barva je legitimní zvýraznění.
- **Override = na všechny zprávy ve streamu** („všechen text"). Nerozlišuje cizí/vlastní (vlastní zprávu čtenář napsal sám, takže neškodí; jednodušší a konzistentní).
- **Nabídka fontů pro čtení = kurátorská podmnožina**, ne všech 40. Ozdobné blackletter/script jako „čitelný režim" jsou proti smyslu.

## 3. Architektura

### 3.1 Jediné hrdlo na FE = dva resolvery v `ChannelView`
Font/velikost teče na bublinu **jen** přes [`resolveFont` / `resolveFontSize`](../../src/features/world/chat/components/ChannelView.tsx#L160-L169) (předávané do `MessageList`). Override = obejít je:

```ts
const ovr = appearance.data?.readerFontOverride ?? false;
const ovrFontStack = getFontStack(appearance.data?.readerFont);   // null → systémový fallback
const ovrFontSize  = getFontSize(appearance.data?.readerFontSize); // null → undefined (zdědí)

const resolveFont = useCallback(
  (key) => (ovr ? ovrFontStack : key ? getFontStack(key) : undefined),
  [ovr, ovrFontStack],
);
const resolveFontSize = useCallback(
  (key) => (ovr ? ovrFontSize : key ? getFontSize(key) : undefined),
  [ovr, ovrFontSize],
);
```

`appearance` (`useMembershipAppearance(worldId)`) je v `ChannelView` **už načtený** (dnes čte `chatColor/chatFont` pro composer) → žádné nové query. **Žádná změna `MessageList`/`MessageItem`** — dostávají stejné callbacky.

### 3.2 BE pole (vzor `chatSkin` z 16.1d) — 3 pole
Na `WorldMembership` + DTO + service + **toEntity mapper** (`project_be_field_checklist` — začít od mapperu, jinak GET tiše zahodí):
- `readerFontOverride?: boolean` (default `false`) — přepínač zapnuto/vyp.
- `readerFont?: string | null` (default `null` → systémový) — klíč z `CHAT_FONT_KEYS`.
- `readerFontSize?: string | null` (default `null` → 1×) — klíč z `CHAT_FONT_SIZE_KEYS`.

**Endpoint:** rozšířit existující `/worlds/:id/chat/appearance` (GET+PATCH, `useMembershipAppearance`) o tato 3 pole.
**Whitelist:** `readerFont` proti `chat-fonts` font-key konstantě, `readerFontSize` proti size-key konstantě (reuse existujících validátorů `chatFont/chatFontSize`); `readerFontOverride` = boolean. Cizí hodnota → 400 / ignorovat.
⚠️ `feedback_be_restart_required` (po BE restart) · `feedback_no_mixed_be_fe_batch` (BE a FE ne v jedné paralelní dávce).

### 3.3 Kurátorská podmnožina čitelných fontů
V [`chatFonts.ts`](../../src/features/world/chat/lib/chatFonts.ts) přidat `READABLE_FONT_KEYS: readonly string[]` = výběr z existující sady (žádné nové fonty, žádný extra load):
`system` (systémový sans), `inter` (Moderní), `lora` (Literární serif), `crimson` (Tradiční román serif), `spectral` (Spektrální serif), `mono` (IBM Plex Mono — pro čtenáře, kterým vyhovuje mono).
Velikosti: celá existující `CHAT_FONT_SIZES` (xs–xxl).

### 3.4 UI — přepínač + konfigurace
- **Rychlý přepínač v hlavičce konverzace** ([`ChannelView` header](../../src/features/world/chat/components/ChannelView.tsx#L509)) — ikona (brýle / „Aa"), toggle `readerFontOverride` přes PATCH (optimistic update cache, vzor `useChatSkin`). Aktivní stav vizuálně odlišit. Tooltip „Číst vše svým písmem".
- **Konfigurace = nová sekce v** [`AppearancePopover`](../../src/features/world/chat/components/AppearancePopover.tsx) **„Jak čtu ostatní"** (jasně oddělená od dnešní „Vzhled mé zprávy" = „jak vypadám já"):
  - přepínač `readerFontOverride`,
  - radio výběr fontu z `READABLE_FONT_KEYS` (s živým náhledem, vzor dnešního font listu),
  - výběr velikosti z `CHAT_FONT_SIZES`.
  - Ukládá se přes stejný PATCH `/chat/appearance`.
- Default při prvním zapnutí: `readerFont=null` (systémový), `readerFontSize=null` (1×) → čtenář si doladí.

## 4. Fáze
- **F1 — BE:** 3 pole + whitelist na `/chat/appearance`. Restart. (samostatná dávka, `feedback_no_mixed_be_fe_batch`)
- **F2 — FE:** rozšířit `MembershipAppearance` + `UpdateAppearancePayload`; `READABLE_FONT_KEYS` v `chatFonts.ts`; override resolverů v `ChannelView`; přepínač v hlavičce; sekce „Jak čtu ostatní" v `AppearancePopover`.
- Po UI změně → `mobil-desktop`; po dokončení funkčnosti → `funkce` + `napoveda`.

## 5. Co NEděláme
- **Žádný OpenDyslexic / dyslexia-friendly font** teď — vyžaduje doplnění do font loadu (`index.html`). Možné rozšíření (případně dluh), ne v 16.1f.
- **Override NEsahá na barvu** zpráv (kontrast guard řeší) ani na dice/speciální render (mají vlastní styling, nečtou `chatFont`).
- **Žádný per-konverzace** override (jen per uživatel × svět).
- **Žádné PJ „vynutit čitelný font všem"** — je to čistě čtenářská volba.

## 6. Otevřené otázky
- Ikona přepínače v hlavičce: brýle (`Glasses`, lucide) vs. „Aa" textový glyph? → návrh: `Glasses`.
- Má rychlý přepínač v hlavičce ukázat jednorázový hint („máš zapnuté čtení svým písmem"), nebo stačí vizuální aktivní stav ikony? → návrh: jen aktivní stav, bez otravného hintu.
