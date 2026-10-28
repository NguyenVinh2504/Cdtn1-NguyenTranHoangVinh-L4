# NHẬT KÝ THAY ĐỔI THIẾT KẾ (DESIGN CHANGE LOG)

> Tài liệu bắt buộc theo yêu cầu Bài tập 2 (Giai đoạn 2, Buổi 7–12) — Minh chứng tiêu chí 3 Rubric (Nhất quán & Tích lũy).  
> Quy ước định dạng mỗi thay đổi đúng 3 dòng: **thay đổi gì · vì sao · ảnh hưởng tới thành phần nào**.

---

### Thay đổi 1: Thống nhất mô hình lưu trữ lịch sử trạng thái bằng cột JSONB `status_history`

- **Thay đổi gì:** Loại bỏ hoàn toàn bảng quan hệ rời `ticket_status_log`, thống nhất sử dụng duy nhất cột `status_history` kiểu `JSONB` trong bảng `ticket` (đồng thời duy trì Database VIEW `v_ticket_status_log` phục vụ các truy vấn báo cáo/phẳng hoá); cập nhật đồng bộ các tiêu chí chấp nhận AC2.1, hậu điều kiện & bước 5 của Use Case UC2, và câu lập luận kiến trúc 2.
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
