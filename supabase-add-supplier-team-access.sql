-- SQL Migration: Add supplier-only team access while professionals get project + team access
-- Run this in your Supabase SQL Editor

-- ==========================================
-- 1. ADD ROLE COLUMN TO BIDS TABLE
-- ==========================================

-- Add role column to track whether bidder is 'pro' or 'supplier'
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'pro' 
CHECK (role IN ('pro', 'supplier'));

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_bids_role ON public.bids(role);

-- ==========================================
-- 2. ADD SUPPLIER_MEMBERS TO PROJECTS TABLE
-- ==========================================

-- Add supplier_members array to track suppliers with team-only access
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS supplier_members TEXT[] DEFAULT '{}';

-- Create index on supplier_members for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_supplier_members ON public.projects USING GIN (supplier_members);

-- ==========================================
-- 3. UPDATE IS_PROJECT_MEMBER FUNCTION
-- ==========================================
-- Now allows both winner_emails (project access) and supplier_members (team-only access)

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
  
  -- Check if user is owner, winner, or supplier member of the project
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
    AND (
      owner_email = v_user_email 
      OR v_user_email = ANY(winner_emails)
      OR v_user_email = ANY(supplier_members)
    )
  ) INTO v_is_member;
  
  RETURN COALESCE(v_is_member, false);
END;
$$;

-- ==========================================
-- 4. ADD NEW FUNCTION: IS_PROJECT_WINNER
-- ==========================================
-- Check if user is a professional winner (has project access, not just team access)

CREATE OR REPLACE FUNCTION public.is_professional_winner(p_project_id UUID)
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
    AND v_user_email = ANY(winner_emails)
  ) INTO v_is_winner;
  
  RETURN COALESCE(v_is_winner, false);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_professional_winner TO authenticated;

-- ==========================================
-- 5. UPDATE CREATE_PROJECT_ON_BID_APPROVAL FUNCTION
-- ==========================================
-- Now handles suppliers separately: adds they to supplier_members only (team access)
-- Professionals are added to winner_emails (project + team access)

CREATE OR REPLACE FUNCTION public.create_project_on_bid_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_tender_title TEXT;
  v_tender_owner TEXT;
  v_project_id UUID;
  v_bidder_role TEXT;
BEGIN
  -- Only proceed if the status is being changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get the role from the bid (defaults to 'pro' if not set)
    v_bidder_role := COALESCE(NEW.role, 'pro');
    
    -- Check if project already exists for this tender
    SELECT id INTO v_project_id FROM public.projects WHERE tender_id = NEW.tender_id;
    
    IF v_project_id IS NULL THEN
      -- Get tender title and owner from the tender
      SELECT t.title, t.posted_by
      INTO v_tender_title, v_tender_owner
      FROM public.tenders t
      WHERE t.id = NEW.tender_id;

      -- Create new project
      IF v_bidder_role = 'supplier' THEN
        -- Supplier: add to supplier_members only (team access, no project access)
        INSERT INTO public.projects (
          tender_id,
          name,
          owner_email,
          winner_emails,
          supplier_members,
          bid_ids,
          icon
        ) VALUES (
          NEW.tender_id,
          COALESCE(v_tender_title, 'Untitled Project'),
          COALESCE(v_tender_owner, ''),
          ARRAY[]::TEXT[],
          ARRAY[NEW.bidder],
          ARRAY[NEW.id],
          'FiFolder'
        );
      ELSE
        -- Professional: add to winner_emails (project + team access)
        INSERT INTO public.projects (
          tender_id,
          name,
          owner_email,
          winner_emails,
          supplier_members,
          bid_ids,
          icon
        ) VALUES (
          NEW.tender_id,
          COALESCE(v_tender_title, 'Untitled Project'),
          COALESCE(v_tender_owner, ''),
          ARRAY[NEW.bidder],
          ARRAY[]::TEXT[],
          ARRAY[NEW.id],
          'FiFolder'
        );
      END IF;
    ELSE
      -- Project exists: append winner email and/or supplier email based on role
      IF v_bidder_role = 'supplier' THEN
        -- Add supplier to supplier_members only
        UPDATE public.projects 
        SET 
          supplier_members = array_append(array_remove(supplier_members, NEW.bidder), NEW.bidder),
          bid_ids = array_append(array_remove(bid_ids, NEW.id), NEW.id),
          updated_at = NOW()
        WHERE id = v_project_id;
      ELSE
        -- Add professional to winner_emails
        UPDATE public.projects 
        SET 
          winner_emails = array_append(array_remove(winner_emails, NEW.bidder), NEW.bidder),
          bid_ids = array_append(array_remove(bid_ids, NEW.id), NEW.id),
          updated_at = NOW()
        WHERE id = v_project_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. RECREATE PROJECT RLS POLICIES
-- ==========================================
-- Update project RLS to use the new is_professional_winner function for write operations

-- Drop existing project update policy
DROP POLICY IF EXISTS "Winner can update their projects" ON public.projects;

-- Recreate with is_professional_winner to restrict updates to professionals only
CREATE POLICY "Winner can update their projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  public.is_professional_winner(id)
)
WITH CHECK (
  public.is_professional_winner(id)
);

-- ==========================================
-- 7. UPDATE TASK POLICIES
-- ==========================================
-- Tasks should only be created/updated by professional winners, not suppliers

DROP POLICY IF EXISTS "Winner can create tasks" ON public.tasks;
CREATE POLICY "Winner can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_professional_winner(project_id)
);

DROP POLICY IF EXISTS "Winner can update tasks" ON public.tasks;
CREATE POLICY "Winner can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  public.is_professional_winner(project_id)
)
WITH CHECK (
  public.is_professional_winner(project_id)
);

DROP POLICY IF EXISTS "Winner can delete tasks" ON public.tasks;
CREATE POLICY "Winner can delete tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  public.is_professional_winner(project_id)
);

-- Suppliers can view tasks (through is_project_member) but cannot create/update/delete them
