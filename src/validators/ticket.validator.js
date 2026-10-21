const { AppError } = require('../errors/AppError');

const VALID_PRIORITIES = ['CAO', 'TRUNG_BINH', 'THAP'];
const VALID_STATUSES = [
  'MOI',
  'DA_PHAN_CONG',
  'DANG_XU_LY',
  'CHO_LINH_KIEN',
  'HOAN_TAT',
  'DA_DONG',
  'DA_HUY'
];

/**
 * Kiểm tra định dạng đầu vào khi tiếp nhận phiếu bảo hành mới (Tầng 1 - Syntactic Validation)
 */
function validateCreateTicket(body = {}) {
  const errors = [];

  if (!body.customerId || Number(body.customerId) <= 0) {
    errors.push({ field: 'customerId', reason: 'Mã khách hàng phải là số nguyên dương' });
  }
  if (!body.deviceId || Number(body.deviceId) <= 0) {
    errors.push({ field: 'deviceId', reason: 'Mã thiết bị phải là số nguyên dương' });
  }
  if (!body.centerId || Number(body.centerId) <= 0) {
    errors.push({ field: 'centerId', reason: 'Mã trung tâm phải là số nguyên dương' });
  }
  if (!body.issueDesc || typeof body.issueDesc !== 'string' || body.issueDesc.trim().length < 10) {
    errors.push({ field: 'issueDesc', reason: 'Mô tả sự cố phải từ 10 ký tự trở lên' });
  }
  if (!body.priority || !VALID_PRIORITIES.includes(body.priority)) {
    errors.push({ field: 'priority', reason: 'Mức ưu tiên phải là CAO, TRUNG_BINH hoặc THAP' });
  }

  if (errors.length > 0) {
    throw new AppError(
      'DU_LIEU_KHONG_HOP_LE',
      'Dữ liệu đầu vào tiếp nhận phiếu không hợp lệ',
      errors
    );
  }

  return {
    customerId: Number(body.customerId),
    deviceId: Number(body.deviceId),
    centerId: Number(body.centerId),
    categoryId: body.categoryId ? Number(body.categoryId) : null,
    issueDesc: body.issueDesc.trim(),
    priority: body.priority
  };
}

/**
 * Kiểm tra tham số phân công kỹ thuật viên
 */
function validateAssignTechnician(body = {}) {
  const errors = [];

  if (!body.technicianId || Number(body.technicianId) <= 0) {
    errors.push({ field: 'technicianId', reason: 'Mã kỹ thuật viên phải là số nguyên dương' });
  }

  if (errors.length > 0) {
    throw new AppError(
      'DU_LIEU_KHONG_HOP_LE',
      'Thông tin phân công kỹ thuật viên không hợp lệ',
      errors
    );
  }

  return {
    technicianId: Number(body.technicianId),
    note: body.note ? String(body.note).trim() : 'Phân công kỹ thuật viên'
  };
}

/**
 * Kiểm tra tham số chuyển đổi trạng thái
 */
function validateTransitionStatus(body = {}) {
  const errors = [];

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    errors.push({
      field: 'status',
      reason: `Trạng thái mới không hợp lệ. Phải thuộc: ${VALID_STATUSES.join(', ')}`
    });
  }

  if (errors.length > 0) {
    throw new AppError(
      'DU_LIEU_KHONG_HOP_LE',
      'Trạng thái chuyển đổi không hợp lệ',
      errors
    );
  }

  return {
    status: body.status,
    note: body.note ? String(body.note).trim() : null
  };
}

/**
 * Kiểm tra tham số đặt lịch hẹn
 */
function validateScheduleAppointment(body = {}) {
  const errors = [];

  if (!body.appointmentAt) {
    errors.push({ field: 'appointmentAt', reason: 'Thời gian hẹn không được để trống' });
  } else {
    const d = new Date(body.appointmentAt);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'appointmentAt', reason: 'Thời gian hẹn phải là định dạng ngày giờ ISO hợp lệ' });
    }
  }

  if (errors.length > 0) {
    throw new AppError(
      'DU_LIEU_KHONG_HOP_LE',
      'Thông tin lịch hẹn không hợp lệ',
      errors
    );
  }

  return {
    appointmentAt: new Date(body.appointmentAt),
    appointmentStatus: body.appointmentStatus || 'SCHEDULED'
  };
}

module.exports = {
  VALID_PRIORITIES,
  VALID_STATUSES,
  validateCreateTicket,
  validateAssignTechnician,
  validateTransitionStatus,
  validateScheduleAppointment
};

