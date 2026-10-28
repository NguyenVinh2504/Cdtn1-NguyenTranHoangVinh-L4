# PHỤ LỤC: BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI

## HỆ THỐNG SMART CRM – MEKONG MOBILE

### Phân hệ: Luồng L4 – Phân công kỹ thuật viên và lịch hẹn

**Học phần:** Chuyên đề tốt nghiệp 1 (HK261)  
**Track:** Kỹ thuật phần mềm (SE)  
**Giai đoạn:** Bài tập 2 – Hiện thực hoá module cốt lõi (Buổi 7–12)

---

| Tên công cụ | Dùng vào việc gì | Áp dụng ở phần / tệp / hàm nào | Em đã kiểm chứng thế nào |
| :--- | :--- | :--- | :--- |
| **Antigravity (Google DeepMind)** | Gợi ý cấu trúc tài liệu SRS 6 mục theo chuẩn ISO/IEC/IEEE 29148 rút gọn | Mục 1 đến Mục 6 của bản SRS (`docs/srs.md`) | Đối chiếu từng mục với Slide bài giảng Buổi 3 và Buổi 4; tự rà soát danh sách 10 mục kiểm chứng của giảng viên. |
| **Antigravity (Google DeepMind)** | Hỗ trợ phát biểu 8 User Story theo đúng khuôn và kiểm tra 6 tiêu chí INVEST | Mục 3 của SRS (`docs/srs.md`) | Tự rà soát lại 4 lỗi thường gặp; chỉnh sửa các tiêu chí Given-When-Then cho sát với quy tắc nghiệp vụ QT-04, QT-08, thống nhất JSONB `status_history`. |
| **Antigravity (Google DeepMind)** | Tạo khung mã nguồn PlantUML và sơ đồ XML cho Use Case Diagram | Sơ đồ Use Case (`docs/usecase.puml`, `docs/usecase.drawio`) | Mở trực tiếp trên diagrams.net để kiểm tra vị trí Actor nằm ngoài ranh giới hệ thống, kiểm tra `<<include>>`, `<<extend>>`. |
| **Antigravity (Google DeepMind)** | Gợi ý cấu trúc hợp đồng API Contract chuẩn RESTful cho Track SE | Tài liệu hợp đồng API (`docs/api-contract.md`) | Rà soát các mã lỗi HTTP (400, 401, 403, 404, 409, 422) và bảng validation dựa trên Từ điển dữ liệu mẫu. |
| **Antigravity (Google DeepMind)** | Gợi ý cấu trúc khởi tạo lược đồ Prisma ORM và cấu hình quan hệ | `prisma/schema.prisma` | Đối chiếu trực tiếp với `docs/erd.dbml` và `db/schema.sql`; chạy `prisma validate` và kiểm tra đủ 6 bảng, khóa ngoại, kiểu dữ liệu JSONB `status_history`. |
| **Antigravity (Google DeepMind)** | Gợi ý cấu trúc phân lớp 3 tầng (Routes - Services - Repositories) và lớp lỗi `AppError` | `src/errors/AppError.js`, `src/validators/` | Kiểm tra độc lập từng file: đảm bảo trong `services/` không chứa `req`, `res`, mã HTTP hay câu lệnh SQL thô; toàn bộ chuyển đổi HTTP tập trung tại `routes/`. |
| **Antigravity (Google DeepMind)** | Gợi ý khung mã nguồn component `DataState.jsx` cho Frontend React | `frontend/src/components/DataState.jsx` | Tự kiểm thử thực tế cả 3 trạng thái: tắt backend để kiểm tra trạng thái lỗi có nút thử lại; lọc điều kiện trống để kiểm tra trạng thái rỗng có nút xóa bộ lọc; kiểm tra trạng thái tải khi delay mạng. |
| _— Tự thực hiện —_ | Quyết định logic nghiệp vụ phân công kỹ thuật viên (QT-08, QT-06), điều kiện chuyển trạng thái, giải thuật SLA và toàn bộ kịch bản kiểm thử | `src/services/ticket.service.js`, `tests/` | Viết 28 kiểm thử tự động (đủ 3 loại: luồng đúng, giá trị biên, dữ liệu sai & vi phạm ràng buộc) và chạy lệnh `npm test` PASS 100% độc lập, không phụ thuộc môi trường máy cục bộ. |
 
 ---
 
 ### CAM KẾT HỌC THUẬT:
 
 > _"Tôi xác nhận đã đọc, hiểu từng dòng mã nguồn và chịu trách nhiệm 100% về toàn bộ nội dung nộp trong hồ sơ bài tập này."_
 
 - **Sinh viên thực hiện:** Nguyễn Trần Hoàng Vinh
 - **Mã số sinh viên (MSSV):** 2374802010562
 - **Ngày cập nhật:** 28/10/2026
