# Video Quiz App — Admin Portal Must‑Have Features (Story Mode)

This document lists every **must‑have feature** for the **Admin Portal** of your Video Quiz App, written in practical story mode. It’s focused on **functionality first** (styling later), with integrity, auditability, and security built‑in. Use this to brief developers or drive Copilot/Codex prompts.

---

## 0) Cast: Sam the Administrator (Persona)
Sam is responsible for rolling out training to ~100 employees, ensuring fair assessments, and producing compliance reports. Sam needs clear control of **content**, **users**, **attempts**, **analytics**, and **certificates**, all under strong **security**.

---

## 1) Secure Admin Access
**What Sam does:** logs in and lands on an admin‑only area.

**Must‑haves**
- **Admin login** (NextAuth credentials or SSO) with **role check** (ADMIN vs EMPLOYEE).
- **MFA (TOTP)** strongly recommended for admin sign‑in.
- **Session security**: HTTP‑only cookies, SameSite=Lax/Strict, short session idle timeout.
- **Authorization guards** on every admin route + API; **404/403** for non‑admins.

---

## 2) Admin Dashboard — “Who’s done? Who’s stuck?”
**What Sam sees:** a command center with immediate status and quick actions.

**Must‑haves**
- **KPIs**: completion rate, average score per module, # users **failed twice/locked**.
- **Charts**: per‑module pass/fail distribution; trend of completions over time.
- **Action tiles**: “Users locked (2/2)”, “Modules with high fail rate”, “New users added this week”.
- **Quick links** to Users, Modules, Questions, Reports, Certificates, and Settings.

---

## 3) User Management
**What Sam does:** add or disable users, review progress, help a stuck learner.

**Must‑haves**
- **Add user** (email, name, role=EMPLOYEE by default); **disable/enable** user.
- **Bulk import** via CSV (email, name, employee code, dept, etc.).
- **Per‑user progress view**: modules list with status (Passed/Failed/Locked), attempts used, scores, timestamps.
- **Reset attempts** for a module (policy‑controlled) — e.g., grant one more chance.
- Optional: **force password reset** at next login; send invite email.

---

## 4) Module & Video Management
**What Sam does:** create the training path and control sequence.

**Must‑haves**
- **Create/edit modules**: title, description, **YouTube ID/URL**, display order.
- **Reordering** modules via drag‑and‑drop (sequence enforces progression lock).
- **Preview** module page to verify player loads and gate works.
- **Publish/unpublish** module (hide while drafting).

---

## 5) Quiz & Question Bank Management
**What Sam does:** attach a quiz to each module and manage a question bank that scales.

**Must‑haves**
- One **Quiz per Module** with configurable **pass score** (e.g., 70%) and **time limit**.
- **Question CRUD**: text, choices (min 3–4), **correct answer index**.
- **Randomization toggles**: shuffle question order; shuffle options on every attempt.
- **Bulk import** questions (CSV/TSV) with validation + preview before commit.
- **Do not reveal** correct answers to users post‑submission (policy switch if needed).

---

## 6) Attempt Oversight & Progression Control
**What Sam monitors:** fairness and flow from one module to the next.

**Must‑haves**
- **Max 2 attempts** per module enforced **server‑side**; block third submit.
- **Sequential progression**: next module unlocks **only on pass**; fail twice locks progression automatically.
- **Append‑only Attempt log** for each submit: score, answers JSON, timestamp, IP (optional), user agent (optional).
- **Admin override**: reset attempts, unlock a module, or exclude an attempt from reports (soft‑delete/flag only).

---

## 7) Certificates — Template & Issuance
**What Sam manages:** a branded certificate that auto‑generates when training is done.

**Must‑haves**
- **Template editor**: logo, signatures, congratulatory text, footer, date format.
- **Auto‑issue** **PDF** when **all modules are passed** (server gate).
- **Fields**: Employee **Name**, **Employee Code**, **Company**, **Date**, **Overall Score**, **Message**, **Signature(s)**.
- **Re‑issue** on demand; **history** per user with file path/URL.
- Storage options: local (`/public/certificates/...`) or cloud (S3/Supabase Storage).

---

## 8) Reporting & Analytics
**What Sam produces:** compliance proof and actionable insights.

**Must‑haves**
- **Filters**: by date range, module, user group/department.
- **Exports**: **CSV/PDF** for user completions, per‑module scores, fail‑twice cohort.
- **Cohort breakdown** tables and a **leaderboard** (optional, if culture allows).
- **Scheduled reports** (optional): monthly CSV to HR email.

---

## 9) Cheat‑Prevention Policy Controls
**What Sam tunes:** guardrails that keep assessments fair.

**Must‑haves**
- **Video gate**: quiz starts only after **player END** event.
- **Timer**: per‑quiz time limit with **auto‑submit**.
- **Focus/fullscreen guard**: warn or invalidate on repeated tab blur/visibility loss.
- **No back navigation** once quiz starts; disable copy/paste/print in quiz surface (best‑effort).
- **CSP**: allow only YouTube & required domains; block unknown iframes/scripts.
- **Rate limiting** on auth and attempt APIs.

---

## 10) System Settings & Branding
**What Sam configures:** once, then forgets.

**Must‑haves**
- **Branding**: app name, logo, primary colors (applied later in styling phase).
- **Thresholds**: global pass score default, attempt limit (fixed to 2 or configurable), quiz length defaults.
- **Emails**: SMTP/provider settings for invites and notifications.
- **Feature flags**: enable/disable focus guard severity; enable leaderboard; etc.

---

## 11) Security & Compliance
**What protects Sam and learners:** strong defaults and good hygiene.

**Must‑haves**
- **HTTPS** everywhere; secure cookies; HSTS (prod).
- **Zod** validation on every API; strong **AuthZ** on admin routes.
- **Password hashing** with **bcrypt** (or auth provider); never store plaintext secrets.
- **Audit trail** of admin actions (append‑only): user resets, content edits, certificate re‑issues.
- **PII care**: avoid caching sensitive data client‑side; redact in logs; least‑privilege DB access.
- **Backups** and **migration** discipline (Prisma migrations versioned).

---

## 12) Navigation & IA (Information Architecture)
**What helps Sam move fast:** predictable, clean menus.

**Must‑haves**
- Top/side **Admin Nav**: **Dashboard**, **Users**, **Modules**, **Quizzes/Questions**, **Reports**, **Certificates**, **Settings**, **Logout**.
- Breadcrumbs within admin; consistent table tooling (search, sort, filter, paginate).
- Mobile‑responsive layout (collapsible nav).

---

## 13) Admin Pages & API Endpoints (Wiring Map)
**Pages**  
- `/admin` (KPI overview)  
- `/admin/users` (list, view, add, disable, reset attempts)  
- `/admin/modules` (list, create/edit, reorder, publish/unpublish)  
- `/admin/questions` (bank + CRUD + bulk import) and `/admin/quizzes` (per‑module config)  
- `/admin/reports` (filters + exports)  
- `/admin/certificates` (template, re‑issue, history)  
- `/admin/settings` (branding, email, thresholds, CSP allowlist, feature flags)

**APIs** (admin‑only; examples)  
- `POST /api/admin/users` | `PATCH /api/admin/users/:id` | `POST /api/admin/users/reset-attempts`  
- `POST /api/admin/modules` | `PATCH /api/admin/modules/:id` | `POST /api/admin/modules/reorder`  
- `POST /api/admin/questions` | `PATCH /api/admin/questions/:id` | `POST /api/admin/questions/bulk`  
- `POST /api/admin/quizzes` | `PATCH /api/admin/quizzes/:id`  
- `GET /api/admin/reports` (CSV/PDF)  
- `POST /api/admin/certificates/reissue` | `POST /api/admin/certificates/template`

---

## TL;DR — Admin Portal Must‑Haves
- **Secure Admin Access** with MFA and role‑guarded routes  
- **Dashboard** KPIs + hotlists + quick links  
- **Users**: add/disable, CSV import, per‑user progress, **reset attempts**  
- **Modules**: create/edit, reorder, publish/unpublish, YouTube link  
- **Quizzes/Questions**: per‑module settings, question bank CRUD, **bulk import**, randomization, timer  
- **Attempts Oversight**: enforce **2 attempts**, sequential locks, append‑only audit, admin override  
- **Certificates**: branded template, **auto‑issue**, re‑issue, history, storage  
- **Reports/Analytics**: filters, **CSV/PDF exports**, trends  
- **Cheat‑Prevention Controls**: gate, timer, focus/fullscreen, no‑back, CSP, rate limiting  
- **Settings & Branding**: thresholds, email, feature flags  
- **Security & Compliance**: HTTPS, bcrypt, Zod, AuthZ, admin action logs, backups  
- **Admin Nav & IA**: predictable menus, search/sort/filter, responsive

---

### Implementation Tips for Copilot/Codex
- Keep **attempt limit** and **sequence gating** on the **server** — UI is informative, API is authoritative.
- Store **Attempt** records as **append‑only**; never mutate past results; use flags for overrides.
- Make **certificate generation** a backend service; store file path and metadata.
- Centralize **Zod** schemas and **role guards** for API routes; write unit tests for edge policies.
- Provide **CSV templates** for user and question bulk imports with in‑app validation previews.

