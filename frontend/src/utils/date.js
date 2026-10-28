/**
 * Bộ tiện ích xử lý ngày tháng an toàn tuyệt đối cho Mekong CRM Frontend.
 * Đảm bảo không bao giờ crash hoặc sinh Invalid Date / NaN.
 */

export function parseDateSafe(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === 'object' && Object.keys(dateInput).length === 0 && !(dateInput instanceof Date)) {
    return null; // Bắt trường hợp object rỗng {}
  }
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function formatDateTime(dateInput, fallback = '—') {
  const d = parseDateSafe(dateInput);
  if (!d) return fallback;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function formatDate(dateInput, fallback = '—') {
  const d = parseDateSafe(dateInput);
  if (!d) return fallback;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function getSlaInfo(dueDateInput) {
  const due = parseDateSafe(dueDateInput);
  if (!due) {
    return {
      hoursRemaining: null,
      isOverdue: false,
      isUrgent: false,
      label: 'Chưa có hạn',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  }

  const diffMs = due.getTime() - Date.now();
  const hours = Math.round(diffMs / (3600 * 1000));

  if (hours < 0) {
    return {
      hoursRemaining: hours,
      isOverdue: true,
      isUrgent: true,
      label: `Quá hạn ${Math.abs(hours)}h`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse'
    };
  }

  if (hours <= 4) {
    return {
      hoursRemaining: hours,
      isOverdue: false,
      isUrgent: true,
      label: `Còn ~${hours}h (Khẩn cấp)`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
    };
  }

  return {
    hoursRemaining: hours,
    isOverdue: false,
    isUrgent: false,
    label: `Còn ~${hours} giờ`,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
  };
}

export function toDateTimeLocalValue(dateInput) {
  const d = parseDateSafe(dateInput);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

