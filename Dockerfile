# Two-stage build for the Sagebrush Cycle site.
#
# Stage 1 generates the deployable site from src/ (transpiles the JSX, bundles
# in the vendored React/lucide, copies CSS/fonts/photos) into /app/public.
# Stage 2 serves that with stock nginx. Nothing in public/ is hand-written or
# committed — it's produced here, reproducibly, on every build.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# alpine-slim drops the extra nginx modules/perl we don't need for a static
# site — meaningfully smaller than nginx:alpine, same correct MIME handling.
FROM nginx:alpine-slim
# nginx serves /usr/share/nginx/html on :80 out of the box.
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
