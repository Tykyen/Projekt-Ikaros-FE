# Spec 6.6 — Hledání ve zprávách světového chatu

**Status:** ✅ Hotovo (2026-05-19)
**Rozsah:** BE (search endpoint) + FE (modal hledání)
**Repo:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE`
**Autor:** PJ + Claude
**Souvisí:** spec-6.1 (světový chat). Přesunuto z původní fáze 13.1.

---

## 1. Cíl

Hledání ve zprávách světového chatu — jako Messenger/Discord. Uživatel najde
zprávu podle slova nebo části textu napříč konverzacemi, kam vidí.

## 2. Rozhodnutí (brainstorm 2026-05-19, PJ)

- **Rozsah:** celý svět + volitelný filtr na jednu konverzaci.
- **UI:** modal (overlay), lupa v hlavičce konverzace.
- **Shoda:** substring, case-insensitive (regex). Diakritika se nerozlišuje
  jen velikostí písmen — diacritic-folding je mimo rozsah (pozn. §6).

## 3. Návrh řešení

### BE (`chat` modul)
- `IChatMessageRepository.searchInChannels(channelIds, query, limit)` —
  regex `content` (escaped substring, `$options: 'i'`), `isDeleted: false`,
  `channelId ∈ ids`, sort dle `_id` desc.
- `ChatService.searchMessages(worldId, requester, { q, channelId?, limit? })`:
  - `q` < 2 znaky → prázdné pole.
  - Přístupné konverzace přes `getGroupsWithChannels` (reuse access filtru);
    `channelId` filtr ověří přístup (jinak 403).
  - Whisper filtr — šepoty vidí jen účastníci a PJ+ (jako `getMessages`).
  - Overfetch `limit×2`, po whisper filtru ořez na `limit` (default 30, max 50).
  - Vrací `ChatSearchResult[]` — `{ messageId, channelId, channelName,
    senderName, content, createdAt }`.
- `GET /worlds/:worldId/chat/search?q=&channelId=&limit=`.

### FE (`features/world/chat`)
- `useSearchMessages(worldId, query, channelId)` — `useQuery`, `enabled` od
  2 znaků.
- `ChatSearchModal` — vstup (debounce 350 ms) + select filtru konverzace +
  seznam výsledků (kanál · autor · čas · úryvek). Klik → přepne konverzaci.
- Lupa v hlavičce `ChannelView` (vždy viditelná) → otevře modal ve
  `WorldChatRoom`.

## 4. Out of scope

- Skok přesně na zprávu ve výpisu (klik jen přepne konverzaci) — best-effort
  až s „load around message".
- Hledání v přílohách / jménech odesílatelů — jen `content`.
- Globální/platformové hledání (fáze 13.1) — tohle je per-svět chat.

## 5. Acceptance kritéria

1. Lupa v hlavičce konverzace otevře modal hledání.
2. Dotaz < 2 znaky → nápověda, žádné volání BE.
3. Hledání najde zprávy napříč přístupnými konverzacemi; filtr zúží na jednu.
4. Nepřístupné konverzace a cizí šepoty se ve výsledcích neobjeví.
5. Klik na výsledek přepne na danou konverzaci.

## 6. Test plán

- BE `chat.service.spec.ts` — `searchMessages`: krátký dotaz → [], nález +
  doplnění názvu konverzace.
- FE `ChatSearchModal.spec.tsx` — nápověda u krátkého dotazu, filtr konverzací.

## 7. Riziko

| Riziko | Mitigace |
|---|---|
| Regex hledání bez indexu pomalé při statisících zpráv | MVP objem malý; trigger pro `$text` index → dluh, až bude potřeba |
| Diakritika — „resi" nenajde „řeší" | Akceptováno pro MVP; folding = budoucí vylepšení |
