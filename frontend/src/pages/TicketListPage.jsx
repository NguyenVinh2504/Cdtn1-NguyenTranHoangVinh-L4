import React, { useState, useEffect } from 'react';
import { fetchUnassignedTickets, deleteTicket } from '../api/tickets.api';
import { fetchTechnicians } from '../api/technicians.api';
import { DataState } from '../components/DataState';
import { PriorityBadge, StatusBadge, SegmentBadge } from '../components/Badge';
import TicketDetailModal from './TicketDetailModal';
import Toast from '../components/Toast';
import { formatDateTime, getSlaInfo } from '../utils/date';
import {
  UserCheck,
  Clock,
  AlertTriangle,
  Search,
  RotateCcw,
  Trash2,
  Smartphone,
  ShieldCheck,
  Flame,
  ClipboardList,
  Users,
  Eye,
  X,
  Filter
} from 'lucide-react';

export function TicketListPage({ onSelectTicketForAssign }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Danh sách KTV để tính KPI thật
  const [readyTechCount, setReadyTechCount] = useState(null);

  // Bộ lọc
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [quickFilter, setQuickFilter] = useState('ALL'); // ALL | URGENT | HIGH | SCREEN | BATTERY
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Toasts
  const [viewingTicket, setViewingTicket] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketsData, techsData] = await Promise.all([
        fetchUnassignedTickets({
          centerId: 2,
          priority: filterPriority || undefined,
          categoryId: filterCategory || undefined
        }),
        fetchTechnicians({ centerId: 2 }).catch(() => [])
      ]);

      setTickets(ticketsData || []);
      if (Array.isArray(techsData)) {
        const eligible = techsData.filter(t => t.isActive && (t.proficiency >= 3 || !t.proficiency));
        setReadyTechCount(eligible.length);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filterPriority, filterCategory]);

  // Lọc client-side kết hợp quickFilter và searchQuery
  const filteredTickets = tickets.filter(t => {
    // 1. Quick filter
    if (quickFilter === 'URGENT') {
      const sla = getSlaInfo(t.dueDate);
      if (!sla.isUrgent) return false;
    } else if (quickFilter === 'HIGH') {
      if (t.priority !== 'CAO') return false;
    } else if (quickFilter === 'SCREEN') {
      if (t.category?.categoryName !== 'MAN_HINH' && t.categoryId !== 1) return false;
    } else if (quickFilter === 'BATTERY') {
      if (t.category?.categoryName !== 'PIN' && t.categoryId !== 2) return false;
    }

    // 2. Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      t.ticketCode?.toLowerCase().includes(q) ||
      t.device?.serialNo?.toLowerCase().includes(q) ||
      t.device?.productName?.toLowerCase().includes(q) ||
      t.customer?.fullName?.toLowerCase().includes(q) ||
      t.customer?.phone?.toLowerCase().includes(q) ||
      t.category?.categoryName?.toLowerCase().includes(q) ||
      t.issueDesc?.toLowerCase().includes(q)
    );
  });

  const isFiltered = Boolean(filterPriority || filterCategory || quickFilter !== 'ALL' || searchQuery);

  const handleClearFilters = () => {
    setFilterPriority('');
    setFilterCategory('');
    setQuickFilter('ALL');
    setSearchQuery('');
  };

  // Xóa / Hủy tiếp nhận phiếu
  const handleDeleteTicket = async (ticket) => {
    const confirmDelete = window.confirm(
      `Xác nhận hủy tiếp nhận phiếu bảo hành ${ticket.ticketCode} (${ticket.device?.productName || 'Thiết bị'})?`
    );
    if (!confirmDelete) return;

    setDeletingId(ticket.ticketId);
    try {
      await deleteTicket(ticket.ticketId, 'Quản lý hủy tiếp nhận phiếu');
      setToast({
        type: 'success',
        title: 'Thành công',
        message: `Đã hủy tiếp nhận phiếu ${ticket.ticketCode}`
      });
      await loadTickets();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Không thể xóa phiếu',
        message: err.message || 'Lỗi không xác định khi xóa phiếu'
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Thống kê
  const urgentCount = tickets.filter(t => getSlaInfo(t.dueDate).isUrgent).length;
  const highPriorityCount = tickets.filter(t => t.priority === 'CAO').length;

  return (
    <div className="space-y-5">
      {/* Toast thông báo nổi */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header trang tối giản, sang trọng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Điều phối Phiếu bảo hành
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              TT2 Tân Bình
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rà soát thiết bị tiếp nhận mới, kiểm soát cam kết SLA và phân công kỹ thuật viên theo chuẩn QT-08 & QT-11.
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 4 Thẻ KPI Metric Cards - Chuẩn SaaS Dashboard (Linear/Stripe style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Chờ phân công */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Chờ phân công
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {tickets.length}
            </span>
            <span className="text-xs text-slate-500 font-normal">phiếu mới</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Tiếp nhận tại TT2 Tân Bình</span>
          </div>
        </div>

        {/* Card 2: Cận hạn SLA (<= 4h) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Cận hạn SLA (≤ 4h)
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              urgentCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${
              urgentCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {urgentCount}
            </span>
            <span className="text-xs text-slate-500 font-normal">phiếu khẩn</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${
              urgentCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}></span>
            <span>{urgentCount > 0 ? 'Cần ưu tiên phân công ngay' : 'Đều trong tầm kiểm soát'}</span>
          </div>
        </div>

        {/* Card 3: Ưu tiên CAO */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Ưu tiên Cao
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              highPriorityCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${
              highPriorityCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {highPriorityCount}
            </span>
            <span className="text-xs text-slate-500 font-normal">SLA 24 giờ</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Quy định thời hạn QT-04</span>
          </div>
        </div>

        {/* Card 4: KTV Trực sẵn sàng */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              KTV Trực sẵn sàng
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {readyTechCount !== null ? readyTechCount : '—'}
            </span>
            <span className="text-xs text-slate-500 font-normal">kỹ thuật viên</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Đạt chuẩn tay nghề (bậc ≥ 3)</span>
          </div>
        </div>
      </div>

      {/* Toolbar Tích hợp: Bộ lọc và Tìm kiếm đồng bộ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 space-y-2.5">
        {/* Hàng 1: Tìm kiếm & Dropdown filters */}
        <div className="flex flex-col md:flex-row items-center gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã phiếu (BH-..), serial, tên khách, số điện thoại, thiết bị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bộ chọn Mức ưu tiên */}
          <div className="w-full md:w-44">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="">Tất cả mức ưu tiên</option>
              <option value="CAO">Ưu tiên CAO (24h)</option>
              <option value="TRUNG_BINH">Ưu tiên VỪA (72h)</option>
              <option value="THAP">Ưu tiên THẤP (120h)</option>
            </select>
          </div>

          {/* Bộ chọn Nhóm sự cố */}
          <div className="w-full md:w-44">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="">Tất cả nhóm sự cố</option>
              <option value="1">Màn hình (MAN_HINH)</option>
              <option value="2">Pin & Nguồn (PIN)</option>
              <option value="3">Cổng sạc (SAC)</option>
              <option value="4">Phần mềm (PHAN_MEM)</option>
              <option value="5">Nước vào (NUOC_VAO)</option>
              <option value="6">Khác (KHAC)</option>
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap self-stretch md:self-auto text-center"
            >
              Đặt lại
            </button>
          )}
        </div>

        {/* Hàng 2: Segmented Tabs (Lọc nhanh trực quan) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Bộ lọc:</span>
          {[
            { key: 'ALL', label: `Tất cả (${tickets.length})` },
            { key: 'URGENT', label: `Khẩn cấp ≤ 4h (${urgentCount})`, highlight: urgentCount > 0 },
            { key: 'HIGH', label: `Ưu tiên CAO (${highPriorityCount})` },
            { key: 'SCREEN', label: 'Lỗi Màn hình' },
            { key: 'BATTERY', label: 'Lỗi Pin & Nguồn' }
          ].map((tab) => {
            const isActive = quickFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setQuickFilter(tab.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : tab.highlight
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bảng danh sách phiếu bảo hành */}
      <DataState
        loading={loading}
        error={error}
        data={filteredTickets}
        isFiltered={isFiltered}
        onRetry={loadTickets}
        onClearFilter={handleClearFilters}
        emptyMessage="Hiện không có phiếu bảo hành nào ở trạng thái chờ phân công."
      >
        {(items) => (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 text-slate-500 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Mã phiếu</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Thiết bị & Lỗi</th>
                    <th className="py-3 px-4">Mức ưu tiên</th>
                    <th className="py-3 px-4">Hạn cam kết SLA</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((t) => {
                    const sla = getSlaInfo(t.dueDate);
                    const isDeleting = deletingId === t.ticketId;

                    return (
                      <tr
                        key={t.ticketId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Cột 1: Mã phiếu & Trạng thái */}
                        <td className="py-3.5 px-4 align-top">
                          <button
                            onClick={() => setViewingTicket(t)}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
                            title="Xem chi tiết phiếu"
                          >
                            {t.ticketCode}
                          </button>
                          <div className="mt-1">
                            <StatusBadge status={t.status} />
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-1">
                            {formatDateTime(t.receivedAt)}
                          </span>
                        </td>

                        {/* Cột 2: Khách hàng */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{t.customer?.fullName}</span>
                            <SegmentBadge segment={t.customer?.segment} />
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>{t.customer?.phone || 'Chưa có SĐT'}</span>
                          </div>
                          {t.customer?.address && (
                            <span className="text-[11px] text-slate-400 truncate block max-w-xs mt-0.5">
                              {t.customer.address}
                            </span>
                          )}
                        </td>

                        {/* Cột 3: Thiết bị & Mô tả sự cố */}
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-800">
                              {t.device?.productName || 'Thiết bị'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              (SN: {t.device?.serialNo || 'N/A'})
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-1 line-clamp-2 leading-relaxed" title={t.issueDesc}>
                            {t.issueDesc}
                          </p>
                          {t.category && (
                            <span className="inline-block mt-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {t.category.categoryName}
                            </span>
                          )}
                        </td>

                        {/* Cột 4: Mức ưu tiên */}
                        <td className="py-3.5 px-4 align-top">
                          <PriorityBadge priority={t.priority} />
                        </td>

                        {/* Cột 5: Hạn cam kết SLA */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="text-slate-700 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDateTime(t.dueDate)}</span>
                          </div>
                          <div className="mt-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] border ${sla.badgeClass}`}>
                              {sla.label}
                            </span>
                          </div>
                        </td>

                        {/* Cột 6: Nút thao tác */}
                        <td className="py-3.5 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Xem chi tiết */}
                            <button
                              onClick={() => setViewingTicket(t)}
                              title="Xem chi tiết phiếu"
                              className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors text-xs font-medium"
                            >
                              Chi tiết
                            </button>

                            {/* Nút Phân công KTV */}
                            <button
                              onClick={() => onSelectTicketForAssign(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-2xs transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Phân công</span>
                            </button>

                            {/* Nút Xóa / Hủy */}
                            <button
                              onClick={() => handleDeleteTicket(t)}
                              disabled={isDeleting}
                              title="Hủy tiếp nhận phiếu"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="py-2.5 px-4 bg-slate-50/75 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Đang hiển thị <strong>{filteredTickets.length}</strong> / {tickets.length} phiếu</span>
              <span className="text-[11px] text-slate-400">Dữ liệu thời gian thực TT2 Tân Bình</span>
            </div>
          </div>
        )}
      </DataState>

      {/* Modal Xem chi tiết Phiếu */}
      {viewingTicket && (
        <TicketDetailModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
          onAssign={(ticket) => onSelectTicketForAssign(ticket)}
        />
      )}
    </div>
  );
}

export default TicketListPage;
