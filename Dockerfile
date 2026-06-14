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
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
