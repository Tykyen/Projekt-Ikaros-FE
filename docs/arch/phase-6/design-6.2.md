# Design audit 6.2 — Zprávy ve světovém chatu (`frontend-design`)

Výstup `frontend-design` auditu pro krok 6.2. Vstup do §4 specu ([spec-6.2.md](spec-6.2.md)) a do `plan-6.2.md`.

Navazuje na [design-6.1.md](design-6.1.md) — koncept **„Depeše"** (dispečink / korespondenční dossier), signature **„nit kanálu"**, kosti vs. povrch (token-only skinování + opt-in ornamentové proměnné). 6.2 ten jazyk **rozšiřuje**, nevytváří paralelní.

---

## 1. Koncept 6.2 — „Psací stůl operátora"

Composer 6.1 byl jen řádek pro odeslání depeše. 6.2 z něj dělá **operátorský psací stůl** — místo, kde se depeše skládá ze sedmi vrstev (text, příloha, citace, šepot, NPC maska, RP datum, vzhled podpisu). Každá vrstva má v UI **svoje razítko** — drobnou kompaktní značku, ne plovoucí floating actions à la Slack.

Klíčová napětí, která jsme řešili:

| Konflikt | Řešení |
|---|---|
| Bohatý feature set vs. nepřeplácaný composer | **Sekundární toolbar nad textareou** — 5 razítek v řadě, žádné rozkládací menu. Akce viditelné z první vteřiny. |
| Per-svět vzhled jako profile-preference vs. ad-hoc per-zprávu | Vzhled (🎨) je **modální** uložený v membershipu — ne každo-zprávový toggle. Razítko 🎨 ukazuje *aktuální podpis*, klik otevře nastavení. |
| Optimistic UI nesmí mást | Pending zpráva má **decentní pulz** v barvě kanálu (nit dýchá). Failed zpráva má `--theme-error` border + jasnou akci. Žádné okrouhlé toast notifikace. |
| Discord/Messenger feel bez napodobeniny | Discord má bubliny, my držíme **řádkový deník**. Discord-like je *chování* (mentions, optimistic, real-time), ne grafika. |

---

## 2. Signature 6.2 — „signature čára composeru"

Drobné, ale nezaměnitelné. Pod textareou composeru se renderuje **řádek aktivních modů** v barvě kanálu (nit):

```
┌────────────────────────────────────────────────────────────┐
│  📎  🎭  📅  🎨  @                       │  ↩ REPLY · franta │  ← reply bar (jen když je reply)
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  [   textarea — placeholder „Napiš depeši…"   ]            │
│                                                            │
│  ──────────────────────────────────────────  [Odeslat ▸]   │  ← signature čára
│   NPC: Krčmář · RP 1453-04-21 · → franta                   │  ← aktivní mody (jen když je co)
└────────────────────────────────────────────────────────────┘
```

- **Signature čára** = 1px lineární gradient `transparent → barva kanálu → transparent`. Když je composer **idle** (žádné mody), čára je `--theme-border-soft`. Když se aktivuje mód (NPC/RP/whisper), čára *rozzáří* barvu kanálu a pod ní se objeví pásek aktivních modů (`--text-xs`, monospace, oddělovač `·`).
- Čára žije = composer drží stav. User nemusí scrollovat ani hledat „kde jsem". Plus: pruh modů je **klikatelný** — klik na „NPC: Krčmář" otevře NPC panel s pre-fillem; klik na „→ franta" zruší whisper.

To je věc, kterou si user 6.2 zapamatuje. Skin-agnostická (jen tokeny + barva kanálu), levná, jednoznačná.

---

## 3. ChannelComposer — anatomie

```
┌────────────────────────────────────────────────────────────────┐
│ ┌─ reply card (jen když replyTo) ─────────────────────────┐ × │
│ │ ↩ Franta:  „Hod si na vnímání, je tam průvan…"          │   │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌─ attach preview lišta (jen když picked.length > 0) ─────────┐│
│ │ [img] [img] [📄 mapa.pdf ×] [+]                              ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌─ toolbar — 5 razítek (jednotná šíře 32×32, gap 4) ──────────┐│
│ │ 📎    🎭     📅     🎨     @         ↳ rp 1453-04-21 chip   ││
│ │ attach NPC    rp    vzhled mention   ↳ např. RP chip vpravo ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                │
│   ┌── textarea (auto-grow 1–5 řádků, --font-body) ────────┐    │
│   │ Napiš depeši…                                          │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                │
│ ──── signature line ────────────────────────────  [Odeslat ▸] │
│ NPC: Krčmář · RP 1453-04-21 · → franta                         │
└────────────────────────────────────────────────────────────────┘
```

### Razítka (toolbar)

- 32×32 kontejner, ikona `lucide-react` 18px, `--radius-sm`, `1px solid transparent`.
- **Idle:** bez borderu, ikona `--theme-text-dim`. **Hover:** border `--theme-border-soft`, ikona `--theme-text`.
- **Aktivní** (mód má hodnotu): border + ikona v barvě kanálu (`--ch-accent`), výplň `color-mix(in srgb, var(--ch-accent) 12%, transparent)`.
- **Disabled** (NPC pro non-PJ): opacity 0.35, `cursor: not-allowed`, žádný hover.
- Title attribut čistě česky: „Připojit přílohu", „Maska postavy (NPC)", „Datum ve hře", „Vzhled mojí zprávy", „Zmínit hráče".

### Reply card

- Připíchnutá nahoře, `--radius-sm`, `border-left: 3px solid --ch-accent` (nit kanálu).
- Avatar autora vlevo (24 px), pak jméno bold + úryvek `--theme-text-dim` v jednom řádku s ellipsis.
- × vpravo (klik zruší reply).
- Slide-down 120 ms (`transform: translateY(-4px) → 0` + opacity).

### Attach preview lišta

- Obrázky: 56×56 thumbnail (`object-fit: cover`, `--radius-xs`), × v rohu na hover.
- Dokumenty: 56×56 placeholder s ikonou `FileText`, pod ním filename ellipsis (max 80 znaků).
- Limit chip vpravo: `3/10 obrázků · 1/4 dokumenty`.
- Drag-reorder out of scope (dluh).

### RP date chip (vpravo od razítek)

- Když je `rpDate` nastaveno, vedle razítek se objeví chip `📅 21. 4. 1453 ×`. Klik na × maže.
- Tady **nepoužíváme** Intl s rokem 1453 plně? — uvnitř world historického období je `Intl` v pohodě (ISO calendar). Pokud world má alternativní časomíru (např. 4. věk), složitější formátování přijde s kalendářem světa v 9.2.

### Send button

- Pravý okraj signature line. **Filled v barvě kanálu** (`--ch-accent`), kontrastní text. Spinner při send mutation.
- Disabled = opacity 0.4. Enabled hover = +4% lighten (`color-mix`).
- Mobile: ikona-only (44×44 touch target).

### Mobile (< 768px)

- Toolbar zůstává viditelný (5 razítek se vejde i na 360px). Send tlačítko se stává **fab kruh** vpravo dole signature čáry.
- Reply card a attach lišta plně responzivní (1 sloupec).
- Vzhled popover a mention picker pokrývají full-width od spodu jako bottom-sheet, ne floating popover.

---

## 4. AppearancePopover (6.2f) — „razítkovací podpis"

Per-svět color + font. Otevírá se kliknutím na razítko 🎨. Popover, ne modal.

```
┌─ Vzhled mé zprávy v tomto světě ──────────────────  × ─┐
│                                                         │
│  Náhled:                                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ⏵ Tvé jméno · 14:32                              │  │
│  │ Tvá zpráva by vypadala takto. Jakou stopu chceš  │  │
│  │ v tomto světě nechat?                             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Barva                                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [HexColorPicker — kolo + slider]                 │  │
│  │  #a78bfa     [hex input]    [⟲ výchozí]          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Písmo                                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ◉ Systémový   Aaa Bbb Ccc                         │  │
│  │ ○ Patkový     Aaa Bbb Ccc                         │  │
│  │ ○ Strojopis   Aaa Bbb Ccc                         │  │
│  │ ○ Středověký  Aaa Bbb Ccc                         │  │
│  │ ○ Rukopis     Aaa Bbb Ccc                         │  │
│  │ ○ Futuristický Aaa Bbb Ccc                        │  │
│  │ ○ Knižní      Aaa Bbb Ccc                         │  │
│  │ ○ Kód         Aaa Bbb Ccc                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [Zrušit]                              [Uložit podpis] │
└─────────────────────────────────────────────────────────┘
```

- **Náhled je živý** — vždy nahoře, mění se okamžitě jak user posune color picker / klikne font radio. Bez čekání na uložení.
- **Font radio:** každý řádek = 24px ukázka v daném písmu (`Aaa Bbb Ccc` — neutrální triple). Tlačítko označuje **klíč fontu**, ne celý CSS stack.
- **Reset (⟲ výchozí):** smaže color + font v membershipu → BE bere `User.chatColor` z globálního profilu jako fallback. UI to ukáže jako „dědí z profilu".
- **Tlačítko Uložit podpis** — slovo *podpis* je úmyslné, navazuje na metaforu razítka.
- Popover šíře: 360px desktop. Mobil: bottom-sheet plné šíře, vysunutí `transform: translateY(100%) → 0` 200 ms.
- **Validace barvy proti pozadí** — pod hex inputem decentní řádek `⚠ Tato barva je málo čitelná` (žluté `--warning`), pokud `guardChatColor()` musela posunout luminanci. Nestraší — informuje.
- **Kontrast guard se aplikuje až při renderu**, ne při uložení. Uživatel může uložit cokoli; FE jen warnuje a guard se postará až v `MessageItem`.

---

## 5. MentionAutocomplete (6.2i)

Discord-style dropdown nad textareou. Otevírá se napsáním `@` + 0..N znaků (regex `(?:^|\s)@(\w*)$`).

```
                                              ┌──── caret pos ────
                                              │
┌─ textarea ─────────────────────────────────┐│
│ Ahoj @fra█                                  │
└─────────────────────────────────────────────┘
                ▲
                │
┌─ MentionAutocomplete (pop-up) ──────────────┐
│  ▸ Členové konverzace                       │
│  ─────────────────────────────────────────  │
│  ● [avatar] franta        Frantíkův synek   │  ← highlighted (↑↓)
│    [avatar] frantisek_b   Pirát z Borneo    │
│  ─────────────────────────────────────────  │
│  ↵ vložit · esc zavřít                      │
└──────────────────────────────────────────────┘
```

- Pop-up se renderuje **nad** caret pozicí (pokud se nevejde nahoru, klesne dolů). Šířka 280px, max 6 položek + scroll.
- Řádek: 28px avatar + `username` (mono) + `characterPath` (`--theme-text-dim`).
- **Highlight** klávesnicí (↑/↓) i myší. Enter/Tab = vložit `@username ` (s trailing space). Esc zavře.
- **Filtr:** `username.startsWith(query) || characterPath.toLowerCase().includes(query)`.
- Hlavička sekce „Členové konverzace" je placeholder pro budoucí rozšíření (mentions postav v fázi 8).
- Mobil: dropdown přilepený k spodní hraně textarey (sticky, aby ho keyboard nepřekryl).

**Render v `MessageItem`:**
- `@username` se obalí v `<span class="mention">`. Background `color-mix(in srgb, var(--ch-accent) 10%, transparent)`, padding `0 4px`, `--radius-xs`, color = `--ch-accent`.
- Když mention míří na **aktuálního usera**: navíc `box-shadow: 0 0 0 1px --ch-accent` (jemný outline). Konverzace s minimálně jednou mention-self má v sidebaru červenou tečku unread badge (Discord-like).

---

## 6. NpcOverridePanel (6.2e) — „maska"

Razítko 🎭 v toolbaru. Klik **rozbalí inline pruh** pod toolbarem (ne popover — má zůstat viditelný během psaní).

```
┌─ toolbar ─────────────────────────────────────────────┐
│ 📎  🎭(aktivní) 📅  🎨  @                              │
└────────────────────────────────────────────────────────┘
┌─ NPC pruh ────────────────────────────────────────────┐
│ 🎭 Maska:  [Jméno NPC……]  [Avatar URL……]         × OFF│
└────────────────────────────────────────────────────────┘
```

- Pruh má `--theme-elevated-bg`, `border-left: 3px solid --ch-accent` (drobně tlumený, ne plný), `--radius-sm`. Vlevo ikona 🎭, vpravo × OFF (vypne mód i s vyprázdněním pole).
- Inputy: `Jméno NPC` (max 64), `Avatar URL` (URL pattern). Pokud avatar URL prošlo, vpravo se objeví **16×16 avatar náhled**.
- Pruh je **sticky napříč zprávami** — PJ obvykle píše víc replik za sebou. Vypne se buď klikem × OFF, nebo opětovným klikem na razítko 🎭.
- **Viditelný jen `PomocnyPJ+`.** Pro hráče razítko 🎭 vůbec nerenderuje — žádné lock-icon teasery.

**Render NPC zprávy v `MessageItem`:**
- Jméno = `overrideName`, ne `senderName`. Vedle něj **drobný badge `🎭`** (12px, title=„NPC napsal X"), pro PJ+ klikatelný → odkryje real `senderName` v tooltipu (transparency mechanism, ne tajné).
- Hráči vidí jen NPC identitu + tag. Nevědí, kdo PJ je. (BE už to ohlídá — `senderId` se ve výpisu neukazuje.)

---

## 7. RpDateBadge (6.2d)

Razítko 📅 v toolbaru → popover s `<input type="date">` + dvěma tlačítky `Zrušit` / `Použít`.

Po výběru se nad signature line objeví **chip** `📅 21. 4. 1453 ×`. Chip je v barvě kanálu (10% bg, plný text v `--ch-accent`).

**Render u zprávy** (`MessageItem`):
- Malý badge **nad jménem** odesílatele: `📅 21. 4. 1453` (`--text-xs`, monospace, `--theme-text-dim`, hover ukáže relative time „před 12 dny in-game" — ale to až s kalendářem světa).
- Záměrně nad jménem, ne vedle obsahu — datum je *kontext odehrání*, ne součást textu.
- U seskupených zpráv (`grouped` prop): datum se ukáže jen u první, pokud sousední zprávy mají stejné `rpDate`.

---

## 8. MessageEditInline (6.2c)

Klik na ✎ v `MessageItem.actions` → **swap obsahu zprávy za inline textareu**, ne modal. Discord-like.

```
─── Před edit ────────────────────────────────────────────
⏵ Franta · 14:32
Hod si na vnímání, je tam průvan.
[reply] [react] [edit]  [delete]

─── Během edit ───────────────────────────────────────────
⏵ Franta · 14:32 · (upravujete)
┌───────────────────────────────────────────────────┐
│ Hod si na vnímání, je tam průvan.█                │
└───────────────────────────────────────────────────┘
[ Uložit ]  [ Zrušit ]   esc · ↵ Enter k uložení
```

- Textarea = klon styling composeru (stejný `--font-body`, padding, focus ring v barvě kanálu).
- Auto-grow do 8 řádků, pak scroll.
- Enter (bez Shift) = uložit; Shift+Enter = nový řádek; Esc = zrušit.
- Uloží = volá `useEditMessage`, optimistic update (text se přepíše ihned + tag `(upraveno)` se schoval na 200 ms tak, aby se objevil až po BE confirmu).
- Tlačítka pod textareou, `--text-xs`, ne fancy — funkční ne dekorativní.
- **Dice zprávy:** ✎ se ani nezobrazí (FE check `!isDiceRoll`); BE má backup guard.

---

## 9. Optimistic chip (6.2h)

Tři stavy zprávy v UI: `sent` (default), `pending`, `failed`.

### Pending

- `MessageItem` dostane class `s.pending` → `opacity: 0.65` + **vlevo od jména `<span class="pendingDot">`** — 6px kruh v barvě kanálu, `@keyframes pulse` (1.2s, opacity 0.4 ↔ 1).
- Žádný spinner — pulz je decentnější.
- Zpráva je **klikatelná** jako jakákoli jiná (reply, react), ale akce čekají na real ID — UI optimisticky enable, mutace se posílá po swapu.

### Failed

```
─── failed ──────────────────────────────────────────────
⏵ Tvé jméno · 14:32
Hod si na vnímání, je tam průvan.    ← text v --theme-text-dim
─────────────────────────────────────────────────────────
⚠ Nepodařilo se odeslat.  [ Zkusit znovu ]  [ Smazat ]
─────────────────────────────────────────────────────────
```

- Border kolem zprávy: `1px solid --theme-error`, lehký bg tint `color-mix(--theme-error 6%, transparent)`.
- Pod zprávou **inline tooltip-pruh** s ⚠ + dvěma ghost tlačítky. Žádný toast.
- Zkusit znovu: retry stejným `clientNonce` → BE idempotentní.
- Smazat: vyhodí zprávu z optimistic cache. Nikam se neposílá.

### Sent (po swap)

- Pulz a tint zmizí přechodem `opacity 200ms ease-out`. Žádný flash.

---

## 10. Skin-hook strategie (6.2 nadstavba)

Composer a popovery konzumují **jen `--theme-*`** + **`--ch-accent`** (nit kanálu, propagována z 6.1).

Nové opt-in proměnné, které per-skin `decorations.css` může naplnit (fallback v chat modulu):

| Proměnná | Co | Fallback |
|---|---|---|
| `--chat-composer-paper` | textura/obrázek pozadí composeru („papír depeše") | `none` |
| `--chat-stamp-glyph` | ikona razítka místo `lucide` 🎭 (per-žánrový SVG mask) | `lucide Theater` |
| `--chat-signature-pen` | textura signature line (např. inkoust pro fantasy) | lineární gradient |
| `--chat-mention-style` | jiný highlight pro mention chip | bg tint |
| `--chat-npc-mask-icon` | per-skin maska NPC ikony | `lucide Theater` |

⚠️ Obrázkové ornamenty per žánr **dodá autor na vyžádání**. Bez nich chat běží na token-level skinu — funkční ve všech 12 žánrech od první commit. Žádný edit `[data-theme]` scope (memory `feedback_theme_isolation`), žádná recyklace mezi žánry (memory `feedback_skin_originality`).

---

## 11. Motion (6.2 nadstavba)

Navazuje na 6.1 motion budget. Nové animace:

| Akce | Animace | Duration | Easing |
|---|---|---|---|
| Reply card vsune | `translateY(-4px) → 0` + opacity 0 → 1 | 120 ms | `ease-out` |
| NPC pruh rozbalí | `max-height` 0 → auto + opacity | 160 ms | `ease-out` |
| Mention autocomplete | `translateY(4px) → 0` + opacity | 100 ms | `ease-out` |
| Vzhled popover (desktop) | scale 0.96 → 1 + opacity | 140 ms | `ease-out` |
| Vzhled bottom-sheet (mobil) | `translateY(100%) → 0` | 200 ms | `cubic-bezier(.2,.8,.2,1)` |
| Optimistic pulse | opacity 0.4 ↔ 1 | 1.2 s loop | `ease-in-out` |
| Failed border in | border-color transition + scale 1.005 → 1 (subtle) | 180 ms | `ease-out` |
| Signature line aktivace | color transition (border) | 200 ms | `ease-out` |
| Edit textarea swap | crossfade content ↔ textarea 80 ms | 80 ms | `ease-out` |

Vše respektuje `prefers-reduced-motion` (`reducedMotion` skin flag — pulse → solid, transitions → instant).

---

## 12. Mobil (< 768px) — finální composer layout

```
┌──────────────────────────────────────────┐
│ ↩ Franta: „Hod si na vnímání…"        × │  ← reply (jen když je)
├──────────────────────────────────────────┤
│ 📎  🎭  📅  🎨  @       📅 1453-04-21  │  ← toolbar + chip wrap pod
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │ Napiš depeši…                        │ │
│ └──────────────────────────────────────┘ │
├──────────────────────────────────────────┤
│ ──────────────────────────  [ ▸ ]       │  ← send fab
│ NPC: Krčmář · → franta                   │
└──────────────────────────────────────────┘
       safe-area-inset-bottom
```

- Razítka 5 × 32px + gap 8 = 192px → vejde se i na 360px viewport.
- Popovery (vzhled, mention, NPC pruh expand) jdou full-width od spodu jako bottom-sheet.
- Inline edit textarea: stejná logika jako desktop, žádná full-screen modalita.

---

## 13. Co tento audit **nevyřešil** (k dořešení v plánu)

- Konkrétní `--ch-accent` výpočet z barvy kanálu — propagováno z 6.1 CSS proměnnou na úrovni `ChannelView` root (`style={{ '--ch-accent': accentColor }}`), reuse beze změny.
- Konkrétní whitelist Google Fonts URL s `latin-ext` subsetem — vyřeší se v `plan-6.2.md` u `index.html` injecton.
- `MessageItem` rozšíření o props (`customFont`, `mentions`, `_status`, `rpDate`) — kompletní soupis přijde do plánu.
- Klávesové zkratky composeru (Ctrl/⌘+B bold? — out of scope, raději ne, abychom neduplikovali markdown editor logic).

---

## 14. Seznam assetů k dodání autorem (per žánr, volitelné)

Audit doporučuje token-level + CSS-only ornamenty jako základ pro všech 12 skinů. Bohatší žánrová grafika je opt-in:

- **`--chat-composer-paper`** — textura papíru/povrchu (bezešvá, ~512×512, webp/png).
- **`--chat-stamp-glyph`** — SVG masky pro razítka 📎🎭📅🎨@ (žánrově laděné, např. pečeť pro středověký svět, holo-ikona pro cyberpunk).
- **`--chat-signature-pen`** — textura signature line (inkoustová stopa, neon trace, drátěné).
- **`--chat-npc-mask-icon`** — alternativní maska místo lucide Theater (kapuce, kybernetická maska, hlava ducha…).

Bez assetů: composer je čistý token-level skin — funkční ve všech 12 žánrech, jen bez rastrových textur.

---

**Po schválení design auditu:** implementační plán `plan-6.2.md` (CLI / file diff pro FE i BE).
