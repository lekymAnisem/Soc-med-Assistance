# ============================================================
# BACKEND TIER — Express API (builds database workspace + self)
# Build context: repo root  (docker build -f backend/Dockerfile .)
# ============================================================

# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /workspace

# Copy workspace manifests so npm resolves all workspaces
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY database/package.json ./database/
COPY frontend/package.json ./frontend/

RUN npm install

# Copy source code for the two workspaces we need
COPY backend ./backend
COPY database ./database

# Build database library first, then the backend
RUN npm run build --workspace @nova/database
RUN npm run build --workspace @nova/backend

# ---------- Runtime stage ----------
FROM node:22-alpine AS runtime
WORKDIR /workspace
ENV NODE_ENV=production

# Only the pieces needed to run
COPY --from=build /workspace/package.json ./
COPY --from=build /workspace/backend/package.json ./backend/
COPY --from=build /workspace/backend/dist ./backend/dist
COPY --from=build /workspace/database ./database
COPY --from=build /workspace/node_modules ./node_modules

# Environment variables — all must be provided at runtime via -e or env_file:
#   DATABASE_URL, OPENROUTER_API_KEY, CORS_ORIGIN, OPENROUTER_MODEL, AI_PROVIDER, CLERK_SECRET_KEY (optional)
#   VITE_CLERK_PUBLISHABLE_KEY (if using Clerk user auth)

# Run as non-root (gate requires it; runAsNonRoot needs a numeric UID)
RUN mkdir -p /workspace/tmp && chown -R 1000:1000 /workspace
USER 1000

EXPOSE 4000
CMD ["node", "backend/dist/index.js"]