# NexaCore — Multi-Tenant SaaS Platform

A production-grade multi-tenant SaaS platform built with **Node.js**, **Express**, **React**, and **PostgreSQL** featuring schema-level tenant isolation, JWT authentication, and role-based access control (RBAC).

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router, Axios, Vite |
| Backend   | Node.js, Express.js                 |
| Database  | PostgreSQL (schema-level isolation) |
| Auth      | JWT (access + refresh tokens)       |
| Security  | Helmet, CORS, bcrypt, rate limiting |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Install

```bash
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### 2. Configure

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set DB_PASSWORD to your PostgreSQL password
```

### 3. Create database

```sql
CREATE DATABASE nexacore;
```

### 4. Run

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173

## Demo Accounts (password: password123)

| Tenant       | Email            | Role    |
|--------------|------------------|---------|
| Acme Corp    | arjun@acme.com   | Admin   |
| Acme Corp    | priya@acme.com   | Manager |
| Acme Corp    | rahul@acme.com   | Viewer  |
| Nova Studios | ananya@nova.io   | Admin   |
| Zeta Finance | ria@zeta.com     | Admin   |

## API Endpoints

```
POST  /api/auth/:tenantSlug/login   Login (tenant-scoped)
POST  /api/auth/refresh             Refresh access token
GET   /api/auth/me                  Current user

GET   /api/users                    List users
POST  /api/users                    Create user (admin/manager)
PATCH /api/users/:id                Update user
DELETE /api/users/:id               Delete user (admin only)

GET   /api/analytics/summary        Tenant stats
GET   /api/analytics/activity       Activity log
GET   /api/rbac/my-permissions      Your permissions
GET   /api/rbac/matrix              Full RBAC matrix (admin only)
```

## Architecture

- Each tenant has an isolated PostgreSQL schema (`tenant_acme_corp`, etc.)
- JWT tokens carry `tenantId`, `schema`, and `role` claims
- `authorize(resource, action)` middleware factory gates every route
- Axios interceptor auto-refreshes expired access tokens
