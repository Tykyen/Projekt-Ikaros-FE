# Implementační plán — krok X.Y <název>

**Datum:** YYYY-MM-DD
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-X.Y.md`](./spec-X.Y.md)
**Větev:** `feat/krok-X.Y-<slug>` (vytvořím při startu)

---

## Postup po krocích

### Step 1 — <název>

**Soubory:**
- `<cesta>` — <popis změny>

**Příkaz:**
```bash
<přesný shell command>
```

**Acceptance kroku:** <co ověřit, než pokračovat>

---

### Step 2 — …

---

## Závěrečný checklist

- [ ] Build prochází (`npm run build`)
- [ ] Lint prochází (`npm run lint`)
- [ ] Testy prochází (`npm run test:run`)
- [ ] Smoke test: <konkrétní scénář>
- [ ] `dluhy.md` aktualizováno (pokud relevantní)
- [ ] Commit message dle konvence (krátký subjekt + body)

---

## Commit strategie

Per-step samostatný commit (nebo 1 commit per logický celek). Každý commit samostatně revertovatelný.
