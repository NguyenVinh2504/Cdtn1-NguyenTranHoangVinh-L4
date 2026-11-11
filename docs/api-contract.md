# TÀI LIỆU ĐẶC TẢ HỢP ĐỒNG API (API CONTRACT)
## HỆ THỐNG SMART CRM – MEKONG MOBILE
### Phân hệ: Luồng L4 – Phân công kỹ thuật viên và lịch hẹn
**Học phần:** Chuyên đề tốt nghiệp 1 (HK261)  
**Track:** Kỹ thuật phần mềm (SE)  
**Tài liệu tham chiếu:** Theo mẫu đặc tả Track SE – Tài liệu tự học Buổi 3

> **📌 Ghi chú phiên bản (BT3 — 11/11/2026):** Tài liệu này đã được **đồng bộ lại với mã
> nguồn thật** sau khi chạy **phép thử máy trắng** trên Docker Compose (PostgreSQL 16,
> Node.js 20). Phiên bản BT1 mô tả 5 endpoint **không tồn tại** trong mã nguồn và dùng quy
> ước tên trường `snake_case` khác với mã thực thi. Ở giai đoạn 3, theo phương án đã được
> chốt, ta **sửa tài liệu cho khớp với hệ thống thật** (không bổ sung endpoint mới vào mã
> nguồn). Xem [`docs/thay-doi-thiet-ke.md`](thay-doi-thiet-ke.md) — Thay đổi 16.
>
> **Tài liệu chi tiết đầy đủ** (17 endpoint × 7 mục, ví dụ request/response thật):
> [`docs/api-docs/api-reference.md`](api-docs/api-reference.md) · Đặc tả máy đọc được:
> [`docs/api-docs/openapi.yaml`](api-docs/openapi.yaml)

---

## 1. QUY ƯỚC CHUNG CỦA HỆ THỐNG API

- **Giao thức truyền tải:** HTTP (HTTPS khi triển khai thật). Định dạng dữ liệu trao đổi: JSON, bảng mã UTF-8.
- **Header bắt buộc:**
  ```http
  Content-Type: application/json
  Authorization: Bearer <jwt_access_token>
  ```
  (Ngoại lệ: `GET /health`, `GET /` và `POST /api/auth/login` không yêu cầu token.)
- **Quy ước đặt tên trường dữ liệu:** **`camelCase` ở tầng API**, khớp 100 % với mã nguồn
  (Express + Prisma trả về đối tượng JS). Tên cột CSDL vẫn giữ `snake_case` theo chuẩn
  PostgreSQL và được ánh xạ tự động bởi Prisma Client.
  > **Thay đổi so với BT1:** bản BT1 ghi `snake_case` cho tầng API
  > (ví dụ `ticket_id`, `customer_phone`). Mã nguồn thật dùng `camelCase`
  > (ví dụ `ticketId`, `customer.phone`). Tài liệu này đã sửa cho khớp mã nguồn.
- **Chuẩn định dạng thời gian:** ISO 8601 kèm múi giờ, ví dụ: `2026-11-20T10:00:00+07:00`.
  API trả về theo chuẩn UTC (`...Z`).
- **Phân trang (Pagination):** Áp dụng query parameters `page` (bắt đầu từ 1, mặc định 1) và
  `limit` (mặc định 10, tối đa 100). Response trả về kèm **trường `total`** đếm tổng số bản ghi
  khớp điều kiện lọc (không phải số bản ghi của trang hiện tại):
  ```json
  {
    "success": true,
    "data": [ ... ],
    "total": 2
  }
  ```
  > **Thay đổi so với BT1:** bản BT1 mô tả một đối tượng `pagination` riêng
  > (`page`, `size`, `total_records`, `total_pages`). Mã nguồn thật trả về đơn giản hơn:
  > một mảng `data` kèm `total`.
- **Cấu trúc phản hồi thành công:**
  ```json
  {
    "success": true,
    "message": "Phân công kỹ thuật viên thành công",
    "data": { ... }
  }
  ```
  (Danh sách: `"data": [ ... ]` kèm `"total": <số lượng>`.)
- **Cấu trúc phản hồi lỗi chuẩn:**
  ```json
  {
    "success": false,
    "error": "DU_LIEU_KHONG_HOP_LE",
    "message": "Dữ liệu đầu vào tiếp nhận phiếu không hợp lệ",
    "chiTiet": [
      { "field": "customerId", "reason": "Mã khách hàng phải là số nguyên dương" }
    ]
  }
  ```
  - `error` là **mã lỗi nghiệp vụ** ổn định (viết hoa gạch dưới) — client nên bám vào trường này.
  - `message` là thông báo tiếng Việt dành cho người dùng, có thể thay đổi văn bản.
  - `chiTiet` là mảng mô tả lỗi theo từng trường khi lỗi là lỗi kiểm tra dữ liệu; ngược lại là `null`.
  > **Thay đổi so với BT1:** bản BT1 mô tả mẫu RFC 7807 (`error.code`, `error.message`,
  > `error.fields`). Mã nguồn thật dùng cấu trúc phẳng như trên.

### 1.1. Bảng ánh xạ mã lỗi nghiệp vụ → HTTP status

Nguồn: `HTTP_CODE_MAP` trong `src/middlewares/errorHandler.middleware.js`.

| Mã lỗi nghiệp vụ | HTTP | Ý nghĩa |
| :--- | :---: | :--- |
| `DU_LIEU_KHONG_HOP_LE` | 400 | Dữ liệu gửi lên không hợp lệ |
| `THIEU_TRUONG_BAT_BUOC` | 400 | Thiếu trường bắt buộc |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Chưa xác thực / sai thông tin đăng nhập |
| `TOKEN_HET_HAN` | 401 | Token đã hết hạn |
| `KHONG_CO_QUYEN` | 403 | Không đủ quyền theo vai trò hoặc theo chủ sở hữu (QT-14, A01) |
| `PHIEU_KHONG_TON_TAI` | 404 | Không tìm thấy phiếu bảo hành |
| `KTV_KHONG_TON_TAI` | 404 | Không tìm thấy kỹ thuật viên |
| `KTV_KHONG_KHA_DUNG` | 404 | Kỹ thuật viên không khả dụng |
| `TRUNG_TAM_KHONG_TON_TAI` | 404 | Không tìm thấy trung tâm bảo hành |
| `TRANG_THAI_KHONG_HOP_LE` | 409 | Chuyển trạng thái không hợp lệ (QT-06) |
| `LICH_HEN_XUNG_DOT` | 409 | Xung đột lịch hẹn trong khung ±30 phút |
| `KHONG_THE_XOA_PHIEU` | 422 | Phiếu không ở trạng thái `MOI` nên không xóa được |
| `KTV_KHONG_CUNG_TRUNG_TAM` | 422 | KTV khác trung tâm (QT-08) |
| `KTV_KHONG_DU_TAY_NGHE` | 422 | KTV chưa đủ trình độ (QT-08) |
| `KTV_QUA_TAI` | 422 | KTV đang giữ ≥ 8 phiếu mở (QT-11) |
| `LOI_HE_THONG` | 500 | Lỗi hệ thống không lường trước — **không** lộ stack trace |

### 1.2. Che dữ liệu nhạy cảm (QT-15)

Middleware `src/middlewares/phoneMasker.middleware.js` che số điện thoại **ở tầng ứng dụng**
trước khi dữ liệu rời khỏi server:

| Vai trò / đường dẫn | Định dạng số điện thoại |
| :--- | :--- |
| `CENTER_MANAGER` | `0901234567` (đầy đủ) |
| `TECHNICIAN` hoặc đường dẫn chứa `/technician` | `090****567` (che 4 số giữa) |

---

## 2. DANH SÁCH ENDPOINTS CỦA LUỒNG L4

> **Nguồn:** khai báo thật trong `src/routes/auth.routes.js`, `src/routes/ticket.routes.js`,
> `src/routes/technician.routes.js` + `src/app.js` (mount `/api`). Danh sách này đã được
> **kiểm chứng lại bằng cách gọi thật từng endpoint** trên container đang chạy.

| Phương thức | Đường dẫn Endpoint | Mục đích nghiệp vụ | User Story liên quan | Mức ưu tiên |
| :---: | :--- | :--- | :---: | :---: |
| `GET` | `/health` | Kiểm tra sống của tiến trình API (healthcheck Docker) | — | Hạ tầng |
| `GET` | `/` | Banner dịch vụ, công bố `apiPrefix` và URL frontend | — | Hạ tầng |
| `POST` | `/api/auth/login` | Đăng nhập, cấp JWT kèm thông tin vai trò và trung tâm | **US0** | **MUST** |
| `GET` | `/api/tickets` | Tra cứu danh sách phiếu bảo hành có phân trang và lọc | **US1**, **US3** | **MUST** |
| `GET` | `/api/tickets/unassigned` | Lấy danh sách phiếu bảo hành chưa phân công thuộc trung tâm của quản lý | **US1** | **MUST** |
| `GET` | `/api/tickets/technician/mine` | Kỹ thuật viên xem danh sách các phiếu được gán cho mình, sắp theo hạn SLA | **US3** | **MUST** |
| `GET` | `/api/tickets/{id}` | Xem chi tiết một phiếu bảo hành | **US1**, **US3** | **MUST** |
| `POST` | `/api/tickets` | Tiếp nhận phiếu bảo hành mới, tự sinh mã phiếu và hạn SLA | **US1** | **MUST** |
| `PUT` | `/api/tickets/{id}` | Cập nhật nội dung phiếu (mô tả sự cố, mức ưu tiên) | **US6** | **MUST** |
| `POST` | `/api/tickets/{id}/assign` | Phân công kỹ thuật viên cho một phiếu bảo hành (kiểm tra tay nghề, trung tâm, tải) | **US2** | **MUST** |
| `PATCH` | `/api/tickets/{id}/status` | Kỹ thuật viên cập nhật tiến độ và chuyển trạng thái phiếu (tự động append vào `status_history` JSONB) | **US6** | **SHOULD** |
| `POST` | `/api/tickets/{id}/appointment` | Đặt lịch hẹn giao – nhận máy (cập nhật `appointmentAt` + `appointmentStatus`) và kiểm tra xung đột trùng lịch của kỹ thuật viên | **US4** | **SHOULD** |
| `DELETE` | `/api/tickets/{id}` | Hủy phiếu bảo hành (chỉ khi `status = 'MOI'`) | **US1** | **SHOULD** |
| `GET` | `/api/technicians` | Xem danh sách kỹ thuật viên của trung tâm, sắp theo tay nghề giảm dần | **US5** | **SHOULD** |
| `GET` | `/api/technicians/{id}` | Xem hồ sơ một kỹ thuật viên | **US5** | **SHOULD** |
| `GET` | `/api/technicians/candidates-for-ticket/{ticketId}` | Gợi ý các KTV đủ điều kiện nhận phiếu kèm **tải công việc** hiện tại | **US5** | **SHOULD** |
| `POST` | `/api/technicians` | Thêm mới kỹ thuật viên vào trung tâm | **US5** | **SHOULD** |
| `PUT` | `/api/technicians/{id}` | Cập nhật hồ sơ kỹ thuật viên | **US5** | **COULD** |
| `DELETE` | `/api/technicians/{id}` | Vô hiệu hóa kỹ thuật viên (soft delete, QT-13) | **US5** | **COULD** |

**Tổng cộng: 17 endpoint nghiệp vụ** (`/api/**`) **+ 2 endpoint hạ tầng** (`/`, `/health`).

### 2.1. Bảng ánh xạ endpoint cũ (BT1) → endpoint thật (BT3)

Bản BT1 liệt kê 8 endpoint nghiệp vụ, trong đó **5 endpoint không tồn tại** trong mã nguồn.
Bảng dưới đây là ánh xạ giữa đặc tả cũ và hệ thống thật:

| Endpoint trong BT1 | Tình trạng | Endpoint thật trong hệ thống |
| :--- | :---: | :--- |
| `GET /api/tickets/unassigned` | ✅ Tồn tại | `GET /api/tickets/unassigned` — giữ nguyên |
| `POST /api/tickets/{id}/assign` | ✅ Tồn tại | `POST /api/tickets/{id}/assign` — giữ nguyên |
| `GET /api/technicians/me/tickets` | ❌ Không tồn tại | `GET /api/tickets/technician/mine` |
| `PATCH /api/tickets/{id}/appointment` | ❌ Không tồn tại | `POST /api/tickets/{id}/appointment` (đổi cả phương thức) |
| `GET /api/technicians/workload` | ❌ Không tồn tại | Trường `workload` trong `GET /api/technicians/candidates-for-ticket/{ticketId}` |
| `PATCH /api/tickets/{id}/status` | ✅ Tồn tại | `PATCH /api/tickets/{id}/status` — giữ nguyên |
| `GET /api/tickets/{id}/appointments` | ❌ Không tồn tại | Không có endpoint riêng — lịch hẹn nằm trong bản ghi `ticket` (`appointmentAt`, `appointmentStatus`) và được lọc qua `GET /api/tickets/technician/mine` |
| `POST /api/tickets/{id}/reassign` | ❌ Không tồn tại | `POST /api/tickets/{id}/assign` dùng lại (điều chuyển = phân công lại, `note` bắt buộc — QT-07) |
| *(chưa có trong BT1)* | ➕ Bổ sung | `GET /api/tickets`, `GET /api/tickets/{id}`, `POST /api/tickets`, `PUT /api/tickets/{id}`, `DELETE /api/tickets/{id}`, `GET /api/technicians`, `GET /api/technicians/{id}`, `POST /api/technicians`, `PUT /api/technicians/{id}`, `DELETE /api/technicians/{id}` — các endpoint CRUD cần thiết cho các User Story đã cam kết |

> **Lý do chọn phương án "sửa tài liệu cho khớp mã nguồn":** đặc tả phải phản ánh hệ thống
> thực thi để có thể kiểm thử và đóng gói. Việc bổ sung 5 endpoint mới vào mã nguồn ở giai
> đoạn BT3 sẽ làm thay đổi phạm vi đã nộp ở BT1 và làm mất tính truy vết của
> `docs/test-plan.md` / `docs/test-report.md` đã được giảng viên duyệt. Vì vậy tài liệu
> được cập nhật, và toàn bộ thay đổi được ghi vào `docs/thay-doi-thiet-ke.md`.

---

## 3. CHI TIẾT CÁC ENDPOINTS CỐT LÕI (MỨC MUST)

> Phần này mô tả 4 endpoint MUST đại diện theo cùng khuôn khung. **Đặc tả đầy đủ 17 endpoint
> × 7 mục** nằm ở [`docs/api-docs/api-reference.md`](api-docs/api-reference.md).

### 3.1. `GET /api/tickets/unassigned` — Lấy danh sách phiếu chưa phân công (US1)

- **Mục đích:** Quản lý trung tâm xem các phiếu bảo hành ở trạng thái `MOI` thuộc trung tâm mình phụ trách để chuẩn bị phân công. Sắp xếp theo `receivedAt` **tăng dần** (phiếu cũ nhất lên đầu) theo chính sách ưu tiên SLA.
- **Quyền hạn truy cập:** Quản lý trung tâm (`CENTER_MANAGER`).

#### Parameters:
- **Query:**
  - `centerId` (optional, integer): Trung tâm bảo hành. Mặc định = trung tâm của người gọi.

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "success": true,
  "data": [
    {
      "ticketId": 2,
      "ticketCode": "BH-2-00002/2026",
      "customerId": 2,
      "deviceId": 2,
      "centerId": 2,
      "technicianId": null,
      "categoryId": 2,
      "issueDesc": "Pin tụt nhanh từ 100% xuống 20% trong 2 giờ sử dụng, máy nóng ran vùng lưng",
      "priority": "TRUNG_BINH",
      "status": "MOI",
      "receivedAt": "2026-11-11T03:55:20.571Z",
      "dueDate": "2026-11-14T03:55:20.571Z",
      "closedAt": null,
      "statusHistory": [
        { "at": "2026-11-11T13:57:09.072Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu mới" }
      ],
      "appointmentAt": null,
      "appointmentStatus": null,
      "customer": {
        "customerId": 2,
        "fullName": "Trần Văn Nam",
        "phone": "0912345678",
        "email": "nam.tran@yahoo.com",
        "address": "Tân Bình, TP.HCM",
        "segment": "THUONG_XUYEN",
        "createdAt": "2026-11-11T13:55:20.550Z"
      },
      "device": {
        "deviceId": 2,
        "customerId": 2,
        "serialNo": "MK-SS24U-7712",
        "productName": "Samsung Galaxy S24 Ultra",
        "purchaseDate": null,
        "warrantyMonths": 24,
        "createdAt": "2026-11-11T13:55:20.563Z"
      },
      "category": { "categoryId": 2, "categoryName": "PIN", "defaultPriority": "TRUNG_BINH", "isActive": true }
    }
  ],
  "total": 2
}
```

#### Phản hồi lỗi:
- **`HTTP 401 Unauthorized`** (`XAC_THUC_KHONG_HOP_LE`): Chưa truyền token hoặc token không hợp lệ.
  ```json
  {
    "success": false,
    "error": "XAC_THUC_KHONG_HOP_LE",
    "message": "Yêu cầu đăng nhập trước khi thực hiện",
    "chiTiet": null
  }
  ```
- **`HTTP 403 Forbidden`** (`KHONG_CO_QUYEN`): Người dùng không có vai trò Quản lý trung tâm (QT-14).
  ```json
  {
    "success": false,
    "error": "KHONG_CO_QUYEN",
    "message": "Bạn không có quyền xem danh sách phiếu chờ phân công của trung tâm",
    "chiTiet": null
  }
  ```

---

### 3.2. `POST /api/tickets/{id}/assign` — Phân công kỹ thuật viên cho phiếu (US2)

- **Mục đích:** Gán một kỹ thuật viên cụ thể chịu trách nhiệm xử lý phiếu bảo hành thỏa mãn điều kiện tay nghề (QT-08), cùng trung tâm (QT-08) và không quá tải (QT-11). Thao tác chạy trong **transaction** với khoá dòng `SELECT … FOR UPDATE` (NFR3).
- **Quyền hạn truy cập:** Quản lý trung tâm (`CENTER_MANAGER`).

#### Parameters:
- **Path:**
  - `id` (required, integer): Mã ID của phiếu bảo hành (`ticketId`).

#### Request Body:
```json
{
  "technicianId": 3,
  "note": "Phân công KTV chuyên màn hình xử lý gấp trong ca sáng"
}
```

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "success": true,
  "message": "Phân công kỹ thuật viên thành công",
  "data": {
    "ticketId": 1,
    "ticketCode": "BH-2-00001/2026",
    "customerId": 1,
    "deviceId": 1,
    "centerId": 2,
    "technicianId": 3,
    "categoryId": 1,
    "issueDesc": "Màn hình bị sọc xanh dọc thân máy sau khi va chạm nhẹ, cảm ứng góc phải bị liệt",
    "priority": "CAO",
    "status": "DA_PHAN_CONG",
    "receivedAt": "2026-11-11T11:55:20.571Z",
    "dueDate": "2026-11-12T11:55:20.571Z",
    "closedAt": null,
    "statusHistory": [
      { "at": "2026-11-11T11:57:09.072Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu mới" },
      { "at": "2026-11-11T14:22:49.228Z", "by": 1, "to": "DA_PHAN_CONG", "from": "MOI", "note": "Phan cong KTV chuyen man hinh xu ly gap trong ca sang" }
    ],
    "appointmentAt": null,
    "appointmentStatus": null,
    "customer": { "customerId": 1, "fullName": "Nguyễn Thị Mai", "phone": "0901234567", "email": "mai.nguyen@gmail.com", "address": "Quận 10, TP.HCM", "segment": "VIP", "createdAt": "2026-11-11T13:55:20.546Z" },
    "device": { "deviceId": 1, "customerId": 1, "serialNo": "MK-IP15P-9921", "productName": "iPhone 15 Pro Max 256GB", "purchaseDate": null, "warrantyMonths": 12, "createdAt": "2026-11-11T13:55:20.559Z" },
    "category": { "categoryId": 1, "categoryName": "MAN_HINH", "defaultPriority": "CAO", "isActive": true },
    "technician": { "technicianId": 3, "employeeId": "NV-KTV-003", "fullName": "Nguyễn Văn A", "centerId": 2, "level": "CAO_CAP", "proficiency": 5, "isActive": true, "createdAt": "2026-11-11T13:55:20.526Z" }
  }
}
```

#### Phản hồi lỗi:
- **`HTTP 400 Bad Request`** (`DU_LIEU_KHONG_HOP_LE`): Thiếu trường bắt buộc hoặc sai kiểu dữ liệu.
- **`HTTP 401 Unauthorized`** (`XAC_THUC_KHONG_HOP_LE`): Chưa xác thực.
- **`HTTP 404 Not Found`** (`PHIEU_KHONG_TON_TAI` / `KTV_KHONG_TON_TAI`): Không tìm thấy phiếu hoặc kỹ thuật viên.
- **`HTTP 422 Unprocessable Entity`** (`KTV_KHONG_DU_TAY_NGHE`): Kỹ thuật viên không đạt yêu cầu tay nghề bậc 3 trở lên (QT-08).
  ```json
  {
    "success": false,
    "error": "KTV_KHONG_DU_TAY_NGHE",
    "message": "Kỹ thuật viên không đủ điều kiện chuyên môn (yêu cầu điểm tay nghề proficiency tối thiểu từ 3 trở lên, hiện tại: 2).",
    "chiTiet": null
  }
  ```
- **`HTTP 422 Unprocessable Entity`** (`KTV_KHONG_CUNG_TRUNG_TAM`): Kỹ thuật viên khác trung tâm (QT-08).
  ```json
  {
    "success": false,
    "error": "KTV_KHONG_CUNG_TRUNG_TAM",
    "message": "Không thể phân công kỹ thuật viên (Trung tâm 4) không thuộc trung tâm tiếp nhận phiếu (Trung tâm 2).",
    "chiTiet": null
  }
  ```
- **`HTTP 422 Unprocessable Entity`** (`KTV_QUA_TAI`): KTV đang giữ từ 8 phiếu mở trở lên (QT-11).

> **Ghi chú về điều chuyển (QT-07):** điều chuyển sang KTV khác **dùng chung** endpoint này.
> Trường `note` là bắt buộc và mỗi lần phân công đều ghi thêm một phần tử vào
> `status_history` (với `from` = trạng thái hiện tại).

---

### 3.3. `GET /api/tickets/technician/mine` — Kỹ thuật viên xem danh sách phiếu được gán (US3)

- **Mục đích:** Kỹ thuật viên tra cứu công việc cá nhân được phân bổ; hệ thống tự động sắp xếp theo thời hạn SLA `dueDate` **tăng dần** để ưu tiên việc khẩn cấp; tự động che số điện thoại khách hàng (QT-15).
- **Quyền hạn truy cập:** Kỹ thuật viên (`TECHNICIAN`).

#### Parameters:
- **Query:**
  - `technicianId` (optional, integer): **Bị bỏ qua** — phạm vi luôn là kỹ thuật viên đang đăng nhập (QT-14). Nếu client cố truyền `technicianId` của người khác, API trả HTTP 403.

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "success": true,
  "data": [
    {
      "ticketId": 3,
      "ticketCode": "BH-2-00003/2026",
      "customerId": 3,
      "deviceId": 3,
      "centerId": 2,
      "technicianId": 3,
      "categoryId": 3,
      "issueDesc": "Cắm sạc không nhận tín hiệu, chập chờn khi cắm cáp Type-C zin theo máy",
      "priority": "TRUNG_BINH",
      "status": "DA_PHAN_CONG",
      "receivedAt": "2026-11-10T17:55:20.571Z",
      "dueDate": "2026-11-13T17:55:20.571Z",
      "closedAt": null,
      "statusHistory": [
        { "at": "2026-11-10T17:57:09.072Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu" },
        { "at": "2026-11-10T19:57:09.072Z", "by": 1, "to": "DA_PHAN_CONG", "from": "MOI", "note": "Phân công kỹ thuật viên Nguyễn Văn A" }
      ],
      "appointmentAt": "2026-11-11T17:57:09.072Z",
      "appointmentStatus": "SCHEDULED",
      "customer": { "customerId": 3, "fullName": "Lê Thị Thu", "phone": "093****789", "email": "thu.le@gmail.com", "address": "Thủ Đức, TP.HCM", "segment": "MOI", "createdAt": "2026-11-11T13:55:20.553Z" },
      "device": { "deviceId": 3, "customerId": 3, "serialNo": "MK-XIA14-3341", "productName": "Xiaomi 14 Ultra", "purchaseDate": null, "warrantyMonths": 18, "createdAt": "2026-11-11T13:55:20.566Z" },
      "category": { "categoryId": 3, "categoryName": "SAC", "defaultPriority": "TRUNG_BINH", "isActive": true }
    }
  ],
  "total": 1
}
```

#### Phản hồi lỗi:
- **`HTTP 401 Unauthorized`** (`XAC_THUC_KHONG_HOP_LE`): Chưa xác thực thông tin đăng nhập.
- **`HTTP 403 Forbidden`** (`KHONG_CO_QUYEN`): Tài khoản gọi API cố xem phiếu của kỹ thuật viên khác.
  ```json
  {
    "success": false,
    "error": "KHONG_CO_QUYEN",
    "message": "Bạn không có quyền xem phiếu bảo hành của kỹ thuật viên khác",
    "chiTiet": null
  }
  ```

---

### 3.4. `POST /api/tickets` — Tiếp nhận phiếu bảo hành mới (US1)

- **Mục đích:** Tiếp nhận phiếu bảo hành tại trung tâm. Mã phiếu do **máy chủ** sinh tự động theo dạng `BH-{centerId}-{sequence}/{year}`; hạn SLA (`dueDate`) được tính tự động từ mức ưu tiên theo QT-04 (chỉ tính ngày làm việc).
- **Quyền hạn truy cập:** Quản lý trung tâm (`CENTER_MANAGER`).

#### Request Body:
```json
{
  "customerId": 3,
  "deviceId": 3,
  "centerId": 2,
  "categoryId": 5,
  "issueDesc": "Máy bị vào nước, không lên màn hình sau khi lau",
  "priority": "CAO"
}
```

#### Phản hồi thành công: `HTTP 201 Created`
```json
{
  "success": true,
  "message": "Tiếp nhận phiếu bảo hành mới thành công",
  "data": {
    "ticketId": 5,
    "ticketCode": "BH-2-00005/2026",
    "customerId": 3,
    "deviceId": 3,
    "centerId": 2,
    "technicianId": null,
    "categoryId": 5,
    "issueDesc": "May bi vao nuoc, khong len man hinh sau khi lau",
    "priority": "CAO",
    "status": "MOI",
    "receivedAt": "2026-11-11T14:38:10.460Z",
    "dueDate": "2026-11-12T14:38:10.415Z",
    "closedAt": null,
    "statusHistory": [
      { "at": "2026-11-11T14:38:10.460Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu mới tại trung tâm" }
    ],
    "appointmentAt": null,
    "appointmentStatus": null,
    "customer": { "customerId": 3, "fullName": "Lê Thị Thu", "phone": "093****789", "email": "thu.le@gmail.com", "address": "Thủ Đức, TP.HCM", "segment": "MOI", "createdAt": "2026-11-11T13:55:20.553Z" },
    "device": { "deviceId": 3, "customerId": 3, "serialNo": "MK-XIA14-3341", "productName": "Xiaomi 14 Ultra", "purchaseDate": null, "warrantyMonths": 18, "createdAt": "2026-11-11T13:55:20.566Z" },
    "category": { "categoryId": 5, "categoryName": "PIN", "defaultPriority": "CAO", "isActive": true }
  }
}
```

#### Phản hồi lỗi:
- **`HTTP 400 Bad Request`** (`DU_LIEU_KHONG_HOP_LE`): Dữ liệu không hợp lệ — kèm chi tiết theo từng trường.
  ```json
  {
    "success": false,
    "error": "DU_LIEU_KHONG_HOP_LE",
    "message": "Dữ liệu đầu vào tiếp nhận phiếu không hợp lệ",
    "chiTiet": [
      { "field": "customerId", "reason": "Mã khách hàng phải là số nguyên dương" },
      { "field": "deviceId", "reason": "Mã thiết bị phải là số nguyên dương" },
      { "field": "centerId", "reason": "Mã trung tâm phải là số nguyên dương" },
      { "field": "issueDesc", "reason": "Mô tả sự cố phải từ 10 ký tự trở lên" },
      { "field": "priority", "reason": "Mức ưu tiên phải là CAO, TRUNG_BINH hoặc THAP" }
    ]
  }
  ```

---

## 4. CHI TIẾT CÁC ENDPOINTS MỞ RỘNG (MỨC SHOULD & COULD)

### 4.1. `POST /api/tickets/{id}/appointment` — Đặt lịch hẹn và kiểm tra trùng lịch (US4 – SHOULD)

> **Lưu ý BT1 → BT3:** BT1 mô tả `PATCH /api/tickets/{id}/appointment`; hệ thống thật dùng
> **`POST`** vì thao tác này tạo ra một lịch hẹn (một tài nguyên con), không phải sửa một
> trường. Lịch hẹn được gộp vào cột `appointmentAt` + `appointmentStatus` của bảng
> `ticket` (1 lịch hẹn / 1 phiếu).

#### Request Body:
```json
{
  "appointmentAt": "2026-11-20T10:00:00+07:00",
  "appointmentStatus": "SCHEDULED"
}
```

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "success": true,
  "message": "Đặt lịch hẹn giao nhận máy thành công",
  "data": {
    "ticketId": 1,
    "ticketCode": "BH-2-00001/2026",
    "appointmentAt": "2026-11-20T03:00:00.000Z",
    "appointmentStatus": "SCHEDULED"
  }
}
```

#### Phản hồi lỗi xung đột lịch hẹn: `HTTP 409 Conflict` (`LICH_HEN_XUNG_DOT`)
```json
{
  "success": false,
  "error": "LICH_HEN_XUNG_DOT",
  "message": "Kỹ thuật viên đã có lịch hẹn khác (phiếu BH-2-00001/2026) trong khung giờ này. Vui lòng chọn thời gian khác.",
  "chiTiet": null
}
```

#### Phản hồi lỗi khác:
- **`HTTP 400`** (`DU_LIEU_KHONG_HOP_LE`): `appointmentAt` không phải ngày giờ ISO hợp lệ.
- **`HTTP 403`** (`KHONG_CO_QUYEN`): KTV đặt lịch hẹn cho phiếu của KTV khác (QT-14).
- **`HTTP 422`** (`TRANG_THAI_KHONG_HOP_LE`): Phiếu chưa được phân công KTV nên chưa thể đặt lịch.

---

### 4.2. `GET /api/technicians/candidates-for-ticket/{ticketId}` — Gợi ý KTV kèm tải công việc (US5 – SHOULD)

> **Lưu ý BT1 → BT3:** BT1 mô tả `GET /api/technicians/workload`; hệ thống thật **không có**
> endpoint này. Thông tin tải công việc được cung cấp **kèm theo danh sách ứng viên** để
> phục vụ đúng nghiệp vụ gợi ý phân công, tránh phải gọi 2 lần.

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "success": true,
  "data": {
    "ticket": {
      "ticketId": 1,
      "ticketCode": "BH-2-00001/2026",
      "centerId": 2,
      "issueDesc": "Màn hình bị sọc xanh dọc thân máy sau khi va chạm nhẹ, cảm ứng góc phải bị liệt",
      "priority": "CAO",
      "status": "MOI"
    },
    "candidates": [
      {
        "technicianId": 5,
        "employeeId": "NV-KTV-005",
        "fullName": "Đỗ Hữu Thắng",
        "centerId": 2,
        "level": "TRUNG_CAP",
        "proficiency": 3,
        "isActive": true,
        "serviceCenter": { "centerId": 2, "centerName": "TTBH Mekong Tân Bình", "phone": "028****233", "city": "TP.HCM", "isActive": true },
        "workload": 0
      },
      {
        "technicianId": 3,
        "employeeId": "NV-KTV-003",
        "fullName": "Nguyễn Văn A",
        "centerId": 2,
        "level": "CAO_CAP",
        "proficiency": 5,
        "isActive": true,
        "serviceCenter": { "centerId": 2, "centerName": "TTBH Mekong Tân Bình", "phone": "028****233", "city": "TP.HCM", "isActive": true },
        "workload": 1
      }
    ]
  }
}
```

> `workload` = số phiếu đang mở của KTV (trạng thái `DA_PHAN_CONG`, `DANG_XU_LY`,
> `CHO_LINH_KIEN`). Ứng viên được sắp theo `workload` **tăng dần** — cân bằng tải (QT-11).

---

### 4.3. `PATCH /api/tickets/{id}/status` — Cập nhật trạng thái phiếu (US6 – SHOULD)

#### Request Body:
```json
{
  "status": "DANG_XU_LY",
  "note": "Bắt đầu tháo máy kiểm tra bo mạch và cáp màn hình"
}
```

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "success": true,
  "message": "Chuyển trạng thái phiếu sang 'DANG_XU_LY' thành công",
  "data": {
    "ticketId": 1,
    "ticketCode": "BH-2-00001/2026",
    "status": "DANG_XU_LY",
    "statusHistory": [
      { "at": "2026-11-11T11:57:09.072Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu mới" },
      { "at": "2026-11-11T14:22:49.228Z", "by": 1, "to": "DA_PHAN_CONG", "from": "MOI", "note": "Phan cong KTV" },
      { "at": "2026-11-11T15:10:11.402Z", "by": 3, "to": "DANG_XU_LY", "from": "DA_PHAN_CONG", "note": "Bat dau thao may kiem tra bo mach" }
    ]
  }
}
```

#### Phản hồi lỗi:
- **`HTTP 400`** (`DU_LIEU_KHONG_HOP_LE`): `status` không thuộc tập 7 trạng thái hợp lệ.
- **`HTTP 403`** (`KHONG_CO_QUYEN`): KTV thao tác trên phiếu của KTV khác (QT-14).
- **`HTTP 409`** (`TRANG_THAI_KHONG_HOP_LE`): Chuyển trạng thái trái quy tắc vòng đời QT-06.
  ```json
  {
    "success": false,
    "error": "TRANG_THAI_KHONG_HOP_LE",
    "message": "Không thể chuyển trạng thái từ 'DA_PHAN_CONG' sang 'MOI' theo quy tắc vòng đời không đảo ngược (QT-06).",
    "chiTiet": null
  }
  ```

---

## 5. BẢNG QUY TẮC VALIDATION DỮ LIỆU TỪNG TRƯỜNG (VALIDATION RULES)

> Tên trường ở đây là tên **ở tầng API** (`camelCase`), khớp với Request Body thật.

| Tên trường dữ liệu | Bắt buộc | Kiểu dữ liệu | Ràng buộc nghiệp vụ / Độ dài / Dải giá trị | Thông báo lỗi khi vi phạm |
| :--- | :---: | :---: | :--- | :--- |
| `id` (path, phiếu) | **Có** | Integer | Số nguyên dương > 0, phải tồn tại trong bảng `ticket` | `PHIEU_KHONG_TON_TAI` — "Không tìm thấy phiếu bảo hành ID {id}" |
| `id` (path, KTV) | **Có** | Integer | Số nguyên dương > 0, phải tồn tại trong bảng `technician` | `KTV_KHONG_TON_TAI` — "Không tìm thấy kỹ thuật viên ID {id}" |
| `technicianId` | **Có** *(khi phân công)* | Integer | Số nguyên dương > 0, phải tồn tại và `isActive = true` | `KTV_KHONG_TON_TAI` |
| `technicianId` | **Có** *(khi tạo KTV)* | Integer | Số nguyên dương > 0, `centerId` phải tồn tại | `TRUNG_TAM_KHONG_TON_TAI` |
| `note` | **Có** *(khi phân công/điều chuyển)* | String | Bắt buộc khi phân công (QT-07) | `THIEU_TRUONG_BAT_BUOC` |
| `note` | Không *(khi đổi trạng thái)* | String | Tự do | — |
| `customerId` | **Có** *(khi tạo phiếu)* | Integer | Số nguyên dương > 0 | "Mã khách hàng phải là số nguyên dương" |
| `deviceId` | **Có** *(khi tạo phiếu)* | Integer | Số nguyên dương > 0 | "Mã thiết bị phải là số nguyên dương" |
| `centerId` | **Có** *(khi tạo phiếu)* | Integer | Số nguyên dương > 0 | "Mã trung tâm phải là số nguyên dương" |
| `issueDesc` | **Có** *(khi tạo phiếu)* | String | **Từ 10 ký tự trở lên** | "Mô tả sự cố phải từ 10 ký tự trở lên" |
| `issueDesc` | Không *(khi sửa phiếu)* | String | **Từ 10 ký tự trở lên** | "Mô tả sự cố phải có độ dài tối thiểu từ 10 ký tự" |
| `priority` | **Có** *(khi tạo phiếu)* | String | Enum `CAO`, `TRUNG_BINH`, `THAP` | "Mức ưu tiên phải là CAO, TRUNG_BINH hoặc THAP" |
| `status` | **Có** *(khi đổi trạng thái)* | String | Enum 7 trạng thái + tuân thủ bước chuyển QT-06 | "Trạng thái mới không hợp lệ. Phải thuộc: MOI, DA_PHAN_CONG, DANG_XU_LY, CHO_LINH_KIEN, HOAN_TAT, DA_DONG, DA_HUY" |
| `appointmentAt` | **Có** *(khi đặt lịch)* | ISO 8601 | Ngày giờ ISO hợp lệ | "Thời gian hẹn phải là định dạng ngày giờ ISO hợp lệ" |
| `appointmentStatus` | Không | String | Enum `SCHEDULED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`; mặc định `SCHEDULED` | — |
| `proficiency` | **Có** *(khi tạo/sửa KTV)* | Integer | Số nguyên **từ 1 đến 5** | "Điểm tay nghề (proficiency) phải là số nguyên từ 1 đến 5" |
| `level` | **Có** *(khi tạo KTV)* | String | Enum `SO_CAP`, `TRUNG_CAP`, `CAO_CAP` | — |
| `employeeId` | **Có** *(khi tạo KTV)* | String | Mã nhân viên, duy nhất toàn hệ thống | — |
| `fullName` | **Có** *(khi tạo KTV)* | String | Không rỗng | — |

---

## 6. BẢNG TỰ KIỂM HỢP ĐỒNG API TRƯỚC KHI NỘP BÀI

- [x] Mỗi endpoint đều được truy vết trực tiếp về ít nhất một User Story trong bảng truy vết ở Mục 6 của SRS.
- [x] Mọi endpoint đều có đủ ít nhất một phản hồi thành công (200/201) và các phản hồi lỗi tương ứng (400, 401, 403, 404, 409, 422).
- [x] Tất cả tên trường trong request/response JSON đều khớp 100 % với mã nguồn thật (`camelCase`) — đã đối chiếu bằng **ví dụ thật chép từ lần chạy hệ thống** trong `docs/api-docs/api-reference.md`.
- [x] Đã thể hiện đầy đủ các quy tắc nghiệp vụ trọng yếu (QT-04, QT-06, QT-07, QT-08, QT-11, QT-13, QT-14, QT-15) trong logic mã lỗi và bảng validation.
- [x] Đã đối chiếu danh sách endpoint với mã nguồn và với kết quả **gọi thật từng endpoint** trên container đang chạy — không còn endpoint "ma" nào.
- [x] Mã lỗi nghiệp vụ và HTTP status khớp 100 % với `HTTP_CODE_MAP` trong `src/middlewares/errorHandler.middleware.js`.
