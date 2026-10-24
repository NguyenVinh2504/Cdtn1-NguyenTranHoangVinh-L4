import React, { useState, useEffect } from 'react';
import { fetchCandidatesForTicket } from '../api/technicians.api';
import { assignTechnician, scheduleAppointment } from '../api/tickets.api';
import { DataState } from '../components/DataState';
import {
  X,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Award,
  Briefcase,
  Star,
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';

export function AssignTechnicianModal({ ticket, onClose, onSuccess }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTechId, setSelectedTechId] = useState('');
  const [note, setNote] = useState('Phân công xử lý bảo hành');
  const [scheduleDate, setScheduleDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidatesForTicket(ticket.ticketId);
      const list = data?.candidates || [];
      setCandidates(list);
      if (list.length > 0) {
        // Tự động chọn KTV có workload thấp nhất (Cân bằng tải V3)
        setSelectedTechId(String(list[0].technicianId));
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticket) {
      loadCandidates();
    }
  }, [ticket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      setSubmitError('Vui lòng chọn một kỹ thuật viên để tiếp tục');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Phân công KTV (Nghiệp vụ cốt lõi)
      await assignTechnician(ticket.ticketId, {
        technicianId: Number(selectedTechId),
        note
      });

      // 2. Nếu có chọn lịch hẹn thì cập nhật lịch hẹn
      if (scheduleDate) {
        await scheduleAppointment(ticket.ticketId, {
          appointmentAt: new Date(scheduleDate).toISOString(),
          appointmentStatus: 'SCHEDULED'
        });
      }

      onSuccess();
    } catch (err) {
      setSubmitError(err.message || 'Lỗi khi phân công kỹ thuật viên');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Điều phối Kỹ thuật viên & Lịch hẹn
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                  Luồng L4
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Phiếu: <strong className="font-mono text-blue-700">{ticket.ticketCode}</strong> — Thiết bị: {ticket.device?.productName}
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

        {/* Nội dung form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tóm tắt thông tin phiếu */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium text-slate-500">Khách hàng & Thiết bị:</span>
              <span className="font-semibold text-slate-800">
                {ticket.customer?.fullName} • {ticket.device?.productName} (SN: {ticket.device?.serialNo})
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium text-slate-500">Sự cố ghi nhận:</span>
              <span className="font-semibold text-slate-800 truncate max-w-sm">{ticket.issueDesc}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-slate-600">
              <span className="font-medium text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Mức ưu tiên & SLA:
              </span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50">
                {ticket.priority} • Hạn chót: {new Date(ticket.dueDate).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Banner lỗi submit nếu có */}
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="font-semibold">{submitError}</div>
            </div>
          )}

          {/* Danh sách KTV đủ điều kiện */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Chọn Kỹ thuật viên trực (QT-08: proficiency ≥ 3, cùng TT2)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Sắp xếp theo khối lượng tải tăng dần
              </span>
            </div>

            <DataState
              loading={loading}
              error={error}
              data={candidates}
              onRetry={loadCandidates}
              emptyMessage="Không tìm thấy kỹ thuật viên nào tại trung tâm đạt chuẩn tay nghề (proficiency ≥ 3) hoặc đang rảnh."
            >
              {(techList) => (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {techList.map((tech, idx) => {
                    const isSelected = selectedTechId === String(tech.technicianId);
                    const isRecommended = idx === 0;
                    const workloadPercent = Math.min(100, Math.round((tech.workload / 8) * 100));

                    return (
                      <label
                        key={tech.technicianId}
                        className={`relative flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <input
                            type="radio"
                            name="technician"
                            value={tech.technicianId}
                            checked={isSelected}
                            onChange={(e) => setSelectedTechId(e.target.value)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900">
                                {tech.fullName}
                              </p>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                {tech.employeeId}
                              </span>
                              {isRecommended && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/80">
                                  <Sparkles className="w-3 h-3 text-emerald-500" />
                                  Gợi ý tối ưu
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 mt-1 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1 font-semibold text-amber-700">
                                <Award className="w-3.5 h-3.5 text-amber-500" />
                                Bậc {tech.proficiency}/5 ({tech.level})
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-600">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                Đang giữ: <strong className="text-slate-800">{tech.workload}</strong> / 8 phiếu mở
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Thanh đo tải công việc Workload Bar */}
                        <div className="text-right flex flex-col items-end min-w-[90px]">
                          <div className="w-20 bg-slate-200/70 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all rounded-full ${
                                tech.workload <= 3
                                  ? 'bg-emerald-500'
                                  : tech.workload <= 6
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.max(8, workloadPercent)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 mt-1">
                            {workloadPercent}% tải ({tech.workload}/8)
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </DataState>
          </div>

          {/* Ghi chú phân công */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú điều phối (Lưu vào status_history JSONB):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho KTV hoặc lý do điều chuyển..."
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all text-slate-800"
            />
          </div>

          {/* Đặt lịch hẹn giao nhận máy (FR4) */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/80 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Đặt lịch hẹn giao – nhận máy với khách (FR4 - Tự động kiểm tra trùng giờ):
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-xl px-3.5 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none w-full transition-all text-slate-800"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Hệ thống tự động kiểm tra xung đột trùng giờ của KTV (mã lỗi <code className="font-mono text-rose-600 bg-rose-50 px-1 rounded">LICH_HEN_XUNG_DOT</code>) để đảm bảo không bị quá tải giờ hẹn.
            </p>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || candidates.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:shadow-lg disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Đang lưu phân công...' : 'Xác nhận phân công'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
