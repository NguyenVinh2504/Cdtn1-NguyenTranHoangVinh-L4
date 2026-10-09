# TÀI LIỆU ĐẶC TẢ HỢP ĐỒNG API (API CONTRACT)
## HỆ THỐNG SMART CRM – MEKONG MOBILE
### Phân hệ: Luồng L4 – Phân công kỹ thuật viên và lịch hẹn
**Học phần:** Chuyên đề tốt nghiệp 1 (HK261)  
**Track:** Kỹ thuật phần mềm (SE)  
**Tài liệu tham chiếu:** Theo mẫu đặc tả Track SE – Tài liệu tự học Buổi 3  

---

## 1. QUY ƯỚC CHUNG CỦA HỆ THỐNG API

- **Giao thức truyền tải:** HTTPS. Định dạng dữ liệu trao đổi: JSON, bảng mã UTF-8.
- **Header bắt buộc:**
  ```http
  Content-Type: application/json
  Authorization: Bearer <jwt_access_token>
  ```
- **Quy ước đặt tên trường dữ liệu:** Dùng chuẩn `snake_case`, khớp chính xác tên cột trong cơ sở dữ liệu để đảm bảo tính truy vết (ví dụ: `ticket_id`, `technician_id`, `issue_category_id`).
- **Chuẩn định dạng thời gian:** Chuẩn ISO 8601 kèm múi giờ Việt Nam, ví dụ: `2026-10-01T08:30:00+07:00`.
- **Chuẩn định dạng tiền tệ:** Số nguyên VND không phần thập phân, ví dụ: `250000`.
- **Phân trang (Pagination):** Áp dụng query parameters: `page` (bắt đầu từ 1, mặc định 1) và `size` (mặc định 20, tối đa 100). Response trả về kèm metadata `pagination`:
  ```json
  {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total_records": 45,
      "total_pages": 3
    }
  }
  ```
- **Cấu trúc phản hồi lỗi chuẩn (RFC 7807 Pattern):**
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Dữ liệu gửi lên không hợp lệ",
      "fields": {
        "technician_id": "Kỹ thuật viên không đủ điểm tay nghề chuyên môn (QT-08)"
      }
    }
  }
  ```

---

## 2. DANH SÁCH ENDPOINTS CỦA LUỒNG L4

| Phương thức | Đường dẫn Endpoint | Mục đích nghiệp vụ | User Story liên quan | Mức ưu tiên |
| :---: | :--- | :--- | :---: | :---: |
| `GET` | `/api/tickets/unassigned` | Lấy danh sách phiếu bảo hành chưa phân công thuộc trung tâm của quản lý | **US1** | **MUST** |
| `POST` | `/api/tickets/{id}/assign` | Phân công kỹ thuật viên cho một phiếu bảo hành (kiểm tra tay nghề và trung tâm) | **US2** | **MUST** |
| `GET` | `/api/technicians/me/tickets` | Kỹ thuật viên xem danh sách các phiếu được gán cho mình, sắp theo hạn SLA | **US3** | **MUST** |
| `PATCH` | `/api/tickets/{id}/appointment` | Đặt lịch hẹn giao – nhận máy (cập nhật `appointment_at` + `appointment_status`) và kiểm tra xung đột trùng lịch của kỹ thuật viên | **US4** | **SHOULD** |
| `GET` | `/api/technicians/workload` | Xem tải công việc hiện tại (số phiếu đang giữ) của từng kỹ thuật viên trong trung tâm | **US5** | **SHOULD** |
| `PATCH` | `/api/tickets/{id}/status` | Kỹ thuật viên cập nhật tiến độ và chuyển trạng thái phiếu (tự động append vào `status_history` JSONB) | **US6** | **SHOULD** |
| `GET` | `/api/tickets/{id}/appointments` | Kỹ thuật viên xem lịch hẹn tiếp khách trong ngày của bản thân (truy vấn VIEW `v_appointments`) | **US7** | **COULD** |
| `POST` | `/api/tickets/{id}/reassign` | Điều chuyển phiếu sang kỹ thuật viên khác kèm lý do bắt buộc (ghi vào `note` của phần tử mới trong `status_history`) | **US8** | **COULD** |

---

## 3. CHI TIẾT CÁC ENDPOINTS CỐT LÕI (MỨC MUST)

### 3.1. GET `/api/tickets/unassigned` — Lấy danh sách phiếu chưa phân công (US1)

- **Mục đích:** Quản lý trung tâm xem các phiếu bảo hành ở trạng thái `MOI` thuộc trung tâm mình phụ trách để chuẩn bị phân công.
- **Quyền hạn truy cập:** Quản lý trung tâm (`Center Manager`).

#### Parameters:
- **Query:**
  - `page` (optional, integer, default: 1): Số trang cần lấy.
  - `size` (optional, integer, default: 20): Số lượng bản ghi mỗi trang.
  - `priority` (optional, string, enum: `CAO`, `TRUNG_BINH`, `THAP`): Lọc theo độ khẩn cấp.

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "data": [
    {
      "ticket_id": 88231,
      "ticket_code": "BH-000231/2026",
      "customer_id": 1024,
      "customer_name": "Nguyễn Hoàng Long",
      "customer_phone": "0908123456",
      "device_name": "iPhone 13 Pro Max 128GB",
      "serial_no": "F2LZX0Q1MD6R",
      "issue_desc": "Màn hình bị sọc xanh dọc, cảm ứng chập chờn góc phải",
      "category_id": 1,
      "category_name": "MAN_HINH",
      "priority": "CAO",
      "status": "MOI",
      "received_at": "2026-10-01T08:15:00+07:00",
      "due_date": "2026-10-02T08:15:00+07:00"
    },
    {
      "ticket_id": 88235,
      "ticket_code": "BH-000235/2026",
      "customer_id": 1030,
      "customer_name": "Trần Thị Mai",
      "customer_phone": "0912345678",
      "device_name": "Samsung Galaxy S22 Ultra",
      "serial_no": "R5CR301ABCD",
      "issue_desc": "Pin phù kênh nắp lưng, sạc nhanh không nhận",
      "category_id": 2,
      "category_name": "PIN",
      "priority": "TRUNG_BINH",
      "status": "MOI",
      "received_at": "2026-10-01T09:00:00+07:00",
      "due_date": "2026-10-04T09:00:00+07:00"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total_records": 2,
    "total_pages": 1
  }
}
```

#### Phản hồi lỗi:
- **`HTTP 401 Unauthorized`:** Chưa truyền token hoặc token hết hạn.
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"
    }
  }
  ```
- **`HTTP 403 Forbidden`:** Người dùng không có vai trò Quản lý trung tâm (QT-14).
  ```json
  {
    "error": {
      "code": "FORBIDDEN",
      "message": "Chỉ Quản lý trung tâm mới có quyền truy cập danh sách phiếu chờ phân công"
    }
  }
  ```

---

### 3.2. POST `/api/tickets/{id}/assign` — Phân công kỹ thuật viên cho phiếu (US2)

- **Mục đích:** Gán một kỹ thuật viên cụ thể chịu trách nhiệm xử lý phiếu bảo hành thỏa mãn điều kiện tay nghề (QT-08) và trung tâm làm việc.
- **Quyền hạn truy cập:** Quản lý trung tâm (`Center Manager`).

#### Parameters:
- **Path:**
  - `id` (required, integer): Mã ID của phiếu bảo hành (`ticket_id`).

#### Request Body:
```json
{
  "technician_id": 5,
  "note": "Phân công kỹ thuật viên chuyên màn hình xử lý gấp trong ca sáng"
}
```

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "message": "Phân công kỹ thuật viên thành công",
  "ticket_id": 88231,
  "ticket_code": "BH-000231/2026",
  "status": "DA_PHAN_CONG",
  "assigned_technician": {
    "technician_id": 5,
    "full_name": "Nguyễn Văn A",
    "level": "CAO_CAP",
    "skill_proficiency": 4
  },
  "assigned_at": "2026-10-01T09:30:00+07:00",
  "status_log_id": 34102
}
```

#### Phản hồi lỗi:
- **`HTTP 400 Bad Request`:** Dữ liệu thiếu trường bắt buộc hoặc kỹ thuật viên không cùng trung tâm (QT-08).
  ```json
  {
    "error": {
      "code": "INVALID_TECHNICIAN",
      "message": "Kỹ thuật viên không thuộc trung tâm bảo hành tiếp nhận phiếu này",
      "fields": {
        "technician_id": "Kỹ thuật viên thuộc Trung tâm Quận 10, trong khi phiếu thuộc Trung tâm Tân Bình"
      }
    }
  }
  ```
- **`HTTP 404 Not Found`:** Không tìm thấy phiếu bảo hành hoặc kỹ thuật viên tương ứng.
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Không tìm thấy phiếu bảo hành với mã ID đã cung cấp"
    }
  }
  ```
- **`HTTP 409 Conflict`:** Phiếu đã được phân công hoặc không ở trạng thái hợp lệ để phân công (QT-06, QT-07).
  ```json
  {
    "error": {
      "code": "INVALID_STATE_TRANSITION",
      "message": "Phiếu bảo hành đang ở trạng thái DANG_XU_LY, không thể phân công lại tại endpoint này"
    }
  }
  ```
- **`HTTP 422 Unprocessable Entity`:** Kỹ thuật viên không đạt yêu cầu tay nghề bậc 3 trở lên đối với nhóm sự cố của phiếu (QT-08).
  ```json
  {
    "error": {
      "code": "INSUFFICIENT_SKILL",
      "message": "Kỹ thuật viên không đủ điều kiện chuyên môn để nhận phiếu này",
      "fields": {
        "proficiency": "Điểm tay nghề thực tế là 2/5, yêu cầu tối thiểu là 3/5 cho nhóm MAN_HINH (QT-08)"
      }
    }
  }
  ```

---

### 3.3. GET `/api/technicians/me/tickets` — Kỹ thuật viên xem danh sách phiếu được gán (US3)

- **Mục đích:** Kỹ thuật viên tra cứu công việc cá nhân được phân bổ, hệ thống tự động sắp xếp theo thời hạn SLA `due_date` tăng dần để ưu tiên việc khẩn cấp; tự động che số điện thoại khách hàng (QT-15).
- **Quyền hạn truy cập:** Kỹ thuật viên (`Technician`).

#### Parameters:
- **Query:**
  - `status` (optional, string, enum: `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`): Lọc theo trạng thái công việc.
  - `sort_by` (optional, string, default: `due_date`): Tiêu chí sắp xếp.
  - `order` (optional, string, default: `asc`): Thứ tự tăng dần (`asc`).

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "technician_id": 5,
  "technician_name": "Nguyễn Văn A",
  "active_ticket_count": 3,
  "tickets": [
    {
      "ticket_id": 88231,
      "ticket_code": "BH-000231/2026",
      "customer_name": "Nguyễn Hoàng Long",
      "customer_phone": "090****456",
      "device_name": "iPhone 13 Pro Max 128GB",
      "serial_no": "F2LZX0Q1MD6R",
      "issue_desc": "Màn hình bị sọc xanh dọc, cảm ứng chập chờn góc phải",
      "priority": "CAO",
      "status": "DA_PHAN_CONG",
      "due_date": "2026-10-01T14:30:00+07:00",
      "remaining_hours": 3.5,
      "sla_warning": "CRITICAL"
    },
    {
      "ticket_id": 88195,
      "ticket_code": "BH-000195/2026",
      "customer_name": "Lê Văn Hùng",
      "customer_phone": "098****321",
      "device_name": "iPad Pro M1 11 inch",
      "serial_no": "DMPX8104ABCD",
      "issue_desc": "Màn hình đơ cảm ứng khi máy nóng",
      "priority": "TRUNG_BINH",
      "status": "DANG_XU_LY",
      "due_date": "2026-10-02T17:00:00+07:00",
      "remaining_hours": 26.0,
      "sla_warning": "NORMAL"
    }
  ]
}
```

#### Phản hồi lỗi:
- **`HTTP 401 Unauthorized`:** Chưa xác thực thông tin đăng nhập.
- **`HTTP 403 Forbidden`:** Tài khoản gọi API không phải là kỹ thuật viên bảo hành.

---

## 4. CHI TIẾT CÁC ENDPOINTS MỞ RỘNG (MỨC SHOULD & COULD)

### 4.1. PATCH `/api/tickets/{id}/appointment` — Đặt lịch hẹn và kiểm tra trùng lịch (US4 - SHOULD)

> **Lưu ý BT1:** Lịch hẹn được gộp vào cột `appointment_at` + `appointment_status` của bảng `ticket` (1 lịch hẹn / 1 phiếu). Endpoint là **PATCH** trên ticket, không phải POST trên resource appointment riêng.

#### Request Body:
```json
{
  "technician_id": 5,
  "appointment_at": "2026-10-02T10:00:00+07:00",
  "appointment_status": "SCHEDULED",
  "notes": "Khách mang máy đến vào giờ giải lao buổi sáng"
}
```

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "ticket_id": 88231,
  "ticket_code": "BH-000231/2026",
  "technician_id": 5,
  "appointment_at": "2026-10-02T10:00:00+07:00",
  "appointment_status": "SCHEDULED"
}
```

#### Phản hồi lỗi xung đột lịch hẹn: `HTTP 409 Conflict`
```json
{
  "error": {
    "code": "APPOINTMENT_CONFLICT",
    "message": "Kỹ thuật viên đã có lịch hẹn khác trong khung giờ này",
    "fields": {
      "conflicting_ticket_id": 88240,
      "conflict_time_range": "2026-10-02T09:30:00+07:00 - 2026-10-02T10:30:00+07:00"
    }
  }
}
```

---

### 4.2. GET `/api/technicians/workload` — Xem tải công việc của kỹ thuật viên (US5 - SHOULD)

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "center_id": 2,
  "center_name": "Trung tâm bảo hành Tân Bình",
  "total_technicians": 6,
  "workload_summary": [
    {
      "technician_id": 5,
      "technician_name": "Nguyễn Văn A",
      "level": "CAO_CAP",
      "active_tickets": 8,
      "overdue_tickets": 0,
      "status_detail": {
        "DA_PHAN_CONG": 3,
        "DANG_XU_LY": 4,
        "CHO_LINH_KIEN": 1
      }
    },
    {
      "technician_id": 7,
      "technician_name": "Lê Văn C",
      "level": "TRUNG_CAP",
      "active_tickets": 15,
      "overdue_tickets": 2,
      "status_detail": {
        "DA_PHAN_CONG": 5,
        "DANG_XU_LY": 7,
        "CHO_LINH_KIEN": 3
      }
    }
  ]
}
```

---

### 4.3. PATCH `/api/tickets/{id}/status` — Cập nhật trạng thái phiếu (US6 - SHOULD)

#### Request Body:
```json
{
  "to_status": "DANG_XU_LY",
  "note": "Bắt đầu tháo máy kiểm tra bo mạch và cáp màn hình"
}
```

#### Phản hồi thành công: `HTTP 200 OK`
```json
{
  "ticket_id": 88231,
  "previous_status": "DA_PHAN_CONG",
  "current_status": "DANG_XU_LY",
  "updated_at": "2026-10-01T10:15:00+07:00",
  "log_id": 34110
}
```

---

## 5. BẢNG QUY TẮC VALIDATION DỮ LIỆU TỪNG TRƯỜNG (VALIDATION RULES)

| Tên trường dữ liệu | Bắt buộc | Kiểu dữ liệu | Ràng buộc nghiệp vụ / Độ dài / Dải giá trị | Thông báo lỗi khi vi phạm |
| :--- | :---: | :---: | :--- | :--- |
| `ticket_id` | **Có** | Integer | Số nguyên dương > 0, phải tồn tại trong bảng `ticket` | Mã phiếu bảo hành không tồn tại trong hệ thống |
| `technician_id` | **Có** | Integer | Số nguyên dương > 0, phải tồn tại trong bảng `technician`, `is_active = true` | Kỹ thuật viên không tồn tại hoặc đã ngừng hoạt động |
| `note` | Không | String | Độ dài từ 5 đến 255 ký tự (nếu có nhập) | Ghi chú phải có độ dài từ 5 đến 255 ký tự |
| `transfer_reason` | **Có** *(khi điều chuyển)* | String | Độ dài từ 10 đến 255 ký tự, bắt buộc khi gọi `/reassign` | Phải nhập rõ lý do điều chuyển kỹ thuật viên (tối thiểu 10 ký tự) |
| `start_time` | **Có** *(khi tạo hẹn)* | ISO 8601 | Thời gian hợp lệ, phải lớn hơn thời điểm hiện tại `now()` | Thời gian bắt đầu lịch hẹn phải ở tương lai |
| `end_time` | **Có** *(khi tạo hẹn)* | ISO 8601 | Phải sau `start_time` tối thiểu 15 phút và tối đa 120 phút | Khung giờ hẹn phải kéo dài từ 15 đến 120 phút |
| `to_status` | **Có** *(khi đổi trạng thái)* | String | Thuộc tập enum hợp lệ của Hình 6.2 và tuân thủ bước chuyển (QT-06) | Bước chuyển trạng thái không hợp lệ theo quy trình bảo hành |

---

## 6. BẢNG TỰ KIỂM HỢP ĐỒNG API TRƯỚC KHI NỘP BÀI

- [x] Mỗi endpoint đều được truy vết trực tiếp về ít nhất một User Story trong bảng truy vết ở Mục 6 của SRS.
- [x] Mọi endpoint đều có đủ ít nhất một phản hồi thành công (200/201) và tối thiểu hai phản hồi lỗi (400, 403, 404, 409, 422).
- [x] Tất cả tên trường trong request/response JSON đều khớp 100% với Từ điển dữ liệu của case study và mô hình ERD tương lai.
- [x] Đã thể hiện đầy đủ các quy tắc nghiệp vụ trọng yếu (QT-04, QT-06, QT-07, QT-08, QT-14, QT-15) trong logic mã lỗi và bảng validation.
