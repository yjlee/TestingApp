# Product Requirements Document (PRD)
## Thesis Repository & Review Web Application
website(paperpath.edu)

---

| Field | Details |
|---|---|
| **Version** | 1.1 |
| **Date** | 2026-05-23 |
| **Status** | Draft |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication & Account Management](#2-authentication--account-management)
3. [User Roles](#3-user-roles)
4. [User Profile](#4-user-profile)
5. [Field of Study](#5-field-of-study)
6. [Thesis Upload](#6-thesis-upload)
7. [PDF Reader](#7-pdf-reader)
8. [Visit & Download Tracking](#8-visit--download-tracking)
9. [Browsing & Search](#9-browsing--search)
10. [Review Submission & Payment](#10-review-submission--payment)
11. [Review Workflow — Stages](#11-review-workflow--stages)
12. [Reviewer Queue & Self-Assignment](#12-reviewer-queue--self-assignment)
13. [Review Comments](#13-review-comments)
14. [Reviewer Earnings & Payout](#14-reviewer-earnings--payout)
15. [Admin Panel](#15-admin-panel)
16. [Non-Functional Requirements](#16-non-functional-requirements)
17. [Pages & Sitemap](#17-pages--sitemap)
18. [Recommended Tech Stack](#18-recommended-tech-stack)
19. [Out of Scope (v1.0)](#19-out-of-scope-v10)
20. [Full Feature Summary](#20-full-feature-summary)

---

## 1. Overview

### 1.1 Purpose
A web platform that allows users to register, build a personal academic profile, upload thesis documents (PDF), and discover other users' published work — with engagement tracked via visit and download counts. Thesis can optionally be submitted for a formal two-round anonymous peer review process, gated by Stripe + Alipay payment, with a publishing queue as the final outcome.

### 1.2 Goals
- Give researchers and students a public profile to showcase their thesis work
- Make thesis documents discoverable, readable, and downloadable
- Track engagement (visits, downloads) per upload
- Provide a structured, anonymous two-round peer review pipeline
- Allow approved reviewers to earn and cash out for completed reviews
- Give admins full control over fields, reviewers, payouts, and the publishing queue

### 1.3 Target Users
| User Type | Description |
|---|---|
| Regular User | Students and researchers publishing thesis work |
| Reviewer | Approved academics (e.g. professors) who anonymously review thesis |
| Admin | Platform operator managing users, fields, payouts, and publishing |
| Guest | Non-registered visitors who can browse and read but not download |

---

## 2. Authentication & Account Management

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | User can register with email and password | Must Have |
| AUTH-02 | User can log in and log out | Must Have |
| AUTH-03 | Password reset via email | Must Have |
| AUTH-04 | Email verification on registration | Should Have |
| AUTH-05 | OAuth login (Google) | Could Have |
| AUTH-06 | Reviewer registers via invitation link only — not open registration | Must Have |

---

## 3. User Roles

Three internal roles exist, but only two are visible publicly.

### 3.1 Role Comparison

| Feature | Regular User | Reviewer | Admin |
|---|---|---|---|
| Create account | Open registration | Invitation link only | Pre-created |
| Public appearance | Regular User | **Looks like Regular User** | Admin |
| Select Field of Study | Yes | Yes — used for thesis matching | — |
| Upload thesis | Yes | No | No |
| Download thesis | Yes | Yes | Yes |
| View all theses | Yes | Yes | Yes |
| See thesis review queue | No | Yes (filtered by field) | Yes (all) |
| Self-assign to review | No | Yes | No |
| Leave review comments | No | Yes (anonymous) | No |
| Reply to reviewer comments | Yes (own thesis only) | Yes | No |
| Review same thesis twice | — | Blocked | — |
| Be second reviewer if already reviewed | — | Blocked | — |
| Generate reviewer invitation links | No | Yes | Yes |
| Manage users and fields | No | No | Yes |
| Approve payouts | No | No | Yes |
| Approve journal queue | No | No | Yes |

### 3.2 Role Visibility

> Reviewers appear identical to Regular Users on all public-facing pages. Their Reviewer role is never exposed publicly — only visible in the Admin panel.

### 3.3 Reviewer Invitation System

| ID | Requirement | Priority |
|---|---|---|
| ROLE-01 | A unique invitation link can be generated to create a Reviewer account | Must Have |
| ROLE-02 | Only Admins and existing Reviewers can generate invitation links | Must Have |
| ROLE-03 | Invitation link is single-use and expires after 7 days | Must Have |
| ROLE-04 | Reviewer registers through the invitation link with email and password | Must Have |
| ROLE-05 | Reviewer's public profile page looks identical to a regular user's profile | Must Have |
| ROLE-06 | Reviewer role badge is never shown publicly — only visible in Admin panel | Must Have |

---

## 4. User Profile

### 4.1 Profile Requirements

| ID | Requirement | Priority |
|---|---|---|
| PROF-01 | User can fill in personal details (see fields below) | Must Have |
| PROF-02 | Profile is publicly viewable by other users and guests | Must Have |
| PROF-03 | User can edit their own profile | Must Have |
| PROF-04 | Profile photo upload — not required but strongly recommended | Should Have |
| PROF-05 | If no profile photo set, display a nudge banner: *"Add a profile picture to make your profile stand out"* | Should Have |
| PROF-06 | Profile URL is human-readable (e.g. `/user/johndoe`) | Should Have |

### 4.2 Personal Detail Fields

| Field | Required |
|---|---|
| Full Name | Yes |
| Profile Photo | No (recommended) |
| Institution / University | Yes |
| Field of Study / Department | Yes |
| Academic Level (Undergraduate / Postgraduate / PhD / etc.) | Yes |
| Graduation Year | No |
| Short Bio | No |
| Email (display toggle — public/private) | No |
| LinkedIn / ResearchGate URL | No |

---

## 5. Field of Study

Field of Study is a **predefined, finite list** selected from a dropdown — not free text. This ensures thesis and reviewer fields can be matched accurately.

### 5.1 Field Requirements

| ID | Requirement | Priority |
|---|---|---|
| FIELD-01 | Field of Study is a finite list managed by Admin | Must Have |
| FIELD-02 | Regular users select their Field of Study during profile setup | Must Have |
| FIELD-03 | Reviewers select their Field of Study / Expertise during registration | Must Have |
| FIELD-04 | Thesis upload form requires a Field of Study selection from the same list | Must Have |
| FIELD-05 | Admin can toggle each field as **Open for Review** or **Closed for Review** | Must Have |
| FIELD-06 | Only thesis belonging to an Open for Review field can enter the review pipeline | Must Have |
| FIELD-07 | If a thesis field is Closed for Review, the Submit for Review option is hidden/disabled | Must Have |
| FIELD-08 | The list of Open for Review fields is displayed publicly on the landing page | Must Have |
| FIELD-09 | Admin can add new fields to the master list | Should Have |
| FIELD-10 | Admin can retire a field (only if no active thesis is using it) | Should Have |
| FIELD-11 | Changes to open/closed status reflect immediately on the landing page | Must Have |
| FIELD-12 | Each field on the landing page can optionally show number of thesis currently under review | Could Have |
| FIELD-13 | Clicking a field on the landing page leads to a filtered thesis search for that field | Could Have |

### 5.2 Example Field of Study List *(Admin configurable)*

```
Computer Science & IT
Engineering (Civil, Mechanical, Electrical, etc.)
Medicine & Health Sciences
Law
Business & Management
Education
Social Sciences
Natural Sciences (Biology, Chemistry, Physics)
Mathematics & Statistics
Arts & Humanities
Architecture
Economics
Environmental Studies
```

---

## 6. Thesis Upload

| ID | Requirement | Priority |
|---|---|---|
| THES-01 | Authenticated user can upload a PDF file | Must Have |
| THES-02 | Each upload requires a Title | Must Have |
| THES-03 | Each upload requires an Abstract / Description | Must Have |
| THES-04 | User can upload unlimited theses | Must Have |
| THES-05 | User can delete their own upload | Must Have |
| THES-06 | User can edit upload metadata (title, description, etc.) | Must Have |
| THES-07 | File size limit enforced (e.g. max 50MB) | Must Have |
| THES-08 | Only PDF format accepted | Must Have |

### 6.1 Thesis Metadata Fields

| Field | Required |
|---|---|
| Title | Yes |
| Abstract / Description | Yes |
| Field of Study | Yes |
| Year of Submission | Yes |
| Institution | Yes |
| Keywords / Tags | No |
| Supervisor Name | No |
| Language | No |

---

## 7. PDF Reader

| ID | Requirement | Priority |
|---|---|---|
| READ-01 | Thesis detail page includes an in-browser PDF reader | Must Have |
| READ-02 | PDF renders in a **single continuous vertical scroll** (top to bottom, no pagination UI) | Must Have |
| READ-03 | Reader is embedded on the thesis page — no need to open a separate tab | Must Have |
| READ-04 | Reader is responsive — readable on both desktop and mobile screens | Must Have |
| READ-05 | Download button remains available alongside the reader | Must Have |
| READ-06 | Guest users can read the PDF in-browser but cannot download | Must Have |

> **Recommended library:** `react-pdf` — renders PDF as continuous canvas/SVG elements in a single scrollable column.

---

## 8. Visit & Download Tracking

| ID | Requirement | Priority |
|---|---|---|
| TRACK-01 | Each thesis page records a visit count on every page load (total page loads) | Must Have |
| TRACK-02 | Each thesis records a download count on every PDF download | Must Have |
| TRACK-03 | Visit and download counts are displayed publicly on the thesis page | Must Have |
| TRACK-04 | Profile page shows total visits and total downloads across all uploads | Should Have |
| TRACK-05 | Only registered users can trigger a download — guest download button is hidden | Must Have |

---

## 9. Browsing & Search

| ID | Requirement | Priority |
|---|---|---|
| BROWSE-01 | Any user (logged in or guest) can visit another user's profile page | Must Have |
| BROWSE-02 | Profile page lists all of that user's uploaded theses | Must Have |
| BROWSE-03 | Clicking a thesis opens its detail page with metadata, PDF reader, and download option | Must Have |
| BROWSE-04 | Global thesis listing / discovery page | Should Have |
| BROWSE-05 | Search by thesis title or keyword | Should Have |
| BROWSE-06 | Filter by field of study, institution, or year | Could Have |

---

## 10. Review Submission & Payment

### 10.1 Review Opt-In

| ID | Requirement | Priority |
|---|---|---|
| REV-01 | During or after thesis upload, user is presented with: **"Submit for Review?"** (Yes / No) | Must Have |
| REV-02 | Option only appears if the thesis Field of Study is marked Open for Review by Admin | Must Have |
| REV-03 | If user selects No — thesis is published normally with no review workflow | Must Have |
| REV-04 | If user selects Yes — user is directed to the payment step | Must Have |
| REV-05 | Review submission cannot be undone after payment is confirmed | Must Have |

### 10.2 Payment via Stripe (Alipay)

| ID | Requirement | Priority |
|---|---|---|
| PAY-01 | User is shown the review fee amount before confirming | Must Have |
| PAY-02 | Payment is processed through Stripe with Alipay as the payment method | Must Have |
| PAY-03 | On successful payment, thesis status automatically advances to Stage 2: Payment Confirmed | Must Have |
| PAY-04 | On failed or cancelled payment, thesis remains at Stage 1 and user can retry | Must Have |
| PAY-05 | Payment confirmation receipt is stored and linked to the thesis record | Must Have |
| PAY-06 | User receives email notification upon successful payment | Should Have |
| PAY-07 | Review fee amount is configurable by Admin | Should Have |

---

## 11. Review Workflow — Stages

### 11.1 Full Stage List

| # | Stage Label | Description |
|---|---|---|
| 1 | **Uploaded PDF** | Thesis uploaded, no review requested yet |
| 2 | **Payment Confirmed** | User paid, thesis entered review pipeline |
| 3 | **Awaiting First Reviewer** | Thesis visible in queue, no reviewer has accepted yet |
| 4 | **First Review In Progress** | A reviewer has self-assigned and is actively reviewing |
| 5 | **First Review Done** | Reviewer 1 confirmed their review is complete |
| 6 | **Awaiting Second Reviewer** | Thesis back in queue for a second reviewer |
| 7 | **Second Review In Progress** | Second reviewer has self-assigned and is actively reviewing |
| 8 | **Second Review Done** | Reviewer 2 confirmed their review is complete |
| 9 | **Queued for Journal Publishing** | Admin approved — thesis in publishing queue |

### 11.2 Stage Transition Rules

```
Stage 1 ──► Stage 2 : Stripe payment confirmed
                       Triggered by: System (automatic on Stripe webhook success)

Stage 2 ──► Stage 3 : Thesis enters reviewer queue
                       Triggered by: System (automatic after Stage 2)

Stage 3 ──► Stage 4 : A reviewer self-assigns from the queue
                       Triggered by: Reviewer (voluntary)
             ↺ Stay  : No reviewer has accepted — remains "Awaiting First Reviewer"
                       Visible to: Thesis owner (shown as waiting)

Stage 4 ──► Stage 5 : Reviewer confirms their review is done
                       Triggered by: Reviewer 1 ONLY

Stage 5 ──► Stage 6 : Thesis re-enters queue for second reviewer
                       Triggered by: System (automatic after Stage 5)

Stage 6 ──► Stage 7 : A different reviewer self-assigns from the queue
                       Triggered by: Reviewer (voluntary) — must not be Reviewer 1
             ↺ Stay  : No reviewer has accepted — remains "Awaiting Second Reviewer"
                       Visible to: Thesis owner (shown as waiting)

Stage 7 ──► Stage 8 : Second reviewer confirms their review is done
                       Triggered by: Reviewer 2 ONLY

Stage 8 ──► Stage 9 : Admin reviews outcome and approves for journal queue
                       Triggered by: Admin ONLY
```

### 11.3 Who Can Trigger Each Transition

| Transition | Owner | Reviewer | Admin | System |
|---|---|---|---|---|
| Stage 1 → 2 | | | | Auto (Stripe webhook) |
| Stage 2 → 3 | | | | Auto |
| Stage 3 → 4 | | Self-assign | | |
| Stage 4 → 5 | | **Reviewer 1 only** | | |
| Stage 5 → 6 | | | | Auto |
| Stage 6 → 7 | | Self-assign (not Reviewer 1) | | |
| Stage 7 → 8 | | **Reviewer 2 only** | | |
| Stage 8 → 9 | | | Admin only | |

### 11.4 Waiting State Behaviour

| Situation | What Thesis Owner Sees |
|---|---|
| Stage 3, no reviewer yet | *"Awaiting First Reviewer — your thesis is in the review queue"* |
| Stage 6, no reviewer yet | *"Awaiting Second Reviewer — your thesis is back in the queue"* |
| Reviewer assigned, review ongoing | *"First / Second Review In Progress"* |
| Reviewer marks done | Stage advances automatically |

### 11.5 Visual Stage Tracker (Owner View)

```
[✅] Uploaded PDF
[✅] Payment Confirmed
[⏳] Awaiting First Reviewer     ← example current stage
[ ]  First Review In Progress
[ ]  First Review Done
[ ]  Awaiting Second Reviewer
[ ]  Second Review In Progress
[ ]  Second Review Done
[ ]  Queued for Journal Publishing
```

### 11.6 Stage Visibility Rules

| Viewer | What They See |
|---|---|
| Thesis Owner | Full stage progress tracker + current stage label |
| General Public / Guest | Stage not shown — thesis appears normally |
| Reviewer (assigned) | Only their active review stage and comment thread |
| Reviewer (completed, revisiting) | Read-only — no comment access, no re-assignment |
| Admin | Full pipeline view of all thesis and current stages |

---

## 12. Reviewer Queue & Self-Assignment

| ID | Requirement | Priority |
|---|---|---|
| QUEUE-01 | When a Reviewer logs in, they see a **Thesis Queue** filtered by their Field of Study | Must Have |
| QUEUE-02 | Queue shows thesis at Stage 3 (awaiting first reviewer) or Stage 6 (awaiting second reviewer) | Must Have |
| QUEUE-03 | Reviewer can browse queue — view title, abstract, field of study before accepting | Must Have |
| QUEUE-04 | Reviewer clicks **"Accept Review"** to self-assign | Must Have |
| QUEUE-05 | Once self-assigned, thesis advances to Stage 4 or Stage 7 automatically | Must Have |
| QUEUE-06 | A thesis taken by a reviewer disappears from the queue for others at that stage | Must Have |
| QUEUE-07 | A reviewer who completed Stage 4 cannot self-assign as Stage 7 reviewer on the same thesis | Must Have |
| QUEUE-08 | After completing review, reviewer can still visit and read the thesis — read-only, no re-assignment | Must Have |
| QUEUE-09 | Reviewer can only be active on a limited number of reviews at one time | Could Have |

### 12.1 Reviewer Restrictions Summary

| Rule | Detail |
|---|---|
| Only assigned reviewer can mark done | No one else — not admin, not owner |
| Reviewer 1 cannot be Reviewer 2 | System blocks self-assignment at Stage 6 if already reviewed this thesis |
| One review slot per thesis per reviewer | Cannot hold both Stage 4 and Stage 7 on same thesis |
| After completing, reviewer is read-only | Can visit, cannot comment or re-assign |

---

## 13. Review Comments

| ID | Requirement | Priority |
|---|---|---|
| CMT-01 | Reviewer can leave comments on the thesis they are assigned to | Must Have |
| CMT-02 | Thesis owner receives a notification when a new comment is posted | Should Have |
| CMT-03 | Thesis owner can reply to a reviewer's comment | Must Have |
| CMT-04 | Comments are **private** — visible only to the thesis owner and the commenting reviewer | Must Have |
| CMT-05 | Reviewer is displayed only as **"Reviewer"** — no name, photo, or profile link shown | Must Have |
| CMT-06 | Thesis owner cannot identify which reviewer left the comment | Must Have |
| CMT-07 | Multiple reviewers each have their own private thread on the same thesis | Must Have |
| CMT-08 | Reviewer can edit or delete their own comments | Should Have |
| CMT-09 | Comment thread is displayed as a reply chain (comment → reply → reply…) | Must Have |
| CMT-10 | Reviewer can only comment during their active review stage | Must Have |

---

## 14. Reviewer Earnings & Payout

| ID | Requirement | Priority |
|---|---|---|
| EARN-01 | Each completed review (Stage 5 or Stage 8) is logged as an earning record for the reviewer | Must Have |
| EARN-02 | Reviewer has a **Review History** page — all completed reviews with date and amount earned | Must Have |
| EARN-03 | Reviewer can see their total accumulated unpaid balance | Must Have |
| EARN-04 | Reviewer can request a **cash out / withdrawal** of their balance | Must Have |
| EARN-05 | Payout is processed via **manual Alipay transfer** — reviewer must provide their Alipay account ID | Must Have |
| EARN-06 | Each payout request is logged with status: Pending / Approved / Paid | Must Have |
| EARN-07 | Admin reviews and approves payout requests before money is released | Must Have |
| EARN-08 | Reviewer receives notification when payout is approved and processed | Should Have |
| EARN-09 | Minimum withdrawal amount is configurable by Admin | Should Have |
| EARN-10 | Earnings per review are configurable by Admin (can differ from what user pays) | Should Have |

### 14.1 Reviewer Earnings Dashboard (Example Layout)

```
┌──────────────────────────────────────────────────┐
│  My Review Earnings                              │
│                                                  │
│  Unpaid Balance:        RM 120.00                │
│  Total Earned to Date:  RM 340.00                │
│                                                  │
│  [ Request Cash Out ]                            │
├────────────┬───────────────┬────────┬────────────┤
│  Date      │  Thesis Title │  Stage │  Amount    │
├────────────┼───────────────┼────────┼────────────┤
│ 2026-05-01 │  Thesis A     │  Rev 1 │  RM 40.00  │
│ 2026-04-22 │  Thesis B     │  Rev 2 │  RM 40.00  │
│ 2026-04-10 │  Thesis C     │  Rev 1 │  RM 40.00  │
└────────────┴───────────────┴────────┴────────────┘
```

---

## 15. Admin Panel

| ID | Requirement | Priority |
|---|---|---|
| ADMIN-01 | Admin can log in via a protected admin route | Must Have |
| ADMIN-02 | Admin can view all registered users and their roles | Must Have |
| ADMIN-03 | Admin can generate reviewer invitation links | Must Have |
| ADMIN-04 | Admin can deactivate a user account | Must Have |
| ADMIN-05 | Admin can see full list of users with Reviewer role | Must Have |
| ADMIN-06 | Admin can view each reviewer's completed review count and earnings | Must Have |
| ADMIN-07 | Admin can **revoke** Reviewer role — user is downgraded to Regular User | Must Have |
| ADMIN-08 | On revocation — any active review is returned to the queue; earnings are preserved | Must Have |
| ADMIN-09 | Admin can re-grant Reviewer role to a previously revoked user via new invitation link | Should Have |
| ADMIN-10 | Revoked reviewer is notified by email | Should Have |
| ADMIN-11 | Admin can view all thesis currently in the review pipeline and their current stage | Must Have |
| ADMIN-12 | Admin can approve or reject reviewer payout requests | Must Have |
| ADMIN-13 | Admin approves Stage 8 → Stage 9 (journal publishing queue) | Must Have |
| ADMIN-14 | Admin can delete any thesis upload if needed | Should Have |
| ADMIN-15 | Admin can manage Field of Study list (add, open, close, retire) | Must Have |
| ADMIN-16 | Admin can configure review fee (what user pays) and reviewer payout amount per review | Should Have |
| ADMIN-17 | Admin can set minimum payout threshold | Should Have |
| ADMIN-18 | Admin can manually override a stage if needed | Should Have |

### 15.1 Reviewer Revocation Flow

```
Admin views Reviewer list
        │
        ▼
Admin selects Reviewer → clicks "Revoke Reviewer Role"
        │
        ▼
System checks: Does reviewer have an active review in progress?
        │
   ┌────┴────┐
  YES        NO
   │          │
   ▼          ▼
Thesis    Proceed with
returned  revocation
to queue  immediately
   │          │
   └────┬─────┘
        ▼
User account downgraded to Regular User
Earnings record preserved
Email notification sent
```

### 15.2 Field of Study Management (Admin View)

```
┌──────────────────────────────────────────────────────┐
│  Field of Study Management                           │
├──────────────────────────────┬───────────┬───────────┤
│  Field                       │  Status   │  Action   │
├──────────────────────────────┼───────────┼───────────┤
│  Computer Science & IT       │  ✅ Open  │  Close    │
│  Medicine & Health Sciences  │  ✅ Open  │  Close    │
│  Engineering                 │  ✅ Open  │  Close    │
│  Law                         │  ❌ Closed│  Open     │
│  Arts & Humanities           │  ❌ Closed│  Open     │
└──────────────────────────────┴───────────┴───────────┘
  [ + Add New Field ]
```

---

## 16. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | PDF files stored securely on server disk (`/uploads/`), migrated to cloud storage post-POC |
| NFR-02 | Only authenticated users can upload thesis |
| NFR-03 | Site must be fully responsive — optimized for desktop and smartphone |
| NFR-04 | Page load under 3 seconds for profile and thesis pages |
| NFR-05 | HTTPS enforced across all pages |
| NFR-06 | User cannot access or delete another user's uploads |
| NFR-07 | Reviewer identity is never exposed to thesis owner or public |
| NFR-08 | Stripe webhook must be handled securely to prevent fake payment confirmation |

---

## 17. Pages & Sitemap

```
Public
├── /                            Landing page (open fields for review, featured thesis)
├── /login                       Log in
├── /register                    Sign up (Regular User)
├── /forgot-password             Password reset
├── /invite/:token               Reviewer registration via invitation link
├── /search                      Browse and search all thesis
├── /user/:username              Public profile of any user
└── /thesis/:id                  Thesis detail page (PDF reader, metadata, counts)

Authenticated (Regular User)
├── /dashboard                   User's own profile, uploads, stats
├── /profile/edit                Edit personal details and photo
├── /upload                      Upload new thesis
├── /thesis/:id/reviews          Private comment thread (owner view)
└── /checkout/:thesis_id         Stripe + Alipay payment for review submission

Reviewer
├── /reviewer/queue              Thesis queue filtered by reviewer's field of study
├── /reviewer/active             Thesis currently under this reviewer's active review
├── /reviewer/history            Completed review history
└── /reviewer/earnings           Earnings dashboard and payout request

Admin
├── /admin                       Admin login
├── /admin/dashboard             Overview panel
├── /admin/users                 All users and roles
├── /admin/reviewers             All reviewers, review counts, revocation
├── /admin/reviewers/:id         Individual reviewer profile and actions
├── /admin/pipeline              All thesis in review pipeline and current stages
├── /admin/payouts               Pending payout requests from reviewers
└── /admin/fields                Field of Study management (open/close/add)
```

---

## 18. Recommended Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend Framework | Next.js 14 (React) | SSR for public pages (SEO), routing, full-stack in one repo |
| Language | TypeScript | Type safety, fewer runtime bugs |
| Styling | Tailwind CSS | Responsive design, fast to build |
| PDF Reader | react-pdf | Continuous scroll rendering, no page flip UI |
| Auth | NextAuth.js | Email/password, sessions, email verification built-in |
| Database | MySQL (e.g. PlanetScale / Railway) | Relational — fits users, thesis, stages, earnings well |
| File Storage | Local Server Storage (`/uploads/`) | POC — files saved on server disk, migrate to cloud storage post-POC |
| Payment | Stripe + Alipay (collection) / Manual Alipay transfer (reviewer payout) | Alipay for Chinese users; manual payout for POC |
| Deployment | VPS (e.g. DigitalOcean / Linode) + PlanetScale/Railway (DB) | Self-hosted for persistent disk storage |

### Architecture Overview

```
Browser (User)
     │
     ▼
┌─────────────┐        ┌──────────────────────┐
│  Next.js    │◄──────►│  NextAuth.js         │  (login / register / sessions)
│  (Vercel)   │        └──────────────────────┘
│             │        ┌──────────────────────┐
│  Pages +    │◄──────►│  MySQL Database      │  (users, thesis, stages, earnings)
│  API Routes │        └──────────────────────┘
│             │        ┌──────────────────────┐
│             │◄──────►│  Local /uploads/     │  (PDF files)
│             │        └──────────────────────┘
│             │        ┌──────────────────────┐
│             │◄──────►│  Stripe + Alipay     │  (payments) / Manual Alipay (reviewer payouts)
└─────────────┘        └──────────────────────┘
```

---

## 19. Out of Scope (v1.0)

- DOI / citation generation
- Plagiarism detection
- Messaging between users
- Public comments or ratings on thesis
- Paid / premium user tiers
- Mobile native app (iOS / Android)
- Multi-language UI

---

## 20. Full Feature Summary

```
✅ Responsive design — desktop and smartphone
✅ Open registration for Regular Users
✅ Reviewer registration via invitation link only (Admin or existing Reviewer generates)
✅ Email/password authentication with email verification
✅ User profile with academic personal details
✅ Profile photo (optional but strongly recommended with nudge prompt)
✅ Human-readable profile URLs (/user/username)
✅ Finite Field of Study list — admin managed
✅ Admin toggles fields Open / Closed for review
✅ Open for Review fields displayed publicly on landing page
✅ Unlimited PDF thesis uploads per user
✅ Thesis metadata (title, abstract, field, year, institution, keywords)
✅ In-browser continuous scroll PDF reader (no pagination)
✅ Guests can read PDF in-browser but cannot download
✅ Only registered users can download PDF
✅ Visit count and download count tracked per thesis (total page loads)
✅ Public profile pages showing all uploaded thesis
✅ Browse and search all thesis (by title, keyword, field, year)
✅ Reviewer profile appears identical to Regular User publicly
✅ Reviewer selects Field of Study — matched to thesis review queue
✅ Reviewer self-assigns from queue — no admin assignment needed
✅ Reviewer queue filtered by matching field of study
✅ One review per reviewer per thesis — no repeats
✅ Reviewer 1 is blocked from becoming Reviewer 2 on the same thesis
✅ After completing review, reviewer is read-only on that thesis
✅ Optional review submission at upload (gated by field availability)
✅ Stripe + Alipay payment gate before review pipeline begins
✅ 9-stage review workflow with visual progress tracker
✅ Waiting states (Stage 3, Stage 6) visible to thesis owner
✅ Only the assigned reviewer can mark their review as done
✅ Two independent anonymous reviewers per thesis
✅ Reviewer displayed as "Reviewer" only — identity never revealed
✅ Private comment threads per reviewer (owner + reviewer only)
✅ Thesis owner can reply to reviewer comments
✅ Reviewer can only comment during their active review stage
✅ Admin approves final Stage 8 → Stage 9 (journal publishing queue)
✅ Reviewer earnings recorded per completed review
✅ Reviewer earnings dashboard with payout request (Manual Alipay transfer)
✅ Admin approves reviewer payout requests
✅ Admin can revoke Reviewer role — user reverts to Regular User
✅ Active reviews returned to queue on revocation — earnings preserved
✅ Admin panel: user management, field management, pipeline view, payouts
```
