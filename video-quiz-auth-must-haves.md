# Video Quiz App — Authentication (Sign‑Up & Sign‑In) Must‑Have Features (Story Mode)

This document lists every **must‑have feature** for **Authentication** in your Video Quiz App — covering **sign‑up**, **sign‑in**, **session security**, **role detection** (Admin vs User), and the guardrails that keep the system fair and safe. It’s written in practical story mode and optimized for developer prompts (Copilot/Codex). Styling can come later; this focuses on correctness, integrity, and security.

---

## 0) Cast: Sam (Admin) & Alex (Employee)
- **Sam** is the single **Admin** who onboards employees, manages content, resets attempts, and issues certificates.
- **Alex** is an **Employee** who must watch videos, take timed quizzes, unlock modules sequentially, and earn a certificate.

Authentication must differentiate Sam from Alex reliably, and keep both accounts safe without friction.

---

## 1) Account Creation (Sign‑Up) — “How accounts are born”
**Story:** On day zero, Sam needs an admin account. After that, Alex and co. join via admin‑initiated invites (preferred) or SSO.

**Must‑haves**
- **Admin bootstrap**: The very first admin is created securely (migration seed or one‑time setup CLI). Admin email is unique; password is hashed (**bcrypt**).
- **Invite‑based employee sign‑up** (recommended):
  - Sam enters name + email → system sends a **magic link** or **invite token**.
  - Alex follows the link, sets a **new password**, and (optionally) verifies email.
- **Optional SSO** (Google/MS) for enterprises; map domains or groups to roles (EMPLOYEE by default).
- **Email verification** for new accounts (toggleable). Unverified accounts can’t log in to protected areas.
- **Duplicate/abuse prevention**: Throttle invites, validate domains (e.g., company only), and rate‑limit sign‑up endpoints.
- **Role assignment at creation**: Admin vs Employee is stored in the **User.role** field (e.g., `ADMIN` / `EMPLOYEE`).

**Nice‑to‑have**
- **Bulk import** (CSV) to pre‑create employees and auto‑send invites.
- **Profile prefill**: employee code, department, and manager (for reporting).

---

## 2) Sign‑In (Login) — “Prove it’s you”
**Story:** Alex visits `/login`. Sam uses the same route but lands in a different place due to role. Everybody gets the right level of access.

**Must‑haves**
- **Credential login** (email + password) using NextAuth (Credentials Provider) or your auth choice.
- **MFA for Admin** (TOTP app or WebAuthn) — enforced for `role=ADMIN`.
- **Brute‑force defense**: rate‑limit login by IP + email; **progressive backoff**, **lockout after N failures**, and an **unlock email**.
- **Clear errors** without leaking signals: “Invalid email or password” (no “which field” hints).
- **Remember me** (optional, secure): longer refresh token or longer session for employees.
- **Post‑login redirect**:
  - If `role=ADMIN` → **/admin** (dashboard).
  - If `role=EMPLOYEE` → **/** (user dashboard).
- **Session cookies**: HTTP‑only, Secure, SameSite=Lax/Strict. Sign/Encrypt tokens. Short access token TTL + silent refresh when appropriate.
- **Device/session management**: record last login timestamp, IP (optional), user agent; expose last login to user in Profile.

**Nice‑to‑have**
- **Passwordless** login (magic link/WebAuthn) for employees, still **require MFA for Admin**.
- **SSO**: map IdP groups/claims to app roles.

---

## 3) Forgot Password & Reset — “Get back in securely”
**Story:** Alex forgets the password. The system provides a safe, time‑bound reset flow.

**Must‑haves**
- **Forgot password** page: collects email; always say “If that email exists… we sent a link.”
- **Time‑bound reset token** (15–60 mins), one‑time use; revoke previous tokens on issue.
- **Password rules**: minimum length, disallow leaked/common passwords (zxcvbn check), rate‑limit attempts.
- **Audit**: log reset requests and completions (append‑only).

**Nice‑to‑have**
- “Change password at next login” flag that Sam can set on a user.

---

## 4) Email Verification — “Prove ownership of inbox”
**Story:** New employees verify their email so the company knows it’s them.

**Must‑haves**
- **Verification link** with short TTL and one‑time use.
- Block access to protected areas until verified (configurable for SSO).
- **Resend verification** with backoff/rate limit.

---

## 5) Role Detection & Routing — “Admin vs User, same door, different rooms”
**Story:** After login, the app sends each person to their correct home and keeps them there unless authorized otherwise.

**Must‑haves**
- **Authoritative roles** on the server: `User.role` = `ADMIN` or `EMPLOYEE`.
- **Post‑login redirect logic** checks role and sends:
  - Admin → **/admin** (Admin Dashboard)
  - Employee → **/** (User Dashboard)
- **Route guards** (server + client):
  - **Admin‑only** routes (e.g., `/admin/*` and `/api/admin/*`) reject non‑admins with **403**.
  - **Employee‑only** areas can be generic authenticated routes; module/quiz APIs also check progression.
- **UI gating**: hide admin menu for non‑admins; avoid “security by CSS”.

**Nice‑to‑have**
- **Feature flags** per role to roll out features gradually.

---

## 6) Sessions & CSRF — “Stay logged in, safely”
**Story:** Alex stays signed in across tabs; tokens expire gracefully; forms are protected from cross‑site trickery.

**Must‑haves**
- **Short‑lived access** tokens + **rotating refresh** (or NextAuth session cookie model).
- **CSRF tokens** for state‑changing requests (if using cookies).
- **SameSite** cookie policy, Secure cookies (HTTPS), and **HSTS** in production.
- **Sign‑out everywhere**: clear cookies; invalidate refresh tokens; optional “log out of other devices.”
- **Idle timeout** for admin; session extension on activity (configurable).

---

## 7) Account States — “Know when to say no”
**Story:** The system gracefully handles edge cases without confusing users.

**Must‑haves**
- **Disabled** accounts (e.g., offboarded) can’t log in; show generic message.
- **Locked** accounts (too many failed attempts) — email unlock or admin unlock.
- **Unverified** email — prompt to verify; allow resend.
- **Password expired/required change** — forced update flow.

---

## 8) Audit & Telemetry — “Who did what, when”
**Story:** For compliance and trust, we record relevant security events.

**Must‑haves**
- **Audit log** (append‑only) for auth events: sign‑in success/failure, sign‑out, password reset requested/completed, email verification sent/completed, MFA enrolled/failed.
- **Admin actions audit** (separate): user created, role changed, attempts reset, certificate reissued.
- **Minimal PII**; redact where possible; secure retention and access policies.

---

## 9) Security Hardening — “Paper cuts prevented”
**Story:** Common pitfalls are handled by default so engineers don’t reinvent security badly.

**Must‑haves**
- **Bcrypt** hashing for passwords; never log secrets; avoid long‑term tokens in localStorage.
- **CSP** (Content‑Security‑Policy) that allows YouTube, blocks unknown iframes/scripts.
- **Rate limiting** on auth endpoints; IP allow/deny lists (optional).
- **Input validation** with **Zod** on all auth APIs.
- **Email content**: no secret tokens after first click; show sender identity and company branding.

---

## 10) Developer Experience — “Make it hard to misuse”
**Story:** The code and config make the secure path the easy path.

**Must‑haves**
- Central **Auth module**: login, logout, sign‑up/invite, roles, MFA, email verification, password reset — all in one place.
- **Shared Zod schemas** for auth payloads on client and server.
- **Route helpers**: `requireAdmin()`, `requireUser()`, `getSessionUser()`.
- **Testing**: unit tests for role redirect, failed login lockout, expired reset token; E2E for full login, quiz access, and admin access denial.

---

## 11) Concrete Flows (Happy Paths & Errors)

### A) First Admin (Bootstrap)
1. Dev/ops runs a seed: creates Sam with `role=ADMIN` and temporary password.
2. Sam logs in, is prompted to **turn on MFA**.
3. Sam can now invite employees.

### B) Employee Invite → Sign‑Up
1. Sam enters Alex’s email; system sends invite link.
2. Alex sets password (and optionally verifies email).
3. Alex logs in and is routed to the **User Dashboard**.

### C) Regular Login
1. Alex enters credentials on `/login`.
2. If MFA enabled (for admin), perform TOTP step.
3. On success, issue session cookie → redirect based on `role`.

### D) Forgot Password
1. Alex requests reset → receives email with time‑bound link.
2. Alex sets a new password → old sessions invalidated → redirect to login.

### E) Lockout & Unlock
1. Too many failed attempts → account temporarily locked.
2. Unlock via email link or admin panel.

---

## 12) Minimal Data Model & Endpoints (Auth Layer)

**User (DB model)**
- `id`, `email (unique)`, `name`, `role` (`ADMIN` | `EMPLOYEE`), `passwordHash`, `mfaSecret?`, `emailVerifiedAt?`, `createdAt`, `updatedAt`

**Session/Token (if using JWT/refresh)**
- `userId`, `refreshToken (hash)`, `expiresAt`, `createdAt`, `ip`, `userAgent`

**Core Endpoints (examples)**  
- `POST /api/auth/login` — authenticate, set cookie/session, return role + redirect target  
- `POST /api/auth/logout` — revoke session  
- `POST /api/auth/invite` (admin) — send invite link  
- `POST /api/auth/signup` — complete invite (token + password)  
- `POST /api/auth/verify-email` — verify token  
- `POST /api/auth/forgot` — request password reset  
- `POST /api/auth/reset` — complete reset with token  
- `POST /api/auth/mfa/setup` (admin) — enroll TOTP  
- `POST /api/auth/mfa/verify` (admin) — verify TOTP on login

(If using **NextAuth**, many routes are under `/api/auth/[...nextauth]`. Keep **role checks** in callbacks and in API route guards.)

---

## 13) How the App Identifies Admin vs User (Authoritative Rule)
- The **User** table has a **`role`** field: `ADMIN` or `EMPLOYEE`.
- On successful login, the **session** (or JWT) includes `role`.
- **Post‑login redirect**:
  - `role=ADMIN` → `/admin`
  - `role=EMPLOYEE` → `/`
- **Server‑side guards** enforce access:
  - Admin pages and routes (`/admin/*`, `/api/admin/*`) check `role=ADMIN`; else **403**.
  - User pages check authenticated session; module/quiz routes additionally check **progression rules**.
- **UI hides** admin controls for non‑admins, but **security is enforced server‑side**.

---

## TL;DR — Authentication Must‑Haves
- **Admin bootstrap** account; **invite‑based** employee sign‑up; optional SSO  
- **Secure login** with **MFA for Admin**, rate‑limit, lockout, clear errors  
- **Role detection**: `User.role` in session, **redirects** and **route guards**  
- **Email verification**, **forgot/reset password** with time‑bound tokens  
- **Sessions**: HTTP‑only cookies, CSRF, SameSite, HTTPS/HSTS, sign‑out everywhere  
- **Account states**: disabled, locked, unverified, password‑expired  
- **Audit logs** for auth events & admin actions; minimal PII  
- **Security hardening**: bcrypt, CSP, rate limiting, Zod validation  
- **DX**: shared schemas, helper guards, unit & E2E tests for critical paths

---

### Implementation Tips for Copilot/Codex
- Enforce **MFA** in the login callback for admins; reject sessions without verified TOTP.
- Centralize **role checks** in a helper and in middleware to avoid duplication.
- Use **Prisma** unique indexes for email; store **refresh tokens hashed** (if used) and rotate frequently.
- Treat **invite and reset tokens** as one‑time, short‑lived credentials; store **hashed token** + expiry.
- Write **tests first** for lockout, redirect by role, and expired tokens to avoid regressions.

