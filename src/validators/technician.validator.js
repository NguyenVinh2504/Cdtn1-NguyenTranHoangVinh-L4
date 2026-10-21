const { AppError } = require('../errors/AppError');

const VALID_LEVELS = ['SO_CAP', 'TRUNG_CAP', 'CAO_CAP'];

function validateCreateTechnician(body = {}) {
  const errors = [];

  if (!body.employeeId || typeof body.employeeId !== 'string' || body.employeeId.trim().length < 3) {
    errors.push({ field: 'employeeId', reason: 'Mã nhân viên tối thiểu 3 ký tự' });
  }
  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length < 2) {
    errors.push({ field: 'fullName', reason: 'Họ và tên tối thiểu 2 ký tự' });
  }
  if (!body.centerId || Number(body.centerId) <= 0) {
    errors.push({ field: 'centerId', reason: 'Mã trung tâm phải là số nguyên dương' });
  }
  if (!body.level || !VALID_LEVELS.includes(body.level)) {
    errors.push({ field: 'level', reason: `Cấp bậc kỹ thuật viên phải thuộc: ${VALID_LEVELS.join(', ')}` });
  }
  const prof = Number(body.proficiency);
  if (!Number.isInteger(prof) || prof < 1 || prof > 5) {
    errors.push({ field: 'proficiency', reason: 'Điểm tay nghề (proficiency) phải là số nguyên từ 1 đến 5' });
  }

  if (errors.length > 0) {
    throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Dữ liệu kỹ thuật viên không hợp lệ', errors);
  }

  return {
    employeeId: body.employeeId.trim(),
    fullName: body.fullName.trim(),
    centerId: Number(body.centerId),
    level: body.level,
    proficiency: prof
  };
}

module.exports = {
  VALID_LEVELS,
  validateCreateTechnician
};

