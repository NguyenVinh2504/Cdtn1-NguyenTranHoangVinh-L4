# NHẬT KÝ GỠ LỖI KỸ THUẬT (BUG LOG)
## HỆ THỐNG MEKONG MOBILE SMART CRM — PHÂN HỆ LUỒNG L4

> **Học phần:** Chuyên đề tốt nghiệp 1 (HK261)
> **Track:** Kỹ thuật phần mềm (SE)
> **Sinh viên:** Nguyễn Trần Hoàng Vinh — **MSSV:** 2374802010562
> **Phương pháp áp dụng:** Quy trình gỡ lỗi có hệ thống 4 bước (Tái lập → Khoanh vùng → Sửa nguyên nhân gốc → Xác nhận bằng kiểm thử tự động) theo chuẩn Buổi 11.

---

## PHẦN 1 — BUG BÀI TẬP 2 (đã sửa trong giai đoạn BT2, lịch sử commit thật của repo)

> **Ghi chú về tính minh bạch:** Phần 1 ghi lại 3 lỗi đã phát hiện và sửa trong quá trình làm Bài tập 2. Mỗi mục dưới đây đã được **đối chiếu trực tiếp với lịch sử `git log`/`git show` của kho mã nguồn** — link commit mở được và nội dung commit khớp đúng với phần "Cách sửa" mô tả.

### BUG-01: Cửa sổ phát hiện trùng lịch hẹn không khớp quy định 30 phút của UC4 / FR4
- **Mã lỗi:** `BUG-SE-01` (`LICH_HEN_XUNG_DOT`)
- **Triệu chứng:** Đặt 2 lịch hẹn cho cùng một Kỹ thuật viên cách nhau **31 phút** vẫn bị ghi nhận thành công, trong khi UC4 / FR4 quy định mỗi phiên giao nhận máy cần **≥ 30 phút** và các lịch hẹn trong cửa sổ **± 30 phút** phải bị coi là xung đột.
- **Tái lập (Reproduce):** Kiểm tra `src/repositories/appointment.repository.js` — `hasConflict()` dùng `windowMs = 45 * 60 * 1000`; đặt lịch hẹn thứ hai lệch **31–40 phút** so với lịch đầu thì vẫn không bị chặn.
- **Khoanh vùng (Isolate):** Biến `windowMs` trong `hasConflict(technicianId, appointmentDate, excludeTicketId)` tại `src/repositories/appointment.repository.js`.
- **Nguyên nhân gốc (Root cause):** Cửa sổ xung đột **45 phút** được đặt từ bản khởi tạo (commit `50b5fc6`) và chưa được đồng bộ với giá trị **30 phút** mà UC4 / FR4 quy định — sai lệch giữa đặc tả nghiệp vụ và tham số cấu hình trong mã.
- **Cách sửa (Fix):** `windowMs = 30 * 60 * 1000` (khớp UC4 / FR4), đồng thời giữ nguyên cơ chế loại trừ chính phiếu đang cập nhật (`excludeTicketId`) và điều kiện `appointmentStatus IN ('SCHEDULED','CONFIRMED')`.
- **Xác nhận bằng test (Verify):** Test `TC3.3` trong `tests/ticket.service.test.js` (nhánh xung đột) và test `TC-09` trong `tests/bt3-unit.test.js` → **PASS**, `repo.update` gọi **0** lần, mã lỗi `LICH_HEN_XUNG_DOT`.
- **Link commit:** [`fdc6c36`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/fdc6c36619f18c5460e7e7f04cf109e9d8a53830) — `fix: add versioned Prisma migration and NFR3 assignment transaction` (thay đổi đúng dòng `windowMs` trong `src/repositories/appointment.repository.js`).

### BUG-02: Che số điện thoại làm mất kiểu dữ liệu `Date` trong payload trả về (QT-15)
- **Mã lỗi:** `BUG-SE-02` (`PHONE_MASK_DESTROYS_DATE`)
- **Triệu chứng:** Sau khi áp dụng middleware che số điện thoại, các trường thời gian (`receivedAt`, `createdAt`) trong payload JSON **bị biến thành chuỗi** thay vì đối tượng `Date` — frontend phải parse lại thủ công, và `new Date(...)` trên chuỗi đã sai định dạng có thể ra `Invalid Date`.
- **Tái lập (Reproduce):** Gọi `res.json({ ticketId: 1, receivedAt: new Date('2026-10-28T14:43:26.024Z'), customer: { phone: '0901234567', createdAt: new Date(...) } })` sau khi `phoneMasker` đã gắn `res.json`.
- **Khoanh vùng (Isolate):** Hàm `maskPhonesInObject(obj)` tại `src/middlewares/phoneMasker.middleware.js` — khi gặp một object có `typeof obj.toISOString === 'function'` (tức là `Date`), hàm đi sâu vào các thuộc tính của `Date` và biến nó thành object thường thay vì giữ nguyên.
- **Nguyên nhân gốc (Root cause):** Thiếu **type guard** `instanceof Date` ở đầu hàm đệ quy — middleware không phân biệt "object dữ liệu cần che" với "object thời gian cần giữ nguyên".
- **Cách sửa (Fix):** Thêm guard `if (obj instanceof Date || typeof obj.toISOString === 'function') return obj;` ngay đầu `maskPhonesInObject()`, để mọi giá trị thời gian được trả về **nguyên vẹn** cả kiểu lẫn định dạng.
- **Xác nhận bằng test (Verify):** Test `RT-8` trong `tests/api.routes.test.js` và test `TC-05` trong `tests/bt3-unit.test.js` → **PASS**: `customer.phone === '090****567'`, `receivedAt` và `createdAt` vẫn `instanceof Date` và giữ nguyên `.toISOString()`.
- **Link commit:** [`4aaef56`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/4aaef5679970569edde82483d525c4d5b605bc5d) — `fix(middleware): preserve Date instances during phone masking and add RT-8 test` (thêm đúng 1 dòng guard vào `src/middlewares/phoneMasker.middleware.js`).

### BUG-03: CORS mở toàn bộ origin + mật khẩu lưu plaintext trong mã nguồn (NFR2)
- **Mã lỗi:** `BUG-SE-03` (`CORS_OPEN_ORIGIN`)
- **Triệu chứng:** `app.use(cors())` không tham số ở `src/app.js` khiến **mọi** origin đều được phép gọi API và nhận header `Access-Control-Allow-Origin` — bất kỳ website nào cũng có thể gọi API nội bộ từ trình duyệt của người dùng. Song song, `src/services/auth.service.js` lưu `password: 'password123'` **dạng plaintext** cho 4 tài khoản demo.
- **Tái lập (Reproduce):** Đọc `src/app.js` (dòng `app.use(cors());`) và `src/services/auth.service.js` (4 trường `password` plaintext). Đăng nhập `manager_tt2` / `password123` thành công — so sánh chuỗi trực tiếp, không băm.
- **Khoanh vùng (Isolate):** `src/app.js` (cấu hình CORS) và `src/services/auth.service.js` (bảng `DEMO_USERS`).
- **Nguyên nhân gốc (Root cause):** Cấu hình "demo nhanh" của BT2 chưa siết theo NFR2 và checklist bảo mật: CORS mặc định mở toàn bộ + chưa dùng `bcryptjs` (dù thư viện đã có sẵn trong `dependencies`).
- **Cách sửa (Fix):** `src/app.js`: `cors({ origin: FRONTEND_URL.split(','), credentials: true })`; `src/services/auth.service.js`: chỉ lưu `passwordHash = bcrypt.hashSync('password123', 10)`, login dùng `bcrypt.compareSync(password, user.passwordHash)`.
- **Xác nhận bằng test (Verify):** Login đúng mật khẩu → trả JWT (`role = CENTER_MANAGER`); sai mật khẩu → `401 XAC_THUC_KHONG_HOP_LE`; `npm test` → **6 suites / 48 tests PASS** (không hồi quy).
- **Link commit:** [`80bdad8`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/80bdad804ed3cfc51b97e89db967621aa4974a78) — `fix(security): bam mat khau bcrypt + gioi han CORS theo FRONTEND_URL (BUG-06)` (2 files: `src/services/auth.service.js`, `src/app.js`).

> **Ghi chú:** Lỗi CORS + mật khẩu plaintext ở trên đã được **sửa lại trong Bài tập 3** và ghi thành bug riêng `BUG-06` ở **Phần 2** (vì việc sửa nằm trong commit sau tag `v0.2` của BT2). Mục BUG-03 ở đây ghi lại **phát hiện gốc** trong BT2; commit sửa được liệt kê ở cả hai mục để dễ đối chiếu.

---

## PHẦN 2 — BUG BÀI TẬP 3 (mới, phát hiện bởi TC-11 / TC-P1 / review BUG-06, commit sau tag `v0.2`)

### BUG-04 (Critical — A01 Broken Access Control / QT-14): KTV sửa được phiếu của KTV khác
- **1. Mã + Mức độ:** `BUG-04` — **Critical** (A01 Broken Access Control; vi phạm QT-14 phân quyền theo chủ sở hữu; phát hiện bởi `TC-11` = `TC-SEC-01`).
- **2. Triệu chứng:** `PATCH /api/tickets/3/status` và `PUT /api/tickets/3` với header KTV `technicianId = 5` (không phải chủ phiếu `technicianId = 3`) đều trả **HTTP 200** và thực sự đổi `status`/`issueDesc` + append `status_history`.
- **3. Tái lập:** `npx jest tests/bt3-new.test.js` (không cần CSDL) → `TC-SEC-01` FAIL tại `expect(resPatch.status).toBe(403)` — `Expected: 403 / Received: 200`; log `>>> [KẾT QUẢ THỰC TẾ] TC-SEC-01` ghi `DA_PHAN_CONG → DANG_XU_LY`, `statusHistory` 2 → 3 phần tử.
- **4. Khoanh vùng + Nguyên nhân gốc:** Không route nào trong `src/routes/ticket.routes.js` gọi `authorize()`; `src/services/ticket.service.js` (`transitionStatus`/`updateTicket`) không so sánh `ticket.technicianId` với người gọi (`req.user.id`) khi `role = TECHNICIAN`.
- **5. Cách sửa:** `transitionStatus()`/`updateTicket()` nhận thêm `caller` (`req.user`) và ném `KHONG_CO_QUYEN` (→ HTTP 403 qua `errorHandler`) khi `caller.role === 'TECHNICIAN'` mà `ticket.technicianId ≠ caller.id`; `ticket.routes.js` truyền `req.user` xuống cho `PUT /:id` và `PATCH /:id/status`.
- **6. Link commit (sau `v0.2`):** [`9add2b8`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/9add2b8e64e16634ac38c8cd42c27e09e66bf676) — `fix(security): chan KTV sua phieu cua KTV khac (BUG-04 A01/QT-14)` (2 files: `src/services/ticket.service.js`, `src/routes/ticket.routes.js`).
- **7. Xác nhận bằng test:** `npx jest tests/bt3-new.test.js` → `TC-SEC-01` **PASS** (cả 2 request **403** `KHONG_CO_QUYEN`, dữ liệu không đổi); `npm test` → **6 suites / 42 tests PASS** *(tại thời điểm sửa BUG-04/BUG-05; hiện tại sau khi bổ sung bộ hồi quy TC-13…TC-15: **52 tests PASS** (7 suites))*.

### BUG-05 (Critical — thiếu xác thực JWT / NFR2): API nghiệp vụ cho request ẩn danh
- **1. Mã + Mức độ:** `BUG-05` — **Critical** (thiếu xác thực; vi phạm NFR2 "100% API nghiệp vụ phải xác thực JWT"; phát hiện bởi `TC-P1` = `TC-SEC-02`).
- **2. Triệu chứng:** `GET /api/tickets?centerId=2` và `POST /api/tickets/3/assign` **không** gửi `Authorization`/`x-user-role` đều trả **HTTP 200** (ghi dữ liệu thành công không cần đăng nhập); token sai thì đúng 401 `TOKEN_HET_HAN`.
- **3. Tái lập:** `npx jest tests/bt3-new.test.js` → `TC-SEC-02` FAIL tại `expect(resList.status).toBe(401)` — `Expected: 401 / Received: 200`; log `>>> [KẾT QUẢ THỰC TẾ] TC-SEC-02` ghi bước 1–2 HTTP 200.
- **4. Khoanh vùng + Nguyên nhân gốc:** `src/middlewares/auth.middleware.js` — nhánh fallback cuối `authenticate()` gán mọi request ẩn danh thành `{ role: 'CENTER_MANAGER', centerId: 2 }` để demo nhanh, vô hiệu hóa toàn bộ lớp xác thực.
- **5. Cách sửa:** Xóa fallback manager mặc định → request ẩn danh tới API nghiệp vụ `next(new AppError('XAC_THUC_KHONG_HOP_LE', …))` (→ HTTP 401); giữ whitelist công khai `['/health', '/', '/api/auth/login']` cho healthcheck Docker và login; sửa `RT-7` theo chữ ký `updateTicket(id, data, caller)` mới.
- **6. Link commit (sau `v0.2`):** [`06c3180`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/06c3180ea518c38dad8cd0204ab0c22e7252e47c) — `fix(security): bat buoc JWT cho API nghiep vu, bo fallback manager mac dinh (BUG-05 NFR2)` (2 files: `src/middlewares/auth.middleware.js`, `tests/api.routes.test.js`).
- **7. Xác nhận bằng test:** `npx jest tests/bt3-new.test.js` → `TC-SEC-02` **PASS** (không token → **401** `XAC_THUC_KHONG_HOP_LE`; token sai → **401** `TOKEN_HET_HAN`; `GET /health` vẫn **200**); `npm test` → **6 suites / 42 tests PASS** *(tại thời điểm sửa BUG-04/BUG-05; hiện tại sau khi bổ sung bộ hồi quy TC-13…TC-15: **52 tests PASS** (7 suites))*.

### BUG-06 (Major — CORS mở + mật khẩu plaintext): cấu hình bảo mật yếu
- **1. Mã + Mức độ:** `BUG-06` — **Major** (CORS `app.use(cors())` mở mọi origin + `DEMO_USERS` lưu `password: 'password123'` plaintext trong `src/services/auth.service.js`; phát hiện khi review checklist bảo mật BT3).
- **2. Triệu chứng:** Mọi origin ngoài đều gọi được API (thiếu `Access-Control-Allow-Origin` giới hạn); mật khẩu đọc được trực tiếp trong mã nguồn, lộ khi leak repo/log.
- **3. Tái lập:** Đọc `src/app.js` (`app.use(cors())` không tham số) và `src/services/auth.service.js` (`password: 'password123'` plaintext × 4 user); demo login `manager_tt2/password123` thành công nhưng so sánh chuỗi trực tiếp.
- **4. Khoanh vùng + Nguyên nhân gốc:** Cấu hình demo nhanh từ BT2 chưa siết theo NFR2/checklist bảo mật: CORS mặc định mở + chưa dùng `bcryptjs` (dù đã có trong `dependencies`).
- **5. Cách sửa:** `src/app.js`: `cors({ origin: FRONTEND_URL.split(','), credentials: true })`; `src/services/auth.service.js`: chỉ lưu `passwordHash = bcrypt.hashSync('password123', 10)`, login dùng `bcrypt.compareSync(password, user.passwordHash)`.
- **6. Link commit (sau `v0.2`):** [`80bdad8`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/80bdad804ed3cfc51b97e89db967621aa4974a78) — `fix(security): bam mat khau bcrypt + gioi han CORS theo FRONTEND_URL (BUG-06)` (2 files: `src/services/auth.service.js`, `src/app.js`).
- **7. Xác nhận bằng test:** Script login: đúng pass → JWT (`role = CENTER_MANAGER`); sai pass → `401 XAC_THUC_KHONG_HOP_LE`; `npm test` → **6 suites / 42 tests PASS** (không hồi quy).

### BUG-07 (Critical — A01 Broken Access Control / QT-14): KTV đọc được phiếu của KTV khác (đường đọc)
- **1. Mã + Mức độ:** `BUG-07` — **Critical** (A01 Broken Access Control; vi phạm QT-14 "KTV chỉ có quyền truy xuất các phiếu được gán cho chính mình"; phát hiện bởi `TC-11` = `TC-SEC-03` khi mở rộng kiểm thử từ đường **ghi** sang đường **đọc**).
- **2. Triệu chứng:** `GET /api/tickets/technician/mine?technicianId=3` với header `x-user-role: TECHNICIAN`, `x-user-id: 5` trả **HTTP 200** kèm **phiếu của KTV id = 3** — KTV id = 5 đọc được công việc của KTV khác. Tương tự: `GET /api/tickets/3` trả chi tiết phiếu của KTV khác; `GET /api/tickets/unassigned` trả danh sách chờ phân công của cả trung tâm; `GET /api/tickets?centerId=2` trả phiếu của mọi KTV trong trung tâm.
- **3. Tái lập:** `npx jest tests/bt3-new.test.js -t "TC-11"` → `TC-SEC-03` FAIL tại `expect(resMine.status).toBe(403)` — `Expected: 403 / Received: 200`; log `>>> [KẾT QUẢ THỰC TẾ] TC-SEC-03 bước 1` ghi `HTTP status : 200` cho `GET /api/tickets/technician/mine?technicianId=3`.
- **4. Khoanh vùng + Nguyên nhân gốc:** `src/routes/ticket.routes.js` — route `GET /technician/mine` lấy `technicianId` từ **`req.query.technicianId`** (tham số do client kiểm soát) thay vì từ danh tính đã xác thực `req.user.id`; `getTicketDetail()` và `listTickets()` trong `src/services/ticket.service.js` **không nhận tham số `caller`** nên không có đâu để so sánh `ticket.technicianId` với người gọi. BUG-04 trước đó chỉ vá **đường ghi** (`transitionStatus` / `updateTicket`) — đường đọc bị bỏ sót.
- **5. Cách sửa:** `src/routes/ticket.routes.js`: (a) `GET /technician/mine` — với role `TECHNICIAN` cưỡng chế `technicianId = req.user.id`, nếu query chỉ định KTV khác thì ném `KHONG_CO_QUYEN` (403); (b) `GET /unassigned` — chặn role `TECHNICIAN` (403); (c) `GET /` và `GET /:id` — truyền `req.user` xuống service. `src/services/ticket.service.js`: `listTechnicianTickets()` bỏ qua tham số `technicianId` từ client khi caller là `TECHNICIAN`; `getTicketDetail()` ném `KHONG_CO_QUYEN` khi KTV xem phiếu của KTV khác; `listTickets()` với role `TECHNICIAN` chỉ trả phiếu của chính mình.
- **6. Link commit (sau `v0.2`):** [`be360fe`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/be360fec985bc3fbe7a090ed447dd98f6cfaf482) — `fix(security): chan doc phiếu của KTV khác trên 4 endpoint (BUG-07 A01/QT-14)` (3 files: `src/routes/ticket.routes.js`, `src/services/ticket.service.js`, `tests/bt3-new.test.js`).
- **7. Xác nhận bằng test:** `npx jest tests/bt3-new.test.js -t "TC-11"` → `TC-SEC-03` **PASS** (3 request đọc chéo chủ sở hữu → **403** `KHONG_CO_QUYEN`; `GET /api/tickets` → **200** nhưng chỉ trả phiếu của chính KTV); `npm test` → **6 suites / 45 tests PASS** *(tại thời điểm sửa BUG-07/08/09; hiện tại sau khi bổ sung TC-P4/TC-P5/TC-P6 và bộ hồi quy TC-13…TC-15: **52 tests PASS** (7 suites))*.

### BUG-08 (Major — QT-06): Cho phép chuyển trạng thái tự thân (self-loop), làm nhiễu lịch sử JSONB
- **1. Mã + Mức độ:** `BUG-08` — **Major** (vi phạm QT-06 "tuyệt đối không được chuyển ngược về trạng thái trước đó"; phát hiện khi đối chiếu ma trận truy vết QT-06 với mã nguồn thật).
- **2. Triệu chứng:** `VALID_TRANSITIONS['DA_PHAN_CONG']` chứa `'DA_PHAN_CONG'`, nên `PATCH /api/tickets/:id/status` với `status = DA_PHAN_CONG` (phiếu đang `DA_PHAN_CONG`) được **chấp nhận** và ghi thêm 1 phần tử `status_history` rác có `from = to = DA_PHAN_CONG` — lịch sử JSONB bị làm nhiễu, UI hiển thị "đã chuyển trạng thái" dù trạng thái không đổi.
- **3. Tái lập:** `npx jest tests/bt3-unit.test.js -t "TC-P3"` → FAIL tại `expect(caught.code).toBe('TRANG_THAI_KHONG_HOP_LE')` — `Expected: 'TRANG_THAI_KHONG_HOP_LE' / Received: undefined` (không ném lỗi) và `expect(mockTicketRepo.update).not.toHaveBeenCalled()` — `update` **đã** được gọi 1 lần.
- **4. Khoanh vùng + Nguyên nhân gốc:** Bảng `VALID_TRANSITIONS` tại `src/services/ticket.service.js` — nhánh `DA_PHAN_CONG: ['DANG_XU_LY', 'DA_PHAN_CONG', 'DA_HUY']` (ghi chú gốc: *"Cho phép điều chuyển lại nếu cần"*). Nguyên nhân: hiểu sai "điều chuyển KTV" (`MOI → DA_PHAN_CONG` khi phiếu đã `DA_PHAN_CONG`) là **phân công lại**, nên tác giả đã thêm self-loop để "tiện" — nhưng `transitionStatus()` và `assignTechnician()` là 2 hàm khác nhau, self-loop trong `transitionStatus()` là **lỗi thuần túy**.
- **5. Cách sửa:** Bỏ `'DA_PHAN_CONG'` khỏi `VALID_TRANSITIONS['DA_PHAN_CONG']`; giữ nguyên ngoại lệ duy nhất `CHO_LINH_KIEN → DANG_XU_LY` (đã có linh kiện thay thế, KTV tiếp tục xử lý — không phải quay lại trạng thái đã đóng) và ghi chú rõ trong mã nguồn. Đồng thời cập nhật SRS QT-06 để mô tả đúng hành vi thật.
- **6. Link commit (sau `v0.2`):** [`b0f2f9b`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/b0f2f9bf355ea493f5f14828695c7161af0b6e2f) — `fix(lifecycle): bo self-loop DA_PHAN_CONG -> DA_PHAN_CONG khoi vong doi trang thai (BUG-08 QT-06)` (2 files: `src/services/ticket.service.js`, `tests/bt3-unit.test.js`).
- **7. Xác nhận bằng test:** `npx jest tests/bt3-unit.test.js -t "TC-P3"` → **PASS** (`TRANG_THAI_KHONG_HOP_LE`, message chứa *"quy tắc vòng đời không đảo ngược"*, `repo.update` gọi **0** lần, `statusHistory` giữ nguyên 2 phần tử); `npm test` → **6 suites / 45 tests PASS** *(tại thời điểm sửa BUG-07/08/09; hiện tại sau khi bổ sung TC-P4/TC-P5/TC-P6 và bộ hồi quy TC-13…TC-15: **52 tests PASS** (7 suites))*.

### BUG-09 (Major — QT-04): Hạn SLA tính theo giờ LỊCH, bỏ qua yêu cầu "ngày làm việc" của SRS
- **1. Mã + Mức độ:** `BUG-09` — **Major** (vi phạm QT-04 "Thời gian chỉ tính trong ngày làm việc (từ thứ Hai đến thứ Bảy, trừ Chủ Nhật)"; phát hiện khi đối chiếu SRS QT-04 với mã nguồn thật — `grep -rn "getDay" src/` không có kết quả).
- **2. Triệu chứng:** `calculateDueDate()` cộng thẳng 24/72/120 **giờ lịch** vào `received_at`. Một phiếu tiếp nhận lúc **Chủ Nhật** vẫn bị coi là "đủ SLA" sau đúng 24 giờ — tức hết hạn vào **Chủ Nhật** hoặc **thứ Hai**, tức hệ thống hạn cam kết cho KTV vào ngày nghỉ.
- **3. Tái lập:** `npx jest tests/bt3-unit.test.js -t "TC-01"` → nhánh B (`receivedAt = 2026-10-25T03:00:00Z`, Chủ Nhật) FAIL tại `expect(dueCao.toISOString()).toBe('2026-10-26T17:00:00.000Z')` — thực tế trả `2026-10-26T03:00:00.000Z` (= `receivedAt + 24h` **lịch**).
- **4. Khoanh vùng + Nguyên nhân gốc:** `src/services/ticket.service.js` — `calculateDueDate()` dùng `new Date(baseTime + hours * 3600 * 1000)`. Nguyên nhân: SRS viết rõ "ngày làm việc" nhưng **không có mô hình lịch làm việc** trong prototype nên khi hiện thực, giờ Chủ Nhật bị tính như giờ bình thường — đặc tả và mã lệch nhau.
- **5. Cách sửa:** Thêm mô-đun mới `src/utils/sla.js` với `addWorkingHours()` / `calculateSlaDueDate()` / `isSundayLocal()` — bỏ qua **toàn bộ** Chủ Nhật, mốc giờ **UTC+7 cố định** (`TZ_OFFSET_MINUTES = 420`) để kết quả **không phụ thuộc múi giờ của máy chạy** (quan trọng khi chạy trong Docker với `TZ=UTC`); `calculateDueDate()` delegate sang `calculateSlaDueDate()`. Đồng thời cập nhật SRS (mục dữ liệu `due_date` + QT-04) để mô tả đúng hành vi.
- **6. Link commit (sau `v0.2`):** [`cca3ebc`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/cca3ebc55a2f6e11920f96d4453b019192860899) — `fix(sla): tinh han SLA theo gio lam viec, bo qua Chu Nhat (BUG-09 QT-04)` (4 files: `src/utils/sla.js` (mới), `src/services/ticket.service.js`, `tests/bt3-unit.test.js`, `tests/ticket.service.test.js`).
- **7. Xác nhận bằng test:** `npx jest tests/bt3-unit.test.js -t "TC-01"` → **PASS** cả 2 nhánh: nhánh A (Thứ 2) `CAO` = `2026-10-27T03:00:00.000Z` (+86 400 000 ms **đúng tuyệt đối**), `TRUNG_BINH` = `2026-10-29T03:00:00.000Z`, `THAP` = `2026-10-31T03:00:00.000Z`; nhánh B (Chủ Nhật) `CAO` = `2026-10-26T17:00:00.000Z` (+136 800 000 ms **> 24h lịch**, vì giờ Chủ Nhật bị loại). `npm test` → **6 suites / 45 tests PASS** *(tại thời điểm sửa BUG-07/08/09; hiện tại sau khi bổ sung TC-P4/TC-P5/TC-P6 và bộ hồi quy TC-13…TC-15: **52 tests PASS** (7 suites))*.

### BUG-10 (Critical — P2002 / chặn toàn bộ chức năng tiếp nhận phiếu): Sequence PostgreSQL không tiến sau khi seed
- **1. Mã + Mức độ:** `BUG-10` — **Critical** (vi phạm khả năng sử dụng cơ bản: *mọi* lệnh tạo phiếu và tạo KTV trả HTTP 500 sau khi nạp dữ liệu mẫu; phát hiện bởi **phép thử máy trắng** — `POST /api/tickets` trên container thật).
- **2. Triệu chứng:** Sau khi `docker compose up -d --build` (seed chạy thành công), gọi `POST /api/tickets` với payload hợp lệ trả **HTTP 500** với lỗi Prisma `P2002` (unique constraint) thay vì HTTP 201; tương tự `POST /api/technicians`. Lệnh `GET` vẫn chạy bình thường → triệu chứng "chỉ hỏng phần ghi".
- **3. Tái lập:** `docker compose up -d --build` → `TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"manager_tt2","password":"password123"}' | jq -r .data.token)` → `curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/tickets -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{...}'` → **500**; log container in `PrismaClientKnownRequestError … P2002`.
- **4. Khoanh vùng + Nguyên nhân gốc:** `prisma/seed.js` chèn bản ghi với **khoá chính `BIGSERIAL` chỉ định tường minh** (`ticket_id: 1`, `ticket_id: 2`, …) nên sequence `ticket_id_seq` của PostgreSQL **vẫn ở giá trị 1**; lệnh `create()` đầu tiên sau đó sinh `ticket_id = 1` → trùng với bản ghi seed → `P2002`. Bộ test unit BT2–BT3 dùng repository giả in-memory nên **không** có sequence thật và **không** bắt được lỗi này.
- **5. Cách sửa:** Tạo module mới `prisma/sync-sequences.js` hàm `syncSequences(prisma)` chạy `SELECT setval(pg_get_serial_sequence('<bảng>','<cột>'), COALESCE((SELECT MAX(<cột>) FROM <bảng>), 0) + 1, false)` cho 6 bảng (`service_center`, `issue_category`, `technician`, `customer`, `device`, `ticket`); gọi hàm này ở **cuối** `prisma/seed.js` (sau khi seed xong). Hàm **idempotent** — chạy lại nhiều lần vẫn cho cùng kết quả, không nhân đôi dữ liệu.
- **6. Xác nhận bằng test:** Test `TC-13` trong `tests/bt3-bugfix.test.js` → **PASS** (kiểm tra SQL `setval` được sinh đúng cho cả 6 bảng với `MAX + 1`); `docker compose exec api npm test` → **7 suites / 52 tests PASS**; phép thử máy trắng lần 2 (`docker compose up -d --build` lại) → `POST /api/tickets` trả **201** và số bản ghi vẫn giữ nguyên 4 phiếu + 1 phiếu mới (chứng minh seed idempotent).
- **7. Link commit:** [`630b593`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/630b5936ec3bf5d9b0cfd74cf8c7f847c3bcafe4) — `fix(bt3): sua 3 loi phat hien bang phep thu may trang (BUG-10/11/12)` (3 files mã nguồn + `prisma/sync-sequences.js` + `tests/bt3-bugfix.test.js`).

### BUG-11 (Major — P2002): Mã phiếu bị trùng sau khi xoá phiếu (generateTicketCode dùng COUNT(*))
- **1. Mã + Mức độ:** `BUG-11` — **Major** (vi phạm ràng buộc duy nhất `ticket_code`; phát hiện bởi **phép thử máy trắng**: xoá 1 phiếu rồi tạo phiếu mới).
- **2. Triệu chứng:** Xoá phiếu `BH-2-00002` (mã thứ 2 của trung tâm 2) rồi tạo phiếu mới → hệ thống sinh lại mã `BH-2-00004/2026` **trùng** với phiếu đang tồn tại → Prisma `P2002` → **HTTP 500**; trong khi lẽ ra phiếu mới phải nhận mã `BH-2-00005/2026`.
- **3. Tái lập:** `DELETE /api/tickets/2` (quyền `CENTER_MANAGER`) → HTTP 200 → `POST /api/tickets` → **500** `P2002`; log container: `Unique constraint failed on the fields: (`ticket_code`)`.
- **4. Khoanh vùng + Nguyên nhân gốc:** `src/repositories/ticket.repository.js` — `generateTicketCode()` dùng `count({ where: { centerId } })` để tính số thứ tự. Nguyên nhân: đếm số bản ghi **đang tồn tại** ≠ **giá trị lớn nhất đã dùng**; khi có bản ghi bị xoá, số đếm lùi và mã mới lặp lại mã cũ.
- **5. Cách sửa:** `generateTicketCode()` thay `count()` bằng `findFirst({ where: { centerId }, orderBy: { ticketId: 'desc' } })` để lấy `MAX(ticket_id)` của trung tâm rồi `+ 1`; mã luôn tăng đơn điệu kể cả sau khi xoá.
- **6. Xác nhận bằng test:** Test `TC-14` trong `tests/bt3-bugfix.test.js` → **PASS** (repository giả lập `findFirst` trả `ticketId = 4` → mã sinh ra là `BH-2-00005/2026`, không trùng); `npm test` → **7 suites / 52 tests PASS**.
- **7. Link commit:** [`630b593`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/630b5936ec3bf5d9b0cfd74cf8c7f847c3bcafe4) — `fix(bt3): sua 3 loi phat hien bang phep thu may trang (BUG-10/11/12)` (3 files mã nguồn + `prisma/sync-sequences.js` + `tests/bt3-bugfix.test.js`).

### BUG-12 (Major — A01 Broken Access Control / QT-14): KTV đặt được lịch hẹn cho phiếu của KTV khác
- **1. Mã + Mức độ:** `BUG-12` — **Major** (A01 Broken Access Control; vi phạm QT-14 "KTV chỉ được phân công và đặt lịch hẹn cho phiếu của chính mình"; phát hiện bởi **phép thử máy trắng** trên container thật).
- **2. Triệu chứng:** KTV `technicianId = 5` gọi `POST /api/tickets/3/appointment` (phiếu thuộc KTV `technicianId = 3`) với body hợp lệ → **HTTP 200** và lịch hẹn được tạo thành công cho phiếu của KTV khác. Trong khi đó `PUT /api/tickets/3` và `PATCH /api/tickets/3/status` đã bị chặn 403 từ BUG-04 → **lỗ hổng không nhất quán** giữa các endpoint nghiệp vụ.
- **3. Tái lập:** `curl -X POST http://localhost:3000/api/tickets/3/appointment -H "Authorization: Bearer <token KTV id=5>" -H 'Content-Type: application/json' -d '{"appointmentAt":"2026-11-20T09:00:00+07:00","appointmentStatus":"SCHEDULED"}'` → **200** (trong khi `PATCH /api/tickets/3/status` với cùng token → **403**).
- **4. Khoanh vùng + Nguyên nhân gốc:** `src/services/ticket.service.js` — `scheduleAppointment()` **không nhận tham số `caller`** nên không có dữ liệu để so sánh `ticket.technicianId` với người gọi; `src/routes/ticket.routes.js` cũng không truyền `req.user` xuống. Nguyên nhân gốc là khi vá BUG-04/BUG-07 (đường đọc và ghi trạng thái) **đã bỏ sót đường đặt lịch hẹn** — cùng một nguyên tắc A01 nhưng áp dụng không đầy đủ.
- **5. Cách sửa:** `scheduleAppointment()` nhận thêm tham số `caller` (`req.user`); khi `caller.role === 'TECHNICIAN'` mà `ticket.technicianId !== caller.id` → ném `KHONG_CO_QUYEN` (→ HTTP 403 qua `errorHandler`); `src/routes/ticket.routes.js` truyền `req.user` xuống cho `POST /:id/appointment`.
- **6. Xác nhận bằng test:** Test `TC-15` trong `tests/bt3-bugfix.test.js` → **PASS** (KTV khác chủ phiếu → 403 `KHONG_CO_QUYEN`, repository `create` **không** được gọi; chủ phiếu → 200); `npm test` → **7 suites / 52 tests PASS**.
- **7. Link commit:** [`630b593`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/630b5936ec3bf5d9b0cfd74cf8c7f847c3bcafe4) — `fix(bt3): sua 3 loi phat hien bang phep thu may trang (BUG-10/11/12)` (3 files mã nguồn + `prisma/sync-sequences.js` + `tests/bt3-bugfix.test.js`).

---

## TỔNG HỢP

| Mã | Mức độ | Nguồn phát hiện | Commit sửa | Trạng thái |
|:---|:---:|:---|:---|:---:|
| BUG-01 | Major | BT2 — đối chiếu cửa sổ trùng lịch với UC4/FR4 | [`fdc6c36`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/fdc6c36619f18c5460e7e7f04cf109e9d8a53830) | ✅ Đã sửa |
| BUG-02 | Major | BT2 — che SĐT làm mất kiểu `Date` | [`4aaef56`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/4aaef5679970569edde82483d525c4d5b605bc5d) | ✅ Đã sửa |
| BUG-03 | Major | BT2 — CORS mở + mật khẩu plaintext | [`80bdad8`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/80bdad804ed3cfc51b97e89db967621aa4974a78) | ✅ Đã sửa |
| BUG-04 | **Critical** | BT3 — `TC-11` (TC-SEC-01) | [`9add2b8`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/9add2b8e64e16634ac38c8cd42c27e09e66bf676) | ✅ Đã sửa |
| BUG-05 | **Critical** | BT3 — `TC-P1` (TC-SEC-02) | [`06c3180`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/06c3180ea518c38dad8cd0204ab0c22e7252e47c) | ✅ Đã sửa |
| BUG-06 | Major | BT3 — review checklist bảo mật | [`80bdad8`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/80bdad804ed3cfc51b97e89db967621aa4974a78) | ✅ Đã sửa |
| BUG-07 | **Critical** | BT3 — `TC-11` (TC-SEC-03), đường đọc A01 | [`be360fe`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/be360fec985bc3fbe7a090ed447dd98f6cfaf482) | ✅ Đã sửa |
| BUG-08 | Major | BT3 — đối chiếu QT-06 với `VALID_TRANSITIONS` | [`b0f2f9b`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/b0f2f9bf355ea493f5f14828695c7161af0b6e2f) | ✅ Đã sửa |
| BUG-09 | Major | BT3 — đối chiếu QT-04 với `calculateDueDate()` | [`cca3ebc`](https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4/commit/cca3ebc55a2f6e11920f96d4453b019192860899) | ✅ Đã sửa |
| BUG-10 | **Critical** | BT3 — **phép thử máy trắng** (`POST /api/tickets` → 500 P2002) | *(xem commit `BUG-10`)* | ✅ Đã sửa |
| BUG-11 | Major | BT3 — **phép thử máy trắng** (xoá phiếu → mã trùng, 500 P2002) | *(xem commit `BUG-11`)* | ✅ Đã sửa |
| BUG-12 | Major | BT3 — **phép thử máy trắng** (KTV đặt lịch cho phiếu KTV khác, A01/QT-14) | *(xem commit `BUG-12`)* | ✅ Đã sửa |

> **Tổng: 12 bug** (4 Critical · 8 Major) — **100% đã sửa**, mỗi bug đủ 7 dòng theo mẫu của đề BT3 mục 2.4, **100% link commit mở được** và trỏ đúng nội dung bản sửa. **0 bug đang mở.**
>
> **Điểm đáng chú ý:** 3 lỗi cuối (BUG-10/11/12) được phát hiện **hoàn toàn nhờ phép thử máy trắng** — tức là dựng hệ thống thật bằng Docker Compose và gọi endpoint trên PostgreSQL 16. Bộ test unit BT2–BT3 (repository giả in-memory) **không** bắt được 3 lỗi này, vì chúng chỉ xuất hiện khi có sequence PostgreSQL thật, ràng buộc unique thật và dữ liệu mẫu đã nạp. Đây là minh chứng cho giá trị thực tế của kiểm thử tích hợp trên môi trường thật.
