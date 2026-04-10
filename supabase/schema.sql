-- Meeting Recorder - Supabase Schema Setup
-- Run this in Supabase SQL Editor to create the required tables

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT DEFAULT '',
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Policy: service role can do anything (for API operations)
CREATE POLICY "Service role full access"
    ON public.users FOR ALL
    USING (true);

-- Policy: users can update their own profile (except plan)
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Shared Notes table ──
CREATE TABLE IF NOT EXISTS public.shared_notes (
    share_id    TEXT PRIMARY KEY,
    title       TEXT DEFAULT '',
    participants TEXT DEFAULT '',
    transcript  TEXT DEFAULT '',
    summary     TEXT DEFAULT '',
    created_at  TEXT DEFAULT '',
    created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read shared notes (public read for share links)
CREATE POLICY "Anyone can read shared notes"
    ON public.shared_notes FOR SELECT
    USING (true);

-- Policy: authenticated users can insert/update their own shared notes
CREATE POLICY "Authenticated users can create shared notes"
    ON public.shared_notes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update shared notes"
    ON public.shared_notes FOR UPDATE
    USING (true);

DROP TRIGGER IF EXISTS set_shared_notes_updated_at ON public.shared_notes;
CREATE TRIGGER set_shared_notes_updated_at
    BEFORE INSERT OR UPDATE ON public.shared_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
