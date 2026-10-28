import React from 'react';
import { PriorityBadge, StatusBadge, SegmentBadge } from '../components/Badge';
import { formatDateTime, formatDate, getSlaInfo } from '../utils/date';
import {
  X,
  Smartphone,
  User,
  ShieldCheck,
  Clock,
  History,
  MapPin,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export function TicketDetailModal({ ticket, onClose, onAssign }) {
  if (!ticket) return null;

  const sla = getSlaInfo(ticket.dueDate);
  const historyList = Array.isArray(ticket.statusHistory) ? ticket.statusHistory : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 flex flex-col">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold text-slate-900">
                {ticket.ticketCode}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tiếp nhận: {formatDateTime(ticket.receivedAt)} • TT2 Tân Bình
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Bố cục 2 cột chuyên nghiệp (Linear / GitHub style) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Cột chính bên trái (3/5): Sự cố, Lịch hẹn, Lịch sử */}
          <div className="md:col-span-3 space-y-5">
            {/* Mô tả sự cố */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Mô tả sự cố
              </h4>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-normal">
                {ticket.issueDesc}
              </div>
            </div>

            {/* Lịch hẹn giao nhận (nếu có) */}
            {ticket.appointmentAt && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  Lịch hẹn khách hàng
                </h4>
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg flex items-center justify-between text-purple-900">
                  <span className="font-medium">{formatDateTime(ticket.appointmentAt)}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
                    {ticket.appointmentStatus}
                  </span>
                </div>
              </div>
            )}

            {/* Lịch sử xử lý */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                Lịch sử xử lý
              </h4>

              {historyList.length === 0 ? (
                <p className="text-slate-400 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                  Chưa có nhật ký nào được ghi nhận.
                </p>
              ) : (
                <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {historyList.map((log, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-blue-600 border border-white ring-2 ring-blue-100"></div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {log.from ? `${log.from} → ` : 'Khởi tạo: '}
                            <span className="text-blue-700">{log.to}</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {formatDateTime(log.at)}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-normal">
                            "{log.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cột thông tin phụ bên phải (2/5): SLA, Khách hàng, Thiết bị */}
          <div className="md:col-span-2 space-y-4 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
            {/* SLA Cam kết */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Hạn cam kết SLA
              </span>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Hạn chót:</span>
                  <span className="font-semibold text-slate-800">{formatDateTime(ticket.dueDate)}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500">Thời gian:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${sla.badgeClass}`}>
                    {sla.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin Khách hàng */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Khách hàng
                </span>
                <SegmentBadge segment={ticket.customer?.segment} />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900 text-sm">
                  {ticket.customer?.fullName || 'Khách vãng lai'}
                </p>
                <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{ticket.customer?.phone || 'Chưa có SĐT'}</span>
                </div>
                {ticket.customer?.email && (
                  <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{ticket.customer.email}</span>
                  </div>
                )}
                {ticket.customer?.address && (
                  <div className="flex items-start gap-1 text-slate-500 text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{ticket.customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin Thiết bị */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  Thiết bị
                </span>
                {ticket.category && (
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {ticket.category.categoryName}
                  </span>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <p className="font-semibold text-slate-900">
                  {ticket.device?.productName || 'Thiết bị'}
                </p>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span className="text-slate-500">Serial/IMEI:</span>
                  <span className="font-mono text-slate-800 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                    {ticket.device?.serialNo || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span className="text-slate-500">Bảo hành:</span>
                  <span className="font-medium text-slate-800">
                    {ticket.device?.warrantyMonths || 12} tháng
                  </span>
                </div>
                {ticket.device?.purchaseDate && (
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span className="text-slate-500">Ngày mua:</span>
                    <span>{formatDate(ticket.device.purchaseDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/75 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Đóng
          </button>

          {['MOI', 'DA_PHAN_CONG'].includes(ticket.status) && onAssign && (
            <button
              onClick={() => {
                onClose();
                onAssign(ticket);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{ticket.status === 'MOI' ? 'Phân công Kỹ thuật viên' : 'Điều chuyển KTV khác'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TicketDetailModal;
