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