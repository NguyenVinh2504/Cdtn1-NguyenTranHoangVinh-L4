/**
 * Bản đồ dịch MÃ LỖI NGHIỆP VỤ -> MÃ TRẠNG THÁI HTTP (RFC 7807)
 * Tuân thủ nghiêm ngặt quy định: Service ném AppError, tầng HTTP dịch sang status code.
 */
const HTTP_CODE_MAP = {
  DU_LIEU_KHONG_HOP_LE: 400,
  THIEU_TRUONG_BAT_BUOC: 400,
  XAC_THUC_KHONG_HOP_LE: 401,
  TOKEN_HET_HAN: 401,
  KHONG_CO_QUYEN: 403,
  PHIEU_KHONG_TON_TAI: 404,
  KTV_KHONG_TON_TAI: 404,
  KTV_KHONG_KHA_DUNG: 404,
  TRUNG_TAM_KHONG_TON_TAI: 404,
  TRANG_THAI_KHONG_HOP_LE: 409,
  LICH_HEN_XUNG_DOT: 409,
  KHONG_THE_XOA_PHIEU: 422,
  KTV_KHONG_CUNG_TRUNG_TAM: 422,
  KTV_KHONG_DU_TAY_NGHE: 422,
  KTV_QUA_TAI: 422
};

function errorHandler(err, req, res, next) {
  // Lỗi miền nghiệp vụ từ tầng Service
  if (err.name === 'AppError' || (err.code && HTTP_CODE_MAP[err.code])) {
    const status = HTTP_CODE_MAP[err.code] || 400;
    return res.status(status).json({
      success: false,
      error: err.code,
      message: err.message,
      chiTiet: err.chiTiet || null
    });
  }

  // Lỗi cú pháp JSON request body của express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'DU_LIEU_KHONG_HOP_LE',
      message: 'Định dạng JSON gửi lên không hợp lệ'
    });
  }

  // Lỗi hệ thống không lường trước (500)
  console.error('[UNHANDLED_ERROR]', err);
  return res.status(500).json({
    success: false,
    error: 'LOI_HE_THONG',
    message: 'Đã xảy ra lỗi nội bộ trên máy chủ. Vui lòng thử lại sau.'
  });
}

module.exports = {
  HTTP_CODE_MAP,
  errorHandler
};

