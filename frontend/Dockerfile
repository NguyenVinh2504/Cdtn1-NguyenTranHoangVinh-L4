# =============================================================================
# Frontend Web Service (React 18 + Vite) - Luồng L4 Mekong Mobile Smart CRM
# =============================================================================

# ---------- GIAI ĐOẠN 1: Build React Vite ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

# Nhận Backend API URL (mặc định http://localhost:3000)
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ---------- GIAI ĐOẠN 2: Nginx Web Server Độc Lập ----------
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
