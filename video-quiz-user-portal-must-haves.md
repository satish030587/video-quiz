# Video Quiz App — User Portal Must‑Have Features (Story Mode)

This document lists every **must‑have feature** for the **User (Employee) Portal** of your Video Quiz App. It follows a realistic, story‑style walkthrough so you can validate the experience end‑to‑end and feed precise prompts to Copilot/Codex. Styling can come later; this focuses on functionality, integrity, and clarity.

---

## 0) Cast: Alex the learner (User persona)
Alex signs in to complete mandatory training. Alex needs a **clear path**: watch the video → take a **timed quiz** → pass → **unlock next** → download **certificate** at the end. The system should prevent shortcuts, **limit to two attempts**, and keep everything **mobile‑friendly**.

---

## 1) Secure sign‑in & first‑run setup
**What Alex does:** logs in on phone or laptop and lands on a simple, helpful home screen.

**Must‑haves**
- **Login page** with email + password (NextAuth/credentials or SSO) and secure cookies.
- **Forgot password** flow (email link) and optional first‑login password change.
- Clear error messages (invalid creds, locked account) — no sensitive details leaked.
- After login, redirect to **Dashboard**; persist session across refresh.

---

## 2) Dashboard: “Where am I? What’s next?”
**What Alex sees:** a progress‑oriented **Dashboard** listing modules in order with status: **Locked**, **Pending**, **Passed**, **Failed**.

**Must‑haves**
- **Module list** in training sequence with a **progress bar** (e.g., “2 of 5 passed”).
- Each module card shows: title, short description, **status badge**, attempts used (e.g., “1/2”), last score if any, and a **primary CTA** (Begin/Continue/Retry).
- A **Next action** banner (“Start Module 1” or “Retry Module 2 (1 attempt left)”). 
- If Alex failed twice on a module, clearly mark it **Failed (2/2)** and show what to do (e.g., “Contact admin”).

---

## 3) Module page: Video gate (watch‑to‑unlock)
**What Alex does:** opens a module and sees the embedded **YouTube** player.

**Must‑haves**
- YouTube **IFrame Player API** integration with event listener for **ENDED**; keep **Start Quiz** disabled until the **ended** event fires.
- Optional guardrails: disallow seeking/skip (best‑effort), re‑enable quiz only when fully watched.
- If the page refreshes mid‑video, the **quiz remains locked** until a full watch is completed again.
- Clear **CTA** and state change: “Watch complete ✅ – Start Quiz unlocked”.

---

## 4) Quiz runner: fair, focused, and timed
**What Alex does:** starts the quiz immediately after the video ends.

**Must‑haves**
- **Timed quiz**: visible countdown; **auto‑submit** on timeout.
- **Randomization**: questions drawn from the module’s bank (subset if configured) and **shuffled options** per attempt.
- **No back navigation**: once an answer is submitted (or if single‑page, once started), browser back and question backtracking should be blocked or warned.
- **Focus & fullscreen guard**: prompt to enter fullscreen; warn (or count) on **tab blur/visibility change**; optionally invalidate attempt on repeated focus loss (configurable).
- **Copy/paste & print disabled** in quiz area (best‑effort).
- **Accessible controls**: keyboard navigation, readable labels, and screen‑reader friendly markup.

---

## 5) Attempt rules & integrity
**What Alex must follow:** the business rules that keep the training fair.

**Must‑haves**
- Max **2 attempts** per module (enforced server‑side) — third submit is **blocked**.
- Pass threshold is **configurable** (e.g., 70%); passing attempt **unlocks next module**.
- If **second attempt fails**, mark module **Failed (2/2)** and **lock** subsequent modules.
- **Append‑only attempt log** (audit) — users can see their own history (scores, timestamps).

---

## 6) Submission & results
**What Alex sees after submit:** a fast, clean **Result** summary.

**Must‑haves**
- Show **score** and **Pass/Fail** status; do **not** show correct answers on screen.
- If failed attempt #1: show “**You have 1 attempt left**” and a **Retry** CTA.
- If failed attempt #2: show “**No attempts left**”; link back to Dashboard with a clear **Locked** state.
- If passed: show a celebratory message and a **Continue** CTA to the next module.

---

## 7) Sequential progression & locking
**What Alex cannot do:** jump ahead.

**Must‑haves**
- The **next module unlocks only after a pass** on the previous module.
- If a module is **failed twice**, all later modules remain **Locked**.
- Route‑level protection: even if Alex crafts URLs, **server checks** prevent access or submission out of sequence.

---

## 8) Certificates: earn, view, download
**What Alex gets at the end:** a **PDF certificate**.

**Must‑haves**
- **Eligibility check**: only when **all modules are passed**.
- **Download button** for a generated **PDF** with: Name, Date, Overall Score, Employee Code, Company, Congratulatory message, and Signature(s).
- **Certificate history** page/section listing issued certificates with download links.

---

## 9) Profile & preferences
**What Alex manages:** personal info and visibility.

**Must‑haves**
- **Profile page**: name, email, (employee code if used), and optional avatar.
- Change password; view recent login activity (last login time/IP) for transparency.
- **Language/timezone** (optional); mobile‑friendly page layouts.

---

## 10) Help & support
**What Alex needs:** quick help without leaving the flow.

**Must‑haves**
- **Help/FAQ** page covering: watching video tips, quiz timer rules, attempt limits, certificate FAQs.
- **Contact support** (in‑app mailto or form) and “Report an issue” from any page.
- Human‑readable error states (network error, session expired, etc.).

---

## 11) Notifications (optional but useful)
- Email or in‑app notices for: **New module assigned**, **Reminder to complete**, **Result summary**, **Certificate available**.
- Respect notification preferences where applicable.

---

## 12) Security, privacy, and reliability (user‑facing)
- Strict **auth guard** on every protected page and API.
- **Zod** validation on inputs; no sensitive data in client caches/localStorage.
- **CSP** allows YouTube embeds; blocks unknown frames and scripts.
- Graceful handling of poor connections: optimistic UI where safe, clear retry flows.

---

## TL;DR — User Portal Must‑Haves
- **Login + Forgot Password**, secure sessions  
- **Dashboard** with sequence, status badges, progress, attempts used  
- **Video Gate**: quiz unlocks only after full watch (YouTube IFrame API)  
- **Quiz Runner**: timer, randomization, no‑back, focus/fullscreen guard, no copy/paste  
- **Attempt Rules**: 2 attempts max; pass unlocks next; fail‑twice locks progression  
- **Results**: score + status; retry if 1 attempt left; no answer key shown  
- **Certificate**: available only when all modules passed; downloadable PDF  
- **Profile**: personal info, password change; mobile‑friendly  
- **Help/Support**: FAQ + contact; clear error states  
- **Security/Privacy**: server‑enforced gates; CSP; validation; reliable UX

---

### Implementation Tips for Copilot/Codex
- Treat the **video‑gate flag** as server‑trusted: even if the UI says “unlocked,” the **API must verify** sequence + attempts.
- Keep quiz **randomization server‑side**; do not send correct answers to the client.
- Always compute **score on the server** and append an immutable **Attempt** record.
- Gate the certificate route by a **server aggregation**: “are all modules passed?”
- Prefer **React Query** for module/quiz fetch + caching; add a **useQuizTimer** and **useFocusGuard** hook.
