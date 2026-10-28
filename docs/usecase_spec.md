# ĐẶC TẢ CHI TIẾT USE CASE (USE CASE SPECIFICATION)
## HỆ THỐNG SMART CRM – MEKONG MOBILE
### Luồng L4 – Phân công kỹ thuật viên và lịch hẹn

---

## THÔNG TIN TỔNG QUAN

| Mục | Nội dung |
|------|----------|
| **Hệ thống** | Smart CRM – Mekong Mobile |
| **Luồng nghiệp vụ** | L4: Phân công kỹ thuật viên và lịch hẹn |
| **Phạm vi** | Phân công KTV theo tay nghề, đặt lịch hẹn, theo dõi trạng thái phiếu |
| **Chuẩn tham chiếu** | Rút gọn theo tinh thần ISO/IEC/IEEE 29148:2018 |

---

## BẢNG TRUY VẾT USE CASE

| UC | Tên Use Case | Actor chính | FR | US | MoSCoW |
|----|--------------|-------------|----|----|--------|
| **UC1** | Xem danh sách phiếu chờ phân công | Quản lý trung tâm | FR1 | US1 | **MUST** |
| **UC2** | Phân công kỹ thuật viên cho phiếu bảo hành | Quản lý trung tâm | FR2 | US2 | **MUST** |
| **UC3** | Xem danh sách phiếu được gán theo hạn SLA | Kỹ thuật viên | FR3 | US3 | **MUST** |
| **UC4** | Đặt lịch hẹn giao - nhận máy | Quản lý trung tâm | FR4 | US4 | **SHOULD** |
| **UC5** | Giám sát tải công việc kỹ thuật viên | Quản lý trung tâm | FR5 | US5 | **SHOULD** |
| **UC6** | Cập nhật tiến độ và trạng thái phiếu | Kỹ thuật viên | FR6 | US6 | **SHOULD** |
| **UC7** | Điều chuyển phiếu sang kỹ thuật viên khác | Quản lý trung tâm | FR7 | US2 | **COULD** |
| **UC8** | Xem lịch hẹn cá nhân trong ngày | Kỹ thuật viên | FR8 | US7 | **COULD** |
| **UC9** | Kiểm tra xung đột trùng lịch hẹn | *(System)* | FR4 | US4 | **<<include>>** |

---

## UC1 – XEM DANH SÁCH PHIẾU CHỜ PHÂN CÔNG

### Thông tin cơ bản

| Mục | Nội dung |
|------|----------|
| **Mã UC** | UC1 |
| **Tên** | Xem danh sách phiếu chờ phân công |
| **Actor chính** | Quản lý trung tâm (`Center Manager`) |
| **Actor liên quan** | - |
| **Mục tiêu** | Cho phép Quản lý trung tâm xem và lọc các phiếu bảo hành có trạng thái `MOI` thuộc trung tâm mình phụ trách |
| **Điều kiện trước** | Quản lý trung tâm đã đăng nhập thành công vào hệ thống |
| **Điều kiện sau** | Hệ thống hiển thị danh sách phiếu `status = 'MOI'` thuộc trung tâm của QLTT |
| **Liên quan** | `US1` | **Mức ưu tiên** | **MUST** |

### Luồng chính

1. Quản lý trung tâm truy cập màn hình "Phiếu bảo hành chờ phân công".
2. Hệ thống truy vấn và hiển thị danh sách các phiếu thỏa điều kiện:
   - `status = 'MOI'`
   - `center_id = ID_trung_tam_cua_QLTT`
3. Mỗi dòng hiển thị: `ticket_code`, tên thiết bị, nhóm sự cố, mức ưu tiên, hạn SLA, số điện thoại khách hàng (**đầy đủ** vì QLTT được xem đầy đủ - QT-15).
4. Danh sách được sắp xếp theo `received_at` tăng dần (phiếu cũ nhất lên đầu).

### Luồng ngoại lệ

- **2a. Không có phiếu nào ở trạng thái `MOI`:**
  → Hệ thống hiển thị thông báo: *"Hiện không có phiếu bảo hành nào cần phân công."*

---

## UC2 – PHÂN CÔNG KỸ THUẬT VIÊN CHO PHIẾU BẢO HÀNH ⭐ (TRỌNG TÂM)

### Thông tin cơ bản

| Mục | Nội dung |
|------|----------|
| **Mã UC** | UC2 |
| **Tên** | Phân công kỹ thuật viên cho phiếu bảo hành |
| **Actor chính** | Quản lý trung tâm (`Center Manager`) |
| **Mục tiêu** | Giao phiếu bảo hành cho một kỹ thuật viên có đủ năng lực (proficiency ≥ 3) và cùng trung tâm |
| **Điều kiện trước** | 1. QLTT đã đăng nhập. <br>2. Phiếu đang ở trạng thái `MOI`. |
| **Điều kiện sau** | 1. `technician_id` được gán.<br>2. `status = 'DA_PHAN_CONG'`.<br>3. Mảng `status_history` (JSONB) của phiếu được append bản ghi chuyển trạng thái từ `MOI` sang `DA_PHAN_CONG`. |
| **Liên quan** | `US2` | **Yêu cầu chức năng** | `FR2` | **Mức ưu tiên** | **MUST** |

### Luồng chính

1. Quản lý trung tâm chọn một phiếu bảo hành từ danh sách [gọi UC1].
2. Hệ thống hiển thị danh sách kỹ thuật viên thỏa điều kiện:
   - `is_active = true`
   - `center_id = center_id của phiếu`
   - `proficiency >= 3` (QT-08)
3. Kèm theo `workload` (số phiếu đang xử lý) của từng KTV để QLTT cân nhắc.
4. Quản lý chọn kỹ thuật viên và bấm **"Xác nhận phân công"**.
5. Hệ thống mở **Database Transaction (ACID)** và thực hiện:
   - Cập nhật `technician_id = ID_KTV_chọn`
   - Cập nhật `status = 'DA_PHAN_CONG'`
   - Append bản ghi `{from: 'MOI', to: 'DA_PHAN_CONG', at: now(), by: ID_KTV_chọn}` vào mảng `status_history` (JSONB)
   - Commit transaction
6. Hệ thống hiển thị thông báo thành công và cập nhật danh sách.

### Luồng ngoại lệ

- **2a. Không có KTV nào đủ điều kiện (proficiency ≥ 3):**
  → Hệ thống hiển thị cảnh báo: *"Không có kỹ thuật viên nào tại trung tâm đạt chuẩn tay nghề (proficiency >= 3)."*
  → Đề xuất: chuyển phiếu sang trung tâm khác hoặc phê duyệt đặc cách.

- **3a. Tất cả KTV đủ tay nghề đều quá tải (workload > 20 phiếu):**
  → Hệ thống hiển thị biểu tượng cảnh báo bên cạnh tên KTV.
  → Yêu cầu QLTT xác nhận *"Giao thêm việc dù đang quá tải"* để lưu vết.

- **4a. Phiếu đã bị thay đổi trong lúc thao tác (Race Condition):**
  → Hệ thống kiểm tra `status` trước khi lưu.
  → Nếu `status ≠ 'MOI'`: từ chối, hiển thị *"Phiếu đã được phân công hoặc thay đổi. Vui lòng tải lại."*
  → Rollback transaction.

- **5a. Lỗi kết nối cơ sở dữ liệu:**
  → Hệ thống tự động Rollback.
  → Giữ nguyên dữ liệu đã chọn trên giao diện.
  → Hiển thị: *"Lỗi kết nối. Dữ liệu chưa được lưu, vui lòng thử lại."* (Đạt NFR3)

---

## UC3 – XEM DANH SÁCH PHIẾU ĐƯỢC GÁN THEO HẠN SLA ⭐ (TRỌNG TÂM)

### Thông tin cơ bản

| Mục | Nội dung |
|------|----------|
| **Mã UC** | UC3 |
| **Tên** | Xem danh sách phiếu được gán theo hạn cam kết SLA |
| **Actor chính** | Kỹ thuật viên (`Technician`) |
| **Actor phụ** | Hệ thống nhắc hạn (Timer) |
| **Mục tiêu** | Cung cấp cho KTV danh sách phiếu được gán, sắp xếp ưu tiên theo `due_date`, kèm cảnh báo phiếu sắp quá hạn |
| **Điều kiện trước** | Kỹ thuật viên đã đăng nhập thành công |
| **Điều kiện sau** | Hệ thống hiển thị danh sách phiếu của KTV đang đăng nhập, sắp xếp theo `due_date` tăng dần |
| **Liên quan** | `US3` | **Yêu cầu chức năng** | `FR3` | **Mức ưu tiên** | **MUST** |

### Luồng chính

1. Kỹ thuật viên truy cập mục "Phiếu cần xử lý của tôi".
2. Hệ thống truy vấn danh sách phiếu:
   - `technician_id = ID_KTV_hiện_tại`
   - `status IN ('DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN')`
3. Hệ thống sắp xếp theo `due_date` tăng dần (hạn gần nhất lên đầu).
4. Phiếu có `due_date` còn **dưới 4 giờ** được gắn **nhãn cảnh báo màu đỏ**.
5. Số điện thoại khách hàng hiển thị dạng che: `090****567` (QT-15).
6. Hệ thống cũng nhận trigger từ **Hệ thống nhắc hạn** để cập nhật cảnh báo khi phiếu còn dưới 4h.

### Luồng ngoại lệ

- **2a. KTV không có phiếu nào:**
  → Hiển thị: *"Hiện không có phiếu bảo hành nào được giao cho bạn."*

- **2b. Phiếu được chuyển trạng thái thành `HOAN_TAT` trong lúc xem:**
  → Phiếu tự động chuyển sang tab "Lịch sử công việc hoàn tất."

- **5a. KTV cố truy cập phiếu của người khác (QT-14):**
  → Hệ thống trả về HTTP 403 và thông báo: *"Bạn chỉ được phép xem các phiếu được phân công cho chính mình."*

---

## UC4 – ĐẶT LỊCH HẸN GIAO - NHẬN MÁY

### Thông tin cơ bản

| Mục | Nội dung |
|------|----------|
| **Mã UC** | UC4 |
| **Tên** | Đặt lịch hẹn giao - nhận máy |
| **Actor chính** | Quản lý trung tâm (`Center Manager`) |
| **Mục tiêu** | Tạo lịch hẹn giao nhận máy giữa khách hàng và kỹ thuật viên |
| **Điều kiện trước** | QLTT đã đăng nhập; phiếu đã được phân công KTV |
| **Điều kiện sau** | Lịch hẹn được tạo và không trùng với lịch hẹn hiện có của KTV |
| **Liên quan** | `US4` | **Yêu cầu chức năng** | `FR4` | **Mức ưu tiên** | **SHOULD** |
| **Quan hệ** | `<<include>>` UC9 (Kiểm tra trùng lịch) |

### Luồng chính

1. Quản lý trung tâm chọn chức năng "Đặt lịch hẹn".
2. Quản lý nhập thông tin: mã phiếu, ngày hẹn, khung giờ, kỹ thuật viên.
3. Hệ thống kiểm tra xung đột trùng lịch [gọi UC9 – truy vấn VIEW `v_appointments`].
4. Nếu không trùng: hệ thống cập nhật cột `appointment_at` + `appointment_status = 'SCHEDULED'` của phiếu (gộp từ bảng appointment cũ).
5. Hiển thị thông báo thành công kèm chi tiết lịch hẹn.

### Luồng ngoại lệ

- **3a. Khung giờ bị trùng với lịch hẹn hiện có của KTV:**
  → Hệ thống hiển thị cảnh báo kèm thông tin lịch hẹn bị trùng.
  → Yêu cầu chọn khung giờ khác.
  → Quay lại bước 2.

---

## UC5 – GIÁM SÁT TẢI CÔNG VIỆC KỸ THUẬT VIÊN

### Thông tin cơ bản

| Mục | Nội dung |
|------|----------|
| **Mã UC** | UC5 |
| **Tên** | Giám sát tải công việc kỹ thuật viên |
| **Actor chính** | Quản lý trung tâm (`Center Manager`) |
| **Mục tiêu** | Tổng hợp và hiển thị khối lượng công việc của từng KTV trong trung tâm |
| **Điều kiện trước** | QLTT đã đăng nhập |
| **Điều kiện sau** | Hiển thị số lượng phiếu đang xử lý của mỗi KTV |
| **Liên quan** | `US5` | **Yêu cầu chức năng** | `FR5` | **Mức ưu tiên** | **SHOULD** |

### Luồng chính

1. Quản lý trung tâm truy cập mục "Giám sát tải công việc".
2. Hệ thống truy vấn số phiếu đang xử lý của mỗi KTV trong trung tâm.
3. Hiển thị dạng biểu đồ/danh sách với:
   - Tên KTV
   - Số phiếu đang xử lý (`workload`)
   - Cảnh báo nếu workload > 20

---

## UC6 – CẬP NHẬT TIẾN ĐỘ VÀ TRẠNG THÁI PHIẾU

### Thông tin cơ bản

| Mục | Nội dung |
|------|----------|
| **Mã UC** | UC6 |
| **Tên** | Cập nhật tiến độ và trạng thái phiếu bảo hành |
| **Actor chính** | Kỹ thuật viên (`Technician`) |
| **Mục tiêu** | Cho phép KTV chuyển trạng thái phiếu theo đúng vòng đời quy định (QT-06) |
| **Điều kiện trước** | KTV đã đăng nhập và có phiếu được gán cho mình |
| **Điều kiện sau** | Trạng thái phiếu được cập nhật; phần tử mới được thêm vào mảng `ticket.status_history` (JSONB) |
| **Liên quan** | `US6` | **Yêu cầu chức năng** | `FR6` | **Mức ưu tiên** | **SHOULD** |

### Luồng chính

1. Kỹ thuật viên chọn phiếu từ danh sách [gọi UC3].
2. Hệ thống hiển thị trạng thái hiện tại và các trạng thái có thể chuyển tiếp theo vòng đời (QT-06).
3. KTV chọn trạng thái mới và nhập ghi chú (nếu cần).
4. Hệ thống kiểm tra tính hợp lệ của luồng chuyển trạng thái.
5. Hệ thống cập nhật `status`; trigger database tự động append một phần tử `{from, to, at, by}` vào mảng `ticket.status_history` (JSONB).
6. Hiển thị thông báo thành công.

### Luồng ngoại lệ

- **4a. Chuyển trạng thái không hợp lệ (vi phạm vòng đời QT-06):**
  → Hệ thống từ chối và hiển thị: *"Không thể chuyển từ [trạng thái hiện tại] sang [trạng thái mong muốn]. Vui lòng kiểm tra vòng đời trạng thái."*

---

## UC7 – ĐIỀU CHUYỂN PHIẾU SANG KỸ THUẬT VIÊN KHÁC

### Thông tin cơ bản

| Mục | Nội dung |
|------|----------|
| **Mã UC** | UC7 |
| **Tên** | Điều chuyển phiếu sang kỹ thuật viên khác |
| **Actor chính** | Quản lý trung tâm (`Center Manager`) |
| **Mục tiêu** | Thay đổi KTV xử lý phiếu kèm lý do bắt buộc (QT-07) |
| **Điều kiện trước** | QLTT đã đăng nhập; phiếu đang ở trạng thái `DA_PHAN_CONG` hoặc `DANG_XU_LY` |
| **Điều kiện sau** | `technician_id` được thay đổi; phần tử mới trong `status_history` ghi nhận lý do (`note`) |
| **Liên quan** | `US2` (mở rộng luồng điều chuyển) | **Yêu cầu chức năng** | `FR7` | **Mức ưu tiên** | **COULD** |
| **Quan hệ** | `<<extend>>` UC2 (mở rộng từ phân công) |

### Luồng chính

1. Quản lý trung tâm chọn phiếu cần điều chuyển.
2. Hệ thống hiển thị KTV hiện tại và danh sách KTV khả dụng.
3. Quản lý chọn KTV mới và **bắt buộc nhập lý do điều chuyển**.
4. Hệ thống xác nhận KTV mới đủ điều kiện (QT-08).
5. Hệ thống cập nhật `technician_id`; trigger database tự động append phần tử mới vào `status_history` với `note` chứa lý do điều chuyển.
6. Hiển thị thông báo thành công.

### Luồng ngoại lệ

- **3a. Không nhập lý do điều chuyển:**
  → Hệ thống từ chối lưu, hiển thị: *"Lý do điều chuyển là bắt buộc."*

---

## UC8 – XEM LỊCH HẸN CÁ NHÂN TRONG NGÀY

### Thông tin cơ bản

| Mục | Nội dung |
|------|----------|
| **Mã UC** | UC8 |
| **Tên** | Xem lịch hẹn cá nhân trong ngày |
| **Actor chính** | Kỹ thuật viên (`Technician`) |
| **Mục tiêu** | Cho phép KTV xem các khung giờ hẹn tiếp khách trong ngày |
| **Điều kiện trước** | KTV đã đăng nhập |
| **Điều kiện sau** | Hiển thị danh sách lịch hẹn của KTV trong ngày hiện tại |
| **Liên quan** | `US7` | **Yêu cầu chức năng** | `FR8` | **Mức ưu tiên** | **COULD** |

### Luồng chính

1. Kỹ thuật viên truy cập mục "Lịch hẹn của tôi".
2. Hệ thống hiển thị danh sách lịch hẹn trong ngày.
3. Mỗi lịch hẹn hiển thị: giờ hẹn, mã phiếu, tên khách hàng.

---

## UC9 – KIỂM TRA XUNG ĐỘT TRÙNG LỊCH HẸN

### Thông tin cơ bản

| Mục | Nội dung |
|------|----------|
| **Mã UC** | UC9 |
| **Tên** | Kiểm tra xung đột trùng lịch hẹn |
| **Actor chính** | *(System - được gọi từ UC4)* |
| **Mục tiêu** | Đảm bảo KTV không có lịch hẹn trùng khung giờ |
| **Điều kiện trước** | Có thông tin KTV và khung giờ hẹn mới |
| **Điều kiện sau** | Trả về kết quả: có trùng hay không |
| **Liên quan** | `FR4` | **Mức ưu tiên** | `<<include>>` |

### Luồng chính

1. Hệ thống nhận thông tin: `technician_id`, `appointment_at` (TIMESTAMPTZ).
2. Hệ thống truy vấn VIEW `v_appointments` lọc các phiếu của cùng KTV trong ngày, `appointment_status IN ('SCHEDULED', 'CONFIRMED')`.
3. Kiểm tra xem có lịch hẹn nào trùng khung giờ (overlap ±30 phút cho prototype).
4. Trả về kết quả:
   - **Không trùng:** cho phép cập nhật `appointment_at` cho phiếu.
   - **Có trùng:** trả về thông tin lịch hẹn bị trùng để hiển thị cảnh báo.

---

## BẢNG QUY ĐỊNH VỀ QUAN HỆ INCLUDE/EXTEND

| Quan hệ | Use Case A | Use Case B | Ý nghĩa |
|---------|-----------|-----------|----------|
| `<<include>>` | UC2 (Phân công) | UC1 (Xem ds) | Xem danh sách phiếu là bước đầu tiên trong phân công |
| `<<include>>` | UC4 (Đặt lịch hẹn) | UC9 (Kiểm tra trùng) | Kiểm tra trùng lịch là bắt buộc khi đặt lịch hẹn |
| `<<extend>>` | UC7 (Điều chuyển) | UC2 (Phân công) | Điều chuyển là nhánh mở rộng của phân công khi cần đổi KTV khác |

---

## CHÚ THÍCH VỀ VÒNG ĐỜI TRẠNG THÁI (QT-06)

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   MOI   │────▶│ DA_PHAN_CONG │────▶│ DANG_XU_LY  │────▶│ CHO_LINH_KIEN│────▶│ HOAN_TAT │
└─────────┘     └──────────────┘     └─────────────┘     └──────────────┘     └─────┬─────┘
     │                                    │                                           │
     │                                    │                                           ▼
     ▼                                    ▼                                    ┌───────────┐
┌─────────┐                         ┌─────────┐                                 │  DA_DONG  │
│  DA_HUY │                         │  DA_HUY │                                 └───────────┘
└─────────┘                         └─────────┘

Ràng buộc: Không được chuyển ngược trạng thái. Mọi lần chuyển phải append một phần tử mới vào mảng `ticket.status_history` (JSONB). Truy vấn lịch sử qua VIEW `v_ticket_status_log`.
```

---

## BẢNG QUY TẮC NGHIỆP VỤ ÁP DỤNG

| Mã | Quy tắc | Áp dụng cho |
|----|---------|-------------|
| QT-06 | Vòng đời trạng thái không đảo ngược | UC3, UC6 |
| QT-07 | Một phiếu = một KTV tại một thời điểm | UC2, UC7 |
| QT-08 | KTV đủ tay nghề (proficiency ≥ 3) + cùng trung tâm | UC2, UC7 |
| QT-13 | Không xóa vật lý (soft delete) | Tất cả |
| QT-14 | Phạm vi dữ liệu theo vai trò | UC1, UC3, UC5 |
| QT-15 | Che số điện thoại với KTV | UC3 |

---


