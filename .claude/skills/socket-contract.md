---
name: socket-contract
description: Ověř, že FE Socket.IO emit/listener odpovídá kontraktu v docs/websocket-api.md. Spusť při implementaci nebo úpravě real-time funkcionality.
---

# Skill: socket-contract

Ověří soulad FE socket kódu s oficiálním kontraktem v `../Projekt-ikaros/docs/websocket-api.md`.

## Postup

1. **Identifikuj eventy** — z kontextu úkolu vypiš všechny `socket.emit(...)` a `socket.on(...)` volání v upravovaném kódu.
2. **Přečti kontrakt** — najdi příslušnou sekci v `../Projekt-ikaros/docs/websocket-api.md`.
3. **Zkontroluj pro každý event:**
   - [ ] **Název** — přesná shoda řetězce (case-sensitive)
   - [ ] **Směr** — emit = příchozí event (klient → BE), on = odchozí event (BE → klient)
   - [ ] **Payload struktura** — všechna povinná pole přítomna, typy odpovídají
   - [ ] **Room** — klient se připojil do správné room před listenováním (`world:join`, `chat:join`, `map:join`)
   - [ ] **Auth** — pokud kontrakt říká "Auth: ano", ověř že JWT je přítomné v `socket.auth`
4. **Nahlásit výsledek** — projde / seznam odchylek.
5. **Pokud neprojde** — oprav hned (je to vždy bug), nebo použij skill `dluh` pokud oprava přesahuje rozsah úkolu.

## Časté chyby

- Zaměnění `emit` a `on` (klient emituje event, který má jen poslouchat)
- Chybějící `map:join` / `chat:join` před subscribe na room eventy
- Payload jako flat objekt místo nested (nebo obráceně)
- Event název s překlepem (`chat:mesage` místo `chat:message`)

## Pozor

- Starý Matrix používal SignalR huby — názvy eventů jsou jiné. Nepoužívej starý FE jako referenci pro názvy.
- Kontrakt je v `../Projekt-ikaros/docs/websocket-api.md` — to je jediná autorita.
