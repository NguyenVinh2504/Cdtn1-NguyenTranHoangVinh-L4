# TEST PLAN RÚT GỌN (COMPACT TEST PLAN)

> **Học phần:** Chuyên đề tốt nghiệp 1 (HK261) — Khoa CNTT, Đại học Văn Lang
> **Bài tập:** Bài tập 3 — Kiểm thử và Đóng gói prototype
> **Hệ thống:** Smart CRM Mekong Mobile — Phân hệ **Luồng L4**: Phân công kỹ thuật viên & Lịch hẹn
> **Track chuyên ngành:** Kỹ thuật phần mềm (SE)
> **Sinh viên:** Nguyễn Trần Hoàng Vinh — **MSSV:** 2374802010562
> **Tài liệu đích:** `docs/test-plan.md` (Thành phần nộp 1 — Bài tập 3, mục 2.1)
> **Quy tắc nghiệp vụ trọng tâm được truy vết:** QT-04 · QT-06 · QT-08 · FR4 · QT-15

---

## MỤC 1. PHẠM VI KIỂM THỬ VÀ PHẦN CHỦ Ý **KHÔNG** KIỂM

### 1.1. Phạm vi ĐƯỢC kiểm thử

Kế hoạch tập trung vào **tầng nghiệp vụ (Service)**, **tầng HTTP (Routes + Middleware)** và **tích hợp với CSDL thật** của 5 quy tắc nghiệp vụ đã hiện thực trong `src/services/ticket.service.js`:

| Mã | Quy tắc nghiệp vụ | Nội dung kiểm thử | Điểm hiện thực |
|:---:|:---|:---|:---|
| **QT-04** | Hạn cam kết SLA tự động | `CAO` = 24h, `TRUNG_BINH` = 72h, `THAP` = 120h tính từ `received_at`; tự tính lại khi đổi mức ưu tiên | `calculateDueDate()`, `updateTicket()` |
| **QT-06** | Vòng đời trạng thái không đảo ngược | `MOI → DA_PHAN_CONG → DANG_XU_LY → CHO_LINH_KIEN → HOAN_TAT → DA_DONG (| DA_HUY)`; mỗi lần chuyển phải append 1 phần tử `{from,to,at,by,note}` vào mảng JSONB `status_history` | `VALID_TRANSITIONS`, `transitionStatus()` |
| **QT-08** | Ràng buộc năng lực & địa bàn | KTV phải `proficiency >= 3` **và** cùng `center_id` với phiếu; nếu không thì từ chối | `_assignTechnician()` bước 4–5 |
| **FR4** | Quản lý lịch hẹn & kiểm tra trùng lịch | Ngăn chặn đặt lịch hẹn trùng khung giờ của cùng KTV (cửa sổ ±30 phút) | `scheduleAppointment()`, `AppointmentRepository.hasConflict()` |
| **QT-15** | Bảo mật thông tin khách hàng | Số điện thoại trả về cho vai trò Kỹ thuật viên phải ở dạng che `090****567`; chỉ Quản lý trung tâm mới thấy dạng đầy đủ | `phoneMasker.middleware.js`, route `GET /technician/mine` |

Ngoài 5 quy tắc trên, bộ kiểm thử còn bao phủ **3 quy tắc liên quan trực tiếp** (được kiểm **gián tiếp** trong các test case luồng đúng, không tính vào tiêu chí "mỗi quy tắc có ít nhất một test"):

- **QT-07** — Nguyên tắc phân công đơn nhất: mỗi lần điều chuyển KTV ghi kèm `note` lý do vào `status_history`.
- **QT-11** — Chống quá tải KTV: từ chối phân công khi KTV đang giữ ≥ 8 phiếu mở (`MAX_OPEN_TICKETS_PER_TECH`).
- **QT-13** — Xóa mềm: vô hiệu hóa KTV bằng `is_active = false` thay vì xóa vật lý.

### 1.2. Phần CHỦ Ý **KHÔNG** kiểm thử (kèm lý do)

| # | Phần không kiểm | Lý do |
|:---:|:---|:---|
| 1 | **Màn hình cấu hình hệ thống** (đọc danh mục Trung tâm / Nhóm sự cố) | Chỉ đọc dữ liệu tham chiếu, **không chứa quy tắc nghiệp vụ nào** để kiểm chứng — kiểm thử nó chỉ trùng lặp kiểm thử CSDL. |
| 2 | **Hiệu năng NFR1** (độ trễ < 1.5s với 10.000 bản ghi, tải 20 RPS) | Cần môi trường đo riêng có dữ liệu sinh lập thể tốn kém; đề BT3 nêu rõ **KHÔNG yêu cầu** độ phù kiểm thử cao và hiệu năng. |
| 3 | **Kiểm thử xâm nhập (pentest) và OWASP đầy đủ** | Thuộc Chuyên đề tốt ghiệp 2; ở BT3 chỉ kiểm 1 mục A01 (kiểm quyền theo chủ sở hữu / che dữ liệu nhạy cảm — QT-15). |
| 4 | **Kiểm thử giao diện React (UI / E2E trình duyệt)** | Toàn bộ nghiệp vụ đã được kiểm ở tầng API; UI chỉ là lớp trình bày lại dữ liệu đã kiểm, không sinh quy tắc nghiệp vụ riêng. |
| 5 | **CI/CD, giám sát, cảnh báo, deploy môi trường công khai** | Đề BT3 ghi rõ **KHÔNG yêu cầu**; các nội dung này thuộc CDT2. |
| 6 | **Module khách hàng (khách tự đăng nhập, tra cứu bảo hành qua web)** | Đã xác định ở mức **WON'T** trong phạm vi Bài tập 1 — nằm ngoài phân hệ L4. |
| 7 | **Tích hợp bên thứ ba** (SMS/email nhắc hẹn, thanh toán, hệ thống kho/ERP của Mekong Mobile) | Prototype chưa có các module này; tài liệu kỹ thuật không được mô tả tính năng chưa có. |
| 8 | **Ứng dụng di động (mobile app)** | Chỉ có giao diện Web React trong phạm vi prototype. |
| 9 | **Quy tắc QT-09, QT-10, QT-12, QT-14 (báo cáo tổng hợp, xuất Excel, bảo trì danh mục)** | Chưa hiện thực trong mã nguồn `src/` — kiểm thử tính năng chưa tồn tại là vi phạm nguyên tắc "tài liệu phải mô tả đúng hệ thống thật". |

---

## MỤC 2. LOẠI TEST VÀ SỐ LƯỢNG MỖI TẦNG

### 2.1. Tổng quan theo tầng kiểm thử

| Tầng | Mục đích | Số lượng | Công cụ | Cần CSDL thật? | Vị trí mã nguồn |
|:---|:---|:---:|:---|:---:|:---|
| **Unit test** | Kiểm 1 hàm / 1 lớp service, thay thế Repository bằng đối tượng giả (Mock) | **10** | Jest 29 + `jest.fn()` | Không | `tests/bt3-unit.test.js` (TC-01…TC-10, 11 assertion test — TC-04 có 2 nhánh trong cùng 1 mã) |
| **API test** | Gọi hệ thống qua HTTP như người dùng thật (Express + Supertest; service + middleware thật, repository giả in-memory) | **1** | Jest 29 + Supertest 7 | Không (inject repository giả qua `createApp()`) | `tests/bt3-new.test.js` (TC-11) |
| **Tái lập thủ công** | Chạy lại `node prisma/seed.js` lần 2 trên PostgreSQL thật, đếm 6 bảng trước/sau | **1** | `node` + Prisma / `psql` | **Có** | `prisma/seed.js` (TC-12, thủ công + ảnh chụp) |
| | | **12 test case** | | | |

> **Tổng cộng: 12 test case** (đúng mục tiêu "10–12 test case" của đề BT3 mục 2.2): **10 unit** (`tests/bt3-unit.test.js`, trong đó TC-04 có 2 nhánh trong cùng 1 mã) + **1 API** (`tests/bt3-new.test.js`, TC-11) + **1 tái lập thủ công** (TC-12 chạy `node prisma/seed.js` lần 2, có ảnh chụp).
> Ngoài ra, bộ kiểm thử hồi quy (regression) hiện có của Bài tập 2 gồm **29 test functions** (`ticket.service` 12 + `technician.service` 4 + `api.routes` 8 + `validator` 5) vẫn chạy cùng lệnh `npm test` — tổng suite hiện tại là **42 test functions** (29 BT2 + 11 bt3-unit (TC-04 có 2 nhánh) + 2 bt3-new). Test Report của BT3 chỉ lập bảng cho **12 mã test case** cốt lõi nêu dưới đây. TC phụ `TC-P1` (SEC-02, không token → 401) giữ ở phụ lục hồi quy và vẫn truy vết tới BUG-05.

### 2.2. Đủ 5 loại test bắt buộc của BT3 (mục 2.2) và ánh xạ test case

| # | Loại test (BT3) | Số lượng tối thiểu theo đề | Test case thực hiện | Ghi chú |
|:---:|:---|:---:|:---|:---|
| **Loại 1** | **Luồng đúng (Happy path)** | ≥ 1 test cho **MỖI** quy tắc đã hiện thực → ≥ 5 | `TC-01`, `TC-02`, `TC-03`, `TC-04`, `TC-05` (**5**) | QT-04, QT-08, QT-06, FR4, QT-15 mỗi quy tắc ≥ 1 test luồng đúng (TC-03 dùng assertion `status_history` + chuyển hợp lệ trong cùng flow phân công, truy vết QT-06) |
| **Loại 2** | **Giá trị biên (Boundary values)** | 2 test ở **hai bên của cùng một ranh giới** | `TC-06`, `TC-07` (**2**) | Ranh giới `proficiency = 3` của QT-08: biên **đạt** (3) và biên **rớt** (2) |
| **Loại 3** | **Dữ liệu sai / vi phạm ràng buộc** | 2 test — kiểm **cả mã trạng thái VÀ nội dung thông báo lỗi** | `TC-08`, `TC-09`, `TC-10` (**3**) | Hệ thống phải **từ chối**, không được sập; mỗi test kiểm mã lỗi nghiệp vụ + HTTP status + nội dung message |
| **Loại 4** | **Bảo mật / chất lượng dữ liệu** | 1 test | `TC-11` (**1**) | Track SE — A01 Broken Access Control: KTV sửa phiếu của KTV khác → 403 (QT-14) |
| **Loại 5** | **Tính tái lập (Repeatability)** | 1 test | `TC-12` (**1**) — chạy lại `node prisma/seed.js` lần 2 trên CSDL thật, đếm 6 bảng trước/sau | Kiểm chứng idempotency của seed, có ảnh chụp terminal |

> Phụ lục hồi quy (không tính vào 12 TC chính): `TC-P1` = TC-SEC-02 (không token → 401, truy vết BUG-05) · `TC-P2` = TC-U08 (đổi priority → tính lại SLA 72h) · `TC-P3` = TC-U10 (ticketId không tồn tại). Cả 3 vẫn chạy trong `npm test` và PASS.

### 2.3. Bảng truy vết test case ↔ quy tắc nghiệp vụ (Traceability Matrix)

| Mã TC | Tầng | Loại | Quy tắc truy vết | Mô tả kiểm thử | Kết quả mong đợi (mã lỗi / HTTP) |
|:---|:---|:---:|:---|:---|:---|
| **TC-01** | Unit | 1 | **QT-04** | Tính hạn SLA tự động với 3 mức ưu tiên từ `received_at` cố định | `CAO` +24h (86 400 000 ms) · `TRUNG_BINH` +72h (259 200 000 ms) · `THAP` +120h (432 000 000 ms), đúng tuyệt đối |
| **TC-02** | Unit | 1 | **QT-08** | Phân công KTV `proficiency = 5`, cùng trung tâm | `status = DA_PHAN_CONG`, `technicianId` đúng, `status_history` dài +1 |
| **TC-03** | Unit | 1 | **QT-04** | Cập nhật ưu tiên → tự động tính lại hạn SLA (`CAO` → `TRUNG_BINH` = +72h) | `priority = TRUNG_BINH`, `dueDate = receivedAt + 72h` |
| **TC-04** | Unit | 1 + 3 | **FR4** | (a) Đặt lịch hẹn khung giờ **không** trùng → lưu thành công; (b) khung giờ trùng → từ chối | (a) `appointmentAt` + `SCHEDULED` OK; (b) `LICH_HEN_XUNG_DOT` + `update` 0 lần |
| **TC-05** | Unit | 1 | **QT-15** | Che số điện thoại ở tầng middleware: `0901234567` | Trả về đúng `090****567`, giữ nguyên kiểu `Date` |
| **TC-06** | Unit | 2 | **QT-08** | **Biên đạt:** KTV `proficiency = 3` (đúng ngưỡng tối thiểu) | Phân công **thành công**, `status = DA_PHAN_CONG` |
| **TC-07** | Unit | 2 | **QT-08** | **Biên rớt:** KTV `proficiency = 2` (ngay dưới ngưỡng) | Từ chối: mã `KTV_KHONG_DU_TAY_NGHE` + message chứa "proficiency tối thiểu từ 3 trở lên"; phiếu giữ `MOI` |
| **TC-08** | Unit | 3 | **QT-06** | Chuyển trạng thái ngược `HOAN_TAT → MOI` | Từ chối: mã `TRANG_THAI_KHONG_HOP_LE` + message "quy tắc vòng đời không đảo ngược"; `update` 0 lần |
| **TC-09** | Unit | 3 | **FR4** | Đặt lịch hẹn trùng khung giờ KTV đang có | Từ chối: mã `LICH_HEN_XUNG_DOT` + HTTP `409` + message nêu mã phiếu xung đột |
| **TC-10** | Unit | 3 | **QT-08** | Phân công KTV khác trung tâm (`centerId` 1 vs 2) | Từ chối: mã `KTV_KHONG_CUNG_TRUNG_TAM` + HTTP `422`; phiếu giữ `MOI` |
| **TC-11** | API | 4 | **A01 / QT-14** | KTV `id=5` sửa phiếu của KTV `id=3` qua `PATCH /:id/status` + `PUT /:id` | HTTP **403** cả 2 request, `error = KHONG_CO_QUYEN`, message "không có quyền"; dữ liệu không đổi |
| **TC-12** | Thủ công (DB thật) | 5 | Tất cả (seed) | Chạy lại `node prisma/seed.js` lần 2, đếm 6 bảng trước/sau | Exit code 0, 6/6/8/4/4/4 không đổi, không `ticket_code`/`phone` trùng |

**Độ phủ truy vết:** 5/5 quy tắc trọng tâm có ít nhất **1 test luồng đúng** (100%) · 2/2 test biên ở hai bên ranh giới `proficiency = 3` · 3/3 test dữ liệu sai kiểm cả mã lỗi lẫn nội dung thông báo · 1/1 test bảo mật · 1/1 kiểm chứng tính tái lập.

---

## MỤC 3. TIÊU CHÍ THÀNH CÔNG (ĐO ĐƯỢC BẰNG SỐ)

Điều kiện coi là **"kiểm thử đã đạt"** — tất cả các mục dưới đây phải đồng thời thỏa mãn:

| # | Tiêu chí | Ngưỡng đo | Cách đo |
|:---:|:---|:---:|:---|
| 1 | Tổng số test case của BT3 | **12/12 PASS** (10 unit + 1 API + 1 tái lập thủ công) | Bảng B trong `docs/test-report.md` + log `npm test` + ảnh chụp TC-12 |
| 2 | Bộ hồi quy Bài tập 2 không được hồi quy | **29/29 PASS** (toàn suite `npm test` PASS, trừ 2 FAIL trung thực TC-11/TC-P1 trước khi fix) | `npm test` chạy toàn bộ suite |
| 3 | Độ phủ truy vết quy tắc nghiệp vụ | **5/5 quy tắc** (QT-04, QT-06, QT-08, FR4, QT-15) có ≥ 1 test luồng đúng và ≥ 1 test lỗi/biên | Ma trận truy vết mục 2.3 |
| 4 | Test giá trị biên | **2/2** ở hai bên của cùng ranh giới `proficiency = 3` (đạt & rớt) | `TC-06`, `TC-07` |
| 5 | Test dữ liệu sai | **3/3** — mỗi test kiểm **cả mã lỗi nghiệp vụ, HTTP status code, và nội dung thông báo**; **0** trường hợp hệ thống sập (HTTP 500) | `TC-08`, `TC-09`, `TC-10` |
| 6 | Test bảo mật / chất lượng dữ liệu | **1/1 PASS** — cả 2 request của KTV lạ đều 403, dữ liệu không đổi | `TC-11` |
| 7 | Tính tái lập | Chạy seed lần 2: **exit 0**, 6/6/8/4/4/4 không đổi, **0** trùng lặp; chạy lại `npm test` lần 2 kết quả giống hệt lần 1 | `TC-12` |
| 8 | Thời gian chạy bộ kiểm thử | **≤ 60 giây** cho toàn bộ suite (`npm test`) | Đo bằng `time npm test` |
| 9 | Bug đang mở | **0 bug mức Critical** đang mở; **0 bug mức Major** chưa xử lý mà không có ghi rõ lý do + hướng xử lý trong `docs/bug-log.md` | Đối chiếu `docs/bug-log.md` |
| 10 | Bug Log | **≥ 3 bug** đã sửa, mỗi bug đủ 7 dòng, **100% link commit mở được** và trỏ đúng nội dung bản sửa | `docs/bug-log.md` |
| 11 | Dữ liệu thử tái lập được | Chạy lại `node prisma/seed.js` lần thứ hai: **không lỗi, không nhân đôi dữ liệu** (giữ nguyên 6 TT / 6 nhóm sự cố / 8 KTV / 4 KH / 4 thiết bị / 4 phiếu) | Idempotent seed (`upsert`) |

> **Trả lời câu hỏi "Làm sao em biết là em đã kiểm thử ĐỦ?":** Em có **5 quy tắc nghiệp vụ đã hiện thực** (QT-04, QT-06, QT-08, FR4, QT-15). Mỗi quy tắc có **ít nhất một test luồng đúng** và **một test lỗi hoặc biên**; thêm **2 test biên** ở hai bên cùng một ranh giới (`proficiency = 3`), **3 test dữ liệu sai** và **3 test API** cho luồng chính. Em **cố ý không kiểm** màn hình cấu hình, kiểm thử hiệu năng, pentest và kiểm thử UI — vì những phần đó **không có quy tắc nghiệp vụ nào để kiểm chứng** hoặc đã nằm ngoài phạm vi BT3; lý do đã ghi ở **Mục 1.2**.

---

## MỤC 4. MÔI TRƯỜNG, DỮ LIỆU THỬ VÀ LỆNH CHẠY

### 4.1. Môi trường kiểm thử

| Thành phần | Yêu cầu | Ghi chú |
|:---|:---|:---|
| Hệ điều hành | Windows 10/11, macOS hoặc Linux | Không phụ thuộc hệ điều hành cụ thể |
| Node.js | **≥ 18.x** (khuyến nghị **20 LTS**) | `node -v` |
| npm | **≥ 9.x** | `npm -v` |
| PostgreSQL | **16** (chạy bằng `docker compose up -d postgres` — image `postgres:16-alpine`) | Cổng `5432`, DB `mekong_crm_l4` |
| Docker Desktop | Bắt buộc **nếu** chọn Cách 1 (Node.js + Docker DB) | Container `mekong_postgres` có `healthcheck` `pg_isready` |
| Test runner | Jest **29.7**, Supertest **7** | Đã khai báo trong `devDependencies` + `package-lock.json` |
| Cấu hình | Copy `.env.example` → `.env` | `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mekong_crm_l4?schema=public` |

**Môi trường chạy các test:**

- **10 unit test (TC-01…TC-10) + 1 API test (TC-11)** → chạy **không cần CSDL** (Repository giả; API test inject repository giả qua `createApp(customServices)` của `src/app.js`, còn service + middleware + errorHandler là mã thật). Giảng viên chạy `npm test` ngay sau `npm install` mà không cần dựng PostgreSQL.
- **1 kiểm chứng tái lập (TC-12)** → **cần PostgreSQL thật** đang chạy và đã nạp seed; dùng `DATABASE_URL` trong `.env`.

### 4.2. Dữ liệu thử — nguồn và cách nạp

Dữ liệu thử do **`prisma/seed.js`** dựng (nạp **idempotent** bằng `upsert` — chạy lại nhiều lần **không nhân đôi dữ liệu** và **không lỗi**).

```bash
# Dựng CSDL + nạp dữ liệu mẫu (2 lệnh)
docker compose up -d postgres
npm run db:setup          # = prisma migrate deploy && node prisma/seed.js
```

**Số bản ghi sau khi nạp (đối chiếu được):**

| Bảng / danh mục | Số bản ghi | Nội dung |
|:---|:---:|:---|
| `service_center` (Trung tâm bảo hành) | **6** | TT1 Quận 10 · TT2 Tân Bình · TT3 Thủ Đức · TT4 Cần Thơ Ninh Kiều · TT5 Cái Răng · TT6 Hà Nội Cầu Giấy |
| `issue_category` (Nhóm sự cố) | **6** | MAN_HINH, PIN, SAC, PHAN_MEM, NUOC_VAO, KHAC |
| `technician` (KTV) | **8** | KTV 1–2 ở TT1 · KTV 3–6 ở TT2 · KTV 7 ở TT3 · KTV 8 ở TT4 |
| `customer` (Khách hàng) | **4** | Nguyễn Thị Mai (VIP) · Trần Văn Nam · Lê Thị Thu · Hoàng Minh Đức |
| `device` (Thiết bị) | **4** | iPhone 15 Pro Max · Galaxy S24 Ultra · Xiaomi 14 Ultra · Oppo Find X7 |
| `ticket` (Phiếu bảo hành) | **4** | Phiếu 1 `MOI` (chờ phân công) · Phiếu 2 `MOI` (chờ phân công) · Phiếu 3 `DA_PHAN_CONG` (đã có lịch hẹn) · Phiếu 4 `DANG_XU_LY` |

**Các bản ghi seed được chọn có chủ ý để phục vụ từng test case:**

| Dữ liệu seed | Giá trị | Phục vụ test case |
|:---|:---|:---|
| KTV `technician_id = 5` (Đỗ Hữu Thắng, TT2) | `proficiency = 3` | `TC-06` — **biên đạt** của QT-08 (mock trong `bt3-unit.test.js` lấy cùng ngưỡng) |
| KTV `technician_id = 6` (Lê Quốc Bảo, học viện, TT2) | `proficiency = 2` | `TC-07` — **biên rớt** của QT-08 |
| KTV `technician_id = 1` (thuộc TT1) | `center_id = 1` | `TC-10` — KTV **khác trung tâm** so với phiếu (TT2) |
| Phiếu `ticket_id = 1`, `ticket_id = 2` | `status = MOI`, `center_id = 2` | Tiền đề phân công (QT-08) |
| Phiếu `ticket_id = 3` | `status = DA_PHAN_CONG`, đã có lịch hẹn | Kịch bản xung đột FR4 (`TC-04` nhánh 2 / `TC-09`) |
| Phiếu 1 (`priority = CAO`) | `due_date = received_at + 24h` | Đối chiếu SLA QT-04 (`TC-01`) |

> **Lưu ý về tính tái lập:** các mốc thời gian trong seed được tính **tương đối** so với thời điểm chạy seed (`now ± N giờ`). Vì vậy **phải nạp seed trước khi chạy integration test** và **không hard-code** thời điểm tuyệt đối trong test.

### 4.3. Lệnh chạy bộ kiểm thử

```bash
# 1. Cài đặt phụ thuộc
npm install

# 2. (Chỉ khi chạy TC-12) Dựng CSDL + nạp dữ liệu mẫu
docker compose up -d postgres
npm run db:setup          # = prisma migrate deploy && node prisma/seed.js
npm run db:seed           # chạy lần 2 cho TC-12, đếm lại 6 bảng

# 3. Chạy TOÀN BỘ bộ kiểm thử — MỘT lệnh duy nhất
npm test
```

Lệnh `npm test` được khai báo trong `package.json` là:

```json
"test": "jest --runInBand --detectOpenHandles --forceExit"
```

**Kết quả mong đợi cụ thể khi chạy thành công (trước khi fix BUG-04/BUG-05):**

```
Test Suites: 1 failed, 5 passed, 6 total
Tests:       2 failed, 40 passed, 42 total    # 2 FAIL là TC-11 (SEC-01) + TC-P1 (SEC-02) — đúng dự kiến, truy vết BUG-04/BUG-05
```

**Sau khi fix BUG-04/BUG-05/BUG-06 và commit riêng từng bug:**

```
Test Suites: 6 passed, 6 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        < 60 s
```

**Các lệnh phụ trợ (không thay thế lệnh chính):**

| Mục đích | Lệnh |
|:---|:---|
| Chạy lại lần thứ hai (kiểm chứng tính tái lập) | `npm test` (giống hệt lần 1, phục vụ TC-12 ở mức suite) |
| Báo cáo độ phủ kiểm thử | `npm run test:coverage` |
| Chạy lẻ từng file BT3 | `npx jest tests/bt3-unit.test.js` (11 test functions cho TC-01…TC-10) · `npx jest tests/bt3-new.test.js` (TC-11 + TC-P1) |
| Nạp lại dữ liệu mẫu idempotent (TC-12) | `npm run db:seed` (lần 2 phải exit 0, 6/6/8/4/4/4 không đổi) |

### 4.4. Dọn dẹp sau khi kiểm thử

```bash
docker compose down          # Dừng và xóa container (giữ volume dữ liệu)
docker compose down -v       # Xóa cả volume — dùng khi muốn dựng lại từ CSDL trống
```

---

## Tài liệu liên quan

| Tệp | Nội dung |
|:---|:---|
| `docs/test-report.md` | Bảng 12 test case đủ 8 cột với kết quả chạy thật |
| `docs/bug-log.md` | ≥ 3 bug đã sửa, mỗi bug đủ 7 dòng + link commit |
| `docs/deployment-guide.md` | Hướng dẫn dựng hệ thống bằng tiếng Anh (5 mục) |
| `docs/checklist-bao-mat.md` | Checklist bảo mật 7 mục đã tự đánh giá |
| `docs/api-docs/` | Tài liệu kỹ thuật theo track SE |
| `docs/srs.md` | Nguồn chuẩn của QT-04, QT-06, QT-08, QT-15 và FR4 |
| `src/services/ticket.service.js` | Điểm hiện thực của QT-04, QT-06, QT-08, FR4 |
| `prisma/seed.js` | Nguồn dữ liệu thử (idempotent) |
