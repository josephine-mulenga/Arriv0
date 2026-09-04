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