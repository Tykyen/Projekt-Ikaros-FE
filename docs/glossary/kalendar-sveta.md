---
name: kalendar-sveta
aliases: [calendar, kalendář, world calendar, kalendář světa, calendar preset]
category: herni-mechaniky
related: [[herni-cas], [generator-pocasi], [casova-osa], [herni-akce]]
status: draft
---

# Kalendář světa

**TL;DR:** Konfigurovatelný fantasy/historický kalendář světa — měsíce, dny, sezóny, nebeská tělesa; vychází z presetu (gregoriánský, juliánský, egyptský…).

## Detail

Kalendář definuje strukturu času světa: počet a názvy měsíců, dny v týdnu, sezóny, měsíční fáze. Presety jsou ve FE (~14 typů), kalibrace je deterministická. Volitelně lze zapnout pravidlo přestupných roků (leap year rule engine).

Kalendář je oddělený od:
- aktuálního [[herni-cas|herního data]] (to je „kde právě jsme"),
- [[casova-osa|časové osy]] historie (ta má vlastní config přes `worldSettings.timelineCalendarSlug`).

Lokace/postavy mají vlastní kalendářový [[subdokument-postavy|subdokument]].

## Kde se objevuje

- v dokumentaci: [15-cas-pribeh.md](docs/funkce/15-cas-pribeh.md)
- v UI: kalendář ve světě, nastavení kalendáře

## Nepleť s

- **[[herni-cas]]** — aktuální datum; kalendář je struktura, ve které to datum žije.
- **[[casova-osa]]** — historická osa minulých událostí.
