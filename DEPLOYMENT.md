# Projekt Ikaros Frontend Deployment

Manual GitHub Actions deployment copies this repository to `/opt/projekt-ikaros-fe` and runs Docker Compose there.

## GitHub Environment

Create a `production` environment with these variables/secrets:

Secrets:
- `SSH_PRIVATE_KEY`

Variables:
- `SERVER_HOST`
- `SERVER_PORT`
- `SSH_USER`
- `FRONTEND_PORT` defaults to `8081` if empty
- `VITE_API_URL` leave empty for same-origin `/api` and `/socket.io`
- `VITE_TURNSTILE_SITE_KEY` optional

## Reverse Proxy

Route frontend traffic to:

```text
/ -> http://SERVER:8081
```

If `VITE_API_URL` is empty, the browser also expects these backend paths on the same public origin:

```text
/api/ -> http://SERVER:3001
/socket.io/ -> http://SERVER:3001
/static/ -> http://SERVER:3001
/docs/ -> http://SERVER:3001
```
