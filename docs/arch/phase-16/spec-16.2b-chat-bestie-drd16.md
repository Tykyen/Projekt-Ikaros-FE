# Spec 16.2b-chat-bestie — DrD 1.6 bestie v railu světového chatu (parita s mapou)

**Status:** 🟡 NÁVRH → schváleno směrově uživatelem 2026-06-26 („Za mě super; základ je aby 1.6 deník byl v chatu") → čeká potvrzení impl. plánu.
**Rozsah:** **FE only.** drd16 bestie v pravém railu světového chatu — katalog (`BestieRollPanel`, 16.1c) + roster instance (`BestieInstancePanel`, 16.1e). Matrix a ostatní systémy **beze změny** (generic `BestieStatblock` funguje, fate dice je pro Matrix správně).
**Repo:** `Projekt-ikaros-FE`, commit na `main`. · **Autor:** PJ + Claude · **Datum:** 2026-06-26
**Souvisí:** spec-16.2b-mapa-drd16 (mapový `Drd16BestiePanel` = vzor) · spec-16.2b-bestie-drd16 (schéma) · spec-16.1e-bestie-konverzace (roster) · [[project_drd16_system_status]] · [[project_npc_vs_bestie]].

> **Číslování:** „16.2b" = drd16 jako 2. systém grafického průchodu. Tohle je **chat** napojení bestie (list = denik, mapa = mapa, bestie = bestie). Dokončuje paritu drd16 napříč povrchy (deník/mapa/chat).

---

## 1. Cíl / problém
drd16 bestie v chatu renderuje **generic `BestieStatblock`** (přes `EntitySchemaForm`) → tři vady oproti mapovému `Drd16BestiePanel`:
1. **Dice = 4dF (fate)** — `onRollAbility` natvrdo `kind:'fate'`; drd16 chce **d6+** (nafukovací k6).
2. **Bez `DiarySkinScope`** — fialový base theme místo fantasy pergamenu (drd16 skin se neaplikuje).
3. **Bojové hody nedostupné** — generic roluje jen `abilities` list. drd16 boj = **Útoky (`systemStats.attacks`) + OČ + Iniciativa jako klikací d6+**, což generic renderuje jako editační inputy/číslo, ne tlačítka.

> **Oprava dřívějšího omylu (čestně):** tvrzení „chat combat nemá current-HP" je špatně — `hp` **je** v chatu editovatelné jako pole `systemStats`, ukládané do `combatant.systemStats` autosavem (viz Matrix screenshot HP/MAX HP). Pro drd16 je `hp` taky systemStats pole → editovatelné **bez BE změny**.

## 2. Řešení (mirror mapové větve `TokenSystemSheet`)
Uvnitř obou rail panelů větev `systemId === 'drd16'` → **`Drd16ChatBestiePanel`** (nová komponenta, sourozenec mapového `Drd16BestiePanel`), jinak stávající generic `BestieStatblock`. Celý obsah obalen `DiarySkinScope`.

## 3. Klíčová rozhodnutí
| # | Rozhodnutí | Důvod |
|---|---|---|
| R1 | **Hody d6+ jako klikací řádky** (žádná ikona 🎲) — Iniciativa (d6+), Útoky (ÚČ + d6+), Obrana (OČ + d6+); klik na celý řádek → hod. Routing přes `onRoll` z `useChatDiaryRoll` (`kind:'d6+'`, atribuce `bestie`). | uživatel: „přímo klikám na schopnosti", ne přes kostku; parita s mapou |
| R2 | **Schopnosti = read-only reference** (drd16 schopnosti jsou popisné, nehází se) — parita s mapou, která roluje jen útoky/OČ/init. | mapa to tak má; drd16 abilities nejsou číselný hod |
| R3 | **Životy = jedno číslo `systemStats.hp`**, instance: editovatelné klikem **± (−5/−1/+1/+5)**; katalog: read-only. **Bez current/max baru** (to je mapový token feature). ± edituje přímo Životy; canonical max drží Bestiář. | chat = lehký tracker; drd16 hp je jedna hodnota |
| R4 | **Read-only statline** (Velikost/Odolnost/…/Přesvědčení/Zkušenost/Pohyb) + **Popis** (`combatant.notes` / `bestie.notes`). | PJ reference; parita s mapovým panelem |
| R5 | **Edit instance** — „✏ Upravit" → `Drd16BestieForm` v modalu (analog `Drd16BestieTokenEditModal`) → patch **combatanta** (`systemStats` + `notes` [+ `name`*]) přes `useCombatantMutation` (op `update`). **Katalog bez editu** (editace patří do Bestiáře). | uživatel: „základní staty ručně přes edit"; reuse mapového vzoru |
| R6 | **`DiarySkinScope`** kolem celého obsahu (fantasy pergamen, F3 cross-surface). | parita s `DiaryRollPanel` (PC/NPC) a mapou |

> *R5 `name`*: ověřit, že BE `PATCH combatants/:id` přijme `name`. Pokud ne → modal edituje jen systemStats + notes (jméno se mění jen v Bestiáři). Háček H2.

## 4. `Drd16ChatBestiePanel` — obsah
1. **Iniciativa** quick-roll (d6+, bez bonusu) — jen instance (katalog hází taky, bez persistence iniciativy).
2. **Životy** — instance: číslo + ± kroky (autosave `systemStats.hp`); katalog: read-only.
3. **Útoky** (`systemStats.attacks[]` = `{name, value}`) — řádek = klik → hod `ÚČ + d6+`.
4. **Obrana** (`systemStats.defense`) — klik → hod `OČ + d6+`.
5. **Read-only statline** (secondary staty) + **Popis**.
6. **Instance:** „✏ Upravit" → modal s `Drd16BestieForm`.

## 5. Rozdíly chat vs mapa (vědomé)
| Aspekt | Mapa | Chat |
|---|---|---|
| Roll routing | `onMapRoll` (3D overlay + map log) | `onRoll` z `useChatDiaryRoll` (overlay + zpráva do konverzace) |
| HP | `token.currentHp/maxHp` bar + ± | `systemStats.hp` jedno číslo + ± (instance) |
| Edit cíl | `useTokenUpdate` (scéna) | `useCombatantMutation` (roster konverzace) |
| Persistence iniciativy | `token.initiative` (lišta) | bez (chat lišta řadí dle `combatant.initiative` zvlášť — viz H3) |

## 6. Soubory (FE, odhad)
- **Nový** `chat/components/rail/Drd16ChatBestiePanel.tsx` (+ `.module.css` nebo reuse `Drd16BestiePanel.module.css`).
- **Nový** `chat/components/rail/Drd16ChatBestieEditModal.tsx` (analog `Drd16BestieTokenEditModal`, patch combatanta).
- **Úprava** `BestieRollPanel.tsx` — větev drd16 (read-only roll variant) + `DiarySkinScope`.
- **Úprava** `BestieInstancePanel.tsx` — větev drd16 (editable + modal) + `DiarySkinScope`.
- **Test** `Drd16ChatBestiePanel.spec.tsx` — d6+ útok/OČ/iniciativa volá onRoll s `kind:'d6+'`; HP ±; read-only katalog.

## 7. Háčky (k dořešení v plánu)
| # | Háček | Pozn. |
|---|---|---|
| H1 | **Sdílení mapa↔chat** — reuse CSS modulu / extrakce prezentačního jádra vs. duplicita ~80 ř. JSX | priorita: 0 regrese na zelené mapě → spíš reuse CSS + sibling komponenta |
| H2 | **BE patch `name`** na combatantovi | ověřit; jinak edit jen systemStats+notes |
| H3 | **Iniciativa → combat lišta** v chatu | mapa píše `token.initiative`; chat roster řadí dle `combatant.initiative` → patchnout `initiative` při hodu (jako mapa), nebo nechat hod jen do chatu (MVP). Rozhodnout v plánu. |
| H4 | **Katalog roll bez persistence** — `buildBestieToken` snapshot, žádná HP/init persistence (16.1c read-only) | katalog drd16 panel = jen hody + read-only staty |

## 8. Co se NEDĚLÁ (teď)
- **Matrix/ostatní systémy** v chatu — generic `BestieStatblock` zůstává (funguje; fate správně pro Matrix).
- **Sjednocení Matrix chat bestie na drd16-style panel** — uživatelovo „to by se hodilo" = budoucí enhancement (log do `dluhy.md`), ne teď.
- Žádná BE změna · žádný nový combat-HP model (current/max v chatu) · 3D kaskáda d6+ (engine řeší).

## 9. Otevřené
- H1–H3 se dořeší v implementačním plánu.
