# syntax=docker/dockerfile:1
# Build context is the repository root so the npm workspace manifests resolve.

FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci --workspace frontend --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/frontend/node_modules ./frontend/node_modules
COPY package.json ./
COPY frontend ./frontend
RUN npm run build --workspace frontend

FROM node:20-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN addgroup -S pyramid && adduser -S pyramid -G pyramid

COPY --from=build /repo/frontend/.next ./.next
COPY --from=build /repo/frontend/public ./public
COPY --from=build /repo/frontend/package.json ./package.json
COPY --from=build /repo/frontend/next.config.ts ./next.config.ts
COPY --from=build /repo/node_modules ./node_modules

USER pyramid
EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]
