/**
 * sla.js — Tính hạn cam kết SLA theo QT-04 (giờ làm việc).
 *
 * ── Quy tắc (đã hiện thực, khớp với docs/srs.md — QT-04) ──────────────────────
 *  • Hạn cam kết tính theo SỐ GIỜ LÀM VIỆC, không phải giờ lịch:
 *      CAO = 24 giờ · TRUNG_BINH = 72 giờ · THAP = 120 giờ
 *  • Ngày làm việc: THỨ HAI → THỨ BẢY (06 ngày).
 *    CHỦ NHẬT là ngày non làm việc → giờ trôi qua vào Chủ Nhật KHÔNG được tính.
 *  • Nếu phiếu được tiếp nhận trong ngày non làm việc (Chủ Nhật) thì đồng hồ SLA
 *    chỉ bắt đầu chạy từ 00:00 của ngày làm việc kế tiếp.
 *  • Mốc thời gian được quy đổi sang giờ Việt Nam (UTC+7) — hằng số cố định nên
 *    KẾT QUẢ KHÔNG PHỤ THUỘC MÚI GIỜ CỦA MÁY CHẠY (quan trọng khi chạy trong
 *    Docker với TZ=UTC hoặc trên máy giảng viên).
 *  • Prototype chưa mô hình hóa ca làm việc trong ngày (8h–17h), nên trong một
 *    ngày làm việc TẤT CẢ 24 giờ đều được tính.
 *
 *  → Do SRS đã yêu cầu "chỉ tính trong ngày làm việc", lớp Service phải hiện thực
 *    (trigger CSDL trong db/schema.sql chỉ là bản thiết kế BT1 và KHÔNG được
 *    triển khai — migration chính thức chỉ tạo 6 bảng).
 */

const TZ_OFFSET_MINUTES = 7 * 60; // Việt Nam (UTC+7)
const HOUR_MS = 60 * 60 * 1000;

/** Thời hạn SLA theo mức ưu tiên (giờ làm việc) */
const SLA_HOURS = {
  CAO: 24,
  TRUNG_BINH: 72,
  THAP: 120
};

/**
 * Kiểm tra một mốc thời gian (ms epoch) có rơi vào Chủ Nhật giờ Việt Nam hay không.
 * @param {number} ms Mốc thời gian (ms epoch)
 * @returns {boolean} true nếu là Chủ Nhật giờ Việt Nam
 */
function isSundayLocal(ms) {
  const local = new Date(ms + TZ_OFFSET_MINUTES * 60000);
  return local.getUTCDay() === 0;
}

/**
 * Cộng thêm N giờ làm việc vào một mốc thời gian, bỏ qua toàn bộ giờ nằm trong Chủ Nhật.
 * @param {number} startMs Mốc bắt đầu (ms epoch)
 * @param {number} hours Số giờ làm việc cần cộng thêm
 * @returns {number} Mốc kết quả (ms epoch)
 */
function addWorkingHours(startMs, hours) {
  let remaining = Math.floor(hours);
  if (remaining <= 0) return startMs;

  // Chuyển sang khung giờ địa phương (UTC+7) để xác định đúng ngày trong tuần
  let cursor = startMs + TZ_OFFSET_MINUTES * 60000;

  while (remaining > 0) {
    const d = new Date(cursor);
    if (d.getUTCDay() === 0) {
      // Chủ Nhật → nhảy tới 00:00 của ngày làm việc kế tiếp (Thứ Hai)
      const mondayMidnight =
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + 24 * HOUR_MS;
      cursor = mondayMidnight;
      continue;
    }
    cursor += HOUR_MS;
    remaining -= 1;
  }

  // Trả về lại ms epoch thật
  return cursor - TZ_OFFSET_MINUTES * 60000;
}

/**
 * Tính hạn cam kết SLA (QT-04) theo giờ làm việc.
 * @param {Date|string|number} receivedAt Thời điểm tiếp nhận phiếu
 * @param {'CAO'|'TRUNG_BINH'|'THAP'} priority Mức độ ưu tiên
 * @returns {Date} Thời điểm hết hạn cam kết
 * @throws {Error & {code: string}} nếu mức ưu tiên không hợp lệ
 */
function calculateSlaDueDate(receivedAt, priority) {
  const hours = SLA_HOURS[priority];
  if (!hours) {
    const err = new Error(
      `Mức độ ưu tiên '${priority}' không hợp lệ. Phải là CAO, TRUNG_BINH hoặc THAP.`
    );
    err.code = 'UU_TIEN_KHONG_HOP_LE';
    throw err;
  }
  const baseTime = receivedAt ? new Date(receivedAt).getTime() : Date.now();
  return new Date(addWorkingHours(baseTime, hours));
}

module.exports = {
  TZ_OFFSET_MINUTES,
  SLA_HOURS,
  isSundayLocal,
  addWorkingHours,
  calculateSlaDueDate
};
