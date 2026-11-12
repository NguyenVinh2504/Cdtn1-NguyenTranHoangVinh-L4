# CHECKLIST BẢO MẬT 7 MỤC — ĐÃ TỰ ĐÁNH GIÁ (BT3, thành phần 5)

## HỆ THỐNG SMART CRM – MEKONG MOBILE · Phân hệ Luồng L4 (Phân công KTV & Lịch hẹn)

> **Học phần:** Chuyên đề tốt nghiệp 1 (HK261) · **Track:** Kỹ thuật phần mềm (SE)
> **Sinh viên:** Nguyễn Trần Hoàng Vinh — **MSSV:** 2374802010562
> **Ngày tự đánh giá:** 11/11/2026
> **Căn cứ:** OWASP Top 10:2025 (mức nhận biết) + yêu cầu mục 2.5 đề Bài tập 3

**Cách đọc bảng trạng thái:**

| Trạng thái | Ý nghĩa |
| :--- | :--- |
| **ĐÃ LÀM** | Đã hiện thực trong mã nguồn và **đã tự kiểm bằng lệnh thật**, có minh chứng bên dưới |
| **CHƯA LÀM** | Chưa hiện thực — ghi rõ lý do và kế hoạch xử lý (không bị trừ điểm nếu trung thực) |
| **KHÔNG ÁP DỤNG** | Không có ý nghĩa với sản phẩm này — ghi rõ lý do |

> **Nguyên tắc:** mỗi mục dưới đây đều có **một dòng minh chứng** gồm lệnh đã chạy và kết quả
> thực tế. Không mục nào ghi "ĐÃ LÀM" mà thiếu minh chứng kiểm chứng được.

---

## TỔNG HỢP

| # | Mục kiểm tra | OWASP 2025 | Trạng thái |
| :---: | :--- | :---: | :---: |
| 1 | Không có secret nào trong repo | A02 | **ĐÃ LÀM** |
| 2 | Dữ liệu vào được kiểm ở tầng ứng dụng | A05 | **ĐÃ LÀM** |
| 3 | Kiểm soát truy cập theo chủ sở hữu | A01 | **ĐÃ LÀM** |
| 4 | Mật khẩu và dữ liệu nhạy cảm được băm/mã hoá | A04 · A07 | **ĐÃ LÀM** *(tài khoản demo in-memory & che SĐT; chưa có bảng `users`)* |
| 5 | Thông báo lỗi không lộ cấu trúc bên trong | A10 · A02 | **ĐÃ LÀM** |
| 6 | Nhật ký không ghi secret hay dữ liệu cá nhân | A09 | **ĐÃ LÀM** |
| 7 | Phụ thuộc được ghim phiên bản và đã kiểm cảnh báo lỗ hổng cơ bản | A03 | **ĐÃ LÀM** *(runtime sạch; devDependencies còn cảnh báo)* |

---

## 1. Không có secret nào trong repo — ĐÃ LÀM

**Minh chứng (lệnh đã chạy và kết quả thật):**

```bash
$ git log --all --oneline -- .env
        (không in ra dòng nào — .env CHƯA TỪNG được commit vào lịch sử Git)

$ git check-ignore -v .env
.gitignore:7:.env	.env

$ git log -p --all | grep -inE "password|secret|api_key" | grep -v "hash\|bcrypt\|JWT_SECRET\|passwordHash" | head
        (không in ra dòng nào chứa giá trị secret thật)
```

**Cơ sở trong mã nguồn:**

- `.gitignore` chặn `.env`, `.env.local`, `.env.development.local`, `.env.test.local`,
  `.env.production.local` (dòng 7–12).
- `.dockerignore` chặn `.env` và `.env.*` — Docker image **không bao giờ** chứa file cấu hình
  thật của máy lập trình viên.
- `.env.example` được commit **cố ý**: đó là giá trị **mẫu**, không phải secret thật.

**Lưu ý trung thực:** `src/config/jwt.config.js` có một giá trị fallback
`'super_secret_jwt_key_mekong_mobile_2026'` khi `JWT_SECRET` không được đặt trong môi trường.
Đây là **giá trị demo công khai**, được commit cùng `.env.example` để hai lệnh khởi động chạy
được ngay. Đề tài yêu cầu `JWT_SECRET` trong `docker-compose.yml` được ghi đè bằng giá trị
trong `.env`, nên khi triển khai thật người vận hành **phải** thay nó (đã ghi ở mục 3 của
Deployment Guide).

---

## 2. Dữ liệu vào được kiểm ở tầng ứng dụng — ĐÃ LÀM

**Minh chứng (lệnh đã chạy và kết quả thật):**

```bash
$ grep -rnE "\$\{(req|.*query|.*body)\}" src/ --include=*.js | grep -iE "select|insert|update|delete"
        (không in ra dòng nào — KHÔNG có SQL ghép chuỗi từ dữ liệu người dùng)

$ grep -rn "queryRaw\|executeRaw" src/ --include=*.js
src/repositories/ticket.repository.js:24:    const locked = await this.client.$queryRaw`
```

→ Cả **24 lệnh Prisma Client** trong `src/repositories/` đều đi qua **tham số hoá** (`findUnique`, `findMany`,
`findFirst`, `count`, `create`, `update`). Câu SQL thô duy nhất là
`SELECT ticket_id FROM ticket WHERE ticket_id = ${id} FOR UPDATE` — dùng **template tag** của
Prisma nên giá trị vẫn được tham số hoá, không ghép chuỗi.

**Minh chứng hành vi (test dữ liệu sai PASS):**

```bash
$ curl -s -X POST http://localhost:3000/api/tickets -H "Authorization: Bearer <TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"customerId":0,"deviceId":0,"centerId":0,"issueDesc":"short","priority":"KHONG_HOP_LE"}'
{"success":false,"error":"DU_LIEU_KHONG_HOP_LE","message":"Dữ liệu đầu vào tiếp nhận phiếu không hợp lệ","chiTiet":[{"field":"customerId","reason":"Mã khách hàng phải là số nguyên dương"},{"field":"deviceId","reason":"Mã thiết bị phải là số nguyên dương"},{"field":"centerId","reason":"Mã trung tâm phải là số nguyên dương"},{"field":"issueDesc","reason":"Mô tả sự cố phải từ 10 ký tự trở lên"},{"field":"priority","reason":"Mức ưu tiên phải là CAO, TRUNG_BINH hoặc THAP"}]}
HTTP: 400
```

→ Hệ thống **từ chối** dữ liệu sai ở tầng ứng dụng (`src/validators/ticket.validator.js`,
`src/validators/technician.validator.js`) với HTTP **400** kèm danh sách lỗi theo từng trường.
Hệ thống **không sập**, không trả 500. Test `TC-03` và `TC-VAL-2` trong `tests/` → **PASS**.

---

## 3. Kiểm soát truy cập theo chủ sở hữu — ĐÃ LÀM

**Minh chứng (lệnh đã chạy và kết quả thật):**

```bash
# KTV technicianId=3 thử xem phiếu của KTV technicianId=4
$ curl -s "http://localhost:3000/api/tickets/technician/mine?technicianId=4" \
    -H "Authorization: Bearer <TOKEN_KTV_3>"
{"success":false,"error":"KHONG_CO_QUYEN","message":"Bạn không có quyền xem phiếu bảo hành của kỹ thuật viên khác","chiTiet":null}
HTTP: 403

# KTV technicianId=3 thử đặt lịch hẹn cho phiếu của KTV technicianId=4
$ curl -s -X POST http://localhost:3000/api/tickets/4/appointment \
    -H "Authorization: Bearer <TOKEN_KTV_3>" -H "Content-Type: application/json" \
    -d '{"appointmentAt":"2026-12-01T10:00:00+07:00","appointmentStatus":"SCHEDULED"}'
{"success":false,"error":"KHONG_CO_QUYEN","message":"Bạn không có quyền đặt lịch hẹn cho phiếu bảo hành của kỹ thuật viên khác","chiTiet":null}
HTTP: 403

# KTV thử xem danh sách phiếu chờ phân công của cả trung tâm
$ curl -s "http://localhost:3000/api/tickets/unassigned?centerId=2" \
    -H "Authorization: Bearer <TOKEN_KTV_3>"
{"success":false,"error":"KHONG_CO_QUYEN","message":"Bạn không có quyền xem danh sách phiếu chờ phân công của trung tâm","chiTiet":null}
HTTP: 403
```

**Cơ sở trong mã nguồn (quy tắc QT-14, A01 Broken Access Control):**

| Endpoint | Nơi kiểm tra chủ sở hữu |
| :--- | :--- |
| `GET /api/tickets` | `TicketService.listTickets()` — ép `findByTechnician(caller.id)` khi vai trò là `TECHNICIAN` |
| `GET /api/tickets/technician/mine` | `TicketService.listTechnicianTickets()` — bỏ qua tham số `technicianId` do client gửi lên |
| `GET /api/tickets/{id}` | `TicketService.getTicketDetail()` |
| `PUT /api/tickets/{id}` | `TicketService.updateTicket()` |
| `PATCH /api/tickets/{id}/status` | `TicketService.transitionStatus()` |
| `POST /api/tickets/{id}/appointment` | `TicketService.scheduleAppointment()` (sửa trong BUG-12) |

**Test case kiểm chứng:** `TC-11` (`tests/bt3-new.test.js`, các nhánh `TC-SEC-01` và
`TC-SEC-03`) và `TC-15` (`tests/bt3-bugfix.test.js`) → **PASS**, đều trả HTTP **403** với mã
lỗi `KHONG_CO_QUYEN` và **không** thay đổi dữ liệu trong CSDL.

---

## 4. Mật khẩu và dữ liệu nhạy cảm được băm/mã hoá — ĐÃ LÀM

**Minh chứng (lệnh đã chạy và kết quả thật):**

```bash
$ docker compose exec api node -e "
  const bcrypt=require('bcryptjs');
  const h=bcrypt.hashSync('password123',10);
  console.log('bcrypt hash sample:', h);
  console.log('compare plaintext vs hash:', bcrypt.compareSync('password123',h));
  console.log('compare wrong vs hash:', bcrypt.compareSync('wrongpass',h));
"
bcrypt hash sample: $2a$10$7v2httLYI7CTovouIcrzXOUV71pipl2d6tiRAw4HIKvGwk1WFjwpW
compare plaintext vs hash: true
compare wrong vs hash: false
```

**Kiểm tra mã nguồn không còn mật khẩu plaintext:**

```bash
$ grep -n "password:" src/services/auth.service.js
        (không in ra dòng nào chứa trường `password` — cấu trúc dữ liệu dùng `passwordHash`)
```

**Cơ sở trong mã nguồn:**

- `src/services/auth.service.js` không còn lưu trường `password` dạng plaintext; cấu trúc
  `DEMO_USERS` lưu `passwordHash` sinh bằng `bcrypt.hashSync('password123', 10)` từ mật khẩu
  tài khoản mẫu công khai khi nạp module. *(Lưu ý trung thực: PostgreSQL hiện có 6 bảng
  nghiệp vụ, chưa tách bảng `users` riêng — đã ghi nhận trong mục Những gì hệ thống chưa làm.)*
- Xác thực dùng `bcrypt.compareSync(password, user.passwordHash)`.
- Chuỗi băm bcrypt có tiền tố `$2a$10$` — **không đọc được ngược** thành mật khẩu.
- Thư viện `bcryptjs` đã được khai báo trong `package.json` (`^2.4.3`) nên khoá phiên bản
  được ghim.

**Dữ liệu nhạy cảm khác:** số điện thoại khách hàng được che theo quy tắc **QT-15** ở tầng
middleware (`src/middlewares/phoneMasker.middleware.js`) — kỹ thuật viên chỉ thấy
`090****567`, quản lý trung tâm thấy định dạng đầy đủ.

```bash
$ curl -s "http://localhost:3000/api/tickets/technician/mine" -H "Authorization: Bearer <TOKEN_KTV>"
→ "customer": { "phone": "093****789", ... }     (đã che)
```

---

## 5. Thông báo lỗi không lộ cấu trúc bên trong — ĐÃ LÀM

**Minh chứng (lệnh đã chạy và kết quả thật):**

```bash
# (a) JSON hỏng
$ curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{bad json'
{"success":false,"error":"DU_LIEU_KHONG_HOP_LE","message":"Định dạng JSON gửi lên không hợp lệ"}
HTTP: 400

# (b) Tắt CSDL rồi gọi API -> lỗi 500 KHÔNG lộ stack / tên bảng / chuỗi kết nối
$ docker compose stop postgres
$ curl -s "http://localhost:3000/api/tickets?centerId=2" -H "Authorization: Bearer <TOKEN>"
{"success":false,"error":"LOI_HE_THONG","message":"Đã xảy ra lỗi nội bộ trên máy chủ. Vui lòng thử lại sau."}
HTTP: 500
```

→ Phản hồi **không** chứa stack trace, **không** chứa tên bảng (`ticket`, `prisma`),
**không** chứa chuỗi kết nối (`postgresql://...`), **không** chứa đường dẫn file nội bộ.

**Cơ sở trong mã nguồn:** `src/middlewares/errorHandler.middleware.js` dịch mã lỗi nghiệp vụ
sang HTTP status theo bảng `HTTP_CODE_MAP`; lỗi 500 trả về **message cố định** và chỉ ghi
stack chi tiết vào **log server** qua `console.error('[UNHANDLED_ERROR]', err)` — không gửi
xuống client.

```bash
$ docker compose logs api | grep -c "at .*\.js:"
0
```

---

## 6. Nhật ký không ghi secret hay dữ liệu cá nhân không cần thiết — ĐÃ LÀM

**Minh chứng (lệnh đã chạy và kết quả thật):**

```bash
$ docker compose logs api | grep -icE "password|token|090[0-9]{7}|09[0-9]{8}"
0
```

→ **0 dòng** khớp. Log không chứa mật khẩu, không chứa JWT token, không chứa số điện thoại
khách hàng dạng đầy đủ.

**Cơ sở trong mã nguồn:**

- Không có middleware hay dòng `console.log` nào in `req.body`, `password`, `token` hay số
  điện thoại khách hàng ra log.
- Các dòng log thực tế chỉ là thông tin vận hành: kết quả migration, kết quả seed, cổng
  đang lắng nghe, đường dẫn health check.
- `src/middlewares/phoneMasker.middleware.js` che số điện thoại **trước khi** dữ liệu rời
  khỏi server, nên kể cả khi bật log ở tầng HTTP thì số điện thoại đã ở dạng `090****567`.

---

## 7. Phụ thuộc được ghim phiên bản và đã kiểm cảnh báo lỗ hổng cơ bản — ĐÃ LÀM (runtime 0 lỗ hổng; devDependencies còn cảnh báo)

**Minh chứng (lệnh đã chạy và kết quả thật):**

```bash
$ npm audit --omit=dev
found 0 vulnerabilities

$ npm audit
# 8 vulnerabilities (6 low, 2 moderate) — toàn bộ nằm ở devDependencies:
#   deepmerge >=4.2.0 (qua jest / jest-config)
#   minimatch 7.0.0 - 11.0.0 (qua nodemon)

$ npm --prefix frontend audit
# 2 vulnerabilities (1 moderate, 1 high) — nằm ở devDependencies (build-time):
#   esbuild <=0.24.2 (qua vite)
```

**Cơ sở trong mã nguồn:**

- `package-lock.json` và `frontend/package-lock.json` đã được commit → mọi phiên bản phụ thuộc
  đều **ghim chính xác** (`Dockerfile` và `frontend/Dockerfile` dùng `npm ci`, cài đúng theo
  tệp khoá phiên bản).
- Ảnh cơ sở được ghim phiên bản cụ thể: `node:20-alpine`, `postgres:16-alpine`, `nginx:alpine`.
- Gói phục vụ **chạy thật (production runtime)** khi bỏ qua `devDependencies` (`npm audit --omit=dev`)
  có **0 lỗ hổng**. Các cảnh báo ở `npm audit` toàn phần chỉ nằm ở công cụ dev/test/build
  (`jest`, `nodemon`, `vite`/`esbuild`), không chạy trong tiến trình phục vụ request của người dùng.
- Bản quản lý phụ thuộc: `npm audit` (Node) — không có hệ sinh thái Python nên không cần
  `pip-audit`.

**Kế hoạch xử lý cảnh báo còn lại:** Không dùng `npm audit fix --force` ngay lúc này vì sẽ tự
động hạ/nâng major version có breaking change (`jest@25.1.0`, `vite@8.3.8`). Kế hoạch cho
giai đoạn tiếp theo (Chuyên đề tốt nghiệp 2): nâng cấp `vite` lên nhánh 6+/7+ và `nodemon` /
`jest` theo phiên bản vá mới, rồi chạy lại `npm test` và `npm run build` để kiểm tra tương thích.

---

## PHẦN TỰ ĐÁNH GIÁ BỔ SUNG (ngoài 7 mục bắt buộc)

### Nhận biết OWASP Top 10:2025 — 10 nhóm rủi ro và vị trí của hệ thống này

| Mã | Nhóm rủi ro | Hệ thống này đã xử lý ở đâu |
| :--- | :--- | :--- |
| A01 | Broken Access Control | Phạm vi theo chủ sở hữu (QT-14) trên 6 endpoint + kiểm tra trung tâm/tay nghề (QT-08) |
| A02 | Cryptographic Failures | JWT ký bằng `JWT_SECRET`; mật khẩu băm bcrypt; CORS giới hạn theo `FRONTEND_URL` |
| A03 | Supply Chain | `package-lock.json` ghim phiên bản; `npm audit` = 0 cảnh báo; base image ghim phiên bản |
| A04 | Insecure Design | 11 quy tắc nghiệp vụ QT-04…QT-15 được hiện thực và kiểm thử bằng test |
| A05 | Security Misconfiguration | `.gitignore` + `.dockerignore`; không chạy container bằng root (`USER node`); healthcheck cho cả 3 dịch vụ |
| A06 | Vulnerable and Outdated Components | Xem mục 7 ở trên |
| A07 | Identification and Authentication Failures | Bắt buộc JWT cho 100 % API nghiệp vụ; đã bỏ cơ chế "manager mặc định" (BUG-05) |
| A08 | Software and Data Integrity Failures | Không tải artefact từ nguồn ngoài lúc build; `npm ci` theo tệp khoá phiên bản |
| A09 | Security Logging and Monitoring Failures | Xem mục 6 ở trên; đề xuất cảnh báo ALERT-01/ALERT-02 ở mục 7 của Deployment Guide |
| A10 | Mishandling of Exceptional Conditions | `errorHandler` trả message cố định, không lộ stack; JSON hỏng trả 400 thay vì 500 |

### Những gì hệ thống **chưa** làm (ghi trung thực)

| Hạng mục | Trạng thái | Lý do / kế hoạch |
| :--- | :--- | :--- |
| Kiểm thử xâm nhập (penetration test) | **CHƯA LÀM** | Đề BT3 ghi rõ đây là nội dung thuộc Chuyên đề tốt nghiệp 2, không phải phạm vi BT3. Đã làm checklist 7 mục ở mức nhận biết OWASP. |
| Ghi log có mã yêu cầu (request id) | **CHƯA LÀM** | Prototype chưa có tầng logging trung tâm. Kế hoạch: thêm middleware sinh `requestId` và gắn vào mọi dòng log trước khi triển khai thật. |
| Giao diện quản trị tài khoản người dùng | **CHƯA LÀM** | 4 tài khoản demo được định nghĩa trong mã (`src/services/auth.service.js`). Kế hoạch: đưa tài khoản vào bảng `user` có mật khẩu băm và cấp quyền theo vai trò. |
| Xoá vật lý bản ghi | **CHƯA LÀM (cố ý)** | Quy tắc QT-13 quy định **không** xoá vật lý. `DELETE /api/tickets/{id}` chỉ cho phép xoá phiếu ở trạng thái `MOI`; `DELETE /api/technicians/{id}` là **soft delete** (`is_active = false`). |
| Mã hoá dữ liệu lưu trữ (encryption at rest) | **CHƯA LÀM** | Prototype chạy trên PostgreSQL container không mã hoá. Kế hoạch: bật `pgcrypto` cho cột nhạy cảm khi triển khai thật. |
| Ghi nhật ký truy cập (audit log) | **CHƯA LÀM** | Lịch sử thay đổi trạng thái đã được ghi trong `ticket.status_history` (JSONB, có `by` và `at`). Kế hoạch: bổ sung bảng `audit_log` cho thao tác quản trị. |
