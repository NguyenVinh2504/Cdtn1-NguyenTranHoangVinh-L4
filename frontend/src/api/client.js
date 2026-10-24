/**
 * client.js: Điểm duy nhất trong toàn bộ ứng dụng Frontend thực hiện các lời gọi HTTP (fetch).
 * Tuân thủ quy định: Component/Pages không bao giờ gọi fetch/axios trực tiếp.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(status, code, message, chiTiet = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // Mã trạng thái HTTP (400, 401, 403, 404, 409, 422, 500)
    this.code = code;     // Mã lỗi nghiệp vụ backend (KTV_KHONG_DU_TAY_NGHE, ...)
    this.chiTiet = chiTiet;
  }
}

export async function request(path, options = {}) {
  const token = localStorage.getItem('mekong_token');
  const userJson = localStorage.getItem('mekong_user');
  let user = null;
  if (userJson) {
    try { user = JSON.parse(userJson); } catch (e) {}
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(user?.role ? { 'x-user-role': user.role } : {}),
    ...(user?.id ? { 'x-user-id': String(user.id) } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) return null;

  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    // Phản hồi không phải JSON hợp lệ
  }

  if (!response.ok) {
    // Tự động xử lý khi nhận mã lỗi 401 (Hết hạn phiên đăng nhập)
    if (response.status === 401) {
      localStorage.removeItem('mekong_token');
      localStorage.removeItem('mekong_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const errorCode = body?.error || 'UNKNOWN_ERROR';
    const errorMessage = body?.message || 'Không kết nối được tới máy chủ hoặc đã xảy ra lỗi';
    throw new ApiError(response.status, errorCode, errorMessage, body?.chiTiet);
  }

  return body;
}

