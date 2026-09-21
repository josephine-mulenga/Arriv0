-- Arriv0 Database Schema
-- Run this in Supabase SQL Editor to recreate the full database from scratch

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  school text NOT NULL,
  visa_type text NOT NULL CHECK (visa_type IN ('F1', 'J1', 'Other')),
  year_level integer NOT NULL DEFAULT 1 CHECK (year_level BETWEEN 1 AND 4),
  program_start_date date NOT NULL,
  program_end_date date NOT NULL,
  push_token text,
  notification_time text DEFAULT '08:00',
  timezone text DEFAULT 'America/New_York',
  created_at timestamp DEFAULT now()
);

-- News table
CREATE TABLE IF NOT EXISTS news (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  affects_f1 boolean DEFAULT true,
  tag text DEFAULT 'General F1 news',
  link text,
  created_at timestamp DEFAULT now()
);

-- Enable Row Level Security on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can only access their own data"
ON users
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Enable Row Level Security on news
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Anyone can read news
CREATE POLICY "Anyone can read news"
ON news
FOR SELECT
USING (true);

-- Only service role can insert news
CREATE POLICY "Only service role can insert news"
ON news
FOR INSERT
WITH CHECK (true);

-- Migration: Complete Your Profile fields (2026-08-30)
-- Run this against the live Supabase project — this file predates several
-- columns already on the live `users` table (has_ssn, has_bank_account,
-- cpt_months_used, major, avatar_url), so it's a reference for new columns
-- going forward rather than a from-scratch source of truth.
-- These back the milestone/timeline screens asking real questions instead
-- of guessing OPT-recommendation/I-765 status from year_level, and adding
-- citizenship/visa-validity fields the app doesn't currently collect at all.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_opt_recommendation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_i765_submitted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS citizenship_country text,
  ADD COLUMN IF NOT EXISTS visa_expiry_date date;

-- Migration: has_reported_to_dso (2026-09-02)
-- Milestones/Timeline were marking "Arrived and reported to DSO" done just
-- because 10+ days had passed since program_start_date — no actual
-- confirmation the student did it. Replaces that date guess with a real
-- answer from Complete Your Profile.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_reported_to_dso boolean DEFAULT false;

-- Migration: feedback table (2026-09-04)
-- Backs the in-app Feedback screen — students suggest features or flag
-- improvements; the team reviews submissions directly in the Supabase table
-- editor (service role bypasses RLS, so no admin endpoint is needed).
CREATE TABLE IF NOT EXISTS feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  user_email text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('feature', 'improvement', 'bug', 'general')),
  message text NOT NULL,
  created_at timestamp DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit their own feedback"
ON feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Migration: internships_seen table (2026-09-12)
-- Backs the daily internship-match notification job — records which Adzuna
-- job IDs a user has already been notified about so the job only pushes
-- newly-matching roles instead of re-sending the same listings every day.
-- Written/read only by the backend via the service role key; no user-facing
-- endpoint reads this table, so RLS is enabled with no policies (service
-- role bypasses RLS entirely, anon/authenticated access is fully blocked).
-- (Corrected 2026-09-21: the live table actually has `notified_at`, not
-- `seen_at` as originally written here - found while diagnosing the
-- 2026-09-18 outage. main.py's upserts never name this column explicitly
-- (they rely on the DEFAULT now()), so the mismatch never caused a runtime
-- bug, only wrong documentation.)
CREATE TABLE IF NOT EXISTS internships_seen (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  job_id text NOT NULL,
  notified_at timestamp DEFAULT now(),
  UNIQUE (user_id, job_id)
);

ALTER TABLE internships_seen ENABLE ROW LEVEL SECURITY;

-- Migration: streak tracking, urgent news (2026-09-12)
-- (biggest_concern/has_job_offer/plans_after_graduation/work_experience_months
-- already exist on the live users table — SignupRequest/UpdateProfileRequest
-- and build_student_profile_context() were updated in main.py to use them,
-- no migration needed for those.)
-- streak_days/last_active_date back the daily-streak feature: updated on
-- every authenticated request (see update_daily_streak() in main.py), reset
-- to 1 after a missed day, milestone push at 7/14/30/60 days.
-- news.urgent flags articles the 30-minute urgent-news job should push
-- immediately, independent of the regular 3-hour news cycle.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date;

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS urgent boolean DEFAULT false;

-- Migration: company watch list (2026-09-13, already applied)
-- Backs GET/POST/DELETE /internships/watch* and the check_watched_companies
-- job — a user's watched companies get checked against Adzuna every 30
-- minutes, reusing internships_seen for dedup the same way
-- send_internship_notifications does for major-based matches.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS watched_companies text[] DEFAULT '{}';

-- Migration: news source + published_at (2026-09-18)
-- (image_url already exists on the live news table from earlier work that
-- predates this file being kept in sync — no migration needed for that
-- one, it's just missing from this history.)
-- Backs the new RSS/HTML-scrape sources added in this change (ICE SEVP,
-- Inside Higher Ed, DHS, NAFSA) alongside the existing NewsAPI/RSS ones -
-- source records which of them an article came from, and published_at is
-- the article's own publish date (distinct from created_at, which is when
-- Arriv0 inserted the row). _insert_new_relevant_articles() in main.py
-- falls back to inserting without these two columns if this migration
-- hasn't been run yet, so news insertion won't break in the meantime, but
-- source/published_at won't be populated until it has.
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS published_at timestamp;

-- Migration: career interests + location preference (2026-09-18)
-- Backs internship match reasons ("Matches your cybersecurity interest",
-- "Uses Python from your profile") in GET /internships - major and
-- graduation year already existed, but interests/skills and a preferred
-- location didn't. Settable via POST /profile/{user_id} (UpdateProfileRequest)
-- like citizenship_country was, and editable in the app via the Career
-- interests text field and Location preference dropdown on Edit Profile.
-- compute_match_reasons() in main.py treats both as optional and just skips
-- those reasons if empty (e.g. before this migration has been run).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS career_interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location_preference text;

-- Fix: career_interests column type (2026-09-18)
-- Found by testing directly against the live database: career_interests
-- already existed as plain `text` (not `text[]`) by the time this session
-- ran the ADD COLUMN IF NOT EXISTS above, which is a no-op when the column
-- already exists regardless of type - so every write has actually been
-- storing a JSON-encoded string ('["Python","cybersecurity"]') inside a
-- text column instead of a real array. main.py's compute_match_reasons()
-- now tolerates either shape (_as_string_list() parses the string form),
-- so matching still works either way, but the column itself should still
-- be corrected so it matches schema.sql and any other tooling that reads
-- it directly. Existing string values are parsed back into a real array
-- rather than discarded.
ALTER TABLE users
  ALTER COLUMN career_interests TYPE text[]
  USING (
    CASE
      WHEN career_interests IS NULL OR career_interests::text IN ('', '{}', '[]') THEN '{}'::text[]
      ELSE ARRAY(SELECT jsonb_array_elements_text(career_interests::text::jsonb))
    END
  ),
  ALTER COLUMN career_interests SET DEFAULT '{}';

-- Migration: bookmarks table (undated - predates this file being kept in
-- sync, documented here for the first time)
-- Backs GET/POST/DELETE /bookmarks (news only, despite the plain name -
-- it existed before internship bookmarking did). Written/read only via the
-- service role key from main.py; no policies needed beyond RLS being on.
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  news_title text,
  news_body text,
  news_link text,
  news_tag text,
  news_image_url text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Migration: internship bookmarks (2026-09-24)
-- Backs the new GET/POST/DELETE /bookmarks/internship endpoints - reuses
-- the bookmarks table above rather than a new one, following the existing
-- news_* column pattern. A row is either a news bookmark (news_* set,
-- internship_* null) or an internship bookmark (reverse), so the two never
-- collide despite sharing a table. Dedup on insert is by
-- (user_id, internship_title, internship_company).
ALTER TABLE bookmarks
  ADD COLUMN IF NOT EXISTS internship_title text,
  ADD COLUMN IF NOT EXISTS internship_company text,
  ADD COLUMN IF NOT EXISTS internship_url text,
  ADD COLUMN IF NOT EXISTS internship_source text,
  ADD COLUMN IF NOT EXISTS internship_location text;

-- Migration: mini goals completion (2026-09-24)
-- Backs GET /mini-goals and POST /mini-goals/toggle - the Journey screen's
-- personalized sub-step checklist under a major milestone. The goal
-- definitions themselves (label, which major group, which milestone they
-- lead to) live in MINI_GOAL_TEMPLATES in main.py, same as timeline/
-- milestones already do - only per-user *completion* needs real storage.
-- goal_id is one of the ids from that template (e.g. "cs_leetcode_3"), not
-- a foreign key, since the templates aren't database rows.
CREATE TABLE IF NOT EXISTS mini_goals_completed (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  goal_id text NOT NULL,
  completed_at timestamp DEFAULT now(),
  UNIQUE (user_id, goal_id)
);

ALTER TABLE mini_goals_completed ENABLE ROW LEVEL SECURITY;