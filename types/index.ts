export type UserRole = 'regular' | 'reviewer' | 'admin'

export type AcademicLevel =
  | 'undergraduate'
  | 'postgraduate'
  | 'phd'
  | 'professional'
  | 'other'

export type ReviewStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export const REVIEW_STAGE_LABELS: Record<ReviewStage, string> = {
  1: 'Uploaded PDF',
  2: 'Payment Confirmed',
  3: 'Awaiting First Reviewer',
  4: 'First Review In Progress',
  5: 'First Review Done',
  6: 'Awaiting Second Reviewer',
  7: 'Second Review In Progress',
  8: 'Second Review Done',
  9: 'Queued for Journal Publishing',
}

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded'
export type AssignmentStatus = 'in_progress' | 'done'
export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected'

export interface Profile {
  id: string
  user_id: string
  username: string
  full_name: string
  profile_photo_url: string | null
  institution: string
  field_of_study_id: string | null
  academic_level: AcademicLevel
  graduation_year: number | null
  bio: string | null
  email_public: boolean
  linkedin_url: string | null
  researchgate_url: string | null
  paypal_email: string | null
  created_at: string
  updated_at: string
}

export interface FieldOfStudy {
  id: string
  name: string
  is_open_for_review: boolean
  is_active: boolean
}

export interface Thesis {
  id: string
  user_id: string
  title: string
  abstract: string
  field_of_study_id: string | null
  year_of_submission: number
  institution: string
  keywords: string[] | null
  supervisor_name: string | null
  language: string
  file_url: string
  file_size_bytes: number
  visit_count: number
  download_count: number
  is_deleted: boolean
  created_at: string
  updated_at: string
}
