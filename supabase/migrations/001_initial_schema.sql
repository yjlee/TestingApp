-- Enums
CREATE TYPE user_role AS ENUM ('regular', 'reviewer', 'admin');
CREATE TYPE academic_level AS ENUM ('undergraduate', 'postgraduate', 'phd', 'professional', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed', 'refunded');
CREATE TYPE assignment_status AS ENUM ('in_progress', 'done');
CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- Fields of Study
CREATE TABLE fields_of_study (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(150)  NOT NULL UNIQUE,
  is_open_for_review  BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID          NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username            VARCHAR(50)   NOT NULL UNIQUE,
  full_name           VARCHAR(255)  NOT NULL,
  profile_photo_url   TEXT,
  institution         VARCHAR(255)  NOT NULL,
  field_of_study_id   UUID          REFERENCES fields_of_study(id) ON DELETE SET NULL,
  academic_level      academic_level NOT NULL,
  graduation_year     SMALLINT,
  bio                 TEXT,
  email_public        BOOLEAN       NOT NULL DEFAULT FALSE,
  linkedin_url        TEXT,
  researchgate_url    TEXT,
  paypal_email        VARCHAR(255),
  role                user_role     NOT NULL DEFAULT 'regular',
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Theses
CREATE TABLE theses (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               VARCHAR(500)  NOT NULL,
  abstract            TEXT          NOT NULL,
  field_of_study_id   UUID          REFERENCES fields_of_study(id) ON DELETE SET NULL,
  year_of_submission  SMALLINT      NOT NULL,
  institution         VARCHAR(255)  NOT NULL,
  keywords            TEXT[],
  supervisor_name     VARCHAR(255),
  language            VARCHAR(100)  DEFAULT 'English',
  file_url            TEXT          NOT NULL,
  file_size_bytes     BIGINT        NOT NULL,
  visit_count         INTEGER       NOT NULL DEFAULT 0,
  download_count      INTEGER       NOT NULL DEFAULT 0,
  is_deleted          BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id           UUID          NOT NULL REFERENCES theses(id),
  user_id             UUID          NOT NULL REFERENCES auth.users(id),
  paypal_order_id     VARCHAR(255)  NOT NULL UNIQUE,
  amount              NUMERIC(10,2) NOT NULL,
  currency            VARCHAR(10)   NOT NULL DEFAULT 'MYR',
  status              payment_status NOT NULL DEFAULT 'pending',
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Thesis Review Submissions (stage tracker)
CREATE TABLE thesis_review_submissions (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id           UUID          NOT NULL UNIQUE REFERENCES theses(id) ON DELETE CASCADE,
  user_id             UUID          NOT NULL REFERENCES auth.users(id),
  current_stage       SMALLINT      NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 9),
  payment_id          UUID          REFERENCES payments(id),
  stage_updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Reviewer Assignments
CREATE TABLE reviewer_assignments (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id           UUID          NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
  reviewer_id         UUID          NOT NULL REFERENCES auth.users(id),
  review_round        SMALLINT      NOT NULL CHECK (review_round IN (1, 2)),
  status              assignment_status NOT NULL DEFAULT 'in_progress',
  assigned_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  UNIQUE (thesis_id, review_round),
  UNIQUE (thesis_id, reviewer_id)
);

-- Review Comments (with self-referencing for replies)
CREATE TABLE review_comments (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id           UUID          NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
  assignment_id       UUID          NOT NULL REFERENCES reviewer_assignments(id) ON DELETE CASCADE,
  author_id           UUID          NOT NULL REFERENCES auth.users(id),
  parent_comment_id   UUID          REFERENCES review_comments(id) ON DELETE CASCADE,
  content             TEXT          NOT NULL,
  is_deleted          BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Payout Requests
CREATE TABLE payout_requests (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id         UUID          NOT NULL REFERENCES auth.users(id),
  amount              NUMERIC(10,2) NOT NULL,
  paypal_email        VARCHAR(255)  NOT NULL,
  status              payout_status NOT NULL DEFAULT 'pending',
  admin_note          TEXT,
  requested_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  processed_at        TIMESTAMPTZ
);

-- Reviewer Earnings
CREATE TABLE reviewer_earnings (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id         UUID          NOT NULL REFERENCES auth.users(id),
  assignment_id       UUID          NOT NULL UNIQUE REFERENCES reviewer_assignments(id),
  thesis_id           UUID          NOT NULL REFERENCES theses(id),
  amount              NUMERIC(10,2) NOT NULL,
  currency            VARCHAR(10)   NOT NULL DEFAULT 'MYR',
  is_paid             BOOLEAN       NOT NULL DEFAULT FALSE,
  payout_request_id   UUID          REFERENCES payout_requests(id),
  earned_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Invitation Links
CREATE TABLE invitation_links (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  token               VARCHAR(255)  NOT NULL UNIQUE,
  created_by          UUID          NOT NULL REFERENCES auth.users(id),
  used_by             UUID          REFERENCES auth.users(id),
  expires_at          TIMESTAMPTZ   NOT NULL,
  is_used             BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_username         ON profiles(username);
CREATE INDEX idx_profiles_user_id          ON profiles(user_id);
CREATE INDEX idx_theses_user_id            ON theses(user_id);
CREATE INDEX idx_theses_field_of_study_id  ON theses(field_of_study_id);
CREATE INDEX idx_theses_is_deleted         ON theses(is_deleted);
CREATE INDEX idx_review_subs_thesis_id     ON thesis_review_submissions(thesis_id);
CREATE INDEX idx_review_subs_stage         ON thesis_review_submissions(current_stage);
CREATE INDEX idx_assignments_thesis_id     ON reviewer_assignments(thesis_id);
CREATE INDEX idx_assignments_reviewer_id   ON reviewer_assignments(reviewer_id);
CREATE INDEX idx_comments_assignment_id    ON review_comments(assignment_id);
CREATE INDEX idx_earnings_reviewer_id      ON reviewer_earnings(reviewer_id);
CREATE INDEX idx_earnings_is_paid          ON reviewer_earnings(is_paid);
CREATE INDEX idx_payouts_reviewer_id       ON payout_requests(reviewer_id);
CREATE INDEX idx_payouts_status            ON payout_requests(status);
CREATE INDEX idx_invite_token              ON invitation_links(token);

-- Seed: initial fields of study
INSERT INTO fields_of_study (name) VALUES
  ('Computer Science & IT'),
  ('Engineering'),
  ('Medicine & Health Sciences'),
  ('Law'),
  ('Business & Management'),
  ('Education'),
  ('Social Sciences'),
  ('Natural Sciences'),
  ('Mathematics & Statistics'),
  ('Arts & Humanities'),
  ('Architecture'),
  ('Economics'),
  ('Environmental Studies');
