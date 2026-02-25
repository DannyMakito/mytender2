-- ==============================================================
-- Phase 2 Bid Selection Migration (Multi-bidder Support)
-- ==============================================================
-- Run this script in your Supabase SQL Editor.

-- 1. Add required roles and status to Tenders
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS required_roles TEXT[] DEFAULT '{}';
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- 2. Add role selection to Bids
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS role TEXT;

-- 3. Update Projects to support multiple winners (arrays)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS winner_emails TEXT[] DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS bid_ids UUID[] DEFAULT '{}';

-- 4. Migrate existing project data from singular string/uuid to arrays
UPDATE public.projects 
SET winner_emails = ARRAY[winner_email]
WHERE winner_email IS NOT NULL AND array_length(winner_emails, 1) IS NULL;

UPDATE public.projects 
SET bid_ids = ARRAY[bid_id]
WHERE bid_id IS NOT NULL AND array_length(bid_ids, 1) IS NULL;

-- 5. Drop outdated unique constraints and foreign keys on projects
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_bid_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_tender_id_bid_id_key;
-- We maintain one project per tender_id
ALTER TABLE public.projects ADD CONSTRAINT projects_tender_id_key UNIQUE (tender_id);

-- Drop the view that depends on the columns BEFORE dropping the columns
DROP VIEW IF EXISTS public.project_stats;

-- Drop old singular columns
ALTER TABLE public.projects DROP COLUMN IF EXISTS bid_id;
ALTER TABLE public.projects DROP COLUMN IF EXISTS winner_email;

-- 6. Update helper functions with array logic
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_is_member BOOLEAN;
BEGIN
  v_user_email := auth.jwt() ->> 'email';
  
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
    AND (owner_email = v_user_email OR v_user_email = ANY(winner_emails))
  ) INTO v_is_member;
  
  RETURN COALESCE(v_is_member, false);
END;
$$;

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
    AND v_user_email = ANY(winner_emails)
  ) INTO v_is_winner;
  
  RETURN COALESCE(v_is_winner, false);
END;
$$;

-- 7. Remove automatic rejection of other bids (auto-reject handled manually by client clicking 'Close Tender' now)
DROP TRIGGER IF EXISTS trigger_reject_other_bids_on_approval ON public.bids;
DROP FUNCTION IF EXISTS public.reject_other_bids_on_approval();

-- 8. Phase 2 trigger logic: Add multiple bidders to the SAME project
CREATE OR REPLACE FUNCTION public.create_project_on_bid_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_tender_title TEXT;
  v_tender_owner TEXT;
  v_project_id UUID;
BEGIN
  -- Only proceed if the status is being changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Check if project already exists for this tender
    SELECT id INTO v_project_id FROM public.projects WHERE tender_id = NEW.tender_id;
    
    IF v_project_id IS NULL THEN
      -- Get tender title and owner from the tender
      SELECT t.title, t.posted_by
      INTO v_tender_title, v_tender_owner
      FROM public.tenders t
      WHERE t.id = NEW.tender_id;

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
      WHERE id = v_project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger if it was modified
DROP TRIGGER IF EXISTS trigger_create_project_on_bid_approval ON public.bids;
CREATE TRIGGER trigger_create_project_on_bid_approval
  AFTER UPDATE OF status ON public.bids
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION public.create_project_on_bid_approval();

-- 9. Recreate project_stats view to support arrays
DROP VIEW IF EXISTS public.project_stats;
CREATE OR REPLACE VIEW public.project_stats AS
SELECT 
  p.id,
  p.name,
  p.tender_id,
  p.owner_email,
  p.winner_emails,
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
GROUP BY p.id, p.name, p.tender_id, p.owner_email, p.winner_emails, p.icon, p.created_at, p.updated_at;

GRANT SELECT ON public.project_stats TO authenticated;
