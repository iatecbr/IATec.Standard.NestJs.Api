# ============================================================
# Production Dockerfile — Multi-stage build
# Equivalent to docker/Dockerfile (which was 0 bytes in the .NET origin)
# ============================================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 5015

CMD ["node", "dist/main.js"]
