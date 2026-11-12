# Triển khai Cloud: Render (API + PostgreSQL) + Vercel (Frontend)

> **Mục đích:** đưa hệ thống Smart CRM — Luồng L4 lên Internet để lấy điểm công
> triển khai, chỉ với thao tác chọn repo trên giao diện Render/Vercel và thêm
> đúng các biến môi trường ghi trong tài liệu này.
>
> **Kiến trúc sau khi deploy**
>
> ```
> Trình duyệt
>    │  HTTPS
>    ▼
> Vercel (React 18 + Vite, static)  ──fetch HTTPS──►  Render Web Service (Node 20 + Express + Prisma)
>                                                              │
>                                                              ▼
>                                                     Render PostgreSQL 16
> ```
>
> - Frontend: Vercel — chỉ chứa file tĩnh sau `npm run build`.
> - Backend: Render — chạy `migrate deploy` + seed + Express.
> - Database: Render PostgreSQL — Render tự sinh `DATABASE_URL` và inject vào API.

---

## 0. Chuẩn bị trước khi bấm deploy

| Việc cần làm | Kiểm tra |
| :--- | :--- |
| Code đã push lên GitHub, nhánh chính là `main` | `git status` sạch, `git log -1` có commit mới nhất |
| Repo có `render.yaml` ở thư mục gốc | `dir render.yaml` / `ls render.yaml` |
| Repo có `vercel.json` ở gốc và trong `frontend/` | `ls vercel.json frontend/vercel.json` |
| Tài khoản GitHub đã kết nối với Render và Vercel | Đăng nhập bằng GitHub ở cả hai nơi |

> **Thứ tự bắt buộc:** **Render trước → lấy URL API → Vercel sau → quay lại Render
> cập nhật CORS.** Làm ngược lại sẽ bị lỗi CORS hoặc frontend gọi sai địa chỉ.

---

## 1. Deploy Backend + Database trên Render

### 1.1. Tạo bằng Blueprint (khuyến nghị — gần như tự động)

1. Vào <https://dashboard.render.com> → **New** → **Blueprint**.
2. Chọn **GitHub** → chọn repo `Cdtn1-NguyenTranHoangVinh-L4`.
3. Render đọc `render.yaml` và hiện ra:
   - 1 **PostgreSQL** tên `mekong-crm-db` (plan Free, region Singapore).
   - 1 **Web Service** tên `mekong-crm-api` (runtime Node, plan Free).
4. Bấm **Apply** / **Create Resources**.
5. Chờ khoảng 2–5 phút. Trạng thái phải chuyển thành **Live**.

Render tự làm các việc sau, **không cần làm tay**:

| Render tự làm | Nhờ vào đâu |
| :--- | :--- |
| Cài dependencies | `buildCommand: npm ci && npx prisma generate` |
| Tạo 6 bảng từ CSDL trống | `npm run db:setup` → `prisma migrate deploy` |
| Nạp dữ liệu mẫu (idempotent) | `node prisma/seed.js` |
| Chạy API | `npm start` → `node src/server.js` |
| Sinh `JWT_SECRET` ngẫu nhiên | `generateValue: true` trong `render.yaml` |
| Nối database vào API | `fromDatabase: mekong-crm-db` → biến `DATABASE_URL` |

### 1.2. Nếu Render không tự nhận `render.yaml` (tạo tay)

Chọn **New** → **Web Service** → chọn repo, rồi điền đúng bảng sau:

| Trường trên Render | Giá trị |
| :--- | :--- |
| Language / Runtime | **Node** |
| Region | **Singapore** (gần Việt Nam nhất) |
| Branch | `main` |
| Root Directory | *(để trống)* |
| Build Command | `npm ci && npx prisma generate` |
| Start Command | `npm run db:setup && npm start` |
| Health Check Path | `/health` |
| Plan | **Free** |

Sau đó tạo database: **New** → **Postgres** → đặt tên `mekong-crm-db`, region
Singapore, plan Free. Vào Web Service → **Environment** → thêm biến
`DATABASE_URL` = **Internal Database URL** của PostgreSQL vừa tạo.

### 1.3. Bảng biến môi trường Backend (Render)

| Biến | Giá trị | Bắt buộc | Ghi chú |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | Render tự inject | ✅ | Không sửa tay nếu dùng Blueprint |
| `JWT_SECRET` | Render tự sinh | ✅ | Không commit giá trị thật |
| `JWT_EXPIRES_IN` | `8h` | ➖ | Có trong `render.yaml` |
| `NODE_ENV` | `production` | ✅ | Có trong `render.yaml` |
| `NODE_VERSION` | `20` | ➖ | Ghim Node 20 LTS |
| `API_PREFIX` | `/api` | ➖ | Có trong `render.yaml` |
| `ALLOW_DEV_AUTH_HEADERS` | `false` | ✅ | Bắt buộc JWT thật; chặn mạo danh bằng header `x-user-role` |
| `CORS_ORIGIN` | `https://<vercel-app>.vercel.app` | ✅ | **Cập nhật sau khi có URL Vercel** |
| `FRONTEND_URL` | `https://<vercel-app>.vercel.app` | ✅ | Dùng cho root endpoint/health |
| `PORT` | Render tự cấp | ➖ | Không đặt tay; code đọc `process.env.PORT` |

### 1.4. Kiểm tra Backend sau khi Render báo Live

Mở trình duyệt:

```
https://mekong-crm-api.onrender.com/health
```

Kết quả đúng (status 200):

```json
{"status":"UP","uptime":12.3,"timestamp":"2026-11-12T...","service":"Mekong Mobile CRM - Luồng L4 (Phân công KTV & Lịch hẹn)","version":"0.2.0"}
```

Kiểm tra đăng nhập bằng PowerShell/CMD:

```powershell
curl.exe -s -X POST https://mekong-crm-api.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"manager_tt2\",\"password\":\"password123\"}"
```

Kết quả đúng có `"success":true` và một chuỗi `"token":"eyJ..."`.

> **Free tier:** Web Service sẽ ngủ sau ~15 phút không có request. Request đầu
> tiên đánh thức mất 30–60 giây. Đây là hành vi của Render, không phải app lỗi.
> Khi chấm bài, nên mở `/health` trước 1 phút để "làm nóng" dịch vụ.

---

## 2. Deploy Frontend trên Vercel

1. Vào <https://vercel.com/new> → **Import Git Repository** → chọn
   `Cdtn1-NguyenTranHoangVinh-L4`.
2. Cấu hình project:

| Trường trên Vercel | Giá trị |
| :--- | :--- |
| Project Name | `mekong-crm-l4` (hoặc tên bất kỳ) |
| Framework Preset | **Vite** |
| Root Directory | **`frontend`** *(khuyến nghị)* |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |

> Nếu **để trống Root Directory**, Vercel sẽ dùng `vercel.json` ở thư mục gốc
> repo — file này đã cấu hình sẵn việc build trong `frontend/`. Cả hai cách đều
> chạy được; cách đặt Root Directory = `frontend` rõ ràng hơn khi chấm.

3. Mở **Environment Variables** → thêm:

| Biến | Giá trị | Môi trường |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://mekong-crm-api.onrender.com` | Production, Preview, Development |

> Không có dấu `/` ở cuối URL. Biến này được **nhúng vào bundle lúc build**,
> nên nếu sửa sau đó phải bấm **Redeploy** mới có hiệu lực.

4. Bấm **Deploy** → chờ 1–2 phút → nhận URL dạng
   `https://mekong-crm-l4.vercel.app`.

5. Mở URL đó. Giao diện phải hiện **MEKONG MOBILE CRM** và đăng nhập được bằng
   `manager_tt2` / `password123`.

---

## 3. Nối CORS giữa Vercel và Render (bước dễ quên nhất)

Sau khi có URL Vercel thật:

1. Render Dashboard → service `mekong-crm-api` → **Environment**.
2. Sửa 2 biến:

```text
CORS_ORIGIN = https://mekong-crm-l4.vercel.app
FRONTEND_URL = https://mekong-crm-l4.vercel.app
```

3. Bấm **Save Changes**. Render sẽ restart service (khoảng 30–60 giây).

> Nếu muốn mọi **Preview Deployment** của Vercel cũng gọi được API, khai báo
> thêm wildcard (hỗ trợ từ phiên bản BT3 này):
>
> ```text
> CORS_ORIGIN = https://mekong-crm-l4.vercel.app,https://*.vercel.app
> ```
>
> Chỉ dùng wildcard `https://*.vercel.app` cho đồ án/demo. Khi triển khai thật,
> hãy đặt đúng domain production.

Kiểm tra nhanh CORS bằng DevTools (F12) → tab **Network** → gọi API → response
phải có header `access-control-allow-origin: https://mekong-crm-l4.vercel.app`.

---

## 4. Nghiệm thu sau deploy (dùng làm minh chứng báo cáo)

Chạy lần lượt 5 bước, chụp màn hình từng bước:

| # | Việc kiểm tra | Lệnh / thao tác | Kết quả đúng |
| :---: | :--- | :--- | :--- |
| 1 | API sống | Mở `https://mekong-crm-api.onrender.com/health` | `"status":"UP"` |
| 2 | Đăng nhập | `POST /api/auth/login` với `manager_tt2` | `"success":true`, có `token` |
| 3 | Đọc dữ liệu | `GET /api/tickets/unassigned?centerId=2` kèm Bearer token | `"total":2` |
| 4 | Frontend sống | Mở URL Vercel | Trang đăng nhập hiện ra |
| 5 | Luồng nghiệp vụ | Đăng nhập → mở phiếu chờ điều phối → mở modal phân công | Danh sách KTV `proficiency >= 3` hiện ra |

Lệnh kiểm tra 2–3 trên PowerShell:

```powershell
$login = curl.exe -s -X POST https://mekong-crm-api.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"manager_tt2\",\"password\":\"password123\"}" | ConvertFrom-Json
$token = $login.data.token
curl.exe -s "https://mekong-crm-api.onrender.com/api/tickets/unassigned?centerId=2" `
  -H "Authorization: Bearer $token"
```

**Ảnh cần chụp để đưa vào báo cáo BT3 (Mục 7 — Ảnh chụp minh chứng):**

1. Render Dashboard: service `mekong-crm-api` trạng thái **Live** + database **Available**.
2. Trình duyệt mở `/health` trả `"status":"UP"`.
3. Vercel Dashboard: deployment **Ready** + URL production.
4. Trình duyệt mở URL Vercel, đăng nhập thành công.
5. DevTools → Network: request `/api/tickets/unassigned` trả 200 và có header CORS.
6. (Nên có) Màn hình phân công KTV hoạt động trên bản online.

---

## 5. Xử lý sự cố khi deploy

| Hiện tượng | Nguyên nhân thường gặp | Cách sửa |
| :--- | :--- | :--- |
| Render build lỗi `Cannot find module '@prisma/client'` | Chưa chạy `prisma generate` | Giữ `npx prisma generate` trong Build Command |
| Render build lỗi `npm ci` lệch lockfile | `package-lock.json` không khớp `package.json` | Chạy `npm install` ở máy, commit lại lockfile |
| Render Live nhưng `/health` 502 | App crash lúc khởi động | Xem **Logs**; thường do thiếu `DATABASE_URL` hoặc `JWT_SECRET` |
| Log báo `Can't reach database server` | Dùng External URL sai, hoặc DB chưa Available | Dùng **Internal Database URL** khi API và DB cùng region Render |
| Log báo `P1001` / SSL | Dùng PostgreSQL bên ngoài (Neon…) thiếu SSL | Thêm `?sslmode=require` vào `DATABASE_URL` |
| `relation "ticket" does not exist` | Chưa chạy migrate | Kiểm tra Start Command có `npm run db:setup` |
| Frontend báo `Failed to fetch` | `VITE_API_BASE_URL` sai/thiếu | Sửa biến trên Vercel → **Redeploy** |
| Console báo CORS policy | `CORS_ORIGIN` chưa đúng URL Vercel | Cập nhật `CORS_ORIGIN` trên Render → Save |
| Vercel 404 khi F5 | Thiếu SPA rewrite | Đã có trong `vercel.json`; kiểm tra đúng Root Directory |
| Trang tải chậm lần đầu | Render Free đang ngủ | Chờ 30–60 giây, hoặc nâng plan |
| Database biến mất sau một thời gian | PostgreSQL Free của Render hết hạn | Tạo DB mới, cập nhật `DATABASE_URL`, restart API (xem mục 6) |
| Blueprint báo `Only one Free Postgres database` | Mỗi workspace chỉ có 1 DB Free đang hoạt động | Xoá DB Free cũ hoặc dùng Neon (mục 6) |
| API trả 401 dù đã đăng nhập | Token hết hạn, hoặc `JWT_SECRET` đổi sau khi cấp token | Đăng xuất rồi đăng nhập lại; không đổi `JWT_SECRET` khi đang demo |
| Bấm "Đổi vai trò" bị quay về trang đăng nhập | Render đang cold start hoặc lỗi mạng | Chờ 30–60 giây, đăng nhập lại bằng tài khoản mong muốn |

---

## 6. Phương án Database thay thế: Neon (free, không hết hạn theo ngày)

Nếu PostgreSQL Free của Render đã hết hạn hoặc không tạo được:

1. Tạo project tại <https://neon.tech> → copy **Connection string** dạng:
   ```text
   postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
2. Render → service `mekong-crm-api` → **Environment** → sửa `DATABASE_URL` bằng
   chuỗi trên.
3. Bấm **Manual Deploy** → **Deploy latest commit** (hoặc restart). Start Command
   sẽ tự chạy migrate + seed lại.
4. Kiểm tra `/health`, sau đó đăng nhập và đếm dữ liệu mẫu.

> Không cần tạo bảng tay: `prisma migrate deploy` trong `npm run db:setup` lo
> toàn bộ schema; `seed.js` nạp 6/6/8/4/4/4 bản ghi.

---

## 7. Chi phí và giới hạn của gói Free

| Thành phần | Gói Free | Ảnh hưởng khi chấm bài |
| :--- | :--- | :--- |
| Render Web Service | Ngủ sau ~15 phút, cold start 30–60 s | Lần mở đầu tiên chậm; nên làm nóng trước |
| Render PostgreSQL | Có thời hạn (hiện 30 ngày) | Hết hạn thì tạo DB mới/Neon như mục 6 |
| Vercel Hobby | Băng thông và build trong hạn mức cá nhân | Quá đủ cho demo đồ án |
| HTTPS | Miễn phí trên cả hai nền tảng | Bắt buộc để tránh mixed content |

---

## 8. Việc cần bổ sung vào báo cáo BT3 sau khi deploy xong

Sau khi có URL thật, cập nhật các chỗ sau (đánh dấu `TODO` trong repo):

1. `README.md` — mục **Live demo**: điền URL Vercel + URL API Render.
2. `docs/deployment-guide.md` — mục **Cloud deployment**: điền URL thật vào bảng
   nghiệm thu (nếu muốn).
3. `BT3_2374802010562_NguyenTranHoangVinh.docx` — Mục 4 đã có tiểu mục **4.6
   Cloud deployment**; chỉ cần thay `<vercel-project>` bằng URL thật và chèn ảnh
   chụp vào Mục 7.
4. `docs/thay-doi-thiet-ke.md` — Thay đổi 21–22 đã ghi nhận hạ tầng cloud; cập nhật
   URL nếu cần.

> Gợi ý đặt tên file ảnh theo thứ tự chụp, ví dụ
> `docs/screenshots/cloud-01-render-live.png` … `cloud-06-assign-online.png`,
> rồi chèn vào báo cáo để người chấm đối chiếu nhanh.

---

## 9. Mẫu tiểu mục 4.6 để dán vào báo cáo BT3

Báo cáo BT3 giữ Mục 4 bằng tiếng Anh. Sau khi deploy xong, dán khối dưới đây vào
`BT3_2374802010562_NguyenTranHoangVinh.docx` ngay sau tiểu mục **4.5.4**, rồi thay
các chỗ `<...>` bằng URL/ảnh thật.

```text
4.6.  Cloud deployment — Render (API + PostgreSQL) and Vercel (Web UI)

The public deployment keeps the same codebase as the Docker setup. The API and the
PostgreSQL 16 database run on Render; the static React/Vite build runs on Vercel.
The repository ships render.yaml, vercel.json and frontend/vercel.json, so selecting
the repository is enough. Only three values are entered manually:
VITE_API_BASE_URL on Vercel; CORS_ORIGIN and FRONTEND_URL on Render.

Deployment order. (1) Render → New → Blueprint → select the repository → Apply.
Render creates the PostgreSQL instance and the Node 20 web service, injects
DATABASE_URL and generates JWT_SECRET. (2) Wait until GET /health returns
"status":"UP". (3) Vercel → Add New → Project → import the same repository →
Root Directory = frontend → set VITE_API_BASE_URL to the Render API URL → Deploy.
(4) Return to Render and set CORS_ORIGIN and FRONTEND_URL to the Vercel production
URL, then save. The API restarts automatically.

Build and start commands on Render:
  Build:  npm ci && npx prisma generate
  Start:  npm run db:setup && npm start
The start command runs prisma migrate deploy, then the idempotent seed
(6 / 6 / 8 / 4 / 4 / 4 records), then node src/server.js. The health check path is
/health. Node 20 LTS is pinned by .nvmrc and engines.node.

Live URLs:
  Web UI:  https://<vercel-project>.vercel.app
  API:     https://mekong-crm-api.onrender.com

Verification (screenshots in section 7):
  1. Render service Live + PostgreSQL Available.
  2. GET /health returns "status":"UP".
  3. POST /api/auth/login with manager_tt2 returns success and a JWT.
  4. GET /api/tickets/unassigned?centerId=2 with the token returns "total":2.
  5. The Vercel URL shows the login page; signing in loads the dashboard.
  6. Opening the assignment modal lists technicians with proficiency >= 3.

Free-tier note. The Render web service sleeps after ~15 minutes without traffic and
takes 30–60 seconds to wake. The free PostgreSQL instance expires 30 days after
creation; docs/trien-khai-cloud.md section 6 documents the Neon replacement.
```