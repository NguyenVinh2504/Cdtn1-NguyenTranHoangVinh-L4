# MEKONG MOBILE SMART CRM — PHÂN HỆ LUỒNG L4

> **Quản lý trung tâm bảo hành phân công kỹ thuật viên cho phiếu bảo hành theo tay nghề và khối lượng công việc hiện tại, đặt lịch hẹn giao – nhận máy với khách, theo dõi trạng thái phiếu đến khi hoàn tất.**

- **Sinh viên thực hiện:** Nguyễn Trần Hoàng Vinh
- **MSSV:** 2374802010562
- **Track chuyên ngành:** Kỹ thuật phần mềm (SE)
- **Học phần:** Chuyên đề tốt nghiệp 1 (HK261, 2026–2027) — Khoa CNTT, Đại học Văn Lang
- **Tiến độ hiện tại:** Hoàn tất Giai đoạn 3 — **Bài tập 3** (Kiểm thử theo đặc tả, sửa lỗi, đóng gói Docker và tài liệu kỹ thuật; Release `v1.0`)
- **Phiên bản release:** `v1.0` (Tag: `v1.0`)

---

## 0. Chạy hệ thống trong 2 lệnh

Yêu cầu duy nhất: **Docker Desktop đang chạy**. Không cần cài Node.js, npm hay PostgreSQL.

```bash
cp .env.example .env
docker compose up -d --build
```

Sau khoảng 30–60 giây, mở **http://localhost:5173** và đăng nhập bằng tài khoản demo
`manager_tt2` / `password123`. Kiểm tra API tại **http://localhost:3000/health**.

> Trên Windows Command Prompt, nếu `cp` không nhận, dùng `copy .env.example .env`.
> Hướng dẫn đầy đủ (yêu cầu, biến môi trường, dữ liệu mẫu, kiểm chứng, xử lý sự cố):
> [`docs/deployment-guide.md`](docs/deployment-guide.md).

### Tài liệu Bài tập 3

| Tài liệu | Nội dung |
| :--- | :--- |
| [`docs/deployment-guide.md`](docs/deployment-guide.md) | Hướng dẫn triển khai 5 mục + Troubleshooting + Monitoring & Alerts |
| [`docs/checklist-bao-mat.md`](docs/checklist-bao-mat.md) | Checklist bảo mật 7 mục, mỗi mục có lệnh minh chứng chạy thật |
| [`docs/api-docs/README.md`](docs/api-docs/README.md) | Chỉ mục API Reference (17 endpoint nghiệp vụ) + OpenAPI 3.0 |
| [`docs/test-plan.md`](docs/test-plan.md) | Kế hoạch kiểm thử theo đặc tả |
| [`docs/test-report.md`](docs/test-report.md) | Báo cáo kết quả 52 test case |
| [`docs/bug-log.md`](docs/bug-log.md) | Bug Log 12 lỗi, gồm 3 lỗi phát hiện bằng phép thử máy trắng |
| [`docs/thay-doi-thiet-ke.md`](docs/thay-doi-thiet-ke.md) | Nhật ký thay đổi thiết kế qua 3 giai đoạn |
| [`docs/ai-disclosure.md`](docs/ai-disclosure.md) | Phụ lục khai báo sử dụng công cụ AI |

---

## 1. Tóm tắt hệ thống

Hệ thống Smart CRM - Luồng L4 giải quyết trọn vẹn bài toán điều phối sửa chữa thiết bị tại các trung tâm bảo hành thuộc chuỗi Mekong Mobile. Phân hệ cung cấp giao diện trực quan cho Quản lý trung tâm lọc phiếu chờ xử lý, tự động gợi ý danh sách kỹ thuật viên đủ điều kiện năng lực chuyên môn (`proficiency >= 3`) và cùng trung tâm tiếp nhận (QT-08), hiển thị khối lượng công việc hiện tại để cân bằng tải, đồng thời đặt lịch hẹn giao – nhận máy có kiểm tra xung đột trùng giờ (FR4). Kỹ thuật viên có giao diện riêng để theo dõi phiếu theo hạn cam kết SLA tăng dần (`due_date` theo QT-04), cập nhật trạng thái sửa chữa theo vòng đời một chiều không đảo ngược (`status_history` JSONB theo QT-06) và đảm bảo che số điện thoại khách hàng dạng `090****567` (QT-15).

---

## 2. Công nghệ sử dụng

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons. Kiến trúc gọi API tách lớp riêng (`src/api/client.js`, `tickets.api.js`, `technicians.api.js`), xử lý tập trung 3 trạng thái (Đang tải, Rỗng có nút xóa lọc, Lỗi có nút thử lại).
- **Backend:** Node.js 20 LTS, Express, Prisma ORM 5. Kiến trúc tách rời nghiêm ngặt 3 tầng: `routes/` (HTTP & mapping mã lỗi) ↔ `services/` (chứa toàn bộ quy tắc nghiệp vụ, không phụ thuộc HTTP) ↔ `repositories/` (truy xuất CSDL).
- **Cơ sở dữ liệu:** PostgreSQL 16 (Lược đồ 6 bảng chuẩn 3NF: `customer`, `device`, `service_center`, `issue_category`, `technician`, `ticket`). Lịch sử chuyển trạng thái lưu dưới dạng `status_history` (JSONB Document-in-Row).
- **Kiểm thử tự động:** Jest, **52 unit & integration test cases** (7 test suite) bao phủ trọn vẹn 3 loại: Luồng đúng (Happy path), Giá trị biên (Boundary), Dữ liệu sai (Invalid data) — trong đó có **12 mã TC cốt lõi** của BT3 (`TC-01`…`TC-12`) và **3 test hồi quy** cho các lỗi phát hiện bằng phép thử máy trắng (`TC-13`…`TC-15`).
- **Đóng gói & Triển khai:** Docker, `docker-compose.yml` (chạy toàn bộ backend + frontend + database bằng 1 lệnh).

---

## 3. Khắc phục mâu thuẫn dữ liệu từ Bài tập 1

Theo góp ý đánh giá Bài tập 1, hệ thống đã chuẩn hóa và giải quyết triệt để 2 mâu thuẫn dữ liệu (ghi chép chi tiết tại `docs/thay-doi-thiet-ke.md`):

1. **Thống nhất lưu lịch sử trạng thái:** Loại bỏ hoàn toàn bảng độc lập `ticket_status_log`, thống nhất sử dụng duy nhất cột `status_history` kiểu `JSONB` trong bảng `ticket`. Toàn bộ SRS (AC2.1, QT-06), Use Case UC2 (hậu điều kiện & bước 5), câu lập luận kiến trúc 2 và mã nguồn đã được sửa khớp 100%, đọc trực tiếp từ cột JSONB qua repository (không tạo VIEW rời trong migration).
2. **Chuẩn hóa bậc tay nghề KTV:** Thay vì lưu tay nghề theo từng nhóm sự cố ở bảng phụ (`technician_skill`), chuẩn hóa thành một điểm số đánh giá năng lực chuyên môn `proficiency` (thang 1–5, yêu cầu `proficiency >= 3`) lưu trực tiếp trong bảng `technician`. Toàn bộ tài liệu (SRS bảng thuật ngữ, AC2.2, QT-08) và mã nguồn kiểm tra đồng nhất theo cột này.

---

## 4. Hướng dẫn cài đặt và chạy hệ thống (Clone-and-Run)

### 4.1. Yêu cầu môi trường & Phần mềm cần cài đặt trước (Prerequisites)

Để đảm bảo hệ thống khởi chạy suôn sẻ và người chấm có thể tái lập nhanh chóng, máy tính cần được cài đặt sẵn các công cụ môi trường dưới đây:

| STT | Phần mềm / Công cụ | Phiên bản khuyến nghị | Mục đích sử dụng | Lệnh kiểm tra phiên bản | Liên kết tải về chính thức |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Node.js** | `>= 18.x` (Khuyến nghị **Node.js 20 LTS**) | Chạy ứng dụng Backend Express, Prisma CLI, và thực thi bộ kiểm thử Jest | `node -v` | [nodejs.org](https://nodejs.org/) (Chọn bản LTS) |
| **2** | **npm** | `>= 9.x` (Tự động đi kèm Node.js) | Cài đặt và quản lý các thư viện dependencies (Backend & Frontend) | `npm -v` | Đi kèm cùng Node.js |
| **3** | **Docker & Docker Compose** (hoặc **Docker Desktop**) | Docker Engine `>= 20.10`<br>Docker Compose `>= 2.0` | Khởi chạy container PostgreSQL (Cách 1) hoặc đóng gói chạy toàn bộ hệ thống trọn gói (Cách 2) | `docker -v`<br>`docker compose version` | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **4** | **Git** *(Tùy chọn)* | `>= 2.30` | Sao chép (clone) mã nguồn dự án từ kho lưu trữ GitHub | `git --version` | [git-scm.com](https://git-scm.com/) |

> [!IMPORTANT]
> **Lưu ý đặc biệt quan trọng về môi trường:**
> 1. **Đối với Docker / Docker Desktop:** Nếu chạy trên hệ điều hành **Windows** hoặc **macOS**, hãy đảm bảo **Docker Desktop đang được mở và ở trạng thái chạy** (biểu tượng cá voi ở khay hệ thống hiển thị màu xanh lá / *Docker Desktop is running*) trước khi thực thi các câu lệnh `docker` hoặc `docker compose`.
> 2. **Lựa chọn cách chạy phù hợp với nhu cầu:**
>    - **Cách 1 (Khuyên dùng cho Giảng viên chấm bài / Lập trình viên):** Chạy trực tiếp qua **Node.js** trên máy và dùng **Docker** để chạy nền cơ sở dữ liệu PostgreSQL. Cách này tối ưu nhất để vừa chạy ứng dụng, vừa kiểm tra mã nguồn, vừa chạy bộ test tự động `npm test` trực tiếp trên terminal.
>    - **Cách 2 (Khuyên dùng khi máy chưa cài Node.js):** Chạy toàn bộ hệ thống (Web + API + DB) chỉ với **1 lệnh Docker Compose duy nhất**. Docker sẽ tự tải mọi môi trường runtime độc lập mà không cần bất kỳ can thiệp nào vào hệ điều hành máy thật.

---

### 4.2. Tải mã nguồn dự án (Clone Repository)

Mở terminal (PowerShell, Command Prompt hoặc Terminal) và thực hiện clone dự án:

```bash
git clone --branch v1.0 https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4.git
cd Cdtn1-NguyenTranHoangVinh-L4
```
*(Nếu nhận mã nguồn qua tệp nén `.zip`, giải nén và mở cửa sổ dòng lệnh tại thư mục gốc `Cdtn1-NguyenTranHoangVinh-L4`)*

---

### 4.3. Cách 1: Chạy trực tiếp bằng Node.js & Docker Database (Khuyến nghị)

#### Bước 1: Chuẩn bị biến môi trường

Sao chép tệp cấu hình mẫu `.env.example` thành `.env`:

```bash
cp .env.example .env
```
*(Trên Windows Command Prompt nếu lệnh `cp` không nhận, có thể dùng: `copy .env.example .env`)*

#### Bước 2: Cài đặt thư viện dependencies

Cài đặt đồng thời các gói phụ thuộc cho cả Backend và Frontend:

```bash
npm install
npm --prefix frontend install
```

#### Bước 3: Khởi tạo CSDL & Nạp dữ liệu mẫu (Idempotent Seed)

- **3.1. Khởi động PostgreSQL qua Docker** (yêu cầu Docker Desktop đang chạy):
  ```bash
  docker compose up -d postgres
  ```
  *(Nếu máy bạn đã có sẵn PostgreSQL cục bộ trên cổng 5432, hãy đảm bảo thông tin kết nối trong file `.env` khớp với máy)*

- **3.2. Chạy migration tạo bảng từ CSDL trống và nạp dữ liệu mẫu:**
  ```bash
  npx prisma migrate deploy
  node prisma/seed.js
  ```
  *(Hoặc sử dụng câu lệnh gộp nhanh có sẵn trong package.json: `npm run db:setup`)*

#### Bước 4: Khởi động hệ thống (2 Terminal độc lập)

Mở 2 cửa sổ terminal riêng biệt để khởi động cả 2 dịch vụ:

- **Terminal 1 — Khởi động Backend REST API:**
  ```bash
  npm start       # hoặc npm run dev (nodemon hot-reload tự động nạp lại khi sửa mã nguồn)
  ```
  - Backend API hoạt động tại: **http://localhost:3000**
  - Kiểm tra sức khỏe hệ thống: **http://localhost:3000/health**

- **Terminal 2 — Khởi động Frontend React Web UI:**
  ```bash
  npm run client  # hoặc cd frontend && npm run dev
  ```
  - Giao diện Web UI hoạt động tại: **http://localhost:5173**

---

### 4.4. Cách 2: Chạy toàn bộ hệ thống bằng Docker Compose (≤ 2 lệnh trọn gói)

Nếu máy đã cài đặt và đang bật **Docker Desktop**, bạn có thể khởi chạy toàn bộ 3 dịch vụ (Web + API + DB) mà không cần cài đặt Node.js:

```bash
cp .env.example .env
docker compose up -d --build
```
*(Lưu ý: Nếu hệ thống sử dụng Docker Compose v1 cũ hơn, hãy dùng lệnh: `docker-compose up -d --build`)*
Chi tiết đầy đủ về yêu cầu, biến môi trường và cách kiểm chứng: [`docs/deployment-guide.md`](docs/deployment-guide.md).

Sau khi hoàn tất, hệ thống tự động dựng và khởi chạy 3 container độc lập:
1. **Frontend Web UI (`web`):** Truy cập tại **http://localhost:5173**
2. **Backend REST API (`api`):** Hoạt động tại **http://localhost:3000** (Health check: `http://localhost:3000/health`)
3. **Database (`postgres`):** PostgreSQL 16 tại cổng `5432` (tự động nạp schema và seed dữ liệu mẫu)

- **Khi muốn dừng toàn bộ hệ thống:**
  ```bash
  docker compose down
  ```

---

## 5. Hướng dẫn chạy Bộ kiểm thử (Automated Tests)

*(Yêu cầu: Đã cài Node.js theo mục 4.1 — hoặc chạy trực tiếp trong container: `docker compose exec api npm test`. Toàn bộ 52 kịch bản kiểm thử chạy độc lập, không phụ thuộc CSDL nhờ kiến trúc Mock Repository)*:

Chạy toàn bộ 52 test cases bằng **MỘT lệnh duy nhất** (không phụ thuộc vào CSDL máy cá nhân):

```bash
npm test
```

### Kết quả kiểm chứng (PASS 100%):

- **Loại 1: Luồng đúng (Happy Path):**
  - `TC1.1`: Quản lý phân công KTV hợp lệ (cùng trung tâm, `proficiency = 4 >= 3`) thành công, chuyển `DA_PHAN_CONG`, append nhật ký `status_history`.
  - `TC1.2` (CRUD Update Entity 1): Cập nhật thông tin phiếu bảo hành hợp lệ và tự động tính lại hạn SLA (QT-04).
  - `TC1.3` (CRUD Read Entity 1): Tra cứu danh sách phiếu bảo hành qua `listTickets`.
  - `TC3.5` (CRUD Delete Entity 1): Xóa thành công phiếu bảo hành ở trạng thái tiếp nhận mới `MOI`.
  - `TC-TECH-2` & `TC-TECH-3`: Thêm mới và vô hiệu hóa (Soft Delete) kỹ thuật viên (CRUD Entity 2).
  - `RT-1` tới `RT-7`: Kiểm thử toàn diện tầng HTTP Routes và ánh xạ mã lỗi sang HTTP status codes (200, 201, 400, 422).
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

### 5.1. Kịch bản cURL kiểm thử nhanh các Endpoint CRUD & Quy tắc nghiệp vụ (Dành cho Giảng viên chấm)

Sau khi hệ thống đã khởi động (Docker Compose hoặc `npm start`), lấy JWT token trước rồi gọi các lệnh `curl` dưới đây để kiểm chứng:

```bash
# 0. Đăng nhập lấy JWT token (Quản lý trung tâm 2)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager_tt2","password":"password123"}' | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.data.token)")
```

#### A. Thực thể 1: Ticket (Phiếu bảo hành) — Đủ 4 thao tác CRUD:
```bash
# 1. Tạo (Create - POST)
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId":1,"deviceId":1,"centerId":2,"categoryId":1,"issueDesc":"Màn hình cảm ứng bị loạn điểm và chớp nháy liên tục","priority":"CAO"}'

# 2. Đọc (Read - GET)
curl "http://localhost:3000/api/tickets?centerId=2" -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/api/tickets/1 -H "Authorization: Bearer $TOKEN"

# 3. Sửa (Update - PUT & Nghiệp vụ phân công)
curl -X PUT http://localhost:3000/api/tickets/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"issueDesc":"Màn hình xuất hiện thêm sọc đen góc trái","priority":"TRUNG_BINH"}'

# 4. Xóa (Delete - DELETE: Chỉ cho phép xóa phiếu MOI)
curl -X DELETE http://localhost:3000/api/tickets/2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Khách hàng hủy sửa chữa mang máy về"}'
```

#### B. Thực thể 2: Technician (Kỹ thuật viên) — Đủ 4 thao tác CRUD:
```bash
# 1. Tạo (Create - POST)
curl -X POST http://localhost:3000/api/technicians \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"NV-KTV-099","fullName":"Trần Văn Thử Nghiệm","centerId":2,"level":"TRUNG_CAP","proficiency":4}'

# 2. Đọc (Read - GET)
curl "http://localhost:3000/api/technicians?centerId=2" -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/api/technicians/3 -H "Authorization: Bearer $TOKEN"

# 3. Sửa (Update - PUT)
curl -X PUT http://localhost:3000/api/technicians/3 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"level":"CAO_CAP","proficiency":5}'

# 4. Xóa (Delete - DELETE: Soft delete chuyển isActive = false theo QT-13)
curl -X DELETE http://localhost:3000/api/technicians/6 -H "Authorization: Bearer $TOKEN"
```

#### C. Kiểm chứng 2 Quy tắc nghiệp vụ thật:
```bash
# Quy tắc 1 (QT-08): Phân công KTV có proficiency = 2 (< 3) -> Từ chối HTTP 422 KTV_KHONG_DU_TAY_NGHE
curl -X POST http://localhost:3000/api/tickets/1/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"technicianId":6,"note":"Thử phân công KTV sơ cấp"}'

# Quy tắc 2 (QT-06): Chuyển trạng thái ngược từ HOAN_TAT về MOI -> Từ chối HTTP 409 TRANG_THAI_KHONG_HOP_LE
curl -X PATCH http://localhost:3000/api/tickets/4/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"MOI"}'
```

#### D. Kiểm chứng "Tệp Service hoàn toàn không có dấu vết HTTP":
Mở tệp `src/services/ticket.service.js` và `src/services/technician.service.js` để xác nhận:
- Không chứa `req`, `res`, không chứa `res.status(...)`.
- Không chứa bất kỳ mã trạng thái HTTP nào (`200`, `400`, `404`, `422`, ...).
- Mọi lỗi đều ném `AppError(code, message)` với mã nghiệp vụ thuần túy. Toàn bộ phần "biết về HTTP" nằm tại `src/routes/` và `src/middlewares/errorHandler.middleware.js`.

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
Cdtn1-NguyenTranHoangVinh-L4/
├── docs/                             # Toàn bộ tài liệu đặc tả & thiết kế
│   ├── srs.md                        # SRS 6 mục chuẩn ISO/IEC/IEEE 29148 (đã đồng bộ JSONB & proficiency)
│   ├── usecase_spec.md               # Đặc tả chi tiết Use Case UC2, UC6, UC7
│   ├── architecture.md               # Kiến trúc 3 tầng, 4 câu lập luận NFR
│   ├── erd.dbml                      # Mô hình quan hệ 6 bảng chuẩn 3NF
│   ├── thay-doi-thiet-ke.md          # Nhật ký thay đổi thiết kế theo chuẩn 3 dòng (BT2 & BT3)
│   ├── ai-disclosure.md              # Bảng khai báo AI 4 cột cập nhật cho BT2 & BT3
│   ├── test-plan.md                  # Kế hoạch kiểm thử rút gọn (4 mục)
│   ├── test-report.md                # Báo cáo 12 test case đủ 8 cột + Phụ lục E
│   ├── bug-log.md                    # Bug Log đã sửa kèm link commit
│   ├── deployment-guide.md           # Hướng dẫn triển khai bằng tiếng Anh (5 mục)
│   ├── checklist-bao-mat.md          # Checklist bảo mật 7 mục kèm minh chứng
│   ├── api-docs/                     # API Reference 17 endpoint + OpenAPI 3.0.3
│   └── api-contract.md               # Hợp đồng API REST/JSON
├── prisma/
│   ├── migrations/                   # DDL versioned: tạo 6 bảng từ CSDL trống (S3)
│   ├── schema.prisma                 # Lược đồ Prisma 6 bảng quan hệ + JSONB status_history
│   ├── sync-sequences.js             # Đồng bộ sequence PostgreSQL sau seed (BUG-10)
│   └── seed.js                       # Tệp nạp dữ liệu mẫu idempotent (6 TT, KTV, Khách, Thiết bị, Phiếu)
├── src/                              # Backend Node.js / Express (Tách 3 tầng sạch)
│   ├── errors/AppError.js            # Lớp lỗi miền nghiệp vụ có mã
│   ├── validators/                   # Tầng 1: Kiểm tra định dạng dữ liệu đầu vào
│   ├── routes/                       # Tầng 1: Nhận HTTP & chuyển đổi mã lỗi
│   ├── services/                     # Tầng 2: Toàn bộ quy tắc nghiệp vụ (QT-08, QT-06, QT-04, QT-11)
│   ├── repositories/                 # Tầng 3: Truy xuất CSDL qua Prisma Client
│   ├── middlewares/                  # Auth JWT, phoneMasker (QT-15), errorHandler tập trung
│   ├── utils/sla.js                  # Tính hạn SLA theo giờ làm việc (bỏ qua Chủ Nhật)
│   ├── app.js                        # Ghép nối các tầng và cấu hình middleware
│   └── server.js                     # Khởi động dịch vụ trên cổng 3000
├── tests/                            # Bộ kiểm thử tự động Jest (52 test cases, 7 suite)
│   ├── bt3-unit.test.js              # 10 mã TC unit + TC phụ của Test Report BT3
│   ├── bt3-new.test.js               # TC-11 (A01 đọc/ghi) & TC-P1 (JWT bắt buộc)
│   ├── bt3-bugfix.test.js            # TC-13..TC-15 hồi quy lỗi phép thử máy trắng
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

## 9. Checklist tiến độ (Nghiệm thu Bài tập 3 — Release v1.0)

- [x] Khắc phục toàn bộ mâu thuẫn dữ liệu giữa SRS, UC, ERD và ghi nhận vào `docs/thay-doi-thiet-ke.md` (Buổi 8).
- [x] Cập nhật bảng khai báo sử dụng công cụ AI đủ 4 cột (`docs/ai-disclosure.md`).
- [x] Thiết lập Prisma ORM với 6 bảng chuẩn 3NF, hỗ trợ JSONB `status_history` và `technician.proficiency`.
- [x] Xây dựng script nạp dữ liệu mẫu chạy lại không bị lỗi (`prisma/seed.js`).
- [x] Tách đủ 3 lớp `routes/`, `services/`, `repositories/`, file service không chứa dấu vết HTTP.
- [x] Đủ 4 thao tác CRUD trên ít nhất 2 thực thể (`Ticket` và `Technician`).
- [x] Hiện thực các quy tắc nghiệp vụ cốt lõi: QT-08 (proficiency ≥ 3, cùng trung tâm), QT-06 (vòng đời không đảo ngược, ghi log JSONB), QT-04 (SLA tự động), QT-11 (quá tải KTV), FR4 (xung đột lịch hẹn).
- [x] **52 kịch bản kiểm thử PASS 100%** bằng lệnh `npm test` (7 test suite), gồm 12 mã TC cốt lõi BT3 + 3 test hồi quy cho lỗi phát hiện bằng phép thử máy trắng.
- [x] Kế hoạch kiểm thử, báo cáo kiểm thử và Bug Log đầy đủ (`docs/test-plan.md`, `docs/test-report.md`, `docs/bug-log.md`).
- [x] Phép thử máy trắng trên Docker Compose: `down -v` → `up -d --build` → 3 dịch vụ healthy → seed lần 2 không nhân đôi dữ liệu (6/6/8/4/4/4).
- [x] Đóng gói tái lập được: `.dockerignore`, `npm ci`, chạy bằng `USER node`, healthcheck cho cả `api` và `web`, `.env.example` đủ 17 biến.
- [x] Deployment Guide (5 mục bắt buộc + Troubleshooting + Monitoring) và Checklist bảo mật 7 mục có minh chứng chạy thật.
- [x] API Reference 17 endpoint (7 mục/endpoint, ví dụ `curl` thật) + OpenAPI 3.0 + trang chỉ mục.
- [x] Đồng bộ `api-contract.md` và `srs.md` với 17 endpoint thật; ghi nhận vào `docs/thay-doi-thiet-ke.md`.
- [x] Phụ lục khai báo AI cập nhật cho giai đoạn 3 với 4 cột bắt buộc.
- [x] Frontend React với 3 màn hình chính kết nối API thật (M1, M2, M3).
- [x] Xử lý đủ 3 trạng thái (đang tải, rỗng phân biệt, lỗi kết nối có nút thử lại).
- [x] Che số điện thoại khách hàng `090****567` cho vai trò KTV (QT-15, NFR2).
- [x] Đóng gói Dockerfile và `docker-compose.yml`.
