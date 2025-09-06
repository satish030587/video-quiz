# Video Quiz App — Opinionated Technology Stack (Single Best Choice)

This stack is **production‑ready**, simple to operate, and aligns perfectly with your Video Quiz App requirements (video‑gate, timed quiz, 2‑attempt rule, audit logs, certificates, admin vs user roles). It cleanly separates **frontend**, **API**, and **backend services**, while remaining deployable as one Next.js project.

---

## Frontend (UI)
- **Framework:** **Next.js 14+ (App Router) with TypeScript**
- **Rendering:** Hybrid (Server Components + Client Components where needed)
- **State & Data Fetching:** **@tanstack/react-query** for client caching; `fetch()`/Route Handlers for server data
- **Video Embed:** **YouTube IFrame Player API** (client component wrapper)
- **Form Validation (client):** **Zod** (shared schemas with server)
- **Styling:** Keep minimal placeholders now (styling later); when ready, use **Tailwind CSS**

**Why:** Next.js App Router gives modern DX, easy server APIs, and excellent deployment on Vercel. React Query provides resilient client‑side caching for modules/quiz data.

---

## API Layer
- **Transport:** **Next.js Route Handlers** under `app/api/*` (pure server code)
- **Auth:** **NextAuth (Credentials Provider)** with secure session cookies
- **Role Checks:** Middleware + server helpers to enforce `ADMIN` vs `EMPLOYEE`
- **Validation:** **Zod** on every request body/query
- **Rate Limiting:** lightweight middleware (e.g., `@upstash/ratelimit` or in‑memory/dev) for `/api/auth/*` and `/api/attempt`
- **Security Headers:** Next middleware adds CSP, Referrer‑Policy, X‑Content‑Type‑Options, etc.

**Why:** Route Handlers keep the backend colocated, fast, and easy to test. NextAuth integrates cleanly with cookies and callbacks for role‑aware redirects.

---

## Backend Services (Domain Logic)
- **Language:** **TypeScript** modules in `/backend` (imported by API routes)
- **Responsibilities:** quiz generation + shuffling, scoring, attempt persistence, sequential gating, certificate generation, reporting, admin actions audit
- **PDF Certificates:** **pdfkit** (pure Node, deploy‑friendly) with template utility
- **MFA (Admin):** **otplib** (TOTP) or NextAuth TOTP adapter; QR code via `qrcode`

**Why:** Keeping business logic in a separate folder makes it testable and framework‑agnostic while still running in the same repo/deploy.

---

## Database & ORM
- **Database:** **PostgreSQL**
  - **Local Dev:** Dockerized Postgres
  - **Production:** **Supabase Postgres** (managed, backups, metrics)
- **ORM:** **Prisma**
- **Schema Entities:** `User (role=ADMIN|EMPLOYEE)`, `Module`, `Quiz (1:1 Module)`, `Question`, `Attempt (append‑only)`, `Certificate`
- **Migrations:** `prisma migrate`
- **Studio:** `prisma studio` for quick admin debugging

**Why:** Postgres is reliable and relational for quiz data; Prisma speeds development with type‑safe queries and easy migrations.

---

## Authentication & Sessions
- **Library:** **NextAuth (Credentials)** with bcrypt‑hashed passwords
- **Cookies:** HTTP‑Only, Secure, SameSite=Lax/Strict
- **Email Flows:** password reset, email verification (via provider like Resend/SendGrid)
- **Admin MFA:** TOTP enforced for `role=ADMIN` during login
- **RBAC:** `User.role` stored in DB; included in session; enforced in middleware + APIs

**Why:** Proven, secure, and fast to implement with clear role separation.

---

## Testing
- **Unit/Integration:** **Jest** + **@testing-library/react**
- **E2E:** **Playwright** (or Cypress) for flows: video‑gate → quiz → attempts → certificate
- **DB Test Strategy:** use a separate Postgres schema or test DB; seed known fixtures

**Why:** Great coverage for both business logic and real browser flows.

---

## Deployment & Ops
- **App Hosting:** **Vercel** (build + serve Next.js frontend & API)
- **Database:** **Supabase Postgres**
- **Secrets:** Vercel Project Environment Variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, mail creds, etc.)
- **Migrations:** `prisma migrate deploy` in CI or a one‑time script
- **Monitoring:** Vercel logs + optional Sentry for error tracking

**Why:** Minimal ops burden, quick rollbacks, and good observability.

---

## Recommended Project Layout
```
/app
  /api
    /auth  (NextAuth, login/logout, reset, verify)
    /modules
    /quiz
    /attempt
    /certificate
  (routes: /, /login, /module/[id], /quiz/[moduleId], /results/[moduleId], /admin/*)

/backend
  /auth        (helpers: role guard, session utils, MFA)
  /quiz        (question selection, shuffling, scoring)
  /attempts    (append-only writes, gating rules)
  /certs       (pdfkit templates & generator)
  /reports     (aggregations, CSV/PDF)
  /validators  (Zod schemas shared by API & client)

/prisma
  schema.prisma
  /migrations

/src/lib (optional shared helpers)
```

---

## Key NPM Dependencies
```bash
# Core
npm i next react react-dom typescript

# Data & State
npm i @tanstack/react-query

# Auth & Security
npm i next-auth bcrypt zod otplib qrcode

# DB/ORM
npm i @prisma/client
npm i -D prisma

# PDF
npm i pdfkit

# Testing
npm i -D jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright
```

---

## Non‑Goals (for now)
- No heavy styling system; keep UI minimal until functionality is done.
- No microservices; a single Next.js app with a clean separation of concerns is enough.
- No headless Chrome for PDFs (pdfkit is simpler to deploy). You can switch later if you need HTML‑accurate designs.

---

## One‑Line Summary
**Next.js (App Router) + TypeScript + NextAuth + Prisma + PostgreSQL (Supabase) + pdfkit + React Query on Vercel.**
