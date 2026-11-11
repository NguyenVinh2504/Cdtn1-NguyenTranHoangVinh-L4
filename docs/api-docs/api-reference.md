# API Reference — Mekong Mobile Smart CRM (Flow L4, track SE)

> **System:** Smart CRM – Mekong Mobile, flow **L4 — Technician assignment and appointment scheduling**
> **Base URL (local):** `http://localhost:3000` · **API prefix:** `/api`
> **Version:** 0.2.0 · **Tag:** `v1.0`
> **Author:** Nguyen Tran Hoang Vinh — MSSV 2374802010562
> **Guide language:** English (as required by Assignment 3, track SE)

This document describes **all 17 business endpoints** of the backend plus the 2
infrastructure endpoints (`/`, `/health`). Every request and response example below was
**captured from a real running system** (Docker Compose stack, PostgreSQL 16) — they are
transcripts, not hand-written illustrations.

---

## Table of contents

1. [Conventions](#1-conventions)
2. [Authentication](#2-authentication)
3. [Infrastructure endpoints](#3-infrastructure-endpoints)
4. [Ticket endpoints](#4-ticket-endpoints)
5. [Technician endpoints](#5-technician-endpoints)
6. [Error catalogue](#6-error-catalogue)
7. [Full endpoint index](#7-full-endpoint-index)

---

## 1. Conventions

### 1.1 Base URL and content type

```
Base URL:  http://localhost:3000
Prefix:    /api
Content-Type: application/json
```

All request and response bodies are JSON (`application/json`), except `GET /health` and
`GET /` which also return JSON but are not under the `/api` prefix.

### 1.2 Authentication

Every business endpoint under `/api/**` requires a JSON Web Token:

```
Authorization: Bearer <token>
```

The token is obtained from `POST /api/auth/login`. Requests without a valid token receive
**HTTP 401** with the error code `XAC_THUC_KHONG_HOP_LE`.

### 1.3 Success envelope

```json
{
  "success": true,
  "data": { "...": "..." }
}
```

Some endpoints add a `message` field:

```json
{
  "success": true,
  "message": "Phân công kỹ thuật viên thành công",
  "data": { "...": "..." }
}
```

List endpoints add a `total` field next to the array:

```json
{
  "success": true,
  "data": [ { "...": "..." } ],
  "total": 2
}
```

### 1.4 Error envelope

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

| Field | Type | Meaning |
| :--- | :--- | :--- |
| `success` | boolean | Always `false` in an error response |
| `error` | string | **Business error code** (upper snake case). This is the stable, machine-readable identifier |
| `message` | string | Human-readable description (Vietnamese) |
| `chiTiet` | array \| null | Field-level details when the failure is a validation failure; `null` otherwise |

> The `error` code is the field to rely on in client code. The `message` text may be
> reworded; the code will not.

### 1.5 Data masking (rule QT-15)

Customer phone numbers are masked for the `TECHNICIAN` role (`090****567`); the
`CENTER_MANAGER` role sees the full number. Masking is applied by a response middleware, so
it applies uniformly to every endpoint that returns a customer object.

### 1.6 Business rules referenced in this document

| Rule | Meaning |
| :--- | :--- |
| QT-04 | SLA due date computed from the priority (`CAO` 24 h, `TRUNG_BINH` 72 h, `THAP` 120 h), working days only |
| QT-06 | Ticket status lifecycle, no going backwards |
| QT-07 | A ticket has at most one assigned technician; reassignment requires a `note` |
| QT-08 | A technician may only be assigned when `proficiency >= 3` **and** same `centerId` |
| QT-11 | A technician holding 8 or more open tickets cannot receive another one |
| QT-13 | Soft delete only — no physical deletion of records |
| QT-14 | Data scope by role: a technician only sees their own tickets |
| QT-15 | Customer phone numbers are masked for technicians |

### 1.7 Ticket status lifecycle (QT-06)

```
MOI → DA_PHAN_CONG → DANG_XU_LY → CHO_LINH_KIEN → HOAN_TAT → DA_DONG
                                                  ↓
                                            DA_HUY
```

The only permitted exception is `CHO_LINH_KIEN → DANG_XU_LY` (the replacement part has
arrived, work continues). A transition to the *current* status is rejected.

### 1.8 Roles used in the examples

| Username | Password | Role | Centre |
| :--- | :--- | :--- | :---: |
| `manager_tt2` | `password123` | `CENTER_MANAGER` | 2 |
| `ktv_nguyenvana` | `password123` | `TECHNICIAN` (id 3) | 2 |
| `ktv_dohuuthang` | `password123` | `TECHNICIAN` (id 5) | 2 |
| `ktv_lequocbao` | `password123` | `TECHNICIAN` (id 6, proficiency 2) | 2 |

---

## 2. Authentication

### 2.1 `POST /api/auth/login`

**Method and path:** `POST /api/auth/login`

**Business description.** Exchanges a username and a password for a signed JSON Web Token.
The token carries the user id, full name, role and centre id, and carries the authorisation
scope for every subsequent request. This is the only endpoint that does **not** require a
token.

**Authentication required:** No — this is the token-issuing endpoint.

**Parameters and request body**

| Field | Type | Required | Constraints |
| :--- | :--- | :---: | :--- |
| `username` | string | yes | non-empty |
| `password` | string | yes | non-empty |

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZnVsbE5hbWUiOiJUcuG6p24gVsSDbiBRdeG6o24gTMO9IChUVDIpIiwicm9sZSI6IkNFTlRFUl9NQU5BR0VSIiwiY2VudGVySWQiOjIsImlhdCI6MTc5NDQwNjk2OCwiZXhwIjoxNzk0NDM1NzY4fQ.zmKBuFpIYxiM1BDhfD2TD8gPHZ5KxQD1NAcpvfBh26o",
    "user": {
      "id": 1,
      "fullName": "Trần Văn Quản Lý (TT2)",
      "role": "CENTER_MANAGER",
      "centerId": 2
    }
  }
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Wrong username or password |
| `DU_LIEU_KHONG_HOP_LE` | 400 | `username` or `password` missing / empty |

**Error example — wrong password (HTTP 401)**

```json
{
  "success": false,
  "error": "XAC_THUC_KHONG_HOP_LE",
  "message": "Tên đăng nhập hoặc mật khẩu không chính xác",
  "chiTiet": null
}
```

**Notes and limitations**

- The token lifetime is controlled by `JWT_EXPIRES_IN` (default `8h`). After expiry every
  request returns HTTP 401 with `TOKEN_HET_HAN`.
- There is no refresh-token endpoint and no logout endpoint in this release. The client
  simply discards the token.
- The four accounts above are **sample data**; their passwords are stored as bcrypt hashes
  and are intentionally identical so that the system can be evaluated without setup.

---

## 3. Infrastructure endpoints

### 3.1 `GET /health`

**Method and path:** `GET /health`

**Business description.** Liveness and readiness probe for the backend. Used by the Docker
health check of the `api` service, by the `web` service's `depends_on: service_healthy`
condition, and by the deployment verification procedure.

**Authentication required:** No.

**Parameters and request body:** none.

**Successful response (HTTP 200)**

```json
{
  "status": "UP",
  "uptime": 129.016174971,
  "timestamp": "2026-11-11T14:42:24.156Z",
  "service": "Mekong Mobile CRM - Luồng L4 (Phân công KTV & Lịch hẹn)",
  "version": "0.2.0"
}
```

**Error codes:** none — this endpoint never returns an error body.

**Notes and limitations**

- The endpoint reports **process** liveness. It does **not** open a database connection, so
  it can still return `UP` while PostgreSQL is down. For a dependency-aware check, query a
  business endpoint instead (it returns HTTP 500 when the database is unreachable).
- The `web` container has its own probe, `GET /health` on port 5173, returning
  `{"status":"FRONTEND_UP"}`.

### 3.2 `GET /`

**Method and path:** `GET /`

**Business description.** Service banner. Lists the API prefix and the URL of the frontend
web UI, which is handy when several instances are running on the same machine.

**Authentication required:** No.

**Parameters and request body:** none.

**Successful response (HTTP 200)**

```json
{
  "message": "Mekong Mobile CRM - Backend API Server (Luồng L4)",
  "version": "0.2.0",
  "health": "/health",
  "apiPrefix": "/api",
  "frontendUrl": "http://localhost:5173"
}
```

**Error codes:** none.

**Notes and limitations**

- Informational only; it performs no I/O.

---

## 4. Ticket endpoints

### 4.1 `GET /api/tickets`

**Method and path:** `GET /api/tickets`

**Business description.** Lists warranty tickets with pagination and filtering. For the
`TECHNICIAN` role the scope is silently narrowed to the tickets assigned to that technician
(QT-14); the `technicianId` filter supplied by the client is ignored for technicians.

**Authentication required:** Yes — JWT required.

**Query parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `centerId` | integer | no | Filter by service centre. Defaults to the caller's `centerId`. **Ignored** for `TECHNICIAN` (QT-14) |
| `status` | string | no | One of `MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`, `HOAN_TAT`, `DA_DONG`, `DA_HUY` |
| `categoryId` | integer | no | Filter by issue category (`1`–`6`). **Ignored** for `TECHNICIAN` |
| `priority` | string | no | `CAO`, `TRUNG_BINH`, `THAP`. **Ignored** for `TECHNICIAN` |
| `limit` | integer | no | Maximum rows to return, default `50` |
| `offset` | integer | no | Number of rows to skip, default `0` |

**Request body:** none (read-only endpoint).

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "data": [
    {
      "ticketId": 1,
      "ticketCode": "BH-2-00001/2026",
      "customerId": 1,
      "deviceId": 1,
      "centerId": 2,
      "technicianId": null,
      "categoryId": 1,
      "issueDesc": "Màn hình bị sọc xanh dọc thân máy sau khi va chạm nhẹ, cảm ứng góc phải bị liệt",
      "priority": "CAO",
      "status": "MOI",
      "receivedAt": "2026-11-11T11:55:20.571Z",
      "dueDate": "2026-11-12T11:55:20.571Z",
      "closedAt": null,
      "statusHistory": [
        { "at": "2026-11-11T11:57:09.072Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu mới" }
      ],
      "appointmentAt": null,
      "appointmentStatus": null,
      "customer": {
        "customerId": 1,
        "fullName": "Nguyễn Thị Mai",
        "phone": "0901234567",
        "email": "mai.nguyen@gmail.com",
        "address": "Quận 10, TP.HCM",
        "segment": "VIP",
        "createdAt": "2026-11-11T13:55:20.546Z"
      },
      "device": {
        "deviceId": 1,
        "customerId": 1,
        "serialNo": "MK-IP15P-9921",
        "productName": "iPhone 15 Pro Max 256GB",
        "purchaseDate": null,
        "warrantyMonths": 12,
        "createdAt": "2026-11-11T13:55:20.559Z"
      },
      "category": { "categoryId": 1, "categoryName": "MAN_HINH", "defaultPriority": "CAO", "isActive": true },
      "technician": null
    }
  ],
  "total": 4
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |

**Error example — no token (HTTP 401)**

```json
{
  "success": false,
  "error": "XAC_THUC_KHONG_HOP_LE",
  "message": "Yêu cầu đăng nhập trước khi thực hiện",
  "chiTiet": null
}
```

**Notes and limitations**

- `total` counts the rows matching the **filter**, not the rows in the current slice (`limit`/`offset`).
- The phone number of the customer is fully visible for `CENTER_MANAGER` and masked for
  `TECHNICIAN` (QT-15).
- Sorting is by `receivedAt` descending for `CENTER_MANAGER`, and by `dueDate` ascending
  for `TECHNICIAN` (QT-04).

---

### 4.2 `GET /api/tickets/unassigned`

**Method and path:** `GET /api/tickets/unassigned`

**Business description.** Lists the tickets of a centre that are still waiting for a
technician (`status = 'MOI'` and `technician_id IS NULL`). This is the work queue of the
centre manager.

**Authentication required:** Yes — JWT required. **Only the `CENTER_MANAGER` role** may call
this endpoint.

**Query parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `centerId` | integer | no | Service centre. Defaults to the caller's own centre (or `2`) |
| `priority` | string | no | Filter by priority (`CAO`, `TRUNG_BINH`, `THAP`) |
| `categoryId` | integer | no | Filter by issue category id |
| `limit` | integer | no | Maximum rows to return, default `50` |
| `offset` | integer | no | Number of rows to skip, default `0` |

**Request body:** none.

**Successful response (HTTP 200)**

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
      "customer": { "customerId": 2, "fullName": "Trần Văn Nam", "phone": "0912345678", "email": "nam.tran@yahoo.com", "address": "Tân Bình, TP.HCM", "segment": "THUONG_XUYEN", "createdAt": "2026-11-11T13:55:20.550Z" },
      "device": { "deviceId": 2, "customerId": 2, "serialNo": "MK-SS24U-7712", "productName": "Samsung Galaxy S24 Ultra", "purchaseDate": null, "warrantyMonths": 24, "createdAt": "2026-11-11T13:55:20.563Z" },
      "category": { "categoryId": 2, "categoryName": "PIN", "defaultPriority": "TRUNG_BINH", "isActive": true }
    }
  ],
  "total": 2
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `KHONG_CO_QUYEN` | 403 | The caller is a `TECHNICIAN` |

**Error example — technician calling (HTTP 403)**

```json
{
  "success": false,
  "error": "KHONG_CO_QUYEN",
  "message": "Bạn không có quyền xem danh sách phiếu chờ phân công của trung tâm",
  "chiTiet": null
}
```

**Notes and limitations**

- Tickets are sorted by `received_at` **ascending** — the oldest ticket is at the top, which
  matches the SLA-first working policy (QT-04).
- The list only contains tickets that are still unassigned; as soon as a technician is
  assigned the ticket disappears from this queue.

---

### 4.3 `GET /api/tickets/technician/mine`

**Method and path:** `GET /api/tickets/technician/mine`

**Business description.** Lists the tickets assigned to the signed-in technician, sorted by
the committed due date so that the most urgent work appears first (QT-04, QT-14).

**Authentication required:** Yes — JWT required.

**Query parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `technicianId` | integer | no | For `TECHNICIAN`, specifying any id other than their own returns **HTTP 403 `KHONG_CO_QUYEN`**. For `CENTER_MANAGER`, selects which technician's queue to view |
| `status` | string | no | Optional status filter |
| `limit` | integer | no | Maximum rows to return, default `50` |
| `offset` | integer | no | Number of rows to skip, default `0` |

**Request body:** none.

**Successful response (HTTP 200)**

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

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `KHONG_CO_QUYEN` | 403 | The caller asked for another technician's tickets |

**Error example — asking for another technician (HTTP 403)**

```json
{
  "success": false,
  "error": "KHONG_CO_QUYEN",
  "message": "Bạn không có quyền xem phiếu bảo hành của kỹ thuật viên khác",
  "chiTiet": null
}
```

**Notes and limitations**

- The customer phone is masked (`093****789`) — the endpoint path contains `/technician`,
  so the phone-masking middleware masks customer and centre phone numbers (QT-15).
- Without `?status=...`, all tickets assigned to that technician are returned, sorted by
  `dueDate` ascending. Pass `?status=...` to filter by a specific status.

---

### 4.4 `GET /api/tickets/{id}`

**Method and path:** `GET /api/tickets/{id}`

**Business description.** Returns the full detail of one warranty ticket, including the
customer, the device, the service centre and the assigned technician.

**Authentication required:** Yes — JWT required.

**Path parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | integer | yes | `ticketId` of the ticket |

**Request body:** none.

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "data": {
    "ticketId": 1,
    "ticketCode": "BH-2-00001/2026",
    "customerId": 1,
    "deviceId": 1,
    "centerId": 2,
    "technicianId": null,
    "categoryId": 1,
    "issueDesc": "Màn hình bị sọc xanh dọc thân máy sau khi va chạm nhẹ, cảm ứng góc phải bị liệt",
    "priority": "CAO",
    "status": "MOI",
    "receivedAt": "2026-11-11T11:55:20.571Z",
    "dueDate": "2026-11-12T11:55:20.571Z",
    "closedAt": null,
    "statusHistory": [
      { "at": "2026-11-11T11:57:09.072Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu mới" }
    ],
    "appointmentAt": null,
    "appointmentStatus": null,
    "customer": { "customerId": 1, "fullName": "Nguyễn Thị Mai", "phone": "0901234567", "email": "mai.nguyen@gmail.com", "address": "Quận 10, TP.HCM", "segment": "VIP", "createdAt": "2026-11-11T13:55:20.546Z" },
    "device": { "deviceId": 1, "customerId": 1, "serialNo": "MK-IP15P-9921", "productName": "iPhone 15 Pro Max 256GB", "purchaseDate": null, "warrantyMonths": 12, "createdAt": "2026-11-11T13:55:20.559Z" },
    "serviceCenter": { "centerId": 2, "centerName": "TTBH Mekong Tân Bình", "address": "456 Cộng Hòa, P.13, Q.Tân Bình", "phone": "02838442233", "city": "TP.HCM", "isActive": true },
    "technician": null,
    "category": { "categoryId": 1, "categoryName": "MAN_HINH", "defaultPriority": "CAO", "isActive": true }
  }
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `KHONG_CO_QUYEN` | 403 | A `TECHNICIAN` tries to read a ticket not assigned to them (QT-14, A01) |
| `PHIEU_KHONG_TON_TAI` | 404 | No ticket with that id |

**Error example — technician reading another technician's ticket (HTTP 403)**

```json
{
  "success": false,
  "error": "KHONG_CO_QUYEN",
  "message": "Bạn không có quyền xem phiếu bảo hành của kỹ thuật viên khác",
  "chiTiet": null
}
```

**Error example — unknown id (HTTP 404)**

```json
{
  "success": false,
  "error": "PHIEU_KHONG_TON_TAI",
  "message": "Không tìm thấy phiếu bảo hành ID 99999",
  "chiTiet": null
}
```

**Notes and limitations**

- Ownership scope is enforced on read (QT-14 / A01, fixed in BUG-07): a `TECHNICIAN`
  opening a ticket assigned to another technician (or unassigned) receives **HTTP 403
  `KHONG_CO_QUYEN`**. A `CENTER_MANAGER` can read any ticket.
- For `TECHNICIAN`, customer phone numbers in the response are masked (`090****567`, QT-15).
- `statusHistory` is read directly from the JSONB column `ticket.status_history`.

---

### 4.5 `POST /api/tickets`

**Method and path:** `POST /api/tickets`

**Business description.** Registers a new warranty ticket at a service centre. The ticket
code is generated automatically in the form `BH-{centerId}-{sequence}/{year}`, and the SLA
due date is computed from the priority using working days only (QT-04).

**Authentication required:** Yes — JWT required. Intended for the `CENTER_MANAGER` role.

**Request body**

| Field | Type | Required | Constraints |
| :--- | :--- | :---: | :--- |
| `customerId` | integer | yes | positive integer, must reference an existing customer |
| `deviceId` | integer | yes | positive integer, must reference an existing device of that customer |
| `centerId` | integer | yes | positive integer, must reference an existing service centre |
| `categoryId` | integer | no | issue category; defaults to `null` |
| `issueDesc` | string | yes | **minimum 10 characters** |
| `priority` | string | yes | `CAO`, `TRUNG_BINH` or `THAP` |

**Successful response (HTTP 201)**

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
    "receivedAt": "2026-11-11T17:13:04.268Z",
    "dueDate": "2026-11-12T17:13:04.214Z",
    "closedAt": null,
    "statusHistory": [
      { "at": "2026-11-11T17:13:04.268Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu mới tại trung tâm" }
    ],
    "appointmentAt": null,
    "appointmentStatus": null,
    "customer": { "customerId": 3, "fullName": "Lê Thị Thu", "phone": "0933456789", "email": "thu.le@gmail.com", "address": "Thủ Đức, TP.HCM", "segment": "MOI", "createdAt": "2026-11-11T17:12:17.676Z" },
    "device": { "deviceId": 3, "customerId": 3, "serialNo": "MK-XIA14-3341", "productName": "Xiaomi 14 Ultra", "purchaseDate": null, "warrantyMonths": 18, "createdAt": "2026-11-11T17:12:17.688Z" },
    "category": { "categoryId": 5, "categoryName": "NUOC_VAO", "defaultPriority": "CAO", "isActive": true }
  }
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `DU_LIEU_KHONG_HOP_LE` | 400 | One or more fields violate the constraints |
| `LOI_HE_THONG` | 500 | Unexpected server-side failure |

**Error example — invalid body (HTTP 400)**

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

**Notes and limitations**

- The `dueDate` is not sent by the client; it is computed by the server from `priority`
  (QT-04) and therefore always reflects working days only.
- The first `statusHistory` note is fixed by the server (`"Tiếp nhận phiếu mới tại trung tâm"`).
- Role gating (`CENTER_MANAGER`) is enforced at the UI level; the backend route checks JWT
  authentication (`401`) and input validation (`400`).
- The ticket code sequence is derived from the highest existing `ticket_id` of the centre,
  so it stays unique even after tickets have been deleted.

---

### 4.6 `PUT /api/tickets/{id}`

**Method and path:** `PUT /api/tickets/{id}`

**Business description.** Updates the editable content of a warranty ticket (currently the
issue description and the priority). A technician may only update a ticket assigned to
them (QT-14).

**Authentication required:** Yes — JWT required.

**Path parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | integer | yes | `ticketId` of the ticket |

**Request body**

| Field | Type | Required | Constraints |
| :--- | :--- | :---: | :--- |
| `issueDesc` | string | no | minimum 10 characters |
| `priority` | string | no | `CAO`, `TRUNG_BINH`, `THAP` |

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "message": "Cập nhật phiếu bảo hành thành công",
  "data": {
    "ticketId": 1,
    "ticketCode": "BH-2-00001/2026",
    "customerId": 1,
    "deviceId": 1,
    "centerId": 2,
    "technicianId": null,
    "categoryId": 1,
    "issueDesc": "Man hinh bi soc xanh doc, cam ung goc phai bi liet va dong ho",
    "priority": "TRUNG_BINH",
    "status": "MOI",
    "receivedAt": "2026-11-11T15:12:17.693Z",
    "dueDate": "2026-11-14T15:12:17.693Z",
    "closedAt": null,
    "statusHistory": [
      { "at": "2026-11-11T15:12:17.693Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu mới" }
    ],
    "appointmentAt": null,
    "appointmentStatus": null,
    "customer": { "customerId": 1, "fullName": "Nguyễn Thị Mai", "phone": "0901234567", "email": "mai.nguyen@gmail.com", "address": "Quận 10, TP.HCM", "segment": "VIP", "createdAt": "2026-11-11T17:12:17.669Z" },
    "device": { "deviceId": 1, "customerId": 1, "serialNo": "MK-IP15P-9921", "productName": "iPhone 15 Pro Max 256GB", "purchaseDate": null, "warrantyMonths": 12, "createdAt": "2026-11-11T17:12:17.681Z" },
    "category": { "categoryId": 1, "categoryName": "MAN_HINH", "defaultPriority": "CAO", "isActive": true },
    "technician": null
  }
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `PHIEU_KHONG_TON_TAI` | 404 | No ticket with that id |
| `KHONG_CO_QUYEN` | 403 | A technician is editing a ticket of another technician |
| `DU_LIEU_KHONG_HOP_LE` | 400 | `issueDesc` shorter than 10 characters |
| `UU_TIEN_KHONG_HOP_LE` | 400 | `priority` is not one of `CAO`, `TRUNG_BINH`, `THAP` |
| `TRANG_THAI_KHONG_HOP_LE` | 409 | Ticket is already in `DA_DONG` or `DA_HUY` |

**Error example — technician editing another technician's ticket (HTTP 403)**

```json
{
  "success": false,
  "error": "KHONG_CO_QUYEN",
  "message": "Bạn không có quyền thao tác trên phiếu bảo hành của kỹ thuật viên khác",
  "chiTiet": null
}
```

**Error example — description too short (HTTP 400)**

```json
{
  "success": false,
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Mô tả sự cố phải có độ dài tối thiểu từ 10 ký tự",
  "chiTiet": null
}
```

**Notes and limitations**

- Changing `priority` **recomputes `dueDate`** from the ticket's `receivedAt` using working
  days only (rule QT-04).
- The update does not append a `status_history` entry, because the ticket status itself
  did not change.

---

### 4.7 `POST /api/tickets/{id}/assign`

**Method and path:** `POST /api/tickets/{id}/assign`

**Business description.** Assigns a technician to a warranty ticket. This is the central
business operation of flow L4. It validates that the technician belongs to the same service
centre (QT-08), is skilled enough (`proficiency >= 3`, QT-08), and is not overloaded
(QT-11), then sets the status to `DA_PHAN_CONG` and appends the transition to
`status_history` (QT-06). A `note` is mandatory and records the reason (QT-07).

**Authentication required:** Yes — JWT required. Intended for the `CENTER_MANAGER` role.

**Path parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | integer | yes | `ticketId` of the ticket |

**Request body**

| Field | Type | Required | Constraints |
| :--- | :--- | :---: | :--- |
| `technicianId` | integer | yes | positive integer, must reference an existing technician |
| `note` | string | no | reason for assignment or reassignment (defaults to `"Phân công kỹ thuật viên"` in validator; mandatory in UI for reassignment per QT-07) |

**Successful response (HTTP 200)**

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

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `DU_LIEU_KHONG_HOP_LE` | 400 | `technicianId` is missing or not a positive integer |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `PHIEU_KHONG_TON_TAI` | 404 | No ticket with that id |
| `KTV_KHONG_KHA_DUNG` | 404 | No active technician with that id |
| `TRANG_THAI_KHONG_HOP_LE` | 409 | The ticket status is not `MOI` or `DA_PHAN_CONG` |
| `KTV_KHONG_CUNG_TRUNG_TAM` | 422 | The technician belongs to another centre (QT-08) |
| `KTV_KHONG_DU_TAY_NGHE` | 422 | `proficiency` below the required threshold (QT-08) |
| `KTV_QUA_TAI` | 422 | The technician already holds 8 or more open tickets (QT-11) |

**Error example — technician not skilled enough (HTTP 422)**

```json
{
  "success": false,
  "error": "KTV_KHONG_DU_TAY_NGHE",
  "message": "Kỹ thuật viên không đủ điều kiện chuyên môn (yêu cầu điểm tay nghề proficiency tối thiểu từ 3 trở lên, hiện tại: 2).",
  "chiTiet": null
}
```

**Error example — technician from another centre (HTTP 422)**

```json
{
  "success": false,
  "error": "KTV_KHONG_CUNG_TRUNG_TAM",
  "message": "Không thể phân công kỹ thuật viên (Trung tâm 4) không thuộc trung tâm tiếp nhận phiếu (Trung tâm 2).",
  "chiTiet": null
}
```

**Notes and limitations**

- Reassignment to a different technician is allowed and is treated as a normal assignment:
  the `note` is mandatory and a new `status_history` entry is appended. The `from` value of
  that entry is the current status, so a reassignment produces `from: "DA_PHAN_CONG"`,
  `to: "DA_PHAN_CONG"` in the history — this is a history annotation, **not** a status
  transition, and is not blocked by QT-06.
- The assignment runs inside a database transaction with a `SELECT … FOR UPDATE` row lock on
  the ticket, so two managers assigning the same ticket at the same time cannot corrupt the
  state (NFR3).
- The overload check (QT-11) counts the tickets in status `DA_PHAN_CONG`, `DANG_XU_LY` and
  `CHO_LINH_KIEN`.

---

### 4.8 `PATCH /api/tickets/{id}/status`

**Method and path:** `PATCH /api/tickets/{id}/status`

**Business description.** Moves a ticket to the next status in the lifecycle (QT-06) and
records the transition, with the acting user and the note, in `status_history`.

**Authentication required:** Yes — JWT required.

**Path parameters**

| Name | Type | Required | Description |
| :--- | :---: | :--- | :--- |
| `id` | integer | yes | `ticketId` of the ticket |

**Request body**

| Field | Type | Required | Constraints |
| :--- | :--- | :---: | :--- |
| `status` | string | yes | one of the 7 lifecycle statuses |
| `note` | string | no | free-text explanation stored in the history entry |

**Successful response (HTTP 200)** — same shape as the assignment response, with the new
status and the appended history entry:

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

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `PHIEU_KHONG_TON_TAI` | 404 | No ticket with that id |
| `KHONG_CO_QUYEN` | 403 | A technician is updating a ticket of another technician |
| `DU_LIEU_KHONG_HOP_LE` | 400 | `status` is not one of the 7 valid statuses |
| `TRANG_THAI_KHONG_HOP_LE` | 409 | The transition breaks the lifecycle (QT-06) |

**Error example — invalid status value (HTTP 400)**

```json
{
  "success": false,
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Trạng thái chuyển đổi không hợp lệ",
  "chiTiet": [
    { "field": "status", "reason": "Trạng thái mới không hợp lệ. Phải thuộc: MOI, DA_PHAN_CONG, DANG_XU_LY, CHO_LINH_KIEN, HOAN_TAT, DA_DONG, DA_HUY" }
  ]
}
```

**Error example — backwards transition (HTTP 409)**

```json
{
  "success": false,
  "error": "TRANG_THAI_KHONG_HOP_LE",
  "message": "Không thể chuyển trạng thái từ 'DA_PHAN_CONG' sang 'MOI' theo quy tắc vòng đời không đảo ngược (QT-06).",
  "chiTiet": null
}
```

**Notes and limitations**

- Only one exception to the strict forward order is allowed: `CHO_LINH_KIEN → DANG_XU_LY`.
- A transition to the current status is rejected with HTTP 409 (it is not a transition).
- When the ticket reaches `DA_DONG` or `DA_HUY`, `closedAt` is stamped automatically.

---

### 4.9 `POST /api/tickets/{id}/appointment`

**Method and path:** `POST /api/tickets/{id}/appointment`

**Business description.** Books or reschedules the hand-over appointment for a ticket. The
server rejects the request if the assigned technician already has another appointment within
a ±30 minute window (rule FR4 / UC4 of the appointment policy, previously bug BUG-SE-01).

**Authentication required:** Yes — JWT required. A technician may only book an appointment
for a ticket assigned to them (QT-14).

**Path parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | integer | yes | `ticketId` of the ticket |

**Request body**

| Field | Type | Required | Constraints |
| :--- | :--- | :---: | :--- |
| `appointmentAt` | string | yes | valid ISO-8601 date-time |
| `appointmentStatus` | string | no | `SCHEDULED` (default), `CONFIRMED`, `CANCELLED`, `COMPLETED` |

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "message": "Đặt lịch hẹn giao nhận máy thành công",
  "data": {
    "ticketId": 1,
    "ticketCode": "BH-2-00001/2026",
    "customerId": 1,
    "deviceId": 1,
    "centerId": 2,
    "technicianId": 4,
    "categoryId": 1,
    "issueDesc": "Màn hình bị sọc xanh dọc thân máy sau khi va chạm nhẹ, cảm ứng góc phải bị liệt",
    "priority": "CAO",
    "status": "DA_PHAN_CONG",
    "receivedAt": "2026-11-11T11:55:20.571Z",
    "dueDate": "2026-11-12T11:55:20.571Z",
    "closedAt": null,
    "statusHistory": [
      { "at": "2026-11-11T11:57:09.072Z", "by": null, "to": "MOI", "from": null, "note": "Tiếp nhận phiếu mới" }
    ],
    "appointmentAt": "2026-11-20T03:00:00.000Z",
    "appointmentStatus": "SCHEDULED",
    "customer": { "customerId": 1, "fullName": "Nguyễn Thị Mai", "phone": "090****567", "email": "mai.nguyen@gmail.com", "address": "Quận 10, TP.HCM", "segment": "VIP", "createdAt": "2026-11-11T13:55:20.546Z" },
    "device": { "deviceId": 1, "customerId": 1, "serialNo": "MK-IP15P-9921", "productName": "iPhone 15 Pro Max 256GB", "purchaseDate": null, "warrantyMonths": 12, "createdAt": "2026-11-11T13:55:20.559Z" },
    "category": { "categoryId": 1, "categoryName": "MAN_HINH", "defaultPriority": "CAO", "isActive": true },
    "technician": { "technicianId": 4, "employeeId": "NV-KTV-004", "fullName": "Trần Văn Cường", "centerId": 2, "level": "TRUNG_CAP", "proficiency": 4, "isActive": true, "createdAt": "2026-11-11T13:55:20.530Z" }
  }
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `PHIEU_KHONG_TON_TAI` | 404 | No ticket with that id |
| `KHONG_CO_QUYEN` | 403 | A technician is booking for another technician's ticket |
| `TRANG_THAI_KHONG_HOP_LE` | 422 | The ticket has no assigned technician yet |
| `DU_LIEU_KHONG_HOP_LE` | 400 | `appointmentAt` is not a valid ISO date-time |
| `LICH_HEN_XUNG_DOT` | 409 | The technician already has an appointment within ±30 minutes |

**Error example — conflicting appointment (HTTP 409)**

```json
{
  "success": false,
  "error": "LICH_HEN_XUNG_DOT",
  "message": "Kỹ thuật viên đã có lịch hẹn khác (phiếu BH-2-00001/2026) trong khung giờ này. Vui lòng chọn thời gian khác.",
  "chiTiet": null
}
```

**Error example — invalid date (HTTP 400)**

```json
{
  "success": false,
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Thông tin lịch hẹn không hợp lệ",
  "chiTiet": [
    { "field": "appointmentAt", "reason": "Thời gian hẹn phải là định dạng ngày giờ ISO hợp lệ" }
  ]
}
```

**Error example — not the owner (HTTP 403)**

```json
{
  "success": false,
  "error": "KHONG_CO_QUYEN",
  "message": "Bạn không có quyền đặt lịch hẹn cho phiếu bảo hành của kỹ thuật viên khác",
  "chiTiet": null
}
```

**Notes and limitations**

- The conflict window is **±30 minutes** around the requested time. The ticket being
  updated is excluded from the check, so rescheduling a ticket does not conflict with
  itself.
- The response always echoes the full ticket object, so the client can update its state
  with a single call.

---

### 4.10 `DELETE /api/tickets/{id}`

**Method and path:** `DELETE /api/tickets/{id}`

**Business description.** Cancels a warranty ticket. Only a ticket that has not started
yet (`status = 'MOI'`) may be cancelled; anything else must go through the status lifecycle
and end in `DA_HUY` (QT-13, QT-06).

**Authentication required:** Yes — JWT required. Intended for the `CENTER_MANAGER` role.

**Path parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | integer | yes | `ticketId` of the ticket |

**Request body**

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `reason` | string | no | reason for the cancellation, stored in the history |

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "message": "Đã xóa phiếu bảo hành ID 2 thành công"
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `PHIEU_KHONG_TON_TAI` | 404 | No ticket with that id |
| `KHONG_THE_XOA_PHIEU` | 422 | The ticket is not in status `MOI` |

**Error example — ticket already in progress (HTTP 422)**

```json
{
  "success": false,
  "error": "KHONG_THE_XOA_PHIEU",
  "message": "Không thể xóa phiếu đang ở trạng thái 'DA_PHAN_CONG'. Chỉ được phép xóa phiếu ở trạng thái 'MOI'.",
  "chiTiet": null
}
```

**Notes and limitations**

- Despite the endpoint name, this is a **soft delete**: the row is removed from the working
  queue but the record is retained for audit purposes (QT-13).
- The endpoint returns no `data` object, only `success` and `message`.

---

## 5. Technician endpoints

### 5.1 `GET /api/technicians`

**Method and path:** `GET /api/technicians`

**Business description.** Lists the technicians of a service centre, sorted by proficiency
descending and then by name. This is the roster screen of the centre manager.

**Authentication required:** Yes — JWT required.

**Query parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `centerId` | integer | no | Filter by service centre; defaults to the caller's own centre |

**Request body:** none.

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "data": [
    {
      "technicianId": 3,
      "employeeId": "NV-KTV-003",
      "fullName": "Nguyễn Văn A",
      "centerId": 2,
      "level": "CAO_CAP",
      "proficiency": 5,
      "isActive": true,
      "createdAt": "2026-11-11T13:55:20.526Z",
      "serviceCenter": {
        "centerId": 2,
        "centerName": "TTBH Mekong Tân Bình",
        "address": "456 Cộng Hòa, P.13, Q.Tân Bình",
        "phone": "028****233",
        "city": "TP.HCM",
        "isActive": true
      }
    },
    {
      "technicianId": 4,
      "employeeId": "NV-KTV-004",
      "fullName": "Trần Văn Cường",
      "centerId": 2,
      "level": "TRUNG_CAP",
      "proficiency": 4,
      "isActive": true,
      "createdAt": "2026-11-11T13:55:20.530Z",
      "serviceCenter": { "centerId": 2, "centerName": "TTBH Mekong Tân Bình", "address": "456 Cộng Hòa, P.13, Q.Tân Bình", "phone": "028****233", "city": "TP.HCM", "isActive": true }
    }
  ]
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |

**Notes and limitations**

- The `serviceCenter.phone` is masked (`028****233`) because the response is served on the
  `/technician` path, which the phone-masking middleware treats as a technician-facing route
  (QT-15).
- The `workload` field is **not** included here; use
  `GET /api/technicians/candidates-for-ticket/{ticketId}` for that.

---

### 5.2 `GET /api/technicians/{id}`

**Method and path:** `GET /api/technicians/{id}`

**Business description.** Returns the profile of one technician.

**Authentication required:** Yes — JWT required.

**Path parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | integer | yes | `technicianId` |

**Request body:** none.

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "data": {
    "technicianId": 3,
    "employeeId": "NV-KTV-003",
    "fullName": "Nguyễn Văn A",
    "centerId": 2,
    "level": "CAO_CAP",
    "proficiency": 5,
    "isActive": true,
    "createdAt": "2026-11-11T13:55:20.526Z",
    "serviceCenter": {
      "centerId": 2,
      "centerName": "TTBH Mekong Tân Bình",
      "address": "456 Cộng Hòa, P.13, Q.Tân Bình",
      "phone": "028****233",
      "city": "TP.HCM",
      "isActive": true
    }
  }
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `KTV_KHONG_TON_TAI` | 404 | No technician with that id |

**Error example — unknown id (HTTP 404)**

```json
{
  "success": false,
  "error": "KTV_KHONG_TON_TAI",
  "message": "Không tìm thấy kỹ thuật viên ID 99999",
  "chiTiet": null
}
```

**Notes and limitations**

- `proficiency` is on the scale 1–5 (1 trainee, 2 junior, 3 intermediate, 4 proficient,
  5 expert). A technician needs at least 3 to be assignable (QT-08).

---

### 5.3 `GET /api/technicians/candidates-for-ticket/{ticketId}`

**Method and path:** `GET /api/technicians/candidates-for-ticket/{ticketId}`

**Business description.** Returns the list of technicians that are **eligible** to receive
the given ticket, together with their current workload. This is the recommendation engine
behind the assignment screen: it filters by centre and proficiency (QT-08) and sorts by
ascending workload so that the manager is steered towards the least loaded technician
(load balancing, rule QT-11).

**Authentication required:** Yes — JWT required. Intended for the `CENTER_MANAGER` role.

**Path parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `ticketId` | integer | yes | `ticketId` of the ticket to be assigned |

**Request body:** none.

**Successful response (HTTP 200)**

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
        "createdAt": "2026-11-11T13:55:20.533Z",
        "serviceCenter": { "centerId": 2, "centerName": "TTBH Mekong Tân Bình", "address": "456 Cộng Hòa, P.13, Q.Tân Bình", "phone": "028****233", "city": "TP.HCM", "isActive": true },
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
        "createdAt": "2026-11-11T13:55:20.526Z",
        "serviceCenter": { "centerId": 2, "centerName": "TTBH Mekong Tân Bình", "address": "456 Cộng Hòa, P.13, Q.Tân Bình", "phone": "028****233", "city": "TP.HCM", "isActive": true },
        "workload": 1
      },
      {
        "technicianId": 4,
        "employeeId": "NV-KTV-004",
        "fullName": "Trần Văn Cường",
        "centerId": 2,
        "level": "TRUNG_CAP",
        "proficiency": 4,
        "isActive": true,
        "createdAt": "2026-11-11T13:55:20.530Z",
        "serviceCenter": { "centerId": 2, "centerName": "TTBH Mekong Tân Bình", "address": "456 Cộng Hòa, P.13, Q.Tân Bình", "phone": "028****233", "city": "TP.HCM", "isActive": true },
        "workload": 1
      }
    ]
  }
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `PHIEU_KHONG_TON_TAI` | 404 | No ticket with that id |

**Notes and limitations**

- `workload` counts the tickets in status `DA_PHAN_CONG`, `DANG_XU_LY` and `CHO_LINH_KIEN`.
  A technician with `workload >= 8` is still listed here but is rejected by
  `POST /api/tickets/{id}/assign` with `KTV_QUA_TAI` (QT-11).
- The candidates are sorted by workload ascending; within the same workload, by proficiency
  descending.
- The route is declared **before** `/:id` in the router, so the literal segment
  `candidates-for-ticket` is always matched first and never treated as a technician id.

---

### 5.4 `POST /api/technicians`

**Method and path:** `POST /api/technicians`

**Business description.** Registers a new technician in a service centre.

**Authentication required:** Yes — JWT required. Intended for the `CENTER_MANAGER` role.

**Request body**

| Field | Type | Required | Constraints |
| :--- | :--- | :---: | :--- |
| `employeeId` | string | yes | employee code, minimum 3 characters, must be unique |
| `fullName` | string | yes | minimum 2 characters |
| `centerId` | integer | yes | positive integer, must reference an existing centre |
| `level` | string | yes | `SO_CAP`, `TRUNG_CAP`, `CAO_CAP` |
| `proficiency` | integer | yes | **1–5** |

**Successful response (HTTP 201)**

```json
{
  "success": true,
  "message": "Thêm mới kỹ thuật viên thành công",
  "data": {
    "technicianId": 9,
    "employeeId": "NV-KTV-009",
    "fullName": "Pham Thi Ngoc",
    "centerId": 2,
    "level": "TRUNG_CAP",
    "proficiency": 4,
    "isActive": true,
    "createdAt": "2026-11-11T14:38:10.518Z"
  }
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `DU_LIEU_KHONG_HOP_LE` | 400 | A field violates its constraint |
| `LOI_HE_THONG` | 500 | Unexpected server-side failure (e.g. duplicate `employeeId` or nonexistent `centerId` foreign key) |

**Error example — proficiency out of range (HTTP 400)**

```json
{
  "success": false,
  "error": "DU_LIEU_KHONG_HOP_LE",
  "message": "Dữ liệu kỹ thuật viên không hợp lệ",
  "chiTiet": [
    { "field": "proficiency", "reason": "Điểm tay nghề (proficiency) phải là số nguyên từ 1 đến 5" }
  ]
}
```

**Notes and limitations**

- `employeeId` is unique across the whole system; creating a duplicate returns HTTP 500
  with `LOI_HE_THONG`. This is a known limitation — a dedicated conflict code would be
  better.
- The endpoint does not create a login account. The four demo accounts are defined
  separately in `src/services/auth.service.js`.

---

### 5.5 `PUT /api/technicians/{id}`

**Method and path:** `PUT /api/technicians/{id}`

**Business description.** Updates the profile of a technician (name, level, proficiency,
centre, active flag).

**Authentication required:** Yes — JWT required. Intended for the `CENTER_MANAGER` role.

**Path parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | integer | yes | `technicianId` |

**Request body** — every field optional.

| Field | Type | Constraints |
| :--- | :--- | :--- |
| `fullName` | string | non-empty |
| `level` | string | `SO_CAP`, `TRUNG_CAP`, `CAO_CAP` |
| `proficiency` | integer | 1–5 |
| `centerId` | integer | positive integer |
| `isActive` | boolean | true / false |

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "message": "Cập nhật kỹ thuật viên thành công",
  "data": {
    "technicianId": 9,
    "employeeId": "NV-KTV-009",
    "fullName": "Pham Thi Ngoc",
    "centerId": 2,
    "level": "CAO_CAP",
    "proficiency": 5,
    "isActive": true,
    "createdAt": "2026-11-11T14:38:10.518Z"
  }
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `KTV_KHONG_TON_TAI` | 404 | No technician with that id |
| `LOI_HE_THONG` | 500 | Unexpected server-side failure (e.g. invalid `centerId` foreign key or type mismatch) |

**Error example — unknown id (HTTP 404)**

```json
{
  "success": false,
  "error": "KTV_KHONG_TON_TAI",
  "message": "Không tìm thấy kỹ thuật viên ID 9",
  "chiTiet": null
}
```

**Notes and limitations**

- Lowering `proficiency` below 3 does **not** revoke the technician's existing
  assignments. The rule is only enforced at assignment time (QT-08).
- Moving a technician to another centre does not move their open tickets.
- Known limitation: `PUT /api/technicians/{id}` does not currently run a field validator
  before passing the body to Prisma, unlike `POST /api/technicians`.

---

### 5.6 `DELETE /api/technicians/{id}`

**Method and path:** `DELETE /api/technicians/{id}`

**Business description.** Deactivates a technician. This is a **soft delete** (QT-13): the row
is kept and the flag `isActive` is set to `false`. A deactivated technician disappears from
the roster and can no longer receive new assignments.

**Authentication required:** Yes — JWT required. Intended for the `CENTER_MANAGER` role.

**Path parameters**

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | integer | yes | `technicianId` |

**Request body:** none.

**Successful response (HTTP 200)**

```json
{
  "success": true,
  "message": "Vô hiệu hóa kỹ thuật viên thành công (Soft Delete QT-13)"
}
```

**Error codes**

| Code | HTTP | Condition |
| :--- | :---: | :--- |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Missing or invalid token |
| `KTV_KHONG_TON_TAI` | 404 | No technician with that id |

**Error example — unknown id (HTTP 404)**

```json
{
  "success": false,
  "error": "KTV_KHONG_TON_TAI",
  "message": "Không tìm thấy kỹ thuật viên ID 9",
  "chiTiet": null
}
```

**Notes and limitations**

- The record is **never** physically deleted, so the history of past assignments stays
  intact (QT-13).
- The endpoint returns no `data` object, only `success` and `message`.
- A technician who still holds open tickets can be deactivated; those tickets are not
  reassigned automatically. This is a known limitation.

---

## 6. Error catalogue

The complete list of business error codes and their HTTP status codes, taken from
`HTTP_CODE_MAP` in `src/middlewares/errorHandler.middleware.js`.

| Error code | HTTP | Meaning |
| :--- | :---: | :--- |
| `DU_LIEU_KHONG_HOP_LE` | 400 | The request payload failed validation |
| `THIEU_TRUONG_BAT_BUOC` | 400 | A required field is missing |
| `UU_TIEN_KHONG_HOP_LE` | 400 | The `priority` field is not `CAO`, `TRUNG_BINH` or `THAP` |
| `XAC_THUC_KHONG_HOP_LE` | 401 | Authentication failed (no token, invalid token, wrong credentials) |
| `TOKEN_HET_HAN` | 401 | The token has expired |
| `KHONG_CO_QUYEN` | 403 | The role or ownership scope forbids the operation (A01, QT-14) |
| `PHIEU_KHONG_TON_TAI` | 404 | The warranty ticket does not exist |
| `KTV_KHONG_TON_TAI` | 404 | The technician does not exist |
| `KTV_KHONG_KHA_DUNG` | 404 | The technician exists but is not available |
| `TRUNG_TAM_KHONG_TON_TAI` | 404 | The service centre does not exist |
| `TRANG_THAI_KHONG_HOP_LE` | 409 | The status transition is not allowed (QT-06) |
| `LICH_HEN_XUNG_DOT` | 409 | The technician already has an appointment in the window |
| `KHONG_THE_XOA_PHIEU` | 422 | The ticket is not in status `MOI` and cannot be cancelled |
| `KTV_KHONG_CUNG_TRUNG_TAM` | 422 | The technician belongs to another centre (QT-08) |
| `KTV_KHONG_DU_TAY_NGHE` | 422 | The technician's proficiency is below the threshold (QT-08) |
| `KTV_QUA_TAI` | 422 | The technician already holds 8 or more open tickets (QT-11) |
| `LOI_HE_THONG` | 500 | Unexpected server-side error; the response never contains internals |

---

## 7. Full endpoint index

| # | Method | Path | Auth | Role | Success | Section |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: |
| 1 | GET | `/health` | no | — | 200 | [3.1](#31-get-health) |
| 2 | GET | `/` | no | — | 200 | [3.2](#32-get-) |
| 3 | POST | `/api/auth/login` | no | — | 200 | [2.1](#21-post-apiauthlogin) |
| 4 | GET | `/api/tickets` | yes | all | 200 | [4.1](#41-get-apitickets) |
| 5 | GET | `/api/tickets/unassigned` | yes | manager | 200 | [4.2](#42-get-apiticketsunassigned) |
| 6 | GET | `/api/tickets/technician/mine` | yes | all | 200 | [4.3](#43-get-apiticketstechnicianmine) |
| 7 | GET | `/api/tickets/{id}` | yes | all | 200 | [4.4](#44-get-apiticketsid) |
| 8 | POST | `/api/tickets` | yes | manager | 201 | [4.5](#45-post-apitickets) |
| 9 | PUT | `/api/tickets/{id}` | yes | all | 200 | [4.6](#46-put-apiticketsid) |
| 10 | POST | `/api/tickets/{id}/assign` | yes | manager | 200 | [4.7](#47-post-apiticketsidassign) |
| 11 | PATCH | `/api/tickets/{id}/status` | yes | all | 200 | [4.8](#48-patch-apiticketsidstatus) |
| 12 | POST | `/api/tickets/{id}/appointment` | yes | all | 200 | [4.9](#49-post-apiticketsidappointment) |
| 13 | DELETE | `/api/tickets/{id}` | yes | manager | 200 | [4.10](#410-delete-apiticketsid) |
| 14 | GET | `/api/technicians` | yes | all | 200 | [5.1](#51-get-apitechnicians) |
| 15 | GET | `/api/technicians/candidates-for-ticket/{ticketId}` | yes | manager | 200 | [5.3](#53-get-apitechnicianscandidates-for-ticketticketid) |
| 16 | GET | `/api/technicians/{id}` | yes | all | 200 | [5.2](#52-get-apitechniciansid) |
| 17 | POST | `/api/technicians` | yes | manager | 201 | [5.4](#54-post-apitechnicians) |
| 18 | PUT | `/api/technicians/{id}` | yes | manager | 200 | [5.5](#55-put-apitechniciansid) |
| 19 | DELETE | `/api/technicians/{id}` | yes | manager | 200 | [5.6](#56-delete-apitechniciansid) |

**17 business endpoints** (rows 3–19) + 2 infrastructure endpoints (rows 1–2).

The machine-readable version of this document is
[`openapi.yaml`](openapi.yaml) (OpenAPI 3.0.3), which can be loaded directly into Swagger UI,
Postman or Insomnia.
