# API image (Node + Prisma). Use with Neon/external Postgres via DATABASE_URL.
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
  && npx prisma generate

COPY src ./src
RUN mkdir -p uploads
COPY uploads ./uploads

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node src/server.js"]
