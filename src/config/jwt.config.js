/**
 * Cấu hình JWT cho toàn bộ ứng dụng
 * Tách riêng để tuân thủ nguyên tắc phụ thuộc một chiều:
 * Cả Service và Middleware đều đọc từ Config, Service KHÔNG import từ Middleware.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_mekong_mobile_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN
};

