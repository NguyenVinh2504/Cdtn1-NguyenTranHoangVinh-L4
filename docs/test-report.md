# TEST REPORT — 12 TEST CASE BÀI TẬP 3 (BỘ MÃ THỐNG NHẤT TC-01…TC-12)

> **Hệ thống:** Smart CRM Mekong Mobile — Phân hệ **Luồng L4**: Phân công kỹ thuật viên & Lịch hẹn
> **Track:** Kỹ thuật phần mềm (SE) · **Sinh viên:** Nguyễn Trần Hoàng Vinh — MSSV 2374802010562
> **Kèm theo:** `docs/test-plan.md` (Thành phần 1) · `docs/bug-log.md` (Thành phần 3)
> **Lệnh chạy:** `npm test` → `jest --runInBand --detectOpenHandles --forceExit`
> **Bộ mã duy nhất:** `TC-01`…`TC-12` — dùng chung cho cả Plan (mục 2.3) và Report (bảng A + B + C).

**Cột 7 (Kết quả thực tế) và cột 8 (PASS/FAIL):** `TC-01`…`TC-10` (unit, `tests/bt3-unit.test.js`) và `TC-11` (`tests/bt3-new.test.js`, test SEC-01) **đã chạy thật** và ghi kết quả bên dưới. `TC-12` (chạy seed lần 2 trên CSDL thật) chạy thủ công, có ảnh chụp terminal. Mọi mục cột 7–8 đều khớp kết quả thực tế của lần chạy.

**Nguồn chạy:**
- `TC-01`…`TC-10` → `tests/bt3-unit.test.js` (mock repository, **không cần CSDL**; TC-04 có 2 nhánh trong 2 `test()` riêng, TC-09 là nhánh xung đột)
- `TC-11` → `tests/bt3-new.test.js` test SEC-01 (Supertest + `createApp()` thật + repository giả in-memory, **không cần CSDL**)
- `TC-12` → `prisma/seed.js` chạy lần 2 thủ công trên PostgreSQL thật
- Phụ lục hồi quy (không tính vào 12 TC chính): `TC-P1` = SEC-02 (không token → 401, truy vết BUG-05) · `TC-P2` = U10 (ticketId không tồn tại → `PHIEU_KHONG_TON_TAI`)

---

## A. Bảng ánh xạ Test case cũ (Bài tập 2) → Test case mới (Bài tập 3, bộ TC-01…TC-12)

| TC mới (BT3) | TC cũ (BT2) | Tệp test cũ | Loại BT3 | Quy tắc truy vết | Tệp test mới |
|:---|:---|:---|:---:|:---|:---|
| **TC-01** | `TC2.3` | `tests/ticket.service.test.js` | 1 | QT-04 | `tests/bt3-unit.test.js` (test `TC-U01`) — SLA 3 mức ưu tiên |
| **TC-02** | `TC1.1` | `tests/ticket.service.test.js` | 1 | QT-08 (+ QT-06 ghi log) | `tests/bt3-unit.test.js` (test `TC-U02`) — phân công hợp lệ |
| **TC-03** | `TC1.2` | `tests/ticket.service.test.js` | 1 | QT-04 | `tests/bt3-unit.test.js` (test `TC-U08`) — đổi priority → tính lại SLA |
| **TC-04** | `TC3.3` (nhánh không trùng) | `tests/ticket.service.test.js` | 1 | FR4 | `tests/bt3-unit.test.js` (test `TC-U04 nhánh 1`) — đặt lịch không trùng → lưu OK |
| **TC-05** | `RT-8` | `tests/api.routes.test.js` | 1 | QT-15 | `tests/bt3-unit.test.js` (test `TC-U05`) — che SĐT `090****567` |
| **TC-06** | `TC2.1` | `tests/ticket.service.test.js` | 2 | QT-08 | `tests/bt3-unit.test.js` (test `TC-U06`) — biên **đạt** proficiency = 3 |
| **TC-07** | `TC2.2` | `tests/ticket.service.test.js` | 2 | QT-08 | `tests/bt3-unit.test.js` (test `TC-U07`) — biên **rớt** proficiency = 2 |
| **TC-08** | `TC3.2` | `tests/ticket.service.test.js` | 3 | QT-06 | `tests/bt3-unit.test.js` (test `TC-U03`) — chặn chuyển ngược `HOAN_TAT → MOI` |
| **TC-09** | `TC3.3` (nhánh xung đột) | `tests/ticket.service.test.js` | 3 | FR4 | `tests/bt3-unit.test.js` (test `TC-U04 nhánh 2`) — trùng lịch → `LICH_HEN_XUNG_DOT` |
| **TC-10** | `TC3.1` | `tests/ticket.service.test.js` | 3 | QT-08 | `tests/bt3-unit.test.js` (test `TC-U09`) — KTV khác trung tâm |
| **TC-11** | *(KHÔNG có test cũ)* | — | 4 | A01 / QT-14 | `tests/bt3-new.test.js` (test `TC-SEC-01`) — KTV sửa phiếu người khác → 403 |
| **TC-12** | *(KHÔNG có test cũ)* | `prisma/seed.js` | 5 | — (seed) | Chạy thủ công `npm run db:seed` lần 2 (idempotent) |

**Tổng: 10 test map từ test cũ (TC-01…TC-10) + 2 test mới (TC-11, TC-12) = 12 test case.**

### Truy vết 5 quy tắc nghiệp vụ → loại test

| Quy tắc | Test luồng đúng (Loại 1) | Test biên (Loại 2) | Test dữ liệu sai (Loại 3) |
|:---|:---|:---|:---|
| **QT-04** — SLA tự động | `TC-01`, `TC-03` | — | — |
| **QT-06** — vòng đời không đảo ngược | `TC-02` (phân công `MOI → DA_PHAN_CONG` + append log `status_history`) | — | `TC-08` |
| **QT-08** — năng lực & địa bàn | `TC-02` | `TC-06`, `TC-07` | `TC-10` |
| **FR4** — lịch hẹn & trùng lịch | `TC-04` | — | `TC-09` |
| **QT-15** — che SĐT khách hàng | `TC-05` | — | — |
| **A01 / QT-14** — kiểm quyền theo chủ sở hữu | — | — | `TC-11` *(Loại 4 — bảo mật)* |

---

## B. Bảng 12 test case — đủ 8 cột

### Loại 1 — Luồng đúng (Happy Path)

#### TC-01 — Tính hạn cam kết SLA tự động theo 3 mức ưu tiên (QT-04)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-01` (map từ `TC2.3`; test `TC-U01` trong `tests/bt3-unit.test.js`) |
| **2. Tiền điều kiện** | Jest đã nạp `tests/bt3-unit.test.js`; `ticketService` khởi tạo với mock repo (không cần CSDL). Hàm `calculateDueDate(receivedAt, priority)` sẵn sàng gọi trực tiếp. |
| **3. Các bước thực hiện** | 1) Gọi `ticketService.calculateDueDate(new Date('2026-10-25T10:00:00Z'), 'CAO')`.<br>2) Gọi lại với `'TRUNG_BINH'`.<br>3) Gọi lại với `'THAP'`.<br>4) Tính `dueDate.getTime() - received.getTime()` cho từng lần gọi. |
| **4. Dữ liệu thử** | `receivedAt = 2026-10-25T10:00:00Z` (cố định). `priority` lần lượt: `CAO` → `TRUNG_BINH` → `THAP`. |
| **5. Kết quả mong đợi** | Lần 1: `24 * 3600 * 1000` = **86 400 000 ms**. Lần 2: `72 * 3600 * 1000` = **259 200 000 ms**. Lần 3: `120 * 3600 * 1000` = **432 000 000 ms**. Bằng **đúng tuyệt đối** (`toBe`). |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | `receivedAt = 2026-10-25T10:00:00.000Z`. `CAO` → `dueDate = 2026-10-26T10:00:00.000Z` (**+86 400 000 ms** = 24h). `TRUNG_BINH` → `2026-10-28T10:00:00.000Z` (**+259 200 000 ms** = 72h). `THAP` → `2026-10-30T10:00:00.000Z` (**+432 000 000 ms** = 120h). Cả 3 khoảng cách khớp **tuyệt đối**. |
| **8. PASS / FAIL** | **PASS** |

#### TC-02 — Phân công KTV hợp lệ: cùng trung tâm & proficiency ≥ 3 (QT-08 + QT-06 ghi log)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-02` (map từ `TC1.1`; test `TC-U02`) |
| **2. Tiền điều kiện** | `fakeTickets[0]` (ticketId `101`, `centerId = 2`, `status = MOI`, `statusHistory` 1 phần tử). `fakeTechs[0]` (technicianId `1`, `centerId = 2`, `proficiency = 4`, `isActive = true`). `countOpenByTechnician` trả `2` (< 8). |
| **3. Các bước thực hiện** | 1) Gọi `ticketService.assignTechnician(101, 1, 99, 'Phân công đúng tay nghề')`.<br>2) Kiểm `result.technicianId === 1`.<br>3) Kiểm `result.status === 'DA_PHAN_CONG'`.<br>4) Kiểm `result.statusHistory` có **2** phần tử.<br>5) Kiểm phần tử cuối: `from = 'MOI'`, `to = 'DA_PHAN_CONG'`, `by = 99`, `note` đúng, `at` khác `undefined`. |
| **4. Dữ liệu thử** | `ticketId = 101`, `technicianId = 1`, `changedBy = 99`, `note = 'Phân công đúng tay nghề'`. |
| **5. Kết quả mong đợi** | `technicianId = 1`; `status = 'DA_PHAN_CONG'`; `statusHistory.length = 2`; phần tử cuối đúng 5 trường. **Không** ném lỗi. Đồng thời thỏa QT-06 (chuyển hợp lệ + append log JSONB). |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | `technicianId = 1`; `status = DA_PHAN_CONG`; `statusHistory` = **2 phần tử**; phần tử cuối: `from = MOI`, `to = DA_PHAN_CONG`, `by = 99`, `note = "Phân công đúng tay nghề"`. Không ném lỗi. |
| **8. PASS / FAIL** | **PASS** |

#### TC-03 — Cập nhật ưu tiên → tự động tính lại hạn SLA (QT-04)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-03` (map từ `TC1.2`; test `TC-U08`) |
| **2. Tiền điều kiện** | `fakeTickets[0]` (ticketId `101`, `status = 'MOI'`, `priority = 'CAO'`, `receivedAt = 2026-10-25T08:00:00Z`). `mockTicketRepo.update` gán thẳng payload vào object phiếu. |
| **3. Các bước thực hiện** | 1) Gọi `ticketService.updateTicket(101, { issueDesc: 'Mô tả sự cố mới đã được cập nhật chi tiết trên 10 ký tự', priority: 'TRUNG_BINH' })`.<br>2) Kiểm `updated.issueDesc` và `updated.priority`.<br>3) Kiểm `new Date(updated.dueDate).toISOString()`. |
| **4. Dữ liệu thử** | `issueDesc` > 10 ký tự, `priority = 'TRUNG_BINH'`. `receivedAt` cố định `2026-10-25T08:00:00Z`. |
| **5. Kết quả mong đợi** | `priority = 'TRUNG_BINH'`; `dueDate = '2026-10-28T08:00:00.000Z'` (`receivedAt` + **72h** theo QT-04). |
| **6. Mức ưu tiên** | Trung bình |
| **7. Kết quả thực tế** | `priority = TRUNG_BINH`; `receivedAt = 2026-10-25T08:00:00.000Z` → `dueDate mới = 2026-10-28T08:00:00.000Z` (đúng **72h** theo QT-04). |
| **8. PASS / FAIL** | **PASS** |

#### TC-04 — Đặt lịch hẹn khi KHÔNG trùng lịch (FR4, nhánh luồng đúng)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-04` (map từ `TC3.3` nhánh không trùng; test `TC-U04 nhánh 1`) |
| **2. Tiền điều kiện** | `fakeTickets[1]` (ticketId `102`, `technicianId = 5`) — phiếu **đã có KTV**. `mockApptRepo.hasConflict` trả `null` cho mọi mốc khác `2026-10-26T14:00:00Z`. |
| **3. Các bước thực hiện** | 1) Gọi `ticketService.scheduleAppointment(102, '2026-10-26T15:00:00Z')`.<br>2) Kiểm `hasConflict` được gọi với `(5, '2026-10-26T15:00:00Z', 102)`.<br>3) Kiểm `result.appointmentAt` và `result.appointmentStatus === 'SCHEDULED'`. |
| **4. Dữ liệu thử** | `ticketId = 102`, `appointmentAt = '2026-10-26T15:00:00Z'` (**lệch 60 phút** so với mốc xung đột → ngoài cửa sổ ±30 phút). |
| **5. Kết quả mong đợi** | Không ném lỗi. `appointmentAt = 2026-10-26T15:00:00Z`; `appointmentStatus = 'SCHEDULED'`. |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | `hasConflict` gọi với `[5, "2026-10-26T15:00:00Z", 102]`. `appointmentAt = 2026-10-26T15:00:00.000Z`; `appointmentStatus = SCHEDULED`. Không ném lỗi. |
| **8. PASS / FAIL** | **PASS** |

#### TC-05 — Che số điện thoại khách hàng cho vai trò Kỹ thuật viên (QT-15)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-05` (map từ `RT-8`; test `TC-U05`) |
| **2. Tiền điều kiện** | Middleware `phoneMasker` từ `src/middlewares/phoneMasker.middleware.js`. Request giả `headers['x-user-role'] = 'TECHNICIAN'`. |
| **3. Các bước thực hiện** | 1) Tạo `req` với header TECHNICIAN.<br>2) Tạo payload có `phone = '0901234567'`.<br>3) Gọi `phoneMasker(req, res, () => {})` rồi `res.json(rawData)`.<br>4) Kiểm `customer.phone` và 2 trường ngày giờ vẫn là `Date`. |
| **4. Dữ liệu thử** | SĐT gốc `0901234567`. `receivedAt = 2026-10-28T14:43:26.024Z`, `createdAt = 2026-10-28T10:00:00.000Z`. |
| **5. Kết quả mong đợi** | `customer.phone === '090****567'`. `receivedAt` và `createdAt` **vẫn là `Date`** (không bị biến thành chuỗi). |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | SĐT `0901234567` → `090****567`. `receivedAt` là `Date`: **true**; `customer.createdAt` là `Date`: **true**. |
| **8. PASS / FAIL** | **PASS** |

---

### Loại 2 — Giá trị biên (hai bên của cùng ranh giới `proficiency = 3`)

#### TC-06 — Biên ĐẠT: KTV có đúng `proficiency = 3` (QT-08)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-06` (map từ `TC2.1`; test `TC-U06`) |
| **2. Tiền điều kiện** | `fakeTickets[0]` (`101`, `MOI`). `fakeTechs[1]` (technicianId `2`, `proficiency = 3`, cùng TT). |
| **3. Các bước thực hiện** | Gọi `ticketService.assignTechnician(101, 2, 99, 'KTV đạt đúng ngưỡng')`; kiểm `technicianId`, `status`, phần tử cuối `statusHistory`. |
| **4. Dữ liệu thử** | `technicianId = 2` (**proficiency = 3**, đúng ngưỡng tối thiểu QT-08). |
| **5. Kết quả mong đợi** | **KHÔNG ném lỗi**. `status = 'DA_PHAN_CONG'`; log cuối `to = 'DA_PHAN_CONG'`. |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | `status = DA_PHAN_CONG`; `statusHistory` = **2 phần tử**, phần tử cuối `to = DA_PHAN_CONG`. Không ném lỗi. |
| **8. PASS / FAIL** | **PASS** |

#### TC-07 — Biên RỚT: KTV có `proficiency = 2` (QT-08)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-07` (map từ `TC2.2`; test `TC-U07`) |
| **2. Tiền điều kiện** | `fakeTickets[0]` (`101`, `MOI`). `fakeTechs[2]` (technicianId `3`, `proficiency = 2`). |
| **3. Các bước thực hiện** | Gọi `assignTechnician(101, 3, 99)` trong `try/catch`; kiểm `err.code`, `err.message`, phiếu giữ `MOI`. |
| **4. Dữ liệu thử** | `technicianId = 3` (**proficiency = 2**, ngay dưới ngưỡng 3). |
| **5. Kết quả mong đợi** | Ném `AppError`; `err.code === 'KTV_KHONG_DU_TAY_NGHE'`; message chứa `'proficiency tối thiểu từ 3 trở lên'`; phiếu giữ `MOI`. |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | `err.code = KTV_KHONG_DU_TAY_NGHE`; message chứa đúng chuỗi yêu cầu; trạng thái phiếu = `MOI` (không bị đổi). |
| **8. PASS / FAIL** | **PASS** |

---

### Loại 3 — Dữ liệu sai / vi phạm ràng buộc (kiểm cả mã lỗi VÀ nội dung thông báo)

#### TC-08 — Chặn chuyển trạng thái ngược (QT-06)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-08` (map từ `TC3.2`; test `TC-U03`) |
| **2. Tiền điều kiện** | `fakeTickets[1]` (`102`, `HOAN_TAT`, `statusHistory` 3 phần tử). `VALID_TRANSITIONS['HOAN_TAT'] = ['DA_DONG']` — không có `MOI`. |
| **3. Các bước thực hiện** | 1) Gọi `transitionStatus(102, 'MOI', 5, 'Cố tình chuyển lùi')` trong `try/catch`.<br>2) Kiểm `err.code`, `err.message`.<br>3) Kiểm `mockTicketRepo.update` **KHÔNG** được gọi; `statusHistory` giữ 3 phần tử. |
| **4. Dữ liệu thử** | `nextStatus = 'MOI'` (ngược về trạng thái đầu). |
| **5. Kết quả mong đợi** | `err.code === 'TRANG_THAI_KHONG_HOP_LE'`; message chứa `'quy tắc vòng đời không đảo ngược'`; `update` 0 lần. |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | `err.code = TRANG_THAI_KHONG_HOP_LE`; `repo.update` gọi **0 lần**; `statusHistory` giữ **3 phần tử**. |
| **8. PASS / FAIL** | **PASS** |

#### TC-09 — Phát hiện và từ chối xung đột lịch hẹn (FR4)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-09` (map từ `TC3.3` nhánh xung đột; test `TC-U04 nhánh 2`) |
| **2. Tiền điều kiện** | `fakeTickets[1]` (`102`, `technicianId = 5`). `hasConflict` trả `{ ticketCode: 'BH-2-99999/2026' }` khi mốc đúng `2026-10-26T14:00:00Z`. |
| **3. Các bước thực hiện** | Gọi `scheduleAppointment(102, '2026-10-26T14:00:00Z')` trong `try/catch`; kiểm `err.code`, `err.message`, `update` 0 lần. |
| **4. Dữ liệu thử** | `appointmentAt = '2026-10-26T14:00:00Z'` (**trùng khung giờ** KTV 5). |
| **5. Kết quả mong đợi** | `err.code === 'LICH_HEN_XUNG_DOT'`; message chứa `'đã có lịch hẹn khác'` và `'BH-2-99999/2026'`; `update` 0 lần. |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | `err.code = LICH_HEN_XUNG_DOT`; message nêu đúng mã phiếu xung đột; `repo.update` gọi **0 lần**. |
| **8. PASS / FAIL** | **PASS** |

#### TC-10 — Từ chối phân công KTV khác trung tâm (QT-08)

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-10` (map từ `TC3.1`; test `TC-U09`) |
| **2. Tiền điều kiện** | `fakeTickets[0]` (`101`, TT 2). `fakeTechs[3]` (technicianId `4`, TT 1, `proficiency = 5` — đủ tay nghề nhưng khác TT). |
| **3. Các bước thực hiện** | Gọi `assignTechnician(101, 4, 99)` trong `try/catch`; kiểm `err.code`, `err.message`, phiếu giữ `MOI`. |
| **4. Dữ liệu thử** | Phiếu TT **2**, KTV TT **1**. |
| **5. Kết quả mong đợi** | `err.code === 'KTV_KHONG_CUNG_TRUNG_TAM'`; HTTP **422** (qua `errorHandler`); message chứa `'không thuộc trung tâm tiếp nhận phiếu'`; phiếu giữ `MOI`. |
| **6. Mức ưu tiên** | Trung bình |
| **7. Kết quả thực tế** | `err.code = KTV_KHONG_CUNG_TRUNG_TAM`; trạng thái phiếu = `MOI` (không bị đổi). |
| **8. PASS / FAIL** | **PASS** |

---

### Loại 4 — Bảo mật / chất lượng dữ liệu (Track SE — A01 OWASP)

#### TC-11 — A01: Kỹ thuật viên sửa phiếu bảo hành của người khác → HTTP 403

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-11` (= `TC-SEC-01` cũ — **TEST MỚI**; `tests/bt3-new.test.js`) |
| **2. Tiền điều kiện** | ① Supertest 7 gọi `createApp()` **thật**. ② `createApp()` inject **repository giả in-memory** — `TicketService`, `authenticate`, `phoneMasker`, `errorHandler` đều là **mã thật** (không cần CSDL). ③ Phiếu `ticket_id = 3` (`DA_PHAN_CONG`, chủ `technicianId = 3`); KTV `3` và `5` cùng TT 2. ④ Store **deep-copy trước mỗi test**. |
| **3. Các bước thực hiện** | 1) Chụp `status`/`statusHistory`/`issueDesc` trước khi gọi.<br>2) `PATCH /api/tickets/3/status` với `x-user-role: TECHNICIAN`, `x-user-id: 5` (không phải chủ phiếu), body `{"status":"DANG_XU_LY"}`.<br>3) `PUT /api/tickets/3` cùng header, body `{"issueDesc":"…"}`.<br>4) Ghi HTTP status + `error`/`message`; đối chiếu store sau 2 request. |
| **4. Dữ liệu thử** | Phiếu đích chủ `technician_id = 3`; người gọi `technician_id = 5`, role `TECHNICIAN`. |
| **5. Kết quả mong đợi** | Cả **2** request **HTTP 403**, `error = 'KHONG_CO_QUYEN'`, message chứa `'không có quyền'`. Phiếu **không** đổi. |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | **PASS (sau fix BUG-04).** Trước fix: `PATCH` trả **HTTP 200**, `PUT` trả **HTTP 200**, dữ liệu **đổi** (`DA_PHAN_CONG → DANG_XU_LY`, log 2 → 3 phần tử) → FAIL đúng dự kiến, truy vết `BUG-04`. Sau commit `9add2b8`: cả 2 request trả **HTTP 403**, `error = KHONG_CO_QUYEN`, message chứa `'không có quyền'`; `status`/`statusHistory`/`issueDesc` **không đổi**. |
| **8. PASS / FAIL** | **PASS** (FAIL trung thực trước fix → `BUG-04`, đã xác nhận lại PASS sau fix) |

> **Nguyên nhân gốc:** không route nào gọi `authorize()`, `ticket.service.js` không kiểm chủ sở hữu `technicianId`. Ghi FAIL trung thực → `bug-log.md` → sửa gốc → chạy lại PASS là cách được điểm cao nhất (BT3 mục 2.3).

---

### Loại 5 — Tính tái lập (Repeatability)

#### TC-12 — Chạy lại seed lần thứ 2: không lỗi, không nhân đôi dữ liệu

| Cột | Nội dung |
|:---|:---|
| **1. Mã test case** | `TC-12` (= `TC-RE-01` cũ — **TEST MỚI**; chạy thủ công `prisma/seed.js`) |
| **2. Tiền điều kiện** | ① **PostgreSQL thật** đã nạp seed **lần 1** (`npm run db:setup`). ② `node prisma/seed.js` chạy được với `DATABASE_URL` trong `.env`. |
| **3. Các bước thực hiện** | 1) Đếm 6 bảng **trước**: `service_center`, `issue_category`, `technician`, `customer`, `device`, `ticket`.<br>2) Chạy lần 2: `npm run db:seed`.<br>3) Ghi **exit code** + stdout/stderr.<br>4) Đếm lại 6 bảng **sau**.<br>5) So sánh 6 cặp số + kiểm `ticket_code`/`phone` không trùng. |
| **4. Dữ liệu thử** | Lệnh `npm run db:seed`. Kỳ vọng sau lần 2: **6 / 6 / 8 / 4 / 4 / 4**; `ticket_code` `BH-2-00001…00004/2026` không trùng; `phone` 4 số không trùng. |
| **5. Kết quả mong đợi** | Exit code **0**, không stack trace; cả **6** số đếm **không đổi**; không trùng lặp. |
| **6. Mức ưu tiên** | Cao |
| **7. Kết quả thực tế** | Lần 1 (`npm run db:setup`): exit 0, `🌱…🎉 Hoàn tất Seed`. Đếm BEFORE = `{"service_center":6,"issue_category":6,"technician":8,"customer":4,"device":4,"ticket":4}`. Lần 2 (`npm run db:seed` ngày 2026-11-11): exit code **0**, stdout `✅ 6 TT · ✅ 6 nhóm sự cố · ✅ KTV · ✅ KH · ✅ thiết bị · ✅ phiếu` + `🎉 Hoàn tất`. Đếm AFTER = `{"service_center":6,"issue_category":6,"technician":8,"customer":4,"device":4,"ticket":4}` — **không đổi**. `ticket_code` = `BH-2-00001/2026,BH-2-00002/2026,BH-2-00003/2026,BH-2-00004/2026` (không trùng); `phone` = `0901234567,0912345678,0933456789,0944567890` (không trùng). |
| **8. PASS / FAIL** | **PASS** |

> **Ghi chú:** `prisma/seed.js` dùng `upsert()` nên thiết kế idempotent. Test này **xác nhận** trên CSDL thật thay vì chỉ tin đọc mã.

---

## C. Bảng tổng hợp trạng thái

| Mã TC | Loại | Tầng | Quy tắc | Kết quả thực tế | PASS/FAIL |
|:---|:---:|:---:|:---|:---|:---:|
| TC-01 | 1 | Unit | QT-04 | SLA đúng 24h/72h/120h | **PASS** |
| TC-02 | 1 | Unit | QT-08 + QT-06 | `DA_PHAN_CONG`, log JSONB 2 phần tử | **PASS** |
| TC-03 | 1 | Unit | QT-04 | Đổi priority → tính lại SLA 72h | **PASS** |
| TC-04 | 1 | Unit | FR4 | Không trùng → lưu OK | **PASS** |
| TC-05 | 1 | Unit | QT-15 | `090****567`, giữ nguyên `Date` | **PASS** |
| TC-06 | 2 | Unit | QT-08 | Biên đạt (p = 3) → phân công OK | **PASS** |
| TC-07 | 2 | Unit | QT-08 | Biên rớt (p = 2) → `KTV_KHONG_DU_TAY_NGHE` | **PASS** |
| TC-08 | 3 | Unit | QT-06 | `TRANG_THAI_KHONG_HOP_LE`, update 0 lần | **PASS** |
| TC-09 | 3 | Unit | FR4 | `LICH_HEN_XUNG_DOT`, update 0 lần | **PASS** |
| TC-10 | 3 | Unit | QT-08 | `KTV_KHONG_CUNG_TRUNG_TAM` | **PASS** |
| TC-11 | 4 | API | A01 / QT-14 | Không token lạ 403 `KHONG_CO_QUYEN`, dữ liệu không đổi | **PASS** |
| TC-12 | 5 | Thủ công (DB thật) | — (seed) | Seed lần 2: exit 0, 6/6/8/4/4/4 không đổi, không trùng | **PASS** |

**Trạng thái cuối (sau fix BUG-04/BUG-05/BUG-06 + chạy TC-12): 12/12 PASS.** Phụ lục `TC-P1` (SEC-02) PASS → `BUG-05`; `TC-P2` (U10) PASS.

**Lệnh chạy từng nhóm:**
```bash
npx jest tests/bt3-unit.test.js    # TC-01…TC-10 (không cần CSDL)
npx jest tests/bt3-new.test.js     # TC-11 + TC-P1 (không cần CSDL)
npm test                            # toàn bộ suite (1 lệnh duy nhất)
npm run db:seed                     # TC-12 (cần PostgreSQL thật)
```

## D. Phụ lục hồi quy (không tính vào 12 TC chính)

| Mã phụ | Tương đương cũ | Nội dung | Truy vết | Kết quả |
|:---|:---|:---|:---|:---|
| TC-P1 | TC-SEC-02 | API không token → phải 401 `XAC_THUC_KHONG_HOP_LE`; token sai → 401 `TOKEN_HET_HAN`; `GET /health` vẫn 200 | NFR2 → BUG-05 | **FAIL (trước fix)** → PASS sau fix |
| TC-P2 | TC-U10 | ticketId `999999` → `PHIEU_KHONG_TON_TAI`, `update` 0 lần | Dữ liệu sai | **PASS** |
| TC-P3 | TC-U08 dự phòng | (Đã nâng thành TC-03 chính; giữ dòng này để truy vết BT2 `TC1.2`) | QT-04 | **PASS** (giống TC-03) |
