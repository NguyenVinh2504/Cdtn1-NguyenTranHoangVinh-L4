import React from 'react';

export function PriorityBadge({ priority }) {
  const map = {
    CAO: { label: 'Ưu tiên Cao (24h)', class: 'bg-red-100 text-red-800 border-red-200' },
    TRUNG_BINH: { label: 'Ưu tiên Vừa (72h)', class: 'bg-amber-100 text-amber-800 border-amber-200' },
    THAP: { label: 'Ưu tiên Thấp (120h)', class: 'bg-slate-100 text-slate-800 border-slate-200' }
  };

  const current = map[priority] || { label: priority, class: 'bg-slate-100 text-slate-800 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.class}`}>
      {current.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    MOI: { label: 'Chờ phân công', class: 'bg-blue-100 text-blue-800 border-blue-200' },
    DA_PHAN_CONG: { label: 'Đã phân công', class: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    DANG_XU_LY: { label: 'Đang xử lý', class: 'bg-amber-100 text-amber-800 border-amber-200' },
    CHO_LINH_KIEN: { label: 'Chờ linh kiện', class: 'bg-purple-100 text-purple-800 border-purple-200' },
    HOAN_TAT: { label: 'Hoàn tất', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    DA_DONG: { label: 'Đã đóng phiếu', class: 'bg-slate-200 text-slate-700 border-slate-300' },
    DA_HUY: { label: 'Đã hủy', class: 'bg-rose-100 text-rose-800 border-rose-200' }
  };

  const current = map[status] || { label: status, class: 'bg-slate-100 text-slate-800 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.class}`}>
      {current.label}
    </span>
  );
}

