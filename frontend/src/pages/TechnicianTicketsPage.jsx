import React, { useState, useEffect } from 'react';
import { fetchTechnicianTickets, transitionTicketStatus } from '../api/tickets.api';
import { DataState } from '../components/DataState';
import { PriorityBadge, StatusBadge, SegmentBadge } from '../components/Badge';
import StatusTransitionModal from './StatusTransitionModal';
import TicketDetailModal from './TicketDetailModal';
import { Toast } from '../components/Toast';
import { formatDateTime, getSlaInfo } from '../utils/date';
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
  Briefcase,
  Search,
  Filter,
  Eye,
  X
} from 'lucide-react';

export function TechnicianTicketsPage({ currentUserId = 3 }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc trạng thái & tìm kiếm
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | DA_PHAN_CONG | DANG_XU_LY | CHO_LINH_KIEN | HOAN_TAT
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Trạng thái chuyển đổi
  const [transitioningTicket, setTransitioningTicket] = useState(null);
  const [targetStatus, setTargetStatus] = useState(null);
  const [defaultNote, setDefaultNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [toast, setToast] = useState(null);

  const loadMyTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTechnicianTickets({
        technicianId: currentUserId
      });
      setTickets(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTickets();
  }, [currentUserId]);

  const handleOpenTransitionModal = (ticket, nextStatus, note) => {
    setTransitioningTicket(ticket);
    setTargetStatus(nextStatus);
    setDefaultNote(note);
  };

  const handleConfirmTransition = async (ticketId, nextStatus, note) => {
    setActionLoading(true);
    try {
      await transitionTicketStatus(ticketId, {
        status: nextStatus,
        note
      });
      setToast({
        type: 'success',
        title: 'Thành công',
        message: `Đã cập nhật trạng thái phiếu sang '${nextStatus}'`
      });
      setTransitioningTicket(null);
      await loadMyTickets();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Lỗi cập nhật tiến độ',
        message: err.message || 'Lỗi khi chuyển trạng thái phiếu'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpand = (ticketId) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
  };

  // Lọc tickets theo statusFilter và searchQuery
  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      t.ticketCode?.toLowerCase().includes(q) ||
      t.device?.serialNo?.toLowerCase().includes(q) ||
      t.device?.productName?.toLowerCase().includes(q) ||
      t.customer?.fullName?.toLowerCase().includes(q) ||
      t.issueDesc?.toLowerCase().includes(q)
    );
  });

  const isFiltered = statusFilter !== 'ALL' || Boolean(searchQuery);

  // Thống kê nhanh của KTV
  const assignedCount = tickets.filter(t => t.status === 'DA_PHAN_CONG').length;
  const inProgressCount = tickets.filter(t => t.status === 'DANG_XU_LY').length;
  const waitingPartsCount = tickets.filter(t => t.status === 'CHO_LINH_KIEN').length;
  const completedCount = tickets.filter(t => t.status === 'HOAN_TAT').length;

  return (
    <div className="space-y-6">
      {/* Toast thông báo nổi */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header trang Kỹ thuật viên */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Không gian Kỹ thuật viên
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              KTV #{currentUserId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi thiết bị được giao xử lý theo hạn SLA tăng dần, cập nhật tiến độ tuần tự QT-06 và bảo mật QT-15.
          </p>
        </div>

        <button
          onClick={loadMyTickets}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 4 Thẻ thống kê nhanh của KTV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tổng phiếu được giao</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{tickets.length}</span>
            <span className="text-xs text-slate-500 font-normal">phiếu</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Sắp xếp theo hạn SLA tăng dần</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Đang thực hiện sửa</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{inProgressCount}</span>
            <span className="text-xs text-slate-500 font-normal">máy</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${inProgressCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <span>Trạng thái DANG_XU_LY</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Chờ linh kiện kho</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <PauseCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{waitingPartsCount}</span>
            <span className="text-xs text-slate-500 font-normal">máy</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>Trạng thái CHO_LINH_KIEN</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Đã sửa hoàn tất</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{completedCount}</span>
            <span className="text-xs text-slate-500 font-normal">hoàn thành</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Sẵn sàng giao trả khách</span>
          </div>
        </div>
      </div>

      {/* Tabs lọc trạng thái & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { key: 'ALL', label: `Tất cả (${tickets.length})` },
            { key: 'DA_PHAN_CONG', label: `Chờ tiếp nhận (${assignedCount})` },
            { key: 'DANG_XU_LY', label: `Đang sửa (${inProgressCount})` },
            { key: 'CHO_LINH_KIEN', label: `Chờ linh kiện (${waitingPartsCount})` },
            { key: 'HOAN_TAT', label: `Đã xong (${completedCount})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm mã phiếu, serial, máy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Danh sách phiếu của KTV qua DataState */}
      <DataState
        loading={loading}
        error={error}
        data={filteredTickets}
        isFiltered={isFiltered}
        onRetry={loadMyTickets}
        onClearFilter={() => {
          setStatusFilter('ALL');
          setSearchQuery('');
        }}
        emptyMessage="Hiện bạn chưa có phiếu bảo hành nào được phân công. Hãy chờ Quản lý trung tâm điều phối."
      >
        {(items) => (
          <div className="space-y-4">
            {items.map((t) => {
              const isExpanded = expandedTicketId === t.ticketId;
              const historyList = Array.isArray(t.statusHistory) ? t.statusHistory : [];
              const sla = getSlaInfo(t.dueDate);

              return (
                <div
                  key={t.ticketId}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300 group"
                >
                  <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Thông tin chính */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          {t.ticketCode}
                        </span>
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {t.device?.productName || 'Thiết bị di động'}{" "}
                          <span className="font-mono text-slate-400 font-normal text-xs ml-1">
                            (SN: {t.device?.serialNo})
                          </span>
                        </h3>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                        <strong className="text-slate-900">Sự cố ghi nhận:</strong> {t.issueDesc}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="font-medium text-slate-700">
                          Khách hàng: <strong>{t.customer?.fullName}</strong>
                        </span>
                        {t.customer?.segment && <SegmentBadge segment={t.customer.segment} />}
                        {t.customer?.phone && (
                          <span className="flex items-center gap-1 text-slate-600 font-mono bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            SĐT bảo mật (QT-15): <strong>{t.customer.phone}</strong>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Hạn cam kết SLA: <strong>{formatDateTime(t.dueDate)}</strong> ({sla.label})
                        </span>
                      </div>
                    </div>

                    {/* Các nút cập nhật trạng thái nghiệp vụ chuẩn QT-06 */}
                    <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-2 w-full lg:w-auto">
                      {t.status === 'DA_PHAN_CONG' && (
                        <button
                          onClick={() => handleOpenTransitionModal(t, 'DANG_XU_LY', 'KTV tiếp nhận và bắt đầu kiểm tra sửa chữa')}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Bắt đầu sửa chữa</span>
                        </button>
                      )}

                      {t.status === 'DANG_XU_LY' && (
                        <>
                          <button
                            onClick={() => handleOpenTransitionModal(t, 'CHO_LINH_KIEN', 'Chờ đặt linh kiện thay thế từ kho')}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Chờ linh kiện</span>
                          </button>
                          <button
                            onClick={() => handleOpenTransitionModal(t, 'HOAN_TAT', 'Sửa chữa và kiểm tra chức năng hoàn tất 100%')}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-2xl shadow-sm shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Hoàn tất sửa</span>
                          </button>
                        </>
                      )}

                      {t.status === 'CHO_LINH_KIEN' && (
                        <button
                          onClick={() => handleOpenTransitionModal(t, 'DANG_XU_LY', 'Đã có linh kiện mới, tiếp tục kiểm tra xử lý')}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Tiếp tục xử lý</span>
                        </button>
                      )}

                      {t.status === 'HOAN_TAT' && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-2xl border border-emerald-200 text-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Đã sửa xong hoàn tất
                        </span>
                      )}

                      {/* Nút Xem chi tiết */}
                      <button
                        onClick={() => setViewingTicket(t)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-2xl transition-all border border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Chi tiết</span>
                      </button>

                      {/* Nút Lịch sử Timeline */}
                      <button
                        onClick={() => toggleExpand(t.ticketId)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-2xl transition-all border border-slate-200"
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
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-slate-800">
                                    {log.from ? `${log.from} → ` : 'Khởi tạo tiếp nhận: '}
                                    <span className="text-blue-700 font-black">{log.to}</span>
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {formatDateTime(log.at)}
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

      {/* Modal Chuyển trạng thái có nhập ghi chú */}
      {transitioningTicket && (
        <StatusTransitionModal
          ticket={transitioningTicket}
          nextStatus={targetStatus}
          defaultNote={defaultNote}
          loading={actionLoading}
          onClose={() => setTransitioningTicket(null)}
          onSubmit={handleConfirmTransition}
        />
      )}

      {/* Modal Chi tiết Phiếu */}
      {viewingTicket && (
        <TicketDetailModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
        />
      )}
    </div>
  );
}
