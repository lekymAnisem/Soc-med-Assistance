# ============================================================
# DATABASE TIER — Drizzle ORM schema + migration runner
# Build context: database/  (docker build -f database/Dockerfile database)
# ============================================================

# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build
RUN npm run db:generate

# ---------- Runtime stage ----------
# Runs as a migration runner against Neon; also usable as the
# `@nova/database` artifact for the backend tier.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/drizzle ./drizzle

# Required at runtime: DATABASE_URL (Neon connection string)
# Optional commands: npm run db:migrate  |  npm run db:push

# Run as non-root (gate requires it)
RUN chown -R node:node /app
USER node

CMD ["npm", "run", "db:migrate"]