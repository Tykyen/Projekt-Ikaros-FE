# Fix: WebSocket upgrade na edge proxy (dluh D-NEW-WS-UPGRADE)

**Edge proxy = Caddy** (zjištěno z `Via: 1.1 Caddy` na `/api` i `/socket.io`). Aplikace je na **hostu**, mimo git repo.
**Souvisí:** `docs/dluhy.md` → D-NEW-WS-UPGRADE.

## Problém

V prohlížeči:
```
WebSocket connection to 'wss://www.projekt-ikaros.com/socket.io/…' failed:
WebSocket is closed before the connection is established.
```
Polling **funguje** (chat jede), upgrade na WS hlásí chybu.

**Diagnóza (ověřeno curlem):** backend Socket.IO běží a upgrade nabízí (`0{…,"upgrades":["websocket"]}`); edge proxy = **Caddy**.

## ⚠️ Nejdřív ověř, jestli WS VŮBEC nejede

📚 **Caddy v2 `reverse_proxy` podporuje WebSocket automaticky** — přeposílá `Upgrade`/`Connection` hlavičky bez konfigurace. Takže je dost možné, že WS **funguje** a ten warning je jen z prvního pokusu, po kterém Socket.IO uspěje.

**Test (DevTools → Network → filtr `WS`):**
- Klikni na spojení `socket.io/?…transport=websocket`.
- **Status `101 Switching Protocols`** → WS **funguje**, warning je benigní → dluh lze zavřít, není co řešit.
- Status `pending` / `(failed)` u VŠECH WS pokusů, příček jen `transport=polling` zůstává → WS opravdu nejede → pokračuj níže.

## Pokud WS opravdu nejede — kde hledat (Caddy)

Caddy WS umí sám, takže příčina je obvykle jedna z:

1. **Cloudflare/jiná proxy PŘED Caddy** s vypnutým WS. Pokud je CF před originem → Dashboard → Network → WebSockets = ON.
2. **Caddyfile manipuluje hlavičky** — hledej `header_up -Connection`, `header_up -Upgrade` nebo agresivní `header` direktivy na `/socket.io` route; odstraň je.
3. **Špatné pořadí matcherů** — `/socket.io/*` musí jít na `reverse_proxy` backend, ne do `file_server`/SPA fallbacku.

**Správný Caddyfile (vzor):**
```caddyfile
www.projekt-ikaros.com {
    # API + WebSocket → backend (Caddy řeší WS upgrade sám)
    reverse_proxy /api/*       127.0.0.1:3001
    reverse_proxy /socket.io/* 127.0.0.1:3001

    # zbytek → FE nginx kontejner (statika + SPA)
    reverse_proxy 127.0.0.1:8081
}
```
(`3001` = `BACKEND_PORT` z compose.prod `"3001:3000"`; `8081` = `FRONTEND_PORT` z FE compose.)

Po úpravě: `caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy`.

## Po fixu
- DevTools → Network → WS → status **101**; warning zmizí.
- Zavřít dluh **D-NEW-WS-UPGRADE** v `docs/dluhy.md`.

> 💡 Pošli mi obsah `Caddyfile` z hostu, pokud WS po testu opravdu nejede — řeknu přesně, který řádek ho láme. Z repa k němu nemám přístup.
