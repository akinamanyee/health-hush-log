FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/.output .output
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
