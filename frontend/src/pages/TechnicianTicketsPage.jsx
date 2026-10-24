import React, { useState, useEffect } from 'react';
import { fetchTechnicianTickets, transitionTicketStatus } from '../api/tickets.api';
import { DataState } from '../components/DataState';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import {
  Wrench,
  Clock,
  Play,
  CheckCircle,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  History,
  Phone,
  RotateCcw,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  CalendarClock,
  Briefcase
} from 'lucide-react';

// Hàm che số điện thoại khách hàng dự phòng theo QT-15 (090****567)
function maskPhoneDisplay(phone) {
  if (!phone || typeof phone !== 'string') return '090****567';
  const trimmed = phone.trim();
  if (trimmed.includes('****')) return trimmed; // Đã được backend che
  if (trimmed.length === 10) {
    return trimmed.slice(0, 3) + '****' + trimmed.slice(7);
  }
  return trimmed.replace(/(\d{3})\d+(\d{3})/, '$1****$2');
}

export function TechnicianTicketsPage({ currentUserId = 5 }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadMyTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTechnicianTickets({
        technicianId: currentUserId
      });
      setTickets(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTickets();
  }, [currentUserId]);

  const handleStatusTransition = async (ticketId, nextStatus, defaultNote) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await transitionTicketStatus(ticketId, {
        status: nextStatus,
        note: defaultNote
      });
      setSuccessMsg(`Đã cập nhật trạng thái phiếu sang '${nextStatus}'`);
      setTimeout(() => setSuccessMsg(null), 3500);
      await loadMyTickets();
    } catch (err) {
      setActionError(err.message || 'Lỗi khi chuyển trạng thái phiếu');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpand = (ticketId) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
  };

  // Thống kê nhanh của KTV
  const inProgressCount = tickets.filter(t => t.status === 'DANG_XU_LY').length;
  const waitingPartsCount = tickets.filter(t => t.status === 'CHO_LINH_KIEN').length;

  return (
    <div className="space-y-6">
      {/* Banner thông báo thành công */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">×</button>
        </div>
      )}

      {/* Header trang Kỹ thuật viên */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Không gian Kỹ thuật viên
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              KTV ID: {currentUserId} • Đang nhận nhiệm vụ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Theo dõi danh sách thiết bị được giao xử lý theo hạn SLA tăng dần, cập nhật tiến độ tuần tự (QT-06) và bảo mật thông tin khách hàng (QT-15).
          </p>
        </div>

        <button
          onClick={loadMyTickets}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95 self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* 3 Thẻ thống kê nhanh của KTV */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tổng phiếu được giao</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{tickets.length}</p>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">Sắp xếp theo hạn cam kết SLA</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Đang thực hiện sửa chữa</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{inProgressCount}</p>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Trạng thái DANG_XU_LY</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Chờ linh kiện từ kho</p>
            <p className="text-2xl font-black text-purple-600 mt-0.5">{waitingPartsCount}</p>
            <p className="text-[10px] text-purple-600 font-medium mt-0.5">Trạng thái CHO_LINH_KIEN</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <PauseCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="font-semibold">{actionError}</span>
        </div>
      )}

      {/* Danh sách phiếu của KTV qua DataState */}
      <DataState
        loading={loading}
        error={error}
        data={tickets}
        onRetry={loadMyTickets}
        emptyMessage="Hiện bạn chưa có phiếu bảo hành nào được phân công. Hãy chờ Quản lý trung tâm điều phối."
      >
        {(items) => (
          <div className="space-y-4">
            {items.map((t) => {
              const isExpanded = expandedTicketId === t.ticketId;
              const historyList = Array.isArray(t.statusHistory) ? t.statusHistory : [];

              return (
                <div
                  key={t.ticketId}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:border-slate-300 group"
                >
                  <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Thông tin chính */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {t.ticketCode}
                        </span>
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {t.device?.productName || 'Thiết bị di động'} — <span className="font-mono text-slate-400 font-normal text-xs">SN: {t.device?.serialNo}</span>
                        </h3>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        <strong className="text-slate-800">Sự cố ghi nhận:</strong> {t.issueDesc}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="font-medium text-slate-700">
                          Khách hàng: <strong>{t.customer?.fullName}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          SĐT che (QT-15): <strong>{maskPhoneDisplay(t.customer?.phone)}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Hạn cam kết SLA: <strong>{new Date(t.dueDate).toLocaleString('vi-VN')}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Các nút cập nhật trạng thái nghiệp vụ chuẩn QT-06 */}
                    <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-2 w-full lg:w-auto">
                      {t.status === 'DA_PHAN_CONG' && (
                        <button
                          onClick={() => handleStatusTransition(t.ticketId, 'DANG_XU_LY', 'KTV tiếp nhận và bắt đầu kiểm tra sửa chữa')}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Bắt đầu sửa chữa</span>
                        </button>
                      )}

                      {t.status === 'DANG_XU_LY' && (
                        <>
                          <button
                            onClick={() => handleStatusTransition(t.ticketId, 'CHO_LINH_KIEN', 'Chờ đặt linh kiện thay thế từ kho')}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Chờ linh kiện</span>
                          </button>
                          <button
                            onClick={() => handleStatusTransition(t.ticketId, 'HOAN_TAT', 'Sửa chữa và kiểm tra chức năng hoàn tất')}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Hoàn tất sửa</span>
                          </button>
                        </>
                      )}

                      {t.status === 'CHO_LINH_KIEN' && (
                        <button
                          onClick={() => handleStatusTransition(t.ticketId, 'DANG_XU_LY', 'Đã có linh kiện, tiếp tục kiểm tra xử lý')}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Tiếp tục xử lý</span>
                        </button>
                      )}

                      {t.status === 'HOAN_TAT' && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 text-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Đã sửa xong hoàn tất
                        </span>
                      )}

                      {/* Nút xem chi tiết Timeline JSONB */}
                      <button
                        onClick={() => toggleExpand(t.ticketId)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-200 shadow-sm"
                      >
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>Lịch sử ({historyList.length})</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Vùng mở rộng: Nhật ký lịch sử JSONB status_history dạng Timeline */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 p-5 border-t border-slate-200/80 space-y-3 animate-in slide-in-from-top-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <History className="w-4 h-4 text-blue-600" />
                          Nhật ký chuyển trạng thái (Cột JSONB status_history trong bảng ticket):
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">Bất biến append-only</span>
                      </div>

                      {historyList.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">Chưa có nhật ký nào được ghi nhận.</p>
                      ) : (
                        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
                          {historyList.map((log, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-300"></div>
                              <div className="text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">
                                    {log.from ? `${log.from} → ` : 'Khởi tạo tiếp nhận: '}
                                    <span className="text-blue-700 font-black">{log.to}</span>
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {log.at ? new Date(log.at).toLocaleString('vi-VN') : 'N/A'}
                                  </span>
                                </div>
                                {log.note && (
                                  <p className="text-xs text-slate-600 mt-1 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs font-medium">
                                    "{log.note}"
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DataState>
    </div>
  );
}
