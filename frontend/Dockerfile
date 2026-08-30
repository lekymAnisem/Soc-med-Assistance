# ============================================================
# FRONTEND TIER — Vite + React static site, served by nginx
# Build context: frontend/   (docker build -f frontend/Dockerfile frontend)
# ============================================================

# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Vite inlines these at build time
ARG VITE_API_URL=http://localhost:4000
ARG VITE_CLERK_PUBLISHABLE_KEY=

COPY package.json ./
RUN npm install

COPY . .
RUN VITE_API_URL=$VITE_API_URL \
    VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    npm run build

# ---------- Serve stage ----------
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Run as non-root (gate requires it; runAsNonRoot needs a numeric UID)
RUN chown -R 101:101 /usr/share/nginx/html /var/cache/nginx /var/log/nginx \
    && sed -i 's|pid[[:space:]]*/var/run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf
USER 101

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
