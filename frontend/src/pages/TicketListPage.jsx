import React, { useState, useEffect } from 'react';
import { fetchUnassignedTickets, deleteTicket } from '../api/tickets.api';
import { DataState } from '../components/DataState';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import {
  UserCheck,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  RotateCcw,
  Trash2,
  Smartphone,
  ShieldCheck,
  Flame,
  ClipboardList,
  Users,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export function TicketListPage({ onSelectTicketForAssign }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUnassignedTickets({
        centerId: 2,
        priority: filterPriority || undefined
      });
      setTickets(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filterPriority]);

  // Lọc tìm kiếm client-side theo mã phiếu hoặc thiết bị
  const filteredTickets = tickets.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticketCode?.toLowerCase().includes(q) ||
      t.device?.serialNo?.toLowerCase().includes(q) ||
      t.device?.productName?.toLowerCase().includes(q) ||
      t.customer?.fullName?.toLowerCase().includes(q) ||
      t.issueDesc?.toLowerCase().includes(q)
    );
  });

  const isFiltered = Boolean(filterPriority || searchQuery);

  const handleClearFilters = () => {
    setFilterPriority('');
    setSearchQuery('');
  };

  // Tính số giờ còn lại tới hạn cam kết SLA
  const getRemainingHours = (dueDate) => {
    const diffMs = new Date(dueDate).getTime() - Date.now();
    return Math.round(diffMs / (3600 * 1000));
  };

  // Xóa / Hủy tiếp nhận phiếu (Thao tác Delete của CRUD Entity 1)
  const handleDeleteTicket = async (ticket) => {
    const confirmDelete = window.confirm(
      `Xác nhận xóa phiếu bảo hành ${ticket.ticketCode} (${ticket.device?.productName || 'Thiết bị'})?`
    );
    if (!confirmDelete) return;

    setDeletingId(ticket.ticketId);
    try {
      await deleteTicket(ticket.ticketId, 'Quản lý hủy tiếp nhận phiếu');
      setActionMessage(`Đã xóa thành công phiếu bảo hành ${ticket.ticketCode}`);
      setTimeout(() => setActionMessage(null), 3500);
      await loadTickets();
    } catch (err) {
      alert(`Không thể xóa phiếu: ${err.message || 'Lỗi không xác định'}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Thống kê nhanh số liệu cho 4 thẻ KPI
  const urgentCount = tickets.filter(t => getRemainingHours(t.dueDate) <= 4).length;
  const highPriorityCount = tickets.filter(t => t.priority === 'CAO').length;

  return (
    <div className="space-y-6">
      {/* Banner thông báo hành động thành công */}
      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-900">×</button>
        </div>
      )}

      {/* Header & Tiêu đề trang Enterprise */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Điều phối Phiếu bảo hành
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              Trung tâm 2 Tân Bình
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Quản lý trung tâm rà soát thiết bị tiếp nhận mới, kiểm tra hạn cam kết SLA và phân công kỹ thuật viên theo tay nghề (QT-08) & tải hiện tại (QT-11).
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95 self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* 4 Thẻ KPI Stats Widget chuẩn SaaS Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng phiếu chờ */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Chờ phân công</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{tickets.length}</p>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">Tiếp nhận mới tại TT2</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Phiếu cận SLA (< 4h) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cận hạn SLA (≤ 4h)</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{urgentCount}</p>
            <p className="text-[10px] text-rose-500 font-medium mt-0.5">Cần phân công gấp</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${urgentCount > 0 ? 'bg-rose-50 border border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Ưu tiên CAO (24h) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ưu tiên CAO (24h)</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{highPriorityCount}</p>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Xử lý theo QT-04</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Kỹ thuật viên sẵn sàng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">KTV Trực sẵn sàng</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">4</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Đạt chuẩn proficiency ≥ 3</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Thanh Tìm kiếm & Bộ lọc hiện đại */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu, số serial thiết bị, tên khách hàng, lỗi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 w-full"
            >
              <option value="">Tất cả mức độ ưu tiên</option>
              <option value="CAO">Ưu tiên CAO (SLA 24h)</option>
              <option value="TRUNG_BINH">Ưu tiên TRUNG BÌNH (SLA 72h)</option>
              <option value="THAP">Ưu tiên THẤP (SLA 120h)</option>
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Danh sách phiếu bảo hành qua DataState (3 trạng thái chuẩn mực) */}
      <DataState
        loading={loading}
        error={error}
        data={filteredTickets}
        isFiltered={isFiltered}
        onRetry={loadTickets}
        onClearFilter={handleClearFilters}
      >
        {(items) => (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-5">Mã phiếu & Trạng thái</th>
                    <th className="py-3.5 px-5">Thiết bị & Khách hàng</th>
                    <th className="py-3.5 px-5">Mô tả sự cố</th>
                    <th className="py-3.5 px-5">Mức ưu tiên</th>
                    <th className="py-3.5 px-5">Hạn cam kết (SLA)</th>
                    <th className="py-3.5 px-5 text-right">Thao tác CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((t) => {
                    const remainingHours = getRemainingHours(t.dueDate);
                    const isUrgent = remainingHours <= 4;
                    const isDeleting = deletingId === t.ticketId;

                    return (
                      <tr key={t.ticketId} className="hover:bg-blue-50/40 transition-colors group">
                        {/* Cột 1: Mã phiếu & Badge */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                            {t.ticketCode}
                          </span>
                          <div className="mt-1.5">
                            <StatusBadge status={t.status} />
                          </div>
                        </td>

                        {/* Cột 2: Thiết bị & Khách hàng (Đã che SĐT theo QT-15) */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{t.device?.productName || 'Thiết bị di động'}</p>
                              <p className="text-[11px] text-slate-400 font-mono">SN: {t.device?.serialNo || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
                            <span>Khách: <strong className="text-slate-700">{t.customer?.fullName}</strong></span>
                            {t.customer?.phone && (
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5 bg-slate-50 px-1 rounded">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                {t.customer.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cột 3: Mô tả lỗi */}
                        <td className="py-4 px-5 max-w-xs">
                          <p className="text-slate-700 line-clamp-2 text-xs leading-relaxed" title={t.issueDesc}>
                            {t.issueDesc}
                          </p>
                          {t.category && (
                            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-full">
                              Lỗi: {t.category.categoryName}
                            </span>
                          )}
                        </td>

                        {/* Cột 4: Mức ưu tiên */}
                        <td className="py-4 px-5">
                          <PriorityBadge priority={t.priority} />
                        </td>

                        {/* Cột 5: Hạn SLA */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(t.dueDate).toLocaleString('vi-VN')}</span>
                          </div>
                          <div className="mt-1">
                            {isUrgent ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                Còn ~{remainingHours}h (Khẩn cấp!)
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium">
                                Còn lại: ~{remainingHours} giờ
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cột 6: Thao tác CRUD (Update & Delete) */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Nút Phân công KTV (Update) */}
                            <button
                              onClick={() => onSelectTicketForAssign(t)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:shadow-md active:scale-95"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Phân công KTV</span>
                            </button>

                            {/* Nút Hủy / Xóa phiếu bảo hành (Delete của CRUD Entity 1) */}
                            <button
                              onClick={() => handleDeleteTicket(t)}
                              disabled={isDeleting}
                              title="Hủy/Xóa phiếu tiếp nhận này (Thao tác Delete)"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Chân trang bảng */}
            <div className="py-3 px-5 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span>Đang hiển thị <strong>{items.length}</strong> phiếu bảo hành chờ điều phối tại trung tâm</span>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Ràng buộc QT-08: KTV proficiency ≥ 3</span>
                <span>•</span>
                <span>Ràng buộc QT-11: Cân bằng tải tối đa 8 phiếu/KTV</span>
              </div>
            </div>
          </div>
        )}
      </DataState>
    </div>
  );
}
