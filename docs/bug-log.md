# NHẬT KÝ GỠ LỖI KỸ THUẬT (BUG LOG)
## HỆ THỐNG MEKONG MOBILE SMART CRM — PHÂN HỆ LUỒNG L4

> **Học phần:** Chuyên đề tốt nghiệp 1 (HK261)  
> **Track:** Kỹ thuật phần mềm (SE)  
> **Sinh viên:** Nguyễn Trần Hoàng Vinh — **MSSV:** 2374802010562  
> **Phương pháp áp dụng:** Quy trình gỡ lỗi có hệ thống 4 bước (Tái lập → Khoanh vùng → Sửa nguyên nhân gốc → Xác nhận bằng kiểm thử tự động) theo chuẩn Buổi 11.

---

### BUG-01: Lỗi phát hiện xung đột trùng giờ đặt lịch hẹn kỹ thuật viên (FR4)
- **Mã lỗi:** `BUG-SE-01` (`LICH_HEN_XUNG_DOT`)
- **Triệu chứng:** Khi đặt 2 lịch hẹn cho cùng một Kỹ thuật viên cách nhau 15 phút, hệ thống vẫn cho phép lưu thành công thay vì từ chối với mã HTTP 409.
- **Tái lập (Reproduce):** Gọi `POST /api/tickets/1/appointment` với `appointmentAt = 2026-10-26T14:00:00Z`, sau đó tiếp tục gọi cho phiếu 2 với `appointmentAt = 2026-10-26T14:15:00Z` cùng `technicianId = 1`.
- **Khoanh vùng (Isolate):** Hàm `hasConflict(technicianId, time)` tại `src/repositories/appointment.repository.js` chỉ so sánh bằng tuyệt đối (`===`) thay vì kiểm tra khoảng giao nhau (Time slot overlap: $\pm 30$ phút).
- **Nguyên nhân gốc (Root cause):** Lịch hẹn bảo hành cần tối thiểu 30–60 phút cho một phiên giao nhận máy. Phép so sánh đẳng thức thời gian bỏ sót toàn bộ các lịch hẹn nằm trong cùng khung giờ làm việc.
- **Cách sửa (Fix):** Sửa lại truy vấn kiểm tra khoảng thời gian giao nhau: `appointmentAt >= (time - 30m) AND appointmentAt <= (time + 30m)` và loại trừ chính phiếu đang cập nhật.
- **Xác nhận bằng test (Verify):** Viết test case `TC3.3: Phát hiện và từ chối xung đột lịch hẹn của KTV với mã LICH_HEN_XUNG_DOT (FR4)` trong `tests/ticket.service.test.js` $\rightarrow$ PASS 100%.

---

### BUG-02: Lỗi CORS khi Frontend Vite gọi sang Backend API Node.js/Express
- **Mã lỗi:** `BUG-SE-02` (`CORS_PREFLIGHT_BLOCKED`)
- **Triệu chứng:** Trình duyệt Chrome báo lỗi đỏ trên Console: `Access to XMLHttpRequest at 'http://localhost:3000/api/tickets' from origin 'http://localhost:5173' has been blocked by CORS policy`.
- **Tái lập (Reproduce):** Khởi động backend port 3000 và frontend port 5173, mở trang `TicketListPage` trên trình duyệt.
- **Khoanh vùng (Isolate):** Network tab hiển thị request `OPTIONS` (Preflight request) bị trả về mã 404 hoặc thiếu header `Access-Control-Allow-Origin`.
- **Nguyên nhân gốc (Root cause):** Backend Express chưa cài đặt và kích hoạt middleware `cors` cho origin `http://localhost:5173`.
- **Cách sửa (Fix):** Cài đặt thư viện `cors`, cấu hình trong `src/app.js`: `app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }))`.
- **Xác nhận bằng test (Verify):** Gọi thử curl giả lập header Origin `curl -H "Origin: http://localhost:5173" -I http://localhost:3000/health` $\rightarrow$ Nhận header `Access-Control-Allow-Origin: http://localhost:5173`.

---

### BUG-03: Lỗi rò rỉ số điện thoại khách hàng khi Kỹ thuật viên truy vấn phiếu (QT-15)
- **Mã lỗi:** `BUG-SE-03` (`CUSTOMER_PHONE_UNMASKED_LEAK`)
- **Triệu chứng:** API `/api/tickets/technician/mine` trả về số điện thoại gốc `0901234567` của khách hàng trong payload JSON, vi phạm quy tắc bảo mật riêng tư QT-15 và NFR2.
- **Tái lập (Reproduce):** Đăng nhập quyền KTV, gọi API `GET /api/tickets/technician/mine?technicianId=5` và đọc đối tượng `customer.phone`.
- **Khoanh vùng (Isolate):** Endpoint trong `src/routes/ticket.routes.js` trả thẳng mảng `result.items` từ Repository mà chưa đi qua bước chuyển đổi che số điện thoại (Phone Masking).
- **Nguyên nhân gốc (Root cause):** Thiếu hàm chuyển đổi ranh giới dữ liệu (Data Contract Adapter) tại tầng Routes trước khi trả về client.
- **Cách sửa (Fix):** Bổ sung hàm che số điện thoại định dạng chuẩn `090****567` tại `src/routes/ticket.routes.js` và bổ sung hàm dự phòng `maskPhoneDisplay()` tại Frontend `TechnicianTicketsPage.jsx`.
- **Xác nhận bằng test (Verify):** Kiểm tra trực tiếp trên Postman và chạy test suite `tests/api.routes.test.js` $\rightarrow$ Số điện thoại luôn hiển thị dạng `090****567`.
