# Plan 6.3 — Hod kostkou ve světovém chatu

**Status:** 🟡 Návrh k odsouhlasení
**Spec:** [spec-6.3.md](spec-6.3.md) (v2 — 3D rolling)
**Design:** [design-6.3.md](design-6.3.md) (v2)
**Datum:** 2026-05-20
**Pořadí etap:** P1 → P2 → P3 → P4 → P5 → P6 → P7. Etapy P1–P2 musí být commitnuté předtím, než FE začne (BE musí vrátit nová pole). P3–P6 lze paralelizovat uvnitř, jak je vyznačeno. P7 = uzávěr.

---

## Etapa P1 — BE schema + DTO (~80 ř.)

Aditivní změny, žádná data migration. **Začátek.**

### Soubory

| Soubor | Změna |
|---|---|
| `backend/src/modules/worlds/schemas/world-membership.schema.ts` | + `@Prop({ type: Object, default: null }) diceSkinMapping: Record<string, string> \| null;` |
| `backend/src/modules/worlds/interfaces/world-membership.interface.ts` | + `diceSkinMapping: Record<string, string> \| null;` |
| `backend/src/modules/worlds/repositories/world-membership.repository.ts` | `toEntity` mapper přidat `diceSkinMapping` |
| `backend/src/modules/chat/schemas/chat-message.schema.ts` | + `@Prop({ type: Object, default: null }) dicePayload: Record<string, unknown> \| null;` + `@Prop({ type: String, default: null }) diceSkin: string \| null;` |
| `backend/src/modules/chat/interfaces/chat-message.interface.ts` | + `dicePayload`, `diceSkin` |
| `backend/src/modules/chat/repositories/chat-message.repository.ts` | `toEntity` mapper přidat obě pole |
| `backend/src/modules/chat/dto/create-message.dto.ts` | + `@IsOptional() @IsObject() dicePayload?: Record<string, unknown>;` + `@IsOptional() @IsString() @MaxLength(64) diceSkin?: string;` |
| `backend/src/modules/chat/dto/update-appearance.dto.ts` | + `@IsOptional() @IsObject() diceSkinMapping?: Record<string, string> \| null;` |

### Checklist
- [ ] Memory `project_chat_channel_field_checklist` — projít všech 5 míst.
- [ ] `npm run typecheck` (BE) zelený.

---

## Etapa P2 — BE service + tests (~170 ř.)

### Soubory

| Soubor | Změna |
|---|---|
| `backend/src/modules/chat/chat.service.ts` | `sendMessage`: rozšířit `isDiceRoll` derivaci → `isDiceRoll = !!dto.dicePayload \|\| (dto.content ? DICE_REGEX.test(...) : false)`. Whitelistnout `dicePayload` + `diceSkin` do `messageRepo.save()`. |
| `backend/src/modules/worlds/world-membership.service.ts` | `updateAppearance` rozšířit o `diceSkinMapping` (analogicky `chatColor`). |
| `backend/src/modules/chat/chat.service.spec.ts` | + test 1: `sendMessage` s `dicePayload` → `isDiceRoll === true` bez ohledu na content regex. + test 2: pole `dicePayload` a `diceSkin` propagují do uložené zprávy. |
| `backend/src/modules/worlds/world-membership.service.spec.ts` | + test pro `diceSkinMapping` persist přes `updateAppearance`. |

### Checklist
- [ ] Klientské `isDiceRoll` v body **zůstává ignorováno** (jako 6.2 whitelist princip — test už existuje).
- [ ] `npm run test` (BE) zelený.

---

## Etapa P3 — FE: roll engine + lib (~600 ř., bez UI)

Možno commitnout jako samostatný foundation PR (otestováno jednotkovými testy).

### Soubory

| Soubor | Obsah |
|---|---|
| `src/features/world/chat/dice/lib/rollEngine.ts` | Port `C:/Matrix/Matrix/frontend/src/utils/diceHelpers.ts` 1:1. API: `roll(type, opts) → RollResult`. Pokrývá Fate, generic, pool, mixed, d100. Včetně `getOverpressureFromRollTotal` (Přetlak). |
| `src/features/world/chat/dice/lib/rollEngine.spec.ts` | Seedovaný `Math.random` mock. Testy: Fate 4 hody z {−1,0,1}; d20 v [1,20]; pool-d6 count 3; mixed counts; d100 tens/ones range; Přetlak mapping. |
| `src/features/world/chat/dice/lib/formatMessage.ts` | `formatRollMessage(r)` → string ve formátu `Hod Kostkou (3d6): [2,4,1] = +7` (BE regex compatible). Včetně `formatFateMessage` a `formatGenericDiceMessage`. |
| `src/features/world/chat/dice/lib/diceSkins.ts` | Port `C:/Matrix/Matrix/frontend/src/components/Map/Dice/fateDiceSkins.ts` 1:1. ~30 skinů v 5 kategoriích. Export `FATE_DICE_SKINS`, `getSkinsByCategory()`, `CATEGORY_LABELS`. |
| `src/features/world/chat/dice/lib/diceTargets.ts` | Port `DiceLogic.ts` TARGETS arrays (D4/D6/D8/D10/D12/D20, FATE_TARGETS). |
| `src/features/world/chat/dice/lib/texturePreloader.ts` | Port `diceTexturePreloader.ts`. `preloadSkin(skinId)`, idempotentní. |
| `src/features/world/chat/dice/lib/dicePayload.ts` | TS typy `DicePayload` (Fate / Generic / Pool / Mixed / D100 — discriminated union). `buildDicePayload(result): DicePayload`. `parseDicePayload(raw): DicePayload \| null` (defensive). |
| `src/features/world/chat/dice/lib/worldDiceCatalog.ts` | Mapování `World.dice` klíčů → labels + glyphy. Const `DICE_CATALOG: Record<string, { label: string; glyph: string; }>`. |
| `src/features/world/chat/dice/lib/isFreshRoll.ts` | `isFreshRoll(createdAt: string \| Date, windowMs = 5000): boolean`. |

### Závislosti
Žádné nové npm deps v této etapě.

### Checklist
- [ ] `npm run typecheck` zelený.
- [ ] `npm run test -- rollEngine` zelený.

---

## Etapa P4 — FE: 3D scéna + dependencies (~900 ř.)

### Dependencies

```bash
npm install three @react-three/fiber
npm install -D @types/three
```

(`@react-three/drei` se zatím nezahrnuje — neporebujeme orbit controls / shadows controllery. Pokud při portu modelů zjistím že drei je nutný, doplním.)

### Soubory

| Soubor | Obsah |
|---|---|
| `src/features/world/chat/dice/components/models/D4Model.tsx` | Port `C:/Matrix/Matrix/frontend/src/components/Map/Dice/models/D4Model.tsx`. |
| `src/features/world/chat/dice/components/models/D6Model.tsx` | Port. |
| `src/features/world/chat/dice/components/models/D8Model.tsx` | Port. |
| `src/features/world/chat/dice/components/models/D10Model.tsx` | Port. |
| `src/features/world/chat/dice/components/models/D12Model.tsx` | Port. |
| `src/features/world/chat/dice/components/models/D20Model.tsx` | Port. |
| `src/features/world/chat/dice/components/models/D100TensModel.tsx` | Port. |
| `src/features/world/chat/dice/components/models/FateModel.tsx` | Port. |
| `src/features/world/chat/dice/components/models/FateSkinModel.tsx` | Port. |
| `src/features/world/chat/dice/components/RollingDiceScene.tsx` | NOVÉ — orchestrace rolling animace (extrakt z `DiceOverlay.tsx`). Drží stav per-kostka (`rolling` → `settling` → `settled` + glow flash). |
| `src/features/world/chat/dice/components/DiceMessageScene.tsx` | NOVÉ — 3D Canvas pro inline render hodu v `DiceMessage`. Props: `{ payload, skin, phase }`. Volá `<RollingDiceScene>`. |
| `src/features/world/chat/dice/components/DiceMessageScene.lazy.tsx` | `export default React.lazy(() => import('./DiceMessageScene'))`. |
| `src/features/world/chat/dice/components/DiceMessageFallback.tsx` | Statický 2D fallback (port původního 2D `DieFace` z první verze designu). |
| `public/textures/` | Skopírovat ~1820 souborů z `C:/Matrix/Matrix/frontend/public/textures/` (PowerShell `Copy-Item -Recurse`). |

### Checklist
- [ ] `npm run build` projde — `three` chunk je oddělený (sledovat ve výstupu vite buildu).
- [ ] Demo isolated test page (volitelné, ad-hoc) — vykreslit dummy hod a vizuálně ověřit.
- [ ] Reduced-motion fork ošetřen v `DiceMessageScene` (`phase === 'settled'` enforced).

---

## Etapa P5 — FE: picker UI (~500 ř.)

Závisí na P3 (engine + skins data).

### Soubory

| Soubor | Obsah |
|---|---|
| `src/features/world/chat/dice/components/DiceButton.tsx` | 🎲 razítko 32×32 v toolbaru composeru. Aktivní state = popover open. |
| `src/features/world/chat/dice/components/DicePickerPopover.tsx` | Popover s rychlými typy kostek (filtr `World.dice`) + Pool/Mixed links + Popis/Mod inputs + Skin link. Prázdný stav „PJ nedovolil kostky" + CTA pro PJ. |
| `src/features/world/chat/dice/components/DicePickerPopover.module.css` | Styly (port relevantní části z `fateDiceSkins.scss`). |
| `src/features/world/chat/dice/components/PoolPromptModal.tsx` | Modal s grid 3×3 karet typu kostky + steppery. Filtrace `World.dice`. CTA „Hodit ▸". |
| `src/features/world/chat/dice/components/PoolPromptModal.module.css` | Styly. |
| `src/features/world/chat/components/ChannelComposer.tsx` | ROZŠÍŘENO — přidat `<DiceButton>` do toolbaru. Mobil overflow `⋮` menu pro NPC/datum/vzhled (rozhodnutí PJ). |

### Checklist
- [ ] Klik na rychlý typ kostky volá `roll()` → `formatRollMessage` → `useOptimisticSend` (6.2h). Send DTO obsahuje `dicePayload` + `diceSkin` + `content` + `clientNonce`.
- [ ] Pool modal disabled při total = 0.
- [ ] Prázdný stav `World.dice = []` → CTA „Otevřít nastavení světa" jen pro PJ/Pomocný PJ.

---

## Etapa P6 — FE: DiceMessage + SkinPickerPanel (~700 ř.)

Závisí na P3 + P4.

### Soubory

| Soubor | Obsah |
|---|---|
| `src/features/world/chat/dice/components/DiceMessage.tsx` | Wrapper s Suspense + lazy `DiceMessageScene`. Renderuje label chip, total box, subtitle (součet + Přetlak), kontextové menu. |
| `src/features/world/chat/dice/components/DiceMessage.module.css` | Styly tabulky výpočtu (background, levá nit, label chip, total box, subtitle, signature pečeť). |
| `src/features/world/chat/dice/components/SkinPickerPanel.tsx` | Modal kategorie + grid skin karet s 3D cube náhledem. Jeden sdílený Canvas přes celou kategorii. Per-typ-kostky chips na vrchu. |
| `src/features/world/chat/dice/components/SkinPickerPanel.module.css` | Styly (port relevantní části z `fateDiceSkins.scss`). |
| `src/features/world/chat/dice/api/useDiceSkinMapping.ts` | Hook nad `useMembershipAppearance` (6.2f). Vrací `{ mapping, getSkin(type), setSkin(type, skinId) }`. Default fallback = `core-obsidian`. |
| `src/features/world/chat/api/useMembershipAppearance.ts` | ROZŠÍŘENO — `diceSkinMapping` v GET odpovědi + PATCH payloadu. |
| `src/features/chat/components/MessageItem.tsx` | ROZŠÍŘENO — větev `if (message.isDiceRoll && message.dicePayload) return <DiceMessage ... />;`. Skrýt ✎ pro dice. Skrýt 🗑 pro non-PJ/Admin u dice. |
| `src/features/world/chat/pages/WorldChatPage.tsx` | ROZŠÍŘENO — `useEffect` s `requestIdleCallback` preload `DiceMessageScene` chunk. |

### Checklist
- [ ] Čerstvý hod (`isFreshRoll === true`) → `phase = 'rolling'`. Po 5 s + refreshu vidí jen settled.
- [ ] Reduced motion → `phase = 'settled'` enforced.
- [ ] Pravý klik / long-press na 3D kostku → kontextové menu „Změnit skin pro k20…" / „Kopírovat výsledek".
- [ ] Legacy dice zpráva (bez `dicePayload`) → fallback monospace text, žádný crash.

---

## Etapa P7 — Audit, dokumentace, uzávěr

### Checklist

- [ ] `mobil-desktop` skill audit (3 breakpointy: ≤ 768, 769–1024, > 1024).
- [ ] `napoveda` skill update — stránka chatu doplnit sekci „Hod kostkou" (`/ikaros/napoveda`).
- [ ] `dluhy.md` — zaregistrovat nové dluhy:
  - `D-NEW-dice-jail` — vězení skinů (bonus).
  - `D-NEW-dice-default-set` — default `World.dice` pro nový svět.
  - `D-NEW-dice-texture-trim` — trim nepoužitých textur.
  - `D-NEW-dice-secure-rng` — crypto random.
- [ ] `roadmap-fe.md` — zaškrtnout 6.3 položky + ⏰ datum dokončení.
- [ ] Bundle size check: `npm run build` → `three` chunk by neměl být v iniciálním bundlu. Velikost iniciálního bundlu nesmí narůst víc než ~5 KB (jen wrapper code).
- [ ] Commit per etapa (P1 → P2 → P3 → P4 → P5 → P6 → P7) přímo na `main` (memory `feedback_work_on_main`).

---

## Risk register

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| 3D modely ze starého Matrixu (`@react-three/fiber`) jsou pro starší verzi knihovny → API breaking changes | Střední | Velký | Port + okamžitý `npm run typecheck`. Pokud TS breaking, upravit lokálně. Nelze odhadnout dokud port nezačne. |
| 1820 textur kopírovat — velký disk overhead | Nízká | Malý | `Copy-Item -Recurse` jednorázový; `.gitignore` zvážit u opravdu nepoužitých později (dluh). |
| Lazy chunk se v produkci načte pomalu (Vercel CDN region) | Nízká | Střední | Preload v `WorldChatPage` mount idle = chunk hotov před prvním dice msg. |
| `prefers-reduced-motion` user otevře dice msg → Suspense fallback blikne. | Střední | Malý | Static fallback je „good enough" pro reduced motion; designovaný stav. |
| `dicePayload` strukturně nevalidovaný → klient pošle nesmysl | Nízká | Malý | FE `parseDicePayload` defensive (fallback na text content render). Žádný crash. |
| WebGL nedostupné (starý prohlížeč) | Velmi nízká | Malý | Statický 2D fallback při try/catch v `DiceMessageScene`. |
| Per-typ skin mapping přidá UX složitost (uživatel si nezvládne přepnout) | Střední | Střední | „Výchozí" chip první (= fallback pro vše); user nemusí lézt do per-typ pokud nechce. Stejné UX jako starý Matrix. |

---

## Velikost (aktualizovaný odhad)

| Etapa | Soubory | Řádky | Závisí na |
|---|---|---|---|
| P1 — BE schema | 8 | ~80 | — |
| P2 — BE service + tests | 4 | ~170 | P1 |
| P3 — FE lib | 9 | ~600 | — (paralelně s P1/P2) |
| P4 — FE 3D scéna + deps | 13 + 1820 textur | ~900 | P3 |
| P5 — FE picker | 6 | ~500 | P3 (částečně paralelně s P4) |
| P6 — FE DiceMessage + Skin | 9 | ~700 | P3 + P4 |
| P7 — Audit + uzávěr | — | — | P1–P6 |
| **Celkem** | **~50 souborů + 1820 textur** | **~2950 ř.** | — |

---

## Otevřené body

Žádné. Spec § 8 + design § 12 + řízení rozsahu v § 7 specu uzavřely všechna rozhodnutí.

---

**Po schválení tohoto plánu** spustím etapy P1 → P7 v pořadí. Každá etapa = samostatný commit na `main`.
