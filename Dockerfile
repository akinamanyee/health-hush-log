# Build stage: install deps and produce a Node server build.
# NITRO_PRESET=node-server switches the output from a Cloudflare Workers module
# to a plain Node listener (.output/server/index.mjs) — see vite.config.ts.
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN NITRO_PRESET=node-server bun run build

# Runtime stage: the .output folder is fully self-contained (server + public assets).
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
# Cloud Run injects PORT (default 8080); the nitro node-server preset honours it.
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
