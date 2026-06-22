# 15B.1 — prerender sidecar: node + system Chromium (alpine = malý image).
# puppeteer-core NEstahuje vlastní Chromium → použijeme balík z alpine.
FROM docker.io/library/node:20-alpine

WORKDIR /app

# Lokální obejití TLS MITM (corporate CA): `--build-arg INSECURE_TLS=1` přepne
# apk na HTTP a vypne npm strict-ssl. Produkční build (deploy.yml) arg NEdává →
# zůstává HTTPS. Bezpečné u apk: balíky jsou podepsané (apk ověří podpis bez
# ohledu na transport). U npm jen pro lokální build za MITM proxy.
ARG INSECURE_TLS=
RUN if [ -n "$INSECURE_TLS" ]; then sed -i 's|https://|http://|g' /etc/apk/repositories; fi

# Chromium + fonty (bez nich renderuje prázdné/rozbité glyfy).
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
  # alpine občas dává /usr/bin/chromium (ne -browser) — sjednotíme na -browser.
  && if [ ! -e /usr/bin/chromium-browser ] && [ -e /usr/bin/chromium ]; then \
       ln -s /usr/bin/chromium /usr/bin/chromium-browser; \
     fi

# puppeteer-core nesmí zkoušet stáhnout vlastní build.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    CHROMIUM_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

COPY package*.json ./
RUN if [ -n "$INSECURE_TLS" ]; then npm config set strict-ssl false; fi \
  && npm ci --omit=dev

COPY index.js ./

EXPOSE 3000

CMD ["node", "index.js"]
