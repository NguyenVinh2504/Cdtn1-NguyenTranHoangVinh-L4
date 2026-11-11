# NHẬT KÝ THAY ĐỔI THIẾT KẾ (DESIGN CHANGE LOG)

> Tài liệu bắt buộc theo yêu cầu Bài tập 2 (Giai đoạn 2, Buổi 7–12) — Minh chứng tiêu chí 3 Rubric (Nhất quán & Tích lũy).  
> Quy ước định dạng mỗi thay đổi đúng 3 dòng: **thay đổi gì · vì sao · ảnh hưởng tới thành phần nào**.

---

### Thay đổi 1: Thống nhất mô hình lưu trữ lịch sử trạng thái bằng cột JSONB `status_history`

- **Thay đổi gì:** Loại bỏ hoàn toàn bảng quan hệ rời `ticket_status_log`, thống nhất sử dụng duy nhất cột `status_history` kiểu `JSONB` trong bảng `ticket` (lịch sử được đọc trực tiếp từ cột JSONB này qua repository; các VIEW `v_ticket_status_log` / `v_appointments` chỉ là bản thiết kế của Bài tập 1 trong `db/schema.sql` và **không được triển khai** trong migration chính thức — xem Thay đổi 12); cập nhật đồng bộ các tiêu chí chấp nhận AC2.1, hậu điều kiện & bước 5 của Use Case UC2, và câu lập luận kiến trúc 2.
- **Vì sao:** Khắc phục mâu thuẫn giữa mô hình thực thể ERD 6 bảng đã gộp JSONB với mô tả bằng lời còn sót lại từ bản thảo cũ; mô hình Document-in-Row (JSONB) giúp giảm 1 phép `JOIN` trên đường dẫn găng truy vấn chi tiết phiếu (đáp ứng NFR1: < 1.5s với 10.000 bản ghi) và đảm bảo tính nguyên tử tuyệt đối (ACID) khi cập nhật trạng thái phiếu và ghi nhận lịch sử trong cùng một thao tác.
- **Ảnh hưởng tới thành phần nào:** `docs/srs.md` (mục 1.4, AC2.1, QT-06), `docs/usecase_spec.md` (UC2, UC6, UC7), `docs/architecture.md` (mục 3.1, 3.3 câu 2, bảng interface Repository), `src/services/ticket.service.js`, `src/repositories/ticket.repository.js`.

---

### Thay đổi 2: Chuẩn hóa điểm đánh giá tay nghề kỹ thuật viên thành cột `proficiency` đơn nhất trong bảng `technician`

- **Thay đổi gì:** Thay vì lưu điểm tay nghề theo từng nhóm sự cố ở bảng phụ (`technician_skill`), chuẩn hóa thành một điểm số đánh giá năng lực chuyên môn tổng thể `proficiency` (thang điểm nguyên từ 1 đến 5: 1–Sơ cấp/Học việc đến 5–Chuyên gia) đặt trực tiếp trong bảng `technician`; sửa AC2.2 và bảng thuật ngữ thành kiểm tra điều kiện `technician.proficiency >= 3` cho toàn bộ các nhóm sự cố tại trung tâm.
- **Vì sao:** Đảm bảo tính nhất quán tuyệt đối giữa ERD 6 bảng và đặc tả SRS/UC; đơn giản hóa logic kiểm tra hợp lệ tại lớp nghiệp vụ Service và Trigger CSDL (`trg_check_assignment_skill`); phù hợp với mô hình hoạt động thực tế của Mekong Mobile ở quy mô tiếp nhận sửa chữa đa năng tại trung tâm chi nhánh.
- **Ảnh hưởng tới thành phần nào:** `docs/srs.md` (bảng thuật ngữ, AC2.2, QT-08), `docs/usecase_spec.md` (UC2 bước 2, luồng ngoại lệ 2a), `docs/architecture.md` (câu lập luận 4), `src/services/technician.service.js`, `src/services/ticket.service.js`, `prisma/schema.prisma`.

---

### Thay đổi 3: Ứng dụng Prisma ORM kết hợp PostgreSQL trong kiến trúc 3 lớp backend

- **Thay đổi gì:** Sử dụng Prisma ORM làm cơ chế truy xuất dữ liệu chính ở tầng Repository (thay vì viết thuần câu lệnh SQL rời rạc bằng thư viện `pg`), định nghĩa schema thống nhất tại `prisma/schema.prisma` và tự động sinh Prisma Client type-safe.
- **Vì sao:** Đảm bảo an toàn kiểu dữ liệu, ngăn ngừa triệt để lỗi SQL Injection, đơn giản hóa việc quản lý transaction ACID ở lớp Service (`prisma.$transaction`), và tự động hóa migration tái lập CSDL từ trạng thái trống (`npx prisma migrate dev` / `db push`).
- **Ảnh hưởng tới thành phần nào:** `src/repositories/`, `prisma/schema.prisma`, `prisma/seed.js`, `package.json`, `README.md`.

---

### Thay đổi 4: Bổ sung lớp API Client tập trung và quản lý 3 trạng thái tại Frontend React

- **Thay đổi gì:** Xây dựng module `src/api/client.js` và các hàm API chuyên biệt (`tickets.api.js`, `technicians.api.js`), cấm gọi `fetch`/`axios` trực tiếp trong components; xây dựng component `DataState.jsx` xử lý tập trung 3 trạng thái: Đang tải (Loading), Rỗng (Empty - phân biệt rỗng dữ liệu và rỗng do bộ lọc), Lỗi (Error có nút thử lại).
- **Vì sao:** Tuân thủ chuẩn mực thiết kế Buổi 9–10 của học phần Track SE; nâng cao trải nghiệm người dùng, đảm bảo kiểm thử và mở rộng dễ dàng mà không làm phân tán mã nguồn gọi mạng.
- **Ảnh hưởng tới thành phần nào:** Thư mục `frontend/src/api/`, `frontend/src/components/`, `frontend/src/pages/`, `README.md`.

---

### Thay đổi 5: Chuẩn hóa bộ Endpoint RESTful và bổ sung đầy đủ 4 thao tác CRUD cho 2 thực thể độc lập

- **Thay đổi gì:** Chuẩn hóa đường dẫn API từ `/api/technicians/me/tickets` thành `/api/tickets/technician/mine`, gộp logic điều chuyển vào `POST /api/tickets/:id/assign` (hỗ trợ cả phân công lần đầu và điều chuyển), tích hợp endpoint gợi ý KTV kèm tính sẵn khối lượng tải `GET /api/technicians/candidates-for-ticket/:ticketId`, và bổ sung đầy đủ 4 thao tác CRUD (POST, GET, PUT, DELETE) cho cả 2 thực thể `Ticket` và `Technician`.
- **Vì sao:** Tuân thủ quy chuẩn thiết kế RESTful định hướng tài nguyên (Resource-Oriented), tối ưu hóa luồng giao diện Quản lý chọn KTV đạt chuẩn trong <= 3 click (đáp ứng NFR4), và thỏa mãn trực tiếp tiêu chí kỹ thuật bắt buộc S1 của Đề bài Bài tập 2 Track SE.
- **Ảnh hưởng tới thành phần nào:** `docs/api-contract.md`, `src/routes/ticket.routes.js`, `src/routes/technician.routes.js`, `src/services/ticket.service.js`, `src/services/technician.service.js`, `frontend/src/api/`.

---

### Thay đổi 6: Tinh gọn danh sách User Story từ 8 xuống đúng 7 câu (Gộp tính năng Điều chuyển vào Phân công)

- **Thay đổi gì:** Gộp User Story US8 (Điều chuyển kỹ thuật viên) vào US2 (Phân công kỹ thuật viên), cập nhật phát biểu US2 thành *"Là Quản lý trung tâm, tôi muốn phân công hoặc điều chuyển kỹ thuật viên có đủ năng lực chuyên môn (proficiency >= 3) và cùng trung tâm cho phiếu bảo hành (kèm lý do bắt buộc khi điều chuyển)..."*; loại bỏ mã US8 độc lập để tổng danh sách User Story đạt đúng chuẩn 7 câu (khớp khung gợi ý 5–7 của Đề bài); đồng thời bổ sung tiêu chí chấp nhận AC2.4 và cập nhật ma trận truy vết Traceability Matrix.
- **Vì sao:** Tiếp thu phản hồi chấm điểm Bài tập 1 về việc số lượng User Story vượt khung quy định (8 US so với yêu cầu 5–7); đồng thời phản ánh chính xác kiến trúc mã nguồn và API của Bài tập 2 khi thao tác phân công lần đầu và điều chuyển đã được gộp chung vào một endpoint duy nhất `POST /api/tickets/:id/assign` (đã nêu tại Thay đổi 5).
- **Ảnh hưởng tới thành phần nào:** `docs/srs.md` (mục 3.2 bảng User Story, mục 3.3 tiêu chí AC2.4, mục 6 bảng Traceability Matrix), `docs/usecase_spec.md` (mục bảng tổng quan UC và liên kết US2/UC7), `docs/architecture.md`.

---

### Thay đổi 7: Hiện thực transaction ACID + `SELECT FOR UPDATE` và migration versioned

- **Thay đổi gì:** `TicketService.assignTechnician()` mở `prisma.$transaction`; `TicketRepository.lockById()` khóa dòng phiếu bằng `SELECT ... FOR UPDATE` trước khi gán KTV và append `status_history`; thêm `prisma/migrations/20261029000000_init` để dựng 6 bảng từ CSDL trống bằng `npx prisma migrate deploy`.
- **Vì sao:** Khớp NFR3 đã mô tả ở BT1 (một transaction, 0% gán trùng) và tiêu chí S3 của BT2 (có tệp migration, không chỉ `db push`); Prisma CLI chuyển sang `dependencies` để Docker production chạy được migrate.
- **Ảnh hưởng tới thành phần nào:** `src/services/ticket.service.js`, `src/repositories/ticket.repository.js`, `src/repositories/technician.repository.js`, `prisma/migrations/`, `package.json`, `Dockerfile`, `README.md`, `docs/architecture.md`.


---

## GIAI ĐOẠN BÀI TẬP 3 — KIỂM THỬ & ĐÓNG GÓI PROTOTYPE

> Các thay đổi dưới đây phát sinh trong quá trình thực hiện Bài tập 3 (viết test theo đặc tả, ghi nhận FAIL trung thực, sửa nguyên nhân gốc và commit riêng từng bug). Mỗi mục gắn với 1 mã bug tương ứng trong `docs/bug-log.md`.

### Thay đổi 8: Bắt buộc xác thực JWT cho toàn bộ API nghiệp vụ và bỏ cơ chế "fallback manager" mặc định

- **Thay đổi gì:** Xóa nhánh fallback cuối của `authenticate()` trong `src/middlewares/auth.middleware.js` — vốn gán mọi request ẩn danh thành `{ role: 'CENTER_MANAGER', centerId: 2 }`; thay bằng `AppError('XAC_THUC_KHONG_HOP_LE')` (→ HTTP 401). Giữ whitelist công khai `['/health', '/', '/api/auth/login']` cho healthcheck Docker và đăng nhập. Đồng thời cấu hình CORS theo whitelist `FRONTEND_URL` thay vì `cors()` mở toàn bộ origin, và băm mật khẩu bằng `bcryptjs` thay vì lưu plaintext trong `src/services/auth.service.js`.
- **Vì sao:** NFR2 của SRS quy định **100% API nghiệp vụ phải xác thực JWT**; nhánh fallback đã vô hiệu hóa toàn bộ lớp xác thực và biến mọi endpoint thành công khai. Đồng thời, CORS mở + mật khẩu plaintext vi phạm checklist bảo mật và làm lộ thông tin khi repo bị rò rỉ.
- **Ảnh hưởng tới thành phần nào:** `src/middlewares/auth.middleware.js`, `src/services/auth.service.js`, `src/app.js`, `tests/api.routes.test.js`; tài liệu: `docs/checklist-bao-mat.md`, `docs/bug-log.md` (BUG-05, BUG-06).

---

### Thay đổi 9: Enforce phạm vi dữ liệu theo chủ sở hữu trên **cả đường ghi và đường đọc** (A01 Broken Access Control / QT-14)

- **Thay đổi gì:** Bổ sung tham số `caller` (`req.user`) vào `transitionStatus()`, `updateTicket()`, `getTicketDetail()`, `listTickets()`, `listTechnicianTickets()` trong `src/services/ticket.service.js` và ném `KHONG_CO_QUYEN` (→ HTTP 403) khi `caller.role === 'TECHNICIAN'` mà `ticket.technicianId ≠ caller.id`. Ở tầng route (`src/routes/ticket.routes.js`): `GET /technician/mine` cưỡng chế `technicianId = req.user.id` và từ chối (403) nếu query chỉ định KTV khác; `GET /unassigned` chặn role `TECHNICIAN`; `GET /` và `GET /:id` truyền `req.user` xuống service.
- **Vì sao:** QT-14 quy định *"Kỹ thuật viên chỉ có quyền truy xuất các phiếu bảo hành được gán cho chính mình"*. Trước đó, `GET /technician/mine` lấy `technicianId` từ **`req.query`** — tham số do client kiểm soát — nên KTV id = 5 đọc được phiếu của KTV id = 3; `getTicketDetail()` và `listTickets()` không có nơi để so sánh chủ sở hữu. Đây là lỗ hổng **A01 Broken Access Control** mà giảng viên rất dễ tự phát hiện khi đối chiếu SRS với mã nguồn.
- **Ảnh hưởng tới thành phần nào:** `src/services/ticket.service.js`, `src/routes/ticket.routes.js`, `tests/bt3-new.test.js`; tài liệu: `docs/srs.md` (QT-14), `docs/bug-log.md` (BUG-04, BUG-07), `docs/test-report.md` (TC-11).

---

### Thay đổi 10: Tính hạn cam kết SLA theo **giờ làm việc** thay vì giờ lịch (QT-04)

- **Thay đổi gì:** Thêm mô-đun mới `src/utils/sla.js` (`addWorkingHours()`, `calculateSlaDueDate()`, `isSundayLocal()`, `SLA_HOURS`); `calculateDueDate()` trong `src/services/ticket.service.js` chuyển sang delegate sang `calculateSlaDueDate()`. Mốc giờ dùng hằng số cố định **UTC+7** (`TZ_OFFSET_MINUTES = 420`) nên kết quả không phụ thuộc múi giờ của máy chạy (quan trọng khi chạy trong Docker với `TZ=UTC`).
- **Vì sao:** QT-04 trong SRS quy định *"Thời gian chỉ tính trong ngày làm việc (từ thứ Hai đến thứ Bảy, trừ Chủ Nhật)"*, nhưng mã nguồn cộng thẳng 24/72/120 **giờ lịch** — một phiếu tiếp nhận tối Chủ Nhật vẫn bị coi là "đủ SLA" sau đúng 24 giờ, tức hệ thống hạn cam kết cho KTV vào ngày nghỉ. Đặc tả và mã lệch nhau là dạng lỗi "tài liệu mô tả tính năng chưa có trong code" — cần sửa **mã** chứ không sửa câu chữ trong SRS.
- **Ảnh hưởng tới thành phần nào:** `src/utils/sla.js` (mới), `src/services/ticket.service.js`, `tests/bt3-unit.test.js`, `tests/ticket.service.test.js`; tài liệu: `docs/srs.md` (bảng thuật ngữ `due_date`, QT-04), `docs/bug-log.md` (BUG-09), `docs/test-plan.md` (TC-01, TC-03).

---

### Thay đổi 11: Làm sạch vòng đời trạng thái — bỏ self-loop `DA_PHAN_CONG → DA_PHAN_CONG` (QT-06)

- **Thay đổi gì:** Bỏ `'DA_PHAN_CONG'` khỏi `VALID_TRANSITIONS['DA_PHAN_CONG']` trong `src/services/ticket.service.js`; giữ nguyên và ghi chú rõ ngoại lệ duy nhất `CHO_LINH_KIEN → DANG_XU_LY` (đã có linh kiện thay thế, KTV tiếp tục xử lý). Cập nhật mô tả QT-06 trong `docs/srs.md` cho khớp hành vi thật.
- **Vì sao:** QT-06 quy định *"Tuyệt đối không được chuyển ngược về trạng thái trước đó"*, và chuyển sang **chính trạng thái hiện tại** không phải là chuyển trạng thái — nó chỉ ghi thêm một phần tử `status_history` rác có `from = to`, làm nhiễu lịch sử JSONB và khiến UI hiển thị "đã chuyển trạng thái" dù trạng thái không đổi.
- **Ảnh hưởng tới thành phần nào:** `src/services/ticket.service.js`, `tests/bt3-unit.test.js` (TC-P3); tài liệu: `docs/srs.md` (QT-06), `docs/bug-log.md` (BUG-08).

---

### Thay đổi 12: Đồng bộ tài liệu đặc tả với hệ thống thật (loại bỏ mô tả VIEW không tồn tại)

- **Thay đổi gì:** Sửa `docs/srs.md`: mục dữ liệu `status_history` và FR4 bỏ tham chiếu *"truy vấn qua VIEW `v_ticket_status_log` / `v_appointments`"* (thay bằng mô tả đọc trực tiếp từ cột JSONB `ticket.status_history` và từ các cột `appointment_at` / `appointment_status` qua repository); QT-06 bổ sung ngoại lệ `CHO_LINH_KIEN → DANG_XU_LY` và quy tắc chặn chuyển tự thân.
- **Vì sao:** Migration chính thức `prisma/migrations/20261029000000_init/migration.sql` chỉ tạo **6 bảng**, **không tạo VIEW nào**; các VIEW chỉ nằm trong `db/schema.sql` — bản thiết kế của Bài tập 1 **không được triển khai**. Tài liệu mô tả tính năng không tồn tại là dạng lỗi nhất quán (tiêu chí 3 Rubric) và tiêu chí C9 — nên phải sửa tài liệu để khớp mã nguồn đang chạy thật.
- **Ảnh hưởng tới thành phần nào:** `docs/srs.md` (mục 1.4 bảng thuật ngữ, FR4, QT-06), `docs/usecase_spec.md` (UC6, UC9 — cập nhật câu chữ "truy vấn VIEW" thành "kiểm tra qua repository"); tài liệu: `docs/architecture.md` (sơ đồ lớp dữ liệu), `docs/erd.dbml` (chú thích VIEW tham khảo).

---

### Thay đổi 13: Chuẩn hóa mã test case theo bộ mã `TC-01…TC-12` để chạy lại từng test case tại chỗ

- **Thay đổi gì:** Đổi tên hàm `test()` trong `tests/bt3-unit.test.js` và `tests/bt3-new.test.js` để **luôn bắt đầu bằng mã test case** như trong `docs/test-report.md` (ví dụ `TC-06 (TC-U06) (biên ĐẠT): …`), bỏ chuỗi mã `TC-Uxx` khỏi tiền tố `describe()`; thống nhất cách đếm giữa Test Plan và Test Report (12 mã TC ↔ 16 hàm `test()` của bộ BT3 ↔ 45 hàm của toàn suite) và bổ sung bảng tra cứu nhanh mã TC → lệnh `npx jest -t "<mã>"` trong `docs/test-plan.md` Mục 4.3.1.
- **Vì sao:** Tiêu chí 3 của đề BT3 yêu cầu *"chạy lại 1 test case tại chỗ"* — giảng viên sẽ gõ `npx jest -t "TC-06"`. Nếu tên hàm `test()` không chứa mã `TC-06`, lệnh đó sẽ **skip toàn bộ** test và trông như test không thật. Đây là rủi ro lớn nhất khi GV đối chiếu trực tiếp Test Report với mã nguồn.
- **Ảnh hưởng tới thành phần nào:** `tests/bt3-unit.test.js`, `tests/bt3-new.test.js`, `docs/test-plan.md` (Mục 2.1, 2.2, 2.3, 4.3.1), `docs/test-report.md` (Bảng A, B, C, D).
