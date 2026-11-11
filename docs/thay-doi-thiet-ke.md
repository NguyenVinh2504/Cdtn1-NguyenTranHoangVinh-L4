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

- **Thay đổi gì:** Đổi tên hàm `test()` trong `tests/bt3-unit.test.js` và `tests/bt3-new.test.js` để **luôn bắt đầu bằng mã test case** như trong `docs/test-report.md` (ví dụ `TC-06 (TC-U06) (biên ĐẠT): …`), bỏ chuỗi mã `TC-Uxx` khỏi tiền tố `describe()`; thống nhất cách đếm giữa Test Plan và Test Report (12 mã TC ↔ 19 hàm `test()` lúc đầu trước khi bổ sung thêm 4 hàm tại Thay đổi 17 thành 23 hàm BT3 / 52 hàm toàn suite) và bổ sung bảng tra cứu nhanh mã TC → lệnh `npx jest -t "<mã>"` trong `docs/test-plan.md` Mục 4.3.1.
- **Vì sao:** Tiêu chí 3 của đề BT3 yêu cầu *"chạy lại 1 test case tại chỗ"* — giảng viên sẽ gõ `npx jest -t "TC-06"`. Nếu tên hàm `test()` không chứa mã `TC-06`, lệnh đó sẽ **skip toàn bộ** test và trông như test không thật. Đây là rủi ro lớn nhất khi GV đối chiếu trực tiếp Test Report với mã nguồn.
- **Ảnh hưởng tới thành phần nào:** `tests/bt3-unit.test.js`, `tests/bt3-new.test.js`, `docs/test-plan.md` (Mục 2.1, 2.2, 2.3, 4.3.1), `docs/test-report.md` (Bảng A, B, C, D).

---

### Thay đổi 14: Bổ sung test case thật cho QT-07 và QT-11 + bổ sung QT-11 vào SRS (đưa độ phủ truy vết lên 8/9 quy tắc)

- **Thay đổi gì:** (a) Thêm 3 mã test case phụ vào `tests/bt3-unit.test.js`: `TC-P4` (QT-07 — điều chuyển KTV trên phiếu đang `DA_PHAN_CONG` phải ghi kèm `note` lý do **không rỗng** vào `status_history`), `TC-P5` (QT-11 — **biên đạt**: KTV đang giữ đúng 8 phiếu mở → `KTV_QUA_TAI`, `update` 0 lần), `TC-P6` (QT-11 — **biên rớt**: 7 phiếu mở → vẫn phân công thành công). (b) Bổ sung **QT-11 (Chống quá tải kỹ thuật viên)** vào `docs/srs.md` Mục 5 — ràng buộc này đã có trong mã nguồn (`MAX_OPEN_TICKETS_PER_TECH = 8`) nhưng SRS chưa ghi, tức tài liệu và mã lệch nhau. (c) Cập nhật `docs/test-plan.md` (Mục 1.1, 1.2, 2.1, 2.3.1) và `docs/test-report.md` (Phụ lục D) để phản ánh đúng số lượng test và trạng thái kiểm thử của từng quy tắc.
- **Vì sao:** Tiêu chí 2.2 của đề BT3 yêu cầu **ít nhất 1 test cho MỖI quy tắc nghiệp vụ đã hiện thực**, nhưng Test Plan trước đó chỉ lập bảng truy vết cho 5 quy tắc trọng tâm và ghi *"chưa có test riêng"* cho QT-07 / QT-11 / QT-13 — trong khi đó QT-07 và QT-11 **đã hiện thực và kiểm được**; khai báo "chưa có test" cho chúng là rủi ro liêm chính học thuậc. Thay vì chỉ ghi chú ngoài phạm vi, em **bổ sung test thật** cho QT-07 và QT-11 (QT-13 đã có test `TC-TECH-3` trong bộ hồi quy BT-2 vẫn chạy cùng `npm test`). Đồng thời **bổ sung QT-11 vào SRS** để đặc tả mô tả đúng hệ thống thật (tiêu chí 3 / C9).
- **Ảnh hưởng tới thành phần nào:** `tests/bt3-unit.test.js`, `docs/srs.md` (Mục 5 — thêm QT-11), `docs/test-plan.md` (Mục 1.1, 1.2, 2.1, 2.2, 2.3, 2.3.1, 4.3.1), `docs/test-report.md` (Mục C, Phụ lục D).

---

## PHẦN 2 — THAY ĐỔI GIAI ĐOẠN 3 (BT3 — ĐÓNG GÓI, BẢO MẬT, TÀI LIỆU KỸ THUẬT)

> **Bối cảnh:** các mục dưới đây phát sinh trong quá trình thực hiện **thành phần 4, 5, 6** của
> Bài tập 3. Phần lớn được phát hiện bằng **phép thử máy trắng** (white-box test) — dựng
> toàn bộ hệ thống bằng Docker Compose và gọi thật từng endpoint trên PostgreSQL 16 —
> một cách kiểm thử mà bộ test unit trước đó (dùng repository giả in-memory) **không** bắt được.

### Thay đổi 15: Đóng gói toàn bộ hệ thống thành 3 dịch vụ Docker Compose chạy được bằng 2 lệnh

- **Thay đổi gì:** (a) Tạo `.dockerignore` loại trừ `node_modules`, `.env`, `.git`, `*.log`, `frontend/dist`, `coverage/` khỏi build context. (b) Sửa `Dockerfile` (backend): chia 2 giai đoạn `deps` → `runtime`, dùng `npm ci` (**giữ devDependencies** để `jest`/`supertest` chạy được *bên trong* container), `COPY tests ./tests`, chạy bằng `USER node` thay vì root, giữ `HEALTHCHECK` trỏ `/health`. (c) Tạo `frontend/Dockerfile` (multi-stage Vite build → Nginx) + `frontend/.dockerignore`. (d) Sửa `docker-compose.yml`: thêm `healthcheck` cho dịch vụ `web`, đặt `depends_on: condition: service_healthy` cho `api` và `web`, chuẩn hoá `env_file: .env`, ghi đè `DATABASE_URL` bằng tên service nội bộ `postgres`, bỏ thuộc tính `version` đã lỗi thời. (e) Bổ sung `.env.example` đủ 16 biến môi trường.
- **Vì sao:** Tiêu chí C1 của đề BT3 yêu cầu hệ thống *"chạy được bằng **tối đa 2 lệnh**"*, có **healthcheck cho mọi dịch vụ** và **dữ liệu mẫu nạp tự động**. Chạy bằng `npm install --omit=dev` như bản cũ khiến `jest` không tồn tại trong container nên bộ kiểm thử **không chạy được tại chỗ** — vi phạm tiêu chí C3. Chạy container bằng root là vi phạm OWASP A05:2025 (Security Misconfiguration).
- **Ảnh hưởng tới thành phần nào:** `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `frontend/Dockerfile`, `frontend/.dockerignore`, `.env.example`, `README.md`, `docs/deployment-guide.md`.

### Thay đổi 16: Đồng bộ `api-contract.md` và `srs.md` với 17 endpoint thật của mã nguồn

- **Thay đổi gì:** (a) `docs/api-contract.md`: viết lại Mục 1 (quy ước `camelCase` ở tầng API thay cho `snake_case`; cấu trúc phản hồi phẳng `{success, error, message, chiTiet}` thay cho mẫu RFC 7807; phân trang bằng `page`/`limit` + trường `total` thay cho đối tượng `pagination`); thay bảng endpoint cũ bằng **bảng 19 endpoint thật** kèm cột truy vết User Story; thêm **bảng ánh xạ endpoint cũ (BT1) → endpoint thật (BT3)** cho 5 endpoint "ma"; viết lại chi tiết 4 endpoint MUST và 3 endpoint SHOULD/COULD với payload thật; bổ sung bảng mã lỗi nghiệp vụ → HTTP status theo đúng `HTTP_CODE_MAP`; cập nhật bảng validation theo tên trường `camelCase` thật. (b) `docs/srs.md`: bổ sung cột **"Endpoint thực thi (BT3)"** vào bảng truy vết Mục 6, thêm Mục 6.1 (11 endpoint CRUD nền tảng) và Mục 6.2 (NFR được kiểm chứng bằng phép thử máy trắng).
- **Vì sao:** Bản BT1 mô tả **5 endpoint không tồn tại** trong mã nguồn (`GET /api/technicians/me/tickets`, `GET /api/technicians/workload`, `PATCH /api/tickets/{id}/appointment`, `GET /api/tickets/{id}/appointments`, `POST /api/tickets/{id}/reassign`) và dùng quy ước tên trường khác hệt mã thực thi. Đây là dạng lỗi **nhất quán tài liệu** (tiêu chí 3 Rubric) và tiêu chí C9. Theo phương án đã được chốt với GV khách hàng, ta **sửa tài liệu cho khớp hệ thống thật** thay vì bổ sung endpoint mới vào mã nguồn — vì bổ sung mã ở BT3 sẽ làm thay đổi phạm vi đã nộp ở BT1 và làm mất tính truy vết của `docs/test-plan.md` / `docs/test-report.md` đã được duyệt.
- **Ảnh hưởng tới thành phần nào:** `docs/api-contract.md` (viết lại toàn bộ), `docs/srs.md` (Mục 6, 6.1, 6.2 + ghi chú phiên bản đầu tài liệu), `docs/api-docs/api-reference.md`, `docs/api-docs/openapi.yaml`.

### Thay đổi 17: Bổ sung 3 lỗi phát hiện bằng phép thử máy trắng (BUG-10, BUG-11, BUG-12)

- **Thay đổi gì:** (a) **BUG-10 (CRITICAL)** — `prisma/seed.js` chèn bản ghi với khoá chính `BIGSERIAL` **chỉ định tường minh** nên sequence PostgreSQL không tiến; lệnh `create()` đầu tiên sau khi seed sinh `ticket_id = 1` trùng khoá → Prisma `P2002` → **HTTP 500** cho *mọi* lệnh tạo phiếu và tạo KTV. Khắc phục bằng module mới `prisma/sync-sequences.js` (`setval(pg_get_serial_sequence(...), MAX(cột)+1, false)` cho 6 bảng), được gọi ở cuối seed — **idempotent**, không nhân đôi dữ liệu. (b) **BUG-11 (MAJOR)** — `TicketRepository.generateTicketCode()` dùng `COUNT(*)` nên sau khi xoá 1 phiếu sẽ sinh lại mã **trùng** (`BH-2-00004/2026`) → `P2002` → HTTP 500; đổi sang lấy `MAX(ticket_id)` của trung tâm để mã luôn tăng đơn điệu. (c) **BUG-12 (MAJOR, A01/QT-14)** — `TicketService.scheduleAppointment()` **không kiểm tra chủ sở hữu**, nên một KTV chỉ cần biết `ticketId` là đặt được lịch hẹn cho phiếu của KTV khác; bổ sung tham số `caller` và kiểm tra `technicianId` của phiếu với `caller.id`, trả HTTP 403 `KHONG_CO_QUYEN`. Kèm bộ test mới `tests/bt3-bugfix.test.js` với 3 mã `TC-13`, `TC-14`, `TC-15`.
- **Vì sao:** Đây là 3 lỗi **chỉ lộ ra khi chạy trên hệ thống thật** (CSDL PostgreSQL + dữ liệu mẫu đã nạp). Bộ test unit BT2–BT3 dùng repository giả in-memory nên **không** bắt được: sequence và ràng buộc unique của PostgreSQL không tồn tại trong môi trường đó. Riêng BUG-10 là lỗi **chặn toàn bộ** chức năng tiếp nhận phiếu — hệ thống đã nạp dữ liệu mẫu thì **không tạo được phiếu mới**, tức là 2 trong 17 endpoint nghiệp vụ trả về lỗi 500. Tiêu chí 2.3 của đề BT3 yêu cầu ghi lại lỗi FAIL trung thực rồi sửa và ghi Bug Log — đây là minh chứng đúng tinh thần đó.
- **Ảnh hưởng tới thành phần nào:** `prisma/seed.js`, `prisma/sync-sequences.js` (mới), `src/repositories/ticket.repository.js`, `src/services/ticket.service.js`, `src/routes/ticket.routes.js`, `tests/bt3-bugfix.test.js` (mới), `docs/bug-log.md`, `docs/test-plan.md`, `docs/test-report.md`.

### Thay đổi 18: Bổ sung bộ tài liệu kỹ thuật Track SE — Deployment Guide, Security Checklist, API Reference

- **Thay đổi gì:** (a) `docs/deployment-guide.md` (tiếng Anh): 5 mục bắt buộc (Requirements · Setup steps · Environment variables · Sample data · Verify it works) + Troubleshooting + Monitoring & Alerts (2 cảnh báo 4 thành phần: đo gì / ngưỡng / gửi ai / làm gì). (b) `docs/checklist-bao-mat.md`: 7 mục tự đánh giá theo OWASP Top 10:2025, mỗi mục có **một dòng minh chứng là lệnh đã chạy thật kèm kết quả thật**; kèm bảng nhận biết 10 nhóm rủi ro OWASP và bảng "những gì hệ thống **chưa** làm" để minh bạch. (c) `docs/api-docs/api-reference.md`: **17 endpoint nghiệp vụ + 2 endpoint hạ tầng**, mỗi endpoint đủ **7 mục** (phương thức + đường dẫn · mô tả nghiệp vụ · yêu cầu xác thực · tham số + thân yêu cầu · thân phản hồi thành công · bảng mã lỗi · ghi chú giới hạn), ví dụ request/response **chép nguyên văn từ lần chạy thật**. (d) `docs/api-docs/openapi.yaml`: đặc tả OpenAPI 3.0.3 máy đọc được (13 path, 19 operation, 16 schema) sinh từ cùng nguồn. (e) `docs/api-docs/README.md`: trang chỉ mục.
- **Vì sao:** Đây là 3 thành phần còn thiếu của BT3: **thành phần 5** (Hướng dẫn triển khai + checklist bảo mật, mục C5–C6) và **thành phần 6** (Tài liệu kỹ thuật track SE, mục S1/C9). Việc ví dụ trong API Reference được **chép từ lần chạy thật** thay vì viết tay là để giữ đúng tinh thần minh bạch của đề bài (CLO3, CLO5) — mọi ví dụ đều đã được kiểm chứng bằng `curl` trên container đang chạy và HTTP status ghi kèm là status thật.
- **Ảnh hưởng tới thành phần nào:** `docs/deployment-guide.md` (mới), `docs/checklist-bao-mat.md` (mới), `docs/api-docs/api-reference.md` (mới), `docs/api-docs/openapi.yaml` (mới), `docs/api-docs/README.md` (mới).

### Thay đổi 19: Cập nhật `ai-disclosure.md` cho giai đoạn 3 và `README.md` cho khởi động 2 lệnh

- **Thay đổi gì:** (a) `docs/ai-disclosure.md`: bổ sung mục **Giai đoạn 3 (BT3)** với 4 cột bắt buộc (công cụ · dùng vào việc gì · áp dụng ở tệp/hàm nào · đã kiểm chứng thế nào), nêu rõ **có** dùng AI ở đâu (rà soát tài liệu, gợi ý test, gợi ý kiểm thử máy trắng) và **không** dùng ở đâu (quyết định nghiệp vụ, kết quả kiểm thử, phán đoán bảo mật). (b) `README.md`: đưa **2 lệnh chạy hệ thống** (`cp .env.example .env` + `docker compose up -d --build`) lên đầu trang, bổ sung mục "Tài liệu Bài tập 3" trỏ link tới toàn bộ tài liệu mới.
- **Vì sao:** Tiêu chí phụ lục của đề BT3 yêu cầu khai báo minh bạch việc sử dụng AI theo từng giai đoạn; đồng thời giúp người đánh giá **tái lập hệ thống trong 2 lệnh** mà không phải đọc tài liệu dài.
- **Ảnh hưởng tới thành phần nào:** `docs/ai-disclosure.md`, `README.md`.

---

### Thay đổi 20: Rà soát đồng bộ cuối cùng trước chốt tag `v1.0` (C1, C6, C9, S1)

- **Thay đổi gì:** (a) `src/repositories/ticket.repository.js`: bổ sung `dueDate` vào `updatePayload` của `update()` để thao tác `PUT /api/tickets/{id}` khi đổi `priority` lưu được hạn SLA mới vào PostgreSQL thật (khớp `TicketService.updateTicket()` và `TC-03`); thêm `UU_TIEN_KHONG_HOP_LE: 400` vào `HTTP_CODE_MAP` (`src/middlewares/errorHandler.middleware.js`). (b) `docker-compose.yml` & `src/app.js`: cố định `PORT: 3000` bên trong container `api` để đổi `API_PORT` trên máy host không phá vỡ mapping/healthcheck; đọc `CORS_ORIGIN || FRONTEND_URL` tại `src/app.js`; bổ sung cổng `5432` vào hướng dẫn `docs/deployment-guide.md`. (c) `docs/checklist-bao-mat.md` Mục 7: ghi trung thực kết quả `npm audit --omit=dev` (0 cảnh báo runtime) tách biệt với `npm audit` toàn phần (8 cảnh báo devDependencies backend và 2 devDependencies frontend) kèm kế hoạch xử lý. (d) Đồng bộ `docs/api-docs/api-reference.md`, `docs/api-docs/openapi.yaml`, `docs/api-contract.md`, `docs/bug-log.md` và `README.md` khớp 100% với hành vi thực tế của code (`GET /api/tickets/{id}` trả 403 cho KTV khác; phân trang bằng `limit`/`offset`; mã 409/404/400 ở `/assign`; ví dụ JSON thật từ `manager_tt2`; link commit ở bảng tổng hợp Bug Log).
- **Vì sao:** Kết quả tự kiểm tra và gọi API thật trên container Docker cho thấy tài liệu API, checklist bảo mật và `TicketRepository.update()` còn các điểm lệch nhỏ có thể gây mất điểm ở tiêu chí C9, S1, C6 và khi đổi cổng trên máy giảng viên (C1).
- **Ảnh hưởng tới thành phần nào:** `src/repositories/ticket.repository.js`, `src/middlewares/errorHandler.middleware.js`, `src/app.js`, `docker-compose.yml`, `docs/deployment-guide.md`, `docs/checklist-bao-mat.md`, `docs/api-docs/api-reference.md`, `docs/api-docs/openapi.yaml`, `docs/api-docs/README.md`, `docs/api-contract.md`, `docs/bug-log.md`, `README.md`.
