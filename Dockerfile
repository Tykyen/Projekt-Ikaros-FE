FROM docker.io/library/node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=
ARG VITE_TURNSTILE_SITE_KEY=

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

COPY package*.json ./
RUN npm ci

COPY . .
# PC-15: bez VITE_API_URL by se zapekl prázdný řetězec → runtime fallback na localhost.
# Radši build tvrdě selže, než aby produkční FE tiše volal localhost.
RUN test -n "$VITE_API_URL" || (echo "ERROR: VITE_API_URL build-arg je povinný (jinak FE volá localhost)" && exit 1)
RUN npm run build

FROM docker.io/library/nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
