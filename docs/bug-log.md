# NHẬT KÝ GỠ LỖI KỸ THUẬT (BUG LOG)
## HỆ THỐNG MEKONG MOBILE SMART CRM — PHÂN HỆ LUỒNG L4

> **Học phần:** Chuyên đề tốt nghiệp 1 (HK261)
> **Track:** Kỹ thuật phần mềm (SE)
> **Sinh viên:** Nguyễn Trần Hoàng Vinh — **MSSV:** 2374802010562
> **Phương pháp áp dụng:** Quy trình gỡ lỗi có hệ thống 4 bước (Tái lập → Khoanh vùng → Sửa nguyên nhân gốc → Xác nhận bằng kiểm thử tự động) theo chuẩn Buổi 11.

---

## PHẦN 1 — BUG BÀI TẬP 2 (giữ nguyên lịch sử, đã sửa ở BT2)

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

---

## PHẦN 2 — BUG BÀI TẬP 3 (mới, phát hiện bởi TC-11 / TC-P1 / review BUG-06, commit sau tag `v0.2`)

### BUG-04 (Critical — A01 Broken Access Control / QT-14): KTV sửa được phiếu của KTV khác
- **1. Mã + Mức độ:** `BUG-04` — **Critical** (A01 Broken Access Control; vi phạm QT-14 phân quyền theo chủ sở hữu; phát hiện bởi `TC-11` = `TC-SEC-01`).
- **2. Triệu chứng:** `PATCH /api/tickets/3/status` và `PUT /api/tickets/3` với header KTV `technicianId = 5` (không phải chủ phiếu `technicianId = 3`) đều trả **HTTP 200** và thực sự đổi `status`/`issueDesc` + append `status_history`.
- **3. Tái lập:** `npx jest tests/bt3-new.test.js` (không cần CSDL) → `TC-SEC-01` FAIL tại `expect(resPatch.status).toBe(403)` — `Expected: 403 / Received: 200`; log `>>> [KẾT QUẢ THỰC TẾ] TC-SEC-01` ghi `DA_PHAN_CONG → DANG_XU_LY`, `statusHistory` 2 → 3 phần tử.
- **4. Khoanh vùng + Nguyên nhân gốc:** Không route nào trong `src/routes/ticket.routes.js` gọi `authorize()`; `src/services/ticket.service.js` (`transitionStatus`/`updateTicket`) không so sánh `ticket.technicianId` với người gọi (`req.user.id`) khi `role = TECHNICIAN`.
- **5. Cách sửa:** `transitionStatus()`/`updateTicket()` nhận thêm `caller` (`req.user`) và ném `KHONG_CO_QUYEN` (→ HTTP 403 qua `errorHandler`) khi `caller.role === 'TECHNICIAN'` mà `ticket.technicianId ≠ caller.id`; `ticket.routes.js` truyền `req.user` xuống cho `PUT /:id` và `PATCH /:id/status`.
- **6. Link commit (sau `v0.2`):** `9add2b8e64e16634ac38c8cd42c27e09e66bf676` — `fix(security): chan KTV sua phieu cua KTV khac (BUG-04 A01/QT-14)` (2 files: `src/services/ticket.service.js`, `src/routes/ticket.routes.js`).
- **7. Xác nhận bằng test:** `npx jest tests/bt3-new.test.js` → `TC-SEC-01` **PASS** (cả 2 request **403** `KHONG_CO_QUYEN`, dữ liệu không đổi); `npm test` → **6 suites / 42 tests PASS**.

### BUG-05 (Critical — thiếu xác thực JWT / NFR2): API nghiệp vụ cho request ẩn danh
- **1. Mã + Mức độ:** `BUG-05` — **Critical** (thiếu xác thực; vi phạm NFR2 "100% API nghiệp vụ phải xác thực JWT"; phát hiện bởi `TC-P1` = `TC-SEC-02`).
- **2. Triệu chứng:** `GET /api/tickets?centerId=2` và `POST /api/tickets/3/assign` **không** gửi `Authorization`/`x-user-role` đều trả **HTTP 200** (ghi dữ liệu thành công không cần đăng nhập); token sai thì đúng 401 `TOKEN_HET_HAN`.
- **3. Tái lập:** `npx jest tests/bt3-new.test.js` → `TC-SEC-02` FAIL tại `expect(resList.status).toBe(401)` — `Expected: 401 / Received: 200`; log `>>> [KẾT QUẢ THỰC TẾ] TC-SEC-02` ghi bước 1–2 HTTP 200.
- **4. Khoanh vùng + Nguyên nhân gốc:** `src/middlewares/auth.middleware.js` — nhánh fallback cuối `authenticate()` gán mọi request ẩn danh thành `{ role: 'CENTER_MANAGER', centerId: 2 }` để demo nhanh, vô hiệu hóa toàn bộ lớp xác thực.
- **5. Cách sửa:** Xóa fallback manager mặc định → request ẩn danh tới API nghiệp vụ `next(new AppError('XAC_THUC_KHONG_HOP_LE', …))` (→ HTTP 401); giữ whitelist công khai `['/health', '/', '/api/auth/login']` cho healthcheck Docker và login; sửa `RT-7` theo chữ ký `updateTicket(id, data, caller)` mới.
- **6. Link commit (sau `v0.2`):** `06c3180ea518c38dad8cd0204ab0c22e7252e47c` — `fix(security): bat buoc JWT cho API nghiep vu, bo fallback manager mac dinh (BUG-05 NFR2)` (2 files: `src/middlewares/auth.middleware.js`, `tests/api.routes.test.js`).
- **7. Xác nhận bằng test:** `npx jest tests/bt3-new.test.js` → `TC-SEC-02` **PASS** (không token → **401** `XAC_THUC_KHONG_HOP_LE`; token sai → **401** `TOKEN_HET_HAN`; `GET /health` vẫn **200**); `npm test` → **6 suites / 42 tests PASS**.

### BUG-06 (Major — CORS mở + mật khẩu plaintext): cấu hình bảo mật yếu
- **1. Mã + Mức độ:** `BUG-06` — **Major** (CORS `app.use(cors())` mở mọi origin + `DEMO_USERS` lưu `password: 'password123'` plaintext trong `src/services/auth.service.js`; phát hiện khi review checklist bảo mật BT3).
- **2. Triệu chứng:** Mọi origin ngoài đều gọi được API (thiếu `Access-Control-Allow-Origin` giới hạn); mật khẩu đọc được trực tiếp trong mã nguồn, lộ khi leak repo/log.
- **3. Tái lập:** Đọc `src/app.js` (`app.use(cors())` không tham số) và `src/services/auth.service.js` (`password: 'password123'` plaintext × 4 user); demo login `manager_tt2/password123` thành công nhưng so sánh chuỗi trực tiếp.
- **4. Khoanh vùng + Nguyên nhân gốc:** Cấu hình demo nhanh từ BT2 chưa siết theo NFR2/checklist bảo mật: CORS mặc định mở + chưa dùng `bcryptjs` (dù đã có trong `dependencies`).
- **5. Cách sửa:** `src/app.js`: `cors({ origin: FRONTEND_URL.split(','), credentials: true })`; `src/services/auth.service.js`: chỉ lưu `passwordHash = bcrypt.hashSync('password123', 10)`, login dùng `bcrypt.compareSync(password, user.passwordHash)`.
- **6. Link commit (sau `v0.2`):** `80bdad804ed3cfc51b97e89db967621aa4974a78` — `fix(security): bam mat khau bcrypt + gioi han CORS theo FRONTEND_URL (BUG-06)` (2 files: `src/services/auth.service.js`, `src/app.js`).
- **7. Xác nhận bằng test:** Script login: đúng pass → JWT (`role = CENTER_MANAGER`); sai pass → `401 XAC_THUC_KHONG_HOP_LE`; `npm test` → **6 suites / 42 tests PASS** (không hồi quy).
