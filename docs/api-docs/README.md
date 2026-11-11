# API Documentation — Mekong Mobile Smart CRM (Flow L4, track SE)

> **System:** Smart CRM – Mekong Mobile, flow **L4 — Technician assignment and appointment scheduling**
> **Tag:** `v1.0` · **Author:** Nguyen Tran Hoang Vinh — MSSV 2374802010562
> **Language:** English (as required by Assignment 3, track SE)

This folder is the **technical documentation of the REST API** — the deliverable required by
section 2.6 of Assignment 3 for the Software Engineering track.

---

## Contents

| File | What it is | When to use it |
| :--- | :--- | :--- |
| [`api-reference.md`](api-reference.md) | **Human-readable API reference.** All 17 business endpoints + 2 infrastructure endpoints, each with the same 7 sections: method and path · business description · authentication requirement · parameters and request body · successful response body · error codes · notes and limitations. Every example is a **real transcript** captured from the running system. | Reading, integrating, reviewing |
| [`openapi.yaml`](openapi.yaml) | **Machine-readable OpenAPI 3.0.3 specification** of the same API — 13 paths, 19 operations, 16 reusable schemas. | Loading into Swagger UI, Postman, Insomnia; generating a client; contract testing |

---

## Quick start

**1. Start the system** (two commands — see the [Deployment Guide](../deployment-guide.md)):

```bash
cp .env.example .env
docker compose up -d --build
```

**2. Get a token:**

```bash
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"manager_tt2","password":"password123"}'
```

**3. Call an endpoint:**

```bash
curl -s "http://localhost:3000/api/tickets/unassigned?centerId=2" -H "Authorization: Bearer <TOKEN>"
```

**4. Browse interactively** — the `openapi.yaml` file can be loaded directly into
[Swagger Editor](https://editor.swagger.io/) or served with a local viewer:

```bash
npx swagger-ui-cli serve docs/api-docs/openapi.yaml
```

---

## Endpoint summary

| # | Method | Path | Auth | Role | Success |
| :---: | :--- | :--- | :---: | :--- | :---: |
| 1 | GET | `/health` | no | — | 200 |
| 2 | GET | `/` | no | — | 200 |
| 3 | POST | `/api/auth/login` | no | — | 200 |
| 4 | GET | `/api/tickets` | yes | all | 200 |
| 5 | GET | `/api/tickets/unassigned` | yes | manager | 200 |
| 6 | GET | `/api/tickets/technician/mine` | yes | all | 200 |
| 7 | GET | `/api/tickets/{id}` | yes | all | 200 |
| 8 | POST | `/api/tickets` | yes | manager | 201 |
| 9 | PUT | `/api/tickets/{id}` | yes | all | 200 |
| 10 | POST | `/api/tickets/{id}/assign` | yes | manager | 200 |
| 11 | PATCH | `/api/tickets/{id}/status` | yes | all | 200 |
| 12 | POST | `/api/tickets/{id}/appointment` | yes | all | 200 |
| 13 | DELETE | `/api/tickets/{id}` | yes | manager | 200 |
| 14 | GET | `/api/technicians` | yes | all | 200 |
| 15 | GET | `/api/technicians/candidates-for-ticket/{ticketId}` | yes | manager | 200 |
| 16 | GET | `/api/technicians/{id}` | yes | all | 200 |
| 17 | POST | `/api/technicians` | yes | manager | 201 |
| 18 | PUT | `/api/technicians/{id}` | yes | manager | 200 |
| 19 | DELETE | `/api/technicians/{id}` | yes | manager | 200 |

**17 business endpoints** (rows 3–19) + 2 infrastructure endpoints (rows 1–2).

> **How the count was obtained.** The endpoint list was derived from the router source
> (`src/routes/*.js`), not from the design document, and was then **verified against the
> running system** by calling each one and recording the real HTTP status. The route
> declaration order matters for `/api/technicians`: `candidates-for-ticket/:ticketId` is
> declared **before** `/:id`, so the literal segment always wins.

---

## Conventions at a glance

| Aspect | Rule |
| :--- | :--- |
| Base URL | `http://localhost:3000` · prefix `/api` |
| Content type | `application/json` |
| Authentication | `Authorization: Bearer <JWT>` from `POST /api/auth/login` |
| Success envelope | `{ "success": true, "data": … }` (+ `message`, + `total` for lists) |
| Error envelope | `{ "success": false, "error": "<CODE>", "message": "…", "chiTiet": … }` |
| Phone masking | `090****567` for the `TECHNICIAN` role (rule QT-15) |
| Errors | 16 business error codes, mapped to HTTP by `HTTP_CODE_MAP` in `src/middlewares/errorHandler.middleware.js` |

---

## Where the behaviour is specified

| Concern | Document |
| :--- | :--- |
| The **why** of each endpoint (user stories, business rules QT-04 … QT-15) | [`../srs.md`](../srs.md) |
| The **contract** between frontend and backend | [`../api-contract.md`](../api-contract.md) |
| The API **reference** and the OpenAPI spec | this folder |
| How to **run** the API | [`../deployment-guide.md`](../deployment-guide.md) |
| The **test campaign** that verifies it | [`../test-plan.md`](../test-plan.md), [`../test-report.md`](../test-report.md) |
| The **bugs** found while verifying it | [`../bug-log.md`](../bug-log.md) |

---

## Change log

| Date | Change |
| :--- | :--- |
| 11/11/2026 | First version created for Assignment 3. Documents all 17 business endpoints of the real system, with examples captured from a live Docker Compose deployment (PostgreSQL 16, Node.js 20). |
