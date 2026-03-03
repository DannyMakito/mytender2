-- Comprehensive schema fixes for the projects and notifications tables
-- Run this in your Supabase SQL Editor after the notification fix

-- STEP 1: Fix projects table - remove old bid_id column if it exists
ALTER TABLE IF EXISTS public.projects DROP COLUMN IF EXISTS bid_id CASCADE;

-- STEP 2: Ensure projects table has correct columns
ALTER TABLE IF EXISTS public.projects 
  ADD COLUMN IF NOT EXISTS winner_emails TEXT[] DEFAULT '{}';

ALTER TABLE IF EXISTS public.projects 
  ADD COLUMN IF NOT EXISTS bid_ids UUID[] DEFAULT '{}';

-- STEP 3: Verify the projects table schema is correct
-- The CREATE TABLE IF NOT EXISTS statement should not create the table 
-- if it already exists, so existing data should be preserved
-- But if the old bid_id column exists, it will break things

-- STEP 4: Drop and recreate constraints on projects if needed
-- First, check foreign key constraints
-- SELECT * FROM information_schema.table_constraints WHERE table_name='projects';

-- STEP 5: If projects table has the old structure, here's the full recreation:
/*
-- OPTION: Full fix if the above ALTER statements don't work

-- Backup data from projects table
CREATE TEMPORARY TABLE projects_backup AS
SELECT id, tender_id, name, owner_email, ARRAY[COALESCE(winner_email, '')] as winner_emails, ARRAY[] as bid_ids, icon, created_at, updated_at
FROM public.projects;

-- Drop the old projects table
DROP TABLE IF EXISTS public.projects CASCADE;

-- Recreate projects table with correct schema
CREATE TABLE public.projects (
  id UUID PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  winner_emails TEXT[] DEFAULT '{}',
  bid_ids UUID[] DEFAULT '{}',
  icon TEXT DEFAULT 'FiFolder' CHECK (icon IN ('FiFolder', 'FiBriefcase', 'FiCamera', 'FiCheckSquare', 'FiStar', 'FiFlag', 'FiDatabase', 'FiTarget')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(tender_id)
);

-- Restore data
INSERT INTO public.projects 
SELECT * FROM projects_backup;

-- Drop temporary backup table
DROP TABLE projects_backup;

*/

-- Recreate indexes for projects table
DROP INDEX IF EXISTS idx_projects_tender_id;
DROP INDEX IF EXISTS idx_projects_owner_email;
DROP INDEX IF EXISTS idx_projects_winner_emails;
DROP INDEX IF EXISTS idx_projects_bid_ids;

CREATE INDEX idx_projects_tender_id ON public.projects(tender_id);
CREATE INDEX idx_projects_owner_email ON public.projects(owner_email);
CREATE INDEX idx_projects_winner_emails ON public.projects USING GIN (winner_emails);
CREATE INDEX idx_projects_bid_ids ON public.projects USING GIN (bid_ids);

-- Verify both tables have correct schemas
SELECT 
  'projects' as table_name,
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
UNION ALL
SELECT 
  'notifications' as table_name,
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY table_name, column_name;
