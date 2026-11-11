# Deployment Guide — Mekong Mobile Smart CRM (Flow L4, track SE)

> **System:** Smart CRM – Mekong Mobile, flow **L4 — Technician assignment and appointment scheduling**
> **Repository:** https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4
> **Tag:** `v1.0`
> **Author:** Nguyen Tran Hoang Vinh — MSSV 2374802010562
> **Guide language:** English (as required by Assignment 3, section 2.5)

This guide is written for someone who has never seen this system before. Every step is a
single copy-pasteable command, and every verification step states the **exact expected output**
so that you can tell whether the system is working without asking anyone.

---

## 1. Requirements

| Item | Requirement | How to check |
| :--- | :--- | :--- |
| Operating system | Windows 10/11, macOS 12+, or any Linux with WSL2 | — |
| Docker Engine | **24.0 or newer** | `docker --version` |
| Docker Compose | **v2.20 or newer** (the `docker compose` sub-command, not the legacy `docker-compose`) | `docker compose version` |
| Git | 2.30 or newer | `git --version` |
| Free disk space | **~2.5 GB** (Docker images + PostgreSQL volume + Node build cache) | — |
| Free RAM | 2 GB available to Docker | — |
| Free host ports | **3000** (Backend API) and **5173** (Frontend Web UI) must be free | see Troubleshooting |
| Node.js / PostgreSQL | **Not required.** The container images contain Node.js 20 LTS and PostgreSQL 16 | — |

Everything else (runtime, database engine, migration, sample data seeding) is packaged inside
the Docker images. A machine with only Docker and Git is enough — this is "reproducibility
level 3".

**Ports used**

| Port | Service | Purpose |
| :---: | :--- | :--- |
| 3000 | `api` | Backend REST API (Node.js 20 + Express + Prisma) |
| 5173 | `web` | Frontend Web UI (React 18 + Vite, served by Nginx) |
| 5432 | `postgres` | PostgreSQL 16 database |

---

## 2. Setup steps

Run the following commands **in order**. Steps 2 and 3 are the two commands that bring the
whole system up.

**Step 1 — Clone the repository at the exact tag that is being graded**

```bash
git clone --branch v1.0 https://github.com/NguyenVinh2504/Cdtn1-NguyenTranHoangVinh-L4.git
cd Cdtn1-NguyenTranHoangVinh-L4
```

**Step 2 — Create the environment file from the shipped sample**

```bash
cp .env.example .env
```

> The shipped `.env.example` already contains working sample values, so no editing is needed
> for a trial run. For a real deployment, change `DB_PASSWORD` and `JWT_SECRET` first
> (see section 3).

**Step 3 — Build the images and start all services in the background**

```bash
docker compose up -d --build
```

> The first build takes roughly 60–90 seconds (it downloads the base images and installs
> Node dependencies). Subsequent runs reuse the Docker cache and take about 15 seconds.
>
> The `api` container automatically runs `prisma migrate deploy` (creates the 6 tables),
> then `node prisma/seed.js` (loads the sample data), and only then starts the API server.
> You do **not** need to run a third command.

**Optional — stop and remove everything (including the database volume)**

```bash
docker compose down -v
```

---

## 3. Environment variables

All variables are declared in `.env.example`. The API container reads them via `env_file: .env`
and additionally overrides the database connection with the internal Docker service name.

| Variable | Meaning | Sample value | Required |
| :--- | :--- | :--- | :---: |
| `NODE_ENV` | Runtime mode of the API process (`production` inside Docker) | `production` | no |
| `PORT` | Port the API process listens on inside the container | `3000` | no |
| `API_PORT` | **Host** port mapped to the API container. Change this if 3000 is taken | `3000` | no |
| `WEB_PORT` | **Host** port mapped to the web container. Change this if 5173 is taken | `5173` | no |
| `API_PREFIX` | Prefix under which all business routes are mounted | `/api` | no |
| `DB_HOST` | PostgreSQL host. Inside Docker this is the service name `postgres` | `postgres` | yes |
| `DB_PORT` | PostgreSQL port | `5432` | yes |
| `DB_NAME` | Database name created on first start | `mekong_crm_l4` | yes |
| `DB_USER` | Database user (superuser of that database) | `postgres` | yes |
| `DB_PASSWORD` | Database password. **Change before any real deployment** | `postgres` | yes |
| `DATABASE_URL` | Full connection string. Only used when running the backend **outside** Docker; inside Docker it is rebuilt automatically from `DB_USER`/`DB_PASSWORD`/`DB_NAME` and the service name `postgres` | `postgresql://postgres:postgres@localhost:5432/mekong_crm_l4?schema=public` | no |
| `JWT_SECRET` | Secret key used to sign the JSON Web Tokens. **Must be at least 32 characters in production.** Generate one with `openssl rand -hex 32` | `super_secret_jwt_key_mekong_mobile_2026` | yes |
| `JWT_EXPIRES_IN` | Lifetime of an issued token | `8h` | no |
| `CORS_ORIGIN` | Origin allowed by the browser to call the API (comma-separated list allowed) | `http://localhost:5173` | no |
| `FRONTEND_URL` | Public URL of the web UI. Also used by the API to report its own root endpoint | `http://localhost:5173` | no |
| `PUBLIC_API_URL` | URL of the API that the **browser** uses. Baked into the frontend bundle at build time | `http://localhost:3000` | no |

> **Note on `JWT_SECRET`:** the shipped sample value is a *demo* value. It is not a real
> secret, it is committed on purpose so that the two-command startup works out of the box.
> Before deploying anywhere reachable from the internet, generate a private one:
> `openssl rand -hex 32`.

---

## 4. Sample data

Sample data is loaded **automatically** by the `api` container on every start, by the
command in `Dockerfile`:

```
npx prisma migrate deploy && node prisma/seed.js && node src/server.js
```

- `prisma migrate deploy` applies the versioned migration in `prisma/migrations/`, creating
  the 6 tables (`customer`, `device`, `service_center`, `issue_category`, `technician`, `ticket`).
- `prisma/seed.js` loads the sample records with `upsert`, so it is **idempotent**: running it
  a second time does not duplicate anything.

**Expected record counts after the first start** (verified on PostgreSQL 16):

| Table | Rows |
| :--- | ---: |
| `service_center` (warranty centres) | 6 |
| `issue_category` (issue categories) | 6 |
| `technician` (technicians) | 8 |
| `customer` (customers) | 4 |
| `device` (devices) | 4 |
| `ticket` (warranty tickets) | 4 |

Check it yourself:

```bash
docker compose exec postgres psql -U postgres -d mekong_crm_l4 -c "SELECT 'service_center' t, count(*) FROM service_center UNION ALL SELECT 'issue_category', count(*) FROM issue_category UNION ALL SELECT 'technician', count(*) FROM technician UNION ALL SELECT 'customer', count(*) FROM customer UNION ALL SELECT 'device', count(*) FROM device UNION ALL SELECT 'ticket', count(*) FROM ticket;"
```

**Expected output:**

```
       t        | count
----------------+-------
 service_center |     6
 issue_category |     6
 technician     |     8
 customer       |     4
 device         |     4
 ticket         |     4
(6 rows)
```

To prove idempotency, restart the `api` service so its startup command (migrate → seed →
server) runs a second time, then repeat the counting query:

```bash
docker compose restart api
# wait until `docker compose ps` reports the api as healthy, then run the query again
```

The numbers must be **exactly the same** (this is the idempotency check of Assignment 3,
criterion C8). Verified during the white-box test: the seed ran twice and all six counts
stayed at 6 / 6 / 8 / 4 / 4 / 4.

**Demo accounts** (sample data, not real secrets — the passwords are stored as bcrypt hashes
in the source code):

| Username | Password | Role | Centre |
| :--- | :--- | :--- | :---: |
| `manager_tt2` | `password123` | `CENTER_MANAGER` | 2 |
| `ktv_nguyenvana` | `password123` | `TECHNICIAN` | 2 |
| `ktv_dohuuthang` | `password123` | `TECHNICIAN` | 2 |
| `ktv_lequocbao` | `password123` | `TECHNICIAN` (proficiency 2 — used to test rule QT-08) | 2 |

---

## 5. Verify it works

Run the four commands below in order. All of them are also the commands to capture the
evidence screenshots for section 7 of the submitted PDF.

**5.1 — All three services must report `healthy`**

```bash
docker compose ps
```

**Expected output** (the `STATUS` column must contain `healthy` for all three services):

```
NAME              IMAGE                                   SERVICE    STATUS
mekong_crm_api    cdtn1-nguyentranhoangvinh-l4-api       api        Up 2 minutes (healthy)
mekong_crm_web    cdtn1-nguyentranhoangvinh-l4-web       web        Up 2 minutes (healthy)
mekong_postgres   postgres:16-alpine                     postgres   Up 2 minutes (healthy)
```

**5.2 — The Backend API must answer the health check**

```bash
curl -s http://localhost:3000/health
```

**Expected output:**

```json
{"status":"UP","uptime":129.016174971,"timestamp":"2026-11-11T14:42:24.156Z","service":"Mekong Mobile CRM - Luồng L4 (Phân công KTV & Lịch hẹn)","version":"0.2.0"}
```

The Frontend Web UI has its own health check:

```bash
curl -s http://localhost:5173/health
```

**Expected output:**

```json
{"status":"FRONTEND_UP"}
```

**5.3 — Log in with a demo account and obtain a token**

```bash
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"manager_tt2","password":"password123"}'
```

**Expected output** (a JWT plus the user profile):

```json
{"success":true,"message":"Đăng nhập thành công","data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{"id":1,"fullName":"Trần Văn Quản Lý (TT2)","role":"CENTER_MANAGER","centerId":2}}}
```

Then use that token to read business data — this proves that authentication and the
authorisation scope both work:

```bash
curl -s "http://localhost:3000/api/tickets/unassigned?centerId=2" -H "Authorization: Bearer <TOKEN_FROM_STEP_5.3>"
```

**Expected output** (2 tickets waiting for assignment at centre 2, with `"total":2`):

```json
{"success":true,"data":[{"ticketId":2,"ticketCode":"BH-2-00002/2026",...}],"total":2}
```

**5.4 — The automated test suite must pass inside the container**

```bash
docker compose exec api npm test
```

**Expected output:**

```
Test Suites: 7 passed, 7 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        2.598 s
Ran all test suites.
```

The suite covers unit tests (services, validators, SLA calculation) and API-level tests
(Supertest against the real Express app with in-memory repositories). It does **not** require
any data that only exists on the developer's machine, so it passes on any fresh clone.

**5.5 — Optional: open the web UI**

Browse to <http://localhost:5173> and sign in with `manager_tt2` / `password123`.

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| `Bind for 0.0.0.0:3000 failed: port is already allocated` | Host port 3000 (or 5173) is taken by another program | Change `API_PORT=3001` (and/or `WEB_PORT=5174`) in `.env`, then run `docker compose up -d` again |
| `relation "ticket" does not exist` | The database volume is stale, or the migration did not run | `docker compose down -v && docker compose up -d --build` to recreate a clean volume |
| `api` container exits right after starting | The database was not ready yet, or `DATABASE_URL` in `.env` points to `localhost` | Make sure `DB_HOST=postgres` in `.env` (not `localhost`) and that `postgres` reports `healthy` in `docker compose ps` |
| `Error: P2002 Unique constraint failed on the fields: (ticket_id)` | The volume was created by an older image whose seed did not synchronise the PostgreSQL sequences | `docker compose down -v && docker compose up -d --build` |
| Web UI shows "Cannot connect to the API" | The frontend bundle was built with the wrong API URL | Set `PUBLIC_API_URL=http://localhost:3000` in `.env` and rebuild with `docker compose up -d --build web` |
| A request returns HTTP 401 | No (or expired) JWT token was sent | Log in again via `POST /api/auth/login` and send `Authorization: Bearer <token>` |
| A request returns HTTP 403 `KHONG_CO_QUYEN` | The signed-in role is not allowed to see that data (rules QT-14 / A01) | Sign in as `manager_tt2` for centre-wide operations |
| Want to see what the API is doing | — | `docker compose logs api --tail 50` |

**Useful maintenance commands**

```bash
docker compose logs api --tail 50        # tail the API log
docker compose restart api               # restart only the API
docker compose down -v && docker compose up -d --build   # full clean rebuild
```

---

## 7. Monitoring and alerts

The prototype does not ship a full monitoring stack (that is explicitly out of scope for
Assignment 3 and belongs to Chuyên đề tốt nghiệp 2). The following is the concrete,
measurable baseline that an operator can use, written so that it can be handed over.

**Monitoring baseline**

- Every service exposes a health endpoint: `GET /health` on the API (checks the process) and
  `GET /health` on the web container (Nginx). `docker compose ps` turns the result into a
  per-service `healthy` / `unhealthy` state.
- Container logs are collected by the Docker logging driver. The API logs every start-up
  event (migration result, seed result, listening port).
- The workload indicator that matters operationally is the number of open tickets per
  technician, which is already returned by `GET /api/technicians/candidates-for-ticket/{id}`
  as the `workload` field (rule QT-11 rejects an assignment at 8 or more open tickets).

### ALERT-01 — Backend API errors

| Element | Definition |
| :--- | :--- |
| **Measure** | Share of HTTP 5xx responses on `/api/*` (excluding `/health`) |
| **Threshold** | More than 2 % of requests over two consecutive 5-minute windows |
| **Notify** | The on-duty developer, via the team chat channel |
| **Action** | 1) Run `docker compose logs api --tail 50` and look for the `[UNHANDLED_ERROR]` marker.<br>2) If the database is unreachable: `docker compose restart postgres`, then `curl -s http://localhost:3000/health` must return `"status":"UP"`.<br>3) If the failure persists for more than 10 minutes, roll back with `docker compose up -d --build` from tag `v1.0`. |

### ALERT-02 — Tickets approaching their committed deadline (business alert)

| Element | Definition |
| :--- | :--- |
| **Measure** | Number of open tickets whose `dueDate` (computed by rule QT-04, working hours only) falls within the next 4 hours |
| **Threshold** | More than 10 tickets, or more than twice the same hour of the previous week |
| **Notify** | The service centre manager, by e-mail |
| **Action** | 1) List them: `curl -s "http://localhost:3000/api/tickets?centerId=2&status=DA_PHAN_CONG" -H "Authorization: Bearer <TOKEN>"`.<br>2) Rebalance by reassigning to a technician with low workload, using `GET /api/technicians/candidates-for-ticket/{ticketId}` to find who is free.<br>3) Record the reassignment reason in the `note` field (rule QT-07). |

---

## 8. Related documents

| Document | Purpose |
| :--- | :--- |
| [`docs/test-plan.md`](test-plan.md) | Scope, test types and success criteria of the test campaign |
| [`docs/test-report.md`](test-report.md) | The 12 executed test cases with their real results |
| [`docs/bug-log.md`](bug-log.md) | The bugs found and fixed, each with a working commit link |
| [`docs/checklist-bao-mat.md`](checklist-bao-mat.md) | The 7-item self-assessment security checklist with evidence |
| [`docs/api-docs/api-reference.md`](api-docs/api-reference.md) | Full REST API reference for every endpoint |
| [`docs/srs.md`](srs.md) | Software Requirements Specification and the business rules QT-04 … QT-15 |
| [`docs/thay-doi-thiet-ke.md`](thay-doi-thiet-ke.md) | Design change log across BT2 and BT3 |
