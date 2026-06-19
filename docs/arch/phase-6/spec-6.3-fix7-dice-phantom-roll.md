# Spec 6.3-fix7 — Přízračná kostka „1" po hodu (3D overlay zhasínání)

**Status:** 🟢 Implementováno 2026-06-19 (čeká ověření na živém hodu)
**Rozsah:** FE only — 3D dice overlay render-timing
**Repo:** `Projekt-ikaros-FE`
**Autor:** PJ + Claude · 2026-06-19
**Souvisí:** [spec-6.3-fix5](spec-6.3-fix5-dice-ghost-warmup.md) (warmup/ghost), [spec-6.3-fix4](spec-6.3-fix4-real-3d-dice.md)

> Cíl: po hodu se v chatu/mapě nesmí náhodně objevit cizí 3D kostka s hodnotou „1".

---

## 1. Problém

Po hodu se **čas od času** uprostřed obrazovky objeví malá 3D kostka s **„1"**, která tam nepatří (nahlášeno uživatelem, chat).

## 2. Root cause (ověřeno čtením kódu)

Race při zhasínání 3D overlaye ([DiceRollOverlay.tsx](../../../src/features/world/chat/dice/components/DiceRollOverlay.tsx)). Když hod dokončí a `roll → null`:

- `nonce` spadne na `0` (`roll?.timestamp ?? 0`),
- `notation` spadne na default `'1d6@1'` (`notation ?? '1d6@1'`),
- `active` je **ještě jeden render `true`** — `phase` se přepne na `'idle'` až v effectu o render později (React async stav).

Změna `nonce` (T→0) spustí effect v [DiceBox3D.tsx](../../../src/features/world/chat/dice/components/DiceBox3D.tsx) → `rollNow()`; ten v tom mezi-renderu vidí `active=true` + `notation='1d6@1'` → **hodí přízračnou kostku „1"**. Pre-existující (před fix5/fix6), jen teď viditelné.

## 3. Řešení

`nonce === 0` je sentinel „není co házet". V hodovém effectu `DiceBox3D` ho respektovat — neházet při zhasínání overlaye. Reálný hod má vždy `nonce = timestamp > 0`; warmup ghost běží na `ready` (ne na `nonce`), takže není dotčen.

```ts
if (warmup && !active && !ghostDoneRef.current) { runGhostRoll(); return; }
if (nonce === 0) return;   // ← fix7
rollNow();
```

## 4. Akceptační kritéria

- [ ] Po hodu (chat i mapa) se neobjeví žádná cizí kostka „1". _(ověřit na živo, opakovaně)_
- [x] Reálný hod proběhne normálně (nonce = timestamp > 0).
- [x] Warmup ghost (fix5) nedotčen (běží na `ready`).
- [x] `tsc -b` zelený; dice + map hook testy zelené (112/112).

## 5. Implementace

- [DiceBox3D.tsx](../../../src/features/world/chat/dice/components/DiceBox3D.tsx) — `if (nonce === 0) return;` v hodovém effectu `[ready, nonce]`.
