# Database Schema
## Thesis Repository & Review Web Application

**Database:** PostgreSQL (via Railway, Neon, or Supabase)
**Date:** 2026-05-23

---

## Table of Contents

1. [Entity Overview](#1-entity-overview)
2. [Table Definitions](#2-table-definitions)
   - [users](#21-users)
   - [profiles](#22-profiles)
   - [fields_of_study](#23-fields_of_study)
   - [theses](#24-theses)
   - [thesis_review_submissions](#25-thesis_review_submissions)
   - [payments](#26-payments)
   - [reviewer_assignments](#27-reviewer_assignments)
   - [review_comments](#28-review_comments)
   - [reviewer_earnings](#29-reviewer_earnings)
   - [payout_requests](#210-payout_requests)
   - [invitation_links](#211-invitation_links)
3. [Relationships Diagram](#3-relationships-diagram)
4. [Indexes](#4-indexes)
5. [Enums](#5-enums)

---

## 1. Entity Overview

| Table | Description |
|---|---|
| `users` | All accounts — Regular Users, Reviewers, Admins |
| `profiles` | Extended personal details for each user |
| `fields_of_study` | Finite admin-managed list of academic fields |
| `theses` | Uploaded thesis documents and metadata |
| `thesis_review_submissions` | Tracks a thesis through the 9-stage review pipeline |
| `payments` | Stripe payment records for review submission fees |
| `reviewer_assignments` | Links a reviewer to a thesis for Round 1 or Round 2 |
| `review_comments` | Private comment threads between reviewer and thesis owner |
| `reviewer_earnings` | Earnings logged per completed reviewer assignment |
| `payout_requests` | Reviewer cash out requests sent to admin |
| `invitation_links` | Single-use tokens for Reviewer registration |

---

## 2. Table Definitions

---

### 2.1 `users`

Core authentication and role record for every account.

```sql
CREATE TABLE users (
  id                UUID      PRIMARY KEY,
  email             VARCHAR(255)  NOT NULL UNIQUE,
  password_hash     TEXT          NOT NULL,
  role              user_role     NOT NULL DEFAULT 'regular',
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  email_verified    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
```

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique, used for login |
| password_hash | TEXT | Bcrypt hashed |
| role | user_role | Enum: `regular`, `reviewer`, `admin` |
| is_active | BOOLEAN | False = account deactivated by admin |
| email_verified | BOOLEAN | Set true after email verification |

---

### 2.2 `profiles`

Extended academic and personal details per user.

```sql
CREATE TABLE profiles (
  id                UUID      PRIMARY KEY,
  user_id           UUID      NOT NULL UNIQUE,
  username          VARCHAR(50)   NOT NULL UNIQUE,
  full_name         VARCHAR(255)  NOT NULL,
  profile_photo_url TEXT,
  institution       VARCHAR(255)  NOT NULL,
  field_of_study_id UUID,
  academic_level    academic_level NOT NULL,
  graduation_year   SMALLINT,
  bio               TEXT,
  email_public      BOOLEAN       NOT NULL DEFAULT FALSE,
  linkedin_url      TEXT,
  researchgate_url  TEXT,
  alipay_account_id VARCHAR(255),
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (field_of_study_id) REFERENCES fields_of_study(id) ON DELETE SET NULL
);
```

| Column | Type | Notes |
|---|---|---|
| user_id | UUID | FK to users — one profile per user |
| username | VARCHAR(50) | Used in public URL: `/user/:username` |
| field_of_study_id | UUID | FK to fields_of_study |
| academic_level | academic_level | Enum: `undergraduate`, `postgraduate`, `phd`, `professional`, `other` |
| email_public | BOOLEAN | Whether to show email on public profile |
| alipay_account_id | VARCHAR(255) | Required for reviewer payout |

---

### 2.3 `fields_of_study`

Admin-managed finite list of academic disciplines.

```sql
CREATE TABLE fields_of_study (
  id                UUID      PRIMARY KEY,
  name              VARCHAR(150)  NOT NULL UNIQUE,
  is_open_for_review BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
```

| Column | Type | Notes |
|---|---|---|
| name | VARCHAR(150) | e.g. "Computer Science & IT" |
| is_open_for_review | BOOLEAN | Controls whether thesis in this field can enter review pipeline |
| is_active | BOOLEAN | False = retired field, hidden from dropdowns |

---

### 2.4 `theses`

Uploaded thesis documents and their metadata.

```sql
CREATE TABLE theses (
  id                UUID      PRIMARY KEY,
  user_id           UUID      NOT NULL,
  title             VARCHAR(500)  NOT NULL,
  abstract          TEXT          NOT NULL,
  field_of_study_id UUID,
  year_of_submission SMALLINT     NOT NULL,
  institution       VARCHAR(255)  NOT NULL,
  keywords          TEXT[],
  supervisor_name   VARCHAR(255),
  language          VARCHAR(100)  DEFAULT 'English',
  file_path         TEXT          NOT NULL,
  file_size_bytes   BIGINT        NOT NULL,
  visit_count       INTEGER       NOT NULL DEFAULT 0,
  download_count    INTEGER       NOT NULL DEFAULT 0,
  is_deleted        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (field_of_study_id) REFERENCES fields_of_study(id) ON DELETE SET NULL
);
```

| Column | Type | Notes |
|---|---|---|
| user_id | UUID | FK to users — thesis owner |
| field_of_study_id | UUID | FK to fields_of_study |
| keywords | TEXT[] | PostgreSQL array of keyword strings |
| file_path | TEXT | Server disk path under /uploads/theses/ |
| file_size_bytes | BIGINT | Enforced max at application layer (50MB) |
| visit_count | INTEGER | Incremented on every page load |
| download_count | INTEGER | Incremented on every download by registered user |
| is_deleted | BOOLEAN | Soft delete — file kept in storage unless purged |

---

### 2.5 `thesis_review_submissions`

Tracks a thesis through the 9-stage review pipeline. One record per thesis that enters review.

```sql
CREATE TABLE thesis_review_submissions (
  id                UUID      PRIMARY KEY,
  thesis_id         UUID      NOT NULL UNIQUE,
  user_id           UUID      NOT NULL,
  current_stage     SMALLINT       NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 9),
  payment_id        UUID,
  stage_updated_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (thesis_id) REFERENCES theses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);
```

| Column | Type | Notes |
|---|---|---|
| thesis_id | UUID | FK to theses — unique: one submission per thesis |
| user_id | UUID | FK to users — thesis owner who submitted |
| current_stage | SMALLINT | 1–9 matching the stage definitions in PRD |
| payment_id | UUID | FK to payments — set when Stage 2 confirmed |
| stage_updated_at | TIMESTAMPTZ | Timestamp of last stage change |

#### Stage Reference

| Value | Label |
|---|---|
| 1 | Uploaded PDF |
| 2 | Payment Confirmed |
| 3 | Awaiting First Reviewer |
| 4 | First Review In Progress |
| 5 | First Review Done |
| 6 | Awaiting Second Reviewer |
| 7 | Second Review In Progress |
| 8 | Second Review Done |
| 9 | Queued for Journal Publishing |

---

### 2.6 `payments`

Stripe payment records for review submission fees (paid via Alipay through Stripe).

```sql
CREATE TABLE payments (
  id                    UUID      PRIMARY KEY,
  thesis_id             UUID      NOT NULL,
  user_id               UUID      NOT NULL,
  stripe_session_id     VARCHAR(255)  NOT NULL UNIQUE,
  amount                NUMERIC(10,2) NOT NULL,
  currency              VARCHAR(10)   NOT NULL DEFAULT 'MYR',
  status                ENUM('pending','confirmed','failed','refunded') NOT NULL DEFAULT 'pending',
  confirmed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (thesis_id) REFERENCES theses(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

| Column | Type | Notes |
|---|---|---|
| stripe_session_id | VARCHAR(255) | Stripe Checkout Session ID — used to verify webhook authenticity |
| amount | NUMERIC(10,2) | Fee paid by user |
| currency | VARCHAR(10) | e.g. MYR, USD |
| status | ENUM | `pending`, `confirmed`, `failed`, `refunded` |
| confirmed_at | TIMESTAMPTZ | Set when Stripe webhook `checkout.session.completed` fires |

---

### 2.7 `reviewer_assignments`

Links a reviewer to a thesis for Round 1 or Round 2.

```sql
CREATE TABLE reviewer_assignments (
  id                UUID      PRIMARY KEY,
  thesis_id         UUID      NOT NULL,
  reviewer_id       UUID      NOT NULL,
  review_round      SMALLINT       NOT NULL CHECK (review_round IN (1, 2)),
  status            assignment_status NOT NULL DEFAULT 'in_progress',
  assigned_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  UNIQUE (thesis_id, review_round),
  UNIQUE (thesis_id, reviewer_id),
  FOREIGN KEY (thesis_id) REFERENCES theses(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
```

| Column | Type | Notes |
|---|---|---|
| review_round | SMALLINT | 1 = first reviewer, 2 = second reviewer |
| status | assignment_status | Enum: `in_progress`, `done` |
| completed_at | TIMESTAMPTZ | Set when reviewer marks review done |
| UNIQUE (thesis_id, review_round) | — | Only one reviewer per round per thesis |
| UNIQUE (thesis_id, reviewer_id) | — | Prevents same reviewer taking both rounds |

---

### 2.8 `review_comments`

Private comment threads between a reviewer and the thesis owner. Supports nested replies.

```sql
CREATE TABLE review_comments (
  id                UUID      PRIMARY KEY,
  thesis_id         UUID      NOT NULL,
  assignment_id     UUID      NOT NULL,
  author_id         UUID      NOT NULL,
  parent_comment_id UUID,
  content           TEXT          NOT NULL,
  is_deleted        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (thesis_id) REFERENCES theses(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES reviewer_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (parent_comment_id) REFERENCES review_comments(id) ON DELETE CASCADE
);
```

| Column | Type | Notes |
|---|---|---|
| assignment_id | UUID | FK to reviewer_assignments — scopes comment to a specific reviewer's round |
| author_id | UUID | Either the reviewer or the thesis owner (for replies) |
| parent_comment_id | UUID | NULL = top-level comment; set = reply to a comment |
| is_deleted | BOOLEAN | Soft delete — content replaced with "[deleted]" on display |

**Privacy enforcement:** Queries for comments must always filter by `assignment_id`, which is only accessible to the reviewer and the thesis owner. Other reviewers on the same thesis cannot see each other's threads.

---

### 2.9 `reviewer_earnings`

One record per completed reviewer assignment. Tracks unpaid balance.

```sql
CREATE TABLE reviewer_earnings (
  id                UUID      PRIMARY KEY,
  reviewer_id       UUID      NOT NULL,
  assignment_id     UUID      NOT NULL UNIQUE,
  thesis_id         UUID      NOT NULL,
  amount            NUMERIC(10,2) NOT NULL,
  currency          VARCHAR(10)   NOT NULL DEFAULT 'MYR',
  is_paid           BOOLEAN       NOT NULL DEFAULT FALSE,
  payout_request_id UUID,
  earned_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (assignment_id) REFERENCES reviewer_assignments(id),
  FOREIGN KEY (thesis_id) REFERENCES theses(id),
  FOREIGN KEY (payout_request_id) REFERENCES payout_requests(id)
);
```

| Column | Type | Notes |
|---|---|---|
| assignment_id | UUID | Unique — one earning per completed assignment |
| amount | NUMERIC(10,2) | Amount owed to reviewer for this review |
| is_paid | BOOLEAN | Set true when included in an approved payout |
| payout_request_id | UUID | FK to payout_requests — set when bundled into a payout |

---

### 2.10 `payout_requests`

Reviewer cash out requests pending admin approval.

```sql
CREATE TABLE payout_requests (
  id                    UUID      PRIMARY KEY,
  reviewer_id           UUID      NOT NULL,
  amount                NUMERIC(10,2) NOT NULL,
  alipay_account_id     VARCHAR(255)  NOT NULL,
  status                payout_status NOT NULL DEFAULT 'pending',
  admin_note            TEXT,
  requested_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  processed_at          TIMESTAMPTZ,
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
```

| Column | Type | Notes |
|---|---|---|
| amount | NUMERIC(10,2) | Total amount requested (sum of unpaid earnings) |
| alipay_account_id | VARCHAR(255) | Reviewer's Alipay account ID at time of request |
| status | ENUM | `pending`, `approved`, `paid`, `rejected` |
| admin_note | TEXT | Optional note from admin on approval or rejection |
| processed_at | TIMESTAMPTZ | Set when status changes to `paid` or `rejected` |

---

### 2.11 `invitation_links`

Single-use tokens for Reviewer account registration.

```sql
CREATE TABLE invitation_links (
  id                UUID      PRIMARY KEY,
  token             VARCHAR(255)  NOT NULL UNIQUE,
  created_by        UUID      NOT NULL,
  used_by           UUID,
  expires_at        TIMESTAMPTZ      NOT NULL,
  is_used           BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (used_by) REFERENCES users(id)
);
```

| Column | Type | Notes |
|---|---|---|
| token | VARCHAR(255) | Cryptographically random token — used in invite URL |
| created_by | UUID | Admin or existing Reviewer who generated the link |
| used_by | UUID | Set to the new Reviewer's user ID when consumed |
| expires_at | TIMESTAMPTZ | Typically NOW() + 7 days |
| is_used | BOOLEAN | True after a Reviewer registers with this token |

---

## 3. Relationships Diagram

```
users
 ├── profiles           (1:1)  user_id
 ├── theses             (1:N)  user_id
 ├── payments           (1:N)  user_id
 ├── reviewer_assignments (1:N) reviewer_id
 ├── review_comments    (1:N)  author_id
 ├── reviewer_earnings  (1:N)  reviewer_id
 ├── payout_requests    (1:N)  reviewer_id
 └── invitation_links   (1:N)  created_by / used_by

fields_of_study
 ├── profiles           (1:N)  field_of_study_id
 └── theses             (1:N)  field_of_study_id

theses
 ├── thesis_review_submissions (1:1)  thesis_id
 ├── payments                  (1:N)  thesis_id
 ├── reviewer_assignments      (1:N)  thesis_id
 ├── review_comments           (1:N)  thesis_id
 └── reviewer_earnings         (1:N)  thesis_id

thesis_review_submissions
 └── payments           (N:1)  payment_id

reviewer_assignments
 ├── review_comments    (1:N)  assignment_id
 └── reviewer_earnings  (1:1)  assignment_id

reviewer_earnings
 └── payout_requests    (N:1)  payout_request_id

review_comments
 └── review_comments    (1:N)  parent_comment_id  ← self-referencing for replies
```

---

## 4. Indexes

```sql
-- User lookup
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_role         ON users(role);

-- Profile lookup by username (public URL)
CREATE INDEX idx_profiles_username  ON profiles(username);
CREATE INDEX idx_profiles_user_id   ON profiles(user_id);

-- Thesis listing and search
CREATE INDEX idx_theses_user_id           ON theses(user_id);
CREATE INDEX idx_theses_field_of_study_id ON theses(field_of_study_id);
CREATE INDEX idx_theses_year              ON theses(year_of_submission);
CREATE INDEX idx_theses_is_deleted        ON theses(is_deleted);

-- Review pipeline queries
CREATE INDEX idx_review_submissions_thesis_id     ON thesis_review_submissions(thesis_id);
CREATE INDEX idx_review_submissions_current_stage ON thesis_review_submissions(current_stage);

-- Reviewer queue — find open theses matching reviewer's field
CREATE INDEX idx_theses_field_stage
  ON thesis_review_submissions(current_stage)
  INCLUDE (thesis_id);

-- Reviewer assignment lookups
CREATE INDEX idx_reviewer_assignments_thesis_id   ON reviewer_assignments(thesis_id);
CREATE INDEX idx_reviewer_assignments_reviewer_id ON reviewer_assignments(reviewer_id);
CREATE INDEX idx_reviewer_assignments_status      ON reviewer_assignments(status);

-- Comment thread lookups
CREATE INDEX idx_review_comments_assignment_id    ON review_comments(assignment_id);
CREATE INDEX idx_review_comments_parent           ON review_comments(parent_comment_id);

-- Earnings and payouts
CREATE INDEX idx_reviewer_earnings_reviewer_id    ON reviewer_earnings(reviewer_id);
CREATE INDEX idx_reviewer_earnings_is_paid        ON reviewer_earnings(is_paid);
CREATE INDEX idx_payout_requests_reviewer_id      ON payout_requests(reviewer_id);
CREATE INDEX idx_payout_requests_status           ON payout_requests(status);

-- Invitation links
CREATE INDEX idx_invitation_links_token           ON invitation_links(token);
CREATE INDEX idx_invitation_links_created_by      ON invitation_links(created_by);
```

---

## 5. Enums

```sql
CREATE TYPE user_role AS ENUM ('regular', 'reviewer', 'admin');
CREATE TYPE academic_level AS ENUM ('undergraduate', 'postgraduate', 'phd', 'professional', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed', 'refunded');
CREATE TYPE assignment_status AS ENUM ('in_progress', 'done');
CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
```

---

## Key Business Logic Notes

| Rule | Enforced By |
|---|---|
| Only one reviewer per round per thesis | `UNIQUE (thesis_id, review_round)` on `reviewer_assignments` |
| Same reviewer cannot take both rounds | `UNIQUE (thesis_id, reviewer_id)` on `reviewer_assignments` |
| One earning record per completed assignment | `UNIQUE (assignment_id)` on `reviewer_earnings` |
| One payment submission per thesis | `UNIQUE (thesis_id)` on `thesis_review_submissions` |
| Comments are scoped to assignment — not visible across reviewers | Application-level query filter on `assignment_id` |
| Stage only moves forward — never backward (except admin override) | Application-level logic |
| Reviewer can only comment during active stage | Application-level check against `assignment.status = 'in_progress'` |
| Guest cannot download — registered user only | Application-level auth check before generating download URL |
| Self-visit count prevention (Should Have) | Application-level: skip increment if `request.user.id === thesis.user_id` |
