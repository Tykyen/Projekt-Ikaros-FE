# Spec 11.2-ext — Storyboard: spustitelná příprava (galerie→chat, mapa-podklad, most na taktickou mapu, knihovna, naplánování)

**Status:** ✅ Schváleno + implementováno A–F (2026-06-02)
**Navazuje:** [`spec-11.2.md`](./spec-11.2.md) (hotový Storyboard). Rozšiřuje feature `campaign` + zasahuje `tactical-map` (C/D) a `chat`+BE (F).
**Repo:** `Projekt-ikaros-FE` (+ BE `Projekt-ikaros` u C?/E/F).
**Autor:** PJ + Claude · **Datum:** 2026-06-01

---

## 1. Cíl / jednotící myšlenka

**„Scénář = spustitelná příprava herního momentu."** PJ si moment dopředu nachystá (text, obrázky, mapa-podklad, entity) a pak ho **jedním–dvěma kliky vypustí** do hry: obrázky do chatu, mapu jako taktickou scénu, předpřipravené postavy/bestie na tu scénu. Plus znovupoužitelnost přes knihovnu šablon.

Šest dílů (A–F), stavěných v pořadí **A → B → D → C → E → F**, každý jako ucelený sub-krok (žádné polotovary).

---

## 2. A — Galerie scény: lightbox + kopírovat + poslat do chatu

**Rozsah:** FE only. Rozšiřuje galerii v `ScenarioEditor` (krok 11.2c).

**Reuse (ověřeno rešerší):**
- `ImageLightbox` (`@/shared/ui`) — `{ images: LightboxImage[], index, onClose, onIndexChange }`.
- Světový chat: `useChatGroups(worldId)` → `GroupWithChannels[]` (výběr kanálu); `useSendMessage(worldId, channelId)` → payload `{ content?, attachments?: ChatAttachment[], ... }`.
- `ChatAttachment` = `{ url, publicId, type:'image'|'document', mimeType, filename, size }`.
- Kopie: `navigator.clipboard.writeText(url)` (vzor `PageHeader.tsx`).

**Akce u každého obrázku galerie (hover overlay / kebab):**
1. **🔍 Otevřít** → `ImageLightbox` (všechny obrázky scény, daný index).
2. **📋 Kopírovat odkaz** → `clipboard.writeText(url)` + toast „Zkopírováno".
3. **💬 Poslat do chatu** → malý dialog: výběr kanálu (`useChatGroups`) + volitelný popisek → `useSendMessage`. ⚠️ **Ověřit při impl:** galerie drží jen `url` (string), `ChatAttachment` chce i `publicId`/`mimeType`/`size`. Sestavíme `{ url, type:'image', mimeType:'image/*', filename: <z url>, publicId: '', size: 0 }` a ověříme, že BE přílohu přijme; pokud vyžaduje `publicId`, fallback = poslat jako `content` s URL (obrázek se rozbalí z odkazu) nebo doplnit publicId z `useUploadImage` výsledku uloženého při nahrání. **Drobná nejistota, ne blocker.**

**Naplánování odeslání** — **NE v A** (viz F, vyžaduje BE). V A jen „poslat teď".

**Acceptance A:** u obrázku jdou 3 akce; lightbox listuje; kopírování dá toast; „poslat do chatu" zvolí kanál a zpráva s obrázkem dorazí.

---

## 3. B — Mapa-podklad scény: obrázek + očíslovaná verze + legenda

**Rozsah:** FE only. **Nahrazuje** dnešní matoucí sekci „🗺 Mapy" (odkaz na MapScene) za **přípravu mapy** (jak to autor měl na disku: obrázek lokace + očíslovaná verze + vysvětlivky).

**Datový model (do `contentData.storyTree`):**
```ts
// rozšíření ScenarioMeta
mapPrep?: {
  imageUrl?: string;          // podkladová mapa scény
  numberedImageUrl?: string;  // tatáž mapa s čísly / značkami
  legend: { label: string; text: string }[];  // číslo/značka → vysvětlivka
};
mapSceneIds: string[];        // ZŮSTÁVÁ — odkaz na vytvořené taktické scény (pro C/D)
```

**UI (sekce „🗺 Mapa scény" v `ScenarioLinksPanel` / nebo vlastní blok editoru):**
- Dva upload sloty (podklad + očíslovaná) přes `useUploadImage`; náhledy s lightbox + odebrat.
- **Legenda** = editovatelný seznam řádků `[ číslo/značka | vysvětlivka ]`, přidat/odebrat/přeuspořádat.
- Klik na náhled → lightbox (obě mapy).
- (Most na C: tlačítko „Vytvořit taktickou scénu z této mapy" — implementace až v C.)

**Acceptance B:** scéna má dvě mapy + legendu; přežije refresh (merge-write); lightbox; matoucí MapScene-výběr nahrazen smysluplnou přípravou.

---

## 4. D+C — Taktická mapa: „Načíst přípravu" = vytvoř scénu z přípravy

> **Revize (impl):** D a C sjednoceny do jedné akce. „Načíst přípravu" už NEvkládá
> do aktivní scény — **vytvoří novou scénu** ze scénáře (podklad mapy + entity)
> a přepne na ni PJ. Řeší to i prázdný svět (žádná aktivní scéna není potřeba).

**Rozsah:** modul `tactical-map` (FE; operace i `POST /maps` už existují — bez BE).

**Reuse (ověřeno):** `POST /maps` (create) + `POST /maps/:id/active` (aktivace) —
stejný pattern jako `createSceneMutation` v `MapPjPanel`. Operace `scene.image`,
`scene.activeCharacters.add {characterId}`, `scene.activeBestie.add {bestieId}`;
`postMapOperation(sceneId, op)`; `member.assignToScene` (self) přes `postWorldOperation`.

**UI:** v `MapPjPanel` tlačítko **„Načíst přípravu"** (nevyžaduje aktivní scénu) →
vybere scénář → `LoadPreparationDialog`:
1. `POST /maps` — nová scéna, `name = scénář.title`, default hex config.
2. **Podklad** = `mapPrep.imageUrl` (ZÁKLADNÍ, ne `numberedImageUrl`) přes `scene.image`. Když scénář mapu nemá, scéna zůstane bez podkladu.
3. `bestieIds` → `scene.activeBestie.add` (přímé, `Bestie.id`).
4. subjekty/PC/NPC → `characterId` přes slug→id z `/worlds/:id/characters(/players)`. Subjekt bez napojené postavy se přeskočí (hlášení).
5. `POST /maps/:id/active` + `member.assignToScene` (self) → PJ scénu rovnou vidí.
- Výsledek: toast „Scéna „<název>" vytvořena: N postav, M bestií (+ podklad mapy)".

**Acceptance:** výběrem scénáře vznikne nová aktivní taktická scéna s jeho podkladem
(základní mapou) a předpřipravené bestie/postavy jsou ve whitelistu (palety) ke spawnu;
PJ je na scénu rovnou přepnut.

**TODO (mimo tento krok):** doplnit `mapSceneIds` scénáře po vytvoření (provázání
scénář↔scéna zpět) — zatím neimplementováno.

---

## 6. E — Knihovna scén (šablony)

**Rozsah:** FE + **BE úložiště** (konzistentně s knihovnou map = per-PJ private, cross-world — `project_takticka_mapa_library`). ⚠️ **Dořešit ve spec E:** nová BE entita `scenario-template` vs. reuse. Šablona = snapshot scénáře (text, meta, mapPrep, legenda; **bez** runtime odkazů na konkrétní subjekty/postavy daného světa — ty jsou per-svět).

**UI:** v editoru/stromu „Uložit jako šablonu"; v `+ Scéna` nabídka „z šablony" → vloží a otevře k úpravě.

**Acceptance E:** scénu lze uložit jako šablonu a v jiném místě/světě vložit + upravit.

---

## 7. F — Naplánované zprávy do chatu

**Rozsah:** **BE (velké) + FE.** ⚠️ Samostatná featura: BE potřebuje persistovanou frontu naplánovaných zpráv (`scheduledMessages`: channelId, payload, sendAt, status) + **scheduler/worker**, který je v čas odešle (cron/queue). FE = u „Poslat do chatu" (A) přibude volba „naplánovat na: <datum/čas>".

**Dořešit ve spec F:** mechanismus scheduleru (BE cron vs. fronta), editace/zrušení naplánované zprávy, kdo vidí frontu. **Staví se nakonec.**

---

## 8. Pořadí, hranice, rizika

**Pořadí:** A → B → D → C → E → F. Každý krok samostatně mergnutelný; BE kroky (E úložiště, F scheduler, příp. C create) = **oddělené commity, nikdy v jedné dávce s FE** (memory).

**Hranice modulů:** A/B/E = `campaign`; C/D = `tactical-map`; F = `chat`+BE. Mezi moduly jen přes existující kontrakty (operace, chat API).

**Klíčová rizika:**
| Riziko | Krok | Mitigace |
|---|---|---|
| Chat příloha vyžaduje `publicId`, galerie má jen URL | A | fallback poslat URL jako content; nebo ukládat publicId při uploadu |
| slug→characterId resolve pro spawn | D | directory `/characters`; chybějící napojení přeskočit s hlášením |
| Chybí `POST /maps` create endpoint | C | ověřit; pokud chybí → BE patch (samostatný krok) |
| BE scheduler pro naplánování | F | vlastní spec; nedělat „při tom" |
| Šablona zatáhne per-svět odkazy | E | snapšot bez runtime ref (subjectIds/mapSceneIds se nekopírují) |

---

## 9. Co teď

Po schválení tohoto směru: **začínám A** (galerie — lightbox + kopírovat + poslat do chatu teď). A+B detail je hotový; C–F doplním detailem (a doladím BE nejistoty) vždy před jejich implementací.

**Otevřené k potvrzení:** žádné blokující — pořadí A→B→D→C→E→F odsouhlaseno; naplánování (F) potvrzeno jako BE-krok naposled.
