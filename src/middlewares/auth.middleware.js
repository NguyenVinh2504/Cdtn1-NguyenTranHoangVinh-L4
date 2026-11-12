const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config');
const { AppError } = require('../errors/AppError');

/**
 * Middleware xác thực danh tính người dùng (JWT)
 */
function authenticate(req, res, next) {
  // BUG-05 fix (NFR2): endpoint công khai không cần xác thực (healthcheck + login + root)
  const publicPaths = ['/health', '/', '/api/auth/login'];
  if (publicPaths.includes(req.path)) {
    return next();
  }
  // Hỗ trợ cả Header x-user-* phục vụ test nhanh và Bearer Token chuẩn NFR2
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return next(new AppError('TOKEN_HET_HAN', 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ'));
    }
  }

  // Header dev/testing: chỉ dùng khi chạy local/test.
  // Trên cloud, render.yaml đặt ALLOW_DEV_AUTH_HEADERS=false để buộc JWT thật,
  // tránh việc bất kỳ ai gửi x-user-role cũng mạo danh được quản lý.
  const allowDevAuthHeaders = process.env.ALLOW_DEV_AUTH_HEADERS !== 'false';
  if (allowDevAuthHeaders && req.headers['x-user-role']) {
    req.user = {
      id: req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : 1,
      role: req.headers['x-user-role'], // 'CENTER_MANAGER' hoặc 'TECHNICIAN'
      centerId: req.headers['x-user-center'] ? Number(req.headers['x-user-center']) : 2,
      fullName: req.headers['x-user-name'] || 'Người dùng hệ thống'
    };
    return next();
  }

  // BUG-05 fix: KHÔNG còn fallback "manager mặc định" — request ẩn danh
  // tới API nghiệp vụ phải bị từ chối 401 (NFR2)
  return next(new AppError('XAC_THUC_KHONG_HOP_LE', 'Yêu cầu đăng nhập trước khi thực hiện'));
}

/**
 * Middleware phân quyền theo vai trò (Role Guard)
 * @param {string[]} allowedRoles Danh sách vai trò được phép
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('XAC_THUC_KHONG_HOP_LE', 'Yêu cầu đăng nhập trước khi thực hiện'));
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('KHONG_CO_QUYEN', 'Bạn không có quyền thực hiện chức năng này với vai trò hiện tại')
      );
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticate,
  authorize
};

