import React, { useState, useEffect } from "react";
import { fetchCandidatesForTicket } from "../api/technicians.api";
import { assignTechnician, scheduleAppointment } from "../api/tickets.api";
import { DataState } from "../components/DataState";
import { formatDateTime, toDateTimeLocalValue } from "../utils/date";
import {
  X,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Award,
  Briefcase,
  Sparkles,
  Clock
} from "lucide-react";

export function AssignTechnicianModal({ ticket, onClose, onSuccess }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTechId, setSelectedTechId] = useState("");
  const [note, setNote] = useState("Phân công kỹ thuật viên xử lý bảo hành");
  const [scheduleDate, setScheduleDate] = useState("");
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
      setSubmitError("Vui lòng chọn một kỹ thuật viên để tiếp tục");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await assignTechnician(ticket.ticketId, {
        technicianId: Number(selectedTechId),
        note: note.trim() || "Phân công kỹ thuật viên xử lý bảo hành"
      });

      if (scheduleDate) {
        const apptDate = new Date(scheduleDate);
        if (isNaN(apptDate.getTime())) {
          throw new Error("Thời gian hẹn không hợp lệ.");
        }
        await scheduleAppointment(ticket.ticketId, {
          appointmentAt: apptDate.toISOString(),
          appointmentStatus: "SCHEDULED"
        });
      }

      onSuccess();
    } catch (err) {
      setSubmitError(err.message || "Lỗi khi phân công kỹ thuật viên");
    } finally {
      setSubmitting(false);
    }
  };

  const nowMin = toDateTimeLocalValue(new Date());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Phân công Kỹ thuật viên
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phiếu: <span className="font-mono font-semibold text-blue-600">{ticket.ticketCode}</span> • {ticket.device?.productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Thông tin tóm tắt phiếu */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-500">Khách & Thiết bị:</span>
              <span className="font-medium text-slate-800">
                {ticket.customer?.fullName} • {ticket.device?.productName}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-500">Hạn cam kết SLA:</span>
              <span className="font-medium text-slate-800">{formatDateTime(ticket.dueDate)}</span>
            </div>
          </div>

          {/* Banner lỗi nếu có */}
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{submitError}</span>
            </div>
          )}

          {/* Danh sách KTV */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Kỹ thuật viên đủ chuẩn (bậc ≥ 3, TT2)
              </label>
              <span className="text-[11px] text-slate-400">
                Ưu tiên tải thấp nhất
              </span>
            </div>

            <DataState
              loading={loading}
              error={error}
              data={candidates}
              onRetry={loadCandidates}
              emptyMessage="Không tìm thấy kỹ thuật viên nào tại trung tâm đạt chuẩn tay nghề."
            >
              {(techList) => (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {techList.map((tech, idx) => {
                    const isSelected = selectedTechId === String(tech.technicianId);
                    const isRecommended = idx === 0;
                    const workloadPercent = Math.min(100, Math.round((tech.workload / 8) * 100));

                    return (
                      <label
                        key={tech.technicianId}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="technician"
                            value={tech.technicianId}
                            checked={isSelected}
                            onChange={(e) => setSelectedTechId(e.target.value)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{tech.fullName}</span>
                              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-slate-100">
                                {tech.employeeId}
                              </span>
                              {isRecommended && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                  Tải tối ưu
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span className="font-medium text-amber-700">
                                Bậc {tech.proficiency}/5 ({tech.level})
                              </span>
                              <span>•</span>
                              <span>Đang giữ: <strong>{tech.workload}</strong>/8 phiếu</span>
                            </div>
                          </div>
                        </div>

                        {/* Thanh đo tải */}
                        <div className="text-right flex flex-col items-end min-w-[70px]">
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                tech.workload <= 3
                                  ? "bg-emerald-500"
                                  : tech.workload <= 6
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.max(10, workloadPercent)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5">{tech.workload}/8</span>
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
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Ghi chú phân công:
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho KTV hoặc lý do điều chuyển..."
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* Đặt lịch hẹn */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Lịch hẹn khách hàng (Tùy chọn):
              </label>
              {scheduleDate && (
                <button
                  type="button"
                  onClick={() => setScheduleDate("")}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Xóa hẹn
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              min={nowMin}
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-slate-800"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || candidates.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? "Đang lưu..." : "Xác nhận phân công"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignTechnicianModal;

