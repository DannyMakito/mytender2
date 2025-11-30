-- SQL script to create projects and tasks tables with RLS policies
-- Run this in your Supabase SQL Editor
-- 
-- This script:
-- 1. Creates projects table linked to tenders and bids
-- 2. Creates tasks table linked to projects
-- 3. Sets up RLS policies for proper access control
-- 4. Creates trigger to automatically create project when bid is approved
-- 5. Ensures only project members can see tasks
-- 6. Winner (contractor) can perform all CRUD on tasks
-- 7. Tender owner (client) can only view tasks

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Project name (from tender title)
  owner_email TEXT NOT NULL, -- Tender owner email (from tenders.posted_by)
  winner_email TEXT NOT NULL, -- Bid winner email (from bids.bidder)
  icon TEXT DEFAULT 'FiFolder' CHECK (icon IN ('FiFolder', 'FiBriefcase', 'FiCamera', 'FiCheckSquare', 'FiStar', 'FiFlag', 'FiDatabase', 'FiTarget')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(tender_id, bid_id) -- Ensure one project per approved bid
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_tender_id ON public.projects(tender_id);
CREATE INDEX IF NOT EXISTS idx_projects_bid_id ON public.projects(bid_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_email ON public.projects(owner_email);
CREATE INDEX IF NOT EXISTS idx_projects_winner_email ON public.projects(winner_email);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'inprogress', 'done', 'waiting', 'completed')),
  priority_color TEXT DEFAULT 'yellow' CHECK (priority_color IN ('yellow', 'red', 'blue', '')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_color ON public.tasks(priority_color);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is a project member (owner or winner)
-- Uses SECURITY DEFINER to bypass RLS when checking project membership
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_is_member BOOLEAN;
BEGIN
  -- Get current user's email from JWT
  v_user_email := auth.jwt() ->> 'email';
  
  -- Check if user is owner or winner of the project
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
    AND (owner_email = v_user_email OR winner_email = v_user_email)
  ) INTO v_is_member;
  
  RETURN COALESCE(v_is_member, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_project_member TO authenticated;

-- Helper function to check if user is project winner (contractor)
CREATE OR REPLACE FUNCTION public.is_project_winner(p_project_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_is_winner BOOLEAN;
BEGIN
  v_user_email := auth.jwt() ->> 'email';
  
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
    AND winner_email = v_user_email
  ) INTO v_is_winner;
  
  RETURN COALESCE(v_is_winner, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_project_winner TO authenticated;

-- Helper function to check if user is project owner (client)
CREATE OR REPLACE FUNCTION public.is_project_owner(p_project_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_is_owner BOOLEAN;
BEGIN
  v_user_email := auth.jwt() ->> 'email';
  
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
    AND owner_email = v_user_email
  ) INTO v_is_owner;
  
  RETURN COALESCE(v_is_owner, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_project_owner TO authenticated;

-- Drop existing policies if they exist (to allow re-running the script)
DROP POLICY IF EXISTS "Project members can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Winner can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Project members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Winner can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Winner can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Winner can delete tasks" ON public.tasks;

-- PROJECTS RLS POLICIES

-- Policy: Project members (owner or winner) can SELECT their projects
CREATE POLICY "Project members can view their projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  public.is_project_member(id)
);

-- Policy: Winner (contractor) can UPDATE project details
-- Owner (client) can only view, not modify
CREATE POLICY "Winner can update their projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  public.is_project_winner(id)
)
WITH CHECK (
  public.is_project_winner(id)
);

-- TASKS RLS POLICIES

-- Policy: Project members (owner or winner) can SELECT tasks for their projects
CREATE POLICY "Project members can view tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  public.is_project_member(project_id)
);

-- Policy: Winner (contractor) can INSERT tasks
CREATE POLICY "Winner can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_project_winner(project_id)
);

-- Policy: Winner (contractor) can UPDATE tasks
CREATE POLICY "Winner can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  public.is_project_winner(project_id)
)
WITH CHECK (
  public.is_project_winner(project_id)
);

-- Policy: Winner (contractor) can DELETE tasks
CREATE POLICY "Winner can delete tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  public.is_project_winner(project_id)
);

-- Function to automatically update updated_at timestamp for projects
CREATE OR REPLACE FUNCTION public.update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on projects update
DROP TRIGGER IF EXISTS trigger_update_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_projects_updated_at();

-- Function to automatically update updated_at timestamp for tasks
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on tasks update
DROP TRIGGER IF EXISTS trigger_update_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tasks_updated_at();

-- Function to automatically create project when bid is approved
-- Uses SECURITY DEFINER to bypass RLS when creating the project
CREATE OR REPLACE FUNCTION public.create_project_on_bid_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_tender_title TEXT;
  v_tender_owner TEXT;
BEGIN
  -- Only proceed if the status is being changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get tender title and owner from the tender
    SELECT t.title, t.posted_by
    INTO v_tender_title, v_tender_owner
    FROM public.tenders t
    WHERE t.id = NEW.tender_id;
    
    -- Check if project already exists for this bid
    IF NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE bid_id = NEW.id
    ) THEN
      -- Create new project with tender title as project name
      INSERT INTO public.projects (
        tender_id,
        bid_id,
        name,
        owner_email,
        winner_email,
        icon
      ) VALUES (
        NEW.tender_id,
        NEW.id,
        COALESCE(v_tender_title, 'Untitled Project'),
        COALESCE(v_tender_owner, ''),
        NEW.bidder,
        'FiFolder'
      );
      
      -- Log the action
      RAISE NOTICE 'Project created automatically for approved bid % (tender: %)', NEW.id, NEW.tender_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create project when bid is approved
-- This trigger fires after the bid status is updated to 'approved'
DROP TRIGGER IF EXISTS trigger_create_project_on_bid_approval ON public.bids;
CREATE TRIGGER trigger_create_project_on_bid_approval
  AFTER UPDATE OF status ON public.bids
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION public.create_project_on_bid_approval();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

-- Create a view to help with project tracking (includes task counts)
CREATE OR REPLACE VIEW public.project_stats AS
SELECT 
  p.id,
  p.name,
  p.tender_id,
  p.owner_email,
  p.winner_email,
  p.icon,
  p.created_at,
  p.updated_at,
  COUNT(t.id) FILTER (WHERE t.status IN ('todo', 'waiting')) AS todo_count,
  COUNT(t.id) FILTER (WHERE t.status = 'inprogress') AS inprogress_count,
  COUNT(t.id) FILTER (WHERE t.status IN ('done', 'completed')) AS completed_count,
  COUNT(t.id) AS total_tasks,
  CASE 
    WHEN COUNT(t.id) = 0 THEN 0
    ELSE ROUND(100.0 * COUNT(t.id) FILTER (WHERE t.status IN ('done', 'completed')) / COUNT(t.id))
  END AS completion_percentage
FROM public.projects p
LEFT JOIN public.tasks t ON p.id = t.project_id
GROUP BY p.id, p.name, p.tender_id, p.owner_email, p.winner_email, p.icon, p.created_at, p.updated_at;

-- Grant SELECT on the view
GRANT SELECT ON public.project_stats TO authenticated;

