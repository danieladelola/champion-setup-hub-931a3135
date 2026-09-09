# Self-hosted (Coolify/Docker) build of the TanStack Start app.
# Builds a Node server bundle via nitro's node-server preset.
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock* bunfig.toml ./
RUN bun install --frozen-lockfile || bun install

COPY . .
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN bun run build \
  && if [ -d .output ]; then mv .output server-build; else mv dist server-build; fi \
  && test -f server-build/server/index.mjs

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=build /app/server-build ./server-build
EXPOSE 3000
CMD ["node", "server-build/server/index.mjs"]
