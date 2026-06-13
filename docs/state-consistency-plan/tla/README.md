# L8 — Formální model protokolů (TLA+)

> Nejhlubší vrstva [state-consistency auditu](../README.md). Protokol real-time konzistence popsaný
> jako matematika; nástroj **TLC** exhaustivně projde **všechna možná prokládání** akcí (i ta zrůdná
> reconnect interleavingy, na která člověk nepomyslí) a buď dokáže invariant, nebo vyplivne konkrétní
> protisekvenci, kde se rozbije.

📚 **Co je TLA+:** formální specifikační jazyk (Leslie Lamport). Systém = počáteční stav `Init` +
povolené přechody `Next` + invarianty, které musí platit pořád. TLC = model checker, který prohledá
celý (ohraničený) stavový prostor.

---

## ⚠️ Jediné pravidlo, bez kterého je tahle vrstva k ničemu

**TLA+ verifikuje MODEL, ne běžící kód.** Když se spec rozejde s realitou (Socket.IO, TanStack cache,
BE gateway), dostaneš zelené „verified" na fikci — **horší než žádná verifikace**, protože dává falešný
klid. Proto u nás L8 **není koncová stanice**, ale generátor pravidel pro L7:

```
   TLA+ spec (L8)                fast-check property test (L7)         reálné hooky (kód)
  ┌──────────────┐   invariant  ┌────────────────────────┐  vynucuje ┌──────────────────┐
  │ Convergence  │ ───────────▶ │ ∀ sekvence: stav==server│ ────────▶│ useMapSocket,     │
  │ Safety       │  protipříklad│ (generátor hází akce)   │  na kódu  │ refetch-on-recon. │
  └──────────────┘ ───────────▶ └────────────────────────┘           └──────────────────┘
        důkaz na modelu              empirie na kódu                    skutečné chování
```

**Smyčka:** každý invariant a každý protipříklad z TLC se přepíše do property-based testu proti reálným
hookům. Model navrhuje pravidla → kód je musí splnit → drží i po refactoru. Bez téhle smyčky TLA+ nepiš.

---

## Protokol A — `MapReconnect` (reconnect gap recovery, osa RJ)

První a nejdůležitější modelovaný protokol: konverguje klientův stav mapy zpět k serveru po výpadku?

- [`MapReconnect.tla`](MapReconnect.tla) — model 1 klient × server, akce `ServerOp / Deliver / Disconnect / Reconnect`, přepínač `RefetchOnReconnect`.
- [`MapReconnect.cfg`](MapReconnect.cfg) — TLC config, `MaxOps = 3`.

**Co spec dokazuje (a proč je to cenné):** spustíš TLC dvakrát —

| `RefetchOnReconnect` | Výsledek TLC | Význam |
|---|---|---|
| `FALSE` | ❌ `Invariant Convergence is violated` + trace | `ServerOp → Disconnect (gap) → Reconnect bez refetch` → klient navždy pozadu = **tichá divergence** |
| `TRUE` | ✅ Safety + Convergence + Liveness drží | refetch-on-reconnect je **nutná** podmínka konvergence |

> **✅ Ověřeno během 2026-06-13** (TLC 2.19, Java 8):
> - `FALSE` → `Convergence is violated`, protisekvence ve **4 krocích** (12 stavů, 1 s):
>   `init → ServerOp(s=1,inflight=1) → Disconnect(inflight zahozen) → Reconnect(c=0 ≠ s=1)`.
> - `TRUE` → `No error has been found`, **20 stavů**, depth 6, vč. temporal `Liveness`, exit 0.

💡 Rozdíl mezi těmi dvěma běhy **je** formální důkaz, že reconnect potřebuje refetch — přesně oprava
pro [K-S3 / K-S4 / K-S9](../../state-consistency-audit.md). Není to názor; je to vyčerpané prohledání
stavového prostoru.

### Jak spustit

```bash
# potřebuje tla2tools.jar (TLA+ Toolbox) nebo `brew install tla-plus` / nix
java -cp tla2tools.jar tlc2.TLC -config MapReconnect.cfg MapReconnect.tla
# pak přepiš RefetchOnReconnect na TRUE v .cfg a spusť znovu
```

---

## Traceability: invariant → L7 test → kód

> Tahle tabulka je **smlouva** mezi modelem a kódem. Sweep ji plní: ke každému invariantu dopíše L7
> property test a ověří, že reálné hooky pravidlo splňují.

| TLA+ invariant | Co tvrdí | L7 property test (fast-check) | Cílové hooky (kód) | Stav |
|---|---|---|---|---|
| `Safety` | klient nikdy nepředběhne server | po náhodné sekvenci nikdy `clientSeq > serverSeq` | useMapSocket apply, optimistic token | model ✅ (TLC) · L7 ⬜ |
| `Convergence` | v klidu klient == server | po sekvenci s disconnecty: po reconnectu+ustálení `clientSeq == serverSeq` | useMapSocket + reconnect refetch | model ✅ (TLC) · L7 ⬜ |
| `Liveness` | stav se nakonec vždy sblíží | žádný dosažitelný stav, kde klient zůstane trvale pozadu | reconnect handler (re-join + refetch) | model ✅ (TLC) · L7 ⬜ |

> Verdikt z modelu (FALSE→divergence) říká: hooky **bez refetch-on-reconnect** invariant poruší. Sweep
> oblasti 06–09 to ověří na reálných hoocích a `RJ` nálezy [`S-xx`](../../state-consistency-audit.md)
> z toho přímo vyplynou.

---

## Další kandidáti na L8 (až po protokolu A)

- **B) `ChatDedup`** — optimistic send + WS echo: invariant „každá zpráva právě jednou" (uniqueness přes `clientNonce`/`m.id`), ordering. Osa `CV`.
- **C) `AccountTransfer`** — exactly-once finanční semantika: invariant „součet zůstatků konstantní", „žádný transfer dvakrát". Osa `RJ`+`CV`.

> Modelovat **až když protokol A projde celou smyčku L8→L7**. Ne plošně — TLA+ má smysl jen tam, kde je
> distribuovaný konsensus-like problém, ne na každém listeneru.
