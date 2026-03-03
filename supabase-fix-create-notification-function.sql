-- Comprehensive fix for create_notification function mismatch
-- This removes all problematic triggers/functions that call create_notification incorrectly

-- Step 1: Drop ALL triggers and functions that might be calling create_notification
DROP TRIGGER IF EXISTS trigger_create_notification_on_task ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_task_creation ON public.tasks CASCADE;
DROP FUNCTION IF EXISTS public.create_notification_on_task_insert() CASCADE;
DROP FUNCTION IF EXISTS public.notify_task_creation() CASCADE;

-- Step 2: Drop the old versions of create_notification if they have wrong signatures
DROP FUNCTION IF EXISTS public.create_notification(UUID, notification_type, TEXT, TEXT, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(UUID, notification_type, TEXT, TEXT) CASCADE;

-- Step 3: Ensure the correct version exists with TEXT for user_email
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_email TEXT,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_tender_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_email,
    type,
    title,
    message,
    tender_id,
    project_id
  )
  VALUES (
    p_user_email,
    p_type,
    p_title,
    p_message,
    p_tender_id,
    p_project_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(TEXT, notification_type, TEXT, TEXT, UUID, UUID) TO authenticated;

-- Step 4: Verify no triggers exist on tasks that would call create_notification
-- Note: We intentionally do NOT create any automatic notification triggers on task insert
-- Notifications should only be created through explicit function calls from the application

-- Done! Tasks can now be inserted without triggering notification function calls
