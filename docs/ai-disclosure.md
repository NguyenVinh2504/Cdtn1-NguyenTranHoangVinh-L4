# PHỤ LỤC: BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI

## HỆ THỐNG SMART CRM – MEKONG MOBILE

### Phân hệ: Luồng L4 – Phân công kỹ thuật viên và lịch hẹn

**Học phần:** Chuyên đề tốt nghiệp 1 (HK261)  
**Track:** Kỹ thuật phần mềm (SE)  
**Giai đoạn:** Bài tập 2 – Hiện thực hoá module cốt lõi (Buổi 7–12) và Bài tập 3 – Kiểm thử, đóng gói, tài liệu kỹ thuật

---

## PHẦN A — GIAI ĐOẠN 2 (BÀI TẬP 2)

| Tên công cụ | Dùng vào việc gì | Áp dụng ở phần / tệp / hàm nào | Em đã kiểm chứng thế nào |
| :--- | :--- | :--- | :--- |
| **Antigravity (Google DeepMind)** | Gợi ý cấu trúc tài liệu SRS 6 mục theo chuẩn ISO/IEC/IEEE 29148 rút gọn | Mục 1 đến Mục 6 của bản SRS (`docs/srs.md`) | Đối chiếu từng mục với Slide bài giảng Buổi 3 và Buổi 4; tự rà soát danh sách 10 mục kiểm chứng của giảng viên. |
| **Antigravity (Google DeepMind)** | Hỗ trợ phát biểu 7 User Story theo đúng khuôn và kiểm tra 6 tiêu chí INVEST | Mục 3 của SRS (`docs/srs.md`) | Tự rà soát lại 4 lỗi thường gặp; chỉnh sửa các tiêu chí Given-When-Then cho sát với quy tắc nghiệp vụ QT-04, QT-08, thống nhất JSONB `status_history`. |
| **Antigravity (Google DeepMind)** | Tạo khung mã nguồn PlantUML và sơ đồ XML cho Use Case Diagram | Sơ đồ Use Case (`docs/usecase.puml`, `docs/usecase.drawio`) | Mở trực tiếp trên diagrams.net để kiểm tra vị trí Actor nằm ngoài ranh giới hệ thống, kiểm tra `<<include>>`, `<<extend>>`. |
| **Antigravity (Google DeepMind)** | Gợi ý cấu trúc hợp đồng API Contract chuẩn RESTful cho Track SE | Tài liệu hợp đồng API (`docs/api-contract.md`) | Rà soát các mã lỗi HTTP (400, 401, 403, 404, 409, 422) và bảng validation dựa trên Từ điển dữ liệu mẫu. |
| **Antigravity (Google DeepMind)** | Gợi ý cấu trúc khởi tạo lược đồ Prisma ORM và cấu hình quan hệ | `prisma/schema.prisma` | Đối chiếu trực tiếp với `docs/erd.dbml` và `db/schema.sql`; chạy `prisma validate` và kiểm tra đủ 6 bảng, khóa ngoại, kiểu dữ liệu JSONB `status_history`. |
| **Antigravity (Google DeepMind)** | Gợi ý cấu trúc phân lớp 3 tầng (Routes - Services - Repositories) và lớp lỗi `AppError` | `src/errors/AppError.js`, `src/validators/` | Kiểm tra độc lập từng file: đảm bảo trong `services/` không chứa `req`, `res`, mã HTTP hay câu lệnh SQL thô; toàn bộ chuyển đổi HTTP tập trung tại `routes/`. |
| **Antigravity (Google DeepMind)** | Gợi ý khung mã nguồn component `DataState.jsx` cho Frontend React | `frontend/src/components/DataState.jsx` | Tự kiểm thử thực tế cả 3 trạng thái: tắt backend để kiểm tra trạng thái lỗi có nút thử lại; lọc điều kiện trống để kiểm tra trạng thái rỗng có nút xóa bộ lọc; kiểm tra trạng thái tải khi delay mạng. |
| _— Tự thực hiện —_ | Quyết định logic nghiệp vụ phân công kỹ thuật viên (QT-08, QT-06), điều kiện chuyển trạng thái, giải thuật SLA và toàn bộ kịch bản kiểm thử | `src/services/ticket.service.js`, `tests/` | Viết 29 kiểm thử tự động (đủ 3 loại: luồng đúng, giá trị biên, dữ liệu sai & vi phạm ràng buộc) và chạy lệnh `npm test` PASS 100% độc lập, không phụ thuộc môi trường máy cục bộ. |

---

## PHẦN B — GIAI ĐOẠN 3 (BÀI TẬP 3)

> **Bối cảnh:** Giai đoạn 3 gồm kiểm thử theo đặc tả, sửa lỗi, đóng gói Docker và viết tài liệu
> kỹ thuật. AI được dùng như **công cụ soát lỗi và gợi ý cấu trúc** — không dùng để quyết định
> nội dung chuyên môn hay tạo ra kết quả kiểm thử. Mọi con số, mã lỗi và ví dụ trong tài liệu
> đều được **chạy lại bằng lệnh thật** trên container đang hoạt động trước khi ghi vào hồ sơ.

| Tên công cụ | Dùng vào việc gì | Áp dụng ở phần / tệp / hàm nào | Em đã kiểm chứng thế nào |
| :--- | :--- | :--- | :--- |
| **Cursor Agent / OpenCode (trợ lý lập trình AI)** | Rà soát tính nhất quán giữa tài liệu BT1 và mã nguồn, chỉ ra 5 endpoint "ma" không tồn tại (`/api/technicians/me/tickets`, `/api/technicians/workload`, `PATCH /api/tickets/{id}/appointment`, `GET /api/tickets/{id}/appointments`, `POST /api/tickets/{id}/reassign`) | `docs/api-contract.md`, `docs/srs.md`, `docs/thay-doi-thiet-ke.md` | Tự đếm lại bằng `grep -rnE "router\.(get|post|put|patch|delete)" src/routes/*.js` → đúng **17 endpoint nghiệp vụ**; tự mở từng tệp route để đối chiếu phương thức, đường dẫn và mã lỗi. |
| **Cursor Agent / OpenCode** | Gợi ý khung 5 mục bắt buộc của Deployment Guide, mục Troubleshooting và 2 cảnh báo Monitoring | `docs/deployment-guide.md` | Chạy lại toàn bộ quy trình trên máy sạch: `docker compose down -v` → `up -d --build` → `ps` → `curl /health` → `npm test`; chép nguyên văn output thật (3 dịch vụ healthy, 52 test PASS). |
| **Cursor Agent / OpenCode** | Gợi ý bố cục checklist bảo mật 7 mục theo OWASP Top 10:2025 và cách viết minh chứng dạng "lệnh + kết quả" | `docs/checklist-bao-mat.md` | Tự chạy từng lệnh minh chứng: `git check-ignore -v .env`, `git log --all --oneline -- .env`, `grep` secret trong log, `curl` các trường hợp 403/400, `npm audit`; chỉ giữ kết quả khớp với lần chạy thật. |
| **Cursor Agent / OpenCode** | Gợi ý khung 7 mục cho mỗi endpoint và cấu trúc OpenAPI 3.0 | `docs/api-docs/api-reference.md`, `docs/api-docs/openapi.yaml`, `docs/api-docs/README.md` | Gọi thật từng endpoint bằng `curl` trên container, ghi lại đúng HTTP status và payload; đối chiếu danh sách path trong OpenAPI với 17 route trong `src/routes/`. |
| **Cursor Agent / OpenCode** | Gợi ý kịch bản kiểm thử biên cho các lỗi phát hiện bằng phép thử máy trắng (sequence PostgreSQL, mã phiếu trùng sau khi xoá, phân quyền đặt lịch hẹn) | `tests/bt3-bugfix.test.js` (TC-13, TC-14, TC-15), `prisma/sync-sequences.js` | Tự tái hiện lỗi trên hệ thống thật trước khi sửa, sau đó chạy `docker compose exec api npm test` → **52/52 PASS**; chạy lại kịch bản `curl` để xác nhận HTTP 403 thay vì 200. |
| **Cursor Agent / OpenCode** | Gợi ý cách trình bày Bug Log, Test Plan, Test Report và các mục "Thay đổi thiết kế" | `docs/bug-log.md`, `docs/test-plan.md`, `docs/test-report.md`, `docs/thay-doi-thiet-ke.md` | Đối chiếu từng mã BUG/TC với mã nguồn và lịch sử commit; tự chạy lại test case tương ứng trước khi điền trạng thái PASS/FAIL. |
| _— Tự thực hiện —_ | Quyết định nghiệp vụ (QT-04, QT-06, QT-08, QT-11, QT-14), phán đoán mức độ rủi ro bảo mật, kết luận PASS/FAIL của từng test case, nội dung Bug Log và quyết định sửa mã hay sửa tài liệu | `src/services/`, `src/repositories/`, `src/utils/sla.js`, `docs/bug-log.md`, `docs/test-report.md` | Tự đọc và hiểu từng dòng mã; tự chạy lệnh kiểm chứng; không ghi bất kỳ kết quả nào chưa quan sát được từ terminal. |

### Bảng phân định "AI làm gì" và "em làm gì"

| Hoạt động | AI hỗ trợ | Em tự thực hiện / quyết định |
| :--- | :---: | :--- |
| Gợi ý bố cục tài liệu (SRS, Deployment Guide, Checklist, API Reference) | ✅ | — |
| Viết nội dung chuyên môn, mã lỗi, quy tắc nghiệp vụ | — | ✅ |
| Phát hiện tài liệu mô tả endpoint không tồn tại | ✅ (gợi ý) | ✅ (tự xác minh bằng `grep` + đọc mã) |
| Viết mã sửa lỗi (BUG-10, BUG-11, BUG-12) | ✅ (gợi ý hướng sửa) | ✅ (tự kiểm tra, chạy test, chấp nhận/từ chối) |
| Chạy phép thử máy trắng và ghi nhận kết quả | — | ✅ |
| Kết luận PASS/FAIL, mức độ nghiêm trọng bug | — | ✅ |
| Sinh ví dụ request/response trong API Reference | — | ✅ (chép từ `curl` thật) |

> **Ghi chú minh bạch:** AI từng gợi ý một số câu chữ và cấu trúc mục; tuy nhiên **không** có
> đoạn mã, số liệu hay kết quả kiểm thử nào được đưa vào hồ sơ mà chưa được em chạy lại và
> đối chiếu với hệ thống thật. Các lỗi BUG-10/11/12 được phát hiện bằng phép thử máy trắng
> (dựng Docker Compose và gọi endpoint trên PostgreSQL 16), không phải do AI suy đoán.

---

### CAM KẾT HỌC THUẬT:

> _"Tôi xác nhận đã đọc, hiểu từng dòng mã nguồn và chịu trách nhiệm 100% về toàn bộ nội dung nộp trong hồ sơ bài tập này."_

- **Sinh viên thực hiện:** Nguyễn Trần Hoàng Vinh
- **Mã số sinh viên (MSSV):** 2374802010562
- **Ngày cập nhật:** 11/11/2026
