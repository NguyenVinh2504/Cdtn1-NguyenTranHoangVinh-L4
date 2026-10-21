/**
 * phoneMasker: Middleware che số điện thoại khách hàng theo QT-15 và NFR2.
 * Vai trò Kỹ thuật viên (TECHNICIAN) chỉ thấy dạng: 090****567
 * Quản lý trung tâm (CENTER_MANAGER) và Ban giám đốc thấy định dạng đầy đủ.
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  const cleaned = phone.trim();
  if (cleaned.length === 10) {
    return cleaned.slice(0, 3) + '****' + cleaned.slice(7);
  }
  return cleaned.replace(/(\d{3})\d+(\d{3})/, '$1****$2');
}

function maskPhonesInObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => maskPhonesInObject(item));
  }

  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (key.toLowerCase().includes('phone') && typeof result[key] === 'string') {
      result[key] = maskPhone(result[key]);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = maskPhonesInObject(result[key]);
    }
  }
  return result;
}

function phoneMasker(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const isTechRole =
      req.user?.role === 'TECHNICIAN' ||
      req.headers['x-user-role'] === 'TECHNICIAN';
    const isTechEndpoint =
      req.originalUrl?.includes('/technician') ||
      req.path?.includes('/technician');

    // Che số điện thoại nếu người dùng là TECHNICIAN hoặc đang truy xuất luồng KTV (QT-15, NFR2)
    if ((isTechRole || isTechEndpoint) && body) {
      const maskedBody = maskPhonesInObject(body);
      return originalJson(maskedBody);
    }
    return originalJson(body);
  };

  next();
}

module.exports = {
  maskPhone,
  phoneMasker
};

