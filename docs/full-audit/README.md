# Plný audit — orchestrátor 16 auditních stylů

> Skill: [`.claude/skills/plny-audit/SKILL.md`](../../.claude/skills/plny-audit/SKILL.md) · spustíš
> `/plny-audit` nebo „spusť plný audit".

Tahle složka je **výstupní prostor** skillu „plný audit". Skill sám 16 auditů nevymýšlí — věrně přehraje
metodiky z `docs/*-plan/` proti aktuálnímu kódu, paralelizuje detekci přes sub-agenty, hlídá coverage
drift a 16. auditem (anti-regression) zkontroluje, že je vše v pořádku.

## Obsah složky

| Soubor | Co je |
|---|---|
| `coverage-baseline.json` | uložený census povrchu kódu (kolekce, listenery, query-keys, …). Diff proti němu = „co kód přerostl od minule". Aktualizuj `npm run audit:census -- --update-baseline`. |
| `RUN-<datum>/` | výstup jednoho běhu skillu — `report.md` + `scanners/`. Historii registrů `docs/*-audit.md` skill nepřepisuje. |

## Census — detekce růstu (samostatně spustitelné)

```
npm run audit:census                      # čitelný přehled povrchu + drift vs baseline
npm run audit:census -- --json            # strojově (skill parsuje)
npm run audit:census -- --update-baseline # ulož aktuální stav jako nový baseline
npm run audit:census -- --ci              # exit 1, když SWEEP audit přerostl (drift guard)
```

💡 **Proč census:** scannery (`audit:routes/ws/nav/config/errors/logs`) vyjmenují živý povrch každý běh,
takže se rozšiřují samy. Manuální sweepy (db-integrity, cascade, state, cache, form-schema, upload) mají
ale v plánech **zamrzlou inventuru** — census je jediné, co chytí, že je kód přerostl, a nasměruje, kde
rozšířit kontrolu.

## Vztah k anti-regression (16. audit)

- `audit:census` → roste **povrch** (přibyl kód, který audit nezná)?
- `audit:regression` → drží **pojistky** (má každý opravený nález živý guard G≥2)?

Dvě osy téhož: census hlídá *šířku* pokrytí, regrese *hloubku/trvanlivost*. Skill pouští obě.
