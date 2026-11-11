# =============================================================================
# Backend API Service (Luồng L4 - Mekong Mobile Smart CRM)
# Mức 3 tái lập: container chứa runtime + thư viện + CSDL ở dịch vụ riêng.
# =============================================================================

# ---------- GIAI ĐOẠN 1: Cài đặt phụ thuộc ----------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Cài CẢ devDependencies (jest, supertest) để bộ kiểm thử chạy được TRONG container
# (mục C3 của BT3: "Bộ kiểm thử chạy được tại chỗ").
RUN npm ci
RUN npx prisma generate

# ---------- GIAI ĐOẠN 2: Runtime Backend Service ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl curl

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY tests ./tests

ENV NODE_ENV=production
ENV PORT=3000
ENV API_PREFIX=/api
EXPOSE 3000

# Healthcheck endpoint để docker-compose giám sát
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Không chạy bằng root (OWASP A05:2025 - Security Misconfiguration)
USER node

# Tự động: migrate -> seed dữ liệu mẫu -> khởi động API (idempotent, chạy lại không nhân đôi dữ liệu)
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
