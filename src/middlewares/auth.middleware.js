const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config');
const { AppError } = require('../errors/AppError');

/**
 * Middleware xác thực danh tính người dùng (JWT)
 */
function authenticate(req, res, next) {
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

  // Header dev/testing
  if (req.headers['x-user-role']) {
    req.user = {
      id: req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : 1,
      role: req.headers['x-user-role'], // 'CENTER_MANAGER' hoặc 'TECHNICIAN'
      centerId: req.headers['x-user-center'] ? Number(req.headers['x-user-center']) : 2,
      fullName: req.headers['x-user-name'] || 'Người dùng hệ thống'
    };
    return next();
  }

  // Mặc định cho prototype local nếu chưa đăng nhập: cho phép vai trò Quản lý trung tâm mặc định (TT số 2)
  req.user = {
    id: 1,
    role: 'CENTER_MANAGER',
    centerId: 2,
    fullName: 'Quản lý TT2 (Mặc định)'
  };
  return next();
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

