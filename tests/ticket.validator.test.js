const {
  validateCreateTicket,
  validateAssignTechnician,
  validateTransitionStatus
} = require('../src/validators/ticket.validator');
const { AppError } = require('../src/errors/AppError');

describe('TicketValidator - Kiểm tra dữ liệu đầu vào (Tầng 1 - Syntactic Validation)', () => {
  test('TC-VAL-1: Dữ liệu tiếp nhận hợp lệ trả về payload chuẩn hóa', () => {
    const validBody = {
      customerId: 1,
      deviceId: 2,
      centerId: 2,
      categoryId: 1,
      issueDesc: 'Màn hình bị nứt kính và liệt cảm ứng hàng dưới',
      priority: 'CAO'
    };

    const result = validateCreateTicket(validBody);
    expect(result.customerId).toBe(1);
    expect(result.priority).toBe('CAO');
    expect(result.issueDesc).toBe(validBody.issueDesc);
  });

  test('TC-VAL-2: Thiếu trường bắt buộc ném lỗi DU_LIEU_KHONG_HOP_LE kèm danh sách chi tiết các trường', () => {
    const invalidBody = {
      customerId: 1
      // Thiếu deviceId, centerId, issueDesc, priority
    };

    expect(() => validateCreateTicket(invalidBody)).toThrow(AppError);

    try {
      validateCreateTicket(invalidBody);
    } catch (err) {
      expect(err.code).toBe('DU_LIEU_KHONG_HOP_LE');
      expect(Array.isArray(err.chiTiet)).toBe(true);
      const fields = err.chiTiet.map(e => e.field);
      expect(fields).toContain('deviceId');
      expect(fields).toContain('centerId');
      expect(fields).toContain('issueDesc');
      expect(fields).toContain('priority');
    }
  });

  test('TC-VAL-3: Mô tả sự cố dưới 10 ký tự bị từ chối', () => {
    const shortDesc = {
      customerId: 1,
      deviceId: 2,
      centerId: 2,
      issueDesc: 'Hỏng máy', // 8 ký tự (< 10)
      priority: 'THAP'
    };

    expect(() => validateCreateTicket(shortDesc)).toThrow(AppError);
  });

  test('TC-VAL-4: Mức ưu tiên không thuộc CAO, TRUNG_BINH, THAP bị từ chối', () => {
    const invalidPriority = {
      customerId: 1,
      deviceId: 2,
      centerId: 2,
      issueDesc: 'Mô tả hợp lệ trên mười ký tự',
      priority: 'KHAN_CAP' // Không hợp lệ
    };

    expect(() => validateCreateTicket(invalidPriority)).toThrow(AppError);
  });

  test('TC-VAL-5: Trạng thái chuyển đổi không thuộc danh mục 7 trạng thái bị từ chối', () => {
    expect(() => validateTransitionStatus({ status: 'DANG_GIAO_HANG' })).toThrow(AppError);
    expect(validateTransitionStatus({ status: 'HOAN_TAT' }).status).toBe('HOAN_TAT');
  });
});

