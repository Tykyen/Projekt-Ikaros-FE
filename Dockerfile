FROM docker.io/library/node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=
ARG VITE_TURNSTILE_SITE_KEY=

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

COPY package*.json ./
RUN npm ci

COPY . .
# PC-15: bez VITE_API_URL se zapeče prázdný řetězec → runtime fallback na localhost
# (FE nebude v produkci fungovat). Build NEblokujeme (deploy projde), ale hlasitě
# varujeme — nastav VITE_API_URL v GitHub vars a redeployni.
RUN if [ -z "$VITE_API_URL" ]; then \
      echo "############################################################"; \
      echo "# VAROVANI: VITE_API_URL je prazdny!"; \
      echo "# FE se zbuilduje s fallbackem na http://localhost:3000 a"; \
      echo "# NEBUDE v produkci fungovat (neuvidi backend)."; \
      echo "# Nastav VITE_API_URL v GitHub vars a spust deploy znovu."; \
      echo "############################################################"; \
    fi
RUN npm run build

FROM docker.io/library/nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
# 14.3 — config jako envsubst TEMPLATE: nginx:alpine entrypoint nahradí
# ${BACKEND_HOST} a ${CSP_HEADER_NAME} z prostředí a zapíše do conf.d/default.conf.
# NGINX_ENVSUBST_FILTER omezí substituci jen na tyto dvě proměnné → nginx $uri ap. zůstanou.
# Defaulty (fail-safe, ať nginx nepadne, když compose env zapomene):
#   CSP_HEADER_NAME → enforce (cílový stav 14.3 po doladění report-only fází);
#     dočasný rollback na report-only = var CSP_HEADER_NAME=Content-Security-Policy-Report-Only.
#   BACKEND_HOST → prázdný (compose ho dodá z VITE_API_URL).
COPY default.conf.template /etc/nginx/templates/default.conf.template
# 15B.1 — + PRERENDER_HOST (host:port prerender sidecaru pro upstream).
ENV NGINX_ENVSUBST_FILTER="^(BACKEND_HOST|CSP_HEADER_NAME|PRERENDER_HOST)$" \
    CSP_HEADER_NAME="Content-Security-Policy" \
    BACKEND_HOST="" \
    PRERENDER_HOST="prerender:3000"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
