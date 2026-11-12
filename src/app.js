const express = require('express');
const cors = require('cors');

// Khắc phục BigInt JSON serialization
BigInt.prototype.toJSON = function () {
  const intVal = Number(this);
  return Number.isSafeInteger(intVal) ? intVal : this.toString();
};

const { authenticate } = require('./middlewares/auth.middleware');
const { phoneMasker } = require('./middlewares/phoneMasker.middleware');
const { errorHandler } = require('./middlewares/errorHandler.middleware');

const TicketRepository = require('./repositories/ticket.repository');
const TechnicianRepository = require('./repositories/technician.repository');
const AppointmentRepository = require('./repositories/appointment.repository');
const CustomerRepository = require('./repositories/customer.repository');

const TicketService = require('./services/ticket.service');
const TechnicianService = require('./services/technician.service');
const AuthService = require('./services/auth.service');

const ticketRoutes = require('./routes/ticket.routes');
const technicianRoutes = require('./routes/technician.routes');
const authRoutes = require('./routes/auth.routes');

/**
 * So khớp một Origin với danh sách cho phép.
 * Hỗ trợ tiền tố đại diện `*` để dùng được với domain preview của Vercel,
 * ví dụ: `https://*.vercel.app` hoặc `https://mekong-crm-*.vercel.app`.
 * Không dùng `*` một mình trong production vì sẽ mở CORS cho mọi website.
 */
function originMatches(origin, pattern) {
  if (pattern === origin) return true;
  if (!pattern.includes('*')) return false;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(origin);
}

function createApp(customServices = {}) {
  const app = express();

  // Render/Vercel chạy sau reverse proxy: cần trust proxy để req.protocol/IP đúng.
  app.set('trust proxy', 1);

  // BUG-06 fix: giới hạn origin CORS thay vì mở tất cả (app.use(cors()))
  const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        // Request không có Origin (curl, health check, server-to-server) luôn được phép.
        if (!origin) return callback(null, true);
        return callback(null, allowedOrigins.some(pattern => originMatches(origin, pattern)));
      },
      credentials: true
    })
  );
  app.use(express.json());

  // Middleware bảo mật và che thông tin nhạy cảm
  app.use(authenticate);
  app.use(phoneMasker);

  // Khởi tạo các tầng (Dependency Injection)
  const ticketRepo = customServices.ticketRepo || new TicketRepository();
  const techRepo = customServices.technicianRepo || new TechnicianRepository();
  const apptRepo = customServices.appointmentRepo || new AppointmentRepository();
  const custRepo = customServices.customerRepo || new CustomerRepository();

  const ticketService =
    customServices.ticketService ||
    new TicketService(ticketRepo, techRepo, apptRepo, custRepo);
  const technicianService =
    customServices.technicianService ||
    new TechnicianService(techRepo, ticketRepo);
  const authService = customServices.authService || new AuthService();

  // Endpoint kiểm tra sức khỏe hệ thống (Health Check)
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'Mekong Mobile CRM - Luồng L4 (Phân công KTV & Lịch hẹn)',
      version: '0.2.0'
    });
  });

  // Đăng ký các routes theo tiền tố API
  const apiPrefix = process.env.API_PREFIX || '/api';
  app.use(`${apiPrefix}/tickets`, ticketRoutes(ticketService));
  app.use(`${apiPrefix}/technicians`, technicianRoutes(technicianService));
  app.use(`${apiPrefix}/auth`, authRoutes(authService));

  // Root endpoint giới thiệu Backend API (Tách biệt hoàn toàn với Frontend URL)
  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'Mekong Mobile CRM - Backend API Server (Luồng L4)',
      version: '0.2.0',
      health: '/health',
      apiPrefix: apiPrefix,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    });
  });

  // Tầng xử lý lỗi tập trung
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

