# THÀNH PHẦN 3 — THIẾT KẾ KIẾN TRÚC

## HỆ THỐNG SMART CRM – MEKONG MOBILE

### Luồng L4 – Phân công kỹ thuật viên và lịch hẹn

**Học phần:** Chuyên đề tốt nghiệp 1 (HK261)  
**Track:** Kỹ thuật phần mềm (SE)  
**Tài liệu tham chiếu:** Slide Buổi 5 – Thiết kế kiến trúc & Mô hình dữ liệu

---

## 3.1. SƠ ĐỒ KIẾN TRÚC PHÂN LỚP (LAYERED ARCHITECTURE)

Sơ đồ thể hiện các phần (lớp) của hệ thống, **trách nhiệm** của từng phần và **cách các phần trao đổi** với nhau thông qua REST/JSON ở biên ngoài và giao diện Repository ở bên trong. Phụ thuộc giữa các lớp là **một chiều từ trên xuống** (lớp dưới KHÔNG gọi ngược lớp trên).

```
+-----------------------------------------------------------------------------------+
|  LỚP TRÌNH BÀY  (PRESENTATION LAYER)                                             |
|  Trách nhiệm: Nhận HTTP request, kiểm tra định dạng đầu vào, xác thực JWT,        |
|  ủy quyền theo vai trò, che số điện thoại khách hàng (QT-15), chuyển dữ liệu     |
|  xuống lớp nghiệp vụ và trả response JSON cho client.                            |
|                                                                                   |
|  [ Trang DS phiếu chờ ]   [ Trang phân công ]   [ Trang lịch hẹn ]                |
|  [ Trang KTV cá nhân  ]   [ Trang tải công việc]                                 |
|                                                                                   |
|  Controllers: TicketController · AssignmentController · AppointmentController ·   |
|               WorkloadController · TechnicianController                           |
|  Middlewares:    authMiddleware(JWT) · roleGuard(CM/KTV) · phoneMasker(QT-15) ·   |
|                  errorMapper(RFC7807) · requestValidator(joi/zod)                 |
+-----------------------------------------------------------------------------------+
                                          │
                                          │  HTTP + JSON  (hợp đồng: docs/api-contract.md)
                                          ▼
+-----------------------------------------------------------------------------------+
|  LỚP NGHIỆP VỤ  (BUSINESS / SERVICE LAYER)                                        |
|  Trách nhiệm: Chứa TOÀN BỘ quy tắc nghiệp vụ QT-04, QT-06, QT-07, QT-08,        |
|  QT-13, QT-14, QT-15. Điều phối transaction ACID (NFR3), mở Database              |
|  Transaction khi phân công, ném domain exception khi vi phạm quy tắc.             |
|  KHÔNG biết dữ liệu lưu ở PostgreSQL hay công nghệ gì.                            |
|                                                                                   |
|  >>> TOÀN BỘ quy tắc nghiệp vụ nằm trong lớp này <<<                             |
|                                                                                   |
|  • AssignmentService.assignTicket()    – kiểm tra QT-08 (cùng trung tâm,         |
|                                         proficiency ≥ 3), chuyển MOI→DA_PHAN_CONG |
|                                         và append status_history trong 1 tx       |
|  • TicketQueryService.listUnassigned() – truy vấn phiếu MOI theo center,         |
|                                         phân trang, sắp xếp received_at           |
|  • TechnicianQueueService.listMine()   – phiếu của KTV, sắp xếp due_date asc,    |
|                                         cảnh báo < 4 giờ                          |
|  • AppointmentService.create()         – kiểm tra trùng khung giờ, QT-06         |
|  • WorkloadService.summary()           – đếm workload, phát hiện quá tải         |
|  • StatusService.transition()          – kiểm tra vòng đời trạng thái QT-06      |
|  • SlaCalculator                       – tính due_date theo priority (QT-04)     |
+-----------------------------------------------------------------------------------+
                                          │
                          │  Gọi qua GIAO DIỆN Repository (interface)
                          │  KHÔNG gọi trực tiếp SQL, KHÔNG gọi ngược lên Controller
                          ▼
+-----------------------------------------------------------------------------------+
|  LỚP TRUY CẬP DỮ LIỆU  (REPOSITORY / DAO LAYER)                                  |
|  Trách nhiệm: Che giấu chi tiết SQL/PostgreSQL, chỉ cung cấp phương thức         |
|  find/save/update; thực thi truy vấn có index (technician_id, due_date);          |
|  KHÔNG chứa quy tắc nghiệp vụ, KHÔNG tính toán nghiệp vụ.                        |
|                                                                                   |
|  Interfaces:  ITicketRepository · ITechnicianRepository ·                          |
|               IAppointmentRepository · ICustomerRepository · IDeviceRepository    |
|  (status_history được quản lý trực tiếp qua ITicketRepository / Document-in-Row)  |
|  Implementations: PrismaTicketRepository · PrismaTechnicianRepository · ...       |
|  (Mock trong bộ nhớ dùng cho unit test: MemTicketRepository · ...)                |
+-----------------------------------------------------------------------------------+
                                          │
                                          │  SQL qua Prisma ORM / PostgreSQL Client
                                          ▼
+-----------------------------------------------------------------------------------+
|  LỚP LƯU TRỮ  (DATA STORE LAYER – PostgreSQL 16)                                 |
|  Trách nhiệm: Giữ dữ liệu, bảo đảm toàn vẹn ở mức lược đồ (PK, FK,             |
|  NOT NULL, CHECK, UNIQUE, INDEX). Thực thi ACID cho transaction phân công.       |
|                                                                                   |
|  Bảng 3NF (6 bảng): ticket (kèm status_history JSONB) · customer · device ·      |
|                     technician (kèm proficiency) · issue_category ·              |
|                     service_center (VIEW v_ticket_status_log, v_appointments)     |
+-----------------------------------------------------------------------------------+

CHÚ THÍCH KÝ HIỆU:
  [ ]  = màn hình giao diện người dùng
  v    = hướng phụ thuộc một chiều (lớp trên gọi lớp dưới; lớp dưới KHÔNG gọi ngược)
  ───  = đường biên giữa hai lớp, kèm giao thức trao đổi (HTTP/JSON hoặc SQL)
  >>>  = vị trí bắt buộc đặt quy tắc nghiệp vụ

NGOÀI PHẠM VI  (WON'T – đối chiếu mục 1.3 của SRS):
  • Gửi SMS / Zalo thông báo lịch hẹn tự động cho khách hàng.
  • Cổng khách hàng tự đặt / đổi lịch hẹn trực tuyến.
  • Auto-dispatching hoàn toàn bằng AI không có xác nhận của Quản lý.
  • Tích hợp hệ thống kế toán / kho linh kiện bên ngoài.
  • Microservices, message queue, Redis cache – không có NFR nào của BT1 đòi hỏi.
```

---

## 3.2. BẢNG TRÁCH NHIỆM TỪNG LỚP VÀ CÁCH TRAO ĐỔI

| Lớp                  | Trách nhiệm chính                                                                                                                                                                    | Trao đổi với lớp khác                                                                                                                         | KHÔNG được làm                                                                                                 |
| :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Trình bày**        | Nhận request, parse JSON, kiểm tra schema, gọi Service, map domain exception → HTTP status (RFC 7807), che số điện thoại trước khi trả JSON (QT-15).                                 | Gọi **xuống** Service qua hàm thông thường (`ticketService.assign(...)`); trả response bằng `res.status(200).json(...)`.                      | Không chứa quy tắc nghiệp vụ, không viết SQL, không gọi trực tiếp Repository.                                  |
| **Nghiệp vụ**        | Thi hành mọi quy tắc QT-04/06/07/08/13/14/15; mở Database Transaction cho phân công; tính `due_date`; phát hiện xung đột lịch; ném exception có mã lỗi nghiệp vụ.                    | Gọi **xuống** Repository **chỉ qua giao diện** (interface) đã inject; nhận/thực thể miền, trả về cho Controller.                              | Không biết HTTP, không tạo đối tượng `req/res` của Express, không tự viết câu SQL, không gọi ngược Controller. |
| **Truy cập dữ liệu** | Cài đặt giao diện Repository bằng SQL PostgreSQL; dùng `node-postgres`; tận dụng `INDEX (technician_id, due_date)`, `INDEX (status, center_id)`; tham gia transaction do Service mở. | Nhận tham số nguyên thuỷ hoặc thực thể miền từ Service; trả về thực thể miền hoặc `null`; thực thi `COMMIT`/`ROLLBACK` theo lệnh của Service. | Không kiểm tra quy tắc nghiệp vụ, không gọi Service khác, không phụ thuộc framework HTTP.                      |
| **Lưu trữ**          | Lưu trữ bảng, đảm bảo ràng buộc `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `CHECK`, `UNIQUE`; tạo index; thực thi ACID.                                                               | Nhận câu SQL có tham số hoá; trả về rowset.                                                                                                   | Không chứa logic nghiệp vụ, không gọi ngược lên các lớp trên.                                                  |

---

## 3.3. ≥ 3 CÂU GIẢI THÍCH LỰA CHỌN KIẾN TRÚC

Mỗi câu viết đúng khuôn: **"Vì <mã NFR> yêu cầu <ngưỡng cụ thể>, tôi chọn <quyết định kiến trúc>, đánh đổi là <chi phí>."**

1. **Vì NFR1 yêu cầu API `GET /api/tickets/unassigned` phải phản hồi dưới 1.5 giây với 10.000 bản ghi và tải đồng thời 20 RPS trên cấu hình 2 vCPU/4 GB RAM, tôi chọn kiến trúc phân lớp kết hợp đẩy phân trang + lọc xuống tầng cơ sở dữ liệu (`LIMIT/OFFSET` với tham số `page`, `size`) và khai báo index kết hợp `(status, center_id, received_at)` thay vì tải toàn bộ 10.000 phiếu lên lớp nghiệp vụ rồi lọc trong bộ nhớ, đánh đổi là tăng chi phí ghi khi chèn phiếu mới vì phải cập nhật chỉ mục và phải duy trì chiến lược phân trang ổn định (dùng `received_at, ticket_id` làm con trỏ thay vì `OFFSET` lớn) khi tập dữ liệu phình to, chấp nhận được vì tần suất đọc danh sách chờ phân công cao hơn rất nhiều lần tần suất ghi phiếu mới.**

2. **Vì NFR3 yêu cầu thao tác phân công kỹ thuật viên (gán `technician_id` + đổi trạng thái `MOI → DA_PHAN_CONG` + append lịch sử trạng thái vào cột JSONB `status_history` của phiếu) phải thực thi trong một Database Transaction ACID hoàn chỉnh với tỉ lệ xung đột gán trùng bằng 0% và tự động rollback khi lỗi kết nối giữa chừng, tôi chọn Phương án B – mở transaction ở lớp nghiệp vụ `AssignmentService.assignTicket()` (Service là chủ duy nhất điều phối transaction/atomic update → cập nhật phiếu và ghi nhận `status_history` cùng lúc), đồng thời ở lớp truy cập dữ liệu Repository nhận tham số context transaction và dùng `SELECT ... FOR UPDATE` trên bản ghi `ticket` trước khi cập nhật, thay vì Phương án A – để mỗi Repository tự `BEGIN/COMMIT` riêng (gọn nhưng nếu một lệnh fail sau lệnh đầu thì dữ liệu lịch sử bị lệch trạng thái, vi phạm 0% mất nhất quán), đánh đổi là tăng độ trễ khoá dòng khoảng 5–20 mili-giây cho mỗi lần phân công do giữ khoá từ lúc đọc đến lúc `COMMIT`, phải truyền context qua các thao tác Repository, và phải viết unit test với transaction giả để xác minh rollback, chấp nhận được vì nghiệp vụ phân công xảy ra vài lần mỗi phút nhưng sai một lần là mất tính nhất quán dữ liệu lịch sử không thể phục hồi.**

3. **Vì NFR2 yêu cầu 100% request phải xác thực bằng JWT và 100% số điện thoại khách hàng trả về cho vai trò Kỹ thuật viên phải được che dạng `090\*\***567`(QT-15) trong khi Quản lý trung tâm và Ban giám đốc vẫn phải thấy đầy đủ, tôi chọn Phương án A – che số điện thoại bằng`phoneMasker`ở lớp trình bày (chạy như một Express middleware ngay sau`authMiddleware`và`roleGuard`, áp dụng trên object response trước khi `res.json`gọi tới client), thay vì Phương án B – lưu thêm cột`masked_phone`tính sẵn trong bảng`customer`(nhanh hơn nhưng dữ liệu bị trùng lặp, mỗi lần đổi SĐT phải cập nhật hai nơi) hoặc Phương án C – che ngay tại lớp Repository (làm rò rỉ logic bảo mật ra tầng dữ liệu, mọi câu SELECT sau này đều phải nhớ che), đánh đổi là thêm chi phí CPU mask bằng regex trên mỗi response (ước tính ~0.1–0.3 ms cho mỗi SĐT, không đáng kể so với NFR1 1.5s), phải tăng độ bao phủ test middleware mask (viết test riêng xác nhận SĐT bị che đúng dạng`090\***\*567`cho mọi endpoint trả về customer), và có rủi ro nếu một Controller mới quên gọi`res.json`mà tự`res.send(rawObject)`sẽ lọt SĐT thô — đã giảm thiểu bằng cách bắt buộc cấu hình`app.use(phoneMasker)`ở cấp`app` thay vì từng route, chấp nhận được vì lợi ích là chỉ một điểm duy nhất áp dụng chính sách che, không phải sửa từng Repository, không tốn thêm cột lưu trữ, và không làm nhiễu logic nghiệp vụ ở tầng dữ liệu.**

4. **Vì NFR4 yêu cầu một Quản lý trung tâm mới tiếp nhận phải hoàn thành thao tác phân công 1 phiếu bảo hành cho kỹ thuật viên phù hợp trong thời gian dưới 30 giây với không quá 3 lần nhấp chuột mà không cần hướng dẫn, tôi chọn Phương án A – `AssignmentService.listEligibleTechnicians()` (trong lớp nghiệp vụ) tự động trả về danh sách KTV đã lọc sẵn theo QT-08 (cùng trung tâm, `proficiency >= 3`, `is_active = true`) kèm `workload_count` của mỗi người, rồi Controller chỉ gọi một endpoint duy nhất `GET /api/tickets/{id}/assign-candidates` để mở bảng chọn, thay vì Phương án B – để frontend phải gọi 3–4 API lần lượt (lấy ticket → lấy KTV trong trung tâm → lọc KTV theo tay nghề → tính workload) rồi lọc phía client (chậm hơn và có rủi ro bỏ sót KTV do dữ liệu lệch thời gian giữa các request), đánh đổi là thêm một endpoint và logic truy vấn tổng hợp (`technician` + đếm workload phiếu đang xử lý) mất khoảng 20–50 ms mỗi lần mở bảng phân công, chấp nhận được vì endpoint này chỉ được gọi khi Quản lý mở phiếu để phân công (vài lần mỗi giờ) chứ không nằm trong hot path, còn lợi ích là đảm bảo ngưỡng ≤ 3 click (click 1: mở danh sách phiếu chờ → click 2: chọn 1 phiếu → click 3: chọn 1 KTV + bấm xác nhận) và không phải tải danh sách KTV toàn trung tâm khi trung tâm có đến 38 KTV.**

---

## 3.4. ĐỐI CHIẾU KIẾN TRÚC VỚI YÊU CẦU PHI CHỨC NĂNG

| Mã NFR           | Ngưỡng yêu cầu                                                          | Quyết định kiến trúc đáp ứng                                                | Vị trí trong sơ đồ                   |
| :--------------- | :---------------------------------------------------------------------- | :-------------------------------------------------------------------------- | :----------------------------------- |
| NFR1 (Hiệu năng) | < 1.5s với 10.000 bản ghi, 20 RPS, 2 vCPU/4 GB                          | Phân trang DB-side, index kết hợp `(status, center_id, received_at)`        | Lớp truy cập dữ liệu + Lớp lưu trữ   |
| NFR2 (Bảo mật)   | 100% xác thực JWT; 100% số ĐT che `090****567` cho KTV (QT-15)          | `authMiddleware` + `phoneMasker` ở lớp trình bày                            | Lớp trình bày                        |
| NFR3 (Toàn vẹn)  | Phân công = 1 transaction ACID, 0% xung đột gán trùng, rollback khi lỗi | `AssignmentService` mở transaction, `SELECT ... FOR UPDATE` ở Repository    | Lớp nghiệp vụ + Lớp truy cập dữ liệu |
| NFR4 (Khả dụng)  | Phân công xong trong < 30s, ≤ 3 cú nhấp chuột                           | Service trả gợi ý KTV đạt chuẩn + workload, Controller chỉ gọi một endpoint | Lớp nghiệp vụ + Lớp trình bày        |
| NFR4 (Khả dụng)  | Phân công xong trong < 30s, ≤ 3 cú nhấp chuột                           | Service trả gợi ý KTV đạt chuẩn + workload, Controller chỉ gọi một endpoint | Lớp nghiệp vụ + Lớp trình bày        |

---

# THÀNH PHẦN 4 — MÔ HÌNH DỮ LIỆU THEO CHUYÊN NGÀNH

## HỆ THỐNG SMART CRM – MEKONG MOBILE

### Luồng L4 – Phân công kỹ thuật viên và lịch hẹn

**Track:** Kỹ thuật phần mềm (SE)  
**Tài liệu tham chiếu:** Tài liệu tự học Buổi 5 – Mô hình dữ liệu theo chuyên ngành  
**File ERD gốc:** `docs/erd.drawio`  
**File SQL DDL:** `docs/schema.sql`

---

## 4.1. TỔNG QUAN ERD (6 BẢNG, CHUẨN 3NF)

ERD cho luồng L4 gồm **6 bảng**, đạt mục kiểm chứng SE (4–6 bảng). Bảng trung tâm là `ticket` — mọi bảng còn lại nối vào `ticket` qua các quan hệ khóa ngoại. Để đạt giới hạn 6 bảng, ba thực thể phụ của thiết kế 9 bảng đã được **gộp thẳng** vào bảng mẹ (xem Ghi chú ở cuối mục):

```
┌───────────────┐     ┌───────────────┐     ┌───────────────────┐
│  customer     │     │   device      │     │ issue_category   │
│───────────────│     │───────────────│     │───────────────────│
│ PK customer_id│o───┐│ PK device_id  │     │ PK category_id   │
│    full_name  │    │FK customer_id │     │  category_name   │
│    phone      │    │  serial_no    │     │  default_priority│
└───────────────┘    └───────────────┘     └───────────────────┘
       │                    │                       │
       │  ┌─────────────────┴──────────────────────┘
       │  │
       ▼  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         ticket                                          │
│──────────────────────────────────────────────────────────────────────────│
│ PK ticket_id                                                           │
│    ticket_code          UNIQUE                                          │
│ FK customer_id         NOT NULL → customer                             │
│ FK device_id           NOT NULL → device                               │
│ FK center_id           NOT NULL → service_center                       │
│ FK technician_id       NULL được → technician (QT-07)                  │
│ FK category_id         NULL được → issue_category                      │
│    issue_desc          NOT NULL, CHECK (≥10 ký tự)                     │
│    priority            NOT NULL: CAO/TRUNG_BINH/THAP (QT-04)            │
│    status              NOT NULL, DEFAULT 'MOI' (QT-06)                  │
│    received_at         NOT NULL                                         │
│    due_date            NOT NULL → sinh theo QT-04                      │
│    closed_at           NULL được                                        │
│    ── GỘP TỪ ticket_status_log (QT-06) ──                             │
│    status_history      JSONB DEFAULT '[]'  mảng {from,to,at,by,note}    │
│    ── GỘP TỪ appointment (FR4) ──                                      │
│    appointment_at      TIMESTAMPTZ NULL  -- 1 lịch hẹn / 1 phiếu        │
│    appointment_status  VARCHAR(20) NULL                                  │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ├──► (qua FK)
       ▼
┌───────────────┐                              ┌───────────────────┐
│ technician    │                              │ service_center    │
│───────────────│                              │───────────────────│
│PK tech_id     │o─────────────────────────────►│ PK center_id      │
│FK center_id   │                              │  center_name      │
│  full_name    │                              │  city             │
│  proficiency  │                              │  is_active        │
│  level        │                              └───────────────────┘
│  is_active    │
└───────────────┘


```

**Tên bảng và cột:** snake_case, khớp bảng thuật ngữ trong SRS mục 1.4.

---

## 4.2. BẢNG LIÊN HỆ GIỮA BẢNG VÀ YÊU CẦU CHỨC NĂNG

| Bảng             | Thuộc tính                                                                                                                                                                                 | Phục vụ yêu cầu nào?                                                                               |
| :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| `customer`       | `customer_id` (PK), `full_name`, `phone`                                                                                                                                                   | FR1, US1 – tra cứu thông tin khách khi phân công                                                   |
| `device`         | `device_id` (PK), `serial_no`, `purchase_date`, `warranty_months`                                                                                                                          | FR1, FR2 – QT-03 (định danh duy nhất), QT-05 (kiểm tra bảo hành)                                   |
| `service_center` | `center_id` (PK), `center_name`, `city`                                                                                                                                                    | FR2, US2 – QT-08: KTV cùng trung tâm mới được phân công                                            |
| `issue_category` | `category_id` (PK), `category_name`                                                                                                                                                        | FR2, US2 – QT-08: Phân loại sự cố và xác định SLA mặc định (QT-04)                                                |
| `technician`     | `technician_id` (PK), `employee_id`, `full_name`, `center_id`, `proficiency`, `is_active`                                                                                                  | FR2, FR3, FR5, US2, US3 – phân công KTV, xem workload. Gộp tay nghề từ bảng `technician_skill` cũ. |
| `ticket`         | `ticket_id` (PK), `ticket_code`, `customer_id`, `device_id`, `technician_id`, `priority`, `status`, `due_date`, **`status_history` JSONB**, **`appointment_at`**, **`appointment_status`** | **TẤT CẢ** FR của luồng L4. JSONB thay cho bảng log; cột lịch hẹn thay cho bảng appointment.       |

---

## 4.3. SQL DDL SKELETON (TRÍCH ĐOẠN CHÍNH)

File đầy đủ tại `docs/schema.sql`. Dưới đây là các đoạn quan trọng nhất.

### 4.3.1. Bảng ticket (bảng trung tâm)

```sql
CREATE TABLE ticket (
    ticket_id       BIGSERIAL     PRIMARY KEY,
    ticket_code     VARCHAR(20)   NOT NULL UNIQUE,    -- BH-000123/2026
    customer_id     BIGINT        NOT NULL REFERENCES customer(customer_id),
    device_id       BIGINT        NOT NULL REFERENCES device(device_id),
    center_id       BIGINT        NOT NULL REFERENCES service_center(center_id),
    technician_id   BIGINT        REFERENCES technician(technician_id),  -- QT-07: NULL khi chưa phân công
    category_id     INT           REFERENCES issue_category(category_id),
    issue_desc      TEXT          NOT NULL CHECK (length(issue_desc) >= 10),
    priority        VARCHAR(12)   NOT NULL CHECK (priority IN ('CAO','TRUNG_BINH','THAP')),  -- QT-04
    status          VARCHAR(20)   NOT NULL DEFAULT 'MOI',  -- QT-06
    received_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    due_date        TIMESTAMPTZ   NOT NULL,              -- QT-04: sinh tự động
    closed_at       TIMESTAMPTZ,
    CONSTRAINT chk_due_after_received CHECK (due_date >= received_at)
);
```

### 4.3.2. Index cho NFR1 (hiệu năng < 1.5s)

```sql
-- NFR1: Lọc phiếu MOI theo trung tâm + sắp theo thời gian
CREATE INDEX idx_ticket_status_center_received
    ON ticket(status, center_id, received_at DESC);

-- NFR1 + US3: Workload + SLA (KTV xem phiếu theo hạn)
CREATE INDEX idx_ticket_tech_due
    ON ticket(technician_id, due_date ASC)
    WHERE status IN ('DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN');

-- US4 (FR4): Kiểm tra trùng lịch hẹn KTV
CREATE INDEX idx_ticket_appointment
    ON ticket(technician_id, appointment_at)
    WHERE appointment_at IS NOT NULL
      AND appointment_status IN ('SCHEDULED', 'CONFIRMED');

-- QT-06: Truy vấn JSONB status_history
CREATE INDEX idx_ticket_status_history_gin
    ON ticket USING GIN (status_history);

-- QT-08: Lọc nhanh KTV đủ tay nghề (proficiency >= 3)
CREATE INDEX idx_tech_proficiency
    ON technician(proficiency) WHERE proficiency >= 3;
```

---
