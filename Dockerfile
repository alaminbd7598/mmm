# Production image for Google Cloud Run (or any Docker host).
# Build:  docker build --build-arg NEXT_PUBLIC_APP_URL=https://www.example.com -t mmm-web .
# Run:    docker run -p 8080:8080 -e DATABASE_URL=... -e JWT_SECRET=... -e ADMIN_BOOTSTRAP_PASSWORD=... mmm-web
# The image build never touches a database. Create/update the tables once per schema change with
# `npm run db:push` from a machine that can reach the database (see docs/DEPLOYMENT.bn.md).

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_APP_URL=""
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .
RUN npm run build

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
