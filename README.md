# MEKONG MOBILE SMART CRM — PHÂN HỆ LUỒNG L4

> **Quản lý trung tâm bảo hành phân công kỹ thuật viên cho phiếu bảo hành theo tay nghề và khối lượng công việc hiện tại, đặt lịch hẹn giao – nhận máy với khách, theo dõi trạng thái phiếu đến khi hoàn tất.**

- **Sinh viên thực hiện:** Nguyễn Trần Hoàng Vinh
- **MSSV:** 2374802010562
- **Track chuyên ngành:** Kỹ thuật phần mềm (SE)
- **Học phần:** Chuyên đề tốt nghiệp 1 (HK261, 2026–2027) — Khoa CNTT, Đại học Văn Lang
- **Tiến độ hiện tại:** Hoàn tất Giai đoạn 2 tới **Buổi 10** (Module cốt lõi, Module mở rộng & Giao diện Sprint 2)
- **Phiên bản release:** `v0.2` (Tag: `v0.2`)

---

## 1. Tóm tắt hệ thống

Hệ thống Smart CRM - Luồng L4 giải quyết trọn vẹn bài toán điều phối sửa chữa thiết bị tại các trung tâm bảo hành thuộc chuỗi Mekong Mobile. Phân hệ cung cấp giao diện trực quan cho Quản lý trung tâm lọc phiếu chờ xử lý, tự động gợi ý danh sách kỹ thuật viên đủ điều kiện năng lực chuyên môn (`proficiency >= 3`) và cùng trung tâm tiếp nhận (QT-08), hiển thị khối lượng công việc hiện tại để cân bằng tải, đồng thời đặt lịch hẹn giao – nhận máy có kiểm tra xung đột trùng giờ (FR4). Kỹ thuật viên có giao diện riêng để theo dõi phiếu theo hạn cam kết SLA tăng dần (`due_date` theo QT-04), cập nhật trạng thái sửa chữa theo vòng đời một chiều không đảo ngược (`status_history` JSONB theo QT-06) và đảm bảo che số điện thoại khách hàng dạng `090****567` (QT-15).

---

## 2. Công nghệ sử dụng

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons. Kiến trúc gọi API tách lớp riêng (`src/api/client.js`, `tickets.api.js`, `technicians.api.js`), xử lý tập trung 3 trạng thái (Đang tải, Rỗng có nút xóa lọc, Lỗi có nút thử lại).
- **Backend:** Node.js 20 LTS, Express, Prisma ORM 5. Kiến trúc tách rời nghiêm ngặt 3 tầng: `routes/` (HTTP & mapping mã lỗi) ↔ `services/` (chứa toàn bộ quy tắc nghiệp vụ, không phụ thuộc HTTP) ↔ `repositories/` (truy xuất CSDL).
- **Cơ sở dữ liệu:** PostgreSQL 16 (Lược đồ 6 bảng chuẩn 3NF: `customer`, `device`, `service_center`, `issue_category`, `technician`, `ticket`). Lịch sử chuyển trạng thái lưu dưới dạng `status_history` (JSONB Document-in-Row).
- **Kiểm thử tự động:** Jest, 24 unit & integration test cases bao phủ trọn vẹn 3 loại: Luồng đúng (Happy path), Giá trị biên (Boundary), Dữ liệu sai (Invalid data).
- **Đóng gói & Triển khai:** Docker, `docker-compose.yml` (chạy toàn bộ backend + frontend + database bằng 1 lệnh).

---

## 3. Khắc phục mâu thuẫn dữ liệu từ Bài tập 1

Theo góp ý đánh giá Bài tập 1, hệ thống đã chuẩn hóa và giải quyết triệt để 2 mâu thuẫn dữ liệu (ghi chép chi tiết tại `docs/thay-doi-thiet-ke.md`):

1. **Thống nhất lưu lịch sử trạng thái:** Loại bỏ hoàn toàn bảng độc lập `ticket_status_log`, thống nhất sử dụng duy nhất cột `status_history` kiểu `JSONB` trong bảng `ticket`. Toàn bộ SRS (AC2.1, QT-06), Use Case UC2 (hậu điều kiện & bước 5), câu lập luận kiến trúc 2 và mã nguồn đã được sửa khớp 100%. View `v_ticket_status_log` được duy trì để phẳng hóa khi cần làm báo cáo.
2. **Chuẩn hóa bậc tay nghề KTV:** Thay vì lưu tay nghề theo từng nhóm sự cố ở bảng phụ (`technician_skill`), chuẩn hóa thành một điểm số đánh giá năng lực chuyên môn `proficiency` (thang 1–5, yêu cầu `proficiency >= 3`) lưu trực tiếp trong bảng `technician`. Toàn bộ tài liệu (SRS bảng thuật ngữ, AC2.2, QT-08) và mã nguồn kiểm tra đồng nhất theo cột này.

---

## 4. Hướng dẫn cài đặt và chạy hệ thống (Clone-and-Run)

### Cách 1: Chạy trực tiếp bằng Node.js & Docker Database (Khuyến nghị)

#### Bước 1: Chuẩn bị biến môi trường

```bash
cp .env.example .env
```

#### Bước 2: Cài đặt thư viện dependencies

```bash
npm install
npm --prefix frontend install
```

#### Bước 3: Khởi tạo CSDL & Nạp dữ liệu mẫu (Idempotent Seed)

```bash
npx prisma db push
node prisma/seed.js
```

_(Nếu chưa có PostgreSQL cục bộ, có thể khởi động nhanh qua lệnh: `docker compose up -d postgres`)_

#### Bước 4: Khởi động hệ thống

- **Chạy song song 2 dịch vụ độc lập:**
  - **Terminal 1 (Backend API):**

    ```bash
    npm start       # hoặc npm run dev (nodemon hot-reload)
    ```

    Backend API hoạt động tại: **http://localhost:3000**  
    Kiểm tra sức khỏe: **http://localhost:3000/health**

  - **Terminal 2 (Frontend React Web UI):**
    ```bash
    npm run client  # hoặc cd frontend && npm run dev
    ```
    Frontend Web UI hoạt động tại: **http://localhost:5173**

---

### Cách 2: Chạy toàn bộ hệ thống bằng Docker Compose (≤ 2 lệnh)

```bash
docker compose up -d --build
```

Hệ thống tự động dựng 3 dịch vụ container riêng biệt:

1. **Frontend Web UI (`web`):** Truy cập tại **http://localhost:5173**
2. **Backend REST API (`api`):** Hoạt động tại **http://localhost:3000** (Health check: `http://localhost:3000/health`)
3. **Database (`postgres`):** PostgreSQL 16 tại cổng `5432` (tự động nạp schema và seed dữ liệu mẫu)

---

## 5. Hướng dẫn chạy Bộ kiểm thử (Automated Tests)

Chạy toàn bộ 24 test cases bằng **MỘT lệnh duy nhất** (không phụ thuộc vào CSDL máy cá nhân):

```bash
npm test
```

### Kết quả kiểm chứng (PASS 100%):

- **Loại 1: Luồng đúng (Happy Path):**
  - `TC1.1`: Quản lý phân công KTV hợp lệ (cùng trung tâm, `proficiency = 4 >= 3`) thành công, chuyển `DA_PHAN_CONG`, append nhật ký `status_history`.
  - `TC3.5` (CRUD Delete Entity 1): Xóa thành công phiếu bảo hành ở trạng thái tiếp nhận mới `MOI`.
  - `TC-TECH-2` & `TC-TECH-3`: Thêm mới và vô hiệu hóa (Soft Delete) kỹ thuật viên (CRUD Entity 2).
- **Loại 2: Giá trị biên (Boundary Conditions):**
  - `TC2.1`: KTV có đúng `proficiency = 3` (ngưỡng đạt tối thiểu QT-08) được phân công thành công.
  - `TC2.2`: KTV có `proficiency = 2` (ngay dưới ngưỡng 3) bị từ chối với mã lỗi `KTV_KHONG_DU_TAY_NGHE` (HTTP 422).
  - `TC2.3`: Tự động tính hạn SLA theo các mốc ưu tiên: CAO (24h), TRUNG BÌNH (72h), THẤP (120h).
- **Loại 3: Dữ liệu sai & Ràng buộc nghiệp vụ (Invalid Data):**
  - `TC3.1`: Từ chối phân công KTV khác trung tâm với mã `KTV_KHONG_CUNG_TRUNG_TAM` (QT-08).
  - `TC3.2`: Ngăn chặn chuyển trạng thái ngược từ `HOAN_TAT` về `MOI` theo quy tắc vòng đời không đảo ngược (QT-06).
  - `TC3.3`: Phát hiện và từ chối trùng lịch hẹn của KTV với mã `LICH_HEN_XUNG_DOT` (FR4).
  - `TC3.4`: Thao tác trên mã phiếu không tồn tại trả về `PHIEU_KHONG_TON_TAI` (HTTP 404).
  - `TC3.6`: Từ chối xóa phiếu đang sửa chữa hoặc đã hoàn tất với mã `KHONG_THE_XOA_PHIEU` (HTTP 422).
  - `TC-VAL`: Kiểm tra tính hợp lệ dữ liệu đầu vào, thiếu trường bắt buộc trả về HTTP 400 kèm danh sách trường sai.

---

## 6. Minh chứng 3 màn hình nghiệp vụ & Xử lý 3 trạng thái (Buổi 10)

Ứng dụng web React cung cấp đủ 3 màn hình chính theo wireframe và nghiệp vụ Luồng L4:

1. **Màn hình 1 (M1) — Danh sách phiếu chờ phân công (`TicketListPage`):**
   - Lọc theo mức ưu tiên, tìm kiếm theo serial/mã phiếu.
   - Hiển thị nhãn cảnh báo đỏ với các phiếu SLA còn dưới 4 giờ (US3).
   - Nút mở modal phân công kỹ thuật viên.
2. **Màn hình 2 (M2) — Phân công kỹ thuật viên (`AssignTechnicianModal`):**
   - Tự động gọi API lấy danh sách KTV đủ tiêu chuẩn (`proficiency >= 3`, cùng TT2).
   - Hiển thị bậc tay nghề kèm thanh đo trực quan khối lượng công việc (workload) để Quản lý cân bằng tải (V3).
   - Hỗ trợ đặt lịch hẹn giao nhận máy có phát hiện xung đột lịch (FR4).
3. **Màn hình 3 (M3) — Phiếu của tôi & Chi tiết phiếu (`TechnicianTicketsPage`):**
   - Kỹ thuật viên xem danh sách phiếu được gán, sắp xếp theo hạn SLA tăng dần.
   - Số điện thoại khách hàng hiển thị dạng che `090****567` theo QT-15 & NFR2.
   - Thao tác cập nhật trạng thái tuần tự (`DA_PHAN_CONG` → `DANG_XU_LY` → `CHO_LINH_KIEN` → `HOAN_TAT`).
   - Mở rộng xem Timeline chi tiết của mảng JSONB `status_history`.

### Xử lý 3 trạng thái tại tất cả màn hình:

- **Đang tải (Loading):** Hiệu ứng Skeleton loader / spinner mượt mà.
- **Rỗng (Empty State):** Phân biệt rõ ràng giữa "Chưa có dữ liệu nào" và "Bộ lọc không ra kết quả" (kèm nút "Xóa bộ lọc").
- **Lỗi kết nối (Error State):** Khi backend tắt hoặc mất kết nối, hiển thị hộp thoại cảnh báo kèm nút **"Thử lại"** để nạp lại dữ liệu mà không cần F5 toàn trang.

---

## 7. Tài khoản chạy thử nghiệm (Demo Accounts)

Hệ thống có sẵn nút **"Đổi vai trò"** trên thanh tiêu đề (Navbar) hoặc đăng nhập với các tài khoản:

- **Quản lý trung tâm Tân Bình (TT2):** `username: manager_tt2` / `password: password123` (xem toàn bộ phiếu, xem SĐT khách đầy đủ, phân công KTV).
- **Kỹ thuật viên chuyên sâu (TT2):** `username: ktv_nguyenvana` / `password: password123` (xem phiếu của mình, SĐT che dạng `090****567`, cập nhật tiến độ).

---

## 8. Cấu trúc thư mục

```
github_se_nop/
├── docs/                             # Toàn bộ tài liệu đặc tả & thiết kế
│   ├── srs.md                        # SRS 6 mục chuẩn ISO/IEC/IEEE 29148 (đã đồng bộ JSONB & proficiency)
│   ├── usecase_spec.md               # Đặc tả chi tiết Use Case UC2, UC6, UC7
│   ├── architecture.md               # Kiến trúc 3 tầng, 4 câu lập luận NFR
│   ├── erd.dbml                      # Mô hình quan hệ 6 bảng chuẩn 3NF
│   ├── thay-doi-thiet-ke.md          # Nhật ký thay đổi thiết kế theo chuẩn 3 dòng (Bắt buộc BT2)
│   ├── ai-disclosure.md              # Bảng khai báo AI 4 cột cập nhật cho BT2
│   └── api-contract.md               # Hợp đồng API REST/JSON
├── prisma/
│   ├── schema.prisma                 # Lược đồ Prisma 6 bảng quan hệ + JSONB status_history
│   └── seed.js                       # Tệp nạp dữ liệu mẫu idempotent (6 TT, KTV, Khách, Thiết bị, Phiếu)
├── src/                              # Backend Node.js / Express (Tách 3 tầng sạch)
│   ├── errors/AppError.js            # Lớp lỗi miền nghiệp vụ có mã
│   ├── validators/                   # Tầng 1: Kiểm tra định dạng dữ liệu đầu vào
│   ├── routes/                       # Tầng 1: Nhận HTTP & chuyển đổi mã lỗi
│   ├── services/                     # Tầng 2: Toàn bộ quy tắc nghiệp vụ (QT-08, QT-06, QT-04, QT-11)
│   ├── repositories/                 # Tầng 3: Truy xuất CSDL qua Prisma Client
│   ├── middlewares/                  # Auth JWT, phoneMasker (QT-15), errorHandler tập trung
│   ├── app.js                        # Ghép nối các tầng và phục vụ frontend build
│   └── server.js                     # Khởi động dịch vụ trên cổng 3000
├── tests/                            # Bộ kiểm thử tự động Jest (24 test cases)
│   ├── ticket.service.test.js        # Test nghiệp vụ phân công, giá trị biên, dữ liệu sai
│   ├── technician.service.test.js    # Test quản lý KTV và cân bằng tải
│   ├── ticket.validator.test.js      # Test kiểm tra dữ liệu đầu vào
│   └── api.routes.test.js            # Test tầng HTTP routes và middleware
├── frontend/                         # Giao diện Frontend React + Vite + Tailwind CSS
│   ├── src/api/                      # Lớp API client tập trung (không gọi fetch trong component)
│   ├── src/components/DataState.jsx  # Xử lý 3 trạng thái: Đang tải, Rỗng, Lỗi có nút thử lại
│   ├── src/pages/TicketListPage.jsx  # Màn hình 1: Phiếu chờ phân công (M1)
│   ├── src/pages/AssignTechnicianModal.jsx # Màn hình 2: Phân công KTV & Đặt lịch hẹn (M2)
│   ├── src/pages/TechnicianTicketsPage.jsx # Màn hình 3: Phiếu của KTV & Timeline status_history (M3)
│   └── src/App.jsx                   # Điều phối giao diện, xác thực vai trò
├── Dockerfile                        # Đóng gói container hoàn chỉnh
├── docker-compose.yml                # Khởi động toàn hệ thống bằng 1 lệnh
├── .env.example                      # Liệt kê đầy đủ mọi biến môi trường
└── README.md
```

---

## 9. Checklist tiến độ (Đạt tiêu chuẩn Buổi 10)

- [x] Khắc phục toàn bộ mâu thuẫn dữ liệu giữa SRS, UC, ERD và ghi nhận vào `docs/thay-doi-thiet-ke.md` (Buổi 8).
- [x] Cập nhật bảng khai báo sử dụng công cụ AI đủ 4 cột (`docs/ai-disclosure.md`).
- [x] Thiết lập Prisma ORM với 6 bảng chuẩn 3NF, hỗ trợ JSONB `status_history` và `technician.proficiency`.
- [x] Xây dựng script nạp dữ liệu mẫu chạy lại không bị lỗi (`prisma/seed.js`).
- [x] Tách đủ 3 lớp `routes/`, `services/`, `repositories/`, file service không chứa dấu vết HTTP.
- [x] Đủ 4 thao tác CRUD trên ít nhất 2 thực thể (`Ticket` và `Technician`).
- [x] Hiện thực các quy tắc nghiệp vụ cốt lõi: QT-08 (proficiency ≥ 3, cùng trung tâm), QT-06 (vòng đời không đảo ngược, ghi log JSONB), QT-04 (SLA tự động), QT-11 (quá tải KTV), FR4 (xung đột lịch hẹn).
- [x] 24 kịch bản kiểm thử PASS 100% bằng lệnh `npm test` với 3 loại: luồng đúng, giá trị biên, dữ liệu sai.
- [x] Frontend React với 3 màn hình chính kết nối API thật (M1, M2, M3).
- [x] Xử lý đủ 3 trạng thái (đang tải, rỗng phân biệt, lỗi kết nối có nút thử lại).
- [x] Che số điện thoại khách hàng `090****567` cho vai trò KTV (QT-15, NFR2).
- [x] Đóng gói Dockerfile và `docker-compose.yml`.
