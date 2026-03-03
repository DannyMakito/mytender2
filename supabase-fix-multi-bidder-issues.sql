-- ==============================================================
-- Fix Multi-Bidder Selection Issues
-- ==============================================================
-- Run this script in your Supabase SQL Editor to fix:
-- 1. Project auto-creation trigger
-- 2. Team chat message sending for existing users
-- 3. Notification types enum

-- =============================================
-- FIX 1: Ensure notification enum has all types
-- =============================================

-- Add missing notification types if they don't exist yet
-- (This is idempotent - won't fail if they already exist)
DO $$
BEGIN
  -- Check if NEW_BID exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'NEW_BID' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'NEW_BID';
  END IF;
  
  -- Ensure all other types exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'NEW_TENDER' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'NEW_TENDER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'AWARDED_TENDER' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'AWARDED_TENDER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'REJECTED_BID' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'REJECTED_BID';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'PROJECT_TASK' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'PROJECT_TASK';
  END IF;
END $$;

-- =============================================
-- FIX 2: Ensure project auto-creation trigger exists and is correct
-- =============================================

-- Recreate the trigger function to handle multi-bidder project creation
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

      -- Create new project with first winner
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_create_project_on_bid_approval ON public.bids;
CREATE TRIGGER trigger_create_project_on_bid_approval
  AFTER UPDATE OF status ON public.bids
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION public.create_project_on_bid_approval();

-- =============================================
-- FIX 3: Ensure messages RLS policies are correct for project-based chat
-- =============================================

-- Ensure the is_project_member function works with array-based winner_emails
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

GRANT EXECUTE ON FUNCTION public.is_project_member TO authenticated;

-- Ensure messages table has the correct structure (project_id based, not channel_id)
-- First check if messages table has project_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'project_id'
  ) THEN
    RAISE NOTICE 'WARNING: messages table does not have project_id column. You need to run supabase-setup-teams-v2.sql first!';
  END IF;
END $$;

-- Ensure messages RLS policies exist for project-based messaging
DROP POLICY IF EXISTS "Project members can view messages" ON public.messages;
CREATE POLICY "Project members can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.is_project_member(project_id)
);

DROP POLICY IF EXISTS "Project members can send messages" ON public.messages;
CREATE POLICY "Project members can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_project_member(project_id)
);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  sender_email = (auth.jwt() ->> 'email')
)
WITH CHECK (
  sender_email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  sender_email = (auth.jwt() ->> 'email')
);

-- =============================================
-- FIX 4: Ensure notification INSERT policy exists
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_email IS NOT NULL);

-- =============================================
-- FIX 5: Verify and fix any old projects with missing winner_emails
-- =============================================

-- Check for any projects that might have empty winner_emails but have approved bids
-- This fixes the "existing users who were part of teams" issue
UPDATE public.projects p
SET winner_emails = (
  SELECT array_agg(DISTINCT b.bidder)
  FROM public.bids b
  WHERE b.tender_id = p.tender_id
  AND b.status = 'approved'
),
bid_ids = (
  SELECT array_agg(DISTINCT b.id)
  FROM public.bids b
  WHERE b.tender_id = p.tender_id
  AND b.status = 'approved'
)
WHERE (
  -- Projects with empty or null winner_emails that should have winners
  (p.winner_emails IS NULL OR array_length(p.winner_emails, 1) IS NULL)
  AND EXISTS (
    SELECT 1 FROM public.bids b
    WHERE b.tender_id = p.tender_id
    AND b.status = 'approved'
  )
);

-- =============================================
-- VERIFICATION QUERIES (uncomment to check)
-- =============================================

-- Check trigger exists:
-- SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname = 'trigger_create_project_on_bid_approval';

-- Check notification types:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type');

-- Check projects with winner_emails:
-- SELECT id, name, owner_email, winner_emails FROM public.projects;

-- Check messages RLS policies:
-- SELECT policyname FROM pg_policies WHERE tablename = 'messages';

-- Check notifications RLS policies:
-- SELECT policyname FROM pg_policies WHERE tablename = 'notifications';
