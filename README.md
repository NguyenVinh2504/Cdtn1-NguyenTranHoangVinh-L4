# Quản lý trung tâm bảo hành phân công kỹ thuật viên cho phiếu bảo hành theo tay nghề và khối lượng công việc hiện tại, đặt lịch hẹn giao – nhận máy với khách, theo dõi trạng thái phiếu đến khi hoàn tất.

**Sinh viên:** Nguyễn Trần Hoàng Vinh - 2374802010562 - Track SE  
**Học phần:** Chuyên đề tốt nghiệp 1, HK1 2026–2027  
**Luồng nghiệp vụ:** L4 – Phân công kỹ thuật viên và lịch hẹn

---

## 1. Mục tiêu

Hệ thống giải quyết bài toán phân công kỹ thuật viên bảo hành tại các trung tâm thuộc Mekong Mobile. Phân hệ giúp Quản lý trung tâm phân bổ công việc công bằng và chuẩn xác dựa trên điểm tay nghề chuyên môn (`proficiency >= 3`) và khối lượng công việc thực tế, loại bỏ tình trạng lệch tải (40 vs 12 phiếu - V3) và giảm tỷ lệ trễ hạn cam kết SLA từ 15% về dưới 3% (V2). Đồng thời, hệ thống quản lý lịch hẹn giao nhận tránh trùng giờ làm việc của kỹ thuật viên.

---

## 2. Yêu cầu môi trường

- Node.js 20 LTS
- Hệ quản trị cơ sở dữ liệu: PostgreSQL 16
- Biến môi trường: xem file `.env.example`

---

## 3. Hướng dẫn chạy

_(Áp dụng cho giai đoạn hiện thực Bài tập 2 - ≤ 4 bước chuẩn)_

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
# Mở kiểm tra trạng thái dịch vụ tại: http://localhost:3000/health
```

---

## 4. Cấu trúc thư mục

- `docs/`: Chứa toàn bộ tài liệu đặc tả và thiết kế:
  - `srs.md` — Bản SRS 6 mục (Thành phần 1)
  - `usecase_spec.md`, `usecase.puml`, `usecase.drawio` — Sơ đồ & đặc tả Use Case (Thành phần 2)
  - `architecture.md`, `architecture.drawio` — Sơ đồ kiến trúc phân lớp và bảng lập luận NFR (Thành phần 3)
  - `erd.dbml`, `erd.drawio`, `schema.sql` — Mô hình dữ liệu 6 bảng (chuẩn 3NF, BT1 rút gọn từ 9 bảng gốc – Thành phần 4)
  - `api-contract.md` — Hợp đồng API REST/JSON (Tham chiếu chéo Thành phần 3)
  - `ai-disclosure.md` — Phụ lục khai báo sử dụng công cụ AI (bắt buộc)
- `data/sample/`: Dữ liệu mẫu kiểm thử nhỏ (vài trăm dòng từ case study).
- `src/`: Mã nguồn backend (Node.js/Express) phục vụ hiện thực ở Bài tập 2.
- `tests/`: Kịch bản kiểm thử tự động (Unit Test / Integration Test với Jest).

---

## 5. Kiểm thử

```bash
npm test
# Hiển thị số lượng test cases PASS theo chuẩn của Bài tập 2 và Bài tập 3
```

---

## 6. Trạng thái hiện tại

- [x] Khởi tạo project, cấu trúc thư mục, .gitignore, .env.example (Buổi 2)
- [x] Chốt phạm vi luồng L4, danh sách 8 User Story chuẩn INVEST & MoSCoW (Buổi 2 & 4)
- [x] Bản đặc tả yêu cầu SRS rút gọn 6 mục theo ISO/IEC/IEEE 29148 (Buổi 4)
- [x] Sơ đồ Use Case Diagram & Đặc tả chi tiết Use Case phân công UC2 (Buổi 4)
- [x] Hợp đồng API Contract chi tiết theo mẫu chuyên ngành Track SE (Buổi 4)
- [x] Thiết kế kiến trúc phân lớp + 4 câu lập luận gắn NFR1/2/3/4 (Buổi 5 - Thành phần 3)
- [x] Mô hình dữ liệu ERD 6 bảng chuẩn 3NF + SQL DDL + JSONB status_history (Buổi 5 - Thành phần 4)
- [ ] Wireframe 3 màn hình nghiệp vụ chính (Buổi 5 - Thành phần 5)
- [ ] Hiện thực module cốt lõi phân công kỹ thuật viên (Buổi 7–12, BT2)
