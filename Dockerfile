# =============================================================================
# Backend API Service (Luồng L4 - Mekong Mobile Smart CRM)
# =============================================================================

# ---------- GIAI ĐOẠN 1: Cài đặt phụ thuộc ----------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate

# ---------- GIAI ĐOẠN 2: Runtime Backend Service ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl curl

COPY package*.json ./
COPY prisma ./prisma/
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Healthcheck endpoint để docker-compose giám sát
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
