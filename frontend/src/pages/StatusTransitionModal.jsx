import React, { useState } from 'react';
import { StatusBadge } from '../components/Badge';
import {
  X,
  Wrench,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  Play,
  ArrowRight,
  FileText
} from 'lucide-react';

export function StatusTransitionModal({
  ticket,
  nextStatus,
  defaultNote,
  onClose,
  onSubmit,
  loading
}) {
  if (!ticket || !nextStatus) return null;

  const [note, setNote] = useState(defaultNote || '');

  const quickNotes = {
    DANG_XU_LY: [
      'KTV tiếp nhận và bắt đầu kiểm tra sửa chữa',
      'Đã tháo máy kiểm tra bo mạch và linh kiện',
      'Bắt đầu đo nguồn và chuẩn đoán lỗi phần cứng'
    ],
    CHO_LINH_KIEN: [
      'Chờ nhập linh kiện thay thế từ kho trung tâm',
      'Linh kiện màn hình/pin đang được vận chuyển',
      'Chờ khách hàng duyệt báo giá linh kiện phát sinh'
    ],
    HOAN_TAT: [
      'Đã thay thế linh kiện thành công, chạy kiểm tra đạt 100%',
      'Hoàn tất sửa chữa và vệ sinh máy sạch sẽ, sẵn sàng giao khách',
      'Đã nạp lại hệ điều hành và kiểm thử các tính năng hoàn hảo'
    ]
  };

  const currentNotes = quickNotes[nextStatus] || [];

  const statusDescriptions = {
    DANG_XU_LY: 'Bắt đầu quá trình tháo lắp, đo đạc và sửa chữa thiết bị.',
    CHO_LINH_KIEN: 'Tạm dừng sửa chữa do thiếu linh kiện thay thế hoặc chờ chuyển kho.',
    HOAN_TAT: 'Thiết bị đã được sửa xong, kiểm tra QA hoàn tất và sẵn sàng trả khách.'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(ticket.ticketId, nextStatus, note.trim() || defaultNote);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Cập nhật tiến độ sửa chữa
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Phiếu: {ticket.ticketCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Chuyển trạng thái trực quan */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Vòng đời chuyển trạng thái (QT-06):
            </span>
            <div className="flex items-center gap-2.5">
              <StatusBadge status={ticket.status} />
              <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <StatusBadge status={nextStatus} />
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {statusDescriptions[nextStatus]}
            </p>
          </div>

          {/* Ghi chú nhật ký sửa chữa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Ghi chú nhật ký KTV (Lưu vào status_history JSONB):
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú kỹ thuật, linh kiện đã thay thế hoặc tình trạng máy..."
              className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all text-slate-800"
              required
            />
          </div>

          {/* Gợi ý mẫu ghi chú nhanh */}
          {currentNotes.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">
                Gợi ý mẫu ghi chú nhanh (Click để chọn):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentNotes.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNote(tmpl)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 border border-slate-200 transition-all text-left"
                  >
                    + {tmpl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Đang cập nhật...' : 'Xác nhận chuyển trạng thái'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StatusTransitionModal;

