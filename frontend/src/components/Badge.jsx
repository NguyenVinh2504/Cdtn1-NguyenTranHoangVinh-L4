import React from 'react';
import { Flame, Clock, Minus, Crown, Sparkles, User, Wrench, PauseCircle, CheckCircle2, XCircle, Archive } from 'lucide-react';

export function PriorityBadge({ priority }) {
  const map = {
    CAO: {
      label: 'Ưu tiên Cao',
      sla: '24h',
      icon: Flame,
      class: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    TRUNG_BINH: {
      label: 'Ưu tiên Vừa',
      sla: '72h',
      icon: Clock,
      class: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    THAP: {
      label: 'Ưu tiên Thấp',
      sla: '120h',
      icon: Minus,
      class: 'bg-slate-50 text-slate-600 border-slate-200'
    }
  };

  const current = map[priority] || {
    label: priority || 'Thường',
    sla: '',
    icon: Clock,
    class: 'bg-slate-50 text-slate-600 border-slate-200'
  };

  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${current.class}`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{current.label}</span>
      {current.sla && <span className="opacity-75 text-[10px]">({current.sla})</span>}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    MOI: {
      label: 'Chờ phân công',
      class: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-500'
    },
    DA_PHAN_CONG: {
      label: 'Đã phân công',
      class: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dotClass: 'bg-indigo-500'
    },
    DANG_XU_LY: {
      label: 'Đang sửa chữa',
      class: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500 animate-pulse'
    },
    CHO_LINH_KIEN: {
      label: 'Chờ linh kiện',
      class: 'bg-purple-50 text-purple-700 border-purple-200',
      dotClass: 'bg-purple-500'
    },
    HOAN_TAT: {
      label: 'Đã hoàn tất',
      class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500'
    },
    DA_DONG: {
      label: 'Đã đóng',
      class: 'bg-slate-100 text-slate-600 border-slate-200',
      dotClass: 'bg-slate-400'
    },
    DA_HUY: {
      label: 'Đã hủy',
      class: 'bg-rose-50 text-rose-600 border-rose-200',
      dotClass: 'bg-rose-400'
    }
  };

  const current = map[status] || {
    label: status || 'N/A',
    class: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${current.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dotClass}`}></span>
      <span>{current.label}</span>
    </span>
  );
}

export function SegmentBadge({ segment }) {
  if (segment === 'VIP') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
        <span>VIP</span>
      </span>
    );
  }

  if (segment === 'THUONG_XUYEN') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
        Thường xuyên
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-normal bg-slate-50 text-slate-600 border border-slate-200">
      {segment || 'Mới'}
    </span>
  );
}

export default { PriorityBadge, StatusBadge, SegmentBadge };
