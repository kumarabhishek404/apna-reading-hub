# Reading Hub — single-container image (Next.js + Express API)
# Platform exposes one PORT; Next.js serves that port and proxies /api to the API.

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ── Install dependencies (npm workspaces → root node_modules) ─
FROM base AS deps
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma
RUN npm ci

# ── Build backend + frontend ──────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY frontend ./frontend
COPY backend ./backend

# Production uses PostgreSQL
RUN cp backend/prisma/schema.postgresql.prisma backend/prisma/schema.prisma

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/readinghub?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV INTERNAL_API_URL=http://127.0.0.1:4000
ENV NEXT_PUBLIC_API_URL=

WORKDIR /app/backend
RUN npx prisma generate && npx tsc

WORKDIR /app/frontend
RUN npx next build --webpack

# ── Runtime ───────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV INTERNAL_API_URL=http://127.0.0.1:4000
ENV UPLOADS_DIR=/app/backend/uploads
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

COPY --from=builder /app/frontend/package.json ./frontend/
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/next.config.ts ./frontend/
COPY --from=builder /app/frontend/tsconfig.json ./frontend/
COPY --from=builder /app/frontend/postcss.config.mjs ./frontend/
COPY --from=builder /app/frontend/next-env.d.ts ./frontend/

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh \
  && mkdir -p /app/backend/uploads \
  && chown -R appuser:nodejs /app

USER appuser
EXPOSE 3000
WORKDIR /app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
