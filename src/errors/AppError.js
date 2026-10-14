/**
 * AppError: Lớp lỗi miền nghiệp vụ chuẩn theo tài liệu Buổi 7.
 * Service ném lỗi nghiệp vụ có mã (code), không chứa mã trạng thái HTTP.
 * Routes/Middleware sẽ chuyển đổi mã lỗi nghiệp vụ sang mã HTTP tương ứng.
 */
class AppError extends Error {
  /**
   * @param {string} code Mã lỗi nghiệp vụ (ví dụ: 'KTV_KHONG_DU_TAY_NGHE', 'PHIEU_KHONG_TON_TAI')
   * @param {string} message Thông điệp mô tả lỗi chi tiết cho người dùng
   * @param {any} [chiTiet] Thông tin chi tiết bổ sung (danh sách trường sai, ID đối tượng, ...)
   */
  constructor(code, message, chiTiet = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    if (chiTiet !== undefined) {
      this.chiTiet = chiTiet;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };

