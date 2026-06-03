# OAuth provider sidecar for the Decap CMS editor.
#
# Decap's GitHub backend can't complete login from the browser alone (GitHub
# OAuth Apps don't support browser-only PKCE), so it delegates the handshake to
# a tiny server-side provider. This builds vencax/netlify-cms-github-oauth-
# provider (Express + simple-oauth2) — the canonical Decap GitHub OAuth proxy —
# pinned to a commit for reproducibility. It serves /auth and /callback on :3000
# and runs as a sidecar in the weeeeeiserbikes-decap pod; the site's HTTPRoute
# path-routes /auth + /callback to it, so it shares the site's hostname.
#
# Config (env, injected by the Deployment): OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET
# (from Vault via the decap-oauth Secret), ORIGINS (allowed site origin),
# REDIRECT_URL (the public /callback URL), PORT.
FROM node:22-alpine AS build
RUN apk add --no-cache git
WORKDIR /app
# Pinned commit of vencax/netlify-cms-github-oauth-provider.
ARG OAUTH_PROVIDER_REF=0844c3ba5447bba9e8409bdbd1b6f0f1051c3413
RUN git clone https://github.com/vencax/netlify-cms-github-oauth-provider.git . \
 && git checkout "${OAUTH_PROVIDER_REF}" \
 && npm install --omit=dev --no-audit --no-fund

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app /app
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "app.js"]
