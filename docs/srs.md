# BẢN ĐẶC TẢ YÊU CẦU PHẦN MỀM RÚT GỌN (SRS)
## HỆ THỐNG SMART CRM – MEKONG MOBILE
### Phân hệ: Luồng L4 – Phân công kỹ thuật viên và lịch hẹn
**Học phần:** Chuyên đề tốt nghiệp 1 (HK261)  
**Track:** Kỹ thuật phần mềm (SE)  
**Tiêu chuẩn tham chiếu:** Rút gọn theo tinh thần chuẩn ISO/IEC/IEEE 29148:2018  

---

## 1. GIỚI THIỆU VÀ PHẠM VI HỆ THỐNG

### 1.1. Bối cảnh doanh nghiệp
Công ty Cổ phần Bán lẻ & Dịch vụ Mekong Mobile hiện vận hành 24 cửa hàng bán lẻ và 6 trung tâm bảo hành tại TP. Hồ Chí Minh, Cần Thơ và Hà Nội với quy mô hơn 65.000 khách hàng và 38 kỹ thuật viên bảo hành. Hiện tại, quy trình điều phối kỹ thuật tại các trung tâm còn làm thủ công:
- **Vấn đề V2:** Phiếu bảo hành ghi giấy, không theo dõi được phiếu đang ở bước nào, ai đang xử lý, dẫn đến khoảng 15% phiếu bị quá hạn cam kết (SLA) mà không được cảnh báo.
- **Vấn đề V3:** Phân công kỹ thuật viên làm theo trí nhớ và cảm tính của quản lý trung tâm, gây ra lệch tải nghiêm trọng (kỹ thuật viên nhận tới 40 phiếu/tháng, người khác chỉ 12 phiếu), đồng thời hay xảy ra tình trạng phân công sai tay nghề dẫn đến việc chuyển phiếu qua lại mất thời gian.

### 1.2. Luồng nghiệp vụ lựa chọn & Phát biểu phạm vi bằng một câu
- **Mã luồng nghiệp vụ:** L4
- **Tên luồng:** Phân công kỹ thuật viên và lịch hẹn
- **Phát biểu phạm vi bằng một câu:**  
  > *"Quản lý trung tâm bảo hành phân công kỹ thuật viên cho phiếu bảo hành theo tay nghề và khối lượng công việc hiện tại, đặt lịch hẹn giao – nhận máy với khách, theo dõi trạng thái phiếu đến khi hoàn tất."*

### 1.3. Những điều CHỦ Ý KHÔNG LÀM ở phiên bản này (Mức WON'T - MoSCoW)
Để đảm bảo tính khả thi và tập trung vào chất lượng kỹ thuật của prototype cá nhân (không dàn trải quá sức), hệ thống chủ ý **không** thực hiện các chức năng sau:
1. **Không tự động phân công hoàn toàn bằng AI (Auto-dispatching) mà không có xác nhận của con người:** Quản lý trung tâm là người trực tiếp ra quyết định phân công dựa trên gợi ý năng lực kỹ thuật viên của hệ thống.
2. **Không xây dựng cổng thông tin để khách hàng tự đặt hoặc đổi lịch hẹn trực tuyến:** Việc thỏa thuận lịch hẹn thực hiện qua kênh tiếp nhận trực tiếp hoặc điện thoại viên, sau đó nhân sự ghi nhận vào hệ thống.
3. **Không tích hợp dịch vụ SMS/Zalo Gateway tự động gửi thông báo lịch hẹn ra bên ngoài:** Chưa kết nối bên thứ ba trong phạm vi Bài tập 1 để giảm thiểu phụ thuộc hạ tầng ngoài.

### 1.4. Bảng thuật ngữ nghiệp vụ (Business Glossary)
*Tiêu chí nhất quán thuật ngữ: Toàn bộ tài liệu, sơ đồ và mã nguồn sử dụng thống nhất đúng một tên gọi chuẩn sau:*

| Thuật ngữ tiếng Việt | Thuật ngữ kỹ thuật | Định nghĩa nghiệp vụ chuẩn |
| :--- | :--- | :--- |
| **Phiếu bảo hành** | `ticket` | Một yêu cầu tiếp nhận bảo hành hoặc sửa chữa thiết bị, có mã duy nhất và vòng đời trạng thái. |
| **Trạng thái phiếu** | `ticket_status` | Vị trí hiện tại của phiếu: `MOI` → `DA_PHAN_CONG` → `DANG_XU_LY` → `CHO_LINH_KIEN` → `HOAN_TAT` → `DA_DONG` (hoặc `DA_HUY`). |
| **Hạn cam kết (SLA)** | `due_date` | Thời điểm chậm nhất phải hoàn tất sửa chữa, sinh tự động từ lúc tiếp nhận theo mức ưu tiên (`CAO`: 24h, `TRUNG_BINH`: 72h, `THAP`: 120h). |
| **Nhóm sự cố** | `issue_category` | Phân loại lỗi kỹ thuật của thiết bị: `MAN_HINH`, `PIN`, `SAC`, `PHAN_MEM`, `NUOC_VAO`, `KHAC`. |
| **Mức ưu tiên** | `priority` | Mức độ khẩn của phiếu (`CAO`, `TRUNG_BINH`, `THAP`). Quyết định thời hạn cam kết SLA. |
| **Kỹ thuật viên** | `technician` | Nhân sự kỹ thuật thực hiện sửa chữa, thuộc một trung tâm cụ thể và có danh sách điểm kỹ năng tay nghề tương ứng từng nhóm sự cố. |
| **Bậc tay nghề** | `level` / `proficiency` | Điểm đánh giá mức độ thành thạo tay nghề của kỹ thuật viên từ 1 đến 5 theo từng nhóm sự cố (`proficiency >= 3` mới đủ điều kiện nhận phiếu). |
| **Lịch hẹn** | `appointment` | Khung thời gian hẹn trước giữa khách hàng và kỹ thuật viên tại trung tâm để giao nhận hoặc kiểm tra máy. |
| **Khối lượng công việc** | `workload` | Tổng số lượng phiếu bảo hành chưa hoàn tất (đang ở trạng thái `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`) mà một kỹ thuật viên đang đảm nhiệm. |
| **Trung tâm bảo hành** | `service_center` | Đơn vị cơ sở bảo hành trực thuộc Mekong Mobile mà nhân viên và kỹ thuật viên làm việc. |

---

## 2. CÁC BÊN LIÊN QUAN VÀ VAI TRÒ NGƯỜI DÙNG (STAKEHOLDERS & ACTORS)

| Vai trò / Tác nhân | Mô tả trách nhiệm trong luồng L4 | Quyền hạn được làm | Hành vi KHÔNG được làm |
| :--- | :--- | :--- | :--- |
| **Quản lý trung tâm** (`Center Manager`) | Điều phối tổng thể hoạt động kỹ thuật tại trung tâm bảo hành phụ trách. | - Xem danh sách phiếu chờ phân công trong trung tâm.<br>- Xem báo cáo tải công việc của kỹ thuật viên.<br>- Phân công kỹ thuật viên theo tay nghề.<br>- Điều chuyển phiếu kèm lý do bắt buộc.<br>- Đặt và điều chỉnh lịch hẹn giao nhận.<br>- Xem số điện thoại đầy đủ của khách hàng. | - Không phân công kỹ thuật viên thuộc trung tâm khác.<br>- Không phân công kỹ thuật viên có điểm tay nghề < 3 cho nhóm sự cố của phiếu.<br>- Không tự ý xóa phiếu bảo hành (chỉ soft-delete khi có thẩm quyền). |
| **Kỹ thuật viên** (`Technician`) | Nhân sự chuyên trách sửa chữa và xử lý trực tiếp thiết bị. | - Xem danh sách phiếu được gán cho chính mình, sắp xếp theo hạn cam kết SLA.<br>- Cập nhật trạng thái xử lý phiếu (`DANG_XU_LY`, `CHO_LINH_KIEN`, `HOAN_TAT`).<br>- Xem danh sách lịch hẹn trong ngày của bản thân. | - Không xem hoặc nhận phiếu của kỹ thuật viên khác.<br>- Không xem đầy đủ số điện thoại khách hàng (chỉ thấy che dạng `090****567`).<br>- Không tự ý gán phiếu của mình cho người khác. |
| **Hệ thống nhắc hạn (Thời gian)** (`Timer System`) | Tác nhân hệ thống định kỳ kích hoạt kiểm tra thời gian. | - Tự động quét và cảnh báo các phiếu còn dưới 4 giờ là đến hạn cam kết SLA.<br>- Tự động phát hiện xung đột trùng lịch khi quản lý chọn khung giờ hẹn. | - Không tự động chuyển đổi trạng thái sửa chữa của phiếu. |

---

## 3. YÊU CẦU CHỨC NĂNG VÀ USER STORY

### 3.1. Danh sách Yêu cầu chức năng (Functional Requirements - FR)
*Mỗi yêu cầu chức năng đều phát biểu dưới dạng kiểm chứng được (Rõ Đầu vào - Xử lý - Đầu ra):*

- **FR1 (Tra cứu phiếu chờ phân công):** Hệ thống cho phép Quản lý trung tâm lọc và xem danh sách các phiếu bảo hành có trạng thái `MOI` thuộc trung tâm mình phụ trách; hiển thị mã phiếu, thiết bị, nhóm sự cố, mức ưu tiên và thời gian tiếp nhận.
- **FR2 (Phân công kỹ thuật viên hợp lệ):** Hệ thống cho phép Quản lý trung tâm gán một kỹ thuật viên cho phiếu bảo hành thỏa mãn đồng thời hai điều kiện: cùng trung tâm và có bậc tay nghề `proficiency >= 3` với nhóm sự cố của phiếu. Hệ thống tự động chuyển trạng thái phiếu sang `DA_PHAN_CONG` và ghi log lịch sử.
- **FR3 (Xem công việc theo SLA):** Hệ thống cung cấp cho Kỹ thuật viên danh sách các phiếu bảo hành được giao cho chính KTV đó, tự động sắp xếp ưu tiên theo hạn cam kết `due_date` tăng dần và gắn cờ cảnh báo đối với phiếu sắp quá hạn (dưới 4 giờ).
- **FR4 (Quản lý lịch hẹn & Kiểm tra trùng lịch):** Hệ thống cho phép tạo lịch hẹn giao nhận máy giữa khách hàng và kỹ thuật viên; tự động kiểm tra và ngăn chặn nếu khung thời gian hẹn bị trùng với lịch hẹn đã có của kỹ thuật viên đó.
- **FR5 (Giám sát tải công việc kỹ thuật viên):** Hệ thống tổng hợp và hiển thị trực quan số lượng phiếu đang xử lý của từng kỹ thuật viên trong trung tâm để hỗ trợ quản lý cân bằng khối lượng công việc.
- **FR6 (Cập nhật tiến độ & Vòng đời trạng thái):** Hệ thống cho phép Kỹ thuật viên cập nhật tiến độ và chuyển trạng thái phiếu theo đúng vòng đời quy định (`DA_PHAN_CONG` → `DANG_XU_LY` → `CHO_LINH_KIEN` → `HOAN_TAT`), lưu vết chính xác thời điểm và người chuyển.
- **FR7 (Điều chuyển kỹ thuật viên):** Hệ thống cho phép Quản lý trung tâm thay đổi kỹ thuật viên xử lý phiếu bảo hành, bắt buộc nhập lý do điều chuyển và lưu lại toàn bộ lịch sử thay đổi.
- **FR8 (Xem lịch trình làm việc cá nhân):** Hệ thống cho phép Kỹ thuật viên tra cứu các khung giờ hẹn tiếp khách trong ngày để chủ động thời gian xử lý kỹ thuật.

---

### 3.2. Danh sách 8 User Story chuẩn INVEST và Mức ưu tiên MoSCoW

| Mã US | Phát biểu User Story (Khuôn chuẩn) | Mức MoSCoW | Liên kết FR |
| :--- | :--- | :---: | :---: |
| **US1** | **Là** Quản lý trung tâm, **tôi muốn** xem danh sách các phiếu bảo hành chưa phân công thuộc trung tâm mình **để** nắm bắt kịp thời khối lượng công việc tồn đọng và bố trí nhân sự xử lý, không để phiếu bị bỏ quên. | **MUST** | FR1 |
| **US2** | **Là** Quản lý trung tâm, **tôi muốn** phân công kỹ thuật viên có tay nghề phù hợp và cùng trung tâm cho phiếu bảo hành **để** phiếu được xử lý đúng chuyên môn ngay từ đầu, giảm thiểu việc chuyển qua lại và rút ngắn thời gian sửa chữa. | **MUST** | FR2 |
| **US3** | **Là** Kỹ thuật viên, **tôi muốn** xem danh sách các phiếu bảo hành được gán cho mình sắp xếp theo hạn cam kết (SLA) **để** biết rõ mức độ khẩn cấp và ưu tiên xử lý các phiếu sắp hết hạn trước, tránh trễ hẹn với khách. | **MUST** | FR3 |
| **US4** | **Là** Quản lý trung tâm, **tôi muốn** đặt lịch hẹn giao – nhận máy giữa kỹ thuật viên và khách hàng có kiểm tra trùng lịch **để** tránh xung đột khung giờ làm việc của kỹ thuật viên và khách hàng không phải chờ đợi lâu. | **SHOULD** | FR4 |
| **US5** | **Là** Quản lý trung tâm, **tôi muốn** xem khối lượng công việc hiện tại của từng kỹ thuật viên trong trung tâm **để** phân bổ đều công việc, tránh tình trạng người quá tải (40 phiếu) người nhàn rỗi (12 phiếu). | **SHOULD** | FR5 |
| **US6** | **Là** Kỹ thuật viên, **tôi muốn** cập nhật tiến độ và chuyển trạng thái phiếu bảo hành theo đúng quy trình **để** minh bạch tiến trình sửa chữa, ghi nhận lịch sử xử lý và làm cơ sở thông báo cho khách hàng nhận máy. | **SHOULD** | FR6 |
| **US7** | **Là** Kỹ thuật viên, **tôi muốn** xem lịch hẹn tiếp khách trong ngày của bản thân **để** chủ động chuẩn bị công cụ, linh kiện và sắp xếp thời gian làm việc tại bàn kỹ thuật hợp lý. | **COULD** | FR8 |
| **US8** | **Là** Quản lý trung tâm, **tôi muốn** điều chuyển phiếu bảo hành sang kỹ thuật viên khác kèm lý do bắt buộc **để** xử lý linh hoạt khi kỹ thuật viên ban đầu quá tải hoặc vắng mặt đột xuất mà vẫn lưu vết minh bạch. | **COULD** | FR7 |

---

### 3.3. Tiêu chí chấp nhận (Acceptance Criteria - Given/When/Then) cho các Story MUST

#### US1: Xem danh sách phiếu bảo hành chưa phân công (MUST)
- **AC1.1 (Luồng chính):**
  - **GIVEN** Quản lý trung tâm đã đăng nhập thành công vào hệ thống tại trung tâm ID = 2.
  - **WHEN** Quản lý mở trang "Phiếu bảo hành chờ phân công".
  - **THEN** Hệ thống hiển thị danh sách các phiếu có `status = 'MOI'` và `center_id = 2`, sắp xếp theo `received_at` tăng dần; mỗi dòng hiển thị: `ticket_code`, tên thiết bị, tên nhóm sự cố, mức độ ưu tiên, hạn SLA, và số điện thoại khách hàng được hiển thị đầy đủ (QT-14, QT-15).
- **AC1.2 (Ngoại lệ - Không có phiếu chờ):**
  - **GIVEN** Trung tâm ID = 2 không có phiếu nào ở trạng thái `MOI`.
  - **WHEN** Quản lý mở trang "Phiếu bảo hành chờ phân công".
  - **THEN** Hệ thống hiển thị thông báo trạng thái rỗng: "Hiện không có phiếu bảo hành nào cần phân công", không phát sinh lỗi hệ thống.
- **AC1.3 (Ngoại lệ - Phân quyền trung tâm):**
  - **GIVEN** Phiếu bảo hành BH-000100 thuộc trung tâm ID = 1 (Quận 10).
  - **WHEN** Quản lý của trung tâm ID = 2 (Tân Bình) cố tình truy cập chi tiết phiếu BH-000100 qua đường dẫn URL.
  - **THEN** Hệ thống từ chối truy cập, trả về lỗi HTTP 403 Forbidden và hiển thị thông báo "Bạn không có quyền truy cập dữ liệu của trung tâm khác" (QT-14).

#### US2: Phân công kỹ thuật viên cho phiếu bảo hành (MUST)
- **AC2.1 (Luồng chính - Phân công thành công đúng tay nghề):**
  - **GIVEN** Phiếu BH-000231 có nhóm sự cố `MAN_HINH` (category_id = 1) tại trung tâm ID = 2 đang ở trạng thái `MOI`; Kỹ thuật viên Nguyễn Văn A (`technician_id` = 5) làm việc tại trung tâm ID = 2, đang hoạt động (`is_active = true`), có điểm tay nghề `proficiency` = 4 (≥ 3).
  - **WHEN** Quản lý chọn Kỹ thuật viên Nguyễn Văn A và bấm "Xác nhận phân công".
  - **THEN** Hệ thống gán `technician_id = 5`, cập nhật `status = 'DA_PHAN_CONG'` cho phiếu, tự động chèn một bản ghi vào `ticket_status_log` (`from_status = 'MOI'`, `to_status = 'DA_PHAN_CONG'`), và thông báo "Phân công kỹ thuật viên thành công" (QT-06, QT-07, QT-08).
- **AC2.2 (Ngoại lệ - Kỹ thuật viên không đủ bậc tay nghề):**
  - **GIVEN** Phiếu BH-000232 có nhóm sự cố `PIN` (category_id = 2); Kỹ thuật viên Trần Văn B chỉ có điểm tay nghề nhóm PIN `proficiency` = 2 (< 3).
  - **WHEN** Quản lý chọn Kỹ thuật viên Trần Văn B và bấm "Xác nhận phân công".
  - **THEN** Hệ thống từ chối lưu thay đổi, giữ nguyên trạng thái `MOI` của phiếu, trả về mã lỗi HTTP 422 Unprocessable Entity và hiển thị cảnh báo: *"Kỹ thuật viên không đủ điều kiện chuyên môn (yêu cầu điểm tay nghề tối thiểu từ 3 trở lên đối với nhóm sự cố này)"* (QT-08).
- **AC2.3 (Ngoại lệ - Kỹ thuật viên khác trung tâm):**
  - **GIVEN** Kỹ thuật viên Lê Văn C thuộc trung tâm ID = 1; Phiếu bảo hành thuộc trung tâm ID = 2.
  - **WHEN** Quản lý gửi yêu cầu phân công Kỹ thuật viên Lê Văn C cho phiếu này.
  - **THEN** Hệ thống từ chối thực hiện, trả về lỗi HTTP 400 Bad Request kèm thông báo *"Không thể phân công kỹ thuật viên không thuộc trung tâm tiếp nhận"* (QT-08).

#### US3: Kỹ thuật viên xem danh sách phiếu được gán theo hạn cam kết SLA (MUST)
- **AC3.1 (Luồng chính - Sắp xếp theo hạn cam kết SLA):**
  - **GIVEN** Kỹ thuật viên Nguyễn Văn A (`technician_id` = 5) đã đăng nhập và đang giữ 3 phiếu: Phiếu X (hạn SLA còn 2 giờ), Phiếu Y (hạn SLA còn 20 giờ), Phiếu Z (hạn SLA còn 48 giờ).
  - **WHEN** Kỹ thuật viên truy cập mục "Phiếu cần xử lý của tôi".
  - **THEN** Hệ thống trả về danh sách được sắp xếp theo `due_date` tăng dần (Phiếu X hiển thị đầu tiên), Phiếu X được gắn nhãn cảnh báo khẩn cấp màu đỏ (< 4 giờ), và số điện thoại của tất cả khách hàng đều được che 4 số cuối dạng `090****567` (QT-04, QT-15).
- **AC3.2 (Ngoại lệ - Kỹ thuật viên xem phiếu của người khác):**
  - **GIVEN** Phiếu BH-000300 được phân công cho Kỹ thuật viên B (`technician_id` = 6).
  - **WHEN** Kỹ thuật viên A (`technician_id` = 5) gửi request tra cứu chi tiết phiếu BH-000300.
  - **THEN** Hệ thống chặn truy cập, trả về mã lỗi HTTP 403 Forbidden kèm thông báo *"Bạn chỉ được phép xem các phiếu bảo hành được phân công cho chính mình"* (QT-14).
- **AC3.3 (Luồng trạng thái - Phiếu hoàn tất được chuyển mục lưu trữ):**
  - **GIVEN** Phiếu BH-000231 được Kỹ thuật viên cập nhật trạng thái thành `HOAN_TAT`.
  - **WHEN** Kỹ thuật viên tải lại danh sách "Phiếu cần xử lý".
  - **THEN** Phiếu BH-000231 không còn xuất hiện trong danh sách xử lý ưu tiên mà được chuyển sang tab "Lịch sử công việc hoàn tất".

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)
*Tất cả NFR đều có NGƯỠNG SỐ ĐO ĐƯỢC cụ thể, làm căn cứ kỹ thuật cho quyết định thiết kế kiến trúc ở Buổi 5:*

- **NFR1 (Hiệu năng - Performance):** Thời gian phản hồi của API truy vấn danh sách phiếu chờ phân công (`GET /api/tickets/unassigned`) phải đạt **dưới 1.5 giây** trong điều kiện cơ sở dữ liệu có **10.000 bản ghi** phiếu và phục vụ đồng thời tối thiểu **20 yêu cầu/giây (RPS)** trên cấu hình máy chủ chuẩn 2 vCPU, 4GB RAM.
- **NFR2 (Bảo mật & Kiểm soát truy cập - Security):** **100%** các request gửi tới API nghiệp vụ phải được xác thực thông qua JSON Web Token (JWT). **100%** số điện thoại khách hàng trả về cho vai trò Kỹ thuật viên phải được che định dạng `090****567` (QT-15); chỉ Quản lý trung tâm và Ban giám đốc mới được phép xem số điện thoại đầy đủ.
- **NFR3 (Tính toàn vẹn & Tin cậy - Reliability):** Thao tác phân công kỹ thuật viên (chuyển trạng thái phiếu và gán người) phải được thực thi trong một **Database Transaction (ACID)** hoàn chỉnh. Tỉ lệ xảy ra xung đột gán trùng hoặc mất tính nhất quán trạng thái phải bằng **0%**. Khi xảy ra lỗi kết nối mạng giữa chừng, hệ thống tự động rollback và không tạo dữ liệu rác.
- **NFR4 (Khả dụng - Usability):** Người dùng có vai trò Quản lý trung tâm mới tiếp nhận phải thực hiện thành công thao tác phân công 1 phiếu bảo hành cho kỹ thuật viên phù hợp trong thời gian **dưới 30 giây** (không quá **3 lần nhấp chuột** trên giao diện) mà không cần sự hướng dẫn kỹ thuật từ người khác.

---

## 5. RÀNG BUỘC VÀ QUY TẮC NGHIỆP VỤ (BUSINESS RULES)
*Các quy tắc nghiệp vụ trích xuất trực tiếp từ Mục 9 của Case Study Mekong Mobile áp dụng cho luồng L4:*

- **QT-03 (Định danh thiết bị duy nhất):** Thiết bị được xác định duy nhất bằng số serial hoặc IMEI. Một thiết bị chỉ thuộc về một khách hàng tại một thời điểm.
- **QT-04 (Hạn cam kết SLA tự động):** Hạn cam kết hoàn tất phiếu được tính tự động từ thời điểm tiếp nhận theo mức ưu tiên: `CAO` = 24 giờ, `TRUNG_BINH` = 72 giờ, `THAP` = 120 giờ. Thời gian chỉ tính trong ngày làm việc (từ thứ Hai đến thứ Bảy, trừ Chủ Nhật).
- **QT-06 (Vòng đời trạng thái không đảo ngược):** Phiếu chỉ được chuyển trạng thái tuần tự theo đúng quy trình: `MOI` → `DA_PHAN_CONG` → `DANG_XU_LY` → `CHO_LINH_KIEN` → `HOAN_TAT` → `DA_DONG` (hoặc `DA_HUY`). Tuyệt đối không được chuyển ngược về trạng thái trước đó. Mọi lần thay đổi trạng thái đều phải ghi một bản ghi vào `ticket_status_log`.
- **QT-07 (Nguyên tắc phân công đơn nhất):** Một phiếu bảo hành tại một thời điểm chỉ được gán cho tối đa một kỹ thuật viên duy nhất (`technician_id`). Mọi thao tác điều chuyển kỹ thuật viên khác phải bắt buộc nhập trường ghi chú lý do (`note`).
- **QT-08 (Ràng buộc năng lực & Địa bàn):** Kỹ thuật viên chỉ được phân công xử lý phiếu bảo hành khi thỏa mãn đồng thời hai điều kiện: có điểm tay nghề `proficiency >= 3` đối với nhóm sự cố của phiếu (`issue_category`) và đang làm việc tại cùng trung tâm bảo hành tiếp nhận phiếu đó (`center_id`).
- **QT-13 (Xóa mềm - Soft Delete):** Không xóa vật lý bất kỳ bản ghi nào của phiếu bảo hành, kỹ thuật viên hay lịch hẹn. Khi ngừng hiệu lực chỉ cập nhật cờ `is_active = false` hoặc trạng thái hủy để bảo toàn tính toàn vẹn dữ liệu lịch sử.
- **QT-14 (Phạm vi dữ liệu theo vai trò):** Kỹ thuật viên chỉ có quyền truy xuất các phiếu bảo hành được gán cho chính mình. Quản lý trung tâm có quyền xem toàn bộ phiếu bảo hành và lịch hẹn thuộc trung tâm mình phụ trách.
- **QT-15 (Bảo mật thông tin khách hàng):** Số điện thoại khách hàng phải hiển thị dưới dạng che (ví dụ `090****567`) đối với vai trò Kỹ thuật viên; chỉ Quản lý trung tâm và Ban giám đốc mới được xem định dạng đầy đủ.

---

## 6. BẢNG TRUY VẾT YÊU CẦU (REQUIREMENTS TRACEABILITY MATRIX)
*Bảng đối chiếu xuyên suốt giữa Yêu cầu chức năng ↔ User Story ↔ Use Case ↔ MoSCoW ↔ Kịch bản kiểm thử (Test Case):*

| Mã FR | Tên Yêu cầu chức năng | User Story liên quan | Use Case liên quan | Mức MoSCoW | Test Case dự kiến (BT3) |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **FR1** | Tra cứu danh sách phiếu bảo hành chờ phân công theo trung tâm | **US1** | **UC1** | **MUST** | `TC_FR1_01`, `TC_FR1_02` |
| **FR2** | Phân công kỹ thuật viên cho phiếu bảo hành theo tay nghề và trung tâm | **US2** | **UC2** | **MUST** | `TC_FR2_01`, `TC_FR2_02`, `TC_FR2_03` |
| **FR3** | Xem danh sách phiếu bảo hành được giao sắp xếp theo hạn cam kết SLA | **US3** | **UC3** | **MUST** | `TC_FR3_01`, `TC_FR3_02` |
| **FR4** | Đặt lịch hẹn giao – nhận thiết bị và kiểm tra xung đột trùng lịch | **US4** | **UC4** | **SHOULD** | `TC_FR4_01`, `TC_FR4_02` |
| **FR5** | Giám sát và thống kê khối lượng công việc hiện tại của kỹ thuật viên | **US5** | **UC5** | **SHOULD** | `TC_FR5_01` |
| **FR6** | Cập nhật tiến độ và ghi nhận chuyển trạng thái phiếu bảo hành | **US6** | **UC6** | **SHOULD** | `TC_FR6_01`, `TC_FR6_02` |
| **FR7** | Điều chuyển phiếu bảo hành sang kỹ thuật viên khác kèm lý do | **US8** | **UC7** | **COULD** | `TC_FR7_01`, `TC_FR7_02` |
| **FR8** | Xem danh sách lịch hẹn giao nhận cá nhân trong ngày của kỹ thuật viên | **US7** | **UC8** | **COULD** | `TC_FR8_01` |

> *Ghi chú kiểm chứng:*  
> - Bảng truy vết đảm bảo **100% không có ô trống** (đạt tiêu chí kiểm chứng loại trừ lỗi trượt BT1).  
> - Cột "Test Case dự kiến" đã được đánh mã sẵn sàng để kết nối trực tiếp với kế hoạch kiểm thử ở Bài tập 3.
