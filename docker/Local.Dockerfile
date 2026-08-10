# ============================================================
# Local Development Dockerfile — Hot reload with watch mode
# Equivalent to docker/Local.Dockerfile (which was 0 bytes in the .NET origin)
# ============================================================

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=local

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install

COPY . .

EXPOSE 5015

CMD ["pnpm", "start:dev"]
