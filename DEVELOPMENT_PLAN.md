# Development Plan
## Thesis Repository & Review Web Application

**Date:** 2026-05-23
**Stack:** Next.js 14 · TypeScript · Tailwind CSS · jose sessions · PostgreSQL · Prisma · Stripe + Alipay

---

## Overview

| Phase | Focus | Deliverable |
|---|---|---|
| 1 | Project Setup & Auth | Working login/register flow |
| 2 | User Profiles | Public profile pages |
| 3 | Thesis Upload & Browsing | Upload, view, search thesis |
| 4 | PDF Reader & Tracking | In-browser reader, visit/download counts |
| 5 | Review Submission & Payment | Stripe + Alipay gate, stage 1→2 |
| 6 | Reviewer System | Queue, self-assign, stage transitions |
| 7 | Review Comments | Private threaded comments |
| 8 | Reviewer Earnings & Payouts | Earnings dashboard, payout requests |
| 9 | Admin Panel | Full admin controls |
| 10 | QA, Polish & Launch | Testing, security, deployment |

---

## Phase 1 — Project Setup & Authentication

**Goal:** Runnable app with working register, login, logout, and email verification.

### Tasks

#### 1.1 Project Scaffold
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Set up folder structure (`/app`, `/components`, `/lib`, `/types`)
- [ ] Configure environment variables (`.env.local`)
- [ ] Set up PostgreSQL database (e.g. Railway or Neon) and connect via Prisma
- [ ] Run PostgreSQL migrations for all tables and enums from DB_SCHEMA.md
- [ ] Configure local server storage directory (`/uploads/`) for PDF and photo files

#### 1.2 Authentication
- [ ] Register page — email + password form
- [ ] Login page
- [ ] Logout
- [ ] Email verification flow (email provider sends verification link — Phase 2 integration)
- [ ] Password reset — forgot password page + reset page (email provider required)
- [ ] Route protection via `proxy.ts` — guards authenticated and role-specific routes
- [ ] Session management via jose JWT stored in HttpOnly cookie
- [ ] *(Could Have)* Google OAuth login

#### 1.3 Base Layout
- [ ] Responsive navbar (desktop + mobile hamburger menu)
- [ ] Footer
- [ ] Mobile-first layout wrapper

**Milestone:** User can register, verify email, log in, log out, reset password.

---

## Phase 2 — User Profiles

**Goal:** Every user has a personal profile page visible to the public.

### Tasks

#### 2.1 Field of Study Seed Data
- [ ] Create and run seed script for initial `fields_of_study` list
- [ ] All fields default to `is_open_for_review = false` at seed

#### 2.2 Profile Setup
- [ ] Profile creation form on first login (if no profile exists, redirect here)
- [ ] Fields: full name, username, institution, field of study (dropdown), academic level, graduation year, bio, email toggle, LinkedIn, ResearchGate
- [ ] Username uniqueness validation
- [ ] Profile edit page (`/profile/edit`)

#### 2.3 Profile Photo
- [ ] Photo upload saved to local server storage (`/uploads/photos/`)
- [ ] Crop/resize on client before upload
- [ ] Default avatar placeholder if no photo set
- [ ] Nudge banner on dashboard: *"Add a profile picture to make your profile stand out"*

#### 2.4 Public Profile Page
- [ ] `/user/:username` — public profile page
- [ ] Shows: name, photo, institution, field of study, academic level, bio, social links
- [ ] Shows list of all uploaded theses (empty state if none)
- [ ] Accessible by guests and logged-in users

**Milestone:** Users have public profile pages with academic details.

---

## Phase 3 — Thesis Upload & Browsing

**Goal:** Users can upload thesis, view thesis detail pages, and browse/search all thesis.

### Tasks

#### 3.1 Thesis Upload
- [ ] Upload form page (`/upload`)
- [ ] Fields: title, abstract, field of study, year, institution, keywords, supervisor, language
- [ ] PDF file picker — validate file type (PDF only) and size (max 50MB)
- [ ] Save PDF to local server storage (`/uploads/theses/`) via API route
- [ ] Save thesis record to `theses` table in PostgreSQL
- [ ] Redirect to thesis detail page on success

#### 3.2 Thesis Management (Owner)
- [ ] Dashboard lists all user's own thesis with edit/delete options
- [ ] Edit thesis metadata page
- [ ] Soft delete thesis (sets `is_deleted = true`)

#### 3.3 Thesis Detail Page
- [ ] `/thesis/:id` — shows title, abstract, metadata, author info
- [ ] Download button (registered users only — hidden for guests)
- [ ] Guest sees read-only message near download button
- [ ] Clicking download increments `download_count`

#### 3.4 Browse & Search
- [ ] `/search` — lists all non-deleted thesis
- [ ] Search by title or keyword
- [ ] Filter by field of study
- [ ] Filter by year
- [ ] Filter by institution
- [ ] Pagination or infinite scroll

**Milestone:** Users can upload, manage, and browse thesis. Download gated to registered users.

---

## Phase 4 — PDF Reader & Tracking

**Goal:** In-browser continuous scroll PDF reader. Visit and download counts tracked.

### Tasks

#### 4.1 PDF Reader
- [ ] Install `react-pdf`
- [ ] Embed reader on thesis detail page
- [ ] Render all pages as a single vertical scroll column (no page flip UI)
- [ ] Loading skeleton while PDF loads
- [ ] Responsive: readable on desktop and mobile
- [ ] Guests can read — download button still hidden for guests

#### 4.2 Visit Count
- [ ] Increment `visit_count` on every thesis detail page load
- [ ] Skip increment if viewer is the thesis owner (self-visit prevention)
- [ ] Display visit count publicly on thesis page

#### 4.3 Download Count
- [ ] Increment `download_count` when registered user clicks download
- [ ] Serve PDF via protected API route — authenticates session before streaming file from `/uploads/`
- [ ] Display download count publicly on thesis page

#### 4.4 Profile Totals
- [ ] Public profile page shows total visits and total downloads across all thesis

**Milestone:** PDF readable in-browser. Accurate visit and download counts shown.

---

## Phase 5 — Review Submission & Payment

**Goal:** Thesis owner can opt into review, pay via Stripe (Alipay), and thesis enters the pipeline at Stage 2.

### Tasks

#### 5.1 Review Opt-In UI
- [ ] After upload (or from thesis dashboard), show **"Submit for Review?"** option
- [ ] Check if thesis `field_of_study` is `is_open_for_review = true`
- [ ] If field is closed — show disabled state: *"Review not available for this field of study"*
- [ ] If field is open — show review fee amount and **"Proceed to Payment"** button

#### 5.2 Stripe + Alipay Integration
- [ ] Install Stripe SDK (`stripe` server-side, `@stripe/stripe-js` client-side)
- [ ] Create Stripe Checkout Session on backend when user confirms intent (payment method: Alipay)
- [ ] Save `payments` record with `status = 'pending'`
- [ ] Redirect user to Stripe-hosted Alipay payment page for `/checkout/:thesis_id`
- [ ] Handle Stripe webhook (`checkout.session.completed`) — verify signature, set `status = 'confirmed'`
- [ ] On confirmed payment:
  - Set `payments.confirmed_at`
  - Create `thesis_review_submissions` record at Stage 2
  - Auto-advance to Stage 3 (Awaiting First Reviewer)

#### 5.3 Stage Tracker UI (Owner View)
- [ ] Visual step tracker on thesis detail page (owner only)
- [ ] Shows all 9 stages with current stage highlighted
- [ ] Waiting states show descriptive message (e.g. *"Your thesis is in the review queue"*)

#### 5.4 Failed / Cancelled Payment
- [ ] Handle Stripe cancel/return — return user to thesis page, no record created
- [ ] Handle Stripe failure — show error, allow retry

**Milestone:** Thesis owner can pay via Alipay and thesis enters Stage 3 (Awaiting First Reviewer).

---

## Phase 6 — Reviewer System

**Goal:** Reviewers can register via invite, see their queue, self-assign, and mark reviews done.

### Tasks

#### 6.1 Invitation Link System
- [ ] Admin and reviewers can generate invitation links (saved to `invitation_links`)
- [ ] Token is a cryptographically random string, expires in 7 days
- [ ] `/invite/:token` — validates token (not used, not expired), shows reviewer register form
- [ ] On register: create `users` record with `role = 'reviewer'`, mark token as used
- [ ] Reviewer profile includes Field of Study / Expertise selection
- [ ] Reviewer Alipay account ID field (required for payout)

#### 6.2 Reviewer Queue
- [ ] `/reviewer/queue` — lists thesis at Stage 3 or Stage 6 matching reviewer's field of study
- [ ] Each card shows: title, abstract, field, year, institution
- [ ] **"Preview"** opens thesis detail (read mode) before accepting
- [ ] **"Accept Review"** button — self-assigns reviewer

#### 6.3 Self-Assignment Logic
- [ ] On accept:
  - Create `reviewer_assignments` record (`review_round = 1` or `2`, `status = 'in_progress'`)
  - Advance `thesis_review_submissions.current_stage` to Stage 4 or Stage 7
  - Remove thesis from queue for other reviewers at that stage
- [ ] Block self-assign if reviewer already completed Round 1 for this thesis (enforce `UNIQUE (thesis_id, reviewer_id)`)

#### 6.4 Mark Review Done
- [ ] On `/reviewer/active` — reviewer sees their active assigned thesis
- [ ] **"Mark Review Done"** button — only available to the assigned reviewer
- [ ] On confirm:
  - Set `reviewer_assignments.status = 'done'`, `completed_at = NOW()`
  - Advance stage: 4 → 5 or 7 → 8
  - Stage 5 auto-advances to Stage 6 (system)
  - Log earning record in `reviewer_earnings`
- [ ] After completion: thesis moves to read-only for that reviewer

#### 6.5 Reviewer History
- [ ] `/reviewer/history` — list of all completed reviews (thesis title, round, date)

**Milestone:** Full reviewer self-service queue. Stages 3–8 driven by reviewer actions.

---

## Phase 7 — Review Comments

**Goal:** Private threaded comment system between reviewer and thesis owner.

### Tasks

#### 7.1 Comment Thread
- [ ] Comment thread visible on thesis detail page (below reader) — only to:
  - The thesis owner
  - The reviewer assigned to that specific round
- [ ] Reviewer sees thread scoped to their `assignment_id` only
- [ ] Reviewer displayed as **"Reviewer"** — no name, no profile link, no photo
- [ ] Owner replies inline under each reviewer comment

#### 7.2 Comment Actions
- [ ] Post new comment (reviewer only, during active review stage)
- [ ] Reply to comment (owner or reviewer)
- [ ] Edit own comment
- [ ] Soft delete own comment (shown as *"[deleted]"*)
- [ ] Comments are ordered by `created_at` ascending

#### 7.3 Notifications
- [ ] Notify thesis owner when a new comment is posted (in-app notification or email)
- [ ] Notify reviewer when owner replies

**Milestone:** Private anonymous review conversations work end-to-end.

---

## Phase 8 — Reviewer Earnings & Payouts

**Goal:** Reviewers can track earnings and request manual Alipay cash out. Admin approves and transfers.

### Tasks

#### 8.1 Earnings Logging
- [ ] On `reviewer_assignments.status` set to `done` — auto-create `reviewer_earnings` record
- [ ] Amount pulled from admin-configured payout rate

#### 8.2 Earnings Dashboard
- [ ] `/reviewer/earnings` — shows:
  - Unpaid balance
  - Total earned to date
  - Table: date, thesis title, round, amount, paid status
- [ ] **"Request Cash Out"** button — disabled if balance is below minimum threshold
- [ ] Reviewer must have an Alipay account ID saved on their profile before requesting payout

#### 8.3 Payout Request
- [ ] On cash out request:
  - Create `payout_requests` record (`status = 'pending'`) — includes reviewer's Alipay account ID at time of request
  - Link all unpaid `reviewer_earnings` records to this request
  - Mark linked earnings `is_paid = true` on admin approval
- [ ] Reviewer sees payout request status: Pending / Approved / Paid / Rejected

#### 8.4 Admin Payout Approval (Manual Alipay Transfer)
- [ ] Admin sees list of pending payout requests in admin panel — each shows reviewer Alipay account ID and amount
- [ ] Admin manually transfers funds via Alipay, then marks `payout_requests.status = 'approved'` → `'paid'`
- [ ] Admin can reject with a note
- [ ] Reviewer notified on approval or rejection

**Milestone:** Reviewers earn, request payouts, admin approves and manually transfers via Alipay.

---

## Phase 9 — Admin Panel

**Goal:** Admin has full control over users, fields, pipeline, and payouts.

### Tasks

#### 9.1 Admin Auth
- [ ] `/admin` — protected login page (admin role only)
- [ ] Redirect non-admins away from all `/admin/*` routes

#### 9.2 User Management
- [ ] `/admin/users` — table of all users with role and status
- [ ] Deactivate / reactivate user account
- [ ] Search and filter users by role, status, field

#### 9.3 Reviewer Management
- [ ] `/admin/reviewers` — list of all reviewers with review count and unpaid balance
- [ ] `/admin/reviewers/:id` — reviewer detail: profile, history, current active reviews
- [ ] **"Revoke Reviewer Role"** — downgrades to regular user
  - Returns any active review to the queue (reset stage back to Awaiting)
  - Preserves earnings history
  - Sends email notification
- [ ] Generate reviewer invitation link from admin panel

#### 9.4 Field of Study Management
- [ ] `/admin/fields` — table of all fields with Open / Closed toggle
- [ ] Toggle `is_open_for_review` — reflects immediately on landing page
- [ ] Add new field
- [ ] Retire field (if no active thesis using it)

#### 9.5 Review Pipeline
- [ ] `/admin/pipeline` — all thesis currently in review, grouped by stage
- [ ] Click into a thesis to see full stage history
- [ ] Stage 8 → Stage 9: **"Approve for Journal Queue"** button (admin only)
- [ ] Admin manual stage override (with audit note)

#### 9.6 Payout Management
- [ ] `/admin/payouts` — list of payout requests by status
- [ ] Approve, pay, or reject each request with optional note
- [ ] Reviewer notified on action

#### 9.7 Configuration
- [ ] Admin can set review fee (what user pays)
- [ ] Admin can set reviewer payout rate per review
- [ ] Admin can set minimum payout threshold

**Milestone:** Admin has full operational control of the platform.

---

## Phase 10 — QA, Polish & Launch

**Goal:** Stable, secure, performant production deployment.

### Tasks

#### 10.1 Responsive QA
- [ ] Test all pages on mobile (375px), tablet (768px), desktop (1280px)
- [ ] Fix any layout breaks in navbar, PDF reader, stage tracker, admin tables

#### 10.2 Security Checks
- [ ] Confirm all API routes validate session and role before acting
- [ ] Confirm Stripe webhook signature verification is in place (`stripe.webhooks.constructEvent`)
- [ ] Confirm thesis files in `/uploads/` are not publicly accessible — only served via authenticated API routes
- [ ] Confirm reviewer identity is never leaked in API responses
- [ ] Confirm comment threads are scoped to `assignment_id` in all queries
- [ ] Review for SQL injection, XSS, and IDOR vulnerabilities

#### 10.3 Edge Case Testing
- [ ] Payment fails mid-flow — thesis stays at Stage 1
- [ ] Reviewer revoked mid-review — thesis returns to queue
- [ ] Reviewer tries to take Round 2 after completing Round 1 — blocked
- [ ] Field closed after thesis submitted for review — active pipeline unaffected
- [ ] Expired invitation link — shows clear error
- [ ] Guest tries to download — blocked at API, not just UI

#### 10.4 Performance
- [ ] Confirm thesis list and search pages are paginated
- [ ] Confirm PDF is loaded lazily (not all pages upfront)
- [ ] Add loading skeletons for thesis list, PDF reader, profile
- [ ] Check PostgreSQL query performance with indexes

#### 10.5 Deployment
- [ ] Provision VPS (e.g. DigitalOcean / Linode) and configure Node.js runtime
- [ ] Set all environment variables on the VPS
- [ ] Configure production MySQL database (e.g. PlanetScale or Railway)
- [ ] Ensure `/uploads/` directory is persistent and backed up on the VPS
- [ ] Set up custom domain and HTTPS (e.g. via Nginx + Let's Encrypt)
- [ ] Run final smoke test on production URL

**Milestone:** Application is live, stable, and secure.

---

## Summary Timeline (Estimated)

| Phase | Estimated Duration |
|---|---|
| Phase 1 — Setup & Auth | 1 week |
| Phase 2 — Profiles | 1 week |
| Phase 3 — Upload & Browsing | 1.5 weeks |
| Phase 4 — PDF Reader & Tracking | 1 week |
| Phase 5 — Review Submission & Payment | 1.5 weeks |
| Phase 6 — Reviewer System | 2 weeks |
| Phase 7 — Review Comments | 1 week |
| Phase 8 — Earnings & Payouts | 1 week |
| Phase 9 — Admin Panel | 2 weeks |
| Phase 10 — QA & Launch | 1 week |
| **Total** | **~13 weeks** |

> Estimates assume a single developer. Parallel work on frontend and backend can compress this timeline.

---

## Development Order Rationale

```
Auth → Profiles → Upload → Reader → Payment → Reviewer → Comments → Earnings → Admin → Launch

Each phase builds on the previous:
- You cannot upload without an account (Phase 1 before Phase 3)
- You cannot review without thesis in the system (Phase 3 before Phase 6)
- You cannot earn without completing reviews (Phase 6 before Phase 8)
- Admin panel is built last as it wraps all other features (Phase 9)
```
