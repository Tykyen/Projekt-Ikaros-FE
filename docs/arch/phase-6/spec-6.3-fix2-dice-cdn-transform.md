# Spec + plán 6.3-fix2 — Cloudinary transformace textur kostek

**Status:** ✅ Implementováno (2026-06-15) — `cdnSized` helper na 6 místech; build ✓, dice testy 89/89 ✓, reálně 74→11 KB (6,7×)
**Rozsah:** FE only — zmenšení přenosu textur kostek přes cloudinary on-the-fly transformaci
**Dluh:** `D-NEW-dice-cdn-transform`
**Autor:** PJ + Claude · 2026-06-15

> Cíl: hráč při hodu nestahuje plné 1024px textury. Ověřeno: `w_160,f_auto,q_auto` → **74 KB → 4,4 KB (17×)**, on-the-fly, bez re-uploadu.

## 1. Problém

Textury na cloudinary jsou 1024×1024 (⌀259 KB webp), URL v [diceSkins.ts](../../../src/features/world/chat/dice/lib/diceSkins.ts) jsou přímé bez transformace. Kostka se zobrazuje ~80–140 px → hráč stahuje ~7–13× víc dat, než vidí. Hod 4 kostkami ≈ 300 KB místo ~20 KB.

## 2. Řešení

Runtime helper, který do cloudinary URL vloží transformační segment při čtení (URL v `diceSkins.ts` zůstanou čisté → snadná změna velikosti, žádné přegenerování).

```ts
// lib/cdnImage.ts
cdnSized(url, width = 320) → vloží `w_${width},f_auto,q_auto/` za `/image/upload/`
```

- **Jen cloudinary `/image/upload/` URL.** Lokální `/textures/` a cokoli jiného vrátí beze změny.
- **Idempotentní** — když segment už je (URL nezačíná `v<digit>` po `/upload/`), nevkládá.
- `f_auto` = webp/avif dle prohlížeče, `q_auto` = automatická komprese.

### Velikost: jednotná `w_320`
Jedna šířka pro všechna místa (ne per kontext), aby **preload == render** (jinak preloader přednačte jinou velikost než render → zbytečné stažení 2×). `w_320` pokryje největší kostku (overlay ~140 px i na 2× retina = 280 < 320). Picker dostane taky 320 (mírně víc, ale konzistence preloadu > úspora pár KB). Odhad ~8–12 KB/tvář (z 259 KB).

## 3. Místa aplikace (6)

| Soubor | Kde |
|---|---|
| `models/DieFaceTexture.tsx` | `src` → `cdnSized(src)` (pokryje všech 8 modelů) |
| `components/RollingDiceScene.tsx` | `SettledDieFace` — `pickFaceImg(...)` výsledek |
| `components/DiceRollOverlay.tsx` | `fateImgSrc` (facePlus/Minus/Blank) |
| `components/SkinPickerPanel.tsx` | `pickRepresentativeImg(...)` náhled |
| `components/DicePickerPopover.tsx` | `pickRepresentativeImg(...)` náhled |
| `lib/texturePreloader.ts` | `preloadOne(cdnSized(url))` — shoda s renderem |

## 4. Kroky

1. `lib/cdnImage.ts` — `cdnSized(url?, width=320)` (~20 ř.).
2. `lib/cdnImage.spec.ts` — vkládá segment / idempotence / lokální `/textures/` beze změny / `undefined` projde / non-cloudinary beze změny.
3. Obalit 6 míst výše.
4. Ověření: `npm run build` ✓, `npx vitest run cdnImage` ✓, eslint ✓.
5. Manuální: hod kostkou → Network tab ukáže ~8–12 KB místo ~259 KB; kostka vypadá stejně.

## 5. Mimo rozsah / pozn.

- **Build-time přepis URL** (`rewrite-dice-skins-urls.mjs`) — nezvoleno; runtime helper je flexibilnější a nezašpiní `diceSkins.ts`.
- **73 PNG → webp** (`d20_nat_*`, `und_ghost`) — `f_auto` je stejně doručí jako webp/avif, takže přenos je vyřešen i tak; fyzická konverze zdrojů zůstává drobný dluh.
- `dpr_auto` nepoužito (závisí na Client Hints) — `w_320` pevně, jistota.

## Rizika
- Helper rozbije ne-cloudinary URL → test (lokální `/textures/` + `undefined`) hlídá.
- Picker by chtěl menší náhled než 320 → vědomě jednotně kvůli preload shodě; rozdíl pár KB.
