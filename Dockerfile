# Production image for Google Cloud Run (or any Docker host).
# Build:  docker build -t mmm-web .
# Run:    docker run -p 8080:8080 -e DATABASE_URL=... -e JWT_SECRET=... mmm-web

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm install --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
RUN useradd --system --uid 1001 nextjs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs /app/.next/static ./.next/static
USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
