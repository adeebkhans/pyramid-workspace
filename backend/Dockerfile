# syntax=docker/dockerfile:1
# Build context is the repository root so the npm workspace manifests resolve.

# ── dependencies ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend --include-workspace-root

# ── build ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/backend/node_modules ./backend/node_modules
COPY package.json ./
COPY backend ./backend
RUN npm run build --workspace backend

# ── runtime ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S pyramid && adduser -S pyramid -G pyramid

COPY --from=build /repo/backend/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/backend/package.json ./package.json

USER pyramid
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
