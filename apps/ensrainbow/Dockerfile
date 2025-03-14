# ensrainbow-data contains an already ingested DB that will be served by the ENSRainbow app
# Using a prebuilt image for ensrainbow-data (infrequently changes) reduces build time for the ENSRainbow app image
# ensrainbow-data image is only supporting amd64 arch hence define platform at the FROM statement
ARG DATA_IMAGE_PLATFORM=linux/amd64
FROM --platform=${DATA_IMAGE_PLATFORM} ghcr.io/namehash/ensnode/ensrainbow-data AS ensrainbow-data

FROM --platform=${BUILDPLATFORM} node:18-slim AS base
ARG PNPM_VERSION=9.12.0
RUN apt-get update && \
    npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

###################
## Application Deps — standard monorepo pnpm install from base
###################

FROM base AS app-deps
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile


###################
## App Server — runs server w/ data dir
###################

FROM app-deps AS app

# cwd to ensrainbow
WORKDIR /app/apps/ensrainbow

# copy data dir from ensrainbow-data
COPY --from=ensrainbow-data /app/data ./data

# Run a lightweight database validation to ensure the pre-built database is intact and compatible
# This validation checks critical database integrity without performing a full validation,
# which helps reduce container build time while still ensuring the application can start properly
RUN pnpm run validate:lite

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3223
EXPOSE 3223

# serve
CMD ["pnpm", "run", "serve"]
