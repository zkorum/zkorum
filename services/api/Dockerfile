# Pin the target-platform base before the native build stage resolves the same
# multi-architecture tag. Reuse the stage so Podman cannot select the host Node
# binary for the runtime after installing target-platform native dependencies.
FROM node:24.14.1-trixie-slim AS runtime-base

# ---- Dependencies (production only) ----
FROM runtime-base AS deps
WORKDIR /app
# Builds have no TTY; noninteractive debconf avoids prompts and frontend fallback warnings.
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# ---- Build ----
# Only JavaScript output crosses into the runtime image. Compile natively to
# avoid Rosetta/QEMU child-process hangs during esbuild's install checks.
FROM --platform=$BUILDPLATFORM node:24.14.1-trixie-slim AS build
WORKDIR /app
# Builds have no TTY; noninteractive debconf avoids prompts and frontend fallback warnings.
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY patches ./patches
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build

# ---- Production ----
FROM runtime-base AS production
# Builds have no TTY; noninteractive debconf avoids prompts and frontend fallback warnings.
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates tini && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package.json esm-loader-lodash-fix.mjs ./
USER node
RUN node --input-type=module -e "await import('opencc')"
EXPOSE 8080
ENTRYPOINT ["tini", "--"]
CMD ["node", "--loader", "esm-module-alias/loader", "--loader", "./esm-loader-lodash-fix.mjs", "--no-warnings", "dist/index.js"]
