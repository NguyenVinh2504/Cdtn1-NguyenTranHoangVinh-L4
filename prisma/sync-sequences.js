/**
 * prisma/sync-sequences.js
 *
 * BUG-10 (CRITICAL) — Đồng bộ sequence PostgreSQL sau khi nạp dữ liệu mẫu.
 *
 * NGUYÊN NHÂN GỐC:
 *   Các bảng dùng khoá chính BIGSERIAL (do Prisma `autoincrement()` tạo ra).
 *   Script seed chèn bản ghi với khoá chính CHỈ ĐỊNH TƯỜNG MINH
 *   (ticketId: 1n, 2n, ...; technicianId: 1n, ...). Khi giá trị sequence được
 *   chỉ định tay, PostgreSQL KHÔNG tự tăng sequence tương ứng.
 *   Hệ quả: sau khi seed, sequence vẫn đứng ở giá trị 1, trong khi bảng đã có
 *   bản ghi `id = 1`. Lần `create()` đầu tiên sinh ra `id = 1` -> trùng khoá
 *   chính -> Prisma trả P2002 -> API trả HTTP 500 cho mọi lệnh tạo phiếu mới
 *   và tạo kỹ thuật viên mới.
 *
 * CÁCH SỬA:
 *   Sau khi nạp xong dữ liệu mẫu, đặt lại mỗi sequence về `MAX(cột) + 1`
 *   bằng `setval(..., false)` (false = lần gọi `nextval` kế tiếp sẽ trả về
 *   đúng giá trị vừa đặt). Lệnh này IDEMPOTENT — chạy lại nhiều lần vẫn cho
 *   cùng kết quả, không nhân đôi dữ liệu (đáp ứng mục C8 của BT3).
 *
 * Hàm này được tách riêng (không gắn với `prisma/seed.js`) để CÓ THỂ kiểm thử
 * bằng unit test mà không cần CSDL thật — xem tests/bt3-bugfix.test.js.
 */

/**
 * Danh sách bảng có khoá chính BIGSERIAL/serial cần đồng bộ sequence.
 * `column` = tên cột khoá chính; `seq` = tên sequence do Prisma/PostgreSQL tạo.
 */
const SEQUENCE_TABLES = [
  { table: 'service_center', column: 'center_id' },
  { table: 'issue_category', column: 'category_id' },
  { table: 'technician', column: 'technician_id' },
  { table: 'customer', column: 'customer_id' },
  { table: 'device', column: 'device_id' },
  { table: 'ticket', column: 'ticket_id' }
];

/**
 * Đặt lại sequence của mỗi bảng về MAX(cột) + 1.
 *
 * @param {object} prisma PrismaClient (hoặc object tương thích có $executeRawUnsafe)
 * @returns {Promise<string[]>} danh sách bảng đã đồng bộ
 */
async function syncSequences(prisma) {
  const synced = [];

  for (const { table, column } of SEQUENCE_TABLES) {
    // pg_get_serial_sequence trả về tên sequence của cột, kể cả khi cột nằm
    // trong schema "public" (mặc định). setval(..., false) -> nextval trả về
    // đúng giá trị vừa đặt.
    const sql =
      `SELECT setval(pg_get_serial_sequence('${table}', '${column}'), ` +
      `COALESCE((SELECT MAX(${column}) FROM ${table}), 0) + 1, false)`;

    await prisma.$executeRawUnsafe(sql);
    synced.push(table);
  }

  return synced;
}

module.exports = {
  SEQUENCE_TABLES,
  syncSequences
};
