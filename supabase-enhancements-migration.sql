-- SQL migration script for Platform Enhancements
-- This script adds the necessary columns and tables for:
-- 1. Collaborative Drafting (Tender status 'draft', collaborators array)
-- 2. Professional Specialization (Profile specialization)
-- 3. Project Sign-off and Budget (Project locking, budget, milestones, sign-offs)

-- 1. Update profiles table for Specialization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS specialization TEXT;

-- 2. Update tenders table for Drafting and Collaborators
-- status is already text in some places, ensuring it's consistent
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenders' AND column_name='status') THEN
        ALTER TABLE public.tenders ADD COLUMN status TEXT DEFAULT 'open';
    END IF;
END $$;

ALTER TABLE public.tenders 
ADD COLUMN IF NOT EXISTS collaborators TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 3. Update projects table for Locking and Financials
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_budget NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_spend NUMERIC DEFAULT 0;

-- 4. Update tasks table for Milestones and Sign-offs
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_sign_off BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contractor_sign_off BOOLEAN DEFAULT FALSE;

-- 5. Create tender_collaborators table (optional but better for RLS)
-- For now we use the collaborators array in tenders for simplicity, 
-- but we might need a dedicated table if we want complex permissions.
CREATE TABLE IF NOT EXISTS public.tender_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    collaborator_email TEXT NOT NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tender_id, collaborator_email)
);

-- Enable RLS for tender_collaborators
ALTER TABLE public.tender_collaborators ENABLE ROW LEVEL SECURITY;

-- 6. Update Project Stats view to include budget info
DROP VIEW IF EXISTS public.project_stats CASCADE;
CREATE OR REPLACE VIEW public.project_stats AS
SELECT 
  p.id,
  p.name,
  p.tender_id,
  p.owner_email,
  p.winner_emails,
  p.icon,
  p.is_locked,
  p.total_budget,
  p.actual_spend,
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
GROUP BY p.id, p.name, p.tender_id, p.owner_email, p.winner_emails, p.icon, p.is_locked, p.total_budget, p.actual_spend, p.created_at, p.updated_at;

-- Grant permissions
GRANT SELECT ON public.project_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tender_collaborators TO authenticated;

-- 7. Updated Trigger Function to handle Project-Linked Tenders (Suppliers)
CREATE OR REPLACE FUNCTION public.create_project_on_bid_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_tender_title TEXT;
  v_tender_owner TEXT;
  v_parent_project_id UUID;
  v_existing_project_id UUID;
BEGIN
  -- Only proceed if the status is being changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get tender details including potential parent project
    SELECT t.title, t.posted_by, t.project_id
    INTO v_tender_title, v_tender_owner, v_parent_project_id
    FROM public.tenders t
    WHERE t.id = NEW.tender_id;

    -- If this tender is already linked to a project, DO NOT create a new project
    IF v_parent_project_id IS NOT NULL THEN
      -- We just acknowledge the bid approval. 
      -- The parent project already exists.
      RETURN NEW;
    END IF;

    -- Check if project already exists for this tender
    SELECT id INTO v_existing_project_id FROM public.projects WHERE tender_id = NEW.tender_id;
    
    IF v_existing_project_id IS NULL THEN
      -- Create new project aggregating all winners into the array
      INSERT INTO public.projects (
        tender_id,
        name,
        owner_email,
        winner_emails,
        bid_ids,
        icon
      ) VALUES (
        NEW.tender_id,
        COALESCE(v_tender_title, 'Untitled Project'),
        COALESCE(v_tender_owner, ''),
        ARRAY[NEW.bidder],
        ARRAY[NEW.id],
        'FiFolder'
      );
    ELSE
      -- Project exists, append winner email and bid id to the existing arrays uniquely
      UPDATE public.projects 
      SET 
        winner_emails = array_append(array_remove(winner_emails, NEW.bidder), NEW.bidder),
        bid_ids = array_append(array_remove(bid_ids, NEW.id), NEW.id),
        updated_at = NOW()
      WHERE id = v_existing_project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
