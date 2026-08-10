# Multi-Stage Build for Express Node.js Server
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drinkhub?sslmode=disable"
# Tell Prisma to generate for Linux Alpine (the builder's OS), not the host OS
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"

# Copy package manifests & source files
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/server ./apps/server

# Install ALL deps (including devDeps needed for tsc/prisma)
RUN npm ci

# Step 1: Build shared types package first
RUN npm run build --workspace=packages/shared

# Step 2: Generate Prisma client (separate from tsc so errors are visible)
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma

# Step 3: Compile TypeScript → JavaScript
RUN npx tsc --project apps/server/tsconfig.json

# Production Runner Stage
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drinkhub?sslmode=disable"
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/server/package.json ./apps/server/package.json
COPY apps/server/prisma ./apps/server/prisma

RUN npm ci --omit=dev
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma

# Copy compiled output from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 5000

CMD ["node", "apps/server/dist/server.js"]
