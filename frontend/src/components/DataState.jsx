import React from 'react';
import { AlertCircle, RefreshCw, Inbox, FilterX } from 'lucide-react';

/**
 * DataState: Thành phần chuẩn quản lý và hiển thị 3 trạng thái theo yêu cầu Buổi 9-10 Track SE.
 * 1. Đang tải (Loading)
 * 2. Rỗng (Empty - phân biệt rõ rỗng toàn cục và rỗng do bộ lọc)
 * 3. Lỗi (Error - có nút Thử lại)
 */
export function DataState({
  loading,
  error,
  data,
  isFiltered = false,
  onRetry,
  onClearFilter,
  emptyMessage,
  children
}) {
  // Trạng thái 1: Đang tải dữ liệu
  if (loading) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center space-y-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Đang tải dữ liệu từ hệ thống Mekong CRM...</p>
      </div>
    );
  }

  // Trạng thái 2: Lỗi kết nối / Lỗi nghiệp vụ
  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-base font-semibold text-red-900">
              {error.status ? `Lỗi kết nối [HTTP ${error.status}]` : 'Không thể tải dữ liệu'}
            </h4>
            <p className="text-sm text-red-700 mt-1">
              {error.message || 'Hệ thống không thể phản hồi yêu cầu. Vui lòng kiểm tra lại dịch vụ.'}
            </p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
        )}
      </div>
    );
  }

  // Trạng thái 3: Rỗng (Empty State)
  const isEmpty = !data || (Array.isArray(data) && data.length === 0);
  if (isEmpty) {
    return (
      <div className="w-full py-12 px-4 text-center bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
        {isFiltered ? (
          <>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3">
              <FilterX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Không có phiếu nào khớp bộ lọc hiện tại</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
              {emptyMessage || 'Thử thay đổi hoặc xóa các tiêu chí lọc theo mức ưu tiên, nhóm sự cố để xem thêm kết quả.'}
            </p>
            {onClearFilter && (
              <button
                onClick={onClearFilter}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-300 shadow-sm"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Chưa có dữ liệu phiếu bảo hành</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              {emptyMessage || 'Hiện không có phiếu bảo hành nào cần xử lý trong mục này.'}
            </p>
          </>
        )}
      </div>
    );
  }

  // Render dữ liệu thật
  return typeof children === 'function' ? children(data) : children;
}

